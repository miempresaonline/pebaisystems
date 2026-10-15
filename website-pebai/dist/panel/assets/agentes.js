/* PEBAI · Panel — secciones Captación (prospectos) y Automático (agentes). Datos en index.php?agentes=1.
   Todo texto que viene de prospectos o mensajes se pinta con textContent: nunca innerHTML con datos. */
(() => {
'use strict';
const app = document.getElementById('pb-app');
if (!app) return;
const BASE = app.dataset.base;
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const S = { loaded: false, csrf: app.dataset.csrf };
const ui = { estado: '', q: '', lote: '', limit: 150 };

/* ============ dominio ============ */
const PE = {
  pendiente: ['En cola', '#3A404D', '#C9CED8'], enviando: ['Enviando…', '#6A5CFF', '#FFFFFF'], enviado: ['Enviado', '#6A5CFF', '#FFFFFF'],
  respondio: ['Respondió', '#25D366', '#0B0F14'], baja: ['Baja', '#FF6B7A', '#0B0F14'], sin_whatsapp: ['Sin WhatsApp', '#3A404D', '#C9CED8'],
  error: ['Revisar', '#FFB547', '#0B0F14'], descartado: ['Descartado', '#3A404D', '#C9CED8'],
};
const CHIPS = [['', 'Todos', '#EFEDE7'], ['pendiente', 'En cola', '#9A9CB0'], ['enviado', 'Sin respuesta aún', '#6A5CFF'], ['respondio', 'Respondieron', '#25D366'],
  ['error', 'Revisar', '#FFB547'], ['baja', 'Bajas', '#FF6B7A'], ['sin_whatsapp', 'Sin WhatsApp', '#3A404D'], ['descartado', 'Descartados', '#3A404D']];
const PAGINAS = { resumen: ['Embudo', 'Resumen'], solicitudes: ['Embudo', 'Solicitudes'], citas: ['Embudo', 'Citas'], prospectos: ['Captación', 'Prospectos'], agentes: ['Automático', 'Agentes'] };
const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const pad = (n) => String(n).padStart(2, '0');
const parse = (s) => s ? new Date(String(s).replace(' ', 'T')) : null;
const N = (n) => n == null ? '—' : new Intl.NumberFormat('es-ES').format(n);
const pct = (a, b) => b ? Math.round(a / b * 100) + ' %' : '—';
const hace = (d) => {
  if (!d || isNaN(d)) return '—';
  const m = Math.round((S.ahora - d) / 60000);
  if (m < 1) return 'ahora mismo'; if (m < 60) return 'hace ' + m + ' min';
  const h = Math.round(m / 60); if (h < 24) return 'hace ' + h + ' h';
  const dd = Math.round(h / 24); return dd === 1 ? 'ayer' : 'hace ' + dd + ' días';
};
const cuando = (d) => d && !isNaN(d) ? `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]} · ${pad(d.getHours())}:${pad(d.getMinutes())}` : '—';
const telBonito = (t) => { const s = String(t || ''); return s.startsWith('34') && s.length === 11 ? '+34 ' + s.slice(2, 5) + ' ' + s.slice(5, 7) + ' ' + s.slice(7, 9) + ' ' + s.slice(9) : '+' + s; };
const iniciales = (s) => (String(s || '?').replace(/[^\p{L}\p{N} ]/gu, '').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('') || '?').toUpperCase();

/* ============ utilidades de DOM ============ */
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const svg = (inner, cls) => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', cls || 'pb-i'); s.innerHTML = inner; return s; };
const ICO = {
  wa: () => { const b = (window.PB_ICONS && window.PB_ICONS.brands && window.PB_ICONS.brands.whatsapp) || null; const s = svg(b ? `<path d="${b.d}"/>` : '<circle cx="12" cy="12" r="9"/>', ''); return s; },
  pausa: () => svg('<path d="M9 5v14M15 5v14"/>'), play: () => svg('<path d="m7 4 13 8-13 8z"/>'),
  chat: () => svg('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>'), stop: () => svg('<circle cx="12" cy="12" r="9"/><path d="m5.7 5.7 12.6 12.6"/>'),
  back: () => svg('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>'), x: () => svg('<path d="M18 6 6 18M6 6l12 12"/>'),
};
const badge = (estado) => { const [l, bg, fg] = PE[estado] || PE.pendiente; const s = el('span', 'pb-badge', l); s.style.background = bg; s.style.color = fg; return s; };
const btn = (cls, ico, text, onClick, title) => { const b = el('button', 'pb-btn ' + cls); b.type = 'button'; if (ico) b.append(ico); if (text) b.append(text); if (title) b.title = title; if (onClick) b.addEventListener('click', onClick); return b; };
const toast = (msg, err) => { const t = $('#pb-toast'); $('span', t).textContent = msg; t.classList.toggle('err', !!err); t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 3200); };

/* ============ datos ============ */
async function load() {
  const r = await fetch(BASE + '?agentes=1', { credentials: 'same-origin', cache: 'no-store' });
  if (r.status === 401 || r.redirected) { location.reload(); return; }
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || 'Error al cargar');
  Object.assign(S, j, { ahora: parse(j.ahora), loaded: true });
  S.porProspecto = new Map();
  (j.mensajes || []).forEach((m) => { if (!S.porProspecto.has(m.prospecto_id)) S.porProspecto.set(m.prospecto_id, []); S.porProspecto.get(m.prospecto_id).push(m); });
}
async function post(action, fields, btnEl) {
  const body = fields instanceof FormData ? fields : new URLSearchParams(fields);
  body.set('action', action); body.set('csrf', S.csrf);
  if (btnEl) btnEl.disabled = true;
  try {
    const r = await fetch(BASE, { method: 'POST', body, credentials: 'same-origin', headers: { Accept: 'application/json' } });
    if (r.status === 401) { location.reload(); return {}; }
    let j = {}; try { j = await r.json(); } catch (e) { j = { ok: false, error: 'Respuesta inesperada del servidor.' }; }
    if (!j.ok) throw new Error(j.error || 'No se ha podido guardar.');
    await load(); draw();
    return j;
  } finally { if (btnEl) btnEl.disabled = false; }
}

