/* PEBAI · Panel — Contenido › Redes: análisis de cada tanda de reels en TikTok, Instagram, YouTube Shorts y Facebook.
   Datos en index.php?redes=1 (ver _redes_panel.php): métricas copiadas de Metricool + solicitudes desde redes en vivo.
   Gráficos en SVG propio. Todo texto que viene de los datos pasa por esc(). */
(() => {
'use strict';
const app = document.getElementById('pb-app');
const raiz = document.getElementById('pb-redes');
if (!app || !raiz) return;
const BASE = app.dataset.base;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const N = (n) => new Intl.NumberFormat('es-ES', { useGrouping: 'always', maximumFractionDigits: 1 }).format(n || 0);
const K = (n) => (n >= 1000 ? N(Math.round(n / 100) / 10) + ' mil' : N(Math.round(n)));
const sum = (a) => a.reduce((x, y) => x + (y || 0), 0);
const avg = (a) => { const b = a.filter((x) => x != null); return b.length ? sum(b) / b.length : 0; };
const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const fecha = (f) => { const [d, h] = f.split(' '); const [, m, dd] = d.split('-'); return `${+dd} ${MES[+m - 1]}${h ? ' · ' + h : ''}`; };
const dia = (f) => { const [, m, dd] = f.split(' ')[0].split('-'); return `${+dd}/${+m}`; };

const REDES = [
  { k: 'tt', n: 'TikTok', ico: '<path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 3c.4 2.6 2.2 4.4 5 4.6"/>' },
  { k: 'ig', n: 'Instagram', ico: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>' },
  { k: 'yt', n: 'YouTube Shorts', ico: '<rect x="2.5" y="5" width="19" height="14" rx="4"/><path d="m10 9 5 3-5 3z"/>' },
  { k: 'fb', n: 'Facebook', ico: '<path d="M15 3h-2a4 4 0 0 0-4 4v3H7v4h2v7h4v-7h3l1-4h-4V7a1 1 0 0 1 1-1h2z"/>' },
];
const RN = Object.fromEntries(REDES.map((r) => [r.k, r]));
// Logos de cada red: los de icons.js (Simple Icons, CC0) y Pinterest y Threads aquí
const EXTRA = {
  pinterest: { bg: '#E60023', d: 'M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z' },
  threads: { bg: '#000000', trazo: '<path d="M16.5 11.2c-.3-2.6-2-4-4.6-4-2.8 0-4.6 2-4.6 4.8s1.8 4.8 4.6 4.8c2.4 0 3.9-1.3 3.9-3.2 0-1.8-1.4-2.8-3.4-2.8-1.6 0-2.7.8-2.7 2 0 1.1.9 1.8 2.1 1.8 2.6 0 3.4-2.3 3.4-5.4"/><path d="M20 12c0 5-3.2 8-8 8s-8-3-8-8 3.2-8 8-8c3.6 0 6.3 1.7 7.4 4.7"/>' },
};
const BG = { instagram: 'linear-gradient(45deg,#F58529,#DD2A7B 45%,#8134AF 75%,#515BD4)', tiktok: '#000000', youtube: '#FF0000', facebook: '#1877F2', linkedin: '#0A66C2', x: '#000000', google: '#FFFFFF' };
function marca(k, tam) {
  const b = (window.PB_ICONS && window.PB_ICONS.brands && window.PB_ICONS.brands[k]) || EXTRA[k];
  if (!b) return `<span class="rd-marca ${tam || ''}">${ico('<circle cx="12" cy="12" r="8"/>')}</span>`;
  const fondo = (EXTRA[k] && EXTRA[k].bg) || BG[k] || b.bg || '#3a3d52';
  const dib = b.trazo ? `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round">${b.trazo}</svg>`
    : `<svg viewBox="0 0 24 24"><path fill="${k === 'google' ? '#4285F4' : '#fff'}" d="${b.d}"/></svg>`;
  return `<span class="rd-marca ${tam || ''}" style="background:${fondo}">${dib}</span>`;
}
const ico = (path, cls) => `<svg class="pb-i ${cls || ''}" viewBox="0 0 24 24">${path}</svg>`;
const S = { cargado: false, cargando: false, data: null, t: -1, orden: 'total', abierto: -1, ocultas: new Set() };
const hace = (ts) => {
  const m = Math.round((Date.now() - new Date(String(ts).replace(' ', 'T'))) / 60000);
  return m < 1 ? 'ahora mismo' : m < 60 ? `hace ${m} min` : m < 1440 ? `hace ${Math.round(m / 60)} h` : `hace ${Math.round(m / 1440)} días`;
};

/* Los datos vienen de Metricool a través del servidor (copia de 20 min). fresh: pedir los últimos ya (botón Actualizar).
   silencioso: recarga de fondo; solo repinta si hay datos nuevos. */
async function cargar(fresh, silencioso) {
  if (S.cargando) return;
  S.cargando = true;
  if (!silencioso && !S.data) raiz.innerHTML = '<div class="rd-load"><span></span><span></span><span></span></div>';
  const btn = raiz.querySelector('.rd-act'); if (btn) btn.classList.add('girando');
  try {
    const r = await fetch(BASE + '?redes=1' + (fresh ? '&fresh=1' : ''), { credentials: 'same-origin', cache: 'no-store' });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || 'Sin datos');
    const nuevo = !S.data || j.actualizado !== S.data.actualizado;
    S.data = j; S.cargado = true;
    if (S.t < 0) { const hoy = new Date().toISOString().slice(0, 10); S.t = Math.max(0, j.periodos.findIndex((p) => p.desde <= hoy && (!p.hasta || hoy <= p.hasta) && p.videos.length)); }
    if (nuevo || !silencioso) pintar(); else sello();
  } catch (e) {
    if (!S.data) raiz.innerHTML = `<div class="pb-err">No se ha podido cargar el análisis de redes: ${esc(e.message)}</div>`;
  } finally { S.cargando = false; const b = raiz.querySelector('.rd-act'); if (b) b.classList.remove('girando'); }
}
const sello = () => { const s = raiz.querySelector('.rd-sello'); if (s && S.data) s.textContent = 'Actualizado ' + hace(S.data.actualizado); };

/* ============ cálculos de la tanda ============ */
function calcula(T) {
  const V = T.videos.map((v, i) => {
    const tot = sum(REDES.map((r) => v[r.k] ? v[r.k].v : 0));
    const com = sum(REDES.map((r) => v[r.k] ? (v[r.k].c || 0) : 0));
    const inter = sum(REDES.map((r) => { const m = v[r.k]; return m ? (m.l || 0) + (m.c || 0) + (m.s || 0) + (m.g || 0) : 0; }));
    return { ...v, i, tot, com, inter };
  });
  const red = {};
  REDES.forEach((r) => {
    const con = V.filter((v) => v[r.k]);
    const vistas = con.map((v) => v[r.k].v);
    const mejor = con.slice().sort((a, b) => b[r.k].v - a[r.k].v)[0];
    red[r.k] = { vistas: sum(vistas), n: con.length, media: avg(vistas), mejor, serie: V.map((v) => v[r.k] ? v[r.k].v : null),
      com: sum(con.map((v) => v[r.k].c || 0)), seg: avg(con.map((v) => v[r.k].t ?? null)), com_l: sum(con.map((v) => v[r.k].l || 0)), sh: sum(con.map((v) => v[r.k].s || 0)) };
  });
  const total = sum(Object.values(red).map((x) => x.vistas));
  const seg = T.seguidores || {};
  const ganados = sum(Object.values(seg).map(([a, b]) => b - a));
  return { V, red, total, ganados, com: sum(V.map((v) => v.com)), inter: sum(V.map((v) => v.inter)), durMedia: avg(V.map((v) => v.dur)) };
}

/* ============ piezas ============ */
function cabecera(T) {
  const tabs = S.data.periodos.map((t, i) => {
    const vacio = !t.videos.length;
    return `<button type="button" data-tanda="${i}" class="${i === S.t ? 'on' : ''}" ${t.futuro ? `disabled title="Empieza el ${fecha(t.desde)}"` : ''}>${esc(t.nombre)}${vacio ? '' : `<em>${t.videos.length}</em>`}</button>`;
  }).join('');
  const hasta = T.hasta_real || T.hasta || T.desde;
  return `<div class="pb-pagehead rd-head">
    <div><div class="pb-eyebrow">Contenido · Redes</div>
      <h1 class="pb-h1">Los reels, <i>con lupa</i></h1>
      <p class="pb-lead">Cada vídeo en TikTok, Instagram, YouTube Shorts y Facebook: qué vio la gente, cuánto aguantó y qué trajo. Vídeos del <b>${fecha(T.desde)}</b> al <b>${fecha(hasta)}</b>${T.hasta ? '' : ' (sigue abierto)'}.</p></div>
    <div class="rd-head-r">
      <div class="rd-head-f">
        <div class="pb-seg rd-tandas">${tabs}</div>
        <button type="button" class="rd-acc-b" title="Cómo entrar en cada red, con usuario y contraseña"><span class="rd-acc-mini">${['instagram', 'tiktok', 'youtube'].map((k) => marca(k, 'xs')).join('')}</span><b>Accesos</b></button>
      </div>
      <div class="rd-vivo"><i></i><span class="rd-sello">Actualizado ${hace(S.data.actualizado)}</span><button type="button" class="pb-btn icon rd-act" title="Pedir ya los datos nuevos a Metricool">${ico('<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>')}</button></div>
      <small class="rd-fuente" title="Metricool no actualiza TikTok, Instagram y Facebook al momento: el dato de los últimos días puede subir todavía. YouTube se lee directamente del canal.">YouTube al momento · TikTok, Instagram y Facebook vía Metricool (hasta 24-48 h de retraso)</small>
      ${S.data.aviso ? `<small class="rd-aviso">${esc(S.data.aviso)}</small>` : ''}
    </div>
  </div>`;
}

function vacio(T) {
  return `<section class="pb-card rd-card rd-rev rd-vacio"><span class="rd-logo rd-c-tt">${ico(REDES[0].ico)}</span>
    <h2>Todavía no hay vídeos de ${esc(T.nombre.toLowerCase())}</h2>
    <p>En cuanto se publique el primero desde el ${fecha(T.desde)}, aparece aquí solo con sus cifras de las cuatro redes.</p></section>`;
}

function hero(T, C) {
  const sol = T.solicitudes;
  const partes = REDES.map((r) => `<i style="--w:${(C.red[r.k].vistas / C.total * 100).toFixed(2)}%" class="rd-c-${r.k}" title="${r.n}: ${N(C.red[r.k].vistas)}"></i>`).join('');
  const leyenda = REDES.map((r) => `<span><i class="rd-dot rd-c-${r.k}"></i>${r.n}<b>${Math.round(C.red[r.k].vistas / C.total * 100)}%</b></span>`).join('');
  const kpi = (lbl, val, sub, cls) => `<div class="rd-kpi ${cls || ''}"><span>${lbl}</span><b data-cuenta="${val}">0</b><small>${sub}</small></div>`;
  const segs = Object.entries(T.seguidores || {}).map(([k, [a, b]]) => `${RN[k].n.split(' ')[0]} ${a}→${b}`).join(' · ');
  return `<section class="rd-hero rd-rev">
    <div class="rd-hero-main">
      <span class="rd-tag">Vistas en cuatro redes</span>
      <div class="rd-big" data-cuenta="${C.total}">0</div>
      <p>${C.V.length} vídeos · media de <b>${N(Math.round(C.total / C.V.length))}</b> por vídeo sumando redes · <b>${N(Math.round(C.total / sum(REDES.map((r) => C.red[r.k].n))))}</b> por publicación</p>
      <div class="rd-split">${partes}</div>
      <div class="rd-split-l">${leyenda}</div>
    </div>
    <div class="rd-kpis">
      ${kpi('Seguidores ganados', C.ganados, esc(segs), 'lima')}
      ${kpi('Interacciones', C.inter, 'me gusta, comentarios, guardados y compartidos')}
      ${kpi('Comentarios', C.com, 'con y sin palabra clave', 'rojo')}
      ${kpi('Solicitudes desde redes', sol ? sol.redes : 0, sol ? `de ${N(sol.total)} solicitudes desde el ${fecha(T.desde)} · en vivo` : 'sin conexión con la base de datos', sol && sol.redes ? 'lima' : 'rojo')}
    </div>
  </section>`;
}

function spark(serie, k) {
  const W = 220, H = 46, n = serie.length, bw = W / n, max = Math.max(1, ...serie.filter((x) => x != null));
  return `<svg class="rd-spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">${serie.map((v, i) => v == null
    ? `<rect x="${i * bw + bw * .3}" y="${H - 2}" width="${bw * .4}" height="2" class="rd-nul"/>`
    : `<rect x="${i * bw + 1.5}" y="${H - Math.max(2, v / max * H)}" width="${bw - 3}" height="${Math.max(2, v / max * H)}" rx="2" class="rd-f-${k}" style="--d:${i * 30}ms"/>`).join('')}</svg>`;
}

function tarjetasRed(C) {
  const extra = {
    tt: (x) => [`${N(x.sh)}`, 'compartidos'],
    ig: (x) => [`${N(Math.round(avg(C.V.filter((v) => v.ig).map((v) => v.ig.vr))))}%`, 'pasa de 3 segundos'],
    yt: (x) => [`${N(Math.round(x.seg * 10) / 10)} s`, 'vistos de media'],
    fb: (x) => [`${N(Math.round(x.seg * 10) / 10)} s`, 'vistos de media'],
  };
  return `<section class="rd-redes">${REDES.map((r, i) => {
    const x = C.red[r.k];
    if (!x.n) return `<article class="rd-red rd-rev rd-b-${r.k} rd-red-vacia" style="--d:${i * 70}ms"><header><span class="rd-logo rd-c-${r.k}">${ico(r.ico)}</span><b>${r.n}</b><small>sin vídeos</small></header><p>Aún no se ha subido ningún reel aquí en este periodo.</p></article>`;
    const [ev, el] = extra[r.k](x);
    return `<article class="rd-red rd-rev rd-b-${r.k}" style="--d:${i * 70}ms">
      <header><span class="rd-logo rd-c-${r.k}">${ico(r.ico)}</span><b>${r.n}</b><small>${x.n} vídeos</small></header>
      <div class="rd-red-n"><b data-cuenta="${x.vistas}">0</b><span>vistas</span></div>
      <div class="rd-red-m"><div><b>${N(Math.round(x.media))}</b><span>por vídeo</span></div><div><b>${ev}</b><span>${el}</span></div><div><b>${N(x.com)}</b><span>comentarios</span></div></div>
      ${spark(x.serie, r.k)}
      <footer><span>Mejor</span><b title="${esc(x.mejor.titulo)}">${esc(x.mejor.titulo)}</b><em>${N(x.mejor[r.k].v)}</em></footer>
    </article>`;
  }).join('')}</section>`;
}

/* Curva: vistas de cada vídeo por red, en orden de publicación */
function curva(C) {
  const W = 960, H = 300, pl = 46, pr = 14, pt = 18, pb = 44, n = C.V.length;
  const vis = REDES.filter((r) => !S.ocultas.has(r.k));
  const max = Math.max(10, ...vis.flatMap((r) => C.red[r.k].serie.filter((v) => v != null)));
  const top = Math.ceil(max / (max > 1000 ? 500 : 100)) * (max > 1000 ? 500 : 100);
  const x = (i) => pl + (W - pl - pr) * (i / (n - 1)), y = (v) => pt + (H - pt - pb) * (1 - v / top);
  let g = '';
  for (let k = 0; k <= 4; k++) { const v = top * k / 4; g += `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" class="rd-grid"/><text x="${pl - 8}" y="${y(v) + 4}" class="rd-ax" text-anchor="end">${K(v)}</text>`; }
  const cada = Math.ceil(n / 16);
  C.V.forEach((v, i) => { if (i % cada) return; g += `<text x="${x(i)}" y="${H - pb + 18}" class="rd-ax" text-anchor="middle">${dia(v.f)}</text>`; });
  const lineas = vis.map((r) => {
    const pts = C.red[r.k].serie.map((v, i) => v == null ? null : [x(i), y(v)]);
    let d = '', area = '';
    pts.forEach((p, i) => { if (!p) return; d += (d && pts[i - 1] ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); });
    const ok = pts.filter(Boolean);
    area = `M${ok[0][0]} ${y(0)}` + ok.map((p) => `L${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('') + `L${ok[ok.length - 1][0]} ${y(0)}Z`;
    return `<path d="${area}" class="rd-area rd-f-${r.k}"/><path d="${d}" class="rd-line rd-s-${r.k}" pathLength="1"/>` +
      ok.map((p) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3.5" class="rd-pt rd-f-${r.k}"/>`).join('');
  }).join('');
  const hits = C.V.map((v, i) => `<rect x="${x(i) - (W - pl - pr) / (n - 1) / 2}" y="${pt}" width="${(W - pl - pr) / (n - 1)}" height="${H - pt - pb}" class="rd-hit" data-i="${i}"/>`).join('');
  const chips = REDES.map((r) => `<button type="button" data-red="${r.k}" class="${S.ocultas.has(r.k) ? '' : 'on'}"><i class="rd-dot rd-c-${r.k}"></i>${r.n}</button>`).join('');
  return `<section class="pb-card rd-card rd-rev rd-curva">
    <div class="rd-card-h"><div><h2>La curva de la tanda</h2><p>Vistas de cada vídeo, en orden de publicación. Pulsa una red para quitarla o ponerla.</p></div><div class="rd-chips">${chips}</div></div>
    <div class="rd-plot"><svg viewBox="0 0 ${W} ${H}" class="rd-svg" role="img" aria-label="Vistas por vídeo y red">${g}${lineas}<line class="rd-cross" x1="0" x2="0" y1="${pt}" y2="${H - pb}"/>${hits}</svg><div class="rd-tip" hidden></div></div>
  </section>`;
}

/* Vídeo a vídeo: ranking con mapa de calor por red */
function tabla(C) {
  const max = Object.fromEntries(REDES.map((r) => [r.k, Math.max(1, ...C.red[r.k].serie.filter((v) => v != null))]));
  const maxT = Math.max(...C.V.map((v) => v.tot));
  const ord = { total: (a, b) => b.tot - a.tot, fecha: (a, b) => a.i - b.i, ...Object.fromEntries(REDES.map((r) => [r.k, (a, b) => (b[r.k] ? b[r.k].v : -1) - (a[r.k] ? a[r.k].v : -1)])) };
  const filas = C.V.slice().sort(ord[S.orden]).map((v, pos) => {
    const celdas = REDES.map((r) => { const m = v[r.k]; return m ? `<td class="rd-heat rd-h-${r.k}" style="--a:${(.12 + .88 * m.v / max[r.k]).toFixed(3)}"><b>${N(m.v)}</b></td>` : '<td class="rd-heat rd-none">—</td>'; }).join('');
    const tags = `<em class="rd-st ${v.estilo}">${v.estilo === 'gancho' ? 'Gancho' : 'Sobrio'}</em>${v.palabra ? `<em class="rd-kw">${esc(v.palabra)}</em>` : ''}<em class="rd-du">${v.dur} s</em>`;
    const pila = REDES.map((r) => v[r.k] ? `<i class="rd-c-${r.k}" style="width:${(v[r.k].v / maxT * 100).toFixed(2)}%"></i>` : '').join('');
    const det = S.abierto === v.i ? `<tr class="rd-det"><td colspan="8">${detalle(v)}</td></tr>` : '';
    return `<tr class="rd-row ${S.abierto === v.i ? 'open' : ''}" data-v="${v.i}"><td class="rd-pos">${pos + 1}</td>
      <td class="rd-tit"><b>${esc(v.titulo)}</b><span>${fecha(v.f)}</span><div class="rd-tags">${tags}</div></td>${celdas}
      <td class="rd-tot"><b>${N(v.tot)}</b><div class="rd-pila">${pila}</div></td></tr>${det}`;
  }).join('');
  const th = (k, t) => `<th><button type="button" data-orden="${k}" class="${S.orden === k ? 'on' : ''}">${t}</button></th>`;
  return `<div class="rd-tabla-w"><table class="rd-tabla"><thead><tr><th>#</th>${th('fecha', 'Vídeo')}${REDES.map((r) => th(r.k, r.n.replace(' Shorts', ''))).join('')}${th('total', 'Total')}</tr></thead><tbody>${filas}</tbody></table></div>`;
}
const tablaCard = (C) => `<section class="pb-card rd-card rd-rev">
    <div class="rd-card-h"><div><h2>Vídeo a vídeo</h2><p>El color dice lo fuerte que fue cada vídeo dentro de su red. Pulsa una cabecera para ordenar y una fila para ver el detalle.</p></div></div>
    ${tabla(C)}</section>`;

function detalle(v) {
  const bloque = (r, filas) => v[r.k] ? `<div class="rd-dbox rd-b-${r.k}"><header><span class="rd-logo sm rd-c-${r.k}">${ico(r.ico)}</span>${r.n}${/^https:\/\//.test(v[r.k].url || '') ? `<a href="${esc(v[r.k].url)}" target="_blank" rel="noopener" class="rd-ver">Ver ${ico('<path d="M7 17 17 7M8 7h9v9"/>')}</a>` : ''}</header>${filas.map(([l, x]) => `<div><span>${l}</span><b>${x}</b></div>`).join('')}</div>` : '';
  const t = v.tt, i = v.ig, y = v.yt, f = v.fb;
  return `<div class="rd-dgrid">
    ${bloque(RN.tt, t ? [['Vistas', N(t.v)], ['Me gusta', N(t.l)], ['Comentarios', N(t.c)], ['Compartidos', N(t.s)], ['Me gusta cada 100 vistas', N(Math.round(t.l / Math.max(1, t.v) * 1000) / 10)]] : [])}
    ${bloque(RN.ig, i ? [['Vistas', N(i.v)], ['Alcance', N(i.r)], ['Pasa de 3 s', i.vr != null ? N(i.vr) + '%' : '—'], ['Segundos de media', N(i.t)], ['Me gusta · coment. · guard. · compart.', `${i.l} · ${i.c} · ${i.g} · ${i.s}`]] : [])}
    ${bloque(RN.yt, y ? [['Vistas', N(y.v)], ['Segundos de media', N(y.t)], ['Se ve del vídeo', v.dur ? Math.round(y.t / v.dur * 100) + '%' : '—'], ['Me gusta', N(y.l)], ['Comentarios', N(y.c)]] : [])}
    ${bloque(RN.fb, f ? [['Vistas', N(f.v)], ['Segundos de media', N(f.t)], ['Se ve del vídeo', v.dur ? Math.round(f.t / v.dur * 100) + '%' : '—']] : [])}
  </div>`;
}

/* Comparativas */
function estilos(C) {
  const g = C.V.filter((v) => v.estilo === 'gancho'), s = C.V.filter((v) => v.estilo === 'sobrio');
  const filas = REDES.map((r) => {
    const a = avg(g.filter((v) => v[r.k]).map((v) => v[r.k].v)), b = avg(s.filter((v) => v[r.k]).map((v) => v[r.k].v)), m = Math.max(a, b, 1);
    return `<div class="rd-vs"><span>${r.n.replace(' Shorts', '')}</span>
      <div class="rd-vs-b"><i class="g ${a >= b ? 'win' : ''}" style="--w:${a / m * 100}%"><b>${N(Math.round(a))}</b></i><i class="s ${b > a ? 'win' : ''}" style="--w:${b / m * 100}%"><b>${N(Math.round(b))}</b></i></div></div>`;
  }).join('');
  return `<article class="pb-card rd-card rd-rev"><div class="rd-card-h"><div><h2>Gancho contra sobrio</h2><p>Media de vistas por vídeo. ${g.length} con gancho en mayúsculas, ${s.length} sobrios con palabra clave.</p></div></div>
    <div class="rd-vs-l"><span><i class="rd-dot g"></i>Gancho («Deja de…»)</span><span><i class="rd-dot s"></i>Sobrio («Comenta…»)</span></div>${filas}</article>`;
}

function retencion(C) {
  const d = C.durMedia || 30;
  const datos = [['ig', avg(C.V.filter((v) => v.ig && v.ig.t != null).map((v) => v.ig.t))], ['yt', C.red.yt.seg], ['fb', C.red.fb.seg]].filter(([, s]) => s > 0);
  const filas = datos.map(([k, s]) =>
    `<div class="rd-ret"><span><i class="rd-dot rd-c-${k}"></i>${RN[k].n.replace(' Shorts', '')}</span><div class="rd-ret-t"><i class="rd-c-${k}" style="--w:${Math.min(100, s / d * 100).toFixed(1)}%"></i><em style="left:${Math.min(100, s / d * 100).toFixed(1)}%">${N(Math.round(s * 10) / 10)} s</em></div></div>`).join('');
  const marcas = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50].filter((s) => s <= d - 4).map((s) => `<span style="left:${s / d * 100}%">${s}s</span>`).join('');
  const parte = datos.length ? avg(datos.map(([, s]) => s)) / d : 0;
  const frase = parte < .2 ? 'menos de una quinta parte' : parte < .34 ? 'menos de un tercio' : parte < .5 ? 'menos de la mitad' : 'más de la mitad';
  return `<article class="pb-card rd-card rd-rev"><div class="rd-card-h"><div><h2>¿Hasta qué segundo aguantan?</h2><p>Tiempo medio que se queda la gente frente a lo que duran los vídeos (${Math.round(d)} s de media). TikTok no da este dato por la API.</p></div></div>
    ${filas}<div class="rd-ret-ax">${marcas}<span style="left:100%">${Math.round(d)}s</span></div>
    <p class="rd-nota">De media, la gente ve <b>${frase}</b> de cada vídeo (${Math.round(parte * 100)}%).${parte < .34 ? ' Los dos primeros segundos son el vídeo.' : ''}</p></article>`;
}

function viewRate(C) {
  const ig = C.V.filter((v) => v.ig && v.ig.vr != null);
  if (ig.length < 2) return '';
  const W = 420, H = 170, pl = 30, pr = 10, pt = 14, pb = 26, n = ig.length;
  const x = (i) => pl + (W - pl - pr) * i / (n - 1), y = (v) => pt + (H - pt - pb) * (1 - Math.min(v, 60) / 60);
  const pts = ig.map((v, i) => [x(i), y(v.ig.vr)]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('');
  // recta de tendencia (mínimos cuadrados)
  const xs = ig.map((_, i) => i), ys = ig.map((v) => v.ig.vr), mx = avg(xs), my = avg(ys);
  const b = sum(xs.map((xi, i) => (xi - mx) * (ys[i] - my))) / sum(xs.map((xi) => (xi - mx) ** 2)), a = my - b * mx;
  const baja = b < -0.3, sube = b > 0.3;
  let g = '';
  [0, 20, 40, 60].forEach((v) => { g += `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" class="rd-grid"/><text x="${pl - 6}" y="${y(v) + 4}" class="rd-ax" text-anchor="end">${v}%</text>`; });
  return `<article class="pb-card rd-card rd-rev"><div class="rd-card-h"><div><h2>${baja ? 'Cada vez enganchan menos' : sube ? 'Cada vez enganchan más' : '¿Enganchan los primeros segundos?'}</h2><p>Instagram: porcentaje de gente que pasa de los 3 primeros segundos, vídeo a vídeo.</p></div><div class="rd-pill ${baja ? 'rojo' : 'lima'}">${N(Math.round(ys[0]))}% → ${N(Math.round(ys[n - 1]))}%</div></div>
    <svg viewBox="0 0 ${W} ${H}" class="rd-svg" role="img" aria-label="Porcentaje que pasa de 3 segundos en Instagram">${g}
      <line x1="${x(0)}" y1="${y(a)}" x2="${x(n - 1)}" y2="${y(a + b * (n - 1))}" class="rd-trend ${baja ? '' : 'bien'}"/>
      <path d="${d}" class="rd-line rd-s-ig" pathLength="1"/>${pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="3.5" class="rd-pt rd-f-ig"><title>${esc(ig[i].titulo)}: ${ig[i].ig.vr}%</title></circle>`).join('')}
      <text x="${x(0)}" y="${H - 6}" class="rd-ax">${dia(ig[0].f)}</text><text x="${x(n - 1)}" y="${H - 6}" class="rd-ax" text-anchor="end">${dia(ig[n - 1].f)}</text></svg>
    <p class="rd-nota">${baja ? `Baja unos <b>${N(Math.abs(Math.round(b * 10) / 10))} puntos por vídeo</b>: el público ya ha visto ese plano y ese tema.`
      : sube ? `Sube unos <b>${N(Math.round(b * 10) / 10)} puntos por vídeo</b>: los primeros segundos funcionan mejor.` : 'Se mantiene estable de un vídeo a otro.'} La media es <b>${N(Math.round(my))}%</b>.</p></article>`;
}

function duracion(C) {
  const V = C.V.filter((v) => v.tt && v.dur);
  if (V.length < 2) return '';
  const W = 420, H = 190, pl = 40, pr = 12, pt = 12, pb = 30;
  const ys = V.map((v) => v.tt.v), ds = V.map((v) => v.dur);
  const x0 = Math.floor((Math.min(...ds) - 2) / 5) * 5, x1 = Math.ceil((Math.max(...ds) + 2) / 5) * 5;
  const paso = Math.max(...ys) > 1000 ? 500 : 100, yM = Math.max(paso, Math.ceil(Math.max(...ys) / paso) * paso);
  const x = (d) => pl + (W - pl - pr) * (d - x0) / (x1 - x0), y = (v) => pt + (H - pt - pb) * (1 - v / yM);
  // corte entre cortos y largos: la mediana de duración
  const med = ds.slice().sort((a, b) => a - b)[Math.floor(ds.length / 2)];
  let g = '';
  [0, yM / 2, yM].forEach((v) => { g += `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" class="rd-grid"/><text x="${pl - 6}" y="${y(v) + 4}" class="rd-ax" text-anchor="end">${K(v)}</text>`; });
  for (let d = x0; d <= x1; d += 5) g += `<text x="${x(d)}" y="${H - 8}" class="rd-ax" text-anchor="middle">${d}s</text>`;
  const cortos = V.filter((v) => v.dur < med), largos = V.filter((v) => v.dur >= med);
  const mc = avg(cortos.map((v) => v.tt.v)), ml = avg(largos.map((v) => v.tt.v));
  const top = V.slice().sort((a, b) => b.tt.v - a.tt.v)[0];
  const gana = cortos.length && mc > ml;
  return `<article class="pb-card rd-card rd-rev"><div class="rd-card-h"><div><h2>Duración contra vistas</h2><p>TikTok. Cada punto es un vídeo; a la derecha, los más largos.</p></div></div>
    <svg viewBox="0 0 ${W} ${H}" class="rd-svg" role="img" aria-label="Duración y vistas en TikTok">${g}
      <rect x="${x(x0)}" y="${pt}" width="${Math.max(0, x(med - .5) - x(x0))}" height="${H - pt - pb}" class="rd-zona"/>
      ${V.map((v) => `<circle cx="${x(v.dur)}" cy="${y(v.tt.v)}" r="6" class="rd-pt2 ${v.estilo}"><title>${esc(v.titulo)} · ${v.dur} s · ${N(v.tt.v)} vistas</title></circle>`).join('')}</svg>
    <p class="rd-nota">${cortos.length ? `Menos de ${med} s: <b>${N(Math.round(mc))}</b> vistas de media. ${med} s o más: <b>${N(Math.round(ml))}</b>. ${gana ? 'Los cortos tiran más.' : 'La duración no marca la diferencia.'}` : ''} El más visto dura ${top.dur} s (${N(top.tt.v)} vistas).</p></article>`;
}

