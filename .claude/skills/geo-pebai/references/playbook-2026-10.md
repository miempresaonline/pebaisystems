# Playbook GEO — estado a 21/10/2026

Marcas: **[V]** verificado con fuente primaria o varias coherentes · **[S]** secundario o estudio de proveedor (orientativo) · **[H]** hipótesis o criterio propio. Las cifras de estudios de proveedores son tendencia, no ley. Revisar este archivo cada trimestre: el GEO cambia rápido.

## 1. De dónde saca las fuentes cada motor

| Motor | Fuente | Qué implica |
|---|---|---|
| ChatGPT (búsqueda) | Crawler propio **OAI-SearchBot** + Bing + otras; si se bloquea OAI-SearchBot no sale en respuestas; robots.txt tarda ~24 h [V, OpenAI]. Solo ~27 % de coincidencia con el top de Bing [S]. Tira de Wikipedia y, en consultas profesionales, de LinkedIn [S]. | Dejar pasar OAI-SearchBot; estar en Bing ayuda pero no basta. |
| Perplexity | Búsqueda en vivo (PerplexityBot, Perplexity-User). ~1/3 de citas en el top 10 de Google [V, Ahrefs 08/2025]. Mucho Reddit [S]. | SEO clásico + foros. |
| Google AI Overviews / AI Mode | Índice de Google; AI Mode descompone en subconsultas (*fan-out*). 76 % de citas de AIO desde el top 10 [S, Ahrefs]. | Páginas que respondan todas las subpreguntas (precio, plazos, casos, comparativas). |
| Copilot | Índice de Bing. Bing Webmaster Tools informa de citas en Copilot [V]. | Bing Webmaster + IndexNow. |
| Claude (web) | **Brave Search** (86,7 % de coincidencia) [S]. Bots: ClaudeBot (entrenamiento), Claude-SearchBot (índice), Claude-User (usuario) [V, Anthropic]. | Comprobar en search.brave.com; dejar pasar los tres. |

## 2. Qué aumenta las citas (medido)

- **Paper GEO de Princeton (KDD 2024)** [V]: citar fuentes, incluir citas textuales y estadísticas → hasta +40 % de visibilidad (+37 % en Perplexity real). Varía por sector. Es el único estudio académico sólido.
- **Menciones de marca fuera de la web** [V, Ahrefs, 75.000 marcas]: el factor más correlacionado con salir en AI Overviews (0,664), por encima de anclas de marca (0,527), búsquedas de marca (0,392) y backlinks.
- **Listicles y comparativas** [S]: ~50 % de las citas de ChatGPT son listicles (Evertune 04/2026); ~1/3 de citas B2B son comparativas con veredicto claro.
- **Frescura** [S, Ahrefs]: lo citado es ~26 % más reciente que el orgánico; 76 % de lo más citado por ChatGPT se actualizó en 30 días → fecha de actualización visible y refresco mensual.
- **Google ≠ IA** [V, Ahrefs 08/2025]: solo el 12 % de las URL citadas por ChatGPT/Gemini/Copilot está en el top 10 de Google para esa pregunta.
- **Plataformas** [S]: Reddit muy citado (poca masa en España para B2B), YouTube al alza pero volátil, LinkedIn en ~14 % de respuestas de ChatGPT Search y AI Mode y nº 1 en consultas profesionales. Para PEBAI [H]: LinkedIn y YouTube > Reddit.

## 3. Técnica

- **llms.txt:** sin efecto demostrado (SE Ranking, 300.000 dominios, 11/2025 [V]). Se mantiene porque cuesta poco, pero no es palanca.
- **robots.txt** [H]: permitir bots de búsqueda y usuario (OAI-SearchBot, ChatGPT-User, PerplexityBot, Perplexity-User, Claude-SearchBot, Claude-User, Bingbot, Googlebot, Applebot) **y también los de entrenamiento** (GPTBot, ClaudeBot, Google-Extended, Applebot-Extended): una marca pequeña quiere estar en la memoria del modelo. Google-Extended no afecta a la Búsqueda/AIO, pero puede afectar al grounding de la app de Gemini [S].
- **Cloudflare** [V]: desde 07/2025 bloquea bots de IA por defecto; *Managed robots.txt* inserta `Disallow: /` para GPTBot, ClaudeBot, Google-Extended, Applebot-Extended… y `Content-Signal: ai-train=no`. Desde 07/2026, control por categorías (Search / Training / Agent). Revisar en el panel: *Block AI bots* = no bloquear; Managed robots.txt desactivado; ningún WAF/Bot Fight Mode con 403 a bots de IA; comprobar con `curl -A`; revisar AI Crawl Control.
- **Schema.org** [H]: Organization + ProfessionalService (sameAs a LinkedIn, YouTube, GBP, Crunchbase, Wikidata), Service por servicio, Person ×2 con sameAs y worksFor, FAQPage. No hay estudio que pruebe más citas; sirve para desambiguar la entidad.
- **IndexNow** [V protocolo]: Bing/Yandex (no Google). Integrarlo en `deploy_changed.py`.
- **Bing Webmaster – AI Performance** [V]: vista previa desde 02/2026; citas en Copilot, por página y *grounding queries*; solo CSV, sin API.
- **Search Console** [S]: informe de impresiones de IA (AIO + AI Mode) desde 06/2026, solo impresiones; despliegue progresivo: comprobar si está para España.

