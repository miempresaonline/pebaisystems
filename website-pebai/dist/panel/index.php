<?php
/*
 * PEBAI · Panel privado del embudo (panel.pebaisystems.es).
 * Resumen por origen, solicitudes y citas. Acceso con contraseña (hash en private/config.php).
 *
 * Sirve igual como raíz del subdominio (carpeta public_html/panel como document root)
 * que en https://pebaisystems.es/panel/ mientras el subdominio no exista: BASE lo decide.
 * Secciones: Embudo (assets/panel.js, datos en ?data=1), Captación y Agentes (assets/agentes.js, datos en ?agentes=1),
 * Empresa › Caja (assets/caja.js, datos en ?caja=1).
 * Este archivo autentica, sirve los datos y aplica las acciones (POST action=…).
 */
require dirname(__DIR__) . '/api/_pebai_lib.php';
require dirname(__DIR__) . '/api/_agentes_lib.php';
require dirname(__DIR__) . '/api/_caja_lib.php';

header('X-Robots-Tag: noindex, nofollow');
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');
header('Cache-Control: no-store');

const PANEL_HOST = 'panel.pebaisystems.es';
$host = strtolower($_SERVER['HTTP_HOST'] ?? '');
define('BASE', $host === PANEL_HOST ? '/' : '/panel/');

