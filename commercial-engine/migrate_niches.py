import json
import os
import sys
import time
import urllib.parse
from pathlib import Path
from typing import Any, Dict, List
import requests

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from config import Config

NICHE_MAPPING = {
    # Físicos
    "Clínica Dental": "Clínicas (Físico)",
    "Medicina Estética": "Clínicas (Físico)",
    "Despacho de Abogados / Asesoría": "Abogados y Asesorías (Físico)",
    "Inmobiliaria": "Inmobiliarias (Físico)",
    "Reformas Integrales": "Reformas (Físico)",
    # Online
    "Instalaciones Solares y Autoconsumo": "Energía Solar (Online)",
    "Piscinas Prefabricadas y Poliéster": "Piscinas (Online)",
    "Casas Prefabricadas y Modulares": "Casas Modulares (Online)",
    "Importación de Vehículos": "Importación Vehículos (Online)"
}

STANDARD_FIELDS = [
    {
        "name": "Sector / Nicho",
        "type": "singleLineText"
    },
    {
        "name": "Encargado",
        "type": "singleSelect",
        "options": {
            "choices": [
                {"name": "👤 Adrián Ballesteros", "color": "blueBright"},
                {"name": "👤 Daniel Peñuela", "color": "tealBright"},
                {"name": "🤖 Inteligencia Artificial", "color": "purpleBright"}
            ]
        }
    },
    {
        "name": "Estado (Detallado)",
        "type": "singleSelect",
        "options": {
            "choices": [
                {"name": "⚪ Nuevo / Sin llamar", "color": "grayBright"},
                {"name": "🟡 No contesta 1", "color": "yellowBright"},
                {"name": "🟠 No contesta 2", "color": "orangeBright"},
                {"name": "🔴 No contesta 3", "color": "redBright"},
                {"name": "⏰ Callback", "color": "cyanBright"},
                {"name": "🟢 Interesado", "color": "greenBright"},
                {"name": "💬 WhatsApp Enviado", "color": "blueBright"},
                {"name": "❌No interesado", "color": "redDark"},
                {"name": "⚠️Tel. Erróneo", "color": "orangeDark"}
            ]
        }
    },
    {
        "name": "Próxima acción",
        "type": "singleSelect",
        "options": {
            "choices": [
                {"name": "📞 Llamar", "color": "blueBright"},
                {"name": "💬 Enviar WhatsApp", "color": "tealBright"},
                {"name": "🤖 Llamar con IA", "color": "purpleBright"},
                {"name": "🗓️ Agendar consultoría", "color": "greenBright"},
                {"name": "✉️ Enviar email", "color": "yellowBright"},
                {"name": "🔁 Seguimiento", "color": "orangeBright"},
                {"name": "✅ Cerrar ficha", "color": "grayBright"}
            ]
        }
    },
    {"name": "Teléfono", "type": "phoneNumber"},
    {"name": "Email", "type": "email"},
    {"name": "Web", "type": "url"},
    {"name": "Notas", "type": "multilineText"},
    {"name": "Ciudad / Provincia", "type": "singleLineText"}
]


