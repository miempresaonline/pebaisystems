# Borrador · /ia-para-empresas/compraventas/

Estado: **texto completo el 2/11/2026 (turno de las 15:00, geo_contenido). No se publica esta semana** (encargo del Vigía 2/11, propuesta 1, y Preguntas 2/11). Falta: maquetar con `portar_diseno_nuevo.py` cuando el Jefe le dé fecha y el OK de Daniel a los nichos. Sin las líneas «Pregunta real» (son notas internas).

## Ficha

- **URL:** `https://pebaisystems.es/ia-para-empresas/compraventas/` (vertical de automoción, nicho 3 de `docs/geo/estrategia-nichos.md`)
- **Title (≤ 60):** `IA para compraventas e importadores de coches | PEBAI` (53)
- **Meta description (≤ 155):** `Cómo usa la IA una compraventa o importadora de coches: contestar al momento por WhatsApp, agendar visitas, revisar en remoto y explicar la garantía.` (149)
- **H1:** `¿Cómo puede usar la IA una compraventa o importadora de coches?`
- **Autor:** Daniel Peñuela Ruiz (`#daniel`).
- **CTA:** `/consultoria-gratuita/?cta=pilar_ia-para-empresas-compraventas`
- **Breadcrumb:** Inicio › IA para empresas › Compraventas de coches

### Anticanibalización (comprobado el 2/11 con `dist/sitemap.xml`, 18 URLs, y `dist/`)
- No hay nada de automoción, compraventas ni importadores en el sitemap, en `dist/` ni en `.htaccess`, salvo los dos casos de Fran García Cars.
- **Frente a `/agentes-ia/whatsapp/`:** allí, el agente de WhatsApp para cualquier pyme de servicios (app frente a API, plantillas de Meta, CRM, medición, precio). Aquí, solo lo propio de vender coches: qué pregunta el interesado en un coche concreto, qué contesta solo el asistente y qué una persona, cómo se agenda la visita o la prueba, la garantía de segunda mano y los portales. Lo técnico de WhatsApp se resume en una frase y se enlaza allí (plantillas en el H2 de seguimiento, precio en la FAQ).
- **Frente a `/casos-de-exito/fran-garcia-cars/` y `/casos-de-exito/fran-garcia-cars-whatsapp/`:** los casos cuentan lo que se hizo para un cliente. Aquí el caso es una prueba dentro de un H2 (revisión remota) y una frase en el de respuesta rápida, con enlace a cada ficha. Intención distinta: «qué hace la IA en mi compraventa» frente a «qué le hicisteis a Fran García».
- **Frente a `/ia-para-empresas/cuanto-cuesta/`:** el precio se responde con enlace, sin cifras.
- Un solo satélite por nicho (regla del Jefe 29/10): importación y compraventa van en la misma página.

### Fuentes verificadas (2/11/2026)
1. **DGT**, «Usados importados: ¿compramos lo viejo?», noticia del 27/07/2026: https://www.dgt.es/comunicacion/noticias/20260727-usados-importados-compramos-lo-viejo/ . Abierta el 2/11 [V]. Texto: primer trimestre de 2026, «aproximadamente el 11 % (55.241 unidades) del total de las nuevas matriculaciones en España se correspondían con vehículos usados, con una media de edad de 10,5 años»; «el 86,6 %» de la UE, «Alemania a la cabeza, de donde proceden el 44,1 %». Ojo: más abajo la misma página dice «alrededor de 59.000». Se cita solo la frase con 55.241 y el 44,1 %.
2. **Texto refundido de la Ley General para la Defensa de los Consumidores y Usuarios** (RDL 1/2007, BOE-A-2007-20555, última actualización publicada el 28/02/2026), **art. 120.1**: el empresario responde de las faltas de conformidad que se manifiesten en **tres años** desde la entrega; «en los bienes de segunda mano, el empresario y el consumidor o usuario podrán pactar un plazo menor […], que no podrá ser inferior a un año desde la entrega». **Art. 121.1**: se presume que la falta de conformidad ya existía si aparece en los **dos años** siguientes a la entrega; en segunda mano se puede pactar un plazo menor, nunca inferior al de responsabilidad pactado. Leído en boe.es el 2/11 [V]: https://www.boe.es/buscar/act.php?id=BOE-A-2007-20555#a120 (cambia la limitación de `preguntas.md`: ya se pueden dar los plazos, como resumen y no asesoramiento).
3. **Reglamento (UE) 2024/1689, art. 50** (avisar de que se habla con una IA, desde el 2/08/2026): ya citado en `/agentes-ia/#ley`; enlazar allí y a https://eur-lex.europa.eu/eli/reg/2024/1689/oj?locale=es .
4. **RGPD**, Reglamento (UE) 2016/679: https://eur-lex.europa.eu/eli/reg/2016/679/oj?locale=es (mismo uso que en `/agentes-ia/`: informar, pedir solo lo necesario, encargado del tratamiento).
5. **Caso Fran García Cars:** solo los datos de `docs/geo/borradores/casos.md` (panel de la app, año 2026, captura del 22/10/2026). No usar «unos 60 coches al mes» (sale en la ficha publicada, pero no está en `casos.md`).
6. Preguntas reales: `docs/geo/preguntas.md` («Turno 2/11 (compraventas)», 6 preguntas) y `docs/geo/sectores/automocion-importadores.md` (Vigía 2/11).

