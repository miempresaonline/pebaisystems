# Pilares y palabras fuertes — PEBAI Systems
Fecha: 2026-10-21 · Participantes: borrador de Claude (skill `seo-pillar-discovery`), **propuesta para validar con Daniel y Adrián**. Nada de esto se publica ni se registra en SE Ranking sin su OK.

Leyenda: 🟢 dato verificado (fuente y fecha) · 🟡 hipótesis o demanda emergente · 🔵 decisión del equipo (pendiente salvo que se diga lo contrario).

Volúmenes: SE Ranking Data API, base `es`, media mensual en España, consultados el 21/10/2026. Ojo: SE Ranking da cifras distintas con y sin tilde (p. ej. "automatizacion de procesos" 240 frente a "automatización de procesos" 30); se cita la variante que da cada línea. "Sin dato" = la herramienta no devuelve volumen o devuelve 0: se trata como 🟡 demanda emergente, no como "nadie lo busca" (las preguntas conversacionales casi nunca tienen volumen medido).

---

## 1. Planos de negocio

### 🟢 Datos verificados
- **Search Console (21/10/2026):** la propiedad `https://pebaisystems.es/` existe y es accesible por la cuenta de servicio, pero **no hay ni una fila de rendimiento en los últimos 90 días** (0 impresiones). El sitemap se envió el 21/10 (2 URLs enviadas, 0 indexadas según GSC). Conclusión: hoy no hay datos de consultas propias; todo lo que sigue sale de SE Ranking, de la SERP y de la medición GEO.
- **SE Ranking, proyecto 12936941 (posiciones del 21/07 al 21/10/2026, dos motores configurados):** 40 keywords en seguimiento, todas heredadas de las landings retiradas.
  - **37 de las 40 no tienen volumen medible** en SE Ranking (eran slugs largos tipo "agente ia talleres automocion postventa"). Solo tienen volumen "agencia inteligencia artificial" (320), "agencia inteligencia artificial alicante" (20) y "sistema multiagente…" (sin dato). → El seguimiento actual no mide demanda real; hay que sustituirlo (con OK) por las palabras de la sección 2.
  - Únicas posiciones con señal: "auditoria adopcion inteligencia artificial negocio" en **1** (último día, ambos motores, sin volumen); "agente ia soporte tecnico nivel 1" en 12-13; "agencia inteligencia artificial bilbao" llegó a 2 y la perdió; "agente ia whatsapp business api empresas" en 62-67; el resto, sin posición o por encima de 60. La API no dice qué URL posiciona.
- **Medición GEO de partida** (`docs/geo/mediciones/2026-10-21.md`): share of voice 17,5 % total, **0 % en los 12 prompts sin marca** (categoría, sectores y ciudades). Las IAs copian rankings y directorios: javadex.es (6 citas), sortlist.es (5), upliora.es (4 + 7 en Claude), hiberusbooster (4), osix.tech (3). Competidores más recomendados: Plain Concepts, Minsait, Hiberus, Javadex (6-5 respuestas). En el nicho solar, NORTEN (nortenai.com) es el único especialista citado.
- **SERP y respuestas IA (WebSearch, 21/10/2026):** para "cómo aparecer en ChatGPT" y "cuánto cuesta implantar IA en una pyme" las fuentes que salen son casi todas de **javadex.es y upliora.es** (blogs de proveedores con rangos de precio propios y rankings donde se ponen primeros). Para WhatsApp con IA: javadex, upliora, wati, eesel, aunoa. Hay hueco para una fuente honesta que no se autoproclame "la mejor".
- **Web actual** (`llms-full.txt`): PEBAI = consultoría de procesos e IA para empresas de cualquier sector en España; servicios: software operativo a medida, chatbots, agentes de voz, GEO, desarrollo web, formación; proyectos de implantación **desde 1.500 €**; consultoría gratuita de 25 min **solo 5 empresas al mes** (después de pago).
- **Landings retiradas:** 73 slugs con **302 a la portada** en `website-pebai/dist/.htaccess` (regla con `RewriteCond !-d`: se desactiva sola cuando vuelve a existir la carpeta). Temas: 17 de ciudad (agencia/consultoría + ciudad), ~20 de agente por sector u oficio, voz, WhatsApp, RAG, multiagente, GEO, costes/ROI, RGPD/AI Act, auditoría, formación, ERP/Holded/Sage/Factusol/SAP B1, n8n/Zapier, software a medida.
- **Normativa (fuentes secundarias, contrastar en BOE/EUR-Lex antes de publicar):** VeriFactu obligatorio el 1/1/2027 para contribuyentes del Impuesto sobre Sociedades y el 1/7/2027 para el resto (RDL 15/2025, según TeamSystem, Infoautónomos, Billin). Kit Digital: la Orden TDF/39/2026 (BOE 28/01/2026) elimina la fecha fija de cierre, el programa sigue hasta agotar fondos (según copilotgestoria.com). AI Act art. 4 (alfabetización en IA) aplicable desde el 2/2/2025; una fuente afirma que su redacción cambió el 27/07/2026 con el paquete Ómnibus Digital (sin verificar).

### 🔵 Decisiones del equipo (ya tomadas, según memoria y CLAUDE.md)
- Marca = consultora de procesos e IA para **todos los sectores**; las instaladoras solares son solo el nicho de captación saliente actual, en GEO son una vertical más.
- **No se venden webs**: se habla del caso del cliente y del servicio.
- Consultoría gratuita limitada a 5 plazas/mes; no prometerla ilimitada.
- Nada de bots ni publicación automática sin pedirlo.

