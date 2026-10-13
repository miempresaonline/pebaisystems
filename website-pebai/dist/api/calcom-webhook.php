<?php
/*
 * PEBAI · Webhook de Cal.com (reservas de la sesión técnica).
 * Cal.com llama aquí al crear, cambiar o cancelar una cita. Se verifica la firma,
 * se actualiza la solicitud en el panel (campo oculto "solicitud" o metadata[solicitud]).
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
$solicitud = (int)preg_replace('/\D+/', '', $response('solicitud') ?: (string)($p['metadata']['solicitud'] ?? ''));

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
        $prev = $p['rescheduleUid'] ?? ($p['fromReschedule'] ?? ($p['rescheduledFromUid'] ?? $uid));
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

// Sin email propio: Cal.com ya avisa al organizador de cada reserva, cambio y cancelación.

done(200, ['status' => 'ok', 'solicitud' => $solicitud]);
