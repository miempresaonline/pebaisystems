# Redactor de captación (Claude)

Desde el 27/10/2026 los primeros mensajes de captación los escribe Claude, no Gemini. Daniel lo pidió porque Claude es más capaz.

Funciona como los agentes GEO: es una rutina en la nube de Claude con el plan de Daniel, sin API de pago. Gemini queda solo para lo que tiene que ir al momento: notas de voz, conversaciones y «Pregunta a PEBAI».

**Qué hace.** Las empresas de placas solares que encuentra el Scraper entran en el panel sin texto. El Redactor:

1. Lee la web de cada empresa.
2. Saca de la cola las que no encajan.
3. Escribe el primer WhatsApp, o el email si la empresa no tiene móvil.

Sigue las mismas reglas de antes. El servidor revisa cada texto con el mismo control de calidad, `pebai_ia_control` en `website-pebai/dist/api/_ia_lib.php`:

- Se presenta y ofrece la baja.
- No lleva enlaces, precios, leyes ni porcentajes.
- Hace una sola pregunta.
- El dato en que se basa aparece literalmente en la web de la empresa.

**Nunca envía nada.** El texto queda en la cola y lo envían los agentes de WhatsApp y Email con sus propias reglas y límites. Sin texto no sale nada: WhatsApp exige `mensaje` y Email exige `cuerpo_personal` en placas solares.

## Turno (L-V cada 2 h de 8:00 a 20:00, hora de España)

1. Prepara el entorno y apunta el inicio:

   ```
   python3 website-pebai/scripts/geo_actividad.py --agente=redactor hito "Empieza: escribir primeros mensajes"
   ```

2. Pide un lote con `python3 website-pebai/scripts/redactor.py pendientes 8`. Lee las REGLAS que salen: son las mismas instrucciones que tenía Gemini y mandan sobre todo lo demás.
3. Para cada empresa del lote:
   - Decide si encaja, mirando su negocio **principal** según el texto de su portada. Ante la duda, no encaja.
   - Si encaja, elige un detalle concreto y propio de su web. El campo `dato` tiene que ser una **copia literal** de su portada, de 2 a 12 palabras.
   - Escribe el WhatsApp o el email siguiendo las reglas al pie de la letra: inicio y cierre exactos, número de palabras, una sola pregunta.
   - Entrégalo:
     1. Escribe el JSON en `/tmp/e.json`.
     2. Ejecuta `python3 website-pebai/scripts/redactor.py entrega /tmp/e.json`.
     3. Si responde `ok: false`, lee el error, corrige **una vez** y entrega otra vez. Al segundo fallo, el servidor aparca esa empresa 12 h.
4. Repite desde el paso 2 hasta que el lote venga vacío o lleves unos 40 minutos.
5. Apunta el cierre:

   ```
   python3 website-pebai/scripts/geo_actividad.py --agente=redactor hito "Termina: N escritos, M fuera, K aparcados"
   ```

   El resumen tiene 3 líneas.

**Calidad por encima de cantidad.** Tiene que sonar a una persona que ha mirado su web, no a una plantilla. Con dos mensajes seguidos que digan lo mismo, mal. Nunca inventes nada que no esté en su web.

**Prohibido:**

- Enviar nada a las empresas o contactarlas.
- Tocar otras tablas o nichos.
- Imprimir el token.
- Escribir datos de empresas en el repositorio, que es público. Este turno no hace commits.

## Nicho terminado

Cuando el Scraper revisa toda España y la última vuelta trae menos de 5 empresas nuevas, la serie se para sola (`prospeccion/prospeccion/tanda.py`). Entonces:

- Su mesa en la oficina dice «Nicho terminado: … Dame otro nicho».
- Sale en «Necesita del equipo».
- Daniel recibe un email.

Daniel da el nicho nuevo en el chat y se añade a `NICHOS` en `tanda.py`.
