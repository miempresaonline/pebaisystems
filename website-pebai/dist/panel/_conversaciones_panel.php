<?php
/*
 * PEBAI · Panel — Captación › Conversaciones (CRM de lo enviado por WhatsApp y email).
 * Lo incluye panel/index.php después de comprobar la sesión: usa $auth, csrf() y json_out() de allí.
 *   GET  ?conv=1                       → todas las conversaciones con su hilo y su estado.
 *   POST action=conv_notas             → notas del equipo.
 *   POST action=conv_reserva           → crea (si no existe) su ficha de cliente y devuelve el enlace de reserva.
 *   POST action=conv_borrador          → la IA prepara otra respuesta (con una indicación opcional de Daniel).
 *   POST action=conv_mio               → Daniel pega un mensaje suyo que no se guardó (con su fecha y hora); conv_mio_quitar lo borra.
 *   POST action=conv_enviar            → Daniel aprueba la respuesta: WhatsApp a la cola del bot, email sale ya.
 *   POST action=conv_contestado        → «Ya le he contestado» por mi cuenta: deja de salir «Te toca» hasta que la empresa escriba otra vez.
 */
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}
require_once dirname(__DIR__) . '/api/_conversaciones_lib.php';

// Foto de perfil de WhatsApp guardada por el agente (solo con sesión iniciada)
if ($auth && isset($_GET['foto'])) {
    $f = pebai_private_dir() . '/fotos/' . preg_replace('/\D/', '', (string)$_GET['foto']) . '.jpg';
    if (!is_file($f)) {
        http_response_code(404);
        exit;
    }
    $info = @getimagesize($f);
    header('Content-Type: ' . ($info['mime'] ?? 'image/jpeg'));
    header('Cache-Control: private, max-age=86400');
    readfile($f);
    exit;
}

if ($auth && isset($_GET['conv'])) {
    try {
        json_out(['ok' => true, 'ahora' => date('Y-m-d H:i:s'), 'csrf' => csrf(), 'filas' => pebai_conv_datos()]);
    } catch (Throwable $e) {
        pebai_log('CONVERSACIONES: ' . $e->getMessage());
        json_out(['ok' => false, 'error' => 'No se han podido cargar las conversaciones.'], 500);
    }
}

if ($auth && in_array($_POST['action'] ?? '', ['conv_notas', 'conv_reserva', 'conv_borrador', 'conv_enviar', 'conv_mio', 'conv_mio_quitar', 'conv_contestado'], true)) {
    if (!hash_equals($_SESSION['csrf'] ?? '', $_POST['csrf'] ?? '')) {
        json_out(['ok' => false, 'error' => 'Sesión caducada. Recarga la página.'], 400);
    }
    $canal = ($_POST['canal'] ?? '') === 'email' ? 'email' : 'whatsapp';
    $id = (int)($_POST['id'] ?? 0);
    $db = pebai_conv_db();
    $tabla = $canal === 'email' ? 'email_prospectos' : 'prospectos';
    $q = $db->prepare("SELECT * FROM $tabla WHERE id = ?");
    $q->execute([$id]);
    $p = $q->fetch();
    if (!$p) {
        json_out(['ok' => false, 'error' => 'No existe esa conversación.'], 404);
    }
    switch ($_POST['action']) {
        case 'conv_notas':
            $db->prepare('INSERT INTO conversaciones (canal, prospecto_id, notas) VALUES (?, ?, ?)
                          ON CONFLICT(canal, prospecto_id) DO UPDATE SET notas = excluded.notas')
               ->execute([$canal, $id, mb_substr(trim((string)($_POST['notas'] ?? '')), 0, 3000)]);
            json_out(['ok' => true]);
        case 'conv_mio':
            // Mensaje que Daniel escribió desde el móvil o su correo y no se guardó: entra en el hilo en su sitio, como «enviado por ti»
            $texto = mb_substr(trim(str_replace("
", '', (string)($_POST['texto'] ?? ''))), 0, 4000);
            $f = DateTime::createFromFormat('Y-m-d\TH:i', (string)($_POST['fecha'] ?? ''));
            if ($texto === '') {
                json_out(['ok' => false, 'error' => 'Pega el texto del mensaje.'], 422);
            }
            if (!$f || $f->getTimestamp() > time() + 60) {
                json_out(['ok' => false, 'error' => 'Pon la fecha y la hora en que lo enviaste (no puede ser futura).'], 422);
            }
            $ts = $f->format('Y-m-d H:i:00');
            $agente = $canal === 'email' ? 'email' : 'whatsapp';
            $q = $db->prepare("SELECT COUNT(*) FROM agente_mensajes WHERE agente = ? AND prospecto_id = ? AND sentido = 'sale' AND texto = ?");
            $q->execute([$agente, $id, $texto]);
            if ((int)$q->fetchColumn()) {
                json_out(['ok' => false, 'error' => 'Ese mensaje ya está en la conversación.'], 422);
            }
            $db->prepare("INSERT INTO agente_mensajes (ts, agente, prospecto_id, telefono, sentido, texto, plantilla) VALUES (?, ?, ?, ?, 'sale', ?, 'manual')")
               ->execute([$ts, $agente, $id, $canal === 'email' ? (string)$p['email'] : (string)$p['telefono'], $texto]);
            json_out(['ok' => true]);
        case 'conv_mio_quitar':
            // Solo se pueden quitar mensajes «enviados por ti» (por si se pegó mal); lo del agente y lo que contestan, nunca
            $db->prepare("DELETE FROM agente_mensajes WHERE id = ? AND prospecto_id = ? AND agente = ? AND plantilla = 'manual'")
               ->execute([(int)($_POST['msg'] ?? 0), $id, $canal === 'email' ? 'email' : 'whatsapp']);
            json_out(['ok' => true]);
        case 'conv_contestado':
            $q = $db->prepare('SELECT COALESCE(MAX(id), 0) FROM agente_mensajes WHERE agente = ? AND prospecto_id = ?');
            $q->execute([$canal === 'email' ? 'email' : 'whatsapp', $id]);
            $hasta = ($_POST['deshacer'] ?? '') === '1' ? 0 : (int)$q->fetchColumn();
            $db->prepare("INSERT INTO conversaciones (canal, prospecto_id, contestado_hasta, borrador) VALUES (?, ?, ?, '')
                          ON CONFLICT(canal, prospecto_id) DO UPDATE SET contestado_hasta = excluded.contestado_hasta, borrador = CASE WHEN excluded.contestado_hasta > 0 THEN '' ELSE borrador END")
               ->execute([$canal, $id, $hasta]);
            json_out(['ok' => true]);
        case 'conv_reserva':
            $leadId = pebai_conv_lead_crear($canal, $p);
            json_out(['ok' => true, 'url' => pebai_booking_url($leadId), 'lead_id' => $leadId]);
        case 'conv_borrador':
            $r = pebai_conv_borrador($canal, $id, (string)($_POST['instruccion'] ?? ''));
            json_out(isset($r['texto']) ? ['ok' => true, 'texto' => $r['texto']] : ['ok' => false, 'error' => $r['error']], isset($r['texto']) ? 200 : 422);
        case 'conv_enviar':
            $r = pebai_conv_enviar($canal, $id, (string)($_POST['texto'] ?? ''));
            json_out(isset($r['ok']) ? $r : ['ok' => false, 'error' => $r['error']], isset($r['ok']) ? 200 : 422);
    }
}
