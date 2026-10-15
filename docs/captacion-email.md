# Estrategia de captación por email

La estrategia completa del agente de email, lista antes de enviar el primer correo. No depende del nicho: cuando se elijan los nichos, solo se rellenan sus huecos (sección 4).

Base: el estudio de mercado del 15/10/2026 (`scratch/reports/Estrategia email en frío PEBAI.md`, fuera del repo). Este manual lo mantiene el chat de Captación por email.

---

## 1. La idea en una frase

**Escribimos solo cuando tenemos un motivo real, preguntamos algo que se contesta en una palabra y pedimos permiso antes de enseñar nada.**

Tres piezas, en este orden: **Motivo → Pregunta → Permiso**.

- **Motivo:** un hecho verdadero y comprobable de *su* negocio, detectado por el scraper (tienen anuncios activos, buscan recepcionista, sus reseñas dicen que cuesta contactarlos…). Es lo que nos separa del ruido de agencias de IA y vendedores de Kit Digital. El dueño lo lee y sabe que no es un correo masivo.
- **Pregunta:** sobre un momento concreto de su día a día que les duele, y que se contesta con una palabra o un número.
- **Permiso:** no enseñamos nada sin que lo pidan. "He grabado un vídeo de un minuto sobre lo que pasa con [momento del sector]. ¿Te lo mando?". Solo cuando dicen "sí" llega la oferta. El vídeo es **por nicho** (Daniel graba uno por sector), así que no prometemos uno hecho para su empresa. **No vendemos webs**: el vídeo habla de cómo se atiende a los clientes, nunca de su página.

Por qué así:

1. **Ley.** La LSSI prohíbe el email comercial no pedido, también a empresas. Un email que no vende y solo pide permiso es lo más defendible que hay (la AEPD archivó un caso así: E/06110/2012). Si promociona, perdemos esa defensa.
2. **Mercado.** El email de venta en frío ya da alrededor del 0,45 % de respuestas y baja cada año. Lo que sube la respuesta es escribir por un motivo real y en el momento (entre 3 y 5 veces más, según varias fuentes; cifras de proveedores) y pedir poco.
3. **Dominio.** Enviamos desde Hostinger, sin dominio aparte. Un email corto, humano y sin venta es el que menos quejas genera, y las quejas son lo único que de verdad nos puede tumbar.

## 2. Reglas que no se rompen

1. Nunca se escribe sin **motivo verificable**, salvo en la cola de baja prioridad (sección 3.3).
2. Como mucho **dos emails** por empresa (el primero y un recordatorio). Si no contesta, no se le vuelve a escribir por email.
3. **Una persona por empresa** y **un solo canal a la vez**: si está en la cola de WhatsApp, no entra en la de email, y viceversa. Entre canales hay que esperar 30 días.
4. En los dos emails **no aparece**: servicios, "IA", "automatización", resultados, cifras de ahorro, casos de clientes, "gratis", "consultoría", "plazas", precios, enlaces, imágenes, firma con logo ni píxel de seguimiento.
5. **Nunca fingir** un contacto anterior: nada de "Re:" en el primer email, "como hablamos" o "no me acordaba de…". Tampoco hacernos pasar por clientes para probarles.
6. Siempre decir **quién escribe y de dónde sacamos su email**, y ofrecer dejar de escribir. La baja es **para siempre y para todos los canales**.
7. Solo emails que la empresa **publica en su web** como contacto. Nada de listas compradas ni emails adivinados.
8. Si dudamos de que algo sea verdad, no se escribe.

## 3. El motivo real: la biblioteca de señales

El scraper detecta señales; cada una trae su frase de motivo y su pregunta. Las frases son de ejemplo: el texto final se ajusta al nicho y se prueba con A/B.

### 3.1 Señales, por orden de prioridad

