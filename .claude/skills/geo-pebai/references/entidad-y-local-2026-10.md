# Entidad y señales locales — investigación a 21/10/2026

Complementa a `playbook-2026-10.md` y `tacticas-2026-10.md` (no repite lo que ya está allí). Marcas: **[V]** fuente primaria · **[S]** proveedor, prensa o estudio con interés comercial · **[H]** criterio propio. Problema de partida: las IAs confunden "PEBAI" con PEBA (agencia de EE. UU.), Pebble Beach Systems y Pegasystems. PEBAI no tiene LinkedIn, Wikidata ni prensa, y la sociedad aún no está constituida.

## 1. Desambiguación: cómo decide cada motor a qué entidad te refieres

**Cómo funciona (mecanismo).** Ningún motor publica su algoritmo de resolución de entidades. Lo que sí se sabe:
- **Google** genera los Knowledge Panels de forma automática a partir de su Knowledge Graph y no hay ninguna receta que lo garantice [V, https://support.google.com/knowledgepanel/answer/7534902]. Gemini y AI Mode se apoyan en ese grafo [S].
- **ChatGPT** mezcla lo que aprendió en el entrenamiento con la búsqueda (Bing y OAI-SearchBot); **Claude** usa Brave; **Perplexity** busca en vivo. Ante un nombre ambiguo, el modelo se queda con la entidad homónima que tenga **más presencia en la web** [S, https://www.parse.gl/blog/entity-disambiguation-ai · https://www.pravinkumar.co/blog/why-ai-assistants-confuse-small-brands-with-similar-names-2026, 2026]. No hay guía oficial de OpenAI sobre esto [S].
- Consecuencia [H]: no se puede "ganar" a Pegasystems en la palabra "Pega"/"PEBA". Hay que hacer que **"PEBAI Systems" + España + procesos e IA + Adrián y Daniel** aparezcan siempre juntos, para que el modelo los trate como una entidad aparte.

**Nombre único y constante** [H, apoyado en las normas de nombre de GBP, V]:
- Siempre **"PEBAI Systems"** (con "Systems") en títulos, firma de email, GBP, directorios, LinkedIn y YouTube. "PEBAI" a secas solo dentro de un texto donde ya se haya dicho el nombre completo.
- En la primera frase de cada perfil, el mismo descriptor: "PEBAI Systems es una consultora española de procesos e inteligencia artificial fundada por Adrián [apellido] y Daniel [apellido]". Repetirlo literal en todas partes es lo que crea la asociación.
- No nombrar a PEBA, Pebble Beach ni Pegasystems en la web [H]: ponerlos al lado del nombre refuerza la confusión que queremos romper.

**Schema Organization según Google (doc actualizado el 08/09/2026)** [V, https://developers.google.com/search/docs/appearance/structured-data/organization]: ninguna propiedad es obligatoria. Recomienda `name`, `alternateName`, `legalName`, `url`, `logo` (≥112×112 px, que se vea bien en fondo blanco), `description`, `sameAs` (varios), `address`, `contactPoint`, `email`, `telephone`, `foundingDate`, `numberOfEmployees`, `vatID`/`taxID` ("importante señal de confianza") e `iso6523Code`. Un solo bloque en la home o en "Quiénes somos", con el subtipo más específico. **PEBAI ahora:**
- `name: "PEBAI Systems"`, `alternateName: ["PEBAI"]`, `disambiguatingDescription` (propiedad de schema.org) con el descriptor anterior, `foundingDate`, `numberOfEmployees: 2`, `founder` → las dos `Person`, `areaServed: ES`.
- `sameAs` solo a perfiles **que existan y estén completos**: GBP (URL de Maps con CID), YouTube, Instagram, Crunchbase, y LinkedIn cuando se cree. Nada de enlaces vacíos.
- `legalName`, `vatID` y `address` **después de constituir la sociedad**: hoy no hay NIF y no se debe inventar.

**Knowledge Panel** [V, Google Help]: si sale un panel al buscar "PEBAI Systems", abajo aparece "Reclamar este panel"; se verifica iniciando sesión en un perfil oficial que Google ya tenga enlazado (YouTube, Search Console…). No todos los paneles se pueden reclamar; si no se puede, se usa el enlace "Enviar comentarios". Ojo: el **panel de GBP (negocio local) es otra cosa** y se gestiona desde Business Profile. Plazos: no hay; los proveedores hablan de semanas a 6 meses [S, Kalicube/Databox]. Comprobación gratis [H]: Knowledge Graph Search API (`kgsearch.googleapis.com`, requiere clave gratuita de Google Cloud) para ver si ya existe un `kgmid` de PEBAI Systems.

**Wikidata** [V, https://www.wikidata.org/wiki/Wikidata:Notability]: se admite un elemento si tiene enlace a Wikipedia, si es "una entidad claramente identificable" descrita con "referencias serias y públicas", o si cubre una necesidad estructural. Las fuentes propias no cuentan, y crear el elemento de tu propia empresa es conflicto de interés y se borra a menudo [S, v9digital, aokmarketing]. **PEBAI:** esperar a tener (1) inscripción en el Registro Mercantil/BORME y (2) al menos dos menciones independientes (medio sectorial, podcast, directorio con reseñas). Entonces crearlo con P31 = empresa, P17 = España, P856 = web, P571 = fecha de fundación, P112 = fundadores, y cada dato con su referencia externa.

**Registros mercantiles** [H]: einforma, axesor, infoempresa, Libre BORME o empresia generan fichas solas a partir del BORME cuando se inscribe una sociedad. No hace falta darse de alta: aparecerán solas. Lo que sí hay que hacer es revisar que la denominación social coincida con "PEBAI Systems" (por ejemplo "PEBAI Systems S.L."); si el nombre registrado es distinto, ponerlo en `legalName` y en la página "Quiénes somos". **Crunchbase** (gratis) sí se puede crear ya.

## 2. Brave Search (fuente de Claude)

Fuente: ayuda oficial [V, https://search.brave.com/help/brave-search-crawler]:
- El rastreador de Brave **no tiene user agent propio**: se presenta como un navegador normal y **no rastrea lo que Googlebot no pueda rastrear**. Si Googlebot entra, Brave también.
- robots.txt **no impide indexar**; para quitar una página se usa `noindex`.
- Parte del descubrimiento sale del **Web Discovery Project** (usuarios de Brave que lo activan de forma voluntaria y anónima): las páginas que visita gente real se descubren antes.
- **No hay consola para webmasters.** Solo existe el formulario **search.brave.com/submit-url**, que pide al bot que rastree una URL [V], y no da datos de rendimiento [S, foro de Brave].

**PEBAI:** (1) enviar la home y las 5 URL madre a submit-url después de cada cambio importante; (2) comprobar en Cloudflare que el WAF no bloquea user agents de navegador "raros" (Brave no se identifica); (3) medir con una búsqueda manual `site:pebaisystems.es` en search.brave.com y con las visitas que llegan de `search.brave.com` en GA4; (4) los enlaces desde webs que ya estén en Brave (directorios, LinkedIn, YouTube) aceleran el descubrimiento [H].

## 3. Fichas locales: GBP, Bing Places, Apple Business Connect

**Riesgo de GBP para PEBAI** [V, https://support.google.com/business/answer/3038177]: el negocio debe tener "un local que los clientes puedan visitar" **o desplazarse hasta los clientes**. Una oficina virtual no es válida. Los negocios que se desplazan ocultan la dirección y ponen zonas de servicio, sin pasar de unas 2 horas en coche [V, https://support.google.com/business/answer/10514137]. Un negocio que **solo trabaja online no cumple** → riesgo de suspensión. **PEBAI:** la ficha tiene que reflejar que visitan a las empresas (reuniones de diagnóstico o implantación en persona). Dirección oculta y zonas de servicio realistas. Nombre exacto "PEBAI Systems", sin añadir palabras clave ("PEBAI Systems – Consultora IA" incumple las normas).

**Qué leen las IAs de la ficha:**
- La sección de preguntas y respuestas de GBP se ha retirado (API cerrada el 03/11/2025, parte pública desde 12/2025) y la sustituye **"Ask Maps"/Gemini**, que contesta con lo que hay en la ficha: **reseñas, descripción, fotos, servicios** [S, BrightLocal/footbridgemedia]. Así que el texto de las reseñas y la lista de servicios son ahora el material con el que la IA responde.
- **Volumen de reseñas**: en AI Mode, los negocios que recomendó tenían una mediana de 140 reseñas en Google frente a 61 del resto del top 20, con la misma nota (4,9) [S, Whito, Reino Unido, 3.149 negocios, 08/2026]. Insites: 133 frente a 11 [S, 10.000 negocios, 2026]. Es correlación y estudio de proveedor, pero coincide: **cuenta más el número y el texto que las estrellas**.
- En 2026, el 45 % de los consumidores ya usa IA para buscar negocios locales (31 % ChatGPT, 23 % AI Mode) [S, encuesta de BrightLocal citada por terceros].
- **Copilot** saca los datos locales de **Bing Places** [S, varios]. Bing Places deja importar la ficha de GBP: así es casi gratis.
- **Apple Business Connect** (gratis, en español) alimenta Mapas, Siri y Spotlight [V, lanzamiento 01/2023]. No hay datos de 2026 fiables sobre su peso en IA [S].

**Campos que hay que rellenar en GBP** [H]: categoría principal "Consultor empresarial" (o la más parecida a procesos/IA) más secundarias; **servicios** con descripción (diagnóstico de procesos, automatización, chatbot, GEO, apps a medida), igual que en la web; descripción de 750 caracteres que empiece con el descriptor de la §1; **publicaciones** cada dos semanas (dan frescura; el efecto en IA no está medido) [H]; fotos reales de Adrián y Daniel trabajando; enlace a la web con UTM.

**Primeras reseñas, de forma legítima** [V política de Google, resumida en S]: se puede pedir reseña a **todos** los clientes por igual. Está prohibido dar cualquier cosa a cambio (descuentos, sorteos, regalos), pedirla solo a los contentos (*review gating*) o pedir que cambien una negativa. **PEBAI:** después de cada consultoría gratuita y de cada proyecto, enviar el enlace corto de reseña de GBP con el mismo mensaje para todos, sin condiciones. Pedir que cuenten **qué proceso se automatizó y qué resultado tuvo**, porque ese texto es lo que lee Gemini.

## 4. Plataformas de reseñas B2B y ley en España

- **Clutch**: para servicios digitales sería la plataforma de reseñas más citada por ChatGPT (≈84,5 % de las citas de su categoría; >95 % junto con GoodFirms) [S, Hall, guía ya retirada, 2026]. El perfil es gratis; las reseñas las recoge un analista por teléfono con los clientes que tú propones; el sello "Verified" cuesta 499 $/año y coloca la ficha por encima de las demás [S, clutch.co]. **No pagarlo al principio** [H].
- **GoodFirms**: complemento barato de Clutch (mismo tipo de cita).
- **Sortlist**: el directorio de agencias más presente en España; no hay datos de cuánto lo citan las IAs [S]. Perfil gratis → útil para entrar en sus listados por ciudad.
- **Trustpilot**: muy citado por los LLM en marcas de consumo (5.º dominio en 01/2026 [S, Contrary]), pero hay fuentes que dicen que bloquea crawlers de IA [S, Hall]. Para un B2B pequeño, **prioridad baja**.
- **G2/Capterra**: no aplica (son para software).

**Marco legal** [V/S]:
- Directiva Ómnibus (UE) 2019/2161, transpuesta por el **RDL 24/2021**: es práctica desleal publicar reseñas sin "medidas razonables" para comprobar que vienen de clientes reales, y encargar o tergiversar reseñas [S, Cuatrecasas, 03/2025].
- **Ley 10/2025** de atención a la clientela (BOE 27/12/2025, en vigor desde el 28/12/2025) modifica el art. 20 de la LGDCU: el empresario debe **garantizar que las reseñas publicadas las han hecho consumidores que de verdad compraron o usaron** el servicio. Según el Gobierno, prohíbe comprar y vender reseñas [V/S, https://www.boe.es/buscar/act.php?id=BOE-A-2025-26698 · nota de La Moncloa 13/11/2025]. Aunque PEBAI venda a empresas (B2B, no consumidores), la competencia desleal y las normas de cada plataforma se aplican igual [H].
- Si se publican reseñas en la propia web: indicar de dónde vienen y cómo se comprueban (obligación Ómnibus) y usar solo las de clientes reales. Nunca `AggregateRating` de autoservicio en el schema de la propia organización (Google no lo muestra para reseñas propias) [H].

## Checklist ordenada por impacto para PEBAI

1. **Fijar el nombre**: "PEBAI Systems" + descriptor idéntico en web, GBP, YouTube, Instagram y firmas. [Hoy, bajo esfuerzo]
2. **Revisar que GBP cumple las normas**: dirección oculta, zonas de servicio ≤2 h, visitas presenciales reales, nombre sin palabras clave. Si no cumple, corregirlo antes de que la suspendan.
3. **Completar GBP**: servicios descritos como en la web, descripción, fotos, publicaciones cada dos semanas.
4. **Reseñas**: enlace de reseña a todos los clientes y a quien haga la consultoría gratuita, sin incentivos; objetivo 10 reseñas con texto antes de enero.
5. **Ampliar el JSON-LD Organization**: `alternateName`, `disambiguatingDescription`, `founder`, `foundingDate`, `numberOfEmployees` y `sameAs` solo con perfiles reales.
6. **LinkedIn de empresa + perfiles de Adrián y Daniel** con el mismo descriptor (es la desambiguación de más peso que falta) y añadirlo a `sameAs`.
7. **Bing Places** (importar desde GBP) y **Apple Business Connect**.
8. **Brave**: enviar las URL a submit-url y comprobar que Cloudflare no bloquea navegadores sin identificar.
9. **Clutch + GoodFirms + Sortlist + Crunchbase**: perfiles gratis y 3 clientes que hagan la reseña de Clutch.
10. **Comprobación mensual**: Knowledge Graph API, search.brave.com, y la pregunta "¿Qué es PEBAI Systems?" en ChatGPT, Claude, Gemini y Perplexity (anotar si lo confunden y con quién).
11. **Después de constituir la sociedad**: `legalName`/`vatID` en el schema, revisar las fichas de einforma/axesor/infoempresa y, con dos menciones independientes, **Wikidata**.
12. **Reclamar el Knowledge Panel** en cuanto salga, iniciando sesión con YouTube/Search Console.
