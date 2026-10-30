# Borrador · /ia-para-empresas/como-elegir-consultora/

**Maquetada el 30/10 (15:00) en `borradores/html/ia-para-empresas-como-elegir-consultora.html` con el diseño nuevo de guías** (fechada el 4/11, cambiar si el Jefe elige otro día): 6 H2 + FAQ, tabla de 7 criterios con `caption` y `scope`, la tabla de comparar con celdas vacías pasa a lista de 7 preguntas, enlace de presupuesto corregido a `/ia-para-empresas/cuanto-cuesta/#que-pedir` (`#presupuesto` no existe), la FAQ 5 lleva la frase de Valencia también en el JSON-LD para que sean idénticas. Comprobado: respuesta de 57 palabras, 6 FAQ = JSON-LD, 0 prohibidas, title 56 y description 152, un H1, anclas internas que existen, BOE 200 (art. 45 de la LPI releído hoy), EUR-Lex 202 desde la nube, 390 px sin scroll horizontal. Al publicar: reverificar fuentes, cambiar fecha si hace falta, copiar a `dist/ia-para-empresas/como-elegir-consultora/index.html` y lo de la checklist.

Estado: **texto completo el 30/10/2026 (turno de las 10:00), sin maquetar.** Encargo del Jefe del 29/10 tarde (`tareas.md`, Contenido): guía para el comprador con criterios que se puedan comprobar. Responde a P4 y P5 del set (`docs/geo/prompts.md`), donde hoy salen rankings que publican las propias consultoras (Medición 29/10: P4 y P16 sin PEBAI). Falta: maquetar en `borradores/html/` con el diseño de /ia-para-empresas/cuanto-cuesta/ y publicar el día que decida el Jefe (cola: presupuestos el lun 2/11; después instaladoras).

## Ficha

- **URL:** `https://pebaisystems.es/ia-para-empresas/como-elegir-consultora/`
- **Title (≤ 60):** `Cómo elegir una consultora de IA para tu empresa | PEBAI` (55)
- **Meta description (≤ 155):** `Criterios que se pueden comprobar antes de contratar una consultora de IA: casos, alcance por escrito, cuentas y código a tu nombre, datos y cómo salir.` (151)
- **H1:** `¿Cómo elijo una consultora de Inteligencia Artificial para mi empresa?`
- **Autor:** Daniel Peñuela Ruiz (`#daniel`). Fecha visible y `dateModified` del día de publicación.
- **CTA:** `/consultoria-gratuita/?cta=pilar_como-elegir-consultora`
- **Palabras (pilares.md, P1 subpilar 2):** intención «elegir proveedor». Conversacionales: P4 «¿Qué empresa me recomiendas para automatizar procesos con IA en España?», P5 «Mejores consultoras de inteligencia artificial para pymes en España», y `preguntas.md` del 29/10: «¿Qué debo preguntar a una empresa de IA antes de contratarla?».
- **301 al publicar:** ninguna URL vieja es de elegir consultora (comprobado en `pilares.md` §5 y `.htaccess`).

### Anticanibalización (comprobado el 30/10 con `seo-clean-architecture`: sitemap, carpetas de `dist/` y H2 de las páginas)
- Sitemap y `dist/`: no existe `/ia-para-empresas/como-elegir-consultora/` ni otra URL de elegir proveedor.
- **/ia-para-empresas/ `#elegir-consultora`** (madre): se queda con el resumen de 6 criterios en una frase cada uno y la nota sobre rankings. Al publicar, añadir al final del H2: «Cómo comprobar cada criterio, qué debe decir el contrato y cómo comparar dos propuestas: [guía para elegir consultora](/ia-para-empresas/como-elegir-consultora/)». Aquí va el detalle comprobable, lo legal y la comparación de propuestas.
- **/ia-para-empresas/ `#alternativas`** (herramienta, tu equipo o consultora): no se repite la tabla. Aquí se parte de que ya se ha decidido contratar a alguien de fuera; se enlaza en «Cuándo no conviene».
- **/sobre-pebai/ `#antes-de-contratar`** (borrador maquetado, sin publicar): allí, las 12 preguntas con lo que consta **de PEBAI**. Aquí, la guía general para cualquier consultora, sin hablar de PEBAI salvo en el puente final. Enlace entre las dos cuando /sobre-pebai/ esté publicada (hasta entonces, no se enlaza: daría 404).
- **/ia-para-empresas/valencia/ `#que-preguntar`** y `#pequena-o-grande`: versión local en 5 preguntas y el tamaño de la consultora. Aquí no se repite el bloque de tamaño: una FAQ breve que enlaza a Valencia para el detalle. En Valencia, Refresco puede enlazar aquí desde `#que-preguntar` (encargo al publicar).
- **/ia-para-empresas/cuanto-cuesta/ `#presupuesto`**: las partidas de un presupuesto de IA están allí. Aquí solo «separa pagos únicos y mensuales» y enlace.

