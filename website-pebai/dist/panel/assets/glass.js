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
  if (p === 'conversaciones' || p === 'mapa') p = 'prospectos';   // viven dentro de Prospectos
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
// Repaso del 03/11 (medido en el panel real):
//  · la PRIMERA vez que abres una sección en la sesión, espera muy poco (90 ms sin cambios, 450 ms como mucho) a que se pinte
//    con sus datos y sus tarjetas suben en cascada;
//  · las siguientes veces aparece al momento con un fundido corto (sus datos ya están): nada de esperas ni de cascadas repetidas;
//  · todo con opacidad y movimiento, leyendo medidas antes de escribir (sin forzar el navegador a recalcular en bucle).
const PIEZAS = '.pgx-sol,.pgx-toca,.pgx-col>*,.pgx-act,.pb-card,.pb-row,.pc-kpi,.pc-row,.rd-kpi,.rd-card,.ga-kpi,.ga-card,.ga-hero,.gs-kpi,.gs-card,.gs-prox,.gs-rep,.pb-chip,.pb-plz,.pb-sol-cab,.pb-subnav,.pb-h1,.pb-pagehead,.pb-caja,.pb-hub-c';
const vistos = new Set();
const relojes = new Map();
function limpia(page) {
  const r = relojes.get(page); if (r) r.forEach(clearTimeout);
  relojes.set(page, []);
  page.classList.remove('pbg-espera', 'pbg-cascada', 'pbg-fade');
  page.querySelectorAll('.pbg-n').forEach((x) => x.classList.remove('pbg-n'));
  page.querySelectorAll('.pbg-crece').forEach((x) => x.classList.remove('pbg-crece'));
}
const reloj = (page, fn, ms) => { const t = setTimeout(fn, ms); relojes.get(page).push(t); return t; };
// Cascada sobre lo que se ve ahora mismo
function cascada(page) {
  // 1) leer (todas las medidas de golpe)
  const cand = [];
  for (const x of page.querySelectorAll(PIEZAS)) {
    if (cand.length >= 16) break;
    if (cand.some((c) => c.contains(x))) continue;   // solo la tarjeta de fuera
    const r = x.getBoundingClientRect();
    if (r.height && r.top < innerHeight && r.bottom > 0) cand.push(x);
  }
  const graficas = [...page.querySelectorAll('svg.pgx-barras,svg.ga-barras')];
  // 2) escribir
  cand.forEach((x, n) => { x.style.setProperty('--n', n); x.classList.add('pbg-n'); });
  graficas.forEach((sv) => { [...sv.querySelectorAll('rect')].forEach((x, k) => x.style.setProperty('--n', Math.min(k, 30))); sv.classList.add('pbg-crece'); });
  page.classList.remove('pbg-espera'); void page.offsetWidth; page.classList.add('pbg-cascada');
  reloj(page, () => limpia(page), 1500);
}
function entra(page, forzar) {
  if (!page) return;
  limpia(page);
  if (quieto) return;
  if (vistos.has(page.id) && !forzar) {
    page.classList.add('pbg-fade');
    reloj(page, () => page.classList.remove('pbg-fade'), 320);
    return;
  }
  vistos.add(page.id);
  if (forzar) { requestAnimationFrame(() => cascada(page)); return; }   // ya está pintada (p. ej. Gasto al cambiar de mes)
  page.classList.add('pbg-espera');
  let t = 0, hecho = false;
  const obs = new MutationObserver(() => { clearTimeout(t); t = reloj(page, ir, 90); });
  function ir() { if (hecho) return; hecho = true; obs.disconnect(); try { cascada(page); } catch (e) { page.classList.remove('pbg-espera'); } }
  obs.observe(page, { childList: true, subtree: true });
  t = reloj(page, ir, 90);
  reloj(page, ir, 450);
}
document.addEventListener('pb:page', (e) => { pintaPastilla(e.detail); entra(document.getElementById('page-' + e.detail)); });
window.pbAnima = (el) => entra(el && el.closest ? el.closest('.pb-page') || el : el, true);   // para volver a animar un bloque que se repinta (Gasto IA al cambiar de mes)
// la primera vez: la sección de entrada se anima cuando termina la animación del panel (sin esconderla otra vez)
const primera = () => { const p = document.body.dataset.page || 'resumen'; pintaPastilla(p); const pg = document.getElementById('page-' + p); if (pg) { vistos.add(pg.id); relojes.set(pg, []); try { cascada(pg); } catch (e) { /* nada */ } } };
const intro = document.getElementById('pb-intro');
if (intro) new MutationObserver((m, o) => { if (!document.getElementById('pb-intro')) { o.disconnect(); requestAnimationFrame(primera); } }).observe(document.body, { childList: true });
else window.addEventListener('load', () => requestAnimationFrame(primera));
})();
