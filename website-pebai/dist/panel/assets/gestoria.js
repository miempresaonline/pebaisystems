/* PEBAI · Panel — Empresa › Gestoría: facturas, reparto de cada venta (acuerdo con Adrián), gastos que se desgravan y lo que toca
   pagar cada trimestre. Datos en index.php?gestoria=1 (ver _gestoria_panel.php). Importes en céntimos. Todo texto de los datos pasa por esc(). */
(() => {
'use strict';
const app = document.getElementById('pb-app');
const raiz = document.getElementById('pb-gestoria');
if (!app || !raiz) return;
const BASE = app.dataset.base;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', useGrouping: 'always' });
const E = (c) => fmt.format((+c || 0) / 100);
const centInput = (c) => ((+c || 0) / 100).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const parseE = (s) => {
  s = String(s || '').replace(/[\s€ ]/g, '');
  if (!s) return 0;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.'); else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  const n = parseFloat(s); return isFinite(n) ? Math.round(n * 100) : 0;
};
const MES3 = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const F = (f) => f ? `${+f.slice(8, 10)} ${MES3[+f.slice(5, 7) - 1]} ${f.slice(0, 4)}` : '—';
const dias = (f, hoy) => Math.round((new Date(f + 'T12:00:00') - new Date(hoy + 'T12:00:00')) / 864e5);
const ico = (p) => `<svg class="pb-i" viewBox="0 0 24 24">${p}</svg>`;
const toast = (msg, err) => { const t = document.getElementById('pb-toast'); if (!t) { if (err) alert(msg); return; } t.querySelector('span').textContent = msg; t.classList.toggle('err', !!err); t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 3200); };
const pct = (p) => String(+p).replace('.', ',') + ' %';

let D = null;
const ui = { tab: 'resumen', form: null, gasto: null };
try { ui.tab = sessionStorage.getItem('pb-gs-tab') || 'resumen'; } catch (e) { /* nada */ }

async function cargar() {
  const r = await fetch(BASE + '?gestoria=1', { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } });
  if (r.status === 401) { pbCaduca(); return; }
  const j = await r.json(); if (!j.ok) throw new Error(j.error || 'Sin datos');
  D = j;
}
async function post(action, campos) {
  const r = await fetch(BASE, { method: 'POST', credentials: 'same-origin', headers: { Accept: 'application/json' },
    body: new URLSearchParams({ action, csrf: D.csrf || app.dataset.csrf, ...campos }) });
  if (r.status === 401) { pbCaduca(); throw new Error('Sesión caducada'); }
  const j = await r.json().catch(() => ({ ok: false, error: 'Respuesta inesperada del servidor.' }));
  if (!j.ok) throw new Error(j.error || 'No se ha podido guardar.');
  await cargar(); pintar();
  return j;
}

/* ============ piezas ============ */
const chip = (estado) => ({ emitida: '<span class="gs-chip pend">Sin cobrar</span>', cobrada: '<span class="gs-chip ok">Cobrada</span>', anulada: '<span class="gs-chip off">Anulada</span>' }[estado] || '');
const canalN = (k) => (D.canales[k] || ['—'])[0];
const opts = (lista, sel) => lista.map(([v, t]) => `<option value="${esc(v)}"${String(v) === String(sel) ? ' selected' : ''}>${esc(t)}</option>`).join('');
const faltanDatos = () => !D.ajustes.nombre || !D.ajustes.nif || !D.ajustes.direccion;

function cabecera() {
  const alta = D.ajustes.fecha_alta, antes = D.hoy < alta;
  const tabs = [['resumen', 'Resumen'], ['facturas', 'Facturas'], ['reparto', 'Reparto'], ['gastos', 'Gastos'], ['datos', 'Mis datos']];
  return `<header class="gs-cab">
    <div><h2>Gestoría</h2><p>Tus facturas, lo que le toca a cada uno y lo que tendrás que pagar a Hacienda cada 3 meses. Las cuentas las hace el panel: tú solo apuntas y, cuando toque, presentas.</p></div>
  </header>
  ${antes ? `<div class="gs-aviso">${ico('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>')}<div><b>Te das de alta como autónomo el ${esc(F(alta))}.</b> Faltan ${dias(alta, D.hoy)} días. Hasta entonces no hagas facturas; puedes ir dejando listos tus datos.</div></div>` : ''}
  ${faltanDatos() ? `<div class="gs-aviso amb">${ico('<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>')}<div><b>Faltan tus datos para las facturas.</b> Ve a «Mis datos»: tu NIF es tu DNI con la letra y tu dirección fiscal es donde vives.</div></div>` : ''}
  <nav class="gs-tabs">${tabs.map(([k, t]) => `<button type="button" data-tab="${k}" class="${ui.tab === k ? 'on' : ''}">${t}</button>`).join('')}</nav>`;
}

