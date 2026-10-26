"""Datos GEO de PEBAI Systems: lee las herramientas y hace los pocos cambios aprobados.

Lo usan los agentes GEO (en el ordenador o en la nube de Claude). Imprime JSON y nunca imprime claves.
Credenciales: variables de entorno (nube) o los archivos de C:/programacion/APIs (ordenador).

Lectura:
  gsc [dias]            Search Console: rendimiento por consulta y página, y sitemaps
  ga4 [dias]            GA4: sesiones por canal ("PEBAI (IA primero)" y por defecto), fuente y eventos clave
  bing                  Bing Webmaster: sitemaps, rastreo, tráfico y consultas
  clarity [dias]        Clarity: tráfico por fuente (1-3 días; máx. 10 llamadas al día)
  seranking             SE Ranking: posiciones del proyecto de PEBAI (pos 0 = fuera del top 100; mide a diario)
  gsc-inspeccion [url]  Search Console: si cada URL del sitemap (o la dada) está indexada en Google, y cuándo la rastreó
  localo                Localo: tareas propuestas y palabras clave de la ficha de PEBAI
Cambios aprobados (docs/geo/aprobaciones.md):
  gsc-sitemap           reenvía https://pebaisystems.es/sitemap.xml a Search Console
  bing-url <url> ...    envía URLs de pebaisystems.es a Bing
  bing-sitemap          reenvía https://pebaisystems.es/sitemap.xml a Bing Webmaster
  localo-cerrar <id>    marca como hecha una tarea de Localo de la ficha de PEBAI
  localo-keywords <kw>  añade palabras clave a la ficha de PEBAI en Localo (separadas por ;)
"""
import base64
import datetime as dt
import json
import os
import ssl
import sys
import urllib.parse
import urllib.request

APIS = 'C:/programacion/APIs/'
SITE = 'https://pebaisystems.es/'
GA4_PROPERTY = '554831316'
SE_RANKING_SITE = 12936941
try:  # certificados de certifi si están (en Windows urllib no siempre encuentra la cadena)
    import certifi
    SSL = ssl.create_default_context(cafile=certifi.where())
except ImportError:
    SSL = ssl.create_default_context()
LOCALO_PLACE = 'oclkhQ5nvx9Ky6nkSWjY1w'  # la ficha de PEBAI; la cuenta de Localo es compartida con otros negocios


def _keys():
    try:
        with open(APIS + 'api_keys.json', encoding='utf-8') as f:
            return json.load(f)
    except OSError:
        return {}


def secreto(env, clave_local):
    v = os.environ.get(env) or _keys().get(clave_local, '')
    if not v:
        sys.exit(json.dumps({'ok': False, 'error': f'falta la credencial {env}'}))
    return v


def http(url, method='GET', headers=None, body=None, timeout=40):
    data = json.dumps(body).encode() if body is not None else None
    h = {'User-Agent': 'PEBAI-GEO/1.0', **(headers or {})}
    if data is not None:
        h.setdefault('Content-Type', 'application/json')
    req = urllib.request.Request(url, data=data, method=method, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=SSL) as r:
            txt = r.read().decode('utf-8', 'replace')
            return r.status, (json.loads(txt) if txt.strip() else None)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8', 'replace')[:500]
    except urllib.error.URLError as e:
        return 0, f'sin conexión: {e.reason}'


def google_token(scope):
    from google.oauth2 import service_account
    from google.auth.transport.requests import Request
    b64 = os.environ.get('PEBAI_GOOGLE_SA_B64')
    if b64:
        info = json.loads(base64.b64decode(b64))
        cred = service_account.Credentials.from_service_account_info(info, scopes=[scope])
    else:
        cred = service_account.Credentials.from_service_account_file(APIS + 'seo-pebai-automation.json', scopes=[scope])
    cred.refresh(Request())
    return {'Authorization': 'Bearer ' + cred.token}


def dias_atras(n):
    return (dt.date.today() - dt.timedelta(days=n)).isoformat()


