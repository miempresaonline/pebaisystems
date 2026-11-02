/* PEBAI · Panel — Resumen al estilo «Glassy Dashboard»: tarjeta principal, cuatro cifras, gráfico grande, agentes y caja, y la actividad reciente.
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

/* ============ Resumen al estilo del «Glassy Dashboard» (01/11): tarjeta principal, cifras en cuadrícula (una destacada),
   gráfico grande, y abajo agentes, caja y mapa junto a la actividad reciente ============ */
const icoDe = (pagina) => { const s = document.querySelector(`#pb-tabs button[data-page="${pagina}"]:not(#pb-nav-control) svg`); return s ? s.cloneNode(true) : null; };
// Cifra pequeña: etiqueta arriba, icono en círculo a la derecha, número grande y una pastilla con el detalle
function cifra({ etiqueta, pagina, valor, pastilla, tono, destacada }) {
  const b = el('button', 'pgx-cifra' + (destacada ? ' destacada' : '') + (tono ? ' ' + tono : '')); b.type = 'button'; b.onclick = () => ir(pagina);
  const h = el('div', 'h'); const i = el('i'); const ic = icoDe(pagina); if (ic) i.append(ic);
  h.append(el('span', null, etiqueta), i);
  b.append(h, el('b', 'v', valor));
  if (pastilla) b.append(el('em', null, pastilla));
  return b;
}
// Barras grandes de 14 días, a dos tonos como las del vídeo (fondo oscuro + parte viva)
function barrasGrandes(serie, color) {
  const W = 360, H = 150, n = serie.length || 1, bw = W / n, max = Math.max(1, ...serie);
  const s = sv('svg', { viewBox: `0 0 ${W} ${H + 18}`, class: 'pgx-barras', 'aria-hidden': 'true', preserveAspectRatio: 'none' });
  const hoy = new Date();
  serie.forEach((v, i) => {
    const x = i * bw + bw * .2, w = bw * .6;
    s.append(sv('rect', { x, y: 4, width: w, height: H - 4, rx: w / 2, class: 'pista' }));
    const h = v ? Math.max(8, (H - 4) * v / max) : 0;
    if (h) s.append(sv('rect', { x, y: H - h, width: w, height: h, rx: w / 2, fill: color, opacity: i === n - 1 ? 1 : .78 }));
    if (i % 2 === (n - 1) % 2) { const d = new Date(hoy); d.setDate(hoy.getDate() - (n - 1 - i)); const t = sv('text', { x: x + w / 2, y: H + 15, class: 'eje' }); t.textContent = i === n - 1 ? 'hoy' : String(d.getDate()); s.append(t); }
  });
  return s;
}
let avisosRes = [];
const haceTxt = (ts) => { const m = Math.round((Date.now() - new Date(String(ts).replace(' ', 'T'))) / 60000); return m < 60 ? `hace ${Math.max(1, m)} min` : m < 1440 ? `hace ${Math.round(m / 60)} h` : `hace ${Math.round(m / 1440)} d`; };
const TIPO = { solicitud: ['Solicitud', '#B7FF3C'], cita: ['Cita', '#25D366'], interesado: ['Interesado', '#B7FF3C'], respuesta: ['Respuesta', '#3FD5FF'], demo: ['Demo abierta', '#FB923C'], ia: ['Claude', '#FF5E6C'] };