/* ============ Resumen ============ */
function resumen() {
  const tri = D.trimestres, prox = tri.find((t) => t.plazo >= D.hoy) || tri[0];
  const total = (t) => Math.max(0, t.m303.pagar) + t.m130.pagar + t.m111.pagar;
  const pend = D.caja_pendientes.length;
  const adrPend = D.reparto.total.adrian - D.reparto.adrian_facturado;
  return `
  <section class="gs-hero">
    <div class="gs-prox">
      <small>Próxima entrega a Hacienda</small>
      <b>${esc(F(prox.plazo))}</b>
      <span>${dias(prox.plazo, D.hoy) >= 0 ? `Quedan ${dias(prox.plazo, D.hoy)} días` : 'Ya ha pasado'} · trimestre ${prox.t}.º de ${prox.y}</span>
      <em>Aparta ${E(total(prox))}</em>
    </div>
    <div class="gs-kpis">
      ${kpi('IVA', prox.m303.pagar, prox.m303.pagar < 0 ? 'Te sale a favor: se resta del siguiente' : 'El IVA que cobraste menos el que pagaste')}
      ${kpi('Adelanto de IRPF', prox.m130.pagar, 'El 20 % de lo que has ganado este año, menos lo ya adelantado')}
      ${kpi('Retenciones', prox.m111.pagar, 'El 15 % que guardaste de Adrián o de los comisionistas')}
      ${kpi('Facturado este trimestre', prox.ingresos, `${prox.facturas} factura${prox.facturas === 1 ? '' : 's'} · gastos ${E(prox.gastos)}`)}
    </div>
  </section>
  ${pend || adrPend > 0 ? `<section class="gs-card gs-tareas"><div class="gs-card-h"><h3>Para tener al día</h3></div>
    ${pend ? `<button type="button" class="gs-tarea" data-ir="gastos">${ico('<path d="M5 12h14M12 5v14"/>')}<span><b>${pend} gasto${pend === 1 ? '' : 's'} de la caja</b> sin pasar a la gestoría. Si tienen factura, te los desgravas.</span></button>` : ''}
    ${adrPend > 0 ? `<button type="button" class="gs-tarea" data-ir="reparto">${ico('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>')}<span><b>Adrián te tiene que facturar ${E(adrPend)}</b> de lo ya cobrado.</span></button>` : ''}
  </section>` : ''}
  <section class="gs-card">
    <div class="gs-card-h"><h3>Trimestre a trimestre</h3><span>Lo que tocará presentar en cada fecha</span></div>
    <div class="gs-tri">${tri.map((t) => `
      <div class="gs-tri-f${t === prox ? ' on' : ''}">
        <div class="q"><b>${t.t}T ${t.y}</b><span>${esc(F(t.desde))} – ${esc(F(t.hasta))}</span></div>
        <div><small>IVA</small><b>${E(t.m303.pagar)}</b></div>
        <div><small>IRPF</small><b>${E(t.m130.pagar)}</b></div>
        <div><small>Retenciones</small><b>${E(t.m111.pagar)}</b></div>
        <div class="pl"><small>Presentar hasta</small><b>${esc(F(t.plazo))}</b></div>
      </div>`).join('')}</div>
  </section>
  <section class="gs-card gs-como">
    <div class="gs-card-h"><h3>Qué es cada cosa</h3></div>
    <div class="gs-exp">
      <div><b>IVA</b><p>A cada factura le sumas un 21 %. Ese dinero no es tuyo: es de Hacienda. Cada 3 meses le das el IVA que cobraste, menos el IVA que tú pagaste en tus gastos.</p></div>
      <div><b>Adelanto de IRPF</b><p>Es un adelanto de tu impuesto de la renta: el 20 % de lo que ganas (lo que cobras menos tus gastos). Si tus clientes ya te retienen en la factura, puede que no tengas que hacerlo; lo vemos con tus primeras facturas.</p></div>
      <div><b>Retenciones</b><p>Cuando pagas a Adrián o a un comisionista con recibí, te quedas un trocito (7 o 15 %) y se lo das tú a Hacienda en su nombre.</p></div>
      <div><b>Fechas</b><p>Del 1 al 20 de abril, julio y octubre, y del 1 al 30 de enero. En enero, además, los resúmenes del año. La renta, de abril a junio.</p></div>
    </div>
    <p class="gs-nota">Son cuentas para preparar las declaraciones. Las presentas tú en la sede de Hacienda con tu certificado digital o Cl@ve; antes de presentar, repásalas conmigo.</p>
  </section>`;
}
const kpi = (t, v, s) => `<div class="gs-kpi${v < 0 ? ' fav' : ''}"><small>${esc(t)}</small><b>${E(v)}</b><span>${esc(s)}</span></div>`;

