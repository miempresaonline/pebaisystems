<?php
/*
 * PEBAI · Importa en el panel (Captación › Prospectos) las empresas con móvil de una tirada del scraper.
 * Solo corre en el servidor de Hostinger: lo llama prospeccion/tanda.py al terminar cada provincia.
 * Entran directamente en la cola del agente ('pendiente'): ya han pasado todos los filtros del motor
 * (activas seguro, se dedican al nicho, sin cadenas, tiendas ni autónomos, sin bajas ni ya contactadas).
 *
 * Uso: php importar_panel.php <csv> "<lote>" [revision]
 */
if (PHP_SAPI !== 'cli' || $argc < 3) {
    exit(1);
}
require getenv('HOME') . '/domains/pebaisystems.es/public_html/api/_agentes_lib.php';
$csv = (string)file_get_contents($argv[1]);
$lote = $argv[2];
$estado = ($argv[3] ?? '') === 'revision' ? 'revision' : 'pendiente';
$r = pebai_prospectos_importar($csv, 'Google Maps · ficha pública del negocio', $lote, $estado);
echo json_encode($r, JSON_UNESCAPED_UNICODE), PHP_EOL;
