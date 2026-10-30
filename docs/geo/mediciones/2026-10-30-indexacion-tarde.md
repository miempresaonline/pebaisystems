# Indexación y estabilidad, 30/10/2026 (tarde)

Fuente: `geo_datos.py gsc-inspeccion` (17 URLs del sitemap), `gsc 3`, `bing` y 20 curl desde la nube. Todo [V] salvo lo marcado.

## Indexación (Search Console)
| Estado | URLs |
|---|---|
| Enviada e indexada (9) | `/`, `/consultoria-gratuita/`, `/posicionamiento-en-ia/`, `/agentes-ia/`, `/ia-para-empresas/`, `/automatizacion-de-procesos/`, `/ia-para-empresas/formacion/`, `/ia-para-empresas/valencia/` |
| Google no reconoce la URL (9) | `/agentes-ia/whatsapp/`, `/agentes-ia/voz/`, `/ia-para-empresas/cuanto-cuesta/`, `/casos-de-exito/` y sus 4 casos, `/quienes-somos/` |

- `/ia-para-empresas/valencia/` (publicada el 29/10) ya está indexada: último rastreo 30/10 13:14 UTC, canonical correcto. Entra en menos de 24 h. [V]
- `/ia-para-empresas/formacion/` indexada, rastreada el 30/10. [V]
- Las 9 sin reconocer dan 200 con curl; son páginas nuevas del sitemap que Google aún no ha descubierto. Acción hecha hoy: `gsc-sitemap` reenviado (HTTP 204), `bing-url` de whatsapp, voz, cuanto-cuesta, formación y valencia (HTTP 200) y `bing-sitemap` (HTTP 200).
- El sitemap enviado en GSC marcaba 10 URLs (descargado 30/10 09:15 UTC) y hoy tiene 17: Google aún no ha releído la versión nueva. [H] que en 24-48 h las rastree.
- Bing: sitemap en Success con 7 URLs (enviado a las 09:25 UTC aprox.), sin relectura de las nuevas todavía.

## Incidencia 52x de Cloudflare
10 curl a la portada y 10 a `robots.txt` desde la nube: 20 de 20 en 200 (0 % de error). Es el primer turno de Medición con 0; falta un segundo seguido para dar «Resuelto». [V]

## Search Console, 3 días
Seguimos en impresiones sueltas (1-4 por consulta, posiciones 29-99, 0 clics). La consulta «contratar inteligencia artificial» está en posición 29. Sin cifra que permita hablar de tendencia. [V]

## Arreglo de herramienta
`geo_datos.py gsc-inspeccion` se caía con `AttributeError` cuando la API devolvía texto en vez de JSON; ahora anota el error de esa URL y sigue.
