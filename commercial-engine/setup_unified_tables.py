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

# Definición estándar y unificada de campos para TODAS las tablas
UNIFIED_FIELDS_DEFS = [
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
        "name": "Estado",
        "type": "singleSelect",
        "options": {
            "choices": [
                {"name": "⚪ Nuevo / Sin llamar"},
                {"name": "🟡 No contesta 1"},
                {"name": "🟠 No contesta 2"},
                {"name": "🔴 No contesta 3"},
                {"name": "⏰ Callback"},
                {"name": "🟢 Interesado"},
                {"name": "💬 WhatsApp Enviado"},
                {"name": "❌ No me interesa"},
                {"name": "❌ No interesado (Cliente)"},
                {"name": "⚠️ Tel. Erróneo"}
            ]
        }
    },
    {
        "name": "Próxima acción",
        "type": "singleSelect",
        "options": {
            "choices": [
                {"name": "📞 Llamar"},
                {"name": "💬 Enviar WhatsApp"},
                {"name": "🤖 Llamar con IA"},
                {"name": "🗓️ Agendar consultoría"},
                {"name": "✉️ Enviar email"},
                {"name": "🔁 Seguimiento"},
                {"name": "✅ Cerrar ficha"}
            ]
        }
    },
    {
        "name": "Fecha próxima acción",
        "type": "dateTime",
        "options": {
            "dateFormat": {"name": "iso"},
            "timeFormat": {"name": "24hour"},
            "timeZone": "Europe/Madrid"
        }
    },
    {"name": "Teléfono", "type": "phoneNumber"},
    {"name": "WhatsApp", "type": "phoneNumber"},
    {"name": "Email", "type": "email"},
    {"name": "Web", "type": "url"},
    {"name": "Instagram / Redes", "type": "url"},
    {"name": "TikTok", "type": "url"},
    {"name": "Ciudad / Provincia", "type": "singleLineText"},
    {"name": "Dirección", "type": "singleLineText"},
    {"name": "⭐ Reseñas Google", "type": "singleLineText"},
    {"name": "👥 Tamaño Estimado", "type": "singleLineText"},
    {"name": "🎯 Gancho Sugerido", "type": "singleLineText"},
    {
        "name": "Cualificación",
        "type": "singleSelect",
        "options": {
            "choices": [
                {"name": "⚪ Por cualificar", "color": "grayBright"},
                {"name": "🟢 ICP — buen encaje", "color": "greenBright"},
                {"name": "🟡 Encaje parcial", "color": "yellowBright"},
                {"name": "🔴 Fuera de ICP", "color": "redBright"}
            ]
        }
    },
    {
        "name": "Motivo de pérdida",
        "type": "singleSelect",
        "options": {
            "choices": [
                {"name": "Sin presupuesto"},
                {"name": "Sin necesidad"},
                {"name": "No es decisor"},
                {"name": "Competencia"},
                {"name": "Sin respuesta"},
                {"name": "Datos erróneos"},
                {"name": "Otro"}
            ]
        }
    },
    {"name": "Notas", "type": "multilineText"}
]

PHYSICAL_NICHE_MAP = {
    "Clínica Dental": "Clínicas (Físico)",
    "Medicina Estética": "Clínicas (Físico)",
    "Despacho de Abogados / Asesoría": "Abogados y Asesorías (Físico)",
    "Inmobiliaria": "Inmobiliarias (Físico)",
    "Reformas Integrales": "Reformas (Físico)"
}


