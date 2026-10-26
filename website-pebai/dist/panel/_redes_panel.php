<?php
/*
 * PEBAI · Panel — Contenido › Redes: análisis de los reels por tanda (TikTok, Instagram, YouTube Shorts y Facebook).
 * Lo incluye panel/index.php después de comprobar la sesión: usa $auth y json_out() de allí.
 *   GET ?redes=1 → las tandas con sus vídeos y métricas (foto sacada de Metricool) + las solicitudes que han llegado desde redes (en vivo).
 * Las métricas de cada vídeo se copian a mano desde Metricool al cerrar la tanda (marca PEBAI Systems): no hay llamadas a su API desde aquí.
 * LinkedIn no entra en este análisis (se publica con otro criterio, ver docs/geo/aprobaciones.md).
 */
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}

/*
 * Un vídeo por fila. Estilo: 'gancho' (título en mayúsculas tipo «Deja de…») o 'sobrio' (frase de marca + «Comenta PALABRA»).
 *   tt: v vistas, l me gusta, c comentarios, s compartidos
 *   ig: v vistas, r alcance, l, c, g guardados, s, t segundos vistos de media, vr % que pasa de 3 s
 *   yt: v vistas, t segundos vistos de media, l, c          fb: v vistas, l, t segundos vistos de media
 * null = ese vídeo no se subió a esa red.
 */
