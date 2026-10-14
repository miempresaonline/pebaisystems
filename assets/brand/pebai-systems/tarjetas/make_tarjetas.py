"""Tarjetas de visita de PEBAI para puerta fría (una por persona, cada una con su QR medible).

Formato imprenta: 85 x 55 mm + 3 mm de sangrado por lado = 91 x 61 mm. Zona segura: 4 mm dentro del corte.
El QR lleva a pebaisystems.es/t/<persona>, que redirige al vídeo del embudo con
utm_source=tarjeta&utm_medium=puerta_fria&utm_content=<persona> (regla en website-pebai/dist/.htaccess).

Uso:   python assets/brand/pebai-systems/tarjetas/make_tarjetas.py
Salida (en esta carpeta):
  tarjeta-<persona>.pdf          2 páginas (anverso, reverso) para la imprenta
  tarjeta-<persona>-anverso.png  y -reverso.png a 300 ppp (por si la imprenta pide imagen)
  vista-previa.png               las tarjetas juntas para revisarlas
"""
import base64
from pathlib import Path

import segno
from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
LOGO = ROOT / 'assets/brand/pebai-systems/logo-kit-v2/pebai-horizontal-color-mineral-2320.png'
FONT = ROOT / 'assets/brand/pebai-systems/logo-kit-v2/fonts/Manrope-latin-variable.woff2'
TEAM = ROOT / 'website-pebai/dist/team'

PERSONAS = {
    'adrian': {'nombre': 'Adrián Ballesteros', 'rol': 'Dirección de proyectos', 'foto': TEAM / 'avatar-adrian.jpg'},
    'dani': {'nombre': 'Daniel Peñuela', 'rol': 'Ingeniería de procesos', 'foto': TEAM / 'avatar-dani.jpg'},
}
WHATSAPP = '624 84 27 99'


def data_uri(path: Path, mime: str) -> str:
    return f'data:{mime};base64,' + base64.b64encode(path.read_bytes()).decode()


def qr_svg(url: str) -> str:
    qr = segno.make(url, error='q')
    return qr.svg_inline(scale=10, border=0, dark='#0A0912', light=None, omitsize=True)


CSS = """
@font-face { font-family: Manrope; src: url('%(font)s') format('woff2'); font-weight: 200 800; }
@page { size: 91mm 61mm; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 91mm; }
body { font-family: Manrope, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.card { width: 91mm; height: 61mm; position: relative; overflow: hidden; page-break-after: always; }
.safe { position: absolute; inset: 7mm; }            /* 3 mm sangrado + 4 mm zona segura */
.serif { font-family: 'Instrument Serif', serif; font-weight: 400; }

/* ---------- Anverso: oscuro ---------- */
.front { background: #0A0912; color: #EFEDE7; }
.front .glow { position: absolute; width: 70mm; height: 70mm; right: -26mm; top: -30mm; border-radius: 50%%;
  background: radial-gradient(closest-side, rgba(89,74,247,.55), rgba(89,74,247,0)); }
.front .glow2 { position: absolute; width: 46mm; height: 46mm; left: -20mm; bottom: -26mm; border-radius: 50%%;
  background: radial-gradient(closest-side, rgba(183,255,60,.18), rgba(183,255,60,0)); }
.front .logo { height: 5.6mm; display: block; }
.front h1 { position: absolute; left: 0; right: 0; top: 10.5mm; font-size: 17.5pt; line-height: 1.02; letter-spacing: -.01em; }
.front h1 i { color: #B7FF3C; }
.front .who { position: absolute; left: 0; bottom: 0; display: flex; align-items: center; gap: 2.6mm; }
.front .who img { width: 9mm; height: 9mm; border-radius: 50%%; object-fit: cover; border: .35mm solid #B7FF3C; }
.front .who b { display: block; font-size: 7.6pt; font-weight: 700; }
.front .who span { display: block; font-size: 6.2pt; color: #A3A8BC; margin-top: .4mm; }
.front .contact { position: absolute; right: 0; bottom: 0; text-align: right; }
.front .contact .wa { font-size: 8.4pt; font-weight: 700; letter-spacing: .01em; }
.front .contact .wa small { display: block; font-size: 5.6pt; font-weight: 600; letter-spacing: .14em; color: #B7FF3C; margin-bottom: .5mm; }
.front .contact .web { font-size: 6.4pt; color: #A3A8BC; margin-top: .6mm; }

/* ---------- Reverso: claro, todo apunta al QR ---------- */
.back { background: #EFEDE7; color: #0A0912; }
.back .left { position: absolute; left: 0; top: 0; bottom: 0; width: 44mm; display: flex; flex-direction: column; }
.back .kicker { font-size: 5.6pt; font-weight: 800; letter-spacing: .16em; color: #594AF7; }
.back h2 { margin-top: 1.6mm; font-size: 14.5pt; line-height: 1.02; letter-spacing: -.01em; }
.back h2 i { color: #594AF7; }
.back p { margin-top: 2mm; font-size: 6.6pt; line-height: 1.4; color: #3B3F4C; }
.back .chips { margin-top: auto; display: flex; gap: 1.2mm; flex-wrap: wrap; }
.back .chips span { font-size: 5.8pt; font-weight: 700; padding: .9mm 1.8mm; border-radius: 10mm; background: #0A0912; color: #EFEDE7; }
.back .chips span.lime { background: #B7FF3C; color: #0A0912; }
.back .right { position: absolute; right: 0; top: 0; bottom: 0; width: 26mm; display: flex; flex-direction: column; align-items: center; }
.back .qr { width: 26mm; height: 26mm; padding: 2mm; background: #FFFFFF; border-radius: 3mm; }
.back .qr svg { width: 100%%; height: 100%%; display: block; }
.back .scan { margin-top: 2mm; font-size: 6.4pt; font-weight: 800; text-align: center; line-height: 1.25; }
.back .scan span { display: block; font-weight: 600; color: #5B6172; font-size: 5.6pt; margin-top: .6mm; }
.back .url { margin-top: auto; font-size: 5.6pt; font-weight: 700; color: #594AF7; letter-spacing: .01em; }
"""


