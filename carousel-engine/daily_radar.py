#!/usr/bin/env python3
"""
PEBAI SYSTEMS - MOTOR RADAR DIARIO DE CONTENIDO Y CARRUSELES
Monitorea novedades de IA (<48h) en YouTube y Reddit, combina con la oferta
B2B de PEBAI Systems y genera hasta 10 ideas ganadoras para volcar en Google Sheets.
"""

import os
import sys
import json
import time
import argparse
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta
import urllib.request
import urllib.error

# Configurar salida UTF-8 en Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Canales YouTube de referencia en IA (Channel IDs verificados)
YOUTUBE_CHANNELS = [
    {"name": "Wes Roth", "id": "UCqcbQf6yw5KzRoDDcZ_wBSw"},
    {"name": "Matt Wolfe", "id": "UChpleBmo18P08aKCIgti38g"},
    {"name": "Matthew Berman", "id": "UCawZsQWqfGSbCI5yjkdVkTA"},
    {"name": "Two Minute Papers", "id": "UCbfYPyITQ-7l4upoX8nvctg"},
    {"name": "AI Explained", "id": "UCNJ1Ymd5yFuUPtn21xtRbbw"},
    {"name": "Fireship", "id": "UCsBjURrPoezykLs9EqgamOA"}
]

# Subreddits de IA
REDDIT_SUBS = [
    "OpenAI",
    "ChatGPT",
    "LocalLLaMA",
    "singularity"
]

HTTP_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Cookie": "SOCS=CAESEwgDEgk2ODE3ODgxMzQaAmVuIAEaBgiA_LyaBg; CONSENT=YES+"
}

SPANISH_MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

def get_current_month_name(dt: datetime = None) -> str:
    if dt is None:
        dt = datetime.now()
    return f"{SPANISH_MONTHS[dt.month - 1]} {dt.year}"

def fetch_youtube_feed(channel: dict, max_age_hours: int = 48) -> list:
    """Extrae videos subidos en las ultimas max_age_hours horas desde RSS oficial."""
    cid = channel["id"]
    name = channel["name"]
    url = f"https://www.youtube.com/feeds/videos.xml?channel_id={cid}"
    items = []
    
    try:
        req = urllib.request.Request(url, headers=HTTP_HEADERS)
        with urllib.request.urlopen(req, timeout=10) as response:
            xml_data = response.read()
            
        root = ET.fromstring(xml_data)
        ns = {
            "atom": "http://www.w3.org/2005/Atom",
            "yt": "http://www.youtube.com/xml/schemas/2015",
            "media": "http://search.yahoo.com/mrss/"
        }
        
        now = datetime.now(timezone.utc)
        cutoff = now - timedelta(hours=max_age_hours)
        
        for entry in root.findall("atom:entry", ns):
            published_el = entry.find("atom:published", ns)
            title_el = entry.find("atom:title", ns)
            link_el = entry.find("atom:link", ns)
            
            if published_el is None or title_el is None:
                continue
                
            pub_date_str = published_el.text
            # Formato ISO 8601: 2026-10-04T12:00:00+00:00
            try:
                pub_dt = datetime.fromisoformat(pub_date_str.replace("Z", "+00:00"))
            except Exception:
                continue
                
            if pub_dt >= cutoff:
                video_url = link_el.attrib.get("href") if link_el is not None else f"https://www.youtube.com/channel/{cid}"
                items.append({
                    "source": f"YouTube ({name})",
                    "title": title_el.text.strip(),
                    "url": video_url,
                    "published_at": pub_date_str,
                    "type_hint": "VIRAL"
                })
    except Exception as e:
        print(f"[AVISO] Error consultando feed de {name}: {e}")
        
    return items

