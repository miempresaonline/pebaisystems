<?php
/*
 * PEBAI · Agente de email en frío (departamento de Captación).
 * Estrategia y reglas: docs/captacion-email.md. Motivo real → pregunta de una palabra → permiso.
 *
 * Todo corre en el servidor: api/email-cron.php (cron de hPanel cada 5 min) lee las respuestas por IMAP
 * y, si toca, envía UN email por SMTP desde el buzón del frío (private/config.php → 'email_frio').
 * El panel (Captación › Email, Automático › Agentes) solo lee y cambia el estado.
 *
 * Seguridad de diseño:
 *   - Sin buzón configurado, sin ficha del nicho o sin vídeo grabado del nicho, no se envía nada.
 *   - Comprobación antes de CADA envío (pebai_email_qa) y frenos automáticos (rebotes, quejas, errores SMTP).
 *   - Las bajas son para siempre y se comparten con WhatsApp (tabla `bajas` por teléfono).
 * Compatible con PHP 8.0 (el del cron de Hostinger).
 *
 * OJO: Automático › Oficina (panel/_oficina_panel.php, función of_email) lee estas funciones y tablas. No renombrarlas
 * sin avisar al chat del Panel: pebai_agente('email'), pebai_email_cfg(), pebai_email_limite(), pebai_email_enviados_hoy(),
 * pebai_email_ventana(), pebai_email_salud(), email_prospectos.estado y agente_actividad (agente 'email').
 */
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}
require_once __DIR__ . '/_agentes_lib.php';
require_once __DIR__ . '/_actividad_lib.php'; // cada decisión del agente queda apuntada (Automático › Agentes)

const PEBAI_EMAIL_ESTADOS = ['pendiente', 'enviado', 'recordado', 'respondio', 'interesado', 'baja', 'rebote', 'descartado', 'error'];

// Subida de volumen: cada escalón dura como mínimo 7 días y solo se sube si el anterior salió limpio.
const PEBAI_EMAIL_ESCALONES = [10, 20, 35, 50];

// Señales del scraper: cuánto tiempo vale cada una y cuánta prioridad da (docs/captacion-email.md §3).
const PEBAI_EMAIL_SENALES = [
    'anuncios' => ['Anuncios activos', 14, 50],
    'empleo'   => ['Oferta de empleo de atención', 30, 45],
    'resenas'  => ['Reseñas: cuesta contactar', 90, 40],
    'apertura' => ['Apertura o nueva sede', 60, 35],
    'atencion' => ['Sin atención fuera de horario', 90, 30],
    // Obligación legal con plazo que afecta a su sector (p. ej. Ley 10/2025 de atención a la clientela, hasta el 28/12/2026).
    // Caduca en la fecha límite (columna motivo_caduca del CSV); después ya no es un motivo.
    'normativa' => ['Obligación legal con plazo', 90, 25],
    'ninguna'  => ['Sin señal (motivo de sector)', 3650, 0],
];

// [oferta] = "He grabado un vídeo de un minuto sobre [momento]. ¿Te lo mando?" si el vídeo del nicho existe;
// si no, la alternativa sin vídeo de la ficha (nunca se promete un vídeo que no está grabado).
const PEBAI_EMAIL_OFERTA_VIDEO = 'He grabado un vídeo de un minuto sobre [momento]. ¿{Te lo mando|Te lo paso}?';
const PEBAI_EMAIL_PLANTILLA = "Hola[nombre]:\n\n[motivo]\n\n[pregunta]\n\n[oferta]\n\nTu email lo saqué de vuestra página de contacto. Si no te interesa, dímelo y no vuelvo a escribirte.\n\nDaniel\nPEBAI Systems";
const PEBAI_EMAIL_RECORDATORIO = "Hola[nombre]:\n\n¿Te lo mando o lo dejo aquí?\n\nDaniel";
const PEBAI_EMAIL_ASUNTOS = ['[empresa_corta]', 'pregunta sobre [empresa_corta]'];

const PEBAI_EMAIL_CONFIG = [
    'limite_max' => 50,
    'tope_total' => 0,          // tope de primeros emails en total (prueba: 200). 0 = sin tope. Al llegar, deja de escribir a nuevos.
    'escalon' => 0,
    'escalon_desde' => '',
    'ventanas' => [['09:00', '13:30'], ['16:00', '18:30']],
    'dias' => [1, 2, 3, 4, 5],
    'pausa_min' => 180,
    'recordatorio_dias' => 3,
    'plantilla' => PEBAI_EMAIL_PLANTILLA,
    'recordatorio' => PEBAI_EMAIL_RECORDATORIO,
    'asuntos' => PEBAI_EMAIL_ASUNTOS,
    // Ficha por nicho (§4.4): producto, momento, pregunta, meses en los que se escribe y si el vídeo ya está grabado.
    'nichos' => [],
    // Pregunta por tipo de señal; [producto] y [momento] salen de la ficha del nicho. Si falta, se usa la del nicho.
    'preguntas_senal' => [
        'anuncios' => 'Cuando os entra una solicitud de esos anuncios un sábado por la tarde, ¿la atendéis ese día o el lunes?',
        'empleo'   => 'Mientras encontráis a esa persona, ¿quién atiende las consultas que llegan por la tarde?',
        'resenas'  => '¿Os pasa más por volumen de llamadas o por el horario?',
        'apertura' => '¿Las consultas de los dos sitios las lleva la misma persona?',
        'atencion' => 'Si alguien lo rellena a las diez de la noche, ¿cuándo le contesta alguien?',
        'normativa' => '¿Tenéis ya medido cuántas llamadas atendéis en menos de tres minutos?',
    ],
];

// Nunca en los dos primeros emails (§2.4). Se comprueba antes de cada envío.
const PEBAI_EMAIL_PROHIBIDAS = ['http', 'www.', '.com', 'gratis', 'gratuit', 'consultoría', 'consultoria', 'plazas', 'nuestro precio', 'nuestros precios', '€', 'descuento', 'promoci',
    'inteligencia artificial', ' ia ', ' ia,', ' ia.', 'automatiz', 'chatbot', 'ahorra', 'ahorro', 'garantiz', 'resultados', 'clientes nuestros', 're:'];
const PEBAI_EMAIL_ROLES_NO = ['noreply', 'no-reply', 'no_reply', 'donotreply', 'webmaster', 'postmaster', 'abuse', 'mailer-daemon', 'hostmaster', 'privacy', 'privacidad', 'rgpd', 'dpo', 'lopd', 'facturacion', 'factura', 'admin@'];
const PEBAI_EMAIL_GRATUITOS = ['gmail.com', 'googlemail.com', 'hotmail.com', 'hotmail.es', 'outlook.com', 'outlook.es', 'live.com', 'yahoo.com', 'yahoo.es', 'icloud.com', 'me.com', 'msn.com', 'aol.com', 'gmx.es', 'gmx.com', 'proton.me', 'protonmail.com', 'telefonica.net', 'ono.com'];

// Clasificación de respuestas.
const PEBAI_EMAIL_AUTO_RE = '/(fuera de (la )?oficina|respuesta autom|out of (the )?office|automatic reply|auto.?reply|autoreply|vacaciones|estar[eé] ausente|no estar[eé] disponible|ausencia|abwesend|absence)/iu';
const PEBAI_EMAIL_SI_RE = '/^\W*(s[ií]|vale|ok|okey|claro|adelante|venga|perfecto|por favor|m[aá]ndamelo|m[aá]ndalo|env[ií]a(lo|melo)|p[aá]sa(lo|melo)|enviadlo|mandadlo|me interesa|interesante|de acuerdo|genial)\b/iu';
const PEBAI_EMAIL_NO_RE = '/(\bno,? gracias|no me interesa|no nos interesa|no estamos interesad|no interesa|no necesit|baja\b|darme de baja|dadme de baja|no (me |nos )?(volv[aá]is a )?escrib|no (me |nos )?molest|no quiero|no queremos|stop\b|unsubscribe|borr(a|ad|en)|elimin(a|ad|en)|spam|denunci|lopd|rgpd|protecci[oó]n de datos)/iu';

/* ------------------------------------------------------------------ datos --- */

