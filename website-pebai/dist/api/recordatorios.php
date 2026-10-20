<?php
/*
 * PEBAI · Recordatorios de la sesión técnica (24 h y 1 h antes) con la marca de PEBAI.
 * Cal.com gratis no envía recordatorios: este script los manda desde equipo@pebaisystems.es.
 *
 * Lo lanzan dos vías (es idempotente: cada recordatorio se marca como enviado y no se repite):
 *   - GitHub Actions cada 15 min (.github/workflows/recordatorios.yml) con la cabecera X-Cron-Token.
 *   - Respaldo: api/tick.php, que lo ejecuta con las visitas a la web como mucho cada 10 min.
 */
require_once __DIR__ . '/_pebai_lib.php';

$isCli = PHP_SAPI === 'cli';
$isTick = defined('PEBAI_TICK');
if (!$isCli && !$isTick) {
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
    $fin = date('H:i', $ts + 25 * 60);
    $fecha = ucfirst($dias[(int)date('w', $ts)]) . ', ' . date('j', $ts) . ' de ' . $meses[(int)date('n', $ts) - 1];
    $nombre = trim(explode(' ', trim($c['nombre']))[0] ?? '');
    $hola = $nombre !== '' ? 'Hola, ' . $nombre . '. ' : '';
    $meet = (string)($c['meet_url'] ?? '');

    if ($tipo === '24') {
        $subject = 'Mañana a las ' . $hora . ' h · Sesión técnica PEBAI';
        $kicker = 'Recordatorio';
        $titulo = 'Tu sesión técnica es mañana';
        $intro = $hola . 'Te esperamos para revisar los procesos de tu empresa.';
    } else {
        $subject = 'Empezamos en 1 hora (' . $hora . ' h) · Sesión técnica PEBAI';
        $kicker = 'Hoy';
        $titulo = 'Empezamos en 1 hora';
        $intro = $hola . 'Conéctate desde un ordenador con cámara y micrófono.';
    }

    $ficha = '<tr><td style="padding:16px 30px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">'
        . pebai_email_icon_row('calendar', 'Fecha', $fecha)
        . pebai_email_icon_row('clock', 'Hora (Madrid)', $hora . ' – ' . $fin . ' h')
        . pebai_email_icon_row('video', 'Dónde', 'Google Meet', true)
        . '</table></td></tr>';

    $boton = $meet !== ''
        ? '<tr><td style="padding:22px 30px 24px">' . pebai_email_button($meet, 'Entrar en Google Meet', '#0B0F14', 'ic-video-white.png') . '</td></tr>'
        : '<tr><td style="padding:18px 30px 24px;font-size:14px;line-height:1.5;color:#5B6172">El enlace de Google Meet está en el email de confirmación de la reserva.</td></tr>';

    $body = pebai_email_title($kicker, $titulo, h($intro)) . $ficha . $boton;
    $footer = 'PEBAI Systems · <a href="https://pebaisystems.es" style="color:#9AA0AE;text-decoration:none">pebaisystems.es</a>';

    $html = pebai_email_shell($subject, $fecha . ' · ' . $hora . ' h · Google Meet', $body, $footer);

    $text = $titulo . "\n" . $fecha . ' · ' . $hora . ' – ' . $fin . " h (Madrid) · Google Meet\n\n" . $intro . "\n\n"
        . ($meet !== '' ? "Entrar en Google Meet: $meet\n\n" : '')
        . "PEBAI Systems · pebaisystems.es\n";

    return [$subject, $html, $text];
}

$enviados = ['24' => 0, '1' => 0];
$errores = 0;
$sesiones = 0;
try {
    $sesiones = pebai_auto_sesiones();
} catch (Throwable $e) {
    pebai_log('AUTO SESIONES: ' . $e->getMessage());
    $errores++;
}
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

// De paso, vigila que el agente de WhatsApp siga vivo (avisa por email si lleva 30 min sin latido)
try {
    require_once __DIR__ . '/_agentes_lib.php';
    pebai_agentes_vigilar();
} catch (Throwable $e) {
    pebai_log('VIGILAR AGENTES: ' . $e->getMessage());
}
// Y deja escritos los próximos mensajes de WhatsApp (la IA lee la web de cada empresa). Solo en el cron, no con las visitas.
if ($isCli) {
    try {
        require_once __DIR__ . '/_ia_lib.php';
        pebai_preparar_whatsapp(4);
    } catch (Throwable $e) {
        pebai_log('PREPARAR WHATSAPP: ' . $e->getMessage());
    }
}

$out = ['status' => 'ok', 'enviados_24h' => $enviados['24'], 'enviados_1h' => $enviados['1'], 'sesiones_auto' => $sesiones, 'errores' => $errores];
// Última ejecución de cada vía (cron de hPanel, GitHub/URL o visitas) para comprobar que funcionan
@file_put_contents(pebai_private_dir() . '/recordatorios-' . ($isCli ? 'cron' : ($isTick ? 'visitas' : 'url')) . '.last',
    date('Y-m-d H:i:s') . ' ' . json_encode($out) . "\n");
if (!$isTick) {
    echo $isCli ? json_encode($out) . "\n" : json_encode($out);
}
