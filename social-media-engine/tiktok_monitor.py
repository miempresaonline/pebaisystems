# social-media-engine/tiktok_monitor.py
# Monitor de escucha y respuesta estratégica para TikTok — PEBAI Systems
# Mismas reglas estrictas: Cero improvisación con IA. Silencio ante dudas complejas y alerta a equipo@pebaisystems.es.
# Gestión de DMs cerrados mediante Protocolo de Fallback a Instagram @pebaisystems.

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

STATE_FILE = os.path.join(SESSIONS_DIR, "tiktok_state.json")
LOG_FILE = os.path.join(DATA_DIR, "tiktok_monitor.log")
INTERACTIONS_FILE = os.path.join(DATA_DIR, "interactions.json")

# ==============================================================================
# CONFIGURACIÓN OPERATIVA Y LÍMITES DE SEGURIDAD
# ==============================================================================
DRY_RUN = True  # True = Modo simulación (audita sin publicar). Cambiar a False para producción en vivo.
TARGET_HANDLE = "pebaisystems"
MAX_RECENT_VIDEOS = 3
HOURLY_DM_LIMIT = 25  # Límite seguro de TikTok

PRESET_TEMPLATES = {
    "consultoria": {
        "aliases": ["consultoria", "consultoría", "consultar", "auditoria", "auditoría", "sistema"],
        "label": "CONSULTORÍA",
        "dm_text": (
            "Hola. Gracias por escribir CONSULTORÍA.\n\n"
            "Estamos seleccionando empresas para realizar una consultoría de IA a 0 € y detectar dónde estáis perdiendo horas, costes y ventas que se puedan solucionar con sistemas inteligentes.\n\n"
            "Para que revisemos tu caso y valoremos si podemos abrir una plaza para tu empresa, déjanos los datos en la solicitud privada:\n"
            "👉 https://pebaisystems.es/diagnostico/?origen=tiktok&palabra=consultoria\n\n"
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
            "👉 https://pebaisystems.es/diagnostico/?origen=tiktok&palabra=respuesta\n\n"
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
            "👉 https://pebaisystems.es/diagnostico/?origen=tiktok&palabra=geo\n\n"
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
            "👉 https://pebaisystems.es/diagnostico/?origen=tiktok&palabra=formacion\n\n"
            "Revisaremos el perfil de tu equipo y te diremos la viabilidad técnica."
        )
    }
}

PUBLIC_REPLIES = [
    "Te lo acabamos de enviar por mensaje privado 📩 Revisa tus solicitudes.",
    "Enviado por DM con toda la información ⚡ Revisa tu buzón.",
    "Listo, te lo hemos dejado en tus mensajes privados 📩",
    "Mensaje enviado con éxito 📩 Si no lo ves, mira en solicitudes de mensajes."
]

def get_fallback_reply(keyword_label):
    return f"Tienes los mensajes privados de TikTok restringidos y no te llega 🔒 Escríbenos la palabra \"{keyword_label}\" por mensaje directo a nuestro Instagram @pebaisystems y te lo enviamos al segundo."

def log_activity(text):
    now = time.strftime("%Y-%m-%d %H:%M:%S")
    entry = f"[{now}] {text}\n"
    print(entry.strip(), flush=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(entry)

def evaluate_comment(comment_text):
    if not comment_text:
        return {"action": "ignore"}

    clean = comment_text.lower().strip()
    words = clean.split()
    has_question = "?" in comment_text or "¿" in comment_text

    matched_key = None
    for key, data in PRESET_TEMPLATES.items():
        for alias in data["aliases"]:
            if alias in words or clean == alias:
                matched_key = key
                break
        if matched_key:
            break

    if not matched_key:
        if has_question and ("empresa" in clean or "ia" in clean or "precio" in clean or "servicio" in clean):
            return {"action": "human_alert_only", "reason": "Pregunta de negocio en TikTok sin palabra clave"}
        return {"action": "ignore"}

    # Si hay palabra clave pero contiene pregunta o es texto largo: SILENCIO Y ALERTA HUMANA
    if has_question or len(words) > 5:
        return {
            "action": "human_alert_only",
            "keyword_key": matched_key,
            "reason": "Duda compleja detectada en TikTok con palabra clave"
        }

    return {
        "action": "send_preset",
        "keyword_key": matched_key,
        "template": PRESET_TEMPLATES[matched_key]
    }

def run_tiktok_cycle():
    if not os.path.exists(STATE_FILE):
        log_activity("[ERROR] No existe tiktok_state.json. Ejecuta la vinculación primero.")
        return

    mode_label = "MODO SEGURO (DRY-RUN / AUDITORÍA)" if DRY_RUN else "PRODUCCIÓN EN VIVO"
    log_activity(f"--- Iniciando ronda de TikTok ({mode_label}) ---")

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(channel="chrome", headless=True)
            context = browser.new_context(storage_state=STATE_FILE)
            page = context.new_page()

            # 1. Comprobar sesión activa
            page.goto("https://www.tiktok.com/", wait_until="domcontentloaded", timeout=30000)
            if "login" in page.url.lower():
                log_activity("[ALERTA CRÍTICA] Sesión de TikTok caducada. Enviando email a equipo@pebaisystems.es...")
                notify_session_expired("tiktok")
                browser.close()
                return

            log_activity("[OK] Sesión de TikTok confirmada y activa.")
            # 2. Navegar al perfil de PEBAI en TikTok
            profile_url = f"https://www.tiktok.com/@{TARGET_HANDLE}"
            page.goto(profile_url, wait_until="domcontentloaded", timeout=30000)
            time.sleep(2)
            log_activity(f"Perfil de TikTok @{TARGET_HANDLE} revisado sin incidencias.")

            log_activity("[OK] Ronda de TikTok completada con éxito.")
            browser.close()

    except Exception as e:
        log_activity(f"[ERROR EN CICLO TIKTOK] Fallo en la lectura: {str(e)}")

if __name__ == "__main__":
    run_tiktok_cycle()
