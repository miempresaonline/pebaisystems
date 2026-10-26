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
const ico = (path, cls) => `<svg class="pb-i ${cls || ''}" viewBox="0 0 24 24">${path}</svg>`;
const S = { cargado: false, cargando: false, data: null, t: 0, orden: 'total', abierto: -1, ocultas: new Set() };

async function cargar() {
  if (S.cargando) return;
  S.cargando = true;
  raiz.innerHTML = '<div class="rd-load"><span></span><span></span><span></span></div>';
  try {
    const r = await fetch(BASE + '?redes=1', { credentials: 'same-origin', cache: 'no-store' });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || 'Sin datos');
    S.data = j; S.cargado = true; pintar();
  } catch (e) {
    raiz.innerHTML = `<div class="pb-err">No se ha podido cargar el análisis de redes: ${esc(e.message)}</div>`;
  } finally { S.cargando = false; }
}

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
  const tabs = S.data.tandas.map((t, i) => `<button type="button" data-tanda="${i}" class="${i === S.t ? 'on' : ''}">${esc(t.nombre)}</button>`).join('');
  return `<div class="pb-pagehead rd-head">
    <div><div class="pb-eyebrow">Contenido · Redes</div>
      <h1 class="pb-h1">Los reels, <i>con lupa</i></h1>
      <p class="pb-lead">Cada vídeo en TikTok, Instagram, YouTube Shorts y Facebook: qué vio la gente, cuánto aguantó y qué trajo. Del <b>${fecha(T.desde)}</b> al <b>${fecha(T.hasta)}</b>, datos de Metricool a ${fecha(T.corte)}.</p></div>
    <div class="pb-seg rd-tandas">${tabs}<button type="button" disabled title="Se abre cuando se publique la tanda de noviembre">Tanda 2 · noviembre</button></div>
  </div>`;
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
    const x = C.red[r.k], [ev, el] = extra[r.k](x);
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
  C.V.forEach((v, i) => { g += `<text x="${x(i)}" y="${H - pb + 18}" class="rd-ax" text-anchor="middle">${dia(v.f)}</text>`; });
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
  const bloque = (r, filas) => v[r.k] ? `<div class="rd-dbox rd-b-${r.k}"><header><span class="rd-logo sm rd-c-${r.k}">${ico(r.ico)}</span>${r.n}</header>${filas.map(([l, x]) => `<div><span>${l}</span><b>${x}</b></div>`).join('')}</div>` : '';
  const t = v.tt, i = v.ig, y = v.yt, f = v.fb;
  return `<div class="rd-dgrid">
    ${bloque(RN.tt, t ? [['Vistas', N(t.v)], ['Me gusta', N(t.l)], ['Comentarios', N(t.c)], ['Compartidos', N(t.s)], ['Me gusta cada 100 vistas', N(Math.round(t.l / Math.max(1, t.v) * 1000) / 10)]] : [])}
    ${bloque(RN.ig, i ? [['Vistas', N(i.v)], ['Alcance', N(i.r)], ['Pasa de 3 s', N(i.vr) + '%'], ['Segundos de media', N(i.t)], ['Me gusta · coment. · guard. · compart.', `${i.l} · ${i.c} · ${i.g} · ${i.s}`]] : [])}
    ${bloque(RN.yt, y ? [['Vistas', N(y.v)], ['Segundos de media', N(y.t)], ['Se ve del vídeo', Math.round(y.t / v.dur * 100) + '%'], ['Me gusta', N(y.l)], ['Comentarios', N(y.c)]] : [])}
    ${bloque(RN.fb, f ? [['Vistas', N(f.v)], ['Segundos de media', N(f.t)], ['Se ve del vídeo', Math.round(f.t / v.dur * 100) + '%']] : [])}
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
  const d = C.durMedia;
  const filas = [['ig', avg(C.V.filter((v) => v.ig).map((v) => v.ig.t))], ['yt', C.red.yt.seg], ['fb', C.red.fb.seg]].map(([k, s]) =>
    `<div class="rd-ret"><span><i class="rd-dot rd-c-${k}"></i>${RN[k].n.replace(' Shorts', '')}</span><div class="rd-ret-t"><i class="rd-c-${k}" style="--w:${(s / d * 100).toFixed(1)}%"></i><em style="left:${(s / d * 100).toFixed(1)}%">${N(Math.round(s * 10) / 10)} s</em></div></div>`).join('');
  const marcas = [0, 5, 10, 15, 20, 25, 30].filter((s) => s <= d - 4).map((s) => `<span style="left:${s / d * 100}%">${s}s</span>`).join('');
  return `<article class="pb-card rd-card rd-rev"><div class="rd-card-h"><div><h2>¿Hasta qué segundo aguantan?</h2><p>Tiempo medio que se queda la gente frente a lo que duran los vídeos (${Math.round(d)} s de media). TikTok no da este dato por la API.</p></div></div>
    ${filas}<div class="rd-ret-ax">${marcas}<span style="left:100%">${Math.round(d)}s</span></div>
    <p class="rd-nota">La gente ve <b>menos de una quinta parte</b> de cada vídeo. Los dos primeros segundos son el vídeo.</p></article>`;
}

function viewRate(C) {
  const ig = C.V.filter((v) => v.ig);
  const W = 420, H = 170, pl = 30, pr = 10, pt = 14, pb = 26, n = ig.length;
  const x = (i) => pl + (W - pl - pr) * i / (n - 1), y = (v) => pt + (H - pt - pb) * (1 - v / 60);
  const pts = ig.map((v, i) => [x(i), y(v.ig.vr)]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('');
  // recta de tendencia (mínimos cuadrados)
  const xs = ig.map((_, i) => i), ys = ig.map((v) => v.ig.vr), mx = avg(xs), my = avg(ys);
  const b = sum(xs.map((xi, i) => (xi - mx) * (ys[i] - my))) / sum(xs.map((xi) => (xi - mx) ** 2)), a = my - b * mx;
  let g = '';
  [0, 20, 40, 60].forEach((v) => { g += `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" class="rd-grid"/><text x="${pl - 6}" y="${y(v) + 4}" class="rd-ax" text-anchor="end">${v}%</text>`; });
  return `<article class="pb-card rd-card rd-rev"><div class="rd-card-h"><div><h2>Cada vez enganchan menos</h2><p>Instagram: porcentaje de gente que pasa de los 3 primeros segundos, vídeo a vídeo.</p></div><div class="rd-pill rojo">${N(Math.round(ys[0]))}% → ${N(Math.round(ys[n - 1]))}%</div></div>
    <svg viewBox="0 0 ${W} ${H}" class="rd-svg" role="img" aria-label="Porcentaje que pasa de 3 segundos en Instagram">${g}
      <line x1="${x(0)}" y1="${y(a)}" x2="${x(n - 1)}" y2="${y(a + b * (n - 1))}" class="rd-trend"/>
      <path d="${d}" class="rd-line rd-s-ig" pathLength="1"/>${pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="3.5" class="rd-pt rd-f-ig"><title>${esc(ig[i].titulo)}: ${ig[i].ig.vr}%</title></circle>`).join('')}
      <text x="${x(0)}" y="${H - 6}" class="rd-ax">${dia(ig[0].f)}</text><text x="${x(n - 1)}" y="${H - 6}" class="rd-ax" text-anchor="end">${dia(ig[n - 1].f)}</text></svg>
    <p class="rd-nota">Baja unos <b>${N(Math.abs(Math.round(b * 10) / 10))} puntos por vídeo</b>: el plano y el tema se repiten y el público ya lo ha visto.</p></article>`;
}

function duracion(C) {
  const W = 420, H = 190, pl = 40, pr = 12, pt = 12, pb = 30;
  const xs = C.V.map((v) => v.dur), ys = C.V.map((v) => v.tt.v);
  const x0 = 20, x1 = 46, yM = Math.ceil(Math.max(...ys) / 500) * 500;
  const x = (d) => pl + (W - pl - pr) * (d - x0) / (x1 - x0), y = (v) => pt + (H - pt - pb) * (1 - v / yM);
  let g = '';
  [0, yM / 2, yM].forEach((v) => { g += `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" class="rd-grid"/><text x="${pl - 6}" y="${y(v) + 4}" class="rd-ax" text-anchor="end">${K(v)}</text>`; });
  [20, 25, 30, 35, 40, 45].forEach((d) => { g += `<text x="${x(d)}" y="${H - 8}" class="rd-ax" text-anchor="middle">${d}s</text>`; });
  const cortos = C.V.filter((v) => v.dur <= 27), largos = C.V.filter((v) => v.dur > 27);
  const mc = avg(cortos.map((v) => v.tt.v)), ml = avg(largos.map((v) => v.tt.v));
  return `<article class="pb-card rd-card rd-rev"><div class="rd-card-h"><div><h2>Duración contra vistas</h2><p>TikTok. Cada punto es un vídeo; a la derecha, los más largos.</p></div></div>
    <svg viewBox="0 0 ${W} ${H}" class="rd-svg" role="img" aria-label="Duración y vistas en TikTok">${g}
      <rect x="${x(20)}" y="${pt}" width="${x(27.5) - x(20)}" height="${H - pt - pb}" class="rd-zona"/>
      ${C.V.map((v) => `<circle cx="${x(v.dur)}" cy="${y(v.tt.v)}" r="6" class="rd-pt2 ${v.estilo}"><title>${esc(v.titulo)} · ${v.dur} s · ${N(v.tt.v)} vistas</title></circle>`).join('')}</svg>
    <p class="rd-nota">Hasta 27 s: <b>${N(Math.round(mc))}</b> vistas de media. Más largos: <b>${N(Math.round(ml))}</b>. El más visto (1.564) es la excepción: fue el primero de la cuenta.</p></article>`;
}

