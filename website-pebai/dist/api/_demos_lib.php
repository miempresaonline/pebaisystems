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

const PEBAI_DEMO_CHAT_MAX = 15;   // mensajes del chat de demo por empresa (para que nadie gaste el crédito)

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
    $s = strtolower(trim(preg_replace('/[^a-z0-9]+/', '-', iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $empresa) ?: $empresa), '-'));
    $s = substr($s ?: 'empresa', 0, 40);
    return $s . '-' . substr(bin2hex(random_bytes(3)), 0, 5);   // con un trozo aleatorio: nadie adivina la de otra empresa
}

/** Color de marca de su web (theme-color o el color más repetido), para que la demo se sienta suya. */
function pebai_demo_color(string $url): string
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => true, CURLOPT_TIMEOUT => 12, CURLOPT_SSL_VERIFYPEER => false,
                            CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130 Safari/537.36']);
    $html = (string)curl_exec($ch);
    curl_close($ch);
    if (preg_match('~<meta[^>]+name=["\']theme-color["\'][^>]+content=["\'](#[0-9a-f]{6})~i', $html, $m)) {
        return strtolower($m[1]);
    }
    preg_match_all('~#([0-9a-f]{6})\b~i', $html, $mm);
    $cuenta = [];
    foreach ($mm[1] as $h) {
        $h = strtolower($h);
        [$r, $g, $b] = [hexdec(substr($h, 0, 2)), hexdec(substr($h, 2, 2)), hexdec(substr($h, 4, 2))];
        $sat = max($r, $g, $b) - min($r, $g, $b);
        if ($sat > 60 && max($r, $g, $b) > 70) {   // fuera blancos, negros y grises
            $cuenta[$h] = ($cuenta[$h] ?? 0) + 1;
        }
    }
    arsort($cuenta);
    return $cuenta ? '#' . array_key_first($cuenta) : '#6a5cff';
}

