import urllib.request
import re
import json

urls = [
    ('ref_cubria_1', 'https://www.instagram.com/p/DdfI-cQHOX-/'),
    ('ref_cubria_2', 'https://www.instagram.com/p/DdmHm0dHPsD/'),
    ('ref_cubria_3', 'https://www.instagram.com/p/DdH4j-JnJgW/')
]

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
}

for name, url in urls:
    req = urllib.request.Request(url, headers=headers)
    try:
        html = urllib.request.urlopen(req, timeout=12).read().decode('utf-8')
        title_m = re.search(r'<meta property="og:title" content="(.*?)"', html)
        desc_m = re.search(r'<meta property="og:description" content="(.*?)"', html)
        name_desc_m = re.search(r'<meta name="description" content="(.*?)"', html)
        img_m = re.search(r'<meta property="og:image" content="(.*?)"', html)
        keywords_m = re.search(r'<meta name="keywords" content="(.*?)"', html)
        
        print(f"=== {name} ({url}) ===")
        print("TITLE:", title_m.group(1) if title_m else "N/A")
        print("DESC:", desc_m.group(1) if desc_m else (name_desc_m.group(1) if name_desc_m else "N/A"))
        print("KEYWORDS:", keywords_m.group(1) if keywords_m else "N/A")
        print("IMAGE:", img_m.group(1) if img_m else "N/A")
        print()
    except Exception as e:
        print(f"=== {name} ERROR: {e} ===")
