#!/usr/bin/env python3
"""
PEBAI SYSTEMS - GENERADOR DE CARRUSELES A MEDIDA DE ALTA TECNOLOGÍA
Revisa Google Sheets, localiza las ideas marcadas como 'PUBLICAR' con HORA asignada,
diseña un carrusel a medida con nivel visual moderno (Dark Tech / Glassmorphism / Diagramas / Métricas),
renderiza las 5 diapositivas en alta resolución (1080x1440), genera el pie de foto
y adjunta los enlaces de descarga y el copy directamente en la fila del Google Sheet.
"""

import os
import sys
import json
import time
import argparse
from datetime import datetime
import urllib.request
import urllib.parse
from jinja2 import Template

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

SPANISH_MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

def get_current_month_name() -> str:
    now = datetime.now()
    return f"{SPANISH_MONTHS[now.month - 1]} {now.year}"

def query_approved_ideas(webhook_url: str, month: str) -> list:
    """Consulta las ideas aprobadas listas para producir."""
    import requests
    params = {"action": "get_approved", "month": month}
    r = requests.get(webhook_url, params=params, timeout=25)
    data = r.json()
    return data.get("approved", [])

def deliver_to_sheet(webhook_url: str, month: str, item_id: str, link_slides: str, copy_text: str):
    """Actualiza la fila en Google Sheets con el enlace de descarga y el copy."""
    import requests
    payload = {
        "action": "deliver_carousel",
        "month": month,
        "id": item_id,
        "link_slides": link_slides,
        "copy_text": copy_text,
        "estado": "LISTO"
    }
    r = requests.post(webhook_url, data=json.dumps(payload), timeout=25)
    return r.json()

def design_bespoke_carousel_content(idea: dict, api_key: str) -> dict:
    """Utiliza Gemini para planificar la narrativa y el diseño visual exacto de cada diapositiva."""
    prompt = f"""Eres el Director de Arte y Estratega Visual Senior de PEBAI Systems (consultora e ingeniería de IA y automatización para empresas).

MISION:
Diseñar el guion y la dirección de arte para un carrusel de 5 diapositivas en alta resolución (1080x1440) para Instagram y TikTok.
El diseño DEBE ser brutal, moderno, tecnológico y minimalista (estilo Dark Tech UI, Glassmorphism, Miro Architecture o Dashboard ROI).
ESTÁ ESTRICTAMENTE PROHIBIDO cualquier diseño de cuaderno, papel o bolígrafo.

IDEA APROBADA:
- ID: {idea.get('id')}
- Tipo: {idea.get('tipo')}
- Gancho Portada: {idea.get('gancho')}
- Desarrollo: {idea.get('desarrollo')}
- Formato Visual Guía: {idea.get('formato')}

ESTRUCTURA DE LAS 5 DIAPOSITIVAS:
Slide 1 (Portada): Gancho magnético masivo, número o contraste alto, tipografía imponente y badge de categoría.
Slide 2 (Problema / Radiografía): El dolor operativo o la fricción técnica explicada con datos reales (ej. 15h perdidas, demora de 2h).
Slide 3 (Demostración / Arquitectura): La revelación técnica o solución de PEBAI (diagrama de flujo conectado, tarjeta ROI o comparativa de software).
Slide 4 (Impacto / Transformación): Por qué esto cambia las reglas para una empresa y qué ventaja competitiva genera.
Slide 5 (Llamada a la Acción): Cierre de alta autoridad. Invitación a comentar 'CONSULTORIA' o enlace al diagnóstico técnico de 45 minutos a coste cero (limitado a 5 empresas al mes).

COPY DEL POST (PIE DE FOTO):
Un texto persuasivo de 120-180 palabras estructurado con:
- Gancho inicial en 1 línea.
- 3 puntos clave de valor con bullets limpios.
- Llamada a la acción clara: "Comenta CONSULTORIA y te enviamos el acceso para auditar tus procesos."
- 10 hashtags estratégicos (#InteligenciaArtificial #Automatizacion #ProductividadB2B #IngenieriaDeProcesos #PEBAISystems etc.).

Devuelve ÚNICAMENTE un JSON con esta estructura exacta:
{{
  "slides": [
    {{
      "number": 1,
      "tag": "RADAR TECNOLÓGICO",
      "headline": "Titular de portada potente",
      "subline": "Frase de apoyo corta",
      "accent_label": "01 / 05",
      "visual_mode": "dark_tech"
    }},
    {{
      "number": 2,
      "tag": "EL CUELLO DE BOTELLA",
      "headline": "Titular de la diapositiva",
      "bullet_points": ["Punto 1 con dato", "Punto 2 explicativo"],
      "metric_number": "15h",
      "metric_label": "Desperdicio semanal",
      "accent_label": "02 / 05"
    }},
    {{
      "number": 3,
      "tag": "ARQUITECTURA DE FLUJO",
      "headline": "La solución conectada",
      "flow_steps": [
        {{"from": "Entrada manual", "to": "Demora 2h", "status": "Antes"}},
        {{"from": "Agente PEBAI", "to": "<60 segundos", "status": "Optimizado"}}
      ],
      "accent_label": "03 / 05"
    }},
    {{
      "number": 4,
      "tag": "VENTAJA COMPETITIVA",
      "headline": "El resultado en tu cuenta de resultados",
      "bullet_points": ["Liberación de nóminas mecánicas", "Atención comercial 24/7 sin bajas"],
      "accent_label": "04 / 05"
    }},
    {{
      "number": 5,
      "tag": "DIAGNÓSTICO ESTRATÉGICO",
      "headline": "Audita tus procesos a coste cero",
      "cta_text": "Comenta CONSULTORIA",
      "details": "Sesión técnica privada de 45 minutos con nuestros ingenieros. Plazas limitadas a 5 empresas al mes.",
      "accent_label": "05 / 05"
    }}
  ],
  "caption": "Texto completo del pie de foto con llamada a la acción y hashtags"
}}
"""

    models_to_try = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite"]
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.3}
    }

    for model in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=35) as res:
                data = json.loads(res.read().decode("utf-8"))
            text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
            if "```json" in text:
                text = text.split("```json", 1)[1].split("```", 1)[0]
            elif "```" in text:
                text = text.split("```", 1)[1].split("```", 1)[0]
            return json.loads(text.strip())
        except Exception as e:
            print(f"[AVISO] Fallo modelo {model}: {e}")
            time.sleep(2)

    raise ValueError("No se pudo generar el guion visual con Gemini")

