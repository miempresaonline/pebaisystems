<?php
/*
 * PEBAI · Panel — avisos al navegador/móvil y buscador global (Ctrl+K).
 * Lo incluye panel/index.php justo después de comprobar la sesión: usa $auth, json_out() y $_SESSION['csrf'] de allí.
 *   GET  ?push_clave=1               → clave pública VAPID para apuntar este dispositivo
 *   POST action=push_alta (endpoint) → apunta este dispositivo a los avisos · push_baja lo quita · push_prueba manda uno de prueba
 *   POST ?avisos_sw=1 (endpoint)     → lo llama el service worker al recibir un aviso (sin sesión: vale con su suscripción)
 *   GET  ?buscar=texto               → empresas, solicitudes, conversaciones y demos que coinciden
 */
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}
require_once dirname(__DIR__) . '/api/_avisos_lib.php';

// El service worker no tiene la sesión del panel: se identifica con su suscripción (una dirección larga e imposible de adivinar)
if (isset($_GET['avisos_sw']) && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $l = pebai_avisos_para(substr((string)($_POST['endpoint'] ?? ''), 0, 1000));
    json_out($l === null ? ['ok' => false] : ['ok' => true, 'avisos' => $l]);
}

if ($auth && isset($_GET['push_clave'])) {
    try {
        json_out(['ok' => true, 'clave' => pebai_vapid()['pub']]);
    } catch (Throwable $e) {
        json_out(['ok' => false, 'error' => 'Los avisos no están disponibles en el servidor.'], 500);
    }
}

if ($auth && in_array($_POST['action'] ?? '', ['push_alta', 'push_baja', 'push_prueba'], true)) {
    if (!hash_equals($_SESSION['csrf'] ?? '', $_POST['csrf'] ?? '')) {
        json_out(['ok' => false, 'error' => 'Sesión caducada. Recarga la página.'], 400);
    }
    $db = pebai_avisos_db();
    $ep = substr((string)($_POST['endpoint'] ?? ''), 0, 1000);
    if ($_POST['action'] === 'push_prueba') {
        pebai_aviso('prueba', 'Avisos de PEBAI activados', 'Así te llegarán las solicitudes, citas, respuestas y demos abiertas.', 'pagina:resumen');
        json_out(['ok' => true, 'dispositivos' => (int)$db->query('SELECT COUNT(*) FROM subs')->fetchColumn()]);
    }
    if (!preg_match('~^https://[a-z0-9.-]+/~i', $ep)) {
        json_out(['ok' => false, 'error' => 'Este navegador no ha dado una suscripción válida.'], 422);
    }
    if ($_POST['action'] === 'push_baja') {
        $db->prepare('DELETE FROM subs WHERE endpoint = ?')->execute([$ep]);
        json_out(['ok' => true]);
    }
    $max = (int)$db->query('SELECT MAX(id) FROM avisos')->fetchColumn();
    $db->prepare('INSERT INTO subs (endpoint, creada, ua, visto_id) VALUES (?, ?, ?, ?) ON CONFLICT(endpoint) DO UPDATE SET ua = excluded.ua')
       ->execute([$ep, date('Y-m-d H:i:s'), mb_substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 200), $max]);
    json_out(['ok' => true, 'dispositivos' => (int)$db->query('SELECT COUNT(*) FROM subs')->fetchColumn()]);
}

