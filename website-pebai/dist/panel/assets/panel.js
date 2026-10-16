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
const CANAL_COLOR = { salida_adrian: '#FFB547', salida_daniel: '#3FD5FF', seo_geo: '#B7FF3C', anuncios: '#FF6BD6', redes: '#6A5CFF', pendiente: '#3A404D' };
const canalInfo = (k) => (S.canales || []).find((c) => c.clave === k) || { clave: k || 'pendiente', label: k || 'Sin asignar', dueno: '' };
const DUENO = { adrian: 'Adrián', daniel: 'Daniel', compartido: 'Compartido 5/5', '': 'Sin dueño' };
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
  else if (['resumen', 'solicitudes', 'citas', 'prospectos', 'mapa', 'qr', 'agentes', 'caja'].includes(u.get('tab'))) ui.page = u.get('tab');
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
  const leads = new Map(S.leads.map((l) => [l.id, l])), limite = new Date(S.ahoraUTC.getTime() - 3600000);
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
  S.leads = j.leads; S.citas = j.citas; S.ahora = parse(j.ahora); S.ahoraUTC = new Date(j.ahora_utc); S.csrf = j.csrf; S.loaded = true;
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
  const l = S.leads.find((x) => x.id === Number(id));
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
  pintaPlazas($('#pb-plazas')); drawPendientes(); drawSpark(dia); drawFunnel(emb); drawRitmo(p, dia); drawOrigen(p); drawAgenda($('#pb-proximas-mini'), 'proximas', 5);
}

function pendientes() {
  const H = 3600000, out = [];
  const nuevas = S.leads.filter((l) => l.estado === 'nuevo');
  const tarde = nuevas.filter((l) => S.ahora - parse(l.created_at) > 24 * H);
  if (nuevas.length) out.push({ nivel: tarde.length ? 'bad' : 'new', n: nuevas.length, t: nuevas.length === 1 ? 'solicitud sin revisar' : 'solicitudes sin revisar',
    d: tarde.length ? tarde.length + ' con más de 24 h: prometimos WhatsApp en 24 h' : 'Ábrelas para pasarlas a En revisión', ids: nuevas.map((l) => l.id), go: { estado: 'nuevo' } });
  const sinReserva = S.leads.filter((l) => l.estado === 'contactado' && l.enlace_at && S.ahora - parse(l.enlace_at) > 48 * H);
  if (sinReserva.length) out.push({ nivel: 'warn', n: sinReserva.length, t: 'con enlace enviado y sin reservar', d: 'Más de 48 h: toca el mensaje de seguimiento', ids: sinReserva.map((l) => l.id), go: { estado: 'contactado' } });
  const atascadas = S.leads.filter((l) => l.estado === 'contactado' && !l.enlace_at && S.ahora - parse(l.visto_at || l.created_at) > 48 * H);
  if (atascadas.length) out.push({ nivel: 'warn', n: atascadas.length, t: 'en revisión sin decisión', d: 'Más de 48 h sin enviar enlace ni descartar', ids: atascadas.map((l) => l.id), go: { estado: 'contactado' } });
  const revisar = S.leads.filter((l) => l.canal_revisar === '1');
  if (revisar.length) out.push({ nivel: 'warn', n: revisar.length, t: revisar.length === 1 ? 'canal por revisar' : 'canales por revisar',
    d: 'Los utm y la respuesta del formulario no cuadran, o falta saber de quién es: confírmalo en la ficha', ids: revisar.map((l) => l.id), go: { canal: 'revisar' } });
  const cl = citasClasificadas();
  const hoy = cl.filter((c) => c.tramo === 'proximas' && c.d.toDateString() === new Date().toDateString());
  if (hoy.length) out.push({ nivel: 'ok', n: hoy.length, t: hoy.length === 1 ? 'sesión hoy' : 'sesiones hoy', d: hoy.map((c) => pad(c.d.getHours()) + ':' + pad(c.d.getMinutes()) + ' ' + (c.lead ? c.lead.empresa : c.nombre)).join(' · '), page: 'citas' });
  const auto = cl.filter((c) => c.asistencia === 'auto');
  if (auto.length) out.push({ nivel: 'info', n: auto.length, t: auto.length === 1 ? 'sesión marcada sola' : 'sesiones marcadas solas', d: 'Confirma que asistieron o marca No se presentó', page: 'citas' });
  const sueltas = cl.filter((c) => c.tramo === 'sin_vincular');
  if (sueltas.length) out.push({ nivel: 'warn', n: sueltas.length, t: sueltas.length === 1 ? 'reserva sin solicitud' : 'reservas sin solicitud', d: 'No se pudieron unir solas: escribe su número', page: 'citas' });
  return out;
}
function drawPendientes() {
  const box = $('#pb-pendientes'), list = $('#pb-pend-list'); list.replaceChildren();
  const items = pendientes();
  box.classList.toggle('clear', !items.length);
  if (!items.length) { list.append(el('div', 'pb-pend-ok', 'Todo al día. Nada pendiente ahora mismo.')); return; }
  items.forEach((it, i) => {
    const b = el('button', 'pb-pend ' + it.nivel + ' pb-anim'); b.type = 'button'; b.style.setProperty('--i', i);
    const n = el('b', 'n', N(it.n)); const tx = el('div'); tx.append(el('div', 't', it.t), el('div', 'd', it.d));
    b.append(n, tx, el('span', 'go', '→'));
    b.addEventListener('click', () => {
      if (it.ids && it.ids.length === 1) { openDetail(it.ids[0]); return; }
      if (it.go) { Object.assign(ui, { estado: null, fuente: null, opcion: null, canal: null, q: null }, it.go); showPage('solicitudes'); return; }
      showPage(it.page);
    });
    list.append(b);
  });
}

