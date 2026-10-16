<?php
/*
 * PEBAI · Panel — Captación › Mapa: cada prospecto analizado en su sitio, con su estado.
 * Lo incluye panel/index.php después de comprobar la sesión: usa $auth y json_out() de allí.
 *   GET ?mapa=1 → puntos de las dos listas (WhatsApp y Email) con estado unificado y coordenadas.
 * Coordenadas: si el prospecto trae lat/lon (cuando el scraper las guarde) se usan tal cual. Si no, el centro de su
 * ciudad (GeoNames, api/municipios_es.json; o OpenStreetMap Nominatim, guardado en caché en geo_ciudades) con un
 * pequeño reparto alrededor para que no se pisen; si ni la ciudad se encuentra, el centro de su provincia.
 * Solo lee las listas de prospectos: no cambia nada de los agentes.
 */
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}

/** «València» / «Gasteiz / Vitoria» → «valencia», sin tildes ni signos. */
function mapa_norm(string $s): string
{
    $s = mb_strtolower(trim($s), 'UTF-8');
    $s = strtr($s, ['á' => 'a', 'à' => 'a', 'ä' => 'a', 'é' => 'e', 'è' => 'e', 'ë' => 'e', 'í' => 'i', 'ì' => 'i', 'ï' => 'i', 'ó' => 'o', 'ò' => 'o', 'ö' => 'o',
                    'ú' => 'u', 'ù' => 'u', 'ü' => 'u', 'ñ' => 'n', 'ç' => 'c', '·' => '', "'" => '', '’' => '']);
    return trim(preg_replace('/[^a-z0-9]+/', ' ', $s));
}

/** Índice de municipios: [provincia_norm => ['centro' => [lat, lon], 'ciudades' => [nombre_norm => [lat, lon]]]]. */
function mapa_municipios(): array
{
    static $idx = null;
    if ($idx !== null) {
        return $idx;
    }
    $idx = [];
    $f = dirname(__DIR__) . '/api/municipios_es.json';
    $d = is_file($f) ? json_decode((string)file_get_contents($f), true) : null;
    foreach (($d['provincias'] ?? []) as $prov => $lista) {
        $p = mapa_norm($prov);
        $sl = $sn = $peso = 0;
        $ciu = [];
        foreach ($lista as [$nombre, $lat, $lon, $pob]) {
            foreach (array_map('trim', explode('/', $nombre)) as $alias) {
                $ciu[mapa_norm($alias)] = [(float)$lat, (float)$lon];
            }
            $ciu[mapa_norm($nombre)] = [(float)$lat, (float)$lon];
            $w = max(1, (int)$pob);
            $sl += $lat * $w;
            $sn += $lon * $w;
            $peso += $w;
        }
        // el «centro» de la provincia es su ciudad más poblada (la capital casi siempre), no la media
        $idx[$p] = ['centro' => $lista ? [(float)$lista[0][1], (float)$lista[0][2]] : [40.4, -3.7], 'ciudades' => $ciu];
    }
    // nombres con los que llegan algunas provincias en los lotes
    foreach (['alacant' => 'alicante', 'valencia' => 'valencia', 'castello' => 'castellon', 'baleares' => 'illes balears', 'islas baleares' => 'illes balears',
              'vizcaya' => 'bizkaia', 'guipuzcoa' => 'gipuzkoa', 'alava' => 'alava', 'la coruna' => 'a coruna', 'orense' => 'ourense', 'gerona' => 'girona', 'lerida' => 'lleida'] as $a => $b) {
        if (!isset($idx[$a]) && isset($idx[$b])) {
            $idx[$a] = $idx[$b];
        }
    }
    return $idx;
}

/** Caché de ciudades que no están en GeoNames (las busca Nominatim y se guardan para siempre). */
function mapa_geo_db(PDO $db): PDO
{
    $db->exec('CREATE TABLE IF NOT EXISTS geo_ciudades (clave TEXT PRIMARY KEY, lat REAL, lon REAL, fuente TEXT NOT NULL DEFAULT "", ts TEXT NOT NULL DEFAULT "")');
    return $db;
}

/** Busca una ciudad en OpenStreetMap (gratis, máximo 1 petición por segundo).
 *  [lat, lon] si la encuentra, [] si no existe, null si OpenStreetMap no ha contestado bien (se reintenta otro día). */
