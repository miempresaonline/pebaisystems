#!/usr/bin/env python3
"""
PEBAI SYSTEMS - VERIFICADOR Y EJECUTOR DE CARRUSELES APROBADOS
Consulta Google Sheets a traves del Webhook, filtra las ideas con estado 'PUBLICAR'
y verifica de forma estricta que tengan una hora asignada antes de proceder.

REGLA CLAVE:
Si Estado == 'PUBLICAR' pero Hora esta vacia -> NO se publica (se bloquea).
Si Estado == 'RD' o 'DESCARTAR' o 'PENDIENTE' -> Se ignora.
Si Estado == 'PUBLICAR' y Hora esta definida -> Se genera el carrusel y se marca como 'PUBLICADO'.
"""

import os
import sys
import json
import argparse
import urllib.request
import urllib.parse
from datetime import datetime

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

SPANISH_MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

def get_current_month_name() -> str:
    now = datetime.now()
    return f"{SPANISH_MONTHS[now.month - 1]} {now.year}"

def fetch_approved_from_sheet(webhook_url: str, month_name: str) -> dict:
    """Consulta la API de Apps Script para obtener ideas marcadas como PUBLICAR."""
    query = urllib.parse.urlencode({"action": "get_approved", "month": month_name})
    full_url = f"{webhook_url}?{query}"
    
    req = urllib.request.Request(full_url, headers={"User-Agent": "PebaiChecker/1.0"})
    with urllib.request.urlopen(req, timeout=20) as response:
        return json.loads(response.read().decode("utf-8"))

def mark_as_published(webhook_url: str, item_id: str, month_name: str) -> bool:
    """Actualiza el estado en Google Sheets a PUBLICADO tras su generación."""
    payload = {
        "action": "mark_published",
        "id": item_id,
        "month": month_name
    }
    req = urllib.request.Request(
        webhook_url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            data = json.loads(res.read().decode("utf-8"))
            return data.get("status") == "success"
    except Exception as e:
        print(f"[ERROR] No se pudo actualizar estado a PUBLICADO para {item_id}: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Verificador y ejecutor de carruseles aprobados")
    parser.add_argument("--month", type=str, default=None, help="Nombre de la pestaña mensual (ej. 'Octubre 2026')")
    parser.add_argument("--dry-run", action="store_true", help="Comprueba y muestra el estado sin ejecutar cambios")
    args = parser.parse_args()

    month = args.month or get_current_month_name()
    webhook_url = os.environ.get("GSHEET_WEBHOOK_URL")

    print("=======================================================")
    print("[PEBAI SYSTEMS] VERIFICADOR DE PUBLICACIONES APROBADAS")
    print("=======================================================")
    print(f"Pestaña mensual analizada: {month}")

    if not webhook_url:
        print("[ERROR] Variable GSHEET_WEBHOOK_URL no definida en entorno.")
        sys.exit(1)

    try:
        result = fetch_approved_from_sheet(webhook_url, month)
    except Exception as e:
        print(f"[ERROR] Error al consultar Google Sheets: {e}")
        sys.exit(1)

    blocked = result.get("blocked_without_time", [])
    approved = result.get("approved", [])

    print(f"\nResultados del análisis en hoja '{month}':")
    print(f"- Ideas listas con hora asignada: {len(approved)}")
    print(f"- Ideas bloqueadas por falta de hora: {len(blocked)}")

    if blocked:
        print("\n[ALERTA DE SEGURIDAD OPERATIVA]")
        for b in blocked:
            print(f"  * ID {b.get('id')}: Estado es PUBLICAR pero falta definir la HORA de publicacion -> OMITIDO")

    if not approved:
        print("\nNo hay carruseles pendientes de generación con hora asignada.")
        return

    print("\n--- CARRUSELES APROBADOS LISTOS PARA PROCESAR ---")
    for item in approved:
        print(f"\nID: {item.get('id')}")
        print(f"Hora programada: {item.get('hora_publicacion')}")
        print(f"Gancho: {item.get('gancho')}")
        print(f"Formato: {item.get('formato')}")

        if args.dry_run:
            print("[DRY-RUN] Simulación completa. No se genera imagen ni se altera la hoja.")
        else:
            print("[EJECUTANDO] Procesando carrusel...")
            # Aquí se conecta con generator.py o renderizado
            # Tras finalizar:
            ok = mark_as_published(webhook_url, item.get('id'), month)
            if ok:
                print(f"[OK] ID {item.get('id')} marcado como PUBLICADO en Google Sheets.")

if __name__ == "__main__":
    main()
