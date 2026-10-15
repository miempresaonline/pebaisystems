"""Motor de prospección: fuentes → rastreo de la web → actividad y encaje → limpieza → CSV.

Uso:
  python -m prospeccion.motor maps "reformas integrales" Valencia --sector Reformas --puntos 12
  python -m prospeccion.motor online --sector "Placas solares" --consulta "instalación placas solares autoconsumo presupuesto" ...

Salida (en scratch/prospeccion/, nunca en el repo): un CSV maestro con todo y tres listos para usar:
  *_whatsapp.csv (con móvil, importable en el panel), *_email.csv, *_llamadas.csv (fijos).
"""
import argparse
import asyncio
import csv
import datetime as dt
import re
from collections import Counter
from pathlib import Path

from .contacto import dominio_recibe_email, email_es_de_la_empresa, es_email_personal, mejor_email, tipo_tel
from .fuentes import buscador, google_maps
from .web import dominio, rastrea_varias

SALIDA = Path(__file__).resolve().parents[2] / 'scratch' / 'prospeccion'
HOY = dt.date.today()
# Cadenas y franquicias: no deciden en local, no son nuestro cliente
CADENAS = re.compile(r'asisa|sanitas|caser|adeslas|vitaldent|dentix|ikea|leroy|bricomart|obramat|iberdrola|endesa|repsol|naturgy|holaluz|'
                     r'securitas|prosegur|carrefour|mercadona|el corte ingl|schmidt|leroy merlin|porcelanosa|bauhaus', re.I)

# Webs que no son el cliente final: administraciones, directorios y comparadores (venden leads, no los atienden), formación, software
NO_CLIENTE = re.compile(r'junta de |gobierno|ayuntamiento|diputaci|consejer|ministerio|generalitat|xunta|\.gob\.|gencat|gva\.es|juntadeandalucia|madrid\.org|'
                        r'directorio|comparador|compara |mejores instaladores|evaluador|portal para|presupuestos? de .* gratis|'
                        r'school|escuela|máster|master en|curso|formación online|software|saas|solar design', re.I)

def raices(texto: str) -> set[str]:
    """Raíces de 6 letras de las palabras del nicho («reformas integrales» → reform, integr; con 5, «inter» casaba con «internet»). Sirven para comprobar que el negocio es del nicho."""
    stop = {'empresa', 'empresas', 'servicio', 'servicios', 'valencia', 'madrid', 'barcelona', 'españa', 'presupuesto', 'mejor', 'mejores'}
    return {w[:6] for w in re.findall(r'[a-záéíóúñ]{5,}', texto.lower()) if w not in stop}


_GENERICO = re.compile(r'^(inicio|home|portada|bienvenid|placas|instalaci|paneles|energ[ií]a|electricidad|empresa|presupuesto|autoconsumo|tienda)', re.I)


def nombre_empresa(w: dict, dom: str) -> str:
    """Nombre comercial: el que declara la web (og:site_name); si no, el trozo del título que no es un eslogan; si no, el dominio."""
    if w.get('nombre_web') and not _GENERICO.search(w['nombre_web']):
        return w['nombre_web']
    for trozo in re.split(r'\s[|\-–·:]\s', w.get('titulo', '')):
        t = trozo.strip()
        if t and len(t) <= 40 and not _GENERICO.search(t):
            return t
    raiz = dom.split('.')[0] if dom else ''
    return raiz.replace('-', ' ').title()


def puntua(c: dict, w: dict) -> None:
    """Actividad: ¿está en movimiento? Encaje: ¿tiene el problema que resolvemos (recibe y paga por leads)?"""
    act, motivos = 0, []
    s = w.get('senales', set())
    if w.get('ok') and not w.get('aparcado'):
        act += 2; motivos.append('web activa')
    elif c['web']:
        act -= 3; motivos.append('web caída' if not w.get('aparcado') else 'web aparcada o en construcción')
    if w.get('anyo_web'):
        if w['anyo_web'] >= HOY.year - 1:
            act += 2; motivos.append(f'web de {w["anyo_web"]}')
        elif w['anyo_web'] <= HOY.year - 3:
            act -= 1; motivos.append(f'web sin tocar desde {w["anyo_web"]}')
    if w.get('sitemap_lastmod'):
        dias = (HOY - dt.date.fromisoformat(w['sitemap_lastmod'])).days
        if dias <= 365:
            act += 2; motivos.append(f'actualizada hace {dias} días')
        elif dias > 1100:
            act -= 1; motivos.append('sin actualizar en 3 años')
    if c['resenas'] >= 30:
        act += 2; motivos.append(f'{c["resenas"]} reseñas')
    elif c['resenas'] >= 5:
        act += 1; motivos.append(f'{c["resenas"]} reseñas')
    if s & {'anuncios_google', 'pixel_meta'}:
        act += 2; motivos.append('invierte en anuncios')
    if w.get('redes'):
        act += 1
    c['actividad_puntos'] = act
    c['actividad'] = 'activa' if act >= 4 else 'probable' if act >= 2 else 'dudosa'
    c['actividad_motivos'] = ', '.join(motivos)

    enc, em = 0, []
    if 'anuncios_google' in s:
        enc += 3; em.append('anuncios en Google')
    if 'pixel_meta' in s:
        enc += 2; em.append('píxel de Meta (anuncios en redes)')
    if s & {'formulario', 'boton_whatsapp'}:
        enc += 1; em.append('recibe contactos por web/WhatsApp')
    if 'chat_web' not in s:
        enc += 1; em.append('sin chat automático')
    if c['resenas'] >= 50:
        enc += 1; em.append('volumen de clientes')
    c['encaje_puntos'] = enc
    c['encaje'] = 'alto' if enc >= 4 else 'medio' if enc >= 2 else 'bajo'
    c['encaje_motivos'] = ', '.join(em)


