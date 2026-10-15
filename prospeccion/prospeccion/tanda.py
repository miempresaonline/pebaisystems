"""Tanda de un nicho por toda España, provincia a provincia. Reanudable: si se corta, sigue por donde iba.

Cada provincia: la capital en detalle (9 zonas de 3 km) + sus municipios con más población (OpenStreetMap).
Solo se queda con las empresas cuyo código postal es de esa provincia (las de la frontera no salen dos veces).

Uso:
  python -m prospeccion.tanda energia                 # todas las provincias pendientes
  python -m prospeccion.tanda energia --provincias Valencia Soria
  python -m prospeccion.tanda energia --unir          # solo junta las provincias hechas en un CSV
"""
import argparse
import math
import csv
import time
from pathlib import Path

from .fuentes import PROVINCIAS_CP, geocodifica, google_maps, rejilla
from .motor import COLS, HOY, SALIDA, apunta, enriquece, guarda, raices

NICHOS = {
    # Decisión de Daniel (15/10/2026): EMPRESAS DE PLACAS SOLARES (baterías y aerotermia como complemento)
    'energia': {
        'sector': 'Empresas de placas solares',
        'lote': 'Solar',
        'busquedas': ['empresa de placas solares', 'instalador de placas solares', 'instalación fotovoltaica autoconsumo',
                      'energía solar fotovoltaica empresa'],
        'palabras': 'placas solares fotovoltaica autoconsumo paneles solar renovables energía',
        'reglas': {'requiere_hace': True, 'sin_autonomos': True, 'dedicacion': True, 'solo_activas': True, 'solo_solar': True},
    },
    # Nicho B por email: operadores locales de internet (fibra/radio) de pueblos y comarcas
    'fibra': {
        'sector': 'Operador local de telecomunicaciones',
        'nicho_email': 'fibra',
        'busquedas': ['proveedor de servicios de internet', 'fibra óptica internet operador', 'operador de telecomunicaciones local',
                      'internet rural wifi'],
        'palabras': 'fibra óptica internet operador telecomunicaciones banda ancha wifi telefonía conectividad',
    },
}

# Nombre para buscar la provincia en OpenStreetMap cuando el oficial no basta
_OSM = {'Illes Balears': 'Illes Balears', 'Las Palmas': 'Provincia de Las Palmas', 'Santa Cruz de Tenerife': 'Provincia de Santa Cruz de Tenerife',
        'Madrid': 'Comunidad de Madrid', 'Asturias': 'Asturias', 'Cantabria': 'Cantabria', 'La Rioja': 'La Rioja', 'Navarra': 'Navarra',
        'Murcia': 'Región de Murcia', 'Ceuta': 'Ceuta', 'Melilla': 'Melilla'}
CAPITALES = {'Álava': 'Vitoria-Gasteiz', 'Gipuzkoa': 'Donostia', 'Bizkaia': 'Bilbao', 'Illes Balears': 'Palma', 'Las Palmas': 'Las Palmas de Gran Canaria',
             'Santa Cruz de Tenerife': 'Santa Cruz de Tenerife', 'Asturias': 'Oviedo', 'Cantabria': 'Santander', 'La Rioja': 'Logroño',
             'Navarra': 'Pamplona', 'A Coruña': 'A Coruña'}


