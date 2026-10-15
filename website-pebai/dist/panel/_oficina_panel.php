<?php
/*
 * PEBAI · Panel — Automático › Oficina (centro de control de los agentes).
 * Lo incluye panel/index.php justo después de comprobar la sesión: usa $auth, csrf() y json_out() de allí.
 *   GET  ?oficina=1                     → estado real de cada agente y de cada departamento
 *   POST action=oficina_preguntar (q)   → "Pregunta a PEBAI": responde con Gemini usando ese mismo estado
 * Solo LEE las tablas de los demás agentes (WhatsApp, Email, prospección, embudo); no cambia nada de ellos.
 * La clave de Gemini vive en private/ia.php (fuera de public_html y fuera del repositorio).
 */
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}
foreach (['_agentes_lib.php', '_email_lib.php', '_actividad_lib.php'] as $f) {
    if (is_file(dirname(__DIR__) . '/api/' . $f)) {
        require_once dirname(__DIR__) . '/api/' . $f;
    }
}

/** Hace cuánto, en palabras. */
function of_hace(string $ts): string
{
    $t = $ts !== '' ? strtotime($ts) : false;
    if (!$t) {
        return '';
    }
    $m = (int)round((time() - $t) / 60);
    if ($m < 1) {
        return 'ahora mismo';
    }
    if ($m < 60) {
        return 'hace ' . $m . ' min';
    }
    $h = (int)round($m / 60);
    if ($h < 24) {
        return 'hace ' . $h . ' h';
    }
    $d = (int)round($h / 24);
    return $d === 1 ? 'ayer' : 'hace ' . $d . ' días';
}

function of_hora(int $ts): string
{
    $dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    return date('Y-m-d', $ts) === date('Y-m-d') ? 'hoy a las ' . date('H:i', $ts)
        : (date('Y-m-d', $ts) === date('Y-m-d', time() + 86400) ? 'mañana a las ' . date('H:i', $ts) : 'el ' . $dias[(int)date('w', $ts)] . ' ' . date('j', $ts) . ' a las ' . date('H:i', $ts));
}

/** Últimos apuntes del registro común de un agente, ya listos para pintar. */
function of_actividad(string $agente, int $n = 25): array
{
    if (!function_exists('pebai_actividad_ultimas')) {
        return [];
    }
    return array_map(static fn($r) => ['ts' => $r['ts'], 'tipo' => $r['tipo'], 'txt' => $r['resumen']], array_slice(pebai_actividad_ultimas($agente, $n), 0, $n));
}

function of_errores(array $act): array
{
    $desde = date('Y-m-d H:i:s', time() - 86400);
    return array_values(array_filter($act, static fn($e) => in_array($e['tipo'], ['error', 'freno'], true) && $e['ts'] >= $desde));
}

/** Estado estándar de un agente: trabajando · espera · dormido · error · apagado · pausado. */
function of_agente(array $base): array
{
    return $base + ['st' => 'espera', 'motivo' => '', 'hoy' => 0, 'cupo' => null, 'unidad' => '', 'ultima' => null, 'proxima' => '',
                    'errores' => [], 'necesita' => [], 'datos' => [], 'actividad' => []];
}

