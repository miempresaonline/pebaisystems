/* PEBAI · Panel — Captación › Email y la tarjeta del agente de email en Agentes. Datos en index.php?email=1.
   Funcional a propósito: el diseño se hará más adelante. Se monta solo (botón, sección y tarjeta) para no tocar el resto del panel.
   Todo texto que viene de prospectos o emails se pinta con textContent: nunca innerHTML con datos. */
(() => {
'use strict';
const app = document.getElementById('pb-app');
if (!app) return;
const BASE = app.dataset.base;
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const S = { loaded: false, csrf: app.dataset.csrf };
const ui = { estado: '', nicho: '', q: '', limit: 150 };

const ESTADOS = {
  pendiente: ['En cola', '#3A404D', '#C9CED8'], enviado: ['Enviado', '#6A5CFF', '#FFFFFF'], recordado: ['Recordatorio enviado', '#6A5CFF', '#FFFFFF'],
  respondio: ['Respondió', '#3FD5FF', '#0B0F14'], interesado: ['Quiere el vídeo', '#25D366', '#0B0F14'], baja: ['Baja', '#FF6B7A', '#0B0F14'],
  rebote: ['Rebotó', '#FFB547', '#0B0F14'], descartado: ['Descartado', '#3A404D', '#C9CED8'], error: ['Revisar', '#FFB547', '#0B0F14'],
};
const AGENTE = { activo: ['ok', 'Activo'], pausado: ['warn', 'En pausa'], frenado: ['bad', 'Frenado'], sin_configurar: ['off', 'Sin buzón configurado'] };
const pad = (n) => String(n).padStart(2, '0');
const parse = (s) => s ? new Date(String(s).replace(' ', 'T')) : null;
const N = (n) => new Intl.NumberFormat('es-ES').format(n || 0);
const pct = (a, b) => b ? Math.round(a / b * 1000) / 10 + ' %' : '—';
const fecha = (d) => d && !isNaN(d) ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}` : '—';
const hace = (d) => { if (!d || isNaN(d)) return 'nunca'; const m = Math.round((S.ahora - d) / 60000); return m < 1 ? 'ahora' : m < 60 ? `hace ${m} min` : m < 1440 ? `hace ${Math.round(m / 60)} h` : `hace ${Math.round(m / 1440)} d`; };
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const btn = (cls, text, onClick) => { const b = el('button', 'pb-btn ' + cls, text); b.type = 'button'; if (onClick) b.addEventListener('click', onClick); return b; };
const badge = (k) => { const [l, bg, fg] = ESTADOS[k] || ESTADOS.pendiente; const s = el('span', 'pb-badge', l); s.style.background = bg; s.style.color = fg; return s; };
const toast = (msg, err) => { const t = $('#pb-toast'); if (!t) return; $('span', t).textContent = msg; t.classList.toggle('err', !!err); t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 3400); };
const field = (label, input) => { const l = el('label', 'pb-field'); l.append(el('span', null, label), input); return l; };
const input = (name, value, attrs) => { const i = el('input'); i.name = name; i.value = value == null ? '' : value; Object.assign(i, attrs || {}); return i; };

/* ============ montaje (botón, sección y tarjeta) ============ */
function montar() {
  const pros = $('#pb-tabs button[data-page="prospectos"]');
  if (pros && !$('#pb-tabs button[data-page="email"]')) {
    const b = el('button'); b.type = 'button'; b.dataset.page = 'email';
    b.innerHTML = '<svg class="pb-i" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg><span>Email</span><em id="pb-email-n">—</em>';
    pros.after(b);
  }
  if (!$('#page-email')) {
    const sec = el('section', 'pb-page'); sec.id = 'page-email'; sec.dataset.page = 'email';
    sec.innerHTML = '<div class="pb-pagehead"><div><div class="pb-eyebrow">Captación · Email en frío</div><h1 class="pb-h1">Email, <i>con motivo real</i></h1>'
      + '<p class="pb-lead">Motivo → pregunta de una palabra → permiso. Solo se escribe a empresas con ficha de nicho y vídeo grabado. Estrategia: docs/captacion-email.md.</p></div></div>'
      + '<div id="pe-avisos"></div><div class="pb-grid k" id="pe-kpis"></div><div id="pe-cuerpo"></div>';
    const ref = $('#page-agentes') || $('.pb-main .pb-page:last-of-type');
    ref.parentNode.insertBefore(sec, ref);
  }
  const soon = $$('#page-agentes .pb-soon').find((c) => /email/i.test(c.textContent));
  if (soon && !$('#pe-agente')) { const d = el('div'); d.id = 'pe-agente'; soon.replaceWith(d); }
  if ($('#pe-agente') && !$('#pe-prospeccion')) { const d = el('div'); d.id = 'pe-prospeccion'; $('#pe-agente').after(d); }
}

/* ============ datos ============ */
async function load() {
  const r = await fetch(BASE + '?email=1', { credentials: 'same-origin', cache: 'no-store' });
  if (r.status === 401) { location.reload(); return; }
  // Nunca recargar si la respuesta no es JSON: si falta _email_panel.php o PHP falla, recargar crearía un bucle infinito.
  let j; try { j = await r.json(); } catch (e) { S.caido = true; throw new Error('No se han podido cargar los datos del email. Si la sesión ha caducado, recarga la página.'); }
  if (!j.ok) throw new Error(j.error || 'Error al cargar');
  Object.assign(S, j, { ahora: parse(j.ahora), loaded: true });
  S.porP = new Map(); (j.mensajes || []).forEach((m) => { if (!S.porP.has(m.prospecto_id)) S.porP.set(m.prospecto_id, []); S.porP.get(m.prospecto_id).push(m); });
}
async function post(action, fields, b) {
  const body = fields instanceof FormData ? fields : new URLSearchParams(fields);
  body.set('action', action); body.set('csrf', S.csrf);
  if (b) b.disabled = true;
  try {
    const r = await fetch(BASE, { method: 'POST', body, credentials: 'same-origin', headers: { Accept: 'application/json' } });
    if (r.status === 401) { location.reload(); return {}; }
    let j = {}; try { j = await r.json(); } catch (e) { j = { ok: false, error: 'Respuesta inesperada del servidor.' }; }
    if (!j.ok) throw new Error(j.error || 'No se ha podido guardar.');
    if (action !== 'email_vista') { await load(); draw(); }
    return j;
  } finally { if (b) b.disabled = false; }
}
const accion = (action, fields, okMsg, b) => post(action, fields, b).then((j) => { if (okMsg) toast(okMsg); return j; }).catch((e) => { toast(e.message, true); });

/* ============ página Email ============ */
function avisos() {
  const box = $('#pe-avisos'); box.textContent = '';
  const a = S.agente, nichos = S.cfg.nichos || {};
  const lista = [];
  if (!a.buzon) lista.push(['bad', 'Falta el buzón del frío', "Crea en Hostinger un buzón solo para esto (mejor en un subdominio) y añádelo a private/config.php como 'email_frio'. Sin él no sale nada."]);
  if (a.buzon && !a.avisar_a) lista.push(['warn', 'Sin aviso de respuestas', "Pon 'avisar_a' en 'email_frio' (private/config.php) para recibir cada respuesta al momento."]);
  const conVideo = Object.entries(nichos).filter(([, f]) => f.video).map(([k]) => k);
  if (!conVideo.length) lista.push(['warn', 'Ningún nicho listo', 'Añade abajo la ficha de un nicho y marca que su vídeo ya está grabado. Hasta entonces no se envía nada.']);
  const enCola = {}; S.prospectos.filter((p) => p.estado === 'pendiente').forEach((p) => { enCola[p.nicho || '(sin nicho)'] = (enCola[p.nicho || '(sin nicho)'] || 0) + 1; });
  Object.entries(enCola).filter(([k]) => !conVideo.includes(k)).forEach(([k, n]) => lista.push(['info', `${N(n)} en cola de «${k}» esperando`, 'Les falta la ficha del nicho o el vídeo grabado.']));
  if (a.estado === 'frenado') lista.push(['bad', 'El agente se ha frenado solo', a.detalle || '']);
  lista.forEach(([t, h, d]) => { const c = el('div', 'pb-pend pe-aviso ' + t); c.append(el('div', 'n', t === 'bad' ? '!' : t === 'warn' ? '·' : 'i'), (() => { const x = el('div'); x.append(el('div', 't', h), el('div', 'd', d)); return x; })()); box.append(c); });
}
function kpis() {
  const P = S.prospectos, k = $('#pe-kpis'); k.textContent = '';
  const cuenta = (e) => P.filter((p) => p.estado === e).length;
  const enviados = P.filter((p) => p.paso > 0).length;
  const resp = cuenta('respondio') + cuenta('interesado') + P.filter((p) => p.estado === 'baja' && p.respondido_at).length;
  [['En cola', cuenta('pendiente'), 'listos o esperando ficha'], ['Escritos', enviados, `hoy ${S.agente.enviados_hoy}/${S.agente.limite}`],
    ['Respondieron', resp, pct(resp, enviados) + ' de respuesta'], ['Quieren el vídeo', cuenta('interesado'), pct(cuenta('interesado'), enviados) + ' de los escritos'],
    ['Bajas', cuenta('baja'), 'para siempre, en todos los canales'], ['Rebotes', cuenta('rebote'), 'freno si pasan del 3 %']]
    .forEach(([l, v, d], i) => { const c = el('div', 'pb-card pb-kpi' + (i === 0 ? ' hero' : '')); c.append(el('div', 'l', l), el('div', 'v', N(v)), el('div', 'd', d)); k.append(c); });
}
function cuerpo() {
  const box = $('#pe-cuerpo'); box.textContent = '';
  box.append(tarjetaImportar(), tarjetaNichos(), tarjetaLista(), tarjetaAjustes());
}
function tarjetaImportar() {
  const d = el('details', 'pb-histbox pe-det');
  d.append(el('summary', null, 'Importar prospectos del scraper'));
  const f = el('form', 'pe-form');
  const file = input('archivo', '', { type: 'file', accept: '.csv,.tsv,.txt' });
  const ta = el('textarea'); ta.name = 'texto'; ta.placeholder = 'empresa;email;nicho;ciudad;origen_email;senal;motivo;motivo_fuente;motivo_fecha';
  const nichos = Object.keys(S.cfg.nichos || {});
  const sel = el('select'); sel.name = 'nicho'; sel.add(new Option('Nicho por defecto (si el CSV no lo trae)', '')); nichos.forEach((n) => sel.add(new Option(n, n)));
  f.append(field('CSV', file), field('…o pégalo', ta), field('Nicho', sel), field('Lote', input('lote', '', { placeholder: 'Reformas Valencia, octubre' })));
  f.append(el('p', 'note', 'Columnas: email y origen_email obligatorias (sin origen no entra). senal: anuncios, empleo, resenas, apertura, atencion o ninguna. Las bajas y rebotes anteriores no vuelven a entrar.'));
  const b = btn('primary', 'Importar'); b.type = 'submit'; f.append(b);
  f.addEventListener('submit', (e) => { e.preventDefault(); accion('email_importar', new FormData(f), null, b).then((j) => { if (j && j.res) { const r = j.res; toast(`${N(r.nuevos)} nuevos · ${N(r.repetidos)} repetidos · ${N(r.invalidos)} no válidos · ${N(r.sin_origen)} sin origen · ${N(r.bajas)} con baja`); } }); });
  d.append(f); return d;
}
function tarjetaNichos() {
  const d = el('details', 'pb-histbox pe-det');
  const nichos = S.cfg.nichos || {};
  d.append(el('summary', null, `Fichas de nicho (${Object.keys(nichos).length})`));
  const list = el('div', 'pe-nichos');
  Object.entries(nichos).forEach(([slug, f]) => {
    const r = el('div', 'pe-nicho');
    const t = el('div'); t.append(el('b', null, `${f.nombre || slug} (${slug})`), el('div', 'muted', `Momento: ${f.momento}`), el('div', 'muted', `Pregunta: ${f.pregunta}`),
      el('div', 'muted', `Meses: ${(f.meses || []).length ? f.meses.join(', ') : 'todo el año'} · Vídeo: ${f.video ? 'grabado ✓' : 'falta'}`));
    const acts = el('div', 'pe-acts');
    acts.append(btn('ghost', 'Editar', () => rellenar(slug, f)), btn('danger', 'Borrar', (e) => { if (confirm('¿Borrar la ficha de ' + slug + '?')) accion('email_nicho_borrar', { slug }, 'Ficha borrada.', e.currentTarget); }));
    r.append(t, acts); list.append(r);
  });
  if (!Object.keys(nichos).length) list.append(el('p', 'note', 'Aún no hay nichos. Se deciden en docs/captacion-nichos.md; cuando haya uno elegido y su vídeo grabado, se rellena aquí.'));
  const f = el('form', 'pe-form');
  const v = input('video', '1', { type: 'checkbox' });
  const vl = el('label', 'pe-check'); vl.append(v, ' El vídeo de este nicho ya está grabado (sin esto no se envía: el email dice «He grabado»)');
  f.append(field('Identificador', input('slug', '', { placeholder: 'reformas' })), field('Nombre', input('nombre', '', { placeholder: 'Empresas de reformas' })),
    field('Producto (con sus palabras)', input('producto', '', { placeholder: 'reformas integrales' })),
    field('Momento: de qué trata el vídeo (completa «He grabado un vídeo de un minuto sobre…»)', input('momento', '', { placeholder: 'lo que pasa con una petición de presupuesto que llega mientras estáis en obra' })),
    field('Pregunta del nicho (se contesta con una palabra o un número)', input('pregunta', '', { placeholder: 'Cuando estáis en obra, ¿cuánto soléis tardar en contestar un presupuesto?' })),
    field('Meses en los que se escribe (vacío = todo el año)', input('meses', '', { placeholder: '1,2,3,9,10,11' })), vl);
  const b = btn('primary', 'Guardar ficha'); b.type = 'submit'; f.append(b);
  const rellenar = (slug, x) => { f.slug.value = slug; f.nombre.value = x.nombre || ''; f.producto.value = x.producto || ''; f.momento.value = x.momento || ''; f.pregunta.value = x.pregunta || ''; f.meses.value = (x.meses || []).join(','); v.checked = !!x.video; d.open = true; f.scrollIntoView({ block: 'nearest' }); };
  f.addEventListener('submit', (e) => { e.preventDefault(); const fd = new FormData(f); fd.set('video', v.checked ? '1' : '0'); accion('email_nicho', fd, 'Ficha guardada.', b); });
  d.append(list, f); return d;
}
function tarjetaLista() {
  const P = S.prospectos, wrap = el('div', 'pe-lista');
  const chips = el('div', 'pb-chips');
  [['', 'Todos'], ['pendiente', 'En cola'], ['enviado', 'Enviados'], ['recordado', 'Recordados'], ['interesado', 'Quieren el vídeo'], ['respondio', 'Respondieron'], ['baja', 'Bajas'], ['rebote', 'Rebotes'], ['descartado', 'Descartados'], ['error', 'Revisar']]
    .forEach(([k, l]) => { const n = k ? P.filter((p) => p.estado === k).length : P.length; if (k && !n) return; const c = el('button', 'pb-chip' + (ui.estado === k ? ' on' : '')); c.type = 'button'; c.append(el('b', null, N(n)), el('small', null, l)); c.addEventListener('click', () => { ui.estado = k; ui.limit = 150; draw(); }); chips.append(c); });
  const filtros = el('div', 'pb-filters');
  const q = input('q', ui.q, { type: 'search', placeholder: 'Buscar empresa, email, ciudad, motivo…' }); q.addEventListener('input', () => { clearTimeout(q.t); q.t = setTimeout(() => { ui.q = q.value.trim().toLowerCase(); ui.limit = 150; drawLista(list); }, 150); });
  const g = el('div', 'grow'); g.append(q); filtros.append(g);
  const sel = el('select'); sel.add(new Option('Todos los nichos', '')); [...new Set(P.map((p) => p.nicho).filter(Boolean))].forEach((n) => sel.add(new Option(n, n))); sel.value = ui.nicho; sel.addEventListener('change', () => { ui.nicho = sel.value; drawLista(list); }); filtros.append(sel);
  const list = el('div', 'pb-list');
  wrap.append(chips, filtros, list); drawLista(list); return wrap;
}
function drawLista(list) {
  list.textContent = '';
  const rows = S.prospectos.filter((p) => (!ui.estado || p.estado === ui.estado) && (!ui.nicho || p.nicho === ui.nicho)
    && (!ui.q || [p.empresa, p.email, p.ciudad, p.motivo, p.nicho, p.lote].join(' ').toLowerCase().includes(ui.q)));
  if (!rows.length) { list.append(el('div', 'pb-card pb-empty', S.prospectos.length ? 'Nada con estos filtros.' : 'Aún no hay prospectos de email. Llegarán del chat del Scrapper (CSV con email, origen y motivo real).')); return; }
  rows.slice(0, ui.limit).forEach((p) => list.append(fila(p)));
  if (rows.length > ui.limit) { const m = el('div', 'pb-more'); m.append(btn('ghost', `Ver más (${N(rows.length - ui.limit)})`, () => { ui.limit += 150; drawLista(list); })); list.append(m); }
}
function fila(p) {
  const r = el('div', 'pb-row pe-row');
  const who = el('div');
  const emp = el('div', 'emp', p.empresa || p.email); emp.append(el('span', null, [p.nicho, p.ciudad].filter(Boolean).join(' · ')));
  const meta = el('div', 'meta'); meta.append(el('span', null, p.email), el('span', 'sep', '·'), el('span', null, (S.senales[p.senal] || [p.senal])[0]));
  if (p.error) meta.append(el('span', 'sep', '·'), el('span', 'err', p.error));
  who.append(emp, meta);
  if (p.motivo) who.append(el('div', 'pe-motivo', '«' + p.motivo + '»'));
  const ult = (S.porP.get(p.id) || []).find((m) => m.sentido === 'entra'); if (ult) who.append(el('div', 'pe-resp', '↩ ' + ult.texto));
  const der = el('div', 'r'); der.append(badge(p.estado), el('span', 'age', p.respondido_at ? 'Respondió ' + hace(parse(p.respondido_at)) : p.enviado1_at ? 'Escrito ' + hace(parse(p.enviado1_at)) : 'Añadido ' + hace(parse(p.created_at))));
  const acts = el('div', 'pe-acts');
  if (p.paso < 2 && !['baja', 'rebote'].includes(p.estado)) acts.append(btn('ghost', 'Vista previa', (e) => vista(p, e.currentTarget)));
  if (p.estado === 'pendiente') acts.append(btn('ghost', 'Descartar', (e) => accion('email_estado', { id: p.id, estado: 'descartado' }, 'Descartado.', e.currentTarget)));
  if (['descartado', 'error'].includes(p.estado) && p.paso === 0) acts.append(btn('ghost', 'A la cola', (e) => accion('email_estado', { id: p.id, estado: 'pendiente' }, 'Vuelve a la cola.', e.currentTarget)));
  if (['respondio'].includes(p.estado)) acts.append(btn('ghost', 'Quiere el vídeo', (e) => accion('email_estado', { id: p.id, estado: 'interesado' }, 'Marcado.', e.currentTarget)));
  if (p.estado !== 'baja') acts.append(btn('danger', 'Baja', (e) => { if (confirm('¿Baja para siempre de ' + p.email + '? Tampoco recibirá WhatsApp.')) accion('email_estado', { id: p.id, estado: 'baja' }, 'Baja aplicada.', e.currentTarget); }));
  der.append(acts);
  r.append(el('div', 'pb-avatar', (p.empresa || p.email).slice(0, 2).toUpperCase()), who, der);
  return r;
}
function vista(p, b) {
  accion('email_vista', { id: p.id }, null, b).then((j) => {
    if (!j) return;
    const ov = el('div', 'pe-modal'); const c = el('div', 'pb-card');
    c.append(el('h2', null, j.paso === 1 ? 'Primer email (vista previa, no se envía)' : 'Recordatorio (vista previa)'));
    if (j.msg) { c.append(el('div', 'pe-asunto', 'Asunto: ' + j.msg.asunto), el('pre', 'pe-pre', j.msg.texto)); }
    const pr = el('div', 'pe-qa'); (j.problemas || []).length ? j.problemas.forEach((x) => pr.append(el('div', 'err', '✗ ' + x))) : pr.append(el('div', 'ok', '✓ Pasa la comprobación previa'));
    c.append(pr, btn('', 'Cerrar', () => ov.remove()));
    ov.append(c); ov.addEventListener('click', (e) => { if (e.target === ov) ov.remove(); }); document.body.append(ov);
  });
}
function tarjetaAjustes() {
  const d = el('details', 'pb-histbox pe-det'); const c = S.cfg;
  d.append(el('summary', null, `Ajustes · tope ${c.limite_max}/día · escalón ${c.escalon + 1} de ${S.escalones.length} (${S.escalones[c.escalon]}/día)`));
  const f1 = el('form', 'pe-form');
  f1.append(field('Tope de emails al día (máx. 50)', input('limite_max', c.limite_max, { type: 'number', min: 0, max: 50 })),
    field('Horario (lun–vie)', input('ventanas', (c.ventanas || []).map((v) => v.join('-')).join(', '))),
    el('p', 'note', `La subida es automática: ${S.escalones.join(' → ')} al día, un escalón por semana si la anterior salió limpia (rebotes < 2 %, sin quejas). Nada en agosto, del 20/12 al 7/1, Semana Santa ni festivos.`));
  const b1 = btn('primary', 'Guardar'); b1.type = 'submit'; f1.append(b1);
  f1.addEventListener('submit', (e) => { e.preventDefault(); accion('email_ajustes', new FormData(f1), 'Ajustes guardados.', b1); });
  const f2 = el('form', 'pe-form');
  const pl = el('textarea'); pl.name = 'plantilla'; pl.value = c.plantilla; pl.rows = 12;
  const re = el('textarea'); re.name = 'recordatorio'; re.value = c.recordatorio; re.rows = 4;
  const as = el('textarea'); as.name = 'asuntos'; as.value = (c.asuntos || []).join('\n'); as.rows = 3;
  f2.append(field('Plantilla del primer email', pl), field('Recordatorio (mismo hilo, a los 3 días laborables)', re), field('Asuntos (uno por línea)', as),
    el('p', 'note', 'Huecos: [nombre] [motivo] [pregunta] [momento] [producto] [empresa] [empresa_corta]. {a|b} = variante al azar. Obligatorio: motivo, pregunta, «Daniel» y «no vuelvo a escribirte». Sin enlaces, precios, «gratis», IA ni web.'));
  const b2 = btn('primary', 'Guardar plantilla'); b2.type = 'submit'; f2.append(b2);
  f2.addEventListener('submit', (e) => { e.preventDefault(); accion('email_plantilla', new FormData(f2), 'Plantilla guardada.', b2); });
  d.append(f1, f2); return d;
}

/* ============ tarjeta en Agentes ============ */
function tarjetaAgente() {
  const box = $('#pe-agente'); if (!box) return; box.textContent = '';
  const a = S.agente, [s, t] = AGENTE[a.estado] || ['off', a.estado || 'Sin arrancar'];
  const vivo = a.latido_at && (S.ahora - parse(a.latido_at)) < 20 * 60000;
  const card = el('div', 'pb-card pe-agent');
  const top = el('div', 'pe-agent-top');
  const info = el('div');
  info.append(el('b', 'pe-nm', 'Agente de email'));
  const st = el('div', 'pe-st'); const dot = el('i', 'pb-live'); dot.dataset.s = vivo ? s : (a.estado === 'sin_configurar' ? 'off' : 'bad');
  const pill = el('span', 'pe-state'); pill.append(dot, vivo || a.estado === 'sin_configurar' ? t : 'Sin señal del cron'); st.append(pill, el('span', null, a.detalle || ''));
  info.append(st, el('div', 'muted', `Buzón: ${a.buzon || '—'} · Último latido: ${hace(parse(a.latido_at))} · Hoy ${a.enviados_hoy}/${a.limite} · ${a.abierta ? 'en horario' : 'próximo tramo ' + fecha(parse(a.proxima))}`));
  const acts = el('div', 'pe-acts');
  acts.append(a.pausado ? btn('primary', 'Reanudar', (e) => accion('email_pausa', { pausado: '0' }, 'Agente de email reanudado.', e.currentTarget))
    : btn('', 'Pausar', (e) => accion('email_pausa', { pausado: '1' }, 'Agente de email en pausa.', e.currentTarget)),
  btn('ghost', 'Ver prospectos', () => { const b = $('#pb-tabs button[data-page="email"]'); if (b) b.click(); }));
  top.append(info, acts);
  const s7 = S.salud7;
  const stats = el('div', 'pe-stats');
  [['Enviados 7 días', N(s7.enviados)], ['Respuestas', N(s7.respuestas)], ['Quieren vídeo', N(s7.interesados)], ['Rebotes', s7.rebotes_pct + ' %'], ['Quejas', N(s7.quejas)]]
    .forEach(([l, v]) => { const x = el('div'); x.append(el('small', null, l), el('b', null, v)); stats.append(x); });
  card.append(top, queHace(), stats, volumen(), registro()); box.append(card);
}

/* Qué hace el agente, en una frase que se lee de un vistazo. */
function queHace() {
  const c = S.cfg, v = (c.ventanas || []).map((x) => x.join('–')).join(' y ');
  const listos = Object.entries(c.nichos || {}).filter(([, f]) => f.video).map(([k]) => k);
  const p = el('p', 'pe-que');
  p.textContent = `Cada día laborable (${v}) escribe a un máximo de ${S.agente.limite} empresas, una a una y con pausas. `
    + `A quien no contesta le manda un único recordatorio a los ${c.recordatorio_dias || 3} días laborables, en la misma conversación, y no vuelve a escribirle. `
    + (listos.length ? `Nichos listos: ${listos.join(', ')}.` : 'Aún no hay ningún nicho listo (falta la ficha o el vídeo): no envía nada.');
  return p;
}

/* Volumen de cada día: primeros emails, recordatorios, respuestas y bloqueos (30 días). */
function volumen() {
  const w = el('div', 'pe-vol');
  w.append(el('h2', null, 'Volumen por día · 30 días'));
  const SERIES = [['primeros', 'Primeros emails', 'var(--violet)'], ['recordatorios', 'Recordatorios', 'var(--cyan)'], ['respuestas', 'Respuestas', 'var(--lime)'], ['bloqueos', 'Bloqueados por la revisión', 'var(--slate)']];
  const val = {}; (S.volumen || []).forEach((r) => { (val[r.d] = val[r.d] || {})[r.tipo] = Number(r.n); });
  const dias = []; for (let i = 29; i >= 0; i--) { const d = new Date(S.ahora); d.setDate(d.getDate() - i); dias.push(d); }
  const k = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const max = Math.max(5, ...dias.map((d) => SERIES.reduce((a, [s]) => a + ((val[k(d)] || {})[s] || 0), 0)));
  const bars = el('div', 'pb-bars');
  dias.forEach((d, i) => {
    const v = val[k(d)] || {}; const col = el('div', i === 29 ? 'hoy' : '');
    col.dataset.t = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}: ` + SERIES.map(([s, l]) => `${v[s] || 0} ${l.toLowerCase()}`).join(' · ');
    SERIES.slice().reverse().forEach(([s, , color]) => { if (v[s]) { const b = el('i'); b.style.height = (v[s] / max * 100) + '%'; b.style.background = color; b.style.borderRadius = '3px'; col.append(b); } });
    if (!SERIES.some(([s]) => v[s])) { const b = el('i'); b.style.height = '2px'; b.style.opacity = '.25'; col.append(b); }
    bars.append(col);
  });
  const ley = el('div', 'pb-legend'); SERIES.forEach(([, l, color]) => { const s = el('span'); const i = el('i'); i.style.background = color; s.append(i, l); ley.append(s); });
  const hoy = val[k(S.ahora)] || {};
  w.append(bars, ley, el('p', 'note', `Hoy: ${hoy.primeros || 0} primeros emails, ${hoy.recordatorios || 0} recordatorios, ${hoy.respuestas || 0} respuestas, ${hoy.bloqueos || 0} bloqueados. Pasa el ratón por una barra para ver el detalle del día.`));
  return w;
}