### Fuentes verificadas (30/10/2026)

| Dato | Fuente | Comprobado |
|---|---|---|
| La cesión de derechos de explotación «queda limitada» a los derechos y modalidades expresamente previstos y al tiempo y territorio que se fijen; sin plazo, cinco años; sin territorio, el país de la cesión; si no se concretan las modalidades, solo lo que se deduzca necesariamente del contrato | Real Decreto Legislativo 1/1996, Ley de Propiedad Intelectual (LPI), art. 43.1 y 43.2, texto consolidado del BOE (última actualización 30/03/2022). https://www.boe.es/buscar/act.php?id=BOE-A-1996-8930 | Texto leído en el BOE 30/10 |
| «Toda cesión deberá formalizarse por escrito» | LPI, art. 45 | Leído en el BOE 30/10 |
| Programa de ordenador incluye su documentación preparatoria; la documentación técnica y los manuales tienen la misma protección | LPI, art. 96.1 | Leído en el BOE 30/10 |
| Si el programa lo crea un **trabajador asalariado** en sus funciones, los derechos de explotación (fuente y objeto) son del empresario salvo pacto. La ley no prevé lo mismo para un proveedor externo: autor es quien lo crea (97.1) | LPI, art. 97.1 y 97.4 | Leído en el BOE 30/10 |
| El encargado del tratamiento no recurre a otro encargado sin autorización previa por escrito del responsable | RGPD, art. 28.2. Texto del DOUE L 119 de 4/05/2016 en el BOE: https://www.boe.es/doue/2016/119/L00001-00088.pdf | PDF leído 30/10 |
| Contrato obligatorio con objeto, duración, naturaleza, finalidad, tipo de datos y categorías de interesados; tratar solo con instrucciones documentadas; confidencialidad; medidas del art. 32; al terminar, «a elección del responsable, suprimirá o devolverá todos los datos personales» | RGPD, art. 28.3 y 28.3.a), b), c), g) | PDF leído 30/10 |
| Elegir solo un encargado que ofrezca garantías suficientes | RGPD, art. 28.1 | PDF leído 30/10 |
| Quien presta servicios por internet debe dar acceso permanente, fácil y gratuito a su nombre o denominación social, domicilio, email, datos del Registro Mercantil y NIF | Ley 34/2002 (LSSI), art. 10.1.a), b) y e), texto consolidado del BOE (última actualización 23/01/2025). https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758 | Leído en el BOE 30/10 |
| Art. 4 (alfabetización en IA tras el Ómnibus 2026/1744) y art. 50 (avisar de que se habla con una IA, desde el 2/08/2026, sin aplazar; solo el 50.2 tiene prórroga al 2/12/2026) | Ya verificados y publicados en /ia-para-empresas/formacion/ y /agentes-ia/voz/ (30/10) | Se enlazan, no se repiten |
| Casos: Santacruz (app nueva que sustituye otra de 20-30 años, base de datos migrada); Fran García Cars (app de revisiones a la que se siguen añadiendo funciones; asistente de WhatsApp que pasa a una persona lo no documentado) | `docs/geo/borradores/casos.md` (Daniel, 22/10) | Sin cifras ni frases del cliente |

