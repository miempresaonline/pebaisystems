---
name: prospeccion
description: Saca listas de empresas españolas activas y del nicho con todos sus contactos (móvil para WhatsApp, email, fijo para llamadas) usando el motor gratuito de prospeccion/ (Google Maps con gosom + buscador web + rastreo de la web de cada empresa). Úsala cuando pidan prospectos, leads, scrapear empresas, una lista de un nicho o ciudad, o alimentar los agentes de WhatsApp/email.
---

# Prospección PEBAI

Motor en `prospeccion/` (documentación completa en `docs/prospeccion.md`). Reglas que no se saltan:

1. **Solo negocios activos y del nicho.** Nunca entregues `dudosa`. Si el usuario pide más volumen, añade zonas, ciudades o formas de buscar, nunca relajes los filtros.
2. **Se guarda todo contacto de empresa:** móvil → WhatsApp, email → email, fijo → llamadas. Un negocio sin móvil pero con email o fijo **sí** se entrega.
3. **Cada contacto lleva su origen** (columna `origen`). Solo datos publicados por la empresa. Nada de listas compradas ni de datos personales de administradores.
4. **Los CSV con datos reales van a `scratch/prospeccion/`** (o a `documentos/`), nunca al repo, que es público.
5. **Los nichos aún no están decididos** (15/10/2026): pregúntalos antes de una tirada grande. Las pruebas se hicieron con reformas y placas solares.
6. **Para el agente de email** cada fila lleva `tipo_email` (generico/nominativo/gratuito), `origen_email` (URL exacta), `mx_ok`, `motivo` + `motivo_fuente` + `motivo_fecha` (una frase verdadera y comprobable) y `canales`. Sin motivo verificable la empresa vale igual, pero va detrás. Nunca inventes un motivo.
7. **Reglas del chat de Email (15/10/2026):**
   - Fuera las administraciones públicas: ayuntamientos, comercializadoras municipales y emails ajuntament@ o ayuntamiento@.
   - Fuera las multinacionales y grandes cadenas (no son pymes).
   - Nunca el email de una persona sacado de una página de equipo, dirección o leadership: solo los publicados como contacto.
   - Para atención al cliente, mejor atencion@, clientes@ o info@ que reportes@ o comunicacion@ (prensa).

## Antes de ejecutar

- Entorno: `prospeccion/.venv` (si no existe: `python -m venv .venv` y `pip install -r requirements.txt`).
- Binario de gosom en `prospeccion/bin/` (`gmaps.exe` en Windows, `gmaps` en Linux): v1.18.1 de https://github.com/gosom/google-maps-scraper/releases, verificando el SHA-256 con el de la release.

## Ejecutar

Desde `prospeccion/`, con `PYTHONIOENCODING=utf-8`:

```bash
# Con local (Maps): varias formas de buscar el nicho separadas por comas; --palabras ayuda a reconocer el nicho en la web
.venv/Scripts/python -m prospeccion.motor maps "empresa de reformas, reformas integrales, reformas de cocinas y baños" Valencia \
  --sector Reformas --palabras "interiorismo construcción obras rehabilitación" --puntos 9 --limite 50

# Online (no hace falta que estén en Maps): una --consulta por región o variante
.venv/Scripts/python -m prospeccion.motor online --sector "Placas solares" --palabras "fotovoltaica autoconsumo energía solar" \
  --consulta "instaladores placas solares España" --consulta "placas solares Madrid instaladores" --limite 50
```

- Maps: unos 20 negocios por forma de buscar y zona. Para más volumen, sube `--puntos` (zonas de 3 km) o cambia de ciudad.
- Buscador: deja las pausas como están; si devuelve 0 webs, DuckDuckGo está frenando. Espera, no reintentes en bucle.
- gosom solo funciona en `-fast-mode` desde el 01/10/2026 (issue #338). Si vuelve a fallar, revisa los issues del repo antes de tocar nada.

## Después

1. **Revisa a mano una muestra.** El resumen dice cuántos se han descartado y por qué. Busca intrusos (otro sector, portales, administraciones) y, si los hay, ajusta `NO_CLIENTE`, `_NO_NEGOCIO` o `--palabras` en vez de editar el CSV a mano.
2. Entrega al usuario: candidatos → entregados, cuántos con móvil, email y fijo, actividad y encaje, y la ruta de los CSV.
3. `*_whatsapp.csv` se importa tal cual en el panel (Captación › Prospectos → Añadir prospectos).
