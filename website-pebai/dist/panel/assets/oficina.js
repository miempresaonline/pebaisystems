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
const S = { csrf: app.dataset.csrf, agentes: [], autos: [], hist: [], verTodo: false };
const ST = {
  trabajando: ['#3DDC84', 'Trabajando'], espera: ['#FFB547', 'En espera'], dormido: ['#8E91A8', 'Durmiendo'],
  error: ['#FF5E6C', 'Con error'], apagado: ['#5C5F73', 'Apagado'], pausado: ['#8E84FF', 'En pausa'],
};
/* Departamentos de la oficina, en orden. Para añadir uno basta con ponerlo aquí (y sus agentes en el servidor). */
const DEPTS = [
  { id: 'captacion', nombre: 'Captación', color: '#B7FF3C', glifo: 'iman', activo: true, objetivo: 'Encontrar empresas y abrir conversación con ellas' },
  { id: 'geo', nombre: 'Visibilidad en IA', color: '#FFB547', glifo: 'lupa', activo: true, objetivo: 'Que ChatGPT, Gemini y Google recomienden a PEBAI' },
  { id: 'embudo', nombre: 'Embudo', color: '#8E84FF', glifo: 'embudo', activo: false, objetivo: 'Llevar cada solicitud hasta la sesión técnica' },
  { id: 'redes', nombre: 'Redes', color: '#E25CFF', glifo: 'red', activo: false, objetivo: 'Publicar contenido que traiga solicitudes' },
  { id: 'operaciones', nombre: 'Operaciones', color: '#3FD5FF', glifo: 'caja', activo: false, objetivo: 'Proyectos y entregas a clientes' },
];
const FONDO = { cerebro: '#5b4fd6', geo: '#a8641a', scraper: '#1a7f45', redactor: '#D97757', whatsapp: '#1fae58', email: '#c5372b', fases: '#4b40c9', recordatorios: '#4b40c9', calcom: '#4b40c9' };
const GLIFOS = {
  iman: 'M6 3v8a6 6 0 0 0 12 0V3M6 7.5h4M14 7.5h4', embudo: 'M3 4h18l-7 8.5V19l-4 2v-8.5z',
  red: 'M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4',
  caja: 'M21 8 12 3 3 8v8l9 5 9-5zM3 8l9 5 9-5M12 13v8', lupa: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  flow: 'M3 3h7v7H3zM14 14h7v7h-7zM10 6.5h3.5a3 3 0 0 1 3 3V14', bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0', cal: 'M3 5h18v16H3zM16 3v4M8 3v4M3 10h18' };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
/* Iconos rellenos (24×24) para los agentes que no son una marca: se ven en su ficha y como logo 3D encima de su mesa */
const PROPIOS = {
  cerebro: 'M9.5 3A3.5 3.5 0 0 0 6 6.3 3.3 3.3 0 0 0 3.5 9.5c0 .9.3 1.7.9 2.3A3.4 3.4 0 0 0 3.5 14c0 1.4.8 2.6 2 3.1A3.5 3.5 0 0 0 9 21h2V3zm1 3.2V19.8M14.5 3h-1.5v18h2a3.5 3.5 0 0 0 3.5-3.9 3.4 3.4 0 0 0 2-3.1c0-.8-.3-1.6-.9-2.2.6-.6.9-1.4.9-2.3A3.3 3.3 0 0 0 18 6.3 3.5 3.5 0 0 0 14.5 3z',   // cerebro (dos hemisferios): Cerebro
  redactor: 'm4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z',   // Claude (Simple Icons, CC0): el Redactor escribe con Claude
  geo_jefe: 'M3 18h18v2H3zM3 7l4.5 4L12 4l4.5 7L21 7v9H3z',                                                  // corona: reparte y revisa
  geo_vigia: 'M12 5C6.5 5 2.7 8.6 1 12c1.7 3.4 5.5 7 11 7s9.3-3.6 11-7c-1.7-3.4-5.5-7-11-7zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8z',   // ojo: vigila novedades
  geo_contenido: 'M3 17.25V21h3.75L17.8 9.94l-3.75-3.75L3 17.25zM20.7 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75z',   // lápiz: escribe páginas
  geo_refresco: 'M17.65 6.35A7.96 7.96 0 0 0 12 4a8 8 0 1 0 7.73 10h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4z',   // flechas: actualiza
  geo_local: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z',   // chincheta: ficha de Google
  geo_redes: 'M4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v4h2v-4h1l5 3V6L8 9zm14 2v2h4v-2zm-2 6.61 3.2 2.39 1.2-1.6-3.2-2.4zM20.4 5.6 19.2 4 16 6.4l1.2 1.6z',   // megáfono: publica
  geo_medicion: 'M4 10h3.4v10H4zm6.3-6h3.4v16h-3.4zm6.3 9H20v7h-3.4z',                                          // barras: mide
  geo_tecnico: 'M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1 0-1.4z',   // llave: técnico
  geo_preguntas: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 17h-2v-2h2zm2.07-7.75-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26A1.99 1.99 0 0 0 12 7a2 2 0 0 0-2 2H8a4 4 0 1 1 8 0c0 .88-.36 1.68-.93 2.25z',   // interrogación: preguntas
  pinterest: 'M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026z',
};
const brand = (k) => (window.PB_ICONS && window.PB_ICONS.brands && window.PB_ICONS.brands[k]) ? window.PB_ICONS.brands[k].d : (PROPIOS[k] || null);
const N = (n) => new Intl.NumberFormat('es-ES').format(n || 0);
const hora = (ts) => String(ts || '').slice(11, 16);
const toast = (m, err) => { const t = $('#pb-toast'); if (!t) return; $('span', t).textContent = m; t.classList.toggle('err', !!err); t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 3200); };
/* color de cada estado en la mesa (alfombrilla, tira, foco, línea del suelo, ojos): siempre el mismo significado */
const COL_EST = { trabajando: '#3DDC84', espera: '#FFB547', dormido: '#5C5F73', error: '#FF5E6C', apagado: '#2A2D3E' };
const vis = (st) => st === 'pausado' ? 'dormido' : st;
const enPagina = () => document.body.dataset.page === PAGE && !document.body.classList.contains('pb-ag-ajustes');

