<?php
/*
 * PEBAI · Une una reserva de Cal.com con su solicitud del panel.
 * Lo llama /reservar/ en cuanto el cliente reserva (o reprograma) desde el calendario embebido.
 * El enlace de reserva lleva una firma (t) generada en el panel, así que no se puede
 * asignar una cita a otra solicitud cambiando el número.
 */
require __DIR__ . '/_pebai_lib.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');

function out(int $code, array $payload): void
{
    http_response_code($code);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    out(405, ['status' => 'error']);
}
$raw = file_get_contents('php://input');
$data = strlen($raw) < 5000 ? json_decode($raw, true) : null;
if (!is_array($data)) {
    out(400, ['status' => 'error']);
}

$id = (int)($data['s'] ?? 0);
$token = (string)($data['t'] ?? '');
if ($id <= 0 || !hash_equals(pebai_booking_token($id), $token)) {
    out(403, ['status' => 'error', 'message' => 'enlace no válido']);
}

$clean = function ($v, int $max): string {
    return is_scalar($v) ? mb_substr(trim((string)$v), 0, $max) : '';
};
$uid = $clean($data['uid'] ?? '', 80);
$inicio = $clean($data['start'] ?? '', 40);
$fin = $clean($data['end'] ?? '', 40);
if ($inicio === '' || strtotime($inicio) === false) {
    out(422, ['status' => 'error', 'message' => 'fecha no válida']);
}
$estadoCita = !empty($data['reschedule']) ? 'cambiada' : 'reservada';

try {
    if ($uid !== '') {
        $cita = pebai_cita_save($uid, ['lead_id' => $id, 'inicio' => $inicio, 'fin' => $fin, 'estado' => 'reservada']);
        out(200, ['status' => 'ok', 'cita' => (bool)$cita]);
    }
    // Sin uid (navegador antiguo): al menos se marca la solicitud
    $db = pebai_db();
    $db->prepare('UPDATE leads SET estado = ?, cita_inicio = ?, cita_fin = ?, cita_estado = ?, updated_at = ? WHERE id = ?')
        ->execute(['cita', $inicio, $fin, $estadoCita, date('Y-m-d H:i:s'), $id]);
    out(200, ['status' => 'ok']);
} catch (Throwable $e) {
    pebai_log('LINK BOOKING: ' . $e->getMessage());
    out(500, ['status' => 'error']);
}