/* ------------------------------------------------------------ Buscador global --- */
if ($auth && isset($_GET['buscar'])) {
    $t = trim(mb_substr((string)$_GET['buscar'], 0, 80));
    if (mb_strlen($t) < 2) {
        json_out(['ok' => true, 'r' => []]);
    }
    $like = '%' . str_replace(['%', '_'], ['\%', '\_'], $t) . '%';
    $num = preg_replace('/\D/', '', $t);
    $tel = strlen($num) >= 5 ? '%' . $num . '%' : '';
    $out = [];
    $dia = static fn($ts) => $ts ? date('d/m', strtotime((string)$ts)) : '';
    $busca = static function (PDO $db, string $sql, array $args): array {
        try {
            $q = $db->prepare($sql);
            $q->execute($args);
            $r = $q->fetchAll();
            $q->closeCursor();
            return $r;
        } catch (Throwable $e) {
            return [];
        }
    };
    // Solicitudes del embudo
    if ($db) {
        foreach ($busca($db, "SELECT id, empresa, nombre, telefono, estado, created_at FROM leads WHERE empresa LIKE ? ESCAPE '\\' OR nombre LIKE ? ESCAPE '\\'"
                 . ($tel ? " OR REPLACE(REPLACE(telefono,' ',''),'+','') LIKE ?" : '') . ' ORDER BY id DESC LIMIT 6', $tel ? [$like, $like, $tel] : [$like, $like]) as $r) {
            $out[] = ['tipo' => 'Solicitud', 'titulo' => $r['empresa'] ?: $r['nombre'], 'sub' => trim($r['nombre'] . ' · ' . $r['estado'] . ' · ' . $dia($r['created_at']), ' ·'), 'ir' => 'lead:' . $r['id']];
        }
    }
    // WhatsApp: prospectos (si ya se le escribió, se abre su conversación)
    if (function_exists('pebai_agentes_db')) {
        foreach ($busca(pebai_agentes_db(), "SELECT id, empresa, telefono, ciudad, nicho, estado, web, enviado_at FROM prospectos WHERE empresa LIKE ? ESCAPE '\\' OR web LIKE ? ESCAPE '\\'"
                 . ($tel ? ' OR telefono LIKE ?' : '') . " ORDER BY (enviado_at <> '') DESC, id DESC LIMIT 6", $tel ? [$like, $like, $tel] : [$like, $like]) as $r) {
            $out[] = ['tipo' => $r['enviado_at'] ? 'WhatsApp' : 'Prospecto', 'titulo' => $r['empresa'],
                      'sub' => trim(($r['ciudad'] ?: '') . ' · ' . $r['nicho'] . ' · ' . ($r['enviado_at'] ? 'escrito el ' . $dia($r['enviado_at']) . ' · ' . $r['estado'] : 'sin escribir'), ' ·'),
                      'ir' => $r['enviado_at'] ? 'conv:whatsapp:' . $r['id'] : '', 'web' => (string)$r['web'], 'tel' => (string)$r['telefono']];
        }
    }
    // Email
    if (function_exists('pebai_email_db')) {
        foreach ($busca(pebai_email_db(), "SELECT id, empresa, email, ciudad, nicho, estado, web FROM email_prospectos WHERE empresa LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\' OR web LIKE ? ESCAPE '\\'"
                 . " ORDER BY (estado <> 'pendiente') DESC, id DESC LIMIT 5", [$like, $like, $like]) as $r) {
            $escrito = !in_array($r['estado'], ['pendiente', 'nuevo', ''], true);
            $out[] = ['tipo' => $escrito ? 'Email' : 'Prospecto email', 'titulo' => $r['empresa'] ?: $r['email'], 'sub' => trim($r['email'] . ' · ' . ($r['ciudad'] ?: '') . ' · ' . $r['estado'], ' ·'),
                      'ir' => $escrito ? 'conv:email:' . $r['id'] : '', 'web' => (string)$r['web']];
        }
    }
    // Demos
    require_once dirname(__DIR__) . '/api/_demos_lib.php';
    foreach ($busca(pebai_demos_db(), "SELECT slug, empresa, ciudad, visitas, creada FROM demos WHERE empresa LIKE ? ESCAPE '\\' OR web LIKE ? ESCAPE '\\' ORDER BY creada DESC LIMIT 4", [$like, $like]) as $r) {
        $out[] = ['tipo' => 'Demo', 'titulo' => $r['empresa'], 'sub' => trim(($r['ciudad'] ?: '') . ' · ' . ((int)$r['visitas'] ? 'abierta ' . (int)$r['visitas'] . ' veces' : 'sin abrir') . ' · ' . $dia($r['creada']), ' ·'),
                  'url' => pebai_demo_url($r['slug']) . '?equipo=1'];
    }
    json_out(['ok' => true, 'r' => array_slice($out, 0, 20)]);
}