function redes_tandas(): array
{
    return [[
        'id' => '2026-10',
        'nombre' => 'Tanda 1 · octubre',
        'desde' => '2026-10-13',
        'hasta' => '2026-10-25',
        'corte' => '2026-10-26',
        'seguidores' => ['ig' => [9, 15], 'tt' => [34, 39]],
        'videos' => [
            ['f' => '2026-10-13 18:00', 'titulo' => 'Automatizar tu negocio ya no es opcional', 'estilo' => 'sobrio', 'palabra' => 'CONSULTORÍA', 'dur' => 32,
             'tt' => ['v' => 1564, 'l' => 54, 'c' => 5, 's' => 17], 'ig' => ['v' => 66, 'r' => 28, 'l' => 9, 'c' => 0, 'g' => 0, 's' => 0, 't' => 11.2, 'vr' => 48.7],
             'yt' => ['v' => 48, 't' => 4, 'l' => 3, 'c' => 0], 'fb' => ['v' => 22, 'l' => 0, 't' => 1]],
            ['f' => '2026-10-14 12:00', 'titulo' => '¿Tu empresa existe para la IA? Haz esta prueba', 'estilo' => 'sobrio', 'palabra' => 'GEO', 'dur' => 39,
             'tt' => ['v' => 606, 'l' => 25, 'c' => 1, 's' => 0], 'ig' => ['v' => 186, 'r' => 116, 'l' => 10, 'c' => 2, 'g' => 1, 's' => 2, 't' => 11.0, 'vr' => 40.4],
             'yt' => ['v' => 29, 't' => 4, 'l' => 0, 'c' => 1], 'fb' => ['v' => 116, 'l' => 0, 't' => 3]],
            ['f' => '2026-10-14 18:00', 'titulo' => 'Deja de ser esclavo de tu propio negocio', 'estilo' => 'gancho', 'palabra' => 'CONSULTORÍA', 'dur' => 27,
             'tt' => ['v' => 645, 'l' => 17, 'c' => 0, 's' => 7], 'ig' => ['v' => 73, 'r' => 39, 'l' => 10, 'c' => 0, 'g' => 0, 's' => 0, 't' => 7.1, 'vr' => 37.0],
             'yt' => ['v' => 318, 't' => 4, 'l' => 2, 'c' => 0], 'fb' => ['v' => 25, 'l' => 0, 't' => 4]],
            ['f' => '2026-10-15 06:05', 'titulo' => 'Si tardas en responder por WhatsApp, pierdes al cliente', 'estilo' => 'sobrio', 'palabra' => 'RESPUESTA', 'dur' => 33,
             'tt' => ['v' => 479, 'l' => 16, 'c' => 1, 's' => 1], 'ig' => ['v' => 98, 'r' => 59, 'l' => 9, 'c' => 0, 'g' => 0, 's' => 1, 't' => 7.7, 'vr' => 29.2],
             'yt' => ['v' => 77, 't' => 7, 'l' => 2, 'c' => 0], 'fb' => ['v' => 47, 'l' => 0, 't' => 2]],
            ['f' => '2026-10-15 18:00', 'titulo' => 'Deja de perder llamadas de tus clientes', 'estilo' => 'gancho', 'palabra' => 'CONSULTORÍA', 'dur' => 37,
             'tt' => ['v' => 390, 'l' => 15, 'c' => 0, 's' => 2], 'ig' => ['v' => 42, 'r' => 25, 'l' => 5, 'c' => 0, 'g' => 0, 's' => 0, 't' => 6.9, 'vr' => 26.7],
             'yt' => ['v' => 48, 't' => 13, 'l' => 0, 'c' => 0], 'fb' => ['v' => 19, 'l' => 0, 't' => 1]],
            ['f' => '2026-10-16 18:00', 'titulo' => 'Deja de automatizar todo sin ver este vídeo antes', 'estilo' => 'gancho', 'palabra' => '', 'dur' => 26,
             'tt' => ['v' => 615, 'l' => 15, 'c' => 1, 's' => 15], 'ig' => ['v' => 114, 'r' => 60, 'l' => 8, 'c' => 0, 'g' => 1, 's' => 0, 't' => 8.4, 'vr' => 31.9],
             'yt' => ['v' => 191, 't' => 4, 'l' => 1, 'c' => 0], 'fb' => ['v' => 32, 'l' => 0, 't' => 5]],
            ['f' => '2026-10-18 19:05', 'titulo' => 'Deja de perder clientes con este método', 'estilo' => 'gancho', 'palabra' => '', 'dur' => 22,
             'tt' => ['v' => 989, 'l' => 16, 'c' => 2, 's' => 0], 'ig' => ['v' => 51, 'r' => 29, 'l' => 3, 'c' => 0, 'g' => 1, 's' => 0, 't' => 4.7, 'vr' => 30.3],
             'yt' => ['v' => 38, 't' => 2, 'l' => 0, 'c' => 0], 'fb' => ['v' => 17, 'l' => 0, 't' => 2]],
            ['f' => '2026-10-19 12:00', 'titulo' => 'Haz que tus clientes te encuentren fácil', 'estilo' => 'gancho', 'palabra' => '', 'dur' => 22,
             'tt' => ['v' => 725, 'l' => 8, 'c' => 0, 's' => 0], 'ig' => ['v' => 84, 'r' => 58, 'l' => 8, 'c' => 1, 'g' => 1, 's' => 0, 't' => 6.8, 'vr' => 27.4],
             'yt' => ['v' => 103, 't' => 2, 'l' => 1, 'c' => 0], 'fb' => ['v' => 129, 'l' => 0, 't' => 4]],
            ['f' => '2026-10-19 18:05', 'titulo' => 'Tu equipo no necesita trabajar más horas', 'estilo' => 'sobrio', 'palabra' => 'CONSULTORÍA', 'dur' => 32,
             'tt' => ['v' => 454, 'l' => 17, 'c' => 0, 's' => 4], 'ig' => ['v' => 201, 'r' => 161, 'l' => 7, 'c' => 0, 'g' => 0, 's' => 1, 't' => 4.4, 'vr' => 29.2],
             'yt' => ['v' => 608, 't' => 3, 'l' => 2, 'c' => 0], 'fb' => ['v' => 48, 'l' => 0, 't' => 3]],
            ['f' => '2026-10-20 17:30', 'titulo' => 'Cinco consultorías gratuitas este mes', 'estilo' => 'sobrio', 'palabra' => 'CONSULTORÍA', 'dur' => 37,
             'tt' => ['v' => 679, 'l' => 15, 'c' => 0, 's' => 3], 'ig' => ['v' => 175, 'r' => 121, 'l' => 6, 'c' => 0, 'g' => 0, 's' => 3, 't' => 6.9, 'vr' => 27.7],
             'yt' => ['v' => 60, 't' => 7, 'l' => 1, 'c' => 0], 'fb' => ['v' => 3, 'l' => 0, 't' => 2]],
            ['f' => '2026-10-21 12:00', 'titulo' => 'Sé el número 1 en tu competencia', 'estilo' => 'gancho', 'palabra' => '', 'dur' => 24,
             'tt' => ['v' => 807, 'l' => 12, 'c' => 0, 's' => 0], 'ig' => ['v' => 89, 'r' => 66, 'l' => 9, 'c' => 1, 'g' => 0, 's' => 0, 't' => 4.1, 'vr' => 20.0],
             'yt' => ['v' => 623, 't' => 3, 'l' => 1, 'c' => 0], 'fb' => ['v' => 155, 'l' => 0, 't' => 2]],
            ['f' => '2026-10-22 06:00', 'titulo' => 'Deja de malgastar dinero en nóminas innecesarias', 'estilo' => 'gancho', 'palabra' => '', 'dur' => 26,
             'tt' => ['v' => 478, 'l' => 11, 'c' => 0, 's' => 1], 'ig' => ['v' => 65, 'r' => 51, 'l' => 4, 'c' => 0, 'g' => 0, 's' => 0, 't' => 4.4, 'vr' => 26.5],
             'yt' => ['v' => 25, 't' => 7, 'l' => 1, 'c' => 0], 'fb' => ['v' => 5, 'l' => 0, 't' => 1]],
            ['f' => '2026-10-22 18:30', 'titulo' => 'Tu cliente no compara quién lo hace mejor', 'estilo' => 'sobrio', 'palabra' => 'RESPUESTA', 'dur' => 45,
             'tt' => ['v' => 364, 'l' => 14, 'c' => 0, 's' => 2], 'ig' => ['v' => 65, 'r' => 53, 'l' => 2, 'c' => 0, 'g' => 0, 's' => 1, 't' => 8.0, 'vr' => 27.3],
             'yt' => ['v' => 23, 't' => 2, 'l' => 0, 'c' => 0], 'fb' => null],
            ['f' => '2026-10-23 17:11', 'titulo' => 'Antes de invertir en IA, mira dónde la necesitas', 'estilo' => 'sobrio', 'palabra' => 'CONSULTORÍA', 'dur' => 38,
             'tt' => ['v' => 261, 'l' => 8, 'c' => 0, 's' => 1], 'ig' => ['v' => 84, 'r' => 56, 'l' => 6, 'c' => 0, 'g' => 0, 's' => 0, 't' => 5.1, 'vr' => 24.6],
             'yt' => ['v' => 74, 't' => 3, 'l' => 2, 'c' => 0], 'fb' => ['v' => 20, 'l' => 0, 't' => 2]],
            ['f' => '2026-10-25 19:00', 'titulo' => 'Déjanos ahorrarte dinero con una llamada', 'estilo' => 'gancho', 'palabra' => '', 'dur' => 37,
             'tt' => ['v' => 121, 'l' => 5, 'c' => 0, 's' => 0], 'ig' => ['v' => 50, 'r' => 37, 'l' => 4, 'c' => 0, 'g' => 0, 's' => 0, 't' => 6.3, 'vr' => 18.9],
             'yt' => null, 'fb' => ['v' => 7, 'l' => 0, 't' => 1]],
        ],
        'conclusiones' => [
            ['t' => 'Se van en el segundo dos', 'd' => 'En YouTube se ven 2 a 7 segundos y en Facebook 1 a 5. El mismo plano sentado en la mesa hace que el algoritmo lo dé por visto.'],
            ['t' => 'Casi todos piden algo', 'd' => 'Siete de quince vídeos ofrecen la consultoría. A una cuenta nueva nadie le comenta una palabra clave: 15 comentarios en cuatro redes.'],
            ['t' => 'El mismo tema en bucle', 'd' => 'Unos seis vídeos repiten «pierdes clientes por no contestar». La curva baja cada día.'],
            ['t' => 'Público demasiado estrecho', 'd' => 'Hablar solo a empresas deja al algoritmo sin a quién enseñarlo. 11 seguidores nuevos en dos semanas.'],
            ['t' => 'Lo que sí tira', 'd' => 'Títulos con tensión en TikTok y YouTube («Sé el número 1», «Esclavo de tu negocio») y probar algo de verdad (GEO) en Instagram y Facebook.'],
        ],
    ]];
}

