# Ponderación de interés legítimo — captación por email (BORRADOR)

> **Borrador para que lo revise un abogado antes de lanzar.** No es asesoramiento jurídico. Recoge cómo tratamos los datos en la captación por email (`docs/captacion-email.md`) para documentar la base legal (RGPD art. 6.1.f y LOPDGDD art. 19) y la defensa frente al art. 21 de la LSSI.

## 1. Responsable y finalidad

- **Responsable:** PEBAI Systems (completar: razón social, NIF y domicilio cuando estén dados de alta).
- **Finalidad:** escribir una sola vez (más un recordatorio) a empresas para **preguntarles si quieren recibir** un vídeo de un minuto sobre cómo se atiende a los clientes en su sector. Solo si dicen que sí se les envía información comercial.
- **Qué no hacemos:** no enviamos publicidad sin permiso, no vendemos ni cedemos datos y no creamos perfiles de personas.

## 2. Datos que tratamos

| Dato | De dónde sale | Por qué |
|---|---|---|
| Nombre de la empresa, sector y ciudad | Su web o su ficha pública de Google | Saber a quién escribimos y adaptar la pregunta |
| Email de contacto **publicado por la empresa** (preferiblemente genérico: info@, contacto@) | La página de contacto de su web; se guarda la URL exacta | Hacerles la pregunta |
| Nombre de pila de la persona, solo si la empresa lo publica junto al email | Su web | Saludar correctamente |
| Motivo del contacto (p. ej. «tienen anuncios activos», «buscan a alguien para atención al cliente») | Fuentes públicas (biblioteca de anuncios de Meta, portales de empleo, su web, su ficha de Google); se guardan la URL y la fecha | Escribir solo cuando hay una razón real y verificable |
| Respuesta y, si la piden, la baja | Su respuesta | Atenderles y no volver a escribirles nunca |

No tratamos: emails personales que la empresa no publica, datos de clientes de la empresa, datos de salud (las reseñas se resumen en agregado, sin autores ni contenido de salud) ni listas compradas.

## 3. Prueba de interés legítimo

**a) Interés legítimo.** Dar a conocer a otras empresas un servicio profesional relacionado con su actividad (atención a sus clientes) es un interés comercial legítimo reconocido (considerando 47 del RGPD). La LOPDGDD (art. 19) presume lícito el tratamiento de datos de contacto profesionales para relacionarse con la empresa.

**b) Necesidad.** Para preguntar a una empresa si le interesa algo hace falta su email de contacto. Usamos el mínimo: el email que ella misma publica y, como mucho, el nombre que aparece junto a él. No hay una forma menos intrusiva de hacer esa pregunta por escrito.

**c) Ponderación (por qué no perjudica sus derechos):**

- **Expectativa razonable:** una empresa que publica un email de contacto en su web espera recibir mensajes de otras empresas relacionados con su actividad.
- **Impacto mínimo:** como mucho dos emails cortos de texto, sin enlaces ni seguimiento. Uno a uno, en horario laboral y sin envíos masivos.
- **Transparencia:** el propio email dice quién escribe y de dónde sacamos su dirección («Tu email lo saqué de vuestra página de contacto»).
- **Control total:** responder «no» o pulsar la baja con un clic basta para no recibir nada más, por ningún canal y para siempre.
- **Seguridad:** los datos se guardan en el servidor de la empresa, fuera de la parte pública de la web, con acceso solo mediante contraseña.

**Conclusión:** el interés de PEBAI no prevalece sobre los derechos de la empresa o de la persona porque el impacto es mínimo, el contacto es esperable y el control es inmediato. Las salvaguardas de la sección 5 son condición de esta conclusión.

## 4. LSSI art. 21 (comunicaciones comerciales)

- El primer email y el recordatorio **no promocionan** servicios, precios, ofertas ni enlaces. Solo **piden permiso** para enviar un vídeo. La AEPD consideró que un email que solo solicita permiso «no tiene una naturaleza comercial» (E/06110/2012).
- La información comercial (vídeo, enlace a la consultoría) solo se envía a quien responde que sí: queda **solicitada o autorizada expresamente** (art. 21.1).
- Cada email incluye la forma de oponerse (art. 22): responder «baja», la cabecera de baja con un clic y la página de baja.
- Riesgo residual: la definición de comunicación comercial incluye la promoción «indirecta» de la imagen. Por eso el texto se mantiene neutro y lo revisa un abogado.

## 5. Salvaguardas

1. Solo emails publicados por la empresa como contacto, con su origen guardado (URL y fecha).
2. Como máximo dos emails por empresa. Después, ninguno más por este canal.
3. Una persona por empresa y un solo canal a la vez (sin email y WhatsApp a la vez).
4. Baja inmediata, permanente y compartida entre canales (tablas `bajas_email` y `bajas`).
5. Comprobación automática antes de cada envío: baja, origen, señal vigente, palabras prohibidas y longitud.
6. Freno automático ante una sola queja de spam o un exceso de rebotes.
7. Volumen limitado (máx. 50 al día), horario laboral y sin envíos en periodos no laborables.

## 6. Derechos (RGPD arts. 15-22) e información (art. 14)

- La información básica va en el propio email: quién escribe, de dónde sale el dato y cómo dejar de recibir.
- Si piden más información, se les responde con: responsable, finalidad, base legal (interés legítimo), origen de los datos, plazo de conservación y derechos (acceso, rectificación, supresión, oposición, limitación y reclamación ante la AEPD). Completar con el texto de `/privacidad/`.
- Ejercicio de derechos: respondiendo al email o en equipo@pebaisystems.es.

## 7. Conservación

- Prospectos que no responden: se conservan **12 meses** desde el último email (para no volver a escribirles) y después se eliminan, salvo el email en la lista de bajas.
- Lista de bajas: se conserva indefinidamente y solo con el dato mínimo (email o teléfono), para garantizar que no se les vuelve a contactar.
- Quien responde con interés pasa a ser un contacto comercial con su propio consentimiento.

*(Pendiente de implementar: la limpieza automática a los 12 meses.)*

## 8. Revisión

- Fecha del borrador: 15/10/2026.
- Revisión por abogado: pendiente.
- Se revisará si cambian la plantilla, las fuentes de datos o el volumen.
