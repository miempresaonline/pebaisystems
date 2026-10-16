/* PEBAI · Panel — Captación › QRs para la calle (puerta fría).
   Un QR por situación de la conversación; se desliza entre ellos y se enseña a pantalla completa.
   Cada QR lleva a pebaisystems.es/q/<slug>?p=<persona>: el servidor cuenta el escaneo y la solicitud queda a nombre de quien lo enseña.
   Datos en index.php?qr=1 (ver _qr_panel.php). Los textos de los QRs se pintan con textContent o escapados. */
(() => {
'use strict';
const app = document.getElementById('pb-app');
const raiz = document.getElementById('pb-qr');
if (!app || !raiz) return;
const BASE = app.dataset.base;
const $ = (s, r) => (r || document).querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const N = (n) => new Intl.NumberFormat('es-ES', { useGrouping: 'always' }).format(n || 0);
const S = { csrf: app.dataset.csrf, codigos: [], cargado: false, i: 0 };
const PERSONAS = [['adrian', 'Adrián'], ['daniel', 'Dani']];
let persona = ''; try { persona = localStorage.getItem('pebai-qr-persona') || ''; } catch (e) { /* sin almacenamiento: sin persona */ }
const TIPOS = { reservar: 'Formulario de la consultoría', video: 'Vídeo de la consultoría', whatsapp: 'Chat de WhatsApp con nosotros', tarjeta: 'Tarjeta digital (guardar contacto)', web: 'Nuestra web', url: 'Un enlace a elegir' };
const COLORES = ['#B7FF3C', '#8E84FF', '#25D366', '#3FD5FF', '#FFB547', '#E25CFF', '#EFEDE7'];
const ICO = {
  full: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>', copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h10"/>',
  share: '<path d="M12 3v12M8 7l4-4 4 4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>', izq: '<path d="m15 6-6 6 6 6"/>', der: '<path d="m9 6 6 6-6 6"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>', edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>', plus: '<path d="M12 5v14M5 12h14"/>', up: '<path d="m6 15 6-6 6 6"/>', down: '<path d="m6 9 6 6 6-6"/>',
};
const ico = (k) => `<svg class="pb-i" viewBox="0 0 24 24">${ICO[k]}</svg>`;
const toast = (m, err) => { const t = $('#pb-toast'); if (!t) return; $('span', t).textContent = m; t.classList.toggle('err', !!err); t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 3200); };
const hace = (ts) => {
  if (!ts) return 'nunca';
  const m = Math.round((Date.now() - new Date(String(ts).replace(' ', 'T'))) / 60000);
  return m < 1 ? 'ahora mismo' : m < 60 ? `hace ${m} min` : m < 1440 ? `hace ${Math.round(m / 60)} h` : m < 2880 ? 'ayer' : `hace ${Math.round(m / 1440)} días`;
};

/* ============ QR en SVG: módulos redondeados, ojos propios y el logo en el centro (corrección H) ============ */
function qrSvg(texto, logo) {
  if (!window.qrcode) return '<div class="pb-qr-sinlib">No se ha podido cargar el generador de QR. Recarga la página.</div>';
  const q = window.qrcode(0, 'H'); q.addData(texto); q.make();
  const n = q.getModuleCount(), m = 2, tam = n + m * 2;
  const ojo = (r, c) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
  const hueco = Math.ceil(n * .26) | 1, h0 = (n - hueco) / 2;
  const enLogo = (r, c) => logo && r >= h0 && r < h0 + hueco && c >= h0 && c < h0 + hueco;
  let p = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (!q.isDark(r, c) || ojo(r, c) || enLogo(r, c)) continue;
    p += `<rect x="${c + m + .08}" y="${r + m + .08}" width=".84" height=".84" rx=".38"/>`;
  }
  const ojoSvg = (x, y) => `<rect x="${x + .5}" y="${y + .5}" width="6" height="6" rx="1.9" fill="none" stroke="#0B0F14" stroke-width="1"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" rx=".9"/>`;
  const logoSvg = logo ? `<rect x="${h0 + m - .3}" y="${h0 + m - .3}" width="${hueco + .6}" height="${hueco + .6}" rx="${hueco * .26}" fill="#fff"/><image href="${BASE}assets/pebai-mark.png" x="${h0 + m + hueco * .14}" y="${h0 + m + hueco * .08}" width="${hueco * .72}" height="${hueco * .84}" preserveAspectRatio="xMidYMid meet"/>` : '';
  return `<svg viewBox="0 0 ${tam} ${tam}" role="img" aria-label="Código QR" shape-rendering="geometricPrecision"><rect width="${tam}" height="${tam}" fill="#fff"/><g fill="#0B0F14">${p}${ojoSvg(m, m)}${ojoSvg(n - 7 + m, m)}${ojoSvg(m, n - 7 + m)}</g>${logoSvg}</svg>`;
}
const enlace = (c) => c.enlaces[persona] || c.enlaces[''];
const activos = () => S.codigos.filter((c) => c.activo);

