<?php
/*
 * PEBAI · Respaldo de los recordatorios: utm.js lo llama con cada visita y, como mucho una vez
 * cada 10 minutos, revisa si hay recordatorios de 24 h / 1 h pendientes (api/recordatorios.php).
 * Así no dependen solo de la tarea programada de GitHub. No devuelve datos.
 */
require_once __DIR__ . '/_pebai_lib.php';

http_response_code(204);
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');

$lock = pebai_private_dir() . '/tick.lock';
$last = @filemtime($lock);
if ($last !== false && time() - $last < 600) {
    exit;
}
@touch($lock);

if (function_exists('litespeed_finish_request')) {
    litespeed_finish_request();
} elseif (function_exists('fastcgi_finish_request')) {
    fastcgi_finish_request();
}

define('PEBAI_TICK', true);
require __DIR__ . '/recordatorios.php';