| # | Señal | Dónde se ve | Validez | Frase de motivo (ejemplo) | Pregunta (ejemplo) |
|---|---|---|---|---|---|
| 1 | **Anuncios activos** pidiendo contactos o presupuestos | Biblioteca de anuncios de Meta (pública) | Mientras siga activo | He visto que tenéis anuncios activos en Facebook pidiendo presupuestos de [producto]. | Cuando os entra una solicitud de esos anuncios un sábado por la tarde, ¿la llamáis ese día o el lunes? |
| 2 | **Oferta de empleo** de recepción, atención al cliente o comercial interno | InfoJobs, Indeed (respetando sus condiciones) | 30 días | He visto que estáis buscando a alguien para atención al cliente en [ciudad]. | Mientras encontráis a esa persona, ¿quién atiende las consultas que llegan por la tarde? |
| 3 | **Reseñas recientes** que dicen que cuesta contactarlos | Ficha de Google | 90 días | Leyendo vuestra ficha de Google he visto que varias reseñas recientes comentan que cuesta contactar por teléfono, algo muy habitual cuando hay mucho trabajo. | ¿Os pasa más por volumen de llamadas o por el horario? |
| 4 | **Apertura o nueva sede** | Ficha de Google nueva, su web, prensa local | 60 días | He visto que habéis abierto en [ciudad]. Enhorabuena. | ¿Las consultas de los dos sitios las lleva la misma persona? |
| 5 | **Sin atención fuera de horario**: solo formulario o teléfono, sin chat ni WhatsApp, horario corto (es una señal de atención al cliente, no de su página) | Su web | 90 días (se revisa) | He visto que, fuera de horario, la única forma de contactar con vosotros es un formulario. | Si alguien lo rellena a las diez de la noche, ¿cuándo le contesta alguien? |

Cómo se usan:

- **Reseñas:** siempre en agregado ("varias reseñas"), nunca el nombre del autor ni citas literales. En negocios de salud no se usan las que hablen de salud.
- **Tono:** constructivo, nunca "tu negocio va mal". La señal es la excusa para una pregunta, no una acusación.
- **Velocidad:** una señal nueva se aprovecha en las primeras 48 horas laborables. El motivo pierde fuerza con cada día que pasa.
- **Prioridad de la cola:** varias señales a la vez > señal reciente > señal antigua > sin señal.

### 3.2 Cada señal, comprobada

Cada señal se guarda con su URL y su fecha. Antes de enviar, el motor comprueba que no ha caducado. El email tiene que ser verdad el día que se envía: si los anuncios ya no están activos, no se dice que lo están.

### 3.3 Sin señal: la cola de baja prioridad

Si una empresa encaja pero no tiene señal, entra al final de la cola con un motivo de sector, que debe seguir siendo verdad ("He visto [empresa] buscando [sector] en [ciudad]"). Solo se usan cuando no quedan empresas con señal. Así medimos cuánto aporta la señal (es el primer experimento, sección 8).

## 4. El email

### 4.1 Anatomía

| Pieza | Regla | Longitud |
|---|---|---|
| **Asunto** | 2–4 palabras, en minúsculas, como entre personas. El nombre de la empresa o el motivo. Nada de "oferta", "IA", "gratis", mayúsculas ni signos. | 2–4 palabras |
| **Saludo** | "Hola, [nombre]:" si lo sabemos; si no, "Hola:" | — |
| **Motivo** | La frase de la señal. Primera línea siempre. | 1 frase |
| **Pregunta** | Un momento concreto que les duele. Se contesta con una palabra o un número. | 1 frase |
| **Permiso** | "He grabado un vídeo de un minuto sobre lo que pasa con [momento del nicho]. ¿Te lo mando?" (nunca "sobre vuestra web" ni "sobre vuestra empresa": el vídeo es del sector) | 1–2 frases |
| **Salida y transparencia** | "Tu email lo saqué de vuestra página de contacto. Si no te interesa, dímelo y no vuelvo a escribirte." | 1–2 frases |
| **Firma** | "Daniel" y debajo "PEBAI Systems". Nada más. | 2 líneas |

Total: **50–75 palabras**, en texto plano. Tuteo, sobrio, sin emojis ni exclamaciones (guía de estilo de PEBAI).

### 4.2 Plantilla maestra

```
Asunto: {[empresa]|pregunta sobre [empresa]|[asunto de la señal]}

Hola[, nombre]:

[MOTIVO]

[PREGUNTA]

He grabado un vídeo de un minuto sobre lo que pasa con [MOMENTO]. ¿{Te lo mando|Te lo paso}?

Tu email lo saqué de vuestra página de contacto. Si no te interesa, dímelo y no vuelvo a escribirte.

Daniel
PEBAI Systems
```

`{a|b}` elige una variante al azar: no salen dos emails iguales.

**Ejemplo** (señal de anuncios en un nicho cualquiera de presupuestos):

> Asunto: vuestros anuncios
>
> Hola, Marta:
>
> He visto que tenéis anuncios activos en Facebook pidiendo presupuestos de instalación.
>
> Cuando os entra una solicitud de esos anuncios un sábado por la tarde, ¿la llamáis ese día o el lunes?
>
> He grabado un vídeo de un minuto sobre lo que pasa con una solicitud así hasta que alguien la atiende. ¿Te lo mando?
>
> Tu email lo saqué de vuestra página de contacto. Si no te interesa, dímelo y no vuelvo a escribirte.
>
> Daniel
> PEBAI Systems

