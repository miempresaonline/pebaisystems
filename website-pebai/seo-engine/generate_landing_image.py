#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PEBAI Systems - Generador Híbrido Tri-Modal de Imágenes para Landings SEO & GEO
Implementa 3 métodos visuales totalmente diferenciados (Coste 0 €):
1. Método 1: IA Generativa (FLUX vía Pollinations AI) con prompt adaptado a cada sector o ciudad.
2. Método 2: Fotografía de Stock de Alta Gama (Unsplash CDN) de centros de datos, ingeniería de software y hardware.
3. Método 3: Diagramas de Arquitectura & Pipelines de Marca Oficial PEBAI Systems.

Acabado Visual:
- 100% fotográfico, limpio y nítido (SIN textos gigantes superpuestos en el centro).
- Watermark elegante y minimalista en la esquina inferior derecha: PEBAI SYSTEMS · ENTERPRISE AI.
- Formato WebP 1200x630 optimizado para SEO, Open Graph y Google Discover.
"""

import os
import sys
import hashlib
import io
import time
import urllib.request
import urllib.parse
from PIL import Image, ImageDraw, ImageFont

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
DIST_DIR = os.path.join(PROJECT_DIR, "dist")
BRAND_DIR = os.path.join(DIST_DIR, "brand")
LANDINGS_IMG_DIR = os.path.join(BRAND_DIR, "landings")
FONTS_DIR = os.path.join(PROJECT_DIR, "..", "assets", "brand", "pebai-systems", "logo-kit-v2", "fonts")
FONT_PATH = os.path.join(FONTS_DIR, "Manrope-Regular.ttf")

# Pool de fotografía de stock real empresarial y de alta tecnología (Unsplash CDN 1200x630)
UNSPLASH_TECH_POOL = [
    "1558494949-ef010cbdcc31",  # Datacenter server racks iluminados
    "1531482615713-2afd69097998",  # Equipo de ingenieros de software colaborando
    "1526374965328-7f61d4dc18c5",  # Pantalla de código matricial y telemetría de datos
    "1504384308090-c894fdcc538d",  # Arquitectura corporativa de cristal y vanguardia
    "1544197150-b99a580bb7a8",  # Cables de fibra óptica brillantes de alta velocidad
    "1518770660439-4636190af475",  # Microprocesador cuántico y procesador de IA
    "1451187580459-43490279c0fa",  # Red global de datos satelital y nodos digitales
    "1497366216548-37526070297c",  # Sala de juntas ejecutiva de alta tecnología
    "1522071820081-009f0129c71c",  # Sprint de ingeniería y desarrollo tecnológico
    "1519389950473-47ba0277781c"   # Estación de trabajo tecnológica y analítica
]

# Assets oficiales de diagramas de arquitectura de PEBAI Systems
PEBAI_BRAND_ASSETS = [
    os.path.join(BRAND_DIR, "pebai-automation-pipeline.jpg"),
    os.path.join(BRAND_DIR, "pebai-ai-agents-infrastructure.jpg"),
    os.path.join(BRAND_DIR, "pebai-og-diagnostico.png")
]

def get_sector_prompt(slug, title, ciudad):
    """Genera un prompt fotográfico hiperdetallado y específico para el nicho."""
    s = slug.lower()
    if any(k in s for k in ["clinica", "farmacia", "salud", "medica"]):
        return "modern futuristic AI medical clinical control room, holographic biometric analytics dashboard, clean sterile dark luxury laboratory, glowing emerald cyan subtle lights, 8k photorealistic hyperrealistic"
    elif any(k in s for k in ["abogado", "legal", "expediente"]):
        return "futuristic AI legal intelligence executive boardroom, holographic digital contracts glowing amber gold, sleek dark walnut marble desk, modern architectural lighting, 8k photorealistic"
    elif any(k in s for k in ["logistica", "stock", "ruta", "almacen", "distribucion"]):
        return "automated AI logistics control tower, smart automated high-bay warehouse with autonomous mobile robots, real-time holographic route telemetry, dark neon cyan accents, 8k photorealistic"
    elif any(k in s for k in ["inmobiliaria", "propiedad", "construccion", "reforma"]):
        return "modern architectural smart property hologram, futuristic building blueprints on glass interactive touchscreen, luxury dark aesthetic, high precision rendering, 8k photorealistic"
    elif any(k in s for k in ["hotel", "turismo", "reserva"]):
        return "luxury boutique hotel futuristic interactive AI concierge terminal, ambient warm lighting, sleek minimalist reception, dark elegance, 8k photorealistic"
    elif any(k in s for k in ["voz", "telefonico", "call", "whatsapp"]):
        return "enterprise AI conversational voice intelligence waveform visualization, neural sound waves glowing violet and emerald, sleek high-tech operations desk, dark aesthetic, 8k photorealistic"
    elif any(k in s for k in ["recursos-humanos", "talento", "seleccion"]):
        return "modern executive tech office, holographic candidate talent graph evaluation, glass meeting room, dark sleek interior, 8k photorealistic"
    elif any(k in s for k in ["ecommerce", "ventas", "lead"]):
        return "futuristic e-commerce AI analytics center, real-time customer journey node matrix, dark room with glowing data streams, 8k photorealistic"
    elif any(k in s for k in ["madrid", "barcelona", "valencia", "sevilla", "bilbao", "malaga", "zaragoza", "alicante", "murcia", "granada", "cordoba", "palma", "santander", "gijon", "vigo", "toledo", "valladolid"]):
        return f"futuristic smart city {ciudad} skyline digital twin, high-tech fiber optic connectivity grid glowing across modern architecture, dark night atmospheric luxury, 8k photorealistic"
    else:
        return "enterprise artificial intelligence neural network orchestration pipeline, dark luxury server room, glowing lime green and violet datacenter cabling, 8k photorealistic"

def fetch_ai_generative_flux(prompt):
    """Método 1: Renderizado con IA Generativa (FLUX) a coste 0 €."""
    p_enc = urllib.parse.quote(prompt)
    url = f"https://image.pollinations.ai/prompt/{p_enc}?width=1200&height=630&model=flux&nologo=true"
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Referer": "https://pollinations.ai/"
    })
    try:
        with urllib.request.urlopen(req, timeout=18) as resp:
            data = resp.read()
            if len(data) > 6000:
                img = Image.open(io.BytesIO(data)).convert("RGBA")
                return img.resize((1200, 630), Image.Resampling.LANCZOS)
    except Exception as e:
        print(f"  [Aviso IA Generativa]: {e}. Se aplicará fallback fotográfico.")
    return None

def fetch_unsplash_stock(index):
    """Método 2: Fotografía de stock real empresarial desde Unsplash CDN (Coste 0 €)."""
    photo_id = UNSPLASH_TECH_POOL[index % len(UNSPLASH_TECH_POOL)]
    url = f"https://images.unsplash.com/photo-{photo_id}?auto=format&fit=crop&w=1200&h=630&q=85"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = resp.read()
            if len(data) > 6000:
                img = Image.open(io.BytesIO(data)).convert("RGBA")
                return img.resize((1200, 630), Image.Resampling.LANCZOS)
    except Exception as e:
        print(f"  [Aviso Stock Unsplash]: {e}")
    return None

def load_pebai_brand_asset(index):
    """Método 3: Diagramas de arquitectura técnica oficiales de PEBAI Systems."""
    for offset in range(len(PEBAI_BRAND_ASSETS)):
        choice = PEBAI_BRAND_ASSETS[(index + offset) % len(PEBAI_BRAND_ASSETS)]
        if os.path.exists(choice):
            try:
                img = Image.open(choice).convert("RGBA")
                return img.resize((1200, 630), Image.Resampling.LANCZOS)
            except Exception:
                pass
    return None

def add_clean_watermark(img, badge_text="PEBAI SYSTEMS · ENTERPRISE AI"):
    """
    Inserta un watermark minimalista, refinado y elegante en la esquina inferior derecha.
    No tapa la imagen ni satura el diseño; mantiene la autenticidad fotográfica intacta.
    """
    W, H = img.size

    # Sombra sutil degradada sólo en los últimos 70px inferiores para legibilidad perfecta
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d_ov = ImageDraw.Draw(overlay)
    for y in range(H - 70, H):
        alpha = int(130 * ((y - (H - 70)) / 70.0))
        d_ov.line([(0, y), (W, y)], fill=(10, 10, 15, alpha))
    img = Image.alpha_composite(img, overlay)

    draw = ImageDraw.Draw(img)
    font = None
    if os.path.exists(FONT_PATH):
        try:
            font = ImageFont.truetype(FONT_PATH, 14)
        except Exception:
            font = None
    if font is None:
        font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), badge_text, font=font)
    bw = bbox[2] - bbox[0]
    bx = W - bw - 44
    by = H - 40

    # Píldora dark luxury con borde violeta PEBAI y punto verde lima neón
    draw.rounded_rectangle([bx - 12, by - 6, W - 18, by + 22], radius=8, fill=(14, 14, 20, 215), outline=(106, 92, 255, 140), width=1)
    draw.ellipse([bx - 2, by + 5, bx + 5, by + 12], fill=(183, 255, 60, 255))
    draw.text((bx + 14, by - 2), badge_text, font=font, fill=(240, 240, 245, 255))

    return img

def generate_landing_banner(title, ciudad="España", slug="consultoria-ia", service_type="Consultoría de IA", force=False):
    """
    Genera y guarda una imagen WebP de 1200x630 para la landing page.
    Alterna de forma determinista entre los 3 métodos visuales:
    - 0: IA Generativa (FLUX) adaptada al sector
    - 1: Fotografía de Stock de Alta Gama (Unsplash)
    - 2: Arquitectura y Pipelines de Marca PEBAI
    """
    os.makedirs(LANDINGS_IMG_DIR, exist_ok=True)
    out_filename = f"{slug}.webp"
    out_filepath = os.path.join(LANDINGS_IMG_DIR, out_filename)

    if os.path.exists(out_filepath) and not force:
        return f"../brand/landings/{out_filename}"

    hash_val = int(hashlib.md5(slug.encode("utf-8")).hexdigest(), 16)
    mode = hash_val % 3
    base_img = None
    mode_name = ""

    # 1. Intentar según el modo asignado
    if mode == 0:
        mode_name = "IA Generativa (FLUX)"
        prompt = get_sector_prompt(slug, title, ciudad)
        base_img = fetch_ai_generative_flux(prompt)
        if base_img is None:
            # Fallback transparente a stock fotográfico si la IA externa tuviese latencia
            base_img = fetch_unsplash_stock(hash_val)

    elif mode == 1:
        mode_name = "Fotografía de Stock (Unsplash Tech)"
        base_img = fetch_unsplash_stock(hash_val)
        if base_img is None:
            base_img = load_pebai_brand_asset(hash_val)

    else: # mode == 2
        mode_name = "Arquitectura de Marca PEBAI"
        base_img = load_pebai_brand_asset(hash_val)
        if base_img is None:
            base_img = fetch_unsplash_stock(hash_val)

    # Si todo fallara, generar fondo Dark Luxury estilizado
    if base_img is None:
        base_img = Image.new("RGBA", (1200, 630), (14, 14, 22, 255))
        d = ImageDraw.Draw(base_img)
        for y in range(630):
            f = y / 630.0
            d.line([(0, y), (1200, y)], fill=(int(14 + 10*f), int(14 + 8*f), int(22 + 25*f), 255))

    # Badge de esquina con marca y ubicación
    if ciudad and ciudad != "España":
        badge_text = f"PEBAI SYSTEMS · {ciudad.upper()}"
    else:
        badge_text = "PEBAI SYSTEMS · ENTERPRISE AI"

    # Aplicar watermark limpio
    final_img = add_clean_watermark(base_img, badge_text=badge_text)

    # Guardar en formato WebP de máxima calidad y compresión óptima (~50-100 KB)
    final_img.convert("RGB").save(out_filepath, "WEBP", quality=90)
    print(f"  [Banner Generado]: {slug}.webp [{mode_name}] -> {out_filepath}")

    return f"../brand/landings/{out_filename}"

if __name__ == "__main__":
    print("Probando generador de imágenes tri-modal de PEBAI Systems...")
    s1 = generate_landing_banner("Agente de IA para Clínicas Médicas", "Valencia", "agente-ia-clinicas-gestion-citas-telefonicas", force=True)
    s2 = generate_landing_banner("Agencia de Inteligencia Artificial en Valencia", "Valencia", "agencia-inteligencia-artificial-valencia", force=True)
    s3 = generate_landing_banner("Sistemas Multiagente de IA para Empresas", "Madrid", "sistema-multiagente-ia-para-empresas", force=True)
    print("Prueba completada.")