### 🔵 Decisiones que faltan (para la sesión)
1. ¿4 o 5 pilares? (¿"Software a medida" es pilar propio o se funde en "Automatización de procesos"? Ver P5.)
2. ¿Se retira "Desarrollo web" de la lista de servicios de `llms-full.txt` y de la home? Choca con la regla de no vender webs; no se propone como pilar.
3. ¿Páginas de ciudad? Sin Google Business Profile ni pruebas locales no compiten (medición del 21/10). Propuesta: no rehacerlas por ahora.
4. ¿Es PEBAI agente digitalizador adherido al Kit Digital o asesor de Kit Consulting? Si no lo es, el clúster de ayudas solo puede informar y derivar, nunca prometer que "se paga con la ayuda".
5. Márgenes, precios por servicio, capacidad y qué servicio interesa empujar primero (no lo decide Claude).
6. Casos reales publicables y con permiso (hoy no hay ninguno en la web: no se inventan).

---

## 2. Pilares permanentes (propuesta)

Mapa: la home sigue siendo la página de la entidad (marca + "consultoría de IA / consultora IA"). Cada pilar es una URL madre corta. Los sectores cuelgan del pilar 1 como verticales y enlazan a los subpilares de servicio de los pilares 2-5.

```text
PEBAI Systems (home: marca + consultoría de procesos e IA)
├── P1 /ia-para-empresas/            Implantar IA en la empresa (qué, cómo, cuánto, con quién)
│     └── verticales /ia-para-empresas/[sector]/
├── P2 /automatizacion-de-procesos/  Automatizar tareas y conectar programas
├── P3 /agentes-ia/                  Atender clientes con agentes de IA (WhatsApp, voz, chatbot)
├── P4 /posicionamiento-en-ia/       Que ChatGPT y Google IA recomienden a la empresa (GEO)
└── P5 /software-a-medida/           (candidato) Herramientas propias: presupuestos, partes, panel
```

### Pilar 1: Implantar IA en la empresa
- **URL madre:** https://pebaisystems.es/ia-para-empresas/
- **Cómo lo busca el decisor:** "ia para empresas" 🟢 320, "empresas de ia" / "empresa de ia" 🟢 390 cada una, "empresa de inteligencia artificial" 🟢 320, "consultoría ia" 🟢 390 (intención local/comercial), "ia para pymes" 🟢 90, "chatgpt empresas" 🟢 390, "chatgpt para empresas" 🟢 140. Conversacional (🟡): "¿por dónde empiezo a usar IA en mi empresa?", "¿cuánto cuesta implantar IA en una pyme?", "¿qué consultora de IA me recomiendas en España?" (prompts 4, 5 y 8 del set GEO, hoy 0 % de presencia).
- **Por qué es pilar:** es la puerta de entrada del decisor que aún no sabe qué servicio necesita y la que soporta las verticales. Encaja con lo que PEBAI vende primero: el diagnóstico.
- **Subpilares (pasan los 3 filtros):**
  1. `/ia-para-empresas/cuanto-cuesta/` — intención diferenciada: comparar presupuesto y retorno antes de hablar con nadie. Amplitud: precio por tipo de proyecto, cuotas, licencias, ayudas, ROI. Comercial: alto (decisor con presupuesto). Absorbe las landings retiradas de coste y ROI. Hoy lo responden javadex/upliora con rangos propios (🟢 SERP); PEBAI tiene un dato real publicable ("desde 1.500 €", 🟢 web) y nada más: **los rangos por proyecto los tiene que dar el equipo (🔵)**.
  2. `/ia-para-empresas/como-elegir-consultora/` — intención: elegir proveedor (prompts 4-5). Comparativa honesta con criterios y tabla (en casa vs. SaaS vs. consultora grande vs. consultora pequeña), sin autoproclamarse primero. Las IAs citan listicles y comparativas (🟢 playbook: ~50 % de citas de ChatGPT son listicles, estudio de proveedor [S]).
  3. `/ia-para-empresas/formacion/` — intención: formar al equipo y cumplir la alfabetización del AI Act. "curso ia para empresas" 🟢 90 (kd 52), "curso agentes ia" 🟢 140. Comercial medio (formación es un servicio real de PEBAI). Puente natural del clúster AI Act.
- **Satélites:** "qué es un agente de IA" va a P3; "RGPD e IA en la empresa" (satélite de P1, sin volumen medido 🟡); "IA en pymes: datos de adopción del INE" (satélite con datos oficiales).
- **Palabras y preguntas fuertes:**
  1. **"ia para empresas"** — Intención: entender qué puede hacer la IA en su negocio. Relación: lleva al diagnóstico. Conversión: media (mezcla curiosos y decisores). Profundidad: método propio de diagnóstico + datos INE. Canibalización: **Medio** con la home (mitigación: home = marca y "consultoría de procesos e IA"; la madre = guía con H1 "Cómo implantar IA en tu empresa"). Demanda: 🟢 320/mes, kd 51.
  2. **"consultoría ia"** — Intención: contratar. Relación: directa. Conversión: alta. Profundidad: método, condiciones de la consultoría gratuita. Canibalización: **Alto** con la home (mitigación: se queda en la home; P1 enlaza con ancla "consultoría de IA" a la home, no compite con H1). Demanda: 🟢 390/mes, kd 34.
  3. **"¿Cuánto cuesta implantar IA en una pyme?"** — Intención: presupuesto. Conversión: alta. Profundidad: solo con precios reales del equipo (🔵). Canibalización: Bajo (subpilar propio). Demanda: 🟡 emergente ("cuanto cuesta implementar inteligencia artificial" sin volumen; es el prompt 8 del set).
  4. **"¿Qué consultora de IA me recomiendas para mi pyme en España?"** — Intención: elegir proveedor. Conversión: alta. Profundidad: criterios propios + medición GEO propia. Canibalización: Bajo. Demanda: 🟡 (conversacional; prompts 4-5).

