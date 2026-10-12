import os
import sys
import time
import urllib.parse
from typing import Dict, List, Optional
import requests

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from config import Config


def derive_next_action(status: str, encargado: str) -> str:
    """
    Determina la 'Próxima acción' automáticamente en función del Estado y del Encargado.
    Adrián nunca tiene que tocar este campo: el sistema lo calcula solo.
    """
    status = (status or "").strip()
    is_ai = "Inteligencia Artificial" in (encargado or "")

    if "No me interesa" in status:
        return "🤖 Llamar con IA"
    elif "Nuevo" in status or "Sin llamar" in status:
        return "🤖 Llamar con IA" if is_ai else "📞 Llamar"
    elif "No contesta 1" in status or "No contesta 2" in status:
        return "🤖 Llamar con IA" if is_ai else "📞 Llamar"
    elif "No contesta 3" in status:
        return "✅ Cerrar ficha"
    elif "Interesado" in status:
        return "🗓️ Agendar consultoría"
    elif "WhatsApp" in status:
        return "🔁 Seguimiento"
    elif "Callback" in status:
        return "📞 Llamar"
    elif "No interesado" in status or "Descartado" in status:
        return "✅ Cerrar ficha"
    elif "Tel. Erróneo" in status:
        return "✅ Cerrar ficha"
    return "📞 Llamar"


class AirtableRealtimeWatcher:
    def __init__(self, check_interval: float = 3.0):
        self.pat = Config.AIRTABLE_PAT
        self.base_id = Config.AIRTABLE_BASE_ID
        self.headers = {
            "Authorization": f"Bearer {self.pat}",
            "Content-Type": "application/json"
        }
        self.interval = check_interval
        self.tables = Config.PHYSICAL_NICHE_TABLES + [Config.AIRTABLE_TABLE_ONLINE]

    def _request(self, method: str, endpoint: str, params: Optional[Dict] = None, json_data: Optional[Dict] = None):
        url = f"https://api.airtable.com/v0/{self.base_id}/{endpoint}"
        return requests.request(method, url, headers=self.headers, params=params, json=json_data, timeout=15)

    def run_once(self):
        """
        Escanea todas las tablas y realiza dos automatizaciones instantáneas:
        1. Si Estado == '❌ No me interesa' -> cambia Encargado a '🤖 Inteligencia Artificial'.
        2. Sincroniza 'Próxima acción' automáticamente según el Estado.
        """
        for tbl in self.tables:
            table_encoded = urllib.parse.quote(tbl)

            # 1. Buscar leads donde Adrián marcó 'No me interesa'
            formula_deprioritized = "AND({Estado} = '❌ No me interesa', {Encargado} != '🤖 Inteligencia Artificial')"
            resp = self._request("GET", table_encoded, params={"filterByFormula": formula_deprioritized})
            if resp.status_code == 200:
                recs = resp.json().get("records", [])
                for r in recs:
                    rec_id = r["id"]
                    empresa = r.get("fields", {}).get("Empresa", "Sin Nombre")
                    patch_payload = {
                        "records": [
                            {
                                "id": rec_id,
                                "fields": {
                                    "Encargado": "🤖 Inteligencia Artificial",
                                    "Próxima acción": "🤖 Llamar con IA"
                                }
                            }
                        ],
                        "typecast": True
                    }
                    p_resp = self._request("PATCH", table_encoded, json_data=patch_payload)
                    if p_resp.status_code == 200:
                        print(f"⚡ [TRASPASO AUTOMÁTICO] Lead '{empresa}' en '{tbl}' ➔ Encargado cambiado a 🤖 Inteligencia Artificial.")

            # 2. Sincronizar Próxima acción según el Estado si está vacío o desalineado
            # Consultamos los leads que tengan un estado pero próxima acción no asignada
            formula_sync_action = "AND({Estado} != '', {Próxima acción} = '')"
            resp_action = self._request("GET", table_encoded, params={"filterByFormula": formula_sync_action, "pageSize": 20})
            if resp_action.status_code == 200:
                action_recs = resp_action.json().get("records", [])
                for r in action_recs:
                    rec_id = r["id"]
                    fields = r.get("fields", {})
                    st = fields.get("Estado", "")
                    enc = fields.get("Encargado", "")
                    derived_action = derive_next_action(st, enc)

                    patch_data = {
                        "records": [{"id": rec_id, "fields": {"Próxima acción": derived_action}}],
                        "typecast": True
                    }
                    self._request("PATCH", table_encoded, json_data=patch_data)

    def start_loop(self):
        print("=" * 65)
        print("👀 AIRTABLE REALTIME WATCHER ACTIVO (PAI SYSTEMS)")
        print(f"Monitoreando tablas: {', '.join(self.tables)}")
        print("Regla activa: Estado = '❌ No me interesa' ➔ Encargado = '🤖 Inteligencia Artificial'")
        print("=" * 65)

        try:
            while True:
                self.run_once()
                time.sleep(self.interval)
        except KeyboardInterrupt:
            print("\nWatcher detenido por el usuario.")


if __name__ == "__main__":
    watcher = AirtableRealtimeWatcher(check_interval=3.0)
    if len(sys.argv) > 1 and sys.argv[1] == "--once":
        watcher.run_once()
    else:
        watcher.start_loop()
