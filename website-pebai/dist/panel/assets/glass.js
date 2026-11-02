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
// Cambio de sección: UNA sola transición, corta y suave (solo opacidad y un desplazamiento mínimo, que van por la tarjeta gráfica).
// Antes había varias a la vez (la cascada de tarjetas, los números que ruedan, las del panel antiguo) y además los datos llegaban
// a mitad y repintaban: eso es lo que se veía «rayado» (Daniel, 02/11).
function entra(page) {
  if (!page || quieto) return;
  page.classList.remove('pbg-entra'); void page.offsetWidth; page.classList.add('pbg-entra');
}
document.addEventListener('pb:page', (e) => { pintaPastilla(e.detail); entra(document.getElementById('page-' + e.detail)); });
window.pbAnima = entra;   // para volver a animar un bloque que se repinta (p. ej. Gasto IA al cambiar de mes)
// la primera vez, cuando termina la animación de entrada del panel
const primera = () => { const p = document.body.dataset.page || 'resumen'; pintaPastilla(p); entra(document.getElementById('page-' + p)); };
const intro = document.getElementById('pb-intro');
if (intro) new MutationObserver((m, o) => { if (!document.getElementById('pb-intro')) { o.disconnect(); setTimeout(primera, 250); } }).observe(document.body, { childList: true });
else window.addEventListener('load', () => setTimeout(primera, 200));
})();
