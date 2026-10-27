"""Tanda de un nicho por toda España, provincia a provincia. Reanudable: si se corta, sigue por donde iba.

Cada provincia: la capital en detalle (9 zonas de 3 km) + sus municipios con más población (OpenStreetMap).
Solo se queda con las empresas cuyo código postal es de esa provincia (las de la frontera no salen dos veces).

Uso:
  python -m prospeccion.tanda energia                 # todas las provincias pendientes
  python -m prospeccion.tanda energia --provincias Valencia Soria
  python -m prospeccion.tanda energia --unir          # solo junta las provincias hechas en un CSV
"""
import argparse
import math
import re
import csv
import time
from pathlib import Path

from .fuentes import PROVINCIAS_CP, geocodifica, google_maps, rejilla
from .motor import COLS, HOY, SALIDA, apunta, enriquece, guarda, raices

NICHOS = {
    # Decisión de Daniel (15/10/2026): EMPRESAS DE PLACAS SOLARES (baterías y aerotermia como complemento)
    'energia': {
        'sector': 'Empresas de placas solares',
        'lote': 'Solar',
        'busquedas': ['empresa de placas solares', 'instalador de placas solares', 'instalación fotovoltaica autoconsumo',
                      'energía solar fotovoltaica empresa'],
        'palabras': 'placas solares fotovoltaica autoconsumo paneles solar renovables energía',
        'reglas': {'requiere_hace': True, 'sin_autonomos': True, 'dedicacion': True, 'solo_activas': True, 'solo_solar': True},
        'email_nicho': 'energia',   # las válidas sin móvil y con email van a email_prospectos con este nicho
    },
    # Segunda pasada solar (orden de Daniel, 19/10): otras formas de buscar y más municipios, hasta 200 en la lista de email
    'solar2': {
        'sector': 'Empresas de placas solares',
        'lote': 'Solar',
        'busquedas': ['instalador fotovoltaico', 'autoconsumo solar', 'paneles solares instalación', 'energía solar empresa instaladora',
                      'placas solares'],
        'palabras': 'placas solares fotovoltaica autoconsumo paneles solar renovables energía',
        'reglas': {'requiere_hace': True, 'sin_autonomos': True, 'dedicacion': True, 'solo_activas': True, 'solo_solar': True},
        'email_nicho': 'energia',
        'max_pueblos': 40,
        'objetivo_email': 200,       # se para (y deja PAUSA) cuando email_prospectos «energia» llega a este número
    },
    # Nicho B por email: operadores locales de internet (fibra/radio) de pueblos y comarcas
    'fibra': {
        'sector': 'Operador local de telecomunicaciones',
        'nicho_email': 'fibra',
        'busquedas': ['proveedor de servicios de internet', 'fibra óptica internet operador', 'operador de telecomunicaciones local',
                      'internet rural wifi'],
        'palabras': 'fibra óptica internet operador telecomunicaciones banda ancha wifi telefonía conectividad',
    },
}

# Barrido continuo de instaladoras solares (orden de Daniel, 21/10): el scraper no se queda dormido. Cada vuelta recorre
# toda España con otro grupo de búsquedas; al acabar empieza la siguiente (y al agotar los grupos, vuelven a rotar y solo
# salen las nuevas: las que ya están en el panel se excluyen). Mismos filtros: solo instaladoras de placas solares, y la IA
# lee la web de cada una antes de que entre en el panel.
GRUPOS_SOLAR = [
    ['instaladora fotovoltaica', 'instalación de placas solares', 'autoconsumo fotovoltaico empresa'],
    ['instaladores de paneles solares', 'placas solares para viviendas', 'placas solares para empresas'],
    ['energía solar instaladores', 'fotovoltaica instalación', 'autoconsumo solar instaladora'],
    ['empresa fotovoltaica', 'instalador solar', 'placas solares y baterías instalación'],
    ['instalaciones fotovoltaicas', 'empresa de energía solar', 'paneles fotovoltaicos instalación'],
]
# Nichos nuevos del 21/10 (Daniel): llenan su carpeta en Prospectos; los agentes NO les escriben hasta que él lo active.
# Sin IA en la importación (la IA de hoy está pensada para placas): entran por filtros estrictos y se revisan al activarlos.
_GRANDES_CLIMA = (r'elecnor|eulen|clece|ferrovial|cofely|engie|dalkia|veolia|sacyr|acciona|imesapi|imtech|ortiz|grupo\s*vaillant|'
                  r'daikin|carrier|mitsubishi|fujitsu|panasonic|lg electronics|saunier|baxi|junkers|bosch|leroy|media\s*markt|'
                  r'el corte ingl|carrefour|bricomart|obramat|bauhaus|brico ?depot|conforama|worten|fnac')
_GRANDES_FORMACION = (r'masterd|master\s*d\b|cesur|ceac|medac|campus\s*training|ilerna|unir\b|uned|universidad|'
                      r'cef\s*[-.]?\s*udima|udima|academia\s*adams|adams formaci|tecnos\b|opositatest|'
                      r'vaughan|kids\s*&?\s*us|wall\s*street|berlitz|british council|opening english|dexway|inlingua|'
                      r'american language academy|fundaci[oó]n|ayuntamiento|sepe|inem')
