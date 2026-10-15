"""Rastreador de la web de cada empresa: saca su contacto y señales de que está activa.

Respetuoso: mira como mucho la portada y 4 páginas de contacto/aviso legal, respeta robots.txt,
se identifica y no repite peticiones al mismo dominio en paralelo.
"""
import asyncio
import re
import time
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser

import httpx
from selectolax.parser import HTMLParser

from .contacto import emails_en_texto, limpia_email, normaliza_tel, tels_en_texto

UA = 'Mozilla/5.0 (compatible; PEBAI-prospeccion/1.0; +https://pebaisystems.es)'
_PAGINAS_CONTACTO = re.compile(r'contact|aviso[-_ ]?legal|legal|quienes|qui[eé]n|nosotros|empresa|about|sobre', re.I)
_APARCADO = re.compile(r'dominio (?:est[aá] )?(?:en venta|a la venta|disponible)|this domain (?:is|may be) for sale|domain parking|parked (?:free|domain)|'
                       r'buy this domain|p[aá]gina en construcci[oó]n|under construction|coming soon|pr[oó]ximamente|sitio web en mantenimiento|'
                       r'hostinger.*default|website is almost ready', re.I)
_ANYO = re.compile(r'(?:©|&copy;|copyright)\s*(?:\d{4}\s*[-–]\s*)?(20\d{2})', re.I)
REDES = ('facebook.com', 'instagram.com', 'linkedin.com', 'tiktok.com', 'youtube.com', 'x.com', 'twitter.com')


def dominio(url: str) -> str:
    try:
        return urlparse(url if '//' in url else 'http://' + url).netloc.lower().removeprefix('www.')
    except Exception:
        return ''


def _analiza(html: str, base: str, res: dict) -> list[str]:
    """Acumula contactos y señales de una página; devuelve enlaces internos a páginas de contacto."""
    tree = HTMLParser(html)
    texto = tree.body.text(separator=' ') if tree.body else ''
    enlaces = []
    for a in tree.css('a[href]'):
        href = (a.attributes.get('href') or '').strip()
        low = href.lower()
        if low.startswith('mailto:'):
            e = limpia_email(href[7:])
            if e and e not in res['emails']:
                res['emails'].append(e)
                res['email_origen'][e] = base   # URL exacta donde la empresa publica el email
        elif low.startswith('tel:'):
            n = normaliza_tel(href[4:])
            if n and n not in res['tels']:
                res['tels'].append(n)
        elif 'wa.me/' in low or 'api.whatsapp.com' in low or 'whatsapp://' in low:
            res['senales'].add('boton_whatsapp')
            m = re.search(r'(?:wa\.me/|phone=)(\+?\d{9,13})', href)
            n = normaliza_tel(m.group(1)) if m else ''
            if n:
                res['whatsapp'] = res['whatsapp'] or n
                if n not in res['tels']:
                    res['tels'].append(n)
        elif any(r in low for r in REDES):
            red = next(r for r in REDES if r in low).split('.')[0]
            res['redes'].setdefault(red, href.split('?')[0])
        else:
            url = urljoin(base, href)
            if dominio(url) == dominio(base) and _PAGINAS_CONTACTO.search(urlparse(url).path):
                enlaces.append(url.split('#')[0])
    for e in emails_en_texto(texto + ' ' + html[:200000]):
        if e not in res['emails']:
            res['emails'].append(e)
            res['email_origen'][e] = base
    for n in tels_en_texto(texto):
        if n not in res['tels']:
            res['tels'].append(n)
    low = html.lower()
    if tree.css_first('form input[type=email], form textarea'):
        res['senales'].add('formulario')
    if re.search(r"['\"]aw-\d{6,}|googleadservices|gtag\(['\"]config['\"],\s*['\"]aw-", low):
        res['senales'].add('anuncios_google')
    if 'fbq(' in low or 'connect.facebook.net' in low:
        res['senales'].add('pixel_meta')
    if re.search(r'tawk\.to|crisp\.chat|intercom|tidio|livechat|zendesk|hubspot|whatsapp-widget|joinchat|getbutton', low):
        res['senales'].add('chat_web')
    t = texto.lower()
    # Qué hace (nicho energía) y señales de tamaño: más de 1–2 personas
    if re.search(r'fotovoltai|placas solares|paneles solares|autoconsumo', t):
        res['senales'].add('hace_solar')
    if re.search(r'aerotermia|bomba(?:s)? de calor', t):
        res['senales'].add('hace_aerotermia')
    if re.search(r'nuestro equipo|equipo de (?:\d+|profesionales|t[eé]cnicos|instaladores)|m[aá]s de \d+ (?:profesionales|t[eé]cnicos|empleados|trabajadores|instaladores)|'
                 r'delegaci[oó]n|delegaciones|nuestras (?:oficinas|sedes|tiendas)|sede central', t):
        res['senales'].add('equipo')
    if re.search(r'calendly|cal\.com|reservar cita|pide cita|pedir cita|booking', low):
        res['senales'].add('reservas_online')
    for y in _ANYO.findall(html):
        if int(y) <= time.localtime().tm_year:  # «© 2035» es un error de plantilla, no una señal
            res['anyo_web'] = max(res['anyo_web'], int(y))
    if _APARCADO.search(texto[:5000]):
        res['aparcado'] = True
    if not res['titulo']:
        t = tree.css_first('title')
        res['titulo'] = (t.text().strip() if t else '')[:150]
        sn = tree.css_first('meta[property="og:site_name"]')
        res['nombre_web'] = ((sn.attributes.get('content') if sn else '') or '').strip()[:100]
        d = tree.css_first('meta[name=description]')
        res['descripcion'] = ((d.attributes.get('content') if d else '') or '')[:300]
        h = tree.css_first('h1')
        res['h1'] = (h.text().strip() if h else '')[:150]
    return enlaces