# Código ISO 3166-2 de cada provincia (y el de su comunidad cuando es uniprovincial) para pedir sus municipios a OpenStreetMap
ISO = {'Álava': ['ES-VI'], 'Albacete': ['ES-AB'], 'Alicante': ['ES-A'], 'Almería': ['ES-AL'], 'Ávila': ['ES-AV'], 'Badajoz': ['ES-BA'],
       'Illes Balears': ['ES-PM', 'ES-IB'], 'Barcelona': ['ES-B'], 'Burgos': ['ES-BU'], 'Cáceres': ['ES-CC'], 'Cádiz': ['ES-CA'],
       'Castellón': ['ES-CS'], 'Ciudad Real': ['ES-CR'], 'Córdoba': ['ES-CO'], 'A Coruña': ['ES-C'], 'Cuenca': ['ES-CU'], 'Girona': ['ES-GI'],
       'Granada': ['ES-GR'], 'Guadalajara': ['ES-GU'], 'Gipuzkoa': ['ES-SS'], 'Huelva': ['ES-H'], 'Huesca': ['ES-HU'], 'Jaén': ['ES-J'],
       'León': ['ES-LE'], 'Lleida': ['ES-L'], 'La Rioja': ['ES-LO', 'ES-RI'], 'Lugo': ['ES-LU'], 'Madrid': ['ES-M', 'ES-MD'], 'Málaga': ['ES-MA'],
       'Murcia': ['ES-MU', 'ES-MC'], 'Navarra': ['ES-NA', 'ES-NC'], 'Ourense': ['ES-OR'], 'Asturias': ['ES-O', 'ES-AS'], 'Palencia': ['ES-P'],
       'Las Palmas': ['ES-GC'], 'Pontevedra': ['ES-PO'], 'Salamanca': ['ES-SA'], 'Santa Cruz de Tenerife': ['ES-TF'], 'Cantabria': ['ES-S', 'ES-CB'],
       'Segovia': ['ES-SG'], 'Sevilla': ['ES-SE'], 'Soria': ['ES-SO'], 'Tarragona': ['ES-T'], 'Teruel': ['ES-TE'], 'Toledo': ['ES-TO'],
       'Valencia': ['ES-V'], 'Valladolid': ['ES-VA'], 'Bizkaia': ['ES-BI'], 'Zamora': ['ES-ZA'], 'Zaragoza': ['ES-Z'], 'Ceuta': ['ES-CE'], 'Melilla': ['ES-ML']}


def _overpass(q: str) -> list | None:
    """Overpass es gratis pero sus servidores se saturan: prueba varios por turnos (2 vueltas). None si ninguno responde."""
    import httpx
    servidores = ['https://maps.mail.ru/osm/tools/overpass/api/interpreter', 'https://overpass-api.de/api/interpreter',
                  'https://overpass.kumi.systems/api/interpreter', 'https://overpass.private.coffee/api/interpreter']
    for vuelta in range(2):
        for url in servidores:
            try:
                r = httpx.post(url, data={'data': q}, timeout=90, headers={'User-Agent': 'PEBAI-prospeccion/1.0 (+https://pebaisystems.es)'})
                if r.status_code == 200:
                    return r.json().get('elements', [])
            except Exception:
                pass
            time.sleep(3)
        time.sleep(30)
    return None


# De más a menos población: si la tanda se corta, lo útil ya está hecho
ORDEN = ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Alicante', 'Málaga', 'Murcia', 'Cádiz', 'Illes Balears', 'Bizkaia', 'A Coruña',
         'Las Palmas', 'Asturias', 'Santa Cruz de Tenerife', 'Zaragoza', 'Pontevedra', 'Granada', 'Tarragona', 'Córdoba', 'Girona', 'Gipuzkoa',
         'Toledo', 'Almería', 'Badajoz', 'Jaén', 'Navarra', 'Castellón', 'Cantabria', 'Valladolid', 'Ciudad Real', 'Huelva', 'León', 'Lleida',
         'Cáceres', 'Albacete', 'Burgos', 'Salamanca', 'Lugo', 'Ourense', 'La Rioja', 'Álava', 'Guadalajara', 'Huesca', 'Cuenca', 'Zamora',
         'Palencia', 'Ávila', 'Segovia', 'Teruel', 'Soria', 'Ceuta', 'Melilla']


