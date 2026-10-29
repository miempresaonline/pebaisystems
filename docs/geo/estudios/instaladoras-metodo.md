# Estudio piloto: instaladoras y señales de atención al cliente en su web

Interno. No se publica sin OK de Daniel (encargo del Jefe 29/10/2026, propuesta 2 del Vigía).

**Pregunta:** ¿qué parte de las instaladoras españolas ofrece hoy en su web una vía de contacto inmediata (WhatsApp, chat, reserva) y cuántas solo un formulario o teléfono?

## Método
1. **Muestra:** 30 webs de instaladoras (electricidad, climatización, fontanería, renovables) tomadas de una fuente pública citable (asociación del sector o directorio oficial, p. ej. el listado de empresas instaladoras de una comunidad autónoma o de una asociación como Fenie/Agremia). Se elige un tramo fijo (las N primeras con web propia) para que sea reproducible. Fuente y fecha se citan en el informe.
2. **Lista de dominios:** vive solo en local (`scratch/`), nunca en el repo: es una lista de prospectos.
3. **Medición:** `python3 website-pebai/scripts/senales_web.py scratch/dominios.txt > scratch/resultados.csv`. Lee solo la portada, respeta `robots.txt`, identifica el rastreador con su UA y no sigue enlaces.
4. **Señales y detección** (regex sobre el HTML de la portada):
   - WhatsApp: enlaces `wa.me`, `api.whatsapp.com`, `web.whatsapp.com`.
   - Formulario: etiqueta `<form`.
   - Chat: scripts de Tawk, Crisp, Tidio, Intercom, Drift, LiveChat, Botpress, ManyChat, Chatwoot, HubSpot Conversations.
   - Reserva/calendario: Calendly, Cal.com, SimplyBook, Reservio, Booksy, Doctoralia, Setmore, Acuity, YouCanBook.me.
   - Teléfono: `href="tel:"`.
5. **Cifras agregadas:** % de webs con cada señal y % sin ninguna vía inmediata (ni WhatsApp, ni chat, ni reserva). Se publican solo agregados, nunca dominios.

## Límites (a decir en el informe)
- Una web que carga el chat por JavaScript tras interacción, o un formulario dentro de un iframe, puede no verse en el HTML: las cifras son un mínimo.
- Webs bloqueadas por `robots.txt` o con error se cuentan aparte, no como «sin señal».
- Piloto de 30 webs: sirve para afinar el método, no para afirmar nada del sector entero.

## Estado
- Script listo y probado (2 dominios): `website-pebai/scripts/senales_web.py`.
- Falta la corrida con las 30 webs: necesita elegir la fuente pública con Daniel o Vigía (propuesta: listado de la asociación del sector con web propia).
