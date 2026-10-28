<?php
/*
 * PEBAI · Página privada de demo de una empresa: pebaisystems.es/para/<slug>/ (regla en .htaccess).
 * Todo sale de private/demos.sqlite (ver _demos_lib.php): su web, una búsqueda real en IA y el boceto de su app.
 * noindex; la primera visita avisa a la oficina («X ha abierto su demo»).
 */
require_once __DIR__ . '/_demos_lib.php';

header('X-Robots-Tag: noindex, nofollow');
$slug = preg_replace('/[^a-z0-9-]/', '', (string)($_GET['s'] ?? ''));
$q = pebai_demos_db()->prepare('SELECT * FROM demos WHERE slug = ?');
$q->execute([$slug]);
$d = $q->fetch();
if (!$d) {
    http_response_code(404);
    header('Location: /');
    exit;
}
$x = json_decode((string)$d['datos'], true) ?: [];
$kb = $x['kb'] ?? [];
$radio = $x['radio'] ?? null;
$app = $x['app'] ?? null;
$color = preg_match('/^#[0-9a-f]{6}$/', (string)($x['color'] ?? '')) ? $x['color'] : '#6a5cff';
$e = static fn($s) => htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');
$empresa = (string)$d['empresa'];
$ciudad = (string)$d['ciudad'];
$inicial = mb_strtoupper(mb_substr(preg_replace('/^(la|el|los|las)\s+/iu', '', $empresa), 0, 1));
$inicial = (string)($x['logo_texto'] ?? '') !== '' ? (string)$x['logo_texto'] : $inicial;   // su monograma de verdad si su logo es texto
$meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
$fecha = static fn($ts) => (int)date('j', strtotime($ts)) . ' de ' . $meses[(int)date('n', strtotime($ts)) - 1] . ' de ' . date('Y', strtotime($ts));

// Visitas: la primera avisa a la oficina (es la mejor señal de interés)
$esBot = preg_match('/bot|crawl|spider|preview|whatsapp|facebookexternalhit|telegram|slack|discord|mshots|wordpress|headless/i', (string)($_SERVER['HTTP_USER_AGENT'] ?? ''));
// ?equipo=1: la miramos nosotros (desde el panel): no cuenta como visita ni avisa
if (!$esBot && empty($_GET['equipo'])) {
    $now = date('Y-m-d H:i:s');
    pebai_demos_db()->prepare("UPDATE demos SET visitas = visitas + 1, ultima_visita = ?, primera_visita = CASE WHEN primera_visita = '' THEN ? ELSE primera_visita END WHERE slug = ?")
        ->execute([$now, $now, $slug]);
    if ((string)$d['primera_visita'] === '') {
        pebai_actividad('demos', 'hito', 'Aviso a WhatsApp: ' . $empresa . ' ha abierto su demo', '', 'demo');
    }
}
$radio = $radio ?: null;
$busq = $radio['busquedas'] ?? ($radio ? [['consulta' => $radio['consulta'], 'empresas' => $radio['empresas'], 'posicion' => $radio['posicion'], 'fuentes' => $radio['fuentes']]] : []);
$nota = (int)($radio['nota'] ?? ($radio && $radio['aparece'] ? 50 : 0));
$comp = $radio['competidores'] ?? array_map(static fn($e) => ['nombre' => $e['nombre'], 'n' => 1, 'mejor' => 1], $radio['empresas'] ?? []);
$salen = count(array_filter(array_column($busq, 'posicion')));
$logo = (string)($x['logo'] ?? '');
$wa = 'https://wa.me/34624842799?text=' . rawurlencode('Hola Daniel, he visto la demo que preparaste para ' . $empresa . '. ¿Lo hablamos?');
$avatarEmpresa = $logo !== '' ? '<img src="' . $e($logo) . '" alt="">' : $e($inicial);
?><!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<meta name="theme-color" content="#05060b">
<title><?= $e($empresa) ?> · Preparado por PEBAI Systems</title>
<link rel="icon" href="/brand/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
<style>
:root{--ink:#05060b;--fg:#F2F0EA;--mut:#A3A5B8;--mut2:#6F7189;--line:rgba(255,255,255,.09);--line2:rgba(255,255,255,.16);
  --lime:#B7FF3C;--violet:#7E73FF;--red:#FF5E6C;--marca:<?= $e($color) ?>;--serif:'Instrument Serif',Georgia,serif;--sans:'Manrope',system-ui,sans-serif;--mono:'JetBrains Mono',ui-monospace,monospace;
  --ease:cubic-bezier(.16,1,.3,1);--glass:rgba(255,255,255,.045);--glass2:rgba(255,255,255,.07);--blur:saturate(160%) blur(22px)}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:var(--ink);color:var(--fg);font:500 16px/1.6 var(--sans);-webkit-font-smoothing:antialiased;overflow-x:hidden}
