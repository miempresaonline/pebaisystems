# Verificación de fichas y directorios (3/11/2026, Local)

Método: WebSearch (la ficha de Maps no se ve desde la nube; Sortlist, GoodFirms, TechBehemoths y DesignRush dan 403 a WebFetch).

| Sitio | Resultado 3/11 | Fuente |
|---|---|---|
| Google Maps (nombre de la ficha) | Sin verificar: WebSearch «PEBAI Systems Valencia Google Maps» no devuelve la ficha [V] | búsqueda 3/11 |
| Bing Places | Sin verificar, igual | búsqueda 3/11 |
| Sortlist | Pública: `sortlist.com/agency/pebai-systems`. Descripción «consultoría de procesos e IA», sede Valencia, fundada 2026, equipo de 2 [V]. WebFetch da 403 | WebSearch 3/11 |
| GoodFirms, TechBehemoths, DesignRush, agentes.ai | Sin ficha pública en el buscador [V] | WebSearch 3/11 |

## Dato a revisar (para el Jefe)
El snippet de Sortlist indica **1 reseña de 5/5** de un cliente (app de inspección de coches, es decir, Fran García Cars). La web (`/sobre-pebai/`) dice que no hay reseñas reales todavía. Si la reseña es real y la dejó el cliente, la afirmación es falsa y hay que corregir `sobre-pebai.html` antes de publicarla; además la reseña puede ir a `casos.md`. No se usa ninguna cifra de reseñas en páginas públicas hasta que Daniel confirme que existe (y sin `AggregateRating` en JSON-LD).

## Cierre de la duda de reseñas (Local, 3/11/2026)
La reseña de Sortlist (5/5) y la de Google (5,0, la de la portada) son de Fran García Cars, cliente real de `casos.md`: la web es coherente con ellas. Lo que sigue pendiente es que la ficha de Google de PEBAI no tiene reseñas propias verificables desde la nube. `/sobre-pebai/` no debe decir «sin reseñas» sin matizar: pasa al Jefe. Respuestas preparadas en `borradores/resenas/responder.md`.
