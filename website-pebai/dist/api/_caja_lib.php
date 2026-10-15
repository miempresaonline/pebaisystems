<?php
/*
 * PEBAI · Caja de la empresa (panel › Empresa › Caja).
 * Ingresos (qué servicio, a quién, por qué entró), gastos por mes y suscripciones que se
 * apuntan solas cada periodo. Importes en céntimos (enteros) para no arrastrar decimales.
 * Mismas base y carpeta privada que el embudo (private/leads.sqlite, fuera de public_html).
 */
require_once __DIR__ . '/_pebai_lib.php';

const CAJA_FORMAS = ['transferencia', 'bizum', 'tarjeta', 'efectivo', 'domiciliacion', 'otro'];

function pebai_caja_db(): PDO
{
    static $ready = false;
    $db = pebai_db();
    if (!$ready) {
        $db->exec('CREATE TABLE IF NOT EXISTS caja_movimientos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tipo TEXT NOT NULL,
            fecha TEXT NOT NULL,
            importe INTEGER NOT NULL,
            concepto TEXT NOT NULL DEFAULT "",
            categoria TEXT NOT NULL DEFAULT "",
            servicio TEXT NOT NULL DEFAULT "",
            cliente TEXT NOT NULL DEFAULT "",
            lead_id INTEGER NOT NULL DEFAULT 0,
            forma TEXT NOT NULL DEFAULT "",
            cobrado INTEGER NOT NULL DEFAULT 1,
            notas TEXT NOT NULL DEFAULT "",
            suscripcion_id INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL DEFAULT ""
        )');
        $db->exec('CREATE INDEX IF NOT EXISTS idx_caja_fecha ON caja_movimientos(fecha)');
        // Un cargo por suscripción y fecha: evita duplicados aunque dos cargas coincidan
        $db->exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_caja_sus ON caja_movimientos(suscripcion_id, fecha) WHERE suscripcion_id > 0');
        $db->exec('CREATE TABLE IF NOT EXISTS caja_suscripciones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            categoria TEXT NOT NULL DEFAULT "Herramientas y software",
            importe INTEGER NOT NULL,
            periodo TEXT NOT NULL DEFAULT "mensual",
            dia INTEGER NOT NULL DEFAULT 1,
            inicio TEXT NOT NULL,
            fin TEXT NOT NULL DEFAULT "",
            activa INTEGER NOT NULL DEFAULT 1,
            forma TEXT NOT NULL DEFAULT "tarjeta",
            notas TEXT NOT NULL DEFAULT "",
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL DEFAULT ""
        )');
        $db->exec('CREATE TABLE IF NOT EXISTS caja_ajustes (clave TEXT PRIMARY KEY, valor TEXT NOT NULL DEFAULT "")');
        $ready = true;
    }
    return $db;
}

/** "1.234,56", "1234.56", "1234" o "12,5 €" → céntimos. Devuelve null si no es un importe válido. */
function pebai_caja_cent(string $s): ?int
{
    $s = trim(str_replace(['€', ' ', "\u{00A0}"], '', $s));
    if ($s === '' || !preg_match('/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+([.,]\d{1,2})?$/', $s)) {
        return null;
    }
    if (strpos($s, ',') !== false) {
        $s = str_replace('.', '', $s);
        $s = str_replace(',', '.', $s);
    } elseif (preg_match('/^\d{1,3}(\.\d{3})+$/', $s)) {
        $s = str_replace('.', '', $s);   // "1.200" son mil doscientos, no uno con dos
    }
    $c = (int)round((float)$s * 100);
    return $c > 0 && $c < 100000000000 ? $c : null;
}

function pebai_caja_fecha(string $s): ?string
{
    $d = DateTime::createFromFormat('!Y-m-d', $s);
    return $d && $d->format('Y-m-d') === $s ? $s : null;
}

/** Fechas de cargo de una suscripción entre su inicio (o $desde) y hoy. */
function pebai_caja_cargos(array $s, string $hasta): array
{
    $out = [];
    $dia = max(1, min(28, (int)$s['dia']));
    $inicio = new DateTime($s['inicio']);
    $fin = $s['fin'] !== '' ? new DateTime($s['fin']) : null;
    $limite = new DateTime($hasta);
    $paso = $s['periodo'] === 'anual' ? 'P1Y' : 'P1M';
    $f = new DateTime($inicio->format('Y-m-') . sprintf('%02d', $dia));
    if ($s['periodo'] === 'anual') {
        $f = new DateTime($inicio->format('Y-m-d'));
    }
    if ($f < $inicio) {
        $f->add(new DateInterval($paso));
    }
    for ($i = 0; $i < 600 && $f <= $limite && (!$fin || $f <= $fin); $i++) {
        $out[] = $f->format('Y-m-d');
        $f->add(new DateInterval($paso));
    }
    return $out;
}

/** Apunta como gasto cada cargo de suscripción ya vencido que aún no esté en la caja. Idempotente. */
function pebai_caja_suscripciones_al_dia(): int
{
    $db = pebai_caja_db();
    $hoy = date('Y-m-d');
    $n = 0;
    $ins = $db->prepare('INSERT OR IGNORE INTO caja_movimientos (tipo, fecha, importe, concepto, categoria, forma, suscripcion_id, created_at)
                         VALUES ("gasto", ?, ?, ?, ?, ?, ?, ?)');
    foreach ($db->query('SELECT * FROM caja_suscripciones WHERE activa = 1') as $s) {
        foreach (pebai_caja_cargos($s, $hoy) as $f) {
            $ins->execute([$f, (int)$s['importe'], $s['nombre'], $s['categoria'], $s['forma'], (int)$s['id'], date('Y-m-d H:i:s')]);
            $n += $ins->rowCount();
        }
    }
    return $n;
}
