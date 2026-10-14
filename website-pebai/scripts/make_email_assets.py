"""Genera las imágenes de los emails (logo e iconos) en website-pebai/dist/brand/email/.

- logo-email.png: el logo con las letras oscuras sobre blanco opaco (se lee igual en modo claro y oscuro).
- ic-*.png: iconos a 2x para la ficha de la cita y los botones.

Uso:  python website-pebai/scripts/make_email_assets.py
"""
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

DIST = Path(__file__).resolve().parents[1] / 'dist'
OUT = DIST / 'brand' / 'email'
VIOLET = '#594AF7'


def logo():
    im = Image.open(DIST / 'brand' / 'pebai-horizontal-color-mineral-cropped.png').convert('RGBA')
    px = im.load()
    for y in range(im.size[1]):
        for x in range(im.size[0]):
            r, g, b, a = px[x, y]
            if a and max(r, g, b) - min(r, g, b) < 40:   # letras grises/blancas -> casi negro
                px[x, y] = (18, 18, 26, a)
    w = 336
    im = im.resize((w, round(im.size[1] * w / im.size[0])), Image.LANCZOS)
    bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
    bg.alpha_composite(im)
    bg.convert('RGB').save(OUT / 'logo-email.png', optimize=True)


# Trazos tipo "outline" de 24x24
ICONS = {
    'calendar': '<rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
    'clock': '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>',
    'video': '<rect x="2.5" y="6" width="13" height="12" rx="2.5"/><path d="M15.5 10.5l6-3.5v10l-6-3.5z"/>',
}


def icons():
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(device_scale_factor=2)
        for name, paths in ICONS.items():
            for variant, (bg, stroke, size) in {
                'tile': ('#EFEDFF', VIOLET, 40),       # icono en cuadrado lila (ficha de la cita)
                'white': ('transparent', '#FFFFFF', 20),  # icono blanco para botones oscuros
            }.items():
                inner = 22 if variant == 'tile' else 20
                html = (f'<html><body style="margin:0;background:transparent">'
                        f'<div id="i" style="width:{size}px;height:{size}px;border-radius:10px;background:{bg};'
                        f'display:flex;align-items:center;justify-content:center">'
                        f'<svg width="{inner}" height="{inner}" viewBox="0 0 24 24" fill="none" stroke="{stroke}" '
                        f'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{paths}</svg></div></body></html>')
                pg.set_content(html)
                pg.locator('#i').screenshot(path=str(OUT / f'ic-{name}-{variant}.png'), omit_background=True)
        b.close()


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    logo()
    icons()
    print('\n'.join(sorted(f.name for f in OUT.iterdir())))
