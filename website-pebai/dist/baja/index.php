<?php
/*
 * PEBAI · Baja de los emails de captación (enlace de la cabecera List-Unsubscribe).
 * POST con "List-Unsubscribe=One-Click" (Gmail, Outlook): baja inmediata, sin más pasos (RFC 8058).
 * GET (alguien abre el enlace): página con un botón; así los escáneres de enlaces no dan de baja a nadie sin querer.
 * La baja es para siempre y para todos los canales (email y WhatsApp).
 */
require dirname(__DIR__) . '/api/_email_lib.php';

header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store');
header('Referrer-Policy: no-referrer');

$token = preg_replace('/[^a-f0-9]/', '', (string)($_REQUEST['t'] ?? ''));
$p = null;
if (strlen($token) === 32) {
    $q = pebai_email_db()->prepare('SELECT * FROM email_prospectos WHERE token = ?');
    $q->execute([$token]);
    $p = $q->fetch() ?: null;
}
$hecho = false;
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $p) {
    pebai_email_baja($p, ($_POST['List-Unsubscribe'] ?? '') === 'One-Click' ? 'Baja con un clic desde su gestor de correo' : 'Baja desde la página de baja');
    $hecho = true;
    if (($_POST['List-Unsubscribe'] ?? '') === 'One-Click') {
        header('Content-Type: text/plain; charset=utf-8');
        echo 'OK';
        exit;
    }
}
$yaBaja = $p && $p['estado'] === 'baja';
$mail = $p ? preg_replace('/^(.).*(@.*)$/u', '$1•••$2', $p['email']) : '';
?><!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Baja · PEBAI Systems</title>
<link rel="icon" href="/favicon.ico" sizes="48x48">
<style>
@font-face{font-family:'Manrope';src:url('/brand/Manrope-latin-variable.woff2') format('woff2');font-weight:200 800;font-display:swap}
:root{--bg:#090a10;--card:#121420;--line:rgba(255,255,255,.1);--fg:#EFEDE7;--muted:#9A9CB0;--lime:#B7FF3C}
@media (prefers-color-scheme:light){:root{--bg:#EFEDE7;--card:#fff;--line:rgba(18,18,26,.12);--fg:#12121A;--muted:#575661;--lime:#5a9e00}}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;padding:16px;background:var(--bg);color:var(--fg);font:16px/1.55 Manrope,-apple-system,'Segoe UI',sans-serif}
main{width:min(440px,100%);background:var(--card);border:1px solid var(--line);border-radius:18px;padding:28px 24px}
h1{font-size:22px;margin:0 0 8px}
p{margin:0 0 14px;color:var(--muted)}
b{color:var(--fg)}
button{width:100%;border:0;border-radius:12px;padding:13px;font:700 15px Manrope,sans-serif;background:var(--lime);color:#0B0F14;cursor:pointer}
small{display:block;margin-top:16px;color:var(--muted);font-size:12.5px}
</style>
</head>
<body>
<main>
<?php if (!$p): ?>
  <h1>Enlace no válido</h1>
  <p>No encontramos este enlace de baja. Responde al email con la palabra <b>baja</b> y te quitamos al momento.</p>
<?php elseif ($hecho || $yaBaja): ?>
  <h1>Hecho, te hemos dado de baja</h1>
  <p><b><?= h($mail) ?></b> no volverá a recibir mensajes nuestros, ni por email ni por WhatsApp.</p>
  <p>Perdona la molestia.</p>
<?php else: ?>
  <h1>¿Darte de baja?</h1>
  <p>Dejaremos de escribir a <b><?= h($mail) ?></b> para siempre, por email y por WhatsApp.</p>
  <form method="post"><input type="hidden" name="t" value="<?= h($token) ?>"><button type="submit">Darme de baja</button></form>
<?php endif; ?>
  <small>PEBAI Systems · pebaisystems.es</small>
</main>
</body>
</html>