/* ============ estado del agente ============ */
function estadoAgente() {
  const w = S.whatsapp || {};
  const lat = parse(w.latido_at);
  const mins = lat ? (S.ahora - lat) / 60000 : Infinity;
  if (!w.estado || w.estado === 'sin_arrancar') return { s: 'off', t: 'Sin arrancar', d: 'El proceso del servidor aún no se ha conectado nunca.' };
  if (mins > 30) return { s: 'bad', t: 'Sin señal', d: 'No responde desde ' + hace(lat) + '. Hay que volver a arrancarlo en el servidor.' };
  if (w.estado === 'esperando_vinculo') return { s: 'warn', t: 'Esperando vinculación', d: 'Vincula el WhatsApp con el código de abajo.' };
  if (w.estado === 'desvinculado') return { s: 'bad', t: 'Desvinculado', d: 'WhatsApp cerró la sesión. Se pedirá un código nuevo.' };
  if (w.estado === 'reconectando') return { s: 'warn', t: 'Reconectando', d: w.detalle || 'Recuperando la conexión.' };
  if (w.pausado) return { s: 'warn', t: 'En pausa', d: 'Conectado, pero no envía hasta que lo reanudes.' };
  if (w.enviados_hoy >= w.limite_dia) return { s: 'ok', t: 'Cupo de hoy hecho', d: 'Ha enviado los ' + w.limite_dia + ' de hoy. Sigue mañana.' };
  if (!w.abierta) return { s: 'ok', t: 'Conectado · fuera de horario', d: 'Siguiente tramo: ' + cuando(parse(w.proxima)) + '.' };
  return { s: 'ok', t: 'Trabajando', d: w.detalle || 'Dentro del horario: escribe con pausas de persona.' };
}
function pintaSidebar() {
  if (!S.loaded) return;
  const n = (S.prospectos || []).filter((p) => p.estado === 'pendiente').length;
  $('#pb-pros-n').textContent = N(n);
  const e = estadoAgente(); const live = $('#pb-ag-live');
  live.dataset.s = e.s; live.title = 'WhatsApp: ' + e.t;
}

