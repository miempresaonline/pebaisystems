<?php
/*
 * PEBAI · Webhook de Cal.com (reservas de la sesión técnica).
 * Cal.com llama aquí al crear, cambiar o cancelar una cita. Se verifica la firma,
 * se actualiza la solicitud en el panel (campo oculto "solicitud") y se avisa a equipo@.
 */
require __DIR__ . '/_pebai_lib.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Robots-Tag: noindex');

function done(int $code, array $payload): void
{
    http_response_code($code);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    done(405, ['status' => 'error']);
}

$raw = file_get_contents('php://input');
$secret = pebai_config()['calcom_webhook_secret'] ?? '';
$sig = $_SERVER['HTTP_X_CAL_SIGNATURE_256'] ?? '';
if ($secret === '' || !hash_equals(hash_hmac('sha256', $raw, $secret), $sig)) {
    pebai_log('CALCOM: firma no válida');
    done(401, ['status' => 'error', 'message' => 'firma no válida']);
}

$event = json_decode($raw, true);
if (!is_array($event)) {
    done(400, ['status' => 'error']);
}
$trigger = $event['triggerEvent'] ?? '';
$p = $event['payload'] ?? [];
if ($trigger === 'PING') {
    done(200, ['status' => 'ok', 'ping' => true]);
}

$response = function (string $slug) use ($p): string {
    $r = $p['responses'][$slug] ?? ($p['userFieldsResponses'][$slug] ?? null);
    if (is_array($r)) {
        $r = $r['value'] ?? '';
    }
    return is_scalar($r) ? trim((string)$r) : '';
};

$attendee = $p['attendees'][0] ?? [];
$nombre = mb_substr($attendee['name'] ?? $response('name'), 0, 150);
$email = mb_substr($attendee['email'] ?? $response('email'), 0, 200);
$inicio = $p['startTime'] ?? '';
$fin = $p['endTime'] ?? '';
$uid = $p['uid'] ?? '';
$solicitud = (int)preg_replace('/\D+/', '', $response('solicitud'));

$estados = [
    'BOOKING_CREATED' => ['cita', 'reservada', '📅 Nueva cita'],
    'BOOKING_RESCHEDULED' => ['cita', 'cambiada', '🔁 Cita cambiada'],
    'BOOKING_CANCELLED' => ['contactado', 'cancelada', '❌ Cita cancelada'],
];
if (!isset($estados[$trigger])) {
    done(200, ['status' => 'ignored', 'trigger' => $trigger]);
}
[$estadoLead, $estadoCita, $titulo] = $estados[$trigger];

$lead = null;
try {
    $db = pebai_db();
    if (!$solicitud && $uid) {
        // Cambios y cancelaciones pueden no traer el campo oculto: se busca por la cita anterior
        $prev = $p['rescheduleUid'] ?? ($p['fromReschedule'] ?? $uid);
        $q = $db->prepare('SELECT id FROM leads WHERE cita_uid IN (?, ?) LIMIT 1');
        $q->execute([$uid, $prev]);
        $solicitud = (int)$q->fetchColumn();
    }
    if ($solicitud) {
        $db->prepare('UPDATE leads SET estado = ?, cita_inicio = ?, cita_fin = ?, cita_uid = ?, cita_estado = ?,
                      cliente_nombre = ?, cliente_email = ?, updated_at = ? WHERE id = ?')
            ->execute([$estadoLead, $inicio, $fin, $uid, $estadoCita, $nombre, $email, date('Y-m-d H:i:s'), $solicitud]);
        $q = $db->prepare('SELECT * FROM leads WHERE id = ?');
        $q->execute([$solicitud]);
        $lead = $q->fetch() ?: null;
    }
} catch (Throwable $e) {
    pebai_log('CALCOM DB: ' . $e->getMessage());
}

// Aviso al equipo
try {
    $cuando = $inicio ? pebai_fecha(date('Y-m-d H:i:s', strtotime($inicio))) : '—';
    $empresa = $lead['empresa'] ?? 'Sin solicitud enlazada';
    $panel = $lead ? 'https://pebaisystems.es/panel/?id=' . (int)$lead['id'] : 'https://pebaisystems.es/panel/';
    $color = $trigger === 'BOOKING_CANCELLED' ? '#FF5A6A' : '#B7FF3C';
    $rows = [
        'Cuándo' => $cuando,
        'Empresa' => $empresa,
        'Persona' => $nombre,
        'Email' => $email,
        'WhatsApp' => $lead['telefono'] ?? '—',
        'Solicitud' => $lead ? '#' . (int)$lead['id'] : 'No enlazada (reservó sin el enlace del panel)',
    ];
    $trs = '';
    foreach ($rows as $k => $v) {
        $trs .= '<tr><td style="padding:9px 0;border-bottom:1px solid #EEF0F4;color:#6B7280;font-size:13px;width:34%">' . h($k)
            . '</td><td style="padding:9px 0;border-bottom:1px solid #EEF0F4;color:#0B0F14;font-size:14px;font-weight:600">' . h($v) . '</td></tr>';
    }
    $html = '<!doctype html><html lang="es"><head><meta charset="utf-8"></head><body style="margin:0;background:#F3F4F7;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif">'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:18px;overflow:hidden">'
        . '<tr><td style="background:#0B0F14;padding:24px 26px"><div style="font-size:12px;font-weight:800;letter-spacing:.14em;color:' . $color . '">' . h(mb_strtoupper($titulo)) . '</div>'
        . '<div style="margin-top:8px;font-size:24px;font-weight:800;color:#fff">' . h($empresa) . '</div>'
        . '<div style="margin-top:4px;font-size:15px;color:#9AA3B2">' . h($cuando) . '</div></td></tr>'
        . '<tr><td style="padding:18px 26px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">' . $trs . '</table>'
        . '<p style="margin:18px 0 0"><a href="' . h($panel) . '" style="display:inline-block;background:#594AF7;color:#fff;text-decoration:none;font-weight:800;padding:12px 18px;border-radius:12px">Abrir en el panel</a></p>'
        . '</td></tr></table></td></tr></table></body></html>';
    $text = "$titulo\n$empresa\n$cuando\n\nPersona: $nombre\nEmail: $email\nPanel: $panel\n";
    pebai_smtp_send(pebai_config()['notify_to'], "$titulo: $empresa · $cuando", $html, $text);
} catch (Throwable $e) {
    pebai_log('CALCOM EMAIL: ' . $e->getMessage());
}

done(200, ['status' => 'ok', 'solicitud' => $solicitud]);
