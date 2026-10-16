<?php
/*
 * PEBAI · Redirección de los QRs de calle: pebaisystems.es/q/<slug>?p=a|d (regla en .htaccess).
 * Apunta el escaneo (sin datos personales: IP anonimizada y tipo de dispositivo) y redirige al destino del QR.
 * Si algo falla, el visitante nunca ve un error: acaba en la web.
 */
require __DIR__ . '/_qr_lib.php';

$slug = preg_replace('/[^a-z0-9-]/', '', strtolower((string)($_GET['c'] ?? '')));
$persona = pebai_qr_persona((string)($_GET['p'] ?? ''));
$ua = (string)($_SERVER['HTTP_USER_AGENT'] ?? '');
$destino = 'https://pebaisystems.es/';
try {
    $db = pebai_qr_db();
    $st = $db->prepare('SELECT * FROM qr_codigos WHERE slug = ?');
    $st->execute([$slug]);
    $q = $st->fetch(PDO::FETCH_ASSOC);
    if ($q) {
        $destino = pebai_qr_destino($q, $persona);
        if (!pebai_qr_es_robot($ua)) {
            $disp = preg_match('/iphone|ipad|ios/i', $ua) ? 'iPhone' : (preg_match('/android/i', $ua) ? 'Android' : 'Otro');
            $db->prepare('INSERT INTO qr_escaneos (ts, slug, persona, ip_hash, dispositivo) VALUES (?, ?, ?, ?, ?)')
                ->execute([date('Y-m-d H:i:s'), $slug, $persona, pebai_ip_hash(), $disp]);
        }
    }
} catch (Throwable $e) {
    error_log('qr.php: ' . $e->getMessage());
}
header('Cache-Control: no-store, max-age=0');
header('Referrer-Policy: no-referrer-when-downgrade');
header('Location: ' . $destino, true, 302);
