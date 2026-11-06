/* PEBAI · Panel — Resumen (06/11): solo lo que Daniel usa. Solicitudes, Te toca responder, Agentes y Caja arriba;
   debajo, la actividad con su historial completo y filtros por tipo.
   Datos en index.php?global=1 y ?avisos_hist=1. Textos con textContent: nunca innerHTML con datos. */
(() => {
'use strict';
const app = document.getElementById('pb-app');
const box = document.getElementById('pb-global');
if (!app || !box) return;
const BASE = app.dataset.base;
const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const sv = (tag, a) => { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); Object.entries(a || {}).forEach(([k, v]) => e.setAttribute(k, v)); return e; };
const N = (n) => new Intl.NumberFormat('es-ES').format(n || 0);
const euros = (c) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format((c || 0) / 100);
const MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MESC = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DIA = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const pad = (n) => String(n).padStart(2, '0');
const ir = (p) => { const b = document.querySelector(`#pb-tabs button[data-page="${p}"]:not(#pb-nav-control)`); if (b) b.click(); };
const abreConv = (k) => { ir('conversaciones'); setTimeout(() => document.dispatchEvent(new CustomEvent('pb:abrir-conv', { detail: k })), 150); };
// Las citas llegan en hora UTC sin zona
const utc = (s) => new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : s + 'Z');
const local = (s) => new Date(String(s).replace(' ', 'T'));
const limpia = (s) => String(s || '').replace(/\s*[|–—-]\s.*$/u, '').replace(/\s+/g, ' ').trim() || String(s || '');
const ST = { trabajando: ['#3DDC84', 'Trabajando'], espera: ['#FFB547', 'En espera'], dormido: ['#6F7189', 'Durmiendo'], pausado: ['#8E84FF', 'En pausa'], error: ['#FF5E6C', 'Con error'], apagado: ['#3A3D52', 'Apagado'] };
const TIPO = {
  solicitud: ['Solicitud', '#B7FF3C'], cita: ['Cita', '#25D366'], interesado: ['Interesado', '#B7FF3C'], respuesta: ['Respuesta', '#3FD5FF'],
  demo: ['Demo abierta', '#FB923C'], ia: ['Claude', '#FF5E6C'], plazo: ['Plazo', '#FFB547'], sistema: ['Sistema', '#FF5E6C'],
};
const GRUPOS = [['', 'Todo'], ['demo', 'Demos'], ['resp', 'Respuestas'], ['sol', 'Solicitudes'], ['cita', 'Citas']];
const PAGINA = 8;

let G = null;
let primera = true;

async function load() {
  const r = await fetch(BASE + '?global=1', { credentials: 'same-origin', cache: 'no-store' });
  if (r.status === 401 || r.redirected) return;
  const j = await r.json();
  if (j.ok) G = j;
}