/* ============ Captación · prospectos ============ */
function drawProspectos() {
  const P = S.prospectos || [];
  const cuenta = (k) => P.filter((p) => p.estado === k).length;
  const enviados = P.filter((p) => ['enviado', 'respondio', 'baja'].includes(p.estado) && p.enviado_at).length;
  const resp = cuenta('respondio') + P.filter((p) => p.estado === 'baja' && p.respondido_at).length;
  const pend = cuenta('pendiente');
  const lim = (S.whatsapp && S.whatsapp.limite_dia) || 30;
  const kp = $('#pb-pros-kpis'); kp.textContent = '';
  [[true, 'En cola', pend, pend ? '≈ ' + Math.ceil(pend / lim) + (Math.ceil(pend / lim) === 1 ? ' día' : ' días') + ' de envíos' : 'Añade prospectos para que trabaje'],
    [false, 'Enviados', enviados, 'en total'], [false, 'Respondieron', resp, pct(resp, enviados) + ' de tasa de respuesta'],
    [false, 'Bajas', S.bajas || 0, 'no se les vuelve a escribir'], [false, 'Revisar', cuenta('error'), 'envíos con incidencia']]
    .forEach(([hero, l, v, d], i) => {
      const c = el('div', 'pb-card pb-kpi pb-anim' + (hero ? ' hero' : '')); c.style.setProperty('--i', i);
      c.append(el('div', 'l', l), el('div', 'v', N(v)), el('div', 'd', d)); kp.append(c);
    });

  const ch = $('#pb-pros-chips'); ch.textContent = '';
  CHIPS.forEach(([k, l, c]) => {
    const n = k ? (k === 'enviado' ? cuenta('enviado') + cuenta('enviando') : cuenta(k)) : P.length;
    if (k && !n && !['pendiente', 'enviado', 'respondio'].includes(k)) return;
    const b = el('button', 'pb-chip' + (ui.estado === k ? ' on' : '')); b.type = 'button';
    const bar = el('i'); bar.style.background = c; b.append(bar, el('b', null, N(n)), el('small', null, l));
    b.addEventListener('click', () => { ui.estado = k; ui.limit = 150; drawProspectos(); });
    ch.append(b);
  });

  const sel = $('#pb-pros-lote'); const lotes = [...new Set(P.map((p) => p.lote).filter(Boolean))];
  if (sel.options.length - 1 !== lotes.length) { sel.length = 1; lotes.forEach((l) => sel.add(new Option(l, l))); sel.value = ui.lote; }

  const q = ui.q.toLowerCase();
  const rows = P.filter((p) => (!ui.estado || p.estado === ui.estado || (ui.estado === 'enviado' && p.estado === 'enviando'))
    && (!ui.lote || p.lote === ui.lote)
    && (!q || [p.empresa, p.nombre, p.telefono, p.sector, p.ciudad, p.notas].join(' ').toLowerCase().includes(q)));
  const list = $('#pb-pros-list'); list.textContent = '';
  if (!rows.length) {
    const e = el('div', 'pb-card pb-empty');
    e.textContent = P.length ? 'Nada con estos filtros.' : 'Aún no hay prospectos. Pulsa «Añadir prospectos» y sube la primera lista: el agente empieza a escribir en el siguiente tramo de horario.';
    list.append(e); return;
  }
  rows.slice(0, ui.limit).forEach((p) => list.append(filaProspecto(p)));
  if (rows.length > ui.limit) {
    const m = el('div', 'pb-more'); m.append(btn('ghost', null, 'Ver ' + N(Math.min(150, rows.length - ui.limit)) + ' más de ' + N(rows.length - ui.limit), () => { ui.limit += 150; drawProspectos(); })); list.append(m);
  }
}
function filaProspecto(p) {
  const row = el('div', 'pb-row pb-prow');
  const av = el('div', 'pb-avatar' + (p.estado === 'respondio' ? ' A' : ''), iniciales(p.empresa || p.nombre));
  const who = el('div', 'who');
  const emp = el('div', 'emp', p.empresa || 'Sin nombre');
  const sub = [p.nombre, p.sector, p.ciudad].filter(Boolean).join(' · '); if (sub) emp.append(el('span', null, sub));
  const meta = el('div', 'meta');
  meta.append(el('span', 'tel', telBonito(p.telefono)));
  if (p.lote) meta.append(el('span', 'sep', '·'), el('span', null, p.lote));
  if (p.error) meta.append(el('span', 'sep', '·'), el('span', 'err', p.error));
  who.append(emp, meta);
  const r = el('div', 'r');
  const ultima = p.estado === 'respondio' ? p.respondido_at : p.enviado_at || p.created_at;
  const top = el('div', null); top.style.cssText = 'display:flex;gap:8px;align-items:center';
  top.append(badge(p.estado));
  r.append(top, el('span', 'age', (p.estado === 'respondio' ? 'Respondió ' : p.enviado_at ? 'Enviado ' : 'Añadido ') + hace(parse(ultima))));
  const acts = el('div', 'acts');
  if (['enviado', 'respondio', 'error'].includes(p.estado)) {
    const a = el('a', 'pb-btn wa'); a.href = 'https://wa.me/' + p.telefono; a.target = '_blank'; a.rel = 'noopener'; a.append(ICO.chat(), 'Abrir chat'); acts.append(a);
  }
  if (['pendiente', 'error'].includes(p.estado)) acts.append(btn('ghost', null, 'Descartar', (e) => cambia(p, 'descartado', e.currentTarget)));
  if (['descartado', 'error', 'sin_whatsapp'].includes(p.estado)) acts.append(btn('ghost', ICO.back(), 'A la cola', (e) => cambia(p, 'pendiente', e.currentTarget)));
  if (p.estado !== 'baja') acts.append(btn('danger', null, 'Baja', (e) => { if (confirm('¿Dar de baja a ' + (p.empresa || telBonito(p.telefono)) + '? No se le volverá a escribir nunca.')) cambia(p, 'baja', e.currentTarget); }, 'Pidió no recibir más mensajes'));
  r.append(acts);
  row.append(av, who, r);
  const msgs = (S.porProspecto.get(p.id) || []);
  const ult = msgs.find((m) => m.sentido === 'entra') || msgs[0];
  if (ult) { const m = el('div', 'msg' + (ult.sentido === 'entra' ? ' in' : ''), (ult.sentido === 'entra' ? '↩ ' : '→ ') + ult.texto); row.append(m); }
  return row;
}
const cambia = (p, estado, b) => post('prospecto_estado', { id: p.id, estado }, b).then(() => toast(estado === 'baja' ? 'Dado de baja para siempre.' : estado === 'pendiente' ? 'Vuelve a la cola.' : 'Descartado.')).catch((e) => toast(e.message, true));

