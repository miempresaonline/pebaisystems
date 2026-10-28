# Borrador · /agentes-ia/voz/

Estado: **HTML maquetado el 28/10/2026 (Contenido, turno de las 15:00) en `docs/geo/borradores/html/agentes-ia-voz.html`** con la plantilla de /agentes-ia/whatsapp/: fecha 30/10 puesta, 6 FAQ idénticas en el JSON-LD, title 50, description 144, 1 H1, 0 palabras prohibidas, sin desborde a 390 px (la tabla se desplaza dentro de su caja, como en WhatsApp). Enlaza /ia-para-empresas/cuanto-cuesta/: solo publicar después de ella. **texto completo el 28/10/2026 (Contenido, turno de las 10:00), sin publicar.** Subpilar 2 de P3 en `docs/geo/pilares.md` (línea 87). Cubre los dos encargos del tablón: borrador completo de voz (Jefe 27/10 tarde) y las 6 preguntas de `preguntas.md` «Voz (P11)» (Preguntas 27/10 tarde). Se publica después de /ia-para-empresas/cuanto-cuesta/ (jue 29/10): máximo una publicación al día, así que el viernes 30/10 como pronto, si el Jefe lo pone en el plan.

## Ficha

- **URL:** `https://pebaisystems.es/agentes-ia/voz/`
- **Title (≤ 60):** `Agente de voz con IA para atender llamadas | PEBAI` (50)
- **Meta description (≤ 155):** `Cómo atiende las llamadas de tu empresa un agente de voz con IA: qué resuelve, cuándo pasa a una persona, qué exige la ley y cuándo no conviene.` (155)
- **H1:** `¿Puede un agente de voz con IA atender las llamadas de mi empresa?`
- **Autor:** Daniel Peñuela Ruiz (`#daniel`).
- **CTA:** `/consultoria-gratuita/?cta=pilar_agentes-ia-voz`
- **Palabras:** «agentes de voz ia» (140, kd 17), «agente de voz ia» (140, kd 16), «centralita ia» (20). Conversacionales: «¿un agente de voz sustituye a un call center?», «¿hay que avisar de que es una IA?», «¿entiende acentos?».
- **301 al publicar (pilares.md §5, línea 179):** `agente-voz-atencion-telefonica-empresas`, `agentes-de-voz-ia-telefonicos-empresas`, `agentes-de-voz-ia-vs-call-center-subcontratado` → `/agentes-ia/voz/`. Técnico los tiene hoy en encargo con destino `/agentes-ia/` hasta que exista esta página: el día que se publique, dejar en el tablón de Técnico «voz publicada <commit>» para cambiar el destino.

