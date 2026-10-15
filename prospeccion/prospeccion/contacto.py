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
                         r'^(?:rrhh|talento|seleccion|candidatos|empleo|jobs|trabajo|curriculum|cv|privacidad|lopd|rgpd|dpo|dpd|protecciondedatos|facturacion|webmaster|wordpress|'
                         # Buzones que no son de contacto (auditoría del chat de Email): datos personales, inversores, prensa, denuncias
                         r'donnees\.?personnelles|ir|irteam|investor|inversores|presse|press|prensa|denuncias?|canal\.?(?:etico|denuncias)|compliance|whistleblow\w*|etica)[.@_-]', re.I)
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
# DNS públicos: el del sistema tardaba 2 s por consulta (cientos por provincia = el cuello de botella)
_RES = dns.resolver.Resolver(configure=False)
_RES.nameservers = ['1.1.1.1', '8.8.8.8', '9.9.9.9']


def _mx(dom: str) -> bool:
    for intento in range(2):
        try:
            return bool(_RES.resolve(dom, 'MX', lifetime=4))
        except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer):
            return False
        except Exception:
            continue
    return False


def dominio_recibe_email(email: str) -> bool:
    """El dominio tiene servidor de correo (registros MX). Evita rebotes, que hunden la reputación del envío."""
    dom = email.split('@')[-1]
    if dom not in _MX_CACHE:
        _MX_CACHE[dom] = _mx(dom)
    return _MX_CACHE[dom]


def precarga_mx(emails: list[str]) -> None:
    """Comprueba en paralelo los dominios de muchos emails de golpe (luego dominio_recibe_email tira de la caché)."""
    from concurrent.futures import ThreadPoolExecutor
    doms = sorted({e.split('@')[-1] for e in emails} - set(_MX_CACHE))
    with ThreadPoolExecutor(16) as ex:
        for d, ok in zip(doms, ex.map(_mx, doms)):
            _MX_CACHE[d] = ok


def _sin_tildes(s: str) -> str:
    import unicodedata
    return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')


def email_es_de_la_empresa(email: str, dominio_web: str, empresa: str) -> bool:
    """Descarta el email de la agencia que hizo la web (pie «diseñado por…»): solo vale el del propio dominio,
    un buzón gratuito (gmail…) o uno cuyo dominio se parezca al nombre de la empresa."""
    dom = email.split('@')[-1]
    dw = (dominio_web or '').lower().removeprefix('www.')
    if dw and (dom == dw or dom.endswith('.' + dw) or dw.endswith('.' + dom)):
        return True
    if es_email_personal(email):
        # gmail/hotmail: solo si lleva el nombre de la empresa (reformasgarcia@), no el de una persona (soyperez@)
        local = re.sub(r'[^a-z0-9]', '', email.split('@')[0].lower())
        nom = re.sub(r'[^a-z0-9 ]', '', _sin_tildes(empresa or '').lower())
        palabras = [p for p in nom.split() if len(p) >= 4 and p not in ('instalaciones', 'empresa', 'servicios', 'grupo', 'energia', 'energias')]
        return any(p in local for p in palabras) or any(p in local for p in re.sub(r'[^a-z0-9]', ' ', dw).split() if len(p) >= 5)
    raiz = dom.split('.')[0]
    nombre = re.sub(r'[^a-z0-9]', '', (empresa or '').lower())
    return len(raiz) >= 4 and (raiz in nombre or raiz in re.sub(r'[^a-z0-9]', '', dw))


_ADMIN_PUBLICA = re.compile(r'^(ajuntament|ayuntamiento|ayto|concello|udala|aj\.|alcaldia|secretaria\.ayto)|'
                            r'@(.*\.)?(gob\.es|gva\.es|gencat\.cat|xunta\.gal|juntadeandalucia\.es|jcyl\.es|aragon\.es|navarra\.es|euskadi\.eus|dip[a-z]*\.(es|cat))$', re.I)
_PAGINA_EQUIPO = re.compile(r'team|equipo|leadership|direcci[oó]n|management|board|consejo|directiva|who-we-are|nuestro-equipo|people|personas', re.I)


def email_publicable(email: str, origen_url: str) -> bool:
    """Reglas del chat de Email: nada de administraciones públicas, y nunca el email de una persona sacado
    de una página de equipo o dirección (solo valen los publicados como contacto)."""
    if _ADMIN_PUBLICA.search(email):
        return False
    if tipo_email(email) == 'nominativo' and _PAGINA_EQUIPO.search(origen_url or ''):
        return False
    return True


def mejor_email(emails: list[str], dominio_web: str) -> str:
    """Prioriza: del propio dominio y genérico de contacto > del propio dominio > otros."""
    dominio_web = (dominio_web or '').lower().removeprefix('www.')

    def peso(e):
        local, dom = e.split('@', 1)
        p = 0
        if dominio_web and (dom == dominio_web or dom.endswith('.' + dominio_web) or dominio_web.endswith(dom)):
            p += 10
        if local in ('atencion', 'atencionalcliente', 'clientes', 'info', 'contacto', 'hola', 'clinica', 'administracion', 'comercial',
                     'ventas', 'presupuestos', 'oficina'):
            p += 3
        if re.match(r'(reportes|comunicacion|prensa|press|marketing|mkt|newsletter|noticias)', local):
            p -= 4   # prensa y marketing: no es quien atiende a clientes
        if es_email_personal(e):
            p -= 2
        return -p

    return sorted(emails, key=peso)[0] if emails else ''


GENERICOS_LOCAL = ('info', 'contacto', 'contact', 'hola', 'hello', 'presupuestos', 'presupuesto', 'comercial', 'ventas', 'oficina',
                   'administracion', 'admin', 'atencion', 'atencionalcliente', 'clientes', 'pedidos', 'reservas', 'citas', 'gerencia', 'direccion', 'estudio', 'tienda')


def tipo_email(email: str) -> str:
    """generico (info@…), nominativo (juan@empresa.es) o gratuito (gmail/hotmail…)."""
    if not email:
        return ''
    if es_email_personal(email):
        return 'gratuito'
    local = re.sub(r'[^a-z]', '', email.split('@')[0])
    raiz_dom = re.sub(r'[^a-z]', '', email.split('@')[1].split('.')[0])
    return 'generico' if local in GENERICOS_LOCAL or local == raiz_dom else 'nominativo'  # empresa@empresa.es es genérico
