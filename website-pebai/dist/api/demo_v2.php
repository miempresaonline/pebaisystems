<?php
/*
 * PEBAI · Demo que vende (v2): COPIA DE PRUEBA, no sustituye a api/demo.php.
 * Orden pensado para vender: 1) prueba tu asistente, 2) toca tu app, 3) lo que te estás perdiendo en la IA, 4) hablamos.
 * Datos en demos.datos['v2'] (ver _demos_v2_lib.php). No cuenta visitas ni avisa. noindex.
 */
require_once __DIR__ . '/_demos_lib.php';

header('X-Robots-Tag: noindex, nofollow');
$slug = preg_replace('/[^a-z0-9-]/', '', (string)($_GET['s'] ?? ''));
$q = pebai_demos_db()->prepare('SELECT * FROM demos WHERE slug = ?');
$q->execute([$slug]);
$d = $q->fetch();
$x = $d ? (json_decode((string)$d['datos'], true) ?: []) : [];
$v2 = $x['v2'] ?? null;
if (!$d || !$v2) {
    http_response_code(404);
    header('Location: /');
    exit;
}
$e = static fn($s) => htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');
$kb = $x['kb'] ?? [];
$geo = $v2['geo'] ?? null;
$app = $v2['app'] ?? null;
$nombre = (string)($v2['nombre'] ?? $d['empresa']);
$ciudad = (string)$d['ciudad'];
$logo = (string)($x['logo'] ?? '');
$color = preg_match('/^#[0-9a-f]{6}$/i', (string)($x['color'] ?? '')) ? $x['color'] : '#2F6F73';
$inicial = mb_strtoupper(mb_substr($nombre, 0, 1));
$avatar = $logo !== '' ? '<img src="' . $e($logo) . '" alt="">' : '<b>' . $e($inicial) . '</b>';
$wa = 'https://wa.me/34624842799?text=' . rawurlencode('Hola, he visto la demo que preparasteis para ' . $nombre . '. ¿Lo hablamos?');
$meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
$fecha = static fn($ts) => (int)date('j', strtotime($ts)) . ' de ' . $meses[(int)date('n', strtotime($ts)) - 1] . ' de ' . date('Y', strtotime($ts));
$nP = $geo ? count($geo['preguntas']) : 0;
$tu = $geo ? (int)$geo['tu_veces'] : 0;
$icono = [
    'casa' => '<path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4v-5H9v5H5a1 1 0 0 1-1-1z"/>',
    'obra' => '<path d="M5 20V6l7-3 7 3v14M9 20v-5h6v5M9 9h.01M15 9h.01"/>',
    'mas' => '<path d="M12 5v14M5 12h14"/>',
    'avisos' => '<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 21h4"/>',
];
$svg = static fn($k) => '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' . $icono[$k] . '</svg>';
?><!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<meta name="theme-color" content="#0a0b0d">
<title><?= $e($nombre) ?> · Preparado por PEBAI Systems</title>
<link rel="icon" href="/brand/pebai-mark-256.png" type="image/png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
<style>
:root{--n0:#0a0b0d;--n1:#121316;--n2:#1a1c20;--n3:#25272d;--tx:#F3F1EC;--mu:#A9ABB3;--mu2:#7B7D86;--lin:rgba(255,255,255,.09);--lima:#B7FF3C;--rojo:#FF6B75;--marca:<?= $e($color) ?>;
  --serif:'Instrument Serif',Georgia,serif;--sans:'Manrope',system-ui,sans-serif;--mono:'JetBrains Mono',ui-monospace,monospace;--suave:cubic-bezier(.16,1,.3,1);--muelle:cubic-bezier(.34,1.4,.64,1)}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:var(--n0);color:var(--tx);font:500 16px/1.55 var(--sans);-webkit-font-smoothing:antialiased;overflow-x:hidden}
