<?php
/*
 * PEBAI · Análisis de la web de quien envía el formulario de diagnóstico (pedido por Daniel el 29/10/2026).
 * Usa el agente Demos: página privada /para/<slug>/ con la radiografía en IA, la demo de su asistente y el boceto de su app.
 * El equipo decide la plaza gratis con: este análisis + lo que les quita tiempo + presupuesto + si decide.
 * Comparte el tope diario con «Analizar mi empresa» (api/analizar.php): 40 análisis nuevos al día entre los dos.
 */
require_once __DIR__ . '/_demos_lib.php';

const PEBAI_ANALISIS_DIA = 40;

/** Normaliza lo que escriben («tuempresa.es», «www.…», «http://…») a https://host/. Devuelve '' si no es una web. */
function pebai_web_normal(string $web): string
{
    $web = trim($web);
    if ($web === '') {
        return '';
    }
    if (!preg_match('~^https?://~i', $web)) {
        $web = 'https://' . ltrim($web, '/');
    }
    $host = strtolower(preg_replace('~^www\.~i', '', (string)parse_url($web, PHP_URL_HOST)));
    if (!$host || !str_contains($host, '.') || filter_var($host, FILTER_VALIDATE_IP) || strlen($host) > 120 || !preg_match('~^[a-z0-9.-]+$~', $host)) {
        return '';
    }
    return 'https://' . $host . '/';
}

/**
 * Análisis para una solicitud. Si esa web ya tiene demo se reutiliza (sin gastar).
 * Devuelve ['url' => …, 'estado' => 'lista'|'reutilizada'] o ['estado' => 'sin_hacer', 'motivo' => …].
 */
function pebai_analisis_lead(int $leadId, string $web, string $empresa): array
{
    $web = pebai_web_normal($web);
    if ($web === '') {
        return ['estado' => 'sin_hacer', 'motivo' => 'La web no es válida.'];
    }
    $host = (string)parse_url($web, PHP_URL_HOST);
    $db = pebai_demos_db();

    $q = $db->prepare('SELECT slug FROM demos WHERE web LIKE ? OR web LIKE ? ORDER BY creada DESC LIMIT 1');
    $q->execute(['%://' . $host . '%', '%://www.' . $host . '%']);
    $ya = $q->fetchColumn();
    $q->closeCursor();
    if ($ya) {
        return ['estado' => 'reutilizada', 'url' => pebai_demo_url((string)$ya)];
    }

    $q = $db->prepare("SELECT COUNT(*) FROM demos WHERE canal IN ('web', 'lead') AND creada > ?");
    $q->execute([date('Y-m-d H:i:s', time() - 86400)]);
    if ((int)$q->fetchColumn() >= PEBAI_ANALISIS_DIA) {
        return ['estado' => 'sin_hacer', 'motivo' => 'Tope de ' . PEBAI_ANALISIS_DIA . ' análisis al día alcanzado.'];
    }

    $w = pebai_web_texto($web);
    if (!$w) {
        return ['estado' => 'sin_hacer', 'motivo' => 'Su web no carga o no tiene texto.'];
    }
    $quien = pebai_claude_json('demos', 'claude-haiku-5-5', 'Lees la web de una empresa y dices quién es, sin inventar. Responde SOLO JSON.',
        "WEB ({$web}):\n" . mb_substr($w['texto'], 0, 4000) . "\n\nJSON: " . '{"empresa": "nombre comercial corto", "sector": "su sector en plural, p. ej. «clínicas dentales»", "ciudad": "ciudad principal donde trabajan o vacío"}',
        ['effort' => 'low', 'max_tokens' => 600]);
    $d = pebai_demo_crear('lead', ['id' => $leadId, 'web' => $web, 'empresa' => trim((string)($quien['empresa'] ?? '')) ?: $empresa,
                                   'ciudad' => (string)($quien['ciudad'] ?? ''), 'nicho' => '', 'sector' => (string)($quien['sector'] ?? '')]);
    if (!$d) {
        return ['estado' => 'sin_hacer', 'motivo' => 'Su web no tiene datos suficientes.'];
    }
    return ['estado' => 'lista', 'url' => pebai_demo_url($d['slug'])];
}