/* ============ avisos en directo ============ */
const BASE_TITLE = 'Panel · PEBAI';
function avisarNuevas() {
  const ids = new Set(S.leads.map((l) => l.id));
  if (S.conocidas) {
    const nuevas = S.leads.filter((l) => !S.conocidas.has(l.id));
    nuevas.forEach((l) => {
      toast('Nueva solicitud: ' + l.empresa);
      try { if (window.Notification && Notification.permission === 'granted') { const n = new Notification('Nueva solicitud · PEBAI', { body: l.empresa + (l.objetivo ? ' · ' + l.objetivo : ''), icon: BASE + 'assets/favicon-192.png', tag: 'lead-' + l.id }); n.onclick = () => { window.focus(); openDetail(l.id); }; } } catch (e) {}
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
const bell = $('#pb-avisos');
const pintaBell = () => { if (!bell) return; const on = window.Notification && Notification.permission === 'granted'; bell.classList.toggle('on', !!on); bell.title = on ? 'Avisos del navegador activados' : 'Activar avisos de nuevas solicitudes'; };
if (bell) bell.addEventListener('click', () => {
  if (!window.Notification) { toast('Este navegador no permite avisos.', true); return; }
  if (Notification.permission === 'granted') { toast('Los avisos ya están activados en este navegador.'); return; }
  Notification.requestPermission().then((p) => { pintaBell(); toast(p === 'granted' ? 'Avisos activados: te avisaremos de cada solicitud nueva.' : 'Avisos bloqueados en este navegador.', p !== 'granted'); });
});
pintaBell();
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
  const chips = $('#pb-chips'); chips.replaceChildren();
  Object.entries(ESTADOS).forEach(([k, v]) => {
    const b = el('button', 'pb-chip' + (ui.estado === k ? ' on' : '')); b.type = 'button'; const i = el('i'); i.style.background = v[1];
    b.append(i, el('b', null, N(porEstado[k])), el('small', null, v[0])); b.addEventListener('click', () => set({ estado: ui.estado === k ? null : k, limit: 120 })); chips.append(b);
  });
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
    const b = el('button', 'pb-row pb-anim' + (ui.sel === l.id ? ' sel' : '')); b.type = 'button'; b.style.setProperty('--i', Math.min(i, 12));
    const av = el('div', 'pb-avatar ' + (l.opcion || ''), l.opcion || '·'); av.title = l.opcion === 'A' ? 'Opción A · con presupuesto' : 'Opción B · explorando';
    const mid = el('div'); const emp = el('div', 'emp'); emp.append(l.empresa, el('span', null, '#' + l.id + ' · ' + l.telefono)); mid.append(emp);
    const meta = el('div', 'meta'); const parts = [fecha(parse(l.created_at)), l.fuente || 'sin fuente']; if (l.palabra) parts.push(l.palabra); if (l.objetivo) parts.push(l.objetivo);
    parts.forEach((t, j) => { if (j) meta.append(el('span', 'sep', '·')); meta.append(el('span', null, t)); });
    if (l.cita_inicio && l.cita_estado !== 'cancelada') { meta.append(el('span', 'sep', '·')); meta.append(el('span', 'cita', 'Cita ' + fechaCorta(parseUTC(l.cita_inicio)))); }
    mid.append(meta);
    if (l.canal_dueno) mid.append(canalPill(l, true));
    const r = el('div', 'r'); r.append(badge(l.estado));
    const dias = Math.floor((S.ahora - parse(l.created_at)) / 86400000); r.append(el('span', 'age', dias <= 0 ? 'hoy' : 'hace ' + dias + ' d'));
    b.append(av, mid, r); b.addEventListener('click', () => openDetail(l.id)); list.append(b);
  });
  if (rows.length > ui.limit) { const m = el('div', 'pb-more'); const b = el('button', 'pb-btn', 'Ver ' + N(rows.length - ui.limit) + ' más'); b.type = 'button'; b.addEventListener('click', () => set({ limit: ui.limit + 200 })); m.append(b); list.append(m); }
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
  if (!s || s === 'directo' || s === '(direct)' || s === 'desconocido') return { key: '', label: 'Directo', bg: 'linear-gradient(135deg,#6A5CFF,#7E73FF)', ui: 'globe' };
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
  const l = S.leads.find((x) => x.id === Number(ui.sel));
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

  /* ---------- cabecera ---------- */
  const hero = el('header', 'pb-hero');
  hero.style.setProperty('--brand', /gradient/.test(origen.bg) ? '#6A5CFF' : origen.bg);
  const idRow = el('div', 'pb-hero-top');
  idRow.append(tile(origen, 'lg'));
  const who = el('div', 'who');
  who.append(el('div', 'k', '#' + l.id + ' · llegó ' + hace(parse(l.created_at)) + ' · ' + fecha(parse(l.created_at))), el('h2', 'n', l.empresa));
  const line = el('div', 'p');
  if (l.nombre) { const s = el('span'); s.append(icon('user'), l.nombre); line.append(s); }
  const ph = el('a'); ph.href = 'tel:' + tel; ph.append(icon('phone'), l.telefono); line.append(ph);
  if (l.cliente_email) { const m = el('a'); m.href = 'mailto:' + l.cliente_email; m.append(icon('mail'), l.cliente_email); line.append(m); }
  who.append(line);
  const tags = el('div', 'tags');
  tags.append(badge(l.estado));
  const opt = el('span', 'pb-pill ' + (l.opcion === 'A' ? 'a' : 'b')); opt.append(icon('euro'), l.opcion === 'A' ? 'Con presupuesto' : l.opcion === 'B' ? 'Explorando' : 'Sin dato'); tags.append(opt);
  idRow.append(who, tags);
  hero.append(idRow);

  // Las 4 fases de la web, con su fecha
  const fase = { nuevo: 0, contactado: 1, cita: 2, sesion: 3, no_asistio: 3, cliente: 3, descartado: -1 }[l.estado];
  const steps = el('ol', 'pb-steps');
  FASES.forEach(([t, tipos], i) => {
    const li = el('li', i < fase ? 'done' : i === fase ? (l.estado === 'no_asistio' ? 'bad' : ['sesion', 'cliente'].includes(l.estado) ? 'done' : 'now') : '');
    const ev = evs.find((e) => tipos.includes(e.tipo)) || (i === 0 ? { ts: l.created_at, auto: 1 } : null);
    const dot = el('span', 'dot'); if (li.classList.contains('done')) dot.append(icon('check')); else if (li.classList.contains('bad')) dot.append(icon('x')); else dot.textContent = String(i + 1);
    li.append(dot, el('b', null, t));
    li.append(el('small', null, ev && i <= fase ? (() => { const f = parse(ev.ts); return f.getDate() + ' ' + MESES[f.getMonth()] + (ev.auto ? ' · auto' : ''); })() : i === fase + 1 ? 'Siguiente' : ''));
    steps.append(li);
  });
  steps.style.setProperty('--prog', Math.max(0, Math.min(3, fase)) / 3);
  hero.append(steps);
  box.append(hero);

  /* ---------- siguiente paso ---------- */
  const next = el('section', 'pb-next');
  const nh = el('div', 'nh'); const nt = el('div'); const na = el('div', 'na'); const nq = el('div', 'nq');
  const setNext = (tono, titulo, texto) => { next.dataset.tono = tono; nt.append(el('div', 'eyebrow', 'Siguiente paso'), el('h3', null, titulo)); if (texto) nt.append(el('p', null, texto)); };
  const cita = citasClasificadas().filter((c) => c.lead_id === l.id).sort((a, b) => b.d - a.d)[0];
  const edad = (S.ahora - parse(l.created_at)) / 3600000;
  const plz = plazasAhora(), lleno = plz.usadas >= PLAZAS_MES, libres = Math.max(0, PLAZAS_MES - plz.usadas);
  if (['nuevo', 'contactado'].includes(l.estado) && !l.enlace_at && lleno) {
    setNext('warn', 'Plazas gratis de ' + MESES_L[plz.mes] + ' completas', 'Las ' + PLAZAS_MES + ' sesiones gratis de este mes ya están reservadas. Ofrécele la sesión de pago o una plaza gratis en ' + MESES_L[plz.sigMes] + ' (quedan ' + Math.max(0, PLAZAS_MES - plz.sigUsadas) + ').');
    na.append(waTpl('plazas', 'primary big'), waTpl('enlace', ''), waTpl('no_encaja', 'danger'));
  } else if (['nuevo', 'contactado'].includes(l.estado) && !l.enlace_at) {
    setNext(edad > 24 ? 'bad' : 'go', 'Revisar y enviar el enlace de reserva', 'Llegó ' + hace(parse(l.created_at)) + '. ' + (edad > 24 ? 'Ya pasaron las 24 h que prometemos para escribir por WhatsApp.' : 'Prometemos escribir por WhatsApp en menos de 24 h.') + ' Quedan ' + libres + (libres === 1 ? ' plaza gratis' : ' plazas gratis') + ' en ' + MESES_L[plz.mes] + '.');
    na.append(waTpl('enlace', 'primary big'), waTpl('plazas', ''), waTpl('no_encaja', 'danger'));
  } else if (['nuevo', 'contactado'].includes(l.estado)) {
    const h = (S.ahora - parse(l.enlace_at)) / 3600000;
    setNext(h > 48 ? 'warn' : 'wait', h > 48 ? 'Toca hacer seguimiento' : 'Esperando su reserva', 'Enlace enviado ' + hace(parse(l.enlace_at)) + '. ' + (h > 48 ? 'Aún no ha reservado.' : 'La fase pasa sola a Reserva cuando elija hora.'));
    na.append(waTpl('seguimiento', h > 48 ? 'primary big' : ''), btn('', icon('link'), 'Copiar enlace', copiar), waTpl('no_encaja', 'danger'));
  } else if (l.estado === 'cita' && cita) {
    const hrs = (cita.d - S.ahoraUTC) / 3600000;
    setNext('ok', 'Sesión técnica ' + (hrs < 24 && hrs > 0 ? 'en ' + Math.max(1, Math.round(hrs)) + ' h' : fechaCorta(cita.d)), 'Reservada por ' + (cita.nombre || '—') + (cita.email ? ' · ' + cita.email : '') + '. Al terminar pasa sola a Sesión hecha.');
    const cal = el('div', 'pb-cal'); cal.append(el('small', null, MESES[cita.d.getMonth()]), el('b', null, String(cita.d.getDate())), el('em', null, pad(cita.d.getHours()) + ':' + pad(cita.d.getMinutes())));
    nh.append(cal);
    if (cita.meet_url) na.append(link('primary big', icon('video'), 'Abrir Google Meet', cita.meet_url));
    const rec = el('span', 'pb-chiprow'); [['Recordatorio 24 h', cita.rec24], ['Recordatorio 1 h', cita.rec1]].forEach(([t, ok]) => { const c = el('span', 'pb-chip2' + (ok ? ' ok' : '')); c.append(icon(ok ? 'check' : 'clock'), t + (ok ? ' enviado' : ' pendiente')); rec.append(c); });
    nq.append(rec);
  } else if (l.estado === 'sesion' && cita && cita.asistencia === 'auto') {
    setNext('info', '¿Asistió a la sesión?', 'La sesión del ' + fechaCorta(cita.d) + ' se marcó sola al pasar la hora. Confírmalo o corrígelo.');
    asistenciaBtns(cita, na);
  } else if (l.estado === 'sesion') {
    setNext('go', '¿Cómo terminó?', 'Sesión hecha. Marca el resultado para cerrar el embudo.');
    na.append(btn('primary big', icon('trophy'), 'Es cliente', (e) => cambiaEstado('cliente', e.currentTarget)), btn('danger', icon('x'), 'Descartar', (e) => cambiaEstado('descartado', e.currentTarget)));
  } else if (l.estado === 'no_asistio') {
    setNext('bad', 'No se presentó', 'Ofrécele otra hora con el mismo enlace.');
    na.append(waTpl('reprogramar', 'primary big'), btn('danger', icon('x'), 'Descartar', (e) => cambiaEstado('descartado', e.currentTarget)));
  } else if (l.estado === 'cliente') {
    setNext('win', 'Ya es cliente', 'Embudo completado.');
  } else {
    setNext('muted', 'Solicitud descartada', 'Si vuelve a interesarse, puedes reabrirla.');
    na.append(btn('', icon('undo'), 'Reabrir', (e) => cambiaEstado('contactado', e.currentTarget)));
  }
  nh.prepend(nt); next.append(nh, na); if (nq.childElementCount) next.append(nq);
  // Acciones rápidas siempre a mano
  const quick = el('div', 'pb-quick');
  quick.append(link('wa', brandSvg('whatsapp'), 'WhatsApp', wa(''), () => registrar(l.id, 'whatsapp')));
  const call = el('a', 'pb-btn'); call.href = 'tel:' + tel; call.append(icon('phone'), 'Llamar'); quick.append(call);
  function copiar(e) { const b = e.currentTarget; navigator.clipboard.writeText(l.booking_url).then(() => { b.lastChild.textContent = 'Copiado'; toast('Enlace de reserva copiado.'); registrar(l.id, 'copiar'); }, () => toast('No se pudo copiar.', true)); }
  quick.append(btn('', icon('link'), 'Copiar enlace de reserva', copiar));
  const more = el('details', 'pb-msgs'); const sum = el('summary'); sum.append(icon('msg'), 'Más mensajes'); more.append(sum);
  const ml = el('div', 'list'); Object.keys(tpl).forEach((k) => { const a = waTpl(k, 'ghost'); a.title = tpl[k][1]; ml.append(a); }); more.append(ml);
  quick.append(more);
  next.append(quick);
  box.append(next);

  function cambiaEstado(estado, b) { const ta = $('#pb-notas'); act('update', { id: l.id, estado, notas: ta ? ta.value : l.notas }, 'Fase actualizada: ' + ESTADOS[estado][0] + '.', b); }

  /* ---------- lo que nos contó ---------- */
  const r = respuestas(l);
  const grid = el('div', 'pb-answers');
  const ans = (label, visual, value, extra) => { const a = el('div', 'pb-ans'); const v = el('div', 'vis'); v.append(visual); a.append(v, el('small', null, label), el('b', null, value || '—')); if (extra) a.append(extra); grid.append(a); };
  let canalVis;
  if (r.canal.redes) { canalVis = el('span', 'pb-stack'); ['instagram', 'tiktok', 'facebook'].forEach((k) => canalVis.append(tile({ key: k, ...ICONS.brands[k] }, 'sm'))); }
  else if (r.canal.brand) canalVis = tile({ key: r.canal.brand, ...ICONS.brands[r.canal.brand] });
  else canalVis = el('span', 'pb-ico'), canalVis.append(icon(r.canal.ui));
  if (l.equipo) { const eq = el('span', 'pb-ico'); eq.append(icon('users')); ans('Personas en la empresa', eq, l.equipo); }
  if (l.canal) ans('Sus clientes llegan por', canalVis, l.canal);
  const meter = el('span', 'pb-meter'); [1, 2, 3].forEach((n) => meter.append(el('i', n <= r.nivel ? 'on' : ''))); if (!r.nivel) { meter.replaceChildren(); meter.className = 'pb-ico'; meter.append(icon('bars')); }
  if (l.volumen) ans('Consultas al mes', meter, l.volumen);
  const ob = el('span', 'pb-ico'); ob.append(icon(r.obj)); ans('Objetivo a 3 meses', ob, l.objetivo);
  const pr = el('span', 'pb-ico ' + (l.opcion === 'A' ? 'lime' : '')); pr.append(icon('euro'));
  ans('Presupuesto', pr, l.opcion === 'A' ? 'Sí, con presupuesto' : l.opcion === 'B' ? 'De momento explorando' : l.presupuesto);
  box.append(section('Lo que nos contó', 'msg', grid));

  /* ---------- de dónde viene ---------- */
  const leer = (json) => { try { return JSON.parse(json || '{}') || {}; } catch (e) { return {}; } };
  const t1 = leer(l.primer_toque), t2 = leer(l.ultimo_toque);
  const src = el('div', 'pb-src');
  const srcMain = el('div', 'main'); srcMain.append(tile(origen, 'xl'));
  const st = el('div'); st.append(el('b', null, origen.label));
  const sub = [MEDIO(l.medio), l.campana && 'campaña ' + l.campana, l.contenido].filter(Boolean).join(' · ');
  st.append(el('span', null, sub || 'Sin campaña'));
  srcMain.append(st);
  if (l.palabra) { const k = el('div', 'kw'); k.append(el('small', null, 'Palabra clave'), el('b', null, l.palabra)); srcMain.append(k); }
  src.append(srcMain);
  const paso = (t, titulo) => {
    const o = ORIGEN(t.utm_source || t.origen); const p = el('div', 'stop');
    p.append(tile(o, 'sm')); const tx = el('div'); tx.append(el('small', null, titulo), el('b', null, o.label + (t.utm_medium ? ' · ' + MEDIO(t.utm_medium) : '')));
    const extra = [t.landing && 'entró por ' + t.landing, t.ts && fechaCorta(new Date(t.ts))].filter(Boolean).join(' · '); if (extra) tx.append(el('span', null, extra));
    p.append(tx); return p;
  };
  const camino = el('div', 'pb-path');
  const mismo = JSON.stringify(t1) === JSON.stringify(t2);
  if (Object.keys(t1).length) camino.append(paso(t1, mismo ? 'Primera y última visita' : 'Primera visita'));
  if (Object.keys(t2).length && !mismo) { camino.append(el('i', 'arrow')); camino.append(paso(t2, 'Última visita')); }
  const fin = el('div', 'stop end'); const ft = el('span', 'pb-tile sm'); ft.style.background = 'var(--lime)'; ft.append(icon('send')); fin.append(ft);
  const fx = el('div'); fx.append(el('small', null, 'Envió el formulario'), el('b', null, (l.pagina || '/diagnostico/').replace(/^https?:\/\/[^/]+/, '')), el('span', null, l.cta ? 'botón ' + l.cta : fecha(parse(l.created_at)))); fin.append(fx);
  camino.append(el('i', 'arrow')); camino.append(fin);
  src.append(camino);

  // Canal y dueño: lo calcula lead.php con los utm y la respuesta "¿Cómo nos conociste?"; aquí se confirma o corrige
  const cbox = el('div', 'pb-canal' + (l.canal_revisar === '1' ? ' rev' : ''));
  const ctop = el('div', 'cab');
  const cinfo = canalInfo(l.canal_dueno);
  const ctx = el('div'); ctx.append(el('small', null, 'Canal y dueño'), canalPill(l));
  ctx.append(el('span', 'own', 'Dueño: ' + DUENO[cinfo.dueno] + (l.canal_manual === '1' ? ' · corregido a mano (automático: ' + canalInfo(l.canal_auto).label + ')' : '')));
  ctop.append(ctx);
  const cact = el('div', 'acts');
  const csel = el('select'); csel.setAttribute('aria-label', 'Cambiar canal y dueño');
  (S.canales || []).forEach((c) => csel.append(new Option(c.label, c.clave))); csel.value = l.canal_dueno || 'pendiente';
  csel.addEventListener('change', () => act('canal', { id: l.id, canal: csel.value }, 'Canal: ' + canalInfo(csel.value).label + '.', csel));
  cact.append(csel);
  if (l.canal_revisar === '1' && l.canal_dueno !== 'pendiente') cact.append(btn('primary', icon('check'), 'Confirmar', (e) => act('canal', { id: l.id, canal: l.canal_dueno }, 'Canal confirmado.', e.currentTarget)));
  ctop.append(cact);
  cbox.append(ctop);
  const cdet = el('div', 'why');
  cdet.append(el('span', null, 'Respuesta del formulario: ' + (l.conocio ? (S.conocio[l.conocio] || l.conocio) : 'sin respuesta')));
  if (l.canal_motivo) cdet.append(el('span', null, 'Por qué: ' + l.canal_motivo));
  cbox.append(cdet);
  src.prepend(cbox);
  box.append(section('De dónde viene', 'pin', src));

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
  if (ui.page === 'resumen') drawResumen(ui.periodo);
  if (ui.page === 'solicitudes') drawSolicitudes();
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
load().then(() => { draw(); if (ui.sel != null) marcarVista(ui.sel); }).catch((e) => { toast(e.message || 'No se han podido cargar los datos.', true); $$('.pb-skel').forEach((x) => x.classList.remove('pb-skel')); });
})();
