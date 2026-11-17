<?php
/*
 * PEBAI · Growth Partner (15/11/2026): personas que nos presentan negocios y cobran un 8 % si el cliente firma.
 *   pebai_gp_db()        → tablas en la base privada del panel (leads.sqlite)
 *   pebai_gp_encaje()    → puntuación de 0 a 15 según sus respuestas, para saber a quién llamar primero
 *   pebai_gp_estado()    → todo lo que enseña la sección Growth Partner del panel
 * El embudo del formulario (cuántos llegan a cada paso) se guarda sumado por hora, paso y origen: sin cookies ni identificadores.
 */
require_once __DIR__ . '/_pebai_lib.php';

const PEBAI_GP_PREGUNTAS = [
    'negocio' => ['¿Tiene algún negocio en mente?', ['uno' => 'Sí, uno concreto', 'varios' => 'Sí, varios', 'todavia' => 'Todavía no']],
    'red' => ['¿Conoce dueños de negocio con confianza?', ['pocos' => 'Pocos (0-2)', 'algunos' => 'Algunos (3-10)', 'muchos' => 'Muchos (más de 10)']],
    'experiencia' => ['¿Ha montado algún negocio?', ['tiene' => 'Tiene o ha tenido uno', 'intento' => 'Lo ha intentado', 'quiere' => 'No, pero quiere', 'no' => 'No']],
    'mentalidad' => ['Si un cliente no firma…', ['pregunta' => 'Pregunta qué falló y busca otro', 'siguiente' => 'Pasa al siguiente', 'desanima' => 'Se desanima y lo deja']],
    'motivo' => ['¿Qué le mueve?', ['extra' => 'Ganar un extra', 'aprender' => 'Aprender a vender y emprender', 'ayudar' => 'Ayudar a negocios que conoce', 'curiosidad' => 'Solo curiosidad']],
];
// Puntos por respuesta (máximo 15): tener ya un negocio en mente y una red amplia es lo que más pesa
const PEBAI_GP_PUNTOS = [
    'negocio' => ['uno' => 3, 'varios' => 3, 'todavia' => 1],
    'red' => ['pocos' => 0, 'algunos' => 2, 'muchos' => 3],
    'experiencia' => ['tiene' => 3, 'intento' => 2, 'quiere' => 1, 'no' => 0],
    'mentalidad' => ['pregunta' => 3, 'siguiente' => 2, 'desanima' => 0],
    'motivo' => ['extra' => 2, 'aprender' => 2, 'ayudar' => 3, 'curiosidad' => 0],
];
const PEBAI_GP_ESTADOS = ['nuevo' => 'Nuevo', 'contactado' => 'Contactado', 'activo' => 'Partner activo', 'descartado' => 'Descartado'];

function pebai_gp_db(): PDO
{
    static $listo = false;
    $db = pebai_db();
    if ($listo) {
        return $db;
    }
    $db->exec('CREATE TABLE IF NOT EXISTS gp_solicitudes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT NOT NULL,
        estado TEXT NOT NULL DEFAULT "nuevo",
        estado_at TEXT NOT NULL DEFAULT "",
        nombre TEXT NOT NULL,
        telefono TEXT NOT NULL,
        email TEXT NOT NULL DEFAULT "",
        negocio TEXT NOT NULL DEFAULT "",
        red TEXT NOT NULL DEFAULT "",
        experiencia TEXT NOT NULL DEFAULT "",
        mentalidad TEXT NOT NULL DEFAULT "",
        motivo TEXT NOT NULL DEFAULT "",
        porque TEXT NOT NULL DEFAULT "",
        encaje INTEGER NOT NULL DEFAULT 0,
        cta TEXT NOT NULL DEFAULT "",
        fuente TEXT NOT NULL DEFAULT "",
        medio TEXT NOT NULL DEFAULT "",
        campana TEXT NOT NULL DEFAULT "",
        primer_toque TEXT NOT NULL DEFAULT "",
        ultimo_toque TEXT NOT NULL DEFAULT "",
        pagina TEXT NOT NULL DEFAULT "",
        dispositivo TEXT NOT NULL DEFAULT "",
        ip_hash TEXT NOT NULL DEFAULT "",
        email_enviado INTEGER NOT NULL DEFAULT 0
    )');
    $db->exec('CREATE TABLE IF NOT EXISTS gp_pasos (
        fecha TEXT NOT NULL,
        paso INTEGER NOT NULL,
        cta TEXT NOT NULL DEFAULT "",
        n INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (fecha, paso, cta)
    )');
    $listo = true;
    return $db;
}