function horas(C) {
  const fr = [['Mañana', (h) => h < 11], ['Mediodía', (h) => h >= 11 && h < 16], ['Tarde', (h) => h >= 16 && h < 20], ['Noche', (h) => h >= 20]];
  const filas = fr.map(([n, ok]) => {
    const vs = C.V.filter((v) => ok(+v.f.slice(11, 13)));
    return { n, k: vs.length, m: avg(vs.map((v) => v.tot)), h: [...new Set(vs.map((v) => v.f.slice(11, 16)))].slice(0, 3).join(', ') };
  }).filter((f) => f.k);
  if (!filas.length) return '';
  const m = Math.max(...filas.map((f) => f.m)), win = filas.find((f) => f.m === m);
  return `<article class="pb-card rd-card rd-rev"><div class="rd-card-h"><div><h2>A qué hora se publicó</h2><p>Media de vistas por vídeo sumando las cuatro redes.</p></div></div>
    ${filas.map((f) => `<div class="rd-hora"><div><b>${f.n}</b><span>${f.k} ${f.k === 1 ? 'vídeo' : 'vídeos'} · ${esc(f.h)}</span></div><div class="rd-hora-b"><i class="${f.m === m ? 'win' : ''}" style="--w:${f.m / m * 100}%"></i></div><em>${N(Math.round(f.m))}</em></div>`).join('')}
    <p class="rd-nota">Gana <b>${win.n.toLowerCase()}</b> (${win.k} ${win.k === 1 ? 'vídeo' : 'vídeos'}).${C.V.length < 25 ? ' Con pocos vídeos es una pista, no una regla.' : ''}</p></article>`;
}

