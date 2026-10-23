# Borrador · /ia-para-empresas/

Estado: **publicada el 23/10/2026** en https://pebaisystems.es/ia-para-empresas/ (se añadieron el H2 «Cómo elegir consultora de IA», el caso de Fran García Cars y la FAQ de elegir consultora en lugar de «cuándo no conviene», que sigue como H2). Escrito el 22/10/2026 en el turno de las 15:00 por geo_contenido.

## Ficha

- **URL:** `https://pebaisystems.es/ia-para-empresas/` (pilar P1 de `docs/geo/pilares.md`).
- **Title (≤ 60):** `IA para empresas: cómo implantarla y por dónde empezar | PEBAI Systems`
- **Meta description (≤ 155):** `Cómo implantar Inteligencia Artificial en tu empresa: por dónde empezar, qué procesos dan resultado antes, qué exige la ley, qué ayudas hay y cuánto cuesta.`
- **H1:** `Cómo implantar Inteligencia Artificial en tu empresa: por dónde empezar`
- **Autor:** Adrián Ballesteros Moscardó, dirección de proyectos y consultoría (`https://pebaisystems.es/#adrian`). Alterna con /agentes-ia/ (Daniel).
- **Fecha visible y dateModified:** el día que se publique.
- **CTA:** `/consultoria-gratuita/?cta=pilar_ia-para-empresas`
- **Palabras:** "ia para empresas" (320), "empresas de ia" / "empresa de ia" (390), "ia para pymes" (90). Conversacionales: prompts 4, 5 y 8 del set.

### Anticanibalización (comprobado el 22/10)
- Sitemap: `/`, `/consultoria-gratuita/`, `/posicionamiento-en-ia/`, `/agentes-ia/`. No existe carpeta `dist/ia-para-empresas/`.
- Home: title "Inteligencia Artificial trabajando dentro de tu empresa" (marca + "consultoría de procesos e IA"). Esta página es la **guía** ("cómo implantar"), no la oferta. "Consultoría de IA" se queda en la home: aquí se enlaza a `/` con ancla "consultoría de procesos e Inteligencia Artificial", nunca en el H1.
- /agentes-ia/: solo se resume en un párrafo y se enlaza (atención al cliente). /posicionamiento-en-ia/: un párrafo y enlace.
- Precio: sin cifras (regla de `agentes.md`). Nada de "desde 1.500 €" en la página.
- El 302 de las landings retiradas (`.htaccess:61`) tiene `RewriteCond !-d`: al existir la carpeta, `/ia-para-empresas/` deja de redirigir. Comprobar tras publicar que da 200 y no 302.

### Fuentes verificadas (22/10/2026)