/* ------------------------------------------------------------- WhatsApp --- */
function of_whatsapp(): array
{
    $a = of_agente(['id' => 'whatsapp', 'dept' => 'captacion', 'nombre' => 'WhatsApp', 'icono' => 'whatsapp', 'rol' => 'Primer mensaje en frío por WhatsApp', 'unidad' => 'mensajes']);
    if (!function_exists('pebai_agente')) {
        return ['st' => 'apagado', 'motivo' => 'Este agente aún no está instalado.'] + $a;
    }
    $e = pebai_agente('whatsapp');
    $cfg = pebai_wa_config();
    $db = pebai_agentes_db();
    $a['hoy'] = pebai_wa_enviados_hoy();
    $a['cupo'] = (int)($cfg['limite_dia'] ?? 0) ?: null;
    $a['actividad'] = of_actividad('whatsapp');
    $a['errores'] = of_errores($a['actividad']);
    $v = pebai_wa_ventana();
    $latido = $e['latido_at'] !== '' ? strtotime($e['latido_at']) : 0;
    $cola = (int)$db->query("SELECT COUNT(*) FROM prospectos WHERE estado = 'pendiente'")->fetchColumn();
    $resp = (int)$db->query("SELECT COUNT(*) FROM prospectos WHERE estado = 'respondio'")->fetchColumn();
    $q = $db->prepare('SELECT COUNT(*) FROM prospectos WHERE respondido_at >= ?');
    $q->execute([date('Y-m-d 00:00:00')]);
    $respHoy = (int)$q->fetchColumn();
    if ((int)$e['pausado']) {
        $a['st'] = 'pausado';
        $a['motivo'] = 'Lo habéis pausado desde el panel. No escribe a nadie hasta que lo reanudéis.';
    } elseif (in_array($e['estado'], ['sin_arrancar', 'desconectado', 'esperando_vinculo'], true)) {
        $a['st'] = 'error';
        $a['motivo'] = ['sin_arrancar' => 'El proceso del servidor no se ha arrancado.', 'desconectado' => 'WhatsApp se ha desconectado.', 'esperando_vinculo' => 'Espera que vinculéis el móvil (código en Agentes).'][$e['estado']];
        $a['necesita'][] = $e['estado'] === 'esperando_vinculo' ? 'Vincular el móvil desde Agentes' : 'Volver a conectar el agente de WhatsApp';
    } elseif ($latido && $latido < time() - 1800) {
        $a['st'] = 'error';
        $a['motivo'] = 'No da señales desde ' . of_hora($latido) . '. El proceso del servidor puede haberse parado.';
        $a['necesita'][] = 'Revisar que el agente de WhatsApp sigue en marcha';
    } elseif ($v['abierta'] && $a['cupo'] && $a['hoy'] < $a['cupo'] && $cola > 0) {
        $a['st'] = 'trabajando';
        $a['motivo'] = 'Dentro de horario y con cupo: ' . ($a['cupo'] - $a['hoy']) . ' mensajes por enviar hoy.';
        $a['proxima'] = 'Escribe al siguiente de la cola en unos minutos';
    } else {
        $a['st'] = $v['abierta'] ? 'espera' : 'dormido';
        $a['motivo'] = !$cola ? 'No quedan empresas en la cola.' : ($a['cupo'] && $a['hoy'] >= $a['cupo'] ? 'Ya ha enviado todo el cupo de hoy.' : ($e['detalle'] ?: 'Fuera de horario.'));
        $a['proxima'] = !$cola ? 'Cuando importéis más empresas' : ($v['proxima'] ? 'Vuelve ' . of_hora($v['proxima']) : '');
        if (!$cola) {
            $a['necesita'][] = 'Importar empresas para WhatsApp (la cola está vacía)';
        }
    }
    if ($a['errores'] && $a['st'] !== 'error') {
        $a['st'] = 'error';
        $a['motivo'] = $a['errores'][0]['txt'];
    }
    if ($resp) {
        array_unshift($a['necesita'], $resp . ($resp === 1 ? ' respuesta espera' : ' respuestas esperan') . ' que alguien conteste');
    }
    $a['ultima'] = of_ultima($a['actividad'], ['envio', 'respuesta']);
    $a['datos'] = [['En cola', (string)$cola], ['Respuestas hoy', (string)$respHoy], ['Horario', $e['detalle'] && !$v['abierta'] ? 'Fuera de horario' : 'Dentro de horario'],
                   ['Último latido', $latido ? of_hace($e['latido_at']) : 'nunca']];
    foreach (pebai_wa_stats() as $s) {
        if ((int)$s['enviados'] > 0) {
            $a['datos'][] = ['Plantilla ' . $s['plantilla'], round($s['respondieron'] / $s['enviados'] * 100) . ' % responde (' . $s['enviados'] . ' envíos)'];
        }
    }
    $a['cola'] = $cola;
    $a['respuestas_hoy'] = $respHoy;
    return $a;
}