/* ============ Facturas ============ */
function facturas() {
  return `
  <div class="gs-barra"><button type="button" class="pb-btn primary" id="gs-nueva">${ico('<path d="M12 5v14M5 12h14"/>')}Nueva factura</button>
    <span>La siguiente será la <b>${esc(D.siguiente)}</b>. Los números van seguidos y no se pueden saltar.</span></div>
  ${ui.form ? formFactura(ui.form) : ''}
  <section class="gs-card">
    <div class="gs-card-h"><h3>Tus facturas</h3><span>${D.facturas.length} en total</span></div>
    ${D.facturas.length ? `<div class="gs-lista">${D.facturas.map((f) => `
      <div class="gs-fac ${esc(f.estado)}">
        <div class="n"><b>${esc(f.numero)}</b><span>${esc(F(f.fecha))}</span></div>
        <div class="c"><b>${esc(f.cliente)}</b><span>${esc(canalN(f.canal))}${f.comisionista ? ' · comisionista ' + esc(f.comisionista) : ''}</span></div>
        <div class="t"><b>${E(f.total)}</b><span>base ${E(f.base)}</span></div>
        <div class="e">${chip(f.estado)}${f.estado === 'cobrada' ? `<span>${esc(F(f.fecha_cobro))}</span>` : ''}</div>
        <div class="a">
          <a class="pb-btn ghost" href="${BASE}?gestoria_factura=${f.id}" target="_blank" rel="noopener">Ver / PDF</a>
          ${f.estado === 'emitida' ? `<button type="button" class="pb-btn ghost" data-cobrar="${f.id}">Cobrada</button>` : ''}
          ${f.estado === 'cobrada' ? `<button type="button" class="pb-btn ghost" data-descobrar="${f.id}">No cobrada</button>` : ''}
          <details class="gs-mas"><summary class="pb-btn ghost">···</summary><div>
            ${f.estado !== 'anulada' ? `<button type="button" data-editar="${f.id}">Cambiar</button>` : ''}
            <button type="button" data-duplicar="${f.id}">Duplicar (cuota del mes)</button>
            ${f.estado !== 'anulada' ? `<button type="button" data-anular="${f.id}">Anular</button>` : ''}
            <button type="button" data-borrar="${f.id}">Borrar (solo la última)</button>
          </div></details>
        </div>
      </div>`).join('')}</div>` : '<p class="gs-vacio">Todavía no hay facturas. La primera, cuando estés dado de alta.</p>'}
  </section>`;
}

function formFactura(f) {
  const lineas = f.lineas && f.lineas.length ? f.lineas : [{ c: '', n: 1, p: 0 }];
  const comisionistas = [...new Set(D.facturas.map((x) => x.comisionista).filter(Boolean))];
  return `<section class="gs-card gs-form" id="gs-ffac">
    <div class="gs-card-h"><h3>${f.id ? 'Cambiar factura ' + esc(f.numero) : 'Nueva factura'}</h3><button type="button" class="pb-btn ghost" data-cerrar>Cerrar</button></div>
    <div class="gs-campos">
      <label>Fecha<input type="date" name="fecha" value="${esc(f.fecha)}"></label>
      <label class="w2">Cliente (nombre de la empresa)<input name="cliente" value="${esc(f.cliente || '')}" maxlength="160"></label>
      <label>NIF o CIF del cliente<input name="cliente_nif" value="${esc(f.cliente_nif || '')}" maxlength="20" placeholder="B12345678"></label>
      <label class="w3">Dirección del cliente<input name="cliente_dir" value="${esc(f.cliente_dir || '')}" maxlength="300" placeholder="Calle, número, CP y ciudad"></label>
    </div>
    <div class="gs-lineas">
      <div class="gs-lin h"><span>Concepto</span><span>Cantidad</span><span>Precio sin IVA</span><span></span></div>
      ${lineas.map((l, i) => `<div class="gs-lin" data-i="${i}"><input name="c" value="${esc(l.c)}" maxlength="300" placeholder="Agente de voz: alta y puesta en marcha"><input name="n" value="${esc(String(l.n).replace('.', ','))}" inputmode="decimal"><input name="p" value="${l.p ? esc(centInput(l.p)) : ''}" inputmode="decimal" placeholder="590,00"><button type="button" class="pb-btn ghost" data-quitar="${i}" title="Quitar">×</button></div>`).join('')}
      <button type="button" class="pb-btn ghost" id="gs-mas-linea">+ Otro concepto</button>
    </div>
    <div class="gs-campos">
      <label>IVA<select name="iva_pct">${opts([[21, '21 % (lo normal)'], [10, '10 %'], [4, '4 %'], [0, 'Sin IVA']], f.iva_pct ?? 21)}</select></label>
      <label>Retención en tu factura<select name="irpf_pct">${opts([[7, '7 % (los 3 primeros años)'], [15, '15 %'], [0, 'Sin retención']], f.irpf_pct ?? D.ajustes.retencion)}</select></label>
      <label>¿Quién consiguió el cliente?<select name="canal">${opts(Object.entries(D.canales).map(([k, c]) => [k, `${c[0]} (${c[1]}/${c[2]}/${c[3]})`]), f.canal || 'daniel')}</select></label>
      <label>Costes directos de esta venta<input name="coste" value="${f.coste ? esc(centInput(f.coste)) : ''}" inputmode="decimal" placeholder="0,00"></label>
      <label>Growth Partner (solo en la factura de implantación)<input name="comisionista" value="${esc(f.comisionista || '')}" maxlength="80" list="gs-coms" placeholder="Nadie"><datalist id="gs-coms">${comisionistas.map((c) => `<option value="${esc(c)}">`).join('')}</datalist></label>
      <label>Su comisión<select name="com_pct">${opts([[8, '8 % (Growth Partner)'], [7, '7 %'], [5, '5 %'], [10, '10 %']], f.com_pct ?? 8)}</select></label>
      <label class="w3">Notas (no salen en la factura)<input name="notas" value="${esc(f.notas || '')}" maxlength="2000"></label>
    </div>
    <div class="gs-cuenta" id="gs-cuenta"></div>
    <div class="gs-acc"><button type="button" class="pb-btn primary" id="gs-guardar-fac">${f.id ? 'Guardar cambios' : 'Crear factura'}</button></div>
  </section>`;
}

