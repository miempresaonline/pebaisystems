<?php
/*
 * PEBAI · Chat de la demo de una empresa (lo usa api/demo.php). Contesta su «asistente» con Claude Haiku,
 * solo con lo que se sacó de su web. Como mucho PEBAI_DEMO_CHAT_MAX mensajes por demo; cada uno ~0,05 céntimos.
 */
require_once __DIR__ . '/_demos_lib.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Robots-Tag: noindex');
header('Cache-Control: no-store');
$out = static function (array $r, int $code = 200): void {
    http_response_code($code);
    echo json_encode($r, JSON_UNESCAPED_UNICODE);
    exit;
};
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    $out(['ok' => false], 405);
}
$in = json_decode(file_get_contents('php://input') ?: '{}', true) ?: [];
$slug = preg_replace('/[^a-z0-9-]/', '', (string)($in['s'] ?? ''));
$msg = mb_substr(trim((string)($in['m'] ?? '')), 0, 300);
$q = pebai_demos_db()->prepare('SELECT * FROM demos WHERE slug = ?');
$q->execute([$slug]);
$d = $q->fetch();
if (!$d || $msg === '') {
    $out(['ok' => false, 'error' => 'No disponible.'], 404);
}
if ((int)$d['chats'] >= PEBAI_DEMO_CHAT_MAX) {
    $out(['ok' => true, 'respuesta' => 'Hasta aquí la prueba 🙂 Para tener el asistente de verdad, con toda vuestra información, habla con Daniel por WhatsApp desde el botón de abajo.', 'quedan' => 0]);
}
$x = json_decode((string)$d['datos'], true) ?: [];
$kb = $x['kb'] ?? [];
$hilo = [];
foreach (array_slice((array)($in['h'] ?? []), -8) as $t) {
    if (is_array($t) && isset($t['q'], $t['a'])) {
        $hilo[] = ['role' => 'user', 'content' => mb_substr((string)$t['q'], 0, 300)];
        $hilo[] = ['role' => 'assistant', 'content' => mb_substr((string)$t['a'], 0, 800)];
    }
}
$hilo[] = ['role' => 'user', 'content' => $msg];
$system = 'Eres el asistente de WhatsApp de ' . $d['empresa'] . ($d['ciudad'] ? ' (' . $d['ciudad'] . ')' : '') . '. Contestas a sus clientes. '
    . 'Español de España, cercano y profesional, como una persona de la empresa por WhatsApp: 1-3 frases, sin listas largas, como mucho un emoji. '
    . 'Usa SOLO esta información de su web; si algo no está, no lo inventes: di que lo consultas con el equipo y ofrece tomar sus datos (nombre y qué necesita) para que le llamen. '
    . 'No des precios concretos si no están en la información. Si el cliente quiere presupuesto o visita, pídele lo necesario (qué necesita, dónde y cuándo le viene bien) para pasárselo al equipo.'
    . "\n\nINFORMACIÓN DE LA EMPRESA:\n" . json_encode($kb, JSON_UNESCAPED_UNICODE);
$r = pebai_claude('demos', 'claude-haiku-5-5', $system, $hilo, ['effort' => 'low', 'max_tokens' => 1200, 'cache' => true, 'timeout' => 40]);
if ($r === null) {
    $out(['ok' => false, 'error' => 'Ahora mismo no puedo contestar. Prueba en un momento.'], 502);
}
pebai_demos_db()->prepare('UPDATE demos SET chats = chats + 1 WHERE slug = ?')->execute([$slug]);
if ((int)$d['chats'] === 0) {
    pebai_actividad('demos', 'hito', 'Aviso a WhatsApp: ' . $d['empresa'] . ' está probando su asistente', $msg, 'demo');
}
$out(['ok' => true, 'respuesta' => $r, 'quedan' => PEBAI_DEMO_CHAT_MAX - (int)$d['chats'] - 1]);
