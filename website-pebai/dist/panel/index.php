<?php
/*
 * PEBAI · Panel privado de solicitudes del formulario de diagnóstico.
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
    'cliente' => ['Cliente', '#FFB547', '#0B0F14'],
    'descartado' => ['Descartado', '#3A404D', '#C9CED8'],
];

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
        header('Location: ' . self_url());
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

/* ---------------------------------------------------- Actualizar lead --- */
if ($auth && $db && isset($_POST['action']) && $_POST['action'] === 'update') {
    check_csrf();
    $estado = array_key_exists($_POST['estado'] ?? '', ESTADOS) ? $_POST['estado'] : 'nuevo';
    $notas = mb_substr(trim($_POST['notas'] ?? ''), 0, 5000);
    $db->prepare('UPDATE leads SET estado = ?, notas = ?, updated_at = ? WHERE id = ?')
        ->execute([$estado, $notas, date('Y-m-d H:i:s'), (int)$_POST['id']]);
    header('Location: ' . self_url(['id' => (int)$_POST['id'], 'ok' => 1]));
    exit;
}

/* ------------------------------------------------------- Exportar CSV --- */
if ($auth && $db && isset($_GET['csv'])) {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="solicitudes-pebai-' . date('Y-m-d') . '.csv"');
    $out = fopen('php://output', 'w');
    fwrite($out, "\xEF\xBB\xBF");
    $cols = ['id', 'created_at', 'estado', 'empresa', 'nombre', 'telefono', 'canal', 'volumen', 'objetivo', 'presupuesto',
             'opcion', 'fuente', 'medio', 'campana', 'contenido', 'palabra', 'cta', 'notas'];
    fputcsv($out, $cols, ';');
    foreach ($db->query('SELECT ' . implode(',', $cols) . ' FROM leads ORDER BY id DESC') as $r) {
        fputcsv($out, $r, ';');
    }
    exit;
}

/* --------------------------------------------------------------- Datos --- */
$leads = [];
$detail = null;
$counts = array_fill_keys(array_keys(ESTADOS), 0);
$fuentes = [];
if ($auth && $db) {
    foreach ($db->query('SELECT estado, COUNT(*) c FROM leads GROUP BY estado') as $r) {
        $counts[$r['estado']] = (int)$r['c'];
    }
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
        $where[] = '(empresa LIKE ? OR nombre LIKE ? OR telefono LIKE ? OR notas LIKE ?)';
        array_push($args, ...array_fill(0, 4, '%' . $_GET['q'] . '%'));
    }
    $sql = 'SELECT * FROM leads' . ($where ? ' WHERE ' . implode(' AND ', $where) : '') . ' ORDER BY id DESC LIMIT 500';
    $q = $db->prepare($sql);
    $q->execute($args);
    $leads = $q->fetchAll();
    if (!empty($_GET['id'])) {
        $q = $db->prepare('SELECT * FROM leads WHERE id = ?');
        $q->execute([(int)$_GET['id']]);
        $detail = $q->fetch() ?: null;
    }
}
$total = array_sum($counts);

