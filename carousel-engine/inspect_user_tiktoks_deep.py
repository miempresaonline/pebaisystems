import asyncio
import json
import os
import sys
import urllib.request
from playwright.async_api import async_playwright

# Set utf-8 stdout
sys.stdout.reconfigure(encoding='utf-8')

targets = [
    {
        "id": "ref_1",
        "url": "https://www.tiktok.com/@stephcarvajalino/photo/7692875676344438030",
        "type": "photo",
        "note": "Me gusta menos la diapositiva 1"
    },
    {
        "id": "ref_2",
        "url": "https://www.tiktok.com/@matejimenez_/video/7684423865854004502",
        "type": "video",
        "note": "Idea de contenido CARRUSELES"
    },
    {
        "id": "ref_3",
        "url": "https://www.tiktok.com/@matejimenez_/video/7679605271362047254",
        "type": "video",
        "note": "Idea de contenido CARRUSELES 2"
    },
    {
        "id": "ref_4",
        "url": "https://www.tiktok.com/@danielbrown.ia/photo/7671026375507102997",
        "type": "photo",
        "note": "Carrusel que me encanta, sobretodo la portada, que es lo mas importante"
    },
    {
        "id": "ref_5",
        "url": "https://www.tiktok.com/@zoout/photo/7670915815952157972",
        "type": "photo",
        "note": "Carrusel que ha funcionado, con 57k de likes y diseño que me gusta"
    },
    {
        "id": "ref_6",
        "url": "https://www.tiktok.com/@matejimenez_/video/7682573444323577110",
        "type": "video",
        "note": "Idea de contenido CARRUSELES 3"
    }
]

output_base = os.path.abspath("carousel-engine/tiktok_inspect/user_vault")