/** Puntuación de encaje de 0 a 15 (más alto = llamar antes). */
function pebai_gp_encaje(array $r): int
{
    $p = 0;
    foreach (PEBAI_GP_PUNTOS as $k => $tabla) {
        $p += $tabla[$r[$k] ?? ''] ?? 0;
    }
    return $p;
}

/** Suma 1 al paso del formulario en el día y origen (sin datos de la persona). */
function pebai_gp_paso(int $paso, string $cta): void
{
    pebai_gp_db()->prepare('INSERT INTO gp_pasos (fecha, paso, cta, n) VALUES (?, ?, ?, 1) ON CONFLICT(fecha, paso, cta) DO UPDATE SET n = n + 1')
        ->execute([date('Y-m-d H:00'), $paso, $cta]);
}

/** Nombre legible del origen (el «cta» de los enlaces de la web). */
function pebai_gp_origen(string $cta, string $fuente = ''): string
{
    // Si la persona vino de una red (aunque luego entrara por el menú de la web), cuenta esa red
    $redes = ['tiktok' => 'TikTok', 'tt' => 'TikTok', 'instagram' => 'Instagram', 'facebook' => 'Facebook', 'youtube' => 'YouTube', 'linkedin' => 'LinkedIn', 'whatsapp' => 'WhatsApp'];
    if (isset($redes[strtolower($fuente)])) {
        return $redes[strtolower($fuente)];
    }
    $mapa = ['tiktok' => 'TikTok', 'tt' => 'TikTok', 'instagram' => 'Instagram', 'gp_menu' => 'Menú de la web', 'gp_home' => 'Portada', 'gp_footer' => 'Pie de la web', 'gp_quienes' => 'Quiénes somos', 'whatsapp' => 'WhatsApp'];
    if (isset($mapa[$cta])) {
        return $mapa[$cta];
    }
    if ($cta !== '') {
        return $cta;
    }
    return $fuente !== '' && $fuente !== 'directo' ? $fuente : 'Enlace directo';
}

