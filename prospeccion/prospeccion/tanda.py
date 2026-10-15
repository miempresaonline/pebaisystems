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
    'energia': {
        'sector': 'Instaladores energía',
        'busquedas': ['instalador de placas solares', 'instalación fotovoltaica autoconsumo', 'aerotermia instalador',
                      'empresa de climatización y aerotermia', 'electricista instalador placas solares'],
        'palabras': 'placas solares fotovoltaica autoconsumo paneles solar aerotermia bomba calor climatización renovables energía',
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
    """Dónde buscar: la capital en detalle (9 zonas de 3 km) y los municipios con más población DENTRO del límite de la provincia
    (OpenStreetMap, gratis). Una rejilla por toda la provincia caía en campo y monte y devolvía 0."""
    import json
    cache = SALIDA / 'tandas' / 'municipios' / f'{provincia}.json'
    if cache.exists():   # ya se pidieron: no se vuelve a molestar a OpenStreetMap
        d = json.loads(cache.read_text(encoding='utf-8'))
        return [tuple(p) for p in d['capital']], [tuple(p) for p in d['pueblos']]
    capital = CAPITALES.get(provincia, provincia)
    _, _, caja_cap = geocodifica(f'{capital}, {provincia}')
    filtro = '(node["place"~"^(city|town)$"](area.a);node["place"="village"]["population"](area.a););out body;'
    pueblos = None
    for code in ISO.get(provincia, []):
        pueblos = _overpass(f'[out:json][timeout:120];area["ISO3166-2"="{code}"]->.a;' + filtro)
        if pueblos:
            break
    if not pueblos:   # último recurso: la caja de la provincia (puede traer municipios vecinos; luego se filtran por código postal)
        _, _, (s, n, w, e) = geocodifica(_OSM.get(provincia, f'Provincia de {provincia}'))
        pueblos = _overpass(f'[out:json][timeout:120];(node["place"~"^(city|town)$"]({s},{w},{n},{e});'
                            f'node["place"="village"]["population"]({s},{w},{n},{e}););out body;') or []
    pob = lambda x: int(''.join(ch for ch in (x.get('tags', {}).get('population') or '0') if ch.isdigit()) or 0)
    pueblos = [x for x in sorted(pueblos, key=pob, reverse=True) if 'lat' in x and (pob(x) >= 2500 or x['tags'].get('place') in ('city', 'town'))]
    s_, n_, w_, e_ = caja_cap
    # Los municipios dentro de la capital ya los cubren sus 9 zonas
    clat0, clon0 = (s_ + n_) / 2, (w_ + e_) / 2
    cerca = lambda x: math.hypot((x['lat'] - clat0) * 111, (x['lon'] - clon0) * 111 * math.cos(math.radians(clat0))) < 6
    pts = [(x['lat'], x['lon']) for x in pueblos if not cerca(x)][:max_pueblos]
    # Capital: cuadrícula fija de 3×3 zonas de 3 km alrededor de su centro (la caja de OpenStreetMap a veces es un punto)
    clat, clon = (s_ + n_) / 2, (w_ + e_) / 2
    dlat, dlon = 3 / 111, 3 / (111 * math.cos(math.radians(clat)))
    cap = [(round(clat + i * dlat, 5), round(clon + j * dlon, 5)) for i in (0, -1, 1) for j in (0, -1, 1)]
    if pts:
        cache.parent.mkdir(parents=True, exist_ok=True)
        cache.write_text(json.dumps({'capital': cap, 'pueblos': pts}), encoding='utf-8')
    print(f'  municipios: {len(pts)} (OpenStreetMap)' if pts else '  ⚠ OpenStreetMap no respondió: solo la capital')
    return cap, pts


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
    cap, pueblos = zonas(prov)
    print(f'  capital en 9 zonas + {len(pueblos)} municipios')
    cands = google_maps(cfg['busquedas'], prov, cfg['sector'], puntos=cap, paso_km=3.0, zoom=14)
    vistos = {c['empresa'] + c['telefono'] for c in cands}
    for c in google_maps(cfg['busquedas'], prov, cfg['sector'], puntos=pueblos, paso_km=6.0, zoom=14):
        if c['empresa'] + c['telefono'] not in vistos:
            cands.append(c)
    fuera = [c for c in cands if c.get('provincia') and c['provincia'] != prov]
    cands = [c for c in cands if not c.get('provincia') or c['provincia'] == prov]
    for c in cands:
        c['provincia'], c['lote'] = prov, f'Energía · {prov}'
    print(f'  {len(cands)} candidatos de {prov} ({len(fuera)} de otras provincias, se buscan en la suya)')
    destino.mkdir(parents=True, exist_ok=True)
    import prospeccion.motor as m
    antes = m.SALIDA
    m.SALIDA = destino   # guarda() escribe en la carpeta de la tanda
    try:
        guarda(nombre, enriquece(cands, raices(cfg['sector'] + ' ' + cfg['palabras'])), 100000)
    finally:
        m.SALIDA = antes
    print(f'  {prov} hecha en {(time.time() - t0) / 60:.0f} min')
    return hecho


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