function leerFactura() {
  const c = document.getElementById('gs-ffac'); const v = (n) => c.querySelector(`[name="${n}"]`).value;
  const lineas = [...c.querySelectorAll('.gs-lin[data-i]')].map((r) => ({ c: r.querySelector('[name=c]').value.trim(), n: parseFloat(r.querySelector('[name=n]').value.replace(',', '.')) || 0, p: parseE(r.querySelector('[name=p]').value) }));
  return { id: ui.form.id || 0, numero: ui.form.numero, fecha: v('fecha'), cliente: v('cliente'), cliente_nif: v('cliente_nif'), cliente_dir: v('cliente_dir'), lineas,
    iva_pct: +v('iva_pct'), irpf_pct: +v('irpf_pct'), canal: v('canal'), coste: parseE(v('coste')), comisionista: v('comisionista').trim(), com_pct: +v('com_pct'), notas: v('notas') };
}
function cuentaFactura() {
  const box = document.getElementById('gs-cuenta'); if (!box) return;
  const f = leerFactura();
  const base = f.lineas.reduce((s, l) => s + Math.round(l.n * l.p), 0), iva = Math.round(base * f.iva_pct / 100), irpf = Math.round(base * f.irpf_pct / 100);
  const c = D.canales[f.canal], bolsa = Math.max(0, base - f.coste), pc = f.comisionista ? f.com_pct : 0;
  const com = Math.round(bolsa * pc / 100), caja = Math.round(bolsa * c[3] / 100), adr = Math.round(bolsa * (c[1] - pc / 2) / 100), dan = bolsa - com - caja - adr;
  box.innerHTML = `<div class="gs-tot"><div><span>Base</span><b>${E(base)}</b></div><div><span>+ IVA ${pct(f.iva_pct)}</span><b>${E(iva)}</b></div>${irpf ? `<div><span>− Retención ${pct(f.irpf_pct)}</span><b>${E(irpf)}</b></div>` : ''}<div class="fin"><span>El cliente te paga</span><b>${E(base + iva - irpf)}</b></div></div>
    <div class="gs-rep-mini"><small>Cuando se cobre, se reparte así (sobre ${E(bolsa)})</small>
      <span style="--c:#9C93FF">Adrián <b>${E(adr)}</b></span><span style="--c:#B7FF3C">Daniel <b>${E(dan)}</b></span><span style="--c:#3FD5FF">Caja <b>${E(caja)}</b></span>${com ? `<span style="--c:#FFB547">${esc(f.comisionista)} <b>${E(com)}</b></span>` : ''}</div>`;
}

