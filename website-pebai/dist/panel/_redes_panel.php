<?php
/*
 * PEBAI · Panel — Contenido › Redes: análisis de los reels por mes (TikTok, Instagram, YouTube Shorts y Facebook).
 * Lo incluye panel/index.php después de comprobar la sesión: usa $auth y json_out() de allí.
 *   GET ?redes=1          → los periodos con sus vídeos y métricas + las solicitudes que han llegado desde redes.
 *   GET ?redes=1&fresh=1  → igual, pero pidiendo antes los datos nuevos a Metricool (botón «Actualizar»).
 * Se actualiza solo: lee la API de Metricool (marca PEBAI Systems) y guarda una copia en private/redes_cache.json
 * que se renueva cada REDES_TTL segundos. Un vídeo nuevo aparece en cuanto Metricool lo tiene.
 * El mismo vídeo publicado en las cuatro redes se agrupa en una fila por fecha, duración y texto.
 * Credenciales: private/metricool.json ({"token","user_id","blog_id"}) o 'metricool' en private/config.php.
 * LinkedIn no entra en este análisis.
 * YouTube, además, se lee al momento del canal público (feed RSS, sin clave): Metricool tarda en traer los Shorts nuevos y
 * a veces da la hora de subida en vez de la de publicación. Del feed salen las vistas al día, la hora real y los vídeos que
 * Metricool aún no tiene. TikTok, Instagram y Facebook solo los da Metricool (pueden ir hasta 24-48 h por detrás).
 */
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}

const REDES_TTL = 1200;
// Cada periodo agrupa los vídeos publicados entre esas fechas (ambas incluidas). 'hasta' => null: hasta hoy.
const REDES_PERIODOS = [
    ['id' => '2026-10', 'nombre' => 'Octubre', 'desde' => '2026-10-13', 'hasta' => '2026-11-05'],
    ['id' => '2026-11', 'nombre' => 'Noviembre', 'desde' => '2026-11-06', 'hasta' => null],
];
const REDES_PALABRAS = ['CONSULTORÍA', 'CONSULTORIA', 'RESPUESTA', 'GEO', 'FORMACIÓN', 'FORMACION'];
const REDES_YT_CANAL = 'UCJ5ecot00P--vMBuv09dKIQ';  // canal público de PEBAI Systems en YouTube

/** Últimos vídeos del canal desde su feed público: id => [titulo, ts, vistas, short]. Vacío si YouTube no responde. */
function redes_yt_feed(): array
{
    $ch = curl_init('https://www.youtube.com/feeds/videos.xml?channel_id=' . REDES_YT_CANAL);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15, CURLOPT_FOLLOWLOCATION => true]);
    $xml = (string)curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $out = [];
    if ($code !== 200 || !preg_match_all('#<entry>(.*?)</entry>#s', $xml, $es)) {
        return $out;
    }
    foreach ($es[1] as $e) {
        if (!preg_match('#<yt:videoId>([^<]+)#', $e, $id) || !preg_match('#<published>([^<]+)#', $e, $pub)) {
            continue;
        }
        preg_match('#<title>([^<]*)#', $e, $t);
        preg_match('#views="(\d+)"#', $e, $v);
        $out[$id[1]] = ['titulo' => html_entity_decode($t[1] ?? '', ENT_QUOTES | ENT_XML1, 'UTF-8'), 'ts' => redes_ts($pub[1]), 'v' => (int)($v[1] ?? 0),
                        'short' => strpos($e, '/shorts/' . $id[1]) !== false];
    }
    return $out;
}

function redes_cred(): array
{
    $f = pebai_private_dir() . '/metricool.json';
    $c = is_file($f) ? (json_decode((string)file_get_contents($f), true) ?: []) : [];
    if (empty($c['token'])) {
        $c = pebai_config()['metricool'] ?? [];
    }
    if (empty($c['token']) || empty($c['user_id']) || empty($c['blog_id'])) {
        throw new RuntimeException('Faltan las credenciales de Metricool en el servidor');
    }
    return $c;
}

function redes_api(array $cred, string $ruta, array $q): array
{
    $q += ['userId' => $cred['user_id'], 'blogId' => $cred['blog_id'], 'timezone' => 'Europe/Madrid'];
    $ch = curl_init('https://app.metricool.com/api' . $ruta . '?' . http_build_query($q));
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 25, CURLOPT_HTTPHEADER => ['X-Mc-Auth: ' . $cred['token'], 'Accept: application/json']]);
    $body = curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($body === false || $code !== 200) {
        throw new RuntimeException("Metricool $ruta respondió $code");
    }
    return json_decode((string)$body, true)['data'] ?? [];
}

