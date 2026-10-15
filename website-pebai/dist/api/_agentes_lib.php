<?php
/*
 * PEBAI · Agentes automáticos (departamento de Captación: WhatsApp en frío como Daniel).
 * Tablas de prospectos, registro de mensajes, estado de cada agente y lista permanente de bajas.
 * Lo usan api/agente.php (el bot de WhatsApp que corre en el servidor) y el panel.
 *
 * Reglas que no se tocan (legalidad, ver docs/agente-whatsapp.md):
 *   - Solo empresas con el número publicado como contacto comercial; se guarda de dónde sale (origen_dato).
 *   - El primer mensaje se identifica (Daniel, PEBAI Systems) y ofrece no volver a escribir.
 *   - Una baja es para siempre: tabla `bajas`, que sobrevive a borrar o reimportar prospectos.
 *   - Nunca se escribe a quien ya es solicitud o cliente del embudo.
 */
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}
require_once __DIR__ . '/_pebai_lib.php';

const PEBAI_PROSPECTO_ESTADOS = ['pendiente', 'enviando', 'enviado', 'respondio', 'baja', 'sin_whatsapp', 'error', 'descartado'];

// Primer mensaje. [saludo] = Buenos días / Buenas tardes, [nombre] = ", Ana" o nada, [empresa].
// {a|b} elige una variante al azar: ningún mensaje sale idéntico a otro.
const PEBAI_WA_PLANTILLAS = [
    "[saludo][nombre] 👋 Soy Daniel, de PEBAI Systems. {He visto|Vi} [empresa] en Google y {tengo|te quería hacer} una pregunta rápida: cuando un cliente os escribe o llama fuera de horario, ¿quién le contesta?\n\n{Si no te interesa|Si no es para ti}, dímelo y no vuelvo a escribirte.",
    "{Hola|Buenas}[nombre], soy Daniel de PEBAI Systems. {Ayudamos a|Echamos una mano a} negocios como [empresa] a no perder clientes por no contestar a tiempo (WhatsApp, llamadas, formularios). ¿Te puedo hacer una pregunta de un minuto sobre cómo lo gestionáis ahora?\n\nSi no te encaja, me lo dices y no te molesto más.",
    "[saludo][nombre]. Soy Daniel, de PEBAI Systems 🙂 Una pregunta {rápida|corta} para [empresa]: ¿cuántos mensajes o llamadas de clientes se os quedan sin contestar a la semana? {Te lo pregunto|Lo pregunto} porque estamos ayudando a negocios {parecidos|de vuestro sector} a recuperarlos.\n\nSi no te interesa, dímelo y no vuelvo a escribirte.",
];

const PEBAI_WA_CONFIG = [
    'limite_dia' => 30,
    'ventanas' => [['08:30', '13:00'], ['17:00', '20:00']],
    'dias' => [1, 2, 3, 4, 5],          // lunes a viernes
    'pausa_min' => 240,                  // nunca dos envíos con menos de 4 minutos
    'plantillas' => PEBAI_WA_PLANTILLAS,
];

// Festivos nacionales fijos (mm-dd): ese día no sale nada.
const PEBAI_FESTIVOS = ['01-01', '01-06', '05-01', '08-15', '10-12', '11-01', '12-06', '12-08', '12-25'];

// Palabras que convierten una respuesta en baja automática (además de marcarla a mano en el panel).
const PEBAI_BAJA_RE = '/\b(baja|no me interesa|no nos interesa|no interesa|no (me |nos )?escrib|no (me |nos )?molest|stop|borr(a|ad|en)|elimin(a|ad|en)|spam|denunci)/iu';

