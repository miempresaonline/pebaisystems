"""Tarjeta digital de cada persona: lo que abre el QR de las tarjetas de puerta fría.

Genera dist/t/<persona>/index.html y dist/t/<persona>/<persona>.vcf (contacto con foto).
La visita queda medida como utm_source=tarjeta, utm_medium=puerta_fria, utm_content=<persona>,
y la solicitud que salga de aquí queda a nombre de esa persona (?origen=...).

Uso:  python website-pebai/scripts/make_tarjeta_digital.py
Cuando haya vídeos de los servicios: rellenar 'video' en SERVICIOS (ruta /video/...mp4) y volver a generar.
"""
import base64
import html
import io
from pathlib import Path

from PIL import Image

DIST = Path(__file__).resolve().parents[1] / 'dist'
TEL = '+34624842799'
TEL_TXT = '624 84 27 99'
EMAIL = 'equipo@pebaisystems.es'

PERSONAS = {
    'adrian': {'nombre': 'Adrián', 'apellidos': 'Ballesteros Moscardó', 'rol': 'Dirección de proyectos y consultoría',
               'foto': DIST / 'brand/home/adrian-v2.webp', 'origen': 'adrian'},
    'dani': {'nombre': 'Daniel', 'apellidos': 'Peñuela Ruiz', 'rol': 'Ingeniería de procesos y sistemas',
             'foto': DIST / 'brand/home/dani.webp', 'origen': 'daniel'},
}

SERVICIOS = [
    {'titulo': 'Software operativo a medida',
     'que': 'Una herramienta pensada para tu forma de trabajar que reúne en un solo sitio pedidos, presupuestos, partes de trabajo, clientes e incidencias.',
     'pierdes': 'dinero en errores y duplicados, y el control de en qué punto está cada trabajo.',
     'ganas': 'información que se escribe una vez y está siempre al día, sin licencias por usuario.',
     'video': ''},
    {'titulo': 'Chatbots con Inteligencia Artificial',
     'que': 'Un asistente conectado a tus manuales, tarifas y documentos. Responde con la información de tu empresa y avisa a tu equipo cuando hace falta una persona.',
     'pierdes': 'clientes que esperan demasiado una respuesta, y respuestas distintas según quién conteste.',
     'ganas': 'respuestas al momento, iguales para todos y a cualquier hora.',
     'video': ''},
    {'titulo': 'Agentes de voz',
     'que': 'Un asistente que contesta las llamadas con voz natural, resuelve las consultas habituales y agenda citas en tu calendario.',
     'pierdes': 'clientes que no dejan mensaje y llaman a otra empresa.',
     'ganas': 'llamadas atendidas de día, de noche y en fin de semana, y citas que se agendan solas.',
     'video': ''},
    {'titulo': 'Visibilidad en buscadores de Inteligencia Artificial',
     'que': 'Trabajamos la información de tu empresa en internet para que ChatGPT, Gemini y el resto te entiendan y te recomienden.',
     'pierdes': 'clientes que preguntan a la Inteligencia Artificial y nunca llegan a conocerte.',
     'ganas': 'presencia cuando alguien pregunta por lo que ofreces, y clientes que llegan sabiendo lo que buscan.',
     'video': ''},
]


