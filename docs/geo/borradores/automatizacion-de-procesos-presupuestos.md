# Borrador · /automatizacion-de-procesos/presupuestos/

Estado: **texto completo el 28/10/2026 (Contenido, turno de las 15:00), sin publicar.** Satélite de P2 para la pregunta 13 del set (`docs/geo/prompts.md`: «¿Cómo responder más rápido a los presupuestos con inteligencia artificial?»). Cubre tres encargos del tablón: esquema de 6 H2 de Preguntas (28/10), satélite en cola del Vigía (26/10) y abrir con lo que no cubre nadie: pyme española, RGPD, una persona que revisa y un caso propio (Vigía 27/10). Cola de publicación: después de /ia-para-empresas/cuanto-cuesta/ (jue 29/10) y de /agentes-ia/voz/; decide el Jefe el día.

## Ficha

- **URL:** `https://pebaisystems.es/automatizacion-de-procesos/presupuestos/`
- **Title (≤ 60):** `Responder presupuestos más rápido con IA en tu pyme | PEBAI` (58)
- **Meta description (≤ 155):** `Cómo preparar presupuestos en minutos con Inteligencia Artificial: qué se automatiza, qué revisa una persona, el flujo en 4 pasos y cuándo merece la pena.` (153)
- **H1:** `¿Cómo responder más rápido a los presupuestos con Inteligencia Artificial?`
- **Autor:** Daniel Peñuela Ruiz (`#daniel`).
- **CTA:** `/consultoria-gratuita/?cta=pilar_automatizacion-presupuestos`
- **Palabras (pilares.md, P2 subpilar 1):** «programa para hacer presupuestos» (170), «automatizar presupuestos» (sin volumen). Conversacionales: P13 y las 6 preguntas de `preguntas.md` «Responder presupuestos más rápido (P13)».
- **301 al publicar:** ninguna URL vieja es de presupuestos (las de facturas y pedidos, `automatizacion-facturas-pedidos-ia` y `automatizacion-factusol-pedidos-ia`, siguen en 301 a la madre hasta que exista su página).

### Decisión de URL (para el Jefe)
`pilares.md` planea un solo subpilar `/automatizacion-de-procesos/presupuestos-facturas-y-pedidos/`. Propongo partirlo en dos: **presupuestos** (esta página: vender, responder rápido al cliente, P13) y, más adelante, **facturas y pedidos** (administración y VeriFactu). Son intenciones distintas («programa para hacer presupuestos» frente a «automatizar facturas») y juntarlas obligaría a una página larga que no responde bien a ninguna. Si el Jefe prefiere el slug largo, el texto vale igual: solo cambian URL, migas y CTA. Al publicar, en la madre (`automatizacion-de-procesos/index.html`, `#guias`, línea 587) cambiar «Presupuestos, facturas y pedidos. Próximamente.» por el enlace a esta página y dejar «Facturas y pedidos. Próximamente.».

