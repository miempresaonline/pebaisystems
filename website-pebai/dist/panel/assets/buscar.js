/* PEBAI · Panel — buscador global (Ctrl+K o la lupa de arriba) y avisos al navegador/móvil (la campana).
   Buscador: index.php?buscar=texto → solicitudes, conversaciones de WhatsApp y email, prospectos y demos, más las secciones del panel.
   Avisos: Web Push con service worker (panel/sw.js); llegan aunque el panel esté cerrado. Al pulsar uno se abre el panel en su sitio (?ir=…).
   Todo texto de empresas se pinta con textContent. */
(() => {
'use strict';
const app = document.getElementById('pb-app');
if (!app) return;
const BASE = app.dataset.base;
const $ = (s, r) => (r || document).querySelector(s);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const toast = (msg, err) => { const t = $('#pb-toast'); if (!t) return; $('span', t).textContent = msg; t.classList.toggle('err', !!err); t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 3600); };
const csrf = () => app.dataset.csrf;

/* ============ ir a un sitio del panel ============ */
const pagina = (p) => { const b = document.querySelector(`#pb-tabs button[data-page="${p}"]:not(#pb-nav-control)`); if (b) b.click(); };
function ir(dest) {
  const [t, a, b] = String(dest || '').split(':');
  if (t === 'lead' && a) { document.dispatchEvent(new CustomEvent('pb:abrir-lead', { detail: Number(a) })); return true; }
  if (t === 'conv' && a && b) { pagina('conversaciones'); setTimeout(() => document.dispatchEvent(new CustomEvent('pb:abrir-conv', { detail: a + ':' + b })), 150); return true; }
  if (t === 'pagina' && a) { pagina(a); return true; }
  return false;
}
// Al abrir el panel desde un aviso (?ir=…) o al pulsar uno con el panel ya abierto
const irUrl = new URLSearchParams(location.search).get('ir');
if (irUrl) {
  history.replaceState(null, '', location.pathname);
  // espera a que el resto del panel haya cargado sus datos
  window.addEventListener('load', () => setTimeout(() => ir(irUrl), 400));
}
if (navigator.serviceWorker) navigator.serviceWorker.addEventListener('message', (e) => { if (e.data && e.data.pebaiIr) ir(e.data.pebaiIr); });

/* ============ buscador ============ */
const SECCIONES = [...document.querySelectorAll('#pb-tabs button[data-page]:not(#pb-nav-control)')].map((b) => ({ p: b.dataset.page, t: b.querySelector('span').textContent }));
const capa = el('div', 'pb-bus'); capa.hidden = true;
capa.innerHTML = '<div class="pb-bus-caja" role="dialog" aria-label="Buscar en el panel"><div class="pb-bus-in"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'
  + '<input type="search" placeholder="Empresa, teléfono, web o email…" autocomplete="off" spellcheck="false" aria-label="Buscar"><kbd>Esc</kbd></div><div class="pb-bus-res" role="listbox"></div>'
  + '<div class="pb-bus-pie"><span><kbd>↑</kbd><kbd>↓</kbd> moverse</span><span><kbd>↵</kbd> abrir</span><span><kbd>Ctrl</kbd><kbd>K</kbd> buscar</span></div></div>';
document.body.append(capa);
const inp = $('input', capa), res = $('.pb-bus-res', capa);
let items = [], sel = 0, pide = 0;
const abrirBus = () => { capa.hidden = false; document.body.classList.add('pb-locked'); inp.value = ''; pinta([]); setTimeout(() => inp.focus(), 20); };
const cerrarBus = () => { capa.hidden = true; document.body.classList.remove('pb-locked'); };
capa.addEventListener('click', (e) => { if (e.target === capa) cerrarBus(); });
const ejecuta = (it) => {
  if (!it) return;
  cerrarBus();
  if (it.ir && ir(it.ir)) return;
  if (it.url) { window.open(it.url, '_blank', 'noopener'); return; }
  if (it.web) { window.open(/^https?:/.test(it.web) ? it.web : 'https://' + it.web, '_blank', 'noopener'); return; }
  toast('No hay nada que abrir de esta empresa todavía.');
};
function pinta(lista, cargando) {
  items = lista; sel = 0; res.replaceChildren();
  const q = inp.value.trim();
  if (!lista.length) {
    res.append(el('p', 'vacio', cargando ? 'Buscando…' : q.length < 2 ? 'Escribe al menos 2 letras. Busca en solicitudes, WhatsApp, email, prospectos y demos.' : 'Nada con «' + q + '».'));
    return;
  }
  lista.forEach((it, i) => {
    const r = el('div', 'it' + (i === sel ? ' on' : '')); r.setAttribute('role', 'option');
    const tx = el('div', 'tx'); tx.append(el('b', null, it.titulo), el('small', null, it.sub || ''));
    r.append(el('span', 'tipo t-' + String(it.tipo).toLowerCase().replace(/\s+/g, '-'), it.tipo), tx);
    const acc = el('div', 'acc');
    if (it.tel) { const a = el('a', null, 'WhatsApp'); a.href = 'https://wa.me/' + String(it.tel).replace(/\D/g, ''); a.target = '_blank'; a.rel = 'noopener'; a.onclick = (e) => e.stopPropagation(); acc.append(a); }
    if (it.web && it.ir) { const a = el('a', null, 'Web ↗'); a.href = /^https?:/.test(it.web) ? it.web : 'https://' + it.web; a.target = '_blank'; a.rel = 'noopener'; a.onclick = (e) => e.stopPropagation(); acc.append(a); }
    if (acc.childElementCount) r.append(acc);
    r.onclick = () => ejecuta(it);
    r.onmousemove = () => marca(i);
    res.append(r);
  });
}
const marca = (i) => { sel = (i + items.length) % items.length; [...res.children].forEach((c, k) => c.classList.toggle('on', k === sel)); const c = res.children[sel]; if (c && c.scrollIntoView) c.scrollIntoView({ block: 'nearest' }); };
inp.addEventListener('input', () => {
  const q = inp.value.trim(), n = ++pide;
  const secs = q ? SECCIONES.filter((s) => s.t.toLowerCase().includes(q.toLowerCase())).map((s) => ({ tipo: 'Sección', titulo: s.t, sub: 'Ir a esta parte del panel', ir: 'pagina:' + s.p })) : [];
  if (q.length < 2) { pinta(secs); return; }
  pinta(secs, true);
  clearTimeout(inp.h);
  inp.h = setTimeout(async () => {
    try {
      const r = await fetch(BASE + '?buscar=' + encodeURIComponent(q), { credentials: 'same-origin', cache: 'no-store' });
      if (r.status === 401) { location.reload(); return; }
      const j = await r.json();
      if (n === pide) pinta(secs.concat(j.r || []));
    } catch (e) { if (n === pide) pinta(secs); }
  }, 180);
});
inp.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') { e.preventDefault(); if (items.length) marca(sel + 1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); if (items.length) marca(sel - 1); }
  else if (e.key === 'Enter') { e.preventDefault(); ejecuta(items[sel]); }
  else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cerrarBus(); }
});
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); capa.hidden ? abrirBus() : cerrarBus(); }
}, true);
const lupa = $('#pb-buscar'); if (lupa) lupa.addEventListener('click', abrirBus);

