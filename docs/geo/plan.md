# Plan GEO de PEBAI Systems

Objetivo: ser la consultora que ChatGPT, Perplexity, Gemini, AI Overviews/AI Mode, Copilot y Claude recomiendan a las empresas españolas, empezando por las **empresas de placas solares**. Skill que lo ejecuta: `.claude/skills/geo-pebai/`. Fuentes y datos: `.claude/skills/geo-pebai/references/playbook-2026-10.md`.

Estado (21/10: los `[~]` de la fase 1 están hechos en código, pendientes de desplegar): `[ ]` pendiente · `[~]` en curso · `[x]` hecho · 🔑 necesita al equipo (acceso, decisión o dato).

## Punto de partida (auditoría del 21/10/2026)

- 🔴 **Cloudflare bloquea a GPTBot y ClaudeBot (403)** aunque `robots.txt` los permite, y su *Managed robots.txt* antepone `Disallow: /` a GPTBot, ClaudeBot, Google-Extended y Applebot-Extended. OAI-SearchBot, PerplexityBot, Claude-SearchBot y Bingbot sí pasan (200).
- 🔴 **Nada citable**: 9 URLs (home, embudo y legales). Sin guías, FAQs, casos ni páginas de servicio; los "Saber más" van al formulario. **El nicho solar no aparece en ninguna página.**
- 🟠 Las ~73 landings retiradas el 15/10 hacen **302 a la home** (`.htaccess`) mientras se rehacen; si dura mucho, Google lo trata como soft-404.
- 🟠 Clarity solo registra a quien acepta cookies: 2 sesiones en 3 días (21/10). Casi todo el tráfico, IA incluida, queda sin medir.
- 🟠 Solo la home tiene JSON-LD; fundadores sin LinkedIn ni `@id`; falta WebSite, FAQPage, VideoObject, Article. Sin NIF/domicilio en el aviso legal (LSSI; decidido esperar al alta).
- 🟠 `geo-tracker.js` se carga antes que el consentimiento y nunca registra; `utm.js` no reconoce claude.ai ni copilot.
- 🟡 `sitemap.xml` incluye 6 URLs noindex o de embudo y está desplegado sin commitear; `/diagnostico/` con canonical sin barra; `www` sin 301; `llms-full.txt` = `llms.txt`; email ofuscado por Cloudflare; HTML sin caché en el edge.
- 🟡 Sin constancia de Search Console ni Bing Webmaster verificados (puede ser por DNS: comprobar).

## Fase 1 — Que puedan leernos (semanas 1-2)

- [~] Cloudflare (21/10): AI bot policies con Search, Agent y Training en Allow y *Bot Preference Sync* desactivado. robots.txt servido = el nuestro. ClaudeBot, Google-Extended, Applebot-Extended, OAI-SearchBot, PerplexityBot y Bingbot dan 200. **GPTBot da 429** desde una IP que no es de OpenAI (posible control anti-suplantación o propagación): confirmar con las visitas reales en Clarity (actividad de bots, conectada a Cloudflare el 21/10) o en AI Crawl Control.
- [~] Bing Webmaster: la importación desde Search Console falló (21/10, "not able to fetch data"); pasar a verificación manual con `BingSiteAuth.xml`. Search Console: archivo de verificación subido (commit 9dad61a). Clarity: Cita (dominio conectado) y actividad de bots (Cloudflare) configurados el 21/10.
- [~] `robots.txt`: añadir Claude-SearchBot, Claude-User y Perplexity-User.
- [~] `sitemap.xml`: solo URLs indexables; commitear el estado real.
- [~] noindex en `/formulario-completado/` y `/diagnostico/`; canonical de `/diagnostico/` con barra; 301 de `www` a sin `www`.
- [ ] Landings retiradas: el 302 es temporal a propósito (el equipo las rehace). Al volver, revisarlas con `seo-clean-architecture` (sin canibalizar, con nicho solar), añadirlas a sitemap y llms.txt y quitar la regla; las que no vuelvan → 301 a su equivalente o 410.
- [ ] 🔑 Search Console y Bing Webmaster verificados (Bing importando desde GSC) con el sitemap enviado.
- [~] IndexNow automático en `deploy_changed.py` para las URL HTML del commit.
- [~] Medición sin consentimiento (decidido el 21/10, tras revisar la guía de cookies de la AEPD 05/2024 y las directrices 2/2023 del EDPB): Clarity y GA4 siguen **solo con consentimiento** (Clarity con `consentv2`, la API antigua se retira). Para contar a todos: Metricool (ya instalado, sin cookies, declarado en la política; marca 7537996, legible por MCP) + contador propio agregado en PHP/SQLite (fecha, ruta, dominio de origen, utm y paso del embudo; sin IP, sin identificadores, sin cookies), declarado en la política de cookies, para ver visitas y leads que llegan desde IAs.
- [~] Medición: arreglar `geo-tracker.js` (escuchar `pebai:consent`), claude.ai y copilot en `utm.js`, canal "IA" en GA4, Clarity con canal AIPlatform y Citations.
- [ ] Línea base: primera pasada del set de prompts (`docs/geo/prompts.md`).

