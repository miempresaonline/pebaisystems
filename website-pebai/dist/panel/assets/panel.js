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
  else if (['resumen', 'solicitudes', 'citas', 'conversaciones', 'prospectos', 'mapa', 'qr', 'agentes', 'caja', 'gestoria', 'growth', 'redes', 'web', 'gasto'].includes(u.get('tab'))) ui.page = u.get('tab');
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
  if (r.status === 401 || r.redirected) { pbCaduca(); return; }
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || 'Error al cargar');
  S.canales = j.canales || []; S.conocio = j.conocio || {};
  // Solicitudes = solo las del formulario. Los clientes de trato directo (WhatsApp, email, llamada) van aparte.
  S.todos = j.leads; S.leads = j.leads.filter((l) => l.tipo !== 'cliente'); S.clientes = j.leads.filter((l) => l.tipo === 'cliente'); S.citas = j.citas; S.ahora = parse(j.ahora); S.ahoraUTC = new Date(j.ahora_utc); S.csrf = j.csrf; S.loaded = true;
  S.desfase = isNaN(S.ahoraUTC) ? 0 : S.ahoraUTC.getTime() - Date.now();   // la cuenta atrás de Citas sigue el reloj del servidor
  S.eventos = d3.group(j.eventos || [], (e) => e.lead_id);
  avisarNuevas();
}
async function post(action, fields) {
  const body = new URLSearchParams({ action, csrf: S.csrf, ...fields });
  const r = await fetch(BASE, { method: 'POST', body, credentials: 'same-origin', headers: { 'Accept': 'application/json' } });
  if (r.status === 401) { pbCaduca(); return {}; }
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
$('#pb-theme').addEventListener('click', (e) => {
  const root = document.documentElement, t = root.dataset.theme === 'light' ? 'dark' : 'light';
  const aplica = () => {
    root.dataset.theme = t;
    try { localStorage.setItem('pebai-panel-theme', t); } catch (er) { /* sin almacenamiento */ }
    draw();
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = getComputedStyle(root).getPropertyValue('--ink').trim() || m.content;
  };
  if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) { aplica(); return; }
  // El tema nuevo se abre en círculo desde el botón (en móvil, el botón real está oculto: desde el centro de arriba)
  const rc = e.currentTarget.getBoundingClientRect();
  const x = rc.width ? rc.left + rc.width / 2 : innerWidth / 2, y = rc.height ? rc.top + rc.height / 2 : 0;
  const radio = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const vt = document.startViewTransition(aplica);
  vt.ready.then(() => root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radio}px at ${x}px ${y}px)`] }, { duration: 620, easing: 'cubic-bezier(.22,1,.36,1)', pseudoElement: '::view-transition-new(root)' })).catch(() => {});
});

// El estado ya no va en «Filtros»: se elige pulsando un paso del embudo o «Fuera del embudo» (17/11)
const fFuente = $('#pb-f-fuente'), fOpcion = $('#pb-f-opcion'), fCanal = $('#pb-f-canal'), fQ = $('#pb-q');
fCanal.addEventListener('change', () => set({ canal: fCanal.value || null, limit: 120 }));
fFuente.addEventListener('change', () => set({ fuente: fFuente.value || null, limit: 120 }));
fOpcion.addEventListener('change', () => set({ opcion: fOpcion.value || null, limit: 120 }));
fQ.addEventListener('input', () => { clearTimeout(fQ.h); fQ.h = setTimeout(() => set({ q: fQ.value.trim() || null, limit: 120 }), 160); });
$('#pb-limpiar').addEventListener('click', () => { fQ.value = ''; set({ estado: null, fuente: null, opcion: null, canal: null, q: null, limit: 120 }); });
document.addEventListener('keydown', (e) => {
  if (e.key === '/' && document.activeElement !== fQ && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); if (ui.page !== 'solicitudes') showPage('solicitudes'); fQ.focus(); }
  if (e.key === 'Escape' && ui.page === 'solicitudes' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) closeDetail();
});

const marcarVista = (id) => {
  const l = S.todos.find((x) => x.id === Number(id));
  if (!l || l.estado !== 'nuevo') return;
  l.estado = 'contactado'; S.recien = l.id; // respuesta inmediata en pantalla; el servidor lo confirma (y sigue en «Te toca» mientras su ficha esté abierta)
  post('visto', { id: l.id }).then(() => { toast(l.empresa + ' pasa a En revisión.'); draw(); }).catch(() => {});
};
const registrar = (id, tipo) => { post('contacto', { id, tipo }).then(draw).catch(() => {}); };
// La ficha ya no es un cajón: vive en Solicitudes, al lado de la lista (debajo de su fila en el móvil). Abrirla desde Citas o un aviso lleva a Solicitudes.
const esMovil = () => matchMedia('(max-width: 900px)').matches;
const openDetail = (id) => {
  id = Number(id);
  if (ui.page !== 'solicitudes') { ui.page = 'solicitudes'; marcaPagina('solicitudes'); window.scrollTo({ top: 0 }); }
  marcarVista(id); set({ sel: id });
  requestAnimationFrame(() => { const f = $('#so-ficha'); if (!f) return; if (esMovil()) f.scrollIntoView({ block: 'start', behavior: 'smooth' }); else { f.scrollTop = 0; const r = f.getBoundingClientRect(); if (r.top < 0 || r.top > innerHeight * .6) f.scrollIntoView({ block: 'start', behavior: 'smooth' }); } });
};
const closeDetail = () => { if (ui.sel == null) return; set({ sel: null }); };
// El cajón antiguo (#pb-drawer) ya no se abre; si sigue en la página, sus botones solo cierran
{ const c = $('#pb-cerrar'), v = $('#pb-veil'); if (c) c.addEventListener('click', closeDetail); if (v) v.addEventListener('click', closeDetail); }

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
function pintaPlazas(box, soloActual) {
  if (!box) return;
  const p = plazasAhora(); box.replaceChildren();
  const fila = (mes, usadas, actual) => {
    const r = el('div', 'pb-plz' + (usadas >= PLAZAS_MES ? ' lleno' : '') + (actual ? '' : ' sig'));
    const dots = el('span', 'dots'); for (let i = 0; i < PLAZAS_MES; i++) dots.append(el('i', i < usadas ? 'on' : ''));
    const libres = Math.max(0, PLAZAS_MES - usadas);
    r.append(el('b', null, 'Plazas gratis de ' + MESES_L[mes]), dots, el('span', 't', usadas >= PLAZAS_MES ? 'Completo' : libres + (libres === 1 ? ' libre' : ' libres')));
    return r;
  };
  box.append(fila(p.mes, p.usadas, true));
  if (!soloActual) box.append(fila(p.sigMes, p.sigUsadas, false));
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
  const dot = $('#pb-leads-dot'); if (dot) dot.hidden = true;   // ya lo dice el número del menú
}
function ping() {
  try { const a = new (window.AudioContext || window.webkitAudioContext)(); const o = a.createOscillator(), g = a.createGain(); o.type = 'sine'; o.frequency.value = 880; g.gain.setValueAtTime(.0001, a.currentTime); g.gain.exponentialRampToValueAtTime(.12, a.currentTime + .02); g.gain.exponentialRampToValueAtTime(.0001, a.currentTime + .5); o.connect(g).connect(a.destination); o.start(); o.stop(a.currentTime + .5); } catch (e) {}
}
// La campana (avisos al navegador y al móvil, también con el panel cerrado) vive en buscar.js.
// Abrir una solicitud desde el buscador o desde un aviso
document.addEventListener('pb:abrir-lead', (e) => { showPage('solicitudes'); openDetail(Number(e.detail)); });
// En Embudo, cada minuto; en el resto de secciones basta cada 2 min (para el número de solicitudes del menú)
let ultimaCarga = Date.now();
setInterval(() => {
  const embudo = ['resumen', 'solicitudes', 'citas'].includes(document.body.dataset.page);
  if (!document.hidden && S.loaded && !fichaOcupada() && Date.now() - ultimaCarga >= (embudo ? 60000 : 120000)) { ultimaCarga = Date.now(); load().then(draw).catch(() => {}); }
}, 30000);
// Con la ficha al lado, se refresca igual; solo se espera si estás escribiendo en ella o tienes abierto su menú «···»
function fichaOcupada() { const f = $('#so-ficha'), a = document.activeElement; return !!(f && ((a && f.contains(a) && /INPUT|TEXTAREA|SELECT/.test(a.tagName)) || $('.so-mas[open]', f))); }
document.addEventListener('pb:page', (e) => { if (ui.sel != null && !['solicitudes', 'citas', 'resumen'].includes(e.detail)) closeDetail(); });

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

/* ============ dibujo: solicitudes (rediseño 17/11) ============ */
// Embudo arriba con los estados reales; «Fuera del embudo» y de dónde llegan al lado; lista en filas de una línea: primero «Te toca».
const EST_COLOR = { nuevo: 'var(--lime)', contactado: 'var(--violet-2)', cita: 'var(--green)', sesion: 'var(--cyan)', no_asistio: 'var(--red)', cliente: 'var(--amber)', descartado: 'var(--muted-2)' };
const EST_CORTO = { nuevo: 'Nueva', contactado: 'En revisión', cita: 'Cita agendada', sesion: 'Sesión hecha', no_asistio: 'No se presentó', cliente: 'Cliente', descartado: 'Descartada' };
const EMBUDO = [['nuevo', 'Nuevas', 'inbox'], ['contactado', 'En revisión', 'eye'], ['cita', 'Cita', 'calendar'], ['sesion', 'Sesión hecha', 'video'], ['cliente', 'Cliente', 'star']];
const FUERA = [['no_asistio', 'No se presentó', 'x', 'var(--red)'], ['descartado', 'Descartadas', 'trash', 'var(--muted-2)']];
const ORI_COLOR = { instagram: '#DD2A7B', youtube: '#FF2D3D', tiktok: '#25F4EE', linkedin: '#0A66C2', facebook: '#1877F2', google: '#4285F4', googlemaps: '#34A853', openai: '#10A37F', perplexity: '#1F6F78', googlegemini: '#9B72CB', whatsapp: '#25D366', gmail: '#EA4335', x: '#8A8995' };
const E = (s) => window.PBX ? PBX.esc(s) : String(s ?? '');
const nombreDe = (l) => (l.empresa && !/@/.test(l.empresa) ? l.empresa : '') || l.nombre || l.empresa || 'Sin nombre';
// Logo del origen (Instagram, Google, ChatGPT…) en el formato de las piezas comunes
const logoOrigen = (fuente, cls = '') => {
  const o = ORIGEN(fuente), b = o.key && ICONS.brands[o.key];
  if (b) return `<span class="pbx-lg ${cls}" style="--lgb:${b.bg}" title="${E(o.label)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${b.d}"/></svg></span>`;
  return `<span class="pbx-lg st ${cls}" style="--lgb:${o.bg}" title="${E(o.label)}">${PBX.ico(o.ui || 'globe')}</span>`;
};
const caraLead = (l, cls = 'sm') => { const n = nombreDe(l); return `<span class="pbx-av ${cls}" style="--c:${PBX.colorDe(n)}" title="${E(n)}">${E(PBX.ini(n))}${logoOrigen(l.fuente)}</span>`; };
// Citas pasadas que nadie ha marcado (o que se marcaron solas): piden un toque
const leadsPorMarcar = () => new Set(citasClasificadas().filter((c) => c.tramo === 'pasadas' && c.lead_id && (!c.asistencia || c.asistencia === 'auto')).map((c) => c.lead_id));
const filtraLeads = () => {
  const q = (ui.q || '').toLowerCase();
  return S.leads.filter((l) => (!ui.estado || l.estado === ui.estado) && (ui.fuente == null || (ui.fuente === '(directo)' ? !l.fuente : l.fuente === ui.fuente)) && (!ui.opcion || l.opcion === ui.opcion)
    && (!ui.canal || (ui.canal === 'revisar' ? l.canal_revisar === '1' : l.canal_dueno === ui.canal))
    && (!q || ['empresa', 'nombre', 'telefono', 'notas', 'cliente_email', 'palabra', 'campana', 'objetivo'].some((k) => String(l[k] || '').toLowerCase().includes(q)) || String(l.id) === q.replace('#', '')));
};
const filaSol = (l, motivo) => {
  const n = nombreDe(l), c = canalInfo(l.canal_dueno);
  const cita = l.cita_inicio && l.cita_estado !== 'cancelada' ? parseUTC(l.cita_inicio) : null;
  const sub = [l.nombre && l.nombre !== n ? l.nombre : '', l.telefono].filter(Boolean).join(' · ');
  const c3 = cita ? `<span class="so-cita">${PBX.ico('calendar')}${E(fechaCorta(cita))}</span>`
    : `<span class="so-quien${l.canal_revisar === '1' ? ' rev' : ''}" style="--c:${CANAL_COLOR[c.clave] || '#3A404D'}">${E(QUIEN[c.dueno] || 'Sin asignar')}</span>`;
  return `<button type="button" class="so-fila${ui.sel === l.id ? ' sel' : ''}${motivo ? ' toca' : ''}" data-id="${l.id}">${caraLead(l)}
    <span class="so-q"><b>${E(n)}</b><small>${E(sub)}${motivo ? ` · <em>${E(motivo)}</em>` : ''}</small></span>
    <span class="so-c3">${c3}</span><span class="pbx-pill" style="--c:${EST_COLOR[l.estado] || 'var(--muted)'}">${E(EST_CORTO[l.estado] || l.estado)}</span><time>${E(hace(parse(l.created_at)))}</time></button>`;
};
let solFirma = '';
function drawSolicitudes() {
  const movil = esMovil();
  const firma = JSON.stringify([S.leads, S.citas, S.canales, S.recien, ui.estado, ui.fuente, ui.opcion, ui.canal, ui.q, ui.sel, ui.limit, movil]);
  if (firma === solFirma && $('#pb-leads').childElementCount) { colocaFicha(movil); return; }
  solFirma = firma;
  const porEstado = calcPorEstado(), st = stats(S.leads);

  /* ---------- embudo dibujado ---------- */
  const llega = { nuevo: st.total, contactado: st.contactadas, cita: st.citas, sesion: st.sesiones, cliente: st.clientes };
  const sTxt = { nuevo: st.total + ' han llegado', contactado: st.contactadas + ' revisadas', cita: st.citas + ' llegaron a cita', sesion: st.sesiones + ' hicieron la sesión', cliente: st.clientes + ' han firmado' };
  const pasos = EMBUDO.map(([k, t, i]) => {
    const de = S.leads.filter((l) => l.estado === k).sort((a, b) => b.id - a.id);
    return { t, n: porEstado[k] || 0, llega: llega[k], s: sTxt[k], c: EST_COLOR[k], i, on: ui.estado === k, clave: k, caras: de.slice(0, 3).map(nombreDe), mas: Math.max(0, de.length - 3) };
  });
  $('#so-etapas').innerHTML = PBX.etapas(pasos);

  /* ---------- fuera del embudo y de dónde llegan ---------- */
  const grupos = d3.rollups(S.leads, (v) => v.length, (l) => ORIGEN(l.fuente).label).sort((a, b) => b[1] - a[1]);
  const top = grupos.slice(0, 5), resto = d3.sum(grupos.slice(5), (g) => g[1]);
  const muestra = (label) => S.leads.find((l) => ORIGEN(l.fuente).label === label);
  const partes = top.map(([lab, v]) => { const o = ORIGEN(muestra(lab).fuente); return [v, ORI_COLOR[o.key] || (o.ui === 'directo' ? '#6F7189' : '#5A6172'), lab, muestra(lab).fuente]; });
  if (resto) partes.push([resto, '#3A404D', 'Otros', 'otros']);
  $('#so-fuera').innerHTML = `<p class="so-t">Fuera del embudo</p>`
    + FUERA.map(([k, t, i, c]) => `<button type="button" class="so-fu${ui.estado === k ? ' on' : ''}" data-estado="${k}" style="--c:${c}"><span class="pbx-ico sm" style="--c:${c}">${PBX.ico(i)}</span>${t}<b class="pbx-num">${porEstado[k] || 0}</b></button>`).join('')
    + `<p class="so-t">De dónde llegan</p>` + (S.leads.length ? PBX.split(partes.map((p) => p.slice(0, 3)), false)
    + `<div class="so-ley">${partes.map(([v, , lab, f]) => `<span title="${E(lab)}">${f === 'otros' ? `<span class="pbx-lg st" style="--lgb:#3A404D">${PBX.ico('more')}</span>` : logoOrigen(f)}<b>${v}</b></span>`).join('')}</div>` : '<p class="pbx-vacio">Aún no hay solicitudes.</p>');

  /* ---------- filtros ---------- */
  const fuentes = d3.rollups(S.leads, (v) => v.length, (l) => l.fuente).sort((a, b) => b[1] - a[1]);
  fFuente.replaceChildren(new Option('Todas las fuentes', ''), ...fuentes.map(([f, c]) => new Option((f || 'directo') + ' (' + c + ')', f || '(directo)')));
  fFuente.value = ui.fuente ?? ''; fOpcion.value = ui.opcion ?? '';
  const nRev = S.leads.filter((l) => l.canal_revisar === '1').length;
  fCanal.replaceChildren(new Option('Todos los canales', ''), new Option('⚠ Por revisar (' + nRev + ')', 'revisar'),
    ...(S.canales || []).map((c) => new Option(c.label + ' (' + S.leads.filter((l) => l.canal_dueno === c.clave).length + ')', c.clave)));
  fCanal.value = ui.canal ?? '';
  if (fQ !== document.activeElement) fQ.value = ui.q ?? '';
  const activos = [ui.estado && (EST_CORTO[ui.estado] || ui.estado), ui.fuente && 'Fuente: ' + ui.fuente, ui.opcion && (ui.opcion === 'A' ? 'Con presupuesto' : 'Explorando'), ui.canal && (ui.canal === 'revisar' ? 'Canal por revisar' : canalInfo(ui.canal).label), ui.q && '«' + ui.q + '»'].filter(Boolean);
  $('#so-activo').innerHTML = activos.length ? `<div class="so-activo">${activos.map((a) => `<span class="pbx-chip on">${E(a)}</span>`).join('')}<button type="button" class="pbx-btn ghost sm" data-limpiar>${PBX.ico('x')}Quitar filtros</button></div>` : '';

  /* ---------- lista: te toca + el resto ---------- */
  const list = $('#pb-leads');
  { const f = $('#so-ficha'); if (f && list.contains(f)) $('#page-solicitudes .so-main').append(f); }   // que el repintado no se lleve la ficha (móvil)
  const porMarcar = leadsPorMarcar();
  const motivo = (l) => l.estado === 'nuevo' ? 'sin revisar' : l.id === S.recien && ui.sel === l.id ? 'revisando ahora' : porMarcar.has(l.id) ? 'marca si asistió' : '';
  const rows = filtraLeads().sort((a, b) => b.id - a.id);
  const toca = rows.filter((l) => motivo(l)), otras = rows.filter((l) => !motivo(l));
  ui.orden = toca.concat(otras).map((l) => l.id);
  let h = '';
  if (!rows.length) h = `<div class="pbx-vacio">${S.loaded ? 'No hay solicitudes con estos filtros.' : ''}</div>`;
  if (toca.length) h += `<div class="so-grupo">${PBX.ico('alert')}Te toca · ${toca.length}</div><div class="so-lst">${toca.map((l) => filaSol(l, motivo(l))).join('')}</div>`;
  if (otras.length) {
    h += `<div class="so-grupo n">${toca.length ? 'El resto' : 'Solicitudes'} · ${otras.length}</div><div class="so-lst">${otras.slice(0, ui.limit).map((l) => filaSol(l, '')).join('')}</div>`;
    if (otras.length > ui.limit) h += `<div class="so-mas-filas"><button class="pbx-btn ghost sm" type="button" data-mas>Ver ${N(otras.length - ui.limit)} más</button></div>`;
  }
  list.innerHTML = h;
  colocaFicha(movil);
}
// En escritorio la ficha va en su columna; en el móvil, justo debajo de la fila que se ha tocado
function colocaFicha(movil) {
  const f = $('#so-ficha'), main = $('#page-solicitudes .so-main'); if (!f || !main) return;
  if (movil && ui.sel != null) {
    const fila = $(`#pb-leads .so-fila[data-id="${Number(ui.sel)}"]`);
    if (fila) { if (fila.nextElementSibling !== f) fila.after(f); }
    else if (f.parentNode !== $('#pb-leads') || $('#pb-leads').firstElementChild !== f) $('#pb-leads').prepend(f);
  } else if (f.parentNode !== main) main.append(f);
  f.classList.toggle('vacia', ui.sel == null);
}
// Clics de la sección (delegados: la lista se repinta entera)
{
  const pg = $('#page-solicitudes');
  pg.addEventListener('click', (e) => {
    const t = e.target;
    const et = t.closest('[data-etapa]'); if (et) { const k = et.dataset.etapa; set({ estado: ui.estado === k ? null : k, limit: 120 }); return; }
    const fu = t.closest('.so-fu'); if (fu) { const k = fu.dataset.estado; set({ estado: ui.estado === k ? null : k, limit: 120 }); return; }
    if (t.closest('[data-limpiar]')) { fQ.value = ''; set({ estado: null, fuente: null, opcion: null, canal: null, q: null, limit: 120 }); return; }
    if (t.closest('[data-mas]')) { set({ limit: ui.limit + 200 }); return; }
    const fila = t.closest('.so-fila'); if (fila) { const id = Number(fila.dataset.id); if (ui.sel === id) closeDetail(); else openDetail(id); }
  });
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

/* ============ dibujo: citas (rediseño 17/11) ============ */
// Plazas de los dos meses arriba; la próxima cita de protagonista con cuenta atrás; la semana en 7 columnas;
// de las pasadas, solo las que falta marcar; asistencia de 90 días en donut; reservas sin solicitud en franja ámbar; el resto, plegado.
const DIAS_L = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const ahoraReal = () => new Date(Date.now() + (S.desfase || 0));
const hm = (d) => pad(d.getHours()) + ':' + pad(d.getMinutes());
const mismoDia = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const quienCita = (c) => c.lead ? nombreDe(c.lead) : (c.empresa || c.nombre || 'Sin solicitud');
const fechaBaldosa = (d, cls = '') => `<div class="ci-fecha ${cls}"><small>${MESES[d.getMonth()].toUpperCase()}</small><b>${d.getDate()}</b>${cls ? '' : `<small>${DIAS[d.getDay()].toUpperCase()}</small>`}</div>`;
function cuentaAtras(c) {
  const ms = c.d - ahoraReal();
  if (ms <= 0) return ms > -3600000 ? ['En curso', 'empezó a las ' + hm(c.d)] : ['Ya pasó', ''];
  const min = Math.floor(ms / 60000), dd = Math.floor(min / 1440), h = Math.floor((min % 1440) / 60), m = min % 60;
  const txt = dd ? dd + ' d ' + h + ' h' : h ? h + ' h ' + m + ' min' : Math.max(1, m) + ' min';
  return [txt, mismoDia(c.d, ahoraReal()) ? 'para las ' + hm(c.d) : 'para el ' + DIAS[c.d.getDay()] + ' ' + c.d.getDate() + ' a las ' + hm(c.d)];
}
const recChip = (c, ok, horas) => {
  const t = horas === 24 ? '24 h' : '1 h';
  if (ok) return `<span class="ci-rec ok">${PBX.ico('check')}Recordatorio ${t} enviado</span>`;
  const sale = new Date(c.d - horas * 3600000);
  if (sale > ahoraReal()) return `<span class="ci-rec pend">${PBX.ico('clock')}El de ${t} sale ${mismoDia(sale, ahoraReal()) ? 'a las ' + hm(sale) : 'el ' + DIAS[sale.getDay()] + ' ' + sale.getDate() + ' a las ' + hm(sale)}</span>`;
  return `<span class="ci-rec pend">${PBX.ico('clock')}El de ${t}, pendiente</span>`;
};
let ciFirma = '';
function drawCitas() {
  const now = ahoraReal();
  const cs = citasClasificadas();
  const firma = JSON.stringify([S.citas, cs.map((c) => c.lead && [c.lead.id, nombreDe(c.lead), c.lead.telefono, c.lead.estado]), now.toDateString(), Math.floor(now / 3600000)]);
  if (firma === ciFirma && $('#ci-prox').childElementCount) { tickCitas(); return; }
  ciFirma = firma;
  pintaPlazas($('#pb-plazas-citas'));
  const prox = cs.filter((c) => c.tramo === 'proximas').sort((a, b) => a.d - b.d);
  const pas = cs.filter((c) => c.tramo === 'pasadas').sort((a, b) => b.d - a.d);
  const sin = cs.filter((c) => c.tramo === 'sin_vincular').sort((a, b) => a.d - b.d);

  /* ---------- próxima cita ---------- */
  const c = prox[0];
  if (!c) $('#ci-prox').innerHTML = `<span class="pbx-tag">Próxima cita</span><div class="ci-nada"><span class="pbx-ico" style="--c:var(--muted)">${PBX.ico('calendar')}</span><b>No hay citas próximas</b><span>Cuando alguien reserve, sale aquí con su cuenta atrás.</span></div>`;
  else {
    const tel = c.lead ? String(c.lead.telefono || '').replace(/\D/g, '') : '';
    const [ct, cl] = cuentaAtras(c);
    $('#ci-prox').innerHTML = `<span class="pbx-tag">Próxima cita</span>
      <div class="ci-pf">${fechaBaldosa(c.d)}<div><h3>${E(quienCita(c))}</h3><p>${E([c.nombre, DIAS_L[c.d.getDay()] + ' ' + c.d.getDate() + ' · ' + hm(c.d)].filter(Boolean).join(' · '))}</p></div></div>
      <div class="ci-cuenta"><span class="pbx-num" id="ci-cuenta">${E(ct)}</span><span id="ci-cuenta-t">${E(cl)}</span></div>
      <div class="ci-recs">${recChip(c, c.rec24, 24)}${recChip(c, c.rec1, 1)}</div>
      <div class="ci-acc">${c.meet_url ? `<a class="pbx-btn lime" href="${E(c.meet_url)}" target="_blank" rel="noopener">${PBX.ico('video')}Abrir Meet</a>` : ''}
        ${tel ? `<a class="pbx-btn wa" href="https://wa.me/${tel}" target="_blank" rel="noopener">${PBX.logo('wa')}WhatsApp</a>` : ''}
        ${c.lead ? `<button class="pbx-btn ghost" type="button" data-lead="${c.lead.id}">Ver su solicitud</button>` : `<span class="pbx-pill" style="--c:var(--amber)">Sin solicitud</span>`}</div>`;
  }

  /* ---------- esta semana ---------- */
  const lunes = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  const dom = new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + 6), finSem = new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + 7);
  const deSemana = cs.filter((x) => x.d >= lunes && x.d < finSem).sort((a, b) => a.d - b.d);
  const dias = [...Array(7)].map((_, i) => new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + i));
  const bloque = (x) => {
    const col = x.tramo === 'sin_vincular' ? 'var(--amber)' : mismoDia(x.d, now) ? 'var(--lime)' : x.d < now ? 'var(--muted-2)' : 'var(--green)';
    const tag = x.lead ? 'button' : 'div';
    return `<${tag} ${x.lead ? `type="button" data-lead="${x.lead.id}"` : ''} class="ci-bloque${x.d < now && !mismoDia(x.d, now) ? ' pasada' : ''}" style="--c:${col}" title="${E(quienCita(x) + ' · ' + hm(x.d))}"><b>${hm(x.d)}</b><span>${E(quienCita(x))}</span></${tag}>`;
  };
  const rango = lunes.getMonth() === dom.getMonth() ? `${lunes.getDate()} – ${dom.getDate()} ${MESES[dom.getMonth()]}` : `${lunes.getDate()} ${MESES[lunes.getMonth()]} – ${dom.getDate()} ${MESES[dom.getMonth()]}`;
  const luego = prox.filter((x) => x.d >= finSem);
  $('#ci-semana').innerHTML = `<div class="pbx-ch"><h3>Esta semana</h3><span>${deSemana.length} ${deSemana.length === 1 ? 'cita' : 'citas'} · ${rango}</span></div>
    <div class="ci-semana">${dias.map((d, i) => { const hoy = mismoDia(d, now), del = deSemana.filter((x) => mismoDia(x.d, d)); return `<div class="ci-dia${hoy ? ' hoy' : ''}${i > 4 ? ' finde' : ''}${del.length ? '' : ' libre'}"><header>${DIAS[d.getDay()]}<b>${d.getDate()}</b></header>${del.map(bloque).join('')}</div>`; }).join('')}</div>
    ${luego.length ? `<div class="ci-luego"><p class="so-t">Más adelante · ${luego.length}</p>${luego.slice(0, 5).map((x) => `<${x.lead ? `button type="button" data-lead="${x.lead.id}"` : 'div'} class="ci-luego-f"><span>${E(fechaCorta(x.d))}</span><b>${E(quienCita(x))}</b></${x.lead ? 'button' : 'div'}>`).join('')}${luego.length > 5 ? `<small class="pbx-m2">y ${luego.length - 5} más</small>` : ''}</div>` : ''}`;

  /* ---------- marca si asistieron (solo las pendientes) ---------- */
  const pend = pas.filter((x) => !x.asistencia || x.asistencia === 'auto');
  $('#ci-marcar').innerHTML = `<div class="pbx-ch"><h3>Marca si asistieron</h3><span>${pend.length ? pend.length + ' sin marcar' : 'Todo al día'}</span></div>`
    + (pend.length ? pend.map((x) => `<div class="ci-marcar">${fechaBaldosa(x.d, 'gris')}<div class="ci-mq">${x.lead ? `<button type="button" class="ci-link" data-lead="${x.lead.id}">${E(quienCita(x))}</button>` : `<b>${E(quienCita(x))}</b>`}
        <small>${E(DIAS_L[x.d.getDay()].replace(/^./, (m) => m.toUpperCase()) + ' ' + x.d.getDate() + ' · ' + hm(x.d) + (x.nombre ? ' · ' + x.nombre : ''))}</small>
        ${x.asistencia === 'auto' ? `<span class="ci-auto">${PBX.ico('sparkles')}Marcada sola como hecha · confírmalo</span>` : ''}</div>
      <div class="ci-mb"><button class="pbx-btn lime sm" type="button" data-asis="asistio" data-uid="${E(x.uid)}">${PBX.ico('check')}${x.asistencia === 'auto' ? 'Confirmar' : 'Asistió'}</button><button class="pbx-btn sm" type="button" data-asis="no_asistio" data-uid="${E(x.uid)}">${PBX.ico('x')}No vino</button></div></div>`).join('')
      : `<div class="ci-ok"><span class="pbx-ico sm" style="--c:var(--lime)">${PBX.ico('check')}</span>Todas las citas pasadas están marcadas.</div>`);

  /* ---------- asistencia de 90 días ---------- */
  const d90 = new Date(now.getTime() - 90 * 86400000);
  const ult = pas.filter((x) => x.d >= d90);
  const vin = ult.filter((x) => x.asistencia === 'asistio' || x.asistencia === 'auto').length, nov = ult.filter((x) => x.asistencia === 'no_asistio').length;
  const tot = vin + nov;
  $('#ci-asis').innerHTML = `<div class="pbx-ch"><h3>Asistencia</h3><span>Últimos 90 días</span></div>
    <div class="ci-dn"><div class="ci-donut">${PBX.donut([[vin, 'var(--lime)'], [nov, 'var(--red)']], tot ? Math.round(vin / tot * 100) + ' %' : '—', tot ? 'vinieron' : 'sin datos')}</div>
      <div class="ci-dn-l"><span><i class="pbx-dot r" style="--c:var(--lime)"></i>Vinieron<b>${vin}</b></span><span><i class="pbx-dot r" style="--c:var(--red)"></i>No vinieron<b>${nov}</b></span>
      <small>Si no vienen, la solicitud pasa a «No se presentó».</small></div></div>`;

  /* ---------- reservas sin solicitud ---------- */
  $('#ci-sinsol').innerHTML = sin.length ? `<div class="ci-sinsol"><div class="ci-ss-h"><span class="pbx-ico" style="--c:var(--amber)">${PBX.ico('link')}</span><b>${sin.length} ${sin.length === 1 ? 'reserva' : 'reservas'} sin solicitud</b><small>Escribe su nº de solicitud y únela.</small></div>
    ${sin.map((x) => `<div class="ci-ss-f"><span><b>${E(x.nombre || '—')}</b> · ${E(fechaCorta(x.d))}${x.email ? ' · ' + E(x.email) : ''}</span><span class="ci-ss-a"><input type="number" min="1" placeholder="Nº solicitud" aria-label="Número de solicitud" data-uid="${E(x.uid)}"><button class="pbx-btn lime sm" type="button" data-unir="${E(x.uid)}">Unir</button></span></div>`).join('')}</div>` : '';

  /* ---------- historial plegado (todas las pasadas) ---------- */
  $('#ci-hist-n').textContent = pas.length;
  $('#ci-hist').hidden = !pas.length;
  drawAgenda($('#pb-pasadas'), 'pasadas');
}
// La cuenta atrás se mueve sola sin repintar la sección
function tickCitas() {
  const e = $('#ci-cuenta'); if (!e || !S.loaded) return;
  const c = citasClasificadas().filter((x) => x.tramo === 'proximas').sort((a, b) => a.d - b.d)[0]; if (!c) return;
  const [ct, cl] = cuentaAtras(c); if (e.textContent !== ct) e.textContent = ct; const t = $('#ci-cuenta-t'); if (t && t.textContent !== cl) t.textContent = cl;
}
setInterval(() => { if (!document.hidden && ui.page === 'citas') tickCitas(); }, 20000);
{
  const pg = $('#page-citas');
  const unir = (uid, b) => { const inp = $(`#ci-sinsol input[data-uid="${CSS.escape(uid)}"]`); if (!inp || !inp.value) { toast('Escribe el número de solicitud.', true); if (inp) inp.focus(); return; } act('vincular', { uid, lead_id: inp.value }, 'Reserva unida a la solicitud #' + inp.value + '.', b); };
  pg.addEventListener('click', (e) => {
    const t = e.target;
    const ld = t.closest('[data-lead]'); if (ld) { openDetail(Number(ld.dataset.lead)); return; }
    const as = t.closest('[data-asis]'); if (as) { const v = as.dataset.asis; act('asistencia', { uid: as.dataset.uid, valor: v }, v === 'asistio' ? 'Sesión marcada como hecha.' : 'Marcada como no presentada.', as); return; }
    const un = t.closest('[data-unir]'); if (un) unir(un.dataset.unir, un);
  });
  pg.addEventListener('keydown', (e) => { const inp = e.target.closest('#ci-sinsol input[data-uid]'); if (inp && e.key === 'Enter') unir(inp.dataset.uid, inp.nextElementSibling); });
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

/* Ficha (rediseño 17/11): cabecera con cara, WhatsApp, Llamar, Enlace de reserva y «···»; progreso de 5 puntos que cambia el estado;
   lo que rellenó en baldosas; de dónde viene y de quién es; notas e historial plegados; borrar dentro de «···». */
let fichaFirma = '';
let fichaAcc = {};
const pleg = { notas: false, hist: false };
function drawDetalle() {
  const box = $('#so-ficha'); if (!box) return;
  if (ui.sel == null) {
    if (fichaFirma !== 'vacia') { fichaFirma = 'vacia'; fichaAcc = {}; box.innerHTML = `<div class="so-fvacia"><span class="pbx-ico" style="--c:var(--violet-2)">${PBX.ico('doc')}</span><b>Elige una solicitud</b><span>Su ficha se abre aquí.</span></div>`; }
    return;
  }
  const l = S.todos.find((x) => x.id === Number(ui.sel));
  if (!l) { if (S.loaded) { fichaFirma = ''; box.innerHTML = `<div class="so-fvacia"><b>No existe la solicitud #${E(ui.sel)}</b><button class="pbx-btn ghost sm" type="button" data-cerrar>Cerrar</button></div>`; } return; }
  const evs = (S.eventos.get(l.id) || []).slice().sort((a, b) => a.ts < b.ts ? -1 : 1);
  const citas = S.citas.filter((c) => c.lead_id === l.id);
  // Solo se vuelve a pintar si cambió algo de esta solicitud: así no se pierde el foco al escribir notas
  const firma = JSON.stringify([l, evs.length, citas, S.canales]);
  if (firma === fichaFirma && box.childElementCount) return;
  const prevTa = $('#pb-notas'); const keepNotes = prevTa && Number(prevTa.dataset.id) === l.id ? prevTa.value : null;
  fichaFirma = firma;
  const A = {}; let nA = 0; const acc = (fn) => { const k = 'a' + (nA++); A[k] = fn; return k; };

  const tel = String(l.telefono || '').replace(/\D/g, '');
  const wa = (text) => 'https://wa.me/' + tel + (text ? '?text=' + encodeURIComponent(text) : '');
  const tpl = TPL(l);
  const titulo = nombreDe(l);
  const correo = l.cliente_email || (/@/.test(l.empresa || '') ? l.empresa : '');
  const cambiaEstado = (estado, b) => { const ta = $('#pb-notas'); act('update', { id: l.id, estado, notas: ta ? ta.value : l.notas }, 'Fase actualizada: ' + ESTADOS[estado][0] + '.', b); };
  const waLink = (key, cls, txt) => `<a class="pbx-btn ${cls}" href="${E(wa(tpl[key][1]))}" target="_blank" rel="noopener" data-f="${acc(() => registrar(l.id, ['enlace', 'seguimiento', 'reprogramar', 'no_encaja'].includes(key) ? key : 'whatsapp'))}">${txt}</a>`;

  /* ---------- cabecera ---------- */
  const cita = citasClasificadas().filter((c) => c.lead_id === l.id).sort((a, b) => b.d - a.d)[0];
  const plz = plazasAhora(), lleno = plz.usadas >= PLAZAS_MES;
  const enlaceH = l.enlace_at ? (S.ahora - parse(l.enlace_at)) / 3600000 : null;
  let principal = '';
  if (['nuevo', 'contactado'].includes(l.estado) && !l.enlace_at) principal = lleno ? waLink('plazas', 'lime sm', PBX.ico('send') + 'Plazas llenas: ofrecer otra opción') : waLink('enlace', 'lime sm', PBX.ico('send') + 'Enviar enlace de reserva');
  else if (['nuevo', 'contactado'].includes(l.estado) && enlaceH > 48) principal = waLink('seguimiento', 'lime sm', PBX.ico('send') + 'Hacer seguimiento');
  else if (l.estado === 'cita' && cita && cita.meet_url) principal = `<a class="pbx-btn lime sm" href="${E(cita.meet_url)}" target="_blank" rel="noopener">${PBX.ico('video')}Sesión ${E(fechaCorta(cita.d))} · Meet</a>`;
  else if (l.estado === 'sesion') principal = `<button class="pbx-btn lime sm" type="button" data-f="${acc((e, b) => cambiaEstado('cliente', b))}">${PBX.ico('trophy')}Es cliente</button>`;
  else if (l.estado === 'no_asistio') principal = waLink('reprogramar', 'lime sm', PBX.ico('send') + 'Ofrecer otra hora');
  const copiar = acc((e, b) => navigator.clipboard.writeText(l.booking_url).then(() => { const s = $('span', b); if (s) s.textContent = 'Copiado'; toast('Enlace de reserva copiado.'); registrar(l.id, 'copiar'); }, () => toast('No se pudo copiar.', true)));
  const borrar = acc((e, b) => {
    if (!confirm('¿Borrar la solicitud #' + l.id + ' (' + titulo + ')? No se puede deshacer.')) return;
    b.disabled = true;
    post('borrar_lead', { id: l.id }).then(() => { toast('Solicitud #' + l.id + ' borrada.'); closeDetail(); draw(); }).catch((er) => { toast(er.message, true); b.disabled = false; });
  });
  const fueraBtns = FUERA.map(([k, t, i, c]) => l.estado === k ? `<span class="so-mi on" style="--c:${c}">${PBX.ico('check')}${E(t === 'Descartadas' ? 'Descartada' : t)}</span>`
    : `<button type="button" class="so-mi" style="--c:${c}" data-f="${acc((e, b) => cambiaEstado(k, b))}">${PBX.ico(i)}${E(t === 'Descartadas' ? 'Descartar' : 'Marcar: ' + t)}</button>`).join('');
  const menu = `<details class="so-mas"><summary class="pbx-btn ghost ico sm" title="Más" aria-label="Más opciones">${PBX.ico('more')}</summary><div class="so-menu">
      <p>Mensajes de WhatsApp</p>${Object.keys(tpl).map((k) => `<a class="so-mi" href="${E(wa(tpl[k][1]))}" target="_blank" rel="noopener" title="${E(tpl[k][1])}" data-f="${acc(() => registrar(l.id, ['enlace', 'seguimiento', 'reprogramar', 'no_encaja'].includes(k) ? k : 'whatsapp'))}"><span class="so-wa">${PBX.logo('wa')}</span>${E(tpl[k][0])}</a>`).join('')}
      <p>Fuera del embudo</p>${fueraBtns}
      ${correo ? `<p>Contacto</p><a class="so-mi" href="mailto:${E(correo)}">${PBX.ico('mail')}${E(correo)}</a>` : ''}
      <button type="button" class="so-mi rojo" data-f="${borrar}">${PBX.ico('trash')}Borrar esta solicitud</button></div></details>`;

  // Progreso de 5 puntos: pulsar uno cambia el estado. «No se presentó» se queda en Cita (en rojo); «Descartada», fuera.
  const pos = l.estado === 'no_asistio' ? 2 : EMBUDO.findIndex(([k]) => k === l.estado);
  const paso = `<div class="so-paso" role="group" aria-label="Estado">${EMBUDO.map(([k, t], i) => `<button type="button" class="so-pt${i < pos ? ' on' : ''}${i === pos ? ' ya' : ''}${i === pos && l.estado === 'no_asistio' ? ' mal' : ''}" ${i === pos && l.estado === k ? 'aria-current="step" disabled' : `data-f="${acc((e, b) => cambiaEstado(k, b))}" title="Pasar a ${E(t)}"`}><span class="d"></span><small>${E(i === 0 ? 'Nueva' : t === 'En revisión' ? 'Revisión' : t === 'Sesión hecha' ? 'Sesión' : t)}</small></button>`).join('')}</div>`;
  const fueraPill = ['no_asistio', 'descartado'].includes(l.estado) ? `<div class="so-fuera-est"><span class="pbx-pill" style="--c:${EST_COLOR[l.estado]}">${E(EST_CORTO[l.estado])}</span><small>Pulsa un paso para volver al embudo</small></div>` : '';
  const rec = l.estado === 'cita' && cita ? `<div class="so-rec">${PBX.ico('calendar')}Sesión ${E(fechaCorta(cita.d))}<span class="${cita.rec24 ? 'ok' : ''}">24 h ${cita.rec24 ? '✓' : '·'}</span><span class="${cita.rec1 ? 'ok' : ''}">1 h ${cita.rec1 ? '✓' : '·'}</span></div>` : '';
  const sub = [l.nombre && l.nombre !== titulo ? l.nombre : '', l.telefono, 'llegó ' + hace(parse(l.created_at))].filter(Boolean).join(' · ');
  const cab = `<div class="so-ft">
    <div class="so-ft-f">${caraLead(l, 'xl')}<div class="so-ft-t"><h2>${E(titulo)}</h2><p>${E(sub)}</p></div>
      <button class="pbx-btn ghost ico sm so-cerrar" type="button" data-cerrar title="Cerrar ficha (Esc)" aria-label="Cerrar ficha">${PBX.ico('x')}</button></div>
    <div class="so-acc">${principal}<a class="pbx-btn wa sm" href="${E(wa(''))}" target="_blank" rel="noopener" data-f="${acc(() => registrar(l.id, 'whatsapp'))}">${PBX.logo('wa', 'so-wa-ico')}WhatsApp</a>
      <a class="pbx-btn sm" href="tel:${E(tel)}">${PBX.ico('phone')}Llamar</a>
      <button class="pbx-btn sm" type="button" data-f="${copiar}">${PBX.ico('link')}<span>Enlace de reserva</span></button>${menu}</div>
    ${paso}${fueraPill}${rec}</div>`;

  /* ---------- lo que rellenó, en baldosas ---------- */
  const bal = [];
  const b = (ico, c, t, v, ancho) => { if (v == null || v === '') return; bal.push(`<div class="so-bal${ancho ? ' ancho' : ''}"><span class="pbx-ico sm" style="--c:${c}">${PBX.ico(ico)}</span><span><small>${E(t)}</small><b>${v}</b></span></div>`); };
  const T = (s) => s == null || s === '' ? '' : E(s);
  if (l.tipo === 'contacto') b('msg', 'var(--violet-2)', 'Su mensaje', T(l.objetivo || 'Sin mensaje'), true);
  b('euro', 'var(--lime)', 'Presupuesto', T(l.opcion === 'A' ? 'Sí, tiene' : l.opcion === 'B' ? 'De momento, explorando' : l.presupuesto));
  b('msg', 'var(--cyan)', 'Consultas al mes', T(l.volumen));
  b('users', 'var(--violet-2)', 'Sus clientes llegan por', T(l.canal));
  if (l.tipo !== 'contacto' && l.objetivo && l.objetivo !== (l.problema || '').slice(0, 500)) b('target', 'var(--amber)', 'Quiere', T(l.objetivo));
  b('user', 'var(--green)', '¿Decide?', T(l.decisor ? ({ si: 'Sí, decide', varios: 'Entre varios', otro: 'Otra persona', no: 'No decide' }[l.decisor] || l.decisor) : ''));
  b('users', 'var(--cyan)', 'Personas en la empresa', T(l.equipo));
  b('sparkles', 'var(--violet-2)', '¿Cómo nos conoció?', T(l.conocio ? ((S.conocio || {})[l.conocio] || l.conocio) : ''));
  if (l.web || l.problema) {
    let w = 'No tiene web';
    if (l.web) w = `<a href="${E(/^https?:/.test(l.web) ? l.web : 'https://' + l.web)}" target="_blank" rel="noopener">${E(l.web.replace(/^https?:\/\//, '').replace(/\/$/, ''))}</a>`;
    if (l.analisis_url) w += `<a class="pb-mini" href="${E(l.analisis_url + '?equipo=1')}" target="_blank" rel="noopener">${PBX.ico('sparkles')}Ver su análisis</a>`;
    else if (l.analisis_estado) w += `<small class="pb-mini">${E(l.analisis_estado === 'trabajando' ? 'Analizando su web…' : 'Análisis ' + l.analisis_estado)}</small>`;
    b('globe', 'var(--muted)', 'Web', w, !!(l.analisis_url || l.analisis_estado));
  }
  b('clock', 'var(--red)', 'Lo que les quita tiempo', T(l.problema), true);
  const relleno = `<div><p class="so-t">Lo que rellenó</p>${bal.length ? `<div class="so-bals">${bal.join('')}</div>` : '<p class="pbx-vacio">No rellenó nada más.</p>'}</div>`;

  /* ---------- de dónde viene y de quién es ---------- */
  const leer = (json) => { try { return JSON.parse(json || '{}') || {}; } catch (e) { return {}; } };
  const t1 = leer(l.primer_toque), origen = ORIGEN(l.fuente);
  const osub = [MEDIO(l.medio), l.campana && 'campaña ' + l.campana, l.palabra && '«' + l.palabra + '»'].filter(Boolean).join(' · ');
  const entro = (t1.landing || '').replace(/^https?:\/\/[^/]+/, '');
  const cinfo = canalInfo(l.canal_dueno);
  const opts = (S.canales || []).map((c) => `<option value="${E(c.clave)}"${c.clave === (l.canal_dueno || 'pendiente') ? ' selected' : ''}>${E(c.label)}</option>`).join('');
  const confirmar = l.canal_revisar === '1' && l.canal_dueno !== 'pendiente' ? `<button class="pbx-btn lime sm" type="button" data-f="${acc((e, bt) => act('canal', { id: l.id, canal: l.canal_dueno }, 'Confirmado.', bt))}">${PBX.ico('check')}Confirmar</button>` : '';
  const viene = `<div><p class="so-t">De dónde viene</p>
    <div class="so-orig">${logoOrigen(l.fuente, 'b')}<span><b>${E(origen.label)}</b>${osub ? ' · ' + E(osub) : ''}<small>${E(entro ? 'Entró por ' + entro : (osub ? '' : 'Llegó directo a la web'))}</small></span></div>
    <div class="so-dueno${l.canal_revisar === '1' ? ' rev' : ''}" style="--c:${CANAL_COLOR[cinfo.clave] || '#3A404D'}"${l.canal_motivo ? ` title="${E(l.canal_motivo)}"` : ''}>
      <span><small>Cliente de</small><b>${E(QUIEN[cinfo.dueno] || 'Sin asignar')}</b><em>${E(cinfo.label + (l.canal_revisar === '1' ? ' · por confirmar' : '') + (l.canal_manual === '1' ? ' · corregido a mano' : ''))}</em></span>
      <span class="so-dueno-a">${opts ? `<select class="so-canal" aria-label="Cambiar de quién es">${opts}</select>` : ''}${confirmar}</span></div></div>`;

  /* ---------- notas e historial, plegados ---------- */
  const notas = `<details class="pbx-pleg so-pleg" data-pleg="notas"${pleg.notas ? ' open' : ''}><summary><span>Notas del equipo</span><em>${l.notas ? 'escritas' : '0'}</em></summary><div class="pbx-pleg-in pb-notes">
    <textarea id="pb-notas" data-id="${l.id}" placeholder="Qué se habló, próximos pasos, dudas del cliente…"></textarea><span class="saved" id="so-notas-st">${E(l.updated_at ? 'Guardado · ' + fecha(parse(l.updated_at)) : 'Se guarda solo mientras escribes')}</span></div></details>`;
  const lista = evs.length ? evs.slice().reverse() : [{ ts: l.created_at, tipo: 'nuevo', detalle: 'Formulario de diagnóstico enviado', auto: 1 }];
  const dv = dispositivo(l.dispositivo);
  const hist = `<details class="pbx-pleg so-pleg" data-pleg="hist"${pleg.hist ? ' open' : ''}><summary><span>Historial</span><em>${Math.max(1, evs.length)}</em></summary><div class="pbx-pleg-in">
    <ol class="pb-hist">${lista.map((e) => `<li class="${e.auto ? 'auto' : 'manual'}"><div class="h"><b>${E(e.tipo === 'contacto' ? e.detalle : (EVENTOS[e.tipo] || e.tipo))}</b><span class="tag">${e.auto ? 'Automático' : 'Equipo'}</span></div>
      <div class="m">${E(fecha(parse(e.ts)) + (e.tipo !== 'contacto' && e.detalle ? ' · ' + (['reserva', 'reprogramada', 'cancelada'].includes(e.tipo) ? 'cita ' + fechaCorta(parseUTC(e.detalle)) : e.detalle) : ''))}</div></li>`).join('')}</ol>
    <div class="so-tech"><span title="${E(l.dispositivo || '')}">${PBX.ico(dv.movil ? 'mobile' : 'desktop')}${E(dv.txt)}</span><span class="${l.email_enviado ? '' : 'warn'}">${PBX.ico('mail')}${l.email_enviado ? 'Aviso enviado a equipo@' : 'Aviso por email no enviado'}</span><span>#${l.id} · ${E(fecha(parse(l.created_at)))}</span></div></div></details>`;

  fichaAcc = A;
  box.innerHTML = cab + `<div class="so-fb">${relleno}${viene}${notas}${hist}</div>`;

  /* notas: se guardan solas mientras escribes */
  const ta = $('#pb-notas', box), status = $('#so-notas-st', box);
  ta.value = keepNotes ?? l.notas ?? '';
  let tmr;
  ta.addEventListener('input', () => {
    clearTimeout(tmr); status.textContent = 'Escribiendo…'; status.className = 'saved typing';
    tmr = setTimeout(() => postQuiet('update', { id: l.id, estado: l.estado, notas: ta.value })
      .then(() => { l.notas = ta.value; fichaFirma = JSON.stringify([l, evs.length, citas, S.canales]); status.textContent = 'Guardado'; status.className = 'saved ok'; })
      .catch((e) => { status.textContent = e.message; status.className = 'saved err'; }), 900);
  });
  $$('details.so-pleg', box).forEach((d) => d.addEventListener('toggle', () => { pleg[d.dataset.pleg] = d.open; }));
}
// Clics de la ficha (delegados: se repinta cuando cambian sus datos)
{
  const box = $('#so-ficha');
  if (box) {
    box.addEventListener('click', (e) => {
      if (e.target.closest('[data-cerrar]')) { closeDetail(); return; }
      const t = e.target.closest('[data-f]'); if (!t || !box.contains(t)) return;
      const fn = fichaAcc[t.dataset.f]; if (!fn) return;
      const m = t.closest('.so-mas'); if (m) m.open = false;
      fn(e, t);
    });
    box.addEventListener('change', (e) => {
      const s = e.target.closest('select.so-canal'); if (!s || ui.sel == null) return;
      act('canal', { id: Number(ui.sel), canal: s.value }, 'Ahora es: ' + canalInfo(s.value).label + '.', s);
    });
    // «···» se cierra al pulsar fuera
    document.addEventListener('click', (e) => { $$('.so-mas[open]').forEach((d) => { if (!d.contains(e.target)) d.open = false; }); });
  }
}

/* Navegar entre solicitudes sin cerrar la ficha (↑ ↓ o j k) */
const ordenFicha = () => (ui.orden && ui.orden.length ? ui.orden : S.leads.map((l) => l.id).sort((a, b) => b - a));
const moverFicha = (paso) => { const o = ordenFicha(); const i = o.indexOf(Number(ui.sel)); const n = o[i + paso]; if (n != null) openDetail(n); };
{ const p = $('#pb-prev'), n = $('#pb-next'); if (p) p.addEventListener('click', () => moverFicha(-1)); if (n) n.addEventListener('click', () => moverFicha(1)); }
document.addEventListener('keydown', (e) => {
  if (ui.sel == null || ui.page !== 'solicitudes' || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
  if (e.key === 'ArrowUp' || e.key === 'k') { e.preventDefault(); moverFicha(-1); }
  if (e.key === 'ArrowDown' || e.key === 'j') { e.preventDefault(); moverFicha(1); }
});

/* ============ ciclo de dibujo ============ */
// El análisis por periodo (plegado al final de Solicitudes) solo se pinta abierto y si cambió algo
let resFirma = '';
function pintaAnalisis() { const an = $('#pb-analisis'); if (!an || !an.open) return; const f = JSON.stringify([S.leads, S.citas, ui.periodo, ui.dim, ui.sort, an.clientWidth]); if (f === resFirma) return; resFirma = f; drawResumen(ui.periodo); }
function draw() {
  $$('#pb-periodo button').forEach((b) => b.classList.toggle('on', b.dataset.p === ui.periodo));
  // El número del menú avisa solo de lo que falta por revisar; sin nada pendiente, no sale (16/11)
  { const pend = S.loaded ? S.leads.filter((l) => l.estado === 'nuevo').length : 0, e = $('#pb-leads-n'); e.textContent = pend ? N(pend) : ''; e.style.display = pend ? '' : 'none'; }
  $('#pb-citas-n').textContent = S.loaded ? N(citasClasificadas().filter((x) => x.tramo === 'proximas').length) : '—';
  if (!S.loaded) return;
  // El resumen de toda la app lo pinta global.js; el análisis del formulario vive en Solicitudes
  if (ui.page === 'solicitudes') { pintaAnalisis(); drawSolicitudes(); }
  if (ui.page === 'resumen') pintaPlazas($('#pb-plazas-resumen'), true);   // plazas gratis del mes, en el Resumen (30/10)
  if (ui.page === 'clientes') drawClientes();
  if (ui.page === 'citas') drawCitas();
  drawDetalle();
  if (!S.drawn) { S.drawn = true; document.body.classList.add('pb-in'); }
}
let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(draw, 120); });
document.addEventListener('visibilitychange', () => { if (!document.hidden && S.loaded && Date.now() - ultimaCarga > 30000) { ultimaCarga = Date.now(); load().then(draw).catch(() => {}); } });

/* ============ arranque ============ */
readUrl();
$$('#pb-kpis .v').forEach((e) => e.classList.add('pb-skel'));
marcaPagina(ui.page);
fQ.value = ui.q || '';
writeUrl(); draw();
// Al abrir el análisis plegable, se repinta con su ancho real (cerrado no tiene tamaño)
{ const an = $('#pb-analisis'); if (an) { try { an.open = localStorage.getItem('pb-analisis') === '1'; } catch (e) { /* nada */ } an.addEventListener('toggle', () => { try { localStorage.setItem('pb-analisis', an.open ? '1' : '0'); } catch (e) { /* nada */ } if (an.open) draw(); }); } }
load().then(() => { draw(); if (ui.sel != null) marcarVista(ui.sel); }).catch((e) => { toast(e.message || 'No se han podido cargar los datos.', true); $$('.pb-skel').forEach((x) => x.classList.remove('pb-skel')); });
})();
