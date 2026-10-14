<?php
/*
 * PEBAI · Recordatorios de la sesión técnica (24 h y 1 h antes) con la marca de PEBAI.
 * Cal.com gratis no envía recordatorios: este script los manda desde equipo@pebaisystems.es.
 *
 * Se ejecuta cada 15 minutos con una tarea programada de Hostinger (hPanel > Avanzado > Cron Jobs):
 *   - Tipo PHP:  domains/pebaisystems.es/public_html/api/recordatorios.php
 *   - o URL:     https://pebaisystems.es/api/recordatorios.php?token=<cron_token de private/config.php>
 * Es idempotente: cada recordatorio se marca como enviado y no se repite.
 */
require __DIR__ . '/_pebai_lib.php';

$isCli = PHP_SAPI === 'cli';
if (!$isCli) {
    header('Content-Type: application/json; charset=utf-8');
    header('X-Robots-Tag: noindex');
    $token = (string)($_GET['token'] ?? ($_SERVER['HTTP_X_CRON_TOKEN'] ?? ''));
    $expected = (string)(pebai_config()['cron_token'] ?? '');
    if ($expected === '' || !hash_equals($expected, $token)) {
        http_response_code(403);
        echo json_encode(['status' => 'error']);
        exit;
    }
}

function pebai_reminder_email(array $c, string $tipo): array
{
    $ts = strtotime($c['inicio']);
    $dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    $meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    $hora = date('H:i', $ts);
    $fecha = $dias[(int)date('w', $ts)] . ' ' . date('j', $ts) . ' de ' . $meses[(int)date('n', $ts) - 1];
    $nombre = trim(explode(' ', trim($c['nombre']))[0] ?? '');
    $hola = $nombre !== '' ? 'Hola, ' . $nombre : 'Hola';
    $meet = $c['meet_url'] !== '' ? $c['meet_url'] : '';
    $wa = 'https://wa.me/34624842799?text=' . rawurlencode('Hola PEBAI, necesito cambiar la hora de mi sesión técnica.');

    if ($tipo === '24') {
        $subject = 'Mañana a las ' . $hora . ': tu sesión técnica con PEBAI';
        $kicker = 'TU SESIÓN ES MAÑANA';
        $titulo = ucfirst($fecha) . ' · ' . $hora . ' h';
        $intro = $hola . '. Te recordamos la sesión técnica de 25 minutos con nuestro equipo de ingeniería.';
        $tips = '<tr><td style="padding:6px 0;color:#C9CED8;font-size:15px">▸ Conéctate desde un <b style="color:#fff">ordenador</b>: compartiremos pantalla.</td></tr>'
            . '<tr><td style="padding:6px 0;color:#C9CED8;font-size:15px">▸ Que asista <b style="color:#fff">quien toma las decisiones</b> en la empresa.</td></tr>'
            . '<tr><td style="padding:6px 0;color:#C9CED8;font-size:15px">▸ Piensa en las <b style="color:#fff">2 o 3 tareas</b> que más tiempo os quitan.</td></tr>';
    } else {
        $subject = 'Empezamos en 1 hora (' . $hora . ' h) · Sesión técnica PEBAI';
        $kicker = 'EMPEZAMOS EN 1 HORA';
        $titulo = 'Hoy a las ' . $hora . ' h';
        $intro = $hola . '. En una hora empieza tu sesión técnica. Te esperamos en Google Meet.';
        $tips = '<tr><td style="padding:6px 0;color:#C9CED8;font-size:15px">▸ Entra desde un ordenador con cámara y micrófono.</td></tr>';
    }

    $boton = $meet !== ''
        ? '<a href="' . h($meet) . '" style="display:inline-block;background:#B7FF3C;color:#0B0F14;text-decoration:none;font-weight:800;font-size:16px;padding:15px 26px;border-radius:12px">Entrar en Google Meet</a>'
        : '<p style="margin:0;color:#C9CED8;font-size:15px">El enlace de Google Meet está en el email de confirmación de la reserva.</p>';

    $html = '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark light"></head>'
        . '<body style="margin:0;padding:0;background:#070911;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif">'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#070911;padding:28px 12px"><tr><td align="center">'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#0E1222;border:1px solid #262E52;border-radius:20px;overflow:hidden">'
        . '<tr><td style="padding:26px 30px 0"><img src="https://pebaisystems.es/brand/pebai-horizontal-color-mineral-cropped.png" alt="PEBAI Systems" width="130" style="display:block;border:0"></td></tr>'
        . '<tr><td style="padding:26px 30px 0"><div style="font-size:12px;font-weight:800;letter-spacing:.14em;color:#B7FF3C">' . h($kicker) . '</div>'
        . '<div style="margin-top:10px;font-size:28px;line-height:1.2;font-weight:800;color:#FFFFFF">' . h($titulo) . '</div>'
        . '<p style="margin:14px 0 0;font-size:16px;line-height:1.55;color:#A3A8BC">' . h($intro) . '</p></td></tr>'
        . '<tr><td style="padding:24px 30px 6px">' . $boton . '</td></tr>'
        . '<tr><td style="padding:16px 30px 6px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">' . $tips . '</table></td></tr>'
        . '<tr><td style="padding:16px 30px 0"><table role="presentation" cellpadding="0" cellspacing="0"><tr>'
        . '<td style="padding-right:12px"><img src="https://pebaisystems.es/team/avatar-adrian.jpg" width="40" height="40" alt="Adrián" style="display:block;border-radius:50%;border:2px solid #B7FF3C"></td>'
        . '<td style="padding-right:12px"><img src="https://pebaisystems.es/team/avatar-dani.jpg" width="40" height="40" alt="Dani" style="display:block;border-radius:50%;border:2px solid #B7FF3C"></td>'
        . '<td style="color:#C9CED8;font-size:14px">Te atenderán <b style="color:#fff">Adrián</b> o <b style="color:#fff">Dani</b></td></tr></table></td></tr>'
        . '<tr><td style="padding:24px 30px 28px;border-top:1px solid #1D2442;margin-top:20px;color:#6B7089;font-size:13px;line-height:1.5">'
        . '¿Te ha surgido un imprevisto? <a href="' . h($wa) . '" style="color:#B7FF3C;font-weight:700;text-decoration:none">Avísanos por WhatsApp</a> y buscamos otra hora.'
        . '<br>PEBAI Systems · Ingeniería de procesos e IA · <a href="https://pebaisystems.es" style="color:#6B7089">pebaisystems.es</a></td></tr>'
        . '</table></td></tr></table></body></html>';

    $text = $kicker . "\n" . $titulo . "\n\n" . $intro . "\n\n"
        . ($meet !== '' ? "Entrar en Google Meet: $meet\n\n" : '')
        . "¿Imprevisto? Avísanos por WhatsApp: $wa\n\nPEBAI Systems · pebaisystems.es\n";

    return [$subject, $html, $text];
}