/* ============ datos ============ */
async function cargar() {
  const r = await fetch(BASE + '?qr=1', { credentials: 'same-origin', cache: 'no-store' });
  if (r.status === 401) { location.reload(); return; }
  let j; try { j = await r.json(); } catch (e) { throw new Error('No se han podido cargar los QRs.'); }
  if (!j.ok) throw new Error(j.error || 'No se han podido cargar los QRs.');
  Object.assign(S, j, { cargado: true });
}
async function accion(action, campos, ok) {
  const r = await fetch(BASE, { method: 'POST', credentials: 'same-origin', headers: { Accept: 'application/json' }, body: new URLSearchParams({ action, csrf: S.csrf, ...campos }) });
  if (r.status === 401) { location.reload(); return null; }
  const j = await r.json().catch(() => ({ ok: false, error: 'Respuesta inesperada del servidor.' }));
  if (!j.ok) throw new Error(j.error || 'No se ha podido guardar.');
  if (ok) toast(ok);
  await cargar(); pintar();
  return j;
}

/* ============ montaje ============ */
raiz.innerHTML = `
  <div class="pb-qr-cab">
    <div><div class="pb-eyebrow">Captación · Puerta fría</div><h1 class="pb-h1">QRs para la calle, <i>a mano</i></h1>
      <p class="pb-lead">Uno para cada momento de la conversación. Desliza, elige y enséñalo a pantalla completa: cada escaneo se cuenta y la solicitud queda a tu nombre.</p></div>
    <div class="pb-qr-quien" id="pb-qr-quien" role="radiogroup" aria-label="Quién enseña el QR"><span>¿Quién lo enseña?</span></div>
  </div>
  <div class="pb-qr-sits" id="pb-qr-sits" role="tablist" aria-label="Situaciones"></div>
  <div class="pb-qr-carrwrap">
    <button class="pb-qr-flecha izq" id="pb-qr-izq" type="button" aria-label="QR anterior">${ico('izq')}</button>
    <div class="pb-qr-carr" id="pb-qr-carr" tabindex="0" aria-label="QRs: desliza para cambiar"></div>
    <button class="pb-qr-flecha der" id="pb-qr-der" type="button" aria-label="QR siguiente">${ico('der')}</button>
  </div>
  <div class="pb-qr-dots" id="pb-qr-dots"></div>
  <div class="pb-qr-dash" id="pb-qr-dash"></div>`;
