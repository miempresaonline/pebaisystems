# social-media-engine/auth_session.py
# Script de autenticación y captura de sesión persistente (Instagram / TikTok)
# Genera el archivo de estado de sesión (cookies y localStorage) para operar 24/7 en segundo plano.

import os
import sys
import json
import time
from playwright.sync_api import sync_playwright

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SESSIONS_DIR = os.path.join(BASE_DIR, "sessions")
os.makedirs(SESSIONS_DIR, exist_ok=True)

PLATFORMS = {
    "instagram": {
        "url": "https://www.instagram.com/accounts/login/",
        "verify_url": "https://www.instagram.com/",
        "cookie_key": "sessionid",
        "file": os.path.join(SESSIONS_DIR, "instagram_state.json")
    },
    "tiktok": {
        "url": "https://www.tiktok.com/login",
        "verify_url": "https://www.tiktok.com/",
        "cookie_key": "sessionid",
        "file": os.path.join(SESSIONS_DIR, "tiktok_state.json")
    }
}

def authenticate(platform_name):
    platform_name = platform_name.lower().strip()
    if platform_name not in PLATFORMS:
        print(f"[!] Plataforma '{platform_name}' no soportada. Usa 'instagram' o 'tiktok'.")
        sys.exit(1)

    cfg = PLATFORMS[platform_name]
    print("=" * 65)
    print(f"  AUTENTICACIÓN DE SESIÓN PERSISTENTE — {platform_name.upper()}")
    print("=" * 65)
    print(f"1. Se abrirá una ventana de Google Chrome oficial.")
    print(f"2. Inicia sesión normalmente con tu cuenta de PEBAI Systems.")
    print(f"3. Si te pide código 2FA o SMS, introdúcelo con total tranquilidad.")
    print(f"4. Una vez estés dentro de la cuenta, vuelve a esta consola y pulsa ENTER.")
    print("=" * 65)

    with sync_playwright() as p:
        # Lanzamos Chrome oficial en modo visible para el login manual
        browser = p.chromium.launch(channel="chrome", headless=False)
        context = browser.new_context(
            viewport={"width": 1280, "height": 800},
            locale="es-ES"
        )
        page = context.new_page()
        page.goto(cfg["url"])

        input("\n>>> Pulsa [ENTER] aquí cuando hayas terminado de iniciar sesión en Chrome... ")

        # Guardar estado de la sesión (cookies, local storage, tokens)
        print("\nCapturando cookies y credenciales de sesión...")
        state_path = cfg["file"]
        context.storage_state(path=state_path)

        # Verificación de que la sesión contiene cookies reales
        with open(state_path, "r", encoding="utf-8") as f:
            saved_state = json.load(f)
        
        cookies = saved_state.get("cookies", [])
        has_session_cookie = any(c.get("name") == cfg["cookie_key"] or "session" in c.get("name", "").lower() for c in cookies)

        if has_session_cookie:
            print(f"[OK] Sesión de {platform_name.upper()} guardada correctamente en:")
            print(f"     -> {state_path}")
            print(f"     -> {len(cookies)} cookies capturadas.")
            print("[OK] Esta sesión ya puede ser utilizada por el daemon 24/7 en segundo plano.")
        else:
            print(f"[AVISO] No se detectó cookie de sesión activa. Asegúrate de haber completado el login.")

        browser.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python auth_session.py [instagram|tiktok]")
        sys.exit(1)
    authenticate(sys.argv[1])
