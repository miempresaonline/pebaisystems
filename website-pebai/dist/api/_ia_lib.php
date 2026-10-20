<?php
/*
 * PEBAI · IA que lee la web de cada empresa (Gemini gratis) para la captación.
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

const PEBAI_IA_MODELOS = ['gemini-flash-lite-latest', 'gemini-3.5-flash-lite', 'gemini-flash-latest'];
const PEBAI_IA_PRESENTA = 'Hola, soy Daniel, de PEBAI Systems.';
const PEBAI_IA_BAJA_WA = 'Si no te interesa, dímelo y no te escribo más.';
const PEBAI_IA_BAJA_EMAIL = 'Si no te interesa, dímelo y no vuelvo a escribirte.';
const PEBAI_IA_PROHIBIDO = '/https?:|www\.|irpf|impuesto|deducci|\bley\b|normativa|garantiz|te prometo|clientes nuestros|otras instaladoras|\d+ ?%|€/iu';

function pebai_ia_clave(): string
{
    $f = pebai_private_dir() . '/ia.php';
    $ia = is_file($f) ? (require $f) : [];
    return (string)($ia['gemini_api_key'] ?? getenv('GEMINI_API_KEY') ?: '');
}

/** Llama a Gemini y devuelve el JSON de la respuesta (o null). Prueba el siguiente modelo si uno está saturado. */
function pebai_ia_json(string $prompt): ?array
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
            return $j;
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
    $email = $canal === 'email';
    $formato = $email
        ? '"asunto": asunto corto en minúsculas con el nombre corto de la empresa y el tema (máximo 7 palabras, sin signos raros), '
          . '"cuerpo": email de 60 a 90 palabras que empiece por "Hola:" en una línea, luego el detalle real de su web, una frase de por qué importa para no perder clientes, '
          . 'qué hacemos en una frase ("En PEBAI montamos asistentes que contestan en minutos, también fuera de horario."), UNA pregunta, y termine exactamente con "' . PEBAI_IA_BAJA_EMAIL . '". Sin firma.'
        : '"mensaje": WhatsApp de 40 a 60 palabras que empiece exactamente por "' . PEBAI_IA_PRESENTA . '", mencione el detalle real de su web, razone en una frase por qué importa para no perder clientes, '
          . 'haga UNA sola pregunta fácil de contestar sobre cómo atienden a quien pide presupuesto, y termine exactamente con "' . PEBAI_IA_BAJA_WA . '".';
    $prompt = "Eres Daniel, comercial de PEBAI Systems. PEBAI monta asistentes que contestan al momento por WhatsApp y web, hacen las preguntas clave y agendan la visita, "
        . "para que las instaladoras de placas solares no pierdan peticiones de presupuesto.\n"
        . "Te paso el texto de la portada de la web de una empresa. Responde SOLO con JSON.\n"
        . "1) \"encaja\": true solo si su negocio PRINCIPAL es INSTALAR placas solares fotovoltaicas a clientes (casas, comunidades, empresas, campo). "
        . "false si es tienda online, distribuidor o mayorista, fabricante, proveedor de otros instaladores, climatización/gas/calderas/aerotermia como negocio principal, "
        . "electricista generalista, reformas, asesoría o consultoría, comercializadora de luz, limpieza o mantenimiento solo, formación, promotor de parques, gran empresa nacional o internacional, "
        . "web abandonada, hackeada o en otro idioma que no sea español o catalán, o si no queda claro. Ante la duda, false. \"motivo\": una frase.\n"
        . "2) Si encaja: \"dato\": copia LITERAL (exacta, de 2 a 12 palabras) del fragmento de su web en que te basas; elige el detalle más concreto y propio de esa empresa "
        . "(un servicio poco común, una frase suya, sus zonas, idiomas, una herramienta de su web…), no algo genérico como «presupuesto gratis» si hay algo mejor. " . $formato . "\n"
        . "Tuteo, español de España, natural y cercano. Prohibido: enlaces, precios, porcentajes, cifras que no estén en la web, leyes, impuestos, ayudas, decir que son lentos o malos, "
        . "prometer resultados, hablar de otros clientes nuestros.\n"
        . "Ejemplos de buen WhatsApp:\n- \"Hola, soy Daniel, de PEBAI Systems. He visto que la web de EcoNítida está en español, inglés y alemán. En la costa de Granada os escribirán muchos extranjeros. "
        . "Cuando alguien os escribe en inglés o alemán, ¿quién le contesta y cuánto tarda? Si no te interesa, dímelo y no te escribo más.\"\n"
        . "- \"Hola, soy Daniel, de PEBAI Systems. Me gustó una frase de vuestra web: «No buscamos hacer muchas instalaciones. Buscamos hacerlas bien». Para eso hay que dedicar el tiempo a quien va en serio. "
        . "¿Cómo filtráis hoy las peticiones de la calculadora? Si no te interesa, dímelo y no te escribo más.\"\n\n"
        . "EMPRESA: {$empresa} ({$ciudad})\nWEB:\n" . $w['texto'];
    $r = pebai_ia_json($prompt);
    if (!$r || !array_key_exists('encaja', $r)) {
        return ['error' => 'La IA no ha respondido'];
    }
    if (!$r['encaja']) {
        return ['encaja' => false, 'motivo' => mb_substr((string)($r['motivo'] ?? 'No encaja'), 0, 200)];
    }
    // Control de calidad: nada inventado, se presenta, ofrece la baja, sin temas prohibidos, longitud correcta
    $dato = trim((string)($r['dato'] ?? ''));
    if ($dato === '' || !str_contains(pebai_ia_norm($w['texto']), trim(pebai_ia_norm($dato)))) {
        return ['error' => 'El dato del mensaje no aparece en su web'];
    }
    if ($email) {
        $asunto = trim((string)($r['asunto'] ?? ''));
        $cuerpo = trim(str_replace("\r", '', (string)($r['cuerpo'] ?? '')));
        $n = str_word_count(preg_replace('/[^\p{L}\s]/u', ' ', $cuerpo));
        if ($asunto === '' || mb_strlen($asunto) > 70 || !str_starts_with($cuerpo, 'Hola') || !str_ends_with($cuerpo, PEBAI_IA_BAJA_EMAIL)
            || preg_match(PEBAI_IA_PROHIBIDO, $asunto . ' ' . $cuerpo) || $n < 45 || $n > 110 || substr_count($cuerpo, '?') !== 1) {
            return ['error' => 'El email no pasa el control de calidad'];
        }
        return ['encaja' => true, 'motivo' => (string)($r['motivo'] ?? ''), 'asunto' => $asunto, 'cuerpo' => $cuerpo, 'dato' => $dato];
    }
    $m = trim(preg_replace('/\s+/u', ' ', (string)($r['mensaje'] ?? '')));
    $n = count(preg_split('/\s+/u', $m));
    if (!str_starts_with($m, PEBAI_IA_PRESENTA) || !str_ends_with($m, PEBAI_IA_BAJA_WA) || preg_match(PEBAI_IA_PROHIBIDO, $m)
        || $n < 32 || $n > 75 || substr_count($m, '?') !== 1) {
        return ['error' => 'El mensaje no pasa el control de calidad'];
    }
    return ['encaja' => true, 'motivo' => (string)($r['motivo'] ?? ''), 'mensaje' => $m, 'dato' => $dato];
}

