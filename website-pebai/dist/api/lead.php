<?php
/*
 * PEBAI · Recepción del formulario de diagnóstico.
 * 1) Valida  2) Guarda en la base de datos privada (panel)  3) Envía el email a equipo@
 * Responde {status:"ok", id} solo si el lead quedó guardado o enviado por email.
 */
require __DIR__ . '/_pebai_lib.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');

function respond(int $code, array $payload): void
{
    http_response_code($code);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    respond(204, []);
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['status' => 'error', 'message' => 'Método no permitido']);
}

$raw = file_get_contents('php://input');
if (strlen($raw) > 20000) {
    respond(413, ['status' => 'error', 'message' => 'Solicitud demasiado grande']);
}
$data = json_decode($raw, true);
if (!is_array($data)) {
    respond(400, ['status' => 'error', 'message' => 'Datos no válidos']);
}

// Trampa anti-bots: un campo oculto que una persona nunca rellena
if (!empty($data['website'])) {
    respond(200, ['status' => 'ok', 'id' => 0]);
}

$str = function ($v, int $max = 300): string {
    $v = is_scalar($v) ? trim((string)$v) : '';
    $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v);
    return mb_substr($v, 0, $max);
};
$touch = function ($t): array {
    if (!is_array($t)) {
        return [];
    }
    $out = [];
    foreach (['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'origen', 'palabra',
              'gclid', 'fbclid', 'ttclid', 'landing', 'referrer', 'ts'] as $k) {
        if (isset($t[$k]) && is_scalar($t[$k]) && $t[$k] !== '') {
            $out[$k] = mb_substr(trim((string)$t[$k]), 0, 300);
        }
    }
    return $out;
};

$empresa = $str($data['empresa'] ?? '', 120);
$telefono = $str($data['telefono'] ?? '', 30);
if ($empresa === '' || strlen(preg_replace('/\D+/', '', $telefono)) < 9) {
    respond(422, ['status' => 'error', 'message' => 'Revisa el nombre de la empresa y el teléfono.']);
}
if (empty($data['privacidad_aceptada'])) {
    respond(422, ['status' => 'error', 'message' => 'Debes aceptar la política de privacidad.']);
}

$first = $touch($data['primer_toque'] ?? null);
$last = $touch($data['ultimo_toque'] ?? null);
// Si no hay histórico (navegador sin almacenamiento), lo que venga en la URL del formulario
$url = $touch($data['url_params'] ?? null);
if (!$last && $url) {
    $last = $url;
}
if (!$first && $last) {
    $first = $last;
}

$opcion = strtoupper($str($data['opcion'] ?? '', 1));
$lead = [
    'created_at' => date('Y-m-d H:i:s'),
    'empresa' => $empresa,
    'nombre' => $str($data['nombre'] ?? '', 120),
    'telefono' => $telefono,
    'canal' => $str($data['canal'] ?? '', 150),
    'volumen' => $str($data['volumen'] ?? '', 150),
    'objetivo' => $str($data['objetivo'] ?? '', 500),
    'presupuesto' => $str($data['presupuesto'] ?? '', 150),
    'opcion' => in_array($opcion, ['A', 'B'], true) ? $opcion : '',
    'fuente' => $last['utm_source'] ?? ($last['origen'] ?? 'directo'),
    'medio' => $last['utm_medium'] ?? '',
    'campana' => $last['utm_campaign'] ?? '',
    'contenido' => $last['utm_content'] ?? '',
    'palabra' => $last['utm_term'] ?? ($last['palabra'] ?? ''),
    'cta' => $str($data['cta'] ?? '', 80),
    'primer_toque' => json_encode($first, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    'ultimo_toque' => json_encode($last, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    'pagina' => $str($data['pagina'] ?? '', 300),
    'dispositivo' => $str($_SERVER['HTTP_USER_AGENT'] ?? '', 250),
    'ip_hash' => '',
];

$saved = false;
$id = 0;
try {
    $db = pebai_db();
    $lead['ip_hash'] = pebai_ip_hash();
    // Límite: 5 envíos por conexión cada 10 minutos
    $q = $db->prepare('SELECT COUNT(*) FROM leads WHERE ip_hash = ? AND created_at >= ?');
    $q->execute([$lead['ip_hash'], date('Y-m-d H:i:s', time() - 600)]);
    if ((int)$q->fetchColumn() >= 5) {
        respond(429, ['status' => 'error', 'message' => 'Demasiados envíos seguidos. Inténtalo en unos minutos.']);
    }
    $cols = array_keys($lead);
    $ins = $db->prepare('INSERT INTO leads (' . implode(',', $cols) . ') VALUES (' . implode(',', array_fill(0, count($cols), '?')) . ')');
    $ins->execute(array_values($lead));
    $id = (int)$db->lastInsertId();
    $saved = true;
} catch (Throwable $e) {
    pebai_log('DB: ' . $e->getMessage());
}

// Responder YA al navegador si la solicitud quedó guardada; el email se envía después
// (el SMTP puede tardar varios segundos y el cliente no tiene por qué esperarlo).
function respond_and_continue(array $payload): void
{
    ignore_user_abort(true);
    $body = json_encode($payload, JSON_UNESCAPED_UNICODE);
    http_response_code(200);
    header('Content-Length: ' . strlen($body));
    header('Connection: close');
    echo $body;
    if (function_exists('litespeed_finish_request')) {
        litespeed_finish_request();
    } elseif (function_exists('fastcgi_finish_request')) {
        fastcgi_finish_request();
    } else {
        while (ob_get_level() > 0) {
            ob_end_flush();
        }
        flush();
    }
}

$sendEmail = function () use ($lead, $id): bool {
    try {
        [$subject, $html, $text] = pebai_lead_email($lead, $id);
        pebai_smtp_send(pebai_config()['notify_to'], $subject, $html, $text);
        return true;
    } catch (Throwable $e) {
        pebai_log('EMAIL (lead ' . $id . '): ' . $e->getMessage());
        return false;
    }
};

if ($saved) {
    respond_and_continue(['status' => 'ok', 'id' => $id]);
    if ($sendEmail()) {
        try {
            pebai_db()->prepare('UPDATE leads SET email_enviado = 1 WHERE id = ?')->execute([$id]);
        } catch (Throwable $e) {
            pebai_log('DB update: ' . $e->getMessage());
        }
    }
    exit;
}

// Sin base de datos: solo vale si el email sale (el cliente espera en este caso)
if ($sendEmail()) {
    respond(200, ['status' => 'ok', 'id' => 0]);
}
respond(500, ['status' => 'error', 'message' => 'No hemos podido registrar la solicitud.']);
