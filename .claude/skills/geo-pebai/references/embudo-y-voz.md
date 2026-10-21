# Embudo, oferta y voz de PEBAI (para todo contenido GEO)

Revisado el 21/10/2026 leyendo `website-pebai/dist/`, `docs/`, `.agents/skills/` y los perfiles públicos. Las líneas citadas son de ese día: comprobarlas antes de usarlas como fuente. Las skills de `.agents/skills/` son de la época de Antigravity: mandan la web publicada, `docs/guiones/` y `CLAUDE.md` cuando no coinciden.

## 1. El embudo paso a paso

| Paso | URL | Qué pide / qué pasa | Indexable |
|---|---|---|---|
| 0. Entrada | `/` (portada) o enlaces cortos `/ig` `/tt` `/yt` `/fb` `/x` `/li` `/wa` `/v/<vídeo>` `/q/<qr>` `/t/adrian` `/t/dani` | Los cortos son 302 al VSL con `utm_source`/`utm_medium` puestos (`dist/.htaccess:40-56`). `?origen=adrian|daniel` marca captación de salida. | Solo `/` |
| 1. VSL | `/consultoria-gratuita/` | Vídeo `vsl_consultoria_gratuita_v2.mp4` (2:49). Requisitos y filtro de admisión. CTA "Solicitar 1 de las 5 plazas (0 €)". | Sí (canonical, en sitemap) |
| 2. Solicitud | `/diagnostico/` | 3 preguntas (tamaño del equipo, objetivo a 3 meses, presupuesto "desde 1.500 euros") + nombre, empresa, WhatsApp y "¿Cómo nos conociste?" (`diagnostico/index.html:2276-2286`, incluye "Me lo recomendó ChatGPT u otra IA"). Envía a `api/lead.php` (email a equipo@ + SQLite privada). | noindex |
| 3. Espera | `/formulario-completado/?solicitud=<id>` | Vídeo de 2:08. "En menos de 24 horas te escribiremos por WhatsApp" (`formulario-completado/index.html:1318`). | noindex |
| 4. Reserva | `/reservar/?s=<id>` | Solo lo manda el equipo por WhatsApp a quien cualifica. Cal.com embebido (evento oculto `pebai-systems/sesion-tecnica`). | noindex, nofollow |
| 5. Confirmación | `/confirmacion-de-llamada/?startTime=…` | Vídeo de 2:07, botones de calendario, Google Meet. `api/calcom-webhook.php` marca la cita en el panel. Recordatorios de 24 h y 1 h por cron (`api/recordatorios.php`). | noindex |

**Canal y dueño** (`docs/enlaces-y-utm.md:56-69`, `pebai_canal()` en `api/_pebai_lib.php`): Google, Bing, ChatGPT, Perplexity o Gemini cuentan como **SEO/GEO · Daniel**. `utm.js` ya detecta referrers de chatgpt, perplexity, gemini, claude y copilot (`utm.js:45-52`). Si los utm y la respuesta del formulario no cuadran, manda el formulario y sale "revisar".

**Dónde encaja el tráfico de IA.** Las IAs solo pueden citar `/` y `/consultoria-gratuita/` (las únicas del sitemap). Las 70 landings SEO antiguas están en 302 a la portada desde el 15/10 (`.htaccess:61`). El tráfico de IA debe aterrizar en la portada o en el VSL, nunca directo en `/diagnostico/` ni en `/reservar/`.

**Lo que no se puede romper:**
- Que `/diagnostico/`, `/formulario-completado/`, `/reservar/`, `/confirmacion-de-llamada/` y `/t/*` sigan en noindex. Un perfil o artículo nunca enlaza a `/reservar/`, porque saltaría la cualificación.
- En los perfiles, el campo web va a `https://pebaisystems.es` sin utm. Los cortos con origen solo van en bios y botones (`docs/geo/perfiles/README.md`).
- Para un enlace nuevo, crear su atajo en `.htaccess` y documentarlo en `enlaces-y-utm.md`. Nada de utm escritos a mano.
- La respuesta "Me lo recomendó ChatGPT u otra IA" del formulario es el KPI de GEO: no quitarla ni renombrarla.

