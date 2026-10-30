<?php
/*
 * PEBAI · Claude (API de Anthropic) para los agentes del panel (desde el 27/10/2026).
 * Claude primero; si falla, no hay clave o se acaba el crédito del mes, el que llama vuelve a Gemini (_ia_lib.php),
 * así nunca se pierde una clasificación ni una respuesta.
 * Cada llamada (de Claude o de Gemini) se apunta en ia_gasto: agente, modelo, tokens y dólares. Lo enseña Automático › Gasto IA.
 * Clave: 'anthropic_api_key' y 'anthropic_workspace' en private/ia.php (fuera de public_html; nunca en el repositorio).
 * Llamadas HTTP con curl, como el resto de la web (Hostinger sin Composer).
 */
require_once __DIR__ . '/_pebai_lib.php';

// Dólares por millón de tokens: [entrada, salida]. La caché se lee al 10 % y se escribe al 125 % del precio de entrada.
const PEBAI_CLAUDE_PRECIOS = [
    'claude-haiku-5-5' => [0.10, 0.50],
    'claude-sonnet-5-5' => [2.00, 10.00],
    'claude-opus-5-5' => [4.00, 20.00],
];
const PEBAI_CLAUDE_PRESUPUESTO = 100.0;   // crédito de la API cada mes (dólares)
const PEBAI_CLAUDE_FRENO = 0.95;          // a partir del 95 % del mes, todo pasa a Gemini

function pebai_claude_cfg(): array
{
    static $c = null;
    if ($c === null) {
        $f = pebai_private_dir() . '/ia.php';
        $ia = is_file($f) ? (require $f) : [];
        $c = ['key' => (string)($ia['anthropic_api_key'] ?? getenv('ANTHROPIC_API_KEY') ?: ''),
              'workspace' => (string)($ia['anthropic_workspace'] ?? getenv('ANTHROPIC_WORKSPACE_ID') ?: '')];
    }
    return $c;
}

function pebai_ia_gasto_db(): PDO
{
    static $ok = false;
    $db = pebai_db();
    if (!$ok) {
        $db->exec('CREATE TABLE IF NOT EXISTS ia_gasto (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ts TEXT NOT NULL,
            agente TEXT NOT NULL,
            proveedor TEXT NOT NULL,
            modelo TEXT NOT NULL,
            entrada INTEGER NOT NULL DEFAULT 0,
            salida INTEGER NOT NULL DEFAULT 0,
            cache_lee INTEGER NOT NULL DEFAULT 0,
            cache_escribe INTEGER NOT NULL DEFAULT 0,
            usd REAL NOT NULL DEFAULT 0,
            ok INTEGER NOT NULL DEFAULT 1,
            nota TEXT NOT NULL DEFAULT ""
        )');
        $db->exec('CREATE INDEX IF NOT EXISTS ia_gasto_ts ON ia_gasto (ts)');
        $ok = true;
    }
    return $db;
}

