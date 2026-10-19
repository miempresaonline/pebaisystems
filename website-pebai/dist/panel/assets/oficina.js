/* PEBAI · Panel — Automático › Agentes: la oficina 3D de los agentes.
   Datos reales en index.php?oficina=1 (ver _oficina_panel.php). Three.js se carga solo al abrir la sección.
   Navegación con clics: sala o agente → la cámara va a él; clic fuera, Esc o × → vista general.
   La distribución sale de DEPTS: más departamentos o más agentes por sala se colocan solos.
   Todo texto que llega de los agentes se pinta con textContent o escapado: nunca HTML de los datos. */
const app = document.getElementById('pb-app');
const wrap = document.getElementById('pb-of');
if (app && wrap) {
const PAGE = 'agentes';
const BASE = app.dataset.base;
const $ = (s, r) => (r || document).querySelector(s);
const S = { csrf: app.dataset.csrf, agentes: [], autos: [], hist: [], verTodo: false };
const ST = {
  trabajando: ['#3DDC84', 'Trabajando'], espera: ['#FFB547', 'En espera'], dormido: ['#8E91A8', 'Durmiendo'],
  error: ['#FF5E6C', 'Con error'], apagado: ['#5C5F73', 'Apagado'], pausado: ['#8E84FF', 'En pausa'],
};
/* Departamentos de la oficina, en orden. Para añadir uno basta con ponerlo aquí (y sus agentes en el servidor). */
const DEPTS = [
  { id: 'captacion', nombre: 'Captación', color: '#B7FF3C', glifo: 'iman', activo: true, objetivo: 'Encontrar empresas y abrir conversación con ellas' },
  { id: 'embudo', nombre: 'Embudo', color: '#8E84FF', glifo: 'embudo', activo: false, objetivo: 'Llevar cada solicitud hasta la sesión técnica' },
  { id: 'redes', nombre: 'Redes', color: '#E25CFF', glifo: 'red', activo: false, objetivo: 'Publicar contenido que traiga solicitudes' },
  { id: 'operaciones', nombre: 'Operaciones', color: '#3FD5FF', glifo: 'caja', activo: false, objetivo: 'Proyectos y entregas a clientes' },
];
const FONDO = { scraper: '#1a7f45', whatsapp: '#1fae58', email: '#c5372b', fases: '#4b40c9', recordatorios: '#4b40c9', calcom: '#4b40c9' };
const GLIFOS = {
  iman: 'M6 3v8a6 6 0 0 0 12 0V3M6 7.5h4M14 7.5h4', embudo: 'M3 4h18l-7 8.5V19l-4 2v-8.5z',
  red: 'M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4',
  caja: 'M21 8 12 3 3 8v8l9 5 9-5zM3 8l9 5 9-5M12 13v8',
  flow: 'M3 3h7v7H3zM14 14h7v7h-7zM10 6.5h3.5a3 3 0 0 1 3 3V14', bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0', cal: 'M3 5h18v16H3zM16 3v4M8 3v4M3 10h18' };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const brand = (k) => (window.PB_ICONS && window.PB_ICONS.brands && window.PB_ICONS.brands[k]) ? window.PB_ICONS.brands[k].d : null;
const N = (n) => new Intl.NumberFormat('es-ES').format(n || 0);
const hora = (ts) => String(ts || '').slice(11, 16);
const toast = (m, err) => { const t = $('#pb-toast'); if (!t) return; $('span', t).textContent = m; t.classList.toggle('err', !!err); t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 3200); };
/* color de cada estado en la mesa (alfombrilla, tira, foco, línea del suelo, ojos): siempre el mismo significado */
const COL_EST = { trabajando: '#3DDC84', espera: '#FFB547', dormido: '#5C5F73', error: '#FF5E6C', apagado: '#2A2D3E' };
const vis = (st) => st === 'pausado' ? 'dormido' : st;
const enPagina = () => document.body.dataset.page === PAGE && !document.body.classList.contains('pb-ag-ajustes');

/* ============ datos ============ */
async function cargar() {
  const r = await fetch(BASE + '?oficina=1', { credentials: 'same-origin', cache: 'no-store' });
  if (r.status === 401) { location.reload(); return false; }
  let j; try { j = await r.json(); } catch (e) { throw new Error('La oficina no ha respondido bien.'); }
  if (!j.ok) throw new Error(j.error || 'No se ha podido cargar la oficina.');
  /* en la oficina solo salen los bots de verdad (los de los departamentos con agentes) */
  S.agentes = j.agentes.filter((a) => DEPTS.some((d) => d.activo && d.id === a.dept)); S.autos = j.agentes.filter((a) => a.dept === 'embudo'); S.csrf = j.csrf; S.cargado = Date.now(); return true;
}
async function accion(action, fields, ok, btn) {
  if (btn) btn.disabled = true;
  try {
    const r = await fetch(BASE, { method: 'POST', credentials: 'same-origin', headers: { 'Accept': 'application/json' }, body: new URLSearchParams({ action, csrf: S.csrf, ...fields }) });
    if (r.status === 401) { location.reload(); return; }
    const j = await r.json().catch(() => ({ ok: false }));
    if (!j.ok) throw new Error(j.error || 'No se ha podido hacer.');
    toast(ok); await refrescar();
  } catch (e) { toast(e.message, true); if (btn) btn.disabled = false; }
}
const ag = (id) => S.agentes.find((a) => a.id === id);
const agsDe = (id) => S.agentes.filter((a) => a.dept === id);
const pendientes = () => {
  const out = [];
  S.agentes.filter((a) => a.st === 'error').forEach((a) => out.push({ a, txt: a.motivo, err: true }));
  S.agentes.forEach((a) => (a.necesita || []).forEach((n) => out.push({ a, txt: n, err: false })));
  return out;
};
const estadoDept = (id) => { const a = agsDe(id); return a.some((x) => x.st === 'error') ? 'error' : a.some((x) => (x.necesita || []).length) ? 'aviso' : 'ok'; };

/* ============ capa de interfaz ============ */
const hud = $('#pb-of-hud'), side = $('#pb-of-side'), sideIn = $('#pb-of-sidein');
$('#pb-of-x').onclick = (e) => { e.stopPropagation(); cerrar(); };
function tileHtml(a, cls) {
  const d = a.icono && brand(a.icono);
  return `<span class="${cls || 'ico'}" style="background:${FONDO[a.id] || '#3a3d52'}">` + (d ? `<svg viewBox="0 0 24 24"><path fill="#fff" d="${d}"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${GLIFOS[a.glifo] || GLIFOS.flow}"/></svg>`) + '</span>';
}
function pintaHud() {
  const pend = pendientes(), err = pend.filter((p) => p.err).length;
  const abierto = !!hud.querySelector('.pb-of-todo.abierto');
  hud.replaceChildren();
  const c = document.createElement('div'); c.className = 'pb-of-todo' + (pend.length ? '' : ' ok') + (abierto && pend.length ? ' abierto' : '');
  const col = err ? '#FF5E6C' : pend.length ? '#FFB547' : '#3DDC84';
  c.innerHTML = `<button type="button" class="h"><i class="vivo"></i><span class="dir">En directo</span><span class="sep"></span><span class="est" style="--c:${col}"><i></i>${pend.length ? (pend.length === 1 ? '1 aviso' : pend.length + ' avisos') : 'Todo en orden'}</span>${pend.length ? '<svg class="pl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>' : ''}</button><div class="lista"></div>`;
  const lista = c.querySelector('.lista');
  if (pend.length) c.querySelector('.h').onclick = (ev) => { ev.stopPropagation(); c.classList.toggle('abierto'); };
  pend.slice(0, 5).forEach(({ a, txt, err: e }) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'it' + (e ? ' err' : '');
    b.innerHTML = tileHtml(a, 't') + `<span class="x"><b>${esc(a.nombre)}</b><span>${esc(txt)}</span></span><svg class="go" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m9 6 6 6-6 6"/></svg>`;
    b.onclick = (ev) => { ev.stopPropagation(); c.classList.remove('abierto'); abrirAgente(a.id); }; lista.append(b);
  });
  hud.append(c); horaHud();
}
/* "Actualizado hace…" al pasar el ratón por la píldora */
function horaHud() { const sg = Math.round((Date.now() - (S.cargado || Date.now())) / 1000); hud.title = 'Datos de ahora mismo · actualizado ' + (sg < 10 ? 'hace un momento' : sg < 60 ? `hace ${sg} s` : `hace ${Math.round(sg / 60)} min`); }
setInterval(horaHud, 10000);

const q = (t, cuerpo) => `<div class="pb-of-q"><h4>${t}</h4>${cuerpo}</div>`;
function abrirAgente(id) {
  const a = ag(id); if (!a) return;
  const d = DEPTS.find((x) => x.id === a.dept); enfocarAgente(a.id);
  const [c, txt] = ST[a.st] || ST.espera;
  const pct = a.cupo ? Math.min(100, Math.round(a.hoy / a.cupo * 100)) : 0;
  const hist = (a.actividad || []).slice(0, S.verTodo ? 30 : 6);
  sideIn.innerHTML = (S.agentes.length > 1 ? '<div class="pb-of-nav"><button type="button" data-d="-1" aria-label="Agente anterior" title="Anterior (←)">‹</button><button type="button" data-d="1" aria-label="Agente siguiente" title="Siguiente (→)">›</button></div>' : '')
    + `<div class="k">${esc(d.nombre)}</div><h2>${tileHtml(a)}${esc(a.nombre)}</h2><div class="rol">${esc(a.rol || '')}</div>
    <div class="pb-of-state" style="--c:${c}"><i></i><div><b>${txt}</b><span>${esc(a.motivo)}</span></div></div>
    <div class="pb-of-acts" id="pb-of-acts"></div>
    ${a.codigo ? `<div class="pb-of-code"><small>Código para vincular WhatsApp</small><b>${esc(String(a.codigo).replace(/[^A-Z0-9]/gi, '').toUpperCase().replace(/(.{4})(?=.)/g, '$1-'))}</b><span>En el móvil: WhatsApp › Dispositivos vinculados › Vincular con el número de teléfono.</span></div>` : ''}
    <div class="pb-of-qa">
    ${q('Hoy', `<p><b class="big">${N(a.hoy)}</b> ${esc(a.unidad)}${a.cupo ? ` de ${a.cupo} posibles` : ''}</p>${a.cupo ? `<div class="bar" style="--c:${d.color}"><i data-w="${pct}%"></i></div>` : ''}`)}
    ${q('Lo último que hizo', a.ultima ? `<p>${esc(a.ultima.txt)}</p><p class="sub">${esc(a.ultima.hace)}</p>` : '<p>Todavía no ha hecho nada.</p>')}
    ${(a.necesita || []).length ? q('Necesita de vosotros', a.necesita.map((n) => `<p class="warn">${esc(n)}</p>`).join('')) : ''}
    ${q('¿Ha fallado algo?', (a.errores || []).length ? a.errores.map((e) => `<p class="bad"><b>${esc(hora(e.ts))}</b> · ${esc(e.txt)}</p>`).join('') : '<p class="ok">No, nada en las últimas 24 horas.</p>')}
    ${a.proxima ? q('Qué hará ahora', `<p>${esc(a.proxima)}</p>`) : ''}
    ${(a.datos || []).length ? q('Datos', `<dl>${a.datos.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`) : ''}
    ${hist.length ? q('Historial', hist.map((e) => `<div class="pb-of-ev"><time>${esc(e.hace)}</time><span>${esc(e.txt)}</span></div>`).join('') + ((a.actividad || []).length > 6 ? `<button class="pb-of-more" id="pb-of-more" type="button">${S.verTodo ? 'Ver menos' : 'Ver todo el historial'}</button>` : '')) : ''}
    </div>`;
  const acts = $('#pb-of-acts');
  const boton = (cls, t, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'pb-of-btn ' + cls; b.textContent = t; b.onclick = (e) => { e.stopPropagation(); fn(b); }; acts.append(b); };
  const A = a.acciones || {};
  if (A.pausa) boton(a.pausado ? 'primary' : '', a.pausado ? 'Reanudar' : 'Pausar', (b) => accion(A.pausa, { pausado: a.pausado ? '0' : '1' }, a.pausado ? `${a.nombre} reanudado.` : `${a.nombre} en pausa: no enviará nada.`, b));
  if (A.ajustes) boton('ghost', 'Horario, cupo y mensajes', () => { document.body.classList.add('pb-ag-ajustes'); document.dispatchEvent(new CustomEvent('pb:agview')); setTimeout(() => { const t = document.getElementById('pb-ag-wa'); if (t) t.scrollIntoView({ behavior: 'smooth' }); }, 60); });
  if (A.ir) boton('ghost', A.ir === 'email' ? 'Ver su lista de empresas' : 'Ver las empresas', () => { const b = document.querySelector(`#pb-tabs button[data-page="${A.ir}"]`); if (b) b.click(); });
  if (!acts.childElementCount) acts.remove();
  sideIn.querySelectorAll('.pb-of-nav button').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); vecino(+b.dataset.d); }; });
  const more = $('#pb-of-more'); if (more) more.onclick = (e) => { e.stopPropagation(); S.verTodo = !S.verTodo; abrirAgente(a.id); };
  mostrar();
}
function abrirSala(d) {
  enfocarSala(d);
  if (!d.activo) {
    const autos = d.id === 'embudo' ? S.autos : [];
    sideIn.innerHTML = `<div class="k">Departamento</div><h2>${esc(d.nombre)}</h2><div class="rol">${esc(d.objetivo)}</div><div class="pb-of-state" style="--c:#5C5F73"><i></i><div><b>Sin agentes todavía</b><span>Cuando montemos un bot para este departamento aparecerá aquí, conectado al núcleo.</span></div></div>`
      + (autos.length ? '<div class="pb-of-qa">' + q('Lo que ya funciona solo', autos.map((a) => `<div class="pb-of-auto"><div class="h">${tileHtml(a, 't')}<b>${esc(a.nombre)}</b><span><i style="background:${(ST[a.st] || ST.espera)[0]}"></i>${a.st === 'espera' ? 'Atento' : (ST[a.st] || ST.espera)[1]}</span></div><p>${esc(a.motivo)}</p>${(a.necesita || []).map((n) => `<p class="warn">${esc(n)}</p>`).join('')}</div>`).join('')) + '</div>' : '');
    mostrar(); return;
  }
  const lista = agsDe(d.id); const e = estadoDept(d.id);
  const pend = pendientes().filter((p) => p.a.dept === d.id);
  sideIn.innerHTML = `<div class="k">Departamento</div><h2>${esc(d.nombre)}</h2><div class="rol">${esc(d.objetivo)}</div>
    <div class="pb-of-state" style="--c:${e === 'error' ? '#FF5E6C' : e === 'aviso' ? '#FFB547' : '#3DDC84'}"><i></i><div><b>${e === 'error' ? 'Hay un error' : e === 'aviso' ? 'Funciona, pero os necesita' : 'Todo en orden'}</b><span>${lista.filter((a) => a.st === 'trabajando').length} de ${lista.length} agentes trabajando ahora</span></div></div>
    <div class="pb-of-qa">
    ${pend.length ? q('Necesita de vosotros', pend.map((p) => `<p class="${p.err ? 'bad' : 'warn'}"><b>${esc(p.a.nombre)}</b>: ${esc(p.txt)}</p>`).join('')) : ''}
    ${q('Agentes', lista.map((a) => `<div class="pb-of-row" data-id="${esc(a.id)}">${tileHtml(a, 't')}<b>${esc(a.nombre)}</b><span><i style="background:${(ST[a.st] || ST.espera)[0]}"></i>${(ST[a.st] || ST.espera)[1]}</span></div>`).join(''))}
    </div>`;
  sideIn.querySelectorAll('.pb-of-row').forEach((r) => r.addEventListener('click', () => abrirAgente(r.dataset.id)));
  mostrar();
}
function abrirNucleo() {
  foco = { nucleo: true }; wrap.classList.add('foco');
  if (G) { const panel = wrap.clientWidth > 760 ? 2.4 : 0; G.volar(new G.THREE.Vector3(panel, 8.2, 13.5), new G.THREE.Vector3(panel, 2.2, 0)); }
  const pend = pendientes(), ne = pend.filter((p) => p.err).length;
  const trab = S.agentes.filter((a) => a.st === 'trabajando').length;
  const c = ne ? '#FF5E6C' : pend.length ? '#FFB547' : '#3DDC84';
  sideIn.innerHTML = `<div class="k">El núcleo</div><h2>PEBAI</h2><div class="rol">La IA que conecta todos los departamentos: recibe lo que hace cada bot y le devuelve el trabajo.</div>
    <div class="pb-of-state" style="--c:${c}"><i></i><div><b>${ne ? (ne === 1 ? '1 agente con error' : ne + ' agentes con error') : pend.length ? 'Funciona, pero os necesita' : 'Todo en orden'}</b><span>${trab} de ${S.agentes.length} bots trabajando ahora</span></div></div>
    <div class="pb-of-qa">
    ${q('Departamentos', DEPTS.map((d) => { const l = agsDe(d.id); return `<div class="pb-of-row" data-sala="${esc(d.id)}"><i style="background:${d.color}"></i><b>${esc(d.nombre)}</b><span>${d.activo ? (l.length === 1 ? '1 bot' : l.length + ' bots') : 'Sin agentes aún'}</span></div>`; }).join(''))}
    ${pend.length ? q('Necesita de vosotros', pend.map((p) => `<p class="${p.err ? 'bad' : 'warn'}"><b>${esc(p.a.nombre)}</b>: ${esc(p.txt)}</p>`).join('')) : ''}
    ${q('Pregúntale', '<p>Escribe abajo cualquier duda sobre los agentes y PEBAI te responde con los datos de ahora mismo.</p><div class="pb-of-acts"><button type="button" class="pb-of-btn primary" id="pb-of-preg">Preguntar a PEBAI</button></div>')}
    </div>`;
  sideIn.querySelectorAll('.pb-of-row').forEach((r) => r.addEventListener('click', () => abrirSala(DEPTS.find((d) => d.id === r.dataset.sala))));
  $('#pb-of-preg').onclick = (e) => { e.stopPropagation(); qIn.focus(); };
  mostrar();
}
function vecino(dir) {
  if (!foco || !foco.agente || S.agentes.length < 2) return;
  const i = S.agentes.findIndex((a) => a.id === foco.agente);
  abrirAgente(S.agentes[(i + dir + S.agentes.length) % S.agentes.length].id);
}
function mostrar() { side.classList.add('on'); side.scrollTop = 0; setTimeout(() => side.querySelectorAll('.bar i').forEach((b) => { b.style.width = b.dataset.w; }), 300); }
function cerrar() { side.classList.remove('on'); foco = null; S.verTodo = false; wrap.classList.remove('foco'); if (G) G.volar(G.HOME.p, G.HOME.t); }
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && enPagina() && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { if (cine) alternarCine(); else cerrar(); } });
const ayuda = document.createElement('div'); ayuda.className = 'pb-of-ayuda';
ayuda.innerHTML = '<button type="button" class="b" aria-label="Atajos y leyenda" title="Atajos y leyenda (?)">?</button><div class="c">'
  + '<h5>Colores</h5>' + ['trabajando', 'espera', 'dormido', 'error', 'apagado'].map((k) => `<div class="l"><i style="background:${ST[k][0]}"></i>${ST[k][1]}</div>`).join('')
  + '<h5>Atajos</h5>' + [['1 – 4', 'Ir a cada sala'], ['P', 'El núcleo'], ['← →', 'Agente anterior / siguiente'], ['/', 'Preguntar a PEBAI'], ['Esc', 'Volver a la vista general'], ['H', 'Ocultar la interfaz'], ['C', 'Modo cine (para grabar)']].map(([k, t]) => `<div class="k"><kbd>${k}</kbd><span>${t}</span></div>`).join('')
  + '</div>';
