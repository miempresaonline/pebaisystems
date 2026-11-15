<?php
/*
 * PEBAI · Recepción del formulario Growth Partner (/growth-partner/).
 *   POST ev=paso&paso=N&cta=…  → suma 1 al paso N del embudo (sin cookies ni identificadores), responde 204
 *   POST JSON                  → valida, guarda la solicitud (panel › Growth Partner), avisa al panel y envía el email a equipo@
 */
require __DIR__ . '/_growth_lib.php';

header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');

function gp_respond(int $code, array $payload): void
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    gp_respond(405, ['status' => 'error', 'message' => 'Método no permitido']);
}

/* ---------- embudo: un paso visto ---------- */
if (($_POST['ev'] ?? '') === 'paso') {
    http_response_code(204);
    $ua = (string)($_SERVER['HTTP_USER_AGENT'] ?? '');
    $paso = (int)($_POST['paso'] ?? 0);
    $cta = preg_replace('/[^a-z0-9_\-]/', '', strtolower(substr((string)($_POST['cta'] ?? ''), 0, 40)));
    if ($ua !== '' && !preg_match('/bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit/i', $ua) && $paso >= 1 && $paso <= 7) {
        try {
            pebai_gp_paso($paso, $cta);
        } catch (Throwable $e) {
            pebai_log('GROWTH paso: ' . $e->getMessage());
        }
    }
    exit;
}

/* ---------- solicitud ---------- */
$raw = file_get_contents('php://input');
if (strlen($raw) > 20000) {
    gp_respond(413, ['status' => 'error', 'message' => 'Solicitud demasiado grande']);
}
$data = json_decode($raw, true);
if (!is_array($data)) {
    gp_respond(400, ['status' => 'error', 'message' => 'Datos no válidos']);
}
// Trampa anti-bots: un campo oculto que una persona nunca rellena
if (!empty($data['website'])) {
    gp_respond(200, ['status' => 'ok', 'id' => 0]);
}

