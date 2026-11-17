/* PEBAI · Panel — Resumen (rediseño 17/11, maqueta aprobada por Daniel): solo lo que Daniel usa.
   Arriba, una línea con lo que espera hoy. Rejilla: «Te toca responder» (manda, en lima si hay algo, con la cara de cada empresa),
   Solicitudes de 30 días (cifra, variación y área), Agentes (anillo con un segmento por agente) y la Caja del mes a lo ancho.
   Debajo, la Actividad: chips por tipo, la tira de hoy de 0 a 24 h y la lista por días con el icono de cada tipo; historial completo.
   Datos en index.php?global=1 y ?avisos_hist=1. Todo dato se escapa (PBX.esc) antes de pintarlo. Se repinta solo si cambian los datos. */
(() => {
'use strict';
const app = document.getElementById('pb-app');
const box = document.getElementById('pb-global');
if (!app || !box) return;
const BASE = app.dataset.base;
const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
const P = () => window.PBX;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const N = (n) => new Intl.NumberFormat('es-ES').format(n || 0);
const euros = (c) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format((c || 0) / 100);
const MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MESC = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DIA = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const DIAL = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const pad = (n) => String(n).padStart(2, '0');
const hm = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const ir = (p) => { const b = document.querySelector(`#pb-tabs button[data-page="${p}"]:not(#pb-nav-control)`); if (b) b.click(); };
const abreConv = (k) => { ir('conversaciones'); setTimeout(() => document.dispatchEvent(new CustomEvent('pb:abrir-conv', { detail: k })), 150); };
// Las citas llegan en hora UTC sin zona
const utc = (s) => new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : s + 'Z');
const local = (s) => new Date(String(s).replace(' ', 'T'));
const limpia = (s) => String(s || '').replace(/\s*[|–—-]\s.*$/u, '').replace(/\s+/g, ' ').trim() || String(s || '');
const mismoDia = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const cuando = (d) => { const h = new Date(); if (mismoDia(d, h)) return hm(d); const ay = new Date(h); ay.setDate(h.getDate() - 1); return mismoDia(d, ay) ? 'ayer' : `${d.getDate()} ${MESC[d.getMonth()]}`; };
/* Estados de los agentes (mismos colores que el Mando de Agentes). Los de GEO sin apuntes desde el 5/11 los paró Daniel. */
const GEO_PARO = '2026-11-06';
const AST = { trabajando: ['var(--lime)', 'Trabajando'], error: ['var(--red)', 'Con fallo'], pausado: ['var(--violet-2)', 'En pausa'], espera: ['var(--cyan)', 'Atentos'],
  dormido: ['var(--muted-2)', 'Durmiendo'], apagado: ['var(--line-2)', 'Apagados'], parado: ['var(--amber)', 'Parados por ti'] };
const AORD = Object.keys(AST);
const estA = (a) => (a.dept === 'geo' && a.st !== 'trabajando' && !(a.ult && a.ult >= GEO_PARO) ? 'parado' : AST[a.st] ? a.st : 'espera');
/* Tipos de aviso → icono y color (Demos violeta, Respuestas cian, Solicitudes lima, Citas verde, Partners ámbar) */
const TIPO = {
  solicitud: ['doc', 'var(--lime)'], cita: ['calendar', 'var(--green)'], interesado: ['flame', 'var(--cyan)'], respuesta: ['chat', 'var(--cyan)'],
  demo: ['eye', 'var(--violet-2)'], growth: ['hand', 'var(--amber)'], ia: ['alert', 'var(--red)'], plazo: ['clock', 'var(--amber)'], sistema: ['alert', 'var(--red)'],
};
const GRUPOS = [['', 'Todo', '', 'var(--fg-strong)'], ['demo', 'Demos', 'eye', 'var(--violet-2)'], ['resp', 'Respuestas', 'chat', 'var(--cyan)'],
  ['sol', 'Solicitudes', 'doc', 'var(--lime)'], ['cita', 'Citas', 'calendar', 'var(--green)'], ['gp', 'Partners', 'hand', 'var(--amber)']];
const PAGINA = 8, LOTE = 50;

let G = null;
let primera = true;

async function load() {
  const r = await fetch(BASE + '?global=1', { credentials: 'same-origin', cache: 'no-store' });
  if (r.status === 401 || r.redirected) return;
  const j = await r.json();
  if (j.ok) G = j;
}

// El número sube desde cero solo la primera vez que se entra; luego se escribe sin más
function rueda(nodo, valor) {
  if (!nodo) return;
  nodo.textContent = N(valor);
  if (!primera || quieto || document.hidden || !valor) return;
  const t0 = performance.now(), dur = 900;
  const paso = (t) => {
    const k = Math.min(1, (t - t0) / dur);
    nodo.textContent = N(Math.round(valor * (1 - Math.pow(1 - k, 3))));
    if (k < 1) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
}

/* ---------- línea de arriba ---------- */
function citasHoy(ci) {
  const h = new Date();
  return ((ci && ci.lista) || []).map(utc).filter((d) => d > h && mismoDia(d, h));
}
function lineaResumen(S, ci) {
  const nodo = document.getElementById('pb-res-linea'); if (!nodo) return;
  const h = new Date(), t = S.te_toca || 0, hoy = citasHoy(ci);
  const fecha = `${DIAL[h.getDay()][0].toUpperCase()}${DIAL[h.getDay()].slice(1)} ${h.getDate()} de ${MES[h.getMonth()]}`;
  const a = t ? `<b>${N(t)} ${t === 1 ? 'empresa espera' : 'empresas esperan'}</b> respuesta` : 'Nadie espera respuesta';
  let b = '';
  if (hoy.length) b = `tienes <b>${hoy.length} ${hoy.length === 1 ? 'cita' : 'citas'}</b> hoy a las ${hm(hoy[0])}`;
  else if (ci && ci.siguiente) { const s = utc(ci.siguiente); b = `la próxima cita es el ${DIA[s.getDay()]} ${s.getDate()} a las ${hm(s)}`; }
  else b = 'no hay citas a la vista';
  nodo.innerHTML = `${esc(fecha)} · ${a} y ${b}`;
}

/* ---------- tarjetas ---------- */
function tarjetaTeToca(S) {
  const t = S.te_toca || 0, lista = (S.te_toca_lista || []).slice(0, 3), resto = S.resto || [];
  const mas = Math.max(0, t - lista.length);
  const filas = lista.map((x) => {
    const ts = x.ts || x.ultimo_at;
    return `<li><button type="button" data-conv="${esc(x.k)}">${P().cara(limpia(x.empresa), P().red(x.canal))}<span><b>${esc(limpia(x.empresa))}</b><small>${esc(x.resumen || (x.canal === 'email' ? 'Ha contestado por email' : 'Ha contestado por WhatsApp'))}</small></span>${ts ? `<time>${esc(cuando(local(ts)))}</time>` : ''}</button></li>`;
  }).join('');
  return `<article class="pgx-toca pbx-c pbg-n${t ? ' viva' : ''}" style="--n:0">
    <header class="pbx-ch"><h3>Te toca responder</h3><button type="button" class="pgx-mini" data-ir="conversaciones">${t ? `Abrir ${t === 1 ? 'la conversación' : 'las ' + N(t)} →` : 'Conversaciones →'}</button></header>
    <div class="pgx-toca-n"><b data-rueda="${t}">${N(t)}</b><span>${t ? (t === 1 ? 'ha contestado y espera que le escribas' : 'han contestado y esperan que les escribas') : 'Nadie espera respuesta: todo contestado'}</span></div>
    ${filas ? `<ul class="pgx-cola">${filas}</ul>` : ''}
    ${mas ? `<button type="button" class="pgx-rs-mas" data-ir="conversaciones">${resto.length ? P().caras(resto.map((r) => limpia(r.empresa)), Math.max(0, mas - resto.length)) : ''}<span>y ${N(mas)} más</span></button>` : ''}
  </article>`;
}
function tarjetaSolicitudes(sol, ci) {
  sol = sol || {}; ci = ci || {};
  const n = sol.mes || 0, sr = sol.sin_revisar || 0;
  let vari = '';
  if (sol.mes_ant != null && sol.mes_ant > 0) {
    const p = Math.round((n - sol.mes_ant) / sol.mes_ant * 100);
    vari = `<span class="pgx-var ${p > 0 ? 'up' : p < 0 ? 'down' : ''}">${p > 0 ? '+' : ''}${p} % vs 30 días antes</span>`;
  }
  const serie = sol.serie30 || sol.serie || [];
  const sig = ci.siguiente ? utc(ci.siguiente) : null;
  const sigTxt = sig ? (mismoDia(sig, new Date()) ? `Hoy · ${hm(sig)}` : `${DIA[sig.getDay()]} ${sig.getDate()} · ${hm(sig)}`) : '—';
  return `<article class="pgx-sol pbx-c pbg-n" style="--n:1">
    <header class="pbx-ch"><h3>Solicitudes · 30 días</h3>${sr ? `<button type="button" class="pbx-pill" style="--c:var(--amber)" data-ir="solicitudes">${N(sr)} sin revisar</button>` : '<span class="pbx-pill" style="--c:var(--green)">Al día</span>'}</header>
    <button type="button" class="pgx-sol-m" data-ir="solicitudes"><span class="pgx-kbig"><b data-rueda="${n}">${N(n)}</b>${vari}</span><span class="pgx-area">${P().area(serie, 'var(--lime)', 300, 84)}</span></button>
    <div class="pgx-pie">
      <button type="button" data-ir="citas"><small>Citas reservadas</small><b>${N(ci.proximas || 0)}</b></button>
      <button type="button" data-ir="citas"><small>Próxima</small><b>${esc(sigTxt)}</b></button>
      ${sol.clientes != null ? `<button type="button" data-ir="solicitudes"><small>Clientes</small><b>${N(sol.clientes)}</b></button>` : ''}
    </div>
  </article>`;
}
function tarjetaAgentes(A) {
  const orden = A.slice().sort((x, y) => AORD.indexOf(estA(x)) - AORD.indexOf(estA(y)));
  const tr = A.filter((a) => a.st === 'trabajando').length;
  const cuenta = {}; orden.forEach((a) => { const e = estA(a); cuenta[e] = (cuenta[e] || 0) + 1; });
  const err = A.filter((a) => estA(a) === 'error');
  const ley = AORD.filter((k) => cuenta[k]).map((k) => `<span><i class="pbx-dot r" style="--c:${AST[k][0]}"></i>${AST[k][1]}<b>${cuenta[k]}</b></span>`).join('');
  return `<article class="pgx-ag pbx-c pbg-n${err.length ? ' mal' : ''}" style="--n:2">
    <header class="pbx-ch"><h3>Agentes</h3><button type="button" class="pgx-mini" data-ir="agentes">Ver →</button></header>
    <button type="button" class="pgx-ag-w" data-ir="agentes"><span class="pgx-anillo">${P().anillo(orden.map((a) => AST[estA(a)][0]), `${tr}/${A.length}`, 'trabajando', 10)}</span><span class="pgx-estados">${ley}</span></button>
    ${err.length ? `<button type="button" class="pgx-aviso" data-ir="agentes">${P().ico('alert')}<span><b>${esc(err.map((a) => a.nombre).join(', '))}</b> ${err.length === 1 ? 'ha fallado' : 'han fallado'}</span></button>` : ''}
  </article>`;
}
function tarjetaCaja(C) {
  const res = C.ingresos - C.gastos, mx = Math.max(1, C.ingresos, C.gastos);
  const meses = (C.meses || []).filter((m) => m && m.m);
  let mini = '';
  if (meses.length > 1 && meses.some((m) => m.v)) {
    const top = Math.max(1, ...meses.map((m) => Math.abs(m.v)));
    mini = `<div class="pgx-meses" aria-label="Resultado de los últimos meses">${meses.map((m, i) => `<span class="${i === meses.length - 1 ? 'on' : ''}${m.v < 0 ? ' neg' : ''}" title="${esc(MES[m.m - 1])}: ${esc(euros(m.v))}"><i style="height:${Math.max(4, Math.abs(m.v) / top * 46).toFixed(0)}px"></i>${esc(MESC[m.m - 1])}</span>`).join('')}</div>`;
  }
  return `<article class="pgx-caja pbx-c pbg-n${res < 0 ? ' mal' : ''}" style="--n:3">
    <button type="button" class="pgx-caja-h" data-ir="caja"><span class="pgx-caja-t">Caja de ${esc(MES[(C.mes || 1) - 1])}</span><span class="pbx-num pgx-caja-n">${res > 0 ? '+' : ''}${esc(euros(res))}</span><small>Resultado del mes</small></button>
    <div class="pgx-io">
      <div><span>Entra</span><span class="pbx-bar" style="--c:var(--lime)"><i style="--w:${(C.ingresos / mx * 100).toFixed(1)}%"></i></span><b>${esc(euros(C.ingresos))}</b></div>
      <div><span>Sale</span><span class="pbx-bar" style="--c:var(--red)"><i style="--w:${(C.gastos / mx * 100).toFixed(1)}%"></i></span><b>${esc(euros(C.gastos))}</b></div>
    </div>
    ${mini}
  </article>`;
}

/* ---------- actividad con historial ---------- */
// todos: lo cargado (de 50 en 50); ver: cuántas filas se enseñan. La tira de hoy usa todo lo cargado.
const Act = { grupo: '', todos: [], ver: PAGINA, mas: false, cargando: false, firma: '' };
try { Act.grupo = localStorage.getItem('pebai-res-act') || ''; } catch (e) { /* sin almacenamiento */ }
if (!GRUPOS.some(([k]) => k === Act.grupo)) Act.grupo = '';
const nodos = {};
function etiquetaDia(d) {
  const h = new Date(); h.setHours(0, 0, 0, 0);
  const x = new Date(d); x.setHours(0, 0, 0, 0);
  const dias = Math.round((h - x) / 864e5);
  if (dias === 0) return 'Hoy';
  if (dias === 1) return 'Ayer';
  return `${DIA[d.getDay()]} ${d.getDate()} ${MESC[d.getMonth()]}` + (d.getFullYear() !== h.getFullYear() ? ' ' + d.getFullYear() : '');
}
function irAviso(a) {
  const [t, x, y] = String(a.ir || '').split(':');
  if (t === 'lead') document.dispatchEvent(new CustomEvent('pb:abrir-lead', { detail: Number(x) }));
  else if (t === 'conv') abreConv(x + ':' + y);
  else if (t === 'pagina') ir(x);
}
function pintaDia() {
  const h = new Date(), ahora = (h.getHours() + h.getMinutes() / 60) / 24 * 100;
  const hoy = Act.todos.filter((a) => mismoDia(local(a.ts), h));
  nodos.diaN.textContent = hoy.length ? `${hoy.length} ${hoy.length === 1 ? 'aviso' : 'avisos'}` : 'Nada todavía';
  nodos.dia.innerHTML = hoy.map((a) => {
    const d = local(a.ts), [, c] = TIPO[a.tipo] || ['', 'var(--muted)'];
    return `<i style="left:${((d.getHours() + d.getMinutes() / 60) / 24 * 100).toFixed(2)}%;--c:${c}" title="${esc(hm(d) + ' · ' + a.titulo)}"></i>`;
  }).join('') + `<span class="ahora" style="left:${ahora.toFixed(2)}%"></span>`;
}
function pintaActividad() {
  pintaDia();
  const filas = Act.todos.slice(0, Act.ver);
  if (!filas.length) { nodos.lista.innerHTML = '<p class="pbx-vacio">Todavía no hay nada de este tipo.</p>'; }
  else {
    let ult = '', html = '';
    filas.forEach((a, i) => {
      const d = local(a.ts), et = etiquetaDia(d);
      if (et !== ult) { html += `<div class="pgx-act-d">${esc(et)}</div>`; ult = et; }
      const [ic, c] = TIPO[a.tipo] || ['info', 'var(--muted)'];
      html += `<button type="button" class="pgx-fila" data-i="${i}"><span class="pbx-ico sm" style="--c:${c}">${P().ico(ic)}</span><span class="txt"><b>${esc(a.titulo)}</b>${a.texto ? `<small>${esc(a.texto)}</small>` : ''}</span><time>${hm(d)}</time></button>`;
    });
    nodos.lista.innerHTML = html;
  }
  nodos.mas.hidden = !(Act.ver < Act.todos.length || Act.mas);
  nodos.mas.textContent = Act.ver > PAGINA ? 'Ver más' : 'Ver el historial completo';
}
async function cargaActividad(modo) {
  // modo: 'nuevo' (filtro cambiado o primera vez), 'mas' (siguiente tanda) o 'refresco' (cada minuto, sin mover lo que se está leyendo)
  if (Act.cargando) return;
  if (modo === 'mas' && Act.ver + 20 <= Act.todos.length) { Act.ver += 20; pintaActividad(); return; }
  if (modo === 'refresco' && Act.ver > PAGINA) return;   // está leyendo el historial: no se le mueve
  const antes = modo === 'mas' && Act.todos.length ? Act.todos[Act.todos.length - 1].id : 0;
  if (modo === 'mas' && !Act.mas) { Act.ver = Act.todos.length; pintaActividad(); return; }
  Act.cargando = true;
  if (nodos.mas) nodos.mas.disabled = true;
  try {
    const r = await fetch(`${BASE}?avisos_hist=1&n=${LOTE}&tipo=${encodeURIComponent(Act.grupo)}&antes=${antes}`, { credentials: 'same-origin', cache: 'no-store' });
    const j = await r.json();
    if (!j.ok) return;
    if (modo === 'mas') { Act.todos = Act.todos.concat(j.avisos); Act.mas = j.mas; Act.ver += 20; pintaActividad(); return; }
    const firma = JSON.stringify([Act.grupo, j.avisos.map((a) => a.id)]);
    if (modo === 'refresco' && firma === Act.firma) { pintaDia(); return; }
    Act.firma = firma; Act.todos = j.avisos; Act.mas = j.mas; if (modo !== 'refresco') Act.ver = PAGINA;
    pintaActividad();
  } catch (e) { /* lo reintenta al siguiente refresco */ } finally {
    Act.cargando = false;
    if (nodos.mas) nodos.mas.disabled = false;
  }
}
function tarjetaActividad() {
  const c = document.createElement('article'); c.className = 'pgx-act pbx-c pbg-n'; c.style.setProperty('--n', 4);
  c.innerHTML = `<header class="pbx-ch"><h3>Actividad</h3><div class="pbx-chips una pgx-chips" role="group" aria-label="Filtrar actividad">${GRUPOS.map(([k, t, i, col]) =>
    `<button type="button" class="pbx-chip${k === Act.grupo ? ' on' : ''}" data-g="${k}" aria-pressed="${k === Act.grupo}" style="--c:${col}">${i ? P().ico(i) : ''}${t}</button>`).join('')}</div></header>
    <div class="pgx-dia-t"><span>Hoy, hora a hora</span><em></em></div>
    <div class="pgx-dia"></div>
    <div class="pgx-dia-l"><span>0 h</span><span>6 h</span><span>12 h</span><span>18 h</span><span>24 h</span></div>
    <div class="pgx-filas"></div>
    <div class="pgx-centro"><button type="button" class="pbx-btn ghost sm pgx-vermas" hidden>Ver el historial completo</button></div>`;
  nodos.dia = c.querySelector('.pgx-dia'); nodos.diaN = c.querySelector('.pgx-dia-t em');
  nodos.lista = c.querySelector('.pgx-filas'); nodos.mas = c.querySelector('.pgx-vermas');
  nodos.mas.onclick = () => cargaActividad('mas');
  c.querySelector('.pgx-chips').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-g]'); if (!b || b.dataset.g === Act.grupo) return;
    Act.grupo = b.dataset.g; try { localStorage.setItem('pebai-res-act', Act.grupo); } catch (er) { /* nada */ }
    c.querySelectorAll('.pgx-chips button').forEach((x) => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
    cargaActividad('nuevo');
  });
  nodos.lista.addEventListener('click', (e) => { const f = e.target.closest('.pgx-fila'); if (f) irAviso(Act.todos[+f.dataset.i]); });
  return c;
}