**Vídeos del embudo.** No hay .vtt ni .srt. Los guiones aprobados están en `docs/guiones/referencias.md`:
- VSL: líneas 3-22
- Formulario completado: 24-38
- Confirmación: 40-53

| Archivo | Duración |
|---|---|
| `vsl_consultoria_gratuita(_v2).mp4` | 169 s |
| `formulario_completado(_v2).mp4` | 128 s |
| `confirmacion_de_llamada(_v2).mp4` | 126,6 s |
| `presentacion.mp4` (portada y YouTube) | 170,5 s |
| `presentacion_bucle.mp4` | 36,7 s |
| `stock_prescripcion.mp4` | 146,7 s |

No hay guion de `presentacion.mp4`: falta su transcripción. Hay ffmpeg, pero no whisper local, y no se ha instalado nada.

## 2. Oferta y promoción vigente

- **Consultoría gratuita, 5 plazas al mes, luego de pago:**
  - "Gratis para las cinco empresas seleccionadas cada mes. Cuando se completan, la consultoría pasa a ser de pago." (`index.html:771`)
  - En el VSL: "5 plazas mensuales" y "0 €", con la etiqueta "Por tiempo limitado" (`consultoria-gratuita/index.html:1726-1729`).
  - Llamada a la acción: "Solicitar 1 de las 5 plazas (0 €)" (`:1858`).
- **Formato:** 25 minutos por videollamada en pantalla compartida, sin compromiso de contratación. Te llevas "Mapa técnico de optimización", "Estimación de ahorro" y "Esquema técnico de procesos" (`index.html` sección "Cómo trabajamos").
- **Precio de implantación:**
  - "Inversión mínima desde 1.500 euros." (`diagnostico/index.html:2217`)
  - `priceRange` "Desde 1.500 €" (`index.html:115`, JSON-LD)
  - "Los proyectos de implantación parten de 1.500 €." (`llms.txt:20`)
- **Valor de referencia en el guion del VSL:** la consultoría cuesta "entre mil y dos mil euros" en el mercado (`docs/guiones/referencias.md:15`).
- **Filtro:** empresas en marcha "a partir de 3-5 empleados" y asistencia del gerente o socio que decide (`consultoria-gratuita/index.html:1901`, motivos de anulación).
- **Otras promociones:** no hay descuentos ni promociones activas en las landings.
- **Las tres fases públicas:** consultoría (0 €), desarrollo e integración, acompañamiento continuo mes a mes.

## 3. Voz de marca

**Cómo hablan:**
- Tutean a un dueño o directivo. Usan "vosotros" para la empresa del cliente ("los programas que ya usáis") y "nosotros" para el equipo de ingeniería con nombre (Adrián, Dani).
- Son sobrios y seguros: sin exclamaciones, sin emojis, sin hype (`guia-de-estilo.md:26`).
- Escriben frases cortas, de una idea, y enumeran en pares o tríadas: "Clientes / Operativa / Sistemas".
- Cierran siempre igual: "Nos vemos en la sesión."
- En los guiones de locución, los números van en letra y se escribe "Inteligencia Artificial" completa, nunca "IA" (`guia-de-estilo.md:48-49`). La web sigue la regla en la portada, pero no en el VSL.

**Frases tipo reales (para tomar el tono, no para copiarlas):**
- "Implantamos sistemas que atienden a tus clientes, eliminan tareas manuales y se conectan a los programas que ya usáis." (`index.html:758`)
- "Primero entendemos tu operativa. Después, construimos." (`index.html:829`)
- "Si algo se resuelve sin Inteligencia Artificial, te lo decimos claro." (`index.html:920`)
- "La Inteligencia Artificial no viene a sustituir a nadie." (`index.html:802`)
- "Treinta segundos de solicitud. Respuesta en menos de veinticuatro horas." (`index.html:935`)
- "Somos un equipo de ingeniería…" (`docs/agente-whatsapp-mensajes.md`, respuesta a "¿Qué vendéis?")