async def _sitemap_reciente(cli: httpx.AsyncClient, base: str) -> str:
    """Fecha más reciente del sitemap (señal de web viva: publican o actualizan)."""
    for path in ('/sitemap.xml', '/sitemap_index.xml', '/wp-sitemap.xml'):
        try:
            r = await cli.get(urljoin(base, path), timeout=10)
            if r.status_code == 200 and '<' in r.text[:200]:
                fechas = re.findall(r'<lastmod>\s*(\d{4}-\d{2}-\d{2})', r.text[:400000])
                if fechas:
                    return max(fechas)
        except Exception:
            pass
    return ''


async def rastrea(url: str, cli: httpx.AsyncClient, max_paginas: int = 5) -> dict:
    res = {'url': url, 'url_final': '', 'ok': False, 'status': 0, 'emails': [], 'email_origen': {}, 'tels': [], 'whatsapp': '', 'redes': {},
           'senales': set(), 'anyo_web': 0, 'sitemap_lastmod': '', 'aparcado': False, 'titulo': '', 'nombre_web': '', 'descripcion': '', 'h1': '', 'error': '', 'paginas': []}
    if not url:
        res['error'] = 'sin web'
        return res
    if '//' not in url:
        url = 'https://' + url
    if any(r in url for r in REDES):
        res['error'] = 'la web es una red social'
        return res
    try:
        r = await cli.get(url, timeout=15)
        res['status'] = r.status_code
        res['url_final'] = str(r.url)
        if r.status_code >= 400 or 'html' not in r.headers.get('content-type', 'text/html'):
            res['error'] = f'HTTP {r.status_code}'
            return res
        base = str(r.url)
        rp = RobotFileParser()
        try:
            rob = await cli.get(urljoin(base, '/robots.txt'), timeout=8)
            rp.parse(rob.text.splitlines() if rob.status_code == 200 else [])
        except Exception:
            rp.parse([])
        res['ok'] = True
        res['paginas'].append(base)
        pendientes = _analiza(r.text, base, res)
        vistos = {base}
        for u in pendientes:
            if len(res['paginas']) >= max_paginas:
                break
            if u in vistos or not rp.can_fetch(UA, u):
                continue
            vistos.add(u)
            try:
                await asyncio.sleep(0.4)
                rr = await cli.get(u, timeout=12)
                if rr.status_code == 200:
                    res['paginas'].append(u)
                    _analiza(rr.text, u, res)
            except Exception:
                pass
        res['sitemap_lastmod'] = await _sitemap_reciente(cli, base)
    except Exception as e:
        res['error'] = type(e).__name__
    return res


async def rastrea_varias(urls: list[str], concurrencia: int = 8) -> dict[str, dict]:
    sem = asyncio.Semaphore(concurrencia)
    out: dict[str, dict] = {}
    t0 = time.time()
    async with httpx.AsyncClient(headers={'User-Agent': UA, 'Accept-Language': 'es-ES,es;q=0.9'}, follow_redirects=True, verify=False,
                                 limits=httpx.Limits(max_connections=concurrencia * 2)) as cli:
        async def una(u):
            async with sem:
                out[u] = await rastrea(u, cli)
        await asyncio.gather(*(una(u) for u in dict.fromkeys(urls)))
    print(f'  webs rastreadas: {len(out)} en {time.time() - t0:.0f} s')
    return out