def gsc(dias=28):
    h = google_token('https://www.googleapis.com/auth/webmasters')
    s = urllib.parse.quote(SITE, safe='')
    base = f'https://www.googleapis.com/webmasters/v3/sites/{s}'
    out = {'sitemaps': http(base + '/sitemaps', headers=h)[1]}
    for dim in ('query', 'page'):
        out[dim] = http(base + '/searchAnalytics/query', 'POST', h,
                        {'startDate': dias_atras(dias), 'endDate': dias_atras(1), 'dimensions': [dim], 'rowLimit': 50})[1]
    return out


def ga4(dias=7):
    h = google_token('https://www.googleapis.com/auth/analytics.readonly')
    url = f'https://analyticsdata.googleapis.com/v1beta/properties/{GA4_PROPERTY}:runReport'
    rango = [{'startDate': f'{dias}daysAgo', 'endDate': 'yesterday'}]
    out = {}
    for nombre, dim in (('canal_defecto', 'sessionDefaultChannelGroup'), ('fuente', 'sessionSource')):
        out[nombre] = http(url, 'POST', h, {'dateRanges': rango, 'dimensions': [{'name': dim}], 'metrics': [{'name': 'sessions'}], 'limit': 50})[1]
    out['eventos_clave'] = http(url, 'POST', h, {'dateRanges': rango, 'dimensions': [{'name': 'eventName'}], 'metrics': [{'name': 'eventCount'}],
                                                 'dimensionFilter': {'filter': {'fieldName': 'eventName', 'inListFilter': {'values': ['lead_funnel_diagnostic', 'conversion_whatsapp', 'geo_ai_visit']}}}})[1]
    return out


def bing():
    k = secreto('PEBAI_BING_API_KEY', 'bing_webmaster_api_key_pebai')  # nunca la bing_webmaster_api_key: es de otra empresa
    base = 'https://ssl.bing.com/webmaster/api.svc/json/'
    q = '?' + urllib.parse.urlencode({'apikey': k, 'siteUrl': SITE})
    return {m: http(base + m + q)[1] for m in ('GetFeeds', 'GetCrawlStats', 'GetRankAndTrafficStats', 'GetQueryStats', 'GetCrawlIssues')}


def clarity(dias=3):
    t = secreto('PEBAI_CLARITY_TOKEN', 'microsoft_clarity_token_pebai')
    url = f'https://www.clarity.ms/export-data/api/v1/project-live-insights?numOfDays={min(int(dias), 3)}&dimension1=Source'
    return http(url, headers={'Authorization': 'Bearer ' + t})[1]


def seranking():
    t = secreto('PEBAI_SE_RANKING_TOKEN', 'se_ranking_token')
    h = {'Authorization': 'Token ' + t}
    hoy = dt.date.today()
    return {'keywords': http(f'https://api4.seranking.com/sites/{SE_RANKING_SITE}/keywords', headers=h)[1],
            'posiciones': http(f'https://api4.seranking.com/sites/{SE_RANKING_SITE}/positions?date_from={(hoy - dt.timedelta(days=14)).isoformat()}&date_to={hoy.isoformat()}', headers=h)[1]}


def localo(query, variables=None, mutation=False):
    t = secreto('PEBAI_LOCALO_TOKEN', 'localo_bearer_token')
    body = {'jsonrpc': '2.0', 'id': 1, 'method': 'tools/call',
            'params': {'name': 'mutation' if mutation else 'query', 'arguments': {'query': query, 'variables': variables or {}}}}
    code, res = http('https://api.localo.com/api/mcp', 'POST', {'Authorization': 'Bearer ' + t, 'Accept': 'application/json, text/event-stream'}, body, timeout=60)
    try:
        return json.loads(res['result']['content'][0]['text'])
    except (TypeError, KeyError, IndexError, ValueError):
        return {'http': code, 'respuesta': res}


def localo_estado():
    q = '''query($p: GUID!){ tareas: listPlaceTasks(placeId:$p, status: PROPOSED){ id type status }
           palabras: listPlaceActiveKeywords(placeId:$p){ keyword latestGrids { averagePlacePosition competitorsCount gridSize finishedAt } } }'''
    return localo(q, {'p': LOCALO_PLACE})


