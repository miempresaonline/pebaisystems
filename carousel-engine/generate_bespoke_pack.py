import asyncio
import os
import json
from playwright.async_api import async_playwright

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Common High-Tech Dark CSS Stylesheet
COMMON_CSS = """
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Playfair+Display:ital,wght@1,600;1,700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    width: 1080px;
    height: 1440px;
    background-color: #080B11;
    background-image: 
      radial-gradient(circle at 85% 12%, rgba(0, 210, 255, 0.09) 0%, transparent 55%),
      radial-gradient(circle at 15% 88%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
      radial-gradient(rgba(255, 255, 255, 0.06) 1.5px, transparent 1.5px);
    background-size: 100% 100%, 100% 100%, 36px 36px;
    color: #F8FAFC;
    font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
    padding: 80px 72px 64px 72px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
    position: relative;
  }

  /* Top Bar */
  .top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    margin-bottom: 30px;
  }

  .tag-pill {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 10px 20px;
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(0, 210, 255, 0.3);
    border-radius: 100px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.14em;
    color: #00D2FF;
    text-transform: uppercase;
    box-shadow: 0 0 20px rgba(0, 210, 255, 0.15);
  }

  .tag-pill .pill-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #00D2FF;
    box-shadow: 0 0 10px #00D2FF;
  }

  .slide-counter {
    font-family: 'JetBrains Mono', monospace;
    font-size: 16px;
    font-weight: 700;
    color: #64748B;
    letter-spacing: 0.12em;
    padding: 8px 18px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 100px;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .slide-counter span {
    color: #F8FAFC;
  }

  /* Main Content Area */
  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 32px;
  }

  /* Typography */
  .editorial-serif {
    font-family: 'Playfair Display', serif;
    font-style: italic;
    font-weight: 600;
    color: #00D2FF;
    line-height: 1.15;
  }

  .main-title {
    font-size: 58px;
    font-weight: 800;
    line-height: 1.14;
    letter-spacing: -0.035em;
    color: #FFFFFF;
  }

  .main-title span.accent-cyan {
    color: #00D2FF;
  }

  .main-title span.accent-purple {
    color: #A855F7;
  }

  .main-title span.accent-emerald {
    color: #10B981;
  }

  .main-title span.accent-amber {
    color: #F59E0B;
  }

  .subline {
    font-size: 25px;
    font-weight: 500;
    line-height: 1.48;
    color: #94A3B8;
  }

  /* Cards & Glassmorphism */
  .glass-card {
    background: rgba(15, 23, 42, 0.75);
    border: 1px solid rgba(255, 255, 255, 0.09);
    border-radius: 28px;
    padding: 38px 42px;
    backdrop-filter: blur(24px);
    box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.55);
  }

  /* Split Comparison Cards */
  .split-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    width: 100%;
  }

  .comp-card {
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 24px;
    padding: 34px 30px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    position: relative;
    overflow: hidden;
  }

  .comp-card.active-winner {
    background: linear-gradient(180deg, rgba(0, 210, 255, 0.08) 0%, rgba(15, 23, 42, 0.85) 100%);
    border: 1px solid rgba(0, 210, 255, 0.4);
    box-shadow: 0 16px 36px -10px rgba(0, 210, 255, 0.25);
  }

  .comp-card.emerald-winner {
    background: linear-gradient(180deg, rgba(16, 185, 129, 0.09) 0%, rgba(15, 23, 42, 0.85) 100%);
    border: 1px solid rgba(16, 185, 129, 0.4);
    box-shadow: 0 16px 36px -10px rgba(16, 185, 129, 0.25);
  }

  .comp-badge {
    display: inline-block;
    padding: 6px 14px;
    border-radius: 100px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.1em;
    width: fit-content;
  }

  .badge-dim {
    background: rgba(255, 255, 255, 0.06);
    color: #64748B;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .badge-cyan {
    background: rgba(0, 210, 255, 0.15);
    color: #00D2FF;
    border: 1px solid rgba(0, 210, 255, 0.4);
  }

  .badge-purple {
    background: rgba(168, 85, 247, 0.15);
    color: #C084FC;
    border: 1px solid rgba(168, 85, 247, 0.4);
  }

  .badge-emerald {
    background: rgba(16, 185, 129, 0.15);
    color: #34D399;
    border: 1px solid rgba(16, 185, 129, 0.4);
  }

  .comp-title {
    font-size: 28px;
    font-weight: 800;
    color: #FFFFFF;
  }

  .comp-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .comp-item {
    font-size: 18px;
    line-height: 1.45;
    color: #94A3B8;
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .comp-card.active-winner .comp-item,
  .comp-card.emerald-winner .comp-item {
    color: #E2E8F0;
  }

  .bullet-icon {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin-top: 8px;
    flex-shrink: 0;
  }

  .bullet-icon.dim { background: #475569; }
  .bullet-icon.cyan { background: #00D2FF; box-shadow: 0 0 8px #00D2FF; }
  .bullet-icon.emerald { background: #10B981; box-shadow: 0 0 8px #10B981; }

  /* Horizontal Architecture Stack */
  .stack-list {
    display: flex;
    flex-direction: column;
    gap: 18px;
    width: 100%;
  }

  .stack-card {
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    padding: 24px 30px;
    display: flex;
    align-items: center;
    gap: 24px;
    transition: all 0.3s ease;
  }

  .stack-num {
    font-family: 'JetBrains Mono', monospace;
    font-size: 22px;
    font-weight: 800;
    color: #00D2FF;
    padding: 8px 16px;
    background: rgba(0, 210, 255, 0.08);
    border: 1px solid rgba(0, 210, 255, 0.25);
    border-radius: 12px;
    flex-shrink: 0;
  }

  .stack-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .stack-title {
    font-size: 24px;
    font-weight: 700;
    color: #FFFFFF;
  }

  .stack-desc {
    font-size: 18px;
    color: #94A3B8;
    line-height: 1.4;
  }

  /* Metric Highlight Box */
  .metric-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    width: 100%;
  }

  .metric-box {
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 22px;
    padding: 28px 30px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .metric-val {
    font-family: 'JetBrains Mono', monospace;
    font-size: 46px;
    font-weight: 800;
    letter-spacing: -0.04em;
    line-height: 1;
  }

  .metric-val.cyan { color: #00D2FF; }
  .metric-val.emerald { color: #10B981; }
  .metric-val.amber { color: #F59E0B; }
  .metric-val.red { color: #EF4444; }

  .metric-label {
    font-size: 17px;
    font-weight: 600;
    color: #94A3B8;
    line-height: 1.35;
  }

  /* Call To Action Box */
  .cta-container {
    background: linear-gradient(180deg, rgba(0, 210, 255, 0.07) 0%, rgba(15, 23, 42, 0.9) 100%);
    border: 1px solid rgba(0, 210, 255, 0.35);
    border-radius: 32px;
    padding: 50px 48px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 28px;
    box-shadow: 0 30px 60px -15px rgba(0, 210, 255, 0.2);
  }

  .cta-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 22px;
    background: rgba(0, 210, 255, 0.12);
    border: 1px solid rgba(0, 210, 255, 0.4);
    border-radius: 100px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.12em;
    color: #00D2FF;
  }

  .cta-headline {
    font-size: 40px;
    font-weight: 800;
    line-height: 1.22;
    color: #FFFFFF;
    letter-spacing: -0.025em;
  }

  .cta-action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
    width: 100%;
    padding: 22px 36px;
    background: #00D2FF;
    color: #080B11;
    border-radius: 100px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 20px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    box-shadow: 0 10px 30px rgba(0, 210, 255, 0.45);
  }

  .cta-note {
    font-size: 19px;
    color: #94A3B8;
    line-height: 1.5;
  }

  /* Footer */
  .footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding-top: 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  .footer-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: #F8FAFC;
  }

  .footer-brand span {
    color: #00D2FF;
  }

  .footer-nav {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: #64748B;
  }

  .footer-nav span.arrow {
    color: #00D2FF;
  }
"""

