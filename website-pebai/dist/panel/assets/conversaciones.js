/* PEBAI · Panel — Captación › Conversaciones: el CRM de todo lo enviado por WhatsApp y email.
   Rediseño del 17/11/2026: embudo de 4 pasos, filtros en una línea y bandeja a dos paneles en el ordenador (lista + chat, como
   WhatsApp Web); en móvil la lista ocupa la pantalla y el chat se abre encima. También pinta la portada de Prospectos
   (recorrido + tres puertas), que le pide agentes.js con window.PB_PORTADA.
   Datos en index.php?conv=1. Todo texto de empresas y mensajes se pinta con textContent o escapado (nunca innerHTML con datos crudos).
   La IA solo clasifica: aquí no hay respuestas escritas por la IA, ni notas, ni enlace de reserva, ni bloque de estado. */
(() => {
'use strict';
const app = document.getElementById('pb-app');
if (!app) return;
const BASE = app.dataset.base;
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const S = { filas: [], loaded: false, csrf: app.dataset.csrf };
const ui = { estado: '', canal: '', q: '', periodo: 'todo', abierta: null };
try { Object.assign(ui, JSON.parse(localStorage.getItem('pebai-conv-ui') || '{}'), { abierta: null, q: '' }); } catch (e) { /* sin almacenamiento */ }
const guarda = () => { try { localStorage.setItem('pebai-conv-ui', JSON.stringify({ estado: ui.estado, canal: ui.canal, periodo: ui.periodo })); } catch (e) { /* nada */ } };
const ancho = matchMedia('(min-width:1100px)');   // a partir de aquí, lista y chat a la vez
const enPagina = () => document.body.dataset.page === 'conversaciones';

/* ============ dominio ============ */
const EST = {
  sin_respuesta: ['Sin respuesta', 'var(--muted-2)'], auto: ['Contestador', 'var(--violet-2)'], pregunta: ['Contestó', 'var(--cyan)'], pendiente_ia: ['Contestó', 'var(--cyan)'],
  interesado: ['Interesado', 'var(--amber)'], no_interesado: ['No interesado', 'var(--red)'], cita: ['Cita reservada', 'var(--green)'],
  te_toca: ['Te toca', 'var(--lime)'], info_enviada: ['Contestó', 'var(--cyan)'],
};
// Los filtros son siempre estos y caben en una línea: «Info enviada» cuenta como Contestó y las citas, como Interesado
const ORDEN = ['', 'te_toca', 'interesado', 'pregunta', 'sin_respuesta', 'auto', 'no_interesado'];
const grupo = (e) => (e === 'pendiente_ia' || e === 'info_enviada' ? 'pregunta' : e === 'cita' ? 'interesado' : e);
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const pad = (n) => String(n).padStart(2, '0');
const parse = (s) => (s ? new Date(String(s).replace(' ', 'T')) : null);
const N = (n) => new Intl.NumberFormat('es-ES').format(n || 0);
const pct = (a, b) => (b ? Math.round((a / b) * 100) + ' %' : '—');
const dia = (d) => (d && !isNaN(d) ? `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}` : '—');
const hora = (d) => (d && !isNaN(d) ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : '');
// Hora corta de la lista, como en WhatsApp: hoy la hora, ayer «ayer», esta semana el día, y si no la fecha
const corta = (d) => {
  if (!d || isNaN(d)) return '';
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const dd = Math.floor((hoy - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5);
  return dd <= 0 ? hora(d) : dd === 1 ? 'ayer' : dd < 7 ? DIAS[d.getDay()] : `${d.getDate()} ${MESES[d.getMonth()]}`;
};
const espera = (d) => {
  const m = Math.max(1, Math.round((Date.now() - d) / 60000));
  if (m < 60) return m + ' min';
  const h = Math.floor(m / 60); if (h < 24) return h + ' h' + (m % 60 ? ' ' + (m % 60) + ' min' : '');
  const dd = Math.round(h / 24); return dd === 1 ? '1 día' : dd + ' días';
};
const dominio = (w) => { try { return new URL(w).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
const limpia = (s) => String(s || '').replace(/\s*[|–—-]\s.*$/u, '').replace(/[^\p{L}\p{N}&.,' ]/gu, ' ').replace(/\s+/g, ' ').trim() || String(s || '');
const iniciales = (s) => (limpia(s).split(/\s+/).slice(0, 2).map((w) => w[0]).join('') || '?').toUpperCase();
const telBonito = (t) => { const s = String(t || '').replace(/\D/g, ''); return s.startsWith('34') && s.length === 11 ? `+34 ${s.slice(2, 5)} ${s.slice(5, 7)} ${s.slice(7, 9)} ${s.slice(9)}` : t; };
const ultimaDe = (f, de) => { for (let i = f.mensajes.length - 1; i >= 0; i--) if (f.mensajes[i].de === de) return f.mensajes[i]; return null; };

/* ============ DOM ============ */
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const svg = (inner, cls) => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', cls || 'pb-i'); s.innerHTML = inner; return s; };
const ICO = {
  wa: () => { const b = window.PB_ICONS && window.PB_ICONS.brands && window.PB_ICONS.brands.whatsapp; return svg(b ? `<path d="${b.d}"/>` : '<circle cx="12" cy="12" r="9"/>', 'ic-fill'); },
  mail: () => svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
  eye: () => svg('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  x: () => svg('<path d="M18 6 6 18M6 6l12 12"/>'),
  ext: () => svg('<path d="M14 4h6v6M10 14 20 4M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>'),
  spark: () => svg('<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z"/>'),
  reloj: () => svg('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'),
  cal: () => svg('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
  chat: () => svg('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'),
};
const toast = (msg, err) => { const t = $('#pb-toast'); if (!t) return; $('span', t).textContent = msg; t.classList.toggle('err', !!err); t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 3200); };
const colorDe = (s) => (window.PBX ? window.PBX.colorDe(limpia(s)) : 'var(--violet)');
function avatar(f, big) {
  const a = el('span', 'pc-av' + (big ? ' big' : ''));
  a.style.setProperty('--c', colorDe(f.empresa));
  const dom = dominio(f.web);
  a.append(el('b', null, iniciales(f.empresa)));
  if (f.foto) {
    // Foto de perfil de WhatsApp de la empresa, solo cuando la fila se ve (antes se pedían ~190 de golpe y Hostinger bloqueaba)
    const img = new Image(); img.alt = ''; img.loading = 'lazy'; img.decoding = 'async'; img.className = 'foto'; img.src = BASE + '?foto=' + encodeURIComponent(f.foto);
    img.onload = () => a.classList.add('img'); img.onerror = () => img.remove(); a.append(img);
  } else if (dom) {
    const img = new Image(); img.alt = ''; img.loading = 'lazy'; img.decoding = 'async'; img.referrerPolicy = 'no-referrer';
    img.src = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(dom)}&sz=128`;
    img.onload = () => { if (img.naturalWidth > 16) a.classList.add('img'); else img.remove(); };
    img.onerror = () => img.remove();
    a.append(img);
  }
  const c = el('i', 'pc-ch ' + f.canal); c.title = f.canal === 'email' ? 'Email' : 'WhatsApp'; c.append(f.canal === 'email' ? ICO.mail() : ICO.wa()); a.append(c);
  return a;
}

/* ============ datos ============ */
async function load() {
  const r = await fetch(BASE + '?conv=1', { credentials: 'same-origin', cache: 'no-store' });
  if (r.status === 401) { pbCaduca(); return; }
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || 'Error al cargar');
  const firma = JSON.stringify(j.filas); S.cambio = firma !== S.firma; S.firma = firma;
  S.filas = j.filas; S.csrf = j.csrf || S.csrf; S.loaded = true; S.cargado = Date.now();
  const n = $('#pb-conv-n'); if (n) n.textContent = N(S.filas.filter((f) => ['interesado', 'pregunta', 'pendiente_ia'].includes(f.estado)).length);
}
async function post(action, fields) {
  const body = new URLSearchParams({ action, csrf: S.csrf, ...fields });
  const r = await fetch(BASE, { method: 'POST', body, credentials: 'same-origin', headers: { Accept: 'application/json' } });
  if (r.status === 401) { pbCaduca(); return {}; }
  const j = await r.json().catch(() => ({ ok: false, error: 'Respuesta inesperada del servidor.' }));
  if (!j.ok) throw new Error(j.error || 'No se ha podido guardar.');
  return j;
}

/* ============ filtros ============ */
const desde = () => { const d = new Date(); d.setHours(0, 0, 0, 0); if (ui.periodo === 'hoy') return d; if (ui.periodo === '7') return new Date(d - 6 * 864e5); if (ui.periodo === '30') return new Date(d - 29 * 864e5); return new Date(0); };
function base() { const d0 = desde(); return S.filas.filter((f) => (!ui.canal || f.canal === ui.canal) && parse(f.enviado_at) >= d0); }
const encaja = (f, k) => (!k || (k === 'te_toca' ? f.te_toca : grupo(f.estado) === k));
function visibles() {
  const q = ui.q.toLowerCase();
  return base().filter((f) => encaja(f, ui.estado)
    && (!q || [f.empresa, f.ciudad, f.contacto, f.resumen, ...f.mensajes.map((m) => m.texto)].join(' ').toLowerCase().includes(q)));
}

/* ============ embudo de 4 pasos ============ */
function drawEtapas(B) {
  const box = $('#pc-etapas'); if (!box || !window.PBX) return;
  const resp = B.filter((f) => f.respuestas > 0 && f.estado !== 'auto').length;
  const inter = B.filter((f) => ['interesado', 'cita'].includes(f.estado));
  const citas = B.filter((f) => f.estado === 'cita');
  const wa = B.filter((f) => f.canal === 'whatsapp').length;
  const toca = B.filter((f) => f.te_toca && ['interesado', 'cita'].includes(f.estado)).length;
  const nombres = (l) => l.slice(0, 4).map((f) => limpia(f.empresa));
  const pasos = [
    { t: 'Enviados', n: N(B.length), llega: B.length, s: `${N(wa)} WhatsApp · ${N(B.length - wa)} email`, c: 'var(--violet-2)', i: 'send', clave: '', on: !ui.estado },
    { t: 'Contestaron', n: N(resp), llega: resp, s: 'sin contar contestadores', c: 'var(--cyan)', i: 'chat', clave: 'pregunta', on: ui.estado === 'pregunta' },
    { t: 'Interesados', n: N(inter.length), llega: inter.length, s: toca ? (toca === 1 ? '1 espera tu respuesta' : toca + ' esperan tu respuesta') : inter.length ? 'nadie espera respuesta' : 'aún ninguno', c: 'var(--amber)', i: 'flame', clave: 'interesado', on: ui.estado === 'interesado', caras: nombres(inter), mas: inter.length - 4 },
    { t: 'Citas', n: N(citas.length), llega: citas.length, s: citas.length ? nombres(citas).slice(0, 2).join(' y ') : 'aún ninguna', c: 'var(--green)', i: 'calendar', clave: 'cita' },
  ];
  const firma = JSON.stringify(pasos);
  if (box.dataset.firma === firma) return;
  box.dataset.firma = firma;
  box.innerHTML = window.PBX.etapas(pasos);
}

/* ============ filtros en una línea ============ */
function drawFiltros(B) {
  const box = $('#pc-estados');
  if (!box.querySelector('.pc-f')) {
    ORDEN.forEach((k) => {
      const [l, c] = k ? EST[k] : ['Todas', 'var(--fg-strong)'];
      const b = el('button', 'pbx-chip pc-f'); b.type = 'button'; b.style.setProperty('--c', c); b.dataset.k = k;
      const d = el('i', 'pbx-dot r'); d.style.setProperty('--c', c);
      b.append(d, el('span', null, l), el('em'));
      b.onclick = () => { ui.estado = ui.estado === k ? '' : k; guarda(); draw(); };
      box.append(b);
    });
  }
  // Si quedó guardado un filtro que ya no existe, vuelve a Todas
  if (!ORDEN.includes(ui.estado)) ui.estado = '';
  $$('.pc-f', box).forEach((b) => {
    const k = b.dataset.k;
    $('em', b).textContent = N(B.filter((f) => encaja(f, k)).length);
    b.classList.toggle('on', ui.estado === k);
    b.setAttribute('aria-pressed', ui.estado === k ? 'true' : 'false');
  });
  $$('#pc-canal button').forEach((b) => b.classList.toggle('on', b.dataset.c === ui.canal));
  $$('#pc-periodo button').forEach((b) => b.classList.toggle('on', b.dataset.p === ui.periodo));
  const punto = $('#pc-filtro .pc-punto'); if (punto) punto.hidden = !ui.canal && ui.periodo === 'todo';
  const fb = $('#pc-filtro'); if (fb) fb.title = 'Canal: ' + (ui.canal === 'email' ? 'Email' : ui.canal ? 'WhatsApp' : 'Todos') + ' · Periodo: ' + ({ hoy: 'Hoy', 7: '7 días', 30: '30 días' }[ui.periodo] || 'Todo');
}

/* ============ lista (columna izquierda) ============ */
function drawLista(rows) {
  const box = $('#pc-lista'); box.textContent = '';
  if (!rows.length) { box.append(el('div', 'pbx-vacio', S.filas.length ? 'Nada con estos filtros.' : 'Todavía no se ha enviado ningún mensaje.')); return; }
  const frag = document.createDocumentFragment();
  rows.forEach((f) => {
    const r = el('div', 'pc-fila' + (f.te_toca ? ' toca' : '') + (f.k === ui.abierta && ancho.matches ? ' sel' : ''));
    r.dataset.k = f.k; r.tabIndex = 0; r.setAttribute('role', 'listitem');
    const t = el('div', 'pc-fila-t');
    const ult = ultimaDe(f, 'entra');
    const frase = f.cola.length ? 'Enviando tu respuesta…' : ult ? ult.texto : 'Sin respuesta';
    const p = el('p'); p.append(el('span', 'pc-m2', (f.ciudad ? f.ciudad + ' · ' : '')), document.createTextNode(String(frase).replace(/\s+/g, ' ').slice(0, 140)));
    if (!ult && !f.cola.length) p.classList.add('apagado');
    t.append(el('b', null, limpia(f.empresa)), p);
    const der = el('div', 'pc-fila-d');
    const [l, c] = f.te_toca ? EST.te_toca : (EST[f.estado] || EST.pregunta);
    const est = el('i', 'pc-est'); est.style.setProperty('--c', (EST[f.estado] || EST.pregunta)[1]); est.title = (EST[f.estado] || EST.pregunta)[0];
    der.append(el('time', null, corta(parse(f.ultimo_at))), est);
    r.title = l;
    if (f.te_toca) r.style.setProperty('--t', c);
    r.append(avatar(f), t, der);
    frag.append(r);
  });
  box.append(frag);
}
// Un solo oyente para toda la lista (no uno por fila)
$('#pc-lista').addEventListener('click', (e) => { const r = e.target.closest('.pc-fila'); if (r) abrir(r.dataset.k); });
$('#pc-lista').addEventListener('keydown', (e) => {
  const r = e.target.closest('.pc-fila'); if (!r) return;
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(r.dataset.k); }
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const o = e.key === 'ArrowDown' ? r.nextElementSibling : r.previousElementSibling; if (o) { o.focus(); if (ancho.matches) abrir(o.dataset.k); } }
});
const marcaSel = () => $$('#pc-lista .pc-fila').forEach((r) => r.classList.toggle('sel', ancho.matches && r.dataset.k === ui.abierta));

function draw() {
  if (!S.loaded || !enPagina()) return;
  const B = base();
  drawEtapas(B); drawFiltros(B);
  const rows = visibles();
  // En el ordenador siempre hay un chat abierto: el primero que espera respuesta, o el primero de la lista
  if (ancho.matches && (!ui.abierta || !S.filas.some((f) => f.k === ui.abierta))) ui.abierta = ((rows.find((f) => f.te_toca) || rows[0]) || {}).k || null;
  drawLista(rows);
  drawChat();
}

/* ============ chat: columna derecha (ordenador) o cajón encima (móvil) ============ */
const drawer = el('aside', 'pc-drawer'); drawer.setAttribute('aria-label', 'Conversación');
const veil = el('div', 'pc-veil');
document.body.append(veil, drawer);
veil.onclick = () => cerrar();
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.classList.contains('on')) cerrar(); });
const destino = () => (ancho.matches ? $('#pc-panel') : drawer);
const borradores = new Map();   // lo que llevas escrito en cada chat, para no perderlo al refrescar o cambiar de chat
function abrir(k) {
  ui.abierta = k;
  // En móvil la barra de abajo se esconde mientras el chat está abierto (si no, tapa la caja de escribir)
  if (!ancho.matches) { drawer.classList.add('on'); veil.classList.add('on'); document.body.classList.add('pb-locked'); }
  marcaSel(); drawChat(true);
  if (ancho.matches) { const ta = $('#pc-panel textarea'); if (ta && matchMedia('(hover:hover)').matches) ta.focus({ preventScroll: true }); }
}
function cerrar() {
  if (drawer.classList.contains('on')) document.body.classList.remove('pb-locked');
  drawer.classList.remove('on'); veil.classList.remove('on');
  if (!ancho.matches) { ui.abierta = null; drawer.dataset.firma = ''; }
}
function drawChat(forzar) {
  const box = destino(); if (!box) return;
  const f = S.filas.find((x) => x.k === ui.abierta);
  if (!f) {
    if (ancho.matches) { box.dataset.firma = ''; box.textContent = ''; const v = el('div', 'pc-nada'); v.append(ICO.chat(), el('p', null, S.filas.length ? 'Elige una conversación' : 'Aún no hay conversaciones')); box.append(v); }
    else cerrar();
    return;
  }
  // Repintar solo si cambia algo de esta conversación (así no se pierde lo que estás escribiendo)
  const firma = f.k + JSON.stringify(f) + (ancho.matches ? 'a' : 'm');
  if (!forzar && box.dataset.firma === firma) return;
  const activo = document.activeElement && box.contains(document.activeElement) && document.activeElement.tagName === 'TEXTAREA';
  box.dataset.firma = firma;
  box.textContent = '';

  // Cabecera: cara, datos y la acción principal
  const hd = el('div', 'pc-dh');
  const info = el('div', 'pc-dinfo');
  info.append(el('b', null, limpia(f.empresa)), el('span', null, [f.ciudad, f.canal === 'email' ? f.contacto : telBonito(f.contacto)].filter(Boolean).join(' · ')));
  const acts = el('div', 'pc-dacts');
  if (f.canal === 'whatsapp') { const a = el('a', 'pbx-btn wa sm'); a.href = 'https://wa.me/' + String(f.contacto).replace(/\D/g, ''); a.target = '_blank'; a.rel = 'noopener'; a.append(ICO.wa(), el('span', null, 'Contestar en WhatsApp')); acts.append(a); }
  else { const a = el('a', 'pbx-btn sm'); a.href = 'mailto:' + f.contacto; a.append(ICO.mail(), el('span', null, 'Escribir email')); acts.append(a); }
  if (f.web) { const a = el('a', 'pbx-btn ghost sm ico pc-web'); a.href = f.web; a.target = '_blank'; a.rel = 'noopener'; a.title = 'Su web: ' + dominio(f.web); a.setAttribute('aria-label', 'Abrir su web'); a.append(ICO.ext()); acts.append(a); }
  hd.append(avatar(f, true), info, acts);
  if (!ancho.matches) { const x = el('button', 'pbx-btn ico ghost pc-x'); x.type = 'button'; x.title = 'Cerrar (Esc)'; x.setAttribute('aria-label', 'Cerrar'); x.append(ICO.x()); x.onclick = cerrar; hd.append(x); }

  // La IA solo clasifica: una línea
  let clasif = null;
  if (f.estado === 'cita' && f.cita) {
    clasif = el('div', 'pc-clasif cita'); clasif.append(ICO.cal(), el('span', null, 'Cita reservada: ' + dia(new Date(f.cita)) + ' a las ' + hora(new Date(f.cita))));
  } else if (f.respuestas > 0 && f.estado !== 'sin_respuesta') {
    clasif = el('div', 'pc-clasif'); clasif.append(ICO.spark());
    const s = el('span');
    if (f.estado === 'pendiente_ia') s.append('La IA aún no lo ha leído');
    else { s.append(f.manual ? 'Marcado a mano: ' : 'La IA lo ha leído: ', el('b', null, (EST[f.estado] || EST.pregunta)[0])); if (f.resumen) s.append(' · ' + f.resumen); }
    clasif.append(s);
    clasif.style.setProperty('--c', (EST[f.estado] || EST.pregunta)[1]);
  }

  // Hilo con los eventos (abrió su demo) en su sitio
  const chat = el('div', 'pc-chat ' + f.canal);
  const linea = f.mensajes.map((m) => ({ ts: m.ts, m }));
  if (f.demo && f.demo.primera) {
    linea.push({ ts: f.demo.primera, ev: 'Abrió su demo' });
    if (f.demo.visitas > 1 && f.demo.ultima && f.demo.ultima !== f.demo.primera) linea.push({ ts: f.demo.ultima, ev: 'Volvió a abrir su demo · ' + f.demo.visitas + ' veces' });
  }
  linea.sort((a, b) => String(a.ts).localeCompare(String(b.ts)));
  let ultimoDia = '';
  linea.forEach((x) => {
    const d = parse(x.ts); const dd = dia(d);
    if (dd !== ultimoDia) { chat.append(el('div', 'pc-day', dd)); ultimoDia = dd; }
    if (x.ev) { const e = el('div', 'pc-evento'); e.append(ICO.eye(), el('span', null, x.ev + ' · ' + hora(d))); chat.append(e); return; }
    let m = x.m;
    // Respuestas enviadas por WhatsApp: cada bloque salió como un mensaje aparte, así se ven también aquí
    if (m.de === 'sale' && m.respuesta && f.canal === 'whatsapp') {
      const trozos = String(m.texto).split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean);
      trozos.slice(0, -1).forEach((t) => { const b2 = el('div', 'pc-b yo'); b2.append(el('p', null, t)); chat.append(b2); });
      m = { ...m, texto: trozos[trozos.length - 1] || m.texto };
    }
    const b = el('div', 'pc-b ' + (m.de === 'sale' ? 'yo' : 'ellos'));
    b.append(el('p', null, m.texto), el('time', null, hora(d) + (m.de === 'sale' ? (m.manual || m.respuesta ? ' · enviado por ti' : ' · enviado por el agente') : '')));
    if (m.manual) {
      // Por si se pegó mal: solo los «enviados por ti» se pueden quitar
      const q = el('button', 'pc-quitar', '×'); q.type = 'button'; q.title = 'Quitar este mensaje de la conversación';
      q.onclick = async () => { if (!confirm('¿Quitar este mensaje de la conversación?')) return; try { await post('conv_mio_quitar', { canal: f.canal, id: f.id, msg: m.id }); toast('Mensaje quitado.'); await load(); draw(); } catch (e) { toast(e.message, true); } };
      b.append(q);
    }
    chat.append(b);
  });
  // Respuestas que el agente aún no ha enviado
  f.cola.forEach((w) => {
    const b = el('div', 'pc-b yo cola' + (w.estado === 'error' ? ' err' : ''));
    b.append(el('p', null, w.texto), el('time', null, w.estado === 'error' ? 'No enviada: ' + w.error : 'En cola · el agente la está escribiendo'));
    chat.append(b);
  });
  if (!f.mensajes.some((m) => m.de === 'entra')) chat.append(el('div', 'pc-wait', 'Aún no ha contestado.'));

  box.append(hd);
  if (clasif) box.append(clasif);
  box.append(chat, responder(f));
  requestAnimationFrame(() => { chat.scrollTop = chat.scrollHeight; });
  if (activo) { const ta = $('textarea', box); if (ta) ta.focus({ preventScroll: true }); }
}

/* ============ pie: cuánto lleva esperando y la caja de escribir (escribe Daniel: la IA no deja respuestas escritas) ============ */
function responder(f) {
  const box = el('div', 'pc-resp');
  if (f.estado === 'no_interesado') { box.append(el('p', 'pc-resp-no', 'No quiere más mensajes: aquí no se le contesta.')); return box; }
  // Si Daniel ya contestó desde el móvil o su correo, un clic quita el «Te toca» hasta que la empresa vuelva a escribir
  if (f.te_toca || f.contestado) {
    const ya = el('div', 'pc-ya' + (f.contestado ? ' hecho' : ''));
    const ult = ultimaDe(f, 'entra');
    const txt = el('span');
    if (f.contestado) txt.append('Marcado como contestado por ti');
    else { txt.append(ICO.reloj(), 'Lleva '); txt.append(el('b', null, ult ? espera(parse(ult.ts)) : 'un rato')); txt.append(' esperando tu respuesta'); }
    const b = el('button', 'pbx-btn sm' + (f.contestado ? ' ghost' : ''), null); b.type = 'button';
    b.append(el('span', null, f.contestado ? 'Deshacer' : 'Ya le he contestado'));
    b.title = f.contestado ? 'Vuelve a salir como pendiente' : '¿Ya le has contestado tú desde ' + (f.canal === 'email' ? 'tu correo' : 'el móvil') + '? Deja de salir «Te toca» hasta que vuelva a escribir';
    b.onclick = async () => {
      b.disabled = true;
      try { await post('conv_contestado', { canal: f.canal, id: f.id, deshacer: f.contestado ? '1' : '0' }); toast(f.contestado ? 'Vuelve a salir como pendiente.' : 'Listo: ya no sale «Te toca».'); await load(); draw(); }
      catch (e) { toast(e.message, true); b.disabled = false; }
    };
    ya.append(txt, b); box.append(ya);
    if (f.contestado) return box;
  }
  const barra = el('div', 'pc-barra');
  const ta = el('textarea'); ta.rows = 1;
  ta.placeholder = 'Escribe un mensaje';
  ta.setAttribute('aria-label', 'Escribe un mensaje');
  ta.title = f.canal === 'email' ? 'La firma y la opción de no recibir más se añaden solas' : 'Cada bloque separado por una línea en blanco sale como un WhatsApp aparte · Ctrl+Enter para enviar';
  ta.value = borradores.get(f.k) || '';
  const crece = () => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 220) + 'px'; };
  ta.oninput = () => { borradores.set(f.k, ta.value); crece(); };
  requestAnimationFrame(crece);
  const env = el('button', 'pc-enviar'); env.type = 'button'; env.title = 'Enviar'; env.setAttribute('aria-label', 'Enviar');
  env.append(svg('<path d="M4 12 20 4l-6 16-3-7z"/><path d="m11 13 9-9"/>'));
  const enviar = async () => {
    const texto = ta.value.trim(); if (!texto) { toast('El mensaje está vacío.', true); return; }
    env.disabled = true; ta.disabled = true;
    try {
      const r = await post('conv_enviar', { canal: f.canal, id: f.id, texto });
      borradores.delete(f.k);
      toast(r.cola ? 'Enviado: sale en WhatsApp en un momento.' : 'Email enviado.');
      await load(); draw();
    } catch (e) { toast(e.message, true); env.disabled = false; ta.disabled = false; }
  };
  env.onclick = enviar;
  ta.onkeydown = (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); enviar(); } };
  barra.append(ta, env);
  box.append(barra);
  return box;
}

/* ============ canal y periodo (detrás del icono de filtro) ============ */
const pop = $('#pc-pop'), fbtn = $('#pc-filtro');
const popAbre = (si) => { pop.hidden = !si; fbtn.setAttribute('aria-expanded', si ? 'true' : 'false'); fbtn.classList.toggle('on', si); };
fbtn.addEventListener('click', (e) => { e.stopPropagation(); popAbre(pop.hidden); });
document.addEventListener('click', (e) => { if (!pop.hidden && !e.target.closest('.pc-mas')) popAbre(false); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !pop.hidden) { popAbre(false); fbtn.focus(); } });
$('#pc-canal').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { ui.canal = b.dataset.c; guarda(); draw(); } });
$('#pc-periodo').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { ui.periodo = b.dataset.p; guarda(); draw(); } });
let qt; $('#pc-q').addEventListener('input', (e) => { clearTimeout(qt); qt = setTimeout(() => { ui.q = e.target.value.trim(); draw(); }, 140); });
// Pulsar un paso del embudo filtra la lista (Enviados = todas; Citas, dentro de Interesado)
$('#pc-etapas').addEventListener('click', (e) => {
  const b = e.target.closest('[data-etapa]'); if (!b) return;
  const k = b.dataset.etapa === 'cita' ? 'interesado' : b.dataset.etapa;
  ui.estado = ui.estado === k ? '' : k; guarda(); draw();
});
// Al cruzar los 1100 px: el chat pasa del cajón a la columna derecha (o al revés)
ancho.addEventListener('change', () => {
  if (drawer.classList.contains('on')) document.body.classList.remove('pb-locked');
  drawer.classList.remove('on'); veil.classList.remove('on');
  drawer.textContent = ''; drawer.dataset.firma = ''; const pn = $('#pc-panel'); if (pn) pn.dataset.firma = '';
  if (!ancho.matches) ui.abierta = null;
  draw();
});

/* ============ portada de Prospectos: recorrido + tres puertas (la pide agentes.js) ============ */
// Capitales de provincia (longitud, latitud) para el mapa en puntos; Canarias, Ceuta y Melilla quedan fuera del dibujo
const PROV = { alava: [-2.67, 42.85], araba: [-2.67, 42.85], albacete: [-1.86, 38.99], alicante: [-0.48, 38.35], alacant: [-0.48, 38.35], almeria: [-2.46, 36.84], asturias: [-5.85, 43.36], oviedo: [-5.85, 43.36],
  avila: [-4.7, 40.66], badajoz: [-6.97, 38.88], baleares: [2.65, 39.57], 'illes balears': [2.65, 39.57], mallorca: [2.65, 39.57], palma: [2.65, 39.57], barcelona: [2.17, 41.39], burgos: [-3.7, 42.34],
  caceres: [-6.37, 39.47], cadiz: [-6.29, 36.53], cantabria: [-3.8, 43.46], santander: [-3.8, 43.46], castellon: [-0.05, 39.99], 'castello': [-0.05, 39.99], 'ciudad real': [-3.93, 38.99], cordoba: [-4.78, 37.89],
  'a coruna': [-8.4, 43.36], coruna: [-8.4, 43.36], 'la coruna': [-8.4, 43.36], cuenca: [-2.13, 40.07], girona: [2.82, 41.98], gerona: [2.82, 41.98], granada: [-3.6, 37.18], guadalajara: [-3.17, 40.63],
  guipuzcoa: [-1.98, 43.32], gipuzkoa: [-1.98, 43.32], 'san sebastian': [-1.98, 43.32], huelva: [-6.95, 37.26], huesca: [-0.41, 42.14], jaen: [-3.79, 37.77], leon: [-5.57, 42.6], lleida: [0.62, 41.62], lerida: [0.62, 41.62],
  lugo: [-7.56, 43.01], madrid: [-3.7, 40.42], malaga: [-4.42, 36.72], murcia: [-1.13, 37.98], navarra: [-1.64, 42.81], pamplona: [-1.64, 42.81], ourense: [-7.86, 42.34], orense: [-7.86, 42.34], palencia: [-4.53, 42.01],
  pontevedra: [-8.64, 42.43], vigo: [-8.72, 42.24], 'la rioja': [-2.45, 42.47], rioja: [-2.45, 42.47], logrono: [-2.45, 42.47], salamanca: [-5.66, 40.97], segovia: [-4.12, 40.95], sevilla: [-5.98, 37.39], soria: [-2.47, 41.76],
  tarragona: [1.25, 41.12], teruel: [-1.11, 40.34], toledo: [-4.02, 39.86], valencia: [-0.38, 39.47], 'valencia/valencia': [-0.38, 39.47], valladolid: [-4.72, 41.65], vizcaya: [-2.93, 43.26], bizkaia: [-2.93, 43.26], bilbao: [-2.93, 43.26],
  zamora: [-5.75, 41.5], zaragoza: [-0.89, 41.65] };
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s*\(.*\)$/, '').trim();
const PEN = [[-8.4, 43.37], [-9.3, 42.9], [-8.9, 42.1], [-8.2, 42.1], [-7.0, 41.95], [-6.6, 41.95], [-6.2, 41.6], [-6.9, 41.0], [-6.8, 40.3], [-7.0, 39.7], [-7.5, 39.6], [-7.0, 39.0], [-7.3, 38.4], [-7.0, 38.0], [-7.4, 37.2], [-6.9, 37.15], [-6.3, 36.5], [-5.6, 36.0], [-5.35, 36.15], [-4.4, 36.7], [-3.5, 36.72], [-2.4, 36.8], [-2.1, 36.7], [-1.6, 37.3], [-1.0, 37.6], [-0.7, 37.95], [-0.5, 38.35], [0.2, 38.75], [-0.33, 39.45], [0.0, 40.0], [0.85, 40.7], [1.25, 41.1], [2.2, 41.4], [3.2, 41.9], [3.3, 42.3], [3.15, 42.45], [1.7, 42.5], [0.7, 42.8], [-0.7, 42.9], [-1.4, 43.2], [-1.8, 43.38], [-2.9, 43.42], [-3.8, 43.47], [-5.7, 43.56], [-5.85, 43.66], [-7.0, 43.55], [-7.7, 43.79]];
const BAL = [[[2.35, 39.6], [2.95, 39.95], [3.45, 39.75], [3.25, 39.35], [2.75, 39.4]], [[3.8, 39.95], [4.3, 40.05], [4.3, 39.85], [3.85, 39.9]], [[1.2, 38.95], [1.55, 39.1], [1.6, 38.85], [1.3, 38.85]]];
const dentro = (p, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > p[1]) !== (yj > p[1]) && p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi) c = !c; } return c; };
const MK = 25, MP = ([lo, la]) => [30 + (lo + 9.5) * MK, 4 + (44 - la) * MK * 1.3];
let fondoMapa = '';
function mapaMini(puntos) {
  if (!fondoMapa) {
    for (let lo = -9.5; lo < 4.5; lo += 0.2) for (let la = 35.8; la < 44; la += 0.2 / 1.3) {
      if (dentro([lo, la], PEN) || BAL.some((b) => dentro([lo, la], b))) { const [x, y] = MP([lo, la]); fondoMapa += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.6"/>`; }
    }
  }
  // Puntos de color alrededor de cada capital, repartidos siempre igual (semilla fija): no «bailan» al refrescar
  let s = 7; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  let h = '';
  puntos.forEach(([c, ll, n]) => {
    for (let j = 0; j < n; j++) {
      const ang = rnd() * 6.283, d = Math.sqrt(rnd()) * (0.3 + Math.min(n, 80) / 110);
      const [x, y] = MP([ll[0] + Math.cos(ang) * d, ll[1] + Math.sin(ang) * d * 0.8]);
      h += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2" fill="${c}"/>`;
    }
  });
  return `<svg class="pc-mapa" viewBox="24 0 362 268" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><g class="tierra">${fondoMapa}</g>${h}</svg>`;
}
const porta = { hub: null, P: [], h: null };
const irPagina = (p) => { const b = document.querySelector(`#pb-tabs button[data-page="${p}"]`); if (b) b.click(); };
function pintaPortada() {
  const { hub, P, h } = porta; const X = window.PBX;
  if (!hub || !X || !document.body.contains(hub)) return;
  const esc = X.esc;
  const escritasP = P.filter((p) => p.enviado_at || ['enviando', 'enviado', 'respondio', 'baja'].includes(p.estado)).length;
  const F = S.loaded ? S.filas : null;
  const escritas = F ? F.length : escritasP;
  const resp = F ? F.filter((f) => f.respuestas > 0 && f.estado !== 'auto').length : P.filter((p) => p.estado === 'respondio').length;
  const inter = F ? F.filter((f) => ['interesado', 'cita'].includes(f.estado)).length : null;
  const citas = F ? F.filter((f) => f.estado === 'cita').length : null;
  const toca = F ? F.filter((f) => f.te_toca).length : null;
  const carpetas = new Map(); P.forEach((p) => { const k = h.nicho(p); if (!carpetas.has(k)) carpetas.set(k, []); carpetas.get(k).push(p); });
  const provs = new Map(); P.forEach((p) => { const k = h.prov(p); if (k && k !== 'Sin provincia') provs.set(k, (provs.get(k) || 0) + 1); });

  // Recorrido: barras en escala raíz para que los pasos pequeños se vean al lado de los cientos de empresas
  const raiz = (n) => Math.sqrt(Math.max(0, n || 0));
  const de = (a, b, t) => (b ? pct(a, b) + ' ' + t : '—');
  const pasos = [
    { t: 'Empresas', n: N(P.length), llega: raiz(P.length), s: 'en ' + N(carpetas.size) + (carpetas.size === 1 ? ' carpeta' : ' carpetas'), c: 'var(--lime)', i: 'building', clave: 'empresas' },
    { t: 'Escritas', n: N(escritas), llega: raiz(escritas), s: de(escritas, P.length, 'de las encontradas'), c: 'var(--violet-2)', i: 'send', clave: 'escritas' },
    { t: 'Contestaron', n: N(resp), llega: raiz(resp), s: de(resp, escritas, 'de las escritas'), c: 'var(--cyan)', i: 'chat', clave: 'contestaron' },
    { t: 'Interesadas', n: inter == null ? '—' : N(inter), llega: raiz(inter), s: inter == null ? '' : de(inter, resp, 'de las que contestan'), c: 'var(--amber)', i: 'flame', clave: 'interesadas' },
    { t: 'Citas', n: citas == null ? '—' : N(citas), llega: raiz(citas), s: citas == null ? '' : de(citas, inter, 'de las interesadas'), c: 'var(--green)', i: 'calendar', clave: 'citas' },
  ];

  // Puerta Empresas: la carpeta más grande, con lo escrito y lo que falta
  const [nom1, l1] = [...carpetas.entries()].sort((a, b) => b[1].length - a[1].length)[0] || ['Sin carpetas', []];
  const esc1 = l1.filter((p) => p.enviado_at || ['enviando', 'enviado', 'respondio', 'baja'].includes(p.estado)).length;
  // Puerta Conversaciones: tres burbujas reales (lo último que han dicho y lo último que contestaste tú)
  const conRespuesta = F ? F.filter((f) => f.respuestas > 0 && f.estado !== 'auto' && f.estado !== 'no_interesado')
    .map((f) => ({ f, m: ultimaDe(f, 'entra') })).filter((x) => x.m)
    .sort((a, b) => (b.f.te_toca - a.f.te_toca) || String(b.m.ts).localeCompare(String(a.m.ts))) : [];
  let tuyo = null; if (F) F.forEach((f) => f.mensajes.forEach((m) => { if (m.de === 'sale' && (m.manual || m.respuesta) && (!tuyo || m.ts > tuyo.ts)) tuyo = m; }));
  const corto = (t) => { const x = String(t || '').replace(/\s+/g, ' ').trim(); return x.length > 64 ? x.slice(0, 62) + '…' : x; };
  const burb = [];
  if (conRespuesta[0]) burb.push(`<div class="pc-bur">${X.cara(limpia(conRespuesta[0].f.empresa), '', 'xs')}<span>${esc(corto(conRespuesta[0].m.texto))}</span></div>`);
  if (tuyo) burb.push(`<div class="pc-bur yo"><span>${esc(corto(tuyo.texto))}</span></div>`);
  conRespuesta.slice(1, tuyo ? 2 : 3).forEach((x) => burb.push(`<div class="pc-bur">${X.cara(limpia(x.f.empresa), '', 'xs')}<span>${esc(corto(x.m.texto))}</span></div>`));
  // Puerta Mapa: puntos por provincia con el color del estado
  const COLP = [['respondio', 'var(--green)'], ['baja', 'var(--red)'], ['enviado', 'var(--violet-2)'], ['enviando', 'var(--violet-2)'], ['revision', 'var(--amber)'], ['error', 'var(--amber)'], ['pendiente', 'var(--muted)']];
  const puntos = []; const respProv = new Map();
  const total = P.length || 1, escala = Math.min(1, 420 / total);   // como mucho ~420 puntos de color
  [...provs.keys()].forEach((pv) => {
    const ll = PROV[norm(pv)]; if (!ll) return;
    const lp = P.filter((p) => h.prov(p) === pv);
    respProv.set(pv, lp.filter((p) => p.estado === 'respondio').length);
    COLP.forEach(([k, c]) => { const n = Math.round(lp.filter((p) => p.estado === k).length * escala); if (n) puntos.push([c, ll, n]); });
  });
  const top = [...respProv.entries()].filter((x) => x[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 2).map((x) => x[0]);

  const firma = JSON.stringify([pasos, nom1, l1.length, esc1, burb, toca, puntos.length, provs.size, top]);
  if (hub.dataset.firma === firma) return;
  hub.dataset.firma = firma;
  hub.classList.add('pc-portada');
  hub.innerHTML = `<div class="pc-ruta">${X.etapas(pasos, { flechas: false })}</div>
  <div class="pc-puertas">
    <button type="button" class="pbx-c pc-puerta pbg-n" style="--n:5;--c:var(--lime)" data-ir="empresas">
      <span class="vis"><span class="carpeta"><b>${esc(nom1)}</b><span class="n">${N(l1.length)} <small>${l1.length === 1 ? 'empresa' : 'empresas'}</small></span>${X.split([[esc1, 'var(--violet-2)', 'Escritas'], [l1.length - esc1, 'var(--line-2)', 'Sin escribir']], false)}</span></span>
      <span class="fila"><h4>Empresas</h4><svg class="pc-pi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg></span>
      <p>${N(carpetas.size)} ${carpetas.size === 1 ? 'carpeta' : 'carpetas'} por nicho y provincia · ${N(P.length)} empresas</p>
    </button>
    <button type="button" class="pbx-c pc-puerta pbg-n" style="--n:6;--c:var(--amber)" data-ir="conversaciones">
      <span class="vis"><span class="burbujas">${burb.join('') || '<span class="pc-bur-vacio">Aún no ha contestado nadie</span>'}</span></span>
      <span class="fila"><h4>Conversaciones</h4>${toca == null ? '' : toca ? `<span class="pbx-pill" style="--c:var(--lime)">${N(toca)} te toca</span>` : '<span class="pbx-pill" style="--c:var(--green)">Todo contestado</span>'}</span>
      <p>${N(resp)} ${resp === 1 ? 'empresa ha' : 'empresas han'} contestado de ${N(escritas)} escritas</p>
    </button>
    <button type="button" class="pbx-c pc-puerta pbg-n" style="--n:7;--c:var(--cyan)" data-ir="mapa">
      <span class="vis mapa">${mapaMini(puntos)}</span>
      <span class="fila"><h4>Mapa</h4>${X.ico('map', 'pc-pi')}</span>
      <p>${N(provs.size)} ${provs.size === 1 ? 'provincia' : 'provincias'} con empresas${top.length ? '; ' + esc(top.join(' y ')) + (top.length === 1 ? ', la que más responde' : ', las que más responden') : ''}</p>
    </button>
  </div>`;
}
function irDesdePortada(k) {
  const { h } = porta;
  if (k === 'empresas' || k === 'escritas') { if (h) h.empresas(); return; }
  if (k === 'mapa') { irPagina('mapa'); return; }
  if (k === 'contestaron') ui.estado = 'pregunta';
  else if (k === 'interesadas' || k === 'citas') ui.estado = 'interesado';
  else if (k === 'conversaciones') ui.estado = (S.filas.some((f) => f.te_toca) ? 'te_toca' : '');
  guarda(); irPagina('conversaciones');
}
window.PB_PORTADA = (hub, P, h) => {
  if (!window.PBX) return false;
  porta.hub = hub; porta.P = P || []; porta.h = h;
  if (!hub.dataset.oyente) {
    hub.dataset.oyente = '1';
    hub.addEventListener('click', (e) => { const b = e.target.closest('[data-ir],[data-etapa]'); if (b) irDesdePortada(b.dataset.ir || b.dataset.etapa); });
  }
  pintaPortada();
  if (!S.loaded || Date.now() - (S.cargado || 0) > 50000) refrescar();
  return true;
};

/* ============ eventos y ciclo ============ */
const refrescar = () => load().then(() => { if (S.cambio) { draw(); pintaPortada(); } }).catch((e) => { if (enPagina()) toast(e.message, true); });
document.addEventListener('pb:page', (e) => {
  if (e.detail === 'conversaciones') { popAbre(false); if (S.loaded) draw(); refrescar(); }
  else cerrar();
});
// Desde el Resumen o la pastilla de avisos: abrir directamente una conversación
document.addEventListener('pb:abrir-conv', (e) => { load().then(() => { ui.abierta = e.detail; draw(); abrir(e.detail); const r = $(`#pc-lista .pc-fila[data-k="${CSS.escape(e.detail)}"]`); if (r) r.scrollIntoView({ block: 'nearest' }); }).catch((er) => toast(er.message, true)); });
// Cada minuto con la sección abierta (o la portada de Prospectos); el chat solo se repinta si cambia esa conversación
setInterval(() => { if (!document.hidden && (enPagina() || document.body.dataset.page === 'prospectos')) refrescar(); }, 60000);
refrescar();
})();
