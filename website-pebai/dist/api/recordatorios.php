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
    $fin = date('H:i', $ts + 25 * 60);
    $fecha = ucfirst($dias[(int)date('w', $ts)]) . ', ' . date('j', $ts) . ' de ' . $meses[(int)date('n', $ts) - 1];
    $nombre = trim(explode(' ', trim($c['nombre']))[0] ?? '');
    $hola = $nombre !== '' ? 'Hola, ' . $nombre . '.' : 'Hola.';
    $meet = (string)($c['meet_url'] ?? '');
    $wa = 'https://wa.me/34624842799?text=' . rawurlencode('Hola PEBAI, necesito cambiar la hora de mi sesión técnica.');

    if ($tipo === '24') {
        $subject = 'Mañana a las ' . $hora . ' h · Sesión técnica PEBAI';
        $kicker = 'Recordatorio · mañana';
        $titulo = 'Tu sesión técnica es mañana';
        $intro = $hola . ' Te esperamos mañana para revisar los procesos de tu empresa.';
        $prep = '';
        foreach ([
            ['Desde un ordenador', 'Compartiremos pantalla durante la sesión.'],
            ['Con quien decide', 'Que asista la persona que toma las decisiones.'],
            ['Con 2 o 3 tareas en mente', 'Las que más tiempo os quitan cada semana.'],
        ] as $i => [$t, $d]) {
            $prep .= '<tr><td width="34" valign="top" style="padding:8px 0">'
                . '<div style="width:24px;height:24px;line-height:24px;border-radius:50%;background:#0B0F14;color:#B7FF3C;font-size:12px;font-weight:800;text-align:center">' . ($i + 1) . '</div></td>'
                . '<td valign="top" style="padding:8px 0"><div style="font-size:14px;font-weight:700;color:#0B0F14">' . h($t) . '</div>'
                . '<div style="font-size:13px;line-height:1.5;color:#6B7280">' . h($d) . '</div></td></tr>';
        }
        $prep = pebai_email_section('Para aprovecharla')
            . '<tr><td style="padding:0 28px 6px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">' . $prep . '</table></td></tr>';
    } else {
        $subject = 'Empezamos en 1 hora (' . $hora . ' h) · Sesión técnica PEBAI';
        $kicker = 'Recordatorio · hoy';
        $titulo = 'Empezamos en 1 hora';
        $intro = $hola . ' Tu sesión técnica empieza a las ' . $hora . ' h. Conéctate desde un ordenador con cámara y micrófono.';
        $prep = '';
    }

    $header = pebai_email_header($kicker, $titulo, '');

    // Ficha de la cita
    $dato = function (string $k, string $v): string {
        return '<tr><td width="34%" style="padding:10px 0;border-bottom:1px solid #E6E8EE;color:#8A90A0;font-size:13px">' . h($k) . '</td>'
            . '<td style="padding:10px 0;border-bottom:1px solid #E6E8EE;color:#0B0F14;font-size:15px;font-weight:700">' . h($v) . '</td></tr>';
    };
    $ficha = '<tr><td style="padding:6px 28px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">'
        . '<tr><td bgcolor="#F5F6F9" style="background:#F5F6F9;border:1px solid #E6E8EE;border-radius:14px;padding:6px 18px">'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">'
        . $dato('Fecha', $fecha)
        . $dato('Hora', $hora . ' – ' . $fin . ' h (Madrid)')
        . '<tr><td width="34%" style="padding:10px 0;color:#8A90A0;font-size:13px">Lugar</td><td style="padding:10px 0;color:#0B0F14;font-size:15px;font-weight:700">Google Meet</td></tr>'
        . '</table></td></tr></table></td></tr>';

    $boton = $meet !== ''
        ? '<tr><td style="padding:20px 28px 4px">' . pebai_email_button($meet, 'Entrar en Google Meet') . '</td></tr>'
        : '<tr><td style="padding:18px 28px 4px;font-size:14px;line-height:1.5;color:#6B7280">El enlace de Google Meet está en el email de confirmación de la reserva.</td></tr>';

    $body = '<tr><td style="padding:22px 28px 14px;font-size:15px;line-height:1.6;color:#374151">' . h($intro) . '</td></tr>'
        . $ficha . $boton . $prep
        . '<tr><td style="padding:16px 28px 18px;font-size:13px;line-height:1.6;color:#6B7280">¿Te ha surgido un imprevisto? '
        . '<a href="' . h($wa) . '" style="color:#594AF7;font-weight:700;text-decoration:none">Escríbenos por WhatsApp</a> y buscamos otra hora.</td></tr>';

    $footer = 'PEBAI Systems · Ingeniería de procesos e IA · <a href="https://pebaisystems.es" style="color:#6B7280;text-decoration:none">pebaisystems.es</a>'
        . '<br>Recibes este email porque reservaste una sesión técnica con nosotros.';

    $html = pebai_email_shell($subject, $fecha . ' · ' . $hora . ' h · Google Meet', $header, $body, $footer);

    $text = $titulo . "\n" . $fecha . ' · ' . $hora . ' – ' . $fin . " h (Madrid) · Google Meet\n\n" . $intro . "\n\n"
        . ($meet !== '' ? "Entrar en Google Meet: $meet\n\n" : '')
        . "¿Imprevisto? Escríbenos por WhatsApp: $wa\n\nPEBAI Systems · pebaisystems.es\n";

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
