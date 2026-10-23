# Tablón de tareas del equipo GEO

Lo reparte el **Jefe GEO**. Cada agente, al empezar su turno, mira primero su sección: hace lo que tenga asignado (de arriba abajo) y lo marca `[x]` con la fecha. Si no tiene nada, sigue con su trabajo habitual de `docs/geo/agentes.md`.

Formato: `- [ ] AAAA-MM-DD · encargo · (de dónde sale: Vigía, informe, plan…)`

**Aviso del Jefe (22/10):** en la nube `scratch/` no se sube a git y se pierde al acabar cada turno. Los borradores que tengan que pasar de un turno a otro (páginas, posts, LinkedIn, textos de reseñas) van a `docs/geo/borradores/` (sin datos personales ni precios). Las imágenes en `docs/geo/borradores/imagenes/`.

## geo_contenido · Contenido
- [x] 2026-10-21 · Publicar /agentes-ia/ con WhatsApp como bloque principal · (plan, pilares.md) · hecho 22/10
- [x] 2026-10-21 · Publicar /ia-para-empresas/ · (plan, pilares.md) · hecho 23/10: H2 «Cómo elegir consultora de IA» con 6 criterios, caso Fran García Cars con cifras del panel, sin «Próximamente» de consultora; Kit Digital y INE reverificados el 23/10
  - 2026-10-23 (Jefe) Antes de publicar: convertir la línea de la 157 («Al elegir consultora, pregunta tres cosas…») en un H2 «Cómo elegir consultora de IA» con 4-6 criterios honestos (sin nombres de competidores ni precios) y quitar el «Próximamente» de la 165. Mencionar un caso real que encaje con sus datos de `docs/geo/borradores/casos.md` (sin cifras inventadas) · (Vigía 22/10: los competidores dominan esa pregunta con rankings propios)
- [x] 2026-10-23 · Al publicar /ia-para-empresas/, hacer lo de pilares.md §5: en `website-pebai/dist/.htaccess` sacar de la lista 302 y llevar con **301** a `/ia-para-empresas/` `empresa-de-inteligencia-artificial-espana`, `empresas-de-inteligencia-artificial-espana`, `consultoria-procesos-inteligencia-artificial`, `auditoria-adopcion-inteligencia-artificial-negocio` (posición 1,7 en Search Console esta semana) y `auditoria-procesos-empresariales`. Comprobar con curl que cada slug da 301 y que la portada y /consultoria-gratuita/ siguen en 200 tras el despliegue; si algo da 500, revertir el commit al momento · (Jefe, datos GSC 23/10) · hecho 23/10 (comprobación con curl tras el despliegue, ver panel)
- [x] 2026-10-22 · Turno de las 15:00: dejar el borrador de /ia-para-empresas/ en `docs/geo/borradores/ia-para-empresas.md` (commit), no en scratch · (Jefe: scratch se pierde en la nube) · hecho 22/10: texto completo, 7 fuentes verificadas (INE 1T 2026 publicado hoy, Reglamento 2026/1744, Red.es), listo para publicar el viernes
- [x] 2026-10-22 · En /agentes-ia/, abrir con una respuesta directa de 40-60 palabras que se pueda citar tal cual: ChatGPT cita sobre todo webs de agencias con páginas propias · (Vigía 21/10) · hecho 22/10