### Pilar 2: Automatización de procesos con IA
- **URL madre:** https://pebaisystems.es/automatizacion-de-procesos/
- **Cómo lo busca el decisor:** "automatizacion de procesos" 🟢 240 (kd 35), "automatizacion de procesos con ia" 🟢 260 (kd 47), "automatizacion con ia" 🟢 260, "automatizacion de procesos empresariales" 🟢 70 (kd 9), "empresas de automatizacion" 🟢 140 (kd 10), "automatizar procesos con ia" 🟢 90, "automatizacion de tareas" 🟢 170. Conversacional (🟡): "¿qué tareas de mi empresa puedo automatizar?", "¿cómo dejo de copiar datos a mano entre programas?".
- **Por qué es pilar:** es literalmente el nombre del servicio troncal ("consultoría de procesos e IA") y el área "Operativa" de la web.
- **Subpilares:**
  1. `/automatizacion-de-procesos/presupuestos-facturas-y-pedidos/` — intención: el proceso administrativo concreto. "programa para hacer presupuestos" 🟢 170, "automatizar facturas" 🟢 40, "automatizar presupuestos" 🟡 sin volumen. Comercial alto. Absorbe `automatizacion-facturas-pedidos-ia`, `automatizacion-factusol-pedidos-ia`. Puente del clúster VeriFactu.
  2. `/automatizacion-de-procesos/integracion-erp-crm/` — intención: conectar la IA a lo que ya tienen (Holded, Sage, Odoo, SAP Business One). Marcas con mucho volumen pero navegacional ("holded" 🟢 135.000, "odoo" 🟢 47.500, "sage 50" 🟢 2.400): **no se atacan esos términos**, se usa la cola "odoo ia" 🟢 90 (kd 8), "integracion holded"/"holded ia" 🟡 sin volumen. Absorbe 4 landings ERP retiradas.
  3. Satélite (no pasa el filtro de intención propia frente a la madre): `/automatizacion-de-procesos/n8n-vs-zapier/` — "n8n" 🟢 60.500 es navegacional y técnico; "n8n español" 🟢 90 (kd 7). Atrae más técnicos que decisores (conversión baja) → satélite, no subpilar.
- **Palabras fuertes:**
  5. **"automatizacion de procesos con ia"** — Intención: automatizar con IA. Relación: directa. Conversión: media-alta. Profundidad: casos por departamento (solo reales o marcados como ejemplo). Canibalización: **Medio** con P3 (mitigación: P2 = trabajo interno/back-office; P3 = conversación con el cliente). Demanda: 🟢 260, kd 47.
  6. **"empresas de automatizacion"** / "empresas de automatización de procesos" — Intención: contratar. Conversión: alta. Canibalización: Bajo. Demanda: 🟢 140 (kd 10) / 🟢 30. Cuidado: parte de la demanda es automatización industrial (PLC), que PEBAI no hace → aclararlo en la página.
  7. **"¿Cómo conecto la IA con Holded / Odoo / Sage sin cambiar de programa?"** — Intención: integración. Conversión: alta. Canibalización: Bajo. Demanda: 🟡 ("odoo ia" 🟢 90 como señal).

### Pilar 3: Agentes de IA para atender clientes
- **URL madre:** https://pebaisystems.es/agentes-ia/
- **Cómo lo busca el decisor:** "agentes de ia" 🟢 880 (kd 63), "agente de ia" 🟢 810 (kd 73), "agentes ia" 🟢 1.300 (kd 89), "agente de ia para empresas" 🟢 70 (**kd 7**), "agentes de ia para empresas" 🟢 70 (kd 44), "chatbot para empresas" 🟢 140 (kd 8), "asistente virtual para empresas" 🟢 50 (kd 10). Conversacional (🟡): "¿qué diferencia hay entre un chatbot y un agente de IA?", "¿puede una IA contestar el WhatsApp de mi empresa fuera de horario?".
- **Por qué es pilar:** área "Clientes" de la web; tres servicios reales (chatbots, agentes de voz, WhatsApp) y la demanda más alta de todo el estudio tras las marcas. Los genéricos ("agentes ia", kd 89) son difíciles: se entra por la cola "para empresas" (kd 7-44).
- **Subpilares:**
  1. `/agentes-ia/whatsapp/` — intención: atender por WhatsApp. "whatsapp business api" 🟢 910 (kd 64), "bot whatsapp" 🟢 480 (kd 27), "chatbot whatsapp" 🟢 390, "whatsapp ia" 🟢 170, "chatbot whatsapp business" 🟢 90, "automatizar whatsapp" 🟢 70 (kd 13), "agente ia whatsapp" 🟢 50 (kd 13). Comercial alto; es la URL retirada con posición (62-67). Contenido sobre **atención entrante** y las normas de Meta (plantillas, ventana de 24 h, consentimiento), coherente con `docs/agente-whatsapp.md`.
  2. `/agentes-ia/voz/` — intención: atender llamadas. "agentes de voz ia" 🟢 140 (kd 17), "agente de voz ia" 🟢 140 (kd 16), "centralita ia" 🟢 20. Absorbe 3 landings de voz (incluida "vs call center", que pasa a sección comparativa). Prompt 11 (clínica).
  3. `/agentes-ia/chatbot-con-documentos-de-empresa/` — intención: asistente interno o de soporte sobre manuales y tarifas (RAG). "chatbot para empresas" 🟢 140, "crear chatbot" 🟢 110, "chatbot rag" 🟢 10. 🟡 Duda de filtro 2: puede solaparse con la madre; si el equipo no tiene casos, dejarlo como sección de la madre.