def html_for(key: str, p: dict) -> str:
    url_short = f'pebaisystems.es/t/{key}'
    return f"""<!doctype html><html lang="es"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=block" rel="stylesheet">
<style>{CSS % {'font': data_uri(FONT, 'font/woff2')}}</style></head><body>

<section class="card front">
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
</section>

<section class="card back">
  <div class="safe">
    <div class="left">
      <div class="kicker">CONSULTORÍA GRATUITA</div>
      <h2 class="serif">¿Cuántas horas pierde tu equipo <i>cada semana?</i></h2>
      <p>Te lo decimos en una videollamada de 25 minutos, con un mapa de lo que se puede automatizar.</p>
      <div class="chips"><span class="lime">0 €</span><span>25 min</span><span>5 plazas al mes</span></div>
    </div>
    <div class="right">
      <div class="qr">{qr_svg('https://' + url_short)}</div>
      <div class="scan">Escanea y mira<br>el vídeo<span>Sin compromiso</span></div>
      <div class="url">{url_short}</div>
    </div>
  </div>
</section>
</body></html>"""


def main():
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        shots = []
        for key, p in PERSONAS.items():
            page = browser.new_page()
            page.set_content(html_for(key, p), wait_until='networkidle')
            page.evaluate('document.fonts.ready')
            page.pdf(path=str(HERE / f'tarjeta-{key}.pdf'), width='91mm', height='61mm', print_background=True,
                     margin={'top': '0', 'right': '0', 'bottom': '0', 'left': '0'})
            page.close()
            # PNG a 300 ppp: 91 mm = 1075 px  ->  escala 300/96
            page = browser.new_page(viewport={'width': 344, 'height': 231}, device_scale_factor=300 / 96)
            page.set_content(html_for(key, p), wait_until='networkidle')
            page.evaluate('document.fonts.ready')
            for i, cara in enumerate(['anverso', 'reverso']):
                # Cada cara sola en pantalla para que no asome la otra por redondeos de medio píxel
                page.evaluate(f"document.querySelectorAll('.card').forEach((c, j) => c.style.display = j === {i} ? '' : 'none')")
                out = HERE / f'tarjeta-{key}-{cara}.png'
                page.locator('.card').nth(i).screenshot(path=str(out))
                shots.append(out)
            page.close()
        # Hoja de revisión con todas las caras
        imgs = ''.join(f'<img src="{data_uri(s, "image/png")}">' for s in shots)
        page = browser.new_page(viewport={'width': 1400, 'height': 900})
        page.set_content('<body style="margin:0;padding:30px;background:#2a2a2e;display:grid;grid-template-columns:1fr 1fr;gap:28px">'
                         '<style>img{width:100%;border-radius:10px;box-shadow:0 14px 40px rgba(0,0,0,.45)}</style>' + imgs + '</body>')
        page.screenshot(path=str(HERE / 'vista-previa.png'), full_page=True)
        browser.close()
    print('\n'.join(sorted(f.name for f in HERE.iterdir() if f.suffix in ('.pdf', '.png'))))


if __name__ == '__main__':
    main()
