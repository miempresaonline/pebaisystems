"""Nicho B (por EMAIL): comercializadoras pequeñas de electricidad y operadores locales de telecomunicaciones.

Luz: censo oficial de comercializadoras de la CNMC (sede.cnmc.gob.es/listado/censo/2): solo las activas, sin las grandes.
     Su web sale del propio censo; de ella se saca el email publicado (mejor atencion@/clientes@/info@ del dominio) y la señal.
Fibra: se saca con el motor de Maps por provincias (prospeccion.tanda fibra), porque el registro de operadores de la CNMC
       tiene CAPTCHA y no se raspa.

Motivo (acordado con el chat de Email, docs/captacion-email.md §4.5):
  1. Señal propia ('atencion'): teléfono de atención de pago (902/901) o sin chat ni WhatsApp. Sin la palabra «web».
  2. Si no hay: 'normativa', Ley 10/2025 de atención a la clientela, que caduca el 28/12/2026.

Uso: python -m prospeccion.nicho_b luz
"""
import asyncio
import csv
import html
import re
import sys

import httpx

from .contacto import dominio_recibe_email, precarga_mx, email_es_de_la_empresa, email_publicable, mejor_email, normaliza_tel, tipo_email, tipo_tel
from .motor import COLS, HOY, LEY_CADUCA as CADUCA, LEY_URL, MOTIVO_NORMATIVA, SALIDA, apunta, exclusiones
from .web import dominio, rastrea_varias

# Grandes y sus filiales (no son el cliente: lista corta y cuidada de pequeñas)
GRANDES_LUZ = re.compile(r'endesa|iberdrola|naturgy|repsol|totalenergies|\bedp\b|e\.on|\beon\b|holaluz|octopus|cur ?energ|energ[ií]a xxi|regsiti|'
                         r'comercializadora regulada|baser|viesgo|cepsa|moeve|galp|audax|axpo|factor energ|engie|enel|alpiq|naturgy|'
                         r'nexus energ|acciona|fenie|gas natural|union fenosa|unión fenosa|hidrocant|cide hcenerg|bassols|'
                         # Multinacionales y grandes cadenas que también comercializan (no son pymes)
                         r'centrica|bon preu|mercadona|carrefour|eroski|alcampo|lidl|ikea|shell|bp energ|statkraft|uniper|vattenfall|ørsted|orsted', re.I)
_GENERICOS_ATENCION = ('atencion', 'atencionalcliente', 'clientes', 'cliente', 'info', 'contacto', 'comercial', 'hola', 'oficina')


