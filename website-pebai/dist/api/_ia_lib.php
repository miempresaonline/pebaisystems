<?php
/*
 * PEBAI · IA que lee la web de cada empresa para la captación.
 *
 * Desde el 27/10/2026 lo hace el agente Redactor (Claude, rutina en la nube con el plan de Daniel, sin API de pago):
 * recoge empresas con api/redactor.php, escribe y entrega; el servidor le aplica el mismo control de calidad de abajo.
 * Gemini queda para lo que tiene que ir al momento (notas de voz, conversaciones, «Pregunta a PEBAI»).
 *
 * Hace dos cosas, igual que haría un comercial antes de escribir:
 *   1) Decide si la empresa ENCAJA: su negocio principal es instalar placas solares para clientes.
 *      Tiendas, distribuidores, fabricantes, climatización, electricistas generalistas, asesorías… no encajan.
 *   2) Si encaja, escribe el primer mensaje (WhatsApp) o el primer email, basado en un detalle REAL de su web.
 *
 * Todo lo que escribe pasa por un control: se presenta, ofrece la baja, no lleva enlaces ni temas prohibidos,
 * y el dato en que se basa tiene que aparecer literalmente en su web (si no, se descarta: nada inventado).
 * Si la IA o la web fallan, no se envía nada a esa empresa en ese momento.
 *
 * Clave: private/ia.php ('gemini_api_key'), la misma que usa «Pregunta a PEBAI».
 */
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}
require_once __DIR__ . '/_pebai_lib.php';

const PEBAI_IA_REDACTOR = true;   // true: los primeros mensajes los escribe el Redactor (Claude); el cron ya no usa Gemini para esto
const PEBAI_IA_MODELOS = ['gemini-flash-lite-latest', 'gemini-3.5-flash-lite', 'gemini-flash-latest'];
const PEBAI_IA_PRESENTA = 'Hola, soy Daniel, de PEBAI Systems.';
const PEBAI_IA_BAJA_WA = 'Si no te interesa, dímelo y no te escribo más.';
const PEBAI_IA_BAJA_EMAIL = 'Si no te interesa, dímelo y no vuelvo a escribirte.';
// Webs solo en catalán/valenciano (orden de Daniel, 21/10): ahí se escribe en su idioma; si hay algo en castellano, en castellano
const PEBAI_IA_CA = ['presenta' => 'Hola, sóc el Daniel, de PEBAI Systems.', 'baja_wa' => "Si no t'interessa, digues-m'ho i no t'escric més.",
                     'baja_email' => "Si no t'interessa, digues-m'ho i no et tornaré a escriure."];