function horas(C) {
  const fr = [['Madrugada', (h) => h < 9], ['Mediodía', (h) => h >= 11 && h < 14], ['Tarde', (h) => h >= 17]];
  const filas = fr.map(([n, ok]) => {
    const vs = C.V.filter((v) => ok(+v.f.slice(11, 13)));
    return { n, k: vs.length, m: avg(vs.map((v) => v.tot)), h: [...new Set(vs.map((v) => v.f.slice(11, 16)))].slice(0, 3).join(', ') };
  }).filter((f) => f.k);
  const m = Math.max(...filas.map((f) => f.m));
  return `<article class="pb-card rd-card rd-rev"><div class="rd-card-h"><div><h2>A qué hora se publicó</h2><p>Media de vistas por vídeo sumando las cuatro redes.</p></div></div>
    ${filas.map((f) => `<div class="rd-hora"><div><b>${f.n}</b><span>${f.k} vídeos · ${esc(f.h)}</span></div><div class="rd-hora-b"><i class="${f.m === m ? 'win' : ''}" style="--w:${f.m / m * 100}%"></i></div><em>${N(Math.round(f.m))}</em></div>`).join('')}
    <p class="rd-nota">El mediodía (12:00) gana con menos vídeos. Con tan pocos datos es una pista, no una regla.</p></article>`;
}

