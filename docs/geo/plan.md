# Plan GEO de PEBAI Systems

Objetivo: ser la consultora que ChatGPT, Perplexity, Gemini, AI Overviews/AI Mode, Copilot y Claude recomiendan a las empresas españolas de cualquier sector. (Las instaladoras de placas solares son solo el nicho de la captación por WhatsApp/email de ahora, no el posicionamiento.) Skill que lo ejecuta: `.claude/skills/geo-pebai/`. Fuentes y datos: `.claude/skills/geo-pebai/references/playbook-2026-10.md`.

Estado: `[ ]` pendiente · `[~]` en curso · `[x]` hecho · 🔑 necesita al equipo (acceso, decisión o dato).

## Punto de partida (auditoría del 21/10/2026)

- 🔴 **Cloudflare bloquea a GPTBot y ClaudeBot (403)** aunque `robots.txt` los permite, y su *Managed robots.txt* antepone `Disallow: /` a GPTBot, ClaudeBot, Google-Extended y Applebot-Extended. OAI-SearchBot, PerplexityBot, Claude-SearchBot y Bingbot sí pasan (200).
- 🔴 **Nada citable**: 9 URLs (home, embudo y legales). Sin guías, FAQs, casos ni páginas de servicio; los "Saber más" van al formulario. 
- 🟠 Las ~73 landings retiradas el 15/10 hacen **302 a la home** (`.htaccess`) mientras se rehacen; si dura mucho, Google lo trata como soft-404.
- 🟠 Clarity solo registra a quien acepta cookies: 2 sesiones en 3 días (21/10). Casi todo el tráfico, IA incluida, queda sin medir.
- 🟠 Solo la home tiene JSON-LD; fundadores sin LinkedIn ni `@id`; falta WebSite, FAQPage, VideoObject, Article. Sin NIF/domicilio en el aviso legal (LSSI; decidido esperar al alta).
- 🟠 `geo-tracker.js` se carga antes que el consentimiento y nunca registra; `utm.js` no reconoce claude.ai ni copilot.
- 🟡 `sitemap.xml` incluye 6 URLs noindex o de embudo y está desplegado sin commitear; `/diagnostico/` con canonical sin barra; `www` sin 301; `llms-full.txt` = `llms.txt`; email ofuscado por Cloudflare; HTML sin caché en el edge.
- 🟡 Sin constancia de Search Console ni Bing Webmaster verificados (puede ser por DNS: comprobar).

## Fase 1 — Que puedan leernos (semanas 1-2)

- [~] Cloudflare (21/10): AI bot policies con Search, Agent y Training en Allow y *Bot Preference Sync* desactivado. robots.txt servido = el nuestro. ClaudeBot, Google-Extended, Applebot-Extended, OAI-SearchBot, PerplexityBot y Bingbot dan 200. (22/10: GPTBot, OAI-SearchBot, ClaudeBot y PerplexityBot ya dan 200 con curl -A; antes) **GPTBot daba 429** desde una IP que no es de OpenAI (posible control anti-suplantación o propagación): confirmar con las visitas reales en Clarity (actividad de bots, conectada a Cloudflare el 21/10) o en AI Crawl Control.
- [~] Bing Webmaster: la importación desde Search Console falló (21/10, "not able to fetch data"); pasar a verificación manual con `BingSiteAuth.xml`. Search Console: archivo de verificación subido (commit 9dad61a). Clarity: Cita (dominio conectado) y actividad de bots (Cloudflare) configurados el 21/10.
- [x] `robots.txt`: añadir Claude-SearchBot, Claude-User y Perplexity-User.
- [x] `sitemap.xml`: solo URLs indexables; commitear el estado real.
- [x] noindex en `/formulario-completado/` y `/diagnostico/`; canonical de `/diagnostico/` con barra; 301 de `www` a sin `www`.
- [ ] Landings retiradas: el 302 es temporal a propósito (el equipo las rehace). Al volver, revisarlas con `seo-clean-architecture` (sin canibalizar, con nicho solar), añadirlas a sitemap y llms.txt y quitar la regla; las que no vuelvan → 301 a su equivalente o 410.
- [x] (21/10, commit 2283d6a desplegado) Search Console verificado y sitemap enviado por API; GA4 con grupo de canales "PEBAI (IA primero)" creado por API (además del canal nativo AI Assistant). Antes: 🔑 Search Console y Bing Webmaster verificados (Bing importando desde GSC) con el sitemap enviado.
- [x] IndexNow automático en `deploy_changed.py` para las URL HTML del commit.
- [x] Medición sin consentimiento (decidido el 21/10, tras revisar la guía de cookies de la AEPD 05/2024 y las directrices 2/2023 del EDPB): Clarity y GA4 siguen **solo con consentimiento** (Clarity con `consentv2`, la API antigua se retira). Para contar a todos: Metricool (ya instalado, sin cookies, declarado en la política; marca 7537996, legible por MCP) + contador propio agregado en PHP/SQLite (fecha, ruta, dominio de origen, utm y paso del embudo; sin IP, sin identificadores, sin cookies), declarado en la política de cookies, para ver visitas y leads que llegan desde IAs.
- [x] Medición: arreglar `geo-tracker.js` (escuchar `pebai:consent`), claude.ai y copilot en `utm.js`, canal "IA" en GA4, Clarity con canal AIPlatform y Citations.
- [ ] Línea base: primera pasada del set de prompts (`docs/geo/prompts.md`).

