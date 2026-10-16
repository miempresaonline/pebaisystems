# Qué enlace poner en cada sitio

No hace falta escribir UTMs a mano. Copia el enlace de esta tabla y el panel sabrá de dónde viene cada cliente.

## Perfiles (se ponen una vez)

| Dónde | Enlace |
|---|---|
| Bio de Instagram | `pebaisystems.es/ig` |
| Bio de TikTok | `pebaisystems.es/tt` |
| Bio de Facebook | `pebaisystems.es/fb` |
| Bio de X | `pebaisystems.es/x` |
| Enlaces del canal de YouTube | `pebaisystems.es/yt` |
| Perfil de LinkedIn | `pebaisystems.es/li` |

Todos llevan al vídeo (`/consultoria-gratuita/`) con el origen ya puesto.

## Respuestas a mano a los comentarios con palabra clave

Añade `?palabra=` y la palabra del Short:

- Por Instagram: `pebaisystems.es/ig?palabra=AGENTE`
- Por TikTok: `pebaisystems.es/tt?palabra=AGENTE`
- Por WhatsApp: `pebaisystems.es/wa?palabra=AGENTE`

En el panel, pestaña Resumen → "De dónde vienen" → "Palabra", verás qué Short trae más solicitudes.

## Vídeos largos de YouTube (descripción y comentario fijado)

Cada vídeo largo tiene su enlace corto con su nombre, para saber qué vídeo trae a cada cliente:

- Descripción: `https://pebaisystems.es/v/presentacion`
- Comentario fijado: `https://pebaisystems.es/v/presentacion?c=comentario`

Para un vídeo nuevo, cambia `presentacion` por un nombre corto en minúsculas y con guiones (`agentes-voz`).

## Captación de salida (llamadas, puerta a puerta, email o WhatsApp en frío)

Cuando contactes tú a una empresa, mándale el enlace con tu nombre. Así la solicitud queda a tu nombre sin discusiones:

- Adrián: `pebaisystems.es/consultoria-gratuita/?origen=adrian`
- Daniel: `pebaisystems.es/consultoria-gratuita/?origen=daniel`
- Tarjetas de visita (QR): `pebaisystems.es/t/adrian` y `pebaisystems.es/t/dani`. Abren la tarjeta digital de cada uno (guardar contacto, WhatsApp, llamar, consultoría gratuita y servicios), generada con `website-pebai/scripts/make_tarjeta_digital.py`. Cuando haya vídeos de los servicios, se ponen en `SERVICIOS` de ese script.

También vale sobre cualquier enlace corto: `pebaisystems.es/wa?origen=adrian`.

### QRs de calle (panel › Captación › QRs)

Para la puerta fría hay un QR por situación de la conversación («Vale, me interesa», «Me lo pienso», «Mándame información»…). Se enseñan desde el móvil en el panel (botón «Enseñar», a pantalla completa) y se crean o cambian allí mismo.

- Cada QR apunta a `pebaisystems.es/q/<nombre>?p=a` (Adrián) o `?p=d` (Daniel): elige arriba «¿Quién lo enseña?» antes de enseñarlo.
- `api/qr.php` apunta el escaneo (sin datos personales) y redirige con `origen=<persona>&utm_source=qr&utm_medium=puerta_fria&utm_content=<nombre>`: la solicitud queda como **salida de esa persona**.
- El QR de WhatsApp abre el chat del equipo con un mensaje que ya dice con quién habló; ese no deja solicitud en el panel, solo el escaneo.
- Las vistas previas de enlaces (WhatsApp, Telegram…) y los robots no cuentan como escaneo.

## Canal y dueño de cada solicitud

Al llegar una solicitud, la web decide su canal con los utm y con la respuesta a "¿Cómo nos conociste?" del formulario:

| Señal | Canal |
|---|---|
| `?origen=adrian` / `?origen=daniel` o tarjeta `/t/…` | Salida de esa persona |
| `gclid`, `fbclid`, `ttclid` o `utm_medium` de pago (cpc…) | Anuncios · 5/5 |
| Google, Bing, ChatGPT, Perplexity o Gemini | SEO/GEO · Daniel |
| Instagram, TikTok, YouTube, Facebook, LinkedIn, X | Redes · 5/5 |
| Sin utm (directo o sin aceptar cookies) | Lo que responda en el formulario |
| Sin ningún dato | Redes · 5/5 (como dice el acuerdo) |

Si los utm y la respuesta no coinciden, manda la respuesta y la solicitud sale con el aviso **revisar**. También sale así cuando falta saber de quién es (respondió "me escribisteis", "me llamasteis o visitasteis" o "me lo recomendó alguien" sin enlace con nombre). En la ficha del panel, el bloque "Canal y dueño" permite confirmarlo o cambiarlo, y el cambio queda en el historial.

## Si se te olvida

No pasa nada: la web intenta adivinar el origen por la página de la que viene la visita. Pero desde las apps de Instagram y TikTok a menudo no se sabe y sale como "directo". Por eso conviene usar estos enlaces.
