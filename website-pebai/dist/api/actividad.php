<?php
/*
 * PEBAI · Apuntes de actividad de procesos que no corren en este servidor (p. ej. el scraper de prospeccion/).
 * Regla de Daniel: todo lo automático deja apuntado qué hizo y por qué, y se ve en Automático › Agentes.
 * Escribe en el registro común (api/_actividad_lib.php, tabla agente_actividad).
 *
 * Autenticación: cabecera X-Agent-Token = 'agent_token' de private/config.php.
 * POST JSON {agente, tipo, resumen, detalle?, ref?}. Solo agentes de la lista blanca.
 */
require_once __DIR__ . '/_actividad_lib.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Robots-Tag: noindex');
header('Cache-Control: no-store');

const AGENTES_EXTERNOS = ['prospeccion'];

$expected = (string)(pebai_config()['agent_token'] ?? '');
if ($_SERVER['REQUEST_METHOD'] !== 'POST' || $expected === '' || !hash_equals($expected, (string)($_SERVER['HTTP_X_AGENT_TOKEN'] ?? ''))) {
    http_response_code(403);
    echo json_encode(['ok' => false]);
    exit;
}

$in = json_decode(file_get_contents('php://input') ?: '{}', true) ?: [];
$agente = (string)($in['agente'] ?? '');
$resumen = trim((string)($in['resumen'] ?? ''));
if (!in_array($agente, AGENTES_EXTERNOS, true) || $resumen === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'agente o resumen no válidos']);
    exit;
}
pebai_actividad($agente, (string)($in['tipo'] ?? 'hito'), $resumen, (string)($in['detalle'] ?? ''), (string)($in['ref'] ?? ''));
echo json_encode(['ok' => true]);
