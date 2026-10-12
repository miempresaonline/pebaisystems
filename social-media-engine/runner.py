# social-media-engine/runner.py
# Supervisor Daemon 24/7 para Instagram y TikTok — PEBAI Systems
# Diseñado para ejecutarse bajo PM2 en servidor sin intervención manual ni PC encendido.

import os
import sys
import time
import random

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from instagram_monitor import run_instagram_cycle
from tiktok_monitor import run_tiktok_cycle
from notifier import send_email_alert

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)
DAEMON_LOG = os.path.join(DATA_DIR, "daemon.log")

def log_daemon(text):
    now = time.strftime("%Y-%m-%d %H:%M:%S")
    entry = f"[{now}] {text}\n"
    print(entry.strip(), flush=True)
    with open(DAEMON_LOG, "a", encoding="utf-8") as f:
        f.write(entry)

def is_night_rest():
    """Descanso nocturno de 02:00 a 07:00 hora de España."""
    current_hour = time.localtime().tm_hour
    return 2 <= current_hour < 7

def main_loop():
    log_daemon("==================================================================")
    log_daemon("  INICIANDO MOTOR AUTÓNOMO DE REDES 24/7 — PEBAI SYSTEMS          ")
    log_daemon("==================================================================")
    log_daemon("Monitores activos: Instagram + TikTok + X")
    log_daemon("Regla estricta: Cero improvisación con IA. Alertas a equipo@pebaisystems.es.")
    log_daemon("------------------------------------------------------------------")

    consecutive_errors = 0

    while True:
        try:
            if is_night_rest():
                log_daemon("🌙 Horario nocturno (02:00 - 07:00). Pausando envíos salientes para proteger las cuentas.")
                time.sleep(600)  # Espera 10 minutos entre comprobaciones nocturnas
                continue

            # 1. Ciclo de Instagram
            log_daemon("⚡ Ejecutando ciclo de Instagram...")
            run_instagram_cycle()

            # Pausa humanizada entre plataformas (15 a 35 segundos)
            pause_between = random.uniform(15.0, 35.0)
            time.sleep(pause_between)

            # 2. Ciclo de TikTok
            log_daemon("⚡ Ejecutando ciclo de TikTok...")
            run_tiktok_cycle()

            consecutive_errors = 0

            # Intervalo de reposo aleatorio entre rondas (60 a 120 segundos)
            sleep_interval = random.uniform(60.0, 120.0)
            log_daemon(f"Pausa de seguridad de {sleep_interval:.1f}s antes de la siguiente ronda...")
            time.sleep(sleep_interval)

        except Exception as e:
            consecutive_errors += 1
            log_daemon(f"[ERROR CRÍTICO EN DAEMON] {str(e)}")
            
            # Si se producen 5 errores consecutivos, avisar al equipo
            if consecutive_errors == 5:
                send_email_alert(
                    subject="⚠️ [ALERTA DAEMON] Errores consecutivos en el motor de redes PEBAI",
                    html_content=f"<p>El daemon ha experimentado múltiples errores: {str(e)}</p>"
                )
            
            # Pausa de recuperación progresiva
            time.sleep(min(60 * consecutive_errors, 300))

if __name__ == "__main__":
    main_loop()
