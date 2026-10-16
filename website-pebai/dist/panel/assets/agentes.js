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
const ui = { estado: '', q: '', lote: '', limit: 150, act: '', vista: 'cajas', caja: '', prov: '', ciudad: '', fijo: false };
try { if (localStorage.getItem('pebai-pros-vista') === 'lista') ui.vista = 'lista'; } catch (e) { /* sin almacenamiento */ }

/* ============ dominio ============ */
const PE = {
  revision: ['En revisión', '#FFB547', '#0B0F14'], pendiente: ['En cola', '#3A404D', '#C9CED8'], enviando: ['Enviando…', '#6A5CFF', '#FFFFFF'], enviado: ['Enviado', '#6A5CFF', '#FFFFFF'],
  respondio: ['Respondió', '#25D366', '#0B0F14'], baja: ['Baja', '#FF6B7A', '#0B0F14'], sin_whatsapp: ['Sin WhatsApp', '#3A404D', '#C9CED8'],
  error: ['Revisar', '#FFB547', '#0B0F14'], descartado: ['Descartado', '#3A404D', '#C9CED8'],
};
const CHIPS = [['', 'Todos', '#EFEDE7'], ['revision', 'En revisión', '#FFB547'], ['pendiente', 'En cola', '#9A9CB0'], ['enviado', 'Sin respuesta aún', '#6A5CFF'], ['respondio', 'Respondieron', '#25D366'],
  ['error', 'Revisar', '#FFB547'], ['baja', 'Bajas', '#FF6B7A'], ['sin_whatsapp', 'Sin WhatsApp', '#3A404D'], ['descartado', 'Descartados', '#3A404D']];
const PAGINAS = { resumen: ['Embudo', 'Resumen'], solicitudes: ['Embudo', 'Solicitudes'], citas: ['Embudo', 'Citas'], prospectos: ['Captación', 'Prospectos'], mapa: ['Captación', 'Mapa'], qr: ['Captación', 'QRs'], agentes: ['Automático', 'Agentes'], caja: ['Empresa', 'Caja'] };
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
/* Cajas: nicho → provincia → lista. El nicho es el sector del scraper; la provincia, lo que va tras «·» en el lote. */
const nichoDe = (p) => p.sector || (p.lote && p.lote.includes('·') ? p.lote.split('·')[0].trim() : '') || 'Sin nicho';
const provDe = (p) => (p.lote && p.lote.includes('·') ? p.lote.slice(p.lote.lastIndexOf('·') + 1).trim() : '') || p.ciudad || 'Sin provincia';
const fijoDe = (p) => { const m = /\bfijo (\d{9})\b/.exec(p.notas || ''); return m ? m[1] : ''; };
const telFijo = (t) => '+34 ' + t.slice(0, 3) + ' ' + t.slice(3, 5) + ' ' + t.slice(5, 7) + ' ' + t.slice(7);
const BARRA = [['respondio', '#25D366'], ['enviado', '#6A5CFF'], ['enviando', '#6A5CFF'], ['revision', '#FFB547'], ['pendiente', '#9A9CB0'], ['error', '#FFB547'], ['baja', '#FF6B7A'], ['sin_whatsapp', '#3A404D'], ['descartado', '#3A404D']];
function barraEstados(lista) {
  const b = el('div', 'pb-caja-barra'); const t = lista.length || 1;
  BARRA.forEach(([k, c]) => { const n = lista.filter((p) => p.estado === k).length; if (!n) return; const i = el('i'); i.style.cssText = `flex:${n / t};background:${c}`; i.title = (PE[k] ? PE[k][0] : k) + ': ' + N(n); b.append(i); });
  return b;
}
const ICO_CAJA = (nicho) => /solar|placa|fotovolt/i.test(nicho)
  ? svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>')
  : /energ|electr/i.test(nicho) ? svg('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>') : svg('<path d="M3 7h18v13H3zM3 7l2-4h14l2 4M9 11h6"/>');
