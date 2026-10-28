# URLs viejas con impresiones y a dónde redirigen (Medición, 28/10/2026)

**Verificado** (`geo_datos.py gsc 28` + `curl -I` del 28/10):

| URL vieja | Clics / impresiones 28 d | Pos. | Redirección hoy |
|---|---|---|---|
| /agente-de-ia-espana/ | 1 / 19 | 2,4 | 301 → /agentes-ia/ |
| /auditoria-adopcion-inteligencia-artificial-negocio/ | 0 / 3 | 1,7 | 301 → /ia-para-empresas/ |
| /agencia-geo-generative-engine-optimization-espana/ | 0 / 11 | 87,2 | 301 → /posicionamiento-en-ia/ |
| /agente-ia-whatsapp-business-api-empresas/ | 0 / 14 | 70,9 | 301 → /agentes-ia/whatsapp/ |
| /agencia-inteligencia-artificial-empresas-madrid/ | 1 / 19 | 4,4 | **302 → portada** |
| /agentes-de-voz-ia-vs-call-center-subcontratado/ | 1 / 10 | 7,7 | **302 → portada** |
| /agentes-de-voz-ia-telefonicos-empresas/ | 0 / 6 | 81,8 | **302 → portada** |
| /agencia-inteligencia-artificial-murcia/ | 0 / 8 | 13,4 | **302 → portada** |

**Lectura (verificada):** 4 de las 8 URLs con impresiones ya son 301 a un pilar. Las otras 4 son 302 a la portada y suman 43 impresiones y 2 de los 5 clics de URLs viejas, en posiciones 4-13 (las mejores). Un 302 le dice a Google que la URL volverá, así que no traspasa la señal al destino.

**Hipótesis (no verificada):** si el destino fuese una página temática (voz → /agentes-ia/, ciudades → /ia-para-empresas/) con 301, Google trasladaría esas impresiones; hoy se pierden contra la portada, que no responde a esas consultas.

**Propuesta para el Jefe (decisión de pilares.md §5, no mía):** pasar a 301 las 4 URLs 302 hacia el pilar que corresponda cuando exista su destino definitivo (voz es P11, aún sin página; ciudades pueden ir a /ia-para-empresas/). Medir en 2 semanas con `gsc 28`.
