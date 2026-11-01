/* PEBAI · Panel — Automático › Gasto IA: cuánto gasta cada agente en Claude (crédito mensual) y cuántas veces tiró de Gemini (gratis, de reserva).
   Datos en index.php?gasto=1 (ver _gasto_panel.php). Gráficas en SVG propio. Todo texto que viene de los datos pasa por esc(). */
(() => {
'use strict';
const app = document.getElementById('pb-app');
const raiz = document.getElementById('pb-gasto');
if (!app || !raiz) return;
const BASE = app.dataset.base;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const N = (n) => new Intl.NumberFormat('es-ES').format(Math.round(n || 0));
// dinero: con céntimos de céntimo cuando es poco, para que se vea que algo cuesta
const USD = (n) => (n >= 10 ? n.toFixed(0) : n >= 1 ? n.toFixed(2) : n >= .01 ? n.toFixed(3) : n > 0 ? n.toFixed(4) : '0').replace('.', ',') + ' $';
const K = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1).replace('.', ',') + ' M' : n >= 1e3 ? Math.round(n / 1e3) + ' mil' : N(n));
const ico = (p) => `<svg class="pb-i" viewBox="0 0 24 24">${p}</svg>`;

// Quién es quién: nombre, color y qué hace con la IA
const AG = {
  cerebro: ['Cerebro', '#9C93FF', 'Lee tus chats, te escribe borradores y prepara primeros mensajes (con búsqueda real en IA)'],
  conversaciones: ['Conversaciones', '#3FD5FF', 'Clasifica respuestas de empresas y prepara la contestación'],
  pebai: ['Pregunta a PEBAI', '#B7FF3C', 'Responde lo que le preguntas sobre la oficina'],
  servidor: ['Resúmenes de sala', '#FFB547', 'Resume el día de cada departamento'],
  redactor: ['Redactor', '#D97757', 'Escribe primeros mensajes (de reserva)'],
  demos: ['Demos', '#FB923C', 'Prepara la página de cada empresa: búsqueda en IA, asistente y app'],
  oficina: ['Oficina', '#F4A582', 'Explica cada agente y escribe el parte del día'],
  general: ['Otros', '#8C8FA3', 'Otras llamadas'],
};
const ag = (k) => AG[k] || [k, '#8C8FA3', ''];
const MOD = {
  'claude-haiku-5-5': ['Haiku 5.5', '#3FD5FF', 'Lee y clasifica'],
  'claude-sonnet-5-5': ['Sonnet 5.5', '#9C93FF', 'Escribe'],
  'claude-opus-5-5': ['Opus 5.5', '#FF8A5C', 'Analiza a fondo'],
};
const mod = (m, p) => p === 'gemini' ? ['Gemini (reserva)', '#5C5F73', 'Gratis, cuando Claude no responde'] : MOD[m] || [m, '#8C8FA3', ''];

