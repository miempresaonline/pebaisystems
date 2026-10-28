# Informe de IA generativa de Search Console: ¿se puede leer por API? (Medición, 28/10/2026)

**Verificado (prueba hoy, `searchAnalytics/query` de pebaisystems.es, 28 días):**
- Con la dimensión `searchAppearance` la API responde 200 pero **sin filas** (ni con `type=web` ni sin tipo). No hay valor de aparición para AI Overviews ni AI Mode.
- Las dimensiones normales (consulta, página, dispositivo) funcionan: dispositivo, 28 d = escritorio 5 clics / 60 impr., móvil 0 / 24, tablet 0 / 4.

**Verificado (fuentes, no documentación de Google):** Google lanzó el 3/6/2026 el informe de rendimiento de IA generativa (AI Overviews, AI Mode y funciones de IA de Discover) en Search Console, en Rendimiento › Resultados de búsqueda, pestaña «IA generativa». Métrica principal: impresiones; los clics siguen en el informe normal. Fuentes: https://ppc.land/google-finally-gives-search-console-its-own-generative-ai-visibility-reports/ y https://www.seroundtable.com/google-ai-mode-reporting-search-console-39468.html.

**Sin confirmar:** una sola fuente (Cogny, junio 2026) dice que esos datos no salen por la API; mi prueba de hoy es coherente con eso, pero no es documentación de Google. Otra fuente (ThinkProfits) habla de un filtro de aparición que no he podido reproducir: no lo uso.

**Conclusión para PEBAI:** `geo_datos.py gsc` **no puede leer** el informe de IA. Va a mano: una línea para Daniel, a la vez que «Solicitar indexación» de /posicionamiento-en-ia/ (mirar en Search Console la pestaña «IA generativa» y decir si tiene datos; con 0 clics y 64 impresiones en 28 días, lo esperable es que esté vacío, **hipótesis**). Si Google publica la API, se añade al informe.
