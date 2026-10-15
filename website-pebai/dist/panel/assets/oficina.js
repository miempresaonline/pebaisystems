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
const S = { csrf: app.dataset.csrf, agentes: [], hist: [], verTodo: false };
const ST = {
  trabajando: ['#3DDC84', 'Trabajando'], espera: ['#FFB547', 'En espera'], dormido: ['#8E91A8', 'Durmiendo'],
  error: ['#FF5E6C', 'Con error'], apagado: ['#5C5F73', 'Apagado'], pausado: ['#8E84FF', 'En pausa'],
};
/* Departamentos de la oficina, en orden. Para añadir uno basta con ponerlo aquí (y sus agentes en el servidor). */
const DEPTS = [
  { id: 'captacion', nombre: 'Captación', color: '#B7FF3C', activo: true, objetivo: 'Encontrar empresas y abrir conversación con ellas' },
  { id: 'embudo', nombre: 'Embudo', color: '#8E84FF', activo: false, objetivo: 'Llevar cada solicitud hasta la sesión técnica' },
  { id: 'redes', nombre: 'Redes', color: '#E25CFF', activo: false, objetivo: 'Publicar contenido que traiga solicitudes' },
  { id: 'operaciones', nombre: 'Operaciones', color: '#3FD5FF', activo: false, objetivo: 'Proyectos y entregas a clientes' },
];
const FONDO = { scraper: '#1a7f45', whatsapp: '#1fae58', email: '#c5372b', fases: '#4b40c9', recordatorios: '#4b40c9', calcom: '#4b40c9' };
const GLIFOS = { flow: 'M3 3h7v7H3zM14 14h7v7h-7zM10 6.5h3.5a3 3 0 0 1 3 3V14', bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0', cal: 'M3 5h18v16H3zM16 3v4M8 3v4M3 10h18' };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const brand = (k) => (window.PB_ICONS && window.PB_ICONS.brands && window.PB_ICONS.brands[k]) ? window.PB_ICONS.brands[k].d : null;
const N = (n) => new Intl.NumberFormat('es-ES').format(n || 0);
const hora = (ts) => String(ts || '').slice(11, 16);
const toast = (m, err) => { const t = $('#pb-toast'); if (!t) return; $('span', t).textContent = m; t.classList.toggle('err', !!err); t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 3200); };
const vis = (st) => st === 'pausado' ? 'dormido' : st;
const enPagina = () => document.body.dataset.page === PAGE && !document.body.classList.contains('pb-ag-ajustes');

/* ============ datos ============ */
async function cargar() {
  const r = await fetch(BASE + '?oficina=1', { credentials: 'same-origin', cache: 'no-store' });
  if (r.status === 401) { location.reload(); return false; }
  let j; try { j = await r.json(); } catch (e) { throw new Error('La oficina no ha respondido bien.'); }
  if (!j.ok) throw new Error(j.error || 'No se ha podido cargar la oficina.');
  /* en la oficina solo salen los bots de verdad (los de los departamentos con agentes) */
  S.agentes = j.agentes.filter((a) => DEPTS.some((d) => d.activo && d.id === a.dept)); S.csrf = j.csrf; return true;
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
  const pend = pendientes();
  hud.replaceChildren();
  if (!pend.length) { hud.innerHTML = '<div class="pb-of-todo ok"><i></i><span>Todo en orden. Nada espera por vosotros.</span></div>'; return; }
  const c = document.createElement('div'); c.className = 'pb-of-todo';
  const err = pend.filter((p) => p.err).length;
  c.innerHTML = `<div class="h"><span class="n ${err ? 'err' : ''}">${pend.length}</span><b>${pend.length === 1 ? 'Necesita a una persona' : 'Necesitan a una persona'}</b></div>`;
  pend.slice(0, 4).forEach(({ a, txt, err: e }) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'it' + (e ? ' err' : '');
    b.innerHTML = tileHtml(a, 't') + `<span class="x"><b>${esc(a.nombre)}</b><span>${esc(txt)}</span></span><svg class="go" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m9 6 6 6-6 6"/></svg>`;
    b.onclick = (ev) => { ev.stopPropagation(); abrirAgente(a.id); }; c.append(b);
  });
  if (pend.length > 4) { const m = document.createElement('div'); m.className = 'mas'; m.textContent = `y ${pend.length - 4} más`; c.append(m); }
  hud.append(c);
}

