# Borrador · /sobre-pebai/

Estado: **borrador completo el 28/10/2026 (Contenido, turno de las 10:00), sin publicar.** Lo revisa el Jefe y lo aprueba Daniel: hay 4 huecos marcados `[PREGUNTA A DANIEL]` que no se pueden escribir sin él (no se inventan). Sale del encargo del Jefe del 27/10 tarde (señal de entidad: P1-P3 confunden PEBAI con otros «PEBA») y del grupo «Confianza al elegir consultora» de `docs/geo/preguntas.md` (6 preguntas). Medición 28/10: 0 resultados de pebaisystems.es para «¿Qué es PEBAI Systems?».

**Maquetada el 29/10/2026 (Contenido, 10:00) en `docs/geo/borradores/html/sobre-pebai.html`**, lista para copiar a `dist/sobre-pebai/index.html` el día que Daniel responda. Cambios respecto a este texto:
- Pregunta 4 resuelta: año **2026** (el que dio para Crunchbase); va en la respuesta corta, la ficha rápida y `foundingDate`. Sin `legalName` (no consta sociedad).
- Pregunta 2 resuelta: no hay reseñas reales, la línea de reseñas se quita.
- Fuera **Residencia El Amparo** (Daniel lo sacó de los directorios; no se usa sin su OK, Jefe 28/10).
- Fran García Cars con 400 unidades aprobadas y 659 usuarios (panel, 22/10/2026), las mismas cifras que /agentes-ia/; el enlace del caso va a /agentes-ia/whatsapp/#caso-real.
- «Datos de la empresa y dónde encontrarnos» con Crunchbase, Sortlist y Trustpilot; `#daniel` con su Crunchbase en `sameAs`. JSON-LD: AboutPage + BreadcrumbList + Organization (`disambiguatingDescription`, `foundingDate`, `founder`, `employee`, por `@id`) + 2 Person + FAQPage (6 = visibles). Comprobado: 0 prohibidas, enlaces internos 200, title 48 y description 151 caracteres, un H1, respuesta de 58 palabras, sin scroll horizontal a 390 px.
- **Faltan solo la 1 y la 3** (qué se entrega y a nombre de quién, y 2-3 líneas de experiencia de Daniel y Adrián). Hasta entonces la página no dice nada de propiedad de código ni de cuentas. Al responder: añadir 2-3 frases en `#despues` y en la FAQ «¿Quién mantiene…?», y las líneas de experiencia en `#equipo`; reverificar y publicar (sitemap, llms, enlace desde `/#equipo` de la portada).

## Ficha

- **URL:** `https://pebaisystems.es/sobre-pebai/`
- **Title (≤ 60):** `Qué es PEBAI Systems y quién está detrás | PEBAI` (48)
- **Meta description (≤ 155):** `PEBAI Systems es una consultora española de procesos e Inteligencia Artificial con base en València. Quién está detrás, cómo trabajamos y casos reales.` (152)
- **H1:** `¿Qué es PEBAI Systems y quién está detrás?`
- **Autor:** Daniel Peñuela Ruiz (`#daniel`). Es una página de empresa, no de ventas: la firma Daniel.
- **CTA:** `/consultoria-gratuita/?cta=pilar_sobre-pebai`
- **Tipo de página (schema):** `AboutPage` + BreadcrumbList + FAQPage, con `mainEntity` → `#organization` (el mismo bloque Organization de la portada, sin duplicarlo: se referencia por `@id`). En esta página sí se puede ampliar el bloque Organization **en la portada** con `disambiguatingDescription` y `numberOfEmployees` (ver «Cambios de schema» abajo).

