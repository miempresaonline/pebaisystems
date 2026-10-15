/* PEBAI · Panel — Empresa › Caja. Datos en index.php?caja=1; acciones caja_guardar, caja_borrar, sus_guardar, sus_borrar, caja_ajuste.
   Importes en céntimos. Todo texto escrito por el equipo se pinta con textContent. */
(() => {
'use strict';
const app = document.getElementById('pb-app');
if (!app || !document.getElementById('page-caja')) return;
const BASE = app.dataset.base;
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const S = { loaded: false, csrf: app.dataset.csrf, movimientos: [], suscripciones: [], clientes: [], saldo_inicial: 0, saldo_fecha: '', hoy: '' };
const ui = { mes: '', filtro: '', q: '', ambito: 'mes' };

/* ============ formato ============ */
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MES3 = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const fmt = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', useGrouping: 'always' });
const fmt0 = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, useGrouping: 'always' });
const E = (c) => fmt.format((c || 0) / 100);
const E0 = (c) => Math.abs(c) >= 1000000 ? fmt0.format(c / 100) : fmt.format((c || 0) / 100);
const centAInput = (c) => (c / 100).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' });
const mesDe = (f) => String(f || '').slice(0, 7);
const mesNombre = (m) => { const [y, mm] = m.split('-').map(Number); return MESES[mm - 1].replace(/^./, (c) => c.toUpperCase()) + ' ' + y; };
const sumaMes = (m, d) => { let [y, mm] = m.split('-').map(Number); mm += d; while (mm > 12) { mm -= 12; y++; } while (mm < 1) { mm += 12; y--; } return y + '-' + String(mm).padStart(2, '0'); };
const fechaLarga = (f) => { const d = new Date(f + 'T12:00:00'); return DIAS[d.getDay()].replace(/^./, (c) => c.toUpperCase()) + ' ' + d.getDate() + ' de ' + MESES[d.getMonth()]; };
const SERVICIOS = ['Agente de WhatsApp / chatbot', 'Automatización de procesos', 'GEO: aparecer en la IA', 'Formación en IA', 'App o herramienta a medida', 'Sesión técnica de pago', 'Mantenimiento mensual'];
const CATEGORIAS = ['Herramientas y software', 'Hosting y dominios', 'Publicidad', 'Gestoría', 'Material y equipos', 'Formación', 'Desplazamientos', 'Comisiones bancarias', 'Otros'];
const FORMAS = { transferencia: 'Transferencia', bizum: 'Bizum', tarjeta: 'Tarjeta', efectivo: 'Efectivo', domiciliacion: 'Domiciliación', otro: 'Otro' };
const PALETA = ['#6A5CFF', '#B7FF3C', '#3FD5FF', '#FFB547', '#FF6B7A', '#25D366', '#B98CFF', '#7E8496'];

/* ============ DOM ============ */
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const svg = (inner, cls) => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', cls || 'pb-i'); s.innerHTML = inner; return s; };
const I = {
  in: () => svg('<path d="M17 7 7 17"/><path d="M17 17H7V7"/>'), out: () => svg('<path d="M7 17 17 7"/><path d="M7 7h10v10"/>'),
  rep: () => svg('<path d="M17 2l4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>'),
  plus: () => svg('<path d="M12 5v14M5 12h14"/>'), edit: () => svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
  x: () => svg('<path d="M18 6 6 18M6 6l12 12"/>'), dl: () => svg('<path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>'),
  wallet: () => svg('<rect x="2" y="6" width="20" height="14" rx="3"/><path d="M16 13h.01"/><path d="M2 10h20"/>'), clock: () => svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  search: () => svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
};
const btn = (cls, ico, text, onClick, title) => { const b = el('button', 'pb-btn ' + cls); b.type = 'button'; if (ico) b.append(ico); if (text) b.append(text); if (title) b.title = title; if (onClick) b.addEventListener('click', onClick); return b; };
const toast = (msg, err) => { const t = $('#pb-toast'); $('span', t).textContent = msg; t.classList.toggle('err', !!err); t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 3000); };
const card = (title, note, ...nodes) => { const c = el('div', 'pb-card'); const hd = el('div', 'hd'); const t = el('div'); t.append(el('h2', null, title)); if (note) t.append(el('p', 'note', note)); hd.append(t); c.append(hd, ...nodes); return c; };
const iniciales = (s) => (String(s || '?').replace(/[^\p{L}\p{N} ]/gu, '').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('') || '?').toUpperCase();
const colorDe = (s) => { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return PALETA[h % PALETA.length]; };

/* ============ datos ============ */
async function load() {
  const r = await fetch(BASE + '?caja=1', { credentials: 'same-origin', cache: 'no-store' });
  if (r.status === 401 || r.redirected) { location.reload(); return; }
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || 'No se ha podido cargar la caja.');
  Object.assign(S, j, { loaded: true });
  if (!ui.mes) ui.mes = mesDe(S.hoy);
}
async function post(action, fields) {
  const r = await fetch(BASE, { method: 'POST', body: new URLSearchParams({ action, csrf: S.csrf, ...fields }), credentials: 'same-origin', headers: { 'Accept': 'application/json' } });
  if (r.status === 401) { location.reload(); return; }
  const j = await r.json().catch(() => ({ ok: false, error: 'Respuesta inesperada del servidor.' }));
  if (!j.ok) throw new Error(j.error || 'No se ha podido guardar.');
  await load();
  return j;
}

