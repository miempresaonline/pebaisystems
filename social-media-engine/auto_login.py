# social-media-engine/auto_login.py
# Lanzador automático de inicio de sesión con ventana visible de Chrome y tecnología Stealth Anti-Detección

import os
import sys
import json
import time

# Forzar codificación UTF-8 en consola de Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Usamos patchright (Playwright con parches C++ anti-detección para bypass de Cloudflare y Facebook reCAPTCHA)
try:
    from patchright.sync_api import sync_playwright
except ImportError:
    from playwright.sync_api import sync_playwright

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SESSIONS_DIR = os.path.join(BASE_DIR, "sessions")
os.makedirs(SESSIONS_DIR, exist_ok=True)

TARGETS = {
    "instagram": {
        "name": "Instagram",
        "url": "https://www.instagram.com/accounts/login/",
        "state_file": os.path.join(SESSIONS_DIR, "instagram_state.json"),
        "success_indicators": ["sessionid", "ds_user_id"]
    },
    "tiktok": {
        "name": "TikTok",
        "url": "https://www.tiktok.com/login",
        "state_file": os.path.join(SESSIONS_DIR, "tiktok_state.json"),
        "success_indicators": ["sessionid", "sid_tt", "sessionid_ss"]
    },
    "facebook": {
        "name": "Facebook",
        "url": "https://www.facebook.com/login",
        "state_file": os.path.join(SESSIONS_DIR, "facebook_state.json"),
        "success_indicators": ["c_user", "xs"]
    },
    "x": {
        "name": "X (Twitter)",
        "url": "https://x.com/i/flow/login",
        "state_file": os.path.join(SESSIONS_DIR, "x_state.json"),
        "success_indicators": ["auth_token", "ct0"]
    }
}

def is_fully_logged_in(platform_key, page, cookies):
    cookie_names = [c["name"] for c in cookies]
    url_lower = page.url.lower()

    if platform_key == "facebook":
        if any(bad in url_lower for bad in ["checkpoint", "captcha", "two_factor", "two_step", "recover", "login"]):
            return False
        return "c_user" in cookie_names and "xs" in cookie_names

    elif platform_key == "instagram":
        if "accounts/login" in url_lower or "challenge" in url_lower:
            return False
        return "sessionid" in cookie_names or "ds_user_id" in cookie_names

    elif platform_key == "tiktok":
        if "login" in url_lower:
            return False
        return any(c in cookie_names for c in ["sessionid", "sid_tt", "sessionid_ss"])

    elif platform_key == "x":
        if "i/flow/login" in url_lower:
            return False
        return "auth_token" in cookie_names

    return False

def run_auto_login(platform_key):
    platform_key = platform_key.lower().strip()
    if platform_key not in TARGETS:
        print(f"Error: Plataforma '{platform_key}' no reconocida.")
        sys.exit(1)

    cfg = TARGETS[platform_key]
    profile_dir = os.path.join(SESSIONS_DIR, f"profile_{platform_key}")
    os.makedirs(profile_dir, exist_ok=True)

    print("=" * 65, flush=True)
    print(f"   VINCULADOR STEALTH DE {cfg['name'].upper()} — PEBAI SYSTEMS", flush=True)
    print("=" * 65, flush=True)
    print(f"\n[1] Abriendo ventana oficial de Google Chrome (Modo Humano Stealth)...", flush=True)
    print(f"[2] Si te pide reCAPTCHA, resuélvelo. El sistema ahora es 100% indetectable.", flush=True)
    print(f"[3] La ventana esperará a que estés dentro del muro/feed de {cfg['name']}.\n", flush=True)

    with sync_playwright() as p:
        context = p.chromium.launch_persistent_context(
            user_data_dir=profile_dir,
            channel="chrome",
            headless=False,
            ignore_default_args=["--enable-automation"],
            args=[
                "--disable-blink-features=AutomationControlled",
                "--start-maximized",
                "--no-sandbox"
            ],
            viewport=None
        )

        page = context.pages[0] if context.pages else context.new_page()
        page.goto(cfg["url"])
        print(f"[*] Ventana abierta en: {cfg['url']}", flush=True)
        print("[*] Esperando que completes el inicio de sesión...", flush=True)

        max_wait_seconds = 360  # 6 minutos
        start_time = time.time()
        logged_in = False

        while time.time() - start_time < max_wait_seconds:
            time.sleep(2)
            try:
                cookies = context.cookies()
                if is_fully_logged_in(platform_key, page, cookies):
                    logged_in = True
                    print(f"\n[OK] ¡Inicio de sesión confirmado en {cfg['name']}!", flush=True)
                    print("[*] Estabilizando sesión y guardando tokens...", flush=True)
                    time.sleep(4)
                    context.storage_state(path=cfg["state_file"])
                    print(f"[OK] Sesión guardada con éxito en:\n     {cfg['state_file']}", flush=True)
                    break
            except Exception as e:
                pass

        if not logged_in:
            print("\n[!] Tiempo límite de espera agotado.", flush=True)
        else:
            time.sleep(1)

        context.close()

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "instagram"
    run_auto_login(target)