function pebai_email_db(): PDO
{
    static $ready = false;
    $db = pebai_agentes_db();
    if (!$ready) {
        $db->exec('CREATE TABLE IF NOT EXISTS email_prospectos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL DEFAULT "",
            empresa TEXT NOT NULL DEFAULT "",
            nombre TEXT NOT NULL DEFAULT "",
            email TEXT NOT NULL UNIQUE,
            dominio TEXT NOT NULL DEFAULT "",
            tipo_email TEXT NOT NULL DEFAULT "",
            origen_email TEXT NOT NULL DEFAULT "",
            telefono TEXT NOT NULL DEFAULT "",
            sector TEXT NOT NULL DEFAULT "",
            nicho TEXT NOT NULL DEFAULT "",
            ciudad TEXT NOT NULL DEFAULT "",
            web TEXT NOT NULL DEFAULT "",
            senal TEXT NOT NULL DEFAULT "ninguna",
            motivo TEXT NOT NULL DEFAULT "",
            motivo_fuente TEXT NOT NULL DEFAULT "",
            motivo_fecha TEXT NOT NULL DEFAULT "",
            motivo_caduca TEXT NOT NULL DEFAULT "",
            prioridad INTEGER NOT NULL DEFAULT 0,
            lote TEXT NOT NULL DEFAULT "",
            notas TEXT NOT NULL DEFAULT "",
            estado TEXT NOT NULL DEFAULT "pendiente",
            paso INTEGER NOT NULL DEFAULT 0,
            asunto TEXT NOT NULL DEFAULT "",
            msgid TEXT NOT NULL DEFAULT "",
            enviado1_at TEXT NOT NULL DEFAULT "",
            enviado2_at TEXT NOT NULL DEFAULT "",
            respondido_at TEXT NOT NULL DEFAULT "",
            no_antes TEXT NOT NULL DEFAULT "",
            token TEXT NOT NULL DEFAULT "",
            error TEXT NOT NULL DEFAULT ""
        )');
        $db->exec('CREATE INDEX IF NOT EXISTS idx_emailp_estado ON email_prospectos(estado, prioridad)');
        $db->exec('CREATE INDEX IF NOT EXISTS idx_emailp_dominio ON email_prospectos(dominio)');
        $db->exec('CREATE TABLE IF NOT EXISTS bajas_email (
            email TEXT PRIMARY KEY,
            dominio TEXT NOT NULL DEFAULT "",
            ts TEXT NOT NULL,
            motivo TEXT NOT NULL DEFAULT ""
        )');
        $db->exec('CREATE TABLE IF NOT EXISTS email_imap (clave TEXT PRIMARY KEY, valor TEXT NOT NULL DEFAULT "")');
        $db->exec("INSERT OR IGNORE INTO agente_estado (agente, estado) VALUES ('email', 'sin_configurar')");
        $ready = true;
    }
    return $db;
}

function pebai_email_cfg(): array
{
    pebai_email_db();
    $saved = json_decode(pebai_agente('email')['config'] ?: '{}', true) ?: [];
    $cfg = array_merge(PEBAI_EMAIL_CONFIG, array_intersect_key($saved, PEBAI_EMAIL_CONFIG));
    $cfg['limite_max'] = max(0, min(50, (int)$cfg['limite_max']));     // 50 al día es el techo desde este dominio
    $cfg['escalon'] = max(0, min(count(PEBAI_EMAIL_ESCALONES) - 1, (int)$cfg['escalon']));
    return $cfg;
}

function pebai_email_cfg_guardar(array $cambios): void
{
    $actual = json_decode(pebai_agente('email')['config'] ?: '{}', true) ?: [];
    $nuevo = array_intersect_key(array_merge($actual, $cambios), PEBAI_EMAIL_CONFIG);
    pebai_email_db()->prepare("UPDATE agente_estado SET config = ? WHERE agente = 'email'")
        ->execute([json_encode($nuevo, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)]);
}

/** Buzón del frío desde private/config.php. Nunca equipo@ (el del embudo). Devuelve null si no está configurado. */
function pebai_email_buzon(): ?array
{
    $b = pebai_config()['email_frio'] ?? null;
    if (!is_array($b) || empty($b['user']) || empty($b['pass'])) {
        return null;
    }
    $embudo = strtolower((string)(pebai_config()['smtp']['user'] ?? ''));
    if (strtolower($b['user']) === $embudo) {
        return null; // regla: el frío nunca sale del buzón del embudo
    }
    return $b + ['from_name' => 'Daniel · PEBAI Systems', 'smtp_host' => 'smtp.hostinger.com', 'smtp_port' => 465, 'smtp_secure' => 'ssl',
                 'imap' => '{imap.hostinger.com:993/imap/ssl}', 'avisar_a' => '', 'enviados' => ''];
}

function pebai_email_limite(array $cfg): int
{
    return min($cfg['limite_max'], PEBAI_EMAIL_ESCALONES[$cfg['escalon']]);
}

/** Primeros emails enviados desde siempre (para el tope de la prueba). */
function pebai_email_primeros_total(): int
{
    return (int)pebai_email_db()->query("SELECT COUNT(*) FROM email_prospectos WHERE paso >= 1")->fetchColumn();
}

function pebai_email_enviados_hoy(): int
{
    $q = pebai_email_db()->prepare("SELECT COUNT(*) FROM agente_mensajes WHERE agente = 'email' AND sentido = 'sale' AND ts >= ?");
    $q->execute([date('Y-m-d 00:00:00')]);
    return (int)$q->fetchColumn();
}

/* --------------------------------------------------------------- calendario --- */

/** Domingo de Pascua (algoritmo de Gauss/Meeus, sin depender de la extensión calendar). */
function pebai_pascua(int $y): int
{
    $a = $y % 19; $b = intdiv($y, 100); $c = $y % 100; $d = intdiv($b, 4); $e = $b % 4;
    $f = intdiv($b + 8, 25); $g = intdiv($b - $f + 1, 3); $h = (19 * $a + $b - $d - $g + 15) % 30;
    $i = intdiv($c, 4); $k = $c % 4; $l = (32 + 2 * $e + 2 * $i - $h - $k) % 7; $m = intdiv($a + 11 * $h + 22 * $l, 451);
    $mes = intdiv($h + $l - 7 * $m + 114, 31); $dia = (($h + $l - 7 * $m + 114) % 31) + 1;
    return mktime(12, 0, 0, $mes, $dia, $y);
}

/** Días en que no se escribe a nadie: agosto, del 20/12 al 7/1, de Jueves Santo a Lunes de Pascua y festivos nacionales. */
function pebai_email_dia_bloqueado(int $ts): bool
{
    $md = date('m-d', $ts);
    if (date('m', $ts) === '08' || $md >= '12-20' || $md <= '01-07' || in_array($md, PEBAI_FESTIVOS, true)) {
        return true;
    }
    $p = pebai_pascua((int)date('Y', $ts));
    $dia = strtotime(date('Y-m-d 12:00:00', $ts));
    return $dia >= $p - 3 * 86400 && $dia <= $p + 86400;
}

function pebai_email_tramos(int $dia, array $cfg): array
{
    return pebai_email_dia_bloqueado($dia) ? [] : pebai_wa_tramos($dia, $cfg);
}

function pebai_email_ventana(?int $now = null): array
{
    $now = $now ?? time();
    $cfg = pebai_email_cfg();
    $abierta = false;
    $restante = 0;
    $proxima = 0;
    foreach (pebai_email_tramos($now, $cfg) as [$a, $b]) {
        if ($now >= $a && $now < $b) {
            $abierta = true;
            $restante += $b - $now;
        } elseif ($now < $a) {
            $restante += $b - $a;
            $proxima = $proxima ?: $a;
        }
    }
    for ($d = 1; !$proxima && $d <= 45; $d++) {
        $t = pebai_email_tramos(strtotime("+$d day", strtotime(date('Y-m-d', $now))), $cfg);
        if ($t) {
            $proxima = $t[0][0];
        }
    }
    return ['abierta' => $abierta, 'restante' => $restante, 'proxima' => $proxima];
}

/** Suma N días laborables (sin fines de semana ni días bloqueados). */
function pebai_email_mas_laborables(int $desde, int $n): int
{
    $t = $desde;
    while ($n > 0) {
        $t += 86400;
        if ((int)date('N', $t) <= 5 && !pebai_email_dia_bloqueado($t)) {
            $n--;
        }
    }
    return $t;
}

/* --------------------------------------------------------------- utilidades --- */

function pebai_email_norm(string $email): string
{
    return strtolower(trim($email, " \t\n\r\0\x0B<>\"';,"));
}

function pebai_email_dominio(string $email): string
{
    return strtolower((string)substr(strrchr($email, '@') ?: '', 1));
}

function pebai_email_empresa_corta(string $empresa): string
{
    // Los nombres de Google Maps traen coletillas ("Proyectar SL - Reformas integrales - Construcción"): se queda el nombre.
    $e = preg_split('/\s+[-–—|·]\s+|\s*[|(]\s*|\.\s+/u', trim($empresa))[0] ?? '';
    $e = trim(preg_replace('/[,\s]+(s\.?\s?l\.?u?|s\.?\s?a\.?|s\.?\s?l\.?\s?p\.?|s\.?\s?c\.?|s\.?\s?coop\.?)\.?$/iu', '', trim($e, " .,")));
    $palabras = preg_split('/\s+/u', $e, -1, PREG_SPLIT_NO_EMPTY);
    if (count($palabras) > 4) {
        $e = implode(' ', array_slice($palabras, 0, 4));
    }
    return $e !== '' ? $e : 'vuestra empresa';
}

