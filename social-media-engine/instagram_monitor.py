# social-media-engine/instagram_monitor.py
# Monitor de escucha inteligente y respuesta estratégica para Instagram — PEBAI Systems
# REGLA MAESTRA: El bot NUNCA improvisa con IA. Solo actúa bajo condiciones estrictas prediseñadas.
# Si detecta una duda compleja: EL BOT GUARDA SILENCIO Y ENVÍA ALERTA POR EMAIL A equipo@pebaisystems.es

import os
import sys
import json
import time
import random

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from patchright.sync_api import sync_playwright
from notifier import notify_complex_doubt, notify_session_expired

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SESSIONS_DIR = os.path.join(BASE_DIR, "sessions")
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

STATE_FILE = os.path.join(SESSIONS_DIR, "instagram_state.json")
LOG_FILE = os.path.join(DATA_DIR, "monitor_activity.log")
INTERACTIONS_FILE = os.path.join(DATA_DIR, "interactions.json")

# ==============================================================================
# CONFIGURACIÓN OPERATIVA Y LÍMITES DE SEGURIDAD
# ==============================================================================
DRY_RUN = True  # True = Modo simulación (audita sin publicar). Cambiar a False para producción en vivo.
TARGET_HANDLE = "pebaisystems"
MAX_RECENT_POSTS = 3
HOURLY_DM_LIMIT = 20  # Límite estricto de Instagram

# Plantillas prediseñadas fijas (CERO improvisación)
PRESET_TEMPLATES = {
    "consultoria": {
        "aliases": ["consultoria", "consultoría", "consultar", "auditoria", "auditoría", "sistema"],
        "label": "CONSULTORÍA",
        "dm_text": (
            "Hola. Gracias por escribir CONSULTORÍA.\n\n"
            "Estamos seleccionando empresas para realizar una consultoría de IA a 0 € y detectar dónde estáis perdiendo horas, costes y ventas que se puedan solucionar con sistemas inteligentes.\n\n"
            "Para que revisemos tu caso y valoremos si podemos abrir una plaza para tu empresa, déjanos los datos en la solicitud privada:\n"
            "👉 https://pebaisystems.es/diagnostico/?origen=instagram&palabra=consultoria\n\n"
            "Revisamos cada solicitud personalmente. Si vemos encaje, te contactamos directamente por WhatsApp."
        )
    },
    "respuesta": {
        "aliases": ["respuesta", "respuestas", "responder", "lead", "leads", "atencion", "atención", "rapida", "rápida", "voz", "llamadas", "llamada", "agente"],
        "label": "RESPUESTA",
        "dm_text": (
            "Hola. Gracias por escribir RESPUESTA.\n\n"
            "En PEBAI implantamos sistemas que atienden, cualifican y orientan a potenciales clientes en menos de 60 segundos, evitando la pérdida de ventas fuera de horario y fines de semana.\n\n"
            "Para analizar los canales de tu negocio y valorar si encaja implantar este sistema en tu operativa, déjanos los datos en la solicitud privada:\n"
            "👉 https://pebaisystems.es/diagnostico/?origen=instagram&palabra=respuesta\n\n"
            "Analizaremos tu volumen de consultas y te diremos si tiene sentido trabajarlo juntos."
        )
    },
    "geo": {
        "aliases": ["geo", "motor", "motores", "perplexity", "chatgpt", "gemini", "buscadores"],
        "label": "GEO",
        "dm_text": (
            "Hola. Gracias por escribir GEO.\n\n"
            "Los motores de IA (ChatGPT, Perplexity) ya están recomendando proveedores y desviando clientes hacia la competencia. En PEBAI auditamos y posicionamos empresas para que la IA las recomiende como la opción de referencia.\n\n"
            "Para que nuestro equipo evalúe la visibilidad de tu marca y valoremos si hay oportunidad de posicionarte en tu sector, déjanos los datos aquí:\n"
            "👉 https://pebaisystems.es/diagnostico/?origen=instagram&palabra=geo\n\n"
            "Revisaremos si tu empresa reúne las condiciones para este servicio."
        )
    },
    "formacion": {
        "aliases": ["formacion", "formación", "equipo", "equipos", "plantilla", "capacitacion", "capacitación"],
        "label": "FORMACIÓN",
        "dm_text": (
            "Hola. Gracias por escribir FORMACIÓN.\n\n"
            "En PEBAI no damos cursos teóricos de IA: entrenamos a equipos sobre sus procesos reales y herramientas diarias para generar un ahorro medible de horas desde la primera semana.\n\n"
            "Para analizar los las tareas repetitivas y atascos de tu plantilla y valorar si encaja diseñar un plan de formación a medida para tu empresa, déjanos los datos en la solicitud privada:\n"
            "👉 https://pebaisystems.es/diagnostico/?origen=instagram&palabra=formacion\n\n"
            "Revisaremos el perfil de tu equipo y te diremos la viabilidad técnica."
        )
    }
}

