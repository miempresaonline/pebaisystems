# Borrador · /ia-para-empresas/despachos-y-asesorias/

Estado: **análisis, fuentes y texto completo (6 H2 y 6 FAQ) el 4/11/2026 (turno 15:00, geo_contenido)**, adelantado del encargo del jue 5/11 (tablón, Jefe 3/11 tarde y Preguntas 3/11 tarde). **Conclusión: sí se hace**, con la intención del dueño del despacho o la asesoría que quiere implantar, no la del profesional que busca una herramienta para redactar escritos. Falta: maquetar en `borradores/html/` y reverificar fuentes el día que salga. No tiene día de publicación: va después de ERP (6/11) y de distribuidoras, cuando el Jefe lo ponga.

## Análisis con `seo-clean-architecture` (4/11)

### Intención (dato de `pilares.md` §4)
- «ia para abogados» 390, «inteligencia artificial abogados» 70, «ia para asesorias» 40, «ia para despachos de abogados» 20 (kd 4).
- Las 390 de «ia para abogados» son en su mayoría profesionales que buscan una herramienta para redactar o investigar (lo dice el propio `pilares.md`: 🟡). Esa intención no es la nuestra y no se persigue: no se comparan herramientas jurídicas ni se nombran.
- La intención que sí es nuestra está en las 6 preguntas de `preguntas.md` «Despachos y asesorías»: datos de clientes en ChatGPT, secreto profesional, WhatsApp con IA, documentos del trimestre, citas y llamadas. Son preguntas de **dueño del despacho**, que es quien encarga.
- Search Console (28 días, consultado el 4/11): la URL vieja `/integracion-ia-a3erp-asesorias-espana/` tiene 10 impresiones en posición 8,2 y 0 clics, y hoy hace 301 a `/automatizacion-de-procesos/`. Ninguna consulta con «abogad», «asesor» o «despach» en el periodo. La demanda medida es la de `pilares.md`, no la nuestra todavía.
- **Decisión:** un solo vertical para despachos de abogados, asesorías y gestorías (mismo problema: datos confidenciales de clientes, documentación que se persigue, consultas repetidas). H1 con la pregunta del dueño.

### Anticanibalización (sitemap de 20 URLs, `dist/`, `.htaccess` y borradores, 4/11)
- No hay nada de despachos, abogados ni asesorías en el sitemap.
- **Frente a `/ia-para-empresas/formacion/#politica-de-uso` (publicada hoy, 4/11):** allí, la política de uso de IA para cualquier equipo (4 apartados). Aquí solo lo que cambia en un despacho: el secreto profesional y el contrato de encargado. Dos frases y enlace allí, sin repetir los 4 apartados.
- **Frente a `/automatizacion-de-procesos/integracion-erp-crm/` (sale el 6/11):** allí, cómo se conecta la IA al programa de gestión. Aquí no se explica la conexión; el H2 de documentos del trimestre enlaza allí si el despacho quiere que lo recibido llegue a su programa. No se nombran programas.
- **Frente a `/agentes-ia/whatsapp/` y `/agentes-ia/voz/`:** allí, lo técnico (API de WhatsApp, Meta, grabación de llamadas). Aquí, qué consultas de un cliente de despacho puede contestar el asistente y cuáles pasan siempre a una persona. Enlace a las dos.
- **Redirecciones:** al publicar, pasar de 302 a 301 `agente-ia-despachos-abogados-gestion-expedientes` (`.htaccess:90`) hacia la página nueva (decisión del 23/10: 301 al publicar el destino). `integracion-ia-a3erp-asesorias-espana` se queda donde está (es de ERP).

### Ficha
- **URL:** `https://pebaisystems.es/ia-para-empresas/despachos-y-asesorias/`
- **Title (≤ 60):** `IA para despachos de abogados y asesorías | PEBAI` (49)
- **Meta description (≤ 155):** `Cómo usar la IA en un despacho o una asesoría sin romper el secreto profesional: datos de clientes, WhatsApp, documentos del trimestre y citas.` (143)
- **H1:** `¿Cómo puede usar la IA un despacho o una asesoría sin poner en riesgo los datos de sus clientes?`
- **Autor:** Daniel Peñuela Ruiz (`#daniel`).
- **CTA:** `/consultoria-gratuita/?cta=pilar_ia-para-empresas-despachos-y-asesorias`
- **Breadcrumb:** Inicio › IA para empresas › Despachos y asesorías
- **Caso:** ninguno de los 4 casos reales es un despacho. No se inventa; se enlaza `/casos-de-exito/` solo como prueba de cómo trabajamos.