let firmaRes = '';
function draw() {
  if (!G || document.body.dataset.page !== 'resumen') return;
  // si nada ha cambiado desde la última vez, no se toca (así no parpadea cada minuto)
  const firma = JSON.stringify([G.secciones, G.salida, G.caja, (G.agentes || []).map((a) => a.st), avisosRes.map((a) => a.id)]);
  if (firma === firmaRes && box.firstChild) return;
  firmaRes = firma;
  box.textContent = '';
  const hr = new Date().getHours(), sal = document.getElementById('pb-saludo');
  if (sal) sal.textContent = hr < 6 ? 'Buenas noches' : hr < 14 ? 'Buenos días' : hr < 21 ? 'Buenas tardes' : 'Buenas noches';
  const Sx = G.secciones || {}, S = G.salida || {}, C = G.caja, A = (G.agentes || []).filter((a) => a.dept !== 'embudo');
  const sol = Sx.solicitudes, ci = Sx.citas, pr = Sx.prospectos, qr = Sx.qr, mp = Sx.mapa;
  const bento = el('div', 'pgx');

  // 1) Tarjeta principal: solicitudes de 30 días, con dos botones como los del vídeo
  const hero = el('div', 'pgx-hero');
  const hh = el('div', 'h'); hh.append(el('span', null, 'Solicitudes · 30 días'), el('em', null, sol && sol.sin_revisar ? `${N(sol.sin_revisar)} sin revisar` : 'Al día'));
  const big = el('b', 'v', N(sol ? sol.mes : 0));
  const btns = el('div', 'bt');
  const b1 = el('button', 'osc', 'Ver solicitudes'); b1.type = 'button'; b1.onclick = () => ir('solicitudes');
  const b2 = el('button', 'cla', 'Citas'); b2.type = 'button'; b2.onclick = () => ir('citas');
  btns.append(b1, b2);
  const sub = el('div', 'sub');
  const sig = ci && ci.siguiente ? utc(ci.siguiente) : null;
  [['Citas reservadas', N(ci ? ci.proximas : 0)], ['Próxima', sig ? `${DIA[sig.getDay()]} ${sig.getDate()} · ${pad(sig.getHours())}:${pad(sig.getMinutes())}` : '—'], ['Interesadas', N(S.interesados || 0)]]
    .forEach(([l, x]) => { const d = el('div'); d.append(el('small', null, l), el('b', null, x)); sub.append(d); });
  hero.append(hh, big, btns, sub);
  bento.append(hero);

  // 2) Cuatro cifras; la que más importa ahora, destacada en lima (como la verde del vídeo)
  const cuatro = el('div', 'pgx-cuatro');
  const teToca = S.te_toca || 0;
  cuatro.append(
    cifra({ etiqueta: 'Te toca responder', pagina: 'conversaciones', valor: N(teToca), pastilla: `${N(S.escritas || 0)} escritas`, destacada: teToca > 0 }),
    cifra({ etiqueta: 'En cola para escribir', pagina: 'prospectos', valor: N(pr ? pr.cola : 0), pastilla: pr && pr.revisar ? `${N(pr.revisar)} por revisar` : 'Nada por revisar', tono: pr && pr.revisar ? 'aviso' : '' }),
    cifra({ etiqueta: 'Escaneos de QR', pagina: 'qr', valor: N(qr ? qr.mes : 0), pastilla: '30 días' }),
    cifra({ etiqueta: 'España recorrida', pagina: 'mapa', valor: (mp ? mp.cobertura : 0) + '%', pastilla: mp && mp.ahora ? 'Buscando en ' + mp.ahora : `${N(mp ? mp.prov_completas : 0)} provincias` }),
  );
  bento.append(cuatro);

  // 3) Gráfico grande
  const graf = el('button', 'pgx-graf'); graf.type = 'button'; graf.onclick = () => ir('solicitudes');
  const gh = el('div', 'h'); gh.append(el('span', null, 'Solicitudes por día'), el('em', null, '14 días'));
  graf.append(gh, barrasGrandes(sol ? sol.serie : [], '#B7FF3C'));
  bento.append(graf);

  // 4) Columna: agentes, caja y mapa
  const col = el('div', 'pgx-col');
  if (A.length) {
    const tr = A.filter((a) => a.st === 'trabajando').length, err = A.filter((a) => a.st === 'error');
    const c = el('button', 'pgx-mini' + (err.length ? ' mal' : '')); c.type = 'button'; c.onclick = () => ir('agentes');
    const dots = el('div', 'dots'); A.forEach((a) => { const d = el('i'); const [colr, l] = ST[a.st] || ST.dormido; d.style.background = colr; d.title = `${a.nombre}: ${l}`; dots.append(d); });
    c.append(el('span', null, 'Agentes trabajando'), el('b', null, `${tr}/${A.length}`), dots, el('small', null, err.length ? `${err.map((a) => a.nombre).join(', ')}: con error` : 'Ninguno con error'));
    col.append(c);
  }
  if (C) {
    const res = C.ingresos - C.gastos, mx = Math.max(1, C.ingresos, C.gastos);
    const c = el('button', 'pgx-mini' + (res < 0 ? ' mal' : '')); c.type = 'button'; c.onclick = () => ir('caja');
    const v = el('div', 'pg-caja2');
    [['Ingresos', C.ingresos, '#B7FF3C'], ['Gastos', C.gastos, '#FF6B7A']].forEach(([l, x, colr]) => {
      const r = el('div'); const bar = el('i'); bar.style.width = Math.max(2, x / mx * 100) + '%'; bar.style.background = colr;
      r.append(el('span', null, l), bar, el('b', null, euros(x))); v.append(r);
    });
    c.append(el('span', null, 'Caja de ' + MES[C.mes - 1]), el('b', null, (res > 0 ? '+' : '') + euros(res)), v);
    col.append(c);
  }
  bento.append(col);

  // 5) Actividad reciente (los avisos: solicitudes, citas, respuestas, demos abiertas)
  const act = el('div', 'pgx-act');
  const ah = el('div', 'h'); ah.append(el('span', null, 'Actividad reciente'), el('em', null, 'últimos 3 días'));
  act.append(ah);
  const tabla = el('div', 'filas');
  if (!avisosRes.length) tabla.append(el('p', 'vacio', 'Sin novedades en los últimos 3 días.'));
  avisosRes.slice(0, 6).forEach((a) => {
    const [tl, tc] = TIPO[a.tipo] || [a.tipo, '#8C8FA3'];
    const f = el('button', 'fila'); f.type = 'button';
    f.onclick = () => { const [t, x, y] = String(a.ir || '').split(':'); if (t === 'lead') document.dispatchEvent(new CustomEvent('pb:abrir-lead', { detail: Number(x) })); else if (t === 'conv') { ir('conversaciones'); setTimeout(() => document.dispatchEvent(new CustomEvent('pb:abrir-conv', { detail: x + ':' + y })), 150); } else if (t === 'pagina') ir(x); };
    const tag = el('span', 'tipo', tl); tag.style.setProperty('--c', tc);
    f.append(tag, el('b', null, a.titulo), el('small', null, a.texto || ''), el('time', null, haceTxt(a.ts)));
    tabla.append(f);
  });
  act.append(tabla);
  bento.append(act);

  box.append(bento);
}

async function cargaAvisosRes() {
  try { const r = await fetch(BASE + '?avisos_ultimos=1', { credentials: 'same-origin', cache: 'no-store' }); const j = await r.json(); if (j.ok) avisosRes = j.avisos || []; } catch (e) { /* sin avisos */ }
}

const refrescar = () => Promise.all([load(), cargaAvisosRes()]).then(draw).catch(() => {});
document.addEventListener('pb:page', (e) => { if (e.detail === 'resumen') refrescar(); });
setInterval(() => { if (!document.hidden && document.body.dataset.page === 'resumen') refrescar(); }, 60000);
refrescar();
})();
