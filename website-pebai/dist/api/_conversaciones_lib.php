<?php
/*
 * PEBAI · Conversaciones: todo lo que han enviado los agentes (WhatsApp y email) y lo que han contestado, en un solo sitio.
 *
 * - Cada empresa contactada es una conversación (canal + id del prospecto).
 * - La IA lee las respuestas y las clasifica: contestador automático, interesado, no interesado, pregunta o neutra,
 *   con un resumen de una línea. Se reclasifica sola cuando llega un mensaje nuevo (cron cada 15 min).
 * - Desde aquí se crea el enlace de reserva de un interesado (Clientes de trato directo, leads.tipo = 'cliente').
 * - Cuando le toca contestar a Daniel, la IA deja preparada una respuesta (borrador). Nada sale sin que él la apruebe en el panel:
 *   por WhatsApp va a la cola wa_salida (la envía el bot escribiendo como una persona) y por email sale en el mismo hilo.
 *   Cada respuesta aprobada se guarda con el borrador original (conv_ejemplos) y la IA imita sus correcciones.
 */
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}
require_once __DIR__ . '/_agentes_lib.php';
require_once __DIR__ . '/_ia_lib.php';

const PEBAI_CONV_ESTADOS = ['auto', 'interesado', 'no_interesado', 'pregunta', 'neutral'];

function pebai_conv_db(): PDO
{
    static $ready = false;
    $db = pebai_agentes_db();
    if (!$ready) {
        $db->exec('CREATE TABLE IF NOT EXISTS conversaciones (
            canal TEXT NOT NULL,
            prospecto_id INTEGER NOT NULL,
            clasificacion TEXT NOT NULL DEFAULT "",
            resumen TEXT NOT NULL DEFAULT "",
            manual INTEGER NOT NULL DEFAULT 0,
            ultimo_msg INTEGER NOT NULL DEFAULT 0,
            clasificado_at TEXT NOT NULL DEFAULT "",
            notas TEXT NOT NULL DEFAULT "",
            PRIMARY KEY (canal, prospecto_id)
        )');
        $cols = array_column($db->query('PRAGMA table_info(conversaciones)')->fetchAll(), 'name');
        foreach (['borrador' => 'TEXT NOT NULL DEFAULT ""', 'borrador_para' => 'INTEGER NOT NULL DEFAULT 0', 'borrador_at' => 'TEXT NOT NULL DEFAULT ""'] as $col => $def) {
            if (!in_array($col, $cols, true)) {
                $db->exec("ALTER TABLE conversaciones ADD COLUMN $col $def");
            }
        }
        // Respuestas aprobadas por Daniel: lo que propuso la IA y lo que él envió de verdad (de aquí aprende)
        $db->exec('CREATE TABLE IF NOT EXISTS conv_ejemplos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ts TEXT NOT NULL,
            canal TEXT NOT NULL,
            prospecto_id INTEGER NOT NULL,
            contexto TEXT NOT NULL DEFAULT "",
            borrador TEXT NOT NULL DEFAULT "",
            final TEXT NOT NULL DEFAULT ""
        )');
        // Respuestas de WhatsApp aprobadas que el bot tiene que enviar
        $db->exec('CREATE TABLE IF NOT EXISTS wa_salida (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ts TEXT NOT NULL,
            prospecto_id INTEGER NOT NULL,
            telefono TEXT NOT NULL,
            texto TEXT NOT NULL,
            estado TEXT NOT NULL DEFAULT "pendiente",
            enviado_at TEXT NOT NULL DEFAULT "",
            error TEXT NOT NULL DEFAULT ""
        )');
        $ready = true;
    }
    return $db;
}

/** Mensajes de una conversación, en orden. */
function pebai_conv_mensajes(string $canal, int $id): array
{
    $q = pebai_conv_db()->prepare('SELECT id, ts, sentido, texto FROM agente_mensajes WHERE agente = ? AND prospecto_id = ? ORDER BY ts, id');
    $q->execute([$canal === 'email' ? 'email' : 'whatsapp', $id]);
    return $q->fetchAll();
}