/* Registro de actividad: cada decisión del agente, como las ejecuciones de n8n. */
const TIPO_ACT = { envio: ['Envío', 'var(--violet)'], bloqueo: ['No enviado', 'var(--slate)'], respuesta: ['Respuesta', 'var(--lime)'], espera: ['En espera', 'var(--muted-2)'],
  freno: ['Freno', 'var(--red)'], error: ['Error', 'var(--amber)'], cambio: ['Cambio', 'var(--cyan)'], hito: ['Hito', 'var(--green)'] };
function registro() {
  const w = el('div', 'pe-reg');
  w.append(el('h2', null, 'Registro de actividad'), el('p', 'note', 'Todo lo que ha hecho el agente y por qué: a quién escribió, a quién no (y el motivo), qué respuestas llegaron, cuándo esperó o se frenó. Pulsa una línea para ver el detalle.'));
  const chips = el('div', 'pb-subtabs');
  [['', 'Todo']].concat(Object.entries(TIPO_ACT).map(([t, [l]]) => [t, l])).forEach(([t, l]) => {
    const b = el('button', ui.act === t || (!ui.act && !t) ? 'on' : '', l); b.type = 'button'; b.addEventListener('click', () => { ui.act = t; tarjetaAgente(); }); chips.append(b);
  });
  const list = el('div', 'pe-log');
  const filas = (S.actividad || []).filter((a) => !ui.act || a.tipo === ui.act).slice(0, 80);
  if (!filas.length) list.append(el('div', 'pb-empty', 'Sin actividad todavía.'));
  filas.forEach((a) => {
    const [l, color] = TIPO_ACT[a.tipo] || [a.tipo, 'var(--muted)'];
    const d = el('details', 'pe-log-i');
    const s = el('summary'); const chip = el('em', null, l); chip.style.setProperty('--c', color);
    s.append(el('time', null, fecha(parse(a.ts))), chip, el('span', null, a.resumen));
    d.append(s); if (a.detalle) d.append(el('pre', 'pe-pre', a.detalle));
    list.append(d);
  });
  w.append(chips, list); return w;
}