function migas(partes) {
  const m = el('nav', 'pb-cajas-migas'); m.setAttribute('aria-label', 'Dónde estás');
  partes.forEach(([t, fn], i) => { if (i) m.append(el('span', 'sep', '›')); if (fn) { const b = el('button', null, t); b.type = 'button'; b.onclick = fn; m.append(b); } else m.append(el('b', null, t)); });
  return m;
}
function cajaCard(titulo, lista, extra, onOpen, todas) {
  const c = el('button', 'pb-caja' + (todas ? ' todas' : '')); c.type = 'button';
  const provs = new Map(); lista.forEach((p) => provs.set(provDe(p), (provs.get(provDe(p)) || 0) + 1));
  const resp = lista.filter((p) => p.estado === 'respondio').length, cola = lista.filter((p) => p.estado === 'pendiente').length, fijos = lista.filter((p) => fijoDe(p)).length;
  const top = el('div', 'top'); const ic = el('span', 'ic'); ic.append(todas ? svg('<path d="M4 6h16M4 12h16M4 18h16"/>') : ICO_CAJA(titulo)); top.append(ic, el('span', 'abrir', 'Abrir'));
  const h = el('h3', null, titulo); const n = el('div', 'n'); n.append(el('b', null, N(lista.length)), el('span', null, lista.length === 1 ? 'empresa' : 'empresas'));
  const pie = el('div', 'pie'); pie.append(el('span', null, N(provs.size) + (provs.size === 1 ? ' provincia' : ' provincias')), el('span', null, N(cola) + ' en cola'), el('span', resp ? 'ok' : null, N(resp) + (resp === 1 ? ' respondió' : ' respondieron')), el('span', null, N(fijos) + ' con fijo'));
  const chips = el('div', 'provs'); [...provs.entries()].sort((a, b) => b[1] - a[1]).slice(0, extra || 4).forEach(([pv, k]) => chips.append(el('span', null, pv + ' · ' + N(k))));
  c.append(top, h, n, barraEstados(lista), chips, pie); c.onclick = onOpen;
  return c;
}
function provCard(nombre, lista, onOpen) {
  const c = el('button', 'pb-cprov'); c.type = 'button';
  const ciu = new Set(lista.map((p) => p.ciudad)); const resp = lista.filter((p) => p.estado === 'respondio').length;
  const hd = el('div', 'hd'); hd.append(el('b', null, nombre), el('span', 'num', N(lista.length)));
  const sub = el('div', 'sub', N(ciu.size) + (ciu.size === 1 ? ' ciudad' : ' ciudades') + (resp ? ' · ' + N(resp) + ' respondieron' : ''));
  c.append(hd, barraEstados(lista), sub); c.onclick = onOpen; return c;
}
const irA = (cambios) => { Object.assign(ui, cambios, { limit: 150 }); drawProspectos(); const l = $('#pb-pros-list'); if (l && l.getBoundingClientRect().top < 0) l.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
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

  if (!$('#pb-pros-vista')) {
    const v = el('div', 'pb-seg'); v.id = 'pb-pros-vista'; v.setAttribute('role', 'radiogroup'); v.setAttribute('aria-label', 'Vista');
    [['cajas', 'Cajas'], ['lista', 'Lista']].forEach(([k, l]) => { const b = el('button', null, l); b.type = 'button'; b.dataset.v = k; b.onclick = () => { ui.vista = k; try { localStorage.setItem('pebai-pros-vista', k); } catch (e) { /* nada */ } drawProspectos(); }; v.append(b); });
    const fj = el('button', 'pb-chipfijo'); fj.type = 'button'; fj.id = 'pb-pros-fijo'; fj.textContent = 'Con fijo'; fj.title = 'Solo las que tienen también teléfono fijo (para llamar)'; fj.onclick = () => { ui.fijo = !ui.fijo; ui.limit = 150; drawProspectos(); };
    $('.pb-filters', $('#page-prospectos')).append(fj, v);
  }
  $$('#pb-pros-vista button').forEach((b) => b.classList.toggle('on', b.dataset.v === ui.vista));
  $('#pb-pros-fijo').classList.toggle('on', ui.fijo);
  $('#pb-pros-lote').hidden = ui.vista === 'cajas';
  const sel = $('#pb-pros-lote'); const lotes = [...new Set(P.map((p) => p.lote).filter(Boolean))];
  if (sel.options.length - 1 !== lotes.length) { sel.length = 1; lotes.forEach((l) => sel.add(new Option(l, l))); sel.value = ui.lote; }

  const q = ui.q.toLowerCase();
  const cajas = ui.vista === 'cajas';
  const base = P.filter((p) => (!ui.estado || p.estado === ui.estado || (ui.estado === 'enviado' && p.estado === 'enviando'))
    && (cajas || !ui.lote || p.lote === ui.lote) && (!ui.fijo || fijoDe(p)));
  let rows = base.filter((p) => !q || [p.empresa, p.nombre, p.telefono, p.sector, p.ciudad, p.notas].join(' ').toLowerCase().includes(q));
  const list = $('#pb-pros-list'); list.textContent = '';
  list.classList.toggle('cajas', cajas);
  if (cajas) {
    const enCaja = ui.caja && ui.caja !== '*' ? rows.filter((p) => nichoDe(p) === ui.caja) : rows;
    const tituloCaja = ui.caja === '*' ? 'Todas las empresas' : ui.caja;
    if (!ui.caja && !q) {
      // nivel 1: una caja por nicho
      const grupos = new Map(); rows.forEach((p) => { const k = nichoDe(p); if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(p); });
      const g = el('div', 'pb-cajas');
      [...grupos.entries()].sort((a, b) => b[1].length - a[1].length).forEach(([k, l], i) => { const c = cajaCard(k, l, 4, () => irA({ caja: k, prov: '', ciudad: '' })); c.style.setProperty('--i', i); g.append(c); });
      if (grupos.size > 1) { const c = cajaCard('Todas', rows, 5, () => irA({ caja: '*', prov: '', ciudad: '' }), true); c.style.setProperty('--i', grupos.size); g.append(c); }
      if (!rows.length) g.append(el('div', 'pb-card pb-empty', P.length ? 'Nada con estos filtros.' : 'Aún no hay prospectos. Pulsa «Añadir prospectos» y sube la primera lista.'));
      list.append(g); return;
    }
    if (ui.caja && !ui.prov && !q) {
      // nivel 2: dentro de la caja, por provincia
      const head = el('div', 'pb-cajas-head'); head.append(migas([['Cajas', () => irA({ caja: '', prov: '', ciudad: '' })], [tituloCaja]]));
      head.append(btn('primary', null, 'Ver todas (' + N(enCaja.length) + ')', () => irA({ prov: '*', ciudad: '' })));
      list.append(head);
      const grupos = new Map(); enCaja.forEach((p) => { const k = provDe(p); if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(p); });
      const g = el('div', 'pb-cprovs');
      [...grupos.entries()].sort((a, b) => b[1].length - a[1].length).forEach(([k, l], i) => { const c = provCard(k, l, () => irA({ prov: k, ciudad: '' })); c.style.setProperty('--i', Math.min(i, 20)); g.append(c); });
      if (!enCaja.length) g.append(el('div', 'pb-card pb-empty', 'Nada con estos filtros.'));
      list.append(g); return;
    }
    // nivel 3: la lista de siempre, dentro de la caja y la provincia (o la búsqueda)
    const enProv = ui.prov && ui.prov !== '*' ? enCaja.filter((p) => provDe(p) === ui.prov) : enCaja;
    const head = el('div', 'pb-cajas-head');
    const pasos = [['Cajas', () => irA({ caja: '', prov: '', ciudad: '' })]];
    if (ui.caja) pasos.push([tituloCaja, ui.prov ? () => irA({ prov: '', ciudad: '' }) : null]);
    if (ui.prov) pasos.push([ui.prov === '*' ? 'Todas' : ui.prov, ui.ciudad ? () => irA({ ciudad: '' }) : null]);
    if (q) pasos.push(['Búsqueda «' + ui.q + '»']);
    head.append(migas(pasos)); list.append(head);
    const ciudades = new Map(); enProv.forEach((p) => ciudades.set(p.ciudad, (ciudades.get(p.ciudad) || 0) + 1));
    if (ui.prov && ui.prov !== '*' && ciudades.size > 1) {
      const cc = el('div', 'pb-ciuchips');
      const todas = el('button', ui.ciudad ? null : 'on', 'Todas · ' + N(enProv.length)); todas.type = 'button'; todas.onclick = () => irA({ ciudad: '' }); cc.append(todas);
      [...ciudades.entries()].sort((a, b) => b[1] - a[1]).forEach(([cn, k]) => { const b = el('button', ui.ciudad === cn ? 'on' : null, cn + ' · ' + N(k)); b.type = 'button'; b.onclick = () => irA({ ciudad: cn }); cc.append(b); });
      list.append(cc);
    }
    rows = ui.ciudad ? enProv.filter((p) => p.ciudad === ui.ciudad) : enProv;
  }
  // En revisión: el agente no les escribe. Se aprueban una a una o todas las del lote/filtro de golpe.
  const enRev = rows.filter((p) => p.estado === 'revision').length;
  if (enRev) {
    // El servidor aprueba por lote: el botón solo sale cuando lo que se ve es exactamente un lote (o todo, sin filtros),
    // y dice cuántas aprueba de verdad, aunque haya un filtro de ciudad encima.
    const lotesRev = [...new Set(rows.filter((p) => p.estado === 'revision').map((p) => p.lote))];
    const sinFiltros = !cajas && !q && !ui.fijo && (!ui.estado || ui.estado === 'revision');
    const loteAprobar = !cajas && ui.lote ? ui.lote : lotesRev.length === 1 ? lotesRev[0] : sinFiltros ? '' : null;
    const nAprobar = loteAprobar === null ? 0 : P.filter((p) => p.estado === 'revision' && (!loteAprobar || p.lote === loteAprobar)).length;
    const bar = el('div', 'pb-card'); bar.style.cssText = 'display:flex;gap:14px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-bottom:8px;border-color:color-mix(in srgb,var(--amber) 50%,var(--line))';
    bar.append(el('div', null, N(enRev) + ' en revisión aquí: el agente no les escribe hasta que las apruebes.' + (loteAprobar === null ? ' Apruébalas una a una, o abre una provincia para aprobarlas de golpe.' : '')));
    if (loteAprobar !== null) bar.append(btn('primary', null, (loteAprobar ? 'Aprobar las ' + N(nAprobar) + ' del lote «' + loteAprobar + '»' : 'Aprobar todas (' + N(nAprobar) + ')'), (e) => {
      if (!confirm('¿Pasar ' + nAprobar + ' empresas' + (loteAprobar ? ' del lote «' + loteAprobar + '»' : '') + ' a la cola del agente de WhatsApp? Empezará a escribirles en su horario, a su ritmo diario.')) return;
      post('prospectos_aprobar', { lote: loteAprobar }, e.currentTarget).then((j) => { toast(N(j.aprobados) + ' aprobadas: ya están en la cola.'); }).catch((er) => toast(er.message, true));
    }));
    list.append(bar);
  }
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
  const fj = fijoDe(p);
  if (fj) { const a = el('a', 'tel fijo'); a.href = 'tel:+34' + fj; a.textContent = 'Fijo ' + telFijo(fj); a.title = 'Llamar al fijo'; meta.append(el('span', 'sep', '·'), a); }
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
  if (p.estado === 'revision') acts.append(btn('primary', null, 'Aprobar', (e) => cambia(p, 'pendiente', e.currentTarget)));
  if (p.web) { const a = el('a', 'pb-btn ghost'); a.href = p.web; a.target = '_blank'; a.rel = 'noopener'; a.append('Ver web'); acts.append(a); }
  if (['pendiente', 'error', 'revision'].includes(p.estado)) acts.append(btn('ghost', null, 'Descartar', (e) => cambia(p, 'descartado', e.currentTarget)));
  if (['descartado', 'error', 'sin_whatsapp'].includes(p.estado)) acts.append(btn('ghost', ICO.back(), 'A la cola', (e) => cambia(p, 'pendiente', e.currentTarget)));
  if (p.estado !== 'baja') acts.append(btn('danger', null, 'Baja', (e) => { if (confirm('¿Dar de baja a ' + (p.empresa || telBonito(p.telefono)) + '? No se le volverá a escribir nunca.')) cambia(p, 'baja', e.currentTarget); }, 'Pidió no recibir más mensajes'));
  r.append(acts);
  row.append(av, who, r);
  // En revisión se ve lo que dice el scraper de ella (qué hace, tamaño, por qué está activa) para decidir
  if (p.estado === 'revision' && p.notas) row.append(el('div', 'msg', p.notas));
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
    const partes = [N(r.nuevos) + (r.revision ? ' nuevos en revisión' : ' nuevos en cola')];
    if (r.repetidos) partes.push(N(r.repetidos) + ' ya estaban'); if (r.invalidos) partes.push(N(r.invalidos) + ' sin móvil válido');
    if (r.bajas) partes.push(N(r.bajas) + ' con baja'); if (r.embudo) partes.push(N(r.embudo) + ' ya son solicitudes');
    toast(partes.join(' · ') + '.'); f.reset(); fichero(); imp.hidden = true; ui.estado = r.revision ? 'revision' : 'pendiente';
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
  box.prepend(queHace(w));
  box.append(body);
  box.append(statsCard());
  box.append(registroCard());
  box.append(configCard(w));
}