def zonas(provincia: str, max_pueblos: int = 30) -> tuple[list, list]:
    """Dónde buscar: la ciudad más grande de la provincia en detalle (cuadrícula de 3×3 zonas de 3 km alrededor de su
    centro) y los siguientes municipios por población (≥ 5.000 hab.). Tabla fija sacada de GeoNames (municipios_es.json):
    OpenStreetMap fallaba según la provincia (Málaga devolvía 0 municipios) y la caja de Nominatim descentraba la capital."""
    import json
    tabla = json.loads((Path(__file__).with_name('municipios_es.json')).read_text(encoding='utf-8'))['provincias']
    munis = tabla.get(provincia) or []
    if not munis:
        lat, lon, _ = geocodifica(provincia)
        munis = [[provincia, lat, lon, 0]]
    _, clat, clon, _ = munis[0]
    dlat, dlon = 3 / 111, 3 / (111 * math.cos(math.radians(clat)))
    cap = [(round(clat + i * dlat, 5), round(clon + j * dlon, 5)) for i in (0, -1, 1) for j in (0, -1, 1)]
    cerca = lambda la, lo: math.hypot((la - clat) * 111, (lo - clon) * 111 * math.cos(math.radians(clat))) < 6
    pueblos = [(la, lo) for _, la, lo, _ in munis[1:] if not cerca(la, lo)][:max_pueblos]
    print(f'  zonas: {munis[0][0]} (9) + {len(pueblos)} municipios')
    return cap, pueblos


def provincia(nicho: str, prov: str) -> Path | None:
    cfg = NICHOS[nicho]
    nombre = f'{nicho}_{prov.lower().replace(" ", "-")}'
    destino = SALIDA / 'tandas' / nicho
    hecho = destino / f'{nombre}.csv'
    if hecho.exists():
        print(f'· {prov}: ya hecha, se salta')
        return hecho
    t0 = time.time()
    print(f'\n=== {prov} ===')
    import json
    bruto = destino / 'maps' / f'{nombre}.json'
    if bruto.exists():   # Maps ya se recorrió para esta provincia (tanda cortada): no se vuelve a pedir a Google
        cands = json.loads(bruto.read_text(encoding='utf-8'))
        print(f'  {len(cands)} resultados de Maps guardados de antes')
    else:
        cap, pueblos = zonas(prov)
        print(f'  capital en 9 zonas + {len(pueblos)} municipios')
        cands = google_maps(cfg['busquedas'], prov, cfg['sector'], puntos=cap, paso_km=3.0, zoom=14)
        vistos = {c['empresa'] + c['telefono'] for c in cands}
        for c in google_maps(cfg['busquedas'], prov, cfg['sector'], puntos=pueblos, paso_km=6.0, zoom=14):
            if c['empresa'] + c['telefono'] not in vistos:
                cands.append(c)
        bruto.parent.mkdir(parents=True, exist_ok=True)
        bruto.write_text(json.dumps(cands, ensure_ascii=False), encoding='utf-8')
    fuera = [c for c in cands if c.get('provincia') and c['provincia'] != prov]
    cands = [c for c in cands if not c.get('provincia') or c['provincia'] == prov]
    for c in cands:
        c['provincia'], c['lote'] = prov, f'{cfg["sector"]} · {prov}'
        if cfg.get('nicho_email'):
            c['nicho_email'] = cfg['nicho_email']
        c['reglas'] = cfg.get('reglas', {})
    print(f'  {len(cands)} candidatos de {prov} ({len(fuera)} de otras provincias, se buscan en la suya)')
    destino.mkdir(parents=True, exist_ok=True)
    import prospeccion.motor as m
    antes = m.SALIDA
    m.SALIDA = destino   # guarda() escribe en la carpeta de la tanda
    try:
        guarda(nombre, enriquece(cands, raices(cfg['sector'] + ' ' + cfg['palabras'])), 100000)
    finally:
        m.SALIDA = antes
    importar_panel(destino / f'{nombre}_whatsapp.csv', f'{cfg.get("lote", cfg["sector"])} · {prov}', cfg)
    print(f'  {prov} hecha en {(time.time() - t0) / 60:.0f} min')
    return hecho


