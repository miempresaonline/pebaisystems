import os
import sys
import asyncio
import base64
from jinja2 import Environment, FileSystemLoader
from playwright.async_api import async_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")
ASSETS_DIR = os.path.join(BASE_DIR, "assets")
OUTPUT_DIR = os.path.join(BASE_DIR, "output")
LOGOS_DIR = os.path.join(ASSETS_DIR, "logos")

PEBAI_LOGO_HORIZONTAL = os.path.join(ASSETS_DIR, "pebai", "pebai-horizontal-color-ink-1160.png").replace("\\", "/")
PEBAI_LOGO_MARK = os.path.join(ASSETS_DIR, "pebai", "pebai-mark-color-512.png").replace("\\", "/")

def load_logos():
    logos = {}
    if os.path.exists(LOGOS_DIR):
        for fname in os.listdir(LOGOS_DIR):
            key = os.path.splitext(fname)[0]
            fpath = os.path.join(LOGOS_DIR, fname)
            with open(fpath, "rb") as f:
                b64 = base64.b64encode(f.read()).decode("utf-8")
            mime = "image/png" if fname.endswith(".png") else "image/svg+xml"
            logos[key] = f"data:{mime};base64,{b64}"
    return logos

ALL_LOGOS = load_logos()

jinja_env = Environment(loader=FileSystemLoader(TEMPLATES_DIR, encoding='utf-8'), autoescape=False)

ICONS_DIR = os.path.join(ASSETS_DIR, "icons").replace("\\", "/")

CAROUSELS_CONFIG = [
    {
        "id": "propuesta_1_viral",
        "title": "OpenAI Meterá Anuncios en ChatGPT Este Mes",
        "template": "carrusel_viral_v3_chatgpt_ads.html.jinja",
        "cover_artwork": os.path.join(ASSETS_DIR, "covers", "cover_quantum_brain.png").replace("\\", "/"),
        "category_tag": "ACTUALIDAD IA · < 24 HORAS",
        "total_slides": 5,
        "caption": """OpenAI comenzará a probar inserciones publicitarias patrocinadas dentro de ChatGPT este mismo mes.

La era de la interfaz limpia y sin anuncios ha llegado a su fin para los más de 1.200 millones de usuarios semanales de la plataforma. El coste de computación para modelos de razonamiento como o1 y GPT-5 es astronómico: OpenAI gasta más de 5.000 millones de dólares anuales en servidores, y las suscripciones Plus de 20$/mes apenas representan el 6% de los usuarios.

Los primeros ensayos se realizarán en EE.UU. vinculados a la generación de imágenes, pero abre la puerta al nuevo 'PPC de Inteligencia Artificial'.

¿Pagarías una cuota mayor por mantener ChatGPT completamente libre de anuncios o prefieres un modelo gratuito con publicidad patrocinada?

Deja tu opinión en comentarios (A o B) y guarda este post para seguir la evolución del despliegue."""
    },
    {
        "id": "propuesta_2_mixto",
        "title": "Si ChatGPT No Te Cita, Eres Invisible al 69% del Mercado",
        "template": "carrusel_mixto_v3_geo.html.jinja",
        "cover_artwork": os.path.join(ASSETS_DIR, "covers", "cover_crystal_shield.png").replace("\\", "/"),
        "category_tag": "SERVICIO GEO · PEBAI SYSTEMS",
        "total_slides": 5,
        "caption": """El 69% de las consultas en internet ya no hacen clic en enlaces de Google. Se resuelven directamente con respuestas sintetizadas por ChatGPT, Perplexity o Gemini.

El SEO tradicional de palabras clave y compra de enlaces ha dejado de ser suficiente. Si un cliente potencial pregunta a la IA por proveedores en tu sector y el modelo no cita tu marca como fuente contrastada, tu negocio simplemente no existe para ese comprador.

En PEBAI Systems implementamos GEO (Generative Engine Optimization):
1. Despliegue de fichas semánticas y catálogos en archivos llms.txt legibles en 30ms.
2. Validación y coherencia de entidad para maximizar la autoridad cruzada del modelo.
3. Bypass técnico en Cloudflare WAF para permitir el rastreo de OAI-SearchBot y PerplexityBot.

Si quieres auditar qué dice la IA hoy sobre tu empresa y cómo hacer que empiece a recomendarte:

Comenta GEO y te enviaremos un diagnóstico de visibilidad generativa."""
    },
    {
        "id": "propuesta_3_b2b",
        "title": "¿Tu Equipo Sigue Pasando Datos a Mano de WhatsApp a Excel?",
        "template": "carrusel_b2b_v2_fugas.html.jinja",
        "cover_artwork": os.path.join(ASSETS_DIR, "covers", "cover_diagnostic_pda.png").replace("\\", "/"),
        "category_tag": "CONSULTORÍA TÉCNICA · 25 MIN",
        "total_slides": 5,
        "caption": """¿Tu equipo sigue pasando datos a mano de WhatsApp a Excel cada día?

22 horas a la semana. Ese es el tiempo medio que pierde un equipo de 3 personas rellenando hojas de cálculo, traspasando pedidos y cuadrando albaranes desconectados. En términos económicos, son más de 1.800€ al mes en tareas manuales que no generan ni un solo euro de facturación nueva.

Este mes abrimos SOLO 5 PLAZAS para nuestra Consultoría Técnica Privada de 25 minutos:
- Sesión 1 a 1 por Google Meet con un ingeniero de procesos de PEBAI.
- Diagnóstico en directo de tus herramientas actuales (CRM, WhatsApp, ERP, Excel).
- Identificación de las fugas de tiempo y costes ocultos más críticos.
- Entrega de una hoja de ruta con la arquitectura técnica exacta para automatizarlas.

COSTE: 0 € (Coste Cero · 100% Gratuita y sin compromiso comercial).
Filtro: Negocios con presupuesto disponible y ganas reales de transformar e impulsar su operativa con IA.

Comenta CONSULTORÍA y te enviaremos una invitación directa por privado para reservar una de las 5 plazas disponibles este mes."""
    }
]

