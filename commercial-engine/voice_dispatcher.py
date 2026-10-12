import json
from typing import Any, Dict, Optional
import requests
from config import Config
from voice_prompts import generate_voice_agent_prompt


class VoiceDispatcher:
    def __init__(self):
        self.provider = Config.VOICE_AI_PROVIDER

    def format_phone_number(self, phone: str) -> str:
        """Limpia y estandariza el número a formato internacional E.164 (ej: +34600112233)."""
        clean = "".join(c for c in phone if c.isdigit() or c == "+")
        if clean.startswith("+"):
            return clean
        # Si empieza por 34 y tiene 11 dígitos
        if clean.startswith("34") and len(clean) >= 11:
            return f"+{clean}"
        # Si es número local español de 9 dígitos (empieza por 6, 7, 8 o 9)
        if len(clean) == 9 and clean[0] in ["6", "7", "8", "9"]:
            return f"+34{clean}"
        return f"+{clean}"

    def dispatch_call(
        self,
        record_id: str,
        table_name: str,
        lead_data: Dict[str, Any],
        dry_run: bool = False
    ) -> Dict[str, Any]:
        """
        Inicia la llamada con IA utilizando el proveedor configurado (Retell, Vapi, Bland).
        Detecta automáticamente 'Teléfono' en tablas físicas y 'WhatsApp' en online.
        """
        company = lead_data.get("Empresa", "la empresa")
        contact = lead_data.get("Encargado", "")
        sector = lead_data.get("Sector / Nicho", "")
        website = lead_data.get("Web", "") or lead_data.get("Web / Redes", "")

        # Selección dinámica del campo de teléfono
        if "Online" in table_name:
            raw_phone = lead_data.get("WhatsApp") or lead_data.get("Teléfono") or lead_data.get("Teléfono o WhatsApp", "")
        else:
            raw_phone = lead_data.get("Teléfono") or lead_data.get("WhatsApp") or lead_data.get("Teléfono o WhatsApp", "")

        if not raw_phone:
            return {
                "success": False,
                "error": f"El lead '{company}' no tiene número de teléfono o WhatsApp en Airtable."
            }

        phone = self.format_phone_number(raw_phone)
        prompt = generate_voice_agent_prompt(
            company_name=company,
            contact_name=contact,
            sector=sector,
            website=website
        )

        metadata = {
            "airtable_record_id": record_id,
            "table_name": table_name,
            "company_name": company,
            "contact_name": contact,
            "phone": phone
        }

        if dry_run:
            print(f"[DRY-RUN] Simulando llamada con {self.provider.upper()} a {phone} ({company})")
            return {
                "success": True,
                "call_id": f"sim_call_{record_id[:8]}",
                "provider": self.provider,
                "mode": "simulation",
                "phone": phone
            }

        # Enrutamiento según el proveedor configurado
        if self.provider == "retell":
            return self._dispatch_retell(phone, metadata, prompt)
        elif self.provider == "vapi":
            return self._dispatch_vapi(phone, metadata, prompt)
        elif self.provider == "bland":
            return self._dispatch_bland(phone, metadata, prompt)
        else:
            return {
                "success": False,
                "error": f"Proveedor de voz '{self.provider}' no reconocido."
            }

    def _dispatch_retell(
        self,
        phone: str,
        metadata: Dict[str, Any],
        prompt: str
    ) -> Dict[str, Any]:
        if not Config.RETELL_API_KEY:
            return {"success": False, "error": "RETELL_API_KEY no está configurada en .env"}

        url = "https://api.retellai.com/v2/create-phone-call"
        headers = {
            "Authorization": f"Bearer {Config.RETELL_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "from_number": Config.RETELL_FROM_NUMBER,
            "to_number": phone,
            "override_agent_id": Config.RETELL_AGENT_ID,
            "metadata": metadata,
            "retell_llm_dynamic_variables": {
                "company_name": metadata["company_name"],
                "contact_name": metadata["contact_name"],
                "custom_prompt": prompt
            }
        }
        resp = requests.post(url, headers=headers, json=payload, timeout=10)
        if resp.status_code in [200, 201]:
            data = resp.json()
            return {"success": True, "call_id": data.get("call_id"), "data": data}
        return {"success": False, "status_code": resp.status_code, "error": resp.text}

    def _dispatch_vapi(
        self,
        phone: str,
        metadata: Dict[str, Any],
        prompt: str
    ) -> Dict[str, Any]:
        if not Config.VAPI_API_KEY:
            return {"success": False, "error": "VAPI_API_KEY no está configurada en .env"}

        url = "https://api.vapi.ai/call/phone"
        headers = {
            "Authorization": f"Bearer {Config.VAPI_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "assistantId": Config.VAPI_ASSISTANT_ID,
            "phoneNumberId": Config.VAPI_PHONE_NUMBER_ID,
            "customer": {"number": phone, "name": metadata["contact_name"]},
            "assistantOverrides": {
                "variableValues": {
                    "company_name": metadata["company_name"],
                    "custom_prompt": prompt
                }
            },
            "metadata": metadata
        }
        resp = requests.post(url, headers=headers, json=payload, timeout=10)
        if resp.status_code in [200, 201]:
            data = resp.json()
            return {"success": True, "call_id": data.get("id"), "data": data}
        return {"success": False, "status_code": resp.status_code, "error": resp.text}

    def _dispatch_bland(
        self,
        phone: str,
        metadata: Dict[str, Any],
        prompt: str
    ) -> Dict[str, Any]:
        if not Config.BLAND_API_KEY:
            return {"success": False, "error": "BLAND_API_KEY no está configurada en .env"}

        url = "https://api.bland.ai/v1/calls"
        headers = {
            "Authorization": Config.BLAND_API_KEY,
            "Content-Type": "application/json"
        }
        payload = {
            "phone_number": phone,
            "task": prompt,
            "language": "es",
            "metadata": metadata
        }
        resp = requests.post(url, headers=headers, json=payload, timeout=10)
        if resp.status_code in [200, 201]:
            data = resp.json()
            return {"success": True, "call_id": data.get("call_id"), "data": data}
        return {"success": False, "status_code": resp.status_code, "error": resp.text}
