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
const ui = { estado: '', q: '', lote: '', limit: 150, act: '', vista: 'cajas', caja: '', prov: '', ciudad: '', fijo: false, canal: '', hub: true };
try { if (localStorage.getItem('pebai-pros-vista') === 'lista') ui.vista = 'lista'; } catch (e) { /* sin almacenamiento */ }

/* ============ dominio ============ */
const PE = {
  revision: ['Por aprobar', '#FFB547', '#0B0F14'], pendiente: ['Por escribir', '#3A404D', '#C9CED8'], enviando: ['Enviando…', '#6A5CFF', '#FFFFFF'], enviado: ['Enviado', '#6A5CFF', '#FFFFFF'],
  respondio: ['Respondió', '#25D366', '#0B0F14'], baja: ['Baja', '#FF6B7A', '#0B0F14'], sin_whatsapp: ['Sin WhatsApp', '#3A404D', '#C9CED8'],
  error: ['Revisar', '#FFB547', '#0B0F14'], descartado: ['Descartado', '#3A404D', '#C9CED8'],
};
// Las descartadas no son prospectos: ni se cuentan ni se listan (solo una nota al pie).
const CHIPS = [['', 'Todas', '#EFEDE7'], ['pendiente', 'Por escribir', '#9A9CB0'], ['enviado', 'Escritas, sin respuesta', '#6A5CFF'], ['respondio', 'Respondieron', '#25D366'],
  ['revision', 'Por aprobar', '#FFB547'], ['error', 'Revisar', '#FFB547'], ['baja', 'Bajas', '#FF6B7A'], ['sin_whatsapp', 'Sin WhatsApp', '#3A404D']];
const CANALES = [['', 'Todos los canales'], ['wa', 'WhatsApp'], ['email', 'Email']];
// Carpetas por nicho (21/10): placas solares es el activo; el resto se llena solo con los scrapers nuevos y aún no se les escribe
const CARPETAS = [['solar', 'Placas solares', '#B7FF3C'], ['climatizacion', 'Climatización', '#3FD5FF'], ['oposiciones', 'Oposiciones', '#FFB547'],
  ['formacion', 'Formación especializada', '#7E73FF'], ['idiomas', 'Idiomas', '#FF8AD8'],
  ['dentales', 'Clínicas dentales', '#5CE1E6'], ['inmobiliarias', 'Inmobiliarias', '#FFD166']];
const carpetaDe = (p) => (p.canal === 'email' ? ((p.nicho || 'energia') === 'energia' ? 'solar' : p.nicho) : (p.nicho || 'solar'));
// Un solo nombre por nicho, venga de la lista de WhatsApp o de la de email
const NICHO_NOMBRE = (k) => /solar|placa|fotovolt|instaladores energ|^energia$/i.test(k) ? 'Placas solares' : k === 'luz' ? 'Comercializadoras de luz' : k === 'luz_coop' ? 'Cooperativas eléctricas' : k;
// Estado de una empresa de la lista de email, con los mismos nombres que la de WhatsApp
const estadoEmail = (p) => {
  const e = String(p.estado || '');
  if (p.respondido_at || ['respondido', 'respondio', 'interesado'].includes(e)) return 'respondio';
  if (['baja', 'no_interesa', 'no'].includes(e)) return 'baja';
  if (['rebotado', 'rebote', 'error'].includes(e)) return 'error';
  if (p.enviado1_at || e.startsWith('enviado') || e === 'seguimiento') return 'enviado';
  return e === 'revision' ? 'revision' : 'pendiente';
};
const PAGINAS = { resumen: ['Embudo', 'Resumen'], solicitudes: ['Embudo', 'Solicitudes'], citas: ['Embudo', 'Citas'], conversaciones: ['Captación', 'Conversaciones'], prospectos: ['Captación', 'Prospectos'], mapa: ['Captación', 'Mapa'], qr: ['Captación', 'QRs'], agentes: ['Automático', 'Agentes'], caja: ['Empresa', 'Caja'], redes: ['Contenido', 'Redes'] };
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
  // Una sola lista de empresas buenas: las de WhatsApp (con móvil) y las de email (sin móvil), sin descartadas
  const wa = (j.prospectos || []).filter((p) => p.estado !== 'descartado').map((p) => ({ ...p, canal: 'wa' }));
  const em = (j.email_prospectos || []).map((p) => ({ ...p, canal: 'email', estado: estadoEmail(p), enviado_at: p.enviado1_at, sector: p.nicho || p.sector }));
  S.empresas = wa.concat(em);
  S.descartadas = j.descartadas != null ? j.descartadas : (j.prospectos || []).length - wa.length;
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
  $('#pb-pros-n').textContent = N((S.empresas || []).length);
  const e = estadoAgente(); const live = $('#pb-ag-live');
  live.dataset.s = e.s; live.title = 'WhatsApp: ' + e.t;
}