// Primer contacto (Daniel, 3/11/2026): una sola plantilla para todos los nichos; la IA solo pone el gancho (sacado de un dato real
// de su web) y, si la web lo dice, el nombre de quien la dirige. Sin gancho seguro, la frase «He visto que…» no va.
const PEBAI_WA_PLANTILLA = [
    'es' => ['Hola{nombre}, soy Daniel, de PEBAI Systems 👋', ' He visto que {gancho}.',
             "\n\nSomos una consultora de procesos e IA y montamos en cada empresa lo que más le hace ganar, como hicimos con Fran García Cars o Construcciones Gargom."
             . "\n\nPor curiosidad, si pudierais quitaros de encima algo que os hace perder tiempo o clientes, ¿qué sería? Os cuento cómo lo resolveríamos en vuestro caso."
             . "\n\n" . PEBAI_IA_BAJA_WA],
    'ca' => ['Hola{nombre}, sóc el Daniel, de PEBAI Systems 👋', ' He vist que {gancho}.',
             "\n\nSom una consultora de processos i IA i muntem a cada empresa el que més la fa guanyar, com vam fer amb Fran García Cars o Construcciones Gargom."
             . "\n\nPer curiositat, si us poguéssiu treure de sobre alguna cosa que us fa perdre temps o clients, què seria? Us explico com ho resoldríem en el vostre cas."
             . "\n\nSi no t'interessa, digues-m'ho i no t'escric més."],
];
// Email (3/11): lo mismo con asunto humano y una P.D. con la reseña real de Fran García Cars (la prueba más fuerte que tenemos)
const PEBAI_EMAIL_NUEVO = [
    'es' => ['asunto' => 'pregunta para {empresa}', 'hola' => 'Hola, equipo de {empresa}:', 'gancho' => "\n\nHe visto que {gancho} y me ha surgido una pregunta.",
             'resto' => "\n\nSoy Daniel, de PEBAI Systems, una consultora de procesos e IA. Vemos cómo trabaja cada empresa y montamos lo que más le hace ganar, como hicimos con Fran García Cars o Construcciones Gargom."
                      . "\n\nSi pudierais quitaros de encima algo que os hace perder tiempo o clientes, ¿qué sería? Os contesto con cómo lo resolveríamos en vuestro caso, sin compromiso."
                      . "\n\n" . PEBAI_IA_BAJA_EMAIL . "\n\nDaniel\nPEBAI Systems"
                      . "\n\nP.D.: Álvaro, de Fran García Cars, nos dejó esta reseña en Google: «Nos crearon una app de IA de revisión de coches literalmente desde 0»."],
    'ca' => ['asunto' => 'pregunta per a {empresa}', 'hola' => 'Hola, equip de {empresa}:', 'gancho' => "\n\nHe vist que {gancho} i m'ha sorgit una pregunta.",
             'resto' => "\n\nSóc el Daniel, de PEBAI Systems, una consultora de processos i IA. Mirem com treballa cada empresa i muntem el que més la fa guanyar, com vam fer amb Fran García Cars o Construcciones Gargom."
                      . "\n\nSi us poguéssiu treure de sobre alguna cosa que us fa perdre temps o clients, què seria? Us responc amb com ho resoldríem en el vostre cas, sense compromís."
                      . "\n\nSi no t'interessa, digues-m'ho i no et tornaré a escriure.\n\nDaniel\nPEBAI Systems"
                      . "\n\nP.D.: L'Álvaro, de Fran García Cars, ens va deixar aquesta ressenya a Google: «Nos crearon una app de IA de revisión de coches literalmente desde 0»."],
];
const PEBAI_WA_GANCHO_REGLAS = '"gancho": frase corta (de 5 a 16 palabras) que completa «He visto que …», basada SOLO en ese dato y en segunda persona del plural '
    . '(lleváis, hacéis, ofrecéis, tenéis, trabajáis…). Elige algo concreto y propio de esa empresa sobre cómo trabajan o atienden a sus clientes '
    . '(años de experiencia, zonas, una especialidad, rapidez, servicio después de la venta, sus reseñas…). Neutra o positiva, sin halagos («me encanta», «increíble»), '
    . 'sin cifras que no estén en el dato, sin comillas, sin preguntas ni exclamaciones y sin punto final. '
    . 'Nunca sobre subvenciones, ayudas, deducciones, impuestos, IRPF, precios, descuentos, financiación, «gratis» ni porcentajes. Ejemplos: «lleváis más de 15 años instalando en la Vega de Granada», '
    . '«hacéis la instalación en un solo día», «ofrecéis 3 meses de asistencia técnica después de instalar». Si no hay ningún dato bueno y seguro, "gancho": "" (el mensaje va sin esa frase). '
    . '"nombre": nombre de pila de quien dirige la empresa SOLO si la web lo dice claramente (p. ej. «Soy Marcos, gerente» o «Fundada por Laura Pérez»); si no, "".';

/** Gancho limpio y comprobado. '' = sin gancho; null = no vale (cifras inventadas, preguntas, temas prohibidos, longitud). */
function pebai_ia_gancho(string $gancho, string $dato): ?string
{
    $g = trim(preg_replace('/\s+/u', ' ', $gancho), " \t\n.«»\"'");
    $g = preg_replace('/^(he (visto|vist) que|que)\s+/iu', '', $g);
    if ($g === '') {
        return '';
    }
    $n = count(preg_split('/\s+/u', $g, -1, PREG_SPLIT_NO_EMPTY));
    // Cifras solo si están en el dato real; nada de preguntas, exclamaciones, enlaces ni temas prohibidos
    preg_match_all('/\d+/', $g, $cifras);
    foreach ($cifras[0] as $c) {
        if (!str_contains($dato, $c)) {
            return null;
        }
    }
    if ($n < 4 || $n > 18 || preg_match('/[?¿!¡]|https?:|www\./u', $g) || preg_match(PEBAI_IA_PROHIBIDO, $g)) {
        return null;
    }
    return mb_strtolower(mb_substr($g, 0, 1)) . mb_substr($g, 1);
}