/* ---------- piezas ---------- */
function anillo(gastado, total, freno) {
  const r = 78, L = 2 * Math.PI * r, f = Math.min(1, gastado / total), col = f >= freno ? '#FF5E6C' : f >= .7 ? '#FFB547' : '#B7FF3C';
  const marca = (k) => { const a = -Math.PI / 2 + k * 2 * Math.PI; return `<line x1="${100 + Math.cos(a) * 66}" y1="${100 + Math.sin(a) * 66}" x2="${100 + Math.cos(a) * 90}" y2="${100 + Math.sin(a) * 90}" class="marca"/>`; };
  return `<svg viewBox="0 0 200 200" class="ga-anillo" role="img" aria-label="Gastado ${USD(gastado)} de ${total} $">
    <circle cx="100" cy="100" r="${r}" class="fondo"/>
    <circle cx="100" cy="100" r="${r}" class="valor" stroke="${col}" stroke-dasharray="${(L * f).toFixed(1)} ${L.toFixed(1)}" transform="rotate(-90 100 100)"/>
    ${marca(freno)}
    <text x="100" y="94" class="grande">${(f * 100).toFixed(f < .1 ? 1 : 0).replace('.', ',')} %</text>
    <text x="100" y="118" class="peq">del crédito del mes</text>
  </svg>`;
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const iso = (t) => `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
const finDeMes = (ym) => { const [y, m] = ym.split('-').map(Number); return iso(new Date(y, m, 0)); };
const fechaC = (f) => `${+f.slice(8)} ${MESES[+f.slice(5, 7) - 1].slice(0, 3)}`;
// Periodo elegido: por defecto, este mes (se recuerda mientras dura la sesión)
const P = { desde: '', hasta: '' };
try { Object.assign(P, JSON.parse(sessionStorage.getItem('pb-gasto-periodo') || '{}')); } catch (e) { /* nada */ }

function barrasDiarias(d) {
  // Día a día del periodo, apilado por agente; altura según el día de más gasto
  // este mes: el mes entero (los días que faltan, vacíos); y nunca menos de 7 columnas, para que una sola barra no ocupe todo
  const hastaVer = d.este_mes ? finDeMes(d.desde.slice(0, 7)) : d.hasta;
  const dias = []; for (let t = new Date(d.desde + 'T12:00:00'), fin = new Date(hastaVer + 'T12:00:00'); t <= fin && dias.length < 120; t.setDate(t.getDate() + 1)) dias.push(iso(t));
  for (let t = new Date(dias[dias.length - 1] + 'T12:00:00'); dias.length < 7;) { t.setDate(t.getDate() + 1); dias.push(iso(t)); }
  const nD = dias.length, hoyIso = iso(new Date());
  const por = {}; d.diario.forEach((r) => { (por[r.dia] = por[r.dia] || []).push(r); });
  const tot = (dia) => (por[dia] || []).reduce((s, r) => s + (+r.usd || 0), 0);
  const max = Math.max(.01, ...dias.map(tot));
  const W = 720, H = 190, bw = W / nD;
  const bars = dias.map((dia, i) => {
    let y = H; const segs = (por[dia] || []).filter((r) => +r.usd > 0).sort((a, b) => b.usd - a.usd).map((r) => {
      const h = Math.max(1.5, (+r.usd / max) * (H - 24)); y -= h; return `<rect x="${i * bw + 3}" y="${y.toFixed(1)}" width="${bw - 6}" height="${h.toFixed(1)}" rx="3" fill="${ag(r.agente)[1]}"/>`;
    }).join('');
    const llam = (por[dia] || []).reduce((s, r) => s + (+r.n || 0), 0);
    const pista = `${+dia.slice(8)}/${+dia.slice(5, 7)} · ${USD(tot(dia))} · ${llam} llamadas` + (por[dia] || []).map((r) => `\n${ag(r.agente)[0]}: ${USD(+r.usd)}`).join('');
    return `<g class="dia${dia === hoyIso ? ' hoy' : ''}"><title>${esc(pista)}</title><rect x="${i * bw}" y="0" width="${bw}" height="${H}" class="zona"/>${segs || (dia > hoyIso ? '' : `<rect x="${i * bw + 3}" y="${H - 2}" width="${bw - 6}" height="2" rx="1" class="cero"/>`)}</g>`;
  }).join('');
  const paso = Math.max(1, Math.ceil(nD / 7));
  const lbl = dias.map((dia, i) => (i % paso === 0 || i === nD - 1) ? `<text x="${i * bw + bw / 2}" y="${H + 16}">${dia === hoyIso ? 'hoy' : +dia.slice(8) + '/' + +dia.slice(5, 7)}</text>` : '').join('');
  return `<svg viewBox="0 0 ${W} ${H + 22}" class="ga-barras" preserveAspectRatio="none">${bars}${lbl}<text x="0" y="12" class="max">${USD(max)}</text></svg>`;
}

function donut(lista) {
  const tot = lista.reduce((s, m) => s + (+m.n || 0), 0) || 1; let a0 = -Math.PI / 2;
  const arcos = lista.map((m) => {
    const f = (+m.n || 0) / tot, a1 = a0 + f * Math.PI * 2, gran = f > .5 ? 1 : 0, r = 62, c = 80;
    const p = f >= .999 ? `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${mod(m.modelo, m.proveedor)[1]}" stroke-width="22"/>`
      : `<path d="M${c + Math.cos(a0) * r} ${c + Math.sin(a0) * r} A${r} ${r} 0 ${gran} 1 ${c + Math.cos(a1) * r} ${c + Math.sin(a1) * r}" fill="none" stroke="${mod(m.modelo, m.proveedor)[1]}" stroke-width="22"/>`;
    a0 = a1; return p;
  }).join('');
  return `<svg viewBox="0 0 160 160" class="ga-donut"><circle cx="80" cy="80" r="62" class="fondo"/>${arcos}<text x="80" y="78" class="grande">${N(tot)}</text><text x="80" y="96" class="peq">llamadas</text></svg>`;
}