/** Todo lo de la sección del panel: solicitudes, cifras, embudo, respuestas y orígenes. */
function pebai_gp_estado(): array
{
    $db = pebai_gp_db();
    $filas = $db->query('SELECT id, created_at, estado, estado_at, nombre, telefono, email, negocio, red, experiencia, mentalidad, motivo, porque, encaje, cta, fuente, medio, campana, pagina FROM gp_solicitudes ORDER BY id DESC')->fetchAll();
    foreach ($filas as &$f) {
        $f['origen'] = pebai_gp_origen((string)$f['cta'], (string)$f['fuente']);
        $f['id'] = (int)$f['id'];
        $f['encaje'] = (int)$f['encaje'];
    }
    unset($f);

    // Embudo del formulario: llegadas a cada paso (paso 1 = visitas al formulario) y envíos
    $desde = date('Y-m-d', strtotime('-29 days'));
    $pasos = array_fill(1, 7, 0);
    $q = $db->prepare('SELECT paso, SUM(n) n FROM gp_pasos WHERE fecha >= ? GROUP BY paso');
    $q->execute([$desde]);
    foreach ($q as $r) {
        if (isset($pasos[(int)$r['paso']])) {
            $pasos[(int)$r['paso']] = (int)$r['n'];
        }
    }
    $envios30 = count(array_filter($filas, static fn($f) => $f['created_at'] >= $desde));

    // Serie de 30 días: visitas al formulario y solicitudes
    $serie = [];
    for ($i = 29; $i >= 0; $i--) {
        $serie[date('Y-m-d', strtotime("-$i days"))] = ['visitas' => 0, 'solicitudes' => 0];
    }
    $q = $db->prepare('SELECT substr(fecha, 1, 10) fecha, SUM(n) n FROM gp_pasos WHERE paso = 1 AND fecha >= ? GROUP BY substr(fecha, 1, 10)');
    $q->execute([$desde]);
    foreach ($q as $r) {
        if (isset($serie[$r['fecha']])) {
            $serie[$r['fecha']]['visitas'] = (int)$r['n'];
        }
    }
    foreach ($filas as $f) {
        $d = substr($f['created_at'], 0, 10);
        if (isset($serie[$d])) {
            $serie[$d]['solicitudes']++;
        }
    }

    // Orígenes: visitas y solicitudes por sitio desde el que llegan
    $origenes = [];
    $q = $db->prepare('SELECT cta, SUM(n) n FROM gp_pasos WHERE paso = 1 AND fecha >= ? GROUP BY cta');
    $q->execute([$desde]);
    foreach ($q as $r) {
        $o = pebai_gp_origen((string)$r['cta']);
        $origenes[$o] = ($origenes[$o] ?? ['visitas' => 0, 'solicitudes' => 0]);
        $origenes[$o]['visitas'] += (int)$r['n'];
    }
    foreach ($filas as $f) {
        if ($f['created_at'] >= $desde) {
            $origenes[$f['origen']] = ($origenes[$f['origen']] ?? ['visitas' => 0, 'solicitudes' => 0]);
            $origenes[$f['origen']]['solicitudes']++;
        }
    }
    uasort($origenes, static fn($a, $b) => ($b['solicitudes'] <=> $a['solicitudes']) ?: ($b['visitas'] <=> $a['visitas']));

    // Respuestas: cuántos eligieron cada opción (todas las solicitudes)
    $respuestas = [];
    foreach (PEBAI_GP_PREGUNTAS as $k => [$titulo, $ops]) {
        $c = array_fill_keys(array_keys($ops), 0);
        foreach ($filas as $f) {
            if (isset($c[$f[$k]])) {
                $c[$f[$k]]++;
            }
        }
        $respuestas[] = ['clave' => $k, 'titulo' => $titulo, 'opciones' => array_map(static fn($v, $t) => ['v' => $v, 't' => $t, 'n' => $c[$v]], array_keys($ops), $ops)];
    }

    $estados = array_fill_keys(array_keys(PEBAI_GP_ESTADOS), 0);
    foreach ($filas as $f) {
        $estados[$f['estado']] = ($estados[$f['estado']] ?? 0) + 1;
    }

    return [
        'ok' => true, 'hoy' => date('Y-m-d'),
        'filas' => $filas,
        'preguntas' => array_map(static fn($p) => ['titulo' => $p[0], 'opciones' => $p[1]], PEBAI_GP_PREGUNTAS),
        'puntos' => PEBAI_GP_PUNTOS,
        'estados_nombre' => PEBAI_GP_ESTADOS,
        'cifras' => [
            'total' => count($filas), 'nuevos' => $estados['nuevo'], 'activos' => $estados['activo'],
            'visitas30' => $pasos[1], 'envios30' => $envios30,
            'conversion30' => $pasos[1] ? round($envios30 / $pasos[1] * 100, 1) : null,
            'encaje_medio' => $filas ? round(array_sum(array_column($filas, 'encaje')) / count($filas), 1) : null,
        ],
        'estados' => $estados,
        'embudo' => array_values(array_map(static fn($p, $n) => ['paso' => $p, 'n' => $n], array_keys($pasos), $pasos)),
        'serie' => array_map(static fn($d, $v) => ['d' => $d] + $v, array_keys($serie), $serie),
        'origenes' => array_map(static fn($o, $v) => ['origen' => $o] + $v, array_keys($origenes), $origenes),
        'respuestas' => $respuestas,
    ];
}