**Descartado:** el umbral «una gran consultora solo compensa por encima de ~500 empleados o 100.000 €» (blog de un competidor, de parte, sin estudio); los «nueve criterios» de guías extranjeras (no aportan dato); porcentajes de proyectos de IA que fracasan (cifras de consultoras sin método público); nombres de competidores y precios. Lo de licencias de código abierto se menciona sin detalle legal (cada licencia es distinta; no hay fuente oficial española que citar).

`[PREGUNTA A DANIEL]` ninguna. La página no afirma nada de PEBAI salvo en el puente (consultoría de 25 minutos, 5 plazas al mes y después de pago) y los dos casos de `casos.md`.

## Esquema (diseño de /ia-para-empresas/cuanto-cuesta/)

Respuesta corta · En cinco puntos · 3 tarjetas de entrada (`#criterios`, `#propiedad`, `#comparar`) · 6 H2 · FAQ (6) · puente · fuentes.

## Texto

**Respuesta corta.** Elige por lo que puedes comprobar, no por un ranking. Pide casos con nombre a los que puedas llamar, el alcance y los entregables por escrito, las cuentas, el código y los datos a nombre de tu empresa, los pagos únicos separados de los mensuales y cómo se sale. Lo que no ponga por escrito, no cuenta. (57 palabras)

**En cinco puntos:**
- Antes de pedir propuestas, escribe en una hoja qué proceso quieres resolver, con qué volumen y con qué programas. Así todas responden a lo mismo.
- Los criterios que valen son los que se comprueban: casos con nombre y fecha, quién hará el trabajo, alcance cerrado, cuentas a tu nombre y salida pactada.
- Lo que no diga el contrato no es tuyo por haberlo pagado: la Ley de Propiedad Intelectual exige que la cesión del código conste por escrito y la limita a lo que se pacte.
- Si la consultora va a tratar datos de tus clientes, tiene que firmar contigo un contrato de encargado del tratamiento (art. 28 del RGPD), que dice qué pasa con esos datos al terminar.
- Los rankings de «mejores consultoras» los publican a menudo las propias consultoras. Sirven para conocer nombres, no para decidir.

### H2 · Antes de pedir propuestas: escribe qué quieres resolver {#antes}

Si llamas a tres consultoras con «queremos meter IA», cada una te venderá lo que mejor sabe hacer y no podrás comparar nada. Media hora con una hoja lo evita:

1. **El proceso.** Uno, concreto: «contestar las consultas de WhatsApp fuera de horario», «pasar los pedidos del correo al programa de gestión», «preparar los presupuestos». No «mejorar la atención».
2. **El volumen.** Cuántas veces pasa a la semana y cuánto tiempo lleva cada vez. Una estimación honesta basta.
3. **Los programas.** Con qué trabajáis hoy (programa de gestión, CRM, agenda, hojas de cálculo, correo) y si queréis seguir con ellos.
4. **Quién lo usará y quién responde.** La persona del equipo que va a convivir con el sistema y la que decidirá si funciona.
5. **Qué resultado justifica seguir.** Una cifra que podáis medir: horas al mes, consultas sin contestar, días que tarda un presupuesto.

Manda la misma hoja a todas. Una consultora que la lee y te hace preguntas sobre ella va bien; una que responde con un catálogo de productos, no tanto.

### H2 · Siete criterios que se pueden comprobar {#criterios}

