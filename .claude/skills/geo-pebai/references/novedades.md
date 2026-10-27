# Novedades GEO (Vigía)

Etiquetas: [V] verificado en la fuente · [S] secundario · [H] hipótesis.

## 2026-10-27 (17:10 UTC: mercado español, preguntas 6-10 del set)

**Preguntas 6-10 hoy (solo WebSearch, vista de Claude, 27/10/2026) [V]:**
- P6 «Agencia para implantar un chatbot con IA en mi empresa»: salen Upliora (guía de agentes y comparativa por ciudad, cita Valenzana, Tu Agencia IA y AI Hispania), Javadex (agentes IA, casos y precios), Chatbot Chocolate (Madrid/Bogotá) y un TFG de la Universidad de Alcalá. PEBAI no sale. La respuesta avisa de que casi todo es de proveedores.
- P7 «¿Quién hace GEO en España?»: SE Ranking (https://seranking.com/es/blog/mejores-agencias-seo-geo/, con Dobuss), Marketing Directo (artículo de Sourcelift), SEOCOM, Agencia GEO (Sevilla), Upliora (rankings por ciudad) y Ainora. PEBAI no sale. La IA dice que no hay ranking neutral y recomienda comprobar si el proveedor aparece citado.
- P8 «Cuánto cuesta implantar IA en una pyme»: dominan Upliora y Javadex con rangos de precio (diagnóstico 900-1.500 €, agente de atención 5.000-12.000 €), más el dato del Banco de España (45,8 % personal cualificado, 40,8 % costes) vía Ecosistema Startup. La IA avisa de que son cifras de proveedores y que comparten ecosistema. PEBAI no sale.
- P9 «IA en reformas o construcción»: Upliora (https://www.upliora.es/blog/ia-para-constructoras-reformas-pymes-espana-2026: partes de obra, presupuestos, 12-18 h/semana perdidas, sin estudio independiente), Habitissimo y Brickanta. PEBAI no sale, aunque tenemos caso propio (Gargom).
- P10 «Automatizar WhatsApp en empresa de servicios»: Twilio, Leadsales, Wati, Burbuxa; todo proveedor de software, casi nada de España. PEBAI no sale.
*Qué cambia para PEBAI:* (1) en P8 y P6 las IAs citan precios de Upliora/Javadex y a la vez dicen que no son neutrales: nuestra página de coste (jueves) gana si explica qué pedir en un presupuesto sin cifras y enlaza el dato verificado del Banco de España. (2) P9 es la oportunidad más clara: solo hay una guía de proveedor y ningún caso real; un caso de Gargom bien contado puede ser la fuente citable. (3) P10: ningún resultado trata WhatsApp con RGPD y derivación a una persona desde España; el agente de WhatsApp ya publicado encaja y conviene enlazarlo desde el caso de reformas.

**Comprobación técnica 17:10 UTC: robots.txt da 200 a los cuatro bots, pero la portada responde 429 (Cloudflare) con el User-Agent ClaudeBot** (reproducido 5 veces y con el UA completo «compatible; ClaudeBot/1.0»); con GPTBot, OAI-SearchBot, PerplexityBot, Claude-User y sin UA da 200. Las 12:30 UTC daba 200. Puede ser limitación de la IP de la nube, pero hay que descartar que Cloudflare esté limitando al rastreador de Anthropic: Técnico debe revisar reglas de WAF y rate limiting para ClaudeBot.

## 2026-10-27 (17:00 UTC: encargos urgentes del Jefe, marco legal y ficha de Google)

**1. Reglamento (UE) 2026/1744 (Ómnibus digital de IA) [V en despachos, S en texto oficial].** Es de 8/07/2026, se publicó en el DOUE el 24/07/2026 y entró en vigor el 27/07/2026. Fuentes: https://www.cuatrecasas.com/es/spain/propiedad-intelectual/art/se-publica-reglamento-omnibus-digital-ia y https://www.garrigues.com/es_ES/garrigues-digital/publicado-reglamento-omnibus-digital-ia-redefine-plazos-simplifica-requisitos (consultadas 27/10/2026). EUR-Lex (CELEX 32026R1744) no se lee desde la nube: el texto literal sigue sin verificar [H].
- **Art. 4 (formación):** proveedores y responsables del despliegue deben adoptar medidas para apoyar la alfabetización en IA de su personal y de quienes usen los sistemas en su nombre, según conocimientos, experiencia y contexto de uso; **no se exige un nivel concreto a cada persona**. La Comisión publicará ejemplos prácticos y el Consejo de IA, recomendaciones. Es un deber más suave que el de la redacción anterior, no una derogación.
- **Art. 50 (transparencia):** se aplica desde el 2/08/2026 a sistemas introducidos desde esa fecha; los sistemas de IA generativa ya comercializados antes tienen hasta el **2/12/2026** para el marcado de contenido sintético (art. 50.2, obligación del proveedor). Sin plazo específico para el responsable del despliegue en las fuentes leídas.
- **Alto riesgo:** anexo III (empleo, educación…) hasta el 2/12/2027; productos del anexo I, sección A, hasta el 2/08/2028.
**2. Ley española de gobernanza de la IA:** Proyecto de Ley Orgánica para el buen uso y la gobernanza de la IA, aprobado por el Gobierno, con acuerdo de la Mesa del 8/06/2026 y publicado en el BOCG el 12/06/2026 (https://www.congreso.es/public_oficiales/L15/CONG/BOCG/A/BOCG-15-A-97-1.PDF), dictamen en la Comisión de Economía, Comercio y Transformación Digital, plazo de enmiendas hasta el 30/06/2026 [S: resumen de despachos]. Cubre autoridades de supervisión, espacios controlados de pruebas, sector público y régimen sancionador; no repite las obligaciones del Reglamento. **No he podido ver la ficha de tramitación en congreso.es (carga con JavaScript): decir «en tramitación en el Congreso, sin aprobar» y no afirmar que es ley vigente.**
*Qué cambia para PEBAI:* para `/ia-para-empresas/formacion/`: redactar art. 4 como «medidas razonables, sin nivel exigido a cada persona», fechar con 2026/1744 y no citar blogs anteriores al Ómnibus. Sanciones: remitir al régimen del Reglamento y al proyecto de ley, sin cifras. Para agentes de WhatsApp y voz: el art. 50 (avisar de que habla una IA) se aplica desde el 2/08/2026; el plazo hasta el 2/12/2026 es para marcar contenido sintético, no para avisar al usuario.

**3. Ficha de Google: «Preguntas y respuestas» desaparece [V].** Google confirmó el 3/12/2025 en el foro oficial de ayuda de Business Profile (Dan Boguslavsky, Product Specialist) que retira en esencia las preguntas y respuestas de Maps y las sustituye por un botón «Ask» con respuestas de IA basadas en las respuestas del negocio y las reseñas; la API de Q&A se cerró el 3/11/2025 (aviso del 17/09/2025). La sección sigue accesible en el panel del negocio para responder. Fuente: https://ppc.land/google-quietly-kills-q-a-for-an-ai-button-most-wont-use/ (22/12/2025; cita a Search Engine Roundtable, 15/12/2025). No hay calendario ni mercados oficiales.
*Qué cambia para PEBAI:* no invertir en preguntas y respuestas públicas de la ficha; mejor reseñas con detalle, descripción, servicios y posts claros, que son lo que alimenta las respuestas de IA de Maps. Local: sustituir la mejora «Q&A de la ficha» por servicios, descripción y reseñas.

## 2026-10-27 (mediodía: estudios y casos, mejora continua a: preguntas 1-5 del set)

**Preguntas 1-5 del set hoy (solo WebSearch, vista de Claude, 27/10/2026) [V]:**
- P1 «¿Qué es PEBAI Systems?»: PEBAI no sale. La búsqueda lo confunde con PEBA (agencia de beneficios de Carolina del Sur, https://peba.sc.gov), PEBA (polímero) y Pebble Beach Systems (broadcast, Reino Unido).
- P2 «¿Es fiable PEBAI Systems?»: PEBAI no sale; salen PEBA de Carolina del Sur y PE Systems (Glassdoor). La IA recomienda mirar registro mercantil y reseñas de clientes, que hoy no encuentra.
- P3 «¿Quiénes son los fundadores?»: PEBAI no sale; responde con los fundadores de Pebble Beach Systems (Peter Hajittofi, Ian Cockett). Riesgo: atribución errónea de entidad.
- P4 «¿Qué empresa me recomiendas para automatizar procesos con IA en España?»: sin ranking independiente; salen Aizora (Getafe, perfil de Clutch, https://clutch.co/profile/aizora) y Creamos IA (Bilbao, nota de prensa en emprendedores.es), más datos de adopción (ONTSI 11,4 %). PEBAI no sale.
- P5 «Mejores consultoras de IA para pymes en España»: dominan javadex.es (dos rankings propios) y upliora.es (varios rankings y fichas por ciudad). La IA advierte de que son marketing y de que no hay comparativa independiente. PEBAI no sale.

*Qué cambia para PEBAI:* (1) P1-P3 son un problema de entidad: sin ficha propia reconocible las IAs no saben quién es PEBAI y lo confunden con otros PEBA. Hace falta señal de entidad (sameAs, Organization con fundadores en la portada, perfiles en directorios, Wikidata si cumple los criterios). (2) P4-P5: las IAs ya desconfían de los rankings que escriben las propias agencias y piden fuentes independientes y reseñas de clientes; un perfil en Clutch o Sortlist con reseñas reales pesa más que otro ranking propio. Los directorios que Daniel aprobó el 23/10 suben de prioridad.
Comprobación técnica 12:30 UTC: robots.txt y portada dan 200 a GPTBot, OAI-SearchBot, ClaudeBot y PerplexityBot.

## 2026-10-27 (mañana: buscadores e IAs, mejora continua a)

Sin novedades útiles en las últimas 48 h: las búsquedas sobre Google (AI Overviews/AI Mode), OpenAI, Perplexity y Bing/Copilot solo devuelven lo ya anotado (AFP, 16/10/2026) y material de 2024-2025. Descartado.

**Preguntas del set hoy (solo WebSearch, vista de Claude, 27/10/2026) [V]:**
- P11 «Agente de voz con IA para atender llamadas en una clínica»: salen Retell AI (dos guías, ranking de 8 agentes para clínicas, https://www.retellai.com/es/blog/top-8-ai-voice-agents-for-appointment-scheduling-in-clinics-and-healthcare), ElevenLabs (dos landings de atención médica) y CloudTalk (https://www.cloudtalk.io/es/agente-de-voz-ia-para-sanidad/). Todo software extranjero, nada de consultoras españolas; la respuesta menciona HIPAA (EE. UU.) y avisa de verificar RGPD. PEBAI no sale.
- P13 «¿Cómo responder más rápido a los presupuestos con IA?»: GelatoConnect (impresión), eplaneai (aviación), Beam AI y Salesforce. Cifras de marketing (15 segundos, 5 minutos) sin verificar; sin ninguna fuente española de pymes de servicios. PEBAI no sale.
*Qué cambia para PEBAI:* hay hueco real en ambas, con la ventaja de ser local (RGPD y datos de salud en España en P11; un caso propio, Gargom o Santacruz, en P13). En P11 los textos que ganan son guías de herramienta con «cumplimiento»; una página con RGPD/LOPDGDD y derivación a una persona sería diferencial. P13 ya está en cola de Contenido (satélite de presupuestos).

Comprobación técnica 07:05 UTC: robots.txt y portada dan 200 a GPTBot, OAI-SearchBot, ClaudeBot y PerplexityBot.

## 2026-10-26 (20:00: mercado español, mejora continua b)

Sin novedades fechadas de las últimas 48 h en buscadores ni IAs (la búsqueda solo devuelve material de 2025 o sin fecha). Descartado.
**Análisis de una página que citan las IAs: Upliora, «Mejores agencias GEO por ciudad» (30/08/2026)** [V]. Fuente: https://www.upliora.es/blog/mejores-agencias-geo-espana-por-ciudad-2026-ranking (consultada 26/10/2026). Qué tiene que nosotros no, en 3 puntos:
1. **Cifra con método a la vista**: «28,5 % de cuota de voz, posición media de cita 1,4, panel de 110 prompts, Q2 2026», repetida en el TL;DR, en el cuerpo y en el pie de gráfico. Es autoinformada (el ranking lo publica Upliora, que comparte fundador con Javadex), pero un modelo la extrae sin esfuerzo porque está en una frase corta con número, panel y fecha.
2. **Una página por cada consulta de ciudad** («generative engine optimization Tenerife», Huesca, Murcia…) con tabla de 3 filas (especialista, base, enfoque, tarifa) y un argumento fijo: «los LLM no saben dónde trabaja el consultor, no hay ventaja de proximidad». Cubre cola larga que nosotros no tocamos.
3. **Posicionamiento «diagnóstico honesto»**: «si tu categoría no genera consulta, te lo dice y no te vende proyecto». Es la misma promesa que nuestra consultoría de 25 min, pero ellos la dicen en el titular de cada ciudad.
*Qué cambia para PEBAI:* no copiar (rankings propios y precios están descartados por regla). Sí: (a) cuando haya una semana con PEBAI citada, publicar nuestro número con la misma estructura corta (n.º de preguntas, motores, fechas, cuántas veces salimos), y mientras sea 0, decir con transparencia cómo se mide; (b) la frase «las IAs no distinguen dónde estás, leen tus señales» es citable y encaja en /posicionamiento-en-ia/ con fuente propia, sin su ranking.
Intento de leer el ranking de Marketing Directo con «baselines en 4llms» (https://www.marketingdirecto.com/imprescindibles/imprescindibles-digital/las-10-mejores-agencias-geo-de-espana-en-2026-primer-ranking-con-baselines-en-4llms): la lectura automática devolvió vacío; pendiente de abrir otro turno [H, sin verificar].

Comprobación técnica 19:05 UTC: robots.txt y portada dan 200 a GPTBot, OAI-SearchBot, ClaudeBot y PerplexityBot.

## 2026-10-26 (tarde: mercado español y competencia)

1. **Javadex presume de 28,5 % de cuota de voz en IAs y 2.200 citas en Copilot, con datos propios** [S]. Upliora (mismo fundador, lo declara) publica la guía "GEO para empresas" con Javadex como caso (0 % a 28,5 % en 12 meses, agosto 2026) y Javadex un caso práctico de 2.200+ citas en Copilot/Bing (dic 2025 a feb 2026) y 240+ posts GEO en cinco meses. Fuentes: https://www.upliora.es/blog/geo-empresas-aparecer-chatgpt-claude-perplexity-2026 y https://www.javadex.es/blog/caso-practico-geo-javadex-upliora-2200-citaciones-llm-estrategia-2026 (consultadas 26/10/2026). Cifras autoinformadas, sin metodología verificable.
   *Qué cambia para PEBAI:* hoy el dato nuestro es 0 de 6; no se compite en volumen (240 posts). Sí se puede competir en transparencia: publicar cómo medimos (repetir cada pregunta, por motor) cuando haya una semana con PEBAI citada. No citar sus cifras en la web.
2. **Upliora ya tiene comparativa de "agencias de agentes de IA y automatización"** con Javadex primero (desde 5.000 € + IVA, primer agente en 2-4 semanas, conecta WhatsApp Business, ERP y CRM) [S]. Fuente: https://www.upliora.es/blog/mejores-agencias-agentes-ia-automatizacion-espana (26/10/2026). *Para PEBAI:* confirma que P6/P10 (agentes de WhatsApp) se disputan con rankings propios; el subpilar de WhatsApp con caso real (Fran García Cars) y la sección de integración con CRM/agenda es el contrapeso. Sin precios en nuestras páginas.
3. Rankings GEO por ciudad de Upliora (Valencia y otras) presentan a Javadex como número 1 nacional [S]. Refuerza dejar Valencia en espera de Daniel hasta tener casos locales reales.

Comprobación técnica 17:00 UTC: robots.txt y portada dan 200 a GPTBot, OAI-SearchBot, ClaudeBot y PerplexityBot.

## 2026-10-26 (mediodía: estudios y casos)

Sin estudios independientes nuevos de Ahrefs, Semrush o SE Ranking del 24-26/10: solo salen comparativas de herramientas de proveedores (marzo 2026 o sin fecha). Descartado.
Mejora continua (a), búsqueda web a las 12:10 UTC [V]:
- **P8 «Cuánto cuesta implantar IA en una pyme española»**: no sale PEBAI. Siguen Javadex y Upliora con rangos propios (diagnóstico 900-1.500 €; micro-pyme 2.500-5.000 € más cuota; pyme 4.000-8.000 €). La IA advierte de que son consultoras comerciales y que no hay fuente independiente que valide los precios. Dato nuevo [S]: según el Banco de España (citado por Ecosistema Startup, https://ecosistemastartup.com/?p=108334), la falta de personal cualificado frena la adopción en el 45,8 % de los casos y el coste en el 40,8 %. Fuentes: https://www.upliora.es/blog/cuanto-cuesta-implementar-ia-pyme-espana-por-tipo-proyecto-2026 , https://www.javadex.es/blog/cuanto-cuesta-implementar-ia-pyme-espana-2026 (26/10/2026).
*Qué cambia para PEBAI:* confirma el encargo de la página «de qué depende el coste» sin cifras: el hueco es ser la fuente neutral que explica factores y qué pedir en un presupuesto. Antes de citar el 45,8 % hay que verificarlo en el Banco de España (solo secundario hoy).

Comprobación técnica 12:10 UTC: robots.txt y portada dan 200 a GPTBot, OAI-SearchBot, ClaudeBot y PerplexityBot.

## 2026-10-26 (mañana: buscadores e IAs)

Sin anuncios útiles en las últimas 48 h de OpenAI, Google, Perplexity, Microsoft, Brave ni Anthropic (la búsqueda solo devuelve material de enero a agosto 2026 o comparativas sin fecha). Descartado.

**Mejora continua (a): P5 y P13 hoy** [V]
- **P5 «Mejores consultoras de IA para pymes en España»:** salen Javadex (2 rankings propios, primero en ambos), Upliora (comparativa y rankings freelance, con Javadex #1) y fichas de Upliora por ciudad (Madrid, Barcelona, Zaragoza); también PwC, Minsait, IBM, Telefónica Tech y Capgemini como grandes. PEBAI no sale. Fuentes: https://www.javadex.es/blog/mejores-consultoras-inteligencia-artificial-espana-2026-ranking-medianas-empresas , https://www.upliora.es/comparativas/mejores-consultores-ia-espana-2026 (26/10/2026). El buscador ya advierte que son rankings no independientes.
- **P13 «Responder más rápido a presupuestos con IA»:** solo salen proveedores de software (Gelato, Beam.ai, Salesforce, eplaneai) con cifras propias sin verificar; ninguna consultora española ni caso de pyme de servicios. Fuente: https://www.gelato.com/es/connect/article/software-presupuestos-impresion-ia-2026 (26/10/2026). *Qué cambia para PEBAI:* hueco real en presupuestos con IA para pymes de servicios (reformas, instalaciones); un caso con Gargom o Santacruz de `casos.md`, con datos reales, sería la única respuesta en español con prueba.

Comprobación técnica 07:15 UTC: robots.txt y portada dan 200 a GPTBot, OAI-SearchBot, ClaudeBot y PerplexityBot.

## 2026-10-25 (tarde: mercado español y competencia)

Sin anuncios nuevos en las últimas 48 h en el mercado español: las búsquedas de rankings y agentes de WhatsApp para pymes solo devuelven lo ya anotado (Marketing Directo, Javadex, Upliora, Geotoolbox). Descartado.

**Análisis de competidor (mejora continua b): página que citan las IAs, ranking de consultores de agentes de IA de Upliora** [V]. Fuente: https://www.upliora.es/blog/mejores-consultores-agentes-ia-espana-ranking-especialidad-2026 (publicada 22/04/2026, consultada 25/10/2026). Qué tiene que nosotros no:
1. Criterios de elección explícitos y citables (casos verificables, precio cerrado y no por horas, stack declarado, KPIs de salida, mantenimiento posterior), más lista de errores comunes. /ia-para-empresas/ ya tiene 6 criterios; falta replicarlos en /agentes-ia/ con el enfoque de WhatsApp.
2. Un ejemplo de retorno con números (equipo de 5 personas ahorrando un día a la semana). Sin metodología y con precios orientativos, no es verificable [S].
3. Ranking por especialidad (conversacionales, automatización, desarrollo, analítica, formación): cubre varias intenciones de búsqueda en una sola URL.
*Qué cambia para PEBAI:* su punto débil es que se pone primero un autor con conflicto de interés y sin metodología; PEBAI puede ganar con lo contrario: criterios y un caso real con cifras del panel (Fran García Cars), sin ranking propio ni precios. No copiar el formato de ranking.

Comprobación técnica 17:05 UTC: robots.txt y portada dan 200 a GPTBot, OAI-SearchBot, ClaudeBot y PerplexityBot.

## 2026-10-25 (mediodía: estudios y casos)

Sin estudios independientes nuevos del 23-25/10 de Ahrefs, Semrush o SE Ranking: las búsquedas devuelven material de marzo a agosto 2026 ya conocido o de proveedores sin metodología. Descartado.
Mejora continua (a), búsqueda web a las 12:10 UTC [V]:
- **P14 "Consultora de IA para empresas en Valencia"**: no sale PEBAI. Salen 8 de 9 resultados de Upliora, que tiene una página por tema y ciudad (`/expertos/<tema>/valencia`: consultoría IA, automatización de procesos, IA generativa, visión, NLP, transformación digital) que recomiendan a Javadex como primero; además Everywan (`everywan.com/en/ai-automation-valencia`) y grandes (Plain Concepts, Capgemini, Intelygenz). Fuentes: https://www.upliora.es/expertos/consultoria-ia/valencia , https://everywan.com/en/ai-automation-valencia (consultadas 25/10/2026).
- **P7 "¿Quién hace GEO (posicionamiento en ChatGPT) en España?"**: no sale PEBAI. Salen Sourcelift (ranking propio de Marketing Directo), SEOCOM, Peack Agency, rankings de Upliora y guías de precios de Geotoolbox y SE Ranking. Fuentes: https://seocom.agency/en/geo-agency/ , https://clutch.co/profile/peack-agency
*Qué cambia para PEBAI:* en Valencia los competidores usan páginas programáticas casi idénticas por tema; el hueco es una página local con prueba real (ficha de Google, quién atiende, casos de la zona), como ya recoge el borrador de `/ia-para-empresas/valencia/`. En P7 aparecen Peack y SEOCOM con perfil en Clutch o web GEO propia: sin la página de directorios (pendiente de Daniel) y sin una página GEO con caso, seguimos fuera.

Comprobación técnica 12:05 UTC: robots.txt y portada dan 200 a GPTBot, OAI-SearchBot, ClaudeBot y PerplexityBot.

## 2026-10-25 (mañana: buscadores e IAs)

Sin anuncios fechados del 23-25/10/2026 de OpenAI, Google (AI Overviews/AI Mode), Perplexity, Microsoft, Anthropic o Brave: las búsquedas solo devuelven material de 2024-2026 ya conocido (lo último de Google es del 15/10, ya anotado; lo de Brave, julio 2026, es una captura no oficial). Descartado.
Mejora continua (a), búsqueda web a las 07:15 UTC [V]:
- **P4 "¿Qué empresa me recomiendas para automatizar procesos con IA en España?"**: no sale PEBAI. Salen Creamos IA (Bilbao, llamadas), Aizora (Getafe, perfil de Clutch, fundada en 2026, datos autodeclarados) y noticias genéricas de adopción. Fuentes: https://emprendedores.es/noticias-de-empresa/nace-en-bilbao-una-agencia-de-ia-que-automatiza-llamadas-y-el-30-de-las-tareas-en-empresas-espanolas/ , https://clutch.co/profile/aizora
- **P8 "Cuánto cuesta implantar IA en una pyme española"**: no sale PEBAI. Salen guías de precios de Javadex y Upliora (3 de los 4 primeros resultados, con rangos en euros: diagnóstico 900-1.500 €, implantación 2.500-8.000 € más cuota mensual); la respuesta de la IA advierte de que son blogs comerciales. Fuentes: https://www.javadex.es/blog/cuanto-cuesta-implementar-ia-pyme-espana-2026 , https://www.upliora.es/blog/cuanto-cuesta-implementar-ia-pyme-espana-por-tipo-proyecto-2026
*Qué cambia para PEBAI:* en P8 mandan los competidores con cifras; nosotros no publicamos precios, así que el hueco es una página «de qué depende el coste» honesta (factores, fases, qué pedir en un presupuesto, subvenciones), sin cifras. En P4 el hueco lo ocupan agencias nuevas con perfil en Clutch: el perfil de Clutch de `docs/geo/perfiles/` (pendiente de Daniel) pesa.

Comprobación técnica 07:05 UTC: robots.txt y portada dan 200 a GPTBot, OAI-SearchBot, ClaudeBot y PerplexityBot.

## 2026-10-24 (tarde: mercado español y competencia)

Sin rankings ni estudios nuevos del 22-24/10: las búsquedas solo devuelven los listados ya anotados (Marketing Directo, SE Ranking, Geotoolbox). Descartado.
Mejora continua (b), página de un competidor [V]: guía de Upliora "IA para farmacias y su ecosistema" (22/10/2026, https://www.upliora.es/blog/ia-farmacias-asesorias-compraventa-oficinas-farmacia-2026, consultada 24/10/2026). Qué tiene que nosotros no:
1. **Una guía por sector cada día** (farmacias, procuradores, academias, ERP de escritorio: 4 en una semana), de 4.000-5.000 palabras con tablas. Cobertura vertical enorme; PEBAI tiene 0 verticales publicadas.
2. **Fuentes oficiales con "comprobado el 19/10" y fecha de próxima revisión**, y resumen de 5 viñetas arriba. Es un patrón de frescura fácil de copiar en nuestras páginas (sin copiar contenido).
3. **Casos anonimizados sin cifras** y autoría de "Equipo Editorial" con un consultor externo: es débil. PEBAI tiene casos reales con nombre (Fran García Cars, Gargom) y autores personales: ahí ganamos, pero hay que ponerlos en las páginas.
*Qué cambia para PEBAI:* competir en volumen vertical no compensa; sí compensa publicar menos páginas con caso real, fuente fechada y "próxima revisión".

Comprobación técnica 24/10: robots.txt y portada dan 200 a GPTBot, OAI-SearchBot, ClaudeBot y PerplexityBot.

## 2026-10-24 (mediodía: estudios y casos)

1. **ChatGPT cita ya unas 39 fuentes por respuesta; Google AI Mode ha bajado a 5,5** [V, tracker de proveedor]. Cloro (1.941.005 respuestas, 1/05 a 23/10/2026, ~2.200 prompts comerciales en 38 países, una vez al día por motor): semana del 19/10, ChatGPT 39,0 fuentes por respuesta (14,2 en la semana del 4/05), AI Mode 5,5 (13,9 en mayo), Gemini 11,0, Perplexity 10,7 (semana del 28/09), AI Overview 7,1, Copilot 5,6. "Fuente" = entrada de la lista de fuentes del motor. Fuente: https://cloro.dev/research/ai-citation-tracker/ (23/10/2026). Reserva: es una herramienta comercial y la muestra no es de España.
   *Qué cambia para PEBAI:* en ChatGPT hay mucho más sitio para ser una de las fuentes (más oportunidad para páginas citables y menciones en listados); en AI Mode y Copilot el hueco se estrecha, ahí pesa más estar en el top orgánico de Google/Bing. Refuerza medir por motor y no mezclar.
2. Sin estudios independientes nuevos: los casos de GEO que salen (Gofish Digital, Single Grain) son autoinformados por agencias, sin metodología [S]; descartados.

Mejora continua (a), búsqueda web a las 12:15 UTC [V]:
- **P6 "Agencia para implantar un chatbot con IA en mi empresa"**: no sale PEBAI. Salen Hackceleration, Aunoa (WhatsApp, web e Instagram, "90 % de consultas repetitivas", cifra de proveedor), Asest/Bolmia, INESEM y la guía de agentes de Upliora (primer agente en 4-8 semanas, 5.000-15.000 €). Fuentes: https://hackceleration.com/es/agencia-de-ia/agentes-ia , https://aunoa.ai/automatizacion-procesos/ , https://www.upliora.es/blog/agentes-ia-para-empresas-espana-guia-2026
- **P10 "Automatizar la atención por WhatsApp de una empresa de servicios con IA"**: no sale PEBAI. Salen Twilio, Leadsales, Aunoa, Burbuxa y Chattigo: blogs de software y proveedores latinoamericanos, ninguno con caso español de una pyme de servicios. Fuente: https://aunoa.ai/bots-en-whatsapp-transforma-tu-servicio-de-atencion-al-cliente-con-ia/
*Qué cambia para PEBAI:* en WhatsApp para pymes de servicios las respuestas las ocupan guías genéricas de herramientas; /agentes-ia/ (WhatsApp como bloque principal) y un subpilar de WhatsApp con el caso real de Fran García Cars tienen hueco claro. Aunoa es el competidor directo a vigilar en agentes de WhatsApp.

Comprobación técnica 12:05 UTC: robots.txt y portada dan 200 a GPTBot, OAI-SearchBot, ClaudeBot y PerplexityBot.

## 2026-10-24 (mañana: buscadores e IAs)

Sin anuncios fechados del 22-24/10/2026 de OpenAI, Google, Perplexity, Microsoft, Anthropic o Brave (solo comparativas secundarias de tech-insider.org; descartadas). Mejora continua (c), respuesta al encargo del tablón sobre Bing:
- **Bing Webmaster Tools tiene el informe "AI Performance"** (vista previa pública desde feb 2026, abierto a cualquier sitio verificado): citas en Copilot, resúmenes de Bing y socios de IA; exportes de totales diarios, por página y "grounding queries". **Sin API** (en su lista pendiente, sin fecha) y no se puede filtrar por canal [V]. En junio 2026 añadió Intents, Topics, Citation Share y Compare (vista previa) [S]. Si da clics es dudoso [H]. Fuentes: https://searchengineland.com/bing-webmaster-tools-testing-new-ai-performance-report-468039 ; https://www.searchinfluence.com/blog/bing-ai-performance-report-copilot-citations/ ; https://pasqualepillitteri.it/en/news/5220/bing-webmaster-tools-ai-citation-share-geo (consultadas 24/10/2026).
  *Qué cambia para PEBAI:* es la única medición oficial de citas en una IA; como no hay API, `geo_datos.py bing` no la trae y hay que mirarla a mano en el panel de Bing (acción para Daniel o para Medición si hay acceso). Para PEBAI, con poco tráfico, un solo dato semanal ya sirve.

Comprobación técnica 07:05 UTC: robots.txt y portada dan 200 a GPTBot, OAI-SearchBot, ClaudeBot y PerplexityBot.

## 2026-10-23 (mediodía: estudios y casos)

Sin estudios nuevos y fiables de las últimas 48 h (las búsquedas devuelven informes de proveedores sin fecha de octubre; descartado). Mejora continua (a): dos preguntas del set, búsqueda web a las 12:10 UTC [V]:
- **P7 "¿Quién hace GEO en España?"**: no sale PEBAI. Salen Geotoolbox, Sourcelift (Marketing Directo, 15/10), SE Ranking (ranking de agencias SEO/GEO con Dobuss y Webpositer) y varios rankings de Upliora. Fuentes: https://geotoolbox.ai/es/blog/agencia-geo , https://seranking.com/es/blog/mejores-agencias-seo-geo/ , https://www.upliora.es/blog/mejores-agencias-geo-espana-por-ciudad-2026-ranking
- **P14 "Consultora de IA en Valencia"**: no sale PEBAI. Salen Everywan (landing por ciudad) y 7+ páginas por servicio y ciudad de Upliora (/expertos/<servicio>/valencia), con Javadex, Plain Concepts, Capgemini e Intelygenz en su Top 10 de Valencia (feb 2026). Fuente: https://www.upliora.es/expertos/consultoria-ia/valencia (23/10/2026).
*Qué cambia para PEBAI:* las respuestas con ciudad las ganan landings por ciudad x servicio; PEBAI (Valencia) no tiene ninguna. Ninguna fuente da un solo dato verificable de resultados.

Comprobación técnica 12:10 UTC: robots.txt y portada dan 200 a GPTBot, OAI-SearchBot, ClaudeBot y PerplexityBot.

## 2026-10-23 (tarde: mercado español y competencia)

1. **Elevam lidera el ranking de agencias GEO de Marketing Directo y apoya su posición en investigación propia** [V]. El ranking (13/03/2026, actualizado 18/03, firma la Redacción de MKD) usa 15 prompts en español en ChatGPT, Claude, Gemini y Perplexity (pruebas de marzo 2026): Elevam 11/15, Webpositer 10/15, Human Level 10/15; PEBAI no aparece. Fuente: https://www.marketingdirecto.com/imprescindibles/imprescindibles-digital/las-10-mejores-agencias-geo-de-espana-en-2026-primer-ranking-con-baselines-en-4llms (consultada 23/10/2026). Elevam tiene /geo/, /glosario-geo/, /curso-de-geo/, /proyectos/ y /investigacion/geo/baselines/ con metodología y archivos descargables, y un marco propio (CREF) (https://www.elevam.es, 23/10/2026). Javadex, en cambio, solo lista GEO como uno de seis servicios, sin páginas ni casos (https://www.javadex.es, 23/10/2026).
   *Qué cambia para PEBAI:* lo que hace citable a Elevam son un glosario, una metodología publicada y datos propios descargables, no solo páginas de servicio. PEBAI puede publicar sus mediciones semanales (con método y fecha) como dato propio; ninguna consultora de IA para pymes lo hace.
2. **Guías de compra y rankings se retroalimentan** [S]. Geotoolbox, SE Ranking y Ainora publican guías de precios y rankings de agencias GEO en España (oct 2026), todas comerciales. Sin cambio respecto a lo ya anotado el 21/10.

Comprobación técnica 23/10: robots.txt y portada dan 200 a GPTBot, OAI-SearchBot, ClaudeBot y PerplexityBot.

## 2026-10-23 (mañana: buscadores e IAs)

Sin novedades útiles en las últimas 48 h: búsquedas sobre OpenAI, Google (AI Overviews/AI Mode), Perplexity, Bing/Copilot y Brave no devuelven anuncios fechados del 21-23/10/2026 (solo lo ya anotado del 15/10 y material de 2024-2025). Descartado.
Comprobación técnica 07:00 UTC: robots.txt y portada dan 200 a GPTBot, OAI-SearchBot, ClaudeBot y PerplexityBot.

## 2026-10-22 (tarde: mercado español y competencia)

1. **Javadex y Upliora ocupan las respuestas de "mejores consultoras de IA" con rankings propios** [V]. Upliora publica comparativas y rankings (21 comparativas, 290+ artículos, artículos del 19 al 22/10/2026) y Javadex (freelance) sale primero en casi todos; Upliora enlaza a Javadex y se dice independiente. Fuentes: https://www.upliora.es/blog/mejores-consultoras-ia-pymes-espana-2026-ranking-editorial y https://www.javadex.es/blog/mejores-consultoras-inteligencia-artificial-espana-2026-ranking-medianas-empresas (consultadas 22/10/2026). Encaja con Sourcelift (Marketing Directo, 15/10/2026): 4 de 5 menciones de la agencia más nombrada salieron de un ranking de otra agencia [S].
   *Qué cambia para PEBAI:* las IAs se alimentan de rankings escritos por los propios competidores. Ninguno de los dos tiene páginas GEO ni de agentes de WhatsApp para pymes; ahí PEBAI puede ser la fuente citable.
2. **Upliora no habla de GEO** [V]. Su portada vende consultoría y formación en IA con diagnóstico gratuito de 30 min; sin página GEO propia. Fuente: https://www.upliora.es (22/10/2026). *Para PEBAI:* hueco en "GEO para empresas" confirmado, y su oferta gratuita de 30 min es muy parecida a nuestra consultoría de 25 min: conviene dejar claro lo diferencial (5 plazas, medición abierta).
3. Otras agencias GEO españolas que salen en búsqueda (Deslumbra IA, La Buhardilla del Marketing) son autopromoción sin datos verificables [S]; solo vigilar.

Comprobación técnica 18:00: robots.txt y portada dan 200 a GPTBot, OAI-SearchBot, ClaudeBot y PerplexityBot.

## 2026-10-22 (mediodía: estudios y casos)

Sin novedades útiles en las últimas 48 h: las búsquedas de estudios de Ahrefs, Semrush y SE Ranking solo devuelven comparativas de herramientas y blogs de agencias sin fecha de octubre. Descartado por no ser fuente fiable ni reciente (p. ej. el test de agosto 2026 de Something Inc., 30 preguntas, solapamiento bajo entre motores: https://somethinginc.com/blog/ai-engine-citation-overlap-study/ [S]; coincide con la inestabilidad ya anotada y refuerza repetir cada pregunta varias veces).
Comprobación técnica: robots.txt y portada dan 200 a GPTBot, OAI-SearchBot, ClaudeBot y PerplexityBot.

## 2026-10-22 (mañana: buscadores e IAs)

1. **Google sube los enlaces dentro de AI Overviews y AI Mode** [V]. Anunciado el 15/10/2026 (AFP, 16/10): enlaces contextuales más frecuentes y más arriba, carrusel de enlaces ampliado a todo el mundo, enlaces finales de los resúmenes más visibles, y prioridad a las "fuentes preferidas" del usuario. Fuente: https://www.ewn.co.za/google-boosts-news-and-link-visibility-in-ai-mode/ (16/10/2026). Contexto: las etiquetas de fuente preferida en AI Mode llegaron en mayo 2026 (https://www.searchenginejournal.com/google-expands-preferred-sources-publisher-ai-partnerships/563062/).
   *Qué cambia para PEBAI:* más oportunidad de clic desde respuestas de IA, pero pensada sobre todo para medios y contenido de actualidad; para PEBAI cuenta tener páginas claras y citables y que los autores (Daniel, Adrián) sean reconocibles.
2. **Bing Webmaster Tools: informe "AI Performance"** [S, no es de las últimas 48 h]. En vista previa desde feb 2026; el 16/06/2026 añadió Intents, Topics, Citation Share y Compare. Fuente secundaria: https://www.searchinfluence.com/blog/bing-ai-performance-report-copilot-citations/ . Sin datos tras julio 2026 en lo que he encontrado.
   *Qué cambia para PEBAI:* si el sitio está verificado en Bing, medir citas en Copilot con este informe; comprobar si `geo_datos.py bing` lo recoge.

Sin novedades útiles de OpenAI ni Perplexity en las últimas 48 h (búsqueda sin resultados fechados).

## 2026-10-21 (tarde: mercado español y competencia)

1. **Primer ranking español de agencias GEO con pruebas en IAs** [V, con reservas]. Marketing Directo (15/10/2026): 4 pruebas de Sourcelift (29/9 a 8/10), cada pregunta una sola vez. Salieron 35 agencias distintas y 25 solo una vez; ChatGPT (sin sesión) citó sobre todo webs de agencias, Perplexity medios y notas de prensa; el contenido en inglés se enlaza a su origen el doble que el español (44 % vs 22 %). PEBAI, Javadex y Upliora no aparecen. Fuente: https://www.marketingdirecto.com/digital-general/digital/mejores-agencias-geo-espana-2026-quien-recomiendan-chatgpt-perplexity-google-por-que (15/10/2026). Reserva: lo firma una agencia que se pone la primera, muestra mínima.
   *Qué cambia para PEBAI:* las menciones vienen de webs propias y de listados publicados; las respuestas son inestables, así que la medición semanal debe repetir cada pregunta varias veces.
2. **Guía de compra GEO con rango de precios en España** [S]. Geotoolbox y SE Ranking (ranking 16/10/2026): agencias boutique desde ~299 €/mes hasta ~1.500 €/mes; auditorías 1.000-2.500 €. Fuente: https://geotoolbox.ai/es/blog/agencia-geo y https://seranking.com/es/blog/mejores-agencias-seo-geo/ (oct 2026). Fuentes comerciales. *Para PEBAI:* solo contexto interno, no se publican precios.
3. **Competencia: javadex.es** [V]. Su web vende un sistema de IA desde 5.000 € (4-8 semanas) con GEO como un servicio más entre seis; sin páginas GEO propias visibles. Fuente: https://javadex.es (consultada 21/10/2026). *Para PEBAI:* hueco para páginas GEO dedicadas y citables.

## Para el Jefe

(Repartido por el Jefe el 27/10 tarde: señal de entidad, a Contenido (borrador de `/sobre-pebai/` con Organization y Person) y a Preguntas (preguntas de confianza); Organization con founder y sameAs ya está en la portada (Técnico comprueba que sigue tras el rediseño). Clutch y el resto de directorios siguen en «Para Daniel» porque exigen crear cuenta.)
(Repartido el 27/10 mañana: ángulo pyme española, RGPD, derivación y caso propio para P13 y P11, a Contenido; frase citable y FAQ de GEO en /posicionamiento-en-ia/, a Refresco; formato de cifra de la medición, a Medición desde el 2/11. Aparcada hasta tener PEBAI citada: la sección «cómo medimos».)
(Preguntas 27/10 tarde, agrupación de 52 preguntas en `docs/geo/preguntas.md` «Temas y huecos»: 1) el hilo común de WhatsApp, voz y automatización es la salida a una persona: pedir a Contenido una sección fija con el mismo título en las tres guías; 2) orden de publicación por huecos: cuanto-cuesta (9), formación (9), voz (9), /sobre-pebai/ (3); 3) dos respuestas de /sobre-pebai/ dependen de Daniel: qué se entrega al terminar un proyecto (código, accesos, documentación) y si hay reseñas enlazables; 4) la URL antigua de agente de voz frente a call center tuvo 10 impresiones en posición 8: recuperar su contenido útil en la página de voz.)
(Repartido antes: ver `git log` de este archivo.)