$enviados = ['24' => 0, '1' => 0];
$errores = 0;
try {
    $db = pebai_db();
    $now = time();
    $q = $db->query("SELECT * FROM citas WHERE estado = 'reservada' AND email <> '' AND rec1 = 0");
    foreach ($q->fetchAll() as $c) {
        $start = strtotime($c['inicio']);
        if ($start === false || $start <= $now) {
            continue;
        }
        $falta = $start - $now;
        $tipo = null;
        if ($falta <= 75 * 60) {
            $tipo = '1';                        // última hora (con margen por el intervalo del cron)
        } elseif ($falta <= 24 * 3600 && !$c['rec24'] && $falta > 3 * 3600) {
            $tipo = '24';                       // entre 24 h y 3 h antes, una sola vez
        }
        if ($tipo === null) {
            continue;
        }
        try {
            [$subject, $html, $text] = pebai_reminder_email($c, $tipo);
            pebai_smtp_send($c['email'], $subject, $html, $text, 'PEBAI Systems');
            $col = $tipo === '24' ? 'rec24' : 'rec1';
            $db->prepare("UPDATE citas SET $col = 1, updated_at = ? WHERE uid = ?")->execute([date('Y-m-d H:i:s'), $c['uid']]);
            if ($tipo === '1') {
                // Si llega tarde a la ventana de 24 h, no se manda después del de 1 h
                $db->prepare('UPDATE citas SET rec24 = 1 WHERE uid = ?')->execute([$c['uid']]);
            }
            $enviados[$tipo]++;
        } catch (Throwable $e) {
            $errores++;
            pebai_log('RECORDATORIO ' . $c['uid'] . ': ' . $e->getMessage());
        }
    }
} catch (Throwable $e) {
    pebai_log('RECORDATORIOS: ' . $e->getMessage());
    $errores++;
}

$out = ['status' => 'ok', 'enviados_24h' => $enviados['24'], 'enviados_1h' => $enviados['1'], 'errores' => $errores];
echo $isCli ? json_encode($out) . "\n" : json_encode($out);
