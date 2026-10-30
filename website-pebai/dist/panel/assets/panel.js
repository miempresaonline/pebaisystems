/* PEBAI · Panel — sección Embudo (resumen, solicitudes, citas). Los datos llegan de index.php?data=1 y las acciones se envían por POST. */
(() => {
'use strict';
const app = document.getElementById('pb-app');
const BASE = app.dataset.base;
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

/* ============ dominio ============ */
const ESTADOS = {
  nuevo: ['Solicitud', '#B7FF3C', '#0B0F14'], contactado: ['En revisión', '#6A5CFF', '#FFFFFF'], cita: ['Cita agendada', '#25D366', '#0B0F14'],
  sesion: ['Sesión hecha', '#3FD5FF', '#0B0F14'], no_asistio: ['No se presentó', '#FF6B7A', '#0B0F14'], cliente: ['Cliente', '#FFB547', '#0B0F14'], descartado: ['Descartado', '#3A404D', '#C9CED8']
};
const PERIODOS = ['7', '30', '90', 'todo'];
const PASOS = ['Solicitudes', 'Revisadas', 'Con cita', 'Sesiones', 'Clientes'];
const EVENTOS = {
  nuevo: 'Solicitud recibida', contactado: 'En revisión', cita: 'Cita agendada', sesion: 'Sesión hecha', no_asistio: 'No se presentó',
  cliente: 'Cliente', descartado: 'Descartado', reserva: 'Reservó la sesión', reprogramada: 'Cambió la hora', cancelada: 'Canceló la cita',
  unida: 'Reserva unida', contacto: 'Contacto', canal: 'Canal',
};
/* Canal y dueño (acuerdo de colaboración). Las etiquetas llegan del servidor (PEBAI_CANALES); estos son los colores. */
const CANAL_COLOR = { salida_adrian: '#FFB547', salida_daniel: '#3FD5FF', seo_geo: '#B7FF3C', linkedin_daniel: '#0A66C2', anuncios: '#FF6BD6', redes: '#6A5CFF', pendiente: '#3A404D' };
const canalInfo = (k) => (S.canales || []).find((c) => c.clave === k) || { clave: k || 'pendiente', label: k || 'Sin asignar', dueno: '' };
const DUENO = { adrian: 'Adrián', daniel: 'Daniel', compartido: 'Los dos', '': 'Sin dueño' };
// De quién es el cliente, en una palabra (ficha y lista)
const QUIEN = { adrian: 'Adrián', daniel: 'Daniel', compartido: 'Los dos', '': 'Sin asignar' };
const FASES = [['Solicitud', ['nuevo']], ['Revisión', ['contactado']], ['Reserva', ['cita', 'reserva']], ['Sesión', ['sesion']]];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const pad = (n) => String(n).padStart(2, '0');
const parse = (s) => s ? new Date(String(s).replace(' ', 'T')) : null;
const parseUTC = (s) => s ? new Date(String(s).replace(' ', 'T') + (/Z|[+-]\d\d:?\d\d$/.test(String(s)) ? '' : 'Z')) : null; // Cal.com guarda las citas en UTC
const fecha = (d) => d && !isNaN(d) ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}` : '—';
const fechaCorta = (d) => d && !isNaN(d) ? `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]} · ${pad(d.getHours())}:${pad(d.getMinutes())}` : '—';
const pct = (x) => (x == null || isNaN(x)) ? '—' : Math.round(x * 100) + ' %';
const N = (n) => n == null ? '—' : new Intl.NumberFormat('es-ES').format(n);
const conCita = (l) => (l.cita_inicio && l.cita_estado !== 'cancelada') || ['cita', 'sesion', 'no_asistio', 'cliente'].includes(l.estado);
const stats = (rows) => ({
  total: rows.length,
  con_presupuesto: rows.filter((l) => l.opcion === 'A').length,
  contactadas: rows.filter((l) => l.estado !== 'nuevo').length,
  citas: rows.filter(conCita).length,
  sesiones: rows.filter((l) => ['sesion', 'cliente'].includes(l.estado)).length,
  ausencias: rows.filter((l) => l.estado === 'no_asistio').length,
  clientes: rows.filter((l) => l.estado === 'cliente').length,
});

/* ============ estado ============ */
const S = { leads: [], citas: [], eventos: new Map(), ahora: new Date(), ahoraUTC: new Date(), csrf: app.dataset.csrf, loaded: false, drawn: false, conocidas: null };
const ui = { page: 'resumen', periodo: '30', estado: null, fuente: null, opcion: null, canal: null, q: null, dim: 'fuente', sort: { col: 'total', dir: 'desc' }, sel: null, limit: 120 };

const readUrl = () => {
  const u = new URLSearchParams(location.search);
  if (u.get('id')) { ui.sel = Number(u.get('id')); ui.page = 'solicitudes'; }
  else if (['resumen', 'solicitudes', 'citas', 'conversaciones', 'prospectos', 'mapa', 'qr', 'agentes', 'caja', 'redes', 'web', 'gasto'].includes(u.get('tab'))) ui.page = u.get('tab');
  if (PERIODOS.includes(u.get('periodo'))) ui.periodo = u.get('periodo');
  ['estado', 'fuente', 'opcion', 'canal', 'q'].forEach((k) => { if (u.get(k)) ui[k] = u.get(k); });
};
const writeUrl = () => {
  const u = new URLSearchParams();
  if (ui.page !== 'resumen') u.set('tab', ui.page);
  if (ui.periodo !== '30') u.set('periodo', ui.periodo);
  ['estado', 'fuente', 'opcion', 'canal', 'q'].forEach((k) => { if (ui[k]) u.set(k, ui[k]); });
  if (ui.sel != null) u.set('id', ui.sel);
  const qs = u.toString();
  history.replaceState(null, '', BASE + (qs ? '?' + qs : ''));
};
const set = (patch) => { Object.assign(ui, patch); writeUrl(); draw(); };

const desde = (p) => p === 'todo' ? new Date(0) : new Date(S.ahora.getTime() - Number(p) * 86400000);
const enPeriodo = (l, p) => parse(l.created_at) >= desde(p);
const enPrev = (l, p) => { if (p === 'todo') return false; const d = parse(l.created_at); return d >= new Date(S.ahora.getTime() - 2 * Number(p) * 86400000) && d < desde(p); };

/* ============ cálculos ============ */
const calcResumen = (p) => {
  const cur = stats(S.leads.filter((l) => enPeriodo(l, p))), prev = stats(S.leads.filter((l) => enPrev(l, p)));
  const delta = (k) => p === 'todo' ? null : cur[k] - prev[k], share = (a, b) => b ? a / b : null;
  return { ...cur, d_total: delta('total'), d_citas: delta('citas'), d_clientes: delta('clientes'),
    p_presupuesto: share(cur.con_presupuesto, cur.total), p_contactadas: share(cur.contactadas, cur.total), p_citas: share(cur.citas, cur.total),
    p_sesiones: share(cur.sesiones, cur.citas), p_ausencias: share(cur.ausencias, cur.citas), p_clientes: share(cur.clientes, cur.total) };
};
const calcEmbudo = (p) => {
  const cur = stats(S.leads.filter((l) => enPeriodo(l, p))), prev = stats(S.leads.filter((l) => enPrev(l, p)));
  const keys = ['total', 'contactadas', 'citas', 'sesiones', 'clientes'];
  return keys.map((k, i) => ({ orden: i, paso: PASOS[i], valor: cur[k], anterior: p === 'todo' ? null : prev[k], perdida: i && cur[keys[i - 1]] ? 1 - cur[k] / cur[keys[i - 1]] : null }));
};
const calcPorDia = (p) => {
  const semanal = p === '90' || p === 'todo';
  if (!S.leads.length) return [];
  const d0 = p === 'todo' ? d3.min(S.leads, (l) => parse(l.created_at)) : desde(p);
  const inter = semanal ? d3.timeMonday : d3.timeDay;
  const buckets = inter.range(inter.floor(d0), inter.offset(inter.floor(S.ahora), 1));
  const idx = d3.rollup(S.leads.filter((l) => parse(l.created_at) >= d0), (v) => ({ solicitudes: v.length, con_presupuesto: v.filter((l) => l.opcion === 'A').length }), (l) => +inter.floor(parse(l.created_at)));
  return buckets.map((b) => ({ date: b, ...(idx.get(+b) || { solicitudes: 0, con_presupuesto: 0 }) }));
};
const KEYS = {
  fuente: (l) => (l.fuente || 'directo') + (l.medio ? ' · ' + l.medio : ''),
  campana: (l) => (l.campana || '(sin campaña)') + (l.contenido ? ' · ' + l.contenido : ''),
  palabra: (l) => l.palabra || '(sin palabra)',
  canal: (l) => canalInfo(l.canal_dueno).label,
};
const calcGrupo = (dim, p) => d3.rollups(S.leads.filter((l) => enPeriodo(l, p)), (v) => stats(v), KEYS[dim]).map(([clave, s]) => ({ clave, ...s, p_cita: s.total ? s.citas / s.total : null }));
const calcPorEstado = () => Object.fromEntries(Object.keys(ESTADOS).map((k) => [k, S.leads.filter((l) => l.estado === k).length]));
const citasClasificadas = () => {
  const leads = new Map(S.todos.map((l) => [l.id, l])), limite = new Date(S.ahoraUTC.getTime() - 3600000);
  return S.citas.filter((c) => c.estado === 'reservada').map((c) => { const d = parseUTC(c.inicio); return { ...c, d, lead: leads.get(c.lead_id) || null, tramo: c.lead_id === 0 ? 'sin_vincular' : d >= limite ? 'proximas' : 'pasadas' }; });
};

/* ============ utilidades de interfaz ============ */
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const badge = (estado) => { const [l, bg, fg] = ESTADOS[estado] || ESTADOS.nuevo; const s = el('span', 'pb-badge', l); s.style.background = bg; s.style.color = fg; return s; };
const canalPill = (l, small) => {
  const c = canalInfo(l.canal_dueno); const s = el('span', 'pb-canal-pill' + (small ? ' sm' : ''));
  s.style.setProperty('--c', CANAL_COLOR[c.clave] || '#3A404D'); s.append(el('i'), c.label);
  if (l.canal_revisar === '1') s.append(el('em', null, 'revisar'));
  if (l.canal_manual === '1') s.title = 'Corregido a mano';
  return s;
};
const toast = (msg, err) => { const t = $('#pb-toast'); $('span', t).textContent = msg; t.classList.toggle('err', !!err); t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 2800); };
const countUp = (node, to) => {
  if (!to || matchMedia('(prefers-reduced-motion: reduce)').matches) { node.textContent = N(to); return; }
  const t0 = performance.now(), dur = 900;
  const step = (t) => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); node.textContent = N(Math.round(to * e)); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
};

/* ============ datos y acciones ============ */
async function load() {
  const r = await fetch(BASE + '?data=1', { credentials: 'same-origin', cache: 'no-store' });
  if (r.status === 401 || r.redirected) { location.reload(); return; }
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || 'Error al cargar');
  S.canales = j.canales || []; S.conocio = j.conocio || {};
  // Solicitudes = solo las del formulario. Los clientes de trato directo (WhatsApp, email, llamada) van aparte.
  S.todos = j.leads; S.leads = j.leads.filter((l) => l.tipo !== 'cliente'); S.clientes = j.leads.filter((l) => l.tipo === 'cliente'); S.citas = j.citas; S.ahora = parse(j.ahora); S.ahoraUTC = new Date(j.ahora_utc); S.csrf = j.csrf; S.loaded = true;
  S.eventos = d3.group(j.eventos || [], (e) => e.lead_id);
  avisarNuevas();
}
async function post(action, fields) {
  const body = new URLSearchParams({ action, csrf: S.csrf, ...fields });
  const r = await fetch(BASE, { method: 'POST', body, credentials: 'same-origin', headers: { 'Accept': 'application/json' } });
  if (r.status === 401) { location.reload(); return {}; }
  let j = {}; try { j = await r.json(); } catch (e) { j = { ok: false, error: 'Respuesta inesperada del servidor.' }; }
  if (!j.ok) throw new Error(j.error || 'No se ha podido guardar.');
  await load();
  return j;
}
const act = async (action, fields, okMsg, btn) => {
  if (btn) btn.disabled = true;
  try { await post(action, fields); toast(okMsg); draw(); }
  catch (e) { toast(e.message, true); if (btn) btn.disabled = false; }
};

/* ============ navegación ============ */
/* Las secciones nuevas (Captación, Agentes) viven en agentes.js: se enteran del cambio de página por el evento pb:page. */
const marcaPagina = (p) => { $$('.pb-page').forEach((s) => s.classList.toggle('on', s.dataset.page === p)); $$('#pb-tabs button').forEach((b) => b.classList.toggle('on', b.dataset.page === p)); document.body.dataset.page = p; document.dispatchEvent(new CustomEvent('pb:page', { detail: p })); };
const showPage = (p) => { if (!p) return; marcaPagina(p); set({ page: p }); window.scrollTo({ top: 0 }); };
$('#pb-tabs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) showPage(b.dataset.page); });
$$('[data-go]').forEach((b) => b.addEventListener('click', () => showPage(b.dataset.go)));
$('#pb-periodo').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) set({ periodo: b.dataset.p }); });
$('#pb-dim').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; $$('#pb-dim button').forEach((x) => x.classList.toggle('on', x === b)); set({ dim: b.dataset.d }); });
$('#pb-theme').addEventListener('click', () => { const t = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light'; document.documentElement.dataset.theme = t; try { localStorage.setItem('pebai-panel-theme', t); } catch (e) {} draw(); });

const fEstado = $('#pb-f-estado'), fFuente = $('#pb-f-fuente'), fOpcion = $('#pb-f-opcion'), fCanal = $('#pb-f-canal'), fQ = $('#pb-q');
fCanal.addEventListener('change', () => set({ canal: fCanal.value || null, limit: 120 }));
Object.entries(ESTADOS).forEach(([k, v]) => fEstado.append(new Option(v[0], k)));
fEstado.addEventListener('change', () => set({ estado: fEstado.value || null, limit: 120 }));
fFuente.addEventListener('change', () => set({ fuente: fFuente.value || null, limit: 120 }));
fOpcion.addEventListener('change', () => set({ opcion: fOpcion.value || null, limit: 120 }));
fQ.addEventListener('input', () => { clearTimeout(fQ.h); fQ.h = setTimeout(() => set({ q: fQ.value.trim() || null, limit: 120 }), 160); });
$('#pb-limpiar').addEventListener('click', () => { fQ.value = ''; set({ estado: null, fuente: null, opcion: null, canal: null, q: null, limit: 120 }); });
document.addEventListener('keydown', (e) => {
  if (e.key === '/' && document.activeElement !== fQ && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && ui.sel == null) { e.preventDefault(); showPage('solicitudes'); fQ.focus(); }
  if (e.key === 'Escape') closeDetail();
});

const marcarVista = (id) => {
  const l = S.todos.find((x) => x.id === Number(id));
  if (!l || l.estado !== 'nuevo') return;
  l.estado = 'contactado'; // respuesta inmediata en pantalla; el servidor lo confirma
  post('visto', { id: l.id }).then(() => { toast(l.empresa + ' pasa a En revisión.'); draw(); }).catch(() => {});
};
const registrar = (id, tipo) => { post('contacto', { id, tipo }).then(draw).catch(() => {}); };
const openDetail = (id) => { marcarVista(id); $('#pb-drawer').classList.add('on'); $('#pb-veil').classList.add('on'); document.body.classList.add('pb-locked'); $('#pb-drawer').scrollTop = 0; set({ sel: id }); };
const closeDetail = () => { if (ui.sel == null) return; $('#pb-drawer').classList.remove('on'); $('#pb-veil').classList.remove('on'); document.body.classList.remove('pb-locked'); set({ sel: null }); };
$('#pb-cerrar').addEventListener('click', closeDetail);
$('#pb-veil').addEventListener('click', closeDetail);

/* ============ dibujo: resumen ============ */
const deltaEl = (e, v) => { e.classList.remove('up', 'down', 'flat'); if (v == null) { e.textContent = '—'; e.classList.add('flat'); return; } e.textContent = (v > 0 ? '+' : '') + N(v); e.classList.add(v > 0 ? 'up' : v < 0 ? 'down' : 'flat'); };

/* ============ plazas gratuitas del mes (oferta: 5 sesiones gratis al mes) ============ */
const PLAZAS_MES = 5;
// Ocupa plaza cada sesión reservada para ese mes; no cuentan las canceladas, las cambiadas ni quien no se presentó.
const plazasDe = (y, m) => new Set(citasClasificadas()
  .filter((c) => c.d.getFullYear() === y && c.d.getMonth() === m && c.asistencia !== 'no_asistio').map((c) => c.lead_id || c.uid)).size;
const plazasAhora = () => {
  const h = S.ahoraUTC || new Date(), y = h.getFullYear(), m = h.getMonth();
  const sig = m === 11 ? [y + 1, 0] : [y, m + 1];
  return { mes: m, usadas: plazasDe(y, m), sigMes: sig[1], sigUsadas: plazasDe(sig[0], sig[1]) };
};
function pintaPlazas(box) {
  if (!box) return;
  const p = plazasAhora(); box.replaceChildren();
  const fila = (mes, usadas, actual) => {
    const r = el('div', 'pb-plz' + (usadas >= PLAZAS_MES ? ' lleno' : '') + (actual ? '' : ' sig'));
    const dots = el('span', 'dots'); for (let i = 0; i < PLAZAS_MES; i++) dots.append(el('i', i < usadas ? 'on' : ''));
    const libres = Math.max(0, PLAZAS_MES - usadas);
    r.append(el('b', null, 'Plazas gratis de ' + MESES_L[mes]), dots, el('span', 't', usadas >= PLAZAS_MES ? 'Completo' : libres + (libres === 1 ? ' libre' : ' libres')));
    return r;
  };
  box.append(fila(p.mes, p.usadas, true), fila(p.sigMes, p.sigUsadas, false));
}
const MESES_L = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function drawResumen(p) {
  const r = calcResumen(p), emb = calcEmbudo(p), dia = calcPorDia(p);
  $$('#pb-kpis [data-k]').forEach((e) => {
    const f = e.dataset.k; e.classList.remove('pb-skel');
    if (f.startsWith('d_')) deltaEl(e, r[f]); else if (f.startsWith('p_')) e.textContent = pct(r[f]); else if (!S.drawn) countUp(e, r[f]); else e.textContent = N(r[f]);
  });
  const tk = $('#pb-takeaway'); tk.replaceChildren();
  const nombre = { 7: 'los últimos 7 días', 30: 'los últimos 30 días', 90: 'los últimos 90 días', todo: 'todo el histórico' }[p];
  const worst = emb.filter((x) => x.perdida != null).sort((a, b) => b.perdida - a.perdida)[0];
  tk.append('En ' + nombre + ': ', Object.assign(el('b'), { textContent: N(r.total) + ' solicitudes' }), ', ', Object.assign(el('b'), { textContent: N(r.citas) + ' citas' }), ' y ', Object.assign(el('b'), { textContent: N(r.clientes) + ' clientes' }), '. ');
  if (worst && worst.perdida > 0) tk.append('Donde más se pierde es entre ' + PASOS[worst.orden - 1].toLowerCase() + ' y ' + worst.paso.toLowerCase() + ': ', Object.assign(el('b'), { textContent: '−' + pct(worst.perdida) }), '.');
  else if (!r.total) tk.append('Todavía no hay solicitudes en este periodo.');
  drawSpark(dia); drawFunnel(emb); drawRitmo(p, dia); drawOrigen(p); drawAgenda($('#pb-proximas-mini'), 'proximas', 5);
}

/* ============ avisos en directo ============ */
const BASE_TITLE = 'Panel · PEBAI';
function avisarNuevas() {
  const ids = new Set(S.leads.map((l) => l.id));
  if (S.conocidas) {
    const nuevas = S.leads.filter((l) => !S.conocidas.has(l.id));
    nuevas.forEach((l) => {
      toast('Nueva solicitud: ' + l.empresa);
      try { let push = false; try { push = localStorage.getItem('pebai-push') === '1'; } catch (er) { /* nada */ } if (!push && window.Notification && Notification.permission === 'granted') { const n = new Notification('Nueva solicitud · PEBAI', { body: l.empresa + (l.objetivo ? ' · ' + l.objetivo : ''), icon: BASE + 'assets/favicon-192.png', tag: 'lead-' + l.id }); n.onclick = () => { window.focus(); openDetail(l.id); }; } } catch (e) {}
    });
    if (nuevas.length) ping();
  }
  S.conocidas = ids;
  const sinRevisar = S.leads.filter((l) => l.estado === 'nuevo').length;
  document.title = (sinRevisar ? '(' + sinRevisar + ') ' : '') + BASE_TITLE;
  const dot = $('#pb-leads-dot'); if (dot) dot.hidden = !sinRevisar;
}
function ping() {
  try { const a = new (window.AudioContext || window.webkitAudioContext)(); const o = a.createOscillator(), g = a.createGain(); o.type = 'sine'; o.frequency.value = 880; g.gain.setValueAtTime(.0001, a.currentTime); g.gain.exponentialRampToValueAtTime(.12, a.currentTime + .02); g.gain.exponentialRampToValueAtTime(.0001, a.currentTime + .5); o.connect(g).connect(a.destination); o.start(); o.stop(a.currentTime + .5); } catch (e) {}
}
// La campana (avisos al navegador y al móvil, también con el panel cerrado) vive en buscar.js.
// Abrir una solicitud desde el buscador o desde un aviso
document.addEventListener('pb:abrir-lead', (e) => { showPage('solicitudes'); openDetail(Number(e.detail)); });
setInterval(() => { if (!document.hidden && S.loaded && ui.sel == null) load().then(draw).catch(() => {}); }, 60000);

function drawSpark(rows) {
  const svg = d3.select('.pb-kpi .spark svg'); svg.selectAll('*').remove();
  if (rows.length < 2) return;
  const w = 200, h = 46;
  svg.attr('viewBox', `0 0 ${w} ${h}`).attr('preserveAspectRatio', 'none');
  const x = d3.scaleLinear([0, rows.length - 1], [0, w]), y = d3.scaleLinear([0, d3.max(rows, (d) => d.solicitudes) || 1], [h - 2, 6]);
  const area = d3.area().x((d, i) => x(i)).y0(h).y1((d) => y(d.solicitudes)).curve(d3.curveMonotoneX);
  const line = d3.line().x((d, i) => x(i)).y((d) => y(d.solicitudes)).curve(d3.curveMonotoneX);
  const g = svg.append('defs').append('linearGradient').attr('id', 'pb-sg').attr('x1', 0).attr('x2', 0).attr('y1', 0).attr('y2', 1);
  [[0, .35], [1, 0]].forEach(([o, a]) => g.append('stop').attr('offset', o).attr('stop-color', '#B7FF3C').attr('stop-opacity', a));
  svg.append('path').attr('d', area(rows)).attr('fill', 'url(#pb-sg)');
  svg.append('path').attr('d', line(rows)).attr('fill', 'none').attr('stroke', '#B7FF3C').attr('stroke-width', 1.5).attr('stroke-linejoin', 'round');
}

function drawFunnel(rows) {
  const box = $('#pb-embudo'), sel = d3.select(box); sel.selectAll('*').remove();
  const W = Math.max(280, box.clientWidth), rowH = 50, M = { l: 110, r: 80, t: 6, b: 6 }, H = rows.length * rowH + M.t + M.b;
  const max = d3.max(rows, (d) => Math.max(d.valor, d.anterior || 0)) || 1;
  const x = d3.scaleLinear([0, max], [0, W - M.l - M.r]);
  const svg = sel.append('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('width', '100%');
  const worst = rows.filter((d) => d.perdida != null).sort((a, b) => b.perdida - a.perdida)[0];
  const g = svg.selectAll('g').data(rows).join('g').attr('transform', (d, i) => `translate(${M.l},${M.t + i * rowH})`);
  g.append('text').attr('x', -12).attr('y', rowH / 2 - 2).attr('text-anchor', 'end').attr('dominant-baseline', 'middle').attr('fill', 'var(--fg)').attr('font-size', 13).attr('font-weight', 600).text((d) => d.paso);
  g.filter((d) => d.anterior != null).append('rect').attr('y', rowH / 2 + 10).attr('height', 4).attr('rx', 2).attr('width', (d) => x(d.anterior)).attr('fill', 'var(--line-2)');
  g.append('rect').attr('class', 'cur').attr('y', rowH / 2 - 16).attr('height', 26).attr('rx', 7).attr('width', S.drawn ? (d) => Math.max(x(d.valor), d.valor ? 6 : 0) : 0)
    .attr('fill', (d) => d === worst && d.perdida > 0 ? 'var(--red)' : d.orden === 4 ? 'var(--lime)' : 'var(--violet)').attr('opacity', (d) => d.orden === 4 ? 1 : .92);
  g.append('text').attr('class', 'val').attr('y', rowH / 2 - 3).attr('dominant-baseline', 'middle').attr('fill', 'var(--fg-strong)').attr('font-size', 14).attr('font-weight', 700).attr('x', (d) => x(d.valor) + 10).text((d) => N(d.valor));
  g.filter((d) => d.perdida != null && d.perdida > 0).append('text').attr('class', 'loss').attr('y', rowH / 2 - 3).attr('dominant-baseline', 'middle').attr('font-size', 11).attr('font-weight', 600)
    .attr('fill', (d) => d === worst ? 'var(--red)' : 'var(--muted)').text((d) => '−' + pct(d.perdida));
  g.each(function (d) { const v = d3.select(this).select('text.val').node(); const w = v ? v.getComputedTextLength() : 0; d3.select(this).select('text.loss').attr('x', x(d.valor) + 10 + w + 8); });
  if (!S.drawn) requestAnimationFrame(() => svg.selectAll('rect.cur').attr('width', (d) => Math.max(x(d.valor), d.valor ? 6 : 0)));
}

function drawRitmo(p, rows) {
  const box = $('#pb-ritmo'), tip = $('#pb-tip'), sel = d3.select(box); sel.selectAll('svg').remove();
  $('#pb-ritmo-note').textContent = (p === '90' || p === 'todo') ? 'Solicitudes por semana y cuántas llevan presupuesto.' : 'Solicitudes por día y cuántas llevan presupuesto.';
  if (!rows.length) { return; }
  const W = Math.max(280, box.clientWidth), H = 240, M = { l: 28, r: 8, t: 10, b: 26 };
  const svg = sel.insert('svg', '.pb-tip').attr('viewBox', `0 0 ${W} ${H}`).attr('width', '100%');
  const x = d3.scaleBand(rows.map((d) => +d.date), [M.l, W - M.r]).paddingInner(.3).paddingOuter(.1);
  const y = d3.scaleLinear([0, Math.max(3, d3.max(rows, (d) => d.solicitudes) || 0)], [H - M.b, M.t]).nice();
  const ticksY = y.ticks(Math.min(4, y.domain()[1]));
  svg.append('g').selectAll('line').data(ticksY).join('line').attr('x1', M.l).attr('x2', W - M.r).attr('y1', y).attr('y2', y).attr('stroke', 'var(--line)');
  svg.append('g').selectAll('text').data(ticksY).join('text').attr('x', M.l - 8).attr('y', y).attr('text-anchor', 'end').attr('dominant-baseline', 'middle').attr('font-size', 11).attr('fill', 'var(--muted)').text((d) => N(d));
  const every = Math.ceil(rows.length / Math.max(3, Math.floor((W - M.l) / 64)));
  svg.append('g').selectAll('text').data(rows.filter((d, i) => i % every === 0)).join('text').attr('x', (d) => x(+d.date) + x.bandwidth() / 2).attr('y', H - 8).attr('text-anchor', 'middle').attr('font-size', 11).attr('fill', 'var(--muted)').text((d) => d.date.getDate() + ' ' + MESES[d.date.getMonth()]);
  const bw = Math.min(32, x.bandwidth());
  const bars = svg.append('g').selectAll('g').data(rows).join('g').attr('transform', (d) => `translate(${x(+d.date) + (x.bandwidth() - bw) / 2},0)`);
  bars.append('rect').attr('class', 'pb-b1').attr('width', bw).attr('rx', Math.min(4, bw / 2)).attr('y', (d) => y(d.solicitudes)).attr('height', (d) => y(0) - y(d.solicitudes)).attr('fill', 'var(--violet)').attr('opacity', .85);
  bars.append('rect').attr('width', bw).attr('rx', Math.min(4, bw / 2)).attr('y', (d) => y(d.con_presupuesto)).attr('height', (d) => y(0) - y(d.con_presupuesto)).attr('fill', 'var(--lime)');
  bars.append('rect').attr('width', x.bandwidth()).attr('x', -(x.bandwidth() - bw) / 2).attr('y', M.t).attr('height', H - M.t - M.b).attr('fill', 'transparent')
    .on('mousemove', (ev, d) => {
      tip.replaceChildren(el('div', 'h', d.date.getDate() + ' ' + MESES[d.date.getMonth()] + ' ' + d.date.getFullYear()));
      [['var(--violet)', 'Solicitudes', d.solicitudes], ['var(--lime)', 'Con presupuesto', d.con_presupuesto]].forEach(([c, n, v]) => { const r = el('div', 'r'); const i = el('i'); i.style.background = c; r.append(i, n + ': ', Object.assign(el('b'), { textContent: N(v) })); tip.append(r); });
      const bx = box.getBoundingClientRect(); let lx = ev.clientX - bx.left + 12, ly = ev.clientY - bx.top - 10;
      if (lx + 170 > bx.width) lx -= 190; tip.style.left = lx + 'px'; tip.style.top = ly + 'px'; tip.classList.add('on');
      bars.selectAll('.pb-b1').attr('opacity', (e) => e === d ? 1 : .55);
    })
    .on('mouseleave', () => { tip.classList.remove('on'); bars.selectAll('.pb-b1').attr('opacity', .85); });
}

function drawOrigen(p) {
  const table = $('#pb-origen'), tb = $('tbody', table);
  $('th[data-field=clave]', table).textContent = { fuente: 'Fuente · medio', campana: 'Campaña · contenido', palabra: 'Palabra clave', canal: 'Canal · dueño' }[ui.dim];
  $$('th', table).forEach((th) => th.setAttribute('aria-sort', th.dataset.field === ui.sort.col ? (ui.sort.dir === 'desc' ? 'descending' : 'ascending') : 'none'));
  tb.replaceChildren();
  const { col, dir } = ui.sort;
  const rows = calcGrupo(ui.dim, p).sort((a, b) => { const va = a[col], vb = b[col]; const c = col === 'clave' ? String(va).localeCompare(String(vb)) : (va ?? -1) - (vb ?? -1); return dir === 'desc' ? -c : c; });
  if (!rows.length) { const tr = el('tr'); const td = el('td', 'pb-empty', 'Todavía no hay solicitudes en este periodo.'); td.colSpan = 7; tr.append(td); tb.append(tr); return; }
  const max = d3.max(rows, (r) => r.total) || 1;
  rows.forEach((r) => {
    const tr = el('tr'); tr.dataset.clave = r.clave;
    const k = el('td', 'k'); k.append(r.clave); const bar = el('div', 'pb-bar'); const sp = el('span'); bar.append(sp); k.append(bar); tr.append(k);
    ['total', 'con_presupuesto', 'citas', 'sesiones', 'clientes'].forEach((c) => tr.append(el('td', 'n', N(r[c]))));
    tr.append(el('td', 'n', pct(r.p_cita))); tb.append(tr);
    requestAnimationFrame(() => { sp.style.width = Math.round(r.total * 100 / max) + '%'; });
  });
}
$('#pb-origen thead').addEventListener('click', (e) => { const th = e.target.closest('th'); if (!th) return; const c = th.dataset.field; set({ sort: { col: c, dir: ui.sort.col === c && ui.sort.dir === 'desc' ? 'asc' : 'desc' } }); });
$('#pb-origen tbody').addEventListener('click', (e) => {
  const tr = e.target.closest('tr[data-clave]'); if (!tr) return;
  const clave = tr.dataset.clave;
  fQ.value = '';
  if (ui.dim === 'canal') { const c = (S.canales || []).find((x) => x.label === clave); Object.assign(ui, { canal: c ? c.clave : null, fuente: null, estado: null, opcion: null, q: null }); }
  else if (ui.dim === 'fuente') { const f = clave.split(' · ')[0]; Object.assign(ui, { fuente: f === 'directo' ? '(directo)' : f, canal: null, estado: null, opcion: null, q: null }); }
  else { const q = clave.split(' · ')[0].replace(/[()]/g, ''); Object.assign(ui, { q, fuente: null, estado: null, opcion: null }); fQ.value = q; }
  showPage('solicitudes');
});

/* ============ dibujo: solicitudes ============ */
function drawSolicitudes() {
  const porEstado = calcPorEstado();
  // Arriba solo las fases que tienen algo (y «Todas»), para filtrar de un toque
  const chips = $('#pb-chips'); chips.replaceChildren();
  const chip = (k, txt, n, color) => {
    const b = el('button', 'pb-chip' + ((ui.estado || null) === k ? ' on' : '')); b.type = 'button';
    if (color) { const i = el('i'); i.style.background = color; b.append(i); }
    b.append(el('small', null, txt), el('b', null, N(n)));
    b.addEventListener('click', () => set({ estado: k, limit: 120 })); chips.append(b);
  };
  chip(null, 'Todas', S.leads.length);
  Object.entries(ESTADOS).forEach(([k, v]) => { if (porEstado[k]) chip(k, v[0], porEstado[k], v[1]); });
  fEstado.value = ui.estado ?? '';
  const fuentes = d3.rollups(S.leads, (v) => v.length, (l) => l.fuente).sort((a, b) => b[1] - a[1]);
  fFuente.replaceChildren(new Option('Todas las fuentes', ''), ...fuentes.map(([f, c]) => new Option((f || 'directo') + ' (' + c + ')', f || '(directo)')));
  fFuente.value = ui.fuente ?? ''; fOpcion.value = ui.opcion ?? '';
  const nRev = S.leads.filter((l) => l.canal_revisar === '1').length;
  fCanal.replaceChildren(new Option('Todos los canales', ''), new Option('⚠ Por revisar (' + nRev + ')', 'revisar'),
    ...(S.canales || []).map((c) => new Option(c.label + ' (' + S.leads.filter((l) => l.canal_dueno === c.clave).length + ')', c.clave)));
  fCanal.value = ui.canal ?? '';
  if (fQ !== document.activeElement) fQ.value = ui.q ?? '';
  const list = $('#pb-leads'); list.replaceChildren();
  const q = (ui.q || '').toLowerCase();
  const rows = S.leads.filter((l) => (!ui.estado || l.estado === ui.estado) && (ui.fuente == null || (ui.fuente === '(directo)' ? !l.fuente : l.fuente === ui.fuente)) && (!ui.opcion || l.opcion === ui.opcion)
    && (!ui.canal || (ui.canal === 'revisar' ? l.canal_revisar === '1' : l.canal_dueno === ui.canal))
    &&(!q || ['empresa', 'nombre', 'telefono', 'notas', 'cliente_email', 'palabra', 'campana', 'objetivo'].some((k) => String(l[k] || '').toLowerCase().includes(q)) || String(l.id) === q.replace('#', '')));
  rows.sort((a, b) => b.id - a.id);
  ui.orden = rows.map((l) => l.id);
  if (!rows.length) { list.append(el('div', 'pb-empty', S.loaded ? 'Todavía no hay solicitudes con estos filtros.' : '')); return; }
  rows.slice(0, ui.limit).forEach((l, i) => {
    const b = el('button', 'pb-row pb-sol pb-anim' + (ui.sel === l.id ? ' sel' : '') + (l.estado === 'nuevo' ? ' nueva' : '')); b.type = 'button'; b.style.setProperty('--i', Math.min(i, 12));
    const nombre = (l.empresa && !/@/.test(l.empresa) ? l.empresa : '') || l.nombre || l.empresa || 'Sin nombre';
    const c = canalInfo(l.canal_dueno);
    const av = el('div', 'pb-avatar', (nombre.match(/[\p{L}\p{N}]/u) || ['·'])[0].toUpperCase()); av.style.setProperty('--c', CANAL_COLOR[c.clave] || '#3A404D');
    const mid = el('div', 'mid');
    mid.append(el('div', 'emp', nombre));
    mid.append(el('div', 'meta', [l.nombre && l.nombre !== nombre ? l.nombre : '', l.telefono, l.problema ? l.problema.slice(0, 70) + (l.problema.length > 70 ? '…' : '') : ''].filter(Boolean).join(' · ')));
    const o = ORIGEN(l.fuente);
    const pie = el('div', 'pie'); pie.append(tile(o, 'xs'), el('span', null, o.label));
    const q = el('span', 'quien'); q.style.setProperty('--c', CANAL_COLOR[c.clave] || '#3A404D'); q.textContent = QUIEN[c.dueno] || 'Sin asignar'; if (l.canal_revisar === '1') q.classList.add('rev'); pie.append(q);
    if (l.cita_inicio && l.cita_estado !== 'cancelada') pie.append(el('span', 'cita', 'Cita ' + fechaCorta(parseUTC(l.cita_inicio))));
    mid.append(pie);
    const r = el('div', 'r'); r.append(badge(l.estado), el('span', 'age', hace(parse(l.created_at))));
    b.append(av, mid, r); b.addEventListener('click', () => openDetail(l.id)); list.append(b);
  });
  if (rows.length > ui.limit) { const m = el('div', 'pb-more'); const b = el('button', 'pb-btn', 'Ver ' + N(rows.length - ui.limit) + ' más'); b.type = 'button'; b.addEventListener('click', () => set({ limit: ui.limit + 200 })); m.append(b); list.append(m); }
}

/* ============ dibujo: clientes (trato directo) ============ */
function drawClientes() {
  const list = $('#pb-clientes-list'); if (!list) return; list.replaceChildren();
  const rows = (S.clientes || []).slice().sort((a, b) => b.id - a.id);
  if (!rows.length) { list.append(el('div', 'pb-empty', 'Aún no hay clientes de trato directo.')); return; }
  rows.forEach((l, i) => {
    const b = el('button', 'pb-row pb-anim'); b.type = 'button'; b.style.setProperty('--i', Math.min(i, 12));
    const av = el('div', 'pb-avatar A', (l.empresa || '?').slice(0, 2).toUpperCase());
    const mid = el('div'); const emp = el('div', 'emp'); emp.append(l.empresa, el('span', null, l.telefono)); mid.append(emp);
    const meta = el('div', 'meta'); [fecha(parse(l.created_at)), 'Vía ' + (l.fuente || 'directo')].forEach((t, j) => { if (j) meta.append(el('span', 'sep', '·')); meta.append(el('span', null, t)); });
    if (l.cita_inicio && l.cita_estado !== 'cancelada') { meta.append(el('span', 'sep', '·')); meta.append(el('span', 'cita', 'Cita ' + fechaCorta(parseUTC(l.cita_inicio)))); }
    mid.append(meta);
    if (l.notas) mid.append(el('div', 'meta', l.notas.slice(0, 180)));
    const r = el('div', 'r'); r.append(badge(l.estado));
    const cp = el('button', 'pb-btn ghost', 'Copiar enlace de reserva'); cp.type = 'button';
    cp.addEventListener('click', (e) => { e.stopPropagation(); navigator.clipboard.writeText(l.booking_url).then(() => toast('Enlace de reserva copiado.'), () => toast('No se pudo copiar.', true)); });
    r.append(cp);
    b.append(av, mid, r); b.addEventListener('click', () => openDetail(l.id)); list.append(b);
  });
}

/* ============ dibujo: agenda ============ */
const recEl = (c) => { const r = el('span', 'pb-rec'); [['24 h', c.rec24], ['1 h', c.rec1]].forEach(([t, ok]) => { r.append(el('i', ok ? 'ok' : '', ok ? '✓' : '·'), t); }); return r; };
const autoBadge = () => { const b = badge('sesion'); b.textContent = 'Sesión hecha · auto'; b.title = 'Marcada sola al pasar la hora. Confírmala o corrígela.'; return b; };
function asistenciaBtns(c, box) {
  const opts = c.asistencia === 'auto' ? [['asistio', 'Confirmar', 'primary'], ['no_asistio', 'No se presentó', 'danger']] : [['asistio', 'Asistió', 'primary'], ['no_asistio', 'No se presentó', 'danger']];
  opts.forEach(([v, lab, cls]) => {
    const b = el('button', 'pb-btn ' + cls, lab); b.type = 'button'; b.addEventListener('click', () => act('asistencia', { uid: c.uid, valor: v }, v === 'asistio' ? 'Sesión marcada como hecha.' : 'Marcada como no presentada.', b)); box.append(b);
  });
}
function drawAgenda(box, tramo, limit) {
  box.replaceChildren();
  let rows = citasClasificadas().filter((c) => c.tramo === tramo);
  rows.sort((a, b) => tramo === 'pasadas' ? b.d - a.d : a.d - b.d);
  if (limit) rows = rows.slice(0, limit); else if (tramo === 'pasadas') rows = rows.slice(0, 80);
  if (!rows.length) { box.append(el('div', 'pb-empty', { proximas: 'No hay citas próximas.', pasadas: 'Aún no hay citas pasadas.', sin_vincular: 'Todas las reservas están unidas a su solicitud.' }[tramo])); return; }
  rows.forEach((c, i) => {
    const row = el('div', 'pb-ag pb-anim'); row.style.setProperty('--i', Math.min(i, 10));
    const hrs = (c.d - S.ahoraUTC) / 3600000; if (tramo === 'proximas' && hrs < 24) row.classList.add('soon');
    const when = el('div', 'when'); when.append(el('b', null, String(c.d.getDate())), el('small', null, MESES[c.d.getMonth()]), el('em', null, pad(c.d.getHours()) + ':' + pad(c.d.getMinutes())));
    const who = el('div', 'who'); const t = el('b');
    if (c.lead) { const a = el('a', null, c.lead.empresa); a.href = BASE + '?id=' + c.lead.id; a.addEventListener('click', (e) => { e.preventDefault(); openDetail(c.lead.id); }); t.append(a); } else t.append(el('span', 'warn', 'Sin solicitud'));
    who.append(t, el('div', null, DIAS[c.d.getDay()] + ' · ' + (c.nombre || '—') + ' · ' + (c.email || '—')));
    const sub = el('div'); sub.append(recEl(c)); if (tramo === 'proximas' && hrs < 24 && hrs > 0) sub.append(' ', el('span', 'lime', 'en ' + Math.max(1, Math.round(hrs)) + ' h')); who.append(sub);
    const acts = el('div', 'acts');
    if (tramo === 'proximas' && c.meet_url) { const a = el('a', 'pb-btn', 'Abrir Meet'); a.href = c.meet_url; a.target = '_blank'; a.rel = 'noopener'; acts.append(a); }
    if (tramo === 'pasadas') {
      if (c.asistencia === 'auto') { acts.append(autoBadge()); asistenciaBtns(c, acts); }
      else if (c.asistencia) acts.append(badge(c.asistencia === 'asistio' ? 'sesion' : 'no_asistio'));
      else asistenciaBtns(c, acts);
    }
    if (tramo === 'sin_vincular') {
      const inp = el('input'); inp.type = 'number'; inp.min = 1; inp.placeholder = 'Nº solicitud'; inp.setAttribute('aria-label', 'Número de solicitud');
      const b = el('button', 'pb-btn primary', 'Unir'); b.type = 'button';
      const go = () => { if (!inp.value) { toast('Escribe el número de solicitud.', true); inp.focus(); return; } act('vincular', { uid: c.uid, lead_id: inp.value }, 'Reserva unida a la solicitud #' + inp.value + '.', b); };
      b.addEventListener('click', go); inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); }); acts.append(inp, b);
    }
    row.append(when, who, acts); box.append(row);
  });
}

/* ============ dibujo: ficha ============ */
/* ============ ficha de la solicitud ============ */
const SVGNS = 'http://www.w3.org/2000/svg';
const ICONS = window.PB_ICONS || { brands: {}, ui: {} };
// «Directo» (escribió la dirección o entró desde un favorito): una flecha centrada, más limpia que el globo
ICONS.ui.directo = 'p:M7 17 17 7|p:M9 7h8v8';
const icon = (name, cls) => {
  const svg = document.createElementNS(SVGNS, 'svg'); svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('class', 'pb-i' + (cls ? ' ' + cls : ''));
  (ICONS.ui[name] || ICONS.ui.globe || '').split('|').forEach((part) => {
    const [t, v] = [part.slice(0, 1), part.slice(2)];
    let n;
    if (t === 'p') { n = document.createElementNS(SVGNS, 'path'); n.setAttribute('d', v); }
    if (t === 'c') { const [cx, cy, r] = v.split(','); n = document.createElementNS(SVGNS, 'circle'); n.setAttribute('cx', cx); n.setAttribute('cy', cy); n.setAttribute('r', r); }
    if (t === 'r') { const [x, y, w, h, rx] = v.split(','); n = document.createElementNS(SVGNS, 'rect'); n.setAttribute('x', x); n.setAttribute('y', y); n.setAttribute('width', w); n.setAttribute('height', h); n.setAttribute('rx', rx); }
    if (n) svg.append(n);
  });
  return svg;
};
const brandSvg = (key) => {
  const b = ICONS.brands[key]; if (!b) return null;
  const svg = document.createElementNS(SVGNS, 'svg'); svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true');
  const p = document.createElementNS(SVGNS, 'path'); p.setAttribute('d', b.d); p.setAttribute('fill', '#fff'); svg.append(p); return svg;
};
/* Origen del tráfico (utm_source o el nombre que pone utm.js a partir del referente) */
const ORIGEN = (raw) => {
  const s = String(raw || '').toLowerCase().trim();
  const alias = [[/insta|^ig$/, 'instagram'], [/youtu|^yt$/, 'youtube'], [/facebook|^fb$|^meta$/, 'facebook'], [/tiktok/, 'tiktok'], [/linkedin|lnkd/, 'linkedin'],
    [/^x$|twitter|^t\.co$/, 'x'], [/chatgpt|openai/, 'openai'], [/perplexity/, 'perplexity'], [/gemini/, 'googlegemini'], [/maps/, 'googlemaps'], [/google/, 'google'],
    [/whatsapp|^wa$/, 'whatsapp'], [/mail|newsletter/, 'gmail']];
  const hit = alias.find(([re]) => re.test(s));
  if (hit) return { key: hit[1], ...ICONS.brands[hit[1]] };
  if (!s || s === 'directo' || s === '(direct)' || s === 'desconocido') return { key: '', label: 'Directo', bg: 'linear-gradient(135deg,#2E3350,#4A5078)', ui: 'directo' };
  return { key: '', label: s === 'bing' ? 'Bing' : s.charAt(0).toUpperCase() + s.slice(1), bg: 'linear-gradient(135deg,#3A404D,#5A6172)', ui: 'globe' };
};
const MEDIO = (m) => ({ social: 'Publicación en redes', organic: 'Búsqueda orgánica', cpc: 'Anuncio', paid: 'Anuncio', ads: 'Anuncio', ppc: 'Anuncio', referral: 'Enlace desde otra web', video: 'Vídeo', email: 'Email', bio: 'Enlace de la bio', dm: 'Mensaje directo', story: 'Historia', comment: 'Comentario' })[String(m || '').toLowerCase()] || m || '';
const tile = (o, size) => {
  const t = el('span', 'pb-tile' + (size ? ' ' + size : '')); t.style.background = o.bg; t.title = o.label;
  t.append(o.key ? brandSvg(o.key) : icon(o.ui || 'globe')); return t;
};
const hace = (d) => {
  if (!d || isNaN(d)) return '';
  const m = Math.round((S.ahora - d) / 60000);
  if (m < 1) return 'ahora mismo'; if (m < 60) return 'hace ' + m + ' min';
  const h = Math.round(m / 60); if (h < 24) return 'hace ' + h + ' h';
  const dd = Math.round(h / 24); return dd === 1 ? 'ayer' : 'hace ' + dd + ' días';
};
const dispositivo = (ua) => {
  ua = String(ua || '');
  const movil = /Mobi|Android|iPhone|iPad/i.test(ua);
  const so = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac OS X|Macintosh/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : '';
  const app = /Instagram/.test(ua) ? 'navegador de Instagram' : /FBAN|FBAV/.test(ua) ? 'navegador de Facebook' : /musical_ly|BytedanceWebview|TikTok/i.test(ua) ? 'navegador de TikTok' : /LinkedInApp/.test(ua) ? 'navegador de LinkedIn'
    : /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : '';
  const txt = ua ? [movil ? 'Móvil' : 'Ordenador', so, app].filter(Boolean).join(' · ') : (ua === '' ? '' : ua);
  return { movil, txt: txt || 'Desconocido' };
};
const respuestas = (l) => {
  const c = l.canal || '', v = l.volumen || '', o = l.objetivo || '';
  const canal = /boca|referid/i.test(c) ? { ui: 'users' } : /maps|local/i.test(c) ? { brand: 'googlemaps' } : /redes/i.test(c) ? { redes: true } : /publicidad|ads/i.test(c) ? { ui: 'megaphone' } : { ui: 'globe' };
  const nivel = /menos de 20/i.test(v) ? 1 : /20 y 80/i.test(v) ? 2 : /más de 80/i.test(v) ? 3 : 0;
  const obj = /respond|rápido/i.test(o) ? 'zap' : /automati|proceso/i.test(o) ? 'flow' : /GEO|recomendaciones/i.test(o) ? 'sparkles' : /form/i.test(o) ? 'cap' : 'target';
  return { canal, nivel, obj };
};
const TPL = (l) => { const nom = (l.nombre || '').trim().split(/\s+/)[0]; const hola = nom ? 'Hola, ' + nom + '. Somos' : 'Hola, somos'; return {
  enlace: ['Aceptado · enviar enlace', hola + ' PEBAI Systems. Hemos revisado vuestra solicitud y encaja con lo que hacemos. Aquí podéis elegir día y hora para la sesión técnica de 25 minutos por videollamada: ' + l.booking_url],
  seguimiento: ['Seguimiento (no responde)', (nom ? 'Hola de nuevo, ' + nom + '. Somos' : 'Hola de nuevo, somos') + ' PEBAI Systems. Os escribimos por vuestra solicitud de consultoría. Si os viene bien, aquí podéis elegir día y hora para la sesión técnica: ' + l.booking_url + ' ¡Cualquier duda, respondednos aquí!'],
  reprogramar: ['No se presentó · reprogramar', hola + ' PEBAI Systems. Hoy no pudimos coincidir en la sesión técnica. Si seguís interesados, podéis elegir otro día y hora aquí: ' + l.booking_url],
  plazas: ['Plazas del mes completas', hola + ' PEBAI Systems. Hemos revisado vuestra solicitud y encaja con lo que hacemos, pero las 5 plazas gratuitas de este mes ya están cubiertas. Podemos haceros la sesión técnica igualmente como consultoría de pago, o reservaros una plaza gratuita el mes que viene. ¿Qué preferís?'],
  no_encaja: ['No encaja', hola + ' PEBAI Systems. Gracias por enviarnos vuestra solicitud. La hemos revisado con calma y, ahora mismo, no es el tipo de proyecto en el que podamos aportar un resultado claro. Si en el futuro cambia vuestra situación, estaremos encantados de volver a hablar. ¡Mucho éxito!'],
}; };
const postQuiet = async (action, fields) => {
  const r = await fetch(BASE, { method: 'POST', body: new URLSearchParams({ action, csrf: S.csrf, ...fields }), credentials: 'same-origin', headers: { 'Accept': 'application/json' } });
  const j = await r.json().catch(() => ({ ok: false }));
  if (!j.ok) throw new Error(j.error || 'No se ha podido guardar.');
};

let fichaFirma = '';
function drawDetalle() {
  const box = $('#pb-detalle');
  if (ui.sel == null) { box.replaceChildren(); fichaFirma = ''; return; }
  const l = S.todos.find((x) => x.id === Number(ui.sel));
  if (!l) { if (S.loaded) { box.replaceChildren(el('div', 'pb-empty', 'No existe la solicitud #' + ui.sel + '.')); } return; }
  const evs = (S.eventos.get(l.id) || []).slice().sort((a, b) => a.ts < b.ts ? -1 : 1);
  const citas = S.citas.filter((c) => c.lead_id === l.id);
  // Solo se vuelve a pintar si cambió algo de esta solicitud: así no se pierde el foco al escribir notas
  const firma = JSON.stringify([l, evs.length, citas, document.documentElement.dataset.theme]);
  if (firma === fichaFirma && box.childElementCount) return;
  const prevTa = $('#pb-notas'); const keepNotes = prevTa && Number(prevTa.dataset.id) === l.id ? prevTa.value : null;
  fichaFirma = firma;
  box.replaceChildren();

  const tel = String(l.telefono).replace(/\D/g, '');
  const wa = (text) => 'https://wa.me/' + tel + (text ? '?text=' + encodeURIComponent(text) : '');
  const tpl = TPL(l);
  const btn = (cls, ico, text, onClick) => { const b = el('button', 'pb-btn ' + cls); b.type = 'button'; if (ico) b.append(ico); b.append(text); if (onClick) b.addEventListener('click', onClick); return b; };
  const link = (cls, ico, text, href, onClick) => { const a = el('a', 'pb-btn ' + cls); if (ico) a.append(ico); a.append(text); a.href = href; a.target = '_blank'; a.rel = 'noopener'; if (onClick) a.addEventListener('click', onClick); return a; };
  const waTpl = (key, cls) => link(cls, key === 'enlace' || key === 'seguimiento' || key === 'reprogramar' ? brandSvg('whatsapp') : null, tpl[key][0], wa(tpl[key][1]), () => registrar(l.id, ['enlace', 'seguimiento', 'reprogramar', 'no_encaja'].includes(key) ? key : 'whatsapp'));
  const section = (title, ico, ...nodes) => { const s = el('section', 'pb-fsec'); const h = el('h3'); h.append(icon(ico), title); s.append(h, ...nodes); return s; };
  const origen = ORIGEN(l.fuente);

  /* ---------- cabecera: quién es, cuándo llegó y cómo contactar ---------- */
  // Si en «empresa» escribió su email o nada, se enseña su nombre
  const titulo = (l.empresa && !/@/.test(l.empresa) ? l.empresa : '') || l.nombre || l.empresa || 'Sin nombre';
  const hero = el('header', 'pb-fh');
  const fk = el('div', 'k'); fk.append(el('span', null, '#' + l.id + ' · llegó ' + hace(parse(l.created_at)) + ' · ' + fecha(parse(l.created_at))), badge(l.estado));
  hero.append(fk, el('h2', null, titulo));
  const datos = el('div', 'cto');
  if (l.nombre && l.nombre !== titulo) { const s = el('span'); s.append(icon('user'), l.nombre); datos.append(s); }
  const ph = el('a'); ph.href = 'tel:' + tel; ph.append(icon('phone'), l.telefono); datos.append(ph);
  const correo = l.cliente_email || (/@/.test(l.empresa || '') ? l.empresa : '');
  if (correo) { const m = el('a'); m.href = 'mailto:' + correo; m.append(icon('mail'), correo); datos.append(m); }
  hero.append(datos);

  // Acciones: WhatsApp, llamar, copiar el enlace y UN botón con lo que toca según la fase (sin párrafos)
  function copiar(e) { const b = e.currentTarget; navigator.clipboard.writeText(l.booking_url).then(() => { b.lastChild.textContent = 'Copiado'; toast('Enlace de reserva copiado.'); registrar(l.id, 'copiar'); }, () => toast('No se pudo copiar.', true)); }
  function cambiaEstado(estado, b) { const ta = $('#pb-notas'); act('update', { id: l.id, estado, notas: ta ? ta.value : l.notas }, 'Fase actualizada: ' + ESTADOS[estado][0] + '.', b); }
  const acc = el('div', 'acc');
  const cita = citasClasificadas().filter((c) => c.lead_id === l.id).sort((a, b) => b.d - a.d)[0];
  const plz = plazasAhora(), lleno = plz.usadas >= PLAZAS_MES;
  const principal = (key, texto) => { const a = waTpl(key, 'primary'); a.lastChild.textContent = texto; return a; };
  if (['nuevo', 'contactado'].includes(l.estado) && !l.enlace_at) acc.append(lleno ? principal('plazas', 'Plazas llenas: ofrecer otra opción') : principal('enlace', 'Enviar enlace de reserva'));
  else if (['nuevo', 'contactado'].includes(l.estado) && (S.ahora - parse(l.enlace_at)) / 3600000 > 48) acc.append(principal('seguimiento', 'Hacer seguimiento'));
  else if (l.estado === 'cita' && cita && cita.meet_url) acc.append(link('primary', icon('video'), 'Sesión ' + fechaCorta(cita.d) + ' · Meet', cita.meet_url));
  else if (l.estado === 'sesion') acc.append(btn('primary', icon('trophy'), 'Es cliente', (e) => cambiaEstado('cliente', e.currentTarget)));
  else if (l.estado === 'no_asistio') acc.append(principal('reprogramar', 'Ofrecer otra hora'));
  acc.append(link('wa', brandSvg('whatsapp'), 'WhatsApp', wa(''), () => registrar(l.id, 'whatsapp')));
  const call = el('a', 'pb-btn'); call.href = 'tel:' + tel; call.append(icon('phone'), 'Llamar'); acc.append(call);
  acc.append(btn('', icon('link'), 'Copiar enlace de reserva', copiar));
  const more = el('details', 'pb-msgs'); const sum = el('summary'); sum.append(icon('msg'), 'Mensajes'); more.append(sum);
  const ml = el('div', 'list'); Object.keys(tpl).forEach((k) => { const a = waTpl(k, 'ghost'); a.title = tpl[k][1]; ml.append(a); }); more.append(ml);
  acc.append(more);
  hero.append(acc);
  if (l.estado === 'cita' && cita) {
    const rec = el('div', 'rec'); rec.append(icon('calendar'), 'Sesión ' + fechaCorta(cita.d) + ' · recordatorios: 24 h ' + (cita.rec24 ? '✓' : '·') + '  1 h ' + (cita.rec1 ? '✓' : '·'));
    hero.append(rec);
  }
  box.append(hero);

  /* ---------- lo que rellenó: pregunta → respuesta, tal cual y en el orden del formulario ---------- */
  const form = el('dl', 'pb-form');
  const fila = (p, valor, extra) => { if (valor == null || valor === '') return; const dt = el('dt', null, p), dd = el('dd'); if (valor instanceof Node) dd.append(valor); else dd.append(String(valor)); if (extra) dd.append(extra); form.append(dt, dd); };
  if (l.tipo === 'contacto') fila('Su mensaje', l.objetivo || 'Sin mensaje');
  if (l.web || l.problema) {
    let wx = null;
    if (l.analisis_url) { wx = el('a', 'pb-mini'); wx.href = l.analisis_url + '?equipo=1'; wx.target = '_blank'; wx.rel = 'noopener'; wx.append(icon('sparkles'), 'Ver su análisis'); }
    else if (l.analisis_estado) wx = el('small', 'pb-mini', l.analisis_estado === 'trabajando' ? 'Analizando su web…' : 'Análisis ' + l.analisis_estado);
    let w = 'No tiene web';
    if (l.web) { w = el('a'); w.href = /^https?:/.test(l.web) ? l.web : 'https://' + l.web; w.target = '_blank'; w.rel = 'noopener'; w.textContent = l.web.replace(/^https?:\/\//, '').replace(/\/$/, ''); }
    fila('Web', w, wx);
  }
  fila('Lo que les quita tiempo', l.problema);
  fila('Presupuesto', l.opcion === 'A' ? 'Sí, tiene presupuesto' : l.opcion === 'B' ? 'De momento, explorando' : l.presupuesto);
  fila('¿Decide?', l.decisor ? ({ si: 'Sí, decide', varios: 'Entre varios', otro: 'Otra persona', no: 'No decide' }[l.decisor] || l.decisor) : '');
  fila('Personas en la empresa', l.equipo);
  fila('Consultas al mes', l.volumen);
  fila('Sus clientes llegan por', l.canal);
  if (l.tipo !== 'contacto' && l.objetivo && l.objetivo !== (l.problema || '').slice(0, 500)) fila('Objetivo', l.objetivo);
  fila('¿Cómo nos conoció?', l.conocio ? (S.conocio[l.conocio] || l.conocio) : '');
  if (!form.childElementCount) form.append(el('dd', 'vacio', 'No rellenó nada más.'));
  box.append(section('Lo que rellenó', 'msg', form));

  /* ---------- de dónde viene y de quién es ---------- */
  const leer = (json) => { try { return JSON.parse(json || '{}') || {}; } catch (e) { return {}; } };
  const t1 = leer(l.primer_toque);
  const ori = el('div', 'pb-orig');
  const o1 = el('div', 'fila'); o1.append(tile(origen, 'lg'));
  const o1t = el('div'); o1t.append(el('b', null, origen.label));
  const sub = [MEDIO(l.medio), l.campana && 'campaña ' + l.campana, l.palabra && '«' + l.palabra + '»'].filter(Boolean).join(' · ');
  const entro = (t1.landing || '').replace(/^https?:\/\/[^/]+/, '');
  o1t.append(el('span', null, [sub, entro && 'entró por ' + entro].filter(Boolean).join(' · ') || 'Llegó directo a la web'));
  o1.append(o1t); ori.append(o1);
  // De quién es el cliente (acuerdo Adrián–Daniel): grande y claro; se puede corregir
  const cinfo = canalInfo(l.canal_dueno);
  const o2 = el('div', 'fila dueno' + (l.canal_revisar === '1' ? ' rev' : ''));
  const d = el('div'); d.append(el('small', null, 'Cliente de'), el('b', null, QUIEN[cinfo.dueno] || 'Sin asignar'));
  d.append(el('span', null, cinfo.label + (l.canal_revisar === '1' ? ' · por confirmar' : '') + (l.canal_manual === '1' ? ' · corregido a mano' : '')));
  if (l.canal_motivo) d.title = l.canal_motivo;
  o2.style.setProperty('--c', CANAL_COLOR[cinfo.clave] || '#3A404D');
  const cact = el('div', 'acts');
  const csel = el('select'); csel.setAttribute('aria-label', 'Cambiar de quién es');
  (S.canales || []).forEach((c) => csel.append(new Option(c.label, c.clave))); csel.value = l.canal_dueno || 'pendiente';
  csel.addEventListener('change', () => act('canal', { id: l.id, canal: csel.value }, 'Ahora es: ' + canalInfo(csel.value).label + '.', csel));
  cact.append(csel);
  if (l.canal_revisar === '1' && l.canal_dueno !== 'pendiente') cact.append(btn('primary', icon('check'), 'Confirmar', (e) => act('canal', { id: l.id, canal: l.canal_dueno }, 'Confirmado.', e.currentTarget)));
  o2.append(d, cact); ori.append(o2);
  box.append(section('De dónde viene', 'pin', ori));

  /* ---------- notas y fase ---------- */
  const notes = el('div', 'pb-notes');
  const ta = el('textarea'); ta.id = 'pb-notas'; ta.dataset.id = l.id; ta.placeholder = 'Qué se habló, próximos pasos, dudas del cliente…'; ta.value = keepNotes ?? l.notas ?? '';
  const status = el('span', 'saved', l.updated_at ? 'Guardado · ' + fecha(parse(l.updated_at)) : 'Se guarda solo mientras escribes');
  let tmr;
  ta.addEventListener('input', () => {
    clearTimeout(tmr); status.textContent = 'Escribiendo…'; status.className = 'saved typing';
    tmr = setTimeout(() => postQuiet('update', { id: l.id, estado: l.estado, notas: ta.value })
      .then(() => { l.notas = ta.value; fichaFirma = JSON.stringify([l, evs.length, citas, document.documentElement.dataset.theme]); status.textContent = 'Guardado'; status.className = 'saved ok'; })
      .catch((e) => { status.textContent = e.message; status.className = 'saved err'; }), 900);
  });
  const sel = el('select'); sel.setAttribute('aria-label', 'Mover a otra fase'); Object.entries(ESTADOS).forEach(([k, v]) => sel.append(new Option(v[0], k))); sel.value = l.estado;
  sel.addEventListener('change', () => cambiaEstado(sel.value, null));
  const nf = el('div', 'foot'); const mv = el('label'); mv.append('Mover a', sel); nf.append(status, mv);
  notes.append(ta, nf);
  box.append(section('Notas del equipo', 'pencil', notes));

  /* ---------- historial ---------- */
  const hd = el('details', 'pb-histbox'); const hs = el('summary'); hs.append(icon('history'), 'Historial', el('em', null, String(Math.max(1, evs.length)))); hd.append(hs);
  const hist = el('ol', 'pb-hist');
  const lista = evs.length ? evs.slice().reverse() : [{ ts: l.created_at, tipo: 'nuevo', detalle: 'Formulario de diagnóstico enviado', auto: 1 }];
  lista.forEach((e) => {
    const li = el('li', e.auto ? 'auto' : 'manual'); const f = parse(e.ts);
    const head = el('div', 'h'); head.append(el('b', null, e.tipo === 'contacto' ? e.detalle : (EVENTOS[e.tipo] || e.tipo)), el('span', 'tag', e.auto ? 'Automático' : 'Equipo'));
    li.append(head, el('div', 'm', fecha(f) + (e.tipo !== 'contacto' && e.detalle ? ' · ' + (['reserva', 'reprogramada', 'cancelada'].includes(e.tipo) ? 'cita ' + fechaCorta(parseUTC(e.detalle)) : e.detalle) : '')));
    hist.append(li);
  });
  hd.append(hist);
  box.append(hd);

  /* ---------- pie técnico ---------- */
  const dv = dispositivo(l.dispositivo);
  const foot = el('div', 'pb-tech');
  const f1 = el('span'); f1.append(icon(dv.movil ? 'mobile' : 'desktop'), dv.txt); f1.title = l.dispositivo || '';
  const f2 = el('span'); f2.append(icon('mail'), l.email_enviado ? 'Aviso enviado a equipo@' : 'Aviso por email no enviado');
  if (!l.email_enviado) f2.className = 'warn';
  foot.append(f1, f2);
  box.append(foot);
  const borra = btn('danger pb-borrar', icon('x'), 'Borrar esta solicitud', (e) => {
    if (!confirm('¿Borrar la solicitud #' + l.id + ' (' + titulo + ')? No se puede deshacer.')) return;
    const b = e.currentTarget; b.disabled = true;
    post('borrar_lead', { id: l.id }).then(() => { toast('Solicitud #' + l.id + ' borrada.'); closeDetail(); draw(); }).catch((er) => { toast(er.message, true); b.disabled = false; });
  });
  box.append(borra);
}

/* Navegar entre solicitudes sin cerrar la ficha */
const ordenFicha = () => (ui.orden && ui.orden.length ? ui.orden : S.leads.map((l) => l.id).sort((a, b) => b - a));
const moverFicha = (paso) => { const o = ordenFicha(); const i = o.indexOf(Number(ui.sel)); const n = o[i + paso]; if (n != null) openDetail(n); };
$('#pb-prev').addEventListener('click', () => moverFicha(-1));
$('#pb-next').addEventListener('click', () => moverFicha(1));
document.addEventListener('keydown', (e) => {
  if (ui.sel == null || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
  if (e.key === 'ArrowUp' || e.key === 'k') { e.preventDefault(); moverFicha(-1); }
  if (e.key === 'ArrowDown' || e.key === 'j') { e.preventDefault(); moverFicha(1); }
});

/* ============ ciclo de dibujo ============ */
function draw() {
  $$('#pb-periodo button').forEach((b) => b.classList.toggle('on', b.dataset.p === ui.periodo));
  $('#pb-leads-n').textContent = S.loaded ? N(S.leads.length) : '—';
  $('#pb-citas-n').textContent = S.loaded ? N(citasClasificadas().filter((x) => x.tramo === 'proximas').length) : '—';
  if (!S.loaded) return;
  // El resumen de toda la app lo pinta global.js; el análisis del formulario vive en Solicitudes
  if (ui.page === 'solicitudes') { drawResumen(ui.periodo); drawSolicitudes(); }
  if (ui.page === 'resumen') pintaPlazas($('#pb-plazas-resumen'));   // plazas gratis del mes, en el Resumen (30/10)
  if (ui.page === 'clientes') drawClientes();
  if (ui.page === 'citas') { pintaPlazas($('#pb-plazas-citas')); drawAgenda($('#pb-proximas'), 'proximas'); drawAgenda($('#pb-pasadas'), 'pasadas'); drawAgenda($('#pb-sinvincular'), 'sin_vincular'); }
  drawDetalle();
  if (!S.drawn) { S.drawn = true; document.body.classList.add('pb-in'); }
}
let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(draw, 120); });
document.addEventListener('visibilitychange', () => { if (!document.hidden && S.loaded) load().then(draw).catch(() => {}); });

/* ============ arranque ============ */
readUrl();
$$('#pb-kpis .v').forEach((e) => e.classList.add('pb-skel'));
marcaPagina(ui.page);
fQ.value = ui.q || '';
if (ui.sel != null) { $('#pb-drawer').classList.add('on'); $('#pb-veil').classList.add('on'); document.body.classList.add('pb-locked'); }
writeUrl(); draw();
// Al abrir el análisis plegable, se repinta con su ancho real (cerrado no tiene tamaño)
{ const an = $('#pb-analisis'); if (an) { try { an.open = localStorage.getItem('pb-analisis') === '1'; } catch (e) { /* nada */ } an.addEventListener('toggle', () => { try { localStorage.setItem('pb-analisis', an.open ? '1' : '0'); } catch (e) { /* nada */ } if (an.open) draw(); }); } }
load().then(() => { draw(); if (ui.sel != null) marcarVista(ui.sel); }).catch((e) => { toast(e.message || 'No se han podido cargar los datos.', true); $$('.pb-skel').forEach((x) => x.classList.remove('pb-skel')); });
})();