function embudo(T, C) {
  const sol = T.solicitudes;
  const pasos = [['Vistas', C.total], ['Interacciones', C.inter], ['Comentarios', C.com], ['Solicitudes', sol ? sol.redes : 0]];
  const m = Math.max(1, pasos[0][1]);
  return `<article class="pb-card rd-card rd-rev rd-emb"><div class="rd-card-h"><div><h2>De la vista a la solicitud</h2><p>Lo que dejaron los vídeos en cada escalón. Las solicitudes se cuentan en vivo desde la base del formulario (las que llegan desde redes en estas fechas).</p></div></div>
    ${pasos.map(([n, v], i) => { const w = Math.max(3, Math.sqrt(v / m) * 100); const pct = i ? (pasos[i - 1][1] ? (v / pasos[i - 1][1] * 100) : 0) : 100;
      return `<div class="rd-emb-f" style="--d:${i * 90}ms"><span>${n}</span><div><i style="--w:${w}%"></i></div><b>${N(v)}</b><em>${i ? N(Math.round(pct * 10) / 10) + '%' : ''}</em></div>`; }).join('')}
    <p class="rd-nota">${C.com ? `De cada <b>${N(Math.round(C.total / C.com))}</b> vistas sale un comentario.` : 'Todavía no hay comentarios.'}${sol && sol.redes ? ` Y de cada <b>${N(Math.round(C.total / sol.redes))}</b> vistas, una solicitud.` : ''}</p></article>`;
}