def fetch_reddit_feed(sub: str, max_age_hours: int = 48) -> list:
    """Extrae publicaciones recientes de Reddit RSS (<48h)."""
    url = f"https://www.reddit.com/r/{sub}/new.rss"
    items = []
    
    try:
        time.sleep(2.0)  # Prevenir rate limiting 429 de Reddit
        req = urllib.request.Request(url, headers=HTTP_HEADERS)
        with urllib.request.urlopen(req, timeout=10) as response:
            xml_data = response.read()
            
        root = ET.fromstring(xml_data)
        ns = {"atom": "http://www.w3.org/2005/Atom"}
        
        now = datetime.now(timezone.utc)
        cutoff = now - timedelta(hours=max_age_hours)
        
        for entry in root.findall("atom:entry", ns):
            updated_el = entry.find("atom:updated", ns) or entry.find("atom:published", ns)
            title_el = entry.find("atom:title", ns)
            link_el = entry.find("atom:link", ns)
            
            if updated_el is None or title_el is None:
                continue
                
            title = title_el.text.strip()
            if len(title) < 15 or title.lower().startswith(("help", "question", "weekly")):
                continue
                
            pub_date_str = updated_el.text
            try:
                pub_dt = datetime.fromisoformat(pub_date_str.replace("Z", "+00:00"))
            except Exception:
                continue
                
            if pub_dt >= cutoff:
                post_url = link_el.attrib.get("href") if link_el is not None else f"https://www.reddit.com/r/{sub}"
                items.append({
                    "source": f"Reddit (r/{sub})",
                    "title": title,
                    "url": post_url,
                    "published_at": pub_date_str,
                    "type_hint": "VIRAL"
                })
    except Exception as e:
        print(f"[AVISO] Error consultando Reddit r/{sub}: {e}")
        
    return items

def load_pebai_b2b_context() -> str:
    """Carga los angulos comerciales de consultoria y formacion para empresas."""
    base_dir = os.path.dirname(__file__)
    consulting_path = os.path.join(base_dir, "knowledge", "OFERTA_CONSULTORIA_PEBAI.md")
    
    context = ""
    if os.path.exists(consulting_path):
        try:
            with open(consulting_path, "r", encoding="utf-8") as f:
                context += f"\n--- OFERTA CONSULTORIA PEBAI ---\n{f.read()[:2000]}\n"
        except Exception:
            pass

    training_path = os.path.abspath(os.path.join(base_dir, "..", ".agents", "skills", "formacion-empresas-ia", "SKILL.md"))
    if os.path.exists(training_path):
        try:
            with open(training_path, "r", encoding="utf-8") as f:
                context += f"\n--- OFERTA FORMACION EMPRESAS (AI ENABLEMENT) ---\n{f.read()[:2000]}\n"
        except Exception:
            pass
            
    return context