- **Palabras fuertes:**
  8. **"agente de ia para empresas"** — Intención: contratar un agente. Conversión: alta. Profundidad: método y límites honestos. Canibalización: **Medio** con P2 (ver mitigación en la palabra 5). Demanda: 🟢 70, kd 7.
  9. **"bot whatsapp" / "chatbot whatsapp business"** — Intención: atender por WhatsApp. Conversión: media (hay mucho "gratis": "chatbot whatsapp gratis" 🟢 40) → la página filtra explicando coste real de la API de Meta. Canibalización: Bajo. Demanda: 🟢 480 / 90.
  10. **"agente de voz ia"** — Intención: atender llamadas. Conversión: alta. Canibalización: Bajo. Demanda: 🟢 140, kd 16.
  11. **"¿Cuánto cuesta un agente de IA para WhatsApp?"** — Intención: presupuesto. Conversión: alta. Demanda: 🟡 (hoy lo contestan javadex/upliora con rangos propios, 🟢 SERP). Necesita precios 🔵.

### Pilar 4: Posicionamiento en IA (GEO)
- **URL madre:** https://pebaisystems.es/posicionamiento-en-ia/
- **Cómo lo busca el decisor:** "geo seo" 🟢 590 (kd 24), "que es geo" 🟢 390 (kd 15), "generative engine optimization" 🟢 320 (kd 70), "seo para ia" 🟢 320 (kd 53), "agencia geo" 🟢 260 (**kd 10**, CPC 6,24 €: alta intención comercial), "ai overviews" 🟢 610, "seo para chatgpt" / "seo en chatgpt" 🟢 70, "posicionamiento en ia" 🟢 50 (kd 16), "como aparecer en chatgpt" 🟢 40 (kd 4), "posicionamiento en chatgpt" 🟢 30. El decisor lo dice así (🟡): "¿cómo hago que ChatGPT recomiende mi empresa?", "mi empresa no sale en ChatGPT" (SE Ranking la lista sin volumen).
- **Por qué es pilar:** servicio real y diferencial; PEBAI tiene **datos propios** (medición del 21/10 con 15 prompts × 6 motores) que nadie más tiene, que es lo que más ayuda a ser citado (Princeton GEO 🟢 [V]). Riesgo comercial 🟡: la demanda "geo" es en parte de marketers/agencias, no de gerentes.
- **Subpilares:**
  1. `/posicionamiento-en-ia/chatgpt/` — intención: "aparecer en ChatGPT" (marca concreta, la que más pide el gerente). Diferente de AIO (Google) por fuentes y mecánica (OAI-SearchBot, Bing; playbook 🟢). Absorbe `como-posicionar-en-chatgpt-perplexity-gemini`.
  2. `/posicionamiento-en-ia/google-ai-overviews/` — intención: no perder tráfico de Google por las respuestas IA. "ai overviews" 🟢 610 (kd 61). Comercial medio.
  3. Satélite: `/posicionamiento-en-ia/llms-txt/` — "llms.txt" 🟢 180 (kd 7). Respuesta honesta: sin efecto demostrado (SE Ranking, 300.000 dominios, 🟢 playbook). Atrae técnicos → satélite.
- **Palabras fuertes:**
  12. **"agencia geo"** — Intención: contratar. Conversión: alta. Profundidad: medición propia publicada. Canibalización: Bajo (absorbe `agencia-geo-generative-engine-optimization-espana`, que hoy está en 88-93). Demanda: 🟢 260, kd 10.
  13. **"geo seo" / "que es geo"** — Intención: entender. Conversión: baja-media (informativa) → la madre responde y deriva. Canibalización: Bajo. Demanda: 🟢 590 / 390. Ambigüedad: "geo" sola (14.800) es mayoritariamente otra cosa; no se ataca.
  14. **"¿Cómo hago que ChatGPT recomiende mi empresa?"** — Intención: aparecer en IA. Conversión: alta. Profundidad: medición propia. Canibalización: **Medio** entre madre y subpilar ChatGPT (mitigación: H1 madre "Posicionamiento en IA: qué es y cómo se trabaja"; H1 subpilar "Cómo aparecer en las respuestas de ChatGPT"). Demanda: 🟡 conversacional ("como aparecer en chatgpt" 🟢 40 como señal); es el prompt 7.