## 4. Entidad fuera de la web (por impacto estimado [H])

1. Aparecer en listas de terceros "mejores consultoras/agencias de IA y automatización en España" (blogs, medios, Sortlist, Clutch, GoodFirms). En español son flojas: hay hueco.
2. LinkedIn: página de empresa completa + publicaciones de Adrián y Daniel con datos propios.
3. Clutch y Sortlist con reseñas verificadas.
4. Google Business Profile (solo si cumple sus normas: negocio de área de servicio sin dirección visible) + reseñas en Google.
5. YouTube: vídeos que respondan preguntas del set, con transcripción.
6. Wikidata: cuando haya 2-3 menciones externas (si no, lo borran). Wikipedia aún no.
7. Crunchbase (gratis), podcasts de emprendimiento/energía.
8. PR sectorial solar (pv magazine España, El Periódico de la Energía, UNEF): caso o estudio con datos de "IA en instaladoras".

## 5. Herramientas

| Herramienta | Para qué en GEO | API Python |
|---|---|---|
| SE Ranking (+ add-on AI Search) | Posiciones Google + seguimiento en AIO, AI Mode, ChatGPT, Perplexity | Sí (REST; confirmar plan) |
| Google Search Console | Rendimiento + impresiones de IA | Sí (Search Analytics) |
| Bing Webmaster Tools | Indexación Bing (ChatGPT/Copilot) + AI Performance (CSV) | Sí, sin AI Performance |
| IndexNow | Aviso inmediato de URLs nuevas a Bing | Sí (POST) |
| GA4 | Canal personalizado de IA (regex de fuente) y conversiones | Sí (Data API) |
| Microsoft Clarity | Canal AIPlatform + Citations (citas por página) | Exportación limitada |
| Cloudflare AI Crawl Control | Qué bots de IA llegan y con qué respuesta | Sí (API / GraphQL) |
| Localo | Google Business Profile: posiciones locales, reseñas, posts (sin visibilidad en IA) | No documentada |
| Metricool | Redes (LinkedIn, YouTube…) para las menciones y la frescura; ya conectado por MCP | Sí (MCP) |
| Otterly / Peec / Ahrefs Brand Radar / HubSpot AEO Grader | Seguimiento de menciones en IA de pago o diagnóstico gratis | Otterly desde plan Standard |
| Rastreador propio | Set fijo de prompts por API (OpenAI web_search, Perplexity Sonar, Gemini grounding, Claude web search) → SQLite del panel | Construirlo (0-10 €/mes). Ojo: API ≠ app de consumo |

Regex GA4 (canal "IA", por encima de Referral): `^(chatgpt\.com|chat\.openai\.com|(www\.)?perplexity\.ai|gemini\.google\.com|copilot\.microsoft\.com|claude\.ai)$`

## 6. Qué esperar [H]

Primero Perplexity y Copilot (2-6 semanas, leen el índice en vivo), luego AI Mode/AIO (ligado al SEO), y lo último la recomendación "de memoria" de ChatGPT/Claude sin búsqueda (meses a un año; depende de menciones de terceros y de nuevos entrenamientos).

## Fuentes

- OpenAI bots: https://developers.openai.com/api/docs/bots
- Anthropic bots: https://support.claude.com/en/articles/8896518
- Claude y Brave: https://techcrunch.com/2025/03/21/anthropic-appears-to-be-using-brave-to-power-web-searches-for-its-claude-chatbot/
- Cloudflare: https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/ · https://developers.cloudflare.com/bots/additional-configurations/block-ai-bots · https://the-decoder.com/cloudflare-replaces-its-blanket-ai-bot-block-with-granular-controls-for-search-training-and-agent-crawlers/
- Princeton GEO: https://arxiv.org/abs/2311.09735
- Ahrefs: https://ahrefs.com/blog/ai-overview-brand-correlation/ · https://ahrefs.com/blog/ai-search-overlap/ · https://ahrefs.com/blog/ai-seo-statistics
- llms.txt: https://seranking.com/blog/llms-txt/
- Listicles: https://www.evertune.ai/resources/ai-search-statistics-for-generative-engine-optimization · https://somethinginc.com/blog/2026-ai-citation-study/
- Bing AI Performance: https://searchengineland.com/bing-webmaster-tools-testing-new-ai-performance-report-468039
- GSC IA: https://ecorpit.com/google-search-console-ai-performance-report-2026/
- Clarity: https://learn.microsoft.com/en-za/clarity/insights/ai-channel-group · https://ppc.land/microsoft-clarity-citations-goes-ga-now-track-how-ai-answers-cite-your-site/
- GA4: https://www.lovesdata.com/blog/how-to-track-ai-traffic-ga4/
