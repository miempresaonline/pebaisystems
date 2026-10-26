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
    pebai_log('CALCOM: firma no válida (' . ($sig === '' ? 'sin firma: no viene de Cal.com' : 'firma distinta: revisar el secreto') . ')');
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
$uid = (string)($p['uid'] ?? '');
$solicitud = (int)preg_replace('/\D+/', '', $response('solicitud') ?: (string)($p['metadata']['solicitud'] ?? ''));
$meet = (string)($p['metadata']['videoCallUrl'] ?? ($p['videoCallData']['url'] ?? ''));
if ($meet === '' && preg_match('#^https?://#', (string)($p['location'] ?? ''))) {
    $meet = (string)$p['location'];
}
$datos = [
    'lead_id' => $solicitud,
    'inicio' => (string)($p['startTime'] ?? ''),
    'fin' => (string)($p['endTime'] ?? ''),
    'nombre' => mb_substr((string)($attendee['name'] ?? $response('name')), 0, 150),
    'email' => mb_substr((string)($attendee['email'] ?? $response('email')), 0, 200),
    'meet_url' => mb_substr($meet, 0, 300),
    'telefono' => mb_substr($response('attendeePhoneNumber') ?: ($response('phone') ?: (string)($attendee['phoneNumber'] ?? '')), 0, 40),
];
$anterior = (string)($p['rescheduleUid'] ?? ($p['fromReschedule'] ?? ($p['rescheduledFromUid'] ?? '')));

try {
    switch ($trigger) {
        case 'BOOKING_CREATED':
            $match = '';
            if (!$datos['lead_id']) {
                // Reserva sin el enlace del panel: se une sola si hay una única solicitud que encaje
                [$datos['lead_id'], $match] = pebai_match_lead($datos['telefono'], $datos['email'], $datos['nombre']);
            }
            $cita = pebai_cita_save($uid, $datos + ['estado' => 'reservada']);
            if ($match !== '' && $cita) {
                pebai_evento((int)$cita['lead_id'], 'unida', 'Reserva unida automáticamente por ' . $match);
            }
            if ($cita && (int)$cita['lead_id'] > 0) {
                // Solo si en el formulario aceptó la publicidad. Mismo eventID que el píxel en /confirmacion-de-llamada/?uid=
                $q = pebai_db()->prepare('SELECT telefono, nombre, dispositivo, meta_ok, meta_fbp, meta_fbc FROM leads WHERE id = ?');
                $q->execute([(int)$cita['lead_id']]);
                $l = $q->fetch();
                if ($l && $l['meta_ok'] === '1') {
                    pebai_meta_event('Schedule', 'cita-' . $uid, 'https://pebaisystems.es/confirmacion-de-llamada/', [
                        'telefono' => $l['telefono'] ?: $datos['telefono'], 'email' => $datos['email'], 'nombre' => $datos['nombre'] ?: $l['nombre'],
                        'lead_id' => (int)$cita['lead_id'], 'ua' => $l['dispositivo'], 'fbp' => $l['meta_fbp'], 'fbc' => $l['meta_fbc'],
                    ]);
                }
            }
            break;
        case 'BOOKING_RESCHEDULED':
            if ($anterior !== '' && $anterior !== $uid) {
                // La cita anterior queda "cambiada" y la nueva hereda su solicitud
                $old = pebai_cita_save($anterior, ['estado' => 'cambiada']);
                if ($old && !$datos['lead_id']) {
                    $datos['lead_id'] = (int)$old['lead_id'];
                }
            }
            pebai_cita_save($uid, $datos + ['estado' => 'reservada']);
            break;
        case 'BOOKING_CANCELLED':
            pebai_cita_save($uid, ['estado' => 'cancelada']);
            break;
        default:
            done(200, ['status' => 'ignored', 'trigger' => $trigger]);
    }
} catch (Throwable $e) {
    pebai_log('CALCOM: ' . $e->getMessage());
    done(500, ['status' => 'error']);
}

// Sin email propio aquí: Cal.com ya avisa al organizador. Los recordatorios al cliente los manda api/recordatorios.php.
done(200, ['status' => 'ok']);