## Fase 2 — Que entiendan quiénes somos (semanas 2-4)

- [x] (21/10, c47c0ef) JSON-LD completo en portada y VSL (Organization, ProfessionalService, WebSite, WebPage, Person ×2, VideoObject, BreadcrumbList); falta sameAs de LinkedIn cuando exista. Era: Organization + ProfessionalService + WebSite, Person ×2 (`@id`, url, sameAs LinkedIn, `worksFor`), Service por servicio, FAQPage donde haya FAQ visible, VideoObject en los vídeos.
- [ ] 🔑 Páginas de Daniel y Adrián indexables con biografía, experiencia y LinkedIn (hoy `/t/*` son noindex).
- [ ] 🔑 Perfiles coherentes (mismo nombre, descripción, web, teléfono): LinkedIn de empresa, Google Business Profile (área de servicio, si cumple normas), Clutch, Sortlist, Crunchbase, YouTube.
- [x] (21/10) `llms.txt` con el nicho solar y los servicios; `llms-full.txt` con detalle real o eliminarlo.

## Fase 3 — Que tengamos algo que citar (semanas 3-8)

- [ ] 🔑 Sesión de pilares con `seo-pillar-discovery` → `docs/geo/pilares.md`.
- [ ] Páginas por sector como verticales de los pilares (construcción y reformas, clínicas, instalaciones —incluidas placas solares—, talleres, inmobiliarias…), empezando por las que traigan más demanda según Search Console y SE Ranking.
- [~] Una página por servicio (GEO, chatbots/agentes de WhatsApp, automatización, apps) y que los "Saber más" lleven a ellas. Publicadas: `/posicionamiento-en-ia/` (21/10), `/agentes-ia/` (22/10, con WhatsApp como bloque principal). Faltan `/ia-para-empresas/` y `/automatizacion-de-procesos/`.
- [ ] 2 comparativas honestas con tabla y veredicto (p. ej. "chatbot vs. agente de WhatsApp para instaladoras"; "cómo elegir consultora de IA en España").
- [ ] 🔑 Casos reales con cifras (solo con permiso del cliente) y un dato propio publicable (mini-estudio propio (p. ej. tiempo de respuesta a leads en pymes)).
- [ ] Refresco mensual de pilares (dato nuevo + fecha).

## Fase 4 — Que otros hablen de nosotros (semanas 6-12 y continuo)

- [ ] Lista objetivo de dominios que citan las IAs (sale de la medición semanal).
- [ ] 🔑 Entrar en 2-3 listicles de terceros "agencias/consultoras de IA en España" y en directorios B2B (Clutch, Sortlist, GoodFirms).
- [ ] 🔑 LinkedIn: 2 publicaciones/semana por fundador con datos propios (Metricool).
- [ ] 🔑 YouTube: un vídeo cada 2 semanas respondiendo una pregunta del set, con transcripción.
- [ ] 🔑 Prensa de emprendimiento y pymes (Emprendedores, El Mundo Financiero, Servimedia…) y prensa sectorial de las verticales; 1-2 podcasts.
- [ ] 🔑 Reseñas de los primeros clientes (Google, Clutch).
- [ ] Wikidata cuando haya 2-3 menciones en prensa.

