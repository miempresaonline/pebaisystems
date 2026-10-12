import asyncio
import json
import os
import re
from playwright.async_api import async_playwright

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "tiktok_inspect", "live_crawl")
os.makedirs(OUTPUT_DIR, exist_ok=True)

PROFILES = [
    ("nikamuleror", "https://www.tiktok.com/@nikamuleror"),
    ("stephcarvajalino", "https://www.tiktok.com/@stephcarvajalino"),
    ("thejordisegues", "https://www.tiktok.com/@thejordisegues")
]

async def scrape_profile(page, username, profile_url):
    print(f"\n==========================================")
    print(f"Rastreando perfil: @{username} ({profile_url})")
    print(f"==========================================")
    try:
        await page.goto(profile_url, wait_until="domcontentloaded", timeout=40000)
        await page.wait_for_timeout(3500)
        
        # Click reject cookies if popup appears
        try:
            reject_btn = page.locator('text="Rechazar cookies opcionales"')
            if await reject_btn.count() > 0:
                await reject_btn.click()
                await page.wait_for_timeout(1000)
        except Exception:
            pass
            
        title = await page.title()
        print(f"Titulo pagina: {title}")
        
        # Scroll down slightly to trigger lazy load
        await page.evaluate("window.scrollBy(0, 800)")
        await page.wait_for_timeout(2000)
        
        # Extract photo carousel links
        photo_links = await page.evaluate("""() => {
            const anchors = Array.from(document.querySelectorAll('a[href*="/photo/"]'));
            const unique = [...new Set(anchors.map(a => a.href))];
            return unique;
        }""")
        
        # If no direct /photo/ found, also check video posts that might be photo carousels
        if not photo_links:
            print("Buscando enlaces de publicaciones...")
            all_posts = await page.evaluate("""() => {
                const anchors = Array.from(document.querySelectorAll('a[href*="/video/"], a[href*="/photo/"]'));
                return [...new Set(anchors.map(a => a.href))].slice(0, 6);
            }""")
            print(f"Publicaciones encontradas en @{username}: {len(all_posts)}")
            return all_posts[:3]
            
        print(f"Carruseles de fotos localizados en @{username}: {len(photo_links)}")
        return photo_links[:3]
    except Exception as e:
        print(f"Error al rastrear @{username}: {e}")
        return []

async def inspect_carousel_item(page, item_url, index, username):
    print(f"\n--- Inspeccionando carrusel {index} de @{username}: {item_url} ---")
    try:
        await page.goto(item_url, wait_until="domcontentloaded", timeout=40000)
        await page.wait_for_timeout(3500)
        
        # Close modals or login banners
        await page.evaluate("""() => {
            document.querySelectorAll('[class*="login"], [class*="modal"], [class*="dialog"], [class*="banner"], [id*="cookie"]').forEach(el => el.remove());
        }""")
        
        data = await page.evaluate("""() => {
            const title = document.title || '';
            const desc = document.querySelector('meta[name="description"]')?.content || '';
            
            // Extract post description / caption
            const captionEl = document.querySelector('[data-e2e="browse-video-desc"], [class*="video-desc"], [class*="caption"]');
            const caption = captionEl ? captionEl.innerText : desc;
            
            // Metrics (likes, comments, bookmarks)
            const likeEl = document.querySelector('[data-e2e="like-count"], [data-e2e="browse-like-count"]');
            const commentEl = document.querySelector('[data-e2e="comment-count"], [data-e2e="browse-comment-count"]');
            const bookmarkEl = document.querySelector('[data-e2e="undefined-count"], [data-e2e="bookmark-count"]');
            
            const likes = likeEl ? likeEl.innerText : 'N/A';
            const comments = commentEl ? commentEl.innerText : 'N/A';
            const bookmarks = bookmarkEl ? bookmarkEl.innerText : 'N/A';
            
            // Images in carousel
            const imgs = Array.from(document.querySelectorAll('img[src*="tiktok"], img[src*="byteoversea"]'))
                .filter(img => (img.naturalWidth > 300 || img.width > 300))
                .map(img => img.src);
                
            return {
                title,
                caption,
                likes,
                comments,
                bookmarks,
                images_found: imgs.length,
                image_urls: imgs
            };
        }""")
        
        # Take screenshot of the slide cover
        ss_name = f"{username}_carousel_{index}_cover.png"
        ss_path = os.path.join(OUTPUT_DIR, ss_name)
        await page.screenshot(path=ss_path)
        print(f"Captura guardada en: {ss_path}")
        
        result_file = os.path.join(OUTPUT_DIR, f"{username}_carousel_{index}.json")
        with open(result_file, "w", encoding="utf-8") as f:
            json.dump({
                "url": item_url,
                "author": username,
                "screenshot": ss_path,
                **data
            }, f, indent=2, ensure_ascii=False)
            
        print(f"Datos extraidos con exito:")
        print(f"- Titulo: {data.get('title')}")
        print(f"- Likes: {data.get('likes')} | Comentarios: {data.get('comments')} | Guardados: {data.get('bookmarks')}")
        print(f"- Caption: {data.get('caption')[:120]}...")
        return data
    except Exception as e:
        print(f"Error inspeccionando {item_url}: {e}")
        return None

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            channel="msedge",
            headless=True,
            args=["--disable-blink-features=AutomationControlled"]
        )
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 900}
        )
        await context.add_init_script("Object.defineProperty(navigator, 'webdriver', { get: () => undefined });")
        page = await context.new_page()
        
        all_results = []
        for username, url in PROFILES:
            links = await scrape_profile(page, username, url)
            for idx, link in enumerate(links[:2], 1):
                item_data = await inspect_carousel_item(page, link, idx, username)
                if item_data:
                    all_results.append(item_data)
                    
        await browser.close()
        print(f"\n[FIN] Rastreo completado. Total carruseles inspeccionados: {len(all_results)}")

if __name__ == "__main__":
    asyncio.run(main())
