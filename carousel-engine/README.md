# PEBAI Carousel Engine — Automatización de Carruseles

Motor de generación programática de carruseles de alto impacto para Instagram y TikTok (Photo Mode), diseñado para **PEBAI Systems**.

## Formatos Soportados

1. **Estilo Font Bravo (Comparativa de Alto Impacto):**
   * Fondo Mineral White (`#EFEDE7`) con grano de papel/piedra.
   * Titular en Manrope ExtraBold (`#12121A`).
   * Columnas cápsula con alturas dinámicas (destacando la solución PEBAI en Signal Lime `#B7FF3C`).
   * Logotipos e isotipos vectoriales puros sin degradación.
2. **Estilo Libreta Manuscrita (Educativo / Formativo):**
   * Textura fotográfica realista de libreta de espiral pautada con línea de margen roja.
   * Tinta de bolígrafo Bic azul clásica con física de trazo y modo de fusión `multiply`.
   * Diagramas de árbol con ramificaciones orgánicas, notas tachadas y caligrafía natural.
   * Diapositivas de cierre con nota manuscrita personal.

---

## Uso Rapido

### Generar el carrusel de hoy automáticamente:
```bash
python carousel-engine/run_daily.py
```

### Generar un día específico del calendario (1 al 14):
```bash
python carousel-engine/run_daily.py --day 2
```

### Generar y avanzar la secuencia para el día siguiente:
```bash
python carousel-engine/run_daily.py --next
```

---

## Revision y Aprobacion Visual

Abre en tu navegador el panel de control local:
```
carousel-engine/dashboard.html
```
Desde ahí podrás deslizar las diapositivas de cada carrusel, leer el texto con hashtags y aprobar la publicación en 1 clic.

---

## Base de Conocimiento y Playbooks de Conversion

* `knowledge/MAESTRIA_GANCHOS_VIRALES_B2B.md`: Deconstrucción psicológica de ganchos virales (Mich Markeeting y Jordi Segués), triggers de aversión a la pérdida, matriz de 30 ganchos B2B y protocolo para modelos de IA.
* `knowledge/VIRAL_CAROUSEL_SYSTEM_2026.md`: Sistema maestro de carruseles B2B, arquetipos visuales y embudos de palabras clave.

---

## Estructura del Motor

* `knowledge/`: Playbooks estratégicos de copywriting, ganchos virales y benchmarks de retención.
* `templates/`: Plantillas Jinja2 (`fontbravo_slide.html.jinja`, `notebook_slide.html.jinja`, `notebook_cta.html.jinja`).
* `assets/icons/`: Librería local de logotipos e iconos vectoriales (SVG).
* `assets/pebai/`: Logotipos e isotipos corporativos oficiales de PEBAI Systems.
* `content_calendar.py`: Calendario editorial de 14 días según `CONTENT_SYSTEM_PBI.md`.
* `generator.py`: Ensamblador multidiapositiva que une datos + plantillas.
* `renderer.py`: Motor Playwright que exporta PNGs en resolución Retina (1080 x 1440 px).
* `output/`: Carpetas con cada carrusel generado (diapositivas PNG + `caption.txt`).