/* ---------- dibujo ---------- */
let firmaRes = '';
box.addEventListener('click', (e) => {
  const b = e.target.closest('[data-ir],[data-conv]'); if (!b || !box.contains(b)) return;
  if (b.dataset.conv) abreConv(b.dataset.conv); else ir(b.dataset.ir);
});
function draw() {
  if (!G || document.body.dataset.page !== 'resumen' || !P()) return;
  const hr = new Date().getHours(), sal = document.getElementById('pb-saludo');
  if (sal) sal.textContent = hr < 6 ? 'Buenas noches' : hr < 14 ? 'Buenos días' : hr < 21 ? 'Buenas tardes' : 'Buenas noches';
  const Sx = G.secciones || {}, S = G.salida || {}, C = G.caja, A = (G.agentes || []).filter((a) => a.dept !== 'embudo');
  lineaResumen(S, Sx.citas);
  // si nada ha cambiado desde la última vez, no se toca (así no parpadea cada minuto)
  const firma = JSON.stringify([Sx.solicitudes, Sx.citas, S, C, A.map((a) => [a.st, a.ult, a.nombre])]);
  let rej = box.querySelector('.pgx');
  if (!rej) {
    rej = document.createElement('div'); rej.className = 'pgx';
    box.append(rej, tarjetaActividad());
    cargaActividad('nuevo');
  }
  if (firma === firmaRes && rej.firstChild) return;
  firmaRes = firma;
  rej.innerHTML = tarjetaTeToca(S) + tarjetaSolicitudes(Sx.solicitudes, Sx.citas) + (A.length ? tarjetaAgentes(A) : '') + (C ? tarjetaCaja(C) : '');
  rej.classList.toggle('sin-ag', !A.length);
  rej.querySelectorAll('[data-rueda]').forEach((n) => rueda(n, +n.dataset.rueda));
  primera = false;
}

const refrescar = () => load().then(draw).catch(() => {});
document.addEventListener('pb:page', (e) => { if (e.detail === 'resumen') { refrescar(); if (nodos.lista) cargaActividad('refresco'); } });
setInterval(() => { if (!document.hidden && document.body.dataset.page === 'resumen') { refrescar(); cargaActividad('refresco'); } }, 60000);
refrescar();
})();