/* ============ Reparto ============ */
function reparto() {
  const R = D.reparto, adrPend = R.total.adrian - R.adrian_facturado;
  const cobradas = D.facturas.filter((f) => f.estado === 'cobrada');
  return `
  <section class="gs-tres">
    ${repC('Adrián', R.total.adrian, '#9C93FF', adrPend > 0 ? `Te tiene que facturar ${E(adrPend)}` : 'Todo facturado')}
    ${repC('Daniel', R.total.daniel, '#B7FF3C', 'Lo tuyo de lo cobrado')}
    ${repC('Caja', R.total.caja, '#3FD5FF', 'El 15 % que se queda la empresa')}
  </section>
  <section class="gs-card">
    <div class="gs-card-h"><h3>Adrián</h3><span>Te factura su parte y tú te la desgravas</span></div>
    <p class="gs-p">De lo ya cobrado, a Adrián le tocan <b>${E(R.total.adrian)}</b>. Te ha facturado <b>${E(R.adrian_facturado)}</b>. ${adrPend > 0 ? `Falta que te facture <b>${E(adrPend)}</b>: cuando te llegue su factura, apúntala en Gastos como «Factura de Adrián».` : 'Está todo al día.'}</p>
    <p class="gs-nota">Para hacerte factura, Adrián tiene que estar dado de alta como autónomo.</p>
  </section>
  <section class="gs-card">
    <div class="gs-card-h"><h3>Growth Partners</h3><span>8 % de la implantación, a medias entre Adrián y tú</span></div>
    ${R.comisionistas.length ? `<div class="gs-coms">${R.comisionistas.map((c) => { const p = c.generado - c.pagado; return `
      <div><b>${esc(c.nombre)}</b><span>Ganado ${E(c.generado)} · pagado ${E(c.pagado)}</span><em class="${p > 0 ? 'pend' : ''}">${p > 0 ? 'Le debes ' + E(p) : 'Al día'}</em>
      ${p > 0 ? `<button type="button" class="pb-btn ghost" data-pagar-com="${esc(c.nombre)}" data-imp="${p}">Apuntar pago</button>` : ''}</div>`; }).join('')}</div>`
      : '<p class="gs-vacio">Ningún comisionista todavía. Cuando una factura lleve comisionista y se cobre, aparece aquí.</p>'}
  </section>
  <section class="gs-card">
    <div class="gs-card-h"><h3>Venta a venta</h3><span>Solo lo cobrado</span></div>
    ${cobradas.length ? `<div class="gs-rep-tabla"><div class="h"><span>Factura</span><span>Canal</span><span>Bolsa</span><span>Adrián</span><span>Daniel</span><span>Caja</span><span>Comisión</span></div>
      ${cobradas.map((f) => `<div><span><b>${esc(f.numero)}</b> ${esc(f.cliente)}</span><span>${esc(canalN(f.canal))}</span><span>${E(f.reparto.bolsa)}</span><span>${E(f.reparto.adrian)}</span><span>${E(f.reparto.daniel)}</span><span>${E(f.reparto.caja)}</span><span>${f.reparto.comision ? E(f.reparto.comision) : '—'}</span></div>`).join('')}</div>`
      : '<p class="gs-vacio">Aún no hay facturas cobradas.</p>'}
    <p class="gs-nota">La bolsa es la base de la factura (sin IVA) menos los costes directos. El IVA y la retención no se reparten: son de Hacienda.</p>
  </section>`;
}
const repC = (n, v, c, s) => `<div class="gs-rep" style="--c:${c}"><small>${esc(n)}</small><b>${E(v)}</b><span>${esc(s)}</span></div>`;

/* ============ Gastos ============ */
function gastos() {
  const g = ui.gasto;
  return `
  <div class="gs-barra"><button type="button" class="pb-btn primary" id="gs-nuevo-gasto">${ico('<path d="M12 5v14M5 12h14"/>')}Nuevo gasto</button>
    <span>Lo que pagas por el trabajo (Claude, Hostinger, Retell, la cuota de autónomo…) se resta de lo que ganas y pagas menos.</span></div>
  ${g ? formGasto(g) : ''}
  ${D.caja_pendientes.length ? `<section class="gs-card">
    <div class="gs-card-h"><h3>De la caja, sin pasar</h3><span>Gastos apuntados en Caja desde tu alta</span></div>
    <div class="gs-lista">${D.caja_pendientes.map((m) => `<div class="gs-gas"><div class="n"><b>${esc(m.concepto || m.categoria)}</b><span>${esc(F(m.fecha))} · ${esc(m.categoria)}</span></div><div class="t"><b>${E(m.importe)}</b></div>
      <div class="a"><button type="button" class="pb-btn ghost" data-desde-caja="${m.id}">Pasar</button></div></div>`).join('')}</div>
  </section>` : ''}
  <section class="gs-card">
    <div class="gs-card-h"><h3>Gastos de la gestoría</h3><span>${D.gastos.length} apuntados</span></div>
    ${D.gastos.length ? `<div class="gs-lista">${D.gastos.map((x) => `<div class="gs-gas${+x.deducible ? '' : ' nod'}">
      <div class="n"><b>${esc(x.proveedor || D.tipos[x.tipo])}${x.persona && x.tipo === 'comision' ? ' · ' + esc(x.persona) : ''}</b><span>${esc(F(x.fecha))} · ${esc(D.tipos[x.tipo] || x.tipo)}${x.concepto ? ' · ' + esc(x.concepto) : ''}</span></div>
      <div class="t"><b>${E(x.base)}</b><span>${+x.iva ? 'IVA ' + E(x.iva) : ''}${+x.irpf ? ' · retenido ' + E(x.irpf) : ''}${+x.deducible ? '' : 'no se desgrava'}</span></div>
      <div class="a"><button type="button" class="pb-btn ghost" data-editar-gasto="${x.id}">Cambiar</button><button type="button" class="pb-btn ghost" data-borrar-gasto="${x.id}" title="Quitar de la gestoría">×</button></div></div>`).join('')}</div>`
      : '<p class="gs-vacio">Todavía no hay gastos. Empieza por la cuota de autónomo y tus herramientas.</p>'}
  </section>`;
}