/* ============ pintar y animar ============ */
function pintar() {
  const T = S.data.periodos[S.t];
  if (!T.videos.length) { raiz.innerHTML = cabecera(T) + vacio(T); animar(raiz); return; }
  const C = calcula(T);
  S.C = C;
  raiz.innerHTML = cabecera(T) + hero(T, C) + tarjetasRed(C) + (C.V.length > 1 ? curva(C) : '') + tablaCard(C) +
    `<section class="rd-g2">${estilos(C)}${retencion(C)}</section>` +
    `<section class="rd-g3">${viewRate(C)}${duracion(C)}${horas(C)}</section>` +
    embudo(T, C);
  animar(raiz);
}

function cuenta(el) {
  const fin = +el.dataset.cuenta, t0 = performance.now(), dur = 1400;
  const paso = (t) => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4); el.textContent = N(Math.round(fin * e)); if (p < 1) requestAnimationFrame(paso); };
  requestAnimationFrame(paso);
}

function animar(scope) {
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    e.target.querySelectorAll('[data-cuenta]').forEach((c) => { if (!c.dataset.hecho) { c.dataset.hecho = 1; cuenta(c); } });
    if (e.target.matches('[data-cuenta]') && !e.target.dataset.hecho) { e.target.dataset.hecho = 1; cuenta(e.target); }
    io.unobserve(e.target);
  }), { threshold: .12 });
  scope.querySelectorAll('.rd-rev').forEach((s) => io.observe(s));
}