def generate_slide_html(top_tag, slide_num, total_slides, body_html, footer_right="DESLIZA"):
    return f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Slide {slide_num} - PEBAI Systems</title>
  <style>
    {COMMON_CSS}
  </style>
</head>
<body>
  <div class="top-bar">
    <div class="tag-pill">
      <div class="pill-dot"></div>
      <span>{top_tag}</span>
    </div>
    <div class="slide-counter">
      <span>0{slide_num}</span> / 0{total_slides}
    </div>
  </div>

  <div class="main-content">
    {body_html}
  </div>

  <div class="footer">
    <div class="footer-brand">
      PEBAI <span>SYSTEMS</span>
    </div>
    <div class="footer-nav">
      <span>{footer_right}</span>
      <span class="arrow">&gt;&gt;</span>
    </div>
  </div>
</body>
</html>
"""

# ==========================================
# CAROUSEL 1: VIRAL (OpenAI Dots vs Meta Muse)
# ==========================================
def get_carrusel_1_slides():
    slides = []
    
    # Slide 1 (Cover)
    body_1 = """
      <div style="display:flex; flex-direction:column; gap:20px;">
        <div class="editorial-serif" style="font-size: 52px;">Chatbots are dead.</div>
        <div class="main-title" style="font-size: 64px;">
          OpenAI Dots <span class="accent-cyan">vs</span> Meta Muse
        </div>
        <div class="subline" style="font-size: 28px; color: #E2E8F0;">
          La guerra por tomar el control definitivo de tu ordenador.
        </div>
      </div>

      <div class="glass-card" style="padding: 32px 36px; display:flex; flex-direction:column; gap:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:10px; font-family:'JetBrains Mono'; font-size:14px; color:#10B981;">
            <div style="width:8px; height:8px; border-radius:50%; background:#10B981; box-shadow:0 0 10px #10B981;"></div>
            STATUS: ACTIVE CLOUD SANDBOX
          </div>
          <div style="font-family:'JetBrains Mono'; font-size:13px; color:#64748B;">VM: LINUX-PERSISTENT-01</div>
        </div>
        <div style="font-family:'JetBrains Mono'; font-size:18px; color:#94A3B8; line-height:1.6; background:rgba(0,0,0,0.4); padding:18px 22px; border-radius:14px; border:1px solid rgba(255,255,255,0.06);">
          <span style="color:#00D2FF;">root@agent:~$</span> execute-agent --target="infrastructure" --mode="autonomous"<br>
          <span style="color:#10B981;">[OK]</span> Astra Sandbox spawned. Granting terminal, filesystem & API access...
        </div>
      </div>
    """
    slides.append(generate_slide_html("RADAR IA 2026 // AGENTES", 1, 5, body_1))

    # Slide 2 (El Cambio de Paradigma)
    body_2 = """
      <div style="display:flex; flex-direction:column; gap:14px;">
        <div class="main-title">
          Dejar de chatear.<br>Empezar a <span class="accent-cyan">delegar.</span>
        </div>
        <div class="subline">
          La diferencia entre una ventana de chat y un Persistent Cloud Agent.
        </div>
      </div>

      <div class="split-grid">
        <div class="comp-card">
          <div class="comp-badge badge-dim">ERA 2023 - 2025</div>
          <div class="comp-title">Chatbot Pasivo</div>
          <div class="comp-list">
            <div class="comp-item"><div class="bullet-icon dim"></div>Espera tus preguntas en un chat.</div>
            <div class="comp-item"><div class="bullet-icon dim"></div>Solo devuelve bloques de texto.</div>
            <div class="comp-item"><div class="bullet-icon dim"></div>El humano debe copiar, pegar y ejecutar.</div>
            <div class="comp-item"><div class="bullet-icon dim"></div>Pierde el contexto al cerrar sesión.</div>
          </div>
        </div>

        <div class="comp-card active-winner">
          <div class="comp-badge badge-cyan">ERA 2026+</div>
          <div class="comp-title">Persistent Agent</div>
          <div class="comp-list">
            <div class="comp-item"><div class="bullet-icon cyan"></div>Ordenador virtual Linux propio 24/7.</div>
            <div class="comp-item"><div class="bullet-icon cyan"></div>Opera ratón, teclado, archivos y terminal.</div>
            <div class="comp-item"><div class="bullet-icon cyan"></div>Ejecuta tareas de principio a fin.</div>
            <div class="comp-item"><div class="bullet-icon cyan"></div>Corrige errores de forma autónoma.</div>
          </div>
        </div>
      </div>
    """
    slides.append(generate_slide_html("CAMBIO DE PARADIGMA", 2, 5, body_2))

    # Slide 3 (Dots vs Muse: Cara a Cara)
    body_3 = """
      <div style="display:flex; flex-direction:column; gap:14px;">
        <div class="main-title">
          Dos visiones para sustituir al usuario humano.
        </div>
        <div class="subline">
          Así compiten los dos gigantes tecnológicos por dominar la ejecución:
        </div>
      </div>

      <div class="split-grid">
        <div class="comp-card active-winner">
          <div class="comp-badge badge-cyan">OPENAI DOTS</div>
          <div class="comp-title" style="font-size: 26px;">Headless Machine</div>
          <div class="comp-list">
            <div class="comp-item"><div class="bullet-icon cyan"></div><strong>Núcleo:</strong> Sandbox Linux aislado (Astra).</div>
            <div class="comp-item"><div class="bullet-icon cyan"></div><strong>Canal:</strong> Línea de comandos y APIs.</div>
            <div class="comp-item"><div class="bullet-icon cyan"></div><strong>Fuerza:</strong> Desarrollo, despliegues y gestión masiva de datos en la sombra.</div>
          </div>
        </div>

        <div class="comp-card" style="border: 1px solid rgba(168, 85, 247, 0.4); background: linear-gradient(180deg, rgba(168, 85, 247, 0.08) 0%, rgba(15, 23, 42, 0.85) 100%);">
          <div class="comp-badge badge-purple">META MUSE</div>
          <div class="comp-title" style="font-size: 26px;">Visión Multimodal</div>
          <div class="comp-list">
            <div class="comp-item"><div class="bullet-icon" style="background:#A855F7; box-shadow:0 0 8px #A855F7;"></div><strong>Núcleo:</strong> Percepción visual de pantalla.</div>
            <div class="comp-item"><div class="bullet-icon" style="background:#A855F7; box-shadow:0 0 8px #A855F7;"></div><strong>Canal:</strong> Clics de ratón y navegación UI.</div>
            <div class="comp-item"><div class="bullet-icon" style="background:#A855F7; box-shadow:0 0 8px #A855F7;"></div><strong>Fuerza:</strong> Interacción con programas legacy y software de escritorio sin API.</div>
          </div>
        </div>
      </div>
    """
    slides.append(generate_slide_html("BENCHMARK TÉCNICO", 3, 5, body_3))

    # Slide 4 (El Salto Operativo: 3 Fases)
    body_4 = """
      <div style="display:flex; flex-direction:column; gap:14px;">
        <div class="main-title">
          Cómo cambia el trabajo a partir de hoy:
        </div>
        <div class="subline">
          Del prompt artesanal al ciclo de delegación autónomo en 3 pasos:
        </div>
      </div>

      <div class="stack-list">
        <div class="stack-card">
          <div class="stack-num">01</div>
          <div class="stack-info">
            <div class="stack-title">Instrucción en Lenguaje Natural</div>
            <div class="stack-desc">"Integra Stripe, conecta los webhooks con Supabase y comprueba que pasen todos los tests unitarios."</div>
          </div>
        </div>

        <div class="stack-card" style="border-color: rgba(0, 210, 255, 0.3); background: rgba(0, 210, 255, 0.04);">
          <div class="stack-num" style="background: rgba(0, 210, 255, 0.2); color:#FFFFFF;">02</div>
          <div class="stack-info">
            <div class="stack-title">Despliegue y Resolución en Sandbox</div>
            <div class="stack-desc">El agente clona el repositorio, ejecuta el código, detecta errores de dependencias y los repara en bucle sin pedir ayuda.</div>
          </div>
        </div>

        <div class="stack-card">
          <div class="stack-num">03</div>
          <div class="stack-info">
            <div class="stack-title">Entrega de Activo Funcional</div>
            <div class="stack-desc">Entrega la URL verificada en producción en 3 minutos. Tu rol pasa de redactor a supervisor de arquitectura.</div>
          </div>
        </div>
      </div>
    """
    slides.append(generate_slide_html("DELEGACIÓN INDUSTRIAL", 4, 5, body_4))

    # Slide 5 (Cierre & Debate)
    body_5 = """
      <div class="cta-container">
        <div class="cta-badge">EL DEBATE OPERATIVO</div>
        <div class="cta-headline">
          ¿Le darías permisos de terminal a un agente autónomo?
        </div>
        <div class="cta-note" style="max-width: 760px;">
          La ventaja en el mercado ya no es de quien sabe hacer mejores preguntas, sino de quien sabe orquestar sistemas que operan mientras duerme.
        </div>
        <div class="cta-action-btn">
          DEJA TU OPINIÓN EN COMENTARIOS
        </div>
        <div style="font-family:'JetBrains Mono'; font-size:15px; color:#64748B;">
          ¿Avance definitivo de productividad o riesgo de seguridad descontrolado?
        </div>
      </div>
    """
    slides.append(generate_slide_html("CONCLUSIÓN // DEBATE", 5, 5, body_5, "GUARDAR"))

    return slides

# ==========================================
# CAROUSEL 2: MIXTO (David Robinson / 4 Capas)
# ==========================================
def get_carrusel_2_slides():
    slides = []

    # Slide 1 (Cover)
    body_1 = """
      <div style="display:flex; flex-direction:column; gap:20px;">
        <div class="editorial-serif" style="font-size: 46px; color:#F59E0B;">The Atlantic // Seguridad en IA</div>
        <div class="main-title" style="font-size: 60px;">
          Dimite el líder de seguridad de OpenAI:
        </div>
        <div class="subline" style="font-size: 30px; color: #E2E8F0; font-weight:700;">
          "La IA no falla por la tecnología: falla por la ausencia de arquitectura de procesos."
        </div>
      </div>

      <div class="glass-card" style="border-left: 5px solid #F59E0B; padding: 30px 36px; display:flex; flex-direction:column; gap:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="font-family:'JetBrains Mono'; font-size:14px; color:#F59E0B; font-weight:700;">
            ALERTA TÉCNICA DE LABORATORIO
          </div>
          <div style="font-family:'JetBrains Mono'; font-size:13px; color:#64748B;">REPORTE OFICIAL 2026</div>
        </div>
        <div style="font-size: 21px; color: #CBD5E1; line-height: 1.5;">
          El 90% de las empresas que compran licencias de modelos avanzados abandonan a los pocos meses por falta de consistencia y alucinaciones críticas.
        </div>
      </div>
    """
    slides.append(generate_slide_html("ANÁLISIS DE SISTEMAS", 1, 5, body_1))

    # Slide 2 (El Síntoma más Caro)
    body_2 = """
      <div style="display:flex; flex-direction:column; gap:14px;">
        <div class="main-title">
          El síntoma más caro:<br><span class="accent-amber">Comprar herramientas sin mapa.</span>
        </div>
        <div class="subline">
          Automatizar flujos desordenados solo produce fallos a mayor velocidad:
        </div>
      </div>

      <div class="metric-grid">
        <div class="metric-box">
          <div class="metric-val red">42%</div>
          <div class="metric-label">Tasa de alucinación e incongruencia en modelos sin capa de datos previa.</div>
        </div>

        <div class="metric-box">
          <div class="metric-val amber">85%</div>
          <div class="metric-label">De las empresas vuelven al trabajo manual a las 4 semanas de contratar IA.</div>
        </div>
      </div>

      <div class="glass-card" style="padding: 28px 32px; border-left: 4px solid #00D2FF;">
        <div style="font-size: 22px; color: #F8FAFC; line-height: 1.5; font-weight:600;">
          "Un modelo de lenguaje es un motor de inferencia, no un sistema de gestión. Si no le das reglas duras, improvisa."
        </div>
      </div>
    """
    slides.append(generate_slide_html("EL PROBLEMA OCULTO", 2, 5, body_2))

    # Slide 3 (La Arquitectura de 4 Capas PEBAI)
    body_3 = """
      <div style="display:flex; flex-direction:column; gap:14px;">
        <div class="main-title">
          La Arquitectura de 4 Capas de PEBAI Systems:
        </div>
        <div class="subline">
          El framework determinista para que la IA nunca alucine en tu operativa:
        </div>
      </div>

      <div class="stack-list">
        <div class="stack-card">
          <div class="stack-num">01</div>
          <div class="stack-info">
            <div class="stack-title">Capa de Datos Estructurados</div>
            <div class="stack-desc">APIs limpias, esquemas JSON y bases de datos relacionales sin ruido ni duplicados.</div>
          </div>
        </div>

        <div class="stack-card" style="border-color: rgba(0, 210, 255, 0.4); background: rgba(0, 210, 255, 0.05);">
          <div class="stack-num" style="background: rgba(0, 210, 255, 0.2); color:#FFFFFF;">02</div>
          <div class="stack-info">
            <div class="stack-title">Lógica Dura y Reglas de Negocio</div>
            <div class="stack-desc">Condicionales estrictos que acotan qué puede y qué no puede responder el sistema.</div>
          </div>
        </div>

        <div class="stack-card">
          <div class="stack-num">03</div>
          <div class="stack-info">
            <div class="stack-title">Motor de Inferencia Acotado</div>
            <div class="stack-desc">El LLM solo redacta y sintetiza el resultado bajo el contexto validado de la Capa 2.</div>
          </div>
        </div>

        <div class="stack-card">
          <div class="stack-num">04</div>
          <div class="stack-info">
            <div class="stack-title">Supervisión y Trazabilidad</div>
            <div class="stack-desc">Registro forense de cada interacción y alertas en tiempo real ante cualquier anomalía.</div>
          </div>
        </div>
      </div>
    """
    slides.append(generate_slide_html("ARQUITECTURA DETERMINISTA", 3, 5, body_3))

    # Slide 4 (Sistemas sobre Herramientas)
    body_4 = """
      <div style="display:flex; flex-direction:column; gap:14px;">
        <div class="main-title">
          Sistemas sobre Herramientas.
        </div>
        <div class="subline">
          La diferencia entre un aficionado y una empresa automatizada:
        </div>
      </div>

      <div class="split-grid">
        <div class="comp-card">
          <div class="comp-badge badge-dim">ENFOQUE COMÚN</div>
          <div class="comp-title">Comprar Licencias</div>
          <div class="comp-list">
            <div class="comp-item"><div class="bullet-icon dim"></div>Cambian de herramienta de IA cada mes.</div>
            <div class="comp-item"><div class="bullet-icon dim"></div>Dependen de la memoria del empleado.</div>
            <div class="comp-item"><div class="bullet-icon dim"></div>Cero integración con bases de datos.</div>
            <div class="comp-item"><div class="bullet-icon dim"></div>Respuestas impredecibles y errores.</div>
          </div>
        </div>

        <div class="comp-card active-winner">
          <div class="comp-badge badge-cyan">ENFOQUE PEBAI</div>
          <div class="comp-title">Arquitectura Real</div>
          <div class="comp-list">
            <div class="comp-item"><div class="bullet-icon cyan"></div>Procesos documentados y auditados.</div>
            <div class="comp-item"><div class="bullet-icon cyan"></div>Flujos nativos conectados vía webhooks.</div>
            <div class="comp-item"><div class="bullet-icon cyan"></div>Respuestas consistentes en menos de 20s.</div>
            <div class="comp-item"><div class="bullet-icon cyan"></div>El sistema escala sin aumentar personal.</div>
          </div>
        </div>
      </div>
    """
    slides.append(generate_slide_html("INGENIERÍA B2B", 4, 5, body_4))

    # Slide 5 (Cierre & Conversión SISTEMA)
    body_5 = """
      <div class="cta-container">
        <div class="cta-badge">DOCUMENTO TÉCNICO INTERNO</div>
        <div class="cta-headline">
          Blinda la operativa de tu empresa antes de automatizar.
        </div>
        <div class="cta-note" style="max-width: 740px;">
          Hemos volcado el protocolo técnico de las 4 capas en una guía de implementación para directivos y equipos de operaciones.
        </div>
        <div class="cta-action-btn">
          COMENTA "SISTEMA"
        </div>
        <div style="font-family:'JetBrains Mono'; font-size:16px; color:#94A3B8;">
          Te enviaremos el documento técnico directamente por mensaje privado.
        </div>
      </div>
    """
    slides.append(generate_slide_html("ACCESO PRIVADO", 5, 5, body_5, "COMENTAR"))

    return slides

# ==========================================
# CAROUSEL 3: B2B (Consultoría Técnica 45 min)
# ==========================================
def get_carrusel_3_slides():
    slides = []

    # Slide 1 (Cover)
    body_1 = """
      <div style="display:flex; flex-direction:column; gap:20px;">
        <div class="editorial-serif" style="font-size: 48px; color:#10B981;">Convocatoria Mensual // 5 Plazas</div>
        <div class="main-title" style="font-size: 58px;">
          El 40% del tiempo de tu equipo se va en tareas que <span class="accent-emerald">no facturan un euro.</span>
        </div>
        <div class="subline" style="font-size: 27px; color: #E2E8F0;">
          Abrimos 5 plazas para nuestra auditoría técnica de procesos a coste cero.
        </div>
      </div>

      <div class="glass-card" style="border: 1px solid rgba(16, 185, 129, 0.35); background: linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.85) 100%); padding: 32px 38px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-family:'JetBrains Mono'; font-size:13px; color:#34D399; font-weight:700; letter-spacing:0.12em; text-transform:uppercase;">
            AUDITORÍA DE DIAGNÓSTICO
          </div>
          <div style="font-size:26px; font-weight:800; color:#FFFFFF; margin-top:4px;">
            Sesión Privada de 45 Minutos
          </div>
        </div>
        <div style="font-family:'JetBrains Mono'; font-size:36px; font-weight:800; color:#10B981; padding: 10px 22px; background:rgba(16,185,129,0.15); border-radius:14px; border:1px solid rgba(16,185,129,0.4);">
          0 €
        </div>
      </div>
    """
    slides.append(generate_slide_html("CONVOCATORIA MENSUAL — 5 PLAZAS", 1, 5, body_1))

    # Slide 2 (La Fuga Financiera en Números Reales)
    body_2 = """
      <div style="display:flex; flex-direction:column; gap:14px;">
        <div class="main-title">
          La matemática del trabajo manual no perdona:
        </div>
        <div class="subline">
          El coste invisible que drena la rentabilidad de las empresas con más de 3 empleados:
        </div>
      </div>

      <div class="metric-grid">
        <div class="metric-box">
          <div class="metric-val emerald">18.5 h</div>
          <div class="metric-label">Perdidas cada semana por empleado en copiar datos entre excels, CRM y correos.</div>
        </div>

        <div class="metric-box">
          <div class="metric-val red">-12.400 €</div>
          <div class="metric-label">Coste anual directo por puesto administrativo en tareas que un sistema ejecuta en 10s.</div>
        </div>

        <div class="metric-box">
          <div class="metric-val amber">74%</div>
          <div class="metric-label">De pérdida en conversión si un cliente entrante tarda más de 15 minutos en recibir respuesta.</div>
        </div>

        <div class="metric-box">
          <div class="metric-val cyan">100%</div>
          <div class="metric-label">Dependencia de la memoria de las personas: si alguien falta, el proceso se congela.</div>
        </div>
      </div>
    """
    slides.append(generate_slide_html("EL COSTE INVISIBLE", 2, 5, body_2))

    # Slide 3 (Parches vs Arquitectura PEBAI)
    body_3 = """
      <div style="display:flex; flex-direction:column; gap:14px;">
        <div class="main-title">
          La diferencia entre parchear y construir un activo:
        </div>
        <div class="subline">
          Por qué contratar más personal no resuelve el desorden de base:
        </div>
      </div>

      <div class="split-grid">
        <div class="comp-card">
          <div class="comp-badge badge-dim">EL PARCHE HABITUAL</div>
          <div class="comp-title">Más Personal Manual</div>
          <div class="comp-list">
            <div class="comp-item"><div class="bullet-icon dim"></div>Multiplicar los costes fijos de nóminas.</div>
            <div class="comp-item"><div class="bullet-icon dim"></div>Hojas de cálculo frágiles que se rompen.</div>
            <div class="comp-item"><div class="bullet-icon dim"></div>Bandejas de entrada fuera de control.</div>
            <div class="comp-item"><div class="bullet-icon dim"></div>La empresa colapsa al intentar crecer.</div>
          </div>
        </div>

        <div class="comp-card emerald-winner">
          <div class="comp-badge badge-emerald">ARQUITECTURA PEBAI</div>
          <div class="comp-title">Sistemas Autónomos</div>
          <div class="comp-list">
            <div class="comp-item"><div class="bullet-icon emerald"></div>Mapeo del flujo operativo de extremo a extremo.</div>
            <div class="comp-item"><div class="bullet-icon emerald"></div>Conexión automática entre CRM, web y presupuestos.</div>
            <div class="comp-item"><div class="bullet-icon emerald"></div>Agentes de respuesta inmediata 24/7.</div>
            <div class="comp-item"><div class="bullet-icon emerald"></div>Capacidad para asumir el triple de volumen.</div>
          </div>
        </div>
      </div>
    """
    slides.append(generate_slide_html("INGENIERÍA DE PROCESOS", 3, 5, body_3))

    # Slide 4 (Qué Diseñamos en la Sesión de 45 Min)
    body_4 = """
      <div style="display:flex; flex-direction:column; gap:14px;">
        <div class="main-title">
          Qué recibirás en la sesión privada de 45 minutos:
        </div>
        <div class="subline">
          Auditoría técnica en directo con los socios fundadores (Coste 0 €):
        </div>
      </div>

      <div class="stack-list">
        <div class="stack-card">
          <div class="stack-num" style="color:#10B981; border-color:rgba(16,185,129,0.3); background:rgba(16,185,129,0.08);">01</div>
          <div class="stack-info">
            <div class="stack-title">Mapeo Operativo en Pantalla</div>
            <div class="stack-desc">Trazamos en un tablero visual el flujo exacto de tu empresa para localizar dónde se pierden horas invisibles.</div>
          </div>
        </div>

        <div class="stack-card" style="border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.05);">
          <div class="stack-num" style="background: rgba(16, 185, 129, 0.2); color:#FFFFFF;">02</div>
          <div class="stack-info">
            <div class="stack-title">Matriz de Automatización Rápida</div>
            <div class="stack-desc">Detectamos las 3 tareas manuales que al conectarse generan un ahorro directo superior a 800 €/mes por empleado.</div>
          </div>
        </div>

        <div class="stack-card">
          <div class="stack-num" style="color:#10B981; border-color:rgba(16,185,129,0.3); background:rgba(16,185,129,0.08);">03</div>
          <div class="stack-info">
            <div class="stack-title">Hoja de Ruta Técnica Definitiva</div>
            <div class="stack-desc">Te entregamos la arquitectura exacta de herramientas, APIs y agentes recomendados para tu caso específico.</div>
          </div>
        </div>
      </div>
    """
    slides.append(generate_slide_html("ENTREGABLES DEL DIAGNÓSTICO", 4, 5, body_4))

    # Slide 5 (Convocatoria Privada y CTA CONSULTORÍA)
    body_5 = """
      <div class="cta-container" style="border-color: rgba(16, 185, 129, 0.4); background: linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.95) 100%);">
        <div class="cta-badge" style="color:#34D399; border-color:rgba(16,185,129,0.4); background:rgba(16,185,129,0.12);">
          5 PLAZAS DISPONIBLES ESTE MES
        </div>
        <div class="cta-headline">
          Solicita tu auditoría técnica privada de 45 minutos.
        </div>
        <div class="cta-note" style="max-width: 760px;">
          Exclusivo para empresas con más de 3 empleados en plantilla y operativa en marcha que busquen escalar sin multiplicar costes.
        </div>
        <div class="cta-action-btn" style="background: #10B981; color: #080B11; box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4);">
          COMENTA "CONSULTORÍA"
        </div>
        <div style="font-family:'JetBrains Mono'; font-size:16px; color:#CBD5E1;">
          Te enviaremos una solicitud privada para valorar si tu empresa encaja en la convocatoria.
        </div>
      </div>
    """
    slides.append(generate_slide_html("CONVOCATORIA CERRADA", 5, 5, body_5, "SOLICITAR"))

    return slides

async def render_pack():
    carousels = [
        {
            "id": "propuesta_1_viral",
            "name": "Chatbots are dead - OpenAI Dots vs Meta Muse",
            "slides_html": get_carrusel_1_slides(),
            "caption": """Los chatbots de texto ya son tecnología del pasado.