/** Nombre de pila solo si es un nombre de verdad y sale en su web; si no, ''. */
function pebai_ia_nombre(string $nombre, string $web): string
{
    $n = trim($nombre);
    return preg_match('/^\p{Lu}\p{Ll}{1,14}$/u', $n) && str_contains($web, $n) ? $n : '';
}

// Primer WhatsApp (Daniel, 5/11/2026): texto fijo, sin gancho de la IA; solo cambia el nombre de la empresa. Las barras bajas son la cursiva de WhatsApp.
const PEBAI_WA_FIJO = [
    'es' => "Hola, equipo de {empresa}. Soy Daniel, de PEBAI Systems.\n\nPor curiosidad, si pudierais quitaros de encima algo que os hace perder tiempo o clientes, ¿qué sería? Os cuento cómo lo resolveríamos en vuestro caso como hicimos con Fran García Cars o Construcciones Gargom.\n\n_Si prefieres que no te cuente cómo ahorrar tiempo y ganar clientes, escribe «baja»_",
    'ca' => "Hola, equip de {empresa}. Sóc el Daniel, de PEBAI Systems.\n\nPer curiositat, si us poguéssiu treure de sobre alguna cosa que us fa perdre temps o clients, què seria? Us explico com ho resoldríem en el vostre cas com vam fer amb Fran García Cars o Construcciones Gargom.\n\n_Si prefereixes que no t'expliqui com estalviar temps i guanyar clients, escriu «baixa»_",
];

/** Nombre de la empresa tal como lo diría una persona: sin coletillas de Google Maps, sin S.L. y sin todo en mayúsculas. */
function pebai_wa_nombre(string $empresa): string
{
    // Corta en « - », « | », «(», «: » y en «. » (salvo Dr., Dra., Sr., Sra.): lo que viene detrás son coletillas de Google Maps
    $e = preg_split('/\s+[-–—|·]\s+|\s*[|(]\s*|:\s+|(?<!\bDr)(?<!\bDra)(?<!\bSr)(?<!\bSra)\.\s+/u', trim($empresa))[0] ?? '';
    $e = trim(str_replace(['®', '™'], '', $e), " .,");
    $e = trim(preg_replace('/[,\s]+(s\.?\s?l\.?\s?u?\.?|s\.?\s?a\.?\s?u?\.?|s\.?\s?l\.?\s?p\.?|s\.?\s?c\.?|s\.?\s?coop\.?(\s?\w+\.?)?)$/iu', '', $e), " .,");
    if ($e !== '' && $e === mb_strtoupper($e)) {
        // TODO EN MAYÚSCULAS → Normal; las siglas cortas (GS, ISS) se quedan y «de/del/la» van en minúscula
        $e = implode(' ', array_map(static function ($w) {
            $l = mb_strtolower($w);
            if (in_array($l, ['de', 'del', 'la', 'las', 'los', 'el', 'y', 'e'], true)) {
                return $l;
            }
            return mb_strlen($w) <= 2 ? $w : mb_convert_case($l, MB_CASE_TITLE);
        }, preg_split('/\s+/u', $e)));
    }
    return $e !== '' ? $e : 'vuestra empresa';
}

function pebai_wa_fijo(string $empresa, bool $ca = false): string
{
    return str_replace('{empresa}', pebai_wa_nombre($empresa), PEBAI_WA_FIJO[$ca ? 'ca' : 'es']);
}

/** Primer WhatsApp con la plantilla. null si el gancho no pasa el control (se reintenta o se manda sin gancho). */
function pebai_wa_componer(string $gancho, bool $ca, string $dato = '', string $nombre = ''): ?string
{
    [$hola, $frase, $resto] = PEBAI_WA_PLANTILLA[$ca ? 'ca' : 'es'];
    $g = pebai_ia_gancho($gancho, $dato);
    if ($g === null) {
        return null;
    }
    return str_replace('{nombre}', $nombre !== '' ? ', ' . $nombre : '', $hola) . ($g !== '' ? str_replace('{gancho}', $g, $frase) : '') . $resto;
}

