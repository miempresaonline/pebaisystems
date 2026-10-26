<?php
/*
 * PEBAI · Avisos de los agentes para Daniel por el correo de la web (sustituye al conector de Gmail, que falla desde la nube).
 * Solo envía a equipo@pebaisystems.es, nunca a otras direcciones. Como mucho 6 avisos al día.
 *
 * Autenticación: cabecera X-Agent-Token = 'agent_token' de private/config.php.
 * POST JSON {agente, asunto, texto}. Queda apuntado en la actividad del agente.
 */
require_once __DIR__ . '/_actividad_lib.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Robots-Tag: noindex');
header('Cache-Control: no-store');

const AVISO_DESTINO = 'equipo@pebaisystems.es';
const AVISO_MAX_DIA = 6;
const AVISO_AGENTES = ['geo_jefe', 'geo_vigia', 'geo_contenido', 'geo_refresco', 'geo_local', 'geo_redes', 'geo_medicion', 'geo_tecnico', 'geo_preguntas'];

$expected = (string)(pebai_config()['agent_token'] ?? '');
if ($_SERVER['REQUEST_METHOD'] !== 'POST' || $expected === '' || !hash_equals($expected, (string)($_SERVER['HTTP_X_AGENT_TOKEN'] ?? ''))) {
    http_response_code(403);
    echo json_encode(['ok' => false]);
    exit;
}

$in = json_decode(file_get_contents('php://input') ?: '{}', true) ?: [];
$agente = (string)($in['agente'] ?? '');
$asunto = trim(preg_replace('/[\r\n]+/', ' ', (string)($in['asunto'] ?? '')));
$texto = trim((string)($in['texto'] ?? ''));
if (!in_array($agente, AVISO_AGENTES, true) || $asunto === '' || $texto === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'agente, asunto o texto no válidos']);
    exit;
}

$q = pebai_actividad_db()->prepare("SELECT COUNT(*) FROM agente_actividad WHERE agente LIKE 'geo%' AND resumen LIKE 'Aviso enviado a Daniel:%' AND ts >= ?");
$q->execute([date('Y-m-d 00:00:00')]);
if ((int)$q->fetchColumn() >= AVISO_MAX_DIA) {
    http_response_code(429);
    echo json_encode(['ok' => false, 'error' => 'límite de avisos de hoy']);
    exit;
}

$asunto = 'GEO · ' . mb_substr($asunto, 0, 120);
$texto = mb_substr($texto, 0, 6000);
$html = '<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#111">'
    . nl2br(htmlspecialchars($texto, ENT_QUOTES, 'UTF-8'))
    . '<p style="color:#888;font-size:12px;margin-top:24px">Aviso automático del equipo GEO (' . htmlspecialchars($agente, ENT_QUOTES, 'UTF-8') . '). Panel: https://panel.pebaisystems.es</p></div>';
try {
    pebai_smtp_send(AVISO_DESTINO, $asunto, $html, $texto, 'Equipo GEO · PEBAI');
} catch (Throwable $e) {
    pebai_actividad($agente, 'error', 'No se pudo enviar el aviso a Daniel por email', $e->getMessage());
    http_response_code(502);
    echo json_encode(['ok' => false, 'error' => 'no se pudo enviar']);
    exit;
}
pebai_actividad($agente, 'hito', 'Aviso enviado a Daniel: ' . mb_substr($asunto, 6, 200), $texto);
echo json_encode(['ok' => true]);