## geo_refresco · Refresco
- [ ] 2026-10-23 · Hacer ya lo pendiente de pilares.md §5 para lo publicado: en `website-pebai/dist/.htaccess`, sacar de la lista 302 y llevar con **301** a `/agentes-ia/` los 9 slugs de su fila (agente-de-ia-espana tiene posición 2,5 y clics esta semana y hoy acaba en la portada), y a `/posicionamiento-en-ia/` `agencia-geo-generative-engine-optimization-espana` y `como-posicionar-en-chatgpt-perplexity-gemini`. WhatsApp y voz siguen en 302 hasta que existan sus subpilares. Probar: curl -I de cada slug = 301 al destino; portada, /consultoria-gratuita/ y /diagnostico/ en 200; si algo da 500, revertir al momento. Prioridad sobre el resto · (Jefe, datos GSC 23/10)
- [ ] 2026-10-22 · /agentes-ia/ (publicada hoy) cita el INE de 2025 (21,1 %). El INE publicó el 22/10/2026 el 1T 2026: 33,6 % en empresas de 10 o más empleados y 21,4 % en las de menos de 10 (https://www.ine.es/dyngs/Prensa/ETICCE20251T2026.htm). Actualizar el dato, la fuente y la lista de fuentes, avisando de que el INE dice que no son estrictamente comparables con años anteriores (no restar puntos). dateModified de hoy · (Jefe, aviso de Contenido en el borrador) — **sigue pendiente el 23/10: hacerlo hoy**
- [ ] 2026-10-23 · Cuando Contenido publique /ia-para-empresas/, enlazarla desde /agentes-ia/ y /posicionamiento-en-ia/ (un enlace en contexto en cada una) · (Jefe, checklist del borrador)
- [ ] 2026-10-21 · Revisar /posicionamiento-en-ia/ cuando Search Console empiece a dar datos · (plan)

## geo_local · Local
- [x] 2026-10-21 · Cerrar las tareas de comprobación de Localo y seguir posiciones · (plan)

## geo_redes · Redes
- [x] 2026-10-22 · Guardar las propuestas de imagen y los borradores de LinkedIn en `docs/geo/borradores/` (commit) para que Daniel las vea; scratch/ se pierde en la nube · (Jefe) · hecho 22/10: imágenes en borradores/imagenes, LinkedIn en borradores/linkedin, post GBP 28/10 en borradores/gbp/2026-10-28
- [x] 2026-10-21 · Preparar propuestas de imagen con logos de las IAs (ChatGPT, Claude, Gemini, Perplexity), poco texto y composición variada, para que Daniel las apruebe · (Daniel) · hecho 22/10: plantilla `d-ias` (layouts orbita, pregunta, mosaico, foco), muestras en `docs/geo/borradores/imagenes/d-*.png`; aprobadas por Daniel el 22/10

## geo_medicion · Medición
- [ ] 2026-10-23 · Desde el lunes, vigilar en Search Console que las URLs viejas que pasan a 301 (agente-de-ia-espana, auditoria-adopcion-…) traspasan impresiones a /agentes-ia/ y /ia-para-empresas/ · (Jefe)
- [ ] 2026-10-22 · Search Console: 3 URLs enviadas, 0 indexadas. Vigilar a diario la indexación de /posicionamiento-en-ia/ y enviarla a Bing con `geo_datos.py bing-url` (Bing aún lee el sitemap viejo de 9 URLs) · (Jefe, datos 22/10)
- [ ] 2026-10-22 · Mirar si el informe "AI Performance" de Bing Webmaster está disponible para pebaisystems.es; si lo está, añadirlo al informe del lunes (citas en Copilot) · (Vigía 22/10)
- [ ] 2026-10-26 · Informe del lunes: repetir 3 veces las 5 preguntas sin marca más importantes (4, 5, 6, 7, 14) en Perplexity y AI Mode y anotar cuánto varía la respuesta · (Vigía 21/10: respuestas inestables)

## geo_vigia · Vigía

## Para Daniel (lo que ningún agente puede hacer)
El Jefe lo apunta aquí y se lo manda por email a equipo@pebaisystems.es. Daniel lo borra cuando esté hecho.
- [ ] Directorios: Daniel dijo que sí (23/10). Crear las cuentas de Sortlist, Clutch, agentes.ai y mejores-agencias.com con los textos de `docs/geo/perfiles/` (10 min cada una).
- [x] LinkedIn: página completa y conectada a Metricool (22/10). Publicaciones de LinkedIn: solo como borrador en Metricool para que Daniel las revise; el calendario de Reels está en Google Calendar (azul turquesa). Daniel la lleva desde otra cuenta hasta que soporte le deje verificarse.
- [ ] Casos reales: frase real y permiso de cada contacto para citarlo (Fran García, Santi de El Amparo, Pedro de Santacruz); pedir a Fran García Cars una mención o un enlace «desarrollado por PEBAI» y una reseña en Google.
- [ ] Portada (`index.html:818`): "8 de 10 empresas en España todavía no usan IA · INE, 2025" está desfasado. El INE publicó el 22/10/2026 el 1T 2026: usa IA el 33,6 % de las empresas de 10 o más empleados y el 21,4 % de las de menos de 10. Propuesta: "2 de cada 3 empresas de 10 o más empleados todavía no usan Inteligencia Artificial · INE, 1T 2026" (o "8 de cada 10 pequeñas empresas…", que sigue siendo cierto para las de menos de 10). La portada no la tocan los agentes: decide Daniel. (22/10)
