/* PEBAI · Panel — Automático › Oficina: centro de control 3D de los agentes.
   Datos reales en index.php?oficina=1 (ver _oficina_panel.php). Three.js se carga solo al abrir la sección.
   Todo texto que llega de los agentes se pinta con textContent o escapado: nunca HTML de los datos. */
const app = document.getElementById('pb-app');
const sec = document.getElementById('page-oficina');
if (app && sec) {
const BASE = app.dataset.base;
const $ = (s, r) => (r || document).querySelector(s);
const S = { csrf: app.dataset.csrf, agentes: [], ia: false, listo: false };
const ST = { trabajando: ['#3DDC84', 'Trabajando'], espera: ['#FFB547', 'En espera'], dormido: ['#7C7F95', 'Durmiendo'], error: ['#FF5E6C', 'Error'], apagado: ['#7C7F95', 'Apagado'], pausado: ['#7E73FF', 'En pausa'] };
const DEPTS = [
  { id: 'captacion', nombre: 'Captación', color: '#B7FF3C', pos: [-9.4, 4.4], activo: true, objetivo: 'Conseguir conversaciones con empresas nuevas' },
  { id: 'embudo', nombre: 'Embudo', color: '#8E84FF', pos: [9.4, 4.4], activo: true, objetivo: 'Llevar cada solicitud hasta la sesión técnica' },
  { id: 'redes', nombre: 'Redes', color: '#E25CFF', pos: [-9.4, -6.4], activo: false, objetivo: 'Publicar contenido que traiga solicitudes', futuros: [['Carruseles', 'instagram'], ['Vídeos', 'tiktok']] },
  { id: 'operaciones', nombre: 'Operaciones', color: '#3FD5FF', pos: [9.4, -6.4], activo: false, objetivo: 'Proyectos y entregas a clientes', futuros: [['Proyectos', null, 'flow']] },
];
const FONDO = { scraper: '#1a7f45', whatsapp: '#1fae58', email: '#c5372b', fases: '#4b40c9', recordatorios: '#4b40c9', calcom: '#4b40c9' };
const GLIFOS = { flow: 'M3 3h7v7H3zM14 14h7v7h-7zM10 6.5h3.5a3 3 0 0 1 3 3V14', bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0', cal: 'M3 5h18v16H3zM16 3v4M8 3v4M3 10h18' };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const brand = (k) => (window.PB_ICONS && window.PB_ICONS.brands && window.PB_ICONS.brands[k]) ? window.PB_ICONS.brands[k].d : null;
const hora = (ts) => String(ts || '').slice(11, 16);
const toast = (m, err) => { const t = $('#pb-toast'); if (!t) return; $('span', t).textContent = m; t.classList.toggle('err', !!err); t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 3200); };

/* ============ datos ============ */
async function cargar() {
  const r = await fetch(BASE + '?oficina=1', { credentials: 'same-origin', cache: 'no-store' });
  if (r.status === 401) { location.reload(); return false; }
  let j; try { j = await r.json(); } catch (e) { throw new Error('La oficina no ha respondido bien.'); }
  if (!j.ok) throw new Error(j.error || 'No se ha podido cargar la oficina.');
  S.agentes = j.agentes; S.csrf = j.csrf; S.ia = j.ia; return true;
}
const agsDe = (id) => S.agentes.filter((a) => a.dept === id);
const necesidades = () => S.agentes.flatMap((a) => (a.necesita || []).map((n) => ({ a, n })));
const conError = () => S.agentes.filter((a) => a.st === 'error');
const estadoDept = (id) => { const a = agsDe(id); return a.some((x) => x.st === 'error') ? 'error' : a.some((x) => (x.necesita || []).length) ? 'aviso' : 'ok'; };

/* ============ DOM fijo de la sección ============ */
const wrap = $('#pb-of'); const top = $('#pb-of-top'); const side = $('#pb-of-side'); const sideIn = $('#pb-of-sidein');
$('#pb-of-x').onclick = () => cerrar();

function pintaTop() {
  top.replaceChildren();
  conError().forEach((a) => { const p = document.createElement('button'); p.className = 'pb-of-pill err'; p.innerHTML = '<i></i>'; p.append(a.nombre + ': ' + (a.motivo || 'error')); p.onclick = () => abrirAgente(a.id); top.append(p); });
  const nec = necesidades();
  if (nec.length) { const p = document.createElement('button'); p.className = 'pb-of-pill need'; p.innerHTML = '<i></i>'; p.append(nec.length === 1 ? '1 cosa espera por ti' : nec.length + ' cosas esperan por ti'); p.onclick = abrirPendientes; top.append(p); }
  if (!conError().length && !nec.length) { const p = document.createElement('span'); p.className = 'pb-of-pill'; p.innerHTML = '<i></i>Todo funciona'; top.append(p); }
  const g = (id) => S.agentes.find((a) => a.id === id) || { hoy: 0 };
  const k = document.createElement('span'); k.className = 'pb-of-pill kpi';
  k.innerHTML = `Hoy: <b>${g('whatsapp').hoy + g('email').hoy}</b> mensajes · <b>${g('whatsapp').respuestas_hoy || 0}</b> respuestas · <b>${g('scraper').hoy}</b> empresas nuevas`;
  top.append(k);
}

/* ============ panel lateral: las preguntas de siempre, respondidas ============ */
const q = (t, cuerpo) => `<div class="pb-of-q"><h4>${t}</h4>${cuerpo}</div>`;
function icoHtml(a) {
  const d = a.icono && brand(a.icono);
  return d ? `<span class="ico" style="background:${FONDO[a.id] || '#3a3d52'}"><svg viewBox="0 0 24 24"><path fill="#fff" d="${d}"/></svg></span>`
    : `<span class="ico" style="background:${FONDO[a.id] || '#3a3d52'}"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${GLIFOS[a.glifo] || GLIFOS.flow}"/></svg></span>`;
}
function abrirAgente(id) {
  const a = S.agentes.find((x) => x.id === id); if (!a) return;
  const d = DEPTS.find((x) => x.id === a.dept); enfocar(d);
  const [c, txt] = ST[a.st] || ST.espera;
  const pct = a.cupo ? Math.min(100, Math.round(a.hoy / a.cupo * 100)) : 0;
  sideIn.innerHTML = `<div class="k">${esc(d.nombre)}</div><h2>${icoHtml(a)}${esc(a.nombre)}</h2><div class="rol">${esc(a.rol || '')}</div>
    <span class="pb-of-status"><i style="background:${c}"></i>${txt}</span>
    <div class="pb-of-qa">
    ${q('¿Está funcionando?', `<p class="${a.st === 'error' ? 'bad' : a.st === 'trabajando' ? 'ok' : ''}">${esc(a.motivo)}</p>`)}
    ${q('¿Qué ha hecho hoy?', `<p><b>${a.hoy}</b> ${esc(a.unidad)}${a.cupo ? ` de ${a.cupo} posibles` : ''}.</p>${a.cupo ? `<div class="bar" style="--c:${d.color}"><i data-w="${pct}%"></i></div>` : ''}`)}
    ${q('¿Qué fue lo último?', a.ultima ? `<p><b>${esc(a.ultima.hace)}</b> · ${esc(a.ultima.txt)}</p>` : '<p>Todavía no ha hecho nada.</p>')}
    ${q('¿Ha fallado algo?', (a.errores || []).length ? a.errores.map((e) => `<p class="bad"><b>${esc(hora(e.ts))}</b> · ${esc(e.txt)}</p>`).join('') : '<p class="ok">Nada en las últimas 24 horas.</p>')}
    ${q('¿Necesita algo de vosotros?', (a.necesita || []).length ? a.necesita.map((n) => `<p class="warn">${esc(n)}</p>`).join('') : '<p>No.</p>')}
    ${a.proxima ? q('¿Qué hará ahora?', `<p>${esc(a.proxima)}</p>`) : ''}
    ${(a.datos || []).length ? q('Más datos', `<dl>${a.datos.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`) : ''}
    ${(a.actividad || []).length ? q('Lo que ha hecho', a.actividad.slice(0, 15).map((e) => `<div class="pb-of-ev"><time>${esc(e.hace)}</time><div><u class="${esc(e.tipo)}">${esc(e.tipo)}</u>${esc(e.txt)}</div></div>`).join('')) : ''}
    </div>`;
  mostrar();
}
function abrirSala(d) {
  enfocar(d);
  if (!d.activo) { sideIn.innerHTML = `<div class="k">Departamento</div><h2>${esc(d.nombre)}</h2><div class="pb-of-qa">${q('¿Qué hará?', `<p>${esc(d.objetivo)}.</p>`)}${q('¿Cuándo?', '<p>En obras. Aparecerá aquí en cuanto montemos sus agentes.</p>')}</div>`; mostrar(); return; }
  const ag = agsDe(d.id); const e = estadoDept(d.id); const err = ag.filter((a) => a.st === 'error');
  const nec = ag.flatMap((a) => (a.necesita || []).map((n) => [a, n]));
  sideIn.innerHTML = `<div class="k">Departamento</div><h2>${esc(d.nombre)}</h2><div class="rol">${esc(d.objetivo)}</div>
    <span class="pb-of-status"><i style="background:${e === 'error' ? '#FF5E6C' : e === 'aviso' ? '#FFB547' : '#3DDC84'}"></i>${e === 'error' ? 'Hay un error' : e === 'aviso' ? 'Funciona, con cosas para vosotros' : 'Todo funciona'}</span>
    <div class="pb-of-qa">
    ${q('¿Va todo bien?', err.length ? err.map((a) => `<p class="bad"><b>${esc(a.nombre)}</b>: ${esc(a.motivo)}</p>`).join('') : '<p class="ok">Sí. Ningún agente ha fallado.</p>')}
    ${q('¿Qué necesita de vosotros?', nec.length ? nec.map(([a, n]) => `<p class="warn"><b>${esc(a.nombre)}</b>: ${esc(n)}</p>`).join('') : '<p>Nada.</p>')}
    ${q('Agentes', ag.map((a) => `<div class="pb-of-row" data-id="${esc(a.id)}"><i style="background:${(ST[a.st] || ST.espera)[0]}"></i><b>${esc(a.nombre)}</b><span>${a.cupo ? a.hoy + '/' + a.cupo : a.hoy} hoy · ${(ST[a.st] || ST.espera)[1].toLowerCase()}</span></div>`).join(''))}
    </div>`;
  sideIn.querySelectorAll('.pb-of-row').forEach((r) => r.addEventListener('click', () => abrirAgente(r.dataset.id)));
  mostrar();
}
function abrirPendientes() {
  sideIn.innerHTML = `<div class="k">Para vosotros</div><h2>Cosas que esperan</h2><div class="pb-of-qa">${necesidades().map(({ a, n }) => `<div class="pb-of-row" data-id="${esc(a.id)}"><i style="background:#FFB547"></i><b>${esc(n)}</b><span>${esc(a.nombre)}</span></div>`).join('')}</div>`;
  sideIn.querySelectorAll('.pb-of-row').forEach((r) => r.addEventListener('click', () => abrirAgente(r.dataset.id)));
  mostrar(); if (G) G.volar(G.HOME.p, G.HOME.t); atenuar(null);
}
let abierto = null;
function mostrar() { side.classList.add('on'); side.scrollTop = 0; setTimeout(() => side.querySelectorAll('.bar i').forEach((b) => { b.style.width = b.dataset.w; }), 260); }
function cerrar() { side.classList.remove('on'); atenuar(null); if (G) G.volar(G.HOME.p, G.HOME.t); }
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.body.dataset.page === 'oficina' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) cerrar(); });

