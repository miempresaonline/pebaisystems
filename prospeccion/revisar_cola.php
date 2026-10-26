<?php
/*
 * PEBAI · Revisión tranquila de la cola de Prospectos (orden de Daniel, 26/10): cuando España ya está recorrida, el scraper
 * no busca más y repasa lo que ya hay. En cada pasada, unas pocas empresas pendientes (WhatsApp y email, todos los nichos):
 *   1. Duplicadas: misma web o mismo móvil que otra empresa que ya está en la cola o ya escrita → se queda la primera.
 *   2. Ya escritas por el otro canal: si a su web ya se le mandó un email, no se le escribe también por WhatsApp.
 *   3. Web caída: si no responde (o da error, o es una página de dominio en venta) dos veces en días distintos.
 * Las que fallan no se borran: pasan a 'descartado' con el motivo '[revision] …'. Cada empresa se repasa como mucho una vez
 * por semana. Lo apunta todo en agente_actividad (agente 'prospeccion') para que se vea en Agentes.
 *
 *   php revisar_cola.php [n]   → repasa n empresas (por defecto 40). Lo lanza correr.sh cuando todas las series están paradas.
 *   php revisar_cola.php n --prueba → dice qué haría, sin cambiar nada.
 */
if (PHP_SAPI !== 'cli') {
    exit(1);
}
$api = getenv('HOME') . '/domains/pebaisystems.es/public_html/api';
require $api . '/_agentes_lib.php';
require_once $api . '/_email_lib.php';

$n = max(1, min(200, (int)($argv[1] ?? 40)));
$prueba = in_array('--prueba', $argv, true);
$db = pebai_agentes_db();
$db->exec('CREATE TABLE IF NOT EXISTS revision_cola (
    clave TEXT PRIMARY KEY,
    revisado_at TEXT NOT NULL DEFAULT "",
    fallos_web INTEGER NOT NULL DEFAULT 0,
    fallo_dia TEXT NOT NULL DEFAULT "",
    nota TEXT NOT NULL DEFAULT ""
)');
$ahora = date('Y-m-d H:i:s');
$hoy = date('Y-m-d');
$semana = date('Y-m-d H:i:s', time() - 7 * 86400);

$dominio = static fn(string $w): string => strtolower(preg_replace(['#^https?://#i', '#^www\.#i', '#[/?\#].*$#'], '', trim($w)));
$movil = static fn(string $t): string => substr(preg_replace('/\D+/', '', $t), -9);
// Webs genéricas que comparten muchas empresas (no son duplicados)
$genericas = '/(^|\.)(facebook|instagram|google|goo\.gl|linktr\.ee|wa\.me|business\.site|wixsite|blogspot|wordpress\.com|paginasamarillas|yelp|tripadvisor)\./i';

// Lo que ya existe, para buscar duplicados: primera aparición de cada web y móvil (empresas no descartadas)
$visto = ['web' => [], 'tel' => []];
$escritoEmail = [];
foreach ($db->query("SELECT id, web, telefono, estado FROM prospectos WHERE estado <> 'descartado' ORDER BY id") as $r) {
    $d = $dominio((string)$r['web']);
    if ($d !== '' && !preg_match($genericas, $d)) {
        $visto['web'][$d] ??= 'wa' . $r['id'];
    }
    $t = $movil((string)$r['telefono']);
    if (strlen($t) === 9) {
        $visto['tel'][$t] ??= 'wa' . $r['id'];
    }
}
foreach ($db->query("SELECT id, dominio, web, telefono, enviado1_at FROM email_prospectos WHERE estado <> 'descartado' ORDER BY id") as $r) {
    $d = (string)$r['dominio'] !== '' ? strtolower((string)$r['dominio']) : $dominio((string)$r['web']);
    if ($d !== '' && !preg_match($genericas, $d)) {
        $visto['web'][$d] ??= 'em' . $r['id'];
        if ($r['enviado1_at'] !== '') {
            $escritoEmail[$d] = true;
        }
    }
    $t = $movil((string)$r['telefono']);
    if (strlen($t) === 9) {
        $visto['tel'][$t] ??= 'em' . $r['id'];
    }
}

// Las que tocan: pendientes que no se han repasado en la última semana (primero las que nunca)
$cola = [];
foreach (['wa' => 'prospectos', 'em' => 'email_prospectos'] as $c => $tabla) {
    foreach ($db->query("SELECT '$c' c, p.id, p.empresa, p.web, p.telefono, COALESCE(r.revisado_at, '') rev FROM $tabla p
                         LEFT JOIN revision_cola r ON r.clave = '$c' || p.id WHERE p.estado = 'pendiente'") as $r) {
        if ($r['rev'] < $semana) {
            $cola[] = $r;
        }
    }
}
usort($cola, static fn($a, $b) => strcmp($a['rev'], $b['rev']) ?: ($a['id'] <=> $b['id']));
$cola = array_slice($cola, 0, $n);
if (!$cola) {
    pebai_actividad('prospeccion', 'espera', 'Revisión: toda la cola está repasada esta semana', 'Vuelve a repasar cada empresa a los 7 días.', 'revision');
    exit(0);
}

/** Web viva: responde con una página de verdad (no error, no dominio aparcado). Devuelve '' si está bien o el motivo si no. */
function revision_web(string $url): string
{
    $url = preg_match('#^https?://#i', $url) ? $url : 'https://' . $url;
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => true, CURLOPT_MAXREDIRS => 5, CURLOPT_TIMEOUT => 20,
                            CURLOPT_CONNECTTIMEOUT => 10, CURLOPT_SSL_VERIFYPEER => false, CURLOPT_SSL_VERIFYHOST => 0, CURLOPT_ENCODING => '',
                            CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
                            CURLOPT_HTTPHEADER => ['Accept-Language: es-ES,es;q=0.9'], CURLOPT_RANGE => '0-200000']);
    $html = (string)curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_errno($ch);
    curl_close($ch);
    if ($err && $html === '') {
        return in_array($err, [CURLE_COULDNT_RESOLVE_HOST], true) ? 'el dominio ya no existe' : 'la web no responde';
    }
    // 401/403/429: la web está, pero no deja pasar a robots; no es motivo para descartar
    if ($code >= 400 && !in_array($code, [401, 403, 405, 429], true)) {
        return 'la web da error ' . $code;
    }
    if (preg_match('/dominio (está )?en venta|domain (is )?for sale|this domain (may be|is) for sale|buy this domain|parked (free|domain)|sedoparking|dan\.com|domain has expired|dominio (ha )?caducado/i', $html)) {
        return 'el dominio está en venta o caducado';
    }
    return '';
}

