<?php
/*
 * PEBAI · Avisos del panel al navegador y al móvil, aunque el panel esté cerrado (Web Push estándar, con claves VAPID).
 * El aviso viaja VACÍO: al llegar, el service worker del panel (panel/sw.js) pide aquí el texto enseñando su suscripción.
 * Así no hay que cifrar nada y ningún dato de clientes pasa por Google, Apple o Mozilla.
 * Las claves VAPID se crean solas la primera vez en private/vapid.php (fuera de public_html y del repositorio).
 *
 *   pebai_aviso(tipo, titulo, texto, ir, clave)  → guarda el aviso (una vez por clave) y despierta a todos los dispositivos apuntados
 *   ir: a dónde lleva al pulsarlo («lead:12», «conv:whatsapp:34», «pagina:citas»…), lo entiende panel/assets/buscar.js
 */
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}
require_once __DIR__ . '/_pebai_lib.php';

function pebai_avisos_db(): PDO
{
    static $db = null;
    if ($db) {
        return $db;
    }
    $db = new PDO('sqlite:' . pebai_private_dir() . '/avisos.sqlite');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $db->exec('PRAGMA busy_timeout = 5000');
    $db->exec('CREATE TABLE IF NOT EXISTS avisos (id INTEGER PRIMARY KEY AUTOINCREMENT, ts TEXT NOT NULL, clave TEXT NOT NULL UNIQUE, tipo TEXT NOT NULL,
               titulo TEXT NOT NULL, texto TEXT NOT NULL DEFAULT "", ir TEXT NOT NULL DEFAULT "")');
    $db->exec('CREATE TABLE IF NOT EXISTS subs (endpoint TEXT PRIMARY KEY, creada TEXT NOT NULL, ua TEXT NOT NULL DEFAULT "", visto_id INTEGER NOT NULL DEFAULT 0,
               ultimo_ok TEXT NOT NULL DEFAULT "", fallos INTEGER NOT NULL DEFAULT 0)');
    return $db;
}

function pebai_b64u(string $s): string
{
    return rtrim(strtr(base64_encode($s), '+/', '-_'), '=');
}

/** Claves VAPID (P-256). Se crean una vez y no cambian: si cambiaran, habría que volver a activar los avisos en cada dispositivo. */
function pebai_vapid(): array
{
    $f = pebai_private_dir() . '/vapid.php';
    if (is_file($f)) {
        return require $f;
    }
    $k = openssl_pkey_new(['curve_name' => 'prime256v1', 'private_key_type' => OPENSSL_KEYTYPE_EC]);
    if (!$k || !openssl_pkey_export($k, $pem)) {
        throw new RuntimeException('No se han podido crear las claves de los avisos.');
    }
    $d = openssl_pkey_get_details($k)['ec'];
    $pub = "\x04" . str_pad($d['x'], 32, "\0", STR_PAD_LEFT) . str_pad($d['y'], 32, "\0", STR_PAD_LEFT);
    $v = ['pub' => pebai_b64u($pub), 'pem' => $pem];
    file_put_contents($f, '<?php return ' . var_export($v, true) . ";\n", LOCK_EX);
    @chmod($f, 0600);
    return $v;
}

/** Firma ES256 en formato JWT (r||s de 64 bytes, no DER). */
function pebai_vapid_jwt(string $aud, array $v): string
{
    $h = pebai_b64u(json_encode(['typ' => 'JWT', 'alg' => 'ES256']));
    $c = pebai_b64u(json_encode(['aud' => $aud, 'exp' => time() + 12 * 3600, 'sub' => 'mailto:equipo@pebaisystems.es']));
    openssl_sign("$h.$c", $der, $v['pem'], OPENSSL_ALGO_SHA256);
    $o = 2 + ((ord($der[1]) & 0x80) ? (ord($der[1]) & 0x7f) : 0);
    $lr = ord($der[$o + 1]);
    $r = substr($der, $o + 2, $lr);
    $o += 2 + $lr;
    $s = substr($der, $o + 2, ord($der[$o + 1]));
    $fix = static fn($x) => str_pad(substr(ltrim($x, "\0"), -32), 32, "\0", STR_PAD_LEFT);
    return "$h.$c." . pebai_b64u($fix($r) . $fix($s));
}

