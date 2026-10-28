<?php
/*
 * PEBAI · Demos (pedido por Daniel el 28/10/2026).
 * Para cada empresa que responde de verdad (una persona, no su contestador) prepara su página privada pebaisystems.es/para/<slug>/:
 *   1. Radiografía en IA: una búsqueda web real («mejores <sector> en <ciudad>») hecha por Claude: si sale la empresa y quién sale.
 *   2. Demo de su asistente: un chat que contesta con lo que dice su web (nada inventado).
 *   3. Boceto de su app: tres pantallas pensadas para sus clientes.
 * Todo sale de datos reales (su web y la búsqueda). Coste medido: ~1,5 céntimos por demo (+ ~0,05 céntimos por mensaje del chat).
 * Las demos viven en private/demos.sqlite (fuera de public_html y del repositorio).
 */
require_once __DIR__ . '/_agentes_lib.php';
require_once __DIR__ . '/_claude_lib.php';
require_once __DIR__ . '/_ia_lib.php';

const PEBAI_DEMO_CHAT_MAX = 4;    // mensajes de prueba en el asistente: después, invitación a montarlo de verdad   // mensajes del chat de demo por empresa (para que nadie gaste el crédito)

function pebai_demos_db(): PDO
{
    static $db = null;
    if ($db) {
        return $db;
    }
    $db = new PDO('sqlite:' . pebai_private_dir() . '/demos.sqlite');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $db->exec('CREATE TABLE IF NOT EXISTS demos (
        slug TEXT PRIMARY KEY,
        canal TEXT NOT NULL,
        prospecto_id INTEGER NOT NULL,
        empresa TEXT NOT NULL,
        ciudad TEXT NOT NULL DEFAULT "",
        sector TEXT NOT NULL DEFAULT "",
        web TEXT NOT NULL DEFAULT "",
        datos TEXT NOT NULL DEFAULT "{}",
        creada TEXT NOT NULL,
        visitas INTEGER NOT NULL DEFAULT 0,
        primera_visita TEXT NOT NULL DEFAULT "",
        ultima_visita TEXT NOT NULL DEFAULT "",
        chats INTEGER NOT NULL DEFAULT 0,
        usd REAL NOT NULL DEFAULT 0
    )');
    $db->exec('CREATE UNIQUE INDEX IF NOT EXISTS demos_prospecto ON demos (canal, prospecto_id)');
    return $db;
}

function pebai_demo_url(string $slug): string
{
    return 'https://pebaisystems.es/para/' . $slug . '/';
}

/** La demo de una empresa (o null). */
function pebai_demo_de(string $canal, int $id): ?array
{
    $q = pebai_demos_db()->prepare('SELECT * FROM demos WHERE canal = ? AND prospecto_id = ?');
    $q->execute([$canal, $id]);
    $d = $q->fetch();
    return $d ?: null;
}

function pebai_demo_slug(string $empresa): string
{
    $s = trim(preg_replace('/[^a-z0-9]+/', '-', strtolower(iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $empresa) ?: $empresa)), '-');
    $s = substr($s ?: 'empresa', 0, 40);
    return $s . '-' . substr(bin2hex(random_bytes(3)), 0, 5);   // con un trozo aleatorio: nadie adivina la de otra empresa
}

/** HTML de su portada (una sola descarga para el color y el logo). */
function pebai_demo_html(string $url): string
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => true, CURLOPT_TIMEOUT => 12, CURLOPT_SSL_VERIFYPEER => false,
                            CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130 Safari/537.36']);
    $html = (string)curl_exec($ch);
    curl_close($ch);
    return $html;
}

