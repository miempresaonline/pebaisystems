/* PEBAI · Panel — Embudo › Growth Partner: quién se ha apuntado desde /growth-partner/, sus respuestas y las estadísticas del formulario.
   Datos en index.php?growth=1 (ver _growth_panel.php). Todo texto de los datos pasa por esc(). */
(() => {
'use strict';
const app = document.getElementById('pb-app');
const raiz = document.getElementById('pb-growth');
if (!app || !raiz) return;
const BASE = app.dataset.base;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const N = (n) => new Intl.NumberFormat('es-ES').format(n || 0);
const MES3 = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const fecha = (s) => { const d = new Date(String(s).replace(' ', 'T')); return `${d.getDate()} ${MES3[d.getMonth()]} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
const toast = (msg, err) => { const t = document.getElementById('pb-toast'); if (!t) return; t.querySelector('span').textContent = msg; t.classList.toggle('err', !!err); t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 3200); };
const encaje = (p) => (p >= 11 ? ['Alto', 'alto'] : p >= 7 ? ['Medio', 'medio'] : ['Bajo', 'bajo']);
const PASOS = ['Entra', 'Su red', 'Experiencia', 'Mentalidad', 'Motivo', 'Por qué', 'Contacto'];
const ESTADO_C = { nuevo: '#FFB547', contactado: '#3FD5FF', activo: '#B7FF3C', descartado: '#6F7189' };

let D = null, firma = '';
const ui = { tab: 'solicitudes', estado: '' };
try { Object.assign(ui, JSON.parse(sessionStorage.getItem('pb-gp-ui') || '{}')); } catch (e) { /* nada */ }
const guarda = () => { try { sessionStorage.setItem('pb-gp-ui', JSON.stringify(ui)); } catch (e) { /* nada */ } };

async function cargar() {
  const r = await fetch(BASE + '?growth=1', { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } });
  if (r.status === 401) { if (window.pbCaduca) pbCaduca(); return false; }
  const j = await r.json(); if (!j.ok) throw new Error(j.error || 'Sin datos');
  const f = JSON.stringify(j); const cambio = f !== firma; firma = f; D = j;
  const n = document.getElementById('pb-gp-n'); if (n) { n.textContent = D.cifras.nuevos ? N(D.cifras.nuevos) : ''; n.style.display = D.cifras.nuevos ? '' : 'none'; }
  return cambio;
}

/* ============ estadísticas ============ */
function kpis() {
  const c = D.cifras;
  const k = (t, v, s, cl) => `<div class="gp-kpi ${cl || ''}"><small>${t}</small><b>${v}</b><span>${s}</span></div>`;
  return `<div class="gp-kpis">
    ${k('Solicitudes', N(c.total), c.nuevos ? `${N(c.nuevos)} sin contactar` : 'Todas atendidas', c.nuevos ? 'vivo' : '')}
    ${k('Visitas al formulario', N(c.visitas30), 'últimos 30 días')}
    ${k('Conversión', c.conversion30 == null ? '—' : String(c.conversion30).replace('.', ',') + ' %', `${N(c.envios30)} envíos en 30 días`)}
    ${k('Partners activos', N(c.activos), c.encaje_medio == null ? 'Aún sin solicitudes' : `Encaje medio ${String(c.encaje_medio).replace('.', ',')} de 15`)}
  </div>`;
}
function embudo() {
  const top = Math.max(1, D.embudo[0].n);
  const filas = D.embudo.map((p, i) => {
    const pc = Math.round(p.n / top * 100);
    const caida = i && D.embudo[i - 1].n ? Math.round((1 - p.n / D.embudo[i - 1].n) * 100) : null;
    return `<div class="gp-emb"><span>${i + 1}. ${PASOS[i]}</span><u><i style="--w:${Math.max(p.n ? 2 : 0, pc)}%"></i></u><b>${N(p.n)}</b><em>${caida > 0 ? '−' + caida + ' %' : ''}</em></div>`;
  }).join('');
  return `<div class="gp-card"><div class="gp-card-h"><h3>Embudo del formulario</h3><span>30 días · cuántos llegan a cada paso</span></div>${filas}
    <div class="gp-emb fin"><span>Enviada</span><u><i style="--w:${Math.round(D.cifras.envios30 / top * 100)}%"></i></u><b>${N(D.cifras.envios30)}</b><em></em></div></div>`;
}
function serie() {
  const s = D.serie, max = Math.max(1, ...s.map((x) => Math.max(x.visitas, x.solicitudes)));
  const barras = s.map((x, i) => `<div class="gp-dia" title="${esc(x.d)}: ${x.visitas} visitas, ${x.solicitudes} solicitudes"><i style="--h:${x.visitas / max * 100}%"></i><b style="--h:${x.solicitudes / max * 100}%"></b>${i % 5 === 4 || i === s.length - 1 ? `<small>${i === s.length - 1 ? 'hoy' : +x.d.slice(8)}</small>` : ''}</div>`).join('');
  return `<div class="gp-card"><div class="gp-card-h"><h3>Visitas y solicitudes</h3><span><i class="ley v"></i>Visitas <i class="ley s"></i>Solicitudes · 30 días</span></div><div class="gp-serie">${barras}</div></div>`;
}
function respuestas() {
  const total = Math.max(1, D.filas.length);
  return `<div class="gp-card"><div class="gp-card-h"><h3>Qué responden</h3><span>${N(D.filas.length)} solicitudes</span></div><div class="gp-resp">${D.respuestas.map((r) => `
    <div class="gp-preg"><b>${esc(r.titulo)}</b>${r.opciones.map((o) => `<div class="gp-op"><span>${esc(o.t)}</span><u><i style="--w:${Math.round(o.n / total * 100)}%"></i></u><em>${N(o.n)}</em></div>`).join('')}</div>`).join('')}</div></div>`;
}
function origenes() {
  if (!D.origenes.length) return `<div class="gp-card"><div class="gp-card-h"><h3>De dónde llegan</h3></div><p class="gp-vacio">Aún no ha llegado nadie al formulario.</p></div>`;
  return `<div class="gp-card"><div class="gp-card-h"><h3>De dónde llegan</h3><span>30 días</span></div><div class="gp-tabla">
    <div class="th"><span>Origen</span><span>Visitas</span><span>Solicitudes</span><span>Conversión</span></div>
    ${D.origenes.map((o) => `<div><span>${esc(o.origen)}</span><span>${N(o.visitas)}</span><span>${N(o.solicitudes)}</span><span>${o.visitas ? Math.round(o.solicitudes / o.visitas * 100) + ' %' : '—'}</span></div>`).join('')}</div></div>`;
}

/* ============ solicitudes ============ */
function ficha(f) {
  const [et, cl] = encaje(f.encaje);
  const P = D.preguntas;
  const resp = Object.keys(P).map((k) => `<span><small>${esc(P[k].titulo)}</small>${esc(P[k].opciones[f[k]] || '—')}</span>`).join('');
  const tel = String(f.telefono).replace(/\D/g, ''); const wa = tel.length === 9 ? '34' + tel : tel;
  const estados = Object.entries(D.estados_nombre).map(([k, t]) => `<button type="button" class="${f.estado === k ? 'on' : ''}" data-id="${f.id}" data-estado="${k}" style="--c:${ESTADO_C[k]}">${esc(t)}</button>`).join('');
  return `<article class="gp-sol ${f.estado}">
    <header><div><h4>${esc(f.nombre)}</h4><p>${esc(fecha(f.created_at))} · desde ${esc(f.origen)}</p></div><span class="gp-enc ${cl}" title="Encaje según sus respuestas">${et} · ${f.encaje}/15</span></header>
    ${f.porque ? `<blockquote>«${esc(f.porque)}»</blockquote>` : ''}
    <div class="gp-rs">${resp}</div>
    <footer>
      <div class="gp-acc"><a class="pb-btn" href="https://wa.me/${esc(wa)}" target="_blank" rel="noopener">WhatsApp · ${esc(f.telefono)}</a><a class="pb-btn ghost" href="mailto:${esc(f.email)}">${esc(f.email)}</a></div>
      <div class="gp-est" role="group" aria-label="Estado">${estados}</div>
    </footer>
  </article>`;
}
function lista() {
  const filas = D.filas.filter((f) => !ui.estado || f.estado === ui.estado);
  const filtros = [['', 'Todas', D.filas.length], ...Object.entries(D.estados_nombre).map(([k, t]) => [k, t, D.estados[k] || 0])]
    .map(([k, t, n]) => `<button type="button" data-filtro="${k}" class="${ui.estado === k ? 'on' : ''}">${esc(t)} <em>${N(n)}</em></button>`).join('');
  return `<div class="pb-seg gp-filtros">${filtros}</div>
    ${filas.length ? `<div class="gp-lista">${filas.map(ficha).join('')}</div>` : `<p class="gp-vacio">${D.filas.length ? 'Nada con este filtro.' : 'Todavía no se ha apuntado nadie. El formulario está en pebaisystems.es/growth-partner/.'}</p>`}`;
}

/* ============ pintar ============ */
function pintar() {
  if (!D || document.body.dataset.page !== 'growth') return;
  raiz.innerHTML = `<header class="gp-cab"><div><h2>Growth Partner</h2><p>Personas que nos presentan negocios y cobran un 8 % si el cliente firma. Aquí entra cada solicitud del formulario, con sus respuestas y lo que convierte.</p></div>
      <a class="pb-btn ghost" href="https://pebaisystems.es/growth-partner/" target="_blank" rel="noopener">Ver el formulario</a></header>
    ${kpis()}
    <nav class="pb-seg gp-tabs"><button type="button" data-tab="solicitudes" class="${ui.tab === 'solicitudes' ? 'on' : ''}">Solicitudes</button><button type="button" data-tab="estadisticas" class="${ui.tab === 'estadisticas' ? 'on' : ''}">Estadísticas</button></nav>
    <div class="gp-cuerpo">${ui.tab === 'estadisticas' ? `<div class="gp-dos">${embudo()}${serie()}</div>${respuestas()}${origenes()}` : lista()}</div>`;
  if (window.pbSeg) raiz.querySelectorAll('.pb-seg').forEach((s) => window.pbSeg(s));
}
raiz.addEventListener('click', async (e) => {
  const t = e.target.closest('[data-tab]'); if (t) { ui.tab = t.dataset.tab; guarda(); pintar(); return; }
  const fl = e.target.closest('[data-filtro]'); if (fl) { ui.estado = fl.dataset.filtro; guarda(); pintar(); return; }
  const b = e.target.closest('[data-estado]'); if (!b || b.classList.contains('on')) return;
  b.disabled = true;
  try {
    const r = await fetch(BASE, { method: 'POST', credentials: 'same-origin', headers: { Accept: 'application/json' }, body: new URLSearchParams({ action: 'growth_estado', csrf: D.csrf || app.dataset.csrf, id: b.dataset.id, estado: b.dataset.estado }) });
    const j = await r.json().catch(() => ({ ok: false, error: 'Respuesta inesperada del servidor.' }));
    if (!j.ok) throw new Error(j.error || 'No se ha podido guardar.');
    await cargar(); pintar(); toast('Estado guardado.');
  } catch (er) { toast(er.message, true); b.disabled = false; }
});

const refrescar = () => cargar().then((cambio) => { if (cambio || !raiz.firstChild) pintar(); }).catch((er) => { if (document.body.dataset.page === 'growth') raiz.innerHTML = `<p class="gp-vacio">${esc(er.message)}</p>`; });
document.addEventListener('pb:page', (e) => { if (e.detail === 'growth') { if (D) pintar(); refrescar(); } });
setInterval(() => { if (!document.hidden && document.body.dataset.page === 'growth') refrescar(); }, 60000);
refrescar();
})();