/* ---------------------------------------------------------------- Email --- */
function of_email(): array
{
    $a = of_agente(['id' => 'email', 'dept' => 'captacion', 'nombre' => 'Email', 'icono' => 'gmail', 'rol' => 'Secuencia en frío por email', 'unidad' => 'emails']);
    if (!function_exists('pebai_email_cfg')) {
        return ['st' => 'apagado', 'motivo' => 'Este agente aún no está instalado en el servidor.'] + $a;
    }
    $e = pebai_agente('email');
    $cfg = pebai_email_cfg();
    $db = pebai_email_db();
    $a['hoy'] = pebai_email_enviados_hoy();
    $a['cupo'] = pebai_email_limite($cfg) ?: null;
    $a['actividad'] = of_actividad('email');
    $a['errores'] = of_errores($a['actividad']);
    $cola = (int)$db->query("SELECT COUNT(*) FROM email_prospectos WHERE estado = 'pendiente'")->fetchColumn();
    $inter = (int)$db->query("SELECT COUNT(*) FROM email_prospectos WHERE estado IN ('interesado','respondio')")->fetchColumn();
    $v = pebai_email_ventana();
    $s7 = pebai_email_salud(7);
    if ((int)$e['pausado']) {
        $a['st'] = 'pausado';
        $a['motivo'] = 'Lo habéis pausado desde el panel.';
    } elseif ($e['estado'] === 'sin_configurar') {
        $a['st'] = 'apagado';
        $a['motivo'] = 'Falta configurar el buzón desde el que escribe. Sin él no envía nada.';
        $a['necesita'][] = 'Configurar el buzón del email en frío (Captación › Email)';
    } elseif ($a['errores']) {
        $a['st'] = 'error';
        $a['motivo'] = $a['errores'][0]['txt'];
        $a['necesita'][] = 'Revisar el error del agente de email';
    } elseif ($v['abierta'] && $a['cupo'] && $a['hoy'] < $a['cupo'] && $cola > 0) {
        $a['st'] = 'trabajando';
        $a['motivo'] = 'Dentro de horario y con cupo: ' . ($a['cupo'] - $a['hoy']) . ' emails por enviar hoy.';
        $a['proxima'] = 'Envía el siguiente en unos minutos';
    } else {
        $a['st'] = $v['abierta'] ? 'espera' : 'dormido';
        $a['motivo'] = !$cola ? 'No quedan empresas en la cola.' : ($a['cupo'] && $a['hoy'] >= $a['cupo'] ? 'Ya ha enviado el cupo de hoy.' : ($e['detalle'] ?: 'Fuera de horario.'));
        $a['proxima'] = $v['proxima'] ? 'Vuelve ' . of_hora($v['proxima']) : '';
    }
    if ($inter) {
        array_unshift($a['necesita'], $inter . ($inter === 1 ? ' empresa ha respondido' : ' empresas han respondido') . ' y espera contestación');
    }
    $a['ultima'] = of_ultima($a['actividad'], ['envio', 'respuesta']);
    $a['datos'] = [['En cola', (string)$cola], ['Calentamiento', 'Escalón ' . ((int)$cfg['escalon'] + 1) . ' · ' . ($a['cupo'] ?: 0) . ' al día'],
                   ['Rebotes 7 días', $s7['rebotes_pct'] . ' %'], ['Respuestas 7 días', (string)$s7['respuestas']], ['Bajas 7 días', (string)$s7['bajas']]];
    $a['cola'] = $cola;
    return $a;
}

