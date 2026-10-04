import asyncio
import json
import os
import re
from playwright.async_api import async_playwright

urls = [
    ("carrusel_1", "https://www.tiktok.com/@stephcarvajalino/photo/7676944779615177998"),
    ("carrusel_2", "https://www.tiktok.com/@learnsucess/photo/7673185948678622497"),
    ("carrusel_3", "https://www.tiktok.com/@nikamuleror/photo/7674715027613437206")
]

os.makedirs("tiktok_inspect", exist_ok=True)

async def scrape():
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel="msedge", headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 900}
        )
        page = await context.new_page()

        for name, url in urls:
            print(f"=== Processing {name}: {url} ===")
            try:
                await page.goto(url, wait_until="domcontentloaded", timeout=40000)
                await page.wait_for_timeout(4000)

                ss_path = f"tiktok_inspect/{name}_page.png"
                await page.screenshot(path=ss_path)
                print(f"Screenshot saved to {ss_path}")

                title = await page.title()
                content = await page.content()

                with open(f"tiktok_inspect/{name}.html", "w", encoding="utf-8") as f:
                    f.write(content)

                # Search for JSON data blobs
                rehy_match = re.search(r'<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>(.*?)</script>', content)
                if rehy_match:
                    with open(f"tiktok_inspect/{name}_rehydration.json", "w", encoding="utf-8") as f:
                        f.write(rehy_match.group(1))
                    print(f"Saved rehydration data for {name}")

                sigi_match = re.search(r'<script id="sigi-persisted-data"[^>]*>(.*?)</script>', content)
                if sigi_match:
                    with open(f"tiktok_inspect/{name}_sigi.json", "w", encoding="utf-8") as f:
                        f.write(sigi_match.group(1))
                    print(f"Saved sigi data for {name}")

                print(f"Title: {title}")
            except Exception as e:
                print(f"Error processing {name}: {e}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(scrape())
