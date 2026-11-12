<?php
/*
 * PEBAI · Panel — Empresa › Gestoría. Lo incluye panel/index.php después de comprobar la sesión: usa $auth, csrf() y json_out().
 *   GET  ?gestoria=1            → todo lo de la sección (ver gestoria_estado() en api/_gestoria_lib.php)
 *   GET  ?gestoria_factura=ID   → la factura lista para imprimir o guardar en PDF
 *   POST action=gestoria_*      → guardar datos, facturas y gastos
 */
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}
require_once dirname(__DIR__) . '/api/_gestoria_lib.php';

function gs_h($s): string
{
    return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');
}
function gs_e(int $c): string
{
    return number_format($c / 100, 2, ',', '.') . ' €';
}
function gs_txt(string $k, int $max): string
{
    return mb_substr(trim((string)($_POST[$k] ?? '')), 0, $max);
}

/* ------------------------------------------------------------ Datos (JSON) --- */
if ($auth && isset($_GET['gestoria'])) {
    try {
        json_out(gestoria_estado() + ['csrf' => csrf()]);
    } catch (Throwable $e) {
        json_out(['ok' => false, 'error' => 'No se puede abrir la gestoría: ' . $e->getMessage()], 500);
    }
}

/* ------------------------------------------------------------ Factura para imprimir --- */
if ($auth && isset($_GET['gestoria_factura'])) {
    $q = gestoria_db()->prepare('SELECT * FROM gestoria_facturas WHERE id = ?');
    $q->execute([(int)$_GET['gestoria_factura']]);
    $f = pebai_fila($q);
    if (!$f) {
        http_response_code(404);
        exit('No existe esa factura.');
    }
    $a = gestoria_ajustes();
    $lineas = json_decode((string)$f['lineas'], true) ?: [];
    $pct = static fn($p) => rtrim(rtrim(number_format((float)$p, 2, ',', ''), '0'), ',');
    header('Content-Type: text/html; charset=utf-8');
    ?><!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Factura <?= gs_h($f['numero']) ?></title>
<style>
@page{size:A4;margin:16mm}
*{box-sizing:border-box}
body{margin:0;background:#E9E7E1;font:14px/1.5 "Segoe UI",Arial,sans-serif;color:#12121A}
.hoja{width:210mm;min-height:297mm;margin:20px auto;background:#fff;padding:18mm 18mm 16mm;box-shadow:0 10px 40px rgba(0,0,0,.12)}
.top{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;border-bottom:3px solid #493AC4;padding-bottom:14px}
.top h1{margin:0;font-size:30px;letter-spacing:-.02em}
.top .num{text-align:right;color:#575661;font-size:13px}.top .num b{display:block;color:#12121A;font-size:18px}
.partes{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin:22px 0}
.partes small{display:block;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:#493AC4;font-weight:700;margin-bottom:4px}
.partes p{margin:0;white-space:pre-line}
table{width:100%;border-collapse:collapse;margin-top:6px}
th{font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:#575661;text-align:left;padding:8px;border-bottom:1px solid #C7C4BE;background:#F4F2EC}
td{padding:9px 8px;border-bottom:1px solid #E6E3DD;vertical-align:top}
.r{text-align:right;white-space:nowrap}
.tot{margin-left:auto;width:300px;margin-top:16px}
.tot div{display:flex;justify-content:space-between;padding:6px 8px}
.tot .fin{border-top:2px solid #12121A;font-weight:800;font-size:17px;margin-top:4px}
.pago{margin-top:28px;padding:12px 14px;background:#F4F2EC;border-radius:8px;font-size:13px}
.pie{margin-top:18px;font-size:11.5px;color:#575661}
.bar{position:sticky;top:0;background:#12121A;color:#fff;padding:10px;text-align:center}
.bar button{font:700 14px inherit;padding:8px 18px;border-radius:999px;border:0;background:#B7FF3C;cursor:pointer}
.anulada{color:#C62828;font-weight:800;letter-spacing:.1em}
@media print{body{background:#fff}.hoja{margin:0;box-shadow:none;width:auto;min-height:0;padding:0}.bar{display:none}}
</style></head><body>
<div class="bar"><button onclick="print()">Imprimir o guardar en PDF</button></div>
<div class="hoja">
  <div class="top">
    <div><h1>Factura</h1><?php if ($f['estado'] === 'anulada'): ?><div class="anulada">ANULADA</div><?php endif; ?></div>
    <div class="num"><b>N.º <?= gs_h($f['numero']) ?></b>Fecha: <?= gs_h(date('d/m/Y', strtotime($f['fecha']))) ?></div>
  </div>
  <div class="partes">
    <div><small>Emisor</small><p><b><?= gs_h($a['nombre'] ?: '— Falta tu nombre en Mis datos —') ?></b>
NIF: <?= gs_h($a['nif'] ?: '—') ?>
<?= gs_h($a['direccion']) ?>
<?= gs_h($a['ciudad']) ?><?= $a['email'] !== '' ? "\n" . gs_h($a['email']) : '' ?><?= $a['telefono'] !== '' ? "\n" . gs_h($a['telefono']) : '' ?></p></div>
    <div><small>Cliente</small><p><b><?= gs_h($f['cliente']) ?></b>
NIF: <?= gs_h($f['cliente_nif'] ?: '—') ?>
<?= gs_h($f['cliente_dir']) ?></p></div>
  </div>
  <table>
    <tr><th>Concepto</th><th class="r">Cantidad</th><th class="r">Precio</th><th class="r">Importe</th></tr>
    <?php foreach ($lineas as $l): $imp = (int)round((float)$l['n'] * (int)$l['p']); ?>
    <tr><td><?= gs_h($l['c']) ?></td><td class="r"><?= gs_h($pct($l['n'])) ?></td><td class="r"><?= gs_e((int)$l['p']) ?></td><td class="r"><?= gs_e($imp) ?></td></tr>
    <?php endforeach; ?>
  </table>
  <div class="tot">
    <div><span>Base imponible</span><span><?= gs_e((int)$f['base']) ?></span></div>
    <div><span>IVA (<?= gs_h($pct($f['iva_pct'])) ?> %)</span><span><?= gs_e((int)$f['iva']) ?></span></div>
    <?php if ((int)$f['irpf'] > 0): ?><div><span>Retención IRPF (<?= gs_h($pct($f['irpf_pct'])) ?> %)</span><span>−<?= gs_e((int)$f['irpf']) ?></span></div><?php endif; ?>
    <div class="fin"><span>Total a pagar</span><span><?= gs_e((int)$f['total']) ?></span></div>
  </div>
  <?php if ($a['iban'] !== ''): ?><div class="pago"><b>Forma de pago:</b> transferencia a <?= gs_h($a['iban']) ?></div><?php endif; ?>
  <?php if ($a['pie'] !== ''): ?><div class="pie"><?= nl2br(gs_h($a['pie'])) ?></div><?php endif; ?>
</div>
</body></html><?php
    exit;
}

/* ------------------------------------------------------------ Acciones --- */
$gsAcciones = ['gestoria_ajustes', 'gestoria_factura_guardar', 'gestoria_factura_cobrar', 'gestoria_factura_anular', 'gestoria_factura_borrar',
               'gestoria_gasto_guardar', 'gestoria_gasto_borrar'];
if ($auth && in_array($_POST['action'] ?? '', $gsAcciones, true)) {
    if (!hash_equals($_SESSION['csrf'] ?? '', $_POST['csrf'] ?? '')) {
        json_out(['ok' => false, 'error' => 'Sesión caducada. Recarga la página.'], 400);
    }
    $now = date('Y-m-d H:i:s');
    try {
        $db = gestoria_db();
        $fila = static function (string $tabla, int $id) use ($db) {
            $q = $db->prepare("SELECT * FROM $tabla WHERE id = ?");
            $q->execute([$id]);
            return pebai_fila($q);
        };
        switch ($_POST['action']) {
            case 'gestoria_ajustes':
                $v = [];
                foreach (['nombre' => 120, 'direccion' => 200, 'ciudad' => 120, 'email' => 120, 'telefono' => 30, 'pie' => 500] as $k => $max) {
                    $v[$k] = gs_txt($k, $max);
                }
                $v['nif'] = strtoupper(preg_replace('/[\s-]/', '', gs_txt('nif', 20)));
                if ($v['nif'] !== '' && !gestoria_nif_ok($v['nif'])) {
                    json_out(['ok' => false, 'error' => 'Ese NIF no es válido. Es tu número de DNI con la letra, sin espacios.'], 422);
                }
                $v['iban'] = strtoupper(preg_replace('/\s+/', '', gs_txt('iban', 40)));
                if ($v['iban'] !== '' && !preg_match('/^ES\d{22}$/', $v['iban'])) {
                    json_out(['ok' => false, 'error' => 'El IBAN tiene que empezar por ES y llevar 22 números.'], 422);
                }
                $v['iban'] = trim(chunk_split($v['iban'], 4, ' '));
                $v['fecha_alta'] = pebai_caja_fecha(gs_txt('fecha_alta', 10)) ?? '2026-12-18';
                $v['retencion'] = (string)gestoria_pct($_POST['retencion'] ?? '7', [0.0, 7.0, 15.0], 7.0);
                $v['cuota'] = (string)(pebai_caja_cent(gs_txt('cuota', 20)) ?? 0);
                $up = $db->prepare('INSERT INTO gestoria_ajustes (clave, valor) VALUES (?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor');
                foreach ($v as $k => $val) {
                    $up->execute([$k, $val]);
                }
                json_out(['ok' => true]);

            case 'gestoria_factura_guardar':
                $a = gestoria_ajustes();
                if ($a['nombre'] === '' || $a['nif'] === '' || $a['direccion'] === '') {
                    json_out(['ok' => false, 'error' => 'Antes de facturar, rellena tu nombre, NIF y dirección en «Mis datos».'], 422);
                }
                $id = (int)($_POST['id'] ?? 0);
                $antes = $id ? $fila('gestoria_facturas', $id) : null;
                if ($id && !$antes) {
                    json_out(['ok' => false, 'error' => 'Esa factura ya no existe.'], 404);
                }
                if ($antes && $antes['estado'] === 'anulada') {
                    json_out(['ok' => false, 'error' => 'Una factura anulada no se cambia.'], 422);
                }
                $fecha = pebai_caja_fecha(gs_txt('fecha', 10));
                $cliente = gs_txt('cliente', 160);
                $nif = strtoupper(preg_replace('/[\s-]/', '', gs_txt('cliente_nif', 20)));
                $dir = gs_txt('cliente_dir', 300);
                if (!$fecha || $cliente === '') {
                    json_out(['ok' => false, 'error' => 'Faltan la fecha o el nombre del cliente.'], 422);
                }
                if (!gestoria_nif_ok($nif) || $dir === '') {
                    json_out(['ok' => false, 'error' => 'A una empresa hay que ponerle su NIF o CIF y su dirección. Revisa que el NIF esté bien.'], 422);
                }
                $lineas = [];
                $base = 0;
                foreach (json_decode((string)($_POST['lineas'] ?? '[]'), true) ?: [] as $l) {
                    $c = mb_substr(trim((string)($l['c'] ?? '')), 0, 300);
                    $n = (float)str_replace(',', '.', (string)($l['n'] ?? '1'));
                    $p = pebai_caja_cent((string)($l['p'] ?? ''));
                    if ($c === '' || $p === null || $n <= 0 || $n > 100000) {
                        continue;
                    }
                    $lineas[] = ['c' => $c, 'n' => $n, 'p' => $p];
                    $base += (int)round($n * $p);
                }
                if (!$lineas || count($lineas) > 30) {
                    json_out(['ok' => false, 'error' => 'Pon al menos un concepto con su precio.'], 422);
                }
                $ivaPct = gestoria_pct($_POST['iva_pct'] ?? '21', [21.0, 10.0, 4.0, 0.0], 21.0);
                $irpfPct = gestoria_pct($_POST['irpf_pct'] ?? $a['retencion'], [0.0, 7.0, 15.0], (float)$a['retencion']);
                $iva = (int)round($base * $ivaPct / 100);
                $irpf = (int)round($base * $irpfPct / 100);
                $canal = array_key_exists($_POST['canal'] ?? '', GESTORIA_CANALES) ? $_POST['canal'] : 'daniel';
                $coste = gs_txt('coste', 20) === '' ? 0 : (pebai_caja_cent(gs_txt('coste', 20)) ?? 0);
                $comisionista = gs_txt('comisionista', 80);
                $comPct = gestoria_pct($_POST['com_pct'] ?? '7', [5.0, 7.0, 10.0], 7.0);
                $campos = ['fecha' => $fecha, 'cliente' => $cliente, 'cliente_nif' => $nif, 'cliente_dir' => $dir,
                           'lineas' => json_encode($lineas, JSON_UNESCAPED_UNICODE), 'base' => $base, 'iva_pct' => $ivaPct, 'iva' => $iva,
                           'irpf_pct' => $irpfPct, 'irpf' => $irpf, 'total' => $base + $iva - $irpf, 'canal' => $canal, 'coste' => $coste,
                           'comisionista' => $comisionista, 'com_pct' => $comPct, 'notas' => gs_txt('notas', 2000)];
                if ($antes) {
                    if (substr($antes['numero'], 0, 4) !== substr($fecha, 0, 4)) {
                        json_out(['ok' => false, 'error' => 'La fecha tiene que ser del mismo año que el número de la factura.'], 422);
                    }
                    $set = implode(', ', array_map(static fn($k) => "$k = ?", array_keys($campos)));
                    $db->prepare("UPDATE gestoria_facturas SET $set, updated_at = ? WHERE id = ?")->execute(array_merge(array_values($campos), [$now, $id]));
                    $f = $fila('gestoria_facturas', $id);
                    if ($f['estado'] === 'cobrada') {
                        gestoria_caja_ingreso($f);
                    }
                    json_out(['ok' => true, 'id' => $id, 'numero' => $f['numero']]);
                }
                // Las facturas van en orden: una nueva no puede tener fecha anterior a la última del año
                $q = $db->prepare('SELECT MAX(fecha) FROM gestoria_facturas WHERE numero LIKE ?');
                $q->execute([substr($fecha, 0, 4) . '-%']);
                $ultima = (string)pebai_uno($q);
                if ($ultima !== '' && $fecha < $ultima) {
                    json_out(['ok' => false, 'error' => 'La última factura es del ' . date('d/m/Y', strtotime($ultima)) . ': la nueva no puede tener una fecha anterior.'], 422);
                }
                $campos['numero'] = gestoria_siguiente_numero($fecha);
                $campos['created_at'] = $now;
                $db->prepare('INSERT INTO gestoria_facturas (' . implode(',', array_keys($campos)) . ') VALUES (' . implode(',', array_fill(0, count($campos), '?')) . ')')
                   ->execute(array_values($campos));
                json_out(['ok' => true, 'id' => (int)$db->lastInsertId(), 'numero' => $campos['numero']]);

            case 'gestoria_factura_cobrar':
                $f = $fila('gestoria_facturas', (int)($_POST['id'] ?? 0));
                if (!$f || $f['estado'] === 'anulada') {
                    json_out(['ok' => false, 'error' => 'Esa factura no se puede cobrar.'], 422);
                }
                if (($_POST['deshacer'] ?? '') === '1') {
                    if ((int)$f['caja_id'] > 0) {
                        $db->prepare('DELETE FROM caja_movimientos WHERE id = ?')->execute([(int)$f['caja_id']]);
                    }
                    $db->prepare("UPDATE gestoria_facturas SET estado = 'emitida', fecha_cobro = '', caja_id = 0, updated_at = ? WHERE id = ?")->execute([$now, (int)$f['id']]);
                    json_out(['ok' => true]);
                }
                $f['fecha_cobro'] = pebai_caja_fecha(gs_txt('fecha_cobro', 10)) ?? date('Y-m-d');
                $f['estado'] = 'cobrada';
                $cajaId = gestoria_caja_ingreso($f);
                $db->prepare("UPDATE gestoria_facturas SET estado = 'cobrada', fecha_cobro = ?, caja_id = ?, updated_at = ? WHERE id = ?")
                   ->execute([$f['fecha_cobro'], $cajaId, $now, (int)$f['id']]);
                json_out(['ok' => true]);

            case 'gestoria_factura_anular':
                // Una factura emitida no se borra: queda con su número y marcada como anulada
                $f = $fila('gestoria_facturas', (int)($_POST['id'] ?? 0));
                if (!$f) {
                    json_out(['ok' => false, 'error' => 'Esa factura ya no existe.'], 404);
                }
                if ((int)$f['caja_id'] > 0) {
                    $db->prepare('DELETE FROM caja_movimientos WHERE id = ?')->execute([(int)$f['caja_id']]);
                }
                $db->prepare("UPDATE gestoria_facturas SET estado = 'anulada', caja_id = 0, updated_at = ? WHERE id = ?")->execute([$now, (int)$f['id']]);
                json_out(['ok' => true]);

            case 'gestoria_factura_borrar':
                // Solo la última del año y sin cobrar (un error recién hecho): así no quedan huecos en la numeración
                $f = $fila('gestoria_facturas', (int)($_POST['id'] ?? 0));
                if (!$f) {
                    json_out(['ok' => false, 'error' => 'Esa factura ya no existe.'], 404);
                }
                $q = $db->prepare('SELECT MAX(numero) FROM gestoria_facturas WHERE numero LIKE ?');
                $q->execute([substr($f['numero'], 0, 4) . '-%']);
                if ((string)pebai_uno($q) !== $f['numero'] || $f['estado'] === 'cobrada') {
                    json_out(['ok' => false, 'error' => 'Solo se puede borrar la última factura y si no está cobrada. Las demás se anulan.'], 422);
                }
                $db->prepare('DELETE FROM gestoria_facturas WHERE id = ?')->execute([(int)$f['id']]);
                json_out(['ok' => true]);

            case 'gestoria_gasto_guardar':
                $id = (int)($_POST['id'] ?? 0);
                $fecha = pebai_caja_fecha(gs_txt('fecha', 10));
                $tipo = array_key_exists($_POST['tipo'] ?? '', GESTORIA_TIPOS) ? $_POST['tipo'] : 'es';
                $base = pebai_caja_cent(gs_txt('base', 20));
                if (!$fecha || $base === null) {
                    json_out(['ok' => false, 'error' => 'Faltan la fecha o el importe.'], 422);
                }
                $ivaPct = in_array($tipo, ['es', 'adrian'], true) ? gestoria_pct($_POST['iva_pct'] ?? '21', [21.0, 10.0, 4.0, 0.0], 21.0) : 0.0;
                $irpfPct = in_array($tipo, ['adrian', 'comision'], true) ? gestoria_pct($_POST['irpf_pct'] ?? '0', [0.0, 7.0, 15.0], 0.0) : 0.0;
                $deducible = ($_POST['deducible'] ?? '1') === '0' ? 0 : 1;
                $persona = $tipo === 'adrian' ? 'Adrián' : ($tipo === 'comision' ? gs_txt('persona', 80) : '');
                if ($tipo === 'comision') {
                    if ($persona === '') {
                        json_out(['ok' => false, 'error' => 'Pon el nombre del comisionista.'], 422);
                    }
                    // Sin recibí no hay retención ni se desgrava
                    if (!$deducible) {
                        $irpfPct = 0.0;
                    }
                }
                $iva = (int)round($base * $ivaPct / 100);
                $irpf = (int)round($base * $irpfPct / 100);
                $campos = ['fecha' => $fecha, 'tipo' => $tipo, 'proveedor' => $tipo === 'adrian' ? 'Adrián' : gs_txt('proveedor', 120),
                           'concepto' => gs_txt('concepto', 300), 'base' => $base, 'iva_pct' => $ivaPct, 'iva' => $iva, 'irpf_pct' => $irpfPct,
                           'irpf' => $irpf, 'deducible' => $deducible, 'persona' => $persona, 'notas' => gs_txt('notas', 1000)];
                $pagado = $base + $iva - $irpf;   // lo que sale de la cuenta (la retención se paga luego a Hacienda)
                $cajaId = (int)($_POST['caja_id'] ?? 0);
                if ($id) {
                    $g = $fila('gestoria_gastos', $id);
                    if (!$g) {
                        json_out(['ok' => false, 'error' => 'Ese gasto ya no existe.'], 404);
                    }
                    $set = implode(', ', array_map(static fn($k) => "$k = ?", array_keys($campos)));
                    $db->prepare("UPDATE gestoria_gastos SET $set WHERE id = ?")->execute(array_merge(array_values($campos), [$id]));
                    if ((int)$g['caja_id'] > 0) {
                        $db->prepare('UPDATE caja_movimientos SET fecha = ?, importe = ?, updated_at = ? WHERE id = ?')->execute([$fecha, $pagado, $now, (int)$g['caja_id']]);
                    }
                    json_out(['ok' => true, 'id' => $id]);
                }
                if ($cajaId > 0) {
                    // Viene de un gasto que ya estaba en la caja: se enlaza, no se duplica
                    $q = $db->prepare("SELECT id FROM caja_movimientos WHERE id = ? AND tipo = 'gasto'");
                    $q->execute([$cajaId]);
                    if (!pebai_uno($q)) {
                        $cajaId = 0;
                    }
                }
                if ($cajaId === 0) {
                    $cat = ['adrian' => 'Otros', 'comision' => 'Otros', 'cuota' => 'Gestoría'][$tipo] ?? 'Herramientas y software';
                    $db->prepare('INSERT INTO caja_movimientos (tipo, fecha, importe, concepto, categoria, forma, notas, created_at)
                                  VALUES ("gasto", ?, ?, ?, ?, ?, "Desde Gestoría", ?)')
                       ->execute([$fecha, $pagado, trim(($campos['proveedor'] ?: GESTORIA_TIPOS[$tipo]) . ($campos['concepto'] !== '' ? ' · ' . $campos['concepto'] : '')), $cat,
                                  $tipo === 'comision' && !$deducible ? 'efectivo' : 'transferencia', $now]);
                    $cajaId = (int)$db->lastInsertId();
                }
                $campos['caja_id'] = $cajaId;
                $campos['created_at'] = $now;
                $db->prepare('INSERT INTO gestoria_gastos (' . implode(',', array_keys($campos)) . ') VALUES (' . implode(',', array_fill(0, count($campos), '?')) . ')')
                   ->execute(array_values($campos));
                json_out(['ok' => true, 'id' => (int)$db->lastInsertId()]);

            case 'gestoria_gasto_borrar':
                // Se quita de la gestoría; el movimiento de la caja se queda (el dinero salió de verdad)
                $db->prepare('DELETE FROM gestoria_gastos WHERE id = ?')->execute([(int)($_POST['id'] ?? 0)]);
                json_out(['ok' => true]);
        }
    } catch (Throwable $e) {
        json_out(['ok' => false, 'error' => 'No se ha podido guardar: ' . $e->getMessage()], 500);
    }
}
