<?php
/*
 * PEBAI · Importa en el panel las empresas VÁLIDAS de una tirada del scraper. Solo corre en el servidor de Hostinger:
 * lo llama prospeccion/tanda.py al terminar cada provincia. Las descartadas nunca llegan al panel (regla de Daniel, 19/10):
 * se quedan en el CSV maestro de la tirada y en el log del servidor.
 *
 * Canal por empresa (una sola lista, nunca las dos):
 *   php importar_panel.php <csv_whatsapp> "<lote>" [revision]       → prospectos (cola de WhatsApp): las que tienen móvil
 *   php importar_panel.php <csv_solo_email> "<lote>" email <nicho>  → email_prospectos: sin móvil y con email de empresa
 */
if (PHP_SAPI !== 'cli' || $argc < 3) {
    exit(1);
}
$api = getenv('HOME') . '/domains/pebaisystems.es/public_html/api';
$csv = (string)file_get_contents($argv[1]);
$lote = $argv[2];
if (($argv[3] ?? '') === 'email') {
    require $api . '/_email_lib.php';
    $r = pebai_email_importar($csv, $argv[4] ?? 'energia', $lote);
} else {
    require $api . '/_agentes_lib.php';
    $estado = ($argv[3] ?? '') === 'revision' ? 'revision' : 'pendiente';
    $r = pebai_prospectos_importar($csv, 'Google Maps · ficha pública del negocio', $lote, $estado);
    $r['priorizados'] = pebai_prospectos_priorizar();   // solares puras primero (ver pebai_prospecto_tipo)
}
// Texto que escribió la IA tras leer su web (<csv>.ia.json: teléfono → mensaje, o email → asunto y cuerpo)
$textos = is_file($argv[1] . '.ia.json') ? (json_decode((string)file_get_contents($argv[1] . '.ia.json'), true) ?: []) : [];
$db = new PDO('sqlite:' . getenv('HOME') . '/domains/pebaisystems.es/private/leads.sqlite');
$con = 0;
if ($textos && ($argv[3] ?? '') === 'email') {
    $st = $db->prepare("UPDATE email_prospectos SET asunto_personal = ?, cuerpo_personal = ? WHERE lower(email) = ? AND cuerpo_personal = ''");
    foreach ($textos as $email => $t) {
        $st->execute([(string)($t['asunto'] ?? ''), (string)($t['cuerpo'] ?? ''), strtolower((string)$email)]);
        $con += $st->rowCount();
    }
} elseif ($textos) {
    $st = $db->prepare("UPDATE prospectos SET mensaje = ? WHERE telefono IN (?, ?) AND mensaje = ''");
    foreach ($textos as $tel => $t) {
        $tel = preg_replace('/\D/', '', (string)$tel);
        $st->execute([(string)($t['mensaje'] ?? ''), $tel, '34' . $tel]);
        $con += $st->rowCount();
    }
}
$r['con_texto_ia'] = $con;
echo json_encode($r, JSON_UNESCAPED_UNICODE), PHP_EOL;
