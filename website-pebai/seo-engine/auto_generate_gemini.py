#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generador Autónomo de Landings SEO/GEO con Google Gemini API Oficial.
PEBAI Systems (https://pebaisystems.es)
Ejecución 100% headless por API: sin navegadores, sin ventanas, totalmente gratuito.
"""

import os
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), os.pardir, os.pardir, '.env'))
except ImportError:
    pass
import sys
import json
import urllib.request
import urllib.error
from datetime import date

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Importar Bóveda de APIs
sys.path.append("C:/programacion/APIs")
try:
    from api_helper import load_credentials, purge_cloudflare_cache
except ImportError:
    # Fallback si se ejecuta de forma aislada
    def load_credentials(p):
        return {
            "gemini_api_key": os.environ.get("GEMINI_API_KEY", ""),
            "gemini_default_model": "gemini-3.6-flash",
            "whatsapp_number": "34624842799",
            "domain": "pebaisystems.es"
        }
    def purge_cloudflare_cache():
        pass

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
WEBSITE_DIR = os.path.dirname(SCRIPT_DIR)
LOCAL_DIST = os.path.join(WEBSITE_DIR, "dist")
DATASET_PATH = os.path.join(SCRIPT_DIR, "pages_mass_data.json")

# Pool de palabras clave B2B de reserva para generación autónoma
CANDIDATE_KEYWORDS = [
    {
        "kw": "agencia inteligencia artificial farmacias parafarmacias",
        "title": "Agente de IA para Farmacias y Parafarmacias (Control de Stock y Consultas)",
        "slug": "agente-ia-farmacias-parafarmacias-consultas-stock",
        "sector": "Farmacia y Salud"
    },
    {
        "kw": "automatizacion contratos inmobiliarios agentes ia",
        "title": "Automatización de Contratos de Arrendamiento y Compraventa con IA",
        "slug": "automatizacion-contratos-inmobiliarios-agentes-ia",
        "sector": "Inmobiliario y Legal"
    },
    {
        "kw": "agente ia atencion al cliente concesionarios motos",
        "title": "Agente Telefónico de IA para Concesionarios y Talleres de Motos",
        "slug": "agente-ia-atencion-cliente-concesionarios-motos",
        "sector": "Automoción y Movilidad"
    },
    {
        "kw": "agente ia filtrado candidaturas hosteleria",
        "title": "Agente de IA para Selección de Personal y Camareros en Hostelería",
        "slug": "agente-ia-seleccion-personal-hosteleria-camareros",
        "sector": "Hostelería y Restauración"
    },
    {
        "kw": "sistema ia conciliacion bancaria facturas pymes",
        "title": "Sistema de IA para Conciliación Bancaria y Punteo de Facturas en Pymes",
        "slug": "sistema-ia-conciliacion-bancaria-facturas-pymes",
        "sector": "Finanzas y Contabilidad"
    }
]

def call_gemini_api(prompt, api_key, model="gemini-3.6-flash"):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json"
        }
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=30) as response:
        res_data = json.loads(response.read().decode())
        raw_text = res_data["candidates"][0]["content"]["parts"][0]["text"]
        return json.loads(raw_text)

def generate_next_landing():
    creds = load_credentials("pebai-systems")
    api_key = creds.get("gemini_api_key")
    model = creds.get("gemini_default_model", "gemini-3.6-flash")

    # Leer dataset existente para no duplicar
    existing_slugs = set()
    dataset = []
    if os.path.exists(DATASET_PATH):
        with open(DATASET_PATH, "r", encoding="utf-8") as f:
            dataset = json.load(f)
            existing_slugs = {p["slug"] for p in dataset}

    target = None
    for cand in CANDIDATE_KEYWORDS:
        if cand["slug"] not in existing_slugs:
            target = cand
            break

    if not target:
        print("ℹ️ Todas las palabras clave candidatas ya han sido generadas y publicadas.")
        return False

    print(f"🧠 Generando nueva landing con Gemini API ({model}): '{target['title']}'...")

    prompt = f"""
Actúa como Arquitecto Técnico Senior de PEBAI Systems (https://pebaisystems.es).
Genera los datos estructurados en formato JSON para una landing B2B de captación sobre:
Título: {target['title']}
Palabra Clave: {target['kw']}
Slug: {target['slug']}

REGLAS ESTRICTAS DE PEBAI SYSTEMS:
1. Hook de Respuesta Inmediata (exactamente entre 30 y 45 palabras): Debe responder de forma directa y numérica con costes reales (ej. 1.200 € a 4.500 €), plazos (7 a 14 días) y ROI menor a 90 días.
2. Entidades Reales: Mencionar GPT-4o, Claude 3.5 Sonnet, n8n, LangChain, Supabase pgvector, RGPD, AI Act europeo y NDA.
3. Tabla Comparativa: 3-4 filas con 'sistema', 'plazo', 'precio' e 'impacto'.
4. Fases: 3 pasos de despliegue ('Auditoría', 'Arquitectura', 'Producción').
5. FAQs: 3 preguntas frecuentes con respuestas concretas de alto valor.
6. WhatsApp Message: Mensaje preconfigurado para el lead.

Devuelve EXCLUSIVAMENTE este esquema JSON:
{{
  "rank_math_title": "Título SEO corto con | PEBAI Systems",
  "rank_math_description": "Meta descripción de 150 caracteres con cifras y llamada a la acción",
  "hook": "Párrafo de 30-45 palabras exactas",
  "entities": "Párrafo denso con entidades técnicas y marco legal UE",
  "table": [
    {{"sistema": "Nombre del Sistema", "plazo": "X días", "precio": "X € – Y €", "impacto": "Beneficio cuantitativo"}}
  ],
  "steps": [
    ["Nombre Fase 1", "Descripción detallada"],
    ["Nombre Fase 2", "Descripción detallada"],
    ["Nombre Fase 3", "Descripción detallada"]
  ],
  "faqs": [
    ["Pregunta 1", "Respuesta 1"],
    ["Pregunta 2", "Respuesta 2"],
    ["Pregunta 3", "Respuesta 3"]
  ],
  "whatsapp_msg": "Hola%2C%20vengo%20de%20la%20web%20y%20quiero%20información%20sobre..."
}}
"""

    result = call_gemini_api(prompt, api_key, model)

    # Importar el constructor de DOM de PEBAI
    from generate_dataset import build_page_html

    full_html = build_page_html(
        title=target["title"],
        hook=result["hook"],
        entities_text=result["entities"],
        table_rows=result["table"],
        process_steps=result["steps"],
        faqs=result["faqs"],
        whatsapp_msg=result["whatsapp_msg"],
        slug=target["slug"]
    )

    new_entry = {
        "title": target["title"],
        "slug": target["slug"],
        "rank_math_title": result["rank_math_title"],
        "rank_math_description": result["rank_math_description"],
        "kw": target["kw"],
        "content": full_html
    }

    dataset.append(new_entry)
    with open(DATASET_PATH, "w", encoding="utf-8") as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)

    # Compilar a HTML estático en dist/
    from deploy_mass_seo import generate_static_landings
    generate_static_landings([new_entry])

    # Actualizar Sitemap
    from generate_sitemap import generate_sitemap
    generate_sitemap()

    print(f"✨ Nueva landing '{target['slug']}' generada, compilada e indexada en sitemap exitosamente.")
    return True

if __name__ == "__main__":
    generate_next_landing()