NICHOS_NUEVOS = {
    # Empresas serias de climatización: con web propia, activas, con varios técnicos (reseñas) y sin gigantes ni tiendas
    'climatizacion': {
        'sector': 'Empresas de climatización', 'lote': 'Climatización', 'nicho_panel': 'climatizacion', 'email_nicho': 'climatizacion', 'ia': False,
        'palabras': 'climatización aire acondicionado calefacción aerotermia bomba de calor frío conductos instalación mantenimiento',
        'reglas': {'solo_activas': True, 'sin_autonomos': True, 'requiere_web': True, 'min_resenas': 15, 'grandes': _GRANDES_CLIMA,
                   'nom_no': r'electricista|electricidad|el[eé]ctric|reformas|fontaner|electrodom|\bsat\b|reparaciones|multiservicio|tienda|\bgas\b|coche|autom[oó]vil|termos'},
        'cat_ok': r'climatiz|aire acondicionado|calefacci|aerotermia|bomba de calor|frigor|refrigeraci|hvac|ventilaci|calderas',
        'cat_no': r'electricista|instalaciones el[eé]ctricas|reforma|fontaner|tienda|comercio|electrodom|ferreter|distribuidor|mayorista|'
                  r'fabricante|instalador de gas|autom[oó]vil|coche|taller|multiservicio|reparaci[oó]n de electrodom|alquiler',
        'nombre_ok': r'climatiz|clima\b|aire acondicionado|calefacci|aerotermia|fr[ií]o|confort t[eé]rmico',
        'grupos': [['empresa de climatización', 'instalación de aire acondicionado', 'empresa de aire acondicionado'],
                   ['instaladores de climatización', 'aerotermia instalación empresa', 'calefacción y climatización'],
                   ['servicio técnico de aire acondicionado', 'climatización para empresas', 'instalación de bomba de calor']],
    },
    # Formación: tres tipos distintos, cada uno con su carpeta. Un solo scraper los alterna (ver SERIES)
    'oposiciones': {
        'sector': 'Academias de oposiciones', 'lote': 'Oposiciones', 'nicho_panel': 'oposiciones', 'email_nicho': 'oposiciones', 'ia': False,
        'palabras': 'oposiciones opositores academia preparación temario convocatoria plazas guardia civil policía docentes',
        'reglas': {'solo_activas': True, 'requiere_web': True, 'permite_formacion': True, 'grandes': _GRANDES_FORMACION,
                   'requiere_palabra': r'oposici|opositor',
                   'nom_no': r'refuerzo|repaso|apoyo escolar|clases particulares|bachiller|academia universitaria|universitaria|selectividad|evau|ebau|idioma|ingl[eé]s|english|language|autoescuela|\bfp\b|formaci[oó]n profesional|sport|deporte|entrenamiento'},
        'cat_ok': r'oposici',
        'cat_no': r'autoescuela|refuerzo|clases particulares|idioma|ingl[eé]s|librer|editorial|sindicato|guarder|colegio|instituto p[uú]blico|m[uú]sica|baile|danza',
        'nombre_ok': r'oposici|opositor',
        'grupos': [['academia de oposiciones', 'preparación de oposiciones', 'centro de oposiciones'],
                   ['academia oposiciones guardia civil policía', 'academia oposiciones docentes maestros', 'academia oposiciones administrativo']],
    },
    'formacion': {
        'sector': 'Centros privados de formación especializada', 'lote': 'Formación especializada', 'nicho_panel': 'formacion', 'email_nicho': 'formacion', 'ia': False,
        'palabras': 'formación cursos centro de formación especializada profesional certificado técnico escuela privada',
        'reglas': {'solo_activas': True, 'requiere_web': True, 'permite_formacion': True, 'grandes': _GRANDES_FORMACION, 'no_oposiciones_ni_idiomas': True,
                   'requiere_palabra': r'formaci|curso|certificad|especializ|m[aá]ster|capacitaci|escuela profesional',
                   'nom_no': r'colegio|school\b|conservatori|n[aá]utic|\bcifp\b|\bies\b|\bcfp\b|municipal|p[uú]blic|psicolog|residencia|osteopat|fisioter|danza|dansa|ballet|teatro|m[uú]sica|gimn|universi|facultad|escola t[eè]cnica|escuela p[ií]a|sagrada|salesian|concertad|infantil|guarder|autoescuela|refuerzo|repaso|apoyo escolar|clases particulares|bachiller|academia universitaria|universitaria|selectividad|evau|ebau'},
        'cat_ok': r'centro de formaci|formaci[oó]n profesional|academia|capacitaci|escuela de formaci|instituto de formaci|escuela de negocios|escuela t[eé]cnica',
        'cat_no': r'oposici|idioma|ingl[eé]s|autoescuela|guarder|colegio|gimnasio|refuerzo|clases particulares|universidad|m[uú]sica|baile|danza|conducci[oó]n|instituto de educaci[oó]n secundaria',
        'nombre_ok': r'formaci|escuela|academia|instituto|training|campus',
        'grupos': [['centro de formación privado', 'centro de formación especializada', 'escuela de formación profesional privada'],
                   ['cursos de formación profesional', 'academia de formación técnica', 'cursos certificado de profesionalidad']],
    },
    'idiomas': {
        'sector': 'Escuelas de idiomas', 'lote': 'Idiomas', 'nicho_panel': 'idiomas', 'email_nicho': 'idiomas', 'ia': False,
        'palabras': 'idiomas inglés academia clases alemán francés cambridge escuela de idiomas',
        'reglas': {'solo_activas': True, 'requiere_web': True, 'permite_formacion': True, 'grandes': _GRANDES_FORMACION + r'|steve ?& ?maggie|helen doron|kumon|smartick',
                   'requiere_palabra': r'idioma|ingl[eé]s|english|language|franc[eé]s|alem[aá]n|italiano|chino|japon[eé]s|portugu[eé]s|lengua|cambridge|ielts|toefl',
                   'nom_no': r'danza|dansa|ballet|teatro|m[uú]sica|extranjero|summer|campamento|traduc|intercambio|coach|profesora? particular|refuerzo|repaso|apoyo escolar|clases particulares|bachiller|academia universitaria|universitaria|selectividad|evau|ebau'},
        'cat_ok': r'idioma|ingl[eé]s|language|lengua',
        'cat_no': r'refuerzo|clases particulares|traduc|guarder|colegio|campamento|autoescuela|m[uú]sica|baile|danza',
        'nombre_ok': r'idioma|ingl[eé]s|english|language|lingu|academia',
        'grupos': [['academia de inglés', 'escuela de idiomas', 'academia de idiomas'],
                   ['clases de inglés', 'centro de idiomas', 'academia de inglés para adultos y niños']],
    },
    # Nichos del 27/10 (Daniel): «únicamente las que encajen con nosotros». Independientes con equipo, web propia y mucho
    # contacto de clientes por teléfono, WhatsApp o portales; fuera cadenas, franquicias y aseguradoras. Sin Gemini: después de
    # estos filtros, el Redactor (Claude) lee la web de cada una y saca las que no encajan (api/redactor.php, 'revision').
    'dentales': {
        'sector': 'Clínicas dentales', 'lote': 'Clínicas dentales', 'nicho_panel': 'dentales', 'email_nicho': 'dentales', 'ia': False, 'auditoria': False,
        'palabras': 'clínica dental dentista odontología implantes ortodoncia invisalign estética dental higiene primera visita cita',
        'reglas': {'solo_activas': True, 'sin_autonomos': True, 'requiere_web': True, 'min_resenas': 20,
                   'grandes': r'vitaldent|dentix|sanitas|adeslas|\bdkv\b|caser|asisa|quir[oó]n|vivanta|unidental|dental\s*company|donte|'
                              r'clinica\s*baviera|idental|\bmapfre\b|mutua|clinicas?\s*w\b|odontologia\s*integral\s*sl\b|el corte ingl|carrefour',
                   'requiere_palabra': r'dental|dentista|odontolog|ortodoncia|implant',
                   'nom_no': r'laboratorio|prot[eé]sico|dep[oó]sito dental|suministros|hospital|universi|facultad|veterinari|mascota|seguros?'},
        'cat_ok': r'dentista|dental|odont[oó]log|ortodonc|cirujano maxilofacial|periodonc|endodonc|implant',
        'cat_no': r'laboratorio|prot[eé]sico|suministr|tienda|hospital|universidad|veterinari|farmacia|seguro',
        'nombre_ok': r'dental|dentist|odont|ortodonc|sonrisa|smile|implant|boca',
        'grupos': [['clínica dental', 'dentista', 'clínica de odontología'],
                   ['clínica de implantes dentales', 'ortodoncia invisalign clínica', 'estética dental clínica']],
    },
    'inmobiliarias': {
        'sector': 'Agencias inmobiliarias', 'lote': 'Inmobiliarias', 'nicho_panel': 'inmobiliarias', 'email_nicho': 'inmobiliarias', 'ia': False, 'auditoria': False,
        'palabras': 'inmobiliaria pisos casas venta alquiler viviendas agencia inmobiliaria tasación captación propietarios',
        'reglas': {'solo_activas': True, 'sin_autonomos': True, 'requiere_web': True, 'min_resenas': 20,
                   'grandes': r'tecnocasa|century\s*21|re/?max|engel\s*&?\s*v[oö]lkers|redpiso|donpiso|look\s*&?\s*find|solvia|haya\s*real|'
                              r'servihabitat|altamira|aliseda|housfy|housell|comprarcasa|gilmar|lucas\s*fox|keller\s*williams|exp\s*realty|'
                              r'coldwell|sotheby|idealista|fotocasa|habitaclia|pisos\.com|unicaja|bbva|santander|caixa|sareb|anticipa|uvi\b',
                   'requiere_palabra': r'inmobiliari|pisos|viviendas|venta|alquiler|propiedad',
                   'nom_no': r'promotora|promociones|constructora|administraci[oó]n de fincas|administrador de fincas|tasaci[oó]n|tasadora|'
                             r'vacacional|apartamentos tur|hotel|hostal|obra nueva|seguros|abogad|gestor[ií]a|banco'},
        'cat_ok': r'inmobiliari|agencia de bienes ra[ií]ces|agente inmobiliario|real estate',
        'cat_no': r'promotor|constructor|administrador de fincas|tasador|alquiler vacacional|apartamento tur|hotel|gestor|abogad|banco|seguro|reforma',
        'nombre_ok': r'inmobiliari|inmo\b|fincas|pisos|casas|hogar|home|propiedad|real estate|house',
        'grupos': [['agencia inmobiliaria', 'inmobiliaria', 'inmobiliaria venta y alquiler de pisos'],
                   ['agencia inmobiliaria local', 'inmobiliaria compraventa viviendas', 'gestión de alquileres inmobiliaria']],
    },
}
NICHOS.update(NICHOS_NUEVOS)
# Cada scraper recorre una serie: solar (placas), climatización, formación (alterna oposiciones → formación → idiomas),
# y desde el 27/10 clínicas dentales e inmobiliarias
SERIES = {'solar': ['solar'], 'climatizacion': ['climatizacion'], 'formacion': ['oposiciones', 'formacion', 'idiomas'],
          'dental': ['dentales'], 'inmobiliaria': ['inmobiliarias']}
