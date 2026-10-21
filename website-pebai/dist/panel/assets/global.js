/* PEBAI · Panel — Resumen global: toda la app de un vistazo, para verlo (no para leerlo). Datos en index.php?global=1.
   Va encima del embudo de solicitudes (panel.js). Textos con textContent: nunca innerHTML con datos. */
(() => {
'use strict';
const app = document.getElementById('pb-app');
const box = document.getElementById('pb-global');
if (!app || !box) return;
const BASE = app.dataset.base;
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const sv = (tag, a) => { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); Object.entries(a || {}).forEach(([k, v]) => e.setAttribute(k, v)); return e; };
const N = (n) => new Intl.NumberFormat('es-ES').format(n || 0);
const pct = (a, b) => (b ? Math.round((a / b) * 100) + '%' : '—');
const euros = (c) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format((c || 0) / 100);
const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const ir = (p) => { const b = document.querySelector(`#pb-tabs button[data-page="${p}"]:not(#pb-nav-control)`); if (b) b.click(); };
const ST = { trabajando: ['var(--green)', 'Trabajando'], espera: ['var(--cyan)', 'En espera'], dormido: ['var(--muted-2)', 'Dormido'], pausado: ['var(--amber)', 'En pausa'], error: ['var(--red)', 'Revisar'] };
const ESTADOS = [['interesado', 'Interesadas', '#B7FF3C'], ['cita', 'Citas', '#25D366'], ['pregunta', 'Contestaron', '#3FD5FF'], ['sin_respuesta', 'Sin respuesta', '#6F7189'],
  ['auto', 'Contestador', '#9A9CB0'], ['no_interesado', 'No quieren', '#FF6B7A']];
let G = null;

async function load() {
  const r = await fetch(BASE + '?global=1', { credentials: 'same-origin', cache: 'no-store' });
  if (r.status === 401 || r.redirected) return;
  const j = await r.json();
  if (j.ok) G = j;
}

// Anillo de cupo: lo enviado hoy frente al cupo del día
function anillo(label, hoy, cupo, color, onClick) {
  const b = el('button', 'pg-ring'); b.type = 'button'; b.onclick = onClick;
  const R = 42, C = 2 * Math.PI * R, f = cupo ? Math.min(1, hoy / cupo) : 0;
  const s = sv('svg', { viewBox: '0 0 100 100', 'aria-hidden': 'true' });
  s.append(sv('circle', { cx: 50, cy: 50, r: R, class: 'trk' }));
  const fg = sv('circle', { cx: 50, cy: 50, r: R, class: 'val', stroke: color, 'stroke-dasharray': C, 'stroke-dashoffset': C, transform: 'rotate(-90 50 50)' });
  s.append(fg); requestAnimationFrame(() => requestAnimationFrame(() => fg.setAttribute('stroke-dashoffset', C * (1 - f))));
  const c = el('div', 'pg-ring-c'); c.append(el('b', null, N(hoy)), el('small', null, 'de ' + N(cupo)));
  const w = el('div', 'pg-ring-w'); w.append(s, c);
  b.append(w, el('span', null, label)); b.title = `${label}: ${hoy} de ${cupo} hoy`;
  return b;
}

// Número grande con icono (sin frases)
function cifra(label, n, ico, cls, onClick) {
  const b = el('button', 'pg-cifra ' + (cls || '')); b.type = 'button'; b.onclick = onClick;
  const i = el('i'); i.append(ico()); b.append(i, el('b', null, N(n)), el('span', null, label));
  return b;
}
const icono = (d) => () => { const s = sv('svg', { viewBox: '0 0 24 24' }); s.innerHTML = d; return s; };
const IC = {
  chat: icono('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>'),
  mano: icono('<path d="M12 8v5l3 2"/><circle cx="12" cy="12" r="9"/>'),
  form: icono('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>'),
  cal: icono('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>'),
};

// Embudo: barras que se estrechan (escala raíz para que lo pequeño se vea) y el % que pasa al siguiente paso
function embudo(S) {
  const c = el('div', 'pb-card pg-embudo');
  c.append(el('h2', null, 'De la cola a la cita'));
  const pasos = [['En cola', S.cola_wa + S.cola_email, '#6F7189', 'prospectos'], ['Escritas', S.escritas, '#7E73FF', 'conversaciones'],
    ['Contestaron', S.contestaron, '#3FD5FF', 'conversaciones'], ['Interesadas', S.interesados, '#B7FF3C', 'conversaciones'], ['Citas', S.citas, '#25D366', 'citas']];
  const max = Math.sqrt(Math.max(1, ...pasos.map((p) => p[1])));
  pasos.forEach(([l, n, col, p], i) => {
    if (i) { const pc = el('div', 'pg-emb-pct'); pc.append(el('span', null, '↓ ' + pct(n, pasos[i - 1][1]))); c.append(pc); }
    const f = el('button', 'pg-emb-f'); f.type = 'button'; f.onclick = () => ir(p); f.title = `${l}: ${N(n)}`;
    const bar = el('i'); bar.style.background = col; bar.style.width = Math.max(4, Math.sqrt(n) / max * 100) + '%';
    f.append(el('span', null, l), bar, el('b', null, N(n)));
    c.append(f);
  });
  return c;
}

// Donut: cómo van todas las conversaciones
function donut(E) {
  const c = el('div', 'pb-card pg-donut');
  c.append(el('h2', null, 'Conversaciones'));
  const rows = ESTADOS.map(([k, l, col]) => [k, l, col, Number((E || {})[k] || 0)]).filter((r) => r[3]);
  const tot = rows.reduce((a, r) => a + r[3], 0);
  const R = 40, C = 2 * Math.PI * R; const s = sv('svg', { viewBox: '0 0 100 100', role: 'img', 'aria-label': 'Estado de las conversaciones' });
  s.append(sv('circle', { cx: 50, cy: 50, r: R, class: 'trk' }));
  let acc = 0;
  rows.forEach(([k, l, col, n]) => {
    const len = C * n / tot; const gap = rows.length > 1 ? Math.min(2, len / 2) : 0;
    const seg = sv('circle', { cx: 50, cy: 50, r: R, fill: 'none', stroke: col, 'stroke-width': 12, 'stroke-dasharray': `${Math.max(0.4, len - gap)} ${C}`, 'stroke-dashoffset': -acc, transform: 'rotate(-90 50 50)' });
    const t = sv('title'); t.textContent = `${l}: ${n} (${pct(n, tot)})`; seg.append(t); s.append(seg); acc += len;
  });
  const w = el('button', 'pg-donut-w'); w.type = 'button'; w.onclick = () => ir('conversaciones');
  const cc = el('div', 'pg-ring-c'); cc.append(el('b', null, N(tot)));
  const sw = el('div', 'pg-ring-w'); sw.append(s, cc);
  const leg = el('div', 'pg-leg');
  rows.forEach(([, l, col, n]) => { const i = el('span'); const d = el('i'); d.style.background = col; i.append(d, el('span', null, l), el('b', null, N(n))); leg.append(i); });
  w.append(sw, leg); c.append(w);
  return c;
}

// Tendencia de 14 días: enviados (barras) y empresas que contestan (línea)
function tendencia(serie) {
  const c = el('div', 'pb-card pg-tend');
  const env = serie.reduce((a, d) => a + d.env, 0), resp = serie.reduce((a, d) => a + d.resp, 0);
  const h = el('div', 'pg-tend-h'); h.append(el('h2', null, '14 días'));
  const k = el('div', 'pg-tend-k');
  const kk = (v, l, col) => { const s = el('span'); const i = el('i'); i.style.background = col; s.append(i, el('b', null, v), el('small', null, l)); return s; };
  k.append(kk(N(env), 'escritas', 'var(--ch-wa)'), kk(N(resp), 'contestaron', 'var(--ch-line)'), kk(pct(resp, env), 'respuesta', 'transparent'));
  h.append(k); c.append(h);
  const W = 420, H = 110, B = 16; const max = Math.max(4, ...serie.map((d) => d.env)); const bw = W / serie.length;
  const s = sv('svg', { viewBox: `0 0 ${W} ${H}`, class: 'pg-tend-svg', role: 'img', 'aria-label': 'Enviados y respuestas por día, 14 días' });
  const y = (v) => (H - B) - (H - B - 6) * v / max;
  let line = '';
  serie.forEach((d, i) => {
    const x = i * bw; const w = bw * 0.62; const bh = (H - B) - y(d.env);
    const r = sv('rect', { x: x + (bw - w) / 2, y: y(d.env), width: w, height: Math.max(1.5, bh), rx: Math.min(3, w / 2), class: d.env ? 'b' : 'b cero' });
    const t = sv('title'); const f = new Date(d.d + 'T12:00'); t.textContent = `${f.getDate()} ${MES[f.getMonth()]}: ${d.env} escritas · ${d.resp} contestaron`; r.append(t); s.append(r);
    line += `${i ? 'L' : 'M'}${x + bw / 2},${y(d.resp)} `;
    if (i === 0 || i === serie.length - 1) { const tx = sv('text', { x: x + bw / 2, y: H - 3, 'text-anchor': i ? 'end' : 'start' }); tx.textContent = i ? 'hoy' : `${f.getDate()} ${MES[f.getMonth()]}`; s.append(tx); }
  });
  s.append(sv('path', { d: line, class: 'l' }));
  serie.forEach((d, i) => { if (d.resp) s.append(sv('circle', { cx: i * bw + bw / 2, cy: y(d.resp), r: 3.5, class: 'p' })); });
  c.append(s);
  return c;
}

function draw() {
  if (!G || document.body.dataset.page !== 'resumen') return;
  box.textContent = '';
  const H = G.hoy || {}, S = G.salida || {}, E = G.entrada || {}, C = G.caja;

  // Fila 1: hoy, para ver de un golpe
  const hoy = el('div', 'pg-hoy');
  hoy.append(anillo('WhatsApp hoy', H.wa, H.wa_cupo, 'var(--ch-wa)', () => ir('agentes')),
    anillo('Email hoy', H.email, H.email_cupo, 'var(--ch-em)', () => ir('agentes')),
    cifra('Contestaron hoy', H.respuestas, IC.chat, 'lima', () => ir('conversaciones')),
    cifra('Te toca', S.te_toca, IC.mano, S.te_toca ? 'ambar vivo' : '', () => ir('conversaciones')),
    cifra('Solicitudes', E.solicitudes, IC.form, '', () => ir('solicitudes')),
    cifra('Citas próximas', E.citas_proximas, IC.cal, E.citas_proximas ? 'verde' : '', () => ir('citas')));
  box.append(hoy);

  // Fila 2: embudo · conversaciones · tendencia
  const f2 = el('div', 'pg-f2');
  f2.append(embudo(S), donut(S.estados), tendencia(G.serie || []));
  box.append(f2);

  // Fila 3: a quién contestar · agentes · caja
  const f3 = el('div', 'pg-f3');
  if ((S.te_toca_lista || []).length) {
    const t = el('div', 'pb-card pg-toca'); t.append(el('h2', null, 'Te toca'));
    S.te_toca_lista.forEach((f) => {
      const b = el('button', 'pg-chip' + (f.lista ? ' ok' : '')); b.type = 'button'; b.title = f.resumen || '';
      b.append(el('i'), el('span', null, f.empresa));
      b.onclick = () => { ir('conversaciones'); document.dispatchEvent(new CustomEvent('pb:abrir-conv', { detail: f.k })); };
      t.append(b);
    });
    f3.append(t);
  }
  const ag = el('div', 'pb-card pg-ags'); ag.append(el('h2', null, 'Agentes'));
  const g = el('div', 'pg-ags-g');
  (G.agentes || []).forEach((a) => {
    const [col, l] = ST[a.st] || ['var(--muted)', a.st];
    const b = el('button', 'pg-ag ' + a.st); b.type = 'button'; b.title = a.motivo; b.onclick = () => ir('agentes');
    const dot = el('i'); dot.style.background = col;
    b.append(dot, el('b', null, a.nombre), el('span', null, a.cupo ? `${N(a.hoy)}/${N(a.cupo)}` : l));
    g.append(b);
  });
  ag.append(g); f3.append(ag);
  if (C) {
    const cj = el('button', 'pb-card pg-caja'); cj.type = 'button'; cj.onclick = () => ir('caja');
    const res = C.ingresos - C.gastos; const mx = Math.max(1, C.ingresos, C.gastos);
    cj.append(el('h2', null, 'Caja · ' + MES[C.mes - 1]));
    [['Ingresos', C.ingresos, 'var(--lime)'], ['Gastos', C.gastos, 'var(--red)']].forEach(([l, v, col]) => {
      const r = el('div', 'pg-caja-r'); const bar = el('i'); bar.style.width = Math.max(2, v / mx * 100) + '%'; bar.style.background = col;
      r.append(el('span', null, l), bar, el('b', null, euros(v))); cj.append(r);
    });
    cj.append(el('strong', res < 0 ? 'neg' : 'pos', (res >= 0 ? '+' : '') + euros(res)));
    f3.append(cj);
  }
  box.append(f3);
  box.append(el('h2', 'pg-sep', 'Solicitudes del formulario'));
}

const refrescar = () => load().then(draw).catch(() => {});
document.addEventListener('pb:page', (e) => { if (e.detail === 'resumen') refrescar(); });
setInterval(() => { if (!document.hidden && document.body.dataset.page === 'resumen') refrescar(); }, 60000);
refrescar();
})();
