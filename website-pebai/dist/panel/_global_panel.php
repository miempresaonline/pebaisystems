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
            'te_toca_lista' => array_values(array_map(static fn($f) => ['empresa' => $f['empresa'], 'canal' => $f['canal'], 'resumen' => $f['resumen'], 'k' => $f['k']], array_slice($toca, 0, 3))),
        ];
    }, 'salida');

    // Agentes: el mismo estado que la oficina, en corto
    $out['agentes'] = gl_bloque(static function () {
        return array_map(static fn($a) => ['id' => $a['id'], 'dept' => $a['dept'], 'nombre' => $a['nombre'], 'st' => $a['st'], 'motivo' => $a['motivo'], 'hoy' => $a['hoy'], 'cupo' => $a['cupo'], 'unidad' => $a['unidad']],
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
    $out['secciones'] = [
        'solicitudes' => gl_bloque(static function () use ($catorce) {
            $db = pebai_db();
            return ['serie' => $catorce($db, "SELECT substr(created_at, 1, 10) d, COUNT(*) n FROM leads WHERE tipo <> 'cliente' AND created_at >= ? GROUP BY d"),
                    'mes' => (int)$db->query("SELECT COUNT(*) FROM leads WHERE tipo <> 'cliente' AND created_at >= '" . date('Y-m-d', strtotime('-29 days')) . "'")->fetchColumn(),
                    'sin_revisar' => (int)$db->query("SELECT COUNT(*) FROM leads WHERE tipo <> 'cliente' AND estado = 'nuevo'")->fetchColumn()];
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
        return ['ingresos' => $t['ingreso'], 'gastos' => $t['gasto'], 'mes' => (int)date('n')];
    }, 'caja');

    json_out($out);
}