/* ---------- piezas ---------- */
// El número sube desde cero solo la primera vez que se entra; luego se escribe sin más
function rueda(nodo, valor, fmt) {
  nodo.textContent = fmt(valor);
  if (!primera || quieto || document.hidden || !valor) return;
  const t0 = performance.now(), dur = 900;
  const paso = (t) => {
    const k = Math.min(1, (t - t0) / dur);
    nodo.textContent = fmt(Math.round(valor * (1 - Math.pow(1 - k, 3))));
    if (k < 1) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
}
// Línea de 14 días con área que se desvanece; se dibuja al entrar. Hoy lleva un punto.
let nSpark = 0;
function linea(serie, color) {
  const W = 300, H = 64, s = serie.length ? serie : [0, 0], max = Math.max(1, ...s);
  const x = (i) => i * W / (s.length - 1), y = (v) => H - 6 - (v / max) * (H - 14);
  const d = s.map((v, i) => (i ? `S${x(i) - W / (s.length - 1) / 2} ${y(v)} ${x(i)} ${y(v)}` : `M0 ${y(v)}`)).join(' ');
  const id = 'pgxg' + (++nSpark);
  const g = sv('svg', { viewBox: `0 0 ${W} ${H}`, class: 'pgx-linea', preserveAspectRatio: 'none', 'aria-hidden': 'true' });
  const defs = sv('defs'), lg = sv('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 });
  lg.append(sv('stop', { offset: 0, 'stop-color': color, 'stop-opacity': .28 }), sv('stop', { offset: 1, 'stop-color': color, 'stop-opacity': 0 }));
  defs.append(lg);
  g.append(defs, sv('path', { d: `${d} L${W} ${H} L0 ${H}Z`, fill: `url(#${id})` }), sv('path', { class: primera ? 'traza' : '', pathLength: 1, d, fill: 'none', stroke: color, 'stroke-width': 2, 'vector-effect': 'non-scaling-stroke', 'stroke-linecap': 'round' }));
  return g;
}

/* ---------- tarjetas ---------- */
function tarjetaSolicitudes(sol, ci) {
  const c = el('div', 'pgx-sol');
  const main = el('button', 'pgx-sol-m'); main.type = 'button'; main.onclick = () => ir('solicitudes');
  const h = el('div', 'h'); h.append(el('span', null, 'Solicitudes · 30 días'));
  const n = sol ? sol.sin_revisar : 0; const chip = el('em', n ? 'vivo' : '', n ? `${N(n)} sin revisar` : 'Al día'); h.append(chip);
  const v = el('b', 'v'); rueda(v, sol ? sol.mes : 0, N);
  main.append(h, v, linea(sol ? sol.serie : [], 'var(--lime)'));
  const sig = ci && ci.siguiente ? utc(ci.siguiente) : null;
  const pie = el('button', 'pgx-pie'); pie.type = 'button'; pie.onclick = () => ir('citas');
  const a = el('span'); a.append(el('small', null, 'Citas reservadas'), el('b', null, N(ci ? ci.proximas : 0)));
  const b = el('span'); b.append(el('small', null, 'Próxima'), el('b', null, sig ? `${DIA[sig.getDay()]} ${sig.getDate()} · ${pad(sig.getHours())}:${pad(sig.getMinutes())}` : '—'));
  pie.append(a, b);
  c.append(main, pie);
  return c;
}
function tarjetaTeToca(S) {
  const t = S.te_toca || 0;
  const c = el('div', 'pgx-toca' + (t ? ' viva' : ''));
  const h = el('button', 'pgx-toca-h'); h.type = 'button'; h.onclick = () => ir('conversaciones');
  const lh = el('div', 'h'); lh.append(el('span', null, 'Te toca responder'), el('em', null, t ? 'Ver todas' : 'Al día'));
  const v = el('b', 'v'); rueda(v, t, N);
  h.append(lh, v);
  c.append(h);
  const lista = el('div', 'pgx-toca-l');
  if (!t) lista.append(el('p', 'nada', 'Nadie espera respuesta.'));
  (S.te_toca_lista || []).slice(0, 3).forEach((x) => {
    const f = el('button', 'f'); f.type = 'button'; f.onclick = () => abreConv(x.k);
    f.append(el('b', null, limpia(x.empresa)), el('small', null, x.resumen || (x.canal === 'email' ? 'Ha contestado por email' : 'Ha contestado por WhatsApp')));
    lista.append(f);
  });
  c.append(lista);
  return c;
}
function tarjetaAgentes(A) {
  const tr = A.filter((a) => a.st === 'trabajando').length, err = A.filter((a) => a.st === 'error');
  const c = el('button', 'pgx-mini' + (err.length ? ' mal' : '')); c.type = 'button'; c.onclick = () => ir('agentes');
  const dots = el('div', 'dots');
  A.forEach((a) => { const d = el('i', a.st === 'trabajando' ? 'on' : ''); const [colr, l] = ST[a.st] || ST.dormido; d.style.background = colr; d.title = `${a.nombre}: ${l}`; dots.append(d); });
  const v = el('b'); v.textContent = `${tr}/${A.length}`;
  c.append(el('span', null, 'Agentes trabajando'), v, dots, el('small', null, err.length ? `${err.map((a) => a.nombre).join(', ')}: con error` : 'Ninguno con error'));
  return c;
}
function tarjetaCaja(C) {
  const res = C.ingresos - C.gastos, mx = Math.max(1, C.ingresos, C.gastos);
  const c = el('button', 'pgx-mini' + (res < 0 ? ' mal' : '')); c.type = 'button'; c.onclick = () => ir('caja');
  const v = el('div', 'pg-caja2');
  [['Ingresos', C.ingresos, 'var(--lime)'], ['Gastos', C.gastos, '#FF6B7A']].forEach(([l, x, colr]) => {
    const r = el('div'); const pista = el('u'); const bar = el('i'); bar.style.transform = `scaleX(${Math.max(.02, x / mx)})`; bar.style.background = colr; pista.append(bar);
    r.append(el('span', null, l), pista, el('b', null, euros(x))); v.append(r);
  });
  const b = el('b'); b.textContent = (res > 0 ? '+' : '') + euros(res);
  c.append(el('span', null, 'Caja de ' + MES[C.mes - 1]), b, v);
  return c;
}

/* ---------- actividad con historial ---------- */
const Act = { grupo: '', filas: [], mas: false, cargando: false, firma: '' };
try { Act.grupo = localStorage.getItem('pebai-res-act') || ''; } catch (e) { /* sin almacenamiento */ }
if (!GRUPOS.some(([k]) => k === Act.grupo)) Act.grupo = '';
const nodos = {};
function etiquetaDia(d) {
  const h = new Date(); h.setHours(0, 0, 0, 0);
  const x = new Date(d); x.setHours(0, 0, 0, 0);
  const dias = Math.round((h - x) / 864e5);
  if (dias === 0) return 'Hoy';
  if (dias === 1) return 'Ayer';
  return `${DIA[d.getDay()]} ${d.getDate()} ${MESC[d.getMonth()]}` + (d.getFullYear() !== h.getFullYear() ? ' ' + d.getFullYear() : '');
}
function irAviso(a) {
  const [t, x, y] = String(a.ir || '').split(':');
  if (t === 'lead') document.dispatchEvent(new CustomEvent('pb:abrir-lead', { detail: Number(x) }));
  else if (t === 'conv') abreConv(x + ':' + y);
  else if (t === 'pagina') ir(x);
}
function filaAviso(a, n, anima) {
  const [tl, tc] = TIPO[a.tipo] || [a.tipo, '#8C8FA3'];
  const f = el('button', 'fila' + (anima ? ' entra' : '')); f.type = 'button'; f.onclick = () => irAviso(a);
  f.style.setProperty('--c', tc); f.style.setProperty('--n', Math.min(n, 8));
  const d = local(a.ts);
  const txt = el('span', 'txt'); txt.append(el('b', null, a.titulo)); if (a.texto) txt.append(el('small', null, a.texto));
  f.append(el('i', 'pt'), txt, el('span', 'tipo', tl), el('time', null, `${pad(d.getHours())}:${pad(d.getMinutes())}`));
  return f;
}
function pintaActividad(anima) {
  const lista = nodos.lista; if (!lista) return;
  lista.textContent = '';
  if (!Act.filas.length) lista.append(el('p', 'vacio', 'Todavía no hay nada de este tipo.'));
  let ult = '';
  Act.filas.forEach((a, i) => {
    const et = etiquetaDia(local(a.ts));
    if (et !== ult) { lista.append(el('div', 'dia', et)); ult = et; }
    lista.append(filaAviso(a, i, anima));
  });
  nodos.mas.hidden = !Act.mas;
}
async function cargaActividad(modo) {
  // modo: 'nuevo' (filtro cambiado), 'mas' (siguiente página) o 'refresco' (cada minuto, sin mover lo que se está leyendo)
  if (Act.cargando) return;
  const antes = modo === 'mas' && Act.filas.length ? Act.filas[Act.filas.length - 1].id : 0;
  Act.cargando = true;
  if (nodos.mas) nodos.mas.disabled = true;
  try {
    const r = await fetch(`${BASE}?avisos_hist=1&n=${modo === 'mas' ? 20 : PAGINA}&tipo=${encodeURIComponent(Act.grupo)}&antes=${antes}`, { credentials: 'same-origin', cache: 'no-store' });
    const j = await r.json();
    if (!j.ok) return;
    if (modo === 'mas') { Act.filas = Act.filas.concat(j.avisos); Act.mas = j.mas; pintaActividad(false); return; }
    if (modo === 'refresco' && Act.filas.length > PAGINA) return;   // está leyendo el historial: no se le mueve
    const firma = JSON.stringify(j.avisos.map((a) => a.id));
    if (modo === 'refresco' && firma === Act.firma) return;
    Act.firma = firma; Act.filas = j.avisos; Act.mas = j.mas;
    pintaActividad(modo === 'nuevo');
  } catch (e) { /* lo reintenta al siguiente refresco */ } finally {
    Act.cargando = false;
    if (nodos.mas) nodos.mas.disabled = false;
  }
}
function tarjetaActividad() {
  const c = el('div', 'pgx-act');
  const h = el('div', 'h');
  const seg = el('div', 'pgx-tipos'); seg.setAttribute('role', 'group'); seg.setAttribute('aria-label', 'Filtrar actividad');
  GRUPOS.forEach(([k, t]) => {
    const b = el('button', k === Act.grupo ? 'on' : '', t); b.type = 'button';
    b.onclick = () => {
      if (Act.grupo === k) return;
      Act.grupo = k; try { localStorage.setItem('pebai-res-act', k); } catch (e) { /* nada */ }
      seg.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
      cargaActividad('nuevo');
    };
    seg.append(b);
  });
  h.append(el('span', 'tit', 'Actividad'), seg);
  nodos.lista = el('div', 'filas');
  nodos.mas = el('button', 'mas', 'Ver más'); nodos.mas.type = 'button'; nodos.mas.hidden = true;
  nodos.mas.onclick = () => cargaActividad('mas');
  c.append(h, nodos.lista, nodos.mas);
  if (window.pbSeg) requestAnimationFrame(() => window.pbSeg(seg));
  return c;
}

/* ---------- dibujo ---------- */
let firmaRes = '';
function draw() {
  if (!G || document.body.dataset.page !== 'resumen') return;
  // si nada ha cambiado desde la última vez, no se toca (así no parpadea cada minuto)
  const firma = JSON.stringify([G.secciones, G.salida, G.caja, (G.agentes || []).map((a) => a.st)]);
  if (firma === firmaRes && box.firstChild) return;
  firmaRes = firma;
  const hr = new Date().getHours(), sal = document.getElementById('pb-saludo');
  if (sal) sal.textContent = hr < 6 ? 'Buenas noches' : hr < 14 ? 'Buenos días' : hr < 21 ? 'Buenas tardes' : 'Buenas noches';
  const Sx = G.secciones || {}, S = G.salida || {}, C = G.caja, A = (G.agentes || []).filter((a) => a.dept !== 'embudo');
  let bento = box.querySelector('.pgx');
  if (!bento) {
    bento = el('div', 'pgx');
    bento.append(el('div', 'pgx-hueco sol'), el('div', 'pgx-hueco toca'), el('div', 'pgx-col'), tarjetaActividad());
    box.append(bento);
    cargaActividad('primera');
  }
  bento.children[0].replaceWith(tarjetaSolicitudes(Sx.solicitudes, Sx.citas));
  bento.children[1].replaceWith(tarjetaTeToca(S));
  const col = bento.children[2]; col.textContent = '';
  if (A.length) col.append(tarjetaAgentes(A));
  if (C) col.append(tarjetaCaja(C));
  primera = false;
}

const refrescar = () => load().then(draw).catch(() => {});
document.addEventListener('pb:page', (e) => { if (e.detail === 'resumen') { refrescar(); if (nodos.lista) cargaActividad('refresco'); } });
setInterval(() => { if (!document.hidden && document.body.dataset.page === 'resumen') { refrescar(); cargaActividad('refresco'); } }, 60000);
refrescar();
})();