def generate_ideas_with_gemini(raw_news: list, b2b_context: str, api_key: str) -> list:
    """Utiliza Gemini para curar, filtrar y redactar hasta 10 ideas ganadoras de carrusel con reintentos."""
    today_str = datetime.now().strftime("%d/%m/%Y")
    
    prompt = f"""Eres el Director Creativo y Estratega Jefe de Adquisición B2B y Redes Sociales de PEBAI Systems (consultora e ingeniería de IA y procesos).

MISION:
Analizar la lista de noticias de las últimas 48 horas en YouTube y Reddit, compararlas con la oferta estratégica de PEBAI Systems, y seleccionar o redactar HASTA 10 IDEAS GANADORAS DE CARRUSELES para Instagram y TikTok.

CRITERIOS ESTRICTOS:
1. Calidad sobre cantidad: Si hay noticias irrelevantes o repetitivas, descártalas. No entregues ideas mediocres solo por rellenar. Máximo 10 ideas.
2. Si un día hay pocas noticias (<10), pivota y completa con ideas B2B de la oferta interna de PEBAI Systems (Consultoría gratuita de 45 min con ingenieros para 5 empresas/mes valorada en 1.200€, o Formación Continua de IA para plantillas bonificable por FUNDAE).
3. Clasificación obligatoria en campo 'tipo':
   - 'VIRAL': Impacto masivo, grandes noticias o debates de IA que cualquiera quiere compartir.
   - 'B2B': Enfocado a directores de operaciones, CEOs y pymes (fugas de dinero, lentitud de respuesta de 2-4h, duplicidad de datos en Excel).
   - 'MIXTO': Noticia tecnológica llevada a la consecuencia operativa empresarial.
4. Gancho de Portada (Slide 1): DEBE seguir fórmulas probadas de alta retención (alto contraste, cifras concretas, curiosidad o marco negativo ej. "Por qué el 90% de las empresas se equivoca al..."). Cero titulares genéricos o aburridos.
5. Desarrollo (Slides 2-4): Breve síntesis paso a paso del contenido de las diapositivas intermedias (ej. Slide 2: Problema/Dato, Slide 3: Demostración técnica, Slide 4: Conclusión o llamado de valor).
6. Formato Visual recomendado: Uno de los siguientes: 'Split-Screen', 'Notebook/Cuaderno', 'Diagrama Miro', 'Fórmula ROI'.
7. Cero emojis en todos los textos generados.

NOTICIAS FRESCAS DETECTADAS (<48H):
{json.dumps(raw_news[:25], indent=2, ensure_ascii=False)}

CONTEXTO INTERNO PEBAI B2B (PARA FALLBACK Y ALINEACION):
{b2b_context}

FORMATO DE RESPUESTA:
Devuelve ÚNICAMENTE un bloque JSON válido con este esquema exacto, sin texto antes ni después:
[
  {{
    "id": "RAD-{datetime.now().strftime('%Y%m%d')}-01",
    "fecha": "{today_str}",
    "tipo": "VIRAL",
    "gancho": "Texto magnético de la portada",
    "desarrollo": "Slide 2: Explicación. Slide 3: Demostración. Slide 4: Impacto.",
    "formato": "Split-Screen",
    "fuente": "URL de la noticia o 'PEBAI B2B'",
    "estado": "PENDIENTE",
    "notas": "Ángulo estratégico"
  }}
]
"""

    # Modelos flash optimizados y disponibles sin saturación
    models_to_try = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-3.6-flash"]
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.3
        }
    }
    
    last_error = None
    for target_model in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{target_model}:generateContent?key={api_key}"
        for attempt in range(1, 3):
            try:
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode("utf-8"),
                    headers={"Content-Type": "application/json"}
                )
                with urllib.request.urlopen(req, timeout=40) as response:
                    res_json = json.loads(response.read().decode("utf-8"))
                    
                candidates = res_json.get("candidates", [])
                if not candidates:
                    raise ValueError(f"Modelo {target_model} no devolvio candidatos")
                    
                parts = candidates[0].get("content", {}).get("parts", [])
                text_content = ""
                for p in parts:
                    if "text" in p:
                        text_content += p["text"]
                        
                clean_text = text_content.strip()
                if "```json" in clean_text:
                    clean_text = clean_text.split("```json", 1)[1]
                    clean_text = clean_text.split("```", 1)[0]
                elif "```" in clean_text:
                    clean_text = clean_text.split("```", 1)[1]
                    clean_text = clean_text.split("```", 1)[0]
                clean_text = clean_text.strip()
                
                ideas = json.loads(clean_text)
                print(f"[OK] Generación completada con éxito usando modelo: {target_model}")
                return ideas
            except urllib.error.HTTPError as http_err:
                last_error = http_err
                print(f"[AVISO] Modelo {target_model} (intento {attempt}/2): HTTP {http_err.code}")
                time.sleep(2)
            except Exception as gen_err:
                last_error = gen_err
                print(f"[AVISO] Modelo {target_model} (intento {attempt}/2): {gen_err}")
                time.sleep(2)

    raise ValueError(f"Error generando ideas tras varios reintentos: {last_error}")

class _GoogleRedirectHandler(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return urllib.request.Request(newurl, headers={"User-Agent": "PebaiRadar/1.0"})

def push_to_google_sheet(webhook_url: str, ideas: list, month_name: str) -> dict:
    """Envía las ideas formateadas al Webhook de Google Apps Script con soporte nativo de redirección."""
    payload = {
        "month": month_name,
        "ideas": ideas
    }
    
    # 1. Intentar con requests si está disponible
    try:
        import requests
        response = requests.post(webhook_url, data=json.dumps(payload), timeout=35)
        return response.json()
    except Exception:
        pass
        
    # 2. Fallback 100% nativo con urllib y manejador de redirección 302 de Google
    opener = urllib.request.build_opener(_GoogleRedirectHandler)
    req = urllib.request.Request(
        webhook_url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "text/plain;charset=utf-8"}
    )
    with opener.open(req, timeout=35) as res:
        return json.loads(res.read().decode("utf-8"))

