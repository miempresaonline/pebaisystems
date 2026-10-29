# Borrador · /ia-para-empresas/instaladoras/

Estado: **texto completo el 29/10/2026 (Contenido, turno de las 10:00), sin publicar.** Sale del encargo del Jefe (28/10 tarde y 29/10 mañana) con el esquema de 6 H2 de `preguntas.md` («Turno 28/10 tarde», 8 preguntas) y el H2 de cualificar el lead que añadió el Vigía (`sectores/energia-solar.md`). Cola: se maqueta después de voz (30/10) y presupuestos (2/11). La deducción de IRPF del RDL 7/2026 **no entra** hasta que el Vigía lea el BOE-A-2026-6544 (encargo suyo del 30/10); sin porcentajes.

## Ficha

- **URL:** `https://pebaisystems.es/ia-para-empresas/instaladoras/` (vertical 1 de `pilares.md` §4)
- **Title (≤ 60):** `IA para instaladoras: solar, clima y electricidad | PEBAI` (56)
- **Meta description (≤ 155):** `Cómo usa la IA una instaladora de placas, clima o electricidad: cualificar por WhatsApp, hacer presupuestos, avisar de la obra y atender fuera de horario.` (154)
- **H1:** `¿Cómo puede usar la IA una empresa instaladora?`
- **Autor:** Daniel Peñuela Ruiz (`#daniel`).
- **CTA:** `/consultoria-gratuita/?cta=pilar_ia-para-empresas-instaladoras`
- **Breadcrumb:** Inicio › IA para empresas › Instaladoras

### Anticanibalización (comprobado el 29/10 con sitemap, `dist/` y `.htaccess`)
- Sitemap publicado: `/`, `/consultoria-gratuita/`, `/posicionamiento-en-ia/`, `/agentes-ia/`, `/agentes-ia/whatsapp/`, `/ia-para-empresas/`, `/ia-para-empresas/formacion/`, `/ia-para-empresas/cuanto-cuesta/`, `/automatizacion-de-procesos/`. No hay nada de instaladoras ni en `dist/` ni en `.htaccess`.
- **Frente a `/automatizacion-de-procesos/presupuestos/` (sale el 2/11):** allí, cómo se automatiza un presupuesto en cualquier pyme de servicios (ficha, borrador, revisión, seguimiento, VeriFactu). Aquí, el ciclo entero de una instaladora (lead que llega, visita, presupuesto, obra, legalización, urgencias) y lo propio del oficio (fotos del tejado y del cuadro, factura de la luz, certificado de instalación). El presupuesto se resume en un H2 y se enlaza allí para el detalle. Intención distinta: «IA para mi instaladora» frente a «hacer presupuestos más rápido».
- **Frente a `/agentes-ia/whatsapp/`:** allí, el agente de WhatsApp en general (app frente a API, plantillas, Meta). Aquí solo qué datos pide a un cliente de una instalación; enlace allí para la parte técnica.
- **Frente a `/ia-para-empresas/cuanto-cuesta/`:** la pregunta de precio del cotizador se responde con enlace, sin cifras.
- Un solo satélite por nicho mientras la demanda sea baja (Jefe 29/10): climatización y electricidad van como H2 aquí, no en páginas propias.

### Fuentes verificadas (29/10/2026)
1. **REBT**, Real Decreto 842/2002, art. 18.d (BOE-A-2002-18099, última actualización publicada el 3/09/2025): al terminar, «la empresa instaladora ejecutora de la instalación emitirá un certificado de instalación». Leído en boe.es el 29/10.
2. **RITE**, Real Decreto 1027/2007, art. 23 «Certificado de la instalación» (BOE-A-2007-15820): lo emite el instalador habilitado tras las pruebas de puesta en servicio. Leído en boe.es el 29/10.
3. **Real Decreto 244/2019** de autoconsumo (BOE-A-2019-5089, última actualización publicada el 21/03/2026). Leído en boe.es el 29/10 (solo se cita como la norma que regula el autoconsumo; no se resumen trámites).
4. **Reglamento (UE) 2024/1689**, art. 50 (aviso de que se habla con una IA): ya citado en /agentes-ia/#ley, enlazar allí.
5. **RGPD**, arts. 5.1.c, 6.1.b y 13: mismo uso que en el borrador de presupuestos.
6. Preguntas reales: `docs/geo/preguntas.md` («Turno 28/10 tarde», 8 preguntas) y `docs/geo/sectores/energia-solar.md` (Vigía 29/10). Las cifras de proveedores (Javadex, cotizadores) son de parte y **no se usan**.

