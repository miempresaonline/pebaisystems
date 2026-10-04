#!/usr/bin/env python3
"""
PEBAI SYSTEMS - GENERADOR DE CARRUSELES A MEDIDA DE ALTA TECNOLOGÍA
Revisa Google Sheets, localiza las ideas marcadas como 'PUBLICAR' con HORA asignada
(o procesa una idea específica vía --id), diseña un carrusel a medida con nivel visual
moderno (Dark Tech / Glassmorphism / Diagramas Miro / Métricas ROI / Pilares),
renderiza las 5 diapositivas en alta resolución (1080x1440), genera el pie de foto,
hace push de los activos a GitHub y actualiza directamente la fila del Google Sheet.
"""

import os
import sys
import json
import time
import argparse
import subprocess
from datetime import datetime
import urllib.request
import urllib.parse
from jinja2 import Template

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

DEFAULT_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbzI9PH8bdUa3LCzSVjj0-lISwPgXLvFeXQ4sv49qJOy-VcvbEIYic7pgvMBkr-a0mOIzQ/exec"
DEFAULT_SPREADSHEET_ID = "110nBsx3YGGohHHMzjDNzAKL_Nj87gt_CYjWREqnbHjM"

SPANISH_MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

def get_current_month_name() -> str:
    now = datetime.now()
    return f"{SPANISH_MONTHS[now.month - 1]} {now.year}"

def query_approved_ideas(webhook_url: str, month: str) -> list:
    """Consulta las ideas aprobadas listas para producir (estado PUBLICAR con hora)."""
    import requests
    params = {"action": "get_approved", "month": month}
    try:
        r = requests.get(webhook_url, params=params, timeout=25)
        data = r.json()
        return data.get("approved", [])
    except Exception as e:
        print(f"[AVISO] Error al consultar ideas aprobadas vía webhook: {e}")
        return []

def fetch_sheet_rows_csv(sheet_id: str = DEFAULT_SPREADSHEET_ID) -> list:
    """Descarga el contenido de la hoja como CSV para localizar ideas directamente."""
    import csv
    import io
    url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            content = r.read().decode("utf-8")
        rows = list(csv.reader(io.StringIO(content)))
        if not rows or len(rows) <= 1:
            return []
        items = []
        for r in rows[1:]:
            if len(r) >= 6 and r[0].strip():
                items.append({
                    "id": r[0].strip(),
                    "fecha_propuesta": r[1].strip() if len(r) > 1 else "",
                    "tipo": r[2].strip() if len(r) > 2 else "B2B",
                    "gancho": r[3].strip() if len(r) > 3 else "",
                    "desarrollo": r[4].strip() if len(r) > 4 else "",
                    "formato": r[5].strip() if len(r) > 5 else "",
                    "fuente": r[6].strip() if len(r) > 6 else "",
                    "estado": r[7].strip() if len(r) > 7 else "PENDIENTE"
                })
        return items
    except Exception as e:
        print(f"[AVISO] No se pudo leer CSV de Google Sheets: {e}")
        return []

def deliver_to_sheet(webhook_url: str, month: str, item_id: str, link_slides: str, copy_text: str):
    """Actualiza la fila en Google Sheets con el enlace de descarga, el copy y estado PUBLICADO."""
    import requests
    payload = {
        "action": "deliver_carousel",
        "month": month,
        "id": item_id,
        "link_slides": link_slides,
        "copy_text": copy_text,
        "estado": "PUBLICADO"
    }
    r = requests.post(webhook_url, data=json.dumps(payload), timeout=25)
    return r.json()