**Longitud:** WhatsApp en frío, menos de 50 palabras; email en frío, 50-75 palabras; vídeos de embudo, 2-3 minutos; descripciones de redes, una línea de gancho, la llamada a la acción y los hashtags.

### Palabras y expresiones prohibidas

[H] marca las que se deducen y no aparecen escritas en el repositorio.

| Prohibida | Usar en su lugar | Fuente |
|---|---|---|
| auditoría, auditar | consultoría gratuita, analizar tu caso, revisión técnica | `guia-de-estilo.md:15,21`; `pebai-carousel-production/SKILL.md:142` |
| radiografía | diagnóstico de procesos, analizar tu operativa | `pebai-carousel-production/SKILL.md:142` |
| cuello(s) de botella | atascos, puntos de bloqueo, tareas que más tiempo consumen | `humanizer/SKILL.md:26`, `b2b-carousel-copywriting/SKILL.md:109`, `pebai-master-system/SKILL.md:27` (la guía de estilo lo lista aún en su vocabulario, ver §5) |
| apagando fuegos | resolviendo urgencias del día a día | `b2b-carousel-copywriting/SKILL.md:111` |
| como un reloj suizo | sin intervención manual ni errores de copia | `b2b-video-scriptwriting/SKILL.md` §3 |
| hoja de ruta (personalizada) | mapa técnico de optimización, plan técnico de implantación | `pebai-master-system/SKILL.md:27`, `b2b-video-scriptwriting` §3 |
| evaluar la visibilidad, viabilidad técnica, sistemas inteligentes | ver si la IA os recomienda, ver si encaja, sistemas con Inteligencia Artificial | `guia-de-estilo.md:21` |
| "en el vertiginoso mundo de…", "en el panorama actual", "en un mundo cada vez más digitalizado" | entrar directo al problema concreto | `b2b-video-scriptwriting` §3, `humanizer/SKILL.md:19` |
| revolución sin precedentes, revolucionar | ventaja comercial directa | `b2b-video-scriptwriting` §3; [H] para el verbo |
| sin letra pequeña | a coste cero con plazas limitadas | `b2b-video-scriptwriting` §3 |
| juega un papel crucial, elemento fundamental, es un testimonio de, fomentar, crucial | decir el impacto exacto | `humanizer/SKILL.md:20-21` |
| "aquí no vas a ver X" (contraste) | describir lo que es | `guia-de-estilo.md:10` |
| listas de cargos (gerentes, responsables de…) | negocios, empresas con equipo | `guia-de-estilo.md:13` |
| "entender la tecnología lo suficiente" (condescendiente) | ninguno, se elimina | `guia-de-estilo.md:14` |
| jerga técnica como gancho ("agentes y asistentes conectados", "cómputo de inferencia", "latencia vectorial") | el efecto en tiempo, dinero o clientes | `guia-de-estilo.md:12`, `pebai-carousel-production/SKILL.md:145` |
| "Hola a todos" de apertura | primera frase directa | `b2b-video-scriptwriting/SKILL.md:43` |
| "pregunta rápida" | ninguno | `agente-whatsapp-mensajes.md:15` |
| "gratis" sin el límite de 5 plazas | "gratuita para cinco empresas al mes; después, de pago" | `docs/geo/perfiles/README.md:42`, `agente-whatsapp-mensajes.md:147` |
| promesas garantizadas, cifras de ahorro inventadas, "casos reales" sin casos | rangos con fuente o nada | `guia-de-estilo.md:51`, regla 2 de `SKILL.md` |
| "vuestra web", desarrollo web como servicio principal | su caso: atención, procesos, GEO, apps | `docs/geo/perfiles/README.md`; `captacion-email.md:17` |
| sesión de 45 o 60 minutos | 25 minutos | `pebai-carousel-production/SKILL.md:139` |
| emojis y exclamaciones | ninguno | `guia-de-estilo.md:21,26` |
| raya larga (—) | punto, dos puntos o coma | `.claude/skills/taste-skill/SKILL.md:693`; [H] en texto |
| potenciar, impulsar tu negocio | hacer, ganar, ahorrar (con el verbo concreto) | [H] |
| sinergia(s) | trabajar juntos, conectar X con Y | [H] |
| desbloquear (potencial) | conseguir, dejar de perder | [H] |
| transformación digital | implantar Inteligencia Artificial en tu operativa | [H] |
| soluciones integrales, de vanguardia, innovador, líder del sector, a medida de tus necesidades | decir qué se construye: chatbot, agente de voz, app | [H] |
| vector estratégico, maximizar rentabilidad | prioridad, ahorrar horas, no perder clientes | [H] (aparece en `diagnostico/index.html:2131,2444`) |
| ecosistema, sumergirse, en definitiva, cabe destacar, no solo X sino también Y | frase directa | [H] |
| sobre-adverbios en -mente en cadena, tríadas de adjetivos simétricas | frases asimétricas con dato | `humanizer/SKILL.md:22,24` |

