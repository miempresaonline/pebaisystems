"""Tarjetas de visita de PEBAI para puerta fría (una por persona, cada una con su QR medible).

Formato de Publikea (https://publikea.es/producto/tarjetas-de-visita-baratas/):
  tamaño final 83 x 52 mm · archivo 86 x 55 mm (1,5 mm de sangrado por lado) · margen de seguridad 4 mm
  cara A y cara B en archivos separados · 300 ppp · CMYK · fuentes en curvas
Se entregan como imagen CMYK a 300 ppp (JPG y PDF): al ir rasterizadas no hay fuentes que convertir.

El QR lleva a pebaisystems.es/t/<persona>, que redirige al vídeo del embudo con
utm_source=tarjeta&utm_medium=puerta_fria&utm_content=<persona> (regla en website-pebai/dist/.htaccess).

Uso:   python assets/brand/pebai-systems/tarjetas/make_tarjetas.py
Salida (en esta carpeta, subcarpeta publikea/):
  <persona>-cara-A.pdf / .jpg    anverso (CMYK, 300 ppp, 86 x 55 mm)
  <persona>-cara-B.pdf / .jpg    reverso
  vista-previa.png               todas las caras juntas para revisarlas (RGB, solo para ver)
"""
import base64
import io
from pathlib import Path

import segno
from PIL import Image
from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
OUT = HERE / 'publikea'
ROOT = HERE.parents[3]
LOGO = ROOT / 'assets/brand/pebai-systems/logo-kit-v2/pebai-horizontal-color-mineral-2320.png'
FONT = ROOT / 'assets/brand/pebai-systems/logo-kit-v2/fonts/Manrope-latin-variable.woff2'
TEAM = ROOT / 'website-pebai/dist/team'

PERSONAS = {
    'adrian': {'nombre': 'Adrián Ballesteros', 'rol': 'Dirección de proyectos', 'foto': HERE / 'adrian-foto.jpg'},
}
WHATSAPP = '624 84 27 99'

W_MM, H_MM = 86, 55          # archivo con sangrado
DPI = 300
PX_W, PX_H = round(W_MM / 25.4 * DPI), round(H_MM / 25.4 * DPI)   # 1016 x 650


def data_uri(path: Path, mime: str) -> str:
    return f'data:{mime};base64,' + base64.b64encode(path.read_bytes()).decode()


def qr_svg(url: str) -> str:
    qr = segno.make(url, error='q')
    return qr.svg_inline(scale=10, border=0, dark='#0A0912', light=None, omitsize=True)


CSS = """
@font-face { font-family: Manrope; src: url('%(font)s') format('woff2'); font-weight: 200 800; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: Manrope, sans-serif; background: #fff; }
.card { width: 86mm; height: 55mm; position: relative; overflow: hidden; }
.safe { position: absolute; inset: 5.5mm; }          /* 1,5 mm sangrado + 4 mm margen de seguridad */
.serif { font-family: 'Instrument Serif', serif; font-weight: 400; }

/* ---------- Cara A: oscura, quién eres ---------- */
.front { background: #0A0912; color: #EFEDE7; }
.front .glow { position: absolute; width: 66mm; height: 66mm; right: -24mm; top: -28mm; border-radius: 50%%;
  background: radial-gradient(closest-side, rgba(89,74,247,.55), rgba(89,74,247,0)); }
.front .glow2 { position: absolute; width: 44mm; height: 44mm; left: -19mm; bottom: -25mm; border-radius: 50%%;
  background: radial-gradient(closest-side, rgba(183,255,60,.18), rgba(183,255,60,0)); }
.front .logo { height: 5.2mm; display: block; }
.front h1 { position: absolute; left: 0; right: 0; top: 9.4mm; font-size: 16.5pt; line-height: 1.02; letter-spacing: -.01em; }
.front h1 i { color: #B7FF3C; }
.front .who { position: absolute; left: 0; bottom: 0; display: flex; align-items: center; gap: 2.4mm; }
.front .who img { width: 8.6mm; height: 8.6mm; border-radius: 50%%; object-fit: cover; border: .35mm solid #B7FF3C; }
.front .who b { display: block; font-size: 7.4pt; font-weight: 700; }
.front .who span { display: block; font-size: 6.1pt; color: #A3A8BC; margin-top: .4mm; }
.front .contact { position: absolute; right: 0; bottom: 0; text-align: right; }
.front .contact .wa { font-size: 8.2pt; font-weight: 700; letter-spacing: .01em; }
.front .contact .wa small { display: block; font-size: 5.5pt; font-weight: 600; letter-spacing: .14em; color: #B7FF3C; margin-bottom: .5mm; }
.front .contact .web { font-size: 6.3pt; color: #A3A8BC; margin-top: .6mm; }

/* ---------- Cara B: clara, todo apunta al QR ---------- */
.back { background: #EFEDE7; color: #0A0912; }
.back .left { position: absolute; left: 0; top: 0; bottom: 0; width: 43mm; display: flex; flex-direction: column; }
.back .kicker { font-size: 5.5pt; font-weight: 800; letter-spacing: .16em; color: #594AF7; }
.back h2 { margin-top: 1.4mm; font-size: 14pt; line-height: 1.02; letter-spacing: -.01em; }
.back h2 i { color: #594AF7; }
.back p { margin-top: 1.8mm; font-size: 6.4pt; line-height: 1.38; color: #3B3F4C; }
.back .chips { margin-top: auto; display: flex; gap: 1.1mm; flex-wrap: wrap; }
.back .chips span { font-size: 5.7pt; font-weight: 700; padding: .85mm 1.7mm; border-radius: 10mm; background: #0A0912; color: #EFEDE7; }
.back .chips span.lime { background: #B7FF3C; color: #0A0912; }
.back .right { position: absolute; right: 0; top: 0; bottom: 0; width: 24mm; display: flex; flex-direction: column; align-items: center; }
.back .qr { width: 24mm; height: 24mm; padding: 1.8mm; background: #FFFFFF; border-radius: 2.6mm; }
.back .qr svg { width: 100%%; height: 100%%; display: block; }
.back .scan { margin-top: 1.6mm; font-size: 6.2pt; font-weight: 800; text-align: center; line-height: 1.22; }
.back .scan span { display: block; font-weight: 600; color: #5B6172; font-size: 5.4pt; margin-top: .4mm; }
.back .url { margin-top: auto; font-size: 5.4pt; font-weight: 700; color: #594AF7; letter-spacing: .01em; white-space: nowrap; }
"""