/* Repinta solo una pieza (sin repetir las animaciones del resto) */
function cambia(sel, html) {
  const viejo = raiz.querySelector(sel); if (!viejo) return;
  const tmp = document.createElement('div'); tmp.innerHTML = html;
  const nuevo = tmp.firstElementChild; nuevo.classList.add('in', 'quieto'); viejo.replaceWith(nuevo);
}

raiz.addEventListener('click', (e) => {
  if (e.target.closest('a')) return;
  if (e.target.closest('.rd-act')) { cargar(true); return; }
  if (e.target.closest('.rd-acc-b')) { accesos(); return; }
  const tb = e.target.closest('[data-tanda]');
  if (tb && !tb.disabled) { S.t = +tb.dataset.tanda; S.abierto = -1; pintar(); return; }
  const ch = e.target.closest('[data-red]');
  if (ch) { const k = ch.dataset.red; if (S.ocultas.has(k)) S.ocultas.delete(k); else if (S.ocultas.size < 3) S.ocultas.add(k); cambia('.rd-curva', curva(S.C)); return; }
  const or = e.target.closest('[data-orden]');
  if (or) { S.orden = or.dataset.orden; cambia('.rd-tabla-w', tabla(S.C)); return; }
  const fila = e.target.closest('.rd-row');
  if (fila) { const i = +fila.dataset.v; S.abierto = S.abierto === i ? -1 : i; cambia('.rd-tabla-w', tabla(S.C)); }
});

