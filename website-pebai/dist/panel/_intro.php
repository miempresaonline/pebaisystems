<?php
/*
 * PEBAI · Panel — animación de entrada: sale cada vez que se abre o se recarga el panel (no al cambiar de sección).
 * Va en línea (estilo y guion aquí mismo) para pintarse al instante, antes de que carguen el resto de estilos y datos.
 * Dura lo que tarde en cargar el panel, con un mínimo de 1,6 s y un máximo de 5 s. Con «reducir movimiento» del sistema, solo un fundido corto.
 * Lo incluye panel/index.php justo después de <body> cuando hay sesión.
 */
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}
?>
<style>
#pb-intro{--l:#B7FF3C;--v:#7E73FF;--c:#3FD5FF;position:fixed;inset:0;z-index:9999;display:grid;place-items:center;background:#05070D;overflow:hidden;
  font-family:'Manrope',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#EFEDE7;transition:opacity .7s cubic-bezier(.16,1,.3,1),filter .7s,clip-path .9s cubic-bezier(.7,0,.2,1);
  clip-path:circle(150% at 50% 50%)}
#pb-intro.fuera{opacity:0;filter:blur(14px);clip-path:circle(0% at 50% 46%);pointer-events:none}
#pb-intro .au{position:absolute;width:70vmax;height:70vmax;border-radius:50%;filter:blur(90px);opacity:.0;animation:pbi-au 1.6s cubic-bezier(.16,1,.3,1) forwards,pbi-deriva 9s ease-in-out infinite alternate}
#pb-intro .au.a{background:radial-gradient(circle,rgba(126,115,255,.55),transparent 62%);left:-24vmax;top:-30vmax}
#pb-intro .au.b{background:radial-gradient(circle,rgba(183,255,60,.30),transparent 60%);right:-30vmax;bottom:-34vmax;animation-delay:.15s,0s;animation-direction:normal,alternate-reverse}
#pb-intro .rej{position:absolute;inset:-2px;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);
  background-size:44px 44px;mask-image:radial-gradient(circle at 50% 46%,#000 0,transparent 60%);-webkit-mask-image:radial-gradient(circle at 50% 46%,#000 0,transparent 60%);
  opacity:0;animation:pbi-in 1.2s .1s forwards;transform:perspective(600px) rotateX(58deg) translateY(18%) scale(1.6)}
#pb-intro .esc{position:absolute;left:0;right:0;height:38%;top:-40%;background:linear-gradient(180deg,transparent,rgba(183,255,60,.05) 70%,rgba(183,255,60,.12));animation:pbi-esc 2.4s .3s cubic-bezier(.6,0,.3,1) infinite}
#pb-intro .cen{position:relative;display:flex;flex-direction:column;align-items:center;gap:26px;transform:translateY(-3%)}
#pb-intro .orb{position:relative;width:148px;height:148px;display:grid;place-items:center}
#pb-intro .ani{position:absolute;inset:0;border-radius:50%;padding:1.5px;background:conic-gradient(from 0deg,transparent 0 12%,var(--l) 30%,var(--c) 46%,var(--v) 62%,transparent 80%);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;animation:pbi-gira 1.6s linear infinite,pbi-in .6s forwards;opacity:0;filter:drop-shadow(0 0 10px rgba(183,255,60,.45))}
#pb-intro .ani.dos{inset:-16px;padding:1px;opacity:0;background:conic-gradient(from 180deg,transparent 0 55%,rgba(126,115,255,.9) 75%,transparent 92%);animation:pbi-gira 3.2s linear infinite reverse,pbi-in .8s .2s forwards;filter:none}
#pb-intro .cri{position:relative;width:104px;height:104px;border-radius:32px;display:grid;place-items:center;
  background:linear-gradient(145deg,rgba(255,255,255,.12),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.16);
  backdrop-filter:blur(18px) saturate(1.6);-webkit-backdrop-filter:blur(18px) saturate(1.6);box-shadow:0 30px 80px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.22),inset 0 -12px 30px rgba(126,115,255,.12);
  overflow:hidden;transform:scale(.6) rotate(-12deg);opacity:0;animation:pbi-cri 1s .15s cubic-bezier(.2,1.4,.3,1) forwards}
