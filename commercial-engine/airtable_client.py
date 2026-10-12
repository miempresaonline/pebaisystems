import time
import urllib.parse
from datetime import datetime
from typing import Any, Dict, List, Optional
import requests
from config import Config, LeadStatus, NextAction


class AirtableClient:
    def __init__(
        self,
        pat: Optional[str] = None,
        base_id: Optional[str] = None
    ):
        self.pat = pat or Config.AIRTABLE_PAT
        self.base_id = base_id or Config.AIRTABLE_BASE_ID
        self.base_url = f"https://api.airtable.com/v0/{self.base_id}"
        self.headers = {
            "Authorization": f"Bearer {self.pat}",
            "Content-Type": "application/json"
        }

    def _request(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict] = None,
        json_data: Optional[Dict] = None,
        max_retries: int = 4
    ) -> requests.Response:
        url = f"{self.base_url}/{endpoint}"
        retry_delay = 1.0

        for attempt in range(max_retries):
            response = requests.request(
                method=method,
                url=url,
                headers=self.headers,
                params=params,
                json=json_data,
                timeout=15
            )

            # Manejo del límite de velocidad de Airtable (5 req/s)
            if response.status_code == 429:
                wait_time = float(response.headers.get("Retry-After", retry_delay))
                print(f"[Airtable 429 Rate Limit] Esperando {wait_time}s antes de reintentar...")
                time.sleep(wait_time)
                retry_delay *= 2
                continue

            # Manejo de error 403 Forbidden
            if response.status_code == 403:
                error_msg = (
                    "Error 403 Forbidden: El Personal Access Token (PAT) no tiene los permisos requeridos.\n"
                    "Verifica en https://airtable.com/create/tokens que incluya los scopes:\n"
                    " - data.records:read\n"
                    " - data.records:write\n"
                    " - schema.bases:read\n"
                    f"Y que tenga acceso concedido a la base {self.base_id}."
                )
                raise PermissionError(error_msg)

            return response

        raise TimeoutError("Airtable request timed out after multiple 429 retries")

    def test_connection(self) -> Dict[str, Any]:
        """Prueba la conexión y permisos sobre la base."""
        table_encoded = urllib.parse.quote(Config.AIRTABLE_TABLE_PHYSICAL)
        response = self._request("GET", f"{table_encoded}", params={"maxRecords": 1})
        if response.status_code == 200:
            data = response.json()
            return {
                "ok": True,
                "message": "Conexión a Airtable exitosa. Scopes de lectura y escritura verificados.",
                "sample_record_count": len(data.get("records", []))
            }
        else:
            return {
                "ok": False,
                "status_code": response.status_code,
                "error": response.text
            }

    def get_leads_ready_for_ai(self, table_name: str) -> List[Dict[str, Any]]:
        """
        Recupera leads que están listos para que la IA llame:
        - Encargado = '🤖 Inteligencia Artificial' (cuando Adrián se lo cede a la IA)
        - O Próxima acción = '🤖 Llamar con IA'
        - O Estado = '🤖 Pasar a IA'
        Excluyendo leads ya cerrados o que ya están interesados.
        """
        table_encoded = urllib.parse.quote(table_name)
        
        # Filtro: Encargado es IA o Próxima acción es Llamar con IA, y no está en estado final
        formula = (
            "AND("
            "OR({Encargado} = '🤖 Inteligencia Artificial', {Próxima acción} = '🤖 Llamar con IA', {Estado} = '🤖 Pasar a IA'), "
            "{Estado} != '🟢 Interesado', "
            "{Estado} != '❌ No interesado (Cliente)', "
            "{Estado} != '🔴 No contesta 3', "
            "{Estado} != '🤖 IA llamando'"
            ")"
        )
        
        leads = []
        offset = None

        while True:
            params = {
                "filterByFormula": formula,
                "pageSize": 50
            }
            if offset:
                params["offset"] = offset

            resp = self._request("GET", table_encoded, params=params)
            if resp.status_code != 200:
                print(f"[Error leyendo leads en {table_name}]: {resp.text}")
                break

            data = resp.json()
            leads.extend(data.get("records", []))
            offset = data.get("offset")
            if not offset:
                break

        return leads

    def create_meeting_record(
        self,
        company_name: str,
        contact_name: str = "",
        scheduled_datetime: Optional[str] = None,
        notes: str = "",
        phone: str = "",
        lead_record_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Crea automáticamente un registro de consultoría en '🤝 Reuniones & Cierre'
        cuando la IA consigue agendar la videollamada de 15-20 minutos.
        """
        table_encoded = urllib.parse.quote(Config.AIRTABLE_TABLE_MEETINGS)
        meeting_title = f"Consultoría IA - {company_name}" + (f" ({contact_name})" if contact_name else "")
        fields: Dict[str, Any] = {
            "Cliente / Reunión": meeting_title,
            "Estado": "🗓️ 1. Videollamada Agendada",
            "Responsable de cierre": "👤 Adrián Ballesteros",
            "Servicios de Interés": ["🤖 Automatizaciones con IA"],
            "Notas y Diagnóstico": notes
        }
        if scheduled_datetime:
            fields["Fecha Videollamada"] = scheduled_datetime
        if lead_record_id:
            fields["Empresa Prospecto"] = [lead_record_id]

        payload = {"records": [{"fields": fields}]}
        resp = self._request("POST", table_encoded, json_data=payload)
        if resp.status_code in [200, 201]:
            print(f"[REUNIÓN AGENDADA] Creada con éxito en '🤝 Reuniones & Cierre': {meeting_title}")
            return {"success": True, "data": resp.json()}
        else:
            print(f"[Error creando reunión en Airtable]: {resp.text}")
            return {"success": False, "error": resp.text}

    def reassign_lead_to_ai(self, table_name: str, record_id: str) -> bool:
        """
        Reasigna el encargado a '🤖 Inteligencia Artificial' y la acción a '🤖 Llamar con IA'.
        Se usa cuando Adrián marca que no quiere trabajar ese lead personalmente.
        """
        table_encoded = urllib.parse.quote(table_name)
        payload = {
            "records": [
                {
                    "id": record_id,
                    "fields": {
                        "Encargado": "🤖 Inteligencia Artificial",
                        "Próxima acción": "🤖 Llamar con IA"
                    }
                }
            ],
            "typecast": True
        }
        resp = self._request("PATCH", table_encoded, json_data=payload)
        return resp.status_code == 200

    def auto_transfer_adrian_deprioritized_leads(self, target_tables: Optional[List[str]] = None) -> int:
        """
        Detecta leads donde Adrián marcó '❌ No me interesa' y los reasigna automáticamente:
        - Encargado = '🤖 Inteligencia Artificial'
        - Próxima acción = '🤖 Llamar con IA'
        """
        tables = target_tables or (Config.PHYSICAL_NICHE_TABLES + [Config.AIRTABLE_TABLE_ONLINE])
        total_transferred = 0
        formula = "AND({Estado} = '❌ No me interesa', {Encargado} != '🤖 Inteligencia Artificial')"

        for tbl in tables:
            try:
                table_encoded = urllib.parse.quote(tbl)
                resp = self._request("GET", table_encoded, params={"filterByFormula": formula})
                if resp.status_code == 200:
                    records = resp.json().get("records", [])
                    for r in records:
                        ok = self.reassign_lead_to_ai(tbl, r["id"])
                        if ok:
                            total_transferred += 1
                            empresa = r.get("fields", {}).get("Empresa", "Sin Nombre")
                            print(f"  [TRASPASO ADRIÁN -> IA] Lead '{empresa}' en '{tbl}' transferido a la IA.")
            except Exception as e:
                print(f"  [Error procesando traspasos en {tbl}]: {e}")

        return total_transferred

    def update_lead_outcome(
        self,
        table_name: str,
        record_id: str,
        outcome: str,
        summary: str = "",
        scheduled_datetime: Optional[str] = None,
        company_name: str = "",
        contact_name: str = "",
        phone: str = ""
    ) -> bool:
        """
        Actualiza el lead en Airtable usando las opciones EXACTAS existentes en la base.
        Suma 'No contesta' incrementalmente y crea reunión si es 'interested'.
        """
        table_encoded = urllib.parse.quote(table_name)
        is_physical = "Físicos" in table_name or "(Físico)" in table_name
        fields: Dict[str, Any] = {}

        outcome = outcome.lower()

        # 1. Obtener estado actual del registro para cálculo incremental
        current_status = ""
        try:
            rec_resp = self._request("GET", f"{table_encoded}/{record_id}")
            if rec_resp.status_code == 200:
                rec_data = rec_resp.json().get("fields", {})
                current_status = rec_data.get("Estado (Detallado)") or rec_data.get("Estado") or ""
        except Exception:
            pass

        if outcome in ["interested", "hot_lead", "meeting_requested", "interesado"]:
            # Cliente interesado -> Aceptó videollamada de 15-20 min de consultoría
            if is_physical:
                fields["Estado (Detallado)"] = "🟢 Interesado"
                fields["Próxima acción"] = "📞 Llamar"
            else:
                fields["Estado"] = "🟢 Interesado "
                fields["Próxima acción"] = "📞 Llamar"

            # Crear la cita automáticamente en '🤝 Reuniones & Cierre'
            self.create_meeting_record(
                company_name=company_name,
                contact_name=contact_name,
                scheduled_datetime=scheduled_datetime,
                notes=summary,
                phone=phone,
                lead_record_id=record_id
            )

        elif outcome in ["send_info", "send_whatsapp", "whatsapp", "pide_info"]:
            # Pide WhatsApp con información
            if is_physical:
                fields["Próxima acción"] = "💬 Enviar WhatsApp"
            else:
                fields["Estado"] = "📞 WhatsApp Enviado "
                fields["Próxima acción"] = "💬 Enviar WhatsApp"

        elif outcome in ["no_answer", "busy", "voicemail", "sin_respuesta"]:
            # Suma incremental: Nuevo -> No contesta 1 -> No contesta 2 -> No contesta 3
            if "No contesta 1" in current_status:
                next_choice = "🟠 No contesta 2"
                next_action = "🤖 Llamar con IA"
            elif "No contesta 2" in current_status:
                next_choice = "🔴 No contesta 3"
                next_action = "✅ Cerrar ficha"
            elif "No contesta 3" in current_status:
                next_choice = "🔴 No contesta 3"
                next_action = "✅ Cerrar ficha"
            else:
                next_choice = "🟡 No contesta 1"
                next_action = "🤖 Llamar con IA"

            if is_physical:
                fields["Estado (Detallado)"] = next_choice
                fields["Próxima acción"] = next_action
            else:
                fields["Estado"] = next_choice
                fields["Próxima acción"] = next_action

        elif outcome in ["not_interested", "rejected", "descartado", "no_interesado"]:
            # Cliente rechazó la oferta
            if is_physical:
                fields["Estado (Detallado)"] = "❌No interesado"
                fields["Próxima acción"] = "✅ Cerrar ficha"
            else:
                fields["Estado"] = "❌  Descartado"
                fields["Próxima acción"] = "✅ Cerrar ficha"

        payload = {
            "records": [
                {
                    "id": record_id,
                    "fields": fields
                }
            ],
            "typecast": True
        }

        resp = self._request("PATCH", table_encoded, json_data=payload)
        if resp.status_code == 200:
            if summary:
                self.append_lead_note(table_name, record_id, summary)
            return True
        else:
            print(f"[Error actualizando {record_id} en {table_name}]: {resp.text}")
            return False

    def append_lead_note(
        self,
        table_name: str,
        record_id: str,
        note_text: str
    ) -> bool:
        """
        Añade una línea con fecha y hora a las Notas existentes sin sobrescribir lo anterior.
        """
        table_encoded = urllib.parse.quote(table_name)
        # 1. Obtener notas actuales
        resp = self._request("GET", f"{table_encoded}/{record_id}")
        if resp.status_code != 200:
            print(f"[Error obteniendo record {record_id}]: {resp.text}")
            return False

        record = resp.json()
        existing_notes = record.get("fields", {}).get("Notas", "")
        
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
        new_entry = f"[{timestamp} IA]: {note_text}"
        updated_notes = f"{existing_notes}\n{new_entry}".strip()

        return self.update_lead_status(
            table_name=table_name,
            record_id=record_id,
            new_status=record.get("fields", {}).get("Estado", LeadStatus.PASS_TO_AI),
            additional_fields={"Notas": updated_notes}
        )

    def fetch_all_records(self, table_name: str) -> List[Dict[str, Any]]:
        """
        Descarga todos los registros de una tabla paginando ordenadamente.
        Ideal para backups y archivado masivo.
        """
        table_encoded = urllib.parse.quote(table_name)
        records = []
        offset = None

        while True:
            params = {"pageSize": 100}
            if offset:
                params["offset"] = offset

            resp = self._request("GET", table_encoded, params=params)
            if resp.status_code != 200:
                raise RuntimeError(f"Error descargando {table_name}: {resp.text}")

            data = resp.json()
            records.extend(data.get("records", []))
            offset = data.get("offset")
            if not offset:
                break
            time.sleep(0.2)  # Respetar rate limit de Airtable

        return records

    def delete_record(self, table_name: str, record_id: str) -> bool:
        """
        Elimina un registro de Airtable tras haber sido archivado externamente.
        """
        table_encoded = urllib.parse.quote(table_name)
        resp = self._request("DELETE", f"{table_encoded}/{record_id}")
        return resp.status_code == 200
