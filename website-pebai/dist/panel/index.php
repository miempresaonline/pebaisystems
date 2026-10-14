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
            $id = (int)($_POST['id'] ?? 0);
            $estado = in_array($_POST['estado'] ?? '', ESTADOS, true) ? $_POST['estado'] : 'nuevo';
            $notas = mb_substr(trim($_POST['notas'] ?? ''), 0, 5000);
            $q = $db->prepare('SELECT estado FROM leads WHERE id = ?');
            $q->execute([$id]);
            $antes = $q->fetchColumn();
            $db->prepare('UPDATE leads SET estado = ?, notas = ?, updated_at = ? WHERE id = ?')
                ->execute([$estado, $notas, $now, $id]);
            if ($antes !== false && $antes !== $estado) {
                pebai_evento($id, $estado, 'Cambiado a mano en el panel', false);
            }
            json_out(['ok' => true]);
        case 'visto':
            // Abrir la ficha de una solicitud nueva la pasa a "En revisión" (fase 2)
            $id = (int)($_POST['id'] ?? 0);
            $db->prepare("UPDATE leads SET visto_at = ? WHERE id = ? AND visto_at = ''")->execute([$now, $id]);
            $movida = pebai_avanzar($id, 'contactado', 'Abierta en el panel');
            json_out(['ok' => true, 'movida' => $movida]);
        case 'contacto':
            // Pulsar WhatsApp o copiar el enlace de reserva queda en el historial
            $id = (int)($_POST['id'] ?? 0);
            $tipo = (string)($_POST['tipo'] ?? '');
            $tipos = ['whatsapp' => 'Abrió WhatsApp', 'enlace' => 'Enlace de reserva enviado', 'seguimiento' => 'Seguimiento enviado',
                      'reprogramar' => 'Mensaje para reprogramar', 'no_encaja' => 'Mensaje de no encaja', 'copiar' => 'Copió el enlace de reserva'];
            if (!isset($tipos[$tipo])) {
                json_out(['ok' => false, 'error' => 'Tipo no válido.'], 400);
            }
            if (in_array($tipo, ['enlace', 'copiar'], true)) {
                $db->prepare('UPDATE leads SET enlace_at = ? WHERE id = ?')->execute([$now, $id]);
            }
            pebai_evento($id, 'contacto', $tipos[$tipo], false);
            pebai_avanzar($id, 'contactado', $tipos[$tipo]);
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
                pebai_evento($leadId, $valor === 'asistio' ? 'sesion' : 'no_asistio', $valor === 'asistio' ? 'Asistencia confirmada' : 'No se presentó', false);
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
            pebai_evento($leadId, 'unida', 'Reserva unida a mano en el panel', false);
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
    try {
        pebai_auto_sesiones();
    } catch (Throwable $e) {
        pebai_log('AUTO SESIONES (panel): ' . $e->getMessage());
    }
    $cols = ['id', 'created_at', 'estado', 'notas', 'empresa', 'nombre', 'telefono', 'canal', 'volumen', 'objetivo', 'presupuesto', 'opcion',
             'fuente', 'medio', 'campana', 'contenido', 'palabra', 'cta', 'primer_toque', 'ultimo_toque', 'pagina', 'dispositivo',
             'email_enviado', 'updated_at', 'cita_inicio', 'cita_fin', 'cita_uid', 'cita_estado', 'cliente_nombre', 'cliente_email', 'visto_at', 'enlace_at'];
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
    $eventos = $db->query('SELECT lead_id, ts, tipo, detalle, auto FROM eventos ORDER BY id DESC LIMIT 20000')->fetchAll();
    foreach ($eventos as &$e) {
        $e['lead_id'] = (int)$e['lead_id'];
        $e['auto'] = (int)$e['auto'];
    }
    unset($e);
    json_out(['ok' => true, 'eventos' => $eventos, 'ahora' => date('Y-m-d H:i:s'), 'ahora_utc' => gmdate('Y-m-d\TH:i:s\Z'), 'csrf' => csrf(), 'leads' => $leads, 'citas' => $citas]);
}

