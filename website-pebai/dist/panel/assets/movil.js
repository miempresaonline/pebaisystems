/* PEBAI · Panel — menú del móvil (≤960 px): barra de pestañas abajo, como una app, y «Menú» con todas las secciones en una hoja de cristal.
   No duplica la navegación: los botones de abajo pulsan los de #pb-tabs (los de siempre), y la hoja es el propio #pb-tabs. */
(() => {
'use strict';
const app = document.getElementById('pb-app');
const nav = document.getElementById('pb-tabs');
if (!app || !nav) return;
const $ = (s, r) => (r || document).querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const icono = (p) => { const b = nav.querySelector(`button[data-page="${p}"]:not(#pb-nav-control) svg`); return b ? b.outerHTML : ''; };

// Las 4 que más se usan; el resto, en «Menú»
const FIJAS = [['resumen', 'Resumen'], ['conversaciones', 'Chats'], ['prospectos', 'Empresas'], ['agentes', 'Agentes']];
const barra = el('nav', 'pb-tabbar'); barra.setAttribute('aria-label', 'Secciones principales');
FIJAS.forEach(([p, t]) => {
  const b = el('button', null, icono(p) + `<span>${t}</span>`); b.type = 'button'; b.dataset.page = p;
  b.onclick = () => { cierra(); const o = nav.querySelector(`button[data-page="${p}"]:not(#pb-nav-control)`); if (o) o.click(); };
  barra.append(b);
});
const mas = el('button', 'mas', '<svg class="pb-i" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg><span>Menú</span>');
mas.type = 'button'; mas.onclick = () => (document.body.classList.contains('pb-menu-on') ? cierra() : abre());
barra.append(mas);
const velo = el('div', 'pb-menu-velo'); velo.onclick = () => cierra();
app.append(velo); document.body.append(barra);   // el velo, dentro de la app: así la hoja (también dentro) queda por encima

// La hoja: el propio menú lateral, con un asa arriba y tema/salir abajo
const asa = el('div', 'pb-menu-asa', '<i></i><b>Todas las secciones</b>');
nav.prepend(asa);
const pie = el('div', 'pb-menu-pie');
const tema = $('#pb-theme'), salir = $('.pb-side-foot a.ghost');
if (tema) { const b = el('button', 'pb-btn', 'Cambiar tema'); b.type = 'button'; b.onclick = () => tema.click(); pie.append(b); }
if (salir) { const a = el('a', 'pb-btn ghost', 'Salir'); a.href = salir.href; pie.append(a); }
nav.append(pie);
// En la barra de arriba: la lupa del buscador junto a la campana
const foot = $('.pb-side-foot');
if (foot) {
  const lupa = el('button', 'pb-btn icon pb-lupa-movil', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>');
  lupa.type = 'button'; lupa.title = 'Buscar'; lupa.onclick = () => { const b = $('#pb-buscar'); if (b) b.click(); };
  foot.prepend(lupa);
}

function abre() { document.body.classList.add('pb-menu-on'); mas.classList.add('on'); }
function cierra() { document.body.classList.remove('pb-menu-on'); mas.classList.remove('on'); }
nav.addEventListener('click', (e) => { if (e.target.closest('button[data-page]')) cierra(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cierra(); });
// Deslizar la hoja hacia abajo la cierra
let y0 = null;
asa.addEventListener('touchstart', (e) => { y0 = e.touches[0].clientY; }, { passive: true });
asa.addEventListener('touchmove', (e) => { if (y0 != null && e.touches[0].clientY - y0 > 50) { y0 = null; cierra(); } }, { passive: true });

// La pestaña activa se marca sola (también al cambiar de sección desde otro sitio)
const marca = (p) => {
  [...barra.querySelectorAll('button[data-page]')].forEach((b) => b.classList.toggle('on', b.dataset.page === p));
  mas.classList.toggle('dentro', !FIJAS.some(([f]) => f === p));
};
document.addEventListener('pb:page', (e) => marca(e.detail));
marca(document.body.dataset.page || 'resumen');
// Números de las pestañas (conversaciones): se copian del menú lateral
const copiaN = () => {
  const n = $('#pb-conv-n'), b = barra.querySelector('button[data-page="conversaciones"]');
  if (!n || !b) return;
  let em = b.querySelector('em'); const v = n.textContent.trim();
  if (!v || v === '—' || v === '0') { if (em) em.remove(); return; }
  if (!em) { em = document.createElement('em'); b.append(em); }
  em.textContent = v;
};
const cn = $('#pb-conv-n'); if (cn) new MutationObserver(copiaN).observe(cn, { childList: true, characterData: true, subtree: true });
copiaN();
// En la hoja, los contadores a 0 o vacíos no se enseñan (solo distraen)
const ceros = () => nav.querySelectorAll('button em').forEach((e) => { const t = e.textContent.trim(); e.toggleAttribute('data-cero', !t || t === '0' || t === '—'); });
nav.querySelectorAll('button em').forEach((e) => new MutationObserver(ceros).observe(e, { childList: true, characterData: true, subtree: true }));
ceros();
})();
