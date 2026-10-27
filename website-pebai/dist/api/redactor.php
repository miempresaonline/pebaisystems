<?php
/*
 * PEBAI · Redactor (Claude): la rutina de la nube recoge empresas de placas solares sin mensaje, lee su web,
 * decide si encaja y escribe el primer WhatsApp o email. Sustituye a Gemini en esto desde el 27/10/2026.
 *
 * Cabecera X-Agent-Token = 'agent_token' de private/config.php.
 *   GET  ?n=8   → {reglas: {whatsapp_es, whatsapp_ca, email_es, email_ca}, cola: {...}, empresas: [{canal, id, empresa, ciudad, web, reglas, texto}]}
 *               El texto de la web lo baja el servidor y lo guarda: el control de calidad se hace contra ese mismo texto.
 *   POST JSON {canal, id, encaja, motivo, dato, mensaje | asunto + cuerpo}
 *               → {ok: true, hecho: escrito|descartado} o {ok: false, error, intentos}. Al 2.º fallo la empresa se aparca 12 h.
 * Nunca envía nada: solo deja el texto en la cola; lo envían los agentes de WhatsApp y Email con sus reglas.
 *
 * Nichos nuevos (clínicas dentales e inmobiliarias, 27/10): solo se REVISAN, sin mensaje (aún no se les escribe).
 *   canal 'revision_wa' | 'revision_em': POST {canal, id, encaja, motivo} → las que no encajan salen ('descartado');
 *   las que sí quedan marcadas '[revisado]' en su carpeta de Prospectos.
 */
require_once __DIR__ . '/_ia_lib.php';
require_once __DIR__ . '/_agentes_lib.php';
require_once __DIR__ . '/_actividad_lib.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Robots-Tag: noindex');
header('Cache-Control: no-store');

$expected = (string)(pebai_config()['agent_token'] ?? '');
if ($expected === '' || !hash_equals($expected, (string)($_SERVER['HTTP_X_AGENT_TOKEN'] ?? ''))) {
    http_response_code(403);
    echo json_encode(['ok' => false]);
    exit;
}

const RED_DIR_NOMBRE = 'redactor';
const RED_RESERVA_S = 7200;
// Qué encaja con PEBAI en cada nicho nuevo (Daniel, 27/10: «únicamente las que encajen con nosotros»)
const RED_REVISAR = [
    'dentales' => 'clínica dental privada e independiente (una clínica o un grupo local pequeño), con equipo (varios dentistas o higienistas), activa y que recibe pacientes nuevos y peticiones de cita por teléfono, WhatsApp o su web. PEBAI le encaja porque monta asistentes que contestan al momento, dan cita y recuerdan las visitas. NO encajan: franquicias y cadenas (Vitaldent, Sanitas, Adeslas, DKV, Vivanta, Dental Company, Unidental, Donte...), clínicas de aseguradoras o de hospitales, laboratorios o protésicos dentales, depósitos o tiendas de material, facultades, clínicas veterinarias, un dentista que trabaja solo, webs abandonadas o de otros países.',
    'inmobiliarias' => 'agencia inmobiliaria local e independiente, con oficina y equipo, activa, que vende y alquila viviendas de su propia cartera y recibe muchas consultas de compradores, inquilinos y propietarios (portales, WhatsApp, teléfono, su web). PEBAI le encaja porque monta asistentes que contestan al momento a cada consulta, filtran y agendan visitas. NO encajan: franquicias y grandes redes (Tecnocasa, Century 21, RE/MAX, Engel & Völkers, Redpiso, Donpiso, Look & Find, Keller Williams, eXp...), servicers y bancos (Solvia, Haya, Servihabitat, Altamira, Aliseda), portales (Idealista, Fotocasa), inmobiliarias online (Housfy, Housell), promotoras y constructoras, administradores de fincas, tasadoras, alquiler vacacional, agentes que trabajan solos, webs abandonadas o de otros países.',
];   // una empresa entregada a un turno no se da a otro durante 2 h

function red_dir(): string
{
    $d = pebai_private_dir() . '/' . RED_DIR_NOMBRE;
    if (!is_dir($d)) {
        @mkdir($d, 0700, true);
    }
    return $d;
}

