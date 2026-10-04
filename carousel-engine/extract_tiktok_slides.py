import asyncio
import json
import os
from playwright.async_api import async_playwright

urls = [
    ("carrusel_1", "https://www.tiktok.com/@stephcarvajalino/photo/7676944779615177998"),
    ("carrusel_2", "https://www.tiktok.com/@learnsucess/photo/7673185948678622497"),
    ("carrusel_3", "https://www.tiktok.com/@nikamuleror/photo/7674715027613437206")
]

os.makedirs("tiktok_inspect", exist_ok=True)

js_code = """
() => {
    // Remove banners and overlays
    document.querySelectorAll('[class*="cookie"], [class*="modal"], [class*="bottom-banner"], [class*="dialog"], [class*="login"], [id*="cookie"]').forEach(e => e.remove());
    
    const title = document.title;
    const metaDesc = document.querySelector('meta[name="description"]')?.content || '';
    
    // Find all images
    const imgs = Array.from(document.querySelectorAll('img')).map(i => ({
        src: i.src,
        alt: i.alt,
        width: i.naturalWidth || i.width,
        height: i.naturalHeight || i.height
    }));
    
    let rehy = null;
    const script = document.getElementById('__UNIVERSAL_DATA_FOR_REHYDRATION__');
    if (script) {
        try { rehy = JSON.parse(script.textContent); } catch(e){}
    }
    
    const bodyText = document.body.innerText;
    return { title, metaDesc, imgs, rehy, bodyText };
}
"""

async def extract_all():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            channel="msedge",
            headless=True,
            args=["--disable-blink-features=AutomationControlled"]
        )
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
            viewport={"width": 430, "height": 932},
            is_mobile=True,
            has_touch=True
        )
        await context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        """)
        page = await context.new_page()

        for name, url in urls:
            print(f"=== Extracting {name}: {url} ===")
            try:
                await page.goto(url, wait_until="domcontentloaded", timeout=40000)
                await page.wait_for_timeout(4000)
                
                # Click any reject cookies button if visible
                try:
                    reject_btn = page.locator('text="Rechazar cookies opcionales"')
                    if await reject_btn.count() > 0:
                        await reject_btn.click()
                        await page.wait_for_timeout(1000)
                except Exception:
                    pass

                # Try clicking close modal if exists
                try:
                    close_btn = page.locator('button:has-text("X"), svg[class*="close"]').first
                    if await close_btn.count() > 0:
                        await close_btn.click()
                        await page.wait_for_timeout(500)
                except Exception:
                    pass

                data = await page.evaluate(js_code)

                with open(f"tiktok_inspect/{name}_data.json", "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)

                print("Title:", data.get("title"))
                print("Meta Desc:", data.get("metaDesc")[:150])
                print("Found images:", len(data.get("imgs", [])))

                await page.screenshot(path=f"tiktok_inspect/{name}_clean.png")
                print(f"Saved clean screenshot to tiktok_inspect/{name}_clean.png")
                
                # If there are next slide buttons or swiper, swipe to capture next slides!
                for slide_idx in range(2, 6):
                    # Swipe left: touch start at x=350, move to x=50
                    await page.touchscreen.tap(350, 450)
                    await page.mouse.move(350, 450)
                    await page.mouse.down()
                    await page.mouse.move(50, 450, steps=10)
                    await page.mouse.up()
                    await page.wait_for_timeout(1000)
                    await page.screenshot(path=f"tiktok_inspect/{name}_slide_{slide_idx}.png")
                    print(f"Captured {name} slide {slide_idx}")
            except Exception as e:
                print(f"Error extracting {name}: {e}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(extract_all())