/* ------------------------------------------------------------ Prospección --- */
function of_scraper(): array
{
    $a = of_agente(['id' => 'scraper', 'dept' => 'captacion', 'nombre' => 'Scraper', 'icono' => 'googlemaps', 'rol' => 'Encuentra empresas y sus contactos', 'unidad' => 'empresas entregadas']);
    $a['actividad'] = of_actividad('prospeccion', 30);
    $a['errores'] = of_errores($a['actividad']);
    $hoy = date('Y-m-d');
    $enc = $ent = $mov = $mail = 0;
    $lotes = 0;
    foreach ($a['actividad'] as $e) {
        if (substr($e['ts'], 0, 10) !== $hoy || !preg_match('/(\d+) empresas encontradas, (\d+) entregadas \((\d+) con móvil, (\d+) con email/u', $e['txt'], $m)) {
            continue;
        }
        $lotes++;
        $enc += (int)$m[1];
        $ent += (int)$m[2];
        $mov += (int)$m[3];
        $mail += (int)$m[4];
    }
    $a['hoy'] = $ent;
    $ult = $a['actividad'][0]['ts'] ?? '';
    $reciente = $ult !== '' && strtotime($ult) > time() - 900;
    $a['st'] = $a['errores'] ? 'error' : ($reciente ? 'trabajando' : 'dormido');
    $a['motivo'] = $a['errores'] ? $a['errores'][0]['txt']
        : ($reciente ? 'Está subiendo lotes ahora mismo.' : 'Corre en el ordenador del equipo y se activa cuando lanzáis una búsqueda.' . ($ult ? ' Último lote ' . of_hace($ult) . '.' : ''));
    $a['proxima'] = 'Cuando lancéis la siguiente búsqueda';
    $a['ultima'] = of_ultima($a['actividad'], ['hito']);
    $a['datos'] = [['Lotes hoy', (string)$lotes], ['Encontradas hoy', (string)$enc], ['Con móvil', (string)$mov], ['Con email', (string)$mail]];
    return $a;
}