function formGasto(g) {
  const t = g.tipo || 'es';
  const conIva = t === 'es' || t === 'adrian', conRet = t === 'adrian' || t === 'comision';
  return `<section class="gs-card gs-form" id="gs-fgas">
    <div class="gs-card-h"><h3>${g.id ? 'Cambiar gasto' : 'Nuevo gasto'}</h3><button type="button" class="pb-btn ghost" data-cerrar-gasto>Cerrar</button></div>
    <div class="gs-campos">
      <label class="w2">¿Qué es?<select name="tipo">${opts(Object.entries(D.tipos), t)}</select></label>
      <label>Fecha<input type="date" name="fecha" value="${esc(g.fecha || D.hoy)}"></label>
      ${t === 'comision' ? `<label>Nombre del comisionista<input name="persona" value="${esc(g.persona || '')}" maxlength="80"></label>`
        : t === 'adrian' ? '' : `<label>Proveedor<input name="proveedor" value="${esc(g.proveedor || '')}" maxlength="120" placeholder="Hostinger, Anthropic…"></label>`}
      <label class="w2">Concepto<input name="concepto" value="${esc(g.concepto || '')}" maxlength="300"></label>
      <label>${t === 'comision' ? 'Comisión (antes de retener)' : 'Importe sin IVA'}<input name="base" value="${g.base ? esc(centInput(g.base)) : ''}" inputmode="decimal" placeholder="0,00"></label>
      ${conIva ? `<label>IVA<select name="iva_pct">${opts([[21, '21 %'], [10, '10 %'], [4, '4 %'], [0, 'Sin IVA']], g.iva_pct ?? 21)}</select></label>` : ''}
      ${t === 'adrian' ? `<label>Retención de su factura<select name="irpf_pct">${opts([[15, '15 %'], [7, '7 %'], [0, 'Ninguna']], g.irpf_pct ?? 15)}</select></label>` : ''}
      ${t === 'comision' ? `<label class="w2">¿Con recibí?<select name="deducible">${opts([['1', 'Sí: firma un recibí, retienes el 15 % y se desgrava'], ['0', 'No: no se desgrava']], g.deducible ?? '1')}</select></label>` : ''}
      ${t === 'comision' ? '<input type="hidden" name="irpf_pct" value="15">' : ''}
    </div>
    ${t === 'ue' || t === 'fuera' ? '<p class="gs-nota">Las empresas de fuera (Anthropic, Google, Hostinger…) no cobran IVA español. Se desgrava igual; en la declaración de IVA se apunta en las dos columnas y no se paga nada.</p>' : ''}
    ${t === 'cuota' ? '<p class="gs-nota">La cuota de autónomo que te cobra la Seguridad Social cada mes se desgrava entera.</p>' : ''}
    <div class="gs-cuenta" id="gs-cuenta-g"></div>
    <div class="gs-acc"><button type="button" class="pb-btn primary" id="gs-guardar-gasto">${g.id ? 'Guardar cambios' : 'Apuntar gasto'}</button></div>
  </section>`;
}
function leerGasto() {
  const c = document.getElementById('gs-fgas'); const v = (n, d) => { const e = c.querySelector(`[name="${n}"]`); return e ? e.value : d; };
  return { id: ui.gasto.id || 0, caja_id: ui.gasto.caja_id || 0, tipo: v('tipo', 'es'), fecha: v('fecha', D.hoy), persona: v('persona', ''), proveedor: v('proveedor', ''), concepto: v('concepto', ''),
    base: parseE(v('base', '')), iva_pct: +v('iva_pct', 0), irpf_pct: +v('irpf_pct', 0), deducible: v('deducible', '1') };
}
function cuentaGasto() {
  const box = document.getElementById('gs-cuenta-g'); if (!box) return;
  const g = leerGasto(); const conIva = g.tipo === 'es' || g.tipo === 'adrian';
  const iva = conIva ? Math.round(g.base * g.iva_pct / 100) : 0;
  const ret = (g.tipo === 'adrian' || (g.tipo === 'comision' && g.deducible === '1')) ? Math.round(g.base * g.irpf_pct / 100) : 0;
  box.innerHTML = `<div class="gs-tot"><div><span>Importe</span><b>${E(g.base)}</b></div>${iva ? `<div><span>+ IVA</span><b>${E(iva)}</b></div>` : ''}${ret ? `<div><span>− Te quedas para Hacienda</span><b>${E(ret)}</b></div>` : ''}<div class="fin"><span>${g.tipo === 'comision' ? 'Le das' : 'Pagas'}</span><b>${E(g.base + iva - ret)}</b></div></div>`;
}