## 4. Redes

Los perfiles enlazados están en el `sameAs` de `index.html:66-72`. LinkedIn no aparece en `sameAs`, aunque existe el corto `/li`.

| Red | Qué se ha podido ver (21/10/2026, sin iniciar sesión) | Enlace al embudo |
|---|---|---|
| YouTube @pebaisystems (UCJ5ecot00P--vMBuv09dKIQ) | 12 vídeos desde el 13/10: 11 Shorts y un vídeo largo ("Lo que la IA ya Puede Hacer dentro de TU EMPRESA (casos reales)"). Vistas: entre 3 y 600. Títulos con mayúsculas de gancho ("Deja de ser un ESCLAVO…", "Se el NUMERO 1…"). Llamada a la acción: "comenta CONSULTORÍA" o vídeo relacionado. | Vídeo largo: `pebaisystems.es/v/presentacion`; su descripción enlaza Facebook como `facebook.com/pebaisystems` (distinto del `sameAs`) |
| TikTok @pebaisystems | Bio: "IA para dejar de perder tiempo, clientes y ventas", con emoji 👇 y "Consultoría (0€)· Plazas limitadas". Unos 36 seguidores. | `pebaisystems.es/tt` |
| Instagram @pebaisystems | Solo se ve el título "Consultora de Procesos e IA" (muro de inicio de sesión) | `/ig` (según la documentación) |
| Facebook (id 61595234630397) | Título de la página: "PEBAI Systems \| Valencia" | `/fb` |
| X @pebaisystems | Devuelve 402, no se puede leer | `/x` |

Palabras clave de los comentarios (`guia-de-estilo.md:20`):
- CONSULTORÍA y RESPUESTA llevan a `/ig?palabra=…`, es decir, al VSL.
- GEO y FORMACIÓN llevan a `/diagnostico/?origen=<red>&palabra=…`.
- Desde el 14/10 se responden a mano. No hay bot.

## 5. Reglas para todo contenido GEO de PEBAI

1. **Entidad única:**
   - Nombre: "PEBAI Systems".
   - Descripción: "Consultoría de procesos e Inteligencia Artificial para empresas de cualquier sector en España".
   - Contacto: `equipo@pebaisystems.es` y +34 624 84 27 99.
   - Ubicación: España, en remoto, sin dirección. Copiar de `docs/geo/perfiles/README.md` y no reescribir la descripción en cada ficha.
2. **Oferta siempre completa:**
   - Consultoría de 25 minutos, gratuita para cinco empresas al mes y de pago después.
   - Implantación desde 1.500 €.
   - Nunca "gratis" a secas, nunca otra duración y nunca un precio distinto.