OpenAI y Meta acaban de abrir la carrera por los agentes con ordenador propio en la nube: sistemas capaces de operar terminales, bases de datos y software sin supervisión continua.

¿Confiarías el control operativo de tu equipo a un agente autónomo? Te leo en comentarios.

#InteligenciaArtificial #OpenAI #TechNews #Automatizacion #SoftwareEngineering"""
        },
        {
            "id": "propuesta_2_mixto",
            "name": "Dimite el lider de seguridad de OpenAI - Arquitectura de 4 Capas",
            "slides_html": get_carrusel_2_slides(),
            "caption": """La dimisión en OpenAI y su informe en The Atlantic confirman lo que vemos a diario en consultoría:

La IA no soluciona el desorden interno. Implementar modelos avanzados sobre flujos manuales no estandarizados solo multiplica los errores operativos.

Comenta SISTEMA y te enviamos la guía técnica de las 4 capas para blindar la operativa de tu empresa antes de automatizar.

#TransformacionDigital #OptimizacionDeProcesos #IngenieriaDeSoftware #SistemasB2B #ArquitecturaTI"""
        },
        {
            "id": "propuesta_3_b2b",
            "name": "Auditoria de Procesos e IA - Convocatoria 5 Plazas",
            "slides_html": get_carrusel_3_slides(),
            "caption": """Si tu empresa cuenta con más de 3 empleados, es muy probable que una parte sustancial de la jornada se pierda en tareas invisibles: cruzar datos entre programas, perseguir presupuestos y responder tarde a solicitudes entrantes.

En PEBAI Systems no creemos en parches temporales. Diseñamos la arquitectura de procesos e inteligencia artificial que tu negocio necesita para escalar sin multiplicar costes.

Este mes abrimos 5 plazas para nuestra auditoría técnica privada de 45 minutos a coste cero, donde analizamos tu operativa en directo y trazamos tu hoja de ruta.

Comenta CONSULTORÍA y te enviaremos una solicitud privada para valorar si encaja en tu empresa.

#ConsultoriaB2B #OptimizacionDeProcesos #Automatizacion #ProductividadEmpresarial #PEBAISystems #EmpresasEspana"""
        }
    ]

    print("Iniciando Playwright para renderizar los 3 carruseles en alta resolución (1080x1440 retina 2x)...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel="msedge", headless=True)
        page = await browser.new_page(
            viewport={"width": 1080, "height": 1440},
            device_scale_factor=2
        )

        for c in carousels:
            c_dir = os.path.join(OUTPUT_DIR, c["id"])
            html_dir = os.path.join(c_dir, "html")
            os.makedirs(html_dir, exist_ok=True)
            
            print(f"\n==========================================")
            print(f"Renderizando: {c['name']} ({c['id']})")
            print(f"==========================================")

            slide_pngs = []
            for idx, html_content in enumerate(c["slides_html"], 1):
                html_file = os.path.join(html_dir, f"slide_{idx}.html")
                png_file = os.path.join(c_dir, f"slide_{idx}.png")
                
                with open(html_file, "w", encoding="utf-8") as f:
                    f.write(html_content)

                abs_html = os.path.abspath(html_file)
                await page.goto(f"file:///{abs_html}")
                await page.wait_for_load_state("networkidle")
                await page.wait_for_timeout(1200)
                await page.screenshot(path=png_file)
                print(f" [OK] Diapositiva {idx} renderizada -> {png_file}")
                slide_pngs.append(png_file)

            # Escribir copy
            caption_file = os.path.join(c_dir, "caption.txt")
            with open(caption_file, "w", encoding="utf-8") as f:
                f.write(c["caption"])

            # Escribir visor HTML local
            viewer_file = os.path.join(c_dir, "index.html")
            with open(viewer_file, "w", encoding="utf-8") as f:
                f.write(f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{c['name']} - PEBAI Systems</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #080B11; color: #F8FAFC; padding: 32px 20px; text-align: center; }}
    h1 {{ font-size: 26px; margin-bottom: 8px; color: #00D2FF; }}
    p.lead {{ color: #94A3B8; font-size: 16px; margin-bottom: 30px; }}
    .slide-card {{ max-width: 540px; margin: 0 auto 36px auto; background: #0F172A; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.6); }}
    img {{ width: 100%; border-radius: 14px; display: block; }}
    .btn {{ display: inline-block; margin-top: 14px; background: #00D2FF; color: #080B11; font-weight: 700; padding: 10px 22px; border-radius: 100px; text-decoration: none; font-size: 14px; }}
    .caption-box {{ max-width: 540px; margin: 0 auto; text-align: left; background: #0F172A; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; }}
    pre {{ white-space: pre-wrap; font-size: 15px; color: #E2E8F0; font-family: inherit; line-height: 1.5; }}
  </style>
</head>
<body>
  <h1>{c['name']}</h1>
  <p class="lead">Carrusel de 5 diapositivas en alta resolución (1080x1440) para publicar en redes.</p>
  
  {''.join([f'<div class="slide-card"><img src="slide_{i}.png"><a class="btn" href="slide_{i}.png" download>Descargar Diapositiva {i}</a></div>' for i in range(1, 6)])}

  <div class="caption-box">
    <h3 style="margin-top:0; color:#00D2FF;">Pie de foto oficial listo para copiar:</h3>
    <pre>{c['caption']}</pre>
  </div>
</body>
</html>""")

        await browser.close()
        print("\n[ÉXITO] Los 3 carruseles (15 diapositivas) han sido diseñados y renderizados.")

if __name__ == "__main__":
    asyncio.run(render_pack())