**No se usa (sin verificar):** porcentajes de la deducción del RDL 7/2026, datos de UNEF que no se han abierto en el PDF, ayudas autonómicas.

## Esquema

1. Migas, H1, autor, «Actualizado el …».
2. Respuesta corta (40-60 palabras) + resumen en 5 viñetas + 3 accesos (`fork`).
3. 7 H2 (abajo), FAQ (6), puente, fuentes con fecha y próxima revisión.

---

## Texto

**Respuesta corta.** En una instaladora, la IA trabaja alrededor de la instalación: contesta por WhatsApp aunque estéis en un tejado, pide la factura de la luz y las fotos antes de la visita, prepara el borrador del presupuesto con vuestras tarifas y avisa al cliente de cada paso. El cálculo, el precio y el certificado los firma el instalador.

**En cinco puntos:**
- El tiempo se va antes y después de instalar: contestar mensajes, ir a visitas que no salen, preparar presupuestos y llamar a cada cliente para contarle cómo va lo suyo.
- Lo que más ahorra es cualificar antes de la visita: con la factura, las fotos del tejado o del cuadro y la dirección, sabéis si merece la pena ir.
- La IA prepara el borrador; el cálculo técnico y el precio los valida una persona.
- Los avisos por hitos (visita, material, instalación, legalización) evitan la mayoría de llamadas de «¿cómo va lo mío?».
- Sirve igual para placas, climatización y electricidad: el flujo es el mismo y cambian las preguntas y las plantillas.

