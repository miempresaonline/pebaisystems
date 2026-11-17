<?php
/*
 * PEBAI · Cuentas del panel (17/11/2026). Se pasa de una contraseña compartida a una cuenta por persona, con su rol:
 *   admin → Daniel: todo el panel.
 *   socio → Adrián: lo comercial; Agentes y Caja solo para ver; en Gestoría, los pactos y su parte del reparto; nada técnico.
 * Se entra con «usuario o correo» + contraseña. El correo es opcional y solo sirve para «He olvidado mi contraseña».
 *
 * Tablas en la base privada de siempre (private/leads.sqlite, la de pebai_db()), creadas solas:
 *   usuarios        → usuario, nombre, email, rol, huella password_hash de la contraseña (nunca la contraseña), activo
 *   usuarios_reset  → enlaces de un solo uso para poner contraseña nueva: solo la huella sha256 del enlace, caducan en 1 h
 *
 * Las cuentas se crean y cambian en el servidor por SSH con pebai_usuario_guardar() (nunca desde la web ni en el repositorio):
 *   php -r 'require "…/public_html/api/_usuarios_lib.php"; pebai_usuario_guardar("daniel", "Daniel", "", "admin", getenv("PEBAI_PW"));'
 * Mientras no haya ninguna cuenta admin con contraseña, el panel sigue aceptando la contraseña compartida antigua
 * (panel_password_hash de private/config.php). En cuanto existe la de Daniel, la compartida deja de valer.
 */
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}
require_once __DIR__ . '/_pebai_lib.php';

const PEBAI_ROLES = ['admin' => 'Administrador', 'socio' => 'Socio'];
const PEBAI_CLAVE_MIN = 10;          // largo mínimo de una contraseña nueva
const PEBAI_RESET_SEG = 3600;        // el enlace de «He olvidado mi contraseña» vale 1 hora
const PEBAI_INTENTOS_MAX = 8;        // intentos fallidos de entrar en 15 min, por dispositivo (IP) y por cuenta

function pebai_usuarios_db(): PDO
{
    static $ready = false;
    $db = pebai_db();
    if (!$ready) {
        $db->exec('CREATE TABLE IF NOT EXISTS usuarios (
            usuario TEXT PRIMARY KEY,
            nombre TEXT NOT NULL DEFAULT "",
            email TEXT NOT NULL DEFAULT "",
            rol TEXT NOT NULL DEFAULT "socio",
            hash TEXT NOT NULL DEFAULT "",
            activo INTEGER NOT NULL DEFAULT 1,
            creado TEXT NOT NULL DEFAULT "",
            actualizado TEXT NOT NULL DEFAULT "",
            ultimo_acceso TEXT NOT NULL DEFAULT ""
        )');
        $db->exec('CREATE TABLE IF NOT EXISTS usuarios_reset (
            hash TEXT PRIMARY KEY,
            usuario TEXT NOT NULL,
            caduca INTEGER NOT NULL,
            usado INTEGER NOT NULL DEFAULT 0,
            creado TEXT NOT NULL DEFAULT "",
            ip_hash TEXT NOT NULL DEFAULT ""
        )');
        // Intentos de entrar: ahora también por cuenta (además de por IP)
        $db->exec('CREATE TABLE IF NOT EXISTS login_attempts (ip_hash TEXT NOT NULL, ts INTEGER NOT NULL)');
        pebai_columna($db, 'login_attempts', 'usuario');
        // Registro de todo lo que se cambia desde el panel, con quién lo hizo
        $db->exec('CREATE TABLE IF NOT EXISTS panel_registro (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ts TEXT NOT NULL,
            usuario TEXT NOT NULL DEFAULT "",
            accion TEXT NOT NULL,
            ref TEXT NOT NULL DEFAULT "",
            detalle TEXT NOT NULL DEFAULT ""
        )');
        $db->exec('CREATE INDEX IF NOT EXISTS idx_panel_registro ON panel_registro(usuario, id)');
        $ready = true;
    }
    return $db;
}

/** usuario o correo tal como se compara: sin espacios a los lados y en minúsculas. */
function pebai_usuario_normaliza(string $s): string
{
    return mb_strtolower(trim($s), 'UTF-8');
}

