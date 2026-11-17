/* PEBAI · Panel — Embudo › Growth Partner (rediseño 17/11/2026): héroe con lo apuntado por estado, tarjetas con medidor de encaje
   y 5 iconos de respuesta, y el formulario dibujado como embudo. Datos en index.php?growth=1 (ver _growth_panel.php).
   Usa window.PBX (comun.js). Todo texto de los datos pasa por esc(). Solo repinta si cambia la firma de los datos. */
(() => {
'use strict';
const app = document.getElementById('pb-app');
const raiz = document.getElementById('pb-growth');
if (!app || !raiz) return;
const BASE = app.dataset.base;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const N = (n) => new Intl.NumberFormat('es-ES').format(n || 0);
const coma = (n) => String(n).replace('.', ',');
// Cuentas por usuario (17/11/2026): el enlace para compartir lleva el origen de quien está dentro (docs/enlaces-y-utm.md)
const MI_ORIGEN = window.PB_YO && ['daniel', 'adrian'].includes(window.PB_YO.usuario) ? window.PB_YO.usuario : '';
const MES3 = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const toast = (msg, err) => { const t = document.getElementById('pb-toast'); if (!t) return; t.querySelector('span').textContent = msg; t.classList.toggle('err', !!err); t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 3200); };

const PASOS = ['Entra', 'Su red', 'Experiencia', 'Mentalidad', 'Motivo', 'Por qué', 'Contacto'];
const EST = { nuevo: ['Nuevo', 'var(--amber)'], contactado: ['Contactado', 'var(--cyan)'], activo: ['Activo', 'var(--lime)'], descartado: ['Descartado', 'var(--muted-2)'] };
// Las 5 respuestas: nombre corto, icono y pregunta corta (la larga sale de los datos)
const RESP = { negocio: ['Negocio', 'target', '¿Negocio en mente?'], red: ['Red', 'users', '¿Conoce dueños?'], experiencia: ['Experiencia', 'star', '¿Ha montado algo?'], mentalidad: ['Mentalidad', 'brain', 'Si no firma…'], motivo: ['Motivo', 'flame', '¿Qué le mueve?'] };
const CORTO = { uno: 'Uno', varios: 'Varios', todavia: 'Todavía no', pocos: 'Pocos', algunos: 'Algunos', muchos: 'Muchos', tiene: 'Tiene', intento: 'Intentó', quiere: 'Quiere', no: 'No', pregunta: 'Pregunta', siguiente: 'Siguiente', desanima: 'Lo deja', extra: 'Extra', aprender: 'Aprender', ayudar: 'Ayudar', curiosidad: 'Curiosidad' };
// Puntos por respuesta: los manda el servidor (PEBAI_GP_PUNTOS); si un panel viejo no los manda, los mismos de respaldo
const PUNTOS_DEF = { negocio: { uno: 3, varios: 3, todavia: 1 }, red: { pocos: 0, algunos: 2, muchos: 3 }, experiencia: { tiene: 3, intento: 2, quiere: 1, no: 0 }, mentalidad: { pregunta: 3, siguiente: 2, desanima: 0 }, motivo: { extra: 2, aprender: 2, ayudar: 3, curiosidad: 0 } };

let D = null, firma = '', pintadoCon = null;
const ui = { tab: 'solicitudes', estado: '' };
try { Object.assign(ui, JSON.parse(sessionStorage.getItem('pb-gp-ui') || '{}')); } catch (e) { /* nada */ }
const guarda = () => { try { sessionStorage.setItem('pb-gp-ui', JSON.stringify({ tab: ui.tab, estado: ui.estado })); } catch (e) { /* nada */ } };

async function cargar() {
  const r = await fetch(BASE + '?growth=1', { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } });
  if (r.status === 401) { if (window.pbCaduca) pbCaduca(); return false; }
  const j = await r.json(); if (!j.ok) throw new Error(j.error || 'Sin datos');
  const { csrf, ...sinCsrf } = j;
  const f = JSON.stringify(sinCsrf); const cambio = f !== firma; firma = f; D = j;
  const n = document.getElementById('pb-gp-n'); if (n) { n.textContent = D.cifras.nuevos ? N(D.cifras.nuevos) : ''; n.style.display = D.cifras.nuevos ? '' : 'none'; }
  return cambio;
}

