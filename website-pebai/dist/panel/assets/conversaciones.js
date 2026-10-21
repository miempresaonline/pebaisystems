/* PEBAI · Panel — Captación › Conversaciones: el CRM de todo lo enviado por WhatsApp y email.
   Datos en index.php?conv=1. Todo texto de empresas y mensajes se pinta con textContent (nunca innerHTML con datos). */
(() => {
'use strict';
const app = document.getElementById('pb-app');
if (!app) return;
const BASE = app.dataset.base;
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const S = { filas: [], loaded: false, csrf: app.dataset.csrf };
const ui = { estado: '', canal: '', q: '', periodo: 'todo', abierta: null };
try { Object.assign(ui, JSON.parse(localStorage.getItem('pebai-conv-ui') || '{}'), { abierta: null }); } catch (e) { /* sin almacenamiento */ }
const guarda = () => { try { localStorage.setItem('pebai-conv-ui', JSON.stringify({ estado: ui.estado, canal: ui.canal, periodo: ui.periodo })); } catch (e) { /* nada */ } };

/* ============ dominio ============ */
const EST = {
  sin_respuesta: ['Sin respuesta', '#6F7189'], auto: ['Contestador', '#9A9CB0'], pregunta: ['Contestó', '#3FD5FF'], pendiente_ia: ['Contestó', '#3FD5FF'],
  interesado: ['Interesado', '#B7FF3C'], no_interesado: ['No interesado', '#FF6B7A'], cita: ['Cita reservada', '#25D366'],
  te_toca: ['Te toca responder', '#FFB547'],
};
const ORDEN = ['', 'te_toca', 'interesado', 'cita', 'pregunta', 'sin_respuesta', 'auto', 'no_interesado'];
const grupo = (e) => (e === 'pendiente_ia' ? 'pregunta' : e);
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const pad = (n) => String(n).padStart(2, '0');
const parse = (s) => (s ? new Date(String(s).replace(' ', 'T')) : null);
const N = (n) => new Intl.NumberFormat('es-ES').format(n || 0);
const pct = (a, b) => (b ? Math.round((a / b) * 100) + ' %' : '—');
const dia = (d) => (d ? `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}` : '—');
const hora = (d) => (d ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : '');
const hace = (d) => {
  if (!d) return '';
  const m = Math.round((Date.now() - d) / 60000);
  if (m < 1) return 'ahora'; if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60); if (h < 24) return `hace ${h} h`;
  const dd = Math.round(h / 24); return dd === 1 ? 'ayer' : `hace ${dd} días`;
};
const dominio = (w) => { try { return new URL(w).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
const limpia = (s) => String(s || '').replace(/\s*[|–—-]\s.*$/u, '').replace(/[^\p{L}\p{N}&.,' ]/gu, ' ').replace(/\s+/g, ' ').trim() || String(s || '');
const iniciales = (s) => (limpia(s).split(/\s+/).slice(0, 2).map((w) => w[0]).join('') || '?').toUpperCase();
const telBonito = (t) => { const s = String(t || '').replace(/\D/g, ''); return s.startsWith('34') && s.length === 11 ? `+34 ${s.slice(2, 5)} ${s.slice(5, 7)} ${s.slice(7, 9)} ${s.slice(9)}` : t; };

/* ============ DOM ============ */
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const svg = (inner, cls) => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', cls || 'pb-i'); s.innerHTML = inner; return s; };
const ICO = {
  wa: () => { const b = window.PB_ICONS && window.PB_ICONS.brands && window.PB_ICONS.brands.whatsapp; return svg(b ? `<path d="${b.d}"/>` : '<circle cx="12" cy="12" r="9"/>', 'ic-fill'); },
  mail: () => svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
  chat: () => svg('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>'),
  eye: () => svg('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  cal: () => svg('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>'),
  search: () => svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  x: () => svg('<path d="M18 6 6 18M6 6l12 12"/>'),
  ext: () => svg('<path d="M14 4h6v6M10 14 20 4M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>'),
};
const toast = (msg, err) => { const t = $('#pb-toast'); if (!t) return; $('span', t).textContent = msg; t.classList.toggle('err', !!err); t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 3200); };
function avatar(f, big) {
  const a = el('span', 'pc-av' + (big ? ' big' : ''));
  const dom = dominio(f.web);
  a.append(el('b', null, iniciales(f.empresa)));
  if (f.foto) {
    // Foto de perfil de WhatsApp de la empresa
    const img = new Image(); img.alt = ''; img.src = BASE + '?foto=' + encodeURIComponent(f.foto); img.className = 'foto';
    img.onload = () => a.classList.add('img'); img.onerror = () => img.remove(); a.append(img);
  } else if (dom) {
    const img = new Image(); img.alt = ''; img.loading = 'lazy'; img.referrerPolicy = 'no-referrer';
    img.src = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(dom)}&sz=128`;
    img.onload = () => { if (img.naturalWidth > 16) a.classList.add('img'); else img.remove(); };
    img.onerror = () => img.remove();
    a.append(img);
  }
  const c = el('i', 'pc-ch ' + f.canal); c.append(f.canal === 'email' ? ICO.mail() : ICO.wa()); a.append(c);
  return a;
}
const pill = (e) => { const [l, c] = EST[e] || EST.pregunta; const p = el('span', 'pc-pill', l); p.style.setProperty('--c', c); return p; };

/* ============ datos ============ */
async function load() {
  const r = await fetch(BASE + '?conv=1', { credentials: 'same-origin', cache: 'no-store' });
  if (r.status === 401) { location.reload(); return; }
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || 'Error al cargar');
  S.filas = j.filas; S.csrf = j.csrf || S.csrf; S.loaded = true;
  const n = $('#pb-conv-n'); if (n) n.textContent = N(S.filas.filter((f) => ['interesado', 'pregunta', 'pendiente_ia'].includes(f.estado)).length);
}
async function post(action, fields) {
  const body = new URLSearchParams({ action, csrf: S.csrf, ...fields });
  const r = await fetch(BASE, { method: 'POST', body, credentials: 'same-origin', headers: { Accept: 'application/json' } });
  if (r.status === 401) { location.reload(); return {}; }
  const j = await r.json().catch(() => ({ ok: false, error: 'Respuesta inesperada del servidor.' }));
  if (!j.ok) throw new Error(j.error || 'No se ha podido guardar.');
  return j;
}

/* ============ filtros ============ */
const desde = () => { const d = new Date(); d.setHours(0, 0, 0, 0); if (ui.periodo === 'hoy') return d; if (ui.periodo === '7') return new Date(d - 6 * 864e5); if (ui.periodo === '30') return new Date(d - 29 * 864e5); return new Date(0); };
function base() { const d0 = desde(); return S.filas.filter((f) => (!ui.canal || f.canal === ui.canal) && parse(f.enviado_at) >= d0); }
function visibles() {
  const q = ui.q.toLowerCase();
  return base().filter((f) => (!ui.estado || (ui.estado === 'te_toca' ? f.te_toca : grupo(f.estado) === ui.estado))
    && (!q || [f.empresa, f.ciudad, f.contacto, f.resumen, f.notas, ...f.mensajes.map((m) => m.texto)].join(' ').toLowerCase().includes(q)));
}

/* ============ dibujo ============ */
function drawKpis(B) {
  const box = $('#pc-kpis'); box.textContent = '';
  const resp = B.filter((f) => f.respuestas > 0 && f.estado !== 'auto').length;
  const inter = B.filter((f) => ['interesado', 'cita'].includes(f.estado)).length;
  const citas = B.filter((f) => f.estado === 'cita').length;
  const wa = B.filter((f) => f.canal === 'whatsapp').length;
  [['Enviados', N(B.length), `${N(wa)} WhatsApp · ${N(B.length - wa)} email`, ''],
    ['Contestaron', N(resp), pct(resp, B.length) + ' de respuesta (sin contestadores)', 'cyan'],
    ['Interesados', N(inter), pct(inter, B.length) + ' de los enviados', 'lime'],
    ['Citas', N(citas), citas ? 'reservadas' : 'aún ninguna', 'green']]
    .forEach(([l, v, d, c], i) => { const k = el('div', 'pc-kpi ' + c); k.style.setProperty('--i', i); k.append(el('small', null, l), el('b', null, v), el('span', null, d)); box.append(k); });
}
function drawFiltros(B) {
  const box = $('#pc-estados'); box.textContent = '';
  ORDEN.forEach((k) => {
    const n = k ? B.filter((f) => (k === 'te_toca' ? f.te_toca : grupo(f.estado) === k)).length : B.length;
    if (k && !n && ui.estado !== k) return;
    const [l, c] = k ? EST[k] : ['Todas', '#EFEDE7'];
    const b = el('button', 'pc-f' + (ui.estado === k ? ' on' : '')); b.type = 'button'; b.style.setProperty('--c', c);
    b.append(el('i'), el('span', null, l), el('em', null, N(n)));
    b.onclick = () => { ui.estado = ui.estado === k ? '' : k; guarda(); draw(); };
    box.append(b);
  });
  $$('#pc-canal button').forEach((b) => b.classList.toggle('on', b.dataset.c === ui.canal));
  $$('#pc-periodo button').forEach((b) => b.classList.toggle('on', b.dataset.p === ui.periodo));
}
function drawTabla(rows) {
  const box = $('#pc-lista'); box.textContent = '';
  if (!rows.length) { box.append(el('div', 'pc-vacio', S.filas.length ? 'Nada con estos filtros.' : 'Todavía no se ha enviado ningún mensaje.')); return; }
  rows.forEach((f, i) => {
    const r = el('div', 'pc-row'); r.style.setProperty('--i', Math.min(i, 14)); r.dataset.k = f.k;
    const who = el('div', 'pc-who');
    const t = el('div'); t.append(el('b', null, limpia(f.empresa)), el('span', null, [f.ciudad, f.canal === 'email' ? f.contacto : telBonito(f.contacto)].filter(Boolean).join(' · ')));
    who.append(avatar(f), t);
    const d = parse(f.enviado_at);
    const env = el('div', 'pc-env'); env.append(el('b', null, dia(d)), el('span', null, hora(d)));
    const est = el('div', 'pc-est'); est.append(pill(f.estado)); if (f.manual) est.append(el('small', null, 'a mano'));
    if (f.te_toca) est.append(el('small', 'pc-toca', f.borrador ? 'Respuesta lista' : 'Te toca'));
    else if (f.cola.length) est.append(el('small', 'pc-toca cola', 'Enviando…'));
    const ult = el('div', 'pc-ult');
    const ultima = [...f.mensajes].reverse().find((m) => m.de === 'entra');
    if (f.resumen) ult.append(el('p', null, f.resumen));
    else if (ultima) ult.append(el('p', null, '“' + ultima.texto.slice(0, 120) + '”'));
    else ult.append(el('p', 'muted', 'Esperando respuesta'));
    if (ultima) ult.append(el('span', null, hace(parse(ultima.ts))));
    const acts = el('div', 'pc-acts');
    const bm = el('button', 'pc-btn', null); bm.type = 'button'; bm.append(ICO.eye(), el('span', null, 'Mensaje')); bm.title = 'Ver el mensaje enviado';
    bm.onclick = (e) => { e.stopPropagation(); r.classList.toggle('abierta'); };
    const bc = el('button', 'pc-btn main', null); bc.type = 'button'; bc.append(ICO.chat(), el('span', null, 'Conversación' + (f.respuestas ? ` · ${f.respuestas}` : '')));
    bc.onclick = (e) => { e.stopPropagation(); abrir(f.k); };
    acts.append(bm, bc);
    const msg = el('div', 'pc-msg'); const env1 = f.mensajes.find((m) => m.de === 'sale');
    msg.append(el('small', null, `Enviado por ${f.canal === 'email' ? 'email' : 'WhatsApp'} · ${dia(d)} a las ${hora(d)}`), el('p', null, env1 ? env1.texto : '—'));
    r.append(who, env, est, ult, acts, msg);
    r.onclick = () => abrir(f.k);
    box.append(r);
  });
}
function draw() {
  if (!S.loaded || document.body.dataset.page !== 'conversaciones') return;
  const B = base();
  drawKpis(B); drawFiltros(B); drawTabla(visibles());
  if (ui.abierta) drawChat();
}

/* ============ conversación (chat) ============ */
const drawer = el('aside', 'pc-drawer'); drawer.setAttribute('aria-label', 'Conversación');
const veil = el('div', 'pc-veil');
document.body.append(veil, drawer);
veil.onclick = () => cerrar();
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && ui.abierta) cerrar(); });
function abrir(k) { ui.abierta = k; drawChat(); drawer.classList.add('on'); veil.classList.add('on'); }
function cerrar() { ui.abierta = null; drawer.classList.remove('on'); veil.classList.remove('on'); }
function drawChat() {
  const f = S.filas.find((x) => x.k === ui.abierta); if (!f) return cerrar();
  drawer.textContent = '';
  const hd = el('div', 'pc-dh');
  const x = el('button', 'pc-x'); x.type = 'button'; x.title = 'Cerrar (Esc)'; x.append(ICO.x()); x.onclick = cerrar;
  const info = el('div', 'pc-dinfo'); info.append(el('b', null, limpia(f.empresa)), el('span', null, [f.ciudad, f.canal === 'email' ? f.contacto : telBonito(f.contacto)].filter(Boolean).join(' · ')));
  hd.append(avatar(f, true), info, x);
  const links = el('div', 'pc-links');
  if (f.web) { const a = el('a', 'pc-btn'); a.href = f.web; a.target = '_blank'; a.rel = 'noopener'; a.append(ICO.ext(), el('span', null, 'Web')); links.append(a); }
  if (f.canal === 'whatsapp') { const a = el('a', 'pc-btn wa'); a.href = 'https://wa.me/' + String(f.contacto).replace(/\D/g, ''); a.target = '_blank'; a.rel = 'noopener'; a.append(ICO.wa(), el('span', null, 'Abrir en WhatsApp')); links.append(a); }
  else { const a = el('a', 'pc-btn'); a.href = 'mailto:' + f.contacto; a.append(ICO.mail(), el('span', null, 'Escribir email')); links.append(a); }
  const rb = el('button', 'pc-btn main', null); rb.type = 'button'; rb.append(ICO.cal(), el('span', null, f.reserva ? 'Copiar enlace de reserva' : 'Crear enlace de reserva'));
  rb.onclick = async () => {
    try {
      const url = f.reserva || (await post('conv_reserva', { canal: f.canal, id: f.id })).url;
      await navigator.clipboard.writeText(url).catch(() => {});
      toast('Enlace de reserva copiado: pégalo en la conversación.');
      await load(); draw();
    } catch (e) { toast(e.message, true); }
  };
  links.append(rb);
  // Estado: la IA lo pone sola; aquí se corrige si se equivoca
  const est = el('div', 'pc-dest'); est.append(el('small', null, f.manual ? 'Estado (puesto a mano)' : 'Estado (lo pone la IA al leer la respuesta)'));
  const seg = el('div', 'pc-seg');
  [['interesado', 'Interesado'], ['pregunta', 'Contestó'], ['auto', 'Contestador'], ['no_interesado', 'No interesado']].forEach(([k, l]) => {
    const b = el('button', grupo(f.estado) === k ? 'on' : '', l); b.type = 'button'; b.style.setProperty('--c', EST[k][1]);
    b.onclick = async () => { try { await post('conv_estado', { canal: f.canal, id: f.id, estado: k }); toast('Estado guardado.'); await load(); draw(); } catch (e) { toast(e.message, true); } };
    seg.append(b);
  });
  if (f.manual) { const b = el('button', 'ia', 'Que lo decida la IA'); b.type = 'button'; b.onclick = async () => { await post('conv_estado', { canal: f.canal, id: f.id, estado: 'ia' }); toast('La IA lo volverá a clasificar en unos minutos.'); await load(); draw(); }; seg.append(b); }
  est.append(seg);
  if (f.estado === 'cita' && f.cita) est.append(el('p', 'pc-cita', 'Cita reservada: ' + dia(new Date(f.cita)) + ' a las ' + hora(new Date(f.cita))));
  // Hilo
  const chat = el('div', 'pc-chat ' + f.canal);
  let ultimoDia = '';
  f.mensajes.forEach((m) => {
    const d = parse(m.ts); const dd = dia(d);
    if (dd !== ultimoDia) { chat.append(el('div', 'pc-day', dd)); ultimoDia = dd; }
    const b = el('div', 'pc-b ' + (m.de === 'sale' ? 'yo' : 'ellos'));
    b.append(el('p', null, m.texto), el('time', null, hora(d) + (m.de === 'sale' ? (m.manual ? ' · enviado por ti' : m.respuesta ? ' · aprobada por ti' : ' · enviado por el agente') : '')));
    chat.append(b);
  });
  // Respuestas aprobadas que el agente aún no ha enviado
  f.cola.forEach((w) => {
    const b = el('div', 'pc-b yo cola' + (w.estado === 'error' ? ' err' : ''));
    b.append(el('p', null, w.texto), el('time', null, w.estado === 'error' ? 'No enviada: ' + w.error : 'En cola · el agente la está escribiendo'));
    chat.append(b);
  });
  if (!f.mensajes.some((m) => m.de === 'entra')) chat.append(el('div', 'pc-wait', 'Aún no ha contestado.'));
  // Notas
  const nt = el('div', 'pc-notas'); nt.append(el('small', null, 'Notas del equipo'));
  const ta = el('textarea'); ta.value = f.notas || ''; ta.placeholder = 'Ej.: le interesa para la web y WhatsApp; llamar el jueves por la tarde.';
  let tm; ta.oninput = () => { clearTimeout(tm); tm = setTimeout(async () => { try { await post('conv_notas', { canal: f.canal, id: f.id, notas: ta.value }); f.notas = ta.value; } catch (e) { toast(e.message, true); } }, 700); };
  nt.append(ta);
  drawer.append(hd, links, est, chat, responder(f), nt);
  requestAnimationFrame(() => { chat.scrollTop = chat.scrollHeight; });
}

/* ============ responder (la IA propone, Daniel aprueba) ============ */
function responder(f) {
  const box = el('div', 'pc-resp');
  if (f.estado === 'no_interesado') { box.append(el('p', 'pc-resp-no', 'No quiere más mensajes: aquí no se le contesta.')); return box; }
  const via = f.canal === 'email' ? 'email' : 'WhatsApp';
  box.append(el('small', null, f.borrador ? 'Respuesta preparada por la IA · revísala y envíala' : 'Responder por ' + via));
  const ta = el('textarea'); ta.value = f.borrador || ''; ta.rows = 5;
  ta.placeholder = f.te_toca ? 'La IA está preparando la respuesta (tarda unos minutos). También puedes pedirla ya con «Otra versión» o escribirla tú.' : 'Escribe aquí tu mensaje o pide uno a la IA con «Otra versión».';
  const nota = el('p', 'pc-resp-nota', '[ENLACE_RESERVA] se cambia solo por su enlace para reservar la llamada.' + (f.canal === 'email' ? ' La firma y la opción de no recibir más se añaden solas.' : ''));
  const fila = el('div', 'pc-resp-fila');
  const ins = el('input'); ins.type = 'text'; ins.placeholder = 'Indicación para la IA (opcional): más corto, pregunta por su equipo…'; ins.maxLength = 300;
  const otra = el('button', 'pc-btn', null); otra.type = 'button'; otra.append(el('span', null, f.borrador ? 'Otra versión' : 'Que la escriba la IA'));
  const env = el('button', 'pc-btn main', null); env.type = 'button'; env.append(f.canal === 'email' ? ICO.mail() : ICO.wa(), el('span', null, 'Enviar por ' + via));
  const ocupado = (on, b, txt) => { otra.disabled = env.disabled = on; if (b) $('span', b).textContent = txt; };
  otra.onclick = async () => {
    const antes = $('span', otra).textContent; ocupado(true, otra, 'Escribiendo…');
    try { const r = await post('conv_borrador', { canal: f.canal, id: f.id, instruccion: ins.value }); ta.value = r.texto; f.borrador = r.texto; ins.value = ''; }
    catch (e) { toast(e.message, true); }
    ocupado(false, otra, antes);
  };
  env.onclick = async () => {
    const texto = ta.value.trim(); if (!texto) { toast('El mensaje está vacío.', true); return; }
    ocupado(true, env, 'Enviando…');
    try {
      const r = await post('conv_enviar', { canal: f.canal, id: f.id, texto });
      toast(r.cola ? 'Aprobada: el agente la escribe en WhatsApp en un minuto.' : 'Email enviado en el mismo hilo.');
      await load(); draw();
    } catch (e) { toast(e.message, true); ocupado(false, env, 'Enviar por ' + via); }
  };
  fila.append(ins, otra);
  box.append(ta, nota, fila, env);
  return box;
}

/* ============ eventos y ciclo ============ */
$('#pc-canal').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { ui.canal = b.dataset.c; guarda(); draw(); } });
$('#pc-periodo').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { ui.periodo = b.dataset.p; guarda(); draw(); } });
let qt; $('#pc-q').addEventListener('input', (e) => { clearTimeout(qt); qt = setTimeout(() => { ui.q = e.target.value.trim(); draw(); }, 140); });
const refrescar = () => load().then(draw).catch((e) => { if (document.body.dataset.page === 'conversaciones') toast(e.message, true); });
document.addEventListener('pb:page', (e) => { if (e.detail === 'conversaciones') refrescar(); else cerrar(); });
setInterval(() => { if (!document.hidden && document.body.dataset.page === 'conversaciones' && !ui.abierta) refrescar(); }, 60000);
refrescar();
})();
