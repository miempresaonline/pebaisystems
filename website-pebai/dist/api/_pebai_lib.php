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
        foreach (['cita_inicio', 'cita_fin', 'cita_uid', 'cita_estado', 'cliente_nombre', 'cliente_email'] as $col) {
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
    $allowed = ['lead_id', 'inicio', 'fin', 'nombre', 'email', 'meet_url', 'estado'];
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

/**
 * Esqueleto de todos los emails de PEBAI: cabecera oscura con el logo (PNG opaco, se ve igual en
 * modo claro y oscuro), cuerpo blanco y pie. $header y $body son filas <tr> ya montadas.
 */
function pebai_email_shell(string $title, string $preheader, string $header, string $body, string $footer): string
{
    $font = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
    return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
        . '<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>' . h($title) . '</title></head>'
        . '<body style="margin:0;padding:0;background:#EEF0F4;font-family:' . $font . ';-webkit-text-size-adjust:100%">'
        . '<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#EEF0F4">' . h($preheader) . '</div>'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#EEF0F4" style="background:#EEF0F4"><tr><td align="center" style="padding:28px 12px">'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;border-collapse:separate">'
        // Cabecera
        . '<tr><td bgcolor="#0B0F14" style="background:#0B0F14;border-radius:16px 16px 0 0;padding:22px 28px 0">'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>'
        . '<td><img src="https://pebaisystems.es/brand/email/logo-email.png" width="150" height="44" alt="PEBAI Systems" style="display:block;border:0"></td>'
        . '</tr></table></td></tr>'
        . $header
        . '<tr><td bgcolor="#0B0F14" style="background:#0B0F14;padding:0;font-size:0;line-height:0;height:4px">'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>'
        . '<td width="50%" height="4" bgcolor="#B7FF3C" style="background:#B7FF3C;font-size:0;line-height:0">&nbsp;</td>'
        . '<td width="50%" height="4" bgcolor="#594AF7" style="background:#594AF7;font-size:0;line-height:0">&nbsp;</td>'
        . '</tr></table></td></tr>'
        // Cuerpo
        . '<tr><td bgcolor="#FFFFFF" style="background:#FFFFFF;padding:8px 0 4px">'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' . $body . '</table></td></tr>'
        // Pie
        . '<tr><td bgcolor="#F7F8FA" style="background:#F7F8FA;border-top:1px solid #E6E8EE;border-radius:0 0 16px 16px;padding:18px 28px;color:#6B7280;font-size:12px;line-height:1.6">'
        . $footer . '</td></tr>'
        . '</table></td></tr></table></body></html>';
}

/** Bloque de cabecera: etiqueta pequeña, título grande y subtítulo, sobre fondo oscuro. */
function pebai_email_header(string $kicker, string $title, string $sub, string $extra = ''): string
{
    return '<tr><td bgcolor="#0B0F14" style="background:#0B0F14;padding:26px 28px 26px">'
        . '<div style="font-size:11px;font-weight:800;letter-spacing:.16em;color:#B7FF3C;text-transform:uppercase">' . h($kicker) . '</div>'
        . '<div style="margin-top:8px;font-size:26px;line-height:1.2;font-weight:800;color:#FFFFFF">' . h($title) . '</div>'
        . ($sub !== '' ? '<div style="margin-top:6px;font-size:14px;line-height:1.5;color:#9AA3B2">' . $sub . '</div>' : '')
        . $extra . '</td></tr>';
}

/** Botón (tabla para que Outlook respete el fondo). */
function pebai_email_button(string $href, string $label, string $bg = '#0B0F14', string $color = '#FFFFFF'): string
{
    return '<table role="presentation" cellpadding="0" cellspacing="0" style="display:inline-table;margin:0 8px 8px 0"><tr>'
        . '<td bgcolor="' . $bg . '" style="background:' . $bg . ';border-radius:10px">'
        . '<a href="' . h($href) . '" style="display:inline-block;padding:13px 22px;color:' . $color . ';text-decoration:none;font-weight:700;font-size:15px;line-height:1">' . h($label) . '</a>'
        . '</td></tr></table>';
}

/** Título de sección del cuerpo. */
function pebai_email_section(string $title): string
{
    return '<tr><td style="padding:22px 28px 8px"><div style="font-size:11px;font-weight:800;letter-spacing:.14em;color:#594AF7;text-transform:uppercase">'
        . h($title) . '</div></td></tr>';
}

/* ------------------------------------------------------- Email del lead --- */

function pebai_lead_email(array $lead, int $id): array
{
    $qualified = $lead['opcion'] === 'A';
    $wa = 'https://wa.me/' . pebai_phone_digits($lead['telefono']);
    $panel = 'https://pebaisystems.es/panel/?id=' . $id;
    $first = json_decode($lead['primer_toque'], true) ?: [];
    $last = json_decode($lead['ultimo_toque'], true) ?: [];

    $badge = $qualified
        ? '<span style="display:inline-block;padding:6px 12px;border-radius:999px;background:#B7FF3C;color:#0B0F14;font-weight:800;font-size:11px;letter-spacing:.08em">CON PRESUPUESTO</span>'
        : '<span style="display:inline-block;padding:6px 12px;border-radius:999px;background:#262B36;color:#C9CED8;font-weight:800;font-size:11px;letter-spacing:.08em">EXPLORANDO</span>';
    $origen = trim($lead['fuente'] . ($lead['medio'] !== '' ? ' · ' . $lead['medio'] : ''));
    if ($origen === '') {
        $origen = 'directo';
    }
    $header = pebai_email_header(
        'Nueva solicitud · #' . $id,
        $lead['empresa'],
        h(pebai_fecha($lead['created_at'])) . ' · desde <b style="color:#FFFFFF">' . h($origen) . '</b>',
        '<div style="margin-top:16px">' . $badge . '</div>'
    );

    // Respuestas del diagnóstico: fichas de 2 columnas
    $tile = function (string $k, string $v): string {
        return '<td width="50%" valign="top" style="padding:5px">'
            . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td bgcolor="#F5F6F9" style="background:#F5F6F9;border:1px solid #E6E8EE;border-radius:12px;padding:12px 14px">'
            . '<div style="font-size:11px;font-weight:700;letter-spacing:.06em;color:#8A90A0;text-transform:uppercase">' . h($k) . '</div>'
            . '<div style="margin-top:5px;font-size:14px;line-height:1.4;font-weight:700;color:#0B0F14">' . h($v !== '' ? $v : '—') . '</div>'
            . '</td></tr></table></td>';
    };
    $presupuesto = $qualified ? 'Sí, con presupuesto (desde 1.500 €)' : 'Aún no, está explorando';
    $tiles = '<tr><td style="padding:0 23px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">'
        . '<tr>' . $tile('Canal principal', $lead['canal']) . $tile('Consultas al mes', $lead['volumen']) . '</tr>'
        . '<tr>' . $tile('Objetivo a 3 meses', $lead['objetivo']) . $tile('Presupuesto', $presupuesto) . '</tr>'
        . '</table></td></tr>';

    // Filas clave/valor; las vacías no se muestran
    $row = function (string $k, string $v): string {
        if (trim($v) === '') {
            return '';
        }
        return '<tr><td width="38%" valign="top" style="padding:9px 0;border-bottom:1px solid #EEF0F4;color:#8A90A0;font-size:13px">' . h($k) . '</td>'
            . '<td valign="top" style="padding:9px 0;border-bottom:1px solid #EEF0F4;color:#0B0F14;font-size:14px;font-weight:600;word-break:break-word">' . h($v) . '</td></tr>';
    };
    $list = function (string $rows): string {
        return '<tr><td style="padding:0 28px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">' . $rows . '</table></td></tr>';
    };

    $contacto = $row('Empresa', $lead['empresa']) . $row('Nombre', $lead['nombre']) . $row('WhatsApp', $lead['telefono']);

    $atribucion = $row('Fuente', $lead['fuente']) . $row('Medio', $lead['medio']) . $row('Campaña', $lead['campana'])
        . $row('Contenido', $lead['contenido']) . $row('Palabra clave', $lead['palabra']) . $row('Botón pulsado', $lead['cta']);
    if ($atribucion === '') {
        $atribucion = $row('Origen', 'Tráfico directo (sin UTM)');
    }

    // Primer y último toque, lado a lado
    $touch = function (array $t): string {
        if (!$t) {
            return '—';
        }
        $src = trim(($t['utm_source'] ?? '') . (($t['utm_medium'] ?? '') !== '' ? ' / ' . $t['utm_medium'] : ''));
        $parts = [];
        $parts[] = '<b style="color:#0B0F14">' . h($src !== '' ? $src : 'directo') . '</b>';
        foreach (['utm_campaign' => 'Campaña', 'utm_content' => 'Contenido', 'utm_term' => 'Término', 'landing' => 'Entrada', 'referrer' => 'Referente'] as $key => $label) {
            if (!empty($t[$key])) {
                $parts[] = h($label) . ': ' . h((string)$t[$key]);
            }
        }
        if (!empty($t['ts'])) {
            $parts[] = '<span style="color:#8A90A0">' . h(date('d/m/Y H:i', strtotime($t['ts']))) . '</span>';
        }
        return implode('<br>', $parts);
    };
    $toques = '<tr><td style="padding:4px 28px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>'
        . '<td width="50%" valign="top" style="padding:0 10px 0 0;font-size:13px;line-height:1.6;color:#4B5263;word-break:break-word">'
        . '<div style="font-size:11px;font-weight:700;color:#8A90A0;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">Primera visita</div>' . $touch($first) . '</td>'
        . '<td width="50%" valign="top" style="padding:0 0 0 10px;border-left:1px solid #EEF0F4;font-size:13px;line-height:1.6;color:#4B5263;word-break:break-word">'
        . '<div style="font-size:11px;font-weight:700;color:#8A90A0;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">Antes de enviar</div>' . $touch($last) . '</td>'
        . '</tr></table></td></tr>';

    $body = '<tr><td style="padding:22px 28px 4px">'
        . pebai_email_button($wa, 'Escribir por WhatsApp', '#25D366')
        . pebai_email_button($panel, 'Abrir en el panel')
        . '</td></tr>'
        . pebai_email_section('Diagnóstico') . $tiles
        . pebai_email_section('Contacto') . $list($contacto)
        . pebai_email_section('Origen') . $list($atribucion) . $toques
        . '<tr><td style="padding:20px 28px 18px;font-size:12px;color:#8A90A0">'
        . h(trim($lead['dispositivo'] . ($lead['pagina'] !== '' ? ' · ' . $lead['pagina'] : ''), ' ·')) . '</td></tr>';

    $footer = 'Aviso automático del formulario de pebaisystems.es. Toda la ficha y su seguimiento están en el <a href="' . h($panel) . '" style="color:#594AF7;text-decoration:none;font-weight:700">panel</a>.';

    $html = pebai_email_shell('Nueva solicitud', ($qualified ? 'Con presupuesto · ' : 'Explorando · ') . $lead['canal'] . ' · ' . $lead['volumen'], $header, $body, $footer);

    $text = "NUEVA SOLICITUD #$id — {$lead['empresa']}\n"
        . ($qualified ? "Con presupuesto\n" : "Explorando\n")
        . "\nWhatsApp: {$lead['telefono']} ($wa)\nNombre: {$lead['nombre']}\n"
        . "\nCanal: {$lead['canal']}\nConsultas al mes: {$lead['volumen']}\nObjetivo: {$lead['objetivo']}\nPresupuesto: {$lead['presupuesto']}\n"
        . "\nFuente: {$lead['fuente']}\nMedio: {$lead['medio']}\nCampaña: {$lead['campana']}\nContenido: {$lead['contenido']}\nPalabra: {$lead['palabra']}\nBotón: {$lead['cta']}\n"
        . "\nPanel: $panel\n";

    $subject = ($qualified ? '🟢 ' : '⚪ ') . 'Nueva solicitud: ' . $lead['empresa']
        . ($lead['fuente'] !== '' ? ' · ' . $lead['fuente'] : '');

    return [$subject, $html, $text];
}
