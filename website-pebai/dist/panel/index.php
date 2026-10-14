<?php
/*
 * PEBAI · Panel privado del embudo: resumen por origen, solicitudes y citas.
 * Acceso con contraseña (hash en private/config.php).
 */
require dirname(__DIR__) . '/api/_pebai_lib.php';

header('X-Robots-Tag: noindex, nofollow');
header('X-Frame-Options: DENY');
header('Cache-Control: no-store');

session_name('pebai_panel');
session_set_cookie_params(['lifetime' => 0, 'path' => '/panel/', 'secure' => true, 'httponly' => true, 'samesite' => 'Strict']);
session_start();

const ESTADOS = [
    'nuevo' => ['Nuevo', '#B7FF3C', '#0B0F14'],
    'contactado' => ['Contactado', '#6A5CFF', '#FFFFFF'],
    'cita' => ['Cita agendada', '#25D366', '#0B0F14'],
    'sesion' => ['Sesión hecha', '#3FD5FF', '#0B0F14'],
    'no_asistio' => ['No se presentó', '#FF6B7A', '#0B0F14'],
    'cliente' => ['Cliente', '#FFB547', '#0B0F14'],
    'descartado' => ['Descartado', '#3A404D', '#C9CED8'],
];
const PERIODOS = ['7' => 'Últimos 7 días', '30' => 'Últimos 30 días', '90' => 'Últimos 90 días', 'todo' => 'Todo'];

function csrf(): string
{
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(16));
    }
    return $_SESSION['csrf'];
}

function check_csrf(): void
{
    if (!hash_equals($_SESSION['csrf'] ?? '', $_POST['csrf'] ?? '')) {
        http_response_code(400);
        exit('Sesión caducada. Recarga la página.');
    }
}

function self_url(array $params = []): string
{
    $q = array_filter(array_merge($_GET, $params), fn($v) => $v !== null && $v !== '');
    return '/panel/' . ($q ? '?' . http_build_query($q) : '');
}

function badge(string $estado): string
{
    [$label, $bg, $fg] = ESTADOS[$estado] ?? ESTADOS['nuevo'];
    return '<span class="badge" style="background:' . $bg . ';color:' . $fg . '">' . h($label) . '</span>';
}

function pct(int $a, int $b): string
{
    return $b > 0 ? round($a * 100 / $b) . ' %' : '—';
}

function fecha_cita(string $iso): string
{
    $ts = strtotime($iso);
    return $ts ? pebai_fecha(date('Y-m-d H:i:s', $ts)) : '—';
}

function touch_table(string $json): string
{
    $t = json_decode($json, true) ?: [];
    if (!$t) {
        return '<p class="muted">Sin datos</p>';
    }
    $labels = ['utm_source' => 'Fuente', 'utm_medium' => 'Medio', 'utm_campaign' => 'Campaña', 'utm_content' => 'Contenido',
               'utm_term' => 'Término', 'palabra' => 'Palabra', 'landing' => 'Página de entrada', 'referrer' => 'Referente', 'ts' => 'Fecha'];
    $html = '<dl class="kv">';
    foreach ($labels as $k => $l) {
        if (!empty($t[$k])) {
            $v = $k === 'ts' ? date('d/m/Y H:i', strtotime($t[$k])) : $t[$k];
            $html .= '<dt>' . h($l) . '</dt><dd>' . h($v) . '</dd>';
        }
    }
    return $html . '</dl>';
}

function wa_link(string $tel, string $text): string
{
    return 'https://wa.me/' . pebai_phone_digits($tel) . '?text=' . rawurlencode($text);
}

$error = '';
$dbError = '';
try {
    $db = pebai_db();
} catch (Throwable $e) {
    $db = null;
    $dbError = 'No se puede abrir la base de datos: ' . $e->getMessage();
}

/* ------------------------------------------------------------ Login --- */
if (isset($_POST['action']) && $_POST['action'] === 'login') {
    $ip = pebai_ip_hash();
    $blocked = false;
    if ($db) {
        $db->prepare('DELETE FROM login_attempts WHERE ts < ?')->execute([time() - 900]);
        $q = $db->prepare('SELECT COUNT(*) FROM login_attempts WHERE ip_hash = ?');
        $q->execute([$ip]);
        $blocked = (int)$q->fetchColumn() >= 8;
    }
    if ($blocked) {
        $error = 'Demasiados intentos. Espera 15 minutos.';
    } elseif (password_verify($_POST['password'] ?? '', pebai_config()['panel_password_hash'])) {
        session_regenerate_id(true);
        $_SESSION['auth'] = true;
        header('Location: /panel/');
        exit;
    } else {
        $error = 'Contraseña incorrecta.';
        if ($db) {
            $db->prepare('INSERT INTO login_attempts (ip_hash, ts) VALUES (?, ?)')->execute([$ip, time()]);
        }
    }
}

