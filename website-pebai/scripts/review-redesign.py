from pathlib import Path
from playwright.sync_api import sync_playwright
import json

base=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
    browser=p.chromium.launch(channel='chrome')
    page=browser.new_page()
    errors=[]
    page.on('pageerror',lambda error: errors.append(str(error)))
    for width,height in [(1440,1000),(390,844),(320,720)]:
        page.set_viewport_size({'width':width,'height':height})
        page.goto((base/'dist/index.html').as_uri())
        page.wait_for_timeout(1200)
        if page.locator('.cookie-accept').is_visible(): page.locator('.cookie-accept').click()
        page.evaluate("document.querySelectorAll('img[loading]').forEach(img=>img.loading='eager')")
        for y in range(0, page.evaluate('document.documentElement.scrollHeight'), 500):
            page.evaluate('(y)=>window.scrollTo(0,y)',y)
            page.wait_for_timeout(70)
        page.wait_for_timeout(1000)
        page.evaluate('window.scrollTo(0,0)')
        page.wait_for_timeout(400)
        for theme in ['dark','light']:
            page.evaluate('(theme)=>document.documentElement.dataset.theme=theme',theme)
            overflow=page.evaluate('document.documentElement.scrollWidth > innerWidth')
            print(json.dumps({'width':width,'theme':theme,'overflow':overflow,'h1':page.locator('h1').inner_text(),'services':page.locator('.r-service').count()}))
            page.screenshot(path=str(base/f'review-{width}-{theme}.png'),full_page=True)
            page.screenshot(path=str(base/f'hero-{width}-{theme}.png'))
        page.locator('.r-service summary').nth(2).click()
        assert page.locator('.r-service[open]').count()==1
        assert page.locator('.r-service[open] h3').inner_text()=='Agentes de voz'
        page.locator('#contacto').scroll_into_view_if_needed()
        page.wait_for_timeout(400)
        assert page.locator('.floating-cta').evaluate('(el)=>getComputedStyle(el).opacity')=='1'
    print('PAGE ERRORS',errors)
    browser.close()