/* ============ Mis datos ============ */
function datos() {
  const a = D.ajustes;
  return `<section class="gs-card gs-form" id="gs-fdatos">
    <div class="gs-card-h"><h3>Mis datos para las facturas</h3><span>Solo se guardan en el servidor privado del panel</span></div>
    <div class="gs-campos">
      <label class="w2">Nombre y apellidos<input name="nombre" value="${esc(a.nombre)}" maxlength="120"></label>
      <label>NIF (tu DNI con la letra)<input name="nif" value="${esc(a.nif)}" maxlength="20" placeholder="12345678Z"></label>
      <label class="w2">Dirección (donde vives)<input name="direccion" value="${esc(a.direccion)}" maxlength="200" placeholder="Calle, número, piso"></label>
      <label>Código postal y ciudad<input name="ciudad" value="${esc(a.ciudad)}" maxlength="120"></label>
      <label>Email<input name="email" value="${esc(a.email)}" maxlength="120"></label>
      <label>Teléfono<input name="telefono" value="${esc(a.telefono)}" maxlength="30"></label>
      <label class="w2">IBAN donde te pagan<input name="iban" value="${esc(a.iban)}" maxlength="40" placeholder="ES00 0000 0000 0000 0000 0000"></label>
      <label>Fecha de alta de autónomo<input type="date" name="fecha_alta" value="${esc(a.fecha_alta)}"></label>
      <label>Retención en tus facturas<select name="retencion">${opts([[7, '7 % (3 primeros años)'], [15, '15 %'], [0, 'Sin retención']], a.retencion)}</select></label>
      <label>Cuota de autónomo al mes<input name="cuota" value="${esc(centInput(a.cuota))}" inputmode="decimal"></label>
      <label class="w3">Texto al pie de las facturas (opcional)<input name="pie" value="${esc(a.pie)}" maxlength="500" placeholder="Gracias por confiar en PEBAI Systems"></label>
    </div>
    <p class="gs-nota">Retención: si tu actividad es de profesional (programar, consultoría), las empresas te retienen un 7 % los 3 primeros años y 15 % después. Lo eliges al darte de alta; si cambia, se cambia aquí.</p>
    <div class="gs-acc"><button type="button" class="pb-btn primary" id="gs-guardar-datos">Guardar mis datos</button></div>
  </section>`;
}

/* ============ pintar y eventos ============ */
function pintar() {
  if (!D) return;
  const cuerpo = { resumen, facturas, reparto, gastos, datos }[ui.tab] || resumen;
  raiz.innerHTML = cabecera() + `<div class="gs-cuerpo">${cuerpo()}</div>`;
  cuentaFactura(); cuentaGasto();
}

