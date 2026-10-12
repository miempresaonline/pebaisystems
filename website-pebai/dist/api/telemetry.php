<?php
/**
 * PEBAI Systems - Private Server-Side Telemetry Endpoint
 * Inmune a Ad-Blockers y extensiones de privacidad.
 * Registra macro y micro conversiones B2B en un archivo seguro .jsonl
 */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

// Directorio seguro para logs (intenta en uploads con protección de acceso directo)
$candidates = [
    dirname(__DIR__) . '/uploads',
    __DIR__ . '/uploads',
    sys_get_temp_dir() . '/pebai_uploads'
];
$log_dir = null;
foreach ($candidates as $dir) {
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
    if (is_dir($dir) && is_writable($dir)) {
        $log_dir = $dir;
        // Proteger el directorio uploads contra descarga directa
        $protect_htaccess = $log_dir . '/.htaccess';
        if (!file_exists($protect_htaccess)) {
            @file_put_contents($protect_htaccess, "Order allow,deny\nDeny from all\n<IfModule mod_authz_core.c>\nRequire all denied\n</IfModule>\n");
        }
        break;
    }
}
if (!$log_dir) {
    $log_dir = sys_get_temp_dir();
}
$log_file = $log_dir . '/pebai_telemetry.jsonl';

// Obtener payload JSON o FormData
$raw_input = file_get_contents('php://input');
$payload = json_decode($raw_input, true);

if (!$payload && !empty($_POST)) {
    $payload = $_POST;
}

if (!$payload) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid payload']);
    exit;
}

// Anonimización de IP para cumplimiento de RGPD
$raw_ip = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'anon';
$ip_parts = explode(',', $raw_ip);
$client_ip = trim($ip_parts[0]);
$anonymized_ip = preg_replace(['/\.\d+$/', '/:[0-9a-fA-F]+$/'], ['.0', ':0000'], $client_ip);

$event_name = filter_var($payload['event'] ?? 'unknown', FILTER_SANITIZE_FULL_SPECIAL_CHARS);
$source_url = filter_var($payload['source'] ?? ($_SERVER['HTTP_REFERER'] ?? 'direct'), FILTER_SANITIZE_URL);
$device = filter_var($payload['device'] ?? 'desktop', FILTER_SANITIZE_FULL_SPECIAL_CHARS);
$details = $payload['details'] ?? [];

$log_entry = [
    'timestamp'  => date('Y-m-d H:i:s'),
    'event'      => $event_name,
    'source'     => $source_url,
    'device'     => $device,
    'ip'         => $anonymized_ip,
    'user_agent' => substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 250),
    'details'    => $details
];

$line = json_encode($log_entry, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n";
@file_put_contents($log_file, $line, FILE_APPEND | LOCK_EX);

http_response_code(200);
echo json_encode(['status' => 'logged', 'timestamp' => $log_entry['timestamp']]);