## Fase 2 — Que entiendan quiénes somos (semanas 2-4)

- [ ] JSON-LD completo: Organization + ProfessionalService + WebSite, Person ×2 (`@id`, url, sameAs LinkedIn, `worksFor`), Service por servicio, FAQPage donde haya FAQ visible, VideoObject en los vídeos.
- [ ] 🔑 Páginas de Daniel y Adrián indexables con biografía, experiencia y LinkedIn (hoy `/t/*` son noindex).
- [ ] 🔑 Perfiles coherentes (mismo nombre, descripción, web, teléfono): LinkedIn de empresa, Google Business Profile (área de servicio, si cumple normas), Clutch, Sortlist, Crunchbase, YouTube.
- [ ] `llms.txt` con el nicho solar y los servicios; `llms-full.txt` con detalle real o eliminarlo.

## Fase 3 — Que tengamos algo que citar (semanas 3-8)

- [ ] 🔑 Sesión de pilares con `seo-pillar-discovery` → `docs/geo/pilares.md`.
- [ ] Pilar del nicho: "IA y automatización para empresas de placas solares" (respuesta directa arriba, casos de uso, datos con fuente UNEF/IDAE, FAQ de *fan-out*, fecha de actualización).
- [ ] Una página por servicio (GEO, chatbots/agentes de WhatsApp, automatización, apps) y que los "Saber más" lleven a ellas.
- [ ] 2 comparativas honestas con tabla y veredicto (p. ej. "chatbot vs. agente de WhatsApp para instaladoras"; "cómo elegir consultora de IA en España").
- [ ] 🔑 Casos reales con cifras (solo con permiso del cliente) y un dato propio publicable (mini-estudio del sector solar).
- [ ] Refresco mensual de pilares (dato nuevo + fecha).

## Fase 4 — Que otros hablen de nosotros (semanas 6-12 y continuo)

- [ ] Lista objetivo de dominios que citan las IAs (sale de la medición semanal).
- [ ] 🔑 Entrar en 2-3 listicles de terceros "agencias/consultoras de IA en España" y en directorios B2B (Clutch, Sortlist, GoodFirms).
- [ ] 🔑 LinkedIn: 2 publicaciones/semana por fundador con datos propios (Metricool).
- [ ] 🔑 YouTube: un vídeo cada 2 semanas respondiendo una pregunta del set, con transcripción.
- [ ] 🔑 Prensa sector solar (pv magazine España, El Periódico de la Energía, UNEF) y 1-2 podcasts.
- [ ] 🔑 Reseñas de los primeros clientes (Google, Clutch).
- [ ] Wikidata cuando haya 2-3 menciones en prensa.

## Fase 5 — Medir y automatizar

- [ ] Rutina semanal de la skill `geo-pebai` (lunes).
- [ ] 🔑 Decidir herramienta de seguimiento en IA: rastreador propio por API (0-10 €/mes) y/o add-on AI Search de SE Ranking / Otterly Lite.
- [ ] Tabla de resultados GEO en el panel (Automático › Agentes) — solo si el equipo lo pide.

## Herramientas: estado

| Herramienta | Estado |
|---|---|
| Search Console | 🔑 falta la cuenta de servicio `seo-pebai-automation.json` en `C:/programacion/APIs/` (está referenciada pero no existe) o dar acceso a otra |
| Bing Webmaster | 🔑 clave del ZIP pendiente de copiar; verificar el sitio |
| IndexNow | clave pública en `dist/`; falta automatizar |
| SE Ranking | `se_ranking_site_id` configurado; claves del ZIP pendientes de copiar; probar acceso |
| GA4 | `ga4_property_id` configurado; falta canal IA |
| Clarity | 🔑 falta token del proyecto PEBAI (el del ZIP es de otro proyecto) |
| Cloudflare | token y zona configurados; 🔑 cambios de bots necesitan OK |
| Localo | 🔑 token pendiente de copiar; no hay `localo_place_id` (no hay perfil de Google Business) |
| Metricool | MCP conectado; token pendiente de copiar; falta `metricool_blog_id` |
