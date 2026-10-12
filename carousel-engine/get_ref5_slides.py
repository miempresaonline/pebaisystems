import asyncio
import os
from playwright.async_api import async_playwright

async def get_ref5_slides():
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel="msedge", headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 900})
        page = await context.new_page()
        
        await page.goto("https://www.tiktok.com/@zoout/photo/7670915815952157972", wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)
        
        # Dismiss modals
        await page.evaluate("""() => {
            document.querySelectorAll('[class*="cookie"], [class*="modal"], [class*="dialog"], [id*="cookie"]').forEach(e => e.remove());
        }""")
        
        out_dir = "carousel-engine/tiktok_inspect/user_vault/ref_5_slides"
        os.makedirs(out_dir, exist_ok=True)
        
        # Take cover
        await page.screenshot(path=f"{out_dir}/slide_1.png")
        
        # Find next button
        for i in range(2, 9):
            try:
                # Press right arrow key
                await page.keyboard.press("ArrowRight")
                await page.wait_for_timeout(1000)
                await page.screenshot(path=f"{out_dir}/slide_{i}.png")
                print(f"Captured ref 5 slide {i}")
            except Exception as e:
                print(f"Error {i}: {e}")
                
        await browser.close()

if __name__ == "__main__":
    asyncio.run(get_ref5_slides())
