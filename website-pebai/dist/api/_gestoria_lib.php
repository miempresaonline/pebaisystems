<?php
/*
 * PEBAI · Gestoría (panel › Empresa › Gestoría). Daniel es autónomo desde el 18/12/2026 y no tiene gestoría:
 * aquí se hacen las facturas, el reparto de cada venta (acuerdo con Adrián), los gastos que se desgravan y la cuenta de lo
 * que toca pagar cada trimestre (IVA, adelanto de IRPF y retenciones). Las cifras son una estimación para preparar las
 * declaraciones, que Daniel presenta en Hacienda con su certificado.
 * Mismos base y carpeta privada que la caja (private/leads.sqlite, fuera de public_html). Importes en céntimos.
 * Los datos fiscales (nombre, NIF, dirección, IBAN) se escriben en el panel y solo viven en esa base privada.
 */
require_once __DIR__ . '/_caja_lib.php';

if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}

/** Reparto del acuerdo v1.0 según quién consiguió el cliente: [Adrián, Daniel, Caja] en %. */
const GESTORIA_CANALES = [
    'daniel' => ['Cliente de Daniel', 20, 65, 15],
    'redes'  => ['Redes y anuncios', 25, 60, 15],
    'adrian' => ['Cliente de Adrián', 35, 50, 15],
];
/** Tipos de gasto: cómo cuentan para el IVA. */
const GESTORIA_TIPOS = [
    'es'       => 'Factura española con IVA',
    'ue'       => 'Empresa de la UE (sin IVA español)',
    'fuera'    => 'Empresa de fuera de la UE (sin IVA español)',
    'sin_iva'  => 'Sin IVA (seguros, tasas, bancos…)',
    'adrian'   => 'Factura de Adrián',
    'comision' => 'Pago a comisionista',
    'cuota'    => 'Cuota de autónomo',
];
const GESTORIA_AJUSTES = ['nombre', 'nif', 'direccion', 'ciudad', 'email', 'telefono', 'iban', 'fecha_alta', 'retencion', 'cuota', 'pie'];

function gestoria_db(): PDO
{
    static $ready = false;
    $db = pebai_caja_db();
    if (!$ready) {
        $db->exec('CREATE TABLE IF NOT EXISTS gestoria_ajustes (clave TEXT PRIMARY KEY, valor TEXT NOT NULL DEFAULT "")');
        $db->exec('CREATE TABLE IF NOT EXISTS gestoria_facturas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            numero TEXT NOT NULL UNIQUE,
            fecha TEXT NOT NULL,
            cliente TEXT NOT NULL,
            cliente_nif TEXT NOT NULL DEFAULT "",
            cliente_dir TEXT NOT NULL DEFAULT "",
            lineas TEXT NOT NULL DEFAULT "[]",
            base INTEGER NOT NULL,
            iva_pct REAL NOT NULL DEFAULT 21,
            iva INTEGER NOT NULL DEFAULT 0,
            irpf_pct REAL NOT NULL DEFAULT 0,
            irpf INTEGER NOT NULL DEFAULT 0,
            total INTEGER NOT NULL,
            estado TEXT NOT NULL DEFAULT "emitida",
            fecha_cobro TEXT NOT NULL DEFAULT "",
            canal TEXT NOT NULL DEFAULT "daniel",
            coste INTEGER NOT NULL DEFAULT 0,
            comisionista TEXT NOT NULL DEFAULT "",
            com_pct REAL NOT NULL DEFAULT 7,
            caja_id INTEGER NOT NULL DEFAULT 0,
            notas TEXT NOT NULL DEFAULT "",
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL DEFAULT ""
        )');
        $db->exec('CREATE INDEX IF NOT EXISTS idx_gfac_fecha ON gestoria_facturas(fecha)');
        $db->exec('CREATE TABLE IF NOT EXISTS gestoria_gastos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha TEXT NOT NULL,
            tipo TEXT NOT NULL DEFAULT "es",
            proveedor TEXT NOT NULL DEFAULT "",
            concepto TEXT NOT NULL DEFAULT "",
            base INTEGER NOT NULL,
            iva_pct REAL NOT NULL DEFAULT 0,
            iva INTEGER NOT NULL DEFAULT 0,
            irpf_pct REAL NOT NULL DEFAULT 0,
            irpf INTEGER NOT NULL DEFAULT 0,
            deducible INTEGER NOT NULL DEFAULT 1,
            persona TEXT NOT NULL DEFAULT "",
            caja_id INTEGER NOT NULL DEFAULT 0,
            notas TEXT NOT NULL DEFAULT "",
            created_at TEXT NOT NULL
        )');
        $db->exec('CREATE INDEX IF NOT EXISTS idx_ggas_fecha ON gestoria_gastos(fecha)');
        $ready = true;
    }
    return $db;
}