/* ============ datos ============ */
async function cargar() {
  const r = await fetch(BASE + '?oficina=1', { credentials: 'same-origin', cache: 'no-store' });
  if (r.status === 401) { location.reload(); return false; }
  let j; try { j = await r.json(); } catch (e) { throw new Error('La oficina no ha respondido bien.'); }
  if (!j.ok) throw new Error(j.error || 'No se ha podido cargar la oficina.');
  /* en la oficina solo salen los bots de verdad (los de los departamentos con agentes) */
  j.agentes.forEach((a) => { if (!a.icono && PROPIOS[a.id]) { a.icono = a.id; FONDO[a.id] = FONDO[a.id] || FONDO.geo; } });
  S.agentes = j.agentes.filter((a) => DEPTS.some((d) => d.activo && d.id === a.dept)); S.autos = j.agentes.filter((a) => a.dept === 'embudo'); S.csrf = j.csrf; S.parada = j.parada || null; S.cargado = Date.now(); return true;
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
// Avisos quitados a mano en este navegador: «agente|texto». Si el texto cambia, vuelve a salir.
let ocultos = new Set(); try { ocultos = new Set(JSON.parse(localStorage.getItem('pb-of-ocultos') || '[]')); } catch (e) { /* sin almacenamiento */ }
const claveAviso = (a, txt) => a.id + '|' + txt;
const pendientes = () => {
  const out = [];
  S.agentes.filter((a) => a.st === 'error').forEach((a) => out.push({ a, txt: a.motivo, err: true }));
  S.agentes.forEach((a) => (a.necesita || []).forEach((n) => out.push({ a, txt: n, err: false })));
  return out.filter((x) => !ocultos.has(claveAviso(x.a, x.txt)));
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
/* Próximo turno: de los horarios de cada agente («L-V 9:30 y 14:30», «Cada día 8:00…»), el primero que empieza */
function proximoTurno() {
  const ahora = new Date(), dia = ahora.getDay(), finde = dia === 0 || dia === 6;
  let mejor = null;
  S.agentes.forEach((a) => {
    if (a.st === 'trabajando' || !a.proxima) return;
    const txt = String(a.proxima);
    // fin de semana: solo los de «Cada día» o los que dicen sábado/domingo
    if (finde && /L-V/.test(txt) && !/S-D|s[áa]bado|domingo/i.test(txt)) return;
    // «cada 2 h de 8:00 a 20:00» → 8:00, 10:00, … 20:00
    const cada = /cada (\d+) ?h de (\d{1,2}):(\d{2}) a (\d{1,2}):(\d{2})/.exec(txt), horas = [];
    if (cada) for (let h = +cada[2]; h <= +cada[4]; h += +cada[1]) horas.push(h + ':' + cada[3]);
    (cada ? horas : (txt.match(/\b(\d{1,2}):(\d{2})\b/g) || [])).forEach((hm) => {
      const [h, m] = hm.split(':').map(Number); const t = new Date(ahora); t.setHours(h, m, 0, 0);
      if (t > ahora && (!mejor || t < mejor.t)) mejor = { t, a };
    });
  });
  return mejor;
}
function pintaHud() {
  const pend = pendientes(), err = pend.filter((p) => p.err).length;
  const abierto = !!hud.querySelector('.pb-of-todo.abierto');
  hud.replaceChildren();
  const c = document.createElement('div'); c.className = 'pb-of-todo' + (pend.length ? '' : ' ok') + (abierto && pend.length ? ' abierto' : '');
  const col = err ? '#FF5E6C' : pend.length ? '#FFB547' : '#3DDC84';
  c.innerHTML = `<button type="button" class="h"><i class="vivo"></i><span class="dir">En directo</span><span class="sep"></span><span class="est" style="--c:${col}"><i></i>${pend.length ? (pend.length === 1 ? '1 aviso' : pend.length + ' avisos') : 'Todo en orden'}</span>${(() => { const p = proximoTurno(); if (!p) return ''; const min = Math.max(1, Math.round((p.t - new Date()) / 6e4)); return `<span class="sep"></span><span class="prox" title="Próximo turno de trabajo">${esc(p.a.nombre)} · ${String(p.t.getHours()).padStart(2, '0')}:${String(p.t.getMinutes()).padStart(2, '0')} <em>${min < 60 ? 'en ' + min + ' min' : 'en ' + Math.round(min / 60) + ' h'}</em></span>`; })()}${pend.length ? '<svg class="pl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>' : ''}</button><div class="lista"></div>`;
  const lst = c.querySelector('.lista');
  if (pend.length) c.querySelector('.h').onclick = (ev) => { ev.stopPropagation(); c.classList.toggle('abierto'); };
  pend.slice(0, 5).forEach(({ a, txt, err: e }) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'it' + (e ? ' err' : '');
    b.innerHTML = tileHtml(a, 't') + `<span class="x"><b>${esc(a.nombre)}</b><span>${esc(txt)}</span></span><svg class="go" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m9 6 6 6-6 6"/></svg>`;
    b.onclick = (ev) => { ev.stopPropagation(); c.classList.remove('abierto'); abrirAgente(a.id); };
    const q = document.createElement('span'); q.className = 'quita'; q.title = 'Quitar este aviso (vuelve si cambia)'; q.setAttribute('role', 'button'); q.textContent = '×';
    q.onclick = (ev) => {
      ev.stopPropagation(); ocultos.add(claveAviso(a, txt));
      try { localStorage.setItem('pb-of-ocultos', JSON.stringify([...ocultos].slice(-200))); } catch (e2) { /* nada */ }
      pintaHud(); if (G) G.refrescarEscena(); const h = hud.querySelector('.pb-of-todo'); if (h && pendientes().length) h.classList.add('abierto');
    };
    b.append(q); lst.append(b);
  });
  hud.append(c, botonParar(), botonVista(), botonRepe()); horaHud();
  if (lista) pintaLista();
}
/* Vista Lista: lo mismo que la oficina, en filas (rápida de revisar; en el móvil es la de entrada y no se carga el 3D) */
let lista = (() => { try { const v = localStorage.getItem('pb-of-vista'); if (v) return v === 'lista'; } catch (e) { /* sin almacenamiento */ } return matchMedia('(max-width: 760px)').matches; })();
const listaBox = document.createElement('div'); listaBox.className = 'pb-of-lista'; wrap.append(listaBox);
/* ---------- «Repetir el día»: la oficina reproduce hoy en ~40 s con un reloj que corre ----------
   Turnos sacados del historial real de cada agente (Empieza…Termina; si no, un rato alrededor de cada cosa que hizo)
   y los traspasos en su hora. Al acabar (o con ×) todo vuelve al estado de ahora. */
const REPE_SEG = 40;
const velAnim = () => (repe ? (repe.pausa ? 0 : repe.vel) : 1);   // ritmo de las animaciones: el de la repetición
let repe = null;
const tsMs = (t) => new Date(String(t).replace(' ', 'T')).getTime();
function turnosDeHoy(a) {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const ev = (a.actividad || []).filter((e) => tsMs(e.ts) >= hoy.getTime()).sort((x, y) => tsMs(x.ts) - tsMs(y.ts));
  const out = []; let ini = null;
  ev.forEach((e) => {
    const t = tsMs(e.ts);
    if (/^Empieza/u.test(e.txt)) ini = t;
    else if (/^Termina/u.test(e.txt) && ini != null) { out.push([ini, Math.max(t, ini + 60e3)]); ini = null; }
    else if (ini == null && e.tipo !== 'espera') out.push([t - 90e3, t + 90e3]);
  });
  if (ini != null) out.push([ini, Date.now()]);
  // Cada turno dura al menos 10 min en la repetición (si no, uno de 1 minuto sería un parpadeo)
  // y los ratos separados por menos de 40 min se juntan (WhatsApp o el scraper trabajan seguido)
  const ord = out.map(([x, y]) => [x, Math.max(y, x + 6e5)]).sort((p, q) => p[0] - q[0]), junta = [];
  ord.forEach((r) => { const u = junta[junta.length - 1]; if (u && r[0] - u[1] < 24e5) u[1] = Math.max(u[1], r[1]); else junta.push(r); });
  return junta;
}
/* Franja de hoy para la ficha flotante: de 7:00 a 21:00, en verde los ratos que trabajó y una raya en la hora de ahora */
function franjaDia(a) {
  const d0 = new Date(); d0.setHours(7, 0, 0, 0); const ini = d0.getTime(), fin = ini + 14 * 36e5, pos = (t) => Math.max(0, Math.min(100, (t - ini) / (fin - ini) * 100));
  const tr = turnosDeHoy(a).filter(([x, y]) => y > ini && x < fin);
  const segs = tr.map(([x, y]) => `<i style="left:${pos(x).toFixed(1)}%;width:${Math.max(1.2, pos(y) - pos(x)).toFixed(1)}%"></i>`).join('');
  return `<div class="dia"><div class="b">${segs}<u style="left:${pos(Date.now()).toFixed(1)}%"></u></div><div class="h"><span>7:00</span><span>${tr.length ? tr.length + (tr.length === 1 ? ' rato trabajando hoy' : ' ratos trabajando hoy') : a.st === 'espera' ? 'Atento todo el día' : 'Hoy aún no ha trabajado'}</span><span>21:00</span></div></div>`;
}
function botonRepe() {
  const b = document.createElement('button'); b.type = 'button'; b.className = 'pb-of-repe' + (repe ? ' on' : '');
  b.innerHTML = repe ? '<svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/></svg><span>Parar</span>' : '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg><span>Repetir el día</span>';
  b.title = 'Ver en 40 segundos todo lo que ha pasado hoy en la oficina';
  b.onclick = (e) => { e.stopPropagation(); if (repe) paraRepe(); else empiezaRepe(); };
  return b;
}
function empiezaRepe() {
  if (!G || lista) { if (lista) ponVista(false); setTimeout(() => G && empiezaRepe(), 900); return; }
  cerrar();
  const reales = new Map(S.agentes.map((a) => [a.id, a.st]));
  const turnos = new Map(S.agentes.map((a) => [a.id, turnosDeHoy(a)]));
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const primero = Math.min(...[...turnos.values()].flat().map((x) => x[0]), Date.now() - 36e5);
  const t0 = Math.max(hoy.getTime() + 7 * 36e5, primero - 15 * 6e4), t1 = Date.now();
  const tras = G.traspasos().filter((x) => tsMs(x.ts) >= t0).sort((x, y) => tsMs(x.ts) - tsMs(y.ts));
  // Línea del tiempo: una marca por cada traspaso (del color de la sala de quien entrega); se puede pinchar o arrastrar para saltar
  const reloj = document.createElement('div'); reloj.className = 'pb-of-reloj';
  const marcas = tras.map((x) => { const a = ag(x.de), c = (DEPTS.find((d) => a && d.id === a.dept) || {}).color || '#8E84FF';
    const b = ag(x.a), h = String(x.ts).slice(11, 16);
    return `<em style="left:${((tsMs(x.ts) - t0) / Math.max(1, t1 - t0) * 100).toFixed(2)}%;--c:${c}" title="${esc(h + ' · ' + (a ? a.nombre : '') + ' → ' + (b ? b.nombre : '') + ': ' + x.txt)}"></em>`; }).join('');
  reloj.innerHTML = `<b>--:--</b><span class="ln" role="slider" aria-label="Hora del día" tabindex="0"><span class="pista"><i></i>${marcas}</span><span class="bola"></span></span>`
    + '<button type="button" class="pp" aria-label="Pausa" title="Pausa (espacio)"><svg viewBox="0 0 24 24"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor"/></svg></button>'
    + '<button type="button" class="vel" title="Velocidad">×1</button><button type="button" class="sig on" title="La cámara va a la sala donde pasa algo">Seguir</button><button type="button" class="x" aria-label="Parar">×</button>';
  reloj.querySelector('.x').onclick = (e) => { e.stopPropagation(); paraRepe(); };
  reloj.querySelector('.pp').onclick = (e) => { e.stopPropagation(); pausaRepe(); };
  reloj.querySelector('.sig').onclick = (e) => { e.stopPropagation(); repe.sigue = !repe.sigue; e.currentTarget.classList.toggle('on', repe.sigue); if (!repe.sigue && G) cerrar(); };
  reloj.querySelector('.vel').onclick = (e) => { e.stopPropagation(); repe.vel = repe.vel === 1 ? 2 : repe.vel === 2 ? 4 : 1; e.currentTarget.textContent = '×' + repe.vel; };
  const ln = reloj.querySelector('.ln');
  const salta = (ev) => { const r = ln.getBoundingClientRect(); const m = ev.target.closest && ev.target.closest('em'); repeIr(Math.max(0, Math.min(1, m ? parseFloat(m.style.left) / 100 - .002 : (ev.clientX - r.left) / r.width))); };
  ln.addEventListener('pointerdown', (ev) => { ev.stopPropagation(); ln.setPointerCapture(ev.pointerId); repe.arrastra = true; salta(ev); });
  ln.addEventListener('pointermove', (ev) => { if (repe && repe.arrastra) salta(ev); });
  ln.addEventListener('pointerup', () => { if (repe) repe.arrastra = false; });
  ln.addEventListener('keydown', (ev) => { if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') { ev.preventDefault(); ev.stopPropagation(); repeIr(Math.max(0, Math.min(1, repe.f + (ev.key === 'ArrowRight' ? .05 : -.05)))); } });
  reloj.addEventListener('click', (e) => e.stopPropagation());
  wrap.append(reloj); wrap.classList.add('repe');
  repe = { reales, turnos, t0, t1, tras, k: 0, reloj, f: 0, vel: 1, prev: performance.now(), clave: '', pausa: false, sigue: true, salaVista: '', cuando: 0 };
  pintaHud(); requestAnimationFrame(pasoRepe);
}
function pausaRepe() {
  if (!repe) return; repe.pausa = !repe.pausa;
  const b = repe.reloj.querySelector('.pp');
  b.innerHTML = repe.pausa ? '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor"/></svg>';
  b.setAttribute('aria-label', repe.pausa ? 'Seguir' : 'Pausa');
}
// La cámara se acerca a la sala donde ocurre algo (sin abrir el panel lateral); si la mueves tú, deja de seguir
function sigueSala(id) {
  if (!repe || !repe.sigue || !G || G.esLibre() || id === repe.salaVista || performance.now() - repe.cuando < 3500) return;
  const s = G.salas.get(id); if (!s) return;
  repe.salaVista = id; repe.cuando = performance.now(); foco = { sigue: id };
  const f = Math.max(1, s.W / 8.6), c = s.g.position.clone();
  G.volar(c.clone().add(new G.THREE.Vector3(0, 9.5 * f, 12 * f)), c.clone().add(new G.THREE.Vector3(0, .9, -.6)));
}
// Saltar a otro momento: los traspasos de antes de esa hora ya no se lanzan; los de después, sí
function repeIr(f) {
  if (!repe) return;
  if (G && Math.abs(f - repe.f) > .01) G.limpiaAnim();   // al saltar, nada a medio camino
  repe.f = f; const t = repe.t0 + (repe.t1 - repe.t0) * f;
  repe.k = repe.tras.findIndex((x) => tsMs(x.ts) > t); if (repe.k < 0) repe.k = repe.tras.length;
  repe.fin = false;
}
function pasoRepe(now) {
  if (!repe) return;
  const dtR = Math.min(.25, (now - repe.prev) / 1000); repe.prev = now;
  if (!repe.arrastra && !repe.pausa) repe.f = Math.min(1, repe.f + dtR * repe.vel / REPE_SEG);
  const f = repe.f, t = repe.t0 + (repe.t1 - repe.t0) * f;
  const d = new Date(t); repe.reloj.querySelector('b').textContent = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  repe.reloj.querySelector('.ln .pista i').style.width = (f * 100) + '%'; repe.reloj.querySelector('.ln .bola').style.left = (f * 100) + '%';
  // estado de cada agente a esa hora (pausados, apagados o con error se quedan como están)
  let clave = '';
  S.agentes.forEach((a) => {
    const real = repe.reales.get(a.id);
    if (['pausado', 'apagado', 'error'].includes(real) || a.dept === 'embudo') return;
    a.st = (repe.turnos.get(a.id) || []).some(([x, y]) => t >= x && t <= y) ? 'trabajando' : 'dormido';
    clave += a.st[0];
  });
  if (clave !== repe.clave) { repe.clave = clave; G.refrescarEscena(true); }
  while (repe.k < repe.tras.length && tsMs(repe.tras[repe.k].ts) <= t) {
    const x = repe.tras[repe.k++]; const a = ag(x.de);
    if (a && a.st === 'trabajando') { sigueSala(a.dept); G.lanzaEnvio(x); }
  }
  if (repe.sigue && foco && foco.sigue && performance.now() - repe.cuando > 7000) { repe.salaVista = ''; cerrar(); }
  // al llegar a ahora se queda quieta un momento y termina (si no la han movido hacia atrás mientras tanto)
  if (f >= 1 && !repe.fin) { repe.fin = true; setTimeout(() => { if (repe && repe.fin && repe.f >= 1) paraRepe(); }, 1800); }
  requestAnimationFrame(pasoRepe);
}
function paraRepe() {
  if (!repe) return;
  S.agentes.forEach((a) => { if (repe.reales.has(a.id)) a.st = repe.reales.get(a.id); });
  const seguia = foco && foco.sigue;
  if (G) G.limpiaAnim();
  // resumen del día al terminar sola (no al pararla a mano)
  if (repe.f >= 1 && repe.tras.length) toast(`Hoy: ${repe.tras.length} ${repe.tras.length === 1 ? 'traspaso' : 'traspasos'} entre agentes`);
  repe.reloj.remove(); wrap.classList.remove('repe'); repe = null;
  if (seguia) cerrar();
  if (G) G.refrescarEscena(true); pintaHud();
}
function botonVista() {
  const b = document.createElement('div'); b.className = 'pb-of-vista';
  b.innerHTML = `<button type="button" data-v="3d" class="${lista ? '' : 'on'}">3D</button><button type="button" data-v="lista" class="${lista ? 'on' : ''}">Lista</button>`;
  b.querySelectorAll('button').forEach((x) => { x.onclick = (e) => { e.stopPropagation(); ponVista(x.dataset.v === 'lista'); }; });
  return b;
}
function ponVista(on) {
  lista = on; try { localStorage.setItem('pb-of-vista', on ? 'lista' : '3d'); } catch (e) { /* nada */ }
  wrap.classList.toggle('lista', on); pintaHud();
  if (!on && !G) montar().catch((e) => toast(e.message || 'No se ha podido cargar la oficina.', true));
}
function pintaLista() {
  const ORDEN_ST = { trabajando: 0, error: 1, espera: 2, pausado: 3, dormido: 4, apagado: 5 };
  const filas = DEPTS.map((d) => {
    const ags = agsDe(d.id).slice().sort((x, y) => (ORDEN_ST[x.st] ?? 9) - (ORDEN_ST[y.st] ?? 9));
    if (!d.activo || !ags.length) return '';
    const tr = ags.filter((a) => a.st === 'trabajando').length;
    return `<section><header><i style="background:${d.color}"></i><b>${esc(d.nombre)}</b><span>${tr} de ${ags.length} trabajando</span></header>`
      + ags.map((a) => {
        const [c, t] = ST[a.st] || ST.espera;
        const pc = a.st === 'trabajando' && a.cupo ? Math.min(100, Math.round(a.hoy / a.cupo * 100)) : null;
        const nec = (a.necesita || [])[0];
        return `<button type="button" class="fila" data-id="${esc(a.id)}">${tileHtml(a, 't')}<span class="nm"><b>${esc(a.nombre)}</b><small>${esc(nec || a.motivo || a.rol || '')}</small>${franjaDia(a)}</span>`
          + `<span class="st" style="--c:${c}"><i></i>${esc(t)}${pc != null ? ` · ${pc}%` : ''}</span></button>`;
      }).join('') + '</section>';
  }).join('');
  const vacias = DEPTS.filter((d) => !d.activo || !agsDe(d.id).length).map((d) => esc(d.nombre));
  listaBox.innerHTML = filas + (vacias.length ? `<p class="vacias">Sin agentes aún: ${vacias.join(' · ')}</p>` : '');
  listaBox.querySelectorAll('.fila').forEach((f) => { f.onclick = (e) => { e.stopPropagation(); abrirAgente(f.dataset.id); }; });
}
wrap.classList.toggle('lista', lista);
/* Interruptor general: pausa a la vez a los agentes que escriben a otras empresas (WhatsApp y email).
   «Reanudar todo» solo vuelve a poner en marcha los que estaban funcionando al pararlo. */
function botonParar() {
  const p = S.parada;
  if (p) {   // parado: «Reanudar todo» queda a la vista, que es un estado importante
    const b = document.createElement('button'); b.type = 'button'; b.className = 'pb-of-stop on';
    b.innerHTML = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg><span>Reanudar todo</span><small>parado desde ${esc(String(p.ts || '').slice(11, 16))}</small>`;
    b.title = 'Vuelve a poner en marcha los agentes que estaban funcionando';
    b.onclick = (ev) => { ev.stopPropagation(); accion('agentes_parar', { modo: 'reanudar' }, 'Agentes reanudados.', b); };
    return b;
  }
  // en marcha: el interruptor va dentro del menú «⋯», para no pulsarlo sin querer
  const m = document.createElement('div'); m.className = 'pb-of-mas';
  m.innerHTML = '<button type="button" class="b" aria-label="Más opciones" title="Más opciones">⋯</button><div class="menu"><button type="button" class="stop"><svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/></svg>Parar todos los agentes…</button></div>';
  m.querySelector('.b').onclick = (ev) => { ev.stopPropagation(); m.classList.toggle('on'); };
  m.querySelector('.stop').onclick = (ev) => { ev.stopPropagation(); m.classList.remove('on'); confirmaParar(); };
  return m;
}
function confirmaParar() {
  const ov = document.createElement('div'); ov.className = 'pb-of-modal';
  ov.innerHTML = '<div class="c" role="dialog" aria-modal="true" aria-labelledby="pb-of-mt"><h3 id="pb-of-mt">¿Seguro que quieres parar todo?</h3>'
    + '<p>WhatsApp y email dejan de escribir a empresas ahora mismo. No envían nada hasta que pulses «Reanudar todo».</p>'
    + '<div class="bt"><button type="button" class="no">Cancelar</button><button type="button" class="si">Sí, parar todo</button></div></div>';
  const fuera = () => ov.remove();
  ov.onclick = (e) => { e.stopPropagation(); if (e.target === ov) fuera(); };
  ov.querySelector('.no').onclick = fuera;
  ov.querySelector('.si').onclick = (e) => { fuera(); accion('agentes_parar', { modo: 'parar' }, 'Todo parado: ningún agente escribe a nadie.', e.currentTarget); };
  ov.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); fuera(); } });
  wrap.append(ov); ov.querySelector('.no').focus();
}
document.addEventListener('click', () => { const m = hud.querySelector('.pb-of-mas.on'); if (m) m.classList.remove('on'); });
/* "Actualizado hace…" al pasar el ratón por la píldora */
function horaHud() { const sg = Math.round((Date.now() - (S.cargado || Date.now())) / 1000); hud.title = 'Datos de ahora mismo · actualizado ' + (sg < 10 ? 'hace un momento' : sg < 60 ? `hace ${sg} s` : `hace ${Math.round(sg / 60)} min`); }
setInterval(horaHud, 10000);

const q = (t, cuerpo) => `<div class="pb-of-q"><h4>${t}</h4>${cuerpo}</div>`;
/* QR de vinculación de WhatsApp: se dibuja con qrcodejs (cdnjs) tras pintar el lateral */
function pintaQRs() {
  const cajas = Array.from(document.querySelectorAll('.pb-of-qr[data-qr]')); if (!cajas.length) return;
  const dibuja = () => cajas.forEach((c) => { c.textContent = ''; new window.QRCode(c, { text: c.dataset.qr, width: 240, height: 240, correctLevel: window.QRCode.CorrectLevel.L }); });
  if (window.QRCode) return dibuja();
  const sc = document.createElement('script'); sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'; sc.onload = dibuja; document.head.append(sc);
}
function abrirAgente(id) {
  const a = ag(id); if (!a) return;
  const d = DEPTS.find((x) => x.id === a.dept); enfocarAgente(a.id);
  const [c, txt] = ST[a.st] || ST.espera;
  const pct = a.cupo ? Math.min(100, Math.round(a.hoy / a.cupo * 100)) : 0;
  const F = (window.PB_FICHA || {})[a.id] || {};
  const tabs = [['estado', 'Estado'], a.entregas && ['trabajo', 'Su trabajo'], ['actividad', 'Actividad'], F.ajustes && ['ajustes', 'Ajustes'], F.rendimiento && ['rendimiento', 'Rendimiento']].filter(Boolean);
  if (!tabs.some(([k]) => k === S.tab)) S.tab = 'estado';
  sideIn.innerHTML = (S.agentes.length > 1 ? '<div class="pb-of-nav"><button type="button" data-d="-1" aria-label="Agente anterior" title="Anterior (←)">‹</button><button type="button" data-d="1" aria-label="Agente siguiente" title="Siguiente (→)">›</button></div>' : '')
    + `<div class="k">${esc(d.nombre)}</div><h2>${tileHtml(a)}${esc(a.nombre)}</h2><div class="rol">${esc(a.rol || '')}</div>
    <div class="pb-of-state" style="--c:${c}"><i></i><div><b>${txt}</b><span>${esc(a.motivo)}</span></div></div>
    <div class="pb-of-acts" id="pb-of-acts"></div>
    ${a.codigo && String(a.codigo).startsWith('QR:') ? `<div class="pb-of-code"><small>Escanea este QR con WhatsApp</small><div class="pb-of-qr" data-qr="${esc(String(a.codigo).slice(3))}" style="background:#fff;padding:12px;border-radius:12px;display:inline-block;line-height:0;margin:8px 0"></div><span>En el móvil: WhatsApp › Dispositivos vinculados › Vincular un dispositivo, y apunta la cámara aquí. Se renueva solo cada pocos segundos.</span></div>` : ''}
    ${a.codigo && !String(a.codigo).startsWith('QR:') ? `<div class="pb-of-code"><small>Código para vincular WhatsApp</small><b>${esc(String(a.codigo).replace(/[^A-Z0-9]/gi, '').toUpperCase().replace(/(.{4})(?=.)/g, '$1-'))}</b><span>En el móvil: WhatsApp › Dispositivos vinculados › Vincular con el número de teléfono.</span></div>` : ''}
    <div class="pb-of-tabs" role="tablist">${tabs.map(([k, t]) => `<button type="button" role="tab" data-t="${k}" aria-selected="${k === S.tab}">${t}</button>`).join('')}</div>
    <div class="pb-of-tab" id="pb-of-tab">${S.tab !== 'estado' ? '' : `<div class="pb-of-qa">
    ${q('Hoy', `<p><b class="big">${N(a.hoy)}</b> ${esc(a.unidad)}${a.cupo ? ` de ${a.cupo} posibles` : ''}</p>${a.cupo ? `<div class="bar" style="--c:${d.color}"><i data-w="${pct}%"></i></div>` : ''}${franjaDia(a)}`)}
    ${q('Lo último que hizo', a.ultima ? `<p>${esc(a.ultima.txt)}</p><p class="sub">${esc(a.ultima.hace)}</p>` : '<p>Todavía no ha hecho nada.</p>')}
    ${(a.necesita || []).length ? q('Necesita de vosotros', a.necesita.map((n) => `<p class="warn">${esc(n)}</p>`).join('')) : ''}
    ${q('¿Ha fallado algo?', (a.errores || []).length ? a.errores.map((e) => `<p class="bad"><b>${esc(hora(e.ts))}</b> · ${esc(e.txt)}</p>`).join('') : '<p class="ok">No, nada en las últimas 24 horas.</p>')}
    ${a.proxima ? q('Qué hará ahora', `<p>${esc(a.proxima)}</p>`) : ''}
    ${(a.datos || []).length ? q('Datos', `<dl>${a.datos.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`) : ''}
    </div>`}</div>`;
  side.classList.toggle('ancho', ['ajustes', 'rendimiento'].includes(S.tab));
  sideIn.querySelectorAll('.pb-of-tabs button').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); S.tab = b.dataset.t; abrirAgente(a.id); }; });
  const caja = $('#pb-of-tab');
  if (S.tab === 'actividad') caja.append(lineaTiempo(a));
  else if (S.tab === 'trabajo') caja.append(suTrabajo(a));
  else if (S.tab !== 'estado') {
    let n = null; try { n = F[S.tab](() => abrirAgente(a.id)); } catch (er) { console.error(er); }
    caja.append(n || Object.assign(document.createElement('p'), { className: 'pb-of-vacio', textContent: n === null ? 'Cargando…' : 'No se ha podido mostrar esta parte.' }));
    if (!n) setTimeout(() => { if (foco && foco.agente === a.id && S.tab !== 'estado') abrirAgente(a.id); }, 1500);
  }
  const acts = $('#pb-of-acts');
  const boton = (cls, t, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'pb-of-btn ' + cls; b.textContent = t; b.onclick = (e) => { e.stopPropagation(); fn(b); }; acts.append(b); };
  const A = a.acciones || {};
  if (A.pausa) boton(a.pausado ? 'primary' : '', a.pausado ? 'Reanudar' : 'Pausar', (b) => accion(A.pausa, { pausado: a.pausado ? '0' : '1' }, a.pausado ? `${a.nombre} reanudado.` : `${a.nombre} en pausa: no enviará nada.`, b));
  if (A.ir) boton('ghost', A.ir === 'email' ? 'Ver su lista de empresas' : 'Ver las empresas', () => { const b = document.querySelector(`#pb-tabs button[data-page="${A.ir}"]`); if (b) b.click(); });
  if (!acts.childElementCount) acts.remove();
  sideIn.querySelectorAll('.pb-of-nav button').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); vecino(+b.dataset.d); }; });
  pintaQRs();
  mostrar();
}
/* Actividad paso a paso, por días, como un registro de ejecuciones: cada punto es una acción y su color dice cómo salió. */
const TIPO = { entrega: ['#B7FF3C', 'Entregado'], hito: ['#3DDC84', 'Hecho'], envio: ['#3DDC84', 'Envío'], respuesta: ['#3FD5FF', 'Respuesta'], error: ['#FF5E6C', 'Fallo'], freno: ['#FF5E6C', 'Frenado'], espera: ['#5C5F73', 'Espera'], cambio: ['#FFB547', 'Cambio'] };
/* «Su trabajo»: lo que el agente ha entregado (páginas, borradores, posts, informes…), agrupado y con enlace.
   Sale de los apuntes tipo 'entrega' (geo_actividad.py entrega …); sin IA, tal cual lo apuntó. */
const CLASES = [['pagina', 'Páginas publicadas'], ['post', 'Posts de Google'], ['borrador', 'Borradores'], ['linkedin', 'Borradores de LinkedIn'],
  ['informe', 'Informes y cifras'], ['posiciones', 'Posiciones en Google Maps'], ['novedad', 'Novedades encontradas'], ['encargo', 'Encargos repartidos'], ['mejora', 'Mejoras hechas'],
  ['lote', 'Lotes entregados a Prospectos'], ['escrito', 'Mensajes escritos'], ['encaja', 'Revisadas: encajan'], ['fuera', 'Fuera: no encajan'], ['enviado', 'Mensajes enviados']];
// Foto en grande: la captura real de la página (la misma de mShots, a más resolución)
function verFoto(src, titulo) {
  const v = document.createElement('div'); v.className = 'pb-of-foto';
  v.innerHTML = `<figure><img alt="" src="${esc(src.replace('w=640&h=400', 'w=1280&h=800'))}"><figcaption>${esc(titulo)}</figcaption></figure>`;
  v.onclick = () => v.remove();
  const k = (e) => { if (e.key === 'Escape') { v.remove(); document.removeEventListener('keydown', k, true); e.stopImmediatePropagation(); } };
  document.addEventListener('keydown', k, true);
  document.body.append(v);
}
function suTrabajo(a) {
  const box = document.createElement('div'); box.className = 'pb-of-work';
  const todo = a.entregas || [];
  if (!todo.length) { const p = document.createElement('p'); p.className = 'pb-of-vacio'; p.textContent = 'Todavía no ha entregado nada. Cuando termine algo, aparecerá aquí con su enlace.'; box.append(p); return box; }
  const fecha = (ts) => new Date(String(ts).replace(' ', 'T')).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  const grupos = CLASES.concat([...new Set(todo.map((e) => e.clase))].filter((c) => !CLASES.some(([k]) => k === c)).map((c) => [c, 'Otros']));
  grupos.forEach(([k, t]) => {
    const items = todo.filter((e) => e.clase === k); if (!items.length) return;
    const h = document.createElement('div'); h.className = 'pb-of-tld'; h.textContent = `${t} · ${items.length}`; box.append(h);
    items.forEach((e) => {
      const c = document.createElement(e.url ? 'a' : 'div'); c.className = 'pb-of-wi';
      if (e.url) { c.href = e.url; c.target = '_blank'; c.rel = 'noopener'; }
      const foto = e.foto || e.img;
      if (foto) {
        // foto real de lo que hizo: la imagen que subió o la captura de la página; se amplía al pulsarla
        c.classList.add('con-foto');
        const f = document.createElement('span'); f.className = 'pb-of-wf'; f.title = 'Ver la foto en grande';
        const im = document.createElement('img'); im.src = foto; im.alt = ''; im.loading = 'lazy'; im.onerror = () => f.remove();
        // mShots tarda unos segundos en hacer la foto la primera vez y entretanto da una imagen de espera (400×300): se vuelve a pedir
        let intentos = 0;
        im.onload = () => { if (foto.includes('mshots') && im.naturalWidth !== 640 && intentos < 5) { intentos++; setTimeout(() => { im.src = foto + '&r=' + intentos; }, 4000); } };
        f.append(im); f.onclick = (ev) => { ev.preventDefault(); ev.stopPropagation(); verFoto(foto, e.titulo); };
        c.append(f);
      }
      const tx = document.createElement('div');
      const b = document.createElement('b'); b.textContent = e.titulo;
      const m = document.createElement('small'); m.textContent = fecha(e.ts) + (e.url ? ' · abrir ↗' : '');
      tx.append(b);
      if (e.texto && e.burbuja) { const p = document.createElement('p'); p.className = 'pb-of-burbuja'; p.textContent = e.texto; tx.append(p); }
      else if (e.texto) { const p = document.createElement('p'); p.textContent = e.texto; tx.append(p); }
      tx.append(m); c.append(tx); box.append(c);
    });
  });
  return box;
}
function lineaTiempo(a) {
  const box = document.createElement('div'); box.className = 'pb-of-tl';
  const todo = a.actividad || [], fallos = todo.filter((e) => ['error', 'freno'].includes(e.tipo));
  const fil = document.createElement('div'); fil.className = 'pb-of-tlf';
  [['', 'Todo · ' + todo.length], ['fallos', 'Fallos · ' + fallos.length]].forEach(([k, t]) => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.className = (S.tlf || '') === k ? 'on' : '';
    b.onclick = (e) => { e.stopPropagation(); S.tlf = k; box.replaceWith(lineaTiempo(a)); }; fil.append(b);
  });
  box.append(fil);
  const lista = S.tlf === 'fallos' ? fallos : todo;
  if (!lista.length) { const p = document.createElement('p'); p.className = 'pb-of-vacio'; p.textContent = S.tlf === 'fallos' ? 'Ningún fallo en lo que tiene apuntado.' : 'Todavía no ha apuntado nada.'; box.append(p); return box; }
  const hoy = new Date(); const dia = (ts) => { const d = new Date(String(ts).replace(' ', 'T')); const k = Math.round((new Date(hoy.toDateString()) - new Date(d.toDateString())) / 864e5); return k === 0 ? 'Hoy' : k === 1 ? 'Ayer' : d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }); };
  let ult = '';
  lista.forEach((e) => {
    const dd = dia(e.ts); if (dd !== ult) { ult = dd; const h = document.createElement('div'); h.className = 'pb-of-tld'; h.textContent = dd; box.append(h); }
    const [c, t] = TIPO[e.tipo] || ['#8C8FA3', e.tipo || ''];
    const r = document.createElement('div'); r.className = 'pb-of-tle'; r.style.setProperty('--c', c);
    r.innerHTML = `<i></i><time>${esc(String(e.ts).slice(11, 16))}</time><div><span>${esc(e.txt)}</span><small>${esc(t)}</small></div>`;
    box.append(r);
  });
  return box;
}
function abrirSala(d) {
  side.classList.remove('ancho');
  enfocarSala(d);
  if (!d.activo) {
    const autos = d.id === 'embudo' ? S.autos : [];
    sideIn.innerHTML = `<div class="k">Departamento</div><h2>${esc(d.nombre)}</h2><div class="rol">${esc(d.objetivo)}</div><div class="pb-of-state" style="--c:#5C5F73"><i></i><div><b>Sin agentes todavía</b><span>Cuando montemos un bot para este departamento aparecerá aquí, conectado al núcleo.</span></div></div>`
      + (autos.length ? '<div class="pb-of-qa">' + q('Lo que ya funciona solo', autos.map((a) => `<div class="pb-of-auto"><div class="h">${tileHtml(a, 't')}<b>${esc(a.nombre)}${a.rol ? `<small>${esc(a.rol)}</small>` : ''}</b><span><i style="background:${(ST[a.st] || ST.espera)[0]}"></i>${a.st === 'espera' ? 'Atento' : (ST[a.st] || ST.espera)[1]}</span></div><p>${esc(a.motivo)}</p>${(a.necesita || []).map((n) => `<p class="warn">${esc(n)}</p>`).join('')}</div>`).join('')) + '</div>' : '');
    mostrar(); return;
  }
  const lista = agsDe(d.id);
  const pend = pendientes().filter((p) => p.a.dept === d.id), e = pend.some((p) => p.err) ? 'error' : pend.length ? 'aviso' : 'ok';
  sideIn.innerHTML = `<div class="k">Departamento</div><h2>${esc(d.nombre)}</h2><div class="rol">${esc(d.objetivo)}</div>
    <div class="pb-of-state" style="--c:${e === 'error' ? '#FF5E6C' : e === 'aviso' ? '#FFB547' : '#3DDC84'}"><i></i><div><b>${e === 'error' ? 'Hay un error' : e === 'aviso' ? 'Funciona, pero os necesita' : 'Todo en orden'}</b><span>${lista.filter((a) => a.st === 'trabajando').length} de ${lista.length} agentes trabajando ahora</span></div></div>
    <div class="pb-of-qa">
    ${pend.length ? q('Necesita de vosotros', pend.map((p) => `<p class="${p.err ? 'bad' : 'warn'}"><b>${esc(p.a.nombre)}</b>: ${esc(p.txt)}</p>`).join('')) : ''}
    ${q('Agentes', lista.map((a) => `<div class="pb-of-row" data-id="${esc(a.id)}">${tileHtml(a, 't')}<b>${esc(a.nombre)}${a.hoy ? `<em class="hoy">${N(a.hoy)} ${esc(a.unidad || 'hoy')}</em>` : ''}${a.rol ? `<small>${esc(a.rol)}</small>` : ''}${franjaDia(a)}</b><span><i style="background:${(ST[a.st] || ST.espera)[0]}"></i>${(ST[a.st] || ST.espera)[1]}</span></div>`).join(''))}
    </div>`;
  sideIn.querySelectorAll('.pb-of-row').forEach((r) => r.addEventListener('click', () => abrirAgente(r.dataset.id)));
  mostrar();
}
function abrirNucleo() {
  foco = { nucleo: true }; wrap.classList.add('foco');
  if (G) { const panel = wrap.clientWidth > 760 ? 2.4 : 0; G.volar(new G.THREE.Vector3(panel, 8.2, 13.5), new G.THREE.Vector3(panel, 2.2, 0)); }
  const pend = pendientes(), ne = pend.filter((p) => p.err).length;
  const trab = S.agentes.filter((a) => a.st === 'trabajando').length;
  const c = ne ? '#FF5E6C' : pend.length ? '#FFB547' : '#3DDC84';
  const hoy0 = new Date(); hoy0.setHours(0, 0, 0, 0);
  const pasesHoy = G ? G.traspasos().filter((x) => tsMs(x.ts) >= hoy0.getTime()).length : 0;
  // por departamento, lo hecho hoy sumado por tipo («31 empresas · 21 mensajes»), en fichas cortas
  const hechoHoy = DEPTS.filter((d) => d.activo).map((d) => {
    const suma = {}; agsDe(d.id).forEach((a) => { if (a.hoy) suma[a.unidad || 'tareas'] = (suma[a.unidad || 'tareas'] || 0) + a.hoy; });
    const k = Object.keys(suma); if (!k.length) return '';
    return `<div class="pb-of-hoyd"><i style="background:${d.color}"></i><b>${esc(d.nombre)}</b><span>${k.map((u) => `<em>${N(suma[u])}</em> ${esc(u.replace(/^empresas entregadas$/, 'empresas').replace(/^tareas hechas$/, 'tareas'))}`).join('<s>·</s>')}</span></div>`;
  }).join('');
  sideIn.innerHTML = `<div class="k">El núcleo</div><h2>PEBAI</h2><div class="rol">La IA que conecta todos los departamentos: recibe lo que hace cada bot y le devuelve el trabajo.</div>
    <div class="pb-of-state" style="--c:${c}"><i></i><div><b>${ne ? (ne === 1 ? '1 agente con error' : ne + ' agentes con error') : pend.length ? 'Funciona, pero os necesita' : 'Todo en orden'}</b><span>${trab} de ${S.agentes.length} bots trabajando ahora</span></div></div>
    <div class="pb-of-qa">
    ${q('Departamentos', DEPTS.map((d) => { const l = agsDe(d.id); return `<div class="pb-of-row" data-sala="${esc(d.id)}"><i style="background:${d.color}"></i><b>${esc(d.nombre)}</b><span>${d.activo ? (() => { const tr = l.filter((a) => a.st === 'trabajando').length; return (tr ? tr + ' trabajando · ' : '') + (l.length === 1 ? '1 bot' : l.length + ' bots'); })() : '' + (d.id === 'embudo' && S.autos.length ? S.autos.length + ' automáticos' : 'Sin agentes aún') + ''}</span></div>`; }).join(''))}
    ${hechoHoy || pasesHoy ? q('Hoy en la oficina', hechoHoy + (pasesHoy ? `<div class="pb-of-hoyd"><i style="background:#9C93FF"></i><b>Traspasos</b><span><em>${pasesHoy}</em> entre agentes</span></div>` : '')) : ''}
    ${pend.length ? q('Necesita de vosotros', pend.map((p) => `<p class="${p.err ? 'bad' : 'warn'}"><b>${esc(p.a.nombre)}</b>: ${esc(p.txt)}</p>`).join('')) : ''}
    ${q('Pregúntale', '<p>Escribe abajo cualquier duda sobre los agentes y PEBAI te responde con los datos de ahora mismo.</p><div class="pb-of-acts"><button type="button" class="pb-of-btn primary" id="pb-of-preg">Preguntar a PEBAI</button></div>')}
    </div>`;
  sideIn.querySelectorAll('.pb-of-row').forEach((r) => r.addEventListener('click', () => abrirSala(DEPTS.find((d) => d.id === r.dataset.sala))));
  $('#pb-of-preg').onclick = (e) => { e.stopPropagation(); qIn.focus(); };
  mostrar();
}
/* servidor de una sala: resumen con IA de lo que han hecho hoy sus agentes (index.php?oficina_resumen=<sala>) */
async function abrirServidor(id, fresco) {
  const d = DEPTS.find((x) => x.id === id); if (!d) return;
  enfocarServidor(id);
  const cab = `<div class="k">Servidor · ${esc(d.nombre)}</div><h2>Lo que han hecho hoy</h2><div class="rol">${esc(d.objetivo)}</div>`;
  if (!d.activo || !agsDe(d.id).length) { sideIn.innerHTML = cab + '<div class="pb-of-state" style="--c:#5C5F73"><i></i><div><b>Sin agentes todavía</b><span>Cuando este departamento tenga bots, su servidor resumirá aquí lo que hacen cada día.</span></div></div>'; mostrar(); return; }
  sideIn.innerHTML = cab + `<div class="pb-of-state" style="--c:${d.color}"><i></i><div><b>Un momento</b><span>La IA está leyendo lo que ha pasado hoy…</span></div></div>`; mostrar();
  let j;
  try {
    const r = await fetch(BASE + '?oficina_resumen=' + encodeURIComponent(id) + (fresco ? '&fresco=1' : ''), { credentials: 'same-origin', cache: 'no-store' });
    if (r.status === 401) { location.reload(); return; }
    j = await r.json().catch(() => ({ ok: false }));
    if (!j.ok) throw new Error(j.error || 'No se ha podido leer la actividad de hoy.');
  } catch (e) { j = { ok: false, error: e.message }; }
  if (!foco || foco.servidor !== id) return;  /* mientras tanto se ha abierto otra cosa */
  if (!j.ok) { sideIn.innerHTML = cab + `<div class="pb-of-state" style="--c:#FF5E6C"><i></i><div><b>No ha salido</b><span>${esc(j.error)}</span></div></div>`; mostrar(); return; }
  const lis = (l, cls) => l.map((t) => `<p${cls ? ` class="${cls}"` : ''}>${esc(t)}</p>`).join('');
  sideIn.innerHTML = cab + `<div class="pb-of-state" style="--c:${d.color}"><i></i><div><b>${esc(j.titular)}</b><span>${esc(j.resumen)}</span></div></div>
    <div class="pb-of-qa">
    ${(j.logros || []).length ? q(j.ia ? 'Lo conseguido' : 'Lo último que han hecho', lis(j.logros)) : ''}
    ${(j.problemas || []).length ? q('Problemas', lis(j.problemas, 'bad')) : j.entradas ? q('Problemas', '<p class="ok">Ninguno apuntado hoy.</p>') : ''}
    ${j.siguiente ? q('Lo siguiente', `<p>${esc(j.siguiente)}</p>`) : ''}
    ${q('De dónde sale', `<p class="sub">${j.ia ? 'Escrito por la IA' : 'Resumen automático sin IA'}, generado a las ${esc(hora(j.generado))} a partir de ${N(j.entradas)} ${j.entradas === 1 ? 'apunte' : 'apuntes'} de hoy.</p><div class="pb-of-acts"><button type="button" class="pb-of-btn ghost" id="pb-of-resfr">Actualizar</button></div>`)}
    </div>`;
  const b = $('#pb-of-resfr'); S.resFr = S.resFr || {};
  if (b) b.onclick = (e) => { e.stopPropagation(); if (Date.now() - (S.resFr[id] || 0) < 60000) { toast('Espera un minuto entre actualizaciones.', true); return; } S.resFr[id] = Date.now(); abrirServidor(id, true); };
  mostrar();
}
function vecino(dir) {
  if (!foco || !foco.agente || S.agentes.length < 2) return;
  const i = S.agentes.findIndex((a) => a.id === foco.agente);
  abrirAgente(S.agentes[(i + dir + S.agentes.length) % S.agentes.length].id);
}
function mostrar() { side.classList.add('on'); side.scrollTop = 0; setTimeout(() => side.querySelectorAll('.bar i').forEach((b) => { b.style.width = b.dataset.w; }), 300); }
function cerrar() { side.classList.remove('on', 'ancho'); foco = null; S.verTodo = false; wrap.classList.remove('foco'); if (G) G.volar(G.HOME.p, G.HOME.t); }
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && enPagina() && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { if (cine) alternarCine(); else cerrar(); } });
const ayuda = document.createElement('div'); ayuda.className = 'pb-of-ayuda';
ayuda.innerHTML = '<button type="button" class="b" aria-label="Atajos y leyenda" title="Atajos y leyenda (?)">?</button><div class="c">'
  + '<h5>Colores</h5>' + ['trabajando', 'espera', 'dormido', 'error', 'apagado'].map((k) => `<div class="l"><i style="background:${ST[k][0]}"></i>${ST[k][1]}</div>`).join('')
  + '<h5>Atajos</h5>' + [['Arrastrar', 'Moverse por la oficina'], ['Rueda', 'Acercar o alejar'], ['1 – ' + DEPTS.length, 'Ir a cada sala'], ['P', 'El núcleo'], ['S', 'Servidor de la sala enfocada'], ['← →', 'Agente anterior / siguiente'], ['/', 'Preguntar a PEBAI'], ['Esc', 'Volver a la vista general'], ['L', 'Vista Lista / 3D'], ['R', 'Repetir el día / parar'], ['Espacio', 'Pausa en la repetición'], ['H', 'Ocultar la interfaz'], ['C', 'Modo cine (para grabar)']].map(([k, t]) => `<div class="k"><kbd>${k}</kbd><span>${t}</span></div>`).join('')
  + '</div>';
