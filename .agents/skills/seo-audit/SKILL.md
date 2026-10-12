---
name: seo-audit
description: >-
  Habilidad maestra de auditoría integral on-page, técnica y de posicionamiento local para webs en PEBAI Systems. Basada en el protocolo de Charly Growth (@charlygtgrowth) y el estándar claude-seo. Audita el sitio web completo, calcula una puntuación de Salud SEO (0-100) y genera una matriz de acciones correctivas ordenadas por prioridad de impacto (Alta, Media, Baja/Local) cubriendo titles, metas, jerarquía semántica, imágenes, canónicas y ficha local.
---

# SEO Audit: Auditoría Web Integral y Matriz de Prioridad

Esta habilidad permite realizar una radiografía exhaustiva de cualquier página o sitio web de PEBAI Systems, cuantificar su estado de optimización técnica y entregar un plan de acción ordenado por rentabilidad SEO.

---

## 1. Escala de Salud SEO (Health Score 0-100)

La puntuación se calcula evaluando 5 vectores ponderados:
- **Indexabilidad y Rastreo (25 pts)**: Robots.txt, sitemaps, status HTTP 200, canonicals sin bucles, etiquetas `meta robots`.
- **Meta-datos y Jerarquía (25 pts)**: Title único (50-60 caracteres), meta description persuasiva (140-155 caracteres), un único `<h1>`, progresión lógica `<h2>` -> `<h3>`.
- **Accesibilidad y Multimedia (20 pts)**: Atributos `alt` descriptivos en todas las imágenes informativas, dimensiones explícitas (`width`/`height`) para evitar CLS.
- **E-E-A-T y Datos Estructurados (15 pts)**: Schema.org/JSON-LD válido, datos de contacto visibles, autoría y aviso legal/privacidad.
- **Rendimiento y Mobile UX (15 pts)**: Core Web Vitals (LCP < 2.5s, CLS < 0.1, INP < 200ms), visualización responsive sin desbordamiento horizontal a 390px.

---

## 2. Matriz de Prioridad de Acciones

### Nivel 1: Prioridad Alta (Impacto Inmediato en Indexación y Tráfico)
1. **Titles Duplicados o Genéricos**: Cada URL debe tener un title único con la palabra clave transaccional + modificador de intención + marca (ej. `Consultoría de Procesos e IA para Empresas | PEBAI Systems`).
2. **Falta de Meta Description**: Añadir descripciones con llamada a la acción y beneficio cuantificable.
3. **Múltiples `<h1>` o Ausencia de `<h1>`**: Debe existir exactamente un `<h1>` que exprese la propuesta de valor principal de la página.
4. **Errores de Rastreo / 404s Internos**: Enlaces rotos o redirecciones en bucle en el menú o footer.
5. **Canonicals Cruzadas o Falsas**: Asegurar que `rel="canonical"` apunte a la URL canónica final HTTPS sin barras redundantes.

### Nivel 2: Prioridad Media (Relevancia On-Page y Experiencia de Usuario)
1. **Imágenes sin Atributo `alt`**:
   - Toda imagen decorativa debe tener `alt=""` con `aria-hidden="true"`.
   - Toda imagen de producto, logotipo o infografía debe tener un `alt` semántico preciso (ej. `alt="Construcciones Gargom - Caso de éxito de digitalización de obra"`).
2. **Jerarquía Semántica Incompleta**: No saltar de `<h1>` directamente a `<h3>` o `<h4>`.
3. **Enlaces Internos sin Contexto**: Reemplazar textos de anclaje como *"haz clic aquí"* o *"leer más"* por textos semánticos descriptivos (*"Ver proyectos de software operativo en producción"*).
4. **Optimización de Assets**: Formatos modernos (`.webp`, `.avif`, SVG vectoriales inline/optimizados).

### Nivel 3: Prioridad Baja y SEO Local
1. **Consistencia NAP (Name, Address, Phone)**: Nombre, teléfono corporativo (`+34-624-84-27-99`) y país/región idénticos en el footer, página de contacto y schema `LocalBusiness` / `ProfessionalService`.
2. **Optimización de Ficha Local / Google Business Profile**: Coherencia en categorías de servicio (`Consultora de software`, `Ingeniería de procesos`, `Servicios de IA`).
3. **Páginas de Cobertura Geográfica o Sectorial**: Enlaces contextuales a landings por sectores (Construcción, Distribución, Talleres).

---

## 3. Protocolo de Ejecución de Auditoría

Al invocar esta habilidad para auditar una página:
1. **Extracción y Parseo**: Analizar el código HTML buscando etiquetas `<title>`, `<meta>`, `<link rel="canonical">`, `<h1>`-`<h6>`, `<img>` y scripts `<script type="application/ld+json">`.
2. **Diagnóstico Automatizado**:
   - Listar todos los hallazgos agrupados en **Alta**, **Media** y **Baja**.
   - Asignar el puntaje de Salud SEO actual.
3. **Resolución de Código**: Generar las modificaciones exactas para resolver las incidencias de nivel Alto y Medio de inmediato.
