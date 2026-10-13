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
.grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(106,92,255,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(106,92,255,.07) 1px, transparent 1px); background-size: 48px 48px; -webkit-mask-image: radial-gradient(ellipse at 70% 40%, #000 25%, transparent 75%); }
.glow { position: absolute; width: 820px; height: 820px; right: -260px; top: -280px; border-radius: 50%; background: radial-gradient(closest-side, rgba(106,92,255,.42), rgba(106,92,255,.08) 60%, transparent); }
.glow2 { position: absolute; width: 520px; height: 520px; left: -220px; bottom: -300px; border-radius: 50%; background: radial-gradient(closest-side, rgba(183,255,60,.14), transparent); }
.frame { position: absolute; inset: 22px; border: 1px solid rgba(106,92,255,.22); border-radius: 26px; }
.content { position: absolute; left: 76px; top: 64px; width: 720px; display: flex; flex-direction: column; }
.logo { height: 46px; width: auto; align-self: flex-start; }
.kicker { margin-top: 54px; display: inline-flex; align-self: flex-start; align-items: center; gap: 10px; padding: 9px 18px; border-radius: 999px; border: 1px solid rgba(183,255,60,.35); background: rgba(183,255,60,.06); color: #B7FF3C; font-size: 17px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
.kicker::before { content: ''; width: 9px; height: 9px; border-radius: 50%; background: #B7FF3C; box-shadow: 0 0 12px #B7FF3C; }
h1 { margin-top: 22px; font-size: 58px; white-space: nowrap; line-height: 1.05; font-weight: 800; color: #fff; letter-spacing: -0.02em; }
h1 em { font-family: 'Instrument Serif', serif; font-style: italic; font-weight: 400; color: #B7FF3C; letter-spacing: 0; }
.sub { margin-top: 18px; font-size: 24px; line-height: 1.4; color: #A3A8BC; max-width: 600px; }
.chips { margin-top: 28px; display: flex; gap: 12px; }
.chip { padding: 10px 18px; border-radius: 12px; border: 1px solid rgba(106,92,255,.3); background: rgba(14,18,34,.85); font-size: 19px; font-weight: 700; color: #fff; }
.side { position: absolute; right: 64px; top: 50%; transform: translateY(-50%); width: 320px; height: 320px; display: flex; align-items: center; justify-content: center; }
.ring { position: absolute; border-radius: 50%; border: 1px solid rgba(183,255,60,.18); }
.ring.r1 { inset: 0; } .ring.r2 { inset: -46px; border-color: rgba(106,92,255,.18); } .ring.r3 { inset: 46px; border-color: rgba(183,255,60,.28); }
.mark { width: 205px; filter: drop-shadow(0 0 40px rgba(106,92,255,.55)); }
.faces { position: relative; display: flex; }
.faces img { width: 168px; height: 168px; border-radius: 50%; object-fit: cover; border: 5px solid #0B0F1D; box-shadow: 0 0 0 3px rgba(183,255,60,.75), 0 20px 50px rgba(0,0,0,.5); }
.faces img + img { margin-left: -40px; }
.names { position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); white-space: nowrap; padding: 9px 18px; border-radius: 999px; background: rgba(11,15,29,.92); border: 1px solid rgba(106,92,255,.35); font-size: 19px; font-weight: 700; }
.names b { color: #B7FF3C; }
.url { position: absolute; right: 64px; bottom: 44px; font-size: 18px; font-weight: 700; color: #6B7089; letter-spacing: .04em; }
"""

HTML = """<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=block" rel="stylesheet">
<style>%(css)s</style></head><body>
<div class="grid"></div><div class="glow"></div><div class="glow2"></div><div class="frame"></div>
<div class="content">
  <img class="logo" src="%(brand)s/pebai-horizontal-color-mineral-cropped.png">
  <span class="kicker">%(kicker)s</span>
  <h1>%(title)s</h1>
  <p class="sub">%(sub)s</p>
  <div class="chips">%(chips)s</div>
</div>
<div class="side"><span class="ring r2"></span><span class="ring r1"></span>%(side)s</div>
<div class="url">pebaisystems.es</div>
</body></html>"""

SIDE_MARK = '<span class="ring r3"></span><img class="mark" src="%s/pebai-logo-03-master-transparent-v1.png">' % BRAND
SIDE_TEAM = ('<div class="faces"><img src="%s/avatar-adrian.webp"><img src="%s/avatar-dani.webp"></div>'
             '<div class="names">Te atenderán <b>Adrián</b> o <b>Dani</b></div>') % (TEAM, TEAM)


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
                'side': SIDE_TEAM if v['side'] == 'team' else SIDE_MARK,
            }
            tmp.write_text(html, encoding='utf-8')
            page.goto(tmp.as_uri())
            page.evaluate('document.fonts.ready')
            page.wait_for_timeout(400)
            png = page.screenshot(type='png')
            img = Image.open(io.BytesIO(png)).convert('RGB')
            dest = OUT / f'{name}.jpg'
            img.save(dest, 'JPEG', quality=88, optimize=True, progressive=True)
            print(f'{dest.name}: {dest.stat().st_size // 1024} KB')
        browser.close()
    tmp.unlink(missing_ok=True)


if __name__ == '__main__':
    main()
