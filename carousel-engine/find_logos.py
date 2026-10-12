import urllib.request
import json

url = 'https://raw.githubusercontent.com/simple-icons/simple-icons/develop/_data/simple-icons.json'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print(f'Total icons: {len(data)}')
        keywords = ['excel', 'openai', 'cohere', 'pinecone', 'salesforce', 'holded', 'pydantic', 'nvidia', 'chatgpt', 'llama', 'meet', 'whatsapp', 'docker', 'ubuntu', 'hugging']
        for icon in data:
            title = icon['title'].lower()
            slug = icon.get('slug', title.replace(' ', ''))
            for k in keywords:
                if k in title or k in slug:
                    print(f'{k} -> title: "{icon["title"]}", slug: "{icon.get("slug", "")}", hex: "{icon.get("hex")}"')
except Exception as e:
    print("Error:", e)