/**
 * Prepara mensajes de WhatsApp: estudia con la IA las siguientes empresas de la cola que aún no tienen mensaje.
 * Las que no encajan salen de la cola con su motivo; si algo falla, se reintenta pasadas 12 h.
 * Mantiene un colchón de mensajes listos para que el agente nunca se quede parado. Lo llama el cron cada 15 min.
 */
function pebai_preparar_whatsapp(int $max = 3, int $colchon = 30): array
{
    require_once __DIR__ . '/_agentes_lib.php';
    $db = pebai_agentes_db();
    $listos = (int)$db->query("SELECT COUNT(*) FROM prospectos WHERE estado = 'pendiente' AND mensaje <> ''")->fetchColumn();
    $hecho = ['listos' => $listos, 'escritos' => 0, 'fuera' => 0, 'fallos' => 0];
    if ($listos >= $colchon) {
        return $hecho;
    }
    $q = $db->prepare("SELECT id, empresa, ciudad, web FROM prospectos WHERE estado = 'pendiente' AND mensaje = ''
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
            $db->prepare("UPDATE prospectos SET mensaje = ?, error = '', updated_at = ? WHERE id = ?")->execute([$r['mensaje'], $now, $p['id']]);
            pebai_actividad('whatsapp', 'cambio', 'Mensaje escrito para ' . $quien . ' (basado en: «' . $r['dato'] . '»)', $r['mensaje'], 'wa:' . $p['id']);
            $hecho['escritos']++;
        }
    }
    return $hecho;
}

/** Igual que pebai_preparar_whatsapp, para la lista de email de placas solares (asunto_personal y cuerpo_personal). */
function pebai_preparar_email(int $max = 3, int $colchon = 20): array
{
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
            $db->prepare("UPDATE email_prospectos SET asunto_personal = ?, cuerpo_personal = ?, error = '', updated_at = ? WHERE id = ?")->execute([$r['asunto'], $r['cuerpo'], $now, $p['id']]);
            pebai_actividad('email', 'cambio', 'Email escrito para ' . $quien . ' (basado en: «' . $r['dato'] . '»)', $r['asunto'] . "\n\n" . $r['cuerpo'], 'em:' . $p['id']);
            $hecho['escritos']++;
        }
    }
    return $hecho;
}
