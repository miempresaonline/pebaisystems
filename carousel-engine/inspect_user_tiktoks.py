import asyncio
import json
import os
import urllib.request
from playwright.async_api import async_playwright

tiktok_targets = [
    {
        "id": "ref_1",
        "url": "https://vm.tiktok.com/ZGdCLmVs9/",
        "note": "Me gusta menos la diapositiva 1"
    },
    {
        "id": "ref_2",
        "url": "https://vm.tiktok.com/ZGdCLPNoE/",
        "note": "Idea de contenido CARRUSELES"
    },
    {
        "id": "ref_3",
        "url": "https://vm.tiktok.com/ZGdCLHRda/",
        "note": "Idea de contenido CARRUSELES 2"
    },
    {
        "id": "ref_4",
        "url": "https://vm.tiktok.com/ZGdCLQH4u/",
        "note": "Carrusel que me encanta, sobretodo la portada, que es lo mas importante"
    },
    {
        "id": "ref_5",
        "url": "https://vm.tiktok.com/ZGdCLhWvS/",
        "note": "Carrusel que ha funcionado, con 57k de likes y diseño que me gusta"
    },
    {
        "id": "ref_6",
        "url": "https://vm.tiktok.com/ZGdCLkNB4/",
        "note": "Idea de contenido CARRUSELES 3"
    }
]

output_base = os.path.abspath("carousel-engine/tiktok_inspect/user_vault")
os.makedirs(output_base, exist_ok=True)

async def inspect_all():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            channel="msedge",
            headless=True,
            args=["--disable-blink-features=AutomationControlled"]
        )
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 900}
        )
        page = await context.new_page()

        summary_results = []

        for item in tiktok_targets:
            target_id = item["id"]
            short_url = item["url"]
            note = item["note"]
            item_dir = os.path.join(output_base, target_id)
            os.makedirs(item_dir, exist_ok=True)

            print(f"\n==========================================")
            print(f"Processing {target_id}: {short_url} ({note})")
            print(f"==========================================")

            try:
                # Navigate to the short link, allow redirect
                resp = await page.goto(short_url, wait_until="domcontentloaded", timeout=45000)
                await page.wait_for_timeout(3000)
                final_url = page.url
                print(f"Resolved URL: {final_url}")

                # Reject cookies if banner appears
                try:
                    cookie_btn = page.locator('button:has-text("Rechazar"), button:has-text("Decline"), button:has-text("Reject")').first
                    if await cookie_btn.count() > 0:
                        await cookie_btn.click()
                        await page.wait_for_timeout(500)
                except Exception:
                    pass

                # Extract title, description, rehydration data
                data = await page.evaluate("""() => {
                    const title = document.title;
                    const metaDesc = document.querySelector('meta[name="description"]')?.content || '';
                    const ogDesc = document.querySelector('meta[property="og:description"]')?.content || '';
                    const ogTitle = document.querySelector('meta[property="og:title"]')?.content || '';
                    
                    let rehy = null;
                    const script = document.getElementById('__UNIVERSAL_DATA_FOR_REHYDRATION__');
                    if (script) {
                        try { rehy = JSON.parse(script.textContent); } catch(e){}
                    }

                    return { title, metaDesc, ogDesc, ogTitle, rehy };
                }""")

                # Look for photo slides in rehydration
                rehy = data.get("rehy") or {}
                post_data = {}
                image_urls = []
                author = ""
                stats = {}
                desc = data.get("metaDesc") or data.get("ogDesc") or ""

                default_scope = rehy.get("__DEFAULT_SCOPE__", {})
                item_struct = None
                
                # Search recursively or in known paths
                detail_keys = ["webapp.video-detail", "seo.item-detail", "itemDetail"]
                for k, v in default_scope.items():
                    if isinstance(v, dict) and "itemInfo" in v:
                        item_struct = v["itemInfo"].get("itemStruct")
                        break

                if item_struct:
                    desc = item_struct.get("desc", desc)
                    author = item_struct.get("author", {}).get("uniqueId", "")
                    stats = item_struct.get("stats", {})
                    # Check imagePost
                    image_post = item_struct.get("imagePost", {})
                    images = image_post.get("images", [])
                    for idx, img in enumerate(images):
                        # displayImage has highest resolution
                        display_img = img.get("displayImage", {})
                        urls_list = display_img.get("urlList", [])
                        if urls_list:
                            image_urls.append(urls_list[-1]) # highest res or last CDN
                
                print(f"Author: @{author}")
                print(f"Stats: {stats}")
                print(f"Description: {desc}")
                print(f"Extracted high-res slide images: {len(image_urls)}")

                # Save raw json
                with open(os.path.join(item_dir, "metadata.json"), "w", encoding="utf-8") as f:
                    json.dump({
                        "id": target_id,
                        "short_url": short_url,
                        "final_url": final_url,
                        "note": note,
                        "author": author,
                        "desc": desc,
                        "stats": stats,
                        "image_urls": image_urls
                    }, f, indent=2, ensure_ascii=False)

                # Download slide images if found
                downloaded_slides = []
                for s_idx, img_url in enumerate(image_urls):
                    slide_path = os.path.join(item_dir, f"slide_{s_idx+1}.jpg")
                    try:
                        req = urllib.request.Request(
                            img_url,
                            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
                        )
                        with urllib.request.urlopen(req, timeout=15) as response, open(slide_path, "wb") as out_file:
                            out_file.write(response.read())
                        downloaded_slides.append(slide_path)
                        print(f"  Downloaded slide_{s_idx+1}.jpg ({os.path.getsize(slide_path)} bytes)")
                    except Exception as e:
                        print(f"  Error downloading slide {s_idx+1}: {e}")

                # Take a page screenshot for visual reference
                page_shot = os.path.join(item_dir, "page_view.png")
                await page.screenshot(path=page_shot)
                print(f"Saved page screenshot: {page_shot}")

                summary_results.append({
                    "id": target_id,
                    "url": final_url,
                    "note": note,
                    "author": author,
                    "desc": desc,
                    "stats": stats,
                    "num_slides": len(image_urls),
                    "downloaded": len(downloaded_slides)
                })

            except Exception as ex:
                print(f"Error processing {target_id}: {ex}")

        with open(os.path.join(output_base, "summary.json"), "w", encoding="utf-8") as f:
            json.dump(summary_results, f, indent=2, ensure_ascii=False)

        await browser.close()
        print("\nAll target inspection completed.")

if __name__ == "__main__":
    asyncio.run(inspect_all())
