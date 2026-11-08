<?php
/*
 * PEBAI · Cerebro (pedido por Daniel el 27/10/2026).
 * Lee todos los chats de WhatsApp de Daniel (lo que le escriben y lo que escribe él, también el historial antiguo),
 * avisa a la oficina de lo que pasa con los prospectos y guarda todo para aprender de cómo responde Daniel.
 * Nunca envía nada. Las conversaciones viven solo en private/cerebro.sqlite (fuera de public_html y del repo).
 */
require_once __DIR__ . '/_agentes_lib.php';

function pebai_cerebro_db(): PDO
{
    static $db = null;
    if ($db) {
        return $db;
    }
    $db = new PDO('sqlite:' . pebai_private_dir() . '/cerebro.sqlite');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $db->exec('PRAGMA journal_mode = WAL');
    $db->exec('CREATE TABLE IF NOT EXISTS mensajes (
        tel TEXT NOT NULL,
        id TEXT NOT NULL,
        de_mi INTEGER NOT NULL DEFAULT 0,
        agente INTEGER NOT NULL DEFAULT 0,
        texto TEXT NOT NULL DEFAULT "",
        ts INTEGER NOT NULL,
        vivo INTEGER NOT NULL DEFAULT 0,
        creado TEXT NOT NULL,
        PRIMARY KEY (tel, id)
    )');
    $db->exec('CREATE INDEX IF NOT EXISTS mensajes_ts ON mensajes (ts)');
    $db->exec('CREATE TABLE IF NOT EXISTS contactos (
        tel TEXT PRIMARY KEY,
        nombre TEXT NOT NULL DEFAULT "",
        clase TEXT NOT NULL DEFAULT "",
        actualizado TEXT NOT NULL
    )');
    // Lo que Cerebro sabe de cada chat (27/10, con Claude): de qué va, si te toca contestar y un borrador con tu estilo
    $cols = array_column($db->query('PRAGMA table_info(contactos)')->fetchAll(), 'name');
    foreach (['resumen' => 'TEXT NOT NULL DEFAULT ""', 'interes' => 'INTEGER NOT NULL DEFAULT 0', 'te_toca' => 'INTEGER NOT NULL DEFAULT 0',
              'borrador' => 'TEXT NOT NULL DEFAULT ""', 'pendiente' => 'INTEGER NOT NULL DEFAULT 0', 'analizado' => 'TEXT NOT NULL DEFAULT ""'] as $c => $def) {
        if (!in_array($c, $cols, true)) {
            $db->exec("ALTER TABLE contactos ADD COLUMN $c $def");
        }
    }
    return $db;
}

/** Nombre de la empresa si el número es un prospecto al que ya se escribió (null si no lo es). */
function pebai_cerebro_prospecto(string $tel): ?string
{
    $q = pebai_agentes_db()->prepare("SELECT empresa FROM prospectos WHERE telefono = ? AND enviado_at <> '' LIMIT 1");
    $q->execute([$tel]);
    $e = $q->fetchColumn();
    return $e === false ? null : ((string)$e ?: $tel);
}

/**
 * Guarda un lote de mensajes [{tel, id, de_mi, texto, ts, nombre?}]. $vivo = llegan en directo (no del historial).
 * Devuelve cuántos son nuevos. En directo avisa a la oficina de lo que pasa con los prospectos.
 */