/** Primer email con la plantilla: ['asunto', 'cuerpo'], o null si el gancho no pasa el control. */
function pebai_email_componer_nuevo(string $gancho, bool $ca, string $dato, string $nombre, string $empresaCorta): ?array
{
    $t = PEBAI_EMAIL_NUEVO[$ca ? 'ca' : 'es'];
    $g = pebai_ia_gancho($gancho, $dato);
    if ($g === null) {
        return null;
    }
    $cuerpo = str_replace('{empresa}', trim($empresaCorta), $t['hola']) . ($g !== '' ? str_replace('{gancho}', $g, $t['gancho']) : '') . $t['resto'];
    return ['asunto' => str_replace('{empresa}', mb_strtolower(trim($empresaCorta)) ?: 'vosotros', $t['asunto']), 'cuerpo' => $cuerpo];
}

/** Texto del primer email y de su recordatorio a partir de lo que devuelve pebai_ia_control (gancho, nombre, idioma). */
function pebai_email_texto_nuevo(array $r, string $empresa): array
{
    require_once __DIR__ . '/_email_lib.php';
    $corta = pebai_wa_nombre($empresa);
    $e = pebai_email_componer_nuevo((string)$r['gancho'], (bool)$r['ca'], (string)$r['dato'], (string)$r['nombre'], $corta)
        ?? pebai_email_componer_nuevo('', (bool)$r['ca'], '', (string)$r['nombre'], $corta);
    return $e + ['recordatorio' => $r['ca'] ? PEBAI_EMAIL_RECORDATORIO_CA : PEBAI_EMAIL_RECORDATORIO];
}

/** ¿La web está solo en catalán/valenciano? Cuenta palabras muy frecuentes de cada idioma (las que no comparten). */
function pebai_ia_solo_catalan(string $texto): bool
{
    $t = ' ' . mb_strtolower(preg_replace('/[^\p{L}·]+/u', ' ', $texto)) . ' ';
    $es = preg_match_all('/(?<= )(los|las|del|para|con|nuestros|nuestras|nosotros|somos|también|más|hacemos|empresa|instalación|instalaciones|placas)(?= )/u', $t);
    $ca = preg_match_all('/(?<= )(els|les|amb|per|nostres|nosaltres|som|també|més|fem|empresa|instal·lació|instal·lacions|plaques|dels|una|i)(?= )/u', $t);
    return $ca >= 15 && $es * 4 < $ca;
}
const PEBAI_IA_PROHIBIDO = '/https?:|www\.|irpf|impuesto|deducci|\bley\b|normativa|garantiz|te prometo|clientes nuestros|otras instaladoras|\d+ ?%|€/iu';

function pebai_ia_clave(): string
{
    $f = pebai_private_dir() . '/ia.php';
    $ia = is_file($f) ? (require $f) : [];
    return (string)($ia['gemini_api_key'] ?? getenv('GEMINI_API_KEY') ?: '');
}

/**
 * JSON de la IA para un agente: Claude primero (Haiku para leer y clasificar, Sonnet para escribir) y, si no hay respuesta
 * (sin clave, crédito del mes agotado o fallo), Gemini, para que nunca se pierda nada. Cada llamada queda en Gasto IA.
 */
function pebai_ia_json_agente(string $agente, string $modelo, string $prompt): ?array
{
    require_once __DIR__ . '/_claude_lib.php';
    $j = pebai_claude_json($agente, $modelo, '', $prompt, ['effort' => $modelo === 'claude-haiku-5-5' ? 'low' : 'medium', 'max_tokens' => 4000]);
    return $j ?? pebai_ia_json($prompt, $agente);
}