## Fase 5 — Medir y automatizar

- [x] (21/10) Tarea programada `informe-geo-semanal-pebai`, lunes 9:00, solo lectura. Rutina semanal de la skill `geo-pebai` (lunes).
- [ ] 🔑 Decidir herramienta de seguimiento en IA: rastreador propio por API (0-10 €/mes) y/o add-on AI Search de SE Ranking / Otterly Lite.
- [ ] Tabla de resultados GEO en el panel (Automático › Agentes) — solo si el equipo lo pide.

## Herramientas: estado

| Herramienta | Estado |
|---|---|
| Search Console | funciona desde la nube (`geo_datos.py gsc`); 22/10: sitemap de 3 URLs leído, 0 indexadas aún |
| Bing Webmaster | funciona desde la nube (`geo_datos.py bing`); 22/10: aún lee el sitemap viejo de 9 URLs, sin datos de tráfico |
| IndexNow | clave pública en `dist/`; falta automatizar |
| SE Ranking | `se_ranking_site_id` configurado; claves del ZIP pendientes de copiar; probar acceso |
| GA4 | `ga4_property_id` configurado; falta canal IA |
| Clarity | 🔑 falta token del proyecto PEBAI (el del ZIP es de otro proyecto) |
| Cloudflare | token y zona configurados; 🔑 cambios de bots necesitan OK |
| Localo | 🔑 token pendiente de copiar; no hay `localo_place_id` (no hay perfil de Google Business) |
| Metricool | MCP conectado; token pendiente de copiar; falta `metricool_blog_id` |

## Ajustes de herramientas (21/10/2026, solo PEBAI)
- SE Ranking (proyecto 12936941): grupo "Pilares PEBAI" con 31 keywords de los pilares + "aparecer en chatgpt empresa"; competidores javadex.es, upliora.es, plainconcepts.com, hiberus.com, minsait.com. Las 39 antiguas se quedan en "General" (conservan histórico). Sin add-on de seguimiento en IA (no se ha comprado nada).
- GA4: eventos clave `lead_funnel_diagnostic` y `conversion_whatsapp`; retención de datos de 2 a 14 meses; grupo de canales "PEBAI (IA primero)".
- Bing Webmaster: enviadas `/` y `/consultoria-gratuita/`; sin errores de rastreo; sitemap leído (aún la versión antigua de 9 URLs, se actualizará).
- Search Console: sitemap enviado por API.
- Hostinger (22/10): auto-despliegue en el servidor (`pebai-autodeploy`): los agentes de la nube publican con un push a `main`; ya no necesitan SSH ni a Daniel.
- Cloudflare: IA permitida (Search, Agent y Training), sin robots.txt gestionado, email visible, token `claude-geo` solo con purga de caché (sin permiso de ajustes de zona).

## Prioridades de la semana

(La reescribe el Jefe GEO los lunes y jueves.)

Viernes 23/10 (Jefe):
1. Contenido: publicar hoy /ia-para-empresas/ con el bloque «cómo elegir consultora» y un caso real, y sus 301. Es lo que más mueve el 0 % de presencia sin marca. (geo_contenido)
2. Refresco: 301 de las URLs viejas a /agentes-ia/ y /posicionamiento-en-ia/ (Google aún da impresiones y clics a agente-de-ia-espana y hoy acaban en la portada) y dato INE 1T 2026 en /agentes-ia/. (geo_refresco)
3. Medición: indexación (Search Console 0 de 4 URLs del sitemap; Bing sigue con el sitemap viejo de 9) y AI Performance de Bing. (geo_medicion)
4. Redes y Local: post de Google Business del 28/10 listo (imagen d-ias) y tareas de Localo. (geo_redes, geo_local)
5. Daniel: frases y permisos de los casos, portada con el dato INE nuevo, decidir Clutch/Sortlist.

## Propuestas del Vigía

(El Vigía añade aquí lo que cambie el plan; el Jefe las resuelve.)