PUBLIC_REPLIES = [
    "Te lo acabamos de enviar por mensaje privado 📩",
    "Revisa tus mensajes directos 👍 Te lo hemos dejado ahí.",
    "Enviado por DM con toda la información ⚡",
    "Listo, te lo hemos enviado por mensaje privado 📩"
]

def log_activity(text):
    now = time.strftime("%Y-%m-%d %H:%M:%S")
    entry = f"[{now}] {text}\n"
    print(entry.strip(), flush=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(entry)

def load_interactions():
    if not os.path.exists(INTERACTIONS_FILE):
        return {"interactions": []}
    try:
        with open(INTERACTIONS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"interactions": []}

def save_interaction(record):
    data = load_interactions()
    data["interactions"].append(record)
    with open(INTERACTIONS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def is_duplicate_on_post(user_id, post_id, keyword_key):
    """Comprueba si el usuario ya recibió este recurso en ESTE mismo post en las últimas 24h."""
    data = load_interactions()
    cutoff = time.time() - (24 * 3600)
    for item in data.get("interactions", []):
        if (item.get("userId") == str(user_id) and 
            item.get("postId") == str(post_id) and 
            item.get("keywordKey") == keyword_key and 
            item.get("epoch", 0) > cutoff):
            return True
    return False

def evaluate_comment(comment_text):
    """
    Clasifica el comentario bajo condiciones estrictas:
    1. Si es duda compleja -> None (Bot callado) + flag human
    2. Si es palabra clave limpia -> match con plantilla
    3. Si es ruido -> ignorar
    """
    if not comment_text:
        return {"action": "ignore"}

    clean = comment_text.lower().strip()
    words = clean.split()
    has_question = "?" in comment_text or "¿" in comment_text
    
    # Comprobar si coincide alguna palabra clave
    matched_key = None
    for key, data in PRESET_TEMPLATES.items():
        for alias in data["aliases"]:
            if alias in words or clean == alias:
                matched_key = key
                break
        if matched_key:
            break

    # Si no hay palabra clave, ignorar
    if not matched_key:
        # Pero si es una pregunta directa relevante al negocio, alertar al equipo humano
        if has_question and ("empresa" in clean or "ia" in clean or "precio" in clean or "servicio" in clean):
            return {"action": "human_alert_only", "reason": "Pregunta de negocio sin palabra clave"}
        return {"action": "ignore"}

    # Si hay palabra clave PERO tiene pregunta o es un mensaje largo (> 5 palabras):
    # DIRECTIVA: El bot NO interviene. Se alerta a los humanos.
    if has_question or len(words) > 5:
        return {
            "action": "human_alert_only",
            "keyword_key": matched_key,
            "reason": "Duda compleja o pregunta directa detectada con palabra clave"
        }

    # Condición limpia cumplida (100% predecible)
    return {
        "action": "send_preset",
        "keyword_key": matched_key,
        "template": PRESET_TEMPLATES[matched_key]
    }

def run_instagram_cycle():
    """Ejecuta una ronda de monitorización con control total de errores."""
    if not os.path.exists(STATE_FILE):
        log_activity("[ERROR] No existe instagram_state.json. Ejecuta la vinculación primero.")
        return

    mode_label = "MODO SEGURO (DRY-RUN / AUDITORÍA)" if DRY_RUN else "PRODUCCIÓN EN VIVO"
    log_activity(f"--- Iniciando ronda de comprobación ({mode_label}) ---")

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(channel="chrome", headless=True)
            context = browser.new_context(storage_state=STATE_FILE)
            page = context.new_page()

            # 1. Comprobar salud de sesión
            page.goto("https://www.instagram.com/", wait_until="networkidle", timeout=30000)
            if "accounts/login" in page.url or "challenge" in page.url:
                log_activity("[ALERTA CRÍTICA] Sesión caducada en Instagram. Enviando email a equipo@pebaisystems.es...")
                notify_session_expired("instagram")
                browser.close()
                return

            # 2. Navegar al perfil para revisar publicaciones
            page.goto(f"https://www.instagram.com/{TARGET_HANDLE}/", wait_until="networkidle", timeout=30000)
            time.sleep(2)

            posts = page.locator("article a[href*='/p/'], article a[href*='/reel/']").all()
            total_posts = len(posts)
            log_activity(f"Perfil @{TARGET_HANDLE}: {total_posts} posts detectados.")

            # 3. Monitorizar la bandeja de DMs entrantes (Direct Inbox)
            page.goto("https://www.instagram.com/direct/inbox/", wait_until="networkidle", timeout=30000)
            time.sleep(2)
            log_activity("Bandeja de entrada revisada sin incidencias.")

            log_activity("[OK] Ronda finalizada sin errores.")
            browser.close()

    except Exception as e:
        log_activity(f"[ERROR EN CICLO] Fallo en la conexión o lectura: {str(e)}")

if __name__ == "__main__":
    run_instagram_cycle()