/* --------------------------------------------------------------- Embudo --- */
function of_embudo(PDO $db): array
{
    $hoy = date('Y-m-d 00:00:00');
    $q = $db->prepare("SELECT COUNT(*) FROM eventos WHERE ts >= ? AND auto = 1 AND tipo IN ('contactado','cita','sesion')");
    $q->execute([$hoy]);
    $fasesHoy = (int)$q->fetchColumn();
    $ultFase = $db->query("SELECT e.ts, e.tipo, l.empresa FROM eventos e LEFT JOIN leads l ON l.id = e.lead_id WHERE e.auto = 1 ORDER BY e.id DESC LIMIT 1")->fetch();
    $sinRevisar = (int)$db->query("SELECT COUNT(*) FROM leads WHERE estado = 'nuevo'")->fetchColumn();
    $q = $db->prepare("SELECT COUNT(*) FROM leads WHERE estado = 'nuevo' AND created_at < ?");
    $q->execute([date('Y-m-d H:i:s', time() - 86400)]);
    $tarde = (int)$q->fetchColumn();
    $nombres = ['contactado' => 'En revisión', 'cita' => 'Cita agendada', 'sesion' => 'Sesión hecha', 'nuevo' => 'Solicitud', 'no_asistio' => 'No se presentó', 'cliente' => 'Cliente', 'descartado' => 'Descartado'];
    $fases = of_agente(['id' => 'fases', 'dept' => 'embudo', 'nombre' => 'Fases', 'glifo' => 'flow', 'rol' => 'Mueve cada solicitud de fase', 'unidad' => 'cambios de fase automáticos',
        'st' => $fasesHoy ? 'trabajando' : 'espera', 'motivo' => 'Cambia la fase en cuanto pasa algo: se abre la ficha, se reserva o termina la sesión.', 'hoy' => $fasesHoy,
        'ultima' => $ultFase ? ['ts' => $ultFase['ts'], 'txt' => ($ultFase['empresa'] ?: 'Una solicitud') . ' pasó a ' . ($nombres[$ultFase['tipo']] ?? $ultFase['tipo'])] : null,
        'proxima' => 'Al siguiente cambio', 'datos' => [['Sin revisar', (string)$sinRevisar], ['Con más de 24 h', (string)$tarde]]]);
    if ($sinRevisar) {
        $fases['necesita'][] = $sinRevisar . ($sinRevisar === 1 ? ' solicitud nueva sin revisar' : ' solicitudes nuevas sin revisar') . ($tarde ? ' (' . $tarde . ' con más de 24 h)' : '');
    }
    // Recordatorios: el cron deja la hora de su última pasada
    $last = pebai_private_dir() . '/recordatorios-cron.last';
    $lastTs = is_file($last) ? filemtime($last) : 0;
    $q = $db->prepare("SELECT COUNT(*) FROM citas WHERE estado = 'reservada' AND (rec24 = 1 OR rec1 = 1) AND updated_at >= ?");
    $q->execute([$hoy]);
    $recHoy = (int)$q->fetchColumn();
    $prox = $db->query("SELECT c.inicio, l.empresa FROM citas c LEFT JOIN leads l ON l.id = c.lead_id WHERE c.estado = 'reservada' AND c.rec1 = 0 AND c.inicio >= '" . gmdate('Y-m-d\TH:i:s') . "' ORDER BY c.inicio LIMIT 1")->fetch();
    $rec = of_agente(['id' => 'recordatorios', 'dept' => 'embudo', 'nombre' => 'Recordatorios', 'glifo' => 'bell', 'rol' => 'Avisa al cliente 24 h y 1 h antes', 'unidad' => 'recordatorios',
        'hoy' => $recHoy, 'datos' => [['Última revisión', $lastTs ? of_hace(date('Y-m-d H:i:s', $lastTs)) : 'nunca'], ['Cada', '15 minutos']]]);
    if ($lastTs && $lastTs < time() - 3600) {
        $rec['st'] = 'error';
        $rec['motivo'] = 'No revisa desde ' . of_hora($lastTs) . '. La tarea programada puede haberse parado.';
        $rec['necesita'][] = 'Revisar la tarea programada de recordatorios en hPanel';
    } else {
        $rec['st'] = 'espera';
        $rec['motivo'] = 'Revisa cada 15 minutos si hay que avisar a alguien.';
    }
    if ($prox) {
        $rec['proxima'] = 'Próxima sesión: ' . ($prox['empresa'] ?: 'sin solicitud') . ', ' . of_hora(strtotime($prox['inicio'] . (str_ends_with($prox['inicio'], 'Z') ? '' : 'Z')));
    } else {
        $rec['proxima'] = 'No hay sesiones próximas';
    }
    // Cal.com: última reserva y avisos rechazados
    $ultCita = $db->query("SELECT c.created_at, c.estado, l.empresa, c.nombre FROM citas c LEFT JOIN leads l ON l.id = c.lead_id ORDER BY c.created_at DESC LIMIT 1")->fetch();
    $proxN = (int)$db->query("SELECT COUNT(*) FROM citas WHERE estado = 'reservada' AND inicio >= '" . gmdate('Y-m-d\TH:i:s') . "'")->fetchColumn();
    $log = @file(pebai_private_dir() . '/errors.log') ?: [];
    $firmas = count(array_filter($log, static fn($l) => strpos($l, 'CALCOM: firma no válida (firma distinta') !== false && substr($l, 1, 10) === date('Y-m-d')));
    $cal = of_agente(['id' => 'calcom', 'dept' => 'embudo', 'nombre' => 'Cal.com', 'glifo' => 'cal', 'rol' => 'Recibe reservas, cambios y cancelaciones', 'unidad' => 'reservas nuevas',
        'st' => $firmas ? 'error' : 'espera', 'motivo' => $firmas ? 'Hoy Cal.com ha mandado avisos con una firma que no coincide: revisad el secreto del webhook.' : 'Esperando reservas, cambios o cancelaciones.',
        'ultima' => $ultCita ? ['ts' => $ultCita['created_at'], 'txt' => ($ultCita['empresa'] ?: $ultCita['nombre'] ?: 'Alguien') . ($ultCita['estado'] === 'cancelada' ? ' canceló' : ' reservó')] : null,
        'proxima' => 'Cuando alguien reserve', 'datos' => [['Sesiones próximas', (string)$proxN]]]);
    $q = $db->prepare('SELECT COUNT(*) FROM citas WHERE created_at >= ?');
    $q->execute([$hoy]);
    $cal['hoy'] = (int)$q->fetchColumn();
    return [$fases, $rec, $cal];
}

function of_ultima(array $act, array $tipos): ?array
{
    foreach ($act as $e) {
        if (in_array($e['tipo'], $tipos, true)) {
            return ['ts' => $e['ts'], 'txt' => $e['txt']];
        }
    }
    return $act ? ['ts' => $act[0]['ts'], 'txt' => $act[0]['txt']] : null;
}