/* fondo neofuturista: auroras con el color de la empresa, rejilla en perspectiva y grano */
.fondo{position:fixed;inset:0;z-index:-1;overflow:hidden;pointer-events:none}
.fondo i{position:absolute;border-radius:50%;filter:blur(90px);opacity:.55;animation:flota 22s ease-in-out infinite alternate}
.fondo i:nth-child(1){width:620px;height:620px;left:-160px;top:-180px;background:color-mix(in srgb,var(--marca) 70%,transparent)}
.fondo i:nth-child(2){width:560px;height:560px;right:-200px;top:20%;background:rgba(126,115,255,.55);animation-duration:28s}
.fondo i:nth-child(3){width:520px;height:520px;left:30%;bottom:-260px;background:rgba(183,255,60,.22);animation-duration:34s}
@keyframes flota{to{transform:translate(60px,40px) scale(1.12)}}
.fondo::before{content:'';position:absolute;left:-50%;right:-50%;bottom:-10%;height:70%;background-image:linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px);background-size:64px 64px;transform:perspective(600px) rotateX(62deg);transform-origin:bottom;mask-image:linear-gradient(to top,#000 10%,transparent 75%)}
.fondo::after{content:'';position:absolute;inset:0;opacity:.07;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E")}
a{color:inherit}
.w{max-width:1140px;margin:0 auto;padding:0 22px}
/* cristal */
.vidrio{position:relative;background:linear-gradient(160deg,var(--glass2),var(--glass) 60%);backdrop-filter:var(--blur);-webkit-backdrop-filter:var(--blur);border-radius:26px;box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 30px 80px rgba(0,0,0,.35)}
.vidrio::before{content:'';position:absolute;inset:0;border-radius:inherit;padding:1px;background:linear-gradient(140deg,rgba(255,255,255,.28),rgba(255,255,255,.04) 40%,color-mix(in srgb,var(--marca) 45%,transparent));-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}
/* cabecera flotante: los dos logos */
.top{position:sticky;top:14px;z-index:20;margin-top:14px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px 10px 14px;border-radius:999px}
.duo{display:flex;align-items:center;gap:10px;font-weight:800;font-size:13.5px;letter-spacing:.02em}
.tile{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:rgba(255,255,255,.08);box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 6px 18px rgba(0,0,0,.3);overflow:hidden;flex:none}
.tile img{width:26px;height:26px;object-fit:contain}
.tile.emp{background:#fff}
.tile.emp img{width:30px;height:30px}
.tile.emp b{color:var(--marca);font-size:17px}
.duo .x{color:var(--mut2);font-weight:600}
.duo span.n{max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.top .cta{display:inline-flex;align-items:center;gap:8px;padding:9px 16px;border-radius:999px;background:var(--lime);color:#0b0f14;font-weight:800;font-size:13px;text-decoration:none;box-shadow:0 8px 24px rgba(183,255,60,.25)}
/* portada */
.hero{padding:80px 0 30px;text-align:center}
.etq{display:inline-flex;align-items:center;gap:8px;padding:7px 14px;border-radius:999px;font:500 12px var(--mono);color:var(--mut);letter-spacing:.04em}
.etq i{width:7px;height:7px;border-radius:50%;background:var(--lime);box-shadow:0 0 12px var(--lime);animation:late 1.6s infinite}
@keyframes late{50%{opacity:.35}}
h1{font:400 clamp(44px,7vw,92px)/.98 var(--serif);letter-spacing:-.015em;margin:26px auto 22px;max-width:980px}
h1 em{font-style:italic;background:linear-gradient(100deg,color-mix(in srgb,var(--marca) 70%,#fff),#fff 60%);-webkit-background-clip:text;background-clip:text;color:transparent}
.lead{font-size:19px;color:#C9CBDA;max-width:640px;margin:0 auto}
.indice{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:46px;text-align:left}
.indice a{display:block;padding:20px;border-radius:22px;text-decoration:none;transition:transform .5s var(--ease)}
.indice a:hover{transform:translateY(-4px)}
.indice small{font:500 11.5px var(--mono);color:var(--mut2)}
.indice b{display:block;font:400 25px/1.15 var(--serif);margin:8px 0 4px}
.indice span{font-size:13.5px;color:var(--mut)}
/* secciones */
section.s{padding:96px 0 10px}
.s-h{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-bottom:26px}
.s-h small{font:500 12px var(--mono);letter-spacing:.08em;color:color-mix(in srgb,var(--marca) 55%,#fff)}
.s-h h2{font:400 clamp(32px,4.4vw,54px)/1.04 var(--serif);margin:8px 0 0;max-width:740px}
.s-h p{max-width:420px;color:var(--mut);margin:0;font-size:15px}
/* informe de visibilidad */
.inf{display:grid;grid-template-columns:330px 1fr;gap:18px}
.inf .caja{padding:26px}
.nota{display:flex;flex-direction:column;align-items:center;text-align:center;gap:4px}
.nota svg{width:220px;height:220px}
.nota .pista{fill:none;stroke:rgba(255,255,255,.08);stroke-width:14}
.nota .val{fill:none;stroke-width:14;stroke-linecap:round;stroke-dasharray:0 600;transition:stroke-dasharray 1.8s var(--ease);filter:drop-shadow(0 0 10px currentColor)}
.nota .num{font:400 64px var(--serif);fill:var(--fg)}
.nota .de{font:500 12px var(--mono);fill:var(--mut)}
.nota b{font:400 24px/1.2 var(--serif)}
.nota p{margin:2px 0 0;color:var(--mut);font-size:14px}
.kpis{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px;width:100%}
.kpis div{padding:12px;border-radius:16px;background:rgba(255,255,255,.04);border:1px solid var(--line)}
.kpis b{display:block;font:400 28px var(--serif);line-height:1}
.kpis span{font-size:11.5px;color:var(--mut)}
.bus{display:flex;flex-direction:column;gap:14px}
.consulta{padding:18px 20px}
.consulta .q{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:12px}
.consulta .q span{font:500 13px var(--mono);color:#DADCE8}
.consulta .q span::before{content:'› ';color:var(--marca)}
.est{font:800 11.5px var(--sans);padding:4px 10px;border-radius:999px}
.est.no{background:rgba(255,94,108,.14);color:#FF9AA4}
.est.si{background:rgba(183,255,60,.14);color:var(--lime)}
.rank{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:7px}
.rank li{display:grid;grid-template-columns:26px 1fr;align-items:center;gap:10px;font-size:14px}
.rank .n{width:26px;height:26px;border-radius:8px;display:grid;place-items:center;background:rgba(255,255,255,.06);font:500 11.5px var(--mono);color:var(--mut)}
.rank .b{position:relative;padding:7px 12px;border-radius:10px;overflow:hidden;background:rgba(255,255,255,.025)}
.rank .b::before{content:'';position:absolute;inset:0;width:var(--w);background:linear-gradient(90deg,rgba(126,115,255,.26),rgba(126,115,255,.03));transform-origin:left;transform:scaleX(0);transition:transform 1.3s var(--ease) var(--d)}
.ver .rank .b::before{transform:scaleX(1)}
.rank .b span{position:relative}
.rank .b em{position:relative;float:right;font:500 10.5px var(--mono);font-style:normal;color:var(--mut2)}
.rank li.yo .n{background:var(--lime);color:#0b0f14}.rank li.yo .b{outline:1.5px solid var(--lime)}
.rank li.yo .b::before{background:linear-gradient(90deg,rgba(183,255,60,.32),rgba(183,255,60,.04))}
.rank li.falta .n{background:rgba(255,94,108,.15);color:var(--red)}
.rank li.falta .b{border:1.5px dashed rgba(255,94,108,.5);background:rgba(255,94,108,.05);color:#FFB3BA}
.fuentes{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}
.fuentes a{font:500 11px var(--mono);color:var(--mut);text-decoration:none;border:1px solid var(--line);border-radius:999px;padding:4px 10px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.fuentes a:hover{color:var(--fg)}
.comp{margin-top:18px;padding:22px 24px}
.comp h3{margin:0 0 4px;font:400 24px var(--serif)}
.comp p.sub{margin:0 0 16px;color:var(--mut);font-size:14px}
.barras{display:flex;flex-direction:column;gap:10px}
.barra{display:grid;grid-template-columns:minmax(120px,240px) 1fr 74px;align-items:center;gap:14px;font-size:14px}
.barra .t{height:10px;border-radius:6px;background:rgba(255,255,255,.06);overflow:hidden}
.barra .t u{display:block;height:100%;border-radius:6px;background:linear-gradient(90deg,var(--violet),#3FD5FF);width:0;transition:width 1.4s var(--ease) var(--d)}
.ver .barra .t u{width:var(--w)}
.barra.yo .t u{background:linear-gradient(90deg,var(--red),#FF9AA4)}
.barra em{font:500 11.5px var(--mono);font-style:normal;color:var(--mut);text-align:right}
.metodo{font:500 11.5px var(--mono);color:var(--mut2);margin:16px 2px 0;line-height:1.7}
.claves{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:18px}
.claves div{padding:18px 20px;border-radius:20px}
.claves b{display:block;font:400 22px var(--serif);margin-bottom:4px}
.claves span{font-size:13.5px;color:var(--mut)}
/* asistente */
.demo{display:grid;grid-template-columns:1fr 390px;gap:40px;align-items:center}
.lista{list-style:none;padding:0;margin:18px 0 0;display:flex;flex-direction:column;gap:12px}
.lista li{display:flex;gap:12px;align-items:flex-start;font-size:15.5px;color:#D7D8E2}
.lista li i{flex:none;width:26px;height:26px;border-radius:9px;background:color-mix(in srgb,var(--marca) 30%,rgba(255,255,255,.05));display:grid;place-items:center;font:500 12px var(--mono);font-style:normal;color:#fff}
.sabe{margin-top:22px;padding:16px 18px;border-radius:18px}
.sabe small{font:500 11px var(--mono);color:var(--mut2)}
.sabe p{margin:6px 0 0;font-size:14px;color:var(--mut)}
.movil{width:100%;max-width:390px;justify-self:center;border-radius:46px;padding:11px;background:linear-gradient(160deg,#2a2c3e,#0d0e18);box-shadow:inset 0 1px 0 rgba(255,255,255,.2),0 50px 120px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.06)}
.pant{border-radius:36px;overflow:hidden;background:#0b141a;display:flex;flex-direction:column;height:620px}
.cab{display:flex;align-items:center;gap:10px;padding:18px 16px 12px;background:#1f2c34}
.ava{width:40px;height:40px;border-radius:50%;background:#fff;display:grid;place-items:center;font-weight:800;color:var(--marca);font-size:16px;flex:none;overflow:hidden}
.ava img{width:32px;height:32px;object-fit:contain}
.cab b{display:block;font-size:15px;line-height:1.2}
.cab span{font-size:12px;color:#8fd19e;transition:color .2s}
.msgs{flex:1;overflow-y:auto;padding:14px 12px;display:flex;flex-direction:column;gap:6px;background:#0b141a radial-gradient(rgba(255,255,255,.035) 1px,transparent 1px) 0 0/16px 16px}
.m{max-width:84%;padding:7px 10px 5px;border-radius:12px;font-size:14px;line-height:1.45;white-space:pre-line;animation:entra .3s var(--ease)}
.m.ellos{align-self:flex-start;background:#1f2c34;border-top-left-radius:3px}
.m.yo{align-self:flex-end;background:#005c4b;border-top-right-radius:3px}
.m small{display:flex;justify-content:flex-end;align-items:center;gap:3px;font-size:10.5px;color:rgba(255,255,255,.5);margin-top:1px}
.tick{width:16px;height:11px;color:rgba(255,255,255,.55);transition:color .3s}
.tick.visto{color:#53bdeb}
.escribe{align-self:flex-start;background:#1f2c34;border-radius:12px;padding:10px 12px;display:flex;gap:4px;animation:entra .2s}
.escribe i{width:7px;height:7px;border-radius:50%;background:#8696a0;animation:pt 1s infinite}
.escribe i:nth-child(2){animation-delay:.15s}.escribe i:nth-child(3){animation-delay:.3s}
@keyframes pt{50%{opacity:.3;transform:translateY(-3px)}}
@keyframes entra{from{opacity:0;transform:translateY(6px)}}
.sug{display:flex;gap:6px;overflow-x:auto;padding:8px 10px 0;background:#0b141a;scrollbar-width:none}
.sug button{flex:none;border:1px solid rgba(255,255,255,.12);background:#1f2c34;color:#e9edef;border-radius:999px;padding:6px 11px;font:600 12.5px var(--sans);cursor:pointer}
.caja-in{display:flex;gap:8px;padding:10px;background:#0b141a}
.caja-in input{flex:1;border:0;outline:0;border-radius:999px;padding:11px 15px;background:#1f2c34;color:#e9edef;font:500 14px var(--sans)}
.caja-in button{width:42px;height:42px;border-radius:50%;border:0;background:#00a884;color:#fff;cursor:pointer;display:grid;place-items:center}
.caja-in button:disabled{opacity:.5}
.quedan{text-align:center;font-size:11.5px;color:#8696a0;padding:0 0 12px;background:#0b141a}
/* app */
.app-h{display:flex;align-items:center;gap:14px;margin-bottom:26px}
.app-h .ico{width:60px;height:60px;border-radius:18px;background:#fff;display:grid;place-items:center;font:800 24px var(--sans);color:var(--marca);box-shadow:0 12px 34px color-mix(in srgb,var(--marca) 35%,transparent);overflow:hidden}
.app-h .ico img{width:44px;height:44px;object-fit:contain}
.app-h b{display:block;font:400 28px var(--serif)}
.app-h span{color:var(--mut);font-size:14px}
.tels{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;perspective:1600px}
.tel{border-radius:40px;padding:10px;background:linear-gradient(160deg,#2a2c3e,#0d0e18);box-shadow:inset 0 1px 0 rgba(255,255,255,.2),0 34px 80px rgba(0,0,0,.5);transition:transform .7s var(--ease)}
.tel:nth-child(1){transform:rotateY(8deg)}.tel:nth-child(3){transform:rotateY(-8deg)}
.tel:hover{transform:translateY(-8px) rotateY(0)}
.tel .pt{border-radius:31px;background:#f6f6f8;color:#14151c;min-height:480px;padding:18px 14px;display:flex;flex-direction:column;gap:10px}
.tel .pt .barra-est{display:flex;justify-content:space-between;font-size:11px;font-weight:800;color:#6b6e7e;margin-bottom:2px}
.tel .pt h4{margin:0;font:800 19px var(--sans);letter-spacing:-.01em}
.tel .pt p.pq{margin:0 0 4px;font-size:12px;color:#6b6e7e}
.bl{border-radius:16px;padding:12px 13px;background:#fff;box-shadow:0 1px 0 rgba(0,0,0,.04),0 6px 16px rgba(20,21,28,.05);font-size:13px}
.bl b{display:block;font-size:13.5px}
.bl span{color:#6b6e7e;font-size:12px}
.bl.boton{background:var(--marca);color:#fff;text-align:center;font-weight:800;box-shadow:0 10px 24px color-mix(in srgb,var(--marca) 35%,transparent)}
.bl.boton span{color:rgba(255,255,255,.88)}
.bl.aviso{background:color-mix(in srgb,var(--marca) 12%,#fff);border:1px solid color-mix(in srgb,var(--marca) 30%,#fff)}
.bl .pg{height:8px;border-radius:5px;background:#eceef3;margin-top:8px;overflow:hidden}
.bl .pg u{display:block;height:100%;border-radius:5px;background:var(--marca)}
.bl.lista b::before{content:'• ';color:var(--marca)}
.ejemplo{font:500 11.5px var(--mono);color:var(--mut2);margin-top:18px;text-align:center}
/* cierre */
.cierre{display:grid;grid-template-columns:1.3fr .7fr;gap:0;align-items:stretch;overflow:hidden;padding:0}
.cierre .tx{padding:54px 48px;display:flex;flex-direction:column;justify-content:center}
.cierre small{font:500 12px var(--mono);letter-spacing:.08em;color:color-mix(in srgb,var(--marca) 55%,#fff)}
.cierre h2{font:400 clamp(36px,4.6vw,60px)/1.02 var(--serif);margin:12px 0 16px}
.cierre p{margin:0 0 28px;color:#C9CBDA;max-width:520px;font-size:17px}
.puntos{list-style:none;margin:0 0 30px;padding:0;display:flex;flex-direction:column;gap:10px}
.puntos li{display:flex;gap:10px;align-items:center;font-size:15px;color:#D7D8E2}
.puntos li::before{content:'';width:18px;height:18px;border-radius:6px;flex:none;background:var(--lime) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='m5 12 4 4 10-10' fill='none' stroke='%230b0f14' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center/12px no-repeat}
.foto{position:relative;min-height:440px;background:#1a1640}
.foto img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 18%}
.foto::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,transparent 55%,rgba(5,6,11,.85)),linear-gradient(90deg,rgba(5,6,11,.35),transparent 30%)}
.foto figcaption{position:absolute;left:22px;right:22px;bottom:20px;z-index:1}
.foto figcaption b{display:block;font:400 24px var(--serif)}
.foto figcaption span{font:500 11.5px var(--mono);color:var(--mut)}
/* fin de la prueba del asistente: tarjeta de PEBAI dentro del chat */
.fin{align-self:stretch;margin:10px 6px 4px;padding:16px;border-radius:16px;text-align:center;background:linear-gradient(160deg,rgba(183,255,60,.14),rgba(126,115,255,.12));border:1px solid rgba(183,255,60,.35);animation:entra .4s var(--ease)}
.fin b{display:block;font:400 21px/1.2 var(--serif);color:#fff;margin-bottom:6px}
.fin p{margin:0 0 12px;font-size:13px;color:#C9CBDA}
.fin a{display:inline-flex;padding:10px 16px;border-radius:12px;background:var(--lime);color:#0b0f14;font-weight:800;font-size:13.5px;text-decoration:none}
.btns{display:flex;gap:12px;flex-wrap:wrap}
.bt{display:inline-flex;align-items:center;gap:10px;padding:15px 22px;border-radius:16px;font-weight:800;text-decoration:none;transition:transform .3s var(--ease),box-shadow .3s}
.bt.p{background:var(--lime);color:#0b0f14;box-shadow:0 14px 40px rgba(183,255,60,.28)}
.bt.p:hover{transform:translateY(-2px);box-shadow:0 18px 50px rgba(183,255,60,.4)}
.bt.s{border:1px solid var(--line2);color:var(--fg);background:rgba(255,255,255,.04)}
.plazas,.cierre p.plazas{font:500 11.5px var(--mono);letter-spacing:.04em;color:var(--mut);margin:16px 0 0;max-width:none}
footer{padding:56px 0 44px;color:var(--mut2);font-size:12.5px;text-align:center}
footer a{color:var(--mut)}
.rev{opacity:0;transform:translateY(26px);transition:opacity 1s var(--ease),transform 1s var(--ease)}
.rev.ver{opacity:1;transform:none}
@media (max-width:900px){.inf,.demo{grid-template-columns:1fr}.claves,.indice{grid-template-columns:1fr}.tels{grid-template-columns:repeat(3,84%);overflow-x:auto;scroll-snap-type:x mandatory;padding:10px 4px 16px}.tel{scroll-snap-align:center;transform:none!important}.cierre{grid-template-columns:1fr}.cierre .tx{padding:34px 24px;order:2}.foto{min-height:340px;order:1}.duo span.n,.duo .x,.duo .pb{display:none}.hero{padding-top:56px}.barra{grid-template-columns:110px 1fr 60px;gap:8px;font-size:13px}}
@media (prefers-reduced-motion:reduce){.rev{opacity:1;transform:none}*{animation:none!important;transition:none!important}}
</style>
</head>
<body>
<div class="fondo"><i></i><i></i><i></i></div>
<div class="w">
  <header class="top vidrio">
    <div class="duo">
      <span class="tile"><img src="/brand/favicon.svg" alt="PEBAI Systems"></span><span class="pb">PEBAI</span>
      <span class="x">×</span>
      <span class="tile emp"><?= $logo !== '' ? '<img src="' . $e($logo) . '" alt="' . $e($empresa) . '">' : '<b>' . $e($inicial) . '</b>' ?></span><span class="n"><?= $e($empresa) ?></span>
    </div>
    <a class="cta" href="<?= $e($wa) ?>" target="_blank" rel="noopener">Hablemos</a>
  </header>

  <section class="hero">
    <span class="etq vidrio"><i></i>INFORME PRIVADO · <?= $e(mb_strtoupper($fecha($d['creada']))) ?></span>
    <h1><?= $e($empresa) ?>, esto es lo que ve un cliente <em>antes de llamaros</em>.</h1>
    <p class="lead">Hemos preguntado a la Inteligencia Artificial por vuestro sector<?= $ciudad ? ' en ' . $e($ciudad) : '' ?>, hemos montado vuestro asistente con lo que contáis en vuestra web y hemos bocetado vuestra app. Son 2 minutos.</p>
    <nav class="indice">
      <a class="vidrio" href="#ia"><small>01 / VISIBILIDAD EN IA</small><b><?= $radio ? ($salen ? 'Salís en ' . $salen . ' de ' . count($busq) . ' búsquedas' : 'No salís en la IA') : '¿Os recomienda la IA?' ?></b><span>Búsquedas reales, con quién sale</span></a>
      <a class="vidrio" href="#asistente"><small>02 / ASISTENTE</small><b>Vuestro asistente</b><span>Pruébalo: ya sabe de vuestra empresa</span></a>
      <a class="vidrio" href="#app"><small>03 / APP</small><b>Vuestra app</b><span>Tres pantallas para vuestros clientes</span></a>
    </nav>
  </section>

<?php if ($radio): ?>
  <section class="s rev" id="ia">
    <div class="s-h">
      <div><small>01 / INFORME DE VISIBILIDAD EN IA</small><h2><?= $salen ? 'La IA os nombra, pero hay sitio para subir.' : 'Cuando alguien pregunta a la IA, no aparecéis.' ?></h2></div>
      <p>Cada vez más clientes preguntan a ChatGPT, Claude o Gemini antes de pedir presupuesto. La IA da unos pocos nombres, y esos se llevan la llamada.</p>
    </div>
    <div class="inf">
      <div class="caja vidrio nota">
        <svg viewBox="0 0 220 220"><circle class="pista" cx="110" cy="110" r="92"/><circle class="val" id="val" cx="110" cy="110" r="92" transform="rotate(-90 110 110)" style="color:<?= $nota >= 60 ? '#B7FF3C' : ($nota >= 25 ? '#FFB547' : '#FF5E6C') ?>" stroke="currentColor" data-f="<?= max(.025, $nota / 100) ?>"/>
          <text x="110" y="116" text-anchor="middle" class="num"><?= $nota ?></text><text x="110" y="142" text-anchor="middle" class="de">DE 100</text></svg>
        <b>Nota de visibilidad en IA</b>
        <p><?= $nota >= 60 ? 'Buena base: toca afianzar los primeros puestos.' : ($nota > 0 ? 'Aparecéis poco y lejos de arriba.' : 'Para la IA, hoy no existís en vuestra zona.') ?></p>
        <div class="kpis">
          <div><b><?= $salen ?>/<?= count($busq) ?></b><span>búsquedas en las que salís</span></div>
          <div><b><?= count($comp) ?></b><span>competidores que sí nombra</span></div>
        </div>
      </div>
      <div class="bus">
<?php foreach ($busq as $k => $b): $pos = (int)($b['posicion'] ?? 0); ?>
        <div class="consulta vidrio">
          <div class="q"><span>«<?= $e(ucfirst($b['consulta'])) ?>»</span><em class="est <?= $pos ? 'si' : 'no' ?>"><?= $pos ? 'Salís en el puesto ' . $pos : 'No salís' ?></em></div>
          <ol class="rank">
<?php foreach (array_slice($b['empresas'], 0, 6) as $i => $c): $yo = $pos === $i + 1; ?>
            <li class="<?= $yo ? 'yo' : '' ?>"><span class="n"><?= $i + 1 ?></span><div class="b" style="--w:<?= max(25, 100 - $i * 11) ?>%;--d:<?= $k * 200 + $i * 80 ?>ms"><span><?= $yo ? '<b>' . $e($c['nombre']) . '</b> · vosotros' : $e($c['nombre']) ?></span><?= $c['web'] ? '<em>' . $e($c['web']) . '</em>' : '' ?></div></li>
<?php endforeach; if (!$pos): ?>
            <li class="falta"><span class="n">—</span><div class="b"><span><b><?= $e($empresa) ?></b> · no aparece</span></div></li>
<?php endif; ?>
          </ol>
          <?php if (!empty($b['fuentes'])): ?><div class="fuentes"><?php foreach ($b['fuentes'] as $f): ?><a href="<?= $e($f['url']) ?>" target="_blank" rel="noopener nofollow"><?= $e($f['titulo'] ?: parse_url($f['url'], PHP_URL_HOST)) ?></a><?php endforeach; ?></div><?php endif; ?>
        </div>
<?php endforeach; ?>
      </div>
    </div>
<?php if ($comp): $maxN = max(1, max(array_column($comp, 'n'))); ?>
    <div class="comp vidrio">
      <h3>Quién se lleva las recomendaciones</h3>
      <p class="sub">Veces que la IA nombra a cada empresa en las <?= count($busq) ?> búsquedas.</p>
      <div class="barras">
<?php foreach ($comp as $i => $c): ?>
        <div class="barra"><span><?= $e($c['nombre']) ?></span><div class="t"><u style="--w:<?= round($c['n'] / $maxN * 100) ?>%;--d:<?= $i * 90 ?>ms"></u></div><em><?= (int)$c['n'] ?> de <?= count($busq) ?></em></div>
<?php endforeach; if (!$salen): ?>
        <div class="barra yo"><span><b><?= $e($empresa) ?></b></span><div class="t"><u style="--w:3%"></u></div><em>0 de <?= count($busq) ?></em></div>
<?php endif; ?>
      </div>
      <p class="metodo">MÉTODO · <?= count($busq) ?> búsquedas web reales hechas el <?= $e($fecha($radio['fecha'])) ?> a las <?= $e(substr($radio['fecha'], 11, 5)) ?> con Claude (Anthropic), como lo haría un cliente de <?= $e($ciudad ?: 'vuestra zona') ?>. Las IAs cambian sus respuestas con el tiempo: esto es lo que veía un cliente ese día.</p>
    </div>
<?php endif; ?>
    <div class="claves">
      <div class="vidrio"><b>Lo que leen las IAs</b><span>Recomiendan a quien tiene información clara, reseñas y menciones en las webs que ellas consultan.</span></div>
      <div class="vidrio"><b>Se puede trabajar</b><span>Es lo que hacemos en PEBAI: que la IA os entienda y os nombre cuando preguntan por lo vuestro.</span></div>
      <div class="vidrio"><b>Sin cambiar de web</b><span>Se trabaja sobre lo que ya tenéis, con contenido y señales que las IAs sí tienen en cuenta.</span></div>
    </div>
  </section>
<?php endif; ?>

  <section class="s rev" id="asistente">
    <div class="demo">
      <div>
        <div class="s-h" style="margin-bottom:0"><div><small>02 / VUESTRO ASISTENTE</small><h2>Contesta al momento, como lo haríais vosotros.</h2></div></div>
        <ul class="lista">
          <li><i>01</i>Responde en segundos, también de noche y en fin de semana.</li>
          <li><i>02</i>Habla como vosotros y solo dice lo que es verdad de vuestra empresa.</li>
          <li><i>03</i>Os pasa lo que importa: quién quiere presupuesto y cuándo llamarle.</li>
        </ul>
        <div class="sabe vidrio"><small>LO QUE YA SABE DE VOSOTROS</small><p><?= $e($kb['que_hacen'] ?? '') ?><?= !empty($kb['zona']) ? ' Zona: ' . $e($kb['zona']) . '.' : '' ?></p></div>
      </div>
      <div class="movil">
        <div class="pant">
          <div class="cab"><div class="ava"><?= $avatarEmpresa ?></div><div><b><?= $e($empresa) ?></b><span id="estado">en línea</span></div></div>
          <div class="msgs" id="msgs"><div class="m ellos"><?= $e($kb['saludo'] ?? ('¡Hola! Soy el asistente de ' . $empresa . '. ¿En qué te ayudo?')) ?><small>ahora</small></div></div>
          <div class="sug" id="sug"><?php foreach (array_slice((array)($kb['preguntas'] ?? []), 0, 4) as $p): ?><button type="button"><?= $e($p['p'] ?? '') ?></button><?php endforeach; ?></div>
          <form class="caja-in" id="caja"><input id="txt" maxlength="300" placeholder="Escribe como si fueras un cliente…" autocomplete="off"><button aria-label="Enviar"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20.5 21 12 3 3.5 3 10l12 2-12 2z"/></svg></button></form>
          <div class="quedan" id="quedan">Demo con la información pública de vuestra web</div>
        </div>
      </div>
    </div>
  </section>

<?php if ($app && !empty($app['pantallas'])): ?>
  <section class="s rev" id="app">
    <div class="s-h"><div><small>03 / VUESTRA APP</small><h2>Vuestros clientes, con todo a mano.</h2></div><p>Un boceto pensado con vuestros servicios. La haríamos a vuestra medida, con vuestra marca.</p></div>
    <div class="app-h"><div class="ico"><?= $logo !== '' ? '<img src="' . $e($logo) . '" alt="">' : $e($inicial) ?></div><div><b><?= $e($app['nombre'] ?? $empresa) ?></b><span><?= $e($app['lema'] ?? '') ?></span></div></div>
    <div class="tels">
<?php foreach (array_slice($app['pantallas'], 0, 3) as $pt): ?>
      <div class="tel"><div class="pt">
        <div class="barra-est"><span>9:41</span><span>●●● 5G</span></div>
        <h4><?= $e($pt['titulo'] ?? '') ?></h4><p class="pq"><?= $e($pt['para_que'] ?? '') ?></p>
<?php foreach (array_slice((array)($pt['bloques'] ?? []), 0, 5) as $b): $t = in_array($b['tipo'] ?? '', ['tarjeta', 'boton', 'lista', 'progreso', 'aviso'], true) ? $b['tipo'] : 'tarjeta'; ?>
        <div class="bl <?= $t ?>"><b><?= $e($b['texto'] ?? '') ?></b><?= !empty($b['detalle']) ? '<span>' . $e($b['detalle']) . '</span>' : '' ?><?= $t === 'progreso' ? '<div class="pg"><u style="width:' . max(4, min(100, (int)($b['valor'] ?? 50))) . '%"></u></div>' : '' ?></div>
<?php endforeach; ?>
      </div></div>
<?php endforeach; ?>
    </div>
    <p class="ejemplo">BOCETO · LAS CIFRAS DE LAS PANTALLAS SON DE EJEMPLO</p>
  </section>
<?php endif; ?>

  <section class="s rev">
    <div class="cierre vidrio">
      <div class="tx">
        <small>SIGUIENTE PASO</small>
        <h2>¿Lo vemos juntos en 25 minutos?</h2>
        <p>Te enseño cómo quedaría con vuestra información real y por dónde empezaría yo. Sin compromiso.</p>
        <ul class="puntos"><li>Vuestro asistente con toda vuestra información</li><li>Qué hacer para que la IA os recomiende</li><li>Qué haría falta y en cuánto tiempo</li></ul>
        <div class="btns"><a class="bt p" href="<?= $e($wa) ?>" target="_blank" rel="noopener"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.2-.7-2.7-1.1-4.4-3.8-4.6-4-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.3.4c-.1.1-.3.3-.1.6.2.3.7 1.2 1.6 2 1.1 1 2 1.3 2.3 1.4.3.2.5.1.6 0l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.1.1.6-.1 1.3z"/></svg>Hablarlo por WhatsApp</a><a class="bt s" href="/consultoria-gratuita/?origen=demo" target="_blank" rel="noopener">Ver cómo trabajamos</a></div>
        <p class="plazas">LA CONSULTORÍA ES GRATUITA SOLO PARA 5 EMPRESAS AL MES</p>
      </div>
      <figure class="foto" style="margin:0"><img src="/brand/home/dani.webp" alt="Daniel Peñuela, de PEBAI Systems" loading="lazy"><figcaption><b>Daniel Peñuela</b><span>FUNDADOR · PEBAI SYSTEMS</span></figcaption></figure>
    </div>
  </section>
  <footer>PEBAI Systems · Procesos e Inteligencia Artificial para empresas · <a href="/privacidad/">Privacidad</a><br>Página preparada solo para <?= $e($empresa) ?>.</footer>
</div>
<script>
(() => {
  const io = new IntersectionObserver((es) => es.forEach((x) => { if (x.isIntersecting) { x.target.classList.add('ver'); io.unobserve(x.target); if (x.target.id === 'ia') llenar(); } }), { threshold: .12 });
  document.querySelectorAll('.rev').forEach((s) => io.observe(s));
  function llenar() { const v = document.getElementById('val'); if (v) { const L = 2 * Math.PI * 92; v.style.strokeDasharray = (L * +v.dataset.f) + ' ' + L; } }
  // Chat como un WhatsApp de verdad: el doble check se pone azul al leerlo, «escribiendo…» y la respuesta en varios mensajes
  const msgs = document.getElementById('msgs'), caja = document.getElementById('caja'), txt = document.getElementById('txt'), quedan = document.getElementById('quedan'), estado = document.getElementById('estado');
  const hist = []; let ocupado = false;
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  const hora = () => new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const TICK = '<svg class="tick" viewBox="0 0 16 11"><path fill="currentColor" d="M11.1.6 4.8 7 2.1 4.3l-.9.9 3.6 3.6L12 1.5zM14.9.6 8.6 7l-.6-.6-.9.9 1.5 1.5L15.8 1.5z"/></svg>';
  const pon = (t, quien) => { const m = document.createElement('div'); m.className = 'm ' + quien; m.textContent = t; const s = document.createElement('small'); s.textContent = hora(); if (quien === 'yo') s.insertAdjacentHTML('beforeend', TICK); m.append(s); msgs.append(m); msgs.scrollTop = msgs.scrollHeight; return m; };
  const escribiendo = (on) => { estado.textContent = on ? 'escribiendo…' : 'en línea'; estado.style.color = on ? '#53bdeb' : ''; };
  async function manda(t) {
    t = t.trim(); if (!t || ocupado) return; ocupado = true; caja.querySelector('button').disabled = true;
    const mio = pon(t, 'yo'); txt.value = '';
    const pide = fetch('/api/demo_chat.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ s: <?= json_encode($slug) ?>, m: t, h: hist.slice(-8), eq: <?= empty($_GET['equipo']) ? 0 : 1 ?> }) }).then((r) => r.json()).catch(() => ({ ok: false }));
    await espera(900 + Math.random() * 900);
    mio.querySelector('.tick').classList.add('visto');           // visto
    await espera(500 + Math.random() * 700);
    let j = await pide;
    const trozos = j.ok ? String(j.respuesta || '').split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean).slice(0, 3) : [j.error || 'Ahora mismo no puedo contestar.'];
    for (let i = 0; i < trozos.length; i++) {
      escribiendo(true);
      const e = document.createElement('div'); e.className = 'escribe'; e.innerHTML = '<i></i><i></i><i></i>'; msgs.append(e); msgs.scrollTop = msgs.scrollHeight;
      await espera(Math.min(4200, 700 + trozos[i].length * 28));   // tarda lo que tardaría una persona en escribirlo
      e.remove(); pon(trozos[i], 'ellos');
      if (i < trozos.length - 1) { escribiendo(false); await espera(500 + Math.random() * 600); }
    }
    escribiendo(false);
    if (j.ok) { hist.push({ q: t, a: j.respuesta }); if (j.quedan !== undefined) quedan.textContent = j.quedan > 0 ? 'Te quedan ' + j.quedan + (j.quedan === 1 ? ' mensaje' : ' mensajes') + ' de prueba' : 'Prueba terminada'; }
    if (j.ok && (j.quedan === 0 || j.fin)) { await espera(900); finPrueba(); return; }
    ocupado = false; caja.querySelector('button').disabled = false; txt.focus();
  }
  // Fin de la prueba: no habla el asistente, habla PEBAI, y se invita a montarlo de verdad
  function finPrueba() {
    const f = document.createElement('div'); f.className = 'fin';
    f.innerHTML = '<b>Así contestaría a cada cliente, a cualquier hora.</b><p>Con toda vuestra información y vuestro tono, no solo con lo que hay en la web.</p><a href="<?= $e($wa) ?>" target="_blank" rel="noopener">Quiero el nuestro</a>';
    msgs.append(f); msgs.scrollTop = msgs.scrollHeight;
    txt.disabled = true; txt.placeholder = 'Prueba terminada'; caja.querySelector('button').disabled = true;
    document.getElementById('sug').remove();
  }
  caja.addEventListener('submit', (ev) => { ev.preventDefault(); manda(txt.value); });
  document.querySelectorAll('#sug button').forEach((b) => b.addEventListener('click', () => { manda(b.textContent); b.remove(); }));
})();
</script>
</body>
</html>
