import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math

brain_dir = r"C:\Users\Mi Empresa Online\.gemini\antigravity\brain\65276ee7-26ea-47cc-b690-13e815de3073"
source_img_path = os.path.join(brain_dir, ".user_uploaded", "media_1790691039882.png")
output_img_path = os.path.join(brain_dir, "geo_post_image.png")

# Load source image
src = Image.open(source_img_path).convert("RGBA")
W_src, H_src = src.size

# Target canvas: 1280 x 720 (16:9 standard for Google Posts & Social)
W, H = 1280, 720
canvas = Image.new("RGBA", (W, H), (11, 13, 20, 255))
draw = ImageDraw.Draw(canvas)

# 1. Background: Draw subtle radial glow and deep cosmic gradients
cx, cy = W // 2, H // 2 - 10

# Create radial gradient on a separate layer
glow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
glow_draw = ImageDraw.Draw(glow_layer)

for r in range(450, 0, -15):
    alpha = int(35 * (1 - r / 450))
    glow_draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(25, 45, 95, alpha))

for r in range(220, 0, -10):
    alpha = int(45 * (1 - r / 220))
    glow_draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(40, 110, 210, alpha))

canvas = Image.alpha_composite(canvas, glow_layer)
draw = ImageDraw.Draw(canvas)

# 2. Draw tech grid & orbital rings
for r in [180, 260, 340, 420]:
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(60, 90, 150, 45), width=1)

# Subtle orbital ticks
for angle_deg in range(0, 360, 15):
    rad = math.radians(angle_deg)
    r1, r2 = 336, 344
    x1 = cx + int(r1 * math.cos(rad))
    y1 = cy + int(r1 * math.sin(rad))
    x2 = cx + int(r2 * math.cos(rad))
    y2 = cy + int(r2 * math.sin(rad))
    draw.line([(x1, y1), (x2, y2)], fill=(90, 140, 230, 70), width=1)

# Connection lines from center to nodes
node_angles = [270, 220, 175, 130, 320, 5, 50]
for a in node_angles:
    rad = math.radians(a)
    rx = cx + int(310 * math.cos(rad))
    ry = cy + int(310 * math.sin(rad))
    draw.line([(cx, cy), (rx, ry)], fill=(65, 130, 240, 40), width=1)

# 3. Extract crisp badges from source image
# Source coordinates in 1024x571:
# OpenAI: (512, 98), box ~ [455, 40, 570, 155]
# Google: (356, 152), box ~ [300, 95, 412, 210]
# Copilot: (668, 152), box ~ [612, 95, 724, 210]
# Perplexity: (218, 238), box ~ [160, 180, 275, 295]
# Claude text: [20, 335, 150, 395]
# Grok text: [880, 335, 990, 395]
# Meta AI: [700, 415, 875, 485]
# Arc Search: [180, 490, 370, 560]
# DuckDuckGo: [640, 490, 870, 560]

def extract_patch(box):
    return src.crop(box)

# Crop elements
badge_openai = extract_patch((450, 35, 575, 160))
badge_google = extract_patch((298, 92, 414, 208))
badge_copilot = extract_patch((610, 92, 726, 208))
badge_perplexity = extract_patch((130, 200, 305, 275))
badge_claude = extract_patch((25, 330, 145, 405))
badge_grok = extract_patch((870, 330, 995, 405))
badge_meta = extract_patch((695, 420, 865, 490))
badge_brave = extract_patch((670, 200, 885, 275))

# Also extract the modern search bar from source [270, 295, 755, 365]
search_bar = extract_patch((270, 290, 755, 365))

# Paste badges on target canvas with perfect positions
# Target center is cx=640, cy=350

