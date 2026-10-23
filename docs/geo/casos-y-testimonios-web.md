# Casos y testimonios en la web: qué tener en cuenta (GEO)

Para quien toque la web (`website-pebai/dist/`). Datos de cada caso: `docs/geo/borradores/casos.md`. El agente de Contenido ya tiene el encargo de publicar `/casos/`; si otra persona diseña el bloque de testimonios, coordinarse para no pisarse (mismas URLs y mismo texto).

## 1. Qué es un testimonio válido
- **Solo palabras reales del cliente**, aprobadas por él por escrito (un WhatsApp o un email sirve). Guardar esa aprobación en local, nunca en el repo.
- Nombre, cargo y empresa, y la fecha. Si el cliente no quiere su nombre, «gerente de una constructora, Valencia».
- Nada de cifras que el cliente no haya dado o que no salgan de su panel. Nada de «el número uno» sin fuente.
- Las reseñas y testimonios inventados o retocados son ilegales (competencia desleal y protección del consumidor). Si se acorta una frase, que lo apruebe el cliente.

## 2. Dónde va cada cosa (URLs)
- `/casos/`: página madre con los 4 casos resumidos y enlazados.
- `/casos/<slug>/`: una página por caso (`fran-garcia-cars`, `construcciones-gargom`, `suministros-santacruz`, `residencia-el-amparo`). El testimonio vive aquí, completo.
- En la portada y en las páginas de servicio, **un extracto** del testimonio que enlace a su caso. Nunca el texto completo repetido en varias páginas.
- Cada caso enlaza a su servicio (`/agentes-ia/` para el chatbot, la página de automatización/software a medida para las apps) y cada servicio enlaza a sus casos.

## 3. Cómo escribir cada página de caso (lo que leen las IAs)
- H1 claro: «Caso Fran García Cars: aplicación de revisiones y asistente de WhatsApp».
- Justo debajo, un **resumen de 40-60 palabras** que se pueda citar tal cual: quién, qué problema, qué hicimos, resultado con cifra.
- Secciones con H2: «El problema», «Qué hicimos», «Resultado», «Qué dice el cliente», «Servicios usados».
- Cifras concretas con su fecha («a 22/10/2026: 659 usuarios»), sector y país del cliente.
- Fecha de publicación y de actualización visibles.
- Al final, el puente a la consultoría (`/consultoria-gratuita/?cta=caso_<slug>`), 5 plazas al mes y después de pago.

## 4. Técnico
- **Todo el texto en HTML**, visible al cargar. Nada de testimonios dentro de imágenes, ni cargados con JavaScript, ni escondidos en carruseles que rotan solos: los rastreadores de las IAs no ejecutan JS o no esperan.
- Marcado de la cita: `<figure><blockquote>…</blockquote><figcaption>Nombre, cargo, <cite>Empresa</cite></figcaption></figure>`.
- **JSON-LD por caso**: `WebPage` + `BreadcrumbList` + `Article` (autor `#daniel`, editor `#organization`, `datePublished`, `dateModified`, `image`), con `about` = la empresa cliente como `Organization` (nombre, `url` de su web, `sameAs` de su LinkedIn o redes). En `/casos/`, un `ItemList` con los 4.
- **No usar `Review` ni `AggregateRating` con estrellas sobre PEBAI.** Google prohíbe las reseñas «autoatribuidas» (las que una empresa pone de sí misma en su web) y puede penalizar. El testimonio va como texto citado, sin estrellas.
- Las reseñas con estrellas que sí cuentan son las de **Google Business**: pedir a cada cliente una reseña allí.
- Imágenes: las difuminadas de `dist/casos/img/` (webp para la web, jpg para LinkedIn). `width` y `height` puestos (que no salte la página), `loading="lazy"` si están por debajo, `alt` que describa lo que se ve («Panel de la app de revisiones de Fran García Cars, con 659 usuarios»), nombre de archivo descriptivo y menos de 200 KB.
- `og:image` y `og:title` propios en cada caso (para cuando se comparta en LinkedIn y WhatsApp).
- `canonical` a sí misma, `index,follow`.
- Al publicar: añadir las URLs a `sitemap.xml` (con `lastmod`), a `llms.txt` y `llms-full.txt` en una sección «## Casos», y enlazarlas desde la portada. IndexNow va solo con el auto-despliegue.

## 5. Diseño
- En la portada, una franja «Han confiado en nosotros» con los **logos de los clientes** (solo con permiso), cada uno enlazado a su caso.
- La cifra principal de cada caso, grande (por ejemplo, «659 usuarios en la app»), y debajo la frase del cliente.
- Foto del cliente solo si la da él. Nunca fotos de banco de imágenes haciéndose pasar por clientes.
- Testimonios uno debajo de otro o en rejilla, no en un carrusel automático.
- Mismo estilo que el resto de la web (colores, tipografías y tarjetas actuales) y que se lea bien en el móvil.
- Sin palabras prohibidas (`embudo-y-voz.md`), sin precios.

## 6. Medición
- Botones de cada caso con `?cta=caso_<slug>` para saber qué caso trae solicitudes.
- Cuando estén publicados, el informe del lunes comprueba si alguna IA cita `/casos/`.

## 7. Fuera de la web (lo que más pesa)
- Que cada cliente enlace a su caso o ponga «Desarrollado por PEBAI Systems» en su app o en su web, y que lo comparta en sus redes.
- El mismo texto del testimonio en LinkedIn (Testimonio personalizado) y en la web: que coincidan.
- Reseña real de cada cliente en la ficha de Google.
