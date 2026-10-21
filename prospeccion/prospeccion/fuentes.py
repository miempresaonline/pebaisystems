"""Fuentes de empresas. Cada una devuelve candidatos con el mismo formato:
{empresa, web, telefono, sector, ciudad, direccion, resenas, valoracion, fuente, origen_dato, extra}
"""
import json
import math
import os
import re
import subprocess
import tempfile
import time
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

import httpx
from selectolax.parser import HTMLParser

from .contacto import normaliza_tel
from .web import UA, dominio

GMAPS = Path(__file__).resolve().parent.parent / 'bin' / ('gmaps.exe' if os.name == 'nt' else 'gmaps')


# Provincia por los dos primeros dígitos del código postal (INE)
PROVINCIAS_CP = {'01': 'Álava', '02': 'Albacete', '03': 'Alicante', '04': 'Almería', '05': 'Ávila', '06': 'Badajoz', '07': 'Illes Balears',
    '08': 'Barcelona', '09': 'Burgos', '10': 'Cáceres', '11': 'Cádiz', '12': 'Castellón', '13': 'Ciudad Real', '14': 'Córdoba', '15': 'A Coruña',
    '16': 'Cuenca', '17': 'Girona', '18': 'Granada', '19': 'Guadalajara', '20': 'Gipuzkoa', '21': 'Huelva', '22': 'Huesca', '23': 'Jaén',
    '24': 'León', '25': 'Lleida', '26': 'La Rioja', '27': 'Lugo', '28': 'Madrid', '29': 'Málaga', '30': 'Murcia', '31': 'Navarra', '32': 'Ourense',
    '33': 'Asturias', '34': 'Palencia', '35': 'Las Palmas', '36': 'Pontevedra', '37': 'Salamanca', '38': 'Santa Cruz de Tenerife', '39': 'Cantabria',
    '40': 'Segovia', '41': 'Sevilla', '42': 'Soria', '43': 'Tarragona', '44': 'Teruel', '45': 'Toledo', '46': 'Valencia', '47': 'Valladolid',
    '48': 'Bizkaia', '49': 'Zamora', '50': 'Zaragoza', '51': 'Ceuta', '52': 'Melilla'}


def ciudad_provincia(direccion: str) -> tuple[str, str]:
    """«Carrer de Colón, 21, 46004 València, Valencia» → ('València', 'Valencia')."""
    m = re.search(r'\b(\d{5})\s+([^,]+)', direccion or '')
    if not m:
        return '', ''
    return m.group(2).strip(), PROVINCIAS_CP.get(m.group(1)[:2], '')

def geocodifica(lugar: str) -> tuple[float, float, list[float]]:
    """Centro y caja de una ciudad o provincia con OpenStreetMap (Nominatim: gratis, 1 petición/s)."""
    r = httpx.get('https://nominatim.openstreetmap.org/search', params={'q': lugar + ', España', 'format': 'json', 'limit': 1},
                  headers={'User-Agent': UA}, timeout=20)
    d = r.json()[0]
    s, n, w, e = map(float, d['boundingbox'])
    time.sleep(1.1)
    return float(d['lat']), float(d['lon']), [s, n, w, e]


def rejilla(caja: list[float], paso_km: float, max_puntos: int) -> list[tuple[float, float]]:
    """Puntos repartidos por la ciudad: Maps solo da ~20 resultados por punto, así que se barre por zonas."""
    s, n, w, e = caja
    dlat = paso_km / 111.0
    dlon = paso_km / (111.0 * math.cos(math.radians((s + n) / 2)))
    pts = [(round(s + dlat * (i + .5), 5), round(w + dlon * (j + .5), 5))
           for i in range(max(1, int((n - s) / dlat))) for j in range(max(1, int((e - w) / dlon)))]
    # Del centro hacia fuera: si se corta por el máximo, se queda la zona con más negocios
    clat, clon = (s + n) / 2, (w + e) / 2
    pts.sort(key=lambda p: (p[0] - clat) ** 2 + (p[1] - clon) ** 2)
    return pts[:max_puntos]