**No se usa (sin verificar o de parte):** cifras de proveedores de chatbots (Sinch, leadsales, cuedesk), el ~80 % de registros de daños de Motor.es (dato de empresas de datos, no verificado), costes de importación de Carwow y Race, Plan Auto+ (BOE no abierto), datos de MSI y Ganvam (secundarios). Tampoco se dice que haya integración con portales.

## Esquema

1. Migas, H1, autor, «Actualizado el …».
2. Respuesta corta (40-60 palabras) + resumen en 5 viñetas + 3 accesos.
3. 6 H2 (abajo), FAQ (6), puente, fuentes con fecha y próxima revisión.
4. JSON-LD: WebPage, BreadcrumbList, Article (autor `#daniel`, `about` automoción), FAQPage con las 6 FAQ idénticas a las visibles.

---

## Texto

**Respuesta corta.** En una compraventa o importadora, la Inteligencia Artificial (IA) trabaja alrededor de cada coche: contesta al momento por WhatsApp si sigue disponible y sus kilómetros, agenda la visita o la prueba en vuestra agenda, ordena las fotos y el expediente de la revisión y explica la garantía con un texto que habéis aprobado. El precio final lo negocia una persona.

(58 palabras; primera mención de IA escrita completa)

**En cinco puntos:**
- La venta se pierde antes de enseñar el coche: quien pregunta por un anuncio y no recibe respuesta pregunta por otro.
- Un asistente puede contestar solo lo que está en la ficha del coche (disponibilidad, kilómetros, año, horario, dónde está) y pasa a una persona lo demás.
- En importación, lo que más tiempo ahorra es ordenar la revisión remota: fotos, comprobaciones y aprobación en un expediente que el cliente puede ver.
- La garantía se explica siempre con el mismo texto, revisado por vosotros: la ley fija tres años para un profesional y permite pactar uno como mínimo en segunda mano.
- Para una compraventa pequeña, el primer paso es contestar fuera de horario y no perder mensajes, no montar un sistema grande.