/** Despierta a todos los dispositivos apuntados (en paralelo, 6 s como mucho). Borra los que ya no existen. */
function pebai_push_todos(): int
{
    $db = pebai_avisos_db();
    $subs = $db->query('SELECT endpoint FROM subs')->fetchAll(PDO::FETCH_COLUMN);
    if (!$subs) {
        return 0;
    }
    $v = pebai_vapid();
    $mh = curl_multi_init();
    $hs = [];
    foreach ($subs as $e) {
        $u = parse_url($e);
        $ch = curl_init($e);
        curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => '', CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 6,
            CURLOPT_HTTPHEADER => ['TTL: 86400', 'Urgency: high', 'Content-Length: 0',
                                   'Authorization: vapid t=' . pebai_vapid_jwt($u['scheme'] . '://' . $u['host'], $v) . ', k=' . $v['pub']]]);
        curl_multi_add_handle($mh, $ch);
        $hs[$e] = $ch;
    }
    do {
        $st = curl_multi_exec($mh, $vivos);
        if ($vivos) {
            curl_multi_select($mh, 1);
        }
    } while ($vivos && $st === CURLM_OK);
    $ok = 0;
    foreach ($hs as $e => $ch) {
        $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        if ($code >= 200 && $code < 300) {
            $ok++;
            $db->prepare('UPDATE subs SET ultimo_ok = ?, fallos = 0 WHERE endpoint = ?')->execute([date('Y-m-d H:i:s'), $e]);
        } elseif (in_array($code, [404, 410], true)) {
            $db->prepare('DELETE FROM subs WHERE endpoint = ?')->execute([$e]);   // el navegador quitó el permiso o la suscripción caducó
        } else {
            $db->prepare('UPDATE subs SET fallos = fallos + 1 WHERE endpoint = ?')->execute([$e]);
            pebai_log('AVISOS: push ' . $code . ' en ' . parse_url($e, PHP_URL_HOST));
        }
        curl_multi_remove_handle($mh, $ch);
        curl_close($ch);
    }
    curl_multi_close($mh);
    return $ok;
}

/**
 * Nuevo aviso. $clave evita repetirlo (la misma solicitud, la misma respuesta…). Nunca rompe a quien lo llama.
 * Tipos: solicitud, cita, respuesta, interesado, demo, prueba.
 */
function pebai_aviso(string $tipo, string $titulo, string $texto, string $ir = '', string $clave = ''): void
{
    try {
        $db = pebai_avisos_db();
        $q = $db->prepare('INSERT OR IGNORE INTO avisos (ts, clave, tipo, titulo, texto, ir) VALUES (?, ?, ?, ?, ?, ?)');
        $q->execute([date('Y-m-d H:i:s'), $clave !== '' ? $clave : $tipo . ':' . microtime(true), $tipo, mb_substr($titulo, 0, 80), mb_substr($texto, 0, 180), $ir]);
        if ($q->rowCount()) {
            pebai_push_todos();
        }
    } catch (Throwable $e) {
        pebai_log('AVISOS: ' . $e->getMessage());
    }
}

/** Lo que el service worker enseña al recibir un aviso: lo nuevo para ese dispositivo (de la última hora, 3 como mucho). */
function pebai_avisos_para(string $endpoint): ?array
{
    $db = pebai_avisos_db();
    $q = $db->prepare('SELECT visto_id FROM subs WHERE endpoint = ?');
    $q->execute([$endpoint]);
    $visto = $q->fetchColumn();
    $q->closeCursor();
    if ($visto === false) {
        return null;
    }
    $q = $db->prepare('SELECT id, tipo, titulo, texto, ir FROM avisos WHERE id > ? AND ts >= ? ORDER BY id DESC LIMIT 3');
    $q->execute([(int)$visto, date('Y-m-d H:i:s', time() - 3600)]);
    $l = $q->fetchAll();
    $max = (int)$db->query('SELECT MAX(id) FROM avisos')->fetchColumn();
    $db->prepare('UPDATE subs SET visto_id = ? WHERE endpoint = ?')->execute([$max, $endpoint]);
    return $l;
}