$str = static function ($v, int $max = 300): string {
    $v = is_scalar($v) ? trim((string)$v) : '';
    $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v);
    return mb_substr($v, 0, $max);
};
$touch = static function ($t): array {
    if (!is_array($t)) {
        return [];
    }
    $out = [];
    foreach (['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'origen', 'gclid', 'fbclid', 'ttclid', 'landing', 'referrer', 'ts'] as $k) {
        if (isset($t[$k]) && is_scalar($t[$k]) && $t[$k] !== '') {
            $out[$k] = mb_substr(trim((string)$t[$k]), 0, 300);
        }
    }
    return $out;
};

$nombre = $str($data['nombre'] ?? '', 120);
$telefono = $str($data['telefono'] ?? '', 30);
$email = mb_strtolower($str($data['email'] ?? '', 160));
if (mb_strlen($nombre) < 3 || strlen(preg_replace('/\D+/', '', $telefono)) < 9) {
    gp_respond(422, ['status' => 'error', 'message' => 'Revisa tu nombre y tu WhatsApp.']);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    gp_respond(422, ['status' => 'error', 'message' => 'Revisa el email.']);
}
if (empty($data['privacidad_aceptada']) || empty($data['entiende_papel'])) {
    gp_respond(422, ['status' => 'error', 'message' => 'Faltan por marcar las dos casillas del último paso.']);
}

$sol = ['created_at' => date('Y-m-d H:i:s'), 'nombre' => $nombre, 'telefono' => $telefono, 'email' => $email];
foreach (PEBAI_GP_PREGUNTAS as $k => [, $ops]) {
    $v = $str($data[$k] ?? '', 20);
    $sol[$k] = array_key_exists($v, $ops) ? $v : '';
}
$sol['porque'] = $str($data['porque'] ?? '', 1000);
$sol['encaje'] = pebai_gp_encaje($sol);
$first = $touch($data['primer_toque'] ?? null);
$last = $touch($data['ultimo_toque'] ?? null);
$url = $touch($data['url_params'] ?? null);
if (!$last && $url) {
    $last = $url;
}
if (!$first && $last) {
    $first = $last;
}
$sol += [
    'cta' => preg_replace('/[^a-z0-9_\-]/', '', strtolower($str($data['cta'] ?? '', 40))),
    'fuente' => $last['utm_source'] ?? ($last['origen'] ?? 'directo'),
    'medio' => $last['utm_medium'] ?? '',
    'campana' => $last['utm_campaign'] ?? '',
    'primer_toque' => json_encode($first, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    'ultimo_toque' => json_encode($last, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    'pagina' => $str($data['pagina'] ?? '', 300),
    'dispositivo' => $str($_SERVER['HTTP_USER_AGENT'] ?? '', 250),
    'ip_hash' => pebai_ip_hash(),
];

$id = 0;
try {
    $db = pebai_gp_db();
    // Límite: 5 envíos por conexión cada 10 minutos
    $q = $db->prepare('SELECT COUNT(*) FROM gp_solicitudes WHERE ip_hash = ? AND created_at >= ?');
    $q->execute([$sol['ip_hash'], date('Y-m-d H:i:s', time() - 600)]);
    if ((int)$q->fetchColumn() >= 5) {
        gp_respond(429, ['status' => 'error', 'message' => 'Demasiados envíos seguidos. Inténtalo en unos minutos.']);
    }
    $cols = array_keys($sol);
    $db->prepare('INSERT INTO gp_solicitudes (' . implode(',', $cols) . ') VALUES (' . implode(',', array_fill(0, count($cols), '?')) . ')')->execute(array_values($sol));
    $id = (int)$db->lastInsertId();
} catch (Throwable $e) {
    pebai_log('GROWTH DB: ' . $e->getMessage());
}

/** Email al equipo: quién es, sus respuestas y un botón al panel. */
$email_equipo = static function () use ($sol, $id): bool {
    try {
        $filas = '';
        $fila = static fn(string $l, string $v) => '<tr><td style="padding:9px 0;border-bottom:1px solid #EEF0F4;font-size:13px;color:#9AA0AE;width:44%">' . h($l) . '</td><td style="padding:9px 0;border-bottom:1px solid #EEF0F4;font-size:14px;font-weight:700;color:#0B0F14">' . h($v) . '</td></tr>';
        $filas .= $fila('WhatsApp', $sol['telefono']) . $fila('Email', $sol['email']);
        foreach (PEBAI_GP_PREGUNTAS as $k => [$t, $ops]) {
            $filas .= $fila($t, $ops[$sol[$k]] ?? '—');
        }
        $filas .= $fila('Encaje', $sol['encaje'] . ' de 15');
        $body = pebai_email_title('Growth Partner', 'Nueva solicitud: ' . $sol['nombre'], '«' . h($sol['porque']) . '»')
            . '<tr><td style="padding:18px 30px 6px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">' . $filas . '</table></td></tr>'
            . '<tr><td style="padding:18px 30px 26px">' . pebai_email_button('https://panel.pebaisystems.es/?tab=growth', 'Ver en el panel') . '</td></tr>';
        $html = pebai_email_shell('Nueva solicitud Growth Partner', $sol['nombre'] . ' quiere ser Growth Partner', $body, 'Formulario /growth-partner/ · solicitud #' . $id);
        $text = "Nueva solicitud Growth Partner: {$sol['nombre']}\nWhatsApp: {$sol['telefono']}\nEmail: {$sol['email']}\nPor qué: {$sol['porque']}\nEncaje: {$sol['encaje']} de 15\nPanel: https://panel.pebaisystems.es/?tab=growth";
        pebai_smtp_send(pebai_config()['notify_to'], 'Growth Partner: ' . $sol['nombre'], $html, $text);
        return true;
    } catch (Throwable $e) {
        pebai_log('GROWTH EMAIL (' . $id . '): ' . $e->getMessage());
        return false;
    }
};

if ($id) {
    // Responder ya; el aviso y el email van después (el SMTP puede tardar)
    ignore_user_abort(true);
    $body = json_encode(['status' => 'ok', 'id' => $id], JSON_UNESCAPED_UNICODE);
    http_response_code(200);
    header('Content-Type: application/json; charset=utf-8');
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
    try {
        require_once __DIR__ . '/_avisos_lib.php';
        pebai_aviso('growth', 'Nuevo Growth Partner: ' . $sol['nombre'], 'Encaje ' . $sol['encaje'] . ' de 15 · ' . mb_substr($sol['porque'], 0, 120), 'pagina:growth', 'gp:' . $id);
    } catch (Throwable $e) {
        pebai_log('GROWTH aviso: ' . $e->getMessage());
    }
    if ($email_equipo()) {
        try {
            pebai_gp_db()->prepare('UPDATE gp_solicitudes SET email_enviado = 1 WHERE id = ?')->execute([$id]);
        } catch (Throwable $e) {
            pebai_log('GROWTH email_enviado: ' . $e->getMessage());
        }
    }
    exit;
}

// Sin base de datos: solo vale si el email sale
if ($email_equipo()) {
    gp_respond(200, ['status' => 'ok', 'id' => 0]);
}
gp_respond(500, ['status' => 'error', 'message' => 'No hemos podido registrar la solicitud.']);