# Plantilla HTML maestra con CSS ultra moderno (Dark Tech / Glassmorphism / Neumorfismo sutil)
HTML_SLIDE_TEMPLATE = """
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1080px;
      height: 1440px;
      background: #0A0D14;
      color: #F0F4F8;
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 70px 75px;
      -webkit-font-smoothing: antialiased;
    }

    /* Fondo tecnologico con micro-cuadricula y resplandor sutil */
    body::before {
      content: "";
      position: absolute;
      inset: 0;
      background-image: 
        radial-gradient(circle at 80% 15%, rgba(0, 210, 255, 0.08) 0%, transparent 45%),
        radial-gradient(circle at 20% 85%, rgba(79, 70, 229, 0.08) 0%, transparent 45%),
        linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
      background-size: 100% 100%, 100% 100%, 40px 40px, 40px 40px;
      pointer-events: none;
      z-index: 1;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      z-index: 2;
    }
    .badge-tag {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 10px 18px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 100px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #00D2FF;
    }
    .badge-tag::before {
      content: "";
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #00D2FF;
      box-shadow: 0 0 10px #00D2FF;
    }
    .page-indicator {
      font-family: 'JetBrains Mono', monospace;
      font-size: 16px;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.4);
      letter-spacing: 0.08em;
    }

    /* Main Content */
    .content {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      gap: 32px;
      margin: auto 0;
    }

    .main-headline {
      font-size: 54px;
      font-weight: 800;
      line-height: 1.15;
      letter-spacing: -0.03em;
      color: #FFFFFF;
    }
    .main-headline span {
      background: linear-gradient(135deg, #00D2FF 0%, #3B82F6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .subline {
      font-size: 24px;
      line-height: 1.45;
      color: #94A3B8;
      font-weight: 500;
      max-width: 900px;
    }

    /* Cards and Glassmorphism Containers */
    .glass-card {
      background: rgba(18, 24, 38, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 24px;
      padding: 36px 40px;
      backdrop-filter: blur(20px);
      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.5);
    }

    .bullet-item {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      font-size: 24px;
      line-height: 1.4;
      color: #CBD5E1;
      margin-bottom: 20px;
    }
    .bullet-item:last-child { margin-bottom: 0; }
    .bullet-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #00D2FF;
      margin-top: 12px;
      flex-shrink: 0;
      box-shadow: 0 0 12px rgba(0, 210, 255, 0.8);
    }

    /* Metric Card */
    .metric-box {
      display: flex;
      align-items: center;
      gap: 28px;
      margin-top: 24px;
      padding: 24px 32px;
      background: rgba(0, 210, 255, 0.05);
      border: 1px solid rgba(0, 210, 255, 0.2);
      border-radius: 20px;
    }
    .metric-value {
      font-size: 52px;
      font-weight: 800;
      font-family: 'JetBrains Mono', monospace;
      color: #00D2FF;
    }
    .metric-text {
      font-size: 20px;
      color: #E2E8F0;
      font-weight: 600;
      line-height: 1.3;
    }

    /* Flow Steps */
    .flow-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 16px;
      margin-bottom: 14px;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }
    .flow-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      font-weight: 700;
      padding: 6px 12px;
      border-radius: 6px;
      text-transform: uppercase;
    }
    .tag-before { background: rgba(239, 68, 68, 0.15); color: #F87171; border: 1px solid rgba(239, 68, 68, 0.3); }
    .tag-after { background: rgba(34, 197, 94, 0.15); color: #4ADE80; border: 1px solid rgba(34, 197, 94, 0.3); }

    /* CTA Slide */
    .cta-box {
      text-align: center;
      padding: 50px 40px;
    }
    .cta-button {
      display: inline-block;
      margin: 28px 0;
      padding: 22px 50px;
      background: linear-gradient(135deg, #00D2FF 0%, #3B82F6 100%);
      color: #0B0F17;
      font-size: 28px;
      font-weight: 800;
      border-radius: 100px;
      letter-spacing: -0.01em;
      box-shadow: 0 10px 30px rgba(0, 210, 255, 0.4);
    }

    /* Footer */
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 30px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      position: relative;
      z-index: 2;
    }
    .brand-mark {
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 800;
      font-size: 20px;
      letter-spacing: 0.05em;
      color: #FFFFFF;
    }
    .brand-mark span { color: #00D2FF; }
    .footer-note {
      font-size: 15px;
      color: #64748B;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="badge-tag">{{ slide.tag|default("PEBAI SYSTEMS") }}</div>
    <div class="page-indicator">{{ slide.accent_label|default("01 / 05") }}</div>
  </div>

  <div class="content">
    <h1 class="main-headline">{{ slide.headline }}</h1>
    
    {% if slide.subline %}
      <p class="subline">{{ slide.subline }}</p>
    {% endif %}

    {% if slide.bullet_points %}
      <div class="glass-card">
        {% for bp in slide.bullet_points %}
          <div class="bullet-item">
            <div class="bullet-dot"></div>
            <div>{{ bp }}</div>
          </div>
        {% endfor %}
      </div>
    {% endif %}

    {% if slide.metric_number %}
      <div class="metric-box">
        <div class="metric-value">{{ slide.metric_number }}</div>
        <div class="metric-text">{{ slide.metric_label }}</div>
      </div>
    {% endif %}

    {% if slide.flow_steps %}
      <div class="glass-card">
        {% for step in slide.flow_steps %}
          <div class="flow-row">
            <span style="font-size: 20px; font-weight: 600;">{{ step.from }} &rarr; {{ step.to }}</span>
            <span class="flow-tag {% if 'Optimizado' in step.status or 'Despu' in step.status %}tag-after{% else %}tag-before{% endif %}">{{ step.status }}</span>
          </div>
        {% endfor %}
      </div>
    {% endif %}

    {% if slide.cta_text %}
      <div class="glass-card cta-box">
        <div style="font-size: 20px; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700;">ACCESO EXCLUSIVO</div>
        <div class="cta-button">{{ slide.cta_text }}</div>
        <p style="font-size: 19px; color: #CBD5E1; line-height: 1.4;">{{ slide.details }}</p>
      </div>
    {% endif %}
  </div>

  <div class="footer">
    <div class="brand-mark">PEBAI <span>SYSTEMS</span></div>
    <div class="footer-note">Ingeniería de Procesos e IA</div>
  </div>
</body>
</html>
"""