### Fuentes verificadas (abiertas el 4/11/2026)
1. **Código Penal, art. 199** (texto consolidado del BOE, última actualización 9/04/2026), https://www.boe.es/buscar/act.php?id=BOE-A-1995-25444#a199 [V]: 199.2 «El profesional que, con incumplimiento de su obligación de sigilo o reserva, divulgue los secretos de otra persona, será castigado con la pena de prisión de uno a cuatro años, multa de doce a veinticuatro meses e inhabilitación especial para dicha profesión por tiempo de dos a seis años.»
2. **Ley Orgánica 5/2024, de 11 de noviembre, del Derecho de Defensa, art. 16** (BOE-A-2024-23630, BOE de 14/11/2024), https://www.boe.es/buscar/act.php?id=BOE-A-2024-23630 [V]: 16.1 todas las comunicaciones entre abogado y cliente son confidenciales; 16.5.a el secreto profesional incluye «la inviolabilidad y el secreto de todos los documentos y comunicaciones del profesional de la abogacía, que estén relacionados con el ejercicio de sus deberes de defensa».
3. **RGPD, art. 28.1 y 28.3.a** (DOUE L 119 de 4/05/2016, PDF del BOE), https://www.boe.es/doue/2016/119/L00001-00088.pdf [V]: el responsable elige «únicamente un encargado que ofrezca garantías suficientes»; el contrato estipula que el encargado tratará los datos «únicamente siguiendo instrucciones documentadas del responsable». Es la base para exigir por contrato que el proveedor no use los datos para entrenar.
4. **AEPD**, «Resumen básico de obligaciones y recomendaciones para la gestión de IAG en la AEPD», enero de 2026, https://www.aepd.es/guias/sumario-recomendaciones-iag-aepd.pdf [V]: contratación en modalidad empresarial, cláusulas de no reutilización de datos, evaluar el uso de datos para entrenamiento antes de contratar, no introducir datos personales ni información no pública en sistemas no autorizados.
5. **AEPD**, decálogo «Cuidado con lo que le confIAs», 27/01/2026, https://www.aepd.es/prensa-y-comunicacion/notas-de-prensa/aepd-publica-decalogo-recomendaciones-proteger-privacidad-al-usar-ia [V]: en el trabajo, no compartir información confidencial de la organización, de su personal o de sus clientes; usar casos ficticios.
6. **Reglamento (UE) 2024/1689, art. 50** (aviso de que se habla con una IA) y **art. 4** (formación): mismo uso que en `/ia-para-empresas/formacion/` y `/agentes-ia/`.

