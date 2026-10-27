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
foreach (['_agentes_lib.php', '_email_lib.php', '_actividad_lib.php', '_ia_lib.php'] as $f) {
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
    // Un error ya superado no cuenta: si después volvió a conectarse, el cartel no sigue en rojo 24 h
    if ($e['estado'] === 'conectado') {
        $reconexion = '';
        foreach ($a['actividad'] as $ev) {
            if ($ev['txt'] === 'Conectado a WhatsApp') {
                $reconexion = $ev['ts'];
                break;
            }
        }
        $a['errores'] = array_values(array_filter($a['errores'], static fn($ev) => $ev['ts'] > $reconexion));
    }
    $v = pebai_wa_ventana();
    $latido = $e['latido_at'] !== '' ? strtotime($e['latido_at']) : 0;
    $cola = (int)$db->query("SELECT COUNT(*) FROM prospectos WHERE estado = 'pendiente' AND nicho = 'solar'")->fetchColumn();
    // Respuestas pendientes: lo mismo que «Te toca» en Conversaciones (sin las que ya contestaste desde el móvil)
    require_once dirname(__DIR__) . '/api/_conversaciones_lib.php';
    $resp = count(array_filter(pebai_conv_datos(), static fn($f) => $f['canal'] === 'whatsapp' && $f['te_toca']));
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
    $a['pausado'] = (int)$e['pausado'];
    $a['acciones'] = ['pausa' => 'agente_pausa', 'ajustes' => 'whatsapp'];
    if ($e['estado'] === 'esperando_vinculo' && $e['codigo'] !== '') {
        $a['codigo'] = (string)$e['codigo'];
    }
    $a['datos'] = [['Empresas en su cola', (string)$cola . ' (lista de Captación › Prospectos)'], ['Respuestas hoy', (string)$respHoy], ['Horario', $e['detalle'] && !$v['abierta'] ? 'Fuera de horario' : 'Dentro de horario'],
                   ['Último latido', $latido ? of_hace($e['latido_at']) : 'nunca']];
    foreach (pebai_wa_stats() as $s) {
        if ((int)$s['enviados'] > 0) {
            $a['datos'][] = ['Plantilla ' . $s['plantilla'], round($s['respondieron'] / $s['enviados'] * 100) . ' % responde (' . $s['enviados'] . ' envíos)'];
        }
    }
    $a['cola'] = $cola;
    $a['respuestas_hoy'] = $respHoy;
    $a['entregas'] = of_trabajo_captacion('whatsapp');
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
    // Respuestas pendientes: lo mismo que «Te toca» en Conversaciones (un «respondio» puesto a mano, p. ej. info pedida por WhatsApp, no cuenta)
    require_once dirname(__DIR__) . '/api/_conversaciones_lib.php';
    $inter = count(array_filter(pebai_conv_datos(), static fn($f) => $f['canal'] === 'email' && $f['te_toca']));
    $v = pebai_email_ventana();
    $s7 = pebai_email_salud(7);
    if ((int)$e['pausado']) {
        $a['st'] = 'pausado';
        $a['motivo'] = 'Lo habéis pausado desde el panel.';
    } elseif ($e['estado'] === 'sin_configurar') {
        $a['st'] = 'apagado';
        $a['motivo'] = 'Falta configurar el buzón desde el que escribe. Sin él no envía nada.';
        $a['necesita'][] = 'Configurar el buzón del email en frío (Captación › Email)';
    } elseif ($e['latido_at'] !== '' && strtotime($e['latido_at']) < time() - 1800) {
        $a['st'] = 'error';
        $a['motivo'] = 'No da señales desde ' . of_hora(strtotime($e['latido_at'])) . '. El cron de hPanel que lo mueve cada 5 minutos puede haberse parado.';
        $a['necesita'][] = 'Revisar el cron del agente de email en hPanel';
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
    $a['pausado'] = (int)$e['pausado'];
    $a['acciones'] = ['pausa' => 'email_pausa', 'ir' => 'email'];
    $a['datos'] = [['Empresas en su cola', (string)$cola . ' (lista de Captación › Email)'], ['Calentamiento', 'Escalón ' . ((int)$cfg['escalon'] + 1) . ' · ' . ($a['cupo'] ?: 0) . ' al día'],
                   ['Rebotes 7 días', $s7['rebotes_pct'] . ' %'], ['Respuestas 7 días', (string)$s7['respuestas']], ['Bajas 7 días', (string)$s7['bajas']]];
    $a['cola'] = $cola;
    return $a;
}

/* ------------------------------------------------------------ Prospección --- */
/** "energia_malaga: 65 empresas encontradas, 44 entregadas (35 con móvil, …) · fecha" → "Energía en Málaga: 65 encontradas, 44 útiles". */
function of_lote_bonito(string $t): string
{
    if (preg_match('/^(\p{L}+) \((\d+) provincias? revisadas?\): (\d+) empresas con móvil importadas/u', $t, $m)) {
        return 'Pasó ' . $m[3] . ' empresas de ' . mb_strtolower($m[1], 'UTF-8') . ' (' . $m[2] . ' provincias) a Prospectos, para revisar';
    }
    if (!preg_match('/^([\p{Ll}0-9_]+): (\d+) empresas encontradas, (\d+) entregadas(?: \((\d+) con móvil, (\d+) con email)?/u', $t, $m)) {
        return $t;
    }
    $acentos = ['energia' => 'Energía', 'malaga' => 'Málaga', 'málaga' => 'Málaga', 'cordoba' => 'Córdoba', 'leon' => 'León', 'cadiz' => 'Cádiz', 'almeria' => 'Almería', 'avila' => 'Ávila',
                'caceres' => 'Cáceres', 'jaen' => 'Jaén', 'castellon' => 'Castellón', 'logrono' => 'Logroño', 'clinicas' => 'Clínicas', 'gestorias' => 'Gestorías', 'peluquerias' => 'Peluquerías'];
    $partes = explode('_', $m[1]);
    $bonito = static fn($w) => $acentos[$w] ?? mb_convert_case($w, MB_CASE_TITLE, 'UTF-8');
    // "nicho_ciudad" es lo habitual; con más trozos no se sabe dónde acaba el nicho, así que va todo seguido
    $nicho = count($partes) === 2 ? $bonito($partes[0]) : implode(' ', array_map($bonito, $partes));
    $ciudad = count($partes) === 2 ? $bonito($partes[1]) : '';
    return $nicho . ($ciudad !== '' ? ' en ' . $ciudad : '') . ': ' . $m[2] . ' encontradas, ' . $m[3] . ' útiles' . (isset($m[4]) ? ' (' . $m[4] . ' con móvil, ' . $m[5] . ' con email)' : '');
}

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
    $ult = $a['actividad'][0] ?? null;
    // "Trabajando" solo si lo último fue un lote de empresas hace menos de 15 min. Un "Parado…" (tipo espera) es pausa, no trabajo.
    // Al empezar cada provincia apunta "Buscando …" (una provincia tarda hasta ~30 min); al acabarla, el lote.
    $esLote = $ult && preg_match('/empresas encontradas/u', $ult['txt']);
    $buscando = $ult && preg_match('/^Buscando/u', $ult['txt']);
    $reciente = ($esLote && strtotime($ult['ts']) > time() - 900) || ($buscando && strtotime($ult['ts']) > time() - 2700);
    // El barrido escribe su log mientras trabaja (una provincia puede tardar horas): si se ha movido hace poco, está trabajando
    $logs = glob(dirname(pebai_private_dir(), 3) . '/scratch/prospeccion/tanda_*.log') ?: [];
    usort($logs, static fn($x, $y) => filemtime($y) <=> filemtime($x));
    $vivo = $logs && filemtime($logs[0]) > time() - 600;
    if ($vivo && !$reciente) {
        $reciente = true;
        $cola = (string)@file_get_contents($logs[0], false, null, max(0, filesize($logs[0]) - 65536));
        preg_match_all('/^=== (.+) ===$/mu', $cola, $prov);
        $buscando = true;
        $ult = ['txt' => 'Buscando instaladoras de placas solares' . ($prov[1] ? ' en ' . end($prov[1]) : ''), 'ts' => date('Y-m-d H:i:s'), 'tipo' => 'espera'];
    }
    // Revisión tranquila de la cola (cuando ya no hay nada nuevo que buscar): cada 30 min repasa unas pocas
    $revisando = !$reciente && $ult && preg_match('/^Revisión:/u', $ult['txt']) && strtotime($ult['ts']) > time() - 2700;
    if ($revisando) {
        $reciente = true;
    }
    $parado = !$vivo && $ult && $ult['tipo'] === 'espera' && !preg_match('/^Revisión:/u', $ult['txt']);
    $callado = !$reciente && !$parado && $ult && strtotime($ult['ts']) < time() - 12 * 3600;
    $a['st'] = $a['errores'] || $callado ? 'error' : ($reciente ? 'trabajando' : ($parado ? 'pausado' : 'dormido'));
    $a['motivo'] = $a['errores'] ? $a['errores'][0]['txt']
        : ($revisando ? 'Ya no busca (España recorrida): repasa la cola poco a poco para que todo esté bien. ' . $ult['txt'] . '.'
        : ($reciente ? ($buscando ? $ult['txt'] . '.' : 'Está buscando empresas ahora mismo.') . ' Hoy lleva ' . $ent . ($ent === 1 ? ' empresa nueva' : ' empresas nuevas') . ($ent ? '.' : ': España está casi recorrida; si una vuelta entera no saca nada, se para solo.') : ($parado ? $ult['txt'] . ' (desde ' . of_hace($ult['ts']) . ').' : 'Corre en el servidor y recorre España sin parar buscando instaladoras de placas solares.')));
    if ($callado && !$a['errores']) {
        $a['motivo'] = 'No da señales desde ' . of_hace($ult['ts']) . ' y no está en pausa. El proceso del servidor puede haberse parado.';
        $a['necesita'][] = 'Revisar el scraper en el servidor: no da señales';
    }
    // Nicho terminado (idea de Daniel, 27/10): España revisada entera; espera a que Daniel le dé otro nicho
    // Cada serie parada por agotada deja ~/prospeccion/PAUSA_<serie>: se ve siempre, no solo justo al pararse
    $agotadas = array_map(static fn($f) => substr(basename($f), 6), glob(dirname(pebai_private_dir(), 3) . '/prospeccion/PAUSA_*') ?: []);
    if ($agotadas) {
        $nombres = ['solar' => 'placas solares', 'climatizacion' => 'climatización', 'formacion' => 'formación (oposiciones, academias, idiomas)', 'dental' => 'clínicas dentales', 'inmobiliaria' => 'inmobiliarias'];
        $lista = implode(', ', array_map(static fn($s) => $nombres[$s] ?? $s, $agotadas));
        if (!$reciente) {
            $a['necesita'][] = 'Nicho terminado (' . $lista . '): España revisada entera. Dame otro nicho en el chat';
            $a['motivo'] = 'Nicho terminado: ' . $lista . '. Ha revisado toda España y ya no salen empresas nuevas. Dame otro nicho y sigue buscando. ' . $a['motivo'];
        }
    }
    $a['proxima'] = $parado ? 'Cuando se quite la pausa' : 'Sigue con la siguiente provincia';
    $a['ultima'] = of_ultima($a['actividad'], ['hito']);
    $cola = (int)pebai_db()->query("SELECT COUNT(*) FROM prospectos WHERE estado = 'pendiente' AND nicho = 'solar'")->fetchColumn();
    $a['datos'] = [['En cola de WhatsApp', (string)$cola], ['Encontradas hoy', (string)$enc], ['Útiles hoy', (string)$ent], ['Con móvil hoy', (string)$mov]];
    if (!empty($lista)) {
        $a['datos'][] = ['Nichos terminados', $lista];
    }
    // «Su trabajo»: cada lote que ha dejado en su carpeta de Prospectos
    $a['entregas'] = [];
    foreach (pebai_actividad_ultimas('prospeccion', 120) as $r) {
        if (preg_match('/^(.+?): a su carpeta de Prospectos/u', (string)$r['resumen'], $m)) {
            $a['entregas'][] = ['ts' => $r['ts'], 'clase' => 'lote', 'titulo' => $m[1], 'texto' => '', 'url' => '', 'img' => '', 'foto' => ''];
            if (count($a['entregas']) >= 30) {
                break;
            }
        }
    }
    $a['acciones'] = ['ir' => 'prospectos'];
    foreach ($a['actividad'] as &$e) {
        $e['txt'] = of_lote_bonito($e['txt']);
    }
    unset($e);
    if ($a['ultima']) {
        $a['ultima']['txt'] = of_lote_bonito($a['ultima']['txt']);
    }
    return $a;
}