def google_maps(busquedas: list[str], ciudad: str, sector: str, max_puntos: int = 12, paso_km: float = 3.0, zoom: int = 14,
                puntos: list[tuple[float, float]] | None = None) -> list[dict]:
    """Google Maps con gosom/google-maps-scraper en modo rápido (el modo normal está roto desde el 01/10/2026, issue #338).
    Maps devuelve ~20 negocios por búsqueda y zona: se barre la ciudad por zonas y con varias formas de buscar el nicho.
    La búsqueda va SIN el nombre de la ciudad: con él, Google ignora la zona y devuelve el centro (o nada)."""
    if puntos is None:
        _, _, caja = geocodifica(ciudad)
        puntos = rejilla(caja, paso_km, max_puntos)
    out: dict[str, dict] = {}
    with tempfile.TemporaryDirectory() as tmp:
        for i, (lat, lon) in enumerate(puntos, 1):
            q = Path(tmp) / 'q.txt'
            q.write_text('\n'.join(busquedas) + '\n', encoding='utf-8')
            res = Path(tmp) / f'r{i}.json'
            subprocess.run([str(GMAPS), '-input', str(q), '-results', str(res), '-json', '-lang', 'es', '-fast-mode',
                            '-geo', f'{lat},{lon}', '-zoom', str(zoom), '-radius', str(int(paso_km * 1000)), '-c', '1',
                            '-exit-on-inactivity', '1m'], capture_output=True, timeout=600)
            filas = []
            if res.exists() and res.stat().st_size:
                txt = res.read_text(encoding='utf-8')
                try:
                    filas = json.loads(txt)
                except json.JSONDecodeError:
                    # Varias búsquedas: un array JSON por línea
                    for l in txt.splitlines():
                        if l.strip():
                            v = json.loads(l)
                            filas += v if isinstance(v, list) else [v] if v else []
            filas = [x for x in (filas or []) if isinstance(x, dict)]  # sin resultados el scraper escribe null
            nuevos = 0
            for x in filas:
                cid = x.get('cid') or x.get('place_id') or x.get('title')
                if cid in out:
                    continue
                nuevos += 1
                ciu, prov = ciudad_provincia(x.get('address') or '')
                web = x.get('web_site') or ''
                if web and _NO_NEGOCIO.search(dominio(web)):
                    web = ''   # su «web» en Maps es un directorio (Páginas Amarillas…), no la suya
                out[cid] = {
                    'empresa': (x.get('title') or '').strip(), 'web': web, 'telefono': normaliza_tel(x.get('phone') or ''),
                    'sector': sector, 'ciudad': ciu or ciudad, 'provincia': prov, 'direccion': x.get('address') or '',
                    'resenas': int(x.get('review_count') or 0), 'valoracion': float(x.get('review_rating') or 0),
                    'fuente': 'google_maps', 'origen_dato': 'Google Maps · ficha pública del negocio',
                    'categorias': [str(k) for k in (x.get('categories') or ([x['category']] if x.get('category') else [])) if k],
                    'extra': {'maps': x.get('link') or '', 'estado_maps': x.get('status') or '', 'horario': x.get('open_hours') or {}},
                }
            print(f'  Maps · zona {i}/{len(puntos)}: {len(filas)} resultados, {nuevos} nuevos (total {len(out)})')
            time.sleep(3)
    return list(out.values())


# Webs que no son negocios (portales, directorios, prensa, administraciones): no se rastrean como prospectos.
_NO_NEGOCIO = re.compile(r'wikipedia|idealo|amazon\.|leroymerlin|bricomart|elcorteingles|youtube|facebook|instagram|linkedin|tiktok|twitter|x\.com|'
                         r'habitissimo|cronoshare|paginasamarillas|infoisinfo|cylex|yelp|tripadvisor|milanuncios|wallapop|idealista|fotocasa|'
                         r'xataka|elmundo|elpais|abc\.es|20minutos|lavanguardia|eleconomista|expansion|cincodias|idae\.es|\.gob\.es|\.gov|boe\.es|'
                         r'ocu\.org|rankia|forocoches|reddit|quora|pinterest|holaluz|iberdrola|endesa|repsol|naturgy|totalenergies|selectra|'
                         r'kelisto|roams|comparador|google\.|bing\.|duckduckgo|apple\.com|microsoft|blogspot|wordpress\.com|medium\.com', re.I)


def buscador(consultas: list[str], sector: str, paginas: int = 2) -> list[dict]:
    """Negocios online que no hace falta que estén en Maps: búsqueda web gratuita (DuckDuckGo HTML, sin clave).
    Se usa con moderación (pausas largas): es un complemento, no la fuente principal."""
    out: dict[str, dict] = {}
    with httpx.Client(headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36',
                               'Accept-Language': 'es-ES,es;q=0.9'}, follow_redirects=True, timeout=25) as cli:
        for c in consultas:
            datos = {'q': c, 'kl': 'es-es'}
            for p in range(paginas):
                try:
                    r = cli.post('https://html.duckduckgo.com/html/', data=datos)
                except Exception as e:
                    print('  buscador error:', type(e).__name__)
                    break
                t = HTMLParser(r.text)
                n = 0
                for a in t.css('a.result__a'):
                    href = a.attributes.get('href') or ''
                    if 'uddg=' in href:
                        href = unquote(parse_qs(urlparse(href).query).get('uddg', [''])[0])
                    dom = dominio(href)
                    if not dom or _NO_NEGOCIO.search(dom) or 'y.js' in href or dom in out:
                        continue
                    if not dom.endswith(('.es', '.com', '.net', '.eu', '.cat', '.org', '.solar', '.energy', '.info')):
                        continue
                    n += 1
                    out[dom] = {'empresa': a.text().strip()[:120], 'web': f'https://{dom}/', 'telefono': '', 'sector': sector, 'ciudad': '',
                                'direccion': '', 'resenas': 0, 'valoracion': 0.0, 'fuente': 'buscador',
                                'origen_dato': 'Web de la empresa · encontrada en búsqueda pública', 'extra': {'consulta': c}}
                print(f'  Buscador «{c}» pág {p + 1}: {n} webs nuevas')
                # Siguiente página: DuckDuckGo la pide con el formulario "next"
                nxt = t.css_first('div.nav-link form')
                if not nxt:
                    break
                datos = {i.attributes.get('name'): i.attributes.get('value') or '' for i in nxt.css('input[name]')}
                time.sleep(6)
            time.sleep(8)
    return list(out.values())