FALLOS_MAX = 3   # una provincia que falla 3 veces en una vuelta se salta para no atascar el barrido


def _carpeta(nicho: str) -> Path:
    return SALIDA / 'tandas' / nicho


def _hecha(nicho: str, prov: str) -> bool:
    return (_carpeta(nicho) / f'{nicho}_{prov.lower().replace(" ", "-")}.csv').exists()


def _fallos(nicho: str) -> dict:
    import json
    f = _carpeta(nicho) / 'fallos.json'
    return json.loads(f.read_text(encoding='utf-8')) if f.exists() else {}


def pendientes_de(nicho: str, lista: list) -> list:
    fallos = _fallos(nicho)
    return [p for p in lista if not _hecha(nicho, p) and fallos.get(p, 0) < FALLOS_MAX]


def pasada(serie: str) -> str:
    """La vuelta que toca de una serie: la primera con provincias pendientes. Solar sigue con su propia numeración.
    En formación, cada vuelta es de uno de sus tres tipos (oposiciones, formación, idiomas) por turnos."""
    if serie == 'solar':
        return pasada_solar()
    subs = SERIES[serie]
    n = 1
    while True:
        sub = subs[(n - 1) % len(subs)]
        v = (n - 1) // len(subs) + 1
        nombre = f'{sub}_v{v}'
        base = NICHOS_NUEVOS[sub]
        NICHOS[nombre] = dict(base, busquedas=base['grupos'][(v - 1) % len(base['grupos'])], tramo=v - 1, cob=sub)
        if pendientes_de(nombre, ORDEN):
            return nombre
        n += 1


def pasada_solar() -> str:
    """La vuelta del barrido continuo que toca: la primera que tenga provincias pendientes. La registra en NICHOS."""
    n = 1
    while True:
        nombre = f'solar_v{n}'
        NICHOS[nombre] = dict(NICHOS['solar2'], busquedas=GRUPOS_SOLAR[(n - 1) % len(GRUPOS_SOLAR)], tramo=max(0, n - 1))
        NICHOS[nombre].pop('objetivo_email', None)
        if pendientes_de(nombre, ORDEN):
            return nombre
        n += 1


# Nombre para buscar la provincia en OpenStreetMap cuando el oficial no basta
_OSM = {'Illes Balears': 'Illes Balears', 'Las Palmas': 'Provincia de Las Palmas', 'Santa Cruz de Tenerife': 'Provincia de Santa Cruz de Tenerife',
        'Madrid': 'Comunidad de Madrid', 'Asturias': 'Asturias', 'Cantabria': 'Cantabria', 'La Rioja': 'La Rioja', 'Navarra': 'Navarra',
        'Murcia': 'Región de Murcia', 'Ceuta': 'Ceuta', 'Melilla': 'Melilla'}