/** Cerebro: lee todos los chats de WhatsApp de Daniel (api/_cerebro_lib.php), avisa a la oficina y aprende. Nunca envía. */
function of_cerebro(): array
{
    require_once dirname(__DIR__) . '/api/_cerebro_lib.php';
    $a = of_agente(['id' => 'cerebro', 'dept' => 'captacion', 'nombre' => 'Cerebro', 'glifo' => 'flow', 'rol' => 'Lee todos tus chats de WhatsApp, avisa a la oficina y aprende de cómo respondes', 'unidad' => 'mensajes leídos']);
    $a['actividad'] = of_actividad('cerebro', 30);
    $a['errores'] = of_errores($a['actividad']);
    $c = pebai_cerebro_cifras();
    $a['hoy'] = $c['hoy'];
    $ult = $a['actividad'][0] ?? null;
    $reciente = $ult && strtotime($ult['ts']) > time() - 1200;
    $a['st'] = $a['errores'] ? 'error' : ($reciente ? 'trabajando' : 'espera');
    $a['motivo'] = $a['errores'] ? $a['errores'][0]['txt']
        : ($reciente ? $ult['txt']
        : ($c['mensajes'] ? 'Escuchando tus chats: ' . number_format($c['mensajes'], 0, ',', '.') . ' mensajes de ' . $c['chats'] . ' chats leídos.'
        : 'Esperando a que se vuelva a vincular WhatsApp para leer todo el historial.'));
    if (!$c['mensajes']) {
        $a['necesita'][] = 'Volver a vincular WhatsApp (escanear el QR) para que lea el historial antiguo';
    }
    $a['proxima'] = 'Siempre escuchando';
    $a['ultima'] = of_ultima($a['actividad'], ['hito']);
    $a['datos'] = [
        ['Mensajes leídos', number_format($c['mensajes'], 0, ',', '.')],
        ['Chats', (string)$c['chats']],
        ['Escritos por ti', number_format($c['mios'], 0, ',', '.')],
        ['Desde', $c['desde'] ? date('d/m/Y', $c['desde']) : '—'],
    ];
    // Lo que ha sacado con Claude: chats por tipo, y en «Su trabajo» los borradores y a quién te toca contestar (nunca lo personal)
    $db = pebai_cerebro_db();
    $clases = $db->query("SELECT clase, COUNT(*) FROM contactos WHERE clase <> '' GROUP BY clase")->fetchAll(PDO::FETCH_KEY_PAIR);
    if ($clases) {
        $nom = ['cliente' => 'clientes', 'negocio' => 'de trabajo', 'prospecto' => 'prospectos', 'personal' => 'personales', 'spam' => 'spam', 'otro' => 'otros'];
        $a['datos'][] = ['Chats entendidos', implode(' · ', array_map(static fn($k) => $clases[$k] . ' ' . ($nom[$k] ?? $k), array_keys($clases)))];
    }
    $a['entregas'] = [];
    foreach ($db->query("SELECT tel, nombre, clase, resumen, borrador, te_toca, interes, analizado FROM contactos
                         WHERE clase IN ('cliente','negocio','prospecto','otro') AND (borrador <> '' OR te_toca = 1 OR interes = 1) ORDER BY analizado DESC LIMIT 30") as $r) {
        $quien = pebai_cerebro_prospecto($r['tel']) ?? ((string)$r['nombre'] ?: '+' . $r['tel']);
        $a['entregas'][] = ['ts' => $r['analizado'], 'clase' => $r['borrador'] !== '' ? 'propuesta' : ($r['te_toca'] ? 'tetoca' : 'interes'),
                            'titulo' => $quien . ' · ' . $r['clase'], 'texto' => $r['borrador'] !== '' ? $r['borrador'] : $r['resumen'],
                            'url' => 'https://wa.me/' . $r['tel'], 'img' => '', 'foto' => '', 'burbuja' => $r['borrador'] !== ''];
    }
    return $a;
}

/** Redactor: rutina de Claude en la nube que lee la web de cada empresa y escribe su primer WhatsApp o email (api/redactor.php). */
function of_redactor(): array
{
    $a = of_agente(['id' => 'redactor', 'dept' => 'captacion', 'nombre' => 'Redactor', 'glifo' => 'flow', 'rol' => 'Lee la web de cada empresa, saca las que no encajan y escribe su primer mensaje', 'unidad' => 'mensajes escritos']);
    $a['actividad'] = of_actividad('redactor', 30);
    $a['errores'] = of_errores($a['actividad']);
    $hoy = date('Y-m-d');
    $escritos = $fuera = 0;
    foreach ($a['actividad'] as $e) {
        if (substr($e['ts'], 0, 10) === $hoy) {
            $escritos += (int)preg_match('/^(WhatsApp|Email) escrito/u', $e['txt']);
            $fuera += (int)preg_match('/^Fuera /u', $e['txt']);
        }
    }
    $a['hoy'] = $escritos;
    $wa = (int)pebai_agentes_db()->query("SELECT COUNT(*) FROM prospectos WHERE estado = 'pendiente' AND nicho = 'solar' AND mensaje = ''")->fetchColumn();
    $em = (int)pebai_db()->query("SELECT COUNT(*) FROM email_prospectos WHERE estado = 'pendiente' AND nicho = 'energia' AND cuerpo_personal = ''")->fetchColumn();
    $ult = $a['actividad'][0] ?? null;
    $reciente = $ult && strtotime($ult['ts']) > time() - 1200 && !preg_match('/^Termina/u', $ult['txt']);
    $callado = $ult && strtotime($ult['ts']) < time() - 74 * 3600;
    $a['st'] = $a['errores'] || $callado ? 'error' : ($reciente ? 'trabajando' : 'dormido');
    $a['motivo'] = $a['errores'] ? $a['errores'][0]['txt']
        : ($callado ? 'No hace su turno desde ' . of_hace($ult['ts']) . '. Su rutina en la nube puede haberse parado.'
        : ($reciente ? $ult['txt'] : 'Descansando hasta su turno (L-V cada 2 h de 8:00 a 20:00). Quedan ' . $wa . ' empresas sin WhatsApp y ' . $em . ' sin email.'));
    if ($callado) {
        $a['necesita'][] = 'Revisar su rutina en Claude (nube): no ha hecho su turno';
    }
    $a['proxima'] = 'L-V cada 2 h de 8:00 a 20:00';
    $a['ultima'] = of_ultima($a['actividad'], ['hito']);
    $a['datos'] = [['Sin WhatsApp escrito', (string)$wa], ['Sin email escrito', (string)$em], ['Escritos hoy', (string)$escritos], ['Fuera hoy', (string)$fuera]];
    $a['acciones'] = ['ir' => 'prospectos'];
    $a['entregas'] = of_trabajo_captacion('redactor');
    return $a;
}

/* ------------------------------------------------------------------ GEO --- */
/** Agentes GEO: rutinas en la nube de Claude que apuntan cada paso en api/actividad.php (un id por agente). */
const OF_GEO_AGENTES = [  // horas de España (en verano, una hora más)
    ['geo_jefe', 'Jefe GEO', 'Reparte el trabajo, revisa la calidad y te avisa de lo que necesita de ti', 'L-V 9:00 y 16:00 (45 min)'],
    ['geo_vigia', 'Vigía', 'Trae novedades de GEO, IAs, redes y competencia y se las pasa al Jefe', 'Cada día 8:00, 13:00, 18:00 y 20:00 (45 min)'],
    ['geo_contenido', 'Contenido', 'Escribe y publica páginas que las IAs puedan citar', 'L-V 10:00 y 15:00 (45 min)'],
    ['geo_refresco', 'Refresco', 'Mejora y actualiza las páginas publicadas', 'L-V 9:30 y 14:30 (45 min)'],
    ['geo_local', 'Local', 'Lleva la ficha de Google: tareas de Localo, posts y fotos', 'L-V 8:00, 11:00, 14:00 y 17:00; S-D 10:00 y 16:00 (45 min)'],
    ['geo_redes', 'Redes', 'Escribe y publica en la página de LinkedIn', 'L-V 10:00 y 15:00 (45 min)'],
    ['geo_medicion', 'Medición', 'Mide la visibilidad en IA (informe completo los lunes)', 'L-V 8:30 y 15:30 (45 min)'],
    ['geo_tecnico', 'Técnico SEO', 'Revisa y arregla la web por dentro: velocidad, enlaces, datos e indexación', 'L-V 12:00 y 19:00; sábado 11:00 (45 min)'],
    ['geo_preguntas', 'Preguntas', 'Saca las preguntas reales de la gente y se las pasa a Contenido', 'L-V 11:30 y 18:30 (45 min)'],
];

/** Foto real de una página pública: captura de pantalla de WordPress mShots (gratis, sin clave; solo recibe la URL). */
function of_foto(string $url): string
{
    return preg_match('~^https?://[^\s]+$~', $url) ? 'https://s.wordpress.com/mshots/v1/' . rawurlencode($url) . '?w=640&h=400' : '';
}

/** «Su trabajo» de Captación: lo que el Redactor ha leído y escrito, y lo que WhatsApp ha enviado, con la web de cada empresa. */
function of_trabajo_captacion(string $agente, int $n = 30): array
{
    $reglas = $agente === 'redactor'
        ? [['/^(WhatsApp|Email) escrito/u', 'escrito'], ['/^Revisada y encaja/u', 'encaja'], ['/^Fuera /u', 'fuera']]
        : [['/^Enviado a /u', 'enviado']];
    $q = pebai_actividad_db()->prepare("SELECT ts, resumen, ref FROM agente_actividad WHERE agente = ? AND (ref LIKE 'wa:%' OR ref LIKE 'em:%') ORDER BY id DESC LIMIT 200");
    $q->execute([$agente]);
    $wa = pebai_agentes_db()->prepare('SELECT empresa, web, mensaje FROM prospectos WHERE id = ?');
    $em = pebai_db()->prepare('SELECT empresa, web, cuerpo_personal mensaje FROM email_prospectos WHERE id = ?');
    $out = [];
    foreach ($q as $r) {
        $clase = '';
        foreach ($reglas as [$re, $c]) {
            if (preg_match($re, $r['resumen'])) { $clase = $c; break; }
        }
        if (!$clase) {
            continue;
        }
        [$tipo, $id] = explode(':', $r['ref'], 2) + ['', ''];
        $st = $tipo === 'em' ? $em : $wa;
        $st->execute([(int)$id]);
        $p = $st->fetch(PDO::FETCH_ASSOC) ?: ['empresa' => '', 'web' => '', 'mensaje' => ''];
        $web = (string)$p['web'];
        if ($web !== '' && !preg_match('~^https?://~', $web)) {
            $web = 'https://' . ltrim($web, '/');
        }
        $out[] = ['ts' => $r['ts'], 'clase' => $clase, 'titulo' => $r['resumen'], 'texto' => $clase === 'fuera' ? '' : mb_substr((string)$p['mensaje'], 0, 700),
                  'url' => str_starts_with($web, 'https://') ? $web : '', 'img' => '', 'foto' => $agente === 'redactor' ? of_foto($web) : '', 'burbuja' => $clase === 'enviado' || $clase === 'escrito'];
        if (count($out) >= $n) {
            break;
        }
    }
    return $out;
}

/** Trabajo entregado por un agente GEO (pestaña «Su trabajo»): lo último primero; solo enlaces https. */
function of_entregas(string $agente, int $n = 40): array
{
    $q = pebai_actividad_db()->prepare("SELECT ts, resumen, detalle, ref FROM agente_actividad WHERE agente = ? AND tipo = 'entrega' ORDER BY id DESC LIMIT " . $n);
    $q->execute([$agente]);
    $https = static fn($u) => is_string($u) && str_starts_with($u, 'https://') ? $u : '';
    $out = [];
    foreach ($q as $r) {
        $d = json_decode((string)$r['detalle'], true) ?: ['texto' => (string)$r['detalle']];
        $out[] = ['ts' => $r['ts'], 'clase' => (string)$r['ref'], 'titulo' => $r['resumen'],
                  'texto' => (string)($d['texto'] ?? ''), 'url' => $https($d['url'] ?? ''), 'img' => $https($d['img'] ?? ''),
                  // foto real de lo entregado: la imagen que subió el agente o, si no, una captura de la página
                  'foto' => $https($d['img'] ?? '') ?: of_foto($https($d['url'] ?? ''))];
    }
    return $out;
}

function of_geo_agente(string $id, string $nombre, string $rol, string $cuando): array
{
    $a = of_agente(['id' => $id, 'dept' => 'geo', 'nombre' => $nombre, 'glifo' => 'lupa', 'rol' => $rol, 'unidad' => 'tareas hechas']);
    $a['actividad'] = of_actividad($id, 30);
    if ($id === 'geo_jefe') {  // el primer agente GEO apuntaba como 'geo'
        $a['actividad'] = array_slice(array_merge($a['actividad'], of_actividad('geo', 30)), 0, 30);
        usort($a['actividad'], static fn($x, $y) => strcmp($y['ts'], $x['ts']));
    }
    $a['errores'] = of_errores($a['actividad']);
    // Un "Resuelto: …" apuntado después de un error lo quita del cartel rojo
    foreach ($a['actividad'] as $e) {
        if ($e['tipo'] === 'hito' && preg_match('/^Resuelto/u', $e['txt'])) {
            $a['errores'] = array_values(array_filter($a['errores'], static fn($ev) => $ev['ts'] > $e['ts']));
            break;
        }
    }
    // Si después del fallo terminó bien su turno, la mesa no sigue en rojo (el fallo se sigue viendo en «¿Ha fallado algo?»)
    $fin = '';
    foreach ($a['actividad'] as $e) {
        if ($e['tipo'] === 'hito' && preg_match('/^Termina/u', $e['txt'])) {
            $fin = $e['ts'];
            break;
        }
    }
    $vigentes = array_values(array_filter($a['errores'], static fn($ev) => $ev['ts'] > $fin));
    $hoy = date('Y-m-d');
    $a['hoy'] = count(array_filter($a['actividad'], static fn($e) => substr($e['ts'], 0, 10) === $hoy && $e['tipo'] === 'hito'));
    $ult = $a['actividad'][0] ?? null;
    // Lo que apunta el Jefe en su mesa («Encargo del Jefe: …») es trabajo para su próximo turno: no cuenta como que esté trabajando ya
    $propia = null;
    foreach ($a['actividad'] as $e) { if (!preg_match('/^Encargo del Jefe/u', $e['txt'])) { $propia = $e; break; } }
    $reciente = $propia && strtotime($propia['ts']) > time() - 1200 && $propia['tipo'] !== 'espera' && !preg_match('/^Termina/u', $propia['txt']);
    // Los de cada día tienen turno a diario; los de L-V pueden pasar el fin de semana sin nada (de viernes tarde a lunes)
    $hueco = str_starts_with($cuando, 'Cada día') ? 26 * 3600 : 74 * 3600;
    $callado = $ult && strtotime($ult['ts']) < time() - $hueco;
    // Entre turno y turno descansa: duerme en la oficina, igual que los de Captación fuera de horario
    $a['st'] = $vigentes || $callado ? 'error' : ($reciente ? 'trabajando' : 'dormido');
    $a['motivo'] = $vigentes ? $vigentes[0]['txt']
        : ($callado ? 'Se ha saltado su turno: no hace nada desde ' . of_hace($ult['ts']) . '. Su rutina en la nube puede haberse parado.'
        : ($reciente ? $ult['txt'] : ($ult ? 'Descansando hasta su turno (' . $cuando . ').'
            . (preg_match('/^Encargo del Jefe:\s*/u', $ult['txt']) ? ' Le toca: ' . preg_replace('/^Encargo del Jefe:\s*/u', '', $ult['txt']) : ' Lo último: ' . $ult['txt'])
            : 'Empieza en su próximo turno: ' . $cuando . '.')));
    if ($callado) {
        $a['necesita'][] = 'Revisar su rutina en Claude (nube): no ha hecho su turno';
    }
    $a['proxima'] = $cuando;
    $a['ultima'] = of_ultima($a['actividad'], ['hito']);
    $a['datos'] = [['Turno', $cuando], ['Tareas hoy', (string)$a['hoy']]];
    $a['entregas'] = of_entregas($id);
    return $a;
}

/**
 * Seguimiento del scraper para el panel (Control de envíos): por día, cuántas empresas encuentra en Google Maps, cuántas
 * pasan los filtros y cuántas entran de verdad en la cola; los motivos de descarte de hoy; y por dónde va el barrido.
 */
function of_scraper_seguimiento(): array
{
    $db = pebai_agentes_db();
    $desde = date('Y-m-d', strtotime('-13 days'));
    $dias = [];
    for ($i = 13; $i >= 0; $i--) {
        $dias[date('Y-m-d', strtotime("-$i days"))] = ['enc' => 0, 'ent' => 0, 'cola' => 0];
    }
    $motivos = [];
    $q = $db->prepare("SELECT ts, resumen, detalle FROM agente_actividad WHERE agente = 'prospeccion' AND resumen LIKE '%empresas encontradas%' AND ts >= ?");
    $q->execute([$desde]);
    foreach ($q as $r) {
        $d = substr($r['ts'], 0, 10);
        if (!isset($dias[$d]) || !preg_match('/(\d+) empresas encontradas, (\d+) entregadas/u', $r['resumen'], $m)) {
            continue;
        }
        $dias[$d]['enc'] += (int)$m[1];
        $dias[$d]['ent'] += (int)$m[2];
        if ($d === date('Y-m-d') && preg_match('/Descartadas y por qué: ([^.]+)\./u', (string)$r['detalle'], $mm)) {
            foreach (explode(',', $mm[1]) as $par) {
                if (preg_match('/^\s*(.+?)\s+(\d+)\s*$/u', $par, $x)) {
                    $motivos[$x[1]] = ($motivos[$x[1]] ?? 0) + (int)$x[2];
                }
            }
        }
    }
    foreach (['prospectos', 'email_prospectos'] as $t) {
        $q = $db->prepare("SELECT substr(created_at, 1, 10) d, COUNT(*) n FROM $t WHERE created_at >= ? GROUP BY d");
        $q->execute([$desde]);
        foreach ($q as $r) {
            if (isset($dias[$r['d']])) {
                $dias[$r['d']]['cola'] += (int)$r['n'];
            }
        }
    }
    arsort($motivos);
    // Por dónde va: la vuelta más reciente del barrido y cuántas provincias lleva
    $carpeta = dirname(pebai_private_dir(), 3) . '/scratch/prospeccion/tandas';
    $vueltas = glob($carpeta . '/solar_v*', GLOB_ONLYDIR) ?: [];
    usort($vueltas, static fn($a, $b) => (int)substr(strrchr($b, 'v'), 1) <=> (int)substr(strrchr($a, 'v'), 1));
    $vuelta = $vueltas ? basename($vueltas[0]) : '';
    $hechas = $vuelta ? count(array_filter(glob($vueltas[0] . '/' . $vuelta . '_*.csv') ?: [], static fn($f) => !preg_match('/_(whatsapp|email|llamadas|solo_email)(_ia)?\.csv$/', $f))) : 0;
    $ahora = '';
    $logs = glob(dirname(pebai_private_dir(), 3) . '/scratch/prospeccion/tanda_*.log') ?: [];
    usort($logs, static fn($x, $y) => filemtime($y) <=> filemtime($x));
    if ($logs && filemtime($logs[0]) > time() - 600) {
        $cola = (string)@file_get_contents($logs[0], false, null, max(0, filesize($logs[0]) - 65536));
        if (preg_match_all('/^=== (.+) ===$/mu', $cola, $pv)) {
            $ahora = end($pv[1]);
        }
    }
    // Cuánto de España se ha recorrido ya en pueblos y territorio (lo escribe prospeccion/tanda.py)
    $cob = json_decode((string)@file_get_contents($carpeta . '/cobertura.json'), true) ?: [];
    $cobHecho = array_sum(array_map(static fn($c) => (int)($c['hecho'] ?? 0), $cob));
    $cobTotal = array_sum(array_map(static fn($c) => (int)($c['total'] ?? 0), $cob));
    $completas = count(array_filter($cob, static fn($c) => (int)($c['hecho'] ?? 0) >= (int)($c['total'] ?? 1)));
    return ['dias' => array_map(static fn($d, $v) => ['d' => $d] + $v, array_keys($dias), $dias), 'motivos' => array_slice($motivos, 0, 6, true),
            'cobertura' => $cobTotal ? round($cobHecho / $cobTotal * 100) : 0, 'prov_completas' => $completas,
            'vuelta' => (int)substr($vuelta, 7), 'hechas' => $hechas, 'total' => 52, 'ahora' => $ahora, 'pueblos' => (int)substr($vuelta, 7) >= 2];
}

/* --------------------------------------------------------------- Embudo --- */
function of_embudo(PDO $db): array
{
    $hoy = date('Y-m-d 00:00:00');
    $q = $db->prepare("SELECT COUNT(*) FROM eventos WHERE ts >= ? AND auto = 1 AND tipo IN ('contactado','cita','sesion')");
    $q->execute([$hoy]);
    $fasesHoy = (int)$q->fetchColumn();
    $ultFase = $db->query("SELECT e.ts, e.tipo, l.empresa FROM eventos e LEFT JOIN leads l ON l.id = e.lead_id WHERE e.auto = 1 ORDER BY e.id DESC LIMIT 1")->fetch();
    $sinRevisar = (int)$db->query("SELECT COUNT(*) FROM leads WHERE estado = 'nuevo' AND tipo <> 'cliente'")->fetchColumn();
    $q = $db->prepare("SELECT COUNT(*) FROM leads WHERE estado = 'nuevo' AND tipo <> 'cliente' AND created_at < ?");
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
    // Recordatorios: el cron (o las visitas, de respaldo) deja la hora de su última pasada
    $lastTs = 0;
    foreach (['cron', 'visitas', 'url'] as $via) {
        $f = pebai_private_dir() . '/recordatorios-' . $via . '.last';
        $lastTs = max($lastTs, is_file($f) ? (int)filemtime($f) : 0);
    }
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
    foreach (['of_scraper', 'of_redactor', 'of_whatsapp', 'of_email', 'of_cerebro'] as $fn) {
        try {
            $ags[] = $fn();
        } catch (Throwable $e) {
            pebai_log('OFICINA ' . $fn . ': ' . $e->getMessage());
            $ags[] = of_agente(['id' => substr($fn, 3), 'dept' => 'captacion', 'nombre' => ucfirst(substr($fn, 3)), 'st' => 'error', 'motivo' => 'No se ha podido leer su estado.']);
        }
    }
    foreach (OF_GEO_AGENTES as [$id, $nombre, $rol, $cuando]) {
        try {
            $ags[] = of_geo_agente($id, $nombre, $rol, $cuando);
        } catch (Throwable $e) {
            pebai_log('OFICINA ' . $id . ': ' . $e->getMessage());
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

/* --------------------------------------------- servidor de cada sala --- */
/** Agentes (id del registro común => nombre) de cada departamento, para el resumen del servidor de su sala. */
function of_resumen_agentes(string $dept): array
{
    if ($dept === 'geo') {
        return array_column(OF_GEO_AGENTES, 1, 0) + ['geo' => 'Jefe GEO'];  // 'geo': el primer agente GEO
    }
    return $dept === 'captacion' ? ['prospeccion' => 'Scraper', 'redactor' => 'Redactor', 'whatsapp' => 'WhatsApp', 'email' => 'Email', 'cerebro' => 'Cerebro'] : [];
}

/** Quita teléfonos y emails antes de mandar nada a la IA (datos mínimos). */
function of_sin_datos(string $t): string
{
    $t = preg_replace('/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/u', '[email]', $t);
    return preg_replace_callback('/(?<![\w-])\+?\d[\d \-.]{7,}\d(?![\w-])/u', static fn($m) => preg_match_all('/\d/', $m[0]) >= 9 ? '[teléfono]' : $m[0], $t);
}

/** Resumen sin IA (si Gemini falla o no hay nada que contar): apuntes por agente y las 5 últimas acciones. */
function of_resumen_fijo(string $nombre, array $ents, array $ags): array
{
    if (!$ents) {
        return ['titular' => 'Hoy todavía no hay apuntes', 'resumen' => 'Desde las 00:00 ningún agente de ' . $nombre . ' ha apuntado nada. Cuando empiecen su turno, lo verás aquí.',
                'logros' => [], 'problemas' => [], 'siguiente' => ''];
    }
    $por = [];
    foreach ($ents as $e) {
        $por[$ags[$e['agente']]] = ($por[$ags[$e['agente']]] ?? 0) + 1;
    }
    $fmt = static fn($e) => substr($e['ts'], 11, 5) . ' · ' . $ags[$e['agente']] . ': ' . $e['txt'];
    return ['titular' => count($ents) . (count($ents) === 1 ? ' apunte hoy en ' : ' apuntes hoy en ') . $nombre,
            'resumen' => 'Apuntes de hoy por agente: ' . implode(', ', array_map(static fn($k, $n) => $k . ' ' . $n, array_keys($por), $por)) . '. Abajo, lo último que han hecho.',
            'logros' => array_map($fmt, array_slice($ents, 0, 5)),
            'problemas' => array_map($fmt, array_slice(array_values(array_filter($ents, static fn($e) => in_array($e['tipo'], ['error', 'freno'], true))), 0, 5)),
            'siguiente' => ''];
}

/** Resumen de lo que han hecho hoy los agentes de un departamento. Caché de 10 min por departamento y nº de apuntes. */
function of_resumen(string $dept, bool $fresco): array
{
    $nombres = ['captacion' => 'Captación', 'geo' => 'Visibilidad en IA', 'embudo' => 'Embudo'];
    $ags = of_resumen_agentes($dept);
    if (!$ags) {
        return ['ok' => true, 'dept' => $dept, 'sin_ia' => true, 'titular' => isset($nombres[$dept]) ? 'Aún no hay resumen con IA para este departamento' : 'Sin agentes todavía',
                'resumen' => 'Este departamento no tiene agentes que apunten su actividad en el registro común.', 'logros' => [], 'problemas' => [], 'siguiente' => '',
                'generado' => date('Y-m-d H:i:s'), 'entradas' => 0];
    }
    $nombre = $nombres[$dept] ?? $dept;
    $q = pebai_actividad_db()->prepare('SELECT ts, agente, tipo, resumen FROM agente_actividad WHERE agente IN (' . implode(',', array_fill(0, count($ags), '?')) . ') AND ts >= ? ORDER BY id DESC LIMIT 300');
    $q->execute([...array_keys($ags), date('Y-m-d 00:00:00')]);
    $ents = array_map(static fn($r) => ['ts' => $r['ts'], 'agente' => $r['agente'], 'tipo' => $r['tipo'], 'txt' => mb_substr(of_sin_datos((string)$r['resumen']), 0, 220)], $q->fetchAll());
    $f = pebai_private_dir() . '/oficina-resumen-' . $dept . '.json';
    $c = is_file($f) ? json_decode((string)file_get_contents($f), true) : null;
    $edad = $c ? time() - (int)($c['t'] ?? 0) : PHP_INT_MAX;
    // Se reutiliza si tiene menos de 1 min (también con «Actualizar») o menos de 10 min con los mismos apuntes
    if ($c && isset($c['r']) && ($edad < 60 || (!$fresco && $edad < 600 && (int)($c['n'] ?? -1) === count($ents)))) {
        return $c['r'] + ['cache' => true];
    }
    $r = null;
    if ($ents && function_exists('pebai_ia_json_agente')) {
        $lineas = implode("\n", array_map(static fn($e) => substr($e['ts'], 11, 5) . ' · ' . $ags[$e['agente']] . ' · ' . $e['tipo'] . ' · ' . $e['txt'], array_reverse(array_slice($ents, 0, 150))));
        $prompt = "Eres el servidor de la sala «{$nombre}» en la oficina de agentes automáticos de PEBAI Systems. Escribes para Daniel, uno de los dueños, "
            . "un resumen de lo que han hecho HOY (desde las 00:00, hora de España; ahora son las " . date('H:i') . ") los agentes de esta sala.\n"
            . "Agentes de la sala: " . implode(', ', array_unique($ags)) . ".\n"
            . "Tipos de apunte: envio (mandó un mensaje), bloqueo (decidió no mandar y por qué), respuesta (contestó alguien), espera (por qué no trabaja ahora), "
            . "freno (se paró por seguridad), error (algo falló), cambio (algo preparado o cambiado), hito (tarea hecha o paso importante).\n"
            . "Responde SOLO con JSON: {\"titular\": \"una frase corta con lo más importante del día\", \"resumen\": \"de 3 a 6 frases claras para Daniel\", "
            . "\"logros\": [\"lo conseguido, una frase cada uno, máximo 6\"], \"problemas\": [\"errores, frenos o bloqueos que importen, máximo 5; vacío si no hay\"], "
            . "\"siguiente\": \"una frase con lo próximo que toca o lo que Daniel debería mirar\"}.\n"
            . "Reglas: usa SOLO los apuntes de abajo; no inventes cifras ni hechos; cuenta solo lo que esté apuntado. Di qué agente hizo qué y a qué hora. "
            . "Si hay pocos apuntes, dilo con honestidad. Español de España, tuteo, tono sobrio y claro. Sin emojis, sin exclamaciones, sin raya larga. "
            . "No uses palabras como potenciar, impulsar, sinergia ni revolucionar.\n\n"
            . "APUNTES DE HOY (" . count($ents) . ($ents && count($ents) > 150 ? ', se muestran los 150 últimos' : '') . "):\n" . $lineas;
        $j = pebai_ia_json_agente('servidor', 'claude-haiku-5-5', $prompt);
        if (is_array($j) && trim((string)($j['resumen'] ?? '')) !== '') {
            $limpia = static fn($s, $n) => mb_substr(trim(str_replace([' — ', '—', '¡', '!'], [', ', ', ', '', '.'], (string)$s)), 0, $n);
            $lista = static fn($v, $n) => array_values(array_filter(array_map(static fn($s) => $limpia(is_scalar($s) ? $s : '', 300), array_slice(is_array($v) ? $v : [], 0, $n)), 'strlen'));
            $r = ['titular' => $limpia($j['titular'] ?? '', 160), 'resumen' => $limpia($j['resumen'], 1200), 'logros' => $lista($j['logros'] ?? [], 6),
                  'problemas' => $lista($j['problemas'] ?? [], 5), 'siguiente' => $limpia($j['siguiente'] ?? '', 300), 'ia' => true];
        }
    }
    $r = ['ok' => true, 'dept' => $dept] + ($r ?? of_resumen_fijo($nombre, $ents, $ags) + ['ia' => false]) + ['generado' => date('Y-m-d H:i:s'), 'entradas' => count($ents)];
    if ($r['ia'] || !$ents) {  // el resumen sin IA por fallo no se guarda: el siguiente clic vuelve a probar
        @file_put_contents($f, json_encode(['t' => time(), 'n' => count($ents), 'r' => $r], JSON_UNESCAPED_UNICODE), LOCK_EX);
    }
    return $r;
}

/* ------------------------------------------------------------------ rutas --- */
if ($auth && isset($_GET['oficina_resumen'])) {
    $dept = preg_replace('/[^a-z]/', '', (string)$_GET['oficina_resumen']);
    try {
        json_out(of_resumen($dept, !empty($_GET['fresco'])));
    } catch (Throwable $e) {
        pebai_log('OFICINA resumen ' . $dept . ': ' . $e->getMessage());
        json_out(['ok' => false, 'error' => 'No se ha podido leer la actividad de hoy.'], 500);
    }
}

/* ------------------------------------------------------- «Parar todo» --- */
/** Agentes que escriben a otras empresas: el interruptor general los pausa a la vez. */
const OF_PARAR = ['whatsapp', 'email'];

function of_parada_file(): string
{
    return pebai_private_dir() . '/parada_general.json';
}

/** Si está en marcha la parada general: cuándo y qué agentes estaban funcionando (solo esos se reanudan después). */
function of_parada(): ?array
{
    $j = is_file(of_parada_file()) ? json_decode((string)file_get_contents(of_parada_file()), true) : null;
    return is_array($j) ? $j : null;
}

function of_pausar(string $id, bool $pausar): void
{
    if ($id === 'email') {
        if (!function_exists('pebai_email_db')) {
            return;
        }
        pebai_email_db()->prepare("UPDATE agente_estado SET pausado = ?, estado = CASE WHEN estado = 'sin_configurar' THEN estado ELSE ? END, detalle = ? WHERE agente = 'email'")
            ->execute([$pausar ? 1 : 0, $pausar ? 'pausado' : 'activo', $pausar ? 'En pausa: «Parar todo» desde el panel' : 'Reanudado desde el panel']);
    } else {
        pebai_agentes_db()->prepare('UPDATE agente_estado SET pausado = ? WHERE agente = ?')->execute([$pausar ? 1 : 0, $id]);
    }
    pebai_actividad($id, 'cambio', $pausar ? 'Parado con «Parar todo» desde el panel' : 'Reanudado con «Reanudar todo» desde el panel');
}

if ($auth && ($_POST['action'] ?? '') === 'agentes_parar') {
    if (!hash_equals($_SESSION['csrf'] ?? '', $_POST['csrf'] ?? '')) {
        json_out(['ok' => false, 'error' => 'Sesión caducada. Recarga la página.'], 400);
    }
    $p = of_parada();
    if (($_POST['modo'] ?? '') === 'parar') {
        $parados = $p['agentes'] ?? [];
        foreach (OF_PARAR as $id) {
            if (!function_exists('pebai_agente') || ($id === 'email' && !function_exists('pebai_email_db'))) {
                continue;
            }
            if (!(int)pebai_agente($id)['pausado']) {
                of_pausar($id, true);
                $parados[] = $id;
            }
        }
        file_put_contents(of_parada_file(), json_encode(['ts' => $p['ts'] ?? date('Y-m-d H:i:s'), 'agentes' => array_values(array_unique($parados))]), LOCK_EX);
        json_out(['ok' => true]);
    }
    foreach ($p['agentes'] ?? [] as $id) {
        if (in_array($id, OF_PARAR, true)) {
            of_pausar($id, false);
        }
    }
    @unlink(of_parada_file());
    json_out(['ok' => true]);
}

if ($auth && isset($_GET['oficina'])) {
    json_out(['ok' => true, 'ahora' => date('Y-m-d H:i:s'), 'csrf' => csrf(), 'agentes' => of_estado(pebai_db()),
              'ia' => is_file(pebai_private_dir() . '/ia.php'), 'parada' => of_parada()]);
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
    require_once dirname(__DIR__) . '/api/_claude_lib.php';
    if ($key === '' && pebai_claude_cfg()['key'] === '') {
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
    $embudo = $db->query("SELECT estado, COUNT(*) n FROM leads WHERE tipo <> 'cliente' GROUP BY estado")->fetchAll(PDO::FETCH_KEY_PAIR);
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
    // Claude (Sonnet) primero: razona mejor sobre toda la oficina. Si no responde, Gemini, como antes.
    $hilo = array_map(static fn($c) => ['role' => $c['role'] === 'model' ? 'assistant' : 'user', 'content' => $c['parts'][0]['text']], $contents);
    $resp = pebai_claude('pebai', 'claude-sonnet-5-5', $sys, $hilo, ['effort' => 'medium', 'max_tokens' => 3000]);
    if ($resp !== null) {
        json_out(['ok' => true, 'respuesta' => $resp, 'modelo' => 'claude']);
    }
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
            pebai_ia_apunta('pebai', 'gemini', $modelo);
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