def git_commit_and_push(item_id: str):
    """Sincroniza la carpeta del carrusel con el repositorio remoto de GitHub."""
    target_rel = os.path.relpath(os.path.join(OUTPUT_DIR, item_id), os.path.abspath(os.path.join(BASE_DIR, "..")))
    print(f"\n[GIT] Registrando y subiendo activos a GitHub ({target_rel})...")
    try:
        subprocess.run(["git", "add", target_rel], check=False, cwd=os.path.abspath(os.path.join(BASE_DIR, "..")))
        msg = f"feat(carousel): auto-render {item_id} assets"
        subprocess.run(["git", "commit", "-m", msg], check=False, cwd=os.path.abspath(os.path.join(BASE_DIR, "..")))
        res = subprocess.run(["git", "push", "origin", "main"], capture_output=True, text=True, cwd=os.path.abspath(os.path.join(BASE_DIR, "..")))
        if res.returncode == 0:
            print("[GIT] Push completado con exito en origin/main.")
        else:
            print(f"[GIT] Aviso en push: {res.stderr.strip() or res.stdout.strip()}")
    except Exception as e:
        print(f"[AVISO GIT] Error durante la sincronizacion git: {e}")

def design_bespoke_carousel_content(idea: dict, api_key: str) -> dict:
    """Utiliza Gemini para planificar la narrativa y el diseno visual exacto de cada diapositiva."""
    prompt = f"""Eres el Director de Arte y Estratega Visual Senior de PEBAI Systems (consultora e ingenieria de IA, automatizacion y formacion bonificada FUNDAE para empresas).

MISION:
Disenar el guion estructurado y la direccion visual para un carrusel de 5 diapositivas en alta resolucion (1080x1440) para Instagram y TikTok.
El diseno DEBE ser de vanguardia: estilo Dark Tech UI, Glassmorphism, Diagramas Miro y Arquitectura de Procesos.
ESTA ESTRICTAMENTE PROHIBIDO cualquier elemento de cuaderno, papel o boligrafo.
PROHIBIDO EL USO DE CUALQUIER EMOJI en los textos, titulares y pie de foto.

IDEA APROBADA:
- ID: {idea.get('id')}
- Tipo: {idea.get('tipo')}
- Gancho Portada: {idea.get('gancho')}
- Desarrollo: {idea.get('desarrollo')}
- Formato Visual Guia: {idea.get('formato')}

ESTRUCTURA DE LAS 5 DIAPOSITIVAS:
Slide 1 (Portada de Alto Impacto):
  - Badge de categoria (ej. "INGENIERIA DE PROCESOS" o "RADAR ESTRATEGICO").
  - Titular imponente con palabras clave de choque (maximo 12-16 palabras).
  - Subline explicativa que contextualice el problema real.
  - Hero Tag (ej. "INFORME DE PRODUCTIVIDAD B2B").
  - Indicador de swipe (ej. "DESLIZA HACIA LA DERECHA").

Slide 2 (El Cuello de Botella / Problema Operativo):
  - Badge: "EL CUELLO DE BOTELLA".
  - Titular analitico del dolor en la empresa.
  - Metrica destacada grande con etiqueta (ej. "80%", "Perdida de retencion a los 3 dias" o "15h", "Desperdicio semanal por empleado").
  - 2 o 3 bullets concisos con las fricciones tecnicas u organizativas.

Slide 3 (Arquitectura de Flujo / Solucion Conectada / Miro):
  - Badge: "ARQUITECTURA DE FLUJO".
  - Titular técnico de la transformacion o solución de PEBAI.
  - Pasos del flujo (2 o 3 nodos con 'from', 'to' y 'status': "Antes" vs "Metodo PEBAI").
  - Nota de arquitectura al pie (ej. "Flujo auditado e implementado por ingenieros de PEBAI Systems").

Slide 4 (Ventaja Competitiva / 3 Pilares de Transformacion):
  - Badge: "VENTAJA COMPETITIVA".
  - Titular del impacto cuantitativo y cualitativo.
  - 3 pilares clave estructurados con:
    * num ("01", "02", "03")
    * title (ej. "100% Bonificable FUNDAE", "Habilitacion en Puesto Real", "Independencia Operativa")
    * desc (explicacion corta y rotunda de 1-2 lineas)

Slide 5 (Diagnostico Estrategico / Llamada a la Accion):
  - Badge: "DIAGNOSTICO ESTRATEGICO".
  - Titular de cierre de alta autoridad (ej. "Audita los procesos de tu empresa a coste cero").
  - Badge de escasez (ej. "PLAZAS LIMITADAS: 5 EMPRESAS AL MES").
  - Boton CTA con texto claro (ej. "Comenta FORMACION" o "Comenta CONSULTORIA").
  - Detalle: "Sesion tecnica privada de 45 minutos con nuestros ingenieros. Diagnosticamos tus flujos y planificamos la implementacion."
  - Garantia de cierre: "Sesion tecnica sin coste &bull; Analisis de viabilidad &bull; Sin compromiso".

COPY DEL POST (PIE DE FOTO):
Texto persuasivo de 120-170 palabras sin emojis:
- Gancho directo de apertura.
- 3 puntos clave de valor con bullets tipo guion o punto medio.
- Llamada a la accion: "Comenta CONSULTORIA (o FORMACION) y te enviamos el enlace para auditar tus flujos de trabajo."
- 8 a 10 hashtags tecnicos B2B (#InteligenciaArtificial #PEBAISystems #AutomatizacionB2B #IngenieriaDeProcesos #FormacionBonificada #FUNDAE #ProductividadEmpresarial #TechConsulting).

Devuelve UNICAMENTE un JSON valido con esta estructura exacta:
{{
  "slides": [
    {{
      "number": 1,
      "tag": "RADAR ESTRATEGICO B2B",
      "headline": "Titular de portada imponente",
      "subline": "Frase de apoyo que contextualiza el impacto",
      "hero_tag": "INFORME DE PRODUCTIVIDAD B2B",
      "swipe_text": "DESLIZA HACIA LA DERECHA",
      "accent_label": "01 / 05"
    }},
    {{
      "number": 2,
      "tag": "EL CUELLO DE BOTELLA",
      "headline": "Titular de la radiografia del problema",
      "metric_number": "80%",
      "metric_label": "Perdida de conocimiento a los 3 dias",
      "bullet_points": ["Friccion 1 explicada con dato", "Friccion 2 explicada con claridad"],
      "accent_label": "02 / 05"
    }},
    {{
      "number": 3,
      "tag": "ARQUITECTURA DE FLUJO",
      "headline": "La solucion mediante integracion continua",
      "flow_steps": [
        {{"from": "Curso grabado teorico de 8h", "to": "0% aplicacion practica en la empresa", "status": "Antes"}},
        {{"from": "Habilitacion directa en puesto", "to": "Automatizaciones en vivo desde semana 1", "status": "Metodo PEBAI"}}
      ],
      "flow_note": "Flujo auditado e implementado por ingenieros de PEBAI Systems",
      "accent_label": "03 / 05"
    }},
    {{
      "number": 4,
      "tag": "VENTAJA COMPETITIVA",
      "headline": "El retorno real de la inversion en tus sistemas",
      "pillars": [
        {{"num": "01", "title": "Bonificacion 100% FUNDAE", "desc": "Financiado integramente con los creditos de formacion de la empresa. Coste directo 0 euros."}},
        {{"num": "02", "title": "Habilitacion en Puesto Real", "desc": "Tus empleados construyen herramientas reales para sus tareas diarias."}},
        {{"num": "03", "title": "Independencia Operativa", "desc": "El conocimiento queda dentro de la empresa, sin depender de consultoras externas."}}
      ],
      "accent_label": "04 / 05"
    }},
    {{
      "number": 5,
      "tag": "DIAGNOSTICO ESTRATEGICO",
      "headline": "Audita los procesos de tu empresa a coste cero",
      "cta_badge": "PLAZAS LIMITADAS: 5 EMPRESAS AL MES",
      "cta_text": "Comenta FORMACION",
      "details": "Sesion tecnica privada de 45 minutos con nuestros ingenieros. Diagnosticamos tus flujos y planificamos la implementacion.",
      "guarantee": "Sesion tecnica sin coste &bull; Analisis de viabilidad &bull; Sin compromiso",
      "accent_label": "05 / 05"
    }}
  ],
  "caption": "Texto completo del pie de foto con llamada a la accion y hashtags"
}}
"""

    models_to_try = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite"]
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.25}
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