def generate_carousel_bundle(idea: dict, api_key: str) -> dict:
    """Diseña y renderiza las 5 diapositivas y el pie de foto."""
    from renderer import render_slides
    
    item_id = idea.get("id", f"RAD-{int(time.time())}")
    target_folder = os.path.join(OUTPUT_DIR, item_id)
    html_folder = os.path.join(target_folder, "html")
    os.makedirs(html_folder, exist_ok=True)
    
    print(f"\n[DISEÑO] Planificando carrusel a medida para ID: {item_id}...")
    specs = design_bespoke_carousel_content(idea, api_key)
    slides = specs.get("slides", [])
    caption = specs.get("caption", "")
    
    template = Template(HTML_SLIDE_TEMPLATE)
    tasks = []
    png_paths = []
    
    for slide in slides:
        num = slide.get("number", 1)
        html_content = template.render(slide=slide)
        html_file = os.path.join(html_folder, f"slide_{num}.html")
        png_file = os.path.join(target_folder, f"slide_{num}.png")
        
        with open(html_file, "w", encoding="utf-8") as f:
            f.write(html_content)
            
        tasks.append((html_file, png_file))
        png_paths.append(png_file)
        
    print(f"[RENDER] Generando {len(tasks)} diapositivas en alta resolución (1080x1440)...")
    render_slides(tasks)
    
    # Guardar copy
    caption_path = os.path.join(target_folder, "caption.txt")
    with open(caption_path, "w", encoding="utf-8") as f:
        f.write(caption)
        
    # Crear un visor HTML ligero para descargar todo desde el móvil en 1 clic
    viewer_path = os.path.join(target_folder, "index.html")
    with open(viewer_path, "w", encoding="utf-8") as f:
        f.write(f"""<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
        <title>{idea.get('gancho')} - PEBAI</title>
        <style>body{{font-family:-apple-system,sans-serif;background:#0B0F17;color:#fff;padding:20px;text-align:center}}
        img{{width:100%;max-width:450px;border-radius:14px;margin-bottom:15px;box-shadow:0 10px 30px rgba(0,0,0,0.5)}}
        .btn{{background:#00D2FF;color:#000;font-weight:700;padding:12px 24px;border-radius:30px;text-decoration:none;display:inline-block;margin:10px}}
        pre{{background:#1A2530;padding:15px;border-radius:10px;text-align:left;white-space:pre-wrap;font-size:14px;color:#CBD5E1}}
        </style></head><body>
        <h2>{idea.get('gancho')}</h2>
        <p style="color:#94A3B8">Diapositivas listas para publicar (Guárdalas en tu carrete en orden 1 a 5):</p>
        {''.join([f'<p><img src="slide_{i}.png"><br><a class="btn" href="slide_{i}.png" download>Descargar Slide {i}</a></p>' for i in range(1, len(slides)+1)])}
        <h3>Pie de foto (Copy listo para copiar):</h3>
        <pre>{caption}</pre>
        </body></html>""")
        
    return {
        "folder": target_folder,
        "pngs": png_paths,
        "caption": caption
    }

