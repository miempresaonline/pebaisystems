# social-media-engine/verify_session.py
# Comprueba si las sesiones guardadas (Instagram / TikTok) siguen activas y válidas.

import os
import sys
import json
from playwright.sync_api import sync_playwright

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SESSIONS_DIR = os.path.join(BASE_DIR, "sessions")

def check_platform(platform_name):
    state_file = os.path.join(SESSIONS_DIR, f"{platform_name}_state.json")
    if not os.path.exists(state_file):
        print(f"[-] No existe archivo de sesión para {platform_name.upper()} ({state_file})")
        print(f"    Ejecuta primero: python auth_session.py {platform_name}")
        return False

    print(f"[*] Comprobando sesión de {platform_name.upper()} en segundo plano (Headless)...")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        context = browser.new_context(storage_state=state_file)
        page = context.new_page()

        if platform_name == "instagram":
            page.goto("https://www.instagram.com/", wait_until="networkidle", timeout=25000)
            is_logged_in = "accounts/login" not in page.url and page.locator("svg[aria-label='Direct']").count() > 0 or "instagram.com" in page.url and "login" not in page.url
        elif platform_name == "tiktok":
            page.goto("https://www.tiktok.com/", wait_until="networkidle", timeout=25000)
            is_logged_in = "login" not in page.url and page.locator("header").count() > 0

        browser.close()

    if is_logged_in:
        print(f"[OK] Sesión de {platform_name.upper()} 100% ACTIVA y válida para operar 24/7.")
        return True
    else:
        print(f"[!] La sesión de {platform_name.upper()} ha caducado o requiere volver a iniciar sesión.")
        return False

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "all"
    if target in ["instagram", "all"]:
        check_platform("instagram")
    if target in ["tiktok", "all"]:
        check_platform("tiktok")