def generate_mobile_viewer(folder_dir, title, num_slides, caption):
    slides_markup = ""
    for i in range(1, num_slides + 1):
        slides_markup += f"""
        <div class="slide" id="slide-{i}">
          <img src="slide_{i}.png" alt="Slide {i}">
          <div class="slide-indicator">{i} / {num_slides}</div>
        </div>
        """

    html = f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title} — Visor de Carrusel PEBAI</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      background: #0B0F17;
      color: #F8FAFC;
      font-family: 'Plus Jakarta Sans', sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 35px 20px;
    }}
    header {{
      text-align: center;
      margin-bottom: 25px;
      max-width: 600px;
    }}
    .badge {{
      display: inline-block;
      background: rgba(79, 70, 229, 0.2);
      border: 1px solid rgba(79, 70, 229, 0.4);
      color: #818CF8;
      font-size: 12px;
      font-weight: 800;
      padding: 6px 16px;
      border-radius: 20px;
      margin-bottom: 12px;
      font-family: 'JetBrains Mono', monospace;
      letter-spacing: 0.05em;
    }}
    h1 {{
      font-size: 24px;
      font-weight: 800;
      line-height: 1.3;
      margin-bottom: 8px;
      color: #FFFFFF;
    }}
    .carousel-container {{
      width: 100%;
      max-width: 480px;
      aspect-ratio: 1080 / 1440;
      position: relative;
      overflow: hidden;
      border-radius: 28px;
      box-shadow: 0 30px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.1);
      background: #FFFFFF;
    }}
    .slides-wrapper {{
      display: flex;
      width: 100%;
      height: 100%;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      scrollbar-width: none;
    }}
    .slides-wrapper::-webkit-scrollbar {{ display: none; }}
    .slide {{
      flex: 0 0 100%;
      width: 100%;
      height: 100%;
      scroll-snap-align: start;
      position: relative;
    }}
    .slide img {{
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }}
    .slide-indicator {{
      position: absolute;
      top: 16px;
      right: 16px;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(8px);
      padding: 6px 14px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 800;
      font-family: 'JetBrains Mono', monospace;
      color: #B7FF3C;
      border: 1px solid rgba(255,255,255,0.1);
    }}
    .nav-hints {{
      margin-top: 15px;
      font-size: 14px;
      color: #94A3B8;
      display: flex;
      gap: 15px;
      align-items: center;
    }}
    .caption-box {{
      width: 100%;
      max-width: 480px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 18px;
      padding: 22px;
      margin-top: 25px;
      font-size: 14px;
      line-height: 1.6;
      color: #CBD5E1;
      white-space: pre-line;
    }}
    .caption-box h3 {{
      color: #FFFFFF;
      font-size: 15px;
      font-weight: 800;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }}
  </style>
