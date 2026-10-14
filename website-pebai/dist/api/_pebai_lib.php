<?php
/*
 * PEBAI · Librería compartida del embudo (formulario de diagnóstico + panel).
 * La configuración con credenciales vive FUERA de public_html:
 *   domains/pebaisystems.es/private/config.php
 * (plantilla en website-pebai/private/config.example.php)
 */

if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}

date_default_timezone_set('Europe/Madrid');

function pebai_config(): array
{
    static $cfg = null;
    if ($cfg === null) {
        $path = dirname(__DIR__, 2) . '/private/config.php';
        if (!is_file($path)) {
            throw new RuntimeException('Falta private/config.php');
        }
        $cfg = require $path;
    }
    return $cfg;
}

function pebai_private_dir(): string
{
    return dirname(__DIR__, 2) . '/private';
}

function pebai_log(string $msg): void
{
    @file_put_contents(pebai_private_dir() . '/errors.log', '[' . date('Y-m-d H:i:s') . '] ' . $msg . "\n", FILE_APPEND | LOCK_EX);
}

function pebai_db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO('sqlite:' . pebai_private_dir() . '/leads.sqlite');
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $pdo->exec('PRAGMA journal_mode = WAL');
        $pdo->exec('CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TEXT NOT NULL,
            estado TEXT NOT NULL DEFAULT "nuevo",
            notas TEXT NOT NULL DEFAULT "",
            empresa TEXT NOT NULL,
            nombre TEXT NOT NULL DEFAULT "",
            telefono TEXT NOT NULL,
            canal TEXT NOT NULL DEFAULT "",
            volumen TEXT NOT NULL DEFAULT "",
            objetivo TEXT NOT NULL DEFAULT "",
            presupuesto TEXT NOT NULL DEFAULT "",
            opcion TEXT NOT NULL DEFAULT "",
            fuente TEXT NOT NULL DEFAULT "",
            medio TEXT NOT NULL DEFAULT "",
            campana TEXT NOT NULL DEFAULT "",
            contenido TEXT NOT NULL DEFAULT "",
            palabra TEXT NOT NULL DEFAULT "",
            cta TEXT NOT NULL DEFAULT "",
            primer_toque TEXT NOT NULL DEFAULT "{}",
            ultimo_toque TEXT NOT NULL DEFAULT "{}",
            pagina TEXT NOT NULL DEFAULT "",
            dispositivo TEXT NOT NULL DEFAULT "",
            ip_hash TEXT NOT NULL DEFAULT "",
            email_enviado INTEGER NOT NULL DEFAULT 0,
            updated_at TEXT NOT NULL DEFAULT ""
        )');
        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at)');
        // Columnas de la cita (Cal.com), añadidas sin perder datos existentes
        $cols = array_column($pdo->query('PRAGMA table_info(leads)')->fetchAll(), 'name');
        foreach (['cita_inicio', 'cita_fin', 'cita_uid', 'cita_estado', 'cliente_nombre', 'cliente_email', 'visto_at', 'enlace_at', 'equipo'] as $col) {
            if (!in_array($col, $cols, true)) {
                $pdo->exec("ALTER TABLE leads ADD COLUMN $col TEXT NOT NULL DEFAULT ''");
            }
        }
        $pdo->exec('CREATE TABLE IF NOT EXISTS login_attempts (ip_hash TEXT NOT NULL, ts INTEGER NOT NULL)');
        // Citas de Cal.com (una fila por reserva; un cambio de hora crea una fila nueva)
        $pdo->exec('CREATE TABLE IF NOT EXISTS citas (
            uid TEXT PRIMARY KEY,
            lead_id INTEGER NOT NULL DEFAULT 0,
            inicio TEXT NOT NULL DEFAULT "",
            fin TEXT NOT NULL DEFAULT "",
            nombre TEXT NOT NULL DEFAULT "",
            email TEXT NOT NULL DEFAULT "",
            meet_url TEXT NOT NULL DEFAULT "",
            estado TEXT NOT NULL DEFAULT "reservada",
            asistencia TEXT NOT NULL DEFAULT "",
            rec24 INTEGER NOT NULL DEFAULT 0,
            rec1 INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT "",
            updated_at TEXT NOT NULL DEFAULT ""
        )');
        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_citas_inicio ON citas(inicio)');
        $citaCols = array_column($pdo->query('PRAGMA table_info(citas)')->fetchAll(), 'name');
        if (!in_array('telefono', $citaCols, true)) {
            $pdo->exec("ALTER TABLE citas ADD COLUMN telefono TEXT NOT NULL DEFAULT ''");
        }
        // Historial de cada solicitud: cambios de fase (automáticos o a mano) y contactos
        $pdo->exec('CREATE TABLE IF NOT EXISTS eventos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lead_id INTEGER NOT NULL,
            ts TEXT NOT NULL,
            tipo TEXT NOT NULL,
            detalle TEXT NOT NULL DEFAULT "",
            auto INTEGER NOT NULL DEFAULT 1
        )');
        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_eventos_lead ON eventos(lead_id)');
    }
    return $pdo;
}

