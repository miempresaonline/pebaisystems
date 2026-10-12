import asyncio
from playwright.async_api import async_playwright
import os
import json

urls = [
    ('ref_cubria_1', 'https://www.instagram.com/p/DdfI-cQHOX-/?img_index=6'),
    ('ref_cubria_2', 'https://www.instagram.com/p/DdmHm0dHPsD/?img_index=6'),
    ('ref_cubria_3', 'https://www.instagram.com/p/DdH4j-JnJgW/?img_index=4')
]

out_dir = r"c:\programacion\emprendimiento\PAI Systems\carousel-engine\knowledge\visual_vault\ramiro_cubria"
os.makedirs(out_dir, exist_ok=True)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel="msedge", headless=True)
        context = await browser.new_context(
            viewport={'width': 1280, 'height': 900},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        )
        page = await context.new_page()

        for name, url in urls:
            post_folder = os.path.join(out_dir, name)
            os.makedirs(post_folder, exist_ok=True)
            print(f"Loading {url}...")
            try:
                await page.goto(url, wait_until="domcontentloaded", timeout=25000)
                await page.wait_for_timeout(3000)
                title = await page.title()
                print(f"Title: {title}")
                
                # Take screenshot of the view
                screenshot_path = os.path.join(post_folder, "page_screenshot.png")
                await page.screenshot(path=screenshot_path)
                print(f"Saved page screenshot to {screenshot_path}")

                # Extract post caption, text, images
                article = await page.query_selector('article')
                if article:
                    text_content = await article.inner_text()
                    with open(os.path.join(post_folder, "caption_and_text.txt"), "w", encoding="utf-8") as f:
                        f.write(text_content)
                    print(f"Saved text content ({len(text_content)} chars)")

                # Extract all images in article or page
                imgs = await page.query_selector_all('article img, main img')
                print(f"Found {len(imgs)} images")
                img_srcs = []
                for idx, img in enumerate(imgs):
                    src = await img.get_attribute('src')
                    alt = await img.get_attribute('alt')
                    if src:
                        img_srcs.append({'index': idx, 'src': src, 'alt': alt})
                
                with open(os.path.join(post_folder, "images_meta.json"), "w", encoding="utf-8") as f:
                    json.dump(img_srcs, f, indent=2, ensure_ascii=False)

            except Exception as e:
                print(f"Error on {name}: {e}")

        await browser.close()

asyncio.run(main())
