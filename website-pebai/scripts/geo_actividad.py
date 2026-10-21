"""Apunta una acción del Agente GEO en el panel (Automático › Agentes › Visibilidad en IA).

Uso:  python website-pebai/scripts/geo_actividad.py <tipo> "<resumen>" ["<detalle>"]
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


def apuntar(tipo, resumen, detalle=''):
    if tipo not in TIPOS:
        sys.exit(f'Tipo no válido: {tipo} (usa {", ".join(TIPOS)})')
    body = json.dumps({'agente': 'geo', 'tipo': tipo, 'resumen': resumen[:300], 'detalle': detalle[:2000]}).encode()
    req = urllib.request.Request(URL, data=body, method='POST',
                                 headers={'Content-Type': 'application/json', 'X-Agent-Token': agent_token(),
                                          'User-Agent': 'PEBAI-GEO/1.0'})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode() or '{}')


if __name__ == '__main__':
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    print(apuntar(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else ''))