const q = (t, cuerpo) => `<div class="pb-of-q"><h4>${t}</h4>${cuerpo}</div>`;
function abrirAgente(id) {
  const a = ag(id); if (!a) return;
  const d = DEPTS.find((x) => x.id === a.dept); enfocarAgente(a.id);
  const [c, txt] = ST[a.st] || ST.espera;
  const pct = a.cupo ? Math.min(100, Math.round(a.hoy / a.cupo * 100)) : 0;
  const hist = (a.actividad || []).slice(0, S.verTodo ? 30 : 6);
  sideIn.innerHTML = `<div class="k">${esc(d.nombre)}</div><h2>${tileHtml(a)}${esc(a.nombre)}</h2><div class="rol">${esc(a.rol || '')}</div>
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
  const more = $('#pb-of-more'); if (more) more.onclick = (e) => { e.stopPropagation(); S.verTodo = !S.verTodo; abrirAgente(a.id); };
  mostrar();
}
function abrirSala(d) {
  enfocarSala(d);
  if (!d.activo) { sideIn.innerHTML = `<div class="k">Departamento</div><h2>${esc(d.nombre)}</h2><div class="rol">${esc(d.objetivo)}</div><div class="pb-of-state" style="--c:#5C5F73"><i></i><div><b>Sin agentes todavía</b><span>Cuando montemos un bot para este departamento aparecerá aquí, conectado al núcleo.</span></div></div>`; mostrar(); return; }
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
  if (G) { const panel = wrap.clientWidth > 760 ? 2.4 : 0; G.volar(new G.THREE.Vector3(panel, 5.2, 8.2), new G.THREE.Vector3(panel, 2, 0)); }
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
function mostrar() { side.classList.add('on'); side.scrollTop = 0; setTimeout(() => side.querySelectorAll('.bar i').forEach((b) => { b.style.width = b.dataset.w; }), 300); }
function cerrar() { side.classList.remove('on'); foco = null; S.verTodo = false; wrap.classList.remove('foco'); if (G) G.volar(G.HOME.p, G.HOME.t); }
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && enPagina() && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) cerrar(); });

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
['pb-of-ask', 'pb-of-hud', 'pb-of-side'].forEach((id) => { const n = document.getElementById(id); if (n) n.addEventListener('click', (e) => e.stopPropagation()); });

/* ============ escena 3D ============ */
let G = null, foco = null, pensando = false;
function enfocarSala(d) {
  foco = { sala: d.id }; wrap.classList.add('foco'); if (!G) return;
  const s = G.salas.get(d.id); if (!s) return;
  const f = Math.max(1, s.W / 8.4), panel = wrap.clientWidth > 760 ? 3.3 * f : 0;
  const c = s.g.position.clone();
  G.volar(c.clone().add(new G.THREE.Vector3(panel, 9.5 * f, 10.5 * f)), c.clone().add(new G.THREE.Vector3(panel, .8, -.2)));
}
function enfocarAgente(id) {
  foco = { agente: id }; wrap.classList.add('foco'); if (!G) return;
  const o = G.puestos.get(id); if (!o) return;
  const w = new G.THREE.Vector3(); o.p.getWorldPosition(w);
  const panel = wrap.clientWidth > 760 ? 2.3 : 0;
  G.volar(w.clone().add(new G.THREE.Vector3(panel, 6.2, 7.4)), w.clone().add(new G.THREE.Vector3(panel, .9, -.6)));
}

async function montar() {
  const THREE = await import('three');
  const { CSS2DRenderer, CSS2DObject } = await import('three/addons/renderers/CSS2DRenderer.js');
  const { EffectComposer } = await import('three/addons/postprocessing/EffectComposer.js');
  const { RenderPass } = await import('three/addons/postprocessing/RenderPass.js');
  const { UnrealBloomPass } = await import('three/addons/postprocessing/UnrealBloomPass.js');
  const { OutputPass } = await import('three/addons/postprocessing/OutputPass.js');
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  /* si la sección aún no tiene tamaño (pestaña oculta), esperar: con ancho 0 la cámara saldría NaN */
  while (!wrap.clientWidth || !wrap.clientHeight) await new Promise((r) => setTimeout(r, 250));
  const load = $('#pb-of-load'); if (load) load.remove();
  const W0 = () => wrap.clientWidth, H0 = () => wrap.clientHeight;
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  const PR = Math.min(devicePixelRatio, 1.5);
  renderer.setPixelRatio(PR); renderer.setSize(W0(), H0());
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap; renderer.shadowMap.autoUpdate = false;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.25;
  wrap.prepend(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x07080f); scene.fog = new THREE.Fog(0x07080f, 44, 90);
  const camera = new THREE.PerspectiveCamera(32, W0() / H0(), .1, 220);
  const labels = new CSS2DRenderer(); labels.setSize(W0(), H0()); labels.domElement.className = 'pb-of-lbl'; wrap.append(labels.domElement);
  /* calidad: la escena se dibuja a esta resolución y baja sola si el ordenador no llega a ~40 FPS */
  let Q = Math.min(devicePixelRatio, 1.25);
  const composer = new EffectComposer(renderer); composer.setPixelRatio(Q);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(W0() / 2, H0() / 2), .45, .4, .9)); composer.addPass(new OutputPass());

  scene.add(new THREE.HemisphereLight(0xcfd2ff, 0x15172b, 1.05));
  const sun = new THREE.DirectionalLight(0xffffff, 1.4); sun.position.set(-12, 26, 16); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); sun.shadow.bias = -.0004; sun.shadow.radius = 3; scene.add(sun);

  const canvasTex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  const floorTex = canvasTex(512, 512, (g) => { g.fillStyle = '#0c0e1b'; g.fillRect(0, 0, 512, 512); g.strokeStyle = 'rgba(126,115,255,.09)'; g.lineWidth = 2; for (let i = 0; i <= 512; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 512); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(512, i); g.stroke(); } });
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(18, 18);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(150, 150), new THREE.MeshStandardMaterial({ map: floorTex, roughness: .6, metalness: .3 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

  /* ---------- enlaces de datos: la información sale del núcleo (violeta) y vuelve de cada sala (su color) ---------- */
  const enlaceMat = (colSala) => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uT: { value: 0 }, uA: { value: new THREE.Color('#9C93FF') }, uB: { value: new THREE.Color(colSala) }, uOn: { value: 0 } },
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'varying vec2 vUv;uniform float uT;uniform vec3 uA;uniform vec3 uB;uniform float uOn;'
      + 'float pul(float f){return smoothstep(0.,.04,f)*smoothstep(.2,.04,f);}'
      + 'void main(){float sp=.25+.35*uOn;float ida=pul(fract(vUv.x*4.-uT*sp));float vuelta=pul(fract((1.-vUv.x)*4.-uT*sp+.5))*uOn;'
      + 'vec3 c=mix(uA,uB,vUv.x)*.35+uA*ida*1.8+uB*vuelta*1.8;gl_FragColor=vec4(c,.16+.1*uOn+(ida+vuelta)*.85);}',
  });
  const enlaces = [];
  const enlace = (a, b, alto, col, radio) => {
    const ctrl = a.clone().lerp(b, .5); ctrl.y += alto;
    const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, ctrl, b), 64, radio, 8), enlaceMat(col)); scene.add(m); enlaces.push(m); return m;
  };

  /* ---------- núcleo: PEBAI, la IA que lo mueve todo ---------- */
  const NUC = new THREE.Vector3(0, 2.25, 0);
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.9, .34, 64), new THREE.MeshStandardMaterial({ color: 0x141830, roughness: .3, metalness: .7 }));
  pedestal.position.y = .17; pedestal.userData.nucleo = true; pedestal.castShadow = pedestal.receiveShadow = true; scene.add(pedestal);
  const filo = new THREE.Mesh(new THREE.TorusGeometry(1.56, .022, 8, 96), new THREE.MeshBasicMaterial({ color: 0x9C93FF, toneMapped: false })); filo.rotation.x = Math.PI / 2; filo.position.y = .345; scene.add(filo);
  const haz = new THREE.Mesh(new THREE.CylinderGeometry(.08, .32, .9, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0x9C93FF, transparent: true, opacity: .22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); haz.position.y = .8; scene.add(haz);
  const orbeMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uT: { value: 0 }, uA: { value: new THREE.Color('#7E73FF') }, uB: { value: new THREE.Color('#B7FF3C') }, uErr: { value: 0 }, uK: { value: 1 } },
    vertexShader: 'varying vec3 vN;varying vec3 vV;varying vec3 vP;void main(){vP=position;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
    fragmentShader: 'varying vec3 vN;varying vec3 vV;varying vec3 vP;uniform float uT;uniform vec3 uA;uniform vec3 uB;uniform float uErr;uniform float uK;'
      + 'void main(){float fr=pow(1.-abs(dot(vN,vV)),2.3);'
      + 'float sw=sin(vP.y*7.+uT*1.6*uK+sin(vP.x*5.+uT*.9*uK)*1.5+cos(vP.z*4.-uT*uK))*.5+.5;'
      + 'vec3 c=mix(uA,uB,smoothstep(.55,1.,sw)*.55);c=mix(c,vec3(1.,.37,.42),uErr);'
      + 'gl_FragColor=vec4(c*(.45+fr*1.9+sw*.25),fr*.95+.1+sw*.12);}',
  });
  const orbe = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), orbeMat); orbe.position.copy(NUC); orbe.userData.nucleo = true; scene.add(orbe);
  const interior = new THREE.Mesh(new THREE.SphereGeometry(.3, 32, 24), new THREE.MeshBasicMaterial({ color: 0xa79fff, transparent: true, opacity: .55, toneMapped: false })); interior.position.copy(NUC); scene.add(interior);
  const haloTex = canvasTex(128, 128, (g) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(142,132,255,.55)'); r.addColorStop(.45, 'rgba(126,115,255,.18)'); r.addColorStop(1, 'rgba(126,115,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); });
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.scale.setScalar(5.2); halo.position.copy(NUC); scene.add(halo);
  const orbitas = [[0, .55, 1.35], [.9, -.4, 1.5], [-.6, 1.1, 1.62]].map(([rx, rz, r], i) => {
    const o = new THREE.Mesh(new THREE.TorusGeometry(r, .012, 6, 120), new THREE.MeshBasicMaterial({ color: i === 1 ? 0xB7FF3C : 0x9C93FF, transparent: true, opacity: .55, toneMapped: false }));
    o.position.copy(NUC); o.rotation.set(Math.PI / 2 + rx, 0, rz); scene.add(o);
    const chispa = new THREE.Mesh(new THREE.SphereGeometry(.045, 10, 10), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })); chispa.position.x = r; o.add(chispa);
    return o;
  });
  const tex = new THREE.TextureLoader().load(BASE + 'assets/pebai-mark.png'); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const mark = new THREE.Mesh(new THREE.PlaneGeometry(.8, .94), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false, toneMapped: false })); mark.renderOrder = 5; mark.position.copy(NUC); scene.add(mark);
  const coreLight = new THREE.PointLight(0x8e84ff, 7, 10); coreLight.position.copy(NUC).add(new THREE.Vector3(0, 0, 1.2)); scene.add(coreLight);
  const coreEl = document.createElement('div'); coreEl.className = 'pb-of-core';
  const coreLbl = new CSS2DObject(coreEl); coreLbl.position.set(0, -.1, 2.5); scene.add(coreLbl);

  /* ---------- texturas: pantallas animadas y carteles ---------- */
  const icono = (g, a, x, y, s, color) => {
    g.save(); g.translate(x, y); g.scale(s, s);
    const d = a.icono && brand(a.icono);
    if (d) { g.fillStyle = color; g.fill(new Path2D(d)); } else { g.strokeStyle = color; g.lineWidth = 2; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(new Path2D(GLIFOS[a.glifo] || GLIFOS.flow)); }
    g.restore();
  };
  function dibujaPantalla(o, t) {
    const g = o.ctx, a = o.a, st = o.off ? 'apagado' : vis(a.st), col = o.d.color;
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
    /* icono grande de la herramienta */
    g.fillStyle = apag ? '#1c1f33' : (FONDO[a.id] || '#3a3d52'); g.beginPath(); g.roundRect(34, 54, 150, 150, 36); g.fill();
    icono(g, a, 64, 84, 3.75, apag ? '#4a4d62' : '#ffffff');
    g.fillStyle = apag ? '#4a4d62' : '#EFEDE7'; g.font = '800 34px Manrope, sans-serif'; g.textAlign = 'center'; g.fillText(a.nombre, 109, 252); g.textAlign = 'left';
    /* lado derecho: lo que está haciendo */
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
    } else if (st === 'pausado') {
      g.fillStyle = '#8E84FF'; g.beginPath(); g.roundRect(306, 70, 26, 100, 8); g.fill(); g.beginPath(); g.roundRect(360, 70, 26, 100, 8); g.fill();
      g.font = '700 26px Manrope, sans-serif'; g.textAlign = 'center'; g.fillText('En pausa', 346, 226); g.textAlign = 'left';
    }
    if (a.cupo && st !== 'dormido') { g.fillStyle = 'rgba(255,255,255,.08)'; g.beginPath(); g.roundRect(34, 282, 444, 12, 6); g.fill(); g.fillStyle = col; g.beginPath(); g.roundRect(34, 282, Math.max(12, 444 * Math.min(1, a.hoy / a.cupo)), 12, 6); g.fill(); }
    o.tex.needsUpdate = true;
  }
  const cartel = (d, extra) => canvasTex(1024, 220, (g) => {
    g.fillStyle = 'rgba(10,12,22,.94)'; g.beginPath(); g.roundRect(4, 4, 1016, 212, 34); g.fill();
    g.strokeStyle = d.activo ? d.color : '#3a3d52'; g.lineWidth = 4; g.beginPath(); g.roundRect(4, 4, 1016, 212, 34); g.stroke();
    g.fillStyle = d.activo ? d.color : '#3a3d52'; g.beginPath(); g.roundRect(48, 70, 14, 80, 7); g.fill();
    g.fillStyle = d.activo ? '#FFFFFF' : '#6c6f82'; g.font = '800 72px Manrope, sans-serif'; g.fillText(d.nombre.toUpperCase(), 92, 132);
    g.font = '600 36px Manrope, sans-serif'; g.textAlign = 'right'; g.fillStyle = extra.color; g.fillText(extra.txt, 976, 128);
  });

  /* ---------- agentes de IA y su puesto ---------- */
  const matCuerpo = new THREE.MeshStandardMaterial({ color: 0xc4c8d6, roughness: .38, metalness: .25 });
  const matOscuro = new THREE.MeshStandardMaterial({ color: 0x1a1d30, roughness: .4, metalness: .45 });
  function robot(acento) {
    const r = new THREE.Group();
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.21, .3, 6, 18), matCuerpo); torso.position.y = .95; torso.castShadow = true; r.add(torso);
    const nucleoMat = new THREE.MeshBasicMaterial({ color: acento, toneMapped: false });
    const nucleo = new THREE.Mesh(new THREE.CircleGeometry(.07, 24), nucleoMat); nucleo.position.set(0, 1.0, .212); r.add(nucleo);
    const nucleoAtras = nucleo.clone(); nucleoAtras.position.z = -.212; nucleoAtras.rotation.y = Math.PI; r.add(nucleoAtras);
    const cuello = new THREE.Group(); cuello.position.y = 1.28; r.add(cuello);
    const cabeza = new THREE.Mesh(new RoundedBoxGeometry(.46, .35, .37, 4, .11), matCuerpo); cabeza.position.y = .16; cabeza.castShadow = true; cuello.add(cabeza);
    const visor = new THREE.Mesh(new RoundedBoxGeometry(.38, .15, .02, 2, .05), new THREE.MeshBasicMaterial({ color: 0x0d0f1c })); visor.position.set(0, .17, -.186); cuello.add(visor);
    const ojoMat = new THREE.MeshBasicMaterial({ color: acento, toneMapped: false });
    [-.085, .085].forEach((x) => { const o = new THREE.Mesh(new THREE.CapsuleGeometry(.024, .032, 4, 8), ojoMat); o.rotation.z = Math.PI / 2; o.position.set(x, .17, -.2); cuello.add(o); });
    const antena = new THREE.Mesh(new THREE.SphereGeometry(.038, 12, 12), new THREE.MeshBasicMaterial({ color: acento, toneMapped: false })); antena.position.y = .4; cuello.add(antena);
    const palo = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .09), matOscuro); palo.position.y = .34; cuello.add(palo);
    const brazos = [-1, 1].map((s) => {
      const hombro = new THREE.Group(); hombro.position.set(s * .26, 1.1, 0); r.add(hombro);
      const b = new THREE.Mesh(new THREE.CapsuleGeometry(.056, .26, 4, 10), matCuerpo); b.position.y = -.17; b.castShadow = true; hombro.add(b);
      return hombro;
    });
    return { r, cuello, ojoMat, nucleoMat, antena, brazos };
  }
  function silla() {
    const s = new THREE.Group();
    const asiento = new THREE.Mesh(new RoundedBoxGeometry(.6, .1, .55, 2, .04), matOscuro); asiento.position.y = .58; asiento.castShadow = true; s.add(asiento);
    const resp = new THREE.Mesh(new RoundedBoxGeometry(.56, .36, .08, 2, .04), matOscuro); resp.position.set(0, .8, .26); resp.castShadow = true; s.add(resp);
    const pie = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .5), matOscuro); pie.position.y = .3; s.add(pie);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(.28, .3, .04, 20), matOscuro); base.position.y = .04; s.add(base);
    return s;
  }
  const zTex = canvasTex(64, 64, (g) => { g.fillStyle = '#d6d8ea'; g.font = '800 46px Manrope, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('z', 32, 34); });
  const deskMat = new THREE.MeshStandardMaterial({ color: 0x2b2f50, roughness: .4, metalness: .35 });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x0a0b14, roughness: .35, metalness: .4 });
  const puestos = new Map(), salas = new Map(), clicables = [];
  setTimeout(() => clicables.push(orbe, pedestal), 0);
  function puesto(g, d, a, x, off) {
    const p = new THREE.Group(); p.position.set(x, .18, -.6); g.add(p);
    const desk = new THREE.Mesh(new RoundedBoxGeometry(1.9, .08, .95, 2, .03), deskMat); desk.position.y = .74; desk.castShadow = desk.receiveShadow = true; p.add(desk);
    [-.85, .85].forEach((lx) => { const l = new THREE.Mesh(new THREE.BoxGeometry(.06, .74, .85), frameMat); l.position.set(lx, .37, 0); l.castShadow = true; p.add(l); });
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 320;
    const ptex = new THREE.CanvasTexture(cv); ptex.colorSpace = THREE.SRGBColorSpace; ptex.anisotropy = 4;
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.36, .85), new THREE.MeshBasicMaterial({ map: ptex, toneMapped: false })); scr.position.set(0, 1.47, -.24); p.add(scr);
    const fr = new THREE.Mesh(new RoundedBoxGeometry(1.46, .95, .05, 2, .02), frameMat); fr.position.set(0, 1.47, -.28); fr.castShadow = true; p.add(fr);
    const stand = new THREE.Mesh(new THREE.BoxGeometry(.08, .3, .06), frameMat); stand.position.set(0, .92, -.28); stand.scale.y = 1.6; p.add(stand);
    const teclado = new THREE.Mesh(new RoundedBoxGeometry(.6, .025, .2, 2, .01), frameMat); teclado.position.set(0, .79, .12); p.add(teclado);
    /* halo de la pantalla sobre la mesa (en lugar de una luz por puesto, que es lo que más pesa) */
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(1.8, .9), new THREE.MeshBasicMaterial({ color: new THREE.Color(d.color), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    halo.rotation.x = -Math.PI / 2; halo.position.set(0, .785, .02); p.add(halo);
    const ch = silla(); ch.position.set(0, 0, .85); p.add(ch);
    const rb = robot(new THREE.Color(d.color)); rb.r.position.set(0, -.08, .74); rb.r.scale.setScalar(.95); p.add(rb.r);
    const baliza = new THREE.Mesh(new THREE.SphereGeometry(.12, 16, 16), new THREE.MeshBasicMaterial({ color: 0xFF5E6C, toneMapped: false })); baliza.position.set(.64, 2.08, -.27); baliza.visible = false; p.add(baliza);
    const zs = [0, 1, 2].map((k) => { const z = new THREE.Sprite(new THREE.SpriteMaterial({ map: zTex, transparent: true, opacity: 0, depthWrite: false })); z.scale.setScalar(.25); p.add(z); return { z, o: k / 3 }; });
    const tag = document.createElement('div'); tag.className = 'pb-of-tag' + (off ? ' off' : '');
    const lb = new CSS2DObject(tag); lb.position.set(0, 2.36, -.25); p.add(lb);
    if (!off) tag.addEventListener('click', (e) => { e.stopPropagation(); abrirAgente(a.id); });
    const o = { p, scr, ctx: cv.getContext('2d'), tex: ptex, halo, baliza, zs, rb, ch, tag, a, d, off, t0: Math.random() * 6, conducto: null };
    [desk, scr, fr, rb.r, ch].forEach((m) => m.traverse((n) => { if (n.isMesh) { n.userData.puesto = o; clicables.push(n); } }));
    dibujaPantalla(o, 0);
    return o;
  }
  function pintaTag(o) {
    const { tag, a, off } = o; tag.replaceChildren();
    const i = document.createElement('i'); i.style.background = off ? '#3a3d52' : (ST[a.st] || ST.espera)[0];
    tag.append(i, a.nombre); tag.classList.toggle('error', !off && a.st === 'error');
    if (off) return;
    const tip = document.createElement('div'); tip.className = 'tip';
    const b = document.createElement('b'); b.textContent = (ST[a.st] || ST.espera)[1] + (a.cupo ? ` · ${N(a.hoy)} de ${a.cupo} hoy` : ` · ${N(a.hoy)} hoy`);
    const m = document.createElement('div'); m.textContent = a.motivo || '';
    tip.append(b, m); tag.append(tip);
  }

  /* ---------- distribución: dos columnas a los lados del núcleo, tantas filas como haga falta ---------- */
  const D = 5.4, GAP_Z = 2.2, GAP_X = 4.0, PASO = 2.6;
  const listaDe = (d) => d.activo ? agsDe(d.id) : [];
  const filas = Math.ceil(DEPTS.length / 2);
  const ledMat = [new THREE.MeshBasicMaterial({ color: 0x3DDC84, toneMapped: false }), new THREE.MeshBasicMaterial({ color: 0x1b2a22 })];
  const leds = [];
  const sueloTex = canvasTex(256, 256, (c) => { c.fillStyle = '#000'; c.fillRect(0, 0, 256, 256); c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2; c.strokeRect(1, 1, 254, 254); });
  DEPTS.forEach((d, idx) => {
    const lista = listaDe(d);
    const W = Math.max(6.4, lista.length * PASO + 1.6);
    const lado = idx % 2 === 0 ? -1 : 1, fila = Math.floor(idx / 2);
    const z = ((filas - 1) / 2 - fila) * (D + GAP_Z) + .4;
    const x = lado * (GAP_X + W / 2);
    const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
    const col = new THREE.Color(d.color), on = d.activo;
    const base = new THREE.Mesh(new RoundedBoxGeometry(W, .18, D, 2, .05), new THREE.MeshStandardMaterial({ color: on ? 0x1a1e3c : 0x121428, roughness: .45, metalness: .35 })); base.position.y = .09; base.receiveShadow = true; g.add(base);
    const suelo = sueloTex.clone(); suelo.wrapS = suelo.wrapT = THREE.RepeatWrapping; suelo.repeat.set(W / 1.2, D / 1.2); suelo.needsUpdate = true;
    const losas = new THREE.Mesh(new THREE.PlaneGeometry(W - .3, D - .3), new THREE.MeshBasicMaterial({ map: suelo, color: col, transparent: true, opacity: on ? .07 : .03, depthWrite: false, blending: THREE.AdditiveBlending })); losas.rotation.x = -Math.PI / 2; losas.position.y = .185; g.add(losas);
    /* filo de luz alrededor de toda la sala */
    const filoMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: on ? .9 : .28, toneMapped: false });
    [[0, D / 2, W, 0], [0, -D / 2, W, 0], [W / 2, 0, D, Math.PI / 2], [-W / 2, 0, D, Math.PI / 2]].forEach(([fx, fz, len, ry]) => { const l = new THREE.Mesh(new THREE.BoxGeometry(len, .025, .04), filoMat); l.position.set(fx, .19, fz); l.rotation.y = ry; g.add(l); });
    /* pared del fondo sólida con tiras de luz; lateral exterior de cristal */
    const pared = new THREE.Mesh(new RoundedBoxGeometry(W, 1.7, .12, 2, .04), new THREE.MeshStandardMaterial({ color: on ? 0x14172e : 0x0f1122, roughness: .55, metalness: .3 })); pared.position.set(0, 1.03, -D / 2 + .06); pared.receiveShadow = true; g.add(pared);
    const nTiras = Math.max(2, Math.round(W / 2.2));
    for (let k = 0; k < nTiras; k++) { const t2 = new THREE.Mesh(new THREE.BoxGeometry(.05, 1.2, .02), filoMat); t2.position.set(-W / 2 + .5 + k * (W - 1) / (nTiras - 1), 1.03, -D / 2 + .13); g.add(t2); }
    const glass = new THREE.MeshStandardMaterial({ color: col, transparent: true, opacity: on ? .08 : .03, roughness: .1, metalness: .1, side: THREE.DoubleSide, depthWrite: false });
    const lat = new THREE.Mesh(new THREE.PlaneGeometry(D, 1.5), glass); lat.rotation.y = Math.PI / 2; lat.position.set(lado * W / 2, .93, 0); g.add(lat);
    const latTop = new THREE.Mesh(new THREE.BoxGeometry(D, .03, .03), filoMat); latTop.rotation.y = Math.PI / 2; latTop.position.set(lado * W / 2, 1.68, 0); g.add(latTop);
    if (on) { const pl = new THREE.PointLight(col, 2, 10); pl.position.set(0, 3.4, .8); g.add(pl); }
    /* una planta en la esquina delantera exterior y, si hay bots, el armario de servidores con sus luces */
    const maceta = new THREE.Mesh(new THREE.CylinderGeometry(.22, .17, .4, 16), new THREE.MeshStandardMaterial({ color: 0x23263f, roughness: .6 })); maceta.position.set(lado * (W / 2 - .45), .38, D / 2 - .5); maceta.castShadow = true; g.add(maceta);
    const hojaMat = new THREE.MeshStandardMaterial({ color: 0x2f8f5b, roughness: .7, flatShading: true });
    [[0, .78, 0, .3], [.1, 1.02, .05, .22], [-.08, .95, -.06, .2]].forEach(([hx, hy, hz, r]) => { const h = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), hojaMat); h.position.set(maceta.position.x + hx, hy, maceta.position.z + hz); h.castShadow = true; g.add(h); });
    if (on) {
      const rack = new THREE.Mesh(new RoundedBoxGeometry(.7, 1.5, .55, 2, .04), new THREE.MeshStandardMaterial({ color: 0x0c0e1a, roughness: .35, metalness: .6 })); rack.position.set(lado * (W / 2 - .55), .93, -D / 2 + .5); rack.castShadow = true; g.add(rack);
      for (let r = 0; r < 6; r++) for (let c2 = 0; c2 < 3; c2++) { const l = new THREE.Mesh(new THREE.PlaneGeometry(.07, .035), ledMat[1]); l.position.set(rack.position.x - .16 + c2 * .16, .45 + r * .2, rack.position.z + .28); g.add(l); leds.push(l); }
    }
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.6, .99), new THREE.MeshBasicMaterial({ transparent: true, toneMapped: false })); sign.position.set(0, 2.5, -D / 2 + .02); sign.rotation.x = -.18; g.add(sign);
    sign.userData.sala = d; base.userData.sala = d; clicables.push(sign, base);
    /* nodo de la sala, sobre su pared interior, unido al núcleo por un arco de datos */
    const nodoP = new THREE.Vector3(x - lado * (W / 2 - .2), 2.35, z - .4);
    const nodo = new THREE.Mesh(new THREE.OctahedronGeometry(.17, 0), new THREE.MeshBasicMaterial({ color: col, toneMapped: false, transparent: true, opacity: on ? 1 : .35 })); nodo.position.copy(nodoP); scene.add(nodo);
    const desde = NUC.clone().add(nodoP.clone().sub(NUC).setY(0).normalize().multiplyScalar(1.05));
    const tronco = enlace(desde, nodoP, 1.6, d.color, on ? .04 : .022);
    const s = { d, g, sign, W, tronco, nodo };
    salas.set(d.id, s);
    lista.forEach((a, i) => {
      const px = (i - (lista.length - 1) / 2) * PASO;
      const o = puesto(g, d, a, px, false); puestos.set(a.id, o); pintaTag(o);
      /* del nodo de la sala a la antena de cada bot */
      o.conducto = enlace(nodoP.clone(), new THREE.Vector3(x + px, 1.8, z + .14), .7, d.color, .016);
    });
  });
  /* encuadre de la vista general a partir de lo que ocupa la oficina */
  const caja = new THREE.Box3(); salas.forEach((s) => caja.expandByObject(s.g)); caja.expandByPoint(new THREE.Vector3(0, 0, 3.5));
  const HOME = { p: new THREE.Vector3(), t: new THREE.Vector3() };
  const encajar = () => {
    const c = caja.getCenter(new THREE.Vector3()), size = caja.getSize(new THREE.Vector3());
    const vf = THREE.MathUtils.degToRad(camera.fov), hf = 2 * Math.atan(Math.tan(vf / 2) * camera.aspect);
    const dist = Math.max((size.x * 1.16) / (2 * Math.tan(hf / 2)), (size.z * .9) / (2 * Math.tan(vf / 2))) + 1.5;
    HOME.t.set(c.x, 0, c.z - 1.9); HOME.p.set(c.x, dist * .76, c.z + dist * .66);
  };
  camera.aspect = W0() / H0(); camera.updateProjectionMatrix(); encajar();
  camera.position.copy(HOME.p).add(new THREE.Vector3(0, 10, 10));
  const target = HOME.t.clone(); camera.lookAt(target);
  const sb = caja.clone().expandByScalar(4); Object.assign(sun.shadow.camera, { left: sb.min.x - 8, right: sb.max.x + 8, top: sb.max.z + 10, bottom: sb.min.z - 10 }); sun.shadow.camera.updateProjectionMatrix();

  function refrescarEscena() {
    puestos.forEach((o) => {
      if (o.off) { o.rb.r.visible = false; dibujaPantalla(o, 0); return; }
      const a = ag(o.a.id); if (!a) return; o.a = a;
      o.rb.r.visible = a.st !== 'apagado';
      const v = vis(a.st);
      o.rb.ojoMat.color.set(v === 'error' ? '#FF5E6C' : v === 'espera' ? '#FFB547' : v === 'dormido' ? '#2a2d3e' : o.d.color);
      o.rb.nucleoMat.color.copy(o.rb.ojoMat.color);
      o.halo.material.opacity = a.st === 'trabajando' ? .22 : a.st === 'espera' ? .1 : a.st === 'error' ? .18 : 0;
      o.halo.material.color.set(a.st === 'error' ? '#FF5E6C' : a.st === 'espera' ? '#FFB547' : o.d.color);
      o.baliza.visible = a.st === 'error';
      if (o.conducto) o.conducto.material.uniforms.uOn.value = a.st === 'trabajando' ? 1 : a.st === 'error' ? 0 : .15;
      dibujaPantalla(o, 0); pintaTag(o);
    });
    salas.forEach((s) => {
      const d = s.d; let extra = { txt: 'Sin agentes aún', color: '#6c6f82' };
      if (d.activo) {
        const lista = agsDe(d.id), n = pendientes().filter((p) => p.a.dept === d.id).length, err = lista.some((a) => a.st === 'error');
        const tr = lista.filter((a) => a.st === 'trabajando').length;
        extra = err ? { txt: 'Hay un error', color: '#FF5E6C' } : n ? { txt: n === 1 ? '1 cosa para vosotros' : n + ' cosas para vosotros', color: '#FFB547' } : { txt: tr ? `${tr} de ${lista.length} trabajando` : 'Todo en orden', color: '#3DDC84' };
        s.tronco.material.uniforms.uOn.value = tr ? 1 : .2;
      }
      if (s.sign.material.map) s.sign.material.map.dispose(); s.sign.material.map = cartel(d, extra); s.sign.material.needsUpdate = true;
    });
    const pend = pendientes(), ne = pend.filter((p) => p.err).length;
    coreEl.innerHTML = '<b>PEBAI</b>' + (ne ? `<span class="err">${ne === 1 ? '1 agente con error' : ne + ' agentes con error'}</span>` : pend.length ? `<span class="warn">${pend.length === 1 ? '1 cosa espera por vosotros' : pend.length + ' cosas esperan por vosotros'}</span>` : '<span class="ok">Todo en orden</span>');
    orbeMat.uniforms.uErr.value = ne ? .55 : 0;
    renderer.shadowMap.needsUpdate = true;
  }

  /* ---------- cámara con clics ---------- */
  let fly = null;
  const volar = (p, t) => { if (!Number.isFinite(camera.position.x)) { camera.position.copy(p); target.copy(t); } fly = { p0: camera.position.clone(), t0: target.clone(), p1: p.clone(), t1: t.clone(), k: 0 }; };
  volar(HOME.p, HOME.t);
  const ray = new THREE.Raycaster(), m2 = new THREE.Vector2();
  const tocar = (e) => { const r = renderer.domElement.getBoundingClientRect(); m2.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(m2, camera); return ray.intersectObjects(clicables, false)[0]; };
  let hover = null, ultimoMov = 0;
  renderer.domElement.addEventListener('pointermove', (e) => {
    if (performance.now() - ultimoMov < 60) return; ultimoMov = performance.now();
    const h = tocar(e); const o = h && h.object.userData.puesto && !h.object.userData.puesto.off ? h.object.userData.puesto : null;
    renderer.domElement.style.cursor = o || (h && (h.object.userData.sala || h.object.userData.nucleo)) ? 'pointer' : 'default';
    if (hover !== o) { if (hover) hover.tag.classList.remove('hover'); hover = o; if (o) o.tag.classList.add('hover'); }
  });
  renderer.domElement.addEventListener('click', (e) => {
    const h = tocar(e);
    if (h && h.object.userData.puesto && !h.object.userData.puesto.off) { abrirAgente(h.object.userData.puesto.a.id); return; }
    if (h && h.object.userData.sala) { abrirSala(h.object.userData.sala); return; }
    if (h && h.object.userData.nucleo) { abrirNucleo(); return; }
    if (side.classList.contains('on') || foco) cerrar();
  });
  new ResizeObserver(() => {
    if (!W0()) return; camera.aspect = W0() / H0(); camera.updateProjectionMatrix(); encajar();
    renderer.setSize(W0(), H0()); composer.setSize(W0(), H0()); labels.setSize(W0(), H0());
    if (!foco) volar(HOME.p, HOME.t); else if (foco.agente) enfocarAgente(foco.agente); else if (foco.nucleo) abrirNucleo(); else if (foco.sala) enfocarSala(DEPTS.find((x) => x.id === foco.sala));
  }).observe(wrap);

  const clock = new THREE.Clock(); let ultPantalla = 0, medida = { n: 0, t: 0, prev: 0 };
  function tick(now) {
    requestAnimationFrame(tick);
    if (document.hidden || !enPagina() || !W0()) { medida.prev = 0; return; }
    if (medida.prev) { const dt = now - medida.prev; if (dt < 250) { medida.n++; medida.t += dt; } }
    medida.prev = now;
    if (medida.n >= 90) { if (medida.t / medida.n > 25 && Q > .6) { Q = Math.max(.6, Q - .2); composer.setPixelRatio(Q); composer.setSize(W0(), H0()); } medida.n = 0; medida.t = 0; }
    const t = clock.getElapsedTime();
    const k = pensando ? 3.2 : 1, flota = Math.sin(t * 1.1) * .06 + (pensando ? Math.sin(t * 7) * .03 : 0);
    orbeMat.uniforms.uT.value = t; orbeMat.uniforms.uK.value += ((pensando ? 3 : 1) - orbeMat.uniforms.uK.value) * .05;
    [orbe, interior, mark, halo].forEach((m) => { m.position.y = NUC.y + flota; });
    orbitas.forEach((o, i) => { o.position.y = NUC.y + flota; o.rotation.z += (.004 + i * .002) * k * (i % 2 ? -1 : 1); });
    interior.scale.setScalar(1 + Math.sin(t * (pensando ? 8 : 2)) * .08);
    halo.material.opacity = pensando ? .85 + Math.sin(t * 8) * .15 : .75;
    mark.lookAt(camera.position);
    coreLight.intensity = pensando ? 9 + Math.sin(t * 9) * 3 : 6 + Math.sin(t * 1.4) * 1.2;
    enlaces.forEach((c) => { c.material.uniforms.uT.value = t * (pensando ? 2.2 : 1); });
    salas.forEach((s) => { s.nodo.rotation.y = t * .8; });
    if (Math.floor(t * 6) !== tick.ledPaso) { tick.ledPaso = Math.floor(t * 6); const trab = S.agentes.some((a) => a.st === 'trabajando'); leds.forEach((l) => { l.material = trab && Math.random() > .35 ? ledMat[0] : ledMat[1]; }); }
    const animPant = t - ultPantalla > .12; if (animPant) ultPantalla = t;
    puestos.forEach((o) => {
      if (o.off) return;
      const st = vis(o.a.st), rb = o.rb, tt = t + o.t0;
      if (animPant && ['trabajando', 'espera', 'error'].includes(st)) dibujaPantalla(o, tt);
      const [bi, bd] = rb.brazos;
      rb.cuello.rotation.set(0, 0, 0); bi.rotation.set(0, 0, 0); bd.rotation.set(0, 0, 0); rb.r.position.y = -.08;
      o.zs.forEach((z) => { z.z.material.opacity = 0; });
      if (st === 'trabajando') {
        bi.rotation.x = 1.15 + Math.sin(tt * 14) * .12; bd.rotation.x = 1.15 + Math.sin(tt * 14 + 1.7) * .12;
        rb.cuello.rotation.x = -.12 + Math.sin(tt * 2) * .03; rb.cuello.rotation.y = Math.sin(tt * .7) * .08;
        rb.antena.material.color.set(Math.sin(tt * 6) > 0 ? o.d.color : '#ffffff');
        o.halo.material.opacity = .18 + Math.sin(tt * 5) * .06;
      } else if (st === 'espera') {
        bi.rotation.x = .35; bd.rotation.x = .35;
        rb.cuello.rotation.y = Math.sin(tt * .55) * .55; rb.cuello.rotation.x = .08;
      } else if (st === 'dormido') {
        rb.cuello.rotation.x = -.75; bi.rotation.x = 1.35; bd.rotation.x = 1.35; rb.r.position.y = -.12 + Math.sin(tt * 1.2) * .01;
        o.zs.forEach((z) => { const k = (tt * .32 + z.o) % 1; z.z.position.set(.2 + k * .45, 1.55 + k * .8, .55); z.z.material.opacity = Math.sin(k * Math.PI) * .9; z.z.scale.setScalar(.16 + k * .18); });
      } else if (st === 'error') {
        rb.cuello.rotation.y = Math.sin(tt * 3) * .5; bi.rotation.z = .6; bd.rotation.z = -.6; bi.rotation.x = .4; bd.rotation.x = .4;
        o.baliza.visible = Math.sin(t * 8) > -.1;
      }
    });
    if (fly) { fly.k = Math.min(1, fly.k + .025); const e = 1 - Math.pow(1 - fly.k, 3); camera.position.lerpVectors(fly.p0, fly.p1, e); target.lerpVectors(fly.t0, fly.t1, e); if (fly.k >= 1) fly = null; }
    camera.lookAt(target);
    composer.render(); labels.render(scene, camera);
  }
  G = { THREE, volar, HOME, refrescarEscena, puestos, salas };
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
