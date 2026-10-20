<?php
/*
 * PEBAI · Panel — datos y acciones del agente de email (Captación › Email y su tarjeta en Agentes).
 * Lo incluye panel/index.php justo después de comprobar la sesión: usa $auth, $db, csrf() y json_out() de allí.
 * La interfaz es assets/email.js. Todo lo del email vive aquí para no tocar el resto del panel.
 */
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}
require_once dirname(__DIR__) . '/api/_email_lib.php';

/* ------------------------------------------------------------- acciones --- */
if ($auth && $db && isset($_POST['action']) && str_starts_with((string)$_POST['action'], 'email_')) {
    if (!hash_equals($_SESSION['csrf'] ?? '', $_POST['csrf'] ?? '')) {
        json_out(['ok' => false, 'error' => 'Sesión caducada. Recarga la página.'], 400);
    }
    $edb = pebai_email_db();
    $now = date('Y-m-d H:i:s');
    $prospecto = static function (int $id) use ($edb): array {
        $q = $edb->prepare('SELECT * FROM email_prospectos WHERE id = ?');
        $q->execute([$id]);
        $p = $q->fetch();
        if (!$p) {
            json_out(['ok' => false, 'error' => 'No existe el prospecto.'], 404);
        }
        return $p;
    };
    switch ($_POST['action']) {
        case 'email_importar':
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
                json_out(['ok' => false, 'error' => 'Sube el CSV del scraper o pega la lista.'], 400);
            }
            $nicho = preg_replace('/[^a-z0-9_-]/', '', strtolower((string)($_POST['nicho'] ?? '')));
            $lote = mb_substr(trim((string)($_POST['lote'] ?? '')), 0, 80) ?: date('d/m H:i');
            try {
                $res = pebai_email_importar($raw, $nicho, $lote);
                pebai_actividad('email', 'cambio', "Importados {$res['nuevos']} prospectos nuevos (lote «{$lote}»)", json_encode($res, JSON_UNESCAPED_UNICODE));
                json_out(['ok' => true, 'res' => $res]);
            } catch (Throwable $e) {
                json_out(['ok' => false, 'error' => $e->getMessage()], 400);
            }
        case 'email_estado':
            $p = $prospecto((int)($_POST['id'] ?? 0));
            $estado = (string)($_POST['estado'] ?? '');
            if ($estado === 'baja') {
                pebai_email_baja($p, 'Marcado a mano en el panel');
                pebai_actividad('email', 'cambio', 'Baja a mano de ' . ($p['empresa'] ?: $p['email']), $p['email'], 'email:' . $p['id']);
                json_out(['ok' => true]);
            }
            if (!in_array($estado, ['pendiente', 'descartado', 'interesado', 'respondio'], true)) {
                json_out(['ok' => false, 'error' => 'Estado no válido.'], 400);
            }
            if ($estado === 'pendiente') {
                $q = $edb->prepare('SELECT COUNT(*) FROM bajas_email WHERE email = ?');
                $q->execute([$p['email']]);
                if ((int)$q->fetchColumn()) {
                    json_out(['ok' => false, 'error' => 'Tiene baja o rebotó: no se le puede volver a escribir.'], 400);
                }
                if ((int)$p['paso'] > 0) {
                    json_out(['ok' => false, 'error' => 'Ya se le escribió: como mucho dos emails por empresa.'], 400);
                }
            }
            $edb->prepare("UPDATE email_prospectos SET estado = ?, error = '', updated_at = ? WHERE id = ?")->execute([$estado, $now, $p['id']]);
            pebai_actividad('email', 'cambio', 'Cambiado a mano: ' . ($p['empresa'] ?: $p['email']) . ' → ' . $estado, $p['email'], 'email:' . $p['id']);
            json_out(['ok' => true]);
        case 'email_vista':
            // Vista previa exacta de lo que se enviaría ahora, con la comprobación previa (sin enviar nada).
            $p = $prospecto((int)($_POST['id'] ?? 0));
            $paso = (int)$p['paso'] === 1 ? 2 : 1;
            $msg = pebai_email_componer($p, $paso, pebai_email_cfg());
            json_out(['ok' => true, 'paso' => $paso, 'msg' => $msg, 'problemas' => $msg ? pebai_email_qa($p, $msg, $paso) : ['Falta la ficha del nicho «' . $p['nicho'] . '» o su vídeo no está grabado.']]);
        case 'email_pausa':
            $pausar = ($_POST['pausado'] ?? '') === '1';
            $edb->prepare("UPDATE agente_estado SET pausado = ?, estado = ?, detalle = ? WHERE agente = 'email'")
                ->execute([$pausar ? 1 : 0, $pausar ? 'pausado' : 'activo', $pausar ? 'En pausa desde el panel' : 'Reanudado desde el panel']);
            pebai_actividad('email', 'cambio', $pausar ? 'Puesto en pausa desde el panel' : 'Reanudado desde el panel');
            json_out(['ok' => true]);
        case 'email_ajustes':
            $ventanas = [];
            foreach (preg_split('/[,\n]+/', (string)($_POST['ventanas'] ?? '')) as $tramo) {
                if (preg_match('/^\s*(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\s*$/', $tramo, $m) && strtotime($m[1]) < strtotime($m[2])) {
                    $ventanas[] = [$m[1], $m[2]];
                }
            }
            if (!$ventanas) {
                json_out(['ok' => false, 'error' => 'Horario no válido. Ejemplo: 09:00-13:30, 16:00-18:30'], 400);
            }
            $tope = max(0, min(50, (int)($_POST['limite_max'] ?? 50)));
            pebai_email_cfg_guardar(['limite_max' => $tope, 'ventanas' => $ventanas]);
            pebai_actividad('email', 'cambio', "Ajustes: tope {$tope} al día, horario " . implode(', ', array_map(static fn($v) => implode('-', $v), $ventanas)));
            json_out(['ok' => true]);
        case 'email_nicho':
            $slug = preg_replace('/[^a-z0-9_-]/', '', strtolower((string)($_POST['slug'] ?? '')));
            if ($slug === '') {
                json_out(['ok' => false, 'error' => 'Pon un identificador corto del nicho (p. ej. reformas).'], 400);
            }
            $ficha = [];
            foreach (['nombre' => 80, 'producto' => 120, 'momento' => 200, 'pregunta' => 300, 'sin_video' => 300] as $k => $max) {
                $ficha[$k] = mb_substr(trim((string)($_POST[$k] ?? '')), 0, $max);
            }
            if ($ficha['pregunta'] === '' || ($ficha['momento'] === '' && $ficha['sin_video'] === '')) {
                json_out(['ok' => false, 'error' => 'La pregunta es obligatoria, y hace falta el momento del vídeo o la alternativa sin vídeo.'], 400);
            }
            $plano = ' ' . mb_strtolower(implode(' ', $ficha)) . ' ';
            foreach (PEBAI_EMAIL_PROHIBIDAS as $w) {
                if (str_contains($plano, $w)) {
                    json_out(['ok' => false, 'error' => 'La ficha no puede llevar «' . trim($w) . '»: el email no vende ni enlaza (docs/captacion-email.md).'], 400);
                }
            }
            $ficha['meses'] = array_values(array_filter(array_map('intval', preg_split('/[^0-9]+/', (string)($_POST['meses'] ?? ''))), static fn($m) => $m >= 1 && $m <= 12));
            $ficha['video'] = ($_POST['video'] ?? '') === '1';
            $cfg = pebai_email_cfg();
            $cfg['nichos'][$slug] = $ficha;
            pebai_email_cfg_guardar(['nichos' => $cfg['nichos']]);
            pebai_actividad('email', 'cambio', 'Ficha del nicho «' . $slug . '» guardada' . ($ficha['video'] ? ' (vídeo grabado: ya se puede escribir a este nicho)' : ' (sin vídeo: aún no se escribe)'), json_encode($ficha, JSON_UNESCAPED_UNICODE));
            json_out(['ok' => true]);
        case 'email_nicho_borrar':
            $cfg = pebai_email_cfg();
            unset($cfg['nichos'][(string)($_POST['slug'] ?? '')]);
            pebai_email_cfg_guardar(['nichos' => $cfg['nichos']]);
            pebai_actividad('email', 'cambio', 'Ficha del nicho «' . (string)($_POST['slug'] ?? '') . '» borrada');
            json_out(['ok' => true]);
        case 'email_plantilla':
            $pl = str_replace("\r", '', trim((string)($_POST['plantilla'] ?? '')));
            $rec = str_replace("\r", '', trim((string)($_POST['recordatorio'] ?? '')));
            $asuntos = array_values(array_filter(array_map('trim', explode("\n", str_replace("\r", '', (string)($_POST['asuntos'] ?? ''))))));
            foreach (['[motivo]', '[pregunta]', 'Daniel', 'no vuelvo a escribirte'] as $obligatorio) {
                if (!str_contains($pl, $obligatorio)) {
                    json_out(['ok' => false, 'error' => 'La plantilla tiene que llevar «' . $obligatorio . '» (motivo, pregunta, quién escribe y la salida).'], 400);
                }
            }
            $plano = ' ' . mb_strtolower($pl . ' ' . $rec . ' ' . implode(' ', $asuntos)) . ' ';
            foreach (PEBAI_EMAIL_PROHIBIDAS as $w) {
                if ($w !== 're:' && str_contains($plano, $w)) {
                    json_out(['ok' => false, 'error' => 'Palabra prohibida en la plantilla: «' . trim($w) . '».'], 400);
                }
            }
            pebai_email_cfg_guardar(['plantilla' => $pl, 'recordatorio' => $rec ?: PEBAI_EMAIL_RECORDATORIO, 'asuntos' => $asuntos ?: PEBAI_EMAIL_ASUNTOS]);
            pebai_actividad('email', 'cambio', 'Plantilla del email cambiada', $pl);
            json_out(['ok' => true]);
    }
    json_out(['ok' => false, 'error' => 'Acción desconocida.'], 400);
}