const guardar = async (fn) => { try { await fn(); } catch (e) { toast(e.message, true); } };
raiz.addEventListener('click', (e) => {
  const b = e.target.closest('button, [data-ir]'); if (!b || !D) return;
  const d = b.dataset;
  if (d.tab || d.ir) { ui.tab = d.tab || d.ir; try { sessionStorage.setItem('pb-gs-tab', ui.tab); } catch (x) { /* nada */ } pintar(); return; }
  if (b.id === 'gs-nueva') { ui.form = { fecha: D.hoy > D.ajustes.fecha_alta ? D.hoy : D.ajustes.fecha_alta, irpf_pct: D.ajustes.retencion }; pintar(); return; }
  if ('cerrar' in d) { ui.form = null; pintar(); return; }
  if (b.id === 'gs-mas-linea') { ui.form = leerFactura(); ui.form.lineas.push({ c: '', n: 1, p: 0 }); pintar(); return; }
  if (d.quitar != null) { ui.form = leerFactura(); ui.form.lineas.splice(+d.quitar, 1); pintar(); return; }
  if (b.id === 'gs-guardar-fac') return guardar(async () => {
    const f = leerFactura();
    const j = await post('gestoria_factura_guardar', { ...f, lineas: JSON.stringify(f.lineas.map((l) => ({ c: l.c, n: l.n, p: centInput(l.p) }))), coste: f.coste ? centInput(f.coste) : '' });
    ui.form = null; pintar(); toast(`Factura ${j.numero} guardada`);
  });
  const fac = (id) => D.facturas.find((x) => String(x.id) === String(id));
  if (d.editar) { const f = fac(d.editar); ui.form = { ...f, lineas: f.lineas.map((l) => ({ ...l })) }; pintar(); document.getElementById('gs-ffac').scrollIntoView({ behavior: 'smooth' }); return; }
  if (d.duplicar) { const f = fac(d.duplicar); ui.form = { ...f, id: 0, numero: '', fecha: D.hoy, lineas: f.lineas.map((l) => ({ ...l })) }; pintar(); return; }
  if (d.cobrar) return guardar(async () => { const fecha = prompt('¿Qué día te pagaron? (AAAA-MM-DD)', D.hoy); if (!fecha) return; await post('gestoria_factura_cobrar', { id: d.cobrar, fecha_cobro: fecha }); toast('Cobrada: ya está en la caja y en el reparto'); });
  if (d.descobrar) return guardar(async () => { if (!confirm('¿La marco como no cobrada? Se quitará de la caja.')) return; await post('gestoria_factura_cobrar', { id: d.descobrar, deshacer: '1' }); });
  if (d.anular) return guardar(async () => { if (!confirm('¿Anular esta factura? Se queda con su número, marcada como anulada. Si ya la enviaste, habría que hacer una nueva corregida.')) return; await post('gestoria_factura_anular', { id: d.anular }); toast('Factura anulada'); });
  if (d.borrar) return guardar(async () => { if (!confirm('¿Borrarla del todo? Solo se puede con la última y si no está cobrada.')) return; await post('gestoria_factura_borrar', { id: d.borrar }); toast('Factura borrada'); });
  if (b.id === 'gs-nuevo-gasto') { ui.gasto = { tipo: 'es', fecha: D.hoy }; pintar(); return; }
  if ('cerrarGasto' in d) { ui.gasto = null; pintar(); return; }
  if (d.desdeCaja) { const m = D.caja_pendientes.find((x) => String(x.id) === d.desdeCaja); ui.gasto = { tipo: 'fuera', fecha: m.fecha, proveedor: m.concepto, concepto: m.categoria, base: m.importe, caja_id: m.id }; pintar(); document.getElementById('gs-fgas').scrollIntoView({ behavior: 'smooth' }); return; }
  if (d.editarGasto) { const g = D.gastos.find((x) => String(x.id) === d.editarGasto); ui.gasto = { ...g }; pintar(); document.getElementById('gs-fgas').scrollIntoView({ behavior: 'smooth' }); return; }
  if (d.borrarGasto) return guardar(async () => { if (!confirm('¿Quitar este gasto de la gestoría? En la caja se queda.')) return; await post('gestoria_gasto_borrar', { id: d.borrarGasto }); });
  if (d.pagarCom) { ui.tab = 'gastos'; ui.gasto = { tipo: 'comision', fecha: D.hoy, persona: d.pagarCom, base: +d.imp, deducible: '1' }; pintar(); return; }
  if (b.id === 'gs-guardar-gasto') return guardar(async () => {
    const g = leerGasto();
    await post('gestoria_gasto_guardar', { ...g, base: centInput(g.base) });
    ui.gasto = null; pintar(); toast('Gasto apuntado');
  });
  if (b.id === 'gs-guardar-datos') return guardar(async () => {
    const c = document.getElementById('gs-fdatos'); const campos = {};
    c.querySelectorAll('[name]').forEach((i) => { campos[i.name] = i.value; });
    await post('gestoria_ajustes', campos); toast('Datos guardados');
  });
});
raiz.addEventListener('input', (e) => { if (e.target.closest('#gs-ffac')) cuentaFactura(); if (e.target.closest('#gs-fgas')) cuentaGasto(); });
raiz.addEventListener('change', (e) => {
  if (e.target.closest('#gs-ffac')) cuentaFactura();
  if (e.target.name === 'tipo' && e.target.closest('#gs-fgas')) { ui.gasto = { ...leerGasto(), tipo: e.target.value }; pintar(); }
  else if (e.target.closest('#gs-fgas')) cuentaGasto();
});

async function abrir() {
  if (!raiz.firstChild) raiz.innerHTML = '<div class="ga-cargando"><i></i><i></i><i></i></div>';
  try { await cargar(); if (!ui.form && !ui.gasto) pintar(); else if (!raiz.querySelector('.gs-cab')) pintar(); }
  catch (e) { raiz.innerHTML = `<p class="gs-vacio">No se ha podido abrir la gestoría: ${esc(e.message)}</p>`; }
}
document.addEventListener('pb:page', (e) => { if (e.detail === 'gestoria') abrir(); });
if (document.body.dataset.page === 'gestoria' || window.PB_TAB === 'gestoria') abrir();
})();