/* ============ pregunta a PEBAI ============ */
const ans = $('#pb-of-ans'), qIn = $('#pb-of-q'), qBtn = $('#pb-of-askf button');
['¿Ha fallado algo hoy?', '¿Qué han hecho hoy los agentes?', '¿Qué tengo que hacer yo?', '¿Cuándo vuelve a escribir WhatsApp?'].forEach((s) => {
  const b = document.createElement('button'); b.type = 'button'; b.textContent = s; b.onclick = () => preguntar(s); $('#pb-of-sug').append(b);
});
function formatear(t) {
  const lines = esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').split(/\n+/);
  let html = '', ul = false;
  lines.forEach((l) => {
    const m = l.match(/^\s*(?:[-*•]|\d+\.)\s+(.*)/);
    if (m) { if (!ul) { html += '<ul>'; ul = true; } html += '<li>' + m[1] + '</li>'; }
    else { if (ul) { html += '</ul>'; ul = false; } if (l.trim()) html += '<p style="margin:0 0 6px">' + l + '</p>'; }
  });
  return html + (ul ? '</ul>' : '');
}
async function preguntar(t) {
  t = String(t || '').trim(); if (!t) { qIn.focus(); return; }
  ans.classList.add('on'); ans.innerHTML = '<div class="pens">PEBAI está mirando los departamentos…</div>'; qBtn.disabled = true; qIn.value = '';
  try {
    const r = await fetch(BASE, { method: 'POST', credentials: 'same-origin', headers: { 'Accept': 'application/json' }, body: new URLSearchParams({ action: 'oficina_preguntar', csrf: S.csrf, q: t }) });
    if (r.status === 401) { location.reload(); return; }
    const j = await r.json().catch(() => ({ ok: false, error: 'Respuesta inesperada.' }));
    ans.innerHTML = '';
    const x = document.createElement('button'); x.className = 'cerrar'; x.type = 'button'; x.textContent = '×'; x.onclick = () => ans.classList.remove('on');
    const qd = document.createElement('div'); qd.style.cssText = 'color:#8C8FA3;font-size:12px;margin-bottom:6px;padding-right:20px'; qd.textContent = t;
    const body = document.createElement('div'); body.innerHTML = j.ok ? formatear(j.respuesta) : '<p style="margin:0;color:#FF8A95">' + esc(j.error) + '</p>';
    ans.append(x, qd, body);
  } catch (e) { ans.textContent = 'No se ha podido preguntar ahora.'; }
  qBtn.disabled = false;
}
$('#pb-of-askf').addEventListener('submit', (e) => { e.preventDefault(); preguntar(qIn.value); });