$v = '5';
$next = ($_SERVER['QUERY_STRING'] ?? '') !== '' ? '?' . $_SERVER['QUERY_STRING'] : '';
?><!doctype html>
<html lang="es" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<meta name="theme-color" content="#070911">
<title>Panel · PEBAI</title>
<link rel="icon" href="<?= BASE ?>assets/favicon-32.png" sizes="32x32" type="image/png">
<link rel="icon" href="<?= BASE ?>assets/favicon-192.png" sizes="192x192" type="image/png">
<link rel="apple-touch-icon" href="<?= BASE ?>assets/apple-touch-icon.png">
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
    <div class="pb-brand"><img class="pb-mark" src="<?= BASE ?>assets/pebai-mark.png" width="122" height="144" alt=""><svg class="pb-word" viewBox="30 15 700 112" aria-label="PEBAI" role="img"><g fill="currentColor"><g transform="translate(30 15) scale(2.72003 1.55556) translate(-7 72)"><path d="M12.7500 0L7 0L7-72L34.1500-72Q35.2000-72 36.4250-71.9250Q37.6500-71.8500 39-71.6000L39-71.6000Q44.4000-70.7500 48.2750-67.7250Q52.1500-64.7000 54.2000-60.1250Q56.2500-55.5500 56.2500-50.0500L56.2500-50.0500Q56.2500-44.5000 54.2000-39.9250Q52.1500-35.3500 48.2750-32.3250Q44.4000-29.3000 39-28.4500L39-28.4500Q37.6500-28.2500 36.4250-28.1500Q35.2000-28.0500 34.1500-28.0500L34.1500-28.0500L12.7500-28.0500L12.7500 0ZM12.7500-66.4000L12.7500-33.7000L34.0500-33.7000Q34.9500-33.7000 36.1250-33.8000Q37.3000-33.9000 38.5000-34.1000L38.5000-34.1000Q42.4000-34.9000 45-37.2750Q47.6000-39.6500 48.9000-43Q50.2000-46.3500 50.2000-50.0500L50.2000-50.0500Q50.2000-53.7500 48.9000-57.0750Q47.6000-60.4000 45-62.7750Q42.4000-65.1500 38.5000-65.9500L38.5000-65.9500Q37.3000-66.2000 36.1250-66.3000Q34.9500-66.4000 34.0500-66.4000L34.0500-66.4000L12.7500-66.4000Z"/><path d="M113.7500 0L69.2500 0L69.2500-72L113.7500-72L113.7500-66.4000L75-66.4000L75-39.0500L107.7500-39.0500L107.7500-33.4500L75-33.4500L75-5.6000L113.7500-5.6000L113.7500 0Z"/><path d="M158.4000 0L128.7500 0L128.7500-72L156.3000-72Q161.9000-72 166.3750-69.6250Q170.8500-67.2500 173.4250-63.1500Q176-59.0500 176-53.9000L176-53.9000Q176-48.1000 172.8000-43.4750Q169.6000-38.8500 164.3000-37L164.3000-37L164.1000-39.4000Q171.2000-37.2500 175.3750-32.2250Q179.5500-27.2000 179.5500-19.8000L179.5500-19.8000Q179.5500-13.6000 176.8250-9.1750Q174.1000-4.7500 169.3000-2.3750Q164.5000 0 158.4000 0L158.4000 0ZM134.5500-35.1000L134.5500-5.6500L156.5000-5.6500Q161.3000-5.6500 165.1250-7.3000Q168.9500-8.9500 171.1750-12.0500Q173.4000-15.1500 173.4000-19.5500L173.4000-19.5500Q173.4000-23.9000 171.3750-27.4250Q169.3500-30.9500 165.9000-33.0250Q162.4500-35.1000 158.1500-35.1000L158.1500-35.1000L134.5500-35.1000ZM134.5500-66.4500L134.5500-40.6500L156.2500-40.6500Q160-40.6500 163.1250-42.4000Q166.2500-44.1500 168.1000-47.1750Q169.9500-50.2000 169.9500-54.1000L169.9500-54.1000Q169.9500-59.6500 166.0250-63.0500Q162.1000-66.4500 156.2500-66.4500L156.2500-66.4500L134.5500-66.4500Z"/><path d="M193.5500 0L187.4500 0L212.9500-72L220.1000-72L245.6000 0L239.5000 0L215-69L217.9000-69L193.5500 0ZM235-18.1000L198-18.1000L198-23.5500L235-23.5500L235-18.1000Z"/><path d="M264.3500 0L258.6000 0L258.6000-72L264.3500-72L264.3500 0Z"/></g></g></svg></div>
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
      <img class="pb-mark" src="<?= BASE ?>assets/pebai-mark.png" width="122" height="144" alt=""><svg class="pb-word" viewBox="30 15 700 112" aria-label="PEBAI" role="img"><g fill="currentColor"><g transform="translate(30 15) scale(2.72003 1.55556) translate(-7 72)"><path d="M12.7500 0L7 0L7-72L34.1500-72Q35.2000-72 36.4250-71.9250Q37.6500-71.8500 39-71.6000L39-71.6000Q44.4000-70.7500 48.2750-67.7250Q52.1500-64.7000 54.2000-60.1250Q56.2500-55.5500 56.2500-50.0500L56.2500-50.0500Q56.2500-44.5000 54.2000-39.9250Q52.1500-35.3500 48.2750-32.3250Q44.4000-29.3000 39-28.4500L39-28.4500Q37.6500-28.2500 36.4250-28.1500Q35.2000-28.0500 34.1500-28.0500L34.1500-28.0500L12.7500-28.0500L12.7500 0ZM12.7500-66.4000L12.7500-33.7000L34.0500-33.7000Q34.9500-33.7000 36.1250-33.8000Q37.3000-33.9000 38.5000-34.1000L38.5000-34.1000Q42.4000-34.9000 45-37.2750Q47.6000-39.6500 48.9000-43Q50.2000-46.3500 50.2000-50.0500L50.2000-50.0500Q50.2000-53.7500 48.9000-57.0750Q47.6000-60.4000 45-62.7750Q42.4000-65.1500 38.5000-65.9500L38.5000-65.9500Q37.3000-66.2000 36.1250-66.3000Q34.9500-66.4000 34.0500-66.4000L34.0500-66.4000L12.7500-66.4000Z"/><path d="M113.7500 0L69.2500 0L69.2500-72L113.7500-72L113.7500-66.4000L75-66.4000L75-39.0500L107.7500-39.0500L107.7500-33.4500L75-33.4500L75-5.6000L113.7500-5.6000L113.7500 0Z"/><path d="M158.4000 0L128.7500 0L128.7500-72L156.3000-72Q161.9000-72 166.3750-69.6250Q170.8500-67.2500 173.4250-63.1500Q176-59.0500 176-53.9000L176-53.9000Q176-48.1000 172.8000-43.4750Q169.6000-38.8500 164.3000-37L164.3000-37L164.1000-39.4000Q171.2000-37.2500 175.3750-32.2250Q179.5500-27.2000 179.5500-19.8000L179.5500-19.8000Q179.5500-13.6000 176.8250-9.1750Q174.1000-4.7500 169.3000-2.3750Q164.5000 0 158.4000 0L158.4000 0ZM134.5500-35.1000L134.5500-5.6500L156.5000-5.6500Q161.3000-5.6500 165.1250-7.3000Q168.9500-8.9500 171.1750-12.0500Q173.4000-15.1500 173.4000-19.5500L173.4000-19.5500Q173.4000-23.9000 171.3750-27.4250Q169.3500-30.9500 165.9000-33.0250Q162.4500-35.1000 158.1500-35.1000L158.1500-35.1000L134.5500-35.1000ZM134.5500-66.4500L134.5500-40.6500L156.2500-40.6500Q160-40.6500 163.1250-42.4000Q166.2500-44.1500 168.1000-47.1750Q169.9500-50.2000 169.9500-54.1000L169.9500-54.1000Q169.9500-59.6500 166.0250-63.0500Q162.1000-66.4500 156.2500-66.4500L156.2500-66.4500L134.5500-66.4500Z"/><path d="M193.5500 0L187.4500 0L212.9500-72L220.1000-72L245.6000 0L239.5000 0L215-69L217.9000-69L193.5500 0ZM235-18.1000L198-18.1000L198-23.5500L235-23.5500L235-18.1000Z"/><path d="M264.3500 0L258.6000 0L258.6000-72L264.3500-72L264.3500 0Z"/></g></g></svg>
    </a>
    <div class="pb-seg" id="pb-periodo" aria-label="Periodo">
      <button data-p="7">7 días</button><button data-p="30">30 días</button><button data-p="90">90 días</button><button data-p="todo">Todo</button>
    </div>
    <button class="pb-btn icon" id="pb-avisos" title="Activar avisos de nuevas solicitudes" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></button>
    <button class="pb-btn icon" id="pb-theme" title="Cambiar tema" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z"/></svg></button>
    <a class="pb-btn" href="<?= BASE ?>?csv=1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>Exportar CSV</a>
    <a class="pb-btn ghost" href="<?= BASE ?>?salir=1">Salir</a>
  </div>

  <nav class="pb-tabs" id="pb-tabs">
    <button data-page="resumen" type="button">Resumen</button>
    <button data-page="solicitudes" type="button">Solicitudes <em id="pb-leads-n">—</em><i class="pb-dot" id="pb-leads-dot" hidden></i></button>
    <button data-page="citas" type="button">Citas <em id="pb-citas-n">—</em></button>
  </nav>

  <section class="pb-page" id="page-resumen" data-page="resumen">
    <h1 class="pb-h1">El embudo, <i>de un vistazo</i></h1>
    <p class="pb-lead" id="pb-takeaway">—</p>
    <div class="pb-card pb-pendientes pb-anim" id="pb-pendientes" style="--i:0;margin-bottom:14px">
      <div class="hd"><div><h2>Qué toca ahora</h2><p class="note">Se actualiza solo cada minuto. Las fases avanzan solas; aquí queda lo que necesita una persona.</p></div></div>
      <div class="pb-pend-list" id="pb-pend-list"></div>
    </div>
    <div class="pb-grid k" id="pb-kpis">
      <div class="pb-card pb-kpi hero pb-anim" style="--i:0"><div class="l">Solicitudes</div><div class="v" data-k="total">—</div><div class="d"><span class="delta" data-k="d_total">—</span><span>vs periodo anterior</span></div><div class="spark"><svg></svg></div></div>
      <div class="pb-card pb-kpi pb-anim" style="--i:1"><div class="l">Con presupuesto (A)</div><div class="v" data-k="con_presupuesto">—</div><div class="d"><span class="lime mono" data-k="p_presupuesto">—</span><span>de las solicitudes</span></div></div>
      <div class="pb-card pb-kpi pb-anim" style="--i:2"><div class="l">Revisadas</div><div class="v" data-k="contactadas">—</div><div class="d"><span class="lime mono" data-k="p_contactadas">—</span><span>de las solicitudes</span></div></div>
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
    <div class="top"><button class="pb-btn ghost" id="pb-cerrar" type="button">← Volver</button><div class="nav"><span class="muted">↑ ↓ para cambiar · Esc para cerrar</span><button class="pb-btn icon" id="pb-prev" type="button" title="Solicitud anterior"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m18 15-6-6-6 6"/></svg></button><button class="pb-btn icon" id="pb-next" type="button" title="Solicitud siguiente"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg></button></div></div>
    <div id="pb-detalle"></div>
  </div>
</aside>
<div class="pb-toast" id="pb-toast"><i></i><span></span></div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js" crossorigin="anonymous"></script>
<script src="<?= BASE ?>assets/icons.js?v=<?= $v ?>" defer></script>
<script src="<?= BASE ?>assets/panel.js?v=<?= $v ?>" defer></script>
<?php endif; ?>
</body>
</html>