CAPITALES = {'Álava': 'Vitoria-Gasteiz', 'Gipuzkoa': 'Donostia', 'Bizkaia': 'Bilbao', 'Illes Balears': 'Palma', 'Las Palmas': 'Las Palmas de Gran Canaria',
             'Santa Cruz de Tenerife': 'Santa Cruz de Tenerife', 'Asturias': 'Oviedo', 'Cantabria': 'Santander', 'La Rioja': 'Logroño',
             'Navarra': 'Pamplona', 'A Coruña': 'A Coruña'}


# Código ISO 3166-2 de cada provincia (y el de su comunidad cuando es uniprovincial) para pedir sus municipios a OpenStreetMap
ISO = {'Álava': ['ES-VI'], 'Albacete': ['ES-AB'], 'Alicante': ['ES-A'], 'Almería': ['ES-AL'], 'Ávila': ['ES-AV'], 'Badajoz': ['ES-BA'],
       'Illes Balears': ['ES-PM', 'ES-IB'], 'Barcelona': ['ES-B'], 'Burgos': ['ES-BU'], 'Cáceres': ['ES-CC'], 'Cádiz': ['ES-CA'],
       'Castellón': ['ES-CS'], 'Ciudad Real': ['ES-CR'], 'Córdoba': ['ES-CO'], 'A Coruña': ['ES-C'], 'Cuenca': ['ES-CU'], 'Girona': ['ES-GI'],
       'Granada': ['ES-GR'], 'Guadalajara': ['ES-GU'], 'Gipuzkoa': ['ES-SS'], 'Huelva': ['ES-H'], 'Huesca': ['ES-HU'], 'Jaén': ['ES-J'],
       'León': ['ES-LE'], 'Lleida': ['ES-L'], 'La Rioja': ['ES-LO', 'ES-RI'], 'Lugo': ['ES-LU'], 'Madrid': ['ES-M', 'ES-MD'], 'Málaga': ['ES-MA'],
       'Murcia': ['ES-MU', 'ES-MC'], 'Navarra': ['ES-NA', 'ES-NC'], 'Ourense': ['ES-OR'], 'Asturias': ['ES-O', 'ES-AS'], 'Palencia': ['ES-P'],
       'Las Palmas': ['ES-GC'], 'Pontevedra': ['ES-PO'], 'Salamanca': ['ES-SA'], 'Santa Cruz de Tenerife': ['ES-TF'], 'Cantabria': ['ES-S', 'ES-CB'],
       'Segovia': ['ES-SG'], 'Sevilla': ['ES-SE'], 'Soria': ['ES-SO'], 'Tarragona': ['ES-T'], 'Teruel': ['ES-TE'], 'Toledo': ['ES-TO'],
       'Valencia': ['ES-V'], 'Valladolid': ['ES-VA'], 'Bizkaia': ['ES-BI'], 'Zamora': ['ES-ZA'], 'Zaragoza': ['ES-Z'], 'Ceuta': ['ES-CE'], 'Melilla': ['ES-ML']}


def _overpass(q: str) -> list | None:
    """Overpass es gratis pero sus servidores se saturan: prueba varios por turnos (2 vueltas). None si ninguno responde."""
    import httpx
    servidores = ['https://maps.mail.ru/osm/tools/overpass/api/interpreter', 'https://overpass-api.de/api/interpreter',
                  'https://overpass.kumi.systems/api/interpreter', 'https://overpass.private.coffee/api/interpreter']
    for vuelta in range(2):
        for url in servidores:
            try:
                r = httpx.post(url, data={'data': q}, timeout=90, headers={'User-Agent': 'PEBAI-prospeccion/1.0 (+https://pebaisystems.es)'})
                if r.status_code == 200:
                    return r.json().get('elements', [])
            except Exception:
                pass
            time.sleep(3)
        time.sleep(30)
    return None


# De más a menos población: si la tanda se corta, lo útil ya está hecho
ORDEN = ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Alicante', 'Málaga', 'Murcia', 'Cádiz', 'Illes Balears', 'Bizkaia', 'A Coruña',
         'Las Palmas', 'Asturias', 'Santa Cruz de Tenerife', 'Zaragoza', 'Pontevedra', 'Granada', 'Tarragona', 'Córdoba', 'Girona', 'Gipuzkoa',
         'Toledo', 'Almería', 'Badajoz', 'Jaén', 'Navarra', 'Castellón', 'Cantabria', 'Valladolid', 'Ciudad Real', 'Huelva', 'León', 'Lleida',
         'Cáceres', 'Albacete', 'Burgos', 'Salamanca', 'Lugo', 'Ourense', 'La Rioja', 'Álava', 'Guadalajara', 'Huesca', 'Cuenca', 'Zamora',
         'Palencia', 'Ávila', 'Segovia', 'Teruel', 'Soria', 'Ceuta', 'Melilla']


PUEBLOS_POR_TRAMO = 60


CELDA_KM = 8   # separación de la cuadrícula que cubre todo el territorio
_PUNTOS = {}


def _km(a_la, a_lo, b_la, b_lo) -> float:
    return math.hypot((a_la - b_la) * 111, (a_lo - b_lo) * 111 * math.cos(math.radians(a_la)))


def puntos_cobertura(provincia: str) -> list:
    """Todo lo que queda por recorrer de una provincia después de sus ciudades (orden de Daniel, 21/10: «hasta que España se
    quede sin instaladoras»): 1) los núcleos de 1.000 a 5.000 habitantes que no estén a menos de 4 km de las ciudades ya vistas
    (GeoNames); 2) una cuadrícula cada 8 km por todo su territorio (polígonos, campo, pueblos pequeños), sin los puntos que ya
    caen junto a un núcleo. Un punto es de la provincia si el núcleo más cercano de toda España es suyo y está a menos de 20 km."""
    if provincia in _PUNTOS:
        return _PUNTOS[provincia]
    import json
    base_t = json.loads((Path(__file__).with_name('municipios_es.json')).read_text(encoding='utf-8'))['provincias']
    mil_t = json.loads((Path(__file__).with_name('municipios_es_1000.json')).read_text(encoding='utf-8'))['provincias']
    base = base_t.get(provincia) or []
    mil = mil_t.get(provincia) or []
    pueblos = [(la, lo) for _, la, lo, _ in mil if not any(_km(la, lo, b[1], b[2]) < 4 for b in base)]
    propios = [(m[1], m[2]) for m in base + mil]
    if not propios:
        _PUNTOS[provincia] = pueblos
        return pueblos
    todos = [(m[1], m[2], prov) for prov, lista in list(base_t.items()) + list(mil_t.items()) for m in lista]
    las = [x[0] for x in propios]; los = [x[1] for x in propios]
    dla = CELDA_KM / 111
    rejilla = []
    la = min(las) - 0.15
    while la <= max(las) + 0.15:
        dlo = CELDA_KM / (111 * math.cos(math.radians(la)))
        lo = min(los) - 0.2
        while lo <= max(los) + 0.2:
            cerca = min(todos, key=lambda t: _km(la, lo, t[0], t[1]))
            if cerca[2] == provincia and _km(la, lo, cerca[0], cerca[1]) < 20 and not any(_km(la, lo, a, b) < 5 for a, b in propios):
                rejilla.append((round(la, 5), round(lo, 5)))
            lo += dlo
        la += dla
    _PUNTOS[provincia] = pueblos + rejilla
    return _PUNTOS[provincia]