/* Accesos a cada red: se piden al abrir (no se guardan en la página) y la contraseña va oculta hasta pulsar «Mostrar» */
async function accesos() {
  let j;
  try {
    const r = await fetch(BASE + '?redes_accesos=1', { credentials: 'same-origin', cache: 'no-store' });
    if (r.status === 401) { location.reload(); return; }
    j = await r.json();
  } catch (e) { j = { ok: false }; }
  const ov = document.createElement('div'); ov.className = 'rd-acc';
  const TEL = '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18h2"/>', USU = '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>';
  const chip = (x) => {
    const g = x.google === true ? `<span class="rd-via si">${marca('google', 'xs')}<i>✓</i>Con Google</span>`
      : x.google === false ? `<span class="rd-via no">${marca('google', 'xs')}<i>✕</i>${x.metodo === 'telefono' ? 'Nunca con Google' : 'Sin Google'}</span>` : '';
    const m = x.metodo === 'instagram' ? `<span class="rd-via ig">${marca('instagram', 'xs')}Con la cuenta de Instagram</span>`
      : x.metodo === 'telefono' ? `<span class="rd-via">${ico(TEL)}Con el teléfono</span>`
      : x.metodo === 'usuario' ? `<span class="rd-via">${ico(USU)}Usuario y contraseña</span>`
      : x.metodo === 'personal' ? `<span class="rd-via">${ico(USU)}Solo Daniel</span>` : '';
    return m + g;
  };
  const filas = (j.redes || []).map((x, i) => `<div class="rd-acc-r">${marca(x.icono)}<div class="rd-acc-cu"><div class="rd-acc-h"><b>${esc(x.red)}</b></div><div class="rd-acc-vias">${chip(x)}</div>`
    + (x.aviso ? `<p class="rd-acc-av">${esc(x.aviso)}</p>` : '')
    + (x.usuario ? `<div class="rd-acc-c"><small>Usuario</small><code>${esc(x.usuario)}</code><button type="button" data-copia="u${i}">Copiar</button></div>` : '')
    + (x.clave ? `<div class="rd-acc-c"><small>Contraseña</small><code data-clave="${i}">••••••••••</code><button type="button" data-ver="${i}">Mostrar</button><button type="button" data-copia="c${i}">Copiar</button></div>` : '')
    + (x.nota ? `<p class="rd-acc-n">${esc(x.nota)}</p>` : '') + '</div></div>').join('');
  ov.innerHTML = `<div class="rd-acc-in" role="dialog" aria-modal="true" aria-labelledby="rd-acc-t"><header><h2 id="rd-acc-t">Accesos a las redes</h2><button type="button" class="rd-acc-x" aria-label="Cerrar">×</button></header>`
    + (j.ok && filas ? filas : '<p class="rd-acc-n">Todavía no hay accesos guardados en el servidor.</p>')
    + '<p class="rd-acc-pie">Solo se ven con la sesión del panel iniciada. Nunca se guardan en el código.</p></div>';
  const cierra = () => { ov.remove(); document.removeEventListener('keydown', tecla); };
  const tecla = (e) => { if (e.key === 'Escape') cierra(); };
  document.addEventListener('keydown', tecla);
  ov.addEventListener('click', (e) => {
    if (e.target === ov || e.target.closest('.rd-acc-x')) { cierra(); return; }
    const v = e.target.closest('[data-ver]');
    if (v) { const c = ov.querySelector(`[data-clave="${v.dataset.ver}"]`), ver = v.textContent === 'Mostrar'; c.textContent = ver ? j.redes[+v.dataset.ver].clave : '••••••••••'; v.textContent = ver ? 'Ocultar' : 'Mostrar'; return; }
    const cp = e.target.closest('[data-copia]');
    if (cp) {
      const k = cp.dataset.copia, x = j.redes[+k.slice(1)], t = k[0] === 'u' ? x.usuario : x.clave;
      navigator.clipboard.writeText(t).then(() => { cp.textContent = 'Copiado'; setTimeout(() => { cp.textContent = 'Copiar'; }, 1500); }).catch(() => {});
    }
  });
  document.body.append(ov); ov.querySelector('.rd-acc-x').focus();
}

