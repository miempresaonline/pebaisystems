<?php
/*
 * PEBAI · Panel — Contenido › Web: todo lo que hay publicado en pebaisystems.es, ordenado como un esquema.
 * Lo incluye panel/index.php después de comprobar la sesión: usa $auth y json_out() de allí.
 *   GET ?web=1 → páginas (de public_html, al momento), enlaces cortos (del .htaccess) y QRs activos, con sus visitas.
 * No hay lista que mantener a mano: una página nueva sale sola en cuanto se sube.
 */
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}

// Carpetas de public_html que no son páginas (recursos, panel, API, imágenes…)
const WEB_NO_PAGINAS = ['panel', 'api', 'vendor', 'scratch', 'team', 'casos', 'gbp', 'brand', 'clients', 'video', 'node_modules', '.well-known', 'cgi-bin'];

/** Título, descripción y si está oculta a Google, leyendo el principio del HTML. */
function web_meta(string $file): array
{
    $h = (string)@file_get_contents($file, false, null, 0, 65536);
    $m = static fn(string $re) => preg_match($re, $h, $x) ? html_entity_decode(trim(strip_tags($x[1])), ENT_QUOTES | ENT_HTML5, 'UTF-8') : '';
    return [
        'titulo' => $m('~<title[^>]*>(.*?)</title>~is'),
        'descripcion' => $m('~<meta\s+name=["\']description["\']\s+content=["\']([^"\']*)~i'),
        'oculta' => (bool)preg_match('~<meta\s+name=["\']robots["\']\s+content=["\'][^"\']*noindex~i', $h),
    ];
}

/** Rutas públicas («/», «/diagnostico/»…) de cada index.html o index.php, hasta 3 niveles. */
function web_paginas(string $raiz): array
{
    $out = [];
    $it = new RecursiveIteratorIterator(new RecursiveCallbackFilterIterator(
        new RecursiveDirectoryIterator($raiz, FilesystemIterator::SKIP_DOTS),
        static function (SplFileInfo $f, string $k, RecursiveDirectoryIterator $it) use ($raiz) {
            if ($f->isDir()) {
                return $it->getSubPath() !== '' || !in_array($f->getFilename(), WEB_NO_PAGINAS, true);
            }
            return in_array($f->getFilename(), ['index.html', 'index.php'], true);
        }
    ));
    $it->setMaxDepth(3);
    foreach ($it as $f) {
        $rel = trim(str_replace('\\', '/', substr($f->getPath(), strlen($raiz))), '/');
        $ruta = $rel === '' ? '/' : '/' . $rel . '/';
        if (isset($out[$ruta]) && $f->getFilename() === 'index.php') {
            continue;   // con index.html y index.php, manda el html
        }
        $out[$ruta] = ['ruta' => $ruta, 'modificado' => date('Y-m-d H:i', $f->getMTime())] + web_meta($f->getPathname());
    }
    ksort($out);
    return array_values($out);
}

/** Enlaces cortos y redirecciones del .htaccess: [{de, a, permanente}]. */
function web_cortos(string $raiz): array
{
    $out = [];
    foreach (preg_split('/\R/', (string)@file_get_contents($raiz . '/.htaccess')) as $l) {
        if (!preg_match('~^\s*RewriteRule\s+\^([a-z0-9/\-()?.|*]+?)\$?\s+"?([^"\s]+)"?\s+\[([^\]]*R=(30[12])[^\]]*)\]~i', $l, $m)) {
            continue;
        }
        $de = '/' . preg_replace('~\([^)]*\)\?|/\?$~', '', $m[1]);
        if ($de === '/(.*)') {
            continue;   // la regla general de https/www
        }
        $a = str_starts_with($m[2], 'http') ? $m[2] : '/' . ltrim($m[2], '/');
        // «(a|b|c)»: URLs antiguas que se redirigen todas al mismo sitio
        if (preg_match('~^/\((.+)\)$~', $de, $g)) {
            $out[] = ['de' => '', 'antiguas' => array_map(static fn($x) => '/' . $x . '/', explode('|', $g[1])), 'a' => $a, 'permanente' => $m[4] === '301'];
            continue;
        }
        $out[] = ['de' => $de, 'a' => $a, 'permanente' => $m[4] === '301'];
    }
    return $out;
}

if ($auth && isset($_GET['web'])) {
    $raiz = dirname(__DIR__);
    $paginas = web_paginas($raiz);
    // ¿Está en el sitemap?
    $mapa = [];
    if (preg_match_all('~<loc>https?://[^/<]+(/[^<]*)</loc>~', (string)@file_get_contents($raiz . '/sitemap.xml'), $mm)) {
        $mapa = array_flip($mm[1]);
    }
    // Visitas de los últimos 30 días por página (contador propio, api/visita.php)
    $vis = [];
    try {
        $q = pebai_db()->prepare('SELECT path, SUM(visitas) n FROM visitas_dia WHERE fecha >= ? GROUP BY path');
        $q->execute([date('Y-m-d', strtotime('-30 days'))]);
        foreach ($q->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $p = '/' . trim((string)$r['path'], '/') . '/';
            $p = $p === '//' ? '/' : $p;
            $vis[$p] = ($vis[$p] ?? 0) + (int)$r['n'];
        }
    } catch (Throwable $e) {
        // sin tabla de visitas todavía
    }
    foreach ($paginas as &$p) {
        $p['sitemap'] = isset($mapa[$p['ruta']]);
        $p['visitas'] = $vis[$p['ruta']] ?? 0;
    }
    unset($p);
    // QRs activos y adónde llevan
    $qrs = [];
    try {
        require_once dirname(__DIR__) . '/api/_qr_lib.php';
        $qdb = pebai_qr_db();
        $esc = [];
        foreach ($qdb->query('SELECT slug, COUNT(*) n FROM qr_escaneos GROUP BY slug')->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $esc[$r['slug']] = (int)$r['n'];
        }
        foreach ($qdb->query('SELECT * FROM qr_codigos WHERE activo = 1 ORDER BY orden, created_at')->fetchAll(PDO::FETCH_ASSOC) as $q) {
            $destino = pebai_qr_destino($q, '');
            $qrs[] = ['slug' => $q['slug'], 'titulo' => $q['titulo'], 'tipo' => $q['tipo'], 'color' => $q['color'],
                      'destino' => str_starts_with($destino, 'https://pebaisystems.es') ? (parse_url($destino, PHP_URL_PATH) ?: '/') : $destino,
                      'escaneos' => $esc[$q['slug']] ?? 0];
        }
    } catch (Throwable $e) {
        pebai_log('WEB PANEL QR: ' . $e->getMessage());
    }
    json_out(['ok' => true, 'dominio' => 'https://pebaisystems.es', 'paginas' => $paginas, 'cortos' => web_cortos($raiz), 'qrs' => $qrs]);
}