3. **La llamada a la acción lleva al VSL** (`/consultoria-gratuita/`, o a un corto con origen si se trata de un perfil). Nunca directa a `/reservar/`. Directa a `/diagnostico/` solo con la palabra GEO o FORMACIÓN.
4. **Servicios en este orden:** consultoría de procesos, software a medida, chatbots, agentes de voz, visibilidad en IA (GEO) y formación. Desarrollo web, como mucho, secundario. Placas solares es una vertical más, no el posicionamiento.
5. **Voz:** la de la sección 3, sin palabras prohibidas. En páginas citables se permite "IA" junto a "Inteligencia Artificial" (los usuarios preguntan "IA"), pero la primera mención se escribe completa. [H]
6. **Datos:** solo con fuente y fecha (INE, UNEF, IDAE…). Prohibido inventar casos, clientes, reseñas o el "casos reales" de un título si no hay casos. Antes de citar estadísticas del embudo, comprobarlas (ver conflictos).
7. **Respuesta directa en la primera frase** de cada página o perfil, y la fecha de actualización visible.

### Conflictos detectados (para que decida el equipo, no corregir sin OK)

- **Ubicación:**
  - "Sede en Valencia & Madrid, España." (`consultoria-gratuita/index.html:1998`, `formulario-completado/index.html:1418`)
  - La página de Facebook se titula "Valencia".
  - Frente a la regla de "sin dirección publicada" (`docs/geo/perfiles/README.md`) y el JSON-LD, que solo pone `addressCountry: ES`. Rompe la coherencia del NAP.
- **"auditar" y "hoja de ruta" en el VSL:**
  - "Para auditar tu operativa y diseñar una hoja de ruta técnica…" (`consultoria-gratuita/index.html:1877`, y "hoja de ruta" también en `:1876`)
  - "auditar la amortización" (`diagnostico/index.html:2423`)
  - "hoja de ruta de formación" (`:2426`)
- **"cuellos de botella":**
  - Está en el vocabulario de marca de `guia-de-estilo.md:42` y en el guion aprobado de formulario completado (`referencias.md:36`).
  - Tres skills la prohíben. La guía y el guion contradicen a las skills.
- **Raya larga:** en el guion aprobado (`referencias.md:28`) y en el `<title>` de la portada (`index.html:8`, "PEBAI Systems — Inteligencia…").
- **"IA" y "ingenieros de IA" en el VSL** (`consultoria-gratuita/index.html:1746,1862`, title y meta), frente a la regla de escribir "Inteligencia Artificial" completa.
- **Dato de adopción:**
  - El guion del VSL dice "más del noventa por ciento" (`referencias.md:13`).
  - La portada dice "8 de 10 … Fuente: INE, 2025" (`index.html:818`).
  - Usar solo la cifra del INE, con su fuente.
- **Valor de mercado de la consultoría:** el guion dice 1.000-2.000 € (`referencias.md:15`); `b2b-carousel-copywriting` dice 1.000-1.500 € y además "diagnóstico VSL 45 min", que contradice los 25 minutos.
- **Estadísticas sin fuente verificable** en la pantalla de gracias de `/diagnostico/`: "-391%" atribuido a HBR, "21x", "68%", "84%", "70%" y "3.4x" (`diagnostico/index.html:2378-2433`). No usarlas en contenido GEO hasta verificarlas.
- **"Desarrollo web"** aparece como servicio en la portada y en `llms.txt`, aunque la regla es no vender webs (se admite como secundario).
- **Redes:**
  - Los títulos de YouTube en mayúsculas ("ESCLAVO", "NUMERO 1") y el emoji de la bio de TikTok chocan con "sobrio, sin hype, sin emojis".
  - "(casos reales)" en el vídeo largo no tiene casos publicados que lo respalden.
  - La URL de Facebook difiere entre la descripción de YouTube y el `sameAs`.
  - LinkedIn no está en el `sameAs`.
- **Skills antiguas:** `pebai-master-system`, `pebai-sales-funnel` y `CONTENT_SYSTEM_PBI.md` siguen hablando de "Auditoría 0 €", bot 24/7, Typeform y formularios de facturación. Todo eso está retirado: no usarlas como fuente de hechos.
