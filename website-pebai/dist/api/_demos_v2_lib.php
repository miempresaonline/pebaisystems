<?php
/*
 * PEBAI · Demo que vende (v2, 6/11/2026). Datos nuevos que usa api/demo_v2.php, guardados aparte en demos.datos['v2'].
 *  - GEO: se pregunta de verdad a una IA, como lo haría un cliente, y se guarda a quién recomienda.
 *    Toda empresa citada se comprueba (sale en los resultados de la búsqueda o su web existe y lleva su nombre). Sin nota inventada.
 *  - App: contenido de un prototipo que se puede tocar, con sus servicios reales.
 */
require_once __DIR__ . '/_demos_lib.php';

const PEBAI_V2_DIRECTORIOS = '/habitissimo|cronoshare|zaask|infoisinfo|paginasamarillas|yelp|tripadvisor|doctoralia|top-?doctors|idealista|fotocasa|habitaclia|facebook|instagram|linkedin|google\.|wikipedia|youtube|milanuncios|reformas\.org|solarmente|empresite|axesor|einforma|cylex|hotfrog|tuugo|vulka|qdq/i';

function pebai_v2_norm(string $s): string
{
    return preg_replace('/[^a-z0-9]/', '', strtolower(iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $s) ?: $s));
}

function pebai_v2_host(string $u): string
{
    return strtolower(preg_replace('~^www\.~i', '', (string)parse_url(preg_match('~^https?://~i', $u) ? $u : 'https://' . $u, PHP_URL_HOST)));
}

/** ¿Existe de verdad esa empresa? Su web responde y lleva su nombre (alguna palabra propia, no genérica). */
function pebai_v2_web_real(string $web, string $nombre): bool
{
    $host = pebai_v2_host($web);
    if ($host === '' || !str_contains($host, '.') || preg_match(PEBAI_V2_DIRECTORIOS, $host)) {
        return false;
    }
    $html = @file_get_contents('https://' . $host . '/', false, stream_context_create(['http' => ['timeout' => 8, 'user_agent' => 'Mozilla/5.0 (compatible; PEBAI-demo)', 'follow_location' => 1, 'ignore_errors' => true], 'ssl' => ['verify_peer' => false, 'verify_peer_name' => false]]));
    if (!$html) {
        return false;
    }
    $limpio = pebai_v2_norm(mb_substr(strip_tags($html), 0, 20000));
    foreach (preg_split('/\s+/u', $nombre) as $p) {
        $n = pebai_v2_norm($p);
        if (strlen($n) >= 5 && !in_array($n, ['reformas', 'reforma', 'empresa', 'empresas', 'integrales', 'clinica', 'dental', 'inmobiliaria', 'instalaciones', 'solar', 'energia', 'construcciones'], true) && str_contains($limpio, $n)) {
            return true;
        }
    }
    return false;
}

/** Una pregunta real a la IA con búsqueda en internet. Devuelve las empresas que recomienda, ya comprobadas, en su orden. */
function pebai_v2_preguntar(string $pregunta, string $ciudad): array
{
    require_once __DIR__ . '/_claude_lib.php';
    $t = pebai_claude('demos', 'claude-haiku-5-5',
        'Eres un asistente de IA y un cliente en España te pide consejo. Busca en internet y contesta con lo que le recomendarías de verdad. '
        . 'Responde SOLO JSON: {"empresas": [{"nombre": "nombre comercial", "web": "su dominio propio"}]}, hasta 5, de la que más recomiendas a la que menos. '
        . 'Solo empresas concretas que hayas encontrado. Nunca directorios, portales, comparadores ni artículos (saca de ellos los nombres de las empresas, no los cites). No inventes nada: si no encuentras, lista vacía.',
        [['role' => 'user', 'content' => $pregunta]],
        ['effort' => 'low', 'max_tokens' => 2500, 'timeout' => 90,
         'tools' => [['type' => 'web_search_20250305', 'name' => 'web_search', 'max_uses' => 2,
                      'user_location' => ['type' => 'approximate', 'country' => 'ES', 'city' => $ciudad, 'timezone' => 'Europe/Madrid']]]]);
    if ($t === null) {
        return [];
    }
    $resultados = [];
    foreach ((array)($GLOBALS['pebai_claude_bloques'] ?? []) as $b) {
        if (($b['type'] ?? '') === 'web_search_tool_result') {
            foreach ((array)($b['content'] ?? []) as $r) {
                if (($r['type'] ?? '') === 'web_search_result') {
                    $resultados[] = ['host' => pebai_v2_host((string)($r['url'] ?? '')), 'url' => (string)($r['url'] ?? ''), 'titulo' => pebai_v2_norm((string)($r['title'] ?? ''))];
                }
            }
        }
    }
    $t = trim(preg_replace('/^```(?:json)?|```$/m', '', $t));
    $j = json_decode($t, true);
    if (!is_array($j) && preg_match('/\{.*\}/s', $t, $m)) {
        $j = json_decode($m[0], true);
    }
    $sal = [];
    foreach (array_slice((array)($j['empresas'] ?? []), 0, 5) as $e) {
        $nombre = mb_substr(trim((string)($e['nombre'] ?? '')), 0, 60);
        $host = pebai_v2_host((string)($e['web'] ?? ''));
        if ($nombre === '' || preg_match(PEBAI_V2_DIRECTORIOS, $host . ' ' . $nombre)) {
            continue;
        }
        $n = pebai_v2_norm($nombre);
        $ok = false;
        foreach ($resultados as $r) {
            if (($host !== '' && $r['host'] === $host) || (strlen($n) >= 6 && str_contains($r['titulo'], $n))) {
                $ok = true;
                $host = $host ?: $r['host'];
                break;
            }
        }
        // Citada dentro de un artículo: solo vale si su propia web existe y lleva su nombre
        if ($ok || ($host !== '' && pebai_v2_web_real($host, $nombre))) {
            $sal[] = ['nombre' => $nombre, 'web' => $host];
        }
    }
    return $sal;
}