/** Ideas de la tanda siguiente (se enseñan bajo el análisis). */
function redes_ideas(): array
{
    return [
        ['n' => 1, 't' => 'La misma tarea a seis IAs, de peor a mejor', 'h' => 'Le pedí lo mismo a 6 IAs. La número 1 me dejó loco', 'c' => 'Voz en off contando del 6 al 1, grabación de pantalla y calle', 'red' => 'Reel'],
        ['n' => 2, 't' => '¿ChatGPT recomienda el negocio de la calle?', 'h' => '¿ChatGPT recomienda tu bar? Vamos a comprobarlo', 'c' => 'En la calle, móvil en mano y reacción del dueño', 'red' => 'Reel'],
        ['n' => 3, 't' => 'Persona contra Inteligencia Artificial', 'h' => 'Adrián contra un bot. Cronómetro en mano', 'c' => 'Pantalla partida, dos sitios y cronómetro grande', 'red' => 'Reel'],
        ['n' => 4, 't' => 'Tier list de trabajos que ya hace la IA', 'h' => '¿Tu trabajo está en la S o en la D?', 'c' => 'De pie frente a pizarra o tablet, cortes rápidos', 'red' => 'Reel'],
        ['n' => 5, 't' => 'Top 5 trucos gratis de IA que nadie usa', 'h' => 'El número 3 te ahorra una hora al día', 'c' => 'Punto de vista móvil en mano: casa, coche, café', 'red' => 'Reel'],
        ['n' => 6, 't' => '24 horas dejando que la IA decida por mí', 'h' => 'Hoy la IA decide todo lo que hago', 'c' => 'Vlog de un día entero, muchos sitios', 'red' => 'YouTube largo', 'fav' => true],
        ['n' => 7, 't' => '¿Lo hizo una persona o una IA?', 'h' => 'Tienes 3 segundos: ¿persona o IA?', 'c' => 'Preguntando en la calle; al final, nuestro agente de voz', 'red' => 'Reel'],
    ];
}

