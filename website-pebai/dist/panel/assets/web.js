/* PEBAI · Panel — Contenido › Web: todo lo publicado en pebaisystems.es como un esquema.
   Arriba la web principal; de ella salen las ramas (embudo, servicios, QR y tarjetas, enlaces cortos, legal) y,
   aparte, las URLs antiguas que se redirigen. Datos en index.php?web=1 (ver _web_panel.php), leídos del servidor al momento.
   Todo texto que viene de los datos pasa por esc(). */
(() => {
'use strict';
const app = document.getElementById('pb-app');
const raiz = document.getElementById('pb-web');
if (!app || !raiz) return;
const BASE = app.dataset.base;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const N = (n) => new Intl.NumberFormat('es-ES').format(n || 0);
const ico = (p) => `<svg class="pb-i" viewBox="0 0 24 24">${p}</svg>`;
const I = {
  web: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  embudo: '<path d="M3 4h18l-7 9v6l-4 2v-8z"/>',
  servicios: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  qr: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 14h3v3h-3zM20 20h.01M17 20h.01M20 17h.01"/>',
  cortos: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  legal: '<path d="M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6z"/>',
  antiguas: '<path d="M4 12h12M12 6l6 6-6 6"/><path d="M4 5v14" opacity=".5"/>',
  abrir: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  copiar: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
};
// Las ramas del esquema. Una página nueva que no encaje en ninguna cae en «Servicios y contenido».
const EMBUDO = ['/consultoria-gratuita/', '/diagnostico/', '/formulario-completado/', '/reservar/', '/confirmacion-de-llamada/'];
const PASOS = ['Vídeo de la consultoría', 'Formulario', 'Gracias + WhatsApp en 24 h', 'Elegir día (Cal.com)', 'Llamada confirmada'];
const LEGAL = ['/aviso-legal/', '/privacidad/', '/politica-de-cookies/', '/baja/'];
const RAMAS = [
  { id: 'embudo', n: 'Embudo', d: 'De la consultoría gratuita a la llamada', c: '#B7FF3C' },
  { id: 'servicios', n: 'Servicios y contenido', d: 'Lo que leen Google y las IAs', c: '#3FD5FF' },
  { id: 'qr', n: 'QR, tarjetas y reseñas', d: 'Para la calle y los clientes', c: '#FFB547' },
  { id: 'cortos', n: 'Enlaces cortos', d: 'Bio de redes y mensajes', c: '#9C93FF' },
  { id: 'legal', n: 'Legal y bajas', d: 'Obligatorias, ocultas a Google', c: '#8C8FA3' },
];
const S = { cargado: false, datos: null, filtro: '' };

const url = (r) => (r.startsWith('http') ? r : S.datos.dominio + r);
const corta = (u) => { const [p, q] = String(u).split('?'); const src = q && new URLSearchParams(q).get('utm_source'); return { p, src }; };
const estado = (p) => p.oculta ? ['gris', 'Oculta a Google'] : p.sitemap ? ['verde', 'En Google'] : ['ambar', 'Fuera del sitemap'];

function acciones(r) {
  return `<span class="wb-acc"><a href="${esc(url(r))}" target="_blank" rel="noopener" title="Abrir en otra pestaña">${ico(I.abrir)}</a><button type="button" data-copiar="${esc(url(r))}" title="Copiar el enlace">${ico(I.copiar)}</button></span>`;
}
function tarjetaPagina(p, extra) {
  const [cls, txt] = estado(p);
  return `<div class="wb-pag${extra && extra.hija ? ' hija' : ''}" data-q="${esc((p.ruta + ' ' + p.titulo).toLowerCase())}">
    ${extra && extra.paso ? `<span class="wb-paso">${extra.paso}</span>` : ''}
    <div class="wb-pag-t"><b>${esc(extra && extra.nombre || p.titulo.replace(/\s*[|·]\s*PEBAI Systems\s*$/u, '') || p.ruta)}</b>${acciones(p.ruta)}</div>
    <code>${esc(p.ruta)}</code>
    <div class="wb-pag-m"><span class="wb-est ${cls}" title="${esc(p.oculta ? 'Tiene noindex: Google no la muestra (a propósito)' : p.sitemap ? 'Está en el sitemap y Google puede mostrarla' : 'Google puede mostrarla, pero no está en sitemap.xml')}"><i></i>${txt}</span>
      <span title="Visitas en los últimos 30 días">${N(p.visitas)} visitas</span><span title="Última vez que se subió">${esc(p.modificado.slice(8, 10) + '/' + p.modificado.slice(5, 7))}</span></div>
  </div>`;
}
function tarjetaCorto(c) {
  const { p, src } = corta(c.a);
  const destino = c.a.startsWith('https://wa.me') ? 'WhatsApp' : p;
  return `<div class="wb-corto" data-q="${esc((c.de + ' ' + c.a).toLowerCase())}">
    <code>${esc(c.de)}</code><span class="wb-a" title="${esc(c.a)}">→ ${esc(destino)}</span>${src ? `<em>${esc(src)}</em>` : ''}${acciones(c.de)}
  </div>`;
}
function tarjetaQr(q) {
  return `<div class="wb-pag corto" data-q="${esc((q.slug + ' ' + q.titulo).toLowerCase())}">
    <div class="wb-pag-t"><b><i class="wb-qrdot" style="background:${esc(q.color)}"></i>${esc(q.titulo)}</b>${acciones('/q/' + q.slug)}</div>
    <div class="wb-flecha"><code>/q/${esc(q.slug)}</code> → <span>${esc(q.destino.startsWith('https://wa.me') ? 'WhatsApp' : q.destino)}</span></div>
    <div class="wb-pag-m"><span>${N(q.escaneos)} escaneos</span></div>
  </div>`;
}

function pintar() {
  const D = S.datos, por = Object.fromEntries(D.paginas.map((p) => [p.ruta, p]));
  const home = por['/'];
  const usadas = new Set(['/', ...EMBUDO, ...LEGAL]);
  const enRama = { embudo: [], servicios: [], qr: [], cortos: [], legal: [] };
  EMBUDO.forEach((r, i) => { if (por[r]) enRama.embudo.push(tarjetaPagina(por[r], { paso: i + 1, nombre: PASOS[i] })); });
  D.paginas.filter((p) => p.ruta.startsWith('/t/') || p.ruta === '/resena/').forEach((p) => { usadas.add(p.ruta); enRama.qr.push(tarjetaPagina(p)); });
  D.qrs.forEach((q) => enRama.qr.push(tarjetaQr(q)));
  // servicios: cada página con sus hijas debajo (/agentes-ia/ → /agentes-ia/whatsapp/)
  const resto = D.paginas.filter((p) => !usadas.has(p.ruta));
  resto.filter((p) => !resto.some((o) => o !== p && p.ruta.startsWith(o.ruta))).forEach((p) => {
    enRama.servicios.push(tarjetaPagina(p));
    resto.filter((h) => h !== p && h.ruta.startsWith(p.ruta)).forEach((h) => enRama.servicios.push(tarjetaPagina(h, { hija: true })));
  });
  const cortos = D.cortos.filter((c) => !c.antiguas && !c.permanente);
  cortos.forEach((c) => enRama.cortos.push(tarjetaCorto(c)));
  LEGAL.forEach((r) => { if (por[r]) enRama.legal.push(tarjetaPagina(por[r])); });
  // URLs viejas (301): las de la lista «(a|b|c)» y las sueltas como /nueva o /sesion-estrategica
  const antiguas = D.cortos.filter((c) => c.antiguas || c.permanente).map((c) => (c.antiguas ? c : { ...c, antiguas: [c.de + '/'] }));
  const nAnt = antiguas.reduce((t, c) => t + c.antiguas.length, 0);
  const total = { paginas: D.paginas.length, cortos: cortos.length, qrs: D.qrs.length };

  raiz.innerHTML = `
    <div class="wb-cab">
      <div class="wb-cifras">
        <span><b>${total.paginas}</b> páginas</span><span><b>${total.cortos}</b> enlaces cortos</span><span><b>${total.qrs}</b> QR</span><span><b>${nAnt}</b> URLs antiguas</span>
      </div>
      <label class="wb-busca">${ico('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>')}<input type="search" placeholder="Buscar una URL o una página" value="${esc(S.filtro)}"></label>
    </div>
    <div class="wb-arbol">
      <svg class="wb-lineas" aria-hidden="true"></svg>
      <div class="wb-raiz">
        ${home ? `<div class="wb-home" data-q="${esc(('/ ' + home.titulo).toLowerCase())}">
          <span class="wb-home-i">${ico(I.web)}</span>
          <div><small>Web principal</small><b>pebaisystems.es</b><span>${esc(home.titulo)}</span>
          <div class="wb-pag-m"><span class="wb-est ${estado(home)[0]}"><i></i>${estado(home)[1]}</span><span>${N(home.visitas)} visitas en 30 días</span></div></div>
          ${acciones('/')}
        </div>` : ''}
      </div>
      <div class="wb-ramas">
        ${RAMAS.map((r) => `<section class="wb-rama${r.id === 'embudo' ? ' flujo' : ''}" style="--c:${r.c}" data-rama="${r.id}">
          <header><span class="wb-rama-i">${ico(I[r.id])}</span><div><b>${r.n}</b><small>${r.d}</small></div><em>${enRama[r.id].length}</em></header>
          <div class="wb-hojas">${enRama[r.id].join('') || '<p class="wb-vacio">Nada todavía</p>'}</div>
        </section>`).join('')}
      </div>
    </div>
    ${antiguas.length ? `<details class="wb-antiguas"><summary>${ico(I.antiguas)}<b>URLs antiguas redirigidas</b><span>${nAnt} direcciones viejas que llevan a la página buena (para no perder visitas de Google)</span></summary>
      <div class="wb-ant-g">${antiguas.map((c) => `<div><p>→ <code>${esc(c.a)}</code> <em>${c.antiguas.length}</em></p><ul>${c.antiguas.map((a) => `<li data-q="${esc(a)}"><code>${esc(a)}</code></li>`).join('')}</ul></div>`).join('')}</div>
    </details>` : ''}`;
  raiz.querySelector('.wb-busca input').addEventListener('input', (e) => { S.filtro = e.target.value; filtrar(); });
  filtrar();
  requestAnimationFrame(lineas); setTimeout(lineas, 650);   // otra vez cuando las ramas terminan de entrar
}

function filtrar() {
  const q = S.filtro.trim().toLowerCase();
  raiz.classList.toggle('filtrando', !!q);
  raiz.querySelectorAll('[data-q]').forEach((el) => el.classList.toggle('wb-ok', !!q && el.dataset.q.includes(q)));
  if (q) raiz.querySelectorAll('.wb-antiguas').forEach((d) => { if (d.querySelector('.wb-ok')) d.open = true; });
}

// Líneas del esquema: de la web principal a la cabecera de cada rama (se recalculan al cambiar el tamaño)
function lineas() {
  const svg = raiz.querySelector('.wb-lineas'), arbol = raiz.querySelector('.wb-arbol'), home = raiz.querySelector('.wb-home');
  if (!svg || !home) return;
  const R = arbol.getBoundingClientRect(), h = home.getBoundingClientRect();
  svg.setAttribute('width', R.width); svg.setAttribute('height', R.height); svg.setAttribute('viewBox', `0 0 ${R.width} ${R.height}`);
  const x0 = h.left + h.width / 2 - R.left, y0 = h.bottom - R.top;
  svg.innerHTML = [...raiz.querySelectorAll('.wb-rama')].map((r, i) => {
    const b = r.querySelector('header').getBoundingClientRect(), x1 = b.left + b.width / 2 - R.left, y1 = b.top - R.top;
    if (y1 - y0 > 260) return '';   // ramas de la fila de abajo (pantallas estrechas): sin línea
    const ym = y0 + (y1 - y0) / 2, c = getComputedStyle(r).getPropertyValue('--c');
    return `<path d="M${x0} ${y0} C${x0} ${ym} ${x1} ${ym} ${x1} ${y1}" stroke="${c}" style="animation-delay:${i * 80}ms"/>`;
  }).join('');
}
window.addEventListener('resize', () => { if (S.cargado && document.body.dataset.page === 'web') lineas(); });

raiz.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-copiar]'); if (!b) return;
  try { await navigator.clipboard.writeText(b.dataset.copiar); b.classList.add('ok'); setTimeout(() => b.classList.remove('ok'), 1200); } catch (err) { /* sin portapapeles */ }
});

async function cargar() {
  if (!S.cargado) raiz.innerHTML = '<div class="wb-cargando"><i></i><i></i><i></i></div>';
  try {
    const r = await fetch(BASE + '?web=1', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
    if (r.status === 401) { location.reload(); return; }
    const j = await r.json();
    if (!j.ok) throw new Error('sin datos');
    S.datos = j; S.cargado = true; pintar();
  } catch (e) {
    raiz.innerHTML = '<p class="wb-vacio">No se ha podido leer la web ahora. Prueba otra vez en un momento.</p>';
  }
}
const abre = (p) => { if (p === 'web') cargar(); };
document.addEventListener('pb:page', (e) => abre(e.detail));
if (document.body.dataset.page === 'web' || window.PB_TAB === 'web') abre('web');
})();
