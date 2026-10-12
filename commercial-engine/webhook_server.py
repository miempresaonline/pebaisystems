import json
import sys
from typing import Any, Dict, Optional
from fastapi import FastAPI, Request, HTTPException, BackgroundTasks
from pydantic import BaseModel
import uvicorn

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from config import Config, LeadStatus, NextAction
from airtable_client import AirtableClient
from voice_dispatcher import VoiceDispatcher
from whatsapp_client import WhatsAppClient

app = FastAPI(
    title="PAI Systems Commercial Engine",
    description="Motor de automatización comercial tri-canal (Adrián + IA de Voz + WhatsApp)",
    version="1.0.0"
)

airtable = AirtableClient()
voice_dispatcher = VoiceDispatcher()
whatsapp = WhatsAppClient()


class CallCompletionWebhook(BaseModel):
    provider: Optional[str] = "generic"
    call_id: Optional[str] = None
    outcome: str  # "interested", "send_info", "no_answer", "not_interested"
    call_summary: Optional[str] = "Sin resumen disponible"
    transcript: Optional[str] = ""
    scheduled_datetime: Optional[str] = None
    airtable_record_id: str
    table_name: str
    company_name: Optional[str] = "Empresa"
    contact_name: Optional[str] = ""
    phone: str


def process_call_result(data: CallCompletionWebhook):
    """
    Procesa el resultado de la llamada de IA y actualiza Airtable y WhatsApp automáticamente.
    """
    record_id = data.airtable_record_id
    table_name = data.table_name
    outcome = data.outcome.lower()
    summary = data.call_summary or "Llamada finalizada."

    print(f"\n[WEBHOOK RECIBIDO] Outcome: {outcome} | Lead: {data.company_name} ({data.phone})")

    # Actualizar estado, acción, notas y crear reunión en Airtable si aplica
    airtable.update_lead_outcome(
        table_name=table_name,
        record_id=record_id,
        outcome=outcome,
        summary=summary,
        scheduled_datetime=data.scheduled_datetime,
        company_name=data.company_name,
        contact_name=data.contact_name,
        phone=data.phone
    )

    # 1. Caso: Lead con ALTO INTERÉS -> Alerta inmediata a Adrián por WhatsApp
    if outcome in ["interested", "hot_lead", "meeting_requested", "interesado"]:
        print(f"🔥 Lead Interesado: {data.company_name}. Reasignado a Adrián.")
        alert_msg = whatsapp.build_adrian_hot_lead_alert(
            company_name=data.company_name,
            contact_name=data.contact_name,
            phone=data.phone,
            sector="",
            call_summary=summary,
            record_id=record_id
        )
        whatsapp.send_message(to_phone=Config.ADRIAN_PHONE_ALERT, text=alert_msg)

    # 2. Caso: Pide información por WhatsApp -> Envía mensaje con presentación de PAI Systems
    elif outcome in ["send_info", "send_whatsapp", "whatsapp", "pide_info"]:
        print(f"📩 Lead pide info por WhatsApp: {data.company_name}. Enviando mensaje...")
        lead_msg = whatsapp.build_lead_followup_message(
            company_name=data.company_name,
            contact_name=data.contact_name
        )
        whatsapp.send_message(to_phone=data.phone, text=lead_msg)

    # 3. Caso: No contesta
    elif outcome in ["no_answer", "busy", "voicemail", "failed", "sin_respuesta"]:
        print(f"⏳ No contesta: {data.company_name}. Estado actualizado.")

    # 4. Caso: Descarte explícito
    elif outcome in ["not_interested", "rejected", "descartado", "no_interesado"]:
        print(f"❌ Lead rechazó la oferta: {data.company_name}. Marcado como descartado.")


@app.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "PAI Systems Commercial Engine",
        "voice_provider": Config.VOICE_AI_PROVIDER,
        "whatsapp_provider": Config.WHATSAPP_PROVIDER
    }


@app.post("/webhooks/voice-call-completed")
def handle_voice_call_completed(
    payload: CallCompletionWebhook,
    background_tasks: BackgroundTasks
):
    """
    Webhook llamado por la plataforma de voz (Retell, Vapi, Bland) al terminar una llamada.
    """
    background_tasks.add_task(process_call_result, payload)
    return {"accepted": True, "message": "Procesando resultado de llamada en segundo plano."}


@app.post("/api/dispatch-pending-leads")
def dispatch_pending_leads(
    table_name: Optional[str] = None,
    dry_run: bool = False
):
    """
    Escanea Airtable en busca de leads en '🤖 Pasar a IA' y lanza las llamadas.
    Adrián solo tiene que marcar el estado, este endpoint hace el resto.
    """
    target_tables = [table_name] if table_name else (Config.PHYSICAL_NICHE_TABLES + [Config.AIRTABLE_TABLE_ONLINE])
    results = []

    # 1. Traspaso automático de leads que Adrián marcó '❌ No me interesa' a la IA
    transferred = airtable.auto_transfer_adrian_deprioritized_leads(target_tables)
    if transferred > 0:
        print(f"🔄 Se han traspasado {transferred} leads de Adrián a la IA automáticamente.")

    for tbl in target_tables:
        leads = airtable.get_leads_ready_for_ai(table_name=tbl)
        print(f"Encontrados {len(leads)} leads listos para IA en '{tbl}'")

        for record in leads:
            record_id = record["id"]
            fields = record.get("fields", {})
            company = fields.get("Empresa", "Sin Nombre")

            # 2. Actualizar estado a '🤖 IA llamando'
            airtable.update_lead_status(
                table_name=tbl,
                record_id=record_id,
                new_status=LeadStatus.AI_CALLING,
                next_action=NextAction.CALL_AI
            )

            # 2. Iniciar la llamada
            dispatch_res = voice_dispatcher.dispatch_call(
                record_id=record_id,
                table_name=tbl,
                lead_data=fields,
                dry_run=dry_run
            )

            results.append({
                "table": tbl,
                "record_id": record_id,
                "company": company,
                "dispatch": dispatch_res
            })

    return {"dispatched_count": len(results), "leads": results}


class ReassignRequest(BaseModel):
    table_name: str
    record_id: str


@app.post("/api/reassign-to-ai")
def reassign_lead_to_ai_endpoint(payload: ReassignRequest):
    """
    Reasigna un lead al encargado '🤖 Inteligencia Artificial' y '🤖 Llamar con IA'.
    Útil para automatizar el traspaso cuando Adrián no desea trabajar ese lead.
    """
    ok = airtable.reassign_lead_to_ai(payload.table_name, payload.record_id)
    if ok:
        return {"success": True, "message": f"Lead {payload.record_id} reasignado exitosamente a la IA."}
    raise HTTPException(status_code=500, detail="Error reasignando el lead en Airtable.")


if __name__ == "__main__":
    uvicorn.run(app, host=Config.SERVER_HOST, port=Config.SERVER_PORT)
