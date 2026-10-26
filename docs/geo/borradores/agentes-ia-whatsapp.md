# Borrador · /agentes-ia/whatsapp/

Estado: **borrador completo, listo para maquetar** (26/10/2026, turno de tarde de geo_contenido). Subpilar 1 de P3 en `docs/geo/pilares.md`. Responde a P6 y P10 del set (hoy los ocupan blogs de herramientas y Aunoa, sin caso español de una pyme de servicios).

## Ficha

- **URL:** `https://pebaisystems.es/agentes-ia/whatsapp/`
- **Title (≤ 60):** `Agente de IA para WhatsApp en pymes de servicios | PEBAI`
- **Meta description (≤ 155):** `Cómo automatizar la atención por WhatsApp de una empresa de servicios con un agente de IA: qué necesitas de Meta, qué preparar, cómo medirlo y un caso real.`
- **H1:** `Cómo automatizar el WhatsApp de una empresa de servicios con un agente de IA`
- **Autor:** Daniel Peñuela Ruiz (`https://pebaisystems.es/#daniel`), como /agentes-ia/ (el caso Fran García Cars es suyo).
- **Fecha visible y dateModified:** el día que se publique.
- **CTA:** `/consultoria-gratuita/?cta=pilar_agentes-ia-whatsapp`
- **Palabras:** "bot whatsapp" (480, kd 27), "chatbot whatsapp" (390), "whatsapp ia" (170), "chatbot whatsapp business" (90), "automatizar whatsapp" (70, kd 13), "agente ia whatsapp" (50, kd 13). Conversacionales: P6 «agencia para implantar un chatbot con IA en mi empresa» y P10 «automatizar la atención por WhatsApp de una empresa de servicios con IA».
- **301 al publicar:** `agente-ia-whatsapp-business-api-empresas` → `/agentes-ia/whatsapp/` (sacarlo de la lista 302 de `.htaccess:73` y añadir la regla 301 junto a las demás). Probar con `curl -I`.

### Anticanibalización (comprobado el 26/10)
- Sitemap y carpetas: `/`, `/consultoria-gratuita/`, `/posicionamiento-en-ia/`, `/agentes-ia/`, `/ia-para-empresas/`, `/automatizacion-de-procesos/`. No existe `dist/agentes-ia/whatsapp/`.
- **/agentes-ia/ se queda con el resumen** de WhatsApp: las 4 reglas de Meta, la tabla de lo que cobra Meta, la ley (art. 50 y RGPD), el coste en general y «cómo elegir quién lo implanta». Esta página **no repite** esas secciones: las resume en una línea y enlaza. Lo nuevo aquí es el detalle práctico para una pyme de servicios: app frente a plataforma y coexistencia, qué preparar, cómo es una conversación, plantillas útiles, límites de envío, cómo se mide, errores frecuentes y el caso de Fran García Cars contado entero.
- Al publicar, en /agentes-ia/ cambiar el «Próximamente» de «Agente de IA para WhatsApp» por el enlace a esta página, y enlazarla en contexto desde el H2 «Agentes de IA en WhatsApp».
- Con /automatizacion-de-procesos/: aquí la conversación con el cliente; allí lo interno (la app de revisiones de Fran García Cars se menciona y se enlaza allí si hace falta, sin contarla otra vez).

### Fuentes verificadas (26/10/2026)

