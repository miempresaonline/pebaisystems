# Prospección (scraper de empresas)

Consigue empresas españolas **activas** y **del nicho**, con todos sus contactos, para los agentes de captación:

| Contacto | Para qué |
|---|---|
| Móvil (6/7) | WhatsApp (agente de WhatsApp) |
| Email | Secuencias de email (agente de email) |
| Fijo (8/9) | Llamadas en frío |

Todo gratis y con código abierto. Código en `prospeccion/`; los resultados con datos reales van a `scratch/prospeccion/` (nunca al repo, que es público).

## Cómo funciona

```
FUENTES                              RASTREO DE LA WEB               FILTROS                     SALIDA (CSV ;)
Google Maps (gosom, modo rápido) ─┐  portada + contacto + aviso      del nicho                   todo.csv
Buscador web (DuckDuckGo)        ─┼─► legal (respeta robots.txt):  ► activa (señales)          ► _whatsapp.csv (importable en el panel)
Anunciantes de Meta   (fase 2)   ─┤  móviles, fijos, emails,         sin cadenas/directorios     _email.csv
BORME empresas nuevas (fase 3)   ─┤  botón WhatsApp, formularios,    sin duplicados              _llamadas.csv
Directorios del sector (fase 3)  ─┘  anuncios, fecha de la web       contacto que es de la empresa
```

**¿Está en movimiento? (actividad)** Puntos por: web que responde y no está aparcada ni en construcción, año de la web reciente, sitemap actualizado en el último año, reseñas en Maps e inversión en anuncios (etiquetas de Google Ads o píxel de Meta). Restan: web caída, web sin tocar en años. Solo se entregan `activa` y `probable`.

**¿Encaja con PEBAI? (encaje)** Puntos por lo que dice que reciben y pagan por clientes: anuncios en Google o Meta, formularios o botón de WhatsApp, sin chat automático y volumen de reseñas. Se ordena primero por encaje: a los mejores se les escribe antes.

**Columnas para el agente de email** (acordadas con el chat de Email):
- `tipo_email`: generico / nominativo / gratuito.
- `origen_email`: URL exacta donde la empresa publica ese email.
- `mx_ok`.
- `motivo`: una frase verdadera y comprobable para la primera línea, en minúscula, sin punto final y sin hablar de «web» (el agente antepone «He visto que»), con `motivo_fuente` (URL) y `motivo_fecha`.
- `senal`: anuncios / empleo / resenas / apertura / atencion / ninguna.
- `anuncios_activos`.
- `canales`: whatsapp, email, llamada. El panel decide uno solo a la vez.

Motivos por orden de valor: anuncios activos en Meta (fase 2) > oferta de empleo de atención al cliente (fase 3) > reseñas que dicen que cuesta contactar, solo en agregado (fase 3) > auditoría de la web y horario de la ficha (**ya activo**) > apertura reciente, por el BORME (fase 3).

**Exclusiones:** antes de entregar, el motor pide al panel (`api/exclusiones.php`, con el `AGENT_TOKEN` del `.env`) los teléfonos, emails y dominios que ya están en él y las bajas de cualquier canal, y los quita. Si el panel no responde, avisa en el resumen.

**Calidad del contacto:**
- Se descarta el email de la agencia que hizo la web, los de relleno (`info@sitio.com`) y los de RR. HH.
- Solo se aceptan emails cuyo dominio recibe correo (registros MX). Así se evitan rebotes, que hunden la reputación del envío.
- Cada contacto lleva su origen (`Google Maps · ficha pública`, `Web de la empresa · botón de WhatsApp`…). Lo exigen la ley y el panel.

## Uso

```bash
cd prospeccion
python -m venv .venv && .venv/Scripts/python -m pip install -r requirements.txt
# Binario de gosom (v1.18.1) en prospeccion/bin/ (gmaps.exe en Windows, gmaps en Linux), descargado de su página de releases

# Negocios con local: varias formas de buscar el nicho, separadas por comas
.venv/Scripts/python -m prospeccion.motor maps "empresa de reformas, reformas integrales" Valencia --sector Reformas --palabras "interiorismo construcción obras" --puntos 9

# Negocios online (aunque no estén en Maps)
.venv/Scripts/python -m prospeccion.motor online --sector "Placas solares" --palabras "fotovoltaica autoconsumo" --consulta "instaladores placas solares España" --consulta "placas solares Madrid instaladores"
```

## Estado de las herramientas (15/10/2026)

- **gosom/google-maps-scraper**: el mejor scraper de Maps gratuito (6,4k estrellas, MIT). Su modo normal **falla desde el 01/10/2026** por un cambio de Google ([issue #338](https://github.com/gosom/google-maps-scraper/issues/338)); el **modo rápido funciona** (unos 20 negocios por búsqueda y zona, sin categoría ni fechas de reseñas). Por eso el nicho y la actividad se comprueban en la web de cada negocio.
- **Buscador**: DuckDuckGo en HTML, sin clave y gratis. Se usa con pausas largas; a gran escala puede frenar. Por eso es complemento, no la columna vertebral.

## Pruebas del 15/10/2026

| Prueba | Candidatos | Entregados | Con móvil | Con email | Activas |
|---|---|---|---|---|---|
| A · Reformas Valencia (Maps, 9 zonas, ~5 min) | 128 | 50 (límite) | 43 | 45 | 49 + 1 probable |
| B · Placas solares online (10 búsquedas, ~8 min) | 129 | 50 (límite) | 39 | 43 | 43 + 7 probables |

Descartados en A: 33 sin señales de actividad (sobre todo sin web), 16 de fuera del nicho, 2 cadenas y 2 duplicados. En B: 31 de fuera del nicho, 12 administraciones, directorios o formación, 6 de fuera de España y otros.

## Fases

1. **Hecho:** el motor, Maps, el buscador, el rastreo de webs, la actividad, el encaje y los CSV.
2. **Anunciantes de Meta** (Biblioteca de anuncios, API oficial y gratuita; en la UE incluye todos los anuncios). Empresas que pagan por captar clientes **ahora**: la fuente con más intención y la mejor para negocios solo online. Requiere que Daniel verifique su identidad en facebook.com/ID y cree una app de desarrollador.
3. **BORME** (empresas recién constituidas por objeto social, datos abiertos del BOE; solo la empresa, nunca los administradores) y **directorios del sector**, que listan instaladores y reformistas.
4. **Sin ordenador:** GitHub Actions cada noche (gratis en repo público) → resultados directos al panel con token, sin guardar datos en GitHub. Tarjeta «Agente de prospección» en Automático › Agentes. Antes hay que añadir el email y el fijo a los prospectos del panel: es un archivo común, coordinar con el chat principal y el de Email.

## Legal

- Solo datos que la propia empresa publica como contacto (ficha de Maps, su web). Nada de listas compradas ni de datos de administradores del BORME.
- Rastreo lento y respetuoso: robots.txt, pocas páginas por web, pausas.
- RGPD: el móvil de un autónomo es un dato personal. Interés legítimo + informar del origen y de los derechos en el primer contacto (art. 14). Las reglas de envío están en `docs/agente-whatsapp.md`.
- Raspar Google Maps incumple sus condiciones de uso (no es ilegal). El riesgo es un bloqueo, no una sanción.
