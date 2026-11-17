/* PEBAI · Panel — ayudantes comunes del rediseño (17/11/2026). Todo devuelve texto HTML/SVG listo para innerHTML.
   window.PBX = { esc, ico, logo, cara, caras, colorDe, ini, etapas, anillo, donut, medidor, area, barras, split, red } */
(() => {
'use strict';
const IC = window.PB_ICONS || { brands: {}, ui: {} };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const PAL = ['#6A5CFF', '#3FB5C9', '#7FBF2A', '#E0A030', '#E05A6A', '#25B865', '#C04A9A', '#4C8DFF', '#C98A4B', '#8E84FF'];
const colorDe = (s) => { let h = 0; for (const ch of String(s || '?')) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return PAL[h % PAL.length]; };
const ini = (s) => {
  const w = String(s || '?').replace(/[^\p{L}\p{N} ]/gu, '').trim().split(/\s+/).filter((x) => x.length > 2 || /^\p{Lu}/u.test(x));
  return (w.slice(0, 2).map((x) => x[0]).join('') || String(s || '?').trim()[0] || '?').toUpperCase();
};

/* Iconos de interfaz: «c:cx,cy,r|p:d|r:x,y,w,h,rx» del icons.js, más unos propios */
const PROPIOS = {
  eye: 'p:M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z|c:12,12,3',
  chat: 'p:M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  flame: 'p:M12 22c4 0 7-2.8 7-7 0-3.5-2.5-6-4-8-.5 2-1.5 3-3 3 0-3-1-6-4-8 0 4-3 6-3 10 0 5.5 3 10 7 10z',
  doc: 'p:M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z|p:M14 2v6h6M8 13h8M8 17h5',
  hand: 'p:M7 11V5.5a1.5 1.5 0 0 1 3 0V10m0-4.5v-1a1.5 1.5 0 0 1 3 0V10m0-4a1.5 1.5 0 0 1 3 0v4m0-1.5a1.5 1.5 0 0 1 3 0V15a7 7 0 0 1-7 7h-1a7 7 0 0 1-6-3.4L3.5 14a1.6 1.6 0 0 1 2.7-1.7L7 13.5',
  inbox: 'p:M22 12h-6l-2 3h-4l-2-3H2|p:M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z',
  search: 'c:11,11,7|p:m21 21-4.3-4.3',
  filter: 'p:M22 3H2l8 9.46V19l4 2v-8.54z',
  more: 'c:5,12,1.2|c:12,12,1.2|c:19,12,1.2',
  alert: 'p:M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z|p:M12 9v4M12 17h.01',
  info: 'c:12,12,10|p:M12 16v-4M12 8h.01',
  trash: 'p:M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6',
  star: 'p:m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z',
  bolt: 'p:M13 2 3 14h9l-1 8 10-12h-9l1-8z',
  sun: 'c:12,12,4|p:M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'p:M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
  pause: 'r:6,4,4,16,1|r:14,4,4,16,1',
  play: 'p:m6 3 14 9-14 9z',
  map: 'p:M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z|p:M8 2v16M16 6v16',
  qr: 'r:3,3,7,7,1|r:14,3,7,7,1|r:3,14,7,7,1|p:M14 14h3v3h-3zM20 14v.01M14 20h.01M17 17h4v4h-4',
  building: 'r:4,2,16,20,2|p:M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01',
  network: 'c:12,5,3|c:5,19,3|c:19,19,3|p:M12 8v4M12 12l-5 5M12 12l5 5',
  brain: 'p:M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z|p:M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z|p:M12 5v13',
  wallet: 'p:M21 12V7H5a2 2 0 0 1 0-4h14v4|p:M3 5v14a2 2 0 0 0 2 2h16v-5|p:M18 12a2 2 0 0 0 0 4h4v-4z'
};
function ico(id, cls = '') {
  const def = (IC.ui && IC.ui[id]) || PROPIOS[id] || PROPIOS.info;
  const body = def.split('|').map((part) => {
    const t = part.slice(0, 1), v = part.slice(2);
    if (t === 'c') { const [cx, cy, r] = v.split(','); return `<circle cx="${cx}" cy="${cy}" r="${r}"/>`; }
    if (t === 'r') { const [x, y, w, h, rx] = v.split(','); return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx || 0}"/>`; }
    return `<path d="${v}"/>`;
  }).join('');
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

/* Canales y redes: clave corta → marca de Simple Icons + fondo */
const RED = {
  wa: ['whatsapp', 'WhatsApp', '#25D366'], whatsapp: ['whatsapp', 'WhatsApp', '#25D366'],
  ig: ['instagram', 'Instagram', ''], instagram: ['instagram', 'Instagram', ''],
  tt: ['tiktok', 'TikTok', '#0b0b0f'], tiktok: ['tiktok', 'TikTok', '#0b0b0f'],
  yt: ['youtube', 'YouTube', '#FF2D3D'], youtube: ['youtube', 'YouTube', '#FF2D3D'],
  li: ['linkedin', 'LinkedIn', '#0A66C2'], linkedin: ['linkedin', 'LinkedIn', '#0A66C2'],
  fb: ['facebook', 'Facebook', '#1877F2'], facebook: ['facebook', 'Facebook', '#1877F2'],
  google: ['google', 'Google', '#3A404D'], maps: ['googlemaps', 'Google Maps', '#3A404D'],
  mail: [null, 'Email', '#6A5CFF'], email: [null, 'Email', '#6A5CFF'],
  tel: [null, 'Teléfono', '#3FB5C9'], llamada: [null, 'Teléfono', '#3FB5C9'],
  web: [null, 'Web', '#3A404D'], directo: [null, 'Directo', '#3A404D'], menu: [null, 'Menú de la web', '#3A404D']
};
/** Normaliza nombres libres («Instagram», «utm tiktok», «Menú de la web»…) a una clave de RED */
function red(s) {
  const t = String(s || '').toLowerCase();
  if (!t) return 'web';
  if (RED[t]) return t;
  for (const k of ['whatsapp', 'instagram', 'tiktok', 'youtube', 'linkedin', 'facebook', 'google', 'email']) if (t.includes(k)) return k;
  if (t.includes('correo') || t.includes('mail')) return 'mail';
  if (t.includes('tel') || t.includes('llam')) return 'tel';
  if (t.includes('menú') || t.includes('menu')) return 'menu';
  return 'web';
}
function logo(k, cls = '') {
  const r = RED[k] || RED[red(k)] || RED.web;
  const b = r[0] && IC.brands && IC.brands[r[0]];
  const bg = (b && b.bg && !r[2]) ? b.bg : (r[2] || (b && b.bg) || '#3A404D');
  const dentro = b ? `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${b.d}"/></svg>`
    : `<span class="st" style="display:contents">${ico(k === 'mail' || k === 'email' ? 'mail' : (k === 'tel' || k === 'llamada') ? 'phone' : 'link')}</span>`;
  return `<span class="pbx-lg ${b ? '' : 'st'} ${cls}" style="--lgb:${bg}" title="${esc(r[1])}">${dentro}</span>`;
}
const cara = (nombre, canal = '', cls = '') => `<span class="pbx-av ${cls}" style="--c:${colorDe(nombre)}" title="${esc(nombre)}">${esc(ini(nombre))}${canal ? logo(canal) : ''}</span>`;
const caras = (nombres, mas = 0, cls = 'xs') => `<span class="pbx-avs">${nombres.map((n) => cara(n, '', cls)).join('')}${mas > 0 ? `<span class="pbx-mas">+${mas}</span>` : ''}</span>`;

/* Barra repartida: partes = [[valor, color, nombre], …] */
function split(partes, leyenda = true) {
  const tot = partes.reduce((a, p) => a + (p[0] || 0), 0) || 1;
  const barra = `<div class="pbx-split pbg-crece">${partes.filter((p) => p[0] > 0).map(([v, c, n]) => `<i style="width:calc(${(v / tot * 100).toFixed(2)}% - 3px);background:${c}" title="${esc(n)}: ${v}"></i>`).join('')}</div>`;
  if (!leyenda) return barra;
  return barra + `<div class="pbx-ley">${partes.map(([v, c, n]) => `<span><i class="pbx-dot" style="--c:${c}"></i>${esc(n)} <b>${v}</b><small>${Math.round(v / tot * 100)} %</small></span>`).join('')}</div>`;
}

/* Embudo dibujado. pasos: [{t, n, s, c, i, llega?, on?, caras?, mas?, clave?}]. % entre pasos; el peor, en rojo */
function etapas(pasos, opts = {}) {
  const max = Math.max(1, ...pasos.map((p) => p.llega ?? p.n));
  const conv = pasos.slice(1).map((p, i) => { const a = pasos[i].llega ?? pasos[i].n, b = p.llega ?? p.n; return a ? Math.round(b / a * 100) : null; });
  const val = conv.filter((x) => x !== null);
  const peor = val.length > 1 ? Math.min(...val) : null;
  const g = 18, n = pasos.length;
  return `<div class="pbx-etapas" style="--n:${n}">` + pasos.map((p, i) => `<button type="button" class="pbx-et pbg-n${p.on ? ' on' : ''}" style="--c:${p.c};--n:${i}"${p.clave ? ` data-etapa="${esc(p.clave)}"` : ''}>
      <header><span class="pbx-ico sm" style="--c:${p.c}">${ico(p.i || 'info')}</span>${esc(p.t)}</header>
      <span class="pbx-num">${esc(p.n)}</span>
      ${p.s ? `<small>${esc(p.s)}</small>` : ''}
      <span class="pbx-bar" style="--c:${p.c}"><i style="--w:${Math.max(3, (p.llega ?? p.n) / max * 100)}%"></i></span>
      ${p.caras && p.caras.length ? caras(p.caras, p.mas || 0) : ''}
    </button>`).join('') + (opts.flechas === false ? '' : conv.map((c, i) => c === null ? '' : `<span class="pbx-flecha${c === peor ? ' mal' : ''}" style="left:calc((100% - ${(n - 1) * g}px) * ${(i + 1) / n} + ${(i + .5) * g}px)">${c} %</span>`).join('')) + '</div>';
}

/* SVG pequeños (viewBox 120×120 salvo el medidor) */
function arco(cx, cy, r, a0, a1) {
  const p = (a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const [x0, y0] = p(a0), [x1, y1] = p(a1);
  return `M${x0.toFixed(2)},${y0.toFixed(2)} A${r},${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1.toFixed(2)},${y1.toFixed(2)}`;
}
/** Anillo segmentado: un segmento por elemento (colores), con texto en el centro */
function anillo(colores, t1 = '', t2 = '', grosor = 10) {
  const n = Math.max(1, colores.length), gap = n > 1 ? 0.07 : 0, full = Math.PI * 2;
  let h = '';
  if (n === 1) h += `<circle cx="60" cy="60" r="48" fill="none" stroke="${colores[0] || 'var(--line)'}" stroke-width="${grosor}"/>`;
  else colores.forEach((c, i) => {
    const a0 = -Math.PI / 2 + i / n * full + gap / 2, a1 = -Math.PI / 2 + (i + 1) / n * full - gap / 2;
    h += `<path d="${arco(60, 60, 48, a0, a1)}" fill="none" stroke="${c}" stroke-width="${grosor}" stroke-linecap="round"/>`;
  });
  h += `<text x="60" y="${t2 ? 62 : 67}" class="g1">${esc(t1)}</text>${t2 ? `<text x="60" y="78" class="g2">${esc(t2)}</text>` : ''}`;
  return `<svg class="pbx-g" viewBox="0 0 120 120" role="img">${h}</svg>`;
}
/** Donut: partes = [[valor, color], …] */
function donut(partes, t1 = '', t2 = '') {
  const tot = partes.reduce((a, p) => a + p[0], 0);
  let acc = 0, h = `<circle cx="60" cy="60" r="44" fill="none" stroke="var(--line)" stroke-width="16"/>`;
  if (tot) partes.forEach(([v, c]) => {
    if (!v) return;
    const len = v / tot * 100, l = partes.filter((p) => p[0]).length > 1 ? Math.max(len - 1.2, .5) : 100;
    h += `<circle cx="60" cy="60" r="44" fill="none" stroke="${c}" stroke-width="16" pathLength="100" stroke-dasharray="${l} ${100 - l}" stroke-dashoffset="${-acc + 25}"/>`;
    acc += len;
  });
  h += `<text x="60" y="64" class="g1">${esc(t1)}</text>${t2 ? `<text x="60" y="79" class="g2">${esc(t2)}</text>` : ''}`;
  return `<svg class="pbx-g" viewBox="0 0 120 120" role="img">${h}</svg>`;
}
/** Medidor semicircular (encaje, conversión…). Color por umbrales [alto, medio] en fracción */
function medidor(v, max, etiqueta = '', umbrales = [0.7, 0.45]) {
  const p = Math.max(0, Math.min(1, max ? v / max : 0)), c = p >= umbrales[0] ? 'var(--lime)' : p >= umbrales[1] ? 'var(--amber)' : 'var(--red)';
  return `<svg class="pbx-g" viewBox="0 0 120 72" role="img"><path d="${arco(60, 62, 46, Math.PI, 2 * Math.PI - .0001)}" fill="none" stroke="var(--line-2)" stroke-width="10" stroke-linecap="round"/>
    ${p > 0 ? `<path d="${arco(60, 62, 46, Math.PI, Math.PI + p * Math.PI - .0001)}" fill="none" stroke="${c}" stroke-width="10" stroke-linecap="round"/>` : ''}
    <text x="60" y="56" class="g1">${esc(String(v).replace('.', ','))}</text>${etiqueta ? `<text x="60" y="70" class="g2" style="fill:${c}">${esc(etiqueta)}</text>` : ''}</svg>`;
}
function curva(pts) {
  let d = `M${pts[0][0]},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0]},${p2[1].toFixed(1)}`;
  }
  return d;
}
let nId = 0;
/** Área con línea (serie de números) */
function area(datos, color = 'var(--lime)', w = 300, h = 84) {
  if (!datos || datos.length < 2) return `<svg class="pbx-g" viewBox="0 0 ${w} ${h}"></svg>`;
  const max = Math.max(1, ...datos) * 1.15, n = datos.length;
  const pts = datos.map((v, i) => [+(i / (n - 1) * w).toFixed(1), h - v / max * (h - 6)]);
  const d = curva(pts), id = 'pbxa' + (++nId);
  return `<svg class="pbx-g" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".35"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
    <path d="${d} L${w},${h} L0,${h}Z" fill="url(#${id})"/><path d="${d}" fill="none" stroke="${color}" stroke-width="2.2" vector-effect="non-scaling-stroke"/></svg>`;
}
/** Barras verticales: apagadas salvo la última (hoy) y la mejor. opts.ejes = [[i, texto]] */
function barras(datos, opts = {}) {
  const w = 300, h = opts.h || 150, n = Math.max(1, datos.length), bw = w / n * .62, max = Math.max(1, ...datos) * 1.1;
  const mejor = opts.mejor ?? (datos.length ? datos.indexOf(Math.max(...datos)) : -1);
  let s = '';
  [0.25, .5, .75].forEach((g) => { const y = h - 16 - g * (h - 26); s += `<line x1="0" x2="${w}" y1="${y}" y2="${y}" stroke="var(--line)"/>`; });
  datos.forEach((v, i) => {
    const bh = Math.max(v / max * (h - 26), v ? 3 : 2), x = i * (w / n) + (w / n - bw) / 2, y = h - 16 - bh;
    const vivo = opts.hoy !== false && i === n - 1, top = i === mejor && v > 0;
    const fill = vivo ? 'var(--lime)' : top ? 'color-mix(in srgb,var(--lime) 55%,transparent)' : 'var(--line-2)';
    s += `<rect style="--n:${i}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="2.5" fill="${fill}"><title>${esc((opts.titulos && opts.titulos[i]) || '')} ${v}</title></rect>`;
    if (top && !vivo) s += `<text x="${x + bw / 2}" y="${y - 5}" style="font:800 9px var(--sans)">${v}</text>`;
    if (vivo) s += `<text x="${x + bw / 2}" y="${y - 5}" style="font:800 9px var(--sans);fill:var(--lime)">${opts.hoyTxt || 'hoy'}</text>`;
  });
  (opts.ejes || []).forEach(([i, t]) => { s += `<text x="${i * (w / n) + w / n / 2}" y="${h - 2}" style="font:700 9px var(--sans);fill:var(--muted-2)">${esc(t)}</text>`; });
  return `<svg class="pbx-g pbg-crece" viewBox="0 0 ${w} ${h}" role="img">${s}</svg>`;
}

window.PBX = { esc, ico, logo, cara, caras, colorDe, ini, red, split, etapas, anillo, donut, medidor, area, barras };
})();
