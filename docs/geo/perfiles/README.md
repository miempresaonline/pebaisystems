# Perfiles de PEBAI en directorios que citan las IAs

Preparado el 21/10/2026. Nada de esto está dado de alta: cada perfil lo crea el equipo a mano después de dar el OK (regla "hablar antes de actuar"). Aquí solo están los textos listos para copiar y pegar, los requisitos de cada sitio y el orden recomendado.

Fuente de los datos: `website-pebai/dist/llms-full.txt`. Por qué estos directorios: `docs/geo/mediciones/2026-10-21.md` (sección 3, "Dominios más citados como fuente").

Leyenda: 🟢 verificado en la fuente · 🟡 hipótesis o dato de terceros sin confirmar · 🔵 decisión del equipo · `[PENDIENTE: dato del equipo]` = no se inventa, se rellena cuando exista.

## Tabla de prioridades

| # | Directorio | ¿Gratis? | Requisitos | Evidencia de que lo citan las IAs | Prioridad | Estado |
|---|---|---|---|---|---|---|
| 1 | [LinkedIn (página de empresa)](linkedin.md) | Sí | Perfil personal de un fundador con el puesto en PEBAI en "Experiencia" + email del dominio (`equipo@pebaisystems.es`) confirmado. Sin CIF. | La AIO del prompt 3 ("¿quiénes son los fundadores?") cita linkedin.com y confunde a PEBAI con otras empresas porque no hay página. 🟡 Según Everything PR, el 59 % de las citas de LinkedIn en Perplexity son páginas de empresa. Falta el `sameAs` en el JSON-LD. | **Muy alta** | pendiente |
| 2 | [Sortlist](sortlist.md) | Perfil sí; responder a proyectos, no (Sortlist+) | Cuenta de agencia. Sin CIF para el perfil. Para salir en los listados por ciudad hay que **validar una oficina** (vía Google Business Profile). | 🟢 5 citas en la medición (AIO 4 y 6, AI Mode 5, 6 y 14) y top 10 orgánico en los prompts 4, 6, 14 y 15. | **Muy alta** | pendiente |
| 3 | [agentes.ai](agentes-ai.md) | 3 meses gratis; después Estándar 49 €/año (precio de lanzamiento) | Formulario: nombre, email, web, ubicación, especialidad, categoría, departamento, descripción. "Sin datos de pago", "Publicación en 24h". Sin CIF. | 🟢 Citado en AIO 6 y nombrado como agencia; top 10 orgánico en los prompts 4, 6 y 15; ChatGPT lo usa en el prompt 7. | **Alta** | pendiente |
| 4 | [Crunchbase](crunchbase.md) | Sí (cuenta gratuita) | Cuenta registrada con autenticación social. Obligatorio solo nombre y descripción. Sin CIF. | 🟡 Fuente de entidad (datos estructurados); Crunchbase tiene acuerdo de datos con Perplexity (Wikipedia). Arregla la confusión de Perplexity con "PEBA Industries". | **Alta** | pendiente |
| 5 | [mejores-agencias.com](mejores-agencias.md) | No lo publican (🟡 preguntar) | Formulario de contacto con asunto "Alta de Nueva Agencia". | 🟢 Fuente de la AIO 5; top 10 orgánico en los prompts 5 y 7. Tiene categorías "Agencias IA", "Visibilidad en IA", "Auditoría GEO", "Posicionamiento LLM". | **Alta** | pendiente |
| 6 | ~~[Clutch](clutch.md)~~ **descartado 28/10: exige dirección completa y PEBAI no tiene dirección de empresa** | Perfil básico sí; verificación desde 499 $/año | Alta en clutch.co/get-listed con LinkedIn, Google o email de empresa; el equipo de Clutch revisa el perfil antes de publicarlo. Para rankear hacen falta reseñas. | 🟢 Fuente en la respuesta de Claude al prompt 4. Directorio B2B de referencia en inglés. | Media | pendiente |
| 7 | [Trustpilot](trustpilot.md) | Sí (plan gratis, 50 invitaciones/mes) | Cuenta de empresa con email del dominio. Insignia "verificada" pide identificación (identidad, dominio, cuenta bancaria…). | 🟡 Estudio de Trustpilot/Seer (marzo 2026, 800.000 respuestas): marcas sin perfil activo salen en el 1 % de respuestas; con perfil, 53,5 %. Es un estudio del propio vendedor. ChatGPT y Perplexity ya echan en falta reseñas independientes (prompt 2). | Media (alta cuando haya clientes) | pendiente |
| 8 | [Google Business Profile](google-business-profile.md) | Sí | **Bloqueado** 🔵: hay que atender en persona (en una dirección o yendo al cliente) y verificar una dirección real (se oculta si es negocio de área de servicio). Una empresa 100 % en remoto no cumple. | 🟢 En el prompt 15 Bing responde solo con el mapa local; AI Mode y AIO usan fichas locales en "consultora de IA en Valencia/Madrid". Desbloquea la validación de oficina en Sortlist. | Alta si se puede; hoy bloqueado | pendiente (decisión) |
| 9 | [Bing Places](bing-places.md) | Sí | Importar desde GBP en bing.com/forbusiness, o alta manual con verificación. Mismas normas de dirección. | 🟢 Bing alimenta Copilot y ChatGPT; en el prompt 15 Bing solo enseña el mapa local. | Media (después de GBP) | pendiente (depende de GBP) |
| 10 | [Apple Business Connect](apple-business-connect.md) | Sí | La ficha de Apple Maps exige local físico; sin local solo queda la marca (logo en Mail/llamadas), que pide DMARC en `quarantine` o `reject`. | 🟡 Ninguna en la medición. Apple Maps alimenta Siri; poco peso en B2B. | Baja | pendiente |
| 11 | [GoodFirms](goodfirms.md) | Listado gratis con "23 % de aceptación" | Verificación en 4 pasos: comprobación de antecedentes, **entrevistas a clientes**, revisión del portfolio. Sin clientes no pasa. | 🟡 Ninguna en la medición. | Baja (cuando haya 2-3 clientes) | pendiente (bloqueado) |
| 12 | [Upliora](upliora.md) | No es un alta: es editorial | Selección editorial; "No publicamos contenido enviado por proveedores". Se manda evidencia documentada por /contacto. Vende consultoría y promociona a Javadex. | 🟢 4 citas + 7 fuentes en la respuesta de Claude al prompt 5; top 10 orgánico en el prompt 5. | Media (cuando haya evidencia) | pendiente (bloqueado) |
| 13 | [Javadex](javadex.md) | No aplica | Es un **competidor** (consultor Javier Santos) que publica rankings donde se pone primero. No hay forma de entrar. | 🟢 6 citas; 1º en la AIO 5. | No aplica | descartado |

