---
name: geo-pebai
description: Experto en GEO (Generative Engine Optimization) de PEBAI Systems para que ChatGPT, Perplexity, Gemini, AI Overviews/AI Mode, Copilot y Claude citen y recomienden a PEBAI. Úsala para cualquier tarea de visibilidad en IA - auditoría técnica (Cloudflare, robots, schema, indexación), contenido citable, menciones fuera de la web, medición semanal de presencia en IAs, uso de SE Ranking, Search Console, Bing Webmaster, IndexNow, GA4, Clarity, Localo o Metricool, o para decidir el siguiente paso del plan GEO.
---

# GEO PEBAI

Objetivo: que PEBAI Systems sea la consultora que las IAs citan y recomiendan cuando una empresa española (primero, **empresas de placas solares**) pregunta por IA, automatización, chatbots o GEO. Máquina de captación para PEBAI hoy; servicio para clientes mañana.

- Conocimiento de fondo, datos y fuentes: `references/playbook-2026-10.md` (leerlo antes de recomendar; revisarlo cada trimestre).
- Plan vivo y estado: `docs/geo/plan.md` (actualizarlo al terminar cada tarea).
- Skills hermanas: `seo-pillar-discovery` (qué temas), `seo-clean-architecture` (cómo se estructuran las páginas).

## Reglas que no se saltan

1. **Hablar antes de actuar.** Proponer y esperar el OK del equipo antes de cambiar Cloudflare, desplegar, registrar keywords, publicar o crear perfiles. Nada de bots ni publicación automática sin que se pida (se eliminó el 14/10/2026).
2. **Cero cifras inventadas.** Separar 🟢 verificado / 🟡 hipótesis / 🔵 decisión del equipo. Ni casos, ni reseñas, ni datos de clientes ficticios. Las estadísticas del contenido llevan fuente y fecha.
3. **No vender webs.** Se habla del caso del cliente y del servicio (GEO, chatbots/agentes, automatización, apps).
4. **Respetar el embudo**: VSL `/consultoria-gratuita/` → `/diagnostico/`… con `utm`; la consultoría gratuita tiene plazas limitadas: no prometerla ilimitada.
5. **Repo público**: claves solo en `C:/programacion/APIs/` o `.env`; nada de datos de leads en el repo.
6. **Proactividad**: al acabar cualquier tarea GEO, decir cuál es el siguiente paso con más impacto según el plan y lo que falta para ser el primero.

## Las 5 palancas (por orden de impacto)

1. **Que puedan leernos.** Cloudflare sin bloqueos a bots de IA, robots.txt coherente, sitemap limpio, Bing Webmaster + IndexNow, Search Console.
2. **Que entiendan quiénes somos (entidad).** JSON-LD Organization/ProfessionalService/Person/Service conectado por `@id`, `sameAs` a perfiles reales, NAP coherente en todas partes, fundadores con biografía y LinkedIn.
3. **Que tengamos algo que citar.** Páginas pilar por servicio y por el nicho solar con respuesta directa en el primer párrafo, FAQs que cubran el *fan-out*, datos propios, citas a fuentes (UNEF, IDAE, INE), comparativas honestas con veredicto, fecha de actualización visible y refresco mensual.
4. **Que otros hablen de nosotros (menciones).** Es lo que más pesa: listas de terceros "mejores consultoras de IA en España", Clutch/Sortlist, LinkedIn de los fundadores, YouTube, prensa del sector solar, podcasts, GBP con reseñas, Wikidata cuando haya prensa.
5. **Medir cada semana.** Sin medición no hay GEO: set fijo de prompts + herramientas oficiales.

## Herramientas y para qué se usa cada una

| Herramienta | Uso en GEO | Credenciales |
|---|---|---|
| Search Console | Indexación, consultas, impresiones de IA | cuenta de servicio en `C:/programacion/APIs/` (`project_configs.json` → `google_creds_filename`) |
| Bing Webmaster + IndexNow | Bing alimenta ChatGPT y Copilot; AI Performance (CSV) | `bing_webmaster_api_key`, `bing_indexnow_key` en `api_keys.json`; clave pública en `dist/4352074d….txt` |
| SE Ranking | Posiciones Google y seguimiento en AIO/AI Mode/ChatGPT/Perplexity | `se_ranking_*` en `api_keys.json`; `se_ranking_site_id` en `project_configs.json` |
| GA4 | Canal "IA" por regex de fuente y conversión a `/diagnostico/` | `ga4_property_id` |
| Clarity | Canal AIPlatform y Citations | token del proyecto PEBAI (pendiente) |
| Cloudflare | AI Crawl Control, bots, caché | `cloudflare_*` + `cloudflare_zone_id` |
| Localo | Google Business Profile (posiciones locales, reseñas, posts) | `localo_bearer_token`; `localo_place_id` (pendiente: crear el perfil) |
| Metricool | Publicar en LinkedIn/YouTube/redes para menciones y frescura | MCP de Metricool conectado; `metricool_*` |
| Otterly / Peec / Ahrefs Brand Radar | Seguimiento de menciones en IA de pago (solo si el equipo decide pagar) | — |

Antes de usar una clave, comprobar que existe y no está vacía; nunca imprimir su valor.

## Rutina semanal (lunes)

1. Pasar el **set fijo de prompts** (`docs/geo/prompts.md`; no se cambian, solo se añaden) en ChatGPT con búsqueda, Perplexity, Gemini, AI Mode/AIO (España, `hl=es&gl=es`), Copilot y Claude con búsqueda.
2. Registrar por prompt y motor: ¿menciona a PEBAI? posición, ¿cita pebaisystems.es?, competidores nombrados, **dominios citados** (de ahí salen los objetivos de menciones), si la descripción de PEBAI es correcta.
3. Añadir: citas en Bing AI Performance y Clarity Citations, sesiones del canal IA en GA4/Clarity y su conversión, rastreos por bot en Cloudflare (detectar 403), impresiones de IA en Search Console.
4. KPIs: % de prompts con mención (share of voice), % con cita a la web, posición media, nº de dominios de terceros que mencionan a PEBAI, leads con fuente IA en `pebai_canal()`.
5. Resumen corto para el equipo con lo que ha cambiado y el siguiente paso.

## Comprobaciones técnicas rápidas

```bash
# ¿Nos bloquea Cloudflare? Debe dar 200 en todos
for ua in GPTBot OAI-SearchBot ChatGPT-User PerplexityBot ClaudeBot Claude-SearchBot Claude-User Google-Extended bingbot; do
  printf "%-18s %s\n" "$ua" "$(curl -s -o /dev/null -w '%{http_code}' -A "Mozilla/5.0 (compatible; $ua)" https://pebaisystems.es/)"
done
# robots.txt que se sirve de verdad (Cloudflare puede anteponer el suyo)
curl -s https://pebaisystems.es/robots.txt | head -40
```
