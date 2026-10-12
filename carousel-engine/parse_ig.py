import re

with open('ig_dump.html', 'r', encoding='utf-8') as f:
    text = f.read()

usernames = set(re.findall(r'"username":"([^"]+)"', text))
print('Usernames found:', list(usernames)[:10])

# Look for image urls
img_urls = re.findall(r'"display_url":"([^"]+)"', text)
print('Display URLs found:', len(img_urls))
for u in img_urls[:3]:
    print('Img URL:', u.replace(r'\u0026', '&'))

captions = re.findall(r'"text":"([^"]{20,200})"', text)
print('Captions found:', captions[:5])
