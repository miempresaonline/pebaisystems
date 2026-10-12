import asyncio
import json
import re
import os
from playwright.async_api import async_playwright

CAROUSEL_URLS = [
    ("stephcarvajalino", "https://www.tiktok.com/@stephcarvajalino/photo/7676944779615177998"),
    ("nikamuleror", "https://www.tiktok.com/@nikamuleror/photo/7674715027613437206"),
    ("learnsucess", "https://www.tiktok.com/@learnsucess/photo/7673185948678622497")
]

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "tiktok_inspect", "extracted_real")
os.makedirs(OUTPUT_DIR, exist_ok=True)

async def inspect():
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel="msedge", headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
            viewport={"width": 430, "height": 932},
            is_mobile=True,
            has_touch=True
        )
        page = await context.new_page()

        for author, url in CAROUSEL_URLS:
            print(f"\n==================================================")
            print(f"Extrayendo carrusel viral de @{author}: {url}")
            print(f"==================================================")
            try:
                await page.goto(url, wait_until="domcontentloaded", timeout=35000)
                await page.wait_for_timeout(3000)
                content = await page.content()

                match = re.search(r'<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>(.*?)</script>', content)
                if not match:
                    print(f"[AVISO] No se encontro rehydration script en {author}")
                    continue

                raw_json = json.loads(match.group(1))
                scope = raw_json.get("__DEFAULT_SCOPE__", {})
                detail = scope.get("webapp.video-detail", {})
                item = detail.get("itemInfo", {}).get("itemStruct", {})

                desc = item.get("desc", "")
                stats = item.get("stats", {})
                author_info = item.get("author", {})
                image_posts = item.get("imagePost", {}).get("images", [])

                image_urls = []
                for img in image_posts:
                    urls = img.get("imageURL", {}).get("urlList", [])
                    if urls:
                        image_urls.append(urls[0])

                parsed = {
                    "author": author,
                    "url": url,
                    "description": desc,
                    "likes": stats.get("diggCount"),
                    "shares": stats.get("shareCount"),
                    "comments": stats.get("commentCount"),
                    "saves": stats.get("collectCount"),
                    "total_slides": len(image_urls),
                    "image_urls": image_urls
                }

                out_json = os.path.join(OUTPUT_DIR, f"{author}_data.json")
                with open(out_json, "w", encoding="utf-8") as f:
                    json.dump(parsed, f, indent=2, ensure_ascii=False)

                print(f"[OK] Datos extraidos:")
                print(f"- Descripcion: {desc[:100]}...")
                print(f"- Likes: {parsed['likes']} | Guardados: {parsed['saves']} | Comentarios: {parsed['comments']}")
                print(f"- Diapositivas encontradas: {parsed['total_slides']}")

                # Download first slide (Hook/Cover)
                if image_urls:
                    cover_url = image_urls[0]
                    cover_path = os.path.join(OUTPUT_DIR, f"{author}_slide_1.jpg")
                    try:
                        import urllib.request
                        req = urllib.request.Request(cover_url, headers={"User-Agent": "Mozilla/5.0"})
                        with urllib.request.urlopen(req, timeout=15) as res:
                            with open(cover_path, "wb") as img_f:
                                img_f.write(res.read())
                        print(f"- Portada guardada en: {cover_path}")
                    except Exception as img_err:
                        print(f"- Error descargando portada: {img_err}")

            except Exception as e:
                print(f"Error procesando {author}: {e}")

        await browser.close()
        print(f"\n[FIN] Inspeccion completada con exito.")

if __name__ == "__main__":
    asyncio.run(inspect())