def importar_panel(csv_whatsapp: Path, lote: str, cfg: dict) -> None:
    """En el servidor: las empresas con móvil que pasan todos los filtros entran solas en la cola del agente de WhatsApp.
    En el PC no hace nada (no hay panel local): se importan después."""
    import os
    import subprocess
    if 'nicho_email' in cfg or not csv_whatsapp.exists():
        return   # el nicho B va por email: lo importa el chat de Email
    script = Path(__file__).resolve().parent.parent / 'importar_panel.php'
    if not (Path.home() / 'domains' / 'pebaisystems.es').exists() or not script.exists():
        return
    r = subprocess.run(['/usr/bin/php', str(script), str(csv_whatsapp), lote], capture_output=True, text=True, timeout=300)
    print('  importadas en el panel:', (r.stdout or r.stderr).strip()[:200])
    apunta(f'{lote}: importadas en el panel', 'Entran en la cola del agente de WhatsApp. ' + (r.stdout or r.stderr).strip()[:500], csv_whatsapp.stem)


def unir(nicho: str) -> None:
    carpeta = SALIDA / 'tandas' / nicho
    filas = []
    for p in sorted(carpeta.glob(f'{nicho}_*.csv')):
        if p.stem.endswith(('_whatsapp', '_email', '_llamadas')) or p.stem.startswith(f'{nicho}_TODO'):
            continue
        with p.open(encoding='utf-8-sig') as f:
            filas += list(csv.DictReader(f, delimiter=';'))
    if not filas:
        print('Nada que unir todavía')
        return
    vistos, unicas = set(), []
    for r in filas:   # una empresa que aparece en dos provincias, una sola vez
        k = r['telefono'] or r['telefono_fijo'] or r['email'] or r['web']
        if k in vistos:
            continue
        vistos.add(k)
        unicas.append(r)
    for suf, filtro in (('', lambda r: True), ('_whatsapp', lambda r: r['telefono']), ('_email', lambda r: r['email']),
                        ('_llamadas', lambda r: r['telefono_fijo'] and not r['telefono'])):
        with (carpeta / f'{nicho}_TODO{suf}.csv').open('w', encoding='utf-8-sig', newline='') as f:
            wr = csv.DictWriter(f, COLS, delimiter=';', extrasaction='ignore')
            wr.writeheader()
            wr.writerows([r for r in unicas if filtro(r)])
    por = {}
    for r in unicas:
        por.setdefault(r['provincia'], [0, 0])
        por[r['provincia']][0] += 1
        por[r['provincia']][1] += bool(r['telefono'])
    print(f'\nTOTAL {nicho}: {len(unicas)} empresas · {sum(1 for r in unicas if r["telefono"])} con móvil · '
          f'{sum(1 for r in unicas if r["email"])} con email · {sum(1 for r in unicas if r["telefono_fijo"])} con fijo')
    for p, (t, mv) in sorted(por.items(), key=lambda x: -x[1][0]):
        print(f'  {p}: {t} ({mv} con móvil)')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('nicho', choices=NICHOS)
    ap.add_argument('--provincias', nargs='*')
    ap.add_argument('--unir', action='store_true')
    a = ap.parse_args()
    if not a.unir:
        lista = a.provincias or ORDEN
        hechas = 0
        for p in lista:
            try:
                provincia(a.nicho, p)
                hechas += 1
            except Exception as e:   # una provincia que falla no para la tanda; queda apuntado y se reintenta en la siguiente
                print(f'  ⚠ {p} falló: {type(e).__name__}: {e}')
                apunta(f'Tanda {a.nicho}: {p} falló', f'{type(e).__name__}: {e}', f'{a.nicho}_{p}', tipo='error')
        print(f'\n{hechas} de {len(lista)} provincias procesadas')
    unir(a.nicho)


if __name__ == '__main__':
    main()