/* ---------- normalizar cada red a: red, ts (Y-m-d H:i), dur, texto, url y métricas ---------- */
function redes_ts(string $s): string
{
    return date('Y-m-d H:i', strtotime($s));
}

function redes_publicaciones(array $cred, string $desde, string $hasta): array
{
    $q = ['from' => $desde . 'T00:00:00', 'to' => $hasta . 'T23:59:59'];
    $out = [];
    foreach (redes_api($cred, '/v2/analytics/posts/tiktok', $q) as $p) {
        $out[] = ['red' => 'tt', 'ts' => redes_ts($p['createTime']), 'dur' => (float)($p['duration'] ?? 0), 'texto' => (string)($p['videoDescription'] ?? $p['title'] ?? ''), 'url' => $p['shareUrl'] ?? '',
                  'm' => ['v' => (int)$p['viewCount'], 'l' => (int)$p['likeCount'], 'c' => (int)$p['commentCount'], 's' => (int)$p['shareCount']]];
    }
    foreach (redes_api($cred, '/v2/analytics/reels/instagram', $q) as $p) {
        $out[] = ['red' => 'ig', 'ts' => redes_ts($p['publishedAt']['dateTime']), 'dur' => (float)($p['durationSeconds'] ?? 0), 'texto' => (string)($p['content'] ?? ''), 'url' => $p['url'] ?? '',
                  'm' => ['v' => (int)$p['views'], 'r' => (int)$p['reach'], 'l' => (int)$p['likes'], 'c' => (int)$p['comments'], 'g' => (int)$p['saved'], 's' => (int)$p['shares'],
                          't' => round((float)$p['averageWatchTime'], 1), 'vr' => isset($p['reelsSkipRate']) ? round(100 - (float)$p['reelsSkipRate'], 1) : null]];
    }
    $feed = [];
    try {
        $feed = redes_yt_feed();
    } catch (Throwable $e) {
        pebai_log('REDES feed YouTube: ' . $e->getMessage());
    }
    $enMetricool = [];
    foreach (redes_api($cred, '/v2/analytics/posts/youtube', $q) as $p) {
        $f = $feed[$p['videoId'] ?? ''] ?? null;
        $enMetricool[$p['videoId'] ?? ''] = true;
        if ($f) {
            // Del canal: la hora en que se publicó de verdad y las vistas de ahora mismo (Metricool va con retraso)
            $p['publishedAt']['dateTime'] = $f['ts'];
            $p['views'] = max((int)$p['views'], $f['v']);
            $p['videoType'] = $f['short'] ? 'SHORT' : ($p['videoType'] ?? '');
        }
        $tipo = (string)($p['videoType'] ?? '');
        if (($tipo !== '' && $tipo !== 'SHORT') || (float)($p['durationSeconds'] ?? 0) > 180) {
            continue; // los vídeos largos de YouTube no son reels
        }
        $out[] = ['red' => 'yt', 'short' => $tipo === 'SHORT', 'ts' => redes_ts($p['publishedAt']['dateTime']), 'dur' => (float)($p['durationSeconds'] ?? 0), 'texto' => (string)($p['title'] ?? ''), 'url' => $p['watchUrl'] ?? '',
                  'm' => ['v' => (int)$p['views'], 't' => round((float)$p['averageViewDuration'], 1), 'l' => (int)$p['likes'], 'c' => (int)$p['comments'], 's' => (int)$p['shares']]];
    }
    // Shorts que Metricool aún no ha traído: entran con lo que da el canal (vistas, título y hora)
    foreach ($feed as $id => $f) {
        if (isset($enMetricool[$id]) || !$f['short'] || substr($f['ts'], 0, 10) < $desde || substr($f['ts'], 0, 10) > $hasta) {
            continue;
        }
        $out[] = ['red' => 'yt', 'short' => true, 'ts' => $f['ts'], 'dur' => 0.0, 'texto' => $f['titulo'], 'url' => 'https://www.youtube.com/shorts/' . $id,
                  'm' => ['v' => $f['v'], 't' => 0, 'l' => 0, 'c' => 0, 's' => 0]];
    }
    foreach (redes_api($cred, '/v2/analytics/reels/facebook', $q) as $p) {
        $out[] = ['red' => 'fb', 'ts' => redes_ts($p['created']['dateTime']), 'dur' => (float)($p['length'] ?? 0), 'texto' => (string)($p['description'] ?? ''), 'url' => $p['reelUrl'] ?? '',
                  'm' => ['v' => (int)$p['blueReelsPlayCount'], 'l' => (int)$p['postVideoReactions'], 't' => round((float)$p['postVideoAvgTimeWatchedSeconds'], 1)]];
    }
    return $out;
}