#pb-intro .cri:after{content:"";position:absolute;inset:-40%;background:linear-gradient(115deg,transparent 40%,rgba(255,255,255,.35) 50%,transparent 60%);transform:translateX(-80%);animation:pbi-brillo 2.2s .9s ease-in-out infinite}
#pb-intro .cri img{width:52px;height:auto;filter:blur(10px) drop-shadow(0 6px 18px rgba(183,255,60,.35));opacity:0;animation:pbi-logo .9s .45s cubic-bezier(.16,1,.3,1) forwards}
#pb-intro .pun{position:absolute;inset:0;opacity:0;animation:pbi-gira 2.8s linear infinite,pbi-in .7s .35s forwards}
#pb-intro .pun i{position:absolute;top:-3px;left:50%;width:6px;height:6px;margin-left:-3px;border-radius:50%;background:var(--l);box-shadow:0 0 12px var(--l),0 0 24px var(--l)}
#pb-intro .pun.p2{inset:-16px;animation:pbi-gira 4.4s linear infinite reverse,pbi-in .7s .45s forwards}#pb-intro .pun.p2 i{background:var(--v);box-shadow:0 0 12px var(--v),0 0 24px var(--v);width:5px;height:5px}
#pb-intro .pun.p3{inset:22px;animation:pbi-gira 1.9s linear infinite,pbi-in .7s .55s forwards}#pb-intro .pun.p3 i{background:var(--c);box-shadow:0 0 10px var(--c);width:4px;height:4px}
#pb-intro .mar{display:flex;gap:.02em;font-size:22px;font-weight:300;letter-spacing:.62em;margin-right:-.62em;color:#fff}
#pb-intro .mar span{display:inline-block;opacity:0;transform:translateY(14px);filter:blur(8px);animation:pbi-letra .8s cubic-bezier(.16,1,.3,1) forwards}
#pb-intro .est{display:flex;flex-direction:column;align-items:center;gap:12px;margin-top:-6px}
#pb-intro .lin{position:relative;width:168px;height:2px;border-radius:2px;background:rgba(255,255,255,.08);overflow:hidden;opacity:0;animation:pbi-in .5s .7s forwards}
#pb-intro .lin i{position:absolute;inset:0;transform-origin:left;transform:scaleX(0);background:linear-gradient(90deg,var(--v),var(--c),var(--l));box-shadow:0 0 14px var(--l);transition:transform .5s cubic-bezier(.16,1,.3,1)}
#pb-intro .txt{height:16px;overflow:hidden;font:600 11px/16px ui-monospace,'SF Mono',Menlo,Consolas,monospace;letter-spacing:.18em;text-transform:uppercase;color:rgba(239,237,231,.5);opacity:0;animation:pbi-in .5s .8s forwards}
#pb-intro .txt b{display:block;font-weight:600;transition:transform .5s cubic-bezier(.16,1,.3,1)}
#pb-intro .txt em{font-style:normal;color:var(--l)}
#pb-intro.fuera .cri{transform:scale(1.25);transition:transform .8s cubic-bezier(.7,0,.2,1)}
@keyframes pbi-in{to{opacity:1}}
@keyframes pbi-au{to{opacity:1}}
@keyframes pbi-deriva{to{transform:translate(6vmax,4vmax) scale(1.08)}}
@keyframes pbi-gira{to{transform:rotate(360deg)}}
@keyframes pbi-esc{to{top:100%}}
@keyframes pbi-cri{to{transform:none;opacity:1}}
@keyframes pbi-logo{to{filter:blur(0) drop-shadow(0 6px 18px rgba(183,255,60,.35));opacity:1}}
@keyframes pbi-brillo{0%{transform:translateX(-80%)}60%,100%{transform:translateX(80%)}}
@keyframes pbi-letra{to{opacity:1;transform:none;filter:blur(0)}}
@media (prefers-reduced-motion:reduce){#pb-intro *{animation-duration:.01s!important;animation-iteration-count:1!important;animation-delay:0s!important}#pb-intro{transition:opacity .3s}#pb-intro.fuera{clip-path:none;filter:none}}
</style>
<div id="pb-intro" role="status" aria-label="Cargando el panel">
  <i class="au a"></i><i class="au b"></i><i class="rej"></i><i class="esc"></i>
  <div class="cen">
    <div class="orb">
      <i class="ani dos"></i><i class="ani"></i>
      <span class="pun"><i></i></span><span class="pun p2"><i></i></span><span class="pun p3"><i></i></span>
      <div class="cri"><img src="<?= BASE ?>assets/pebai-mark.png" alt="" width="122" height="144"></div>
    </div>
    <div class="mar" aria-hidden="true"><?php foreach (str_split('PEBAI') as $i => $l): ?><span style="animation-delay:<?= number_format(.55 + $i * .07, 2) ?>s"><?= $l ?></span><?php endforeach; ?></div>
    <div class="est"><div class="lin"><i></i></div><div class="txt"><b>Conectando <em>agentes</em></b></div></div>
  </div>
</div>
<script>
(() => {
  const c = document.getElementById('pb-intro'); if (!c) return;
  const t0 = performance.now(), MIN = 1600, MAX = 5000;
  const barra = c.querySelector('.lin i'), txt = c.querySelector('.txt b');
  const pasos = ['Conectando <em>agentes</em>', 'Leyendo <em>conversaciones</em>', 'Preparando <em>tu panel</em>'];
  let p = 0, k = 0;
  // la barra avanza sola hasta el 85 % y el resto cuando el panel ya está
  const avanza = setInterval(() => { p = Math.min(.85, p + (.85 - p) * .18); barra.style.transform = 'scaleX(' + p + ')'; }, 120);
  const cambia = setInterval(() => { k = Math.min(pasos.length - 1, k + 1); txt.style.transform = 'translateY(-16px)';
    setTimeout(() => { txt.innerHTML = pasos[k]; txt.style.transition = 'none'; txt.style.transform = 'translateY(16px)';
      requestAnimationFrame(() => { txt.style.transition = ''; txt.style.transform = ''; }); }, 260); }, 620);
  let hecho = false;
  const fin = () => {
    if (hecho) return; hecho = true;
    clearInterval(avanza); clearInterval(cambia);
    barra.style.transform = 'scaleX(1)';
    setTimeout(() => { c.classList.add('fuera'); setTimeout(() => c.remove(), 950); }, 260);
  };
  const listo = () => setTimeout(fin, Math.max(0, MIN - (performance.now() - t0)));
  if (document.readyState === 'complete') listo(); else window.addEventListener('load', listo);
  setTimeout(fin, MAX);
})();
</script>
