<?php
/*
 * PEBAI · Panel privado del embudo (panel.pebaisystems.es).
 * Resumen por origen, solicitudes y citas. Acceso con contraseña (hash en private/config.php).
 *
 * Sirve igual como raíz del subdominio (carpeta public_html/panel como document root)
 * que en https://pebaisystems.es/panel/ mientras el subdominio no exista: BASE lo decide.
 * La interfaz es assets/panel.js; este archivo autentica, sirve los datos (?data=1)
 * y aplica las acciones (POST action=update|asistencia|vincular).
 */
require dirname(__DIR__) . '/api/_pebai_lib.php';

header('X-Robots-Tag: noindex, nofollow');
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');
header('Cache-Control: no-store');

const PANEL_HOST = 'panel.pebaisystems.es';
$host = strtolower($_SERVER['HTTP_HOST'] ?? '');
define('BASE', $host === PANEL_HOST ? '/' : '/panel/');

// Cuando el subdominio ya resuelve, la ruta antigua /panel/ redirige a él (los emails enlazan a /panel/?id=N).
if (BASE !== '/' && $_SERVER['REQUEST_METHOD'] === 'GET' && in_array($host, ['pebaisystems.es', 'www.pebaisystems.es'], true)
    && gethostbyname(PANEL_HOST) !== PANEL_HOST) {
    header('Location: https://' . PANEL_HOST . '/' . (($_SERVER['QUERY_STRING'] ?? '') !== '' ? '?' . $_SERVER['QUERY_STRING'] : ''), true, 302);
    exit;
}

session_name('pebai_panel');
session_set_cookie_params(['lifetime' => 0, 'path' => BASE, 'secure' => true, 'httponly' => true, 'samesite' => 'Strict']);
session_start();

const ESTADOS = ['nuevo', 'contactado', 'cita', 'sesion', 'no_asistio', 'cliente', 'descartado'];

function csrf(): string
{
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(16));
    }
    return $_SESSION['csrf'];
}

function json_out(array $data, int $code = 200): void
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
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
        $next = (string)($_POST['next'] ?? '');
        header('Location: ' . BASE . ($next !== '' && $next[0] === '?' && strlen($next) < 200 ? $next : ''));
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
    header('Location: ' . BASE);
    exit;
}

$auth = !empty($_SESSION['auth']);
if (!$auth && (isset($_GET['data']) || (isset($_POST['action']) && $_POST['action'] !== 'login'))) {
    json_out(['ok' => false, 'error' => 'Sesión caducada. Recarga la página.'], 401);
}