</head>
<body>
  <header>
    <div class="badge">PEBAI SYSTEMS &bull; DESIGN VAULT 2026</div>
    <h1>{title}</h1>
  </header>

  <div class="carousel-container">
    <div class="slides-wrapper">
      {slides_markup}
    </div>
  </div>

  <div class="nav-hints">
    <span>&larr; Desliza horizontalmente para navegar entre diapositivas &rarr;</span>
  </div>

  <div class="caption-box">
    <h3>Pie de Foto Oficial (Copy + CTA):</h3>
    {caption}
  </div>
</body>
</html>
"""
    with open(os.path.join(folder_dir, "index.html"), "w", encoding="utf-8") as f:
        f.write(html)

async def main():
    print("=" * 70)
    print("PEBAI SYSTEMS — GENERADOR DE CARRUSELES A MEDIDA")
    print("Nuevo Sistema de Diseño: Daniel Brown + Steph + Zoout")
    print("Renderizado Playwright Edge Retina (1080x1440 @ 2x = 2160x2880)")
    print("=" * 70)

    render_tasks = []

    for item in CAROUSELS_CONFIG:
        c_id = item["id"]
        c_dir = os.path.join(OUTPUT_DIR, c_id)
        os.makedirs(c_dir, exist_ok=True)

        # Write caption
        with open(os.path.join(c_dir, "caption.txt"), "w", encoding="utf-8") as cf:
            cf.write(item["caption"].strip())

        # Render HTML slides via Jinja
        template = jinja_env.get_template(item["template"])
        for s_idx in range(1, item["total_slides"] + 1):
            html_out = os.path.join(c_dir, f"slide_{s_idx}.html")
            png_out = os.path.join(c_dir, f"slide_{s_idx}.png")

            rendered_html = template.render(
                slide_num=s_idx,
                total_slides=item["total_slides"],
                category_tag=item["category_tag"],
                pebai_logo_horizontal=PEBAI_LOGO_HORIZONTAL,
                pebai_logo_mark=PEBAI_LOGO_MARK,
                cover_3d_artwork=item["cover_artwork"],
                icons_dir=ICONS_DIR,
                logos=ALL_LOGOS
            )

            with open(html_out, "w", encoding="utf-8") as hf:
                hf.write(rendered_html)

            render_tasks.append((html_out, png_out))

        generate_mobile_viewer(c_dir, item["title"], item["total_slides"], item["caption"])
        print(f"[*] Preparadas 5 slides para '{c_id}'")

    print(f"\n[+] Total de slides a renderizar: {len(render_tasks)}")
    print("[+] Lanzando navegador Playwright (Edge)...")

    async with async_playwright() as p:
        browser = await p.chromium.launch(channel='msedge', headless=True)
        page = await browser.new_page(
            viewport={'width': 1080, 'height': 1440},
            device_scale_factor=2
        )

        for idx, (html_path, output_path) in enumerate(render_tasks, 1):
            abs_html = os.path.abspath(html_path).replace("\\", "/")
            abs_out = os.path.abspath(output_path)

            print(f"[{idx}/{len(render_tasks)}] Renderizando: {os.path.basename(os.path.dirname(abs_out))}/{os.path.basename(abs_out)}...")
            await page.goto(f"file:///{abs_html}")
            await page.wait_for_load_state('networkidle')
            await page.wait_for_timeout(1800)  # Wait for Google Fonts & SVGs
            await page.screenshot(path=abs_out)

        await browser.close()

    print("\n" + "=" * 70)
    print("RENDERIZADO COMPLETADO CON ÉXITO")
    print(f"Archivos exportados en: {OUTPUT_DIR}")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(main())