wrap.append(ayuda);
ayuda.addEventListener('click', (e) => e.stopPropagation());
ayuda.querySelector('.b').onclick = () => ayuda.classList.toggle('on');
function alternarCine() {
  cine = !cine; cineAng = 0; wrap.classList.toggle('cine', cine); document.body.classList.toggle('pb-of-cine', cine);
  if (cine) { side.classList.remove('on'); foco = null; wrap.classList.remove('foco'); ayuda.classList.remove('on'); toast('Modo cine: pulsa C o Esc para salir'); }
  else if (G) G.volar(G.HOME.p, G.HOME.t);
}
document.addEventListener('keydown', (e) => {
  if (!enPagina() || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (cine && k !== 'c' && k !== 'Escape') { alternarCine(); return; }
  if (/^[1-9]$/.test(k) && DEPTS[+k - 1]) abrirSala(DEPTS[+k - 1]);
  else if (k === '0') cerrar();
  else if (k === 'p') abrirNucleo();
  else if (k === 's' && foco && (foco.sala || foco.agente || foco.servidor)) abrirServidor(foco.sala || foco.servidor || (ag(foco.agente) || {}).dept);
  else if (k === '/') { e.preventDefault(); e.stopImmediatePropagation(); abrirAsk(); }
  else if (k === 'ArrowRight') vecino(1);
  else if (k === 'ArrowLeft') vecino(-1);
  else if (k === 'h') { const l = wrap.classList.toggle('limpio'); if (l) toast('Interfaz oculta: pulsa H para verla'); }
  else if (k === 'c') alternarCine();
  else if (k === 'l') ponVista(!lista);
  else if (k === ' ' && repe) { e.preventDefault(); pausaRepe(); }
  else if (k === 'r') { if (repe) paraRepe(); else empiezaRepe(); }
  else if (k === '?') ayuda.classList.toggle('on');
  else return;
  e.stopImmediatePropagation();
}, true); /* en captura: en la oficina estos atajos van antes que los generales del panel (p. ej. "/" busca en Solicitudes) */

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
  x.onclick = (e) => { e.stopPropagation(); ans.classList.remove('on'); if (foco && foco.piensa) cerrar(); };
  head.append(img, qd, x);
  const body = document.createElement('div'); body.className = 'bd'; body.innerHTML = '<div class="pens"><span>PEBAI está mirando los departamentos</span><i></i><i></i><i></i></div>';
  ans.append(head, body);
  qBtn.disabled = true; qIn.value = ''; pensando = true; ans.classList.add('pensando');
  // la cámara se acerca a la bola para ver cómo piensa (queda arriba, por encima de la respuesta)
  if (G && !lista && (!foco || foco.nucleo || foco.sigue || foco.piensa)) { if (!foco || foco.sigue) foco = { piensa: true }; const N = G.NUC; G.volar(new G.THREE.Vector3(N.x, N.y + 9, N.z + 17), new G.THREE.Vector3(N.x, N.y - 1.6, N.z)); }
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
const askW = $('#pb-of-ask'), askF = $('#pb-of-askf');
const kbd = document.createElement('kbd'); kbd.textContent = '/'; kbd.title = 'Pulsa / para preguntar'; askF.append(kbd);
const PH = qIn.placeholder;
const abrirAsk = () => { askW.classList.add('abierta'); qIn.placeholder = PH; qIn.focus(); };
const cerrarAsk = () => { if (qIn.value.trim() || ans.classList.contains('on') || document.activeElement === qIn) return; askW.classList.remove('abierta'); qIn.placeholder = 'Pregunta a PEBAI'; };
qIn.placeholder = 'Pregunta a PEBAI';
askF.addEventListener('click', () => { if (!askW.classList.contains('abierta')) abrirAsk(); });
qIn.addEventListener('focus', () => { askW.classList.add('abierta'); qIn.placeholder = PH; });
qIn.addEventListener('blur', () => setTimeout(cerrarAsk, 180));
new MutationObserver(() => setTimeout(cerrarAsk, 0)).observe(ans, { attributes: true, attributeFilter: ['class'] });
['pb-of-ask', 'pb-of-hud', 'pb-of-side'].forEach((id) => { const n = document.getElementById(id); if (n) n.addEventListener('click', (e) => e.stopPropagation()); });

/* ============ escena 3D ============ */
let G = null, foco = null, pensando = false, cine = false, cineAng = 0, salaHover = null;
const calma = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
function enfocarSala(d) {
  foco = { sala: d.id }; wrap.classList.add('foco'); if (!G) return;
  const s = G.salas.get(d.id); if (!s) return;
  const f = Math.max(1, s.W / 8.6), ancho = wrap.clientWidth > 760, panel = ancho ? 3.3 * f : 0;
  const c = s.g.position.clone();
  G.volar(c.clone().add(new G.THREE.Vector3(panel, 12.5 * f, 15.5 * f)), c.clone().add(new G.THREE.Vector3(panel, ancho ? .9 : -1.6 * f, -.9)));
}
function enfocarServidor(id) {
  foco = { servidor: id }; wrap.classList.add('foco'); if (!G) return;
  const s = G.salas.get(id); if (!s) return;
  const c = s.g.position.clone(), f = Math.max(1, s.esc || 1), panel = wrap.clientWidth > 760 ? 3 * f : 0;
  G.volar(c.clone().add(new G.THREE.Vector3(panel, 7.4 * f, 10.5 * f)), c.clone().add(new G.THREE.Vector3(panel, 1.7 * f, 0)));
}
function enfocarAgente(id) {
  foco = { agente: id }; wrap.classList.add('foco'); if (!G) return;
  const o = G.puestos.get(id); if (!o) return;
  const T = G.THREE, w = new T.Vector3(); o.p.getWorldPosition(w);
  const sa = G.salas.get(o.d.id), e = sa ? sa.esc : 1;
  // hacia fuera de la sala, por detrás del robot, que mira a su pantalla
  const fuera = o.phi != null ? new T.Vector3(Math.sin(o.phi), 0, Math.cos(o.phi)) : new T.Vector3(0, 0, 1);
  const pos = w.clone().addScaledVector(fuera, 8.4 * e).add(new T.Vector3(0, 6.4 * e, 0)), mira = w.clone().addScaledVector(fuera, .5 * e).add(new T.Vector3(0, .6 * e, 0));
  if (wrap.clientWidth > 760) {   // el panel ocupa la derecha: todo un poco a la derecha para que la mesa quede en el hueco libre
    const dcha = new T.Vector3().subVectors(mira, pos).cross(new T.Vector3(0, 1, 0)).normalize().multiplyScalar(1.5 * e);
    pos.add(dcha); mira.add(dcha);
  } else { pos.add(new T.Vector3(0, 1.2 * e, 0)); mira.add(new T.Vector3(0, -1.1 * e, 0)); }   // móvil: la ficha sube desde abajo
  G.volar(pos, mira);
}

async function montar() {
  const THREE = await import('three');
  const { mergeGeometries } = await import('three/addons/utils/BufferGeometryUtils.js');
  const { EffectComposer } = await import('three/addons/postprocessing/EffectComposer.js');
  const { RenderPass } = await import('three/addons/postprocessing/RenderPass.js');
  const { UnrealBloomPass } = await import('three/addons/postprocessing/UnrealBloomPass.js');
  const { OutputPass } = await import('three/addons/postprocessing/OutputPass.js');
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const { SVGLoader } = await import('three/addons/loaders/SVGLoader.js');
  /* las letras de carteles y pantallas se dibujan en canvas: esperar a que las fuentes del panel estén listas */
  try { await Promise.race([Promise.all(['400 100px "Instrument Serif"', '800 40px Manrope', '600 30px Manrope'].map((f) => document.fonts.load(f))), new Promise((r) => setTimeout(r, 2500))]); } catch (e) { /* sin fuentes, se usa la de respaldo */ }
  /* si la sección aún no tiene tamaño (pestaña oculta), esperar: con ancho 0 la cámara saldría NaN */
  while (!wrap.clientWidth || !wrap.clientHeight) await new Promise((r) => setTimeout(r, 250));
  const load = $('#pb-of-load'); if (load) load.remove();
  const W0 = () => wrap.clientWidth, H0 = () => wrap.clientHeight;
  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', stencil: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.setSize(W0(), H0());
  renderer.shadowMap.enabled = false;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.2;
  wrap.prepend(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x06070d); scene.fog = new THREE.Fog(0x06070d, 48, 100);
  const camera = new THREE.PerspectiveCamera(32, W0() / H0(), .1, 240);
  /* calidad: la escena se dibuja a esta resolución y baja sola si el ordenador no llega a ~40 FPS */
  const gpu = (() => { try { const gl = renderer.getContext(), e = gl.getExtension('WEBGL_debug_renderer_info'); return e ? String(gl.getParameter(e.UNMASKED_RENDERER_WEBGL)) : ''; } catch (e) { return ''; } })();
  const integrada = /intel|uhd|iris|mali|adreno|powervr|swiftshader|llvmpipe|microsoft basic/i.test(gpu);
  const QMAX = Math.min(devicePixelRatio, integrada ? 1 : 1.25);
  let Q = integrada ? Math.min(QMAX, .85) : QMAX, ultSubida = 0;
  const composer = new EffectComposer(renderer); composer.setPixelRatio(Q);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(W0() / 2, H0() / 2), .55, .45, .88); composer.addPass(bloom); composer.addPass(new OutputPass());

  const hemi = new THREE.HemisphereLight(0xd6d8ff, 0x1a1c34, 1.3); scene.add(hemi);
  const lamparas = [];
  const sun = new THREE.DirectionalLight(0xffffff, 1.35); sun.position.set(-12, 26, 16); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); sun.shadow.bias = -.0004; scene.add(sun);

  const canvasTex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), c); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  const hexA = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  const sombraTex = canvasTex(128, 128, (g) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(0,0,0,.75)'); r.addColorStop(.6, 'rgba(0,0,0,.35)'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); });
  const sombraMat = new THREE.MeshBasicMaterial({ map: sombraTex, transparent: true, depthWrite: false, opacity: .8 });
  /* sombra suave bajo un objeto (en lugar de calcular sombras reales en cada fotograma) */
  const sombra = (padre, x, z, w, d, y = .008) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), sombraMat); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.renderOrder = -1; padre.add(m); return m; };
  const brillo = canvasTex(128, 128, (g) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.25, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); });
  brillo.colorSpace = THREE.NoColorSpace;

  /* ---------- suelo general ---------- */
  const floorTex = canvasTex(512, 512, (g) => { g.fillStyle = '#0b0c18'; g.fillRect(0, 0, 512, 512); g.strokeStyle = 'rgba(126,115,255,.04)'; g.lineWidth = 2; for (let i = 0; i <= 512; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 512); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(512, i); g.stroke(); } g.fillStyle = 'rgba(126,115,255,.07)'; for (let i = 0; i <= 512; i += 64) for (let j = 0; j <= 512; j += 64) g.fillRect(i - 2, j - 2, 4, 4); });
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(20, 20);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(170, 170), new THREE.MeshStandardMaterial({ map: floorTex, roughness: .55, metalness: .35 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

  /* ---------- enlaces de datos ----------
     Cable de doble capa (alma brillante + halo suave) con pulsos que van del núcleo a la sala (violeta)
     y vuelven de la sala al núcleo (color de la sala); encima viajan paquetes de luz. */
  const VIOLETA = '#9C93FF';
  const enlaceMat = (colSala, halo) => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uT: { value: 0 }, uA: { value: new THREE.Color(VIOLETA) }, uB: { value: new THREE.Color(colSala) }, uOn: { value: 0 }, uH: { value: halo ? 1 : 0 }, uN: { value: 4 }, uP: { value: 1 } },
    vertexShader: 'varying vec2 vUv;varying vec3 vN;varying vec3 vV;void main(){vUv=uv;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
    fragmentShader: 'varying vec2 vUv;varying vec3 vN;varying vec3 vV;uniform float uT;uniform vec3 uA;uniform vec3 uB;uniform float uOn;uniform float uH;uniform float uN;uniform float uP;'
      + 'float pul(float f){return smoothstep(0.,.03,f)*smoothstep(.22,.03,f);}'
      + 'void main(){float sp=.18+.32*uOn;float ida=pul(fract(vUv.x*uN-uT*sp))*uP;float vuelta=pul(fract((1.-vUv.x)*uN-uT*sp+.5))*uOn;'
      + 'float borde=mix(1.,pow(abs(dot(normalize(vN),normalize(vV))),2.2),uH);'
      + 'vec3 c=mix(uA,uB,smoothstep(.15,.85,vUv.x))*(.45+.25*uOn)+uA*ida*1.6+uB*vuelta*1.6;'
      + 'float a=(.2+.12*uOn+(ida+vuelta)*.8)*borde*mix(1.,.5,uH);gl_FragColor=vec4(c,a);}',
  });
  const enlaces = [], paquetes = [];
  function cable(curva, col, radio, nPaq) {
    const alma = new THREE.Mesh(new THREE.TubeGeometry(curva, 72, radio, 6), enlaceMat(col, false));
    const halo = new THREE.Mesh(new THREE.TubeGeometry(curva, 72, radio * 3.4, 8), enlaceMat(col, true));
    scene.add(alma, halo); const c = { alma, halo, curva, on: 0 }; enlaces.push(c);
    for (let i = 0; i < nPaq; i++) [1, -1].forEach((dir) => {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: brillo, color: dir > 0 ? VIOLETA : col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      sp.scale.setScalar(radio * 9); scene.add(sp); paquetes.push({ sp, c, dir, k: (i / nPaq) + (dir < 0 ? .5 / nPaq : 0), v: .16 + Math.random() * .04 });
    });
    return c;
  }
  const ponOn = (c, v) => { c.on = v; c.alma.material.uniforms.uOn.value = v; c.halo.material.uniforms.uOn.value = v; };

  /* ---------- núcleo: PEBAI, la IA que lo mueve todo ---------- */
  const NUC = new THREE.Vector3(0, 2.85, 0);
  const metal = new THREE.MeshStandardMaterial({ color: 0x151931, roughness: .28, metalness: .75 });
  sombra(scene, 0, 0, 6.2, 6.2, .104);
  const zocalo = new THREE.Mesh(new THREE.CylinderGeometry(2.25, 2.4, .16, 72), metal); zocalo.position.y = .08; zocalo.receiveShadow = true; scene.add(zocalo);
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.7, .36, 72), metal); pedestal.position.y = .34; pedestal.castShadow = pedestal.receiveShadow = true; pedestal.userData.nucleo = true; scene.add(pedestal);
  const violetaMat = new THREE.MeshBasicMaterial({ color: 0x9C93FF, toneMapped: false });
  const filo = new THREE.Mesh(new THREE.TorusGeometry(1.47, .02, 8, 120), violetaMat); filo.rotation.x = Math.PI / 2; filo.position.y = .525; scene.add(filo);
  const filo2 = new THREE.Mesh(new THREE.TorusGeometry(2.27, .014, 8, 120), new THREE.MeshBasicMaterial({ color: 0x6d64d8, toneMapped: false, transparent: true, opacity: .7 })); filo2.rotation.x = Math.PI / 2; filo2.position.y = .165; scene.add(filo2);
  /* corona de marcas que gira despacio sobre el pedestal */
  const corona = new THREE.Group(); corona.position.y = .53; scene.add(corona);
  [[1, .45], [0, .9]].forEach(([corta, op]) => {
    const geos = [];
    for (let i = 0; i < 36; i++) { if ((i % 3 ? 1 : 0) !== corta) continue; const gg = new THREE.BoxGeometry(.05, .012, corta ? .12 : .24); const a = i / 36 * Math.PI * 2; gg.rotateY(-a); gg.translate(Math.cos(a) * 1.2, 0, Math.sin(a) * 1.2); geos.push(gg); }
    corona.add(new THREE.Mesh(mergeGeometries(geos), new THREE.MeshBasicMaterial({ color: 0x9C93FF, toneMapped: false, transparent: true, opacity: op })));
  });
  const haz = new THREE.Mesh(new THREE.CylinderGeometry(.12, .42, 1.1, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0x9C93FF, transparent: true, opacity: .16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); haz.position.y = 1.07; scene.add(haz);
  const orbeMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uT: { value: 0 }, uA: { value: new THREE.Color('#6F63FF') }, uB: { value: new THREE.Color('#B7FF3C') }, uErr: { value: 0 }, uK: { value: 1 } },
    vertexShader: 'varying vec3 vN;varying vec3 vV;varying vec3 vP;void main(){vP=position;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
    fragmentShader: 'varying vec3 vN;varying vec3 vV;varying vec3 vP;uniform float uT;uniform vec3 uA;uniform vec3 uB;uniform float uErr;uniform float uK;'
      + 'void main(){float fr=pow(1.-abs(dot(vN,vV)),2.6);float t=uT*uK;'
      + 'float p1=sin(vP.y*6.+t*1.3+sin(vP.x*4.+t*.7)*1.8);float p2=sin(vP.x*7.-t*1.1+cos(vP.z*5.+t*.9)*1.4);float p3=sin((vP.z+vP.y)*9.+t*2.1);'
      + 'float pl=(p1+p2)*.25+.5;float hilo=smoothstep(.92,1.,abs(p3))*.6;'
      + 'vec3 c=mix(uA,uB,smoothstep(.72,1.,pl)*.5);c=mix(c,vec3(1.,.36,.42),uErr);'
      + 'gl_FragColor=vec4(c*(.35+fr*2.1+pl*.35+hilo),fr*.9+.05+pl*.08+hilo*.25);}',
  });
  const orbe = new THREE.Mesh(new THREE.SphereGeometry(1.25, 72, 54), orbeMat); orbe.position.copy(NUC); orbe.userData.nucleo = true; scene.add(orbe);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: brillo, color: 0x7E73FF, transparent: true, opacity: .32, depthWrite: false, blending: THREE.AdditiveBlending })); halo.scale.setScalar(5.6); halo.position.copy(NUC); scene.add(halo);
  /* ideas: chispas que giran alrededor de la bola mientras PEBAI piensa una respuesta */
  const ideas = [0x3FD5FF, 0xB7FF3C, 0x9C93FF, 0xFFFFFF, 0x3FD5FF, 0xB7FF3C].map((c, i) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: brillo, color: c, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    sp.scale.setScalar(.55); scene.add(sp); return { sp, fase: i / 6 * Math.PI * 2, incl: (i % 3 - 1) * .7, r: 1.75 + (i % 2) * .35 };
  });
  let pz = 0, chispazo = 0, pensabaAntes = false;
  /* el logo, al frente y bien visible: una lente oscura detrás y un brillo suave */
  const lente = new THREE.Mesh(new THREE.CircleGeometry(.8, 64), new THREE.MeshBasicMaterial({ color: 0x07081a, transparent: true, opacity: .78, depthWrite: false })); lente.renderOrder = 4; scene.add(lente);
  const aro = new THREE.Mesh(new THREE.RingGeometry(.8, .835, 64), new THREE.MeshBasicMaterial({ color: 0x9C93FF, transparent: true, opacity: .8, depthWrite: false, toneMapped: false })); aro.renderOrder = 4; scene.add(aro);
  const tex = new THREE.TextureLoader().load(BASE + 'assets/pebai-mark.png'); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const mark = new THREE.Mesh(new THREE.PlaneGeometry(1.04, 1.22), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false })); mark.renderOrder = 5; scene.add(mark);
  const fachada = [lente, aro, mark];
  /* nube de partículas que orbita el núcleo (dos capas en sentidos opuestos) */
  const nube = (n, r0, r1, col, tam) => {
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, r = r0 + Math.random() * (r1 - r0), s = Math.sqrt(1 - u * u); pos.set([Math.cos(th) * s * r, u * r * .55, Math.sin(th) * s * r], i * 3); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const p = new THREE.Points(geo, new THREE.PointsMaterial({ map: brillo, color: col, size: tam, transparent: true, opacity: .85, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
    p.position.copy(NUC); scene.add(p); return p;
  };
  const nubes = [nube(200, 1.55, 2.5, 0x9C93FF, .12), nube(100, 1.5, 2.2, 0xB7FF3C, .09)];
  const orbitas = [[.25, .5, 1.68], [1.05, -.45, 1.9], [-.7, 1.2, 2.12]].map(([rx, rz, r], i) => {
    const o = new THREE.Mesh(new THREE.TorusGeometry(r, .01, 6, 160), new THREE.MeshBasicMaterial({ color: i === 1 ? 0xB7FF3C : 0x9C93FF, transparent: true, opacity: .5, toneMapped: false }));
    o.position.copy(NUC); o.rotation.set(Math.PI / 2 + rx, 0, rz); scene.add(o);
    const chispa = new THREE.Sprite(new THREE.SpriteMaterial({ map: brillo, color: i === 1 ? 0xB7FF3C : 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); chispa.scale.setScalar(.32); chispa.position.x = r; o.add(chispa);
    return o;
  });
  /* ondas que salen del núcleo por el suelo, como un latido */
  const ondas = [0, 1].map((i) => { const m = new THREE.Mesh(new THREE.RingGeometry(.97, 1, 128), new THREE.MeshBasicMaterial({ color: 0x9C93FF, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); m.rotation.x = -Math.PI / 2; m.position.y = .115; scene.add(m); return { m, k: i / 2 }; });
  const columna = new THREE.Mesh(new THREE.CylinderGeometry(.4, .7, 18, 24, 1, true), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { uT: { value: 0 } },
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'varying vec2 vUv;uniform float uT;void main(){float f=pow(1.-vUv.y,3.);float r=.5+.5*sin(vUv.y*40.-uT*2.);gl_FragColor=vec4(vec3(.55,.5,1.)*(.6+r*.4),f*.075);}',
  }));
  columna.position.set(0, NUC.y + 10.2, 0); scene.add(columna);
  const polvo = (() => { const n = 140, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) pos.set([(Math.random() - .5) * 44, Math.random() * 9, (Math.random() - .5) * 26], i * 3); const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); const pt = new THREE.Points(geo, new THREE.PointsMaterial({ map: brillo, color: 0x8e84ff, size: .07, transparent: true, opacity: .32, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(pt); return pt; })();
  const coreLight = new THREE.PointLight(0x8e84ff, 8, 12); coreLight.position.copy(NUC).add(new THREE.Vector3(0, 0, 1.4)); scene.add(coreLight);

  /* ---------- pantallas animadas y carteles ---------- */
  const icono = (g, a, x, y, s, color) => {
    g.save(); g.translate(x, y); g.scale(s, s);
    const d = a.icono && brand(a.icono);
    if (d) { g.fillStyle = color; g.fill(new Path2D(d)); } else { g.strokeStyle = color; g.lineWidth = 2; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(new Path2D(GLIFOS[a.glifo] || GLIFOS.flow)); }
    g.restore();
  };
  function dibujaPantalla(o, t) {
    const g = o.ctx, a = o.a, st = vis(a.st), col = o.col;
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
    g.fillStyle = apag ? '#1c1f33' : (FONDO[a.id] || '#3a3d52'); g.beginPath(); g.roundRect(34, 54, 150, 150, 36); g.fill();
    icono(g, a, 64, 84, 3.75, apag ? '#4a4d62' : '#ffffff');
    g.fillStyle = apag ? '#4a4d62' : '#EFEDE7'; g.font = '800 34px Manrope, sans-serif'; g.textAlign = 'center'; g.fillText(a.nombre, 109, 252); g.textAlign = 'left';
    if (a.rol) { /* qué hace, en una línea arriba de la pantalla */
      g.font = '600 21px Manrope, sans-serif'; g.fillStyle = apag ? '#3a3d52' : '#9A9CB0'; let r = a.rol;
      while (g.measureText(r).width > 444 && r.length > 4) r = r.slice(0, -2).trimEnd() + '…';
      g.fillText(r, 34, 36);
    }
    const x0 = 214;
    const tarea = (() => { const e = (a.actividad || []).find((x) => x.tipo !== 'espera'); return String((e && !/^Termina/.test(e.txt) && e.txt) || a.motivo || '').replace(/^(Empieza|Encargo del Jefe):\s*/u, ''); })();
    if (st === 'trabajando' && tarea) {
      // «Ahora», y la tarea escribiéndose; debajo, dos barras de progreso que se mueven
      g.fillStyle = col; g.font = '800 22px Manrope, sans-serif'; g.fillText('AHORA', x0, 70);
      const n = Math.floor((t * 22) % (tarea.length + 36)), vis = tarea.slice(0, n);
      g.fillStyle = '#EFEDE7'; g.font = '600 25px Manrope, sans-serif';
      const pal = vis.split(' '), lin = ['']; pal.forEach((w) => { const prueba = (lin[lin.length - 1] + ' ' + w).trim(); if (g.measureText(prueba).width > 264 && lin[lin.length - 1]) lin.push(w); else lin[lin.length - 1] = prueba; });
      lin.slice(0, 4).forEach((l, i) => g.fillText(l + (i === Math.min(3, lin.length - 1) && Math.sin(t * 9) > 0 ? '▍' : ''), x0, 108 + i * 34));
      [0, 1].forEach((i) => { const k = (t * .7 + i * .45) % 1; g.fillStyle = 'rgba(255,255,255,.07)'; g.beginPath(); g.roundRect(x0, 252 + i * 22, 264, 9, 5); g.fill(); g.fillStyle = col; g.beginPath(); g.roundRect(x0, 252 + i * 22, 264 * k, 9, 5); g.fill(); });
    } else if (st === 'trabajando') {
      for (let i = 0; i < 5; i++) {
        const k = (t * 1.6 + i * .37) % 1, y = 48 + i * 46, w = 80 + ((i * 67 + Math.floor(t * 1.6 + i * .37) * 31) % 170);
        g.fillStyle = 'rgba(255,255,255,.07)'; g.beginPath(); g.roundRect(x0, y, 264, 30, 9); g.fill();
        g.fillStyle = col; g.globalAlpha = .35 + .65 * (1 - k); g.beginPath(); g.roundRect(x0 + 12, y + 11, Math.min(240, w * Math.min(1, k * 2.2)), 8, 4); g.fill(); g.globalAlpha = 1;
      }
    } else if (st === 'espera' && a.id === 'cerebro') {
      for (let i = 0; i < 13; i++) {
        const h = 16 + Math.abs(Math.sin(t * 3.1 + i * .7) * Math.cos(t * 1.7 + i * .35)) * 120;
        g.fillStyle = col; g.globalAlpha = .45 + .55 * (h / 136); g.beginPath(); g.roundRect(x0 + 6 + i * 20, 136 - h / 2, 11, h, 6); g.fill();
      }
      g.globalAlpha = 1; g.fillStyle = col; g.font = '700 26px Manrope, sans-serif'; g.textAlign = 'center'; g.fillText('Escuchando', 346, 236); g.textAlign = 'left';
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
    }
    if (a.cupo && st !== 'dormido') { g.fillStyle = 'rgba(255,255,255,.08)'; g.beginPath(); g.roundRect(34, 282, 444, 12, 6); g.fill(); g.fillStyle = col; g.beginPath(); g.roundRect(34, 282, Math.max(12, 444 * Math.min(1, a.hoy / a.cupo)), 12, 6); g.fill(); }
    o.tex.needsUpdate = true;
  }
  /* cartel de la sala: icono del departamento, nombre con la serif del panel y una línea de estado */
  const cartel = (d, partes) => canvasTex(1024, 256, (g) => {
    const on = d.activo;
    const grd = g.createLinearGradient(0, 0, 0, 256); grd.addColorStop(0, 'rgba(24,27,50,.97)'); grd.addColorStop(1, 'rgba(10,12,24,.97)');
    g.fillStyle = grd; g.beginPath(); g.roundRect(6, 6, 1012, 244, 44); g.fill();
    g.strokeStyle = on ? hexA(d.color, .5) : 'rgba(255,255,255,.09)'; g.lineWidth = 3; g.stroke();
    g.fillStyle = on ? d.color : '#3a3d52'; g.beginPath(); g.roundRect(70, 4, 200, 6, 3); g.fill();
    g.fillStyle = on ? hexA(d.color, .14) : 'rgba(255,255,255,.04)'; g.beginPath(); g.roundRect(46, 50, 156, 156, 40); g.fill();
    g.strokeStyle = on ? hexA(d.color, .35) : 'rgba(255,255,255,.06)'; g.lineWidth = 2; g.stroke();
    g.save(); g.translate(76, 80); g.scale(4, 4); g.strokeStyle = on ? d.color : '#5c5f73'; g.lineWidth = 1.7; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(new Path2D(GLIFOS[d.glifo] || GLIFOS.flow)); g.restore();
    g.fillStyle = on ? '#FFFFFF' : '#8a8da2'; g.font = '400 104px "Instrument Serif", Georgia, serif'; g.fillText(d.nombre, 240, 128);
    let x = 244; g.font = '700 36px Manrope, sans-serif';
    if (d.id === 'redes') {   // las redes que usamos, cada una con su logo y su color
      const RR = [['instagram', '#E1306C'], ['tiktok', '#25F4EE'], ['youtube', '#FF0000'], ['facebook', '#1877F2'], ['pinterest', '#E60023'], ['x', '#FFFFFF'], ['linkedin', '#0A66C2']];
      RR.forEach(([k, c], i) => { const dd = brand(k); if (!dd) return; g.save(); g.translate(246 + i * 80, 150); g.scale(2.6, 2.6); g.fillStyle = c; g.globalAlpha = .9; g.fill(new Path2D(dd)); g.restore(); });
      return;
    }
    partes.forEach(([txt, c], i) => {
      if (i) { g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x, 168, 2, 36); x += 24; }
      g.fillStyle = c; g.beginPath(); g.arc(x + 9, 186, 9, 0, Math.PI * 2); g.fill(); x += 28;
      g.fillStyle = on ? '#D6D8E6' : '#7c7f94'; g.fillText(txt, x, 199); x += g.measureText(txt).width + 24;
    });
  });

  /* ---------- materiales y muebles ---------- */
  const M = {
    cuerpo: new THREE.MeshStandardMaterial({ color: 0xc4c8d6, roughness: .38, metalness: .25 }),
    oscuro: new THREE.MeshStandardMaterial({ color: 0x1a1d30, roughness: .4, metalness: .45 }),
    mesa: new THREE.MeshStandardMaterial({ color: 0xA9743F, roughness: .55, metalness: .05 }),   // tablero de madera
    cristal: new THREE.MeshStandardMaterial({ color: 0xCFE3FF, roughness: .08, metalness: .1, transparent: true, opacity: .16, depthWrite: false, side: THREE.DoubleSide }),
    canto: new THREE.MeshStandardMaterial({ color: 0xC48A52, roughness: .5, metalness: .05 }),
    marco: new THREE.MeshStandardMaterial({ color: 0x0a0b14, roughness: .35, metalness: .4 }),
    madera: new THREE.MeshStandardMaterial({ color: 0x5a4636, roughness: .7, metalness: .05 }),
    tela: new THREE.MeshStandardMaterial({ color: 0x2c3054, roughness: .9 }),
    maceta: new THREE.MeshStandardMaterial({ color: 0xd9d4cc, roughness: .6 }),
    hoja: new THREE.MeshStandardMaterial({ color: 0x2f8f5b, roughness: .7, flatShading: true }),
    hoja2: new THREE.MeshStandardMaterial({ color: 0x3fae6b, roughness: .7, flatShading: true }),
    carton: new THREE.MeshStandardMaterial({ color: 0x9a7650, roughness: .85 }),
    luzCalida: new THREE.MeshBasicMaterial({ color: 0xffd9a0, toneMapped: false }),
  };
  const libroCol = [0x8E84FF, 0x3FD5FF, 0xE25CFF, 0xB7FF3C, 0xFFB547, 0xEFEDE7, 0x5c5f73];
  const caja = (w, h, d, mat, r = .03) => { const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2)), mat); m.castShadow = true; m.receiveShadow = true; return m; };
  const en = (g, m, x, y, z, ry = 0) => { m.position.set(x, y, z); m.rotation.y = ry; g.add(m); return m; };
  function planta(g, x, z, s = 1) {
    const p = new THREE.Group(); p.position.set(x, 0, z); p.scale.setScalar(s); g.add(p);
    sombra(p, 0, 0, .9, .9);
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(.24, .18, .42, 20), M.maceta); pot.position.y = .21; pot.castShadow = true; p.add(pot);
    const tierra = new THREE.Mesh(new THREE.CircleGeometry(.22, 20), M.oscuro); tierra.rotation.x = -Math.PI / 2; tierra.position.y = .42; p.add(tierra);
    [[0, .82, 0, .3, M.hoja], [.13, 1.08, .06, .22, M.hoja2], [-.12, 1, -.07, .21, M.hoja], [.02, 1.28, -.02, .16, M.hoja2], [-.06, .66, .14, .18, M.hoja2]].forEach(([hx, hy, hz, r, m]) => { const h = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), m); h.position.set(hx, hy, hz); h.rotation.set(hx * 9, hz * 7, hy); h.castShadow = true; p.add(h); });
    return p;
  }
  function lampara(g, x, z) {
    const p = new THREE.Group(); p.position.set(x, 0, z); g.add(p);
    en(p, new THREE.Mesh(new THREE.CylinderGeometry(.18, .2, .04, 20), M.marco), 0, .02, 0);
    const palo = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, 1.5, 8), M.marco); palo.position.y = .77; palo.castShadow = true; p.add(palo);
    const pant = new THREE.Mesh(new THREE.CylinderGeometry(.16, .24, .3, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0x3a3550, roughness: .8, side: THREE.DoubleSide, emissive: 0xffb866, emissiveIntensity: .12 })); pant.position.y = 1.58; p.add(pant);
    en(p, new THREE.Mesh(new THREE.SphereGeometry(.06, 12, 12), M.luzCalida), 0, 1.52, 0);
    const charco = new THREE.Mesh(new THREE.CircleGeometry(.75, 32), new THREE.MeshBasicMaterial({ map: brillo, color: 0xffc78a, transparent: true, opacity: .22, depthWrite: false, blending: THREE.AdditiveBlending })); charco.rotation.x = -Math.PI / 2; charco.position.y = .01; p.add(charco);
    lamparas.push({ pant: pant.material, charco: charco.material });
  }
  function estanteria(g, x, z, ry, conCajas) {
    const p = new THREE.Group(); p.position.set(x, 0, z); p.rotation.y = ry; g.add(p);
    [-.42, .42].forEach((sx) => en(p, caja(.04, 1.5, .34, M.madera, .01), sx, .75, 0));
    [.05, .5, .95, 1.4].forEach((y) => en(p, caja(.88, .035, .34, M.madera, .01), 0, y, 0));
    [.08, .53, .98].forEach((y, fila) => {
      if (conCajas && fila < 2) { en(p, caja(.36, .3, .28, M.carton, .01), -.2, y + .15, 0); en(p, caja(.3, .26, .28, M.carton, .01), .2, y + .13, 0); return; }
      let bx = -.38;
      while (bx < .34) { const w = .05 + Math.random() * .04, h = .26 + Math.random() * .12; const l = caja(w, h, .24, new THREE.MeshStandardMaterial({ color: libroCol[Math.floor(Math.random() * libroCol.length)], roughness: .7 }), .005); en(p, l, bx + w / 2, y + .02 + h / 2, 0); if (Math.random() > .82) l.rotation.z = .25; bx += w + .012; }
    });
  }
  function sofa(g, x, z, ry, tela) {
    const p = new THREE.Group(); p.position.set(x, 0, z); p.rotation.y = ry; g.add(p);
    en(p, caja(1.9, .32, .8, tela, .08), 0, .26, 0);
    en(p, caja(1.9, .55, .2, tela, .08), 0, .55, .32);
    [-.88, .88].forEach((sx) => en(p, caja(.2, .45, .8, tela, .08), sx, .38, 0));
    [-.45, .45].forEach((sx) => en(p, caja(.82, .12, .62, tela, .06), sx, .47, -.05));
    [-.82, .82].forEach((sx) => { [-.3, .3].forEach((sz) => en(p, new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .1, 8), M.marco), sx, .05, sz)); });
  }
  function mesaBaja(g, x, z) {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, .05, 32), M.madera); t.position.set(x, .38, z); t.castShadow = true; g.add(t);
    const pie = new THREE.Mesh(new THREE.CylinderGeometry(.05, .12, .36, 12), M.marco); pie.position.set(x, .18, z); g.add(pie);
    const taza = new THREE.Mesh(new THREE.CylinderGeometry(.05, .04, .09, 12), M.maceta); taza.position.set(x + .12, .45, z - .05); g.add(taza);
  }
  function alfombra(g, w, d, x, z, col) {
    const t = canvasTex(256, 256, (c) => { c.fillStyle = hexA(col, .08); c.beginPath(); c.roundRect(4, 4, 248, 248, 40); c.fill(); c.strokeStyle = hexA(col, .22); c.lineWidth = 4; c.beginPath(); c.roundRect(20, 20, 216, 216, 30); c.stroke(); });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: .95 })); m.rotation.x = -Math.PI / 2; m.position.set(x, .006, z); m.receiveShadow = true; g.add(m);
  }
  const zTex = canvasTex(64, 64, (g) => { g.fillStyle = '#d6d8ea'; g.font = '800 46px Manrope, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('z', 32, 34); });
  /* cosas colgadas en la pared del fondo (se dibujan en canvas) */
  function cuadroPared(g, w, h, x, y, z, draw) {
    const t = canvasTex(Math.round(w * 200), Math.round(h * 200), draw);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); m.position.set(x, y, z); g.add(m);
    const fr = caja(w + .08, h + .08, .04, M.marco, .015); fr.position.set(x, y, z - .025); fr.castShadow = false; g.add(fr);
    return { m, t };
  }

  /* ---------- agentes de IA y su puesto ---------- */
  function robot(acento) {
    const r = new THREE.Group();
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.21, .3, 6, 18), M.cuerpo); torso.position.y = .95; torso.castShadow = true; r.add(torso);
    const nucleoMat = new THREE.MeshBasicMaterial({ color: acento, toneMapped: false });
    const nucleo = new THREE.Mesh(new THREE.CircleGeometry(.07, 24), nucleoMat); nucleo.position.set(0, 1.0, .212); r.add(nucleo);
    const nucleoAtras = nucleo.clone(); nucleoAtras.position.z = -.212; nucleoAtras.rotation.y = Math.PI; r.add(nucleoAtras);
    const cuello = new THREE.Group(); cuello.position.y = 1.28; r.add(cuello);
    const cabeza = new THREE.Mesh(new RoundedBoxGeometry(.46, .35, .37, 4, .11), M.cuerpo); cabeza.position.y = .16; cabeza.castShadow = true; cuello.add(cabeza);
    const visor = new THREE.Mesh(new RoundedBoxGeometry(.38, .15, .02, 2, .05), new THREE.MeshBasicMaterial({ color: 0x0d0f1c })); visor.position.set(0, .17, -.186); cuello.add(visor);
    const ojoMat = new THREE.MeshBasicMaterial({ color: acento, toneMapped: false });
    [-.085, .085].forEach((x) => { const o = new THREE.Mesh(new THREE.CapsuleGeometry(.024, .032, 4, 8), ojoMat); o.rotation.z = Math.PI / 2; o.position.set(x, .17, -.2); cuello.add(o); });
    const antena = new THREE.Mesh(new THREE.SphereGeometry(.038, 12, 12), new THREE.MeshBasicMaterial({ color: acento, toneMapped: false })); antena.position.y = .4; cuello.add(antena);
    const palo = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .09), M.oscuro); palo.position.y = .34; cuello.add(palo);
    const acentoMat = new THREE.MeshStandardMaterial({ color: acento, roughness: .35, metalness: .3, emissive: acento, emissiveIntensity: .25 });
    [-1, 1].forEach((sx) => { const oreja = new THREE.Mesh(new THREE.CylinderGeometry(.075, .075, .05, 20), acentoMat); oreja.rotation.z = Math.PI / 2; oreja.position.set(sx * .245, .16, 0); cuello.add(oreja); });
    const cinta = new THREE.Mesh(new THREE.TorusGeometry(.215, .018, 8, 32), acentoMat); cinta.rotation.x = Math.PI / 2; cinta.position.y = .8; r.add(cinta);
    const brazos = [-1, 1].map((s) => {
      const hombro = new THREE.Group(); hombro.position.set(s * .26, 1.1, 0); r.add(hombro);
      const b = new THREE.Mesh(new THREE.CapsuleGeometry(.056, .26, 4, 10), M.cuerpo); b.position.y = -.17; b.castShadow = true; hombro.add(b);
      return hombro;
    });
    return { r, cuello, ojoMat, nucleoMat, antena, brazos };
  }
  function silla() {
    const s = new THREE.Group();
    en(s, caja(.6, .1, .55, M.oscuro, .04), 0, .58, 0);
    en(s, caja(.56, .36, .08, M.oscuro, .04), 0, .8, .26);
    en(s, new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .5), M.oscuro), 0, .3, 0);
    en(s, new THREE.Mesh(new THREE.CylinderGeometry(.28, .3, .04, 20), M.oscuro), 0, .04, 0);
    return s;
  }
  const puestos = new Map(), salas = new Map(), clicables = [orbe, pedestal], autosPared = [];
  /* el logo de cada herramienta, en 3D y con su color: se reconoce la mesa sin leer nada */
  const colorDe = (a) => (a.icono && window.PB_ICONS && window.PB_ICONS.brands && window.PB_ICONS.brands[a.icono] && window.PB_ICONS.brands[a.icono].bg) || (PROPIOS[a.icono] && (a.id === 'redactor' ? '#D97757' : a.id === 'cerebro' ? '#9C93FF' : (DEPTS.find((d) => d.id === a.dept) || {}).color)) || '#9C93FF';
  const geoLogos = new Map();
  function geoLogo(k) {
    if (geoLogos.has(k)) return geoLogos.get(k);
    const dd = brand(k); if (!dd) return null;
    const data = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path transform="matrix(1 0 0 -1 0 24)" d="${dd}"/></svg>`);
    const shapes = []; data.paths.forEach((pa) => shapes.push(...SVGLoader.createShapes(pa)));
    const geo = new THREE.ExtrudeGeometry(shapes, { depth: 2.6, bevelEnabled: true, bevelThickness: .5, bevelSize: .3, bevelSegments: 3, curveSegments: 14 });
    geo.center(); geo.scale(.034, .034, .034); geo.computeVertexNormals();
    geoLogos.set(k, geo); return geo;
  }
  const alfNeutra = canvasTex(256, 256, (c) => { c.fillStyle = 'rgba(255,255,255,.10)'; c.beginPath(); c.roundRect(4, 4, 248, 248, 36); c.fill(); c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 5; c.beginPath(); c.roundRect(6, 6, 244, 244, 34); c.stroke(); });
  const brilloCal = canvasTex(128, 128, (c) => { const r = c.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,214,150,.9)'); r.addColorStop(1, 'rgba(255,214,150,0)'); c.fillStyle = r; c.fillRect(0, 0, 128, 128); });
  const datoTex = canvasTex(64, 64, (c) => { c.fillStyle = '#3DDC84'; c.beginPath(); c.roundRect(14, 26, 36, 12, 6); c.fill(); });
  function puesto(g, d, a, x) {
    const bc = colorDe(a), BC = new THREE.Color(bc);
    const p = new THREE.Group(); p.position.set(x, 0, -.6); g.add(p);
    en(p, caja(1.9, .08, .95, M.mesa, .03), 0, .74, 0);
    [-.85, .85].forEach((lx) => { const l = new THREE.Mesh(new THREE.BoxGeometry(.06, .74, .85), M.marco); l.position.set(lx, .37, 0); l.castShadow = true; p.add(l); });
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 320;
    const ptex = new THREE.CanvasTexture(cv); ptex.colorSpace = THREE.SRGBColorSpace; ptex.anisotropy = 4;
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.36, .85), new THREE.MeshBasicMaterial({ map: ptex, toneMapped: false })); scr.position.set(0, 1.47, -.24); p.add(scr);
    const fr = caja(1.46, .95, .05, M.marco, .02); fr.position.set(0, 1.47, -.28); p.add(fr);
    const stand = new THREE.Mesh(new THREE.BoxGeometry(.08, .48, .06), M.marco); stand.position.set(0, .98, -.28); p.add(stand);
    en(p, caja(.6, .025, .2, M.marco, .01), 0, .79, .12);
    const taza = new THREE.Mesh(new THREE.CylinderGeometry(.045, .038, .1, 12), M.maceta); taza.position.set(.68, .83, .15); p.add(taza);
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(1.8, .9), new THREE.MeshBasicMaterial({ color: new THREE.Color(COL_EST.trabajando), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    halo.rotation.x = -Math.PI / 2; halo.position.set(0, .785, .02); p.add(halo);
    const ch = silla(); ch.position.set(0, 0, .85); p.add(ch);
    /* cubículo: mampara baja de cristal detrás del monitor y a los lados, con canto de madera arriba */
    [[0, -.62, 2.05, 0], [-1.02, -.12, 1.0, Math.PI / 2], [1.02, -.12, 1.0, Math.PI / 2]].forEach(([mx, mz, ancho, rot]) => {
      const vid = new THREE.Mesh(new THREE.PlaneGeometry(ancho, .62), M.cristal); vid.position.set(mx, 1.06, mz); vid.rotation.y = rot; p.add(vid);
      const cant = new THREE.Mesh(new THREE.BoxGeometry(ancho, .035, .045), M.canto); cant.position.set(mx, 1.385, mz); cant.rotation.y = rot; p.add(cant);
    });
    sombra(p, 0, .15, 2.4, 2.1);
    const tiraMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(COL_EST.dormido), toneMapped: false });
    en(p, new THREE.Mesh(new THREE.BoxGeometry(1.86, .025, .025), tiraMat), 0, .705, .48);
    /* alfombrilla neutra (blanca en la textura) que se tiñe con el color del estado */
    const pad = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 2.5), new THREE.MeshBasicMaterial({ map: alfNeutra, color: new THREE.Color(COL_EST.dormido), transparent: true, opacity: .4, depthWrite: false, toneMapped: false })); pad.userData.esPad = true; pad.rotation.x = -Math.PI / 2; pad.position.set(0, .006, .35); p.add(pad);
    /* holograma: proyector encima del monitor, cono de luz y el logo flotando */
    en(p, caja(.26, .05, .1, M.marco, .015), 0, 1.97, -.31);
    en(p, new THREE.Mesh(new THREE.CircleGeometry(.05, 16), new THREE.MeshBasicMaterial({ color: BC, toneMapped: false })), 0, 2.0, -.31).rotation.x = -Math.PI / 2;
    const cono = new THREE.Mesh(new THREE.CylinderGeometry(.5, .06, .5, 32, 1, true), new THREE.MeshBasicMaterial({ color: BC, transparent: true, opacity: .1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); cono.position.set(0, 2.24, -.28); p.add(cono);
    const logoMat = new THREE.MeshStandardMaterial({ color: BC, emissive: BC, emissiveIntensity: .55, metalness: .25, roughness: .3 });
    const lg = geoLogo(a.icono); const logo = lg ? new THREE.Mesh(lg, logoMat) : new THREE.Mesh(new THREE.OctahedronGeometry(.3), logoMat);
    logo.position.set(0, 2.82, -.28); logo.castShadow = true; p.add(logo);
    /* barra de luz de monitor: va sujeta encima de la pantalla y alumbra el teclado cuando el bot trabaja */
    en(p, caja(1.02, .04, .07, M.marco, .015), 0, 1.985, -.19);
    en(p, new THREE.Mesh(new THREE.BoxGeometry(.05, .07, .09), M.marco), 0, 1.955, -.235);
    const bombillaMat = new THREE.MeshBasicMaterial({ color: 0x2a2d40, toneMapped: false });
    const tiraLuz = new THREE.Mesh(new THREE.BoxGeometry(.94, .016, .012), bombillaMat); tiraLuz.position.set(0, 1.972, -.152); p.add(tiraLuz);
    const brilloBarra = new THREE.Sprite(new THREE.SpriteMaterial({ map: brilloCal, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); brilloBarra.scale.set(1.5, .32, 1); brilloBarra.position.set(0, 1.95, -.12); p.add(brilloBarra);
    const charcoF = new THREE.Mesh(new THREE.PlaneGeometry(1.5, .75), new THREE.MeshBasicMaterial({ map: brilloCal, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); charcoF.rotation.x = -Math.PI / 2; charcoF.position.set(0, .787, .08); p.add(charcoF);
    const tecladoMat = new THREE.MeshBasicMaterial({ color: 0x14172a, toneMapped: false });
    const teclas = new THREE.Mesh(new THREE.PlaneGeometry(.54, .15), tecladoMat); teclas.rotation.x = -Math.PI / 2; teclas.position.set(0, .804, .12); p.add(teclas);
    const datos = [0, 1, 2, 3].map((k) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: datoTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); sp.scale.setScalar(.16); p.add(sp); return { sp, o: k / 4, x: (k - 1.5) * .28 }; });
    const rb = robot(new THREE.Color('#9C93FF')); rb.r.position.set(0, -.08, .74); rb.r.scale.setScalar(.95); p.add(rb.r);
    const baliza = new THREE.Mesh(new THREE.SphereGeometry(.12, 16, 16), new THREE.MeshBasicMaterial({ color: 0xFF5E6C, toneMapped: false })); baliza.position.set(.64, 2.08, -.27); baliza.visible = false; p.add(baliza);
    const zs = [0, 1, 2].map((k) => { const z = new THREE.Sprite(new THREE.SpriteMaterial({ map: zTex, transparent: true, opacity: 0, depthWrite: false })); z.scale.setScalar(.25); p.add(z); return { z, o: k / 3 }; });
    const o = { p, scr, ctx: cv.getContext('2d'), tex: ptex, halo, baliza, zs, rb, ch, a, d, hl: 0, col: bc, logo, logoMat, cono, pad, tiraMat, bombillaMat, charcoF, brilloBarra, tecladoMat, datos, luz: 0, t0: Math.random() * 6, linea: null };
    p.traverse((n) => { if (n.isMesh) { n.userData.puesto = o; clicables.push(n); } });
    dibujaPantalla(o, 0);
    return o;
  }

  /* ---------- distribución: salas redondas en anillo alrededor del núcleo ---------- */
  const ALTO = .32;

  /* ---------- plaza central: el núcleo sobre su plataforma; a cada sala llega su cable de datos ---------- */
  const PLAZA = 4.6;
  const plazaTex = canvasTex(1024, 1024, (c) => {
    c.fillStyle = '#0d0f20'; c.fillRect(0, 0, 1024, 1024);
    c.strokeStyle = 'rgba(156,147,255,.09)'; c.lineWidth = 2;
    [180, 300, 420, 500].forEach((r) => { c.beginPath(); c.arc(512, 512, r, 0, Math.PI * 2); c.stroke(); });
    for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2; c.beginPath(); c.moveTo(512 + Math.cos(a) * 300, 512 + Math.sin(a) * 300); c.lineTo(512 + Math.cos(a) * (i % 4 ? 420 : 500), 512 + Math.sin(a) * (i % 4 ? 420 : 500)); c.stroke(); }
  });
  const plaza = new THREE.Mesh(new THREE.CylinderGeometry(PLAZA, PLAZA + .08, .1, 96), [new THREE.MeshStandardMaterial({ color: 0x14172e, roughness: .4, metalness: .5 }), new THREE.MeshStandardMaterial({ map: plazaTex, roughness: .45, metalness: .45 }), new THREE.MeshStandardMaterial({ color: 0x14172e })]);
  plaza.position.y = .05; plaza.receiveShadow = true; scene.add(plaza);
  const plazaFilo = new THREE.Mesh(new THREE.TorusGeometry(PLAZA + .02, .025, 8, 160), new THREE.MeshBasicMaterial({ color: 0x9C93FF, toneMapped: false })); plazaFilo.rotation.x = Math.PI / 2; plazaFilo.position.y = .1; scene.add(plazaFilo);
  /* Cada departamento es una sala redonda alrededor de su COLUMNA DE ENERGÍA (el servidor): el cable del núcleo llega
     al cristal de arriba y de la columna sale un rayo por el suelo hasta cada agente que trabaja.
     Las salas se reparten en anillo alrededor del núcleo; las que tienen bots ocupan los sitios de delante. */
  const maxAg = Math.max(1, ...DEPTS.map((d) => (d.activo ? agsDe(d.id).length : 0)));
  const RD = Math.max(2.5, 1.6 + maxAg * .35);       // radio del círculo de mesas
  const RSALA = RD + 1.8;                              // radio de la plataforma
  const RANILLO = PLAZA + RSALA + 2.4;                 // distancia del núcleo al centro de cada sala
  const ESC_VACIA = .55, RVACIA = RSALA * ESC_VACIA;   // las salas sin agentes, en pequeño
  const ALTA = 3.1;                                    // altura de la columna de energía
  const nS = DEPTS.length, paso = Math.PI * 2 / nS;
  const nAct = DEPTS.filter((d) => d.activo).length;
  const desfase = nAct % 2 === 0 ? .5 : 0;             // con un número par de salas activas, quedan simétricas a los lados del frente
  const huecos = [...Array(nS).keys()].map((i) => (i + desfase) * paso).sort((a, b) => Math.cos(b) - Math.cos(a) || Math.sin(a) - Math.sin(b));
  const ordenSalas = [...DEPTS].sort((a, b) => (b.activo ? 1 : 0) - (a.activo ? 1 : 0));
  /* reparto de los dos más cercanos al frente: izquierda y derecha en el orden de la lista */
  const sitio = new Map();
  ordenSalas.forEach((d, i) => { const a = huecos[i], r = d.activo ? RANILLO : PLAZA + RVACIA + 2.2; sitio.set(d.id, { x: Math.sin(a) * r, z: Math.cos(a) * r }); });
  // Suelo de oficina tecnológica para las salas con agentes: baldosas grandes de grafito pulido con juntas finas,
  // alguna tira de luz del color de la sala entre baldosas y un anillo suave alrededor de las mesas.
  const sueloTec = (col) => canvasTex(1024, 1024, (c) => {
    const T = 128, tonos = ['#232b47', '#262f4d', '#212942', '#29324f'];
    for (let fy = 0; fy < 8; fy++) for (let fx = 0; fx < 8; fx++) {
      c.fillStyle = tonos[(fx * 3 + fy * 5) % tonos.length]; c.fillRect(fx * T, fy * T, T, T);
      const g = c.createLinearGradient(fx * T, fy * T, fx * T + T, fy * T + T); g.addColorStop(0, 'rgba(255,255,255,.06)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(fx * T, fy * T, T, T);
    }
    c.fillStyle = '#0e1222'; for (let k = 0; k <= 8; k++) { c.fillRect(k * T - 2, 0, 3, 1024); c.fillRect(0, k * T - 2, 1024, 3); }
    c.fillStyle = 'rgba(255,255,255,.08)'; for (let k = 0; k <= 8; k++) { c.fillRect(k * T + 1, 0, 1, 1024); c.fillRect(0, k * T + 1, 1024, 1); }
    // tiras de luz entre algunas baldosas (como suelo técnico con LED)
    c.fillStyle = hexA(col, .75);
    [[1, 2, 3, 'h'], [5, 1, 2, 'v'], [6, 5, 2, 'h'], [2, 5, 2, 'v'], [3, 7, 2, 'h']].forEach(([x, y, n, o]) => { if (o === 'h') c.fillRect(x * T, y * T - 2, n * T, 3); else c.fillRect(x * T - 2, y * T, 3, n * T); });
    // anillo suave alrededor de las mesas y viñeta hacia el borde
    c.strokeStyle = hexA(col, .28); c.lineWidth = 4; c.beginPath(); c.arc(512, 512, 330, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = hexA(col, .08); c.lineWidth = 2; c.beginPath(); c.arc(512, 512, 150, 0, Math.PI * 2); c.stroke();
    const v = c.createRadialGradient(512, 512, 200, 512, 512, 512); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.25)'); c.fillStyle = v; c.fillRect(0, 0, 1024, 1024);
  });
  const sueloSala = canvasTex(512, 512, (c) => {
    c.fillStyle = '#141731'; c.fillRect(0, 0, 512, 512);
    c.strokeStyle = 'rgba(255,255,255,.06)'; c.lineWidth = 2;
    [70, 150, 230].forEach((r) => { c.beginPath(); c.arc(256, 256, r, 0, Math.PI * 2); c.stroke(); });
  });
  const metalCol = new THREE.MeshStandardMaterial({ color: 0x0d1020, roughness: .3, metalness: .75 });
  ordenSalas.forEach((d) => {
    const lista = d.activo ? agsDe(d.id) : [];
    const esc = d.activo ? 1 : ESC_VACIA, RS = RSALA * esc;
    const W = RS * 2;
    const { x, z } = sitio.get(d.id);
    const col = new THREE.Color(d.color), on = d.activo;
    /* plataforma redonda con su filo de luz */
    const plat = new THREE.Mesh(new THREE.CylinderGeometry(RS, RS + .1, ALTO, 72), [new THREE.MeshStandardMaterial({ color: on ? 0x171b36 : 0x141730, roughness: .5, metalness: .35 }), new THREE.MeshStandardMaterial({ map: on ? sueloTec(d.color) : sueloSala, roughness: on ? .42 : .55, metalness: on ? .12 : .3 }), new THREE.MeshStandardMaterial({ color: 0x101225 })]);
    plat.position.set(x, ALTO / 2, z); scene.add(plat);
    const banda = new THREE.Mesh(new THREE.TorusGeometry(RS + .02, .03, 8, 120), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: on ? .85 : .25, toneMapped: false }));
    banda.rotation.x = Math.PI / 2; banda.position.set(x, ALTO - .02, z); scene.add(banda); const bandaBase = on ? .85 : .25;
    const g = new THREE.Group(); g.position.set(x, ALTO, z); g.scale.setScalar(esc); scene.add(g);
    /* la columna de energía: base, cuerpo con luces de servidor, aros del color de la sala y el cristal que recibe el cable */
    sombra(g, 0, 0, 2.2, 2.2, .006);
    const baseCol = en(g, new THREE.Mesh(new THREE.CylinderGeometry(.85, .95, .16, 48), metalCol), 0, .08, 0);
    const rackCv = document.createElement('canvas'); rackCv.width = 64; rackCv.height = 160;
    const rackTex = new THREE.CanvasTexture(rackCv); rackTex.colorSpace = THREE.SRGBColorSpace; rackTex.magFilter = THREE.NearestFilter;
    rackTex.wrapS = THREE.RepeatWrapping; rackTex.repeat.set(5, 1);
    const cuerpo = new THREE.Mesh(new THREE.CylinderGeometry(.42, .5, ALTA - .5, 40, 1, true), [new THREE.MeshBasicMaterial({ map: rackTex, toneMapped: false })]);
    cuerpo.position.y = .16 + (ALTA - .5) / 2; g.add(cuerpo);
    const ledsSala = { ctx: rackCv.getContext('2d'), tex: rackTex };
    const tiraRack = new THREE.MeshBasicMaterial({ color: col, toneMapped: false, transparent: true, opacity: on ? .5 : 0 });
    const aros = [.55, 1.35, 2.15].map((yy) => { const aro = new THREE.Mesh(new THREE.TorusGeometry(.5, .03, 8, 48), tiraRack); aro.rotation.x = Math.PI / 2; aro.position.y = yy; g.add(aro); return aro; });
    const tapa = new THREE.Mesh(new THREE.CylinderGeometry(.32, .42, .22, 40), metalCol); tapa.position.y = ALTA - .23; g.add(tapa);
    const recMat = new THREE.MeshBasicMaterial({ color: on ? col : new THREE.Color('#2e3146'), toneMapped: false, transparent: true, opacity: on ? .95 : .8 });
    const cristal = new THREE.Mesh(new THREE.OctahedronGeometry(.26, 0), recMat); cristal.position.y = ALTA + .18; cristal.scale.y = 1.4; g.add(cristal);
    const destello = new THREE.Sprite(new THREE.SpriteMaterial({ map: brillo, color: col, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); destello.scale.setScalar(1.4); destello.position.y = ALTA + .18; g.add(destello);
    const auraCol = new THREE.Sprite(new THREE.SpriteMaterial({ map: brillo, color: col, transparent: true, opacity: on ? .22 : 0, depthWrite: false, blending: THREE.AdditiveBlending })); auraCol.scale.set(1.6, ALTA * 1.2, 1); auraCol.position.y = ALTA / 2; g.add(auraCol);
    /* la columna es el servidor de la sala: al pincharla, resumen con IA de lo que han hecho hoy sus agentes */
    [baseCol, cuerpo, ...aros, tapa, cristal].forEach((m) => { m.userData.sala = d; m.userData.servidor = d.id; clicables.push(m); });
    /* cartel en el borde trasero de la sala, de cara a quien mira: así nunca tapa a los agentes */
    const sign = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, toneMapped: false, depthWrite: false })); sign.scale.set(4.4, 1.1, 1); sign.position.set(0, 1.1, -RSALA - .15); sign.center.set(.5, 0); g.add(sign);
    sign.userData.sala = d; plat.userData.sala = d; clicables.push(sign, plat);
    /* cable del núcleo al cristal de la columna */
    const fin = new THREE.Vector3(x, ALTO + (ALTA + .18) * esc, z);
    const dir = fin.clone().sub(NUC).setY(0).normalize();
    const ini = NUC.clone().add(dir.clone().multiplyScalar(1.3)).add(new THREE.Vector3(0, .15, 0));
    const tronco = cable(new THREE.CubicBezierCurve3(ini, ini.clone().add(dir.clone().multiplyScalar(2.6)).add(new THREE.Vector3(0, 1.4, 0)), fin.clone().add(new THREE.Vector3(0, 1.8, 0)).sub(dir.clone().multiplyScalar(1.4)), fin), on ? d.color : '#3a3d52', on ? .046 : .02, on ? 5 : 0);
    if (!on) [tronco.alma, tronco.halo].forEach((m) => { m.material.uniforms.uP.value = 0; m.material.uniforms.uA.value.set('#2e3146'); m.material.uniforms.uB.value.set('#2e3146'); });
    const conector = new THREE.Mesh(new THREE.TorusGeometry(.1, .025, 10, 28), new THREE.MeshBasicMaterial({ color: on ? col : new THREE.Color('#3a3d52'), toneMapped: false, transparent: true, opacity: on ? 1 : .6 }));
    conector.position.copy(ini); conector.lookAt(ini.clone().add(dir)); scene.add(conector);
    /* lo que identifica a las salas sin bots, en un panel detrás de la columna */
    const atras = -RD - .2;
    const panelPie = (px, ancho) => { en(g, new THREE.Mesh(new THREE.BoxGeometry(.06, 1.05, .06), M.marco), px - ancho * .35, .52, atras - .03); en(g, new THREE.Mesh(new THREE.BoxGeometry(.06, 1.05, .06), M.marco), px + ancho * .35, .52, atras - .03); };
    const s = { d, g, sign, esc, W, tronco, ledsSala, reloj: null, bus: null, banda, bandaBase, destello, tiraRack, recMat, flash: 0, cristal, auraCol };
    tronco.sala = s;
    salas.set(d.id, s);
    /* los agentes en círculo alrededor de la columna, mirando hacia ella; el primero, de cara a la cámara */
    const Y = ALTO + .012;
    lista.forEach((a, i) => {
      const phi = lista.length === 1 ? 0 : (i - (lista.length - 1) / 2) * (Math.PI * 2 / lista.length) * (lista.length === 2 ? .5 : 1);
      const o = puesto(g, d, a, 0); puestos.set(a.id, o);
      o.p.position.set(Math.sin(phi) * RD, 0, Math.cos(phi) * RD); o.p.rotation.y = phi; o.phi = phi; o.RD = RD;
      /* rayo de energía de la columna a la mesa, por el suelo: se enciende cuando ese agente trabaja */
      const r0 = .98, r1 = RD - .55;
      o.linea = cable(new THREE.LineCurve3(new THREE.Vector3(x + Math.sin(phi) * r0, Y, z + Math.cos(phi) * r0), new THREE.Vector3(x + Math.sin(phi) * r1, Y, z + Math.cos(phi) * r1)), COL_EST.trabajando, .022, 0);
      o.linea.alma.material.uniforms.uN.value = 2; o.linea.halo.material.uniforms.uN.value = 2;
      o.linea.alma.material.uniforms.uA.value.set(d.color); o.linea.halo.material.uniforms.uA.value.set(d.color);
      const nodoMat = new THREE.MeshBasicMaterial({ color: COL_EST.dormido, toneMapped: false, transparent: true, opacity: .9 });
      const nodoM = new THREE.Mesh(new THREE.RingGeometry(.09, .13, 32), nodoMat); nodoM.rotation.x = -Math.PI / 2; nodoM.position.set(x + Math.sin(phi) * r1, Y + .004, z + Math.cos(phi) * r1); scene.add(nodoM);
      o.nodoMat = nodoMat;
    });
  });
  /* encuadre de la vista general a partir de lo que ocupa la oficina */
  const cajaVista = new THREE.Box3(); salas.forEach((s) => cajaVista.expandByObject(s.g)); cajaVista.expandByPoint(new THREE.Vector3(-PLAZA, 0, -PLAZA)); cajaVista.expandByPoint(new THREE.Vector3(PLAZA, 0, PLAZA));
  const HOME = { p: new THREE.Vector3(), t: new THREE.Vector3() };
  const camPrueba = new THREE.PerspectiveCamera();
  const encajar = () => {
    const c = cajaVista.getCenter(new THREE.Vector3());
    /* las esquinas reales de cada sala (con su cartel) y de la plaza: una caja que lo envolviera todo
       metería esquinas vacías cerca de la cámara y alejaría la vista sin necesidad */
    const esquinas = [];
    salas.forEach((sa) => { const b = new THREE.Box3().setFromObject(sa.g); [b.min.x, b.max.x].forEach((ex) => [0, b.max.y].forEach((ey) => [b.min.z, b.max.z].forEach((ez) => esquinas.push(new THREE.Vector3(ex, ey, ez))))); });
    [[-PLAZA, 0], [PLAZA, 0], [0, PLAZA], [0, -PLAZA]].forEach(([ex, ez]) => esquinas.push(new THREE.Vector3(ex, 0, ez)));
    const retrato = camera.aspect < .9;
    const t0 = retrato ? new THREE.Vector3(c.x, 0, c.z - .6) : new THREE.Vector3(c.x, 0, c.z - 1.2);
    const dir = (retrato ? new THREE.Vector3(0, .9, .44) : new THREE.Vector3(0, .6, .8)).normalize();
    camPrueba.fov = camera.fov; camPrueba.aspect = camera.aspect; camPrueba.near = .1; camPrueba.far = 1000; camPrueba.updateProjectionMatrix();
    const cabe = (dd) => { camPrueba.position.copy(t0).addScaledVector(dir, dd); camPrueba.lookAt(t0); camPrueba.updateMatrixWorld(); return esquinas.every((v) => { const q = v.clone().project(camPrueba); return Math.abs(q.x) < .96 && q.y < .88 && q.y > -.92; }); };
    /* distancia justa para que quepa todo y, después, centrado en vertical (se repite porque una cosa afecta a la otra) */
    let dist = 60;
    for (let vuelta = 0; vuelta < 4; vuelta++) {
      let lo = 4, hi = 400; for (let k = 0; k < 24; k++) { const mid = (lo + hi) / 2; if (cabe(mid)) hi = mid; else lo = mid; }
      dist = hi; cabe(dist);
      const ys = esquinas.map((v) => v.clone().project(camPrueba).y), centroY = (Math.max(...ys) + Math.min(...ys)) / 2 - .02;
      if (Math.abs(centroY) < .01) break;
      t0.z -= centroY * dist * .45;
    }
    /* un poco a la derecha, para que la tarjeta de avisos de arriba a la izquierda no tape ninguna sala */
    const dx = 0;
    /* en vertical (móvil) la vista es más cenital, para aprovechar el alto de la pantalla */
    HOME.t.copy(t0); HOME.p.copy(t0).addScaledVector(dir, dist); HOME.t.x += dx; HOME.p.x += dx; HOME.dist = dist;
    /* la niebla empieza detrás de la oficina, así no se come las salas cuando la cámara está lejos */
    scene.fog.near = dist * 1.05 + 6; scene.fog.far = dist * 2.1 + 30; camera.far = dist * 3 + 60; camera.updateProjectionMatrix();
  };
  camera.aspect = W0() / H0(); camera.updateProjectionMatrix(); encajar();
  camera.position.copy(HOME.p).add(new THREE.Vector3(0, 10, 10));
  const target = HOME.t.clone(); camera.lookAt(target);
  const sb = cajaVista.clone().expandByScalar(4); Object.assign(sun.shadow.camera, { left: sb.min.x - 8, right: sb.max.x + 8, top: sb.max.z + 10, bottom: sb.min.z - 10 }); sun.shadow.camera.updateProjectionMatrix();

  function dibujaAuto(o) {
    const g = o.ctx, a = ag2(o.a.id) || o.a; o.a = a;
    const [c, txt] = ST[a.st] || ST.espera;
    g.fillStyle = '#0d1024'; g.fillRect(0, 0, 512, 300);
    g.fillStyle = hexA(o.d.color, .18); g.beginPath(); g.roundRect(30, 40, 120, 120, 30); g.fill();
    g.save(); g.translate(54, 64); g.scale(3, 3); g.strokeStyle = o.d.color; g.lineWidth = 2; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(new Path2D(GLIFOS[a.glifo] || GLIFOS.flow)); g.restore();
    g.fillStyle = '#FFFFFF'; g.font = '800 40px Manrope, sans-serif'; g.fillText(a.nombre, 174, 92);
    g.fillStyle = c; g.beginPath(); g.arc(184, 132, 9, 0, 7); g.fill();
    g.fillStyle = '#C9CBDA'; g.font = '600 26px Manrope, sans-serif'; g.fillText(a.st === 'espera' ? 'Atento' : txt, 202, 141);
    const dato = (a.datos || [])[0];
    if (dato) { g.fillStyle = 'rgba(255,255,255,.06)'; g.beginPath(); g.roundRect(30, 196, 452, 70, 16); g.fill(); g.fillStyle = '#8C8FA3'; g.font = '600 24px Manrope, sans-serif'; g.fillText(dato[0], 52, 240); g.fillStyle = '#FFFFFF'; g.font = '800 30px Manrope, sans-serif'; g.textAlign = 'right'; g.fillText(dato[1], 460, 242); g.textAlign = 'left'; }
    o.tx.needsUpdate = true;
  }
  const ag2 = (id) => S.autos.find((a) => a.id === id);
  /* de noche la oficina se oscurece y se encienden las lámparas (hora del ordenador de quien mira) */
  function luzDelDia() {
    const ah = new Date(), h = ah.getHours() + ah.getMinutes() / 60;
    const noche = h < 7 || h >= 21 ? 1 : h < 8.5 ? (8.5 - h) / 1.5 : h > 19.5 ? (h - 19.5) / 1.5 : 0;
    hemi.intensity = 1.3 - .45 * noche; sun.intensity = 1.35 - .75 * noche; renderer.toneMappingExposure = 1.2 - .1 * noche;
    const fondo = new THREE.Color(0x0c1230).lerp(new THREE.Color(0x05060c), noche); scene.background.copy(fondo); scene.fog.color.copy(fondo);
    lamparas.forEach((l) => { l.pant.emissiveIntensity = .12 + .55 * noche; l.charco.opacity = .18 + .3 * noche; });
  }
  const flotantes = [];
  const avisoTex = canvasTex(128, 128, (c) => {
    c.fillStyle = '#FFB547'; c.beginPath(); c.arc(64, 64, 50, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#1b1204'; c.font = '900 76px Manrope, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('!', 64, 70);
  });
  function marcaAviso(o, on) {
    if (on && !o.aviso) {
      o.aviso = new THREE.Sprite(new THREE.SpriteMaterial({ map: avisoTex, transparent: true, depthWrite: false, toneMapped: false }));
      o.aviso.scale.setScalar(.42); o.aviso.position.set(.62, 3.25, -.28); o.aviso.userData.puesto = o; o.p.add(o.aviso); clicables.push(o.aviso);
    }
    if (o.aviso) o.aviso.visible = !!on;
  }
  const listoTex = canvasTex(128, 128, (c) => {
    c.fillStyle = '#3DDC84'; c.beginPath(); c.arc(64, 60, 46, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(50, 100); c.lineTo(64, 122); c.lineTo(78, 100); c.fill();
    c.strokeStyle = '#06210f'; c.lineWidth = 11; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(42, 62); c.lineTo(58, 78); c.lineTo(87, 46); c.stroke();
  });
  function listo(o) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: listoTex, transparent: true, depthWrite: false, toneMapped: false }));
    sp.scale.setScalar(.62); o.logo.getWorldPosition(sp.position); sp.position.y += .7; scene.add(sp); flotantes.push({ sp, k: 0, propio: true });
  }

  /* ---------- fichas encima de cada agente: qué hace, cuánto lleva y cuándo entrega o recibe ---------- */
  // Progreso real: cupo del día, provincia «19 de 52» o tiempo de su turno de 45 min. null si no se puede saber.
  function progreso(a) {
    if (a.st !== 'trabajando') return null;
    if (a.cupo) return Math.min(100, Math.round(a.hoy / a.cupo * 100));
    const ult = (a.actividad || [])[0];
    const m = ult && /\((\d+) de (\d+)\)/.exec(ult.txt);
    if (m) return Math.round(+m[1] / +m[2] * 100);
    const ini = (a.actividad || []).find((e) => /^Empieza/.test(e.txt));
    if (ini) return Math.max(3, Math.min(97, Math.round((Date.now() - new Date(String(ini.ts).replace(' ', 'T'))) / 27e3)));
    return null;
  }
  const corta = (t, n) => { t = String(t || '').replace(/^(Empieza|Termina|Encargo del Jefe):\s*/u, '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t; };
  // Borde de progreso sobre el rectángulo del suelo de cada mesa: se va encendiendo en tiempo real; lo apagado es lo que le queda.
  // Una cinta plana que recorre el contorno redondeado; drawRange enseña solo el tramo hecho.
  function cintaBorde(w, h, r, ancho) {
    const pts = [], seg = 220, per = 2 * (w + h - 4 * r) + 2 * Math.PI * r;
    const punto = (d) => {   // empieza en el centro del lado de delante y va en sentido horario visto desde arriba
      const tramos = [[w / 2 - r, 'l', [0, h / 2], [-1, 0]], [Math.PI * r / 2, 'a', [-w / 2 + r, h / 2 - r], Math.PI / 2], [h - 2 * r, 'l', [-w / 2, h / 2 - r], [0, -1]],
        [Math.PI * r / 2, 'a', [-w / 2 + r, -h / 2 + r], Math.PI], [w - 2 * r, 'l', [-w / 2 + r, -h / 2], [1, 0]], [Math.PI * r / 2, 'a', [w / 2 - r, -h / 2 + r], -Math.PI / 2],
        [h - 2 * r, 'l', [w / 2, -h / 2 + r], [0, 1]], [Math.PI * r / 2, 'a', [w / 2 - r, h / 2 - r], 0], [w / 2 - r, 'l', [w / 2 - r, h / 2], [-1, 0]]];
      for (const [L, t, o, x] of tramos) {
        if (d <= L + 1e-9) {
          if (t === 'l') return [o[0] + x[0] * d, o[1] + x[1] * d];
          const a = x + d / r; return [o[0] + Math.cos(a) * r, o[1] + Math.sin(a) * r];
        }
        d -= L;
      }
      return [0, h / 2];   // la vuelta completa acaba donde empezó
    };
    for (let k = 0; k <= seg; k++) pts.push(punto(per * k / seg));
    const pos = [], idx = [];
    pts.forEach(([x, z], k) => {
      const [x2, z2] = pts[Math.min(seg, k + 1)], [x0, z0] = pts[Math.max(0, k - 1)];
      let nx = -(z2 - z0), nz = x2 - x0; const l = Math.hypot(nx, nz) || 1; nx /= l; nz /= l;
      pos.push(x + nx * ancho / 2, 0, z + nz * ancho / 2, x - nx * ancho / 2, 0, z - nz * ancho / 2);
      if (k < seg) idx.push(2 * k, 2 * k + 1, 2 * k + 2, 2 * k + 1, 2 * k + 3, 2 * k + 2);
    });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
    g.userData.n = seg * 6; return g;
  }
  function pintaAnillo(o) {
    if (!o.anillo) {
      const geo = cintaBorde(2.46, 2.66, .34, .1);
      const mat = (c, op) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
      const pista = new THREE.Mesh(geo, mat(0xffffff, 0)), arco = new THREE.Mesh(geo.clone(), mat(0xFFB547, 0));
      [pista, arco].forEach((m, k) => { m.position.set(0, .012 + k * .002, .35); o.p.add(m); });
      o.anillo = { pista, arco, op: 0, val: 0, gira: 0 };
    }
    const trab = o.a.st === 'trabajando', pc = trab ? progreso(o.a) : null, an = o.anillo;
    an.indet = trab && pc == null;
    if (pc != null) an.val += (pc / 100 - an.val) * .08;   // se mueve suave hacia el valor de ahora
    return trab;
  }

  /* ---------- traspasos: lo que un agente le pasa a otro, sacado de su historial real ---------- */
  // De quién a quién y con qué etiqueta. Cada regla mira la actividad de un agente y dice si es una entrega.
  const REGLAS = [
    (a, e) => a.dept === 'geo' && a.id !== 'geo_jefe' && /^Encargo del Jefe:\s*/u.test(e.txt) ? ['geo_jefe', a.id, corta(e.txt, 30)] : null,
    (a, e) => {
      const m = a.dept === 'geo' && /^Encargo a ([\p{L} ]+?):/u.exec(e.txt);
      const b = m && S.agentes.find((x) => x.dept === 'geo' && x.nombre.toLowerCase().replace(/ geo$/, '') === m[1].trim().toLowerCase().replace(/^(el|la) /, ''));
      return b && b.id !== a.id ? [a.id, b.id, corta(e.txt.replace(/^Encargo a [^:]+:\s*/u, ''), 30)] : null;
    },
    (a, e) => { const m = a.id === 'cerebro' && /^Aviso a (WhatsApp|Redactor|Email):\s*/u.exec(e.txt); return m ? ['cerebro', m[1].toLowerCase(), corta(e.txt.slice(m[0].length), 30)] : null; },
    (a, e) => a.id === 'geo_vigia' && /^Termina/u.test(e.txt) ? ['geo_vigia', 'geo_jefe', 'Novedades del día'] : null,
    (a, e) => a.id === 'geo_medicion' && /^Termina/u.test(e.txt) ? ['geo_medicion', 'geo_jefe', 'Informe de medición'] : null,
    (a, e) => {
      if (a.id !== 'scraper') return null;
      const m = /(\d+) útiles \((\d+) con móvil, (\d+) con email/u.exec(e.txt);
      if (!m || !+m[1]) return null;
      return +m[2] ? ['scraper', 'whatsapp', m[2] + (+m[2] === 1 ? ' empresa nueva' : ' empresas nuevas')] : +m[3] ? ['scraper', 'email', m[3] + ' empresas para email'] : null;
    },
  ];
  // Solo se pasan trabajo dos agentes despiertos: un documento nunca sale de (ni llega a) una mesa que duerme
  const despiertos = (x) => [x.de, x.a].every((id) => { const a = ag(id); return a && ['trabajando', 'espera'].includes(a.st); });
  const vistosTr = new Set(); let colaTr = [], ultimoTr = 0, recientesTr = [];
  function buscaTraspasos() {
    const lista = [];
    S.agentes.forEach((a) => (a.actividad || []).forEach((e) => {
      for (const r of REGLAS) {
        const x = r(a, e);
        if (x && puestos.get(x[0]) && puestos.get(x[1])) { lista.push({ de: x[0], a: x[1], txt: x[2], ts: e.ts, hace: e.hace || '', k: x.join('|') + e.ts }); break; }
      }
    }));
    lista.sort((x, y) => String(x.ts).localeCompare(String(y.ts)));
    const primera = !vistosTr.size;
    const nuevos = lista.filter((x) => !vistosTr.has(x.k));
    nuevos.forEach((x) => vistosTr.add(x.k));
    recientesTr = lista.filter((x) => Date.now() - new Date(String(x.ts).replace(' ', 'T')) < 864e5);
    // Al abrir la oficina se ven los tres últimos; después, cada entrega nueva en cuanto llega
    // Al abrir: las últimas entregas, solo si quien entrega está despierto. Después, cada entrega nueva en cuanto llega.
    colaTr.push(...(primera ? nuevos.filter(despiertos).slice(-3) : nuevos.filter(despiertos)));
  }
  const envios = [];
  const docTex = (col) => canvasTex(96, 120, (c) => {
    c.fillStyle = '#F4F2EC'; c.beginPath(); c.roundRect(8, 6, 80, 108, 10); c.fill();
    c.fillStyle = col; c.beginPath(); c.roundRect(8, 6, 80, 22, [10, 10, 0, 0]); c.fill();
    c.fillStyle = '#B9BCCB'; [44, 60, 76, 92].forEach((y, i) => c.fillRect(20, y, i === 3 ? 34 : 56, 6));
  });
  function lanzaEnvio(tr) {
    const A = puestos.get(tr.de), B = puestos.get(tr.a); if (!A || !B) return;
    if (A.d.id === B.d.id && A !== B && !A.paseo && A.phi != null && B.phi != null) { empiezaPaseo(A, B, tr); return; }
    const pa = new THREE.Vector3(), pb = new THREE.Vector3(); A.logo.getWorldPosition(pa); B.logo.getWorldPosition(pb);
    const SA = salas.get(A.d.id), SB = salas.get(B.d.id);
    if (A.d.id !== B.d.id && SA && SB) { lanzaRuta(tr, A, B, SA, SB, pa, pb); return; }
    const arriba = new THREE.Vector3(0, 1.6, 0);
    const curva = A.d.id === B.d.id
      ? new THREE.QuadraticBezierCurve3(pa, pa.clone().lerp(pb, .5).add(new THREE.Vector3(0, 2.4, 0)), pb)
      : new THREE.CatmullRomCurve3([pa, pa.clone().add(arriba), NUC.clone().add(new THREE.Vector3(0, 1.3, 0)), pb.clone().add(arriba), pb]);
    const col = A.d.color;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: docTex(col), transparent: true, depthWrite: false, depthTest: false, toneMapped: false })); sp.scale.set(.42, .52, 1); sp.renderOrder = 22;
    scene.add(sp);
    const largo = curva.getLength();
    envios.push({ tr, curva, sp, A, B, col, k: 0, v: 1 / Math.max(2.2, Math.min(4.5, largo / 6)), rastro: 0 });
  }
  /* ---------- de un departamento a otro: por la red de PEBAI ----------
     El documento sube a la columna de su sala, que se carga de luz; baja por el cable como una cápsula hasta el núcleo,
     que la hace girar a su alrededor y la tiñe del color de la otra sala (PEBAI decide adónde va); sube por el cable de la
     sala de destino, sale por su columna y cae en la mesa del compañero. */
  const capsulaTex = canvasTex(64, 64, (c) => { const r = c.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.35, 'rgba(255,255,255,.85)'); r.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = r; c.fillRect(0, 0, 64, 64); });
  function lanzaRuta(tr, A, B, SA, SB, pa, pb) {
    const cA = SA.tronco.curva, cB = SB.tronco.curva;   // cada cable va del núcleo (0) a la columna (1)
    const topA = cA.getPointAt(1), topB = cB.getPointAt(1);
    const arco = (p, q, h) => new THREE.QuadraticBezierCurve3(p, p.clone().lerp(q, .5).add(new THREE.Vector3(0, h, 0)), q);
    const invierte = (c) => ({ getPointAt: (k, v) => c.getPointAt(1 - k, v), getLength: () => c.getLength() });
    const giro = { getPointAt: (k, v) => { const a0 = Math.atan2(topA.z - NUC.z, topA.x - NUC.x), a1 = Math.atan2(topB.z - NUC.z, topB.x - NUC.x); let da = a1 - a0; while (da < .6) da += Math.PI * 2; const a = a0 + da * k, r = 1.75; return (v || new THREE.Vector3()).set(NUC.x + Math.cos(a) * r, NUC.y + .25 + Math.sin(k * Math.PI) * .5, NUC.z + Math.sin(a) * r); } };
    const tramos = [
      { curva: arco(pa, topA, 1.6), dur: 1, doc: true, col: A.d.color },
      { pausa: SA, dur: .55, doc: true, col: A.d.color, en: topA },
      { curva: invierte(cA), dur: 1.1, col: A.d.color },
      { curva: giro, dur: 1.2, col: A.d.color, col2: B.d.color, nucleo: true },
      { curva: cB, dur: 1.1, col: B.d.color },
      { pausa: SB, dur: .45, doc: true, col: B.d.color, en: topB },
      { curva: arco(topB, pb, 1.6), dur: 1, doc: true, col: B.d.color },
    ];
    const doc = new THREE.Sprite(new THREE.SpriteMaterial({ map: docTex(A.d.color), transparent: true, depthWrite: false, depthTest: false, toneMapped: false })); doc.scale.set(.42, .52, 1); doc.renderOrder = 22;
    const cap = new THREE.Sprite(new THREE.SpriteMaterial({ map: capsulaTex, color: A.d.color, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, toneMapped: false })); cap.renderOrder = 23;
    scene.add(doc, cap);
    envios.push({ tr, A, B, sp: doc, cap, tramos, i: 0, kt: 0, col: A.d.color, k: 0, rastro: 0, docB: false });
  }
  // un paso de la ruta entre salas; devuelve true al terminar
  function pasoRuta(e, dtR, kz) {
    const T = e.tramos[e.i]; e.kt += dtR / T.dur;
    const k = Math.min(1, e.kt), q = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    const pos = new THREE.Vector3();
    if (T.pausa) { pos.copy(T.en); T.pausa.flash = Math.max(T.pausa.flash, 1 - k * .3); }
    else T.curva.getPointAt(T.doc ? q : k, pos);
    const col = T.col2 ? new THREE.Color(T.col).lerp(new THREE.Color(T.col2), k) : new THREE.Color(T.col);
    // el documento va por fuera; dentro de los cables viaja como cápsula de luz
    const enCable = !T.doc;
    if (e.i >= 5 && !e.docB) { e.docB = true; e.sp.material.map.dispose(); e.sp.material.map = docTex(e.B.d.color); e.sp.material.needsUpdate = true; }
    e.sp.position.copy(pos); e.cap.position.copy(pos);
    const entra = T.pausa ? (e.i === 1 ? 1 - k : k) : 1;   // en la columna, el documento se hace pequeño (entra) o grande (sale)
    e.sp.material.opacity = enCable ? 0 : Math.min(1, (e.i === 0 ? k * 8 : 1), (e.i === 6 ? (1 - k) * 8 : 1)) * (T.pausa ? Math.max(.15, entra) : 1);
    e.sp.scale.set(.42 * kz * (T.pausa ? .4 + .6 * entra : 1), .52 * kz * (T.pausa ? .4 + .6 * entra : 1), 1);
    e.cap.material.color.copy(col);
    e.cap.material.opacity = enCable ? 1 : T.pausa ? (1 - entra) * .9 : 0;
    e.cap.scale.setScalar((T.nucleo ? .75 + Math.sin(k * Math.PI) * .35 : .6) * kz);
    if (enCable || T.pausa) {
      e.rastro += dtR;
      if (e.rastro > .03) {
        e.rastro = 0;
        const c = new THREE.Sprite(new THREE.SpriteMaterial({ map: brillo, color: col, transparent: true, opacity: .8, depthWrite: false, blending: THREE.AdditiveBlending }));
        c.position.copy(pos); c.scale.setScalar(.38 * kz); scene.add(c); chispas.push({ c, k: 0 });
      }
    }
    if (T.nucleo && k > .02 && !e.ruteo) { e.ruteo = true; chispazo = Math.max(chispazo, .7); }
    if (e.kt >= 1) { e.i++; e.kt = 0; if (e.i >= e.tramos.length) return true; }
    return false;
  }
  /* ---------- andar a la mesa del compañero ----------
     Se levanta, rodea la sala por fuera de las mesas (nunca atraviesa la columna), le da el documento, vuelve y se sienta. */
  const V3 = () => new THREE.Vector3();
  function empiezaPaseo(A, B, tr) {
    const doc = new THREE.Sprite(new THREE.SpriteMaterial({ map: docTex(A.d.color), transparent: true, depthWrite: false, toneMapped: false }));
    doc.scale.set(.3, .37, 1); doc.position.set(0, 1.95, 0); A.rb.r.add(doc);
    let dphi = B.phi - A.phi; while (dphi > Math.PI) dphi -= Math.PI * 2; while (dphi < -Math.PI) dphi += Math.PI * 2;
    const rAnda = A.RD + 1.35, largo = Math.abs(dphi) * rAnda;
    A.paseo = { B, tr, doc, dphi, rAnda, t: 0, fases: [.55, Math.max(1.2, largo / 1.5), .9, Math.max(1.2, largo / 1.5), .55], ini: A.phi };
    A.marcaEntrega = performance.now();
  }
  // posición (en el sistema de la sala) del robot de A a lo largo del paseo
  function puntoPaseo(A, f, k) {
    const P = A.paseo, salida = A.RD + .74;
    const enAro = (phi, r) => new THREE.Vector3(Math.sin(phi) * r, 0, Math.cos(phi) * r);
    const ease = (x) => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
    if (f === 0) return [enAro(P.ini, salida + (P.rAnda - salida) * ease(k)), enAro(P.ini, 99)];
    if (f === 1) { const ph = P.ini + P.dphi * ease(k); return [enAro(ph, P.rAnda), enAro(ph + Math.sign(P.dphi) * .2, P.rAnda)]; }
    if (f === 2) { const ph = P.ini + P.dphi; return [enAro(ph, P.rAnda - .12 * Math.sin(k * Math.PI)), enAro(ph, 0)]; }
    if (f === 3) { const ph = P.ini + P.dphi * (1 - ease(k)); return [enAro(ph, P.rAnda), enAro(ph - Math.sign(P.dphi) * .2, P.rAnda)]; }
    return [enAro(P.ini, P.rAnda - (P.rAnda - salida) * ease(k)), enAro(P.ini, 0)];
  }
  function andar(o, dtR, tt) {
    const P = o.paseo; P.t += dtR;
    let f = 0, acc = 0; while (f < P.fases.length && P.t > acc + P.fases[f]) { acc += P.fases[f]; f++; }
    if (f >= P.fases.length) {   // de vuelta en su silla
      o.rb.r.remove(P.doc); P.doc.material.map.dispose(); P.doc.material.dispose();
      o.rb.r.position.set(0, -.08, .74); o.rb.r.rotation.set(0, 0, 0); o.paseo = null; return;
    }
    const k = (P.t - acc) / P.fases[f];
    if (f === 2 && !P.dado && k > .45) {   // el documento pasa a la mesa del compañero
      P.dado = true; o.rb.r.remove(P.doc); P.doc.material.map.dispose(); P.doc.material.dispose();
      P.doc = new THREE.Sprite(new THREE.SpriteMaterial({ map: docTex(o.d.color), transparent: true, opacity: 0, depthWrite: false })); o.rb.r.add(P.doc);
      P.B.halo.material.opacity = .65; P.B.marcaRecibe = performance.now();
    }
    const [pos, mira] = puntoPaseo(o, f, k);
    const g = o.p.parent, w = g.localToWorld(pos.clone()), wm = g.localToWorld(mira.clone());
    const loc = o.p.worldToLocal(w), locM = o.p.worldToLocal(wm);
    const sube = f === 0 ? k : f === 4 ? 1 - k : 1;   // de sentado a flotar
    o.rb.r.position.set(loc.x, -.08 + .12 * sube + (f === 1 || f === 3 ? Math.abs(Math.sin(tt * 9)) * .045 : 0), loc.z);
    const dx = locM.x - loc.x, dz = locM.z - loc.z;
    if (Math.hypot(dx, dz) > 1e-3) o.rb.r.rotation.y = Math.atan2(-dx, -dz);
    o.rb.r.rotation.x = f === 1 || f === 3 ? -.12 : 0;
    const [bi, bd] = o.rb.brazos;   // brazos: arriba sujetando el documento; al darlo, hacia delante
    bi.rotation.set(f === 2 ? 1.4 : 2.6, 0, .15); bd.rotation.set(f === 2 ? 1.4 : 2.6, 0, -.15);
    if (P.dado) { bi.rotation.x = bd.rotation.x = .3; }
    o.zs.forEach((z) => { z.z.material.opacity = 0; });
  }
  // Deja la oficina como estaba: robots sentados, documentos fuera, sin entregas pendientes (al parar o saltar en la repetición)
  function limpiaAnim() {
    puestos.forEach((o) => {
      if (!o.paseo) return;
      o.rb.r.remove(o.paseo.doc); o.paseo.doc.material.map.dispose(); o.paseo.doc.material.dispose();
      o.rb.r.position.set(0, -.08, .74); o.rb.r.rotation.set(0, 0, 0); o.paseo = null;
    });
    envios.splice(0).forEach((e) => { scene.remove(e.sp); e.sp.material.map.dispose(); e.sp.material.dispose(); if (e.cap) { scene.remove(e.cap); e.cap.material.dispose(); } });
    colaTr.length = 0;
  }
  const chispas = [];
  function tickEnvios(dtR) {
    // De lejos, fichas y paquetes más grandes para que se lean; de cerca, a su tamaño
    const kz = THREE.MathUtils.clamp(camera.position.distanceTo(target) / ((HOME.dist || 40) * .42), 1, 2.4);
    // uno cada poco: si no hay nada nuevo, se repite de vez en cuando una entrega de las últimas 24 h para ver el trabajo
    ultimoTr += dtR;
    if (!envios.length && colaTr.length && ultimoTr > 1.2) { const x = colaTr.shift(); if (despiertos(x)) lanzaEnvio(x); ultimoTr = 0; }
    else if (!repe && !envios.length && !colaTr.length && ultimoTr > 22 && !document.hidden) {
      const listos = recientesTr.filter(despiertos);
      if (listos.length) colaTr.push(listos[Math.floor(Math.random() * listos.length)]);
      ultimoTr = 0;
    }
    for (let i = envios.length - 1; i >= 0; i--) {
      const e = envios[i];
      if (e.tramos) {
        if (pasoRuta(e, dtR, kz)) {
          e.B.halo.material.opacity = .6;
          [e.sp, e.cap].forEach((x) => { scene.remove(x); if (x === e.sp) x.material.map.dispose(); x.material.dispose(); });
          envios.splice(i, 1);
        }
        continue;
      }
      e.k = Math.min(1, e.k + dtR * e.v);
      const q = e.k < .5 ? 2 * e.k * e.k : 1 - Math.pow(-2 * e.k + 2, 2) / 2;
      e.curva.getPointAt(q, e.sp.position);
      e.sp.scale.set(.42 * kz, .52 * kz, 1);
      e.sp.material.opacity = Math.min(1, e.k * 8, (1 - e.k) * 8);
      e.rastro += dtR;
      if (e.rastro > .045) {
        e.rastro = 0;
        const c = new THREE.Sprite(new THREE.SpriteMaterial({ map: brillo, color: e.col, transparent: true, opacity: .8, depthWrite: false, blending: THREE.AdditiveBlending }));
        c.position.copy(e.sp.position); c.scale.setScalar(.32); scene.add(c); chispas.push({ c, k: 0 });
      }
      if (e.k >= 1) {
        e.B.halo.material.opacity = .6;   // destello al llegar a su mesa
        scene.remove(e.sp); e.sp.material.map.dispose(); e.sp.material.dispose();
        envios.splice(i, 1);
      }
    }
    for (let i = chispas.length - 1; i >= 0; i--) {
      const ch = chispas[i]; ch.k += dtR * 1.8; ch.c.material.opacity = .8 * (1 - ch.k); ch.c.scale.setScalar(.32 * (1 - ch.k * .6));
      if (ch.k >= 1) { scene.remove(ch.c); ch.c.material.dispose(); chispas.splice(i, 1); }
    }
    puestos.forEach((o) => {
      const on = pintaAnillo(o), an = o.anillo, sel = foco && foco.agente === o.a.id;
      an.op += ((on || sel ? 1 : 0) - an.op) * Math.min(1, dtR * 4 || .1);
      an.pista.material.opacity = sel ? .35 + Math.sin(performance.now() / 380) * .15 : an.op * .1; an.arco.material.opacity = an.op * (.8 + Math.sin(performance.now() / 420) * .15);
      an.arco.visible = on && an.op > .02; an.pista.visible = an.op > .02;
      const n = an.arco.geometry.userData.n, tramo = (x) => Math.floor(x * n / 6) * 6;
      if (an.indet) { an.gira = (an.gira + dtR * .35) % 1; const ini = tramo(an.gira * .78); an.arco.geometry.setDrawRange(ini, tramo(.22)); }
      else an.arco.geometry.setDrawRange(0, Math.max(6, tramo(an.val)));
    });
  }
  function flotar(o, n) {
    const uni = String(o.a.unidad || '').split(' ')[0] || 'más';
    const txt = '+' + N(n) + ' ' + (n === 1 ? uni.replace(/es$/, '').replace(/s$/, '') : uni);
    const t2 = canvasTex(640, 110, (c) => { c.font = '800 64px Manrope, sans-serif'; c.textAlign = 'center'; c.lineWidth = 10; c.strokeStyle = 'rgba(6,7,13,.85)'; c.strokeText(txt, 320, 80); c.fillStyle = '#3DDC84'; c.fillText(txt, 320, 80); });
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t2, transparent: true, depthWrite: false })); sp.scale.set(3.4, .58, 1);
    o.logo.getWorldPosition(sp.position); sp.position.y += .55; scene.add(sp); flotantes.push({ sp, k: 0 });
  }
  const pintaReloj = () => salas.forEach((s) => {
    if (!s.reloj) return; const g = s.reloj.cv.getContext('2d'), now = new Date();
    g.fillStyle = '#EFEDE7'; g.beginPath(); g.arc(100, 100, 100, 0, 7); g.fill();
    g.strokeStyle = '#2b2f50'; g.lineCap = 'round';
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.lineWidth = i % 3 ? 3 : 6; g.beginPath(); g.moveTo(100 + Math.sin(a) * 78, 100 - Math.cos(a) * 78); g.lineTo(100 + Math.sin(a) * 90, 100 - Math.cos(a) * 90); g.stroke(); }
    const h = (now.getHours() % 12 + now.getMinutes() / 60) / 12 * Math.PI * 2, m = now.getMinutes() / 60 * Math.PI * 2;
    g.lineWidth = 9; g.beginPath(); g.moveTo(100, 100); g.lineTo(100 + Math.sin(h) * 46, 100 - Math.cos(h) * 46); g.stroke();
    g.lineWidth = 6; g.beginPath(); g.moveTo(100, 100); g.lineTo(100 + Math.sin(m) * 70, 100 - Math.cos(m) * 70); g.stroke();
    g.fillStyle = s.d.color; g.beginPath(); g.arc(100, 100, 8, 0, 7); g.fill();
    s.reloj.rt.needsUpdate = true;
  });

  function refrescarEscena(soloEstados) {
    puestos.forEach((o) => {
      const a = ag(o.a.id); if (!a) return; o.a = a;
      marcaAviso(o, pendientes().some((x) => x.a.id === a.id && !x.err));
      if (o.prevSt === 'trabajando' && a.st !== 'trabajando' && a.st !== 'error') listo(o);   // acaba de terminar su tarea
      if (o.prevSt && o.prevSt !== 'trabajando' && a.st === 'trabajando') { o.halo.material.opacity = .75; o.pad.material.opacity = 1; }   // se despierta
      o.prevSt = a.st;
      if (o.prevHoy !== undefined && a.hoy > o.prevHoy) flotar(o, a.hoy - o.prevHoy);
      o.prevHoy = a.hoy;
      o.rb.r.visible = a.st !== 'apagado';
      const v = vis(a.st);
      o.rb.ojoMat.color.set(v === 'dormido' ? '#2a2d3e' : COL_EST[v] || COL_EST.dormido);
      o.rb.nucleoMat.color.copy(o.rb.ojoMat.color);
      o.halo.material.opacity = v === 'trabajando' ? .22 : v === 'espera' ? .1 : v === 'error' ? .18 : 0;
      o.halo.material.color.set(COL_EST[v] || COL_EST.dormido);
      o.logoMat.emissiveIntensity = v === 'trabajando' ? .7 : v === 'espera' ? .4 : v === 'error' ? .5 : .1;
      o.logoMat.color.set(v === 'apagado' ? '#3a3d52' : o.col); o.logoMat.emissive.set(v === 'error' ? '#FF5E6C' : v === 'apagado' ? '#000000' : o.col);
      o.cono.material.opacity = v === 'trabajando' ? .14 : v === 'apagado' ? 0 : .05;
      o.pad.material.color.set(COL_EST[v] || COL_EST.dormido); o.pad.material.opacity = v === 'trabajando' ? .9 : v === 'espera' || v === 'error' ? .8 : v === 'dormido' ? .45 : .25;
      o.tiraMat.color.set(COL_EST[v] || COL_EST.dormido);
      if (o.nodoMat) o.nodoMat.color.set(COL_EST[v] || COL_EST.dormido);
      o.baliza.visible = v === 'error';
      if (o.linea) ponOn(o.linea, v === 'trabajando' ? 1 : v === 'error' ? 0 : .12);
      dibujaPantalla(o, 0);
    });
    salas.forEach((s) => {
      const d = s.d; let partes = [['Sin agentes aún', '#4a4d62']];
      if (d.activo) {
        const lista = agsDe(d.id), n = pendientes().filter((p) => p.a.dept === d.id).length, err = lista.some((a) => a.st === 'error');
        const tr = lista.filter((a) => a.st === 'trabajando').length;
        partes = [[tr ? `${tr} de ${lista.length} trabajando` : `${lista.length} ${lista.length === 1 ? 'bot' : 'bots'} en reposo`, tr ? '#3DDC84' : '#8E91A8']];
        if (err) partes.push(['Error', '#FF5E6C']); else if (n) partes.push([n === 1 ? '1 aviso' : n + ' avisos', '#FFB547']);
        ponOn(s.tronco, tr ? 1 : .25); if (s.bus) ponOn(s.bus, tr ? 1 : .15);
      }
      if (s.sign.material.map) s.sign.material.map.dispose(); s.sign.material.map = cartel(d, partes); s.sign.material.needsUpdate = true;
    });
    orbeMat.uniforms.uErr.value = pendientes().some((p) => p.err) ? .55 : 0;
    if (!soloEstados) buscaTraspasos();
    pintaReloj(); luzDelDia(); autosPared.forEach(dibujaAuto);
  }

  /* ---------- cámara con clics ---------- */
  let fly = null, intro = calma ? null : { k: 0 }, deriva = 0;
  let libre = false, arrastre = null, arrastrado = false;
  const inercia = new THREE.Vector3(); let zoomObj = 0;
  const volar = (p, t) => { intro = null; libre = false; zoomObj = 0; inercia.set(0, 0, 0); if (!Number.isFinite(camera.position.x)) { camera.position.copy(p); target.copy(t); } fly = { p0: camera.position.clone(), t0: target.clone(), p1: p.clone(), t1: t.clone(), k: 0 }; };
  const enIntro = (e) => { const off = HOME.p.clone().sub(HOME.t), ang = (1 - e) * 1.1; off.applyAxisAngle(new THREE.Vector3(0, 1, 0), ang).multiplyScalar(1 + (1 - e) * .35); camera.position.copy(HOME.t).add(off); camera.position.y += (1 - e) * 6; target.copy(HOME.t).add(new THREE.Vector3(0, (1 - e) * 2, 0)); };
  if (intro) enIntro(0); else { camera.position.copy(HOME.p); target.copy(HOME.t); }
  const ray = new THREE.Raycaster(), m2 = new THREE.Vector2();
  const tocar = (e) => { const r = renderer.domElement.getBoundingClientRect(); m2.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(m2, camera); return ray.intersectObjects(clicables, false)[0]; };
  let hover = null, ultimoMov = 0;
  const ficha = document.createElement('div'); ficha.className = 'pb-of-hov'; wrap.append(ficha);
  const fichaDe = (h) => {
    if (!h) return null;
    const u = h.object.userData;
    if (u.puesto) { const a = u.puesto.a, [c, txt] = ST[a.st] || ST.espera; return { k: u.puesto.d.nombre, b: a.nombre, r: a.rol, c, txt: txt + (a.cupo ? ` · ${N(a.hoy)} de ${a.cupo} hoy` : a.hoy ? ` · ${N(a.hoy)} hoy` : ''), m: a.motivo, dia: franjaDia(a) }; }
    if (u.servidor) { const d = u.sala; return { k: 'Servidor · ' + d.nombre, b: 'Lo que han hecho hoy', c: d.activo ? d.color : '#5C5F73', txt: d.activo ? 'Resumen escrito por la IA' : 'Sin agentes aún', m: 'Pincha para leer el resumen del día' }; }
    if (u.sala) { const d = u.sala, l = agsDe(d.id), tr = l.filter((a) => a.st === 'trabajando').length; return { k: 'Departamento', b: d.nombre, c: d.activo ? (tr ? '#3DDC84' : '#8E91A8') : '#5C5F73', txt: d.activo ? `${tr} de ${l.length} trabajando` : 'Sin agentes aún', m: d.objetivo }; }
    if (u.nucleo) { const pe = pendientes(); return { k: 'El núcleo', b: 'PEBAI', c: pe.some((p) => p.err) ? '#FF5E6C' : pe.length ? '#FFB547' : '#3DDC84', txt: pe.length ? (pe.length === 1 ? '1 aviso' : pe.length + ' avisos') : 'Todo en orden', m: 'Pincha para ver el resumen de la oficina' }; }
    return null;
  };
  const cv3 = renderer.domElement;
  cv3.style.touchAction = 'none';
  const dedos = new Map(); let pinza = 0;
  cv3.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') { dedos.set(e.pointerId, [e.clientX, e.clientY]); if (dedos.size === 2) { arrastre = null; const [a1, a2] = [...dedos.values()]; pinza = Math.hypot(a1[0] - a2[0], a1[1] - a2[1]); return; } }
    if (e.button !== 0) return; arrastre = { x: e.clientX, y: e.clientY, mov: false }; arrastrado = false; inercia.set(0, 0, 0);
  });
  // dos dedos: se separan → acercar; se juntan → alejar
  cv3.addEventListener('pointermove', (e) => {
    if (!dedos.has(e.pointerId)) return; dedos.set(e.pointerId, [e.clientX, e.clientY]);
    if (dedos.size !== 2 || !pinza) return;
    const [a1, a2] = [...dedos.values()], d = Math.hypot(a1[0] - a2[0], a1[1] - a2[1]);
    fly = null; intro = null; libre = true;
    const actual = camera.position.distanceTo(target);
    zoomObj = THREE.MathUtils.clamp((zoomObj || actual) * pinza / Math.max(20, d), 6, (HOME.dist || 60) * 1.3); pinza = d;
  });
  const sueltaDedo = (e) => { dedos.delete(e.pointerId); if (dedos.size < 2) pinza = 0; };
  cv3.addEventListener('pointerup', sueltaDedo); cv3.addEventListener('pointercancel', sueltaDedo);
  window.addEventListener('pointerup', () => { if (arrastre && arrastre.mov) { arrastrado = true; setTimeout(() => { arrastrado = false; }, 60); } arrastre = null; cv3.style.cursor = ''; });
  window.addEventListener('pointermove', (e) => {
    if (!arrastre || cine) return;
    const dx = e.clientX - arrastre.x, dy = e.clientY - arrastre.y;
    if (!arrastre.mov && Math.hypot(dx, dy) < 5) return;
    arrastre.mov = true; arrastre.x = e.clientX; arrastre.y = e.clientY; cv3.style.cursor = 'grabbing';
    fly = null; intro = null; libre = true;
    const der = new THREE.Vector3().subVectors(camera.position, target).cross(camera.up).normalize().negate();
    const fre = new THREE.Vector3().subVectors(target, camera.position).setY(0).normalize();
    const k = camera.position.distanceTo(target) * .00085;
    const mov = der.multiplyScalar(-dx * k).add(fre.multiplyScalar(dy * k));
    moverVista(mov); inercia.copy(mov);
  });
  /* mueve la vista sin salirse de la oficina */
  const moverVista = (mov) => {
    const c = cajaVista.getCenter(new THREE.Vector3()), lim = cajaVista.getSize(new THREE.Vector3()).multiplyScalar(.55);
    const nt = target.clone().add(mov);
    nt.x = THREE.MathUtils.clamp(nt.x, c.x - lim.x, c.x + lim.x); nt.z = THREE.MathUtils.clamp(nt.z, c.z - lim.z, c.z + lim.z);
    camera.position.add(nt.clone().sub(target)); target.copy(nt);
  };
  cv3.addEventListener('wheel', (e) => {
    if (cine) return; e.preventDefault();
    fly = null; intro = null; libre = true;
    const actual = camera.position.distanceTo(target);
    zoomObj = THREE.MathUtils.clamp((zoomObj || actual) * Math.exp(Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY), 120) * .0009), 6, (HOME.dist || 60) * 1.3);
  }, { passive: false });
  renderer.domElement.addEventListener('pointermove', (e) => {
    const r = renderer.domElement.getBoundingClientRect();
    const colocar = () => {   // donde quepa: encima del ratón si no cabe debajo, a la izquierda si no cabe a la derecha
      const fw = ficha.offsetWidth || 250, fh = ficha.offsetHeight || 140, mx = e.clientX - r.left, my = e.clientY - r.top;
      const fx = mx + 16 + fw > r.width - 8 ? mx - fw - 16 : mx + 16, fy = my + 18 + fh > r.height - 90 ? my - fh - 14 : my + 18;
      ficha.style.transform = `translate(${Math.max(8, fx)}px, ${Math.max(8, fy)}px)`;
    };
    colocar();
    if (performance.now() - ultimoMov < 50) return; ultimoMov = performance.now();
    const h = tocar(e); const o = h && h.object.userData.puesto ? h.object.userData.puesto : null;
    const f = foco && !foco.sigue ? null : fichaDe(h);
    renderer.domElement.style.cursor = h && (o || h.object.userData.sala || h.object.userData.nucleo) ? 'pointer' : 'default';
    if (f) { ficha.innerHTML = `<small>${esc(f.k)}</small><b>${esc(f.b)}</b>` + (f.r ? `<p class="rol">${esc(f.r)}</p>` : '') + `<span><i style="background:${f.c}"></i>${esc(f.txt)}</span>` + (f.m ? `<em>${esc(f.m)}</em>` : '') + (f.dia || ''); ficha.classList.add('on'); colocar(); } else ficha.classList.remove('on');
    hover = o; salaHover = o ? o.d.id : h && h.object.userData.sala ? h.object.userData.sala.id : null;
  });
  renderer.domElement.addEventListener('pointerleave', () => { ficha.classList.remove('on'); hover = null; salaHover = null; });
  renderer.domElement.addEventListener('click', (e) => {
    if (arrastrado) { arrastrado = false; return; }
    if (cine) { alternarCine(); return; }
    const h = tocar(e);
    ficha.classList.remove('on');
    if (h && h.object.userData.puesto) { abrirAgente(h.object.userData.puesto.a.id); return; }
    if (h && h.object.userData.servidor) { abrirServidor(h.object.userData.servidor); return; }
    if (h && h.object.userData.sala) { abrirSala(h.object.userData.sala); return; }
    if (h && h.object.userData.nucleo) { abrirNucleo(); return; }
    if (side.classList.contains('on') || foco) cerrar();
  });
  new ResizeObserver(() => {
    if (!W0()) return; camera.aspect = W0() / H0(); camera.updateProjectionMatrix(); encajar();
    renderer.setSize(W0(), H0()); composer.setSize(W0(), H0());
    if (!foco) { if (!intro) volar(HOME.p, HOME.t); } else if (foco.agente) enfocarAgente(foco.agente); else if (foco.nucleo) abrirNucleo(); else if (foco.servidor) enfocarServidor(foco.servidor); else if (foco.sala) enfocarSala(DEPTS.find((x) => x.id === foco.sala));
  }).observe(wrap);

  const clock = new THREE.Clock(); let ultPantalla = 0, tPrev = 0, ledPaso = -1, minuto = -1, medida = { n: 0, t: 0, prev: 0 };
  function tick(now) {
    requestAnimationFrame(tick);
    if (document.hidden || !enPagina() || !W0()) { medida.prev = 0; return; }
    if (medida.prev) { const dt2 = now - medida.prev; if (dt2 < 250) { medida.n++; medida.t += dt2; } }
    medida.prev = now;
    if (medida.n >= 60) {
      const media = medida.t / medida.n;
      // por debajo de ~55 FPS se baja la resolución; si ya está al mínimo, se apaga el brillo; si va sobrada, se sube poco a poco
      if (media > 18 && Q > .55) { Q = Math.max(.55, +(Q - .1).toFixed(2)); composer.setPixelRatio(Q); composer.setSize(W0(), H0()); }
      else if (media > 18 && bloom.enabled) { bloom.enabled = false; }
      else if (media < 12 && Q < QMAX && now - ultSubida > 5000) { ultSubida = now; Q = Math.min(QMAX, +(Q + .05).toFixed(2)); composer.setPixelRatio(Q); composer.setSize(W0(), H0()); }
      medida.n = 0; medida.t = 0;
    }
    const t = clock.getElapsedTime(), dtReal = Math.min(.5, t - tPrev), dt = Math.min(.05, dtReal); tPrev = t;
    /* núcleo */
    // pz: 0 en reposo, 1 pensando (con transición suave); al llegar la respuesta, un chispazo
    pz += ((pensando ? 1 : 0) - pz) * Math.min(1, dtReal * 3);
    if (pensabaAntes && !pensando) chispazo = 1; pensabaAntes = pensando; chispazo = Math.max(0, chispazo - dtReal * 1.6);
    const k = 1 + pz * 2.5, flota = Math.sin(t * 1.1) * .07 + pz * (.45 + Math.sin(t * 2.6) * .12), y = NUC.y + flota;
    orbeMat.uniforms.uT.value = t; orbeMat.uniforms.uK.value += (k - orbeMat.uniforms.uK.value) * .04;
    orbe.position.y = y; orbe.rotation.y += dt * .25 * k; orbe.rotation.x = Math.sin(t * 1.7) * .35 * pz; orbe.rotation.z = Math.cos(t * 1.3) * .25 * pz;
    orbe.position.x = NUC.x + Math.sin(t * 3.1) * .08 * pz; orbe.position.z = NUC.z + Math.cos(t * 2.3) * .08 * pz;
    orbe.scale.setScalar(1 + pz * (.06 + Math.sin(t * 4.2) * .05) + chispazo * .18); halo.position.y = y;
    halo.material.opacity = .32 + pz * .25 + chispazo * .5 + Math.sin(t * (1.6 + pz * 6.4)) * .06; halo.scale.setScalar(5.6 * (1 + pz * .25 + chispazo * .6));
    ideas.forEach((d, i) => {
      const a = t * (1.9 + i * .23) + d.fase, r = d.r + Math.sin(t * 2 + i) * .15;
      d.sp.position.set(NUC.x + Math.cos(a) * r, y + Math.sin(a) * r * d.incl + Math.sin(t * 3 + i) * .1, NUC.z + Math.sin(a) * r);
      d.sp.material.opacity = pz * (.65 + Math.sin(t * 7 + i * 2) * .35); d.sp.visible = pz > .02;
    });
    const haciaCam = camera.position.clone().sub(NUC).normalize();
    fachada.forEach((m) => { m.position.set(NUC.x, y, NUC.z).add(haciaCam.clone().multiplyScalar(1.29)); m.lookAt(camera.position); });
    const lat = 1 + Math.sin(t * (1.8 + pz * 4.2)) * (.025 + pz * .025) + chispazo * .12; mark.scale.setScalar(lat);
    nubes[0].rotation.y += dt * .22 * k; nubes[1].rotation.y -= dt * .3 * k; nubes.forEach((n) => { n.position.y = y; n.scale.setScalar(pensando ? .9 + Math.sin(t * 5) * .04 : 1); });
    orbitas.forEach((o, i) => { o.position.y = y; o.rotation.z += dt * (.45 + i * .2) * k * (i % 2 ? -1 : 1); });
    corona.rotation.y -= dt * .15 * k;
    /* con una sala o un bot abierto, los carteles de las demás salas se apagan para no tapar */
    salas.forEach((sa) => {
      const enError = sa.d.activo && agsDe(sa.d.id).some((a) => a.st === 'error');
      sa.banda.material.color.set(enError ? '#FF5E6C' : sa.d.color);
      const obj = enError ? .55 + Math.sin(t * 5) * .4 : Math.min(1, sa.bandaBase + (salaHover === sa.d.id ? .45 : 0)); sa.banda.material.opacity += (obj - sa.banda.material.opacity) * .15;
    });
    const salaFoco = foco ? (foco.sala || foco.servidor || (foco.agente && puestos.get(foco.agente) && puestos.get(foco.agente).d.id) || null) : null;
    salas.forEach((sa) => { const obj = salaFoco === sa.d.id ? 0 : !salaFoco ? 1 : .08; sa.sign.material.opacity += (obj - sa.sign.material.opacity) * .12; sa.sign.visible = sa.sign.material.opacity > .03; });
    columna.material.uniforms.uT.value = t; polvo.rotation.y = t * .01; polvo.position.y = Math.sin(t * .2) * .3;
    coreLight.intensity = 7 + pz * 4 + chispazo * 10 + Math.sin(t * (1.4 + pz * 7.6)) * (1.2 + pz * 1.8);
    const ritmo = pensando ? 1.2 : .45;
    ondas.forEach((o) => { o.k = (o.k + dt * ritmo / 1.5) % 1; o.m.scale.setScalar(2.4 + o.k * (PLAZA - 2.5)); o.m.material.opacity = (1 - o.k) * (1 - o.k) * .26; });
    /* cables y paquetes de datos */
    enlaces.forEach((c) => { c.alma.material.uniforms.uT.value = t * (pensando ? 2 : 1); c.halo.material.uniforms.uT.value = t * (pensando ? 2 : 1); });
    paquetes.forEach((p) => {
      const activo = p.dir > 0 || p.c.on > .5; p.sp.visible = activo; if (!activo) return;
      const antes = p.k;
      p.k = (p.k + dt * p.v * (p.c.on > .5 ? 1 : .45) * (pensando ? 2.2 : 1)) % 1;
      if (p.k < antes) { if (p.dir > 0 && p.c.sala) p.c.sala.flash = 1; }
      p.c.curva.getPointAt(p.dir > 0 ? p.k : 1 - p.k, p.sp.position);
      p.sp.material.opacity = Math.sin(p.k * Math.PI) * (p.c.on > .5 ? 1 : .5);
    });
    tickEnvios(dtReal * velAnim());
    { const kc = THREE.MathUtils.clamp(camera.position.distanceTo(target) / ((HOME.dist || 40) * .45), 1, 2.2);
      const dentro = foco && (foco.sala || foco.servidor || foco.sigue || (foco.agente && (ag(foco.agente) || {}).dept));
      salas.forEach((sa) => {
        const k = kc / sa.esc * (sa.d.activo ? 1 : .8); sa.sign.scale.set(4.4 * k, 1.1 * k, 1);
        const op = dentro === sa.d.id ? 0 : 1; sa.sign.material.opacity += (op - sa.sign.material.opacity) * Math.min(1, dtReal * 6); sa.sign.visible = sa.sign.material.opacity > .03;
      }); }
    for (let i = flotantes.length - 1; i >= 0; i--) { const f = flotantes[i]; f.k += dtReal * velAnim() / 2.8; f.sp.position.y += dtReal * .5; f.sp.material.opacity = f.k < .15 ? f.k / .15 : 1 - Math.pow((f.k - .15) / .85, 2); if (f.k >= 1) { scene.remove(f.sp); if (!f.propio) f.sp.material.map.dispose(); f.sp.material.dispose(); flotantes.splice(i, 1); } }
    salas.forEach((sa) => {
      sa.flash = Math.max(0, sa.flash - dt * 2.2);
      sa.destello.material.opacity = sa.flash * .9; sa.destello.scale.setScalar(.6 + sa.flash * .7);
      sa.tiraRack.opacity = sa.d.activo ? .45 + sa.flash * .5 : 0;
    });
    /* luces de los servidores y relojes */
    if (Math.floor(t * 5) !== ledPaso) {
      ledPaso = Math.floor(t * 5);
      salas.forEach((s) => {
        const trab = s.d.activo && agsDe(s.d.id).some((a) => a.st === 'trabajando'), c = s.ledsSala.ctx;
        c.fillStyle = '#121528'; c.fillRect(0, 0, 64, 160);
        for (let r = 0; r < 7; r++) {
          const y = 12 + r * 21;
          c.fillStyle = '#23273f'; c.fillRect(4, y + 9, 56, 1); c.fillStyle = '#07080f'; c.fillRect(38, y - 1, 20, 6);
          for (let k = 0; k < 4; k++) {
            const i = r * 4 + k, on2 = !s.d.activo ? false : trab ? Math.random() > .4 : i % 4 === 0;
            c.fillStyle = on2 ? (trab && i % 4 === 3 ? '#3FD5FF' : '#3DDC84') : '#16211b'; c.fillRect(6 + k * 7, y, 5, 3);
          }
        }
        s.ledsSala.tex.needsUpdate = true;
      });
    }
    if (new Date().getMinutes() !== minuto) { minuto = new Date().getMinutes(); pintaReloj(); luzDelDia(); }
    /* robots */
    const animPant = t - ultPantalla > .12; if (animPant) ultPantalla = t;
    puestos.forEach((o) => {
      const st = vis(o.a.st), rb = o.rb, tt = t + o.t0;
      if (animPant && ['trabajando', 'espera', 'error'].includes(st)) dibujaPantalla(o, tt);
      o.hl += ((hover === o ? 1 : 0) - o.hl) * .15;
      o.logo.scale.setScalar(1 + o.hl * .22);
      const vivo = st === 'trabajando' || st === 'espera' || st === 'error';
      o.logo.rotation.y = vivo ? Math.sin(tt * .9) * .55 : Math.sin(tt * .3) * .15;
      o.logo.position.y = 2.82 + (vivo ? Math.sin(tt * 1.6) * .06 : -.06);
      if (st === 'trabajando') o.logoMat.emissiveIntensity = .6 + Math.sin(tt * 4) * .15 + o.hl * .4;
      else if (o.hl > .02 && st !== 'error') o.logoMat.emissiveIntensity = (st === 'apagado' ? 0 : .1) + o.hl * .7;
      else if (st === 'error') o.logoMat.emissiveIntensity = Math.sin(t * 8) > 0 ? .9 : .2;
      const [bi, bd] = rb.brazos;
      rb.cuello.rotation.set(0, 0, 0); bi.rotation.set(0, 0, 0); bd.rotation.set(0, 0, 0); rb.r.position.y = -.08;
      o.zs.forEach((z) => { z.z.material.opacity = 0; });
      rb.r.rotation.x = 0; rb.r.rotation.y = 0;
      o.luz += ((st === 'trabajando' ? 1 : 0) - o.luz) * Math.min(1, dt * 3);
      o.brilloBarra.material.opacity = o.luz * .85; o.charcoF.material.opacity = o.luz * .7;
      o.bombillaMat.color.setRGB(.16 + 1.1 * o.luz, .17 + 1 * o.luz, .25 + .65 * o.luz);
      o.datos.forEach((dd) => { const kk = (tt * .45 + dd.o) % 1; dd.sp.position.set(dd.x, 2.0 + kk * .55, -.24); dd.sp.material.opacity = st === 'trabajando' ? Math.sin(kk * Math.PI) * .85 : 0; });
      if (st === 'trabajando') {
        // ráfagas de tecleo con pausas cortas para leer la pantalla, como una persona
        const rafaga = Math.sin(tt * .8) > -.55 ? 1 : 0, ti = tt * 17;
        bi.rotation.x = 1.22 + rafaga * Math.max(0, Math.sin(ti)) * .2; bd.rotation.x = 1.22 + rafaga * Math.max(0, Math.sin(ti + Math.PI)) * .2;
        bi.rotation.z = .08 + Math.sin(tt * 2.3) * .05; bd.rotation.z = -.08 - Math.sin(tt * 2.1) * .05;
        rb.r.rotation.x = -.07; rb.r.position.y = -.08 + rafaga * Math.abs(Math.sin(ti)) * .006;
        rb.cuello.rotation.x = -.16 + (rafaga ? Math.sin(ti * .5) * .015 : -.05); rb.cuello.rotation.y = Math.sin(tt * .9) * (rafaga ? .1 : .22);
        rb.antena.material.color.set(Math.sin(tt * 6) > 0 ? COL_EST.trabajando : '#ffffff');
        o.tecladoMat.color.setRGB(.08 + rafaga * .16 * Math.abs(Math.sin(ti * 1.3)), .1 + rafaga * .5 * Math.abs(Math.sin(ti * 1.3)), .16 + rafaga * .22 * Math.abs(Math.sin(ti * 1.3)));
        o.halo.material.opacity = .16 + Math.sin(tt * 3) * .05;
        o.pad.material.opacity = .75 + Math.sin(tt * 2) * .15;
      } else if (st === 'espera') {
        o.tecladoMat.color.set(0x14172a);
        bi.rotation.x = .35; bd.rotation.x = .35;
        rb.cuello.rotation.y = Math.sin(tt * .55) * .55; rb.cuello.rotation.x = .08;
      } else if (st === 'dormido') {
        o.tecladoMat.color.set(0x14172a);
        rb.cuello.rotation.x = -.75; bi.rotation.x = 1.35; bd.rotation.x = 1.35; rb.r.position.y = -.12 + Math.sin(tt * 1.2) * .01;
        o.zs.forEach((z) => { const kk = (tt * .32 + z.o) % 1; z.z.position.set(.2 + kk * .45, 1.55 + kk * .8, .55); z.z.material.opacity = Math.sin(kk * Math.PI) * .9; z.z.scale.setScalar(.16 + kk * .18); });
      } else if (st === 'error') {
        rb.cuello.rotation.y = Math.sin(tt * 3) * .5; bi.rotation.z = .6; bd.rotation.z = -.6; bi.rotation.x = .4; bd.rotation.x = .4;
        o.baliza.visible = Math.sin(t * 8) > -.1;
      }
      if (o.paseo) andar(o, dtReal * velAnim(), tt);
      if (o.aviso && o.aviso.visible) { o.aviso.position.y = 3.25 + Math.sin(tt * 2.4) * .06; o.aviso.material.opacity = .75 + Math.sin(tt * 4) * .25; }
    });
    if (intro) { intro.k = Math.min(1, intro.k + dtReal / 3.2); const e = intro.k < .5 ? 4 * intro.k ** 3 : 1 - Math.pow(-2 * intro.k + 2, 3) / 2; enIntro(e); if (intro.k >= 1) { intro = null; deriva = 0; } }
    if (fly) { fly.k = Math.min(1, fly.k + dtReal / 1.1); const e = 1 - Math.pow(1 - fly.k, 3); camera.position.lerpVectors(fly.p0, fly.p1, e); target.lerpVectors(fly.t0, fly.t1, e); if (fly.k >= 1) { fly = null; deriva = 0; } }
    if (cine) { cineAng += dtReal * .07; const off = HOME.p.clone().sub(HOME.t).applyAxisAngle(new THREE.Vector3(0, 1, 0), cineAng).multiplyScalar(.82); camera.position.copy(HOME.t).add(off); camera.position.y += Math.sin(t * .2) * .6; target.copy(HOME.t).add(new THREE.Vector3(0, .6, 0)); fly = null; intro = null; }
    else if (!fly && !intro && !foco && !calma && !libre) { deriva = Math.min(1, deriva + dt / 2.5); const off = HOME.p.clone().sub(HOME.t).applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.sin(t * .11) * .045 * deriva); camera.position.copy(HOME.t).add(off); camera.position.y += Math.sin(t * .17) * .25 * deriva; target.copy(HOME.t); }
    if (!arrastre && inercia.lengthSq() > 1e-7) { moverVista(inercia); inercia.multiplyScalar(Math.pow(.9, dtReal * 60)); }
    if (zoomObj) { const off = new THREE.Vector3().subVectors(camera.position, target), d = off.length(); const nd = d + (zoomObj - d) * Math.min(1, dtReal * 9); camera.position.copy(target).add(off.setLength(nd)); if (Math.abs(zoomObj - nd) < .02) zoomObj = 0; }
    camera.lookAt(target);
    if (!lista) composer.render();
  }
  G = { THREE, volar, HOME, refrescarEscena, puestos, salas, NUC, lanzaEnvio, traspasos: () => recientesTr, esLibre: () => libre, limpiaAnim };
  refrescarEscena(); requestAnimationFrame(tick);
}

/* ============ ciclo ============ */
async function refrescar() {
  try {
    if (!(await cargar())) return;
    pintaHud();
    if (!G && !lista) await montar(); else if (G) G.refrescarEscena();
    if (lista) { const l = $('#pb-of-load'); if (l) l.remove(); }
    if (side.classList.contains('on') && foco && foco.agente) abrirAgente(foco.agente);
  } catch (e) { toast(e.message || 'No se ha podido cargar la oficina.', true); }
}
const alEntrar = () => { if (enPagina()) refrescar(); };
document.addEventListener('pb:page', alEntrar);
document.addEventListener('pb:agview', alEntrar);
setInterval(() => { if (!repe && !document.hidden && enPagina() && !side.classList.contains('on')) refrescar(); }, 60000);
// Mientras se ve un QR de vinculación (caduca a los ~20 s), refrescar cada 5 s para que siempre esté vigente
setInterval(() => { if (!document.hidden && enPagina() && side.classList.contains('on') && document.querySelector('.pb-of-qr')) refrescar(); }, 5000);
alEntrar();
}