/** GEO real: tres preguntas como las de un cliente. Dice a quién recomienda la IA y en qué puesto está la empresa, si está. */
function pebai_v2_geo(string $empresa, string $sector, string $ciudad, string $web, string $servicio = ''): ?array
{
    $ciudad = $ciudad ?: 'España';
    $preguntas = ['¿Qué ' . mb_strtolower($sector) . ' me recomiendas en ' . $ciudad . '?',
                  ($servicio !== '' ? 'Necesito ' . mb_strtolower($servicio) : 'Busco ' . mb_strtolower($sector)) . ' en ' . $ciudad . '. ¿A quién llamo?',
                  '¿Cuáles son las mejores ' . mb_strtolower($sector) . ' de ' . $ciudad . ' y alrededores?'];
    $dom = pebai_v2_host($web);
    $normEmp = pebai_v2_norm($empresa);
    $hechas = [];
    $veces = [];
    foreach ($preguntas as $pr) {
        $emp = pebai_v2_preguntar($pr, $ciudad);
        $pos = null;
        foreach ($emp as $i => &$e) {
            $yo = ($dom !== '' && ($e['web'] === $dom || str_ends_with($e['web'], '.' . $dom))) || (strlen($normEmp) >= 5 && str_contains(pebai_v2_norm($e['nombre']), $normEmp));
            $e['yo'] = $yo;
            if ($yo && $pos === null) {
                $pos = $i + 1;
            }
            $k = $e['web'] ?: pebai_v2_norm($e['nombre']);
            if (!$yo) {
                $veces[$k] = ['nombre' => $veces[$k]['nombre'] ?? $e['nombre'], 'web' => $e['web'], 'n' => ($veces[$k]['n'] ?? 0) + 1, 'mejor' => min($veces[$k]['mejor'] ?? 99, $i + 1)];
            }
        }
        unset($e);
        if ($emp) {
            $hechas[] = ['pregunta' => $pr, 'empresas' => $emp, 'posicion' => $pos];
        }
    }
    if (!$hechas) {
        return null;   // sin respuesta real no hay informe
    }
    uasort($veces, static fn($a, $b) => [$b['n'], $a['mejor']] <=> [$a['n'], $b['mejor']]);
    return ['preguntas' => $hechas, 'ranking' => array_slice(array_values($veces), 0, 5), 'tu_veces' => count(array_filter(array_column($hechas, 'posicion'))),
            'fecha' => date('Y-m-d H:i'), 'ia' => 'Claude'];
}

/** Contenido del prototipo de su app: para SUS clientes, con SUS servicios. */
function pebai_v2_app(string $empresa, array $kb, string $sector): ?array
{
    require_once __DIR__ . '/_claude_lib.php';
    $j = pebai_claude_json('demos', 'claude-haiku-5-5',
        'Preparas el contenido de una app móvil para los CLIENTES de una empresa española, con sus servicios reales. Nada genérico. Textos muy cortos, en español de España. Los datos del cliente y las fechas son de ejemplo, creíbles. No inventes servicios que la empresa no da. Responde SOLO JSON.',
        "EMPRESA: {$empresa}\nSECTOR: {$sector}\nQUÉ HACEN: " . ($kb['que_hacen'] ?? '') . "\nSERVICIOS: " . implode(', ', (array)($kb['servicios'] ?? [])) . "\n\nJSON: "
        . '{"nombre": "nombre corto de la app (el de la empresa)", "cliente": "un nombre de pila", '
        . '"caso": {"palabra": "cómo llaman al encargo del cliente en una palabra: obra, instalación, tratamiento, visita…", "titulo": "su caso, máx 4 palabras", "lugar": "dónde o qué, máx 4 palabras", "avance": número entre 40 y 80, "fase": "fase actual, máx 3 palabras"}, '
        . '"proximo": {"titulo": "lo siguiente que va a pasar, máx 6 palabras", "cuando": "p. ej. Mañana, 9:00", "quien": "nombre y oficio, máx 3 palabras"}, '
        . '"fases": [exactamente 5: {"nombre": "máx 3 palabras", "fecha": "p. ej. 12 mar", "estado": "hecho|ahora|pendiente"}], '
        . '"pedir": {"titulo": "pregunta corta para pedir algo nuevo", "opciones": [exactamente 4 servicios reales suyos, máx 3 palabras cada uno]}, '
        . '"avisos": [exactamente 3: {"titulo": "aviso de la empresa al cliente, máx 7 palabras", "cuando": "p. ej. Hace 2 h"}]}',
        ['effort' => 'low', 'max_tokens' => 2000]);
    return is_array($j) && !empty($j['fases']) && !empty($j['pedir']['opciones']) ? $j : null;
}