def pueblos_pequenos(provincia: str, tramo: int) -> list:
    """Los puntos de este tramo (60 por vuelta). Al acabar todos, vuelve a empezar con otras búsquedas."""
    pts = puntos_cobertura(provincia)
    if not pts:
        return []
    bloques = math.ceil(len(pts) / PUEBLOS_POR_TRAMO)
    i = (tramo - 1) % bloques
    return pts[i * PUEBLOS_POR_TRAMO:(i + 1) * PUEBLOS_POR_TRAMO]


def apunta_cobertura(provincia: str, tramo: int, cob_de: str = 'solar') -> None:
    """Cuánto de cada provincia se ha recorrido ya (lo lee el panel para el % de España). Un archivo por nicho."""
    import json
    f = SALIDA / 'tandas' / ('cobertura.json' if cob_de == 'solar' else f'cobertura_{cob_de}.json')
    cob = json.loads(f.read_text(encoding='utf-8')) if f.exists() else {}
    total = max(1, math.ceil(len(puntos_cobertura(provincia)) / PUEBLOS_POR_TRAMO))
    antes = cob.get(provincia, {}).get('hecho', 0)
    cob[provincia] = {'hecho': min(total, max(antes, tramo)), 'total': total, 'vueltas': max(cob.get(provincia, {}).get('vueltas', 0), (tramo - 1) // total)}
    f.parent.mkdir(parents=True, exist_ok=True)
    f.write_text(json.dumps(cob, ensure_ascii=False), encoding='utf-8')


# Qué cuenta como instaladora solar ANTES de abrir su web (orden de Daniel, 21/10: no gastar en lo que no es del nicho).
# Por categoría de Google Maps o por el nombre del negocio. Lo dudoso pasa (la web y la IA deciden después).
_SOLAR_CAT = re.compile(r'solar|fotovolt|placas|paneles|autoconsumo|energ[ií]as? renovable|instalaciones el[eé]ctricas', re.I)
_SOLAR_NOMBRE = re.compile(r'solar|fotovolt|placas|autoconsumo|renovable', re.I)


def prefiltra(cands: list, prov: str, nicho: str) -> list:
    """Separa lo que encuentra Maps antes de rastrear ninguna web:
    - ya en el panel o con baja → se salta (no se vuelve a analizar);
    - no es instaladora solar (ni por categoría ni por nombre) → se archiva con sus datos de Maps para proyectos futuros;
    - el resto → se analiza (web, filtros e IA) como siempre."""
    from .motor import exclusiones
    from .contacto import normaliza_tel
    from .web import dominio
    excl = exclusiones()
    cfg = NICHOS.get(nicho, {})
    cat_ok = re.compile(cfg['cat_ok'], re.I) if cfg.get('cat_ok') else _SOLAR_CAT
    nom_ok = re.compile(cfg['nombre_ok'], re.I) if cfg.get('nombre_ok') else _SOLAR_NOMBRE
    reglas = cfg.get('reglas') or {}
    grandes = re.compile(reglas['grandes'], re.I) if reglas.get('grandes') else None
    analizar, archivar, ya = [], [], 0
    for c in cands:
        tel = normaliza_tel(c.get('telefono') or '')
        dom = dominio(c.get('web') or '')
        if (tel and tel in excl['tels']) or (dom and dom in excl['dominios']):
            ya += 1
            continue
        cats = ' '.join(c.get('categorias') or [])
        nom_no = re.compile(reglas['nom_no'], re.I) if reglas.get('nom_no') else None
        if nom_no and nom_no.search(c.get('empresa') or ''):
            archivar.append(c)   # otro tipo de negocio por su nombre (refuerzo escolar, colegio, electricista...)
            continue
        if grandes and grandes.search((c.get('empresa') or '') + ' ' + dom):
            ya += 1   # gigantes, cadenas y tiendas: no son clientes nuestros
            continue
        principal = (c.get('categorias') or [''])[0]
        if cfg.get('cat_no'):
            # Nichos nuevos (22/10): se colaban electricistas, reformas y tiendas que marcan también «aire acondicionado».
            # Vale si su categoría principal es del nicho, o si el nombre lo es y la principal no es de otro oficio.
            cat_no = re.compile(cfg['cat_no'], re.I)
            del_nicho = (not cats) or (bool(cat_ok.search(principal)) and not cat_no.search(principal)) \
                or (bool(nom_ok.search(c.get('empresa') or '')) and not cat_no.search(principal))
            if dom.endswith(('.pt', '.fr', '.it', '.de', '.uk')):
                del_nicho = False   # webs de otros países
        else:
            del_nicho = not cats or cat_ok.search(cats) or nom_ok.search(c.get('empresa') or '')
        # Empresas serias (climatización y formación): con web propia y, si se pide, con actividad en Google (reseñas)
        floja = (reglas.get('requiere_web') and not c.get('web')) or (reglas.get('min_resenas') and int(c.get('resenas') or 0) < reglas['min_resenas'])
        if del_nicho and not floja:
            analizar.append(c)
        else:
            archivar.append(c)
    n = archiva(archivar, prov)
    print(f'  antes de abrir webs: {ya} ya en el panel · {len(archivar)} de otros sectores o poco serias (archivadas, {n} nuevas en el archivo) · {len(analizar)} a analizar')
    apunta(f'{prov}: {len(analizar)} a analizar de {len(cands)}', f'Ya en el panel: {ya}. Otros sectores o poco serias, archivadas para el futuro: {len(archivar)}.', f'{nicho}_{prov}_prefiltro', tipo='espera')
    return analizar


def archiva(cands: list, prov: str) -> int:
    # Empresas reales de otros sectores: se guardan (sin analizar) en el panel, tabla empresas_archivo, por si hacen falta.
    import sqlite3
    db_path = Path.home() / 'domains' / 'pebaisystems.es' / 'private' / 'leads.sqlite'
    if not cands or not db_path.exists():
        return 0
    db = sqlite3.connect(str(db_path), timeout=10)
    db.execute('PRAGMA busy_timeout = 10000')
    db.execute('''CREATE TABLE IF NOT EXISTS empresas_archivo (
        id INTEGER PRIMARY KEY AUTOINCREMENT, created_at TEXT NOT NULL, empresa TEXT NOT NULL, categorias TEXT NOT NULL DEFAULT '',
        telefono TEXT NOT NULL DEFAULT '', web TEXT NOT NULL DEFAULT '', ciudad TEXT NOT NULL DEFAULT '', provincia TEXT NOT NULL DEFAULT '',
        direccion TEXT NOT NULL DEFAULT '', resenas INTEGER NOT NULL DEFAULT 0, valoracion REAL NOT NULL DEFAULT 0, maps TEXT NOT NULL DEFAULT '',
        estado_maps TEXT NOT NULL DEFAULT '', origen TEXT NOT NULL DEFAULT 'Google Maps · ficha pública del negocio')''')
    db.execute('CREATE UNIQUE INDEX IF NOT EXISTS idx_archivo_unico ON empresas_archivo(empresa, telefono)')
    ahora = time.strftime('%Y-%m-%d %H:%M:%S')
    antes = db.total_changes
    for c in cands:
        if (c.get('extra') or {}).get('estado_maps', '').upper().startswith('CLOSED'):
            continue   # cerradas: no sirven ni para el futuro
        db.execute('INSERT OR IGNORE INTO empresas_archivo (created_at, empresa, categorias, telefono, web, ciudad, provincia, direccion, resenas, valoracion, maps, estado_maps) '
                   'VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
                   (ahora, c.get('empresa') or '', ' · '.join(c.get('categorias') or []), c.get('telefono') or '', c.get('web') or '', c.get('ciudad') or '',
                    prov, c.get('direccion') or '', int(c.get('resenas') or 0), float(c.get('valoracion') or 0), (c.get('extra') or {}).get('maps', ''),
                    (c.get('extra') or {}).get('estado_maps', '')))
    db.commit()
    n = db.total_changes - antes
    db.close()
    return n


def zonas(provincia: str, max_pueblos: int = 30) -> tuple[list, list]:
    """Dónde buscar: la ciudad más grande de la provincia en detalle (cuadrícula de 3×3 zonas de 3 km alrededor de su
    centro) y los siguientes municipios por población (≥ 5.000 hab.). Tabla fija sacada de GeoNames (municipios_es.json):
    OpenStreetMap fallaba según la provincia (Málaga devolvía 0 municipios) y la caja de Nominatim descentraba la capital."""
    import json
    tabla = json.loads((Path(__file__).with_name('municipios_es.json')).read_text(encoding='utf-8'))['provincias']
    munis = tabla.get(provincia) or []
    if not munis:
        lat, lon, _ = geocodifica(provincia)
        munis = [[provincia, lat, lon, 0]]
    _, clat, clon, _ = munis[0]
    dlat, dlon = 3 / 111, 3 / (111 * math.cos(math.radians(clat)))
    cap = [(round(clat + i * dlat, 5), round(clon + j * dlon, 5)) for i in (0, -1, 1) for j in (0, -1, 1)]
    cerca = lambda la, lo: math.hypot((la - clat) * 111, (lo - clon) * 111 * math.cos(math.radians(clat))) < 6
    pueblos = [(la, lo) for _, la, lo, _ in munis[1:] if not cerca(la, lo)][:max_pueblos]
    print(f'  zonas: {munis[0][0]} (9) + {len(pueblos)} municipios')
    return cap, pueblos


def provincia(nicho: str, prov: str) -> Path | None:
    cfg = NICHOS[nicho]
    nombre = f'{nicho}_{prov.lower().replace(" ", "-")}'
    destino = SALIDA / 'tandas' / nicho
    hecho = destino / f'{nombre}.csv'
    if hecho.exists():
        print(f'· {prov}: ya hecha, se salta')
        return hecho
    t0 = time.time()
    print(f'\n=== {prov} ===')
    import json
    bruto = destino / 'maps' / f'{nombre}.json'
    if bruto.exists():   # Maps ya se recorrió para esta provincia (tanda cortada): no se vuelve a pedir a Google
        cands = json.loads(bruto.read_text(encoding='utf-8'))
        print(f'  {len(cands)} resultados de Maps guardados de antes')
    else:
        cap, pueblos = zonas(prov, cfg.get('max_pueblos', 30))
        if cfg.get('tramo'):
            # Vuelta de pueblos: la capital y las ciudades ya están vistas; solo los pueblos nuevos de este tramo
            extra = pueblos_pequenos(prov, cfg['tramo'])
            if extra:
                cap, pueblos = [], extra
                print(f'  vuelta de pueblos y territorio: {len(extra)} puntos (tramo {cfg["tramo"]} de {math.ceil(len(puntos_cobertura(prov)) / PUEBLOS_POR_TRAMO)})')
        print(f'  capital en 9 zonas + {len(pueblos)} municipios')
        cands = google_maps(cfg['busquedas'], prov, cfg['sector'], puntos=cap, paso_km=3.0, zoom=14,
                            avance=bruto.with_name(bruto.stem + '.cap.avance.json')) if cap else []
        vistos = {c['empresa'] + c['telefono'] for c in cands}
        for c in google_maps(cfg['busquedas'], prov, cfg['sector'], puntos=pueblos, paso_km=6.0, zoom=14,
                             avance=bruto.with_name(bruto.stem + '.pue.avance.json')):
            if c['empresa'] + c['telefono'] not in vistos:
                cands.append(c)
        bruto.parent.mkdir(parents=True, exist_ok=True)
        bruto.write_text(json.dumps(cands, ensure_ascii=False), encoding='utf-8')
    fuera = [c for c in cands if c.get('provincia') and c['provincia'] != prov]
    cands = [c for c in cands if not c.get('provincia') or c['provincia'] == prov]
    for c in cands:
        c['provincia'], c['lote'] = prov, f'{cfg["sector"]} · {prov}'
        if cfg.get('nicho_email'):
            c['nicho_email'] = cfg['nicho_email']
        c['reglas'] = cfg.get('reglas', {})
    print(f'  {len(cands)} candidatos de {prov} ({len(fuera)} de otras provincias, se buscan en la suya)')
    cands = prefiltra(cands, prov, nicho)
    destino.mkdir(parents=True, exist_ok=True)
    import prospeccion.motor as m
    antes = m.SALIDA
    m.SALIDA = destino   # guarda() escribe en la carpeta de la tanda
    try:
        guarda(nombre, enriquece(cands, raices(cfg['sector'] + ' ' + cfg['palabras'])), 100000)
    finally:
        m.SALIDA = antes
    if cfg.get('tramo'):
        apunta_cobertura(prov, cfg['tramo'], cfg.get('cob', 'solar'))
    importar_panel(destino / f'{nombre}_whatsapp.csv', f'{cfg.get("lote", cfg["sector"])} · {prov}', cfg)
    print(f'  {prov} hecha en {(time.time() - t0) / 60:.0f} min')
    return hecho


def importar_panel(csv_whatsapp: Path, lote: str, cfg: dict) -> None:
    """En el servidor: las empresas con móvil que pasan todos los filtros entran solas en la cola del agente de WhatsApp.
    En el PC no hace nada (no hay panel local): se importan después."""
    import os
    import subprocess
    if 'nicho_email' in cfg or not csv_whatsapp.exists():
        return   # el nicho B va por email: lo importa el chat de Email
    script = Path(__file__).resolve().parent.parent / 'importar_panel.php'
    if not (Path.home() / 'domains' / 'pebaisystems.es').exists() or not script.exists():
        return
    if cfg.get('ia') is False:
        # Nichos nuevos: entran en su carpeta sin mensaje (los agentes no les escriben hasta que Daniel los active)
        r = subprocess.run(['/usr/bin/php', str(script), str(csv_whatsapp), lote, 'pendiente', cfg['nicho_panel']], capture_output=True, text=True, timeout=300)
        print('  importadas en su carpeta:', (r.stdout or r.stderr).strip()[:200])
        apunta(f'{lote}: a su carpeta de Prospectos', 'Sin mensajes todavía: el nicho aún no está activado. ' + (r.stdout or r.stderr).strip()[:300], csv_whatsapp.stem)
        solo_email = csv_whatsapp.with_name(csv_whatsapp.name.replace('_whatsapp.csv', '_solo_email.csv'))
        if solo_email.exists():
            r = subprocess.run(['/usr/bin/php', str(script), str(solo_email), lote + ' (email)', 'email', cfg['email_nicho']], capture_output=True, text=True, timeout=300)
            print('  sin móvil, a su lista de email:', (r.stdout or r.stderr).strip()[:200])
        # Tercera capa (22/10): la IA revisa nombre y web de las que acaban de entrar y saca las que no son del nicho
        aud = Path(__file__).resolve().parent.parent / 'auditar_lote.php'
        if aud.exists() and cfg.get('auditoria', True):   # dentales e inmobiliarias: las revisa el Redactor (Claude)
            r = subprocess.run(['/usr/bin/php', str(aud), cfg['nicho_panel'], lote], capture_output=True, text=True, timeout=900)
            print('  revisión con IA:', (r.stdout or r.stderr).strip()[:200])
            apunta(f'{lote}: revisión con IA', (r.stdout or r.stderr).strip()[:300], csv_whatsapp.stem + '_ia')
        return
    # Desde el 27/10 la IA no va aquí: entran sin texto y el Redactor (Claude, api/redactor.php) lee su web, decide si encaja
    # y escribe. Sin texto no sale nada: el agente de WhatsApp exige mensaje y el de Email exige cuerpo en placas solares.
    r = subprocess.run(['/usr/bin/php', str(script), str(csv_whatsapp), lote], capture_output=True, text=True, timeout=300)
    print('  importadas en el panel:', (r.stdout or r.stderr).strip()[:200])
    apunta(f'{lote}: importadas en el panel', 'Entran sin mensaje: el Redactor lee la web de cada una, saca las que no encajan '
           'y escribe el WhatsApp de las demás. ' + (r.stdout or r.stderr).strip()[:400], csv_whatsapp.stem)
    solo_email = csv_whatsapp.with_name(csv_whatsapp.name.replace('_whatsapp.csv', '_solo_email.csv'))
    if cfg.get('email_nicho') and solo_email.exists():
        r = subprocess.run(['/usr/bin/php', str(script), str(solo_email), lote + ' (email)', 'email', cfg['email_nicho']],
                           capture_output=True, text=True, timeout=300)
        print('  sin móvil, a la lista de email:', (r.stdout or r.stderr).strip()[:200])
        apunta(f'{lote}: sin móvil, a la lista de email', 'Entran sin texto: el Redactor lee su web y escribe el email de las que encajan. '
               + (r.stdout or r.stderr).strip()[:400], solo_email.stem)


def unir(nicho: str) -> None:
    carpeta = SALIDA / 'tandas' / nicho
    filas = []
    for p in sorted(carpeta.glob(f'{nicho}_*.csv')):
        if p.stem.endswith(('_whatsapp', '_email', '_llamadas')) or p.stem.startswith(f'{nicho}_TODO'):
            continue
        with p.open(encoding='utf-8-sig') as f:
            filas += list(csv.DictReader(f, delimiter=';'))
    if not filas:
        print('Nada que unir todavía')
        return
    vistos, unicas = set(), []
    for r in filas:   # una empresa que aparece en dos provincias, una sola vez
        k = r['telefono'] or r['telefono_fijo'] or r['email'] or r['web']
        if k in vistos:
            continue
        vistos.add(k)
        unicas.append(r)
    for suf, filtro in (('', lambda r: True), ('_whatsapp', lambda r: r['telefono']), ('_email', lambda r: r['email']),
                        ('_llamadas', lambda r: r['telefono_fijo'] and not r['telefono'])):
        with (carpeta / f'{nicho}_TODO{suf}.csv').open('w', encoding='utf-8-sig', newline='') as f:
            wr = csv.DictWriter(f, COLS, delimiter=';', extrasaction='ignore')
            wr.writeheader()
            wr.writerows([r for r in unicas if filtro(r)])
    por = {}
    for r in unicas:
        por.setdefault(r['provincia'], [0, 0])
        por[r['provincia']][0] += 1
        por[r['provincia']][1] += bool(r['telefono'])
    print(f'\nTOTAL {nicho}: {len(unicas)} empresas · {sum(1 for r in unicas if r["telefono"])} con móvil · '
          f'{sum(1 for r in unicas if r["email"])} con email · {sum(1 for r in unicas if r["telefono_fijo"])} con fijo')
    for p, (t, mv) in sorted(por.items(), key=lambda x: -x[1][0]):
        print(f'  {p}: {t} ({mv} con móvil)')


def cuenta_email(nicho: str) -> int:
    """Empresas pendientes en la lista de email de ese nicho (solo en el servidor; en el PC devuelve 0)."""
    import subprocess
    db = Path.home() / 'domains' / 'pebaisystems.es' / 'private' / 'leads.sqlite'
    if not db.exists():
        return 0
    r = subprocess.run(['sqlite3', str(db), f"SELECT COUNT(*) FROM email_prospectos WHERE nicho = '{nicho}' AND estado = 'pendiente';"],
                       capture_output=True, text=True, timeout=60)
    return int((r.stdout or '0').strip() or 0)


MIN_NUEVAS_VUELTA = 5   # una vuelta entera con menos empresas nuevas que esto para la serie (ver main)


def entregadas_vuelta(nicho: str) -> int:
    """Empresas nuevas entregadas en toda la vuelta: filas de los CSV principales de cada provincia (las que ya estaban en el panel no llegan)."""
    n = 0
    for f in _carpeta(nicho).glob(f'{nicho}_*.csv'):
        if f.stem.endswith(('_whatsapp', '_email', '_solo_email', '_llamadas')):
            continue
        with f.open(encoding='utf-8') as fh:
            n += max(0, sum(1 for _ in fh) - 1)
    return n


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('nicho', choices=[*NICHOS, *SERIES])
    ap.add_argument('--provincias', nargs='*')
    ap.add_argument('--unir', action='store_true')
    a = ap.parse_args()
    serie = None
    if a.nicho in SERIES:
        serie = a.nicho
        a.nicho = pasada(serie)
        print(f'Barrido continuo ({serie}): vuelta {a.nicho} · búsquedas: {", ".join(NICHOS[a.nicho]["busquedas"])}')
    if a.nicho.startswith('solar_v'):
        # Para el % de España del panel: todas las provincias con su total, aunque aún no se hayan tocado
        import json
        fc = SALIDA / 'tandas' / 'cobertura.json'
        cob = json.loads(fc.read_text(encoding='utf-8')) if fc.exists() else {}
        for p in ORDEN:
            cob.setdefault(p, {'hecho': 0, 'total': max(1, math.ceil(len(puntos_cobertura(p)) / PUEBLOS_POR_TRAMO)), 'vueltas': 0})
        fc.parent.mkdir(parents=True, exist_ok=True)
        fc.write_text(json.dumps(cob, ensure_ascii=False), encoding='utf-8')
    if not a.unir:
        lista = a.provincias or ORDEN
        hechas = 0
        carpeta = SALIDA / 'tandas' / a.nicho
        pendientes = pendientes_de(a.nicho, lista)
        for p in lista:
            if p in pendientes:
                # Aviso al empezar: el panel (Oficina) muestra al scraper «trabajando» mientras lo último empiece por «Buscando»
                apunta(f'Buscando {NICHOS[a.nicho]["sector"].lower()} en {p} ({pendientes.index(p) + 1} de {len(pendientes)})',
                       'Tirada en curso en el servidor: Google Maps por zonas y municipios, y después la web de cada empresa.', f'{a.nicho}_{p}', tipo='espera')
            try:
                provincia(a.nicho, p)
                hechas += 1
                objetivo = NICHOS[a.nicho].get('objetivo_email')
                if objetivo and p in pendientes:
                    n = cuenta_email(NICHOS[a.nicho]['email_nicho'])
                    print(f'  lista de email «{NICHOS[a.nicho]["email_nicho"]}»: {n} de {objetivo}')
                    if n >= objetivo:
                        (Path.home() / 'prospeccion' / 'PAUSA').touch()   # objetivo cumplido: queda en pausa hasta nueva orden
                        apunta(f'Parado: objetivo cumplido ({n} empresas en la lista de email)',
                               f'La tanda {a.nicho} se para al llegar a {objetivo} en email_prospectos «{NICHOS[a.nicho]["email_nicho"]}».', f'{a.nicho}_fin', tipo='espera')
                        break
            except Exception as e:   # una provincia que falla no para la tanda; queda apuntado y se reintenta en la siguiente
                print(f'  ⚠ {p} falló: {type(e).__name__}: {e}')
                apunta(f'Tanda {a.nicho}: {p} falló', f'{type(e).__name__}: {e}', f'{a.nicho}_{p}', tipo='error')
                import json
                fallos = _fallos(a.nicho)
                fallos[p] = fallos.get(p, 0) + 1
                carpeta.mkdir(parents=True, exist_ok=True)
                (carpeta / 'fallos.json').write_text(json.dumps(fallos, ensure_ascii=False), encoding='utf-8')
        print(f'\n{hechas} de {len(lista)} provincias procesadas')
        # Vuelta completa a España casi sin nada nuevo: esta serie se para sola (no gasta horas buscando lo que ya está)
        if serie and not a.provincias and not pendientes_de(a.nicho, ORDEN):
            n = entregadas_vuelta(a.nicho)
            print(f'  vuelta {a.nicho} terminada: {n} empresas nuevas')
            if n < MIN_NUEVAS_VUELTA:
                (Path.home() / 'prospeccion' / f'PAUSA_{serie}').touch()
                # Nicho terminado (idea de Daniel, 27/10): se ve en su mesa de la oficina y le llega por email para que dé otro nicho
                sector = NICHOS[a.nicho]['sector'].lower()
                apunta(f'Nicho terminado: {sector}. España revisada entera ({len(ORDEN)} provincias), solo {n} empresas nuevas en la última vuelta. Dame otro nicho',
                       f'Por debajo de {MIN_NUEVAS_VUELTA} nuevas en toda la vuelta, seguir buscando no compensa. Para seguir: dale a Claude un nicho nuevo '
                       f'(sector y palabras) en el chat. Para reanudar este, borrar ~/prospeccion/PAUSA_{serie} en el servidor.', f'{serie}_agotado', tipo='espera')
                from .motor import avisa
                avisa(f'Nicho terminado: {sector}',
                      f'El Scraper ha revisado toda España ({len(ORDEN)} provincias) buscando {sector} y en la última vuelta solo ha encontrado {n} empresas nuevas, '
                      f'así que se ha parado solo.\n\nPara que siga trabajando, dile a Claude en el chat un nicho nuevo (sector y a quién buscar).')
    unir(a.nicho)


if __name__ == '__main__':
    main()
