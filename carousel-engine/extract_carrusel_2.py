import asyncio
import json
from playwright.async_api import async_playwright

js_code = """
() => {
    document.querySelectorAll('[class*="cookie"], [class*="modal"], [class*="bottom-banner"], [class*="dialog"], [class*="login"], [id*="cookie"]').forEach(e => e.remove());
    const title = document.title;
    const metaDesc = document.querySelector('meta[name="description"]')?.content || '';
    const imgs = Array.from(document.querySelectorAll('img')).map(i => ({
        src: i.src,
        alt: i.alt,
        width: i.naturalWidth || i.width,
        height: i.naturalHeight || i.height
    }));
    return { title, metaDesc, imgs };
}
"""

async def extract2():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            channel='msedge',
            headless=True,
            args=['--disable-blink-features=AutomationControlled']
        )
        context = await browser.new_context(
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
            viewport={'width': 430, 'height': 932},
            is_mobile=True, has_touch=True
        )
        await context.add_init_script('Object.defineProperty(navigator, "webdriver", { get: () => undefined });')
        page = await context.new_page()
        url = 'https://www.tiktok.com/@learnsucess/photo/7673185948678622497'
        await page.goto(url, wait_until='domcontentloaded', timeout=40000)
        await page.wait_for_timeout(4000)
        try:
            reject_btn = page.locator('text="Rechazar cookies opcionales"')
            if await reject_btn.count() > 0:
                await reject_btn.click()
                await page.wait_for_timeout(1000)
        except Exception:
            pass

        data = await page.evaluate(js_code)
        with open('tiktok_inspect/carrusel_2_data.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        await page.screenshot(path='tiktok_inspect/carrusel_2_clean.png')
        for idx in range(2, 6):
            await page.touchscreen.tap(350, 450)
            await page.mouse.move(350, 450)
            await page.mouse.down()
            await page.mouse.move(50, 450, steps=10)
            await page.mouse.up()
            await page.wait_for_timeout(1000)
            await page.screenshot(path=f'tiktok_inspect/carrusel_2_slide_{idx}.png')
        await browser.close()
        print('Carrusel 2 successfully extracted!')

if __name__ == '__main__':
    asyncio.run(extract2())
