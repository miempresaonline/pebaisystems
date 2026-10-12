import json
from typing import Any, Dict, Optional
import requests
from config import Config


class WhatsAppClient:
    def __init__(self):
        self.provider = Config.WHATSAPP_PROVIDER

    def format_phone_number(self, phone: str) -> str:
        clean = "".join(c for c in phone if c.isdigit())
        if len(clean) == 9 and clean[0] in ["6", "7", "8", "9"]:
            return f"34{clean}"
        return clean

    def build_lead_followup_message(
        self,
        company_name: str,
        contact_name: str = "",
        sector: str = ""
    ) -> str:
        """
        Construye el mensaje comercial de seguimiento tras la llamada de la IA.
        """
        greeting = f"Hola {contact_name}," if contact_name else f"Hola equipo de {company_name},"
        sector_text = f"empresas de {sector}" if sector else "negocios como el vuestro"

        return (
            f"{greeting}\n\n"
            f"Soy Adrián, de **PAI Systems** (te acabamos de contactar por teléfono hace un momento).\n\n"
            f"Tal como hemos hablado, te comparto un breve resumen de cómo ayudamos a {sector_text} "
            f"a automatizar la captación y respuesta de clientes con Inteligencia Artificial:\n\n"
            f"🔹 **Respuesta inmediata 24/7**: Atendemos llamadas y WhatsApps en segundos, sin dejar escapar leads.\n"
            f"🔹 **Cualificación automática**: El sistema filtra y agenda reuniones directamente en vuestro calendario.\n"
            f"🔹 **Cero saturación operativa**: Vuestro equipo solo habla con clientes listos para contratar.\n\n"
            f"Puedes ver algunos de nuestros casos y soluciones aquí:\n"
            f"👉 https://pebaisystems.com\n\n"
            f"¿Te vendría bien que hablemos 5 minutos esta semana para ver cómo encajaría en vuestro negocio?\n\n"
            f"Un saludo cordial,\n"
            f"**Adrián Peñuela | PAI Systems**\n"
            f"📞 +34 624 84 27 99"
        )

    def build_adrian_hot_lead_alert(
        self,
        company_name: str,
        contact_name: str,
        phone: str,
        sector: str,
        call_summary: str,
        record_id: str
    ) -> str:
        """
        Alerta inmediata enviada al WhatsApp de Adrián cuando un lead muestra alto interés en la llamada de IA.
        """
        return (
            f"🚨 *¡OPORTUNIDAD CALIENTE DETECTADA POR IA!* 🚨\n\n"
            f"🏢 *Empresa:* {company_name}\n"
            f"👤 *Contacto:* {contact_name or 'No especificado'}\n"
            f"📱 *Teléfono:* {phone}\n"
            f"🏷️ *Sector:* {sector or 'General'}\n\n"
            f"📝 *Resumen de la llamada:*\n{call_summary}\n\n"
            f"👉 *Acción recomendada:* Llamar de inmediato mientras está caliente.\n"
            f"🔗 Record ID: `{record_id}`"
        )

    def send_message(
        self,
        to_phone: str,
        text: str,
        dry_run: bool = False
    ) -> Dict[str, Any]:
        """
        Envía un mensaje de texto por WhatsApp según el proveedor configurado.
        """
        phone = self.format_phone_number(to_phone)

        if dry_run:
            print(f"[DRY-RUN WA] Mensaje a {phone}:\n{text}\n" + "-" * 40)
            return {"success": True, "provider": self.provider, "mode": "simulation", "to": phone}

        if self.provider == "evolution_api":
            return self._send_evolution(phone, text)
        elif self.provider == "meta_cloud":
            return self._send_meta(phone, text)
        elif self.provider == "twilio":
            return self._send_twilio(phone, text)
        else:
            return {"success": False, "error": f"Proveedor WhatsApp '{self.provider}' no soportado."}

    def _send_evolution(self, phone: str, text: str) -> Dict[str, Any]:
        if not Config.EVOLUTION_API_URL or not Config.EVOLUTION_API_KEY:
            return {"success": False, "error": "EVOLUTION_API_URL o EVOLUTION_API_KEY no configurada"}

        url = f"{Config.EVOLUTION_API_URL}/message/sendText/{Config.EVOLUTION_INSTANCE_NAME}"
        headers = {
            "apikey": Config.EVOLUTION_API_KEY,
            "Content-Type": "application/json"
        }
        payload = {
            "number": phone,
            "options": {
                "delay": 1200,
                "presence": "composing"
            },
            "textMessage": {
                "text": text
            }
        }
        resp = requests.post(url, headers=headers, json=payload, timeout=10)
        if resp.status_code in [200, 201]:
            return {"success": True, "data": resp.json()}
        return {"success": False, "status_code": resp.status_code, "error": resp.text}

    def _send_meta(self, phone: str, text: str) -> Dict[str, Any]:
        if not Config.META_WA_ACCESS_TOKEN or not Config.META_WA_PHONE_NUMBER_ID:
            return {"success": False, "error": "Credenciales de Meta WhatsApp no configuradas"}

        url = f"https://graph.facebook.com/v19.0/{Config.META_WA_PHONE_NUMBER_ID}/messages"
        headers = {
            "Authorization": f"Bearer {Config.META_WA_ACCESS_TOKEN}",
            "Content-Type": "application/json"
        }
        payload = {
            "messaging_product": "whatsapp",
            "to": phone,
            "type": "text",
            "text": {"body": text}
        }
        resp = requests.post(url, headers=headers, json=payload, timeout=10)
        if resp.status_code == 200:
            return {"success": True, "data": resp.json()}
        return {"success": False, "status_code": resp.status_code, "error": resp.text}

    def _send_twilio(self, phone: str, text: str) -> Dict[str, Any]:
        if not Config.TWILIO_ACCOUNT_SID or not Config.TWILIO_AUTH_TOKEN:
            return {"success": False, "error": "Credenciales de Twilio no configuradas"}

        url = f"https://api.twilio.com/2010-04-01/Accounts/{Config.TWILIO_ACCOUNT_SID}/Messages.json"
        auth = (Config.TWILIO_ACCOUNT_SID, Config.TWILIO_AUTH_TOKEN)
        data = {
            "From": Config.TWILIO_WHATSAPP_FROM,
            "To": f"whatsapp:+{phone}",
            "Body": text
        }
        resp = requests.post(url, auth=auth, data=data, timeout=10)
        if resp.status_code in [200, 201]:
            return {"success": True, "data": resp.json()}
        return {"success": False, "status_code": resp.status_code, "error": resp.text}