/* ============ Captación · prospectos ============ */
/* Cajas: nicho → provincia → lista. El nicho es el sector del scraper; la provincia, lo que va tras «·» en el lote. */
const nichoDe = (p) => { const k = carpetaDe(p); const c = CARPETAS.find((x) => x[0] === k); return c ? c[1] : NICHO_NOMBRE(k); };
const provDe = (p) => (p.lote && p.lote.includes('·') ? p.lote.slice(p.lote.lastIndexOf('·') + 1).trim() : '') || p.ciudad || 'Sin provincia';
const fijoDe = (p) => { const m = /\bfijo (\d{9})\b/.exec(p.notas || ''); return m ? m[1] : ''; };
const telFijo = (t) => '+34 ' + t.slice(0, 3) + ' ' + t.slice(3, 5) + ' ' + t.slice(5, 7) + ' ' + t.slice(7);
const BARRA = [['respondio', '#25D366'], ['enviado', '#6A5CFF'], ['enviando', '#6A5CFF'], ['revision', '#FFB547'], ['pendiente', '#9A9CB0'], ['error', '#FFB547'], ['baja', '#FF6B7A'], ['sin_whatsapp', '#3A404D'], ['descartado', '#3A404D']];
function barraEstados(lista) {
  const b = el('div', 'pb-caja-barra'); const t = lista.length || 1;
  BARRA.forEach(([k, c]) => { const n = lista.filter((p) => p.estado === k).length; if (!n) return; const i = el('i'); i.style.cssText = `flex:${n / t};background:${c}`; i.title = (PE[k] ? PE[k][0] : k) + ': ' + N(n); b.append(i); });
  return b;
}
const ICO_CAJA = (nicho) => /climatiz/i.test(nicho) ? svg('<path d="M12 2v20M4.9 7l14.2 10M4.9 17 19.1 7M9 4l3 2 3-2M9 20l3-2 3 2"/>')
  : /oposici/i.test(nicho) ? svg('<path d="M4 4h11a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3z"/><path d="M4 17a3 3 0 0 1 3-3h11"/>')
  : /formaci/i.test(nicho) ? svg('<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>')
  : /idioma/i.test(nicho) ? svg('<path d="M4 5h10v8H8l-4 3z"/><path d="M14 9h6v8l-3-2h-5v-2"/>')
  : /solar|placa|fotovolt/i.test(nicho)
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
  const pie = el('div', 'pie'); pie.append(el('span', null, N(provs.size) + (provs.size === 1 ? ' provincia' : ' provincias')), el('span', null, N(cola) + ' por escribir'), el('span', resp ? 'ok' : null, N(resp) + (resp === 1 ? ' respondió' : ' respondieron')), el('span', null, N(fijos) + ' con fijo'));
  const chips = el('div', 'provs'); [...provs.entries()].sort((a, b) => b[1] - a[1]).slice(0, extra || 4).forEach(([pv, k]) => chips.append(el('span', null, pv + ' · ' + N(k))));
  const cuenta = el('div', 'n'); cuenta.append(el('b', null, N(lista.length)), el('span', null, lista.length === 1 ? 'empresa' : 'empresas'));
  c.append(top, h, cuenta); c.onclick = onOpen;   // la carpeta con su número; el resto se ve al abrirla
  return c;
}
function provCard(nombre, lista, onOpen) {
  const c = el('button', 'pb-cprov'); c.type = 'button';
  const ciu = new Set(lista.map((p) => p.ciudad)); const resp = lista.filter((p) => p.estado === 'respondio').length;
  const hd = el('div', 'hd'); hd.append(el('b', null, nombre), el('span', 'num', N(lista.length)));
  const sub = el('div', 'sub', N(ciu.size) + (ciu.size === 1 ? ' ciudad' : ' ciudades') + (resp ? ' · ' + N(resp) + ' respondieron' : ''));
  c.append(hd); c.onclick = onOpen; return c;
}
const irA = (cambios) => { Object.assign(ui, cambios, { limit: 150 }); drawProspectos(); const l = $('#pb-pros-list'); if (l && l.getBoundingClientRect().top < 0) l.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
function drawHub(P) {
  const sec = $('#page-prospectos');
  let hub = $('#pb-pros-hub');
  if (!hub) { hub = el('div', 'pb-hub'); hub.id = 'pb-pros-hub'; $('.pb-pagehead', sec).after(hub); }
  const nCarp = new Set(P.map((p) => nichoDe(p))).size, nProv = new Set(P.map((p) => provDe(p)).filter((x) => x && x !== 'Sin provincia')).size;
  const toca = ((document.getElementById('pb-conv-n') || {}).textContent || '').trim();
  const tarjetas = [
    ['prospectos', 'Empresas', N(P.length), 'empresas en ' + N(nCarp) + (nCarp === 1 ? ' carpeta' : ' carpetas'), SUBS[0][2], 'Abre las carpetas por nicho y provincia'],
    ['conversaciones', 'Conversaciones', /^\d+$/.test(toca) ? toca : '—', /^\d+$/.test(toca) && toca !== '0' ? 'te toca responder' : 'todo contestado', SUBS[1][2], 'Lo que han contestado por WhatsApp y email'],
    ['mapa', 'Mapa', N(nProv), nProv === 1 ? 'provincia con empresas' : 'provincias con empresas', SUBS[2][2], 'Dónde están las empresas, en España'],
  ];
  hub.innerHTML = '';
  tarjetas.forEach(([k, t, n, d, ic, sub], i) => {
    const b = el('button', 'pb-hub-c ' + k); b.type = 'button'; b.style.setProperty('--i', i);
    b.innerHTML = `<span class="ic"><svg class="pb-i" viewBox="0 0 24 24">${ic}</svg></span><span class="t">${t}</span><b>${n}</b><small>${d}</small><span class="sub">${sub}</span><span class="ir">Entrar →</span>`;
    b.onclick = () => { if (k === 'prospectos') { ui.hub = false; drawProspectos(); window.scrollTo({ top: 0, behavior: 'smooth' }); } else { const nb = document.querySelector(`#pb-tabs button[data-page="${k}"]`); if (nb) nb.click(); } };
    hub.append(b);
  });
}
function drawProspectos() {
  const TODAS = S.empresas || [];
  const ENC = TODAS;
  const P = ENC;
  const cuenta = (k) => P.filter((p) => p.estado === k).length;
  const enviados = P.filter((p) => ['enviado', 'respondio', 'baja'].includes(p.estado) && p.enviado_at).length;
  const resp = cuenta('respondio') + P.filter((p) => p.estado === 'baja' && p.respondido_at).length;
  const pend = cuenta('pendiente');
  const nCarpetas = new Set(ENC.map((p) => nichoDe(p))).size;
  // Entrada de Prospectos: tres puertas (Empresas, Conversaciones, Mapa); el resto se oculta hasta elegir
  const secP = $('#page-prospectos');
  secP.classList.toggle('pb-en-hub', !!ui.hub);
  if (ui.hub) { drawHub(P); return; }
  const kp = $('#pb-pros-kpis'); kp.textContent = ''; kp.hidden = true;
  if (false) [[true, 'Empresas', P.length, 'en ' + N(nCarpetas) + ' carpetas'],
    [false, 'Por escribir', pend, 'aún no les ha escrito nadie'], [false, 'Escritas', enviados, 'primer mensaje enviado'],
    [false, 'Respondieron', resp, pct(resp, enviados) + ' de las escritas'], [false, 'Bajas', cuenta('baja'), 'no se les vuelve a escribir']]
    .forEach(([hero, l, v, d], i) => {
      const c = el('div', 'pb-card pb-kpi pb-anim' + (hero ? ' hero' : '')); c.style.setProperty('--i', i);
      c.append(el('div', 'l', l), el('div', 'v', N(v)), el('div', 'd', d)); kp.append(c);
    });

  const ch = $('#pb-pros-chips'); ch.textContent = ''; ch.hidden = true;
  if (false) CHIPS.forEach(([k, l, c]) => {
    const n = k ? (k === 'enviado' ? cuenta('enviado') + cuenta('enviando') : cuenta(k)) : P.length;
    if (k && !n && !['pendiente', 'enviado', 'respondio'].includes(k)) return;
    const b = el('button', 'pb-chip' + (ui.estado === k ? ' on' : '')); b.type = 'button';
    const bar = el('i'); bar.style.background = c; b.append(bar, el('b', null, N(n)), el('small', null, l));
    b.addEventListener('click', () => { ui.estado = k; ui.limit = 150; drawProspectos(); });
    ch.append(b);
  });

  if (!$('#pb-pros-canal')) {
    const v = el('div', 'pb-seg'); v.id = 'pb-pros-vista'; v.setAttribute('role', 'radiogroup'); v.setAttribute('aria-label', 'Vista');
    [['cajas', 'Cajas'], ['lista', 'Lista']].forEach(([k, l]) => { const b = el('button', null, l); b.type = 'button'; b.dataset.v = k; b.onclick = () => { ui.vista = k; try { localStorage.setItem('pebai-pros-vista', k); } catch (e) { /* nada */ } drawProspectos(); }; v.append(b); });
    const fj = el('button', 'pb-chipfijo'); fj.type = 'button'; fj.id = 'pb-pros-fijo'; fj.textContent = 'Con fijo'; fj.title = 'Solo las que tienen también teléfono fijo (para llamar)'; fj.onclick = () => { ui.fijo = !ui.fijo; ui.limit = 150; drawProspectos(); };
    const mk = (id, ops, val, set) => { const s2 = el('select'); s2.id = id; ops.forEach(([k, t]) => s2.add(new Option(t, k))); s2.value = val; s2.onchange = () => { set(s2.value); ui.limit = 150; drawProspectos(); }; return s2; };
    const fc = mk('pb-pros-canal', [['', 'Todos los canales'], ['wa', 'WhatsApp'], ['email', 'Email']], ui.canal, (x) => { ui.canal = x; });
    const fe = mk('pb-pros-est', [['', 'Todos los estados'], ['pendiente', 'Por escribir'], ['revision', 'Por revisar'], ['enviado', 'Escritas'], ['respondio', 'Respondieron'], ['baja', 'Bajas'], ['sin_whatsapp', 'Sin WhatsApp']], ui.estado, (x) => { ui.estado = x; });
    $('.pb-filters', $('#page-prospectos')).append(fc, fe, fj);
    const pie = el('p', 'note pb-pros-pie'); pie.id = 'pb-pros-pie'; $('#page-prospectos').append(pie);
  }
  $('#pb-pros-pie').textContent = S.descartadas ? N(S.descartadas) + ' empresas encontradas por el Scraper no eran del nicho y se descartaron: no cuentan ni salen aquí.' : '';
  ui.vista = 'cajas';
  $('#pb-pros-fijo').classList.toggle('on', ui.fijo);
  $('#pb-pros-lote').hidden = ui.vista === 'cajas';
  const sel = $('#pb-pros-lote'); const lotes = [...new Set(P.map((p) => p.lote).filter(Boolean))];
  if (sel.options.length - 1 !== lotes.length) { sel.length = 1; lotes.forEach((l) => sel.add(new Option(l, l))); sel.value = ui.lote; }

  const q = ui.q.toLowerCase();
  const cajas = ui.vista === 'cajas';
  const base = P.filter((p) => (!ui.canal || p.canal === ui.canal) && (!ui.estado || p.estado === ui.estado || (ui.estado === 'enviado' && p.estado === 'enviando'))
    && (cajas || !ui.lote || p.lote === ui.lote) && (!ui.fijo || fijoDe(p)));
  let rows = base.filter((p) => !q || [p.empresa, p.nombre, p.telefono, p.email, p.sector, p.ciudad, p.notas].join(' ').toLowerCase().includes(q));
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
      if (!rows.length) g.append(el('div', 'pb-card pb-empty', P.length ? 'Nada con estos filtros.' : 'Aún no hay prospectos: el Scraper los irá metiendo en su carpeta.'));
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
    e.textContent = P.length ? 'Nada con estos filtros.' : 'Aún no hay empresas en este canal.';
    list.append(e); return;
  }
  rows.slice(0, ui.limit).forEach((p, i) => { const f = filaProspecto(p); f.classList.add('pb-entra'); f.style.setProperty('--i', Math.min(i, 24)); list.append(f); });
  if (rows.length > ui.limit) {
    const m = el('div', 'pb-more'); m.append(btn('ghost', null, 'Ver ' + N(Math.min(150, rows.length - ui.limit)) + ' más de ' + N(rows.length - ui.limit), () => { ui.limit += 150; drawProspectos(); })); list.append(m);
  }
}
function filaProspecto(p) {
  const row = el('div', 'pb-row pb-prow');
  const av = el('div', 'pb-avatar' + (p.estado === 'respondio' ? ' A' : ''), iniciales(p.empresa || p.nombre));
  const who = el('div', 'who');
  const emp = el('div', 'emp', p.empresa || 'Sin nombre');
  const sub = [p.nombre, nichoDe(p), p.ciudad].filter(Boolean).join(' · '); if (sub) emp.append(el('span', null, sub));
  const meta = el('div', 'meta');
  const canal = el('span', 'pb-canal-tag ' + p.canal, p.canal === 'email' ? 'Email' : 'WhatsApp'); meta.append(canal, el('span', 'sep', '·'));
  if (p.canal === 'email') meta.append(el('span', 'tel', p.email || '')); else meta.append(el('span', 'tel', telBonito(p.telefono)));
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
  if (p.canal === 'email') {
    // Las acciones de la lista de email (aprobar, baja…) están en su agente; aquí solo se consulta
    if (p.web) { const a = el('a', 'pb-btn ghost'); a.href = p.web; a.target = '_blank'; a.rel = 'noopener'; a.append('Ver web'); acts.append(a); }
    r.append(acts); row.append(av, who, r); return row;
  }
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
  // Mensaje ya escrito (por la IA tras leer su web) que saldrá cuando le toque
  if (p.canal === 'wa' && p.estado === 'pendiente' && p.mensaje) row.append(el('div', 'msg', '✎ Preparado: ' + p.mensaje));
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
/* Cada tarjeta se pinta aislada: si una falla, sale un aviso en su sitio y el resto de la página sigue. */
function seguro(fn, que) {
  try { return fn(); } catch (er) { console.error(que, er); return el('div', 'pb-card pb-empty', 'No se ha podido mostrar ' + que + '. El resto sigue funcionando.'); }
}
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

  if (w.estado === 'esperando_vinculo' && String(w.codigo || '').startsWith('QR:')) {
    // Vinculación por QR: se escanea desde el móvil. El QR cambia cada ~20 s; el panel se refresca solo cada pocos segundos.
    const pair = el('div', 'pb-pair');
    pair.append(el('h3', null, 'Escanea este QR con el WhatsApp del móvil'), el('p', null, 'Solo hace falta una vez. El QR se renueva solo cada pocos segundos: si falla, espera al siguiente.'));
    const caja = el('div', 'pb-qrbox'); caja.style.cssText = 'background:#fff;padding:14px;border-radius:14px;display:inline-block;line-height:0';
    const pinta = () => { caja.textContent = ''; new window.QRCode(caja, { text: String(w.codigo).slice(3), width: 260, height: 260, correctLevel: window.QRCode.CorrectLevel.L }); };
    if (window.QRCode) pinta();
    else { const sc = document.createElement('script'); sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'; sc.onload = pinta; document.head.append(sc); }
    const ol = el('ol'); ['Abre WhatsApp Business en el móvil → Ajustes → Dispositivos vinculados.', 'Pulsa «Vincular un dispositivo» y apunta la cámara a este QR.', 'En unos segundos este panel pasará a «Conectado».'].forEach((t) => ol.append(el('li', null, t)));
    pair.append(caja, ol); card.append(pair);
  } else if (w.estado === 'esperando_vinculo' && w.codigo) {
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
  box.append(seguro(() => controlCard(w), 'el control del agente'));
  box.append(card);

  box.append(seguro(rendimientoCard, 'el rendimiento'));
  if (S.scraper) box.append(seguro(() => scraperCard(S.scraper), 'el seguimiento del scraper'));

  const feedC = el('div', 'pb-card');
  feedC.append(el('h2', null, 'Últimos mensajes'), el('p', 'note', 'Lo que ha enviado el agente y lo que han contestado. Las respuestas se aprueban en Captación › Conversaciones.'));
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
  const body = el('div', 'pb-agent-body');
  body.append(feedC, seguro(registroCard, 'el registro'));
  box.prepend(seguro(() => queHace(w), 'el resumen'));
  box.append(body);
}

/* Qué hace el agente, en una frase. */
const NOMDIA = ['', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
const diasTxt = (d) => { const a = (d || []).map(Number).sort(); return !a.length ? 'ningún día' : a.join() === '1,2,3,4,5' ? 'de lunes a viernes' : a.join() === '1,2,3,4,5,6,7' ? 'todos los días' : a.map((x) => NOMDIA[x]).join(', '); };
function queHace(w) {
  const v = (w.ventanas || []).map((x) => x.join('–')).join(' y ');
  const dt = diasTxt(w.dias);
  return el('p', 'pw-que', `${dt[0].toUpperCase() + dt.slice(1)} (${v}) escribe a un máximo de ${w.limite_dia} empresas nuevas, una a una, como Daniel, `
    + `con un mensaje propio para cada una que la IA escribe después de leer su web, y espera entre ${Math.round((w.pausa_min || 240) / 60)} y ${Math.round((w.pausa_max || 1800) / 60)} minutos al azar entre un mensaje y otro. `
    + 'Si contestan, la IA te deja la respuesta preparada en Conversaciones y sale cuando tú la apruebas. A quien no contesta no le vuelve a escribir.');
}

/* ============ control del agente: cupo, días, horario y espera al azar ============ */
function controlCard(w, alCambiar) {
  const c = el('div', 'pb-card pw-ctl');
  c.append(el('h2', null, 'Control del agente'), el('p', 'note', 'Cuántas empresas nuevas al día, qué días, en qué horario y cuánto espera entre un mensaje y otro. El momento exacto se elige al azar dentro de ese margen, repartido para llegar al cupo. Las respuestas que apruebas no cuentan.'));
  const d = ui.ctl || (ui.ctl = { limite: w.limite_dia, dias: (w.dias || [1, 2, 3, 4, 5]).map(Number), ventanas: (w.ventanas || []).map((v) => v.join('-')).join(', '),
    min: Math.round((w.pausa_min || 240) / 60), max: Math.round((w.pausa_max || 1800) / 60), cambiado: false });
  const f = el('form', 'pw-ctl-f');
  // Cupo: deslizador + número
  const cl = el('label', 'pb-field'); cl.append(el('span', null, 'Mensajes nuevos al día'));
  const fila = el('div', 'pw-ctl-row'); const rg = el('input'); rg.type = 'range'; rg.min = 0; rg.max = 60; rg.value = Math.min(60, d.limite);
  const nm = el('input'); nm.type = 'number'; nm.min = 0; nm.max = 200; nm.value = d.limite;
  fila.append(rg, nm); cl.append(fila);
  // Días
  const dl = el('div', 'pb-field'); dl.append(el('span', null, 'Días'));
  const chips = el('div', 'pw-ctl-dias');
  ['L', 'M', 'X', 'J', 'V', 'S', 'D'].forEach((t, i) => {
    const b = el('button', d.dias.includes(i + 1) ? 'on' : '', t); b.type = 'button'; b.title = NOMDIA[i + 1];
    b.onclick = () => { d.dias = d.dias.includes(i + 1) ? d.dias.filter((x) => x !== i + 1) : [...d.dias, i + 1].sort(); b.classList.toggle('on'); cambia(); };
    chips.append(b);
  });
  dl.append(chips);
  // Horario
  const hl = el('label', 'pb-field'); hl.append(el('span', null, 'Horario'));
  const hi = el('input'); hi.value = d.ventanas; hi.placeholder = '08:30-13:00, 17:00-20:00'; hl.append(hi);
  // Espera entre mensajes
  const el2 = el('div', 'pb-field'); el2.append(el('span', null, 'Espera entre mensajes, al azar'));
  const pr = el('div', 'pw-ctl-row');
  const mi = el('input'); mi.type = 'number'; mi.min = 2; mi.max = 120; mi.value = d.min; mi.title = 'Mínimo (minutos)';
  const ma = el('input'); ma.type = 'number'; ma.min = 2; ma.max = 180; ma.value = d.max; ma.title = 'Máximo (minutos)';
  pr.append(el('small', null, 'entre'), mi, el('small', null, 'y'), ma, el('small', null, 'min'));
  el2.append(pr);
  // Simulación en directo: ¿cabe el cupo?
  const sim = el('div', 'pw-ctl-sim');
  const save = btn('primary', null, 'Guardar'); save.type = 'submit';
  const deshacer = btn('ghost', null, 'Descartar', () => { ui.ctl = null; (alCambiar || drawAgentes)(); });
  const pie = el('div', 'pw-ctl-pie'); pie.append(sim, deshacer, save);
  const minutosVentana = () => d.ventanas.split(/[,\n]+/).reduce((a, t) => {
    const m = t.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
    return m ? a + Math.max(0, (m[3] * 60 + Number(m[4])) - (m[1] * 60 + Number(m[2]))) : a;
  }, 0);
  function pinta() {
    const mins = minutosVentana(); const caben = d.min > 0 ? Math.floor(mins / (d.min + 1.5)) + 1 : 0;
    const media = d.limite > 1 ? mins / d.limite : mins;
    sim.textContent = ''; sim.classList.remove('mal');
    const mal = (b, x) => { sim.classList.add('mal'); sim.append(el('b', null, b)); if (x) sim.append(el('span', null, ' ' + x)); };
    if (!mins) mal('Horario no válido.', 'Ejemplo: 08:30-13:00, 17:00-20:00');
    else if (d.min < 2 || d.max < 2) mal('La espera mínima es de 2 minutos.');
    else if (d.min > d.max) mal('El mínimo es mayor que el máximo.');
    else if (!d.dias.length) mal('Elige al menos un día.');
    else if (caben < d.limite) mal(`No caben ${d.limite}: con ${d.min} min de espera mínima, en ${Math.round(mins / 6) / 10} h caben unos ${caben}.`, 'Baja la espera mínima, amplía el horario o baja el cupo.');
    else {
      const tope = Math.min(d.max, Math.max(d.min, Math.round(2 * media - d.min)));
      sim.append(el('b', null, `${d.limite} al día · uno cada ~${Math.round((d.min + tope) / 2)} min de media`), el('span', null, ` (al azar entre ${d.min} y ${tope} min) · ${diasTxt(d.dias)}`));
    }
    save.disabled = sim.classList.contains('mal') || !d.cambiado; deshacer.hidden = !d.cambiado;
  }
  function cambia() { d.cambiado = true; pinta(); }
  rg.oninput = () => { d.limite = Number(rg.value); nm.value = rg.value; cambia(); };
  nm.oninput = () => { d.limite = Math.max(0, Number(nm.value) || 0); rg.value = Math.min(60, d.limite); cambia(); };
  hi.oninput = () => { d.ventanas = hi.value; cambia(); };
  mi.oninput = () => { d.min = Number(mi.value) || 0; cambia(); };
  ma.oninput = () => { d.max = Number(ma.value) || 0; cambia(); };
  f.append(cl, dl, hl, el2, pie);
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new URLSearchParams(); fd.set('limite_dia', d.limite); fd.set('ventanas', d.ventanas); fd.set('pausa_min', d.min); fd.set('pausa_max', d.max);
    d.dias.forEach((x) => fd.append('dias[]', x));
    post('agente_config', fd, save).then(() => { ui.ctl = null; toast('Guardado. El agente lo usa desde el siguiente mensaje.'); return refrescar(); }).then(() => { if (alCambiar) alCambiar(); }).catch((er) => toast(er.message, true));
  });
  c.append(f); pinta();
  return c;
}

/* ============ scraper: qué encuentra cada día y por qué descarta ============ */
function scraperCard(sc) {
  const c = el('div', 'pb-card pw-scr');
  const hd = el('div', 'pw-rend-h'); hd.append(el('h2', null, 'Scraper'));
  if (sc.ahora) { const v = el('span', 'pw-scr-vivo'); v.append(el('i'), document.createTextNode('Buscando en ' + sc.ahora)); hd.append(v); }
  c.append(hd);
  const g = el('div', 'pw-scr-g');
  // 1) por dónde va: anillo de provincias de esta vuelta
  const vu = el('div', 'pw-chart pw-scr-vuelta');
  // Cuánto de España se ha recorrido (pueblos y territorio entero): al llegar al 100 % ya no quedan instaladoras por encontrar
  const R = 42, C = 2 * Math.PI * R, f = Math.min(1, (sc.cobertura || 0) / 100);
  const s = sv('svg', { viewBox: '0 0 100 100', class: 'pw-svg' });
  s.append(sv('circle', { cx: 50, cy: 50, r: R, class: 'track', 'stroke-width': 9 }), sv('circle', { cx: 50, cy: 50, r: R, fill: 'none', stroke: 'var(--ch-line)', 'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-dasharray': C, 'stroke-dashoffset': C * (1 - f), transform: 'rotate(-90 50 50)' }));
  s.append(svt({ x: 50, y: 54, class: 'big', 'text-anchor': 'middle' }, `${sc.cobertura || 0}%`), svt({ x: 50, y: 70, class: 'ax', 'text-anchor': 'middle' }, 'de España'));
  vu.append(el('h3', null, 'España recorrida'), el('p', 'note', `${sc.prov_completas || 0} de 52 provincias completas · vuelta ${sc.vuelta || 1}: ${sc.hechas}/${sc.total}`), s);
  vu.title = 'Ciudades, pueblos de más de 1.000 habitantes y una cuadrícula cada 8 km por todo el territorio';
  // 2) hoy: de lo encontrado a la cola
  const hoy = sc.dias[sc.dias.length - 1] || { enc: 0, ent: 0, cola: 0 };
  const fu = el('div', 'pw-chart pw-scr-hoy'); fu.append(el('h3', null, 'Hoy'));
  const ya = Number(Object.entries(sc.motivos || {}).find(([k]) => /ya en el panel/.test(k))?.[1] || 0);
  const pasos = [['Encontradas', hoy.enc, '#6F7189'], ['Nuevas', Math.max(0, hoy.enc - ya), '#7E73FF'], ['Instaladoras', hoy.ent, '#3FD5FF'], ['A la cola', hoy.cola, '#B7FF3C']];
  const mx = Math.sqrt(Math.max(1, ...pasos.map((p) => p[1])));
  pasos.forEach(([l, n, col]) => { const r = el('div', 'pw-scr-f'); const b = el('i'); b.style.background = col; b.style.width = Math.max(3, Math.sqrt(n) / mx * 100) + '%'; r.append(el('span', null, l), b, el('b', null, N(n))); fu.append(r); });
  // 3) por qué descarta (hoy)
  const mo = el('div', 'pw-chart pw-scr-mot'); mo.append(el('h3', null, 'Descartadas hoy'));
  const ms = Object.entries(sc.motivos || {}); const mm = Math.max(1, ...ms.map((x) => x[1]));
  if (!ms.length) mo.append(el('p', 'note', 'Aún nada hoy.'));
  ms.forEach(([k, n]) => { const r = el('div', 'pw-scr-m'); const b = el('i'); b.style.width = Math.max(3, n / mm * 100) + '%'; r.append(el('span', null, k.charAt(0).toUpperCase() + k.slice(1)), b, el('b', null, N(n))); r.title = `${k}: ${n}`; mo.append(r); });
  // 4) 14 días: empresas nuevas en la cola
  const d14 = el('div', 'pw-chart pw-scr-14'); d14.append(el('h3', null, 'Nuevas en la cola · 14 días'));
  const W = 420, H = 110, B = 16; const mxc = Math.max(4, ...sc.dias.map((d) => d.cola)); const bw = W / sc.dias.length;
  const s2 = sv('svg', { viewBox: `0 0 ${W} ${H}`, class: 'pw-svg' });
  sc.dias.forEach((d, i) => {
    const h = (H - B - 4) * d.cola / mxc; const w = bw * 0.62; const x = i * bw + (bw - w) / 2;
    const r = sv('rect', { x, y: H - B - Math.max(1.5, h), width: w, height: Math.max(1.5, h), rx: Math.min(3, w / 2), fill: d.cola ? '#B7FF3C' : 'var(--line-2)' });
    const t = sv('title'); const f2 = new Date(d.d + 'T12:00'); t.textContent = `${f2.getDate()} ${MESES[f2.getMonth()]}: ${d.enc} encontradas · ${d.ent} instaladoras válidas · ${d.cola} a la cola`; r.append(t); s2.append(r);
    if (d.cola && d.cola >= mxc / 3) s2.append(svt({ x: i * bw + bw / 2, y: H - B - h - 4, class: 'ax', 'text-anchor': 'middle' }, d.cola));
    if (i === 0 || i === sc.dias.length - 1) s2.append(svt({ x: i * bw + bw / 2, y: H - 3, class: 'ax', 'text-anchor': i ? 'end' : 'start' }, i ? 'hoy' : `${f2.getDate()} ${MESES[f2.getMonth()]}`));
  });
  d14.append(s2);
  g.append(vu, fu, mo, d14); c.append(g);
  return c;
}

/* ============ rendimiento: columnas por día, estado de las conversaciones y curva de respuestas ============ */
const CANAL = { whatsapp: ['WhatsApp', 'var(--ch-wa)'], email: ['Email', 'var(--ch-em)'] };
const ESTADOS = [['sin_respuesta', 'Sin respuesta', '#6F7189'], ['pregunta', 'Contestó', '#3FD5FF'], ['interesado', 'Interesado', '#B7FF3C'], ['cita', 'Cita', '#25D366'],
  ['auto', 'Contestador', '#9A9CB0'], ['no_interesado', 'No interesado', '#FF6B7A']];
const sv = (tag, attrs) => { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); Object.entries(attrs || {}).forEach(([k, v]) => e.setAttribute(k, v)); return e; };
const svt = (attrs, txt) => { const t = sv('text', attrs); t.textContent = txt; return t; };
const kdia = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fdia = (d) => `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`;
function tip(box) {
  const t = el('div', 'pw-tip'); box.append(t);
  return {
    show(x, y, lines) { t.textContent = ''; lines.forEach((l, i) => t.append(el(i ? 'span' : 'b', null, l))); t.style.left = x + 'px'; t.style.top = y + 'px'; t.classList.add('on'); },
    hide() { t.classList.remove('on'); },
  };
}
function ultimosDias(n) { const out = []; for (let i = n - 1; i >= 0; i--) { const d = new Date(S.ahora); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - i); out.push(d); } return out; }
function serie(n) {
  const G = (S.graficas && S.graficas.dias) || [];
  const v = (d, ag, se) => Number((G.find((x) => x.d === kdia(d) && x.agente === ag && x.sentido === se) || {}).n || 0);
  return ultimosDias(n).map((d) => ({ d, wa: v(d, 'whatsapp', 'sale'), em: v(d, 'email', 'sale'), resp: v(d, 'whatsapp', 'entra') + v(d, 'email', 'entra') }));
}
function leyenda(items, cls) {
  const l = el('div', 'pw-leg' + (cls ? ' ' + cls : ''));
  items.forEach(([t, c, v]) => { const i = el('span'); const dot = el('i'); dot.style.background = c; i.append(dot, el('span', null, t)); if (v != null) i.append(el('b', null, v)); l.append(i); });
  return l;
}
function ejeY(s, W, L, Y, paso) {
  for (let k = 0; k <= 4; k++) { const y = Y(k * paso); s.append(sv('line', { x1: L, x2: W, y1: y, y2: y, class: 'grid' }), svt({ x: L - 6, y: y + 3, class: 'ax', 'text-anchor': 'end' }, k * paso)); }
}

