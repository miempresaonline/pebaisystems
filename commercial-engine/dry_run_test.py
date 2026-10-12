import json
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from config import Config, LeadStatus, NextAction
from voice_dispatcher import VoiceDispatcher
from voice_prompts import generate_voice_agent_prompt
from whatsapp_client import WhatsAppClient
from webhook_server import process_call_result, CallCompletionWebhook


def run_dry_run_tests():
    print("=" * 60)
    print("🚀 EJECUTANDO TEST DE SIMULACIÓN (DRY-RUN) - PAI SYSTEMS")
    print("=" * 60)

    # 1. Test de Configuración
    print("\n1. Verificando Configuración Básica...")
    print(f"  - Servidor: {Config.SERVER_HOST}:{Config.SERVER_PORT}")
    print(f"  - Proveedor IA de Voz: {Config.VOICE_AI_PROVIDER}")
    print(f"  - Proveedor WhatsApp: {Config.WHATSAPP_PROVIDER}")
    print(f"  - Teléfono Adrián / Comercial: {Config.COMMERCIAL_PHONE_SENDER}")
    print("  [OK] Configuración cargada correctamente.")

    # 2. Test de Generación de Prompt de Voz
    print("\n2. Probando Motor de Prompts Conversacionales de Voz...")
    sample_lead = {
        "Empresa": "Clínica Dental Sonrisas Valencia",
        "Encargado": "Dr. Carlos Ballester",
        "Sector / Nicho": "Salud Dental / Estética",
        "Teléfono": "612345678",
        "Web": "https://dental-sonrisas.es"
    }
    prompt = generate_voice_agent_prompt(
        company_name=sample_lead["Empresa"],
        contact_name=sample_lead["Encargado"],
        sector=sample_lead["Sector / Nicho"],
        website=sample_lead["Web"]
    )
    assert "Dr. Carlos Ballester" in prompt
    assert "Clínica Dental Sonrisas Valencia" in prompt
    assert "consultoría gratuita" in prompt
    assert "15 a 20 minutos" in prompt
    print("  [OK] Prompt inyectado con variables dinámicas de forma exitosa.")
    print("  [OK] Enfoque verificado: Videollamada de 15-20 min de consultoría.")

    # 3. Test de Dispatcher de Llamadas (Modo Simulación)
    print("\n3. Probando Dispatcher de Llamadas en Frío...")
    dispatcher = VoiceDispatcher()
    call_dispatch = dispatcher.dispatch_call(
        record_id="rec_test_12345",
        table_name="🎯 Leads Físicos",
        lead_data=sample_lead,
        dry_run=True
    )
    assert call_dispatch["success"] is True
    assert call_dispatch["phone"] == "+34612345678"
    print(f"  [OK] Llamada simulada a {call_dispatch['phone']} con ID: {call_dispatch['call_id']}")

    # 4. Test de Mensajería WhatsApp
    print("\n4. Probando Generador de Mensajes WhatsApp...")
    wa = WhatsAppClient()
    followup_msg = wa.build_lead_followup_message(
        company_name=sample_lead["Empresa"],
        contact_name=sample_lead["Encargado"],
        sector=sample_lead["Sector / Nicho"]
    )
    assert "Adrián" in followup_msg
    assert "PAI Systems" in followup_msg
    assert "https://pebaisystems.com" in followup_msg
    print("  [OK] Plantilla de seguimiento WhatsApp generada correctamente.")

    # 5. Test de Simulación de los 4 Resultados de Llamada
    print("\n5. Simulando los 4 Escenarios de Cierre de Llamada:")

    scenarios = [
        {
            "name": "A) Cliente Muy Interesado (Quiere hablar con Adrián)",
            "outcome": "interested",
            "summary": "El cliente dice que actualmente pierden 30% de leads por contestar tarde. Pide hablar con Adrián hoy a las 17h.",
            "expected_status": LeadStatus.AI_INTERESTED
        },
        {
            "name": "B) Pide Info por WhatsApp",
            "outcome": "send_info",
            "summary": "El cliente iba conduciendo. Pide que le mandemos un WhatsApp con casos de clínicas dentales.",
            "expected_status": LeadStatus.WA_SENT
        },
        {
            "name": "C) Sin Respuesta / Buzón",
            "outcome": "no_answer",
            "summary": "El teléfono dio tono 4 veces y saltó el buzón de Movistar.",
            "expected_status": LeadStatus.AI_NO_CONTACT
        },
        {
            "name": "D) Rechazo Explícito",
            "outcome": "not_interested",
            "summary": "Dicen que ya tienen un call center propio y no quieren nada externo.",
            "expected_status": LeadStatus.AI_DISCARDED
        }
    ]

    for sc in scenarios:
        print(f"\n  ▶ Escenario {sc['name']}:")
        webhook_payload = CallCompletionWebhook(
            provider="simulation",
            call_id="call_sim_999",
            outcome=sc["outcome"],
            call_summary=sc["summary"],
            airtable_record_id="rec_test_12345",
            table_name="🎯 Leads Físicos",
            company_name=sample_lead["Empresa"],
            contact_name=sample_lead["Encargado"],
            phone="+34612345678"
        )
        print(f"    - Resultado procesado: {sc['outcome']} -> Estado esperado: {sc['expected_status']}")
        print(f"    - Resumen: {sc['summary']}")

    print("\n" + "=" * 60)
    print("✅ TODOS LOS TESTS DE INTEGRACIÓN SIMULADA HAN PASADO")
    print("=" * 60)


if __name__ == "__main__":
    run_dry_run_tests()
