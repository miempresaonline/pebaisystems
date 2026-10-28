<?php
/*
 * PEBAI · Panel — animación de entrada: sale cada vez que se abre o se recarga el panel (no al cambiar de sección).
 * Minimalista (Daniel, 28/10): solo el logo, vivo. Sus dos trazos llegan cada uno por su lado, encajan y el logo respira
 * mientras carga el panel. Al final la pantalla «abre los ojos»: un párpado en forma de almendra se entreabre, parpadea y se abre,
 * y el panel pasa de borroso a nítido, como al despertar.
 * Mínimo 3,4 s (para que la animación se vea entera) y máximo 6,5 s. Con «reducir movimiento», solo un fundido corto.
 * Va en línea para pintarse al instante. Lo incluye panel/index.php justo después de <body> cuando hay sesión.
 */
if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}
?>
<style>
#pb-intro{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;background:#05070D;overflow:hidden;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat}
#pb-intro .halo{position:absolute;width:420px;height:420px;border-radius:50%;background:radial-gradient(circle,rgba(183,255,60,.16),rgba(106,92,255,.12) 38%,transparent 66%);
  opacity:0;transform:scale(.6);animation:pbi-halo 1.2s 1s cubic-bezier(.16,1,.3,1) forwards,pbi-respira 2.6s 2.2s ease-in-out infinite}
#pb-intro .logo{position:relative;width:92px;height:99px;perspective:600px}
#pb-intro .giro{position:absolute;inset:0;transform-style:preserve-3d;animation:pbi-flota 3.2s 1.5s ease-in-out infinite}
#pb-intro .giro img{position:absolute;inset:0;width:100%;height:100%;opacity:0;will-change:transform,filter,opacity}
#pb-intro .lima{animation:pbi-lima 1.15s .25s cubic-bezier(.16,1,.3,1) forwards,pbi-lima-vivo 2.6s 1.6s ease-in-out infinite}
#pb-intro .violeta{animation:pbi-violeta 1.15s .45s cubic-bezier(.16,1,.3,1) forwards,pbi-violeta-vivo 2.6s 1.6s ease-in-out infinite}
#pb-intro .chispa{position:absolute;left:50%;top:50%;width:6px;height:6px;margin:-3px;border-radius:50%;background:#fff;box-shadow:0 0 18px 6px rgba(183,255,60,.8),0 0 40px 14px rgba(106,92,255,.45);
  opacity:0;animation:pbi-chispa .7s 1.3s ease-out forwards}
