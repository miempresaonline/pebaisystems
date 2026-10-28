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
$meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
$fecha = static fn($ts) => (int)date('j', strtotime($ts)) . ' de ' . $meses[(int)date('n', strtotime($ts)) - 1] . ' de ' . date('Y', strtotime($ts));

// Visitas: la primera avisa a la oficina (es la mejor señal de interés)
$esBot = preg_match('/bot|crawl|spider|preview|whatsapp|facebookexternalhit|telegram|slack|discord/i', (string)($_SERVER['HTTP_USER_AGENT'] ?? ''));
// ?equipo=1: la miramos nosotros (desde el panel): no cuenta como visita ni avisa
if (!$esBot && empty($_GET['equipo'])) {
    $now = date('Y-m-d H:i:s');
    pebai_demos_db()->prepare("UPDATE demos SET visitas = visitas + 1, ultima_visita = ?, primera_visita = CASE WHEN primera_visita = '' THEN ? ELSE primera_visita END WHERE slug = ?")
        ->execute([$now, $now, $slug]);
    if ((string)$d['primera_visita'] === '') {
        pebai_actividad('demos', 'hito', 'Aviso a WhatsApp: ' . $empresa . ' ha abierto su demo', '', 'demo');
    }
}
$total = $radio ? count($radio['empresas']) : 0;
$wa = 'https://wa.me/34624842799?text=' . rawurlencode('Hola Daniel, he visto la demo que preparaste para ' . $empresa . '. ¿Lo hablamos?');
?><!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<title><?= $e($empresa) ?> · Preparado por PEBAI Systems</title>
<link rel="icon" href="/favicon-48.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
:root{--ink:#06070d;--ink2:#0c0e1a;--card:rgba(255,255,255,.035);--line:rgba(255,255,255,.08);--line2:rgba(255,255,255,.14);--fg:#EFEDE7;--mut:#9A9CB0;--mut2:#6F7189;
  --lime:#B7FF3C;--violet:#7E73FF;--red:#FF5E6C;--marca:<?= $e($color) ?>;--serif:'Instrument Serif',Georgia,serif;--sans:'Manrope',system-ui,sans-serif;--ease:cubic-bezier(.16,1,.3,1)}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:var(--ink);color:var(--fg);font:500 16px/1.6 var(--sans);-webkit-font-smoothing:antialiased;overflow-x:hidden}
body::before{content:'';position:fixed;inset:0;background:radial-gradient(900px 500px at 85% -10%,color-mix(in srgb,var(--marca) 22%,transparent),transparent 60%),radial-gradient(800px 600px at -10% 30%,rgba(126,115,255,.14),transparent 60%);pointer-events:none;z-index:-1}
a{color:inherit}
.w{max-width:1120px;margin:0 auto;padding:0 22px}
.top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:20px 0}
.top .marca{display:flex;align-items:center;gap:10px;text-decoration:none;font-weight:800;letter-spacing:.04em}
.top .marca img{width:30px;height:30px;border-radius:8px}
.top .para{font-size:13px;color:var(--mut);text-align:right}
.top .para b{color:var(--fg)}
/* portada */
.hero{padding:56px 0 30px}
.etq{display:inline-flex;align-items:center;gap:8px;padding:6px 12px;border-radius:999px;border:1px solid var(--line2);background:var(--card);font-size:12.5px;font-weight:700;color:var(--mut)}
.etq i{width:7px;height:7px;border-radius:50%;background:var(--lime);box-shadow:0 0 10px var(--lime)}
h1{font:400 clamp(40px,6.4vw,78px)/1.02 var(--serif);letter-spacing:-.01em;margin:20px 0 18px;max-width:900px}
h1 em{font-style:italic;color:color-mix(in srgb,var(--marca) 55%,#fff)}
.hero p.lead{font-size:19px;color:#C9CBDA;max-width:640px;margin:0}
.indice{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:40px}
.indice a{display:block;padding:18px;border-radius:18px;border:1px solid var(--line);background:var(--card);text-decoration:none;transition:transform .4s var(--ease),border-color .3s}
.indice a:hover{transform:translateY(-3px);border-color:var(--line2)}
.indice small{font:800 11px var(--sans);letter-spacing:.12em;color:var(--mut2)}
.indice b{display:block;font:400 24px/1.15 var(--serif);margin:6px 0 4px}
.indice span{font-size:13.5px;color:var(--mut)}
/* secciones */
section.s{padding:84px 0 20px}
.s-h{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-bottom:28px}
.s-h small{font:800 12px var(--sans);letter-spacing:.14em;color:var(--marca);filter:brightness(1.4)}
.s-h h2{font:400 clamp(30px,4.2vw,50px)/1.05 var(--serif);margin:6px 0 0;max-width:720px}
.s-h p{max-width:420px;color:var(--mut);margin:0;font-size:15px}
.panel{border-radius:24px;border:1px solid var(--line);background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.015));padding:28px;position:relative;overflow:hidden}
/* radiografía */
.rad{display:grid;grid-template-columns:340px 1fr;gap:20px}
.medidor{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:6px}
.medidor svg{width:240px;height:150px;overflow:visible}
.medidor .arco{fill:none;stroke:var(--line2);stroke-width:18;stroke-linecap:round}
.medidor .val{fill:none;stroke-width:18;stroke-linecap:round;stroke-dasharray:0 400;transition:stroke-dasharray 1.6s var(--ease)}
.medidor .num{font:400 54px var(--serif);fill:var(--fg)}
.medidor .de{font:700 12px var(--sans);fill:var(--mut)}
.medidor b{font:400 26px/1.15 var(--serif);margin-top:4px}
.medidor p{margin:0;color:var(--mut);font-size:14px;max-width:270px}
.chat-ia{display:flex;flex-direction:column;gap:14px}
.preg{align-self:flex-end;max-width:85%;padding:12px 16px;border-radius:18px 18px 4px 18px;background:#2a2d48;font-size:15px}
.preg small{display:block;font-size:11px;color:var(--mut);font-weight:700;margin-bottom:2px}
.resp{padding:16px 18px;border-radius:18px 18px 18px 4px;background:rgba(255,255,255,.04);border:1px solid var(--line)}
.resp .quien{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:800;color:var(--mut);margin-bottom:10px}
.resp .quien i{width:22px;height:22px;border-radius:7px;background:#D97757;display:grid;place-items:center}
.rank{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.rank li{display:grid;grid-template-columns:28px 1fr;align-items:center;gap:10px;font-size:14.5px}
.rank .n{width:28px;height:28px;border-radius:9px;display:grid;place-items:center;background:rgba(255,255,255,.06);font-weight:800;font-size:12.5px;color:var(--mut)}
.rank .b{position:relative;padding:8px 12px;border-radius:10px;overflow:hidden;background:rgba(255,255,255,.03)}
.rank .b::before{content:'';position:absolute;inset:0;width:var(--w);background:linear-gradient(90deg,rgba(126,115,255,.22),rgba(126,115,255,.04));transform-origin:left;transform:scaleX(0);transition:transform 1.2s var(--ease) var(--d)}
.rank.ver .b::before{transform:scaleX(1)}
.rank .b span{position:relative}
.rank .b em{position:relative;float:right;font-style:normal;font-size:11.5px;color:var(--mut2)}
.rank li.yo .n{background:var(--lime);color:#0b0f14}
.rank li.yo .b{outline:1.5px solid var(--lime)}
.rank li.yo .b::before{background:linear-gradient(90deg,rgba(183,255,60,.3),rgba(183,255,60,.05))}
.rank li.falta .n{background:rgba(255,94,108,.15);color:var(--red)}
.rank li.falta .b{border:1.5px dashed rgba(255,94,108,.55);background:rgba(255,94,108,.05);color:#FFB3BA}
.fuentes{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px}
.fuentes a{font-size:12px;color:var(--mut);text-decoration:none;border:1px solid var(--line);border-radius:999px;padding:4px 10px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.fuentes a:hover{color:var(--fg);border-color:var(--line2)}
.nota{font-size:12.5px;color:var(--mut2);margin:16px 0 0}
.porque{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:20px}
.porque div{padding:16px 18px;border-radius:16px;background:var(--card);border:1px solid var(--line)}
.porque b{display:block;font:400 22px var(--serif);margin-bottom:4px}
.porque span{font-size:13.5px;color:var(--mut)}
/* demo asistente */
.demo{display:grid;grid-template-columns:1fr 380px;gap:34px;align-items:center}
.lista{list-style:none;padding:0;margin:18px 0 0;display:flex;flex-direction:column;gap:12px}
.lista li{display:flex;gap:12px;align-items:flex-start;font-size:15.5px;color:#D7D8E2}
.lista li i{flex:none;width:24px;height:24px;border-radius:8px;background:color-mix(in srgb,var(--marca) 25%,transparent);display:grid;place-items:center;font-style:normal;font-weight:800;font-size:13px;color:#fff}
.sabe{margin-top:22px;padding:16px;border-radius:16px;background:var(--card);border:1px solid var(--line)}
.sabe small{font:800 11px var(--sans);letter-spacing:.12em;color:var(--mut2)}
.sabe p{margin:6px 0 0;font-size:14px;color:var(--mut)}
.movil{width:100%;max-width:380px;justify-self:center;border-radius:42px;padding:12px;background:#111322;border:1px solid var(--line2);box-shadow:0 40px 100px rgba(0,0,0,.55),0 0 0 6px rgba(255,255,255,.02)}
.pant{border-radius:32px;overflow:hidden;background:#0b141a;display:flex;flex-direction:column;height:600px}
.cab{display:flex;align-items:center;gap:10px;padding:16px 16px 12px;background:#1f2c34}
.ava{width:38px;height:38px;border-radius:50%;background:var(--marca);display:grid;place-items:center;font-weight:800;color:#fff;font-size:16px;flex:none}
.cab b{display:block;font-size:15px;line-height:1.2}
.cab span{font-size:12px;color:#8fd19e}
.msgs{flex:1;overflow-y:auto;padding:14px 12px;display:flex;flex-direction:column;gap:8px;background:#0b141a radial-gradient(rgba(255,255,255,.035) 1px,transparent 1px) 0 0/16px 16px}
.m{max-width:84%;padding:8px 11px 6px;border-radius:12px;font-size:14px;line-height:1.45;white-space:pre-line;animation:entra .35s var(--ease)}
.m.ellos{align-self:flex-start;background:#1f2c34;border-top-left-radius:3px}
.m.yo{align-self:flex-end;background:#005c4b;border-top-right-radius:3px}
.m small{display:block;text-align:right;font-size:10.5px;color:rgba(255,255,255,.45);margin-top:2px}
.escribe{align-self:flex-start;background:#1f2c34;border-radius:12px;padding:10px 12px;display:flex;gap:4px}
.escribe i{width:7px;height:7px;border-radius:50%;background:#8696a0;animation:pt 1s infinite}
.escribe i:nth-child(2){animation-delay:.15s}.escribe i:nth-child(3){animation-delay:.3s}
@keyframes pt{50%{opacity:.3;transform:translateY(-3px)}}
@keyframes entra{from{opacity:0;transform:translateY(6px)}}
.sug{display:flex;gap:6px;overflow-x:auto;padding:8px 10px 0;background:#0b141a;scrollbar-width:none}
.sug button{flex:none;border:1px solid rgba(255,255,255,.12);background:#1f2c34;color:#e9edef;border-radius:999px;padding:6px 11px;font:600 12.5px var(--sans);cursor:pointer}
.caja{display:flex;gap:8px;padding:10px;background:#0b141a}
.caja input{flex:1;border:0;outline:0;border-radius:999px;padding:11px 15px;background:#1f2c34;color:#e9edef;font:500 14px var(--sans)}
.caja button{width:42px;height:42px;border-radius:50%;border:0;background:#00a884;color:#fff;cursor:pointer;display:grid;place-items:center}
.caja button:disabled{opacity:.5}
.quedan{text-align:center;font-size:11.5px;color:#8696a0;padding:0 0 10px;background:#0b141a}
/* app */
.app-h{display:flex;align-items:center;gap:14px;margin-bottom:24px}
.app-h .ico{width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,var(--marca),color-mix(in srgb,var(--marca) 50%,#000));display:grid;place-items:center;font:800 24px var(--sans);color:#fff;box-shadow:0 10px 30px color-mix(in srgb,var(--marca) 40%,transparent)}
.app-h b{display:block;font:400 28px var(--serif)}
.app-h span{color:var(--mut);font-size:14px}
.tels{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.tel{border-radius:36px;padding:10px;background:#111322;border:1px solid var(--line2);box-shadow:0 30px 70px rgba(0,0,0,.45);transition:transform .5s var(--ease)}
.tel:hover{transform:translateY(-6px)}
.tel .pt{border-radius:28px;background:#f6f6f8;color:#14151c;min-height:470px;padding:18px 14px;display:flex;flex-direction:column;gap:10px}
.tel .pt .barra{display:flex;justify-content:space-between;font-size:11px;font-weight:800;color:#6b6e7e;margin-bottom:2px}
.tel .pt h4{margin:0;font:800 19px var(--sans);letter-spacing:-.01em}
.tel .pt p.pq{margin:0 0 4px;font-size:12px;color:#6b6e7e}
.bl{border-radius:16px;padding:12px 13px;background:#fff;box-shadow:0 1px 0 rgba(0,0,0,.04),0 6px 16px rgba(20,21,28,.05);font-size:13px}
.bl b{display:block;font-size:13.5px}
.bl span{color:#6b6e7e;font-size:12px}
.bl.boton{background:var(--marca);color:#fff;text-align:center;font-weight:800;box-shadow:0 10px 24px color-mix(in srgb,var(--marca) 35%,transparent)}
.bl.boton span{color:rgba(255,255,255,.85)}
.bl.aviso{background:color-mix(in srgb,var(--marca) 12%,#fff);border:1px solid color-mix(in srgb,var(--marca) 30%,#fff)}
.bl .pg{height:8px;border-radius:5px;background:#eceef3;margin-top:8px;overflow:hidden}
.bl .pg u{display:block;height:100%;border-radius:5px;background:var(--marca)}
.bl.lista b::before{content:'• ';color:var(--marca)}
.ejemplo{font-size:12.5px;color:var(--mut2);margin-top:16px;text-align:center}
/* cierre */
.cierre{display:grid;grid-template-columns:auto 1fr;gap:26px;align-items:center;padding:36px;border-radius:28px;border:1px solid color-mix(in srgb,var(--lime) 30%,transparent);background:radial-gradient(600px 300px at 100% 0%,rgba(183,255,60,.12),transparent 60%),linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.015))}
.cierre img{width:120px;height:120px;border-radius:28px;object-fit:cover}
.cierre h2{font:400 clamp(30px,4vw,46px)/1.05 var(--serif);margin:0 0 10px}
.cierre p{margin:0 0 20px;color:#C9CBDA;max-width:560px}
.btns{display:flex;gap:12px;flex-wrap:wrap}
.bt{display:inline-flex;align-items:center;gap:10px;padding:15px 22px;border-radius:14px;font-weight:800;text-decoration:none;transition:transform .3s var(--ease),box-shadow .3s}
.bt.p{background:var(--lime);color:#0b0f14;box-shadow:0 14px 40px rgba(183,255,60,.25)}
.bt.p:hover{transform:translateY(-2px);box-shadow:0 18px 50px rgba(183,255,60,.35)}
.bt.s{border:1px solid var(--line2);color:var(--fg)}
.bt.s:hover{border-color:var(--fg)}
.plazas{font-size:12.5px;color:var(--mut);margin-top:14px}
footer{padding:50px 0 40px;color:var(--mut2);font-size:12.5px;text-align:center}
footer a{color:var(--mut)}
.rev{opacity:0;transform:translateY(24px);transition:opacity .9s var(--ease),transform .9s var(--ease)}
.rev.ver{opacity:1;transform:none}
@media (max-width:900px){.rad,.demo{grid-template-columns:1fr}.porque,.indice{grid-template-columns:1fr}.tels{grid-template-columns:repeat(3,82%);overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:10px}.tel{scroll-snap-align:center}.cierre{grid-template-columns:1fr;text-align:center}.cierre img{margin:0 auto}.btns{justify-content:center}.top .para{display:none}}
@media (prefers-reduced-motion:reduce){.rev{opacity:1;transform:none}*{animation:none!important;transition:none!important}}
</style>
</head>
<body>
<div class="w">
  <header class="top">
    <a class="marca" href="https://pebaisystems.es/" target="_blank" rel="noopener"><img src="/favicon-192.png" alt="">PEBAI SYSTEMS</a>
    <div class="para">Preparado para <b><?= $e($empresa) ?></b><br><?= $e($fecha($d['creada'])) ?></div>
  </header>

  <section class="hero">
    <span class="etq"><i></i>Hecho con vuestra web y una búsqueda real</span>
    <h1><?= $e($empresa) ?>, esto es lo que ve un cliente <em>antes de llamaros</em>.</h1>
    <p class="lead">Hemos mirado cómo os encuentra la Inteligencia Artificial<?= $ciudad ? ' en ' . $e($ciudad) : '' ?>, hemos montado vuestro asistente con lo que contáis en vuestra web y hemos bocetado vuestra app. Echadle un vistazo: son 2 minutos.</p>
    <nav class="indice">
      <a href="#ia"><small>01</small><b>¿Os recomienda la IA?</b><span>Búsqueda real, con quién sale y quién no</span></a>
      <a href="#asistente"><small>02</small><b>Vuestro asistente</b><span>Pruébalo: ya sabe de vuestra empresa</span></a>
      <a href="#app"><small>03</small><b>Vuestra app</b><span>Tres pantallas para vuestros clientes</span></a>
    </nav>
  </section>

<?php if ($radio): $ap = (bool)$radio['aparece']; $pos = (int)($radio['posicion'] ?? 0); ?>
  <section class="s rev" id="ia">
    <div class="s-h">
      <div><small>01 · VISIBILIDAD EN IA</small><h2><?= $ap ? 'La IA os recomienda en el puesto ' . $pos . ' de ' . $total . '.' : 'Cuando alguien pregunta a la IA, no aparecéis.' ?></h2></div>
      <p>Cada vez más gente pregunta a ChatGPT, Claude o Gemini antes de pedir presupuesto. La IA da unos pocos nombres, y esos se llevan la llamada.</p>
    </div>
    <div class="panel rad">
      <div class="medidor">
        <svg viewBox="0 0 240 150"><path class="arco" d="M20 130 A100 100 0 0 1 220 130"/><path class="val" id="val" d="M20 130 A100 100 0 0 1 220 130" stroke="<?= $ap ? '#B7FF3C' : '#FF5E6C' ?>" data-f="<?= $ap ? max(.12, 1 - ($pos - 1) / max(1, $total)) : .03 ?>"/>
          <text x="120" y="118" text-anchor="middle" class="num"><?= $ap ? $pos . 'º' : '0' ?></text><text x="120" y="142" text-anchor="middle" class="de"><?= $ap ? 'de ' . $total . ' empresas' : 'menciones de ' . $total ?></text></svg>
        <b><?= $ap ? 'Salís, pero se puede subir' : 'Invisibles para la IA' ?></b>
        <p><?= $ap ? 'Estar arriba es lo que cuenta: casi nadie llega al final de la lista.' : 'La IA está recomendando a otras ' . $total . ' empresas para esto mismo.' ?></p>
      </div>
      <div class="chat-ia">
        <div class="preg"><small>Un cliente pregunta</small>«<?= $e(ucfirst($radio['consulta'])) ?>»</div>
        <div class="resp">
          <div class="quien"><i><svg width="13" height="13" viewBox="0 0 24 24"><path fill="#fff" d="m4.7 15.96 4.72-2.65.08-.23-.08-.13h-.23l-.79-.05-2.7-.07-2.33-.1-2.27-.12-.57-.12L0 11.79l.06-.35.48-.32.68.06 1.52.1 2.28.16 1.65.1 2.45.25h.39l.05-.16-.13-.1-.1-.1L6.97 9.84 4.42 8.15l-1.34-.97-.72-.49-.36-.46-.16-1.01.66-.72.88.06.22.06.9.69 1.9 1.47 2.49 1.84.36.3.15-.1.02-.07-.17-.28-1.35-2.45-1.45-2.49-.64-1.03-.17-.62a3 3 0 0 1-.1-.73L6.29.13 6.7 0l1 .13.42.37.62 1.41 1 2.23 1.55 3.03.46.9.24.83.09.26h.16v-.15l.13-1.7.23-2.1.23-2.69.08-.76.38-.91.75-.5.58.29.48.68-.07.44-.29 1.86-.55 2.9-.37 1.94h.21l.25-.24.98-1.3 1.65-2.07.73-.82.85-.9.55-.44h1.03l.76 1.13-.34 1.17-1.06 1.35-.88 1.14-1.26 1.7-.79 1.36.07.11.19-.02 2.85-.6 1.54-.28 1.84-.32.83.39.09.4-.33.8-1.97.49-2.3.46-3.44.81-.04.03.05.06 1.55.15.66.04h1.62l3.02.22.79.52.47.64-.08.49-1.21.62-1.64-.39-3.83-.91-1.31-.33h-.18v.11l1.09 1.07 2 1.81 2.51 2.33.13.58-.32.45-.34-.05-2.2-1.66-.85-.75-1.93-1.62h-.13v.17l.45.65 2.34 3.52.12 1.08-.17.35-.6.21-.67-.12-1.38-1.92L14.38 18l-1.14-1.94-.14.08-.67 7.26-.32.37-.73.28-.6-.46-.33-.75.33-1.47.38-1.93.32-1.53.28-1.9.17-.63-.01-.04-.14.02-1.43 1.97-2.18 2.94-1.73 1.85-.41.16-.71-.37.06-.66.4-.59 2.39-3.04 1.44-1.88.93-1.08-.01-.16h-.05l-6.34 4.12-1.13.15-.48-.46.06-.75.23-.24 1.9-1.31Z"/></svg></i>Respuesta con búsqueda web real</div>
          <ol class="rank" id="rank">
<?php foreach ($radio['empresas'] as $i => $c): $yo = $ap && $pos === $i + 1; ?>
            <li class="<?= $yo ? 'yo' : '' ?>"><span class="n"><?= $i + 1 ?></span><div class="b" style="--w:<?= max(25, 100 - $i * 9) ?>%;--d:<?= $i * 90 ?>ms"><span><?= $yo ? '<b>' . $e($c['nombre']) . '</b> · vosotros' : $e($c['nombre']) ?></span><?= $c['web'] ? '<em>' . $e($c['web']) . '</em>' : '' ?></div></li>
<?php endforeach; if (!$ap): ?>
            <li class="falta"><span class="n">—</span><div class="b"><span><b><?= $e($empresa) ?></b> · no aparece</span></div></li>
<?php endif; ?>
          </ol>
          <?php if ($radio['fuentes']): ?><div class="fuentes"><?php foreach ($radio['fuentes'] as $f): ?><a href="<?= $e($f['url']) ?>" target="_blank" rel="noopener nofollow"><?= $e($f['titulo'] ?: parse_url($f['url'], PHP_URL_HOST)) ?></a><?php endforeach; ?></div><?php endif; ?>
        </div>
        <p class="nota">Búsqueda real hecha el <?= $e($fecha($radio['fecha'])) ?> a las <?= $e(substr($radio['fecha'], 11, 5)) ?> con Claude (Anthropic) y su buscador web. Las IAs cambian sus respuestas con el tiempo; esto es lo que veía un cliente ese día.</p>
      </div>
    </div>
    <div class="porque">
      <div><b>Lo que leen las IAs</b><span>Recomiendan a quien tiene información clara, reseñas y menciones en webs que ellas leen.</span></div>
      <div><b>Se puede trabajar</b><span>Es lo que hacemos en PEBAI: que la IA os entienda y os nombre cuando preguntan por lo vuestro.</span></div>
      <div><b>Sin cambiar de web</b><span>Se trabaja sobre lo que ya tenéis, con contenido y señales que las IAs sí tienen en cuenta.</span></div>
    </div>
  </section>
<?php endif; ?>

  <section class="s rev" id="asistente">
    <div class="demo">
      <div>
        <div class="s-h" style="margin-bottom:0"><div><small>02 · VUESTRO ASISTENTE</small><h2>Contesta al momento, con lo que contáis en vuestra web.</h2></div></div>
        <ul class="lista">
          <li><i>1</i>Responde a cada cliente en segundos, también por la noche y en fin de semana.</li>
          <li><i>2</i>Habla como vosotros y solo dice lo que es verdad de vuestra empresa.</li>
          <li><i>3</i>Os pasa a vosotros lo que importa: quién quiere presupuesto y cuándo llamarle.</li>
        </ul>
        <div class="sabe"><small>LO QUE YA SABE DE VOSOTROS</small><p><?= $e($kb['que_hacen'] ?? '') ?><?= !empty($kb['zona']) ? ' Zona: ' . $e($kb['zona']) . '.' : '' ?></p></div>
      </div>
      <div class="movil">
        <div class="pant">
          <div class="cab"><div class="ava"><?= $e($inicial) ?></div><div><b><?= $e($empresa) ?></b><span>en línea</span></div></div>
          <div class="msgs" id="msgs"><div class="m ellos"><?= $e($kb['saludo'] ?? ('¡Hola! Soy el asistente de ' . $empresa . '. ¿En qué te ayudo?')) ?><small>ahora</small></div></div>
          <div class="sug" id="sug"><?php foreach (array_slice((array)($kb['preguntas'] ?? []), 0, 4) as $p): ?><button type="button"><?= $e($p['p'] ?? '') ?></button><?php endforeach; ?></div>
          <form class="caja" id="caja"><input id="txt" maxlength="300" placeholder="Escribe como si fueras un cliente…" autocomplete="off"><button aria-label="Enviar"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20.5 21 12 3 3.5 3 10l12 2-12 2z"/></svg></button></form>
          <div class="quedan" id="quedan">Demo con la información pública de vuestra web</div>
        </div>
      </div>
    </div>
  </section>

<?php if ($app && !empty($app['pantallas'])): ?>
  <section class="s rev" id="app">
    <div class="s-h"><div><small>03 · VUESTRA APP</small><h2>Una app para que vuestros clientes lo tengan todo a mano.</h2></div><p>Un boceto pensado con vuestros servicios. La haríamos a vuestra medida, con vuestra marca.</p></div>
    <div class="app-h"><div class="ico"><?= $e($inicial) ?></div><div><b><?= $e($app['nombre'] ?? $empresa) ?></b><span><?= $e($app['lema'] ?? '') ?></span></div></div>
    <div class="tels">
<?php foreach (array_slice($app['pantallas'], 0, 3) as $pt): ?>
      <div class="tel"><div class="pt">
        <div class="barra"><span>9:41</span><span>●●● 5G</span></div>
        <h4><?= $e($pt['titulo'] ?? '') ?></h4><p class="pq"><?= $e($pt['para_que'] ?? '') ?></p>
<?php foreach (array_slice((array)($pt['bloques'] ?? []), 0, 5) as $b): $t = in_array($b['tipo'] ?? '', ['tarjeta', 'boton', 'lista', 'progreso', 'aviso'], true) ? $b['tipo'] : 'tarjeta'; ?>
        <div class="bl <?= $t ?>"><b><?= $e($b['texto'] ?? '') ?></b><?= !empty($b['detalle']) ? '<span>' . $e($b['detalle']) . '</span>' : '' ?><?= $t === 'progreso' ? '<div class="pg"><u style="width:' . max(4, min(100, (int)($b['valor'] ?? 50))) . '%"></u></div>' : '' ?></div>
<?php endforeach; ?>
      </div></div>
<?php endforeach; ?>
    </div>
    <p class="ejemplo">Boceto · las cifras de las pantallas son de ejemplo</p>
  </section>
<?php endif; ?>

  <section class="s rev">
    <div class="cierre">
      <img src="/team/avatar-dani.webp" alt="Daniel, de PEBAI Systems" width="120" height="120">
      <div>
        <h2>¿Lo vemos juntos en 25 minutos?</h2>
        <p>Te enseño cómo quedaría todo esto con vuestra información real, qué haría falta y por dónde empezaría yo. Sin compromiso.</p>
        <div class="btns"><a class="bt p" href="<?= $e($wa) ?>" target="_blank" rel="noopener"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.2-.7-2.7-1.1-4.4-3.8-4.6-4-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.3.4c-.1.1-.3.3-.1.6.2.3.7 1.2 1.6 2 1.1 1 2 1.3 2.3 1.4.3.2.5.1.6 0l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.1.1.6-.1 1.3z"/></svg>Hablarlo por WhatsApp</a><a class="bt s" href="/consultoria-gratuita/?origen=demo" target="_blank" rel="noopener">Ver cómo trabajamos</a></div>
        <p class="plazas">La consultoría es gratuita solo para 5 empresas al mes.</p>
      </div>
    </div>
  </section>
  <footer>PEBAI Systems · Procesos e Inteligencia Artificial para empresas · <a href="/privacidad/">Privacidad</a><br>Página preparada solo para <?= $e($empresa) ?>.</footer>
</div>
<script>
(() => {
  const io = new IntersectionObserver((es) => es.forEach((x) => { if (x.isIntersecting) { x.target.classList.add('ver'); io.unobserve(x.target); if (x.target.id === 'ia') llenar(); } }), { threshold: .15 });
  document.querySelectorAll('.rev').forEach((s) => io.observe(s));
  function llenar() { const v = document.getElementById('val'); if (v) { const L = v.getTotalLength(); v.style.strokeDasharray = (L * +v.dataset.f) + ' ' + L; } const r = document.getElementById('rank'); if (r) setTimeout(() => r.classList.add('ver'), 200); }
  const msgs = document.getElementById('msgs'), caja = document.getElementById('caja'), txt = document.getElementById('txt'), quedan = document.getElementById('quedan');
  const hist = []; let ocupado = false;
  const hora = () => new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const pon = (t, quien) => { const m = document.createElement('div'); m.className = 'm ' + quien; m.textContent = t; const s = document.createElement('small'); s.textContent = hora(); m.append(s); msgs.append(m); msgs.scrollTop = msgs.scrollHeight; };
  async function manda(t) {
    t = t.trim(); if (!t || ocupado) return; ocupado = true; caja.querySelector('button').disabled = true;
    pon(t, 'yo'); txt.value = '';
    const e = document.createElement('div'); e.className = 'escribe'; e.innerHTML = '<i></i><i></i><i></i>'; msgs.append(e); msgs.scrollTop = msgs.scrollHeight;
    try {
      const r = await fetch('/api/demo_chat.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ s: <?= json_encode($slug) ?>, m: t, h: hist.slice(-8) }) });
      const j = await r.json(); e.remove();
      if (j.ok) { pon(j.respuesta, 'ellos'); hist.push({ q: t, a: j.respuesta }); if (j.quedan !== undefined) quedan.textContent = j.quedan > 0 ? 'Te quedan ' + j.quedan + ' mensajes de prueba' : 'Fin de la prueba: hablemos y lo montamos de verdad'; }
      else { pon(j.error || 'Ahora mismo no puedo contestar.', 'ellos'); }
    } catch (err) { e.remove(); pon('Se ha cortado la conexión. Prueba otra vez.', 'ellos'); }
    ocupado = false; caja.querySelector('button').disabled = false; txt.focus();
  }
  caja.addEventListener('submit', (ev) => { ev.preventDefault(); manda(txt.value); });
  document.querySelectorAll('#sug button').forEach((b) => b.addEventListener('click', () => { manda(b.textContent); b.remove(); }));
})();
</script>
</body>
</html>