/** La IA clasifica la conversación con lo que ha contestado la empresa. */
function pebai_conv_clasificar_una(string $empresa, array $msgs): ?array
{
    $hilo = '';
    foreach ($msgs as $m) {
        $hilo .= ($m['sentido'] === 'sale' ? 'NOSOTROS (PEBAI): ' : 'EMPRESA: ') . mb_substr(trim((string)$m['texto']), 0, 1200) . "\n---\n";
    }
    $r = pebai_ia_json("Eres el asistente comercial de PEBAI Systems (consultora de procesos e Inteligencia Artificial). Escribimos en frío a la empresa {$empresa} y esta es la conversación.\n"
        . "Clasifica lo que ha contestado la EMPRESA. Responde SOLO JSON {\"estado\": …, \"resumen\": …}.\n"
        . "estado: \"auto\" si todo lo que contesta es un mensaje automático de WhatsApp Business o de correo: bienvenida, ausencia, fuera de horario, «Gracias por comunicarte con X. ¿Cómo podemos ayudarte?», «Gracias por contactar», menús de opciones. Si no hay ninguna frase escrita por una persona que reaccione a nuestro mensaje, es \"auto\"; "
        . "\"interesado\" si muestra interés, pide información, precio, llamada o pregunta qué ofrecemos; "
        . "\"no_interesado\" si dice que no le interesa, que lo dejemos, que no escribamos más o similar; "
        . "\"pregunta\" si una persona contesta con una duda o un dato sin mostrar interés claro (p. ej. quién es, de qué va, o responde a nuestra pregunta); "
        . "\"neutral\" para cualquier otra cosa.\n"
        . "resumen: una frase corta en español (máx. 15 palabras) de lo que ha dicho la empresa, en tercera persona.\n\nCONVERSACIÓN:\n" . $hilo);
    if (!$r || !in_array($r['estado'] ?? '', PEBAI_CONV_ESTADOS, true)) {
        return null;
    }
    return ['estado' => $r['estado'], 'resumen' => mb_substr(trim((string)($r['resumen'] ?? '')), 0, 160)];
}

