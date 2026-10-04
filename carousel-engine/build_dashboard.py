import os
import sys
import json
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from content_calendar import FULL_14_DAY_CALENDAR

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, "output")
DASHBOARD_PATH = os.path.join(BASE_DIR, "dashboard.html")

def build_dashboard():
    days_data = []
    for item in FULL_14_DAY_CALENDAR:
        day_id = item["id"]
        day_dir = os.path.join(OUTPUT_DIR, day_id)
        
        # Check slides
        slides = []
        for i in range(1, 10):
            slide_file = os.path.join(day_dir, f"slide_{i}.png")
            if os.path.exists(slide_file):
                slides.append(f"output/{day_id}/slide_{i}.png")
            else:
                break
        
        # If not generated yet, provide placeholder or path
        if not slides:
            slides = [f"output/{day_id}/slide_1.png"]

        # Caption
        caption_file = os.path.join(day_dir, "caption.txt")
        if os.path.exists(caption_file):
            with open(caption_file, "r", encoding="utf-8") as f:
                caption = f.read().strip()
        else:
            caption = item.get("caption", "").strip()

        days_data.append({
            "day": item["day"],
            "id": day_id,
            "stage": item.get("stage", "TOFU"),
            "topic": item.get("topic", ""),
            "keyword": item.get("keyword", "CONSULTORÍA"),
            "type": item.get("type", "fb_pillars"),
            "slides": slides,
            "caption": caption
        })

    days_json = json.dumps(days_data, ensure_ascii=False)

    html_content = f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>PEBAI Systems — Centro de Control y Producción de Carruseles B2B</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&family=Patrick+Hand&display=swap" rel="stylesheet">
  <style>
    :root {{
      --bg: #0C0D12;
      --surface: #141722;
      --card: #1A1E2E;
      --line: #262B3F;
      --fg: #F1F0ED;
      --muted: #94A3B8;
      --accent: #B7FF3C;
      --violet: #6A5CFF;
      --danger: #EF4444;
      --border-radius: 16px;
    }}

    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }}

    body {{
      background-color: var(--bg);
      color: var(--fg);
      font-family: 'Manrope', sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }}

    header {{
      background: var(--surface);
      border-bottom: 1px solid var(--line);
      padding: 16px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 100;
    }}

    .brand-section {{
      display: flex;
      align-items: center;
      gap: 16px;
    }}

    .brand-logo-img {{
      width: 38px;
      height: 38px;
      object-fit: contain;
    }}

    .brand-titles h1 {{
      font-size: 19px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }}

    .brand-titles span {{
      font-size: 11px;
      letter-spacing: 0.08em;
      color: var(--accent);
      text-transform: uppercase;
      font-weight: 700;
    }}

    .nav-tabs {{
      display: flex;
      gap: 6px;
      background: var(--bg);
      padding: 5px;
      border-radius: 12px;
      border: 1px solid var(--line);
    }}

    .tab-btn {{
      background: transparent;
      border: none;
      color: var(--muted);
      font-family: inherit;
      font-size: 13px;
      font-weight: 600;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }}

    .tab-btn:hover {{
      color: var(--fg);
    }}

    .tab-btn.active {{
      background: var(--card);
      color: var(--accent);
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    }}

    .header-actions {{
      display: flex;
      align-items: center;
      gap: 14px;
    }}

    .status-badge {{
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      font-weight: 600;
      color: var(--accent);
      background: rgba(183, 255, 60, 0.08);
      border: 1px solid rgba(183, 255, 60, 0.25);
      padding: 7px 14px;
      border-radius: 20px;
    }}

    .status-pulse {{
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 10px var(--accent);
    }}

    main {{
      padding: 32px 40px;
      flex: 1;
      max-width: 1750px;
      margin: 0 auto;
      width: 100%;
    }}

    .tab-pane {{
      display: none;
    }}

    .tab-pane.active {{
      display: block;
      animation: fadeIn 0.2s ease;
    }}

    @keyframes fadeIn {{
      from {{ opacity: 0; transform: translateY(4px); }}
      to {{ opacity: 1; transform: translateY(0); }}
    }}

    /* Subheader & Filters */
    .section-header {{
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }}

    .section-title h2 {{
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }}

    .section-title p {{
      color: var(--muted);
      font-size: 14px;
      margin-top: 4px;
    }}

    .filters-bar {{
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }}

    .filter-btn {{
      background: var(--surface);
      border: 1px solid var(--line);
      color: var(--muted);
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }}

    .filter-btn:hover, .filter-btn.active {{
      border-color: var(--accent);
      color: var(--accent);
      background: rgba(183, 255, 60, 0.06);
    }}

    /* Day Carousel Grid */
    .calendar-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(480px, 1fr));
      gap: 28px;
    }}

    .day-card {{
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: var(--border-radius);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: border-color 0.2s, transform 0.2s;
    }}

    .day-card:hover {{
      border-color: rgba(183, 255, 60, 0.4);
      transform: translateY(-2px);
    }}

    .card-top {{
      padding: 18px 22px;
      border-bottom: 1px solid var(--line);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255,255,255,0.01);
    }}

    .day-meta {{
      display: flex;
      align-items: center;
      gap: 10px;
    }}

    .day-num {{
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      font-weight: 800;
      color: #12121A;
      background: var(--accent);
      padding: 4px 10px;
      border-radius: 6px;
      letter-spacing: -0.02em;
    }}

    .stage-badge {{
      font-size: 11px;
      font-weight: 700;
      color: var(--violet);
      background: rgba(106, 92, 255, 0.12);
      border: 1px solid rgba(106, 92, 255, 0.3);
      padding: 3px 8px;
      border-radius: 6px;
      text-transform: uppercase;
    }}

    .keyword-badge {{
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 700;
      color: var(--accent);
      background: var(--card);
      border: 1px solid var(--line);
      padding: 4px 10px;
      border-radius: 6px;
    }}

    .card-title-row {{
      padding: 16px 22px 10px;
    }}

    .card-title-row h3 {{
      font-size: 17px;
      font-weight: 700;
      letter-spacing: -0.01em;
      color: var(--fg);
    }}

    .format-subtitle {{
      font-size: 12px;
      color: var(--muted);
      margin-top: 2px;
    }}

    /* Preview area */
    .preview-box {{
      background: #08080C;
      padding: 18px;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
    }}

    .slide-viewport {{
      width: 100%;
      max-width: 380px;
      aspect-ratio: 3 / 4;
      border-radius: 10px;
      overflow: hidden;
      background: #111;
      box-shadow: 0 10px 30px rgba(0,0,0,0.7);
      position: relative;
      cursor: pointer;
    }}

    .slide-viewport img {{
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.2s ease;
    }}

    .slide-viewport:hover img {{
      transform: scale(1.02);
    }}

    .slide-switcher {{
      display: flex;
      gap: 8px;
      margin-top: 12px;
      justify-content: center;
    }}

    .switcher-btn {{
      background: var(--card);
      border: 1px solid var(--line);
      color: var(--muted);
      font-size: 11px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;
    }}

    .switcher-btn.active {{
      background: var(--accent);
      color: #12121A;
      border-color: var(--accent);
    }}

    /* Caption & Actions */
    .card-bottom {{
      padding: 20px 22px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      flex: 1;
    }}

    .caption-box {{
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 12px 14px;
      font-size: 12px;
      line-height: 1.6;
      color: var(--muted);
      max-height: 105px;
      overflow-y: auto;
      white-space: pre-wrap;
      font-family: inherit;
    }}

    .caption-box strong {{
      color: var(--fg);
    }}

    .btn-row {{
      display: flex;
      gap: 10px;
    }}

    .btn-copy {{
      flex: 1;
      background: var(--accent);
      color: #12121A;
      border: none;
      padding: 11px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.15s;
    }}

    .btn-copy:hover {{
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(183, 255, 60, 0.25);
    }}

    .btn-copy.copied {{
      background: #10B981;
      color: #FFFFFF;
    }}

    .btn-view {{
      background: var(--card);
      color: var(--fg);
      border: 1px solid var(--line);
      padding: 11px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
      text-decoration: none;
      display: flex;
      align-items: center;
      justify-content: center;
    }}

    .btn-view:hover {{
      background: var(--line);
    }}

    /* Lightbox Modal */
    .modal-overlay {{
      display: none;
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.88);
      backdrop-filter: blur(8px);
      z-index: 1000;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }}

    .modal-overlay.open {{
      display: flex;
    }}

    .modal-content {{
      max-height: 94vh;
      max-width: 90vw;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.8);
      position: relative;
    }}

    .modal-content img {{
      max-height: 88vh;
      max-width: 88vw;
      object-fit: contain;
      display: block;
    }}

    .modal-close {{
      position: absolute;
      top: 14px;
      right: 14px;
      background: rgba(0,0,0,0.6);
      color: #FFF;
      border: 1px solid rgba(255,255,255,0.2);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
    }}

    /* Format Cards Grid for Tab 2 */
    .formats-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(390px, 1fr));
      gap: 32px;
    }}

    .format-card {{
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 18px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: border-color 0.2s ease;
    }}

    .format-card:hover {{
      border-color: rgba(183, 255, 60, 0.4);
    }}

    .card-head {{
      padding: 20px 24px;
      border-bottom: 1px solid var(--line);
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }}

    .format-badge {{
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 6px;
      display: inline-block;
    }}

    .card-head h2 {{
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }}

    .viewer-box {{
      background: #000000;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }}

    .slide-frame {{
      width: 100%;
      max-width: 400px;
      aspect-ratio: 3 / 4;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 12px 36px rgba(0,0,0,0.6);
      background: #111;
      display: flex;
      align-items: center;
      justify-content: center;
    }}

    .slide-frame img {{
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }}

    .card-body {{
      padding: 22px 24px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      flex: 1;
      justify-content: space-between;
    }}

    .desc-text {{
      font-size: 13px;
      line-height: 1.6;
      color: var(--muted);
    }}

    .angles-row {{
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-top: 20px;
    }}

    .angle-card {{
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }}

    .angle-card img {{
      width: 100%;
      aspect-ratio: 3 / 4;
      border-radius: 8px;
      object-fit: cover;
    }}

    .angle-card span {{
      font-size: 13px;
      font-weight: 700;
      color: var(--fg);
    }}
  </style>
</head>
<body>

  <header>
    <div class="brand-section">
      <img class="brand-logo-img" src="../website-pebai/dist/brand/pebai-logo-03-master-transparent-v1.png" alt="PEBAI Logo">
      <div class="brand-titles">
        <h1>PEBAI Systems</h1>
        <span>Estudio de Diseño Viral B2B · Generador de Carruseles</span>
      </div>
    </div>

    <nav class="nav-tabs">
      <button class="tab-btn active" onclick="switchTab('daily-schedule', this)">
        <span>Secuencia Diaria (14 Días)</span>
      </button>
      <button class="tab-btn" onclick="switchTab('fontbravo', this)">
        <span>Formatos Visuales B2B</span>
      </button>
      <button class="tab-btn" onclick="switchTab('notebook', this)">
        <span>Libreta Real (Boli Bic 0.7mm)</span>
      </button>
      <button class="tab-btn" onclick="switchTab('icons', this)">
        <span>Iconoteca SVG</span>
      </button>
    </nav>

    <div class="header-actions">
      <div class="status-badge">
        <div class="status-pulse"></div>
        <span>100% Visual · Cero Textos Densos</span>
      </div>
    </div>
  </header>

  <main>

    <!-- TAB 1: CALENDARIO DIARIO (14 DÍAS) -->
    <div id="tab-daily-schedule" class="tab-pane active">
      <div class="section-header">
        <div class="section-title">
          <h2>Secuencia Editorial Diaria — 14 Días Listos para Publicar</h2>
          <p>Revisa cada carrusel generado, copia el copy oficial con 1 clic y publica en TikTok e Instagram.</p>
        </div>
        <div class="filters-bar">
          <span style="font-size: 12px; color: var(--muted); font-weight: 600;">Filtrar por Etapa:</span>
          <button class="filter-btn active" onclick="filterStage('ALL', this)">Todos (14)</button>
          <button class="filter-btn" onclick="filterStage('TOFU', this)">TOFU (Atracción)</button>
          <button class="filter-btn" onclick="filterStage('MOFU', this)">MOFU (Educación)</button>
          <button class="filter-btn" onclick="filterStage('BOFU', this)">BOFU (Conversión)</button>
        </div>
      </div>

      <div class="calendar-grid" id="calendarGrid">
        <!-- Rendered dynamically by JS -->
      </div>
    </div>

    <!-- TAB 2: LOS 5 FORMATOS VISUALES FONTBRAVO -->
    <div id="tab-fontbravo" class="tab-pane">
      <div style="margin-bottom: 28px;">
        <h2 style="font-size: 26px; font-weight: 800; letter-spacing: -0.02em;">Variantes Visuales en el Estilo FontBravo</h2>
        <p style="color: var(--muted); font-size: 14px; margin-top: 4px;">Cero parrafadas de texto; puro impacto visual, contraste limpio y representación instantánea para TikTok e Instagram.</p>
      </div>

      <div class="formats-grid">
        <!-- Formato 1: Workflow Pipeline -->
        <article class="format-card">
          <div class="card-head">
            <div>
              <span class="format-badge">Formato A · Workflow Pipeline</span>
              <h2>Flujo de Atención Autónomo</h2>
            </div>
            <span class="keyword-badge">CTA: RESPUESTA</span>
          </div>
          <div class="viewer-box">
            <div class="slide-frame">
              <img src="output/day_03_pipeline_21h/slide_1.png" alt="Workflow Pipeline">
            </div>
          </div>
          <div class="card-body">
            <p class="desc-text"><strong>Idea:</strong> Enseña la secuencia exacta del cliente desde WhatsApp al CRM. La tarjeta central oscura con la insignia PEBAI y el badge verde de 12 segundos genera retención inmediata.</p>
          </div>
        </article>

        <!-- Formato 2: Speed Benchmark -->
        <article class="format-card">
          <div class="card-head">
            <div>
              <span class="format-badge">Formato B · Speed Benchmark</span>
              <h2>Velocímetro de Respuesta</h2>
            </div>
            <span class="keyword-badge">CTA: RESPUESTA</span>
          </div>
          <div class="viewer-box">
            <div class="slide-frame">
              <img src="output/day_02_empresas_rapidas/slide_1.png" alt="Speed Benchmark">
            </div>
          </div>
          <div class="card-body">
            <p class="desc-text"><strong>Idea:</strong> Comparativa horizontal de tiempos: 14 Horas (buzón) vs 4 Horas (secretaria) vs 12 Segundos (Agente IA PEBAI). Apela directamente a la urgencia comercial.</p>
          </div>
        </article>

        <!-- Formato 3: Split 50/50 -->
        <article class="format-card">
          <div class="card-head">
            <div>
              <span class="format-badge">Formato C · Split 50/50</span>
              <h2>Manual vs Sistema PEBAI</h2>
            </div>
            <span class="keyword-badge">CTA: CONSULTORÍA</span>
          </div>
          <div class="viewer-box">
            <div class="slide-frame">
              <img src="output/day_04_split_manual_vs_pebai/slide_1.png" alt="Split Contrast">
            </div>
          </div>
          <div class="card-body">
            <p class="desc-text"><strong>Idea:</strong> Dos tarjetas verticales enfrentadas. Lado izquierdo con cruces rojas (el dolor manual de la competencia) vs lado derecho negro con borde lima y checks (el agente PEBAI).</p>
          </div>
        </article>

        <!-- Formato 4: Growth Formula -->
        <article class="format-card">
          <div class="card-head">
            <div>
              <span class="format-badge">Formato D · Ecuación Visual</span>
              <h2>Fórmula de Escalabilidad</h2>
            </div>
            <span class="keyword-badge">CTA: CRECIMIENTO</span>
          </div>
          <div class="viewer-box">
            <div class="slide-frame">
              <img src="output/day_05_ecuacion_escalabilidad/slide_1.png" alt="Growth Formula">
            </div>
          </div>
          <div class="card-body">
            <p class="desc-text"><strong>Idea:</strong> [Agente de Voz] + [Pipeline n8n] = [+35% Clientes Cerrados]. Una ecuación matemática simple e intuitiva que cualquier dueño de empresa entiende en 1 segundo.</p>
          </div>
        </article>

        <!-- Formato 5: Arched Pillars V3 -->
        <article class="format-card">
          <div class="card-head">
            <div>
              <span class="format-badge">Formato E · Ranking Clásico</span>
              <h2>Pilares en Arco V3</h2>
            </div>
            <span class="keyword-badge">CTA: CONSULTORÍA</span>
          </div>
          <div class="viewer-box">
            <div class="slide-frame">
              <img src="output/day_01_consultoria_gratuita/slide_1.png" alt="Arched Pillars V3">
            </div>
          </div>
          <div class="card-body">
            <p class="desc-text"><strong>Idea:</strong> El diseño original de FontBravo perfeccionado con la cápsula oscura de contraste para el logo oficial de PEBAI y vectores geométricos limpios sin imperfecciones.</p>
          </div>
        </article>
      </div>
    </div>

    <!-- TAB 3: LIBRETA REAL Y ÁNGULOS -->
    <div id="tab-notebook" class="tab-pane">
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 26px; font-weight: 800; letter-spacing: -0.02em;">Libreta Real · Límites 100% en Papel & Tinta Real</h2>
        <p style="color: var(--muted); font-size: 14px; margin-top: 4px;">Se han corregido los límites: cero textos en la mesa ni espirales. Se han generado 3 fotografías reales sobre la misma madera para alternar ángulos.</p>
      </div>

      <div style="display: flex; gap: 32px; align-items: flex-start; margin-bottom: 36px; flex-wrap: wrap;">
        <div class="slide-frame" style="max-width: 440px;">
          <img src="output/day_06_fugas_libreta_real/slide_1.png" alt="Libreta Corregida">
        </div>
        <div style="flex: 1; display: flex; flex-direction: column; gap: 16px; min-width: 320px;">
          <div style="background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 24px;">
            <h3 style="font-size: 20px; font-weight: 700; color: var(--accent); margin-bottom: 12px;">✓ Perfeccionamiento de la Libreta Real:</h3>
            <ul style="color: var(--muted); font-size: 14px; line-height: 1.8; margin-left: 20px;">
              <li><strong>Cero texto fuera de la hoja:</strong> Todo el contenido queda enmarcado estrictamente dentro de los márgenes de la libreta. La mesa de madera y las espirales quedan totalmente limpias.</li>
              <li><strong>Filtro de física de tinta:</strong> Aplicación de micro-rugosidad SVG (#pen-roughness con feTurbulence y feDisplacementMap) para que las letras no tengan bordes sintéticos de ordenador.</li>
              <li><strong>Alternancia de 3 fotografías reales:</strong> Permite rotar el ángulo y la página en cada carrusel para que la audiencia nunca perciba repetición visual.</li>
            </ul>
          </div>
        </div>
      </div>

      <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 14px;">Galería de 3 Fotografías Reales para Alternar Ángulos:</h3>
      <div class="angles-row">
        <div class="angle-card">
          <img src="assets/real_notebook_bg_1.jpg" alt="Ángulo 1">
          <span>Ángulo 1: Página inicial con arrugas y espiral</span>
        </div>
        <div class="angle-card">
          <img src="assets/real_notebook_bg_2.jpg" alt="Ángulo 2">
          <span>Ángulo 2: Rotación sutil y textura diferente</span>
        </div>
        <div class="angle-card">
          <img src="assets/real_notebook_bg_3.jpg" alt="Ángulo 3">
          <span>Ángulo 3: Libreta abierta con luz natural</span>
        </div>
      </div>
    </div>

    <!-- TAB 4: ICONS -->
    <div id="tab-icons" class="tab-pane">
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 24px; font-weight: 800;">Librería de Iconos Vectoriales Retina</h2>
        <p style="color: var(--muted); font-size: 14px; margin-top: 4px;">Iconos vectoriales ultra-limpios diseñados para renderizado en 4K.</p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 16px;">
        <div class="angle-card" style="padding: 24px 12px;"><span style="font-weight: 800; color: #B7FF3C;">WA</span><span>WhatsApp</span></div>
        <div class="angle-card" style="padding: 24px 12px;"><span style="font-weight: 800; color: #594AF7;">TEL</span><span>Teléfono</span></div>
        <div class="angle-card" style="padding: 24px 12px;"><span style="font-weight: 800; color: #B7FF3C;">VOZ</span><span>Headset</span></div>
        <div class="angle-card" style="padding: 24px 12px;"><span style="font-weight: 800; color: #594AF7;">CAL</span><span>Calendar</span></div>
        <div class="angle-card" style="padding: 24px 12px;"><span style="font-weight: 800; color: #B7FF3C;">N8N</span><span>Pipeline</span></div>
        <div class="angle-card" style="padding: 24px 12px;"><span style="font-weight: 800; color: #594AF7;">BOT</span><span>Agente IA</span></div>
        <div class="angle-card" style="padding: 24px 12px;"><span style="font-weight: 800; color: #B7FF3C;">RAG</span><span>Database</span></div>
        <div class="angle-card" style="padding: 24px 12px;"><span style="font-weight: 800; color: #594AF7;">SPD</span><span>Velocímetro</span></div>
      </div>
    </div>

  </main>

  <!-- LIGHTBOX MODAL -->
  <div id="lightboxModal" class="modal-overlay" onclick="closeLightbox(event)">
    <div class="modal-content" onclick="event.stopPropagation()">
      <button class="modal-close" onclick="closeLightbox()">&times;</button>
      <img id="lightboxImg" src="" alt="Ampliación">
    </div>
  </div>

  <script>
    const DAYS_DATA = {days_json};

    function switchTab(tabId, btn) {{
      document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
      
      document.getElementById('tab-' + tabId).classList.add('active');
      if (btn) btn.classList.add('active');
    }}

    function openLightbox(src) {{
      const modal = document.getElementById('lightboxModal');
      const img = document.getElementById('lightboxImg');
      img.src = src;
      modal.classList.add('open');
    }}

    function closeLightbox() {{
      document.getElementById('lightboxModal').classList.remove('open');
    }}

    function copyCaption(text, btn) {{
      navigator.clipboard.writeText(text).then(() => {{
        const orig = btn.innerHTML;
        btn.classList.add('copied');
        btn.innerHTML = '✓ ¡Copiado!';
        setTimeout(() => {{
          btn.classList.remove('copied');
          btn.innerHTML = orig;
        }}, 2000);
      }}).catch(err => {{
        alert('Error al copiar: ' + err);
      }});
    }}

    function changeSlide(cardId, slideSrc, btn) {{
      const card = document.getElementById(cardId);
      const img = card.querySelector('.slide-viewport img');
      img.src = slideSrc;
      card.querySelectorAll('.switcher-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }}

    function filterStage(stage, btn) {{
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderCards(stage);
    }}

    function renderCards(stageFilter = 'ALL') {{
      const grid = document.getElementById('calendarGrid');
      grid.innerHTML = '';

      const filtered = stageFilter === 'ALL' 
        ? DAYS_DATA 
        : DAYS_DATA.filter(d => d.stage === stageFilter);

      filtered.forEach(item => {{
        const cardId = 'card-day-' + item.day;
        const totalSlides = item.slides.length;
        
        let switcherHtml = '';
        if (totalSlides > 1) {{
          switcherHtml = '<div class="slide-switcher">';
          item.slides.forEach((s, idx) => {{
            const act = idx === 0 ? 'active' : '';
            switcherHtml += `<button class="switcher-btn ${{act}}" onclick="changeSlide('${{cardId}}', '${{s}}', this)">Slide ${{idx + 1}}</button>`;
          }});
          switcherHtml += '</div>';
        }}

        const card = document.createElement('article');
        card.className = 'day-card';
        card.id = cardId;
        card.innerHTML = `
          <div class="card-top">
            <div class="day-meta">
              <span class="day-num">DÍA ${{String(item.day).padStart(2, '0')}}</span>
              <span class="stage-badge">${{item.stage}}</span>
            </div>
            <span class="keyword-badge">CTA: ${{item.keyword}}</span>
          </div>

          <div class="card-title-row">
            <h3>${{item.topic}}</h3>
            <div class="format-subtitle">${{item.type.toUpperCase()}} · ${{totalSlides}} Diapositiva${{totalSlides > 1 ? 's' : ''}}</div>
          </div>

          <div class="preview-box">
            <div class="slide-viewport" onclick="openLightbox('${{item.slides[0]}}')">
              <img src="${{item.slides[0]}}" alt="Día ${{item.day}}">
            </div>
            ${{switcherHtml}}
          </div>

          <div class="card-bottom">
            <div class="caption-box">${{item.caption.replace(/\\n/g, '<br>')}}</div>
            <div class="btn-row">
              <button class="btn-copy" onclick="copyCaption(\`${{item.caption.replace(/`/g, '\\\\`')}}\`, this)">
                Copiar Copy
              </button>
              <a class="btn-view" href="${{item.slides[0]}}" target="_blank">
                Ver HD &nearr;
              </a>
            </div>
          </div>
        `;
        grid.appendChild(card);
      }});
    }}

    // Init
    document.addEventListener('DOMContentLoaded', () => {{
      renderCards();
    }});
  </script>
</body>
</html>
"""
    with open(DASHBOARD_PATH, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"✓ Dashboard updated successfully at {DASHBOARD_PATH}")

if __name__ == "__main__":
    build_dashboard()