## Datos NAP canónicos (iguales en todos los perfiles)

| Campo | Valor |
|---|---|
| Nombre | **PEBAI Systems** (sin "S.L.", sin eslóganes; en mayúsculas PEBAI porque es la marca) |
| Web | `https://pebaisystems.es` (sin `www`, sin barra extra, sin utm: es la URL de la entidad) |
| Email | `equipo@pebaisystems.es` |
| Teléfono y WhatsApp | `+34 624 84 27 99` |
| Ubicación | España · trabajo en remoto (sin dirección publicada) |
| Idioma | Español |
| Fundadores | Daniel Peñuela Ruiz (ingeniería de procesos y sistemas) y Adrián Ballesteros Moscardó (dirección de proyectos y consultoría), cofundadores |
| Tamaño | 2-10 personas (rango; los dos fundadores) |
| Año de fundación | `[PENDIENTE: dato del equipo]` |
| NIF / razón social / dirección | `[PENDIENTE: dato del equipo]` (decidido esperar al alta) |
| Precio | Proyectos de implantación desde 1.500 € |
| Consultoría inicial | 25 minutos; gratuita solo para cinco empresas seleccionadas al mes; después, de pago. Nunca escribir "gratis" sin el límite. |
| Logo | `assets/brand/pebai-systems/foto-de-perfil/` (cuadrado) y `assets/brand/pebai-systems/banners/` (portadas) |
| Redes (`sameAs`) | instagram.com/pebaisystems · tiktok.com/@pebaisystems · youtube.com/@pebaisystems · x.com/pebaisystems · facebook.com/profile.php?id=61595234630397 |

Enlace de cada perfil: en el campo "Sitio web" va siempre `https://pebaisystems.es`. Los enlaces cortos con origen (`pebaisystems.es/li`, etc., de `docs/enlaces-y-utm.md`) solo en botones o bios donde ya estén definidos. 🔵 Las solicitudes que lleguen desde un directorio no tienen regla propia en `pebai_canal()`: el equipo decide si cuentan como SEO/GEO (Daniel) o van por la respuesta del formulario.