/** Huella corta de la contraseña guardada: si cambia la contraseña, las sesiones y llaves «recordar» antiguas dejan de valer. */
function pebai_usuario_huella(string $hash): string
{
    return $hash === '' ? '' : substr(hash('sha256', $hash), 0, 24);
}

/** '' si la contraseña nueva vale; si no, por qué. */
function pebai_clave_valida(string $p): string
{
    if (mb_strlen($p) < PEBAI_CLAVE_MIN) {
        return 'La contraseña tiene que tener al menos ' . PEBAI_CLAVE_MIN . ' caracteres.';
    }
    if (mb_strlen($p) > 200) {
        return 'La contraseña es demasiado larga.';
    }
    return '';
}

/**
 * Crea o actualiza una cuenta. Se llama en el servidor (SSH); no hay ninguna pantalla del panel que cree cuentas.
 *   $usuario  minúsculas, números, punto, guion o guion bajo (2-32): 'daniel', 'adrian'
 *   $email    opcional ('' = sin correo: entra con el usuario y no puede usar «He olvidado mi contraseña»)
 *   $rol      'admin' o 'socio'
 *   $password null = no tocar la contraseña (al crear, la cuenta queda sin contraseña hasta que se ponga una)
 * Lanza InvalidArgumentException si algún dato no vale. Cambiar la contraseña cierra las sesiones abiertas de esa cuenta.
 */
function pebai_usuario_guardar(string $usuario, string $nombre, string $email, string $rol, ?string $password): void
{
    $usuario = pebai_usuario_normaliza($usuario);
    $email = pebai_usuario_normaliza($email);
    $nombre = trim($nombre);
    if (!preg_match('/^[a-z0-9._-]{2,32}$/', $usuario)) {
        throw new InvalidArgumentException('Usuario no válido: minúsculas, números, punto o guiones (2-32).');
    }
    if (!isset(PEBAI_ROLES[$rol])) {
        throw new InvalidArgumentException('Rol no válido: admin o socio.');
    }
    if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new InvalidArgumentException('Correo no válido.');
    }
    if ($password !== null && ($e = pebai_clave_valida($password)) !== '') {
        throw new InvalidArgumentException($e);
    }
    $db = pebai_usuarios_db();
    if ($email !== '') {
        $q = $db->prepare('SELECT COUNT(*) FROM usuarios WHERE (email = ? OR usuario = ?) AND usuario <> ?');
        $q->execute([$email, $email, $usuario]);
        if ((int)pebai_uno($q)) {
            throw new InvalidArgumentException('Ese correo ya es de otra cuenta.');
        }
    }
    $q = $db->prepare('SELECT COUNT(*) FROM usuarios WHERE email = ? AND usuario <> ?');
    $q->execute([$usuario, $usuario]);
    if ((int)pebai_uno($q)) {
        throw new InvalidArgumentException('Ese usuario coincide con el correo de otra cuenta.');
    }
    $now = date('Y-m-d H:i:s');
    $db->prepare('INSERT INTO usuarios (usuario, nombre, email, rol, creado, actualizado) VALUES (?, ?, ?, ?, ?, ?)
                  ON CONFLICT(usuario) DO UPDATE SET nombre = excluded.nombre, email = excluded.email, rol = excluded.rol, actualizado = excluded.actualizado')
       ->execute([$usuario, mb_substr($nombre !== '' ? $nombre : ucfirst($usuario), 0, 60), $email, $rol, $now, $now]);
    if ($password !== null) {
        pebai_usuario_poner_clave($usuario, $password);
    }
}

/** Activa o desactiva una cuenta (desactivada no puede entrar; sus sesiones caen en la siguiente petición). */
function pebai_usuario_activo(string $usuario, bool $activo): void
{
    pebai_usuarios_db()->prepare('UPDATE usuarios SET activo = ?, actualizado = ? WHERE usuario = ?')
        ->execute([$activo ? 1 : 0, date('Y-m-d H:i:s'), pebai_usuario_normaliza($usuario)]);
    if (!$activo) {
        pebai_recuerdos_borrar(pebai_usuario_normaliza($usuario));
    }
}