/** Convierte el motivo del scraper en una frase: «en vuestra web no hay chat…» → «He visto que en vuestra web no hay chat….». */
function pebai_email_motivo_frase(string $m, string $senal = ''): string
{
    $m = trim(preg_replace('/\s+/u', ' ', $m), " \t.");
    if ($m === '') {
        return '';
    }
    $primera = mb_substr($m, 0, 1);
    // Una obligación legal no se «ha visto»: va tal cual («Antes del 28 de diciembre, la Ley…»).
    if ($senal !== 'normativa' && $primera === mb_strtolower($primera) && !preg_match('/^(he|hemos|leyendo|vi|veo)\b/iu', $m)) {
        $m = 'He visto que ' . $m;
    }
    return mb_strtoupper(mb_substr($m, 0, 1)) . mb_substr($m, 1) . '.';
}

function pebai_email_spintax(string $t): string
{
    while (preg_match('/\{([^{}]*)\}/u', $t)) {
        $t = preg_replace_callback('/\{([^{}]*)\}/u', static function ($m) {
            $ops = explode('|', $m[1]);
            return $ops[random_int(0, count($ops) - 1)];
        }, $t);
    }
    return $t;
}

function pebai_email_palabras(string $t): int
{
    return count(preg_split('/\s+/u', trim($t), -1, PREG_SPLIT_NO_EMPTY));
}

/* ----------------------------------------------------------------- textos --- */

/** Arma asunto y cuerpo de un paso (1 = primer email, 2 = recordatorio). Devuelve null si falta la ficha del nicho. */
function pebai_email_componer(array $p, int $paso, array $cfg): ?array
{
    $nombre = trim(explode(' ', trim($p['nombre']))[0] ?? '');
    $vars = [
        '[nombre]' => $nombre !== '' ? ', ' . mb_convert_case($nombre, MB_CASE_TITLE) : '',
        '[empresa]' => trim($p['empresa']) ?: 'vuestra empresa',
        '[empresa_corta]' => mb_strtolower(pebai_email_empresa_corta($p['empresa'])),
    ];
    if ($paso === 2) {
        $rec = $cfg['recordatorio'];
        $fichaRec = $cfg['nichos'][$p['nicho']] ?? [];
        if (empty($fichaRec['video'])) {
            $rec = str_replace(['¿Te lo mando', '¿te lo mando'], ['¿Te lo cuento', '¿te lo cuento'], $rec); // sin vídeo no hay nada que «mandar»
        }
        return ['asunto' => 'Re: ' . $p['asunto'], 'texto' => trim(strtr(pebai_email_spintax($rec), $vars))];
    }
    $ficha = $cfg['nichos'][$p['nicho']] ?? null;
    $oferta = !empty($ficha['video']) ? PEBAI_EMAIL_OFERTA_VIDEO : trim((string)($ficha['sin_video'] ?? ''));
    if (!$ficha || $oferta === '') {
        return null; // sin ficha, o sin vídeo y sin alternativa: no se promete nada
    }
    $pregunta = $cfg['preguntas_senal'][$p['senal']] ?? '';
    // La pregunta de "atención" habla del formulario: si el motivo no lo menciona (solo teléfono, 902…), va la del nicho.
    if ($p['senal'] === 'atencion' && !preg_match('/formulario/iu', $p['motivo'])) {
        $pregunta = '';
    }
    if ($pregunta === '' || $p['senal'] === 'ninguna') {
        $pregunta = $ficha['pregunta'] ?? '';
    }
    $motivo = pebai_email_motivo_frase($p['motivo'], $p['senal']);
    if ($motivo === '') {
        $motivo = 'He visto ' . pebai_email_empresa_corta($p['empresa']) . ' buscando ' . mb_strtolower($ficha['nombre'] ?? $p['sector']) . ($p['ciudad'] !== '' ? ' en ' . $p['ciudad'] : '') . '.';
    }
    $vars += ['[motivo]' => $motivo, '[pregunta]' => $pregunta, '[oferta]' => $oferta, '[momento]' => $ficha['momento'] ?? '', '[producto]' => $ficha['producto'] ?? ''];
    $texto = strtr($cfg['plantilla'], $vars);
    $texto = strtr($texto, $vars); // la pregunta puede traer [producto]/[momento]
    $asuntos = array_values($cfg['asuntos']) ?: PEBAI_EMAIL_ASUNTOS;
    return [
        'asunto' => trim(strtr(pebai_email_spintax($asuntos[random_int(0, count($asuntos) - 1)]), $vars)),
        'texto' => trim(pebai_email_spintax($texto)),
    ];
}

/**
 * Comprobación antes de cada envío (§7). Devuelve la lista de problemas; vacía = se puede enviar.
 * $comprobarDns = false en pruebas.
 */
function pebai_email_qa(array $p, array $msg, int $paso, bool $comprobarDns = true): array
{
    $db = pebai_email_db();
    $err = [];
    $email = $p['email'];
    $local = (string)strstr($email, '@', true);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $err[] = 'email no válido';
    }
    foreach (PEBAI_EMAIL_ROLES_NO as $r) {
        if (str_starts_with($local . '@', rtrim($r, '@') . '@') || $local === rtrim($r, '@')) {
            $err[] = 'dirección de sistema (' . $r . ')';
        }
    }
    if ($comprobarDns && !checkdnsrr($p['dominio'], 'MX')) {
        $err[] = 'el dominio no recibe correo (sin MX)';
    }
    $q = $db->prepare('SELECT COUNT(*) FROM bajas_email WHERE email = ? OR (dominio <> "" AND dominio = ? AND motivo LIKE "dominio:%")');
    $q->execute([$email, $p['dominio']]);
    if ((int)$q->fetchColumn()) {
        $err[] = 'tiene baja';
    }
    if ($p['telefono'] !== '') {
        $q = $db->prepare('SELECT COUNT(*) FROM bajas WHERE telefono = ?');
        $q->execute([$p['telefono']]);
        if ((int)$q->fetchColumn()) {
            $err[] = 'tiene baja en WhatsApp';
        }
        if (isset(pebai_telefonos_embudo()[$p['telefono']])) {
            $err[] = 'ya es solicitud del embudo';
        }
        if ($paso === 1) {
            $q = $db->prepare("SELECT COUNT(*) FROM prospectos WHERE telefono = ? AND (enviando_at >= ? OR enviado_at >= ? OR estado = 'pendiente')");
            $hace30 = date('Y-m-d H:i:s', time() - 30 * 86400);
            $q->execute([$p['telefono'], $hace30, $hace30]);
            if ((int)$q->fetchColumn()) {
                $err[] = 'está en la cola de WhatsApp o le escribió hace menos de 30 días';
            }
        }
    }
    // Un solo canal a la vez también cuando el teléfono no coincide: misma web o mismo dominio que un prospecto de WhatsApp.
    if ($paso === 1) {
        $base = static function (string $u): string {
            $h = preg_replace('/^www\./', '', strtolower((string)parse_url(str_contains($u, '://') ? $u : 'https://' . $u, PHP_URL_HOST)));
            return implode('.', array_slice(explode('.', $h), -2));
        };
        $mios = array_filter([$base($p['web']), $p['tipo_email'] !== 'gratuito' ? $base($p['dominio']) : '']);
        if ($mios) {
            $hace30 = date('Y-m-d H:i:s', time() - 30 * 86400);
            $q = $db->prepare("SELECT web FROM prospectos WHERE web <> '' AND (estado IN ('pendiente','enviando') OR enviado_at >= ? OR enviando_at >= ?)");
            $q->execute([$hace30, $hace30]);
            foreach ($q->fetchAll(PDO::FETCH_COLUMN) as $w) {
                if (in_array($base($w), $mios, true)) {
                    $err[] = 'la misma empresa está en la cola de WhatsApp o le escribió hace menos de 30 días';
                    break;
                }
            }
        }
    }
    $q = $db->prepare('SELECT COUNT(*) FROM leads WHERE lower(cliente_email) = ?');
    $q->execute([$email]);
    if ((int)$q->fetchColumn()) {
        $err[] = 'ya es solicitud del embudo';
    }
    if ($paso === 1) {
        if ($p['motivo_caduca'] !== '' && $p['motivo_caduca'] < date('Y-m-d')) {
            $err[] = 'la señal ha caducado: hay que volver a comprobarla';
        }
        $q = $db->prepare("SELECT COUNT(*) FROM email_prospectos WHERE dominio = ? AND id <> ? AND paso > 0 AND tipo_email <> 'gratuito'");
        $q->execute([$p['dominio'], $p['id']]);
        if ((int)$q->fetchColumn()) {
            $err[] = 'ya se escribió a otra persona de esta empresa';
        }
        $n = pebai_email_palabras($msg['texto']);
        if ($n < 35 || $n > 95) {
            $err[] = "longitud fuera de rango ($n palabras)";
        }
        // El nombre de la empresa no cuenta ("Ahorro Energético S.L." no es una palabra prohibida nuestra).
        $nombres = array_filter([mb_strtolower(trim($p['empresa'])), mb_strtolower(pebai_email_empresa_corta($p['empresa']))]);
        $plano = ' ' . str_replace($nombres, ' ', mb_strtolower($msg['texto'] . ' ' . $msg['asunto'])) . ' ';
        foreach (PEBAI_EMAIL_PROHIBIDAS as $w) {
            if (str_contains($plano, $w)) {
                $err[] = 'palabra prohibida: «' . trim($w) . '»';
            }
        }
        if (preg_match('/\[[a-z_]+\]/', $msg['texto'] . $msg['asunto'])) {
            $err[] = 'quedan huecos sin rellenar';
        }
    }
    return array_values(array_unique($err));
}