def main():
    parser = argparse.ArgumentParser(description="Radar Diario de Ideas PEBAI Systems")
    parser.add_argument("--dry-run", action="store_true", help="Ejecuta el radar e imprime las ideas sin enviarlas a Google Sheets")
    parser.add_argument("--hours", type=int, default=48, help="Ventana de tiempo para noticias (default: 48h)")
    args = parser.parse_args()
    
    print("=======================================================")
    print("[PEBAI SYSTEMS] MOTOR RADAR DIARIO DE CONTENIDO")
    print("=======================================================")
    print(f"Fecha: {datetime.now().strftime('%d/%m/%Y %H:%M')}")
    print(f"Ventana de análisis: {args.hours} horas")
    
    # 1. Extracción de señales de YouTube
    print("\n[1/4] Rastreo de canales de YouTube en tiempo real...")
    raw_news = []
    for ch in YOUTUBE_CHANNELS:
        ch_items = fetch_youtube_feed(ch, max_age_hours=args.hours)
        if ch_items:
            print(f"  - {ch['name']}: {len(ch_items)} videos nuevos")
            raw_news.extend(ch_items)
            
    # 2. Extracción de señales de Reddit
    print("\n[2/4] Rastreo de comunidades Reddit...")
    for sub in REDDIT_SUBS:
        sub_items = fetch_reddit_feed(sub, max_age_hours=args.hours)
        if sub_items:
            print(f"  - r/{sub}: {len(sub_items)} debates nuevos")
            raw_news.extend(sub_items)
            
    print(f"\nTotal señales detectadas en radar: {len(raw_news)}")
    
    # 3. Carga de contexto B2B interno
    b2b_context = load_pebai_b2b_context()
    
    # 4. Obtención de API Key de Gemini
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        # Intentar cargar desde .env de whatsapp-outreach-bot si existe localmente
        local_env = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "whatsapp-outreach-bot", ".env"))
        if os.path.exists(local_env):
            try:
                with open(local_env, "r", encoding="utf-8") as f:
                    for line in f:
                        if line.startswith("GEMINI_API_KEY="):
                            api_key = line.strip().split("=", 1)[1]
                            break
            except Exception:
                pass

    if not api_key:
        print("[ERROR] No se encontro GEMINI_API_KEY en variables de entorno.")
        sys.exit(1)
        
    print("\n[3/4] Curación y redacción de ganchos virales con Gemini...")
    try:
        ideas = generate_ideas_with_gemini(raw_news, b2b_context, api_key)
        print(f"[OK] {len(ideas)} ideas ganadoras seleccionadas.")
    except Exception as e:
        print(f"[ERROR] Fallo en la generación con Gemini: {e}")
        sys.exit(1)
        
    # Mostrar ideas en consola
    print("\n--- RESUMEN DE IDEAS GENERADAS ---")
    for idx, idea in enumerate(ideas, 1):
        print(f"{idx}. [{idea.get('tipo')}] {idea.get('gancho')} ({idea.get('formato')})")
        
    # 5. Envío a Google Sheets
    current_month = get_current_month_name()
    webhook_url = os.environ.get("GSHEET_WEBHOOK_URL")
    
    if args.dry_run or not webhook_url:
        if not webhook_url:
            print("\n[INFO] GSHEET_WEBHOOK_URL no configurada. Ejecutando en modo de prueba local (--dry-run).")
        print("\nPayload listo para Google Sheets:")
        print(json.dumps({"month": current_month, "ideas": ideas}, indent=2, ensure_ascii=False))
        return
        
    print(f"\n[4/4] Enviando {len(ideas)} ideas a Google Sheets (Pestaña: '{current_month}')...")
    try:
        res = push_to_google_sheet(webhook_url, ideas, current_month)
        print(f"[OK] Sincronización exitosa: {res}")
    except Exception as e:
        print(f"[ERROR] Error al enviar a Google Sheets Webhook: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
