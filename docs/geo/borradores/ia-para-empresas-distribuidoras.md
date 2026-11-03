# Borrador · /ia-para-empresas/distribuidoras/

Estado: **texto completo el 3/11/2026 (10:00, geo_contenido).** Encargo del Jefe del 3/11 (propuesta 1 del Vigía, ficha `docs/geo/sectores/distribucion-b2b-suministros.md`). **No se publica esta semana:** va en la cola después de integración con ERP (vie 6/11). Falta maquetar en `borradores/html/` con `portar_diseno_nuevo.py` y reverificar las fuentes el día que salga.

## Ficha

- **URL:** `https://pebaisystems.es/ia-para-empresas/distribuidoras/` (vertical de `pilares.md` §4, nicho 4 de `estrategia-nichos.md`)
- **Title (≤ 60):** `IA para distribuidoras y suministros industriales | PEBAI` (57)
- **Meta description (≤ 155):** `Distribuidoras y suministros industriales: pedidos de WhatsApp al ERP sin teclearlos, precio y stock fuera de horario y factura electrónica.` (140)
- **H1:** `¿Cómo puede usar la IA una distribuidora de suministros industriales?`
- **Autor:** Daniel Peñuela Ruiz (`#daniel`).
- **CTA:** `/consultoria-gratuita/?cta=pilar_ia-para-empresas-distribuidoras`
- **Breadcrumb:** Inicio › IA para empresas › Distribuidoras

### Anticanibalización (comprobado el 3/11 con `seo-clean-architecture`: sitemap de 19 URLs, `dist/` y borradores)
- No hay nada de distribución, mayoristas ni suministros en el sitemap, en `dist/` ni en `.htaccess`.
- **Frente a `/automatizacion-de-procesos/` (madre del pilar 3):** la madre ya tiene el H2 «Factura electrónica y VeriFactu: qué cambia en tus procesos» (`#factura-electronica`) con las mismas fechas. Aquí **no se repite**: el H2 de factura resume en dos frases lo que importa a una distribuidora (que recibe muchas facturas de proveedor y emite muchas a clientes) y enlaza a la madre para el detalle y VeriFactu. Intención distinta: «IA para mi distribuidora» frente a «qué procesos automatizar».
- **Frente a `/automatizacion-de-procesos/integracion-erp-crm/` (sale el 6/11):** allí, cómo se conecta la IA a cada programa (API, permisos, sin API, mantenimiento). Aquí solo qué datos del ERP necesita el asistente de pedidos (catálogo, tarifa por cliente, stock por almacén) y enlace allí. No se nombran programas.
- **Frente a `/agentes-ia/whatsapp/`:** allí, el agente de WhatsApp en general (app frente a API, plantillas, Meta). Aquí, el pedido B2B que entra por WhatsApp (referencias, cantidades, fotos de la pieza). Enlace allí para lo técnico.
- **Frente a `/automatizacion-de-procesos/presupuestos/`:** la oferta a un cliente profesional se resume en una frase y se enlaza.
- Un solo satélite para el nicho (distribución, suministro industrial y ferretería profesional) mientras la demanda sea baja.