def censo_luz() -> list[dict]:
    r = httpx.get('https://sede.cnmc.gob.es/listado/censo/2', headers={'User-Agent': 'Mozilla/5.0'}, timeout=60)
    out = []
    for tr in re.findall(r'<tr[^>]*>(.*?)</tr>', r.text, re.S):
        td = [re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', x))).strip() for x in re.findall(r'<td[^>]*>(.*?)</td>', tr, re.S)]
        municipal = re.search(r'ayuntamiento|ajuntament|concello|municipal|diputaci', td[1], re.I)
        if len(td) < 13 or td[12] == 'Baja' or 'EXTINGUIDA' in td[1].upper() or GRANDES_LUZ.search(td[1]) or municipal:
            continue
        web = td[11].strip()
        out.append({'empresa': re.sub(r',?\s*S\.?\s?[LA]\.?\s?U?\.?$', '', td[1]).strip(), 'razon_social': td[1], 'nif': td[8],
                    'ciudad': td[4].title(), 'provincia': td[5], 'tel_censo': normaliza_tel(td[6]),
                    'web': ('https://' + web.split('/')[0]) if web and not web.startswith('http') else web, 'orden': td[0]})
    return out


def motivo_luz(c: dict, w: dict, tels: list[str], nicho: str) -> tuple[str, str, str, str]:
    """(motivo, fuente, senal, caduca). Primero lo propio de la empresa; si no, la normativa."""
    s = w.get('senales', set())
    pago = [t for t in tels if t.startswith(('902', '901'))]
    if pago:
        return f'vuestro teléfono de atención a la clientela es de pago ({pago[0][:3]})', w.get('url_final') or c['web'], 'atencion', ''
    if w.get('ok') and not s & {'chat_web', 'boton_whatsapp'}:
        via = 'un formulario o el teléfono' if 'formulario' in s else 'el teléfono'
        return f'fuera de horario la única forma de contactar con vosotros es {via}', w.get('url_final') or c['web'], 'atencion', ''
    return MOTIVO_NORMATIVA[nicho], LEY_URL, 'normativa', CADUCA


def luz() -> None:
    cands = censo_luz()
    print(f'Comercializadoras activas pequeñas en el censo de la CNMC: {len(cands)} ({sum(1 for c in cands if c["web"])} con web en el censo)')
    webs = asyncio.run(rastrea_varias([c['web'] for c in cands if c['web']], concurrencia=10))
    precarga_mx([e for w in webs.values() for e in w.get('emails', [])])
    excl = exclusiones()
    filas, descartes = [], {}
    vistos = set()

    def descarta(m):
        descartes[m] = descartes.get(m, 0) + 1

    for c in cands:
        w = webs.get(c['web'], {}) if c['web'] else {}
        if not c['web']:
            descarta('sin web en el censo'); continue
        if not w.get('ok') or w.get('aparcado'):
            descarta('web caída o aparcada'); continue
        dom = dominio(w.get('url_final') or c['web'])
        if dom in vistos:
            descarta('duplicado (mismo grupo)'); continue
        vistos.add(dom)
        # Solo emails del propio dominio o que se parezcan a la empresa: nada de la matriz ni de distribuidoras
        emails = [e for e in w.get('emails', []) if email_es_de_la_empresa(e, dom, c['empresa'])
                  and email_publicable(e, w.get('email_origen', {}).get(e, '')) and dominio_recibe_email(e)]
        pref = [e for e in emails if re.sub(r'[^a-z]', '', e.split('@')[0]) in _GENERICOS_ATENCION]
        email = mejor_email(pref or emails, dom)
        tels = ([c['tel_censo']] if c['tel_censo'] else []) + [t for t in w.get('tels', []) if t != c['tel_censo']]
        if not email:
            descarta('sin email publicado'); continue
        if email in excl['emails'] or dom in excl['dominios'] or set(tels) & excl['tels']:
            descarta('ya en el panel o con baja'); continue
        mot, fuente, senal, caduca = motivo_luz(c, w, tels, 'luz')
        fijo = next((t for t in tels if tipo_tel(t) in ('fijo', 'tarificacion')), '')
        movil = next((t for t in tels if tipo_tel(t) == 'movil'), '')
        filas.append({
            'empresa': c['empresa'], 'telefono': movil, 'telefono_fijo': fijo, 'email': email, 'nombre': '', 'sector': 'Comercializadora de electricidad',
            'ciudad': c['ciudad'], 'provincia': c['provincia'], 'lote': 'Luz · CNMC', 'web': w.get('url_final') or c['web'],
            'origen': f'Censo de comercializadoras de la CNMC ({c["orden"]}) · teléfono y web', 'nicho': 'luz',
            'tipo_email': tipo_email(email), 'origen_email': w.get('email_origen', {}).get(email, ''), 'mx_ok': 'si',
            'motivo': mot, 'senal': senal, 'motivo_fuente': fuente, 'motivo_fecha': HOY.isoformat(), 'motivo_caduca': caduca,
            'canales': ','.join(k for k, v in (('email', email), ('llamada', fijo or movil)) if v),
            'notas': f'NIF {c["nif"]} · {c["razon_social"]}. Señales: {" ".join(sorted(w.get("senales", [])))}',
            'senales': ' '.join(sorted(w.get('senales', []))), 'fuente': 'cnmc_censo_comercializadoras', 'actividad': 'activa',
        })
    # Primero las que tienen señal propia (más fuerte que la normativa, que vale para todas)
    filas.sort(key=lambda r: (r['senal'] != 'atencion', r['empresa']))
    cols = COLS + [c for c in ('nicho', 'motivo_caduca') if c not in COLS]
    destino = SALIDA / 'nichoB'
    destino.mkdir(parents=True, exist_ok=True)
    p = destino / f'{HOY:%Y%m%d}_luz_email.csv'
    with p.open('w', encoding='utf-8-sig', newline='') as f:
        wr = csv.DictWriter(f, cols, delimiter=';', extrasaction='ignore')
        wr.writeheader()
        wr.writerows(filas)
    resumen = f'Luz (CNMC): {len(cands)} comercializadoras activas pequeñas → {len(filas)} con email publicado ({sum(1 for r in filas if r["senal"] == "atencion")} con señal propia)'
    print('\n' + resumen)
    print('   descartadas:', descartes)
    print('   archivo:', p)
    apunta(resumen, 'Descartadas y por qué: ' + ', '.join(f'{k} {v}' for k, v in descartes.items()) + '. CSV local en scratch/prospeccion/nichoB; no importado.', 'luz')


if __name__ == '__main__':
    {'luz': luz}[sys.argv[1] if len(sys.argv) > 1 else 'luz']()