**Accesos:** Contestar al momento (#respuesta-rapida) · Qué contesta solo el asistente (#que-contesta) · Revisión remota (#revision-remota)

### H2 · ¿Cómo contesto rápido a cada interesado en un coche? {#respuesta-rapida}

Pregunta real: «¿Cuánto tarda un interesado en irse a otro anuncio si no le contesto en el momento?» (`preguntas.md`, 2/11).

Quien pregunta por un coche de segunda mano casi nunca pregunta solo a un vendedor. Escribe a varios anuncios parecidos y se queda con el primero que le contesta claro. Por eso el problema de una compraventa no suele ser vender, sino que el primer mensaje llegue un sábado por la tarde o mientras estáis enseñando otro coche.

Un asistente de WhatsApp con la información de vuestro stock lo resuelve con un flujo corto:

1. **Primera respuesta en el momento.** Confirma si el coche sigue disponible y contesta lo que está en la ficha: kilómetros, año, combustible, cambio, dónde se puede ver.
2. **Siguiente paso concreto.** Ofrece ver el coche, hacer una prueba o una videollamada, en vez de dejar la conversación en «gracias, ya te digo».
3. **Agenda sin llamadas de ida y vuelta.** Propone dos o tres huecos de vuestra agenda, el cliente elige uno y el asistente lo confirma y lo apunta. Si ninguno encaja o pide algo fuera de lo normal, pasa la conversación a una persona.
4. **Aviso al vendedor.** Quien lleva ese coche recibe la cita con el resumen de lo hablado, sin tener que leer toda la conversación.
5. **Recordatorio.** El día antes, un mensaje con la hora y la dirección. Menos visitas a las que no viene nadie.

Así lo hace el asistente de Fran García Cars, importadora de vehículos: responde las preguntas frecuentes con la información de la empresa, agenda citas y deriva a una persona cuando la consulta no está documentada. El equipo gestiona las conversaciones desde un panel ([ver el caso](/casos-de-exito/fran-garcia-cars-whatsapp/)).

Cómo se monta un agente de WhatsApp (app o API oficial, qué preparar, plantillas): [agente de IA para WhatsApp](/agentes-ia/whatsapp/).

### H2 · ¿Qué puede contestar solo el asistente y qué tengo que contestar yo? {#que-contesta}

Pregunta real: «¿Qué le puede contestar solo un asistente (si el coche sigue disponible, km, horario) y qué tengo que contestar yo?» (`preguntas.md`, 2/11).

La regla es sencilla: el asistente contesta lo que está escrito y aprobado; lo que se negocia o depende del coche concreto, una persona.

| Lo contesta el asistente | Lo contesta una persona |
|---|---|
| Si el coche sigue disponible | El precio final y cualquier rebaja |
| Kilómetros, año, combustible, cambio y equipamiento de la ficha | La tasación de un coche que el cliente quiere dejar a cambio |
| Horario, dirección y cómo llegar | Financiación y condiciones de pago concretas |
| Qué documentación entregáis con el coche | Reclamaciones y averías después de la venta |
| La garantía, con el texto que habéis aprobado | Cualquier pregunta que no esté en vuestra información |
| Agendar visita, prueba o videollamada | Reservar el coche con señal |

Dos condiciones para que funcione. La ficha de cada coche tiene que estar al día: si el asistente dice que un coche está disponible y se vendió ayer, el cliente se enfada con razón. Y cuando no sabe algo, lo dice y pasa la conversación a una persona, en vez de inventar.

Además, desde el 2 de agosto de 2026 el cliente tiene que saber que habla con una IA, salvo que sea evidente (artículo 50 del [Reglamento europeo de IA](https://eur-lex.europa.eu/eli/reg/2024/1689/oj?locale=es)). Basta con decirlo en el primer mensaje. Más detalle en [qué dice la ley sobre los agentes de IA](/agentes-ia/#ley).

### H2 · ¿Cómo se hace una revisión remota antes de importar un coche? {#revision-remota}

Pregunta real: «¿Merece la pena importar un coche de Alemania sin verlo?» y «¿Cómo evito defectos ocultos y kilómetros manipulados?» (`sectores/automocion-importadores.md`, 2/11).

Alemania es el primer origen de los usados que se importan a España: el 44,1 %, según la DGT, que cuenta 55.241 usados importados matriculados en el primer trimestre de 2026, con una edad media de 10,5 años ([DGT, 27/07/2026](https://www.dgt.es/comunicacion/noticias/20260727-usados-importados-compramos-lo-viejo/)). Son coches con años y kilómetros, comprados a cientos de kilómetros. El cliente quiere saber qué compra antes de pagar.

Una revisión remota bien hecha se parece más a un expediente que a un carrusel de fotos:

1. **Un expediente por coche**, con el bastidor, los datos del anuncio y el cliente que lo encarga.
2. **Fotos y comprobaciones por apartados** (carrocería, interior, motor, bajos, documentación), hechas por un revisor y guardadas en su sitio, no sueltas en un chat.
3. **Aprobación técnica**: una persona con criterio decide si el coche es apto o se descarta, y lo deja escrito.
4. **El cliente lo ve todo en un mismo lugar**, ordenado, y puede decidir sin viajar.

La Inteligencia Artificial ayuda en partes concretas, como leer datos de documentos o fotos y avisar de lo que falta. La decisión de si un coche es apto sigue siendo de una persona.

**Caso real.** Fran García Cars hacía las revisiones a mano y las fotos iban por WhatsApp, desordenadas: había líos con los clientes y se perdía mucho tiempo. Le hicimos una aplicación con todo el flujo (expedientes, fotos, revisores, aprobación técnica, licitaciones y pujas) y lecturas automáticas con IA en parte del proceso. En el panel de 2026 (captura del 22/10/2026): 400 unidades aprobadas y 9 descartadas, 62.370 fotos registradas y un tiempo medio de peritaje de 29,3 horas. Hoy es una de sus principales herramientas de trabajo ([ver el caso](/casos-de-exito/fran-garcia-cars/)).

Cómo se automatiza un proceso así paso a paso: [automatización de procesos](/automatizacion-de-procesos/).

### H2 · ¿Qué garantía tengo que dar y cómo la explico por WhatsApp? {#garantia}

Pregunta real: «¿Qué garantía tengo que dar si vendo como profesional y cómo lo explico en el chat sin liarme?» (`preguntas.md`, 2/11).

Si vendéis como profesional a un particular, respondéis de los defectos que aparezcan en los **tres años** siguientes a la entrega. En coches de segunda mano podéis pactar con el comprador un plazo menor, pero **nunca inferior a un año** (artículo 120.1 de la [Ley General para la Defensa de los Consumidores y Usuarios](https://www.boe.es/buscar/act.php?id=BOE-A-2007-20555#a120)). Además, se presume que un defecto que aparece en los dos primeros años ya estaba al entregar el coche, salvo prueba en contrario; en segunda mano ese plazo también se puede acortar, sin bajar del que hayáis pactado (artículo 121.1). Entre particulares, esta garantía no se aplica.

En el chat, lo que más problemas da es improvisar. Por eso:

- **Un texto fijo de garantía**, escrito y revisado por vosotros (y por vuestro asesor si hace falta), que el asistente da siempre igual.
- **El plazo pactado, por escrito en el contrato.** El chat lo resume; el contrato manda.
- **Las reclamaciones, siempre a una persona.** El asistente recoge los datos (coche, fecha de entrega, qué falla y fotos) y avisa; no acepta ni rechaza nada.

Esto es un resumen para orientarte, no asesoramiento legal.

### H2 · ¿Cómo hago el seguimiento de quien pregunta y deja de contestar? {#seguimiento}

Muchos interesados preguntan, reciben respuesta y desaparecen. No siempre han comprado en otro sitio: a veces se les ha pasado. El seguimiento manual se queda sin hacer porque nadie se acuerda de a quién escribir.

Un sistema sencillo hace tres cosas:

1. **Cada conversación queda registrada** con el coche por el que preguntó y en qué punto se quedó.
2. **Un recordatorio para el vendedor**, o un mensaje de seguimiento aprobado, a los pocos días.
3. **Aviso cuando el coche cambia**: si baja de precio o se reserva, quien preguntó por él lo sabe.

En WhatsApp, pasadas 24 horas desde el último mensaje del cliente solo se puede escribir con plantillas aprobadas por Meta; cuáles hacen falta está en [mensajes fuera de las 24 horas](/agentes-ia/whatsapp/). Y para escribir con fines comerciales hace falta que el cliente lo haya aceptado: pedir solo los datos necesarios y decirle para qué se usan ([RGPD](https://eur-lex.europa.eu/eli/reg/2016/679/oj?locale=es)).

**Los portales.** Muchos contactos entran por los portales de anuncios de coches, cada uno con su propia mensajería. Lo prudente es no prometer que todo se conecta: cada portal tiene sus condiciones. Lo que sí se puede hacer es que todo mensaje que llegue a vuestro WhatsApp quede registrado y con un responsable, y que el anuncio invite a escribir allí para concertar la visita.

### H2 · ¿Cuándo no merece la pena? {#cuando-no}

Pregunta real: «¿Merece la pena para una compraventa pequeña con pocos coches en stock?» (`preguntas.md`, 2/11).

No hace falta un asistente si contestáis siempre en el momento, tenéis pocos mensajes al día y nadie se queda sin respuesta. Con plantillas de respuesta rápida en WhatsApp Business puede bastar.

Merece la pena mirarlo cuando pasa alguna de estas cosas:

- Os escriben fuera de horario y contestáis al día siguiente.
- Se pierden mensajes o nadie sabe quién llevaba a un cliente.
- Pasáis horas contestando lo mismo (si sigue disponible, kilómetros, horario).
- En importación, las fotos y las revisiones viajan por chats y correos sin orden.

Y no conviene si las fichas de los coches no están al día: el asistente contestaría con datos viejos. Primero, ordenar el stock.

---

## FAQ (6, idénticas en el JSON-LD)

**1. ¿Qué pasa si un interesado escribe por un coche y nadie le contesta en el momento?**
Lo normal es que pregunte por otros anuncios parecidos y se quede con el que le conteste antes y más claro. Un asistente de WhatsApp contesta al instante si el coche sigue disponible y sus datos básicos, ofrece una visita o una prueba, y una persona toma la conversación después.

**2. ¿Qué puede contestar solo un asistente de IA en una compraventa?**
Lo que está escrito en la ficha del coche y en vuestra información: si sigue disponible, kilómetros, año, combustible, equipamiento, horario, dirección, documentación y la garantía con un texto aprobado. También puede agendar visitas. El precio final, las rebajas, la tasación de un coche a cambio y las reclamaciones las lleva siempre una persona.

**3. ¿Qué garantía tiene que dar una compraventa al vender un coche usado?**
Si vende como profesional a un particular, responde de los defectos que aparezcan en los tres años siguientes a la entrega. En segunda mano se puede pactar por escrito un plazo menor, nunca inferior a un año (artículo 120.1 de la Ley General para la Defensa de los Consumidores y Usuarios). Es un resumen, no asesoramiento legal.

**4. ¿Cómo es una revisión remota de un coche antes de importarlo?**
Un revisor comprueba el coche por apartados y lo documenta con fotos en un expediente; una persona con criterio lo aprueba o lo descarta, y el cliente ve todo ordenado antes de pagar. En el caso de Fran García Cars, la aplicación registra 62.370 fotos y 400 unidades aprobadas en 2026.

**5. ¿El asistente se conecta con los portales de anuncios de coches?**
Depende de cada portal y de sus condiciones, así que no lo damos por hecho. Lo que sí se hace es que todo mensaje que llega a vuestro WhatsApp quede registrado y con un responsable, y que el anuncio invite a escribir por allí para concertar la visita.

**6. ¿Cuánto cuesta un asistente de IA para una compraventa?**
Depende de la empresa: cuántos coches movéis, qué canales usáis y con qué programas hay que conectarlo. Se presupuesta después de la consultoría gratuita, que es para cinco empresas al mes y después de pago. Qué influye en el precio: [cuánto cuesta implantar IA](/ia-para-empresas/cuanto-cuesta/).

---

## Puente final

**¿Tu compraventa pierde interesados por no contestar a tiempo?** En 25 minutos de videollamada vemos dónde se os van los clientes (mensajes, visitas, revisiones) y qué conviene automatizar primero. La consultoría es gratuita para cinco empresas al mes; cuando se completan, pasa a ser de pago.

Botón: «Solicitar 1 de las 5 plazas (0 €)» → `/consultoria-gratuita/?cta=pilar_ia-para-empresas-compraventas`

## Fuentes (visibles, con fecha)

- DGT, «Usados importados: ¿compramos lo viejo?», 27/07/2026. Consultada el 2/11/2026.
- Real Decreto Legislativo 1/2007, texto refundido de la Ley General para la Defensa de los Consumidores y Usuarios, arts. 120 y 121 (BOE-A-2007-20555, última actualización publicada el 28/02/2026). Consultado el 2/11/2026.
- Reglamento (UE) 2024/1689 de Inteligencia Artificial, art. 50. Consultado el 2/11/2026.
- Reglamento (UE) 2016/679 (RGPD). Consultado el 2/11/2026.
- Caso Fran García Cars: datos del panel de la aplicación, año 2026, captura del 22/10/2026.

Próxima revisión: 2/02/2027 (o antes si cambia la garantía o el Reglamento de IA).

## Enlaces internos (todos existen el 2/11, comprobado en `dist/sitemap.xml`)

Salientes: `/agentes-ia/whatsapp/`, `/agentes-ia/#ley`, `/automatizacion-de-procesos/`, `/ia-para-empresas/cuanto-cuesta/`, `/casos-de-exito/fran-garcia-cars/`, `/casos-de-exito/fran-garcia-cars-whatsapp/`, `/consultoria-gratuita/`.
Entrantes al publicar: desde `/ia-para-empresas/` («Guías de PEBAI por área»), desde `/agentes-ia/whatsapp/` (H2 del caso Fran García: «cómo se aplica en una compraventa») y desde las dos fichas de Fran García Cars.