/** Llama a Gemini y devuelve el JSON de la respuesta (o null). Prueba el siguiente modelo si uno está saturado. */
function pebai_ia_json(string $prompt, string $agente = 'general'): ?array
{
    $key = pebai_ia_clave();
    if ($key === '') {
        return null;
    }
    $body = json_encode(['contents' => [['parts' => [['text' => $prompt]]]],
                         'generationConfig' => ['temperature' => 0.4, 'responseMimeType' => 'application/json', 'maxOutputTokens' => 1024]], JSON_UNESCAPED_UNICODE);
    foreach (PEBAI_IA_MODELOS as $modelo) {
        $ch = curl_init('https://generativelanguage.googleapis.com/v1beta/models/' . $modelo . ':generateContent');
        curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $body, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 40,
                                CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'x-goog-api-key: ' . $key]]);
        $raw = (string)curl_exec($ch);
        $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        $txt = '';
        foreach (json_decode($raw, true)['candidates'][0]['content']['parts'] ?? [] as $p) {
            $txt .= (string)($p['text'] ?? '');
        }
        $j = json_decode(trim(preg_replace('/^```(?:json)?|```$/m', '', $txt)), true);
        if ($code === 200 && is_array($j)) {
            if (function_exists('pebai_ia_apunta')) {
                pebai_ia_apunta($agente, 'gemini', $modelo);   // gratis, pero cuenta en Gasto IA como llamada de reserva
            }
            return $j;
        }
    }
    return null;
}

/** Transcribe una nota de voz (bytes del audio) con Gemini. null si no se ha podido. */
function pebai_ia_transcribir(string $audio, string $mime = 'audio/ogg'): ?string
{
    $key = pebai_ia_clave();
    if ($key === '' || $audio === '' || strlen($audio) > 3000000) {
        return null;
    }
    $body = json_encode(['contents' => [['parts' => [
        ['text' => 'Transcribe literalmente esta nota de voz de WhatsApp, en el idioma en que se habla. Devuelve solo el texto, sin comillas ni comentarios.'],
        ['inline_data' => ['mime_type' => $mime ?: 'audio/ogg', 'data' => base64_encode($audio)]],
    ]]], 'generationConfig' => ['temperature' => 0, 'maxOutputTokens' => 1024]]);
    foreach (PEBAI_IA_MODELOS as $modelo) {
        $ch = curl_init('https://generativelanguage.googleapis.com/v1beta/models/' . $modelo . ':generateContent');
        curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $body, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 60,
                                CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'x-goog-api-key: ' . $key]]);
        $raw = (string)curl_exec($ch);
        $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        $txt = '';
        foreach (json_decode($raw, true)['candidates'][0]['content']['parts'] ?? [] as $p) {
            $txt .= (string)($p['text'] ?? '');
        }
        if ($code === 200 && trim($txt) !== '') {
            return mb_substr(trim($txt), 0, 2000);
        }
    }
    return null;
}

