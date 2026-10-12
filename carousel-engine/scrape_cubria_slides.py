import asyncio
from playwright.async_api import async_playwright
import os
import urllib.request

urls = [
    ('ref_cubria_1', 'https://www.instagram.com/p/DdfI-cQHOX-/'),
    ('ref_cubria_2', 'https://www.instagram.com/p/DdmHm0dHPsD/'),
    ('ref_cubria_3', 'https://www.instagram.com/p/DdH4j-JnJgW/')
]

base_dir = r"c:\programacion\emprendimiento\PAI Systems\carousel-engine\knowledge\visual_vault\ramiro_cubria"

async def scrape_post(page, name, url):
    post_dir = os.path.join(base_dir, name)
    os.makedirs(post_dir, exist_ok=True)
    print(f"\n--- Scraping {name}: {url} ---")
    
    await page.goto(url, wait_until="networkidle", timeout=30000)
    await page.wait_for_timeout(2000)

    # Handle cookie dialog
    try:
        cookie_btn = page.locator('button:has-text("Permitir todas las cookies"), button:has-text("Allow all cookies"), button:has-text("Rechazar"), button:has-text("Decline")').first
        if await cookie_btn.is_visible(timeout=3000):
            print("Clicking cookie button...")
            await cookie_btn.click()
            await page.wait_for_timeout(2000)
    except Exception as e:
        print("No cookie button or error:", e)

    # Close any login popup if it appears
    try:
        close_btn = page.locator('svg[aria-label="Cerrar"], svg[aria-label="Close"]').first
        if await close_btn.is_visible(timeout=2000):
            await close_btn.click()
            await page.wait_for_timeout(1000)
    except Exception:
        pass

    # Extract caption
    try:
        caption_el = page.locator('h1, article span, article div[role="button"]')
        texts = await caption_el.all_inner_texts()
        full_text = "\n".join(texts)
        with open(os.path.join(post_dir, "caption.txt"), "w", encoding="utf-8") as f:
            f.write(full_text)
        print("Extracted caption.")
    except Exception as e:
        print("Caption error:", e)

    # Now navigate through the carousel slides and capture each slide!
    slide_idx = 1
    seen_srcs = set()
    
    # We can screenshot the main article media container
    media_container = page.locator('article div[role="presentation"], article div._aatk, article div._aagv, article ul').first
    if not await media_container.is_visible():
        media_container = page.locator('article').first

    while slide_idx <= 10:
        await page.wait_for_timeout(1500)
        
        # Take screenshot of the slide container or active slide
        slide_shot_path = os.path.join(post_dir, f"slide_{slide_idx}.png")
        try:
            # Locate active image in carousel
            active_img = page.locator('article ul li[style*="transform: translateX(0px)"] img, article ul li img').first
            # Screenshot the whole carousel frame
            carousel_frame = page.locator('article div[style*="aspect-ratio"], article div[tabindex="0"], article div._aato, article div._aagu').first
            if await carousel_frame.is_visible():
                await carousel_frame.screenshot(path=slide_shot_path)
            else:
                await page.screenshot(path=slide_shot_path)
            print(f"Captured slide {slide_idx} to {slide_shot_path}")
        except Exception as e:
            print(f"Screenshot error slide {slide_idx}: {e}")

        # Find next button
        next_btn = page.locator('button[aria-label="Siguiente"], button[aria-label="Next"], button:has(svg[aria-label="Siguiente"]), button:has(svg[aria-label="Next"])').first
        if await next_btn.is_visible():
            await next_btn.click()
            slide_idx += 1
        else:
            print(f"No next button found. Reached end at slide {slide_idx}.")
            break

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel="msedge", headless=True)
        context = await browser.new_context(
            viewport={'width': 1280, 'height': 1000},
            locale="es-ES",
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        for name, url in urls:
            try:
                await scrape_post(page, name, url)
            except Exception as e:
                print(f"Failed scraping {name}: {e}")

        await browser.close()

asyncio.run(main())
