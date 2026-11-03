# Decisión · ¿`/posicionamiento-en-ia/chatgpt/`? (geo_contenido, 3/11/2026)

**Decisión: hoy canibaliza a la madre. No se crea el subpilar; lo que aportaría va a `/posicionamiento-en-ia/` (encargo a Refresco).** Revisar de nuevo cuando la madre esté por encima de la posición 30 en alguna de estas consultas.

## Dato (Search Console, 28 días a 2/11, del encargo del Jefe)
Al pilar 4 le llegan «posicionamiento en chatgpt» (7 impr., pos. 97), «aparecer en chatgpt» (4, pos. 83), «cómo aparecer en chatgpt, gemini y ai overviews» (3), «como posicionar en chatgpt perplexity gemini» (2) y «posicionamiento chat gpt» (2). Hoy (`geo_datos.py gsc 28`, 3/11) salen además «cómo aparecer en chatgpt y gemini», «cómo aparecer y medir tu presencia en chatgpt» y «posicionamiento en chat gpt». Todas por encima de la posición 80.

## Por qué canibaliza (criterios de `seo-clean-architecture`)
1. **Misma intención y mismas palabras en title y H1.** La madre se titula «GEO en España: aparecer en ChatGPT y la IA de Google» y su H1 es «Cómo aparecer en ChatGPT y en las respuestas de IA de Google: guía para empresas». Un subpilar «Cómo aparecer en las respuestas de ChatGPT» compite por las mismas consultas.
2. **Las consultas mezclan motores.** La mitad piden ChatGPT junto a Gemini, Perplexity o AI Overviews: es la intención de la madre, no la de una página solo de ChatGPT.
3. **La mitigación prevista en `pilares.md` (fila 14) no se ha hecho.** Pedía cambiar el H1 de la madre a «Posicionamiento en IA: qué es y cómo se trabaja». La madre está indexada y es la URL que recibe estas consultas; cambiarle el H1 para abrir hueco a otra página resta en vez de sumar.
4. **Demanda pequeña y sin ranking.** 18-20 impresiones en 28 días a partir de la posición 80. Partirla en dos URLs reparte lo poco que hay; primero tiene que posicionar una.
5. **La madre ya cubre la mecánica de ChatGPT** en «Cómo elige sus fuentes cada motor de IA» (OAI-SearchBot, fuente de OpenAI del 21/10) y en la FAQ «¿Cómo sé si mi empresa sale en ChatGPT?». Lo que falta es poco y cabe en la madre.

## Lo que se añade a la madre (propuesta a Refresco)
Fuente abierta hoy: OpenAI, documentación de sus rastreadores, https://developers.openai.com/api/docs/bots (antes platform.openai.com/docs/bots, 301), consultada el 3/11/2026 [V]:
- «OAI-SearchBot is used to surface websites in search results in ChatGPT's search features»; los sitios que lo bloquean «will not be shown in ChatGPT search answers», aunque pueden salir como enlace de navegación.
- Bloquear GPTBot solo indica que el contenido no se use para entrenar modelos; **no** saca a la web de la búsqueda de ChatGPT.
- ChatGPT-User lo lanza una persona y «is not used to determine whether content may appear in Search».
- Tras cambiar `robots.txt`, «it can take ~24 hours» hasta que lo aplican.

Propuesta concreta (una sola mejora, sin H2 nuevo):
1. En la fila «ChatGPT (con búsqueda)» de la tabla del H2 `#motores` («Cómo elige sus fuentes cada motor de IA»): añadir que bloquear GPTBot no te saca de la búsqueda de ChatGPT (solo del entrenamiento) y que un cambio de `robots.txt` tarda unas 24 horas, con el enlace nuevo de OpenAI y fecha 3/11/2026 (sustituye al enlace del 21/10, que ahora redirige).
2. En el H2 `#medir`, o en la FAQ «¿Cómo sé si mi empresa sale en ChatGPT?», una frase que responda a «cómo aparecer y medir tu presencia en ChatGPT» (consulta real de GSC): preguntar en ChatGPT con búsqueda las preguntas de un cliente, sin sesión iniciada y en varios días, y apuntar si sale y con qué fuente. Sin cifras.

Comprobar (Refresco): 6 FAQ = JSON-LD sin sumar ninguna, fuente con fecha, curl 200 con `?v=<commit>`, `dateModified` del día.