/* ------------------------------------------------------------ Acciones (JSON) --- */
if ($auth && isset($_POST['action']) && $_POST['action'] !== 'login') {
    if (!$db) {
        json_out(['ok' => false, 'error' => $dbError], 500);
    }
    if (!hash_equals($_SESSION['csrf'] ?? '', $_POST['csrf'] ?? '')) {
        json_out(['ok' => false, 'error' => 'Sesión caducada. Recarga la página.'], 400);
    }
    $now = date('Y-m-d H:i:s');
    switch ($_POST['action']) {
        case 'update':
            $estado = in_array($_POST['estado'] ?? '', ESTADOS, true) ? $_POST['estado'] : 'nuevo';
            $notas = mb_substr(trim($_POST['notas'] ?? ''), 0, 5000);
            $db->prepare('UPDATE leads SET estado = ?, notas = ?, updated_at = ? WHERE id = ?')
                ->execute([$estado, $notas, $now, (int)($_POST['id'] ?? 0)]);
            json_out(['ok' => true]);
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
            json_out(['ok' => true]);
        case 'vincular':
            $uid = (string)($_POST['uid'] ?? '');
            $leadId = (int)($_POST['lead_id'] ?? 0);
            $q = $db->prepare('SELECT COUNT(*) FROM leads WHERE id = ?');
            $q->execute([$leadId]);
            if (!$leadId || (int)$q->fetchColumn() !== 1) {
                json_out(['ok' => false, 'error' => 'No existe la solicitud #' . $leadId . '.'], 404);
            }
            $db->prepare('UPDATE citas SET lead_id = ?, updated_at = ? WHERE uid = ?')->execute([$leadId, $now, $uid]);
            $q = $db->prepare('SELECT * FROM citas WHERE uid = ?');
            $q->execute([$uid]);
            if ($cita = $q->fetch()) {
                pebai_cita_sync_lead($cita);
            }
            json_out(['ok' => true]);
    }
    json_out(['ok' => false, 'error' => 'Acción desconocida.'], 400);
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

/* --------------------------------------------------------- Datos (JSON) --- */
if ($auth && isset($_GET['data'])) {
    if (!$db) {
        json_out(['ok' => false, 'error' => $dbError], 500);
    }
    $cols = ['id', 'created_at', 'estado', 'notas', 'empresa', 'nombre', 'telefono', 'canal', 'volumen', 'objetivo', 'presupuesto', 'opcion',
             'fuente', 'medio', 'campana', 'contenido', 'palabra', 'cta', 'primer_toque', 'ultimo_toque', 'pagina', 'dispositivo',
             'email_enviado', 'updated_at', 'cita_inicio', 'cita_fin', 'cita_uid', 'cita_estado', 'cliente_nombre', 'cliente_email'];
    $leads = $db->query('SELECT ' . implode(',', $cols) . ' FROM leads ORDER BY id DESC LIMIT 3000')->fetchAll();
    foreach ($leads as &$l) {
        $l['id'] = (int)$l['id'];
        $l['email_enviado'] = (int)$l['email_enviado'];
        $l['booking_url'] = pebai_booking_url($l['id']);
    }
    unset($l);
    $citas = $db->query('SELECT * FROM citas ORDER BY inicio DESC LIMIT 3000')->fetchAll();
    foreach ($citas as &$c) {
        $c['lead_id'] = (int)$c['lead_id'];
        $c['rec24'] = (int)$c['rec24'];
        $c['rec1'] = (int)$c['rec1'];
    }
    unset($c);
    json_out(['ok' => true, 'ahora' => date('Y-m-d H:i:s'), 'ahora_utc' => gmdate('Y-m-d\TH:i:s\Z'), 'csrf' => csrf(), 'leads' => $leads, 'citas' => $citas]);
}

$v = '1';
$next = ($_SERVER['QUERY_STRING'] ?? '') !== '' ? '?' . $_SERVER['QUERY_STRING'] : '';
?><!doctype html>
<html lang="es" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<meta name="theme-color" content="#070911">
<title>Panel · PEBAI</title>
<link rel="icon" href="<?= BASE ?>assets/favicon.svg" type="image/svg+xml">
<link rel="preload" href="<?= BASE ?>assets/Manrope-latin-variable.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
<link rel="stylesheet" href="<?= BASE ?>assets/panel.css?v=<?= $v ?>">
<script>try{var t=localStorage.getItem('pebai-panel-theme');if(t)document.documentElement.dataset.theme=t}catch(e){}</script>
</head>
<body>
<div class="pb-bg"><i></i><i></i><i></i></div>
<?php if ($dbError): ?><div class="pb-shell"><div class="pb-err"><?= h($dbError) ?></div></div><?php endif; ?>

<?php if (!$auth): ?>
<main class="pb-login-wrap">
  <form class="pb-login" method="post" action="<?= BASE ?>">
    <div class="pb-brand"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M9 28 L18 11 L31 11 L22 28 Z" fill="#B7FF3C"/><path d="M19 28 L25 17 L31 17 L25 28 Z" fill="#6A5CFF"/></svg><span class="t">PEBAI</span></div>
    <h1>Panel del <i>embudo</i></h1>
    <p class="muted">Solicitudes, citas y origen de cada cliente.</p>
    <?php if ($error): ?><div class="pb-err"><?= h($error) ?></div><?php endif; ?>
    <input type="hidden" name="action" value="login">
    <input type="hidden" name="next" value="<?= h($next) ?>">
    <label class="pb-field"><span>Contraseña</span><input type="password" name="password" autocomplete="current-password" required autofocus></label>
    <button class="pb-btn primary wide" type="submit">Entrar</button>
  </form>
</main>

<?php else: ?>
<div class="pb-shell" id="pb-app" data-base="<?= h(BASE) ?>" data-csrf="<?= h(csrf()) ?>">

  <div class="pb-top">
    <a class="pb-brand" href="<?= BASE ?>" aria-label="Panel PEBAI">
      <svg viewBox="0 0 40 40" aria-hidden="true"><path d="M9 28 L18 11 L31 11 L22 28 Z" fill="#B7FF3C"/><path d="M19 28 L25 17 L31 17 L25 28 Z" fill="#6A5CFF"/></svg>
      <span class="t">PEBAI</span>
    </a>
    <div class="pb-seg" id="pb-periodo" aria-label="Periodo">
      <button data-p="7">7 días</button><button data-p="30">30 días</button><button data-p="90">90 días</button><button data-p="todo">Todo</button>
    </div>
    <button class="pb-btn icon" id="pb-theme" title="Cambiar tema" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z"/></svg></button>
    <a class="pb-btn" href="<?= BASE ?>?csv=1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>Exportar CSV</a>
    <a class="pb-btn ghost" href="<?= BASE ?>?salir=1">Salir</a>
  </div>

  <nav class="pb-tabs" id="pb-tabs">
    <button data-page="resumen" type="button">Resumen</button>
    <button data-page="solicitudes" type="button">Solicitudes <em id="pb-leads-n">—</em></button>
    <button data-page="citas" type="button">Citas <em id="pb-citas-n">—</em></button>
  </nav>

  <section class="pb-page" id="page-resumen" data-page="resumen">
    <h1 class="pb-h1">El embudo, <i>de un vistazo</i></h1>
    <p class="pb-lead" id="pb-takeaway">—</p>
    <div class="pb-grid k" id="pb-kpis">
      <div class="pb-card pb-kpi hero pb-anim" style="--i:0"><div class="l">Solicitudes</div><div class="v" data-k="total">—</div><div class="d"><span class="delta" data-k="d_total">—</span><span>vs periodo anterior</span></div><div class="spark"><svg></svg></div></div>
      <div class="pb-card pb-kpi pb-anim" style="--i:1"><div class="l">Con presupuesto (A)</div><div class="v" data-k="con_presupuesto">—</div><div class="d"><span class="lime mono" data-k="p_presupuesto">—</span><span>de las solicitudes</span></div></div>
      <div class="pb-card pb-kpi pb-anim" style="--i:2"><div class="l">Contactadas</div><div class="v" data-k="contactadas">—</div><div class="d"><span class="lime mono" data-k="p_contactadas">—</span><span>de las solicitudes</span></div></div>
      <div class="pb-card pb-kpi pb-anim" style="--i:3"><div class="l">Con cita</div><div class="v" data-k="citas">—</div><div class="d"><span class="delta" data-k="d_citas">—</span><span>vs anterior</span></div></div>
      <div class="pb-card pb-kpi pb-anim" style="--i:4"><div class="l">Sesiones hechas</div><div class="v" data-k="sesiones">—</div><div class="d"><span class="lime mono" data-k="p_sesiones">—</span><span>de las citas</span></div></div>
      <div class="pb-card pb-kpi pb-anim" style="--i:5"><div class="l">Clientes</div><div class="v" data-k="clientes">—</div><div class="d"><span class="delta" data-k="d_clientes">—</span><span>vs anterior</span></div></div>
    </div>
    <div class="pb-grid two" style="margin-bottom:14px">
      <div class="pb-card pb-anim" style="--i:6">
        <div class="hd"><div><h2>Embudo</h2><p class="note">Cada paso frente al periodo anterior (barra fina). La mayor pérdida, en rojo.</p></div></div>
        <div class="pb-chart pb-funnel" id="pb-embudo"></div>
      </div>
      <div class="pb-card pb-anim" style="--i:7">
        <div class="hd"><div><h2>Ritmo de entrada</h2><p class="note" id="pb-ritmo-note">Solicitudes por día y cuántas llevan presupuesto.</p></div></div>
        <div class="pb-chart" id="pb-ritmo"><div class="pb-tip" id="pb-tip"></div></div>
        <div class="pb-legend"><span><i style="background:var(--violet)"></i>Solicitudes</span><span><i style="background:var(--lime)"></i>Con presupuesto</span></div>
      </div>
    </div>
    <div class="pb-grid two">
      <div class="pb-card pb-anim" style="--i:8">
        <div class="hd"><div><h2>De dónde vienen</h2><p class="note">Origen de cada solicitud en el periodo. Pulsa una fila para ver sus solicitudes.</p></div>
          <div class="pb-subtabs" id="pb-dim"><button data-d="fuente" class="on" type="button">Fuente · medio</button><button data-d="campana" type="button">Campaña</button><button data-d="palabra" type="button">Palabra</button></div></div>
        <div class="pb-scroll">
          <table class="pb-table" id="pb-origen">
            <thead><tr><th data-field="clave">Origen</th><th class="n" data-field="total">Solicitudes</th><th class="n" data-field="con_presupuesto">Con presup.</th><th class="n" data-field="citas">Citas</th><th class="n" data-field="sesiones">Sesiones</th><th class="n" data-field="clientes">Clientes</th><th class="n" data-field="p_cita">% a cita</th></tr></thead>
            <tbody></tbody>
          </table>
        </div>
      </div>
      <div class="pb-card pb-anim" style="--i:9">
        <div class="hd"><div><h2>Próximas citas</h2><p class="note">Las cinco siguientes sesiones técnicas reservadas.</p></div><button class="pb-btn ghost" data-go="citas" type="button">Ver todas →</button></div>
        <div class="pb-agenda" id="pb-proximas-mini"></div>
      </div>
    </div>
  </section>

  <section class="pb-page" id="page-solicitudes" data-page="solicitudes">
    <h1 class="pb-h1">Solicitudes, <i>una a una</i></h1>
    <p class="pb-lead">Cada empresa que ha rellenado el diagnóstico. Pulsa una fila para abrir su ficha, contactar por WhatsApp y anotar el seguimiento.</p>
    <div class="pb-chips" id="pb-chips"></div>
    <div class="pb-filters">
      <div class="grow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="pb-q" type="search" placeholder="Buscar empresa, teléfono, email, notas…" aria-label="Buscar"><span class="pb-kbd">/</span></div>
      <select id="pb-f-estado" aria-label="Estado"><option value="">Todos los estados</option></select>
      <select id="pb-f-fuente" aria-label="Fuente"><option value="">Todas las fuentes</option></select>
      <select id="pb-f-opcion" aria-label="Opción"><option value="">Con y sin presupuesto</option><option value="A">Opción A · con presupuesto</option><option value="B">Opción B · explorando</option></select>
      <button class="pb-btn ghost" id="pb-limpiar" type="button">Limpiar</button>
    </div>
    <div class="pb-list" id="pb-leads"></div>
  </section>

  <section class="pb-page" id="page-citas" data-page="citas">
    <h1 class="pb-h1">Agenda de <i>sesiones técnicas</i></h1>
    <p class="pb-lead">Reservas de Cal.com. Las pasadas se marcan como asistió o no se presentó; las hechas sin enlace del panel se unen a su solicitud.</p>
    <div class="pb-grid two">
      <div>
        <div class="pb-card" style="margin-bottom:14px"><h2>Próximas</h2><p class="note">Con recordatorios automáticos a 24 h y 1 h.</p><div class="pb-agenda" id="pb-proximas"></div></div>
        <div class="pb-card"><h2>Citas sin solicitud</h2><p class="note">Reservas hechas sin el enlace del panel. Escribe el número de solicitud para unirlas.</p><div class="pb-agenda" id="pb-sinvincular"></div></div>
      </div>
      <div class="pb-card"><h2>Pasadas · marca si asistió</h2><p class="note">Marcar asistencia actualiza el estado de la solicitud.</p><div class="pb-agenda" id="pb-pasadas"></div></div>
    </div>
  </section>
</div>

<div class="pb-veil" id="pb-veil"></div>
<aside class="pb-drawer" id="pb-drawer" aria-label="Ficha de la solicitud">
  <div class="in">
    <div class="top"><button class="pb-btn ghost" id="pb-cerrar" type="button">← Volver a la lista</button><div class="muted" style="font-size:12px">Esc para cerrar</div></div>
    <div id="pb-detalle"></div>
  </div>
</aside>
<div class="pb-toast" id="pb-toast"><i></i><span></span></div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js" crossorigin="anonymous"></script>
<script src="<?= BASE ?>assets/panel.js?v=<?= $v ?>" defer></script>
<?php endif; ?>
</body>
</html>
