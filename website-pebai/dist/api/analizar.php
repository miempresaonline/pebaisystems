<?php
/*
 * PEBAI · «Analizar mi empresa» desde la web pública (portada).
 * Quien escribe la web de su empresa recibe en ~1 minuto su página privada /para/<slug>/ (agente Demos):
 * radiografía real en IA, demo de su asistente con lo que dice su web y boceto de su app.
 *
 * POST web (+ hp vacío, t = momento en que se pintó el formulario) → {ok, id, k, estado}
 * GET  ?id=&k=                                                    → {ok, estado, paso, url}
 *
 * Límites para que nadie gaste el crédito: 1 análisis por persona y día y 40 al día en total.
 * Si esa web ya tiene análisis se devuelve el mismo (sin gastar). Coste medido: ~1,5 céntimos por análisis.
 */
require_once __DIR__ . '/_pebai_lib.php';
require_once __DIR__ . '/_demos_lib.php';

const PEBAI_ANALIZAR_IP_DIA = 1;   // 1 por persona y día desde que la portada nueva está en producción (30/10/2026, Daniel)
const PEBAI_ANALIZAR_DIA = 40;

header('Content-Type: application/json; charset=utf-8');
header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store');

function an_out(array $r, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($r, JSON_UNESCAPED_UNICODE);
    exit;
}

function an_db(): PDO
{
    $db = pebai_demos_db();
    $db->exec('CREATE TABLE IF NOT EXISTS encargos (id INTEGER PRIMARY KEY AUTOINCREMENT, web TEXT NOT NULL, estado TEXT NOT NULL DEFAULT "trabajando",
               paso TEXT NOT NULL DEFAULT "", slug TEXT NOT NULL DEFAULT "", empresa TEXT NOT NULL DEFAULT "", error TEXT NOT NULL DEFAULT "",
               inicio TEXT NOT NULL, fin TEXT NOT NULL DEFAULT "")');
    $db->exec('CREATE TABLE IF NOT EXISTS analisis_web (id INTEGER PRIMARY KEY AUTOINCREMENT, encargo INTEGER NOT NULL, ip TEXT NOT NULL, ts TEXT NOT NULL)');
    return $db;
}

/** Clave de cada encargo para que solo quien lo pidió pueda consultar su estado. */
function an_k(int $id): string
{
    $f = pebai_private_dir() . '/analizar.key';
    if (!is_file($f)) {
        @file_put_contents($f, bin2hex(random_bytes(24)));
    }
    return substr(hash_hmac('sha256', 'analizar:' . $id, (string)@file_get_contents($f)), 0, 20);
}

function an_estado(PDO $db, int $id): array
{
    $q = $db->prepare('SELECT * FROM encargos WHERE id = ?');
    $q->execute([$id]);
    $e = $q->fetch() ?: [];
    $q->closeCursor();
    if (!$e) {
        return ['ok' => false, 'estado' => 'fallo', 'error' => 'No existe ese análisis.'];
    }
    $r = ['ok' => true, 'estado' => $e['estado'], 'paso' => $e['paso'], 'empresa' => $e['empresa'], 'error' => $e['error'],
          'segundos' => max(0, strtotime($e['fin'] ?: date('Y-m-d H:i:s')) - strtotime($e['inicio']))];
    if ($e['slug'] !== '') {
        $r['url'] = pebai_demo_url($e['slug']);
    }
    return $r;
}

$db = an_db();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id || !hash_equals(an_k($id), (string)($_GET['k'] ?? ''))) {
        an_out(['ok' => false, 'error' => 'Enlace no válido.'], 403);
    }
    an_out(an_estado($db, $id));
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    an_out(['ok' => false, 'error' => 'Método no permitido.'], 405);
}

// Anti-robots: campo trampa vacío y formulario pintado hace más de 2 segundos
$t = (int)($_POST['t'] ?? 0);
if (trim((string)($_POST['hp'] ?? '')) !== '' || $t <= 0 || (int)round(microtime(true) * 1000) - $t < 2000) {
    an_out(['ok' => false, 'error' => 'No se ha podido enviar. Vuelve a intentarlo.'], 422);
}

$web = trim((string)($_POST['web'] ?? ''));
if ($web !== '' && !preg_match('~^https?://~i', $web)) {
    $web = 'https://' . ltrim($web, '/');
}
$host = strtolower(preg_replace('~^www\.~i', '', (string)parse_url($web, PHP_URL_HOST)));
if (!$host || !str_contains($host, '.') || filter_var($host, FILTER_VALIDATE_IP) || str_ends_with($host, 'pebaisystems.es') || strlen($host) > 120) {
    an_out(['ok' => false, 'error' => 'Escribe la web de tu empresa, por ejemplo tuempresa.es'], 422);
}
$web = 'https://' . $host . '/';

// Si esa web ya tiene análisis, se devuelve el mismo (sin gastar)
$q = $db->prepare('SELECT slug, empresa FROM demos WHERE web LIKE ? OR web LIKE ? ORDER BY creada DESC LIMIT 1');
$q->execute(['%://' . $host . '%', '%://www.' . $host . '%']);
$ya = $q->fetch();
$q->closeCursor();

