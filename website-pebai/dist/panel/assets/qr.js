/* PEBAI · Panel — Captación › QRs para la calle (puerta fría).
   Un QR por situación de la conversación: se elige en la lista y se enseña a pantalla completa.
   Cada QR lleva a pebaisystems.es/q/<slug>?p=<persona>: el servidor cuenta el escaneo y la solicitud queda a nombre de quien lo enseña.
   Datos en index.php?qr=1 (ver _qr_panel.php). Los textos de los QRs se pintan con textContent o escapados.
   Rediseño 17/11/2026: un QR grande + las situaciones como lista (fuera el carrusel y los chips repetidos), cifras en una línea,
   barras apagadas salvo hoy y el mejor día, franja horaria en calor, dónuts de quién y desde qué móvil; tabla y gestión plegadas. */
(() => {
'use strict';
const app = document.getElementById('pb-app');
const raiz = document.getElementById('pb-qr');
if (!app || !raiz) return;
const BASE = app.dataset.base;
const $ = (s, r) => (r || document).querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const N = (n) => new Intl.NumberFormat('es-ES', { useGrouping: 'always' }).format(n || 0);
const PCT = (a, b) => (b ? new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format(a / b * 100) + ' %' : '0 %');
const X = () => window.PBX;
const S = { csrf: app.dataset.csrf, codigos: [], cargado: false, i: 0, firma: '' };
const PERSONAS = [['adrian', 'Adrián'], ['daniel', 'Dani']];
let persona = ''; try { persona = localStorage.getItem('pebai-qr-persona') || ''; } catch (e) { /* sin almacenamiento: sin persona */ }
// Cuentas por usuario (17/11/2026): al abrir el panel se elige solo quien está dentro (se puede cambiar con los botones)
if (window.PB_YO && PERSONAS.some(([k]) => k === window.PB_YO.usuario)) persona = window.PB_YO.usuario;
const TIPOS = { reservar: 'Formulario de la consultoría', video: 'Vídeo de la consultoría', whatsapp: 'Chat de WhatsApp con nosotros', tarjeta: 'Tarjeta digital (guardar contacto)', web: 'Nuestra web', url: 'Un enlace a elegir' };
const COLORES = ['#B7FF3C', '#8E84FF', '#25D366', '#3FD5FF', '#FFB547', '#E25CFF', '#EFEDE7'];
const ICO = {
  full: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>', copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h10"/>',
  share: '<path d="M12 3v12M8 7l4-4 4 4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>', izq: '<path d="m15 6-6 6 6 6"/>', der: '<path d="m9 6 6 6-6 6"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>', edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>', plus: '<path d="M12 5v14M5 12h14"/>', up: '<path d="m6 15 6-6 6 6"/>', down: '<path d="m6 9 6 6 6-6"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
};
const ico = (k) => `<svg class="pb-i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICO[k]}</svg>`;
const toast = (m, err) => { const t = $('#pb-toast'); if (!t) return; $('span', t).textContent = m; t.classList.toggle('err', !!err); t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 3200); };
const hace = (ts) => {
  if (!ts) return 'nunca';
  const m = Math.round((Date.now() - new Date(String(ts).replace(' ', 'T'))) / 60000);
  return m < 1 ? 'ahora mismo' : m < 60 ? `hace ${m} min` : m < 1440 ? `hace ${Math.round(m / 60)} h` : m < 2880 ? 'ayer' : `hace ${Math.round(m / 1440)} días`;
};

/* ============ QR en SVG: módulos redondeados, ojos propios y el logo en el centro (corrección H) ============ */
function qrSvg(texto, logo, fondo = '#fff') {
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
  const logoSvg = logo ? `<rect x="${h0 + m - .3}" y="${h0 + m - .3}" width="${hueco + .6}" height="${hueco + .6}" rx="${hueco * .26}" fill="${fondo}"/><image href="${BASE}assets/pebai-mark.png" x="${h0 + m + hueco * .14}" y="${h0 + m + hueco * .08}" width="${hueco * .72}" height="${hueco * .84}" preserveAspectRatio="xMidYMid meet"/>` : '';
  return `<svg viewBox="0 0 ${tam} ${tam}" role="img" aria-label="Código QR" shape-rendering="geometricPrecision"><rect width="${tam}" height="${tam}" fill="${fondo}"/><g fill="#0B0F14">${p}${ojoSvg(m, m)}${ojoSvg(n - 7 + m, m)}${ojoSvg(m, n - 7 + m)}</g>${logoSvg}</svg>`;
}
const enlace = (c) => c.enlaces[persona] || c.enlaces[''];
const activos = () => S.codigos.filter((c) => c.activo);

/* ============ datos ============ */
/** Pide los datos. Devuelve true si han cambiado (se repinta solo entonces). */
async function cargar() {
  const r = await fetch(BASE + '?qr=1', { credentials: 'same-origin', cache: 'no-store' });
  if (r.status === 401) { pbCaduca(); return false; }
  let j; try { j = await r.json(); } catch (e) { throw new Error('No se han podido cargar los QRs.'); }
  if (!j.ok) throw new Error(j.error || 'No se han podido cargar los QRs.');
  if (j.csrf) S.csrf = j.csrf;
  const firma = JSON.stringify([j.codigos, j.resumen, j.dias, j.horas, j.ultimas_solicitudes]);
  S.cargado = true;
  if (firma === S.firma) return false;
  S.firma = firma;
  Object.assign(S, { codigos: j.codigos || [], resumen: j.resumen || {}, dias: j.dias || [], horas: j.horas || [], ultimas_solicitudes: j.ultimas_solicitudes || [] });
  return true;
}
async function accion(action, campos, ok) {
  const r = await fetch(BASE, { method: 'POST', credentials: 'same-origin', headers: { Accept: 'application/json' }, body: new URLSearchParams({ action, csrf: S.csrf, ...campos }) });
  if (r.status === 401) { pbCaduca(); return null; }
  const j = await r.json().catch(() => ({ ok: false, error: 'Respuesta inesperada del servidor.' }));
  if (!j.ok) throw new Error(j.error || 'No se ha podido guardar.');
  if (ok) toast(ok);
  await cargar(); pintar();
  return j;
}

/* ============ montaje (el esqueleto se pinta una vez; luego solo se rellenan sus partes) ============ */
raiz.innerHTML = `
  <header class="pbx-cab pb-qr-cab">
    <div><h1 class="pbx-h1">QRs para la calle, <i>a mano</i></h1>
      <p class="pbx-sub">Elige lo que te ha dicho y enséñale su QR: cada escaneo se cuenta y la solicitud queda a tu nombre.</p></div>
    <div class="pb-qr-quien" id="pb-qr-quien" role="radiogroup" aria-label="Quién enseña el QR"><span>¿Quién lo enseña?</span></div>
  </header>
  <div class="pb-qr-top">
    <article class="pbx-c pbx-heroe pb-qr-show pbg-n" style="--n:0" id="pb-qr-show"></article>
    <div class="pb-qr-situ pbg-n" style="--n:1" id="pb-qr-situ" role="listbox" aria-label="Qué te ha dicho"></div>
  </div>
  <div class="pb-qr-st" id="pb-qr-st"></div>
  <div class="pb-qr-plegs">
    <details class="pbx-pleg" id="pb-qr-tabla"><summary>Por QR · 30 días</summary><div class="pbx-pleg-in"></div></details>
    <details class="pbx-pleg" id="pb-qr-ult" hidden><summary>Últimas solicitudes desde un QR</summary><div class="pbx-pleg-in"></div></details>
    <details class="pbx-pleg" id="pb-qr-gest"><summary>Gestionar QRs</summary><div class="pbx-pleg-in pb-qr-gestion"></div></details>
  </div>`;
const show = $('#pb-qr-show'), situ = $('#pb-qr-situ'), quien = $('#pb-qr-quien'), st = $('#pb-qr-st');
const gest = $('#pb-qr-gest .pbx-pleg-in');
PERSONAS.forEach(([k, l]) => {
  const b = document.createElement('button'); b.type = 'button'; b.dataset.p = k; b.setAttribute('role', 'radio'); b.textContent = l;
  b.onclick = () => { persona = persona === k ? '' : k; try { localStorage.setItem('pebai-qr-persona', persona); } catch (e) { /* no pasa nada */ } pintarQuien(); pintarShow(); };
  quien.append(b);
});
function pintarQuien() {
  quien.querySelectorAll('button').forEach((b) => { const on = b.dataset.p === persona; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
  quien.classList.toggle('falta', !persona);
}

/* ============ el QR elegido y la lista de situaciones ============ */
function elegir(i, verQr) {
  const l = activos(); if (!l.length) return;
  S.i = (i + l.length) % l.length;
  pintarShow(); marcarSitu();
  if (verQr && matchMedia('(max-width: 900px)').matches) show.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function pintarShow() {
  const l = activos();
  if (!l.length) { show.innerHTML = '<div class="pbx-vacio">No hay QRs activos. Crea uno en «Gestionar QRs», abajo.</div>'; return; }
  if (S.i >= l.length) S.i = 0;
  const c = l[S.i];
  show.style.setProperty('--hc', c.color); show.style.setProperty('--c', c.color);
  show.innerHTML = `<div class="sit">Si dice <b>«${esc(c.situacion || c.titulo)}»</b></div>
    <button class="pb-qr-box" type="button" aria-label="Ver «${esc(c.titulo)}» a pantalla completa">${qrSvg(enlace(c), true, '#F4F3EE')}</button>
    <h2>${esc(c.titulo)}</h2>${c.frase ? `<p class="frase">${esc(c.frase)}</p>` : ''}
    <div class="acts"><button type="button" class="pbx-btn lime" data-a="full">${ico('full')}Enseñar a pantalla completa</button><button type="button" class="pbx-btn ico" data-a="share" title="Enviar el enlace (por WhatsApp, por ejemplo)" aria-label="Enviar el enlace">${ico('share')}</button><button type="button" class="pbx-btn ico" data-a="copy" title="Copiar el enlace" aria-label="Copiar el enlace">${ico('copy')}</button></div>
    ${persona ? '' : '<p class="falta">Sin nombre: elige arriba quién lo enseña para que la solicitud cuente a tu nombre.</p>'}`;
  show.querySelector('.pb-qr-box').onclick = () => pantallaCompleta(S.i);
  show.querySelector('[data-a=full]').onclick = () => pantallaCompleta(S.i);
  show.querySelector('[data-a=copy]').onclick = () => copiar(enlace(c));
  show.querySelector('[data-a=share]').onclick = () => compartir(c);
}
function pintarSitu() {
  const l = activos(); situ.replaceChildren();
  l.forEach((c, k) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'pb-qr-sit'; b.setAttribute('role', 'option'); b.style.setProperty('--c', c.color);
    b.innerHTML = `<span class="pbx-ico" style="--c:${esc(c.color)}">${ico('chat')}</span>
      <span class="t"><small>Si dice «${esc(c.situacion || c.titulo)}»</small><b>${esc(c.titulo)}</b></span>
      <span class="n"><b>${N(c.stats.d30)}</b><small>${N(c.stats.solicitudes)} solic.</small></span>`;
    b.title = `${N(c.stats.d30)} escaneos en 30 días · ${N(c.stats.solicitudes)} ${c.stats.solicitudes === 1 ? 'solicitud' : 'solicitudes'}`;
    b.onclick = () => elegir(k, true);
    situ.append(b);
  });
  marcarSitu();
}
function marcarSitu() { [...situ.children].forEach((d, k) => { d.classList.toggle('on', k === S.i); d.setAttribute('aria-selected', k === S.i); }); }
situ.addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
  e.preventDefault(); elegir(S.i + (e.key === 'ArrowDown' ? 1 : -1)); situ.children[S.i]?.focus();
});
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
    <div class="nav">${l.map((x, i) => `<i class="${i === fullI ? 'on' : ''}" style="--c:${esc(x.color)}"></i>`).join('')}</div>
    ${l.length > 1 ? `<button class="f izq" type="button" aria-label="Anterior">${ico('izq')}</button><button class="f der" type="button" aria-label="Siguiente">${ico('der')}</button>` : ''}`;
  full.querySelector('.x').onclick = cerrarFull;
  const iz = full.querySelector('.f.izq'), de = full.querySelector('.f.der');
  if (iz) iz.onclick = () => cambiaFull(-1); if (de) de.onclick = () => cambiaFull(1);
}
function cambiaFull(d) { const n = activos().length; fullI = (fullI + d + n) % n; pintarFull(); S.i = fullI; pintarShow(); marcarSitu(); }
async function cerrarFull() {
  full.classList.remove('on'); document.body.classList.remove('pb-qr-modal');
  try { if (wake) await wake.release(); } catch (e) { /* ya estaba suelto */ } wake = null;
  try { if (document.fullscreenElement) await document.exitFullscreen(); } catch (e) { /* nada */ }
  elegir(fullI);
}
full.addEventListener('touchstart', (e) => { toqueX = e.touches[0].clientX; }, { passive: true });
full.addEventListener('touchend', (e) => { if (toqueX == null) return; const dx = e.changedTouches[0].clientX - toqueX; toqueX = null; if (Math.abs(dx) > 50) cambiaFull(dx < 0 ? 1 : -1); });
document.addEventListener('keydown', (e) => {
  if (!full.classList.contains('on')) return;
  if (e.key === 'Escape') cerrarFull(); else if (e.key === 'ArrowRight') cambiaFull(1); else if (e.key === 'ArrowLeft') cambiaFull(-1); else return;
  e.preventDefault(); e.stopImmediatePropagation();
}, true);
document.addEventListener('visibilitychange', async () => { if (full.classList.contains('on') && document.visibilityState === 'visible' && navigator.wakeLock) { try { wake = await navigator.wakeLock.request('screen'); } catch (e) { /* nada */ } } });

/* ============ cómo se están usando ============ */
function pintarDash() {
  const P = X(); if (!P) return;
  const R = S.resumen || {}, L = S.codigos, D = S.dias || [];
  const sol = R.solicitudes30 || 0;
  // barras de 30 días: apagadas salvo hoy y el mejor día
  const fecha = (d) => new Date(d + 'T12:00:00');
  const ejes = D.map((d, i) => [i, d]).filter(([i]) => (i % 7 === 0 && i < D.length - 4)).map(([i, d]) => [i, `${fecha(d.dia).getDate()}/${fecha(d.dia).getMonth() + 1}`]);
  const titulos = D.map((d) => fecha(d.dia).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }) + ':');
  const barras = D.length ? P.barras(D.map((d) => d.n), { ejes, titulos, hoyTxt: 'hoy' }) : '';
  // franja horaria de 8 a 21 h en calor
  const H = Array.isArray(S.horas) && S.horas.length === 24 ? S.horas : null;
  const franja = H ? H.slice(8, 22) : Array(14).fill(0), maxF = Math.max(1, ...franja);
  const mh = R.mejor_hora;
  const mejor = mh == null ? 'Aún sin escaneos' : `Mejor franja: ${mh} a ${(mh + 1) % 24} h`;
  const calor = franja.map((n, k) => `<i style="--a:${(n / maxF).toFixed(2)}"${H ? '' : ' class="sin"'} title="${8 + k} h: ${N(n)} ${n === 1 ? 'escaneo' : 'escaneos'}"${mh === 8 + k ? ' data-mejor' : ''}></i>`).join('');
  // quién lo enseña y desde qué móvil
  const pers = R.personas || {};
  const quienP = [[pers.adrian || 0, 'var(--violet-2)', 'Adrián'], [pers.daniel || 0, 'var(--lime)', 'Dani'], [pers[''] || 0, 'var(--muted-2)', 'Sin nombre']];
  const totP = quienP.reduce((a, p) => a + p[0], 0);
  const CD = { iPhone: 'var(--fg-strong)', Android: 'var(--green)' }, extra = ['var(--cyan)', 'var(--amber)', 'var(--violet-2)'];
  const disp = Object.entries(R.dispositivos || {}).sort((a, b) => b[1] - a[1]).map(([k, v], i) => [v, CD[k] || (k === 'Otro' ? 'var(--muted-2)' : extra[i % extra.length]), k]);
  const totD = disp.reduce((a, p) => a + p[0], 0);
  const ley = (partes, tot) => `<div class="ley">${partes.map(([v, c, n]) => `<span><i class="pbx-dot r" style="--c:${c}"></i>${esc(n)}<b>${N(v)}</b><small>${tot ? Math.round(v / tot * 100) : 0} %</small></span>`).join('')}</div>`;
  st.innerHTML = `
    <article class="pbx-c pb-qr-uso pbg-n" style="--n:2">
      <div class="pbx-ch"><h3><span class="pbx-num">${N(R.d30)}</span> escaneos <em>→ ${N(sol)} ${sol === 1 ? 'solicitud' : 'solicitudes'} (${PCT(sol, R.d30)})</em></h3><span>30 días</span></div>
      <p class="mini">${N(R.d7)} esta semana · ${N(R.hoy)} hoy · ${N(R.total)} desde el principio</p>
      ${D.some((d) => d.n) ? barras : '<p class="pbx-vacio">Todavía no se ha escaneado ningún QR. En cuanto alguien lo haga, aparece aquí al momento.</p>'}
      <div class="franja-t">${esc(mejor)}</div>
      <div class="franja">${calor}</div>
      <div class="franja-l"><span>8 h</span><span>12 h</span><span>16 h</span><span>21 h</span></div>
    </article>
    <article class="pbx-c pb-qr-dn pbg-n" style="--n:3"><div class="pbx-ch"><h3>Quién lo enseña</h3><span>30 días</span></div>
      <div class="dn">${P.donut(quienP.map(([v, c]) => [v, c]), N(totP), 'escaneos')}${ley(quienP, totP)}</div></article>
    <article class="pbx-c pb-qr-dn pbg-n" style="--n:4"><div class="pbx-ch"><h3>Desde qué móvil</h3><span>30 días</span></div>
      <div class="dn">${P.donut(disp.map(([v, c]) => [v, c]), totD ? Math.round(disp[0][0] / totD * 100) + ' %' : '—', totD ? disp[0][2] : 'sin datos')}${disp.length ? ley(disp, totD) : '<p class="pbx-vacio">Aún no hay escaneos.</p>'}</div></article>`;
  // tabla por QR (plegada)
  const maxQ = Math.max(1, ...L.map((c) => c.stats.d30));
  $('#pb-qr-tabla .pbx-pleg-in').innerHTML = `<div class="pb-qr-rank">
      <div class="cab"><span>QR</span><span></span><span>Escaneos</span><span>Personas</span><span>Solicitudes</span><span>Último</span></div>
      ${L.map((c) => `<div class="fila${c.activo ? '' : ' off'}"><span class="n"><i style="background:${esc(c.color)}"></i><b>${esc(c.titulo)}</b><small>${esc(c.situacion)}${c.activo ? '' : ' · oculto'}</small></span>
        <span class="pbx-bar" style="--c:${esc(c.color)}"><i style="--w:${(c.stats.d30 / maxQ * 100).toFixed(1)}%"></i></span><b>${N(c.stats.d30)}</b><span>${N(c.stats.unicos)}</span><span>${N(c.stats.solicitudes)}</span><span class="u">${hace(c.stats.ultimo)}</span></div>`).join('')}
    </div>`;
  // últimas solicitudes (plegadas)
  const U = S.ultimas_solicitudes || [], ult = $('#pb-qr-ult');
  ult.hidden = !U.length;
  ult.querySelector('summary').textContent = `Últimas solicitudes desde un QR · ${N(U.length)}`;
  ult.querySelector('.pbx-pleg-in').innerHTML = `<div class="pb-qr-sol">${U.map((s) => {
    const c = L.find((x) => x.slug === s.slug) || {};
    return `<a class="fila" href="${BASE}?id=${Number(s.id)}"><b>${esc(s.empresa)}</b><span>${esc(c.titulo || 'QR')}</span><span class="u">${hace(s.fecha)}</span></a>`; }).join('')}</div>`;
}

/* ============ gestionar: crear, cambiar, ordenar y quitar QRs (plegado al final) ============ */
function pintarGestion(editando) {
  const L = S.codigos;
  gest.innerHTML = `<div class="lista">${L.map((c, i) => `<div class="it${c.activo ? '' : ' off'}" data-s="${esc(c.slug)}"><i style="background:${esc(c.color)}"></i><div><b>${esc(c.titulo)}</b><small>${esc(c.situacion)} · ${esc(TIPOS[c.tipo] || '')}${c.activo ? '' : ' · oculto'}</small></div>
      <button type="button" class="pbx-btn ico sm" data-a="up" ${i ? '' : 'disabled'} aria-label="Subir">${ico('up')}</button><button type="button" class="pbx-btn ico sm" data-a="down" ${i < L.length - 1 ? '' : 'disabled'} aria-label="Bajar">${ico('down')}</button><button type="button" class="pbx-btn sm ghost" data-a="edit">${ico('edit')}Editar</button></div>`).join('')}</div>
    <button class="pbx-btn lime sm" type="button" data-a="nuevo">${ico('plus')}Nuevo QR</button>
    <form class="form" hidden></form>`;
  gest.querySelector('[data-a=nuevo]').onclick = () => formulario({ slug: '', titulo: '', situacion: '', frase: '', tipo: 'reservar', destino: '', color: COLORES[L.length % COLORES.length], activo: 1 });
  gest.querySelectorAll('.it').forEach((it) => {
    const c = L.find((x) => x.slug === it.dataset.s);
    it.querySelector('[data-a=edit]').onclick = () => formulario(c);
    const mover = (d) => { const orden = L.map((x) => x.slug); const i = orden.indexOf(c.slug); [orden[i], orden[i + d]] = [orden[i + d], orden[i]]; accion('qr_orden', { slugs: orden.join(',') }).then(() => pintarGestion()).catch((e) => toast(e.message, true)); };
    it.querySelector('[data-a=up]').onclick = () => mover(-1); it.querySelector('[data-a=down]').onclick = () => mover(1);
  });
  if (editando) formulario(editando);
}
function formulario(c) {
  const f = gest.querySelector('.form'); f.hidden = false;
  f.innerHTML = `<h4>${c.slug ? 'Editar «' + esc(c.titulo) + '»' : 'Nuevo QR'}</h4>
    <label class="pb-field"><span>Si el cliente dice…</span><input name="situacion" maxlength="80" placeholder="Me lo pienso" value="${esc(c.situacion)}"></label>
    <label class="pb-field"><span>Título del QR</span><input name="titulo" maxlength="60" required placeholder="Ver el vídeo" value="${esc(c.titulo)}"></label>
    <label class="pb-field"><span>Qué le dices al enseñarlo</span><input name="frase" maxlength="200" placeholder="Míralo cuando puedas…" value="${esc(c.frase)}"></label>
    <label class="pb-field"><span>Qué abre</span><select name="tipo">${Object.entries(TIPOS).map(([k, l]) => `<option value="${k}"${c.tipo === k ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
    <label class="pb-field url"${c.tipo === 'url' ? '' : ' hidden'}><span>Enlace</span><input name="destino" placeholder="https://…" value="${esc(c.destino)}"></label>
    <div class="pb-field"><span>Color</span><div class="cols">${COLORES.map((x) => `<button type="button" data-c="${x}" style="--c:${x}" class="${x.toLowerCase() === String(c.color).toLowerCase() ? 'on' : ''}" aria-label="Color ${x}"></button>`).join('')}</div></div>
    ${c.slug ? `<label class="pb-check"><input type="checkbox" name="activo" ${c.activo ? 'checked' : ''}> Visible en la lista</label>` : ''}
    <div class="pie">${c.slug ? '<button type="button" class="pbx-btn sm rojo" data-a="borrar">Quitar</button>' : '<span></span>'}<div><button type="button" class="pbx-btn sm ghost" data-a="cancelar">Cancelar</button><button type="submit" class="pbx-btn sm lime">Guardar</button></div></div>`;
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
const formAbierto = () => { const f = gest.querySelector('.form'); return !!(f && !f.hidden); };

/* ============ ciclo ============ */
function pintar() { pintarQuien(); pintarShow(); pintarSitu(); pintarDash(); if (!formAbierto()) pintarGestion(); }
async function entrar() {
  if (document.body.dataset.page !== 'qr') return;
  try { const cambio = await cargar(); if (cambio || !show.childElementCount) pintar(); else pintarQuien(); } catch (e) { toast(e.message, true); }
}
document.addEventListener('pb:page', entrar);
setInterval(() => { if (!document.hidden && document.body.dataset.page === 'qr' && !full.classList.contains('on')) cargar().then((cambio) => { if (cambio) pintar(); }).catch(() => {}); }, 30000);
entrar();
})();
