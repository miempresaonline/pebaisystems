---
name: seo-pillar-discovery
description: Sesión de co-diseño con Daniel/Adrián para fijar los 3-5 pilares permanentes de PEBAI, sus clústeres temporales (subvenciones, normativas) y las 10-20 palabras y preguntas fuertes que deben llevar a PEBAI a Google y a las respuestas de ChatGPT, Perplexity, Gemini y AI Overviews. Úsala antes de crear páginas o contenido GEO, al decidir qué temas atacar, o al revisar la estrategia de autoridad temática.
---

# Descubrimiento de pilares y palabras fuertes (PEBAI)

Metodología de trabajo entre Claude y el equipo (Daniel, Adrián) para fijar la columna vertebral del posicionamiento de PEBAI en buscadores y en motores de IA. Adaptada del paquete de Antigravity del 20/10/2026.

## 1. Tres planos que nunca se mezclan

En cada propuesta, separar de forma explícita:
1. 🟢 **Dato verificado:** fuente oficial, métrica real (Search Console, Bing Webmaster, SE Ranking, Clarity, GA4) o algo que el equipo ha dicho expresamente.
2. 🟡 **Hipótesis:** intención de búsqueda, tendencia en motores de IA, estimación de demanda. Siempre como hipótesis a validar, nunca como hecho.
3. 🔵 **Decisión del equipo:** precios, márgenes, capacidad, servicios prioritarios y descartes. Eso lo deciden ellos, no Claude.

Prohibido inventar cifras, tickets medios, ahorros o afirmar cosas como "este sector es una mina". Si no hay dato, se dice.

## 2. El idioma del cliente primero, el tecnicismo después

El decisor (p. ej. el gerente de una empresa de placas solares) no busca "GEO". Busca cosas como:
- "cómo conseguir clientes de placas solares"
- "aparecer en ChatGPT" / "que la IA recomiende mi empresa"
- "automatizar presupuestos de fotovoltaica"
- "chatbot para atender clientes por WhatsApp"

GEO, AEO, RAG o LLM son la capa técnica de respaldo en el cuerpo del contenido, no el título, salvo que la demanda real lo justifique.

**Nunca se vende "una web"** (regla del equipo): se habla de su caso y del servicio (GEO, chatbots/agentes, automatización, apps).

## 3. Cadena de autoridad

```text
PEBAI Systems
  └── 3–5 pilares permanentes
        ├── Subpilares (URL propia, cobertura completa)
        │     └── Satélites (artículo de apoyo, FAQ concreta)
        └── Clústeres de oportunidad (subvenciones, leyes, temporada)
              └── Puente hacia el pilar permanente
```

Los pilares los fija el equipo en la sesión. Candidatos de partida (🟡 hipótesis, a validar): posicionamiento en IA (GEO), agentes y chatbots de IA, automatización de procesos, y la vertical de **empresas de placas solares** (nicho de captación actual).

## 4. Pilar permanente vs. clúster de oportunidad

- **Pilar permanente:** servicio troncal que sostiene el negocio a largo plazo. Define navegación, entidad de marca y autoridad del dominio.
- **Clúster de oportunidad:** subvenciones (Kit Digital, ayudas a IA…), normativas con fecha (VeriFactu, factura electrónica), cambios del sector (autoconsumo, baterías, tarifas). Mucho valor de captación inmediata, pero **no condiciona la estructura fija**: vive como satélite con un puente consultivo hacia el pilar, para que cuando pase de moda la web no quede desfigurada.

## 5. ¿Subpilar o satélite? Los 3 filtros

Solo es **subpilar** (URL propia de alta densidad) si cumple los tres:
1. **Amplitud:** hay facetas, comparativas y preguntas complejas para cubrirlo a fondo sin relleno.
2. **Intención propia:** el que lo busca tiene un perfil o necesidad distinta de la página madre (p. ej. "aparecer en ChatGPT" ≠ "aparecer en AI Overviews de Google").
3. **Potencial comercial:** sostiene FAQs propias, casos y futuras URLs hijas.

Si no los cumple, es **satélite**: resuelve una duda concreta y enlaza al pilar.

## 6. Medición en motores de IA

1. Priorizar **métricas oficiales**: Search Console (rendimiento, y el informe de funciones de IA si está disponible para la propiedad: comprobarlo, no darlo por hecho), Bing Webmaster Tools (incluye Copilot), GA4/Clarity para el tráfico que llega desde chatgpt.com, perplexity.ai, gemini.google.com, copilot.microsoft.com.
2. Diferenciar siempre **métrica oficial** de **comprobación muestral** (batería fija de preguntas a ChatGPT, Perplexity, Gemini y Copilot; ver la skill `geo-pebai` si existe).

## 7. Justificación de cada palabra o pregunta (5 factores)

Nunca se fija una keyword (ni se registra en SE Ranking) porque "suena bien". Antes:
1. **Intención:** qué problema real resuelve.
2. **Relación con el servicio:** lleva de forma natural a algo que PEBAI entrega de verdad.
3. **Conversión:** atrae decisores con presupuesto, no curiosos.
4. **Profundidad disponible:** hay sustancia propia (datos, casos, experiencia) para aportar algo nuevo sin inventar.
5. **Canibalización:** Bajo/Medio/Alto + cómo se mitiga (intenciones disjuntas, H1 distintos, enlaces de subordinación). El riesgo cero no existe.

Lo que no tenga volumen comprobado en una herramienta o en la SERP se marca **🟡 demanda emergente**, no keyword consolidada. En GEO cuenta también la **pregunta conversacional** completa (cómo lo preguntaría alguien a ChatGPT), no solo la keyword corta.

## 8. Flujo de la sesión

1. **Radiografía comercial:** el equipo define servicios reales, márgenes y descartes. Claude pregunta, no impone.
2. **Investigación:** competencia, lenguaje real de los decisores, SERP, qué citan hoy ChatGPT/Perplexity/Gemini/AI Overviews para esas preguntas, datos de Search Console y SE Ranking.
3. **Propuesta co-creada:** pilares vs. oportunidad, subpilares que pasan los 3 filtros, palabras y preguntas fuertes con los 5 factores.
4. **Consolidación:** ficha en `docs/geo/pilares.md` y, **con OK del equipo**, registro en SE Ranking (grupo `Pilares PEBAI`).

## Plantilla de la ficha (`docs/geo/pilares.md`)

```markdown
# Pilares y palabras fuertes — PEBAI Systems
Fecha: AAAA-MM-DD · Participantes: …

## 1. Planos de negocio
- 🟢 Datos verificados: …
- 🔵 Decisiones del equipo: …

## 2. Pilares permanentes
### Pilar 1: [nombre]
- URL madre: https://pebaisystems.es/[slug]/
- Cómo lo busca el decisor: …
- Subpilares (pasan los 3 filtros):
  1. /[slug]/[subpilar]/ — intención diferenciada: …
- Palabras y preguntas fuertes:
  1. "[kw]" — Intención: … · Conversión: … · Canibalización: Bajo/Medio/Alto (+ mitigación) · Demanda: 🟢 verificada / 🟡 emergente

## 3. Clústeres de oportunidad
### [Nombre] (temporal)
- URL: …
- Puente hacia el pilar: …
- Palabras de oportunidad: …

## 4. Seguimiento
- SE Ranking: estructurales / de oportunidad (grupo `Pilares PEBAI`)
- Batería de preguntas GEO asociada: …
```
