"""Genera las imágenes de vista previa (WhatsApp, LinkedIn, X...) de las páginas del embudo.

Sin textos: el título y la descripción ya los muestra WhatsApp debajo de la imagen.
Todo lo importante va en el cuadrado central (WhatsApp en ordenador recorta ahí);
los laterales solo se ven en la vista rectangular del móvil.

Uso:  python website-pebai/scripts/make_og_images.py
Salida: website-pebai/dist/brand/og/*.jpg  (1200x630, < 150 KB)
"""
import io
import math
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

DIST = Path(__file__).resolve().parents[1] / 'dist'
OUT = DIST / 'brand' / 'og'
BRAND = (DIST / 'brand').as_uri()
TEAM = (DIST / 'team').as_uri()

# página -> con o sin el equipo en los laterales
VARIANTS = {
    'og-consultoria': False,
    'og-solicitud': False,
    'og-revision': True,
    'og-reservar': True,
    'og-confirmacion': True,
}

CSS = """
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 1200px; height: 630px; overflow: hidden; }
body { background: #070911; position: relative; }
.grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(106,92,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(106,92,255,.08) 1px, transparent 1px); background-size: 48px 48px; -webkit-mask-image: radial-gradient(ellipse at 50% 50%, #000 15%, transparent 70%); }
.glow { position: absolute; left: 50%; top: 50%; width: 980px; height: 980px; transform: translate(-50%, -50%); border-radius: 50%; background: radial-gradient(closest-side, rgba(106,92,255,.42), rgba(106,92,255,.10) 55%, transparent); }
.glow2 { position: absolute; left: 50%; top: 58%; width: 520px; height: 300px; transform: translate(-50%, -50%); border-radius: 50%; background: radial-gradient(closest-side, rgba(183,255,60,.16), transparent); }
.frame { position: absolute; inset: 22px; border: 1px solid rgba(106,92,255,.22); border-radius: 26px; }

.orbit { position: absolute; left: 50%; top: 50%; border-radius: 50%; transform: translate(-50%, -50%); border: 1px solid rgba(106,92,255,.22); }
.o1 { width: 300px; height: 300px; border-color: rgba(183,255,60,.30); }
.o2 { width: 440px; height: 440px; }
.o3 { width: 580px; height: 580px; border-color: rgba(106,92,255,.14); border-style: dashed; }
.spark { position: absolute; width: 12px; height: 12px; margin: -6px 0 0 -6px; border-radius: 50%; background: #B7FF3C; box-shadow: 0 0 16px #B7FF3C, 0 0 34px rgba(183,255,60,.6); }
.spark.v { background: #7E73FF; box-shadow: 0 0 16px #7E73FF, 0 0 34px rgba(106,92,255,.7); width: 10px; height: 10px; margin: -5px 0 0 -5px; }
.spark.s { width: 7px; height: 7px; margin: -3.5px 0 0 -3.5px; }

.center { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 230px; height: 230px; border-radius: 50%;
  background: radial-gradient(circle at 50% 40%, #151A3A, #0B0F1D 70%); border: 1px solid rgba(183,255,60,.35);
  box-shadow: 0 0 0 10px rgba(106,92,255,.06), 0 0 90px rgba(106,92,255,.55), inset 0 0 40px rgba(106,92,255,.25);
  display: flex; align-items: center; justify-content: center; }
.center img { width: 150px; filter: drop-shadow(0 0 26px rgba(106,92,255,.7)); }

.face { position: absolute; top: 50%; transform: translateY(-50%); width: 190px; height: 190px; border-radius: 50%; overflow: hidden;
  border: 5px solid #0B0F1D; box-shadow: 0 0 0 3px rgba(183,255,60,.8), 0 0 60px rgba(106,92,255,.4), 0 24px 60px rgba(0,0,0,.55); }
.face img { width: 100%; height: 100%; object-fit: cover; display: block; }
.face.left { left: 92px; } .face.right { right: 92px; }
.link { position: absolute; top: 50%; height: 2px; margin-top: -1px; background: linear-gradient(90deg, rgba(183,255,60,0), rgba(183,255,60,.6)); }
.link.left { left: 292px; width: 100px; }
.link.right { right: 292px; width: 100px; background: linear-gradient(270deg, rgba(183,255,60,0), rgba(183,255,60,.6)); }
"""

HTML = """<!doctype html><html><head><meta charset="utf-8"><style>%(css)s</style></head><body>
<div class="grid"></div><div class="glow"></div><div class="glow2"></div><div class="frame"></div>
<div class="orbit o3"></div><div class="orbit o2"></div><div class="orbit o1"></div>
%(sparks)s
<div class="center"><img src="%(brand)s/pebai-logo-03-master-transparent-v1.png" alt=""></div>
%(team)s
</body></html>"""

# Puntos de luz sobre las órbitas: (radio, ángulo en grados, clase)
SPARKS = [(150, -38, ''), (150, 142, 'v s'), (220, 205, 'v'), (220, 18, 's'), (290, -112, 's'), (290, 68, 'v s')]

TEAM_HTML = ('<div class="face left"><img src="%s/avatar-adrian.webp" alt=""></div>'
             '<div class="face right"><img src="%s/avatar-dani.webp" alt=""></div>') % (TEAM, TEAM)


def sparks_html():
    out = []
    for r, deg, cls in SPARKS:
        x = 600 + r * math.cos(math.radians(deg))
        y = 315 + r * math.sin(math.radians(deg))
        out.append('<span class="spark %s" style="left:%.1fpx;top:%.1fpx"></span>' % (cls, x, y))
    return ''.join(out)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    tmp = OUT / '_render.html'
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width': 1200, 'height': 630}, device_scale_factor=1)
        for name, with_team in VARIANTS.items():
            tmp.write_text(HTML % {
                'css': CSS,
                'brand': BRAND,
                'sparks': sparks_html(),
                'team': TEAM_HTML if with_team else '',
            }, encoding='utf-8')
            page.goto(tmp.as_uri())
            page.wait_for_timeout(300)
            img = Image.open(io.BytesIO(page.screenshot(type='png'))).convert('RGB')
            dest = OUT / f'{name}.jpg'
            img.save(dest, 'JPEG', quality=88, optimize=True, progressive=True)
            print(f'{dest.name}: {dest.stat().st_size // 1024} KB')
        browser.close()
    tmp.unlink(missing_ok=True)


if __name__ == '__main__':
    main()
