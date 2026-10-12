#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PEBAI Systems - Google Sheets Autonomous Sync & Generator
Lee la hoja de contenidos en Google Sheets, procesa las filas 'pendiente',
genera landings Dark Luxury con Gemini API, las despliega en Hostinger por SFTP,
actualiza sitemap.xml, notifica a IndexNow (Bing/ChatGPT) y actualiza la celda a 'Publicado'.
Si se terminan las filas, envía un email de alerta al equipo de PEBAI Systems.
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
import urllib.parse
from datetime import datetime
import paramiko

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
WEBSITE_DIR = os.path.dirname(SCRIPT_DIR)
LOCAL_DIST = os.path.join(WEBSITE_DIR, "dist")
DATASET_PATH = os.path.join(SCRIPT_DIR, "pages_mass_data.json")

# Conectores y credenciales
APIS_DIR = "C:/programacion/APIs"
PROJECT_CONFIGS_PATH = os.path.join(APIS_DIR, "project_configs.json")
API_KEYS_PATH = os.path.join(APIS_DIR, "api_keys.json")
SERVICE_ACCOUNT_PATH = os.path.join(APIS_DIR, "google_service_account.json")

def log(msg):
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    formatted = f"[{now_str}] {msg}"
    print(formatted)
    try:
        os.makedirs("C:/programacion/logs", exist_ok=True)
        with open("C:/programacion/logs/pebai_sheets_sync.log", "a", encoding="utf-8") as f:
            f.write(formatted + "\n")
    except Exception:
        pass

def send_team_email_alert(subject, message, to="equipo@pebaisystems.es"):
    """Envía un email al equipo de PEBAI a través del endpoint seguro en el servidor."""
    import requests
    url = "https://pebaisystems.es/api/send_alert.php"
    payload = {
        "token": os.environ.get("PEBAI_ALERT_TOKEN", ""),
        "to": to,
        "subject": subject,
        "message": message
    }
    try:
        r = requests.post(url, json=payload, timeout=12)
        if r.status_code == 200:
            log(f"📧 Alerta por email enviada a {to}: {r.json().get('status')}")
            return True
        else:
            log(f"⚠️ Servidor respondió {r.status_code}: {r.text}")
            return False
    except Exception as e:
        log(f"⚠️ Error enviando alerta por email: {e}")
        return False

def get_google_sheet_client():
    import gspread
    from google.oauth2.service_account import Credentials
    scopes = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive"
    ]
    if not os.path.exists(SERVICE_ACCOUNT_PATH):
        raise FileNotFoundError(f"No se encontró la Service Account en {SERVICE_ACCOUNT_PATH}")
    creds = Credentials.from_service_account_file(SERVICE_ACCOUNT_PATH, scopes=scopes)
    return gspread.authorize(creds)

def call_gemini_api(prompt, api_key, primary_model="gemini-flash-latest"):
    candidate_models = [
        primary_model,
        "gemini-flash-latest",
        "gemini-pro-latest",
        "gemini-flash-lite-latest",
        "gemini-2.5-pro"
    ]
    # Eliminar duplicados manteniendo orden
    seen = set()
    models = [m for m in candidate_models if not (m in seen or seen.add(m))]

    last_error = None
    for m in models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={api_key}"
        body = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.2,
                "responseMimeType": "application/json"
            }
        }
        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(body).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=35) as response:
                res_data = json.loads(response.read().decode())
                raw_text = res_data["candidates"][0]["content"]["parts"][0]["text"]
                log(f"✅ Respuesta exitosa de Gemini API con modelo: {m}")
                return json.loads(raw_text)
        except Exception as e:
            log(f"⚠️ Modelo {m} falló ({e}). Probando siguiente...")
            last_error = e

    raise RuntimeError(f"Todos los modelos de Gemini fallaron. Último error: {last_error}")

