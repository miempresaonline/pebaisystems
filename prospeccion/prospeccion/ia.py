"""Filtro de la IA antes de importar (orden del CEO, 20/10): la IA lee la web de cada empresa y dice si es de verdad
una instaladora de placas solares. Las reglas por palabras no bastaban (se colaban tiendas, distribuidores, clima…).

POST api/ia-prospecto.php {empresa, ciudad, web, canal} → {ok, encaja, motivo, mensaje | asunto+cuerpo} o {ok, error}.
  encaja=false → no se importa; queda en el log local con el motivo.
  error        → no se importa; se guarda en ia_pendientes.csv y se reintenta en la siguiente tirada.
  encaja=true  → se importa con su mensaje (WhatsApp) o su asunto y cuerpo (email).
Ritmo: como mucho 1 llamada cada 3 s (Gemini gratis).
"""
import csv
import datetime as dt
import json
import os
import time
from pathlib import Path

import httpx

from .motor import SALIDA, _token

URL = os.environ.get('IA_PROSPECTO_URL', 'https://pebaisystems.es/api/ia-prospecto.php')
PAUSA_S = 3.0
_ultima = [0.0]


def estudia(empresa: str, ciudad: str, web: str, canal: str) -> dict:
    espera = PAUSA_S - (time.time() - _ultima[0])
    if espera > 0:
        time.sleep(espera)
    _ultima[0] = time.time()
    try:
        r = httpx.post(URL, timeout=90, headers={'X-Agent-Token': _token(), 'User-Agent': 'pebai-prospeccion'},
                       json={'empresa': empresa, 'ciudad': ciudad, 'web': web, 'canal': canal})
        d = r.json() if r.status_code == 200 else {'ok': False, 'error': f'HTTP {r.status_code}'}
    except Exception as e:
        d = {'ok': False, 'error': type(e).__name__}
    if not d.get('ok') or 'encaja' not in d:
        return {'error': d.get('error') or 'respuesta sin veredicto'}
    return d


def _lee(p: Path) -> tuple[list[str], list[dict]]:
    if not p.exists():
        return [], []
    with p.open(encoding='utf-8-sig') as f:
        rd = csv.DictReader(f, delimiter=';')
        return list(rd.fieldnames or []), list(rd)


def _escribe(p: Path, cols: list[str], filas: list[dict]) -> None:
    with p.open('w', encoding='utf-8-sig', newline='') as f:
        wr = csv.DictWriter(f, cols, delimiter=';', extrasaction='ignore')
        wr.writeheader()
        wr.writerows(filas)


def filtra(csv_in: Path, canal: str) -> tuple[Path, dict]:
    """Devuelve el CSV con solo las que encajan (con columnas mensaje o asunto/cuerpo) y el recuento.
    Antes suma las que dieron error en una tirada anterior del mismo canal."""
    pend = csv_in.parent / f'ia_pendientes_{canal}.csv'
    cols, filas = _lee(csv_in)
    cols_p, previas = _lee(pend)
    cols = cols or cols_p
    vistos = {(r.get('telefono'), r.get('email'), r.get('web')) for r in filas}
    filas += [r for r in previas if (r.get('telefono'), r.get('email'), r.get('web')) not in vistos]
    extra = ['mensaje'] if canal == 'whatsapp' else ['asunto', 'cuerpo']
    ok, errores, n = [], [], {'encajan': 0, 'no_encajan': 0, 'error': 0}
    log = SALIDA / 'ia_filtro.log'
    with log.open('a', encoding='utf-8') as f:
        for r in filas:
            d = estudia(r.get('empresa', ''), r.get('ciudad', ''), r.get('web', ''), canal)
            if 'error' in d:
                n['error'] += 1
                errores.append(r)
                veredicto = 'error'
            elif d.get('encaja'):
                n['encajan'] += 1
                r = dict(r, **{k: d.get(k, '') for k in extra})
                ok.append(r)
                veredicto = 'encaja'
            else:
                n['no_encajan'] += 1
                veredicto = 'no encaja'
            f.write(json.dumps({'ts': dt.datetime.now().isoformat(timespec='seconds'), 'canal': canal, 'empresa': r.get('empresa'),
                                'web': r.get('web'), 'veredicto': veredicto, 'motivo': d.get('motivo') or d.get('error', '')},
                               ensure_ascii=False) + '\n')
            print(f'   IA · {veredicto}: {r.get("empresa")} — {(d.get("motivo") or d.get("error", ""))[:90]}')
    out = csv_in.with_name(csv_in.stem + '_ia.csv')
    _escribe(out, cols, ok)
    # Los textos van aparte (el cuerpo del email lleva saltos de línea y el importador lee el CSV por líneas)
    textos = {(r.get('telefono') if canal == 'whatsapp' else r.get('email', '').lower()): {k: r.get(k, '') for k in extra} for r in ok}
    Path(str(out) + '.ia.json').write_text(json.dumps(textos, ensure_ascii=False), encoding='utf-8')
    if errores:
        _escribe(pend, cols, errores)
    elif pend.exists():
        pend.unlink()
    return out, n