En la [guía para implantar IA en tu empresa](/ia-para-empresas/#elegir-consultora) están los criterios en una frase. Aquí, cómo comprobar cada uno y qué debería hacerte desconfiar.

| Criterio | Cómo se comprueba | Señal de alerta |
|---|---|---|
| Casos reales | Empresas con nombre, qué se hizo, cuándo y qué sistema usan hoy. Pide hablar con una. | Solo logotipos, demostraciones preparadas o «casos» sin nombre ni fecha |
| Quién hará el trabajo | Nombres de quien diseña y construye, además de quien vende. Que esté en la primera reunión técnica. | La persona que vende desaparece al firmar y el trabajo lo hace alguien que no conoces |
| Alcance por escrito | Qué proceso queda funcionando, con qué programas se conecta, qué se entrega y cómo se da por terminado (criterio de aceptación). | Horas sin tope, alcance «a definir» o una lista de tecnologías en lugar de resultados |
| Cuentas a tu nombre | Servidor, cuenta del modelo de IA, número de WhatsApp Business, dominio: a nombre de tu empresa, con tu acceso de administrador. | «Lo alojamos nosotros» sin decir dónde ni qué pasa si te vas |
| Costes separados | Lo que se paga una vez (construirlo) y lo que se paga cada mes (consumo, licencias, mantenimiento), y cómo crece con el volumen. | Una sola cifra mensual que mezcla todo, o consumo «incluido» sin límite escrito |
| Datos | Qué herramientas y modelos se usan, en qué país se procesan los datos, si el plan los usa para entrenar y el contrato de encargado del tratamiento. | No saber decirte qué proveedores tocan tus datos |
| Salida | Qué te entregan si dejas de trabajar con ellos: código, documentación, accesos y copia de los datos, y en qué plazo. | Salir significa empezar de cero |

Comprueba también lo básico: quien vende por internet tiene que publicar su nombre o razón social, domicilio, email, NIF y, si es una sociedad, sus datos del Registro Mercantil (art. 10 de la LSSI). Si el aviso legal de su web no los tiene, pregunta por qué.

### H2 · A nombre de quién quedan las cuentas, el código y los datos {#propiedad}

Es la parte que más se olvida y la que más cuesta arreglar después.

**El código y la documentación.** Un programa de ordenador, con su documentación técnica y sus manuales, está protegido por la Ley de Propiedad Intelectual (art. 96). Cuando lo crea un trabajador de tu plantilla, los derechos de explotación son de tu empresa salvo pacto (art. 97.4). Cuando lo crea una consultora, la ley no dice lo mismo: los derechos pasan a tu empresa solo si se ceden, y esa cesión:
- tiene que constar **por escrito** (art. 45);
- queda **limitada a lo que diga el contrato**: los derechos y usos que se nombren, el tiempo y el territorio. Si no fija plazo, se entiende por cinco años; si no fija territorio, el país donde se firma; si no concreta los usos, solo los indispensables para lo que se contrató (art. 43).

Por eso conviene que la propuesta diga, con estas palabras o parecidas, qué se cede (código fuente, configuración, documentación), para qué usos (usar, modificar, que lo mantenga otro proveedor), por cuánto tiempo y dónde. Si la consultora usa piezas propias que reutiliza en otros clientes o componentes de código abierto, que lo diga y explique con qué licencia quedan. Con un contrato de por medio, la última palabra la tiene tu asesoría jurídica.

**Las cuentas.** El servidor, la cuenta del proveedor del modelo de IA, el número y la cuenta de WhatsApp Business, el dominio y el repositorio del código deberían estar a nombre de tu empresa, con la consultora como usuario invitado. Si la consultora paga algo por ti y te lo factura, que conste qué es y cómo se traspasa.

**Los datos.** Si la consultora trata datos personales de tus clientes o de tu equipo por encargo tuyo, tu empresa es la responsable y ella la encargada. El RGPD (art. 28) exige un contrato que diga qué datos, para qué y durante cuánto tiempo, que solo los trate con tus instrucciones por escrito, que guarde confidencialidad y seguridad, que no meta a otro proveedor sin tu autorización por escrito y que, al terminar, **borre o te devuelva todos los datos, a tu elección**.

En Suministros Industriales Santacruz sustituimos una aplicación de veinte a treinta años y migramos su base de datos a la nueva. Que los datos estuvieran accesibles y fueran suyos es lo que permitió cambiar sin perder el histórico.

### H2 · Cómo comparar dos propuestas {#comparar}

Con la hoja del principio, las propuestas se pueden poner una al lado de otra:

| Pregunta | Propuesta A | Propuesta B |
|---|---|---|
| ¿Resuelve el proceso de la hoja o propone otro? | | |
| ¿Qué queda funcionando y cómo se da por terminado? | | |
| ¿Con qué programas se conecta y cómo? | | |
| ¿Qué se paga una vez y qué cada mes? | | |
| ¿A nombre de quién quedan cuentas, código y datos? | | |
| ¿Quién lo mantiene, en cuánto tiempo responde y qué incluye la cuota? | | |
| ¿Cómo se sale y qué te entregan? | | |

Cómo leer un presupuesto partida a partida está en [cuánto cuesta implantar IA en una pyme](/ia-para-empresas/cuanto-cuesta/#presupuesto).

**Empezar por un piloto.** Si el proyecto es grande, pide una primera fase pequeña con el criterio de éxito de la hoja escrito antes de empezar. Si se cumple, se sigue; si no, sabes cuánto has invertido y por qué se para.

**Señales que engañan:**
- **Rankings de «mejores consultoras».** Muchos los publica una consultora que se pone primera. Sirven para conocer nombres.
- **Promesas con porcentaje.** Un porcentaje de ahorro dado antes de conocer tu proceso es una cifra de folleto. Lo serio es decir cómo se va a medir.
- **Todo le parece buena idea.** Una consultora que no descarta nada no ha mirado tu proceso.
- **Cambiarlo todo.** Si la propuesta obliga a sustituir el programa de gestión, tiene que explicar por qué no se puede conectar al que ya usáis.

### H2 · Lo que la ley pide a tu empresa aunque lo implante otro {#ley}

Contratar fuera no traslada a la consultora todas las obligaciones. Tres que siguen siendo de tu empresa:
- **Formar al equipo que lo usa.** El artículo 4 del Reglamento europeo de IA pide a las empresas que usan sistemas de IA medidas para que su personal sepa usarlos. La consultora puede darte esa formación, pero que conste. Detalle en [formación en IA para empleados](/ia-para-empresas/formacion/).
- **Avisar de que habla una IA.** Si el sistema atiende a tus clientes por WhatsApp, teléfono o web, la persona tiene que saber que habla con una IA desde el 2 de agosto de 2026 (art. 50). Pide que el aviso esté en el diseño; ejemplo en el [agente de voz](/agentes-ia/voz/#avisos).
- **Los datos de tus clientes.** Ante ellos responde tu empresa. De ahí el contrato de encargado del apartado anterior y una política de privacidad que diga qué herramientas los tratan.

### H2 · Cuándo no conviene contratar una consultora {#cuando-no}

- Si una herramienta por suscripción ya resuelve tu caso tal cual. Compara antes en [hacerlo tú, una herramienta o una consultora](/ia-para-empresas/#alternativas).
- Si no hay nadie en tu empresa que vaya a usar el sistema y a decir si funciona.
- Si el proceso cambia cada mes y todavía no sabéis cómo queréis trabajar.
- Si el volumen es tan bajo que la tarea os lleva unos minutos a la semana.

Lo que se construye también hay que mantenerlo: en Fran García Cars la aplicación de revisiones se sigue ampliando con funciones nuevas mientras el equipo la usa a diario. Si no vais a querer acompañamiento, preguntad desde el principio cómo lo mantendríais vosotros.

### FAQ (6, idénticas en el JSON-LD)

1. **¿Qué preguntar a una consultora de IA antes de contratarla?**
   Qué casos con nombre puedes comprobar, quién hará el trabajo, qué queda funcionando y cómo se da por terminado, a nombre de quién quedan las cuentas, el código y los datos, qué se paga una vez y qué cada mes, y qué te entregan si dejas de trabajar con ella. Si no lo pone por escrito, descártala.

2. **¿De quién es el código si lo desarrolla una consultora?**
   Si el contrato no lo dice, no pasa a tu empresa por haberlo pagado. Según la Ley de Propiedad Intelectual, la cesión tiene que constar por escrito y se limita a los usos, el tiempo y el territorio que se pacten; sin plazo, se entiende por cinco años. Pide que la propuesta diga qué se cede y para qué.

3. **¿Qué tiene que firmar la consultora si va a tratar datos de mis clientes?**
   Un contrato de encargado del tratamiento (art. 28 del RGPD): qué datos trata y para qué, que solo siga tus instrucciones por escrito, confidencialidad y seguridad, que no meta a otro proveedor sin tu autorización y que al terminar borre o te devuelva los datos, a tu elección.

4. **¿Sirven los rankings de mejores consultoras de IA?**
   Para conocer nombres, sí; para decidir, no. Muchos los publica una consultora que se coloca la primera. Decide con criterios que puedas comprobar: casos con nombre, alcance por escrito, cuentas a tu nombre y una conversación sobre tu proceso.

5. **¿Mejor una consultora grande, una pequeña o un freelance?**
   Depende del proyecto, no del tamaño. Lo que conviene comprobar es lo mismo en los tres casos: quién hará el trabajo, casos comparables y qué pasa si esa persona o empresa deja de estar. Cuándo encaja cada tamaño lo explicamos en [consultoría de IA en Valencia](/ia-para-empresas/valencia/#pequena-o-grande) (enlace solo en el HTML visible, no en el JSON-LD).

6. **¿Cuánto cuesta contratar una consultora de IA?**
   Depende de la empresa: del proceso, del volumen, de los programas que haya que conectar y del mantenimiento. Pide que el presupuesto separe lo que se paga una vez de lo que se paga cada mes. Se presupuesta después de conocer el proceso.

### Puente final

**H2:** ¿Quieres ver con alguien qué proceso conviene empezar antes de pedir propuestas?
En la consultoría miramos tu proceso, el volumen y los programas que usáis, y te llevas por escrito qué conviene hacer primero, también si la respuesta es una herramienta que ya existe o no hacer nada todavía. Sirve para pedir propuestas a quien quieras, también a nosotros.
KPIs: **25 minutos** por videollamada · **Gratuita para 5 empresas al mes**; después, de pago · Sin compromiso de contratación.
Botón: `Solicitar 1 de las 5 plazas (0 €)` → `/consultoria-gratuita/?cta=pilar_como-elegir-consultora` (`data-event="click_consultoria_pilar_como_elegir_consultora"`).
Cierre: «Nos vemos en la sesión.»

### Fuentes (bloque visible, con fecha de consulta 30/10/2026)

1. Real Decreto Legislativo 1/1996, Ley de Propiedad Intelectual, artículos 43, 45, 96 y 97, consultada el 30/10/2026. boe.es (BOE-A-1996-8930)
2. Reglamento (UE) 2016/679 (RGPD), artículo 28, DOUE L 119 de 4/05/2016, consultado el 30/10/2026. boe.es (PDF del DOUE)
3. Ley 34/2002, de servicios de la sociedad de la información (LSSI), artículo 10, consultada el 30/10/2026. boe.es (BOE-A-2002-13758)
4. Reglamento (UE) 2024/1689 de Inteligencia Artificial, artículos 4 y 50, y Reglamento (UE) 2026/1744. eur-lex.europa.eu (los mismos enlaces que /agentes-ia/voz/)
Nota: «Fuentes comprobadas el <día de publicación>. Próxima revisión: <+3 meses>.» Reverificar las cuatro el día de publicar.

### JSON-LD previsto

WebPage + BreadcrumbList (Inicio › IA para empresas › Cómo elegir consultora) + Article (`author` `#daniel`, `publisher` `#org`, `about`: «Elegir proveedor de Inteligencia Artificial», `citation` con las 4 fuentes) + FAQPage con las 6 de arriba (texto sin enlaces). Sin `Review` ni `AggregateRating`.

### Checklist antes de publicar

- [ ] Reverificar LPI, RGPD y LSSI en el BOE el día de publicar.
- [ ] Maquetar en `borradores/html/ia-para-empresas-como-elegir-consultora.html` con el CSS de /ia-para-empresas/cuanto-cuesta/; las 2 tablas con `scope` y `caption`; móvil a 390 px sin scroll horizontal.
- [ ] 6 FAQ visibles = JSON-LD; 0 palabras prohibidas; sin raya larga, emojis ni exclamaciones; title ≤ 60 y description ≤ 155; un H1.
- [ ] Enlaces internos: /ia-para-empresas/#elegir-consultora, #alternativas, /ia-para-empresas/cuanto-cuesta/#presupuesto, /ia-para-empresas/formacion/, /agentes-ia/voz/#avisos, /ia-para-empresas/valencia/#pequena-o-grande (todos existen el 30/10). /sobre-pebai/#antes-de-contratar solo cuando esté publicada.
- [ ] Al publicar: enlace desde la madre (`#elegir-consultora`), sitemap, llms (dist y raíz), encargo a Refresco para enlazar desde Valencia `#que-preguntar`.
