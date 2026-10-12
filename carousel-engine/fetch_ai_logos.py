import urllib.request
import os

os.makedirs("carousel-engine/assets/logos", exist_ok=True)

simple_icons = [
    ("openai.svg", "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/openai.svg"),
    ("deepseek.svg", "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/deepseek.svg"),
    ("claude.svg", "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/claude.svg"),
    ("meta.svg", "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/meta.svg"),
    ("ollama.svg", "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/ollama.svg"),
    ("huggingface.svg", "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/huggingface.svg"),
    ("qwen.svg", "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/alibabacloud.svg"),
    ("gmail.svg", "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/gmail.svg"),
    ("googlecalendar.svg", "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/googlecalendar.svg"),
    ("fastapi.svg", "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/fastapi.svg"),
    ("langchain.svg", "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/langchain.svg"),
]

for name, url in simple_icons:
    dest = os.path.join("carousel-engine/assets/logos", name)
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = resp.read()
            with open(dest, "wb") as f:
                f.write(data)
            print(f"SAVED: {name} ({len(data)} bytes)")
    except Exception as e:
        print(f"FAILED: {name} -> {e}")
