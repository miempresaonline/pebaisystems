<?php
/*
 * PEBAI · Panel — Captación › QRs (para la calle).
 * Lo incluye panel/index.php después de comprobar la sesión: usa $auth, csrf() y json_out() de allí.
 *   GET  ?qr=1                               → QRs, enlaces por persona y estadísticas de uso (escaneos y solicitudes)
 *   POST action=qr_guardar (slug, titulo…)   → crea o cambia un QR
 *   POST action=qr_borrar (slug)             → lo quita (si ya tiene escaneos, solo se oculta para no perder el historial)
 *   POST action=qr_orden (slugs)             → orden en que salen en el carrusel
 */
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}
require_once dirname(__DIR__) . '/api/_qr_lib.php';

/** Solicitudes que llegaron desde un QR: [slug => [solicitudes]]. Mira el primer y el último toque de cada una. */
function qr_solicitudes(PDO $db, string $desde): array
{
    $out = [];
    $st = $db->prepare("SELECT id, created_at, empresa, estado, primer_toque, ultimo_toque, fuente, contenido FROM leads
                        WHERE created_at >= ? AND (fuente = 'qr' OR primer_toque LIKE '%\"utm_source\":\"qr\"%' OR ultimo_toque LIKE '%\"utm_source\":\"qr\"%')
                        ORDER BY created_at DESC");
    $st->execute([$desde]);
    foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $l) {
        $slug = '';
        foreach (['ultimo_toque', 'primer_toque'] as $k) {
            $t = json_decode((string)$l[$k], true) ?: [];
            if (($t['utm_source'] ?? '') === 'qr' && !empty($t['utm_content'])) {
                $slug = (string)$t['utm_content'];
                break;
            }
        }
        if ($slug === '' && $l['fuente'] === 'qr') {
            $slug = (string)$l['contenido'];
        }
        $out[$slug ?: '?'][] = ['id' => (int)$l['id'], 'fecha' => $l['created_at'], 'empresa' => $l['empresa'], 'estado' => $l['estado']];
    }
    return $out;
}