| Dato | Fuente | Comprobado |
|---|---|---|
| Ventana de servicio de 24 h que se reinicia con cada mensaje del cliente; fuera, solo plantillas. Desde el 1/10/2026: 1.000 mensajes de servicio gratis al mes por número, luego se cobran; las plantillas de utilidad dentro de la ventana se cobran. Ventana gratuita de hasta 7 días si el cliente llega desde un anuncio que abre WhatsApp (app de Android o iOS) | Meta, precios de WhatsApp Business Platform. https://developers.facebook.com/docs/whatsapp/pricing/ | WebFetch 26/10 (coincide con lo publicado en /agentes-ia/) |
| Plantillas: marketing, utilidad y autenticación. Utilidad = la provoca una acción o petición del cliente, sin promoción. Si mezcla utilidad y promoción, cuenta como marketing; Meta puede recategorizar | Meta, categorización de plantillas. https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/template-categorization | WebFetch 26/10 (sin fecha de actualización visible; ejemplos: confirmación de pedido, aviso de pago, encuesta sobre una interacción reciente) |
| Límites de envío: un portfolio nuevo puede escribir fuera de la ventana a 250 personas distintas cada 24 h; sube a 2.000 verificando la empresa, y después por escalado automático (10.000, 100.000, sin límite) si la calidad es alta. Se cuenta por portfolio, no por número | Meta, límites de mensajería. https://developers.facebook.com/docs/whatsapp/messaging-limits/ | WebFetch 26/10 |
| Coexistencia: se puede conectar el número que ya usa la app WhatsApp Business a la plataforma y seguir contestando desde la app; se sincronizan chats individuales y contactos (hasta 6 meses de historial, si la empresa lo permite). Tras conectarlo, en la app se desactivan las listas de difusión, los mensajes temporales, «ver una vez» y la ubicación en tiempo real; los grupos no se sincronizan; los mensajes enviados desde la app siguen siendo gratis; los dispositivos vinculados se desconectan y se vuelven a vincular | Meta, «Onboarding WhatsApp Business app users (Coexistence)». https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/onboarding-business-app-users | WebFetch 26/10 (sin fecha visible en la página; la búsqueda la daba como actualizada el 20/04/2026). **No hay lista oficial de países**: en la página decir «si tu proveedor lo ofrece para tu número» |
| Permiso del cliente y vía hacia una persona; asistentes de IA de propósito general prohibidos (apartado 4.7) | Ya citados en /agentes-ia/ (act. 23/09/2026) | Se enlaza, no se repite |
| Art. 50 Reglamento de IA y RGPD | Ya citados en /agentes-ia/ | Se enlaza |
| Caso Fran García Cars | `docs/geo/borradores/casos.md` (datos de Daniel, 22/10/2026) | Solo lo que hay ahí. **Cifras de WhatsApp: no hay** (las del panel son de la app de revisiones). No inventar tiempos de respuesta ni % de conversaciones resueltas |

**Descartado:** tarifas por país (precios: regla de no dar cifras; además las fuentes secundarias no coinciden), «90 % de consultas repetitivas» de Aunoa (cifra de proveedor), velocidades de envío (20 mensajes/s en coexistencia: técnico y no le sirve al dueño).

## Esquema (mismo diseño que /agentes-ia/)

1. Migas: Inicio › Agentes de IA › WhatsApp.
2. H1 + autor + «Actualizado el …».
3. Respuesta corta (55 palabras).
4. En cinco puntos.
5. Tres tarjetas de entrada (anclas): «Qué necesito de Meta» · «Cómo es una conversación» · «Un caso real».
6. H2 cuerpo (abajo), FAQ, puente, fuentes.

---

## Texto

**Respuesta corta.** Para automatizar el WhatsApp de una empresa de servicios se conecta un agente de Inteligencia Artificial a la plataforma oficial de WhatsApp Business. El agente contesta las preguntas frecuentes con la información de tu empresa, recoge los datos del encargo, propone cita y pasa a una persona lo que no sabe. Tu equipo ve y retoma cada conversación desde un panel.

**En cinco puntos:**
- Hace falta la plataforma oficial de WhatsApp Business; la app del móvil no admite un agente. Si ya usas la app, en muchos casos puedes conectar el mismo número y seguir contestando desde ella.
- Antes de encender nada se prepara lo que más tiempo lleva: las preguntas reales de tus clientes con su respuesta, lo que el agente no debe decir y a quién pasa cada caso.
- Fuera de las 24 horas desde el último mensaje del cliente solo se pueden enviar plantillas aprobadas por Meta, y cada una se paga.
- Se mide con cuatro cifras: tiempo de primera respuesta, conversaciones resueltas sin persona, citas o solicitudes que salen del agente y conversaciones que acaban en queja.
- En Fran García Cars el asistente de WhatsApp responde, agenda y deriva, y el equipo lleva las conversaciones desde un panel.