### 4.3 El recordatorio

En el **mismo hilo** ("Re:" sí vale aquí, porque el primer email existe), **3 días laborables después**, solo si no ha contestado:

```
Hola[, nombre]:

¿Te lo mando o lo dejo aquí?

Daniel
```

Después, nada más. Las respuestas en el mismo hilo rinden alrededor de un 30 % más que un seguimiento formal (Instantly, dato de proveedor), y a partir del cuarto email las quejas se triplican (Belkins). Con dos emails nos quedamos con la mayor parte del efecto y casi nada del riesgo.

### 4.4 Lo que se rellena al elegir un nicho

Por cada nicho, una ficha de cuatro líneas:

| Hueco | Qué es | Ejemplo |
|---|---|---|
| `[producto]` | Lo que venden, con sus palabras | instalación de placas |
| `[momento]` | De qué trata el vídeo: completa «He grabado un vídeo de un minuto sobre…» (normalmente el instante en que pierden clientes) | lo que pasa con una solicitud que entra el domingo |
| `[pregunta del nicho]` | Su versión de la pregunta, que se contesta con una palabra o un número | De cada diez que os piden precio, ¿con cuántos llegáis a hablar? |
| `[temporada]` | Cuándo escribirles y cuándo no | Piscinas: de enero a marzo, antes de que empiece la temporada |

### 4.5 Nicho 2 (borrador): operadores locales de fibra y comercializadoras pequeñas de luz

Decidido el 15/10/2026 por el chat de WhatsApp y el principal: el **nicho 2 va por email** (y llamada), no por WhatsApp. Por qué ahora: la **Ley 10/2025 de atención a la clientela** obliga a adaptarse **antes del 28/12/2026**, sea cual sea su tamaño (detalle en `docs/captacion-por-que-ahora.md`).

- **Señal `normativa`**, nueva: el motivo es la obligación legal con fecha límite. Caduca sola el **28/12/2026** (columna `motivo_caduca`). Si el scraper trae además una señal propia de la empresa (solo teléfono en horario corto, sin chat…), esa va primero.
- **Ficha `fibra`:**
  - Momento: *lo que pide la ley con las llamadas y cómo llegar a tiempo*.
  - Pregunta del nicho: *Cuando hay una caída y llaman veinte clientes a la vez, ¿cuántos esperan más de tres minutos?*
  - Meses: 10, 11 y 12.
- **Ficha `luz`:**
  - Momento: el mismo que `fibra`.
  - Pregunta del nicho: *Cuando sale una tanda de facturas, ¿cuántas llamadas se os quedan sin atender ese día?*
  - Meses: 10, 11 y 12.
- **Ejemplo** (comercializadora, señal `normativa`, 83 palabras, pasa la revisión):

> Hola:
>
> Antes del 28 de diciembre, las comercializadoras de luz tienen que cumplir la Ley 10/2025 de atención a la clientela, sea cual sea su tamaño.
>
> ¿Tenéis ya medido cuántas llamadas atendéis en menos de tres minutos?
>
> He grabado un vídeo de un minuto sobre lo que pide la ley con las llamadas y cómo llegar a tiempo. ¿Te lo paso?
>
> Tu email lo saqué de vuestra página de contacto. Si no te interesa, dímelo y no vuelvo a escribirte.
>
> Daniel
> PEBAI Systems

**Cuidado antes de lanzarlo:**

1. **El vídeo solo puede enseñar lo que ya podemos demostrar.** PEBAI aún no tiene un agente de voz en producción, así que el vídeo explica la ley y cómo prepararse, y no promete un agente de voz funcionando hasta que exista la demo propia.
2. **El abogado debe confirmar la frase de la ley en telecomunicaciones**: ahí manda su normativa sectorial y la Ley 10/2025 se aplica de forma supletoria. En luz la obligación es directa.
3. **Fecha límite cercana:** para que tenga sentido hay que escribir en octubre y noviembre. Con la subida de 10 a 50 al día, el buzón del frío y el vídeo tienen que estar listos cuanto antes.

## 5. Cuando contestan: predicar con el ejemplo

Vendemos que ningún cliente se quede sin respuesta. **Así que nosotros contestamos en minutos.**

