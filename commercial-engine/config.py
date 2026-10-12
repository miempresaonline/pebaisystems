import os
from pathlib import Path
from dotenv import load_dotenv

# Cargar variables de entorno desde .env si existe
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)


class Config:
    # Airtable
    AIRTABLE_PAT = os.getenv("AIRTABLE_PAT", "")
    AIRTABLE_BASE_ID = os.getenv("AIRTABLE_BASE_ID", "")
    AIRTABLE_TABLE_PHYSICAL = os.getenv("AIRTABLE_TABLE_PHYSICAL", "🎯 Leads Físicos")
    AIRTABLE_TABLE_ONLINE = os.getenv("AIRTABLE_TABLE_ONLINE", "🎯 Leads Full Online")
    AIRTABLE_TABLE_MEETINGS = os.getenv("AIRTABLE_TABLE_MEETINGS", "🤝 Reuniones & Cierre")

    # Tablas activas segmentadas por nicho físico
    PHYSICAL_NICHE_TABLES = [
        "Clínicas (Físico)",
        "Abogados y Asesorías (Físico)",
        "Inmobiliarias (Físico)",
        "Reformas (Físico)"
    ]

    # IA de Voz
    VOICE_AI_PROVIDER = os.getenv("VOICE_AI_PROVIDER", "retell").lower()
    RETELL_API_KEY = os.getenv("RETELL_API_KEY", "")
    RETELL_AGENT_ID = os.getenv("RETELL_AGENT_ID", "")
    RETELL_FROM_NUMBER = os.getenv("RETELL_FROM_NUMBER", "")

    VAPI_API_KEY = os.getenv("VAPI_API_KEY", "")
    VAPI_ASSISTANT_ID = os.getenv("VAPI_ASSISTANT_ID", "")
    VAPI_PHONE_NUMBER_ID = os.getenv("VAPI_PHONE_NUMBER_ID", "")

    BLAND_API_KEY = os.getenv("BLAND_API_KEY", "")
    BLAND_PATHWAY_ID = os.getenv("BLAND_PATHWAY_ID", "")

    # WhatsApp
    WHATSAPP_PROVIDER = os.getenv("WHATSAPP_PROVIDER", "evolution_api").lower()
    COMMERCIAL_PHONE_SENDER = os.getenv("COMMERCIAL_PHONE_SENDER", "34624842799")
    ADRIAN_PHONE_ALERT = os.getenv("ADRIAN_PHONE_ALERT", "34624842799")

    EVOLUTION_API_URL = os.getenv("EVOLUTION_API_URL", "").rstrip("/")
    EVOLUTION_API_KEY = os.getenv("EVOLUTION_API_KEY", "")
    EVOLUTION_INSTANCE_NAME = os.getenv("EVOLUTION_INSTANCE_NAME", "pai_comercial")

    META_WA_ACCESS_TOKEN = os.getenv("META_WA_ACCESS_TOKEN", "")
    META_WA_PHONE_NUMBER_ID = os.getenv("META_WA_PHONE_NUMBER_ID", "")

    TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_WHATSAPP_FROM = os.getenv("TWILIO_WHATSAPP_FROM", "")

    # Servidor & Webhooks
    SERVER_HOST = os.getenv("SERVER_HOST", "0.0.0.0")
    SERVER_PORT = int(os.getenv("SERVER_PORT", "8000"))
    PUBLIC_BASE_URL = os.getenv("PUBLIC_BASE_URL", "http://localhost:8000").rstrip("/")
    WEBHOOK_SECRET_KEY = os.getenv("WEBHOOK_SECRET_KEY", "pai_secret_webhook_key")


# Estados estandarizados del CRM
class LeadStatus:
    # Estados de Adrián
    PENDING_REVIEW = "⚪ Nuevo / Sin llamar"
    ADRIAN_NOT_INTERESTED = "❌ No me interesa"
    ADRIAN_WON = "🗓️ 1. Videollamada Agendada"

    # Estados de la IA
    PASS_TO_AI = "🤖 Pasar a IA"
    AI_CALLING = "🤖 IA llamando"
    WA_SENT = "💬 WhatsApp Enviado"
    AI_INTERESTED = "🟢 Interesado"
    AI_NO_CONTACT = "🟡 No contesta 1"
    AI_NO_CONTACT_1 = "🟡 No contesta 1"
    AI_NO_CONTACT_2 = "🟠 No contesta 2"
    AI_NO_CONTACT_3 = "🔴 No contesta 3"
    AI_DISCARDED = "❌ No interesado (Cliente)"


class NextAction:
    CALL_ADRIAN = "📞 Llamar Adrián"
    CALL_AI = "🤖 Llamar con IA"
    SEND_WA = "💬 Enviar WhatsApp"
    SEND_EMAIL = "📧 Enviar email"
    MEETING = "🤝 Reunión"