/* ============ tarjeta del agente de prospección (scraper) ============ */
function tarjetaProspeccion() {
  const box = $('#pe-prospeccion'); if (!box || !S.prospeccion) return; box.textContent = '';
  const act = S.prospeccion.actividad || [];
  const ult = act[0];
  const card = el('div', 'pb-card pe-agent');
  const top = el('div', 'pe-agent-top'); const info = el('div');
  info.append(el('b', 'pe-nm', 'Agente de prospección'));
  const st = el('div', 'pe-st'); const dot = el('i', 'pb-live');
  const reciente = ult && (S.ahora - parse(ult.ts)) < 7 * 86400000; dot.dataset.s = ult ? (reciente ? 'ok' : 'warn') : 'off';
  const pill = el('span', 'pe-state'); pill.append(dot, ult ? 'Última tirada ' + hace(parse(ult.ts)) : 'Sin tiradas registradas'); st.append(pill);
  info.append(st);
  top.append(info);
  const p = el('p', 'pe-que');
  p.textContent = 'Busca empresas del nicho (Google Maps, censos oficiales, su propia web), saca sus contactos publicados y un motivo real para escribirles, quita a quien ya está en el panel o pidió la baja, y entrega la lista a WhatsApp o email. Cada tirada queda apuntada aquí.';
  // Volumen por día: empresas entregadas (se leen del resumen de cada tirada: «… M entregadas …»)
  const porDia = {}; act.forEach((a) => { const m = /(\d+)\s+entregad/i.exec(a.resumen || ''); const d = (a.ts || '').slice(0, 10); if (m) porDia[d] = (porDia[d] || 0) + Number(m[1]); });
  const dias = []; for (let i = 29; i >= 0; i--) { const d = new Date(S.ahora); d.setDate(d.getDate() - i); dias.push(d); }
  const k = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const max = Math.max(10, ...dias.map((d) => porDia[k(d)] || 0));
  const vol = el('div', 'pe-vol'); vol.append(el('h2', null, 'Empresas entregadas por día · 30 días'));
  const bars = el('div', 'pb-bars');
  dias.forEach((d, i) => { const n = porDia[k(d)] || 0; const c = el('div', i === 29 ? 'hoy' : ''); c.dataset.t = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}: ${n} empresas entregadas`; const b = el('i'); b.style.height = n ? (n / max * 100) + '%' : '2px'; b.style.background = 'var(--green)'; if (!n) b.style.opacity = '.25'; c.append(b); bars.append(c); });
  vol.append(bars);
  const reg = el('div', 'pe-reg'); reg.append(el('h2', null, 'Registro de tiradas'));
  const list = el('div', 'pe-log');
  if (!act.length) list.append(el('div', 'pb-empty', 'El scraper aún no ha apuntado ninguna tirada en el servidor.'));
  act.slice(0, 60).forEach((a) => { const [l, color] = TIPO_ACT[a.tipo] || [a.tipo, 'var(--muted)']; const d = el('details', 'pe-log-i'); const s = el('summary'); const chip = el('em', null, l); chip.style.setProperty('--c', color); s.append(el('time', null, fecha(parse(a.ts))), chip, el('span', null, a.resumen)); d.append(s); if (a.detalle) d.append(el('pre', 'pe-pre', a.detalle)); list.append(d); });
  reg.append(list);
  card.append(top, p, vol, reg); box.append(card);
}

/* ============ ciclo ============ */
const pagina = () => document.body.dataset.page || '';
function crumb() { const c = $('#pb-crumb'); if (c && pagina() === 'email') { c.textContent = ''; c.append(el('span', null, 'Captación'), el('b', null, 'Email')); } }
function draw() {
  if (!S.loaded) return;
  const n = $('#pb-email-n'); if (n) n.textContent = N(S.prospectos.filter((p) => p.estado === 'pendiente').length);
  tarjetaAgente();
  tarjetaProspeccion();
  if (pagina() === 'email') {
    const abierto = $$('#pe-cuerpo details').map((d) => d.open);
    const foco = document.activeElement && $('#pe-cuerpo') && $('#pe-cuerpo').contains(document.activeElement) && document.activeElement.matches('input,textarea,select');
    avisos(); kpis(); if (!foco) { cuerpo(); $$('#pe-cuerpo details').forEach((d, i) => { if (abierto[i]) d.open = true; }); }
  }
}
const refrescar = () => load().then(draw).catch((e) => { if (pagina() === 'email') toast(e.message || 'No se ha podido cargar el email.', true); });
montar();
document.addEventListener('pb:page', () => { crumb(); draw(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) refrescar(); });
setInterval(() => { if (!document.hidden && ['email', 'agentes'].includes(pagina())) refrescar(); }, 60000);
// Enlace directo ?tab=email (panel.js aún no conoce esta pestaña: se abre desde aquí)
if ((window.PB_TAB || new URLSearchParams(location.search).get('tab')) === 'email') { const b = $('#pb-tabs button[data-page="email"]'); if (b) setTimeout(() => b.click(), 0); }
refrescar();
})();
