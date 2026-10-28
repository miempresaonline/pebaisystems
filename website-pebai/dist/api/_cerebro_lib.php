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
const PEBAI_LAB_DIA = 12;   // primeros mensajes del laboratorio al día como mucho (cada uno ~1-2 céntimos)

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
    $hoy = (int)$db->query("SELECT COUNT(*) FROM prospectos WHERE plantilla IN ('lab-geo','lab-app') AND updated_at >= '" . date('Y-m-d') . "' AND mensaje <> ''")->fetchColumn();
    if ($hoy >= PEBAI_LAB_DIA) {
        return 0;
    }
    $hechos = 0;
    $cola = $db->query("SELECT * FROM prospectos WHERE estado = 'pendiente' AND nicho = 'solar' AND mensaje = '' AND web <> '' AND plantilla = '' AND id % 3 <> 0
                        AND telefono NOT IN (SELECT telefono FROM bajas) ORDER BY prioridad DESC, id LIMIT " . (int)$max)->fetchAll();
    foreach ($cola as $p) {
        $web = preg_match('~^https?://~', (string)$p['web']) ? (string)$p['web'] : 'https://' . ltrim((string)$p['web'], '/');
        $w = pebai_web_texto($web);
        $variante = (int)$p['id'] % 3 === 1 ? 'geo' : 'app';
        $ciudad = trim((string)$p['ciudad']) ?: 'su zona';
        $dato = '';
        if ($variante === 'geo') {
            $r = pebai_demo_radiografia((string)$p['empresa'], 'instaladoras de placas solares', $ciudad, $web);
            $otros = $r ? array_slice(array_column($r['busquedas'][0]['empresas'] ?? [], 'nombre'), 0, 3) : [];
            if (!$r || $r['aparece'] || count($otros) < 2) {
                $variante = 'app';   // si ya salen (o la búsqueda no dice nada claro), el gancho de la IA no vale: va a la app
            } else {
                $dato = 'Has buscado en internet con una IA «' . $r['busquedas'][0]['consulta'] . '» y salen ' . implode(', ', $otros) . '; ' . $p['empresa'] . ' no sale.';
            }
        }
        $sistema = 'Escribes el PRIMER WhatsApp en frío de Daniel, de PEBAI Systems (consultora española de procesos e Inteligencia Artificial), a una instaladora de placas solares. '
            . 'Español de España, tuteo en plural (os), natural, como lo escribiría una persona: 2 o 3 párrafos cortos separados por una línea en blanco, 35-60 palabras en total. '
            . 'Empieza exactamente por «Hola, soy Daniel, de PEBAI Systems.». Una sola pregunta, al final, fácil de contestar. Termina con una frase corta para darse de baja (p. ej. «Si no os interesa, me lo decís y no os escribo más.»). '
            . 'Prohibido: enlaces, precios, porcentajes, cifras de ahorro, «gratis», leyes, subvenciones, prometer resultados, hablar de su web o venderles una web. Nada inventado. Devuelve SOLO el mensaje.';
        $tema = $variante === 'geo'
            ? "TEMA: visibilidad en Inteligencia Artificial. DATO REAL (úsalo tal cual, sin exagerar): {$dato} Cuéntalo en una frase, di que en PEBAI ayudamos a que la IA recomiende a empresas como la suya cuando un cliente pregunta, y pregunta si quieren que les enseñes lo que salió."
            : 'TEMA: una app propia para sus clientes (pedir presupuesto con fotos, seguir el estado de su instalación, avisos de mantenimiento). Usa UN detalle concreto de su web para que se note que la has mirado, '
              . 'di que en PEBAI hacemos apps a medida para empresas como la suya y pregunta si les interesaría ver cómo sería la suya.';
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
        pebai_actividad('cerebro', 'hito', 'Laboratorio: primer mensaje de ' . ($variante === 'geo' ? 'visibilidad en IA' : 'app') . ' para ' . $p['empresa'], $t, 'wa:' . $p['id']);
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
    foreach (pebai_agentes_db()->query("SELECT id, plantilla, respondido_at FROM prospectos WHERE enviado_at <> '' AND nicho = 'solar'") as $r) {
        $v = str_starts_with((string)$r['plantilla'], 'lab-') ? substr($r['plantilla'], 4) : 'asistente';
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
