<?php
/*
 * PEBAI · Panel — Automático › Gasto IA: lo que gasta cada agente en Claude (de pago, crédito mensual) y Gemini (gratis, reserva).
 * Lo incluye panel/index.php después de comprobar la sesión: usa $auth y json_out() de allí.
 *   GET ?gasto=1[&desde=AAAA-MM-DD&hasta=AAAA-MM-DD] → el periodo (por defecto, el mes en curso): total, día a día, por agente,
 *   por modelo y las últimas llamadas; además, los meses que hay para elegir y si Claude está fallando ahora.
 * Los datos salen de ia_gasto (api/_claude_lib.php), que apunta cada llamada con sus tokens y su coste.
 */
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}

if ($auth && isset($_GET['gasto'])) {
    require_once dirname(__DIR__) . '/api/_claude_lib.php';
    $db = pebai_ia_gasto_db();
    // Periodo pedido (01/11: poder ver el mes pasado o unas fechas concretas); por defecto, este mes
    $f = static fn($k) => preg_match('/^\d{4}-\d{2}-\d{2}$/', (string)($_GET[$k] ?? '')) ? (string)$_GET[$k] : '';
    $desde = $f('desde') ?: date('Y-m-01');
    $hasta = $f('hasta') ?: date('Y-m-d');
    if ($hasta < $desde) {
        [$desde, $hasta] = [$hasta, $desde];
    }
    $mes = $desde . ' 00:00:00';
    $fin = $hasta . ' 23:59:59';
    $hoy = date('Y-m-d 00:00:00');
    $esEsteMes = $desde === date('Y-m-01') && $hasta >= date('Y-m-d');
    $suma = static function (string $where, array $p) use ($db): array {
        $q = $db->prepare("SELECT COALESCE(SUM(usd),0) usd, SUM(proveedor='claude' AND ok=1) claude, SUM(proveedor='gemini') gemini, SUM(ok=0) fallos,
                           COALESCE(SUM(entrada),0) ent, COALESCE(SUM(salida),0) sal, COALESCE(SUM(cache_lee),0) cl FROM ia_gasto WHERE $where");
        $q->execute($p);
        $r = $q->fetch(PDO::FETCH_ASSOC);
        return array_map(static fn($v) => is_numeric($v) ? $v + 0 : 0, $r);
    };
    $totMes = $suma('ts >= ? AND ts <= ?', [$mes, $fin]);
    $totHoy = $suma('ts >= ?', [$hoy]);
    // Día a día del periodo, por agente (para las barras apiladas)
    $q = $db->prepare("SELECT substr(ts,1,10) dia, agente, SUM(usd) usd, COUNT(*) n FROM ia_gasto WHERE ts >= ? AND ts <= ? GROUP BY dia, agente ORDER BY dia");
    $q->execute([$mes, $fin]);
    $diario = $q->fetchAll(PDO::FETCH_ASSOC);
    $q = $db->prepare("SELECT agente, SUM(usd) usd, SUM(proveedor='claude' AND ok=1) claude, SUM(proveedor='gemini') gemini, SUM(entrada) ent, SUM(salida) sal
                       FROM ia_gasto WHERE ts >= ? AND ts <= ? GROUP BY agente ORDER BY usd DESC");
    $q->execute([$mes, $fin]);
    $agentes = $q->fetchAll(PDO::FETCH_ASSOC);
    $q = $db->prepare("SELECT modelo, proveedor, SUM(usd) usd, COUNT(*) n, SUM(entrada) ent, SUM(salida) sal FROM ia_gasto WHERE ts >= ? AND ts <= ? AND ok = 1 GROUP BY modelo, proveedor ORDER BY usd DESC");
    $q->execute([$mes, $fin]);
    $modelos = $q->fetchAll(PDO::FETCH_ASSOC);
    $q = $db->prepare('SELECT ts, agente, proveedor, modelo, entrada, salida, cache_lee, usd, ok, nota FROM ia_gasto WHERE ts >= ? AND ts <= ? ORDER BY id DESC LIMIT 25');
    $q->execute([$mes, $fin]);
    $ultimas = $q->fetchAll(PDO::FETCH_ASSOC);
    // Meses con gasto, para elegir
    $meses = $db->query("SELECT substr(ts,1,7) m, SUM(usd) usd FROM ia_gasto GROUP BY m ORDER BY m DESC LIMIT 12")->fetchAll(PDO::FETCH_ASSOC);
    // ¿Claude falla ahora? (sin clave, o las últimas llamadas de la última hora han fallado todas)
    $q = $db->prepare("SELECT ok, nota FROM ia_gasto WHERE proveedor = 'claude' AND ts >= ? ORDER BY id DESC LIMIT 5");
    $q->execute([date('Y-m-d H:i:s', time() - 3600)]);
    $rec = $q->fetchAll(PDO::FETCH_ASSOC);
    $caido = pebai_claude_cfg()['key'] === '' ? 'Claude no tiene clave: todo va por Gemini.'
        : ($rec && !array_filter(array_column($rec, 'ok')) ? 'Las últimas llamadas a Claude fallan (' . mb_substr((string)$rec[0]['nota'], 0, 80) . '). Mientras, los agentes usan Gemini.' : '');
    // Lo ahorrado con la caché: lo leído de caché costó un 10 % de su precio normal
    $ahorro = 0.0;
    $q = $db->prepare("SELECT modelo, SUM(cache_lee) cl FROM ia_gasto WHERE ts >= ? AND ts <= ? AND proveedor = 'claude' GROUP BY modelo");
    $q->execute([$mes, $fin]);
    foreach ($q->fetchAll(PDO::FETCH_ASSOC) as $r) {
        $ahorro += (int)$r['cl'] * (PEBAI_CLAUDE_PRECIOS[$r['modelo']][0] ?? 0) * 0.9 / 1e6;
    }
    $diasMes = (int)date('t');
    $diaHoy = (int)date('j') - 1 + (time() - strtotime('today')) / 86400;
    json_out(['ok' => true, 'presupuesto' => PEBAI_CLAUDE_PRESUPUESTO, 'freno' => PEBAI_CLAUDE_FRENO, 'caido' => $caido,
              'desde' => $desde, 'hasta' => $hasta, 'este_mes' => $esEsteMes, 'meses' => $meses,
              'mes' => $totMes, 'hoy' => $totHoy, 'prevision' => $esEsteMes && $diaHoy > 0.2 ? $totMes['usd'] / $diaHoy * $diasMes : $totMes['usd'],
              'dias_mes' => $diasMes, 'dia' => (int)date('j'), 'ahorro_cache' => $ahorro,
              'diario' => $diario, 'agentes' => $agentes, 'modelos' => $modelos, 'ultimas' => $ultimas, 'precios' => PEBAI_CLAUDE_PRECIOS]);
}