# 1. OpenAI (Top Center)
b_w, b_h = badge_openai.size
canvas.paste(badge_openai, (cx - b_w // 2, cy - 290), badge_openai)

# 2. Google (Top Left)
b_w, b_h = badge_google.size
canvas.paste(badge_google, (cx - 240, cy - 220), badge_google)

# 3. Copilot (Top Right)
b_w, b_h = badge_copilot.size
canvas.paste(badge_copilot, (cx + 120, cy - 220), badge_copilot)

# 4. Perplexity AI (Mid Left)
b_w, b_h = badge_perplexity.size
canvas.paste(badge_perplexity, (cx - 430, cy - 110), badge_perplexity)

# 5. Brave Search (Mid Right)
b_w, b_h = badge_brave.size
canvas.paste(badge_brave, (cx + 190, cy - 110), badge_brave)

# 6. Claude (Far Left)
b_w, b_h = badge_claude.size
canvas.paste(badge_claude, (cx - 480, cy + 30), badge_claude)

# 7. Grok (Far Right)
b_w, b_h = badge_grok.size
canvas.paste(badge_grok, (cx + 360, cy + 30), badge_grok)

# 8. Meta AI (Lower Right)
b_w, b_h = badge_meta.size
canvas.paste(badge_meta, (cx + 180, cy + 130), badge_meta)

# Central Search Bar: Scale up slightly for crispness
sb_w, sb_h = search_bar.size
scale = 1.15
sb_resized = search_bar.resize((int(sb_w * scale), int(sb_h * scale)), Image.Resampling.LANCZOS)
canvas.paste(sb_resized, (cx - sb_resized.width // 2, cy - 25), sb_resized)

# 4. Top Header & Bottom Brand Banner (Dark Luxury Typography)
draw = ImageDraw.Draw(canvas)

# Fonts
font_dir = r"C:\programacion\emprendimiento\PAI Systems\website-pebai\brand"
font_path = os.path.join(font_dir, "Manrope-latin-variable.woff2")

try:
    # Try TTF if exists
    ttf_path = r"C:\Windows\Fonts\arialbd.ttf"
    f_badge = ImageFont.truetype(ttf_path, 15)
    f_title = ImageFont.truetype(ttf_path, 22)
    f_sub = ImageFont.truetype(r"C:\Windows\Fonts\arial.ttf", 14)
except Exception:
    f_badge = f_title = f_sub = ImageFont.load_default()

# Top pill badge: GENERATIVE ENGINE OPTIMIZATION · GEO
pill_text = "GENERATIVE ENGINE OPTIMIZATION · GEO"
bbox = draw.textbbox((0, 0), pill_text, font=f_badge)
tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
px, py = cx - tw // 2, 35
pad_x, pad_y = 18, 8

# Draw pill
draw.rounded_rectangle(
    [px - pad_x, py - pad_y, px + tw + pad_x, py + th + pad_y],
    radius=20,
    fill=(18, 25, 45, 230),
    outline=(56, 189, 248, 180),
    width=1
)
# Green status dot
draw.ellipse([px - pad_x + 10, py + th // 2 - 3, px - pad_x + 16, py + th // 2 + 3], fill=(34, 197, 94, 255))
draw.text((px + 10, py), pill_text, fill=(240, 245, 255), font=f_badge)

# Bottom Bar: PEBAI SYSTEMS · POSICIONAMIENTO EN INTELIGENCIA ARTIFICIAL
bottom_box = [0, H - 55, W, H]
draw.rectangle(bottom_box, fill=(8, 10, 16, 230))
draw.line([(0, H - 55), (W, H - 55)], fill=(40, 55, 85, 150), width=1)

bot_text = "PEBAI SYSTEMS"
bot_sub = "POSICIONAMIENTO EN MOTORES DE IA · CHATGPT · PERPLEXITY · GEMINI · CLAUDE"

draw.text((45, H - 40), bot_text, fill=(255, 255, 255), font=f_badge)
draw.text((200, H - 39), "·", fill=(56, 189, 248), font=f_badge)
draw.text((220, H - 39), bot_sub, fill=(150, 165, 195), font=f_sub)

# Save image
canvas_rgb = canvas.convert("RGB")
canvas_rgb.save(output_img_path, "PNG", quality=95)

# Also copy to dist/brand/ for permanent availability
dist_brand_post = r"C:\programacion\emprendimiento\PAI Systems\website-pebai\dist\brand\pebai-geo-ai-search-engines.png"
canvas_rgb.save(dist_brand_post, "PNG", quality=95)

print("Saved output to:", output_img_path)
print("Saved web copy to:", dist_brand_post)