function mapa_nominatim(string $ciudad, string $prov): ?array
{
    $ciudad = trim(preg_replace('/\s*\(([^)]*)\)\s*/', ' ', $ciudad));   // «Palmas De Gran Canaria (Las)» → «Palmas De Gran Canaria»
    $ctx = stream_context_create(['http' => ['timeout' => 5, 'ignore_errors' => true, 'header' => "User-Agent: PEBAI-panel/1.0 (pebaisystems.es)

Accept-Language: es

"]]);
    $intentos = [['city' => $ciudad, 'country' => 'España'] + ($prov !== '' ? ['county' => $prov] : []), ['q' => $ciudad . ($prov !== '' ? ', ' . $prov : '') . ', España']];
    foreach ($intentos as $n => $params) {
        if ($n) {
            usleep(1100000);
        }
        $r = @file_get_contents('https://nominatim.openstreetmap.org/search?' . http_build_query($params + ['format' => 'json', 'limit' => 1]), false, $ctx);
        $codigo = isset($http_response_header[0]) && preg_match('#^HTTP/\S+\s+(\d{3})#', $http_response_header[0], $m) ? (int)$m[1] : 0;
        if ($r === false || $codigo !== 200) {
            return null;
        }
        $j = json_decode($r, true);
        if ($j) {
            return [(float)$j[0]['lat'], (float)$j[0]['lon']];
        }
    }
    return [];
}

/** Coordenadas de una ciudad: [lat, lon, precisión] con precisión 1 = ciudad, 2 = provincia (aproximada), 0 = sin ubicar. */
function mapa_ubicar(PDO $db, string $ciudad, string $prov, int &$cupoNominatim): array
{
    static $cache = null;
    if ($cache === null) {
        $cache = [];
        foreach ($db->query('SELECT clave, lat, lon FROM geo_ciudades')->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $cache[$r['clave']] = $r['lat'] === null ? null : [(float)$r['lat'], (float)$r['lon']];
        }
    }
    $idx = mapa_municipios();
    $c = mapa_norm($ciudad);
    $p = mapa_norm($prov);
    if ($p !== '' && isset($idx[$p]['ciudades'][$c])) {
        return [...$idx[$p]['ciudades'][$c], 1];
    }
    $clave = $c . '|' . $p;
    if (array_key_exists($clave, $cache)) {
        if ($cache[$clave]) {
            return [...$cache[$clave], 1];
        }
    } elseif ($c !== '' && $cupoNominatim > 0) {
        $cupoNominatim--;
        $g = mapa_nominatim($ciudad, $prov);
        usleep(1100000);
        if ($g === null) {
            $cupoNominatim = 0;   // OpenStreetMap no contesta o nos frena: no se apunta nada y se reintenta en la próxima carga
        } else {
            $db->prepare('INSERT OR REPLACE INTO geo_ciudades (clave, lat, lon, fuente, ts) VALUES (?, ?, ?, ?, ?)')
                ->execute([$clave, $g[0] ?? null, $g[1] ?? null, $g ? 'nominatim' : 'no_encontrada', date('Y-m-d H:i:s')]);
            $cache[$clave] = $g ?: null;
            if ($g) {
                return [...$g, 1];
            }
        }
    }
    // sin provincia conocida: la ciudad tal cual en cualquier provincia
    foreach ($idx as $pp) {
        if (isset($pp['ciudades'][$c])) {
            return [...$pp['ciudades'][$c], 1];
        }
    }
    if ($p !== '' && isset($idx[$p])) {
        return [...$idx[$p]['centro'], 2];
    }
    return [0, 0, 0];
}

/** Reparto estable alrededor del centro (espiral áurea): cada empresa siempre cae en el mismo sitio. */
function mapa_reparto(float $lat, float $lon, int $id, int $prec): array
{
    $radioKm = $prec === 2 ? 9.0 : 1.4;
    $k = ($id * 2654435761) % 1000 / 1000;
    $r = $radioKm * sqrt(0.08 + 0.92 * $k);
    $a = $id * 2.39996323;
    return [round($lat + ($r / 111.0) * cos($a), 5), round($lon + ($r / (111.0 * cos(deg2rad($lat)))) * sin($a), 5)];
}

function mapa_estado_wa(string $e): string
{
    return ['revision' => 'revision', 'pendiente' => 'cola', 'enviando' => 'enviado', 'enviado' => 'enviado', 'respondio' => 'respondio',
            'baja' => 'no', 'sin_whatsapp' => 'error', 'error' => 'error', 'descartado' => 'descartado'][$e] ?? 'cola';
}

function mapa_estado_email(array $p): string
{
    $e = (string)$p['estado'];
    if (!empty($p['respondido_at']) || in_array($e, ['respondido', 'respondio', 'interesado'], true)) {
        return 'respondio';
    }
    if (in_array($e, ['baja', 'no_interesa', 'no'], true)) {
        return 'no';
    }
    if (in_array($e, ['descartado'], true)) {
        return 'descartado';
    }
    if (in_array($e, ['rebotado', 'rebote', 'error'], true)) {
        return 'error';
    }
    if (!empty($p['enviado1_at']) || str_starts_with($e, 'enviado') || $e === 'seguimiento') {
        return 'enviado';
    }
    return $e === 'revision' ? 'revision' : 'cola';
}

function mapa_datos(): array
{
    $db = mapa_geo_db(pebai_db());
    $cupo = 4;   // ciudades nuevas que se buscan en OpenStreetMap por carga (el resto, en la siguiente)
    $puntos = [];
    $sinUbicar = 0;
    // la provincia es lo que va tras «·» en el lote, solo si de verdad es una provincia (hay lotes como «censo CNMC 15/10»)
    $provDe = static function (string $lote): string {
        $p = str_contains($lote, '·') ? trim(substr($lote, strrpos($lote, '·') + 2)) : '';
        return $p !== '' && isset(mapa_municipios()[mapa_norm($p)]) ? $p : '';
    };
    $nicho = static function (string $lote, string $sector): string {
        $n = str_contains($lote, '·') ? trim(substr($lote, 0, strpos($lote, '·'))) : '';
        return $sector !== '' ? $sector : ($n ?: 'Sin nicho');
    };
    $cols = array_column($db->query('PRAGMA table_info(prospectos)')->fetchAll(), 'name');
    $conLat = in_array('lat', $cols, true) && in_array('lon', $cols, true);
    $wa = $db->query('SELECT id, empresa, ciudad, lote, sector, web, estado, tipo, telefono, notas, created_at, enviado_at, respondido_at' . ($conLat ? ', lat, lon' : '') . ' FROM prospectos')->fetchAll(PDO::FETCH_ASSOC);
    foreach ($wa as $p) {
        $prov = $provDe((string)$p['lote']);
        if ($conLat && $p['lat']) {
            [$la, $lo, $prec] = [(float)$p['lat'], (float)$p['lon'], 3];
        } else {
            [$la, $lo, $prec] = mapa_ubicar($db, (string)$p['ciudad'], $prov, $cupo);
            if ($prec) {
                [$la, $lo] = mapa_reparto($la, $lo, (int)$p['id'], $prec);
            }
        }
        if (!$prec) {
            $sinUbicar++;
            continue;
        }
        preg_match('/\bfijo (\d{9})\b/', (string)$p['notas'], $mf);
        $puntos[] = ['i' => (int)$p['id'], 'l' => 'w', 'y' => $la, 'x' => $lo, 'p' => $prec, 'e' => mapa_estado_wa((string)$p['estado']), 'n' => (string)$p['empresa'],
                     'c' => (string)$p['ciudad'], 'v' => $prov, 'h' => $nicho((string)$p['lote'], (string)$p['sector']), 'w' => (string)$p['web'], 't' => (string)$p['tipo'],
                     'm' => (string)$p['telefono'], 'f' => $mf[1] ?? '', 'd' => substr((string)($p['respondido_at'] ?: $p['enviado_at'] ?: $p['created_at']), 0, 16)];
    }
    try {
        $em = $db->query('SELECT * FROM email_prospectos')->fetchAll(PDO::FETCH_ASSOC);
    } catch (Throwable $e) {
        $em = [];
    }
    foreach ($em as $p) {
        $prov = $provDe((string)($p['lote'] ?? ''));
        [$la, $lo, $prec] = mapa_ubicar($db, (string)$p['ciudad'], $prov, $cupo);
        if (!$prec) {
            $sinUbicar++;
            continue;
        }
        [$la, $lo] = mapa_reparto($la, $lo, 500000 + (int)$p['id'], $prec);
        $puntos[] = ['i' => (int)$p['id'], 'l' => 'e', 'y' => $la, 'x' => $lo, 'p' => $prec, 'e' => mapa_estado_email($p), 'n' => (string)$p['empresa'],
                     'c' => (string)$p['ciudad'], 'v' => $prov, 'h' => $nicho((string)($p['lote'] ?? ''), (string)($p['nicho'] ?: $p['sector'])), 'w' => (string)$p['web'], 't' => '',
                     'm' => '', 'f' => '', 'em' => (string)$p['email'], 'd' => substr((string)($p['respondido_at'] ?: $p['enviado1_at'] ?: $p['created_at']), 0, 16)];
    }
    $pendientes = (int)$db->query("SELECT COUNT(*) FROM geo_ciudades WHERE fuente = 'no_encontrada'")->fetchColumn();
    return ['puntos' => $puntos, 'sin_ubicar' => $sinUbicar, 'no_encontradas' => $pendientes, 'busca_mas' => $cupo === 0];
}

if ($auth && isset($_GET['mapa'])) {
    try {
        json_out(['ok' => true, 'ahora' => date('Y-m-d H:i:s')] + mapa_datos());
    } catch (Throwable $e) {
        error_log('mapa panel: ' . $e->getMessage());
        json_out(['ok' => false, 'error' => 'No se ha podido cargar el mapa.'], 500);
    }
}