/** Solicitudes del formulario que llegaron desde redes en las fechas de la tanda (solo recuentos, nada personal). */
function redes_solicitudes(string $desde): array
{
    $db = pebai_db();
    $q = $db->prepare("SELECT fuente, palabra, conocio, canal_dueno FROM leads WHERE tipo <> 'cliente' AND created_at >= ?");
    $q->execute([$desde . ' 00:00:00']);
    $total = 0;
    $redes = 0;
    $por = ['instagram' => 0, 'tiktok' => 0, 'youtube' => 0, 'facebook' => 0, 'otra' => 0];
    $palabras = [];
    foreach ($q->fetchAll(PDO::FETCH_ASSOC) as $l) {
        $total++;
        $f = strtolower((string)$l['fuente']);
        $esRed = ($l['canal_dueno'] ?? '') === 'redes' || preg_match('/instagram|tiktok|youtube|facebook/', $f) || ($l['conocio'] ?? '') === 'redes';
        if (!$esRed || strpos($f, 'linkedin') !== false) {
            continue;
        }
        $redes++;
        $red = 'otra';
        foreach (['instagram', 'tiktok', 'youtube', 'facebook'] as $k) {
            if (strpos($f, $k) !== false || ($k === 'instagram' && $f === 'ig') || ($k === 'tiktok' && $f === 'tt') || ($k === 'youtube' && $f === 'yt') || ($k === 'facebook' && $f === 'fb')) {
                $red = $k;
                break;
            }
        }
        $por[$red]++;
        $p = mb_strtoupper(trim((string)$l['palabra']));
        if ($p !== '') {
            $palabras[$p] = ($palabras[$p] ?? 0) + 1;
        }
    }
    return ['total' => $total, 'redes' => $redes, 'por_red' => $por, 'palabras' => $palabras];
}

if ($auth && isset($_GET['redes'])) {
    $tandas = redes_tandas();
    foreach ($tandas as &$t) {
        try {
            $t['solicitudes'] = redes_solicitudes($t['desde']);
        } catch (Throwable $e) {
            pebai_log('REDES solicitudes: ' . $e->getMessage());
            $t['solicitudes'] = null;
        }
    }
    unset($t);
    json_out(['ok' => true, 'tandas' => $tandas, 'ideas' => redes_ideas()]);
}
