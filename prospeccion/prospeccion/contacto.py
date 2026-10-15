"""Teléfonos y emails: extraer, normalizar y clasificar.

Se guarda TODO lo que sea contacto de empresa:
  - móvil (6/7)  -> WhatsApp
  - fijo  (8/9)  -> llamadas en frío
  - email        -> secuencias de email
"""
import re

import dns.resolver

# Números españoles: +34 / 0034 opcional y 9 cifras que empiezan por 6, 7, 8 o 9, con separadores habituales.
_TEL_RE = re.compile(r'(?<![\d/])(?:(?:\+|00)\s?34[\s.\-]?)?([6789](?:[\s.\-]?\d){8})(?![\d])')
_EMAIL_RE = re.compile(r'[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,24}')
_EMAIL_JUNK = re.compile(r'\.(png|jpe?g|gif|webp|svg|css|js)$|example\.|sentry|wixpress|@sentry|godaddy|domain\.com|tudominio|email\.com|correo\.com|'
                         r'@2x|^[0-9a-f]{20,}@|noreply|no-reply|@(?:sentry|wix)|@(?:sitio|ejemplo|empresa|tuempresa|miempresa|midominio|dominio|correo|mail)\.(?:com|es)$|'
                         r'^(?:rrhh|talento|seleccion|candidatos|empleo|jobs|trabajo|curriculum|cv|privacidad|lopd|rgpd|dpo|protecciondedatos|facturacion|webmaster|wordpress)[.@_-]', re.I)
_GENERICOS_PERSONALES = ('gmail.', 'hotmail.', 'outlook.', 'yahoo.', 'icloud.', 'live.', 'msn.', 'telefonica.net')


def normaliza_tel(texto: str) -> str:
    """Devuelve el número español como 9 cifras, o '' si no lo es."""
    d = re.sub(r'\D', '', texto or '')
    if d.startswith('0034'):
        d = d[4:]
    elif d.startswith('34') and len(d) == 11:
        d = d[2:]
    return d if re.fullmatch(r'[6789]\d{8}', d) else ''


def tipo_tel(num9: str) -> str:
    if not num9:
        return ''
    if num9[0] in '67':
        return 'movil'
    if num9.startswith(('800', '900', '901', '902', '905', '803', '806', '807')):
        return 'tarificacion'   # gratuitos y de pago: valen para llamar, no para WhatsApp
    return 'fijo'


def tels_en_texto(texto: str) -> list[str]:
    out = []
    for m in _TEL_RE.finditer(texto or ''):
        n = normaliza_tel(m.group(0))
        # Fuera secuencias que no son teléfonos (cifras repetidas, NIF/códigos sueltos)
        if n and len(set(n)) > 2 and n not in out:
            out.append(n)
    return out


def limpia_email(e: str) -> str:
    e = (e or '').strip().strip('.,;:()[]<>"\'').lower()
    e = e.replace('mailto:', '').split('?')[0]
    if not _EMAIL_RE.fullmatch(e) or _EMAIL_JUNK.search(e) or len(e) > 80:
        return ''
    return e


def emails_en_texto(texto: str) -> list[str]:
    texto = re.sub(r'\s*[\[(]\s*(?:at|arroba)\s*[\])]\s*', '@', texto or '', flags=re.I)
    texto = re.sub(r'\s*[\[(]\s*(?:dot|punto)\s*[\])]\s*', '.', texto, flags=re.I)
    out = []
    for m in _EMAIL_RE.finditer(texto):
        e = limpia_email(m.group(0))
        if e and e not in out:
            out.append(e)
    return out


def es_email_personal(email: str) -> bool:
    """gmail/hotmail…: sirve, pero suele ser el del dueño (dato personal) y entrega peor."""
    return email.split('@')[-1].startswith(_GENERICOS_PERSONALES)


_MX_CACHE: dict[str, bool] = {}


def dominio_recibe_email(email: str) -> bool:
    """El dominio tiene servidor de correo (registros MX). Evita rebotes, que hunden la reputación del envío."""
    dom = email.split('@')[-1]
    if dom not in _MX_CACHE:
        try:
            _MX_CACHE[dom] = bool(dns.resolver.resolve(dom, 'MX', lifetime=6))
        except Exception:
            _MX_CACHE[dom] = False
    return _MX_CACHE[dom]


def email_es_de_la_empresa(email: str, dominio_web: str, empresa: str) -> bool:
    """Descarta el email de la agencia que hizo la web (pie «diseñado por…»): solo vale el del propio dominio,
    un buzón gratuito (gmail…) o uno cuyo dominio se parezca al nombre de la empresa."""
    dom = email.split('@')[-1]
    dw = (dominio_web or '').lower().removeprefix('www.')
    if dw and (dom == dw or dom.endswith('.' + dw) or dw.endswith('.' + dom)):
        return True
    if es_email_personal(email):
        return True
    raiz = dom.split('.')[0]
    nombre = re.sub(r'[^a-z0-9]', '', (empresa or '').lower())
    return len(raiz) >= 4 and (raiz in nombre or raiz in re.sub(r'[^a-z0-9]', '', dw))


def mejor_email(emails: list[str], dominio_web: str) -> str:
    """Prioriza: del propio dominio y genérico de contacto > del propio dominio > otros."""
    dominio_web = (dominio_web or '').lower().removeprefix('www.')

    def peso(e):
        local, dom = e.split('@', 1)
        p = 0
        if dominio_web and (dom == dominio_web or dom.endswith('.' + dominio_web) or dominio_web.endswith(dom)):
            p += 10
        if local in ('info', 'contacto', 'hola', 'clinica', 'administracion', 'comercial', 'ventas', 'presupuestos', 'oficina'):
            p += 3
        if es_email_personal(e):
            p -= 2
        return -p

    return sorted(emails, key=peso)[0] if emails else ''
