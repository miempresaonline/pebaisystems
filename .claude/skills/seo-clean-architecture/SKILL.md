---
name: seo-clean-architecture
description: Arquitectura limpia de páginas para pebaisystems.es (HTML estático en website-pebai/dist/): URL madre por tema, subpilares por público o servicio, prevención de canibalización, puente comercial consultivo al final y schema JSON-LD. Úsala antes de crear, fusionar o renombrar cualquier página o artículo de la web, y al revisar si dos páginas compiten entre sí.
---

# Arquitectura limpia: URL madre, subpilares y cero canibalización (PEBAI)

Metodología para estructurar el contenido de pebaisystems.es de forma que Google y los motores de IA entiendan qué página es la referencia de cada tema, y que convierta. Adaptada del paquete de Antigravity del 20/10/2026. Los temas salen de la ficha de pilares (`docs/geo/pilares.md`, skill `seo-pillar-discovery`).

## 1. Filosofía

Un tema nunca se dispersa en artículos sueltos o landings finas. Se organiza así:

```text
/tema/                      URL madre: autoridad, marco y enrutamiento
├── /tema/para-[publico]/   Subpilar por público (p. ej. empresas de placas solares)
├── /tema/[servicio]/       Subpilar por servicio o caso de uso
└── /tema/[pregunta]/       Satélite que resuelve una duda concreta
```

Reglas:
1. **La URL madre es la casa de la entidad:** corta, limpia y definitiva (`/posicionamiento-en-ia/`, `/chatbots-ia/`…). En la web estática cada URL es una carpeta con `index.html` en `website-pebai/dist/`.
2. **Sin venta agresiva en la entrada:** la madre aporta el estado de la cuestión con rigor antes de derivar.
3. **Semáforo factual:** separar 🟢 lo confirmado (con fuente y fecha) de 🟡 lo pendiente o estimado. Prohibido inventar cifras, precios o resultados.
4. **Bifurcación temprana:** en el primer pantallazo, tarjetas que separan al visitante por perfil o dolor.
5. **Los subpilares son densos de verdad:** cobertura completa del segmento (casos, método, riesgos, FAQ propia). Se mide por cobertura y por información nueva aportada, no por líneas ni palabras.
6. **Puente consultivo al final:** el diagnóstico o la consultoría van al final del análisis como solución práctica, enlazando al embudo (`/consultoria-gratuita/` o `/diagnostico/`) con sus `utm`. Respetar las condiciones de la consultoría gratuita (plazas limitadas) y no vender "webs".

## 2. Flujo para cada página nueva

### Paso 1: control anticanibalización (obligatorio)
1. Revisar `website-pebai/dist/sitemap.xml` y las carpetas de `dist/` (y Search Console si hay datos: dos URLs que reciben impresiones por la misma consulta).
2. Si ya hay una URL que cubre la misma entidad, **parar** y decidir con el equipo:
   - Redundante → fusionar en la URL más corta y **301** en `website-pebai/dist/.htaccess` (o regla de redirección en Cloudflare).
   - Público distinto → renombrar slug y H1 para que sea específico y subordinarlo a la madre.

### Paso 2: estructura de la página madre
- Miga de pan: `Inicio / Área / Tema`.
- **Respuesta directa en el primer párrafo** (40-60 palabras): qué es, para quién, qué resuelve. Es el fragmento que las IAs citan.
- Bifurcación por perfil.
- Semáforo 🟢/🟡 cuando haya datos externos (ayudas, normativa).
- Mapa visible de enlaces a cada subpilar.
- Tabla comparativa frente a alternativas (hacerlo en casa, otras soluciones).
- Captación suave (aviso de novedades o diagnóstico).
- Autoría visible (Daniel / Adrián, con enlace a su ficha en `/team/`) y fecha de actualización.

### Paso 3: estructura del subpilar
1. **H1 diferenciado**: concreta público o acción; no repite el término general de la madre.
2. Enlace de vuelta: `<a href="/tema/">← Volver a la guía de [tema]</a>`.
3. Casos de uso desglosados (por departamento o por oficio; para placas solares: captación, presupuestos, seguimiento de instalaciones, posventa…). Solo casos reales o marcados como ejemplo.
4. Método de implantación por fases (diagnóstico, selección, datos, pruebas, despliegue, medición).
5. Seguridad y cumplimiento (RGPD, datos).
6. CTA de diagnóstico.
7. **FAQ exclusiva** del segmento (4-6 preguntas que no se repiten en la madre), redactadas como las preguntaría alguien a ChatGPT.
8. Puente comercial al final.

## 3. Schema.org (JSON-LD)

- Toda página enlaza con la entidad `Organization` de la home por `@id` (`https://pebaisystems.es/#organization`), no la duplica.
- **Madre:** `WebPage` + `BreadcrumbList` + `Article` (con `author` = `Person` de Daniel o Adrián) + `FAQPage` si hay FAQ visible.
- **Subpilar de servicio:** `Service` con `provider` = la Organization, `areaServed: ES` y `audience` cuando aplique.
- Solo se marca lo que se ve en la página. Validar con el Rich Results Test / validator.schema.org antes de desplegar.

## 4. Al publicar

1. Añadir la URL a `sitemap.xml` con `lastmod` real.
2. Desplegar solo lo del commit: `python website-pebai/scripts/deploy_changed.py <commit>` (con OK del equipo).
3. Avisar a IndexNow (Bing, Yandex…) y pedir indexación en Search Console.
4. **Con OK del equipo**, registrar la keyword madre y las derivadas en SE Ranking y añadir sus preguntas a la batería GEO semanal.
5. Revisar a las 2-4 semanas: la madre aparece para la intención general, los subpilares para las búsquedas segmentadas, y no hay canibalización en Search Console.