function qr_estado(): array
{
    $db = pebai_qr_db();
    $hoy = date('Y-m-d');
    $d30 = date('Y-m-d', strtotime('-29 days'));
    $d7 = date('Y-m-d', strtotime('-6 days'));
    $codigos = $db->query('SELECT * FROM qr_codigos ORDER BY activo DESC, orden, created_at')->fetchAll(PDO::FETCH_ASSOC);
    $esc = $db->prepare('SELECT slug, persona, ip_hash, dispositivo, ts FROM qr_escaneos WHERE ts >= ?');
    $esc->execute([date('Y-m-d', strtotime('-89 days'))]);
    $filas = $esc->fetchAll(PDO::FETCH_ASSOC);
    $total = (int)$db->query('SELECT COUNT(*) FROM qr_escaneos')->fetchColumn();
    $sol = qr_solicitudes($db, date('Y-m-d', strtotime('-89 days')));

    $por = [];
    $dias = [];
    for ($i = 29; $i >= 0; $i--) {
        $dias[date('Y-m-d', strtotime("-$i days"))] = 0;
    }
    $personas = ['adrian' => 0, 'daniel' => 0, '' => 0];
    $horas = array_fill(0, 24, 0);
    $disp = [];
    foreach ($filas as $f) {
        $s = $f['slug'];
        $por[$s] ??= ['total' => 0, 'd30' => 0, 'd7' => 0, 'hoy' => 0, 'unicos' => [], 'adrian' => 0, 'daniel' => 0, 'ultimo' => ''];
        $p = &$por[$s];
        $p['total']++;
        $dia = substr($f['ts'], 0, 10);
        if ($dia >= $d30) {
            $p['d30']++;
            $dias[$dia] = ($dias[$dia] ?? 0) + 1;
            $personas[$f['persona']] = ($personas[$f['persona']] ?? 0) + 1;
            $horas[(int)substr($f['ts'], 11, 2)]++;
            $disp[$f['dispositivo'] ?: 'Otro'] = ($disp[$f['dispositivo'] ?: 'Otro'] ?? 0) + 1;
        }
        if ($dia >= $d7) {
            $p['d7']++;
        }
        if ($dia === $hoy) {
            $p['hoy']++;
        }
        $p['unicos'][$f['ip_hash']] = 1;
        if ($f['persona'] === 'adrian' || $f['persona'] === 'daniel') {
            $p[$f['persona']]++;
        }
        $p['ultimo'] = max($p['ultimo'], $f['ts']);
        unset($p);
    }
    $lista = [];
    foreach ($codigos as $c) {
        $e = $por[$c['slug']] ?? ['total' => 0, 'd30' => 0, 'd7' => 0, 'hoy' => 0, 'unicos' => [], 'adrian' => 0, 'daniel' => 0, 'ultimo' => ''];
        $s = $sol[$c['slug']] ?? [];
        $lista[] = [
            'slug' => $c['slug'], 'titulo' => $c['titulo'], 'situacion' => $c['situacion'], 'frase' => $c['frase'], 'tipo' => $c['tipo'],
            'destino' => $c['destino'], 'color' => $c['color'], 'orden' => (int)$c['orden'], 'activo' => (int)$c['activo'],
            'enlaces' => ['adrian' => pebai_qr_corto($c['slug'], 'adrian'), 'daniel' => pebai_qr_corto($c['slug'], 'daniel'), '' => pebai_qr_corto($c['slug'], '')],
            'abre' => pebai_qr_destino($c, ''),
            'stats' => ['total' => $e['total'], 'd30' => $e['d30'], 'd7' => $e['d7'], 'hoy' => $e['hoy'], 'unicos' => count($e['unicos']),
                        'adrian' => $e['adrian'], 'daniel' => $e['daniel'], 'ultimo' => $e['ultimo'], 'solicitudes' => count($s)],
        ];
    }
    $todas = array_merge(...array_values($sol ?: [[]]));
    usort($todas, static fn($a, $b) => strcmp($b['fecha'], $a['fecha']));
    $mejorHora = max($horas) ? array_search(max($horas), $horas, true) : null;
    return [
        'codigos' => $lista,
        'resumen' => [
            'total' => $total, 'd30' => array_sum($dias), 'd7' => array_sum(array_slice($dias, -7)), 'hoy' => end($dias),
            'solicitudes30' => count(array_filter($todas, static fn($x) => substr($x['fecha'], 0, 10) >= $d30)),
            'personas' => $personas, 'dispositivos' => $disp, 'mejor_hora' => $mejorHora,
        ],
        'dias' => array_map(static fn($d, $n) => ['dia' => $d, 'n' => $n], array_keys($dias), array_values($dias)),
        'horas' => $horas,
        'ultimas_solicitudes' => array_slice($todas, 0, 6),
    ];
}

if ($auth && isset($_GET['qr'])) {
    try {
        json_out(['ok' => true, 'csrf' => csrf(), 'ahora' => date('Y-m-d H:i:s')] + qr_estado());
    } catch (Throwable $e) {
        error_log('qr panel: ' . $e->getMessage());
        json_out(['ok' => false, 'error' => 'No se han podido cargar los QRs.'], 500);
    }
}