/* ============ cálculos ============ */
const delMes = (m) => S.movimientos.filter((x) => mesDe(x.fecha) === m);
const totales = (rows) => {
  const ing = rows.filter((x) => x.tipo === 'ingreso'), gas = rows.filter((x) => x.tipo === 'gasto');
  const ingresos = d3.sum(ing.filter((x) => x.cobrado), (x) => x.importe), gastos = d3.sum(gas, (x) => x.importe);
  return { ingresos, gastos, beneficio: ingresos - gastos, pendiente: d3.sum(ing.filter((x) => !x.cobrado), (x) => x.importe), nPend: ing.filter((x) => !x.cobrado).length };
};
const saldoHasta = (fechaFin) => {
  const desde = S.saldo_fecha || '0000-00-00';
  const rows = S.movimientos.filter((x) => x.fecha >= desde && x.fecha <= fechaFin);
  return S.saldo_inicial + d3.sum(rows, (x) => x.tipo === 'ingreso' ? (x.cobrado ? x.importe : 0) : -x.importe);
};
const finDeMes = (m) => { const [y, mm] = m.split('-').map(Number); return m + '-' + String(new Date(y, mm, 0).getDate()).padStart(2, '0'); };
const fijoMensual = () => d3.sum(S.suscripciones.filter((s) => s.activa), (s) => s.periodo === 'anual' ? Math.round(s.importe / 12) : s.importe);
const proximoCargo = (s) => {
  if (!s.activa) return null;
  const hoy = new Date(S.hoy + 'T12:00:00');
  if (s.periodo === 'anual') { const d = new Date(s.inicio + 'T12:00:00'); while (d <= hoy) d.setFullYear(d.getFullYear() + 1); return d; }
  const d = new Date(hoy.getFullYear(), hoy.getMonth(), s.dia, 12); if (d <= hoy) d.setMonth(d.getMonth() + 1);
  const ini = new Date(s.inicio + 'T12:00:00'); while (d < ini) d.setMonth(d.getMonth() + 1);
  if (s.fin && d > new Date(s.fin + 'T12:00:00')) return null;
  return d;
};

