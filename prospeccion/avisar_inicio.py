"""Vigilante para una tanda que ya estaba corriendo antes de que el motor avisara al empezar cada provincia.

Lee el log de la tanda y, cuando ve «=== <Provincia> ===», apunta en el registro común
«Buscando empresas de placas solares en <Provincia> (n de N)». Termina solo cuando la tanda acaba.
Las tandas nuevas ya lo hacen ellas mismas (tanda.py): esto es solo para no cortar la que está en marcha.

Uso (en el servidor): .venv/bin/python avisar_inicio.py energia
"""
import re
import subprocess
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from prospeccion.motor import SALIDA, apunta  # noqa: E402
from prospeccion.tanda import NICHOS, ORDEN  # noqa: E402

nicho = sys.argv[1] if len(sys.argv) > 1 else 'energia'
log = SALIDA / f'tanda_{nicho}.log'
carpeta = SALIDA / 'tandas' / nicho
INICIO = float(sys.argv[2]) if len(sys.argv) > 2 else time.time()   # cuándo empezó la tanda en curso (epoch)
# Las que tocan en esta tanda: sin CSV, o con CSV hecho después de que empezara (ya terminadas en esta misma tanda)
csv = lambda p: carpeta / f'{nicho}_{p.lower().replace(" ", "-")}.csv'
pendientes = [p for p in ORDEN if not csv(p).exists() or csv(p).stat().st_mtime >= INICIO]
vistos = set()
pos = 0
while True:
    texto = log.read_text(encoding='utf-8', errors='replace') if log.exists() else ''
    for m in re.finditer(r'^=== (.+?) ===$', texto[pos:], re.M):
        p = m.group(1)
        if p in pendientes and p not in vistos:
            vistos.add(p)
            apunta(f'Buscando {NICHOS[nicho]["sector"].lower()} en {p} ({pendientes.index(p) + 1} de {len(pendientes)})',
                   'Tirada en curso en el servidor: Google Maps por zonas y municipios, y después la web de cada empresa.', f'{nicho}_{p}', tipo='espera')
    pos = len(texto)
    viva = subprocess.run(['pgrep', '-f', 'python -u -m prospeccion.tanda'], capture_output=True, text=True).stdout.strip()
    if not viva:
        break
    time.sleep(20)