function gestoria_ajustes(): array
{
    $a = gestoria_db()->query('SELECT clave, valor FROM gestoria_ajustes')->fetchAll(PDO::FETCH_KEY_PAIR);
    $out = [];
    foreach (GESTORIA_AJUSTES as $k) {
        $out[$k] = (string)($a[$k] ?? '');
    }
    // Valores por defecto: alta el 18/12/2026, retención del 7 % (profesional que empieza) y cuota de tarifa plana
    $out['fecha_alta'] = $out['fecha_alta'] ?: '2026-12-18';
    $out['retencion'] = $out['retencion'] === '' ? '7' : $out['retencion'];
    $out['cuota'] = $out['cuota'] === '' ? '8000' : $out['cuota'];
    return $out;
}

/** NIF/NIE/CIF con forma válida (letra de control solo en DNI y NIE). */
function gestoria_nif_ok(string $n): bool
{
    $n = strtoupper(preg_replace('/[\s-]/', '', $n));
    if (preg_match('/^([XYZ]?)(\d{7,8})([A-Z])$/', $n, $m)) {
        $num = (int)(str_replace(['X', 'Y', 'Z'], ['0', '1', '2'], $m[1]) . $m[2]);
        return 'TRWAGMYFPDXBNJZSQVHLCKE'[$num % 23] === $m[3];
    }
    return (bool)preg_match('/^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$/', $n);
}

function gestoria_pct($v, array $permitidos, float $def): float
{
    $f = (float)str_replace(',', '.', (string)$v);
    return in_array($f, $permitidos, true) ? $f : $def;
}

/** Siguiente número de factura del año: 2026-001, 2026-002… (correlativo, como pide Hacienda). */
function gestoria_siguiente_numero(string $fecha): string
{
    $y = substr($fecha, 0, 4);
    $q = gestoria_db()->prepare('SELECT numero FROM gestoria_facturas WHERE numero LIKE ? ORDER BY numero DESC LIMIT 1');
    $q->execute([$y . '-%']);
    $ult = pebai_uno($q);
    $n = $ult ? (int)substr((string)$ult, 5) + 1 : 1;
    return $y . '-' . str_pad((string)$n, 3, '0', STR_PAD_LEFT);
}

/** Lo que le toca a cada uno de una factura cobrada. La comisión la ponen a medias Adrián y Daniel; la caja no se toca. */
function gestoria_reparto(array $f): array
{
    $c = GESTORIA_CANALES[$f['canal']] ?? GESTORIA_CANALES['daniel'];
    $bolsa = max(0, (int)$f['base'] - (int)$f['coste']);
    $conCom = trim((string)$f['comisionista']) !== '';
    $pc = $conCom ? (float)$f['com_pct'] : 0.0;
    $com = (int)round($bolsa * $pc / 100);
    $caja = (int)round($bolsa * $c[3] / 100);
    $adr = (int)round($bolsa * ($c[1] - $pc / 2) / 100);
    $dan = $bolsa - $com - $caja - $adr;   // lo que sobra de redondear, a Daniel: la suma cuadra siempre
    return ['bolsa' => $bolsa, 'adrian' => $adr, 'daniel' => $dan, 'caja' => $caja, 'comision' => $com,
            'pct' => ['adrian' => $c[1] - $pc / 2, 'daniel' => $c[2] - $pc / 2, 'caja' => $c[3], 'comision' => $pc]];
}

function gestoria_rango(int $y, int $t): array
{
    $ini = sprintf('%04d-%02d-01', $y, ($t - 1) * 3 + 1);
    $fin = date('Y-m-t', strtotime(sprintf('%04d-%02d-01', $y, $t * 3)));
    return [$ini, $fin];
}

/** Último día para presentar las declaraciones del trimestre. */
function gestoria_plazo(int $y, int $t): string
{
    return $t === 4 ? sprintf('%04d-01-30', $y + 1) : sprintf('%04d-%02d-20', $y, $t * 3 + 1);
}

