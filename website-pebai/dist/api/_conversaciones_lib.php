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
        foreach (['borrador' => 'TEXT NOT NULL DEFAULT ""', 'borrador_para' => 'INTEGER NOT NULL DEFAULT 0', 'borrador_at' => 'TEXT NOT NULL DEFAULT ""', 'contestado_hasta' => 'INTEGER NOT NULL DEFAULT 0'] as $col => $def) {
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
        $colsW = array_column($db->query('PRAGMA table_info(wa_salida)')->fetchAll(), 'name');
        foreach (['no_antes' => 'TEXT NOT NULL DEFAULT ""', 'plantilla' => 'TEXT NOT NULL DEFAULT "respuesta"'] as $col => $def) {
            if (!in_array($col, $colsW, true)) {
                $db->exec("ALTER TABLE wa_salida ADD COLUMN $col $def");
            }
        }
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
        . "estado: \"auto\" si todo lo que contesta es un mensaje automático de WhatsApp Business o de correo: bienvenida, ausencia, fuera de horario, «Gracias por comunicarte con X. ¿Cómo podemos ayudarte?», «Gracias por contactar», menús de opciones. Si no hay ninguna frase escrita por una persona que reaccione a nuestro mensaje, es \"auto\". Si hay un contestador y DESPUÉS una persona escribe, manda lo que dice la persona (nunca \"auto\"); "
        . "\"interesado\" si muestra interés, pide información, precio, llamada o pregunta qué ofrecemos, o si acepta lo último que le propusimos (la consultoría, el vídeo, la llamada: «vale», «sí», «ok», «adelante», «cuando quieras»); "
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

/**
 * Contestador automático (orden de Daniel, 21/10): si salta justo después de nuestro primer mensaje, el agente espera 3-5 minutos,
 * como haría una persona, y contesta solo con una frase muy breve (el mensaje ya lo tienen arriba y lo verán cuando estén activos).
 * Una sola vez, solo por WhatsApp y solo si es la respuesta a nuestro primer mensaje (en las 3 horas siguientes).
 */
const PEBAI_CORTESIA = [
    '¡Gracias! Os lo dejo aquí arriba para cuando lo veáis.',
    'Perfecto, gracias. Cuando tengáis un momento lo veis arriba.',
    'Gracias, sin prisa. Lo tenéis justo arriba cuando podáis.',
    '¡Genial, gracias! Cuando lo leáis me decís.',
    'Gracias. Lo dejo por aquí para cuando estéis.',
];

function pebai_conv_cortesia(string $canal, array $p, array $msgs): void
{
    $salen = array_values(array_filter($msgs, static fn($m) => $m['sentido'] === 'sale'));
    // El contestador suele saltar antes de que el agente apunte el envío: entonces aún no hay «sale» y vale la hora en que empezó a escribir
    $env = (string)(($p['enviado_at'] ?? '') ?: ($p['enviando_at'] ?? ''));
    // Todo lo que han escrito tiene que sonar a contestador (si ya ha escrito una persona, no se manda la cortesía)
    $entran = array_filter($msgs, static fn($m) => $m['sentido'] === 'entra');
    $soloContestador = $entran && !array_filter($entran, static fn($m) => !pebai_es_contestador((string)$m['texto']));
    if ($canal !== 'whatsapp' || !$soloContestador || count($salen) > 1 || $env === '' || strtotime($env) < time() - 3 * 3600 || pebai_conv_es_baja($canal, $p)) {
        return;
    }
    $db = pebai_conv_db();
    $q = $db->prepare('SELECT COUNT(*) FROM wa_salida WHERE prospecto_id = ?');
    $q->execute([$p['id']]);
    if ((int)$q->fetchColumn()) {
        return;
    }
    $texto = PEBAI_CORTESIA[array_rand(PEBAI_CORTESIA)];
    $cuando = date('Y-m-d H:i:s', time() + random_int(180, 300));
    $db->prepare("INSERT INTO wa_salida (ts, prospecto_id, telefono, texto, no_antes, plantilla) VALUES (?, ?, ?, ?, ?, 'cortesia')")
       ->execute([date('Y-m-d H:i:s'), $p['id'], $p['telefono'], $texto, $cuando]);
    pebai_actividad('whatsapp', 'respuesta', 'Contestador de ' . ($p['empresa'] ?: $p['telefono']) . ': le contesta en unos minutos con «' . $texto . '»', '', 'wa:' . $p['id']);
}

/** Clasifica una conversación ya (al llegar una respuesta) y, si toca contestar, prepara el borrador. */
function pebai_conv_al_momento(string $canal, int $id): void
{
    $db = pebai_conv_db();
    $q = $db->prepare('SELECT manual FROM conversaciones WHERE canal = ? AND prospecto_id = ?');
    $q->execute([$canal, $id]);
    $msgs = pebai_conv_mensajes($canal, $id);
    $ult = 0;
    foreach ($msgs as $m) {
        if ($m['sentido'] === 'entra') {
            $ult = max($ult, (int)$m['id']);
        }
    }
    $p = pebai_conv_prospecto($canal, $id);
    if (!$p || !$ult || (int)$q->fetchColumn()) {
        return;
    }
    $res = pebai_conv_clasificar_una((string)$p['empresa'], $msgs);
    if (!$res) {
        return;   // la IA no ha contestado: lo hará el cron en unos minutos
    }
    $db->prepare('INSERT INTO conversaciones (canal, prospecto_id, clasificacion, resumen, ultimo_msg, clasificado_at) VALUES (?, ?, ?, ?, ?, ?)
                  ON CONFLICT(canal, prospecto_id) DO UPDATE SET clasificacion = excluded.clasificacion, resumen = excluded.resumen, ultimo_msg = excluded.ultimo_msg, clasificado_at = excluded.clasificado_at')
       ->execute([$canal, $id, $res['estado'], $res['resumen'], $ult, date('Y-m-d H:i:s')]);
    if ($res['estado'] === 'auto') {
        pebai_conv_cortesia($canal, $p, $msgs);
        return;
    }
    if (!in_array($res['estado'], ['auto', 'no_interesado'], true) && !pebai_conv_es_baja($canal, $p) && end($msgs)['sentido'] === 'entra') {
        $b = pebai_conv_borrador($canal, $id);
        if (isset($b['texto'])) {
            pebai_actividad($canal, 'respuesta', 'Respuesta preparada para ' . ($p['empresa'] ?: '#' . $id) . ': espera tu aprobación en Conversaciones', $b['texto'], ($canal === 'email' ? 'em:' : 'wa:') . $id);
        }
    }
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

/**
 * Contestadores automáticos (orden de Daniel, 21/10): a quien solo respondió con un mensaje automático se le prepara UN único
 * mensaje corto, a partir del día siguiente al primero, que Daniel aprueba uno a uno. Si tampoco contesta, no se le vuelve a escribir.
 */
function pebai_conv_toca_contestador(string $clasificacion, array $msgs, string $enviadoAt): bool
{
    $salen = count(array_filter($msgs, static fn($m) => ($m['sentido'] ?? $m['de'] ?? '') === 'sale'));
    return false;   // 21/10: sustituido por la respuesta automática a los 3-5 minutos (pebai_conv_cortesia)
}

const PEBAI_CONV_ENLACE = '[ENLACE_RESERVA]';
// Primer paso del embudo (orden de Daniel, 22/10): antes de la llamada, que nos conozcan con el vídeo de la consultoría
const PEBAI_CONV_VIDEO = '[ENLACE_VIDEO]';
const PEBAI_CONV_VIDEO_URL = 'https://pebaisystems.es/consultoria-gratuita/?origen=daniel';
// Cuando acepta la consultoría (orden de Daniel, 22/10): primero el formulario de diagnóstico; lo revisamos y después va el enlace de reserva
const PEBAI_CONV_FORM = '[ENLACE_FORMULARIO]';
const PEBAI_CONV_FORM_URL = 'https://pebaisystems.es/diagnostico/?origen=daniel';

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
    $q = $db->prepare('SELECT clasificacion FROM conversaciones WHERE canal = ? AND prospecto_id = ?');
    $q->execute([$canal, (int)$p['id']]);
    $clasif = (string)$q->fetchColumn();
    $interes = $clasif === 'interesado';
    $auto = $clasif === 'auto';
    $enlaceDado = str_contains($hilo, '/reservar/?s=');
    // ¿Ya le ofrecimos el vídeo o la web? (solo cuenta lo que escribimos nosotros)
    $nuestros = implode("\n", array_map(static fn($m) => (string)$m['texto'], array_filter($msgs, static fn($m) => $m['sentido'] === 'sale')));
    $videoOfrecido = (bool)preg_match('/v[ií]deo|nuestra web|nuestras redes/iu', $nuestros);
    $videoDado = str_contains($nuestros, 'consultoria-gratuita');
    $formDado = str_contains($nuestros, '/diagnostico/');
    // ¿Ya rellenó el formulario? (hay una solicitud suya de verdad, no una ficha de trato directo)
    $leadId = pebai_conv_lead((string)($p['telefono'] ?? ''), $canal === 'email' ? (string)($p['email'] ?? '') : '');
    $formHecho = false;
    if ($leadId) {
        $q2 = pebai_db()->prepare("SELECT tipo FROM leads WHERE id = ?");
        $q2->execute([$leadId]);
        $formHecho = (string)$q2->fetchColumn() !== 'cliente';
    }
    // Por pasos (orden de Daniel, 21/10): 1) ver si le interesa, sin llamada ni enlace; 2) si muestra interés, proponer la llamada
    // y preguntar si quiere el enlace; 3) el enlace solo cuando lo acepta o lo pide
    $etapa = $auto
        ? 'Solo nos ha contestado su CONTESTADOR AUTOMÁTICO: ninguna persona ha leído nuestro mensaje. Este es el ÚNICO mensaje que le mandamos después, '
          . 'así que tiene que ser muy corto (máximo 30 palabras), amable y natural, como si lo escribiera Daniel desde el móvil al día siguiente. '
          . 'Sin repetir el primer mensaje: una frase que diga a qué se dedica PEBAI con ellos (que nadie que les pida presupuesto se quede sin respuesta) '
          . 'y UNA pregunta muy fácil de contestar (p. ej. quién lleva los mensajes de presupuesto o si les vendría bien). '
          . 'Nadie lo ha leído aún: NO digas «perdona», «no me expliqué bien» ni nada que suene a corregirles, y no menciones el contestador automático. '
          . 'Empieza de forma natural y distinta cada vez (p. ej. «Buenos días», «Hola de nuevo», «Hola, ¿qué tal?») y, si quieres, nombra su empresa o su ciudad, pero no supongas nada que no sepas (que tienen mucho trabajo, lío, faena…). '
          . 'PROHIBIDO: llamada, reunión, enlaces, plazas, «gratis», cualquier oferta.'
        : ($enlaceDado
        ? 'Ya tiene el enlace para reservar. Resuelve lo que pregunte y, si hace falta, recuérdale con suavidad que puede elegir hora cuando quiera. No repitas el enlace salvo que lo pida (entonces pon ' . PEBAI_CONV_ENLACE . ').'
        : ($interes
            ? ($formHecho
                ? 'Ya ha rellenado el formulario de diagnóstico. Dale las gracias en una frase y pásale el enlace para elegir hora de la consultoría (25 minutos con un experto), poniendo exactamente '
                  . PEBAI_CONV_ENLACE . '.'
                : ($formDado
                    ? 'Ya le pasamos el formulario. Si pregunta algo, contéstale breve; si no lo ha rellenado aún, recuérdale con naturalidad que en cuanto lo tengamos le pasamos la hora. No pongas el enlace de reserva.'
                    : 'Ha mostrado interés o ha dicho que sí a la consultoría. Siguiente paso: el formulario de diagnóstico. Dile que para prepararla bien rellene este formulario cortito '
                      . '(poniendo exactamente ' . PEBAI_CONV_FORM . '), que lo revisamos y le pasamos el enlace para elegir hora. Si antes pregunta algo, contéstale breve. '
                      . 'NUNCA pongas el enlace de reserva en este paso.'))
            : ($videoOfrecido && !$videoDado
                ? 'Ya le ofrecimos un vídeo o nuestra web para conocernos. Si en su último mensaje dice que sí o que vale, contesta muy breve y pásale el vídeo poniendo exactamente '
                  . PEBAI_CONV_VIDEO . ' (se cambia solo por el enlace), con una frase de qué va a ver. Si pregunta otra cosa, contéstale y vuelve a ofrecerle el vídeo. Nada de llamada todavía.'
                : 'Aún NO ha mostrado interés. Preséntanos en una frase como una consultora de IA, con el ejemplo del asistente hecho a medida con toda la información de su empresa, '
                  . 'que contesta como ellos, filtra curiosos y agenda visitas. Cierra ofreciendo la consultoría: este mes hacemos 5 consultorías sin coste (normalmente se cobran); '
                  . 'pregúntale si le agendas una con uno de nuestros expertos para ver si de verdad les ahorraría tiempo y dinero. '
                  . 'No pongas aún ningún enlace (va cuando diga que sí). Si duda o pide saber más antes, ofrécele un vídeo cortito o nuestra web.')));
    $prompt = "Eres Daniel, de PEBAI Systems, una consultora de procesos e Inteligencia Artificial. Escribimos en frío a {$p['empresa']}"
        . ($p['ciudad'] ? " ({$p['ciudad']})" : '') . ", una empresa instaladora de placas solares, y nos han contestado. Escribe la siguiente respuesta de Daniel por "
        . ($email ? 'email' : 'WhatsApp') . ".\n\n"
        . "QUÉ OFRECEMOS: un asistente de IA hecho a medida con toda la información de su empresa, que contesta al momento y como ellos a quien les escribe "
        . "(también fuera de horario y en fin de semana), resuelve dudas, cualifica a los interesados y les agenda la visita. También quitamos tareas manuales "
        . "repetitivas y lo conectamos con los programas que ya usan. Sus dolores típicos: mensajes que se quedan sin contestar fuera de horario, clientes que se van "
        . "a la competencia por tardar, y horas del equipo contestando lo mismo a mano.\n"
        . "CÓMO VAMOS (orden de Daniel, 21/10: con calma, sin prisa por vender): " . $etapa . "\n\n"
        . "REGLAS:\n- Tutea, tono cercano, amable y profesional, español de España. Breve: "
        . ($email ? 'máximo 90 palabras, sin firma (se añade sola), sin asunto.' : 'máximo 60 palabras en total, como un WhatsApp de verdad, sin saludo largo ni firma. '
            . 'Escríbelo en 2 o 3 mensajes cortos separados por una línea en blanco (cada bloque sale como un WhatsApp aparte, como escribe todo el mundo).') . "\n"
        . "- Contesta primero a lo que han dicho o preguntado, con naturalidad.\n"
        . "- TRATO HUMANO (orden de Daniel, 22/10): que no parezca escrito por una IA. Como escribe una persona por WhatsApp: frases cortas, "
        . "dos o tres párrafos de una o dos líneas, como mucho un emoji, nada de listas ni de palabras de manual. "
        . "Prohibido: halagos vacíos («es un puntazo», «genial que…», «me alegra que…»), «no tocaba», «se me coló», «disculpa las molestias», «estaré encantado».\n"
        . "- Si dicen que ya lo tienen cubierto (alguien al teléfono, contestan rápido…), no les des la razón ni les discutas: explica que el asistente "
        . "tiene TODA la información de su empresa y contesta como lo haría esa persona, que no es el típico chatbot, y que le quita lo repetitivo.\n"
        . "- Cuando expliques lo que hacemos, di siempre que el asistente tiene toda la información de su empresa y contesta como ellos (no un chatbot cualquiera).\n"
        . "- Si no han entendido nuestro mensaje o creen que les pedimos presupuesto, acláralo con suavidad y sin corregirles (nada de «nada de…» ni «soy yo quien…»): "
        . "p. ej. «Perdona, no me expliqué bien: …» y en una frase sencilla qué hacemos por ellos.\n"
        . "- Nunca des precios, cifras de ahorro, porcentajes ni plazos. Si preguntan precio: depende de su caso.\n"
        . "- No inventes clientes, casos de éxito ni datos de su empresa. No hables de su web ni vendas webs. Nada de leyes, IRPF ni subvenciones.\n"
        . "- Si ya tienen algo parecido o dudan, no insistas: una pregunta corta para entender su caso.\n"
        . "- Si dices que la llamada es gratis, di siempre en la misma frase que es solo para 5 empresas al mes (nunca «gratis» a secas).\n"
        . "- No propongas días ni horas concretas: si llega el momento, eligen ellos el hueco en el enlace.\n"
        . ($instruccion !== '' ? "- INDICACIÓN DE DANIEL PARA ESTA RESPUESTA (manda sobre lo demás): {$instruccion}\n" : '')
        . ($ej !== '' && !$auto ? "\nASÍ ESCRIBE DANIEL (imita su estilo y sus correcciones):\n{$ej}" : '')
        . "\nCONVERSACIÓN HASTA AHORA:\n{$hilo}\nResponde SOLO JSON {\"respuesta\": \"texto del mensaje\"}.";
    for ($i = 0; $i < 3; $i++) {
        $r = pebai_ia_json($prompt);
        $t = trim(str_replace("\r", '', (string)($r['respuesta'] ?? '')));
        $n = count(preg_split('/\s+/u', $t, -1, PREG_SPLIT_NO_EMPTY));
        $prisa = ($auto && preg_match('/perdon|no me expliqu/iu', $t)) || (str_contains($t, PEBAI_CONV_ENLACE) && !$formHecho) || (!$interes && !$enlaceDado && str_contains($t, PEBAI_CONV_ENLACE))
            || (preg_match('/gratis|gratuit|sin coste|coste cero/iu', $t) && !preg_match('/\b5\b|cinco/iu', $t))
            || (str_contains($t, PEBAI_CONV_VIDEO) && !$videoOfrecido) || preg_match('/factura de la luz/iu', $t);
        if ($t !== '' && !$prisa && $n <= ($auto ? ($email ? 60 : 40) : ($email ? 130 : 85)) && !preg_match('/https?:|www\.|€|\d+ ?%|\birpf\b|subvenci/iu', $t)) {
            // Segundo mensaje a quien aún no ha leído nada: vuelve a ofrecer no escribir más (regla legal)
            if ($auto && !preg_match('/no (os |te )?(escribo|vuelvo|molesto)|no os escribir|digáis|dímelo|me lo dices/iu', $t)) {
                $t .= $email ? "\n\nSi no os interesa, me lo decís y no vuelvo a escribiros." : ' Si no os interesa, me lo decís y no os escribo más.';
            }
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
    // (Los contestadores ya no esperan al día siguiente: se contestan solos al momento, ver pebai_conv_cortesia)
    foreach ([] as $c) {
        if ($hechos >= $max) {
            break;
        }
        $p = pebai_conv_prospecto($c['canal'], (int)$c['prospecto_id']);
        $env = $p ? (string)($c['canal'] === 'email' ? $p['enviado1_at'] : $p['enviado_at']) : '';
        if (!$p || pebai_conv_es_baja($c['canal'], $p) || !pebai_conv_toca_contestador('auto', pebai_conv_mensajes($c['canal'], (int)$c['prospecto_id']), $env)) {
            continue;
        }
        $res = pebai_conv_borrador($c['canal'], (int)$c['prospecto_id']);
        if (isset($res['texto'])) {
            pebai_actividad($c['canal'], 'respuesta', 'Solo contestó su contestador: mensaje corto preparado para ' . ($p['empresa'] ?: '#' . $p['id']) . ' (espera tu aprobación)', $res['texto'], ($c['canal'] === 'email' ? 'em:' : 'wa:') . $p['id']);
        }
        $hechos++;
    }
    $rows = $db->query("SELECT m.agente, m.prospecto_id, m.id FROM agente_mensajes m
                        JOIN (SELECT agente, prospecto_id, MAX(id) ult FROM agente_mensajes WHERE prospecto_id > 0 GROUP BY agente, prospecto_id) u ON u.ult = m.id
                        WHERE m.sentido = 'entra' ORDER BY m.id DESC")->fetchAll();
    foreach ($rows as $r) {
        if ($hechos >= $max) {
            break;
        }
        $canal = $r['agente'] === 'email' ? 'email' : 'whatsapp';
        $q = $db->prepare('SELECT clasificacion, borrador_para, contestado_hasta FROM conversaciones WHERE canal = ? AND prospecto_id = ?');
        $q->execute([$canal, $r['prospecto_id']]);
        $c = $q->fetch();
        // Primero la clasifica la IA; a contestadores automáticos, a quien no quiere y a lo que Daniel ya contestó por su cuenta no se les prepara nada
        if (!$c || in_array($c['clasificacion'], ['', 'auto', 'no_interesado'], true) || (int)$c['borrador_para'] >= (int)$r['id'] || (int)$c['contestado_hasta'] >= (int)$r['id']) {
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
    $final = str_replace([PEBAI_CONV_VIDEO, PEBAI_CONV_FORM], [PEBAI_CONV_VIDEO_URL, PEBAI_CONV_FORM_URL], $final);
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
        $msgs[($m['agente'] === 'email' ? 'email' : 'whatsapp') . ':' . $m['prospecto_id']][] = ['id' => (int)$m['id'], 'ts' => $m['ts'], 'de' => $m['sentido'], 'texto' => $m['texto'], 'manual' => $m['plantilla'] === 'manual' ? 1 : 0, 'respuesta' => $m['plantilla'] === 'respuesta' ? 1 : 0, 'cortesia' => $m['plantilla'] === 'cortesia' ? 1 : 0];
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
            } elseif ($c && $c['clasificacion'] !== '' && ((int)$c['manual'] || (int)$c['ultimo_msg'] >= (int)max(array_map(static fn($m) => (int)$m['id'], $entra)))) {
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
                // Le toca contestar a Daniel: lo último lo escribió la empresa, no es un contestador ni alguien que no quiere,
                // y Daniel no ha marcado que ya le contestó por su cuenta (un mensaje nuevo de la empresa lo vuelve a activar)
                'te_toca' => empty($cola[$k]) && (!$hilo || (int)($c['contestado_hasta'] ?? 0) < end($hilo)['id'])
                    && (($hilo && end($hilo)['de'] === 'entra' && !in_array($estado, ['no_interesado', 'auto', 'cita'], true))
                    || ($estado === 'auto' && pebai_conv_toca_contestador('auto', $hilo, (string)$p['enviado_at']))) ? 1 : 0,
                'contestado' => $hilo && (int)($c['contestado_hasta'] ?? 0) >= end($hilo)['id'] ? 1 : 0,
                'contestador' => $estado === 'auto' && pebai_conv_toca_contestador('auto', $hilo, (string)$p['enviado_at']) ? 1 : 0,
            ];
        }
    }
    usort($filas, static fn($a, $b) => strcmp($b['ultimo_at'], $a['ultimo_at']));
    return $filas;
}