/* ------------------------------------------------------------------ envío --- */

function pebai_email_qp(string $t): string
{
    return quoted_printable_encode(str_replace("\n", "\r\n", str_replace(["\r\n", "\r"], "\n", $t)));
}

/**
 * Envía un email de texto plano por SMTP desde el buzón del frío. Devuelve el Message-ID.
 * Cabecera de baja con un clic (RFC 8058) y, si es recordatorio, en el mismo hilo.
 */
function pebai_email_smtp(array $b, string $to, string $asunto, string $texto, string $tokenBaja, string $inReplyTo = ''): string
{
    $dominio = pebai_email_dominio($b['user']);
    $msgid = '<' . bin2hex(random_bytes(10)) . '.' . time() . '@' . $dominio . '>';
    $baja = 'https://pebaisystems.es/baja/?t=' . rawurlencode($tokenBaja);
    $h = [
        'Date: ' . date('r'),
        'From: =?UTF-8?B?' . base64_encode($b['from_name']) . '?= <' . $b['user'] . '>',
        'To: <' . $to . '>',
        'Subject: =?UTF-8?B?' . base64_encode($asunto) . '?=',
        'Message-ID: ' . $msgid,
        'List-Unsubscribe: <mailto:' . $b['user'] . '?subject=baja>, <' . $baja . '>',
        'List-Unsubscribe-Post: List-Unsubscribe=One-Click',
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: quoted-printable',
    ];
    if ($inReplyTo !== '') {
        $h[] = 'In-Reply-To: ' . $inReplyTo;
        $h[] = 'References: ' . $inReplyTo;
    }
    $raw = implode("\r\n", $h) . "\r\n\r\n" . pebai_email_qp($texto) . "\r\n";

    $proto = ($b['smtp_secure'] ?? 'ssl') === 'ssl' ? 'ssl://' : 'tcp://';
    $fp = @stream_socket_client($proto . $b['smtp_host'] . ':' . $b['smtp_port'], $errno, $errstr, 20);
    if (!$fp) {
        throw new RuntimeException("SMTP: no conecta ($errstr)");
    }
    stream_set_timeout($fp, 30);
    $read = static function () use ($fp): string {
        $data = '';
        while (($line = fgets($fp, 1024)) !== false) {
            $data .= $line;
            if (strlen($line) < 4 || $line[3] === ' ') {
                break;
            }
        }
        return $data;
    };
    $cmd = static function (?string $line, array $ok) use ($fp, $read): string {
        if ($line !== null) {
            fwrite($fp, $line . "\r\n");
        }
        $r = $read();
        if (!in_array((int)substr($r, 0, 3), $ok, true)) {
            throw new RuntimeException('SMTP ' . ($line === null ? 'saludo' : strtok($line, ' :')) . ': ' . trim($r));
        }
        return $r;
    };
    try {
        $cmd(null, [220]);
        $cmd('EHLO ' . $dominio, [250]);
        if (($b['smtp_secure'] ?? 'ssl') === 'tls') {
            $cmd('STARTTLS', [220]);
            stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
            $cmd('EHLO ' . $dominio, [250]);
        }
        if (($b['smtp_secure'] ?? 'ssl') !== 'none') {
            $cmd('AUTH LOGIN', [334]);
            $cmd(base64_encode($b['user']), [334]);
            $cmd(base64_encode($b['pass']), [235]);
        }
        $cmd('MAIL FROM:<' . $b['user'] . '>', [250]);
        $cmd('RCPT TO:<' . $to . '>', [250, 251]);
        $cmd('DATA', [354]);
        $cmd(preg_replace('/^\./m', '..', $raw) . "\r\n.", [250]);
        fwrite($fp, "QUIT\r\n");
    } finally {
        fclose($fp);
    }
    // Copia en Enviados para que Daniel vea el hilo completo en su buzón (si falla, no pasa nada).
    if (function_exists('imap_open') && ($b['enviados'] ?? '') !== '') {
        try {
            $imap = @imap_open($b['imap'] . $b['enviados'], $b['user'], $b['pass'], 0, 1);
            if ($imap) {
                @imap_append($imap, $b['imap'] . $b['enviados'], $raw, '\\Seen');
                imap_close($imap);
            }
        } catch (Throwable $e) {
            pebai_log('EMAIL enviados: ' . $e->getMessage());
        }
    }
    return $msgid;
}

/** Siguiente envío: primero los recordatorios que tocan, luego el primer email de mayor prioridad. */
function pebai_email_siguiente(array $cfg): ?array
{
    $db = pebai_email_db();
    $q = $db->prepare("SELECT * FROM email_prospectos WHERE estado = 'enviado' AND paso = 1 AND respondido_at = '' AND (no_antes = '' OR no_antes <= ?) ORDER BY enviado1_at LIMIT 30");
    $q->execute([date('Y-m-d H:i:s')]);
    foreach ($q->fetchAll() as $p) {
        if (pebai_email_mas_laborables(strtotime($p['enviado1_at']), (int)$cfg['recordatorio_dias']) <= time()) {
            return [$p, 2];
        }
    }
    // Tope de la prueba: al llegar a N primeros emails ya no se escribe a nadie nuevo (los recordatorios siguen).
    if ((int)($cfg['tope_total'] ?? 0) > 0 && pebai_email_primeros_total() >= (int)$cfg['tope_total']) {
        return null;
    }
    // Solo nichos con ficha lista (con vídeo o con alternativa sin vídeo): el resto de la cola espera, aunque tenga más prioridad.
    $listos = array_keys(array_filter($cfg['nichos'], static fn($f) => !empty($f['video']) || trim((string)($f['sin_video'] ?? '')) !== ''));
    if (!$listos) {
        return null;
    }
    $hoyMes = (int)date('n');
    $in = implode(',', array_fill(0, count($listos), '?'));
    $q = $db->prepare("SELECT * FROM email_prospectos WHERE estado = 'pendiente' AND paso = 0 AND nicho IN ($in) AND (no_antes = '' OR no_antes <= ?) ORDER BY prioridad DESC, id LIMIT 200");
    $q->execute(array_merge($listos, [date('Y-m-d H:i:s')]));
    foreach ($q->fetchAll() as $p) {
        $ficha = $cfg['nichos'][$p['nicho']] ?? null;
        if (!empty($ficha['meses']) && !in_array($hoyMes, array_map('intval', $ficha['meses']), true)) {
            continue; // fuera de la temporada del nicho
        }
        return [$p, 1];
    }
    return null;
}

/** Marca de pausa automática por un freno, con aviso al equipo. */
function pebai_email_frenar(string $motivo): void
{
    $db = pebai_email_db();
    $db->prepare("UPDATE agente_estado SET pausado = 1, estado = 'frenado', detalle = ? WHERE agente = 'email'")->execute([mb_substr($motivo, 0, 400)]);
    pebai_actividad('email', 'freno', 'Se ha parado solo por seguridad', $motivo);
    pebai_agente_alerta('email', 'El agente de email se ha frenado solo', $motivo . "\n\nRevisa el motivo y reanúdalo a mano desde el panel (Automático › Agentes).");
}

/** Motivo por el que no envía ahora, apuntado solo cuando cambia (para que el registro diga siempre en qué está). */
function pebai_email_espera(string $motivo, string $legible): string
{
    pebai_actividad_espera('email', $legible);
    return $motivo;
}