### Pilar 5 (candidato, 🔵 decidir): Software operativo a medida
- **URL madre:** https://pebaisystems.es/software-a-medida/
- **Cómo lo busca el decisor:** "software a medida" 🟢 320 (**kd 5**), "erp para pymes" 🟢 320 (kd 23), "programa para hacer presupuestos" 🟢 170, "app a medida" 🟢 70, "desarrollo software a medida" 🟢 70 (kd 4), "app partes de trabajo" 🟢 70 (kd 20), "erp a medida" 🟢 50 (CPC 7,46 €), "software a medida para empresas" 🟢 50, "crm a medida" 🟢 40, "partes de trabajo digitales" 🟢 30.
- **Por qué podría ser pilar:** servicio real ("Software operativo a medida", "Sin licencias por usuario"), dificultad muy baja y CPC alto (intención comercial). **Por qué podría no serlo:** solapa con P2 en presupuestos y partes. Alternativa: fundirlo en P2 como subpilar `/automatizacion-de-procesos/software-a-medida/`.
- **Subpilares (si se aprueba):** `/software-a-medida/partes-de-trabajo/` (oficios con técnicos en la calle: reformas, instaladoras, talleres) y `/software-a-medida/erp-crm/`. Absorbe `software-a-medida-para-empresas`, `programas-gestion-empresa-a-medida`, `desarrollo-software-ia-a-medida-espana`, `migracion-procesos-antiguos-a-sistemas-ia`.
- **Palabras fuertes:**
  15. **"software a medida para empresas"** — Intención: encargar una herramienta. Conversión: alta. Canibalización: **Alto** con P2/presupuestos (mitigación: P5 = "construir la herramienta", P2 = "automatizar con lo que ya tienes"; H1 y enlaces de subordinación). Demanda: 🟢 50 (cabeza "software a medida" 320, kd 5).
  16. **"app partes de trabajo"** — Intención: digitalizar partes. Conversión: alta. Canibalización: Bajo. Demanda: 🟢 70. Ojo: compiten SaaS baratos; el argumento es "sin licencias por usuario" y conexión con su ERP (🔵 confirmar que es lo que se quiere vender).

**Descartes propuestos (🔵 confirmar):** "Desarrollo web" (regla de no vender webs); landings de agente por departamento sin demanda (RR. HH., logística, soporte nivel 1, cualificación de leads B2B, multiagente, e-commerce, hoteles): pasan a secciones de P2/P3 o a verticales, no a URLs propias.

---

## 3. Clústeres de oportunidad (temporales)

Ninguno condiciona la estructura: viven como satélites bajo `/guias/` (o bajo el pilar puente) con fecha de actualización visible y semáforo 🟢/🟡.

### Kit Digital y ayudas para IA (temporal: hasta agotar fondos)
- **URL:** `/guias/kit-digital-inteligencia-artificial/` (satélite de P1).
- **Puente hacia el pilar:** "La ayuda paga una parte; lo que decide si sirve es el proceso que automatizas" → `/ia-para-empresas/cuanto-cuesta/` y diagnóstico.
- **Palabras de oportunidad:** "kit digital 2026" 🟢 2.900 (kd 72), "kit consulting" 🟢 1.500 (kd 84), "agente digitalizador" 🟢 660 (kd 15), "kit digital ia" 🟢 70, "kit digital inteligencia artificial" 🟢 30, "ayudas ia pymes" 🟡 sin volumen. "kit digital" a secas (27.800, kd 97) no se ataca.
- **Condición 🔵:** si PEBAI no es agente digitalizador ni asesor de Kit Consulting, la página **solo informa** con fuentes oficiales (Red.es, acelerapyme.es, BOE) y no promete financiación. Estado del programa 🟡 (fuentes secundarias: sin fecha de cierre desde la Orden TDF/39/2026; contrastar con Red.es).

### VeriFactu y factura electrónica (temporal: hasta 2027-2028)
- **URL:** `/guias/verifactu/` (satélite de P2).
- **Puente hacia el pilar:** "Cumplir VeriFactu sin cambiar de programa y aprovechar para automatizar facturas y pedidos" → `/automatizacion-de-procesos/presupuestos-facturas-y-pedidos/` e integración ERP. PEBAI **no es un software de facturación**: no se compite con los SIF, se ayuda a encajar el proceso.
- **Palabras de oportunidad:** "software verifactu" 🟢 590 (**kd 5**), "verifactu api" 🟢 480 (kd 8), "kit digital verifactu" 🟢 480 (kd 13), "que es verifactu" 🟢 810 (kd 36), "verifactu obligatorio" 🟢 320, "verifactu odoo" 🟢 390 (kd 7), "factura electrónica obligatoria" 🟢 590-720. "verifactu" a secas (12.100, kd 86) no se ataca.
- **Fechas:** 🟡 hasta verificar en BOE (1/1/2027 sociedades, 1/7/2027 resto según fuentes secundarias). Factura electrónica B2B: reglamento y fechas 🟡, solo con fuente oficial.

### AI Act y alfabetización en IA (permanente a medio plazo, con fechas)
- **URL:** `/guias/ai-act-empresas/` (satélite de P1, puente a `/ia-para-empresas/formacion/`).
- **Puente:** "Qué te exige ya el Reglamento de IA si tu equipo usa ChatGPT, y cómo cumplirlo con formación práctica".
- **Palabras:** "ai act" 🟢 1.500 (kd 90, difícil), "reglamento ia" 🟢 100, "reglamento europeo inteligencia artificial" 🟢 70, "rgpd inteligencia artificial" 🟡. Absorbe `cumplimiento-rgpd-ai-act-inteligencia-artificial`.
- **Cuidado:** redacción del art. 4 tras el Ómnibus Digital y ley española de la AESIA: 🟡, fuentes contradictorias. Solo EUR-Lex y AESIA como fuente.

---

## 4. Páginas por sector (verticales)

