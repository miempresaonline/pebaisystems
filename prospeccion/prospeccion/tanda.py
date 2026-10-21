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
        'email_nicho': 'energia',   # las válidas sin móvil y con email van a email_prospectos con este nicho
    },
    # Segunda pasada solar (orden de Daniel, 19/10): otras formas de buscar y más municipios, hasta 200 en la lista de email
    'solar2': {
        'sector': 'Empresas de placas solares',
        'lote': 'Solar',
        'busquedas': ['instalador fotovoltaico', 'autoconsumo solar', 'paneles solares instalación', 'energía solar empresa instaladora',
                      'placas solares'],
        'palabras': 'placas solares fotovoltaica autoconsumo paneles solar renovables energía',
        'reglas': {'requiere_hace': True, 'sin_autonomos': True, 'dedicacion': True, 'solo_activas': True, 'solo_solar': True},
        'email_nicho': 'energia',
        'max_pueblos': 40,
        'objetivo_email': 200,       # se para (y deja PAUSA) cuando email_prospectos «energia» llega a este número
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

# Barrido continuo de instaladoras solares (orden de Daniel, 21/10): el scraper no se queda dormido. Cada vuelta recorre
# toda España con otro grupo de búsquedas; al acabar empieza la siguiente (y al agotar los grupos, vuelven a rotar y solo
# salen las nuevas: las que ya están en el panel se excluyen). Mismos filtros: solo instaladoras de placas solares, y la IA
# lee la web de cada una antes de que entre en el panel.
GRUPOS_SOLAR = [
    ['instaladora fotovoltaica', 'instalación de placas solares', 'autoconsumo fotovoltaico empresa'],
    ['instaladores de paneles solares', 'placas solares para viviendas', 'placas solares para empresas'],
    ['energía solar instaladores', 'fotovoltaica instalación', 'autoconsumo solar instaladora'],
    ['empresa fotovoltaica', 'instalador solar', 'placas solares y baterías instalación'],
    ['instalaciones fotovoltaicas', 'empresa de energía solar', 'paneles fotovoltaicos instalación'],
]
FALLOS_MAX = 3   # una provincia que falla 3 veces en una vuelta se salta para no atascar el barrido


def _carpeta(nicho: str) -> Path:
    return SALIDA / 'tandas' / nicho


def _hecha(nicho: str, prov: str) -> bool:
    return (_carpeta(nicho) / f'{nicho}_{prov.lower().replace(" ", "-")}.csv').exists()


def _fallos(nicho: str) -> dict:
    import json
    f = _carpeta(nicho) / 'fallos.json'
    return json.loads(f.read_text(encoding='utf-8')) if f.exists() else {}


def pendientes_de(nicho: str, lista: list) -> list:
    fallos = _fallos(nicho)
    return [p for p in lista if not _hecha(nicho, p) and fallos.get(p, 0) < FALLOS_MAX]


def pasada_solar() -> str:
    """La vuelta del barrido continuo que toca: la primera que tenga provincias pendientes. La registra en NICHOS."""
    n = 1
    while True:
        nombre = f'solar_v{n}'
        NICHOS[nombre] = dict(NICHOS['solar2'], busquedas=GRUPOS_SOLAR[(n - 1) % len(GRUPOS_SOLAR)], tramo=max(0, n - 1))
        NICHOS[nombre].pop('objetivo_email', None)
        if pendientes_de(nombre, ORDEN):
            return nombre
        n += 1


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


PUEBLOS_POR_TRAMO = 60


CELDA_KM = 8   # separación de la cuadrícula que cubre todo el territorio
_PUNTOS = {}


def _km(a_la, a_lo, b_la, b_lo) -> float:
    return math.hypot((a_la - b_la) * 111, (a_lo - b_lo) * 111 * math.cos(math.radians(a_la)))


def puntos_cobertura(provincia: str) -> list:
    """Todo lo que queda por recorrer de una provincia después de sus ciudades (orden de Daniel, 21/10: «hasta que España se
    quede sin instaladoras»): 1) los núcleos de 1.000 a 5.000 habitantes que no estén a menos de 4 km de las ciudades ya vistas
    (GeoNames); 2) una cuadrícula cada 8 km por todo su territorio (polígonos, campo, pueblos pequeños), sin los puntos que ya
    caen junto a un núcleo. Un punto es de la provincia si el núcleo más cercano de toda España es suyo y está a menos de 20 km."""
    if provincia in _PUNTOS:
        return _PUNTOS[provincia]
    import json
    base_t = json.loads((Path(__file__).with_name('municipios_es.json')).read_text(encoding='utf-8'))['provincias']
    mil_t = json.loads((Path(__file__).with_name('municipios_es_1000.json')).read_text(encoding='utf-8'))['provincias']
    base = base_t.get(provincia) or []
    mil = mil_t.get(provincia) or []
    pueblos = [(la, lo) for _, la, lo, _ in mil if not any(_km(la, lo, b[1], b[2]) < 4 for b in base)]
    propios = [(m[1], m[2]) for m in base + mil]
    if not propios:
        _PUNTOS[provincia] = pueblos
        return pueblos
    todos = [(m[1], m[2], prov) for prov, lista in list(base_t.items()) + list(mil_t.items()) for m in lista]
    las = [x[0] for x in propios]; los = [x[1] for x in propios]
    dla = CELDA_KM / 111
    rejilla = []
    la = min(las) - 0.15
    while la <= max(las) + 0.15:
        dlo = CELDA_KM / (111 * math.cos(math.radians(la)))
        lo = min(los) - 0.2
        while lo <= max(los) + 0.2:
            cerca = min(todos, key=lambda t: _km(la, lo, t[0], t[1]))
            if cerca[2] == provincia and _km(la, lo, cerca[0], cerca[1]) < 20 and not any(_km(la, lo, a, b) < 5 for a, b in propios):
                rejilla.append((round(la, 5), round(lo, 5)))
            lo += dlo
        la += dla
    _PUNTOS[provincia] = pueblos + rejilla
    return _PUNTOS[provincia]


def pueblos_pequenos(provincia: str, tramo: int) -> list:
    """Los puntos de este tramo (60 por vuelta). Al acabar todos, vuelve a empezar con otras búsquedas."""
    pts = puntos_cobertura(provincia)
    if not pts:
        return []
    bloques = math.ceil(len(pts) / PUEBLOS_POR_TRAMO)
    i = (tramo - 1) % bloques
    return pts[i * PUEBLOS_POR_TRAMO:(i + 1) * PUEBLOS_POR_TRAMO]


def apunta_cobertura(provincia: str, tramo: int) -> None:
    """Cuánto de cada provincia se ha recorrido ya (lo lee el panel para el % de España)."""
    import json
    f = SALIDA / 'tandas' / 'cobertura.json'
    cob = json.loads(f.read_text(encoding='utf-8')) if f.exists() else {}
    total = max(1, math.ceil(len(puntos_cobertura(provincia)) / PUEBLOS_POR_TRAMO))
    antes = cob.get(provincia, {}).get('hecho', 0)
    cob[provincia] = {'hecho': min(total, max(antes, tramo)), 'total': total, 'vueltas': max(cob.get(provincia, {}).get('vueltas', 0), (tramo - 1) // total)}
    f.parent.mkdir(parents=True, exist_ok=True)
    f.write_text(json.dumps(cob, ensure_ascii=False), encoding='utf-8')


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
        cap, pueblos = zonas(prov, cfg.get('max_pueblos', 30))
        if cfg.get('tramo'):
            # Vuelta de pueblos: la capital y las ciudades ya están vistas; solo los pueblos nuevos de este tramo
            extra = pueblos_pequenos(prov, cfg['tramo'])
            if extra:
                cap, pueblos = [], extra
                print(f'  vuelta de pueblos y territorio: {len(extra)} puntos (tramo {cfg["tramo"]} de {math.ceil(len(puntos_cobertura(prov)) / PUEBLOS_POR_TRAMO)})')
        print(f'  capital en 9 zonas + {len(pueblos)} municipios')
        cands = google_maps(cfg['busquedas'], prov, cfg['sector'], puntos=cap, paso_km=3.0, zoom=14) if cap else []
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
    if cfg.get('tramo'):
        apunta_cobertura(prov, cfg['tramo'])
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
    # Solo llega al panel lo válido: además de los filtros, la IA lee la web de cada una y solo entran las que encajan
    # (orden del CEO, 20/10). Las que no, al log local; las que dan error, se reintentan en la siguiente tirada.
    from .ia import filtra
    wa, n = filtra(csv_whatsapp, 'whatsapp')
    r = subprocess.run(['/usr/bin/php', str(script), str(wa), lote], capture_output=True, text=True, timeout=300)
    print('  importadas en el panel:', (r.stdout or r.stderr).strip()[:200])
    apunta(f'{lote}: importadas en el panel', f'La IA leyó su web: {n["encajan"]} encajan, {n["no_encajan"]} no, {n["error"]} para reintentar. '
           'Las que encajan entran en la cola del agente de WhatsApp con su mensaje. ' + (r.stdout or r.stderr).strip()[:400], csv_whatsapp.stem)
    solo_email = csv_whatsapp.with_name(csv_whatsapp.name.replace('_whatsapp.csv', '_solo_email.csv'))
    if cfg.get('email_nicho') and solo_email.exists():
        em, n = filtra(solo_email, 'email')
        r = subprocess.run(['/usr/bin/php', str(script), str(em), lote + ' (email)', 'email', cfg['email_nicho']],
                           capture_output=True, text=True, timeout=300)
        print('  sin móvil, a la lista de email:', (r.stdout or r.stderr).strip()[:200])
        apunta(f'{lote}: sin móvil, a la lista de email', f'La IA leyó su web: {n["encajan"]} encajan, {n["no_encajan"]} no, {n["error"]} para reintentar. '
               'Las que encajan entran con su asunto y cuerpo. ' + (r.stdout or r.stderr).strip()[:400], solo_email.stem)


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


def cuenta_email(nicho: str) -> int:
    """Empresas pendientes en la lista de email de ese nicho (solo en el servidor; en el PC devuelve 0)."""
    import subprocess
    db = Path.home() / 'domains' / 'pebaisystems.es' / 'private' / 'leads.sqlite'
    if not db.exists():
        return 0
    r = subprocess.run(['sqlite3', str(db), f"SELECT COUNT(*) FROM email_prospectos WHERE nicho = '{nicho}' AND estado = 'pendiente';"],
                       capture_output=True, text=True, timeout=60)
    return int((r.stdout or '0').strip() or 0)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('nicho', choices=[*NICHOS, 'solar'])
    ap.add_argument('--provincias', nargs='*')
    ap.add_argument('--unir', action='store_true')
    a = ap.parse_args()
    if a.nicho == 'solar':
        a.nicho = pasada_solar()
        print(f'Barrido continuo de instaladoras solares: vuelta {a.nicho} · búsquedas: {", ".join(NICHOS[a.nicho]["busquedas"])}')
        # Para el % de España del panel: todas las provincias con su total, aunque aún no se hayan tocado
        import json
        fc = SALIDA / 'tandas' / 'cobertura.json'
        cob = json.loads(fc.read_text(encoding='utf-8')) if fc.exists() else {}
        for p in ORDEN:
            cob.setdefault(p, {'hecho': 0, 'total': max(1, math.ceil(len(puntos_cobertura(p)) / PUEBLOS_POR_TRAMO)), 'vueltas': 0})
        fc.parent.mkdir(parents=True, exist_ok=True)
        fc.write_text(json.dumps(cob, ensure_ascii=False), encoding='utf-8')
    if not a.unir:
        lista = a.provincias or ORDEN
        hechas = 0
        carpeta = SALIDA / 'tandas' / a.nicho
        pendientes = pendientes_de(a.nicho, lista)
        for p in lista:
            if p in pendientes:
                # Aviso al empezar: el panel (Oficina) muestra al scraper «trabajando» mientras lo último empiece por «Buscando»
                apunta(f'Buscando {NICHOS[a.nicho]["sector"].lower()} en {p} ({pendientes.index(p) + 1} de {len(pendientes)})',
                       'Tirada en curso en el servidor: Google Maps por zonas y municipios, y después la web de cada empresa.', f'{a.nicho}_{p}', tipo='espera')
            try:
                provincia(a.nicho, p)
                hechas += 1
                objetivo = NICHOS[a.nicho].get('objetivo_email')
                if objetivo and p in pendientes:
                    n = cuenta_email(NICHOS[a.nicho]['email_nicho'])
                    print(f'  lista de email «{NICHOS[a.nicho]["email_nicho"]}»: {n} de {objetivo}')
                    if n >= objetivo:
                        (Path.home() / 'prospeccion' / 'PAUSA').touch()   # objetivo cumplido: queda en pausa hasta nueva orden
                        apunta(f'Parado: objetivo cumplido ({n} empresas en la lista de email)',
                               f'La tanda {a.nicho} se para al llegar a {objetivo} en email_prospectos «{NICHOS[a.nicho]["email_nicho"]}».', f'{a.nicho}_fin', tipo='espera')
                        break
            except Exception as e:   # una provincia que falla no para la tanda; queda apuntado y se reintenta en la siguiente
                print(f'  ⚠ {p} falló: {type(e).__name__}: {e}')
                apunta(f'Tanda {a.nicho}: {p} falló', f'{type(e).__name__}: {e}', f'{a.nicho}_{p}', tipo='error')
                import json
                fallos = _fallos(a.nicho)
                fallos[p] = fallos.get(p, 0) + 1
                carpeta.mkdir(parents=True, exist_ok=True)
                (carpeta / 'fallos.json').write_text(json.dumps(fallos, ensure_ascii=False), encoding='utf-8')
        print(f'\n{hechas} de {len(lista)} provincias procesadas')
    unir(a.nicho)


if __name__ == '__main__':
    main()