wrap.append(ayuda);
ayuda.addEventListener('click', (e) => e.stopPropagation());
ayuda.querySelector('.b').onclick = () => ayuda.classList.toggle('on');
function alternarCine() {
  cine = !cine; cineAng = 0; wrap.classList.toggle('cine', cine); document.body.classList.toggle('pb-of-cine', cine);
  if (cine) { side.classList.remove('on'); foco = null; wrap.classList.remove('foco'); ayuda.classList.remove('on'); toast('Modo cine: pulsa C o Esc para salir'); }
  else if (G) G.volar(G.HOME.p, G.HOME.t);
}
document.addEventListener('keydown', (e) => {
  if (!enPagina() || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (cine && k !== 'c' && k !== 'Escape') { alternarCine(); return; }
  if (/^[1-9]$/.test(k) && DEPTS[+k - 1]) abrirSala(DEPTS[+k - 1]);
  else if (k === '0') cerrar();
  else if (k === 'p') abrirNucleo();
  else if (k === '/') { e.preventDefault(); e.stopImmediatePropagation(); abrirAsk(); }
  else if (k === 'ArrowRight') vecino(1);
  else if (k === 'ArrowLeft') vecino(-1);
  else if (k === 'h') { const l = wrap.classList.toggle('limpio'); if (l) toast('Interfaz oculta: pulsa H para verla'); }
  else if (k === 'c') alternarCine();
  else if (k === '?') ayuda.classList.toggle('on');
  else return;
  e.stopImmediatePropagation();
}, true); /* en captura: en la oficina estos atajos van antes que los generales del panel (p. ej. "/" busca en Solicitudes) */

/* ============ pregunta a PEBAI ============ */
const ans = $('#pb-of-ans'), qIn = $('#pb-of-q'), qBtn = $('#pb-of-askf button[type=submit]'), sug = $('#pb-of-sug');
const SUG = [['alert-triangle', '¿Ha fallado algo hoy?'], ['list-check', '¿Qué tengo que hacer yo?'], ['chart-bar', '¿Qué han hecho hoy los agentes?'], ['clock', '¿Cuándo vuelve a escribir WhatsApp?']];
const SVGI = { 'alert-triangle': '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>', 'list-check': '<path d="m3 6 2 2 4-4M3 14l2 2 4-4M13 6h8M13 14h8M13 19h8"/>', 'chart-bar': '<path d="M3 3v18h18M8 17v-4M13 17V9M18 17V5"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>' };
sug.innerHTML = '<div class="h">Preguntas rápidas</div>' + SUG.map(([i, t]) => `<button type="button" data-q="${esc(t)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${SVGI[i]}</svg>${esc(t)}</button>`).join('');
sug.addEventListener('mousedown', (e) => { const b = e.target.closest('button'); if (b) { e.preventDefault(); preguntar(b.dataset.q); } });
const pintaSug = () => { sug.classList.toggle('on', document.activeElement === qIn && !qIn.value.trim() && !ans.classList.contains('on')); };
qIn.addEventListener('focus', pintaSug); qIn.addEventListener('input', pintaSug); qIn.addEventListener('blur', () => setTimeout(pintaSug, 120));
function formatear(t) {
  const lines = esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').split(/\n+/);
  let html = '', ul = false;
  lines.forEach((l) => {
    const m = l.match(/^\s*(?:[-*•]|\d+\.)\s+(.*)/);
    if (m) { if (!ul) { html += '<ul>'; ul = true; } html += '<li>' + m[1] + '</li>'; }
    else { if (ul) { html += '</ul>'; ul = false; } if (l.trim()) html += '<p>' + l + '</p>'; }
  });
  return html + (ul ? '</ul>' : '');
}
/* la respuesta aparece palabra a palabra, como si PEBAI la escribiera (rápido: ~1,5 s una respuesta normal) */
function escribir(body, txt) {
  const trozos = String(txt).split(/(\s+)/);
  const paso = Math.max(1, Math.round(trozos.length / 70));
  let i = 0;
  return new Promise((fin) => {
    const h = setInterval(() => {
      i = Math.min(trozos.length, i + paso);
      body.innerHTML = formatear(trozos.slice(0, i).join('')) + (i < trozos.length ? '<span class="cur"></span>' : '');
      const last = body.lastElementChild; if (last && i < trozos.length && last.classList.contains('cur')) { const todos = body.querySelectorAll('p, li'), pp = todos[todos.length - 1]; if (pp) pp.append(last); }
      ans.scrollTop = ans.scrollHeight;
      if (i >= trozos.length) { clearInterval(h); fin(); }
    }, 22);
  });
}
async function preguntar(t) {
  t = String(t || '').trim(); if (!t) { qIn.focus(); return; }
  sug.classList.remove('on');
  ans.classList.add('on'); ans.innerHTML = '';
  const head = document.createElement('div'); head.className = 'hd';
  const img = document.createElement('img'); img.src = BASE + 'assets/pebai-mark.png'; img.alt = '';
  const qd = document.createElement('span'); qd.textContent = t;
  const x = document.createElement('button'); x.type = 'button'; x.className = 'cerrar'; x.setAttribute('aria-label', 'Cerrar respuesta'); x.textContent = '×';
  x.onclick = (e) => { e.stopPropagation(); ans.classList.remove('on'); };
  head.append(img, qd, x);
  const body = document.createElement('div'); body.className = 'bd'; body.innerHTML = '<div class="pens"><span>PEBAI está mirando los departamentos</span><i></i><i></i><i></i></div>';
  ans.append(head, body);
  qBtn.disabled = true; qIn.value = ''; pensando = true; ans.classList.add('pensando');
  const pasos = ['PEBAI está mirando los departamentos', 'Leyendo lo que han hecho los agentes', 'Preparando la respuesta'];
  let pi = 0; const rota = setInterval(() => { const sp = $('.pens span', body); if (sp) sp.textContent = pasos[++pi % pasos.length]; }, 1400);
  const minimo = new Promise((r) => setTimeout(r, 900));
  try {
    const r = await fetch(BASE, { method: 'POST', credentials: 'same-origin', headers: { 'Accept': 'application/json' }, body: new URLSearchParams({ action: 'oficina_preguntar', csrf: S.csrf, q: t, h: JSON.stringify(S.hist.slice(-4)) }) });
    if (r.status === 401) { location.reload(); return; }
    const j = await r.json().catch(() => ({ ok: false, error: 'Respuesta inesperada.' }));
    await minimo; clearInterval(rota);
    if (j.ok) { S.hist.push({ q: t, a: j.respuesta }); await escribir(body, j.respuesta); }
    else body.innerHTML = '<p class="err">' + esc(j.error) + '</p>';
  } catch (e) { clearInterval(rota); body.innerHTML = '<p class="err">No se ha podido preguntar ahora.</p>'; }
  pensando = false; ans.classList.remove('pensando'); qBtn.disabled = false;
}
$('#pb-of-askf').addEventListener('submit', (e) => { e.preventDefault(); preguntar(qIn.value); });
const askW = $('#pb-of-ask'), askF = $('#pb-of-askf');
const kbd = document.createElement('kbd'); kbd.textContent = '/'; kbd.title = 'Pulsa / para preguntar'; askF.append(kbd);
const PH = qIn.placeholder;
const abrirAsk = () => { askW.classList.add('abierta'); qIn.placeholder = PH; qIn.focus(); };
const cerrarAsk = () => { if (qIn.value.trim() || ans.classList.contains('on') || document.activeElement === qIn) return; askW.classList.remove('abierta'); qIn.placeholder = 'Pregunta a PEBAI'; };
qIn.placeholder = 'Pregunta a PEBAI';
askF.addEventListener('click', () => { if (!askW.classList.contains('abierta')) abrirAsk(); });
qIn.addEventListener('focus', () => { askW.classList.add('abierta'); qIn.placeholder = PH; });
qIn.addEventListener('blur', () => setTimeout(cerrarAsk, 180));
new MutationObserver(() => setTimeout(cerrarAsk, 0)).observe(ans, { attributes: true, attributeFilter: ['class'] });
['pb-of-ask', 'pb-of-hud', 'pb-of-side'].forEach((id) => { const n = document.getElementById(id); if (n) n.addEventListener('click', (e) => e.stopPropagation()); });

/* ============ escena 3D ============ */
let G = null, foco = null, pensando = false, cine = false, cineAng = 0, salaHover = null;
const calma = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
function enfocarSala(d) {
  foco = { sala: d.id }; wrap.classList.add('foco'); if (!G) return;
  const s = G.salas.get(d.id); if (!s) return;
  const f = Math.max(1, s.W / 8.6), panel = wrap.clientWidth > 760 ? 2.7 * f : 0;
  const c = s.g.position.clone();
  G.volar(c.clone().add(new G.THREE.Vector3(panel, 11 * f, 13.5 * f)), c.clone().add(new G.THREE.Vector3(panel, .9, -.9)));
}
function enfocarAgente(id) {
  foco = { agente: id }; wrap.classList.add('foco'); if (!G) return;
  const o = G.puestos.get(id); if (!o) return;
  const w = new G.THREE.Vector3(); o.p.getWorldPosition(w);
  const panel = wrap.clientWidth > 760 ? 2.3 : 0;
  G.volar(w.clone().add(new G.THREE.Vector3(panel, 6.6, 8.6)), w.clone().add(new G.THREE.Vector3(panel, 1.55, -.7)));
}

async function montar() {
  const THREE = await import('three');
  const { CSS2DRenderer, CSS2DObject } = await import('three/addons/renderers/CSS2DRenderer.js');
  const { EffectComposer } = await import('three/addons/postprocessing/EffectComposer.js');
  const { RenderPass } = await import('three/addons/postprocessing/RenderPass.js');
  const { UnrealBloomPass } = await import('three/addons/postprocessing/UnrealBloomPass.js');
  const { OutputPass } = await import('three/addons/postprocessing/OutputPass.js');
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const { SVGLoader } = await import('three/addons/loaders/SVGLoader.js');
  /* las letras de carteles y pantallas se dibujan en canvas: esperar a que las fuentes del panel estén listas */
  try { await Promise.race([Promise.all(['400 100px "Instrument Serif"', '800 40px Manrope', '600 30px Manrope'].map((f) => document.fonts.load(f))), new Promise((r) => setTimeout(r, 2500))]); } catch (e) { /* sin fuentes, se usa la de respaldo */ }
  /* si la sección aún no tiene tamaño (pestaña oculta), esperar: con ancho 0 la cámara saldría NaN */
  while (!wrap.clientWidth || !wrap.clientHeight) await new Promise((r) => setTimeout(r, 250));
  const load = $('#pb-of-load'); if (load) load.remove();
  const W0 = () => wrap.clientWidth, H0 = () => wrap.clientHeight;
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.setSize(W0(), H0());
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap; renderer.shadowMap.autoUpdate = false;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.2;
  wrap.prepend(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x06070d); scene.fog = new THREE.Fog(0x06070d, 48, 100);
  const camera = new THREE.PerspectiveCamera(32, W0() / H0(), .1, 240);
  const labels = new CSS2DRenderer(); labels.setSize(W0(), H0()); labels.domElement.className = 'pb-of-lbl'; wrap.append(labels.domElement);
  /* calidad: la escena se dibuja a esta resolución y baja sola si el ordenador no llega a ~40 FPS */
  let Q = Math.min(devicePixelRatio, 1.25);
  const composer = new EffectComposer(renderer); composer.setPixelRatio(Q);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(W0() / 2, H0() / 2), .55, .45, .88)); composer.addPass(new OutputPass());

  const hemi = new THREE.HemisphereLight(0xcfd2ff, 0x14162a, 1); scene.add(hemi);
  const lamparas = [];
  const sun = new THREE.DirectionalLight(0xffffff, 1.35); sun.position.set(-12, 26, 16); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); sun.shadow.bias = -.0004; scene.add(sun);

  const canvasTex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), c); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  const hexA = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  const brillo = canvasTex(128, 128, (g) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.25, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); });
  brillo.colorSpace = THREE.NoColorSpace;

  /* ---------- suelo general ---------- */
  const floorTex = canvasTex(512, 512, (g) => { g.fillStyle = '#0b0c18'; g.fillRect(0, 0, 512, 512); g.strokeStyle = 'rgba(126,115,255,.04)'; g.lineWidth = 2; for (let i = 0; i <= 512; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 512); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(512, i); g.stroke(); } g.fillStyle = 'rgba(126,115,255,.07)'; for (let i = 0; i <= 512; i += 64) for (let j = 0; j <= 512; j += 64) g.fillRect(i - 2, j - 2, 4, 4); });
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(20, 20);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(170, 170), new THREE.MeshStandardMaterial({ map: floorTex, roughness: .55, metalness: .35 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

  /* ---------- enlaces de datos ----------
     Cable de doble capa (alma brillante + halo suave) con pulsos que van del núcleo a la sala (violeta)
     y vuelven de la sala al núcleo (color de la sala); encima viajan paquetes de luz. */
  const VIOLETA = '#9C93FF';
  const enlaceMat = (colSala, halo) => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uT: { value: 0 }, uA: { value: new THREE.Color(VIOLETA) }, uB: { value: new THREE.Color(colSala) }, uOn: { value: 0 }, uH: { value: halo ? 1 : 0 }, uN: { value: 4 } },
    vertexShader: 'varying vec2 vUv;varying vec3 vN;varying vec3 vV;void main(){vUv=uv;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
    fragmentShader: 'varying vec2 vUv;varying vec3 vN;varying vec3 vV;uniform float uT;uniform vec3 uA;uniform vec3 uB;uniform float uOn;uniform float uH;uniform float uN;'
      + 'float pul(float f){return smoothstep(0.,.03,f)*smoothstep(.22,.03,f);}'
      + 'void main(){float sp=.18+.32*uOn;float ida=pul(fract(vUv.x*uN-uT*sp));float vuelta=pul(fract((1.-vUv.x)*uN-uT*sp+.5))*uOn;'
      + 'float borde=mix(1.,pow(abs(dot(normalize(vN),normalize(vV))),2.2),uH);'
      + 'vec3 c=mix(uA,uB,smoothstep(.15,.85,vUv.x))*(.45+.25*uOn)+uA*ida*1.6+uB*vuelta*1.6;'
      + 'float a=(.2+.12*uOn+(ida+vuelta)*.8)*borde*mix(1.,.5,uH);gl_FragColor=vec4(c,a);}',
  });
  const enlaces = [], paquetes = [];
  function cable(curva, col, radio, nPaq) {
    const alma = new THREE.Mesh(new THREE.TubeGeometry(curva, 120, radio, 10), enlaceMat(col, false));
    const halo = new THREE.Mesh(new THREE.TubeGeometry(curva, 120, radio * 3.4, 12), enlaceMat(col, true));
    scene.add(alma, halo); const c = { alma, halo, curva, on: 0 }; enlaces.push(c);
    for (let i = 0; i < nPaq; i++) [1, -1].forEach((dir) => {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: brillo, color: dir > 0 ? VIOLETA : col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      sp.scale.setScalar(radio * 9); scene.add(sp); paquetes.push({ sp, c, dir, k: (i / nPaq) + (dir < 0 ? .5 / nPaq : 0), v: .16 + Math.random() * .04 });
    });
    return c;
  }
  const ponOn = (c, v) => { c.on = v; c.alma.material.uniforms.uOn.value = v; c.halo.material.uniforms.uOn.value = v; };

  /* ---------- núcleo: PEBAI, la IA que lo mueve todo ---------- */
  const NUC = new THREE.Vector3(0, 2.85, 0);
  const metal = new THREE.MeshStandardMaterial({ color: 0x151931, roughness: .28, metalness: .75 });
  const zocalo = new THREE.Mesh(new THREE.CylinderGeometry(2.25, 2.4, .16, 72), metal); zocalo.position.y = .08; zocalo.receiveShadow = true; scene.add(zocalo);
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.7, .36, 72), metal); pedestal.position.y = .34; pedestal.castShadow = pedestal.receiveShadow = true; pedestal.userData.nucleo = true; scene.add(pedestal);
  const violetaMat = new THREE.MeshBasicMaterial({ color: 0x9C93FF, toneMapped: false });
  const filo = new THREE.Mesh(new THREE.TorusGeometry(1.47, .02, 8, 120), violetaMat); filo.rotation.x = Math.PI / 2; filo.position.y = .525; scene.add(filo);
  const filo2 = new THREE.Mesh(new THREE.TorusGeometry(2.27, .014, 8, 120), new THREE.MeshBasicMaterial({ color: 0x6d64d8, toneMapped: false, transparent: true, opacity: .7 })); filo2.rotation.x = Math.PI / 2; filo2.position.y = .165; scene.add(filo2);
  /* corona de marcas que gira despacio sobre el pedestal */
  const corona = new THREE.Group(); corona.position.y = .53; scene.add(corona);
  for (let i = 0; i < 36; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(.05, .012, i % 3 ? .12 : .24), new THREE.MeshBasicMaterial({ color: 0x9C93FF, toneMapped: false, transparent: true, opacity: i % 3 ? .45 : .9 })); const a = i / 36 * Math.PI * 2; m.position.set(Math.cos(a) * 1.2, 0, Math.sin(a) * 1.2); m.rotation.y = -a; corona.add(m); }
  const haz = new THREE.Mesh(new THREE.CylinderGeometry(.12, .42, 1.1, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0x9C93FF, transparent: true, opacity: .16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); haz.position.y = 1.07; scene.add(haz);
  const orbeMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uT: { value: 0 }, uA: { value: new THREE.Color('#6F63FF') }, uB: { value: new THREE.Color('#B7FF3C') }, uErr: { value: 0 }, uK: { value: 1 } },
    vertexShader: 'varying vec3 vN;varying vec3 vV;varying vec3 vP;void main(){vP=position;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
    fragmentShader: 'varying vec3 vN;varying vec3 vV;varying vec3 vP;uniform float uT;uniform vec3 uA;uniform vec3 uB;uniform float uErr;uniform float uK;'
      + 'void main(){float fr=pow(1.-abs(dot(vN,vV)),2.6);float t=uT*uK;'
      + 'float p1=sin(vP.y*6.+t*1.3+sin(vP.x*4.+t*.7)*1.8);float p2=sin(vP.x*7.-t*1.1+cos(vP.z*5.+t*.9)*1.4);float p3=sin((vP.z+vP.y)*9.+t*2.1);'
      + 'float pl=(p1+p2)*.25+.5;float hilo=smoothstep(.92,1.,abs(p3))*.6;'
      + 'vec3 c=mix(uA,uB,smoothstep(.72,1.,pl)*.5);c=mix(c,vec3(1.,.36,.42),uErr);'
      + 'gl_FragColor=vec4(c*(.35+fr*2.1+pl*.35+hilo),fr*.9+.05+pl*.08+hilo*.25);}',
  });
  const orbe = new THREE.Mesh(new THREE.SphereGeometry(1.25, 72, 54), orbeMat); orbe.position.copy(NUC); orbe.userData.nucleo = true; scene.add(orbe);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: brillo, color: 0x7E73FF, transparent: true, opacity: .32, depthWrite: false, blending: THREE.AdditiveBlending })); halo.scale.setScalar(7.2); halo.position.copy(NUC); scene.add(halo);
  /* el logo, al frente y bien visible: una lente oscura detrás y un brillo suave */
  const lente = new THREE.Mesh(new THREE.CircleGeometry(.8, 64), new THREE.MeshBasicMaterial({ color: 0x07081a, transparent: true, opacity: .78, depthWrite: false })); lente.renderOrder = 4; scene.add(lente);
  const aro = new THREE.Mesh(new THREE.RingGeometry(.8, .835, 64), new THREE.MeshBasicMaterial({ color: 0x9C93FF, transparent: true, opacity: .8, depthWrite: false, toneMapped: false })); aro.renderOrder = 4; scene.add(aro);
  const tex = new THREE.TextureLoader().load(BASE + 'assets/pebai-mark.png'); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const mark = new THREE.Mesh(new THREE.PlaneGeometry(1.04, 1.22), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false })); mark.renderOrder = 5; scene.add(mark);
  const fachada = [lente, aro, mark];
  /* nube de partículas que orbita el núcleo (dos capas en sentidos opuestos) */
  const nube = (n, r0, r1, col, tam) => {
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, r = r0 + Math.random() * (r1 - r0), s = Math.sqrt(1 - u * u); pos.set([Math.cos(th) * s * r, u * r * .55, Math.sin(th) * s * r], i * 3); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const p = new THREE.Points(geo, new THREE.PointsMaterial({ map: brillo, color: col, size: tam, transparent: true, opacity: .85, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
    p.position.copy(NUC); scene.add(p); return p;
  };
  const nubes = [nube(200, 1.55, 2.5, 0x9C93FF, .12), nube(100, 1.5, 2.2, 0xB7FF3C, .09)];
  const orbitas = [[.25, .5, 1.68], [1.05, -.45, 1.9], [-.7, 1.2, 2.12]].map(([rx, rz, r], i) => {
    const o = new THREE.Mesh(new THREE.TorusGeometry(r, .01, 6, 160), new THREE.MeshBasicMaterial({ color: i === 1 ? 0xB7FF3C : 0x9C93FF, transparent: true, opacity: .5, toneMapped: false }));
    o.position.copy(NUC); o.rotation.set(Math.PI / 2 + rx, 0, rz); scene.add(o);
    const chispa = new THREE.Sprite(new THREE.SpriteMaterial({ map: brillo, color: i === 1 ? 0xB7FF3C : 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); chispa.scale.setScalar(.32); chispa.position.x = r; o.add(chispa);
    return o;
  });
  /* ondas que salen del núcleo por el suelo, como un latido */
  const ondas = [0, 1].map((i) => { const m = new THREE.Mesh(new THREE.RingGeometry(.97, 1, 128), new THREE.MeshBasicMaterial({ color: 0x9C93FF, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); m.rotation.x = -Math.PI / 2; m.position.y = .115; scene.add(m); return { m, k: i / 2 }; });
  const columna = new THREE.Mesh(new THREE.CylinderGeometry(.55, .9, 24, 40, 1, true), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { uT: { value: 0 } },
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'varying vec2 vUv;uniform float uT;void main(){float f=pow(1.-vUv.y,3.);float r=.5+.5*sin(vUv.y*40.-uT*2.);gl_FragColor=vec4(vec3(.55,.5,1.)*(.6+r*.4),f*.075);}',
  }));
  columna.position.set(0, NUC.y + 13.2, 0); scene.add(columna);
  const polvo = (() => { const n = 140, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) pos.set([(Math.random() - .5) * 44, Math.random() * 9, (Math.random() - .5) * 26], i * 3); const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); const pt = new THREE.Points(geo, new THREE.PointsMaterial({ map: brillo, color: 0x8e84ff, size: .07, transparent: true, opacity: .32, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(pt); return pt; })();
  const coreLight = new THREE.PointLight(0x8e84ff, 8, 12); coreLight.position.copy(NUC).add(new THREE.Vector3(0, 0, 1.4)); scene.add(coreLight);

  /* ---------- pantallas animadas y carteles ---------- */
  const icono = (g, a, x, y, s, color) => {
    g.save(); g.translate(x, y); g.scale(s, s);
    const d = a.icono && brand(a.icono);
    if (d) { g.fillStyle = color; g.fill(new Path2D(d)); } else { g.strokeStyle = color; g.lineWidth = 2; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(new Path2D(GLIFOS[a.glifo] || GLIFOS.flow)); }
    g.restore();
  };
  function dibujaPantalla(o, t) {
    const g = o.ctx, a = o.a, st = vis(a.st), col = o.col;
    g.clearRect(0, 0, 512, 320);
    if (st === 'apagado') {
      g.fillStyle = '#040407'; g.fillRect(0, 0, 512, 320); g.strokeStyle = '#25283a'; g.lineWidth = 9; g.lineCap = 'round';
      g.beginPath(); g.arc(256, 168, 48, -Math.PI * .3, Math.PI * 1.3); g.stroke(); g.beginPath(); g.moveTo(256, 102); g.lineTo(256, 160); g.stroke();
      o.tex.needsUpdate = true; return;
    }
    const grd = g.createLinearGradient(0, 0, 0, 320);
    grd.addColorStop(0, st === 'error' ? '#3a0f18' : st === 'dormido' ? '#0b0c16' : '#121733'); grd.addColorStop(1, st === 'error' ? '#1d070c' : '#080a16');
    g.fillStyle = grd; g.fillRect(0, 0, 512, 320);
    const apag = st === 'dormido';
    g.fillStyle = apag ? '#1c1f33' : (FONDO[a.id] || '#3a3d52'); g.beginPath(); g.roundRect(34, 54, 150, 150, 36); g.fill();
    icono(g, a, 64, 84, 3.75, apag ? '#4a4d62' : '#ffffff');
    g.fillStyle = apag ? '#4a4d62' : '#EFEDE7'; g.font = '800 34px Manrope, sans-serif'; g.textAlign = 'center'; g.fillText(a.nombre, 109, 252); g.textAlign = 'left';
    const x0 = 214;
    if (st === 'trabajando') {
      for (let i = 0; i < 5; i++) {
        const k = (t * 1.6 + i * .37) % 1, y = 48 + i * 46, w = 80 + ((i * 67 + Math.floor(t * 1.6 + i * .37) * 31) % 170);
        g.fillStyle = 'rgba(255,255,255,.07)'; g.beginPath(); g.roundRect(x0, y, 264, 30, 9); g.fill();
        g.fillStyle = col; g.globalAlpha = .35 + .65 * (1 - k); g.beginPath(); g.roundRect(x0 + 12, y + 11, Math.min(240, w * Math.min(1, k * 2.2)), 8, 4); g.fill(); g.globalAlpha = 1;
      }
    } else if (st === 'espera') {
      g.strokeStyle = '#FFB547'; g.lineWidth = 7; g.lineCap = 'round';
      g.beginPath(); g.arc(346, 130, 56, 0, Math.PI * 2); g.globalAlpha = .25; g.stroke(); g.globalAlpha = 1;
      g.beginPath(); g.arc(346, 130, 56, t * 1.4, t * 1.4 + 1.3); g.stroke();
      g.fillStyle = '#FFB547'; g.font = '700 26px Manrope, sans-serif'; g.textAlign = 'center'; g.fillText('En espera', 346, 236); g.textAlign = 'left';
    } else if (st === 'dormido') {
      g.fillStyle = '#3a3d55'; g.font = '800 64px Manrope, sans-serif'; g.fillText('z', 300, 130); g.font = '800 46px Manrope, sans-serif'; g.fillText('z', 360, 96); g.font = '800 32px Manrope, sans-serif'; g.fillText('z', 404, 70);
      g.fillStyle = '#4a4d62'; g.font = '700 26px Manrope, sans-serif'; g.fillText(a.st === 'pausado' ? 'En pausa' : 'Durmiendo', 290, 220);
    } else if (st === 'error') {
      const on = Math.sin(t * 6) > 0;
      g.fillStyle = on ? '#FF5E6C' : '#a63845'; g.beginPath(); g.moveTo(346, 52); g.lineTo(424, 190); g.lineTo(268, 190); g.closePath(); g.fill();
      g.fillStyle = '#1d070c'; g.font = '900 78px Manrope, sans-serif'; g.textAlign = 'center'; g.fillText('!', 346, 176);
      g.fillStyle = '#FF8A95'; g.font = '700 26px Manrope, sans-serif'; g.fillText('Error', 346, 236); g.textAlign = 'left';
    }
    if (a.cupo && st !== 'dormido') { g.fillStyle = 'rgba(255,255,255,.08)'; g.beginPath(); g.roundRect(34, 282, 444, 12, 6); g.fill(); g.fillStyle = col; g.beginPath(); g.roundRect(34, 282, Math.max(12, 444 * Math.min(1, a.hoy / a.cupo)), 12, 6); g.fill(); }
    o.tex.needsUpdate = true;
  }
  /* cartel de la sala: icono del departamento, nombre con la serif del panel y una línea de estado */
  const cartel = (d, partes) => canvasTex(1024, 256, (g) => {
    const on = d.activo;
    const grd = g.createLinearGradient(0, 0, 0, 256); grd.addColorStop(0, 'rgba(24,27,50,.97)'); grd.addColorStop(1, 'rgba(10,12,24,.97)');
    g.fillStyle = grd; g.beginPath(); g.roundRect(6, 6, 1012, 244, 44); g.fill();
    g.strokeStyle = on ? hexA(d.color, .5) : 'rgba(255,255,255,.09)'; g.lineWidth = 3; g.stroke();
    g.fillStyle = on ? d.color : '#3a3d52'; g.beginPath(); g.roundRect(70, 4, 200, 6, 3); g.fill();
    g.fillStyle = on ? hexA(d.color, .14) : 'rgba(255,255,255,.04)'; g.beginPath(); g.roundRect(46, 50, 156, 156, 40); g.fill();
    g.strokeStyle = on ? hexA(d.color, .35) : 'rgba(255,255,255,.06)'; g.lineWidth = 2; g.stroke();
    g.save(); g.translate(76, 80); g.scale(4, 4); g.strokeStyle = on ? d.color : '#5c5f73'; g.lineWidth = 1.7; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(new Path2D(GLIFOS[d.glifo] || GLIFOS.flow)); g.restore();
    g.fillStyle = on ? '#FFFFFF' : '#8a8da2'; g.font = '400 104px "Instrument Serif", Georgia, serif'; g.fillText(d.nombre, 240, 128);
    let x = 244; g.font = '700 36px Manrope, sans-serif';
    partes.forEach(([txt, c], i) => {
      if (i) { g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x, 168, 2, 36); x += 24; }
      g.fillStyle = c; g.beginPath(); g.arc(x + 9, 186, 9, 0, Math.PI * 2); g.fill(); x += 28;
      g.fillStyle = on ? '#D6D8E6' : '#7c7f94'; g.fillText(txt, x, 199); x += g.measureText(txt).width + 24;
    });
  });

  /* ---------- materiales y muebles ---------- */
  const M = {
    cuerpo: new THREE.MeshStandardMaterial({ color: 0xc4c8d6, roughness: .38, metalness: .25 }),
    oscuro: new THREE.MeshStandardMaterial({ color: 0x1a1d30, roughness: .4, metalness: .45 }),
    mesa: new THREE.MeshStandardMaterial({ color: 0x2b2f50, roughness: .4, metalness: .35 }),
    marco: new THREE.MeshStandardMaterial({ color: 0x0a0b14, roughness: .35, metalness: .4 }),
    madera: new THREE.MeshStandardMaterial({ color: 0x5a4636, roughness: .7, metalness: .05 }),
    tela: new THREE.MeshStandardMaterial({ color: 0x2c3054, roughness: .9 }),
    maceta: new THREE.MeshStandardMaterial({ color: 0xd9d4cc, roughness: .6 }),
    hoja: new THREE.MeshStandardMaterial({ color: 0x2f8f5b, roughness: .7, flatShading: true }),
    hoja2: new THREE.MeshStandardMaterial({ color: 0x3fae6b, roughness: .7, flatShading: true }),
    carton: new THREE.MeshStandardMaterial({ color: 0x9a7650, roughness: .85 }),
    luzCalida: new THREE.MeshBasicMaterial({ color: 0xffd9a0, toneMapped: false }),
  };
  const libroCol = [0x8E84FF, 0x3FD5FF, 0xE25CFF, 0xB7FF3C, 0xFFB547, 0xEFEDE7, 0x5c5f73];
  const caja = (w, h, d, mat, r = .03) => { const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2)), mat); m.castShadow = true; m.receiveShadow = true; return m; };
  const en = (g, m, x, y, z, ry = 0) => { m.position.set(x, y, z); m.rotation.y = ry; g.add(m); return m; };
  function planta(g, x, z, s = 1) {
    const p = new THREE.Group(); p.position.set(x, 0, z); p.scale.setScalar(s); g.add(p);
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(.24, .18, .42, 20), M.maceta); pot.position.y = .21; pot.castShadow = true; p.add(pot);
    const tierra = new THREE.Mesh(new THREE.CircleGeometry(.22, 20), M.oscuro); tierra.rotation.x = -Math.PI / 2; tierra.position.y = .42; p.add(tierra);
    [[0, .82, 0, .3, M.hoja], [.13, 1.08, .06, .22, M.hoja2], [-.12, 1, -.07, .21, M.hoja], [.02, 1.28, -.02, .16, M.hoja2], [-.06, .66, .14, .18, M.hoja2]].forEach(([hx, hy, hz, r, m]) => { const h = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), m); h.position.set(hx, hy, hz); h.rotation.set(hx * 9, hz * 7, hy); h.castShadow = true; p.add(h); });
    return p;
  }
  function lampara(g, x, z) {
    const p = new THREE.Group(); p.position.set(x, 0, z); g.add(p);
    en(p, new THREE.Mesh(new THREE.CylinderGeometry(.18, .2, .04, 20), M.marco), 0, .02, 0);
    const palo = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, 1.5, 8), M.marco); palo.position.y = .77; palo.castShadow = true; p.add(palo);
    const pant = new THREE.Mesh(new THREE.CylinderGeometry(.16, .24, .3, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0x3a3550, roughness: .8, side: THREE.DoubleSide, emissive: 0xffb866, emissiveIntensity: .12 })); pant.position.y = 1.58; p.add(pant);
    en(p, new THREE.Mesh(new THREE.SphereGeometry(.06, 12, 12), M.luzCalida), 0, 1.52, 0);
    const charco = new THREE.Mesh(new THREE.CircleGeometry(.75, 32), new THREE.MeshBasicMaterial({ map: brillo, color: 0xffc78a, transparent: true, opacity: .22, depthWrite: false, blending: THREE.AdditiveBlending })); charco.rotation.x = -Math.PI / 2; charco.position.y = .01; p.add(charco);
    lamparas.push({ pant: pant.material, charco: charco.material });
  }
  function estanteria(g, x, z, ry, conCajas) {
    const p = new THREE.Group(); p.position.set(x, 0, z); p.rotation.y = ry; g.add(p);
    [-.42, .42].forEach((sx) => en(p, caja(.04, 1.5, .34, M.madera, .01), sx, .75, 0));
    [.05, .5, .95, 1.4].forEach((y) => en(p, caja(.88, .035, .34, M.madera, .01), 0, y, 0));
    [.08, .53, .98].forEach((y, fila) => {
      if (conCajas && fila < 2) { en(p, caja(.36, .3, .28, M.carton, .01), -.2, y + .15, 0); en(p, caja(.3, .26, .28, M.carton, .01), .2, y + .13, 0); return; }
      let bx = -.38;
      while (bx < .34) { const w = .05 + Math.random() * .04, h = .26 + Math.random() * .12; const l = caja(w, h, .24, new THREE.MeshStandardMaterial({ color: libroCol[Math.floor(Math.random() * libroCol.length)], roughness: .7 }), .005); en(p, l, bx + w / 2, y + .02 + h / 2, 0); if (Math.random() > .82) l.rotation.z = .25; bx += w + .012; }
    });
  }
  function sofa(g, x, z, ry, tela) {
    const p = new THREE.Group(); p.position.set(x, 0, z); p.rotation.y = ry; g.add(p);
    en(p, caja(1.9, .32, .8, tela, .08), 0, .26, 0);
    en(p, caja(1.9, .55, .2, tela, .08), 0, .55, .32);
    [-.88, .88].forEach((sx) => en(p, caja(.2, .45, .8, tela, .08), sx, .38, 0));
    [-.45, .45].forEach((sx) => en(p, caja(.82, .12, .62, tela, .06), sx, .47, -.05));
    [-.82, .82].forEach((sx) => { [-.3, .3].forEach((sz) => en(p, new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .1, 8), M.marco), sx, .05, sz)); });
  }
  function mesaBaja(g, x, z) {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, .05, 32), M.madera); t.position.set(x, .38, z); t.castShadow = true; g.add(t);
    const pie = new THREE.Mesh(new THREE.CylinderGeometry(.05, .12, .36, 12), M.marco); pie.position.set(x, .18, z); g.add(pie);
    const taza = new THREE.Mesh(new THREE.CylinderGeometry(.05, .04, .09, 12), M.maceta); taza.position.set(x + .12, .45, z - .05); g.add(taza);
  }
  function alfombra(g, w, d, x, z, col) {
    const t = canvasTex(256, 256, (c) => { c.fillStyle = hexA(col, .08); c.beginPath(); c.roundRect(4, 4, 248, 248, 40); c.fill(); c.strokeStyle = hexA(col, .22); c.lineWidth = 4; c.beginPath(); c.roundRect(20, 20, 216, 216, 30); c.stroke(); });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: .95 })); m.rotation.x = -Math.PI / 2; m.position.set(x, .006, z); m.receiveShadow = true; g.add(m);
  }
  const zTex = canvasTex(64, 64, (g) => { g.fillStyle = '#d6d8ea'; g.font = '800 46px Manrope, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('z', 32, 34); });
  /* cosas colgadas en la pared del fondo (se dibujan en canvas) */
  function cuadroPared(g, w, h, x, y, z, draw) {
    const t = canvasTex(Math.round(w * 200), Math.round(h * 200), draw);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); m.position.set(x, y, z); g.add(m);
    const fr = caja(w + .08, h + .08, .04, M.marco, .015); fr.position.set(x, y, z - .025); fr.castShadow = false; g.add(fr);
    return { m, t };
  }

  /* ---------- agentes de IA y su puesto ---------- */
  function robot(acento) {
    const r = new THREE.Group();
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.21, .3, 6, 18), M.cuerpo); torso.position.y = .95; torso.castShadow = true; r.add(torso);
    const nucleoMat = new THREE.MeshBasicMaterial({ color: acento, toneMapped: false });
    const nucleo = new THREE.Mesh(new THREE.CircleGeometry(.07, 24), nucleoMat); nucleo.position.set(0, 1.0, .212); r.add(nucleo);
    const nucleoAtras = nucleo.clone(); nucleoAtras.position.z = -.212; nucleoAtras.rotation.y = Math.PI; r.add(nucleoAtras);
    const cuello = new THREE.Group(); cuello.position.y = 1.28; r.add(cuello);
    const cabeza = new THREE.Mesh(new RoundedBoxGeometry(.46, .35, .37, 4, .11), M.cuerpo); cabeza.position.y = .16; cabeza.castShadow = true; cuello.add(cabeza);
    const visor = new THREE.Mesh(new RoundedBoxGeometry(.38, .15, .02, 2, .05), new THREE.MeshBasicMaterial({ color: 0x0d0f1c })); visor.position.set(0, .17, -.186); cuello.add(visor);
    const ojoMat = new THREE.MeshBasicMaterial({ color: acento, toneMapped: false });
    [-.085, .085].forEach((x) => { const o = new THREE.Mesh(new THREE.CapsuleGeometry(.024, .032, 4, 8), ojoMat); o.rotation.z = Math.PI / 2; o.position.set(x, .17, -.2); cuello.add(o); });
    const antena = new THREE.Mesh(new THREE.SphereGeometry(.038, 12, 12), new THREE.MeshBasicMaterial({ color: acento, toneMapped: false })); antena.position.y = .4; cuello.add(antena);
    const palo = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .09), M.oscuro); palo.position.y = .34; cuello.add(palo);
    const acentoMat = new THREE.MeshStandardMaterial({ color: acento, roughness: .35, metalness: .3, emissive: acento, emissiveIntensity: .25 });
    [-1, 1].forEach((sx) => { const oreja = new THREE.Mesh(new THREE.CylinderGeometry(.075, .075, .05, 20), acentoMat); oreja.rotation.z = Math.PI / 2; oreja.position.set(sx * .245, .16, 0); cuello.add(oreja); });
    const cinta = new THREE.Mesh(new THREE.TorusGeometry(.215, .018, 8, 32), acentoMat); cinta.rotation.x = Math.PI / 2; cinta.position.y = .8; r.add(cinta);
    const brazos = [-1, 1].map((s) => {
      const hombro = new THREE.Group(); hombro.position.set(s * .26, 1.1, 0); r.add(hombro);
      const b = new THREE.Mesh(new THREE.CapsuleGeometry(.056, .26, 4, 10), M.cuerpo); b.position.y = -.17; b.castShadow = true; hombro.add(b);
      return hombro;
    });
    return { r, cuello, ojoMat, nucleoMat, antena, brazos };
  }
  function silla() {
    const s = new THREE.Group();
    en(s, caja(.6, .1, .55, M.oscuro, .04), 0, .58, 0);
    en(s, caja(.56, .36, .08, M.oscuro, .04), 0, .8, .26);
    en(s, new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .5), M.oscuro), 0, .3, 0);
    en(s, new THREE.Mesh(new THREE.CylinderGeometry(.28, .3, .04, 20), M.oscuro), 0, .04, 0);
    return s;
  }
  const puestos = new Map(), salas = new Map(), clicables = [orbe, pedestal], autosPared = [];
  /* el logo de cada herramienta, en 3D y con su color: se reconoce la mesa sin leer nada */
  const colorDe = (a) => (a.icono && window.PB_ICONS && window.PB_ICONS.brands && window.PB_ICONS.brands[a.icono] && window.PB_ICONS.brands[a.icono].bg) || '#9C93FF';
  const geoLogos = new Map();
  function geoLogo(k) {
    if (geoLogos.has(k)) return geoLogos.get(k);
    const dd = brand(k); if (!dd) return null;
    const data = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path transform="matrix(1 0 0 -1 0 24)" d="${dd}"/></svg>`);
    const shapes = []; data.paths.forEach((pa) => shapes.push(...SVGLoader.createShapes(pa)));
    const geo = new THREE.ExtrudeGeometry(shapes, { depth: 2.6, bevelEnabled: true, bevelThickness: .5, bevelSize: .3, bevelSegments: 3, curveSegments: 14 });
    geo.center(); geo.scale(.034, .034, .034); geo.computeVertexNormals();
    geoLogos.set(k, geo); return geo;
  }
  const alfNeutra = canvasTex(256, 256, (c) => { c.fillStyle = 'rgba(255,255,255,.10)'; c.beginPath(); c.roundRect(4, 4, 248, 248, 36); c.fill(); c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 5; c.beginPath(); c.roundRect(6, 6, 244, 244, 34); c.stroke(); });
  const brilloCal = canvasTex(128, 128, (c) => { const r = c.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,214,150,.9)'); r.addColorStop(1, 'rgba(255,214,150,0)'); c.fillStyle = r; c.fillRect(0, 0, 128, 128); });
  const datoTex = canvasTex(64, 64, (c) => { c.fillStyle = '#3DDC84'; c.beginPath(); c.roundRect(14, 26, 36, 12, 6); c.fill(); });
  /* haz de luz de un foco desde arriba: se enciende sobre quien está trabajando */
  const hazMat = () => new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { uO: { value: 0 } },
    vertexShader: 'varying vec2 vUv;varying vec3 vN;varying vec3 vV;void main(){vUv=uv;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
    fragmentShader: 'varying vec2 vUv;varying vec3 vN;varying vec3 vV;uniform float uO;void main(){float borde=pow(abs(dot(normalize(vN),normalize(vV))),1.6);float a=(.05+.22*pow(vUv.y,1.6))*borde*uO;gl_FragColor=vec4(vec3(1.,.93,.8),a);}' });
  function puesto(g, d, a, x) {
    const bc = colorDe(a), BC = new THREE.Color(bc);
    const p = new THREE.Group(); p.position.set(x, 0, -.6); g.add(p);
    en(p, caja(1.9, .08, .95, M.mesa, .03), 0, .74, 0);
    [-.85, .85].forEach((lx) => { const l = new THREE.Mesh(new THREE.BoxGeometry(.06, .74, .85), M.marco); l.position.set(lx, .37, 0); l.castShadow = true; p.add(l); });
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 320;
    const ptex = new THREE.CanvasTexture(cv); ptex.colorSpace = THREE.SRGBColorSpace; ptex.anisotropy = 4;
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.36, .85), new THREE.MeshBasicMaterial({ map: ptex, toneMapped: false })); scr.position.set(0, 1.47, -.24); p.add(scr);
    const fr = caja(1.46, .95, .05, M.marco, .02); fr.position.set(0, 1.47, -.28); p.add(fr);
    const stand = new THREE.Mesh(new THREE.BoxGeometry(.08, .48, .06), M.marco); stand.position.set(0, .98, -.28); p.add(stand);
    en(p, caja(.6, .025, .2, M.marco, .01), 0, .79, .12);
    const taza = new THREE.Mesh(new THREE.CylinderGeometry(.045, .038, .1, 12), M.maceta); taza.position.set(.68, .83, .15); p.add(taza);
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(1.8, .9), new THREE.MeshBasicMaterial({ color: new THREE.Color(COL_EST.trabajando), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    halo.rotation.x = -Math.PI / 2; halo.position.set(0, .785, .02); p.add(halo);
    const ch = silla(); ch.position.set(0, 0, .85); p.add(ch);
    const tiraMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(COL_EST.dormido), toneMapped: false });
    en(p, new THREE.Mesh(new THREE.BoxGeometry(1.86, .025, .025), tiraMat), 0, .705, .48);
    /* alfombrilla neutra (blanca en la textura) que se tiñe con el color del estado */
    const pad = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 2.5), new THREE.MeshBasicMaterial({ map: alfNeutra, color: new THREE.Color(COL_EST.dormido), transparent: true, opacity: .4, depthWrite: false, toneMapped: false })); pad.userData.esPad = true; pad.rotation.x = -Math.PI / 2; pad.position.set(0, .006, .35); p.add(pad);
    /* holograma: proyector encima del monitor, cono de luz y el logo flotando */
    en(p, caja(.26, .05, .1, M.marco, .015), 0, 1.97, -.28);
    en(p, new THREE.Mesh(new THREE.CircleGeometry(.05, 16), new THREE.MeshBasicMaterial({ color: BC, toneMapped: false })), 0, 2.0, -.28).rotation.x = -Math.PI / 2;
    const cono = new THREE.Mesh(new THREE.CylinderGeometry(.5, .06, .5, 32, 1, true), new THREE.MeshBasicMaterial({ color: BC, transparent: true, opacity: .1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); cono.position.set(0, 2.24, -.28); p.add(cono);
    const logoMat = new THREE.MeshStandardMaterial({ color: BC, emissive: BC, emissiveIntensity: .55, metalness: .25, roughness: .3 });
    const lg = geoLogo(a.icono); const logo = lg ? new THREE.Mesh(lg, logoMat) : new THREE.Mesh(new THREE.OctahedronGeometry(.3), logoMat);
    logo.position.set(0, 2.82, -.28); logo.castShadow = true; p.add(logo);
    const flexo = new THREE.Group(); flexo.position.set(-.72, .78, -.2); p.add(flexo);
    en(flexo, new THREE.Mesh(new THREE.CylinderGeometry(.09, .1, .03, 18), M.marco), 0, .015, 0);
    const brazoF = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .42, 8), M.marco); brazoF.position.set(.06, .22, 0); brazoF.rotation.z = -.3; flexo.add(brazoF);
    const cabezaF = new THREE.Mesh(new THREE.ConeGeometry(.09, .13, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0x2a2d44, roughness: .5, metalness: .4, side: THREE.DoubleSide })); cabezaF.position.set(.15, .42, .02); cabezaF.rotation.z = -2.2; flexo.add(cabezaF);
    const bombillaMat = new THREE.MeshBasicMaterial({ color: 0x3a3550, toneMapped: false });
    const bombilla = new THREE.Mesh(new THREE.SphereGeometry(.035, 12, 12), bombillaMat); bombilla.position.set(.19, .39, .02); flexo.add(bombilla);
    const charcoF = new THREE.Mesh(new THREE.CircleGeometry(.55, 32), new THREE.MeshBasicMaterial({ map: brilloCal, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); charcoF.rotation.x = -Math.PI / 2; charcoF.position.set(-.35, .787, -.05); p.add(charcoF);
    const haz = new THREE.Mesh(new THREE.CylinderGeometry(.18, 1.05, 3.6, 40, 1, true), hazMat()); haz.position.set(0, 2.0, .55); p.add(haz);
    const foco = new THREE.Mesh(new THREE.CircleGeometry(1.15, 40), new THREE.MeshBasicMaterial({ map: brilloCal, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); foco.rotation.x = -Math.PI / 2; foco.position.set(0, .012, .55); p.add(foco);
    const tecladoMat = new THREE.MeshBasicMaterial({ color: 0x14172a, toneMapped: false });
    const teclas = new THREE.Mesh(new THREE.PlaneGeometry(.54, .15), tecladoMat); teclas.rotation.x = -Math.PI / 2; teclas.position.set(0, .804, .12); p.add(teclas);
    const datos = [0, 1, 2, 3].map((k) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: datoTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); sp.scale.setScalar(.16); p.add(sp); return { sp, o: k / 4, x: (k - 1.5) * .28 }; });
    const rb = robot(new THREE.Color('#9C93FF')); rb.r.position.set(0, -.08, .74); rb.r.scale.setScalar(.95); p.add(rb.r);
    const baliza = new THREE.Mesh(new THREE.SphereGeometry(.12, 16, 16), new THREE.MeshBasicMaterial({ color: 0xFF5E6C, toneMapped: false })); baliza.position.set(.64, 2.08, -.27); baliza.visible = false; p.add(baliza);
    const zs = [0, 1, 2].map((k) => { const z = new THREE.Sprite(new THREE.SpriteMaterial({ map: zTex, transparent: true, opacity: 0, depthWrite: false })); z.scale.setScalar(.25); p.add(z); return { z, o: k / 3 }; });
    const o = { p, scr, ctx: cv.getContext('2d'), tex: ptex, halo, baliza, zs, rb, ch, a, d, hl: 0, col: bc, logo, logoMat, cono, pad, tiraMat, bombillaMat, charcoF, haz, foco, tecladoMat, datos, luz: 0, t0: Math.random() * 6, linea: null };
    p.traverse((n) => { if (n.isMesh) { n.userData.puesto = o; clicables.push(n); } });
    dibujaPantalla(o, 0);
    return o;
  }

  /* ---------- distribución: dos columnas a los lados del núcleo, tantas filas como haga falta ----------
     Cada sala va sobre su propia plataforma, con un servidor que es su punto de conexión con el núcleo. */
  const D = 5.6, GAP_Z = 4.2, GAP_X = 6.3, PASO = 2.7, ALTO = .32;
  const filas = Math.ceil(DEPTS.length / 2);
  const WSALA = Math.max(8.8, ...DEPTS.map((d) => (d.activo ? agsDe(d.id).length : 0) * PASO + 2.6));

  /* ---------- plaza central: el núcleo sobre su plataforma; a cada sala llega su cable de datos ---------- */
  const PLAZA = 4.6;
  const plazaTex = canvasTex(1024, 1024, (c) => {
    c.fillStyle = '#0d0f20'; c.fillRect(0, 0, 1024, 1024);
    c.strokeStyle = 'rgba(156,147,255,.09)'; c.lineWidth = 2;
    [180, 300, 420, 500].forEach((r) => { c.beginPath(); c.arc(512, 512, r, 0, Math.PI * 2); c.stroke(); });
    for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2; c.beginPath(); c.moveTo(512 + Math.cos(a) * 300, 512 + Math.sin(a) * 300); c.lineTo(512 + Math.cos(a) * (i % 4 ? 420 : 500), 512 + Math.sin(a) * (i % 4 ? 420 : 500)); c.stroke(); }
  });
  const plaza = new THREE.Mesh(new THREE.CylinderGeometry(PLAZA, PLAZA + .08, .1, 96), [new THREE.MeshStandardMaterial({ color: 0x14172e, roughness: .4, metalness: .5 }), new THREE.MeshStandardMaterial({ map: plazaTex, roughness: .45, metalness: .45 }), new THREE.MeshStandardMaterial({ color: 0x14172e })]);
  plaza.position.y = .05; plaza.receiveShadow = true; scene.add(plaza);
  const plazaFilo = new THREE.Mesh(new THREE.TorusGeometry(PLAZA + .02, .025, 8, 160), new THREE.MeshBasicMaterial({ color: 0x9C93FF, toneMapped: false })); plazaFilo.rotation.x = Math.PI / 2; plazaFilo.position.y = .1; scene.add(plazaFilo);
  const ledMat = [new THREE.MeshBasicMaterial({ color: 0x3DDC84, toneMapped: false }), new THREE.MeshBasicMaterial({ color: 0x16211b }), new THREE.MeshBasicMaterial({ color: 0x3FD5FF, toneMapped: false })];
  const losasTex = canvasTex(256, 256, (c) => { c.fillStyle = '#000'; c.fillRect(0, 0, 256, 256); c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 2; c.strokeRect(1, 1, 254, 254); });
  const luzSuelo = canvasTex(256, 256, (c) => { const r = c.createRadialGradient(128, 128, 30, 128, 128, 128); r.addColorStop(0, 'rgba(255,255,255,.9)'); r.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = r; c.fillRect(0, 0, 256, 256); });
  DEPTS.forEach((d, idx) => {
    const lista = d.activo ? agsDe(d.id) : [];
    const W = WSALA;
    const lado = idx % 2 === 0 ? -1 : 1, fila = Math.floor(idx / 2);
    const z = ((filas - 1) / 2 - fila) * (D + GAP_Z);
    const x = lado * (GAP_X + W / 2);
    const col = new THREE.Color(d.color), on = d.activo, IN = -lado; /* IN: lado de la sala que mira al núcleo */
    /* resplandor en el suelo bajo la plataforma: separa cada sala del resto */
    const res = new THREE.Mesh(new THREE.PlaneGeometry(W + 4, D + 4), new THREE.MeshBasicMaterial({ map: luzSuelo, color: col, transparent: true, opacity: on ? .07 : .045, depthWrite: false, blending: THREE.AdditiveBlending })); res.rotation.x = -Math.PI / 2; res.position.set(x, .012, z); scene.add(res);
    const plat = new THREE.Mesh(new RoundedBoxGeometry(W, ALTO, D, 3, .08), new THREE.MeshStandardMaterial({ color: on ? 0x191d3a : 0x181b33, roughness: .5, metalness: .3 })); plat.position.set(x, ALTO / 2, z); plat.receiveShadow = true; plat.castShadow = true; scene.add(plat);
    const banda = new THREE.Mesh(new THREE.BoxGeometry(W + .02, .03, D + .02), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: on ? .85 : .25, toneMapped: false })); banda.position.set(x, ALTO - .06, z); scene.add(banda); const bandaBase = on ? .85 : .25;
    const g = new THREE.Group(); g.position.set(x, ALTO, z); scene.add(g);
    const losas = losasTex.clone(); losas.wrapS = losas.wrapT = THREE.RepeatWrapping; losas.repeat.set(W / 1.1, D / 1.1); losas.needsUpdate = true;
    const suelo = new THREE.Mesh(new THREE.PlaneGeometry(W - .2, D - .2), new THREE.MeshBasicMaterial({ map: losas, color: col, transparent: true, opacity: on ? .05 : .025, depthWrite: false, blending: THREE.AdditiveBlending })); suelo.rotation.x = -Math.PI / 2; suelo.position.y = .004; g.add(suelo);
    /* pared del fondo y pared exterior, sólidas; la del lado del núcleo queda abierta */
    const paredMat = new THREE.MeshStandardMaterial({ color: on ? 0x161a33 : 0x101225, roughness: .6, metalness: .25 });
    const pared = caja(W, 2, .14, paredMat, .04); pared.position.set(0, 1, -D / 2 + .07); g.add(pared);
    const paredLat = caja(.14, 1.1, D, paredMat, .04); paredLat.position.set(-IN * (W / 2 - .07), .55, 0); g.add(paredLat);
    const filoMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: on ? .9 : .3, toneMapped: false });
    en(g, new THREE.Mesh(new THREE.BoxGeometry(W - .1, .03, .03), filoMat), 0, 2.0, -D / 2 + .15);
    en(g, new THREE.Mesh(new THREE.BoxGeometry(.03, .03, D - .1), filoMat), -IN * (W / 2 - .15), 1.1, 0);
    /* zócalo de luz al pie de la pared del fondo */
    en(g, new THREE.Mesh(new THREE.BoxGeometry(W - .3, .02, .02), filoMat), 0, .06, -D / 2 + .16);
    if (on) { const pl = new THREE.PointLight(col, 1.1, 10); pl.position.set(0, 3.6, .8); g.add(pl); }
    else { const pl = new THREE.PointLight(0xfff0dc, 2.4, 11); pl.position.set(0, 3.4, .8); g.add(pl); }
    /* el servidor de la sala, en la esquina del fondo que da al núcleo */
    const rx = IN * (W / 2 - .62), rz = -D / 2 + .55;
    const rack = caja(.74, 1.7, .6, new THREE.MeshStandardMaterial({ color: 0x0b0d19, roughness: .3, metalness: .65 }), .04); rack.position.set(rx, .85, rz); g.add(rack);
    const frente = new THREE.Mesh(new THREE.PlaneGeometry(.62, 1.56), new THREE.MeshStandardMaterial({ color: 0x121528, roughness: .4, metalness: .5 })); frente.position.set(rx, .85, rz + .305); g.add(frente);
    const ledsSala = [];
    for (let r = 0; r < 7; r++) {
      en(g, new THREE.Mesh(new THREE.PlaneGeometry(.56, .012), new THREE.MeshBasicMaterial({ color: 0x23273f })), rx, .2 + r * .2 - .05, rz + .307);
      for (let c2 = 0; c2 < 4; c2++) { const l = new THREE.Mesh(new THREE.PlaneGeometry(.05, .03), ledMat[1]); l.position.set(rx - .2 + c2 * .07, .2 + r * .2, rz + .309); g.add(l); ledsSala.push(l); }
      const ranura = new THREE.Mesh(new THREE.PlaneGeometry(.2, .05), new THREE.MeshBasicMaterial({ color: 0x07080f })); ranura.position.set(rx + .16, .2 + r * .2, rz + .309); g.add(ranura);
    }
    /* enchufe de datos encima del servidor, donde llega el cable del núcleo */
    const enchufe = new THREE.Mesh(new THREE.CylinderGeometry(.11, .14, .12, 24), new THREE.MeshStandardMaterial({ color: 0x0d0f1c, emissive: col, emissiveIntensity: on ? .7 : .15, metalness: .6, roughness: .3 })); enchufe.position.set(rx, 1.76, rz); g.add(enchufe);
    const anillo = new THREE.Mesh(new THREE.TorusGeometry(.16, .015, 8, 40), new THREE.MeshBasicMaterial({ color: col, toneMapped: false, transparent: true, opacity: on ? 1 : .35 })); anillo.rotation.x = Math.PI / 2; anillo.position.set(rx, 1.83, rz); g.add(anillo);
    rack.userData.sala = d; clicables.push(rack);
    /* cartel encima de la pared del fondo */
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 1.4), new THREE.MeshBasicMaterial({ transparent: true, toneMapped: false })); sign.position.set(0, 3.62, -D / 2 + .1); sign.rotation.x = -.2; g.add(sign);
    sign.userData.sala = d; plat.userData.sala = d; clicables.push(sign, plat);
    /* cable del núcleo al servidor */
    const fin = new THREE.Vector3(x + rx, ALTO + 1.86, z + rz);
    const dir = fin.clone().sub(NUC).setY(0).normalize();
    const ini = NUC.clone().add(dir.clone().multiplyScalar(1.3)).add(new THREE.Vector3(0, .15, 0));
    const tronco = cable(new THREE.CubicBezierCurve3(ini, ini.clone().add(dir.clone().multiplyScalar(2.2)).add(new THREE.Vector3(0, 1.1, 0)), fin.clone().add(new THREE.Vector3(0, 2.4, 0)).sub(dir.clone().multiplyScalar(.6)), fin), d.color, on ? .046 : .024, on ? 5 : 2);
    /* conector donde el cable sale de la burbuja */
    const conector = new THREE.Mesh(new THREE.TorusGeometry(.1, .025, 10, 28), new THREE.MeshBasicMaterial({ color: col, toneMapped: false, transparent: true, opacity: on ? 1 : .4 }));
    conector.position.copy(ini); conector.lookAt(ini.clone().add(dir)); scene.add(conector);
    /* mástil de recepción encima del servidor: destella cada vez que le llega un paquete */
    const mastil = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, .22, 8), M.marco); mastil.position.set(rx, 1.93, rz); g.add(mastil);
    const recMat = new THREE.MeshBasicMaterial({ color: col, toneMapped: false, transparent: true, opacity: on ? .9 : .35 });
    const receptor = new THREE.Mesh(new THREE.SphereGeometry(.07, 16, 16), recMat); receptor.position.set(rx, 2.06, rz); g.add(receptor);
    const destello = new THREE.Sprite(new THREE.SpriteMaterial({ map: brillo, color: col, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); destello.scale.setScalar(.9); destello.position.set(rx, 2.06, rz); g.add(destello);
    const tiraRack = new THREE.MeshBasicMaterial({ color: col, toneMapped: false, transparent: true, opacity: on ? .5 : .15 });
    en(g, new THREE.Mesh(new THREE.BoxGeometry(.02, 1.5, .02), tiraRack), rx + IN * .36, .85, rz + .31);
    /* muebles: cada sala con su carácter */
    const OUT = -IN;
    planta(g, OUT * (W / 2 - .55), D / 2 - .55, 1.05);
    if (on) {
      estanteria(g, OUT * (W / 2 - .6), -D / 2 + .4, 0, false);
      lampara(g, IN * (W / 2 - .5), D / 2 - .6);
    } else if (d.id === 'embudo') {
      alfombra(g, 3.4, 2.6, 0, .2, d.color);
      const mesa = caja(2.2, .07, 1.1, M.madera, .03); mesa.position.set(0, .74, .2); g.add(mesa);
      [-.8, .8].forEach((lx) => en(g, new THREE.Mesh(new THREE.BoxGeometry(.06, .72, .8), M.marco), lx, .36, .2));
      [[-.55, -.55, 0], [.55, -.55, 0], [-.55, .95, Math.PI], [.55, .95, Math.PI]].forEach(([sx, sz, ry]) => { const s2 = silla(); s2.position.set(sx, 0, sz + .2); s2.rotation.y = ry; s2.scale.setScalar(.9); s2.children.slice(0, 2).forEach((m) => { m.material = M.tela; }); g.add(s2); });
      /* las automatizaciones del embudo, cada una en su pantalla de pared */
      S.autos.forEach((a, i) => {
        const cv = document.createElement('canvas'); cv.width = 512; cv.height = 300;
        const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4;
        const px = (i - (S.autos.length - 1) / 2) * 2.7;
        const m = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.29), new THREE.MeshBasicMaterial({ map: tx, toneMapped: false })); m.position.set(px, 1.22, -D / 2 + .17); g.add(m);
        const fr = caja(2.3, 1.39, .05, M.marco, .02); fr.position.set(px, 1.22, -D / 2 + .14); fr.castShadow = false; g.add(fr);
        m.userData.sala = d; clicables.push(m);
        autosPared.push({ a, ctx: cv.getContext('2d'), tx, d });
      });
      planta(g, IN * (W / 2 - .5), D / 2 - .55, .9);
      lampara(g, OUT * (W / 2 - .5), -D / 2 + .6);
    } else if (d.id === 'redes') {
      alfombra(g, 3.6, 2.6, 0, .3, d.color);
      sofa(g, 0, 1.25, 0, new THREE.MeshStandardMaterial({ color: 0x3b2c55, roughness: .9 }));
      mesaBaja(g, 0, .1);
      cuadroPared(g, 2.2, 1.24, 0, 1.2, -D / 2 + .16, (c) => { const gr = c.createLinearGradient(0, 0, 440, 248); gr.addColorStop(0, '#2a1240'); gr.addColorStop(1, '#0d1030'); c.fillStyle = gr; c.fillRect(0, 0, 440, 248); c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.moveTo(200, 84); c.lineTo(200, 164); c.lineTo(266, 124); c.closePath(); c.fill(); });
      lampara(g, OUT * (W / 2 - .5), -D / 2 + .6);
      planta(g, IN * (W / 2 - .5), D / 2 - .55, .85);
      [-1, 1].forEach((sx) => cuadroPared(g, .8, 1.05, sx * 2.2, 1.25, -D / 2 + .16, (c) => { const gr = c.createLinearGradient(0, 0, 160, 210); gr.addColorStop(0, sx < 0 ? '#E25CFF' : '#3FD5FF'); gr.addColorStop(1, '#1a1440'); c.fillStyle = gr; c.fillRect(0, 0, 160, 210); c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.arc(80, 90, sx < 0 ? 34 : 24, 0, 7); c.fill(); c.fillRect(30, 150, 100, 10); c.fillRect(30, 170, 70, 10); }));
    } else {
      estanteria(g, OUT * (W / 2 - .4), -.6, OUT * Math.PI / 2, true);
      estanteria(g, OUT * (W / 2 - .4), .5, OUT * Math.PI / 2, true);
      const banco = caja(1.8, .08, .8, M.madera, .02); banco.position.set(0, .82, -.2); g.add(banco);
      [-.8, .8].forEach((lx) => en(g, new THREE.Mesh(new THREE.BoxGeometry(.06, .8, .7), M.marco), lx, .4, -.2));
      en(g, caja(.5, .4, .4, M.carton, .02), -.4, 1.06, -.25); en(g, caja(.36, .3, .3, M.carton, .02), .35, 1.01, -.15);
      en(g, caja(.6, .5, .5, M.carton, .02), .6, .25, 1.3, .3); en(g, caja(.5, .4, .45, M.carton, .02), .55, .7, 1.3, .1); en(g, caja(.55, .45, .5, M.carton, .02), -.2, .225, 1.5, -.2);
      lampara(g, IN * (W / 2 - .5), D / 2 - .6);
      planta(g, IN * (W / 2 - .5), -D / 2 + .55, .8);
      /* tablero de proyectos en la pared: columnas con notas */
      cuadroPared(g, 2.4, 1.1, -.2, 1.25, -D / 2 + .16, (c) => { c.fillStyle = '#e9e7f2'; c.fillRect(0, 0, 480, 220); ['Por hacer', 'En marcha', 'Entregado'].forEach((h, i) => { c.fillStyle = '#3a3d52'; c.font = '700 20px Manrope, sans-serif'; c.fillText(h, 22 + i * 155, 34); [0, 1, 2].slice(0, 3 - i % 2).forEach((k) => { c.fillStyle = ['#FFB547', '#3FD5FF', '#B7FF3C'][i]; c.fillRect(22 + i * 155, 52 + k * 52, 120, 40); }); }); });
    }
    /* reloj de pared de verdad en la sala con agentes */
    let reloj = null;
    if (on) {
      const cv = document.createElement('canvas'); cv.width = cv.height = 200;
      const rt = new THREE.CanvasTexture(cv); rt.colorSpace = THREE.SRGBColorSpace;
      const rm = new THREE.Mesh(new THREE.CircleGeometry(.32, 48), new THREE.MeshBasicMaterial({ map: rt, toneMapped: false })); rm.position.set(IN * (W / 2 - 1.18), 1.62, -D / 2 + .15); g.add(rm);
      const rf = new THREE.Mesh(new THREE.TorusGeometry(.32, .025, 8, 48), M.marco); rf.position.copy(rm.position); g.add(rf);
      reloj = { cv, rt };
    }
    const s = { d, g, sign, W, tronco, ledsSala, reloj, bus: null, banda, bandaBase, destello, tiraRack, recMat, flash: 0 };
    tronco.sala = s;
    salas.set(d.id, s);
    /* bots y sus líneas de luz empotradas en el suelo: del servidor a cada mesa, sin tapar nada */
    const Y = ALTO + .012, frente2 = 1.75;
    if (lista.length) {
      const extremo = (lista.length - 1) / 2 * PASO * OUT;
      const ruta = new THREE.CurvePath(); const pts = [new THREE.Vector3(x + rx, Y, z + rz + .32), new THREE.Vector3(x + rx, Y, z + frente2), new THREE.Vector3(x + extremo + OUT * .02, Y, z + frente2)];
      for (let i = 0; i < pts.length - 1; i++) ruta.add(new THREE.LineCurve3(pts[i], pts[i + 1]));
      s.bus = cable(ruta, d.color, .016, 0);
    }
    lista.forEach((a, i) => {
      const px = (i - (lista.length - 1) / 2) * PASO;
      const o = puesto(g, d, a, px); puestos.set(a.id, o);
      o.linea = cable(new THREE.LineCurve3(new THREE.Vector3(x + px, Y, z + frente2), new THREE.Vector3(x + px, Y, z + .1)), COL_EST.trabajando, .015, 0);
      o.linea.alma.material.uniforms.uN.value = 1.5; o.linea.halo.material.uniforms.uN.value = 1.5;
    });
  });
  /* encuadre de la vista general a partir de lo que ocupa la oficina */
  const cajaVista = new THREE.Box3(); salas.forEach((s) => cajaVista.expandByObject(s.g)); cajaVista.expandByPoint(new THREE.Vector3(0, 0, 3.5));
  const HOME = { p: new THREE.Vector3(), t: new THREE.Vector3() };
  const encajar = () => {
    const c = cajaVista.getCenter(new THREE.Vector3()), size = cajaVista.getSize(new THREE.Vector3());
    const vf = THREE.MathUtils.degToRad(camera.fov), hf = 2 * Math.atan(Math.tan(vf / 2) * camera.aspect);
    const dist = Math.max((size.x * 1.14) / (2 * Math.tan(hf / 2)), (size.z * .9) / (2 * Math.tan(vf / 2))) + 1.5;
    /* un poco a la derecha, para que la tarjeta de avisos de arriba a la izquierda no tape ninguna sala */
    const dx = 0;
    /* en vertical (móvil) la vista es más cenital, para aprovechar el alto de la pantalla */
    if (camera.aspect < .9) { HOME.t.set(c.x, 0, c.z - .6); HOME.p.set(c.x, dist * .93, c.z + dist * .38); }
    else { HOME.t.set(c.x + dx, 0, c.z - 2.4); HOME.p.set(c.x + dx, dist * .76, c.z + dist * .66); }
    /* la niebla empieza detrás de la oficina, así no se come las salas cuando la cámara está lejos */
    scene.fog.near = dist * 1.05 + 6; scene.fog.far = dist * 2.1 + 30; camera.far = dist * 3 + 60; camera.updateProjectionMatrix();
  };
  camera.aspect = W0() / H0(); camera.updateProjectionMatrix(); encajar();
  camera.position.copy(HOME.p).add(new THREE.Vector3(0, 10, 10));
  const target = HOME.t.clone(); camera.lookAt(target);
  const sb = cajaVista.clone().expandByScalar(4); Object.assign(sun.shadow.camera, { left: sb.min.x - 8, right: sb.max.x + 8, top: sb.max.z + 10, bottom: sb.min.z - 10 }); sun.shadow.camera.updateProjectionMatrix();

  function dibujaAuto(o) {
    const g = o.ctx, a = ag2(o.a.id) || o.a; o.a = a;
    const [c, txt] = ST[a.st] || ST.espera;
    g.fillStyle = '#0d1024'; g.fillRect(0, 0, 512, 300);
    g.fillStyle = hexA(o.d.color, .18); g.beginPath(); g.roundRect(30, 40, 120, 120, 30); g.fill();
    g.save(); g.translate(54, 64); g.scale(3, 3); g.strokeStyle = o.d.color; g.lineWidth = 2; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(new Path2D(GLIFOS[a.glifo] || GLIFOS.flow)); g.restore();
    g.fillStyle = '#FFFFFF'; g.font = '800 40px Manrope, sans-serif'; g.fillText(a.nombre, 174, 92);
    g.fillStyle = c; g.beginPath(); g.arc(184, 132, 9, 0, 7); g.fill();
    g.fillStyle = '#C9CBDA'; g.font = '600 26px Manrope, sans-serif'; g.fillText(a.st === 'espera' ? 'Atento' : txt, 202, 141);
    const dato = (a.datos || [])[0];
    if (dato) { g.fillStyle = 'rgba(255,255,255,.06)'; g.beginPath(); g.roundRect(30, 196, 452, 70, 16); g.fill(); g.fillStyle = '#8C8FA3'; g.font = '600 24px Manrope, sans-serif'; g.fillText(dato[0], 52, 240); g.fillStyle = '#FFFFFF'; g.font = '800 30px Manrope, sans-serif'; g.textAlign = 'right'; g.fillText(dato[1], 460, 242); g.textAlign = 'left'; }
    o.tx.needsUpdate = true;
  }
  const ag2 = (id) => S.autos.find((a) => a.id === id);
  /* de noche la oficina se oscurece y se encienden las lámparas (hora del ordenador de quien mira) */
  function luzDelDia() {
    const ah = new Date(), h = ah.getHours() + ah.getMinutes() / 60;
    const noche = h < 7 || h >= 21 ? 1 : h < 8.5 ? (8.5 - h) / 1.5 : h > 19.5 ? (h - 19.5) / 1.5 : 0;
    hemi.intensity = 1 - .38 * noche; sun.intensity = 1.35 - .75 * noche; renderer.toneMappingExposure = 1.2 - .1 * noche;
    lamparas.forEach((l) => { l.pant.emissiveIntensity = .12 + .55 * noche; l.charco.opacity = .18 + .3 * noche; });
  }
  const flotantes = [];
  function flotar(o, n) {
    const t2 = canvasTex(320, 110, (c) => { c.font = '800 76px Manrope, sans-serif'; c.textAlign = 'center'; c.lineWidth = 10; c.strokeStyle = 'rgba(6,7,13,.85)'; c.strokeText('+' + N(n), 160, 82); c.fillStyle = o.col; c.fillText('+' + N(n), 160, 82); });
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t2, transparent: true, depthWrite: false })); sp.scale.set(2, .69, 1);
    o.logo.getWorldPosition(sp.position); sp.position.y += .55; scene.add(sp); flotantes.push({ sp, k: 0 });
  }
  const pintaReloj = () => salas.forEach((s) => {
    if (!s.reloj) return; const g = s.reloj.cv.getContext('2d'), now = new Date();
    g.fillStyle = '#EFEDE7'; g.beginPath(); g.arc(100, 100, 100, 0, 7); g.fill();
    g.strokeStyle = '#2b2f50'; g.lineCap = 'round';
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.lineWidth = i % 3 ? 3 : 6; g.beginPath(); g.moveTo(100 + Math.sin(a) * 78, 100 - Math.cos(a) * 78); g.lineTo(100 + Math.sin(a) * 90, 100 - Math.cos(a) * 90); g.stroke(); }
    const h = (now.getHours() % 12 + now.getMinutes() / 60) / 12 * Math.PI * 2, m = now.getMinutes() / 60 * Math.PI * 2;
    g.lineWidth = 9; g.beginPath(); g.moveTo(100, 100); g.lineTo(100 + Math.sin(h) * 46, 100 - Math.cos(h) * 46); g.stroke();
    g.lineWidth = 6; g.beginPath(); g.moveTo(100, 100); g.lineTo(100 + Math.sin(m) * 70, 100 - Math.cos(m) * 70); g.stroke();
    g.fillStyle = s.d.color; g.beginPath(); g.arc(100, 100, 8, 0, 7); g.fill();
    s.reloj.rt.needsUpdate = true;
  });

  function refrescarEscena() {
    puestos.forEach((o) => {
      const a = ag(o.a.id); if (!a) return; o.a = a;
      if (o.prevHoy !== undefined && a.hoy > o.prevHoy) flotar(o, a.hoy - o.prevHoy);
      o.prevHoy = a.hoy;
      o.rb.r.visible = a.st !== 'apagado';
      const v = vis(a.st);
      o.rb.ojoMat.color.set(v === 'dormido' ? '#2a2d3e' : COL_EST[v] || COL_EST.dormido);
      o.rb.nucleoMat.color.copy(o.rb.ojoMat.color);
      o.halo.material.opacity = v === 'trabajando' ? .22 : v === 'espera' ? .1 : v === 'error' ? .18 : 0;
      o.halo.material.color.set(COL_EST[v] || COL_EST.dormido);
      o.logoMat.emissiveIntensity = v === 'trabajando' ? .7 : v === 'espera' ? .4 : v === 'error' ? .5 : .1;
      o.logoMat.color.set(v === 'apagado' ? '#3a3d52' : o.col); o.logoMat.emissive.set(v === 'error' ? '#FF5E6C' : v === 'apagado' ? '#000000' : o.col);
      o.cono.material.opacity = v === 'trabajando' ? .14 : v === 'apagado' ? 0 : .05;
      o.pad.material.color.set(COL_EST[v] || COL_EST.dormido); o.pad.material.opacity = v === 'trabajando' ? .9 : v === 'espera' || v === 'error' ? .8 : v === 'dormido' ? .45 : .25;
      o.tiraMat.color.set(COL_EST[v] || COL_EST.dormido);
      o.baliza.visible = v === 'error';
      if (o.linea) ponOn(o.linea, v === 'trabajando' ? 1 : v === 'error' ? 0 : .12);
      dibujaPantalla(o, 0);
    });
    salas.forEach((s) => {
      const d = s.d; let partes = [['Sin agentes aún', '#4a4d62']];
      if (d.activo) {
        const lista = agsDe(d.id), n = pendientes().filter((p) => p.a.dept === d.id).length, err = lista.some((a) => a.st === 'error');
        const tr = lista.filter((a) => a.st === 'trabajando').length;
        partes = [[tr ? `${tr} de ${lista.length} trabajando` : `${lista.length} ${lista.length === 1 ? 'bot' : 'bots'} en reposo`, tr ? '#3DDC84' : '#8E91A8']];
        if (err) partes.push(['Error', '#FF5E6C']); else if (n) partes.push([n === 1 ? '1 aviso' : n + ' avisos', '#FFB547']);
        ponOn(s.tronco, tr ? 1 : .25); if (s.bus) ponOn(s.bus, tr ? 1 : .15);
      }
      if (s.sign.material.map) s.sign.material.map.dispose(); s.sign.material.map = cartel(d, partes); s.sign.material.needsUpdate = true;
    });
    orbeMat.uniforms.uErr.value = pendientes().some((p) => p.err) ? .55 : 0;
    pintaReloj(); luzDelDia(); autosPared.forEach(dibujaAuto);
    renderer.shadowMap.needsUpdate = true;
  }

  /* ---------- cámara con clics ---------- */
  let fly = null, intro = calma ? null : { k: 0 }, deriva = 0;
  const volar = (p, t) => { intro = null; if (!Number.isFinite(camera.position.x)) { camera.position.copy(p); target.copy(t); } fly = { p0: camera.position.clone(), t0: target.clone(), p1: p.clone(), t1: t.clone(), k: 0 }; };
  const enIntro = (e) => { const off = HOME.p.clone().sub(HOME.t), ang = (1 - e) * 1.1; off.applyAxisAngle(new THREE.Vector3(0, 1, 0), ang).multiplyScalar(1 + (1 - e) * .35); camera.position.copy(HOME.t).add(off); camera.position.y += (1 - e) * 6; target.copy(HOME.t).add(new THREE.Vector3(0, (1 - e) * 2, 0)); };
  if (intro) enIntro(0); else { camera.position.copy(HOME.p); target.copy(HOME.t); }
  const ray = new THREE.Raycaster(), m2 = new THREE.Vector2();
  const tocar = (e) => { const r = renderer.domElement.getBoundingClientRect(); m2.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(m2, camera); return ray.intersectObjects(clicables, false)[0]; };
  let hover = null, ultimoMov = 0;
  const ficha = document.createElement('div'); ficha.className = 'pb-of-hov'; wrap.append(ficha);
  const fichaDe = (h) => {
    if (!h) return null;
    const u = h.object.userData;
    if (u.puesto) { const a = u.puesto.a, [c, txt] = ST[a.st] || ST.espera; return { k: u.puesto.d.nombre, b: a.nombre, c, txt: txt + (a.cupo ? ` · ${N(a.hoy)} de ${a.cupo} hoy` : a.hoy ? ` · ${N(a.hoy)} hoy` : ''), m: a.motivo }; }
    if (u.sala) { const d = u.sala, l = agsDe(d.id), tr = l.filter((a) => a.st === 'trabajando').length; return { k: 'Departamento', b: d.nombre, c: d.activo ? (tr ? '#3DDC84' : '#8E91A8') : '#5C5F73', txt: d.activo ? `${tr} de ${l.length} trabajando` : 'Sin agentes aún', m: d.objetivo }; }
    if (u.nucleo) { const pe = pendientes(); return { k: 'El núcleo', b: 'PEBAI', c: pe.some((p) => p.err) ? '#FF5E6C' : pe.length ? '#FFB547' : '#3DDC84', txt: pe.length ? (pe.length === 1 ? '1 aviso' : pe.length + ' avisos') : 'Todo en orden', m: 'Pincha para ver el resumen de la oficina' }; }
    return null;
  };
  renderer.domElement.addEventListener('pointermove', (e) => {
    const r = renderer.domElement.getBoundingClientRect();
    ficha.style.transform = `translate(${Math.min(e.clientX - r.left + 16, r.width - 260)}px, ${e.clientY - r.top + 18}px)`;
    if (performance.now() - ultimoMov < 50) return; ultimoMov = performance.now();
    const h = tocar(e); const o = h && h.object.userData.puesto ? h.object.userData.puesto : null;
    const f = foco ? null : fichaDe(h);
    renderer.domElement.style.cursor = h && (o || h.object.userData.sala || h.object.userData.nucleo) ? 'pointer' : 'default';
    if (f) { ficha.innerHTML = `<small>${esc(f.k)}</small><b>${esc(f.b)}</b><span><i style="background:${f.c}"></i>${esc(f.txt)}</span>` + (f.m ? `<em>${esc(f.m)}</em>` : ''); ficha.classList.add('on'); } else ficha.classList.remove('on');
    hover = o; salaHover = o ? o.d.id : h && h.object.userData.sala ? h.object.userData.sala.id : null;
  });
  renderer.domElement.addEventListener('pointerleave', () => { ficha.classList.remove('on'); hover = null; salaHover = null; });
  renderer.domElement.addEventListener('click', (e) => {
    if (cine) { alternarCine(); return; }
    const h = tocar(e);
    ficha.classList.remove('on');
    if (h && h.object.userData.puesto) { abrirAgente(h.object.userData.puesto.a.id); return; }
    if (h && h.object.userData.sala) { abrirSala(h.object.userData.sala); return; }
    if (h && h.object.userData.nucleo) { abrirNucleo(); return; }
    if (side.classList.contains('on') || foco) cerrar();
  });
  new ResizeObserver(() => {
    if (!W0()) return; camera.aspect = W0() / H0(); camera.updateProjectionMatrix(); encajar();
    renderer.setSize(W0(), H0()); composer.setSize(W0(), H0()); labels.setSize(W0(), H0());
    if (!foco) { if (!intro) volar(HOME.p, HOME.t); } else if (foco.agente) enfocarAgente(foco.agente); else if (foco.nucleo) abrirNucleo(); else if (foco.sala) enfocarSala(DEPTS.find((x) => x.id === foco.sala));
  }).observe(wrap);

  const clock = new THREE.Clock(); let ultPantalla = 0, tPrev = 0, ledPaso = -1, minuto = -1, medida = { n: 0, t: 0, prev: 0 };
  function tick(now) {
    requestAnimationFrame(tick);
    if (document.hidden || !enPagina() || !W0()) { medida.prev = 0; return; }
    if (medida.prev) { const dt2 = now - medida.prev; if (dt2 < 250) { medida.n++; medida.t += dt2; } }
    medida.prev = now;
    if (medida.n >= 90) { if (medida.t / medida.n > 25 && Q > .6) { Q = Math.max(.6, Q - .2); composer.setPixelRatio(Q); composer.setSize(W0(), H0()); } medida.n = 0; medida.t = 0; }
    const t = clock.getElapsedTime(), dtReal = Math.min(.5, t - tPrev), dt = Math.min(.05, dtReal); tPrev = t;
    /* núcleo */
    const k = pensando ? 3 : 1, flota = Math.sin(t * 1.1) * .07 + (pensando ? Math.sin(t * 7) * .03 : 0), y = NUC.y + flota;
    orbeMat.uniforms.uT.value = t; orbeMat.uniforms.uK.value += (k - orbeMat.uniforms.uK.value) * .04;
    orbe.position.y = y; orbe.rotation.y += dt * .25 * k; halo.position.y = y;
    halo.material.opacity = (pensando ? .5 : .32) + Math.sin(t * (pensando ? 8 : 1.6)) * .06;
    const haciaCam = camera.position.clone().sub(NUC).normalize();
    fachada.forEach((m) => { m.position.set(NUC.x, y, NUC.z).add(haciaCam.clone().multiplyScalar(1.29)); m.lookAt(camera.position); });
    const lat = 1 + Math.sin(t * (pensando ? 6 : 1.8)) * (pensando ? .05 : .025); mark.scale.setScalar(lat);
    nubes[0].rotation.y += dt * .22 * k; nubes[1].rotation.y -= dt * .3 * k; nubes.forEach((n) => { n.position.y = y; n.scale.setScalar(pensando ? .9 + Math.sin(t * 5) * .04 : 1); });
    orbitas.forEach((o, i) => { o.position.y = y; o.rotation.z += dt * (.45 + i * .2) * k * (i % 2 ? -1 : 1); });
    corona.rotation.y -= dt * .15 * k;
    /* con una sala o un bot abierto, los carteles de las demás salas se apagan para no tapar */
    salas.forEach((sa) => { const obj = Math.min(1, sa.bandaBase + (salaHover === sa.d.id ? .45 : 0)); sa.banda.material.opacity += (obj - sa.banda.material.opacity) * .15; });
    const salaFoco = foco ? (foco.sala || (foco.agente && puestos.get(foco.agente) && puestos.get(foco.agente).d.id) || null) : null;
    salas.forEach((sa) => { const obj = !salaFoco || salaFoco === sa.d.id ? 1 : .08; sa.sign.material.opacity += (obj - sa.sign.material.opacity) * .12; });
    columna.material.uniforms.uT.value = t; polvo.rotation.y = t * .01; polvo.position.y = Math.sin(t * .2) * .3;
    coreLight.intensity = pensando ? 10 + Math.sin(t * 9) * 3 : 7 + Math.sin(t * 1.4) * 1.2;
    const ritmo = pensando ? 1.2 : .45;
    ondas.forEach((o) => { o.k = (o.k + dt * ritmo / 1.5) % 1; o.m.scale.setScalar(2.4 + o.k * (PLAZA - 2.5)); o.m.material.opacity = (1 - o.k) * (1 - o.k) * .26; });
    /* cables y paquetes de datos */
    enlaces.forEach((c) => { c.alma.material.uniforms.uT.value = t * (pensando ? 2 : 1); c.halo.material.uniforms.uT.value = t * (pensando ? 2 : 1); });
    paquetes.forEach((p) => {
      const activo = p.dir > 0 || p.c.on > .5; p.sp.visible = activo; if (!activo) return;
      const antes = p.k;
      p.k = (p.k + dt * p.v * (p.c.on > .5 ? 1 : .45) * (pensando ? 2.2 : 1)) % 1;
      if (p.k < antes) { if (p.dir > 0 && p.c.sala) p.c.sala.flash = 1; }
      p.c.curva.getPointAt(p.dir > 0 ? p.k : 1 - p.k, p.sp.position);
      p.sp.material.opacity = Math.sin(p.k * Math.PI) * (p.c.on > .5 ? 1 : .5);
    });
    for (let i = flotantes.length - 1; i >= 0; i--) { const f = flotantes[i]; f.k += dtReal / 2.8; f.sp.position.y += dtReal * .5; f.sp.material.opacity = f.k < .15 ? f.k / .15 : 1 - Math.pow((f.k - .15) / .85, 2); if (f.k >= 1) { scene.remove(f.sp); f.sp.material.map.dispose(); f.sp.material.dispose(); flotantes.splice(i, 1); } }
    salas.forEach((sa) => {
      sa.flash = Math.max(0, sa.flash - dt * 2.2);
      sa.destello.material.opacity = sa.flash * .9; sa.destello.scale.setScalar(.6 + sa.flash * .7);
      sa.tiraRack.opacity = (sa.d.activo ? .45 : .15) + sa.flash * .5;
    });
    /* luces de los servidores y relojes */
    if (Math.floor(t * 5) !== ledPaso) {
      ledPaso = Math.floor(t * 5);
      salas.forEach((s) => { const trab = s.d.activo && agsDe(s.d.id).some((a) => a.st === 'trabajando'); s.ledsSala.forEach((l, i) => { l.material = !s.d.activo ? (i % 9 === 0 ? ledMat[0] : ledMat[1]) : trab ? (Math.random() > .4 ? (i % 4 === 3 ? ledMat[2] : ledMat[0]) : ledMat[1]) : (i % 4 === 0 ? ledMat[0] : ledMat[1]); }); });
    }
    if (new Date().getMinutes() !== minuto) { minuto = new Date().getMinutes(); pintaReloj(); luzDelDia(); }
    /* robots */
    const animPant = t - ultPantalla > .12; if (animPant) ultPantalla = t;
    puestos.forEach((o) => {
      const st = vis(o.a.st), rb = o.rb, tt = t + o.t0;
      if (animPant && ['trabajando', 'espera', 'error'].includes(st)) dibujaPantalla(o, tt);
      o.hl += ((hover === o ? 1 : 0) - o.hl) * .15;
      o.logo.scale.setScalar(1 + o.hl * .22);
      const vivo = st === 'trabajando' || st === 'espera' || st === 'error';
      o.logo.rotation.y = vivo ? Math.sin(tt * .9) * .55 : Math.sin(tt * .3) * .15;
      o.logo.position.y = 2.82 + (vivo ? Math.sin(tt * 1.6) * .06 : -.06);
      if (st === 'trabajando') o.logoMat.emissiveIntensity = .6 + Math.sin(tt * 4) * .15 + o.hl * .4;
      else if (o.hl > .02 && st !== 'error') o.logoMat.emissiveIntensity = (st === 'apagado' ? 0 : .1) + o.hl * .7;
      else if (st === 'error') o.logoMat.emissiveIntensity = Math.sin(t * 8) > 0 ? .9 : .2;
      const [bi, bd] = rb.brazos;
      rb.cuello.rotation.set(0, 0, 0); bi.rotation.set(0, 0, 0); bd.rotation.set(0, 0, 0); rb.r.position.y = -.08;
      o.zs.forEach((z) => { z.z.material.opacity = 0; });
      rb.r.rotation.x = 0; rb.r.rotation.y = 0;
      o.luz += ((st === 'trabajando' ? 1 : 0) - o.luz) * Math.min(1, dt * 3);
      o.haz.material.uniforms.uO.value = o.luz; o.foco.material.opacity = o.luz * .45; o.charcoF.material.opacity = o.luz * .6;
      o.bombillaMat.color.setRGB(.23 + .77 * o.luz, .21 + .66 * o.luz, .31 + .3 * o.luz);
      o.datos.forEach((dd) => { const kk = (tt * .45 + dd.o) % 1; dd.sp.position.set(dd.x, 2.0 + kk * .55, -.24); dd.sp.material.opacity = st === 'trabajando' ? Math.sin(kk * Math.PI) * .85 : 0; });
      if (st === 'trabajando') {
        // ráfagas de tecleo con pausas cortas para leer la pantalla, como una persona
        const rafaga = Math.sin(tt * .8) > -.55 ? 1 : 0, ti = tt * 17;
        bi.rotation.x = 1.22 + rafaga * Math.max(0, Math.sin(ti)) * .2; bd.rotation.x = 1.22 + rafaga * Math.max(0, Math.sin(ti + Math.PI)) * .2;
        bi.rotation.z = .08 + Math.sin(tt * 2.3) * .05; bd.rotation.z = -.08 - Math.sin(tt * 2.1) * .05;
        rb.r.rotation.x = -.07; rb.r.position.y = -.08 + rafaga * Math.abs(Math.sin(ti)) * .006;
        rb.cuello.rotation.x = -.16 + (rafaga ? Math.sin(ti * .5) * .015 : -.05); rb.cuello.rotation.y = Math.sin(tt * .9) * (rafaga ? .1 : .22);
        rb.antena.material.color.set(Math.sin(tt * 6) > 0 ? COL_EST.trabajando : '#ffffff');
        o.tecladoMat.color.setRGB(.08 + rafaga * .16 * Math.abs(Math.sin(ti * 1.3)), .1 + rafaga * .5 * Math.abs(Math.sin(ti * 1.3)), .16 + rafaga * .22 * Math.abs(Math.sin(ti * 1.3)));
        o.halo.material.opacity = .16 + Math.sin(tt * 3) * .05;
        o.pad.material.opacity = .75 + Math.sin(tt * 2) * .15;
      } else if (st === 'espera') {
        o.tecladoMat.color.set(0x14172a);
        bi.rotation.x = .35; bd.rotation.x = .35;
        rb.cuello.rotation.y = Math.sin(tt * .55) * .55; rb.cuello.rotation.x = .08;
      } else if (st === 'dormido') {
        o.tecladoMat.color.set(0x14172a);
        rb.cuello.rotation.x = -.75; bi.rotation.x = 1.35; bd.rotation.x = 1.35; rb.r.position.y = -.12 + Math.sin(tt * 1.2) * .01;
        o.zs.forEach((z) => { const kk = (tt * .32 + z.o) % 1; z.z.position.set(.2 + kk * .45, 1.55 + kk * .8, .55); z.z.material.opacity = Math.sin(kk * Math.PI) * .9; z.z.scale.setScalar(.16 + kk * .18); });
      } else if (st === 'error') {
        rb.cuello.rotation.y = Math.sin(tt * 3) * .5; bi.rotation.z = .6; bd.rotation.z = -.6; bi.rotation.x = .4; bd.rotation.x = .4;
        o.baliza.visible = Math.sin(t * 8) > -.1;
      }
    });
    if (intro) { intro.k = Math.min(1, intro.k + dtReal / 3.2); const e = intro.k < .5 ? 4 * intro.k ** 3 : 1 - Math.pow(-2 * intro.k + 2, 3) / 2; enIntro(e); if (intro.k >= 1) { intro = null; deriva = 0; } }
    if (fly) { fly.k = Math.min(1, fly.k + dtReal / 1.1); const e = 1 - Math.pow(1 - fly.k, 3); camera.position.lerpVectors(fly.p0, fly.p1, e); target.lerpVectors(fly.t0, fly.t1, e); if (fly.k >= 1) { fly = null; deriva = 0; } }
    if (cine) { cineAng += dtReal * .07; const off = HOME.p.clone().sub(HOME.t).applyAxisAngle(new THREE.Vector3(0, 1, 0), cineAng).multiplyScalar(.82); camera.position.copy(HOME.t).add(off); camera.position.y += Math.sin(t * .2) * .6; target.copy(HOME.t).add(new THREE.Vector3(0, .6, 0)); fly = null; intro = null; }
    else if (!fly && !intro && !foco && !calma) { deriva = Math.min(1, deriva + dt / 2.5); const off = HOME.p.clone().sub(HOME.t).applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.sin(t * .11) * .045 * deriva); camera.position.copy(HOME.t).add(off); camera.position.y += Math.sin(t * .17) * .25 * deriva; target.copy(HOME.t); }
    camera.lookAt(target);
    composer.render(); labels.render(scene, camera);
  }
  G = { THREE, volar, HOME, refrescarEscena, puestos, salas, NUC };
  refrescarEscena(); requestAnimationFrame(tick);
}

/* ============ ciclo ============ */
async function refrescar() {
  try {
    if (!(await cargar())) return;
    pintaHud();
    if (!G) await montar(); else G.refrescarEscena();
    if (side.classList.contains('on') && foco && foco.agente) abrirAgente(foco.agente);
  } catch (e) { toast(e.message || 'No se ha podido cargar la oficina.', true); }
}
const alEntrar = () => { if (enPagina()) refrescar(); };
document.addEventListener('pb:page', alEntrar);
document.addEventListener('pb:agview', alEntrar);
setInterval(() => { if (!document.hidden && enPagina() && !side.classList.contains('on')) refrescar(); }, 60000);
alEntrar();
}