function rendimientoCard(alCambiar) {
  const c = el('div', 'pb-card pw-rend');
  const hd = el('div', 'pw-rend-h'); hd.append(el('h2', null, 'Rendimiento'));
  const per = el('div', 'pb-subtabs'); ui.rdias = ui.rdias || 30;
  [[14, '14 días'], [30, '30 días'], [60, '60 días']].forEach(([n, t]) => { const b = el('button', ui.rdias === n ? 'on' : '', t); b.type = 'button'; b.onclick = () => { ui.rdias = n; (alCambiar || drawAgentes)(); }; per.append(b); });
  hd.append(per); c.append(hd);
  const data = serie(ui.rdias);
  const g = el('div', 'pw-rend-g');
  g.append(columnas(data), donut(), curva(data));
  c.append(g);
  return c;
}

function columnas(data) {
  const box = el('div', 'pw-chart pw-cols');
  const twa = data.reduce((a, x) => a + x.wa, 0), tem = data.reduce((a, x) => a + x.em, 0);
  box.append(el('h3', null, 'Primeros mensajes por día'), el('p', 'note', `${N(twa + tem)} en ${data.length} días · las respuestas que apruebas no cuentan`));
  box.append(leyenda([['WhatsApp', CANAL.whatsapp[1], N(twa)], ['Email', CANAL.email[1], N(tem)]]));
  const W = 640, H = 200, L = 30, B = 22, T = 8;
  const paso = Math.max(1, Math.ceil(Math.max(4, ...data.map((x) => x.wa + x.em)) / 4)); const top = paso * 4;
  const Y = (v) => T + (H - B - T) * (1 - v / top);
  const s = sv('svg', { viewBox: `0 0 ${W} ${H}`, class: 'pw-svg', role: 'img', 'aria-label': 'Primeros mensajes enviados por día, WhatsApp y email' });
  ejeY(s, W, L, Y, paso);
  const bw = (W - L) / data.length; const t = tip(box);
  const cada = Math.ceil(data.length / 7);
  data.forEach((x, i) => {
    const gx = L + i * bw; const w = Math.max(2, bw * 0.68); const x0 = gx + (bw - w) / 2; const r = Math.min(4, w / 2);
    let base = H - B;
    const capas = [['wa', CANAL.whatsapp[1], x.wa], ['em', CANAL.email[1], x.em]].filter((c) => c[2]);
    capas.forEach(([, col, n], j) => {
      const h = (H - B - T) * n / top; const yy = base - h + (j ? 2 : 0);   // 2 px de separación entre capas
      const arriba = j === capas.length - 1;
      const d = arriba ? `M${x0},${base} V${yy + r} Q${x0},${yy} ${x0 + r},${yy} H${x0 + w - r} Q${x0 + w},${yy} ${x0 + w},${yy + r} V${base} Z` : `M${x0},${base} V${yy} H${x0 + w} V${base} Z`;
      s.append(sv('path', { d, fill: col, class: 'bar' })); base -= h;
    });
    if (!capas.length) s.append(sv('rect', { x: x0, y: H - B - 2, width: w, height: 2, rx: 1, class: 'cero' }));
    if (i === data.length - 1 || (i % cada === 0 && i < data.length - cada / 2)) s.append(svt({ x: gx + bw / 2, y: H - 6, class: 'ax', 'text-anchor': 'middle' }, i === data.length - 1 ? 'hoy' : `${x.d.getDate()} ${MESES[x.d.getMonth()]}`));
    const hit = sv('rect', { x: gx, y: 0, width: bw, height: H - B, class: 'hit' });
    hit.addEventListener('mouseenter', () => { const rc = s.getBoundingClientRect(); t.show((gx + bw / 2) / W * rc.width, 8, [fdia(x.d), `WhatsApp: ${x.wa}`, `Email: ${x.em}`, `Empresas que contestaron: ${x.resp}`]); hit.classList.add('on'); });
    hit.addEventListener('mouseleave', () => { t.hide(); hit.classList.remove('on'); });
    s.append(hit);
  });
  box.append(s); return box;
}