/** Intenta UN envío si toca (horario, cupo, ritmo). Devuelve qué ha pasado. */
function pebai_email_enviar_uno(bool $forzarRitmo = false, bool $comprobarDns = true): string
{
    $db = pebai_email_db();
    $a = pebai_agente('email');
    $b = pebai_email_buzon();
    if (!$b) {
        return pebai_email_espera('sin buzón del frío configurado', 'No envía: falta el buzón del frío');
    }
    if ((int)$a['pausado']) {
        return pebai_email_espera('en pausa', $a['estado'] === 'frenado' ? 'No envía: está frenado (revisar y reanudar)' : 'No envía: en pausa desde el panel');
    }
    $cfg = pebai_email_cfg();
    $v = pebai_email_ventana();
    if (!$v['abierta']) {
        return pebai_email_espera('fuera de horario', 'Fuera de horario: vuelve ' . ($v['proxima'] ? pebai_fecha(date('Y-m-d H:i:s', $v['proxima'])) : 'el próximo día laborable'));
    }
    $limite = pebai_email_limite($cfg);
    $hoy = pebai_email_enviados_hoy();
    if ($hoy >= $limite) {
        return pebai_email_espera("cupo de hoy completo ($hoy/$limite)", "Cupo de hoy completo: $hoy de $limite. Sigue mañana");
    }
    // Ritmo: reparte lo que queda de cupo en lo que queda de ventana, con azar, y nunca por debajo de la pausa mínima.
    $ultimo = (string)$db->query("SELECT MAX(ts) FROM agente_mensajes WHERE agente = 'email' AND sentido = 'sale'")->fetchColumn();
    if (!$forzarRitmo && $ultimo !== '') {
        $gap = max($cfg['pausa_min'], $v['restante'] / max(1, $limite - $hoy));
        $objetivo = $gap * (0.6 + mt_rand() / mt_getrandmax() * 0.7);
        if (time() - strtotime($ultimo) < max($cfg['pausa_min'], $objetivo)) {
            return 'esperando entre envíos';
        }
    }
    for ($intento = 0; $intento < 5; $intento++) {
        $sig = pebai_email_siguiente($cfg);
        if (!$sig) {
            if ((int)($cfg['tope_total'] ?? 0) > 0 && pebai_email_primeros_total() >= (int)$cfg['tope_total']) {
                return pebai_email_espera('tope de la prueba alcanzado', 'Prueba completada: ' . (int)$cfg['tope_total'] . ' primeros emails enviados. Ya no escribe a nadie nuevo (los recordatorios siguen)');
            }
            return pebai_email_espera('sin prospectos listos (faltan prospectos, fichas de nicho o vídeos)', 'No envía: no hay empresas listas (faltan prospectos o la ficha del nicho)');
        }
        [$p, $paso] = $sig;
        $msg = pebai_email_componer($p, $paso, $cfg);
        $qa = $msg ? pebai_email_qa($p, $msg, $paso, $comprobarDns) : ['falta la ficha del nicho'];
        $now = date('Y-m-d H:i:s');
        // Si lo único que falla es que la empresa está con WhatsApp, el email espera una semana (no se descarta).
        $soloEspera = $qa && $paso === 1 && !array_filter($qa, static fn($x) => !str_contains($x, 'WhatsApp') || str_contains($x, 'baja'));
        if ($soloEspera) {
            $db->prepare("UPDATE email_prospectos SET no_antes = ?, error = ?, updated_at = ? WHERE id = ?")
               ->execute([date('Y-m-d H:i:s', time() + 7 * 86400), 'Espera: ' . implode('; ', $qa), $now, $p['id']]);
            pebai_actividad('email', 'bloqueo', 'Espera a ' . ($p['empresa'] ?: $p['email']) . ' una semana (está con WhatsApp)', $p['email'] . "\n" . implode('; ', $qa), 'email:' . $p['id']);
            continue;
        }
        if ($qa) {
            $estado = in_array('tiene baja', $qa, true) || in_array('tiene baja en WhatsApp', $qa, true) ? 'baja' : 'descartado';
            pebai_actividad('email', 'bloqueo', 'No escribe a ' . ($p['empresa'] ?: $p['email']) . ($paso === 2 ? ' (recordatorio)' : ''),
                $p['email'] . "\nMotivo: " . implode('; ', $qa), 'email:' . $p['id']);
            if ($paso === 2) {
                $estado = 'enviado';
                $db->prepare("UPDATE email_prospectos SET paso = 2, error = ?, updated_at = ? WHERE id = ?")->execute(['Recordatorio no enviado: ' . implode('; ', $qa), $now, $p['id']]);
                continue;
            }
            $db->prepare('UPDATE email_prospectos SET estado = ?, error = ?, updated_at = ? WHERE id = ?')->execute([$estado, implode('; ', $qa), $now, $p['id']]);
            continue;
        }
        if ($p['token'] === '') {
            $p['token'] = bin2hex(random_bytes(16));
            $db->prepare('UPDATE email_prospectos SET token = ? WHERE id = ?')->execute([$p['token'], $p['id']]);
        }
        try {
            $msgid = pebai_email_smtp($b, $p['email'], $msg['asunto'], $msg['texto'], $p['token'], $paso === 2 ? $p['msgid'] : '');
        } catch (Throwable $e) {
            $m = $e->getMessage();
            $db->prepare("UPDATE email_prospectos SET estado = 'error', error = ?, updated_at = ? WHERE id = ?")->execute([mb_substr($m, 0, 300), $now, $p['id']]);
            pebai_actividad('email', 'error', 'Falló el envío a ' . ($p['empresa'] ?: $p['email']), $p['email'] . "\n" . $m, 'email:' . $p['id']);
            if (preg_match('/\b5\d\d\b.*(spam|block|policy|reject|rate|limit|reputation|blacklist|listed|suspend)/i', $m) || preg_match('/\b(535|554)\b/', $m)) {
                pebai_email_frenar('Error grave del servidor de correo al enviar a ' . $p['email'] . ': ' . $m);
            }
            return 'error al enviar: ' . $m;
        }
        if ($paso === 1) {
            $db->prepare("UPDATE email_prospectos SET estado = 'enviado', paso = 1, asunto = ?, msgid = ?, enviado1_at = ?, error = '', updated_at = ? WHERE id = ?")
               ->execute([$msg['asunto'], $msgid, $now, $now, $p['id']]);
            if ($cfg['escalon_desde'] === '') {
                pebai_email_cfg_guardar(['escalon_desde' => date('Y-m-d')]);
            }
        } else {
            $db->prepare("UPDATE email_prospectos SET estado = 'recordado', paso = 2, enviado2_at = ?, updated_at = ? WHERE id = ?")->execute([$now, $now, $p['id']]);
        }
        $db->prepare("INSERT INTO agente_mensajes (ts, agente, prospecto_id, telefono, sentido, texto) VALUES (?, 'email', ?, ?, 'sale', ?)")
           ->execute([$now, $p['id'], $p['email'], 'Asunto: ' . $msg['asunto'] . "\n\n" . $msg['texto']]);
        pebai_actividad('email', 'envio', ($paso === 1 ? 'Primer email a ' : 'Recordatorio a ') . ($p['empresa'] ?: $p['email']),
            $p['email'] . ' · ' . ($p['nicho'] ?: 'sin nicho') . ' · señal: ' . $p['senal'] . "\nAsunto: " . $msg['asunto'] . "\n\n" . $msg['texto'], 'email:' . $p['id']);
        return 'enviado (' . ($paso === 1 ? 'primer email' : 'recordatorio') . ') a ' . $p['email'];
    }
    return 'varios prospectos descartados por la comprobación previa';
}

/** Sube un escalón si lleva ≥ 7 días en el actual y la semana salió limpia (rebotes < 2 %, sin quejas ni frenos). */
function pebai_email_revisar_escalon(): void
{
    $cfg = pebai_email_cfg();
    if ($cfg['escalon_desde'] === '' || $cfg['escalon'] >= count(PEBAI_EMAIL_ESCALONES) - 1 || strtotime($cfg['escalon_desde']) > time() - 7 * 86400) {
        return;
    }
    $s = pebai_email_salud(7);
    if ($s['enviados'] >= 20 && $s['rebotes_pct'] < 2 && $s['quejas'] === 0 && pebai_agente('email')['estado'] !== 'frenado') {
        pebai_email_cfg_guardar(['escalon' => $cfg['escalon'] + 1, 'escalon_desde' => date('Y-m-d')]);
        pebai_actividad('email', 'hito', 'Sube el ritmo a ' . PEBAI_EMAIL_ESCALONES[$cfg['escalon'] + 1] . ' emails al día',
            "Semana limpia: {$s['enviados']} enviados, {$s['rebotes_pct']} % de rebotes y ninguna queja.");
    }
}

/** Indicadores de salud de los últimos N días. */
function pebai_email_salud(int $dias): array
{
    $db = pebai_email_db();
    $desde = date('Y-m-d H:i:s', time() - $dias * 86400);
    $q = $db->prepare("SELECT COUNT(*) FROM agente_mensajes WHERE agente = 'email' AND sentido = 'sale' AND ts >= ?");
    $q->execute([$desde]);
    $env = (int)$q->fetchColumn();
    $q = $db->prepare("SELECT estado, COUNT(*) n FROM email_prospectos WHERE updated_at >= ? GROUP BY estado");
    $q->execute([$desde]);
    $por = array_column($q->fetchAll(), 'n', 'estado');
    $q = $db->prepare("SELECT COUNT(*) FROM bajas_email WHERE ts >= ? AND motivo LIKE 'queja%'");
    $q->execute([$desde]);
    $quejas = (int)$q->fetchColumn();
    $reb = (int)($por['rebote'] ?? 0);
    return ['enviados' => $env, 'rebotes' => $reb, 'rebotes_pct' => $env ? round($reb / $env * 100, 1) : 0, 'quejas' => $quejas,
            'respuestas' => (int)($por['respondio'] ?? 0) + (int)($por['interesado'] ?? 0), 'interesados' => (int)($por['interesado'] ?? 0), 'bajas' => (int)($por['baja'] ?? 0)];
}