def enriquece(cands: list[dict], nicho: set[str]) -> list[dict]:
    webs = asyncio.run(rastrea_varias([c['web'] for c in cands if c['web']]))
    dom_count = Counter(dominio(c['web']) for c in cands if c['web'])
    out = []
    for c in cands:
        c['nicho'] = nicho
        w = webs.get(c['web'], {}) if c['web'] else {}
        tels = ([c['telefono']] if c['telefono'] else []) + [t for t in w.get('tels', []) if t != c['telefono']]
        moviles = [t for t in tels if tipo_tel(t) == 'movil']
        fijos = [t for t in tels if tipo_tel(t) in ('fijo', 'tarificacion')]
        dom = dominio(w.get('url_final') or c['web'])
        emails = [e for e in w.get('emails', []) if email_es_de_la_empresa(e, dom, c['empresa']) and dominio_recibe_email(e)]
        email = mejor_email(emails, dom)
        if c['fuente'] == 'buscador':
            c['empresa'] = nombre_empresa(w, dom) or c['empresa']
        c.update({
            'movil': w.get('whatsapp') if w.get('whatsapp') in moviles else (moviles[0] if moviles else ''),
            'moviles_extra': ' '.join(moviles[1:4]), 'fijo': fijos[0] if fijos else '', 'email': email,
            'emails_extra': ' '.join(e for e in emails if e != email)[:200], 'email_personal': bool(email and es_email_personal(email)),
            'whatsapp_web': w.get('whatsapp', ''), 'redes': ' '.join(w.get('redes', {}).values())[:300],
            'senales': ' '.join(sorted(w.get('senales', []))), 'web_final': w.get('url_final') or c['web'],
            'titulo_web': w.get('titulo', ''),
            'del_nicho': bool(c['nicho'] & raices(' '.join([c['empresa'], w.get('titulo', ''), w.get('descripcion', ''), w.get('h1', '')]))),
            'cadena': bool(CADENAS.search(c['empresa'] + ' ' + dom) or (c['fuente'] == 'google_maps' and dom and dom_count[dom] > 2)),
            # De dónde sale cada contacto (lo exige la ley y el panel)
            'origen_contacto': c['origen_dato'] if (c['telefono'] and (c['telefono'] in moviles[:1] or not moviles)) else
                               'Web de la empresa · ' + ('botón de WhatsApp' if w.get('whatsapp') else 'página de contacto / aviso legal'),
        })
        puntua(c, w)
        out.append(c)
    return out


def descarta(c: dict, vistos_tel: set, vistos_dom: set) -> str:
    """Motivo para no entregarlo, o '' si vale."""
    if c['cadena']:
        return 'cadena o franquicia'
    if not c['del_nicho']:
        return 'no es del nicho'
    if NO_CLIENTE.search(' '.join([c['empresa'], c.get('titulo_web', ''), c['web_final']])):
        return 'administración, directorio o formación'
    if c['fuente'] == 'buscador' and not (dominio(c['web_final']).endswith('.es') or c['movil'] or c['fijo']):
        return 'no parece de España'
    if 'cerrado' in (c['extra'].get('estado_maps') or '').lower():
        return 'cerrado en Google Maps'
    if c['actividad'] == 'dudosa':
        return 'no hay señales de que esté activo'
    if not (c['movil'] or c['fijo'] or c['email']):
        return 'sin ningún contacto'
    d = dominio(c['web_final'])
    claves = [t for t in (c['movil'], c['fijo']) if t]
    if any(t in vistos_tel for t in claves) or (d and d in vistos_dom):
        return 'duplicado'
    vistos_tel.update(claves)
    if d:
        vistos_dom.add(d)
    return ''


