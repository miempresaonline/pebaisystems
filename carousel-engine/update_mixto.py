import os

mixto_template = """<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>{{ title }} — Slide {{ slide_num }}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@500;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }

    body {
      width: 1080px;
      height: 1440px;
      overflow: hidden;
      background: #FAF9F6;
      color: #0F172A;
      font-family: 'Plus Jakarta Sans', sans-serif;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 65px 95px 75px 75px;
    }

    .bg-dot-grid {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 1440px;
      background-image: radial-gradient(rgba(15, 23, 42, 0.08) 1.5px, transparent 1.5px);
      background-size: 28px 28px;
      pointer-events: none;
      z-index: 1;
    }

    .header-bar {
      position: relative;
      z-index: 10;
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .brand-handle-pill {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: #FFFFFF;
      border: 1.5px solid #E2E8F0;
      padding: 10px 22px;
      border-radius: 9999px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 15px;
      font-weight: 800;
      color: #0F172A;
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
    }

    .brand-handle-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #5848FA;
    }

    .category-tag-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13.5px;
      font-weight: 800;
      color: #5848FA;
      background: rgba(88, 72, 250, 0.08);
      border: 1px solid rgba(88, 72, 250, 0.2);
      padding: 6px 14px;
      border-radius: 6px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .brand-logo-img {
      height: 38px;
      width: auto;
      object-fit: contain;
    }

    .double-divider {
      width: 100%;
      height: 3px;
      background: linear-gradient(90deg, #5848FA 0%, #B7FF3C 70%, transparent 100%);
      margin-top: 14px;
      margin-bottom: 16px;
      border-radius: 2px;
    }

    .washi-note {
      position: absolute;
      background: #FDFBF7;
      border: 1.5px solid rgba(215, 205, 180, 0.6);
      box-shadow: 0 10px 25px rgba(15, 23, 42, 0.06);
      padding: 14px 20px;
      border-radius: 6px;
      z-index: 15;
    }

    .washi-tape {
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      width: 90px;
      height: 22px;
      background: rgba(225, 218, 195, 0.75);
      border-left: 2px dashed rgba(180, 170, 145, 0.6);
      border-right: 2px dashed rgba(180, 170, 145, 0.6);
    }

    .washi-title {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      font-weight: 800;
      color: #5848FA;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .washi-desc {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 15px;
      font-weight: 700;
      color: #1E293B;
      line-height: 1.35;
      margin-top: 4px;
    }

    /* REAL SQUIRCLE APP BADGES */
    .app-squircle {
      width: 58px;
      height: 58px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 22px -4px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(15, 23, 42, 0.04);
      flex-shrink: 0;
      position: relative;
      border: 1px solid rgba(255, 255, 255, 0.6);
    }
    .app-squircle img {
      width: 34px;
      height: 34px;
      object-fit: contain;
    }
    .app-squircle.sm {
      width: 48px;
      height: 48px;
      border-radius: 14px;
    }
    .app-squircle.sm img {
      width: 28px;
      height: 28px;
    }
    .app-squircle.lg {
      width: 78px;
      height: 78px;
      border-radius: 22px;
      box-shadow: 0 16px 36px -6px rgba(15, 23, 42, 0.18), 0 4px 10px rgba(15, 23, 42, 0.06);
    }
    .app-squircle.lg img {
      width: 46px;
      height: 46px;
    }

    .sq-openai { background: #10A37F; }
    .sq-openai img { filter: brightness(0) invert(1); }
    .sq-deepseek { background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%); }
    .sq-deepseek img { filter: brightness(0) invert(1); }
    .sq-claude { background: #CC785C; }
    .sq-claude img { filter: brightness(0) invert(1); }
    .sq-cohere { background: #FFFFFF; border: 1.5px solid #E2E8F0; }
    .sq-cohere img { width: 44px; height: auto; max-height: 30px; object-fit: contain; }
    .sq-python { background: #1E293B; border: 1px solid #334155; }
    .sq-pydantic { background: #E92063; }
    .sq-pydantic img { filter: brightness(0) invert(1); }
    .sq-postgres { background: #336791; }
    .sq-postgres img { filter: brightness(0) invert(1); }
    .sq-googlemeet { background: #FFFFFF; border: 1.5px solid #E2E8F0; }
    .sq-pebai { background: #12121A; border: 1.5px solid #5848FA; }

    /* FOOTER */
    .footer-bar {
      position: relative;
      z-index: 10;
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      border-top: 1px solid #E2E8F0;
      padding-top: 16px;
    }

    .footer-left {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 16px;
      font-weight: 700;
      color: #64748B;
    }

    .page-dots-wrap {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .page-dot-item {
      height: 8px;
      border-radius: 9999px;
      background: #CBD5E1;
      transition: all 0.3s ease;
    }

    .page-dot-item.active {
      width: 28px;
      background: #5848FA;
    }

    .page-dot-item.inactive {
      width: 8px;
    }

    .slide-num-text {
      font-family: 'JetBrains Mono', monospace;
      font-size: 15px;
      font-weight: 800;
      color: #0F172A;
    }
  </style>
</head>
<body>
  <div class="bg-dot-grid"></div>

  <!-- HEADER -->
  <header class="header-bar">
    <div class="brand-handle-pill">
      <span class="brand-handle-dot"></span>
      <span>@pebaisystems</span>
    </div>
    <div style="display: flex; align-items: center; gap: 14px;">
      <span class="category-tag-badge">SISTEMAS DETERMINISTAS · 2026</span>
      <img src="file:///{{ pebai_logo_horizontal }}" alt="PEBAI Systems" class="brand-logo-img">
    </div>
  </header>

  <!-- CONTENT PER SLIDE -->
  {% if slide_num == 1 %}
  <!-- SLIDE 1: PORTADA MIXTO - DIAGNOSTIC ARCHITECTURE BOARD (ERROR VS BLINDAJE) -->
  <main style="position: relative; z-index: 10; margin-top: 15px; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
    <div>
      <h2 style="font-family: 'Instrument Serif', Georgia, serif; font-size: 68px; font-weight: 400; color: #0F172A; line-height: 1.05; letter-spacing: -0.02em;">
        ¿Por Qué Tu Asistente de IA
      </h2>
      <h1 style="font-size: 80px; font-weight: 800; line-height: 1.02; letter-spacing: -0.03em; background: linear-gradient(135deg, #5848FA 0%, #12121A 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-transform: uppercase; margin-top: 4px;">
        Alucina en Vivo?
      </h1>

      <div class="double-divider"></div>

      <div style="font-family: 'Caveat', cursive; font-size: 36px; font-weight: 700; color: #5848FA; display: flex; align-items: center; gap: 12px;">
        <span>El fallo del 90% de las empresas al conectar un LLM a sus datos sin capas de validación →</span>
      </div>
    </div>

    <!-- DIAGNOSTIC ARCHITECTURE BOARD (UNIQUE LAYOUT) -->
    <div style="display: flex; flex-direction: column; gap: 18px;">
      
      <!-- CARD A: ERROR RAG TRADICIONAL -->
      <div style="background: #FFFFFF; border: 1.5px solid #FCA5A5; border-left: 6px solid #EF4444; border-radius: 20px; padding: 22px 28px; box-shadow: 0 10px 25px rgba(239, 68, 68, 0.06); display: flex; flex-direction: column; gap: 12px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span style="font-family: 'JetBrains Mono', monospace; font-size: 15px; font-weight: 800; color: #EF4444; background: rgba(239, 68, 68, 0.1); padding: 4px 12px; border-radius: 6px; text-transform: uppercase;">
            ARQUITECTURA TRADICIONAL (FRÁGIL)
          </span>
          <span style="font-size: 20px; font-weight: 800; color: #DC2626;">90% RIESGO DE ALUCINACIÓN</span>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; background: #FEF2F2; border-radius: 12px; padding: 14px 20px;">
          <div style="font-size: 20px; font-weight: 800; color: #0F172A;">Pregunta Cliente</div>
          <span style="font-size: 24px; color: #EF4444; font-weight: 900;">➔</span>
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="app-squircle sm sq-openai">
              <img src="{{ logos.openai }}" alt="OpenAI">
            </div>
            <div style="font-size: 20px; font-weight: 800; color: #0F172A;">LLM Probabilístico</div>
          </div>
          <span style="font-size: 24px; color: #EF4444; font-weight: 900;">➔</span>
          <div style="font-size: 20px; font-weight: 800; color: #DC2626;">Datos Inventados</div>
        </div>
      </div>

      <!-- CARD B: BLINDAJE DETERMINISTA PEBAI -->
      <div style="background: #FFFFFF; border: 2.5px solid #5848FA; border-radius: 22px; padding: 24px 28px; box-shadow: 0 18px 40px -8px rgba(88, 72, 250, 0.18); display: flex; flex-direction: column; gap: 14px; position: relative;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span style="font-family: 'JetBrains Mono', monospace; font-size: 15px; font-weight: 800; color: #5848FA; background: rgba(88, 72, 250, 0.1); padding: 4px 12px; border-radius: 6px; text-transform: uppercase;">
            BLINDAJE DETERMINISTA EN 3 FILTROS
          </span>
          <div style="background: #B7FF3C; border: 1.5px solid #12121A; color: #12121A; font-family: 'JetBrains Mono', monospace; font-size: 17px; font-weight: 900; padding: 4px 14px; border-radius: 8px;">
            0.0% MARGEN DE ERROR
          </div>
        </div>

        <!-- 3 FILTER SQUIRCLES SEQUENCE WITH 3D ART EMBEDDED -->
        <div style="display: grid; grid-template-columns: 1fr 150px; gap: 20px; align-items: center;">
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 14px; background: #FAF9F6; border: 1px solid #E2E8F0; border-radius: 12px; padding: 10px 16px;">
              <div class="app-squircle sm sq-python">
                <img src="{{ logos.python }}" alt="Python">
              </div>
              <div>
                <div style="font-size: 19px; font-weight: 800; color: #0F172A;">1. Parsing Jerárquico</div>
                <div style="font-size: 16px; font-weight: 600; color: #64748B;">División contextual de documentos</div>
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 14px; background: #FAF9F6; border: 1px solid #E2E8F0; border-radius: 12px; padding: 10px 16px;">
              <div class="app-squircle sm sq-cohere">
                <img src="{{ logos.cohere }}" alt="Cohere">
              </div>
              <div>
                <div style="font-size: 19px; font-weight: 800; color: #0F172A;">2. Re-Ranking Semántico</div>
                <div style="font-size: 16px; font-weight: 600; color: #64748B;">Filtra 80% del texto irrelevante</div>
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 14px; background: #FAF9F6; border: 1px solid #E2E8F0; border-radius: 12px; padding: 10px 16px;">
              <div class="app-squircle sm sq-pydantic">
                <img src="{{ logos.pydantic }}" alt="Pydantic">
              </div>
              <div>
                <div style="font-size: 19px; font-weight: 800; color: #0F172A;">3. Validación Tipada Pydantic</div>
                <div style="font-size: 16px; font-weight: 600; color: #64748B;">Esquema rígido contra invenciones</div>
              </div>
            </div>
          </div>

          <!-- 3D Crystal Shield in Card -->
          <div style="display: flex; justify-content: center; align-items: center;">
            <img src="file:///{{ cover_3d_artwork }}" alt="Escudo Determinista" style="width: 150px; height: 150px; object-fit: contain; filter: drop-shadow(0 15px 25px rgba(88, 72, 250, 0.25));">
          </div>
        </div>
      </div>
    </div>

    <!-- BOTTOM TELEMETRY BAR -->
    <div style="background: #12121A; border-radius: 16px; padding: 18px 24px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.25);">
      <div style="display: flex; align-items: center; gap: 14px;">
        <div style="width: 12px; height: 12px; border-radius: 50%; background: #B7FF3C; box-shadow: 0 0 10px #B7FF3C;"></div>
        <span style="font-family: 'JetBrains Mono', monospace; font-size: 19px; font-weight: 700; color: #FAF9F6;">
          guardrail.validate(response) ➔ 100% Verificado contra fuentes internas blindadas
        </span>
      </div>
      <span style="font-family: 'Caveat', cursive; font-size: 30px; font-weight: 700; color: #B7FF3C;">
        Cero alucinaciones →
      </span>
    </div>
  </main>

  {% elif slide_num == 2 %}
  <!-- SLIDE 2: EL FALLO OCULTO DEL RAG BÁSICO -->
  <main style="position: relative; z-index: 10; margin-top: 15px; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
    <div class="washi-note" style="top: -10px; right: 0; transform: rotate(2deg);">
      <div class="washi-tape"></div>
      <div class="washi-title">ERROR COMÚN</div>
      <div class="washi-desc">Similitud de cosenos<br>no es comprensión.</div>
    </div>

    <div style="max-width: 700px;">
      <h2 style="font-family: 'Instrument Serif', Georgia, serif; font-size: 68px; font-weight: 400; color: #0F172A; line-height: 1.0;">
        El Fallo Oculto
      </h2>
      <h1 style="font-size: 78px; font-weight: 800; line-height: 0.95; letter-spacing: -0.03em; background: linear-gradient(135deg, #5848FA 0%, #12121A 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-transform: uppercase; margin-top: 4px;">
        Del RAG Básico
      </h1>
      <div class="double-divider" style="margin-top: 12px; margin-bottom: 20px;"></div>
    </div>

    <!-- COMPARISON BOXES -->
    <div style="display: flex; flex-direction: column; gap: 18px;">
      <div style="background: #FFFFFF; border: 1.5px solid #FCA5A5; border-left: 6px solid #EF4444; border-radius: 18px; padding: 22px 26px; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <h3 style="font-size: 28px; font-weight: 800; color: #0F172A;">RAG Ingenuo (Vector Search Simple)</h3>
          <span style="font-family: 'JetBrains Mono', monospace; font-size: 18px; font-weight: 800; color: #DC2626; background: rgba(239, 68, 68, 0.1); padding: 4px 10px; border-radius: 6px;">ALTO RIESGO</span>
        </div>
        <p style="font-size: 23px; color: #475569; margin-top: 10px; line-height: 1.45;">
          Recupera fragmentos por cercanía superficial de palabras. Si el documento tiene cláusulas desactualizadas o excepciones en otra página, el LLM fusiona datos erróneos con total convicción.
        </p>
      </div>

      <div style="background: #FFFFFF; border: 2px solid #5848FA; border-left: 6px solid #5848FA; border-radius: 18px; padding: 22px 26px; box-shadow: 0 12px 30px rgba(88, 72, 250, 0.1);">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <h3 style="font-size: 28px; font-weight: 800; color: #0F172A;">Blindaje Determinista PEBAI</h3>
          <span style="font-family: 'JetBrains Mono', monospace; font-size: 18px; font-weight: 800; color: #12121A; background: #B7FF3C; padding: 4px 10px; border-radius: 6px;">100% FIABLE</span>
        </div>
        <p style="font-size: 23px; color: #475569; margin-top: 10px; line-height: 1.45;">
          Incorpora metadatos jerárquicos, re-evaluación por modelo cruzado y verificación estricta de esquemas antes de emitir cualquier palabra.
        </p>
      </div>
    </div>

    <!-- BOTTOM ROW -->
    <div style="background: #FFFFFF; border: 1.5px solid rgba(88, 72, 250, 0.2); border-radius: 16px; padding: 18px 24px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);">
      <div style="display: flex; align-items: center; gap: 14px;">
        <div class="app-squircle sm sq-pebai">
          <img src="{{ logos.python }}" alt="PEBAI">
        </div>
        <span style="font-size: 22px; font-weight: 700; color: #0F172A;">
          La precisión no depende del prompt, sino del pipeline previo que filtra los datos.
        </span>
      </div>
      <span style="font-family: 'Caveat', cursive; font-size: 34px; font-weight: 700; color: #5848FA;">Ingeniería real →</span>
    </div>
  </main>

  {% elif slide_num == 3 %}
  <!-- SLIDE 3: EL PIPELINE DE 3 FILTROS -->
  <main style="position: relative; z-index: 10; margin-top: 15px; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
    <div class="washi-note" style="top: -10px; right: 0; transform: rotate(-1.5deg);">
      <div class="washi-tape"></div>
      <div class="washi-title">METODOLOGÍA</div>
      <div class="washi-desc">3 filtros previos a<br>cualquier respuesta.</div>
    </div>

    <div style="max-width: 700px;">
      <h2 style="font-family: 'Instrument Serif', Georgia, serif; font-size: 68px; font-weight: 400; color: #0F172A; line-height: 1.0;">
        Paso 1: El Pipeline
      </h2>
      <h1 style="font-size: 78px; font-weight: 800; line-height: 0.95; letter-spacing: -0.03em; background: linear-gradient(135deg, #5848FA 0%, #12121A 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-transform: uppercase; margin-top: 4px;">
        De 3 Filtros
      </h1>
      <div class="double-divider" style="margin-top: 12px; margin-bottom: 20px;"></div>
    </div>

    <!-- 3 FILTER BLOCKS WITH REAL LOGOS -->
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div style="background: #FFFFFF; border: 1.5px solid #E2E8F0; border-radius: 18px; padding: 22px 26px; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05); display: grid; grid-template-columns: 58px 140px 1fr; gap: 20px; align-items: center;">
        <div class="app-squircle sq-python">
          <img src="{{ logos.python }}" alt="Python">
        </div>
        <div style="background: rgba(88, 72, 250, 0.08); color: #5848FA; font-family: 'JetBrains Mono', monospace; font-size: 17px; font-weight: 800; padding: 10px 14px; border-radius: 10px; text-align: center;">
          FILTRO 1
        </div>
        <div>
          <h3 style="font-size: 28px; font-weight: 800; color: #0F172A;">Parsing y Chunking Jerárquico</h3>
          <p style="font-size: 23px; color: #475569; margin-top: 6px; line-height: 1.45;">
            Documentos estructurados por títulos, tablas y cláusulas. Cada fragmento viaja con metadatos contextuales para no perder el significado.
          </p>
        </div>
      </div>

      <div style="background: #FFFFFF; border: 1.5px solid #E2E8F0; border-radius: 18px; padding: 22px 26px; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05); display: grid; grid-template-columns: 58px 140px 1fr; gap: 20px; align-items: center;">
        <div class="app-squircle sq-cohere">
          <img src="{{ logos.cohere }}" alt="Cohere">
        </div>
        <div style="background: rgba(88, 72, 250, 0.08); color: #5848FA; font-family: 'JetBrains Mono', monospace; font-size: 17px; font-weight: 800; padding: 10px 14px; border-radius: 10px; text-align: center;">
          FILTRO 2
        </div>
        <div>
          <h3 style="font-size: 28px; font-weight: 800; color: #0F172A;">Cross-Encoder Re-Ranking (Cohere)</h3>
          <p style="font-size: 23px; color: #475569; margin-top: 6px; line-height: 1.45;">
            Modelo de scoring semántico que reordena fragmentos y descarta el 80% del texto irrelevante antes de alimentar al modelo generativo.
          </p>
        </div>
      </div>

      <div style="background: #FFFFFF; border: 1.5px solid #E2E8F0; border-radius: 18px; padding: 22px 26px; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05); display: grid; grid-template-columns: 58px 140px 1fr; gap: 20px; align-items: center;">
        <div class="app-squircle sq-pydantic">
          <img src="{{ logos.pydantic }}" alt="Pydantic">
        </div>
        <div style="background: rgba(88, 72, 250, 0.08); color: #5848FA; font-family: 'JetBrains Mono', monospace; font-size: 17px; font-weight: 800; padding: 10px 14px; border-radius: 10px; text-align: center;">
          FILTRO 3
        </div>
        <div>
          <h3 style="font-size: 28px; font-weight: 800; color: #0F172A;">Validación Determinista Pydantic</h3>
          <p style="font-size: 23px; color: #475569; margin-top: 6px; line-height: 1.45;">
            Si la respuesta no mapea contra el esquema exacto o la confianza cae bajo 95%, el sistema bloquea y deriva al equipo humano.
          </p>
        </div>
      </div>
    </div>

    <!-- CODE SNIPPET TERMINAL -->
    <div style="background: #12121A; border-radius: 16px; padding: 18px 24px; display: flex; align-items: center; justify-content: space-between;">
      <span style="font-family: 'JetBrains Mono', monospace; font-size: 20px; font-weight: 700; color: #FAF9F6;">
        guardrail.validate(response, threshold=0.95) ➔ 0.0% Alucinaciones
      </span>
      <span style="font-family: 'Caveat', cursive; font-size: 34px; font-weight: 700; color: #B7FF3C;">
        Cero margen de error →
      </span>
    </div>
  </main>

  {% elif slide_num == 4 %}
  <!-- SLIDE 4: COMPARATIVA EN PRODUCCIÓN -->
  <main style="position: relative; z-index: 10; margin-top: 15px; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
    <div class="washi-note" style="top: -10px; right: 0; transform: rotate(1.5deg);">
      <div class="washi-tape"></div>
      <div class="washi-title">BENCHMARK</div>
      <div class="washi-desc">Ensayos en clientes<br>reales de PEBAI.</div>
    </div>

    <div style="max-width: 700px;">
      <h2 style="font-family: 'Instrument Serif', Georgia, serif; font-size: 68px; font-weight: 400; color: #0F172A; line-height: 1.0;">
        Paso 2: Comparativa
      </h2>
      <h1 style="font-size: 78px; font-weight: 800; line-height: 0.95; letter-spacing: -0.03em; background: linear-gradient(135deg, #5848FA 0%, #12121A 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-transform: uppercase; margin-top: 4px;">
        En Producción
      </h1>
      <div class="double-divider" style="margin-top: 12px; margin-bottom: 20px;"></div>
    </div>

    <!-- COMPARISON TABLE CARD -->
    <div style="background: #FFFFFF; border: 2px solid rgba(88, 72, 250, 0.15); border-radius: 20px; padding: 26px 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 16px;">
      <div style="display: grid; grid-template-columns: 240px 1fr 1fr; gap: 16px; padding-bottom: 12px; border-bottom: 2px solid #E2E8F0; font-family: 'JetBrains Mono', monospace; font-size: 18px; font-weight: 800;">
        <span style="color: #64748B;">MÉTRICA</span>
        <span style="color: #DC2626;">RAG DIRECTO</span>
        <span style="color: #5848FA;">PIPELINE PEBAI</span>
      </div>

      <div style="display: grid; grid-template-columns: 240px 1fr 1fr; gap: 16px; align-items: center; font-size: 22px; padding: 8px 0; border-bottom: 1px solid #F1F5F9;">
        <span style="font-weight: 700; color: #0F172A;">Tasa Alucinación</span>
        <span style="color: #DC2626; font-weight: 800; font-family: 'JetBrains Mono', monospace;">14.2%</span>
        <span style="color: #12121A; background: #B7FF3C; font-weight: 900; font-family: 'JetBrains Mono', monospace; padding: 4px 10px; border-radius: 6px; display: inline-block; width: fit-content;">0.0%</span>
      </div>

      <div style="display: grid; grid-template-columns: 240px 1fr 1fr; gap: 16px; align-items: center; font-size: 22px; padding: 8px 0; border-bottom: 1px solid #F1F5F9;">
        <span style="font-weight: 700; color: #0F172A;">Confianza Cláusulas</span>
        <span style="color: #64748B; font-weight: 700;">Variable</span>
        <span style="color: #5848FA; font-weight: 800;">Determinista 100%</span>
      </div>

      <div style="display: grid; grid-template-columns: 240px 1fr 1fr; gap: 16px; align-items: center; font-size: 22px; padding: 8px 0; border-bottom: 1px solid #F1F5F9;">
        <span style="font-weight: 700; color: #0F172A;">Auditoría de Fuentes</span>
        <span style="color: #DC2626; font-weight: 700;">Opaca</span>
        <span style="color: #5848FA; font-weight: 800;">Trazable por Párrafo</span>
      </div>

      <div style="display: grid; grid-template-columns: 240px 1fr 1fr; gap: 16px; align-items: center; font-size: 22px; padding: 8px 0;">
        <span style="font-weight: 700; color: #0F172A;">Riesgo Comercial</span>
        <span style="color: #DC2626; font-weight: 800;">Crítico</span>
        <span style="color: #12121A; background: #B7FF3C; font-weight: 900; padding: 4px 10px; border-radius: 6px; display: inline-block; width: fit-content;">Blindado</span>
      </div>
    </div>

    <!-- SUMMARY -->
    <div style="background: #FFFFFF; border: 1.5px solid rgba(88, 72, 250, 0.2); border-radius: 16px; padding: 18px 24px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);">
      <div style="display: flex; align-items: center; gap: 14px;">
        <div class="app-squircle sm sq-pebai">
          <img src="{{ logos.python }}" alt="PEBAI">
        </div>
        <span style="font-size: 22px; font-weight: 700; color: #0F172A;">
          Garantizamos fiabilidad de datos mediante contratos de validación matemática en código.
        </span>
      </div>
      <span style="font-family: 'Caveat', cursive; font-size: 34px; font-weight: 700; color: #5848FA;">Cero margen de error →</span>
    </div>
  </main>

  {% elif slide_num == 5 %}
  <!-- SLIDE 5: CIERRE MIXTO CON 0€ Y COMENTA CONSULTORÍA -->
  <main style="position: relative; z-index: 10; margin-top: 15px; flex: 1; display: flex; flex-direction: column; justify-content: space-between; text-align: center;">
    <div>
      <div style="display: inline-flex; align-items: center; gap: 10px; background: #12121A; border: 2px solid #5848FA; padding: 10px 28px; border-radius: 9999px; font-size: 20px; font-weight: 800; color: #FFFFFF; text-transform: uppercase;">
        <span style="width: 10px; height: 10px; border-radius: 50%; background: #B7FF3C; box-shadow: 0 0 10px #B7FF3C;"></span>
        5 PLAZAS DISPONIBLES ESTE MES
      </div>

      <h1 style="font-family: 'Instrument Serif', Georgia, serif; font-size: 72px; font-weight: 400; color: #0F172A; line-height: 1.05; margin-top: 16px;">
        ¿Necesitas Blindar tu<br><span style="font-style: italic; color: #5848FA;">Asistente en Producción?</span>
      </h1>
      <div class="double-divider" style="max-width: 600px; margin: 14px auto 20px auto;"></div>
    </div>

    <!-- MASSIVE 0€ DELIVERABLE TICKET -->
    <div style="background: #FFFFFF; border: 2.5px solid #5848FA; border-radius: 24px; padding: 26px 30px; box-shadow: 0 20px 45px -10px rgba(88, 72, 250, 0.15); text-align: left; display: flex; flex-direction: column; gap: 16px;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1.5px solid #F1F5F9; padding-bottom: 14px;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div class="app-squircle lg sq-googlemeet">
            <img src="{{ logos.googlemeet }}" alt="Google Meet">
          </div>
          <div>
            <div style="font-size: 16px; font-weight: 800; color: #64748B; text-transform: uppercase;">SESIÓN TÉCNICA 1 A 1 EN VIVO</div>
            <div style="font-size: 28px; font-weight: 800; color: #0F172A;">25 Minutos de Consultoría Privada</div>
          </div>
        </div>

        <div style="background: #B7FF3C; border: 2px solid #12121A; border-radius: 14px; padding: 10px 24px; text-align: center; box-shadow: 0 8px 20px rgba(183, 255, 60, 0.4);">
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 42px; font-weight: 900; color: #12121A; line-height: 1;">0 €</div>
          <div style="font-size: 16px; font-weight: 900; color: #12121A; text-transform: uppercase;">COSTE CERO</div>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 10px;">
        <div style="display: flex; align-items: center; gap: 12px; font-size: 23px; font-weight: 700; color: #1E293B;">
          <span style="color: #5848FA; font-size: 24px;">✔</span> Revisamos tu pipeline actual de RAG y fuentes de conocimiento.
        </div>
        <div style="display: flex; align-items: center; gap: 12px; font-size: 23px; font-weight: 700; color: #1E293B;">
          <span style="color: #5848FA; font-size: 24px;">✔</span> Te entregamos la arquitectura exacta para erradicar alucinaciones.
        </div>
        <div style="display: flex; align-items: center; gap: 12px; font-size: 23px; font-weight: 700; color: #1E293B;">
          <span style="color: #5848FA; font-size: 24px;">✔</span> Sin coste alguno ni compromiso comercial posterior.
        </div>
      </div>

      <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 12px 18px; font-size: 21px; font-weight: 700; color: #64748B;">
        Requisito: Empresa con datos propios o asistente en desarrollo/producción.
      </div>
    </div>

    <!-- CTA BUTTON -->
    <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
      <div style="display: inline-flex; align-items: center; gap: 18px; background: #12121A; border: 2.5px solid #5848FA; color: #FFFFFF; padding: 20px 48px; border-radius: 9999px; box-shadow: 0 20px 45px -10px rgba(15, 23, 42, 0.45);">
        <span style="font-size: 26px; font-weight: 800; letter-spacing: 0.02em;">COMENTA</span>
        <span style="font-family: 'JetBrains Mono', monospace; font-size: 34px; font-weight: 900; color: #12121A; background: #B7FF3C; padding: 6px 24px; border-radius: 10px; border: 2px solid #B7FF3C; box-shadow: 0 4px 15px rgba(183, 255, 60, 0.5);">
          CONSULTORÍA
        </span>
      </div>

      <div style="font-family: 'Caveat', cursive; font-size: 36px; font-weight: 700; color: #5848FA;">
        Comenta CONSULTORÍA para solicitar una de las 5 plazas disponibles ↓
      </div>
    </div>
  </main>
  {% endif %}

  <!-- FOOTER -->
  <footer class="footer-bar">
    <div class="footer-left">
      <span style="font-family: 'JetBrains Mono', monospace; font-size: 15px; font-weight: 700; color: #5848FA;">@pebaisystems</span>
      <span>·</span>
      <span>Arquitectura Anti-Alucinación</span>
    </div>

    <div class="page-dots-wrap">
      {% for i in range(1, total_slides + 1) %}
        <div class="page-dot-item {% if i == slide_num %}active{% else %}inactive{% endif %}"></div>
      {% endfor %}
    </div>

    <div class="slide-num-text">
      {{ slide_num }} / {{ total_slides }}
    </div>
  </footer>
</body>
</html>
"""

with open("carousel-engine/templates/carrusel_mixto_v2_antihallucination.html.jinja", "w", encoding="utf-8") as f:
    f.write(mixto_template.strip())

print("carrusel_mixto_v2_antihallucination.html.jinja successfully written!")