Lo que no se pone en ningún perfil: clientes, casos, cifras de resultados, premios, año de fundación inventado, "desarrollo web" como servicio principal (se puede dejar como servicio secundario solo donde el selector lo obligue; el equipo no quiere vender webs).

## Descripción canónica

Una sola descripción, en cuatro longitudes. Cada ficha usa la que le cabe. No se reescribe por directorio.

### Frase (94 caracteres)
```
Consultoría de procesos e Inteligencia Artificial para empresas de cualquier sector en España.
```

### Corta (118 caracteres; vale para límites de 120 y 140)
```
Consultoría de procesos e IA para empresas en España: chatbots, agentes de voz, software a medida y visibilidad en IA.
```

### Media (≈ 600 caracteres; fichas de directorio)
```
PEBAI Systems es una consultoría de procesos e Inteligencia Artificial para empresas de cualquier sector en España. Implantamos sistemas que atienden a los clientes las 24 horas (chatbots con IA y agentes de voz en WhatsApp, teléfono y web), eliminan tareas manuales como partes de trabajo, pedidos, presupuestos o facturas, y se conectan a los programas y al CRM que la empresa ya usa, sin licencias por usuario. También desarrollamos software operativo a medida, trabajamos la visibilidad en buscadores de IA (GEO) y formamos a los equipos. Primero entendemos la operativa; después, construimos.
```

### Larga (≈ 1.950 caracteres, máx. 2.000; LinkedIn "Acerca de", Crunchbase, Sortlist)
Está en [linkedin.md](linkedin.md) y es la misma en todos los sitios que admiten texto largo.

### Inglés (Clutch, GoodFirms, Crunchbase)
Frase, corta, media y larga en [clutch.md](clutch.md). Traducción fiel de la española, sin añadir nada.

## Orden de trabajo recomendado

1. LinkedIn (página de empresa) y, el mismo día, los perfiles personales de Daniel y Adrián con el puesto enlazado a la página. Después, añadir la URL al `sameAs` del JSON-LD.
2. Sortlist (perfil gratuito, sin Sortlist+).
3. agentes.ai (plan gratis de 3 meses; apuntar en el calendario la fecha de fin).
4. Crunchbase.
5. mejores-agencias.com (mensaje por el formulario de contacto).
6. Clutch (básico) y Trustpilot (sin pedir reseñas hasta tener clientes reales).
7. Cuando el equipo decida sobre dirección y atención presencial: Google Business Profile → Bing Places (importar) → validar oficina en Sortlist.
8. Con los primeros clientes: reseñas en Sortlist, Clutch, Trustpilot y Google; GoodFirms; enviar evidencia a Upliora.

Cada vez que se cree un perfil: cambiar su estado aquí a "creado (fecha, URL)", añadir la URL al `sameAs` de `Organization` en el JSON-LD y marcarlo en `docs/geo/plan.md` (Fase 2, "Perfiles coherentes").

## Imágenes de marca para directorios (Daniel, 28/10/2026)

- Logo: `assets/brand/pebai-systems/foto-de-perfil/02_PEBAI_Perfil_Oscuro_Glow_Tech.png` (el del brillo). Puesto en Trustpilot, Crunchbase, Sortlist (con portada banner-pebai-ancho) y TechBehemoths. Falta en DesignRush (en revisión, no deja editar) y GoodFirms.
- Portadas: `assets/brand/pebai-systems/banners/banner-pebai-ancho.jpg` (3168×792) y `banner-pebai-fino.jpg` (2256×382), oscuros, con el símbolo y «PEBAI SYSTEMS» centrado. Solo en local: la carpeta de banners no se sube al repositorio.

## Nuevos propuestos (28/10/2026)

Abiertos en el Chrome de Daniel para que cree la cuenta; después los relleno yo con los textos canónicos, el logo 02 y los banners.
- Dealroom (app.dealroom.co): cuenta y luego «Add your entity» con nombre, web y LinkedIn de empresa. Es la base de datos del ecosistema de València (también cubre el mapa de Startup Valencia).
- F6S (f6s.com): perfil de fundador y página de empresa.
- Wellfound (wellfound.com/recruit): página de empresa con fundadores.
- Hotfrog España (hotfrog.es/register): ficha local que permite ocultar la dirección.