def localo_cerrar(task_id):
    # Solo tareas de la ficha de PEBAI
    ids = {t['id'] for t in (localo_estado().get('data') or {}).get('tareas', [])}
    if task_id not in ids:
        sys.exit(json.dumps({'ok': False, 'error': 'esa tarea no es de la ficha de PEBAI o ya no está propuesta'}))
    q = 'mutation($t: GUID!){ markTaskAsCompleted(taskId:$t, completionMethod: USER_ACTION){ __typename } }'
    return localo(q, {'t': task_id}, mutation=True)


def localo_keywords(texto):
    kws = [k.strip() for k in texto.split(';') if k.strip()][:10]
    q = 'mutation($input: AddPlaceKeywordsInput!){ addPlaceKeywords(input:$input){ __typename } }'
    return localo(q, {'input': {'placeId': LOCALO_PLACE, 'keywords': kws}}, mutation=True)


def gsc_sitemap():
    h = google_token('https://www.googleapis.com/auth/webmasters')
    s = urllib.parse.quote(SITE, safe='')
    sm = urllib.parse.quote(SITE + 'sitemap.xml', safe='')
    return {'http': http(f'https://www.googleapis.com/webmasters/v3/sites/{s}/sitemaps/{sm}', 'PUT', h)[0]}


def gsc_inspeccion(urls):
    import re
    if not urls:
        req = urllib.request.Request(SITE + 'sitemap.xml', headers={'User-Agent': 'PEBAI-GEO/1.0 (+https://pebaisystems.es)'})
        with urllib.request.urlopen(req, timeout=30) as r:
            urls = re.findall(r'<loc>([^<]+)</loc>', r.read().decode('utf-8'))
    urls = [u for u in urls if u.startswith(SITE)]
    h = google_token('https://www.googleapis.com/auth/webmasters')
    out = []
    for u in urls[:20]:
        code, res = 0, {}
        for _ in range(3):  # la API a veces corta la conexión: reintenta
            try:
                code, res = http('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', 'POST', h,
                                 {'inspectionUrl': u, 'siteUrl': SITE, 'languageCode': 'es'})
                break
            except OSError:
                continue
        ix = ((res or {}).get('inspectionResult') or {}).get('indexStatusResult') or {}
        out.append({'url': u, 'http': code, 'veredicto': ix.get('verdict'), 'estado': ix.get('coverageState'),
                    'ultimo_rastreo': ix.get('lastCrawlTime'), 'canonical_google': ix.get('googleCanonical')})
    return out


def bing_sitemap():
    k = secreto('PEBAI_BING_API_KEY', 'bing_webmaster_api_key_pebai')
    code, _ = http('https://ssl.bing.com/webmaster/api.svc/json/SubmitFeed?' + urllib.parse.urlencode({'apikey': k}), 'POST', None,
                   {'siteUrl': SITE, 'feedUrl': SITE + 'sitemap.xml'})
    return {'http': code}


def bing_urls(urls):
    urls = [u for u in urls if u.startswith(SITE)]
    if not urls:
        sys.exit(json.dumps({'ok': False, 'error': 'solo URLs de pebaisystems.es'}))
    k = secreto('PEBAI_BING_API_KEY', 'bing_webmaster_api_key_pebai')
    code, _ = http('https://ssl.bing.com/webmaster/api.svc/json/SubmitUrlBatch?' + urllib.parse.urlencode({'apikey': k}), 'POST', None,
                   {'siteUrl': SITE, 'urlList': urls})
    return {'http': code, 'urls': urls}


if __name__ == '__main__':
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    cmd, args = sys.argv[1], sys.argv[2:]
    acciones = {
        'gsc': lambda: gsc(int(args[0]) if args else 28),
        'ga4': lambda: ga4(int(args[0]) if args else 7),
        'bing': bing,
        'clarity': lambda: clarity(int(args[0]) if args else 3),
        'seranking': seranking,
        'localo': localo_estado,
        'gsc-sitemap': gsc_sitemap,
        'bing-url': lambda: bing_urls(args),
        'bing-sitemap': bing_sitemap,
        'gsc-inspeccion': lambda: gsc_inspeccion(args),
        'localo-cerrar': lambda: localo_cerrar(args[0]),
        'localo-keywords': lambda: localo_keywords(' '.join(args)),
    }
    if cmd not in acciones:
        sys.exit(__doc__)
    print(json.dumps(acciones[cmd](), ensure_ascii=False, indent=1)[:60000])
