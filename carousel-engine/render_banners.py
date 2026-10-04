import asyncio
import os
import sys
from playwright.async_api import async_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, "output", "banners")
os.makedirs(OUTPUT_DIR, exist_ok=True)

YOUTUBE_TASKS = [
    (
        os.path.join(BASE_DIR, "templates", "banners", "yt_v1_electric_wave.html"),
        os.path.join(OUTPUT_DIR, "yt_banner_v1_electric_wave.png")
    ),
    (
        os.path.join(BASE_DIR, "templates", "banners", "yt_v2_mineral_light.html"),
        os.path.join(OUTPUT_DIR, "yt_banner_v2_mineral_light.png")
    ),
    (
        os.path.join(BASE_DIR, "templates", "banners", "yt_v3_editorial_serif.html"),
        os.path.join(OUTPUT_DIR, "yt_banner_v3_editorial_serif.png")
    )
]

X_TASKS = [
    (
        os.path.join(BASE_DIR, "templates", "banners", "x_v1_electric_wave.html"),
        os.path.join(OUTPUT_DIR, "x_banner_v1_electric_wave.png")
    ),
    (
        os.path.join(BASE_DIR, "templates", "banners", "x_v2_mineral_light.html"),
        os.path.join(OUTPUT_DIR, "x_banner_v2_mineral_light.png")
    ),
    (
        os.path.join(BASE_DIR, "templates", "banners", "x_v3_editorial_serif.html"),
        os.path.join(OUTPUT_DIR, "x_banner_v3_editorial_serif.png")
    )
]

async def render_group(tasks, width, height, scale_factor, platform_name):
    print(f"\n[Banners] Renderizando banners para {platform_name} ({width}x{height} - escala {scale_factor}x)...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel='msedge', headless=True)
        page = await browser.new_page(
            viewport={'width': width, 'height': height},
            device_scale_factor=scale_factor
        )

        for html_file, out_file in tasks:
            print(f" -> Procesando: {os.path.basename(out_file)}")
            await page.goto(f"file:///{os.path.abspath(html_file)}")
            await page.wait_for_load_state('networkidle')
            await page.wait_for_timeout(1500)
            await page.screenshot(path=out_file)
            print(f"    Exportado: {out_file}")

        await browser.close()

async def main():
    print("==================================================")
    print("   GENERADOR MINIMALISTA DE BANNERS PEBAI         ")
    print("==================================================")

    # 1. Render YouTube Banners (2560 x 1440)
    await render_group(YOUTUBE_TASKS, width=2560, height=1440, scale_factor=1, platform_name="YouTube")

    # 2. Render X (Twitter) Banners (1500 x 500)
    await render_group(X_TASKS, width=1500, height=500, scale_factor=2, platform_name="X / Twitter")

    print("\n[Banners] ¡Todos los banners han sido renderizados con éxito!")

if __name__ == "__main__":
    asyncio.run(main())
