<?php
/*
 * PEBAI · API del agente de WhatsApp (el bot de agente-whatsapp/ que corre 24/7 en el servidor).
 * El bot no decide nada: pregunta aquí a quién escribir, qué texto mandar y cuándo, y devuelve el resultado.
 * Así el cupo diario, el horario, las bajas y las plantillas se controlan desde el panel.
 *
 * Autenticación: cabecera X-Agent-Token = 'agent_token' de private/config.php.
 * Cuerpo JSON {accion: latido | siguiente | resultado | entrante, ...}.
 * Cada decisión queda en el registro de actividad (api/_actividad_lib.php), visible en Automático › Agentes.
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
           ->execute([$now, $estado, mb_substr((string)($in['detalle'] ?? ''), 0, 500), mb_substr((string)($in['codigo'] ?? ''), 0, 1200), 'whatsapp']);
        if ($estado !== $antes['estado']) {
            $hitos = ['conectado' => 'Conectado a WhatsApp', 'esperando_vinculo' => 'Esperando a que se vincule el WhatsApp (QR en el panel)',
                      'desvinculado' => 'WhatsApp ha cerrado la sesión', 'reconectando' => 'Conexión perdida: reconectando'];
            pebai_actividad('whatsapp', $estado === 'desvinculado' ? 'error' : 'hito', $hitos[$estado] ?? ('Estado: ' . $estado), (string)($in['detalle'] ?? ''));
        }
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
            pebai_actividad_espera('whatsapp', 'En pausa desde el panel');
            out(['ok' => true, 'esperar' => 600, 'motivo' => 'pausado']);
        }
        // Un envío que se quedó a medias (el proceso cayó) no se repite: queda en error para revisarlo a mano.
        $db->prepare("UPDATE prospectos SET estado = 'error', error = 'Envío interrumpido: mira en el WhatsApp si llegó', updated_at = ? WHERE estado = 'enviando' AND enviando_at < ?")
           ->execute([$now, date('Y-m-d H:i:s', time() - 1200)]);
        $v = pebai_wa_ventana();
        if (!$v['abierta']) {
            pebai_actividad_espera('whatsapp', 'Fuera de horario: el siguiente tramo empieza el ' . ($v['proxima'] ? pebai_fecha(date('Y-m-d H:i:s', $v['proxima'])) : '—'));
            out(['ok' => true, 'esperar' => max(60, min(3600, $v['proxima'] - time() + random_int(0, 900))), 'motivo' => 'fuera_de_horario']);
        }
        if (pebai_wa_enviados_hoy() >= $cfg['limite_dia']) {
            pebai_actividad_espera('whatsapp', 'Cupo de hoy completo (' . $cfg['limite_dia'] . ' mensajes)');
            out(['ok' => true, 'esperar' => 3600, 'motivo' => 'cupo_completo']);
        }
        $ultimo = (string)$db->query("SELECT MAX(ts) FROM agente_mensajes WHERE agente = 'whatsapp' AND sentido = 'sale' AND plantilla <> 'manual'")->fetchColumn();
        if ($ultimo !== '' && strtotime($ultimo) > time() - $cfg['pausa_min']) {
            out(['ok' => true, 'esperar' => strtotime($ultimo) + $cfg['pausa_min'] - time() + random_int(30, 240), 'motivo' => 'pausa_entre_envios']);
        }
        $embudo = pebai_telefonos_embudo();
        $p = null;
        // Solo empresas con su mensaje personal ya escrito: nunca se envía una plantilla genérica
        foreach ($db->query("SELECT * FROM prospectos WHERE estado = 'pendiente' AND mensaje <> '' AND telefono NOT IN (SELECT telefono FROM bajas) ORDER BY prioridad DESC, id LIMIT 50") as $c) {
            if (isset($embudo[$c['telefono']])) {
                $db->prepare("UPDATE prospectos SET estado = 'descartado', error = 'Ya es solicitud del embudo', updated_at = ? WHERE id = ?")->execute([$now, $c['id']]);
                pebai_actividad('whatsapp', 'bloqueo', 'No se escribe a ' . ($c['empresa'] ?: $c['telefono']) . ': ya es solicitud del embudo', '', 'wa:' . $c['id']);
                continue;
            }
            $p = $c;
            break;
        }
        if (!$p) {
            pebai_actividad_espera('whatsapp', 'Sin mensajes escritos en cola: no hay a quién escribir');
            out(['ok' => true, 'esperar' => 1800, 'motivo' => 'sin_prospectos']);
        }
        // El mensaje es el escrito para esta empresa, tal cual
        $plantilla = 'personal';
        $texto = trim((string)$p['mensaje']);
        $db->prepare("UPDATE prospectos SET estado = 'enviando', enviando_at = ?, plantilla = ?, updated_at = ? WHERE id = ? AND estado = 'pendiente'")->execute([$now, $plantilla, $now, $p['id']]);
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
            $db->prepare("INSERT INTO agente_mensajes (ts, agente, prospecto_id, telefono, sentido, texto, plantilla) VALUES (?, 'whatsapp', ?, ?, 'sale', ?, ?)")
               ->execute([$now, $id, $p['telefono'], mb_substr((string)($in['texto'] ?? ''), 0, 2000), $p['plantilla']]);
            pebai_actividad('whatsapp', 'envio', 'Enviado a ' . ($p['empresa'] ?: $p['telefono']) . ' · plantilla ' . ($p['plantilla'] ?: '—'), (string)($in['texto'] ?? ''), 'wa:' . $id);
        } else {
            $estado = !empty($in['sin_whatsapp']) ? 'sin_whatsapp' : 'error';
            $db->prepare('UPDATE prospectos SET estado = ?, error = ?, updated_at = ? WHERE id = ?')
               ->execute([$estado, mb_substr((string)($in['error'] ?? ''), 0, 300), $now, $id]);
            pebai_actividad('whatsapp', $estado === 'sin_whatsapp' ? 'bloqueo' : 'error',
                ($estado === 'sin_whatsapp' ? 'Sin WhatsApp: ' : 'Error al enviar a ') . ($p['empresa'] ?: $p['telefono']), (string)($in['error'] ?? ''), 'wa:' . $id);
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
            pebai_actividad('whatsapp', 'respuesta', 'Baja: ' . ($p['empresa'] ?: $tel) . ' pidió no recibir más mensajes', $texto, 'wa:' . $p['id']);
        } else {
            pebai_actividad('whatsapp', 'respuesta', 'Respondió ' . ($p['empresa'] ?: $tel) . ' · plantilla ' . ($p['plantilla'] ?: '—') . ' (te toca contestar desde el móvil)', $texto, 'wa:' . $p['id']);
        }
        out(['ok' => true]);

    case 'foto':
        // Foto de perfil de WhatsApp de una empresa contactada (para el CRM del panel)
        $tel = pebai_phone_digits((string)($in['telefono'] ?? ''));
        $img = base64_decode((string)($in['img'] ?? ''), true);
        $info = $img ? @getimagesizefromstring($img) : false;
        if (!preg_match('/^\d{9,15}$/', $tel) || !$img || strlen($img) > 400000 || !$info || !in_array($info['mime'], ['image/jpeg', 'image/png', 'image/webp'], true)) {
            out(['ok' => true, 'ignorado' => true]);
        }
        $dir = pebai_private_dir() . '/fotos';
        if (!is_dir($dir)) {
            mkdir($dir, 0750, true);
        }
        file_put_contents($dir . '/' . $tel . '.jpg', $img);
        out(['ok' => true]);

    case 'manual':
        // Mensaje que Daniel escribe desde su móvil a una empresa contactada: solo se guarda para ver la conversación completa
        $tel = pebai_phone_digits((string)($in['telefono'] ?? ''));
        $q = $db->prepare("SELECT id FROM prospectos WHERE telefono = ? AND enviado_at <> ''");
        $q->execute([$tel]);
        $pid = (int)$q->fetchColumn();
        if (!$pid) {
            out(['ok' => true, 'ignorado' => true]);
        }
        $db->prepare("INSERT INTO agente_mensajes (ts, agente, prospecto_id, telefono, sentido, texto, plantilla) VALUES (?, 'whatsapp', ?, ?, 'sale', ?, 'manual')")
           ->execute([$now, $pid, $tel, mb_substr(trim((string)($in['texto'] ?? '')), 0, 4000)]);
        out(['ok' => true]);
}

out(['ok' => false, 'error' => 'acción desconocida'], 400);
