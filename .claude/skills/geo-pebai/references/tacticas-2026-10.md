# Tácticas GEO nuevas — investigación mayo-octubre 2026 (21/10/2026)

Complementa a `playbook-2026-10.md` (no repite lo que ya está allí). Marcas: **[V]** fuente primaria o varias coherentes · **[S]** estudio de proveedor o prensa (orientativo) · **[H]** criterio propio. Esfuerzo/impacto pensado para dos personas (Adrián y Daniel). Casi todos los datos de 2026 vienen de proveedores de GEO con interés comercial: sirven como tendencia, no como ley.

## 0. Tres cambios de fondo que corrigen el playbook

1. **El top 10 de Google ya no predice la cita en AI Overviews.** Ahrefs (863.000 keywords) ve que solo el 38 % de las URL citadas está en el top 10, frente al 76 % de julio de 2025; un 31 % viene de más allá de la posición 100. Ahrefs lo atribuye en parte a su mejor medición y en parte al *fan-out* [S, https://www.searchenginejournal.com/google-ai-overview-citations-from-top-ranking-pages-drop-sharply/568637/, 02/03/2026]. → El dato del 76 % del playbook queda desfasado.
2. **ChatGPT recupera mucho y cita poco.** AirOps (15.000 prompts): el 85 % de las páginas recuperadas no se cita; el 89,6 % de las consultas lanza 2 o más búsquedas extra; el 95 % de esas subconsultas no tiene volumen en herramientas de keywords; el 32,9 % de lo citado solo apareció en una subconsulta. Las páginas cuyo título coincide al 50 % o más con la consulta se citan 2,2 veces más (20,1 % frente a 9,3 %) [S, https://www.growth-memo.com/p/growth-intelligence-brief-16, 31/03/2026].
3. **Citar no es recomendar.** Una página tuya puede salir como fuente y que la IA recomiende a otro (ver §6).

## 1. Contenido que se cita

| Táctica | Evidencia | Esfuerzo / impacto | PEBAI este mes |
|---|---|---|---|
| **Títulos y H2 copiados de la pregunta real.** El H1/title debe repetir casi literal la pregunta del comprador. | AirOps: 2,2 veces más citas con más del 50 % de coincidencia título-consulta [S, Growth Memo 03/2026]. | Bajo / alto | Reescribir title y H1 de las URL madre con las preguntas del set de medición ("¿Cuánto cuesta implantar IA en una pyme?", "¿Qué hace una consultora de procesos con IA?"). |
| **Una página que responda a todo el abanico de subpreguntas** (precio, plazos, riesgos, qué incluye, para quién no es, alternativas). Cada sección debe entenderse sola (*chunk*). | Fan-out en ChatGPT [S, AirOps] y en AIO [S, Ahrefs 03/2026]; Aleyda Solis recomienda secciones autocontenidas [S, https://www.aleydasolis.com/en/ai-search/ai-search-optimization-checklist, act. 07/2025]. | Medio / alto | En cada servicio, bloque fijo de 6-8 H2 en forma de pregunta con respuesta de 2-3 frases al principio y detalle después. Pasar la página por un generador de fan-out gratuito para encontrar huecos. |
| **Respuesta primero, estructura limpia.** H1>H2>H3 bien anidados, resumen arriba, tono no promocional. | Semrush: claridad/resumen +32,8 %, formato P&R +25,5 %, tono promocional −26,2 % (correlaciones) [S, https://semrush.com/blog/content-optimization-ai-search-study, 01/2026]. Paper GEO-SFE: +17 % de citas solo por cambiar la estructura [S, reseña secundaria, 03/2026]. | Bajo / medio | Quitar adjetivos de venta de las páginas de servicio ("líderes", "revolucionario"); el CTA va al final (ya lo pide `seo-clean-architecture`). |
| **Frescura real, no cosmética.** Actualizar datos, ejemplos y fecha; no basta con cambiar la fecha. | AirOps: más del 60 % de las citas comerciales son de páginas actualizadas en 6 meses; si pasa más de 1 año, la probabilidad de cita cae más del 50 % [S, https://airops.com/report/the-impact-of-stale-content-on-ai-visibility, 08/2025]. On-Page.ai: el 46 % de los "actualizado" solo cambió la fecha; AIO no los distinguió, pero es arriesgado [S, 07/2026]. | Bajo / medio | Revisión mensual (primer lunes) de las 5 URL madre: un dato nuevo, un caso o una pregunta más, y `dateModified` en el JSON-LD. |
| **Datos propios publicables.** Mini-estudios con cifra y metodología. | Princeton (ya en playbook) + medios citan estudios: Perplexity tomó 16 de 30 enlaces de medios y notas de prensa en España [S, MarketingDirecto 15/10/2026]. | Medio / alto | Publicar "Visibilidad de las empresas españolas en IA: 50 consultas" con nuestro rastreador (ya medimos un 17,5 % de share of voice) y ofrecerlo a medios. |

**Longitud** [S]: las cifras se contradicen (de unas 1.000 a 2.300 palabras). Criterio [H]: lo que haga falta para cubrir el fan-out, sin relleno.

## 2. Menciones y PR en España

**Hecho clave** [S, https://www.marketingdirecto.com/digital-general/digital/mejores-agencias-geo-espana-2026-quien-recomiendan-chatgpt-perplexity-google-por-que, 15/10/2026]: para "mejores agencias GEO en España", Perplexity sacó 7 de 10 agencias de **un único ranking de MarketingDirecto**. ChatGPT citó a Cadena SER y El País. Dos de cada diez fuentes de Perplexity eran **notas de Europa Press**. Las recomendaciones son muy volátiles: salieron 35 agencias, 25 de ellas una sola vez.

**Hueco detectado** [V, búsqueda propia 21/10]: para "consultora IA", "agencia automatización IA" y "consultor n8n España", los listados en español los dominan dos sitios ligados entre sí (upliora.es y javadex.es) que se ponen primeros. No hay alta pública en upliora. Un listado independiente en un medio con datos nos pondría por delante.

| Vía | Cómo entrar | Prioridad [H] |
|---|---|---|
| MarketingDirecto, PuroMarketing, Marketing4ecommerce | Tribuna de opinión o dato propio a redacción (email de contacto en la web) | Alta: los cita Perplexity |
| Emprendedores.es (sección notas de prensa), Muy Pymes, Pymes y Autónomos, Directivos y Empresas | Nota con dato vía Comunicae (de pago, desde unos 125 €) o envío directo a redacción | Alta |
| Europa Press (comunicados) | Servicio de distribución de pago: solo cuando haya estudio propio | Media |
| Sectorial solar: pv magazine España, El Periódico de la Energía, Energías Renovables, UNEF | Caso "IA en instaladoras" con cifras | Alta (nicho de captación) |
| Directorios: Sortlist, Clutch, GoodFirms, TechBehemoths, Crunchbase | Ficha gratis + 3 reseñas reales de clientes | Media |
| Catálogo de Agentes Digitalizadores (acelerapyme.es, Red.es) | Adhesión en sede.red.gob.es si sigue abierta; es un dominio .gob con mucha confianza. Comprobar requisitos | Media (verificar) |
| Podcasts: La Tertul-IA, Crawling Mondays (Aleyda, ES/EN), podcasts de emprendimiento y energía | Propuesta de episodio con caso concreto | Media |
| Asociaciones: AI-Network, Cámaras de Comercio, AJE | Ponencia o ficha de socio | Baja-media |

Los contactos están por confirmar en cada web; no hemos escrito a ninguno (regla: nada sale sin OK de Daniel).

## 3. YouTube y LinkedIn para GEO

- **LinkedIn: artículos largos de persona, no solo posts** [S, Semrush con datos de LinkedIn, 89.000 URL, https://www.semrush.com/blog/linkedin-ai-visibility-study/, 10/03/2026]. LinkedIn aparece en el 14,3 % de respuestas de ChatGPT Search y el 13,5 % de AI Mode. Entre el 50 % y el 66 % de lo citado son **artículos** de 500-2.000 palabras; los posts citados tienen 50-299 palabras, son originales (95 %) y prácticos. ChatGPT y AI Mode citan sobre todo **perfiles personales** (59 %); Perplexity, **páginas de empresa** (59 %). No hace falta viralidad: el post citado típico tiene entre 15 y 25 reacciones. El 75 % de los autores citados publica 5 o más veces cada 4 semanas. *Esfuerzo medio / impacto alto.* **PEBAI:** un artículo de LinkedIn al mes por fundador (Adrián: procesos; Daniel: IA aplicada), con el título igual que una pregunta del set, más 5 posts útiles al mes cada uno vía Metricool. La página de empresa reutiliza el mismo contenido para Perplexity.
- **YouTube: transcripción y descripción son el texto citable** [S, Peec, 30 M de fuentes, https://docs.peec.ai/research/youtube-in-ai-search, 03/2026]. Según Ahrefs, YouTube es el dominio más citado en AIO (+34 % en 6 meses) y el 18 % de las citas de fuera del top 100 son vídeos [S, SEJ 03/2026]. Las visitas apenas pesan; cuentan el encaje con la pregunta, los capítulos y una descripción larga [S, kompozy]. *Esfuerzo medio / impacto alto en Google y bajo en ChatGPT.* **PEBAI:** vídeos de 4-8 minutos que respondan a una pregunta del set (título = pregunta), con la transcripción corregida a mano en español (la automática se equivoca con "n8n", "GEO" o "PEBAI"), capítulos y una descripción de más de 150 palabras con enlace a la URL madre. Insertar el vídeo en esa URL con `VideoObject`.

## 4. Técnica nueva frente al playbook

- **OAI-AdsBot** [V, https://developers.openai.com/api/docs/bots, consultado 21/10/2026]: nuevo bot de OpenAI que revisa las landings de anuncios en ChatGPT. No hace falta tocar nada salvo que se anuncie; no bloquearlo. Ojo: ChatGPT-User puede no respetar robots.txt.
- **Bing AI Performance** [S]: desde el 24/03/2026 relaciona consulta y página citada, y una actualización del 16/06/2026 añade intención, tema y *citation share* (fechas de fuente secundaria). Sigue en vista previa. **PEBAI:** exportar el CSV cada mes y cruzar las *grounding queries* con nuestras H2.
- **Search Console** [S, betanews, 06/2026]: los informes de IA (desde el 03/06/2026) dan impresiones en AIO/AI Mode sin clics. Medir conversiones, no clics, como pide Google [V, https://developers.google.com/search/blog/2025/05/succeeding-in-ai-search].
- **Google confirma: no hay marcado especial** [V, https://developers.google.com/search/docs/appearance/ai-features]. Hace falta que la página se rastree, se indexe y tenga texto; el schema debe coincidir con el texto visible.

## 5. Medición

- **Tres repeticiones por consulta y mes**, no una: Perplexity cambió su primera recomendación en 4 minutos y Google cambió 2 de 7 agencias en 5 [S, MarketingDirecto 10/2026]. Solo el 54 % de las URL citadas en AIO repite entre dos comprobaciones seguidas [S, Ahrefs 07/2026].
- **Medir por separado "citado" y "recomendado"** (¿nombra a PEBAI en el texto?) [S, Ahrefs 07/2026]. Añadir la columna `recomendado` a la SQLite del rastreador.
- Registrar **qué dominios cita cada motor** por consulta: así sale la lista real de medios a los que hay que llegar (§2).
- Probar en español y con la ubicación en España: en español las IAs enlazan la fuente original la mitad de veces que en inglés (22 % frente a 44 %) [S, MarketingDirecto].

## 6. Errores que hay que evitar

1. **Listicles propios donde nos ponemos los primeros.** Hubo marcas que perdieron entre el 29 % y el 49 % de visibilidad en Google en enero de 2026 por "mejores X" autopromocionales a escala [S, Lily Ray vía https://www.searchenginejournal.com/is-google-finally-cracking-down-on-self-promotional-listicles, 02/2026]. En 80 consultas B2B, AIO citó el listicle propio pero **recomendó a un rival el 69 % de las veces** [S, Lily Ray vía SEJ patrocinado, 06/2026]. Ahrefs: con una marca nueva en una categoría estrecha sí funcionó (Copilot pasó del 0 % al 65 %), pero el 43 % de las respuestas que citaban la página recomendaba a otro [V, experimento propio, https://ahrefs.com/blog/es/experimento-contenido-autopromocional-seo-ia/, 15/07/2026]. **Regla PEBAI:** sí a comparativas honestas ("consultora de IA frente a freelance n8n frente a Big Four: cuándo conviene cada una") y a decir dónde encajamos; nunca un ranking con PEBAI en el número 1.
2. **Reseñas falsas o incentivadas** en Google, Clutch o Sortlist: incumplen sus normas y la ley de consumo. Solo clientes reales.
3. **Cambiar la fecha sin cambiar el contenido** (§1).
4. **Páginas masivas por ciudad o sector generadas con IA**: es el mismo patrón de abuso a escala que penaliza Google [S, Lily Ray].
5. **Pagar a quien "te mete en ChatGPT"** o comprar rankings: no hay garantía y la volatilidad lo desmiente [S, MarketingDirecto].
6. **Atacar a la competencia** en comparativas [S, Ahrefs 07/2026].
7. **Optimizar solo para Google**: Google y la IA son métricas distintas (un grupo con 7 veces más tráfico orgánico salió en menos respuestas de IA) [S, MarketingDirecto].

## Fuentes adicionales

- https://news.designrush.com/ai-overview-citations-drop-ahrefs
- https://kompozy.io/guides/youtube-gap-in-google-ai-overviews
- https://api.on-page.ai/research/freshness-audit
- https://www.upliora.es/comparativas/mejores-agencias-consultoras-automatizacion-ia-espana-ranking-2026 (ejemplo del hueco en español)
- https://www.javadex.es/blog/mejores-podcasts-inteligencia-artificial-espanol-2026
- https://red.es/sites/redes/files/media/documents/Nota%20de%20prensa%20_%20publicacion%20catalogo%20agentes%20digitalizadores%20final_0_0_0.pdf