async def extract_deep():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            channel="msedge",
            headless=True,
            args=["--disable-blink-features=AutomationControlled"]
        )
        
        # We will use mobile context for photo carousels to swipe through slides easily,
        # and desktop context for video inspection
        for item in targets:
            target_id = item["id"]
            url = item["url"]
            t_type = item["type"]
            note = item["note"]
            item_dir = os.path.join(output_base, target_id)
            os.makedirs(item_dir, exist_ok=True)

            print(f"\n========================================================")
            print(f"DEEP SCRAPING {target_id} ({t_type}): {url}")
            print(f"Note: {note}")
            print(f"========================================================")

            if t_type == "photo":
                # Use mobile emulation to interact with photo swiper
                context = await browser.new_context(
                    user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
                    viewport={"width": 430, "height": 932},
                    is_mobile=True,
                    has_touch=True
                )
            else:
                context = await browser.new_context(
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
                    viewport={"width": 1280, "height": 900}
                )

            page = await context.new_page()

            try:
                await page.goto(url, wait_until="domcontentloaded", timeout=45000)
                await page.wait_for_timeout(4000)

                # Dismiss cookies & overlays
                await page.evaluate("""() => {
                    document.querySelectorAll('[class*="cookie"], [class*="modal"], [class*="bottom-banner"], [class*="dialog"], [class*="login"], [id*="cookie"]').forEach(e => e.remove());
                }""")

                # Extract rehydration JSON data
                rehy_data = await page.evaluate("""() => {
                    const script = document.getElementById('__UNIVERSAL_DATA_FOR_REHYDRATION__');
                    if (script) {
                        try { return JSON.parse(script.textContent); } catch(e){}
                    }
                    return null;
                }""")

                # Search through rehydration for itemStruct
                item_struct = None
                if rehy_data:
                    default_scope = rehy_data.get("__DEFAULT_SCOPE__", {})
                    # Recursively search for itemStruct
                    def find_item_struct(obj):
                        if isinstance(obj, dict):
                            if "itemStruct" in obj:
                                return obj["itemStruct"]
                            if "itemInfo" in obj and "itemStruct" in obj["itemInfo"]:
                                return obj["itemInfo"]["itemStruct"]
                            for k, v in obj.items():
                                res = find_item_struct(v)
                                if res:
                                    return res
                        return None
                    item_struct = find_item_struct(default_scope)

                # Fallback info from page
                page_info = await page.evaluate("""() => {
                    const title = document.title;
                    const metaDesc = document.querySelector('meta[name="description"]')?.content || '';
                    const ogTitle = document.querySelector('meta[property="og:title"]')?.content || '';
                    const ogDesc = document.querySelector('meta[property="og:description"]')?.content || '';
                    const fullText = document.body.innerText;
                    return { title, metaDesc, ogTitle, ogDesc, fullText };
                }""")

                metadata = {
                    "id": target_id,
                    "url": url,
                    "type": t_type,
                    "note": note,
                    "title": page_info.get("title"),
                    "description": page_info.get("metaDesc") or page_info.get("ogDesc"),
                    "author": item_struct.get("author", {}).get("uniqueId") if item_struct else "",
                    "stats": item_struct.get("stats", {}) if item_struct else {},
                    "music": item_struct.get("music", {}).get("title") if item_struct else ""
                }

                # If photo post, find images in item_struct
                image_urls = []
                if item_struct and "imagePost" in item_struct:
                    imgs = item_struct["imagePost"].get("images", [])
                    for img in imgs:
                        disp = img.get("displayImage", {})
                        urls_list = disp.get("urlList", [])
                        if urls_list:
                            image_urls.append(urls_list[-1])

                metadata["image_urls"] = image_urls
                print(f"Item found: Author=@{metadata['author']}, Stats={metadata['stats']}")
                print(f"High-res image URLs in struct: {len(image_urls)}")

                # Save metadata
                with open(os.path.join(item_dir, "metadata.json"), "w", encoding="utf-8") as f:
                    json.dump(metadata, f, indent=2, ensure_ascii=False)

                # Save full text
                with open(os.path.join(item_dir, "page_text.txt"), "w", encoding="utf-8") as f:
                    f.write(page_info.get("fullText", ""))

                # Download high-res images if available
                if image_urls:
                    for s_idx, img_url in enumerate(image_urls):
                        img_path = os.path.join(item_dir, f"slide_{s_idx+1}.jpg")
                        try:
                            req = urllib.request.Request(
                                img_url,
                                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
                            )
                            with urllib.request.urlopen(req, timeout=15) as resp, open(img_path, "wb") as f_out:
                                f_out.write(resp.read())
                            print(f"  [+] Downloaded slide_{s_idx+1}.jpg ({os.path.getsize(img_path)} bytes)")
                        except Exception as dl_err:
                            print(f"  [-] Failed downloading slide_{s_idx+1}: {dl_err}")

                # Also capture screenshots!
                # For photo posts, capture slide screenshots by swiping or extracting img tags
                if t_type == "photo":
                    # Capture clean viewport
                    await page.screenshot(path=os.path.join(item_dir, "viewport_1.png"))
                    
                    # If high-res images weren't extracted from rehy, extract from DOM img tags
                    dom_imgs = await page.evaluate("""() => {
                        return Array.from(document.querySelectorAll('img'))
                            .filter(i => (i.naturalWidth > 200 || i.width > 200) && !i.src.includes('avatar') && !i.src.includes('icon'))
                            .map(i => i.src);
                    }""")
                    print(f"Found {len(dom_imgs)} candidate images in DOM")
                    
                    # If we didn't have image_urls from struct, try downloading dom_imgs
                    if not image_urls and dom_imgs:
                        for s_idx, d_url in enumerate(dom_imgs[:10]):
                            img_path = os.path.join(item_dir, f"slide_dom_{s_idx+1}.jpg")
                            try:
                                req = urllib.request.Request(d_url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
                                with urllib.request.urlopen(req, timeout=15) as resp, open(img_path, "wb") as f_out:
                                    f_out.write(resp.read())
                                print(f"  [DOM] Downloaded slide_dom_{s_idx+1}.jpg")
                            except Exception as dl_e:
                                pass

                    # Swipe up to 7 times and take screenshots of each slide
                    for sw in range(2, 8):
                        try:
                            await page.mouse.move(380, 500)
                            await page.mouse.down()
                            await page.mouse.move(50, 500, steps=12)
                            await page.mouse.up()
                            await page.wait_for_timeout(1200)
                            await page.screenshot(path=os.path.join(item_dir, f"viewport_slide_{sw}.png"))
                            print(f"  Swiped to slide {sw}")
                        except Exception as sw_e:
                            break
                else:
                    # Video post: take screenshots and inspect video element / subtitles
                    await page.screenshot(path=os.path.join(item_dir, "video_frame.png"))
                    print(f"Saved video frame screenshot")

            except Exception as e:
                print(f"Error handling {target_id}: {e}")
            finally:
                await context.close()

        await browser.close()
        print("\nAll deep scraping finished successfully!")

if __name__ == "__main__":
    asyncio.run(extract_deep())