class UnifiedNicheSetup:
    def __init__(self):
        self.pat = Config.AIRTABLE_PAT
        self.base_id = Config.AIRTABLE_BASE_ID
        self.headers = {
            "Authorization": f"Bearer {self.pat}",
            "Content-Type": "application/json"
        }

    def get_tables(self) -> Dict[str, Dict[str, Any]]:
        url = f"https://api.airtable.com/v0/meta/bases/{self.base_id}/tables"
        resp = requests.get(url, headers=self.headers)
        if resp.status_code != 200:
            raise RuntimeError(f"Error obteniendo tablas de Airtable: {resp.text}")
        tables = resp.json().get("tables", [])
        return {t["name"]: t for t in tables}

    def ensure_table_with_fields(self, table_name: str, existing_tables: Dict[str, Dict[str, Any]]) -> str:
        """
        Crea la tabla con todos los campos unificados, o si ya existe, añade los campos faltantes.
        """
        if table_name in existing_tables:
            table_obj = existing_tables[table_name]
            table_id = table_obj["id"]
            existing_field_names = {f["name"] for f in table_obj.get("fields", [])}
            print(f"  Tabla '{table_name}' existe ({table_id}). Verificando campos...")

            for f_def in UNIFIED_FIELDS_DEFS:
                if f_def["name"] not in existing_field_names:
                    print(f"    Añadiendo campo faltante: '{f_def['name']}'...")
                    field_url = f"https://api.airtable.com/v0/meta/bases/{self.base_id}/tables/{table_id}/fields"
                    f_resp = requests.post(field_url, headers=self.headers, json=f_def)
                    if f_resp.status_code in [200, 201]:
                        print(f"    ✅ Campo '{f_def['name']}' añadido.")
                        existing_field_names.add(f_def["name"])
                    else:
                        print(f"    [Error campo {f_def['name']}]: {f_resp.text}")
                    time.sleep(0.2)
            return table_id

        # Crear tabla nueva
        print(f"  Creando tabla unificada '{table_name}'...")
        url = f"https://api.airtable.com/v0/meta/bases/{self.base_id}/tables"
        payload = {
            "name": table_name,
            "description": f"Tabla unificada de nicho: {table_name}",
            "fields": [{"name": "Empresa", "type": "singleLineText"}] + UNIFIED_FIELDS_DEFS
        }
        resp = requests.post(url, headers=self.headers, json=payload)
        if resp.status_code in [200, 201]:
            table_id = resp.json()["id"]
            print(f"  ✅ Tabla '{table_name}' creada exitosamente ({table_id}).")
            return table_id
        else:
            raise RuntimeError(f"Error creando tabla '{table_name}': {resp.text}")

    def migrate_physical_leads(self, backup_file: str, dry_run: bool = True):
        """
        Distribuye exclusivamente los 850 leads físicos a sus 4 tablas unificadas.
        NO toca '🎯 Leads Full Online'.
        """
        print("=" * 65)
        print(f"🚀 DISTRIBUCIÓN UNIFICADA DE LEADS FÍSICOS (Modo: {'SIMULACIÓN' if dry_run else 'EJECUCIÓN REAL'})")
        print("=" * 65)

        with open(backup_file, "r", encoding="utf-8") as f:
            backup_data = json.load(f)

        physical_records = backup_data.get(Config.AIRTABLE_TABLE_PHYSICAL, [])
        print(f"Total leads físicos en respaldo: {len(physical_records)}")

        # Clasificar por nicho
        buckets: Dict[str, List[Dict[str, Any]]] = {
            "Clínicas (Físico)": [],
            "Abogados y Asesorías (Físico)": [],
            "Inmobiliarias (Físico)": [],
            "Reformas (Físico)": []
        }

        for r in physical_records:
            fields = r.get("fields", {})
            sector = fields.get("Sector / Nicho", "").strip()
            target_table = PHYSICAL_NICHE_MAP.get(sector, "Clínicas (Físico)")

            # Preservar TODOS los datos
            record_clean = {
                "Empresa": fields.get("Empresa", "Sin Nombre"),
                "Sector / Nicho": sector or target_table,
                "Encargado": fields.get("Encargado") or "👤 Adrián Ballesteros",
                "Estado": fields.get("Estado (Detallado)") or "⚪ Nuevo / Sin llamar",
                "Próxima acción": fields.get("Próxima acción") or "📞 Llamar",
                "Teléfono": fields.get("Teléfono", ""),
                "Email": fields.get("Email", ""),
                "Web": fields.get("Web", ""),
                "Instagram / Redes": fields.get("Instagram / Redes", ""),
                "Ciudad / Provincia": fields.get("Ciudad / Provincia", ""),
                "Dirección": fields.get("Dirección", ""),
                "⭐ Reseñas Google": fields.get("⭐ Reseñas Google", ""),
                "👥 Tamaño Estimado": fields.get("👥 Tamaño Estimado", ""),
                "🎯 Gancho Sugerido": fields.get("🎯 Gancho Sugerido", ""),
                "Cualificación": fields.get("Cualificación", ""),
                "Motivo de pérdida": fields.get("Motivo de pérdida", ""),
                "Notas": fields.get("Notas", "")
            }

            # Limpieza de valores vacíos para Airtable
            record_clean = {k: v for k, v in record_clean.items() if v}
            buckets[target_table].append(record_clean)

        print("\nDistribución planificada:")
        for tbl, leads in buckets.items():
            print(f"  - {tbl}: {len(leads)} leads")

        if dry_run:
            print("\n⚠️ Modo simulación. Ejecuta con --execute para crear las tablas y subir los leads.")
            return

        # EJECUCIÓN REAL
        print("\n--- PASO 1: ASEGURAR TABLAS Y CAMPOS UNIFICADOS ---")
        existing_tables = self.get_tables()
        for tbl in buckets.keys():
            self.ensure_table_with_fields(tbl, existing_tables)
            time.sleep(0.3)

        print("\n--- PASO 2: SUBIENDO LEADS EN LOTES DE 10 ---")
        for tbl, leads in buckets.items():
            table_encoded = urllib.parse.quote(tbl)
            url = f"https://api.airtable.com/v0/{self.base_id}/{table_encoded}"
            print(f"\nSubiendo {len(leads)} leads a '{tbl}'...")

            batch_size = 10
            total_uploaded = 0
            for i in range(0, len(leads), batch_size):
                batch = leads[i:i + batch_size]
                payload = {
                    "records": [{"fields": r} for r in batch],
                    "typecast": True
                }
                resp = requests.post(url, headers=self.headers, json=payload)
                if resp.status_code in [200, 201]:
                    total_uploaded += len(batch)
                    print(f"  -> {total_uploaded}/{len(leads)} leads subidos a '{tbl}'...")
                else:
                    print(f"  [Error subiendo a {tbl}]: {resp.text}")
                time.sleep(0.25)

            print(f"✅ Tabla '{tbl}' completada con {total_uploaded} leads.")

        print("\n" + "=" * 65)
        print("🎉 MIGRACIÓN UNIFICADA DE LEADS FÍSICOS COMPLETADA CON ÉXITO")
        print("=" * 65)


if __name__ == "__main__":
    backup_file = Path(__file__).parent / "backups" / "backup_CRM_Master_IA_20260917_150142.json"
    execute = "--execute" in sys.argv
    setup = UnifiedNicheSetup()
    setup.migrate_physical_leads(str(backup_file), dry_run=not execute)