#pb-intro.sale .giro{animation:pbi-junta .45s cubic-bezier(.7,0,.3,1) forwards}
#pb-intro.sale .halo{animation:pbi-halo-sale .45s ease-in forwards}
@keyframes pbi-lima{0%{opacity:0;transform:translate(46px,-52px) rotate(-14deg) scale(.86);filter:blur(12px)}100%{opacity:1;transform:none;filter:blur(0) drop-shadow(0 8px 22px rgba(183,255,60,.32))}}
@keyframes pbi-violeta{0%{opacity:0;transform:translate(-46px,52px) rotate(14deg) scale(.86);filter:blur(12px)}100%{opacity:1;transform:none;filter:blur(0) drop-shadow(0 8px 22px rgba(106,92,255,.4))}}
@keyframes pbi-lima-vivo{0%,100%{opacity:1;transform:none;filter:drop-shadow(0 8px 22px rgba(183,255,60,.32))}50%{opacity:1;transform:translate(-3px,-3px);filter:drop-shadow(0 10px 30px rgba(183,255,60,.55))}}
@keyframes pbi-violeta-vivo{0%,100%{opacity:1;transform:none;filter:drop-shadow(0 8px 22px rgba(106,92,255,.4))}50%{opacity:1;transform:translate(3px,3px);filter:drop-shadow(0 10px 30px rgba(106,92,255,.6))}}
@keyframes pbi-flota{0%,100%{transform:translateY(0) rotateY(0) rotateX(0)}30%{transform:translateY(-5px) rotateY(14deg) rotateX(4deg)}70%{transform:translateY(3px) rotateY(-12deg) rotateX(-3deg)}}
@keyframes pbi-chispa{0%{opacity:0;transform:scale(.2)}35%{opacity:1;transform:scale(1.6)}100%{opacity:0;transform:scale(3.2)}}
@keyframes pbi-halo{to{opacity:1;transform:scale(1)}}
@keyframes pbi-respira{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(1.12)}}
@keyframes pbi-junta{to{transform:scale(.82);opacity:0;filter:blur(6px)}}
@keyframes pbi-halo-sale{to{opacity:0;transform:scale(1.4)}}
/* el panel, detrás, «despierta»: de borroso a nítido mientras se abren los ojos */
body.pb-despierta .pb-app,body.pb-despierta .pb-tabbar{filter:blur(16px) brightness(.55);transform:scale(1.035)}
body.pb-enfoca .pb-app,body.pb-enfoca .pb-tabbar{transition:filter 1.3s cubic-bezier(.16,1,.3,1),transform 1.5s cubic-bezier(.16,1,.3,1)}
@media (prefers-reduced-motion:reduce){#pb-intro *{animation:none!important;opacity:1!important}#pb-intro{transition:opacity .3s}body.pb-despierta .pb-app,body.pb-despierta .pb-tabbar{filter:none;transform:none}}
</style>
<div id="pb-intro" role="status" aria-label="Cargando el panel">
  <i class="halo"></i>
  <div class="logo"><div class="giro">
    <img class="lima" src="<?= BASE ?>assets/marca-lima.png" alt="">
    <img class="violeta" src="<?= BASE ?>assets/marca-violeta.png" alt="">
    <i class="chispa"></i>
  </div></div>
</div>
<script>
(() => {
  const c = document.getElementById('pb-intro'); if (!c) return;
  const b = document.body, t0 = performance.now(), MIN = 3400, MAX = 6500;
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  b.classList.add('pb-despierta');
  const fin = () => { b.classList.remove('pb-despierta', 'pb-enfoca'); c.remove(); };
  // Abrir los ojos: una almendra que se entreabre, parpadea y se abre del todo (máscara elíptica con borde suave)
  const ojos = () => {
    const ease = (x) => 1 - Math.pow(1 - x, 3), lerp = (a, z, k) => a + (z - a) * k;
    // [hasta ms, alto del ojo (vh), ancho (vmax)]
    const tramos = [[0, 0, 55], [380, 9, 62], [560, 1.2, 64], [700, 1.2, 64], [1650, 120, 150]];
    const t1 = performance.now();
    const paso = (ahora) => {
      const t = ahora - t1;
      let i = 1; while (i < tramos.length - 1 && t > tramos[i][0]) i++;
      const [ta, ha, wa] = tramos[i - 1], [tz, hz, wz] = tramos[i];
      const k = ease(Math.min(1, Math.max(0, (t - ta) / (tz - ta))));
      const h = Math.max(.05, lerp(ha, hz, k)), w = lerp(wa, wz, k);
      const m = `radial-gradient(ellipse ${w}vmax ${h}vh at 50% 50%, transparent 0, transparent 62%, rgba(0,0,0,.85) 88%, #000 100%)`;
      c.style.webkitMaskImage = m; c.style.maskImage = m;
      if (i === tramos.length - 1 && !b.classList.contains('pb-enfoca')) { b.classList.add('pb-enfoca'); b.classList.remove('pb-despierta'); }
      if (t < tramos[tramos.length - 1][0]) requestAnimationFrame(paso); else setTimeout(fin, 200);
    };
    requestAnimationFrame(paso);
  };
  let hecho = false;
  const sal = () => {
    if (hecho) return; hecho = true;
    if (quieto) { c.style.opacity = '0'; b.classList.remove('pb-despierta'); setTimeout(fin, 320); return; }
    c.classList.add('sale');
    setTimeout(ojos, 380);
  };
  const listo = () => setTimeout(sal, Math.max(0, MIN - (performance.now() - t0)));
  if (document.readyState === 'complete') listo(); else window.addEventListener('load', listo);
  setTimeout(sal, MAX);
})();
</script>