class NicheMigrator:
    def __init__(self):
        self.pat = Config.AIRTABLE_PAT
        self.base_id = Config.AIRTABLE_BASE_ID
        self.headers = {
            "Authorization": f"Bearer {self.pat}",
            "Content-Type": "application/json"
        }

    def get_existing_tables(self) -> Dict[str, str]:
        url = f"https://api.airtable.com/v0/meta/bases/{self.base_id}/tables"
        resp = requests.get(url, headers=self.headers)
        if resp.status_code != 200:
            raise RuntimeError(f"Error obteniendo tablas de Airtable: {resp.text}")
        tables = resp.json().get("tables", [])
        return {t["name"]: t["id"] for t in tables}

    def ensure_niche_table(self, table_name: str, existing_tables: Dict[str, str]) -> str:
        """
        Crea la tabla de nicho con todos sus campos si no existe todavía.
        """
        if table_name in existing_tables:
            print(f"  [OK] Tabla '{table_name}' ya existe (ID: {existing_tables[table_name]})")
            return existing_tables[table_name]

        print(f"  [CREANDO] Creando nueva tabla de nicho: '{table_name}'...")
        url = f"https://api.airtable.com/v0/meta/bases/{self.base_id}/tables"
        payload = {
            "name": table_name,
            "description": f"Tabla segmentada para el nicho {table_name}",
            "fields": [{"name": "Empresa", "type": "singleLineText"}] + STANDARD_FIELDS
        }
        resp = requests.post(url, headers=self.headers, json=payload)
        if resp.status_code in [200, 201]:
            new_id = resp.json()["id"]
            existing_tables[table_name] = new_id
            print(f"  ✅ Tabla '{table_name}' creada exitosamente (ID: {new_id})")
            return new_id
        else:
            raise RuntimeError(f"Error al crear tabla '{table_name}': {resp.text}")

    def migrate_leads(self, backup_file: str, dry_run: bool = True):
        """
        Lee el archivo de respaldo y distribuye los leads en sus tablas de nicho correspondientes.
        """
        print("=" * 60)
        print(f"🚀 INICIANDO DISTRIBUCIÓN POR NICHOS (Modo: {'SIMULACIÓN' if dry_run else 'EJECUCIÓN REAL'})")
        print("=" * 60)

        with open(backup_file, "r", encoding="utf-8") as f:
            backup_data = json.load(f)

        existing_tables = self.get_existing_tables()

        # Agrupar leads por tabla de destino
        niche_buckets: Dict[str, List[Dict[str, Any]]] = {}

        for orig_table, records in backup_data.items():
            if orig_table == Config.AIRTABLE_TABLE_MEETINGS:
                continue

            for r in records:
                fields = r.get("fields", {})
                sector = fields.get("Sector / Nicho", "").strip()
                target_table = NICHE_MAPPING.get(sector)

                if not target_table:
                    # Si no está en el mapa, clasificar por nombre
                    if "Físicos" in orig_table:
                        target_table = "Otros (Físico)"
                    else:
                        target_table = "Otros (Online)"

                if target_table not in niche_buckets:
                    niche_buckets[target_table] = []

                # Adaptar campos limpios para la nueva tabla
                phone = fields.get("Teléfono") or fields.get("WhatsApp") or fields.get("Teléfono o WhatsApp", "")
                encargado = fields.get("Encargado")
                # Si no tiene encargado, por defecto es Adrián
                if not encargado:
                    encargado = "👤 Adrián Ballesteros"

                status = fields.get("Estado (Detallado)") or fields.get("Estado") or "⚪ Nuevo / Sin llamar"
                # Limpieza de espacios en estados
                status = status.strip()
                if status == "❌  Descartado":
                    status = "❌No interesado"

                new_record = {
                    "Empresa": fields.get("Empresa", "Sin Nombre"),
                    "Sector / Nicho": sector or target_table,
                    "Encargado": encargado,
                    "Estado (Detallado)": status,
                    "Próxima acción": fields.get("Próxima acción", "📞 Llamar"),
                    "Teléfono": phone,
                    "Email": fields.get("Email", ""),
                    "Web": fields.get("Web") or fields.get("Web / Redes", ""),
                    "Notas": fields.get("Notas", ""),
                    "Ciudad / Provincia": fields.get("Ciudad / Provincia") or fields.get("Ciudad / Base", "")
                }
                # Eliminar campos con valores vacíos
                new_record = {k: v for k, v in new_record.items() if v}
                niche_buckets[target_table].append(new_record)

        print("\nResumen de distribución por nicho:")
        for tbl, items in sorted(niche_buckets.items()):
            print(f"  - {tbl}: {len(items)} leads")

        if dry_run:
            print("\n⚠️ Modo simulación activo. No se crearon tablas ni se insertaron registros.")
            print("Para ejecutar la migración completa, pasa dry_run=False o usa el flag --execute.")
            return

        # EJECUCIÓN REAL: Crear tablas y subir en lotes de 10
        print("\n--- CREANDO TABLAS Y SUBIENDO REGISTROS ---")
        for target_table, records in niche_buckets.items():
            table_id = self.ensure_niche_table(target_table, existing_tables)
            table_encoded = urllib.parse.quote(target_table)
            url = f"https://api.airtable.com/v0/{self.base_id}/{table_encoded}"

            print(f"\nSubiendo {len(records)} leads a '{target_table}'...")
            batch_size = 10
            total_uploaded = 0

            for i in range(0, len(records), batch_size):
                batch = records[i:i + batch_size]
                payload = {
                    "records": [{"fields": r} for r in batch],
                    "typecast": True
                }
                resp = requests.post(url, headers=self.headers, json=payload)
                if resp.status_code in [200, 201]:
                    total_uploaded += len(batch)
                    print(f"  -> {total_uploaded}/{len(records)} subidos...")
                else:
                    print(f"  [Error subiendo lote a {target_table}]: {resp.text}")
                time.sleep(0.25)  # Rate limit safety

            print(f"✅ {total_uploaded} leads cargados en '{target_table}'.")

        print("\n" + "=" * 60)
        print("🎉 MIGRACIÓN Y DISTRIBUCIÓN POR NICHOS COMPLETADA")
        print("=" * 60)


if __name__ == "__main__":
    backup_file = Path(__file__).parent / "backups" / "backup_CRM_Master_IA_20260917_150142.json"
    execute = "--execute" in sys.argv
    migrator = NicheMigrator()
    migrator.migrate_leads(str(backup_file), dry_run=not execute)