COLS = ['empresa', 'telefono', 'telefono_fijo', 'email', 'nombre', 'sector', 'ciudad', 'web', 'origen', 'notas',
        'actividad', 'encaje', 'emails_extra', 'moviles_extra', 'redes', 'resenas', 'valoracion', 'senales', 'fuente']


def fila(c: dict) -> dict:
    notas = f'Actividad {c["actividad"]}: {c["actividad_motivos"]}. Encaje {c["encaje"]}: {c["encaje_motivos"]}.'
    if c['email_personal']:
        notas += ' Email personal (gmail/hotmail…).'
    return {'empresa': c['empresa'], 'telefono': c['movil'], 'telefono_fijo': c['fijo'], 'email': c['email'], 'nombre': '',
            'sector': c['sector'], 'ciudad': c['ciudad'], 'web': c['web_final'], 'origen': c['origen_contacto'], 'notas': notas,
            'actividad': c['actividad'], 'encaje': c['encaje'], 'emails_extra': c['emails_extra'], 'moviles_extra': c['moviles_extra'],
            'redes': c['redes'], 'resenas': c['resenas'], 'valoracion': c['valoracion'], 'senales': c['senales'], 'fuente': c['fuente']}


def guarda(nombre: str, cands: list[dict], limite: int) -> None:
    SALIDA.mkdir(parents=True, exist_ok=True)
    vt, vd = set(), set()
    buenos, motivos = [], Counter()
    # Primero los que más encajan y más activos están
    for c in sorted(cands, key=lambda c: (-c['encaje_puntos'], -c['actividad_puntos'])):
        m = descarta(c, vt, vd)
        if m:
            motivos[m] += 1
        else:
            buenos.append(c)
    buenos = buenos[:limite]

    def escribe(sufijo, filas):
        p = SALIDA / f'{nombre}{sufijo}.csv'
        with p.open('w', encoding='utf-8-sig', newline='') as f:
            wr = csv.DictWriter(f, COLS, delimiter=';')
            wr.writeheader()
            wr.writerows(filas)
        return p

    todas = [fila(c) for c in buenos]
    escribe('', todas)
    escribe('_whatsapp', [r for r in todas if r['telefono']])
    escribe('_email', [r for r in todas if r['email']])
    escribe('_llamadas', [r for r in todas if r['telefono_fijo'] and not r['telefono']])
    n = len(todas)
    print(f'\n== {nombre}: {len(cands)} candidatos → {n} entregados')
    print(f'   con móvil (WhatsApp): {sum(1 for r in todas if r["telefono"])} · con email: {sum(1 for r in todas if r["email"])} · '
          f'con fijo: {sum(1 for r in todas if r["telefono_fijo"])} · solo fijo: {sum(1 for r in todas if r["telefono_fijo"] and not r["telefono"] and not r["email"])}')
    print(f'   actividad: {dict(Counter(r["actividad"] for r in todas))} · encaje: {dict(Counter(r["encaje"] for r in todas))}')
    print(f'   descartados: {dict(motivos)}')
    print(f'   archivos en {SALIDA}')


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest='modo', required=True)
    m = sub.add_parser('maps')
    m.add_argument('busqueda', help='una o varias formas de buscar el nicho, separadas por comas'); m.add_argument('ciudad'); m.add_argument('--sector', required=True)
    m.add_argument('--puntos', type=int, default=12); m.add_argument('--limite', type=int, default=50)
    o = sub.add_parser('online')
    o.add_argument('--sector', required=True); o.add_argument('--consulta', action='append', required=True)
    o.add_argument('--paginas', type=int, default=2); o.add_argument('--limite', type=int, default=50)
    for p in (m, o):
        p.add_argument('--palabras', default='', help='más palabras del nicho para reconocer negocios que lo son')
    a = ap.parse_args()
    if a.modo == 'maps':
        cands = google_maps([b.strip() for b in a.busqueda.split(',') if b.strip()], a.ciudad, a.sector, max_puntos=a.puntos)
        nombre = f'{HOY:%Y%m%d}_maps_{re.sub(r"[^a-z0-9]+", "-", (a.sector + "-" + a.ciudad).lower())}'
    else:
        cands = buscador(a.consulta, a.sector, paginas=a.paginas)
        nombre = f'{HOY:%Y%m%d}_online_{re.sub(r"[^a-z0-9]+", "-", a.sector.lower())}'
    # En online las consultas llevan regiones y palabras de relleno («tienda», «online»): el nicho sale solo del sector y las palabras
    nicho = raices(a.sector + ' ' + (a.busqueda if a.modo == 'maps' else '') + ' ' + (a.palabras or ''))
    print(f'Candidatos de la fuente: {len(cands)}. Raíces del nicho: {sorted(nicho)}. Rastreando sus webs…')
    guarda(nombre, enriquece(cands, nicho), a.limite)


if __name__ == '__main__':
    main()
