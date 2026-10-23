# Borrador · /automatizacion-de-procesos/

Estado: **texto completo, listo para maquetar y publicar el lunes 26/10** (turno de mañana de geo_contenido). Escrito el 23/10/2026 en el turno de tarde por geo_contenido. Falta: maquetar con la plantilla de /ia-para-empresas/, JSON-LD, controles y publicación.

## Ficha

- **URL:** `https://pebaisystems.es/automatizacion-de-procesos/` (pilar P2 de `docs/geo/pilares.md`).
- **Title:** `Automatización de procesos con IA: qué automatizar y cómo | PEBAI Systems`
- **Meta description (≤ 155):** `Qué tareas de tu empresa se pueden automatizar con Inteligencia Artificial, cómo conectar los programas que ya usáis, qué cambia con la factura electrónica y cuándo no conviene.`
- **H1:** `Automatización de procesos con IA: qué tareas de tu empresa puedes automatizar y cómo`
- **Autor:** Adrián Ballesteros Moscardó (`https://pebaisystems.es/#adrian`). Así quedan dos páginas de cada uno.
- **Fecha visible y dateModified:** el día que se publique.
- **CTA:** `/consultoria-gratuita/?cta=pilar_automatizacion-de-procesos`
- **Palabras (SE Ranking, 21/10):** "automatizacion de procesos con ia" 260, "automatizacion con ia" 260, "automatizacion de procesos" 240, "automatizacion de tareas" 170, "empresas de automatizacion" 140, "automatizar procesos con ia" 90, "automatizacion de procesos empresariales" 70. Conversacionales: "¿qué tareas de mi empresa puedo automatizar?", "¿cómo dejo de copiar datos a mano entre programas?", "¿Qué tareas de una pyme se pueden automatizar con IA?" (batería propuesta en pilares.md §7).