/** Freno por rebotes: más del 3 % en los últimos 50 envíos. */
function pebai_email_revisar_rebotes(): void
{
    $db = pebai_email_db();
    $ids = $db->query("SELECT prospecto_id FROM agente_mensajes WHERE agente = 'email' AND sentido = 'sale' ORDER BY id DESC LIMIT 50")->fetchAll(PDO::FETCH_COLUMN);
    if (count($ids) < 20) {
        return;
    }
    $in = implode(',', array_map('intval', $ids));
    $reb = (int)$db->query("SELECT COUNT(*) FROM email_prospectos WHERE estado = 'rebote' AND id IN ($in)")->fetchColumn();
    if ($reb / count($ids) > 0.03 && pebai_agente('email')['estado'] !== 'frenado') {
        pebai_email_frenar("Rebotes por encima del 3 %: $reb de los últimos " . count($ids) . ' envíos. Revisa la calidad de la lista del scraper.');
    }
}

/* -------------------------------------------------------------- respuestas --- */

/** Decodifica una cabecera MIME (=?UTF-8?B?...?=) a UTF-8. */
function pebai_mail_cabecera(string $v): string
{
    if (function_exists('iconv_mime_decode')) {
        $d = @iconv_mime_decode($v, ICONV_MIME_DECODE_CONTINUE_ON_ERROR, 'UTF-8');
        if ($d !== false) {
            return $d;
        }
    }
    return mb_decode_mimeheader($v);
}

function pebai_mail_a_utf8(string $t, string $charset): string
{
    $charset = strtoupper(trim($charset, " \"'")) ?: 'UTF-8';
    if ($charset === 'UTF-8' || $charset === 'US-ASCII') {
        return mb_check_encoding($t, 'UTF-8') ? $t : mb_convert_encoding($t, 'UTF-8', 'Windows-1252');
    }
    $c = @mb_convert_encoding($t, 'UTF-8', $charset);
    return $c !== false ? $c : mb_convert_encoding($t, 'UTF-8', 'Windows-1252');
}

/** Separa cabeceras y cuerpo y devuelve cabeceras en minúsculas (las repetidas se concatenan). */
function pebai_mail_partir(string $raw): array
{
    $raw = str_replace("\r\n", "\n", $raw);
    $pos = strpos($raw, "\n\n");
    $cab = $pos === false ? $raw : substr($raw, 0, $pos);
    $cuerpo = $pos === false ? '' : substr($raw, $pos + 2);
    $cab = preg_replace("/\n[ \t]+/", ' ', $cab);
    $h = [];
    foreach (explode("\n", $cab) as $l) {
        if (strpos($l, ':') !== false) {
            [$k, $v] = explode(':', $l, 2);
            $k = strtolower(trim($k));
            $h[$k] = isset($h[$k]) ? $h[$k] . "\n" . trim($v) : trim($v);
        }
    }
    return [$h, $cuerpo];
}

/** Saca el texto plano de un mensaje MIME (recorre multiparts; si solo hay HTML, lo convierte). */
function pebai_mail_texto(array $h, string $cuerpo, int $prof = 0): array
{
    $ct = $h['content-type'] ?? 'text/plain';
    $tipo = strtolower(trim(strtok($ct, ';')));
    $out = ['texto' => '', 'html' => '', 'dsn' => '', 'partes' => [$tipo]];
    if ($prof < 6 && str_starts_with($tipo, 'multipart/') && preg_match('/boundary="?([^";]+)"?/i', $ct, $m)) {
        foreach (explode('--' . $m[1], $cuerpo) as $parte) {
            $parte = ltrim($parte, "\n");
            if ($parte === '' || str_starts_with($parte, '--')) {
                continue;
            }
            [$ph, $pc] = pebai_mail_partir($parte);
            $r = pebai_mail_texto($ph, $pc, $prof + 1);
            $out['partes'] = array_merge($out['partes'], $r['partes']);
            if ($out['texto'] === '' && $r['texto'] !== '') {
                $out['texto'] = $r['texto'];
            }
            if ($out['html'] === '' && $r['html'] !== '') {
                $out['html'] = $r['html'];
            }
            $out['dsn'] .= $r['dsn'];
        }
        return $out;
    }
    $enc = strtolower($h['content-transfer-encoding'] ?? '');
    if ($enc === 'base64') {
        $cuerpo = (string)base64_decode(preg_replace('/\s+/', '', $cuerpo));
    } elseif ($enc === 'quoted-printable') {
        $cuerpo = quoted_printable_decode($cuerpo);
    }
    $charset = preg_match('/charset="?([^";\s]+)"?/i', $ct, $m) ? $m[1] : 'UTF-8';
    if (str_starts_with($tipo, 'text/') || $tipo === 'message/delivery-status' || $tipo === 'message/feedback-report') {
        $cuerpo = pebai_mail_a_utf8($cuerpo, $charset);
    }
    if ($tipo === 'text/html') {
        $out['html'] = $cuerpo;
    } elseif ($tipo === 'message/delivery-status' || $tipo === 'message/feedback-report') {
        $out['dsn'] = $cuerpo;
    } elseif ($tipo === 'text/plain') {
        $out['texto'] = $cuerpo;
    }
    return $out;
}

/** Quita lo citado del email original para quedarse con lo que ha escrito la persona. */
function pebai_mail_sin_citas(string $t): string
{
    $t = str_replace("\r", '', $t);
    $corte = preg_split('/\n(?:El .{5,120}(?:escribió|escribio)\s*:|On .{5,120}wrote\s*:|-{2,}\s*(?:Mensaje original|Original Message)|De:\s.+\n(?:Enviado|Fecha|Sent):|From:\s.+\n(?:Sent|Date):|_{10,})/iu', "\n" . $t, 2)[0];
    $lineas = array_filter(explode("\n", $corte), static fn($l) => !str_starts_with(ltrim($l), '>'));
    return trim(implode("\n", $lineas));
}

