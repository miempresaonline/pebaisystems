"""Genera las imágenes de vista previa (WhatsApp, LinkedIn, X...) de las páginas del embudo.

Uso:  python website-pebai/scripts/make_og_images.py
Salida: website-pebai/dist/brand/og/*.jpg  (1200x630, < 300 KB, lo que WhatsApp muestra bien)
"""
import io
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

DIST = Path(__file__).resolve().parents[1] / 'dist'
OUT = DIST / 'brand' / 'og'
BRAND = (DIST / 'brand').as_uri()
TEAM = (DIST / 'team').as_uri()

VARIANTS = {
    'og-consultoria': {
        'kicker': 'Consultoría de procesos e IA',
        'title': 'Descubre qué puede<br>automatizar <em>tu empresa.</em>',
        'sub': 'Analizamos tus procesos y te llevas el mapa de mejoras. Sesión técnica a coste cero.',
        'chips': ['25 min', 'Sin compromiso', '0 €'],
        'side': 'mark',
    },
    'og-solicitud': {
        'kicker': 'Solicitud privada',
        'title': 'Cuéntanos tu caso<br><em>en 30 segundos.</em>',
        'sub': 'Cuatro preguntas y valoramos si podemos generar un impacto real en tu empresa.',
        'chips': ['4 preguntas', '100 % privado'],
        'side': 'mark',
    },
    'og-revision': {
        'kicker': 'Solicitud recibida',
        'title': 'Ya estamos revisando<br><em>tu solicitud.</em>',
        'sub': 'Una persona de nuestro equipo te escribirá por WhatsApp en menos de 24 horas.',
        'chips': ['Revisión manual', 'Respuesta en 24 h'],
        'side': 'team',
    },
    'og-reservar': {
        'kicker': 'Sesión técnica privada',
        'title': 'Tu empresa encaja.<br><em>Elige cuándo hablamos.</em>',
        'sub': 'Reserva tu sesión técnica privada con nuestro equipo de ingeniería.',
        'chips': ['25 min', 'Google Meet', '0 €'],
        'side': 'team',
    },
    'og-confirmacion': {
        'kicker': 'Sesión confirmada',
        'title': 'Sesión confirmada.<br><em>Nos vemos en Meet.</em>',
        'sub': 'Tienes el enlace de Google Meet en tu email. Guarda la cita en tu calendario.',
        'chips': ['25 min', 'Google Meet'],
        'side': 'team',
    },
}

CSS = """
@font-face { font-family: 'Manrope'; src: url('%(brand)s/Manrope-latin-variable.woff2') format('woff2'); font-weight: 200 800; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 1200px; height: 630px; overflow: hidden; }
body { background: #070911; font-family: 'Manrope', sans-serif; color: #ECEBF0; position: relative; }
.grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(106,92,255,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(106,92,255,.07) 1px, transparent 1px); background-size: 48px 48px; -webkit-mask-image: radial-gradient(ellipse at 50% 45%, #000 20%, transparent 72%); }
.glow { position: absolute; width: 900px; height: 900px; left: 50%; top: -420px; transform: translateX(-50%); border-radius: 50%; background: radial-gradient(closest-side, rgba(106,92,255,.40), rgba(106,92,255,.07) 62%, transparent); }
.glow2 { position: absolute; width: 700px; height: 340px; left: 50%; bottom: -230px; transform: translateX(-50%); border-radius: 50%; background: radial-gradient(closest-side, rgba(183,255,60,.13), transparent); }
.frame { position: absolute; inset: 22px; border: 1px solid rgba(106,92,255,.22); border-radius: 26px; }

/* Todo el mensaje vive en el cuadrado central (x 300-900): WhatsApp en ordenador recorta ahí */
.content { position: absolute; left: 315px; top: 0; width: 570px; height: 630px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.logo { height: 42px; width: auto; }
.kicker { margin-top: 30px; display: inline-flex; align-items: center; gap: 10px; padding: 8px 16px; border-radius: 999px; border: 1px solid rgba(183,255,60,.35); background: rgba(183,255,60,.06); color: #B7FF3C; font-size: 15px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; white-space: nowrap; }
.kicker::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background: #B7FF3C; box-shadow: 0 0 12px #B7FF3C; }
h1 { margin-top: 18px; font-size: 50px; white-space: nowrap; line-height: 1.08; font-weight: 800; color: #fff; letter-spacing: -0.02em; }
h1 em { font-family: 'Instrument Serif', serif; font-style: italic; font-weight: 400; color: #B7FF3C; letter-spacing: 0; }
.sub { margin-top: 16px; font-size: 21px; line-height: 1.42; color: #A3A8BC; max-width: 540px; }
.chips { margin-top: 24px; display: flex; gap: 10px; justify-content: center; }
.chip { padding: 9px 16px; border-radius: 12px; border: 1px solid rgba(106,92,255,.3); background: rgba(14,18,34,.85); font-size: 17px; font-weight: 700; color: #fff; white-space: nowrap; }

/* Laterales: solo se ven en la vista rectangular (móvil) */
.side { position: absolute; top: 50%; transform: translateY(-50%); width: 220px; display: flex; flex-direction: column; align-items: center; }
.side.left { left: 48px; } .side.right { right: 48px; }
.person img { width: 176px; height: 176px; border-radius: 50%; object-fit: cover; border: 5px solid #0B0F1D; box-shadow: 0 0 0 3px rgba(183,255,60,.75), 0 0 60px rgba(106,92,255,.35), 0 20px 50px rgba(0,0,0,.5); display: block; }
.person span { display: block; margin-top: 16px; padding: 7px 16px; border-radius: 999px; background: rgba(11,15,29,.92); border: 1px solid rgba(106,92,255,.35); font-size: 18px; font-weight: 700; text-align: center; }
.person span b { color: #B7FF3C; }
.person small { display: block; margin-top: 6px; font-size: 14px; color: #6B7089; text-align: center; font-weight: 600; }
.orb { position: relative; width: 210px; height: 210px; display: flex; align-items: center; justify-content: center; }
.orb::before, .orb::after { content: ''; position: absolute; border-radius: 50%; }
.orb::before { inset: 0; border: 1px solid rgba(183,255,60,.22); }
.orb::after { inset: -34px; border: 1px solid rgba(106,92,255,.2); }
.orb img { width: 140px; filter: drop-shadow(0 0 34px rgba(106,92,255,.6)); }
.orb.check { background: radial-gradient(closest-side, rgba(106,92,255,.25), transparent); }
.orb.check svg { filter: drop-shadow(0 0 14px rgba(183,255,60,.6)); }
.orb .dot { width: 14px; height: 14px; border-radius: 50%; background: #B7FF3C; box-shadow: 0 0 18px #B7FF3C; }
.url { position: absolute; left: 0; right: 0; bottom: 40px; text-align: center; font-size: 16px; font-weight: 700; color: #6B7089; letter-spacing: .06em; }
"""