function pebai_ip_hash(): string
{
    $cfg = pebai_config();
    return hash('sha256', ($cfg['salt'] ?? 'pebai') . '|' . ($_SERVER['REMOTE_ADDR'] ?? ''));
}

// Firma corta del enlace de reserva (/reservar/?s=ID&t=FIRMA) para que nadie pueda
// asignar citas a solicitudes ajenas cambiando el número.
function pebai_booking_token(int $id): string
{
    return substr(hash_hmac('sha256', 'reservar|' . $id, pebai_config()['salt'] ?? 'pebai'), 0, 12);
}

function pebai_booking_url(int $id): string
{
    return 'https://pebaisystems.es/reservar/?s=' . $id . '&t=' . pebai_booking_token($id);
}

function h($s): string
{
    return htmlspecialchars((string)$s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function pebai_fecha(string $datetime): string
{
    $ts = strtotime($datetime);
    $dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    return ucfirst($dias[(int)date('w', $ts)]) . ' ' . date('d/m/Y · H:i', $ts);
}

function pebai_phone_digits(string $tel): string
{
    $d = preg_replace('/\D+/', '', $tel);
    if (strlen($d) === 9) {
        $d = '34' . $d; // número español sin prefijo
    }
    return $d;
}

/* --------------------------------------------------------------- Citas --- */

/**
 * Crea o actualiza una cita por su uid de Cal.com. Solo sobrescribe los campos que llegan
 * con valor, así el webhook y la página de reserva pueden completar la misma fila en cualquier orden.
 */
function pebai_cita_save(string $uid, array $f): ?array
{
    if ($uid === '') {
        return null;
    }
    $db = pebai_db();
    $now = date('Y-m-d H:i:s');
    $q = $db->prepare('SELECT * FROM citas WHERE uid = ?');
    $q->execute([$uid]);
    $row = $q->fetch();
    $allowed = ['lead_id', 'inicio', 'fin', 'nombre', 'email', 'meet_url', 'estado', 'telefono'];
    $data = [];
    foreach ($allowed as $k) {
        if (isset($f[$k]) && $f[$k] !== '' && $f[$k] !== 0) {
            $data[$k] = $f[$k];
        }
    }
    if ($row) {
        if (!empty($row['lead_id'])) {
            unset($data['lead_id']);  // una cita ya unida no cambia de solicitud
        }
        if ($data) {
            $set = implode(', ', array_map(fn($k) => "$k = ?", array_keys($data)));
            $db->prepare("UPDATE citas SET $set, updated_at = ? WHERE uid = ?")
                ->execute(array_merge(array_values($data), [$now, $uid]));
        }
    } else {
        $data += ['uid' => $uid, 'created_at' => $now, 'updated_at' => $now];
        $cols = array_keys($data);
        $db->prepare('INSERT INTO citas (' . implode(',', $cols) . ') VALUES (' . implode(',', array_fill(0, count($cols), '?')) . ')')
            ->execute(array_values($data));
    }
    $q->execute([$uid]);
    $cita = $q->fetch();
    if ($cita && !empty($cita['lead_id'])) {
        pebai_cita_sync_lead($cita);
    }
    return $cita ?: null;
}

/** Refleja la cita en la solicitud (estado y datos visibles en el panel). */
function pebai_cita_sync_lead(array $cita): void
{
    $db = pebai_db();
    $q = $db->prepare('SELECT estado, cita_uid FROM leads WHERE id = ?');
    $q->execute([(int)$cita['lead_id']]);
    $lead = $q->fetch();
    if (!$lead) {
        return;
    }
    $now = date('Y-m-d H:i:s');
    $leadId = (int)$cita['lead_id'];
    if ($cita['estado'] === 'reservada' && $lead['cita_uid'] !== $cita['uid']) {
        pebai_evento($leadId, $lead['cita_uid'] === '' ? 'reserva' : 'reprogramada', (string)$cita['inicio']);
    } elseif ($cita['estado'] === 'cancelada' && $lead['cita_uid'] === $cita['uid']) {
        pebai_evento($leadId, 'cancelada', (string)$cita['inicio']);
    }
    if ($cita['estado'] === 'reservada') {
        // Una sesión ya hecha o un cliente no vuelven atrás por una cita nueva
        $estado = in_array($lead['estado'], ['sesion', 'cliente'], true) ? $lead['estado'] : 'cita';
        $db->prepare('UPDATE leads SET estado = ?, cita_uid = ?, cita_inicio = ?, cita_fin = ?, cita_estado = ?,
                      cliente_nombre = CASE WHEN ? <> "" THEN ? ELSE cliente_nombre END,
                      cliente_email = CASE WHEN ? <> "" THEN ? ELSE cliente_email END, updated_at = ? WHERE id = ?')
            ->execute([$estado, $cita['uid'], $cita['inicio'], $cita['fin'], 'reservada',
                       $cita['nombre'], $cita['nombre'], $cita['email'], $cita['email'], $now, (int)$cita['lead_id']]);
    } elseif ($cita['estado'] === 'cancelada' && $lead['cita_uid'] === $cita['uid']) {
        $estado = $lead['estado'] === 'cita' ? 'contactado' : $lead['estado'];
        $db->prepare('UPDATE leads SET estado = ?, cita_estado = ?, updated_at = ? WHERE id = ?')
            ->execute([$estado, 'cancelada', $now, (int)$cita['lead_id']]);
    }
}

/** Apunta un hito en el historial de la solicitud (auto = 1 si lo hizo el sistema). */
function pebai_evento(int $leadId, string $tipo, string $detalle = '', bool $auto = true): void
{
    if ($leadId <= 0) {
        return;
    }
    try {
        pebai_db()->prepare('INSERT INTO eventos (lead_id, ts, tipo, detalle, auto) VALUES (?, ?, ?, ?, ?)')
            ->execute([$leadId, date('Y-m-d H:i:s'), $tipo, mb_substr($detalle, 0, 300), $auto ? 1 : 0]);
    } catch (Throwable $e) {
        pebai_log('EVENTO: ' . $e->getMessage());
    }
}

/** Pasa la solicitud a otra fase solo si va hacia delante (nunca pisa sesión, cliente ni descartado). */
function pebai_avanzar(int $leadId, string $a, string $motivo, bool $auto = true): bool
{
    $orden = ['nuevo' => 1, 'contactado' => 2, 'cita' => 3, 'sesion' => 4, 'no_asistio' => 4, 'cliente' => 5, 'descartado' => 5];
    $db = pebai_db();
    $q = $db->prepare('SELECT estado FROM leads WHERE id = ?');
    $q->execute([$leadId]);
    $actual = $q->fetchColumn();
    if ($actual === false || ($orden[$actual] ?? 0) >= ($orden[$a] ?? 0)) {
        return false;
    }
    $db->prepare('UPDATE leads SET estado = ?, updated_at = ? WHERE id = ?')->execute([$a, date('Y-m-d H:i:s'), $leadId]);
    pebai_evento($leadId, $a, $motivo, $auto);
    return true;
}

/**
 * Fase 4 automática: cuando termina una sesión reservada que nadie ha marcado, la cita queda
 * "asistencia = auto" y la solicitud pasa a "Sesión hecha". El equipo puede corregirlo con
 * "No se presentó". La llaman el cron de recordatorios y el panel al cargar datos.
 */
function pebai_auto_sesiones(): int
{
    $db = pebai_db();
    $n = 0;
    $q = $db->query("SELECT uid, lead_id, inicio, fin FROM citas WHERE estado = 'reservada' AND asistencia = '' AND lead_id > 0");
    foreach ($q->fetchAll() as $c) {
        $fin = strtotime($c['fin'] ?: '') ?: (strtotime($c['inicio']) + 25 * 60);
        if (!$fin || $fin > time()) {
            continue;
        }
        $db->prepare("UPDATE citas SET asistencia = 'auto', updated_at = ? WHERE uid = ? AND asistencia = ''")
            ->execute([date('Y-m-d H:i:s'), $c['uid']]);
        pebai_avanzar((int)$c['lead_id'], 'sesion', 'La hora de la sesión ya pasó');
        $n++;
    }
    return $n;
}

/**
 * Busca la solicitud de una reserva hecha sin el enlace del panel. Solo devuelve una si hay un
 * único candidato claro: mismo teléfono, mismo email de una cita anterior, o mismo nombre en una
 * solicitud reciente sin cita. Devuelve [id, motivo] o [0, ''].
 */
function pebai_match_lead(string $telefono, string $email, string $nombre): array
{
    $db = pebai_db();
    $dig = substr(preg_replace('/\D+/', '', $telefono), -9);
    if (strlen($dig) === 9) {
        $ids = [];
        foreach ($db->query("SELECT id, telefono FROM leads WHERE estado NOT IN ('cliente','descartado') ORDER BY id DESC LIMIT 500") as $r) {
            if (substr(preg_replace('/\D+/', '', $r['telefono']), -9) === $dig) {
                $ids[] = (int)$r['id'];
            }
        }
        if (count($ids) === 1) {
            return [$ids[0], 'teléfono'];
        }
    }
    if ($email !== '') {
        $q = $db->prepare('SELECT DISTINCT lead_id FROM citas WHERE lead_id > 0 AND lower(email) = lower(?)');
        $q->execute([$email]);
        $ids = $q->fetchAll(PDO::FETCH_COLUMN);
        if (count($ids) === 1) {
            return [(int)$ids[0], 'email'];
        }
    }
    $norm = function (string $s): string {
        $s = mb_strtolower(trim($s));
        $s = strtr($s, ['á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ü' => 'u', 'ñ' => 'n']);
        return preg_replace('/\s+/', ' ', $s);
    };
    $n = $norm($nombre);
    if ($n !== '') {
        $q = $db->prepare("SELECT id, nombre FROM leads WHERE estado IN ('nuevo','contactado') AND cita_uid = '' AND created_at >= ?");
        $q->execute([date('Y-m-d H:i:s', time() - 45 * 86400)]);
        $ids = [];
        foreach ($q->fetchAll() as $r) {
            $ln = $norm($r['nombre']);
            // "Laura" en el formulario y "Laura Gómez" en Cal.com cuentan como la misma persona
            if ($ln !== '' && ($ln === $n || strpos($n . ' ', $ln . ' ') === 0)) {
                $ids[] = (int)$r['id'];
            }
        }
        if (count($ids) === 1) {
            return [$ids[0], 'nombre'];
        }
    }
    return [0, ''];
}

/* ---------------------------------------------------------------- SMTP --- */

function pebai_smtp_send(string $to, string $subject, string $html, string $text, ?string $fromName = null): void
{
    $cfg = pebai_config()['smtp'];
    $fromName = $fromName ?? $cfg['from_name'];
    $fp = @stream_socket_client('ssl://' . $cfg['host'] . ':' . $cfg['port'], $errno, $errstr, 15);
    if (!$fp) {
        throw new RuntimeException("SMTP connect: $errstr ($errno)");
    }
    stream_set_timeout($fp, 15);

    $read = function () use ($fp): string {
        $data = '';
        while (($line = fgets($fp, 515)) !== false) {
            $data .= $line;
            if (strlen($line) < 4 || $line[3] === ' ') {
                break;
            }
        }
        return $data;
    };
    $cmd = function (?string $line, array $okCodes) use ($fp, $read): void {
        if ($line !== null) {
            fwrite($fp, $line . "\r\n");
        }
        $resp = $read();
        if (!in_array((int)substr($resp, 0, 3), $okCodes, true)) {
            throw new RuntimeException('SMTP ' . ($line === null ? 'greeting' : strtok($line, ' ')) . ': ' . trim($resp));
        }
    };

    $boundary = 'pebai_' . bin2hex(random_bytes(8));
    $from = $cfg['user'];
    $headers = [
        'Date: ' . date('r'),
        'From: =?UTF-8?B?' . base64_encode($fromName) . '?= <' . $from . '>',
        'Reply-To: <' . $from . '>',
        'To: <' . $to . '>',
        'Subject: =?UTF-8?B?' . base64_encode($subject) . '?=',
        'Message-ID: <' . bin2hex(random_bytes(12)) . '@pebaisystems.es>',
        'MIME-Version: 1.0',
        'Content-Type: multipart/alternative; boundary="' . $boundary . '"',
    ];
    $body = implode("\r\n", $headers) . "\r\n\r\n"
        . "--$boundary\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
        . chunk_split(base64_encode($text)) . "\r\n"
        . "--$boundary\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
        . chunk_split(base64_encode($html)) . "\r\n"
        . "--$boundary--\r\n";

    try {
        $cmd(null, [220]);
        $cmd('EHLO pebaisystems.es', [250]);
        $cmd('AUTH LOGIN', [334]);
        $cmd(base64_encode($cfg['user']), [334]);
        $cmd(base64_encode($cfg['pass']), [235]);
        $cmd('MAIL FROM:<' . $from . '>', [250]);
        $cmd('RCPT TO:<' . $to . '>', [250, 251]);
        $cmd('DATA', [354]);
        // base64 nunca produce una línea con solo "." pero se escapa por seguridad
        $cmd(preg_replace('/^\./m', '..', $body) . "\r\n.", [250]);
        fwrite($fp, "QUIT\r\n");
    } finally {
        fclose($fp);
    }
}

/* ------------------------------------------------------ Plantilla común --- */

const PEBAI_EMAIL_ASSETS = 'https://pebaisystems.es/brand/email/';
const PEBAI_EMAIL_V = '?v=2';

/**
 * Esqueleto de todos los emails de PEBAI: tarjeta blanca con el logo (PNG con fondo blanco opaco,
 * se lee igual en modo claro y oscuro), una franja con los colores de la marca, cuerpo y pie.
 * $body son filas <tr> ya montadas.
 */
function pebai_email_shell(string $title, string $preheader, string $body, string $footer): string
{
    $font = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
    return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
        . '<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>' . h($title) . '</title></head>'
        . '<body style="margin:0;padding:0;background:#EEF0F4;font-family:' . $font . ';-webkit-text-size-adjust:100%">'
        . '<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#EEF0F4">' . h($preheader) . '</div>'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#EEF0F4" style="background:#EEF0F4"><tr><td align="center" style="padding:28px 12px">'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="max-width:560px;background:#FFFFFF;border-radius:18px;overflow:hidden">'
        . '<tr><td style="padding:26px 30px 22px"><img src="' . PEBAI_EMAIL_ASSETS . 'logo-email.png' . PEBAI_EMAIL_V . '" width="140" height="41" alt="PEBAI Systems" style="display:block;border:0"></td></tr>'
        . '<tr><td style="padding:0;font-size:0;line-height:0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>'
        . '<td width="50%" height="3" bgcolor="#B7FF3C" style="background:#B7FF3C;font-size:0;line-height:0">&nbsp;</td>'
        . '<td width="50%" height="3" bgcolor="#594AF7" style="background:#594AF7;font-size:0;line-height:0">&nbsp;</td>'
        . '</tr></table></td></tr>'
        . $body
        . '<tr><td style="padding:18px 30px 22px;border-top:1px solid #EEF0F4;color:#9AA0AE;font-size:12px;line-height:1.6">' . $footer . '</td></tr>'
        . '</table></td></tr></table></body></html>';
}

/** Etiqueta pequeña y título grande. */
function pebai_email_title(string $kicker, string $title, string $sub = ''): string
{
    return '<tr><td style="padding:28px 30px 0">'
        . '<div style="font-size:11px;font-weight:800;letter-spacing:.16em;color:#594AF7;text-transform:uppercase">' . h($kicker) . '</div>'
        . '<div style="margin-top:8px;font-size:26px;line-height:1.2;font-weight:800;color:#0B0F14">' . h($title) . '</div>'
        . ($sub !== '' ? '<div style="margin-top:8px;font-size:15px;line-height:1.55;color:#5B6172">' . $sub . '</div>' : '')
        . '</td></tr>';
}

/** Botón (tabla para que Outlook respete el fondo), con icono PNG opcional. */
function pebai_email_button(string $href, string $label, string $bg = '#0B0F14', string $icon = ''): string
{
    $img = $icon !== ''
        ? '<img src="' . PEBAI_EMAIL_ASSETS . $icon . PEBAI_EMAIL_V . '" width="20" height="20" alt="" style="display:inline-block;vertical-align:middle;border:0;margin-right:10px">'
        : '';
    return '<table role="presentation" cellpadding="0" cellspacing="0" style="display:inline-table;margin:0 8px 8px 0"><tr>'
        . '<td bgcolor="' . $bg . '" style="background:' . $bg . ';border-radius:12px">'
        . '<a href="' . h($href) . '" style="display:inline-block;padding:14px 24px;color:#FFFFFF;text-decoration:none;font-weight:700;font-size:15px;line-height:20px">'
        . $img . '<span style="vertical-align:middle">' . h($label) . '</span></a>'
        . '</td></tr></table>';
}

/** Fila con icono en cuadrado lila + texto (ficha de la cita). */
function pebai_email_icon_row(string $icon, string $label, string $value, bool $last = false): string
{
    $border = $last ? '' : 'border-bottom:1px solid #EEF0F4;';
    return '<tr><td width="56" valign="middle" style="padding:12px 0;' . $border . '">'
        . '<img src="' . PEBAI_EMAIL_ASSETS . 'ic-' . $icon . '-tile.png' . PEBAI_EMAIL_V . '" width="40" height="40" alt="" style="display:block;border:0"></td>'
        . '<td valign="middle" style="padding:12px 0;' . $border . '">'
        . '<div style="font-size:12px;color:#9AA0AE">' . h($label) . '</div>'
        . '<div style="margin-top:2px;font-size:16px;font-weight:700;color:#0B0F14">' . h($value) . '</div></td></tr>';
}

/* ------------------------------------------------------- Email del lead --- */

/**
 * Aviso al equipo: solo la empresa y un botón al panel (allí está toda la ficha).
 * Sin imágenes: el webmail de Hostinger bloquea las externas y enseña las incrustadas como adjuntos.
 */
function pebai_lead_email(array $lead, int $id): array
{
    $qualified = $lead['opcion'] === 'A';
    $panel = 'https://panel.pebaisystems.es/?id=' . $id;
    $font = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
    $etiqueta = $qualified ? 'Con presupuesto' : 'Explorando';
    $punto = $qualified ? '#7BC21A' : '#9AA0AE';

    $html = '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
        . '<meta name="color-scheme" content="light"><title>Nueva solicitud</title></head>'
        . '<body style="margin:0;padding:0;background:#F2F3F6;font-family:' . $font . '">'
        . '<div style="display:none;max-height:0;overflow:hidden;opacity:0">' . h($lead['empresa'] . ' · ' . $etiqueta) . '</div>'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#F2F3F6" style="background:#F2F3F6">'
        . '<tr><td align="center" style="padding:32px 14px">'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="max-width:480px;background:#FFFFFF;border:1px solid #E4E6EC;border-radius:14px">'
        // Marca en texto, con los colores del logo
        . '<tr><td style="padding:26px 30px 0">'
        . '<table role="presentation" cellpadding="0" cellspacing="0"><tr>'
        . '<td width="6" height="18" bgcolor="#B7FF3C" style="background:#B7FF3C;font-size:0;line-height:0">&nbsp;</td>'
        . '<td width="3" style="font-size:0;line-height:0">&nbsp;</td>'
        . '<td width="6" height="18" bgcolor="#594AF7" style="background:#594AF7;font-size:0;line-height:0">&nbsp;</td>'
        . '<td style="padding-left:10px;font-size:15px;font-weight:800;letter-spacing:.12em;color:#0B0F14">PEBAI'
        . '<span style="font-weight:600;color:#9AA0AE"> SYSTEMS</span></td>'
        . '</tr></table></td></tr>'
        // Aviso
        . '<tr><td style="padding:28px 30px 0">'
        . '<div style="font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#594AF7">Nueva solicitud</div>'
        . '<div style="margin-top:8px;font-size:24px;line-height:1.25;font-weight:800;color:#0B0F14">' . h($lead['empresa']) . '</div>'
        . '<div style="margin-top:10px;font-size:14px;color:#5B6172">'
        . '<span style="color:' . $punto . ';font-size:16px">&#9679;</span>&nbsp;' . h($etiqueta) . ' &middot; ' . h(pebai_fecha($lead['created_at'])) . '</div>'
        . '</td></tr>'
        // Botón
        . '<tr><td style="padding:26px 30px 30px">'
        . '<table role="presentation" cellpadding="0" cellspacing="0"><tr><td bgcolor="#0B0F14" style="background:#0B0F14;border-radius:10px">'
        . '<a href="' . h($panel) . '" style="display:inline-block;padding:14px 26px;font-size:15px;font-weight:700;color:#FFFFFF;text-decoration:none">Ver en el panel &rarr;</a>'
        . '</td></tr></table></td></tr>'
        . '</table>'
        . '<div style="max-width:480px;padding:14px 0 0;font-size:12px;color:#9AA0AE">Solicitud #' . $id . ' &middot; pebaisystems.es</div>'
        . '</td></tr></table></body></html>';

    $text = "Nueva solicitud: {$lead['empresa']} ($etiqueta)\n\nVer en el panel: $panel\n";
    $subject = 'Nueva solicitud: ' . $lead['empresa'] . ($qualified ? ' · con presupuesto' : '');

    return [$subject, $html, $text];
}