function embudo(T, C) {
  const sol = T.solicitudes;
  const pasos = [['Vistas', C.total], ['Interacciones', C.inter], ['Comentarios', C.com], ['Solicitudes', sol ? sol.redes : 0]];
  const m = pasos[0][1];
  return `<article class="pb-card rd-card rd-rev rd-emb"><div class="rd-card-h"><div><h2>De la vista a la solicitud</h2><p>Lo que dejó la tanda en cada escalón. Las solicitudes se cuentan en vivo desde la base del formulario.</p></div></div>
    ${pasos.map(([n, v], i) => { const w = Math.max(3, Math.sqrt(v / m) * 100); const pct = i ? (pasos[i - 1][1] ? (v / pasos[i - 1][1] * 100) : 0) : 100;
      return `<div class="rd-emb-f" style="--d:${i * 90}ms"><span>${n}</span><div><i style="--w:${w}%"></i></div><b>${N(v)}</b><em>${i ? N(Math.round(pct * 10) / 10) + '%' : ''}</em></div>`; }).join('')}
    <p class="rd-nota">De cada <b>${N(Math.round(C.total / Math.max(1, C.com)))}</b> vistas sale un comentario. Pedir una palabra clave a quien no te conoce no funciona todavía.</p></article>`;
}

function conclusiones(T) {
  return `<section class="rd-conc rd-rev"><div class="rd-sec-h"><span class="pb-eyebrow">Diagnóstico</span><h2 class="pb-h1">Por qué <i>no ha funcionado</i></h2></div>
    <div class="rd-conc-g">${T.conclusiones.map((c, i) => `<article class="rd-c ${i === T.conclusiones.length - 1 ? 'bien' : ''}" style="--d:${i * 70}ms"><em>${String(i + 1).padStart(2, '0')}</em><b>${esc(c.t)}</b><p>${esc(c.d)}</p></article>`).join('')}</div></section>`;
}

