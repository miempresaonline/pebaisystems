<?php
/*
 * PEBAI · API del agente de WhatsApp (el bot de agente-whatsapp/ que corre 24/7 en el servidor).
 * El bot no decide nada: pregunta aquí a quién escribir, qué texto mandar y cuándo, y devuelve el resultado.
 * Así el cupo diario, el horario, las bajas y las plantillas se controlan desde el panel.
 *
 * Autenticación: cabecera X-Agent-Token = 'agent_token' de private/config.php.
 * Cuerpo JSON {accion: latido | siguiente | resultado | entrante, ...}.
 */
require_once __DIR__ . '/_agentes_lib.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Robots-Tag: noindex');
header('Cache-Control: no-store');

function out(array $data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$expected = (string)(pebai_config()['agent_token'] ?? '');
if ($_SERVER['REQUEST_METHOD'] !== 'POST' || $expected === '' || !hash_equals($expected, (string)($_SERVER['HTTP_X_AGENT_TOKEN'] ?? ''))) {
    out(['ok' => false], 403);
}

$in = json_decode(file_get_contents('php://input') ?: '{}', true) ?: [];
$db = pebai_agentes_db();
$now = date('Y-m-d H:i:s');

switch ($in['accion'] ?? '') {
    case 'latido':
        // Estado del bot: conectado | esperando_vinculo | desvinculado | reconectando. Con el código de vinculación si toca.
        $estado = preg_replace('/[^a-z_]/', '', (string)($in['estado'] ?? ''));
        $antes = pebai_agente('whatsapp');
        $db->prepare('UPDATE agente_estado SET latido_at = ?, estado = ?, detalle = ?, codigo = ? WHERE agente = ?')
           ->execute([$now, $estado, mb_substr((string)($in['detalle'] ?? ''), 0, 500), mb_substr((string)($in['codigo'] ?? ''), 0, 20), 'whatsapp']);
        if ($estado === 'conectado') {
            $db->prepare("UPDATE agente_estado SET alerta_at = '' WHERE agente = 'whatsapp'")->execute();
        } elseif (in_array($estado, ['desvinculado', 'esperando_vinculo'], true) && $antes['estado'] === 'conectado') {
            pebai_agente_alerta('whatsapp', 'WhatsApp se ha desvinculado del agente',
                "El bot ha perdido la sesión de WhatsApp y no envía mensajes.\nEntra en el panel → Agentes: aparecerá un código para volver a vincularlo desde el móvil (WhatsApp → Dispositivos vinculados → Vincular con número de teléfono).");
        }
        // Números a los que ya se ha escrito: el bot solo reporta respuestas de estos (nunca chats personales).
        $tels = $db->query("SELECT telefono FROM prospectos WHERE estado IN ('enviando','enviado','respondio') AND enviado_at >= '" . date('Y-m-d', strtotime('-90 days')) . "'")
                   ->fetchAll(PDO::FETCH_COLUMN);
        out(['ok' => true, 'pausado' => (int)$antes['pausado'], 'contactados' => $tels]);

    case 'siguiente':
        $a = pebai_agente('whatsapp');
        $cfg = pebai_wa_config();
        if ((int)$a['pausado']) {
            out(['ok' => true, 'esperar' => 600, 'motivo' => 'pausado']);
        }
        // Un envío que se quedó a medias (el proceso cayó) no se repite: queda en error para revisarlo a mano.
        $db->prepare("UPDATE prospectos SET estado = 'error', error = 'Envío interrumpido: mira en el WhatsApp si llegó', updated_at = ? WHERE estado = 'enviando' AND enviando_at < ?")
           ->execute([$now, date('Y-m-d H:i:s', time() - 1200)]);
        $v = pebai_wa_ventana();
        if (!$v['abierta']) {
            out(['ok' => true, 'esperar' => max(60, min(3600, $v['proxima'] - time() + random_int(0, 900))), 'motivo' => 'fuera_de_horario']);
        }
        if (pebai_wa_enviados_hoy() >= $cfg['limite_dia']) {
            out(['ok' => true, 'esperar' => 3600, 'motivo' => 'cupo_completo']);
        }
        $ultimo = (string)$db->query("SELECT MAX(ts) FROM agente_mensajes WHERE agente = 'whatsapp' AND sentido = 'sale'")->fetchColumn();
        if ($ultimo !== '' && strtotime($ultimo) > time() - $cfg['pausa_min']) {
            out(['ok' => true, 'esperar' => strtotime($ultimo) + $cfg['pausa_min'] - time() + random_int(30, 240), 'motivo' => 'pausa_entre_envios']);
        }
        $embudo = pebai_telefonos_embudo();
        $p = null;
        foreach ($db->query("SELECT * FROM prospectos WHERE estado = 'pendiente' AND telefono NOT IN (SELECT telefono FROM bajas) ORDER BY id LIMIT 50") as $c) {
            if (isset($embudo[$c['telefono']])) {
                $db->prepare("UPDATE prospectos SET estado = 'descartado', error = 'Ya es solicitud del embudo', updated_at = ? WHERE id = ?")->execute([$now, $c['id']]);
                continue;
            }
            $p = $c;
            break;
        }
        if (!$p) {
            out(['ok' => true, 'esperar' => 1800, 'motivo' => 'sin_prospectos']);
        }
        $plantillas = array_values($cfg['plantillas']);
        $texto = pebai_wa_render($plantillas[random_int(0, count($plantillas) - 1)], $p);
        $db->prepare("UPDATE prospectos SET estado = 'enviando', enviando_at = ?, updated_at = ? WHERE id = ? AND estado = 'pendiente'")->execute([$now, $now, $p['id']]);
        out(['ok' => true, 'prospecto' => ['id' => (int)$p['id'], 'telefono' => $p['telefono'], 'empresa' => $p['empresa']], 'texto' => $texto]);

    case 'resultado':
        $id = (int)($in['id'] ?? 0);
        $q = $db->prepare('SELECT * FROM prospectos WHERE id = ?');
        $q->execute([$id]);
        $p = $q->fetch();
        if (!$p) {
            out(['ok' => false, 'error' => 'no existe'], 404);
        }
        if (!empty($in['ok'])) {
            $db->prepare("UPDATE prospectos SET estado = 'enviado', enviado_at = ?, error = '', updated_at = ? WHERE id = ?")->execute([$now, $now, $id]);
            $db->prepare("INSERT INTO agente_mensajes (ts, agente, prospecto_id, telefono, sentido, texto) VALUES (?, 'whatsapp', ?, ?, 'sale', ?)")
               ->execute([$now, $id, $p['telefono'], mb_substr((string)($in['texto'] ?? ''), 0, 2000)]);
        } else {
            $estado = !empty($in['sin_whatsapp']) ? 'sin_whatsapp' : 'error';
            $db->prepare('UPDATE prospectos SET estado = ?, error = ?, updated_at = ? WHERE id = ?')
               ->execute([$estado, mb_substr((string)($in['error'] ?? ''), 0, 300), $now, $id]);
        }
        out(['ok' => true, 'esperar' => !empty($in['ok']) ? pebai_wa_pausa() : random_int(20, 90)]);

    case 'entrante':
        // Respuesta de un prospecto: se registra, se marca como respondido y, si pide no recibir más, pasa a baja.
        // El bot no contesta nunca: contesta Daniel desde el móvil.
        $tel = pebai_phone_digits((string)($in['telefono'] ?? ''));
        $q = $db->prepare("SELECT * FROM prospectos WHERE telefono = ? AND estado IN ('enviando','enviado','respondio','baja')");
        $q->execute([$tel]);
        $p = $q->fetch();
        if (!$p) {
            out(['ok' => true, 'ignorado' => true]);
        }
        $texto = mb_substr(trim((string)($in['texto'] ?? '')), 0, 2000);
        $db->prepare("INSERT INTO agente_mensajes (ts, agente, prospecto_id, telefono, sentido, texto) VALUES (?, 'whatsapp', ?, ?, 'entra', ?)")
           ->execute([$now, $p['id'], $tel, $texto]);
        if (in_array($p['estado'], ['enviando', 'enviado'], true)) {
            $db->prepare("UPDATE prospectos SET estado = 'respondio', respondido_at = ?, updated_at = ? WHERE id = ?")->execute([$now, $now, $p['id']]);
        }
        if (preg_match(PEBAI_BAJA_RE, $texto)) {
            pebai_wa_baja($tel, 'Lo pidió por WhatsApp: «' . mb_substr($texto, 0, 200) . '»');
        }
        out(['ok' => true]);
}

out(['ok' => false, 'error' => 'acción desconocida'], 400);