/** Todo el estado de la oficina. Cada agente va aislado: si uno falla, el resto se sigue viendo. */
function of_estado(PDO $db): array
{
    $ags = [];
    foreach (['of_scraper', 'of_whatsapp', 'of_email'] as $fn) {
        try {
            $ags[] = $fn();
        } catch (Throwable $e) {
            pebai_log('OFICINA ' . $fn . ': ' . $e->getMessage());
            $ags[] = of_agente(['id' => substr($fn, 3), 'dept' => 'captacion', 'nombre' => ucfirst(substr($fn, 3)), 'st' => 'error', 'motivo' => 'No se ha podido leer su estado.']);
        }
    }
    try {
        array_push($ags, ...of_embudo($db));
    } catch (Throwable $e) {
        pebai_log('OFICINA embudo: ' . $e->getMessage());
    }
    foreach ($ags as &$a) {
        foreach ($a['actividad'] as &$e) {
            $e['hace'] = of_hace($e['ts']);
        }
        unset($e);
        if ($a['ultima']) {
            $a['ultima']['hace'] = of_hace($a['ultima']['ts']);
        }
    }
    unset($a);
    return $ags;
}

/* ------------------------------------------------------------------ rutas --- */
if ($auth && isset($_GET['oficina'])) {
    json_out(['ok' => true, 'ahora' => date('Y-m-d H:i:s'), 'csrf' => csrf(), 'agentes' => of_estado(pebai_db()),
              'ia' => is_file(pebai_private_dir() . '/ia.php')]);
}

