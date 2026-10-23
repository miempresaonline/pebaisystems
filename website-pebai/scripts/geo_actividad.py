"""Apunta una acción del Agente GEO en el panel (Automático › Agentes › Visibilidad en IA).

Uso:  python website-pebai/scripts/geo_actividad.py [--agente=geo_vigia] <tipo> "<resumen>" ["<detalle>"]
      agentes: geo_jefe, geo_vigia, geo_contenido, geo_refresco, geo_local, geo_redes, geo_medicion (por defecto geo_jefe)
      tipo: hito (tarea hecha) · espera · error · cambio · entrega
      entrega = trabajo que Daniel ve en la pestaña «Su trabajo» de la oficina:
        geo_actividad.py --agente=geo_contenido entrega "<título>" "<qué es, 1-2 frases>" --clase=pagina --url=https://... [--img=https://...]
        clases: pagina, borrador, post, linkedin, informe, novedad, posiciones, encargo, mejora
      aviso = email a Daniel (equipo@pebaisystems.es) por el correo de la web, para lo de «Para Daniel» (máx. 6/día):
        geo_actividad.py --agente=geo_jefe aviso "<asunto>" "<texto>"
        Para archivos del repo usa https://github.com/miempresaonline/pebaisystems/blob/main/<ruta>
        y para imágenes https://raw.githubusercontent.com/miempresaonline/pebaisystems/main/<ruta>

Escribe en api/actividad.php con la cabecera X-Agent-Token (el 'agent_token' de website-pebai/private/config.php).
Nunca imprime el token.
"""
import json
import os
import re
import sys
import urllib.request

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), os.pardir))
CONFIG = os.path.join(ROOT, 'private', 'config.php')
URL = 'https://pebaisystems.es/api/actividad.php'
URL_AVISO = 'https://pebaisystems.es/api/aviso.php'
TIPOS = ('hito', 'espera', 'error', 'cambio', 'entrega')
CLASES = ('pagina', 'borrador', 'post', 'linkedin', 'informe', 'novedad', 'posiciones', 'encargo', 'mejora')


def agent_token():
    # En la nube de Claude no hay private/config.php: el token llega como variable de entorno
    if os.environ.get('PEBAI_AGENT_TOKEN'):
        return os.environ['PEBAI_AGENT_TOKEN']
    with open(CONFIG, encoding='utf-8') as f:
        m = re.search(r"'agent_token'\s*=>\s*'([^']+)'", f.read())
    if not m:
        sys.exit('No hay agent_token en private/config.php')
    return m.group(1)


AGENTES = ('geo_jefe', 'geo_vigia', 'geo_contenido', 'geo_refresco', 'geo_local', 'geo_redes', 'geo_medicion')


def apuntar(tipo, resumen, detalle='', agente='geo_jefe', ref=''):
    if agente not in AGENTES:
        sys.exit(f'Agente no válido: {agente}')
    if tipo not in TIPOS:
        sys.exit(f'Tipo no válido: {tipo} (usa {", ".join(TIPOS)})')
    body = json.dumps({'agente': agente, 'tipo': tipo, 'resumen': resumen[:300], 'detalle': detalle[:3800], 'ref': ref}).encode()
    req = urllib.request.Request(URL, data=body, method='POST',
                                 headers={'Content-Type': 'application/json', 'X-Agent-Token': agent_token(),
                                          'User-Agent': 'PEBAI-GEO/1.0'})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode() or '{}')


if __name__ == '__main__':
    opts = {a[2:].split('=', 1)[0]: a.split('=', 1)[1] for a in sys.argv[1:] if a.startswith('--') and '=' in a}
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    agente = opts.get('agente', 'geo_jefe')
    if len(args) < 2:
        sys.exit(__doc__)
    texto = args[2] if len(args) > 2 else ''
    if args[0] == 'aviso':
        if agente not in AGENTES:
            sys.exit(f'Agente no válido: {agente}')
        body = json.dumps({'agente': agente, 'asunto': args[1][:120], 'texto': texto[:6000]}).encode()
        req = urllib.request.Request(URL_AVISO, data=body, method='POST',
                                     headers={'Content-Type': 'application/json', 'X-Agent-Token': agent_token(),
                                              'User-Agent': 'PEBAI-GEO/1.0'})
        with urllib.request.urlopen(req, timeout=30) as r:
            print(json.loads(r.read().decode() or '{}'))
    elif args[0] == 'entrega':
        clase = opts.get('clase', '')
        if clase not in CLASES:
            sys.exit(f'Clase no válida: {clase!r} (usa {", ".join(CLASES)})')
        for k in ('url', 'img'):
            if opts.get(k) and not opts[k].startswith('https://'):
                sys.exit(f'--{k} tiene que empezar por https://')
        print(apuntar('entrega', args[1], json.dumps({'url': opts.get('url', ''), 'img': opts.get('img', ''), 'texto': texto}, ensure_ascii=False), agente, clase))
    else:
        print(apuntar(args[0], args[1], texto, agente))