**Corrección importante:** el artículo de Copilot Gestoría que trae `preguntas.md` cita el **art. 95 LGT** como «secreto reforzado» del asesor fiscal. Abierto en el BOE el 4/11 (https://www.boe.es/buscar/act.php?id=BOE-A-2003-23186#a95): el art. 95.1 dice «Los datos, informes o antecedentes obtenidos **por la Administración tributaria** en el desempeño de sus funciones tienen carácter reservado». Obliga a Hacienda, no al asesor privado. **No se cita en la página.** Para el asesor fiscal vale el art. 199.2 CP (sigilo profesional) y el RGPD; para el abogado, además, la LO 5/2024.

**No se usa (sin fuente primaria abierta):** «7 de cada 10 despachos usan IA» / 71 % del Barómetro de la Asesoría 2026 de Wolters Kluwer (30/06/2026). La nota de Wolters Kluwer y la de Estrategias de Inversión devuelven 403 (Cloudflare) desde la nube [S]. Si un turno la abre, entra en la respuesta corta como dato del sector; si no, la página sale sin ella.

## Esquema

1. Migas, H1, autor, «Actualizado el …».
2. Respuesta corta (40-60 palabras) + resumen en 5 viñetas.
3. 6 H2:
   1. ¿Puedo meter datos de mis clientes en ChatGPT? {#datos} · hecho
   2. ¿Rompo el secreto profesional si uso IA? {#secreto} · hecho
   3. Contestar a los clientes por WhatsApp con IA: qué sí y qué pasa a una persona {#whatsapp} · hecho
   4. Los documentos del trimestre sin perseguir a cada cliente {#documentos} · hecho
   5. Citas y llamadas sin perder el trato personal {#citas} · hecho (enlaza `/agentes-ia/voz/` para lo técnico, sin repetir sus FAQ)
   6. Por dónde empezar y cuándo no conviene {#empezar} · hecho
4. FAQ (6, idénticas en el JSON-LD), puente, fuentes con fecha y próxima revisión.

---

## Texto

**Respuesta corta.** Sí se puede, con dos condiciones. Los datos de los clientes solo entran en herramientas contratadas por el despacho, con un contrato de encargado del tratamiento que prohíba usarlos para entrenar. Y todo lo que la IA prepara para un cliente lo revisa un profesional antes de enviarlo. Así, la IA contesta, recuerda y ordena; el criterio sigue siendo vuestro. (60 palabras)

**En cinco puntos:**
- ChatGPT o cualquier asistente con cuenta personal gratuita no es sitio para datos de clientes de un despacho.
- Usar un servicio técnico no rompe el secreto profesional por sí solo: importa quién accede a los datos, para qué y con qué contrato.
- Un asistente de WhatsApp puede contestar horarios, qué documentos faltan y en qué estado está un trámite; la consulta de fondo pasa siempre a una persona.
- El trabajo que más se repite en una asesoría es pedir documentos cada trimestre. Se automatiza el recordatorio, no la revisión.
- Se empieza por un solo proceso y con datos que no sean de clientes, para probar.

### H2 · ¿Puedo meter datos de mis clientes en ChatGPT? {#datos}

En una cuenta personal, no. Lo que pegas en una herramienta gratuita queda en manos de un proveedor con el que el despacho no ha firmado nada, y no sabes si lo usará para mejorar su modelo, cuánto tiempo lo guardará ni dónde. La AEPD, en las normas que se ha dado a sí misma para usar IA generativa (enero de 2026), lo resume en dos reglas: no introducir datos personales ni información no pública en herramientas que no estén autorizadas, y contratar la modalidad de empresa con cláusulas de no reutilización de datos.

En un despacho eso se traduce en tres cosas:
1. **Una herramienta contratada por el despacho**, no por cada persona, y una lista de lo que se puede usar.
2. **Un contrato de encargado del tratamiento** con el proveedor (artículo 28 del RGPD): solo trata los datos siguiendo vuestras instrucciones por escrito, y vuestra instrucción es que no los use para entrenar ni para nada que no sea el servicio.
3. **Minimizar.** Para pedir ayuda con un escrito o un cálculo, muchas veces basta con quitar nombres, DNI y cifras que identifican al cliente. La AEPD aconseja describir un caso ficticio cuando sea posible.

Las normas para todo el equipo (qué datos no se pegan, qué herramientas sí, quién revisa) están en [la política de uso de IA para tu equipo](/ia-para-empresas/formacion/#politica-de-uso). Aquí solo cambia una cosa: en un despacho, casi todo lo que llega es confidencial.

### H2 · ¿Rompo el secreto profesional si uso IA? {#secreto}

No por usarla, sino por cómo. El secreto profesional prohíbe divulgar lo que el cliente os ha confiado. El Código Penal castiga al profesional que, «con incumplimiento de su obligación de sigilo o reserva», divulgue los secretos de otra persona (artículo 199.2), con prisión de uno a cuatro años e inhabilitación. Para la abogacía, la Ley Orgánica 5/2024 del Derecho de Defensa añade que todas las comunicaciones con el cliente son confidenciales y que el secreto cubre todos los documentos relacionados con la defensa (artículo 16).

Ninguna de las dos normas prohíbe la tecnología: el despacho ya guarda expedientes en un programa de gestión y correos en un servidor de terceros. Lo que pesa es lo mismo que con esos servicios:
- **Quién puede ver los datos.** Un proveedor que trata los datos solo para daros el servicio, con contrato de encargado, no es lo mismo que una herramienta que los usa para sus propios fines.
- **Para qué se usan.** Si el proveedor puede usar vuestras conversaciones para entrenar su modelo, el riesgo de que algo salga de su sitio ya no lo controláis vosotros.
- **Quién firma.** Lo que la IA redacta lo revisa y lo firma el profesional. La responsabilidad no cambia por haber usado una herramienta.

Si una herramienta no os deja ver ni firmar esas condiciones, no es para datos de clientes. Si tenéis dudas sobre un caso concreto, la respuesta es de vuestro colegio profesional o vuestra asesoría jurídica, no de un proveedor de IA. Tampoco la nuestra.

### H2 · Contestar a los clientes por WhatsApp con IA: qué sí y qué pasa a una persona {#whatsapp}

El cliente de un despacho escribe por WhatsApp las mismas cosas una y otra vez: si ya ha llegado su documento, cuándo vence un plazo, a qué hora abrís, si podéis llamarle. Un asistente puede contestar eso a cualquier hora con la información del despacho, y dejar el resto preparado para el profesional.

| Consulta | Quién contesta |
|---|---|
| Horario, cómo llegar, qué documentos pedimos para un trámite | El asistente |
| Qué documentos le faltan este trimestre | El asistente, leyendo la lista del despacho (sin tocar el expediente) |
| En qué estado está su trámite | El asistente, si el despacho lo tiene apuntado; si no, una persona |
| Una consulta fiscal o jurídica de fondo | Siempre una persona. El asistente recoge la pregunta y avisa |
| Cualquier cosa con un plazo legal o una cifra | Siempre una persona |

Dos reglas que no se negocian: el cliente sabe desde el primer mensaje que habla con un asistente de IA (artículo 50 del Reglamento europeo de IA), y el asistente nunca da una opinión jurídica ni fiscal. Lo técnico (la API de WhatsApp, Meta y las plantillas) está en [agente de WhatsApp con IA](/agentes-ia/whatsapp/).

### H2 · Los documentos del trimestre sin perseguir a cada cliente {#documentos}

En una asesoría, una parte del trimestre se va en pedir lo mismo a cada cliente: facturas emitidas y recibidas, extractos, nóminas. Se pide por correo, se recuerda por WhatsApp, se vuelve a recordar. La IA no revisa la contabilidad; lo que hace bien es la parte repetitiva:
1. **Sabe qué falta.** Cruza la lista de lo que necesita cada cliente con lo que ya ha llegado.
2. **Recuerda solo lo que falta**, por el canal que usa cada cliente y en las fechas que el despacho decida.
3. **Ordena lo que llega.** Clasifica el documento (factura, extracto, nómina) y lo deja en la carpeta del cliente, con un aviso si algo no se puede leer.
4. **Avisa al despacho** de quién no ha mandado nada a pocos días del plazo, para que llame una persona.

La revisión, el criterio y la presentación siguen siendo del asesor. Si queréis que lo recibido llegue además a vuestro programa de gestión, eso es una integración aparte: lo contamos en [cómo conectar la IA con tu ERP o CRM](/automatizacion-de-procesos/integracion-erp-crm/) (enlace activo desde el 6/11).

### H2 · Citas y llamadas sin perder el trato personal {#citas}

En un despacho, el teléfono suena cuando el profesional está con otro cliente o en un juzgado. La llamada que no se coge es un cliente que llama a otro despacho, o uno de los vuestros que se queda sin saber si ha llegado su notificación. Un asistente de voz coge esa llamada y hace lo que haría quien está en recepción:
- **Da cita** en la agenda del profesional que toque, con los huecos que el despacho haya marcado.
- **Toma el recado** con el motivo, lo resume y lo deja al profesional, que llama él con el asunto ya leído.
- **Contesta lo general:** horario, dirección, qué hay que traer a la primera reunión.
- **Pasa la llamada** a una persona si quien llama lo pide, si es urgente o si es un asunto de fondo.

El trato personal no está en decir «está reunido, le llama luego». Está en la reunión y en la llamada en la que se habla del asunto, y esas siguen siendo vuestras. Lo técnico (número, horario en que atiende, conexión con la agenda, aviso de grabación) está en [asistente telefónico con IA](/agentes-ia/voz/).

### H2 · Por dónde empezar y cuándo no conviene {#empezar}

Empezad por lo que no lleva datos de clientes o los lleva poco, para que el equipo se acostumbre sin riesgo:
1. **Normas y herramienta.** Una herramienta de IA contratada por el despacho, con contrato de encargado, y las normas de uso por escrito. Sin esto, lo demás no.
2. **Un proceso repetido.** El recordatorio de documentos del trimestre o el WhatsApp de consultas generales. Uno, con fecha de inicio y una medida de antes (cuántos recordatorios se mandan a mano, cuántos mensajes se contestan al día).
3. **Revisión a las cuatro semanas.** Si ahorra tiempo y nadie se ha quejado, se amplía. Si no, se cambia o se para.

Cuándo no conviene, todavía:
- Un despacho de una persona con pocos clientes, que ya contesta todo en el día: os basta con unas normas para usar bien ChatGPT con cuenta de empresa.
- Si no encontráis una herramienta que firme el contrato de encargado y os deje desactivar el uso de los datos para entrenar. Mejor esperar que meter datos de clientes donde no se controlan.
- Si la idea es que la IA dé el asesoramiento. Eso no se automatiza: se prepara, se ordena y lo firma un profesional.

### FAQ (6, idénticas en el JSON-LD)

**¿Puedo usar ChatGPT en mi despacho o asesoría?**
Sí, con tres condiciones: una cuenta contratada por el despacho y no personal, un contrato de encargado del tratamiento con el proveedor que le prohíba usar los datos para entrenar, y no pegar datos que identifiquen a clientes cuando no hace falta. Lo que prepare la IA lo revisa un profesional antes de enviarlo.

**¿Qué es el contrato de encargado del tratamiento y por qué lo necesito?**
Es el contrato que exige el artículo 28 del RGPD cuando otra empresa trata datos personales por cuenta tuya. Obliga al proveedor a tratarlos solo siguiendo tus instrucciones por escrito. En un despacho, la instrucción clave es que no use los datos de tus clientes para entrenar su modelo ni para ningún fin propio.

**¿Rompe el secreto profesional usar IA con datos de un cliente?**
No por sí solo. El secreto prohíbe divulgar lo que el cliente te ha confiado. Usar un servicio técnico con contrato de encargado, igual que el programa de gestión o el correo, no es divulgar. Sí lo sería usar una herramienta que pueda usar esos datos para sus propios fines. Ante un caso concreto, consulta a tu colegio profesional.

**¿Puede el asistente de WhatsApp dar asesoramiento a mis clientes?**
No. Contesta horarios, qué documentos faltan y en qué estado está un trámite si el despacho lo tiene apuntado. Cualquier consulta fiscal o jurídica de fondo, o con un plazo legal o una cifra, la recoge y avisa a una persona. Y el cliente sabe desde el primer mensaje que habla con un asistente de IA.

**¿Se puede automatizar la petición de documentos del trimestre?**
Sí, la parte repetitiva: saber qué le falta a cada cliente, recordárselo solo a él por su canal y clasificar lo que llega en su carpeta. La revisión de los documentos y la presentación siguen siendo del asesor.

**¿Mis empleados tienen que formarse para usar IA en el despacho?**
Sí. El artículo 4 del Reglamento europeo de IA obliga a cualquier empresa que la use a tomar medidas para que su personal sepa hacerlo según su puesto. En un despacho, lo primero es qué datos de clientes no se pegan y quién revisa. Lo explicamos en [formación en IA para empresas](/ia-para-empresas/formacion/).

### Puente final
«¿Tu despacho pierde horas contestando lo mismo y persiguiendo documentos?» En la consultoría vemos qué consultas y qué tareas se repiten y qué herramientas se pueden usar con datos de clientes. Si con unas normas y una herramienta contratada os basta, te lo decimos claro. 25 minutos, gratuita para 5 empresas al mes; después, de pago. Nos vemos en la sesión.

### Checklist antes de publicar
- [ ] Reabrir las 6 fuentes y poner la fecha.
- [ ] Intentar el Barómetro de Wolters Kluwer (fuente primaria); si no se abre, sin cifra.
- [ ] 0 palabras prohibidas, sin raya larga, emojis ni exclamaciones.
- [ ] 6 FAQ = JSON-LD; Article con autor `#daniel`.
- [ ] Enlaces: formación `#politica-de-uso`, whatsapp, voz, integracion-erp-crm (publicada), casos-de-exito.
- [ ] 301 de `agente-ia-despachos-abogados-gestion-expedientes` a la página nueva.
- [ ] Sitemap, `llms.txt` y `llms-full.txt` (dist y raíz).