HTML = """<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=block" rel="stylesheet">
<style>%(css)s</style></head><body>
<div class="grid"></div><div class="glow"></div><div class="glow2"></div><div class="frame"></div>
%(sides)s
<div class="content">
  <img class="logo" src="%(brand)s/pebai-horizontal-color-mineral-cropped.png">
  <span class="kicker">%(kicker)s</span>
  <h1>%(title)s</h1>
  <p class="sub">%(sub)s</p>
  <div class="chips">%(chips)s</div>
</div>
<div class="url">pebaisystems.es</div>
</body></html>"""

SIDE_MARK = ('<div class="side left"><div class="orb check"><svg viewBox="0 0 132 132" width="120" height="120"><path d="M42 68 L59 85 L92 50" fill="none" stroke="#B7FF3C" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg></div></div>'
             '<div class="side right"><div class="orb"><img src="%s/pebai-logo-03-master-transparent-v1.png"></div></div>') % BRAND
SIDE_TEAM = ('<div class="side left person"><img src="%s/avatar-adrian.webp"><span><b>Adrián</b></span><small>Ingeniería de procesos</small></div>'
             '<div class="side right person"><img src="%s/avatar-dani.webp"><span><b>Dani</b></span><small>Ingeniería de procesos</small></div>') % (TEAM, TEAM)

# Si un título no cabe en el cuadrado, se reduce hasta que quepa
FIT_JS = """() => {
  const box = 560;
  for (const sel of ['h1', '.sub', '.chips', '.kicker']) {
    const el = document.querySelector(sel);
    let size = parseFloat(getComputedStyle(el).fontSize);
    while (el.scrollWidth > box && size > 12) { size -= 1; el.style.fontSize = size + 'px'; }
  }
  const c = document.querySelector('.content').getBoundingClientRect();
  return Math.round(c.left) + '-' + Math.round(c.right);
}"""


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    tmp = OUT / '_render.html'
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width': 1200, 'height': 630}, device_scale_factor=1)
        for name, v in VARIANTS.items():
            html = HTML % {
                'css': CSS.replace('%(brand)s', BRAND),
                'brand': BRAND,
                'kicker': v['kicker'],
                'title': v['title'],
                'sub': v['sub'],
                'chips': ''.join('<span class="chip">%s</span>' % c for c in v['chips']),
                'sides': SIDE_TEAM if v['side'] == 'team' else SIDE_MARK,
            }
            tmp.write_text(html, encoding='utf-8')
            page.goto(tmp.as_uri())
            page.evaluate('document.fonts.ready')
            page.wait_for_timeout(400)
            page.evaluate(FIT_JS)
            png = page.screenshot(type='png')
            img = Image.open(io.BytesIO(png)).convert('RGB')
            dest = OUT / f'{name}.jpg'
            img.save(dest, 'JPEG', quality=88, optimize=True, progressive=True)
            print(f'{dest.name}: {dest.stat().st_size // 1024} KB')
        browser.close()
    tmp.unlink(missing_ok=True)


if __name__ == '__main__':
    main()