function redes_palabras_txt(string $t): array
{
    // Raíz de 4 letras de cada palabra larga: «responder» y «respuesta», «cliente» y «clientes» cuentan igual
    $t = mb_strtolower(preg_replace('/#\S+|https?:\/\/\S+|\bcomenta\b.*$/isu', ' ', $t));
    preg_match_all('/[\p{L}\p{N}]{4,}/u', $t, $m);
    return array_values(array_unique(array_map(static fn($w) => mb_substr($w, 0, 4), $m[0])));
}

/* Coste de meter una publicación en un grupo (menos = más parecido); null si no puede ser el mismo vídeo. */
function redes_coste(array $p, array $g): ?float
{
    if (isset($g['redes'][$p['red']])) {
        return null;
    }
    $dh = abs(strtotime($p['ts']) - strtotime($g['ts'])) / 3600;
    // Instagram y YouTube no siempre dan la duración (0): entonces deciden la hora y el texto
    $dd = ($p['dur'] && $g['dur']) ? abs($p['dur'] - $g['dur']) : 1.5;
    if ($dh > 36 || $dd > 2) {
        return null;
    }
    $wp = $p['palabras'];
    $wg = $g['palabras'];
    $sim = ($wp && $wg) ? count(array_intersect($wp, $wg)) / max(1, min(count($wp), count($wg))) : 0;
    return $dd * 1.5 + min($dh, 24) * .4 + (1 - $sim) * 4;
}

/* Agrupa en una fila el mismo vídeo subido a varias redes. Red a red (TikTok primero), cada publicación va al grupo
   más parecido; se reparte de la pareja más clara a la más dudosa para que una publicación no le quite el sitio a otra. */
function redes_agrupar(array $pubs): array
{
    $grupos = [];
    foreach (['tt', 'ig', 'fb', 'yt'] as $red) {
        $estas = array_values(array_filter($pubs, static fn($p) => $p['red'] === $red));
        foreach ($estas as &$p) {
            $p['palabras'] = redes_palabras_txt($p['texto']);
        }
        unset($p);
        $pares = [];
        foreach ($estas as $i => $p) {
            foreach ($grupos as $j => $g) {
                $c = redes_coste($p, $g);
                if ($c !== null && $c < 12) {
                    $pares[] = [$c, $i, $j];
                }
            }
        }
        usort($pares, static fn($a, $b) => $a[0] <=> $b[0]);
        $puesta = [];
        $lleno = [];
        foreach ($pares as [$c, $i, $j]) {
            if (isset($puesta[$i]) || isset($lleno[$j])) {
                continue;
            }
            $puesta[$i] = $lleno[$j] = true;
            $p = $estas[$i];
            $grupos[$j]['redes'][$red] = $p;
            $grupos[$j]['palabras'] = array_values(array_unique(array_merge($grupos[$j]['palabras'], $p['palabras'])));
            $grupos[$j]['dur'] = $grupos[$j]['dur'] ?: $p['dur'];
            $grupos[$j]['ts'] = min($grupos[$j]['ts'], $p['ts']);
        }
        foreach ($estas as $i => $p) {
            if (!isset($puesta[$i])) {
                $grupos[] = ['ts' => $p['ts'], 'dur' => $p['dur'], 'palabras' => $p['palabras'], 'redes' => [$red => $p]];
            }
        }
    }
    // Solo en YouTube y sin marca de Short: es un vídeo largo antiguo (Metricool no daba el tipo), no un reel
    $grupos = array_filter($grupos, static fn($g) => count($g['redes']) > 1 || empty($g['redes']['yt']) || !empty($g['redes']['yt']['short']));
    usort($grupos, static fn($a, $b) => strcmp($a['ts'], $b['ts']));
    return array_map('redes_video', $grupos);
}

/* Título legible: el de YouTube si lo hay (es un título de verdad), si no la primera frase del texto, sin hashtags y en minúsculas normales. */
const REDES_NOMBRES = ['IA', 'GEO', 'CRM', 'ERP', 'WhatsApp', 'ChatGPT', 'Google', 'Gemini', 'Perplexity', 'Claude', 'PEBAI', 'Excel'];