### Fuentes verificadas (abiertas el 3/11/2026)
1. **Agencia Tributaria**, «Calendario de implantación» de la factura electrónica (página actualizada el 13/10/2026), https://sede.agenciatributaria.gob.es/Sede/iva/factura-electronica/calendario-implantacion.html [V]: la Orden HAC/1028/2026 entró en vigor el 6/10/2026; emitir y recibir factura electrónica, 6/10/2027 para quien superó 8 M€ de volumen de operaciones en el año anterior y 6/10/2028 para el resto; comunicar estado de facturas y pagos, 6/10/2027 grandes, 6/10/2028 personas jurídicas, 6/10/2029 personas físicas y entidades en atribución de rentas; los primeros 12 meses los grandes acompañan un PDF legible.
2. **Orden HAC/1028/2026**, de 2 de octubre, BOE núm. 247 de 5/10/2026 (BOE-A-2026-20587), https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-20587 [V]: regula la solución pública de facturación electrónica; entra en vigor el día siguiente a su publicación y abre el cómputo de plazos del Real Decreto 238/2026 (disposición final única).
3. **INE**, Encuesta sobre el uso de TIC y del comercio electrónico en las empresas, año 2025 y primer trimestre de 2026, nota de prensa del 22/10/2026, https://www.ine.es/dyngs/Prensa/ETICCE20251T2026.htm [V]: el 33,6 % de las empresas de 10 o más empleados usó IA en el primer trimestre de 2026; el 29,0 % vendió por comercio electrónico en 2025.
4. **Interempresas**, «El suministro y la ferretería industrial, a debate en el XII Congreso ExpoCadena 2023» (3/03/2023), https://www.interempresas.net/Ferreteria/468787-El-suministro-y-la-ferreteria-industrial-a-debate-en-el-XII-Congreso-ExpoCadena-2023.html [V]: los ponentes hablan de que el cliente exige cada vez más plazo de entrega («Amazon lo maleduca entregándole los pedidos en 24 horas»), de que no todos pueden tener 100.000 referencias en almacén y de que la ventaja del suministro es conocer al cliente. Se usa como pregunta real del sector, sin sus cifras.
5. **Reglamento (UE) 2024/1689**, art. 50 (aviso de que se habla con una IA) y **RGPD** arts. 5, 6 y 13: mismo uso que en instaladoras.
6. **Caso Suministros Industriales Santacruz**: solo lo de `borradores/casos.md` nº 3.

**No se usa:** cifras de ponentes de ExpoCadena (10-15 % en stock, 1-6 M€), el caso anónimo de Javadex (no se pudo abrir entero y es de un proveedor), la noticia de pedidos por WhatsApp de un fabricante de materiales (Construible, 28/02/2024: la página no carga el texto sin navegador; [S]) ni nombres de grupos de compra.

## Esquema

1. Migas, H1, autor, «Actualizado el …».
2. Respuesta corta (40-60 palabras) + resumen en 5 viñetas.
3. 6 H2 (abajo), FAQ (6), puente, fuentes con fecha y próxima revisión.

---

## Texto

**Respuesta corta.** En una distribuidora, la IA trabaja en el pedido: lee lo que llega por WhatsApp, correo o teléfono, lo cruza con vuestro catálogo, la tarifa de ese cliente y el stock de cada almacén, y deja el pedido en borrador en vuestro programa para que alguien lo confirme. Precios, condiciones especiales y plazos los decide siempre una persona. (59 palabras)

**En cinco puntos:**
- El tiempo se va en teclear dos veces: el pedido llega en un mensaje y alguien lo pasa a mano al programa de gestión.
- La IA no inventa referencias: solo propone las que existen en vuestro catálogo, y si duda, pregunta al cliente o a vuestro equipo.
- Fuera de horario puede contestar precio de tarifa y disponibilidad del cliente que ya tenéis dado de alta; lo que no sea tarifa, a una persona.
- La factura electrónica entre empresas será obligatoria el 6 de octubre de 2027 o de 2028 según vuestro tamaño: buena excusa para ordenar ahora el pedido.
- Se empieza por un solo canal (normalmente WhatsApp o el correo de pedidos) y una sede.

### H2 · Dónde se pierde el tiempo en una distribuidora {#tiempo}

Un suministro industrial o una distribuidora B2B vive del pedido repetido: el mismo cliente, las mismas familias de producto, cantidades que cambian. El problema no suele ser vender, sino todo lo que pasa entre que el cliente escribe y el pedido está en el programa:

| Momento | Qué pasa hoy | Qué puede hacer la IA |
|---|---|---|
| Llega el pedido | Por WhatsApp, por correo con un PDF o una foto de la pieza, por teléfono a un comercial | Leer el mensaje o el adjunto y sacar referencias, cantidades y dirección de entrega |
| Comprobar el producto | Alguien busca la referencia, a veces con el nombre que usa el cliente y no el vuestro | Proponer la referencia del catálogo que coincide y marcar las dudosas |
| Precio y stock | Mirar la tarifa del cliente y si hay en este almacén o en otro | Leer la tarifa y el stock del programa (sin tocarlos) y avisar de lo que falta |
| Pasar el pedido | Teclearlo en el ERP | Dejarlo en borrador para que una persona lo confirme con un clic |
| Confirmar al cliente | Llamar o escribir cuando hay tiempo | Mandar la confirmación con lo pedido, lo que falta y la fecha que haya puesto vuestro equipo |