def html_for(key: str, p: dict, cara: str) -> str:
    url_short = f'pebaisystems.es/t/{key}'
    fondo = '#0A0912' if cara == 'A' else '#EFEDE7'   # sin franja blanca por redondeos de medio píxel
    if cara == 'A':
        body = f"""<section class="card front">
  <div class="glow"></div><div class="glow2"></div>
  <div class="safe">
    <img class="logo" src="{data_uri(LOGO, 'image/png')}" alt="PEBAI Systems">
    <h1 class="serif">Inteligencia Artificial<br>trabajando <i>dentro</i><br>de tu empresa.</h1>
    <div class="who">
      <img src="{data_uri(p['foto'], 'image/jpeg')}" alt="">
      <div><b>{p['nombre']}</b><span>{p['rol']}</span></div>
    </div>
    <div class="contact">
      <div class="wa"><small>WHATSAPP</small>{WHATSAPP}</div>
      <div class="web">pebaisystems.es</div>
    </div>
  </div>
</section>"""
    else:
        body = f"""<section class="card back">
  <div class="safe">
    <div class="left">
      <div class="kicker">CONSULTORÍA GRATUITA</div>
      <h2 class="serif">¿Cuántas horas pierde tu equipo <i>cada semana?</i></h2>
      <p>Te lo decimos gratis en una videollamada de 25 minutos.</p>
      <div class="chips"><span class="lime">0 €</span><span>25 min</span><span>Solo 5 plazas al mes</span></div>
    </div>
    <div class="right">
      <div class="qr">{qr_svg('https://' + url_short)}</div>
      <div class="scan">Escanea y mira<br>el vídeo<span>Sin compromiso</span></div>
      <div class="url">{url_short}</div>
    </div>
  </div>
</section>"""
    return f"""<!doctype html><html lang="es"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=block" rel="stylesheet">
<style>{CSS % {'font': data_uri(FONT, 'font/woff2')}}</style></head><body style="background:{fondo}">{body}</body></html>"""


def main():
    OUT.mkdir(exist_ok=True)
    previews = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        # Se renderiza a 600 ppp y se reduce a 300 ppp exactos: bordes y letras más nítidos
        page = browser.new_page(viewport={'width': 340, 'height': 220}, device_scale_factor=600 / 96)
        for key, p in PERSONAS.items():
            for cara in ('A', 'B'):
                page.set_content(html_for(key, p, cara), wait_until='networkidle')
                page.evaluate('document.fonts.ready')
                png = page.locator('.card').screenshot()
                rgb = Image.open(io.BytesIO(png)).convert('RGB').resize((PX_W, PX_H), Image.LANCZOS)
                previews.append(rgb)
                cmyk = rgb.convert('CMYK')
                base = OUT / f'{key}-cara-{cara}'
                cmyk.save(base.with_suffix('.jpg'), 'JPEG', quality=97, dpi=(DPI, DPI), subsampling=0)
                cmyk.save(base.with_suffix('.pdf'), 'PDF', resolution=DPI)
        browser.close()
    # Hoja de revisión (RGB): A y B de cada persona, con la línea de corte marcada
    gap = 40
    rows = (len(previews) + 1) // 2
    sheet = Image.new('RGB', (PX_W * 2 + gap * 3, PX_H * rows + gap * (rows + 1)), (42, 42, 46))
    for i, im in enumerate(previews):
        sheet.paste(im, (gap + (i % 2) * (PX_W + gap), gap + (i // 2) * (PX_H + gap)))
    sheet.save(HERE / 'vista-previa.png')
    print('\n'.join(sorted(f.name for f in OUT.iterdir())))


if __name__ == '__main__':
    main()