$ip = hash('sha256', 'analizar|' . pebai_client_ip());
$hoy = date('Y-m-d H:i:s', time() - 86400);
if (!$ya) {
    $q = $db->prepare('SELECT COUNT(*) FROM analisis_web WHERE ip = ? AND ts > ?');
    $q->execute([$ip, $hoy]);
    if ((int)$q->fetchColumn() >= PEBAI_ANALIZAR_IP_DIA) {
        an_out(['ok' => false, 'error' => 'Has llegado al límite de análisis de hoy. Escríbenos y lo vemos contigo.'], 429);
    }
    $q = $db->prepare('SELECT COUNT(*) FROM analisis_web WHERE ts > ?');
    $q->execute([$hoy]);
    if ((int)$q->fetchColumn() >= PEBAI_ANALIZAR_DIA) {
        an_out(['ok' => false, 'error' => 'Hoy hemos hecho muchos análisis. Déjanos tu solicitud y te lo preparamos nosotros.'], 429);
    }
}

$db->prepare('INSERT INTO encargos (web, inicio) VALUES (?, ?)')->execute([$web, date('Y-m-d H:i:s')]);
$id = (int)$db->lastInsertId();
$db->prepare('INSERT INTO analisis_web (encargo, ip, ts) VALUES (?, ?, ?)')->execute([$id, $ip, date('Y-m-d H:i:s')]);
if ($ya) {
    $db->prepare("UPDATE encargos SET estado = 'lista', slug = ?, empresa = ?, paso = 'Ya estaba hecho', fin = inicio WHERE id = ?")->execute([$ya['slug'], $ya['empresa'], $id]);
    an_out(['id' => $id, 'k' => an_k($id)] + an_estado($db, $id));
}

// Contesta ya y sigue trabajando en segundo plano
$resp = json_encode(['ok' => true, 'id' => $id, 'k' => an_k($id), 'estado' => 'trabajando', 'paso' => 'Leyendo tu web'], JSON_UNESCAPED_UNICODE);
ignore_user_abort(true);
set_time_limit(400);
header('Content-Length: ' . strlen($resp));
echo $resp;
if (function_exists('fastcgi_finish_request')) {
    fastcgi_finish_request();
} elseif (function_exists('litespeed_finish_request')) {
    litespeed_finish_request();
} else {
    @ob_end_flush();
    flush();
}

$paso = static fn(string $t) => $db->prepare('UPDATE encargos SET paso = ? WHERE id = ?')->execute([$t, $id]);
$falla = static function (string $t) use ($db, $id, $host) {
    $db->prepare("UPDATE encargos SET estado = 'fallo', error = ?, fin = ? WHERE id = ?")->execute([$t, date('Y-m-d H:i:s'), $id]);
    pebai_actividad('demos', 'espera', 'Análisis de la web sin hacer (' . $host . '): ' . $t);
    exit;
};
try {
    $paso('Leyendo tu web');
    $w = pebai_web_texto($web);
    if (!$w) {
        $falla('No hemos podido leer esa web (no carga o no tiene texto).');
    }
    $quien = pebai_claude_json('demos', 'claude-haiku-5-5', 'Lees la web de una empresa y dices quién es, sin inventar. Responde SOLO JSON.',
        "WEB ({$web}):\n" . mb_substr($w['texto'], 0, 4000) . "\n\nJSON: " . '{"empresa": "nombre comercial corto", "sector": "su sector en plural, p. ej. «clínicas dentales»", "ciudad": "ciudad principal donde trabajan o vacío"}',
        ['effort' => 'low', 'max_tokens' => 600]);
    $empresa = trim((string)($quien['empresa'] ?? '')) ?: ucfirst(explode('.', $host)[0]);
    $db->prepare('UPDATE encargos SET empresa = ? WHERE id = ?')->execute([$empresa, $id]);
    $paso('Preguntando a la IA por tu sector y montando tu asistente');
    $d = pebai_demo_crear('web', ['id' => $id, 'web' => $web, 'empresa' => $empresa, 'ciudad' => (string)($quien['ciudad'] ?? ''),
                                  'nicho' => '', 'sector' => (string)($quien['sector'] ?? '')]);
    if (!$d) {
        $falla('Tu web no tiene datos suficientes para hacer el análisis.');
    }
    $db->prepare("UPDATE encargos SET estado = 'lista', slug = ?, paso = 'Listo', fin = ? WHERE id = ?")->execute([$d['slug'], date('Y-m-d H:i:s'), $id]);
    pebai_actividad('demos', 'hito', 'Análisis pedido desde la web: ' . $empresa, json_encode(['url' => pebai_demo_url($d['slug'])], JSON_UNESCAPED_UNICODE), 'demo');
    require_once __DIR__ . '/_avisos_lib.php';
    pebai_aviso('demo', $empresa . ' ha pedido su análisis en la web', 'Alguien de ' . $empresa . ' ha analizado su empresa desde la portada', 'pagina:agentes', 'analizar:' . $id);
} catch (Throwable $e) {
    $falla('Error al hacerlo: ' . mb_substr($e->getMessage(), 0, 150));
}
