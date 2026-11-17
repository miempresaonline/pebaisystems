<?php
/*
 * PEBAI · Panel — Resumen: lo que Daniel mira cada día.
 * Lo incluye panel/index.php después de comprobar la sesión: usa $auth, csrf() y json_out() de allí.
 *   GET ?global=1 → solicitudes y citas, a quién le toca responder a Daniel, el estado de cada agente y la caja del mes.
 * Cada bloque va aislado: si uno falla, el resto se sigue viendo.
 */
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}

function gl_bloque(callable $fn, string $nombre)
{
    try {
        return $fn();
    } catch (Throwable $e) {
        pebai_log('RESUMEN GLOBAL ' . $nombre . ': ' . $e->getMessage());
        return null;
    }
}

if ($auth && isset($_GET['global'])) {
    require_once dirname(__DIR__) . '/api/_conversaciones_lib.php';
    $out = ['ok' => true, 'ahora' => date('Y-m-d H:i:s')];

    // Lo que espera a Daniel en Conversaciones
    $out['salida'] = gl_bloque(static function () {
        $filas = pebai_conv_datos();
        $toca = array_filter($filas, static fn($f) => (bool)$f['te_toca']);
        return [
            'te_toca' => count($toca),
            'te_toca_lista' => array_values(array_map(static fn($f) => ['empresa' => $f['empresa'], 'canal' => $f['canal'], 'resumen' => $f['resumen'], 'k' => $f['k'], 'ts' => $f['ultimo_at'] ?? ''], array_slice($toca, 0, 3))),
            // 17/11: las caras de «y N más» (solo nombre y canal)
            'resto' => array_values(array_map(static fn($f) => ['empresa' => $f['empresa'], 'canal' => $f['canal']], array_slice($toca, 3, 5))),
        ];
    }, 'salida');

    // Agentes: el mismo estado que la oficina, en corto
    $out['agentes'] = gl_bloque(static function () {
        // 'ult' (17/11): hora de su último apunte, para saber qué agentes de GEO siguen parados desde el 5/11
        return array_map(static fn($a) => ['id' => $a['id'], 'dept' => $a['dept'], 'nombre' => $a['nombre'], 'st' => $a['st'], 'motivo' => $a['motivo'], 'hoy' => $a['hoy'], 'cupo' => $a['cupo'], 'unidad' => $a['unidad'], 'ult' => (string)($a['actividad'][0]['ts'] ?? '')],
            function_exists('of_estado') ? of_estado(pebai_db()) : []);
    }, 'agentes');

    // Una cifra por sección del menú (para las tarjetas del resumen)
    $catorce = static function (PDO $db, string $sql, array $a = []): array {
        $dias = [];
        for ($i = 13; $i >= 0; $i--) {
            $dias[date('Y-m-d', strtotime("-$i days"))] = 0;
        }
        $q = $db->prepare($sql);
        $q->execute(array_merge([date('Y-m-d', strtotime('-13 days'))], $a));
        foreach ($q as $r) {
            if (isset($dias[$r['d']])) {
                $dias[$r['d']] = (int)$r['n'];
            }
        }
        return array_values($dias);
    };
    $treinta = static function (PDO $db): array {
        $dias = [];
        for ($i = 29; $i >= 0; $i--) {
            $dias[date('Y-m-d', strtotime("-$i days"))] = 0;
        }
        $q = $db->prepare("SELECT substr(created_at, 1, 10) d, COUNT(*) n FROM leads WHERE tipo <> 'cliente' AND created_at >= ? GROUP BY d");
        $q->execute([date('Y-m-d', strtotime('-29 days'))]);
        foreach ($q as $r) {
            if (isset($dias[$r['d']])) {
                $dias[$r['d']] = (int)$r['n'];
            }
        }
        return array_values($dias);
    };
    $out['secciones'] = [
        'solicitudes' => gl_bloque(static function () use ($catorce, $treinta) {
            $db = pebai_db();
            return ['serie' => $catorce($db, "SELECT substr(created_at, 1, 10) d, COUNT(*) n FROM leads WHERE tipo <> 'cliente' AND created_at >= ? GROUP BY d"),
                    'mes' => (int)$db->query("SELECT COUNT(*) FROM leads WHERE tipo <> 'cliente' AND created_at >= '" . date('Y-m-d', strtotime('-29 days')) . "'")->fetchColumn(),
                    'sin_revisar' => (int)$db->query("SELECT COUNT(*) FROM leads WHERE tipo <> 'cliente' AND estado = 'nuevo'")->fetchColumn(),
                    // 17/11: área de 30 días, los 30 días de antes (para la variación) y clientes
                    'serie30' => $treinta($db),
                    'mes_ant' => (int)$db->query("SELECT COUNT(*) FROM leads WHERE tipo <> 'cliente' AND created_at >= '" . date('Y-m-d', strtotime('-59 days')) . "' AND created_at < '" . date('Y-m-d', strtotime('-29 days')) . "'")->fetchColumn(),
                    'clientes' => (int)$db->query("SELECT COUNT(*) FROM leads WHERE estado = 'cliente'")->fetchColumn()];
        }, 'sec_solicitudes'),
        'citas' => gl_bloque(static function () {
            $q = pebai_db()->prepare("SELECT inicio FROM citas WHERE estado = 'reservada' AND inicio >= ? ORDER BY inicio");
            $q->execute([gmdate('Y-m-d\TH:i:s')]);
            $ini = $q->fetchAll(PDO::FETCH_COLUMN);
            return ['lista' => array_slice($ini, 0, 40), 'proximas' => count($ini), 'siguiente' => $ini[0] ?? '', 'semana' => count(array_filter($ini, static fn($i) => strtotime($i) < time() + 7 * 86400))];
        }, 'sec_citas'),
    ];

    // Caja del mes
    $out['caja'] = gl_bloque(static function () {
        require_once dirname(__DIR__) . '/api/_caja_lib.php';
        $q = pebai_caja_db()->prepare("SELECT tipo, SUM(importe) s FROM caja_movimientos WHERE fecha >= ? GROUP BY tipo");
        $q->execute([date('Y-m-01')]);
        $t = ['ingreso' => 0, 'gasto' => 0];
        foreach ($q as $r) {
            $t[$r['tipo']] = (int)$r['s'];
        }
        // 17/11: resultado de los 6 últimos meses (minibarras); el último es el actual
        $desde = date('Y-m-01', strtotime(date('Y-m-01') . ' -5 months'));
        $q = pebai_caja_db()->prepare("SELECT substr(fecha, 1, 7) m, tipo, SUM(importe) s FROM caja_movimientos WHERE fecha >= ? GROUP BY m, tipo");
        $q->execute([$desde]);
        $meses = [];
        for ($i = 5; $i >= 0; $i--) {
            $meses[date('Y-m', strtotime(date('Y-m-01') . " -$i months"))] = 0;
        }
        foreach ($q as $r) {
            if (isset($meses[$r['m']])) {
                $meses[$r['m']] += ($r['tipo'] === 'ingreso' ? 1 : -1) * (int)$r['s'];
            }
        }
        return ['ingresos' => $t['ingreso'], 'gastos' => $t['gasto'], 'mes' => (int)date('n'),
                'meses' => array_map(static fn($m, $v) => ['m' => (int)substr($m, 5, 2), 'v' => $v], array_keys($meses), array_values($meses))];
    }, 'caja');

    json_out($out);
}
