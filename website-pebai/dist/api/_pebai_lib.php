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

/* ------------------------------------------------------- Email del lead --- */

function pebai_lead_email(array $lead, int $id): array
{
    $qualified = $lead['opcion'] === 'A';
    $wa = 'https://wa.me/' . pebai_phone_digits($lead['telefono']);
    $panel = 'https://pebaisystems.es/panel/?id=' . $id;
    $first = json_decode($lead['primer_toque'], true) ?: [];
    $last = json_decode($lead['ultimo_toque'], true) ?: [];

    $badge = $qualified
        ? '<span style="display:inline-block;padding:6px 12px;border-radius:999px;background:#B7FF3C;color:#0B0F14;font-weight:800;font-size:12px;letter-spacing:.06em">CON PRESUPUESTO · OPCIÓN A</span>'
        : '<span style="display:inline-block;padding:6px 12px;border-radius:999px;background:#2A2F3A;color:#C9CED8;font-weight:800;font-size:12px;letter-spacing:.06em">EXPLORANDO · OPCIÓN B</span>';

    $row = function (string $k, string $v): string {
        if ($v === '') {
            $v = '—';
        }
        return '<tr><td style="padding:10px 0;border-bottom:1px solid #EEF0F4;color:#6B7280;font-size:13px;width:38%;vertical-align:top">' . h($k)
            . '</td><td style="padding:10px 0;border-bottom:1px solid #EEF0F4;color:#0B0F14;font-size:14px;font-weight:600">' . nl2br(h($v)) . '</td></tr>';
    };
    $section = function (string $title, string $rows): string {
        return '<tr><td style="padding:22px 28px 6px"><div style="font-size:11px;font-weight:800;letter-spacing:.12em;color:#594AF7;text-transform:uppercase">' . h($title)
            . '</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px">' . $rows . '</table></td></tr>';
    };
    $touchRows = function (array $t) use ($row): string {
        if (!$t) {
            return $row('Sin datos', '');
        }
        return $row('Fuente', $t['utm_source'] ?? '')
            . $row('Medio', $t['utm_medium'] ?? '')
            . $row('Campaña', $t['utm_campaign'] ?? '')
            . $row('Contenido', $t['utm_content'] ?? '')
            . $row('Palabra / término', $t['utm_term'] ?? ($t['palabra'] ?? ''))
            . $row('Página de entrada', $t['landing'] ?? '')
            . $row('Referente', $t['referrer'] ?? '')
            . $row('Fecha', isset($t['ts']) ? date('d/m/Y H:i', strtotime($t['ts'])) : '');
    };

    $html = '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nueva solicitud</title></head>'
        . '<body style="margin:0;padding:0;background:#F3F4F7;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif">'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F7;padding:24px 12px"><tr><td align="center">'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:18px;overflow:hidden;box-shadow:0 8px 30px rgba(11,15,20,.08)">'
        // Cabecera
        . '<tr><td style="background:#0B0F14;padding:26px 28px">'
        . '<div style="font-size:12px;font-weight:800;letter-spacing:.14em;color:#B7FF3C">PEBAI SYSTEMS · NUEVA SOLICITUD</div>'
        . '<div style="margin-top:10px;font-size:26px;line-height:1.2;font-weight:800;color:#FFFFFF">' . h($lead['empresa']) . '</div>'
        . '<div style="margin-top:6px;font-size:14px;color:#9AA3B2">' . h(pebai_fecha($lead['created_at'])) . ' · Solicitud #' . $id . '</div>'
        . '<div style="margin-top:16px">' . $badge . '</div>'
        . '</td></tr>'
        // Acciones
        . '<tr><td style="padding:22px 28px 4px">'
        . '<a href="' . h($wa) . '" style="display:inline-block;background:#25D366;color:#FFFFFF;text-decoration:none;font-weight:800;font-size:15px;padding:13px 20px;border-radius:12px;margin:0 8px 8px 0">Escribir por WhatsApp · ' . h($lead['telefono']) . '</a>'
        . '<a href="' . h($panel) . '" style="display:inline-block;background:#594AF7;color:#FFFFFF;text-decoration:none;font-weight:800;font-size:15px;padding:13px 20px;border-radius:12px;margin:0 0 8px 0">Abrir en el panel</a>'
        . '</td></tr>'
        . $section('Contacto', $row('Empresa', $lead['empresa']) . $row('Nombre', $lead['nombre']) . $row('Teléfono WhatsApp', $lead['telefono']))
        . $section('Respuestas del diagnóstico',
            $row('Canal principal de clientes', $lead['canal'])
            . $row('Consultas al mes', $lead['volumen'])
            . $row('Objetivo a 3 meses', $lead['objetivo'])
            . $row('Presupuesto (desde 1.500 €)', $lead['presupuesto']))
        . $section('De dónde viene', $row('Fuente', $lead['fuente']) . $row('Medio', $lead['medio']) . $row('Campaña', $lead['campana'])
            . $row('Contenido', $lead['contenido']) . $row('Palabra clave', $lead['palabra']) . $row('Botón pulsado', $lead['cta']))
        . $section('Último toque (antes de enviar)', $touchRows($last))
        . $section('Primer toque (primera visita)', $touchRows($first))
        . $section('Datos técnicos', $row('Página del formulario', $lead['pagina']) . $row('Dispositivo', $lead['dispositivo']))
        . '<tr><td style="padding:22px 28px 26px;color:#9AA3B2;font-size:12px">Email automático del formulario de diagnóstico de pebaisystems.es.</td></tr>'
        . '</table></td></tr></table></body></html>';

    $text = "NUEVA SOLICITUD #$id — {$lead['empresa']}\n"
        . ($qualified ? "CON PRESUPUESTO (Opción A)\n" : "EXPLORANDO (Opción B)\n")
        . "\nWhatsApp: {$lead['telefono']} ($wa)\nNombre: {$lead['nombre']}\n"
        . "\nCanal: {$lead['canal']}\nVolumen: {$lead['volumen']}\nObjetivo: {$lead['objetivo']}\nPresupuesto: {$lead['presupuesto']}\n"
        . "\nFuente: {$lead['fuente']}\nMedio: {$lead['medio']}\nCampaña: {$lead['campana']}\nContenido: {$lead['contenido']}\nPalabra: {$lead['palabra']}\nBotón: {$lead['cta']}\n"
        . "\nPanel: $panel\n";

    $subject = ($qualified ? '🟢 ' : '⚪ ') . 'Nueva solicitud: ' . $lead['empresa']
        . ($lead['fuente'] !== '' ? ' · ' . $lead['fuente'] : '');

    return [$subject, $html, $text];
}