/* ============ pintar ============ */
function draw() {
  if (pagina() !== 'caja') return;
  const box = $('#pb-cj');
  if (!S.loaded) { if (!box.childElementCount) { const sk = el('div', 'pb-empty pb-skel'); sk.style.minHeight = '320px'; box.append(sk); } return; }
  $('#pb-cj-mes').textContent = mesNombre(ui.mes);
  $('#pb-cj-next').disabled = ui.mes >= mesDe(S.hoy);
  $('#pb-cj-hoy').style.visibility = ui.mes === mesDe(S.hoy) ? 'hidden' : '';
  const foco = document.activeElement && document.activeElement.id === 'pb-cj-q';
  box.replaceChildren(kpis(), flujo(), grafico(), desgloses(), suscripciones(), movimientos());
  if (foco) { const q = $('#pb-cj-q'); q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
}

function kpis() {
  const row = el('div', 'pb-grid k pb-cj-kpis');
  const t = totales(delMes(ui.mes)), prev = totales(delMes(sumaMes(ui.mes, -1)));
  const saldo = saldoHasta(ui.mes >= mesDe(S.hoy) ? S.hoy : finDeMes(ui.mes));
  const k = (cls, label, valor, sub, i) => { const c = el('div', 'pb-card pb-kpi pb-anim ' + cls); c.style.setProperty('--i', i); c.append(el('div', 'l', label), el('div', 'v', valor)); if (sub) c.append(sub); row.append(c); return c; };
  const sub = (...n) => { const d = el('div', 'd'); d.append(...n); return d; };
  const hayPrev = delMes(sumaMes(ui.mes, -1)).length > 0;
  const delta = (a, b, bueno) => { const s = el('span', 'delta'); const d = a - b; if (!hayPrev) { s.textContent = 'Primer mes'; s.classList.add('flat'); return s; } if (!b && !a) { s.textContent = '—'; s.classList.add('flat'); return s; } s.textContent = (d > 0 ? '+' : d < 0 ? '−' : '') + E0(Math.abs(d)); s.classList.add(d === 0 ? 'flat' : (d > 0) === bueno ? 'up' : 'down'); return s; };
  const hero = k('hero', ui.mes >= mesDe(S.hoy) ? 'Saldo en caja hoy' : 'Saldo a final de mes', E0(saldo), null, 0);
  if (!S.saldo_fecha) { hero.classList.add('sin-saldo'); const b = btn('primary', null, 'Poner saldo inicial', abrirSaldo); b.classList.add('pb-cj-mini'); hero.append(sub(el('span', null, 'Cuenta desde 0 €: falta lo que había en caja.'), b)); }
  else { const b = btn('ghost', null, 'Ajustar', abrirSaldo); b.classList.add('pb-cj-mini'); hero.append(sub(el('span', null, 'Desde ' + E0(S.saldo_inicial) + ' el ' + new Date(S.saldo_fecha + 'T12:00:00').toLocaleDateString('es-ES')), b)); }
  if (saldo < 0) hero.classList.add('neg');
  k('ing', 'Ingresos del mes', E0(t.ingresos), sub(delta(t.ingresos, prev.ingresos, true), el('span', null, hayPrev ? 'vs ' + MES3[Number(sumaMes(ui.mes, -1).slice(5)) - 1] : '')), 1);
  k('gas', 'Gastos del mes', E0(t.gastos), sub(delta(t.gastos, prev.gastos, false), el('span', null, hayPrev ? 'vs ' + MES3[Number(sumaMes(ui.mes, -1).slice(5)) - 1] : '')), 2);
  const bc = k(t.beneficio >= 0 ? 'ben' : 'ben neg', 'Beneficio del mes', (t.beneficio < 0 ? '−' : '') + E0(Math.abs(t.beneficio)), sub(el('span', null, t.ingresos ? Math.round(t.beneficio / t.ingresos * 100) + ' % de lo ingresado' : 'Sin ingresos este mes')), 3);
  const pc = k('pend', 'Pendiente de cobro', E0(t.pendiente), sub(el('span', null, t.nPend ? t.nPend + (t.nPend === 1 ? ' ingreso por cobrar' : ' ingresos por cobrar') : 'Todo cobrado')), 4);
  if (t.nPend) { pc.classList.add('click'); pc.addEventListener('click', () => { ui.filtro = 'pendiente'; draw(); $('#pb-cj-movs').scrollIntoView({ behavior: 'smooth', block: 'start' }); }); }
  return row;
}

function flujo() {
  const rows = delMes(ui.mes), t = totales(rows);
  const nombre = MESES[Number(ui.mes.slice(5)) - 1];
  const c = el('div', 'pb-card pb-cj-flujo pb-anim'); c.style.setProperty('--i', 5);
  const frase = el('p', 'frase');
  const b = (txt, cls) => el('b', cls || null, txt);
  if (!rows.length) { frase.append('En ' + nombre + ' todavía no hay nada apuntado.'); c.append(frase); return c; }
  frase.append('En ' + nombre + ' han entrado ', b(E(t.ingresos), 'ing'), ' y han salido ', b(E(t.gastos), 'gas'), '. ');
  if (t.beneficio >= 0) frase.append('Quedan ', b(E(t.beneficio), 'ben'), t.ingresos ? ', el ' + Math.round(t.beneficio / t.ingresos * 100) + ' % de lo que entró.' : '.');
  else frase.append('Se ha gastado ', b(E(-t.beneficio), 'neg'), ' más de lo que ha entrado.');
  if (t.pendiente) frase.append(' Faltan por cobrar ', b(E(t.pendiente), 'pend'), '.');
  c.append(frase);
  // Cada euro que entra: en qué se va y cuánto queda
  const cats = d3.rollups(rows.filter((x) => x.tipo === 'gasto'), (v) => d3.sum(v, (x) => x.importe), (x) => x.categoria || 'Otros').sort((a, b2) => b2[1] - a[1]);
  const base = Math.max(t.ingresos, t.gastos) || 1;
  const bar = el('div', 'bar'); const leg = el('div', 'leg');
  const seg = (valor, color, label, cls) => {
    const sgm = el('span', 'seg' + (cls ? ' ' + cls : '')); sgm.style.background = color; const w = (valor / base * 100) + '%'; requestAnimationFrame(() => requestAnimationFrame(() => { sgm.style.width = w; })); sgm.title = label + ': ' + E(valor);
    bar.append(sgm);
    const it = el('span', 'it'); const dot = el('i'); dot.style.background = color; it.append(dot, label + ' ', el('b', null, E(valor))); leg.append(it);
  };
  cats.forEach(([cat, v], i) => seg(v, PALETA[[0, 2, 3, 6, 4, 7, 5, 1][i % 8]], cat));
  if (t.beneficio > 0) seg(t.beneficio, 'var(--lime)', 'Queda', 'queda');
  c.append(bar, leg);
  return c;
}

function grafico() {
  const primero = d3.min(S.movimientos, (x) => mesDe(x.fecha)) || mesDe(S.hoy);
  const [py, pm] = primero.split('-').map(Number), [hy, hm] = mesDe(S.hoy).split('-').map(Number);
  const nMeses = Math.max(6, Math.min(12, (hy - py) * 12 + (hm - pm) + 1));
  const c = card(nMeses === 12 ? 'Últimos 12 meses' : 'Mes a mes', 'Ingresos cobrados, gastos y saldo de la caja. Pulsa un mes para verlo.');
  const box = el('div', 'pb-chart pb-cj-chart'); const tip = el('div', 'pb-tip'); box.append(tip); c.append(box);
  const leg = el('div', 'pb-legend'); [['var(--lime)', 'Ingresos'], ['var(--violet)', 'Gastos'], ['var(--cyan)', 'Saldo']].forEach(([col, t]) => { const s = el('span'); const i = el('i'); i.style.background = col; s.append(i, t); leg.append(s); }); c.append(leg);
  const meses = d3.range(nMeses - 1, -1, -1).map((d) => sumaMes(mesDe(S.hoy), -d));
  const datos = meses.map((m) => ({ m, ...totales(delMes(m)), saldo: saldoHasta(m === mesDe(S.hoy) ? S.hoy : finDeMes(m)) }));
  requestAnimationFrame(() => {
    const W = Math.max(300, box.clientWidth), H = 250, M = { l: 54, r: 10, t: 12, b: 26 };
    const s = d3.select(box).insert('svg', '.pb-tip').attr('viewBox', `0 0 ${W} ${H}`).attr('width', '100%');
    const x0 = d3.scaleBand(meses, [M.l, W - M.r]).paddingInner(.28).paddingOuter(.1);
    const x1 = d3.scaleBand(['i', 'g'], [0, x0.bandwidth()]).padding(.12);
    const max = d3.max(datos, (d) => Math.max(d.ingresos, d.gastos, d.saldo)) || 100000;
    const min = Math.min(0, d3.min(datos, (d) => d.saldo));
    const y = d3.scaleLinear([min, max], [H - M.b, M.t]).nice();
    const ticks = y.ticks(4);
    s.append('g').selectAll('line').data(ticks).join('line').attr('x1', M.l).attr('x2', W - M.r).attr('y1', y).attr('y2', y).attr('stroke', 'var(--line)');
    s.append('g').selectAll('text').data(ticks).join('text').attr('x', M.l - 8).attr('y', y).attr('text-anchor', 'end').attr('dominant-baseline', 'middle').attr('font-size', 11).attr('fill', 'var(--muted)').text((d) => fmt0.format(d / 100));
    s.append('g').selectAll('text').data(meses).join('text').attr('x', (m) => x0(m) + x0.bandwidth() / 2).attr('y', H - 8).attr('text-anchor', 'middle').attr('font-size', 11)
      .attr('fill', (m) => m === ui.mes ? 'var(--fg-strong)' : 'var(--muted)').attr('font-weight', (m) => m === ui.mes ? 700 : 400).text((m) => MES3[Number(m.slice(5)) - 1]);
    s.append('rect').attr('x', x0(ui.mes) - 4).attr('width', x0.bandwidth() + 8).attr('y', M.t - 6).attr('height', H - M.t - M.b + 6).attr('rx', 10).attr('fill', 'var(--violet-glow)').attr('opacity', .45);
    const g = s.append('g').selectAll('g').data(datos).join('g').attr('transform', (d) => `translate(${x0(d.m)},0)`);
    const bw = Math.min(nMeses <= 6 ? 34 : 26, x1.bandwidth());
    const bar = (key, col, k) => g.append('rect').attr('class', 'pb-cj-b').attr('x', x1(key) + (x1.bandwidth() - bw) / 2).attr('width', bw).attr('rx', Math.min(5, bw / 2)).attr('fill', col)
      .attr('y', y(0)).attr('height', 0).transition().duration(800).delay((d, i) => i * 35).ease(d3.easeCubicOut).attr('y', (d) => y(d[k])).attr('height', (d) => Math.max(0, y(0) - y(d[k])));
    bar('i', 'var(--lime)', 'ingresos'); bar('g', 'var(--violet)', 'gastos');
    const line = d3.line().x((d) => x0(d.m) + x0.bandwidth() / 2).y((d) => y(d.saldo));
    const path = s.append('path').attr('d', line(datos)).attr('fill', 'none').attr('stroke', 'var(--cyan)').attr('stroke-width', 2.5).attr('stroke-linejoin', 'round').attr('stroke-linecap', 'round');
    const len = path.node().getTotalLength(); path.attr('stroke-dasharray', len).attr('stroke-dashoffset', len).transition().duration(1100).ease(d3.easeCubicOut).attr('stroke-dashoffset', 0);
    s.append('g').selectAll('circle').data(datos).join('circle').attr('cx', (d) => x0(d.m) + x0.bandwidth() / 2).attr('cy', (d) => y(d.saldo)).attr('r', (d) => d.m === ui.mes ? 5 : 3).attr('fill', 'var(--panel-solid)').attr('stroke', 'var(--cyan)').attr('stroke-width', 2);
    g.append('rect').attr('width', x0.bandwidth()).attr('y', M.t).attr('height', H - M.t - M.b).attr('fill', 'transparent').style('cursor', 'pointer')
      .on('mousemove', (ev, d) => {
        tip.replaceChildren(el('div', 'h', mesNombre(d.m)));
        [['var(--lime)', 'Ingresos', d.ingresos], ['var(--violet)', 'Gastos', d.gastos], ['var(--cyan)', 'Saldo', d.saldo]].forEach(([col, n, v]) => { const r = el('div', 'r'); const i = el('i'); i.style.background = col; r.append(i, n + ': ', Object.assign(el('b'), { textContent: E0(v) })); tip.append(r); });
        const b = box.getBoundingClientRect(); let lx = ev.clientX - b.left + 14; if (lx + 190 > b.width) lx -= 210; tip.style.left = lx + 'px'; tip.style.top = (ev.clientY - b.top - 16) + 'px'; tip.classList.add('on');
      })
      .on('mouseleave', () => tip.classList.remove('on'))
      .on('click', (ev, d) => { ui.mes = d.m; draw(); });
  });
  return c;
}

function desgloses() {
  const wrap = el('div', 'pb-grid two');
  const ambito = el('div', 'pb-subtabs'); [['mes', 'Este mes'], ['año', 'Año ' + ui.mes.slice(0, 4)]].forEach(([k, t]) => { const b = btn(ui.ambito === k ? 'on' : '', null, t, () => { ui.ambito = k; draw(); }); b.className = ui.ambito === k ? 'on' : ''; ambito.append(b); });
  const rows = ui.ambito === 'mes' ? delMes(ui.mes) : S.movimientos.filter((x) => x.fecha.slice(0, 4) === ui.mes.slice(0, 4));
  // Ingresos por servicio (barras) y a quién
  const ci = card('Ingresos por servicio', 'Qué hemos vendido y cuánto ha entrado por cada cosa.');
  ci.querySelector('.hd').append(ambito);
  const ing = d3.rollups(rows.filter((x) => x.tipo === 'ingreso'), (v) => ({ total: d3.sum(v.filter((x) => x.cobrado), (x) => x.importe), pend: d3.sum(v.filter((x) => !x.cobrado), (x) => x.importe), n: v.filter((x) => x.cobrado).length, clientes: new Set(v.map((x) => x.cliente).filter(Boolean)).size }), (x) => x.servicio || 'Sin servicio').sort((a, b) => b[1].total - a[1].total);
  if (!ing.length) ci.append(vacio('Aún no hay ingresos ' + (ui.ambito === 'mes' ? 'este mes' : 'este año') + '.', 'ingreso'));
  const max = d3.max(ing, (d) => d[1].total) || 1;
  ing.forEach(([srv, v], i) => {
    const r = el('div', 'pb-cj-bar pb-anim'); r.style.setProperty('--i', i);
    const top = el('div', 't'); top.append(el('b', null, srv), el('span', null, E(v.total)));
    const bar = el('div', 'pb-bar'); const sp = el('span'); bar.append(sp);
    const pie = el('small', null, v.n + (v.n === 1 ? ' cobro' : ' cobros') + (v.clientes ? ' · ' + v.clientes + (v.clientes === 1 ? ' cliente' : ' clientes') : '')); if (v.pend) pie.append(' · ', el('em', 'pend', E(v.pend) + ' por cobrar')); r.append(top, bar, pie);
    requestAnimationFrame(() => { sp.style.width = (v.total ? Math.max(3, v.total / max * 100) : 0) + '%'; });
    ci.append(r);
  });
  // Gastos por categoría (donut)
  const cg = card('Gastos por categoría', 'En qué se va el dinero.');
  const gas = d3.rollups(rows.filter((x) => x.tipo === 'gasto'), (v) => d3.sum(v, (x) => x.importe), (x) => x.categoria || 'Otros').sort((a, b) => b[1] - a[1]);
  if (!gas.length) cg.append(vacio('Aún no hay gastos ' + (ui.ambito === 'mes' ? 'este mes' : 'este año') + '.', 'gasto'));
  else {
    const total = d3.sum(gas, (d) => d[1]);
    const body = el('div', 'pb-cj-donut'); const chart = el('div', 'c'); const legend = el('div', 'l'); body.append(chart, legend); cg.append(body);
    const R = 78, s = d3.select(chart).append('svg').attr('viewBox', '-90 -90 180 180').attr('width', '100%');
    const arcs = d3.pie().sort(null).value((d) => d[1]).padAngle(.025)(gas);
    const arc = d3.arc().innerRadius(R * .64).outerRadius(R).cornerRadius(5);
    s.selectAll('path').data(arcs).join('path').attr('fill', (d, i) => PALETA[i % PALETA.length])
      .transition().duration(900).ease(d3.easeCubicOut).attrTween('d', (d) => { const it = d3.interpolate({ startAngle: d.startAngle, endAngle: d.startAngle }, d); return (t) => arc(it(t)); });
    s.append('text').attr('text-anchor', 'middle').attr('y', -4).attr('font-size', 18).attr('font-family', 'var(--serif)').attr('fill', 'var(--fg-strong)').text(E0(total));
    s.append('text').attr('text-anchor', 'middle').attr('y', 14).attr('font-size', 9).attr('fill', 'var(--muted)').text('en gastos');
    gas.forEach(([cat, v], i) => { const r = el('div', 'it'); const dot = el('i'); dot.style.background = PALETA[i % PALETA.length]; r.append(dot, el('span', null, cat), el('b', null, E(v)), el('em', null, Math.round(v / total * 100) + ' %')); legend.append(r); });
  }
  wrap.append(ci, cg);
  return wrap;
}

function vacio(texto, tipo) { const d = el('div', 'pb-cj-vacio'); d.append(el('span', null, texto), btn('ghost', I.plus(), tipo === 'ingreso' ? 'Apuntar ingreso' : 'Apuntar gasto', () => abrirMov({ tipo }))); return d; }

function suscripciones() {
  const c = card('Suscripciones', 'Se apuntan solas como gasto el día de cada cargo.');
  const hd = c.querySelector('.hd');
  const fijo = el('div', 'pb-cj-fijo'); fijo.append(el('small', null, 'Fijo al mes'), el('b', null, E(fijoMensual())));
  hd.append(fijo, btn('', I.plus(), 'Suscripción', () => abrirSus({})));
  const list = el('div', 'pb-cj-subs');
  if (!S.suscripciones.length) list.append(el('div', 'pb-empty', 'Añade las herramientas que pagáis cada mes o cada año: hosting, dominios, software…'));
  S.suscripciones.forEach((s, i) => {
    const r = el('button', 'pb-cj-sub pb-anim' + (s.activa ? '' : ' off')); r.type = 'button'; r.style.setProperty('--i', i);
    const t = el('span', 'pb-tile'); t.style.background = colorDe(s.nombre); t.append(el('b', null, iniciales(s.nombre)));
    const tx = el('div', 'tx'); tx.append(el('b', null, s.nombre));
    const prox = proximoCargo(s);
    tx.append(el('small', null, (s.categoria || '') + ' · ' + (s.activa ? (prox ? 'próximo cargo ' + prox.getDate() + ' ' + MES3[prox.getMonth()] : 'terminada') : 'en pausa')));
    const imp = el('div', 'imp'); imp.append(el('b', null, E(s.importe)), el('small', null, s.periodo === 'anual' ? 'al año' : 'al mes'));
    r.append(t, tx, imp); r.addEventListener('click', () => abrirSus(s));
    list.append(r);
  });
  c.append(list);
  return c;
}

function movimientos() {
  const c = card('Movimientos de ' + MESES[Number(ui.mes.slice(5)) - 1], null);
  c.id = 'pb-cj-movs';
  const hd = c.querySelector('.hd');
  const bar = el('div', 'pb-filters');
  const g = el('div', 'grow'); g.append(I.search()); const q = el('input'); q.id = 'pb-cj-q'; q.type = 'search'; q.placeholder = 'Buscar concepto, cliente, servicio…'; q.value = ui.q;
  q.addEventListener('input', () => { ui.q = q.value; draw(); }); g.append(q); bar.append(g);
  const chips = el('div', 'pb-subtabs'); [['', 'Todo'], ['ingreso', 'Ingresos'], ['gasto', 'Gastos'], ['pendiente', 'Por cobrar']].forEach(([k, t]) => { const b = el('button', ui.filtro === k ? 'on' : '', t); b.type = 'button'; b.addEventListener('click', () => { ui.filtro = k; draw(); }); chips.append(b); });
  bar.append(chips); c.append(bar);
  const ql = ui.q.toLowerCase();
  const rows = delMes(ui.mes).filter((x) => (!ui.filtro || (ui.filtro === 'pendiente' ? x.tipo === 'ingreso' && !x.cobrado : x.tipo === ui.filtro))
    && (!ql || [x.concepto, x.cliente, x.servicio, x.categoria, x.notas].some((v) => String(v || '').toLowerCase().includes(ql))));
  if (!rows.length) { c.append(vacio(delMes(ui.mes).length ? 'Nada con estos filtros.' : 'Todavía no hay movimientos en ' + MESES[Number(ui.mes.slice(5)) - 1] + '.', 'ingreso')); return c; }
  const list = el('div', 'pb-cj-list');
  d3.groups(rows, (x) => x.fecha).forEach(([f, items]) => {
    const day = el('div', 'day'); const neto = d3.sum(items, (x) => x.tipo === 'ingreso' ? (x.cobrado ? x.importe : 0) : -x.importe);
    day.append(el('span', null, fechaLarga(f)), el('em', neto >= 0 ? 'pos' : 'neg', (neto > 0 ? '+' : neto < 0 ? '−' : '') + E(Math.abs(neto))));
    list.append(day);
    items.forEach((x) => {
      const r = el('button', 'pb-cj-mov ' + x.tipo + (x.tipo === 'ingreso' && !x.cobrado ? ' pend' : '')); r.type = 'button';
      const ic = el('span', 'ic'); ic.append(x.suscripcion_id ? I.rep() : x.tipo === 'ingreso' ? I.in() : I.out());
      const tx = el('div', 'tx'); tx.append(el('b', null, x.concepto));
      const meta = x.tipo === 'ingreso' ? [x.servicio, x.cliente, FORMAS[x.forma]] : [x.categoria, x.suscripcion_id ? 'suscripción · automático' : '', FORMAS[x.forma]];
      tx.append(el('small', null, meta.filter(Boolean).join(' · ') || (x.tipo === 'ingreso' ? 'Ingreso' : 'Gasto')));
      if (x.notas) tx.append(el('small', 'nota', x.notas));
      const imp = el('div', 'imp'); imp.append(el('b', null, (x.tipo === 'ingreso' ? '+' : '−') + E(x.importe)));
      if (x.tipo === 'ingreso' && !x.cobrado) imp.append(el('span', 'pb-cj-tag', 'Por cobrar'));
      r.append(ic, tx, imp); r.addEventListener('click', () => abrirMov(x)); list.append(r);
    });
  });
  c.append(list);
  return c;
}

function exportar() {
  const cols = [['fecha', 'Fecha'], ['tipo', 'Tipo'], ['concepto', 'Concepto'], ['importe', 'Importe'], ['servicio', 'Servicio'], ['cliente', 'Cliente'], ['categoria', 'Categoría'], ['forma', 'Forma de pago'], ['cobrado', 'Cobrado'], ['notas', 'Notas']];
  const esc = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const lines = delMes(ui.mes).map((x) => cols.map(([k]) => esc(k === 'importe' ? centAInput(x.importe) : k === 'cobrado' ? (x.tipo === 'ingreso' ? (x.cobrado ? 'sí' : 'no') : '') : k === 'forma' ? FORMAS[x.forma] || '' : x[k])).join(';'));
  const blob = new Blob(['﻿' + [cols.map((c) => c[1]).join(';'), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = el('a'); a.href = URL.createObjectURL(blob); a.download = 'caja-pebai-' + ui.mes + '.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/* ============ formularios ============ */
function modal(titulo, contenido, acciones, tono) {
  cerrarModal();
  const veil = el('div', 'pb-cj-veil'); const m = el('div', 'pb-cj-modal' + (tono ? ' ' + tono : '')); m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
  const h = el('div', 'mh'); h.append(el('h3', null, titulo), btn('ghost icon', I.x(), null, cerrarModal, 'Cerrar'));
  const f = el('form', 'mb'); f.noValidate = true; f.append(...contenido);
  const foot = el('div', 'mf'); foot.append(...acciones);
  m.append(h, f, foot); veil.append(m); document.body.append(veil);
  veil.addEventListener('mousedown', (e) => { if (e.target === veil) cerrarModal(); });
  requestAnimationFrame(() => veil.classList.add('on'));
  const first = m.querySelector('[data-focus]') || m.querySelector('input'); if (first) setTimeout(() => first.focus(), 60);
  f.addEventListener('submit', (e) => { e.preventDefault(); const p = foot.querySelector('.primary'); if (p) p.click(); });
  return m;
}
function cerrarModal() { const v = $('.pb-cj-veil'); if (v) { v.classList.remove('on'); setTimeout(() => v.remove(), 220); } }
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('.pb-cj-veil')) { e.stopImmediatePropagation(); cerrarModal(); } }, true);
const campo = (label, input, extra) => { const l = el('label', 'pb-field'); const s = el('span', null, label); if (extra) s.append(el('em', null, extra)); l.append(s, input); return l; };
const input = (name, value, attrs) => { const i = el('input'); i.name = name; i.value = value ?? ''; Object.entries(attrs || {}).forEach(([k, v]) => i.setAttribute(k, v)); return i; };
const lista = (id, valores) => { const d = el('datalist'); d.id = id; [...new Set(valores.filter(Boolean))].forEach((v) => { const o = el('option'); o.value = v; d.append(o); }); return d; };
const selectForma = (v) => { const s = el('select'); s.name = 'forma'; s.append(new Option('Forma de pago…', '')); Object.entries(FORMAS).forEach(([k, t]) => s.append(new Option(t, k))); s.value = v || ''; return s; };
const leer = (form) => Object.fromEntries(new FormData(form).entries());
async function guardar(b, action, fields, ok) {
  b.disabled = true;
  try { await post(action, fields); cerrarModal(); toast(ok); draw(); } catch (e) { toast(e.message, true); b.disabled = false; }
}

function abrirMov(x) {
  const nuevo = !x.id; let tipo = x.tipo || 'ingreso';
  const seg = el('div', 'pb-cj-tipo'); const bi = el('button', 'in', 'Ingreso'); const bg = el('button', 'out', 'Gasto'); bi.type = bg.type = 'button'; seg.append(bi, bg);
  const imp = input('importe', x.importe ? centAInput(x.importe) : '', { inputmode: 'decimal', placeholder: '0,00', autocomplete: 'off', 'data-focus': '' }); imp.className = 'pb-cj-imp';
  const impWrap = el('div', 'pb-cj-impw'); impWrap.append(imp, el('span', null, '€'));
  const hoy = S.hoy, def = ui.mes === mesDe(hoy) ? hoy : finDeMes(ui.mes);
  const fecha = input('fecha', x.fecha || def, { type: 'date', max: '2099-12-31' });
  const concepto = input('concepto', x.concepto, { maxlength: 200 });
  const servicio = input('servicio', x.servicio, { list: 'pb-cj-srv', maxlength: 120, placeholder: 'Agente de WhatsApp, formación…' });
  const cliente = input('cliente', x.cliente, { list: 'pb-cj-cli', maxlength: 160, placeholder: 'Empresa a la que se le vendió' });
  const leadId = input('lead_id', x.lead_id || '', { type: 'hidden' });
  cliente.addEventListener('input', () => { const m = S.clientes.find((c) => c.empresa === cliente.value); leadId.value = m ? m.id : ''; });
  const cobrado = el('div', 'pb-cj-tipo small'); const c1 = el('button', 'on', 'Cobrado'); const c0 = el('button', '', 'Pendiente de cobro'); c1.type = c0.type = 'button'; cobrado.append(c1, c0);
  let esCobrado = x.cobrado !== 0; const pintaCobro = () => { c1.classList.toggle('on', esCobrado); c0.classList.toggle('on', !esCobrado); };
  c1.addEventListener('click', () => { esCobrado = true; pintaCobro(); }); c0.addEventListener('click', () => { esCobrado = false; pintaCobro(); }); pintaCobro();
  const categoria = input('categoria', x.categoria, { list: 'pb-cj-cat', maxlength: 80, placeholder: 'Elige o escribe una' });
  const rapidas = el('div', 'pb-cj-quick'); CATEGORIAS.slice(0, 6).forEach((cat) => { const b = el('button', '', cat); b.type = 'button'; b.addEventListener('click', () => { categoria.value = cat; $$('button', rapidas).forEach((z) => z.classList.toggle('on', z === b)); }); rapidas.append(b); });
  const notas = el('textarea'); notas.name = 'notas'; notas.value = x.notas || ''; notas.rows = 3;
  const forma = selectForma(x.forma);
  const fIng = el('div', 'pb-cj-only'); fIng.append(el('div', 'pb-cj-two'), cobrado); fIng.firstChild.append(campo('Servicio vendido', servicio), campo('A quién', cliente)); fIng.append(leadId);
  const fGas = el('div', 'pb-cj-only'); fGas.append(campo('Categoría', categoria), rapidas);
  const dos = el('div', 'pb-cj-two'); dos.append(campo('Fecha', fecha), campo('Forma de pago', forma));
  const sus = x.suscripcion_id ? el('p', 'note pb-cj-auto', 'Apuntado solo por la suscripción. Si lo borras, no vuelve a apuntarse este mes.') : null;
  const contenido = [seg, impWrap, campo('Concepto', concepto), fIng, fGas, dos, campo('Notas', notas, 'opcional'), lista('pb-cj-srv', [...SERVICIOS, ...S.movimientos.map((m) => m.servicio)]),
    lista('pb-cj-cli', S.clientes.map((c) => c.empresa)), lista('pb-cj-cat', [...CATEGORIAS, ...S.movimientos.map((m) => m.categoria)])];
  if (sus) contenido.unshift(sus);
  const save = btn('primary', null, nuevo ? 'Apuntar' : 'Guardar cambios');
  const acts = [];
  if (!nuevo) acts.push(btn('danger', null, 'Borrar', (e) => { if (e.currentTarget.dataset.ok) guardar(e.currentTarget, 'caja_borrar', { id: x.id }, 'Movimiento borrado.'); else { e.currentTarget.dataset.ok = '1'; e.currentTarget.textContent = '¿Seguro? Pulsa otra vez'; } }));
  acts.push(el('span', 'sp'), btn('ghost', null, 'Cancelar', cerrarModal), save);
  const m = modal(nuevo ? 'Apuntar movimiento' : 'Editar movimiento', contenido, acts);
  const pintaTipo = () => {
    m.classList.toggle('ingreso', tipo === 'ingreso'); m.classList.toggle('gasto', tipo === 'gasto');
    bi.classList.toggle('on', tipo === 'ingreso'); bg.classList.toggle('on', tipo === 'gasto');
    fIng.hidden = tipo !== 'ingreso'; fGas.hidden = tipo !== 'gasto';
    concepto.placeholder = tipo === 'ingreso' ? 'Primer pago del chatbot de la Clínica Mora' : 'Anuncios de Instagram de octubre';
    notas.placeholder = tipo === 'ingreso' ? 'Qué se hace con este dinero, cuotas que faltan, detalles…' : 'Detalles del gasto, para qué era…';
  };
  bi.addEventListener('click', () => { tipo = 'ingreso'; pintaTipo(); }); bg.addEventListener('click', () => { tipo = 'gasto'; pintaTipo(); }); pintaTipo();
  save.addEventListener('click', () => {
    const d = leer(m.querySelector('form'));
    guardar(save, 'caja_guardar', { ...d, id: x.id || '', tipo, cobrado: tipo === 'ingreso' && !esCobrado ? '0' : '1' }, nuevo ? (tipo === 'ingreso' ? 'Ingreso apuntado.' : 'Gasto apuntado.') : 'Cambios guardados.');
  });
}

function abrirSus(s) {
  const nuevo = !s.id;
  const nombre = input('nombre', s.nombre, { maxlength: 120, placeholder: 'Hostinger, Cal.com, Google Workspace…', 'data-focus': '' });
  const imp = input('importe', s.importe ? centAInput(s.importe) : '', { inputmode: 'decimal', placeholder: '0,00', autocomplete: 'off' }); imp.className = 'pb-cj-imp';
  const impWrap = el('div', 'pb-cj-impw'); impWrap.append(imp, el('span', null, '€'));
  const periodo = el('select'); periodo.name = 'periodo'; periodo.append(new Option('Cada mes', 'mensual'), new Option('Cada año', 'anual')); periodo.value = s.periodo || 'mensual';
  const dia = input('dia', s.dia || Math.min(28, Number(S.hoy.slice(8))), { type: 'number', min: 1, max: 28 });
  const inicio = input('inicio', s.inicio || S.hoy, { type: 'date' });
  const fin = input('fin', s.fin, { type: 'date' });
  const categoria = input('categoria', s.categoria || 'Herramientas y software', { list: 'pb-cj-cat2', maxlength: 80 });
  const forma = selectForma(s.forma || 'tarjeta');
  const activa = el('label', 'pb-cj-switch'); const chk = el('input'); chk.type = 'checkbox'; chk.checked = s.activa !== 0; activa.append(chk, el('i'), el('span', null, 'Activa: se sigue cobrando'));
  const diaCampo = campo('Día del cargo', dia, 'del 1 al 28');
  const pinta = () => { diaCampo.hidden = periodo.value === 'anual'; };
  periodo.addEventListener('change', pinta);
  const r1 = el('div', 'pb-cj-two'); r1.append(campo('Cada cuánto', periodo), diaCampo);
  const r2 = el('div', 'pb-cj-two'); r2.append(campo('Desde', inicio, 'primer cargo'), campo('Hasta', fin, 'opcional'));
  const r3 = el('div', 'pb-cj-two'); r3.append(campo('Categoría', categoria), campo('Forma de pago', forma));
  const aviso = el('p', 'note', 'Al guardar se apuntan como gasto los cargos que ya hayan pasado desde la fecha de inicio. Si la empezasteis hace tiempo, pon como inicio el mes desde el que llevéis la caja.');
  const save = btn('primary', null, nuevo ? 'Añadir suscripción' : 'Guardar cambios');
  const acts = [];
  if (!nuevo) acts.push(btn('danger', null, 'Eliminar', (e) => { if (e.currentTarget.dataset.ok) guardar(e.currentTarget, 'sus_borrar', { id: s.id }, 'Suscripción eliminada. Los cargos ya apuntados se quedan.'); else { e.currentTarget.dataset.ok = '1'; e.currentTarget.textContent = '¿Seguro? Pulsa otra vez'; } }));
  acts.push(el('span', 'sp'), btn('ghost', null, 'Cancelar', cerrarModal), save);
  const m = modal(nuevo ? 'Nueva suscripción' : s.nombre, [campo('Servicio', nombre), impWrap, r1, r2, r3, activa, aviso, lista('pb-cj-cat2', [...CATEGORIAS, ...S.suscripciones.map((x) => x.categoria)])], acts, 'gasto');
  pinta();
  save.addEventListener('click', () => { const d = leer(m.querySelector('form')); guardar(save, 'sus_guardar', { ...d, id: s.id || '', activa: chk.checked ? '1' : '0' }, nuevo ? 'Suscripción añadida.' : 'Suscripción guardada.'); });
}

function abrirSaldo() {
  const imp = input('saldo_inicial', S.saldo_fecha ? centAInput(S.saldo_inicial) : '', { inputmode: 'decimal', placeholder: '0,00', 'data-focus': '' }); imp.className = 'pb-cj-imp';
  const impWrap = el('div', 'pb-cj-impw'); impWrap.append(imp, el('span', null, '€'));
  const fecha = input('saldo_fecha', S.saldo_fecha || S.hoy, { type: 'date' });
  const save = btn('primary', null, 'Guardar saldo');
  const m = modal('Saldo inicial de la caja', [el('p', 'note', 'El dinero que había en la caja el día que empezáis a apuntar. A partir de ahí, el saldo se calcula solo con cada ingreso cobrado y cada gasto.'), impWrap, campo('A fecha de', fecha)],
    [el('span', 'sp'), btn('ghost', null, 'Cancelar', cerrarModal), save]);
  save.addEventListener('click', () => guardar(save, 'caja_ajuste', leer(m.querySelector('form')), 'Saldo inicial guardado.'));
}

/* ============ navegación y ciclo ============ */
$$('[data-cj-nuevo]').forEach((b) => b.addEventListener('click', () => abrirMov({ tipo: b.dataset.cjNuevo })));
$('#pb-cj-prev').addEventListener('click', () => { ui.mes = sumaMes(ui.mes, -1); draw(); });
$('#pb-cj-next').addEventListener('click', () => { if (ui.mes < mesDe(S.hoy)) { ui.mes = sumaMes(ui.mes, 1); draw(); } });
$('#pb-cj-hoy').addEventListener('click', () => { ui.mes = mesDe(S.hoy); draw(); });
function pagina() { return document.body.dataset.page || 'resumen'; }
const refrescar = () => load().then(draw).catch((e) => { if (pagina() === 'caja') toast(e.message, true); });
document.addEventListener('pb:page', (e) => { if (e.detail === 'caja') { draw(); refrescar(); } });
document.addEventListener('visibilitychange', () => { if (!document.hidden && pagina() === 'caja' && !$('.pb-cj-veil')) refrescar(); });
let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (pagina() === 'caja' && !$('.pb-cj-veil')) draw(); }, 150); });
if (pagina() === 'caja') { draw(); refrescar(); }
})();