/** Analiza un mensaje entrante en bruto. */
function pebai_email_analizar(string $raw): array
{
    [$h, $cuerpo] = pebai_mail_partir($raw);
    $t = pebai_mail_texto($h, $cuerpo);
    $texto = $t['texto'] !== '' ? $t['texto'] : html_entity_decode(strip_tags(preg_replace('/<(br|\/p|\/div)[^>]*>/i', "\n", $t['html'])), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $from = preg_match('/<([^>]+)>/', $h['from'] ?? '', $m) ? $m[1] : trim($h['from'] ?? '');
    $asunto = pebai_mail_cabecera($h['subject'] ?? '');
    $propio = pebai_mail_sin_citas($texto);
    $fromN = pebai_email_norm($from);
    $tipo = 'otro';
    $fallido = '';
    $esRebote = str_contains(implode(' ', $t['partes']), 'delivery-status') || preg_match('/^(mailer-daemon|postmaster)@/i', $fromN)
        || preg_match('/(undeliver|delivery status notification|returned mail|no se ha podido entregar|mail delivery failed|failure notice|entrega fallida|no entregado)/i', $asunto);
    if (str_contains(implode(' ', $t['partes']), 'feedback-report')) {
        $tipo = 'queja';
    } elseif ($esRebote) {
        $tipo = 'rebote';
        $tecnico = $t['dsn'] . "\n" . $texto;
        if (preg_match('/(?:Final|Original)-Recipient:\s*(?:rfc822;)?\s*<?([^\s>]+@[^\s>]+)/i', $tecnico, $m)) {
            $fallido = pebai_email_norm($m[1]);
        } elseif (preg_match('/[\w.+-]+@[\w-]+\.[\w.-]+/', $propio, $m)) {
            $fallido = pebai_email_norm($m[0]);
        }
        // Rebote temporal (buzón lleno, 4xx): no cuenta como email inválido.
        if (preg_match('/Status:\s*4\.\d+\.\d+/i', $tecnico) || preg_match('/\b(mailbox full|buz[oó]n lleno|over quota|temporar)/iu', $tecnico)) {
            $tipo = 'rebote_temporal';
        }
    } elseif (preg_match('/^(auto-replied|auto-generated)/i', $h['auto-submitted'] ?? '') || isset($h['x-autoreply']) || isset($h['x-autorespond'])
        || preg_match('/auto_reply|bulk|junk/i', $h['precedence'] ?? '') || preg_match(PEBAI_EMAIL_AUTO_RE, $asunto)
        || (mb_strlen($propio) < 600 && preg_match(PEBAI_EMAIL_AUTO_RE, $propio) && !preg_match(PEBAI_EMAIL_SI_RE, $propio))) {
        $tipo = 'autorespuesta';
    } elseif (preg_match(PEBAI_EMAIL_NO_RE, $propio) || preg_match('/^\s*baja\s*$/iu', $asunto) || preg_match(PEBAI_EMAIL_NO_RE, $asunto)) {
        $tipo = 'baja';
    } elseif (preg_match(PEBAI_EMAIL_SI_RE, $propio)) {
        $tipo = 'positivo';
    }
    return [
        'tipo' => $tipo, 'from' => $fromN, 'asunto' => $asunto, 'texto' => mb_substr($propio, 0, 4000), 'fallido' => $fallido,
        'in_reply_to' => trim($h['in-reply-to'] ?? ''), 'references' => trim($h['references'] ?? ''), 'message_id' => trim($h['message-id'] ?? ''),
    ];
}

/** Busca el prospecto de un mensaje: por el hilo (Message-ID) o por el remitente. */
function pebai_email_prospecto_de(array $m): ?array
{
    $db = pebai_email_db();
    foreach (preg_split('/\s+/', trim($m['in_reply_to'] . ' ' . $m['references'])) as $id) {
        if ($id !== '') {
            $q = $db->prepare('SELECT * FROM email_prospectos WHERE msgid = ?');
            $q->execute([$id]);
            if ($p = $q->fetch()) {
                return $p;
            }
        }
    }
    foreach (array_filter([$m['fallido'], $m['from']]) as $e) {
        $q = $db->prepare('SELECT * FROM email_prospectos WHERE email = ? AND paso > 0');
        $q->execute([$e]);
        if ($p = $q->fetch()) {
            return $p;
        }
    }
    return null;
}

function pebai_email_baja(array $p, string $motivo): void
{
    $db = pebai_email_db();
    $now = date('Y-m-d H:i:s');
    $db->prepare('INSERT OR IGNORE INTO bajas_email (email, dominio, ts, motivo) VALUES (?, ?, ?, ?)')->execute([$p['email'], $p['dominio'], $now, mb_substr($motivo, 0, 300)]);
    $db->prepare("UPDATE email_prospectos SET estado = 'baja', updated_at = ? WHERE id = ?")->execute([$now, $p['id']]);
    if ($p['telefono'] !== '') {
        pebai_wa_baja($p['telefono'], 'Baja pedida por email: ' . mb_substr($motivo, 0, 200)); // vale para todos los canales
    }
}

/** Aplica un mensaje entrante analizado. Devuelve una descripción de lo hecho (o '' si no es de un prospecto). */
function pebai_email_procesar(array $m, bool $avisar = true): string
{
    $p = pebai_email_prospecto_de($m);
    if (!$p) {
        return '';
    }
    $db = pebai_email_db();
    $now = date('Y-m-d H:i:s');
    $quien = $p['empresa'] ?: $p['email'];
    $txt = $p['email'] . ($m['texto'] !== '' ? "\n«" . mb_substr($m['texto'], 0, 600) . '»' : '');
    $apunte = [
        'rebote' => 'Rebote: el email de ' . $quien . ' no existe (no se le vuelve a escribir)',
        'rebote_temporal' => 'Rebote temporal de ' . $quien . ' (buzón lleno o servidor ocupado)',
        'queja' => 'Queja de spam de ' . $quien,
        'autorespuesta' => 'Respuesta automática de ' . $quien . ' (no cuenta; el recordatorio se aplaza)',
        'baja' => $quien . ' pidió la baja (para siempre, todos los canales)',
        'positivo' => $quien . ' quiere el vídeo',
        'otro' => $quien . ' ha contestado',
    ][$m['tipo']] ?? $quien . ' ha contestado';
    pebai_actividad('email', 'respuesta', $apunte, $txt, 'email:' . $p['id']);
    switch ($m['tipo']) {
        case 'rebote':
            $db->prepare("UPDATE email_prospectos SET estado = 'rebote', error = 'El email no existe (rebote)', updated_at = ? WHERE id = ?")->execute([$now, $p['id']]);
            $db->prepare('INSERT OR IGNORE INTO bajas_email (email, dominio, ts, motivo) VALUES (?, ?, ?, ?)')->execute([$p['email'], $p['dominio'], $now, 'rebote']);
            pebai_email_revisar_rebotes();
            return 'rebote';
        case 'rebote_temporal':
            $db->prepare("UPDATE email_prospectos SET error = 'Rebote temporal (buzón lleno o servidor ocupado)', updated_at = ? WHERE id = ?")->execute([$now, $p['id']]);
            return 'rebote temporal';
        case 'queja':
            pebai_email_baja($p, 'queja de spam');
            pebai_email_frenar('Queja de spam de ' . $p['email'] . '. Con una sola queja el agente se para: revisa el texto y la lista antes de seguir.');
            return 'queja';
        case 'autorespuesta':
            // No cuenta como respuesta. Si había recordatorio pendiente, se aplaza una semana.
            $db->prepare("UPDATE email_prospectos SET no_antes = ?, updated_at = ? WHERE id = ? AND paso = 1")->execute([date('Y-m-d H:i:s', time() + 7 * 86400), $now, $p['id']]);
            return 'autorespuesta';
    }
    $db->prepare("INSERT INTO agente_mensajes (ts, agente, prospecto_id, telefono, sentido, texto) VALUES (?, 'email', ?, ?, 'entra', ?)")
       ->execute([$now, $p['id'], $p['email'], $m['texto']]);
    if ($m['tipo'] === 'baja') {
        pebai_email_baja($p, 'Lo pidió por email: «' . mb_substr($m['texto'], 0, 200) . '»');
        if (preg_match('/spam|denunci|lopd|rgpd|protecci[oó]n de datos/iu', $m['texto'])) {
            pebai_email_frenar('Respuesta molesta de ' . $p['email'] . ' («' . mb_substr($m['texto'], 0, 150) . '»). Revisa antes de seguir.');
        }
        $estado = 'baja';
    } else {
        $estado = $m['tipo'] === 'positivo' ? 'interesado' : 'respondio';
        $db->prepare('UPDATE email_prospectos SET estado = ?, respondido_at = ?, updated_at = ? WHERE id = ?')->execute([$estado, $now, $now, $p['id']]);
    }
    if ($avisar) {
        pebai_email_avisar($p, $m, $estado);
    }
    return $estado;
}

/** Avisa a Daniel al momento de una respuesta real (predicar con el ejemplo: contestar en minutos). */
function pebai_email_avisar(array $p, array $m, string $estado): void
{
    $b = pebai_email_buzon();
    $to = $b['avisar_a'] ?? '';
    if ($to === '') {
        return;
    }
    $etq = ['interesado' => '✅ Quiere el vídeo', 'respondio' => '💬 Ha contestado', 'baja' => '⛔ Baja'][$estado] ?? $estado;
    $txt = $etq . ' · ' . ($p['empresa'] ?: $p['email']) . "\n\n«" . $m['texto'] . "»\n\nEmail: " . $p['email'] . "\nNicho: " . $p['nicho'] . "\n\n"
         . ($estado === 'interesado' ? "Mándale el vídeo del nicho ya: contestar en minutos es la mejor demostración.\n" : '')
         . "Contesta desde el buzón del frío para mantener el hilo.\nPanel: https://panel.pebaisystems.es/?tab=email";
    try {
        pebai_smtp_send($to, $etq . ' · ' . ($p['empresa'] ?: $p['email']), '<pre style="font:15px/1.5 Arial,sans-serif;white-space:pre-wrap">' . h($txt) . '</pre>', $txt, 'PEBAI · Agente de email');
    } catch (Throwable $e) {
        pebai_log('EMAIL aviso: ' . $e->getMessage());
    }
}

/** Lee los mensajes nuevos del buzón por IMAP (sin marcarlos como leídos) y los procesa. */
function pebai_email_leer_buzon(): string
{
    $b = pebai_email_buzon();
    if (!$b || !function_exists('imap_open')) {
        return $b ? 'IMAP no disponible en este PHP' : 'sin buzón';
    }
    $db = pebai_email_db();
    $imap = @imap_open($b['imap'] . 'INBOX', $b['user'], $b['pass'], OP_READONLY, 1);
    if (!$imap) {
        $err = imap_last_error() ?: 'sin detalle';
        imap_errors();
        pebai_actividad_unica('email', 'error', 'No puede leer el buzón (no ve las respuestas)', $err);
        return 'IMAP: no conecta (' . $err . ')';
    }
    $get = static function (string $k) use ($db): string {
        $q = $db->prepare('SELECT valor FROM email_imap WHERE clave = ?');
        $q->execute([$k]);
        return (string)$q->fetchColumn();
    };
    $set = static function (string $k, string $v) use ($db): void {
        $db->prepare('INSERT INTO email_imap (clave, valor) VALUES (?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor')->execute([$k, $v]);
    };
    $st = imap_status($imap, $b['imap'] . 'INBOX', SA_UIDVALIDITY | SA_UIDNEXT);
    $validez = (string)($st->uidvalidity ?? '');
    $ultimo = (int)$get('ultimo_uid');
    if ($get('uidvalidity') !== $validez) {
        $ultimo = max(0, (int)($st->uidnext ?? 1) - 1); // primera vez: solo lo que llegue a partir de ahora
        $set('uidvalidity', $validez);
    }
    $uids = imap_search($imap, 'ALL', SE_UID) ?: [];
    $hechos = [];
    foreach ($uids as $uid) {
        if ($uid <= $ultimo) {
            continue;
        }
        $raw = imap_fetchheader($imap, $uid, FT_UID) . imap_body($imap, $uid, FT_UID | FT_PEEK);
        try {
            $r = pebai_email_procesar(pebai_email_analizar($raw));
            if ($r !== '') {
                $hechos[] = $r;
            }
        } catch (Throwable $e) {
            pebai_log('EMAIL procesar ' . $uid . ': ' . $e->getMessage());
        }
        $ultimo = max($ultimo, $uid);
    }
    $set('ultimo_uid', (string)$ultimo);
    imap_close($imap);
    imap_errors();
    return $hechos ? 'procesados: ' . implode(', ', $hechos) : 'sin mensajes nuevos de prospectos';
}

/* ---------------------------------------------------------------- importar --- */

/**
 * Importa prospectos de email desde el CSV del scraper. Columnas por cabecera:
 * empresa, email, nombre, telefono, sector, nicho, ciudad, web, origen_email, tipo_email,
 * senal (anuncios|empleo|resenas|apertura|atencion|ninguna), motivo, motivo_fuente, motivo_fecha, notas.
 */
function pebai_email_importar(string $raw, string $nichoDefecto, string $lote): array
{
    $db = pebai_email_db();
    $raw = preg_replace('/^\xEF\xBB\xBF/', '', str_replace(["\r\n", "\r"], "\n", $raw));
    $lineas = array_values(array_filter(explode("\n", $raw), static fn($l) => trim($l) !== ''));
    $res = ['nuevos' => 0, 'repetidos' => 0, 'invalidos' => 0, 'bajas' => 0, 'sin_origen' => 0];
    if (count($lineas) < 2) {
        return $res;
    }
    $sep = substr_count($lineas[0], "\t") ? "\t" : (substr_count($lineas[0], ';') >= substr_count($lineas[0], ',') ? ';' : ',');
    $norm = static fn($s) => strtolower(trim(strtr($s, ['á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ñ' => 'n', 'Á' => 'a', 'É' => 'e', 'Í' => 'i', 'Ó' => 'o', 'Ú' => 'u'])));
    $head = array_map($norm, str_getcsv(array_shift($lineas), $sep));
    $alias = ['empresa' => ['empresa', 'negocio', 'name', 'company'], 'email' => ['email', 'correo', 'mail', 'e-mail'], 'nombre' => ['nombre', 'contacto'],
              'telefono' => ['telefono', 'movil', 'phone', 'tel'], 'sector' => ['sector', 'categoria'], 'nicho' => ['nicho', 'niche'], 'ciudad' => ['ciudad', 'localidad', 'municipio', 'city'],
              'web' => ['web', 'website', 'url'], 'origen_email' => ['origen_email', 'origen', 'fuente'], 'tipo_email' => ['tipo_email'],
              'senal' => ['senal', 'señal', 'tipo_senal', 'signal'], 'motivo' => ['motivo'], 'motivo_fuente' => ['motivo_fuente'], 'motivo_fecha' => ['motivo_fecha'], 'motivo_caduca' => ['motivo_caduca', 'plazo'], 'notas' => ['notas']];
    $map = [];
    foreach ($alias as $campo => $nombres) {
        foreach ($nombres as $nombre) { // por orden de preferencia: "origen_email" gana a "origen" (que es el del negocio)
            $i = array_search($nombre, $head, true);
            if ($i !== false && !isset($map[$campo])) {
                $map[$campo] = $i;
            }
        }
    }
    if (!isset($map['email'])) {
        throw new RuntimeException('El CSV necesita una columna "email".');
    }
    $bajas = array_fill_keys($db->query('SELECT email FROM bajas_email')->fetchAll(PDO::FETCH_COLUMN), true);
    $now = date('Y-m-d H:i:s');
    $ins = $db->prepare('INSERT OR IGNORE INTO email_prospectos (created_at, updated_at, empresa, nombre, email, dominio, tipo_email, origen_email, telefono, sector, nicho, ciudad, web,
                         senal, motivo, motivo_fuente, motivo_fecha, motivo_caduca, prioridad, lote, notas, estado, token) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
    $db->beginTransaction();
    foreach ($lineas as $linea) {
        $c = str_getcsv($linea, $sep);
        $get = static fn($k) => isset($map[$k], $c[$map[$k]]) ? mb_substr(trim($c[$map[$k]]), 0, 400) : '';
        $email = pebai_email_norm($get('email'));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $res['invalidos']++;
            continue;
        }
        if ($get('origen_email') === '') {
            $res['sin_origen']++; // sin saber de dónde sale el email, no entra (§9)
            continue;
        }
        $dom = pebai_email_dominio($email);
        $senal = strtolower($get('senal')) ?: ($get('motivo') !== '' ? 'atencion' : 'ninguna');
        if (!isset(PEBAI_EMAIL_SENALES[$senal])) {
            $senal = 'ninguna';
        }
        [, $vigencia, $prio] = PEBAI_EMAIL_SENALES[$senal];
        $fecha = $get('motivo_fecha') !== '' && strtotime($get('motivo_fecha')) ? date('Y-m-d', strtotime($get('motivo_fecha'))) : date('Y-m-d');
        $prio += max(0, 10 - intdiv(max(0, time() - strtotime($fecha)), 86400)); // señal fresca, más arriba
        $tipo = $get('tipo_email') ?: (in_array($dom, PEBAI_EMAIL_GRATUITOS, true) ? 'gratuito' : 'generico');
        $estado = isset($bajas[$email]) ? 'baja' : 'pendiente';
        $ins->execute([$now, $now, $get('empresa'), $get('nombre'), $email, $dom, $tipo, $get('origen_email'), pebai_phone_digits($get('telefono')) ?: '',
                       $get('sector'), $get('nicho') ?: $nichoDefecto, $get('ciudad'), $get('web'), $senal, $get('motivo'), $get('motivo_fuente'), $fecha,
                       $get('motivo_caduca') !== '' && strtotime($get('motivo_caduca')) ? date('Y-m-d', strtotime($get('motivo_caduca'))) : date('Y-m-d', strtotime($fecha) + $vigencia * 86400),
                       $prio, $lote, $get('notas'), $estado, bin2hex(random_bytes(16))]);
        if ($ins->rowCount()) {
            $estado === 'baja' ? $res['bajas']++ : $res['nuevos']++;
        } else {
            $res['repetidos']++;
        }
    }
    $db->commit();
    return $res;
}

