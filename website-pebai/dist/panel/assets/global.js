/* PEBAI · Panel — Resumen: toda la app de un vistazo, una tarjeta por cada sección del menú (una cifra y un gráfico pequeño).
   Datos en index.php?global=1. Pulsar una tarjeta lleva a su sección. Textos con textContent: nunca innerHTML con datos. */
(() => {
'use strict';
const app = document.getElementById('pb-app');
const box = document.getElementById('pb-global');
if (!app || !box) return;
const BASE = app.dataset.base;
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const sv = (tag, a) => { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); Object.entries(a || {}).forEach(([k, v]) => e.setAttribute(k, v)); return e; };
const N = (n) => new Intl.NumberFormat('es-ES').format(n || 0);
const euros = (c) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format((c || 0) / 100);
const MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIA = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const pad = (n) => String(n).padStart(2, '0');
const ir = (p) => { const b = document.querySelector(`#pb-tabs button[data-page="${p}"]:not(#pb-nav-control)`); if (b) b.click(); };
// Las citas llegan en hora UTC sin zona
const utc = (s) => new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : s + 'Z');
const ST = { trabajando: ['#3DDC84', 'Trabajando'], espera: ['#FFB547', 'En espera'], dormido: ['#6F7189', 'Durmiendo'], pausado: ['#8E84FF', 'En pausa'], error: ['#FF5E6C', 'Con error'], apagado: ['#3A3D52', 'Apagado'] };
const ESTADOS = [['interesado', 'Interesadas', '#B7FF3C'], ['cita', 'Con cita', '#25D366'], ['pregunta', 'Contestaron', '#3FD5FF'], ['sin_respuesta', 'Sin respuesta', '#3A404D'],
  ['auto', 'Contestador', '#6F7189'], ['no_interesado', 'No quieren', '#FF6B7A']];
let G = null;

async function load() {
  const r = await fetch(BASE + '?global=1', { credentials: 'same-origin', cache: 'no-store' });
  if (r.status === 401 || r.redirected) return;
  const j = await r.json();
  if (j.ok) G = j;
}

/* ============ gráficos pequeños ============ */
// Barras de 14 días; la de hoy, más viva
function barras(serie, color) {
  const W = 140, H = 40, n = serie.length || 1, bw = W / n, max = Math.max(1, ...serie);
  const s = sv('svg', { viewBox: `0 0 ${W} ${H}`, class: 'pg-mini', 'aria-hidden': 'true', preserveAspectRatio: 'none' });
  serie.forEach((v, i) => {
    const h = v ? Math.max(3, (H - 2) * v / max) : 2;
    s.append(sv('rect', { x: i * bw + bw * .18, y: H - h, width: bw * .64, height: h, rx: 1.5, fill: color, opacity: v ? (i === n - 1 ? 1 : .55) : .15 }));
  });
  return s;
}
// Barra partida en tramos, con su leyenda
function tramos(partes) {
  const w = el('div', 'pg-tramos'); const tot = partes.reduce((a, p) => a + p[0], 0);
  const b = el('div', 'pg-tramos-b');
  partes.filter((p) => p[0]).forEach(([n, col, l]) => { const i = el('i'); i.style.flex = String(n); i.style.background = col; i.title = `${l}: ${N(n)}`; b.append(i); });
  if (!tot) b.append(el('i', 'vacio'));
  const leg = el('div', 'pg-tramos-l');
  partes.filter((p) => p[0]).slice(0, 3).forEach(([n, col, l]) => { const s = el('span'); const d = el('i'); d.style.background = col; s.append(d, document.createTextNode(`${l} ${N(n)}`)); leg.append(s); });
  w.append(b, leg); return w;
}
function progreso(pct, color) {
  const w = el('div', 'pg-prog'); const i = el('i'); i.style.background = color; w.append(i);
  requestAnimationFrame(() => requestAnimationFrame(() => { i.style.width = Math.max(1, Math.min(100, pct)) + '%'; }));
  return w;
}
// Los próximos 7 días: un punto por cita
function semana(lista) {
  const w = el('div', 'pg-semana'); const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  for (let k = 0; k < 7; k++) {
    const d = new Date(hoy); d.setDate(hoy.getDate() + k);
    const n = lista.filter((x) => { const c = utc(x); return c >= d && c < new Date(d.getTime() + 864e5); }).length;
    const c = el('div', 'pg-semana-d' + (n ? ' on' : '')); const p = el('span', 'p');
    for (let j = 0; j < Math.min(n, 3); j++) p.append(el('i'));
    c.append(p, el('small', null, k ? DIA[d.getDay()] : 'hoy')); w.append(c);
  }
  return w;
}

/* ============ tarjeta de una sección ============ */
function tarjeta({ grupo, nombre, pagina, cifra, etiqueta, viz, nota, tono }) {
  const b = el('button', 'pg-sec' + (tono ? ' ' + tono : '')); b.type = 'button'; b.onclick = () => ir(pagina);
  const h = el('div', 'pg-sec-h');
  const ico = document.querySelector(`#pb-tabs button[data-page="${pagina}"]:not(#pb-nav-control) svg`);
  const i = el('i'); if (ico) i.append(ico.cloneNode(true));
  const t = el('span'); t.append(document.createTextNode(grupo + ' · '), el('b', null, nombre));
  const go = sv('svg', { viewBox: '0 0 24 24', class: 'go' }); go.append(sv('path', { d: 'm9 6 6 6-6 6' }));
  h.append(i, t, go);
  const n = el('div', 'pg-sec-n'); n.append(el('b', null, cifra), el('span', null, etiqueta));
  b.append(h, n);
  if (viz) { const v = el('div', 'pg-sec-v'); v.append(viz); b.append(v); }
  if (nota) b.append(el('p', 'pg-sec-p', nota));
  return b;
}

