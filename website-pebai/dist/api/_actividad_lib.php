<?php
/*
 * PEBAI · Registro de actividad de los agentes automáticos (como las "ejecuciones" de n8n).
 *
 * Regla para TODOS los agentes (email, WhatsApp, carruseles…): cada decisión que tome un bot queda apuntada aquí,
 * con fecha, qué hizo y por qué. Daniel tiene que poder ver en el panel (Automático › Agentes) qué hizo cada agente,
 * cada día, sin abrir el servidor. Tipos de apunte:
 *   envio      → mandó un mensaje (a quién, qué)
 *   bloqueo    → NO mandó a alguien y por qué (revisión previa)
 *   respuesta  → llegó una respuesta y qué se hizo con ella
 *   espera     → por qué no está enviando ahora (fuera de horario, cupo completo…); solo cuando cambia el motivo
 *   freno      → se paró solo por seguridad
 *   error      → algo falló
 *   cambio     → alguien cambió algo desde el panel (pausa, ajustes, fichas, importación)
 *   hito       → subió de escalón, se conectó, etc.
 * Solo se guardan datos mínimos (empresa y email/teléfono del prospecto), nunca contraseñas.
 */
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}
require_once __DIR__ . '/_pebai_lib.php';

const PEBAI_ACTIVIDAD_TIPOS = ['envio', 'bloqueo', 'respuesta', 'espera', 'freno', 'error', 'cambio', 'hito'];

function pebai_actividad_db(): PDO
{
    static $ready = false;
    $db = pebai_db();
    if (!$ready) {
        $db->exec('CREATE TABLE IF NOT EXISTS agente_actividad (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ts TEXT NOT NULL,
            agente TEXT NOT NULL,
            tipo TEXT NOT NULL,
            resumen TEXT NOT NULL,
            detalle TEXT NOT NULL DEFAULT "",
            ref TEXT NOT NULL DEFAULT ""
        )');
        $db->exec('CREATE INDEX IF NOT EXISTS idx_actividad ON agente_actividad(agente, id)');
        $ready = true;
    }
    return $db;
}

/**
 * Apunta una acción de un agente. $ref = identificador del prospecto u objeto (p. ej. "email:12").
 * Nunca lanza excepciones: registrar no puede romper el trabajo del agente.
 */
function pebai_actividad(string $agente, string $tipo, string $resumen, string $detalle = '', string $ref = ''): void
{
    try {
        pebai_actividad_db()->prepare('INSERT INTO agente_actividad (ts, agente, tipo, resumen, detalle, ref) VALUES (?, ?, ?, ?, ?, ?)')
            ->execute([date('Y-m-d H:i:s'), $agente, in_array($tipo, PEBAI_ACTIVIDAD_TIPOS, true) ? $tipo : 'hito', mb_substr($resumen, 0, 300), mb_substr($detalle, 0, 4000), mb_substr($ref, 0, 60)]);
    } catch (Throwable $e) {
        pebai_log('ACTIVIDAD: ' . $e->getMessage());
    }
}

/** Apunta un "espera" solo si el motivo es distinto del último, para no llenar el registro cada 5 minutos. */
function pebai_actividad_espera(string $agente, string $motivo): void
{
    $q = pebai_actividad_db()->prepare("SELECT resumen FROM agente_actividad WHERE agente = ? AND tipo IN ('espera','envio') ORDER BY id DESC LIMIT 1");
    $q->execute([$agente]);
    if ((string)$q->fetchColumn() !== $motivo) {
        pebai_actividad($agente, 'espera', $motivo);
    }
}

/** Apunta un error o aviso repetitivo como mucho una vez cada 6 h (p. ej. "no conecta el buzón"). */
function pebai_actividad_unica(string $agente, string $tipo, string $resumen, string $detalle = ''): void
{
    $q = pebai_actividad_db()->prepare('SELECT COUNT(*) FROM agente_actividad WHERE agente = ? AND tipo = ? AND resumen = ? AND ts >= ?');
    $q->execute([$agente, $tipo, mb_substr($resumen, 0, 300), date('Y-m-d H:i:s', time() - 6 * 3600)]);
    if (!(int)$q->fetchColumn()) {
        pebai_actividad($agente, $tipo, $resumen, $detalle);
    }
}

/** Últimos apuntes de un agente (para el panel). */
function pebai_actividad_ultimas(string $agente, int $n = 200): array
{
    $q = pebai_actividad_db()->prepare('SELECT id, ts, tipo, resumen, detalle, ref FROM agente_actividad WHERE agente = ? ORDER BY id DESC LIMIT ' . max(1, min(1000, $n)));
    $q->execute([$agente]);
    return $q->fetchAll();
}

/** Recuento por día y tipo de los últimos N días (para la gráfica de volumen). */
function pebai_actividad_por_dia(string $agente, int $dias = 30): array
{
    $q = pebai_actividad_db()->prepare('SELECT substr(ts, 1, 10) d, tipo, COUNT(*) n FROM agente_actividad WHERE agente = ? AND ts >= ? GROUP BY d, tipo');
    $q->execute([$agente, date('Y-m-d', strtotime('-' . ($dias - 1) . ' days'))]);
    return $q->fetchAll();
}

/** Borra apuntes de más de 12 meses (lo llama el cron de cada agente de vez en cuando). */
function pebai_actividad_limpiar(): void
{
    if (random_int(1, 200) === 1) {
        pebai_actividad_db()->prepare('DELETE FROM agente_actividad WHERE ts < ?')->execute([date('Y-m-d', strtotime('-12 months'))]);
    }
}
