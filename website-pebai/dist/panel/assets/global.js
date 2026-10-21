/* PEBAI · Panel — Resumen global: toda la app de un vistazo. Datos en index.php?global=1.
   Va encima del embudo de solicitudes (panel.js). Textos con textContent: nunca innerHTML con datos. */
(() => {
'use strict';
const app = document.getElementById('pb-app');
const box = document.getElementById('pb-global');
if (!app || !box) return;
const BASE = app.dataset.base;
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const N = (n) => new Intl.NumberFormat('es-ES').format(n || 0);
const pct = (a, b) => (b ? Math.round((a / b) * 100) + ' %' : '—');
const euros = (c) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format((c || 0) / 100);
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const ir = (p) => { const b = document.querySelector(`#pb-tabs button[data-page="${p}"]`); if (b) b.click(); };
const ST = { trabajando: ['Trabajando', 'var(--green)'], espera: ['En espera', 'var(--cyan)'], dormido: ['Dormido', 'var(--muted-2)'], pausado: ['En pausa', 'var(--amber)'], error: ['Necesita atención', 'var(--red)'] };
let G = null;

async function load() {
  const r = await fetch(BASE + '?global=1', { credentials: 'same-origin', cache: 'no-store' });
  if (r.status === 401 || r.redirected) return;
  const j = await r.json();
  if (j.ok) G = j;
}

function tile(label, value, sub, frac, onClick) {
  const t = el('button', 'pg-tile'); t.type = 'button';
  t.append(el('small', null, label), el('b', null, value));
  if (frac != null) { const bar = el('i', 'pg-bar'); const f = el('i'); f.style.width = Math.min(100, Math.round(frac * 100)) + '%'; bar.append(f); t.append(bar); }
  if (sub) t.append(el('span', null, sub));
  if (onClick) t.onclick = onClick; else t.disabled = true;
  return t;
}

function draw() {
  if (!G || document.body.dataset.page !== 'resumen') return;
  box.textContent = '';
  const H = G.hoy || {}, S = G.salida || {}, E = G.entrada || {}, C = G.caja;

  // 1. Hoy
  const hoy = el('div', 'pg-hoy');
  hoy.append(
    tile('WhatsApp hoy', `${N(H.wa)} / ${N(H.wa_cupo)}`, 'primeros mensajes', H.wa_cupo ? H.wa / H.wa_cupo : 0, () => ir('agentes')),
    tile('Email hoy', `${N(H.email)} / ${N(H.email_cupo)}`, 'primeros emails', H.email_cupo ? H.email / H.email_cupo : 0, () => ir('agentes')),
    tile('Han contestado hoy', N(H.respuestas), 'empresas', null, () => ir('conversaciones')),
    tile('Solicitudes hoy', N(H.solicitudes), 'del formulario', null, () => ir('solicitudes')));
  box.append(hoy);

  const fila = el('div', 'pg-fila');
  // 2. Te toca
  const toca = el('div', 'pb-card pg-toca');
  const th = el('div', 'hd'); const tt = el('div');
  tt.append(el('h2', null, S.te_toca ? `Te toca responder a ${N(S.te_toca)}` : 'Nada pendiente de responder'),
    el('p', 'note', S.te_toca ? `${N(S.listas_para_aprobar)} con la respuesta ya preparada por la IA: solo revisarla y enviar.` : 'Cuando una empresa conteste, la IA te dejará la respuesta preparada aquí.'));
  th.append(tt); toca.append(th);
  const ul = el('div', 'pg-toca-l');
  (S.te_toca_lista || []).forEach((f) => {
    const b = el('button', 'pg-toca-i'); b.type = 'button';
    b.append(el('b', null, f.empresa), el('span', null, f.resumen || 'Ha contestado'), el('em', f.lista ? 'ok' : '', f.lista ? 'Respuesta lista' : 'Preparando…'));
    b.onclick = () => { ir('conversaciones'); document.dispatchEvent(new CustomEvent('pb:abrir-conv', { detail: f.k })); };
    ul.append(b);
  });
  toca.append(ul);
  // 3. Agentes
  const ag = el('div', 'pb-card pg-ag');
  ag.append(el('h2', null, 'Agentes'));
  (G.agentes || []).forEach((a) => {
    const [l, c] = ST[a.st] || [a.st, 'var(--muted)'];
    const r = el('button', 'pg-ag-i'); r.type = 'button'; r.title = a.motivo;
    const dot = el('i'); dot.style.background = c;
    const tx = el('div'); tx.append(el('b', null, a.nombre), el('span', null, a.motivo));
    r.append(dot, tx, el('em', null, a.cupo ? `${N(a.hoy)}/${N(a.cupo)}` : l));
    r.onclick = () => ir('agentes');
    ag.append(r);
  });
  fila.append(toca, ag);
  box.append(fila);

  // 4. El camino de una empresa (captación de salida)
  const cam = el('div', 'pb-card pg-camino');
  cam.append(el('h2', null, 'Captación: el camino de cada empresa'),
    el('p', 'note', `Desde que entra en la cola hasta la cita. ${N(S.contestadores)} contestadores automáticos y ${N(S.no)} que no quieren, aparte.`));
  const pasos = [
    ['En cola', S.cola_wa + S.cola_email, `${N(S.listas_wa)} WhatsApp con mensaje listo · ${N(S.cola_email)} email`, 'prospectos'],
    ['Escritas', S.escritas, `${N(S.escritas_wa)} WhatsApp · ${N(S.escritas - S.escritas_wa)} email`, 'conversaciones'],
    ['Contestaron', S.contestaron, 'personas, sin contestadores', 'conversaciones'],
    ['Interesadas', S.interesados, 'piden más o quieren hablar', 'conversaciones'],
    ['Citas', S.citas, 'videollamada reservada', 'citas'],
  ];
  const fl = el('div', 'pg-pasos');
  pasos.forEach(([t, n, sub, p], i) => {
    if (i > 1) { const a = el('div', 'pg-flecha'); a.append(el('span', null, pct(n, pasos[i - 1][1]))); fl.append(a); } else if (i === 1) fl.append(el('div', 'pg-flecha vacia'));
    const s = el('button', 'pg-paso'); s.type = 'button'; s.append(el('small', null, t), el('b', null, N(n)), el('span', null, sub)); s.onclick = () => ir(p);
    fl.append(s);
  });
  cam.append(fl);
  box.append(cam);

  // 5. Embudo de entrada + caja
  const f2 = el('div', 'pg-fila');
  const ent = el('div', 'pb-card pg-mini');
  ent.append(el('h2', null, 'Solicitudes del formulario'));
  const eg = el('div', 'pg-mini-g');
  [['Solicitudes', E.solicitudes, 'solicitudes'], ['Sin revisar', E.sin_revisar, 'solicitudes'], ['Citas próximas', E.citas_proximas, 'citas'], ['Clientes', E.clientes, 'solicitudes']]
    .forEach(([l, v, p]) => { const b = el('button'); b.type = 'button'; b.append(el('small', null, l), el('b', null, N(v))); b.onclick = () => ir(p); eg.append(b); });
  ent.append(eg, el('p', 'note', 'El detalle del embudo de entrada está justo debajo.'));
  f2.append(ent);
  if (C) {
    const cj = el('div', 'pb-card pg-mini');
    cj.append(el('h2', null, 'Caja de ' + MESES[C.mes - 1]));
    const cg = el('div', 'pg-mini-g');
    const res = C.ingresos - C.gastos;
    [['Ingresos', euros(C.ingresos), ''], ['Gastos', euros(C.gastos), ''], ['Resultado', euros(res), res < 0 ? 'neg' : 'pos']]
      .forEach(([l, v, cl]) => { const b = el('button', cl); b.type = 'button'; b.append(el('small', null, l), el('b', null, v)); b.onclick = () => ir('caja'); cg.append(b); });
    cj.append(cg);
    f2.append(cj);
  }
  box.append(f2);
  box.append(el('h2', 'pg-sep', 'Embudo de entrada · solicitudes del formulario'));
}

const refrescar = () => load().then(draw).catch(() => {});
document.addEventListener('pb:page', (e) => { if (e.detail === 'resumen') refrescar(); });
setInterval(() => { if (!document.hidden && document.body.dataset.page === 'resumen') refrescar(); }, 60000);
refrescar();
})();