- El motor detecta la respuesta, la marca en el panel y avisa a Daniel al momento (email reenviado y aviso del panel).
- **En horario laboral, respuesta en menos de 15 minutos.** Si alguien contesta "sí" y recibe el vídeo esa misma tarde, ya ha visto el producto funcionando antes de verlo.
- El vídeo es **uno por nicho**, grabado y editado de antemano por Daniel (el mismo que usa el chat de WhatsApp): en un minuto, qué pasa con un cliente del sector que escribe o llama fuera de horario y cómo se resuelve (chatbot o asistente que contesta al momento, filtra y agenda). Lo que vendemos es el servicio: atención automática, aplicaciones a medida, GEO. **Nunca una web.** Como ya está grabado, se manda en minutos.

| Contestan | Qué hacemos |
|---|---|
| "Sí" / "vale, mándalo" | Vídeo al momento. Al enviarlo: "Aquí lo tienes. Si te encaja, en esta página puedes pedir que analicemos vuestro caso; cada mes lo hacemos gratis con cinco empresas: pebaisystems.es/diagnostico/?origen=daniel&utm_source=email" |
| Contestan la pregunta ("el lunes", "con 3 de 10") | "Es lo más habitual. ¿Te mando el vídeo?" Con el "sí", igual que arriba. |
| "¿Qué es esto? / ¿Qué vendéis?" | Ya hay permiso para explicarlo: dos frases sobre qué hacemos y la oferta del vídeo. |
| "¿Cuánto cuesta?" | "Depende de cada caso, por eso primero lo analizamos. Cada mes lo hacemos gratis con cinco empresas: [enlace]". Nunca decir que es gratis para todos. |
| "No" / "no me interesa" / "baja" | "Entendido, no vuelvo a escribirte. Gracias por contestar." Baja para siempre en todos los canales (el motor la aplica solo). |
| "¿De dónde sacasteis mi email?" | "De la página de contacto de vuestra web ([URL]). Te doy de baja ahora mismo." |
| Respuesta automática o fuera de la oficina | No cuenta. Si dice cuándo vuelve, el recordatorio se envía después de esa fecha. |
| Rebote | Email inválido y fuera de la lista para siempre. |

## 6. A quién: los nichos

Los nichos se eligen con datos y son los mismos para WhatsApp y email: los puntúa y valida `docs/captacion-nichos.md` (criterios fijos, 17 nichos, prueba real antes de grabar vídeos). Este manual no los duplica.

Filtro propio del email, encima de esa puntuación: el nicho tiene que tener **web propia con email publicado** en la mayoría de empresas. Si no, va a WhatsApp, no a email.

Para el piloto, **un solo nicho** y una o dos zonas. Así medimos limpio.

## 7. Ritmo, buzón y entrega

- **Buzón propio para el frío**, separado de `equipo@` y del embudo: mejor en un subdominio (p. ej. `daniel@hola.pebaisystems.es`). Si un día lo bloquean, no caen los avisos de solicitudes ni los recordatorios de cita. El subdominio protege bastante, aunque no del todo.
- **Subida de volumen**, solo si la semana anterior salió limpia (rebotes < 2 %, cero quejas, ningún aviso de Hostinger):

| Semana | Emails al día (recordatorios incluidos) |
|---|---|
| 1 | 10 |
| 2 | 20 |
| 3 | 35 |
| 4 en adelante | 50 |

- **Horario:** de lunes a viernes, de 9:00 a 13:30 y de 16:00 a 18:30, uno a uno, con pausas al azar. Más volumen de martes a jueves por la mañana, que es la franja con más respuestas (Belkins).
- **Calendario:** nada en agosto, del 20 de diciembre al 7 de enero, Semana Santa ni festivos nacionales. Además, la temporada de cada nicho (sección 4.4).
- **Antes de cada envío**, comprobación automática:
  - El email es de su web, la sintaxis es válida, el dominio tiene servidor de correo y no es una dirección del tipo noreply@.
  - No tiene baja en ningún canal, no está en el embudo y no ha recibido otro canal en 30 días.
  - La señal sigue vigente.
  - El texto no contiene palabras prohibidas y mide entre 50 y 75 palabras.
  - El nombre de la empresa está limpio (sin "S.L.").
- **Cabecera de baja con un clic** (`List-Unsubscribe` con email y página de baja propia) y la frase de baja en el texto: que se den de baja en vez de marcar spam.
- **Frenos automáticos:**
  - Rebotes > 3 % en los últimos 50 envíos → pausa.
  - Una queja de spam → pausa.
  - Aviso de Hostinger → pausa.

  Cada freno avisa a Daniel. Se reanuda a mano después de revisar.