/* ---------- pintar ---------- */
function pintar(d) {
  const m = d.mes, gastado = +m.usd || 0, quedan = Math.max(0, d.presupuesto - gastado), prev = +d.prevision || 0;
  const maxAg = Math.max(.0001, ...d.agentes.map((a) => +a.usd || 0));
  const totAg = d.agentes.reduce((s, a) => s + (+a.usd || 0), 0) || 1;
  raiz.innerHTML = `
  <header class="ga-cab">
    <div><h2>Gasto IA</h2><p>Lo que gasta cada agente en Claude. Si un día Claude no responde o se acaba el crédito, tiran de Gemini (gratis) y no se pierde nada.</p></div>
    <div class="ga-periodo">
      ${(d.meses.length ? d.meses : [{ m: d.desde.slice(0, 7) }]).map((x) => { const sel = d.desde === x.m + '-01' && (d.hasta === finDeMes(x.m) || (d.este_mes && x.m === iso(new Date()).slice(0, 7))); return `<button type="button" data-m="${esc(x.m)}" class="${sel ? 'on' : ''}">${esc(MESES[+x.m.slice(5) - 1])}${x.usd != null ? `<small>${USD(+x.usd || 0)}</small>` : ''}</button>`; }).join('')}
      <details class="ga-fechas"><summary>Fechas…</summary><div><label>Desde<input type="date" id="ga-desde" value="${esc(d.desde)}"></label><label>Hasta<input type="date" id="ga-hasta" value="${esc(d.hasta)}"></label><button type="button" id="ga-ver">Ver</button></div></details>
    </div>
  </header>
  ${d.caido ? `<div class="ga-caido">${ico('<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>')}<b>Claude no responde.</b> ${esc(d.caido)}</div>` : ''}
  <p class="ga-rango">${esc(fechaC(d.desde))} – ${esc(fechaC(d.hasta))}${d.este_mes ? ' · este mes' : ''}</p>

  <section class="ga-hero">
    <div class="ga-ring">${anillo(gastado, d.presupuesto, d.freno)}
      <div class="ga-ring-tx"><b>${USD(gastado)}</b><span>de ${N(d.presupuesto)} $ ${d.este_mes ? 'este mes' : 'al mes'}</span><em>${d.este_mes ? `Quedan ${USD(quedan)} · se renueva el día 1` : `Gastado del ${esc(fechaC(d.desde))} al ${esc(fechaC(d.hasta))}`}</em></div>
    </div>
    <div class="ga-kpis">
      ${d.este_mes ? `<div class="ga-kpi"><small>Hoy</small><b>${USD(+d.hoy.usd || 0)}</b><span>${N(d.hoy.claude)} llamadas a Claude</span></div>
      <div class="ga-kpi ${prev > d.presupuesto * d.freno ? 'mal' : 'bien'}"><small>Previsión fin de mes</small><b>${USD(prev)}</b><span>${prev > d.presupuesto * d.freno ? 'A este ritmo se acaba antes: pasará a Gemini' : 'Al ritmo de ahora, sobra crédito'}</span></div>`
      : `<div class="ga-kpi"><small>Media por día</small><b>${USD(gastado / Math.max(1, Math.round((new Date(d.hasta) - new Date(d.desde)) / 864e5) + 1))}</b><span>en el periodo elegido</span></div>`}
      <div class="ga-kpi"><small>Llamadas del periodo</small><b>${N(m.claude)}</b><span>Claude · ${N(m.gemini)} de reserva con Gemini${m.fallos ? ` · ${N(m.fallos)} fallidas` : ''}</span></div>
      <div class="ga-kpi"><small>Ahorro de la caché</small><b>${USD(+d.ahorro_cache || 0)}</b><span>${K(m.ent)} tokens leídos · ${K(m.sal)} escritos</span></div>
    </div>
  </section>

  <section class="ga-card">
    <div class="ga-card-h"><h3>Día a día</h3><span>Cada color es un agente · pasa el ratón por una barra</span></div>
    ${d.diario.length ? barrasDiarias(d) + `<div class="ga-leyd">${[...new Set(d.diario.map((r) => r.agente))].map((k) => `<span style="--c:${ag(k)[1]}"><i></i>${esc(ag(k)[0])}</span>`).join('')}</div>` : '<p class="ga-vacio">Aún no hay llamadas. En cuanto un agente use Claude, aparece aquí.</p>'}
  </section>

  <div class="ga-dos">
    <section class="ga-card">
      <div class="ga-card-h"><h3>Por agente</h3><span>En el periodo</span></div>
      ${d.agentes.length ? d.agentes.map((a) => { const [n, c, que] = ag(a.agente); return `
        <div class="ga-ag" style="--c:${c}">
          <div class="ga-ag-t"><i></i><b>${esc(n)}</b><span>${USD(+a.usd || 0)}</span></div>
          <div class="ga-ag-b"><u style="width:${Math.max(2, (+a.usd || 0) / maxAg * 100).toFixed(1)}%"></u></div>
          <div class="ga-ag-m"><span>${esc(que)}</span><span>${N(a.claude)} Claude${+a.gemini ? ' · ' + N(a.gemini) + ' Gemini' : ''} · ${((+a.usd || 0) / totAg * 100).toFixed(0)} %</span></div>
        </div>`; }).join('') : '<p class="ga-vacio">Ningún agente ha usado la IA este mes.</p>'}
    </section>
    <section class="ga-card">
      <div class="ga-card-h"><h3>Por modelo</h3><span>Cada tarea con el modelo justo</span></div>
      ${d.modelos.length ? `<div class="ga-mods">${donut(d.modelos)}<div class="ga-ley">${d.modelos.map((x) => { const [n, c, que] = mod(x.modelo, x.proveedor); return `
        <div style="--c:${c}"><i></i><b>${esc(n)}</b><span>${esc(que)}</span><em>${N(x.n)} · ${USD(+x.usd || 0)}</em></div>`; }).join('')}</div></div>` : '<p class="ga-vacio">Sin llamadas todavía.</p>'}
      <div class="ga-precios">${Object.entries(d.precios).map(([k, [i, o]]) => `<span>${esc(mod(k)[0])}: ${String(i).replace('.', ',')} $ / ${String(o).replace('.', ',')} $ por millón</span>`).join('')}</div>
    </section>
  </div>

  <section class="ga-card">
    <div class="ga-card-h"><h3>Últimas llamadas</h3><span>Las 25 más recientes del periodo</span></div>
    ${d.ultimas.length ? `<div class="ga-tabla">${d.ultimas.map((u) => { const [n, c] = ag(u.agente), [mn, mc] = mod(u.modelo, u.proveedor); return `
      <div class="ga-fila${+u.ok ? '' : ' mal'}" title="${esc(u.nota || '')}">
        <time>${esc(String(u.ts).slice(11, 16))}<small>${esc(+String(u.ts).slice(8, 10) + '/' + +String(u.ts).slice(5, 7))}</small></time>
        <span class="who" style="--c:${c}"><i></i>${esc(n)}</span>
        <span class="mod" style="--c:${mc}">${esc(mn)}</span>
        <span class="tok">${+u.ok ? `${K(+u.entrada + +u.cache_lee)} → ${K(u.salida)}` : 'falló'}</span>
        <b>${u.proveedor === 'gemini' ? 'gratis' : +u.ok ? USD(+u.usd || 0) : '—'}</b>
      </div>`; }).join('')}</div>` : '<p class="ga-vacio">Sin llamadas todavía.</p>'}
  </section>

  <section class="ga-como">
    ${ico('<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/>')}
    <p><b>Cómo funciona.</b> Cada agente usa el modelo justo: <b>Haiku</b> para leer y clasificar (casi gratis), <b>Sonnet</b> para escribir y <b>Opus</b> para análisis a fondo.
    Al llegar al ${Math.round(d.freno * 100)} % del crédito, todo pasa solo a Gemini hasta el día 1. Lo que se repite se guarda en caché y cuesta un 90 % menos.</p>
  </section>`;
}