if (isset($_GET['salir'])) {
    $_SESSION = [];
    session_destroy();
    header('Location: /panel/');
    exit;
}

$auth = !empty($_SESSION['auth']);

/* ------------------------------------------------------------ Acciones --- */
if ($auth && $db && isset($_POST['action'])) {
    check_csrf();
    $now = date('Y-m-d H:i:s');
    $back = $_POST['back'] ?? '/panel/';
    if (strpos($back, '/panel/') !== 0) {
        $back = '/panel/';
    }
    switch ($_POST['action']) {
        case 'update':
            $estado = array_key_exists($_POST['estado'] ?? '', ESTADOS) ? $_POST['estado'] : 'nuevo';
            $notas = mb_substr(trim($_POST['notas'] ?? ''), 0, 5000);
            $db->prepare('UPDATE leads SET estado = ?, notas = ?, updated_at = ? WHERE id = ?')
                ->execute([$estado, $notas, $now, (int)$_POST['id']]);
            $back = '/panel/?id=' . (int)$_POST['id'] . '&ok=1';
            break;
        case 'asistencia':
            $uid = (string)($_POST['uid'] ?? '');
            $valor = ($_POST['valor'] ?? '') === 'asistio' ? 'asistio' : (($_POST['valor'] ?? '') === 'no_asistio' ? 'no_asistio' : '');
            $db->prepare('UPDATE citas SET asistencia = ?, updated_at = ? WHERE uid = ?')->execute([$valor, $now, $uid]);
            $q = $db->prepare('SELECT lead_id FROM citas WHERE uid = ?');
            $q->execute([$uid]);
            $leadId = (int)$q->fetchColumn();
            if ($leadId && $valor !== '') {
                $db->prepare("UPDATE leads SET estado = CASE WHEN estado = 'cliente' THEN estado ELSE ? END, updated_at = ? WHERE id = ?")
                    ->execute([$valor === 'asistio' ? 'sesion' : 'no_asistio', $now, $leadId]);
            }
            break;
        case 'vincular':
            $uid = (string)($_POST['uid'] ?? '');
            $leadId = (int)($_POST['lead_id'] ?? 0);
            $q = $db->prepare('SELECT COUNT(*) FROM leads WHERE id = ?');
            $q->execute([$leadId]);
            if ($leadId && (int)$q->fetchColumn() === 1) {
                $db->prepare('UPDATE citas SET lead_id = ?, updated_at = ? WHERE uid = ?')->execute([$leadId, $now, $uid]);
                $q = $db->prepare('SELECT * FROM citas WHERE uid = ?');
                $q->execute([$uid]);
                if ($cita = $q->fetch()) {
                    pebai_cita_sync_lead($cita);
                }
            }
            break;
    }
    header('Location: ' . $back);
    exit;
}

/* ------------------------------------------------------- Exportar CSV --- */
if ($auth && $db && isset($_GET['csv'])) {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="solicitudes-pebai-' . date('Y-m-d') . '.csv"');
    $out = fopen('php://output', 'w');
    fwrite($out, "\xEF\xBB\xBF");
    $cols = ['id', 'created_at', 'estado', 'empresa', 'nombre', 'telefono', 'canal', 'volumen', 'objetivo', 'presupuesto',
             'opcion', 'fuente', 'medio', 'campana', 'contenido', 'palabra', 'cta', 'cita_inicio', 'cliente_email', 'notas'];
    fputcsv($out, $cols, ';');
    foreach ($db->query('SELECT ' . implode(',', $cols) . ' FROM leads ORDER BY id DESC') as $r) {
        fputcsv($out, $r, ';');
    }
    exit;
}

/* --------------------------------------------------------------- Datos --- */
$tab = $_GET['tab'] ?? 'resumen';
if (!empty($_GET['id'])) {
    $tab = 'solicitudes';
}
$periodo = array_key_exists($_GET['periodo'] ?? '', PERIODOS) ? $_GET['periodo'] : '30';
$desde = $periodo === 'todo' ? '0000-00-00' : date('Y-m-d H:i:s', time() - (int)$periodo * 86400);

$leads = [];
$detail = null;
$detailCitas = [];
$counts = array_fill_keys(array_keys(ESTADOS), 0);
$fuentes = [];
$resumen = [];
$porFuente = [];
$porCampana = [];
$porPalabra = [];
$proximas = [];
$pasadas = [];
$sinVincular = [];

