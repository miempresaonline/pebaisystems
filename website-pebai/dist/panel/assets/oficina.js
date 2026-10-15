/* PEBAI · Panel — Automático › Agentes, vista Oficina: centro de control 3D de los agentes.
   Datos reales en index.php?oficina=1 (ver _oficina_panel.php). Three.js se carga solo al abrir la sección.
   Navegación con clics (sin girar ni zoom): sala o agente → la cámara va a él; clic fuera, Esc o × → vista general.
   Todo texto que llega de los agentes se pinta con textContent o escapado: nunca HTML de los datos. */
const app = document.getElementById('pb-app');
const wrap = document.getElementById('pb-of');
if (app && wrap) {
const PAGE = 'agentes';
const BASE = app.dataset.base;
const $ = (s, r) => (r || document).querySelector(s);
const S = { csrf: app.dataset.csrf, agentes: [], ia: false, hist: [] };
const ST = {
  trabajando: ['#3DDC84', 'Trabajando'], espera: ['#FFB547', 'En espera'], dormido: ['#8E91A8', 'Durmiendo'],
  error: ['#FF5E6C', 'Con error'], apagado: ['#5C5F73', 'Apagado'], pausado: ['#8E84FF', 'En pausa'],
};
const DEPTS = [
  { id: 'captacion', nombre: 'Captación', color: '#B7FF3C', pos: [-9.6, 4.2], activo: true, objetivo: 'Encontrar empresas y abrir conversación con ellas' },
  { id: 'embudo', nombre: 'Embudo', color: '#8E84FF', pos: [9.6, 4.2], activo: true, objetivo: 'Llevar cada solicitud hasta la sesión técnica' },
  { id: 'redes', nombre: 'Redes', color: '#E25CFF', pos: [-9.6, -6.6], activo: false, objetivo: 'Publicar contenido que traiga solicitudes', futuros: [['Carruseles', 'instagram'], ['Vídeos', 'tiktok']] },
  { id: 'operaciones', nombre: 'Operaciones', color: '#3FD5FF', pos: [9.6, -6.6], activo: false, objetivo: 'Proyectos y entregas a clientes', futuros: [['Proyectos', null, 'flow']] },
];
const FONDO = { scraper: '#1a7f45', whatsapp: '#1fae58', email: '#c5372b', fases: '#4b40c9', recordatorios: '#4b40c9', calcom: '#4b40c9' };
const GLIFOS = { flow: 'M3 3h7v7H3zM14 14h7v7h-7zM10 6.5h3.5a3 3 0 0 1 3 3V14', bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0', cal: 'M3 5h18v16H3zM16 3v4M8 3v4M3 10h18' };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const brand = (k) => (window.PB_ICONS && window.PB_ICONS.brands && window.PB_ICONS.brands[k]) ? window.PB_ICONS.brands[k].d : null;
const N = (n) => new Intl.NumberFormat('es-ES').format(n || 0);
const hora = (ts) => String(ts || '').slice(11, 16);
const toast = (m, err) => { const t = $('#pb-toast'); if (!t) return; $('span', t).textContent = m; t.classList.toggle('err', !!err); t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 3200); };
const enPagina = () => document.body.dataset.page === PAGE && !document.body.classList.contains('pb-ag-ajustes');

/* ============ datos ============ */
async function cargar() {
  const r = await fetch(BASE + '?oficina=1', { credentials: 'same-origin', cache: 'no-store' });
  if (r.status === 401) { location.reload(); return false; }
  let j; try { j = await r.json(); } catch (e) { throw new Error('La oficina no ha respondido bien.'); }
  if (!j.ok) throw new Error(j.error || 'No se ha podido cargar la oficina.');
  S.agentes = j.agentes; S.csrf = j.csrf; S.ia = j.ia; return true;
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

/* Frase de lo que ha pasado hoy, en palabras normales */
function resumenHoy() {
  const sc = ag('scraper'), wa = ag('whatsapp'), em = ag('email'), cal = ag('calcom'), fa = ag('fases'), fr = [];
  if (sc && sc.hoy) fr.push(`El scraper ha encontrado ${N(sc.hoy)} empresas nuevas`);
  const esc2 = [];
  if (wa && wa.hoy) esc2.push(`WhatsApp ha escrito a ${N(wa.hoy)}` + (wa.respuestas_hoy ? ` y han respondido ${N(wa.respuestas_hoy)}` : ''));
  if (em && em.hoy) esc2.push(`Email ha enviado ${N(em.hoy)}`);
  if (esc2.length) fr.push(esc2.join('; '));
  else if (wa || em) fr.push('WhatsApp y Email aún no han escrito a nadie');
  if (cal && cal.hoy) fr.push(`${N(cal.hoy)} ${cal.hoy === 1 ? 'reserva nueva' : 'reservas nuevas'} en Cal.com`);
  if (fa && fa.hoy) fr.push(`${N(fa.hoy)} ${fa.hoy === 1 ? 'solicitud ha cambiado' : 'solicitudes han cambiado'} de fase sola${fa.hoy === 1 ? '' : 's'}`);
  if (!fr.length) return 'Hoy todavía no ha pasado nada.';
  return fr.map((f, i) => i && /^El /.test(f) ? 'el ' + f.slice(3) : f).join(', ').replace(/, ([^,]*)$/, ' y $1') + '.';
}

/* ============ capa de interfaz ============ */
const hud = $('#pb-of-hud'), side = $('#pb-of-side'), sideIn = $('#pb-of-sidein');
$('#pb-of-x').onclick = (e) => { e.stopPropagation(); cerrar(); };
function pintaHud() {
  hud.replaceChildren();
  const card = document.createElement('div'); card.className = 'pb-of-hoy';
  const k = document.createElement('div'); k.className = 'k'; k.textContent = 'Hoy en la oficina';
  const p = document.createElement('p'); p.textContent = resumenHoy();
  card.append(k, p); hud.append(card);
  const pend = pendientes();
  const lista = document.createElement('div'); lista.className = 'pb-of-pend';
  if (!pend.length) { const ok = document.createElement('span'); ok.className = 'pb-of-chip ok'; ok.innerHTML = '<i></i>'; ok.append('Todo en orden: nada espera por vosotros'); lista.append(ok); }
  else {
    const t = document.createElement('div'); t.className = 'k'; t.textContent = pend.length === 1 ? 'Necesita a una persona' : `${pend.length} cosas necesitan a una persona`; lista.append(t);
    pend.slice(0, 4).forEach(({ a, txt, err }) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'pb-of-chip' + (err ? ' err' : '');
      b.innerHTML = '<i></i>'; const s = document.createElement('b'); s.textContent = a.nombre; b.append(s, txt);
      b.onclick = (e) => { e.stopPropagation(); abrirAgente(a.id); }; lista.append(b);
    });
  }
  hud.append(lista);
}

const q = (t, cuerpo) => `<div class="pb-of-q"><h4>${t}</h4>${cuerpo}</div>`;
function icoHtml(a) {
  const d = a.icono && brand(a.icono);
  return d ? `<span class="ico" style="background:${FONDO[a.id] || '#3a3d52'}"><svg viewBox="0 0 24 24"><path fill="#fff" d="${d}"/></svg></span>`
    : `<span class="ico" style="background:${FONDO[a.id] || '#3a3d52'}"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${GLIFOS[a.glifo] || GLIFOS.flow}"/></svg></span>`;
}
function abrirAgente(id) {
  const a = ag(id); if (!a) return;
  const d = DEPTS.find((x) => x.id === a.dept); enfocarAgente(a.id);
  const [c, txt] = ST[a.st] || ST.espera;
  const pct = a.cupo ? Math.min(100, Math.round(a.hoy / a.cupo * 100)) : 0;
  sideIn.innerHTML = `<div class="k">${esc(d.nombre)}</div><h2>${icoHtml(a)}${esc(a.nombre)}</h2><div class="rol">${esc(a.rol || '')}</div>
    <div class="pb-of-state" style="--c:${c}"><i></i><div><b>${txt}</b><span>${esc(a.motivo)}</span></div></div>
    <div class="pb-of-qa">
    ${q('Hoy', `<p><b class="big">${N(a.hoy)}</b> ${esc(a.unidad)}${a.cupo ? ` de ${a.cupo} posibles` : ''}</p>${a.cupo ? `<div class="bar" style="--c:${d.color}"><i data-w="${pct}%"></i></div>` : ''}`)}
    ${q('Lo último que hizo', a.ultima ? `<p>${esc(a.ultima.txt)}</p><p class="sub">${esc(a.ultima.hace)}</p>` : '<p>Todavía no ha hecho nada.</p>')}
    ${(a.necesita || []).length ? q('Necesita de vosotros', a.necesita.map((n) => `<p class="warn">${esc(n)}</p>`).join('')) : ''}
    ${q('¿Ha fallado algo?', (a.errores || []).length ? a.errores.map((e) => `<p class="bad"><b>${esc(hora(e.ts))}</b> · ${esc(e.txt)}</p>`).join('') : '<p class="ok">No, nada en las últimas 24 horas.</p>')}
    ${a.proxima ? q('Qué hará ahora', `<p>${esc(a.proxima)}</p>`) : ''}
    ${(a.datos || []).length ? q('Datos', `<dl>${a.datos.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`) : ''}
    ${(a.actividad || []).length ? q('Historial', a.actividad.slice(0, 12).map((e) => `<div class="pb-of-ev"><time>${esc(e.hace)}</time><div><u class="${esc(e.tipo)}">${esc(e.tipo)}</u>${esc(e.txt)}</div></div>`).join('')) : ''}
    </div>`;
  mostrar();
}
function abrirSala(d) {
  enfocarSala(d);
  if (!d.activo) { sideIn.innerHTML = `<div class="k">Departamento</div><h2>${esc(d.nombre)}</h2><div class="rol">${esc(d.objetivo)}</div><div class="pb-of-state" style="--c:#5C5F73"><i></i><div><b>En obras</b><span>Aparecerá aquí con sus agentes en cuanto lo montemos.</span></div></div>`; mostrar(); return; }
  const lista = agsDe(d.id); const e = estadoDept(d.id);
  const pend = pendientes().filter((p) => p.a.dept === d.id);
  sideIn.innerHTML = `<div class="k">Departamento</div><h2>${esc(d.nombre)}</h2><div class="rol">${esc(d.objetivo)}</div>
    <div class="pb-of-state" style="--c:${e === 'error' ? '#FF5E6C' : e === 'aviso' ? '#FFB547' : '#3DDC84'}"><i></i><div><b>${e === 'error' ? 'Hay un error' : e === 'aviso' ? 'Funciona, pero os necesita' : 'Todo en orden'}</b><span>${lista.filter((a) => a.st === 'trabajando').length} de ${lista.length} agentes trabajando ahora</span></div></div>
    <div class="pb-of-qa">
    ${pend.length ? q('Necesita de vosotros', pend.map((p) => `<p class="${p.err ? 'bad' : 'warn'}"><b>${esc(p.a.nombre)}</b>: ${esc(p.txt)}</p>`).join('')) : ''}
    ${q('Agentes', lista.map((a) => `<div class="pb-of-row" data-id="${esc(a.id)}"><i style="background:${(ST[a.st] || ST.espera)[0]}"></i><b>${esc(a.nombre)}</b><span>${a.cupo ? N(a.hoy) + '/' + a.cupo : N(a.hoy)} hoy · ${(ST[a.st] || ST.espera)[1].toLowerCase()}</span></div>`).join(''))}
    </div>`;
  sideIn.querySelectorAll('.pb-of-row').forEach((r) => r.addEventListener('click', () => abrirAgente(r.dataset.id)));
  mostrar();
}
function mostrar() { side.classList.add('on'); side.scrollTop = 0; setTimeout(() => side.querySelectorAll('.bar i').forEach((b) => { b.style.width = b.dataset.w; }), 300); }
function cerrar() { side.classList.remove('on'); foco = null; wrap.classList.remove('foco'); if (G) G.volar(G.HOME.p, G.HOME.t); }
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
  const body = document.createElement('div'); body.className = 'bd'; body.innerHTML = '<div class="pens">PEBAI está mirando los departamentos…</div>';
  ans.append(head, body);
  qBtn.disabled = true; qIn.value = '';
  try {
    const r = await fetch(BASE, { method: 'POST', credentials: 'same-origin', headers: { 'Accept': 'application/json' }, body: new URLSearchParams({ action: 'oficina_preguntar', csrf: S.csrf, q: t, h: JSON.stringify(S.hist.slice(-4)) }) });
    if (r.status === 401) { location.reload(); return; }
    const j = await r.json().catch(() => ({ ok: false, error: 'Respuesta inesperada.' }));
    body.innerHTML = j.ok ? formatear(j.respuesta) : '<p class="err">' + esc(j.error) + '</p>';
    if (j.ok) S.hist.push({ q: t, a: j.respuesta });
  } catch (e) { body.innerHTML = '<p class="err">No se ha podido preguntar ahora.</p>'; }
  qBtn.disabled = false;
}
$('#pb-of-askf').addEventListener('submit', (e) => { e.preventDefault(); preguntar(qIn.value); });
['pb-of-ask', 'pb-of-hud', 'pb-of-side'].forEach((id) => { const n = document.getElementById(id); if (n) n.addEventListener('click', (e) => e.stopPropagation()); });

/* ============ escena 3D ============ */
let G = null, foco = null;
function enfocarSala(d) {
  foco = { sala: d.id }; wrap.classList.add('foco'); if (!G) return;
  const f = G.fit(), panel = wrap.clientWidth > 760 ? 3.4 * f : 0;
  const c = new G.THREE.Vector3(d.pos[0], 0, d.pos[1]);
  G.volar(c.clone().add(new G.THREE.Vector3(panel, 10 * f, 11 * f)), c.clone().add(new G.THREE.Vector3(panel, .8, -.2)));
}
function enfocarAgente(id) {
  foco = { agente: id }; wrap.classList.add('foco'); if (!G) return;
  const o = G.puestos.get(id); if (!o) return;
  const w = new G.THREE.Vector3(); o.p.getWorldPosition(w);
  const f = Math.max(1, G.fit() * .8), panel = wrap.clientWidth > 760 ? 1.9 * f : 0;
  G.volar(w.clone().add(new G.THREE.Vector3(panel, 5 * f, 6.2 * f)), w.clone().add(new G.THREE.Vector3(panel, .95, -.3)));
}

async function montar() {
  const THREE = await import('three');
  const { CSS2DRenderer, CSS2DObject } = await import('three/addons/renderers/CSS2DRenderer.js');
  const { EffectComposer } = await import('three/addons/postprocessing/EffectComposer.js');
  const { RenderPass } = await import('three/addons/postprocessing/RenderPass.js');
  const { UnrealBloomPass } = await import('three/addons/postprocessing/UnrealBloomPass.js');
  const { OutputPass } = await import('three/addons/postprocessing/OutputPass.js');
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const load = $('#pb-of-load'); if (load) load.remove();
  const W0 = () => wrap.clientWidth, H0 = () => wrap.clientHeight;
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(W0(), H0());
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.25;
  wrap.prepend(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x07080f); scene.fog = new THREE.Fog(0x07080f, 40, 80);
  const camera = new THREE.PerspectiveCamera(32, W0() / H0(), .1, 200);
  const BASEP = new THREE.Vector3(0, 21, 21);
  const HOME = { p: BASEP.clone(), t: new THREE.Vector3(0, 0, -2.6) };
  const encajar = () => { const f = Math.min(1.8, Math.max(.92, 2.0 / (W0() / H0()))); HOME.p.copy(BASEP).multiplyScalar(f); };
  encajar(); camera.position.copy(HOME.p).add(new THREE.Vector3(0, 12, 12));
  const target = HOME.t.clone(); camera.lookAt(target);
  const labels = new CSS2DRenderer(); labels.setSize(W0(), H0()); labels.domElement.className = 'pb-of-lbl'; wrap.append(labels.domElement);
  const composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(W0(), H0()), .55, .45, .78)); composer.addPass(new OutputPass());

  scene.add(new THREE.HemisphereLight(0xcfd2ff, 0x15172b, .95));
  const sun = new THREE.DirectionalLight(0xffffff, 1.35); sun.position.set(-12, 24, 16); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26 }); sun.shadow.bias = -.0004; sun.shadow.radius = 3; scene.add(sun);

  const floorTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d'); g.fillStyle = '#0c0e1b'; g.fillRect(0, 0, 512, 512); g.strokeStyle = 'rgba(126,115,255,.10)'; g.lineWidth = 2; for (let i = 0; i <= 512; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 512); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(512, i); g.stroke(); } const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(16, 16); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(130, 130), new THREE.MeshStandardMaterial({ map: floorTex, roughness: .55, metalness: .35 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

  const dais = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.85, .4, 72), new THREE.MeshStandardMaterial({ color: 0x161a30, roughness: .35, metalness: .6 }));
  dais.position.y = .2; dais.castShadow = dais.receiveShadow = true; scene.add(dais);
  const daisTop = new THREE.Mesh(new THREE.CircleGeometry(2.55, 72), new THREE.MeshStandardMaterial({ color: 0x0f1224, roughness: .25, metalness: .7 })); daisTop.rotation.x = -Math.PI / 2; daisTop.position.y = .405; scene.add(daisTop);
  const tex = new THREE.TextureLoader().load(BASE + 'assets/pebai-mark.png'); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const mark = new THREE.Mesh(new THREE.PlaneGeometry(2.25, 2.65), new THREE.MeshBasicMaterial({ map: tex, transparent: true })); mark.position.y = 2.3; scene.add(mark);
  const sombra = new THREE.Mesh(new THREE.CircleGeometry(.9, 48), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: .5 })); sombra.rotation.x = -Math.PI / 2; sombra.position.y = .41; scene.add(sombra);
  const coreLight = new THREE.PointLight(0x8e84ff, 7, 9); coreLight.position.set(0, 2.2, 1.6); scene.add(coreLight);
  const health = new THREE.Group(); health.position.y = .42; scene.add(health);
  const coreEl = document.createElement('div'); coreEl.className = 'pb-of-core';
  const coreLbl = new CSS2DObject(coreEl); coreLbl.position.set(0, -.1, 3.2); scene.add(coreLbl);

  const canvasTex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  const icono = (g, a, x, y, s, color) => {
    g.save(); g.translate(x, y); g.scale(s, s);
    const d = a.icono && brand(a.icono);
    if (d) { g.fillStyle = color; g.fill(new Path2D(d)); } else { g.strokeStyle = color; g.lineWidth = 2; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(new Path2D(GLIFOS[a.glifo] || GLIFOS.flow)); }
    g.restore();
  };
  const pantalla = (a, color, off) => canvasTex(512, 320, (g) => {
    const st = off ? 'apagado' : a.st;
    if (st === 'apagado') { g.fillStyle = '#050508'; g.fillRect(0, 0, 512, 320); g.strokeStyle = '#2a2d3e'; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.arc(256, 168, 46, -Math.PI * .3, Math.PI * 1.3); g.stroke(); g.beginPath(); g.moveTo(256, 104); g.lineTo(256, 160); g.stroke(); return; }
    const bg = st === 'error' ? '#2a0c12' : st === 'dormido' ? '#0a0b14' : '#0f1326';
    g.fillStyle = bg; g.fillRect(0, 0, 512, 320);
    g.fillStyle = st === 'dormido' ? '#20233a' : (FONDO[a.id] || '#3a3d52'); g.beginPath(); g.roundRect(28, 26, 72, 72, 18); g.fill();
    icono(g, a, 40, 38, 2, st === 'dormido' ? '#55586c' : '#fff');
    g.fillStyle = st === 'dormido' ? '#55586c' : '#EFEDE7'; g.font = '700 40px Manrope, sans-serif'; g.fillText(a.nombre, 120, 76);
    const [c, label] = ST[st] || ST.espera;
    g.fillStyle = c; g.beginPath(); g.arc(44, 150, 10, 0, Math.PI * 2); g.fill();
    g.font = '700 30px Manrope, sans-serif'; g.fillText(label, 66, 161);
    g.fillStyle = st === 'dormido' ? '#3a3d52' : '#9EA1B8'; g.font = '600 26px Manrope, sans-serif';
    g.fillText(a.cupo ? `${N(a.hoy)} de ${a.cupo} hoy` : `${N(a.hoy)} hoy`, 30, 215);
    if (a.cupo) { g.fillStyle = '#23263a'; g.beginPath(); g.roundRect(30, 240, 452, 14, 7); g.fill(); g.fillStyle = color; g.beginPath(); g.roundRect(30, 240, Math.max(14, 452 * Math.min(1, a.hoy / a.cupo)), 14, 7); g.fill(); }
    if (st === 'error') { g.fillStyle = '#FF5E6C'; g.beginPath(); g.arc(452, 62, 30, 0, Math.PI * 2); g.fill(); g.fillStyle = '#2a0c12'; g.font = '800 40px Manrope, sans-serif'; g.textAlign = 'center'; g.fillText('!', 452, 76); g.textAlign = 'left'; }
    if (st === 'pausado') { g.fillStyle = '#8E84FF'; g.fillRect(434, 40, 12, 44); g.fillRect(458, 40, 12, 44); }
  });
  const cartel = (d, extra) => canvasTex(1024, 220, (g) => {
    g.clearRect(0, 0, 1024, 220);
    g.fillStyle = 'rgba(10,12,22,.92)'; g.beginPath(); g.roundRect(4, 4, 1016, 212, 34); g.fill();
    g.strokeStyle = d.activo ? d.color : '#3a3d52'; g.lineWidth = 4; g.beginPath(); g.roundRect(4, 4, 1016, 212, 34); g.stroke();
    g.fillStyle = d.activo ? d.color : '#3a3d52'; g.beginPath(); g.roundRect(48, 70, 14, 80, 7); g.fill();
    g.fillStyle = d.activo ? '#FFFFFF' : '#6c6f82'; g.font = '800 72px Manrope, sans-serif'; g.fillText(d.nombre.toUpperCase(), 92, 132);
    g.font = '600 36px Manrope, sans-serif'; g.textAlign = 'right';
    g.fillStyle = extra.color; g.fillText(extra.txt, 976, 128); g.textAlign = 'left';
  });

  const matCuerpo = new THREE.MeshStandardMaterial({ color: 0xd9dbe6, roughness: .35, metalness: .25 });
  const matOscuro = new THREE.MeshStandardMaterial({ color: 0x1a1d30, roughness: .4, metalness: .4 });
  function robot(acento) {
    const r = new THREE.Group();
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.2, .3, 6, 16), matCuerpo); torso.position.y = .95; torso.castShadow = true; r.add(torso);
    const franja = new THREE.Mesh(new THREE.TorusGeometry(.205, .022, 8, 32), new THREE.MeshBasicMaterial({ color: acento })); franja.rotation.x = Math.PI / 2; franja.position.y = 1.02; r.add(franja);
    const cuello = new THREE.Group(); cuello.position.y = 1.28; r.add(cuello);
    const cabeza = new THREE.Mesh(new RoundedBoxGeometry(.44, .34, .36, 4, .1), matCuerpo); cabeza.position.y = .16; cabeza.castShadow = true; cuello.add(cabeza);
    const visor = new THREE.Mesh(new RoundedBoxGeometry(.36, .14, .02, 2, .05), new THREE.MeshBasicMaterial({ color: 0x111322 })); visor.position.set(0, .17, -.182); cuello.add(visor);
    const ojoMat = new THREE.MeshBasicMaterial({ color: acento, toneMapped: false });
    [-.08, .08].forEach((x) => { const o = new THREE.Mesh(new THREE.CapsuleGeometry(.022, .03, 4, 8), ojoMat); o.rotation.z = Math.PI / 2; o.position.set(x, .17, -.195); cuello.add(o); });
    const antena = new THREE.Mesh(new THREE.SphereGeometry(.035, 12, 12), new THREE.MeshBasicMaterial({ color: acento, toneMapped: false })); antena.position.y = .38; cuello.add(antena);
    const palo = new THREE.Mesh(new THREE.CylinderGeometry(.01, .01, .08), matOscuro); palo.position.y = .33; cuello.add(palo);
    const brazos = [-1, 1].map((s) => {
      const hombro = new THREE.Group(); hombro.position.set(s * .25, 1.1, 0); r.add(hombro);
      const b = new THREE.Mesh(new THREE.CapsuleGeometry(.055, .26, 4, 10), matCuerpo); b.position.y = -.17; b.castShadow = true; hombro.add(b);
      return hombro;
    });
    return { r, cuello, ojoMat, antena, brazos };
  }
  function silla() {
    const s = new THREE.Group();
    const asiento = new THREE.Mesh(new RoundedBoxGeometry(.6, .1, .55, 2, .04), matOscuro); asiento.position.y = .58; asiento.castShadow = true; s.add(asiento);
    const resp = new THREE.Mesh(new RoundedBoxGeometry(.56, .62, .08, 2, .04), matOscuro); resp.position.set(0, .92, .26); resp.castShadow = true; s.add(resp);
    const pie = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .5), matOscuro); pie.position.y = .3; s.add(pie);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(.28, .3, .04, 20), matOscuro); base.position.y = .04; s.add(base);
    return s;
  }
  const zTex = canvasTex(64, 64, (g) => { g.fillStyle = '#d6d8ea'; g.font = '800 46px Manrope, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('z', 32, 34); });

  const W = 8.4, D = 5.4;
  const puestos = new Map(), salas = new Map(), flujos = [], clicables = [];
  const deskMat = new THREE.MeshStandardMaterial({ color: 0x2b2f50, roughness: .4, metalness: .35 });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x0a0b14, roughness: .35, metalness: .4 });
  function puesto(g, d, a, x, off) {
    const p = new THREE.Group(); p.position.set(x, .18, -.55); g.add(p);
    const desk = new THREE.Mesh(new RoundedBoxGeometry(1.9, .08, .95, 2, .03), deskMat); desk.position.y = .74; desk.castShadow = desk.receiveShadow = true; p.add(desk);
    [-.85, .85].forEach((lx) => { const l = new THREE.Mesh(new THREE.BoxGeometry(.06, .74, .85), frameMat); l.position.set(lx, .37, 0); l.castShadow = true; p.add(l); });
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.32, .82), new THREE.MeshBasicMaterial({ map: pantalla(a, d.color, off), toneMapped: false })); scr.position.set(0, 1.27, -.24); p.add(scr);
    const fr = new THREE.Mesh(new RoundedBoxGeometry(1.42, .92, .05, 2, .02), frameMat); fr.position.set(0, 1.27, -.28); fr.castShadow = true; p.add(fr);
    const stand = new THREE.Mesh(new THREE.BoxGeometry(.08, .3, .06), frameMat); stand.position.set(0, .92, -.28); p.add(stand);
    const teclado = new THREE.Mesh(new RoundedBoxGeometry(.6, .025, .2, 2, .01), frameMat); teclado.position.set(0, .79, .12); p.add(teclado);
    const ch = silla(); ch.position.set(0, 0, .85); p.add(ch);
    const rb = robot(new THREE.Color(d.color)); rb.r.position.set(0, -.08, .78); rb.r.rotation.y = Math.PI; rb.r.scale.setScalar(.95); p.add(rb.r);
    const glow = new THREE.PointLight(new THREE.Color(off ? '#000000' : (ST[a.st] || ST.espera)[0]), off ? 0 : 1.6, 2.8); glow.position.set(0, 1.4, .3); p.add(glow);
    const baliza = new THREE.Mesh(new THREE.SphereGeometry(.12, 16, 16), new THREE.MeshBasicMaterial({ color: 0xFF5E6C, toneMapped: false })); baliza.position.set(.62, 1.85, -.27); baliza.visible = false; p.add(baliza);
    const zs = [0, 1, 2].map((k) => { const z = new THREE.Sprite(new THREE.SpriteMaterial({ map: zTex, transparent: true, opacity: 0, depthWrite: false })); z.scale.setScalar(.25); p.add(z); return { z, o: k / 3 }; });
    const tag = document.createElement('div'); tag.className = 'pb-of-tag' + (off ? ' off' : '');
    const lb = new CSS2DObject(tag); lb.position.set(0, 2.15, -.25); p.add(lb);
    if (!off) tag.addEventListener('click', (e) => { e.stopPropagation(); abrirAgente(a.id); });
    const o = { p, scr, glow, baliza, zs, rb, ch, tag, a, d, off, t0: Math.random() * 6 };
    [desk, scr, fr, rb.r, ch].forEach((m) => m.traverse((n) => { if (n.isMesh) { n.userData.puesto = o; clicables.push(n); } }));
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
    tip.append(b, m);
    if (a.ultima) { const u = document.createElement('u'); u.textContent = 'Último: ' + a.ultima.txt + ' · ' + a.ultima.hace; tip.append(u); }
    tag.append(tip);
  }
  DEPTS.forEach((d) => {
    const g = new THREE.Group(); g.position.set(d.pos[0], 0, d.pos[1]); scene.add(g);
    const col = new THREE.Color(d.color); const sx = Math.sign(d.pos[0]);
    const base = new THREE.Mesh(new RoundedBoxGeometry(W, .18, D, 2, .05), new THREE.MeshStandardMaterial({ color: d.activo ? 0x1c2042 : 0x111326, roughness: .5, metalness: .3 })); base.position.y = .09; base.receiveShadow = true; g.add(base);
    const borde = new THREE.Mesh(new THREE.BoxGeometry(W, .02, .05), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: d.activo ? 1 : .25 })); borde.position.set(0, .19, D / 2 - .03); g.add(borde);
    const glass = new THREE.MeshPhysicalMaterial({ color: col, transparent: true, opacity: d.activo ? .12 : .04, roughness: .05, metalness: 0, side: THREE.DoubleSide, depthWrite: false });
    const back = new THREE.Mesh(new THREE.PlaneGeometry(W, 1.6), glass); back.position.set(0, .98, -D / 2); g.add(back);
    const lat = new THREE.Mesh(new THREE.PlaneGeometry(D, 1.6), glass); lat.rotation.y = Math.PI / 2; lat.position.set(sx * W / 2, .98, 0); g.add(lat);
    [[0, 1.78, -D / 2, W, 0], [sx * W / 2, 1.78, 0, D, Math.PI / 2]].forEach(([x, y, z, len, ry]) => { const l = new THREE.Mesh(new THREE.BoxGeometry(len, .035, .035), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: d.activo ? .95 : .2 })); l.position.set(x, y, z); l.rotation.y = ry; g.add(l); });
    if (d.activo) { const pl = new THREE.PointLight(col, 5, 10); pl.position.set(0, 3.2, 1); g.add(pl); }
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.2, .9), new THREE.MeshBasicMaterial({ transparent: true, toneMapped: false }));
    sign.position.set(0, 2.45, -D / 2 + .02); g.add(sign);
    salas.set(d.id, { d, g, sign });
    sign.userData.sala = d; base.userData.sala = d; clicables.push(sign, base);
    const lista = d.activo ? agsDe(d.id) : (d.futuros || []).map(([nombre, icono, glifo], i) => ({ id: d.id + i, nombre, icono, glifo, st: 'apagado', hoy: 0 }));
    lista.forEach((a, i) => { const o = puesto(g, d, a, (i - (lista.length - 1) / 2) * 2.6, !d.activo); puestos.set(a.id, o); pintaTag(o); });
    const desde = new THREE.Vector3(sx * 2.9, .03, 0), hasta = new THREE.Vector3(d.pos[0] - sx * W / 2, .03, d.pos[1]); const cx = hasta.x - sx * 1.3;
    const ruta = new THREE.CurvePath();
    ruta.add(new THREE.LineCurve3(desde, new THREE.Vector3(cx, .03, 0))); ruta.add(new THREE.LineCurve3(new THREE.Vector3(cx, .03, 0), new THREE.Vector3(cx, .03, hasta.z))); ruta.add(new THREE.LineCurve3(new THREE.Vector3(cx, .03, hasta.z), hasta));
    const tubo = new THREE.Mesh(new THREE.TubeGeometry(ruta, 200, .03, 6), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: d.activo ? .5 : .12 })); scene.add(tubo);
    const dots = []; if (d.activo) for (let k = 0; k < 4; k++) { const s = new THREE.Mesh(new THREE.SphereGeometry(.08, 12, 12), new THREE.MeshBasicMaterial({ color: col, toneMapped: false })); scene.add(s); dots.push({ s, o: k / 4 }); }
    flujos.push({ ruta, dots, d });
  });

  function refrescarEscena() {
    puestos.forEach((o) => {
      if (o.off) { o.rb.r.visible = false; return; }
      const a = ag(o.a.id); if (!a) return; o.a = a;
      const c = new THREE.Color((ST[a.st] || ST.espera)[0]);
      o.glow.color.copy(c); o.glow.intensity = a.st === 'apagado' ? 0 : a.st === 'dormido' ? .35 : 1.6;
      o.scr.material.map.dispose(); o.scr.material.map = pantalla(a, o.d.color, false); o.scr.material.needsUpdate = true;
      o.rb.r.visible = a.st !== 'apagado';
      o.rb.ojoMat.color.set(a.st === 'error' ? '#FF5E6C' : a.st === 'pausado' ? '#8E84FF' : a.st === 'espera' ? '#FFB547' : a.st === 'dormido' ? '#2a2d3e' : o.d.color);
      o.baliza.visible = a.st === 'error';
      pintaTag(o);
    });
    salas.forEach(({ d, sign }) => {
      let extra = { txt: 'En obras', color: '#6c6f82' };
      if (d.activo) {
        const lista = agsDe(d.id), n = pendientes().filter((p) => p.a.dept === d.id).length, err = lista.some((a) => a.st === 'error');
        const tr = lista.filter((a) => a.st === 'trabajando').length;
        extra = err ? { txt: 'Hay un error', color: '#FF5E6C' } : n ? { txt: n === 1 ? '1 cosa para vosotros' : n + ' cosas para vosotros', color: '#FFB547' } : { txt: tr ? `${tr} de ${lista.length} trabajando` : 'Todo en orden', color: '#3DDC84' };
      }
      if (sign.material.map) sign.material.map.dispose(); sign.material.map = cartel(d, extra); sign.material.needsUpdate = true;
    });
    health.clear();
    const act = DEPTS.filter((d) => d.activo); const seg = Math.PI * 2 / act.length;
    act.forEach((d, i) => { const e = estadoDept(d.id); const m = new THREE.Mesh(new THREE.RingGeometry(2.28, 2.5, 72, 1, i * seg + .07, seg - .14), new THREE.MeshBasicMaterial({ color: e === 'error' ? 0xFF5E6C : e === 'aviso' ? 0xFFB547 : 0x3DDC84, transparent: true, side: THREE.DoubleSide, toneMapped: false })); m.rotation.x = -Math.PI / 2; m.userData.err = e === 'error'; health.add(m); });
    const pend = pendientes(), ne = pend.filter((p) => p.err).length;
    coreEl.innerHTML = '<b>PEBAI</b>' + (ne ? `<span class="err">${ne === 1 ? '1 agente con error' : ne + ' agentes con error'}</span>` : pend.length ? `<span class="warn">${pend.length === 1 ? '1 cosa espera por vosotros' : pend.length + ' cosas esperan por vosotros'}</span>` : '<span class="ok">Todo en orden</span>');
  }

  let fly = null;
  const volar = (p, t) => { fly = { p0: camera.position.clone(), t0: target.clone(), p1: p.clone(), t1: t.clone(), k: 0 }; };
  volar(HOME.p, HOME.t);
  const ray = new THREE.Raycaster(), m2 = new THREE.Vector2();
  const tocar = (e) => { const r = renderer.domElement.getBoundingClientRect(); m2.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(m2, camera); return ray.intersectObjects(clicables, false)[0]; };
  let hover = null;
  renderer.domElement.addEventListener('pointermove', (e) => {
    const h = tocar(e); const o = h && h.object.userData.puesto && !h.object.userData.puesto.off ? h.object.userData.puesto : null;
    const s = h && h.object.userData.sala ? h.object.userData.sala : null;
    renderer.domElement.style.cursor = o || s ? 'pointer' : 'default';
    if (hover !== o) { if (hover) hover.tag.classList.remove('hover'); hover = o; if (o) o.tag.classList.add('hover'); }
  });
  renderer.domElement.addEventListener('click', (e) => {
    const h = tocar(e);
    if (h && h.object.userData.puesto && !h.object.userData.puesto.off) { abrirAgente(h.object.userData.puesto.a.id); return; }
    if (h && h.object.userData.sala) { abrirSala(h.object.userData.sala); return; }
    if (side.classList.contains('on') || foco) cerrar();
  });
  new ResizeObserver(() => {
    if (!W0()) return; encajar(); camera.aspect = W0() / H0(); camera.updateProjectionMatrix();
    renderer.setSize(W0(), H0()); composer.setSize(W0(), H0()); labels.setSize(W0(), H0());
    if (!foco) volar(HOME.p, HOME.t); else if (foco.agente) enfocarAgente(foco.agente); else if (foco.sala) enfocarSala(DEPTS.find((x) => x.id === foco.sala));
  }).observe(wrap);

  const clock = new THREE.Clock();
  function tick() {
    requestAnimationFrame(tick);
    if (document.hidden || !enPagina()) return;
    const t = clock.getElapsedTime();
    mark.position.y = 2.3 + Math.sin(t * 1.1) * .05; mark.lookAt(camera.position.x, mark.position.y, camera.position.z);
    health.rotation.y = t * .07; health.children.forEach((m) => { if (m.userData.err) m.material.opacity = .5 + Math.sin(t * 5) * .45; });
    coreLight.intensity = 6 + Math.sin(t * 1.4) * 1.2;
    puestos.forEach((o) => {
      if (o.off) return;
      const st = o.a.st, rb = o.rb, tt = t + o.t0;
      const [bi, bd] = rb.brazos;
      rb.cuello.rotation.set(0, 0, 0); bi.rotation.set(0, 0, 0); bd.rotation.set(0, 0, 0); rb.r.position.y = -.08;
      o.zs.forEach((z) => { z.z.material.opacity = 0; });
      if (st === 'trabajando') {
        bi.rotation.x = -1.15 + Math.sin(tt * 14) * .12; bd.rotation.x = -1.15 + Math.sin(tt * 14 + 1.7) * .12;
        rb.cuello.rotation.x = -.12 + Math.sin(tt * 2) * .03; rb.cuello.rotation.y = Math.sin(tt * .7) * .08;
        rb.antena.material.color.set(Math.sin(tt * 6) > 0 ? o.d.color : '#ffffff');
        o.glow.intensity = 1.4 + Math.sin(tt * 5) * .4;
      } else if (st === 'espera') {
        bi.rotation.x = -.35; bd.rotation.x = -.35;
        rb.cuello.rotation.y = Math.sin(tt * .55) * .55; rb.cuello.rotation.x = .08;
      } else if (st === 'dormido') {
        rb.cuello.rotation.x = -.75; bi.rotation.x = -1.35; bd.rotation.x = -1.35; rb.r.position.y = -.12 + Math.sin(tt * 1.2) * .01;
        o.zs.forEach((z) => { const k = (tt * .32 + z.o) % 1; z.z.position.set(.2 + k * .45, 1.5 + k * .8, .7); z.z.material.opacity = Math.sin(k * Math.PI) * .9; z.z.scale.setScalar(.16 + k * .18); });
      } else if (st === 'error') {
        rb.cuello.rotation.y = Math.sin(tt * 3) * .5; bi.rotation.z = .6; bd.rotation.z = -.6; bi.rotation.x = -.4; bd.rotation.x = -.4;
        o.baliza.visible = Math.sin(t * 8) > -.1; o.glow.intensity = .8 + (Math.sin(t * 8) > 0 ? 1.4 : 0);
      } else if (st === 'pausado') {
        bi.rotation.x = -1.1; bd.rotation.x = -1.1; bi.rotation.z = -.5; bd.rotation.z = .5; rb.cuello.rotation.x = .05;
      }
    });
    flujos.forEach((f) => { const vivo = agsDe(f.d.id).some((a) => a.st === 'trabajando'); f.dots.forEach((dt) => { dt.s.visible = vivo; if (vivo) dt.s.position.copy(f.ruta.getPointAt((t * .1 + dt.o) % 1)); }); });
    if (fly) { fly.k = Math.min(1, fly.k + .022); const e = 1 - Math.pow(1 - fly.k, 3); camera.position.lerpVectors(fly.p0, fly.p1, e); target.lerpVectors(fly.t0, fly.t1, e); if (fly.k >= 1) fly = null; }
    camera.lookAt(target);
    composer.render(); labels.render(scene, camera);
  }
  G = { THREE, volar, HOME, refrescarEscena, puestos, fit: () => HOME.p.y / 21 };
  refrescarEscena(); tick();
}

/* ============ ciclo ============ */
async function refrescar() {
  try {
    if (!(await cargar())) return;
    pintaHud();
    if (!G) await montar(); else G.refrescarEscena();
  } catch (e) { toast(e.message || 'No se ha podido cargar la oficina.', true); }
}
const alEntrar = () => { if (enPagina()) refrescar(); };
document.addEventListener('pb:page', alEntrar);
document.addEventListener('pb:agview', alEntrar);
setInterval(() => { if (!document.hidden && enPagina() && !side.classList.contains('on')) refrescar(); }, 60000);
alEntrar();
}
