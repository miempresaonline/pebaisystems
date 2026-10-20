<?php
/*
 * PEBAI · La IA estudia una empresa (para el Scraper, antes de importarla).
 * POST JSON {empresa, ciudad, web, canal: whatsapp|email} con cabecera X-Agent-Token.
 * Respuesta: {encaja, motivo, mensaje | asunto+cuerpo, dato} o {error}. Solo se importan las que encajan.
 */
require_once __DIR__ . '/_ia_lib.php';
header('Content-Type: application/json; charset=utf-8');
header('X-Robots-Tag: noindex');
$expected = (string)(pebai_config()['agent_token'] ?? '');
if ($_SERVER['REQUEST_METHOD'] !== 'POST' || $expected === '' || !hash_equals($expected, (string)($_SERVER['HTTP_X_AGENT_TOKEN'] ?? ''))) {
    http_response_code(403);
    echo json_encode(['ok' => false]);
    exit;
}
$in = json_decode(file_get_contents('php://input') ?: '{}', true) ?: [];
$canal = ($in['canal'] ?? '') === 'email' ? 'email' : 'whatsapp';
$r = pebai_ia_prospecto(mb_substr((string)($in['empresa'] ?? ''), 0, 200), mb_substr((string)($in['ciudad'] ?? ''), 0, 100), (string)($in['web'] ?? ''), $canal);
echo json_encode(['ok' => true] + $r, JSON_UNESCAPED_UNICODE);
