import asyncio
import json
import os
from playwright.async_api import async_playwright

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "tiktok_inspect", "fresh_crawl")
os.makedirs(OUTPUT_DIR, exist_ok=True)

PROFILES = [
    ("thejordisegues", "https://www.tiktok.com/@thejordisegues"),
    ("matejimenez_", "https://www.tiktok.com/@matejimenez_"),
    ("nikamuleror", "https://www.tiktok.com/@nikamuleror"),
]

async def scrape_profile(page, username, url):
    print(f"\n--- Probando perfil: @{username} ({url}) ---")
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=35000)
        await page.wait_for_timeout(3500)
        
        # Remove popups
        await page.evaluate("""() => {
            document.querySelectorAll('[class*="cookie"], [class*="modal"], [class*="bottom-banner"], [class*="dialog"], [class*="login"], [id*="cookie"]').forEach(e => e.remove());
        }""")
        
        title = await page.title()
        print(f"Title: {title}")
        
        # Take full mobile screenshot of profile
        ss_path = os.path.join(OUTPUT_DIR, f"{username}_profile.png")
        await page.screenshot(path=ss_path)
        print(f"Screenshot guardado: {ss_path}")
        
        # Find video/photo links
        post_links = await page.evaluate("""() => {
            const anchors = Array.from(document.querySelectorAll('a[href*="/photo/"], a[href*="/video/"]'));
            return [...new Set(anchors.map(a => a.href))];
        }""")
        print(f"Enlaces encontrados en @{username}: {len(post_links)}")
        for l in post_links[:4]:
            print(f" - {l}")
            
        return post_links[:3]
    except Exception as e:
        print(f"Error scraping @{username}: {e}")
        return []

async def inspect_post(page, url, username, idx):
    print(f"\nInspeccionando post {idx} de @{username}: {url}")
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=35000)
        await page.wait_for_timeout(3000)
        await page.evaluate("""() => {
            document.querySelectorAll('[class*="cookie"], [class*="modal"], [class*="bottom-banner"], [class*="dialog"], [class*="login"], [id*="cookie"]').forEach(e => e.remove());
        }""")
        
        data = await page.evaluate("""() => {
            const title = document.title;
            const metaDesc = document.querySelector('meta[name="description"]')?.content || '';
            const caption = document.querySelector('[data-e2e="browse-video-desc"], [class*="video-desc"], [class*="caption"]')?.innerText || metaDesc;
            const likes = document.querySelector('[data-e2e="like-count"], [data-e2e="browse-like-count"]')?.innerText || 'N/A';
            const comments = document.querySelector('[data-e2e="comment-count"], [data-e2e="browse-comment-count"]')?.innerText || 'N/A';
            const bookmarks = document.querySelector('[data-e2e="undefined-count"], [data-e2e="bookmark-count"]')?.innerText || 'N/A';
            const imgs = Array.from(document.querySelectorAll('img')).map(i => i.src).filter(s => s.includes('photomode') || s.includes('tos-'));
            return { title, caption, likes, comments, bookmarks, imgs_count: imgs.length, imgs: imgs.slice(0, 5) };
        }""")
        
        ss_path = os.path.join(OUTPUT_DIR, f"{username}_post_{idx}.png")
        await page.screenshot(path=ss_path)
        data["screenshot"] = ss_path
        data["url"] = url
        
        json_path = os.path.join(OUTPUT_DIR, f"{username}_post_{idx}.json")
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            
        print(f"Post inspeccionado: {data.get('caption')[:100]} | Likes: {data.get('likes')}")
        return data
    except Exception as e:
        print(f"Error inspeccionando {url}: {e}")
        return None

async def main():
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
        await context.add_init_script("Object.defineProperty(navigator, 'webdriver', { get: () => undefined });")
        page = await context.new_page()
        
        for username, url in PROFILES:
            links = await scrape_profile(page, username, url)
            for idx, l in enumerate(links[:2], 1):
                await inspect_post(page, l, username, idx)
                
        await browser.close()
        print("\n[OK] Rastreo finalizado.")

if __name__ == "__main__":
    asyncio.run(main())