/* ---------------------------------------------------------------- datos --- */
if ($auth && $db && isset($_GET['email'])) {
    $edb = pebai_email_db();
    $pros = $edb->query('SELECT id, created_at, updated_at, empresa, nombre, email, dominio, tipo_email, origen_email, telefono, sector, nicho, ciudad, web, senal, motivo,
                         motivo_fuente, motivo_fecha, motivo_caduca, prioridad, lote, estado, paso, asunto, enviado1_at, enviado2_at, respondido_at, error
                         FROM email_prospectos ORDER BY id DESC LIMIT 5000')->fetchAll();
    foreach ($pros as &$p) {
        $p['id'] = (int)$p['id'];
        $p['paso'] = (int)$p['paso'];
        $p['prioridad'] = (int)$p['prioridad'];
    }
    unset($p);
    $msgs = $edb->query("SELECT m.id, m.ts, m.prospecto_id, m.sentido, m.texto, p.empresa, p.email FROM agente_mensajes m
                         LEFT JOIN email_prospectos p ON p.id = m.prospecto_id WHERE m.agente = 'email' ORDER BY m.id DESC LIMIT 300")->fetchAll();
    $a = pebai_agente('email');
    $cfg = pebai_email_cfg();
    $v = pebai_email_ventana();
    $b = pebai_email_buzon();
    // Volumen por día: primeros emails, recordatorios, respuestas y bloqueos (lo que hizo el agente cada día).
    $q = $edb->prepare("SELECT substr(ts, 1, 10) d, CASE WHEN sentido = 'entra' THEN 'respuestas' WHEN texto LIKE 'Asunto: Re:%' THEN 'recordatorios' ELSE 'primeros' END tipo, COUNT(*) n
                         FROM agente_mensajes WHERE agente = 'email' AND ts >= ? GROUP BY d, tipo");
    $q->execute([date('Y-m-d', strtotime('-29 days'))]);
    $volumen = $q->fetchAll();
    foreach (pebai_actividad_por_dia('email', 30) as $r) {
        if ($r['tipo'] === 'bloqueo') {
            $volumen[] = ['d' => $r['d'], 'tipo' => 'bloqueos', 'n' => $r['n']];
        }
    }
    json_out(['ok' => true, 'ahora' => date('Y-m-d H:i:s'), 'csrf' => csrf(), 'prospectos' => $pros, 'mensajes' => $msgs, 'volumen' => $volumen, 'actividad' => pebai_actividad_ultimas('email', 200),
        // Agente de prospección (el scraper apunta cada tirada en api/actividad.php): se pinta en Agentes › Captación.
        'prospeccion' => ['actividad' => pebai_actividad_ultimas('prospeccion', 100), 'por_dia' => pebai_actividad_por_dia('prospeccion', 30)],
        'salud7' => pebai_email_salud(7), 'salud30' => pebai_email_salud(30), 'senales' => PEBAI_EMAIL_SENALES, 'escalones' => PEBAI_EMAIL_ESCALONES,
        'agente' => ['estado' => $a['estado'], 'latido_at' => $a['latido_at'], 'detalle' => $a['detalle'], 'pausado' => (int)$a['pausado'],
                     'buzon' => $b ? $b['user'] : '', 'avisar_a' => $b ? (string)$b['avisar_a'] : '', 'enviados_hoy' => pebai_email_enviados_hoy(), 'limite' => pebai_email_limite($cfg),
                     'abierta' => $v['abierta'], 'proxima' => $v['proxima'] ? date('Y-m-d H:i:s', $v['proxima']) : ''],
        'cfg' => array_intersect_key($cfg, array_flip(['limite_max', 'escalon', 'escalon_desde', 'ventanas', 'nichos', 'plantilla', 'recordatorio', 'asuntos', 'preguntas_senal', 'recordatorio_dias']))]);
}