const carr = $('#pb-qr-carr'), sits = $('#pb-qr-sits'), dots = $('#pb-qr-dots'), quien = $('#pb-qr-quien'), dash = $('#pb-qr-dash');
PERSONAS.forEach(([k, l]) => {
  const b = document.createElement('button'); b.type = 'button'; b.dataset.p = k; b.setAttribute('role', 'radio'); b.textContent = l;
  b.onclick = () => { persona = persona === k ? '' : k; try { localStorage.setItem('pebai-qr-persona', persona); } catch (e) { /* no pasa nada */ } pintarQuien(); pintarTarjetas(false); };
  quien.append(b);
});
function pintarQuien() {
  quien.querySelectorAll('button').forEach((b) => { const on = b.dataset.p === persona; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
  quien.classList.toggle('falta', !persona);
}
$('#pb-qr-izq').onclick = () => ir(S.i - 1);
$('#pb-qr-der').onclick = () => ir(S.i + 1);
function ir(i, suave = true) {
  const l = activos(); if (!l.length) return;
  S.i = (i + l.length) % l.length;
  const card = carr.children[S.i]; if (card) carr.scrollTo({ left: card.offsetLeft - (carr.clientWidth - card.clientWidth) / 2, behavior: suave ? 'smooth' : 'auto' });
  marcar();
}
function marcar() {
  [...carr.children].forEach((c, k) => c.classList.toggle('on', k === S.i));
  [...dots.children].forEach((d, k) => d.classList.toggle('on', k === S.i));
  [...sits.children].forEach((d, k) => { d.classList.toggle('on', k === S.i); d.setAttribute('aria-selected', k === S.i); });
  const on = sits.children[S.i]; if (on) on.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
}
let scrollT; carr.addEventListener('scroll', () => {
  clearTimeout(scrollT);
  scrollT = setTimeout(() => {
    const mid = carr.scrollLeft + carr.clientWidth / 2; let mejor = 0, d = Infinity;
    [...carr.children].forEach((c, k) => { const dd = Math.abs(c.offsetLeft + c.clientWidth / 2 - mid); if (dd < d) { d = dd; mejor = k; } });
    if (mejor !== S.i) { S.i = mejor; marcar(); }
  }, 80);
}, { passive: true });
carr.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { e.preventDefault(); ir(S.i + 1); } if (e.key === 'ArrowLeft') { e.preventDefault(); ir(S.i - 1); } if (e.key === 'Enter') pantallaCompleta(S.i); });