| Dato | Fuente | Comprobado |
|---|---|---|
| 33,6 % de empresas de 10 o más empleados usaron IA en el 1T 2026; 21,4 % en las de menos de 10; servicios 38,2 %, industria 29,1 %, construcción 22,6 %. Datos con CNAE-2025: "no estrictamente comparables" con años anteriores | INE, nota de prensa "Encuesta sobre el uso de TIC y del comercio electrónico en las empresas", 22/10/2026. https://www.ine.es/dyngs/Prensa/ETICCE20251T2026.htm | WebFetch 22/10, publicada hoy a las 13:54 |
| Año anterior: 21,1 % (10+) y 13,4 % (<10), 1T 2025 | INE, nota de 22/10/2025. https://www.ine.es/dyngs/Prensa/ETICCE20241T2025.htm | Ya citada en /agentes-ia/. **No restar puntos**: el INE avisa de que no son comparables |
| Art. 4 AI Act tras el Ómnibus: "adoptar medidas" para la alfabetización en IA del personal, sin exigir un nivel concreto a cada persona | Reglamento (UE) 2026/1744, DOUE 24/07/2026, en vigor el 27/07/2026 (Cuatrecasas, 24/07/2026: https://www.cuatrecasas.com/en/global/intellectual-property/art/digital-omnibus-ai-has-been-published). EUR-Lex: https://eur-lex.europa.eu/eli/reg/2026/1744/oj/spa (devuelve 202 al bot: enlazar, pero abrirlo en navegador antes de publicar si se puede) | WebFetch 22/10 |
| Alto riesgo aplazado al 2/12/2027 (anexo III) y 2/8/2028 (productos regulados) | Mismo | Idem |
| Art. 50 (avisar de que es una IA) desde el 2/8/2026 | Reglamento (UE) 2024/1689, ya citado en /agentes-ia/ | — |
| Kit Digital: en la sede de Red.es no hay convocatoria abierta para empresas; solo figuran la adhesión de agentes digitalizadores (C032/21-ED) y de asesores de Kit Consulting (C004/24-ED). La única de IA en plazo (C012/26-IA, hasta el 10/11/2026) es para asociaciones y centros tecnológicos, no para empresas | Sede electrónica de Red.es, convocatorias en plazo, consultada el 22/10/2026. https://sede.red.gob.es/es/convocatorias-y-ayudas ; nota del Ministerio, 09/09/2026 (40 M€, entidades colaboradoras) | WebFetch y búsqueda 22/10 |
| RGPD en tratamientos con IA (base legal, información, minimización, decisiones automatizadas, evaluación de impacto) | AEPD, "Adecuación al RGPD de tratamientos que incorporan Inteligencia Artificial. Una introducción", febrero de 2020. https://www.aepd.es/guias/adecuacion-rgpd-ia.pdf | Leído 22/10 (PDF marcado "en revisión": citar con su fecha) |
| Art. 22 RGPD (decisiones solo automatizadas) | Reglamento (UE) 2016/679 | Ya citado en /agentes-ia/ |

**Descartado:** el "8 de 10 empresas no usan IA" de la portada (dato de 2025, ya no vale con el 33,6 %; ver aviso al final). Las estadísticas sin fuente de `/diagnostico/`. Cualquier "X % de ahorro".

## Esquema (orden de bloques, mismo diseño que /agentes-ia/)

1. Migas: Inicio › IA para empresas.
2. Cabecera: kicker "Inteligencia Artificial para empresas", H1, autor y fecha.
3. Respuesta corta (caja).
4. Tres tarjetas de bifurcación: "¿Por dónde empiezo?" (#por-donde-empezar) · "¿Qué exige la ley?" (#ley) · "¿Me conviene?" (#cuando-no).
5. H2 Qué puede hacer la IA en una empresa (tres zonas + tabla).
6. H2 Cuántas empresas la usan ya en España (dato INE, figura simple de 3 barras por sector opcional).
7. H2 Por dónde empezar: 5 pasos (#por-donde-empezar).
8. H2 ¿Hay que cambiar de programas?
9. H2 Qué exige la ley (#ley): AI Act art. 4 y 50, RGPD.
10. H2 ¿Hay ayudas? Kit Digital hoy.
11. H2 Cuánto cuesta (sin cifras).
12. H2 Cuándo no conviene (#cuando-no).
13. H2 Hacerlo tú, contratar una herramienta o una consultora (tabla, como en /agentes-ia/).
14. H2 Guías de PEBAI por área (enlaces a /agentes-ia/ y /posicionamiento-en-ia/ + "próximamente").
15. FAQ (6).
16. Puente a la consultoría.
17. Fuentes.

## Texto

### Respuesta corta

Para implantar Inteligencia Artificial en tu empresa, empieza por un solo proceso que hoy os cueste horas o clientes: atender consultas, preparar presupuestos, pasar pedidos o partes de un programa a otro. Se analiza, se conecta a los programas que ya usáis, se prueba con el equipo y se mide. Si da resultado, se pasa al siguiente.

(54 palabras)

### Tarjetas
- **¿Por dónde empiezo?** Cinco pasos, de elegir el proceso a medir el resultado.
- **¿Qué exige la ley?** Formación del equipo, avisar de que es una IA y protección de datos.
- **¿Me conviene?** Cuándo encaja y cuándo es mejor no hacerlo.

### H2 · Qué puede hacer la Inteligencia Artificial en una empresa

En una empresa con equipo, el tiempo y el dinero se pierden sobre todo en tres sitios. La IA ayuda en los tres, pero de forma distinta:

| | Dónde se pierde | Qué hace la IA | Ejemplo |
|---|---|---|---|
| **Clientes** | Consultas sin contestar, llamadas perdidas, solicitudes que nadie sigue | Responde, cualifica y agenda por WhatsApp, teléfono o web | Un agente que contesta el WhatsApp fuera de horario y deja la cita puesta |
| **Operativa** | Tareas que se repiten cada día: presupuestos, partes, pedidos, facturas | Lee documentos, rellena datos y prepara borradores para que una persona los revise | Los pedidos que llegan por email entran solos en el programa de gestión |
| **Sistemas** | Datos copiados a mano de un programa a otro | Conecta los programas que ya usáis para que la información pase sola | El presupuesto aceptado crea el cliente en el CRM y la factura en el programa de contabilidad |

Los ejemplos son ilustrativos, no casos de clientes.

Hay una cuarta forma de usar la IA, más sencilla: que el equipo use bien herramientas como ChatGPT, Copilot o Gemini en su día a día. Es útil y barata, pero no cambia los procesos: cada persona sigue copiando y pegando. La diferencia de resultado está en conectar la IA al trabajo real de la empresa.

La Inteligencia Artificial no viene a sustituir a tu equipo. Le quita el trabajo repetido para que dedique su tiempo a lo que necesita criterio.

### H2 · Cuántas empresas usan ya Inteligencia Artificial en España

Según el INE, el 33,6 % de las empresas de 10 o más empleados usó Inteligencia Artificial en el primer trimestre de 2026, y el 21,4 % de las de menos de 10. Por sectores, servicios va delante (38,2 %), seguido de industria (29,1 %) y construcción (22,6 %) (INE, 22/10/2026).

Un año antes, las cifras eran del 21,1 % y el 13,4 % (INE, 22/10/2025). El INE advierte de que este año ha cambiado la clasificación de actividades y los datos no son estrictamente comparables, así que la subida exacta no se puede calcular. Lo que sí se ve es que ya no es cosa de grandes empresas.

(Figura opcional: tres barras horizontales servicios / industria / construcción, mismo estilo que la tabla de /posicionamiento-en-ia/. Si no queda limpia, solo texto.)

### H2 · Por dónde empezar: cinco pasos (#por-donde-empezar)

1. **Elegir un proceso, no una herramienta.** El que más horas consume o más clientes hace perder. Una pregunta útil: ¿qué tarea haría tu equipo con gusto si alguien se la quitara mañana?
2. **Medir cómo está hoy.** Cuántas consultas, cuántos presupuestos o pedidos a la semana, cuánto tarda cada uno y dónde se atasca. Sin ese punto de partida no sabrás si ha mejorado.
3. **Ver con qué programas tiene que hablar.** Programa de gestión, CRM, agenda, email, hojas de cálculo. Lo normal es conectar la IA a lo que ya usáis, no cambiarlo.
4. **Probarlo en pequeño con el equipo.** Unas semanas con casos reales, con una persona revisando lo que hace la IA antes de que llegue al cliente.
5. **Medir y decidir.** Si ahorra horas o recupera clientes, se deja funcionando y se pasa al siguiente proceso. Si no, se corrige o se para. Mejor un proceso bien hecho que cinco a medias.

### H2 · ¿Hay que cambiar de programas?

Casi nunca. La mayoría de los programas de gestión, CRM y agendas tienen una forma de conexión (una API) o, como mínimo, exportan e importan datos. La IA se coloca en medio: lee lo que entra, lo ordena y lo deja en el programa donde ya trabajáis.

Hay que replantearse el programa solo cuando no deja sacar ni meter datos de ninguna forma, o cuando la empresa ya pensaba cambiarlo por otros motivos. En ese caso, primero se decide el programa y después se automatiza, no al revés.

### H2 · Qué exige la ley si tu empresa usa Inteligencia Artificial (#ley)

- **Formar al equipo que la usa.** El artículo 4 del Reglamento europeo de Inteligencia Artificial obliga a las empresas que usan IA a adoptar medidas para que su personal sepa usarla: qué hace, qué riesgos tiene y cómo revisar lo que produce. Desde la reforma de 2026 (Reglamento (UE) 2026/1744, en vigor el 27 de julio) ya no exige garantizar un nivel concreto a cada persona, pero la obligación de formar sigue ahí (Cuatrecasas, 24/07/2026).
- **Avisar de que es una IA.** Si la IA habla con tus clientes, el artículo 50 del mismo reglamento obliga a que sepan que están tratando con un sistema de IA, salvo que sea evidente. Se aplica desde el 2 de agosto de 2026. Lo explicamos con detalle en la guía de agentes de IA (enlace a `/agentes-ia/#ley` o al H2 equivalente; comprobar el id).
- **Proteger los datos.** Si la IA trata datos de clientes o empleados, se aplica el RGPD: base legal para usarlos, informar a las personas, usar solo los datos necesarios, contrato de encargado del tratamiento con cada proveedor y saber en qué país se guardan. La AEPD tiene una guía específica para tratamientos con IA (AEPD, febrero de 2020).
- **Decisiones importantes, con una persona.** El artículo 22 del RGPD limita las decisiones que se toman solo de forma automatizada y afectan de verdad a alguien, como rechazar una solicitud o un contrato.
- **Alto riesgo, más adelante.** Los usos de alto riesgo (selección de personal, crédito, educación, entre otros) tienen obligaciones propias, aplazadas al 2 de diciembre de 2027. La mayoría de los usos de una pyme (atención, presupuestos, documentos) no entran ahí.

Esto es un resumen para orientarte, no asesoramiento legal. Si tu sector tiene normas propias, revísalo con tu asesor.

### H2 · ¿Hay ayudas para implantar IA? El Kit Digital hoy

A 22 de octubre de 2026 no hay ninguna convocatoria del Kit Digital abierta para empresas en la sede electrónica de Red.es. Lo que aparece en plazo es la adhesión de agentes digitalizadores y de asesores del Kit Consulting, y una convocatoria de IA dirigida a asociaciones y centros tecnológicos, no a empresas (Red.es, consultado el 22/10/2026).

Dos consejos si te ofrecen un proyecto "pagado por el Kit Digital": comprueba en la sede de Red.es o en Acelera pyme que hay una convocatoria abierta para tu tamaño de empresa, y decide el proyecto por el proceso que mejora, no por la ayuda. Una ayuda cubre parte del coste; lo que decide si sirve es el proceso que automatizas.

(Antes de publicar: volver a abrir https://sede.red.gob.es/es/convocatorias-y-ayudas y actualizar la fecha. Si se abre algo nuevo, cambiar el bloque.)

### H2 · Cuánto cuesta implantar Inteligencia Artificial en una empresa

Depende de la empresa. Lo que más mueve el precio:

- **El proceso y su volumen:** no cuesta lo mismo contestar 20 consultas al día que leer 500 pedidos a la semana.
- **Las conexiones:** con cuántos programas hay que hablar y si tienen una forma de conexión preparada.
- **Los costes de uso,** que se pagan aparte y crecen con el volumen: el consumo del modelo de IA, los mensajes de WhatsApp o los minutos de teléfono.
- **El acompañamiento:** quién revisa y mejora el sistema cuando cambian tus precios, tus servicios o tus programas.

Por eso no damos una cifra cerrada sin ver el caso: se presupuesta después de la consultoría, con el proceso concreto delante. Desconfía de un precio cerrado que no haya preguntado qué programas usáis.

### H2 · Cuándo no conviene implantar IA (#cuando-no)

- Si el proceso no está claro ni para tu equipo. Primero hay que ordenarlo; la IA repite lo que hay, también el desorden.
- Si el volumen es tan pequeño que una persona lo hace en minutos al día.
- Si nadie en la empresa va a revisar lo que hace la IA las primeras semanas.
- Si la tarea depende casi siempre del criterio de una persona (una negociación, una queja delicada).
- Si se resuelve sin IA, con una regla automática, una plantilla o un formulario. Es más barato y falla menos.

Si algo se resuelve sin Inteligencia Artificial, te lo decimos claro.

### H2 · Hacerlo tú, contratar una herramienta o una consultora

| | Herramienta por suscripción | Tu equipo por su cuenta | Consultora que lo implanta |
|---|---|---|---|
| **Qué te da** | Una función concreta lista para usar | Control total | El proceso analizado y la IA conectada a tus programas |
| **Qué cuesta** | Una cuota mensual por usuario o por uso | Horas de alguien técnico, más el consumo | Se presupuesta según el alcance, más el consumo |
| **Cuándo encaja** | Un problema estándar que la herramienta ya resuelve | Tienes a alguien que programa y tiempo para hacerlo | Procesos propios que cruzan varios programas |
| **Riesgo** | Pagar varias herramientas que no se hablan entre sí | Que todo dependa de una sola persona | Pagar por algo que una herramienta ya resolvía: pregunta antes |

Al elegir consultora, pregunta tres cosas: si te dirá que no cuando algo no compense, con qué programas tuyos se va a conectar y quién mantiene el sistema cuando cambie algo.

### H2 · Guías de PEBAI por área

- **Atender a tus clientes:** Agentes de IA para empresas: WhatsApp, teléfono y web → `/agentes-ia/`
- **Que la IA recomiende tu empresa:** Cómo aparecer en ChatGPT y en las respuestas de IA de Google → `/posicionamiento-en-ia/`
- Automatización de procesos: presupuestos, pedidos, partes y facturas. Próximamente.
- Cuánto cuesta implantar IA en una empresa. Próximamente.
- Cómo elegir consultora de IA. Próximamente.

(El enlace a la home va en el puente: "PEBAI Systems es una consultoría de procesos e Inteligencia Artificial" → `/`.)

### FAQ (idéntica en FAQPage)

1. **¿Por dónde empiezo a usar Inteligencia Artificial en mi empresa?**
   Por un solo proceso que hoy os cueste horas o clientes, como atender consultas, preparar presupuestos o pasar pedidos entre programas. Mide cómo está, conéctalo a los programas que ya usáis, pruébalo con el equipo unas semanas y decide con datos si se queda.

2. **¿Cuánto cuesta implantar IA en una pyme?**
   Depende de la empresa: el proceso, el volumen, con cuántos programas hay que conectarla y los costes de uso, que se pagan aparte (el consumo del modelo, los mensajes o las llamadas). Se presupuesta después de la consultoría, con el proceso concreto delante.

3. **¿Tengo que cambiar mis programas para usar IA?**
   Casi nunca. La mayoría de programas de gestión, CRM y agendas tienen una forma de conexión o exportan datos. La IA se coloca en medio y deja la información en los programas donde ya trabajáis.

4. **¿Qué exige la ley a una empresa que usa IA?**
   Adoptar medidas para que el personal sepa usarla (artículo 4 del Reglamento europeo de IA), avisar a los clientes cuando hablan con una IA (artículo 50, desde el 2 de agosto de 2026) y cumplir el RGPD si trata datos personales.

5. **¿Hay ayudas del Kit Digital para implantar IA?**
   A 22 de octubre de 2026 no hay convocatoria del Kit Digital abierta para empresas en la sede de Red.es. Antes de firmar un proyecto "con ayuda", comprueba en la sede de Red.es o en Acelera pyme que la convocatoria está abierta para tu empresa.

6. **¿Cuándo no conviene implantar IA en una empresa?**
   Cuando el proceso no está ordenado, el volumen es muy pequeño, nadie va a revisar los resultados al principio o la tarea depende del criterio de una persona. Si se resuelve con una regla automática o un formulario, es mejor hacerlo así.

### Puente final

**Si quieres saber qué proceso de tu empresa conviene empezar**

En la consultoría revisamos tu operativa contigo: dónde se pierden tiempo y clientes, con qué programas trabajáis y qué proceso daría resultado antes. Te llevas el mapa técnico con lo que conviene automatizar y lo que no. Si la IA no tiene sentido para vosotros todavía, te lo decimos claro.

Chips: 25 minutos por videollamada · Gratuita para 5 empresas al mes; después, de pago · Sin compromiso de contratación
Botón: Solicitar 1 de las 5 plazas (0 €) → `/consultoria-gratuita/?cta=pilar_ia-para-empresas`
Línea pequeña: PEBAI Systems es una consultoría de procesos e Inteligencia Artificial (enlace a `/`).

Nos vemos en la sesión.

### Fuentes (bloque final)

- INE, Encuesta sobre el uso de TIC y del comercio electrónico en las empresas, primer trimestre de 2026, 22/10/2026. ine.es
- INE, misma encuesta, 2024 y primer trimestre de 2025, 22/10/2025. ine.es
- Reglamento (UE) 2024/1689 de Inteligencia Artificial, artículos 4 y 50. eur-lex.europa.eu
- Reglamento (UE) 2026/1744 (Ómnibus digital sobre IA), DOUE de 24/07/2026. eur-lex.europa.eu
- Cuatrecasas, "Digital Omnibus on AI has been published", 24/07/2026. cuatrecasas.com
- Reglamento (UE) 2016/679 (RGPD), artículo 22. eur-lex.europa.eu
- AEPD, Adecuación al RGPD de tratamientos que incorporan Inteligencia Artificial, febrero de 2020. aepd.es
- Red.es, sede electrónica, convocatorias en plazo, consultada el 22/10/2026. sede.red.gob.es

## JSON-LD (para el turno de publicación)

`@graph` con: WebPage (`/ia-para-empresas/#webpage`, isPartOf `/#website`, about `/#organization`, inLanguage es-ES, dateModified), BreadcrumbList (Inicio › IA para empresas), Article (headline = H1, author `/#adrian`, publisher `/#organization`, datePublished = dateModified = día de publicación, citation con las URLs de fuentes) y FAQPage con las 6 preguntas de arriba **copiadas literalmente**. Copiar la estructura de `dist/agentes-ia/index.html`.

## Checklist del turno de publicación

- [ ] Volver a abrir la sede de Red.es (convocatorias) y la nota del INE; actualizar fechas.
- [ ] Maquetar copiando `dist/agentes-ia/index.html` (cabecera, migas, tarjetas, tablas, FAQ, puente, fuentes, pie).
- [ ] Ids de ancla: `por-donde-empezar`, `ley`, `cuando-no`. Comprobar el id del bloque legal de /agentes-ia/ para el enlace.
- [ ] Grep de palabras prohibidas (sección 3 de `embudo-y-voz.md`), sin raya larga, emojis ni exclamaciones. Ojo: "potenciar", "transformación digital", "soluciones", "hoja de ruta", "auditoría", "cuello de botella".
- [ ] JSON-LD válido (python json.loads) y FAQ idéntica.
- [ ] Enlaces internos existen: `/`, `/agentes-ia/`, `/posicionamiento-en-ia/`, `/consultoria-gratuita/`.
- [ ] En /agentes-ia/ y /posicionamiento-en-ia/: añadir enlace a /ia-para-empresas/ (mejora continua o encargo a Refresco).
- [ ] sitemap.xml, `dist/llms.txt` y `dist/llms-full.txt` (## Guías) + copia a `website-pebai/llms*.txt`.
- [ ] Push, esperar 3 min, `curl` 200 (no 302), `geo_datos.py gsc-sitemap` y `bing-url`.

## Aviso para Refresco y Jefe (no lo toca Contenido)

El INE publicó hoy (22/10/2026) los datos del 1T 2026: 33,6 % de empresas de 10 o más empleados usan IA. Quedan desfasados: el dato del 21,1 % en /agentes-ia/ y el "8 de 10 empresas en España todavía no usan IA · INE, 2025" de la portada (`index.html:818`). La portada no es de los agentes GEO: propuesta para Daniel.