/* Qué hace el agente, en una frase. */
function queHace(w) {
  const v = (w.ventanas || []).map((x) => x.join('–')).join(' y ');
  const nichos = (S.nichos || []).map((n) => n.nombre + ' (' + Object.keys(n.plantillas || {}).join(' / ') + ')').join(', ');
  return el('p', 'pw-que', `Cada día laborable (${v}) escribe a un máximo de ${w.limite_dia} empresas, una a una, como Daniel y con pausas de persona. `
    + `Solo manda el primer mensaje: si contestan, te avisa y contestas tú. A quien no contesta no le vuelve a escribir. `
    + `Elige el mensaje según el nicho y reparte las variantes a partes iguales para ver cuál funciona: ${nichos}.`);
}

/* Qué mensaje funciona mejor: resultados por plantilla (nicho y variante). */
function statsCard() {
  const c = el('div', 'pb-card pw-card');
  c.append(el('h2', null, 'Qué mensaje funciona mejor'), el('p', 'note', 'Por cada plantilla: a cuántos se ha enviado y cuántos han contestado. Con menos de 50 envíos por variante las diferencias aún no significan nada.'));
  const st = S.stats || [];
  if (!st.length) { c.append(el('div', 'pb-empty', 'Todavía no se ha enviado ningún mensaje con plantilla.')); return c; }
  const nombre = (k) => { const [n, v] = String(k).split('-'); const ni = (S.nichos || []).find((x) => x.clave === n); return (ni ? ni.nombre : n) + ' · ' + (v || ''); };
  const t = el('table', 'pb-table'); const th = el('thead'); const hr = el('tr');
  ['Plantilla', 'Enviados', 'Respondieron', '% respuesta', 'Bajas', 'Sin WhatsApp'].forEach((h, i) => { const x = el('th', i ? 'n' : '', h); hr.append(x); });
  th.append(hr); const tb = el('tbody');
  st.forEach((r) => {
    const tr = el('tr'); const env = Number(r.enviados), resp = Number(r.respondieron);
    [nombre(r.plantilla), N(env), N(resp), pct(resp, env), N(Number(r.bajas)), N(Number(r.sin_whatsapp))].forEach((v, i) => tr.append(el('td', i ? 'n' : 'k', v)));
    tb.append(tr);
  });
  t.append(th, tb); const sc = el('div', 'pb-scroll'); sc.append(t); c.append(sc);
  return c;
}