function draw() {
  if (!G || document.body.dataset.page !== 'resumen') return;
  box.textContent = '';
  const Sx = G.secciones || {}, S = G.salida || {}, C = G.caja, A = (G.agentes || []).filter((a) => a.dept !== 'embudo');
  const tarjetas = [];
  const sol = Sx.solicitudes;
  if (sol) tarjetas.push(tarjeta({ grupo: 'Embudo', nombre: 'Solicitudes', pagina: 'solicitudes', cifra: N(sol.mes), etiqueta: 'en los últimos 30 días',
    viz: barras(sol.serie, '#7E73FF'), nota: sol.sin_revisar ? `${N(sol.sin_revisar)} sin revisar` : 'Todas revisadas', tono: sol.sin_revisar ? 'aviso' : '' }));
  const ci = Sx.citas;
  if (ci) {
    const sig = ci.siguiente ? utc(ci.siguiente) : null;
    tarjetas.push(tarjeta({ grupo: 'Embudo', nombre: 'Citas', pagina: 'citas', cifra: N(ci.proximas), etiqueta: ci.proximas === 1 ? 'cita reservada' : 'citas reservadas',
      viz: semana(ci.lista || []), nota: sig ? `La próxima: ${DIA[sig.getDay()]} ${sig.getDate()} a las ${pad(sig.getHours())}:${pad(sig.getMinutes())}` : 'Ninguna reservada' }));
  }
  if (G.salida) {
    const E = S.estados || {};
    tarjetas.push(tarjeta({ grupo: 'Captación', nombre: 'Conversaciones', pagina: 'conversaciones', cifra: N(S.te_toca), etiqueta: S.te_toca === 1 ? 'te toca responder' : 'te toca responder',
      viz: tramos(ESTADOS.map(([k, l, col]) => [Number(E[k] || 0), col, l])), nota: `${N(S.escritas)} empresas escritas · ${N(S.interesados)} interesadas`, tono: S.te_toca ? 'aviso' : '' }));
  }
  const pr = Sx.prospectos;
  if (pr) tarjetas.push(tarjeta({ grupo: 'Captación', nombre: 'Prospectos', pagina: 'prospectos', cifra: N(pr.cola), etiqueta: 'en cola para escribir',
    viz: tramos([[pr.cola, '#B7FF3C', 'En cola'], [pr.escritas, '#7E73FF', 'Escritas'], [pr.revisar, '#FFB547', 'Por revisar']]),
    nota: pr.revisar ? `${N(pr.revisar)} esperan que las reviséis` : 'Nada por revisar', tono: pr.revisar ? 'aviso' : '' }));
  const mp = Sx.mapa;
  if (mp) tarjetas.push(tarjeta({ grupo: 'Captación', nombre: 'Mapa', pagina: 'mapa', cifra: mp.cobertura + '%', etiqueta: 'de España recorrido',
    viz: progreso(mp.cobertura, '#3FD5FF'), nota: mp.ahora ? `Buscando en ${mp.ahora}` : `${N(mp.prov_completas)} provincias completas` }));
  const qr = Sx.qr;
  if (qr) tarjetas.push(tarjeta({ grupo: 'Captación', nombre: 'QRs', pagina: 'qr', cifra: N(qr.mes), etiqueta: 'escaneos en 30 días',
    viz: barras(qr.serie, '#3FD5FF'), nota: qr.serie[qr.serie.length - 1] ? `${N(qr.serie[qr.serie.length - 1])} hoy` : 'Ninguno hoy' }));
  if (C) {
    const res = C.ingresos - C.gastos, mx = Math.max(1, C.ingresos, C.gastos);
    const v = el('div', 'pg-caja2');
    [['Ingresos', C.ingresos, '#B7FF3C'], ['Gastos', C.gastos, '#FF6B7A']].forEach(([l, x, col]) => {
      const r = el('div'); const bar = el('i'); bar.style.width = Math.max(2, x / mx * 100) + '%'; bar.style.background = col;
      r.append(el('span', null, l), bar, el('b', null, euros(x))); v.append(r);
    });
    tarjetas.push(tarjeta({ grupo: 'Empresa', nombre: 'Caja', pagina: 'caja', cifra: (res > 0 ? '+' : '') + euros(res), etiqueta: 'resultado de ' + MES[C.mes - 1], viz: v, tono: res < 0 ? 'mal' : '' }));
  }
  if (A.length) {
    const tr = A.filter((a) => a.st === 'trabajando').length, err = A.filter((a) => a.st === 'error');
    const v = el('div', 'pg-bots');
    A.forEach((a) => { const d = el('i'); const [col, l] = ST[a.st] || ST.dormido; d.style.background = col; d.title = `${a.nombre}: ${l}`; v.append(d); });
    tarjetas.push(tarjeta({ grupo: 'Automático', nombre: 'Agentes', pagina: 'agentes', cifra: `${tr}/${A.length}`, etiqueta: 'trabajando ahora',
      viz: v, nota: err.length ? `${err.map((a) => a.nombre).join(', ')}: con error` : 'Ninguno con error', tono: err.length ? 'mal' : '' }));
  }
  const g = el('div', 'pg-secs'); tarjetas.forEach((t, i) => { t.style.setProperty('--i', i); g.append(t); });
  box.append(g);
}

const refrescar = () => load().then(draw).catch(() => {});
document.addEventListener('pb:page', (e) => { if (e.detail === 'resumen') refrescar(); });
setInterval(() => { if (!document.hidden && document.body.dataset.page === 'resumen') refrescar(); }, 60000);
refrescar();
})();