if ($auth && ($_POST['action'] ?? '') === 'oficina_preguntar') {
    if (!hash_equals($_SESSION['csrf'] ?? '', $_POST['csrf'] ?? '')) {
        json_out(['ok' => false, 'error' => 'Sesión caducada. Recarga la página.'], 400);
    }
    $pregunta = mb_substr(trim((string)($_POST['q'] ?? '')), 0, 500);
    if ($pregunta === '') {
        json_out(['ok' => false, 'error' => 'Escribe una pregunta.'], 422);
    }
    $ia = is_file(pebai_private_dir() . '/ia.php') ? (require pebai_private_dir() . '/ia.php') : [];
    $key = (string)($ia['gemini_api_key'] ?? '');
    if ($key === '') {
        json_out(['ok' => false, 'error' => 'Falta configurar la IA en el servidor.'], 503);
    }
    // Límite sencillo: 30 preguntas por hora y sesión
    $_SESSION['of_q'] = array_values(array_filter($_SESSION['of_q'] ?? [], static fn($t) => $t > time() - 3600));
    if (count($_SESSION['of_q']) >= 30) {
        json_out(['ok' => false, 'error' => 'Demasiadas preguntas seguidas. Espera un rato.'], 429);
    }
    $_SESSION['of_q'][] = time();
    // Contexto: solo estados, cifras y lo que han hecho (empresas, nunca teléfonos ni emails)
    $ctx = [];
    foreach (of_estado(pebai_db()) as $a) {
        $ctx[] = ['agente' => $a['nombre'], 'departamento' => $a['dept'], 'estado' => $a['st'], 'por_que' => $a['motivo'], 'hoy' => $a['hoy'] . ' ' . $a['unidad'] . ($a['cupo'] ? ' de ' . $a['cupo'] : ''),
                  'ultima' => $a['ultima']['txt'] ?? '', 'cuando' => $a['ultima']['hace'] ?? '', 'proximo' => $a['proxima'], 'necesita_del_equipo' => $a['necesita'],
                  'errores_24h' => array_map(static fn($e) => $e['ts'] . ' ' . $e['txt'], $a['errores']), 'datos' => $a['datos'],
                  'actividad_reciente' => array_map(static fn($e) => substr($e['ts'], 5, 11) . ' ' . $e['tipo'] . ': ' . $e['txt'], array_slice($a['actividad'], 0, 12))];
    }
    $db = pebai_db();
    $embudo = $db->query("SELECT estado, COUNT(*) n FROM leads GROUP BY estado")->fetchAll(PDO::FETCH_KEY_PAIR);
    $datos = json_encode(['agentes' => $ctx, 'solicitudes_por_fase' => $embudo], JSON_UNESCAPED_UNICODE);
    $sys = "Eres PEBAI, el centro de control de los agentes automáticos de PEBAI Systems, una consultora española de procesos e Inteligencia Artificial. "
         . "Hablas con Adrián o Daniel, los dueños. Responde en español de España, con tuteo, como un compañero que conoce bien la oficina.\n"
         . "Reglas:\n"
         . "1. Contesta exactamente a lo que te preguntan, primero la respuesta directa en una frase. No repitas la lista de tareas pendientes si no la piden o si no tiene que ver.\n"
         . "2. Si es un saludo, un 'todo bien', un 'gracias' o una charla corta, contesta con naturalidad en una o dos frases; solo si hay algo urgente (un error) menciónalo de pasada.\n"
         . "3. Usa SOLO los datos de abajo. Da cifras, nombres de agentes y cuándo ('hace 10 min', 'mañana a las 9:00'). Si algo no está en los datos, dilo claro y no lo inventes.\n"
         . "4. Explica los estados en palabras normales: trabajando, en espera (dentro de horario sin nada que hacer), durmiendo (fuera de horario o sin cola), apagado (falta configurarlo), error, en pausa.\n"
         . "5. Breve: máximo 5 frases. Usa una lista con guiones solo si hay 3 cosas o más. Negrita con **...** solo para lo más importante.\n"
         . "Fecha y hora actual: " . date('d/m/Y H:i') . ".\n\nDATOS DE LA OFICINA (JSON):\n" . $datos;
    // Conversación: las últimas preguntas y respuestas, para entender "¿y el email?" o "¿por qué?"
    $contents = [];
    $hist = json_decode((string)($_POST['h'] ?? '[]'), true);
    foreach (array_slice(is_array($hist) ? $hist : [], -4) as $t) {
        if (!is_array($t) || !isset($t['q'], $t['a'])) {
            continue;
        }
        $contents[] = ['role' => 'user', 'parts' => [['text' => mb_substr((string)$t['q'], 0, 500)]]];
        $contents[] = ['role' => 'model', 'parts' => [['text' => mb_substr((string)$t['a'], 0, 1500)]]];
    }
    $contents[] = ['role' => 'user', 'parts' => [['text' => $pregunta]]];
    $body = json_encode([
        'systemInstruction' => ['parts' => [['text' => $sys]]],
        'contents' => $contents,
        'generationConfig' => ['temperature' => 0.4, 'maxOutputTokens' => 2048],
    ], JSON_UNESCAPED_UNICODE);
    // Si un modelo está saturado o no existe, prueba el siguiente (el gratuito se satura a ratos)
    $txt = '';
    $code = 0;
    $raw = '';
    foreach (['gemini-flash-latest', 'gemini-3.5-flash', 'gemini-flash-lite-latest', 'gemini-2.5-flash-lite'] as $modelo) {
        $ch = curl_init('https://generativelanguage.googleapis.com/v1beta/models/' . $modelo . ':generateContent');
        curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $body, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 30,
                                CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'x-goog-api-key: ' . $key]]);
        $raw = curl_exec($ch);
        $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        $j = json_decode((string)$raw, true);
        foreach ($j['candidates'][0]['content']['parts'] ?? [] as $p) {
            $txt .= (string)($p['text'] ?? '');
        }
        if ($code === 200 && trim($txt) !== '') {
            break;
        }
        $txt = '';
        if (!in_array($code, [404, 429, 500, 503], true)) {
            break;
        }
    }
    if ($code !== 200 || trim($txt) === '') {
        pebai_log('OFICINA IA: HTTP ' . $code . ' ' . mb_substr((string)$raw, 0, 300));
        json_out(['ok' => false, 'error' => $code === 429 ? 'La IA ha llegado a su límite gratuito por ahora. Prueba en unos minutos.' : 'La IA no ha podido responder ahora.'], 502);
    }
    json_out(['ok' => true, 'respuesta' => trim($txt)]);
}