function donut() {
  const box = el('div', 'pw-chart pw-donut');
  const E = (S.graficas && S.graficas.estados) || {};
  const rows = ESTADOS.map(([k, t, c]) => [k, t, c, Number(E[k] || 0)]).filter((r) => r[3]);
  const tot = rows.reduce((a, r) => a + r[3], 0);
  box.append(el('h3', null, 'Cómo van las conversaciones'), el('p', 'note', 'Cada empresa escrita, según lo último que ha pasado'));
  const wrap = el('div', 'pw-donut-w');
  const R = 62, C = 2 * Math.PI * R;
  const s = sv('svg', { viewBox: '0 0 160 160', class: 'pw-svg', role: 'img', 'aria-label': 'Estado de las conversaciones' });
  s.append(sv('circle', { cx: 80, cy: 80, r: R, class: 'track' }));
  let acc = 0; const segs = {};
  rows.forEach(([k, , col, n]) => {
    const len = C * n / tot; const gap = rows.length > 1 ? Math.min(3, len / 2) : 0;
    const ci = sv('circle', { cx: 80, cy: 80, r: R, fill: 'none', stroke: col, 'stroke-width': 18, 'stroke-dasharray': `${Math.max(0.5, len - gap)} ${C}`, 'stroke-dashoffset': -acc, transform: 'rotate(-90 80 80)', class: 'seg' });
    segs[k] = ci; s.append(ci); acc += len;
  });
  s.append(svt({ x: 80, y: 82, class: 'big', 'text-anchor': 'middle' }, N(tot)), svt({ x: 80, y: 100, class: 'ax', 'text-anchor': 'middle' }, 'conversaciones'));
  const leg = el('div', 'pw-leg col');
  rows.forEach(([k, t, col, n]) => {
    const i = el('span'); const dot = el('i'); dot.style.background = col; i.append(dot, el('span', null, t), el('b', null, `${N(n)} · ${pct(n, tot)}`)); leg.append(i);
    const on = (v) => { Object.entries(segs).forEach(([kk, x]) => x.classList.toggle('dim', v && kk !== k)); i.classList.toggle('on', v); };
    [i, segs[k]].forEach((x) => { x.addEventListener('mouseenter', () => on(true)); x.addEventListener('mouseleave', () => on(false)); });
  });
  if (!tot) leg.append(el('div', 'pb-empty', 'Aún no se ha escrito a nadie.'));
  wrap.append(s, leg); box.append(wrap); return box;
}

