import csv
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from config import Config, LeadStatus
from airtable_client import AirtableClient


def backup_all_tables() -> str:
    """
    Descarga una copia de seguridad íntegra de todas las tablas del CRM a JSON y CSV local.
    """
    client = AirtableClient()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir = Path(__file__).parent / "backups"
    backup_dir.mkdir(exist_ok=True)

    tables = [
        Config.AIRTABLE_TABLE_PHYSICAL,
        Config.AIRTABLE_TABLE_ONLINE,
        Config.AIRTABLE_TABLE_MEETINGS
    ]

    all_data = {}
    total_records = 0

    print(f"--- INICIANDO RESPALDO COMPLETO DE AIRTABLE [{timestamp}] ---")

    for tbl in tables:
        print(f"Descargando tabla: '{tbl}'...")
        try:
            records = client.fetch_all_records(tbl)
            all_data[tbl] = records
            total_records += len(records)
            print(f"  -> {len(records)} registros descargados de '{tbl}'")

            # Guardar también CSV individual de la tabla
            csv_path = backup_dir / f"{tbl.replace(' ', '_').replace('🎯', '').replace('🤝', '').strip()}_{timestamp}.csv"
            if records:
                all_field_names = set()
                for r in records:
                    all_field_names.update(r.get("fields", {}).keys())
                fieldnames = ["id", "createdTime"] + sorted(list(all_field_names))

                with open(csv_path, "w", newline="", encoding="utf-8-sig") as f:
                    writer = csv.DictWriter(f, fieldnames=fieldnames)
                    writer.writeheader()
                    for r in records:
                        row = {"id": r["id"], "createdTime": r.get("createdTime", "")}
                        for k, v in r.get("fields", {}).items():
                            row[k] = str(v) if isinstance(v, (list, dict)) else v
                        writer.writerow(row)
                print(f"  -> CSV exportado: {csv_path.name}")

        except Exception as e:
            print(f"  [ERROR en tabla {tbl}]: {e}")

    # Guardar dump completo en JSON
    json_path = backup_dir / f"backup_CRM_Master_IA_{timestamp}.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Respaldo finalizado con éxito.")
    print(f"Total registros respaldados: {total_records}")
    print(f"Archivo JSON maestro: {json_path}")
    return str(json_path)


def archive_and_prune(
    table_name: str,
    statuses_to_prune: List[str],
    dry_run: bool = True
):
    """
    Identifica registros en estados finales/descartados, los respalda en un archivo
    y los elimina de Airtable para mantener la base < 400 registros y evitar el límite de 1.000.
    """
    client = AirtableClient()
    print(f"\n--- PURGA Y ARCHIVADO INTELIGENTE: '{table_name}' ---")
    print(f"Estados a archivar: {statuses_to_prune}")
    print(f"Modo: {'SIMULACIÓN (Dry-run)' if dry_run else 'EJECUCIÓN REAL (Borrado)'}")

    records = client.fetch_all_records(table_name)
    candidates = []

    for r in records:
        status = r.get("fields", {}).get("Estado", "")
        if status in statuses_to_prune:
            candidates.append(r)

    print(f"Registros candidatos para archivar: {len(candidates)} de {len(records)}")

    if not candidates:
        print("No se encontraron registros para archivar con los estados indicados.")
        return

    # Guardar los candidatos en el archivo de archivo
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    archive_dir = Path(__file__).parent / "archived_data"
    archive_dir.mkdir(exist_ok=True)
    archive_file = archive_dir / f"archived_{table_name.replace(' ', '_')}_{timestamp}.json"

    with open(archive_file, "w", encoding="utf-8") as f:
        json.dump(candidates, f, ensure_ascii=False, indent=2)
    print(f"Registros respaldados en archivo histórico: {archive_file}")

    if dry_run:
        print("⚠️ Modo simulación activo. No se ha borrado ningún registro en Airtable.")
        print("Para ejecutar el borrado real, pasa dry_run=False o ejecuta con el flag --execute.")
        return

    # Borrado real en Airtable
    print(f"Borrando {len(candidates)} registros de Airtable para liberar espacio...")
    deleted_count = 0
    for r in candidates:
        ok = client.delete_record(table_name, r["id"])
        if ok:
            deleted_count += 1
            if deleted_count % 10 == 0:
                print(f"  {deleted_count}/{len(candidates)} eliminados...")

    print(f"✅ Se han eliminado {deleted_count} registros de Airtable.")
    print(f"Nuevo total estimado en '{table_name}': {len(records) - deleted_count} registros.")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "archive":
        # Por defecto archiva descartados y sin contacto
        execute = "--execute" in sys.argv
        archive_and_prune(
            table_name=Config.AIRTABLE_TABLE_PHYSICAL,
            statuses_to_prune=[
                LeadStatus.AI_DISCARDED,
                LeadStatus.AI_NO_CONTACT,
                LeadStatus.ADRIAN_NOT_INTERESTED
            ],
            dry_run=not execute
        )
    else:
        # Por defecto ejecuta un respaldo completo
        backup_all_tables()
