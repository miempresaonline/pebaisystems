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
 * resume de qué va y dice si te toca contestar; si es de trabajo y te toca, Claude Sonnet escribe un borrador con tu estilo.
 * Nunca envía nada. Los prospectos los lleva Conversaciones (allí ya se preparan sus respuestas).
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
        $borrador = '';
        if ($tetoca && in_array($clase, ['cliente', 'negocio'], true)) {
            $borrador = (string)(pebai_claude('cerebro', 'claude-sonnet-5-5',
                'Escribes como Daniel, cofundador de PEBAI Systems, la respuesta de WhatsApp que él mandaría ahora. Español de España, tuteo, cercano y profesional, breve como un WhatsApp de verdad (2-3 frases). '
                . 'Imita su forma de escribir (saludos, largo, emojis, cómo cierra) con los ejemplos. No inventes precios, plazos, datos ni compromisos: si hace falta un dato que no está en el chat, pregúntalo o di que lo miras. '
                . "Devuelve SOLO el texto del mensaje.\n\nASÍ ESCRIBE DANIEL:\n" . pebai_cerebro_estilo(),
                [['role' => 'user', 'content' => "Chat con {$nombre} (lo último abajo):\n{$hilo}\n\nEscribe la respuesta de Daniel."]],
                ['effort' => 'medium', 'max_tokens' => 2000, 'cache' => true]) ?? '');
        }
        $db->prepare('UPDATE contactos SET clase = ?, resumen = ?, interes = ?, te_toca = ?, borrador = ?, analizado = ? WHERE tel = ?')
           ->execute([$clase, mb_substr((string)($j['resumen'] ?? ''), 0, 400), !empty($j['interes']) ? 1 : 0, $tetoca ? 1 : 0, mb_substr($borrador, 0, 1500), date('Y-m-d H:i:s'), $c['tel']]);
        if ($clase !== 'personal' && $clase !== 'spam') {
            pebai_actividad('cerebro', 'hito', ($borrador !== '' ? 'Borrador listo para ' : ($tetoca ? 'Te toca contestar a ' : 'Leído: ')) . $nombre
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
function pebai_lab_preparar(int $max = 1): int
{
    require_once __DIR__ . '/_demos_lib.php';
    $db = pebai_agentes_db();
    $hoy = (int)$db->query("SELECT COUNT(*) FROM prospectos WHERE plantilla IN ('lab-geo','lab-app','lab-asistente') AND updated_at >= '" . date('Y-m-d') . "' AND mensaje <> ''")->fetchColumn();
    if ($hoy >= PEBAI_LAB_DIA) {
        return 0;
    }
    $hechos = 0;
    // Mismo reparto que el envío: escribe para el grupo que tiene menos mensajes listos en proporción a su parte.
    // Nichos nuevos: solo empresas revisadas por el Redactor ([revisado]) o, en los que él no revisa, Cerebro comprueba que encajan.
    $listos = [];
    foreach (PEBAI_REPARTO as $g => [$parte, $nichos]) {
        $ns = implode(',', array_map(static fn($n) => $db->quote($n), $nichos));
        $listos[$g] = (int)$db->query("SELECT COUNT(*) FROM prospectos WHERE estado = 'pendiente' AND mensaje <> '' AND nicho IN ($ns)")->fetchColumn() / $parte;
    }
    asort($listos);
    $cola = [];
    foreach (array_keys($listos) as $g) {
        $ns = implode(',', array_map(static fn($n) => $db->quote($n), PEBAI_REPARTO[$g][1]));
        $cola = $db->query("SELECT * FROM prospectos WHERE estado = 'pendiente' AND mensaje = '' AND web <> '' AND plantilla = '' AND nicho IN ($ns)
                            AND ((nicho = 'solar' AND id % 3 <> 0) OR nicho IN ('climatizacion','formacion','oposiciones','idiomas') OR error LIKE '[revisado]%')
                            AND telefono NOT IN (SELECT telefono FROM bajas) ORDER BY RANDOM() LIMIT " . (int)$max)->fetchAll();
        if ($cola) {
            break;
        }
    }
    foreach ($cola as $p) {
        $web = preg_match('~^https?://~', (string)$p['web']) ? (string)$p['web'] : 'https://' . ltrim((string)$p['web'], '/');
        $w = pebai_web_texto($web);
        $N = PEBAI_LAB_NICHOS[$p['nicho']] ?? PEBAI_LAB_NICHOS['solar'];
        // Nichos sin revisión del Redactor: Cerebro mira su web y solo sigue si es una empresa independiente, activa y con equipo
        if (in_array($p['nicho'], ['climatizacion', 'formacion', 'oposiciones', 'idiomas'], true)) {
            $enc = $w ? pebai_claude_json('cerebro', 'claude-haiku-5-5', 'Decides si una empresa española encaja como cliente de PEBAI Systems (asistentes de IA, visibilidad en IA y apps para pymes). Responde SOLO JSON {"encaja": true/false, "motivo": "una frase"}.',
                "Encaja si es " . $N['quien'] . " independiente (no franquicia ni cadena), activa, con equipo y que recibe consultas de clientes. No encaja si es un autónomo solo, una web abandonada, una tienda o un distribuidor, o de otro país.\nEMPRESA: {$p['empresa']}\nWEB:\n" . mb_substr($w['texto'], 0, 2500),
                ['effort' => 'low', 'max_tokens' => 800]) : null;
            if (!is_array($enc) || empty($enc['encaja'])) {
                $db->prepare("UPDATE prospectos SET plantilla = 'lab-no', error = ? WHERE id = ? AND mensaje = ''")->execute(['[no encaja] ' . mb_substr((string)($enc['motivo'] ?? 'sin web legible'), 0, 200), $p['id']]);
                continue;
            }
        }
        $variante = ['asistente', 'geo', 'app'][(int)$p['id'] % 3];
        if ($p['nicho'] === 'solar' && $variante === 'asistente') {
            $variante = 'app';   // en solar el asistente lo sigue escribiendo el Redactor
        }
        $ciudad = trim((string)$p['ciudad']) ?: 'su zona';
        $dato = '';
        if ($variante === 'geo') {
            $r = pebai_demo_radiografia((string)$p['empresa'], $N['sector'], $ciudad, $web);
            $otros = $r ? array_slice(array_column($r['competidores'] ?? [], 'nombre'), 0, 3) : [];   // solo empresas que salieron de verdad en la búsqueda
            if (!$r || $r['aparece'] || count($otros) < 2) {
                $variante = 'app';   // si ya salen (o la búsqueda no dice nada claro), el gancho de la IA no vale: va a la app
            } else {
                $dato = 'Has buscado en internet con una IA «' . $r['busquedas'][0]['consulta'] . '» y salen ' . implode(', ', $otros) . '; ' . $p['empresa'] . ' no sale.';
            }
        }
        $sistema = 'Escribes el PRIMER WhatsApp en frío de Daniel, de PEBAI Systems (consultora española de procesos e Inteligencia Artificial), a ' . $N['quien'] . '. '
            . 'Español de España, tuteo en plural (os), natural, como lo escribiría una persona: 2 o 3 párrafos cortos separados por una línea en blanco, 35-60 palabras en total. '
            . 'Empieza exactamente por «Hola, soy Daniel, de PEBAI Systems.». Una sola pregunta, al final, fácil de contestar. Termina con una frase corta para darse de baja (p. ej. «Si no os interesa, me lo decís y no os escribo más.»). '
            . 'Prohibido: enlaces, precios, porcentajes, cifras de ahorro, «gratis», leyes, subvenciones, prometer resultados, hablar de su web o venderles una web. Nada inventado. Devuelve SOLO el mensaje.';
        $tema = $variante === 'geo'
            ? "TEMA: visibilidad en Inteligencia Artificial. DATO REAL (úsalo tal cual, sin exagerar): {$dato} Cuéntalo en una frase, di que en PEBAI ayudamos a que la IA recomiende a empresas como la suya cuando un cliente pregunta, y pregunta si quieren que les enseñes lo que salió."
            : ($variante === 'app'
            ? 'TEMA: una app propia para sus clientes (' . $N['app'] . '). Usa UN detalle concreto de su web para que se note que la has mirado, '
              . 'di que en PEBAI hacemos apps a medida para empresas como la suya y pregunta si les interesaría ver cómo sería la suya.'
            : 'TEMA: un asistente de Inteligencia Artificial que conoce toda la información de su empresa y contesta como ellos (no el típico chatbot), para ' . $N['asistente'] . '. '
              . 'Usa UN detalle concreto de su web para que se note que la has mirado y pregunta quién lleva esos mensajes o si les vendría bien.');
        $t = '';
        for ($i = 0; $i < 2 && !pebai_lab_ok($t); $i++) {
            $t = trim((string)pebai_claude('cerebro', 'claude-sonnet-5-5', $sistema,
                [['role' => 'user', 'content' => 'EMPRESA: ' . $p['empresa'] . " ({$ciudad})\n" . $tema . ($w ? "\nSU WEB (extracto):\n" . mb_substr($w['texto'], 0, 2500) : '')]],
                ['effort' => 'low', 'max_tokens' => 2000]) ?? '');
        }
        if (!pebai_lab_ok($t)) {
            $db->prepare("UPDATE prospectos SET plantilla = 'lab-no' WHERE id = ? AND mensaje = ''")->execute([$p['id']]);   // que lo escriba el Redactor
            continue;
        }
        $db->prepare("UPDATE prospectos SET mensaje = ?, plantilla = ?, updated_at = ? WHERE id = ? AND mensaje = '' AND estado = 'pendiente'")
           ->execute([$t, 'lab-' . $variante, date('Y-m-d H:i:s'), $p['id']]);
        pebai_actividad('cerebro', 'hito', 'Laboratorio: primer mensaje de ' . ['geo' => 'visibilidad en IA', 'app' => 'app', 'asistente' => 'asistente'][$variante] . ' para ' . $p['empresa'] . ' (' . $p['nicho'] . ')', $t, 'wa:' . $p['id']);
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