// Importación
const imp = $('#pb-import');
$('#pb-imp-abrir').addEventListener('click', () => { imp.hidden = !imp.hidden; if (!imp.hidden) imp.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); });
$('#pb-imp-cerrar').addEventListener('click', () => { imp.hidden = true; });
const drop = $('#pb-drop'); const fileIn = $('input[type=file]', drop);
const fichero = () => { $('#pb-drop-t').textContent = fileIn.files[0] ? fileIn.files[0].name : 'Suelta aquí el CSV'; };
fileIn.addEventListener('change', fichero);
['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('on'); }));
['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove('on'); }));
drop.addEventListener('drop', (e) => { if (e.dataTransfer.files.length) { fileIn.files = e.dataTransfer.files; fichero(); } });
$('#pb-imp-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.currentTarget; const b = $('button[type=submit]', f);
  post('prospectos_importar', new FormData(f), b).then((j) => {
    const r = j.res || {};
    const partes = [N(r.nuevos) + ' nuevos en cola'];
    if (r.repetidos) partes.push(N(r.repetidos) + ' ya estaban'); if (r.invalidos) partes.push(N(r.invalidos) + ' sin móvil válido');
    if (r.bajas) partes.push(N(r.bajas) + ' con baja'); if (r.embudo) partes.push(N(r.embudo) + ' ya son solicitudes');
    toast(partes.join(' · ') + '.'); f.reset(); fichero(); imp.hidden = true; ui.estado = 'pendiente';
  }).catch((er) => toast(er.message, true));
});
let qt; $('#pb-pros-q').addEventListener('input', (e) => { clearTimeout(qt); qt = setTimeout(() => { ui.q = e.target.value.trim(); ui.limit = 150; drawProspectos(); }, 150); });
$('#pb-pros-lote').addEventListener('change', (e) => { ui.lote = e.target.value; drawProspectos(); });

/* ============ Automático · agentes ============ */
function drawAgentes() {
  const w = S.whatsapp || {}; const e = estadoAgente();
  const box = $('#pb-ag-wa'); box.textContent = '';
  const card = el('div', 'pb-card pb-agent pb-anim'); card.dataset.s = e.s;

  const top = el('div', 'pb-agent-top');
  const tile = el('span', 'pb-tile xl'); tile.append(ICO.wa());
  const info = el('div');
  info.append(el('div', 'nm', 'Agente de WhatsApp'));
  const st = el('div', 'st'); const pill = el('span', 'state'); const dot = el('i', 'pb-live'); dot.dataset.s = e.s; pill.append(dot, e.t);
  st.append(pill, el('span', null, e.d));
  info.append(st);
  const sub = el('div', 'st'); sub.append(el('span', null, 'Escribe como Daniel · PEBAI Systems'), el('span', null, 'Último latido: ' + hace(parse(w.latido_at))));
  info.append(sub);

  const ring = el('div', 'pb-ring'); const R = 50, C = 2 * Math.PI * R; const frac = Math.min(1, (w.enviados_hoy || 0) / (w.limite_dia || 1));
  ring.innerHTML = `<svg viewBox="0 0 118 118"><defs><linearGradient id="pb-ring-g" x1="0" x2="1"><stop offset="0" stop-color="#B7FF3C"/><stop offset="1" stop-color="#6A5CFF"/></linearGradient></defs><circle class="bg" cx="59" cy="59" r="${R}"/><circle class="fg" cx="59" cy="59" r="${R}" stroke="url(#pb-ring-g)" stroke-dasharray="${C}" stroke-dashoffset="${C}"/></svg>`;
  const rc = el('div'); rc.append(el('b', null, N(w.enviados_hoy || 0)), el('small', null, 'de ' + N(w.limite_dia) + ' hoy')); ring.append(rc);
  const fgRing = $('.fg', ring); if ($('#page-agentes').classList.contains('pb-quiet')) fgRing.style.strokeDashoffset = C * (1 - frac); else requestAnimationFrame(() => requestAnimationFrame(() => { fgRing.style.strokeDashoffset = C * (1 - frac); }));

  const acts = el('div', 'acts');
  acts.append(w.pausado ? btn('primary', ICO.play(), 'Reanudar', (ev) => post('agente_pausa', { pausado: '0' }, ev.currentTarget).then(() => toast('Agente reanudado.')).catch((er) => toast(er.message, true)))
    : btn('', ICO.pausa(), 'Pausar', (ev) => post('agente_pausa', { pausado: '1' }, ev.currentTarget).then(() => toast('Agente en pausa: no enviará nada.')).catch((er) => toast(er.message, true))));
  top.append(tile, info, ring, acts);
  card.append(top);

  if (w.estado === 'esperando_vinculo' && w.codigo) {
    const pair = el('div', 'pb-pair');
    pair.append(el('h3', null, 'Vincula tu WhatsApp con este código'), el('p', null, 'Solo hace falta una vez. El código caduca en unos minutos; si pasa, aparece uno nuevo aquí solo.'));
    const code = el('div', 'pb-code'); const c = String(w.codigo).replace(/[^A-Z0-9]/gi, '').toUpperCase();
    [...c].forEach((ch, i) => { if (i === 4) code.append(el('i')); code.append(el('span', null, ch)); });
    const ol = el('ol'); ['Abre WhatsApp en el móvil → Ajustes → Dispositivos vinculados.', 'Pulsa «Vincular un dispositivo» y luego «Vincular con el número de teléfono».', 'Escribe el código. En unos segundos este panel pasará a «Conectado».'].forEach((t) => ol.append(el('li', null, t)));
    pair.append(code, ol); card.append(pair);
  }

  const P = S.prospectos || [];
  const env30 = (S.por_dia || []).filter((d) => d.sentido === 'sale').reduce((a, d) => a + Number(d.n), 0);
  const respondieron = P.filter((p) => p.respondido_at).length;
  const enviadosTot = P.filter((p) => p.enviado_at).length;
  const stats = el('div', 'pb-agent-stats');
  [['Enviados · 30 días', N(env30), null], ['Respondieron', N(respondieron), pct(respondieron, enviadosTot)], ['Bajas', N(S.bajas || 0), null], ['En cola', N(P.filter((p) => p.estado === 'pendiente').length), null]]
    .forEach(([l, v, x]) => { const d = el('div'); const b = el('b', null, v); if (x) b.append(el('em', null, x)); d.append(el('small', null, l), b); stats.append(d); });
  card.append(stats);
  box.append(card);

  // Actividad de 30 días + últimos mensajes
  const body = el('div', 'pb-agent-body');
  const act = el('div', 'pb-card');
  act.append(el('h2', null, 'Actividad · 30 días'), el('p', 'note', 'Mensajes enviados (violeta) y respuestas (lima) por día. Fines de semana y festivos, en reposo.'));
  const bars = el('div', 'pb-bars'); const dias = [];
  for (let i = 29; i >= 0; i--) { const d = new Date(S.ahora); d.setDate(d.getDate() - i); dias.push(d); }
  const k = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const val = (d, s) => Number(((S.por_dia || []).find((x) => x.d === k(d) && x.sentido === s) || {}).n || 0);
  const max = Math.max(5, ...dias.map((d) => val(d, 'sale') + val(d, 'entra')));
  dias.forEach((d, i) => {
    const o = val(d, 'sale'), n = val(d, 'entra'); const c = el('div', i === 29 ? 'hoy' : '');
    c.dataset.t = `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}: ${o} enviados · ${n} respuestas`;
    if (n) { const b = el('i', 'in'); b.style.height = (n / max * 100) + '%'; b.style.animationDelay = i * 15 + 'ms'; c.append(b); }
    const b = el('i'); b.style.height = (o / max * 100) + '%'; b.style.animationDelay = i * 15 + 'ms'; if (!o) b.style.opacity = '.25'; c.append(b);
    bars.append(c);
  });
  const axis = el('div', 'pb-axis'); axis.append(el('span', null, `${dias[0].getDate()} ${MESES[dias[0].getMonth()]}`), el('span', null, 'hoy'));
  act.append(bars, axis);

  const feedC = el('div', 'pb-card');
  feedC.append(el('h2', null, 'Últimos mensajes'), el('p', 'note', 'Lo que ha enviado el agente y lo que han contestado. Contestas tú desde el móvil.'));
  const feed = el('div', 'pb-feed');
  const ms = (S.mensajes || []).slice(0, 60);
  if (!ms.length) feed.append(el('div', 'pb-empty', 'Todavía no ha enviado nada.'));
  ms.forEach((m) => {
    const it = el('div', 'pb-msg ' + (m.sentido === 'entra' ? 'in' : 'out'));
    const av = el('div', 'pb-avatar', iniciales(m.empresa));
    const c = el('div'); const h = el('div', 'h');
    h.append(el('b', null, m.empresa || telBonito(m.telefono)), el('em', 'dir', m.sentido === 'entra' ? 'Respuesta' : 'Enviado'), el('span', null, cuando(parse(m.ts)) + ' · ' + hace(parse(m.ts))));
    c.append(h, el('div', 'bub', m.texto)); it.append(av, c); feed.append(it);
  });
  feedC.append(feed);
  body.append(act, feedC);
  box.append(body);
  box.append(configCard(w));
}
function configCard(w) {
  const d = el('details', 'pb-histbox pb-config');
  const s = el('summary'); s.append(svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'), 'Ajustes del agente', el('em', null, (w.limite_dia || 0) + '/día · ' + (w.ventanas || []).map((v) => v.join('–')).join(', ')));
  d.append(s);
  const f = el('form'); const g = el('div', 'grid');
  const left = el('div'); left.style.cssText = 'display:flex;flex-direction:column;gap:12px';
  const lim = el('label', 'pb-field'); lim.append(el('span', null, 'Mensajes nuevos al día')); const li = el('input'); li.name = 'limite_dia'; li.type = 'number'; li.min = 0; li.max = 200; li.value = w.limite_dia; lim.append(li);
  const ven = el('label', 'pb-field'); ven.append(el('span', null, 'Horario (lun–vie)')); const vi = el('input'); vi.name = 'ventanas'; vi.value = (w.ventanas || []).map((v) => v.join('-')).join(', '); ven.append(vi);
  left.append(lim, ven, el('p', 'note', 'Subir de golpe el cupo dispara los bloqueos de WhatsApp. Mejor de 10 en 10 por semana.'));
  const pl = el('label', 'pb-field'); pl.append(el('span', null, 'Plantillas del primer mensaje · separa cada una con una línea ---'));
  const ta = el('textarea'); ta.name = 'plantillas'; ta.value = (w.plantillas || []).join('\n---\n'); pl.append(ta);
  g.append(left, pl);
  const foot = el('div', 'foot');
  foot.append(el('p', null, '[saludo] = Buenos días / Buenas tardes · [nombre] = «, Ana» si lo sabemos · [empresa] · {a|b} elige una variante al azar. Cada plantilla debe presentarse como Daniel y ofrecer no volver a escribir.'));
  const sb = btn('primary', null, 'Guardar ajustes'); sb.type = 'submit'; foot.append(sb);
  f.append(g, foot);
  f.addEventListener('submit', (e) => { e.preventDefault(); post('agente_config', new URLSearchParams(new FormData(f)), sb).then(() => toast('Ajustes guardados. El agente los usa desde el siguiente envío.')).catch((er) => toast(er.message, true)); });
  d.append(f);
  if (configCard.abierto) d.open = true;
  d.addEventListener('toggle', () => { configCard.abierto = d.open; });
  return d;
}

/* ============ ciclo ============ */
function pagina() { return document.body.dataset.page || 'resumen'; }
function crumb(p) { const [a, b] = PAGINAS[p] || PAGINAS.resumen; const c = $('#pb-crumb'); c.textContent = ''; c.append(el('span', null, a), el('b', null, b)); }
function draw() {
  pintaSidebar();
  if (!S.loaded) return;
  const p = pagina();
  const sec = $('#page-' + p);
  if (p === 'prospectos') drawProspectos();
  if (p === 'agentes') {
    // No repintar mientras se editan los ajustes (se perdería lo escrito)
    const cfg = $('#pb-ag-wa .pb-config'); if (cfg && cfg.contains(document.activeElement)) return;
    drawAgentes();
  }
  // Las animaciones de entrada solo la primera vez: el refresco de cada minuto no hace parpadear nada
  if (sec && ['prospectos', 'agentes'].includes(p)) requestAnimationFrame(() => setTimeout(() => sec.classList.add('pb-quiet'), 1200));
}
const refrescar = () => load().then(draw).catch((e) => { if (['prospectos', 'agentes'].includes(pagina())) toast(e.message || 'No se han podido cargar los agentes.', true); });
document.addEventListener('pb:page', (e) => { crumb(e.detail); $$('.pb-quiet').forEach((x) => x.classList.remove('pb-quiet')); draw(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) refrescar(); });
// Cada minuto; cada 8 s mientras espera la vinculación, para que el código nuevo aparezca enseguida
let ultimo = 0;
setInterval(() => {
  const rapido = S.whatsapp && S.whatsapp.estado === 'esperando_vinculo' && pagina() === 'agentes';
  if (!document.hidden && Date.now() - ultimo >= (rapido ? 8000 : 60000)) { ultimo = Date.now(); refrescar(); }
}, 4000);
crumb(pagina());
refrescar();
})();
