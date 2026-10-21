<?php
/*
 * PEBAI · Conversaciones: todo lo que han enviado los agentes (WhatsApp y email) y lo que han contestado, en un solo sitio.
 *
 * - Cada empresa contactada es una conversación (canal + id del prospecto).
 * - La IA lee las respuestas y las clasifica: contestador automático, interesado, no interesado, pregunta o neutra,
 *   con un resumen de una línea. Se reclasifica sola cuando llega un mensaje nuevo (cron cada 15 min).
 * - Desde aquí se crea el enlace de reserva de un interesado (Clientes de trato directo, leads.tipo = 'cliente').
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
        $ready = true;
    }
    return $db;
}

/** Mensajes de una conversación, en orden. */
function pebai_conv_mensajes(string $canal, int $id): array
{
    $q = pebai_conv_db()->prepare('SELECT id, ts, sentido, texto FROM agente_mensajes WHERE agente = ? AND prospecto_id = ? ORDER BY id');
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

/** Todas las conversaciones para el panel: una fila por empresa contactada, con su hilo completo. */
function pebai_conv_datos(): array
{
    $db = pebai_conv_db();
    $cls = [];
    foreach ($db->query('SELECT * FROM conversaciones') as $c) {
        $cls[$c['canal'] . ':' . $c['prospecto_id']] = $c;
    }
    $msgs = [];
    foreach ($db->query("SELECT id, ts, agente, prospecto_id, sentido, texto, plantilla FROM agente_mensajes WHERE prospecto_id > 0 ORDER BY id") as $m) {
        $msgs[($m['agente'] === 'email' ? 'email' : 'whatsapp') . ':' . $m['prospecto_id']][] = ['ts' => $m['ts'], 'de' => $m['sentido'], 'texto' => $m['texto'], 'manual' => $m['plantilla'] === 'manual' ? 1 : 0];
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
                'mensajes' => $hilo,
            ];
        }
    }
    usort($filas, static fn($a, $b) => strcmp($b['ultimo_at'], $a['ultimo_at']));
    return $filas;
}
