import sys
import os
import json
import argparse
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from content_calendar import FULL_14_DAY_CALENDAR, get_day_carousel
from generator import build_carousel

STATE_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "state.json"))

def load_state() -> dict:
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {"current_day": 1, "published": []}

def save_state(state: dict):
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)

def run(target_day: int = None, advance: bool = False):
    state = load_state()
    
    if target_day is None:
        target_day = state.get("current_day", 1)

    print(f"\n=======================================================")
    print(f"[PEBAI SYSTEMS] GENERADOR DIARIO DE CARRUSELES B2B")
    print(f"=======================================================")
    print(f"[Secuencia] Dia: {target_day} de 14")

    carousel_data = get_day_carousel(target_day)
    print(f"[Tema] {carousel_data.get('topic')}")
    print(f"[Formato] {carousel_data.get('type')}")
    print(f"[Palabra clave] {carousel_data.get('keyword')}")
    print(f"-------------------------------------------------------")

    meta = build_carousel(carousel_data)

    if advance:
        next_day = (target_day % len(FULL_14_DAY_CALENDAR)) + 1
        state["current_day"] = next_day
        state["published"].append({
            "day": target_day,
            "id": carousel_data.get("id"),
            "timestamp": meta.get("id")
        })
        save_state(state)
        print(f"[OK] Secuencia avanzada. Proximo dia configurado: {next_day}")

    print(f"\n[OK] Carrusel generado con exito!")
    print(f"Diapositivas: {len(meta.get('slide_images', []))}")
    print(f"Copy listo en: {meta.get('caption_file')}")
    print(f"Dashboard: carousel-engine/dashboard.html\n")
    return meta

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generador diario de carruseles para PEBAI Systems")
    parser.add_argument("--day", type=int, default=None, help="Número de día a generar (1-14)")
    parser.add_argument("--next", action="store_true", help="Avanzar automáticamente al siguiente día tras generar")
    args = parser.parse_args()

    run(target_day=args.day, advance=args.next)