def foto_cuadrada(path: Path, size: int) -> Image.Image:
    im = Image.open(path).convert('RGB')
    w, h = im.size
    s = min(w, h)
    top = int((h - s) * 0.15)  # encuadre alto: cara, no pecho
    return im.crop(((w - s) // 2, top, (w - s) // 2 + s, top + s)).resize((size, size), Image.LANCZOS)


def vcard(key: str, p: dict) -> str:
    buf = io.BytesIO()
    foto_cuadrada(p['foto'], 240).save(buf, 'JPEG', quality=82)
    b64 = base64.b64encode(buf.getvalue()).decode()
    lineas = [b64[i:i + 74] for i in range(0, len(b64), 74)]
    foto = 'PHOTO;ENCODING=b;TYPE=JPEG:' + '\r\n '.join(lineas)
    return '\r\n'.join([
        'BEGIN:VCARD', 'VERSION:3.0',
        f"N:{p['apellidos']};{p['nombre']};;;",
        f"FN:{p['nombre']} {p['apellidos']}",
        'ORG:PEBAI Systems',
        f"TITLE:{p['rol']}",
        f'TEL;TYPE=CELL,VOICE:{TEL}',
        f'EMAIL;TYPE=WORK:{EMAIL}',
        'URL:https://pebaisystems.es',
        f"NOTE:Nos conocimos en persona. Consultoría gratuita: https://pebaisystems.es/t/{key}",
        foto, 'END:VCARD', ''])


ICONOS = {
    'guardar': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
    'wa': '<path d="M3 21l1.7-5A8.5 8.5 0 1 1 8 19.3L3 21z"/><path d="M9 10c0 3 2 5 5 5l1.2-1.2-2-1-1 .8c-1-.4-1.6-1-2-2l.8-1-1-2L9 10z"/>',
    'tel': '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.8 2z"/>',
    'flecha': '<path d="M5 12h14M13 6l6 6-6 6"/>',
}


def svg(name: str) -> str:
    return (f'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICONOS[name]}</svg>')


CSS = """
@font-face{font-family:Manrope;src:url(/brand/Manrope-latin-variable.woff2) format('woff2');font-weight:200 800;font-display:swap}
:root{--bg:#0A0912;--s1:#14122A;--s2:#1C1938;--fg:#EFEDE7;--mut:#A3A8BC;--lime:#B7FF3C;--violet:#6A5CFF;--line:rgba(239,237,231,.10)}
*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-text-size-adjust:100%}
body{background:var(--bg);color:var(--fg);font:400 16px/1.55 Manrope,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;min-height:100vh;
  background-image:radial-gradient(60% 40% at 50% 0%,rgba(106,92,255,.28),transparent 70%)}
.wrap{max-width:460px;margin:0 auto;padding:22px 18px 40px}
.top{display:flex;justify-content:center;margin-bottom:26px}
.top img{height:26px;width:auto}
.perfil{text-align:center}
.foto{width:124px;height:124px;border-radius:50%;object-fit:cover;border:3px solid var(--lime);box-shadow:0 0 0 6px rgba(183,255,60,.10),0 18px 40px rgba(0,0,0,.45)}
h1{margin-top:16px;font-size:28px;line-height:1.15;font-weight:800;letter-spacing:-.01em}
.rol{margin-top:4px;color:var(--mut);font-size:15px}
.marca{margin-top:10px;display:inline-block;padding:5px 12px;border-radius:999px;background:rgba(183,255,60,.10);color:var(--lime);font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
.intro{margin:18px auto 0;max-width:380px;color:#D6D8E2;font-size:16px}
.acciones{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:24px}
.btn{display:flex;align-items:center;justify-content:center;gap:9px;min-height:54px;padding:12px 16px;border-radius:14px;font-weight:700;font-size:16px;text-decoration:none;color:var(--fg);background:var(--s2);border:1px solid var(--line)}
.btn.prim{grid-column:1/-1;background:var(--lime);color:#0B0F14;border:0;font-size:17px}
.btn.wa{background:#1FAF55;border:0;color:#fff}
.btn:active{transform:scale(.98)}
.oferta{margin-top:28px;padding:22px 20px;border-radius:20px;background:linear-gradient(160deg,var(--s2),var(--s1));border:1px solid rgba(106,92,255,.35)}
.kicker{font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--lime)}
.oferta h2{margin-top:8px;font-size:22px;line-height:1.25;font-weight:800}
.oferta ul{list-style:none;margin:14px 0 18px;display:grid;gap:8px}
.oferta li{display:flex;gap:10px;color:#D6D8E2;font-size:15px}
.oferta li:before{content:"";flex:0 0 8px;height:8px;margin-top:8px;border-radius:50%;background:var(--lime)}
.oferta .btn{background:var(--violet);border:0;color:#fff}
.nota{margin-top:10px;text-align:center;color:var(--mut);font-size:13px}
.servicios{margin-top:30px}
.servicios h2{font-size:20px;font-weight:800;margin-bottom:12px}
details{border:1px solid var(--line);border-radius:16px;background:var(--s1);margin-bottom:10px;overflow:hidden}
summary{list-style:none;cursor:pointer;padding:16px 18px;font-weight:700;font-size:16px;display:flex;justify-content:space-between;align-items:center;gap:12px}
summary::-webkit-details-marker{display:none}
summary:after{content:"+";color:var(--lime);font-size:22px;font-weight:600;line-height:1}
details[open] summary:after{content:"–"}
.cuerpo{padding:0 18px 18px;color:#D6D8E2;font-size:15px}
.cuerpo p+p{margin-top:10px}
.cuerpo b{color:var(--fg)}
.cuerpo video{width:100%;border-radius:12px;margin-bottom:12px;background:#000}
.pie{margin-top:30px;text-align:center;color:var(--mut);font-size:13px;line-height:1.8}
.pie a{color:var(--mut)}
"""


def pagina(key: str, p: dict) -> str:
    nombre = f"{p['nombre']} {p['apellidos']}"
    form = f"/diagnostico/?origen={p['origen']}&cta=tarjeta_digital"
    wa = 'https://wa.me/' + TEL.lstrip('+') + '?text=' + 'Hola%20' + p['nombre'] + '%2C%20nos%20conocimos%20en%20persona%20y%20me%20gustar%C3%ADa%20saber%20m%C3%A1s.'
    servicios = ''
    for s in SERVICIOS:
        video = (f'<video src="{s["video"]}" controls playsinline preload="none"></video>' if s['video'] else '')
        servicios += (f'<details><summary>{html.escape(s["titulo"])}</summary><div class="cuerpo">{video}'
                      f'<p>{html.escape(s["que"])}</p>'
                      f'<p><b>Sin esto, pierdes</b> {html.escape(s["pierdes"])}</p>'
                      f'<p><b>Con esto, ganas</b> {html.escape(s["ganas"])}</p></div></details>')
    return f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#0A0912">
<title>{html.escape(nombre)} · PEBAI Systems</title>
<meta name="description" content="Contacto de {html.escape(nombre)}, de PEBAI Systems. Consultoría gratuita de 25 minutos para tu empresa.">
<meta property="og:title" content="{html.escape(nombre)} · PEBAI Systems">
<meta property="og:image" content="https://pebaisystems.es/brand/og/og-consultoria.jpg?v=3">
<link rel="icon" href="/favicon.ico">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<style>{CSS}</style>
<script>
// La visita queda medida como tarjeta de puerta fría de esta persona (antes de que lo lea utm.js)
try {{ if (!/[?&]utm_source=/.test(location.search)) history.replaceState(null, '', location.pathname + '?utm_source=tarjeta&utm_medium=puerta_fria&utm_content={key}'); }} catch (e) {{}}
</script>
<script src="/utm.js?v=3" defer></script>
<script src="/consent.js?v=3" defer></script>
</head>
<body>
<main class="wrap">
  <div class="top"><img src="/brand/pebai-horizontal-color-mineral-cropped.png" alt="PEBAI Systems" width="1042" height="303"></div>

  <section class="perfil">
    <img class="foto" src="/t/{key}/foto.jpg" alt="{html.escape(nombre)}" width="248" height="248">
    <h1>{html.escape(nombre)}</h1>
    <p class="rol">{html.escape(p['rol'])}</p>
    <span class="marca">PEBAI Systems</span>
    <p class="intro">Implantamos sistemas con Inteligencia Artificial que ahorran tiempo a tu equipo y atienden mejor a tus clientes.</p>
  </section>

  <div class="acciones">
    <a class="btn prim" href="/t/{key}/{key}.vcf" download="{key}-pebai.vcf">{svg('guardar')}Guardar contacto</a>
    <a class="btn wa" href="{wa}" target="_blank" rel="noopener">{svg('wa')}WhatsApp</a>
    <a class="btn" href="tel:{TEL}">{svg('tel')}Llamar</a>
  </div>

  <section class="oferta">
    <span class="kicker">Consultoría gratuita</span>
    <h2>Veinticinco minutos para ver dónde se te escapa el tiempo.</h2>
    <ul>
      <li>Videollamada en pantalla compartida.</li>
      <li>Te llevas el mapa técnico de lo que conviene automatizar en tu empresa.</li>
      <li>Solo 5 plazas gratuitas al mes. Después, la consultoría es de pago.</li>
    </ul>
    <a class="btn" href="{form}">Solicitar mi plaza {svg('flecha')}</a>
    <p class="nota">Te escribimos por WhatsApp en menos de 24 horas.</p>
  </section>

  <section class="servicios">
    <h2>Lo que hacemos</h2>
    {servicios}
  </section>

  <footer class="pie">
    <a href="/">pebaisystems.es</a> · {TEL_TXT} · {EMAIL}<br>
    <a href="/privacidad/">Privacidad</a> · <a href="/aviso-legal/">Aviso legal</a> · <a href="/politica-de-cookies/">Cookies</a>
  </footer>
</main>
</body>
</html>
"""


if __name__ == '__main__':
    for key, p in PERSONAS.items():
        out = DIST / 't' / key
        out.mkdir(parents=True, exist_ok=True)
        foto_cuadrada(p['foto'], 248).save(out / 'foto.jpg', 'JPEG', quality=84)
        (out / f'{key}.vcf').write_text(vcard(key, p), encoding='utf-8', newline='')
        (out / 'index.html').write_text(pagina(key, p), encoding='utf-8', newline='\n')
        print('ok', out)