function pintarTarjetas(recolocar = true) {
  const l = activos();
  carr.replaceChildren(); sits.replaceChildren(); dots.replaceChildren();
  if (!l.length) { carr.innerHTML = '<div class="pb-qr-vacio">No hay QRs activos. Crea uno en «Gestionar QRs», abajo.</div>'; return; }
  if (S.i >= l.length) S.i = 0;
  l.forEach((c, k) => {
    const art = document.createElement('article'); art.className = 'pb-qc'; art.style.setProperty('--c', c.color);
    art.innerHTML = `<div class="sit">Si dice <b>«${esc(c.situacion || c.titulo)}»</b></div>
      <button class="qrbox" type="button" aria-label="Ver «${esc(c.titulo)}» a pantalla completa">${qrSvg(enlace(c), true)}</button>
      <h3>${esc(c.titulo)}</h3>${c.frase ? `<p class="frase">${esc(c.frase)}</p>` : ''}
      <div class="acts"><button type="button" class="pb-btn primary" data-a="full">${ico('full')}Enseñar</button><button type="button" class="pb-btn ghost" data-a="share" title="Enviar el enlace (por WhatsApp, por ejemplo)">${ico('share')}Enviar</button><button type="button" class="pb-btn ghost icon" data-a="copy" title="Copiar el enlace">${ico('copy')}</button></div>
      <div class="mini"><i></i>${N(c.stats.d30)} escaneos en 30 días${c.stats.solicitudes ? ` · ${N(c.stats.solicitudes)} ${c.stats.solicitudes === 1 ? 'solicitud' : 'solicitudes'}` : ''}${persona ? '' : ' · <b>sin nombre</b>'}</div>`;
    art.querySelector('.qrbox').onclick = () => pantallaCompleta(k);
    art.querySelector('[data-a=full]').onclick = () => pantallaCompleta(k);
    art.querySelector('[data-a=copy]').onclick = () => copiar(enlace(c));
    art.querySelector('[data-a=share]').onclick = () => compartir(c);
    art.addEventListener('click', () => { if (S.i !== k) ir(k); });
    carr.append(art);
    const s = document.createElement('button'); s.type = 'button'; s.setAttribute('role', 'tab'); s.style.setProperty('--c', c.color);
    s.innerHTML = `<i></i>${esc(c.situacion || c.titulo)}`; s.onclick = () => ir(k); sits.append(s);
    const d = document.createElement('i'); dots.append(d);
  });
  if (recolocar) requestAnimationFrame(() => ir(S.i, false)); else marcar();
}
async function copiar(t) { try { await navigator.clipboard.writeText(t); toast('Enlace copiado.'); } catch (e) { prompt('Copia el enlace:', t); } }
async function compartir(c) {
  const url = enlace(c);
  if (navigator.share) { try { await navigator.share({ title: 'PEBAI Systems', text: c.frase || c.titulo, url }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
  copiar(url);
}

/* ============ pantalla completa: fondo blanco, QR enorme, pantalla siempre encendida; desliza para cambiar ============ */
const full = document.createElement('div'); full.className = 'pb-qr-full'; full.setAttribute('role', 'dialog'); full.setAttribute('aria-modal', 'true'); document.body.append(full);
let wake = null, fullI = 0, toqueX = null;
async function pantallaCompleta(k) {
  fullI = k; pintarFull(); full.classList.add('on'); document.body.classList.add('pb-qr-modal');
  try { if (navigator.wakeLock) wake = await navigator.wakeLock.request('screen'); } catch (e) { wake = null; }
  try { if (full.requestFullscreen && matchMedia('(max-width: 900px)').matches) await full.requestFullscreen(); } catch (e) { /* el navegador no deja: se queda como capa */ }
}
function pintarFull() {
  const l = activos(), c = l[fullI]; if (!c) return;
  full.style.setProperty('--c', c.color);
  full.innerHTML = `<button class="x" type="button" aria-label="Cerrar">${ico('x')}</button>
    <div class="sit">${esc(c.situacion ? '«' + c.situacion + '»' : '')}</div>
    <div class="qr">${qrSvg(enlace(c), true)}</div>
    <h2>${esc(c.titulo)}</h2><p>Apunta la cámara del móvil al código</p>
    <div class="nav">${l.map((x, i) => `<i class="${i === fullI ? 'on' : ''}" style="--c:${x.color}"></i>`).join('')}</div>
    ${l.length > 1 ? `<button class="f izq" type="button" aria-label="Anterior">${ico('izq')}</button><button class="f der" type="button" aria-label="Siguiente">${ico('der')}</button>` : ''}`;
  full.querySelector('.x').onclick = cerrarFull;
  const iz = full.querySelector('.f.izq'), de = full.querySelector('.f.der');
  if (iz) iz.onclick = () => cambiaFull(-1); if (de) de.onclick = () => cambiaFull(1);
}
function cambiaFull(d) { const n = activos().length; fullI = (fullI + d + n) % n; pintarFull(); S.i = fullI; marcar(); }
async function cerrarFull() {
  full.classList.remove('on'); document.body.classList.remove('pb-qr-modal');
  try { if (wake) await wake.release(); } catch (e) { /* ya estaba suelto */ } wake = null;
  try { if (document.fullscreenElement) await document.exitFullscreen(); } catch (e) { /* nada */ }
  ir(fullI, false);
}
full.addEventListener('touchstart', (e) => { toqueX = e.touches[0].clientX; }, { passive: true });
full.addEventListener('touchend', (e) => { if (toqueX == null) return; const dx = e.changedTouches[0].clientX - toqueX; toqueX = null; if (Math.abs(dx) > 50) cambiaFull(dx < 0 ? 1 : -1); });
document.addEventListener('keydown', (e) => {
  if (!full.classList.contains('on')) return;
  if (e.key === 'Escape') cerrarFull(); else if (e.key === 'ArrowRight') cambiaFull(1); else if (e.key === 'ArrowLeft') cambiaFull(-1); else return;
  e.preventDefault(); e.stopImmediatePropagation();
}, true);
document.addEventListener('visibilitychange', async () => { if (full.classList.contains('on') && document.visibilityState === 'visible' && navigator.wakeLock) { try { wake = await navigator.wakeLock.request('screen'); } catch (e) { /* nada */ } } });

/* ============ panel de uso ============ */
function pintarDash() {
  const R = S.resumen || {}, L = S.codigos;
  const conv = R.d30 ? Math.round((R.solicitudes30 || 0) / R.d30 * 100) : 0;
  const maxQ = Math.max(1, ...L.map((c) => c.stats.d30));
  const pers = R.personas || {}, totP = (pers.adrian || 0) + (pers.daniel || 0) + (pers[''] || 0);
  const disp = Object.entries(R.dispositivos || {}).sort((a, b) => b[1] - a[1]);
  const hora = R.mejor_hora == null ? '—' : `${String(R.mejor_hora).padStart(2, '0')}:00–${String((R.mejor_hora + 1) % 24).padStart(2, '0')}:00`;
  dash.innerHTML = `
    <div class="pb-qr-dhead"><div><h2>Cómo se están usando</h2><p class="note">Escaneos reales (las vistas previas de enlaces y los robots no cuentan) y solicitudes que llegaron desde un QR.</p></div>
      <button class="pb-btn ghost" type="button" id="pb-qr-gest">${ico('edit')}Gestionar QRs</button></div>
    <div class="pb-qr-kpis">
      <div class="k hero"><span>Escaneos · 30 días</span><b>${N(R.d30)}</b><small>${N(R.total)} desde el principio</small></div>
      <div class="k"><span>Esta semana</span><b>${N(R.d7)}</b><small>${N(R.hoy)} hoy</small></div>
      <div class="k"><span>Solicitudes desde QR</span><b>${N(R.solicitudes30)}</b><small>${R.d30 ? conv + ' % de los escaneos' : 'en 30 días'}</small></div>
      <div class="k"><span>Mejor franja</span><b class="t">${hora}</b><small>cuando más se escanea</small></div>
    </div>
    <div class="pb-qr-grid">
      <div class="pb-card pb-qr-chart"><h4>Escaneos por día <span>últimos 30 días</span></h4><div id="pb-qr-barras"></div></div>
      <div class="pb-card pb-qr-split"><h4>Quién los enseña</h4>
        ${[['adrian', 'Adrián'], ['daniel', 'Dani'], ['', 'Sin nombre']].map(([k, l]) => `<div class="fila"><span>${l}</span><div class="b"><i style="width:${totP ? (pers[k] || 0) / totP * 100 : 0}%"></i></div><b>${N(pers[k] || 0)}</b></div>`).join('')}
        <h4 class="sep">Desde qué móvil</h4>
        ${disp.length ? disp.map(([k, v]) => `<div class="fila"><span>${esc(k)}</span><div class="b"><i style="width:${v / Math.max(1, R.d30) * 100}%"></i></div><b>${N(v)}</b></div>`).join('') : '<p class="note">Aún no hay escaneos.</p>'}
      </div>
    </div>
    <div class="pb-card pb-qr-rank"><h4>Por QR <span>30 días</span></h4>
      <div class="cab"><span>QR</span><span></span><span>Escaneos</span><span>Personas</span><span>Solicitudes</span><span>Último</span></div>
      ${L.map((c) => `<div class="fila${c.activo ? '' : ' off'}"><span class="n"><i style="background:${esc(c.color)}"></i><b>${esc(c.titulo)}</b><small>${esc(c.situacion)}${c.activo ? '' : ' · oculto'}</small></span>
        <div class="b"><i style="width:${c.stats.d30 / maxQ * 100}%"></i></div><b>${N(c.stats.d30)}</b><span>${N(c.stats.unicos)}</span><span>${N(c.stats.solicitudes)}</span><span class="u">${hace(c.stats.ultimo)}</span></div>`).join('')}
    </div>
    ${(S.ultimas_solicitudes || []).length ? `<div class="pb-card pb-qr-sol"><h4>Últimas solicitudes desde un QR</h4>${S.ultimas_solicitudes.map((s) => {
      const c = L.find((x) => x.slug === s.slug) || {};
      return `<a class="fila" href="${BASE}?id=${s.id}"><b>${esc(s.empresa)}</b><span>${esc(c.titulo || 'QR')}</span><span class="u">${hace(s.fecha)}</span></a>`; }).join('')}</div>` : ''}`;
  barras();
  $('#pb-qr-gest').onclick = abrirGestion;
}
/* barras de escaneos por día: una sola serie, finas, con el valor al pasar el ratón */
function barras() {
  const cont = $('#pb-qr-barras'), D = S.dias || []; if (!cont) return;
  const max = Math.max(1, ...D.map((d) => d.n)), W = 600, H = 150, gap = 2, bw = (W - gap * (D.length - 1)) / D.length;
  const ejes = [0, Math.ceil(max / 2), max];
  let s = `<svg viewBox="0 0 ${W} ${H + 22}" preserveAspectRatio="none" role="img" aria-label="Escaneos por día">`;
  ejes.forEach((v) => { const y = H - v / max * H; s += `<line x1="0" x2="${W}" y1="${y}" y2="${y}" class="g"/>`; });
  D.forEach((d, i) => {
    const h = d.n ? Math.max(3, d.n / max * H) : 0, x = i * (bw + gap), fecha = new Date(d.dia + 'T12:00:00');
    const et = fecha.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
    s += `<g class="d"><rect class="hit" x="${x}" y="0" width="${bw + gap}" height="${H}"/><rect class="bar" x="${x}" y="${H - h}" width="${bw}" height="${h}" rx="${Math.min(4, bw / 2)}"/><title>${esc(et)}: ${N(d.n)} ${d.n === 1 ? 'escaneo' : 'escaneos'}</title></g>`;
    if ((i % 7 === 0 && i < D.length - 4) || i === D.length - 1) s += `<text x="${x + bw / 2}" y="${H + 16}" text-anchor="middle">${fecha.getDate()}/${fecha.getMonth() + 1}</text>`;
  });
  cont.innerHTML = s + '</svg>' + (D.some((d) => d.n) ? '' : '<p class="note vacio">Todavía no se ha escaneado ningún QR. En cuanto alguien lo haga, aparece aquí al momento.</p>');
}

/* ============ gestionar: crear, cambiar, ordenar y quitar QRs ============ */
const modal = document.createElement('div'); modal.className = 'pb-qr-modalbox'; document.body.append(modal);
function abrirGestion() { pintarGestion(); modal.classList.add('on'); }
function cerrarGestion() { modal.classList.remove('on'); }
modal.addEventListener('click', (e) => { if (e.target === modal) cerrarGestion(); });
function pintarGestion(editando) {
  const L = S.codigos;
  modal.innerHTML = `<div class="caja"><div class="hd"><h3>Gestionar QRs</h3><button class="pb-btn ghost icon" type="button" data-a="x" aria-label="Cerrar">${ico('x')}</button></div>
    <div class="lista">${L.map((c, i) => `<div class="it${c.activo ? '' : ' off'}" data-s="${esc(c.slug)}"><i style="background:${esc(c.color)}"></i><div><b>${esc(c.titulo)}</b><small>${esc(c.situacion)} · ${esc(TIPOS[c.tipo] || '')}${c.activo ? '' : ' · oculto'}</small></div>
      <button type="button" class="pb-btn ghost icon" data-a="up" ${i ? '' : 'disabled'} aria-label="Subir">${ico('up')}</button><button type="button" class="pb-btn ghost icon" data-a="down" ${i < L.length - 1 ? '' : 'disabled'} aria-label="Bajar">${ico('down')}</button><button type="button" class="pb-btn ghost" data-a="edit">Editar</button></div>`).join('')}</div>
    <button class="pb-btn primary" type="button" data-a="nuevo">${ico('plus')}Nuevo QR</button>
    <form class="form" hidden></form></div>`;
  modal.querySelector('[data-a=x]').onclick = cerrarGestion;
  modal.querySelector('[data-a=nuevo]').onclick = () => formulario({ slug: '', titulo: '', situacion: '', frase: '', tipo: 'reservar', destino: '', color: COLORES[L.length % COLORES.length], activo: 1 });
  modal.querySelectorAll('.it').forEach((it) => {
    const c = L.find((x) => x.slug === it.dataset.s);
    it.querySelector('[data-a=edit]').onclick = () => formulario(c);
    const mover = (d) => { const orden = L.map((x) => x.slug); const i = orden.indexOf(c.slug); [orden[i], orden[i + d]] = [orden[i + d], orden[i]]; accion('qr_orden', { slugs: orden.join(',') }).then(() => pintarGestion()).catch((e) => toast(e.message, true)); };
    it.querySelector('[data-a=up]').onclick = () => mover(-1); it.querySelector('[data-a=down]').onclick = () => mover(1);
  });
  if (editando) formulario(editando);
}
function formulario(c) {
  const f = modal.querySelector('.form'); f.hidden = false;
  f.innerHTML = `<h4>${c.slug ? 'Editar «' + esc(c.titulo) + '»' : 'Nuevo QR'}</h4>
    <label class="pb-field"><span>Si el cliente dice…</span><input name="situacion" maxlength="80" placeholder="Me lo pienso" value="${esc(c.situacion)}"></label>
    <label class="pb-field"><span>Título del QR</span><input name="titulo" maxlength="60" required placeholder="Ver el vídeo" value="${esc(c.titulo)}"></label>
    <label class="pb-field"><span>Qué le dices al enseñarlo</span><input name="frase" maxlength="200" placeholder="Míralo cuando puedas…" value="${esc(c.frase)}"></label>
    <label class="pb-field"><span>Qué abre</span><select name="tipo">${Object.entries(TIPOS).map(([k, l]) => `<option value="${k}"${c.tipo === k ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
    <label class="pb-field url"${c.tipo === 'url' ? '' : ' hidden'}><span>Enlace</span><input name="destino" placeholder="https://…" value="${esc(c.destino)}"></label>
    <div class="pb-field"><span>Color</span><div class="cols">${COLORES.map((x) => `<button type="button" data-c="${x}" style="--c:${x}" class="${x.toLowerCase() === String(c.color).toLowerCase() ? 'on' : ''}" aria-label="Color ${x}"></button>`).join('')}</div></div>
    ${c.slug ? `<label class="pb-check"><input type="checkbox" name="activo" ${c.activo ? 'checked' : ''}> Visible en el carrusel</label>` : ''}
    <div class="pie">${c.slug ? '<button type="button" class="pb-btn danger" data-a="borrar">Quitar</button>' : '<span></span>'}<div><button type="button" class="pb-btn ghost" data-a="cancelar">Cancelar</button><button type="submit" class="pb-btn primary">Guardar</button></div></div>`;
  let color = c.color;
  f.tipo.onchange = () => { f.querySelector('.url').hidden = f.tipo.value !== 'url'; };
  f.querySelectorAll('.cols button').forEach((b) => { b.onclick = () => { color = b.dataset.c; f.querySelectorAll('.cols button').forEach((x) => x.classList.toggle('on', x === b)); }; });
  f.querySelector('[data-a=cancelar]').onclick = () => { f.hidden = true; };
  const borrar = f.querySelector('[data-a=borrar]');
  if (borrar) borrar.onclick = () => { if (!confirm('¿Quitar «' + c.titulo + '»? Si ya tiene escaneos solo se oculta, para no perder el historial.')) return; accion('qr_borrar', { slug: c.slug }, 'QR quitado.').then(() => pintarGestion()).catch((e) => toast(e.message, true)); };
  f.onsubmit = (e) => {
    e.preventDefault();
    const b = f.querySelector('[type=submit]'); b.disabled = true;
    accion('qr_guardar', { slug: c.slug, titulo: f.titulo.value, situacion: f.situacion.value, frase: f.frase.value, tipo: f.tipo.value, destino: f.destino.value, color, activo: f.activo ? (f.activo.checked ? '1' : '0') : '1' }, 'QR guardado.')
      .then(() => pintarGestion()).catch((er) => { toast(er.message, true); b.disabled = false; });
  };
  f.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); f.titulo.focus();
}

/* ============ ciclo ============ */
function pintar() { pintarQuien(); pintarTarjetas(); pintarDash(); }
async function entrar() {
  if (document.body.dataset.page !== 'qr') return;
  try { await cargar(); pintar(); } catch (e) { toast(e.message, true); }
}
document.addEventListener('pb:page', entrar);
setInterval(() => { if (!document.hidden && document.body.dataset.page === 'qr' && !full.classList.contains('on') && !modal.classList.contains('on')) cargar().then(pintarDash).catch(() => {}); }, 30000);
entrar();
})();