/* ============ escena 3D ============ */
let G = null;
const lbls = { salas: new Map(), tags: new Map() };
function atenuar(d) {
  lbls.salas.forEach((el, id) => { el.style.opacity = !d || d.id === id ? '' : '.35'; });
  lbls.tags.forEach((el, id) => { const a = S.agentes.find((x) => x.id === id); el.style.opacity = !d || (a && a.dept === d.id) || (!a && el.dataset.dept === d.id) ? '' : '.25'; });
}
function enfocar(d) {
  atenuar(d); if (!G) return;
  const f = G.fit(); const off = wrap.clientWidth > 760 ? 3.6 * f : 0;
  const c = new G.THREE.Vector3(d.pos[0], 0, d.pos[1]);
  G.volar(c.clone().add(new G.THREE.Vector3(off, 10.5 * f, 11.5 * f)), c.clone().add(new G.THREE.Vector3(off, .8, 0)));
}

async function montar() {
  const THREE = await import('three');
  const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
  const { CSS2DRenderer, CSS2DObject } = await import('three/addons/renderers/CSS2DRenderer.js');
  const { EffectComposer } = await import('three/addons/postprocessing/EffectComposer.js');
  const { RenderPass } = await import('three/addons/postprocessing/RenderPass.js');
  const { UnrealBloomPass } = await import('three/addons/postprocessing/UnrealBloomPass.js');
  const { OutputPass } = await import('three/addons/postprocessing/OutputPass.js');
  $('#pb-of-load').remove();
  const W0 = () => wrap.clientWidth, H0 = () => wrap.clientHeight;
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(W0(), H0());
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.35;
  wrap.prepend(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x06070d); scene.fog = new THREE.Fog(0x06070d, 36, 68);
  const camera = new THREE.PerspectiveCamera(34, W0() / H0(), .1, 200);
  const BASEP = new THREE.Vector3(0, 19, 19.5);
  const HOME = { p: BASEP.clone(), t: new THREE.Vector3(0, 0, -.4) };
  // Encaja la oficina en el hueco disponible: cuanto más estrecho, más se aleja la cámara
  const encajar = () => { const f = Math.min(1.75, Math.max(1, 1.95 / (W0() / H0()))); HOME.p.copy(BASEP).multiplyScalar(f); controls.maxDistance = 44 * f; };
  camera.position.set(0, 32, 31);
  const labels = new CSS2DRenderer(); labels.setSize(W0(), H0()); labels.domElement.className = 'pb-of-lbl'; wrap.append(labels.domElement);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(HOME.t); controls.enableDamping = true; controls.enablePan = false;
  controls.minDistance = 10; controls.maxDistance = 44; controls.minPolarAngle = .45; controls.maxPolarAngle = 1.1; controls.minAzimuthAngle = -.6; controls.maxAzimuthAngle = .6;
  const composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(W0(), H0()), .5, .4, .8); composer.addPass(bloom); composer.addPass(new OutputPass());
  scene.add(new THREE.HemisphereLight(0xc9ccff, 0x14162a, 1.05));
  const sun = new THREE.DirectionalLight(0xffffff, 1.5); sun.position.set(-10, 22, 14); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 24, bottom: -24 }); sun.shadow.bias = -.0004; scene.add(sun);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshStandardMaterial({ color: 0x0e1020, roughness: .92 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const grid = new THREE.GridHelper(80, 80, 0x1c1f33, 0x13152a); grid.position.y = .005; scene.add(grid);

  /* núcleo: el logo de PEBAI y el anillo de salud */
  const dais = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.8, .35, 64), new THREE.MeshStandardMaterial({ color: 0x14172a, roughness: .4, metalness: .55 }));
  dais.position.y = .175; dais.castShadow = dais.receiveShadow = true; scene.add(dais);
  const tex = new THREE.TextureLoader().load(BASE + 'assets/pebai-mark.png'); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const mark = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 2.71), new THREE.MeshBasicMaterial({ map: tex, transparent: true })); mark.position.y = 2.25; scene.add(mark);
  const sombra = new THREE.Mesh(new THREE.CircleGeometry(1.05, 48), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: .45 })); sombra.rotation.x = -Math.PI / 2; sombra.position.y = .36; scene.add(sombra);
  const halo = new THREE.PointLight(0x8e84ff, 6, 8); halo.position.set(0, 2, 1.5); scene.add(halo);
  const health = new THREE.Group(); health.position.y = .37; scene.add(health);
  const coreEl = document.createElement('div'); coreEl.className = 'pb-of-core';
  const coreLbl = new CSS2DObject(coreEl); coreLbl.position.set(0, -.2, 3.05); scene.add(coreLbl);

  /* salas */
  const W = 8.2, D = 5.2;
  const puestos = new Map(), flujos = [];
  const pantalla = (a, color, off) => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 320; const g = c.getContext('2d');
    g.fillStyle = '#0d1020'; g.fillRect(0, 0, 512, 320);
    g.fillStyle = off ? '#2a2d3e' : (FONDO[a.id] || '#3a3d52'); g.beginPath(); g.roundRect(196, 46, 120, 120, 28); g.fill();
    g.save(); g.translate(226, 76); g.scale(2.5, 2.5);
    const d = a.icono && brand(a.icono);
    if (d) { g.fillStyle = '#fff'; g.fill(new Path2D(d)); } else { g.strokeStyle = '#fff'; g.lineWidth = 2; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(new Path2D(GLIFOS[a.glifo] || GLIFOS.flow)); }
    g.restore();
    g.fillStyle = off ? '#6c6f82' : '#EFEDE7'; g.font = '700 38px Manrope, sans-serif'; g.textAlign = 'center'; g.fillText(a.nombre, 256, 222);
    if (!off) {
      const st = ST[a.st] || ST.espera; g.fillStyle = st[0]; g.font = '600 26px Manrope, sans-serif'; g.fillText(st[1] + (a.cupo ? ` · ${a.hoy}/${a.cupo}` : ''), 256, 266);
      if (a.cupo) { g.fillStyle = '#23263a'; g.beginPath(); g.roundRect(136, 286, 240, 10, 5); g.fill(); g.fillStyle = color; g.beginPath(); g.roundRect(136, 286, Math.max(10, 240 * Math.min(1, a.hoy / a.cupo)), 10, 5); g.fill(); }
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
  };
  const deskMat = new THREE.MeshStandardMaterial({ color: 0x2a2e4d, roughness: .45, metalness: .3 });
  const legMat = new THREE.MeshStandardMaterial({ color: 0x14172a });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x090a12, roughness: .4 });
  function puesto(g, d, a, x, off) {
    const p = new THREE.Group(); p.position.set(x, .16, -.4); g.add(p);
    const desk = new THREE.Mesh(new THREE.BoxGeometry(1.8, .08, .9), deskMat); desk.position.y = .72; desk.castShadow = desk.receiveShadow = true; p.add(desk);
    [-.8, .8].forEach((lx) => { const l = new THREE.Mesh(new THREE.BoxGeometry(.06, .72, .8), legMat); l.position.set(lx, .36, 0); l.castShadow = true; p.add(l); });
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.3, .81), new THREE.MeshBasicMaterial({ map: pantalla(a, d.color, off) })); scr.position.set(0, 1.25, -.25); p.add(scr);
    const fr = new THREE.Mesh(new THREE.BoxGeometry(1.38, .89, .05), frameMat); fr.position.set(0, 1.25, -.29); fr.castShadow = true; p.add(fr);
    const stand = new THREE.Mesh(new THREE.BoxGeometry(.08, .3, .06), frameMat); stand.position.set(0, .9, -.29); p.add(stand);
    const luz = new THREE.Mesh(new THREE.SphereGeometry(.075, 16, 16), new THREE.MeshBasicMaterial({ color: off ? 0x2a2d3e : (ST[a.st] || ST.espera)[0] })); luz.position.set(.58, 1.76, -.27); p.add(luz);
    const glow = new THREE.PointLight(off ? 0x000000 : (ST[a.st] || ST.espera)[0], off ? 0 : 1.4, 2.6); glow.position.set(0, 1.4, .4); p.add(glow);
    /* etiqueta mínima: punto + nombre; el resumen aparece al pasar el ratón */
    const tag = document.createElement('div'); tag.className = 'pb-of-tag' + (off ? ' off' : ''); tag.dataset.dept = d.id;
    const lb = new CSS2DObject(tag); lb.position.set(0, 2.05, -.25); p.add(lb);
    if (!off) tag.addEventListener('click', () => abrirAgente(a.id));
    return { p, scr, luz, glow, tag, a, d, off };
  }
  function pintaTag(o) {
    const { tag, a, off } = o; tag.replaceChildren();
    const i = document.createElement('i'); i.style.background = off ? '#3a3d52' : (ST[a.st] || ST.espera)[0];
    tag.append(i, a.nombre);
    tag.classList.toggle('error', !off && a.st === 'error');
    if (off) return;
    const tip = document.createElement('div'); tip.className = 'tip';
    const b = document.createElement('b'); b.textContent = (ST[a.st] || ST.espera)[1] + (a.cupo ? ` · ${a.hoy} de ${a.cupo} hoy` : ` · ${a.hoy} hoy`);
    const m = document.createElement('div'); m.textContent = a.motivo || '';
    tip.append(b, m);
    if (a.ultima) { const u = document.createElement('u'); u.textContent = 'Último: ' + a.ultima.txt + ' (' + a.ultima.hace + ')'; tip.append(u); }
    tag.append(tip);
  }
  DEPTS.forEach((d) => {
    const g = new THREE.Group(); g.position.set(d.pos[0], 0, d.pos[1]); scene.add(g);
    const col = new THREE.Color(d.color); const sx = Math.sign(d.pos[0]);
    const base = new THREE.Mesh(new THREE.BoxGeometry(W, .16, D), new THREE.MeshStandardMaterial({ color: d.activo ? 0x1d2140 : 0x121426, roughness: .75 })); base.position.y = .08; base.receiveShadow = true; g.add(base);
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(W, .16, D)), new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: d.activo ? .75 : .2 })); edge.position.y = .08; g.add(edge);
    const franja = new THREE.Mesh(new THREE.PlaneGeometry(W - .3, .06), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: d.activo ? .9 : .2 })); franja.rotation.x = -Math.PI / 2; franja.position.set(0, .165, D / 2 - .25); g.add(franja);
    const glass = new THREE.MeshStandardMaterial({ color: col, transparent: true, opacity: d.activo ? .1 : .035, roughness: .1, metalness: .2, side: THREE.DoubleSide, depthWrite: false });
    const back = new THREE.Mesh(new THREE.PlaneGeometry(W, 1.3), glass); back.position.set(0, .81, -D / 2); g.add(back);
    const lat = new THREE.Mesh(new THREE.PlaneGeometry(D, 1.3), glass); lat.rotation.y = Math.PI / 2; lat.position.set(sx * W / 2, .81, 0); g.add(lat);
    [[0, 1.46, -D / 2, W, 0], [sx * W / 2, 1.46, 0, D, Math.PI / 2]].forEach(([x, y, z, len, ry]) => { const l = new THREE.Mesh(new THREE.BoxGeometry(len, .03, .03), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: d.activo ? .85 : .2 })); l.position.set(x, y, z); l.rotation.y = ry; g.add(l); });
    if (d.activo) { const pl = new THREE.PointLight(col, 4, 9); pl.position.set(0, 3, 1); g.add(pl); }
    const lista = d.activo ? agsDe(d.id) : (d.futuros || []).map(([nombre, icono, glifo], i) => ({ id: d.id + i, nombre, icono, glifo }));
    lista.forEach((a, i) => { const o = puesto(g, d, a, (i - (lista.length - 1) / 2) * 2.55, !d.activo); puestos.set(a.id, o); pintaTag(o); lbls.tags.set(a.id, o.tag); });
    const r = document.createElement('div'); r.className = 'pb-of-room' + (d.activo ? '' : ' off'); r.style.setProperty('--c', d.color);
    r.addEventListener('click', () => abrirSala(d)); lbls.salas.set(d.id, r);
    const rl = new CSS2DObject(r); rl.position.set(0, .2, D / 2 + .5); g.add(rl);
    const desde = new THREE.Vector3(sx * 2.8, .03, 0), hasta = new THREE.Vector3(d.pos[0] - sx * W / 2, .03, d.pos[1]); const cx = hasta.x - sx * 1.2;
    const ruta = new THREE.CurvePath();
    ruta.add(new THREE.LineCurve3(desde, new THREE.Vector3(cx, .03, 0))); ruta.add(new THREE.LineCurve3(new THREE.Vector3(cx, .03, 0), new THREE.Vector3(cx, .03, hasta.z))); ruta.add(new THREE.LineCurve3(new THREE.Vector3(cx, .03, hasta.z), hasta));
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ruta.getSpacedPoints(120)), new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: d.activo ? .55 : .12 })));
    const dots = []; if (d.activo) for (let k = 0; k < 3; k++) { const s = new THREE.Mesh(new THREE.SphereGeometry(.07, 12, 12), new THREE.MeshBasicMaterial({ color: col })); scene.add(s); dots.push({ s, o: k / 3 }); }
    flujos.push({ ruta, dots, d });
  });
  function refrescarEscena() {
    puestos.forEach((o) => {
      if (o.off) return;
      const a = S.agentes.find((x) => x.id === o.a.id); if (!a) return; o.a = a;
      const c = new THREE.Color((ST[a.st] || ST.espera)[0]); o.luz.material.color.copy(c); o.glow.color.copy(c);
      o.scr.material.map.dispose(); o.scr.material.map = pantalla(a, o.d.color, false); o.scr.material.needsUpdate = true;
      pintaTag(o);
    });
    lbls.salas.forEach((r, id) => {
      const d = DEPTS.find((x) => x.id === id); r.replaceChildren(d.nombre.toUpperCase());
      if (!d.activo) { const e = document.createElement('em'); e.textContent = 'En obras'; r.append(e); return; }
      const dots = document.createElement('span'); dots.className = 'dots'; agsDe(id).forEach((a) => { const i = document.createElement('i'); i.style.background = (ST[a.st] || ST.espera)[0]; dots.append(i); }); r.append(dots);
      const n = agsDe(id).reduce((k, a) => k + (a.necesita || []).length, 0); if (n) { const e = document.createElement('em'); e.textContent = n + ' para vosotros'; r.append(e); }
    });
    health.clear();
    const act = DEPTS.filter((d) => d.activo); const seg = Math.PI * 2 / act.length;
    act.forEach((d, i) => { const e = estadoDept(d.id); const m = new THREE.Mesh(new THREE.RingGeometry(2.25, 2.45, 64, 1, i * seg + .06, seg - .12), new THREE.MeshBasicMaterial({ color: e === 'error' ? 0xFF5E6C : e === 'aviso' ? 0xFFB547 : 0x3DDC84, transparent: true, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; m.userData.err = e === 'error'; health.add(m); });
    const ne = conError().length, nn = necesidades().length;
    coreEl.innerHTML = '<b>PEBAI</b>' + (ne ? `<span class="err">${ne === 1 ? '1 error' : ne + ' errores'}${nn ? ' · ' + nn + ' para vosotros' : ''}</span>` : nn ? `<span>${nn} para vosotros</span>` : '<span class="ok">Todo funciona</span>');
  }
  let fly = null;
  const volar = (p, t) => { fly = { p0: camera.position.clone(), t0: controls.target.clone(), p1: p.clone(), t1: t.clone(), k: 0 }; };
  encajar(); volar(HOME.p, HOME.t);
  const ray = new THREE.Raycaster(), m2 = new THREE.Vector2();
  renderer.domElement.addEventListener('click', (e) => {
    const r = renderer.domElement.getBoundingClientRect(); m2.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(m2, camera);
    const objs = [...puestos.values()].filter((o) => !o.off); const hit = ray.intersectObjects(objs.map((o) => o.scr))[0];
    if (hit) abrirAgente(objs.find((o) => o.scr === hit.object).a.id);
  });
  new ResizeObserver(() => { if (!W0()) return; const lejos = camera.position.distanceTo(HOME.p) < .5; encajar(); if (lejos && !side.classList.contains('on')) volar(HOME.p, HOME.t); camera.aspect = W0() / H0(); camera.updateProjectionMatrix(); renderer.setSize(W0(), H0()); composer.setSize(W0(), H0()); labels.setSize(W0(), H0()); }).observe(wrap);
  const clock = new THREE.Clock();
  function tick() {
    requestAnimationFrame(tick);
    if (document.hidden || document.body.dataset.page !== 'oficina') return;   // fuera de la sección no gasta nada
    const t = clock.getElapsedTime();
    mark.position.y = 2.25 + Math.sin(t * 1.2) * .05; mark.lookAt(camera.position.x, mark.position.y, camera.position.z);
    health.rotation.y = t * .08; health.children.forEach((m) => { if (m.userData.err) m.material.opacity = .55 + Math.sin(t * 5) * .4; });
    puestos.forEach((o, i) => {
      if (o.off) return; const st = o.a.st;
      o.luz.visible = st !== 'error' || Math.sin(t * 7) > -.2;
      const k = st === 'trabajando' ? 1 + Math.sin(t * 4 + o.p.position.x) * .25 : st === 'espera' ? 1 + Math.sin(t * 1.4 + o.p.position.x) * .1 : 1;
      o.luz.scale.setScalar(k); o.glow.intensity = st === 'dormido' || st === 'apagado' ? .25 : st === 'trabajando' ? 1.2 + Math.sin(t * 4) * .4 : 1;
    });
    flujos.forEach((f) => { const vivo = agsDe(f.d.id).some((a) => a.st === 'trabajando'); f.dots.forEach((dt) => { dt.s.visible = vivo; if (vivo) dt.s.position.copy(f.ruta.getPointAt((t * .12 + dt.o) % 1)); }); });
    if (fly) { fly.k = Math.min(1, fly.k + .018); const e = 1 - Math.pow(1 - fly.k, 3); camera.position.lerpVectors(fly.p0, fly.p1, e); controls.target.lerpVectors(fly.t0, fly.t1, e); if (fly.k >= 1) fly = null; }
    controls.update(); composer.render(); labels.render(scene, camera);
  }
  G = { THREE, volar, HOME, refrescarEscena, fit: () => HOME.p.y / 19 };
  refrescarEscena(); tick();
}

/* ============ ciclo ============ */
async function refrescar() {
  try {
    if (!(await cargar())) return;
    pintaTop();
    if (!G) await montar(); else G.refrescarEscena();
    S.listo = true;
  } catch (e) { toast(e.message || 'No se ha podido cargar la oficina.', true); }
}
document.addEventListener('pb:page', (e) => { if (e.detail === 'oficina') refrescar(); });
setInterval(() => { if (!document.hidden && document.body.dataset.page === 'oficina' && !$('.pb-of-side.on')) refrescar(); }, 60000);
if (document.body.dataset.page === 'oficina' || new URLSearchParams(location.search).get('tab') === 'oficina') refrescar();
}