# Plantilla HTML maestra con CSS ultra moderno (Dark Tech / Glassmorphism / Miro Architecture)
HTML_SLIDE_TEMPLATE = """
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1080px;
      height: 1440px;
      background: #080B11;
      color: #F1F5F9;
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 72px 76px;
      -webkit-font-smoothing: antialiased;
    }

    /* Fondo tecnologico con micro-cuadricula y resplandor sutil */
    body::before {
      content: "";
      position: absolute;
      inset: 0;
      background-image: 
        radial-gradient(circle at 85% 15%, rgba(0, 210, 255, 0.12) 0%, transparent 45%),
        radial-gradient(circle at 15% 85%, rgba(59, 130, 246, 0.10) 0%, transparent 45%),
        linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px);
      background-size: 100% 100%, 100% 100%, 48px 48px, 48px 48px;
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
      gap: 12px;
      padding: 11px 22px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 100px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #00D2FF;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }
    .badge-tag::before {
      content: "";
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #00D2FF;
      box-shadow: 0 0 12px #00D2FF;
    }
    .page-indicator {
      font-family: 'JetBrains Mono', monospace;
      font-size: 16px;
      font-weight: 800;
      color: rgba(255, 255, 255, 0.45);
      letter-spacing: 0.1em;
    }

    /* Main Content */
    .content {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      gap: 36px;
      margin: auto 0;
    }

    /* Titular Principal */
    .main-headline {
      font-size: 56px;
      font-weight: 800;
      line-height: 1.14;
      letter-spacing: -0.035em;
      color: #FFFFFF;
    }
    .headline-hero {
      font-size: 64px;
      line-height: 1.12;
    }

    /* Hero Slide Elements (Slide 1) */
    .hero-pill {
      display: inline-flex;
      align-items: center;
      padding: 8px 18px;
      background: rgba(0, 210, 255, 0.08);
      border: 1px solid rgba(0, 210, 255, 0.25);
      border-radius: 6px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.15em;
      color: #00D2FF;
      width: fit-content;
    }
    .hero-subline-box {
      background: rgba(18, 24, 38, 0.7);
      border-left: 4px solid #00D2FF;
      border-radius: 0 16px 16px 0;
      padding: 24px 30px;
      font-size: 24px;
      line-height: 1.45;
      color: #94A3B8;
      backdrop-filter: blur(15px);
    }
    .swipe-indicator {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      margin-top: 10px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      font-weight: 700;
      color: #00D2FF;
      letter-spacing: 0.12em;
    }
    .swipe-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #00D2FF;
      box-shadow: 0 0 14px #00D2FF;
    }

    /* Subline comun */
    .subline {
      font-size: 24px;
      line-height: 1.45;
      color: #94A3B8;
      font-weight: 500;
    }

    /* Cards and Glassmorphism Containers */
    .glass-card {
      background: rgba(16, 22, 35, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 24px;
      padding: 34px 38px;
      backdrop-filter: blur(20px);
      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.5);
    }

    .bullet-item {
      display: flex;
      align-items: flex-start;
      gap: 18px;
      font-size: 23px;
      line-height: 1.45;
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

    /* Metric Card (Slide 2) */
    .metric-box {
      display: flex;
      align-items: center;
      gap: 30px;
      padding: 26px 34px;
      background: rgba(0, 210, 255, 0.04);
      border: 1px solid rgba(0, 210, 255, 0.25);
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0, 210, 255, 0.05);
    }
    .metric-value {
      font-size: 60px;
      font-weight: 800;
      font-family: 'JetBrains Mono', monospace;
      color: #00D2FF;
      line-height: 1;
    }
    .metric-text {
      font-size: 21px;
      color: #E2E8F0;
      font-weight: 600;
      line-height: 1.35;
    }

    /* Miro Architecture Flow (Slide 3) */
    .miro-board {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .flow-card {
      background: rgba(16, 22, 35, 0.75);
      border-radius: 20px;
      padding: 24px 30px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(15px);
    }
    .flow-card-before {
      border-left: 4px solid #EF4444;
      background: rgba(239, 68, 68, 0.04);
    }
    .flow-card-after {
      border-left: 4px solid #00D2FF;
      background: rgba(0, 210, 255, 0.05);
      box-shadow: 0 10px 30px rgba(0, 210, 255, 0.05);
    }
    .flow-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .flow-step-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      font-weight: 700;
      padding: 5px 12px;
      border-radius: 6px;
      text-transform: uppercase;
    }
    .flow-card-before .flow-step-tag {
      background: rgba(239, 68, 68, 0.15);
      color: #F87171;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
    .flow-card-after .flow-step-tag {
      background: rgba(0, 210, 255, 0.15);
      color: #00D2FF;
      border: 1px solid rgba(0, 210, 255, 0.3);
    }
    .flow-card-id {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      color: #64748B;
      font-weight: 700;
    }
    .flow-card-body {
      font-size: 21px;
      font-weight: 600;
      color: #CBD5E1;
      margin-bottom: 6px;
    }
    .flow-card-arrow {
      font-size: 18px;
      color: #64748B;
      margin-bottom: 6px;
    }
    .flow-card-result {
      font-size: 22px;
      font-weight: 700;
      color: #FFFFFF;
    }
    .architecture-note {
      font-size: 15px;
      color: #64748B;
      font-family: 'JetBrains Mono', monospace;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      text-align: right;
    }

    /* Pillars of Transformation (Slide 4) */
    .pillar-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .pillar-card {
      display: flex;
      align-items: flex-start;
      gap: 24px;
      background: rgba(16, 22, 35, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      padding: 24px 28px;
      backdrop-filter: blur(15px);
    }
    .pillar-num {
      font-family: 'JetBrains Mono', monospace;
      font-size: 32px;
      font-weight: 800;
      color: #00D2FF;
      line-height: 1;
      padding-top: 4px;
    }
    .pillar-info {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .pillar-title {
      font-size: 22px;
      font-weight: 700;
      color: #FFFFFF;
    }
    .pillar-desc {
      font-size: 18px;
      color: #94A3B8;
      line-height: 1.4;
    }

    /* CTA Slide (Slide 5) */
    .cta-box {
      text-align: center;
      padding: 56px 44px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 22px;
    }
    .cta-badge {
      display: inline-block;
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      color: #00D2FF;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      font-weight: 700;
      background: rgba(0, 210, 255, 0.08);
      padding: 8px 18px;
      border-radius: 100px;
      border: 1px solid rgba(0, 210, 255, 0.25);
    }
    .cta-button {
      display: inline-block;
      padding: 22px 54px;
      background: linear-gradient(135deg, #00D2FF 0%, #3B82F6 100%);
      color: #080B11;
      font-size: 30px;
      font-weight: 800;
      border-radius: 100px;
      letter-spacing: -0.01em;
      box-shadow: 0 10px 35px rgba(0, 210, 255, 0.45);
    }
    .cta-details {
      font-size: 21px;
      color: #CBD5E1;
      line-height: 1.45;
      max-width: 820px;
    }
    .cta-guarantee {
      font-size: 15px;
      color: #64748B;
      font-family: 'JetBrains Mono', monospace;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding-top: 10px;
    }

    /* Footer */
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 28px;
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
      letter-spacing: 0.06em;
      color: #FFFFFF;
    }
    .brand-mark span { color: #00D2FF; }
    .footer-note {
      font-size: 14px;
      color: #64748B;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      font-family: 'JetBrains Mono', monospace;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="badge-tag">{{ slide.tag|default("PEBAI SYSTEMS") }}</div>
    <div class="page-indicator">{{ slide.accent_label|default("01 / 05") }}</div>
  </div>

  <div class="content">
    {% if slide.number == 1 %}
      <div class="hero-pill">{{ slide.hero_tag|default("INFORME DE PRODUCTIVIDAD B2B") }}</div>
      <h1 class="main-headline headline-hero">{{ slide.headline }}</h1>
      <div class="hero-subline-box">{{ slide.subline }}</div>
      <div class="swipe-indicator">
        <div class="swipe-dot"></div>
        <span>{{ slide.swipe_text|default("DESLIZA HACIA LA DERECHA &rarr;") }}</span>
      </div>
    {% else %}
      <h1 class="main-headline">{{ slide.headline }}</h1>
      
      {% if slide.subline %}
        <p class="subline">{{ slide.subline }}</p>
      {% endif %}

      {% if slide.metric_number %}
        <div class="metric-box">
          <div class="metric-value">{{ slide.metric_number }}</div>
          <div class="metric-text">{{ slide.metric_label }}</div>
        </div>
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

      {% if slide.flow_steps %}
        <div class="miro-board">
          {% for step in slide.flow_steps %}
            <div class="flow-card {% if 'PEBAI' in step.status or 'Optimizado' in step.status %}flow-card-after{% else %}flow-card-before{% endif %}">
              <div class="flow-card-header">
                <span class="flow-step-tag">{{ step.status }}</span>
                <span class="flow-card-id">NODO 0{{ loop.index }}</span>
              </div>
              <div class="flow-card-body">{{ step.from }}</div>
              <div class="flow-card-arrow">&darr;</div>
              <div class="flow-card-result">{{ step.to }}</div>
            </div>
          {% endfor %}
        </div>
        {% if slide.flow_note %}
          <div class="architecture-note">{{ slide.flow_note }}</div>
        {% endif %}
      {% endif %}

      {% if slide.pillars %}
        <div class="pillar-container">
          {% for p in slide.pillars %}
            <div class="pillar-card">
              <div class="pillar-num">{{ p.num }}</div>
              <div class="pillar-info">
                <div class="pillar-title">{{ p.title }}</div>
                <div class="pillar-desc">{{ p.desc }}</div>
              </div>
            </div>
          {% endfor %}
        </div>
      {% endif %}

      {% if slide.cta_text %}
        <div class="glass-card cta-box">
          <div class="cta-badge">{{ slide.cta_badge|default("PLAZAS LIMITADAS: 5 EMPRESAS AL MES") }}</div>
          <div class="cta-button">{{ slide.cta_text }}</div>
          <p class="cta-details">{{ slide.details }}</p>
          <div class="cta-guarantee">{{ slide.guarantee|default("Sesion tecnica sin coste &bull; Analisis de viabilidad &bull; Sin compromiso") }}</div>
        </div>
      {% endif %}
    {% endif %}
  </div>

  <div class="footer">
    <div class="brand-mark">PEBAI <span>SYSTEMS</span></div>
    <div class="footer-note">Ingenieria de Procesos e IA</div>
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
    
    print(f"\n[DISENO] Planificando carrusel a medida para ID: {item_id}...")
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
        
    print(f"[RENDER] Generando {len(tasks)} diapositivas en alta resolucion (1080x1440)...")
    render_slides(tasks)
    
    # Guardar copy
    caption_path = os.path.join(target_folder, "caption.txt")
    with open(caption_path, "w", encoding="utf-8") as f:
        f.write(caption)
        
    # Crear un visor HTML ligero para descargar todo desde el movil en 1 clic
    viewer_path = os.path.join(target_folder, "index.html")
    with open(viewer_path, "w", encoding="utf-8") as f:
        f.write(f"""<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
        <title>{idea.get('gancho')} - PEBAI Systems</title>
        <style>body{{font-family:-apple-system,sans-serif;background:#080B11;color:#F1F5F9;padding:24px;text-align:center}}
        h2{{font-size:20px;margin-bottom:8px}}
        p{{color:#94A3B8;font-size:14px;margin-bottom:20px}}
        img{{width:100%;max-width:480px;border-radius:16px;margin-bottom:12px;box-shadow:0 10px 30px rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.08)}}
        .btn{{background:#00D2FF;color:#080B11;font-weight:700;padding:12px 24px;border-radius:30px;text-decoration:none;display:inline-block;margin-bottom:24px;font-size:14px}}
        pre{{background:#101623;padding:16px;border-radius:12px;text-align:left;white-space:pre-wrap;font-size:14px;color:#CBD5E1;border:1px solid rgba(255,255,255,0.08)}}
        </style></head><body>
        <h2>{idea.get('gancho')}</h2>
        <p>Diapositivas de alta resolucion (guardalas en tu movil en orden 1 a 5):</p>
        {''.join([f'<p><img src="slide_{i}.png"><br><a class="btn" href="slide_{i}.png" download>Descargar Diapositiva {i}</a></p>' for i in range(1, len(slides)+1)])}
        <h3 style="margin-top:30px;text-align:left">Pie de foto (Copy listo para pegar):</h3>
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
    parser.add_argument("--id", type=str, default=None, help="ID especifico a generar (ej. RAD-20261004-04)")
    args = parser.parse_args()

    month = args.month or get_current_month_name()
    webhook_url = os.environ.get("GSHEET_WEBHOOK_URL", DEFAULT_WEBHOOK_URL)
    api_key = os.environ.get("GEMINI_API_KEY")

    if not api_key:
        local_env = os.path.abspath(os.path.join(BASE_DIR, "..", "whatsapp-outreach-bot", ".env"))
        if os.path.exists(local_env):
            with open(local_env, "r", encoding="utf-8") as f:
                for line in f:
                    if line.startswith("GEMINI_API_KEY="):
                        api_key = line.strip().split("=", 1)[1]
                        break

    if not api_key:
        print("[ERROR] GEMINI_API_KEY es requerida para el diseno de carruseles.")
        sys.exit(1)

    print("=======================================================")
    print("[PEBAI SYSTEMS] MOTOR PRODUCTOR DE CARRUSELES A MEDIDA")
    print("=======================================================")
    print(f"Pestana de trabajo: {month}")

    to_process = []
    
    # Si se pide un ID específico
    if args.id:
        print(f"Buscando ID especifico: {args.id}...")
        # Primero probar via webhook get_approved
        approved = query_approved_ideas(webhook_url, month)
        for item in approved:
            if item.get("id") == args.id:
                to_process.append(item)
                break
                
        # Si no esta en approved, buscar en el CSV general de la hoja
        if not to_process:
            print(f"[INFO] ID {args.id} no estaba en get_approved. Consultando CSV de Google Sheets...")
            csv_rows = fetch_sheet_rows_csv(DEFAULT_SPREADSHEET_ID)
            for r in csv_rows:
                if r.get("id") == args.id:
                    to_process.append(r)
                    break
                    
        if not to_process:
            print(f"[ERROR] No se encontro el ID {args.id} en la hoja de calculo.")
            sys.exit(1)
    else:
        approved = query_approved_ideas(webhook_url, month)
        if not approved:
            print("No hay carruseles con estado PUBLICAR y HORA asignada pendientes de procesar.")
            return
        to_process = approved

    print(f"Carruseles a procesar: {len(to_process)}")
    for item in to_process:
        item_id = item.get("id")
        print(f"\n=======================================================")
        print(f">>> PROCESANDO: {item_id}")
        print(f"Gancho: {item.get('gancho')}")
        print(f"Formato: {item.get('formato')}")
        print("=======================================================")
        
        bundle = generate_carousel_bundle(item, api_key)
        
        # Subir a GitHub
        git_commit_and_push(item_id)
        
        # Link para descargar desde el móvil
        github_link = f"https://github.com/miempresaonline/pebaisystems/tree/main/carousel-engine/output/{item_id}"
        
        print("\n[ENTREGA] Actualizando fila en Google Sheets...")
        try:
            res = deliver_to_sheet(
                webhook_url=webhook_url,
                month=month,
                item_id=item_id,
                link_slides=github_link,
                copy_text=bundle.get("caption")
            )
            print(f"[OK] Fila en Google Sheets actualizada con exito: {res}")
        except Exception as e:
            print(f"[AVISO] Error al entregar en Google Sheets: {e}")

    print("\n[FIN] Proceso completado exitosamente.")

if __name__ == "__main__":
    main()
