"""Redactor de captación (Claude, rutina en la nube): pide empresas al servidor y entrega lo que escribe.

Uso:
  python website-pebai/scripts/redactor.py pendientes [n]
      Reserva hasta n empresas (máx. 15) y guarda el lote en /tmp/redactor_lote.json. Imprime las reglas una vez
      y, por empresa: canal, id, nombre, ciudad, web, qué reglas usar y el texto de su portada.
  python website-pebai/scripts/redactor.py entrega <archivo.json>
      Entrega una empresa: {"canal": "whatsapp|email", "id": 123, "encaja": true|false, "motivo": "...",
      "dato": "copia literal de su web", "mensaje": "..."}  (email: "asunto" y "cuerpo" en vez de "mensaje").
      Responde {"ok": true, "hecho": "escrito|descartado"} o {"ok": false, "error": "...", "intentos": N}.

El servidor aplica el mismo control de calidad que tenía Gemini (api/_ia_lib.php, pebai_ia_control).
Nunca envía nada a las empresas: solo deja el texto en la cola. Token: PEBAI_AGENT_TOKEN (nube) o private/config.php.
"""
import json
import sys
import urllib.request

sys.path.insert(0, __import__('os').path.dirname(__file__))
from geo_actividad import agent_token  # noqa: E402

URL = 'https://pebaisystems.es/api/redactor.php'
LOTE = '/tmp/redactor_lote.json'


def llamar(metodo, url, cuerpo=None):
    req = urllib.request.Request(url, data=json.dumps(cuerpo).encode() if cuerpo is not None else None, method=metodo,
                                 headers={'Content-Type': 'application/json', 'X-Agent-Token': agent_token(), 'User-Agent': 'PEBAI-Redactor/1.0'})
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            return json.loads(r.read().decode() or '{}')
    except urllib.error.HTTPError as e:
        return json.loads(e.read().decode() or '{}') or {'ok': False, 'error': f'HTTP {e.code}'}


if __name__ == '__main__':
    if len(sys.argv) >= 2 and sys.argv[1] == 'pendientes':
        n = int(sys.argv[2]) if len(sys.argv) > 2 else 8
        d = llamar('GET', f'{URL}?n={n}')
        with open(LOTE, 'w', encoding='utf-8') as f:
            json.dump(d, f, ensure_ascii=False)
        print('COLA:', json.dumps(d.get('cola', {}), ensure_ascii=False))
        print(f'EMPRESAS EN ESTE LOTE: {len(d.get("empresas", []))} (lote completo en {LOTE})')
        usadas = {e['reglas'] for e in d.get('empresas', [])}
        for k in sorted(usadas):
            print(f'\n===== REGLAS {k} =====\n{d["reglas"][k]}')
        for e in d.get('empresas', []):
            print(f'\n===== {e["canal"].upper()} id={e["id"]} · {e["empresa"]} ({e["ciudad"]}) · {e["web"]} · reglas={e["reglas"]} =====\n{e["texto"]}')
    elif len(sys.argv) == 3 and sys.argv[1] == 'entrega':
        with open(sys.argv[2], encoding='utf-8') as f:
            print(json.dumps(llamar('POST', URL, json.load(f)), ensure_ascii=False))
    else:
        sys.exit(__doc__)