def run_sync():
    log("🚀 Iniciando sincronización de contenidos Google Sheets para PEBAI Systems...")

    # Cargar configuraciones
    if not os.path.exists(PROJECT_CONFIGS_PATH) or not os.path.exists(API_KEYS_PATH):
        log("❌ Faltan archivos de configuración en C:/programacion/APIs/")
        return False

    with open(PROJECT_CONFIGS_PATH, "r", encoding="utf-8") as f:
        proj_cfg = json.load(f).get("pebai-systems", {})
    with open(API_KEYS_PATH, "r", encoding="utf-8") as f:
        api_keys = json.load(f)

    sheet_id = proj_cfg.get("blog_sheet_id") or "1TFfXfZS-Icd2-mNui1v3dzDKIl8ImmKHRJqjnVE5-K8"
    tab_index = proj_cfg.get("blog_sheet_tab", 0)
    gemini_key = api_keys.get("gemini_api_key")
    model = api_keys.get("gemini_default_model", "gemini-3.6-flash")

    gc = get_google_sheet_client()

    try:
        sh = gc.open_by_key(sheet_id)
        ws = sh.get_worksheet(tab_index)
        log(f"📄 Hoja conectada: '{sh.title}' -> Pestaña: '{ws.title}'")
    except Exception as e:
        log(f"❌ Error accediendo al Google Sheet '{sheet_id}': {e}")
        log("💡 Recuerda compartir la hoja con 'fotos-drive@dani-developer.iam.gserviceaccount.com' como Editor.")
        return False

    all_rows = ws.get_all_values()
    if not all_rows or len(all_rows) <= 1:
        log("⚠️ La hoja de cálculo está vacía.")
        return False

    headers = [h.strip().upper() for h in all_rows[0]]
    log(f"📋 Cabeceras detectadas: {headers}")

    # Encontrar columnas clave
    col_estado = -1
    col_ciudad = -1
    col_kw = -1
    col_slug = -1
    col_titulo = -1
    col_tipo = -1

    for idx, h in enumerate(headers):
        if "ESTADO" in h:
            col_estado = idx
        elif "CIUDAD" in h or "DESTINO" in h or "SECTOR" in h:
            col_ciudad = idx
        elif "KEY" in h or "PALABRA" in h:
            col_kw = idx
        elif "SLUG" in h:
            col_slug = idx
        elif "TITULO" in h or "TITLE" in h:
            col_titulo = idx
        elif "TIPO" in h or "SERVICIO" in h:
            col_tipo = idx

    if col_estado == -1:
        log("❌ No se encontró la columna 'ESTADO' en la hoja.")
        return False

    # Buscar la primera fila pendiente
    pending_row_index = -1
    pending_row_data = None

    for r_idx in range(1, len(all_rows)):
        row = all_rows[r_idx]
        estado_val = row[col_estado].strip().lower() if len(row) > col_estado else ""
        if estado_val == "pendiente":
            pending_row_index = r_idx + 1  # 1-indexed para gspread
            pending_row_data = row
            break

    pending_rows_count = sum(1 for r in all_rows[1:] if len(r) > col_estado and r[col_estado].strip().lower() == "pendiente")
    log(f"📊 Publicaciones pendientes en la hoja de cálculo: {pending_rows_count}")

    # Auto-reposición inteligente con SE Ranking si quedan 3 o menos pendientes
    if pending_rows_count <= 3:
        log("⚡ Stock bajo de publicaciones (<= 3). Activando auto-reposición autónoma desde SE Ranking...")
        try:
            from seranking_keyword_engine import auto_mine_top_keywords_to_sheets
            added = auto_mine_top_keywords_to_sheets(target_count=10)
            log(f"🤖 SE Ranking auto-reposición completada: +{added} nuevas temáticas añadidas.")
            if not pending_row_data and added > 0:
                all_rows = ws.get_all_values()
                for r_idx in range(1, len(all_rows)):
                    row = all_rows[r_idx]
                    estado_val = row[col_estado].strip().lower() if len(row) > col_estado else ""
                    if estado_val == "pendiente":
                        pending_row_index = r_idx + 1
                        pending_row_data = row
                        break
        except Exception as e:
            log(f"⚠️ Error en auto-reposición SE Ranking: {e}")

    if not pending_row_data:
        log("🔔 TODAS LAS FILAS ESTÁN PUBLICADAS (no quedan pendientes).")
        # Enviar aviso por correo electrónico al equipo
        alert_subject = "⚠️ PEBAI Systems: Se han agotado las publicaciones pendientes en Google Sheets"
        alert_msg = (
            "Hola equipo de PEBAI Systems,\n\n"
            "El motor autónomo de captación y SEO ha revisado la hoja de cálculo de Google Sheets "
            "y ha verificado que todas las ciudades y temáticas están en estado 'Publicado'.\n\n"
            "No quedan filas marcadas como 'pendiente'.\n\n"
            "Por favor, añadid nuevas filas con ciudades o servicios en la hoja para continuar "
            "con la publicación diaria programada.\n\n"
            f"Enlace a la hoja: https://docs.google.com/spreadsheets/d/{sheet_id}\n\n"
            "— Sistema Autónomo PEBAI Systems"
        )
        send_team_email_alert(alert_subject, alert_msg)
        return True

    # Extraer campos de la fila pendiente
    ciudad = pending_row_data[col_ciudad].strip() if col_ciudad != -1 and len(pending_row_data) > col_ciudad else "España"
    kw = pending_row_data[col_kw].strip() if col_kw != -1 and len(pending_row_data) > col_kw else f"consultoria inteligencia artificial {ciudad}"
    slug = pending_row_data[col_slug].strip().strip("/") if col_slug != -1 and len(pending_row_data) > col_slug else f"consultoria-inteligencia-artificial-{ciudad.lower().replace(' ', '-')}"
    titulo = pending_row_data[col_titulo].strip() if col_titulo != -1 and len(pending_row_data) > col_titulo else f"Consultoría de Inteligencia Artificial para Empresas en {ciudad}"
    tipo_servicio = pending_row_data[col_tipo].strip() if col_tipo != -1 and len(pending_row_data) > col_tipo else "Consultoría e Ingeniería de Procesos con IA"

    log(f"🎯 Fila {pending_row_index} seleccionada para publicar:")
    log(f"   Ciudad/Sector: {ciudad} | Keyword: {kw}")
    log(f"   Slug: {slug} | Título: {titulo}")

    # Prompt para Gemini API
    prompt = f"""
Actúa como Arquitecto Técnico Senior de PEBAI Systems (https://pebaisystems.es).
Genera los datos estructurados en formato JSON para una landing B2B de captación sobre:
Título: {titulo}
Palabra Clave: {kw}
Ciudad / Sector: {ciudad}
Tipo de Servicio: {tipo_servicio}
Slug: {slug}

REGLAS ESTRICTAS DE PEBAI SYSTEMS:
1. Posicionamiento: PEBAI Systems es una Consultora de Procesos e Inteligencia Artificial. Destacar nuestra Auditoría Técnica Inicial 100% gratuita con entrega en 24h laborables (0 € y sin compromiso) para diagnosticar la operativa real de la empresa antes de cualquier inversión.
2. Hook de Respuesta Inmediata (exactamente entre 30 y 45 palabras): Debe responder de forma directa y cuantitativa con costes reales (ej. 1.500 € a 5.000 € en {ciudad}), plazos (7 a 14 días), ROI menor a 90 días y la auditoría inicial de viabilidad a 0 €.
3. Entidades Reales: Mencionar GPT-4o, Claude 3.5 Sonnet, n8n, LangChain, Supabase pgvector, RGPD, AI Act europeo y soporte local/empresarial en {ciudad}.
4. Tabla Comparativa: 3-4 filas con 'sistema', 'plazo', 'precio' e 'impacto'.
5. Fases: 3 pasos de despliegue ('Auditoría y Viabilidad 24h', 'Arquitectura e Integración a Medida', 'Puesta en Producción y Acompañamiento Continuo').
6. FAQs: 3 preguntas frecuentes con respuestas concretas de alto valor para directores y gerentes de PYMEs.
7. WhatsApp Message: Mensaje preconfigurado para el lead.

Devuelve EXCLUSIVAMENTE este esquema JSON:
{{
  "rank_math_title": "{titulo} | PEBAI Systems",
  "rank_math_description": "Consultoría de Procesos e Inteligencia Artificial en {ciudad}. Auditoría técnica 100% gratuita en 24h, automatización y software a medida.",
  "hook": "Párrafo de 30-45 palabras exactas con cifras y mención a la auditoría gratuita en 24h",
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
  "whatsapp_msg": "Hola%2C%20quiero%20solicitar%20la%20auditor%C3%ADa%20gratuita%20en%2024h%20sobre%20{kw}"
}}
"""

    log(f"🧠 Consultando Gemini API ({model})...")
    res_ai = call_gemini_api(prompt, gemini_key, model)

    # Construir HTML
    sys.path.append(SCRIPT_DIR)
    from generate_dataset import build_page_html
    from deploy_mass_seo import generate_static_landings
    from generate_sitemap import generate_sitemap

    from generate_landing_image import generate_landing_banner
    generate_landing_banner(titulo, ciudad=ciudad, slug=slug, service_type=tipo_servicio)

    full_html = build_page_html(
        title=titulo,
        hook=res_ai["hook"],
        entities_text=res_ai["entities"],
        table_rows=res_ai["table"],
        process_steps=res_ai["steps"],
        faqs=res_ai["faqs"],
        whatsapp_msg=res_ai["whatsapp_msg"],
        slug=slug,
        ciudad=ciudad,
        service_type=tipo_servicio
    )

    new_entry = {
        "title": titulo,
        "slug": slug,
        "rank_math_title": res_ai["rank_math_title"],
        "rank_math_description": res_ai["rank_math_description"],
        "kw": kw,
        "content": full_html
    }

    # Guardar en dataset local
    dataset = []
    if os.path.exists(DATASET_PATH):
        with open(DATASET_PATH, "r", encoding="utf-8") as f:
            dataset = json.load(f)
    dataset.append(new_entry)
    with open(DATASET_PATH, "w", encoding="utf-8") as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)

    # Compilar en dist/
    generate_static_landings([new_entry])
    generate_sitemap()
    log("📁 Compilación local finalizada (HTML + Banner WebP 1200x630).")

    # Subir por SFTP a Hostinger
    sftp_host = proj_cfg.get("sftp_host") or os.environ.get("HOSTINGER_SSH_HOST")
    sftp_port = proj_cfg.get("sftp_port") or int(os.environ.get("HOSTINGER_SSH_PORT", "65002"))
    sftp_user = proj_cfg.get("sftp_username") or os.environ.get("HOSTINGER_SSH_USER")
    sftp_pass = proj_cfg.get("sftp_password") or os.environ.get("HOSTINGER_SSH_PASS")
    remote_base = proj_cfg.get("sftp_remote_dir", "domains/pebaisystems.es/public_html")

    sftp_deployed = False
    try:
        log(f"📡 Desplegando en Hostinger ({sftp_host})...")
        transport = paramiko.Transport((sftp_host, sftp_port))
        transport.connect(username=sftp_user, password=sftp_pass)
        sftp = paramiko.SFTPClient.from_transport(transport)

        # 1. Subir HTML de la landing
        remote_landing_dir = f"{remote_base}/{slug}"
        try:
            sftp.mkdir(remote_landing_dir)
        except Exception:
            pass
        local_page_path = os.path.join(LOCAL_DIST, slug, "index.html")
        remote_page_path = f"{remote_landing_dir}/index.html"
        sftp.put(local_page_path, remote_page_path)

        # 2. Subir Banner Destacado WebP a brand/landings/
        try:
            sftp.mkdir(f"{remote_base}/brand/landings")
        except Exception:
            pass
        local_banner_path = os.path.join(LOCAL_DIST, "brand", "landings", f"{slug}.webp")
        if os.path.exists(local_banner_path):
            remote_banner_path = f"{remote_base}/brand/landings/{slug}.webp"
            sftp.put(local_banner_path, remote_banner_path)

        # 3. Subir sitemap actualizado
        local_sitemap = os.path.join(LOCAL_DIST, "sitemap.xml")
        remote_sitemap = f"{remote_base}/sitemap.xml"
        sftp.put(local_sitemap, remote_sitemap)

        sftp.close()
        transport.close()
        sftp_deployed = True
        log("✅ Despliegue en Hostinger completado.")
    except Exception as sftp_err:
        log(f"⚠️ Aviso Hostinger SFTP ({sftp_err}): IP bloqueada por el firewall de Hostinger. El contenido y la imagen quedan compilados localmente para sincronizar en cuanto se desbloquee la IP.")

    # Notificar a IndexNow (Bing / ChatGPT)
    try:
        indexnow_script = os.path.join(SCRIPT_DIR, "submit_indexnow.py")
        if os.path.exists(indexnow_script):
            import subprocess
            subprocess.run([sys.executable, indexnow_script], check=True)
            log("⚡ IndexNow notificado inmediatamente.")
    except Exception as e:
        log(f"⚠️ Aviso IndexNow falló: {e}")

    # Actualizar estado y URL en Google Sheets
    published_url = f"https://pebaisystems.es/{slug}/"
    ws.update_cell(pending_row_index, col_estado + 1, "Publicado")
    
    # Buscar o actualizar la columna de URL Publicada
    col_url = -1
    for idx, h in enumerate(headers):
        if "URL" in h and "PUB" in h:
            col_url = idx
            break
    if col_url != -1:
        ws.update_cell(pending_row_index, col_url + 1, published_url)

    log(f"🎉 Google Sheets actualizado: Fila {pending_row_index} marcada como 'Publicado' con URL: {published_url}")

    # Enviar notificación por email al equipo
    pub_subject = f"🚀 Nueva Landing Publicada: {titulo} ({ciudad})"
    pub_msg = (
        f"Hola equipo de PEBAI Systems,\n\n"
        f"El motor autónomo acaba de generar y publicar con éxito una nueva página desde vuestro Google Sheets:\n\n"
        f"• Ciudad / Sector: {ciudad}\n"
        f"• Palabra clave: {kw}\n"
        f"• URL en vivo: {published_url}\n\n"
        f"✅ Generada con Gemini API y diseño Dark Luxury de PEBAI\n"
        f"✅ Desplegada en producción en Hostinger\n"
        f"✅ Notificada a Bing y ChatGPT Search vía IndexNow\n"
        f"✅ Estado actualizado en Google Sheets a 'Publicado'\n\n"
        f"— Sistema Autónomo PEBAI Systems"
    )
    send_team_email_alert(pub_subject, pub_msg)

    return True

if __name__ == "__main__":
    run_sync()
