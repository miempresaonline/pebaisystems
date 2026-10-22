# Tablón de tareas del equipo GEO

Lo reparte el **Jefe GEO**. Cada agente, al empezar su turno, mira primero su sección: hace lo que tenga asignado (de arriba abajo) y lo marca `[x]` con la fecha. Si no tiene nada, sigue con su trabajo habitual de `docs/geo/agentes.md`.

Formato: `- [ ] AAAA-MM-DD · encargo · (de dónde sale: Vigía, informe, plan…)`

**Aviso del Jefe (22/10):** en la nube `scratch/` no se sube a git y se pierde al acabar cada turno. Los borradores que tengan que pasar de un turno a otro (páginas, posts, LinkedIn, textos de reseñas) van a `docs/geo/borradores/` (sin datos personales ni precios). Las imágenes en `docs/geo/borradores/imagenes/`.

## geo_contenido · Contenido
- [x] 2026-10-21 · Publicar /agentes-ia/ con WhatsApp como bloque principal · (plan, pilares.md) · hecho 22/10
- [ ] 2026-10-21 · Publicar /ia-para-empresas/ · (plan, pilares.md)
- [x] 2026-10-22 · Turno de las 15:00: dejar el borrador de /ia-para-empresas/ en `docs/geo/borradores/ia-para-empresas.md` (commit), no en scratch · (Jefe: scratch se pierde en la nube) · hecho 22/10: texto completo, 7 fuentes verificadas (INE 1T 2026 publicado hoy, Reglamento 2026/1744, Red.es), listo para publicar el viernes
- [x] 2026-10-22 · En /agentes-ia/, abrir con una respuesta directa de 40-60 palabras que se pueda citar tal cual: ChatGPT cita sobre todo webs de agencias con páginas propias · (Vigía 21/10) · hecho 22/10

## geo_refresco · Refresco
- [ ] 2026-10-22 · /agentes-ia/ (publicada hoy) cita el INE de 2025 (21,1 %). El INE publicó el 22/10/2026 el 1T 2026: 33,6 % en empresas de 10 o más empleados y 21,4 % en las de menos de 10 (https://www.ine.es/dyngs/Prensa/ETICCE20251T2026.htm). Actualizar el dato, la fuente y la lista de fuentes, avisando de que el INE dice que no son estrictamente comparables con años anteriores (no restar puntos). dateModified de hoy · (Jefe, aviso de Contenido en el borrador)
- [ ] 2026-10-23 · Cuando Contenido publique /ia-para-empresas/, enlazarla desde /agentes-ia/ y /posicionamiento-en-ia/ (un enlace en contexto en cada una) · (Jefe, checklist del borrador)
- [ ] 2026-10-21 · Revisar /posicionamiento-en-ia/ cuando Search Console empiece a dar datos · (plan)

## geo_local · Local
- [x] 2026-10-21 · Cerrar las tareas de comprobación de Localo y seguir posiciones · (plan)

## geo_redes · Redes
- [x] 2026-10-22 · Guardar las propuestas de imagen y los borradores de LinkedIn en `docs/geo/borradores/` (commit) para que Daniel las vea; scratch/ se pierde en la nube · (Jefe) · hecho 22/10: imágenes en borradores/imagenes, LinkedIn en borradores/linkedin, post GBP 28/10 en borradores/gbp/2026-10-28
- [x] 2026-10-21 · Preparar propuestas de imagen con logos de las IAs (ChatGPT, Claude, Gemini, Perplexity), poco texto y composición variada, para que Daniel las apruebe · (Daniel) · hecho 22/10: plantilla `d-ias` (layouts orbita, pregunta, mosaico, foco), muestras en `docs/geo/borradores/imagenes/d-*.png`; aprobadas por Daniel el 22/10

## geo_medicion · Medición
- [ ] 2026-10-22 · Search Console: 3 URLs enviadas, 0 indexadas. Vigilar a diario la indexación de /posicionamiento-en-ia/ y enviarla a Bing con `geo_datos.py bing-url` (Bing aún lee el sitemap viejo de 9 URLs) · (Jefe, datos 22/10)
- [ ] 2026-10-22 · Mirar si el informe "AI Performance" de Bing Webmaster está disponible para pebaisystems.es; si lo está, añadirlo al informe del lunes (citas en Copilot) · (Vigía 22/10)
- [ ] 2026-10-26 · Informe del lunes: repetir 3 veces las 5 preguntas sin marca más importantes (4, 5, 6, 7, 14) en Perplexity y AI Mode y anotar cuánto varía la respuesta · (Vigía 21/10: respuestas inestables)

## geo_vigia · Vigía

## Para Daniel (lo que ningún agente puede hacer)
El Jefe lo apunta aquí y se lo manda por email a equipo@pebaisystems.es. Daniel lo borra cuando esté hecho.
- [ ] LinkedIn: página creada (22/10, https://www.linkedin.com/company/146762534/, ya en el sameAs de la portada). Daniel la gestiona desde otra cuenta hasta que soporte le deje verificarse. Falta: completar la ficha, URL pública /company/pebai-systems y conectarla a Metricool.
- [ ] Casos reales (4-5): datos y permiso de cada cliente.
- [ ] Portada (`index.html:818`): "8 de 10 empresas en España todavía no usan IA · INE, 2025" está desfasado. El INE publicó el 22/10/2026 el 1T 2026: usa IA el 33,6 % de las empresas de 10 o más empleados y el 21,4 % de las de menos de 10. Propuesta: "2 de cada 3 empresas de 10 o más empleados todavía no usan Inteligencia Artificial · INE, 1T 2026" (o "8 de cada 10 pequeñas empresas…", que sigue siendo cierto para las de menos de 10). La portada no la tocan los agentes: decide Daniel. (22/10)