function pebai_agentes_db(): PDO
{
    static $ready = false;
    $db = pebai_db();
    if (!$ready) {
        $db->exec('CREATE TABLE IF NOT EXISTS prospectos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL DEFAULT "",
            empresa TEXT NOT NULL DEFAULT "",
            nombre TEXT NOT NULL DEFAULT "",
            telefono TEXT NOT NULL UNIQUE,
            sector TEXT NOT NULL DEFAULT "",
            ciudad TEXT NOT NULL DEFAULT "",
            web TEXT NOT NULL DEFAULT "",
            origen_dato TEXT NOT NULL DEFAULT "",
            lote TEXT NOT NULL DEFAULT "",
            notas TEXT NOT NULL DEFAULT "",
            estado TEXT NOT NULL DEFAULT "pendiente",
            enviando_at TEXT NOT NULL DEFAULT "",
            enviado_at TEXT NOT NULL DEFAULT "",
            respondido_at TEXT NOT NULL DEFAULT "",
            error TEXT NOT NULL DEFAULT ""
        )');
        $db->exec('CREATE INDEX IF NOT EXISTS idx_prospectos_estado ON prospectos(estado)');
        $db->exec('CREATE TABLE IF NOT EXISTS agente_mensajes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ts TEXT NOT NULL,
            agente TEXT NOT NULL,
            prospecto_id INTEGER NOT NULL DEFAULT 0,
            telefono TEXT NOT NULL DEFAULT "",
            sentido TEXT NOT NULL,
            texto TEXT NOT NULL DEFAULT ""
        )');
        $db->exec('CREATE INDEX IF NOT EXISTS idx_agmsg_ts ON agente_mensajes(agente, ts)');
        $db->exec('CREATE TABLE IF NOT EXISTS agente_estado (
            agente TEXT PRIMARY KEY,
            latido_at TEXT NOT NULL DEFAULT "",
            estado TEXT NOT NULL DEFAULT "",
            detalle TEXT NOT NULL DEFAULT "",
            codigo TEXT NOT NULL DEFAULT "",
            pausado INTEGER NOT NULL DEFAULT 0,
            config TEXT NOT NULL DEFAULT "{}",
            alerta_at TEXT NOT NULL DEFAULT ""
        )');
        $db->exec('CREATE TABLE IF NOT EXISTS bajas (
            telefono TEXT PRIMARY KEY,
            ts TEXT NOT NULL,
            motivo TEXT NOT NULL DEFAULT ""
        )');
        $db->exec("INSERT OR IGNORE INTO agente_estado (agente, estado) VALUES ('whatsapp', 'sin_arrancar')");
        $ready = true;
    }
    return $db;
}

function pebai_agente(string $agente): array
{
    $q = pebai_agentes_db()->prepare('SELECT * FROM agente_estado WHERE agente = ?');
    $q->execute([$agente]);
    return $q->fetch() ?: ['agente' => $agente, 'latido_at' => '', 'estado' => 'sin_arrancar', 'detalle' => '', 'codigo' => '', 'pausado' => 0, 'config' => '{}', 'alerta_at' => ''];
}

function pebai_wa_config(): array
{
    $saved = json_decode(pebai_agente('whatsapp')['config'] ?: '{}', true) ?: [];
    $cfg = array_merge(PEBAI_WA_CONFIG, array_intersect_key($saved, PEBAI_WA_CONFIG));
    $cfg['limite_dia'] = max(0, min(200, (int)$cfg['limite_dia']));
    if (!$cfg['plantillas']) {
        $cfg['plantillas'] = PEBAI_WA_PLANTILLAS;
    }
    return $cfg;
}

/** Tramos de envío de hoy como [inicio, fin] en timestamps (vacío si hoy no se envía). */
function pebai_wa_tramos(int $dia, array $cfg): array
{
    if (!in_array((int)date('N', $dia), array_map('intval', $cfg['dias']), true) || in_array(date('m-d', $dia), PEBAI_FESTIVOS, true)) {
        return [];
    }
    $base = date('Y-m-d', $dia);
    $out = [];
    foreach ($cfg['ventanas'] as [$a, $b]) {
        $out[] = [strtotime("$base $a"), strtotime("$base $b")];
    }
    return $out;
}

/** ¿Se puede enviar ahora? Devuelve si la ventana está abierta, los segundos de ventana que quedan hoy y cuándo abre la siguiente. */
function pebai_wa_ventana(?int $now = null): array
{
    $now = $now ?? time();
    $cfg = pebai_wa_config();
    $abierta = false;
    $restante = 0;
    $proxima = 0;
    foreach (pebai_wa_tramos($now, $cfg) as [$a, $b]) {
        if ($now >= $a && $now < $b) {
            $abierta = true;
            $restante += $b - $now;
        } elseif ($now < $a) {
            $restante += $b - $a;
            $proxima = $proxima ?: $a;
        }
    }
    for ($d = 1; !$proxima && $d <= 10; $d++) {
        $tramos = pebai_wa_tramos(strtotime("+$d day", strtotime(date('Y-m-d', $now))), $cfg);
        if ($tramos) {
            $proxima = $tramos[0][0];
        }
    }
    return ['abierta' => $abierta, 'restante' => $restante, 'proxima' => $proxima];
}

function pebai_wa_enviados_hoy(): int
{
    $q = pebai_agentes_db()->prepare("SELECT COUNT(*) FROM agente_mensajes WHERE agente = 'whatsapp' AND sentido = 'sale' AND ts >= ?");
    $q->execute([date('Y-m-d 00:00:00')]);
    return (int)$q->fetchColumn();
}