function pebai_cerebro_guardar(array $lote, bool $vivo): array
{
    $db = pebai_cerebro_db();
    $ins = $db->prepare('INSERT OR IGNORE INTO mensajes (tel, id, de_mi, agente, texto, ts, vivo, creado) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    $nombre = $db->prepare('INSERT INTO contactos (tel, nombre, actualizado) VALUES (?, ?, ?)
        ON CONFLICT(tel) DO UPDATE SET nombre = CASE WHEN excluded.nombre <> "" THEN excluded.nombre ELSE contactos.nombre END, actualizado = excluded.actualizado');
    $now = date('Y-m-d H:i:s');
    $nuevos = [];
    $db->beginTransaction();
    foreach ($lote as $m) {
        $tel = pebai_phone_digits((string)($m['tel'] ?? ''));
        $id = mb_substr((string)($m['id'] ?? ''), 0, 80);
        $ts = (int)($m['ts'] ?? 0);
        if ($tel === '' || $id === '' || $ts < 1000000000 || $ts > time() + 300) {
            continue;
        }
        $texto = mb_substr(trim((string)($m['texto'] ?? '')), 0, 4000);
        $ins->execute([$tel, $id, !empty($m['de_mi']) ? 1 : 0, !empty($m['agente']) ? 1 : 0, $texto, $ts, $vivo ? 1 : 0, $now]);
        if ($ins->rowCount()) {
            $nuevos[] = ['tel' => $tel, 'de_mi' => !empty($m['de_mi']), 'agente' => !empty($m['agente']), 'texto' => $texto];
        }
        if (!empty($m['nombre'])) {
            $nombre->execute([$tel, mb_substr(trim((string)$m['nombre']), 0, 120), $now]);
        }
    }
    $db->commit();

    if ($vivo) {
        // Chats con algo nuevo (de la otra persona o tuyo, que puede cerrar el tema): Cerebro los vuelve a mirar
        $pend = $db->prepare('INSERT INTO contactos (tel, actualizado, pendiente) VALUES (?, ?, 1) ON CONFLICT(tel) DO UPDATE SET pendiente = 1, actualizado = excluded.actualizado');
        foreach (array_unique(array_column(array_filter($nuevos, static fn($n) => !$n['agente']), 'tel')) as $t) {
            $pend->execute([$t, $now]);
        }
        // Avisos a la oficina: solo de prospectos (lo personal no sale de Cerebro). Uno por chat y lote.
        $vistos = [];
        foreach ($nuevos as $n) {
            $clave = $n['tel'] . ($n['de_mi'] ? 'd' : 'e');
            if ($n['agente'] || isset($vistos[$clave]) || ($empresa = pebai_cerebro_prospecto($n['tel'])) === null) {
                continue;
            }
            $vistos[$clave] = true;
            pebai_actividad('cerebro', 'hito', $n['de_mi']
                ? 'Aviso a WhatsApp: Daniel ya ha contestado a ' . $empresa
                : 'Aviso a WhatsApp: ' . $empresa . ' ha escrito');
        }
    } elseif (count($nuevos) >= 20) {
        $chats = count(array_unique(array_column($nuevos, 'tel')));
        pebai_actividad('cerebro', 'hito', 'Historial leído: ' . count($nuevos) . ' mensajes de ' . $chats . ' ' . ($chats === 1 ? 'chat' : 'chats'));
    }
    return ['nuevos' => count($nuevos)];
}

/** Nombres de la agenda / del perfil: [{tel, nombre}]. */
function pebai_cerebro_contactos(array $lista): int
{
    $db = pebai_cerebro_db();
    $q = $db->prepare('INSERT INTO contactos (tel, nombre, actualizado) VALUES (?, ?, ?)
        ON CONFLICT(tel) DO UPDATE SET nombre = excluded.nombre, actualizado = excluded.actualizado');
    $now = date('Y-m-d H:i:s');
    $n = 0;
    $db->beginTransaction();
    foreach ($lista as $c) {
        $tel = pebai_phone_digits((string)($c['tel'] ?? ''));
        $nom = mb_substr(trim((string)($c['nombre'] ?? '')), 0, 120);
        if ($tel !== '' && $nom !== '') {
            $q->execute([$tel, $nom, $now]);
            $n++;
        }
    }
    $db->commit();
    return $n;
}

/** Cifras para la oficina: mensajes, chats, de hoy y el más antiguo. */
function pebai_cerebro_cifras(): array
{
    $db = pebai_cerebro_db();
    $r = $db->query('SELECT COUNT(*) n, COUNT(DISTINCT tel) chats, MIN(ts) desde, SUM(de_mi) mios FROM mensajes')->fetch();
    $hoy = (int)$db->query('SELECT COUNT(*) FROM mensajes WHERE ts >= ' . strtotime('today'))->fetchColumn();
    return ['mensajes' => (int)$r['n'], 'chats' => (int)$r['chats'], 'desde' => (int)$r['desde'], 'mios' => (int)$r['mios'], 'hoy' => $hoy];
}

/* ------------------------------------------------------------------ Claude --- */
/** Cómo escribe Daniel: sus últimos mensajes escritos a mano en chats de trabajo (o en cualquiera, al principio). */
function pebai_cerebro_estilo(int $n = 25): string
{
    $q = pebai_cerebro_db()->query("SELECT m.texto FROM mensajes m LEFT JOIN contactos c ON c.tel = m.tel
        WHERE m.de_mi = 1 AND m.agente = 0 AND length(m.texto) BETWEEN 8 AND 600 AND m.texto NOT LIKE '[%' AND COALESCE(c.clase, '') <> 'personal'
        ORDER BY m.ts DESC LIMIT " . $n);
    return implode("\n---\n", array_map(static fn($t) => trim((string)$t), $q->fetchAll(PDO::FETCH_COLUMN)));
}

/**
 * Mira los chats con mensajes nuevos (como mucho $max): Claude Haiku los clasifica (personal, cliente, negocio, prospecto…),
 * resume de qué va y dice si te toca contestar. Nunca envía nada ni escribe respuestas (Daniel, 08/11: la IA no deja respuestas escritas).
 */
function pebai_cerebro_procesar(int $max = 4): int
{
    require_once __DIR__ . '/_claude_lib.php';
    $db = pebai_cerebro_db();
    $chats = $db->query('SELECT tel, nombre FROM contactos WHERE pendiente = 1 ORDER BY actualizado DESC LIMIT ' . $max)->fetchAll();
    $hechos = 0;
    foreach ($chats as $c) {
        $db->prepare('UPDATE contactos SET pendiente = 0 WHERE tel = ?')->execute([$c['tel']]);
        $msgs = array_reverse($db->query('SELECT de_mi, agente, texto, ts FROM mensajes WHERE tel = ' . $db->quote($c['tel']) . ' ORDER BY ts DESC LIMIT 16')->fetchAll());
        if (!$msgs) {
            continue;
        }
        $empresa = pebai_cerebro_prospecto($c['tel']);
        $hilo = implode("\n", array_map(static fn($m) => date('d/m H:i', (int)$m['ts']) . ' ' . ($m['de_mi'] ? ($m['agente'] ? 'DANIEL (bot)' : 'DANIEL') : 'CONTACTO') . ': ' . mb_substr((string)$m['texto'], 0, 700), $msgs));
        $nombre = $empresa ?? ((string)$c['nombre'] ?: 'sin nombre');
        $j = pebai_claude_json('cerebro', 'claude-haiku-5-5',
            'Eres Cerebro, el agente que lee los chats de WhatsApp de Daniel, cofundador de PEBAI Systems (consultora española de procesos e Inteligencia Artificial para empresas: asistentes de IA, automatizaciones, visibilidad en ChatGPT y Google). '
            . "Clasificas cada chat para que Daniel no se pierda nada. Responde SOLO JSON con estas claves:\n"
            . 'clase: "personal" (familia, amigos, temas privados), "cliente" (ya trabaja con PEBAI), "negocio" (posible cliente, socio, proveedor o algo de trabajo), "prospecto" (empresa a la que escribimos en frío), "spam" u "otro";' . "\n"
            . "interes: true si el contacto muestra interés en contratar o saber más;\n"
            . "te_toca: true si el último mensaje es del CONTACTO y espera respuesta de Daniel;\n"
            . 'resumen: una frase de qué va el chat y en qué punto está (si es personal, solo "Chat personal", sin detalles).',
            "Contacto: {$nombre}" . ($empresa ? ' (prospecto contactado en frío)' : '') . "\nCHAT (lo último abajo):\n{$hilo}",
            ['effort' => 'low', 'max_tokens' => 1200]);
        if (!is_array($j)) {
            continue;
        }
        $clase = in_array($j['clase'] ?? '', ['personal', 'cliente', 'negocio', 'prospecto', 'spam', 'otro'], true) ? $j['clase'] : 'otro';
        if ($empresa) {
            $clase = 'prospecto';
        }
        $tetoca = !empty($j['te_toca']) && !end($msgs)['de_mi'];
        $db->prepare("UPDATE contactos SET clase = ?, resumen = ?, interes = ?, te_toca = ?, borrador = '', analizado = ? WHERE tel = ?")
           ->execute([$clase, mb_substr((string)($j['resumen'] ?? ''), 0, 400), !empty($j['interes']) ? 1 : 0, $tetoca ? 1 : 0, date('Y-m-d H:i:s'), $c['tel']]);
        if ($clase !== 'personal' && $clase !== 'spam') {
            pebai_actividad('cerebro', 'hito', ($tetoca ? 'Te toca contestar a ' : 'Leído: ') . $nombre
                . ' (' . $clase . (!empty($j['interes']) ? ', interesado' : '') . ')', (string)($j['resumen'] ?? ''));
        }
        $hechos++;
    }
    return $hechos;
}

/* ------------------------------------------------------ Laboratorio --- */
/*
 * Laboratorio de primeros mensajes (Daniel, 28/10: «Cerebro debe ser el encargado de todo el departamento»).
 * Una de cada tres empresas de la cola recibe un primer WhatsApp sobre VISIBILIDAD EN IA, con un dato real de una búsqueda
 * («he preguntado a la IA por … y salen A y B, pero no vosotros»); otra de cada tres, sobre SU APP; el resto lo escribe el
 * Redactor como siempre (asistente). Se marcan con su plantilla (lab-geo, lab-app) y se mide quién responde de verdad.
 * Mismas reglas que el Redactor: se presenta, ofrece la baja, sin enlaces, sin precios, una sola pregunta.
 */
const PEBAI_LAB_DIA = 30;   // primeros mensajes del laboratorio al día como mucho (cada uno ~1-2 céntimos)
// Nichos que escribe Cerebro (Daniel, 28/10: «escribe a varios nichos así vemos estadísticas»). En los nuevos solo las empresas que el
// Redactor ya ha revisado y encajan ([revisado]); en placas solares, una de cada tres va a asistente con el Redactor como siempre.
const PEBAI_LAB_NICHOS = [
    'solar' => ['sector' => 'instaladoras de placas solares', 'quien' => 'una instaladora de placas solares',
                'app' => 'pedir presupuesto con fotos, seguir el estado de su instalación y recibir avisos de mantenimiento',
                'asistente' => 'contestar al momento a quien pide presupuesto, también fuera de horario, y agendar la visita'],
    'dentales' => ['sector' => 'clínicas dentales', 'quien' => 'una clínica dental',
                   'app' => 'pedir cita, recibir recordatorios de sus visitas y ver sus tratamientos y presupuestos',
                   'asistente' => 'contestar al momento por WhatsApp a cada paciente, dar cita y recordar las visitas, también fuera de horario'],
    'inmobiliarias' => ['sector' => 'inmobiliarias', 'quien' => 'una inmobiliaria',
                        'app' => 'recibir avisos de pisos nuevos que encajan con lo que buscan, pedir visita y seguir su compra o alquiler',
                        'asistente' => 'contestar al momento cada consulta de compradores e inquilinos, filtrar a los interesados y agendar las visitas'],
    'climatizacion' => ['sector' => 'empresas de climatización', 'quien' => 'una empresa de climatización y aire acondicionado',
                        'app' => 'pedir presupuesto, programar el mantenimiento de sus equipos y recibir avisos de revisión',
                        'asistente' => 'contestar al momento a quien pide presupuesto o una reparación urgente y agendar la visita del técnico'],
    'formacion' => ['sector' => 'centros de formación', 'quien' => 'un centro de formación',
                    'app' => 'inscribirse en cursos, ver horarios, materiales y avisos de clase',
                    'asistente' => 'contestar al momento a quien pregunta por cursos, precios o plazas y apuntarle'],
    'oposiciones' => ['sector' => 'academias de oposiciones', 'quien' => 'una academia de oposiciones',
                      'app' => 'seguir el temario, hacer test, ver su progreso y recibir avisos de convocatorias',
                      'asistente' => 'contestar al momento a quien pregunta por grupos, horarios o matrícula y apuntarle'],
    'idiomas' => ['sector' => 'academias de idiomas', 'quien' => 'una academia de idiomas',
                  'app' => 'reservar clases, ver su nivel y sus deberes y recibir avisos',
                  'asistente' => 'contestar al momento a quien pregunta por cursos, niveles o precios y darle una prueba de nivel'],
    'reformas' => ['sector' => 'empresas de reformas integrales', 'quien' => 'una empresa de reformas',
                   'app' => 'pedir presupuesto con fotos y medidas, ver el avance de su obra y hablar con el equipo',
                   'asistente' => 'contestar al momento a quien pide presupuesto, pedirle fotos y medidas y dar cita para la visita'],
];

function pebai_lab_ok(string $t): bool
{
    $n = count(preg_split('/\s+/u', $t, -1, PREG_SPLIT_NO_EMPTY));
    return $n >= 25 && $n <= 75 && str_contains($t, 'PEBAI') && substr_count($t, '?') === 1
        && preg_match('/no (os |te )?(escribo|vuelvo|molesto)|me lo dec[ií]s/iu', $t)
        && !preg_match('/https?:|www\.|€|\d+ ?%|\birpf\b|subvenci|gratis|gratuit|garantiz/iu', $t);
}

/** Prepara hasta $max primeros mensajes del laboratorio. Devuelve cuántos ha escrito. */
function pebai_lab_preparar(int $max = 1, string $grupo = ''): int
{
    require_once __DIR__ . '/_demos_lib.php';
    $db = pebai_agentes_db();
    // Sin tope diario (5/11): preparar ya no cuesta IA y el cupo de envíos del día ya limita, el tope dejaba a un nicho sin mensajes
    $hechos = 0;
    // Mismo reparto que el envío: escribe para el grupo que tiene menos mensajes listos en proporción a su parte.
    // Dentales e inmobiliarias: solo empresas revisadas por el Redactor ([revisado]), que es gratis. Solar y reformas van directas.
    $listos = [];
    foreach (PEBAI_REPARTO as $g => [$parte, $nichos]) {
        $ns = implode(',', array_map(static fn($n) => $db->quote($n), $nichos));
        $listos[$g] = (int)$db->query("SELECT COUNT(*) FROM prospectos WHERE estado = 'pendiente' AND mensaje <> '' AND nicho IN ($ns)")->fetchColumn() / $parte;
    }
    asort($listos);
    $cola = [];
    foreach ($grupo !== '' ? [$grupo] : array_keys($listos) as $g) {
        $ns = implode(',', array_map(static fn($n) => $db->quote($n), PEBAI_REPARTO[$g][1]));
        $cola = $db->query("SELECT * FROM prospectos WHERE estado = 'pendiente' AND mensaje = '' AND web <> '' AND plantilla = '' AND nicho IN ($ns)
                            AND (nicho IN ('solar', 'reformas') OR error LIKE '[revisado]%')
                            AND telefono NOT IN (SELECT telefono FROM bajas) ORDER BY RANDOM() LIMIT " . (int)$max)->fetchAll();
        if ($cola) {
            break;
        }
    }
    foreach ($cola as $p) {
        $web = preg_match('~^https?://~', (string)$p['web']) ? (string)$p['web'] : 'https://' . ltrim((string)$p['web'], '/');
        $w = pebai_web_texto($web);
        // 5/11 (Daniel): sin revisión de pago con IA; mensaje fijo, sin gancho de la IA; solo cambia el nombre de la empresa
        $ca = $w && pebai_ia_solo_catalan($w['texto']);
        $t = pebai_wa_fijo((string)$p['empresa'], $ca, (string)$p['ciudad'], (string)$p['nicho']);
        $db->prepare("UPDATE prospectos SET mensaje = ?, plantilla = 'lab-fijo', updated_at = ? WHERE id = ? AND mensaje = '' AND estado = 'pendiente'")
           ->execute([$t, date('Y-m-d H:i:s'), $p['id']]);
        pebai_actividad('cerebro', 'hito', 'Primer mensaje para ' . $p['empresa'] . ' (' . $p['nicho'] . ')', $t, 'wa:' . $p['id']);
        $hechos++;
    }
    return $hechos;
}

/**
 * Gancho para el primer contacto: la IA propone tres (del mejor al peor) y vale el primero cuyo dato está literal en su web
 * y pasa el control (sin cifras inventadas, sin preguntas, sin temas prohibidos). Devuelve gancho '' si ninguno vale.
 */
function pebai_lab_gancho(array $w, array $N, string $empresa, string $ciudad, bool $ca, string $canal): array
{
    require_once __DIR__ . '/_claude_lib.php';
    require_once __DIR__ . '/_ia_lib.php';
    $g = pebai_claude_json('cerebro', 'claude-sonnet-5-5',
        'Lees la portada de la web de ' . $N['quien'] . ' española y sacas datos reales para empezar un ' . $canal . ' en frío de Daniel, de PEBAI Systems (consultora de procesos e IA). '
        . 'Responde SOLO JSON {"opciones": [hasta 3 objetos distintos, del mejor al peor, cada uno {"dato": copia LITERAL (exacta, de 2 a 12 palabras) del fragmento de su web en que te basas, '
        . PEBAI_WA_GANCHO_REGLAS . '}]}' . ($ca ? ' Su web está en catalán: el gancho, en catalán («He vist que …»).' : ' El gancho, en español de España.'),
        'EMPRESA: ' . $empresa . " ({$ciudad})\nWEB:\n" . mb_substr($w['texto'], 0, 3000), ['effort' => 'low', 'max_tokens' => 1800]);
    foreach (is_array($g['opciones'] ?? null) ? $g['opciones'] : [] as $op) {
        $dato = trim((string)($op['dato'] ?? ''));
        $gancho = trim((string)($op['gancho'] ?? ''));
        if ($gancho === '' || $dato === '' || !str_contains(pebai_ia_norm($w['texto']), trim(pebai_ia_norm($dato)))) {
            continue;   // el dato no está en su web: no vale
        }
        $limpio = pebai_ia_gancho($gancho, $dato);
        if ($limpio !== null && $limpio !== '') {
            return ['gancho' => $limpio, 'dato' => $dato, 'nombre' => pebai_ia_nombre((string)($op['nombre'] ?? ''), $w['texto'])];
        }
    }
    return ['gancho' => '', 'dato' => '', 'nombre' => ''];
}

// Email (Daniel, 5/11): solo inmobiliarias, clínicas dentales y reformas, por igual. Las instaladoras van por WhatsApp
const PEBAI_EMAIL_NICHOS = ['dentales', 'inmobiliarias', 'reformas'];
const PEBAI_EMAIL_ESCRITOS_DIA = 40;   // primeros emails que se preparan al día como mucho (cada uno ~1-2 céntimos)

/**
 * Prepara primeros emails: comprueba que su web responde y deja el texto con la plantilla de Daniel y su recordatorio.
 * Las revisadas por el Redactor van primero. Sin coste de IA. Nunca envía.
 */
function pebai_lab_preparar_email(int $max = 1): int
{
    require_once __DIR__ . '/_email_lib.php';
    require_once __DIR__ . '/_ia_lib.php';
    require_once __DIR__ . '/_claude_lib.php';
    $db = pebai_email_db();
    $hoy =(int)$db->query("SELECT COUNT(*) FROM email_prospectos WHERE asunto_personal LIKE 'pregunta p%' AND updated_at >= '" . date('Y-m-d') . "'")->fetchColumn();
    if ($hoy >= PEBAI_EMAIL_ESCRITOS_DIA) {
        return 0;
    }
    // Por igual: primero el nicho con menos emails escritos hasta ahora; si no le quedan empresas, el siguiente
    $escritos = [];
    foreach (PEBAI_EMAIL_NICHOS as $n) {
        $q = $db->prepare("SELECT COUNT(*) FROM email_prospectos WHERE nicho = ? AND cuerpo_personal <> ''");
        $q->execute([$n]);
        $escritos[$n] = (int)$q->fetchColumn();
    }
    asort($escritos);
    $cola = [];
    foreach (array_keys($escritos) as $n) {
        $q = $db->prepare("SELECT * FROM email_prospectos WHERE estado = 'pendiente' AND paso = 0 AND cuerpo_personal = '' AND web <> '' AND nicho = ?
                           AND error NOT LIKE '[ia_error]%' AND error NOT LIKE '[redactor]%' ORDER BY (error LIKE '[revisado]%') DESC, prioridad DESC, RANDOM() LIMIT " . (int)$max);
        $q->execute([$n]);
        if ($cola = $q->fetchAll()) {
            break;
        }
    }
    $hechos = 0;
    foreach ($cola as $p) {
        $now = date('Y-m-d H:i:s');
        $web = preg_match('~^https?://~', (string)$p['web']) ? (string)$p['web'] : 'https://' . ltrim((string)$p['web'], '/');
        $w = pebai_web_texto($web);
        if (!$w) {
            $db->prepare("UPDATE email_prospectos SET error = ?, updated_at = ? WHERE id = ?")->execute(['[ia_error] La web no responde o está vacía', $now, $p['id']]);
            continue;
        }
        $ca = pebai_ia_solo_catalan($w['texto']);
        // 5/11 (Daniel): email sin revisión de pago y sin gancho de la IA, igual que el WhatsApp
        $g = ['gancho' => '', 'dato' => '', 'nombre' => ''];
        $e = pebai_email_texto_nuevo($g + ['ca' => $ca], (string)$p['empresa'], (string)$p['ciudad']);
        $db->prepare("UPDATE email_prospectos SET asunto_personal = ?, cuerpo_personal = ?, asunto_recordatorio = '', cuerpo_recordatorio = ?, error = '', updated_at = ? WHERE id = ? AND cuerpo_personal = ''")
           ->execute([$e['asunto'], $e['cuerpo'], $e['recordatorio'], $now, $p['id']]);
        pebai_actividad('email', 'cambio', 'Email escrito para ' . $p['empresa'] . ' (' . $p['nicho'] . ')', $e['asunto'] . "\n\n" . $e['cuerpo'], 'email:' . $p['id']);
        $hechos++;
    }
    return $hechos;
}

/** Resultados del laboratorio: por variante, enviados, personas que contestan (sin contestadores) e interesados. */
function pebai_lab_resultados(): array
{
    require_once __DIR__ . '/_conversaciones_lib.php';
    $clas = [];
    foreach (pebai_conv_db()->query("SELECT prospecto_id, clasificacion FROM conversaciones WHERE canal = 'whatsapp'") as $r) {
        $clas[(int)$r['prospecto_id']] = (string)$r['clasificacion'];
    }
    $out = [];
    foreach (pebai_agentes_db()->query("SELECT id, plantilla, respondido_at, nicho FROM prospectos WHERE enviado_at <> ''") as $r) {
        $v = (str_starts_with((string)$r['plantilla'], 'lab-') ? substr($r['plantilla'], 4) : 'asistente') . '|' . $r['nicho'];
        $o = $out[$v] ?? ['enviados' => 0, 'personas' => 0, 'interes' => 0];
        $o['enviados']++;
        $c = $clas[(int)$r['id']] ?? '';
        if ($r['respondido_at'] !== '' && $c !== 'auto') {
            $o['personas']++;
        }
        if (in_array($c, ['interesado', 'pregunta', 'info_enviada'], true)) {
            $o['interes']++;
        }
        $out[$v] = $o;
    }
    return $out;
}