function redes_titulo(array $redes): string
{
    foreach (['yt', 'ig', 'tt', 'fb'] as $k) {
        if (empty($redes[$k]['texto'])) {
            continue;
        }
        $t = preg_replace('/#\S+|https?:\/\/\S+/u', '', $redes[$k]['texto']);
        $t = trim(preg_split('/\s*(\||\n|Comenta\b|(?<=[.!?])\s)/u', $t)[0] ?? '');
        $t = trim(preg_replace('/\s+/u', ' ', $t), ' .');
        if (mb_strlen($t) < 8) {
            continue;
        }
        // «Deja de MALGASTAR dinero en Nominas» → «Deja de malgastar dinero en nominas» (respeta IA, WhatsApp…)
        $t = preg_replace_callback('/\p{L}+/u', static function ($m) {
            foreach (REDES_NOMBRES as $n) {
                if (mb_strtolower($m[0]) === mb_strtolower($n)) {
                    return $n;
                }
            }
            return mb_strtolower($m[0]);
        }, $t);
        $t = preg_replace_callback('/\p{L}/u', static fn($m) => mb_strtoupper($m[0]), $t, 1);
        return mb_strlen($t) > 70 ? rtrim(mb_substr($t, 0, 68)) . '…' : $t;
    }
    return 'Vídeo';
}

function redes_video(array $g): array
{
    $r = $g['redes'];
    $todo = implode(' ', array_map(static fn($p) => $p['texto'], $r));
    $palabra = '';
    if (preg_match('/Comenta\s+(?:la\s+palabra\s+)?["“”\'\']*\s*(' . implode('|', REDES_PALABRAS) . ')/iu', $todo, $m) || preg_match('/palabra=(consultoria|respuesta|geo|formacion)/i', $todo, $m)) {
        $palabra = strtr(mb_strtoupper($m[1]), ['CONSULTORIA' => 'CONSULTORÍA', 'FORMACION' => 'FORMACIÓN']);
    }
    // Estilo «gancho»: alguna palabra entera en mayúsculas en el texto del reel (sin contar la palabra clave).
    // YouTube no cuenta: allí los títulos se escriben aparte.
    $reel = implode(' ', array_map(static fn($p) => $p['texto'], array_diff_key($r, ['yt' => 1])));
    $sinClave = preg_replace('/\b(' . implode('|', REDES_PALABRAS) . '|GEO|IA)\b/u', '', $reel ?: $todo);
    $gancho = (bool)preg_match('/\b\p{Lu}{4,}\b/u', $sinClave);
    $v = ['f' => $g['ts'], 'titulo' => redes_titulo($r), 'estilo' => $gancho ? 'gancho' : 'sobrio', 'palabra' => $palabra,
          'dur' => (int)round($r['tt']['dur'] ?? $r['ig']['dur'] ?? $r['fb']['dur'] ?? $r['yt']['dur'] ?? 0)];
    foreach (['tt', 'ig', 'yt', 'fb'] as $k) {
        $v[$k] = isset($r[$k]) ? $r[$k]['m'] + ['url' => $r[$k]['url']] : null;
    }
    return $v;
}

/* Seguidores al empezar y al acabar cada periodo */
function redes_seguidores(array $cred, string $desde, string $hasta): array
{
    $out = [];
    foreach (['ig' => ['instagram', 'followers'], 'tt' => ['tiktok', 'followers_count'], 'yt' => ['youtube', 'totalSubscribers'], 'fb' => ['facebook', 'pageFollows']] as $k => [$net, $met]) {
        try {
            $d = redes_api($cred, '/v2/analytics/timelines', ['from' => $desde . 'T00:00:00', 'to' => $hasta . 'T23:59:59', 'metric' => $met, 'network' => $net, 'subject' => 'account']);
            $vals = [];
            foreach ($d[0]['values'] ?? [] as $x) {
                if ($x['value'] !== null) {
                    $vals[substr($x['dateTime'], 0, 10)] = (int)$x['value'];
                }
            }
            ksort($vals);
            if ($vals) {
                $out[$k] = $vals;
            }
        } catch (Throwable $e) {
            pebai_log('REDES seguidores ' . $net . ': ' . $e->getMessage());
        }
    }
    return $out;
}