/** Pone la contraseña (ya validada) y tira las llaves «recordar» de esa cuenta, salvo la del dispositivo $guardar (huella sha256). */
function pebai_usuario_poner_clave(string $usuario, string $password, string $guardar = ''): void
{
    $db = pebai_usuarios_db();
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $db->prepare('UPDATE usuarios SET hash = ?, actualizado = ? WHERE usuario = ?')->execute([$hash, date('Y-m-d H:i:s'), $usuario]);
    pebai_recuerdos_borrar($usuario, $guardar);
    if ($guardar !== '') {
        // La llave de este dispositivo sigue valiendo con la contraseña nueva
        $db->prepare('UPDATE sesiones_recuerdo SET clave = ? WHERE hash = ? AND usuario = ?')->execute([pebai_usuario_huella($hash), $guardar, $usuario]);
    }
}

/** Borra las llaves «recordar» de una cuenta (todas o todas menos una). */
function pebai_recuerdos_borrar(string $usuario, string $menos = ''): void
{
    $db = pebai_usuarios_db();
    pebai_recuerdo_tabla($db);
    $db->prepare('DELETE FROM sesiones_recuerdo WHERE usuario = ? AND hash <> ?')->execute([$usuario, $menos]);
}

/** Tabla de las llaves «recordar» de 60 días (la usa el panel). usuario = de quién es; clave = huella de su contraseña al crearla. */
function pebai_recuerdo_tabla(PDO $db): void
{
    static $hecho = false;
    if ($hecho) {
        return;
    }
    $db->exec('CREATE TABLE IF NOT EXISTS sesiones_recuerdo (hash TEXT PRIMARY KEY, csrf TEXT NOT NULL, creada TEXT NOT NULL, caduca INTEGER NOT NULL,
               ua TEXT NOT NULL DEFAULT "", usada TEXT NOT NULL DEFAULT "")');
    pebai_columna($db, 'sesiones_recuerdo', 'usuario');
    pebai_columna($db, 'sesiones_recuerdo', 'clave');
    $hecho = true;
}

function pebai_usuario(string $usuario): ?array
{
    $q = pebai_usuarios_db()->prepare('SELECT * FROM usuarios WHERE usuario = ?');
    $q->execute([pebai_usuario_normaliza($usuario)]);
    $u = pebai_fila($q);
    return $u ?: null;
}

/** Busca la cuenta por usuario o por correo (lo que se escriba en «usuario o correo»). */
function pebai_usuario_por_login(string $login): ?array
{
    $login = pebai_usuario_normaliza($login);
    if ($login === '') {
        return null;
    }
    $q = pebai_usuarios_db()->prepare('SELECT * FROM usuarios WHERE usuario = ? OR (email <> "" AND email = ?) ORDER BY usuario = ? DESC LIMIT 1');
    $q->execute([$login, $login, $login]);
    $u = pebai_fila($q);
    return $u ?: null;
}

/** Nombres de las cuentas (sin correos ni nada más), para pintar «Daniel» / «Adrián» en los registros. */
function pebai_usuarios_nombres(): array
{
    try {
        return pebai_usuarios_db()->query('SELECT usuario, nombre FROM usuarios ORDER BY usuario')->fetchAll(PDO::FETCH_KEY_PAIR);
    } catch (Throwable $e) {
        return [];
    }
}

/** ¿Hay ya una cuenta de administrador que pueda entrar? Mientras no, vale la contraseña compartida antigua. */
function pebai_hay_admin(): bool
{
    static $hay = null;
    if ($hay === null) {
        $hay = (int)pebai_usuarios_db()->query("SELECT COUNT(*) FROM usuarios WHERE rol = 'admin' AND activo = 1 AND hash <> ''")->fetchColumn() > 0;
    }
    return $hay;
}

/**
 * Comprueba «usuario o correo» + contraseña. Devuelve la cuenta, la entrada antigua (contraseña compartida, solo mientras no
 * haya admin) o null. Si el usuario no existe se hace igualmente una comprobación de contraseña, para tardar lo mismo.
 */
