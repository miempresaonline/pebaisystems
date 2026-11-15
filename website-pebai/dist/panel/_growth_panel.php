<?php
/*
 * PEBAI · Panel — Embudo › Growth Partner. Lo incluye panel/index.php después de comprobar la sesión: usa $auth, csrf() y json_out().
 *   GET  ?growth=1                 → solicitudes, cifras, embudo del formulario, respuestas y orígenes (pebai_gp_estado())
 *   POST action=growth_estado      → cambia el estado de una solicitud (nuevo, contactado, activo, descartado)
 */
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}
require_once dirname(__DIR__) . '/api/_growth_lib.php';

if ($auth && isset($_GET['growth'])) {
    session_write_close();
    try {
        json_out(pebai_gp_estado() + ['csrf' => csrf()]);
    } catch (Throwable $e) {
        pebai_log('GROWTH panel: ' . $e->getMessage());
        json_out(['ok' => false, 'error' => 'No se ha podido cargar Growth Partner.'], 500);
    }
}

if ($auth && ($_POST['action'] ?? '') === 'growth_estado') {
    if (!hash_equals($_SESSION['csrf'] ?? '', $_POST['csrf'] ?? '')) {
        json_out(['ok' => false, 'error' => 'Sesión caducada. Recarga la página.'], 400);
    }
    $estado = (string)($_POST['estado'] ?? '');
    if (!array_key_exists($estado, PEBAI_GP_ESTADOS)) {
        json_out(['ok' => false, 'error' => 'Estado no válido.'], 422);
    }
    pebai_gp_db()->prepare('UPDATE gp_solicitudes SET estado = ?, estado_at = ? WHERE id = ?')->execute([$estado, date('Y-m-d H:i:s'), (int)($_POST['id'] ?? 0)]);
    json_out(['ok' => true]);
}
