#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PEBAI Systems - Script de Recompilación Masiva de Landings
Aplica las correcciones de Modo Claro / Blanco, asegura Open Graph y
embebido de imágenes destacadas WebP 1200x630 en las 43 landings existentes.
"""

import os
import sys
import json
import re

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
sys.path.append(SCRIPT_DIR)

from deploy_mass_seo import generate_static_landings
from generate_landing_image import generate_landing_banner

DATA_PATH = os.path.join(SCRIPT_DIR, "pages_mass_data.json")

def recompile_all():
    if not os.path.exists(DATA_PATH):
        print(f"No existe {DATA_PATH}")
        return

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        pages = json.load(f)

    print(f"🔄 Procesando {len(pages)} páginas del dataset...")

    for p in pages:
        slug = p["slug"]
        title = p["title"]
        content = p["content"]

        # 1. Determinar ciudad para el badge
        ciudad = "España"
        parts = slug.split("-")
        for known in ['valencia', 'madrid', 'barcelona', 'sevilla', 'malaga', 'bilbao', 'zaragoza', 'granada', 'valladolid', 'murcia', 'alicante', 'palma', 'coruna', 'vigo', 'gijon', 'santander', 'toledo', 'pamplona']:
            if known in parts:
                ciudad = known.capitalize()
                break

        # 2. Generar banner
        banner_rel = generate_landing_banner(title, ciudad=ciudad, slug=slug)

        # 3. Corregir colores fijos blancos por variables CSS
        content = re.sub(r'color:\s*#fff;?', 'color:var(--fg);', content)
        content = re.sub(r'border:\s*1px\s*solid\s*rgba\(255,\s*255,\s*255,\s*0\.08\);?', 'border:1px solid var(--line);', content)
        content = re.sub(r'background:\s*rgba\(255,\s*255,\s*255,\s*0\.04\);?', 'background:var(--soft);', content)
        content = re.sub(r'border-bottom:\s*1px\s*solid\s*rgba\(255,\s*255,\s*255,\s*0\.04\);?', 'border-bottom:1px solid var(--line);', content)
        content = re.sub(r'border-bottom:\s*1px\s*solid\s*rgba\(255,\s*255,\s*255,\s*0\.08\);?', 'border-bottom:1px solid var(--line);', content)
        content = re.sub(r'background:\s*rgba\(183,\s*255,\s*60,\s*0\.03\);?', 'background:color-mix(in srgb, var(--accent) 8%, var(--surface));', content)
        content = re.sub(r'border-left:\s*3px\s*solid\s*var\(--lime\);?', 'border-left:3px solid var(--accent);', content)
        content = re.sub(r'color:\s*#c1c7cf;?', 'color:var(--muted);', content)

        # 4. Insertar imagen destacada si no está
        if "featured-landing-image" not in content:
            img_html = f'''
    <!-- Imagen Destacada de Calidad / Featured Architecture Hero -->
    <figure class="featured-landing-image" style="margin: 28px 0 38px; border-radius: 16px; overflow: hidden; border: 1px solid var(--line); background: var(--surface);">
      <img src="{banner_rel}" alt="{title} - PEBAI Systems" width="1200" height="630" loading="eager" fetchpriority="high" style="width:100%; height:auto; display:block; object-fit:cover; aspect-ratio:16/9;">
      <figcaption style="padding:12px 18px; font-size:12px; color:var(--muted); display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--line); background:var(--soft);">
        <span>Arquitectura & Despliegue de IA · {ciudad}</span>
        <span style="letter-spacing:0.08em; font-weight:600; color:var(--accent);">PEBAI SYSTEMS · ENTERPRISE</span>
      </figcaption>
    </figure>
'''
            if "<!-- Knowledge Graph Grounding" in content:
                content = content.replace("<!-- Knowledge Graph Grounding", img_html + "\n    <!-- Knowledge Graph Grounding")
            elif "<!-- High-Contrast Comparative Table -->" in content:
                content = content.replace("<!-- High-Contrast Comparative Table -->", img_html + "\n    <!-- High-Contrast Comparative Table -->")
            else:
                content = img_html + "\n" + content

        p["content"] = content

    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(pages, f, ensure_ascii=False, indent=2)

    generate_static_landings(pages)
    print("✨ Todas las 43 landings han sido recompiladas con éxito con Modo Claro perfecto y Banners WebP.")

if __name__ == "__main__":
    recompile_all()