/** Color de marca de su web: theme-color, sus variables de color principal o el color con fuerza que más repite. */
function pebai_demo_color(string $html): string
{
    if (preg_match('~<meta[^>]+name=["\']theme-color["\'][^>]+content=["\'](#[0-9a-f]{6})~i', $html, $m)) {
        return strtolower($m[1]);
    }
    preg_match_all('~#([0-9a-f]{6})\b~i', $html, $mm);
    $cuenta = [];
    foreach ($mm[1] as $h) {
        $h = strtolower($h);
        [$r, $g, $b] = [hexdec(substr($h, 0, 2)), hexdec(substr($h, 2, 2)), hexdec(substr($h, 4, 2))];
        if (max($r, $g, $b) - min($r, $g, $b) > 60 && max($r, $g, $b) > 70) {   // fuera blancos, negros y grises
            $cuenta[$h] = ($cuenta[$h] ?? 0) + 1;
        }
    }
    if (preg_match('~--[\w-]*(?:primary|brand|accent|main)[\w-]*\s*:\s*#([0-9a-f]{6})~i', $html, $m)) {
        $cuenta[strtolower($m[1])] = ($cuenta[strtolower($m[1])] ?? 0) + 2;   // su variable de color principal suma
    }
    arsort($cuenta);
    return $cuenta ? '#' . array_key_first($cuenta) : '#6a5cff';
}

/**
 * Su logo de verdad: la imagen con «logo» de su web (o su icono). Se guarda en public_html/demos/logos/ (lo crea el servidor;
 * no va al repositorio) y se devuelve su ruta, o '' si no hay.
 */
function pebai_demo_logo(string $html, string $base, string $slug): string
{
    $abs = static function (string $u) use ($base): string {
        $u = html_entity_decode(trim($u));
        if ($u === '' || str_starts_with($u, 'data:')) {
            return $u;
        }
        if (str_starts_with($u, '//')) {
            return 'https:' . $u;
        }
        if (preg_match('~^https?://~i', $u)) {
            return $u;
        }
        $p = parse_url($base);
        return ($p['scheme'] ?? 'https') . '://' . ($p['host'] ?? '') . (str_starts_with($u, '/') ? '' : '/') . $u;
    };
    $cands = [];
    foreach (preg_match_all('~<img\b[^>]*>~i', $html, $mm) ? $mm[0] : [] as $tag) {
        // «logo» en la clase, el id, el texto alternativo o el nombre del archivo (no dentro de una imagen en base64)
        $sin = preg_replace('~base64,[A-Za-z0-9+/=\s]+~', 'base64,', $tag);
        if (!preg_match('~(class|id|alt)=["\'][^"\']*logo|(src|data-src)=["\'][^"\']*logo[^"\']*\.(png|svg|webp|jpe?g)~i', $sin)) {
            continue;
        }
        foreach (['data-src', 'data-lazy-src', 'src'] as $at) {
            if (preg_match('~\b' . $at . '=["\']([^"\']+)~i', $tag, $m) && !str_contains($m[1], 'data:image/gif')) {
                $cands[] = $abs($m[1]);
                break;
            }
        }
        if (count($cands) >= 2) {
            break;
        }
    }
    foreach (['apple-touch-icon', 'icon', 'shortcut icon'] as $rel) {
        if (preg_match('~<link[^>]+rel=["\']' . $rel . '["\'][^>]*href=["\']([^"\']+)~i', $html, $m) || preg_match('~<link[^>]+href=["\']([^"\']+)["\'][^>]*rel=["\']' . $rel . '["\']~i', $html, $m)) {
            $cands[] = $abs($m[1]);
        }
    }
    $p0 = parse_url($base);
    $cands[] = ($p0['scheme'] ?? 'https') . '://' . ($p0['host'] ?? '') . '/favicon.ico';   // el icono de siempre, si lo tiene
    $dir = dirname(__DIR__) . '/demos/logos';
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
    foreach ($cands as $u) {
        $bin = '';
        $tipo = '';
        if (preg_match('~^data:image/(png|jpe?g|webp|svg\+xml);base64,(.+)$~is', $u, $m)) {
            $bin = (string)base64_decode($m[2], true);
            $tipo = $m[1];
        } elseif (preg_match('~^https?://~i', $u)) {
            $ch = curl_init($u);
            curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => true, CURLOPT_TIMEOUT => 10, CURLOPT_SSL_VERIFYPEER => false,
                                    CURLOPT_USERAGENT => 'Mozilla/5.0 Chrome/130']);
            $bin = (string)curl_exec($ch);
            $ct = (string)curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
            curl_close($ch);
            $tipo = preg_match('~image/(png|jpe?g|webp|svg\+xml|x-icon|vnd\.microsoft\.icon)~i', $ct, $m) ? $m[1] : '';
        }
        if ($bin === '' || strlen($bin) < 200 || strlen($bin) > 400000 || $tipo === '') {
            continue;
        }
        $ext = ['svg+xml' => 'svg', 'jpeg' => 'jpg', 'jpg' => 'jpg', 'png' => 'png', 'webp' => 'webp', 'x-icon' => 'ico', 'vnd.microsoft.icon' => 'ico'][strtolower($tipo)] ?? 'png';
        if ($ext === 'svg' && preg_match('~<script|on\w+=~i', $bin)) {
            continue;   // un SVG con código no se sirve
        }
        $f = $slug . '.' . $ext;
        if (@file_put_contents($dir . '/' . $f, $bin) !== false) {
            return '/demos/logos/' . $f;
        }
    }
    return '';
}