En el XII Congreso ExpoCadena, los propios distribuidores lo resumían así: el cliente es cada vez más exigente con el plazo de entrega y la ventaja del suministro de proximidad es conocer al cliente ([Interempresas, 3/03/2023](https://www.interempresas.net/Ferreteria/468787-El-suministro-y-la-ferreteria-industrial-a-debate-en-el-XII-Congreso-ExpoCadena-2023.html)). Contestar rápido y bien a ese cliente es justo lo que se puede automatizar sin perder el trato.

¿Portal B2B o WhatsApp ordenado? Un portal compensa cuando casi todos los pedidos son recurrentes, el catálogo es amplio y está bien cargado y vuestros clientes lo usan. Si siguen escribiendo por WhatsApp aunque tengáis portal, suele funcionar mejor ordenar ese WhatsApp con un asistente que deja el pedido en el mismo programa, y dejar el portal para quien ya lo usa: las dos vías pueden convivir.

### H2 · Pedidos por WhatsApp y correo sin teclearlos dos veces {#pedidos}

El flujo que proponemos, en cuatro pasos:

1. **Entrada.** El cliente escribe como siempre: un audio, una lista, una foto de la etiqueta o un PDF de su sistema de compras. El asistente responde que lo ha recibido y que es un sistema automático (lo exige el art. 50 del Reglamento europeo de IA).
2. **Lectura y cruce.** Saca cada línea (referencia, descripción, cantidad) y la cruza con vuestro catálogo y con las referencias que ese cliente ha pedido antes. Si una línea no cuadra, no la adivina: pregunta al cliente («¿es la M8 de 40 o de 50?») o la marca para vuestro equipo. Si el cliente escribe «lo mismo que la última vez», el asistente prepara ese pedido a partir del anterior y una persona lo confirma.
3. **Borrador en el programa.** Con la tarifa del cliente y el stock por almacén, deja el pedido en borrador en vuestro ERP. Nunca lo confirma solo.
4. **Confirmación.** Una persona revisa y confirma. Entonces el asistente manda al cliente el resumen y, si el ERP lo tiene, el aviso de salida.

Qué necesita del programa de gestión: catálogo con referencias, tarifa por cliente, stock por almacén y la ficha del cliente. Cómo se conecta cada programa (API, exportaciones, permisos) está en la guía de [integración de la IA con tu ERP y CRM](/automatizacion-de-procesos/integracion-erp-crm/) *(enlace activo desde el 6/11)*. Lo técnico del canal (número, plantillas, la API de WhatsApp Business) está en [cómo automatizar el WhatsApp de una empresa](/agentes-ia/whatsapp/).

Si un cliente profesional pide una oferta en vez de un pedido (obra nueva, cantidades grandes), el flujo es el de los [presupuestos con IA](/automatizacion-de-procesos/presupuestos/): el sistema prepara el borrador y lo aprueba el comercial.

### H2 · Precio, stock y plazo fuera de horario: qué contesta solo y qué pasa a una persona {#fuera-de-horario}

Muchos pedidos se piensan a primera hora en la obra o en el taller del cliente, antes de que abra el mostrador. La regla que usamos:

| Pregunta del cliente | ¿La contesta el asistente? |
|---|---|
| «¿Tenéis X en el almacén de…?» | Sí, si el stock está en el programa. Dice lo que hay, no lo reserva sin confirmación |
| «¿A cuánto me sale?» (cliente dado de alta, producto de tarifa) | Sí, con su tarifa. Precio cerrado o condiciones especiales, no |
| «¿Cuándo me llega?» | Solo si el pedido ya tiene fecha puesta por vuestro equipo. Nunca promete un plazo nuevo |
| Cliente nuevo que pide precio | Recoge sus datos y lo pasa a un comercial |
| Reclamación, devolución, pieza equivocada | A una persona, con el resumen del caso |
| Algo técnico (compatibilidad, normativa del producto) | A una persona: el asistente no asesora |

Así el cliente no se queda sin respuesta y vuestro equipo empieza el día con los pedidos ordenados, no con los mensajes de la noche por leer.

### H2 · Varias sedes, varios idiomas: el caso de Suministros Industriales Santacruz {#caso}

Suministros Industriales Santacruz tiene sedes en España, Francia, Países Bajos y Bélgica. Trabajaban con una aplicación de 20-30 años, débil en seguridad (la llegaron a atacar) y sin las funciones que necesitaban.

Les construimos una **aplicación nueva, segura y a medida**, en 4 idiomas, con control de almacén y pedidos por sede. Nos conectamos a sus herramientas y migramos la base de datos de la antigua. La están empezando a usar y ya tiene cargado el histórico de 2026: **343 pedidos en las 4 sedes, el 97,4 % enviados a técnico.**

Lo que enseña para cualquier distribuidora: antes de poner un asistente a leer pedidos, el catálogo, el stock por sede y los pedidos tienen que estar en un sitio fiable. Si el programa que tenéis no lo permite, la primera fase es esa, no el chat. [Ver el caso completo](/casos-de-exito/suministros-santacruz/).

### H2 · Factura electrónica: ¿2027 o 2028? {#factura-electronica}

Depende de vuestro volumen de operaciones del año anterior: si superó los 8 millones de euros, emitir y recibir factura electrónica será obligatorio desde el **6 de octubre de 2027**; si no, desde el **6 de octubre de 2028** ([Agencia Tributaria, página actualizada el 13/10/2026](https://sede.agenciatributaria.gob.es/Sede/iva/factura-electronica/calendario-implantacion.html); [Orden HAC/1028/2026, BOE del 5/10/2026](https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-20587)). Una distribuidora recibe muchas facturas de proveedor y emite muchas a clientes, así que conviene que los pedidos y albaranes que las originan ya entren ordenados en el programa.

El calendario completo, la comunicación del estado de las facturas y VeriFactu están en [factura electrónica y VeriFactu: qué cambia en tus procesos](/automatizacion-de-procesos/#factura-electronica). Esto es una orientación, no asesoramiento fiscal: confirma las fechas con tu asesoría.

### H2 · Por dónde empezar y cuándo no conviene {#empezar}

Para la mayoría de distribuidoras, el orden es:

1. **Un canal y una sede.** El que más pedidos trae (casi siempre WhatsApp o el correo de pedidos). Se mide cuántos pedidos entran y cuánto se tarda en pasarlos.
2. **Lectura en borrador.** Unas semanas con el asistente leyendo y dejando borradores, y una persona confirmando todo. Así se ve qué referencias confunde.
3. **Respuestas fuera de horario.** Cuando el catálogo y la tarifa están bien, se activa precio y stock para clientes dados de alta.
4. **Más canales y sedes.**

**No conviene (todavía) si:** el stock del programa no se parece al real, cada cliente tiene precios pactados que solo están en la cabeza del comercial, o casi todos los pedidos llegan ya por un portal o EDI que funciona. En esos casos, lo primero es ordenar los datos o no tocar nada.

Según el INE, el 33,6 % de las empresas españolas de 10 o más empleados ya usaba alguna tecnología de IA en el primer trimestre de 2026, y el 29,0 % vendió por comercio electrónico en 2025 ([INE, 22/10/2026](https://www.ine.es/dyngs/Prensa/ETICCE20251T2026.htm)). La diferencia no la marca tener IA, sino aplicarla al pedido, que es donde una distribuidora gana o pierde al cliente.

### FAQ (6, idénticas en el JSON-LD; 3/11 tarde: entran «precios por cliente» y «fuera de catálogo» de `preguntas.md` «Turno 3/11», salen «la pieza con su nombre» (ya en el paso 2 de #pedidos) y «factura electrónica» (ya en su H2 y en la madre))

**¿Puede la IA pasar al ERP los pedidos que llegan por WhatsApp?**
Sí, en borrador. Lee el mensaje, el audio o el PDF, cruza cada línea con vuestro catálogo y la tarifa del cliente y deja el pedido preparado en vuestro programa de gestión. Una persona lo revisa y lo confirma; el asistente nunca confirma un pedido solo.

**¿Cada cliente puede ver solo sus precios?**
Sí. El asistente identifica primero al cliente por el teléfono o el correo que tenéis dado de alta y solo le da los precios de su tarifa. La tarifa no se publica en ningún sitio; si el número no está dado de alta o pide algo fuera de su tarifa, la consulta pasa a un comercial.

**¿Puede contestar precio y stock a las 7 de la mañana?**
Sí, a clientes que ya tenéis dados de alta y con productos de tarifa: dice el precio de su tarifa y lo que hay en cada almacén según el programa. Precios cerrados, condiciones especiales, clientes nuevos y plazos que no estén puestos pasan a una persona.

**Tenemos varias sedes y clientes en otros países: ¿sirve igual?**
Sí, si el stock y los pedidos de cada sede están en un mismo sistema. Es lo que hicimos con Suministros Industriales Santacruz: una aplicación a medida en 4 idiomas con almacén y pedidos por sede, que ya tiene cargados 343 pedidos de 2026 de sus 4 sedes.

**Me piden material que no está en catálogo: ¿cómo evito que se pierda?**
El asistente no da precio ni plazo de lo que no está en catálogo. Apunta lo que pide el cliente (descripción, cantidad y foto si la manda), le dice que lo revisa una persona y lo deja en un listado con fecha y responsable. Así cada petición tiene a alguien que la contesta y se ve cuáles siguen abiertas.

**¿Cuánto cuesta un sistema así para una distribuidora?**
Depende de cuántos canales y sedes entren y de cómo se conecte vuestro programa de gestión. Se presupuesta después de la consultoría, cuando sabemos qué hay que conectar. Qué partidas pedir en un presupuesto: [cuánto cuesta implantar IA en una pyme](/ia-para-empresas/cuanto-cuesta/). *(El enlace solo en el HTML, no en el JSON-LD, como en instaladoras.)*

### Puente final

**¿Quieres ver qué parte de tu distribuidora conviene automatizar primero?**
En una videollamada de 25 minutos miramos cómo os entran los pedidos, qué programa usáis y por dónde empezaríamos. La consultoría es gratuita para 5 empresas al mes; después, de pago. → `/consultoria-gratuita/?cta=pilar_ia-para-empresas-distribuidoras`

### Fuentes (bloque visible; reverificar al publicar)
1. Agencia Tributaria, Calendario de implantación de la factura electrónica (actualizada el 13/10/2026), consultada el 3/11/2026.
2. Orden HAC/1028/2026, de 2 de octubre, BOE núm. 247 de 5/10/2026 (BOE-A-2026-20587), consultada el 3/11/2026.
3. INE, Encuesta sobre el uso de TIC y del comercio electrónico en las empresas, año 2025 y primer trimestre de 2026 (22/10/2026), consultada el 3/11/2026.
4. Interempresas, «El suministro y la ferretería industrial, a debate en el XII Congreso ExpoCadena 2023» (3/03/2023), consultada el 3/11/2026.
5. Reglamento (UE) 2024/1689 de Inteligencia Artificial, artículo 50.
6. Reglamento (UE) 2016/679 (RGPD), artículos 5, 6 y 13.

### Checklist antes de publicar
- [ ] `integracion-erp-crm` publicada (si no, quitar ese enlace o esperar).
- [ ] Reabrir AEAT, BOE e INE; cambiar fechas de consulta.
- [x] Maquetada el 3/11 (15:00) en `borradores/html/ia-para-empresas-distribuidoras.html` con la plantilla publicada de presupuestos (vídeo de automatización); fecha provisional 9/11 (la fija el Jefe; cambiar `2026-11-09` y «9 de noviembre» en todo el archivo). 3 tablas con `caption` y `scope`, captura de Santacruz, 6 FAQ = JSON-LD (la 6.ª con el enlace a cuánto cuesta solo en el HTML), title 57, description 140, respuesta 58 palabras, 0 prohibidas, 390 px sin scroll. Añadida una frase de RGPD (arts. 5, 6.1.b y 13) en `#fuera-de-horario` para que la fuente 6 tenga su sitio. BOE e Interempresas dan 200 el 3/11; la AEAT no carga desde el proxy de la nube (leída esta mañana): reabrir el día de publicar.
- [ ] Sitemap a mano, los 4 `llms`, enlace desde `/ia-para-empresas/#guias` y desde `/automatizacion-de-procesos/#factura-electronica` («si tienes una distribuidora»).