if ($auth && in_array($_POST['action'] ?? '', ['qr_guardar', 'qr_borrar', 'qr_orden'], true)) {
    if (!hash_equals($_SESSION['csrf'] ?? '', $_POST['csrf'] ?? '')) {
        json_out(['ok' => false, 'error' => 'Sesión caducada. Recarga la página.'], 400);
    }
    $db = pebai_qr_db();
    $now = date('Y-m-d H:i:s');
    switch ($_POST['action']) {
        case 'qr_guardar':
            $titulo = mb_substr(trim((string)($_POST['titulo'] ?? '')), 0, 60);
            $tipo = in_array($_POST['tipo'] ?? '', PEBAI_QR_TIPOS, true) ? $_POST['tipo'] : 'web';
            $destino = mb_substr(trim((string)($_POST['destino'] ?? '')), 0, 400);
            $color = preg_match('/^#[0-9a-f]{6}$/i', (string)($_POST['color'] ?? '')) ? $_POST['color'] : '#B7FF3C';
            if ($titulo === '') {
                json_out(['ok' => false, 'error' => 'Ponle un título al QR.'], 422);
            }
            if ($tipo === 'url' && !preg_match('#^https?://[^\s]+$#i', $destino)) {
                json_out(['ok' => false, 'error' => 'El enlace tiene que empezar por https://'], 422);
            }
            $slug = preg_replace('/[^a-z0-9-]/', '', strtolower((string)($_POST['slug'] ?? '')));
            $existe = false;
            if ($slug !== '') {
                $st = $db->prepare('SELECT COUNT(*) FROM qr_codigos WHERE slug = ?');
                $st->execute([$slug]);
                $existe = (bool)$st->fetchColumn();
            }
            if (!$existe) {
                // slug nuevo a partir del título: corto, sin tildes y único
                $base = trim(preg_replace('/[^a-z0-9]+/', '-', strtolower(iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $titulo) ?: 'qr')), '-');
                $base = substr($base ?: 'qr', 0, 24);
                $slug = $base;
                for ($i = 2; ; $i++) {
                    $st = $db->prepare('SELECT COUNT(*) FROM qr_codigos WHERE slug = ?');
                    $st->execute([$slug]);
                    if (!$st->fetchColumn()) {
                        break;
                    }
                    $slug = $base . '-' . $i;
                }
                $orden = (int)$db->query('SELECT COALESCE(MAX(orden), 0) + 1 FROM qr_codigos')->fetchColumn();
                $db->prepare('INSERT INTO qr_codigos (slug, titulo, situacion, frase, tipo, destino, color, orden, activo, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)')
                    ->execute([$slug, $titulo, mb_substr(trim((string)($_POST['situacion'] ?? '')), 0, 80), mb_substr(trim((string)($_POST['frase'] ?? '')), 0, 200), $tipo, $destino, $color, $orden, $now, $now]);
            } else {
                $db->prepare('UPDATE qr_codigos SET titulo = ?, situacion = ?, frase = ?, tipo = ?, destino = ?, color = ?, activo = ?, updated_at = ? WHERE slug = ?')
                    ->execute([$titulo, mb_substr(trim((string)($_POST['situacion'] ?? '')), 0, 80), mb_substr(trim((string)($_POST['frase'] ?? '')), 0, 200), $tipo, $destino, $color,
                               ($_POST['activo'] ?? '1') === '0' ? 0 : 1, $now, $slug]);
            }
            json_out(['ok' => true, 'slug' => $slug]);
        case 'qr_borrar':
            $slug = preg_replace('/[^a-z0-9-]/', '', strtolower((string)($_POST['slug'] ?? '')));
            $st = $db->prepare('SELECT COUNT(*) FROM qr_escaneos WHERE slug = ?');
            $st->execute([$slug]);
            if ($st->fetchColumn()) {
                $db->prepare('UPDATE qr_codigos SET activo = 0, updated_at = ? WHERE slug = ?')->execute([$now, $slug]);
                json_out(['ok' => true, 'oculto' => true]);
            }
            $db->prepare('DELETE FROM qr_codigos WHERE slug = ?')->execute([$slug]);
            json_out(['ok' => true]);
        case 'qr_orden':
            $up = $db->prepare('UPDATE qr_codigos SET orden = ? WHERE slug = ?');
            foreach (array_values(array_filter(explode(',', (string)($_POST['slugs'] ?? '')))) as $i => $s) {
                $up->execute([$i + 1, preg_replace('/[^a-z0-9-]/', '', $s)]);
            }
            json_out(['ok' => true]);
    }
}
