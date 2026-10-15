"""Visor local para revisar listas antes de usarlas: una página HTML con cada empresa y enlaces para comprobar
que los datos son reales (su web, la página exacta del email, la prueba del motivo, llamar y WhatsApp).

Uso: python -m prospeccion.revisar            -> genera scratch/prospeccion/revisar.html con los CSV maestros de hoy
     python -m prospeccion.revisar a.csv b.csv
La página se queda en scratch/ (datos reales: nunca al repo ni publicada).
"""
import csv
import html
import json
import sys
from pathlib import Path

from .motor import HOY, SALIDA


def carga(rutas: list[Path]) -> list[dict]:
    filas = []
    for p in rutas:
        lista = p.stem.split('_', 2)[-1].replace('-', ' ')
        with p.open(encoding='utf-8-sig') as f:
            for r in csv.DictReader(f, delimiter=';'):
                r['lista'] = lista
                filas.append(r)
    return filas


def pagina(filas: list[dict]) -> str:
    datos = json.dumps(filas, ensure_ascii=False).replace('</', '<\\/')
    return '''<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Revisar prospectos</title><style>
:root{--ink:#070911;--panel:#0F1322;--line:rgba(255,255,255,.1);--fg:#EFEDE7;--muted:#9A9CB0;--lime:#B7FF3C;--violet:#7E73FF;--green:#25D366;--amber:#FFB547}
*{box-sizing:border-box}body{margin:0;background:var(--ink);color:var(--fg);font:14px/1.5 system-ui,-apple-system,Segoe UI,sans-serif}
.wrap{max-width:1180px;margin:0 auto;padding:20px 16px 60px}h1{font:400 30px Georgia,serif;margin:0 0 4px}h1 i{color:var(--lime)}
.lead{color:var(--muted);margin:0 0 16px}.bar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;position:sticky;top:0;background:var(--ink);padding:10px 0;z-index:2}
input,select{background:var(--panel);color:var(--fg);border:1px solid var(--line);border-radius:10px;padding:9px 11px;font:inherit}input{flex:1;min-width:200px}
.kpis{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}.k{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:10px 14px}.k b{font:400 24px Georgia,serif;display:block}.k small{color:var(--muted)}
.card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:14px 16px;margin-bottom:8px}
.top{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}.emp{font-weight:700;font-size:15px}.sub{color:var(--muted);font-size:12.5px}
.pill{display:inline-block;font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;border:1px solid var(--line);margin-left:6px;color:var(--muted)}
.pill.alto{color:var(--ink);background:var(--lime);border-color:var(--lime)}.pill.activa{color:var(--green);border-color:var(--green)}.pill.probable{color:var(--amber);border-color:var(--amber)}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:6px 18px;margin-top:10px;font-size:13px}.grid div small{display:block;color:var(--muted);font-size:11px}
a{color:var(--violet)}a:hover{color:var(--lime)}.mot{margin-top:10px;padding:8px 12px;border-radius:10px;background:rgba(126,115,255,.12);font-size:13px}
.notas{margin-top:8px;color:var(--muted);font-size:12px}.vacio{color:var(--muted);text-align:center;padding:30px}
@media(max-width:600px){.grid{grid-template-columns:1fr}}
</style></head><body><div class="wrap">
<h1>Revisar <i>prospectos</i></h1><p class="lead">Generado el ''' + HOY.strftime('%d/%m/%Y') + '''. Pulsa los enlaces para comprobar cada dato en su fuente. Nada de esto está en el panel todavía.</p>
<div class="kpis" id="k"></div>
<div class="bar"><input id="q" placeholder="Buscar empresa, ciudad, email, teléfono…"><select id="l"><option value="">Todas las listas</option></select>
<select id="c"><option value="">Cualquier canal</option><option>whatsapp</option><option>email</option><option>llamada</option></select></div>
<div id="out"></div></div>
<script>
const D=''' + datos + ''';
const $=s=>document.querySelector(s), esc=s=>String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
const tel=t=>t?('+34 '+t.slice(0,3)+' '+t.slice(3,5)+' '+t.slice(5,7)+' '+t.slice(7)):'';
const link=(u,t)=>u?`<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t||u.replace(/^https?:\\/\\//,'').slice(0,48))}</a>`:'—';
[...new Set(D.map(r=>r.lista))].forEach(x=>$('#l').add(new Option(x,x)));
function draw(){const q=$('#q').value.toLowerCase(),l=$('#l').value,c=$('#c').value;
 const R=D.filter(r=>(!l||r.lista===l)&&(!c||r.canales.includes(c))&&(!q||JSON.stringify(r).toLowerCase().includes(q)));
 const n=f=>R.filter(f).length;
 $('#k').innerHTML=[['Empresas',R.length],['Con móvil',n(r=>r.telefono)],['Con email',n(r=>r.email)],['Con fijo',n(r=>r.telefono_fijo)],['Con motivo',n(r=>r.motivo)],['Encaje alto',n(r=>r.encaje==='alto')]].map(([a,b])=>`<div class="k"><b>${b}</b><small>${a}</small></div>`).join('');
 $('#out').innerHTML=R.length?R.map(r=>`<div class="card"><div class="top"><div><span class="emp">${esc(r.empresa)}</span><span class="pill ${esc(r.actividad)}">${esc(r.actividad)}</span><span class="pill ${esc(r.encaje)}">encaje ${esc(r.encaje)}</span>
 <div class="sub">${esc(r.lista)} · ${esc(r.sector)}${r.ciudad?' · '+esc(r.ciudad):''}${r.resenas>0?' · '+esc(r.resenas)+' reseñas ('+esc(r.valoracion)+')':''}</div></div><div class="sub">canales: ${esc(r.canales)}</div></div>
 <div class="grid"><div><small>Web</small>${link(r.web)}</div>
 <div><small>Móvil (WhatsApp)</small>${r.telefono?`<a href="https://wa.me/34${esc(r.telefono)}" target="_blank" rel="noopener">${tel(r.telefono)}</a>`:'—'}</div>
 <div><small>Fijo (llamadas)</small>${r.telefono_fijo?`<a href="tel:+34${esc(r.telefono_fijo)}">${tel(r.telefono_fijo)}</a>`:'—'}</div>
 <div><small>Email (${esc(r.tipo_email||'—')})</small>${r.email?esc(r.email)+(r.origen_email?' · '+link(r.origen_email,'ver dónde aparece'):''):'—'}</div>
 <div><small>Origen del teléfono</small>${esc(r.origen)}</div><div><small>Señales en su web</small>${esc(r.senales)||'—'}</div></div>
 ${r.motivo?`<div class="mot"><b>Motivo:</b> ${esc(r.motivo)} · ${link(r.motivo_fuente,'comprobar')}</div>`:''}
 <div class="notas">${esc(r.notas)}</div></div>`).join(''):'<div class="vacio">Nada con estos filtros.</div>';}
['#q','#l','#c'].forEach(s=>$(s).addEventListener('input',draw));draw();
</script></body></html>'''


def main():
    rutas = [Path(a) for a in sys.argv[1:]] or sorted(p for p in SALIDA.glob(f'{HOY:%Y%m%d}_*.csv')
                                                       if not p.stem.endswith(('_whatsapp', '_email', '_llamadas')))
    filas = carga(rutas)
    out = SALIDA / 'revisar.html'
    out.write_text(pagina(filas), encoding='utf-8')
    print(f'{len(filas)} empresas de {len(rutas)} listas → {out}')


if __name__ == '__main__':
    main()