function pebai_wa_render(string $plantilla, array $p, ?int $now = null): string
{
    $now = $now ?? time();
    $nombre = trim(explode(' ', trim($p['nombre'] ?? ''))[0] ?? '');
    $empresa = trim(preg_replace('/[,\s]+(s\.?\s?l\.?u?|s\.?\s?a\.?|s\.?\s?l\.?\s?p\.?|s\.?\s?c\.?)\.?$/iu', '', trim($p['empresa'] ?? '')));
    $txt = strtr($plantilla, [
        '[saludo]' => (int)date('G', $now) < 14 ? 'Buenos días' : 'Buenas tardes',
        '[nombre]' => $nombre !== '' ? ', ' . mb_convert_case($nombre, MB_CASE_TITLE) : '',
        '[empresa]' => $empresa !== '' ? $empresa : 'vuestro negocio',
    ]);
    while (preg_match('/\{([^{}]*)\}/u', $txt)) {
        $txt = preg_replace_callback('/\{([^{}]*)\}/u', static function ($m) {
            $ops = explode('|', $m[1]);
            return $ops[random_int(0, count($ops) - 1)];
        }, $txt);
    }
    return trim($txt);
}

/** Pausa recomendada hasta el siguiente envío: reparte lo que queda de cupo en lo que queda de ventana, con azar. */
function pebai_wa_pausa(): int
{
    $cfg = pebai_wa_config();
    $v = pebai_wa_ventana();
    $quedan = $cfg['limite_dia'] - pebai_wa_enviados_hoy();
    if ($quedan <= 0 || $v['restante'] <= 0) {
        return 1800;
    }
    $media = $v['restante'] / $quedan;
    return (int)max($cfg['pausa_min'], min(5400, $media * (0.55 + mt_rand() / mt_getrandmax() * 0.9)));
}

/** Teléfonos que ya son solicitudes del embudo (a esos no se les escribe en frío). */
function pebai_telefonos_embudo(): array
{
    $set = [];
    foreach (pebai_db()->query('SELECT telefono FROM leads') as $r) {
        $set[pebai_phone_digits((string)$r['telefono'])] = true;
    }
    return $set;
}

function pebai_wa_baja(string $telefono, string $motivo): void
{
    $db = pebai_agentes_db();
    $now = date('Y-m-d H:i:s');
    $db->prepare('INSERT OR IGNORE INTO bajas (telefono, ts, motivo) VALUES (?, ?, ?)')->execute([$telefono, $now, mb_substr($motivo, 0, 300)]);
    $db->prepare("UPDATE prospectos SET estado = 'baja', updated_at = ? WHERE telefono = ?")->execute([$now, $telefono]);
}

/** Normaliza un móvil español para WhatsApp. Devuelve '' si no parece un móvil (los fijos no tienen WhatsApp casi nunca). */
function pebai_wa_movil(string $tel): string
{
    $d = pebai_phone_digits($tel);
    if (str_starts_with($d, '0034')) {
        $d = substr($d, 2);
    }
    if (preg_match('/^34[67]\d{8}$/', $d)) {
        return $d;
    }
    return preg_match('/^(?!34)\d{10,15}$/', $d) ? $d : '';
}

/**
 * Importa prospectos desde CSV/TSV o texto pegado. Columnas reconocidas por cabecera:
 * empresa, nombre, telefono, sector, ciudad, web, origen (de dónde sale el número), notas.
 * Sin cabecera: empresa;telefono;sector;ciudad. Devuelve el resumen de lo que ha pasado.
 */