if ($auth && $db) {
    foreach ($db->query('SELECT estado, COUNT(*) c FROM leads GROUP BY estado') as $r) {
        $counts[$r['estado']] = (int)$r['c'];
    }

    if ($tab === 'resumen') {
        $q = $db->prepare("SELECT
              COUNT(*) total,
              SUM(estado <> 'nuevo') contactadas,
              SUM(cita_inicio <> '' OR estado IN ('cita','sesion','no_asistio','cliente')) citas,
              SUM(estado IN ('sesion','cliente')) sesiones,
              SUM(estado = 'no_asistio') ausencias,
              SUM(estado = 'cliente') clientes,
              SUM(opcion = 'A') con_presupuesto
            FROM leads WHERE created_at >= ?");
        $q->execute([$desde]);
        $resumen = array_map('intval', $q->fetch() ?: []);

        $grupo = function (string $expr) use ($db, $desde): array {
            $q = $db->prepare("SELECT $expr AS clave,
                  COUNT(*) total,
                  SUM(cita_inicio <> '' OR estado IN ('cita','sesion','no_asistio','cliente')) citas,
                  SUM(estado IN ('sesion','cliente')) sesiones,
                  SUM(estado = 'cliente') clientes,
                  SUM(opcion = 'A') con_presupuesto
                FROM leads WHERE created_at >= ? GROUP BY clave ORDER BY total DESC LIMIT 25");
            $q->execute([$desde]);
            return $q->fetchAll();
        };
        $porFuente = $grupo("COALESCE(NULLIF(fuente,''),'directo') || CASE WHEN medio <> '' THEN ' · ' || medio ELSE '' END");
        $porCampana = $grupo("COALESCE(NULLIF(campana,''),'(sin campaña)') || CASE WHEN contenido <> '' THEN ' · ' || contenido ELSE '' END");
        $porPalabra = $grupo("COALESCE(NULLIF(palabra,''),'(sin palabra)')");

        $q = $db->prepare("SELECT c.*, l.empresa, l.telefono FROM citas c LEFT JOIN leads l ON l.id = c.lead_id
                           WHERE c.estado = 'reservada' AND c.inicio >= ? ORDER BY c.inicio LIMIT 5");
        $q->execute([gmdate('Y-m-d\TH:i:s', time() - 3600)]);
        $proximas = $q->fetchAll();
    }

    if ($tab === 'citas') {
        $q = $db->prepare("SELECT c.*, l.empresa, l.telefono FROM citas c LEFT JOIN leads l ON l.id = c.lead_id
                           WHERE c.estado = 'reservada' AND c.inicio >= ? ORDER BY c.inicio");
        $q->execute([gmdate('Y-m-d\TH:i:s', time() - 3600)]);
        $proximas = $q->fetchAll();
        $q = $db->prepare("SELECT c.*, l.empresa, l.telefono FROM citas c LEFT JOIN leads l ON l.id = c.lead_id
                           WHERE c.estado = 'reservada' AND c.inicio < ? ORDER BY c.inicio DESC LIMIT 60");
        $q->execute([gmdate('Y-m-d\TH:i:s', time() - 3600)]);
        $pasadas = $q->fetchAll();
        $sinVincular = $db->query("SELECT * FROM citas WHERE lead_id = 0 AND estado = 'reservada' ORDER BY inicio DESC LIMIT 20")->fetchAll();
    }

    if ($tab === 'solicitudes') {
        foreach ($db->query('SELECT fuente, COUNT(*) c FROM leads GROUP BY fuente ORDER BY c DESC') as $r) {
            $fuentes[$r['fuente']] = (int)$r['c'];
        }
        $where = [];
        $args = [];
        if (!empty($_GET['estado']) && isset(ESTADOS[$_GET['estado']])) {
            $where[] = 'estado = ?';
            $args[] = $_GET['estado'];
        }
        if (!empty($_GET['fuente'])) {
            $where[] = 'fuente = ?';
            $args[] = $_GET['fuente'];
        }
        if (!empty($_GET['opcion']) && in_array($_GET['opcion'], ['A', 'B'], true)) {
            $where[] = 'opcion = ?';
            $args[] = $_GET['opcion'];
        }
        if (!empty($_GET['q'])) {
            $where[] = '(empresa LIKE ? OR nombre LIKE ? OR telefono LIKE ? OR notas LIKE ? OR cliente_email LIKE ?)';
            array_push($args, ...array_fill(0, 5, '%' . $_GET['q'] . '%'));
        }
        $sql = 'SELECT * FROM leads' . ($where ? ' WHERE ' . implode(' AND ', $where) : '') . ' ORDER BY id DESC LIMIT 500';
        $q = $db->prepare($sql);
        $q->execute($args);
        $leads = $q->fetchAll();
        if (!empty($_GET['id'])) {
            $q = $db->prepare('SELECT * FROM leads WHERE id = ?');
            $q->execute([(int)$_GET['id']]);
            $detail = $q->fetch() ?: null;
            if ($detail) {
                $q = $db->prepare('SELECT * FROM citas WHERE lead_id = ? ORDER BY inicio DESC');
                $q->execute([(int)$detail['id']]);
                $detailCitas = $q->fetchAll();
            }
        }
    }
}
$total = array_sum($counts);
$back = $_SERVER['REQUEST_URI'] ?? '/panel/';

function cita_row(array $c, string $back, bool $pasada): string
{
    $empresa = $c['empresa'] ?? '';
    $html = '<div class="item cita">';
    $html .= '<div><div class="emp">' . h(fecha_cita($c['inicio'])) . '</div><div class="meta">'
        . ($empresa !== '' ? '<a href="/panel/?id=' . (int)$c['lead_id'] . '">' . h($empresa) . '</a> · ' : '<span class="warn">Sin solicitud</span> · ')
        . h($c['nombre'] ?: '—') . ' · ' . h($c['email'] ?: '—') . '</div>'
        . '<div class="meta">Recordatorios: 24 h ' . ($c['rec24'] ? '✓' : '—') . ' · 1 h ' . ($c['rec1'] ? '✓' : '—') . '</div></div>';
    $html .= '<div class="actions">';
    if (!$pasada && $c['meet_url'] !== '') {
        $html .= '<a class="btn" href="' . h($c['meet_url']) . '" target="_blank" rel="noopener">Abrir Meet</a>';
    }
    if ($pasada) {
        if ($c['asistencia'] === '') {
            foreach (['asistio' => 'Asistió', 'no_asistio' => 'No se presentó'] as $v => $l) {
                $html .= '<form method="post"><input type="hidden" name="action" value="asistencia"><input type="hidden" name="csrf" value="' . h(csrf()) . '">'
                    . '<input type="hidden" name="uid" value="' . h($c['uid']) . '"><input type="hidden" name="valor" value="' . $v . '">'
                    . '<input type="hidden" name="back" value="' . h($back) . '"><button class="btn ' . ($v === 'asistio' ? 'primary' : 'danger') . '">' . $l . '</button></form>';
            }
        } else {
            $html .= badge($c['asistencia'] === 'asistio' ? 'sesion' : 'no_asistio');
        }
    }
    return $html . '</div></div>';
}
?><!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Panel · PEBAI</title>
<link rel="icon" href="/favicon.ico" sizes="48x48">
<style>
:root{--bg:#0B0F14;--card:#121821;--line:#222A36;--text:#E8ECF2;--muted:#8A93A3;--lime:#B7FF3C;--violet:#6A5CFF}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
a{color:var(--lime);text-decoration:none}
.wrap{max-width:1180px;margin:0 auto;padding:20px 16px 60px}
header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;flex-wrap:wrap}
header h1{font-size:20px;margin:0}
header h1 span{color:var(--lime)}
nav.tabs{display:flex;gap:6px;margin-bottom:18px;border-bottom:1px solid var(--line);overflow-x:auto}
nav.tabs a{padding:10px 14px;color:var(--muted);font-weight:700;border-bottom:2px solid transparent;white-space:nowrap}
nav.tabs a.on{color:#fff;border-color:var(--lime)}
.btn{display:inline-block;border:1px solid var(--line);background:var(--card);color:var(--text);padding:8px 14px;border-radius:10px;font-weight:600;font-size:14px;cursor:pointer;font-family:inherit}
.btn.primary{background:var(--lime);border-color:var(--lime);color:#0B0F14}
.btn.wa{background:#25D366;border-color:#25D366;color:#0B0F14}
.btn.danger{border-color:#FF6B7A;color:#FF9AA5}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:16px}
.stat{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px 14px;color:var(--text)}
.stat b{display:block;font-size:26px}
.stat small{color:var(--muted)}
.stat em{display:block;font-style:normal;font-size:12px;color:var(--lime);margin-top:2px}
form.filters{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}
input,select,textarea{background:var(--card);color:var(--text);border:1px solid var(--line);border-radius:10px;padding:9px 12px;font:inherit}
textarea{width:100%;min-height:110px}
.list{display:flex;flex-direction:column;gap:8px}
.item{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px 14px;color:var(--text)}
.item.cita{grid-template-columns:1fr auto}
a.item:hover{border-color:var(--violet)}
.item .emp{font-weight:700}
.item .meta{color:var(--muted);font-size:13px}
.actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.actions form{margin:0}
.badge{display:inline-block;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:700;white-space:nowrap}
.opt{font-weight:800;font-size:12px;padding:3px 8px;border-radius:8px;border:1px solid var(--line)}
.opt.A{background:var(--lime);color:#0B0F14;border-color:var(--lime)}
.grid2{display:grid;grid-template-columns:1.2fr 1fr;gap:14px}
.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:18px;margin-bottom:14px}
.card h2{font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:var(--violet);margin:0 0 10px}
.kv{display:grid;grid-template-columns:auto 1fr;gap:6px 14px;margin:0}
.kv dt{color:var(--muted)}
.kv dd{margin:0;font-weight:600;word-break:break-word}
table.t{width:100%;border-collapse:collapse;font-size:14px}
table.t th{text-align:left;color:var(--muted);font-weight:600;padding:8px 6px;border-bottom:1px solid var(--line);white-space:nowrap}
table.t td{padding:9px 6px;border-bottom:1px solid #1A202B}
table.t td.n{text-align:right;font-variant-numeric:tabular-nums}
table.t th.n{text-align:right}
.bar{height:6px;border-radius:6px;background:#1A202B;overflow:hidden;margin-top:4px;min-width:60px}
.bar span{display:block;height:100%;background:linear-gradient(90deg,var(--violet),var(--lime))}
.tpl{display:flex;flex-wrap:wrap;gap:8px}
.muted{color:var(--muted)}
.warn{color:#FFB547}
.ok{background:#12301A;border:1px solid #25D366;color:#9EF0B8;padding:10px 14px;border-radius:10px;margin-bottom:12px}
.err{background:#3A1418;border:1px solid #FF5A6A;color:#FFC2C8;padding:10px 14px;border-radius:10px;margin-bottom:12px}
.login{max-width:360px;margin:12vh auto;background:var(--card);border:1px solid var(--line);border-radius:18px;padding:26px}
.login input{width:100%;margin:12px 0}
.scroll{overflow-x:auto}
@media (max-width:760px){.grid2{grid-template-columns:1fr}.item{grid-template-columns:1fr}.item.cita{grid-template-columns:1fr}.actions{justify-content:flex-start}}
</style>
</head>
<body>
<?php if ($dbError): ?><div class="wrap"><div class="err"><?= h($dbError) ?></div></div><?php endif; ?>

<?php if (!$auth): ?>
<form class="login" method="post">
  <h1 style="margin:0 0 4px;font-size:20px">Panel <span style="color:var(--lime)">PEBAI</span></h1>
  <p class="muted" style="margin:0">Solicitudes, citas y origen de cada cliente</p>
  <?php if ($error): ?><div class="err" style="margin-top:12px"><?= h($error) ?></div><?php endif; ?>
  <input type="hidden" name="action" value="login">
  <input type="password" name="password" placeholder="Contraseña" autocomplete="current-password" required autofocus>
  <button class="btn primary" style="width:100%">Entrar</button>
</form>

<?php else: ?>
<div class="wrap">
  <header>
    <h1>Panel <span>PEBAI</span></h1>
    <div><a class="btn" href="/panel/?csv=1">Exportar CSV</a> <a class="btn" href="/panel/?salir=1">Salir</a></div>
  </header>
  <nav class="tabs">
    <a href="/panel/?tab=resumen" class="<?= $tab === 'resumen' ? 'on' : '' ?>">Resumen</a>
    <a href="/panel/?tab=solicitudes" class="<?= $tab === 'solicitudes' ? 'on' : '' ?>">Solicitudes (<?= $total ?>)</a>
    <a href="/panel/?tab=citas" class="<?= $tab === 'citas' ? 'on' : '' ?>">Citas</a>
  </nav>

<?php if ($tab === 'resumen'): ?>
  <form class="filters" method="get">
    <input type="hidden" name="tab" value="resumen">
    <select name="periodo" onchange="this.form.submit()">
      <?php foreach (PERIODOS as $k => $l): ?><option value="<?= h($k) ?>" <?= $periodo === $k ? 'selected' : '' ?>><?= h($l) ?></option><?php endforeach; ?>
    </select>
  </form>
  <?php $t = $resumen['total'] ?? 0; ?>
  <div class="stats">
    <div class="stat"><b><?= $t ?></b><small>Solicitudes</small><em><?= $resumen['con_presupuesto'] ?? 0 ?> con presupuesto (A)</em></div>
    <div class="stat"><b><?= $resumen['contactadas'] ?? 0 ?></b><small>Contactadas</small><em><?= pct($resumen['contactadas'] ?? 0, $t) ?> de las solicitudes</em></div>
    <div class="stat"><b><?= $resumen['citas'] ?? 0 ?></b><small>Con cita</small><em><?= pct($resumen['citas'] ?? 0, $t) ?> de las solicitudes</em></div>
    <div class="stat"><b><?= $resumen['sesiones'] ?? 0 ?></b><small>Sesiones hechas</small><em><?= pct($resumen['sesiones'] ?? 0, $resumen['citas'] ?? 0) ?> de las citas</em></div>
    <div class="stat"><b><?= $resumen['ausencias'] ?? 0 ?></b><small>No se presentaron</small><em><?= pct($resumen['ausencias'] ?? 0, $resumen['citas'] ?? 0) ?> de las citas</em></div>
    <div class="stat"><b><?= $resumen['clientes'] ?? 0 ?></b><small>Clientes</small><em><?= pct($resumen['clientes'] ?? 0, $t) ?> de las solicitudes</em></div>
  </div>

  <?php if ($proximas): ?>
  <div class="card"><h2>Próximas citas</h2><div class="list">
    <?php foreach ($proximas as $c) { echo cita_row($c, $back, false); } ?>
  </div><p style="margin:10px 0 0"><a href="/panel/?tab=citas">Ver todas las citas →</a></p></div>
  <?php endif; ?>

  <?php foreach (['De dónde vienen (fuente · medio)' => $porFuente, 'Campaña · contenido' => $porCampana, 'Palabra clave (comentarios)' => $porPalabra] as $titulo => $filas): ?>
  <div class="card scroll"><h2><?= h($titulo) ?></h2>
    <?php if (!$filas): ?><p class="muted">Todavía no hay solicitudes en este periodo.</p><?php else: ?>
    <?php $max = max(array_map(fn($r) => (int)$r['total'], $filas)) ?: 1; ?>
    <table class="t"><thead><tr><th>Origen</th><th class="n">Solicitudes</th><th class="n">Con presupuesto</th><th class="n">Citas</th><th class="n">Sesiones</th><th class="n">Clientes</th><th class="n">% a cita</th></tr></thead><tbody>
    <?php foreach ($filas as $r): ?>
      <tr><td><?= h($r['clave']) ?><div class="bar"><span style="width:<?= round((int)$r['total'] * 100 / $max) ?>%"></span></div></td>
      <td class="n"><?= (int)$r['total'] ?></td><td class="n"><?= (int)$r['con_presupuesto'] ?></td><td class="n"><?= (int)$r['citas'] ?></td>
      <td class="n"><?= (int)$r['sesiones'] ?></td><td class="n"><?= (int)$r['clientes'] ?></td><td class="n"><?= pct((int)$r['citas'], (int)$r['total']) ?></td></tr>
    <?php endforeach; ?></tbody></table>
    <?php endif; ?>
  </div>
  <?php endforeach; ?>

<?php elseif ($tab === 'citas'): ?>
  <div class="card"><h2>Próximas</h2>
    <?php if (!$proximas): ?><p class="muted">No hay citas próximas.</p><?php endif; ?>
    <div class="list"><?php foreach ($proximas as $c) { echo cita_row($c, $back, false); } ?></div>
  </div>
  <div class="card"><h2>Pasadas · marca si asistió</h2>
    <?php if (!$pasadas): ?><p class="muted">Aún no hay citas pasadas.</p><?php endif; ?>
    <div class="list"><?php foreach ($pasadas as $c) { echo cita_row($c, $back, true); } ?></div>
  </div>
  <?php if ($sinVincular): ?>
  <div class="card"><h2>Citas sin solicitud</h2>
    <p class="muted" style="margin-top:0">Reservas hechas sin el enlace del panel. Escribe el número de solicitud para unirlas.</p>
    <div class="list">
    <?php foreach ($sinVincular as $c): ?>
      <div class="item cita"><div><div class="emp"><?= h(fecha_cita($c['inicio'])) ?></div><div class="meta"><?= h($c['nombre'] ?: '—') ?> · <?= h($c['email'] ?: '—') ?></div></div>
      <form method="post" class="actions"><input type="hidden" name="action" value="vincular"><input type="hidden" name="csrf" value="<?= h(csrf()) ?>">
        <input type="hidden" name="uid" value="<?= h($c['uid']) ?>"><input type="hidden" name="back" value="<?= h($back) ?>">
        <input type="number" name="lead_id" placeholder="Nº solicitud" min="1" style="width:130px" required><button class="btn primary">Unir</button></form></div>
    <?php endforeach; ?>
    </div>
  </div>
  <?php endif; ?>

<?php elseif ($detail): ?>
    <?php
      $bookingUrl = pebai_booking_url((int)$detail['id']);
      $plantillas = [
          ['Aceptado · enviar enlace', 'primary', 'Hola, somos PEBAI Systems. Hemos revisado vuestra solicitud y encaja con lo que hacemos. Aquí podéis elegir día y hora para la sesión técnica de 25 minutos por videollamada: ' . $bookingUrl],
          ['Seguimiento (no responde)', '', 'Hola de nuevo, somos PEBAI Systems. Os escribimos por vuestra solicitud de consultoría. Si os viene bien, aquí podéis elegir día y hora para la sesión técnica: ' . $bookingUrl . ' ¡Cualquier duda, respondednos aquí!'],
          ['No se presentó · reprogramar', '', 'Hola, somos PEBAI Systems. Hoy no pudimos coincidir en la sesión técnica. Si seguís interesados, podéis elegir otro día y hora aquí: ' . $bookingUrl],
          ['No encaja', 'danger', 'Hola, somos PEBAI Systems. Gracias por enviarnos vuestra solicitud. La hemos revisado con calma y, ahora mismo, no es el tipo de proyecto en el que podamos aportar un resultado claro. Si en el futuro cambia vuestra situación, estaremos encantados de volver a hablar. ¡Mucho éxito!'],
      ];
    ?>
    <p><a href="/panel/?tab=solicitudes">← Volver a la lista</a></p>
    <?php if (!empty($_GET['ok'])): ?><div class="ok">Cambios guardados.</div><?php endif; ?>
    <div class="grid2">
      <div>
        <div class="card">
          <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap">
            <div>
              <div style="font-size:24px;font-weight:800"><?= h($detail['empresa']) ?></div>
              <div class="muted">#<?= (int)$detail['id'] ?> · <?= h(pebai_fecha($detail['created_at'])) ?></div>
            </div>
            <div><?= badge($detail['estado']) ?> <span class="opt <?= h($detail['opcion']) ?>">Opción <?= h($detail['opcion'] ?: '—') ?></span></div>
          </div>
          <p style="margin:16px 0 8px"><a class="btn wa" href="https://wa.me/<?= h(pebai_phone_digits($detail['telefono'])) ?>" target="_blank" rel="noopener">Abrir WhatsApp · <?= h($detail['telefono']) ?></a>
          <button class="btn" type="button" onclick="navigator.clipboard.writeText('<?= h($bookingUrl) ?>').then(()=>{this.textContent='Enlace copiado'})">Copiar enlace de reserva</button></p>
          <div class="muted" style="font-size:13px;margin:12px 0 6px">Mensajes de WhatsApp listos para enviar:</div>
          <div class="tpl">
            <?php foreach ($plantillas as [$label, $cls, $texto]): ?>
              <a class="btn <?= $cls ?>" href="<?= h(wa_link($detail['telefono'], $texto)) ?>" target="_blank" rel="noopener"><?= h($label) ?></a>
            <?php endforeach; ?>
          </div>
        </div>
        <?php foreach ($detailCitas as $c): ?>
        <div class="card" style="border-color:<?= $c['estado'] === 'reservada' ? '#25D366' : '#3A404D' ?>">
          <h2>Cita <?= $c['estado'] === 'reservada' ? '' : '(' . h($c['estado']) . ')' ?></h2>
          <dl class="kv">
            <dt>Cuándo</dt><dd><?= h(fecha_cita($c['inicio'])) ?></dd>
            <dt>Persona</dt><dd><?= h($c['nombre'] ?: '—') ?></dd>
            <dt>Email</dt><dd><?= h($c['email'] ?: '—') ?></dd>
            <dt>Recordatorios</dt><dd>24 h <?= $c['rec24'] ? '✓' : '—' ?> · 1 h <?= $c['rec1'] ? '✓' : '—' ?></dd>
            <?php if ($c['asistencia']): ?><dt>Asistencia</dt><dd><?= badge($c['asistencia'] === 'asistio' ? 'sesion' : 'no_asistio') ?></dd><?php endif; ?>
          </dl>
          <?php if ($c['estado'] === 'reservada'): ?>
          <div class="actions" style="justify-content:flex-start;margin-top:12px">
            <?php if ($c['meet_url']): ?><a class="btn" href="<?= h($c['meet_url']) ?>" target="_blank" rel="noopener">Abrir Meet</a><?php endif; ?>
            <?php if (strtotime($c['inicio']) < time() && $c['asistencia'] === ''): ?>
              <?php foreach (['asistio' => 'Asistió', 'no_asistio' => 'No se presentó'] as $v => $l): ?>
              <form method="post"><input type="hidden" name="action" value="asistencia"><input type="hidden" name="csrf" value="<?= h(csrf()) ?>">
                <input type="hidden" name="uid" value="<?= h($c['uid']) ?>"><input type="hidden" name="valor" value="<?= $v ?>">
                <input type="hidden" name="back" value="<?= h($back) ?>"><button class="btn <?= $v === 'asistio' ? 'primary' : 'danger' ?>"><?= $l ?></button></form>
              <?php endforeach; ?>
            <?php endif; ?>
          </div>
          <?php endif; ?>
        </div>
        <?php endforeach; ?>
        <div class="card">
          <h2>Respuestas</h2>
          <dl class="kv">
            <dt>Canal</dt><dd><?= h($detail['canal'] ?: '—') ?></dd>
            <dt>Consultas/mes</dt><dd><?= h($detail['volumen'] ?: '—') ?></dd>
            <dt>Objetivo</dt><dd><?= h($detail['objetivo'] ?: '—') ?></dd>
            <dt>Presupuesto</dt><dd><?= h($detail['presupuesto'] ?: '—') ?></dd>
          </dl>
        </div>
        <form class="card" method="post">
          <h2>Seguimiento</h2>
          <input type="hidden" name="action" value="update">
          <input type="hidden" name="csrf" value="<?= h(csrf()) ?>">
          <input type="hidden" name="id" value="<?= (int)$detail['id'] ?>">
          <select name="estado" style="width:100%;margin-bottom:10px">
            <?php foreach (ESTADOS as $k => $e): ?>
              <option value="<?= h($k) ?>" <?= $detail['estado'] === $k ? 'selected' : '' ?>><?= h($e[0]) ?></option>
            <?php endforeach; ?>
          </select>
          <textarea name="notas" placeholder="Notas internas (qué se habló, próximos pasos…)"><?= h($detail['notas']) ?></textarea>
          <p style="margin:10px 0 0"><button class="btn primary">Guardar</button>
          <?php if ($detail['updated_at']): ?><span class="muted"> Última edición: <?= h(date('d/m/Y H:i', strtotime($detail['updated_at']))) ?></span><?php endif; ?></p>
        </form>
      </div>
      <div>
        <div class="card">
          <h2>De dónde viene</h2>
          <dl class="kv">
            <dt>Fuente</dt><dd><?= h($detail['fuente'] ?: '—') ?></dd>
            <dt>Medio</dt><dd><?= h($detail['medio'] ?: '—') ?></dd>
            <dt>Campaña</dt><dd><?= h($detail['campana'] ?: '—') ?></dd>
            <dt>Contenido</dt><dd><?= h($detail['contenido'] ?: '—') ?></dd>
            <dt>Palabra</dt><dd><?= h($detail['palabra'] ?: '—') ?></dd>
            <dt>Botón</dt><dd><?= h($detail['cta'] ?: '—') ?></dd>
          </dl>
        </div>
        <div class="card"><h2>Último toque</h2><?= touch_table($detail['ultimo_toque']) ?></div>
        <div class="card"><h2>Primer toque</h2><?= touch_table($detail['primer_toque']) ?></div>
        <div class="card"><h2>Técnico</h2>
          <dl class="kv">
            <dt>Formulario</dt><dd><?= h($detail['pagina'] ?: '—') ?></dd>
            <dt>Dispositivo</dt><dd><?= h($detail['dispositivo'] ?: '—') ?></dd>
            <dt>Email enviado</dt><dd><?= $detail['email_enviado'] ? 'Sí' : 'No' ?></dd>
          </dl>
        </div>
      </div>
    </div>

<?php else: ?>
    <div class="stats">
      <?php foreach (ESTADOS as $k => $e): ?>
        <a class="stat" href="/panel/?tab=solicitudes&estado=<?= h($k) ?>"><b style="color:<?= $e[1] === '#3A404D' ? 'var(--muted)' : $e[1] ?>"><?= $counts[$k] ?></b><small><?= h($e[0]) ?></small></a>
      <?php endforeach; ?>
    </div>
    <form class="filters" method="get">
      <input type="hidden" name="tab" value="solicitudes">
      <input type="search" name="q" value="<?= h($_GET['q'] ?? '') ?>" placeholder="Buscar empresa, teléfono, email, notas…">
      <select name="estado">
        <option value="">Todos los estados</option>
        <?php foreach (ESTADOS as $k => $e): ?><option value="<?= h($k) ?>" <?= ($_GET['estado'] ?? '') === $k ? 'selected' : '' ?>><?= h($e[0]) ?></option><?php endforeach; ?>
      </select>
      <select name="fuente">
        <option value="">Todas las fuentes</option>
        <?php foreach ($fuentes as $f => $c): ?><option value="<?= h($f) ?>" <?= ($_GET['fuente'] ?? '') === $f ? 'selected' : '' ?>><?= h(($f ?: 'sin fuente') . " ($c)") ?></option><?php endforeach; ?>
      </select>
      <select name="opcion">
        <option value="">Con y sin presupuesto</option>
        <option value="A" <?= ($_GET['opcion'] ?? '') === 'A' ? 'selected' : '' ?>>Opción A · con presupuesto</option>
        <option value="B" <?= ($_GET['opcion'] ?? '') === 'B' ? 'selected' : '' ?>>Opción B · explorando</option>
      </select>
      <button class="btn primary">Filtrar</button>
      <a class="btn" href="/panel/?tab=solicitudes">Limpiar</a>
    </form>
    <div class="list">
      <?php if (!$leads): ?><p class="muted">Todavía no hay solicitudes con estos filtros.</p><?php endif; ?>
      <?php foreach ($leads as $l): ?>
        <a class="item" href="/panel/?id=<?= (int)$l['id'] ?>">
          <div><span class="opt <?= h($l['opcion']) ?>"><?= h($l['opcion'] ?: '—') ?></span></div>
          <div>
            <div class="emp"><?= h($l['empresa']) ?> <span class="muted" style="font-weight:400">· #<?= (int)$l['id'] ?> · <?= h($l['telefono']) ?></span></div>
            <div class="meta"><?= h(pebai_fecha($l['created_at'])) ?> · <?= h($l['fuente'] ?: 'sin fuente') ?><?= $l['palabra'] ? ' · ' . h($l['palabra']) : '' ?> · <?= h($l['objetivo']) ?></div>
            <?php if (!empty($l['cita_inicio']) && $l['cita_estado'] !== 'cancelada'): ?>
              <div class="meta" style="color:#25D366;font-weight:700">📅 Cita: <?= h(fecha_cita($l['cita_inicio'])) ?></div>
            <?php endif; ?>
          </div>
          <div><?= badge($l['estado']) ?></div>
        </a>
      <?php endforeach; ?>
    </div>
<?php endif; ?>
</div>
<?php endif; ?>
</body>
</html>