function pebai_login(string $login, string $password): ?array
{
    $u = pebai_usuario_por_login($login);
    if ($u) {
        if ((int)$u['activo'] && $u['hash'] !== '' && password_verify($password, $u['hash'])) {
            $db = pebai_usuarios_db();
            if (password_needs_rehash($u['hash'], PASSWORD_DEFAULT)) {
                $u['hash'] = password_hash($password, PASSWORD_DEFAULT);
                $db->prepare('UPDATE usuarios SET hash = ? WHERE usuario = ?')->execute([$u['hash'], $u['usuario']]);
            }
            $db->prepare('UPDATE usuarios SET ultimo_acceso = ? WHERE usuario = ?')->execute([date('Y-m-d H:i:s'), $u['usuario']]);
            return $u;
        }
        return null;
    }
    if (!pebai_hay_admin()) {
        $hash = (string)(pebai_config()['panel_password_hash'] ?? '');
        if ($hash !== '' && password_verify($password, $hash)) {
            return ['usuario' => '', 'nombre' => 'Equipo', 'rol' => 'admin', 'hash' => ''];
        }
        return null;
    }
    password_verify($password, password_hash(random_bytes(8), PASSWORD_DEFAULT));   // tarda lo mismo que con una cuenta de verdad
    return null;
}

/* ------------------------------------------------------------ Sesión del panel --- */

/** Mete en la sesión la cuenta que acaba de entrar (o la entrada antigua, con usuario vacío). */
function pebai_sesion_poner(array $u): void
{
    $_SESSION['auth'] = true;
    $_SESSION['usuario'] = (string)$u['usuario'];
    $_SESSION['nombre'] = (string)$u['nombre'];
    $_SESSION['rol'] = (string)$u['rol'];
    $_SESSION['clave'] = pebai_usuario_huella((string)($u['hash'] ?? ''));
}

/** Quita la sesión de entrada (sin tocar el resto, p. ej. el csrf de la pantalla de entrada). */
function pebai_sesion_quitar(): void
{
    foreach (['auth', 'usuario', 'nombre', 'rol', 'clave'] as $k) {
        unset($_SESSION[$k]);
    }
}

/**
 * ¿Sigue valiendo la sesión abierta? Se mira en cada petición: la cuenta tiene que existir, estar activa y con la misma
 * contraseña que cuando se entró; el rol y el nombre se refrescan de la base. La entrada antigua (sin usuario) solo vale
 * mientras no exista la cuenta de administrador.
 */
function pebai_sesion_valida(): bool
{
    if (empty($_SESSION['auth'])) {
        return false;
    }
    $usuario = (string)($_SESSION['usuario'] ?? '');
    if ($usuario === '') {
        if (pebai_hay_admin()) {
            return false;
        }
        $_SESSION['nombre'] = 'Equipo';
        $_SESSION['rol'] = 'admin';
        return true;
    }
    $u = pebai_usuario($usuario);
    if (!$u || !(int)$u['activo'] || $u['hash'] === '' || !hash_equals(pebai_usuario_huella($u['hash']), (string)($_SESSION['clave'] ?? ''))) {
        return false;
    }
    $_SESSION['nombre'] = $u['nombre'];
    $_SESSION['rol'] = $u['rol'];
    return true;
}

/** Quién está dentro: ['usuario' => 'daniel', 'nombre' => 'Daniel', 'rol' => 'admin'], o null sin sesión. */
function pebai_yo(): ?array
{
    if (!isset($_SESSION) || empty($_SESSION['auth'])) {
        return null;
    }
    return ['usuario' => (string)($_SESSION['usuario'] ?? ''), 'nombre' => (string)($_SESSION['nombre'] ?? 'Equipo'), 'rol' => (string)($_SESSION['rol'] ?? 'socio')];
}

function pebai_es_admin(): bool
{
    return (pebai_yo()['rol'] ?? '') === 'admin';
}

/** Corta la petición con un 403 en JSON si quien está dentro no es administrador. Va al principio de cada acción solo de Daniel. */
function pebai_solo_admin(): void
{
    if (pebai_es_admin()) {
        return;
    }
    http_response_code(403);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => 'Tu cuenta no tiene permiso para esto.'], JSON_UNESCAPED_UNICODE);
    exit;
}