### Anticanibalización (comprobado el 28/10)
- Sitemap: no existe ninguna URL de presupuestos ni carpeta `dist/automatizacion-de-procesos/presupuestos/`.
- **La madre /automatizacion-de-procesos/ se queda con el resumen:** una fila de la tabla («Preparar un presupuesto a partir de un correo o una visita»), la frase «un error en un borrador de presupuesto se corrige antes de enviarlo» y la cuenta de horas al mes. Aquí el detalle: el flujo, quién revisa, cuándo merece la pena, seguimiento y programas. Al publicar, en la fila de Ventas de la tabla de la madre añadir el enlace «Cómo se hace, paso a paso».
- **/ia-para-empresas/cuanto-cuesta/** habla del presupuesto que *recibes* de un proveedor de IA («Qué pedir en un presupuesto»). Aquí es el presupuesto que *envías* a tu cliente. No se mezclan; el coste de automatizar esto solo se enlaza a esa página.
- **/agentes-ia/whatsapp/** atiende la conversación con el cliente. Aquí solo se enlaza en el paso 1 (recoger la petición por WhatsApp).
- **/software-a-medida/** (P5, candidato) sería «construir la herramienta»; aquí se automatiza con lo que ya tienes y se menciona la herramienta propia solo cuando el programa se queda corto (caso Gargom).

### Fuentes verificadas (28/10/2026)

| Dato | Fuente | Comprobado |
|---|---|---|
| VeriFactu: «los únicos documentos afectados por este reglamento son las FACTURAS», no otros justificantes; borradores y proformas no llevan QR tributario; la proforma está permitida si se sustituye por la factura | AEAT, Preguntas frecuentes SIF y VERI*FACTU, «Cuestiones generales, conceptos y definiciones» (página actualizada el 21/10/2026). https://sede.agenciatributaria.gob.es/Sede/iva/sistemas-informaticos-facturacion-verifactu/preguntas-frecuentes/cuestiones-generales-conceptos-definiciones.html | Leída 28/10 |
| Antes de que el consumidor quede vinculado, información clara de las características principales y «el precio total, incluidos todos los impuestos y tasas» | Real Decreto Legislativo 1/2007 (TRLGDCU), art. 60.1 y 60.2.a)-c), texto consolidado del BOE (última actualización 28/02/2026). https://www.boe.es/buscar/act.php?id=BOE-A-2007-20555 | Texto leído en el BOE 28/10 |
| Tratar los datos del cliente para preparar su presupuesto: base de «medidas precontractuales» a petición del interesado; informar al recoger; solo los datos necesarios | RGPD, Reglamento (UE) 2016/679, arts. 5.1.c), 6.1.b) y 13. https://eur-lex.europa.eu/eli/reg/2016/679/oj?locale=es | Texto conocido (mismo uso que en /agentes-ia/) |
| «Most companies are not responding nearly fast enough» a las peticiones que llegan por internet | Oldroyd, McElheran y Elkington, «The Short Life of Online Sales Leads», Harvard Business Review, marzo de 2011. https://hbr.org/2011/03/the-short-life-of-online-sales-leads | Leído el resumen 28/10. **Las cifras (7 veces, 60 veces, 2.241 empresas) solo están en fuentes secundarias y no se usan** |
| Art. 4 del Reglamento de IA (alfabetización) y art. 50 (avisar de que habla una IA) | Ya verificados y publicados en /ia-para-empresas/formacion/ y /agentes-ia/ | Se enlazan, no se repiten |
| Caso Construcciones Gargom: aplicación a medida con presupuestos, certificaciones, gastos, pagos, personal, proveedores y rentabilidad por obra; sin cifras | `docs/geo/borradores/casos.md` (Daniel, 22/10) | Sin cifras ni frases del cliente |
| Caso Fran García Cars: el asistente de WhatsApp responde con la información de la empresa y deriva a una persona lo que no está documentado | `casos.md` | Se cita como ejemplo de paso a persona, no de presupuestos |

**Descartado:** umbrales de «más de 15 presupuestos al mes» y tiempos de «15 segundos» o «5 minutos» (blogs de proveedores, de parte, sin estudio); porcentajes de «presupuestos ganados» de proveedores de software; nombres de competidores y precios. `[PREGUNTA A DANIEL: ¿algún cliente usa ya un borrador automático de presupuesto (Gargom u otro)? Si es así, una frase de qué hace, sin cifras, haría de esta la única página en español con caso real de P13.]` Mientras no conste, la página no dice que Gargom genere presupuestos con IA.

## Esquema (mismo diseño que /agentes-ia/whatsapp/ y /ia-para-empresas/formacion/)

1. Migas: Inicio › Automatización de procesos › Presupuestos.
2. H1 + autor + «Actualizado el …».
3. Respuesta corta (60 palabras).
4. En cinco puntos.
5. Tres tarjetas: «¿Qué se automatiza?» · «¿Quién revisa?» · «¿Me merece la pena?».
6. Seis H2 (esquema de Preguntas), H2 de errores, caso, FAQ (6), puente, fuentes.

---

## Texto

**Respuesta corta.** Se responde más rápido cuando el presupuesto deja de empezar en blanco. La Inteligencia Artificial lee lo que pide el cliente por correo, WhatsApp o formulario, lo ordena en una ficha, propone las partidas con vuestras tarifas y deja un borrador. Una persona revisa precio y condiciones y lo envía. Si el cliente no contesta, el sistema le recuerda el presupuesto.

**En cinco puntos:**
- El tiempo se pierde antes de calcular: buscar los datos del cliente en varios mensajes, preguntar lo que falta y copiar partidas de presupuestos anteriores.
- El primer paso es ordenar la petición en una ficha con siempre los mismos campos. El cálculo automático viene después.
- La IA prepara el borrador; una persona aprueba precio, plazos y condiciones antes de que salga.
- Se conecta a lo que ya usáis: vuestro Excel de tarifas, el programa de gestión o el de facturación. Cada conexión se comprueba antes de prometerla.
- Merece la pena cuando los presupuestos se parecen entre sí y hoy llegan tarde o se quedan sin seguimiento.

### H2 · Cuánto tardas hoy y dónde se pierde el tiempo {#tiempo}

Antes de automatizar nada, cronometra un presupuesto real de principio a fin. Casi siempre el cálculo es la parte corta. Lo largo está alrededor:

1. **Reunir la petición.** El cliente escribe por WhatsApp, manda fotos por otro lado y concreta medidas en una llamada. Alguien tiene que juntarlo.
2. **Preguntar lo que falta.** Medidas, calidades, plazo, dirección de la obra o del servicio. Cada pregunta es un mensaje y una espera.
3. **Buscar precios.** La tarifa está en un Excel, el último precio del proveedor en un correo y el presupuesto parecido del mes pasado en una carpeta.
4. **Redactar y dar formato.** Copiar partidas, ajustar textos y condiciones, pasarlo a PDF.
5. **Seguir.** Saber a quién se le envió, cuándo y si ha contestado.

Apunta cuántos minutos lleva cada paso y cuántos presupuestos haces al mes. Esa cuenta dice dónde está el tiempo y por dónde empezar. Responder pronto importa: un estudio publicado en Harvard Business Review ya concluía en 2011 que la mayoría de las empresas no responde lo bastante rápido a las peticiones que reciben por internet. Lo que no dice el estudio es cuánto ganarás tú; eso solo lo dicen tus propios números.

### H2 · Qué se automatiza y qué revisa una persona {#quien-revisa}

| Paso | Lo hace el sistema | Lo decide una persona |
|---|---|---|
| Recoger la petición | Lee el correo, el WhatsApp o el formulario y rellena la ficha | Nada, salvo que falte algo que solo el cliente sabe |
| Pedir lo que falta | Pregunta al cliente los campos vacíos, con un mensaje claro | Casos raros que no encajan en la ficha |
| Proponer partidas | Elige partidas y cantidades con vuestras tarifas y presupuestos anteriores | Si las partidas son las correctas |
| Precio y condiciones | Aplica la tarifa y las reglas que hayáis fijado (márgenes, mínimos, desplazamientos) | Descuentos, excepciones, plazos y cualquier precio fuera de tarifa |
| Enviar | Prepara el PDF y el mensaje | Pulsar «enviar» |
| Seguimiento | Recuerda a los días acordados y avisa si el cliente responde | Hablar con el cliente cuando contesta |

La regla es sencilla: **la IA prepara, una persona aprueba**. Sobre todo al principio, ningún presupuesto sale sin que alguien lo mire. Un error en un borrador se corrige en un minuto; un precio mal enviado a un cliente compromete a la empresa y es difícil de retirar. Con el tiempo, cuando los borradores salen bien de forma constante, se puede decidir que los más sencillos (una revisión, una visita técnica con precio cerrado) salgan con una revisión más ligera. Esa decisión es vuestra y se toma con datos, no al montar el sistema.

### H2 · El flujo en cuatro pasos {#flujo}

1. **Petición.** El cliente pide presupuesto por donde ya os escribe: correo, WhatsApp, formulario de la web o una nota de la visita. Si lo que más os llega es WhatsApp, un [agente de WhatsApp](/agentes-ia/whatsapp/) puede recoger los datos en la misma conversación, diciendo que es un asistente de IA.
2. **Datos.** El sistema convierte lo recibido en una ficha con siempre los mismos campos (qué, cuánto, dónde, cuándo, fotos adjuntas) y pide al cliente lo que falta. Este es el paso que más tiempo ahorra y el que conviene montar primero.
3. **Borrador.** Con la ficha completa, propone partidas y precios a partir de vuestra tarifa y de presupuestos anteriores parecidos, con vuestros textos y condiciones de siempre.
4. **Revisión.** Una persona lo abre, corrige si hace falta y lo envía. Cada corrección sirve para ajustar las reglas y que el siguiente borrador salga mejor.

¿Por dónde empiezo? Por el paso 2. Si las peticiones llegan ordenadas y completas, el presupuesto ya se hace mucho más rápido aunque el cálculo siga siendo manual. Automatizar el cálculo sobre datos desordenados solo produce borradores malos más deprisa.

### H2 · ¿Merece la pena en mi empresa? {#merece-la-pena}

No hay un número mágico de presupuestos al mes. Depende de cuántos haces, cuánto tarda cada uno y cuánto se parecen entre sí. Cuatro preguntas para decidirlo:

- **¿Se parecen?** Si la mayoría siguen el mismo patrón (mismas partidas, cambian cantidades y medidas), se automatizan bien. Si cada uno es un proyecto distinto que hay que estudiar, el sistema ayuda en la ficha y el seguimiento, no en el cálculo.
- **¿Tenéis tarifa escrita?** Aunque sea un Excel. Si los precios solo están en la cabeza de una persona, el primer trabajo es escribirlos.
- **¿Llegan tarde o se quedan sin seguimiento?** Si hoy tardáis días en responder o no sabéis cuántos presupuestos siguen abiertos, ahí hay margen.
- **¿Quién los hace?** Si los presupuestos los hace el dueño por la noche, el tiempo que se libera es el más caro de la empresa.

Para compararlo con otras tareas, usa la misma cuenta de la [guía de automatización](/automatizacion-de-procesos/#merece-la-pena): veces al mes por minutos cada vez. Lo que cuesta montarlo depende de vuestras herramientas y se explica en [cuánto cuesta implantar IA](/ia-para-empresas/cuanto-cuesta/).

### H2 · Seguimiento de los presupuestos que no responden {#seguimiento}

Un presupuesto enviado y olvidado es trabajo perdido. El seguimiento es la parte más fácil de automatizar y la que más se descuida:

- El sistema guarda cada presupuesto enviado con su fecha y su estado (enviado, visto si el canal lo permite, aceptado, rechazado, sin respuesta).
- A los días que decidáis, manda un recordatorio corto y educado por el mismo canal.
- Si el cliente responde con una duda, una contraoferta o un «sí», **pasa a una persona** con el contexto de lo enviado, para que nadie tenga que preguntar de nuevo.
- Si no responde tras el último recordatorio, se cierra como perdido y se anota el motivo si se conoce. Esa lista os dice qué tipo de presupuesto no se gana.

El recordatorio va solo a quien pidió el presupuesto y sobre ese presupuesto. Usarlo para enviar publicidad de otros servicios es otra cosa y necesita su propia base legal.

### H2 · Con qué programas se conecta {#programas}

Casi nunca hace falta cambiar de programa. El sistema lee de donde están hoy vuestros precios y escribe donde hoy guardáis los presupuestos:

- **Excel u hoja de cálculo de tarifas.** Es el caso más habitual en pymes y funciona bien, siempre que la tarifa tenga una estructura estable.
- **Programa de gestión o de facturación.** Si tiene conexión oficial (API) o importa ficheros, el presupuesto aprobado puede crearse allí directamente y pasar luego a pedido o factura sin teclearlo otra vez.
- **Correo, WhatsApp y formulario de la web,** para recoger la petición y hacer el seguimiento.

Cada conexión se comprueba con vuestro programa y vuestra versión antes de prometerla: hay programas que la tienen completa, otros solo exportan e importan, y otros, ninguna. Cómo se conecta cada tipo está en [conectar los programas que ya usáis](/automatizacion-de-procesos/#programas).

**¿Le afecta VeriFactu?** No al presupuesto. Según las preguntas frecuentes de la Agencia Tributaria (actualizadas el 21 de octubre de 2026), los únicos documentos afectados por el reglamento de sistemas de facturación son las facturas; los borradores y las facturas proforma no llevan código QR tributario. Cuando el presupuesto se acepta y se convierte en factura, esa factura sí la emite vuestro programa de facturación con sus requisitos.

### H2 · Lo que el presupuesto tiene que decir y los datos del cliente {#ley}

Que lo prepare una IA no cambia lo que el presupuesto tiene que contar:

- **Si el cliente es un particular,** antes de que acepte hay que darle de forma clara las características principales del servicio y el precio total con todos los impuestos y tasas (art. 60 de la Ley General para la Defensa de los Consumidores y Usuarios). Por eso el precio final lo revisa siempre una persona. Algunos sectores tienen además sus propias normas de presupuesto previo: se aplican igual.
- **Los datos que el cliente os da para su presupuesto** se pueden tratar para preparárselo porque lo ha pedido él (art. 6.1.b del RGPD). Hay que informarle de quién los trata y para qué (art. 13), y pedir solo los necesarios (art. 5.1.c).
- **Si es un asistente el que conversa con el cliente,** tiene que decir que es una IA (art. 50 del Reglamento de IA, lo explicamos en [agentes de IA](/agentes-ia/#ley)). Y quien lo use en vuestro equipo tiene que saber cómo funciona y cuándo se equivoca: es la [formación del art. 4](/ia-para-empresas/formacion/).

### H2 · Errores que hacen perder tiempo {#errores}

- **Empezar por el cálculo.** Sin fichas ordenadas, los borradores salen mal y el equipo deja de fiarse del sistema.
- **Dejar que salga sin revisar desde el primer día.** La confianza se gana con semanas de borradores correctos, no se supone.
- **Tarifas viejas.** Si el Excel no está al día, la IA reproduce precios desactualizados. Alguien tiene que ser responsable de la tarifa.
- **No medir.** Apuntad cuánto tardabais antes y cuánto después, y cuántos presupuestos se aceptan. Sin eso no sabréis si ha funcionado.
- **Usar IA donde basta una regla.** Si el precio sale de multiplicar metros por tarifa, no hace falta IA para eso. La IA sirve para leer peticiones desordenadas y redactar; el cálculo con reglas fijas es más barato y no se equivoca.

### H2 · Un caso real: presupuestos y obra en un solo sitio {#caso}

**Construcciones Gargom (construcción).** Trabajaban con un programa antiguo que les limitaba. Les construimos una aplicación a medida para gestionar sus obras: presupuestos, certificaciones, gastos por tipo, pagos, personal, proveedores y la rentabilidad de cada obra, todo en un solo sitio. Es la base que necesita cualquier automatización de presupuestos: precios, obras anteriores y clientes en un mismo lugar, en vez de repartidos entre carpetas y hojas de cálculo. (Captura real con los datos difuminados: `casos/img/gargom-app.webp`.)

Y cuando un cliente pregunta algo que no está documentado, el sistema no lo inventa: en el asistente de WhatsApp de **Fran García Cars** las consultas sin respuesta en la información de la empresa pasan a una persona del equipo. Es el mismo criterio que aplicamos al seguimiento de presupuestos.

### FAQ (6, idénticas en el JSON-LD)

**¿Puede la IA hacer el presupuesto entero sola?**
Puede preparar el borrador entero: ficha, partidas, precio según tarifa y texto. Lo que no conviene es que salga sin revisión, sobre todo al principio: una persona aprueba precio, plazos y condiciones. Con semanas de borradores correctos podéis decidir revisar menos los más sencillos.

**¿Cómo respondo antes que los demás cuando el cliente pide varios presupuestos?**
Contestando en minutos aunque el presupuesto tarde más. El sistema lee el WhatsApp o el correo, confirma lo recibido y pregunta lo que falta (medidas, fotos, plazo, dirección). Con eso prepara el borrador y una persona lo revisa. Si hace falta ver la obra, se dice y se agenda la visita: sin visita no se da un precio cerrado.

**¿Cuántos presupuestos al mes hacen falta para que merezca la pena?**
No hay una cifra que valga para todas las empresas. Depende de cuántos hacéis, cuánto tarda cada uno y cuánto se parecen entre sí. Multiplica presupuestos al mes por minutos de cada uno y compáralo con otras tareas: la que más horas suma es por donde conviene empezar.

**¿Funciona con mi Excel de tarifas o mi programa de facturación?**
Normalmente sí: se conecta a lo que ya usáis. Un Excel con estructura estable funciona bien, y un programa de gestión o facturación con conexión oficial o importación de ficheros permite crear allí el presupuesto aprobado. Cada conexión se comprueba con vuestro programa antes de prometerla.

**¿Qué hago con los presupuestos que el cliente no contesta?**
Que el sistema mande un recordatorio corto por el mismo canal a los días que decidáis y que, si el cliente responde, pase la conversación a una persona con el presupuesto a la vista. Si tras el último recordatorio no hay respuesta, se cierra como perdido y se anota el motivo.

**¿El presupuesto tiene que cumplir VeriFactu?**
No. Según la Agencia Tributaria, el reglamento de sistemas de facturación solo afecta a las facturas; los borradores y las facturas proforma no llevan código QR tributario. La factura que emitáis cuando el cliente acepte sí la hace vuestro programa de facturación con sus requisitos.

### Puente final

**¿Quieres saber si tus presupuestos se pueden preparar así?** En la consultoría de 25 minutos vemos cómo os llegan hoy las peticiones, dónde se va el tiempo y qué parte conviene automatizar primero, con lo que ya usáis. Es gratuita para cinco empresas al mes; después, de pago. → `/consultoria-gratuita/?cta=pilar_automatizacion-presupuestos` («Solicitar 1 de las 5 plazas (0 €)»).

### Fuentes (bloque visible, con fecha de consulta 28/10/2026)
1. Agencia Tributaria, Preguntas frecuentes sobre sistemas informáticos de facturación y VERI*FACTU, cuestiones generales (actualizada el 21/10/2026).
2. Real Decreto Legislativo 1/2007, Ley General para la Defensa de los Consumidores y Usuarios, art. 60 (BOE, texto consolidado).
3. Reglamento (UE) 2016/679 (RGPD), arts. 5, 6 y 13 (EUR-Lex).
4. Oldroyd, McElheran y Elkington, «The Short Life of Online Sales Leads», Harvard Business Review, marzo de 2011.
5. Reglamento (UE) 2024/1689 de Inteligencia Artificial, arts. 4 y 50 (enlazados a sus páginas).

### JSON-LD previsto
WebPage + BreadcrumbList (Inicio › Automatización de procesos › Presupuestos) + Article (`author` `#daniel`, `publisher` `#organization`, `datePublished`/`dateModified` del día, `about` «Automatización de presupuestos», `isPartOf` /automatizacion-de-procesos/) + FAQPage con las 6 preguntas de arriba, texto idéntico. Sin Review ni AggregateRating.

### Checklist antes de publicar
- [x] Jefe: slug `/automatizacion-de-procesos/presupuestos/`, se publica el lun 2/11 (Jefe 28/10 tarde).
- [x] FAQ «¿Cómo respondo antes que los demás?» (encargo de Preguntas 28/10): sustituye a la de «¿Se puede generar un presupuesto a partir de un WhatsApp o un correo?», que ya responde el H2 del flujo; se mantienen 6 FAQ (29/10).
- [ ] Respuesta de Daniel a la pregunta del caso (si no hay, se publica sin ella, como está).
- [ ] Reabrir la FAQ de la AEAT y comprobar que sigue igual (fecha de actualización).
- [ ] Grep de palabras prohibidas sobre el HTML, sin raya larga, emojis ni exclamaciones.
- [ ] Enlaces internos 200: /agentes-ia/whatsapp/, /automatizacion-de-procesos/#merece-la-pena y #programas, /ia-para-empresas/cuanto-cuesta/ (publicada el 29/10), /agentes-ia/#ley, /ia-para-empresas/formacion/.
- [ ] Madre: enlace en `#guias` y en la fila de Ventas. Sitemap, `llms.txt` y `llms-full.txt` (dist y copia).