/** Tabla, base de datos y nicho de cada canal. */
function red_canal(string $canal): array
{
    if (str_starts_with($canal, 'revision')) {
        return $canal === 'revision_em'
            ? ['db' => pebai_db(), 'tabla' => 'email_prospectos', 'vacio' => '1 = 1', 'agente' => 'email', 'ref' => 'em:']
            : ['db' => pebai_agentes_db(), 'tabla' => 'prospectos', 'vacio' => '1 = 1', 'agente' => 'whatsapp', 'ref' => 'wa:'];
    }
    return $canal === 'email'
        ? ['db' => pebai_db(), 'tabla' => 'email_prospectos', 'nicho' => 'energia', 'vacio' => "cuerpo_personal = ''", 'agente' => 'email', 'ref' => 'em:']
        : ['db' => pebai_agentes_db(), 'tabla' => 'prospectos', 'nicho' => 'solar', 'vacio' => "mensaje = ''", 'agente' => 'whatsapp', 'ref' => 'wa:'];
}

function red_cache(string $canal, int $id): string
{
    return red_dir() . '/' . ($canal === 'email' ? 'em' : ($canal === 'whatsapp' ? 'wa' : $canal)) . '_' . $id . '.json';
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $n = max(1, min(15, (int)($_GET['n'] ?? 8)));
    $out = [];
    $cola = [];
    $limite = date('Y-m-d H:i:s', time() - 43200);
    $reserva = date('Y-m-d H:i:s', time() - RED_RESERVA_S);
    foreach (['whatsapp', 'email'] as $canal) {
        $c = red_canal($canal);
        $q = $c['db']->prepare("SELECT COUNT(*) FROM {$c['tabla']} WHERE estado = 'pendiente' AND nicho = ? AND {$c['vacio']}");
        $q->execute([$c['nicho']]);
        $cola[$canal . '_sin_texto'] = (int)$q->fetchColumn();
    }
    $in = implode(',', array_fill(0, count(RED_REVISAR), '?'));
    foreach (['revision_wa' => 'prospectos', 'revision_em' => 'email_prospectos'] as $canal => $tabla) {
        $q = red_canal($canal)['db']->prepare("SELECT COUNT(*) FROM $tabla WHERE estado = 'pendiente' AND nicho IN ($in) AND error NOT LIKE '[revisado]%'");
        $q->execute(array_keys(RED_REVISAR));
        $cola[$canal . '_por_revisar'] = (int)$q->fetchColumn();
    }
    // Primero los mensajes de placas solares (WhatsApp y email); el resto del lote, revisar los nichos nuevos
    foreach (['whatsapp' => (int)ceil($n * 0.4), 'email' => (int)ceil($n * 0.7), 'revision_wa' => $n, 'revision_em' => $n] as $canal => $tope) {
        if (str_starts_with($canal, 'revision')) {
            $c = red_canal($canal);
            $q = $c['db']->prepare("SELECT id, empresa, ciudad, web, nicho FROM {$c['tabla']} WHERE estado = 'pendiente' AND nicho IN ($in) AND web <> ''
                                    AND error NOT LIKE '[revisado]%' AND NOT (error LIKE '[ia_error]%' AND updated_at > ?) AND NOT (error LIKE '[redactor]%' AND updated_at > ?)
                                    ORDER BY id LIMIT ?");
            $q->execute(array_merge(array_keys(RED_REVISAR), [$limite, $reserva, $tope * 3]));
            foreach ($q->fetchAll() as $p) {
                if (count($out) >= $tope) {
                    break;
                }
                $now = date('Y-m-d H:i:s');
                $w = pebai_web_texto((string)$p['web']);
                if (!$w) {
                    $c['db']->prepare("UPDATE {$c['tabla']} SET error = ?, updated_at = ? WHERE id = ?")->execute(['[ia_error] La web no responde o está vacía', $now, $p['id']]);
                    continue;
                }
                file_put_contents(red_cache($canal, (int)$p['id']), json_encode(['texto' => $w['texto'], 'intentos' => 0, 'ts' => $now], JSON_UNESCAPED_UNICODE));
                $c['db']->prepare("UPDATE {$c['tabla']} SET error = '[redactor] en curso', updated_at = ? WHERE id = ?")->execute([$now, $p['id']]);
                $out[] = ['canal' => $canal, 'id' => (int)$p['id'], 'empresa' => (string)$p['empresa'], 'ciudad' => (string)$p['ciudad'], 'web' => (string)$p['web'],
                          'reglas' => 'revision_' . $p['nicho'], 'texto' => $w['texto']];
            }
            continue;
        }
        $c = red_canal($canal);
        $q = $c['db']->prepare("SELECT id, empresa, ciudad, web FROM {$c['tabla']} WHERE estado = 'pendiente' AND nicho = ? AND {$c['vacio']} AND web <> ''
                                AND NOT (error LIKE '[ia_error]%' AND updated_at > ?) AND NOT (error LIKE '[redactor]%' AND updated_at > ?)
                                ORDER BY " . ($canal === 'email' ? 'id' : 'prioridad DESC, id') . " LIMIT ?");
        $q->execute([$c['nicho'], $limite, $reserva, $tope * 3]);
        foreach ($q->fetchAll() as $p) {
            if (count($out) >= $tope) {
                break;
            }
            $now = date('Y-m-d H:i:s');
            $w = pebai_web_texto((string)$p['web']);
            if (!$w) {
                $c['db']->prepare("UPDATE {$c['tabla']} SET error = ?, updated_at = ? WHERE id = ?")->execute(['[ia_error] La web no responde o está vacía', $now, $p['id']]);
                continue;
            }
            $ca = pebai_ia_solo_catalan($w['texto']);
            file_put_contents(red_cache($canal, (int)$p['id']), json_encode(['texto' => $w['texto'], 'intentos' => 0, 'ts' => $now], JSON_UNESCAPED_UNICODE));
            $c['db']->prepare("UPDATE {$c['tabla']} SET error = '[redactor] en curso', updated_at = ? WHERE id = ?")->execute([$now, $p['id']]);
            $out[] = ['canal' => $canal, 'id' => (int)$p['id'], 'empresa' => (string)$p['empresa'], 'ciudad' => (string)$p['ciudad'], 'web' => (string)$p['web'],
                      'reglas' => $canal . ($ca ? '_ca' : '_es'), 'boton_whatsapp' => $w['whatsapp'], 'texto' => $w['texto']];
        }
    }
    echo json_encode(['ok' => true, 'cola' => $cola,
                      'reglas' => ['whatsapp_es' => pebai_ia_reglas('whatsapp', false), 'whatsapp_ca' => pebai_ia_reglas('whatsapp', true),
                                   'email_es' => pebai_ia_reglas('email', false), 'email_ca' => pebai_ia_reglas('email', true)]
                                + array_combine(array_map(static fn($k) => 'revision_' . $k, array_keys(RED_REVISAR)), array_map(static fn($d) =>
                                    'Revisa si esta empresa ENCAJA con PEBAI Systems (consultora de procesos e IA que monta asistentes de WhatsApp, web y voz). '
                                    . 'Encaja solo si es: ' . $d . ' Ante la duda, NO encaja. Mira su negocio principal en el texto de su portada. '
                                    . 'Entrega SOLO {"canal", "id", "encaja": true|false, "motivo": una frase}. No escribas ningún mensaje.', RED_REVISAR)),
                      'empresas' => $out], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false]);
    exit;
}

$in = json_decode(file_get_contents('php://input') ?: '{}', true) ?: [];
$canal = in_array($in['canal'] ?? '', ['email', 'revision_wa', 'revision_em'], true) ? $in['canal'] : 'whatsapp';
$id = (int)($in['id'] ?? 0);
$f = red_cache($canal, $id);
$cache = is_file($f) ? (json_decode((string)file_get_contents($f), true) ?: []) : [];
if ($id <= 0 || empty($cache['texto'])) {
    http_response_code(409);
    echo json_encode(['ok' => false, 'error' => 'Esa empresa no está reservada para ti: pide la lista de nuevo (GET).']);
    exit;
}
$c = red_canal($canal);
$q = $c['db']->prepare("SELECT empresa FROM {$c['tabla']} WHERE id = ? AND estado = 'pendiente' AND {$c['vacio']}");
$q->execute([$id]);
$empresa = $q->fetchColumn();
if ($empresa === false) {
    @unlink($f);
    echo json_encode(['ok' => false, 'error' => 'Ya no está pendiente (escrita, enviada o descartada): sigue con la siguiente.']);
    exit;
}
$quien = $empresa ?: ('#' . $id);
$now = date('Y-m-d H:i:s');
if (str_starts_with($canal, 'revision')) {
    $motivo = mb_substr(trim((string)($in['motivo'] ?? '')), 0, 200) ?: 'sin motivo';
    if (!empty($in['encaja'])) {
        $c['db']->prepare("UPDATE {$c['tabla']} SET error = ?, updated_at = ? WHERE id = ?")->execute(['[revisado] ' . $motivo, $now, $id]);
        pebai_actividad('redactor', 'hito', 'Revisada y encaja: ' . $quien . ' (' . $motivo . ')', '', $c['ref'] . $id);
    } else {
        $c['db']->prepare("UPDATE {$c['tabla']} SET estado = 'descartado', error = ?, updated_at = ? WHERE id = ?")->execute(['[ia] ' . $motivo, $now, $id]);
        pebai_actividad('redactor', 'bloqueo', 'Fuera ' . $quien . ' (no encaja): ' . $motivo, '', $c['ref'] . $id);
    }
    @unlink($f);
    echo json_encode(['ok' => true, 'hecho' => !empty($in['encaja']) ? 'revisada' : 'descartado']);
    exit;
}
$r = pebai_ia_control(['encaja' => (bool)($in['encaja'] ?? false)] + array_intersect_key($in, array_flip(['motivo', 'dato', 'mensaje', 'asunto', 'cuerpo'])), (string)$cache['texto'], $canal);

if (isset($r['error'])) {
    $cache['intentos'] = (int)($cache['intentos'] ?? 0) + 1;
    if ($cache['intentos'] >= 2) {
        $c['db']->prepare("UPDATE {$c['tabla']} SET error = ?, updated_at = ? WHERE id = ?")->execute(['[ia_error] ' . $r['error'], $now, $id]);
        pebai_actividad('redactor', 'espera', 'Sin texto para ' . $quien . ' por ahora: ' . $r['error'], '', $c['ref'] . $id);
        @unlink($f);
    } else {
        file_put_contents($f, json_encode($cache, JSON_UNESCAPED_UNICODE));
    }
    echo json_encode(['ok' => false, 'error' => $r['error'], 'intentos' => $cache['intentos']], JSON_UNESCAPED_UNICODE);
    exit;
}
if (!$r['encaja']) {
    $c['db']->prepare("UPDATE {$c['tabla']} SET estado = 'descartado', error = ?, updated_at = ? WHERE id = ?")->execute(['[ia] ' . $r['motivo'], $now, $id]);
    pebai_actividad('redactor', 'bloqueo', 'Fuera ' . $quien . ' (no encaja): ' . $r['motivo'], '', $c['ref'] . $id);
    @unlink($f);
    echo json_encode(['ok' => true, 'hecho' => 'descartado']);
    exit;
}
if ($canal === 'email') {
    $c['db']->prepare("UPDATE email_prospectos SET asunto_personal = ?, cuerpo_personal = ?, error = '', updated_at = ? WHERE id = ?")->execute([$r['asunto'], $r['cuerpo'], $now, $id]);
    pebai_actividad('redactor', 'hito', 'Email escrito para ' . $quien . ' (basado en: «' . $r['dato'] . '»)', $r['asunto'] . "\n\n" . $r['cuerpo'], $c['ref'] . $id);
} else {
    $c['db']->prepare("UPDATE prospectos SET mensaje = ?, error = '', updated_at = ? WHERE id = ?")->execute([$r['mensaje'], $now, $id]);
    pebai_actividad('redactor', 'hito', 'WhatsApp escrito para ' . $quien . ' (basado en: «' . $r['dato'] . '»)', $r['mensaje'], $c['ref'] . $id);
}
@unlink($f);
echo json_encode(['ok' => true, 'hecho' => 'escrito']);