- **Prueba de bandeja** antes de empezar y cada semana: un envío a cuentas propias de Gmail, Outlook y Yahoo para ver si llega a la bandeja principal.

## 8. Medir y mejorar

- **La métrica que manda:** diagnósticos rellenados por cada 100 empresas contactadas. Las respuestas, de por sí, no pagan facturas.
- **Indicadores semanales:** tasa de respuesta, "síes" al vídeo, bajas (< 2 %), quejas (0), rebotes (< 2 %).
- **Objetivo del piloto:** ≥ 5 % de respuestas y ≥ 2 % de "síes". Es ambicioso frente a la media, pero razonable con señal y pidiendo tan poco. Lo diremos con nuestros datos, no con los de nadie.
- **Experimentos, de uno en uno**, con al menos 100 envíos por variante:
  1. Con señal o sin señal (¿cuánto vale el motivo real?).
  2. Pregunta A o pregunta B.
  3. Oferta: vídeo de un minuto o informe de una página con tres puntos sobre cómo atienden hoy a sus clientes.
  4. Asunto.

  Se queda la que gane y se prueba otra contra ella. Siempre hay una prueba en marcha.
- Si tras 1.000 envíos el resultado es pobre, se cambia la oferta o el nicho antes que el texto: el fallo suele estar en la oferta.

## 9. Kit legal (antes de lanzar)

- **Hoja de interés legítimo:** por qué escribimos, a quién, de dónde sale el dato, cómo se da de baja y por qué no les perjudica. Escrita y guardada.
- **Origen de cada email** guardado (URL y fecha). Se dice en el propio email.
- **Registro de bajas** compartido con WhatsApp, para siempre.
- **Revisión de un abogado** de la plantilla maestra y del recordatorio. Es barato y convierte la zona gris en una decisión documentada.
- No es asesoramiento jurídico: es la interpretación más prudente que permiten la ley y la doctrina encontradas.

## 10. Lo que no hacemos nunca

- Enviar sin motivo cuando hay empresas con señal en la cola.
- Vender, enlazar o hablar de IA en los dos primeros emails.
- Más de dos emails a quien no contesta.
- Fingir un contacto anterior o hacernos pasar por clientes.
- Usar emails personales que el negocio no publica, listas compradas o emails adivinados.
- Enviar desde `equipo@` o desde el buzón del embudo.
- Subir el volumen con quejas o rebotes en la semana anterior.

## 11. Puesta en marcha

| Fase | Qué | Para avanzar |
|---|---|---|
| **0. Cimientos** | Buzón del frío, DNS revisado, motor y panel (funcional), plantilla maestra, hoja de interés legítimo, prueba de bandeja | Todo comprobado con envíos de prueba a cuentas propias |
| **1. Piloto** (2 semanas) | Un nicho, 10 al día y luego 20, solo empresas con señal | Rebotes < 2 %, cero quejas, ≥ 3 % de respuestas |
| **2. Subida** (semanas 3–6) | Hasta 50 al día; experimentos 1 y 2 | ≥ 1.000 envíos medidos |
| **3. Escala** | Segundo nicho y experimentos 3 y 4 | Coste por diagnóstico estable o bajando |

## Fuentes

Las del estudio de mercado (`scratch/reports/Estrategia email en frío PEBAI.md`). Las principales:

- AEPD: [E/06110/2012](https://www.aepd.es/es/documento/e-06110-2012.pdf), [AI/00388/2022](https://www.aepd.es/documento/ai-00388-2022.pdf); [LSSI](https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758)
- [Belkins 2025-2026](https://belkins.io/blog/cold-email-response-rates) · [Instantly 2026](https://instantly.ai/cold-email-benchmark-report-2026) · [Hunter](https://hunter.io/blog/cold-email-word-count)
- [Nick Abraham (Leadbird)](https://discoveredlabs.com/podcast/he-sends-1-5m-cold-emails-per-month-here-s-what-works-in-2025) · [Eric Nowoslawski](https://www.antoinebuteau.com/lessons-from-eric-nowoslawski.md) · [Método de Josh Braun](https://www.11x.ai/guides/josh-braun-cold-outreach-method)
- [Outreach por señales (RevBoss)](https://revboss.com/blog/2026-trigger-based-outreach-playbook)
- Hostinger: [límites](https://www.hostinger.com/support/4625828-parameters-and-limits-of-hostinger-email), [envíos masivos](https://www.hostinger.com/support/1583510-can-i-send-mass-mail) · [Gmail: requisitos de remitentes](https://support.google.com/a/answer/81126)