function curva(data) {
  // Estilo «trading»: respuestas acumuladas del periodo; al pasar el ratón, la tasa de respuesta en ese punto
  const box = el('div', 'pw-chart pw-curva');
  let se = 0, sr = 0; const pts = data.map((x) => { se += x.wa + x.em; sr += x.resp; return { d: x.d, env: se, resp: sr, dia: x.resp }; });
  const fin = pts[pts.length - 1];
  const semana = pts.slice(-7).reduce((a, p) => a + p.dia, 0);
  const h = el('div', 'pw-curva-h');
  const hl = el('div'); hl.append(el('h3', null, 'Empresas que han contestado'), el('p', 'note', `Tasa de respuesta del periodo: ${pct(fin.resp, fin.env)} (${N(fin.resp)} de ${N(fin.env)} escritas)`));
  const big = el('div', 'pw-ticker'); big.append(el('b', null, N(fin.resp)), el('em', semana ? 'up' : '', (semana ? '▲ +' : '') + N(semana) + ' en 7 días'));
  h.append(hl, big); box.append(h);
  const W = 1000, H = 190, L = 30, B = 22, T = 10;
  const paso = Math.max(1, Math.ceil(Math.max(4, fin.resp) / 4)); const top = paso * 4;
  const X = (i) => L + (W - L - 4) * (pts.length > 1 ? i / (pts.length - 1) : 0.5); const Y = (v) => T + (H - B - T) * (1 - v / top);
  const s = sv('svg', { viewBox: `0 0 ${W} ${H}`, class: 'pw-svg', role: 'img', 'aria-label': 'Respuestas acumuladas en el periodo' });
  const defs = sv('defs'); const lg = sv('linearGradient', { id: 'pw-area', x1: 0, x2: 0, y1: 0, y2: 1 });
  lg.append(sv('stop', { offset: 0, class: 'a0' }), sv('stop', { offset: 1, class: 'a1' })); defs.append(lg); s.append(defs);
  ejeY(s, W, L, Y, paso);
  let dl = `M${X(0)},${Y(pts[0].resp)}`; pts.forEach((p, i) => { if (i) dl += ` H${X(i)} V${Y(p.resp)}`; });   // escalones: sube el día que llega una respuesta
  s.append(sv('path', { d: `${dl} V${H - B} H${X(0)} Z`, fill: 'url(#pw-area)' }), sv('path', { d: dl, class: 'line' }));
  [0, Math.floor((pts.length - 1) / 2), pts.length - 1].forEach((i, n) => s.append(svt({ x: X(i), y: H - 6, class: 'ax', 'text-anchor': ['start', 'middle', 'end'][n] }, n === 2 ? 'hoy' : `${pts[i].d.getDate()} ${MESES[pts[i].d.getMonth()]}`)));
  const cross = sv('line', { y1: T, y2: H - B, class: 'cross' }); const dot = sv('circle', { r: 5, class: 'dot' }); s.append(cross, dot);
  const t = tip(box);
  const hit = sv('rect', { x: L, y: 0, width: W - L, height: H - B, class: 'hit' });
  hit.addEventListener('mousemove', (ev) => {
    const rc = s.getBoundingClientRect(); const xs = (ev.clientX - rc.left) / rc.width * W;
    const i = Math.max(0, Math.min(pts.length - 1, Math.round((xs - L) / (W - L - 4) * (pts.length - 1)))); const p = pts[i];
    cross.setAttribute('x1', X(i)); cross.setAttribute('x2', X(i)); dot.setAttribute('cx', X(i)); dot.setAttribute('cy', Y(p.resp)); s.classList.add('hov');
    t.show(X(i) / W * rc.width, 8, [fdia(p.d), `Han contestado: ${N(p.resp)}${p.dia ? ' (+' + p.dia + ' ese día)' : ''}`, `Escritas: ${N(p.env)}`, `Tasa: ${pct(p.resp, p.env)}`]);
  });
  hit.addEventListener('mouseleave', () => { s.classList.remove('hov'); t.hide(); });
  s.append(hit); box.append(s); return box;
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
/* Piezas para la ficha de cada agente en la oficina (pestañas Ajustes y Rendimiento). Devuelven null si aún no hay datos. */
window.PB_FICHA = Object.assign(window.PB_FICHA || {}, {
  whatsapp: { ajustes: (re) => S.loaded ? controlCard(S.whatsapp || {}, re) : null, rendimiento: (re) => S.loaded ? rendimientoCard(re) : null },
  scraper: { rendimiento: () => S.loaded && S.scraper ? scraperCard(S.scraper) : null },
});
/* Prospectos reúne tres vistas: Empresas (cajas), Conversaciones y Mapa. Conversaciones y Mapa salen del menú lateral
   y se abren desde estas pestañas; en el menú queda marcado «Prospectos» en las tres. */
const SUBS = [['prospectos', 'Empresas', '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'],
  ['conversaciones', 'Conversaciones', '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>'],
  ['mapa', 'Mapa', '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>']];
function montaSubnav() {
  SUBS.forEach(([pg]) => {
    const navB = document.querySelector(`#pb-tabs button[data-page="${pg}"]`);
    if (pg !== 'prospectos' && navB) navB.hidden = true;
    const sec = $('#page-' + pg); if (!sec || $('.pb-subnav', sec)) return;
    const bar = el('nav', 'pb-subnav'); bar.setAttribute('aria-label', 'Prospectos');
    const casa = el('button', 'casa'); casa.type = 'button'; casa.innerHTML = '<svg class="pb-i" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg><span>Prospectos</span>';
    casa.onclick = () => { ui.hub = true; if (pagina() === 'prospectos') drawProspectos(); else { const nb = document.querySelector('#pb-tabs button[data-page="prospectos"]'); if (nb) nb.click(); } };
    bar.append(casa);
    SUBS.forEach(([k, t, ic]) => {
      const b = el('button', k === pg ? 'on' : ''); b.type = 'button'; b.dataset.sub = k;
      b.innerHTML = `<svg class="pb-i" viewBox="0 0 24 24">${ic}</svg><span>${t}</span>`;
      if (k === 'conversaciones') b.append(el('em', 'pb-subnav-n'));
      b.onclick = () => { if (k === 'prospectos') ui.hub = false; if (k === pagina()) { drawProspectos(); return; } const nb = document.querySelector(`#pb-tabs button[data-page="${k}"]`); if (nb) nb.click(); };
      bar.append(b);
    });
    sec.prepend(bar);
  });
  // el aviso de «te toca» de Conversaciones pasa a su pestaña
  const n = document.getElementById('pb-conv-n');
  const pinta = () => $$('.pb-subnav-n').forEach((e) => { const t = (n && n.textContent || '').trim(); e.textContent = /^\d+$/.test(t) && t !== '0' ? t : ''; });
  if (n) new MutationObserver(pinta).observe(n, { childList: true, characterData: true, subtree: true });
  pinta();
  const imp = $('#pb-imp-abrir'); if (imp) imp.remove();   // «Añadir prospectos» no se usa
  // Pulsar «Prospectos» en el menú (con el ratón) lleva siempre a la entrada
  const navP = document.querySelector('#pb-tabs button[data-page="prospectos"]');
  if (navP) navP.addEventListener('click', (e) => { if (e.isTrusted) { ui.hub = true; ui.caja = ''; ui.prov = ''; ui.ciudad = ''; } }, true);
}
document.addEventListener('pb:page', (e) => setTimeout(() => {
  const nav = document.querySelector('#pb-tabs button[data-page="prospectos"]');
  if (nav && ['conversaciones', 'mapa'].includes(e.detail)) { nav.classList.add('on'); nav.setAttribute('aria-current', 'page'); }
}, 0));
montaSubnav();
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
    try { drawAgentes(); } catch (er) { console.error(er); }
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
  if (!document.hidden && Date.now() - ultimo >= (rapido ? 4000 : 60000)) { ultimo = Date.now(); refrescar(); }
}, 4000);
crumb(pagina());
refrescar();
})();