function badge(string $estado): string
{
    [$label, $bg, $fg] = ESTADOS[$estado] ?? ESTADOS['nuevo'];
    return '<span class="badge" style="background:' . $bg . ';color:' . $fg . '">' . h($label) . '</span>';
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
?><!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Panel de solicitudes · PEBAI</title>
<link rel="icon" href="/favicon.ico" sizes="48x48">
<style>
:root{--bg:#0B0F14;--card:#121821;--line:#222A36;--text:#E8ECF2;--muted:#8A93A3;--lime:#B7FF3C;--violet:#6A5CFF}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
a{color:var(--lime);text-decoration:none}
.wrap{max-width:1180px;margin:0 auto;padding:20px 16px 60px}
header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px}
header h1{font-size:20px;margin:0}
header h1 span{color:var(--lime)}
.btn{display:inline-block;border:1px solid var(--line);background:var(--card);color:var(--text);padding:8px 14px;border-radius:10px;font-weight:600;font-size:14px;cursor:pointer}
.btn.primary{background:var(--lime);border-color:var(--lime);color:#0B0F14}
.btn.wa{background:#25D366;border-color:#25D366;color:#0B0F14}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:16px}
.stat{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px 14px}
.stat b{display:block;font-size:24px}
.stat small{color:var(--muted)}
form.filters{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}
input,select,textarea{background:var(--card);color:var(--text);border:1px solid var(--line);border-radius:10px;padding:9px 12px;font:inherit}
textarea{width:100%;min-height:110px}
.list{display:flex;flex-direction:column;gap:8px}
.item{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px 14px;color:var(--text)}
.item:hover{border-color:var(--violet)}
.item .emp{font-weight:700}
.item .meta{color:var(--muted);font-size:13px}
.badge{display:inline-block;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:700;white-space:nowrap}
.opt{font-weight:800;font-size:12px;padding:3px 8px;border-radius:8px;border:1px solid var(--line)}
.opt.A{background:var(--lime);color:#0B0F14;border-color:var(--lime)}
.detail{display:grid;grid-template-columns:1.2fr 1fr;gap:14px}
.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:18px}
.card h2{font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:var(--violet);margin:0 0 10px}
.kv{display:grid;grid-template-columns:auto 1fr;gap:6px 14px;margin:0}
.kv dt{color:var(--muted)}
.kv dd{margin:0;font-weight:600;word-break:break-word}
.muted{color:var(--muted)}
.ok{background:#12301A;border:1px solid #25D366;color:#9EF0B8;padding:10px 14px;border-radius:10px;margin-bottom:12px}
.err{background:#3A1418;border:1px solid #FF5A6A;color:#FFC2C8;padding:10px 14px;border-radius:10px;margin-bottom:12px}
.login{max-width:360px;margin:12vh auto;background:var(--card);border:1px solid var(--line);border-radius:18px;padding:26px}
.login input{width:100%;margin:12px 0}
@media (max-width:760px){.detail{grid-template-columns:1fr}.item{grid-template-columns:1fr}.item>div:last-child{justify-self:start}}
</style>
</head>
<body>
<?php if ($dbError): ?><div class="wrap"><div class="err"><?= h($dbError) ?></div></div><?php endif; ?>

<?php if (!$auth): ?>
<form class="login" method="post">
  <h1 style="margin:0 0 4px;font-size:20px">Panel <span style="color:var(--lime)">PEBAI</span></h1>
  <p class="muted" style="margin:0">Solicitudes del formulario de diagnóstico</p>
  <?php if ($error): ?><div class="err" style="margin-top:12px"><?= h($error) ?></div><?php endif; ?>
  <input type="hidden" name="action" value="login">
  <input type="password" name="password" placeholder="Contraseña" autocomplete="current-password" required autofocus>
  <button class="btn primary" style="width:100%">Entrar</button>
</form>

<?php else: ?>
<div class="wrap">
  <header>
    <h1>Panel <span>PEBAI</span> · Solicitudes</h1>
    <div><a class="btn" href="<?= h(self_url(['csv' => 1, 'id' => null])) ?>">Exportar CSV</a> <a class="btn" href="/panel/?salir=1">Salir</a></div>
  </header>

  <?php if ($detail): ?>
    <p><a href="<?= h(self_url(['id' => null, 'ok' => null])) ?>">← Volver a la lista</a></p>
    <?php if (!empty($_GET['ok'])): ?><div class="ok">Cambios guardados.</div><?php endif; ?>
    <div class="detail">
      <div>
        <div class="card" style="margin-bottom:14px">
          <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap">
            <div>
              <div style="font-size:24px;font-weight:800"><?= h($detail['empresa']) ?></div>
              <div class="muted">#<?= (int)$detail['id'] ?> · <?= h(pebai_fecha($detail['created_at'])) ?></div>
            </div>
            <div><?= badge($detail['estado']) ?> <span class="opt <?= h($detail['opcion']) ?>">Opción <?= h($detail['opcion'] ?: '—') ?></span></div>
          </div>
          <?php
            $bookingUrl = 'https://pebaisystems.es/reservar/?s=' . (int)$detail['id'];
            $waText = 'Hola, somos PEBAI Systems. Hemos revisado vuestra solicitud y encaja con lo que hacemos. '
                . 'Aquí podéis elegir día y hora para la sesión técnica de 25 minutos: ' . $bookingUrl;
          ?>
          <p style="margin:16px 0 0;display:flex;flex-wrap:wrap;gap:8px">
            <a class="btn wa" href="https://wa.me/<?= h(pebai_phone_digits($detail['telefono'])) ?>" target="_blank" rel="noopener">WhatsApp · <?= h($detail['telefono']) ?></a>
            <a class="btn primary" href="https://wa.me/<?= h(pebai_phone_digits($detail['telefono'])) ?>?text=<?= h(rawurlencode($waText)) ?>" target="_blank" rel="noopener">Enviar enlace de reserva</a>
            <button class="btn" type="button" onclick="navigator.clipboard.writeText('<?= h($bookingUrl) ?>').then(()=>{this.textContent='Enlace copiado'})">Copiar enlace</button>
          </p>
        </div>
        <?php if (!empty($detail['cita_inicio'])): ?>
        <div class="card" style="margin-bottom:14px;border-color:<?= $detail['cita_estado'] === 'cancelada' ? '#FF5A6A' : '#25D366' ?>">
          <h2>Cita</h2>
          <dl class="kv">
            <dt>Estado</dt><dd><?= h(ucfirst($detail['cita_estado'])) ?></dd>
            <dt>Cuándo</dt><dd><?= h(pebai_fecha(date('Y-m-d H:i:s', strtotime($detail['cita_inicio'])))) ?></dd>
            <dt>Persona</dt><dd><?= h($detail['cliente_nombre'] ?: '—') ?></dd>
            <dt>Email</dt><dd><?= h($detail['cliente_email'] ?: '—') ?></dd>
          </dl>
        </div>
        <?php endif; ?>
        <div class="card" style="margin-bottom:14px">
          <h2>Respuestas</h2>
          <dl class="kv">
            <dt>Nombre</dt><dd><?= h($detail['nombre'] ?: '—') ?></dd>
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
        <div class="card" style="margin-bottom:14px">
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
        <div class="card" style="margin-bottom:14px"><h2>Último toque</h2><?= touch_table($detail['ultimo_toque']) ?></div>
        <div class="card" style="margin-bottom:14px"><h2>Primer toque</h2><?= touch_table($detail['primer_toque']) ?></div>
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
      <a class="stat" href="<?= h(self_url(['estado' => null])) ?>" style="color:var(--text)"><b><?= $total ?></b><small>Total</small></a>
      <?php foreach (ESTADOS as $k => $e): ?>
        <a class="stat" href="<?= h(self_url(['estado' => $k])) ?>" style="color:var(--text)"><b style="color:<?= $e[1] === '#3A404D' ? 'var(--muted)' : $e[1] ?>"><?= $counts[$k] ?></b><small><?= h($e[0]) ?></small></a>
      <?php endforeach; ?>
    </div>

    <form class="filters" method="get">
      <input type="search" name="q" value="<?= h($_GET['q'] ?? '') ?>" placeholder="Buscar empresa, teléfono, notas…">
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
      <a class="btn" href="/panel/">Limpiar</a>
    </form>

    <div class="list">
      <?php if (!$leads): ?><p class="muted">Todavía no hay solicitudes con estos filtros.</p><?php endif; ?>
      <?php foreach ($leads as $l): ?>
        <a class="item" href="<?= h(self_url(['id' => $l['id']])) ?>">
          <div><span class="opt <?= h($l['opcion']) ?>"><?= h($l['opcion'] ?: '—') ?></span></div>
          <div>
            <div class="emp"><?= h($l['empresa']) ?> <span class="muted" style="font-weight:400">· <?= h($l['telefono']) ?></span></div>
            <div class="meta"><?= h(pebai_fecha($l['created_at'])) ?> · <?= h($l['fuente'] ?: 'sin fuente') ?><?= $l['palabra'] ? ' · ' . h($l['palabra']) : '' ?> · <?= h($l['objetivo']) ?></div>
            <?php if (!empty($l['cita_inicio']) && $l['cita_estado'] !== 'cancelada'): ?>
              <div class="meta" style="color:#25D366;font-weight:700">📅 Cita: <?= h(pebai_fecha(date('Y-m-d H:i:s', strtotime($l['cita_inicio'])))) ?></div>
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