$fuera = ['duplicada' => 0, 'ya escrita por email' => 0, 'web caída' => 0];
$avisos = 0;
$marca = $db->prepare('INSERT INTO revision_cola (clave, revisado_at, fallos_web, fallo_dia, nota) VALUES (?, ?, ?, ?, ?)
                       ON CONFLICT(clave) DO UPDATE SET revisado_at = excluded.revisado_at, fallos_web = excluded.fallos_web, fallo_dia = excluded.fallo_dia, nota = excluded.nota');
foreach ($cola as $p) {
    $clave = $p['c'] . $p['id'];
    $tabla = $p['c'] === 'wa' ? 'prospectos' : 'email_prospectos';
    $q = $db->prepare('SELECT fallos_web, fallo_dia FROM revision_cola WHERE clave = ?');
    $q->execute([$clave]);
    $prev = $q->fetch() ?: ['fallos_web' => 0, 'fallo_dia' => ''];
    $d = $dominio((string)$p['web']);
    $t = $movil((string)$p['telefono']);
    $motivo = '';
    $tipo = '';
    if ($d !== '' && !preg_match($genericas, $d) && ($visto['web'][$d] ?? $clave) !== $clave) {
        [$motivo, $tipo] = ['duplicada: misma web que ' . $visto['web'][$d], 'duplicada'];
    } elseif (strlen($t) === 9 && ($visto['tel'][$t] ?? $clave) !== $clave) {
        [$motivo, $tipo] = ['duplicada: mismo móvil que ' . $visto['tel'][$t], 'duplicada'];
    } elseif ($p['c'] === 'wa' && $d !== '' && isset($escritoEmail[$d])) {
        [$motivo, $tipo] = ['ya se le escribió por email', 'ya escrita por email'];
    }
    $fallos = (int)$prev['fallos_web'];
    $dia = (string)$prev['fallo_dia'];
    $nota = 'bien';
    if (!$motivo && $d !== '' && !preg_match($genericas, $d)) {
        $mal = revision_web((string)$p['web']);
        if ($mal === '') {
            $fallos = 0;
            $dia = '';
        } elseif ($dia !== $hoy) {
            // Un fallo puede ser pasajero: solo se descarta al fallar otra vez otro día
            $fallos++;
            $dia = $hoy;
            $nota = $mal;
            if ($fallos >= 2) {
                [$motivo, $tipo] = [$mal . ' (comprobado ' . $fallos . ' días)', 'web caída'];
            } else {
                $avisos++;
            }
        }
        usleep(400000);
    }
    if ($prueba) {
        echo $clave, ' · ', $p['empresa'], ' · ', $d ?: '(sin web)', ' → ', $motivo ?: $nota, "
";
        continue;
    }
    if ($motivo) {
        $db->prepare("UPDATE $tabla SET estado = 'descartado', error = ?, updated_at = ? WHERE id = ? AND estado = 'pendiente'")
           ->execute(['[revision] ' . $motivo, $ahora, $p['id']]);
        $fuera[$tipo]++;
        $nota = $motivo;
    }
    $marca->execute([$clave, $ahora, $fallos, $dia, $nota]);
}

if ($prueba) {
    exit(0);
}
$total = array_sum($fuera);
$detalle = implode(', ', array_map(static fn($k, $v) => "$v $k", array_keys(array_filter($fuera)), array_filter($fuera)));
$q = $db->query("SELECT (SELECT COUNT(*) FROM prospectos WHERE estado = 'pendiente') + (SELECT COUNT(*) FROM email_prospectos WHERE estado = 'pendiente')");
$pend = (int)$q->fetchColumn();
$q = $db->prepare('SELECT COUNT(*) FROM revision_cola WHERE revisado_at >= ?');
$q->execute([$semana]);
pebai_actividad('prospeccion', 'hito', 'Revisión: ' . count($cola) . ' empresas repasadas' . ($total ? ', ' . $total . ' descartadas (' . $detalle . ')' : ', todas bien')
    . ($avisos ? ' · ' . $avisos . ' con la web caída hoy (se vuelve a mirar otro día)' : ''),
    'Repasadas esta semana: ' . (int)$q->fetchColumn() . ' · quedan en cola: ' . $pend . '. Las descartadas siguen en Prospectos con el motivo [revision].', 'revision');