**Accesos:** Cualificar antes de ir (#cualificar) · Qué firma una persona (#quien-firma) · Fuera de horario (#fuera-de-horario)

### H2 · Dónde se pierde el tiempo en una instaladora {#tiempo}

Pregunta real: «¿Cuánto tiempo se me va en hacer presupuestos de instalación y se puede reducir con IA?» (`preguntas.md`, 28/10).

Casi nunca en la instalación en sí. Se pierde alrededor:

1. **Contestar.** El cliente escribe por WhatsApp mientras la cuadrilla está en otra obra. Si nadie contesta en horas, pide precio a otro.
2. **Ir a ver.** Visitas a casas donde el tejado no sirve, el consumo no justifica la instalación o el cliente solo quería una cifra orientativa.
3. **Presupuestar.** Medir, calcular, buscar precios de material y redactar. Muchas veces por la noche y con los datos repartidos en varios mensajes.
4. **Contar cómo va.** Llamadas y mensajes de clientes que preguntan por el material, la fecha de instalación o los papeles.

Antes de automatizar nada, apunta una semana: cuántos contactos entran, cuántos acaban en visita, cuántas visitas en presupuesto y cuántos presupuestos en obra. Esa cuenta dice dónde está el atasco. No damos cifras de horas ahorradas: dependen de cada empresa y solo las dan vuestros números.

### H2 · Cómo cualifico un lead de placas antes de ir a ver el tejado {#cualificar}

Pregunta real: «¿Cómo cualifico un lead de placas solares antes de ir a la visita técnica?» (Vigía, `sectores/energia-solar.md`: hoy solo responden herramientas de EE. UU. y Brasil, sin marco español). Y «¿Puede un agente por WhatsApp pedir fotos y datos al cliente antes de ir a verlo?» (`preguntas.md`, 28/10).

Sí. Un asistente de WhatsApp puede pedir, en la misma conversación y diciendo que es un asistente de IA:

- **La factura de la luz** (una foto basta): consumo, potencia contratada y tipo de tarifa.
- **Fotos del tejado o de la cubierta,** con la orientación si el cliente la sabe, y si hay sombras de árboles o edificios.
- **Una foto del cuadro eléctrico,** que dice mucho del trabajo extra que puede haber.
- **La dirección y el tipo de vivienda:** unifamiliar, adosado o piso en una comunidad de propietarios (en un piso, la instalación depende de la comunidad).
- **Qué busca:** ahorrar en la factura, baterías, cargador para el coche.

Con eso, el asistente ordena una ficha y el instalador decide: ir a ver, pedir algo más o explicar por qué no compensa. **Pasa a una persona** cuando el cliente pregunta algo técnico que no está en la información de la empresa, cuando pide precio cerrado o cuando quiere hablar con alguien. No promete precios, plazos ni ahorros.

Los datos que el cliente manda para su presupuesto se tratan porque lo ha pedido él (art. 6.1.b del RGPD); hay que informarle de quién los trata y para qué (art. 13) y pedir solo los necesarios (art. 5.1.c). Cómo se monta el asistente, la API oficial y las plantillas de Meta están en [agente de IA para WhatsApp](/agentes-ia/whatsapp/).

### H2 · El flujo en cuatro pasos {#flujo}

1. **Petición.** El cliente escribe por WhatsApp, por el formulario de la web o llama. Todo entra en el mismo sitio.
2. **Fotos y datos.** El asistente pide lo que falta (factura, fotos, dirección) y deja la ficha completa.
3. **Borrador.** Con la ficha y vuestras tarifas, el sistema propone el presupuesto: material, mano de obra, extras según el cuadro o la cubierta, y vuestras condiciones.
4. **Revisión del instalador.** Una persona comprueba el cálculo y el precio, corrige si hace falta y lo envía.

Por dónde empezar: por el paso 2. Si las fichas llegan completas, el presupuesto se hace antes aunque el cálculo siga siendo manual. El detalle de cómo se automatiza un presupuesto (fichas, tarifas en Excel o en el programa de gestión, seguimiento de los que no contestan) está en [automatizar presupuestos](/automatizacion-de-procesos/presupuestos/).

### H2 · Qué calcula la IA y qué firma una persona {#quien-firma}

Pregunta real: «¿Puede la IA calcular el presupuesto de una instalación fotovoltaica sola?» (`preguntas.md`, 28/10: los cotizadores parten de plantillas y tarifas de la empresa, y la revisión es humana).

| Tarea | La prepara el sistema | La decide o firma una persona |
|---|---|---|
| Ficha del cliente | Ordena factura, fotos y datos | Si falta algo que solo se ve en la visita |
| Dimensionado | Propone según vuestras reglas y plantillas | El instalador valida potencia, material y si el tejado o el cuadro lo permiten |
| Precio | Aplica vuestra tarifa | Descuentos, extras y cualquier precio fuera de tarifa |
| Envío | Prepara el PDF y el mensaje | Pulsar «enviar» |
| Certificado y legalización | Recuerda plazos y documentos pendientes | La empresa instaladora habilitada emite y firma el certificado |

Lo último no es una preferencia: en baja tensión, al terminar, **la empresa instaladora ejecutora emite el certificado de instalación** (art. 18 del Reglamento electrotécnico para baja tensión), y en climatización **el certificado lo emite el instalador habilitado** tras las pruebas de puesta en servicio (art. 23 del Reglamento de Instalaciones Térmicas en los Edificios). La IA puede ordenar los papeles; la responsabilidad técnica es de quien firma.

### H2 · Seguimiento de presupuestos y de obra {#seguimiento}

Preguntas reales: «¿Cómo hago seguimiento de los presupuestos enviados que el cliente no contesta?» y «¿Se puede avisar al cliente del estado de su obra sin llamarle uno por uno?» (`preguntas.md`, 28/10).

**Presupuestos sin respuesta.** El sistema guarda cada presupuesto con su fecha y su estado, manda un recordatorio corto por el mismo canal a los días que decidáis y, si el cliente responde con una duda o un «sí», pasa la conversación a una persona con el presupuesto a la vista.

**Avisos de obra por hitos.** Un mensaje en cada paso que el cliente espera: visita confirmada, material pedido, material recibido, fecha de instalación, instalación terminada, papeles presentados. Si el cliente contesta con algo que se sale del guion (un cambio, una queja, una duda técnica), lo atiende una persona. En autoconsumo, la tramitación sigue lo que marca el Real Decreto 244/2019 y lo que pida cada comunidad autónoma y distribuidora; el sistema solo recuerda qué falta y avisa al cliente, no tramita por su cuenta.

Un mismo sitio para obras, presupuestos y costes es la base de todo esto. Es lo que hicimos con **Construcciones Gargom** (construcción): una aplicación a medida con presupuestos, certificaciones, gastos, pagos, personal, proveedores y rentabilidad por obra, en lugar de un programa antiguo que les limitaba ([ver el caso](/automatizacion-de-procesos/#casos)). No es una instaladora; el problema de tener la obra repartida en varios sitios es el mismo.

### H2 · Fuera de horario y urgencias {#fuera-de-horario}

Pregunta real: «¿Responde a clientes fuera de horario o con la cuadrilla en la calle?» (`preguntas.md`, 28/10).

Sí, con límites claros. Fuera de horario, el asistente:

- contesta las preguntas frecuentes con la información de la empresa (zona de trabajo, qué instaláis, cómo es una visita);
- recoge el aviso, la dirección y el tipo de problema, y pregunta si hay urgencia (sin luz, aire acondicionado parado, inversor con error);
- **pasa las urgencias a una persona** por el canal que hayáis decidido, y deja el resto para primera hora;
- no promete visitas, horas ni precios por su cuenta.

Así funciona el asistente de WhatsApp de **Fran García Cars**: responde lo que está en la información de la empresa, agenda y pasa a una persona lo que no sabe ([ver el caso](/agentes-ia/whatsapp/#caso-real)). Si además queréis que conteste el teléfono, el agente de voz se explica en [agentes de IA](/agentes-ia/). En cualquier canal, el cliente tiene que saber que habla con una IA (art. 50 del Reglamento de IA, [lo explicamos aquí](/agentes-ia/#ley)).

### H2 · Placas solares, climatización y electricidad {#oficios}

Pregunta real: «¿Sirve para climatización y electricidad, o solo para solar?» (`preguntas.md`, 28/10: casi todo el contenido que hay es de solar).

El flujo es el mismo (petición, datos, presupuesto, seguimiento); cambian las preguntas y las plantillas:

| | Qué pide el asistente antes de ir | Avisos típicos |
|---|---|---|
| **Placas solares y baterías** | Factura de la luz, fotos del tejado y del cuadro, tipo de vivienda | Material, instalación, legalización y alta del autoconsumo |
| **Climatización** | Metros y número de estancias, fotos de dónde iría la máquina interior y la exterior, si hay preinstalación | Visita, material, instalación, revisión |
| **Electricidad** | Qué se necesita (reforma, ampliación de potencia, cargador, avería), fotos del cuadro | Visita, certificado, cambio de potencia con la distribuidora |

Si hacéis varias cosas (placas con aerotermia, o placas con cargador), el asistente pregunta primero qué busca el cliente y sigue la plantilla que toque.

### FAQ (6, idénticas en el JSON-LD)

**¿Puede la IA hacer sola el presupuesto de una instalación fotovoltaica?**
Puede preparar el borrador con vuestras tarifas y plantillas a partir de la factura, las fotos y los datos del cliente. El dimensionado, el precio final y cualquier extra los valida el instalador antes de enviarlo, y el certificado lo emite siempre la empresa instaladora habilitada.

**¿Qué datos debe pedir el WhatsApp antes de ir a ver el tejado?**
La factura de la luz, fotos del tejado y del cuadro eléctrico, la dirección, el tipo de vivienda (en un piso depende de la comunidad) y qué busca el cliente: ahorrar, baterías o cargador. Con eso se decide si merece la pena la visita.

**¿Responde a los clientes fuera de horario?**
Sí: contesta las preguntas frecuentes, recoge el aviso y la dirección y pregunta si es urgente. Las urgencias pasan a una persona por el canal que decidáis y el resto queda para primera hora. No promete visitas, horas ni precios por su cuenta.

**¿Sirve para climatización y electricidad, o solo para placas?**
Sirve para los tres oficios. El flujo es el mismo (petición, datos, presupuesto, seguimiento) y cambian las preguntas: la factura y el tejado en solar, los metros y la ubicación de las máquinas en climatización, el cuadro y la potencia en electricidad.

**¿Cómo aviso al cliente de cómo va su obra sin llamarle?**
Con mensajes automáticos en cada hito: visita confirmada, material recibido, fecha de instalación, instalación terminada y papeles presentados. Si el cliente contesta con un cambio, una queja o una duda técnica, lo atiende una persona.

**¿Cuánto cuesta un sistema así para una instaladora?**
Depende de la empresa: cuántos contactos entran, qué programas usáis y cuántos oficios tenéis. Se presupuesta después de la consultoría. Qué partidas debe traer un presupuesto de IA y los costes que se olvidan lo explicamos en cuánto cuesta implantar IA en una pyme.

(En el HTML, la última FAQ enlaza «cuánto cuesta implantar IA en una pyme» a `/ia-para-empresas/cuanto-cuesta/`; en el JSON-LD, mismo texto sin enlace.)

### Puente final

**¿Quieres ver qué parte de tu instaladora conviene automatizar primero?** En la consultoría de 25 minutos vemos cómo os llegan hoy los clientes, cuántas visitas no salen y dónde se va el tiempo, con lo que ya usáis. Si algo se resuelve sin Inteligencia Artificial, te lo decimos claro. Es gratuita para cinco empresas al mes; después, de pago. → `/consultoria-gratuita/?cta=pilar_ia-para-empresas-instaladoras` («Solicitar 1 de las 5 plazas (0 €)»). Nos vemos en la sesión.

### Fuentes (bloque visible, comprobadas el 29/10/2026)
1. Real Decreto 842/2002, Reglamento electrotécnico para baja tensión, art. 18 (BOE-A-2002-18099, texto consolidado).
2. Real Decreto 1027/2007, Reglamento de Instalaciones Térmicas en los Edificios, art. 23 (BOE-A-2007-15820, texto consolidado).
3. Real Decreto 244/2019, condiciones del autoconsumo de energía eléctrica (BOE-A-2019-5089, texto consolidado, última actualización 21/03/2026).
4. Reglamento (UE) 2016/679 (RGPD), arts. 5, 6 y 13 (EUR-Lex).
5. Reglamento (UE) 2024/1689 de Inteligencia Artificial, art. 50 (enlazado a /agentes-ia/#ley).

Próxima revisión: 29 de enero de 2027, o antes si el Vigía confirma la deducción del RDL 7/2026.

### JSON-LD previsto
WebPage + BreadcrumbList (Inicio › IA para empresas › Instaladoras) + Article (`author` `#daniel`, `publisher` `#organization`, fechas del día, `about` «IA para empresas instaladoras», «Placas solares», «Climatización», «Electricidad», `isPartOf` `/ia-para-empresas/#article`, `citation` con las 3 normas del BOE) + FAQPage con las 6 preguntas de arriba, texto idéntico. Sin Review ni AggregateRating.

### Checklist antes de publicar
- [ ] Publicada `/automatizacion-de-procesos/presupuestos/` (2/11): el enlace del H2 del flujo depende de ella.
- [ ] Vigía: deducción del RDL 7/2026 leída en el BOE. Si está, añadir una línea en #oficios (solar) con el porcentaje y la fuente; si no, se publica sin ella.
- [ ] Reverificar los 3 BOE el día de publicar.
- [ ] Grep de palabras prohibidas sobre el HTML, sin raya larga, emojis ni exclamaciones; FAQ visible = JSON-LD.
- [ ] Enlaces internos 200: /agentes-ia/whatsapp/ (y #caso-real), /automatizacion-de-procesos/presupuestos/, /automatizacion-de-procesos/#casos, /agentes-ia/ (y #ley), /ia-para-empresas/cuanto-cuesta/.
- [ ] Madre: enlace desde /ia-para-empresas/ (lista de guías). Sitemap, `llms.txt` y `llms-full.txt` (dist y copia). `gsc-sitemap` y `bing-url`.
