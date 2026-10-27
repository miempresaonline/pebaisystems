<?php
/*
 * PEBAI · Panel — Automático › Gasto IA: lo que gasta cada agente en Claude (de pago, crédito mensual) y Gemini (gratis, reserva).
 * Lo incluye panel/index.php después de comprobar la sesión: usa $auth y json_out() de allí.
 *   GET ?gasto=1 → el mes en curso: total, día a día, por agente, por modelo y las últimas llamadas.
 * Los datos salen de ia_gasto (api/_claude_lib.php), que apunta cada llamada con sus tokens y su coste.
 */
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}

if ($auth && isset($_GET['gasto'])) {
    require_once dirname(__DIR__) . '/api/_claude_lib.php';
    $db = pebai_ia_gasto_db();
    $mes = date('Y-m-01 00:00:00');
    $hoy = date('Y-m-d 00:00:00');
    $suma = static function (string $where, array $p) use ($db): array {
        $q = $db->prepare("SELECT COALESCE(SUM(usd),0) usd, SUM(proveedor='claude' AND ok=1) claude, SUM(proveedor='gemini') gemini, SUM(ok=0) fallos,
                           COALESCE(SUM(entrada),0) ent, COALESCE(SUM(salida),0) sal, COALESCE(SUM(cache_lee),0) cl FROM ia_gasto WHERE $where");
        $q->execute($p);
        $r = $q->fetch(PDO::FETCH_ASSOC);
        return array_map(static fn($v) => is_numeric($v) ? $v + 0 : 0, $r);
    };
    $totMes = $suma('ts >= ?', [$mes]);
    $totHoy = $suma('ts >= ?', [$hoy]);
    // Día a día del mes, por agente (para las barras apiladas)
    $q = $db->prepare("SELECT substr(ts,1,10) dia, agente, SUM(usd) usd, COUNT(*) n FROM ia_gasto WHERE ts >= ? GROUP BY dia, agente ORDER BY dia");
    $q->execute([date('Y-m-d 00:00:00', strtotime('-29 days'))]);
    $diario = $q->fetchAll(PDO::FETCH_ASSOC);
    $q = $db->prepare("SELECT agente, SUM(usd) usd, SUM(proveedor='claude' AND ok=1) claude, SUM(proveedor='gemini') gemini, SUM(entrada) ent, SUM(salida) sal
                       FROM ia_gasto WHERE ts >= ? GROUP BY agente ORDER BY usd DESC");
    $q->execute([$mes]);
    $agentes = $q->fetchAll(PDO::FETCH_ASSOC);
    $q = $db->prepare("SELECT modelo, proveedor, SUM(usd) usd, COUNT(*) n, SUM(entrada) ent, SUM(salida) sal FROM ia_gasto WHERE ts >= ? AND ok = 1 GROUP BY modelo, proveedor ORDER BY usd DESC");
    $q->execute([$mes]);
    $modelos = $q->fetchAll(PDO::FETCH_ASSOC);
    $ultimas = $db->query('SELECT ts, agente, proveedor, modelo, entrada, salida, cache_lee, usd, ok, nota FROM ia_gasto ORDER BY id DESC LIMIT 25')->fetchAll(PDO::FETCH_ASSOC);
    // Lo ahorrado con la caché: lo leído de caché costó un 10 % de su precio normal
    $ahorro = 0.0;
    $q = $db->prepare("SELECT modelo, SUM(cache_lee) cl FROM ia_gasto WHERE ts >= ? AND proveedor = 'claude' GROUP BY modelo");
    $q->execute([$mes]);
    foreach ($q->fetchAll(PDO::FETCH_ASSOC) as $r) {
        $ahorro += (int)$r['cl'] * (PEBAI_CLAUDE_PRECIOS[$r['modelo']][0] ?? 0) * 0.9 / 1e6;
    }
    $diasMes = (int)date('t');
    $diaHoy = (int)date('j') - 1 + (time() - strtotime('today')) / 86400;
    json_out(['ok' => true, 'presupuesto' => PEBAI_CLAUDE_PRESUPUESTO, 'freno' => PEBAI_CLAUDE_FRENO, 'conectado' => pebai_claude_cfg()['key'] !== '',
              'mes' => $totMes, 'hoy' => $totHoy, 'prevision' => $diaHoy > 0.2 ? $totMes['usd'] / $diaHoy * $diasMes : $totMes['usd'],
              'dias_mes' => $diasMes, 'dia' => (int)date('j'), 'ahorro_cache' => $ahorro,
              'diario' => $diario, 'agentes' => $agentes, 'modelos' => $modelos, 'ultimas' => $ultimas, 'precios' => PEBAI_CLAUDE_PRECIOS]);
}