/* ============ avisos al navegador y al móvil ============ */
const bell = $('#pb-avisos');
const soporta = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
const b64 = (s) => { const p = '='.repeat((4 - (s.length % 4)) % 4), r = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(r, (c) => c.charCodeAt(0)); };
const post = async (action, f) => {
  const r = await fetch(BASE, { method: 'POST', credentials: 'same-origin', headers: { 'Accept': 'application/json' }, body: new URLSearchParams({ action, csrf: csrf(), ...f }) });
  const j = await r.json().catch(() => ({ ok: false }));
  if (!j.ok) throw new Error(j.error || 'No se ha podido.');
  return j;
};
let reg = null;
async function suscripcion() {
  if (!soporta) return null;
  reg = reg || await navigator.serviceWorker.register(BASE + 'sw.js', { scope: BASE });
  return reg.pushManager.getSubscription();
}
const pintaBell = (on) => {
  if (!bell) return;
  bell.classList.toggle('on', !!on);
  bell.title = on ? 'Avisos activados en este dispositivo (pulsa para probar o quitarlos)' : 'Activar avisos: solicitudes, citas, respuestas y demos abiertas';
  try { localStorage.setItem('pebai-push', on ? '1' : '0'); } catch (e) { /* nada */ }
};
// Menú pequeño cuando ya están activos: probar o quitar
function menuBell() {
  const m = el('div', 'pb-bell-menu');
  const pr = el('button', null, 'Enviar un aviso de prueba'), qu = el('button', null, 'Quitar los avisos de este dispositivo');
  pr.type = qu.type = 'button';
  m.append(el('small', null, 'Avisos activados aquí'), pr, qu);
  const fuera = (e) => { if (!m.contains(e.target) && e.target !== bell) { m.remove(); document.removeEventListener('click', fuera, true); } };
  pr.onclick = async () => { m.remove(); try { const j = await post('push_prueba', {}); toast(`Aviso de prueba enviado a ${j.dispositivos} ${j.dispositivos === 1 ? 'dispositivo' : 'dispositivos'}.`); } catch (er) { toast(er.message, true); } };
  qu.onclick = async () => {
    m.remove();
    try { const s = await suscripcion(); if (s) { await post('push_baja', { endpoint: s.endpoint }).catch(() => {}); await s.unsubscribe(); } pintaBell(false); toast('Avisos quitados de este dispositivo.'); } catch (er) { toast(er.message, true); }
  };
  bell.parentElement.append(m);
  setTimeout(() => document.addEventListener('click', fuera, true), 0);
}
async function activar() {
  if (!soporta) {
    const ios = /iPhone|iPad/.test(navigator.userAgent);
    toast(ios ? 'En iPhone: Compartir › Añadir a pantalla de inicio, abre el panel desde ese icono y vuelve a pulsar la campana.' : 'Este navegador no permite avisos.', true);
    return;
  }
  const p = await Notification.requestPermission();
  if (p !== 'granted') { toast('Has bloqueado los avisos. Se activan en los ajustes del navegador (el candado junto a la dirección).', true); return; }
  try {
    const r = await fetch(BASE + '?push_clave=1', { credentials: 'same-origin' });
    const j = await r.json(); if (!j.ok) throw new Error(j.error);
    await suscripcion();
    await navigator.serviceWorker.ready;
    const s = (await reg.pushManager.getSubscription()) || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(j.clave) });
    await post('push_alta', { endpoint: s.endpoint });
    pintaBell(true);
    await post('push_prueba', {});
    toast('Avisos activados. Te acaba de llegar uno de prueba.');
  } catch (er) { toast('No se han podido activar: ' + er.message, true); }
}
if (bell) {
  bell.addEventListener('click', async (e) => {
    e.stopImmediatePropagation();
    let s = null; try { s = await suscripcion(); } catch (er) { /* sin service worker */ }
    if (s && Notification.permission === 'granted') menuBell(); else activar();
  }, true);
  suscripcion().then((s) => {
    pintaBell(!!s && Notification.permission === 'granted');
    // si el navegador renovó la suscripción, se vuelve a apuntar (no pasa nada si ya estaba)
    if (s && Notification.permission === 'granted') post('push_alta', { endpoint: s.endpoint }).catch(() => {});
  }).catch(() => pintaBell(false));
}
})();
