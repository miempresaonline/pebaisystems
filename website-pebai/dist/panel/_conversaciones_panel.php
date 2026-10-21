<?php
/*
 * PEBAI · Panel — Captación › Conversaciones (CRM de lo enviado por WhatsApp y email).
 * Lo incluye panel/index.php después de comprobar la sesión: usa $auth, csrf() y json_out() de allí.
 *   GET  ?conv=1                       → todas las conversaciones con su hilo y su estado.
 *   POST action=conv_estado            → corregir a mano el estado (la IA ya no lo cambia).
 *   POST action=conv_notas             → notas del equipo.
 *   POST action=conv_reserva           → crea (si no existe) su ficha de cliente y devuelve el enlace de reserva.
 *   POST action=conv_borrador          → la IA prepara otra respuesta (con una indicación opcional de Daniel).
 *   POST action=conv_enviar            → Daniel aprueba la respuesta: WhatsApp a la cola del bot, email sale ya.
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

if ($auth && in_array($_POST['action'] ?? '', ['conv_estado', 'conv_notas', 'conv_reserva', 'conv_borrador', 'conv_enviar'], true)) {
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
    $quien = $p['empresa'] ?: ('#' . $id);
    switch ($_POST['action']) {
        case 'conv_estado':
            $e = (string)($_POST['estado'] ?? '');
            if ($e === 'ia') {
                // Devolver la decisión a la IA
                $db->prepare('UPDATE conversaciones SET manual = 0, ultimo_msg = 0 WHERE canal = ? AND prospecto_id = ?')->execute([$canal, $id]);
                json_out(['ok' => true]);
            }
            if (!in_array($e, ['interesado', 'no_interesado', 'pregunta', 'auto'], true)) {
                json_out(['ok' => false, 'error' => 'Estado no válido.'], 400);
            }
            $db->prepare('INSERT INTO conversaciones (canal, prospecto_id, clasificacion, manual, clasificado_at) VALUES (?, ?, ?, 1, ?)
                          ON CONFLICT(canal, prospecto_id) DO UPDATE SET clasificacion = excluded.clasificacion, manual = 1, clasificado_at = excluded.clasificado_at')
               ->execute([$canal, $id, $e, date('Y-m-d H:i:s')]);
            pebai_actividad($canal, 'cambio', 'Conversación con ' . $quien . ' marcada a mano como «' . $e . '»', '', ($canal === 'email' ? 'em:' : 'wa:') . $id);
            json_out(['ok' => true]);
        case 'conv_notas':
            $db->prepare('INSERT INTO conversaciones (canal, prospecto_id, notas) VALUES (?, ?, ?)
                          ON CONFLICT(canal, prospecto_id) DO UPDATE SET notas = excluded.notas')
               ->execute([$canal, $id, mb_substr(trim((string)($_POST['notas'] ?? '')), 0, 3000)]);
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