/** Apunta en el registro del panel qué se ha cambiado y quién (nunca contraseñas ni el contenido de los formularios). */
function pebai_registro(string $accion, string $ref = '', string $detalle = ''): void
{
    try {
        $db = pebai_usuarios_db();
        $u = pebai_quien();
        // Lo que se repite seguido (las notas se guardan solas mientras se escribe) se apunta una vez cada 10 minutos
        $q = $db->prepare('SELECT COUNT(*) FROM panel_registro WHERE usuario = ? AND accion = ? AND ref = ? AND ts >= ?');
        $q->execute([$u, $accion, $ref, date('Y-m-d H:i:s', time() - 600)]);
        if ($detalle === '' && (int)pebai_uno($q)) {
            return;
        }
        $db->prepare('INSERT INTO panel_registro (ts, usuario, accion, ref, detalle) VALUES (?, ?, ?, ?, ?)')
           ->execute([date('Y-m-d H:i:s'), $u, mb_substr($accion, 0, 60), mb_substr($ref, 0, 80), mb_substr($detalle, 0, 300)]);
    } catch (Throwable $e) {
        pebai_log('REGISTRO PANEL: ' . $e->getMessage());
    }
}

/* ------------------------------------------------------------ Intentos fallidos --- */

/** ¿Demasiados intentos fallidos en 15 min? Por IP y, si se dice, también por cuenta (o por lo escrito en «usuario o correo»). */
function pebai_intentos_bloqueado(string $tipo, string $quien = '', int $max = PEBAI_INTENTOS_MAX): bool
{
    $db = pebai_usuarios_db();
    $db->prepare('DELETE FROM login_attempts WHERE ts < ?')->execute([time() - 900]);
    // (los intentos apuntados antes de las cuentas no llevan usuario: cuentan como de entrar)
    $q = $db->prepare('SELECT COUNT(*) FROM login_attempts WHERE ip_hash = ? AND (usuario LIKE ?' . ($tipo === 'login' ? " OR usuario = ''" : '') . ')');
    $q->execute([pebai_ip_hash(), $tipo . ':%']);
    if ((int)pebai_uno($q) >= $max) {
        return true;
    }
    if ($quien !== '') {
        $q = $db->prepare('SELECT COUNT(*) FROM login_attempts WHERE usuario = ?');
        $q->execute([$tipo . ':' . $quien]);
        if ((int)pebai_uno($q) >= $max) {
            return true;
        }
    }
    return false;
}

function pebai_intento_fallido(string $tipo, string $quien = ''): void
{
    pebai_usuarios_db()->prepare('INSERT INTO login_attempts (ip_hash, ts, usuario) VALUES (?, ?, ?)')->execute([pebai_ip_hash(), time(), $tipo . ':' . $quien]);
}

/* ------------------------------------------------------------ «He olvidado mi contraseña» --- */

/**
 * Si la cuenta existe, está activa y tiene correo, crea un enlace de un solo uso (1 h) y lo manda por correo.
 * No dice nunca si la cuenta existe: quien llama responde siempre lo mismo. $base = dirección del panel acabada en «/».
 */