async function cargar() {
  if (!raiz.firstChild) raiz.innerHTML = '<div class="ga-cargando"><i></i><i></i><i></i></div>';
  try {
    const q = P.desde ? `&desde=${encodeURIComponent(P.desde)}&hasta=${encodeURIComponent(P.hasta || P.desde)}` : '';
    const r = await fetch(BASE + '?gasto=1' + q, { credentials: 'same-origin', headers: { Accept: 'application/json' } });
    if (r.status === 401) { location.reload(); return; }
    const j = await r.json(); if (!j.ok) throw new Error('sin datos');
    pintar(j);
    // elegir mes o fechas
    const fija = (desde, hasta) => { Object.assign(P, { desde, hasta }); try { sessionStorage.setItem('pb-gasto-periodo', JSON.stringify(P)); } catch (e) { /* nada */ } cargar(); };
    raiz.querySelectorAll('.ga-periodo button[data-m]').forEach((b) => { b.onclick = () => { const m = b.dataset.m; fija(m + '-01', m === iso(new Date()).slice(0, 7) ? '' : finDeMes(m)); }; });
    const ver = raiz.querySelector('#ga-ver');
    if (ver) ver.onclick = () => { const de = raiz.querySelector('#ga-desde').value, ha = raiz.querySelector('#ga-hasta').value; if (de) fija(de, ha || de); };
  } catch (e) { raiz.innerHTML = '<p class="ga-vacio">No se ha podido leer el gasto ahora. Prueba otra vez en un momento.</p>'; }
}
const abre = (p) => { if (p === 'gasto') cargar(); };
document.addEventListener('pb:page', (e) => abre(e.detail));
setInterval(() => { if (document.body.dataset.page === 'gasto' && !document.hidden) cargar(); }, 60000);
if (document.body.dataset.page === 'gasto' || window.PB_TAB === 'gasto') abre('gasto');
})();