### Anticanibalización (comprobado el 28/10)
- Sitemap: no existe `/agentes-ia/voz/` ni carpeta en `dist/`.
- **/agentes-ia/ se queda con el resumen** (H2 `#voz` «¿Suena robótico un agente de voz…?», 4 párrafos; y `#ley` con el art. 50 y el RGPD). Aquí el detalle: qué llamadas resuelve, cómo se diseña la salida a una persona, aviso de IA y de grabación, entrantes frente a salientes, comparación con un call center, cómo se prueba y se mide. Al publicar: en /agentes-ia/ `#voz` añadir «Más detalle en …» y quitar voz de «Lo que vamos a publicar» (`#proximamente`).
- **/agentes-ia/whatsapp/** es el canal escrito; aquí solo un enlace cuando se hable de recoger datos por escrito.
- **Clínicas** (vertical futura `/ia-para-empresas/clinicas/`, prompt 11): aquí un ejemplo de clínica como mucho; datos de salud, una línea y nada más.

### Fuentes verificadas (28/10/2026)

| Dato | Fuente | Comprobado |
|---|---|---|
| Art. 66.1.a) LGTel: derecho «a no recibir llamadas automáticas sin intervención humana […] con fines de comunicación comercial sin haber prestado su consentimiento previo» | Ley 11/2022 General de Telecomunicaciones, art. 66.1, BOE-A-2022-10757. https://www.boe.es/buscar/act.php?id=BOE-A-2022-10757 | Texto leído en el BOE 28/10 |
| Art. 66.1.b): llamadas comerciales no deseadas (por persona), solo con consentimiento previo u otra base del art. 6.1 RGPD | Mismo artículo | Leído 28/10 |
| AEPD: desde el 29/06/2023; interés legítimo solo con relación previa y productos similares; nunca a números aleatorios sin consentimiento; al inicio de cada llamada comercial, identidad de la empresa, finalidad comercial y cómo oponerse; las llamadas comerciales deben grabarse | AEPD, «Derecho a no recibir llamadas comerciales no solicitadas» (ficha informativa, Circular 1/2023). https://www.aepd.es/documento/info-derechos-llamadas-comerciales-no-solicitadas.pdf · nota de prensa https://www.aepd.es/prensa-y-comunicacion/notas-de-prensa/la-aepd-publica-la-circular-sobre-el-derecho-de-los-usuarios | PDF leído 28/10 |
| Art. 50 del Reglamento de IA: las personas tienen que saber que interactúan con un sistema de IA, salvo que sea evidente; desde el 2/08/2026; el Ómnibus no lo retrasó (el plazo al 2/12/2026 es para marcar contenido sintético de sistemas ya comercializados) | Reglamento (UE) 2024/1689, art. 50 y 113; Ómnibus 2026/1744 (Cuatrecasas 24/07/2026, Garrigues) | Ya en /agentes-ia/ y en `novedades.md` (Vigía 27/10) |
| Voz grabada de una persona identificable = dato personal: informar al recoger (art. 13), derecho de copia (art. 15), solo los datos necesarios (art. 5.1.c) | RGPD, Reglamento (UE) 2016/679, arts. 4.1, 5, 13 y 15. https://eur-lex.europa.eu/eli/reg/2016/679/oj?locale=es | Texto conocido; no se cita ninguna resolución concreta de la AEPD (las encontradas son de 2011-2014, anteriores al RGPD) |
| Decisiones solo automatizadas con efecto en la persona | RGPD art. 22 | Ya citado en /agentes-ia/ |

**Descartado:** porcentajes de precisión del reconocimiento de voz y de «llamadas resueltas» de blogs de proveedores (no verificables ni trasladables a cada empresa); precios de proveedores; nombres de competidores. **Sin caso propio de voz:** `casos.md` no tiene ninguno. `[PREGUNTA A DANIEL: ¿hay algún agente de voz en marcha o en piloto que se pueda citar, aunque sea sin cifras?]` Mientras no lo haya, la página no dice «nuestros clientes de voz»; cita el diseño de paso a persona de Fran García Cars **dejando claro que es en WhatsApp**.

## Esquema (mismo diseño que /agentes-ia/whatsapp/)

1. Migas: Inicio › Agentes de IA › Voz.
2. H1 + autor + «Actualizado el …».
3. Respuesta corta (55 palabras).
4. En cinco puntos.
5. Tres tarjetas: «Qué llamadas resuelve» · «Cuándo pasa a una persona» · «Qué exige la ley».
6. H2 cuerpo, FAQ (6), puente, fuentes.

---

## Texto

**Respuesta corta.** Sí, para las llamadas que casi siempre son lo mismo: pedir o cambiar cita, preguntar un horario, el estado de un encargo o dejar un aviso. El agente de voz coge el teléfono, se presenta como asistente de Inteligencia Artificial, resuelve con los datos de tu empresa y pasa a una persona, con un resumen, lo que no sabe o no debe resolver.

**En cinco puntos:**
- Encaja en empresas que pierden llamadas en horas punta o fuera de horario y cuyas llamadas se repiten.
- La salida a una persona se diseña antes que nada: cuándo transfiere, qué resumen entrega y qué pasa si no hay nadie para cogerla.
- Desde el 2 de agosto de 2026 tiene que decir que es una IA, y si graba la llamada, avisar de la grabación y para qué se usa.
- Lo seguro es que atienda llamadas que entran. Para llamar a clientes con fines comerciales, una llamada automática sin persona exige su consentimiento previo.
- Se prueba con llamadas reales de tu empresa, con vuestros acentos y vuestro ruido, antes de dejarlo solo.

### H2 · Qué llamadas puede atender un agente de voz {#que-resuelve}

Un agente de voz es un agente de IA que atiende por teléfono: escucha, entiende lo que pide la persona, responde con voz natural y actúa en tus programas.

**Llamadas que suele resolver bien:**
- Pedir, cambiar o anular una cita, mirando los huecos reales de la agenda.
- Preguntas que se repiten: horario, dirección, qué documentación traer, si hacéis tal servicio.
- Estado de un pedido, una reparación o un expediente, si el agente puede consultar el programa donde está.
- Tomar nota de un aviso o de un encargo y dejarlo apuntado para el equipo.

**Llamadas que debe pasar a una persona:**
- Quejas y reclamaciones.
- Temas delicados o en los que la persona necesita que la escuche alguien.
- Todo lo que no está en la información que le habéis dado.
- Decisiones que afectan de verdad al cliente: rechazar una solicitud, cambiar un contrato, un presupuesto cerrado.

Si casi todas vuestras llamadas son del segundo grupo, un agente de voz no os va a ahorrar trabajo. Os lo diremos.

### H2 · Qué hace si no entiende a quien llama o no sabe la respuesta {#paso-a-persona}

Es la parte que más se descuida y la que más se nota. Un agente que no sabe salir de una conversación se convierte en un contestador que hace perder el tiempo. Se diseña así:

1. **Cuándo transfiere.** Tras dos intentos sin entender, cuando la persona pide hablar con alguien, ante una queja o cuando la pregunta no está en su información.
2. **Qué entrega.** Un resumen de lo que ha entendido (quién llama, qué quiere, qué datos ha dado) para que quien coge la llamada no vuelva a preguntar lo mismo.
3. **Si no hay nadie.** Fuera de horario o con todo el equipo ocupado, toma nota, dice cuándo le van a llamar y deja el aviso apuntado con prioridad. La persona cuelga sabiendo qué va a pasar.
4. **Quién lo recoge.** Un responsable con nombre que mira esos avisos cada día. Sin eso, el agente solo cambia de sitio las llamadas perdidas.

Es el mismo principio que usamos en el canal escrito: en Fran García Cars el asistente de WhatsApp pasa a una persona las consultas que no están documentadas y el equipo las retoma desde un panel ([el caso](/agentes-ia/whatsapp/#caso-real)).

### H2 · ¿Hay que avisar de que habla una IA y de que se graba la llamada? {#avisos}

Sí, las dos cosas, y al principio de la llamada.

- **Que es una IA.** El artículo 50 del Reglamento europeo de Inteligencia Artificial obliga a que las personas sepan que hablan con un sistema de IA, salvo que sea evidente. Se aplica desde el 2 de agosto de 2026; la reforma de 2026 no lo retrasó. Basta con una frase al descolgar: «Hola, soy el asistente de Inteligencia Artificial de [empresa]».
- **Que se graba, si se graba.** La voz de una persona identificable es un dato personal. Si se graba o se transcribe la llamada, el RGPD obliga a informar en ese momento de quién la trata, para qué y dónde ver el resto (la política de privacidad), y la persona puede pedir copia. Se graba solo lo necesario y se conserva el tiempo justo.
- **Para qué se usa la grabación.** No es lo mismo guardar la llamada para documentar una cita o un aviso que usar los audios para entrenar un modelo. Lo segundo necesita su propia base legal y su propio aviso; lo normal es no hacerlo.

Lo general sobre el art. 50 y el RGPD en agentes de IA está en la [guía de agentes de IA](/agentes-ia/#ley).

### H2 · Llamadas que entran y llamadas que salen {#entrantes-salientes}

**Llamadas que entran** (el cliente te llama): es el uso natural y seguro. El agente atiende, resuelve o pasa la llamada.

**Llamadas que salen** (el agente llama): aquí la ley es estricta.
- Una llamada **comercial hecha por un sistema automático sin intervención humana**, como un agente de voz, exige el **consentimiento previo** de quien la recibe (artículo 66.1.a de la Ley General de Telecomunicaciones). El interés legítimo no sirve aquí.
- Las llamadas comerciales hechas por personas tienen sus propias reglas desde junio de 2023: consentimiento, o relación previa con productos parecidos, nunca a números generados al azar, y al empezar hay que decir quién llama, para qué y cómo oponerse (AEPD).
- Llamadas **de servicio** a tus clientes, como confirmar una cita que han pedido o avisar de que su encargo está listo, no son comerciales, pero siguen necesitando el aviso de IA y el cuidado de los datos. Si llevan una oferta, pasan a ser comerciales.

En PEBAI no montamos agentes para llamar en frío a listas de teléfonos. Si una empresa quiere llamadas salientes, primero lo revisa su asesoría jurídica.

### H2 · Agente de voz o call center subcontratado: cuándo conviene cada uno {#call-center}

No son excluyentes. Muchas veces el agente coge lo repetitivo y las personas, propias o subcontratadas, lo demás.

| | Agente de voz | Call center subcontratado |
|---|---|---|
| Llamadas repetitivas (citas, horarios, estado) | Las atiende a cualquier hora y sin esperas | Las atiende una persona, en su horario |
| Quejas, ventas complejas, temas delicados | Las pasa a una persona | Las atiende una persona con formación |
| Picos de llamadas | Atiende varias a la vez | Depende de cuántas personas haya en turno |
| Conocer tu negocio | Sabe lo que le das por escrito y nada más | Aprende con el tiempo, y lo pierde si cambia la persona |
| Conexión con tus programas | Consulta la agenda o el programa de gestión y apunta | Depende de los accesos que le des |
| Datos personales | Un proveedor tecnológico más, con su contrato de encargado | Un proveedor con personas que oyen y apuntan datos, con su contrato de encargado |

**Conviene el agente** si la mayoría de llamadas se repiten y se pierden llamadas fuera de horario. **Conviene una persona** si la llamada es la venta o si cada llamada es distinta. Lo habitual en una pyme es el agente primero y una persona del equipo detrás.

### H2 · Acentos, ruido y mala cobertura {#acentos}

El reconocimiento de voz funciona bien con habla clara y puede fallar con un acento muy marcado, una línea con cortes, ruido de obra o de calle, o cuando la persona habla a la vez que el agente. No prometemos un porcentaje de acierto: depende de quién os llama.

Por eso se prueba antes de dejarlo solo:
- Con grabaciones o llamadas de prueba de vuestros clientes reales, con sus acentos y sus nombres de calles y productos.
- Con el teléfono en las condiciones de vuestro día a día.
- Midiendo, las primeras semanas, cuántas llamadas acaban en una persona porque el agente no entendió. Si son muchas, se ajusta o se deja para otra cosa.

### H2 · Qué hay que preparar antes de encenderlo {#preparar}

- **Las llamadas reales:** de qué llama la gente, en qué orden y a qué horas. Una semana apuntándolo vale más que cualquier suposición.
- **Las respuestas aprobadas:** lo que el agente puede decir, con vuestros datos (horarios, servicios, condiciones), y lo que no debe decir nunca.
- **Las reglas de paso a persona** y quién recoge los avisos.
- **Las conexiones:** la agenda donde da citas, el programa donde consulta el estado y dónde deja apuntado cada aviso.
- **El número:** desviar la línea actual al agente en ciertas horas o cuando nadie coge, o un número nuevo. Se decide según cómo trabajéis.
- **Los avisos:** la frase de IA al descolgar, el aviso de grabación si se graba y la política de privacidad actualizada.

### H2 · Cómo se mide si funciona {#medir}

Cuatro cifras, cada semana:
- Llamadas atendidas que antes se perdían (sobre todo fuera de horario).
- Llamadas resueltas sin pasar a una persona.
- Citas o avisos que salen del agente.
- Llamadas que acaban en queja o pidiendo una persona, y por qué.

### H2 · Cuánto cuesta un agente de voz {#cuanto-cuesta}

Depende de la empresa. La puesta en marcha (respuestas, reglas de paso a persona, conexión con la agenda y los programas, el número) es lo que más varía. Después hay un uso mensual: minutos de llamada, consumo del modelo de IA y mantenimiento. Se presupuesta después de la consultoría, con vuestras llamadas reales delante.

### H2 · Cuándo no conviene {#cuando-no}

- Si recibís pocas llamadas y las cogéis a tiempo.
- Si casi cada llamada es una venta, una queja o un caso distinto.
- Si no hay nadie que recoja lo que el agente pasa al equipo.
- Si lo que buscáis es llamar en frío a listas de teléfonos.

Si con un buen desvío y un mensaje en el contestador os basta, os lo diremos.

### H2 · Preguntas frecuentes {#preguntas}

**¿Qué hace un agente de voz si no entiende a quien llama?**
Lo intenta dos veces y, si sigue sin entender, pasa la llamada a una persona con un resumen de lo que ha entendido. Si no hay nadie disponible, toma nota, dice cuándo le van a llamar y deja el aviso apuntado para el equipo.

**¿Entiende acentos y llamadas con mala cobertura?**
Con habla clara funciona bien; con un acento muy marcado, cortes de línea o mucho ruido puede fallar. Por eso se prueba con llamadas reales de vuestros clientes antes de dejarlo solo y se mide cuántas llamadas acaban en una persona porque no entendió.

**¿Tengo que avisar de que habla una IA y de que se graba la llamada?**
Sí. Desde el 2 de agosto de 2026 el artículo 50 del Reglamento europeo de IA obliga a que la persona sepa que habla con una IA. Si se graba o se transcribe la llamada, el RGPD obliga a informar al empezar de quién la trata y para qué.

**¿Puede un agente de voz llamar a mis clientes?**
Para confirmar o recordar algo que el cliente ha pedido, sí, con el aviso de IA. Para llamadas comerciales, una llamada automática sin intervención humana exige el consentimiento previo de quien la recibe según la Ley General de Telecomunicaciones. No hacemos llamadas en frío.

**¿Un agente de voz sustituye a un call center?**
En las llamadas repetitivas, como citas, horarios o el estado de un encargo, puede atenderlas a cualquier hora. Las quejas, las ventas complejas y los temas delicados los sigue llevando una persona. Lo habitual es combinar los dos.

**¿Cuánto cuesta un agente de voz con IA?**
Depende de la empresa: la puesta en marcha (respuestas, reglas de paso a persona, conexión con la agenda y los programas) y el uso mensual (minutos de llamada, consumo del modelo de IA y mantenimiento). Se presupuesta después de la consultoría.

### Puente final

**¿Pierdes llamadas y no sabes si un agente de voz lo arreglaría?** En la consultoría miramos de qué os llaman, a qué horas se pierden las llamadas y con qué programas habría que conectarlo. Si no tiene sentido todavía, te lo decimos claro. 25 minutos por videollamada, gratuita para cinco empresas al mes; después, de pago. → `/consultoria-gratuita/?cta=pilar_agentes-ia-voz`. Nos vemos en la sesión.

### Enlaces internos
- /agentes-ia/ (madre: `#voz` resumen, `#ley` art. 50 y RGPD)
- /agentes-ia/whatsapp/ (canal escrito y caso Fran García Cars)
- /ia-para-empresas/formacion/ (el equipo que recoge los avisos tiene que saber retomar la conversación)

### Fuentes (para la lista de la página)
- Ley 11/2022, de 28 de junio, General de Telecomunicaciones, artículo 66.1. boe.es (BOE-A-2022-10757).
- AEPD, «Derecho a no recibir llamadas comerciales no solicitadas» y Circular 1/2023 (en vigor el 29/06/2023).
- Reglamento (UE) 2024/1689 de Inteligencia Artificial, artículo 50.
- Reglamento (UE) 2026/1744 (Ómnibus digital sobre IA), DOUE de 24/07/2026 (Cuatrecasas, 24/07/2026).
- Reglamento (UE) 2016/679 (RGPD), artículos 4, 5, 13, 15 y 22.

Fuentes comprobadas el 28/10/2026. Próxima revisión: 28/01/2027.

## JSON-LD al maquetar
WebPage + BreadcrumbList (Inicio › Agentes de IA › Voz) + Article (author `#daniel`, `isPartOf` `/agentes-ia/#article`, `about` `#servicio-voz` si existe en la portada; comprobar el `@id` del servicio de voz) + FAQPage con las 6 preguntas idénticas a las visibles.

## Checklist antes de publicar
- [ ] Pregunta a Daniel sobre un caso de voz (si no hay, se publica sin él, como está).
- [x] Grep de palabras prohibidas, raya larga, exclamaciones (28/10, en el HTML: 0).
- [ ] Si no se publica el 30/10, cambiar la fecha (`2026-10-30` en meta, JSON-LD y byline) por la del día.
- [ ] Copiar el HTML a `dist/agentes-ia/voz/index.html` y borrar el de borradores.
- [ ] Encargo a Técnico: 3 slugs de voz con destino `/agentes-ia/voz/`.
- [ ] /agentes-ia/: «Más detalle» desde `#voz` y quitar voz de `#proximamente`.
- [ ] Sitemap, llms.txt y llms-full.txt («## Guías»), curl 200, `gsc-sitemap`, `bing-url`.
