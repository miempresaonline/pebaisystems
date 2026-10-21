<?php
/*
 * PEBAI · Contador propio de visitas, sin cookies (lo llama utm.js con sendBeacon en cada página vista).
 * Solo suma 1 a una fila agregada del día: fecha + página + origen + dominio de procedencia + utm.
 * No guarda IP, navegador, identificador ni hora. No devuelve datos (204).
 * Detalle y base legal en /politica-de-cookies/ (medición propia, agregada y solo estadística).
 */
require_once __DIR__ . '/_pebai_lib.php';

http_response_code(204);
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST' || (int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 2000) {
    exit;
}
// Bots y vistas previas de enlaces no cuentan (el navegador se lee aquí y no se guarda)
$ua = (string)($_SERVER['HTTP_USER_AGENT'] ?? '');
if ($ua === '' || preg_match('/bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit/i', $ua)) {
    exit;
}

$campo = function (string $k, int $max, string $patron): string {
    $v = $_POST[$k] ?? '';
    $v = is_string($v) ? preg_replace('/\s+/', '_', strtolower(trim($v))) : '';
    return (strlen($v) <= $max && preg_match($patron, $v)) ? $v : '';
};

// Página: solo rutas que existen en la web (evita llenar la tabla con rutas inventadas)
$path = $campo('p', 120, '#^/[a-z0-9/_.\-]*$#');
if ($path === '' || strpos($path, '..') !== false || strpos($path, '//') !== false) {
    exit;
}
if (substr($path, -1) !== '/' && !preg_match('/\.html$/', $path)) {
    $path .= '/';
}
if (preg_match('#^/(panel|api)/#', $path) || preg_match('/^panel\./i', (string)($_SERVER['HTTP_HOST'] ?? ''))) {
    exit;
}
$file = dirname(__DIR__) . (substr($path, -1) === '/' ? $path . 'index.html' : $path);
if (!is_file($file)) {
    $path = '(404)';
}

$dominio = preg_replace('/^www\./', '', $campo('r', 80, '/^[a-z0-9.\-]*$/'));
$src = $campo('s', 60, '/^[a-z0-9_.\-]*$/');
$med = $campo('m', 60, '/^[a-z0-9_.\-]*$/');
$camp = $campo('c', 80, '/^[a-z0-9_.\-]*$/');

try {
    pebai_visita_contar($path, $dominio, $src, $med, $camp);
} catch (Throwable $e) {
    pebai_log('VISITA: ' . $e->getMessage());
}
