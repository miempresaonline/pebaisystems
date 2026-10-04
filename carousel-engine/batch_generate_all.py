import sys
import os
import time

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from content_calendar import FULL_14_DAY_CALENDAR
from generator import build_carousel
from build_dashboard import build_dashboard

def main():
    print("===============================================================")
    print("[BATCH RENDER] Generando 14 carruseles de alta variedad visual...")
    print("===============================================================")
    
    start_time = time.time()
    for idx, item in enumerate(FULL_14_DAY_CALENDAR, 1):
        day_num = item["day"]
        day_type = item["type"]
        topic = item["topic"]
        print(f"\n--- [Dia {day_num}/14] {topic} ({day_type}) ---")
        build_carousel(item)

    print("\n===============================================================")
    print("[DASHBOARD] Reconstruyendo dashboard.html con la nueva secuencia...")
    build_dashboard()
    print("===============================================================")
    print(f"Todo listo en {time.time() - start_time:.1f} segundos.")

if __name__ == "__main__":
    main()
