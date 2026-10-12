import os
import sys
import asyncio
import base64
import shutil
from jinja2 import Environment, FileSystemLoader
from playwright.async_api import async_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")
ASSETS_DIR = os.path.join(BASE_DIR, "assets")
OUTPUT_DIR = os.path.join(BASE_DIR, "output", "carrusel_mit_fracaso")
LOGOS_DIR = os.path.join(ASSETS_DIR, "logos")
ARTIFACTS_DIR = r"C:\Users\Mi Empresa Online\.gemini\antigravity\brain\204900c9-2f8f-48bf-8e0c-07bdea38bc82"

os.makedirs(OUTPUT_DIR, exist_ok=True)

# Logos & Icons
def load_assets(folder):
    assets = {}
    if os.path.exists(folder):
        for fname in os.listdir(folder):
            key = os.path.splitext(fname)[0]
            fpath = os.path.join(folder, fname)
            if os.path.isfile(fpath):
                with open(fpath, "rb") as f:
                    b64 = base64.b64encode(f.read()).decode("utf-8")
                mime = "image/png" if fname.endswith(".png") else "image/svg+xml"
                assets[key] = f"data:{mime};base64,{b64}"
    return assets

ALL_LOGOS = load_assets(LOGOS_DIR)
ALL_ICONS = load_assets(os.path.join(ASSETS_DIR, "icons"))

# PEBAI Logo & Mark in base64
def file_to_b64(fpath, mime="image/png"):
    if os.path.exists(fpath):
        with open(fpath, "rb") as f:
            return f"data:{mime};base64,{base64.b64encode(f.read()).decode('utf-8')}"
    return ""

PEBAI_LOGO_HORIZONTAL = file_to_b64(os.path.join(ASSETS_DIR, "pebai", "pebai-horizontal-color-ink-1160.png"))
PEBAI_MARK = file_to_b64(os.path.join(ASSETS_DIR, "pebai", "pebai-mark-color-512.png"))
HUMAN_AVATAR = file_to_b64(os.path.join(ASSETS_DIR, "stock", "stock_man_macbook.jpg"), mime="image/jpeg")

jinja_env = Environment(loader=FileSystemLoader(TEMPLATES_DIR, encoding='utf-8'), autoescape=False)
template = jinja_env.get_template("carrusel_cubria_clean.html.jinja")

async def render_all():
    print("=== RENDERIZANDO CARRUSEL MIT FRACASO IA (ESTÁNDAR RAMIRO CUBRIA + PEBAI) ===")
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel="msedge", headless=True)
        # 1080x1350 (4:5 Instagram ratio) with device_scale_factor=2 -> 2160x2700 px Retina
        context = await browser.new_context(
            viewport={'width': 1080, 'height': 1350},
            device_scale_factor=2
        )
        page = await context.new_page()

        for slide_num in range(1, 6):
            rendered_html = template.render(
                title="El 94% de las Empresas Que Meten IA Fracasan",
                slide_num=slide_num,
                total_slides=5,
                pebai_logo=PEBAI_LOGO_HORIZONTAL,
                pebai_mark=PEBAI_MARK,
                human_avatar=HUMAN_AVATAR,
                logos=ALL_LOGOS,
                icons=ALL_ICONS
            )

            html_tmp_path = os.path.join(OUTPUT_DIR, f"temp_slide_{slide_num}.html")
            with open(html_tmp_path, "w", encoding="utf-8") as f:
                f.write(rendered_html)

            await page.goto(f"file:///{html_tmp_path.replace(os.sep, '/')}", wait_until="networkidle")
            await page.wait_for_timeout(1000)

            out_png = os.path.join(OUTPUT_DIR, f"slide_{slide_num}.png")
            await page.screenshot(path=out_png)
            print(f"[OK] Slide {slide_num} renderizada en {out_png}")

            # Copy to artifact folder
            artifact_png = os.path.join(ARTIFACTS_DIR, f"carrusel_mit_slide_{slide_num}.png")
            shutil.copyfile(out_png, artifact_png)
            print(f"[OK] Copiada a artefacto: {artifact_png}")

            try:
                os.remove(html_tmp_path)
            except Exception:
                pass

        await browser.close()
        print("=== PROCESO COMPLETADO CON ÉXITO ===")

if __name__ == "__main__":
    asyncio.run(render_all())
