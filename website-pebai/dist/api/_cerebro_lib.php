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