/** Cuentas de un trimestre: IVA (303), adelanto de IRPF (130) y retenciones hechas a otros (111). */
function gestoria_trimestre(int $y, int $t): array
{
    $db = gestoria_db();
    [$ini, $fin] = gestoria_rango($y, $t);
    $q = $db->prepare("SELECT COALESCE(SUM(base),0) base, COALESCE(SUM(iva),0) iva, COALESCE(SUM(irpf),0) irpf, COUNT(*) n
                       FROM gestoria_facturas WHERE estado <> 'anulada' AND fecha BETWEEN ? AND ?");
    $q->execute([$ini, $fin]);
    $fac = pebai_fila($q);
    $q = $db->prepare('SELECT * FROM gestoria_gastos WHERE fecha BETWEEN ? AND ?');
    $q->execute([$ini, $fin]);
    $ivaSop = 0;
    $auto = 0;
    $ret = 0;
    $gastos = 0;
    $n = 0;
    foreach ($q->fetchAll() as $g) {
        if (!(int)$g['deducible']) {
            continue;
        }
        $n++;
        $gastos += (int)$g['base'];
        if (in_array($g['tipo'], ['es', 'adrian'], true)) {
            $ivaSop += (int)$g['iva'];
        } elseif (in_array($g['tipo'], ['ue', 'fuera'], true)) {
            $auto += (int)round((int)$g['base'] * 0.21);   // inversión del sujeto pasivo: se apunta en los dos lados y no se paga
        }
        $ret += (int)$g['irpf'];
    }
    // 130: se calcula con todo el año hasta este trimestre y se restan los adelantos ya hechos
    $pagoPrevio = 0;
    for ($k = 1; $k < $t; $k++) {
        $pagoPrevio += gestoria_trimestre($y, $k)['m130']['pagar'];
    }
    [$iniAno] = gestoria_rango($y, 1);
    $q = $db->prepare("SELECT COALESCE(SUM(base),0) b, COALESCE(SUM(irpf),0) r FROM gestoria_facturas WHERE estado <> 'anulada' AND fecha BETWEEN ? AND ?");
    $q->execute([$iniAno, $fin]);
    $acu = pebai_fila($q);
    $q = $db->prepare('SELECT COALESCE(SUM(base),0) FROM gestoria_gastos WHERE deducible = 1 AND fecha BETWEEN ? AND ?');
    $q->execute([$iniAno, $fin]);
    $gasAcu = (int)pebai_uno($q);
    $rend = (int)$acu['b'] - $gasAcu;
    $pagar130 = max(0, (int)round(max(0, $rend) * 0.20) - (int)$acu['r'] - $pagoPrevio);
    return [
        'y' => $y, 't' => $t, 'desde' => $ini, 'hasta' => $fin, 'plazo' => gestoria_plazo($y, $t),
        'ingresos' => (int)$fac['base'], 'facturas' => (int)$fac['n'], 'gastos' => $gastos, 'n_gastos' => $n,
        'm303' => ['repercutido' => (int)$fac['iva'], 'soportado' => $ivaSop, 'autorep' => $auto, 'pagar' => (int)$fac['iva'] - $ivaSop],
        'm130' => ['ingresos' => (int)$acu['b'], 'gastos' => $gasAcu, 'rendimiento' => $rend, 'retenciones' => (int)$acu['r'],
                   'previos' => $pagoPrevio, 'pagar' => $pagar130],
        'm111' => ['pagar' => $ret],
    ];
}

/** Todo lo que pinta la sección. */
function gestoria_estado(): array
{
    $db = gestoria_db();
    $aj = gestoria_ajustes();
    $facturas = $db->query('SELECT * FROM gestoria_facturas ORDER BY fecha DESC, numero DESC')->fetchAll();
    $gastos = $db->query('SELECT * FROM gestoria_gastos ORDER BY fecha DESC, id DESC')->fetchAll();
    // Reparto: solo lo cobrado (el acuerdo reparte lo que de verdad ha entrado)
    $tot = ['adrian' => 0, 'daniel' => 0, 'caja' => 0];
    $com = [];
    foreach ($facturas as &$f) {
        $f['lineas'] = json_decode((string)$f['lineas'], true) ?: [];
        $f['reparto'] = gestoria_reparto($f);
        if ($f['estado'] === 'cobrada') {
            foreach ($tot as $k => $_) {
                $tot[$k] += $f['reparto'][$k];
            }
            if ($f['reparto']['comision'] > 0) {
                $nom = trim((string)$f['comisionista']);
                $com[$nom] = ($com[$nom] ?? 0) + $f['reparto']['comision'];
            }
        }
    }
    unset($f);
    $pagAdr = 0;
    $pagCom = [];
    foreach ($gastos as $g) {
        if ($g['tipo'] === 'adrian') {
            $pagAdr += (int)$g['base'];
        } elseif ($g['tipo'] === 'comision') {
            $pagCom[$g['persona']] = ($pagCom[$g['persona']] ?? 0) + (int)$g['base'];
        }
    }
    $comisionistas = [];
    foreach (array_unique(array_merge(array_keys($com), array_keys($pagCom))) as $nom) {
        $comisionistas[] = ['nombre' => $nom, 'generado' => $com[$nom] ?? 0, 'pagado' => $pagCom[$nom] ?? 0];
    }
    // Trimestres: desde el del alta hasta el actual (y como poco el actual)
    $hoy = date('Y-m-d');
    $alta = $aj['fecha_alta'];
    $tri = [];
    $y = (int)substr(min($alta, $hoy), 0, 4);
    $t = intdiv((int)substr(min($alta, $hoy), 5, 2) - 1, 3) + 1;
    $yHoy = (int)substr($hoy, 0, 4);
    $tHoy = intdiv((int)substr($hoy, 5, 2) - 1, 3) + 1;
    $yFin = max($yHoy, (int)substr($alta, 0, 4));
    $tFin = $yFin > $yHoy ? intdiv((int)substr($alta, 5, 2) - 1, 3) + 1 : $tHoy;
    for ($i = 0; $i < 24 && ($y < $yFin || ($y === $yFin && $t <= $tFin)); $i++) {
        $tri[] = gestoria_trimestre($y, $t);
        if (++$t > 4) {
            $t = 1;
            $y++;
        }
    }
    // Gastos de la caja (desde el alta) que todavía no están en la gestoría: para no olvidar ninguno que se desgrava
    $q = $db->prepare("SELECT m.id, m.fecha, m.importe, m.concepto, m.categoria FROM caja_movimientos m
                       WHERE m.tipo = 'gasto' AND m.fecha >= ? AND NOT EXISTS (SELECT 1 FROM gestoria_gastos g WHERE g.caja_id = m.id)
                       ORDER BY m.fecha DESC LIMIT 60");
    $q->execute([$alta]);
    return [
        'ok' => true, 'hoy' => $hoy, 'ajustes' => $aj, 'canales' => GESTORIA_CANALES, 'tipos' => GESTORIA_TIPOS,
        'facturas' => $facturas, 'gastos' => $gastos, 'caja_pendientes' => $q->fetchAll(),
        'reparto' => ['total' => $tot, 'adrian_facturado' => $pagAdr, 'comisionistas' => $comisionistas],
        'trimestres' => array_reverse($tri), 'siguiente' => gestoria_siguiente_numero($hoy >= $alta ? $hoy : $alta),
    ];
}

/** Al cobrar una factura, entra en la caja; si se deshace, sale. */
function gestoria_caja_ingreso(array $f): int
{
    $db = pebai_caja_db();
    $now = date('Y-m-d H:i:s');
    $liquido = (int)$f['total'];
    $concepto = 'Factura ' . $f['numero'];
    if ((int)$f['caja_id'] > 0) {
        $db->prepare('UPDATE caja_movimientos SET fecha = ?, importe = ?, concepto = ?, cliente = ?, cobrado = 1, updated_at = ? WHERE id = ?')
           ->execute([$f['fecha_cobro'], $liquido, $concepto, $f['cliente'], $now, (int)$f['caja_id']]);
        return (int)$f['caja_id'];
    }
    $db->prepare('INSERT INTO caja_movimientos (tipo, fecha, importe, concepto, categoria, servicio, cliente, forma, cobrado, notas, created_at)
                  VALUES ("ingreso", ?, ?, ?, "", "", ?, "transferencia", 1, "Desde Gestoría", ?)')
       ->execute([$f['fecha_cobro'], $liquido, $concepto, $f['cliente'], $now]);
    return (int)$db->lastInsertId();
}