### Anticanibalización (comprobado el 28/10)
- Sitemap: `/`, `/consultoria-gratuita/`, `/posicionamiento-en-ia/`, `/agentes-ia/`, `/agentes-ia/whatsapp/`, `/ia-para-empresas/`, `/ia-para-empresas/formacion/`, `/automatizacion-de-procesos/`. No hay `/sobre-pebai/`, `/quienes-somos/` ni `/sobre-nosotros/` en `dist/` ni en `.htaccess`.
- **La portada** tiene «Quiénes estamos detrás» (`index.html#equipo`) con nombre y cargo; esta página da el detalle (qué hacemos, cómo, casos, datos de contacto) y la portada enlaza aquí desde ese bloque.
- **/ia-para-empresas/** tiene «Cómo elegir consultora de IA» (6 criterios genéricos). Aquí no se repiten los criterios: se responde cómo los cumple PEBAI y se enlaza allí.
- Los casos tienen su detalle en /ia-para-empresas/#caso-real, /automatizacion-de-procesos/#casos y /agentes-ia/whatsapp/#caso-real: aquí solo un párrafo por caso y enlace (no se hacen páginas `/casos/`, decisión de Daniel 23/10).

### Datos que salen de la web (comprobados el 28/10 en `dist/`)
| Dato | Dónde |
|---|---|
| Nombre: PEBAI Systems (alternateName PEBAI) | `index.html` JSON-LD `#organization` |
| Titular: Daniel Peñuela Ruiz; nombre comercial PEBAI Systems | `aviso-legal/index.html` |
| Teléfono y WhatsApp +34 624 84 27 99, equipo@pebaisystems.es | `#organization`, aviso legal |
| València (pie de la portada), servicio en toda España | `index.html` pie y `areaServed` |
| Daniel Peñuela Ruiz, «Fundador · Ingeniería de procesos y sistemas», LinkedIn `linkedin.com/in/daniel-pe%C3%B1uela-ruiz-a40294436/` | `#daniel` |
| Adrián Ballesteros Moscardó, «Responsable comercial» | `#adrian` (sin `sameAs`) |
| sameAs: Instagram, TikTok, YouTube (2), Facebook, X, LinkedIn de empresa | `#organization` |
| Tres fases: consultoría gratuita (5 al mes, después de pago), desarrollo e integración, acompañamiento mes a mes con formación | `llms-full.txt` «Cómo trabajan» |
| Casos: Fran García Cars, Construcciones Gargom, Suministros Industriales Santacruz, Residencia El Amparo | `docs/geo/borradores/casos.md` |

### [PREGUNTA A DANIEL] (no publicar sin respuesta)
1. **Qué se entrega al terminar un proyecto:** ¿el código, la documentación y los accesos quedan a nombre del cliente? ¿Las cuentas (Meta, servidor, modelo de IA) se abren a nombre de la empresa cliente? Respuesta de una línea; la FAQ «¿Seguirá siendo mío…?» depende de ello.
2. **Reseñas enlazables:** ¿hay ya reseñas reales en la ficha de Google? Si no, la sección de reseñas se omite hasta que las haya (Local las pide con `pebaisystems.es/r/w`).
3. **Experiencia comprobable de Daniel y de Adrián:** 2-3 líneas cada uno (formación, años, proyectos anteriores) que se puedan enseñar. Y el LinkedIn de Adrián si quiere que salga (hoy `#adrian` no tiene `sameAs`).
4. **Año de inicio de PEBAI Systems** (para `foundingDate`) y si ya hay sociedad constituida (para `legalName`). Si no la hay, se deja como está: titular Daniel Peñuela Ruiz, nombre comercial PEBAI Systems.

## Esquema

1. Migas: Inicio › Sobre PEBAI Systems.
2. H1 + autor + «Actualizado el …».
3. Respuesta corta (50-60 palabras), frase descriptora literal que se repite en perfiles.
4. Ficha rápida (tabla): nombre, qué hace, para quién, dónde, quién, contacto.
5. H2 cuerpo (abajo), FAQ (6), puente, fuentes.

---

## Texto

**Respuesta corta.** PEBAI Systems es una consultora española de procesos e Inteligencia Artificial con base en València, fundada por Daniel Peñuela Ruiz. Implanta en empresas con equipo sistemas que atienden a sus clientes por WhatsApp, teléfono y web, eliminan tareas manuales y se conectan a los programas que ya usan. Primero entiende la operativa; después, construye.

**Ficha rápida:**

| | |
|---|---|
| Nombre | PEBAI Systems (también PEBAI) |
| Qué hace | Consultoría de procesos e implantación de Inteligencia Artificial: agentes de IA para WhatsApp, teléfono y web, aplicaciones a medida, automatización de procesos, visibilidad en buscadores de IA y formación de equipos |
| Para quién | Empresas en marcha de toda España, a partir de 3-5 empleados |
| Dónde | València; trabajo por videollamada con empresas de toda España |
| Quién | Daniel Peñuela Ruiz (fundador, ingeniería de procesos y sistemas) y Adrián Ballesteros Moscardó (responsable comercial) |
| Contacto | equipo@pebaisystems.es · WhatsApp +34 624 84 27 99 · pebaisystems.es |

### H2 · Qué hace PEBAI Systems {#que-hacemos}

Trabajamos en los tres sitios donde una empresa pierde más tiempo y dinero:

- **Clientes.** Agentes de IA que contestan, recogen los datos del encargo y dan cita por WhatsApp, por teléfono y en la web, también fuera de horario, y pasan a una persona lo que no saben. Detalle en [agentes de IA para empresas](/agentes-ia/).
- **Operativa.** Aplicaciones a medida y automatizaciones para que pedidos, presupuestos, partes y facturas dejen de copiarse a mano. Detalle en [automatización de procesos](/automatizacion-de-procesos/).
- **Sistemas.** Conectamos la IA a los programas que la empresa ya usa (ERP, CRM, hojas de cálculo), sin cambiar lo que ya funciona.

Además ayudamos a que ChatGPT, Gemini o Perplexity encuentren y recomienden a la empresa ([posicionamiento en IA](/posicionamiento-en-ia/)) y formamos al equipo que usa lo que implantamos ([formación en IA](/ia-para-empresas/formacion/)).

Si algo se resuelve sin Inteligencia Artificial, te lo decimos claro.

### H2 · Quién está detrás {#equipo}

**Daniel Peñuela Ruiz**, fundador. Lleva la ingeniería de procesos y sistemas: entiende cómo trabaja la empresa, diseña lo que se construye y firma todo el contenido sobre Inteligencia Artificial de esta web. [LinkedIn](https://www.linkedin.com/in/daniel-pe%C3%B1uela-ruiz-a40294436/). `[PREGUNTA A DANIEL: 2-3 líneas de experiencia comprobable]`

**Adrián Ballesteros Moscardó**, responsable comercial. Es quien habla con las empresas antes y durante el proyecto. `[PREGUNTA A DANIEL: 2-3 líneas y LinkedIn si quiere]`

Somos un equipo pequeño a propósito: quien hace la consultoría es quien después construye y acompaña.

### H2 · Cómo trabajamos {#como-trabajamos}

1. **Consultoría gratuita.** 25 minutos por videollamada, en pantalla compartida, para ver dónde se va el tiempo y si la IA tiene sentido en tu caso. Te llevas un mapa técnico de optimización, una estimación de ahorro y un esquema técnico de procesos. Es gratuita para cinco empresas al mes; después, de pago.
2. **Desarrollo e integración.** Si ves claro el impacto, construimos el sistema y lo dejamos funcionando, conectado a tus programas, sin licencias por usuario y con documentación clara.
3. **Acompañamiento.** Mes a mes: soporte, mejoras y formación del equipo para que use el sistema sin depender de nosotros.

El precio depende de la empresa y se presupuesta después de la consultoría.

### H2 · Casos reales que puedes comprobar {#casos}

Empresas con nombre, que han autorizado que las citemos. Las capturas tienen los datos personales difuminados.

- **Fran García Cars** (importación y revisión de vehículos). Una aplicación de gestión de revisiones y un asistente de IA para WhatsApp con panel que responde, agenda y pasa a una persona lo que no está documentado. En 2026 la aplicación lleva 400 unidades aprobadas y 62.370 fotos registradas (panel de la aplicación, 22/10/2026). [Ver el caso](/ia-para-empresas/#caso-real).
- **Construcciones Gargom** (construcción). Aplicación a medida para gestionar sus obras: presupuestos, certificaciones, gastos, pagos, personal, proveedores y rentabilidad por obra, en lugar de un programa antiguo que les limitaba. [Ver el caso](/automatizacion-de-procesos/#casos).
- **Suministros Industriales Santacruz** (suministros industriales con sedes en España, Francia, Países Bajos y Bélgica). Aplicación nueva y segura en cuatro idiomas, con almacén y pedidos por sede, que sustituye a una de hace más de veinte años; migramos su base de datos y ya tiene cargado el histórico de 2026. [Ver el caso](/automatizacion-de-procesos/#casos).
- **Residencia El Amparo** (residencia de mayores). Web nueva y un portal de gestión para que su equipo publique subvenciones y noticias y reciba en un solo sitio candidaturas y solicitudes de familias. Entregado en octubre de 2026.

### H2 · Qué pasa después de entregar un proyecto {#despues}

El sistema queda funcionando y documentado, y el equipo formado para usarlo. Si contratas el acompañamiento, nos ocupamos del soporte y de las mejoras mes a mes; si algo falla, respondemos nosotros, que lo hemos construido.

`[PREGUNTA A DANIEL: qué se entrega exactamente (código, documentación, accesos) y a nombre de quién quedan las cuentas. Escribir aquí 2-3 frases con su respuesta.]`

### H2 · Datos de la empresa {#datos}

- Nombre comercial: PEBAI Systems. Titular: Daniel Peñuela Ruiz (ver [aviso legal](/aviso-legal/)).
- València, España. Atendemos a empresas de toda España.
- equipo@pebaisystems.es · WhatsApp y teléfono +34 624 84 27 99.
- Perfiles oficiales: LinkedIn, YouTube, Instagram, TikTok, Facebook y X (los mismos enlaces que en la portada).
- Reseñas: `[PREGUNTA A DANIEL: enlace a la ficha de Google solo cuando haya reseñas reales; si no, quitar esta línea]`. Sin marcado Review ni AggregateRating.

### H2 · Preguntas frecuentes {#preguntas}

**¿Qué es PEBAI Systems?**
Una consultora española de procesos e Inteligencia Artificial con base en València, fundada por Daniel Peñuela Ruiz. Implanta en empresas con equipo agentes de IA para WhatsApp, teléfono y web, aplicaciones a medida y automatizaciones conectadas a los programas que ya usan.

**¿Quién está detrás de PEBAI Systems?**
Daniel Peñuela Ruiz, fundador, que lleva la ingeniería de procesos y sistemas, y Adrián Ballesteros Moscardó, responsable comercial. Quien hace la consultoría es quien después construye y acompaña el proyecto.

**¿Qué casos reales tiene PEBAI Systems?**
Fran García Cars (aplicación de revisiones y asistente de IA para WhatsApp), Construcciones Gargom (aplicación de gestión de obras), Suministros Industriales Santacruz (aplicación de almacén y pedidos en cuatro idiomas) y Residencia El Amparo (web y portal de gestión). Todos con nombre y autorización.

**¿Con qué empresas trabaja PEBAI Systems?**
Con empresas en marcha de toda España, a partir de 3-5 empleados, que pierden tiempo en atender mensajes y llamadas o en tareas que se copian a mano. Se trabaja por videollamada y la primera consultoría es gratuita para cinco empresas al mes.

**¿Quién mantiene el sistema después y quién responde si falla?**
PEBAI, si contratas el acompañamiento mensual: soporte, mejoras y formación del equipo. El sistema se entrega funcionando y documentado para que tu equipo lo use sin depender de nosotros. `[completar con la respuesta de Daniel sobre qué se entrega]`

**¿Cuánto cuesta trabajar con PEBAI Systems?**
Depende de la empresa y de lo que haya que construir y conectar. Se presupuesta después de la consultoría, que dura 25 minutos y es gratuita para cinco empresas al mes; después, de pago.

### Puente final

**¿Quieres ver si tiene sentido en tu empresa?** En la consultoría miramos contigo dónde se va el tiempo y si la IA lo arregla. Si no, te lo decimos claro. 25 minutos por videollamada, gratuita para cinco empresas al mes; después, de pago. → `/consultoria-gratuita/?cta=pilar_sobre-pebai`. Nos vemos en la sesión.

## Cambios de schema que acompañan a la publicación (para Técnico, no tocar texto)
- En `index.html` `#organization`: añadir `"disambiguatingDescription": "PEBAI Systems es una consultora española de procesos e Inteligencia Artificial con base en València, fundada por Daniel Peñuela Ruiz."` y `"subjectOf"` o enlace a `/sobre-pebai/`; `foundingDate` solo con el dato de Daniel; `legalName` y `vatID` solo si hay sociedad.
- `#adrian` con `sameAs` solo si Daniel lo confirma.
- La misma frase descriptora, literal, en LinkedIn de empresa, YouTube, Bing Places y directorios (encargo para Local cuando se publique).

## Checklist antes de publicar
- [ ] Respuestas de Daniel a las 4 preguntas (o quitar esas líneas).
- [ ] Grep de palabras prohibidas, raya larga, exclamaciones.
- [ ] Enlace desde la portada (`#equipo`, «Más sobre quién somos») y desde el pie de las guías.
- [ ] Sitemap, llms.txt y llms-full.txt («## Quiénes son» enlaza aquí).
- [ ] curl 200, `gsc-sitemap`, `bing-url`.