Cuelgan de P1 como `/ia-para-empresas/[sector]/` y enlazan a los subpilares de servicio (WhatsApp, voz, presupuestos, partes). Cada una solo se publica con **casos reales o ejemplos marcados como ejemplo** y una FAQ propia; si no hay sustancia, no se crea (página vacía = no compite, medición del 21/10).

| Prioridad | URL | Demanda (SE Ranking) | Por qué | Absorbe (retiradas) |
|---|---|---|---|---|
| 1 | `/ia-para-empresas/instaladoras/` (solar, climatización, electricidad) | "software para instaladores" 🟢 20, "software fotovoltaica" 🟢 20; resto 🟡 | 🔵 nicho comercial actual (WhatsApp/email); hueco en IA salvo NORTEN (🟢 medición). Prompt 12 | — |
| 2 | `/ia-para-empresas/despachos-y-asesorias/` | "ia para abogados" 🟢 390, "inteligencia artificial abogados" 🟢 70, "ia para asesorias" 🟢 40, "ia para despachos de abogados" 🟢 20 (kd 4) | Mayor volumen vertical medido. 🟡 riesgo: parte busca herramientas jurídicas (no consultoría) | `agente-ia-despachos-abogados-gestion-expedientes` |
| 3 | `/ia-para-empresas/reformas-y-construccion/` | "ia construccion" 🟢 40, "inteligencia artificial en la construcción" 🟢 10 | Prompt 9; dato citable: adopción de IA del 4 % en construcción (Observatorio Industrial de la Construcción vía Heraldo, 🟢 secundaria, verificar) | `agente-ia-empresas-construccion-reformas` |
| 4 | `/ia-para-empresas/inmobiliarias/` | "ia para inmobiliarias" 🟢 90, "inteligencia artificial inmobiliaria" 🟢 20 | Volumen medio, kd 39 | `agente-ia-inmobiliarias-captacion-propiedades` |
| 5 | `/ia-para-empresas/clinicas/` | "ia para clínicas" 🟢 20 | Prompt 11 (voz); datos sanitarios = RGPD reforzado | `agente-ia-clinicas-gestion-citas-telefonicas`, farmacias |
| 6 | `/ia-para-empresas/talleres/` | 🟡 sin volumen | Partes de trabajo + WhatsApp | `agente-ia-talleres-automocion-postventa` |
| — | Hostelería/restaurantes | "ia para restaurantes" 🟢 70, "ia para hoteles" 🟢 30 | 🔵 ¿es cliente objetivo? | `agente-ia-hoteles-turismo-reservas` |
| — | Distribución B2B | 🟡 sin volumen | Mencionado en `llms-full.txt` | `agente-ia-distribucion-suministros-b2b`, logística |

---

## 5. Mapa de URLs y destino de las 73 landings retiradas

Regla general: la carpeta nueva desactiva sola el 302 si se reutiliza el slug, pero **la propuesta es no reutilizar slugs largos** sino llevarlos con **301** a la URL nueva (añadir la regla en `.htaccess` y quitar el slug de la lista 302). Lo que no tenga equivalente → 301 al pilar más cercano (o 410 si el equipo lo prefiere). Hacerlo al publicar cada destino, no antes (si no, 301 a una página que aún no existe).

| Grupo de slugs retirados | Destino propuesto |
|---|---|
| `agencia-inteligencia-artificial-*` (14 ciudades), `consultoria-inteligencia-artificial-{barcelona,bilbao,sevilla,valencia}`, `empresa-desarrollo-inteligencia-artificial-barcelona`, `agencia-inteligencia-artificial-empresas-madrid` | 🔵 Sin páginas de ciudad por ahora → 301 a `/` (la home es la entidad). Si se decide GBP + pruebas locales: `/ia-para-empresas/valencia/` y `/madrid/` como únicas excepciones |
| `empresa-de-inteligencia-artificial-espana`, `empresas-de-inteligencia-artificial-espana`, `consultoria-procesos-inteligencia-artificial`, `auditoria-adopcion-inteligencia-artificial-negocio`, `auditoria-procesos-empresariales` | `/ia-para-empresas/` (la de auditoría estaba en posición 1: 301 para no perder la señal) |
| `cuanto-cuesta-implementar-inteligencia-artificial-empresa`, `roi-retorno-inversion-inteligencia-artificial`, `reducir-costes-operativos-automatizacion-ia` | `/ia-para-empresas/cuanto-cuesta/` |
| `formacion-inteligencia-artificial-empresas`, `formacion-inteligencia-artificial-para-empresas-espana`, `curso-inteligencia-artificial-para-empresas-espana` | `/ia-para-empresas/formacion/` |
| `cumplimiento-rgpd-ai-act-inteligencia-artificial` | `/guias/ai-act-empresas/` |
| `empresas-automatizacion-procesos-espana`, `empresas-de-automatizacion-de-procesos-espana`, `optimizacion-procesos-empresariales`, `optimizacion-procesos-industriales` | `/automatizacion-de-procesos/` |
| `automatizacion-facturas-pedidos-ia`, `automatizacion-factusol-pedidos-ia` | `/automatizacion-de-procesos/presupuestos-facturas-y-pedidos/` |
| `integracion-ia-erp-crm-pymes`, `integracion-ia-holded-erp-espana`, `integracion-ia-sage-50-200-espana`, `agente-ia-sap-business-one-espana` | `/automatizacion-de-procesos/integracion-erp-crm/` |
| `automatizacion-procesos-n8n-empresas`, `zapier-vs-n8n-empresas-espana` | `/automatizacion-de-procesos/n8n-vs-zapier/` |
| `agente-de-ia-espana`, `agente-de-inteligencia-artificial-espana`, `agentes-inteligencia-artificial-empresas`, `sistema-multiagente-ia-para-empresas`, `agente-ia-cualificacion-leads-b2b`, `agente-ia-soporte-tecnico-nivel-1`, `agente-ia-recursos-humanos-seleccion-personal`, `agente-ia-ecommerce-recomendacion-atencion`, `agente-ia-logistica-optimizacion-rutas-stock` | `/agentes-ia/` |
| `agente-ia-whatsapp-business-api-empresas` | `/agentes-ia/whatsapp/` |
| `agente-voz-atencion-telefonica-empresas`, `agentes-de-voz-ia-telefonicos-empresas`, `agentes-de-voz-ia-vs-call-center-subcontratado` | `/agentes-ia/voz/` |
| `chatbot-rag-documentacion-empresarial` | `/agentes-ia/chatbot-con-documentos-de-empresa/` (o `/agentes-ia/` si no se crea) |
| `agencia-geo-generative-engine-optimization-espana`, `como-posicionar-en-chatgpt-perplexity-gemini` | `/posicionamiento-en-ia/` y `/posicionamiento-en-ia/chatgpt/` |
| `software-a-medida-para-empresas`, `programas-gestion-empresa-a-medida`, `desarrollo-software-ia-a-medida-espana`, `migracion-procesos-antiguos-a-sistemas-ia` | `/software-a-medida/` (o `/automatizacion-de-procesos/` si P5 no se aprueba) |
| `agente-ia-{clinicas,despachos,inmobiliarias,talleres,construccion-reformas,farmacias,hoteles,distribucion}…` | Vertical correspondiente de la sección 4 (o `/ia-para-empresas/` hasta que exista) |