function pebai_prospectos_importar(string $raw, string $origenDefecto, string $lote): array
{
    $db = pebai_agentes_db();
    $raw = preg_replace('/^\xEF\xBB\xBF/', '', str_replace(["\r\n", "\r"], "\n", $raw));
    $lineas = array_values(array_filter(explode("\n", $raw), static fn($l) => trim($l) !== ''));
    $res = ['nuevos' => 0, 'repetidos' => 0, 'invalidos' => 0, 'bajas' => 0, 'embudo' => 0];
    if (!$lineas) {
        return $res;
    }
    $sep = substr_count($lineas[0], "\t") ? "\t" : (substr_count($lineas[0], ';') >= substr_count($lineas[0], ',') ? ';' : ',');
    $norm = static fn($s) => strtolower(trim(strtr($s, ['á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ñ' => 'n', 'Á' => 'a', 'É' => 'e', 'Í' => 'i', 'Ó' => 'o', 'Ú' => 'u'])));
    $alias = ['empresa' => ['empresa', 'negocio', 'nombre empresa', 'name', 'title', 'company'], 'nombre' => ['nombre', 'contacto', 'persona'],
              'telefono' => ['telefono', 'tel', 'movil', 'phone', 'whatsapp', 'numero'], 'sector' => ['sector', 'nicho', 'categoria', 'category'],
              'ciudad' => ['ciudad', 'localidad', 'municipio', 'city', 'provincia'], 'web' => ['web', 'website', 'url', 'pagina'],
              'origen_dato' => ['origen', 'fuente', 'origen_dato', 'source'], 'notas' => ['notas', 'nota', 'comentarios']];
    $head = array_map($norm, str_getcsv($lineas[0], $sep));
    $map = [];
    foreach ($alias as $campo => $nombres) {
        foreach ($head as $i => $h) {
            if (in_array($h, $nombres, true) && !isset($map[$campo])) {
                $map[$campo] = $i;
            }
        }
    }
    if (isset($map['telefono'])) {
        array_shift($lineas);
    } else {
        $map = ['empresa' => 0, 'telefono' => 1, 'sector' => 2, 'ciudad' => 3];
    }
    $bajas = array_fill_keys($db->query('SELECT telefono FROM bajas')->fetchAll(PDO::FETCH_COLUMN), true);
    $embudo = pebai_telefonos_embudo();
    $now = date('Y-m-d H:i:s');
    $ins = $db->prepare('INSERT OR IGNORE INTO prospectos (created_at, updated_at, empresa, nombre, telefono, sector, ciudad, web, origen_dato, lote, notas, estado)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $db->beginTransaction();
    foreach ($lineas as $linea) {
        $c = str_getcsv($linea, $sep);
        $get = static fn($k) => isset($map[$k], $c[$map[$k]]) ? mb_substr(trim($c[$map[$k]]), 0, 300) : '';
        $tel = pebai_wa_movil($get('telefono'));
        if ($tel === '') {
            $res['invalidos']++;
            continue;
        }
        $estado = 'pendiente';
        if (isset($bajas[$tel])) {
            $estado = 'baja';
            $res['bajas']++;
        } elseif (isset($embudo[$tel])) {
            $estado = 'descartado';
            $res['embudo']++;
        }
        $ins->execute([$now, $now, $get('empresa'), $get('nombre'), $tel, $get('sector'), $get('ciudad'), $get('web'),
                       $get('origen_dato') ?: $origenDefecto, $lote, $get('notas'), $estado]);
        if ($ins->rowCount()) {
            if ($estado === 'pendiente') {
                $res['nuevos']++;
            }
        } else {
            $res['repetidos']++;
        }
    }
    $db->commit();
    return $res;
}

/** Aviso por email al equipo cuando el bot se cae o pierde la vinculación (como mucho uno cada 6 h). */
function pebai_agente_alerta(string $agente, string $titulo, string $texto): void
{
    $db = pebai_agentes_db();
    $a = pebai_agente($agente);
    if ($a['alerta_at'] !== '' && strtotime($a['alerta_at']) > time() - 6 * 3600) {
        return;
    }
    $db->prepare('UPDATE agente_estado SET alerta_at = ? WHERE agente = ?')->execute([date('Y-m-d H:i:s'), $agente]);
    try {
        $html = '<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#12121A"><h2 style="margin:0 0 8px">' . h($titulo) . '</h2><p>' . nl2br(h($texto))
              . '</p><p><a href="https://panel.pebaisystems.es/?tab=agentes" style="color:#493AC4;font-weight:bold">Abrir el panel de agentes →</a></p></div>';
        pebai_smtp_send(pebai_config()['notify_to'], '⚠️ ' . $titulo, $html, $titulo . "\n\n" . $texto . "\n\nhttps://panel.pebaisystems.es/?tab=agentes", 'PEBAI · Agentes');
    } catch (Throwable $e) {
        pebai_log('ALERTA AGENTE: ' . $e->getMessage());
    }
}

/** Lo llama el cron cada 15 min: si el bot lleva más de 30 min sin dar señales en horario de envío, avisa. */
function pebai_agentes_vigilar(): void
{
    $a = pebai_agente('whatsapp');
    if ((int)$a['pausado'] || $a['estado'] === 'sin_arrancar' || $a['latido_at'] === '') {
        return;
    }
    if (strtotime($a['latido_at']) < time() - 1800) {
        pebai_agente_alerta('whatsapp', 'El agente de WhatsApp no da señales',
            'Último latido: ' . pebai_fecha($a['latido_at']) . ".\nEl proceso del servidor puede haberse parado. Hay que volver a arrancarlo (python deploy/desplegar_agente_whatsapp.py).");
    }
}
