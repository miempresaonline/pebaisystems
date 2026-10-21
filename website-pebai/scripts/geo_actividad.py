"""Apunta una acción del Agente GEO en el panel (Automático › Agentes › Visibilidad en IA).

Uso:  python website-pebai/scripts/geo_actividad.py [--agente=geo_vigia] <tipo> "<resumen>" ["<detalle>"]
      agentes: geo_jefe, geo_vigia, geo_contenido, geo_refresco, geo_local, geo_redes, geo_medicion (por defecto geo_jefe)
      tipo: hito (tarea hecha) · espera · error · cambio

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
TIPOS = ('hito', 'espera', 'error', 'cambio')


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


def apuntar(tipo, resumen, detalle='', agente='geo_jefe'):
    if agente not in AGENTES:
        sys.exit(f'Agente no válido: {agente}')
    if tipo not in TIPOS:
        sys.exit(f'Tipo no válido: {tipo} (usa {", ".join(TIPOS)})')
    body = json.dumps({'agente': agente, 'tipo': tipo, 'resumen': resumen[:300], 'detalle': detalle[:2000]}).encode()
    req = urllib.request.Request(URL, data=body, method='POST',
                                 headers={'Content-Type': 'application/json', 'X-Agent-Token': agent_token(),
                                          'User-Agent': 'PEBAI-GEO/1.0'})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode() or '{}')


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--agente=')]
    agente = next((a.split('=', 1)[1] for a in sys.argv[1:] if a.startswith('--agente=')), 'geo_jefe')
    if len(args) < 2:
        sys.exit(__doc__)
    print(apuntar(args[0], args[1], args[2] if len(args) > 2 else '', agente))
