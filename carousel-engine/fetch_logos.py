import urllib.request
import os

os.makedirs("carousel-engine/assets/logos", exist_ok=True)

lobe_icons = [
    ("cohere.svg", "https://raw.githubusercontent.com/lobehub/lobe-icons/main/packages/static-svg/icons/cohere-color.svg"),
    ("deepseek.svg", "https://raw.githubusercontent.com/lobehub/lobe-icons/main/packages/static-svg/icons/deepseek-color.svg"),
    ("claude.svg", "https://raw.githubusercontent.com/lobehub/lobe-icons/main/packages/static-svg/icons/claude-color.svg"),
    ("openai.svg", "https://raw.githubusercontent.com/lobehub/lobe-icons/main/packages/static-svg/icons/openai.svg"),
    ("qwen.svg", "https://raw.githubusercontent.com/lobehub/lobe-icons/main/packages/static-svg/icons/qwen-color.svg"),
    ("meta.svg", "https://raw.githubusercontent.com/lobehub/lobe-icons/main/packages/static-svg/icons/meta-color.svg"),
    ("ollama.svg", "https://raw.githubusercontent.com/lobehub/lobe-icons/main/packages/static-svg/icons/ollama.svg"),
    ("huggingface.svg", "https://raw.githubusercontent.com/lobehub/lobe-icons/main/packages/static-svg/icons/huggingface-color.svg"),
]

simple_icons = [
    ("docker.svg", "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/docker.svg"),
    ("ubuntu.svg", "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/ubuntu.svg"),
    ("nvidia.svg", "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/nvidia.svg"),
    ("python.svg", "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/python.svg"),
    ("pydantic.svg", "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/pydantic.svg"),
    ("postgresql.svg", "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/postgresql.svg"),
    ("whatsapp.svg", "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/whatsapp.svg"),
    ("excel.svg", "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/microsoftexcel.svg"),
    ("sheets.svg", "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/googlesheets.svg"),
    ("hubspot.svg", "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/hubspot.svg"),
    ("googlemeet.svg", "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/googlemeet.svg"),
    ("n8n.svg", "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/n8n.svg"),
    ("make.svg", "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/make.svg"),
    ("supabase.svg", "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/supabase.svg"),
    ("qdrant.svg", "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/qdrant.svg"),
    ("salesforce.svg", "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/salesforce.svg"),
    ("sap.svg", "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/sap.svg"),
    ("hetzner.svg", "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/hetzner.svg"),
]

for name, url in lobe_icons + simple_icons:
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