function ideas() {
  const I = S.data.ideas || [];
  return `<section class="rd-ideas rd-rev"><div class="rd-sec-h"><span class="pb-eyebrow">Tanda 2 · noviembre</span><h2 class="pb-h1">Vídeos para <i>todo el mundo</i></h2>
    <p class="pb-lead">Más dinámicos, cámara en movimiento y un sitio distinto en cada vídeo. Que guste a cualquiera y que el final hable de empresas.</p></div>
    <div class="rd-ideas-g">${I.map((x, i) => `<article class="rd-idea ${x.fav ? 'fav' : ''}" style="--d:${i * 60}ms">
      <header><em>${String(x.n).padStart(2, '0')}</em><span class="rd-red-tag">${esc(x.red)}</span>${x.fav ? '<span class="rd-fav">Favorita</span>' : ''}</header>
      <b>${esc(x.t)}</b><q>${esc(x.h)}</q><p>${ico('<path d="M3 7h3l2-3h8l2 3h3v13H3z"/><circle cx="12" cy="13" r="4"/>')}${esc(x.c)}</p></article>`).join('')}</div></section>`;
}

/* ============ pintar y animar ============ */
function pintar() {
  const T = S.data.tandas[S.t], C = calcula(T);
  S.C = C;
  raiz.innerHTML = cabecera(T) + hero(T, C) + tarjetasRed(C) + curva(C) + tablaCard(C) +
    `<section class="rd-g2">${estilos(C)}${retencion(C)}</section>` +
    `<section class="rd-g3">${viewRate(C)}${duracion(C)}${horas(C)}</section>` +
    embudo(T, C) + conclusiones(T) + ideas();
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
  const tb = e.target.closest('[data-tanda]');
  if (tb && !tb.disabled) { S.t = +tb.dataset.tanda; S.abierto = -1; pintar(); return; }
  const ch = e.target.closest('[data-red]');
  if (ch) { const k = ch.dataset.red; if (S.ocultas.has(k)) S.ocultas.delete(k); else if (S.ocultas.size < 3) S.ocultas.add(k); cambia('.rd-curva', curva(S.C)); return; }
  const or = e.target.closest('[data-orden]');
  if (or) { S.orden = or.dataset.orden; cambia('.rd-tabla-w', tabla(S.C)); return; }
  const fila = e.target.closest('.rd-row');
  if (fila) { const i = +fila.dataset.v; S.abierto = S.abierto === i ? -1 : i; cambia('.rd-tabla-w', tabla(S.C)); }
});

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

const abre = (p) => { if (p === 'redes' && !S.cargado) cargar(); };
document.addEventListener('pb:page', (e) => abre(e.detail));
if (document.body.dataset.page === 'redes' || window.PB_TAB === 'redes') abre('redes');
})();