.orbe{position:fixed;width:760px;height:760px;left:50%;top:-420px;margin-left:-380px;border-radius:50%;background:radial-gradient(closest-side,color-mix(in srgb,var(--marca) 55%,transparent),transparent);opacity:.5;pointer-events:none;z-index:-1}
a{color:inherit}button{font:inherit;color:inherit;background:none;border:0;cursor:pointer}
.w{max-width:1080px;margin:0 auto;padding:0 18px}
h1,h2{font-family:var(--serif);font-weight:400;letter-spacing:-.012em;margin:0}
h1 em,h2 em{font-style:italic;color:var(--lima)}
.ceja{font:500 12px var(--mono);letter-spacing:.07em;color:var(--mu)}
.top{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 0}
.duo{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:var(--mu)}
.tile{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:var(--n2);overflow:hidden;flex:none}
.tile img{width:24px;height:24px;object-fit:contain}.tile.em{background:#fff}.tile.em b{color:var(--marca)}
.boton{display:inline-flex;align-items:center;justify-content:center;gap:9px;padding:15px 24px;border-radius:14px;background:var(--lima);color:#0b0f14;font-weight:800;text-decoration:none;transition:transform .3s var(--muelle)}
.boton:hover{transform:translateY(-2px)}.boton:active{transform:scale(.98)}
.boton.peq{padding:9px 15px;font-size:13px;border-radius:999px}
/* 1 · ASISTENTE */
.uno{display:grid;grid-template-columns:1fr 390px;gap:56px;align-items:center;padding:10px 0 40px}
.uno h1{font-size:clamp(40px,5.8vw,74px);line-height:1;margin:12px 0 14px}
.uno .sub{font-size:18px;color:#CFD0D6;margin:0 0 22px;max-width:30em}
.marcas{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px}
.marcas li{display:flex;gap:11px;align-items:center;color:#DDDEE3}
.marcas li::before{content:'';width:8px;height:8px;border-radius:50%;background:var(--lima);flex:none}
.reloj{margin:22px 0 0;padding:14px 16px;border-radius:14px;background:var(--n1);border:1px solid var(--lin);display:none}
.reloj.ver{display:block;animation:sube .6s var(--suave)}
.reloj b{color:var(--lima)}
.movil{width:100%;max-width:390px;justify-self:center;border-radius:42px;padding:9px;background:linear-gradient(160deg,#34363e,#101115);box-shadow:0 34px 90px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.07)}
.pant{border-radius:34px;overflow:hidden;display:flex;flex-direction:column;position:relative}
#chat .pant{background:#0b141a;height:640px}
.cab{display:flex;align-items:center;gap:10px;padding:16px 14px 11px;background:#1f2c34}
.ava{width:38px;height:38px;border-radius:50%;background:#fff;display:grid;place-items:center;overflow:hidden;flex:none;color:var(--marca)}
.ava img{width:30px;height:30px;object-fit:contain}
.cab strong{display:block;font-size:15px;line-height:1.2}.cab span{font-size:12px;color:#8fd19e}
.msgs{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:6px;background:#0b141a}
.m{max-width:85%;padding:7px 10px 5px;border-radius:12px;font-size:14.5px;line-height:1.42;white-space:pre-line;animation:sube .3s var(--suave)}
.m.ellos{align-self:flex-start;background:#1f2c34;border-top-left-radius:3px}.m.yo{align-self:flex-end;background:#005c4b;border-top-right-radius:3px}
.m small{display:block;text-align:right;font-size:10.5px;color:rgba(255,255,255,.55)}
.escribe{align-self:flex-start;background:#1f2c34;border-radius:12px;padding:10px 12px;display:flex;gap:4px}
.escribe i{width:7px;height:7px;border-radius:50%;background:#8696a0;animation:pt 1s infinite}.escribe i:nth-child(2){animation-delay:.15s}.escribe i:nth-child(3){animation-delay:.3s}
@keyframes pt{50%{opacity:.3;transform:translateY(-3px)}}@keyframes sube{from{opacity:0;transform:translateY(8px)}}
.sug{display:flex;gap:6px;overflow-x:auto;padding:8px 10px 2px;scrollbar-width:none}.sug::-webkit-scrollbar{display:none}
.sug button{flex:none;border:1px solid rgba(255,255,255,.16);background:#1f2c34;color:#e9edef;border-radius:999px;padding:7px 12px;font-size:13px;font-weight:600}
.entrada{position:relative;display:flex;gap:8px;padding:10px}
.entrada input{flex:1;min-width:0;border:2px solid var(--lima);outline:0;border-radius:999px;padding:12px 15px;background:#1f2c34;color:#fff;font:600 15px var(--sans);animation:late 1.8s infinite}
.entrada input::placeholder{color:#D5DAD0}
.entrada.toc input{border-color:rgba(255,255,255,.2);animation:none}
@keyframes late{50%{box-shadow:0 0 0 5px rgba(183,255,60,.2)}}
.entrada button{width:46px;height:46px;border-radius:50%;background:#00a884;color:#fff;display:grid;place-items:center;flex:none}.entrada button:disabled{opacity:.5}
.globo{position:absolute;left:16px;bottom:112px;padding:7px 12px;border-radius:10px;background:var(--lima);color:#0b0f14;font-size:13px;font-weight:800;pointer-events:none;animation:bota 1.8s var(--suave) infinite;z-index:2}
.globo::after{content:'';position:absolute;left:22px;bottom:-5px;width:11px;height:11px;background:var(--lima);transform:rotate(45deg)}
.entrada.toc .globo{display:none}
@keyframes bota{50%{transform:translateY(-4px)}}
.quedan{text-align:center;font-size:12px;color:#9aa6ad;padding:0 0 11px}
.fin{margin:8px 4px;padding:15px;border-radius:14px;text-align:center;background:var(--n2);border:1px solid rgba(183,255,60,.4)}
.fin strong{display:block;font:400 21px/1.2 var(--serif);margin-bottom:10px}
/* secciones */
section.s{padding:70px 0 10px}
.s h2{font-size:clamp(34px,4.6vw,56px);line-height:1.04;margin:10px 0 12px}
.s .sub{font-size:17px;color:#CFD0D6;margin:0;max-width:34em}
/* 2 · APP: bento claro y navegación negra */
.dos{display:grid;grid-template-columns:390px 1fr;grid-template-areas:'movil texto' 'movil extra';column-gap:56px;row-gap:0;align-content:center}
.dos>.mov-2{grid-area:movil}.dos>div:nth-child(2){grid-area:texto;align-self:end}.dos>.extra{grid-area:extra;align-self:start}
#app .pant{background:#F2F0E9;color:#17181C;height:680px}
.vista{position:absolute;inset:0;padding:18px 15px 96px;overflow-y:auto;opacity:0;visibility:hidden;transform:translateY(12px);transition:opacity .28s,transform .4s var(--suave),visibility 0s .28s}
.vista.on{opacity:1;visibility:visible;transform:none;transition:opacity .28s,transform .4s var(--suave)}
.est{display:flex;justify-content:space-between;font-size:11.5px;font-weight:800;color:#6c6e76;padding:0 4px 12px}
.sal{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.sal small{display:block;color:#6c6e76;font-size:13px}.sal strong{font:400 29px/1.05 var(--serif)}
.sal .ava{box-shadow:0 2px 8px rgba(0,0,0,.1)}
.heroe{border-radius:24px;padding:18px;color:#fff;background:linear-gradient(150deg,color-mix(in srgb,var(--marca) 80%,#000),color-mix(in srgb,var(--marca) 45%,#000));display:grid;grid-template-columns:1fr 92px;gap:10px;align-items:center}
.heroe small{font:500 11px var(--mono);letter-spacing:.06em;opacity:.8}
.heroe strong{display:block;font:400 25px/1.08 var(--serif);margin:5px 0 3px}.heroe span{font-size:12.5px;opacity:.88}
.anillo{position:relative;width:92px;height:92px}.anillo svg{transform:rotate(-90deg)}
.anillo circle{fill:none;stroke-width:9}.anillo .a{stroke:rgba(255,255,255,.22)}.anillo .b{stroke:var(--lima);stroke-linecap:round;stroke-dasharray:0 250;transition:stroke-dasharray 1.3s var(--suave)}
.anillo b{position:absolute;inset:0;display:grid;place-items:center;font:800 20px var(--sans);font-variant-numeric:tabular-nums}
.tar{background:#fff;border-radius:20px;padding:15px;margin-top:10px;box-shadow:0 1px 0 rgba(0,0,0,.03)}
.tar small{font-size:12px;color:#6c6e76}.tar strong{display:block;font-size:15px;line-height:1.28;margin:3px 0}
.fila{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.cuando{display:inline-block;margin-top:5px;padding:4px 9px;border-radius:999px;background:#17181C;color:#fff;font-size:11.5px;font-weight:700}
.vt{font:400 29px/1.08 var(--serif);margin:0 0 14px}
.fases{list-style:none;margin:0;padding:0}
.fases li{position:relative;display:grid;grid-template-columns:26px 1fr auto;gap:10px;align-items:center;padding:13px 0}
.fases li::before{content:'';position:absolute;left:12px;top:0;bottom:0;width:2px;background:#DAD7CD}.fases li:first-child::before{top:50%}.fases li:last-child::before{bottom:50%}
.fases i{position:relative;z-index:1;width:26px;height:26px;border-radius:50%;background:#DAD7CD;display:grid;place-items:center;color:#fff;font-style:normal;font-size:13px}
.fases .hecho i{background:#17181C}.fases .ahora i{background:var(--marca);box-shadow:0 0 0 5px color-mix(in srgb,var(--marca) 22%,transparent)}
.fases strong{font-size:15px}.fases .ahora strong{font-weight:800}.fases .pendiente strong{color:#85868C;font-weight:600}
.fases em{font-style:normal;font-size:12px;color:#6c6e76;font-variant-numeric:tabular-nums}
.opc{display:flex;flex-direction:column;gap:8px}
.opc button{padding:15px;border-radius:16px;background:#fff;font-size:15px;font-weight:700;text-align:left;border:2px solid transparent;transition:border-color .2s,transform .3s var(--muelle)}
.opc button.on{border-color:var(--marca)}.opc button:active{transform:scale(.98)}
.pedir{position:relative;overflow:hidden;width:100%;margin-top:12px;padding:15px;border-radius:16px;background:#17181C;color:#fff;font-weight:800}
.pedir:disabled:not(.va){opacity:.45}
.pedir u{position:absolute;left:0;top:0;bottom:0;width:0;background:var(--marca);text-decoration:none}
.pedir span{position:relative}
.pedir.va u{width:100%;transition:width 1.1s var(--suave)}
.pedir.ok{background:#1E8E4E}.pedir.ok u{display:none}
.aviso{display:flex;gap:11px}.aviso>i{flex:none;width:9px;height:9px;margin-top:6px;border-radius:50%;background:var(--marca)}
.aviso strong{font-weight:700}
.dock{position:absolute;left:12px;right:12px;bottom:14px;display:grid;grid-template-columns:repeat(4,1fr);padding:6px;border-radius:22px;background:#17181C;z-index:3}
.dock .ind{position:absolute;top:6px;bottom:6px;left:6px;width:calc((100% - 12px)/4);border-radius:16px;background:var(--lima);transition:transform .5s var(--muelle)}
.dock button{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;padding:7px 0;color:#B8B9BE;font-size:10.5px;font-weight:700;transition:color .25s}
.dock button.on{color:#0b0f14}
.pista{display:inline-flex;align-items:center;gap:8px;margin:18px 0 0;padding:8px 14px;border-radius:999px;background:var(--n2);font-size:14px;font-weight:700;color:var(--lima)}
.nota{font:500 11.5px var(--mono);color:var(--mu2);margin-top:12px}
.resena{margin:22px 0 0;padding:18px 20px;border-radius:18px;background:var(--n1);border:1px solid var(--lin)}
.resena p{margin:0;font:400 23px/1.22 var(--serif)}
.resena footer{margin-top:9px;font-size:13px;color:var(--mu)}
/* 3 · GEO */
.tres{display:grid;grid-template-columns:1.15fr .85fr;gap:14px;margin-top:26px}
.caja{border-radius:24px;background:var(--n1);border:1px solid var(--lin);padding:20px}
.pest{position:relative;display:grid;grid-template-columns:repeat(<?= max(1, $nP) ?>,1fr);padding:4px;border-radius:13px;background:var(--n2);margin-bottom:16px}
.pest .ind{position:absolute;top:4px;bottom:4px;left:4px;width:calc((100% - 8px)/<?= max(1, $nP) ?>);border-radius:10px;background:var(--n3);transition:transform .45s var(--muelle)}
.pest button{position:relative;padding:8px 2px;font-size:13px;font-weight:700;color:var(--mu)}.pest button.on{color:#fff}
.preg{display:none}.preg.on{display:block;animation:sube .4s var(--suave)}
.burbuja{margin:0 0 14px auto;max-width:90%;width:fit-content;padding:10px 14px;border-radius:16px 16px 4px;background:var(--n3);font-size:15px}
.lista{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}
.lista li{display:grid;grid-template-columns:26px 1fr;gap:11px;align-items:center;padding:10px 12px;border-radius:12px;background:var(--n2)}
.lista li>i{font:500 12px var(--mono);font-style:normal;color:var(--mu)}
.lista strong{font-size:15px;font-weight:700}.lista span{display:block;font-size:12px;color:var(--mu2)}
.lista .yo{outline:2px solid var(--lima)}
.lista .falta{background:rgba(255,107,117,.1);outline:2px dashed rgba(255,107,117,.6)}
.lista .falta strong{color:#FFB1B7}.lista .falta>i{color:var(--rojo)}
.cifra{font:400 clamp(72px,10vw,108px)/.9 var(--serif);color:var(--rojo);font-variant-numeric:tabular-nums}
.cifra small{font-size:.32em;color:var(--mu)}
.bien .cifra{color:var(--lima)}
.txt-c{margin:6px 0 18px;font-size:15px;color:#DDDEE3}
.barras{display:flex;flex-direction:column;gap:11px}
.barra{font-size:13.5px}.barra div{display:flex;justify-content:space-between;gap:8px;margin-bottom:4px}.barra em{font-style:normal;color:var(--mu);font-variant-numeric:tabular-nums;flex:none}
.barra p{margin:0;height:9px;border-radius:5px;background:var(--n2);overflow:hidden}
.barra u{display:block;height:100%;background:repeating-linear-gradient(90deg,#8E91A0 0 3px,transparent 3px 5px)}
.barra.tu strong{color:#FFB1B7}.barra.tu u{width:2%!important;background:var(--rojo)}
.giro{margin:14px 0 0;padding:20px;border-radius:24px;background:var(--lima);color:#0b0f14;display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap}
.giro strong{display:block;font:400 clamp(26px,3vw,34px)/1.1 var(--serif)}.giro span{font-size:15px;font-weight:600}
.giro .boton{background:#0b0f14;color:#fff}
/* 4 · CIERRE */
.equipo{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:24px 0 0}
.perso{position:relative;margin:0;border-radius:22px;overflow:hidden;aspect-ratio:4/5;background:var(--n2)}
.perso img{width:100%;height:100%;object-fit:cover;object-position:center 15%;display:block}
.perso figcaption{position:absolute;left:0;right:0;bottom:0;padding:44px 15px 13px;background:linear-gradient(transparent,rgba(5,5,7,.92))}
.perso strong{display:block;font:400 clamp(20px,2.4vw,26px)/1.1 var(--serif)}.perso span{font-size:12.5px;color:#CFD0D6}
.cuatro{display:grid;grid-template-columns:1.1fr .9fr;gap:44px;align-items:center}
.pasos{list-style:none;margin:18px 0 22px;padding:0;display:flex;flex-direction:column;gap:9px}
.pasos li{display:flex;gap:11px}.pasos i{font:500 12px var(--mono);font-style:normal;color:var(--lima);margin-top:3px}
.plazas{font:500 11.5px var(--mono);letter-spacing:.04em;color:var(--mu);margin:14px 0 0}
footer.pie{padding:44px 0 34px;color:var(--mu2);font-size:12.5px;text-align:center}footer.pie a{color:var(--mu)}
@media (max-width:900px){
  .uno{grid-template-columns:1fr;gap:16px;padding-top:0}.uno h1{font-size:44px;margin:6px 0 6px}.uno .sub{font-size:16px;margin:0}.marcas,.solo-esc{display:none}.reloj{order:3;margin:0}
  #chat .pant{height:max(470px,calc(100svh - 245px))}
  .tres,.cuatro{grid-template-columns:1fr;gap:18px}
  .dos{grid-template-columns:1fr;grid-template-areas:'texto' 'movil' 'extra';row-gap:18px}
  .reloj.ver{display:none}
  section.s{padding-top:56px}
  #app .pant{height:640px}
}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}html{scroll-behavior:auto}}
</style>
</head>
<body>
<div class="orbe"></div>
<div class="w">
  <header class="top">
    <div class="duo"><span class="tile"><img src="/brand/pebai-mark-256.png" alt="PEBAI Systems"></span>×<span class="tile em"><?= $avatar ?></span><span class="solo-esc"><?= $e($nombre) ?></span></div>
    <a class="boton peq" href="<?= $e($wa) ?>" target="_blank" rel="noopener">Hablemos</a>
  </header>

  <!-- 1 · ASISTENTE: lo primero es tocar algo suyo -->
  <section class="uno" id="asistente">
    <div>
      <span class="ceja">PREPARADO PARA <?= $e(mb_strtoupper($nombre)) ?></span>
      <h1>Vuestro asistente ya está hecho. <em>Escribidle.</em></h1>
      <p class="sub">Haced de cliente: preguntadle lo que os preguntan cada día.</p>
      <div class="solo-esc" style="height:20px"></div>
      <ul class="marcas">
        <li>Contesta a cualquier hora, también de noche</li>
        <li>Solo dice lo que es verdad de vuestra empresa</li>
        <li>Os pasa quién quiere presupuesto</li>
      </ul>
      <p class="reloj" id="reloj"></p>
    </div>
    <div class="movil" id="chat">
      <div class="pant">
        <div class="cab"><div class="ava"><?= $avatar ?></div><div><strong><?= $e($nombre) ?></strong><span id="estado">en línea</span></div></div>
        <div class="msgs" id="msgs"><div class="m ellos"><?= $e($kb['saludo'] ?? ('¡Hola! ¿En qué te ayudo?')) ?><small>ahora</small></div></div>
        <div class="sug" id="sug"><?php foreach (array_slice((array)($kb['preguntas'] ?? []), 0, 3) as $p): ?><button type="button"><?= $e($p['p'] ?? '') ?></button><?php endforeach; ?></div>
        <form class="entrada" id="caja">
          <span class="globo">Escribe aquí, como un cliente</span>
          <input id="txt" maxlength="300" placeholder="Escribe tu pregunta…" autocomplete="off" aria-label="Escribe como si fueras un cliente">
          <button aria-label="Enviar"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 20.5 21 12 3 3.5 3 10l12 2-12 2z"/></svg></button>
        </form>
        <div class="quedan" id="quedan">Solo sabe lo que dice vuestra web</div>
      </div>
    </div>
  </section>

<?php if ($app): $av = max(0, min(100, (int)($app['caso']['avance'] ?? 60))); $pal = (string)($app['caso']['palabra'] ?? 'caso'); ?>
  <!-- 2 · APP: se puede tocar, es suya -->
  <section class="s" id="app">
    <div class="dos">
      <div class="movil mov-2">
        <div class="pant" style="position:relative">
          <div class="vista on" data-v="0">
            <div class="est"><span>9:41</span><span>5G</span></div>
            <div class="sal"><div><small>Hola,</small><strong><?= $e($app['cliente'] ?? '') ?></strong></div><div class="ava"><?= $avatar ?></div></div>
            <div class="heroe"><div><small>TU <?= $e(mb_strtoupper($pal)) ?></small><strong><?= $e($app['caso']['titulo'] ?? '') ?></strong><span><?= $e($app['caso']['fase'] ?? '') ?></span></div>
              <div class="anillo"><svg width="92" height="92"><circle class="a" cx="46" cy="46" r="39"/><circle class="b" id="ani" cx="46" cy="46" r="39" data-f="<?= $av / 100 ?>"/></svg><b id="pct" data-n="<?= $av ?>">0%</b></div></div>
            <div class="tar"><small>Lo siguiente</small><strong><?= $e($app['proximo']['titulo'] ?? '') ?></strong><small><?= $e($app['proximo']['quien'] ?? '') ?></small><br><span class="cuando"><?= $e($app['proximo']['cuando'] ?? '') ?></span></div>
            <div class="tar"><small><?= $e($app['caso']['lugar'] ?? '') ?></small><strong><?= $e($app['avisos'][0]['titulo'] ?? '') ?></strong><small><?= $e($app['avisos'][0]['cuando'] ?? '') ?></small></div>
          </div>
          <div class="vista" data-v="1">
            <div class="est"><span>9:41</span><span>5G</span></div>
            <h3 class="vt">Mi <?= $e($pal) ?></h3>
            <ul class="fases"><?php foreach ((array)($app['fases'] ?? []) as $f): $st = in_array($f['estado'] ?? '', ['hecho', 'ahora'], true) ? $f['estado'] : 'pendiente'; ?><li class="<?= $st ?>"><i><?= $st === 'hecho' ? '✓' : '' ?></i><strong><?= $e($f['nombre'] ?? '') ?></strong><em><?= $e($f['fecha'] ?? '') ?></em></li><?php endforeach; ?></ul>
          </div>
          <div class="vista" data-v="2">
            <div class="est"><span>9:41</span><span>5G</span></div>
            <h3 class="vt"><?= $e($app['pedir']['titulo'] ?? '¿Necesitas algo más?') ?></h3>
            <div class="opc" id="opc"><?php foreach ((array)($app['pedir']['opciones'] ?? []) as $o): ?><button type="button"><?= $e($o) ?></button><?php endforeach; ?></div>
            <button class="pedir" id="pedir" type="button" disabled><u></u><span>Elige una opción</span></button>
          </div>
          <div class="vista" data-v="3">
            <div class="est"><span>9:41</span><span>5G</span></div>
            <h3 class="vt">Avisos</h3>
            <?php foreach ((array)($app['avisos'] ?? []) as $a): ?><div class="tar aviso"><i></i><div><strong><?= $e($a['titulo'] ?? '') ?></strong><small><?= $e($a['cuando'] ?? '') ?></small></div></div><?php endforeach; ?>
          </div>
          <nav class="dock" id="dock"><span class="ind"></span>
            <button class="on" type="button" data-t="0"><?= $svg('casa') ?>Inicio</button>
            <button type="button" data-t="1"><?= $svg('obra') ?><?= $e(mb_convert_case($pal, MB_CASE_TITLE)) ?></button>
            <button type="button" data-t="2"><?= $svg('mas') ?>Pedir</button>
            <button type="button" data-t="3"><?= $svg('avisos') ?>Avisos</button>
          </nav>
        </div>
      </div>
      <div>
        <span class="ceja">VUESTRA APP</span>
        <h2>Cada cliente, con su <?= $e($pal) ?> <em>en el bolsillo.</em></h2>
        <p class="sub">Sabe cómo va sin llamaros, y os pide lo siguiente desde ahí. Con vuestro logo y vuestros servicios.</p>
        <span class="pista">Tócala: las pestañas funcionan</span>
      </div>
      <div class="extra">
        <blockquote class="resena" style="margin-inline:0"><p>«Nos crearon una app de IA de revisión de coches literalmente desde 0»</p><footer>Álvaro, de Fran García Cars · Reseña en Google</footer></blockquote>
        <p class="nota">BOCETO · EL CLIENTE, LAS FECHAS Y LOS AVISOS SON DE EJEMPLO</p>
      </div>
    </div>
  </section>
<?php endif; ?>

<?php if ($geo): $maxN = max(1, (int)($geo['ranking'][0]['n'] ?? 1)); ?>
  <!-- 3 · GEO: lo que se están perdiendo, con datos reales -->
  <section class="s" id="ia">
    <span class="ceja">ESTO YA ESTÁ PASANDO</span>
    <h2>Un cliente de <?= $e($ciudad ?: 'vuestra zona') ?> pregunta a la IA a quién llamar. <em style="color:<?= $tu === 0 ? 'var(--rojo)' : 'var(--lima)' ?>"><?= $tu === 0 ? $e($nombre) . ' no sale.' : ($tu < $nP ? $e($nombre) . ' sale solo a veces.' : $e($nombre) . ' sale.') ?></em></h2>
    <div class="tres">
      <div class="caja">
        <div class="pest" id="pest"><span class="ind"></span><?php foreach ($geo['preguntas'] as $i => $p): ?><button type="button" class="<?= $i ? '' : 'on' ?>" data-p="<?= $i ?>">Pregunta <?= $i + 1 ?></button><?php endforeach; ?></div>
        <?php foreach ($geo['preguntas'] as $i => $p): ?>
        <div class="preg <?= $i ? '' : 'on' ?>" data-p="<?= $i ?>">
          <p class="burbuja"><?= $e($p['pregunta']) ?></p>
          <ol class="lista"><?php foreach ($p['empresas'] as $k => $c): ?><li class="<?= !empty($c['yo']) ? 'yo' : '' ?>"><i><?= $k + 1 ?></i><div><strong><?= $e($c['nombre']) ?><?= !empty($c['yo']) ? ' · vosotros' : '' ?></strong><span><?= $e($c['web']) ?></span></div></li><?php endforeach; if (!$p['posicion']): ?><li class="falta"><i>—</i><div><strong><?= $e($nombre) ?></strong><span>No os nombra</span></div></li><?php endif; ?></ol>
        </div>
        <?php endforeach; ?>
      </div>
      <div class="caja <?= $tu === $nP ? 'bien' : '' ?>">
        <div class="cifra"><?= $tu ?> <small>de <?= $nP ?></small></div>
        <p class="txt-c">veces os nombra la IA. Estas empresas se quedan con esas respuestas:</p>
        <div class="barras">
          <?php foreach (array_slice($geo['ranking'], 0, 3) as $c): ?><div class="barra"><div><strong><?= $e($c['nombre']) ?></strong><em><?= (int)$c['n'] ?> de <?= $nP ?></em></div><p><u style="width:<?= round((int)$c['n'] / $nP * 100) ?>%"></u></p></div><?php endforeach; ?>
          <div class="barra tu"><div><strong><?= $e($nombre) ?></strong><em><?= $tu ?> de <?= $nP ?></em></div><p><u style="width:<?= round($tu / max(1, $nP) * 100) ?>%"></u></p></div>
        </div>
      </div>
    </div>
    <div class="giro"><div><strong>Se puede cambiar.</strong><span>Trabajamos para que la IA os entienda y os nombre.</span></div><a class="boton" href="<?= $e($wa) ?>" target="_blank" rel="noopener">Quiero salir ahí</a></div>
    <p class="nota">PREGUNTAS REALES A UNA IA (<?= $e(mb_strtoupper($geo['ia'])) ?>) CON BÚSQUEDA EN INTERNET · <?= $e(mb_strtoupper($fecha($geo['fecha']))) ?> · LAS RESPUESTAS CAMBIAN CON EL TIEMPO</p>
  </section>
<?php endif; ?>

  <!-- 4 · CIERRE: dos personas de verdad y un solo paso -->
  <section class="s" id="hablemos">
    <div class="cuatro">
      <div>
        <span class="ceja">EL SIGUIENTE PASO</span>
        <h2>Esto es lo que hemos hecho <em>sin hablar con vosotros.</em></h2>
        <p class="sub">Imaginad con vuestra información real. Os lo enseñamos en 25 minutos, sin compromiso.</p>
        <ul class="pasos"><li><i>1</i>Dónde perdéis más tiempo o clientes</li><li><i>2</i>Por dónde empezaríamos</li><li><i>3</i>Qué haría falta y cuánto tardaría</li></ul>
        <a class="boton" href="<?= $e($wa) ?>" target="_blank" rel="noopener">Hablarlo por WhatsApp</a>
        <p class="plazas">LA CONSULTORÍA ES GRATUITA SOLO PARA 5 EMPRESAS AL MES</p>
        <blockquote class="resena" style="margin-inline:0"><p>«Entendieron a la primera lo que necesitaba»</p><footer>IntoTrans · Reseña en Google</footer></blockquote>
      </div>
      <div class="equipo">
        <figure class="perso"><img src="/brand/home/dani.webp" alt="Daniel Peñuela" loading="lazy"><figcaption><strong>Daniel Peñuela</strong><span>Fundador</span></figcaption></figure>
        <figure class="perso"><img src="/brand/home/adrian-v2.webp" alt="Adrián Ballesteros" loading="lazy"><figcaption><strong>Adrián Ballesteros</strong><span>Responsable comercial</span></figcaption></figure>
      </div>
    </div>
  </section>
  <footer class="pie">PEBAI Systems · Procesos e Inteligencia Artificial para empresas · <a href="/privacidad/">Privacidad</a><br>Página preparada solo para <?= $e($d['empresa']) ?>.</footer>
</div>
<script>
(() => {
  /* — Asistente — */
  const msgs = document.getElementById('msgs'), caja = document.getElementById('caja'), txt = document.getElementById('txt'), quedan = document.getElementById('quedan'), estado = document.getElementById('estado'), reloj = document.getElementById('reloj');
  const hist = []; let ocupado = false;
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  const hora = () => new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const pon = (t, q) => { const m = document.createElement('div'); m.className = 'm ' + q; m.textContent = t; const s = document.createElement('small'); s.textContent = hora(); m.append(s); msgs.append(m); msgs.scrollTop = msgs.scrollHeight; };
  const toca = () => caja.classList.add('toc');
  txt.addEventListener('focus', toca);
  async function manda(t) {
    t = t.trim(); if (!t || ocupado) return; ocupado = true; toca(); caja.querySelector('button').disabled = true;
    const ini = performance.now(); pon(t, 'yo'); txt.value = '';
    const pide = fetch('/api/demo_chat.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ s: <?= json_encode($slug) ?>, m: t, h: hist.slice(-8), eq: 1 }) }).then((r) => r.json()).catch(() => ({ ok: false }));
    await espera(900);
    const j = await pide;
    const trozos = j.ok ? String(j.respuesta || '').split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean).slice(0, 3) : [j.error || 'Ahora mismo no puedo contestar.'];
    for (const tz of trozos) {
      estado.textContent = 'escribiendo…';
      const e = document.createElement('div'); e.className = 'escribe'; e.innerHTML = '<i></i><i></i><i></i>'; msgs.append(e); msgs.scrollTop = msgs.scrollHeight;
      await espera(Math.min(2600, 500 + tz.length * 14));
      e.remove(); pon(tz, 'ellos');
    }
    estado.textContent = 'en línea';
    if (j.ok) {
      hist.push({ q: t, a: j.respuesta });
      const seg = Math.max(1, Math.round((performance.now() - ini) / 1000));
      reloj.innerHTML = 'Ha contestado en <b>' + seg + ' segundos</b>. A las 3 de la mañana, igual.'; reloj.classList.add('ver');
      if (j.quedan !== undefined) quedan.textContent = 'Ha tardado ' + seg + ' s · ' + (j.quedan > 0 ? 'Te quedan ' + j.quedan + (j.quedan === 1 ? ' mensaje' : ' mensajes') : 'Prueba terminada');
      if (j.quedan === 0 || j.fin) { await espera(700); const f = document.createElement('div'); f.className = 'fin'; f.innerHTML = '<strong>Así contestaría a cada cliente.</strong><a class="boton peq" href="<?= $e($wa) ?>" target="_blank" rel="noopener">Quiero el nuestro</a>'; msgs.append(f); msgs.scrollTop = msgs.scrollHeight; txt.disabled = true; return; }
    }
    ocupado = false; caja.querySelector('button').disabled = false;
  }
  caja.addEventListener('submit', (ev) => { ev.preventDefault(); manda(txt.value); });
  document.querySelectorAll('#sug button').forEach((b) => b.addEventListener('click', () => { manda(b.textContent); b.remove(); }));

  /* — App: la pieza indicadora viaja, el marco no se mueve — */
  const dock = document.getElementById('dock');
  if (dock) {
    const ind = dock.querySelector('.ind'), bts = [...dock.querySelectorAll('button')], vistas = [...document.querySelectorAll('.vista')];
    bts.forEach((b, i) => b.addEventListener('click', () => { bts.forEach((x) => x.classList.toggle('on', x === b)); ind.style.transform = 'translateX(' + (i * 100) + '%)'; vistas.forEach((v, k) => v.classList.toggle('on', k === i)); }));
    const ani = document.getElementById('ani'), pct = document.getElementById('pct');
    new IntersectionObserver((es, io) => es.forEach((x) => { if (!x.isIntersecting) return; io.disconnect();
      const L = 2 * Math.PI * 39, f = +ani.dataset.f, n = +pct.dataset.n; ani.style.strokeDasharray = (L * f) + ' ' + L;
      if (matchMedia('(prefers-reduced-motion:reduce)').matches) { pct.textContent = n + '%'; return; }
      const t0 = performance.now(); (function p(t) { const k = Math.min(1, (t - t0) / 1300), e = 1 - Math.pow(1 - k, 3); pct.textContent = Math.round(n * e) + '%'; if (k < 1) requestAnimationFrame(p); })(t0);
    }), { threshold: .4 }).observe(ani);
    const pedir = document.getElementById('pedir'), lab = pedir.querySelector('span'), ops = [...document.querySelectorAll('#opc button')];
    ops.forEach((o) => o.addEventListener('click', () => { if (pedir.classList.contains('ok')) { pedir.classList.remove('ok', 'va'); } ops.forEach((x) => x.classList.toggle('on', x === o)); pedir.disabled = false; lab.textContent = 'Pedir ' + o.textContent.toLowerCase(); }));
    pedir.addEventListener('click', () => { pedir.disabled = true; pedir.classList.add('va'); lab.textContent = 'Enviando…'; setTimeout(() => { pedir.classList.add('ok'); lab.textContent = '✓ Enviado a <?= $e($nombre) ?>'; }, 1150); });
  }
  /* — GEO — */
  const pest = document.getElementById('pest');
  if (pest) {
    const ind = pest.querySelector('.ind'), bts = [...pest.querySelectorAll('button')], ps = [...document.querySelectorAll('.preg')];
    bts.forEach((b, i) => b.addEventListener('click', () => { bts.forEach((x) => x.classList.toggle('on', x === b)); ind.style.transform = 'translateX(' + (i * 100) + '%)'; ps.forEach((p, k) => p.classList.toggle('on', k === i)); }));
  }
})();
</script>
</body>
</html>