/** Radiografía en IA: Claude busca de verdad en internet y dice si la empresa sale y quién sale. */
function pebai_demo_radiografia(string $empresa, string $sector, string $ciudad, string $web): ?array
{
    $consulta = 'mejores ' . mb_strtolower($sector) . ' en ' . $ciudad;
    $dominio = preg_replace('~^www\.~', '', (string)parse_url($web, PHP_URL_HOST));
    $t = pebai_claude('demos', 'claude-haiku-5-5',
        'Eres un analista de visibilidad en buscadores con IA. Haces UNA búsqueda web real y cuentas solo lo que sale en los resultados, sin inventar nada. Responde SOLO JSON.',
        [['role' => 'user', 'content' => "Busca en internet: «{$consulta}». Con lo que salga, responde JSON:\n"
            . '{"empresas": [hasta 8 empresas recomendadas o listadas en los resultados, en el orden en que salen: {"nombre": "...", "web": "dominio o vacío"}], '
            . '"aparece": true/false según si «' . $empresa . '»' . ($dominio ? " (web {$dominio})" : '') . ' sale en los resultados, '
            . '"posicion": número de su puesto en la lista o null, "fuentes": [hasta 4: {"titulo": "...", "url": "..."}], '
            . '"resumen": "una frase de qué ve alguien que pregunta esto a una IA"}']],
        ['effort' => 'low', 'max_tokens' => 3000, 'timeout' => 90,
         'tools' => [['type' => 'web_search_20250305', 'name' => 'web_search', 'max_uses' => 1,
                      'user_location' => ['type' => 'approximate', 'country' => 'ES', 'city' => $ciudad, 'timezone' => 'Europe/Madrid']]]]);
    if ($t === null) {
        return null;
    }
    $t = trim(preg_replace('/^```(?:json)?|```$/m', '', $t));
    $j = json_decode($t, true);
    if (!is_array($j) && preg_match('/\{.*\}/s', $t, $m)) {
        $j = json_decode($m[0], true);
    }
    if (!is_array($j) || empty($j['empresas'])) {
        return null;
    }
    $empresas = array_slice(array_values(array_filter(array_map(static fn($e) => ['nombre' => mb_substr(trim((string)($e['nombre'] ?? '')), 0, 80), 'web' => mb_substr(trim((string)($e['web'] ?? '')), 0, 80)], (array)$j['empresas']), static fn($e) => $e['nombre'] !== '')), 0, 8);
    $fuentes = array_slice(array_values(array_filter(array_map(static fn($f) => ['titulo' => mb_substr(trim((string)($f['titulo'] ?? '')), 0, 120), 'url' => (string)($f['url'] ?? '')], (array)($j['fuentes'] ?? [])), static fn($f) => str_starts_with($f['url'], 'http'))), 0, 4);
    // Comprobación propia: si su dominio o su nombre está en la lista, sale (no nos fiamos solo de lo que diga el modelo)
    $norm = static fn($s) => preg_replace('/[^a-z0-9]/', '', strtolower(iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $s) ?: $s));
    $pos = null;
    foreach ($empresas as $i => $e) {
        if (($dominio && str_contains($norm($e['web']), $norm($dominio))) || ($norm($empresa) !== '' && (str_contains($norm($e['nombre']), $norm($empresa)) || str_contains($norm($empresa), $norm($e['nombre']))))) {
            $pos = $i + 1;
            break;
        }
    }
    return ['consulta' => $consulta, 'empresas' => $empresas, 'aparece' => $pos !== null, 'posicion' => $pos, 'fuentes' => $fuentes,
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
    $radio = pebai_demo_radiografia($empresa, $sector, $ciudad ?: 'España', $web);
    // 3) Boceto de su app: para sus clientes, con sus servicios
    $app = pebai_claude_json('demos', 'claude-haiku-5-5',
        'Diseñas el boceto de una app móvil sencilla y útil para los CLIENTES de una empresa española, con sus servicios reales. Nada genérico ni inventado: usa los servicios que te dan. Responde SOLO JSON.',
        "EMPRESA: {$empresa}\nQUÉ HACEN: {$kb['que_hacen']}\nSERVICIOS: " . implode(', ', (array)($kb['servicios'] ?? [])) . "\n\nJSON: "
        . '{"nombre": "nombre corto de la app", "lema": "frase corta", "pantallas": [exactamente 3: {"titulo": "...", "para_que": "una frase de qué resuelve al cliente", '
        . '"bloques": [3-5: {"tipo": "tarjeta|boton|lista|progreso|aviso", "texto": "corto", "detalle": "más corto aún o vacío", "valor": número 0-100 solo para progreso}]}]}',
        ['effort' => 'low', 'max_tokens' => 3000]);

    $datos = ['kb' => $kb, 'radio' => $radio, 'app' => is_array($app) ? $app : null, 'color' => pebai_demo_color($web),
              'dominio' => preg_replace('~^www\.~', '', (string)parse_url($web, PHP_URL_HOST))];
    $slug = pebai_demo_slug($empresa);
    $usd = max(0, pebai_claude_gasto_mes() - $antes);
    pebai_demos_db()->prepare('INSERT OR IGNORE INTO demos (slug, canal, prospecto_id, empresa, ciudad, sector, web, datos, creada, usd) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        ->execute([$slug, $canal, (int)$p['id'], $empresa, $ciudad, $sector, $web, json_encode($datos, JSON_UNESCAPED_UNICODE), date('Y-m-d H:i:s'), $usd]);
    pebai_actividad('demos', 'entrega', 'Demo lista para ' . $empresa, json_encode(['url' => pebai_demo_url($slug),
        'texto' => ($radio ? ($radio['aparece'] ? 'Sale en la IA (puesto ' . $radio['posicion'] . ')' : 'No sale en la IA; sí salen ' . implode(', ', array_slice(array_column($radio['empresas'], 'nombre'), 0, 3))) : 'Sin radiografía') . ' · ' . number_format($usd * 100, 1, ',', '') . ' céntimos'], JSON_UNESCAPED_UNICODE), 'demo');
    return pebai_demo_de($canal, (int)$p['id']);
}
