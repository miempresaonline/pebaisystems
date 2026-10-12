import urllib.request
import re
import json

url = 'https://www.instagram.com/p/DdUflqbCUJW/?img_index=6'
req = urllib.request.Request(
    url,
    headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    }
)
try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
        with open('ig_dump.html', 'w', encoding='utf-8') as f:
            f.write(html)
        print('Dumped HTML length:', len(html))
        titles = re.findall(r'<title>(.*?)</title>', html)
        print('Title:', titles)
        meta = re.findall(r'<meta property="og:[^"]+" content="([^"]+)"', html)
        print('Meta:', meta)
except Exception as e:
    print('Error:', e)
