/* PEBAI · Panel — tu cuenta (17/11/2026: cuentas por usuario con rol). El botón redondo con tu inicial (abajo en el menú
   lateral, arriba en el móvil) abre un menú con quién está dentro, «Cambiar mi contraseña» y «Salir».
   window.PB_YO = { usuario, nombre, rol, roles } y window.PB_USUARIOS = { daniel: 'Daniel', … } los pone index.php.
   Los permisos de verdad los comprueba el servidor en cada acción; aquí solo se enseña lo que cada uno puede usar. */
(() => {
'use strict';
const app = document.getElementById('pb-app');
const yoBtn = document.getElementById('pb-yo');
if (!app || !yoBtn) return;
const BASE = app.dataset.base;
const YO = window.PB_YO || { usuario: '', nombre: 'Equipo', rol: 'admin', roles: {} };
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const toast = (msg, err) => { const t = document.getElementById('pb-toast'); if (!t) return; t.querySelector('span').textContent = msg; t.classList.toggle('err', !!err); t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 3600); };

/* ---------- menú de la cuenta ---------- */
function cierraMenu() { const m = document.querySelector('.pb-yo-menu'); if (m) m.remove(); yoBtn.setAttribute('aria-expanded', 'false'); document.removeEventListener('click', fuera, true); }
function fuera(e) { const m = document.querySelector('.pb-yo-menu'); if (m && !m.contains(e.target) && !yoBtn.contains(e.target)) cierraMenu(); }
function abreMenu() {
  const m = el('div', 'pb-bell-menu pb-yo-menu'); m.setAttribute('role', 'menu');
  const quien = el('div', 'pb-yo-quien');
  quien.append(el('b', null, YO.nombre || 'Equipo'), el('span', null, YO.usuario ? (YO.roles[YO.rol] || YO.rol) + ' · ' + YO.usuario : 'Contraseña compartida'));
  m.append(quien);
  if (YO.usuario) {
    const cambiar = el('button', null, 'Cambiar mi contraseña'); cambiar.type = 'button'; cambiar.setAttribute('role', 'menuitem');
    cambiar.onclick = () => { cierraMenu(); dialogoClave(); };
    m.append(cambiar);
  }
  const salir = el('a', 'pb-yo-salir', 'Salir'); salir.href = BASE + '?salir=1'; salir.setAttribute('role', 'menuitem');
  m.append(salir);
  yoBtn.parentElement.append(m);
  yoBtn.setAttribute('aria-expanded', 'true');
  setTimeout(() => document.addEventListener('click', fuera, true), 0);
  const primero = m.querySelector('button,a'); if (primero) primero.focus();
}
yoBtn.addEventListener('click', (e) => { e.stopPropagation(); if (document.querySelector('.pb-yo-menu')) cierraMenu(); else abreMenu(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.querySelector('.pb-yo-menu')) { cierraMenu(); yoBtn.focus(); } });

/* ---------- «Cambiar mi contraseña» (pide la actual) ---------- */
function dialogoClave() {
  const veil = el('div', 'pb-cj-veil'); const m = el('div', 'pb-cj-modal pb-yo-modal'); m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-label', 'Cambiar mi contraseña');
  const h = el('div', 'mh'); h.append(el('h3', null, 'Cambiar mi contraseña'));
  const x = el('button', 'pb-btn ghost icon', '×'); x.type = 'button'; x.title = 'Cerrar'; h.append(x);
  const f = el('form', 'mb'); f.noValidate = true;
  // campo de usuario oculto: los gestores de contraseñas saben así de qué cuenta es
  const u = el('input'); u.type = 'text'; u.name = 'usuario'; u.autocomplete = 'username'; u.value = YO.usuario; u.hidden = true; f.append(u);
  const campo = (label, name, auto, extra) => { const l = el('label', 'pb-field'); const s = el('span', null, label); if (extra) s.append(el('em', null, extra)); const i = el('input'); i.type = 'password'; i.name = name; i.autocomplete = auto; i.required = true; l.append(s, i); f.append(l); return i; };
  const actual = campo('Contraseña actual', 'actual', 'current-password');
  const nueva = campo('Contraseña nueva', 'nueva', 'new-password', 'al menos 10 caracteres');
  const repite = campo('Repite la nueva', 'repite', 'new-password');
  const err = el('p', 'pb-yo-err'); err.hidden = true; f.append(err);
  const foot = el('div', 'mf'); const sp = el('span', 'sp');
  const no = el('button', 'pb-btn ghost', 'Cancelar'); no.type = 'button';
  const si = el('button', 'pb-btn primary', 'Guardar'); si.type = 'submit';
  foot.append(sp, no, si);
  m.append(h, f, foot); veil.append(m); document.body.append(veil);
  requestAnimationFrame(() => veil.classList.add('on'));
  const cerrar = () => { veil.classList.remove('on'); setTimeout(() => veil.remove(), 220); document.removeEventListener('keydown', esc, true); };
  const esc = (e) => { if (e.key === 'Escape') { e.stopImmediatePropagation(); cerrar(); } };
  document.addEventListener('keydown', esc, true);
  x.onclick = no.onclick = cerrar;
  veil.addEventListener('mousedown', (e) => { if (e.target === veil) cerrar(); });
  const mal = (t, campoMal) => { err.textContent = t; err.hidden = false; if (campoMal) campoMal.focus(); };
  const enviar = async (e) => {
    if (e) e.preventDefault();
    err.hidden = true;
    if (!actual.value) return mal('Escribe tu contraseña actual.', actual);
    if (nueva.value.length < 10) return mal('La nueva tiene que tener al menos 10 caracteres.', nueva);
    if (nueva.value !== repite.value) return mal('Las dos contraseñas nuevas no coinciden.', repite);
    si.disabled = true;
    try {
      const r = await fetch(BASE, { method: 'POST', credentials: 'same-origin', headers: { Accept: 'application/json' },
        body: new URLSearchParams({ action: 'mi_clave', csrf: app.dataset.csrf, actual: actual.value, nueva: nueva.value, repite: repite.value }) });
      if (r.status === 401) { pbCaduca(); throw new Error('Sesión caducada.'); }
      const j = await r.json().catch(() => ({ ok: false, error: 'Respuesta inesperada del servidor.' }));
      if (!j.ok) throw new Error(j.error || 'No se ha podido cambiar.');
      cerrar(); toast('Contraseña cambiada. Las demás sesiones de tu cuenta se han cerrado.');
    } catch (er) { mal(er.message); si.disabled = false; }
  };
  f.addEventListener('submit', enviar);
  si.addEventListener('click', enviar);
  setTimeout(() => actual.focus(), 60);
}
})();
