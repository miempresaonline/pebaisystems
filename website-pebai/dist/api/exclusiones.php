<?php
/*
 * PEBAI · Lista de exclusión para el scraper (solo lectura).
 * Devuelve lo que NO hay que volver a traer: teléfonos y dominios ya en el panel (WhatsApp, email, solicitudes del embudo)
 * y todas las bajas (por teléfono, email y dominio). Así el scraper limpia antes de entregar y nadie recibe dos veces.
 *
 * Autenticación: cabecera X-Agent-Token = 'agent_token' de private/config.php (el mismo secreto de los agentes).
 * GET /api/exclusiones.php → JSON. No devuelve nombres, mensajes ni notas: solo identificadores para deduplicar.
 */
require_once __DIR__ . '/_email_lib.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Robots-Tag: noindex');
header('Cache-Control: no-store');

$expected = (string)(pebai_config()['agent_token'] ?? '');
if ($expected === '' || !hash_equals($expected, (string)($_SERVER['HTTP_X_AGENT_TOKEN'] ?? ''))) {
    http_response_code(403);
    echo json_encode(['ok' => false]);
    exit;
}

$db = pebai_email_db();
$col = static fn(string $sql): array => array_values(array_unique(array_filter(array_map('strval', $db->query($sql)->fetchAll(PDO::FETCH_COLUMN)))));
$telEmbudo = array_keys(pebai_telefonos_embudo());
$dominio = static function (string $url): string {
    $h = strtolower((string)parse_url(str_contains($url, '://') ? $url : 'https://' . $url, PHP_URL_HOST));
    return preg_replace('/^www\./', '', $h);
};
$webs = array_values(array_unique(array_filter(array_map($dominio, array_merge(
    $col("SELECT web FROM prospectos WHERE web <> ''"), $col("SELECT web FROM email_prospectos WHERE web <> ''"))))));

echo json_encode([
    'ok' => true,
    'generado' => date('c'),
    'telefonos_en_panel' => array_values(array_unique(array_merge($col('SELECT telefono FROM prospectos'), $col("SELECT telefono FROM email_prospectos WHERE telefono <> ''"), $telEmbudo))),
    'emails_en_panel' => $col('SELECT email FROM email_prospectos'),
    'dominios_en_panel' => array_values(array_unique(array_merge($col("SELECT dominio FROM email_prospectos WHERE tipo_email <> 'gratuito'"), $webs))),
    'bajas_telefono' => $col('SELECT telefono FROM bajas'),
    'bajas_email' => $col('SELECT email FROM bajas_email'),
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