**En 301 desde el 28/10/2026 (Técnico):** formación → `/ia-para-empresas/formacion/`; los 3 slugs de voz → `/agentes-ia/` (cambiar el destino a `/agentes-ia/voz/` el día que se publique); las ciudades → `/` (menos `consultoria-inteligencia-artificial-valencia`, que sigue en 302).

Anticanibalización: el sitemap actual solo tiene `/` y `/consultoria-gratuita/` (🟢), así que no hay choques hoy. Choques a vigilar: home ↔ P1 ("consultoría ia"), P2 ↔ P3 (automatizar vs. atender), P2 ↔ P5 (presupuestos y partes), madre P4 ↔ subpilar ChatGPT.

---

## 6. Las 3 primeras páginas a construir (propuesta)

Criterio: datos propios disponibles hoy + hueco en las respuestas de IA + demanda medida + que sustituyen a "Saber más" que hoy van al formulario. Todas con autoría visible (Daniel/Adrián), fecha de actualización, `WebPage` + `BreadcrumbList` + `Article` + `FAQPage` enlazados a `#organization`, y puente final a `/consultoria-gratuita/` con `utm` (respetando las 5 plazas/mes).

### 1. `/posicionamiento-en-ia/` — "Posicionamiento en IA (GEO): cómo conseguir que ChatGPT y Google recomienden tu empresa"
Es la única página donde PEBAI ya tiene **un dato propio publicable**: la medición del 21/10 (15 preguntas × 6 motores; 0 % de presencia sin marca; las IAs copian rankings y directorios). "agencia geo" 🟢 260 con kd 10 y la madre absorbe dos landings retiradas. **Respuesta directa (40-60 palabras):** qué es GEO, que no se paga por aparecer, que las IAs eligen fuentes que ya citan otros (menciones, directorios, comparativas) y contenido que responde directo, y que se mide con un set fijo de preguntas. **FAQs (fan-out):** ¿Se puede pagar para salir en ChatGPT? ¿En qué se diferencia del SEO? ¿Cuánto tarda (Perplexity/Copilot antes que ChatGPT sin búsqueda, 🟡)? ¿Sirve el llms.txt? ¿Cómo sé si ChatGPT ya me menciona? ¿Cuánto cuesta? (solo con precio 🔵). **Fuentes a citar:** paper GEO de Princeton (arXiv 2311.09735), Ahrefs (correlación de menciones y solapamiento IA-Google), documentación de bots de OpenAI y Anthropic, estudio de llms.txt de SE Ranking, y la medición propia con su método y limitaciones.

### 2. `/ia-para-empresas/` — "Cómo implantar IA en tu empresa: por dónde empezar, cuánto cuesta y con quién"
Cubre los prompts 4, 5 y 8 (0 % de presencia hoy), sostiene las verticales y, con sus subpilares, absorbe 11 landings retiradas (incluida la de auditoría que estaba en posición 1). Demanda 🟢: "ia para empresas" 320, "empresas de ia" 390. **Respuesta directa:** para quién tiene sentido (empresas con equipo y tareas repetitivas), los tres sitios donde se pierde dinero (clientes, operativa, sistemas), el orden de trabajo (diagnóstico → un proceso → medir) y que los proyectos de PEBAI parten de 1.500 € (🟢 web). **FAQs:** ¿Por dónde empiezo? ¿Cuánto cuesta y qué cuotas tiene? ¿Necesito cambiar mis programas? ¿Qué pasa con el RGPD y el AI Act? ¿Hay ayudas (Kit Digital)? ¿Cómo elijo consultora? ¿Cuándo NO conviene IA? **Fuentes:** INE (encuesta de uso de TIC en empresas, el dato que ya cita la web), Reglamento de IA en EUR-Lex y guías de la AESIA, AEPD, Red.es/acelerapyme para ayudas. Bifurcación temprana por sector hacia las verticales. **Bloqueante 🔵:** rangos de precio por tipo de proyecto y criterios de "cuándo no".

