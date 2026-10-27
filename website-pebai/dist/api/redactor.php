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
const RED_RESERVA_S = 7200;   // una empresa entregada a un turno no se da a otro durante 2 h

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
    return $canal === 'email'
        ? ['db' => pebai_db(), 'tabla' => 'email_prospectos', 'nicho' => 'energia', 'vacio' => "cuerpo_personal = ''", 'agente' => 'email', 'ref' => 'em:']
        : ['db' => pebai_agentes_db(), 'tabla' => 'prospectos', 'nicho' => 'solar', 'vacio' => "mensaje = ''", 'agente' => 'whatsapp', 'ref' => 'wa:'];
}

function red_cache(string $canal, int $id): string
{
    return red_dir() . '/' . ($canal === 'email' ? 'em' : 'wa') . '_' . $id . '.json';
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
    // Primero WhatsApp (es lo que más se envía), luego email; se reparte para que nunca se quede una cola sin nada
    foreach (['whatsapp' => (int)ceil($n * 0.6), 'email' => $n] as $canal => $tope) {
        $c = red_canal($canal);
        $q = $c['db']->prepare("SELECT id, empresa, ciudad, web FROM {$c['tabla']} WHERE estado = 'pendiente' AND nicho = ? AND {$c['vacio']} AND web <> ''
                                AND NOT (error LIKE '[ia_error]%' AND updated_at > ?) AND NOT (error LIKE '[redactor]%' AND updated_at > ?)
                                ORDER BY " . ($canal === 'email' ? 'id' : 'prioridad DESC, id') . " LIMIT ?");
        $q->execute([$c['nicho'], $limite, $reserva, $tope * 3]);
        foreach ($q->fetchAll() as $p) {
            if (count($out) >= ($canal === 'whatsapp' ? $tope : $n)) {
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
                                   'email_es' => pebai_ia_reglas('email', false), 'email_ca' => pebai_ia_reglas('email', true)],
                      'empresas' => $out], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false]);
    exit;
}

$in = json_decode(file_get_contents('php://input') ?: '{}', true) ?: [];
$canal = ($in['canal'] ?? '') === 'email' ? 'email' : 'whatsapp';
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