// El panel vive en panel.pebaisystems.es (activo desde el 14/10/2026): la ruta antigua /panel/ redirige allí.
if (BASE !== '/' && $_SERVER['REQUEST_METHOD'] === 'GET' && in_array($host, ['pebaisystems.es', 'www.pebaisystems.es'], true)) {
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
/** Contraseña normal, o la clave rápida si viene de la casilla del atajo (Ctrl + 5 × Espacio). */
function pebai_login_ok(): bool
{
    $cfg = pebai_config();
    if (($_POST['modo'] ?? '') === 'atajo') {
        $hash = (string)($cfg['panel_password_atajo_hash'] ?? '');
        // da igual mayúsculas o minúsculas, y la ñ escrita como n + tilde
        $clave = mb_strtolower(str_replace("n\u{303}", 'ñ', trim((string)($_POST['clave'] ?? ''))), 'UTF-8');
        return $hash !== '' && $clave !== '' && password_verify($clave, $hash);
    }
    return password_verify($_POST['password'] ?? '', $cfg['panel_password_hash']);
}
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
    } elseif (pebai_login_ok()) {
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
if (!$auth && (isset($_GET['data']) || isset($_GET['caja']) || isset($_GET['oficina']) || isset($_GET['qr']) || isset($_GET['mapa']) || (isset($_POST['action']) && $_POST['action'] !== 'login'))) {
    json_out(['ok' => false, 'error' => 'Sesión caducada. Recarga la página.'], 401);
}

// Captación › Email (todo lo del email vive en ese archivo). Condicional: si aún no está subido, el panel sigue funcionando.
if (is_file(__DIR__ . '/_email_panel.php')) {
    require __DIR__ . '/_email_panel.php';
}
// Automático › Oficina (centro de control de los agentes: solo lee, no cambia nada de ellos)
if (is_file(__DIR__ . '/_oficina_panel.php')) {
    require __DIR__ . '/_oficina_panel.php';
}
// Captación › QRs para la calle y › Mapa de prospectos
foreach (['_qr_panel.php', '_mapa_panel.php', '_conversaciones_panel.php'] as $f) {
    if (is_file(__DIR__ . '/' . $f)) {
        require __DIR__ . '/' . $f;
    }
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
        case 'canal':
            // Corrección a mano del canal y dueño (o confirmar el automático: quita el aviso de revisar)
            $id = (int)($_POST['id'] ?? 0);
            $canal = (string)($_POST['canal'] ?? '');
            if (!isset(PEBAI_CANALES[$canal])) {
                json_out(['ok' => false, 'error' => 'Canal no válido.'], 400);
            }
            $q = $db->prepare('SELECT canal_dueno, canal_auto FROM leads WHERE id = ?');
            $q->execute([$id]);
            $antes = $q->fetch();
            if (!$antes) {
                json_out(['ok' => false, 'error' => 'No existe la solicitud #' . $id . '.'], 404);
            }
            $db->prepare('UPDATE leads SET canal_dueno = ?, canal_manual = ?, canal_revisar = ?, updated_at = ? WHERE id = ?')
                ->execute([$canal, $canal === $antes['canal_auto'] ? '' : '1', $canal === 'pendiente' ? '1' : '', $now, $id]);
            pebai_evento($id, 'canal', ($antes['canal_dueno'] === $canal ? 'Canal confirmado: ' : 'Canal cambiado a: ') . PEBAI_CANALES[$canal][0]
                . ($antes['canal_dueno'] !== $canal && isset(PEBAI_CANALES[$antes['canal_dueno']]) ? ' (antes ' . PEBAI_CANALES[$antes['canal_dueno']][0] . ')' : ''), false);
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
        /* ---- Captación y agentes ---- */
        case 'prospectos_importar':
            $raw = (string)($_POST['texto'] ?? '');
            if (!empty($_FILES['archivo']['tmp_name']) && is_uploaded_file($_FILES['archivo']['tmp_name'])) {
                if ($_FILES['archivo']['size'] > 5 * 1024 * 1024) {
                    json_out(['ok' => false, 'error' => 'El archivo pasa de 5 MB.'], 400);
                }
                $raw = (string)file_get_contents($_FILES['archivo']['tmp_name']);
                if (!mb_check_encoding($raw, 'UTF-8')) {
                    $raw = mb_convert_encoding($raw, 'UTF-8', 'Windows-1252');
                }
            }
            if (trim($raw) === '') {
                json_out(['ok' => false, 'error' => 'Sube un CSV o pega la lista.'], 400);
            }
            $origen = mb_substr(trim((string)($_POST['origen'] ?? '')), 0, 120);
            if ($origen === '') {
                json_out(['ok' => false, 'error' => 'Indica de dónde salen los números (p. ej. «Google Maps, ficha pública»).'], 400);
            }
            $lote = mb_substr(trim((string)($_POST['lote'] ?? '')), 0, 80) ?: date('d/m H:i');
            $enRevision = ($_POST['revision'] ?? '') === '1';
            $res = pebai_prospectos_importar($raw, $origen, $lote, $enRevision ? 'revision' : 'pendiente');
            $res['revision'] = $enRevision;
            pebai_actividad('whatsapp', 'cambio', 'Importados ' . $res['nuevos'] . ' prospectos nuevos (lote ' . $lote . ')', json_encode($res, JSON_UNESCAPED_UNICODE));
            json_out(['ok' => true, 'res' => $res]);
        case 'prospectos_aprobar':
            // Aprueba de golpe las que están en revisión (todas o las de un lote): pasan a la cola del agente
            $lote = (string)($_POST['lote'] ?? '');
            $q = pebai_agentes_db()->prepare("UPDATE prospectos SET estado = 'pendiente', updated_at = ? WHERE estado = 'revision'" . ($lote !== '' ? ' AND lote = ?' : ''));
            $q->execute($lote !== '' ? [$now, $lote] : [$now]);
            pebai_actividad('whatsapp', 'cambio', 'Aprobados ' . $q->rowCount() . ' prospectos en revisión' . ($lote !== '' ? ' (lote ' . $lote . ')' : ''));
            json_out(['ok' => true, 'aprobados' => $q->rowCount()]);
        case 'prospecto_estado':
            $id = (int)($_POST['id'] ?? 0);
            $estado = (string)($_POST['estado'] ?? '');
            if (!in_array($estado, ['pendiente', 'descartado', 'baja', 'respondio'], true)) {
                json_out(['ok' => false, 'error' => 'Estado no válido.'], 400);
            }
            $q = pebai_agentes_db()->prepare('SELECT telefono FROM prospectos WHERE id = ?');
            $q->execute([$id]);
            $tel = $q->fetchColumn();
            if ($tel === false) {
                json_out(['ok' => false, 'error' => 'No existe el prospecto.'], 404);
            }
            if ($estado === 'baja') {
                pebai_wa_baja($tel, 'Marcado a mano en el panel');
                pebai_actividad('whatsapp', 'cambio', 'Baja marcada a mano en el panel', '', 'wa:' . $id);
                json_out(['ok' => true]);
            }
            $q = pebai_agentes_db()->prepare('SELECT COUNT(*) FROM bajas WHERE telefono = ?');
            $q->execute([$tel]);
            if ((int)$q->fetchColumn()) {
                json_out(['ok' => false, 'error' => 'Pidió la baja: no se le puede volver a escribir.'], 400);
            }
            pebai_agentes_db()->prepare("UPDATE prospectos SET estado = ?, error = '', updated_at = ? WHERE id = ?")->execute([$estado, $now, $id]);
            json_out(['ok' => true]);
        case 'prospecto_notas':
            $id = (int)($_POST['id'] ?? 0);
            pebai_agentes_db()->prepare('UPDATE prospectos SET notas = ?, updated_at = ? WHERE id = ?')
                ->execute([mb_substr(trim((string)($_POST['notas'] ?? '')), 0, 3000), $now, $id]);
            json_out(['ok' => true]);
        case 'agente_pausa':
            pebai_agentes_db()->prepare("UPDATE agente_estado SET pausado = ? WHERE agente = 'whatsapp'")->execute([($_POST['pausado'] ?? '') === '1' ? 1 : 0]);
            pebai_actividad('whatsapp', 'cambio', ($_POST['pausado'] ?? '') === '1' ? 'Pausado desde el panel' : 'Reanudado desde el panel');
            json_out(['ok' => true]);
        case 'agente_config':
            $cfg = pebai_wa_config();
            $cfg['limite_dia'] = max(0, min(200, (int)($_POST['limite_dia'] ?? $cfg['limite_dia'])));
            $ventanas = [];
            foreach (preg_split('/[,\n]+/', (string)($_POST['ventanas'] ?? '')) as $tramo) {
                if (preg_match('/^\s*(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\s*$/', $tramo, $m) && strtotime($m[1]) < strtotime($m[2])) {
                    $ventanas[] = [$m[1], $m[2]];
                }
            }
            if (!$ventanas) {
                json_out(['ok' => false, 'error' => 'Horario no válido. Ejemplo: 08:30-13:00, 17:00-20:00'], 400);
            }
            $cfg['ventanas'] = $ventanas;
            // Plantillas por nicho: un cuadro por nicho, variantes separadas por una línea "---" y con su letra delante ("A: …").
            $nichos = [];
            foreach ((array)($_POST['plantillas'] ?? []) as $k => $txt) {
                if (!isset(PEBAI_WA_NICHOS[$k])) {
                    continue;
                }
                $vars = [];
                $letra = 'A';
                foreach (array_filter(array_map('trim', preg_split('/\n\s*-{3,}\s*\n/', str_replace("\r", '', (string)$txt)))) as $bloque) {
                    if (preg_match('/^([A-Z])\s*:\s*/u', $bloque, $m)) {
                        $letra = $m[1];
                        $bloque = trim(substr($bloque, strlen($m[0])));
                    }
                    if (!str_contains($bloque, 'Daniel') || !preg_match('/no (te |os |le )?(vuelvo|volver|molest|escrib)/iu', $bloque)) {
                        json_out(['ok' => false, 'error' => 'Cada plantilla debe decir quién escribe (Daniel) y ofrecer no volver a escribir. Es lo que nos mantiene dentro de la ley.'], 400);
                    }
                    $vars[$letra] = $bloque;
                    $letra = chr(ord($letra) + 1);
                }
                if ($vars) {
                    $nichos[$k] = ['plantillas' => $vars];
                }
            }
            pebai_agentes_db()->prepare("UPDATE agente_estado SET config = ? WHERE agente = 'whatsapp'")
                ->execute([json_encode(['limite_dia' => $cfg['limite_dia'], 'ventanas' => $cfg['ventanas'], 'nichos' => $nichos], JSON_UNESCAPED_UNICODE)]);
            pebai_actividad('whatsapp', 'cambio', 'Ajustes cambiados: ' . $cfg['limite_dia'] . ' al día, horario ' . implode(', ', array_map(fn($v) => implode('–', $v), $ventanas)));
            json_out(['ok' => true]);
        /* ---- Empresa › Caja ---- */
        case 'caja_guardar':
            $cdb = pebai_caja_db();
            $id = (int)($_POST['id'] ?? 0);
            $tipo = ($_POST['tipo'] ?? '') === 'ingreso' ? 'ingreso' : 'gasto';
            $importe = pebai_caja_cent((string)($_POST['importe'] ?? ''));
            $fecha = pebai_caja_fecha((string)($_POST['fecha'] ?? ''));
            $concepto = mb_substr(trim((string)($_POST['concepto'] ?? '')), 0, 200);
            if ($importe === null) {
                json_out(['ok' => false, 'error' => 'Escribe un importe válido, por ejemplo 1.250,00.'], 422);
            }
            if ($fecha === null) {
                json_out(['ok' => false, 'error' => 'La fecha no es válida.'], 422);
            }
            if ($concepto === '') {
                json_out(['ok' => false, 'error' => 'Pon un concepto: qué es este movimiento.'], 422);
            }
            $forma = in_array($_POST['forma'] ?? '', CAJA_FORMAS, true) ? $_POST['forma'] : '';
            $campos = [
                'tipo' => $tipo, 'fecha' => $fecha, 'importe' => $importe, 'concepto' => $concepto,
                'categoria' => mb_substr(trim((string)($_POST['categoria'] ?? '')), 0, 80),
                'servicio' => $tipo === 'ingreso' ? mb_substr(trim((string)($_POST['servicio'] ?? '')), 0, 120) : '',
                'cliente' => mb_substr(trim((string)($_POST['cliente'] ?? '')), 0, 160),
                'lead_id' => max(0, (int)($_POST['lead_id'] ?? 0)),
                'forma' => $forma,
                'cobrado' => ($_POST['cobrado'] ?? '1') === '0' ? 0 : 1,
                'notas' => mb_substr(trim((string)($_POST['notas'] ?? '')), 0, 2000),
            ];
            if ($id > 0) {
                $set = implode(', ', array_map(fn($k) => "$k = ?", array_keys($campos)));
                $cdb->prepare("UPDATE caja_movimientos SET $set, updated_at = ? WHERE id = ?")->execute(array_merge(array_values($campos), [$now, $id]));
            } else {
                $campos['created_at'] = $now;
                $cols = array_keys($campos);
                $cdb->prepare('INSERT INTO caja_movimientos (' . implode(',', $cols) . ') VALUES (' . implode(',', array_fill(0, count($cols), '?')) . ')')
                    ->execute(array_values($campos));
                $id = (int)$cdb->lastInsertId();
            }
            json_out(['ok' => true, 'id' => $id]);
        case 'caja_borrar':
            $cdb = pebai_caja_db();
            $id = (int)($_POST['id'] ?? 0);
            // Un cargo de suscripción no se borra: se anula, para que no vuelva a apuntarse solo
            $cdb->prepare("UPDATE caja_movimientos SET tipo = 'anulado', updated_at = ? WHERE id = ? AND suscripcion_id > 0")->execute([$now, $id]);
            $cdb->prepare('DELETE FROM caja_movimientos WHERE id = ? AND suscripcion_id = 0')->execute([$id]);
            json_out(['ok' => true]);
        case 'sus_guardar':
            $cdb = pebai_caja_db();
            $id = (int)($_POST['id'] ?? 0);
            $nombre = mb_substr(trim((string)($_POST['nombre'] ?? '')), 0, 120);
            $importe = pebai_caja_cent((string)($_POST['importe'] ?? ''));
            $inicio = pebai_caja_fecha((string)($_POST['inicio'] ?? ''));
            $fin = trim((string)($_POST['fin'] ?? '')) === '' ? '' : pebai_caja_fecha((string)$_POST['fin']);
            if ($nombre === '' || $importe === null || $inicio === null || $fin === null) {
                json_out(['ok' => false, 'error' => 'Revisa el nombre, el importe y las fechas.'], 422);
            }
            $campos = [
                'nombre' => $nombre, 'importe' => $importe,
                'categoria' => mb_substr(trim((string)($_POST['categoria'] ?? '')), 0, 80) ?: 'Herramientas y software',
                'periodo' => ($_POST['periodo'] ?? '') === 'anual' ? 'anual' : 'mensual',
                'dia' => max(1, min(28, (int)($_POST['dia'] ?? 1))),
                'inicio' => $inicio, 'fin' => $fin,
                'activa' => ($_POST['activa'] ?? '1') === '0' ? 0 : 1,
                'forma' => in_array($_POST['forma'] ?? '', CAJA_FORMAS, true) ? $_POST['forma'] : 'tarjeta',
                'notas' => mb_substr(trim((string)($_POST['notas'] ?? '')), 0, 1000),
            ];
            if ($id > 0) {
                $set = implode(', ', array_map(fn($k) => "$k = ?", array_keys($campos)));
                $cdb->prepare("UPDATE caja_suscripciones SET $set, updated_at = ? WHERE id = ?")->execute(array_merge(array_values($campos), [$now, $id]));
            } else {
                $campos['created_at'] = $now;
                $cols = array_keys($campos);
                $cdb->prepare('INSERT INTO caja_suscripciones (' . implode(',', $cols) . ') VALUES (' . implode(',', array_fill(0, count($cols), '?')) . ')')
                    ->execute(array_values($campos));
            }
            pebai_caja_suscripciones_al_dia();
            json_out(['ok' => true]);
        case 'sus_borrar':
            // Los cargos ya apuntados se quedan en la caja: fueron gastos reales
            pebai_caja_db()->prepare('DELETE FROM caja_suscripciones WHERE id = ?')->execute([(int)($_POST['id'] ?? 0)]);
            json_out(['ok' => true]);
        case 'caja_ajuste':
            $raw = trim((string)($_POST['saldo_inicial'] ?? ''));
            $neg = strpos($raw, '-') === 0;
            $cent = $raw === '' || preg_match('/^-?0+([.,]0+)?$/', $raw) ? 0 : pebai_caja_cent(ltrim($raw, '-'));
            $fecha = pebai_caja_fecha((string)($_POST['saldo_fecha'] ?? ''));
            if ($cent === null || $fecha === null) {
                json_out(['ok' => false, 'error' => 'Revisa el importe y la fecha del saldo inicial.'], 422);
            }
            $up = pebai_caja_db()->prepare('INSERT INTO caja_ajustes (clave, valor) VALUES (?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor');
            $up->execute(['saldo_inicial', (string)($neg ? -$cent : $cent)]);
            $up->execute(['saldo_fecha', $fecha]);
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
    $cols = ['id', 'created_at', 'estado', 'empresa', 'nombre', 'telefono', 'equipo', 'canal', 'volumen', 'objetivo', 'presupuesto',
             'opcion', 'fuente', 'medio', 'campana', 'contenido', 'palabra', 'cta', 'conocio', 'canal_dueno', 'canal_revisar', 'canal_motivo',
             'cita_inicio', 'cliente_email', 'notas'];
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
    $cols = ['id', 'created_at', 'estado', 'notas', 'empresa', 'nombre', 'telefono', 'equipo', 'canal', 'volumen', 'objetivo', 'presupuesto', 'opcion',
             'fuente', 'medio', 'campana', 'contenido', 'palabra', 'cta', 'primer_toque', 'ultimo_toque', 'pagina', 'dispositivo',
             'email_enviado', 'updated_at', 'cita_inicio', 'cita_fin', 'cita_uid', 'cita_estado', 'cliente_nombre', 'cliente_email', 'visto_at', 'enlace_at',
             'conocio', 'canal_dueno', 'canal_auto', 'canal_motivo', 'canal_revisar', 'canal_manual', 'tipo'];
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
    $canales = [];
    foreach (PEBAI_CANALES as $k => [$label, $dueno]) {
        $canales[] = ['clave' => $k, 'label' => $label, 'dueno' => $dueno];
    }
    json_out(['ok' => true, 'canales' => $canales, 'conocio' => PEBAI_CONOCIO, 'eventos' => $eventos, 'ahora' => date('Y-m-d H:i:s'), 'ahora_utc' => gmdate('Y-m-d\TH:i:s\Z'), 'csrf' => csrf(), 'leads' => $leads, 'citas' => $citas]);
}

/* ------------------------------------------- Datos de Captación y Agentes --- */
/* ------------------------------------------------------ Caja (JSON) --- */
if ($auth && isset($_GET['caja'])) {
    try {
        pebai_caja_suscripciones_al_dia();
        $cdb = pebai_caja_db();
        $movs = $cdb->query("SELECT * FROM caja_movimientos WHERE tipo IN ('ingreso','gasto') ORDER BY fecha DESC, id DESC")->fetchAll();
        foreach ($movs as &$m) {
            foreach (['id', 'importe', 'lead_id', 'cobrado', 'suscripcion_id'] as $k) {
                $m[$k] = (int)$m[$k];
            }
        }
        unset($m);
        $subs = $cdb->query('SELECT * FROM caja_suscripciones ORDER BY activa DESC, importe DESC')->fetchAll();
        foreach ($subs as &$x) {
            foreach (['id', 'importe', 'dia', 'activa'] as $k) {
                $x[$k] = (int)$x[$k];
            }
        }
        unset($x);
        $aj = $cdb->query('SELECT clave, valor FROM caja_ajustes')->fetchAll(PDO::FETCH_KEY_PAIR);
        // Solo empresa y fase: para elegir a quién se le vendió sin escribirlo a mano
        $clientes = $cdb->query("SELECT id, empresa, estado FROM leads ORDER BY CASE estado WHEN 'cliente' THEN 0 ELSE 1 END, id DESC LIMIT 2000")->fetchAll();
    } catch (Throwable $e) {
        json_out(['ok' => false, 'error' => 'No se puede abrir la caja: ' . $e->getMessage()], 500);
    }
    json_out(['ok' => true, 'csrf' => csrf(), 'hoy' => date('Y-m-d'), 'movimientos' => $movs, 'suscripciones' => $subs,
              'saldo_inicial' => (int)($aj['saldo_inicial'] ?? 0), 'saldo_fecha' => (string)($aj['saldo_fecha'] ?? ''), 'clientes' => $clientes]);
}

if ($auth && isset($_GET['agentes'])) {
    if (!$db) {
        json_out(['ok' => false, 'error' => $dbError], 500);
    }
    $adb = pebai_agentes_db();
    $pros = $adb->query('SELECT id, created_at, updated_at, empresa, nombre, telefono, sector, ciudad, web, origen_dato, lote, notas, estado, enviado_at, respondido_at, error, plantilla, mensaje
                         FROM prospectos ORDER BY id DESC LIMIT 5000')->fetchAll();
    foreach ($pros as &$p) {
        $p['id'] = (int)$p['id'];
    }
    unset($p);
    $msgs = $adb->query("SELECT m.id, m.ts, m.prospecto_id, m.sentido, m.texto, p.empresa, p.telefono FROM agente_mensajes m
                         LEFT JOIN prospectos p ON p.id = m.prospecto_id WHERE m.agente = 'whatsapp' ORDER BY m.id DESC LIMIT 400")->fetchAll();
    foreach ($msgs as &$m) {
        $m['id'] = (int)$m['id'];
        $m['prospecto_id'] = (int)$m['prospecto_id'];
    }
    unset($m);
    $wa = pebai_agente('whatsapp');
    $cfg = pebai_wa_config();
    $vent = pebai_wa_ventana();
    $q = $adb->prepare("SELECT substr(ts, 1, 10) d, sentido, COUNT(*) n FROM agente_mensajes WHERE agente = 'whatsapp' AND ts >= ? GROUP BY d, sentido");
    $q->execute([date('Y-m-d', strtotime('-29 days'))]);
    $nichosOut = [];
    foreach ($cfg['nichos'] as $k => $n) {
        $nichosOut[] = ['clave' => $k, 'nombre' => $n['nombre'], 'plantillas' => $n['plantillas']];
    }
    // Las de email se ven en la misma lista de Prospectos (canal «email»): sin descartadas
    try {
        $emailPros = $adb->query("SELECT id, created_at, empresa, nombre, email, telefono, sector, nicho, ciudad, web, lote, estado, enviado1_at, respondido_at, error
                                  FROM email_prospectos WHERE estado <> 'descartado' ORDER BY id DESC LIMIT 5000")->fetchAll();
    } catch (Throwable $e) {
        $emailPros = [];
    }
    foreach ($emailPros as &$p) {
        $p['id'] = (int)$p['id'];
    }
    unset($p);
    json_out(['ok' => true, 'ahora' => date('Y-m-d H:i:s'), 'csrf' => csrf(), 'prospectos' => $pros, 'email_prospectos' => $emailPros, 'mensajes' => $msgs, 'por_dia' => $q->fetchAll(),
              'bajas' => (int)$adb->query('SELECT COUNT(*) FROM bajas')->fetchColumn(),
              'nichos' => $nichosOut, 'stats' => pebai_wa_stats(), 'actividad' => pebai_actividad_ultimas('whatsapp', 150),
              'whatsapp' => ['estado' => $wa['estado'], 'latido_at' => $wa['latido_at'], 'detalle' => $wa['detalle'], 'codigo' => $wa['codigo'], 'pausado' => (int)$wa['pausado'],
                             'enviados_hoy' => pebai_wa_enviados_hoy(), 'limite_dia' => $cfg['limite_dia'], 'ventanas' => $cfg['ventanas'],
                             'abierta' => $vent['abierta'], 'proxima' => $vent['proxima'] ? date('Y-m-d H:i:s', $vent['proxima']) : '']]);
}

$v = '41';
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
<link rel="stylesheet" href="<?= BASE ?>assets/oficina.css?v=<?= $v ?>">
<link rel="stylesheet" href="<?= BASE ?>assets/qr.css?v=<?= $v ?>">
<link rel="stylesheet" href="<?= BASE ?>assets/mapa.css?v=<?= $v ?>">
<link rel="stylesheet" href="<?= BASE ?>assets/conversaciones.css?v=<?= $v ?>">
<link rel="stylesheet" href="<?= BASE ?>assets/cajas.css?v=<?= $v ?>">
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"}}</script>
<link rel="stylesheet" href="<?= BASE ?>assets/email.css?v=<?= $v ?>">
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
    <label class="pb-field" id="pb-login-normal"><span>Contraseña</span><input type="password" name="password" autocomplete="current-password" required autofocus></label>
    <label class="pb-field" id="pb-login-atajo" hidden style="display:none"><span>Clave rápida</span><input type="password" name="clave" autocomplete="off" disabled></label>
    <input type="hidden" name="modo" value="" id="pb-login-modo">
    <button class="pb-btn primary wide" type="submit">Entrar</button>
  </form>
  <script>
  /* Ctrl + 5 veces Espacio (en menos de 4 s, soltando o no el Ctrl) cambia a la casilla de la clave rápida; Esc vuelve. */
  (() => {
    const normal = document.getElementById('pb-login-normal'), atajo = document.getElementById('pb-login-atajo'), modo = document.getElementById('pb-login-modo');
    const pass = normal.querySelector('input'), clave = atajo.querySelector('input');
    let n = 0, t0 = 0;
    const poner = (rapida) => {
      normal.hidden = rapida; normal.style.display = rapida ? 'none' : ''; pass.disabled = rapida; pass.required = !rapida;
      atajo.hidden = !rapida; atajo.style.display = rapida ? '' : 'none'; clave.disabled = !rapida; clave.required = rapida;
      modo.value = rapida ? 'atajo' : ''; (rapida ? clave : pass).focus();
    };
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modo.value) { poner(false); return; }
      if (e.code !== 'Space' || !e.ctrlKey) return;
      e.preventDefault();
      const ahora = Date.now(); if (ahora - t0 > 4000) { n = 0; t0 = ahora; }
      if (++n >= 5) { n = 0; poner(!modo.value); }
    });
  })();
  </script>
</main>

<?php else: ?>
<div class="pb-app" id="pb-app" data-base="<?= h(BASE) ?>" data-csrf="<?= h(csrf()) ?>">

<aside class="pb-side" aria-label="Secciones del panel">
  <a class="pb-brand" href="<?= BASE ?>" aria-label="Panel PEBAI">
      <img class="pb-mark" src="<?= BASE ?>assets/pebai-mark.png" width="122" height="144" alt=""><svg class="pb-word" viewBox="30 15 700 112" aria-label="PEBAI" role="img"><g fill="currentColor"><g transform="translate(30 15) scale(2.72003 1.55556) translate(-7 72)"><path d="M12.7500 0L7 0L7-72L34.1500-72Q35.2000-72 36.4250-71.9250Q37.6500-71.8500 39-71.6000L39-71.6000Q44.4000-70.7500 48.2750-67.7250Q52.1500-64.7000 54.2000-60.1250Q56.2500-55.5500 56.2500-50.0500L56.2500-50.0500Q56.2500-44.5000 54.2000-39.9250Q52.1500-35.3500 48.2750-32.3250Q44.4000-29.3000 39-28.4500L39-28.4500Q37.6500-28.2500 36.4250-28.1500Q35.2000-28.0500 34.1500-28.0500L34.1500-28.0500L12.7500-28.0500L12.7500 0ZM12.7500-66.4000L12.7500-33.7000L34.0500-33.7000Q34.9500-33.7000 36.1250-33.8000Q37.3000-33.9000 38.5000-34.1000L38.5000-34.1000Q42.4000-34.9000 45-37.2750Q47.6000-39.6500 48.9000-43Q50.2000-46.3500 50.2000-50.0500L50.2000-50.0500Q50.2000-53.7500 48.9000-57.0750Q47.6000-60.4000 45-62.7750Q42.4000-65.1500 38.5000-65.9500L38.5000-65.9500Q37.3000-66.2000 36.1250-66.3000Q34.9500-66.4000 34.0500-66.4000L34.0500-66.4000L12.7500-66.4000Z"/><path d="M113.7500 0L69.2500 0L69.2500-72L113.7500-72L113.7500-66.4000L75-66.4000L75-39.0500L107.7500-39.0500L107.7500-33.4500L75-33.4500L75-5.6000L113.7500-5.6000L113.7500 0Z"/><path d="M158.4000 0L128.7500 0L128.7500-72L156.3000-72Q161.9000-72 166.3750-69.6250Q170.8500-67.2500 173.4250-63.1500Q176-59.0500 176-53.9000L176-53.9000Q176-48.1000 172.8000-43.4750Q169.6000-38.8500 164.3000-37L164.3000-37L164.1000-39.4000Q171.2000-37.2500 175.3750-32.2250Q179.5500-27.2000 179.5500-19.8000L179.5500-19.8000Q179.5500-13.6000 176.8250-9.1750Q174.1000-4.7500 169.3000-2.3750Q164.5000 0 158.4000 0L158.4000 0ZM134.5500-35.1000L134.5500-5.6500L156.5000-5.6500Q161.3000-5.6500 165.1250-7.3000Q168.9500-8.9500 171.1750-12.0500Q173.4000-15.1500 173.4000-19.5500L173.4000-19.5500Q173.4000-23.9000 171.3750-27.4250Q169.3500-30.9500 165.9000-33.0250Q162.4500-35.1000 158.1500-35.1000L158.1500-35.1000L134.5500-35.1000ZM134.5500-66.4500L134.5500-40.6500L156.2500-40.6500Q160-40.6500 163.1250-42.4000Q166.2500-44.1500 168.1000-47.1750Q169.9500-50.2000 169.9500-54.1000L169.9500-54.1000Q169.9500-59.6500 166.0250-63.0500Q162.1000-66.4500 156.2500-66.4500L156.2500-66.4500L134.5500-66.4500Z"/><path d="M193.5500 0L187.4500 0L212.9500-72L220.1000-72L245.6000 0L239.5000 0L215-69L217.9000-69L193.5500 0ZM235-18.1000L198-18.1000L198-23.5500L235-23.5500L235-18.1000Z"/><path d="M264.3500 0L258.6000 0L258.6000-72L264.3500-72L264.3500 0Z"/></g></g></svg>
    </a>
  <nav class="pb-nav" id="pb-tabs">
    <div class="grp"><small>Embudo</small>
      <button data-page="resumen" type="button"><svg class="pb-i" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/></svg><span>Resumen</span></button>
      <button data-page="solicitudes" type="button"><svg class="pb-i" viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/><path d="M8 9h8M8 13h8M8 17h5"/></svg><span>Solicitudes</span><em id="pb-leads-n">—</em><i class="pb-dot" id="pb-leads-dot" hidden></i></button>
      <button data-page="citas" type="button"><svg class="pb-i" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg><span>Citas</span><em id="pb-citas-n">—</em></button>
    </div>
    <div class="grp"><small>Captación</small>
      <button data-page="conversaciones" type="button"><svg class="pb-i" viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M8 11h8M8 14h5"/></svg><span>Conversaciones</span><em id="pb-conv-n">—</em></button>
      <button data-page="prospectos" type="button"><svg class="pb-i" viewBox="0 0 24 24"><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M19 8v6M16 11h6"/></svg><span>Prospectos</span><em id="pb-pros-n">—</em></button>
      <button data-page="mapa" type="button"><svg class="pb-i" viewBox="0 0 24 24"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/></svg><span>Mapa</span></button>
      <button data-page="qr" type="button"><svg class="pb-i" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 17h3v4h-3"/></svg><span>QRs</span></button>
    </div>
    <div class="grp"><small>Empresa</small>
      <button data-page="caja" type="button"><svg class="pb-i" viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="14" rx="3"/><path d="M16 13h.01"/><path d="M2 10h20"/><path d="M6 6V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"/></svg><span>Caja</span></button>
    </div>
    <div class="grp"><small>Automático</small>
      <button data-page="agentes" type="button"><svg class="pb-i" viewBox="0 0 24 24"><rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 4v4M9 13h.01M15 13h.01M9 17h6"/></svg><span>Agentes</span><i class="pb-live" id="pb-ag-live" title="Estado de los agentes"></i></button>
    </div>
  </nav>
  <div class="pb-side-foot">
    <button class="pb-btn icon" id="pb-avisos" title="Activar avisos de nuevas solicitudes" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></button>
    <button class="pb-btn icon" id="pb-theme" title="Cambiar tema" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z"/></svg></button>
    <a class="pb-btn ghost" href="<?= BASE ?>?salir=1">Salir</a>
  </div>
</aside>

<main class="pb-shell pb-main">
  <div class="pb-top">
    <div class="pb-crumb" id="pb-crumb"><span>Embudo</span><b>Resumen</b></div>
    <div class="pb-seg pb-only-embudo" id="pb-periodo" aria-label="Periodo">
      <button data-p="7">7 días</button><button data-p="30">30 días</button><button data-p="90">90 días</button><button data-p="todo">Todo</button>
    </div>
    <a class="pb-btn pb-only-embudo" href="<?= BASE ?>?csv=1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>Exportar CSV</a>
  </div>

  <section class="pb-page" id="page-resumen" data-page="resumen">
    <h1 class="pb-h1">El embudo, <i>de un vistazo</i></h1>
    <p class="pb-lead" id="pb-takeaway">—</p>
    <div class="pb-plazas" id="pb-plazas"></div>
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
          <div class="pb-subtabs" id="pb-dim"><button data-d="fuente" class="on" type="button">Fuente · medio</button><button data-d="campana" type="button">Campaña</button><button data-d="palabra" type="button">Palabra</button><button data-d="canal" type="button">Canal · dueño</button></div></div>
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
      <select id="pb-f-canal" aria-label="Canal y dueño"><option value="">Todos los canales</option></select>
      <button class="pb-btn ghost" id="pb-limpiar" type="button">Limpiar</button>
    </div>
    <div class="pb-list" id="pb-leads"></div>
  </section>

  <section class="pb-page" id="page-citas" data-page="citas">
    <h1 class="pb-h1">Agenda de <i>sesiones técnicas</i></h1>
    <p class="pb-lead">Reservas de Cal.com. Las pasadas se marcan como asistió o no se presentó; las hechas sin enlace del panel se unen a su solicitud.</p>
    <div class="pb-plazas" id="pb-plazas-citas"></div>
    <div class="pb-grid two">
      <div>
        <div class="pb-card" style="margin-bottom:14px"><h2>Próximas</h2><p class="note">Con recordatorios automáticos a 24 h y 1 h.</p><div class="pb-agenda" id="pb-proximas"></div></div>
        <div class="pb-card"><h2>Citas sin solicitud</h2><p class="note">Reservas hechas sin el enlace del panel. Escribe el número de solicitud para unirlas.</p><div class="pb-agenda" id="pb-sinvincular"></div></div>
      </div>
      <div class="pb-card"><h2>Pasadas · marca si asistió</h2><p class="note">Marcar asistencia actualiza el estado de la solicitud.</p><div class="pb-agenda" id="pb-pasadas"></div></div>
    </div>
  </section>

  <section class="pb-page" id="page-conversaciones" data-page="conversaciones">
    <div class="pb-pagehead"><div>
      <div class="pb-eyebrow">Captación · CRM</div>
      <h1 class="pb-h1">Conversaciones, <i>una a una</i></h1>
      <p class="pb-lead">Todo lo que han enviado los agentes por WhatsApp y email, y lo que ha contestado cada empresa. La IA lee cada respuesta y la clasifica sola; si se equivoca, lo corriges en la conversación.</p>
    </div></div>
    <div class="pc-kpis" id="pc-kpis"></div>
    <div class="pc-bar">
      <div class="pc-estados" id="pc-estados"></div>
      <div class="pc-tools">
        <div class="pc-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="pc-q" type="search" placeholder="Buscar empresa, ciudad, teléfono, lo que contestaron…" aria-label="Buscar conversaciones"></div>
        <div class="pb-seg" id="pc-canal" aria-label="Canal"><button data-c="" type="button">Todos</button><button data-c="whatsapp" type="button">WhatsApp</button><button data-c="email" type="button">Email</button></div>
        <div class="pb-seg" id="pc-periodo" aria-label="Periodo"><button data-p="hoy" type="button">Hoy</button><button data-p="7" type="button">7 días</button><button data-p="30" type="button">30 días</button><button data-p="todo" type="button">Todo</button></div>
      </div>
    </div>
    <div class="pc-head"><span>Empresa</span><span>Enviado</span><span>Estado</span><span>Qué ha dicho</span><span></span></div>
    <div class="pc-lista" id="pc-lista"></div>
  </section>

  <section class="pb-page" id="page-prospectos" data-page="prospectos">
    <div class="pb-pagehead">
      <div>
        <div class="pb-eyebrow">Captación · Salida en frío</div>
        <h1 class="pb-h1">Prospectos, <i>uno a uno</i></h1>
        <p class="pb-lead">Todas las empresas buenas de cada nicho, en una sola lista. Las que tienen móvil van por <b>WhatsApp</b>; las que solo tienen email, por <b>email</b>. Las descartadas no salen ni cuentan. Quien pide la baja no vuelve a recibir nada.</p>
      </div>
      <button class="pb-btn primary big" id="pb-imp-abrir" type="button"><svg class="pb-i" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Añadir prospectos</button>
    </div>
    <div class="pb-grid k" id="pb-pros-kpis"></div>
    <div class="pb-card pb-import" id="pb-import" hidden>
      <div class="hd"><div><h2>Importar lista</h2><p class="note">CSV de Google Sheets o Excel, o pégala tal cual. Columnas: <b>empresa, telefono</b> y, si las tienes, nombre, sector, ciudad, web, origen, notas. Solo entran móviles; los repetidos se ignoran.</p></div>
        <button class="pb-btn ghost icon" id="pb-imp-cerrar" type="button" title="Cerrar"><svg class="pb-i" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>
      <form id="pb-imp-form" class="pb-imp-grid">
        <label class="pb-drop" id="pb-drop">
          <input type="file" name="archivo" accept=".csv,.tsv,.txt,text/csv" hidden>
          <svg class="pb-i" viewBox="0 0 24 24"><path d="M12 16V4m0 0 4 4m-4-4-4 4"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>
          <b id="pb-drop-t">Suelta aquí el CSV</b><small>o pulsa para elegirlo</small>
        </label>
        <textarea name="texto" placeholder="…o pega la lista:&#10;empresa;telefono;sector;ciudad&#10;Clínica Dental Sonrisa;612345678;Clínicas;Valencia"></textarea>
        <label class="pb-field"><span>De dónde salen los números <em class="req">obligatorio</em></span><input name="origen" required placeholder="Google Maps · ficha pública del negocio" value="Google Maps · ficha pública del negocio"></label>
        <label class="pb-field"><span>Nombre del lote</span><input name="lote" placeholder="Clínicas Valencia, octubre"></label>
        <label class="pb-check" style="grid-column:1/-1;display:flex;gap:10px;align-items:flex-start;font-size:13.5px"><input type="checkbox" name="revision" value="1" checked style="width:auto;margin-top:3px"><span><b>Entrar en revisión</b> · el agente no les escribe hasta que las apruebes aquí (botón «Aprobar» o «Aprobar todas»). Desmárcalo solo si la lista ya está revisada.</span></label>
        <div class="pb-imp-foot"><p class="note">Solo números publicados por la empresa como contacto comercial. Se guarda el origen de cada uno por si alguien pregunta de dónde lo sacamos.</p><button class="pb-btn primary" type="submit">Importar</button></div>
      </form>
    </div>
    <div class="pb-chips" id="pb-pros-chips"></div>
    <div class="pb-filters">
      <div class="grow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="pb-pros-q" type="search" placeholder="Buscar empresa, teléfono, sector, ciudad…" aria-label="Buscar prospectos"></div>
      <select id="pb-pros-lote" aria-label="Lote"><option value="">Todos los lotes</option></select>
    </div>
    <div class="pb-list" id="pb-pros-list"></div>
  </section>

  <section class="pb-page" id="page-mapa" data-page="mapa"><div class="pb-mapa" id="pb-mapa"></div></section>

  <section class="pb-page" id="page-qr" data-page="qr"><div class="pb-qr" id="pb-qr"></div></section>

  <section class="pb-page" id="page-caja" data-page="caja">
    <div class="pb-pagehead">
      <div>
        <div class="pb-eyebrow">Empresa · Caja</div>
        <h1 class="pb-h1">La caja, <i>al día</i></h1>
        <p class="pb-lead">Lo que entra, por qué entra y lo que sale. Las suscripciones se apuntan solas cada mes.</p>
      </div>
      <div class="pb-cj-acts">
        <button class="pb-btn primary big" data-cj-nuevo="ingreso" type="button"><svg class="pb-i" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Ingreso</button>
        <button class="pb-btn big" data-cj-nuevo="gasto" type="button"><svg class="pb-i" viewBox="0 0 24 24"><path d="M5 12h14"/></svg>Gasto</button>
      </div>
    </div>
    <div class="pb-cj-mes">
      <button class="pb-btn icon" id="pb-cj-prev" type="button" title="Mes anterior"><svg class="pb-i" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg></button>
      <b id="pb-cj-mes">—</b>
      <button class="pb-btn icon" id="pb-cj-next" type="button" title="Mes siguiente"><svg class="pb-i" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></button>
      <button class="pb-btn ghost" id="pb-cj-hoy" type="button">Este mes</button>
    </div>
    <div id="pb-cj"></div>
  </section>

  <section class="pb-page" id="page-agentes" data-page="agentes">
    <div class="pb-of-wrap" id="pb-of">
      <div class="pb-of-load" id="pb-of-load"><img src="<?= BASE ?>assets/pebai-mark.png" alt=""><span>Conectando con los agentes…</span></div>
      <div class="pb-of-hud" id="pb-of-hud"></div>
      <aside class="pb-of-side" id="pb-of-side"><button class="x" id="pb-of-x" type="button" aria-label="Cerrar">×</button><div id="pb-of-sidein"></div></aside>
      <div class="pb-of-ask" id="pb-of-ask">
        <div class="pb-of-ans" id="pb-of-ans"></div>
        <div class="pb-of-sug" id="pb-of-sug"></div>
        <form class="pb-of-box" id="pb-of-askf"><img src="<?= BASE ?>assets/pebai-mark.png" alt=""><input id="pb-of-q" placeholder="Pregunta a PEBAI sobre cualquier departamento…" autocomplete="off" maxlength="500"><button type="submit">Preguntar</button></form>
      </div>
    </div>
    <div class="pb-ag-ajustes-v" id="pb-ag-ajustes">
      <button class="pb-btn ghost pb-of-volver" id="pb-of-volver" type="button">← Volver a la oficina</button>
    <div class="pb-pagehead">
      <div>
        <div class="pb-eyebrow">Automático · 24/7 en el servidor</div>
        <h1 class="pb-h1">Tu equipo <i>que no duerme</i></h1>
        <p class="pb-lead" id="pb-ag-lead">Los agentes que trabajan solos, por departamento. Aquí ves si están vivos, qué han hecho hoy y a quién han escrito.</p>
      </div>
    </div>
    <div class="pb-dept">
      <div class="pb-dept-h"><span class="pb-ico lime"><svg class="pb-i" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></span><div><h2>Captación</h2><p>Primer contacto con empresas nuevas</p></div></div>
      <div id="pb-ag-wa"></div>
      <div class="pb-grid two pb-soon-row">
        <div class="pb-card pb-soon"><span class="pb-tile" style="background:linear-gradient(135deg,#6A5CFF,#3FD5FF)"><svg class="pb-i" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg></span><div><b>Agente de email</b><small>Secuencias en frío · próximamente</small></div></div>
      </div>
    </div>
    <div class="pb-dept">
      <div class="pb-dept-h"><span class="pb-ico"><svg class="pb-i" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 3v18M3 9h5"/></svg></span><div><h2>Redes</h2><p>Contenido que se publica solo</p></div></div>
      <div class="pb-grid two pb-soon-row">
        <div class="pb-card pb-soon"><span class="pb-tile" style="background:linear-gradient(45deg,#F58529,#DD2A7B 45%,#8134AF 75%,#515BD4)"><svg class="pb-i" viewBox="0 0 24 24"><rect x="2" y="6" width="14" height="14" rx="2"/><path d="M6 2h14a2 2 0 0 1 2 2v14"/></svg></span><div><b>Agente de carruseles</b><small>Radar diario y diseño automático · próximamente</small></div></div>
      </div>
    </div>
    </div>
  </section>
</main>
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
<script>window.PB_TAB = new URLSearchParams(location.search).get('tab');</script>
<script src="<?= BASE ?>assets/agentes.js?v=<?= $v ?>" defer></script>
<script src="<?= BASE ?>assets/conversaciones.js?v=<?= $v ?>" defer></script>
<script src="<?= BASE ?>assets/caja.js?v=<?= $v ?>" defer></script>
<script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js" defer></script>
<script src="<?= BASE ?>assets/qr.js?v=<?= $v ?>" defer></script>
<script src="<?= BASE ?>assets/mapa.js?v=<?= $v ?>" defer></script>
<script src="<?= BASE ?>assets/email.js?v=<?= $v ?>" defer></script>
<script type="module" src="<?= BASE ?>assets/oficina.js?v=<?= $v ?>"></script>
<script>
(() => {
  const vista = (ajustes) => { document.body.classList.toggle('pb-ag-ajustes', ajustes); try { sessionStorage.setItem('pb-ag-vista', ajustes ? 'ajustes' : 'oficina'); } catch (e) {} document.dispatchEvent(new CustomEvent('pb:agview')); window.scrollTo({ top: 0 }); };
  const ir = document.getElementById('pb-of-ajustes'), vuelve = document.getElementById('pb-of-volver');
  if (ir) ir.addEventListener('click', (e) => { e.stopPropagation(); vista(true); });
  if (vuelve) vuelve.addEventListener('click', () => vista(false));
  try { if (sessionStorage.getItem('pb-ag-vista') === 'ajustes') document.body.classList.add('pb-ag-ajustes'); } catch (e) {}
})();
</script>
<?php endif; ?>
</body>
</html>
