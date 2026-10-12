---
name: technical-seo
description: >-
  Habilidad maestra de arquitectura técnica, rastreabilidad y Core Web Vitals para PEBAI Systems. Extraída del ecosistema de claude-seo y adaptada para auditorías de alta velocidad en producción. Audita y optimiza el rendimiento web (LCP, INP, CLS), directivas de robots.txt, sitemaps XML, canónicas, compresión de recursos, precargas críticas y eliminación de bloqueos de renderizado en Chrome y dispositivos móviles.
---

# Technical SEO: Arquitectura Técnica y Core Web Vitals

Esta habilidad proporciona el protocolo técnico para garantizar que los motores de búsqueda y los bots de IA rastreen, indexen y procesen el sitio web de PEBAI Systems a la máxima velocidad y sin fricción algorítmica.

---

## 1. Métricas Críticas: Core Web Vitals (Google UX)

Toda página web de PEBAI Systems debe superar los estándares de rendimiento técnico:

| Métrica | Qué Mide | Umbral Óptimo | Optimización Técnica Aplicada en PEBAI |
| :--- | :--- | :--- | :--- |
| **LCP** (Largest Contentful Paint) | Tiempo en renderizar el bloque de contenido principal. | **< 2.5 s** | Preload de fuentes críticas WOFF2 (`Manrope-latin-variable.woff2`), `fetchpriority="high"` en logotipos/imágenes above-the-fold. |
| **INP** (Interaction to Next Paint) | Capacidad de respuesta a clics y eventos de entrada. | **< 200 ms** | Scripts diferidos con `defer`, optimización de eventos de scroll (Lenis pasivo) y micro-interacciones táctiles vía transform CSS. |
| **CLS** (Cumulative Layout Shift) | Estabilidad visual del diseño sin saltos molestos. | **< 0.1** | Declaración explícita de `width` y `height` en SVG e imágenes, contenedores con dimensiones mínimas `aspect-ratio` fijas. |

---

## 2. Infraestructura de Rastreo e Indexación

### A. Archivo `robots.txt`
Debe permitir el rastreo limpio de todo el contenido público y facilitar el sitemap:
```txt
User-agent: *
Allow: /
Disallow: /api/
Disallow: /vendor/

Sitemap: https://pebaisystems.es/sitemap.xml
```

### B. Sitemap XML (`sitemap.xml`)
- Todas las URLs deben ser canónicas completas con HTTPS.
- Excluir redirecciones 301, páginas de prueba o endpoints con código de error.
- Atributos `<lastmod>` actualizados tras modificaciones sustanciales.

### C. Directivas de Renderizado y Enlaces
- Metatag de indexación obligatoria: `<meta name="robots" content="index,follow">`.
- Enlaces externos con `rel="noopener noreferrer"`.
- Enlaces a redes sociales o perfiles con atributos accesibles `aria-label` claros.
- Enlaces internos directos con anclas descriptivas (sin fragmentos `#` vacíos).

---

## 3. Checklist Técnico de Despliegue

Antes de subir cambios a producción:
1. **Verificación de Enlaces 200**: No deben existir referencias a archivos `.css` o `.js` con rutas rotas o versiones antiguas en caché.
2. **Cache Busting**: Incrementar el parámetro de versión (`?v=X.X`) en hojas de estilo y scripts tras cada cambio visual.
3. **Validación de Código Limpio**: Cero duplicidad de scripts en `<head>` o `<body>`.
