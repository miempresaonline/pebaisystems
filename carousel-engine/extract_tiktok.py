import urllib.request
import re
import json
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'es-ES,es;q=0.9'
}

for name, url in [('Jordi Segues', 'https://www.tiktok.com/@thejordisegues/video/7682689273207737620'),
                  ('Mich Markeeting', 'https://www.tiktok.com/@mich.markeeting/video/7676303139082947860')]:
    print(f"\n=================== {name} ===================")
    req = urllib.request.Request(url, headers=headers)
    html = urllib.request.urlopen(req, timeout=10).read().decode('utf-8', errors='ignore')
    
    # Check subtitle URLs
    sub_urls = re.findall(r'https://[^"\'\s]+\.vtt[^"\'\s]*', html)
    print("VTT sub urls found:", len(sub_urls))
    for s in sub_urls[:3]:
        print("  Sub URL:", s)
        
    m = re.search(r'<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>(.*?)</script>', html, re.DOTALL)
    if m:
        data = json.loads(m.group(1))
        scope = data.get('__DEFAULT_SCOPE__', {})
        vdetail = scope.get('webapp.video-detail', {})
        item = vdetail.get('itemInfo', {}).get('itemStruct', {})
        
        # Check subtitles in video dict
        video_data = item.get('video', {})
        print("Video keys:", list(video_data.keys()))
        subtitle_infos = video_data.get('subtitleInfos', [])
        print("Subtitle infos count:", len(subtitle_infos))
        for sub in subtitle_infos:
            print("  Language:", sub.get('LanguageCodeName'), "Format:", sub.get('Format'), "Url:", sub.get('Url'))
            if sub.get('Url'):
                try:
                    s_req = urllib.request.Request(sub.get('Url'), headers=headers)
                    s_content = urllib.request.urlopen(s_req, timeout=5).read().decode('utf-8', errors='ignore')
                    print("  --- Subtitle Content Snippet ---")
                    print(s_content[:800])
                except Exception as e:
                    print("  Error fetching sub content:", e)
                    
        # Check transcript / text
        print("item contents:", item.get('contents'))
        print("item desc:", item.get('desc'))