/* Registro de actividad: cada decisión del agente (regla común de todos los agentes). */
const TIPO_ACT = { envio: ['Envío', 'var(--violet)'], bloqueo: ['No enviado', 'var(--slate)'], respuesta: ['Respuesta', 'var(--lime)'], espera: ['En espera', 'var(--muted-2)'],
  freno: ['Freno', 'var(--red)'], error: ['Error', 'var(--amber)'], cambio: ['Cambio', 'var(--cyan)'], hito: ['Hito', 'var(--green)'] };
function registroCard() {
  const c = el('div', 'pb-card pw-card');
  c.append(el('h2', null, 'Registro de actividad'), el('p', 'note', 'Todo lo que ha hecho el agente y por qué: a quién escribió, a quién no (y el motivo), qué respuestas llegaron y cuándo esperó. Pulsa una línea para ver el detalle.'));
  const chips = el('div', 'pb-subtabs');
  [['', 'Todo']].concat(Object.entries(TIPO_ACT).map(([t, [l]]) => [t, l])).forEach(([t, l]) => {
    const b = el('button', (ui.act || '') === t ? 'on' : '', l); b.type = 'button'; b.addEventListener('click', () => { ui.act = t; drawAgentes(); }); chips.append(b);
  });
  const list = el('div', 'pw-log');
  const filas = (S.actividad || []).filter((a) => !ui.act || a.tipo === ui.act).slice(0, 100);
  if (!filas.length) list.append(el('div', 'pb-empty', 'Sin actividad todavía.'));
  filas.forEach((a) => {
    const [l, color] = TIPO_ACT[a.tipo] || [a.tipo, 'var(--muted)'];
    const d = el('details', 'pw-log-i'); const sm = el('summary'); const chip = el('em', null, l); chip.style.setProperty('--c', color);
    sm.append(el('time', null, cuando(parse(a.ts))), chip, el('span', null, a.resumen));
    d.append(sm); if (a.detalle) d.append(el('pre', 'pw-pre', a.detalle));
    list.append(d);
  });
  c.append(chips, list); return c;
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
  const pl = el('div'); pl.style.cssText = 'display:flex;flex-direction:column;gap:12px';
  (S.nichos || []).forEach((n) => {
    const lab = el('label', 'pb-field'); lab.append(el('span', null, 'Primer mensaje · ' + n.nombre + ' · una variante por bloque («A: …»), separadas con una línea ---'));
    const ta = el('textarea'); ta.name = 'plantillas[' + n.clave + ']';
    ta.value = Object.entries(n.plantillas || {}).map(([k, t]) => k + ': ' + t).join('\n---\n'); lab.append(ta); pl.append(lab);
  });
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
