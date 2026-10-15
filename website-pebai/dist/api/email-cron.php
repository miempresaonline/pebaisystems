<?php
/*
 * PEBAI · Motor del agente de email. Lo lanza el cron de hPanel cada 5 minutos:
 *   /usr/bin/php /home/<usuario>/domains/pebaisystems.es/public_html/api/email-cron.php
 * (o por URL con ?token=<cron_token>). En cada vuelta: lee respuestas, revisa salud y, si toca, envía UN email.
 * Sin buzón del frío en private/config.php no hace nada (estado "sin_configurar").
 */
require_once __DIR__ . '/_email_lib.php';

$isCli = PHP_SAPI === 'cli';
if (!$isCli) {
    header('Content-Type: application/json; charset=utf-8');
    header('X-Robots-Tag: noindex');
    $token = (string)($_GET['token'] ?? ($_SERVER['HTTP_X_CRON_TOKEN'] ?? ''));
    $expected = (string)(pebai_config()['cron_token'] ?? '');
    if ($expected === '' || !hash_equals($expected, $token)) {
        http_response_code(403);
        echo json_encode(['status' => 'error']);
        exit;
    }
}

// Una sola vuelta a la vez (el cron y una llamada por URL no se pisan).
$lock = fopen(pebai_private_dir() . '/email-cron.lock', 'c');
if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) {
    echo json_encode(['status' => 'ocupado']) . ($isCli ? "\n" : '');
    exit;
}
try {
    $out = ['status' => 'ok'] + pebai_email_tick();
} catch (Throwable $e) {
    pebai_log('EMAIL CRON: ' . $e->getMessage());
    $out = ['status' => 'error', 'error' => $e->getMessage()];
}
flock($lock, LOCK_UN);
@file_put_contents(pebai_private_dir() . '/email-cron.last', date('Y-m-d H:i:s') . ' ' . json_encode($out, JSON_UNESCAPED_UNICODE) . "\n");
echo json_encode($out, JSON_UNESCAPED_UNICODE) . ($isCli ? "\n" : '');