### H2 · Qué necesitas de Meta para poner un agente en tu WhatsApp

La app WhatsApp Business, la del móvil, está pensada para que una persona conteste: respuestas rápidas, mensaje de ausencia, etiquetas, catálogo. No deja conectar un agente ni tus programas. Para eso hace falta la plataforma de WhatsApp Business (la API), que Meta ofrece directamente o a través de un proveedor.

Lo que pide, en la práctica:
- **Una cuenta de empresa en Meta** (un portfolio empresarial) y, mejor desde el principio, la empresa verificada. Sin verificar, solo puedes escribir primero a 250 personas distintas al día; verificada, a 2.000, y el límite sigue subiendo si los mensajes son de buena calidad (Meta, límites de mensajería, consultado el 26/10/2026). Las respuestas a quien te ha escrito no cuentan para ese límite.
- **Un número de teléfono** para el agente. Puede ser uno nuevo o el que ya usáis.
- **Un método de pago** en la cuenta de Meta, porque desde el 1 de octubre de 2026 también se cobran los mensajes de servicio que pasan del cupo gratuito de 1.000 al mes por número.
- **Un nombre visible** que coincida con tu marca, que Meta revisa.

#### Si ya usáis la app Business con ese número

Meta permite conectar el número que ya está en la app a la plataforma y seguir contestando desde el móvil (lo llama coexistencia). Si la empresa lo autoriza, se traen los chats individuales y los contactos de los últimos seis meses, y lo que escribe el agente y lo que escribe tu equipo desde la app se ve en los dos sitios. Los mensajes que mandáis desde la app siguen sin cobrarse.

Tiene contrapartidas que conviene saber antes: en la app se desactivan las listas de difusión, los mensajes temporales, los de «ver una vez» y la ubicación en tiempo real; los grupos no se sincronizan; y los dispositivos vinculados se desconectan y hay que volver a vincularlos (Meta, documentación de coexistencia, consultada el 26/10/2026). Si vuestro día a día depende de listas de difusión, es mejor un número nuevo para el agente.

