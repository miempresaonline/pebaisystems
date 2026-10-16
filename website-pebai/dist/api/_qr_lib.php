<?php
/*
 * PEBAI · QRs de calle (puerta fría): qué abre cada QR y cuántas veces se escanea.
 * Tablas en la SQLite privada (la misma de las solicitudes):
 *   qr_codigos   → un QR por situación de la conversación («me lo pienso», «mándame información»…)
 *   qr_escaneos  → cada escaneo: cuándo, de qué QR, quién lo enseñaba (adrian/daniel) e IP anonimizada
 * El QR impreso o en pantalla apunta a pebaisystems.es/q/<slug>?p=<persona> (api/qr.php), que apunta el escaneo
 * y redirige al destino con los utm de salida: así la solicitud queda a nombre de quien enseñó el QR (docs/enlaces-y-utm.md).
 */
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}
require_once __DIR__ . '/_pebai_lib.php';

const PEBAI_QR_WA = '34624842799';   // WhatsApp del equipo (el mismo de /contacto y de las tarjetas)
const PEBAI_QR_TIPOS = ['reservar', 'video', 'whatsapp', 'tarjeta', 'web', 'url'];

function pebai_qr_db(): PDO
{
    static $listo = false;
    $db = pebai_db();
    if ($listo) {
        return $db;
    }
    $db->exec('CREATE TABLE IF NOT EXISTS qr_codigos (
        slug TEXT PRIMARY KEY,
        titulo TEXT NOT NULL,
        situacion TEXT NOT NULL DEFAULT "",
        frase TEXT NOT NULL DEFAULT "",
        tipo TEXT NOT NULL DEFAULT "web",
        destino TEXT NOT NULL DEFAULT "",
        color TEXT NOT NULL DEFAULT "#B7FF3C",
        orden INTEGER NOT NULL DEFAULT 0,
        activo INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT ""
    )');
    $db->exec('CREATE TABLE IF NOT EXISTS qr_escaneos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts TEXT NOT NULL,
        slug TEXT NOT NULL,
        persona TEXT NOT NULL DEFAULT "",
        ip_hash TEXT NOT NULL DEFAULT "",
        dispositivo TEXT NOT NULL DEFAULT ""
    )');
    $db->exec('CREATE INDEX IF NOT EXISTS idx_qr_escaneos ON qr_escaneos(slug, ts)');
    if (!(int)$db->query('SELECT COUNT(*) FROM qr_codigos')->fetchColumn()) {
        $now = date('Y-m-d H:i:s');
        $ins = $db->prepare('INSERT INTO qr_codigos (slug, titulo, situacion, frase, tipo, color, orden, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        foreach ([
            ['reservar', 'Pedir la consultoría gratuita', 'Vale, me interesa', 'Rellénalo en un minuto y te escribimos por WhatsApp en menos de 24 horas.', 'reservar', '#B7FF3C'],
            ['video', 'Ver el vídeo', 'Me lo pienso', 'Míralo cuando puedas: explica qué hacemos y cómo trabajamos, sin compromiso.', 'video', '#8E84FF'],
            ['whatsapp', 'Escríbenos por WhatsApp', 'Mándame información', 'Escríbenos por aquí y te mandamos todo lo que necesites.', 'whatsapp', '#25D366'],
            ['contacto', 'Guardar nuestro contacto', 'Ahora no es buen momento', 'Guárdanos y hablamos cuando te venga mejor.', 'tarjeta', '#3FD5FF'],
            ['web', 'Conocernos', '¿Y vosotros quiénes sois?', 'Esta es nuestra web: qué hacemos y quiénes somos.', 'web', '#EFEDE7'],
        ] as $i => $q) {
            $ins->execute([$q[0], $q[1], $q[2], $q[3], $q[4], $q[5], $i + 1, $now]);
        }
    }
    $listo = true;
    return $db;
}

/** 'adrian' | 'daniel' | '' a partir de lo que venga en la URL. */
function pebai_qr_persona(string $p): string
{
    $p = mb_strtolower(trim($p));
    return in_array($p, ['adrian', 'adrián', 'a'], true) ? 'adrian' : (in_array($p, ['daniel', 'dani', 'd'], true) ? 'daniel' : '');
}

/** Enlace corto que lleva el QR (lo que se codifica en la imagen: cuanto más corto, más fácil de escanear). */
function pebai_qr_corto(string $slug, string $persona): string
{
    return 'https://pebaisystems.es/q/' . $slug . ($persona ? '?p=' . ($persona === 'adrian' ? 'a' : 'd') : '');
}

/** Destino final de un QR, con los utm de salida y la persona (para que la solicitud quede a su nombre). */
function pebai_qr_destino(array $q, string $persona): string
{
    $utm = ['utm_source' => 'qr', 'utm_medium' => 'puerta_fria', 'utm_campaign' => 'calle', 'utm_content' => $q['slug']];
    if ($persona) {
        $utm = ['origen' => $persona] + $utm;
    }
    $web = 'https://pebaisystems.es';
    switch ($q['tipo']) {
        case 'reservar':
            return $web . '/diagnostico/?' . http_build_query($utm);
        case 'video':
            return $web . '/consultoria-gratuita/?' . http_build_query($utm);
        case 'tarjeta':
            return $persona ? $web . '/t/' . ($persona === 'adrian' ? 'adrian' : 'dani') . '/?' . http_build_query($utm) : $web . '/consultoria-gratuita/?' . http_build_query($utm);
        case 'whatsapp':
            $quien = $persona === 'adrian' ? ' con Adrián' : ($persona === 'daniel' ? ' con Daniel' : '');
            return 'https://wa.me/' . PEBAI_QR_WA . '?text=' . rawurlencode('Hola, he hablado en persona' . $quien . ' y quiero más información sobre lo que hacéis.');
        case 'url':
            $d = trim((string)$q['destino']);
            if (preg_match('#^https?://#i', $d)) {
                if (preg_match('#^https://pebaisystems\.es(/|$)#i', $d)) {
                    $d .= (str_contains($d, '?') ? '&' : '?') . http_build_query($utm);
                }
                return $d;
            }
            return $web . '/';
        default:
            return $web . '/?' . http_build_query($utm);
    }
}

/** Visitas automáticas (previsualizaciones de enlaces, robots): no cuentan como escaneo. */
function pebai_qr_es_robot(string $ua): bool
{
    return $ua === '' || (bool)preg_match('/bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp\/|telegram|discord|skype|curl|wget|python|headless/i', $ua);
}