/* ============ ayudantes ============ */
const P = () => D.puntos || PUNTOS_DEF;
const maxDe = (k) => Math.max(1, ...Object.values(P()[k] || { x: 1 }));
// Color de una respuesta por sus puntos: lima el máximo, ámbar lo medio, rojo lo bajo
function colorPuntos(k, v) {
  const t = P()[k] || {}, p = t[v];
  if (p == null) return 'var(--muted-2)';
  const max = maxDe(k);
  return p >= max ? 'var(--lime)' : p >= max / 2 ? 'var(--amber)' : 'var(--red)';
}
const colorEncaje = (e) => (e >= 11 ? 'var(--lime)' : e >= 7 ? 'var(--amber)' : 'var(--red)');
const nombreEncaje = (e) => (e >= 11 ? 'Alto' : e >= 7 ? 'Medio' : 'Bajo');
function hace(s) {
  const d = new Date(String(s).replace(' ', 'T')); if (isNaN(d)) return '';
  const min = (Date.now() - d) / 6e4;
  if (min < 60) return `hace ${Math.max(1, Math.round(min))} min`;
  if (min < 60 * 20) return `hace ${Math.round(min / 60)} h`;
  const dias = Math.round((new Date(new Date().toDateString()) - new Date(d.toDateString())) / 864e5);
  if (dias <= 0) return `hoy · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (dias === 1) return 'ayer';
  if (dias < 7) return `hace ${dias} días`;
  return `${d.getDate()} ${MES3[d.getMonth()]}`;
}
const marca = (id) => { const b = window.PB_ICONS && PB_ICONS.brands && PB_ICONS.brands[id]; return b ? `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${b.d}"/></svg>` : ''; };
const nombreOrigen = (o) => (o === 'Enlace directo' ? 'Enlace directo' : o || 'Web');

/* ============ héroe ============ */
function heroe() {
  const c = D.cifras, e = D.estados || {};
  const partes = Object.entries(EST).map(([k, [t, col]]) => [e[k] || 0, col, t]);
  const activos = D.filas.filter((f) => f.estado === 'activo');
  const serie = (D.serie || []).map((x) => x.visitas);
  const conv = c.conversion30 == null ? '—' : coma(c.conversion30) + ' %';
  return `<section class="pbx-c pbx-heroe gp-heroe pbg-n" style="--n:0">
    <div class="gp-izq">
      <span class="pbx-tag">Se han apuntado</span>
      <div class="pbx-big">${N(c.total)}</div>
      <p class="gp-frase"><b>${N(c.nuevos)}</b> sin contactar · <b>${N(c.activos)}</b> partner${c.activos === 1 ? '' : 's'} activo${c.activos === 1 ? '' : 's'} · cobran un <b>8 %</b> si el cliente firma</p>
      ${c.total ? PBX.split(partes) : ''}
    </div>
    <div class="gp-k4">
      <div class="pbx-kpi gp-k"><span>Visitas al formulario</span><b>${N(c.visitas30)}</b><small>30 días</small>${serie.some((v) => v) ? `<div class="gp-sp">${PBX.area(serie, 'var(--amber)', 100, 34)}</div>` : ''}</div>
      <div class="pbx-kpi gp-k"><span>Conversión</span><b>${conv}</b><small>${N(c.envios30)} envío${c.envios30 === 1 ? '' : 's'} de ${N(c.visitas30)}</small></div>
      <div class="pbx-kpi gp-k gp-k-med"><span>Encaje medio</span>${c.encaje_medio == null ? '<b>—</b><small>Aún sin solicitudes</small>' : `<div class="gp-med">${PBX.medidor(c.encaje_medio, 15, 'de 15 · ' + nombreEncaje(c.encaje_medio).toLowerCase(), [11 / 15, 7 / 15])}</div>`}</div>
      <div class="pbx-kpi gp-k"><span>Partners activos</span><b class="pbx-lima">${N(c.activos)}</b><small>${activos.length ? esc(activos.slice(0, 2).map((f) => f.nombre.split(' ')[0]).join(', ')) + (activos.length > 2 ? ` y ${activos.length - 2} más` : '') : 'Ninguno todavía'}</small></div>
    </div>
  </section>`;
}

/* ============ solicitudes ============ */
function tarjeta(f, i) {
  const red = PBX.red(f.origen), enc = +f.encaje || 0;
  const [et, col] = EST[f.estado] || [f.estado, 'var(--muted)'];
  const tel = String(f.telefono || '').replace(/\D/g, ''); const wa = tel.length === 9 ? '34' + tel : tel;
  const iconos = Object.keys(RESP).map((k) => {
    const [n, ic] = RESP[k], v = f[k], txt = (D.preguntas[k] && D.preguntas[k].opciones[v]) || '—';
    const pts = (P()[k] || {})[v];
    return `<button type="button" class="gpc-r" style="--c:${colorPuntos(k, v)}" data-resp="${k}" title="${esc((D.preguntas[k] || {}).titulo || n)}: ${esc(txt)}${pts != null ? ` (${pts} de ${maxDe(k)})` : ''}">${PBX.ico(ic)}<span>${n}</span></button>`;
  }).join('');
  const menu = Object.entries(D.estados_nombre).map(([k, t]) => `<button type="button" data-id="${f.id}" data-estado="${k}" class="${f.estado === k ? 'on' : ''}" style="--c:${(EST[k] || [])[1] || 'var(--muted)'}"><i class="pbx-dot r" style="--c:${(EST[k] || [])[1] || 'var(--muted)'}"></i>${esc(t)}</button>`).join('');
  return `<article class="pbx-c gpc ${esc(f.estado)} pbg-n" style="--n:${Math.min(i + 1, 12)}" data-gp="${f.id}">
    <header>
      ${PBX.cara(f.nombre, red)}
      <div class="gpc-q-n"><b>${esc(f.nombre)}</b><small class="gpc-org">${PBX.logo(red)}<em>${esc(nombreOrigen(f.origen))}</em> · ${esc(hace(f.created_at))}${f.estado_por ? ' · ' + esc((window.PB_USUARIOS || {})[f.estado_por] || f.estado_por) : ''}</small></div>
      <div class="gpc-med" title="Encaje ${enc} de 15">${PBX.medidor(enc, 15, nombreEncaje(enc), [11 / 15, 7 / 15])}</div>
    </header>
    ${f.porque ? `<button type="button" class="gpc-porque" data-porque title="Ver entero">«${esc(f.porque)}»</button>` : '<p class="gpc-porque vacio">No escribió por qué.</p>'}
    <div class="gpc-r5">${iconos}</div>
    <p class="gpc-det" hidden></p>
    <footer>
      <details class="gpc-est"><summary class="pbx-pill" style="--c:${col}" title="Cambiar el estado">${esc(et)}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary><div class="gpc-menu" role="menu">${menu}</div></details>
      ${wa ? `<a class="pbx-btn wa sm" href="https://wa.me/${esc(wa)}" target="_blank" rel="noopener" title="${esc(f.telefono)}">${marca('whatsapp')}WhatsApp</a>` : ''}
      ${f.email ? `<a class="pbx-btn ico gpc-mail" href="mailto:${esc(f.email)}" title="${esc(f.email)}" aria-label="Email a ${esc(f.email)}">${PBX.ico('mail')}</a>` : `<span class="pbx-btn ico gpc-mail off" title="Sin email">${PBX.ico('mail')}</span>`}
    </footer>
  </article>`;
}
function chips() {
  const tot = D.filas.length;
  return `<div class="pbx-chips una gp-chips">${[['', 'Todas', tot, 'var(--fg-strong)'], ...Object.entries(EST).map(([k, [t, c]]) => [k, t, (D.estados || {})[k] || 0, c])]
    .map(([k, t, n, c]) => `<button type="button" class="pbx-chip${ui.estado === k ? ' on' : ''}" data-filtro="${k}" style="--c:${c}">${esc(t)} <em>${N(n)}</em></button>`).join('')}</div>`;
}
function lista() {
  const filas = D.filas.filter((f) => !ui.estado || f.estado === ui.estado)
    .sort((a, b) => ((a.estado === 'descartado') - (b.estado === 'descartado')) || (b.encaje - a.encaje) || (b.id - a.id));
  if (!filas.length) return `<div class="pbx-c pbx-vacio">${D.filas.length ? 'Nada con este filtro.' : 'Todavía no se ha apuntado nadie. El formulario está en pebaisystems.es/growth-partner/.'}</div>`;
  return `<div class="gp-cards">${filas.map(tarjeta).join('')}</div>`;
}

/* ============ estadísticas ============ */
function embudo() {
  const pasos = D.embudo.map((p, i) => [`${i + 1}. ${PASOS[i] || 'Paso ' + (i + 1)}`, p.n]).concat([['Enviada', D.cifras.envios30]]);
  const top = Math.max(1, pasos[0][1]);
  if (!pasos[0][1]) return `<article class="pbx-c gp-emb-c pbg-n" style="--n:1"><div class="pbx-ch"><h3>El formulario, paso a paso</h3><span>30 días</span></div><p class="pbx-vacio">Aún no ha llegado nadie al formulario.</p></article>`;
  const caidas = pasos.map((p, i) => (i && pasos[i - 1][1] ? Math.round((1 - p[1] / pasos[i - 1][1]) * 100) : null));
  const val = caidas.filter((x) => x != null);
  const peorV = val.length ? Math.max(...val) : null, peor = peorV > 0 ? caidas.indexOf(peorV) : -1;
  const filas = pasos.map(([t, n], i) => `<div class="gp-emb${i === pasos.length - 1 ? ' fin' : ''}${i === peor ? ' peor' : ''}"><span>${esc(t)}</span><u><i style="width:${Math.max(n ? 4 : 1, n / top * 100).toFixed(1)}%"></i></u><em><b>${N(n)}</b><small>${caidas[i] != null ? (caidas[i] > 0 ? '−' : '') + Math.abs(caidas[i]) + ' %' : ''}</small></em></div>`).join('');
  const nombre = peor > -1 ? (peor === pasos.length - 1 ? 'el envío' : PASOS[peor] || pasos[peor][0]) : '';
  return `<article class="pbx-c gp-emb-c pbg-n" style="--n:1"><div class="pbx-ch"><h3>El formulario, paso a paso</h3><span>30 días</span></div>
    <div class="gp-embudo">${filas}</div>
    ${peor > -1 ? `<div class="gp-alerta">${PBX.ico('alert')}<span>La mayor caída está en <b>${esc(nombre)}</b>: se va el ${peorV}&nbsp;%.</span></div>` : ''}</article>`;
}
function origenes() {
  const O = D.origenes || [];
  if (!O.length) return `<article class="pbx-c pbg-n" style="--n:2"><div class="pbx-ch"><h3>De dónde llegan</h3></div><p class="pbx-vacio">Aún no ha llegado nadie al formulario.</p></article>`;
  const maxV = Math.max(1, ...O.map((o) => o.visitas));
  const tarjetas = O.map((o) => { const r = PBX.red(o.origen), conv = o.visitas ? coma((o.solicitudes / o.visitas * 100).toFixed(1)) + ' %' : '—';
    return `<div class="gp-org"><header>${PBX.logo(r, 'b')}<span>${esc(nombreOrigen(o.origen))}</span><em>${conv}</em></header><span class="pbx-bar" style="--c:var(--violet-2)"><i style="--w:${Math.max(o.visitas ? 3 : 0, o.visitas / maxV * 100)}%"></i></span><div class="ft"><span><b>${N(o.visitas)}</b> visitas</span><span><b>${N(o.solicitudes)}</b> solicitud${o.solicitudes === 1 ? '' : 'es'}</span></div></div>`; }).join('');
  const tabla = `<details class="pbx-pleg gp-pleg"><summary>Tabla de orígenes</summary><div class="pbx-pleg-in"><div class="gp-tabla">
    <div class="th"><span>Origen</span><span>Visitas</span><span>Solicitudes</span><span>Conversión</span></div>
    ${O.map((o) => `<div><span>${esc(o.origen)}</span><span>${N(o.visitas)}</span><span>${N(o.solicitudes)}</span><span>${o.visitas ? Math.round(o.solicitudes / o.visitas * 100) + ' %' : '—'}</span></div>`).join('')}</div></div></details>`;
  return `<article class="pbx-c pbg-n" style="--n:2"><div class="pbx-ch"><h3>De dónde llegan</h3><span>Visitas → solicitudes · 30 días</span></div><div class="gp-orgs">${tarjetas}</div>${tabla}</article>`;
}
function respuestas() {
  const total = D.filas.length;
  const filas = D.respuestas.map((r) => {
    const tot = r.opciones.reduce((s, o) => s + o.n, 0);
    const segs = tot ? r.opciones.filter((o) => o.n).map((o) => { const w = o.n / tot * 100;
      return `<i style="width:calc(${w.toFixed(2)}% - 2px);background:${colorPuntos(r.clave, o.v)}" title="${esc(o.t)}: ${o.n}">${w >= 14 ? `${esc(CORTO[o.v] || o.t.split(' ')[0])} <b>${o.n}</b>` : ''}</i>`; }).join('') : '';
    return `<div class="gp-preg" title="${esc(r.titulo)}"><span>${esc((RESP[r.clave] || [])[2] || r.titulo)}</span><div class="gp-p100">${segs}</div></div>`;
  }).join('');
  return `<article class="pbx-c pbg-n" style="--n:3"><div class="pbx-ch"><h3>Qué responden</h3><span>${N(total)} solicitud${total === 1 ? '' : 'es'}</span></div>
    ${total ? filas + `<div class="pbx-ley gp-ley"><span><i class="pbx-dot" style="--c:var(--lime)"></i>Suma más</span><span><i class="pbx-dot" style="--c:var(--amber)"></i>Suma algo</span><span><i class="pbx-dot" style="--c:var(--red)"></i>Resta</span></div>` : '<p class="pbx-vacio">Aún sin respuestas.</p>'}</article>`;
}
function serie() {
  const s = D.serie || []; if (!s.length) return '';
  const max = Math.max(1, ...s.map((x) => Math.max(x.visitas, x.solicitudes)));
  const barras = s.map((x, i) => `<div class="gp-dia" title="${esc(x.d)}: ${x.visitas} visitas, ${x.solicitudes} solicitudes"><i style="height:${x.visitas / max * 100}%"></i><b style="height:${x.solicitudes / max * 100}%"></b>${i % 5 === 4 || i === s.length - 1 ? `<small>${i === s.length - 1 ? 'hoy' : +x.d.slice(8)}</small>` : ''}</div>`).join('');
  return `<details class="pbx-pleg gp-pleg"><summary>Visitas y solicitudes, día a día</summary><div class="pbx-pleg-in"><div class="pbx-ley gp-ley"><span><i class="pbx-dot" style="--c:color-mix(in srgb,var(--violet-2) 45%,transparent)"></i>Visitas</span><span><i class="pbx-dot" style="--c:var(--lime)"></i>Solicitudes</span></div><div class="gp-serie">${barras}</div></div></details>`;
}

/* ============ pintar ============ */
function pintar() {
  if (!D || document.body.dataset.page !== 'growth') return;
  pintadoCon = firma;
  const sol = ui.tab !== 'estadisticas';
  raiz.innerHTML = `<header class="pbx-cab"><div><h2 class="pbx-h1">Growth <i>Partner</i></h2></div>
      <span>${MI_ORIGEN ? `<button type="button" class="pbx-btn ghost sm" data-copiar-gp title="El enlace lleva tu nombre (origen=${esc(MI_ORIGEN)}): quien se apunte por él cuenta como tuyo">Copiar mi enlace</button> ` : ''}<a class="pbx-btn ghost sm" href="https://pebaisystems.es/growth-partner/" target="_blank" rel="noopener">Ver el formulario ↗</a></span></header>
    ${heroe()}
    <div class="gp-barra"><nav class="pb-seg gp-tabs"><button type="button" data-tab="solicitudes" class="${sol ? 'on' : ''}">Solicitudes</button><button type="button" data-tab="estadisticas" class="${sol ? '' : 'on'}">Estadísticas</button></nav>${sol ? chips() : ''}</div>
    <div class="gp-cuerpo">${sol ? lista() : `<div class="gp-est">${embudo()}<div class="gp-col">${origenes()}${respuestas()}</div></div>${serie()}`}</div>`;
  if (window.pbSeg) raiz.querySelectorAll('.pb-seg').forEach((s) => window.pbSeg(s));
}

const cierraMenus = (salvo) => raiz.querySelectorAll('details.gpc-est[open]').forEach((d) => { if (d !== salvo) d.open = false; });
raiz.addEventListener('toggle', (e) => { if (e.target.matches && e.target.matches('details.gpc-est') && e.target.open) cierraMenus(e.target); }, true);
document.addEventListener('click', (e) => { if (!e.target.closest('details.gpc-est')) cierraMenus(); });
raiz.addEventListener('click', async (e) => {
  if (e.target.closest('[data-copiar-gp]')) {
    const url = 'https://pebaisystems.es/growth-partner/?origen=' + MI_ORIGEN;
    navigator.clipboard.writeText(url).then(() => toast('Enlace copiado: ' + url), () => toast(url));
    return;
  }
  const t = e.target.closest('[data-tab]'); if (t) { if (ui.tab !== t.dataset.tab) { ui.tab = t.dataset.tab; guarda(); pintar(); } return; }
  const fl = e.target.closest('[data-filtro]'); if (fl) { ui.estado = fl.dataset.filtro; guarda(); pintar(); return; }
  const pq = e.target.closest('[data-porque]'); if (pq) { pq.classList.toggle('abierto'); return; }
  const rs = e.target.closest('[data-resp]');
  if (rs) {
    const card = rs.closest('.gpc'), det = card.querySelector('.gpc-det'), f = D.filas.find((x) => String(x.id) === card.dataset.gp), k = rs.dataset.resp;
    const ya = rs.classList.contains('on');
    card.querySelectorAll('.gpc-r.on').forEach((x) => x.classList.remove('on'));
    if (ya || !f) { det.hidden = true; return; }
    rs.classList.add('on');
    const q = D.preguntas[k] || {}, v = f[k], pts = (P()[k] || {})[v];
    det.style.setProperty('--c', colorPuntos(k, v));
    det.innerHTML = `<small>${esc(q.titulo || RESP[k][0])}</small><b>${esc((q.opciones || {})[v] || '—')}</b>${pts != null ? `<em>${pts} de ${maxDe(k)}</em>` : ''}`;
    det.hidden = false; return;
  }
  const b = e.target.closest('[data-estado]'); if (!b) return;
  const menu = b.closest('details'); if (b.classList.contains('on')) { if (menu) menu.open = false; return; }
  b.disabled = true;
  try {
    const r = await fetch(BASE, { method: 'POST', credentials: 'same-origin', headers: { Accept: 'application/json' }, body: new URLSearchParams({ action: 'growth_estado', csrf: D.csrf || app.dataset.csrf, id: b.dataset.id, estado: b.dataset.estado }) });
    if (r.status === 401) { if (window.pbCaduca) pbCaduca(); throw new Error('Sesión caducada'); }
    const j = await r.json().catch(() => ({ ok: false, error: 'Respuesta inesperada del servidor.' }));
    if (!j.ok) throw new Error(j.error || 'No se ha podido guardar.');
    await cargar(); pintar(); toast('Estado guardado.');
  } catch (er) { toast(er.message, true); b.disabled = false; }
});

const refrescar = () => cargar().then(() => { if (pintadoCon !== firma) pintar(); }).catch((er) => { if (document.body.dataset.page === 'growth') { pintadoCon = null; raiz.innerHTML = `<p class="pbx-vacio">${esc(er.message)}</p>`; } });
document.addEventListener('pb:page', (e) => { if (e.detail === 'growth') { if (D && pintadoCon !== firma) pintar(); refrescar(); } });
setInterval(() => { if (!document.hidden && document.body.dataset.page === 'growth') refrescar(); }, 60000);
refrescar();
})();