function pebai_ia_apunta(string $agente, string $proveedor, string $modelo, array $u = [], float $usd = 0, bool $ok = true, string $nota = ''): void
{
    try {
        pebai_ia_gasto_db()->prepare('INSERT INTO ia_gasto (ts, agente, proveedor, modelo, entrada, salida, cache_lee, cache_escribe, usd, ok, nota) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
            ->execute([date('Y-m-d H:i:s'), $agente, $proveedor, $modelo, (int)($u['input_tokens'] ?? 0), (int)($u['output_tokens'] ?? 0),
                       (int)($u['cache_read_input_tokens'] ?? 0), (int)($u['cache_creation_input_tokens'] ?? 0), $usd, $ok ? 1 : 0, mb_substr($nota, 0, 200)]);
    } catch (Throwable $e) {
        pebai_log('IA GASTO: ' . $e->getMessage());
    }
}

/** Dólares gastados en Claude este mes (del día 1 a hoy). */
function pebai_claude_gasto_mes(): float
{
    $q = pebai_ia_gasto_db()->prepare("SELECT COALESCE(SUM(usd), 0) FROM ia_gasto WHERE proveedor = 'claude' AND ts >= ?");
    $q->execute([date('Y-m-01 00:00:00')]);
    return (float)$q->fetchColumn();
}

function pebai_claude_coste(string $modelo, array $u): float
{
    [$in, $out] = PEBAI_CLAUDE_PRECIOS[$modelo] ?? PEBAI_CLAUDE_PRECIOS['claude-sonnet-5-5'];
    return ((int)($u['input_tokens'] ?? 0) * $in + (int)($u['output_tokens'] ?? 0) * $out
          + (int)($u['cache_read_input_tokens'] ?? 0) * $in * 0.1 + (int)($u['cache_creation_input_tokens'] ?? 0) * $in * 1.25) / 1e6
          + (int)($u['server_tool_use']['web_search_requests'] ?? 0) * 0.01;   // búsqueda web: 10 $ por cada 1.000
}

/**
 * Una llamada a Claude. Devuelve el texto de la respuesta, o null si no se ha podido (sin clave, freno de gasto, error):
 * entonces quien llama usa Gemini.
 *   $system: instrucciones (van primero)
 *   $mensajes: [['role' => 'user'|'assistant', 'content' => '…'], …]
 *   $opc: effort (low|medium|high), max_tokens, timeout, cache (guardar $system en caché), tools (herramientas del servidor)
 */
function pebai_claude(string $agente, string $modelo, string $system, array $mensajes, array $opc = []): ?string
{
    $GLOBALS['pebai_claude_bloques'] = [];
    $cfg = pebai_claude_cfg();
    if ($cfg['key'] === '' || !isset(PEBAI_CLAUDE_PRECIOS[$modelo])) {
        return null;
    }
    if (pebai_claude_gasto_mes() >= PEBAI_CLAUDE_PRESUPUESTO * PEBAI_CLAUDE_FRENO) {
        return null;   // crédito del mes casi agotado: Gemini hasta el día 1
    }
    $body = ['model' => $modelo, 'max_tokens' => (int)($opc['max_tokens'] ?? 4000), 'messages' => $mensajes,
             'output_config' => ['effort' => (string)($opc['effort'] ?? 'low')]];
    if (!empty($opc['tools'])) {
        $body['tools'] = $opc['tools'];   // p. ej. la búsqueda web de Demos
    }
    if ($system !== '') {
        // caché solo si se pide: escribirla cuesta un 25 % más, y solo compensa con instrucciones fijas que se repiten
        $body['system'] = [['type' => 'text', 'text' => $system] + (!empty($opc['cache']) ? ['cache_control' => ['type' => 'ephemeral']] : [])];
    }
    $cab = ['Content-Type: application/json', 'anthropic-version: 2023-06-01', 'x-api-key: ' . $cfg['key']];
    if ($cfg['workspace'] !== '') {
        $cab[] = 'anthropic-workspace-id: ' . $cfg['workspace'];
    }
    $ch = curl_init('https://api.anthropic.com/v1/messages');
    curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => json_encode($body, JSON_UNESCAPED_UNICODE), CURLOPT_RETURNTRANSFER => true,
                            CURLOPT_TIMEOUT => (int)($opc['timeout'] ?? 60), CURLOPT_HTTPHEADER => $cab]);
    $raw = (string)curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $j = json_decode($raw, true) ?: [];
    if ($code !== 200) {
        $err = (string)($j['error']['message'] ?? 'HTTP ' . $code);
        pebai_ia_apunta($agente, 'claude', $modelo, [], 0, false, 'HTTP ' . $code . ': ' . $err);
        pebai_log('CLAUDE ' . $agente . ': HTTP ' . $code . ' ' . mb_substr($err, 0, 200));
        return null;
    }
    $u = (array)($j['usage'] ?? []);
    pebai_ia_apunta($agente, 'claude', $modelo, $u, pebai_claude_coste($modelo, $u), ($j['stop_reason'] ?? '') !== 'refusal', (string)($j['stop_reason'] ?? ''));
    if (($j['stop_reason'] ?? '') === 'refusal') {
        return null;
    }
    // Los bloques tal cual (búsquedas hechas y sus resultados reales): los usa quien necesite comprobar lo que dice el modelo
    $GLOBALS['pebai_claude_bloques'] = (array)($j['content'] ?? []);
    $txt = '';
    foreach ((array)($j['content'] ?? []) as $b) {
        if (($b['type'] ?? '') === 'text') {
            $txt .= (string)$b['text'];
        }
    }
    return trim($txt) === '' ? null : trim($txt);
}

/** Igual que pebai_claude(), pero devuelve el JSON de la respuesta (quita ```json si lo pone). */
function pebai_claude_json(string $agente, string $modelo, string $system, string $prompt, array $opc = []): ?array
{
    $t = pebai_claude($agente, $modelo, $system, [['role' => 'user', 'content' => $prompt]], $opc);
    if ($t === null) {
        return null;
    }
    $t = trim(preg_replace('/^```(?:json)?|```$/m', '', $t));
    $j = json_decode($t, true);
    if (!is_array($j) && preg_match('/\{.*\}/s', $t, $m)) {
        $j = json_decode($m[0], true);
    }
    return is_array($j) ? $j : null;
}