Las cuatro reglas de Meta que marcan el diseño (permiso del cliente, ventana de 24 horas, salida hacia una persona y que el agente sea de tu negocio y no un asistente general) y lo que cobra por cada tipo de mensaje están en la [guía de agentes de IA](/agentes-ia/#whatsapp).

### H2 · Qué hay que preparar antes de encenderlo

Lo que más decide si el agente funciona es la información que le das para trabajar. Para una empresa de servicios son cinco cosas:

1. **Las preguntas reales con su respuesta.** Las sacamos de vuestros chats, emails y llamadas de los últimos meses, no de lo que creéis que pregunta la gente. Al lado de cada una, la respuesta que daría vuestra mejor persona.
2. **Los datos del servicio:** qué hacéis y qué no, zonas, horarios, plazos habituales, documentación que tiene que traer el cliente.
3. **Qué datos necesita el equipo para atender un encargo.** Por ejemplo: qué necesita, dónde, para cuándo, y una foto si sirve. El agente los pide en ese orden y los deja escritos.
4. **Lo que el agente no dice nunca:** precios que no estén publicados, descuentos, plazos comprometidos, diagnósticos o consejos técnicos que tenga que dar una persona.
5. **A quién pasa cada caso** y en qué horario. Una queja va a una persona; una urgencia, al teléfono de guardia; un presupuesto, a quien los prepara.

Con eso escrito, el agente responde con vuestra información aprobada y no con lo que el modelo cree saber.

### H2 · Cómo es una conversación con el agente

Un ejemplo, para una empresa de reformas (marcado como ejemplo, no es un cliente):

> **Cliente, 22:40:** Hola, ¿hacéis cambio de bañera por plato de ducha en Paterna?
> **Agente:** Hola, soy el asistente de Inteligencia Artificial de [empresa]. Sí, hacemos cambio de bañera por plato de ducha en Paterna. Para preparar el presupuesto necesito tres datos: medidas aproximadas del baño, si queréis cambiar también la grifería y para cuándo os vendría bien. Si tienes una foto del baño, mándala por aquí.
> **Cliente:** [foto] 1,70 de largo, grifería también, a ser posible en noviembre.
> **Agente:** Gracias. Lo dejo apuntado para el equipo. ¿Te viene bien que vaya un técnico a verlo el martes 3 a las 10:00 o el miércoles 4 a las 17:00?
> **Cliente:** El miércoles.
> **Agente:** Hecho: miércoles 4 a las 17:00. Te mandaremos un recordatorio el día antes. Si quieres hablar con una persona, escribe «persona» y te atiende alguien del equipo en horario de oficina.

A la mañana siguiente, el equipo encuentra en el panel la solicitud con los datos, la foto y la cita puesta. Nadie ha tenido que contestar a las 22:40 y nadie tiene que volver a preguntar las medidas.

Lo que está en juego en ese intercambio: el agente se presenta como IA en el primer mensaje (lo exige el artículo 50 del Reglamento europeo de IA), pide solo los datos que el equipo necesita y deja siempre la puerta abierta a una persona.

### H2 · Mensajes fuera de las 24 horas: las plantillas que de verdad hacen falta

Pasadas 24 horas desde el último mensaje del cliente, el agente ya no puede escribir libremente: solo con plantillas aprobadas por Meta. Meta las clasifica en tres tipos y cobra cada una según el tipo:

| Tipo | Para qué | Ejemplo en una empresa de servicios |
|---|---|---|
| Utilidad | Algo que el cliente ha pedido o que le afecta directamente | «Tu cita es mañana a las 17:00. Si no puedes venir, responde a este mensaje.» · «Tu presupuesto ya está listo.» |
| Marketing | Todo lo que promociona: ofertas, novedades, recuperar clientes | «Este mes revisamos la caldera con descuento.» |
| Autenticación | Códigos de verificación | Poco habitual en una pyme de servicios |

Una regla que evita sorpresas: si una plantilla de utilidad lleva algo de promoción («tu cita es mañana; por cierto, tenemos oferta en…»), Meta la trata como marketing, que es más cara (Meta, categorización de plantillas, consultada el 26/10/2026). Mejor plantillas cortas y de un solo propósito.

Para la mayoría de empresas de servicios bastan tres o cuatro: recordatorio de cita, presupuesto listo, trabajo terminado y, si se usa, una encuesta breve sobre el servicio recién hecho. Y solo a quien os ha dado permiso para escribirle.

### H2 · Cómo se mide si el agente funciona

Desde el primer día, cuatro cifras en el panel, revisadas cada semana:
- **Tiempo de primera respuesta.** Con el agente debería ser de segundos a cualquier hora; la cifra útil es cuánto tarda una persona cuando el agente le pasa la conversación.
- **Conversaciones resueltas sin persona.** Las que acaban con la duda resuelta o la cita puesta sin que intervenga nadie.
- **Citas, presupuestos o solicitudes que salen del agente.** Es la cifra que se compara con lo que entraba antes.
- **Conversaciones que acaban en queja o en «quiero hablar con una persona»** a mitad de conversación. Si suben, hay una respuesta que está fallando.

Y una revisión de conversaciones: al principio, cada semana; cuando se estabiliza, cada mes. Cada respuesta floja se corrige en la información del agente, no se deja pasar.

### H2 · Errores que vemos con frecuencia

- **Usar herramientas no oficiales** que conectan un programa a la app del móvil. Van contra las condiciones de WhatsApp y el riesgo es que bloqueen el número, que es el canal de tus clientes.
- **Querer usarlo para escribir en frío.** Un agente de atención responde a quien te escribe o a quien te ha dado permiso; las listas compradas no.
- **Dejarlo sin dueño.** Si nadie recoge lo que el agente pasa al equipo, el cliente espera más que antes.
- **Darle respuestas genéricas.** Si lo alimentas con la web y poco más, contestará como una web: correcto y poco útil. Las respuestas buenas salen de los chats reales.
- **Meter promoción en los recordatorios.** Encarece el mensaje y molesta.
- **Olvidar el aviso de que es una IA** y el tratamiento de datos (RGPD), que se cuentan en la [guía de agentes de IA](/agentes-ia/).

### H2 · Un caso real: el asistente de WhatsApp de Fran García Cars

Fran García Cars importa y revisa vehículos para sus clientes. Hacían las revisiones a mano y mandaban las fotos por WhatsApp, desordenadas: había líos con los clientes y se perdía mucho tiempo.

Hicimos dos cosas que trabajan juntas:
- **Una aplicación de gestión de revisiones**, donde va todo el trabajo: expedientes, fotos, revisores, aprobación técnica, licitaciones y pujas. El cliente ve su revisión ordenada en lugar de un carrusel de fotos sueltas.
- **Un asistente de Inteligencia Artificial para WhatsApp con panel.** Responde las preguntas frecuentes con toda la información de la empresa, afinado hasta que contesta como lo haría un responsable; agenda citas; y cuando la consulta no está documentada, la pasa a una persona. El equipo lleva todas las conversaciones desde el panel.

El WhatsApp dejó de ser el sitio donde se mezclaban fotos y preguntas: las fotos van a la aplicación y las preguntas las atiende el asistente. En 2026 la aplicación lleva registradas 62.370 fotos y 400 unidades aprobadas, y hoy es una de sus principales herramientas de trabajo (panel de la aplicación, 22/10/2026). La aplicación está contada en la [guía de automatización de procesos](/automatizacion-de-procesos/) y el caso completo con sus cifras, en [Inteligencia Artificial para empresas](/ia-para-empresas/).

[Imagen: `/casos/img/fran-garcia-whatsapp.webp`, alt «Panel de conversaciones del asistente de WhatsApp de Fran García Cars, con los datos personales difuminados»]

### H2 · Cuánto cuesta un agente de IA para WhatsApp

Depende de la empresa. Hay dos partes:
- **La puesta en marcha:** preparar las respuestas aprobadas y las reglas de paso a persona, conectar la agenda o el programa de gestión, y el panel del equipo. Es lo que más varía de una empresa a otra.
- **El uso, que se paga aparte cada mes:** los mensajes que cobra Meta (plantillas y servicio por encima del cupo), el consumo del modelo de IA y el mantenimiento.

Por eso no damos cifra sin ver el caso: se presupuesta después de la consultoría, con vuestras conversaciones reales delante. Lo que cobra Meta por cada tipo de mensaje está explicado en la [guía de agentes de IA](/agentes-ia/#whatsapp).

### H2 · Cuándo no conviene

- Si recibís pocos mensajes y los contestáis bien y a tiempo.
- Si casi cada conversación necesita ver el trabajo en persona antes de decir nada útil.
- Si no hay nadie que recoja lo que el agente pasa al equipo.

Si con el mensaje de ausencia y las respuestas rápidas de la app os basta, os lo diremos.

### FAQ (idéntica en el JSON-LD FAQPage)

1. **¿Puedo poner un agente de IA en la app WhatsApp Business del móvil?**
   No. La app está hecha para que conteste una persona. Para un agente hace falta la plataforma oficial de WhatsApp Business (la API). Si ya usáis la app, en muchos casos se puede conectar el mismo número a la plataforma y seguir contestando también desde el móvil.

2. **¿Pierdo mis chats si paso mi número de la app a la plataforma?**
   Con la conexión que Meta llama coexistencia, no: si la empresa lo autoriza, se traen los chats individuales y los contactos de los últimos seis meses. Los grupos no se sincronizan y en la app se desactivan las listas de difusión y los mensajes temporales.

3. **¿Puede el agente escribir a mis clientes para recordarles una cita?**
   Sí, con una plantilla de utilidad aprobada por Meta, y solo a clientes que os han dado permiso para escribirles. Si el recordatorio incluye una oferta, Meta lo trata como marketing y lo cobra como tal.

4. **¿Qué necesito preparar antes de tener un agente de WhatsApp?**
   Las preguntas reales de vuestros clientes con su respuesta, los datos del servicio (zonas, horarios, plazos), qué datos pide el agente para cada encargo, lo que no debe decir nunca y a quién pasa cada caso.

5. **¿Cómo sé si el agente de WhatsApp está funcionando?**
   Con cuatro cifras revisadas cada semana: tiempo de primera respuesta, conversaciones resueltas sin persona, citas o solicitudes que salen del agente y conversaciones que acaban en queja o pidiendo una persona.

6. **¿Cuánto cuesta un agente de IA para WhatsApp?**
   Depende de la empresa: la puesta en marcha (respuestas, conexiones y panel) y el uso mensual (mensajes de Meta, consumo del modelo de IA y mantenimiento). Se presupuesta después de la consultoría.

### Puente final

**Si quieres saber si un agente de WhatsApp tiene sentido en tu empresa.** En la consultoría miramos vuestros mensajes reales: qué preguntas se repiten, a qué hora llegan, cuántas solicitudes se quedan sin contestar y con qué programas habría que conectarlo. Si no tiene sentido todavía, te lo decimos claro.

25 minutos por videollamada · Gratuita para 5 empresas al mes; después, de pago · Sin compromiso de contratación

Botón: «Solicitar 1 de las 5 plazas (0 €)» → `/consultoria-gratuita/?cta=pilar_agentes-ia-whatsapp`

Nos vemos en la sesión.

### Fuentes (bloque al final)
- Meta, precios de WhatsApp Business Platform (ventana de 24 horas, cupo de 1.000 mensajes de servicio, cambios del 1/10/2026), consultado el 26/10/2026. developers.facebook.com
- Meta, categorización de plantillas de WhatsApp (utilidad, marketing, autenticación), consultado el 26/10/2026. developers.facebook.com
- Meta, límites de mensajería de WhatsApp Business Platform, consultado el 26/10/2026. developers.facebook.com
- Meta, conexión de usuarios de la app WhatsApp Business a la plataforma (coexistencia), consultado el 26/10/2026. developers.facebook.com
- Reglamento (UE) 2024/1689 de Inteligencia Artificial, artículo 50. eur-lex.europa.eu
- Caso Fran García Cars: datos del panel de su aplicación, 22/10/2026.
- «Fuentes comprobadas el <fecha de publicación>. Próxima revisión: <+3 meses>.»

## JSON-LD (al maquetar)
`@graph` con WebPage (`#webpage`, isPartOf `#website`, breadcrumb, `about` → servicio de agentes), BreadcrumbList (Inicio › Agentes de IA › WhatsApp), Article (autor `https://pebaisystems.es/#daniel`, publisher `#organization`, datePublished/dateModified, `mentions` → Organization «Fran García Cars»), FAQPage con las 6 preguntas idénticas. Copiar la estructura de `dist/agentes-ia/index.html`.

## Checklist de publicación (para el turno que la publique)
- [ ] Grep de palabras prohibidas sobre el HTML: 0 (comprobado sobre este texto el 26/10).
- [ ] Sin raya larga, emojis ni exclamaciones.
- [x] La captura `fran-garcia-whatsapp.webp` existe en `dist/casos/img/` (comprobado el 26/10).
- [ ] El ejemplo de conversación usa «Paterna»: es un ejemplo marcado; si se prefiere neutro, cambiarlo por «en vuestra zona».
- [ ] /agentes-ia/: «Próximamente» de WhatsApp → enlace; enlace en contexto desde su H2 de WhatsApp; el ancla `#whatsapp` existe (comprobado el 26/10).
- [ ] 301 de `agente-ia-whatsapp-business-api-empresas`; sitemap, `llms.txt` y `llms-full.txt` (dist y copia); curl 200 tras el auto-despliegue; `gsc-sitemap` y `bing-url`.
