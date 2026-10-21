# Plantillas de imagen para Google Business Profile (y LinkedIn)

Tres plantillas HTML de 1200x900 px (4:3, el tamaño que recomienda Google) para la publicación semanal de la ficha de Google. Se reutilizan tal cual en LinkedIn.

| Plantilla | Archivo | Para qué |
|---|---|---|
| A · pregunta | `a-pregunta.html` | Pregunta grande que se hace un dueño de empresa, una línea y una pieza de interfaz: registro de llamadas perdidas (`card: "calls"`) o un chat con un asistente que recomienda empresas (`card: "chat"`). |
| B · cómo lo hacemos | `b-proceso.html` | Proceso en tres pasos numerados (`mode: "steps"`) o un antes / después a dos columnas con el documento que sale (`mode: "before_after"`). |
| C · consultoría | `c-consultoria.html` | Invitación a la consultoría de 25 minutos como un pase con matriz: "5 plazas al mes", mes en curso y la condición "Gratuita para cinco empresas al mes. Después, de pago." siempre visible. |

Estilo: el de la web (fondo `#0A0912` o marfil `#F3F1EC`, Instrument Serif para el titular con cursiva de acento, Manrope para el texto, lima `#B7FF3C` y violeta `#6A5CFF`), rejilla fina, grano y raíles laterales con marcas de corte. Sin fotos de stock ni ilustraciones.

## Recorte 1:1

Google recorta a cuadrado en algunas vistas. Todo el texto, el logo y la URL viven en la zona central de 900x900 (x 150-1050). Los raíles laterales son decorativos y pueden perderse. Para comprobarlo:

- en el navegador: abrir la plantilla con `?safe=1` (dibuja la zona segura);
- al renderizar: `--crop` guarda además `<nombre>_1x1.png` con el recorte central.

## Renderizar desde la línea de comandos

Requisitos: Python con `playwright` (`pip install playwright` y `playwright install chromium`; si no está, usa Edge o Chrome del sistema) y conexión a internet para Instrument Serif y JetBrains Mono (Google Fonts). Manrope y el logo se cargan del repositorio.

1. Crear un JSON con el contenido (copiar uno de `examples/`):

```json
{
  "template": "a",
  "out": "2026-s44-llamadas.png",
  "theme": "dark",
  "serie": "S44",
  "tag": "Atención al cliente",
  "title": "¿Cuántas llamadas pierde tu empresa *fuera de horario*?",
  "subtitle": "Cada llamada sin contestar es un cliente que acaba llamando a otro.",
  "card": "calls",
  "card_title": "Llamadas perdidas · esta semana",
  "items": ["Llamada perdida: Lun 20:47", "Llamada perdida: Mié 21:15", "Llamada perdida: Sáb 10:30"],
  "highlight": "Un agente de voz las atiende y te deja el resumen por WhatsApp."
}
```

2. Renderizar desde la raíz del repositorio:

```bash
python carousel-engine/render_gbp.py ruta/al/post.json --out-dir scratch/gbp --crop
```

Acepta varios JSON a la vez, o un JSON con una lista de objetos. Sale con código 1 si alguna imagen falla y avisa si una fuente no cargó, así que un agente programado puede comprobar el resultado sin mirar la imagen. `--scale 2` saca 2400x1800 si hace falta más resolución.

Para regenerar los seis ejemplos:

```bash
python carousel-engine/render_gbp.py carousel-engine/templates/gbp/examples/*.json --out-dir scratch/gbp-previews --crop
```

Vista rápida sin Python: abrir la plantilla en el navegador con parámetros, por ejemplo
`a-pregunta.html?title=¿Pierdes%20clientes%20*por%20la%20noche*?&subtitle=...&items=a|b|c&theme=light&safe=1`
(o `?data=<JSON en base64url>`).

## Campos

Comunes a las tres:

| Campo | Qué es |
|---|---|
| `template` | `a`, `b` o `c` |
| `out` | ruta del PNG (relativa a `--out-dir` si se pasa) |
| `theme` | `dark` (por defecto) o `light`. Alternar semana a semana da variedad a la ficha. |
| `tag` | etiqueta de la esquina superior derecha. Vacía, no sale. |
| `title` | titular. Lo que va entre `*asteriscos*` sale en cursiva de color. Si es largo, la plantilla reduce el cuerpo sola. |
| `subtitle` | una línea de apoyo (opcional) |
| `serie` | texto pequeño del raíl derecho, por ejemplo `S44` (semana) |
| `note` | nota pequeña junto a la URL, abajo a la derecha (A y B) |

A · pregunta: `card` (`calls`, `chat` o vacío), `card_title`, `items` (en `calls`, "Etiqueta: hora"; en `chat`, las opciones de la respuesta: `"-"` es una opción borrosa y cualquier otro texto sale resaltado), `highlight` (franja final de `calls`), `question` y `answer` (en `chat`).

B · cómo lo hacemos: `mode` (`steps` o `before_after`). En `steps`, `items` son tres textos "Título: explicación". En `before_after`: `before_label`, `after_label`, `before` y `after` (listas de tres), `before_meta`, `after_meta`, `doc_name` y `doc_status` (la ficha del documento que sale; vacía, no se pinta).

C · consultoría: `chips` (la primera sale resaltada), `items` (tres puntos de lo que se hace en la sesión), `plazas` (5), `plazas_ocupadas` (solo con el dato real del panel; por defecto 0), `month`, `condition`, `cta`, `cta_url`. Si `condition` llega vacía, la plantilla repone la condición de las cinco plazas: nunca sale "gratuita" sin el límite.

## Reglas de copy

Antes de publicar, el texto pasa por la voz de `.claude/skills/geo-pebai/references/embudo-y-voz.md`: tuteo, frases cortas, sin exclamaciones, sin emojis, sin raya larga y sin las palabras prohibidas de la sección 3 (auditoría, hoja de ruta, cuello de botella, "gratis" sin el límite, cifras inventadas…). La consultoría siempre es de 25 minutos y gratuita solo para cinco empresas al mes. Las piezas de interfaz (llamadas, chat, presupuesto) son ilustrativas: no poner nombres de clientes reales ni cifras sin fuente.