/** Texto visible de la portada de una web (y si tiene botón de WhatsApp). null si no responde. */
function pebai_web_texto(string $url): ?array
{
    if (!preg_match('~^https?://~i', $url)) {
        return null;
    }
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => true, CURLOPT_MAXREDIRS => 4, CURLOPT_TIMEOUT => 15,
                            CURLOPT_SSL_VERIFYPEER => false, CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130 Safari/537.36',
                            CURLOPT_HTTPHEADER => ['Accept-Language: es-ES,es;q=0.9']]);
    $html = (string)curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($code >= 400 || strlen($html) < 500) {
        return null;
    }
    $wa = (bool)preg_match('~wa\.me/|api\.whatsapp\.com~i', $html);
    $html = preg_replace('~<(script|style|svg|noscript)[^>]*>.*?</\1>~is', ' ', $html);
    $texto = trim(preg_replace('/\s+/u', ' ', html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8')));
    return mb_strlen($texto) < 200 ? null : ['texto' => mb_substr($texto, 0, 6000), 'whatsapp' => $wa];
}

function pebai_ia_norm(string $s): string
{
    return mb_strtolower(preg_replace('/[^\p{L}\p{N}]+/u', ' ', $s));
}

/**
 * Estudia una empresa y escribe su primer mensaje.
 * Devuelve ['encaja' => bool, 'motivo' => …, 'mensaje' => … (WhatsApp) | 'asunto','cuerpo' (email), 'dato' => …]
 * o ['error' => …] si no se ha podido (web caída, IA sin respuesta, texto que no pasa el control).
 */
function pebai_ia_prospecto(string $empresa, string $ciudad, string $web, string $canal = 'whatsapp'): array
{
    $w = pebai_web_texto($web);
    if (!$w) {
        return ['error' => 'La web no responde o está vacía'];
    }
    $r = pebai_ia_json_agente('redactor', 'claude-sonnet-5-5', pebai_ia_reglas($canal, pebai_ia_solo_catalan($w['texto'])) . "\n\nEMPRESA: {$empresa} ({$ciudad})\nWEB:\n" . $w['texto']);
    return pebai_ia_control($r, $w['texto'], $canal);
}

/** Instrucciones para estudiar una empresa y escribirle (las mismas para Gemini y para el Redactor). */
function pebai_ia_reglas(string $canal, bool $ca): string
{
    $email = $canal === 'email';
    $presenta = $ca ? PEBAI_IA_CA['presenta'] : PEBAI_IA_PRESENTA;
    $bajaWa = $ca ? PEBAI_IA_CA['baja_wa'] : PEBAI_IA_BAJA_WA;
    $bajaEmail = $ca ? PEBAI_IA_CA['baja_email'] : PEBAI_IA_BAJA_EMAIL;
    // 3/11: WhatsApp y email salen de la plantilla de Daniel; la IA solo da el dato, el gancho y, si lo hay, el nombre
    $formato = PEBAI_WA_GANCHO_REGLAS . ' No escribas el mensaje: lo arma el servidor con la plantilla de Daniel.';
    return "Eres Daniel, comercial de PEBAI Systems. PEBAI monta asistentes que contestan al momento por WhatsApp y web, hacen las preguntas clave y agendan la visita, "
        . "para que las instaladoras de placas solares no pierdan peticiones de presupuesto.\n"
        . "Te paso el texto de la portada de la web de una empresa. Responde SOLO con JSON.\n"
        . "1) \"encaja\": true solo si su negocio PRINCIPAL es INSTALAR placas solares fotovoltaicas a clientes (casas, comunidades, empresas, campo). "
        . "false si es tienda online, distribuidor o mayorista, fabricante, proveedor de otros instaladores, climatización/gas/calderas/aerotermia como negocio principal, "
        . "electricista generalista, reformas, asesoría o consultoría, comercializadora de luz, limpieza o mantenimiento solo, formación, promotor de parques, gran empresa nacional o internacional, "
        . "web abandonada, hackeada o en otro idioma que no sea español o catalán, o si no queda claro. Ante la duda, false. \"motivo\": una frase.\n"
        . "2) Si encaja: \"dato\": copia LITERAL (exacta, de 2 a 12 palabras) del fragmento de su web en que te basas; elige el detalle más concreto y propio de esa empresa "
        . "(un servicio poco común, una frase suya, sus zonas, idiomas, una herramienta de su web…), no algo genérico como «presupuesto gratis» si hay algo mejor. " . $formato . "\n"
        . ($ca ? "IDIOMA: su web está solo en catalán/valenciano: escribe TODO (asunto incluido) en el mismo idioma y variante que su web, tuteo, natural y cercano."
               : "IDIOMA: escribe TODO en español de España, aunque la web tenga partes en catalán, valenciano, euskera, gallego o inglés; el «dato» cópialo de una parte en español. Tuteo, natural y cercano.")
        . " Prohibido: enlaces, precios, porcentajes, cifras que no estén en la web, leyes, impuestos, ayudas, decir que son lentos o malos, "
        . "prometer resultados, hablar de otros clientes nuestros.\n"
        . 'Responde SOLO {"encaja", "motivo", "dato", "gancho", "nombre"}.';
}

/**
 * Control de calidad de lo escrito (por Gemini o por el Redactor) contra el texto real de su web:
 * nada inventado, se presenta, ofrece la baja, sin temas prohibidos y con la longitud correcta.
 */
function pebai_ia_control(?array $r, string $texto, string $canal): array
{
    $email = $canal === 'email';
    $ca = pebai_ia_solo_catalan($texto);
    $presenta = $ca ? PEBAI_IA_CA['presenta'] : PEBAI_IA_PRESENTA;
    $bajaWa = $ca ? PEBAI_IA_CA['baja_wa'] : PEBAI_IA_BAJA_WA;
    $bajaEmail = $ca ? PEBAI_IA_CA['baja_email'] : PEBAI_IA_BAJA_EMAIL;
    if (!$r || !array_key_exists('encaja', $r)) {
        return ['error' => 'La IA no ha respondido'];
    }
    if (!$r['encaja']) {
        return ['encaja' => false, 'motivo' => mb_substr((string)($r['motivo'] ?? 'No encaja'), 0, 200)];
    }
    // WhatsApp (5/11, Daniel): mensaje fijo, sin gancho de la IA. La IA solo decide si la empresa encaja; el texto lo arma pebai_wa_fijo
    if (!$email) {
        return ['encaja' => true, 'motivo' => (string)($r['motivo'] ?? ''), 'ca' => $ca, 'dato' => ''];
    }
    // Control de calidad: nada inventado, se presenta, ofrece la baja, sin temas prohibidos, longitud correcta
    $dato = trim((string)($r['dato'] ?? ''));
    // Sin gancho (no había un dato seguro) no hace falta dato: el mensaje va sin «He visto que…»
    $sinGancho = trim((string)($r['gancho'] ?? '')) === '';
    if (!$sinGancho && ($dato === '' || !str_contains(pebai_ia_norm($texto), trim(pebai_ia_norm($dato))))) {
        return ['error' => 'El dato del mensaje no aparece en su web'];
    }
    $nombre = pebai_ia_nombre((string)($r['nombre'] ?? ''), $texto);
    $g = pebai_ia_gancho((string)($r['gancho'] ?? ''), $dato);
    if ($g === null) {
        return ['error' => 'El gancho no pasa el control de calidad'];
    }
    // El asunto lleva el nombre corto de la empresa: lo arma quien guarda el texto (redactor.php) con pebai_email_componer_nuevo
    return ['encaja' => true, 'motivo' => (string)($r['motivo'] ?? ''), 'gancho' => $g, 'nombre' => $nombre, 'ca' => $ca, 'dato' => $dato];
}

/**
 * Prepara mensajes de WhatsApp: estudia con la IA las siguientes empresas de la cola que aún no tienen mensaje.
 * Las que no encajan salen de la cola con su motivo; si algo falla, se reintenta pasadas 12 h.
 * Mantiene un colchón de mensajes listos para que el agente nunca se quede parado. Lo llama el cron cada 15 min.
 */
function pebai_preparar_whatsapp(int $max = 3, int $colchon = 30): array
{
    if (PEBAI_IA_REDACTOR) {
        return ['redactor' => true];   // ahora los escribe el Redactor (api/redactor.php)
    }
    require_once __DIR__ . '/_agentes_lib.php';
    $db = pebai_agentes_db();
    $listos = (int)$db->query("SELECT COUNT(*) FROM prospectos WHERE estado = 'pendiente' AND mensaje <> '' AND nicho = 'solar'")->fetchColumn();
    $hecho = ['listos' => $listos, 'escritos' => 0, 'fuera' => 0, 'fallos' => 0];
    if ($listos >= $colchon) {
        return $hecho;
    }
    $q = $db->prepare("SELECT id, empresa, ciudad, web FROM prospectos WHERE estado = 'pendiente' AND mensaje = '' AND nicho = 'solar'
                       AND NOT (error LIKE '[ia_error]%' AND updated_at > ?) ORDER BY prioridad DESC, id LIMIT ?");
    $q->execute([date('Y-m-d H:i:s', time() - 43200), $max]);
    foreach ($q->fetchAll() as $p) {
        $now = date('Y-m-d H:i:s');
        $r = pebai_ia_prospecto((string)$p['empresa'], (string)$p['ciudad'], (string)$p['web'], 'whatsapp');
        $quien = $p['empresa'] ?: ('#' . $p['id']);
        if (isset($r['error'])) {
            $db->prepare("UPDATE prospectos SET error = ?, updated_at = ? WHERE id = ?")->execute(['[ia_error] ' . $r['error'], $now, $p['id']]);
            pebai_actividad('whatsapp', 'espera', 'Sin mensaje para ' . $quien . ' por ahora: ' . $r['error'], '', 'wa:' . $p['id']);
            $hecho['fallos']++;
        } elseif (!$r['encaja']) {
            $db->prepare("UPDATE prospectos SET estado = 'descartado', error = ?, updated_at = ? WHERE id = ?")->execute(['[ia] ' . $r['motivo'], $now, $p['id']]);
            pebai_actividad('whatsapp', 'bloqueo', 'Fuera de la cola ' . $quien . ': ' . $r['motivo'], '', 'wa:' . $p['id']);
            $hecho['fuera']++;
        } else {
            $r['mensaje'] = pebai_wa_fijo((string)$p['empresa'], (bool)$r['ca']);
            $db->prepare("UPDATE prospectos SET mensaje = ?, error = '', updated_at = ? WHERE id = ?")->execute([$r['mensaje'], $now, $p['id']]);
            pebai_actividad('whatsapp', 'cambio', 'Mensaje listo para ' . $quien, $r['mensaje'], 'wa:' . $p['id']);
            $hecho['escritos']++;
        }
    }
    return $hecho;
}

/** Igual que pebai_preparar_whatsapp, para la lista de email de placas solares (asunto_personal y cuerpo_personal). */
function pebai_preparar_email(int $max = 3, int $colchon = 20): array
{
    if (PEBAI_IA_REDACTOR) {
        return ['redactor' => true];
    }
    require_once __DIR__ . '/_agentes_lib.php';
    $db = pebai_db();
    $listos = (int)$db->query("SELECT COUNT(*) FROM email_prospectos WHERE estado = 'pendiente' AND nicho = 'energia' AND cuerpo_personal <> ''")->fetchColumn();
    $hecho = ['listos' => $listos, 'escritos' => 0, 'fuera' => 0, 'fallos' => 0];
    if ($listos >= $colchon) {
        return $hecho;
    }
    $q = $db->prepare("SELECT id, empresa, ciudad, web FROM email_prospectos WHERE estado = 'pendiente' AND nicho = 'energia' AND cuerpo_personal = ''
                       AND NOT (error LIKE '[ia_error]%' AND updated_at > ?) ORDER BY id LIMIT ?");
    $q->execute([date('Y-m-d H:i:s', time() - 43200), $max]);
    foreach ($q->fetchAll() as $p) {
        $now = date('Y-m-d H:i:s');
        $r = pebai_ia_prospecto((string)$p['empresa'], (string)$p['ciudad'], (string)$p['web'], 'email');
        $quien = $p['empresa'] ?: ('#' . $p['id']);
        if (isset($r['error'])) {
            $db->prepare("UPDATE email_prospectos SET error = ?, updated_at = ? WHERE id = ?")->execute(['[ia_error] ' . $r['error'], $now, $p['id']]);
            pebai_actividad('email', 'espera', 'Sin email para ' . $quien . ' por ahora: ' . $r['error'], '', 'em:' . $p['id']);
            $hecho['fallos']++;
        } elseif (!$r['encaja']) {
            $db->prepare("UPDATE email_prospectos SET estado = 'descartado', error = ?, updated_at = ? WHERE id = ?")->execute(['[ia] ' . $r['motivo'], $now, $p['id']]);
            pebai_actividad('email', 'bloqueo', 'Fuera de la lista ' . $quien . ': ' . $r['motivo'], '', 'em:' . $p['id']);
            $hecho['fuera']++;
        } else {
            $e = pebai_email_texto_nuevo($r, (string)$p['empresa']);
            $db->prepare("UPDATE email_prospectos SET asunto_personal = ?, cuerpo_personal = ?, asunto_recordatorio = '', cuerpo_recordatorio = ?, error = '', updated_at = ? WHERE id = ?")
               ->execute([$e['asunto'], $e['cuerpo'], $e['recordatorio'], $now, $p['id']]);
            pebai_actividad('email', 'cambio', 'Email escrito para ' . $quien . ' (basado en: «' . $r['dato'] . '»)', $e['asunto'] . "\n\n" . $e['cuerpo'], 'em:' . $p['id']);
            $hecho['escritos']++;
        }
    }
    return $hecho;
}