### Anticanibalización (comprobado el 23/10)
- Sitemap: `/`, `/consultoria-gratuita/`, `/posicionamiento-en-ia/`, `/agentes-ia/`, `/ia-para-empresas/`. No existe carpeta `dist/automatizacion-de-procesos/`.
- **/ia-para-empresas/** ya tiene la tabla de tres zonas (Clientes, Operativa, Sistemas), el H2 «¿Hay que cambiar de programas?» (un párrafo) y el caso Fran García Cars con cifras. Aquí: **no repetir** esa tabla ni las cifras de Fran García; esta página baja al detalle de Operativa y Sistemas (qué tarea, cómo se conecta, cómo se decide). En /ia-para-empresas/ cambiar la línea 545 «Automatización de procesos: presupuestos, pedidos, partes y facturas. Próximamente.» por el enlace a esta página (eso lo hace Refresco o Contenido al publicar).
- **/agentes-ia/** = conversación con el cliente (WhatsApp, voz, web). Aquí = trabajo interno. Regla de pilares.md: P2 back-office, P3 atención. El asistente de WhatsApp de Fran García se menciona solo como enlace a /agentes-ia/.
- La home se queda con "consultoría de procesos e IA". Aquí se enlaza a `/` con ancla "consultoría de procesos e Inteligencia Artificial" una vez.
- Aclarar que no es automatización industrial (PLC, robots de planta): parte de la demanda de "empresas de automatizacion" es eso (pilares.md, palabra 6).
- Precio: sin cifras (regla de `agentes.md`).

### Al publicar: .htaccess (pilares.md §5)
Sacar de la lista 302 (`.htaccess:70`) y llevar con **301** a `/automatizacion-de-procesos/`: `empresas-automatizacion-procesos-espana`, `empresas-de-automatizacion-de-procesos-espana`, `optimizacion-procesos-empresariales`, `optimizacion-procesos-industriales`. Como los subpilares aún no existen, llevar también aquí con 301 los que irían a ellos (cuando existan, se cambia el destino): `automatizacion-facturas-pedidos-ia`, `automatizacion-factusol-pedidos-ia`, `integracion-ia-erp-crm-pymes`, `integracion-ia-holded-erp-espana`, `integracion-ia-sage-50-200-espana`, `software-a-medida-para-empresas`, `programas-gestion-empresa-a-medida`, `desarrollo-software-ia-a-medida-espana`, `migracion-procesos-antiguos-a-sistemas-ia`, `reducir-costes-operativos-automatizacion-ia`. **Duda para el Jefe:** `agente-ia-sap-business-one-espana`, `automatizacion-procesos-n8n-empresas` y `zapier-vs-n8n-empresas-espana` van a subpilar/satélite; propongo también 301 aquí (la página habla de las dos cosas). Mismo protocolo que el 23/10: curl -I de cada slug = 301, portada, /consultoria-gratuita/ y /diagnostico/ en 200; si algo da 500, revertir.

### Fuentes verificadas (23/10/2026)

| Dato | Fuente | Comprobado |
|---|---|---|
| 60,9 % de las empresas de 10 o más empleados con Internet usan ERP; 33,9 % usan CRM; 33,6 % usaron IA en el 1T 2026 (21,4 % en las de menos de 10). Datos CNAE-2025, no estrictamente comparables con años anteriores | INE, "Encuesta sobre el uso de TIC y del comercio electrónico en las empresas. Año 2025 - primer trimestre 2026", nota de prensa del 22/10/2026. https://www.ine.es/dyngs/Prensa/ETICCE20251T2026.htm | WebFetch 23/10 |
| UE 2025: 19,95 % de las empresas (10+) usan IA. De las que la usan, 31,05 % para organizar procesos de administración o gestión (28,49 % pequeñas, 43,38 % grandes) y 34,70 % para marketing o ventas | Eurostat, Statistics Explained "Use of artificial intelligence in enterprises", datos extraídos en diciembre de 2025. https://ec.europa.eu/eurostat/statistics-explained/index.php/Use_of_artificial_intelligence_in_enterprises | PDF descargado y leído 23/10 |
| Entre las empresas de la UE que se plantearon usar IA y no lo hicieron: 70,89 % por falta de conocimientos, 52,52 % por dudas legales, 48,83 % por protección de datos; solo 20,68 % porque no les parecía útil | Mismo | Idem |
| Factura electrónica obligatoria entre empresas: desde el 6/10/2027 para facturación de más de 8 millones de euros; desde el 6/10/2028 para el resto de empresarios y profesionales. Real Decreto 238/2026, de 25 de marzo, y Orden HAC/1028/2026, de 2 de octubre (BOE del 5/10/2026) | Agencia Tributaria, noticia del 7/10/2026 (actualizada el 13/10). https://sede.agenciatributaria.gob.es/Sede/todas-noticias/2026/octubre/7/solucion-publica-facturacion-electronica.html ; BOE-A-2026-20587: https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-20587 | WebFetch y búsqueda 23/10 |
| VeriFactu: fecha legal vigente 1/1/2027 (sociedades) y 1/7/2027 (resto), Real Decreto-ley 15/2025, de 2 de diciembre (BOE 3/12/2025). Hacienda anunció en octubre de 2026 que aplazará las obligaciones a octubre de 2028 para alinearlas con la factura electrónica, **pendiente de norma con rango de ley** | Legal Today, 04/12/2025 (RDL 15/2025); CMS, 06/10/2026 (anuncio, sin norma publicada). https://cms.law/es/esp/publication/factura-electronica-b2b-arranca-la-cuenta-atras-y-veri-factu-se-aplaza-a-2028 | Búsqueda y WebFetch 23/10. **Antes de publicar: buscar si ya hay norma en el BOE.** Si no, dejar la redacción de "anunciado". |
| Art. 22 RGPD (decisiones solo automatizadas) y art. 28 (encargado del tratamiento: contrato con quien trata datos por cuenta de la empresa) | Reglamento (UE) 2016/679. https://eur-lex.europa.eu/eli/reg/2016/679/oj?locale=es | Texto legal estable |

**Descartado:** cifras de "X % de ahorro" o "X horas a la semana" de estudios de proveedores; las estadísticas sin fuente de `/diagnostico/`; Eurostat por país (no se pudo extraer el dato de España con seguridad). Los casos de clientes, solo con lo que pone `casos.md`.

## Esquema (mismo diseño que /ia-para-empresas/)

1. Migas: Inicio › Automatización de procesos.
2. Cabecera: kicker "Automatización de procesos con Inteligencia Artificial", H1, autor y fecha.
3. Respuesta corta (caja).
4. Tres tarjetas: "¿Qué puedo automatizar?" (#que-automatizar) · "¿Tengo que cambiar de programa?" (#programas) · "¿Me conviene?" (#cuando-no).
5. H2 Qué es automatizar un proceso con IA (y qué no).
6. H2 Qué tareas de una empresa se pueden automatizar (#que-automatizar, tabla por área).
7. H2 Cómo saber si una tarea merece la pena (cuatro preguntas + cuenta).
8. H2 Qué dicen los datos (INE + Eurostat, figura de barras opcional con 60,9 / 33,9 / 33,6).
9. H2 Conectar los programas que ya usáis (#programas).
10. H2 Cuando el programa se queda corto: herramientas a medida (casos Gargom, Santacruz, Fran García).
11. H2 Factura electrónica y VeriFactu: qué cambia en tus procesos.
12. H2 Cómo se hace un proyecto de automatización, paso a paso.
13. H2 Qué pasa si la automatización se equivoca.
14. H2 Cuánto cuesta automatizar un proceso.
15. H2 Cuándo no conviene automatizar (#cuando-no).
16. H2 Hacerlo tú, contratar una herramienta o encargarlo (tabla).
17. H2 Guías de PEBAI por área.
18. FAQ (6).
19. Puente a la consultoría.
20. Fuentes.

## Texto

### Respuesta corta

**Respuesta corta.** Automatizar un proceso con Inteligencia Artificial es hacer que las tareas que se repiten cada día (pasar pedidos, preparar presupuestos, registrar facturas, rellenar partes) se hagan solas entre los programas que ya usáis. La IA lee documentos y correos que antes había que teclear; una persona revisa lo importante. Se empieza por un proceso y se mide.

(57 palabras.)

### Tarjetas
- **¿Qué puedo automatizar?** Las tareas por área, con ejemplos.
- **¿Tengo que cambiar de programa?** Casi nunca. Cómo se conecta lo que ya tenéis.
- **¿Me conviene?** Cuatro preguntas para decidirlo y cuándo es mejor no hacerlo.

### H2 · Qué es automatizar un proceso con IA (y qué no)

Un proceso es una cadena de pasos que se repite: llega un pedido, se comprueba el stock, se prepara el albarán, se factura. Automatizarlo es que esos pasos ocurran sin que nadie copie datos de un sitio a otro.

Hasta hace poco, la automatización solo servía para pasos con reglas fijas: "si el pedido entra por la web, créalo en el programa de gestión". Funciona bien mientras los datos llegan siempre igual. La Inteligencia Artificial añade lo que faltaba: leer lo que llega de cualquier forma. Un pedido escrito en un correo, un PDF de un proveedor, una foto de un albarán o una nota de voz de un técnico se convierten en datos ordenados que el programa entiende.

La combinación es la que da resultado: reglas fijas para lo que siempre es igual e IA solo en los pasos donde hay que leer, clasificar o redactar. Un sistema que usa IA en todo es más caro y se equivoca más.

Dos aclaraciones:
- **No es automatización industrial.** Programar autómatas, robots o líneas de producción es otro oficio. Aquí hablamos del trabajo de oficina, de comercial y de gestión, aunque la empresa sea una fábrica o una constructora.
- **No es atender a los clientes.** Si lo que se repite son consultas por WhatsApp, llamadas o citas, eso lo hace un agente de IA y lo explicamos en la guía de [agentes de IA](/agentes-ia/). Esta página trata del trabajo interno.

### H2 · Qué tareas de una empresa se pueden automatizar (#que-automatizar)

Las que más tiempo devuelven suelen ser las que alguien hace varias veces al día copiando datos de un sitio a otro.

| Área | Tarea que hoy se hace a mano | Cómo queda automatizada |
|---|---|---|
| Ventas | Preparar un presupuesto a partir de un correo o una visita | El sistema lee la petición, propone las partidas con tus tarifas y deja el presupuesto en borrador para que lo revises |
| Pedidos y almacén | Pasar pedidos que llegan por correo, PDF o teléfono al programa de gestión | Los pedidos entran solos en el programa, con el stock comprobado y las dudas marcadas |
| Administración | Registrar facturas de proveedores en la contabilidad | La IA lee la factura, la asigna al proveedor y a la cuenta, y solo pide revisión cuando algo no cuadra |
| Operaciones y obra | Recoger partes de trabajo, fotos y horas de los técnicos | El técnico lo manda desde el móvil; el parte llega completo, ordenado y vinculado a su obra o cliente |
| Dirección | Montar cada semana el informe de ventas, márgenes o rentabilidad por obra | El informe se actualiza solo con los datos de los programas y avisa de lo que se sale de lo normal |
| Personal | Ordenar candidaturas, documentos y solicitudes que llegan por varios canales | Todo entra en un solo sitio, clasificado, y una persona decide |

Los ejemplos de la tabla son ilustrativos. Más abajo tienes casos reales.

La IA prepara y ordena; las decisiones que afectan a un cliente, a un trabajador o a un pago las sigue tomando una persona.

### H2 · Cómo saber si una tarea merece la pena

Antes de automatizar nada, hazte cuatro preguntas sobre la tarea:

1. **¿Se repite mucho?** Varias veces al día o cada semana, siempre con los mismos pasos.
2. **¿Los datos ya están en formato digital?** Correos, PDF, hojas de cálculo, un programa. Si todo está en papel, el primer paso es otro.
3. **¿Se puede explicar la regla?** Si la persona que la hace sabe decir cómo decide, se puede automatizar. Si depende de un criterio que nadie sabe explicar, mejor dejarla como está.
4. **¿Qué pasa si sale mal?** Un error en un borrador de presupuesto se corrige antes de enviarlo. Un error en un pago, no. Cuanto más caro el error, más control humano necesita.

Para comparar tareas, haz una cuenta sencilla: cuántas veces se hace al mes, por los minutos que lleva cada vez. Por ejemplo, con números redondos: una tarea de 10 minutos que se hace 20 veces al día, 20 días al mes, son unas 67 horas al mes. La que más horas sume y cumpla las cuatro preguntas es por la que conviene empezar.

### H2 · Qué dicen los datos

En España, la mayoría de las empresas ya trabaja con programas donde podría conectarse una automatización. Según el INE, en el primer trimestre de 2026 el **60,9 %** de las empresas de 10 o más empleados usaba un ERP (programa de gestión) y el **33,9 %** un CRM (programa de clientes). El **33,6 %** usó alguna tecnología de Inteligencia Artificial; en las de menos de 10 empleados, el **21,4 %**. El INE avisa de que estos datos no son estrictamente comparables con los de años anteriores, porque ha cambiado la clasificación de actividades.

En la Unión Europea, Eurostat cuenta que en 2025 el 31,05 % de las empresas que usan IA la aplican a organizar procesos de administración o gestión, el segundo uso tras marketing y ventas (34,70 %). En las pequeñas es el 28,49 %; en las grandes, el 43,38 %.

Y lo que frena a las demás no es que no le vean utilidad. Entre las empresas europeas que se plantearon usar IA y no lo hicieron, el 70,89 % señala la falta de conocimientos, el 52,52 % las dudas legales y el 48,83 % la protección de datos. Solo el 20,68 % dice que no le parecía útil.

(Figura opcional: tres barras INE 1T 2026, empresas de 10 o más empleados: ERP 60,9 %, CRM 33,9 %, IA 33,6 %.)

### H2 · Conectar los programas que ya usáis (#programas)

La mayor parte del tiempo perdido en una empresa está entre programas: el presupuesto se hace en uno, el cliente está en otro, la factura en un tercero y alguien copia los datos de uno a otro. Automatizar es, sobre todo, que esos datos pasen solos.

Hay tres formas de conectar un programa, de mejor a peor:
- **Por su API (conexión oficial).** Holded, Odoo, la mayoría de CRM y muchos programas de gestión la tienen. Es la forma más estable.
- **Por exportaciones e importaciones.** Si el programa no tiene API pero exporta e importa ficheros, se automatiza ese intercambio.
- **Por la base de datos o la pantalla.** Para programas antiguos que no tienen ninguna de las dos. Funciona, pero hay que mantenerlo con más cuidado.

Cambiar de programa casi nunca es lo primero. Solo tiene sentido cuando el programa no deja sacar ni meter datos de ninguna forma o cuando ya se le queda corto a la empresa en lo básico. Entonces se decide primero el programa y después se automatiza.

### H2 · Cuando el programa se queda corto: herramientas a medida

A veces el problema no es copiar datos, sino que el programa no hace lo que la empresa necesita. Ahí la respuesta es una herramienta propia, pensada para su forma de trabajar y conectada a lo que ya funciona. Tres casos reales de PEBAI:

- **Construcciones Gargom (construcción).** Trabajaban con un programa antiguo que les limitaba. Les construimos una aplicación para gestionar sus obras: presupuestos, certificaciones, gastos por tipo, pagos, personal, proveedores y la rentabilidad de cada obra, todo en un solo sitio y hecho a su manera.
- **Suministros Industriales Santacruz (suministros industriales, con sedes en España, Francia, Países Bajos y Bélgica).** Tenían una aplicación de hace más de veinte años, débil en seguridad y sin las funciones que necesitaban. Hicimos una nueva, en cuatro idiomas, con control de almacén y pedidos por sede, conectada a sus herramientas y con la base de datos antigua migrada. Ya tiene cargado el histórico de 2026: 343 pedidos de las cuatro sedes.
- **Fran García Cars (importación y revisión de vehículos).** Las revisiones se hacían a mano y las fotos llegaban por WhatsApp, desordenadas. Ahora todo el flujo va en una aplicación, con lecturas automáticas con Inteligencia Artificial en parte del proceso. El caso completo, con cifras, está en la guía de [IA para empresas](/ia-para-empresas/).

Fíjate en lo que tienen en común: en ninguno se empezó por la IA. Se ordenó el proceso y la IA entró donde ahorraba tiempo. (Capturas difuminadas de Gargom y Santacruz: `/casos/img/gargom-app.webp`, `/casos/img/santacruz-app.webp`, con el pie "Captura real con los datos difuminados".)

### H2 · Factura electrónica y VeriFactu: qué cambia en tus procesos

Dos cambios legales van a obligar a muchas empresas a tocar su forma de facturar, y son una buena ocasión para automatizar el resto del proceso.

- **Factura electrónica entre empresas.** El Real Decreto 238/2026 y la Orden HAC/1028/2026 (BOE del 5 de octubre de 2026) la hacen obligatoria desde el **6 de octubre de 2027** para quien facture más de 8 millones de euros al año, y desde el **6 de octubre de 2028** para el resto de empresarios y profesionales. Además de emitir y recibir facturas electrónicas, habrá que informar del estado y del pago de las facturas.
- **VeriFactu.** Es el sistema que obliga a que los programas de facturación registren cada factura sin poder alterarla. Hoy la norma publicada (Real Decreto-ley 15/2025) lo exige desde el 1 de enero de 2027 a las sociedades y desde el 1 de julio de 2027 al resto. Hacienda anunció en octubre de 2026 que lo aplazará a octubre de 2028 para que coincida con la factura electrónica, pero ese cambio aún necesita una norma que lo apruebe.

Lo práctico: pregunta a tu proveedor de programa de facturación cómo y cuándo cumple las dos obligaciones. Si de todas formas vais a tocar la facturación, aprovecha para que los pedidos, los albaranes y las facturas de proveedores entren solos. PEBAI no vende programas de facturación: conectamos el que uséis con el resto de la empresa.

(Al publicar: comprobar en el BOE si ya hay norma del aplazamiento y ajustar la frase.)

### H2 · Cómo se hace un proyecto de automatización, paso a paso

1. **Ver el proceso tal como es.** Quién hace qué, con qué programas, cuántas veces y dónde se atasca. Se mira con la persona que lo hace, además de con dirección.
2. **Elegir un proceso.** El que más horas suma y cumple las cuatro preguntas. Uno, no cinco.
3. **Diseñar la automatización.** Qué pasos van con reglas fijas, cuáles con IA y en cuáles revisa una persona.
4. **Construir y conectar.** Con los programas que ya usáis y con datos de prueba antes que con los reales.
5. **Probar con el equipo.** Unas semanas en paralelo con la forma de trabajar de siempre, hasta que el equipo se fía.
6. **Medir y mantener.** Horas que ya no se dedican, errores, tiempo de respuesta. Los programas cambian y la automatización se revisa con ellos.

Si da resultado, se pasa al siguiente proceso con lo aprendido.

### H2 · Qué pasa si la automatización se equivoca

Se va a equivocar alguna vez, igual que una persona. Lo importante es que el error se vea y no llegue lejos:

- **Revisión humana donde el error sale caro.** Pagos, precios a clientes, datos de trabajadores. La IA prepara y una persona aprueba.
- **Avisos en lugar de silencios.** Si un pedido no cuadra o una factura no se entiende, el sistema la aparta y avisa, en vez de inventarse el dato.
- **Registro de todo lo que hace.** Para saber qué pasó, cuándo y con qué datos.
- **Protección de datos.** El artículo 22 del RGPD limita las decisiones que se toman solo de forma automatizada y afectan de verdad a una persona, y el artículo 28 obliga a tener un contrato con quien trata datos por cuenta de tu empresa, incluido quien monta y mantiene la automatización.

### H2 · Cuánto cuesta automatizar un proceso

Depende de la empresa: del proceso, de cuántos programas hay que conectar, de si tienen conexión oficial o no y de si hace falta una herramienta nueva. Por eso no damos una cifra sin conocer el caso: se presupuesta después de la consultoría, cuando ya sabemos qué proceso conviene y qué programas intervienen.

Al comparar presupuestos, pide que separen el proyecto (construir y conectar) de los costes de uso (licencias, consumo de IA, mantenimiento), y que te digan quién arregla la automatización cuando un programa cambie.

### H2 · Cuándo no conviene automatizar (#cuando-no)

- **Cuando el proceso no está claro.** Si cada persona lo hace a su manera, automatizarlo multiplica el desorden. Primero se ordena.
- **Cuando la tarea es rara.** Lo que se hace una vez al mes rara vez compensa.
- **Cuando la decisión necesita criterio y nadie sabe explicarlo.** Se automatiza la preparación, no la decisión.
- **Cuando el programa está a punto de cambiar.** Mejor esperar al nuevo y conectar ese.
- **Cuando se resuelve sin IA.** A veces basta con una plantilla, una regla del programa o un formulario. Si es así, te lo decimos claro.

### H2 · Hacerlo tú, contratar una herramienta o encargarlo

| | Hacerlo tú | Herramienta de suscripción | Encargarlo |
|---|---|---|---|
| Para qué sirve | Conectar dos programas con una regla sencilla | Un proceso estándar (por ejemplo, leer facturas) en programas conocidos | Procesos propios, varios programas o programas antiguos |
| Qué necesitas | Alguien del equipo con tiempo y gusto por la tecnología | Que la herramienta encaje con tu forma de trabajar | Dedicar tiempo a explicar el proceso al principio |
| Riesgo | Que solo lo entienda quien lo montó | Adaptar tu proceso a la herramienta | Elegir mal al proveedor |
| Cuándo encaja | Primeras pruebas, tareas pequeñas | Cuando tu proceso es como el de todos | Cuando el proceso es lo que os diferencia o toca muchos sistemas |

Herramientas como n8n, Make o Zapier sirven para empezar por tu cuenta. Si eliges encargarlo, en la guía de [IA para empresas](/ia-para-empresas/#elegir-consultora) tienes seis criterios para elegir con quién.

### H2 · Guías de PEBAI por área

- **[Cómo implantar Inteligencia Artificial en tu empresa](/ia-para-empresas/).** Por dónde empezar, qué exige la ley y cómo elegir consultora.
- **[Agentes de IA para atender a tus clientes](/agentes-ia/).** WhatsApp, teléfono y web.
- **[Cómo aparecer en ChatGPT y en las respuestas de IA de Google](/posicionamiento-en-ia/).** Que las IAs recomienden tu empresa.
- **Presupuestos, facturas y pedidos.** Próximamente.
- **Conectar la IA con tu ERP o CRM (Holded, Odoo, Sage).** Próximamente.

### FAQ (idéntica en el JSON-LD FAQPage)

1. **¿Qué procesos de una empresa se pueden automatizar con IA?**
   Los que se repiten con los mismos pasos y trabajan con datos digitales: pasar pedidos al programa de gestión, registrar facturas de proveedores, preparar borradores de presupuesto, recoger partes de trabajo y montar informes. La IA se usa en los pasos donde hay que leer correos, PDF o fotos; el resto va con reglas fijas.

2. **¿Qué diferencia hay entre automatizar con reglas y automatizar con IA?**
   Las reglas fijas sirven cuando los datos llegan siempre igual. La Inteligencia Artificial sirve cuando llegan de cualquier forma: un pedido escrito en un correo, un PDF de proveedor o una foto de un albarán. Lo que mejor funciona es combinarlas: reglas para lo estable e IA solo donde hay que leer o clasificar.

3. **¿Tengo que cambiar de programa de gestión para automatizar?**
   Casi nunca. La mayoría de programas se pueden conectar por su API, por exportaciones o, en los antiguos, por su base de datos. Solo conviene cambiar cuando el programa no deja sacar ni meter datos o ya se le queda corto a la empresa en lo básico.

4. **¿Cuánto cuesta automatizar un proceso?**
   Depende de la empresa: del proceso, de los programas que hay que conectar y de si hace falta una herramienta nueva. Se presupuesta después de la consultoría, cuando se sabe qué proceso conviene. Pide siempre que separen el proyecto de los costes de uso y del mantenimiento.

5. **¿La automatización va a sustituir a mi equipo?**
   No es el objetivo. Quita las tareas de copiar y pegar para que el equipo dedique su tiempo a lo que necesita criterio: atender clientes, decidir, resolver problemas. Las decisiones que afectan a clientes, trabajadores o pagos las sigue aprobando una persona.

6. **¿Qué cambia con la factura electrónica obligatoria y VeriFactu?**
   La factura electrónica entre empresas será obligatoria desde el 6 de octubre de 2027 para quien facture más de 8 millones de euros y desde el 6 de octubre de 2028 para el resto. VeriFactu está previsto para 2027, con un aplazamiento a octubre de 2028 anunciado por Hacienda y pendiente de aprobarse. Es buen momento para automatizar la facturación entera.

### Puente a la consultoría

**H2:** Si quieres saber qué proceso de tu empresa conviene automatizar primero

En la consultoría revisamos contigo cómo trabajáis: qué tareas se repiten, con qué programas y dónde se pierde el tiempo. Te llevas el mapa técnico con el proceso por el que conviene empezar, cómo se conectaría con lo que ya usáis y lo que no merece la pena automatizar.

Son 25 minutos por videollamada. Es gratuita para cinco empresas al mes; cuando se completan, pasa a ser de pago.

Botón: **Solicitar 1 de las 5 plazas** → `/consultoria-gratuita/?cta=pilar_automatizacion-de-procesos`

Nos vemos en la sesión.

### Fuentes (bloque final, con fecha de consulta 23/10/2026; actualizar al publicar)

- INE. Encuesta sobre el uso de TIC y del comercio electrónico en las empresas, año 2025 - primer trimestre 2026. Nota de prensa del 22/10/2026.
- Eurostat. Use of artificial intelligence in enterprises. Statistics Explained, datos extraídos en diciembre de 2025.
- Agencia Tributaria. Solución pública de facturación electrónica: publicada la Orden HAC/1028/2026. 07/10/2026.
- BOE. Orden HAC/1028/2026, de 2 de octubre (BOE-A-2026-20587).
- Real Decreto-ley 15/2025, de 2 de diciembre (plazos de VeriFactu).
- Reglamento (UE) 2016/679 (RGPD), artículos 22 y 28.

## JSON-LD (al maquetar)
WebPage + BreadcrumbList (Inicio › Automatización de procesos) + Article (author `#adrian`, publisher `#organization`, about: "Automatización de procesos", mentions: Construcciones Gargom, Suministros Industriales Santacruz, Fran García Cars como `Organization` sin URL salvo la que ya use la portada) + FAQPage con las 6 de arriba, texto idéntico.

## Checklist de publicación (lunes)
- [ ] Buscar si el aplazamiento de VeriFactu ya está en el BOE y ajustar el H2 y la FAQ 6.
- [ ] Maquetar copiando la estructura de `dist/ia-para-empresas/index.html`.
- [ ] Grep de palabras prohibidas, raya larga, emojis y exclamaciones sobre el HTML.
- [ ] JSON-LD válido (python json.loads de cada bloque) y FAQ idéntica.
- [ ] Enlaces internos: `/ia-para-empresas/` (+ ancla #elegir-consultora, comprobada el 23/10), `/agentes-ia/`, `/posicionamiento-en-ia/`, `/`, imágenes `/casos/img/*`.
- [ ] sitemap.xml, llms.txt y llms-full.txt (dist y raíz de website-pebai), .htaccess 301.
- [ ] En /ia-para-empresas/, cambiar el «Próximamente» de automatización por el enlace (y avisar a Refresco para el enlace en contexto desde /agentes-ia/).
- [ ] Push, comprobar 200 y 301, `gsc-sitemap`, `bing-url`, marcar en el plan, borrar este borrador.
