import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

brain_dir = r"C:\Users\Mi Empresa Online\.gemini\antigravity\brain\65276ee7-26ea-47cc-b690-13e815de3073"
base_path = os.path.join(brain_dir, "geo_flux_notext.png")
out_path = os.path.join(brain_dir, "geo_post_master.png")

base = Image.open(base_path).convert("RGBA")
W, H = base.size # 1024, 1024

def make_glass_badge(icon_path, label_text, glow_color, size=90):
    # Create circular frosted glass badge
    badge = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(badge)
    
    # Outer glow
    r = size // 2
    cx, cy = r, r
    
    # Dark glass base with subtle transparency
    d.ellipse((3, 3, size - 3, size - 3), fill=(14, 18, 32, 230), outline=(*glow_color, 240), width=3)
    
    # Load and center icon
    if os.path.exists(icon_path):
        icon = Image.open(icon_path).convert("RGBA")
        icon_size = int(size * 0.58)
        icon = icon.resize((icon_size, icon_size), Image.Resampling.LANCZOS)
        badge.paste(icon, (cx - icon_size // 2, cy - icon_size // 2), icon)
        
    return badge

# Create badges
b_openai = make_glass_badge(os.path.join(brain_dir, "openai_icon.png"), "ChatGPT", (16, 163, 127), size=98)
b_gemini = make_glass_badge(os.path.join(brain_dir, "gemini_icon.png"), "Gemini", (66, 133, 244), size=92)
b_claude = make_glass_badge(os.path.join(brain_dir, "claude_icon.png"), "Claude", (217, 119, 87), size=92)
b_copilot = make_glass_badge(os.path.join(brain_dir, "copilot_icon.png"), "Copilot", (147, 51, 234), size=92)
b_perp = make_glass_badge(os.path.join(brain_dir, "perplexity_icon.png"), "Perplexity", (34, 211, 238), size=92)
b_grok = make_glass_badge(os.path.join(brain_dir, "grok_icon.png"), "Grok", (240, 240, 245), size=90)

# Placement coordinates in 1024x1024 base:
# Center is (512, 485)
# 1. OpenAI (Top Center) -> (512, 195)
base.paste(b_openai, (512 - b_openai.width // 2, 195 - b_openai.height // 2), b_openai)

# 2. Google Gemini (Top Left) -> (285, 280)
base.paste(b_gemini, (285 - b_gemini.width // 2, 280 - b_gemini.height // 2), b_gemini)

# 3. Microsoft Copilot (Top Right) -> (740, 280)
base.paste(b_copilot, (740 - b_copilot.width // 2, 280 - b_copilot.height // 2), b_copilot)

# 4. Perplexity AI (Mid Left) -> (175, 485)
base.paste(b_perp, (175 - b_perp.width // 2, 485 - b_perp.height // 2), b_perp)

# 5. Anthropic Claude (Bottom Left) -> (265, 680)
base.paste(b_claude, (265 - b_claude.width // 2, 680 - b_claude.height // 2), b_claude)

# 6. Grok / xAI (Mid Right) -> (850, 485)
base.paste(b_grok, (850 - b_grok.width // 2, 485 - b_grok.height // 2), b_grok)

# Text and Labels
draw = ImageDraw.Draw(base)
try:
    font_bold = r"C:\Windows\Fonts\arialbd.ttf"
    font_reg = r"C:\Windows\Fonts\arial.ttf"
    f_header = ImageFont.truetype(font_bold, 21)
    f_search = ImageFont.truetype(font_bold, 17)
    f_label = ImageFont.truetype(font_bold, 13)
    f_brand = ImageFont.truetype(font_bold, 18)
    f_sub = ImageFont.truetype(font_reg, 14)
except Exception:
    f_header = f_search = f_label = f_brand = f_sub = ImageFont.load_default()

# Add small label under each badge
def add_label(text, cx, cy, col=(240, 245, 255)):
    bbox = draw.textbbox((0, 0), text, font=f_label)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    # small pill background
    draw.rounded_rectangle([cx - tw//2 - 8, cy - 2, cx + tw//2 + 8, cy + th + 4], radius=6, fill=(10, 14, 26, 220))
    draw.text((cx - tw // 2, cy), text, fill=col, font=f_label)

add_label("ChatGPT", 512, 252, (56, 189, 248))
add_label("Gemini", 285, 335, (147, 197, 253))
add_label("Copilot", 740, 335, (196, 181, 253))
add_label("Perplexity", 175, 540, (103, 232, 249))
add_label("Claude", 265, 735, (253, 186, 116))
add_label("Grok", 850, 540, (226, 232, 240))

# Search bar text in center (search bar is at ~[330, 465, 680, 520])
search_text = "¿Qué empresa de IA recomiendas en España?"
draw.text((362, 484), search_text, fill=(15, 23, 42), font=f_search)

# Top Banner Pill
header_pill = "GENERATIVE ENGINE OPTIMIZATION · GEO"
bbox = draw.textbbox((0, 0), header_pill, font=f_header)
tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
hx = 512 - tw // 2
draw.rounded_rectangle([hx - 24, 46, hx + tw + 24, 46 + th + 18], radius=24, fill=(11, 15, 30, 240), outline=(56, 189, 248, 220), width=2)
# Green pulse dot
draw.ellipse([hx - 12, 60, hx - 4, 68], fill=(34, 197, 94, 255))
draw.text((hx + 6, 54), header_pill, fill=(240, 245, 255), font=f_header)

# Bottom Branding Bar
draw.rounded_rectangle([120, 935, 904, 995], radius=16, fill=(8, 12, 24, 245), outline=(60, 85, 140, 160), width=1)
draw.text((150, 953), "PEBAI SYSTEMS", fill=(255, 255, 255), font=f_brand)
draw.text((320, 953), "·", fill=(56, 189, 248), font=f_brand)
draw.text((345, 956), "POSICIONAMIENTO EN BUSCADORES DE IA", fill=(160, 185, 230), font=f_sub)

# Save high-res master
base_rgb = base.convert("RGB")
base_rgb.save(out_path, "PNG", quality=98)

# Also save a 1200x675 (16:9) crop for Google Posts
aspect_16_9 = base_rgb.crop((0, 120, 1024, 120 + 576)).resize((1200, 675), Image.Resampling.LANCZOS)
post_16_9_path = os.path.join(brain_dir, "geo_post_16_9.png")
aspect_16_9.save(post_16_9_path, "PNG", quality=98)

print("Saved master square to:", out_path)
print("Saved 16:9 post to:", post_16_9_path)