/* ---------------------------------------------------------------- latido --- */

/** Una vuelta completa del cron: respuestas, salud, escalón y, si toca, un envío. */
function pebai_email_tick(bool $comprobarDns = true): array
{
    $db = pebai_email_db();
    $out = ['buzon' => '', 'envio' => ''];
    try {
        $out['buzon'] = pebai_email_leer_buzon();
    } catch (Throwable $e) {
        $out['buzon'] = 'error: ' . $e->getMessage();
        pebai_log('EMAIL buzón: ' . $e->getMessage());
        pebai_actividad_unica('email', 'error', 'Error leyendo respuestas', $e->getMessage());
    }
    pebai_email_revisar_escalon();
    try {
        $out['envio'] = pebai_email_enviar_uno(false, $comprobarDns);
    } catch (Throwable $e) {
        $out['envio'] = 'error: ' . $e->getMessage();
        pebai_log('EMAIL envío: ' . $e->getMessage());
        pebai_actividad_unica('email', 'error', 'Error en el ciclo de envío', $e->getMessage());
    }
    pebai_actividad_limpiar();
    $a = pebai_agente('email');
    $estado = !pebai_email_buzon() ? 'sin_configurar' : ($a['estado'] === 'frenado' && (int)$a['pausado'] ? 'frenado' : ((int)$a['pausado'] ? 'pausado' : 'activo'));
    $detalle = $estado === 'frenado' ? $a['detalle'] : $out['envio'];
    $db->prepare("UPDATE agente_estado SET latido_at = ?, estado = ?, detalle = ? WHERE agente = 'email'")->execute([date('Y-m-d H:i:s'), $estado, mb_substr($detalle, 0, 400)]);
    return $out;
}