function pebai_reset_pedir(string $login, string $base): void
{
    $u = pebai_usuario_por_login($login);
    if (!$u || !(int)$u['activo'] || $u['email'] === '') {
        return;
    }
    $db = pebai_usuarios_db();
    // Como mucho 3 enlaces por cuenta y hora
    $q = $db->prepare('SELECT COUNT(*) FROM usuarios_reset WHERE usuario = ? AND caduca > ?');
    $q->execute([$u['usuario'], time()]);
    if ((int)pebai_uno($q) >= 3) {
        return;
    }
    $token = bin2hex(random_bytes(32));
    // El anterior sin usar deja de valer: solo vale el último que llega
    $db->prepare('UPDATE usuarios_reset SET usado = 1 WHERE usuario = ? AND usado = 0')->execute([$u['usuario']]);
    $db->prepare('DELETE FROM usuarios_reset WHERE caduca < ?')->execute([time() - 86400]);
    $db->prepare('INSERT INTO usuarios_reset (hash, usuario, caduca, usado, creado, ip_hash) VALUES (?, ?, ?, 0, ?, ?)')
       ->execute([hash('sha256', $token), $u['usuario'], time() + PEBAI_RESET_SEG, date('Y-m-d H:i:s'), pebai_ip_hash()]);
    $url = $base . '?restablecer=' . $token;
    $nombre = $u['nombre'] !== '' ? $u['nombre'] : $u['usuario'];
    $html = pebai_email_shell('Pon tu contraseña nueva', 'Enlace para poner una contraseña nueva en el panel de PEBAI. Vale 1 hora.',
        pebai_email_title('Panel de PEBAI', 'Pon tu contraseña nueva', 'Hola, ' . h($nombre) . '. Alguien (seguramente tú) ha pedido cambiar la contraseña de tu cuenta <b>' . h($u['usuario']) . '</b>.')
        . '<tr><td style="padding:22px 30px 6px">' . pebai_email_button($url, 'Poner contraseña nueva', '#594AF7') . '</td></tr>'
        . '<tr><td style="padding:6px 30px 24px;color:#5B6172;font-size:14px;line-height:1.6">El enlace vale <b>1 hora</b> y solo se puede usar una vez. '
        . 'Si no lo has pedido tú, no hagas nada: tu contraseña sigue igual.</td></tr>',
        'PEBAI Systems · Panel privado');
    $texto = "Hola, $nombre.\n\nPara poner una contraseña nueva en el panel de PEBAI (cuenta {$u['usuario']}), abre este enlace:\n$url\n\n"
        . "Vale 1 hora y solo se puede usar una vez. Si no lo has pedido tú, no hagas nada: tu contraseña sigue igual.\n";
    pebai_correo_panel($u['email'], 'Tu contraseña del panel de PEBAI', $html, $texto);
}

/**
 * Envía un correo del panel con el mismo SMTP que el resto (private/config.php › smtp).
 * Solo para el banco de pruebas en local: si config.php trae 'panel_correo_archivo', el correo se escribe en ese archivo y no sale.
 */
function pebai_correo_panel(string $to, string $asunto, string $html, string $texto): void
{
    $archivo = (string)(pebai_config()['panel_correo_archivo'] ?? '');
    try {
        if ($archivo !== '') {
            file_put_contents($archivo, '[' . date('Y-m-d H:i:s') . "] Para: $to · $asunto\n$texto\n----\n", FILE_APPEND | LOCK_EX);
            return;
        }
        pebai_smtp_send($to, $asunto, $html, $texto);
    } catch (Throwable $e) {
        pebai_log('CUENTAS correo: ' . $e->getMessage());
    }
}

/** La fila del enlace si vale (existe, sin usar y sin caducar); si no, null. */
function pebai_reset_buscar(string $token): ?array
{
    if (!preg_match('/^[0-9a-f]{64}$/', $token)) {
        return null;
    }
    $q = pebai_usuarios_db()->prepare('SELECT r.*, u.nombre, u.activo FROM usuarios_reset r JOIN usuarios u ON u.usuario = r.usuario WHERE r.hash = ? AND r.usado = 0 AND r.caduca > ?');
    $q->execute([hash('sha256', $token), time()]);
    $r = pebai_fila($q);
    return $r && (int)$r['activo'] ? $r : null;
}

/** Gasta el enlace y pone la contraseña nueva. Devuelve '' si ha ido bien o el motivo del fallo. */
function pebai_reset_usar(string $token, string $nueva, string $repite): string
{
    $r = pebai_reset_buscar($token);
    if (!$r) {
        return 'Este enlace ya no vale: ha caducado o ya se ha usado. Pide otro.';
    }
    if ($nueva !== $repite) {
        return 'Las dos contraseñas no coinciden.';
    }
    if (($e = pebai_clave_valida($nueva)) !== '') {
        return $e;
    }
    $db = pebai_usuarios_db();
    // Se marca como usado antes de nada: aunque lleguen dos peticiones a la vez, solo una lo gasta
    $q = $db->prepare('UPDATE usuarios_reset SET usado = 1 WHERE hash = ? AND usado = 0');
    $q->execute([hash('sha256', $token)]);
    if ($q->rowCount() !== 1) {
        return 'Este enlace ya no vale: ha caducado o ya se ha usado. Pide otro.';
    }
    pebai_usuario_poner_clave($r['usuario'], $nueva);
    return '';
}