/* Tooltip de la curva */
raiz.addEventListener('mousemove', (e) => {
  const hit = e.target.closest('.rd-hit'), plot = e.target.closest('.rd-plot');
  if (!plot) return;
  const tip = plot.querySelector('.rd-tip'), cross = plot.querySelector('.rd-cross');
  if (!hit) { tip.hidden = true; cross.style.opacity = 0; return; }
  const v = S.C.V[+hit.dataset.i], svg = plot.querySelector('svg'), box = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
  const cx = +hit.getAttribute('x') + +hit.getAttribute('width') / 2;
  cross.setAttribute('x1', cx); cross.setAttribute('x2', cx); cross.style.opacity = 1;
  tip.innerHTML = `<b>${esc(v.titulo)}</b><small>${fecha(v.f)} · ${v.dur} s</small>` + REDES.filter((r) => !S.ocultas.has(r.k)).map((r) => `<div><i class="rd-dot rd-c-${r.k}"></i>${r.n}<em>${v[r.k] ? N(v[r.k].v) : '—'}</em></div>`).join('');
  tip.hidden = false;
  const px = cx / vb.width * box.width;
  tip.style.left = Math.min(Math.max(px, 110), box.width - 110) + 'px';
});
raiz.addEventListener('mouseleave', () => { const t = raiz.querySelector('.rd-tip'); if (t) t.hidden = true; }, true);

const abre = (p) => { if (p === 'redes') { if (!S.cargado) cargar(); else cargar(false, true); } };
// Mientras la sección está abierta: el sello «Actualizado hace…» cada minuto y datos nuevos cada 5 minutos (el servidor renueva con Metricool cada 20)
setInterval(() => { if (document.body.dataset.page !== 'redes' || document.hidden) return; sello(); }, 60000);
setInterval(() => { if (document.body.dataset.page === 'redes' && !document.hidden && S.cargado) cargar(false, true); }, 300000);
document.addEventListener('pb:page', (e) => abre(e.detail));
if (document.body.dataset.page === 'redes' || window.PB_TAB === 'redes') abre('redes');
})();
