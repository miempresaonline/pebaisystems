/* PEBAI · Panel — estilo «cristal» (01/11/2026): pastilla de avisos arriba, pastilla con las secciones del grupo abajo y entrada de cada
   sección en tres tiempos, como en el vídeo de referencia: se desenfoca, salen las tarjetas de cristal en cascada y los números ruedan,
   las barras crecen y las líneas se dibujan. Solo adorna: no cambia datos ni comportamiento. */
(() => {
'use strict';
const app = document.getElementById('pb-app');
const nav = document.getElementById('pb-tabs');
if (!app || !nav) return;
const BASE = app.dataset.base;
const $ = (s, r) => (r || document).querySelector(s);
const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/* ---------- pastilla de avisos (arriba, en el centro) ---------- */
const top = $('.pb-top');
const pill = document.createElement('button'); pill.type = 'button'; pill.className = 'pb-aviso'; pill.hidden = true;
if (top) top.insertBefore(pill, top.children[1] || null);
const hace = (ts) => {
  const m = Math.round((Date.now() - new Date(String(ts).replace(' ', 'T'))) / 60000);
  if (m < 1) return 'ahora'; if (m < 60) return 'hace ' + m + ' min';
  const h = Math.round(m / 60); return h < 24 ? 'hace ' + h + ' h' : (Math.round(h / 24) === 1 ? 'ayer' : 'hace ' + Math.round(h / 24) + ' días');
};
const saludo = () => { const h = new Date().getHours(); return h < 6 ? 'Buenas noches' : h < 14 ? 'Buenos días' : h < 21 ? 'Buenas tardes' : 'Buenas noches'; };
let avisos = [], iAviso = 0;
function pintaAviso() {
  if (!avisos.length) {
    const d = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    pill.innerHTML = `<i class="lime"></i><b>${saludo()},</b><em>equipo</em><small>· ${esc(d)}</small>`;
    pill.dataset.ir = ''; pill.hidden = false; return;
  }
  const a = avisos[iAviso % avisos.length];
  pill.innerHTML = `<i class="${['solicitud', 'interesado', 'cita'].includes(a.tipo) ? 'lime' : ''}"></i><b>${esc(a.titulo)}</b><small>${esc(hace(a.ts))}</small>`;
  pill.dataset.ir = a.ir || ''; pill.hidden = false;
  pill.style.animation = 'none'; void pill.offsetWidth; pill.style.animation = '';
}
pill.addEventListener('click', () => {
  const ir = pill.dataset.ir; if (!ir) return;
  const [t, x, y] = ir.split(':');
  const pg = (p) => { const b = nav.querySelector(`button[data-page="${p}"]:not(#pb-nav-control)`); if (b) b.click(); };
  if (t === 'lead') document.dispatchEvent(new CustomEvent('pb:abrir-lead', { detail: Number(x) }));
  else if (t === 'conv') { pg('conversaciones'); setTimeout(() => document.dispatchEvent(new CustomEvent('pb:abrir-conv', { detail: x + ':' + y })), 150); }
  else if (t === 'pagina') pg(x);
});
async function cargaAvisos() {
  try {
    const r = await fetch(BASE + '?avisos_ultimos=1', { credentials: 'same-origin', cache: 'no-store' });
    const j = await r.json(); if (j.ok) avisos = j.avisos || [];
  } catch (e) { /* sin avisos: saludo */ }
  pintaAviso();
}
cargaAvisos();
setInterval(cargaAvisos, 120000);
setInterval(() => { if (avisos.length > 1 && !document.hidden) { iAviso++; pintaAviso(); } }, 9000);

/* ---------- pastilla de secciones abajo: las del grupo en el que estás ---------- */
const pastilla = document.createElement('nav'); pastilla.className = 'pb-pastilla'; pastilla.setAttribute('aria-label', 'Secciones de este grupo'); pastilla.hidden = true;
document.body.append(pastilla);
function pintaPastilla(p) {
  const btn = nav.querySelector(`button[data-page="${p}"]:not(#pb-nav-control)`);
  const grp = btn && btn.closest('.grp');
  const hermanos = grp ? [...grp.querySelectorAll('button[data-page]')].filter((b) => !b.hidden && b.id !== 'pb-nav-control') : [];
  if (hermanos.length < 2) { pastilla.hidden = true; return; }
  pastilla.innerHTML = `<small>${esc((grp.querySelector('small') || {}).textContent || '')}</small>`;
  hermanos.forEach((h) => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = (h.querySelector('span') || h).textContent;
    b.classList.toggle('on', h.dataset.page === p); b.onclick = () => h.click(); pastilla.append(b);
  });
  pastilla.hidden = false;
}

/* ---------- entrada de cada sección ---------- */
// Tarjetas que entran en cascada (lo que haya en la sección: tarjetas, filas, cifras)
const PIEZAS = '.pb-card,.pb-row,.pc-kpi,.pc-row,.rd-kpi,.pb-chip,.pb-plz,.pb-fsec,[class*="-card"],[class*="kpi"]:not(.pb-grid),.pg>*';
// Números que ruedan: solo cifras grandes que no anima ya su propia sección
const esNumero = (t) => /^\s*[+−-]?[\d][\d.,\s]*\s*(%|€|\$|k|h)?\s*$/.test(t);
function odometro(el) {
  const txt = el.textContent; if (!esNumero(txt) || el.dataset.cuenta || el.closest('[data-cuenta]')) return;
  const box = document.createElement('span'); box.className = 'pbg-odo'; box.setAttribute('aria-label', txt.trim());
  const cols = [];
  for (const ch of txt) {
    if (/\d/.test(ch)) {
      const c = document.createElement('span'); c.className = 'c'; c.setAttribute('aria-hidden', 'true');
      const tira = document.createElement('span'); tira.innerHTML = '<i>0</i><i>1</i><i>2</i><i>3</i><i>4</i><i>5</i><i>6</i><i>7</i><i>8</i><i>9</i>';
      c.append(tira); box.append(c); cols.push([tira, +ch]);
    } else box.append(document.createTextNode(ch));
  }
  el.replaceChildren(box);
  requestAnimationFrame(() => requestAnimationFrame(() => cols.forEach(([t, d], i) => { t.style.transitionDelay = (i * 60 + 200) + 'ms'; t.style.transform = `translateY(-${d * 1.1}em)`; })));
  // al acabar, vuelve a ser texto normal (las secciones lo siguen actualizando como siempre)
  setTimeout(() => { if (el.firstChild === box) el.textContent = txt; }, 1700);
}
function entra(page) {
  if (!page || quieto) return;
  page.classList.remove('pbg-entra'); void page.offsetWidth; page.classList.add('pbg-entra');
  // espera un poco: muchas secciones pintan sus datos al entrar
  setTimeout(() => {
    let n = 0;
    page.querySelectorAll(PIEZAS).forEach((p) => {
      if (n > 18 || p.closest('.pbg-pieza') || p.offsetParent === null) return;
      const r = p.getBoundingClientRect(); if (r.top > innerHeight * 1.2) return;
      p.style.setProperty('--n', n++); p.classList.remove('pbg-pieza'); void p.offsetWidth; p.classList.add('pbg-pieza');
      setTimeout(() => p.classList.remove('pbg-pieza'), 1600);
    });
    // cifras grandes
    page.querySelectorAll('b,strong,.v,.num,.big,[class*="num"],[class*="big"],[class*="cifra"]').forEach((e) => {
      if (e.children.length || e.closest('svg,.pb-of-wrap,.pb-kpi')) return;   // las cifras de .pb-kpi ya cuentan solas
      const fs = parseFloat(getComputedStyle(e).fontSize); if (fs >= 22) odometro(e);
    });
    // barras que crecen y líneas que se dibujan
    page.querySelectorAll('svg').forEach((s) => {
      if (s.closest('.pb-of-wrap') || s.getBoundingClientRect().height < 40) return;
      const rects = [...s.querySelectorAll('rect')].filter((x) => x.getBBox && x.getBBox().height > 3);
      if (rects.length > 2) { rects.forEach((x, i) => x.style.setProperty('--n', Math.min(i, 24))); s.classList.add('pbg-crece'); setTimeout(() => s.classList.remove('pbg-crece'), 2200); }
      s.querySelectorAll('path').forEach((p) => {
        const cs = getComputedStyle(p); if (cs.fill !== 'none' || cs.stroke === 'none' || !p.getTotalLength) return;
        const L = p.getTotalLength(); if (L < 60) return;
        p.style.transition = 'none'; p.style.strokeDasharray = L; p.style.strokeDashoffset = L;
        requestAnimationFrame(() => requestAnimationFrame(() => { p.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(.3,.8,.25,1) .3s'; p.style.strokeDashoffset = '0'; }));
        setTimeout(() => { p.style.strokeDasharray = ''; p.style.strokeDashoffset = ''; p.style.transition = ''; }, 2000);
      });
    });
  }, 90);
}
document.addEventListener('pb:page', (e) => { pintaPastilla(e.detail); entra(document.getElementById('page-' + e.detail)); });
window.pbAnima = entra;   // para volver a animar un bloque que se repinta (p. ej. Gasto IA al cambiar de mes)
// la primera vez, cuando termina la animación de entrada del panel
const primera = () => { const p = document.body.dataset.page || 'resumen'; pintaPastilla(p); entra(document.getElementById('page-' + p)); };
const intro = document.getElementById('pb-intro');
if (intro) new MutationObserver((m, o) => { if (!document.getElementById('pb-intro')) { o.disconnect(); setTimeout(primera, 250); } }).observe(document.body, { childList: true });
else window.addEventListener('load', () => setTimeout(primera, 200));
})();
