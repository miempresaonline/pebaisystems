<?php
/*
 * PEBAI · Revisión con IA de las empresas que entran en las carpetas nuevas (climatización, oposiciones, formación, idiomas).
 * Tercera capa después de los filtros del scraper: la IA mira nombre y web de cada empresa (por lotes de 40) y descarta
 * las que claramente no son del nicho. Las descartadas no se borran: quedan como 'descartado' con el motivo '[auditoria] …'.
 *
 *   php auditar_lote.php <nicho> "<lote>"   → solo las pendientes de ese lote (lo llama prospeccion/tanda.py al importar)
 *   php auditar_lote.php <nicho> --todo      → todas las pendientes del nicho
 */
if (PHP_SAPI !== 'cli' || $argc < 3) {
    exit(1);
}
$api = getenv('HOME') . '/domains/pebaisystems.es/public_html/api';
require $api . '/_agentes_lib.php';
require_once $api . '/_ia_lib.php';

const AUDITORIA_NICHOS = [
    'climatizacion' => 'empresa instaladora de climatización (aire acondicionado, calefacción, aerotermia, bombas de calor, ventilación) que hace instalaciones y mantenimiento para clientes. NO valen: tiendas o distribuidores de material, fabricantes, electricistas o fontaneros generalistas cuyo negocio principal no es la climatización, empresas de reformas o multiservicios, servicios técnicos de electrodomésticos, talleres de coches, empresas de gas, empresas de otros países, grandes grupos nacionales.',
    'oposiciones' => 'academia privada que prepara oposiciones (Guardia Civil, Policía, docentes, administrativo, sanidad, justicia...). NO valen: academias de refuerzo escolar, repaso, bachillerato o universidad, academias de idiomas, centros de FP, autoescuelas, gimnasios o entrenadores físicos, centros públicos, sindicatos, librerías, editoriales, grandes plataformas online.',
    'formacion' => 'centro privado de formación especializada (cursos profesionales, certificados de profesionalidad, FP privada, formación técnica, sanitaria, de estética, informática, etc.). NO valen: academias de oposiciones, escuelas de idiomas, refuerzo escolar, colegios, institutos, universidades, conservatorios, escuelas de danza, música, teatro o náutica, autoescuelas, gimnasios, psicólogos, clínicas, residencias, centros públicos o municipales, consultoras que no son centros de formación, centros de otros países.',
    'idiomas' => 'escuela o academia privada de idiomas (inglés u otros) que da clases. NO valen: academias de refuerzo escolar general, profesores particulares sin academia, traductores, colegios, guarderías, escuelas de danza, música o teatro, campamentos, agencias de estudios en el extranjero, grupos de intercambio, grandes cadenas o franquicias.',
];
$nicho = $argv[1];
$def = AUDITORIA_NICHOS[$nicho] ?? null;
if (!$def) {
    exit(1);
}
$db = pebai_agentes_db();
$todo = $argv[2] === '--todo';
$filas = [];
foreach (['wa' => 'prospectos', 'em' => 'email_prospectos'] as $t => $tabla) {
    $sql = "SELECT '$t' t, id, empresa, web, ciudad FROM $tabla WHERE nicho = ? AND estado = 'pendiente'" . ($todo ? '' : ' AND (lote = ? OR lote = ?)');
    $q = $db->prepare($sql);
    $q->execute($todo ? [$nicho] : [$nicho, $argv[2], $argv[2] . ' (email)']);
    foreach ($q as $r) {
        $filas[] = $r;
    }
}
$fuera = 0;
foreach (array_chunk($filas, 40) as $lote) {
    $txt = '';
    foreach ($lote as $r) {
        $txt .= $r['t'] . $r['id'] . ' | ' . $r['empresa'] . ' | ' . preg_replace('#^https?://(www\.)?#', '', (string)$r['web']) . ' | ' . $r['ciudad'] . "\n";
    }
    $res = pebai_ia_json("Revisa esta lista de negocios de España. Deberían ser todos: {$def}\n"
        . "Decide con su nombre y su web. Si es claramente del tipo pedido o no está claro, no lo pongas. "
        . "Pon SOLO los que claramente NO lo son. Responde SOLO JSON {\"no\": [{\"id\": \"wa123\", \"motivo\": \"frase corta\"}]}.\n\nLISTA (id | nombre | web | ciudad):\n" . $txt);
    foreach ((array)($res['no'] ?? []) as $x) {
        $id = (string)($x['id'] ?? '');
        foreach ($lote as $r) {
            if ($r['t'] . $r['id'] === $id) {
                $tabla = $r['t'] === 'wa' ? 'prospectos' : 'email_prospectos';
                $db->prepare("UPDATE $tabla SET estado = 'descartado', error = ?, updated_at = ? WHERE id = ? AND estado = 'pendiente'")
                   ->execute(['[auditoria] ' . mb_substr((string)($x['motivo'] ?? ''), 0, 200), date('Y-m-d H:i:s'), $r['id']]);
                $fuera++;
            }
        }
    }
    sleep(3);
}
echo json_encode(['revisadas' => count($filas), 'descartadas' => $fuera]), "\n";
