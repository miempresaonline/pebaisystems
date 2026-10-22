<?php
/*
 * PEBAI · Panel — Resumen global: toda la app de un vistazo (captación de salida, embudo de entrada, agentes y caja).
 * Lo incluye panel/index.php después de comprobar la sesión: usa $auth, csrf() y json_out() de allí.
 *   GET ?global=1 → cifras de hoy, el camino completo de una empresa (cola → escrita → contestó → interesada → cita),
 *                   las solicitudes del formulario, el estado de cada agente y la caja del mes.
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
    $hoy = date('Y-m-d 00:00:00');
    $out = ['ok' => true, 'ahora' => date('Y-m-d H:i:s')];

    // Hoy: lo que han hecho los agentes y lo que ha entrado
    $out['hoy'] = gl_bloque(static function () use ($hoy) {
        $adb = pebai_agentes_db();
        $n = static function (string $sql, array $a = []) use ($adb): int { $q = $adb->prepare($sql); $q->execute($a); return (int)$q->fetchColumn(); };
        require_once dirname(__DIR__) . '/api/_email_lib.php';
        $emCfg = pebai_email_cfg();
        $q = pebai_db()->prepare("SELECT COUNT(*) FROM leads WHERE tipo <> 'cliente' AND created_at >= ?");
        $q->execute([$hoy]);
        return [
            'wa' => pebai_wa_enviados_hoy(), 'wa_cupo' => pebai_wa_config()['limite_dia'],
            'email' => pebai_email_enviados_hoy(), 'email_cupo' => pebai_email_limite($emCfg),
            'respuestas' => $n("SELECT COUNT(DISTINCT agente || prospecto_id) FROM agente_mensajes WHERE sentido = 'entra' AND prospecto_id > 0 AND ts >= ?", [$hoy]),
            'solicitudes' => (int)$q->fetchColumn(),
        ];
    }, 'hoy');

    // Captación de salida: el camino de cada empresa, de la cola a la cita
    $out['salida'] = gl_bloque(static function () {
        $adb = pebai_agentes_db();
        $filas = pebai_conv_datos();
        $cuenta = static fn(callable $f) => count(array_filter($filas, $f));
        $contestaron = $cuenta(static fn($f) => $f['respuestas'] > 0 && $f['estado'] !== 'auto');
        return [
            'cola_wa' => (int)$adb->query("SELECT COUNT(*) FROM prospectos WHERE estado = 'pendiente' AND nicho = 'solar' AND telefono NOT IN (SELECT telefono FROM bajas)")->fetchColumn(),
            'listas_wa' => (int)$adb->query("SELECT COUNT(*) FROM prospectos WHERE estado = 'pendiente' AND nicho = 'solar' AND mensaje <> ''")->fetchColumn(),
            'cola_email' => (int)$adb->query("SELECT COUNT(*) FROM email_prospectos WHERE estado = 'pendiente'")->fetchColumn(),
            'escritas' => count($filas),
            'escritas_wa' => $cuenta(static fn($f) => $f['canal'] === 'whatsapp'),
            'contestaron' => $contestaron,
            'contestadores' => $cuenta(static fn($f) => $f['estado'] === 'auto'),
            'interesados' => $cuenta(static fn($f) => in_array($f['estado'], ['interesado', 'cita'], true)),
            'citas' => $cuenta(static fn($f) => $f['estado'] === 'cita'),
            'no' => $cuenta(static fn($f) => $f['estado'] === 'no_interesado'),
            'te_toca' => $cuenta(static fn($f) => (bool)$f['te_toca']),
            'listas_para_aprobar' => $cuenta(static fn($f) => $f['te_toca'] && $f['borrador'] !== ''),
            'estados' => array_count_values(array_map(static fn($f) => $f['estado'] === 'pendiente_ia' ? 'pregunta' : $f['estado'], $filas)),
            'te_toca_lista' => array_values(array_map(static fn($f) => ['empresa' => $f['empresa'], 'canal' => $f['canal'], 'resumen' => $f['resumen'], 'k' => $f['k'], 'lista' => $f['borrador'] !== ''],
                array_slice(array_filter($filas, static fn($f) => (bool)$f['te_toca']), 0, 6))),
        ];
    }, 'salida');

    // Tendencia de 14 días: primeros mensajes enviados y empresas que contestan por primera vez (sin contestadores)
    $out['serie'] = gl_bloque(static function () {
        $adb = pebai_agentes_db();
        $desde = date('Y-m-d', strtotime('-13 days'));
        $dias = [];
        for ($i = 13; $i >= 0; $i--) {
            $dias[date('Y-m-d', strtotime("-$i days"))] = ['env' => 0, 'resp' => 0];
        }
        $q = $adb->prepare("SELECT substr(ts, 1, 10) d, COUNT(*) n FROM agente_mensajes WHERE sentido = 'sale' AND prospecto_id > 0 AND plantilla NOT IN ('manual', 'respuesta', 'cortesia') AND ts >= ? GROUP BY d");
        $q->execute([$desde]);
        foreach ($q as $r) {
            if (isset($dias[$r['d']])) {
                $dias[$r['d']]['env'] = (int)$r['n'];
            }
        }
        $q = $adb->query("SELECT substr(MIN(m.ts), 1, 10) d FROM agente_mensajes m LEFT JOIN conversaciones c ON c.canal = m.agente AND c.prospecto_id = m.prospecto_id
                          WHERE m.sentido = 'entra' AND m.prospecto_id > 0 AND COALESCE(c.clasificacion, '') <> 'auto' GROUP BY m.agente, m.prospecto_id");
        foreach ($q as $r) {
            if (isset($dias[$r['d']])) {
                $dias[$r['d']]['resp']++;
            }
        }
        return array_map(static fn($d, $v) => ['d' => $d] + $v, array_keys($dias), $dias);
    }, 'serie');

    // Embudo de entrada: solicitudes del formulario (las de trato directo, aparte)
    $out['entrada'] = gl_bloque(static function () {
        $db = pebai_db();
        $c = static fn(string $w) => (int)$db->query("SELECT COUNT(*) FROM leads WHERE tipo <> 'cliente' AND $w")->fetchColumn();
        $prox = (int)$db->query("SELECT COUNT(*) FROM citas WHERE estado = 'reservada' AND inicio >= '" . gmdate('Y-m-d\TH:i:s') . "'")->fetchColumn();
        return ['solicitudes' => $c('1'), 'sin_revisar' => $c("estado = 'nuevo'"), 'citas' => $c("cita_inicio <> ''"), 'sesiones' => $c("estado IN ('sesion','cliente')"),
                'clientes' => $c("estado = 'cliente'"), 'citas_proximas' => $prox];
    }, 'entrada');

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
        'prospectos' => gl_bloque(static function () {
            $adb = pebai_agentes_db();
            $n = static fn(string $sql) => (int)$adb->query($sql)->fetchColumn();
            return ['cola' => $n("SELECT COUNT(*) FROM prospectos WHERE estado = 'pendiente'") + $n("SELECT COUNT(*) FROM email_prospectos WHERE estado = 'pendiente'"),
                    'escritas' => $n("SELECT COUNT(*) FROM prospectos WHERE enviado_at <> ''") + $n("SELECT COUNT(*) FROM email_prospectos WHERE enviado1_at <> ''"),
                    'revisar' => $n("SELECT COUNT(*) FROM prospectos WHERE estado = 'revision'")];
        }, 'sec_prospectos'),
        'mapa' => gl_bloque(static function () {
            if (!function_exists('of_scraper_seguimiento')) {
                return null;
            }
            $s = of_scraper_seguimiento();
            return ['cobertura' => (int)$s['cobertura'], 'prov_completas' => (int)$s['prov_completas'], 'ahora' => (string)($s['ahora'] ?? '')];
        }, 'sec_mapa'),
        'qr' => gl_bloque(static function () use ($catorce) {
            require_once dirname(__DIR__) . '/api/_qr_lib.php';
            $db = pebai_qr_db();
            return ['serie' => $catorce($db, 'SELECT substr(ts, 1, 10) d, COUNT(*) n FROM qr_escaneos WHERE ts >= ? GROUP BY d'),
                    'mes' => (int)$db->query("SELECT COUNT(*) FROM qr_escaneos WHERE ts >= '" . date('Y-m-d', strtotime('-29 days')) . "'")->fetchColumn()];
        }, 'sec_qr'),
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
