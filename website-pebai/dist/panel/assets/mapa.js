/* PEBAI · Panel — Captación › Mapa: cada prospecto analizado en su sitio y con su estado.
   MapLibre (gratis, sin clave) con el mapa de OpenFreeMap, retocado con los colores del panel. Se carga solo al abrir la sección.
   Datos en index.php?mapa=1 (ver _mapa_panel.php). Los textos de los prospectos se pintan con textContent o escapados. */
(() => {
'use strict';
const app = document.getElementById('pb-app');
const raiz = document.getElementById('pb-mapa');
if (!app || !raiz) return;
const BASE = app.dataset.base;
const $ = (s, r) => (r || document).querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const N = (n) => new Intl.NumberFormat('es-ES', { useGrouping: 'always' }).format(n || 0);
const toast = (m, err) => { const t = $('#pb-toast'); if (!t) return; $('span', t).textContent = m; t.classList.toggle('err', !!err); t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 3200); };
/* estados en el orden en que avanza una empresa; el color va siempre con su nombre (leyenda y ficha) */
const EST = [
  ['cola', 'En cola', '#9A9CB0', 'Aún no se les ha escrito'],
  ['revision', 'Por revisar', '#FFB547', 'Esperan vuestro visto bueno'],
  ['enviado', 'Sin respuesta', '#8E84FF', 'Se les escribió y no han contestado'],
  ['respondio', 'Respondieron', '#3DDC84', 'Han contestado'],
  ['no', 'Dijeron que no', '#FF5E6C', 'Pidieron la baja: no se les vuelve a escribir'],
  ['error', 'Incidencia', '#FF8A3D', 'Sin WhatsApp, rebote o error al enviar'],
  ['descartado', 'Descartadas', '#6F7189', 'Las quitasteis de la lista'],
];
const COL = Object.fromEntries(EST.map(([k, , c]) => [k, c]));
const NOM = Object.fromEntries(EST.map(([k, l]) => [k, l]));
const TIPO = { core_solar: 'Placas solares', ambas: 'Solar y aerotermia', clima_gas: 'Clima y gas', generalista: 'Generalista', aerotermia: 'Aerotermia' };
const S = { puntos: [], cargado: false, filtros: { estados: new Set(EST.map((e) => e[0])), lista: '', nicho: '', q: '' }, sel: null, modo: 'puntos' };
const ESPANA = [[-9.8, 35.7], [4.6, 43.95]], CANARIAS = [[-18.4, 27.5], [-13.2, 29.5]];

/* ============ carga perezosa de MapLibre ============ */
let libP = null;
function libreria() {
  if (window.maplibregl) return Promise.resolve();
  if (libP) return libP;
  libP = new Promise((ok, mal) => {
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'https://cdnjs.cloudflare.com/ajax/libs/maplibre-gl/4.7.1/maplibre-gl.css'; document.head.append(css);
    const js = document.createElement('script'); js.src = 'https://cdnjs.cloudflare.com/ajax/libs/maplibre-gl/4.7.1/maplibre-gl.js'; js.onload = ok; js.onerror = () => mal(new Error('No se ha podido cargar el mapa.')); document.head.append(js);
  });
  return libP;
}
async function cargar() {
  const r = await fetch(BASE + '?mapa=1', { credentials: 'same-origin', cache: 'no-store' });
  if (r.status === 401) { location.reload(); return; }
  let j; try { j = await r.json(); } catch (e) { throw new Error('El mapa no ha respondido bien.'); }
  if (!j.ok) throw new Error(j.error || 'No se ha podido cargar el mapa.');
  S.puntos = j.puntos; S.sinUbicar = j.sin_ubicar; S.buscaMas = j.busca_mas; S.cargado = true;
}

/* ============ interfaz ============ */
raiz.innerHTML = `
  <div class="pb-mapa-map" id="pb-mapa-map"><div class="pb-mapa-load"><img src="${BASE}assets/pebai-mark.png" alt=""><span>Situando las empresas…</span></div></div>
  <aside class="pb-mapa-panel" id="pb-mapa-panel">
    <div class="hd"><div class="k">Captación · Mapa</div><h1>Prospectos <i>en el mapa</i></h1><p id="pb-mapa-resumen">Cargando…</p></div>
    <div class="buscar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="pb-mapa-q" type="search" placeholder="Buscar empresa o ciudad" autocomplete="off" aria-label="Buscar en el mapa"></div>
    <div class="seg" id="pb-mapa-lista" role="radiogroup" aria-label="Lista"><button data-l="" class="on">Todas</button><button data-l="w">WhatsApp</button><button data-l="e">Email</button></div>
    <select id="pb-mapa-nicho" aria-label="Nicho"><option value="">Todos los nichos</option></select>
    <div class="est" id="pb-mapa-est"></div>
    <div class="ciu"><div class="t">Ciudades con más empresas</div><div id="pb-mapa-ciu"></div></div>
  </aside>
  <div class="pb-mapa-ficha" id="pb-mapa-ficha" aria-live="polite"></div>
  <div class="pb-mapa-vista">
    <div class="seg" id="pb-mapa-modo"><button data-m="puntos" class="on">Puntos</button><button data-m="densidad">Densidad</button></div>
    <div class="seg"><button data-z="es">Península</button><button data-z="ca">Canarias</button></div>
  </div>`;
const mapEl = $('#pb-mapa-map'), ficha = $('#pb-mapa-ficha');
let map = null, marcas = new Map();

function filtrados() {
  const f = S.filtros, q = f.q.toLowerCase();
  return S.puntos.filter((p) => f.estados.has(p.e) && (!f.lista || p.l === f.lista) && (!f.nicho || p.h === f.nicho) && (!q || (p.n + ' ' + p.c + ' ' + p.v).toLowerCase().includes(q)));
}
function geo(lista) {
  return { type: 'FeatureCollection', features: lista.map((p, k) => ({ type: 'Feature', id: k + 1, geometry: { type: 'Point', coordinates: [p.x, p.y] }, properties: { k: p.l + p.i, e: p.e } })) };
}
function pintarPanel() {
  const base = S.puntos.filter((p) => (!S.filtros.lista || p.l === S.filtros.lista) && (!S.filtros.nicho || p.h === S.filtros.nicho));
  const vis = filtrados();
  const ciudades = new Set(vis.map((p) => p.c + '|' + p.v));
  $('#pb-mapa-resumen').textContent = `${N(vis.length)} ${vis.length === 1 ? 'empresa' : 'empresas'} en ${N(ciudades.size)} ${ciudades.size === 1 ? 'ciudad' : 'ciudades'}` + (S.sinUbicar ? ` · ${N(S.sinUbicar)} sin ubicar` : '');
  const sel = $('#pb-mapa-nicho'), nichos = [...new Set(S.puntos.map((p) => p.h))].sort();
  if (sel.options.length - 1 !== nichos.length) { sel.length = 1; nichos.forEach((n) => sel.add(new Option(n, n))); sel.value = S.filtros.nicho; }
  const est = $('#pb-mapa-est'); est.replaceChildren();
  EST.forEach(([k, l, c, d]) => {
    const n = base.filter((p) => p.e === k).length;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'e' + (S.filtros.estados.has(k) ? ' on' : '') + (n ? '' : ' cero'); b.title = d;
    b.innerHTML = `<i style="--c:${c}"></i><span>${l}</span><b>${N(n)}</b>`;
    b.onclick = () => { const s = S.filtros.estados; if (s.has(k) && s.size === EST.length) { s.clear(); s.add(k); } else if (s.has(k)) { s.delete(k); if (!s.size) EST.forEach((e) => s.add(e[0])); } else s.add(k); actualizar(); };
    b.ondblclick = () => { EST.forEach((e) => S.filtros.estados.add(e[0])); actualizar(); };
    est.append(b);
  });
  const cnt = new Map(); vis.forEach((p) => { const key = p.c + '|' + p.v; const o = cnt.get(key) || { c: p.c, v: p.v, n: 0, y: 0, x: 0, r: 0 }; o.n++; o.y += p.y; o.x += p.x; if (p.e === 'respondio') o.r++; cnt.set(key, o); });
  const ciu = $('#pb-mapa-ciu'); ciu.replaceChildren();
  [...cnt.values()].sort((a, b) => b.n - a.n).slice(0, 7).forEach((o) => {
    const b = document.createElement('button'); b.type = 'button';
    b.innerHTML = `<span>${esc(o.c)}<small>${esc(o.v)}</small></span><b>${N(o.n)}</b>`;
    b.onclick = () => map && map.flyTo({ center: [o.x / o.n, o.y / o.n], zoom: 11.2, speed: 1.4 });
    ciu.append(b);
  });
  if (!cnt.size) ciu.innerHTML = '<p class="vacio">Nada con estos filtros.</p>';
}
function actualizar() {
  pintarPanel();
  if (!map || !map.getSource('pros')) return;
  const l = filtrados(); S.vis = l;
  map.getSource('pros').setData(geo(l)); map.getSource('dens').setData(geo(l));
  if (S.sel && !l.includes(S.sel)) cerrarFicha();
}

/* ============ ficha de una empresa ============ */
function abrirFicha(p) {
  S.sel = p;
  const c = COL[p.e], aprox = p.p === 2 ? `Ubicación aproximada: centro de ${esc(p.v)}` : p.p === 1 ? `Ubicación aproximada: ${esc(p.c)}` : 'Ubicación exacta';
  const web = p.w ? p.w.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') : '';
  const tel = (t) => '+34 ' + t.slice(0, 3) + ' ' + t.slice(3, 5) + ' ' + t.slice(5, 7) + ' ' + t.slice(7);
  const movil = p.m ? String(p.m).replace(/^34/, '') : '';
  ficha.innerHTML = `<button class="x" type="button" aria-label="Cerrar">×</button>
    <div class="estado" style="--c:${c}"><i></i>${esc(NOM[p.e])}<span>· lista de ${p.l === 'w' ? 'WhatsApp' : 'Email'}</span></div>
    <h2>${esc(p.n || 'Sin nombre')}</h2>
    <div class="donde">${esc(p.c)}${p.v && p.v !== p.c ? ' · ' + esc(p.v) : ''}</div>
    <dl>${p.h ? `<dt>Nicho</dt><dd>${esc(p.h)}</dd>` : ''}${TIPO[p.t] ? `<dt>Qué hace</dt><dd>${TIPO[p.t]}</dd>` : ''}
      ${movil ? `<dt>Móvil</dt><dd>${esc(tel(movil))}</dd>` : ''}${p.f ? `<dt>Fijo</dt><dd><a href="tel:+34${esc(p.f)}">${esc(tel(p.f))}</a></dd>` : ''}
      ${p.em ? `<dt>Email</dt><dd>${esc(p.em)}</dd>` : ''}${p.d ? `<dt>${p.e === 'respondio' ? 'Respondió' : p.e === 'enviado' ? 'Escrita' : 'Añadida'}</dt><dd>${esc(p.d.slice(8, 10) + '/' + p.d.slice(5, 7) + '/' + p.d.slice(0, 4))}</dd>` : ''}</dl>
    <div class="acts">${web ? `<a class="pb-btn ghost" href="${esc(p.w)}" target="_blank" rel="noopener">Ver web</a>` : ''}<button class="pb-btn primary" type="button" data-a="ver">Ver en ${p.l === 'w' ? 'Prospectos' : 'Email'}</button></div>
    <p class="aprox">${aprox}</p>`;
  ficha.classList.add('on');
  ficha.querySelector('.x').onclick = cerrarFicha;
  ficha.querySelector('[data-a=ver]').onclick = () => irALista(p);
  if (map) map.setFilter('sel', ['==', ['get', 'k'], p.l + p.i]);
}
function cerrarFicha() { S.sel = null; ficha.classList.remove('on'); if (map && map.getLayer('sel')) map.setFilter('sel', ['==', ['get', 'k'], '']); }
function irALista(p) {
  const b = $(`#pb-tabs button[data-page="${p.l === 'w' ? 'prospectos' : 'email'}"]`); if (!b) return;
  b.click();
  setTimeout(() => { const i = p.l === 'w' ? $('#pb-pros-q') : $('#page-email input[type=search]'); if (i) { i.value = p.n; i.dispatchEvent(new Event('input', { bubbles: true })); } }, 120);
}

/* ============ mapa ============ */
const oscuro = () => document.documentElement.dataset.theme !== 'light';
function retocar() {
  const dark = oscuro();
  const P = dark ? { fondo: '#080912', agua: '#0c1226', tierra: '#0d0f1c', via: 'rgba(160,165,210,.06)', viaG: 'rgba(160,165,210,.11)', limite: 'rgba(142,132,255,.38)', texto: '#8C8FA3', halo: '#080912' }
    : { fondo: '#ECEAE4', agua: '#D5DCE8', tierra: '#E6E3DC', via: 'rgba(18,18,26,.10)', viaG: 'rgba(18,18,26,.18)', limite: 'rgba(73,58,196,.35)', texto: '#575661', halo: '#ECEAE4' };
  (map.getStyle().layers || []).forEach((l) => {
    const id = l.id, set = (k, v) => { try { map.setPaintProperty(id, k, v); } catch (e) { /* esta capa no tiene esa propiedad */ } };
    const oculta = () => { try { map.setLayoutProperty(id, 'visibility', 'none'); } catch (e) { /* nada */ } };
    if (l.type === 'background') set('background-color', P.fondo);
    else if (l.type === 'fill' && /water|ocean|sea|lake|river/.test(id)) { set('fill-color', P.agua); set('fill-outline-color', P.agua); }
    else if (l.type === 'fill' && /building/.test(id)) set('fill-opacity', dark ? .25 : .4);
    else if (l.type === 'fill') { set('fill-color', P.tierra); set('fill-opacity', .55); }
    else if (l.type === 'fill-extrusion') oculta();
    else if (l.type === 'line' && /boundary|admin/.test(id)) { set('line-color', P.limite); }
    else if (l.type === 'line' && /water|river|stream|canal/.test(id)) set('line-color', P.agua);
    else if (l.type === 'line') { set('line-color', /motorway|trunk|primary|major/.test(id) ? P.viaG : P.via); set('line-opacity', ['interpolate', ['linear'], ['zoom'], 5, .45, 9, .8, 13, 1]); }
    else if (l.type === 'symbol') {
      if (/poi|transit|airport|aeroway|rail|ferry|housenum|road_shield|shield|oneway|mountain|peak|highway_name|road_label|water_name_line/.test(id)) { oculta(); return; }
      set('text-color', P.texto); set('text-halo-color', P.halo); set('text-halo-width', 1.2); set('icon-opacity', 0);
    }
  });
}
async function montarMapa() {
  await libreria();
  const lib = window.maplibregl;
  mapEl.querySelector('.pb-mapa-load')?.remove();
  map = new lib.Map({
    container: mapEl, style: 'https://tiles.openfreemap.org/styles/' + (oscuro() ? 'dark' : 'positron'), bounds: ESPANA, fitBoundsOptions: { padding: { top: 40, bottom: 40, left: innerWidth > 900 ? 360 : 20, right: 40 } },
    attributionControl: false, maxPitch: 0, dragRotate: false, pitchWithRotate: false, renderWorldCopies: false, minZoom: 3.5,
  });
  map.touchZoomRotate.disableRotation();
  map.addControl(new lib.NavigationControl({ showCompass: false }), 'top-right');
  map.addControl(new lib.AttributionControl({ compact: true, customAttribution: 'Ubicaciones: GeoNames · OpenStreetMap' }), 'bottom-right');
  map.on('load', () => {
    retocar();
    S.vis = filtrados();
    map.addSource('pros', {
      type: 'geojson', data: geo(S.vis), cluster: true, clusterRadius: 52, clusterMaxZoom: 12, promoteId: 'k',
      clusterProperties: Object.fromEntries(EST.map(([k]) => [k, ['+', ['case', ['==', ['get', 'e'], k], 1, 0]]])),
    });
    map.addSource('dens', { type: 'geojson', data: geo(S.vis) });
    map.addLayer({ id: 'densidad', type: 'heatmap', source: 'dens', layout: { visibility: 'none' }, paint: {
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 4, 14, 9, 30, 13, 46], 'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 4, .6, 12, 1.6], 'heatmap-opacity': .85,
      'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(0,0,0,0)', .15, 'rgba(106,92,255,.35)', .4, 'rgba(142,132,255,.7)', .7, '#B7FF3C', 1, '#F4FFD6'] } });
    map.addLayer({ id: 'halo', type: 'circle', source: 'pros', filter: ['!', ['has', 'point_count']], paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 7, 12, 14], 'circle-color': ['match', ['get', 'e'], ...EST.flatMap(([k, , c]) => [k, c]), '#9A9CB0'], 'circle-opacity': .16, 'circle-blur': .6 } });
    map.addLayer({ id: 'puntos', type: 'circle', source: 'pros', filter: ['!', ['has', 'point_count']], paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 3.6, 10, 5.5, 14, 8], 'circle-color': ['match', ['get', 'e'], ...EST.flatMap(([k, , c]) => [k, c]), '#9A9CB0'],
      'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 5, 1, 12, 2], 'circle-stroke-color': oscuro() ? '#080912' : '#ffffff' } });
    map.addLayer({ id: 'sel', type: 'circle', source: 'pros', filter: ['==', ['get', 'k'], ''], paint: { 'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 9, 14, 15], 'circle-color': 'rgba(0,0,0,0)', 'circle-stroke-width': 2.5, 'circle-stroke-color': oscuro() ? '#ffffff' : '#12121A' } });
    const pop = new lib.Popup({ closeButton: false, closeOnClick: false, offset: 12, className: 'pb-mapa-pop' });
    map.on('mouseenter', 'puntos', (e) => {
      map.getCanvas().style.cursor = 'pointer';
      const p = puntoDe(e.features[0]); if (!p) return;
      pop.setLngLat(e.features[0].geometry.coordinates).setHTML(`<b>${esc(p.n)}</b><span><i style="background:${COL[p.e]}"></i>${esc(NOM[p.e])} · ${esc(p.c)}</span>`).addTo(map);
    });
    map.on('mouseleave', 'puntos', () => { map.getCanvas().style.cursor = ''; pop.remove(); });
    map.on('click', 'puntos', (e) => { const p = puntoDe(e.features[0]); if (p) { abrirFicha(p); pop.remove(); } });
    map.on('click', (e) => { if (!map.queryRenderedFeatures(e.point, { layers: ['puntos'] }).length && !e.originalEvent.target.closest('.pb-mapa-cl')) cerrarFicha(); });
    map.on('render', () => { if (map.isSourceLoaded('pros')) donuts(); });
  });
}
function puntoDe(f) { const k = f.properties.k; return (S.vis || []).find((p) => p.l + p.i === k); }

/* clústeres en forma de dónut: el aro enseña cómo se reparten los estados en esa zona */
function donutSvg(props) {
  const total = props.point_count, r = total >= 500 ? 34 : total >= 100 ? 28 : total >= 20 ? 23 : 19, g = 5.5, rr = r - g / 2, C = 2 * Math.PI * rr;
  let off = 0, arcos = '';
  EST.forEach(([k, , c]) => {
    const n = props[k] || 0; if (!n) return;
    const len = n / total * C, hueco = EST.filter(([kk]) => props[kk]).length > 1 ? Math.min(1.6, len * .25) : 0;
    arcos += `<circle r="${rr}" cx="${r}" cy="${r}" fill="none" stroke="${c}" stroke-width="${g}" stroke-dasharray="${Math.max(0, len - hueco)} ${C}" stroke-dashoffset="${-off}" transform="rotate(-90 ${r} ${r})"/>`;
    off += len;
  });
  const t = total >= 1000 ? (total / 1000).toFixed(1).replace('.', ',') + ' mil' : N(total);
  return { r, html: `<svg width="${r * 2}" height="${r * 2}" viewBox="0 0 ${r * 2} ${r * 2}"><circle r="${r - g}" cx="${r}" cy="${r}" class="f"/>${arcos}<text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-size="${r > 26 ? 13 : 11.5}">${t}</text></svg>` };
}
function donuts() {
  if (S.modo !== 'puntos') { marcas.forEach((m) => m.remove()); marcas.clear(); return; }
  const vistos = new Set();
  map.querySourceFeatures('pros').forEach((f) => {
    const pr = f.properties; if (!pr.cluster) return;
    const id = pr.cluster_id + ':' + pr.point_count; if (vistos.has(id)) return; vistos.add(id);
    if (!marcas.has(id)) {
      const { html } = donutSvg(pr);
      const el = document.createElement('button'); el.type = 'button'; el.className = 'pb-mapa-cl'; el.innerHTML = html;
      el.title = EST.filter(([k]) => pr[k]).map(([k, l]) => `${l}: ${N(pr[k])}`).join('\n');
      el.onclick = (e) => { e.stopPropagation(); map.getSource('pros').getClusterExpansionZoom(pr.cluster_id).then((z) => map.easeTo({ center: f.geometry.coordinates, zoom: Math.min(z + .3, 15), duration: 650 })); };
      marcas.set(id, new window.maplibregl.Marker({ element: el }).setLngLat(f.geometry.coordinates));
    }
    const m = marcas.get(id); if (!m._addedTo) { m.addTo(map); m._addedTo = true; }
  });
  marcas.forEach((m, id) => { if (!vistos.has(id)) { m.remove(); marcas.delete(id); } });
}

/* ============ controles ============ */
let qt; $('#pb-mapa-q').addEventListener('input', (e) => { clearTimeout(qt); qt = setTimeout(() => {
  S.filtros.q = e.target.value.trim(); actualizar();
  const l = S.vis || filtrados();
  if (map && S.filtros.q && l.length && l.length < 60) { const b = new window.maplibregl.LngLatBounds(); l.forEach((p) => b.extend([p.x, p.y])); map.fitBounds(b, { padding: 90, maxZoom: 12.5, duration: 700 }); }
}, 220); });
$('#pb-mapa-lista').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; S.filtros.lista = b.dataset.l; e.currentTarget.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); actualizar(); });
$('#pb-mapa-nicho').addEventListener('change', (e) => { S.filtros.nicho = e.target.value; actualizar(); });
$('#pb-mapa-modo').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b || !map) return; S.modo = b.dataset.m;
  e.currentTarget.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
  const d = S.modo === 'densidad';
  map.setLayoutProperty('densidad', 'visibility', d ? 'visible' : 'none');
  ['puntos', 'halo', 'sel'].forEach((l) => map.setLayoutProperty(l, 'visibility', d ? 'none' : 'visible'));
  donuts();
});
raiz.querySelector('.pb-mapa-vista').addEventListener('click', (e) => { const b = e.target.closest('[data-z]'); if (!b || !map) return; map.fitBounds(b.dataset.z === 'ca' ? CANARIAS : ESPANA, { padding: { top: 40, bottom: 40, left: innerWidth > 900 ? 360 : 20, right: 40 }, duration: 900 }); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.body.dataset.page === 'mapa' && ficha.classList.contains('on')) cerrarFicha(); });

/* ============ ciclo ============ */
async function entrar() {
  if (document.body.dataset.page !== 'mapa') return;
  try {
    if (!S.cargado) await cargar();
    pintarPanel();
    if (!map) await montarMapa(); else { map.resize(); }
    if (S.buscaMas) setTimeout(async () => { try { await cargar(); actualizar(); } catch (e) { /* ya lo intentará otra vez */ } }, 1500);
  } catch (e) { toast(e.message || 'No se ha podido cargar el mapa.', true); }
}
document.addEventListener('pb:page', entrar);
setInterval(() => { if (!document.hidden && document.body.dataset.page === 'mapa') cargar().then(actualizar).catch(() => {}); }, 120000);
entrar();
})();