/** Radiografía en IA: Claude hace DOS búsquedas web reales (dos formas de preguntar) y dice en cuáles sale la empresa y quién sale. */
function pebai_demo_radiografia(string $empresa, string $sector, string $ciudad, string $web, string $servicio = ''): ?array
{
    $consultas = ['mejores ' . mb_strtolower($sector) . ' en ' . $ciudad,
                  ($servicio !== '' ? mb_strtolower($servicio) : 'empresa de confianza de ' . mb_strtolower($sector)) . ' en ' . $ciudad . ' recomendaciones'];
    $dominio = preg_replace('~^www\.~', '', (string)parse_url($web, PHP_URL_HOST));
    $t = pebai_claude('demos', 'claude-haiku-5-5',
        'Eres un analista de visibilidad en buscadores con IA. Haces búsquedas web reales y cuentas solo lo que sale en los resultados, sin inventar nada. Responde SOLO JSON.',
        [['role' => 'user', 'content' => "Haz estas DOS búsquedas en internet, una cada vez:\n1. «{$consultas[0]}»\n2. «{$consultas[1]}»\nCon lo que salga en cada una, responde JSON:\n"
            . '{"busquedas": [para cada búsqueda, en orden: {"empresas": [hasta 8 empresas recomendadas o listadas, en el orden en que salen: {"nombre": "...", "web": "dominio o vacío"}], '
            . '"fuentes": [hasta 3: {"titulo": "...", "url": "..."}]}], "resumen": "una frase de qué ve alguien que pregunta esto a una IA, y si sale ' . $empresa . '"}']],
        ['effort' => 'low', 'max_tokens' => 4000, 'timeout' => 120,
         'tools' => [['type' => 'web_search_20250305', 'name' => 'web_search', 'max_uses' => 2,
                      'user_location' => ['type' => 'approximate', 'country' => 'ES', 'city' => $ciudad, 'timezone' => 'Europe/Madrid']]]]);
    if ($t === null) {
        return null;
    }
    $t = trim(preg_replace('/^```(?:json)?|```$/m', '', $t));
    $j = json_decode($t, true);
    if (!is_array($j) && preg_match('/\{.*\}/s', $t, $m)) {
        $j = json_decode($m[0], true);
    }
    if (!is_array($j) || empty($j['busquedas'])) {
        return null;
    }
    // Comprobación propia: sale si su dominio o su nombre está en la lista (no nos fiamos solo de lo que diga el modelo)
    $norm = static fn($s) => preg_replace('/[^a-z0-9]/', '', strtolower(iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', (string)$s) ?: (string)$s));
    $busq = [];
    foreach (array_slice((array)$j['busquedas'], 0, 2) as $k => $b) {
        $emp = array_slice(array_values(array_filter(array_map(static fn($e) => ['nombre' => mb_substr(trim((string)($e['nombre'] ?? '')), 0, 80), 'web' => mb_substr(trim((string)($e['web'] ?? '')), 0, 80)], (array)($b['empresas'] ?? [])), static fn($e) => $e['nombre'] !== '')), 0, 8);
        $pos = null;
        foreach ($emp as $i => $e) {
            if (($dominio && $e['web'] !== '' && str_contains($norm($e['web']), $norm($dominio))) || ($norm($empresa) !== '' && (str_contains($norm($e['nombre']), $norm($empresa)) || str_contains($norm($empresa), $norm($e['nombre']))))) {
                $pos = $i + 1;
                break;
            }
        }
        if (!$emp) {
            continue;
        }
        $busq[] = ['consulta' => $consultas[$k], 'empresas' => $emp, 'posicion' => $pos,
                   'fuentes' => array_slice(array_values(array_filter(array_map(static fn($f) => ['titulo' => mb_substr(trim((string)($f['titulo'] ?? '')), 0, 120), 'url' => (string)($f['url'] ?? '')], (array)($b['fuentes'] ?? [])), static fn($f) => str_starts_with($f['url'], 'http'))), 0, 3)];
    }
    if (!$busq) {
        return null;
    }
    // Quién sale más veces entre las dos búsquedas
    $veces = [];
    foreach ($busq as $b) {
        foreach ($b['empresas'] as $i => $e) {
            $k = $norm($e['nombre']);
            $veces[$k] = ['nombre' => $veces[$k]['nombre'] ?? $e['nombre'], 'n' => ($veces[$k]['n'] ?? 0) + 1, 'mejor' => min($veces[$k]['mejor'] ?? 99, $i + 1)];
        }
    }
    uasort($veces, static fn($a, $b) => [$b['n'], $a['mejor']] <=> [$a['n'], $b['mejor']]);
    // Nota de visibilidad 0-100: salir arriba en las dos búsquedas = 100
    $nota = 0;
    foreach ($busq as $b) {
        $nota += $b['posicion'] ? (int)round(100 / count($busq) * max(.2, 1 - ($b['posicion'] - 1) / 8)) : 0;
    }
    $primera = $busq[0] ?? ['empresas' => [], 'posicion' => null, 'fuentes' => [], 'consulta' => $consultas[0]];
    return ['consulta' => $primera['consulta'], 'empresas' => $primera['empresas'], 'aparece' => (bool)array_filter(array_column($busq, 'posicion')),
            'posicion' => $primera['posicion'] ?? (array_values(array_filter(array_column($busq, 'posicion')))[0] ?? null), 'fuentes' => $primera['fuentes'],
            'busquedas' => $busq, 'competidores' => array_slice(array_values($veces), 0, 6), 'nota' => $nota,
            'resumen' => mb_substr((string)($j['resumen'] ?? ''), 0, 300), 'fecha' => date('Y-m-d H:i')];
}

/**
 * Crea (o devuelve) la demo de una empresa. $p: prospecto (empresa, ciudad, web, sector, nicho). Devuelve la fila o null si no hay web que leer.
 */
function pebai_demo_crear(string $canal, array $p): ?array
{
    if ($d = pebai_demo_de($canal, (int)$p['id'])) {
        return $d;
    }
    $web = trim((string)($p['web'] ?? ''));
    if ($web !== '' && !preg_match('~^https?://~', $web)) {
        $web = 'https://' . ltrim($web, '/');
    }
    $w = $web !== '' ? pebai_web_texto($web) : null;
    if (!$w) {
        return null;   // sin web no hay de dónde sacar nada real
    }
    $empresa = trim((string)$p['empresa']);
    $ciudad = trim((string)($p['ciudad'] ?? ''));
    $nicho = (string)($p['nicho'] ?? 'solar');
    $sectores = ['solar' => 'instaladoras de placas solares', 'energia' => 'instaladoras de placas solares', 'reformas' => 'empresas de reformas integrales',
                 'dentales' => 'clínicas dentales', 'inmobiliarias' => 'inmobiliarias', 'climatizacion' => 'empresas de climatización'];
    $sector = $sectores[$nicho] ?? (trim((string)($p['sector'] ?? '')) ?: 'empresas de su sector');
    $antes = pebai_claude_gasto_mes();

    // 1) Lo que sabe su asistente: solo lo que dice su web
    $kb = pebai_claude_json('demos', 'claude-haiku-5-5',
        'Lees la web de una empresa española y sacas SOLO lo que dice, sin inventar nada. Si un dato no está, déjalo vacío. Responde SOLO JSON.',
        "EMPRESA: {$empresa}" . ($ciudad ? " ({$ciudad})" : '') . "\nWEB:\n" . $w['texto'] . "\n\nJSON: "
        . '{"que_hacen": "una frase", "servicios": ["hasta 6, cortos"], "zona": "dónde trabajan", "horario": "", "contacto": "cómo se les contacta según la web", '
        . '"puntos_fuertes": ["hasta 4, sacados de la web"], "preguntas": [hasta 5: {"p": "pregunta típica de un cliente", "r": "respuesta con lo que dice la web"}], '
        . '"saludo": "primer mensaje del asistente de la empresa, cercano, 1-2 frases, en su nombre"}',
        ['effort' => 'low', 'max_tokens' => 3000]);
    if (!is_array($kb) || trim((string)($kb['que_hacen'] ?? '')) === '') {
        return null;
    }
    // 2) Radiografía en IA (búsqueda real)
    $radio = pebai_demo_radiografia($empresa, $sector, $ciudad ?: 'España', $web, (string)(((array)($kb['servicios'] ?? []))[0] ?? ''));
    // 3) Boceto de su app: para sus clientes, con sus servicios
    $app = pebai_claude_json('demos', 'claude-haiku-5-5',
        'Diseñas el boceto de una app móvil sencilla y útil para los CLIENTES de una empresa española, con sus servicios reales. Nada genérico: usa los servicios que te dan. Las cifras de las pantallas son de ejemplo (se mostrará así), que sean creíbles. Responde SOLO JSON.',
        "EMPRESA: {$empresa}\nQUÉ HACEN: {$kb['que_hacen']}\nSERVICIOS: " . implode(', ', (array)($kb['servicios'] ?? [])) . "\n\nJSON: "
        . '{"nombre": "nombre corto de la app", "lema": "frase corta", "pantallas": [exactamente 3: {"titulo": "...", "para_que": "una frase de qué resuelve al cliente", '
        . '"bloques": [3-5: {"tipo": "tarjeta|boton|lista|progreso|aviso", "texto": "corto", "detalle": "más corto aún o vacío", "valor": número 0-100 solo para progreso}]}]}',
        ['effort' => 'low', 'max_tokens' => 3000]);

    $slug = pebai_demo_slug($empresa);
    $html = pebai_demo_html($web);
    // Si su logo es texto (p. ej. «JM» con letras), se usa ese monograma tal cual
    $logoTexto = '';
    if (preg_match('~class=["\'][^"\']*logo[^"\']*["\'][^>]*>\s*([^<\s][^<]{0,5})<~i', $html, $m)) {
        $logoTexto = trim(html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5, 'UTF-8'));   // el primer texto del logo: «JM» de «JM<span>Solars</span>»
    }
    $datos = ['kb' => $kb, 'radio' => $radio, 'app' => is_array($app) ? $app : null, 'color' => pebai_demo_color($html), 'logo' => pebai_demo_logo($html, $web, $slug),
              'logo_texto' => $logoTexto,
              'dominio' => preg_replace('~^www\.~', '', (string)parse_url($web, PHP_URL_HOST))];
    $usd = max(0, pebai_claude_gasto_mes() - $antes);
    pebai_demos_db()->prepare('INSERT OR IGNORE INTO demos (slug, canal, prospecto_id, empresa, ciudad, sector, web, datos, creada, usd) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        ->execute([$slug, $canal, (int)$p['id'], $empresa, $ciudad, $sector, $web, json_encode($datos, JSON_UNESCAPED_UNICODE), date('Y-m-d H:i:s'), $usd]);
    pebai_actividad('demos', 'entrega', 'Demo lista para ' . $empresa, json_encode(['url' => pebai_demo_url($slug),
        'texto' => ($radio ? ($radio['aparece'] ? 'Sale en la IA (puesto ' . $radio['posicion'] . ')' : 'No sale en la IA; sí salen ' . implode(', ', array_slice(array_column($radio['empresas'], 'nombre'), 0, 3))) : 'Sin radiografía') . ' · ' . number_format($usd * 100, 1, ',', '') . ' céntimos'], JSON_UNESCAPED_UNICODE), 'demo');
    return pebai_demo_de($canal, (int)$p['id']);
}