function redes_sync(): array
{
    $cred = redes_cred();
    $desde = REDES_PERIODOS[0]['desde'];
    $hoy = date('Y-m-d');
    $videos = redes_agrupar(redes_publicaciones($cred, $desde, $hoy));
    $seg = redes_seguidores($cred, date('Y-m-d', strtotime($desde . ' -1 day')), $hoy);
    $periodos = [];
    foreach (REDES_PERIODOS as $p) {
        $hasta = $p['hasta'] ?? $hoy;
        if ($p['desde'] > $hoy) {
            $periodos[] = $p + ['videos' => [], 'seguidores' => [], 'futuro' => true];
            continue;
        }
        $vs = array_values(array_filter($videos, static fn($v) => substr($v['f'], 0, 10) >= $p['desde'] && substr($v['f'], 0, 10) <= $hasta));
        $sp = [];
        foreach ($seg as $k => $vals) {
            $antes = array_filter($vals, static fn($d) => $d <= $p['desde'], ARRAY_FILTER_USE_KEY);
            $dentro = array_filter($vals, static fn($d) => $d >= $p['desde'] && $d <= $hasta, ARRAY_FILTER_USE_KEY);
            if (!$dentro) {
                continue;
            }
            $sp[$k] = [$antes ? end($antes) : reset($dentro), end($dentro)];
        }
        $periodos[] = $p + ['hasta_real' => min($hasta, $hoy), 'videos' => $vs, 'seguidores' => $sp];
    }
    return ['actualizado' => date('Y-m-d H:i:s'), 'periodos' => $periodos];
}

/** Solicitudes del formulario que llegaron desde redes en las fechas del periodo (solo recuentos, nada personal). */
function redes_solicitudes(string $desde, string $hasta): array
{
    $q = pebai_db()->prepare("SELECT fuente, palabra, conocio, canal_dueno FROM leads WHERE tipo <> 'cliente' AND created_at >= ? AND created_at <= ?");
    $q->execute([$desde . ' 00:00:00', $hasta . ' 23:59:59']);
    $total = 0;
    $redes = 0;
    $por = ['instagram' => 0, 'tiktok' => 0, 'youtube' => 0, 'facebook' => 0, 'otra' => 0];
    $palabras = [];
    foreach ($q->fetchAll(PDO::FETCH_ASSOC) as $l) {
        $total++;
        $f = strtolower((string)$l['fuente']);
        $esRed = ($l['canal_dueno'] ?? '') === 'redes' || preg_match('/instagram|tiktok|youtube|facebook|^(ig|tt|yt|fb)$/', $f) || ($l['conocio'] ?? '') === 'redes';
        if (!$esRed || strpos($f, 'linkedin') !== false) {
            continue;
        }
        $redes++;
        $red = 'otra';
        foreach (['instagram' => 'ig', 'tiktok' => 'tt', 'youtube' => 'yt', 'facebook' => 'fb'] as $k => $corto) {
            if (strpos($f, $k) !== false || $f === $corto) {
                $red = $k;
                break;
            }
        }
        $por[$red]++;
        $p = mb_strtoupper(trim((string)$l['palabra']));
        if ($p !== '') {
            $palabras[$p] = ($palabras[$p] ?? 0) + 1;
        }
    }
    return ['total' => $total, 'redes' => $redes, 'por_red' => $por, 'palabras' => $palabras];
}

if ($auth && isset($_GET['redes'])) {
    $cache = pebai_private_dir() . '/redes_cache.json';
    $datos = is_file($cache) ? json_decode((string)file_get_contents($cache), true) : null;
    $edad = $datos ? time() - strtotime($datos['actualizado']) : PHP_INT_MAX;
    $aviso = '';
    // Renueva si la copia es vieja; con «Actualizar», si tiene más de un minuto (para no machacar la API)
    if ($edad > REDES_TTL || (isset($_GET['fresh']) && $edad > 60)) {
        try {
            $datos = redes_sync();
            @file_put_contents($cache, json_encode($datos, JSON_UNESCAPED_UNICODE), LOCK_EX);
        } catch (Throwable $e) {
            pebai_log('REDES Metricool: ' . $e->getMessage());
            $aviso = 'No se ha podido leer Metricool ahora mismo' . ($datos ? '; enseño la última copia.' : '.');
        }
    }
    if (!$datos) {
        json_out(['ok' => false, 'error' => $aviso ?: 'Sin datos de redes'], 502);
    }
    foreach ($datos['periodos'] as &$p) {
        try {
            $p['solicitudes'] = redes_solicitudes($p['desde'], $p['hasta_real'] ?? $p['desde']);
        } catch (Throwable $e) {
            $p['solicitudes'] = null;
        }
    }
    unset($p);
    json_out(['ok' => true, 'aviso' => $aviso] + $datos);
}