/** Clasifica las conversaciones con mensajes nuevos de la empresa (lo llama el cron). Las marcadas a mano no se tocan. */
function pebai_conv_clasificar(int $max = 10): int
{
    $db = pebai_conv_db();
    $hechas = 0;
    $rows = $db->query("SELECT agente, prospecto_id, MAX(id) ult FROM agente_mensajes WHERE sentido = 'entra' AND prospecto_id > 0 GROUP BY agente, prospecto_id")->fetchAll();
    foreach ($rows as $r) {
        if ($hechas >= $max) {
            break;
        }
        $canal = $r['agente'] === 'email' ? 'email' : 'whatsapp';
        $q = $db->prepare('SELECT ultimo_msg, manual FROM conversaciones WHERE canal = ? AND prospecto_id = ?');
        $q->execute([$canal, $r['prospecto_id']]);
        $c = $q->fetch();
        if ($c && ((int)$c['manual'] || (int)$c['ultimo_msg'] >= (int)$r['ult'])) {
            continue;
        }
        $t = $canal === 'email' ? 'email_prospectos' : 'prospectos';
        $q = $db->prepare("SELECT empresa FROM $t WHERE id = ?");
        $q->execute([$r['prospecto_id']]);
        $res = pebai_conv_clasificar_una((string)$q->fetchColumn(), pebai_conv_mensajes($canal, (int)$r['prospecto_id']));
        if (!$res) {
            continue;
        }
        $db->prepare('INSERT INTO conversaciones (canal, prospecto_id, clasificacion, resumen, ultimo_msg, clasificado_at) VALUES (?, ?, ?, ?, ?, ?)
                      ON CONFLICT(canal, prospecto_id) DO UPDATE SET clasificacion = excluded.clasificacion, resumen = excluded.resumen, ultimo_msg = excluded.ultimo_msg, clasificado_at = excluded.clasificado_at')
           ->execute([$canal, $r['prospecto_id'], $res['estado'], $res['resumen'], $r['ult'], date('Y-m-d H:i:s')]);
        pebai_actividad($canal === 'email' ? 'email' : 'whatsapp', 'respuesta', 'Respuesta clasificada como «' . $res['estado'] . '»: ' . $res['resumen'], '', ($canal === 'email' ? 'em:' : 'wa:') . $r['prospecto_id']);
        $hechas++;
    }
    return $hechas;
}

/** Busca la solicitud de trato directo (leads.tipo = 'cliente') de una empresa por teléfono o email. */
function pebai_conv_lead(string $telefono, string $email): int
{
    $db = pebai_db();
    $tel = substr(preg_replace('/\D+/', '', $telefono), -9);
    foreach ($db->query("SELECT id, telefono, cliente_email FROM leads") as $l) {
        if (($tel !== '' && strlen($tel) === 9 && substr(preg_replace('/\D+/', '', (string)$l['telefono']), -9) === $tel)
            || ($email !== '' && strcasecmp((string)$l['cliente_email'], $email) === 0)) {
            return (int)$l['id'];
        }
    }
    return 0;
}

/* ------------------------------------------------------------ respuestas --- */

const PEBAI_CONV_ENLACE = '[ENLACE_RESERVA]';

function pebai_conv_prospecto(string $canal, int $id): ?array
{
    $q = pebai_conv_db()->prepare('SELECT * FROM ' . ($canal === 'email' ? 'email_prospectos' : 'prospectos') . ' WHERE id = ?');
    $q->execute([$id]);
    return $q->fetch() ?: null;
}

/** ¿Ha pedido no recibir más mensajes? Entonces no se le contesta nunca. */
function pebai_conv_es_baja(string $canal, array $p): bool
{
    if ($p['estado'] === 'baja') {
        return true;
    }
    $db = pebai_conv_db();
    if ($canal === 'email') {
        $q = $db->prepare('SELECT COUNT(*) FROM bajas_email WHERE email = ?');
        $q->execute([$p['email']]);
    } else {
        $q = $db->prepare('SELECT COUNT(*) FROM bajas WHERE telefono = ?');
        $q->execute([$p['telefono']]);
    }
    return (int)$q->fetchColumn() > 0;
}

/** Ficha de cliente de trato directo (no es una solicitud del formulario): sirve para el enlace de reserva y la cita. */
function pebai_conv_lead_crear(string $canal, array $p): int
{
    $leadId = pebai_conv_lead((string)($p['telefono'] ?? ''), $canal === 'email' ? (string)$p['email'] : '');
    if ($leadId) {
        return $leadId;
    }
    $now = date('Y-m-d H:i:s');
    pebai_db()->prepare("INSERT INTO leads (created_at, estado, notas, empresa, telefono, cliente_email, fuente, medio, updated_at, canal_dueno, canal_auto, canal_motivo, canal_revisar, tipo)
                         VALUES (?, 'contactado', ?, ?, ?, ?, ?, 'salida', ?, 'salida_daniel', 'salida_daniel', ?, '', 'cliente')")
        ->execute([$now, 'Contestó al ' . ($canal === 'email' ? 'email' : 'WhatsApp') . ' en frío.', $p['empresa'] ?: ('#' . $p['id']), (string)($p['telefono'] ?? ''),
                   $canal === 'email' ? (string)$p['email'] : '', $canal, $now, 'Respondió a la captación de salida de Daniel']);
    $leadId = (int)pebai_db()->lastInsertId();
    pebai_evento($leadId, 'contacto', 'Enlace de reserva creado desde Conversaciones', false);
    return $leadId;
}

/** La IA escribe la respuesta que propondría Daniel. Devuelve ['texto' => …] o ['error' => …]. */
function pebai_conv_redactar(string $canal, array $p, array $msgs, string $instruccion = ''): array
{
    $db = pebai_conv_db();
    $hilo = '';
    foreach (array_slice($msgs, -12) as $m) {
        $hilo .= ($m['sentido'] === 'sale' ? 'DANIEL (PEBAI): ' : 'EMPRESA: ') . mb_substr(trim((string)$m['texto']), 0, 1500) . "\n---\n";
    }
    // Aprende de Daniel: lo que corrigió en respuestas anteriores y lo que escribe él a mano
    $ej = '';
    foreach ($db->query('SELECT borrador, final FROM conv_ejemplos ORDER BY id DESC LIMIT 6') as $e) {
        $ej .= $e['borrador'] === $e['final'] || $e['borrador'] === ''
            ? "Respuesta que Daniel aprobó tal cual:\n{$e['final']}\n---\n"
            : "La IA propuso:\n{$e['borrador']}\nDaniel lo cambió y envió:\n{$e['final']}\n---\n";
    }
    foreach ($db->query("SELECT texto FROM agente_mensajes WHERE sentido = 'sale' AND plantilla = 'manual' AND LENGTH(texto) > 60 ORDER BY id DESC LIMIT 4") as $e) {
        $ej .= "Mensaje que escribió Daniel él mismo:\n{$e['texto']}\n---\n";
    }
    $email = $canal === 'email';
    $prompt = "Eres Daniel, de PEBAI Systems, una consultora de procesos e Inteligencia Artificial. Escribimos en frío a {$p['empresa']}"
        . ($p['ciudad'] ? " ({$p['ciudad']})" : '') . ", una empresa instaladora de placas solares, y nos han contestado. Escribe la siguiente respuesta de Daniel por "
        . ($email ? 'email' : 'WhatsApp') . ".\n\n"
        . "QUÉ OFRECEMOS: un asistente de IA hecho a medida con toda la información de su empresa, que contesta al momento y como ellos a quien les escribe "
        . "(también fuera de horario y en fin de semana), resuelve dudas, cualifica a los interesados y les agenda la visita. También quitamos tareas manuales "
        . "repetitivas y lo conectamos con los programas que ya usan. Sus dolores típicos: mensajes que se quedan sin contestar fuera de horario, clientes que se van "
        . "a la competencia por tardar, y horas del equipo contestando lo mismo a mano.\n"
        . "OBJETIVO: que reserven una videollamada de 25 minutos con un experto (les atenderán Adrián o Dani) donde vemos su caso y salen con un mapa técnico de lo "
        . "que se puede automatizar y una estimación del ahorro. Es gratuita solo para 5 empresas al mes (por tiempo limitado) y este mes quedan plazas. "
        . "Cuando tenga sentido proponer la llamada, pon exactamente " . PEBAI_CONV_ENLACE . " donde va el enlace para reservar (se cambia solo por el enlace real).\n\n"
        . "REGLAS:\n- Tutea, tono cercano y profesional, español de España. Ve al grano: "
        . ($email ? 'máximo 110 palabras, sin firma (se añade sola), sin asunto.' : 'máximo 70 palabras, como un WhatsApp de verdad, sin saludo largo ni firma.') . "\n"
        . "- Contesta primero a lo que han dicho o preguntado; después dolor + beneficio en una o dos frases y la invitación a la llamada.\n"
        . "- Nunca des precios, cifras de ahorro, porcentajes ni plazos. Si preguntan precio: depende de su caso y se ve en la llamada.\n"
        . "- No inventes clientes, casos de éxito ni datos de su empresa. No hables de su web ni vendas webs. Nada de leyes, IRPF ni subvenciones.\n"
        . "- Si ya tienen algo parecido o dudan, no insistas de más: una pregunta corta para entender su caso.\n"
        . "- Si dices que es gratis, di siempre en la misma frase que es solo para 5 empresas al mes (nunca «gratis» a secas).\n"
        . "- No propongas días ni horas concretas: eligen ellos el hueco en el enlace.\n"
        . "- Si ya les mandamos el enlace en la conversación, no lo repitas salvo que lo pidan.\n"
        . ($instruccion !== '' ? "- INDICACIÓN DE DANIEL PARA ESTA RESPUESTA (manda sobre lo demás): {$instruccion}\n" : '')
        . ($ej !== '' ? "\nASÍ ESCRIBE DANIEL (imita su estilo y sus correcciones):\n{$ej}" : '')
        . "\nCONVERSACIÓN HASTA AHORA:\n{$hilo}\nResponde SOLO JSON {\"respuesta\": \"texto del mensaje\"}.";
    for ($i = 0; $i < 2; $i++) {
        $r = pebai_ia_json($prompt);
        $t = trim(str_replace("\r", '', (string)($r['respuesta'] ?? '')));
        $n = count(preg_split('/\s+/u', $t, -1, PREG_SPLIT_NO_EMPTY));
        if ($t !== '' && $n <= ($email ? 150 : 100) && !preg_match('/https?:|www\.|€|\d+ ?%|\birpf\b|subvenci/iu', $t)) {
            return ['texto' => $t];
        }
    }
    return ['error' => 'La IA no ha dado una respuesta válida. Prueba otra vez o escríbela tú.'];
}

/** Prepara (o rehace) el borrador de una conversación y lo guarda. */
function pebai_conv_borrador(string $canal, int $id, string $instruccion = ''): array
{
    $p = pebai_conv_prospecto($canal, $id);
    if (!$p) {
        return ['error' => 'No existe esa conversación.'];
    }
    if (pebai_conv_es_baja($canal, $p)) {
        return ['error' => 'Pidió no recibir más mensajes: no se le contesta.'];
    }
    $msgs = pebai_conv_mensajes($canal, $id);
    $r = pebai_conv_redactar($canal, $p, $msgs, mb_substr(trim($instruccion), 0, 400));
    if (isset($r['texto'])) {
        pebai_conv_db()->prepare('INSERT INTO conversaciones (canal, prospecto_id, borrador, borrador_para, borrador_at) VALUES (?, ?, ?, ?, ?)
                                  ON CONFLICT(canal, prospecto_id) DO UPDATE SET borrador = excluded.borrador, borrador_para = excluded.borrador_para, borrador_at = excluded.borrador_at')
            ->execute([$canal, $id, $r['texto'], $msgs ? (int)end($msgs)['id'] : 0, date('Y-m-d H:i:s')]);
    }
    return $r;
}

/** Cron: deja preparada la respuesta de las conversaciones en las que le toca contestar a Daniel. */
function pebai_conv_borradores(int $max = 3): int
{
    $db = pebai_conv_db();
    $hechos = 0;
    $rows = $db->query("SELECT m.agente, m.prospecto_id, m.id FROM agente_mensajes m
                        JOIN (SELECT agente, prospecto_id, MAX(id) ult FROM agente_mensajes WHERE prospecto_id > 0 GROUP BY agente, prospecto_id) u ON u.ult = m.id
                        WHERE m.sentido = 'entra' ORDER BY m.id DESC")->fetchAll();
    foreach ($rows as $r) {
        if ($hechos >= $max) {
            break;
        }
        $canal = $r['agente'] === 'email' ? 'email' : 'whatsapp';
        $q = $db->prepare('SELECT clasificacion, borrador_para FROM conversaciones WHERE canal = ? AND prospecto_id = ?');
        $q->execute([$canal, $r['prospecto_id']]);
        $c = $q->fetch();
        // Primero la clasifica la IA; a contestadores automáticos y a quien no quiere no se les contesta
        if (!$c || in_array($c['clasificacion'], ['', 'auto', 'no_interesado'], true) || (int)$c['borrador_para'] >= (int)$r['id']) {
            continue;
        }
        $p = pebai_conv_prospecto($canal, (int)$r['prospecto_id']);
        if (!$p || pebai_conv_es_baja($canal, $p)) {
            continue;
        }
        $res = pebai_conv_borrador($canal, (int)$r['prospecto_id']);
        if (isset($res['texto'])) {
            pebai_actividad($canal, 'respuesta', 'Respuesta preparada para ' . ($p['empresa'] ?: '#' . $p['id']) . ': espera tu aprobación en Conversaciones', $res['texto'], ($canal === 'email' ? 'em:' : 'wa:') . $p['id']);
        }
        $hechos++;
    }
    return $hechos;
}

/** Envía la respuesta aprobada por Daniel. WhatsApp: a la cola del bot. Email: sale ahora, en el mismo hilo. */
function pebai_conv_enviar(string $canal, int $id, string $texto): array
{
    $db = pebai_conv_db();
    $p = pebai_conv_prospecto($canal, $id);
    $texto = trim(str_replace("\r", '', $texto));
    if (!$p) {
        return ['error' => 'No existe esa conversación.'];
    }
    if ($texto === '' || mb_strlen($texto) > 3000) {
        return ['error' => 'El mensaje está vacío o es demasiado largo.'];
    }
    if (pebai_conv_es_baja($canal, $p)) {
        return ['error' => 'Pidió no recibir más mensajes: no se le puede escribir.'];
    }
    $q = $db->prepare('SELECT borrador FROM conversaciones WHERE canal = ? AND prospecto_id = ?');
    $q->execute([$canal, $id]);
    $borrador = (string)$q->fetchColumn();
    $final = str_contains($texto, PEBAI_CONV_ENLACE) ? str_replace(PEBAI_CONV_ENLACE, pebai_booking_url(pebai_conv_lead_crear($canal, $p)), $texto) : $texto;
    $now = date('Y-m-d H:i:s');
    $quien = $p['empresa'] ?: ('#' . $id);
    if ($canal === 'email') {
        require_once __DIR__ . '/_email_lib.php';
        $b = pebai_email_buzon();
        if (!$b) {
            return ['error' => 'El buzón de captación no está configurado.'];
        }
        $asunto = (string)($p['asunto'] ?: 'PEBAI Systems');
        $asunto = preg_match('/^re:/i', $asunto) ? $asunto : 'Re: ' . $asunto;
        if ($p['token'] === '') {
            $p['token'] = bin2hex(random_bytes(16));
            $db->prepare('UPDATE email_prospectos SET token = ? WHERE id = ?')->execute([$p['token'], $id]);
        }
        $cuerpo = pebai_email_firmar($final);
        try {
            pebai_email_smtp($b, $p['email'], $asunto, $cuerpo, $p['token'], (string)$p['msgid']);
        } catch (Throwable $e) {
            pebai_actividad('email', 'error', 'No se pudo enviar la respuesta a ' . $quien, $e->getMessage(), 'em:' . $id);
            return ['error' => 'El correo no ha salido: ' . $e->getMessage()];
        }
        $db->prepare("INSERT INTO agente_mensajes (ts, agente, prospecto_id, telefono, sentido, texto, plantilla) VALUES (?, 'email', ?, ?, 'sale', ?, 'respuesta')")
           ->execute([$now, $id, $p['email'], 'Asunto: ' . $asunto . "\n\n" . $cuerpo]);
        pebai_actividad('email', 'envio', 'Respuesta aprobada enviada a ' . $quien, $cuerpo, 'em:' . $id);
    } else {
        $db->prepare('INSERT INTO wa_salida (ts, prospecto_id, telefono, texto) VALUES (?, ?, ?, ?)')->execute([$now, $id, $p['telefono'], $final]);
        pebai_actividad('whatsapp', 'envio', 'Respuesta aprobada para ' . $quien . ': el agente la envía en un momento', $final, 'wa:' . $id);
    }
    $msgs = pebai_conv_mensajes($canal, $id);
    $ctx = '';
    foreach (array_slice($msgs, -4) as $m) {
        $ctx .= ($m['sentido'] === 'sale' ? 'DANIEL: ' : 'EMPRESA: ') . mb_substr((string)$m['texto'], 0, 600) . "\n";
    }
    $db->prepare('INSERT INTO conv_ejemplos (ts, canal, prospecto_id, contexto, borrador, final) VALUES (?, ?, ?, ?, ?, ?)')->execute([$now, $canal, $id, $ctx, $borrador, $texto]);
    $db->prepare("UPDATE conversaciones SET borrador = '', borrador_para = ? WHERE canal = ? AND prospecto_id = ?")->execute([$msgs ? (int)end($msgs)['id'] : 0, $canal, $id]);
    return ['ok' => true, 'cola' => $canal === 'whatsapp'];
}

/** Todas las conversaciones para el panel: una fila por empresa contactada, con su hilo completo. */
function pebai_conv_datos(): array
{
    $db = pebai_conv_db();
    $cls = [];
    foreach ($db->query('SELECT * FROM conversaciones') as $c) {
        $cls[$c['canal'] . ':' . $c['prospecto_id']] = $c;
    }
    $msgs = [];
    foreach ($db->query("SELECT id, ts, agente, prospecto_id, sentido, texto, plantilla FROM agente_mensajes WHERE prospecto_id > 0 ORDER BY ts, id") as $m) {
        $msgs[($m['agente'] === 'email' ? 'email' : 'whatsapp') . ':' . $m['prospecto_id']][] = ['ts' => $m['ts'], 'de' => $m['sentido'], 'texto' => $m['texto'], 'manual' => $m['plantilla'] === 'manual' ? 1 : 0, 'respuesta' => $m['plantilla'] === 'respuesta' ? 1 : 0];
    }
    $cola = [];
    foreach ($db->query("SELECT prospecto_id, texto, estado, error FROM wa_salida WHERE estado <> 'enviado' ORDER BY id") as $w) {
        $cola['whatsapp:' . $w['prospecto_id']][] = ['texto' => $w['texto'], 'estado' => $w['estado'], 'error' => $w['error']];
    }
    $leads = [];
    foreach (pebai_db()->query("SELECT id, telefono, cliente_email, cita_inicio, cita_estado, estado, tipo FROM leads") as $l) {
        $leads[] = $l;
    }
    $buscaLead = static function (string $tel, string $email) use ($leads): ?array {
        $t = substr(preg_replace('/\D+/', '', $tel), -9);
        foreach ($leads as $l) {
            if ((strlen($t) === 9 && substr(preg_replace('/\D+/', '', (string)$l['telefono']), -9) === $t) || ($email !== '' && strcasecmp((string)$l['cliente_email'], $email) === 0)) {
                return $l;
            }
        }
        return null;
    };
    $filas = [];
    $fuentes = [
        ['whatsapp', "SELECT id, empresa, ciudad, web, telefono AS contacto, telefono, '' AS email, estado, enviado_at, respondido_at FROM prospectos WHERE enviado_at <> '' AND error NOT LIKE '[prueba]%'"],
        ['email', "SELECT id, empresa, ciudad, web, email AS contacto, telefono, email, estado, enviado1_at AS enviado_at, respondido_at FROM email_prospectos WHERE enviado1_at <> ''"],
    ];
    foreach ($fuentes as [$canal, $sql]) {
        foreach ($db->query($sql) as $p) {
            $k = $canal . ':' . $p['id'];
            $hilo = $msgs[$k] ?? [];
            $entra = array_values(array_filter($hilo, static fn($m) => $m['de'] === 'entra'));
            $c = $cls[$k] ?? null;
            $lead = $buscaLead((string)$p['telefono'], (string)$p['email']);
            // Estado que ve Daniel: la cita manda; luego la baja; luego lo que diga la IA (o él a mano)
            if ($lead && $lead['cita_inicio'] && $lead['cita_estado'] !== 'cancelada') {
                $estado = 'cita';
            } elseif ($p['estado'] === 'baja') {
                $estado = 'no_interesado';
            } elseif (!$entra) {
                $estado = 'sin_respuesta';
            } elseif ($c && $c['clasificacion'] !== '') {
                $estado = $c['clasificacion'] === 'neutral' ? 'pregunta' : $c['clasificacion'];
            } else {
                $estado = 'pendiente_ia';
            }
            $filas[] = [
                'k' => $k, 'canal' => $canal, 'id' => (int)$p['id'], 'empresa' => (string)$p['empresa'], 'ciudad' => (string)$p['ciudad'], 'web' => (string)$p['web'],
                'contacto' => (string)$p['contacto'], 'enviado_at' => (string)$p['enviado_at'], 'ultimo_at' => $hilo ? end($hilo)['ts'] : (string)$p['enviado_at'],
                'respuestas' => count($entra), 'estado' => $estado, 'manual' => $c ? (int)$c['manual'] : 0, 'resumen' => $c['resumen'] ?? '', 'notas' => $c['notas'] ?? '',
                'lead_id' => $lead ? (int)$lead['id'] : 0, 'reserva' => $lead ? pebai_booking_url((int)$lead['id']) : '', 'cita' => $lead ? (string)$lead['cita_inicio'] : '',
                'foto' => $canal === 'whatsapp' && is_file(pebai_private_dir() . '/fotos/' . preg_replace('/\D/', '', (string)$p['telefono']) . '.jpg') ? preg_replace('/\D/', '', (string)$p['telefono']) : '',
                'mensajes' => $hilo, 'cola' => $cola[$k] ?? [], 'borrador' => $c['borrador'] ?? '',
                // Le toca contestar a Daniel: lo último lo escribió la empresa y no es un contestador ni alguien que no quiere
                'te_toca' => $hilo && end($hilo)['de'] === 'entra' && empty($cola[$k]) && !in_array($estado, ['no_interesado', 'auto', 'cita', 'pendiente_ia'], true) ? 1 : 0,
            ];
        }
    }
    usort($filas, static fn($a, $b) => strcmp($b['ultimo_at'], $a['ultimo_at']));
    return $filas;
}