### 3. `/agentes-ia/` (con WhatsApp como bloque principal) — "Agentes de IA para atender a tus clientes por WhatsApp, teléfono y web"
Es la demanda más alta medida (agentes de IA 810-880; bot/chatbot WhatsApp 480/390; "whatsapp business api" 910) y la cola comercial tiene dificultad muy baja ("agente de ia para empresas" kd 7). PEBAI tiene conocimiento real de la API y las reglas de WhatsApp (`docs/agente-whatsapp.md`). **Respuesta directa:** qué es un agente (responde, cualifica y agenda, conectado al CRM), en qué se diferencia de un chatbot de respuestas fijas, en qué canales funciona y cuándo pasa la conversación a una persona. **FAQs:** ¿Chatbot o agente? ¿Puede contestar el WhatsApp fuera de horario? ¿Qué cobra Meta por la API (plantillas, ventanas de conversación)? ¿Puede atender llamadas con voz natural? ¿Se equivoca y qué pasa si lo hace? ¿Cumple el RGPD? ¿Cuánto cuesta? (🔵). **Fuentes:** documentación oficial de WhatsApp Business Platform/precios de Meta, políticas de mensajería de Meta, AEPD y art. 50 del Reglamento de IA (transparencia: avisar de que habla con una IA, verificar en EUR-Lex). Después: subpilares `/agentes-ia/whatsapp/` y `/agentes-ia/voz/`.

(Siguientes en la cola: `/ia-para-empresas/cuanto-cuesta/` en cuanto haya precios 🔵, `/ia-para-empresas/como-elegir-consultora/`, `/automatizacion-de-procesos/`, la vertical de instaladoras y `/guias/verifactu/`.)

---

## 7. Seguimiento

- **SE Ranking (con OK del equipo):** crear el grupo `Pilares PEBAI` y **sustituir** las 37 keywords sin volumen por:
  - Estructurales: ia para empresas, consultoría ia, empresas de ia, automatizacion de procesos con ia, empresas de automatizacion, agente de ia para empresas, agentes de ia, bot whatsapp, chatbot whatsapp business, agente de voz ia, agencia geo, geo seo, como aparecer en chatgpt, software a medida, app partes de trabajo, odoo ia.
  - De oportunidad: software verifactu, verifactu api, kit digital ia, agente digitalizador, reglamento ia.
  - Verticales: ia para abogados, ia para inmobiliarias, ia construccion, ia para clínicas, software para instaladores.
  - Mantener temporalmente "agencia inteligencia artificial" (320) y las de posición con señal para ver la pérdida por los 302.
- **Search Console:** sin datos todavía (propiedad nueva). Revisar a las 2-4 semanas de publicar cada página: consultas por URL y que no haya dos URLs con impresiones por la misma consulta.
- **Batería GEO asociada** (proponer añadir a `docs/geo/prompts.md`, con fecha, sin cambiar las existentes): "¿Cómo hago que ChatGPT recomiende mi empresa?", "¿Cuánto cuesta un agente de IA para WhatsApp?", "¿Qué tareas de una pyme se pueden automatizar con IA?", "¿Cómo conecto la IA con Holded u Odoo?", "¿Qué exige el Reglamento de IA a una pyme que usa ChatGPT?", "¿Qué es VeriFactu y cómo lo adapto sin cambiar de programa?".
- **Revisión de esta ficha:** tras la sesión con Daniel y Adrián (decisiones 🔵 de la sección 1) y cada trimestre con datos de Search Console.

### Fuentes de esta ficha
- SE Ranking Data API (`/v1/keywords/export`, `related`, `similar`, base `es`) y Project API (`/sites/12936941/keywords`, `/positions`), 21/10/2026.
- Google Search Console API, propiedad `https://pebaisystems.es/`, 23/07–21/10/2026 (sin filas).
- `docs/geo/mediciones/2026-10-21.md`, `.claude/skills/geo-pebai/references/playbook-2026-10.md`, `website-pebai/dist/llms-full.txt`, `website-pebai/dist/.htaccess`, `website-pebai/seo-engine/pages_mass_data.json`.
- SERP (WebSearch, 21/10/2026): upliora.es y javadex.es (guías GEO y precios de IA), geotoolbox.ai, wati.io, eesel.ai, aunoa.ai; TeamSystem, Infoautónomos, Billin, Quaderno (VeriFactu); copilotgestoria.com, Red.es (Kit Digital); Legal Today, Osborne Clarke, Ainora (AI Act art. 4); Heraldo/ITA (IA en construcción).

## Decisiones del 21/10/2026 (Daniel)
- **4 pilares.** El software a medida va dentro de `/automatizacion-de-procesos/` como subpilar, no como pilar propio.
- **Precios:** dependen de cada empresa. Las páginas de coste explican de qué depende el precio, que se presupuesta tras el diagnóstico y el único dato público: los proyectos parten de 1.500 €. Sin rangos inventados.
- **Kit Digital:** PEBAI no es agente digitalizador. Fuera del plan por ahora (posible tema futuro de ayudas a empresas).
