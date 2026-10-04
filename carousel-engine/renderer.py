import asyncio
import os
from playwright.async_api import async_playwright

class CarouselRenderer:
    def __init__(self, width=1080, height=1440, scale_factor=2):
        self.width = width
        self.height = height
        self.scale_factor = scale_factor

    async def render_html_file(self, html_path: str, output_path: str):
        abs_html = os.path.abspath(html_path)
        abs_out = os.path.abspath(output_path)
        os.makedirs(os.path.dirname(abs_out), exist_ok=True)

        async with async_playwright() as p:
            browser = await p.chromium.launch(channel='msedge', headless=True)
            page = await browser.new_page(
                viewport={'width': self.width, 'height': self.height},
                device_scale_factor=self.scale_factor
            )
            await page.goto(f'file:///{abs_html}')
            await page.wait_for_load_state('networkidle')
            await page.wait_for_timeout(1800)  # Wait for Google Fonts to finish rendering
            await page.screenshot(path=abs_out)
            await browser.close()
            print(f"[Renderer] Successfully exported: {abs_out}")
            return abs_out

    async def render_batch(self, tasks: list):
        """
        tasks is a list of tuples: [(html_path, output_png_path), ...]
        Reuses single browser instance for speed.
        """
        async with async_playwright() as p:
            browser = await p.chromium.launch(channel='msedge', headless=True)
            page = await browser.new_page(
                viewport={'width': self.width, 'height': self.height},
                device_scale_factor=self.scale_factor
            )
            results = []
            for html_path, output_path in tasks:
                abs_html = os.path.abspath(html_path)
                abs_out = os.path.abspath(output_path)
                os.makedirs(os.path.dirname(abs_out), exist_ok=True)

                await page.goto(f'file:///{abs_html}')
                await page.wait_for_load_state('networkidle')
                await page.wait_for_timeout(1500)
                await page.screenshot(path=abs_out)
                print(f"[Renderer] Exported slide: {abs_out}")
                results.append(abs_out)

            await browser.close()
            return results

def render_single(html_path: str, output_path: str):
    renderer = CarouselRenderer()
    return asyncio.run(renderer.render_html_file(html_path, output_path))

def render_slides(tasks: list):
    renderer = CarouselRenderer()
    return asyncio.run(renderer.render_batch(tasks))