def main():
    parser = argparse.ArgumentParser(description="Constructor de carruseles a medida para PEBAI Systems")
    parser.add_argument("--month", type=str, default=None)
    parser.add_argument("--id", type=str, default=None, help="ID específico a generar")
    args = parser.parse_args()

    month = args.month or get_current_month_name()
    webhook_url = os.environ.get("GSHEET_WEBHOOK_URL")
    api_key = os.environ.get("GEMINI_API_KEY")

    if not api_key:
        local_env = os.path.abspath(os.path.join(BASE_DIR, "..", "whatsapp-outreach-bot", ".env"))
        if os.path.exists(local_env):
            with open(local_env, "r", encoding="utf-8") as f:
                for line in f:
                    if line.startswith("GEMINI_API_KEY="):
                        api_key = line.strip().split("=", 1)[1]
                        break

    if not webhook_url or not api_key:
        print("[ERROR] GSHEET_WEBHOOK_URL y GEMINI_API_KEY son requeridos.")
        sys.exit(1)

    print("=======================================================")
    print("[PEBAI SYSTEMS] MOTOR PRODUCTOR DE CARRUSELES A MEDIDA")
    print("=======================================================")
    print(f"Pestaña analizada: {month}")

    approved = query_approved_ideas(webhook_url, month)
    if not approved:
        print("No hay carruseles con estado PUBLICAR y HORA asignada pendientes de procesar.")
        return

    print(f"Carruseles aprobados encontrados: {len(approved)}")
    for item in approved:
        if args.id and item.get("id") != args.id:
            continue
            
        print(f"\n>>> Procesando ID: {item.get('id')} - {item.get('gancho')}")
        bundle = generate_carousel_bundle(item, api_key)
        
        # Link de GitHub para acceder a la carpeta desde el móvil
        github_link = f"https://github.com/miempresaonline/pebaisystems/tree/main/carousel-engine/output/{item.get('id')}"
        
        print("[ENTREGA] Vinculando diapositivas y copy en la fila del Google Sheet...")
        res = deliver_to_sheet(
            webhook_url=webhook_url,
            month=month,
            item_id=item.get("id"),
            link_slides=github_link,
            copy_text=bundle.get("caption")
        )
        print(f"[OK] Fila actualizada con éxito en Google Sheets: {res}")

if __name__ == "__main__":
    main()
