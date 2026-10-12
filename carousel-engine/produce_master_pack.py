import os
import sys
import json
from generator import build_carousel

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, "output")

MASTER_CAROUSELS = [
    # ========================================================
    # PROPUESTA 1: VIRAL (OpenAI Dots vs Meta Muse)
    # ========================================================
    {
        "id": "propuesta_1_viral",
        "topic": "Agentes Autónomos en Cloud VM",
        "keyword": "DEBATE",
        "caption": """Los chatbots de texto ya son tecnología del pasado.

OpenAI y Meta acaban de abrir la carrera por los agentes con ordenador propio en la nube: sistemas capaces de operar terminales, bases de datos y software sin supervisión continua.

¿Confiarías el control operativo de tu equipo a un agente autónomo? Te leo en comentarios.

#InteligenciaArtificial #OpenAI #TechNews #Automatizacion #SoftwareEngineering""",
        "slides": [
            {
                "type": "fb_versus_photo",
                "photo_filename": "stock_consultant_laptop.jpg",
                "topic_badge": "RADAR IA 2026 · AGENTES AUTÓNOMOS",
                "pill_left": "OPENAI DOTS",
                "pill_right": "META MUSE",
                "title_line1": "CHATBOTS ARE DEAD: LA GUERRA POR",
                "title_highlight": "TU ORDENADOR",
                "subtitle": "De responder preguntas en un chat a delegar máquinas virtuales que operan tu sistema 24/7.",
                "footer_web": "pebaisystems.es",
                "footer_cta": "Desliza para ver la comparativa"
            },
            {
                "type": "fb_radialgauge",
                "topic_tag": "CAMBIO DE PARADIGMA · 2026",
                "category_icon": "zap",
                "title_line1": "DEJAR DE CHATEAR.",
                "title_highlight": "EMPEZAR A DELEGAR.",
                "center_value": "0s",
                "center_label": "INTERVENCIÓN MANUAL",
                "center_badge": "24/7 EN CLOUD VM",
                "row1_title": "Chatbot Tradicional (2023-2025)",
                "row1_desc": "El humano copia y pega código, corrige errores y pierde el contexto",
                "row1_metric": "> 30 Minutos",
                "row1_tag": "Pérdida de contexto",
                "row1_icon": "clock",
                "row2_title": "Script de Automatización Legacy",
                "row2_desc": "Se rompe al menor cambio de interfaz o caída de un endpoint",
                "row2_metric": "Frágil",
                "row2_tag": "Fricción operativa",
                "row2_icon": "document",
                "row3_title": "Persistent Cloud Agent (Dots / Muse)",
                "row3_desc": "Entorno Linux propio, terminal, clics y resolución autónoma de errores",
                "row3_metric": "Autónomo",
                "row3_tag": "Autónomo en Cloud",
                "row3_icon": "pebai",
                "hook_banner_text": "El futuro no es chatear con una IA, es <strong>delegarle una máquina virtual</strong>.",
                "hook_banner_badge": "Cambio de Era",
                "footer_web": "pebaisystems.es",
                "footer_cta": "Desliza para ver la matriz"
            },
            {
                "type": "fb_matrix2x2",
                "topic_tag": "MATRIZ DE AGENTES · 2026",
                "category_icon": "chart",
                "title_line1": "DÓNDE OPERA LA IA",
                "title_highlight": "EN TU ENTORNO",
                "q1_badge": "Pasivo",
                "q1_icon": "document",
                "q1_title": "Chatbots Web",
                "q1_desc": "Ventana de chat aislada sin acceso al sistema operativo ni archivos.",
                "q1_metric": "Manual",
                "q1_metric_sub": "Lento",
                "q2_badge": "LÍDER TECNOLÓGICO",
                "q2_icon": "pebai",
                "q2_title": "Cloud Agent (Dots/Muse)",
                "q2_desc": "Máquina virtual con acceso a terminal, archivos y clics en pantalla.",
                "q2_metric": "100% Autónomo",
                "q2_metric_sub": "24/7 ACTIVO",
                "q3_badge": "Limitado",
                "q3_icon": "clock",
                "q3_title": "Copiloto en IDE",
                "q3_desc": "Autocompleta código pero depende de que el humano siga programando.",
                "q3_metric": "Semi-Manual",
                "q3_metric_sub": "Supervisado",
                "q4_badge": "Rígido",
                "q4_icon": "zap",
                "q4_title": "RPA Clásico",
                "q4_desc": "Automatización por reglas que se rompe ante cualquier cambio visual.",
                "q4_metric": "Sin IA",
                "q4_metric_sub": "Frágil",
                "footer_web": "pebaisystems.es",
                "footer_cta": "Desliza para ver el pipeline"
            },
            {
                "type": "fb_nodegraph",
                "topic_tag": "DELEGACIÓN INDUSTRIAL · PEBAI",
                "category_icon": "zap",
                "title_line1": "DEL PROMPT AL DESPLIEGUE",
                "title_highlight": "EN 3 MINUTOS",
                "step1_icon": "document",
                "step1_label": "Paso 01 · Prompt Técnico",
                "step1_title": "Orden Única en Lenguaje Natural",
                "step1_desc": "Crea la pasarela de pagos con Stripe, corre los tests unitarios y despliega",
                "step1_badge": "00:00:05",
                "connector1_text": "Spawning Sandbox VM",
                "step2_icon": "pebai",
                "step2_label": "Paso 02 · Sandbox Linux VM",
                "step2_title": "Astra Sandbox & Spawning Linux VM",
                "step2_desc": "El agente clona el repo, ejecuta dependencias y repara errores de compilación solo",
                "step2_badge": "00:01:20",
                "connector2_text": "Tests Autónomos",
                "step3_icon": "calendar",
                "step3_label": "Paso 03 · Verificación en Producción",
                "step3_title": "Verificación y Despliegue en Producción",
                "step3_desc": "Entrega la URL verificada en producción sin supervisión continua",
                "step3_badge": "00:02:45",
                "metric1_val": "< 3 Min",
                "metric1_lbl": "Despliegue Total",
                "metric2_val": "0s",
                "metric2_lbl": "Intervención Humana",
                "metric3_val": "100% Root",
                "metric3_lbl": "Entorno Aislado",
                "footer_web": "pebaisystems.es",
                "footer_cta": "Desliza para el debate"
            },
            {
                "type": "fb_versus_cards",
                "topic_badge": "EL DEBATE OPERATIVO · 2026",
                "step_number": "05",
                "step_category": "CONTROL HUMANO VS AUTONOMÍA TOTAL",
                "step_title": "¿Le darías acceso root a un agente de IA?",
                "manual_ribbon": "Riesgo de Seguridad",
                "manual_title": "Control Manual Total",
                "manual_desc": "Un humano supervisa cada línea y cada clic, manteniendo la lentitud pero con 100% de aislamiento de permisos.",
                "manual_metric": "Lento",
                "manual_note": "Fuga de tiempo",
                "pebai_ribbon": "Ventaja Competitiva",
                "pebai_title": "Orquestación de Agentes",
                "pebai_desc": "Delegar la ejecución en sandboxes seguros. El valor ya no está en hacer prompts sino en orquestar sistemas que trabajan solos.",
                "pebai_metric": "10x Eficiencia",
                "pebai_note": "Debate en comentarios",
                "footer_web": "pebaisystems.es",
                "footer_cta": "Deja tu opinión en comentarios"
            }
        ]
    },

    # ========================================================
    # PROPUESTA 2: MIXTO (Dimisión OpenAI / 4 Capas)
    # ========================================================
    {
        "id": "propuesta_2_mixto",
        "topic": "Arquitectura de 4 Capas",
        "keyword": "SISTEMA",
        "caption": """La dimisión en OpenAI y su informe en The Atlantic confirman lo que vemos a diario en consultoría:

La IA no soluciona el desorden interno. Implementar modelos avanzados sobre flujos manuales no estandarizados solo multiplica los errores operativos.

Comenta SISTEMA y te enviamos la guía técnica de las 4 capas para blindar la operativa de tu empresa antes de automatizar.

#TransformacionDigital #OptimizacionDeProcesos #IngenieriaDeSoftware #SistemasB2B #ArquitecturaTI""",
        "slides": [
            {
                "type": "fb_versus_photo",
                "photo_filename": "stock_agency_desk.jpg",
                "topic_badge": "THE ATLANTIC // SEGURIDAD DE SISTEMAS",
                "pill_left": "DIMISIÓN OPENAI",
                "pill_right": "4 CAPAS PEBAI",
                "title_line1": "LA IA NO FALLA POR EL MODELO:",
                "title_highlight": "FALLA POR LOS PROCESOS",
                "subtitle": "The Atlantic destapa la verdad: el 90% de empresas fracasan por intentar automatizar sin arquitectura determinista.",
                "footer_web": "pebaisystems.es",
                "footer_cta": "Desliza para ver la auditoría"
            },
            {
                "type": "fb_radialgauge",
                "topic_tag": "AUDITORÍA DE FIABILIDAD · PEBAI",
                "category_icon": "chart",
                "title_line1": "EL COSTE OCULTO DEL",
                "title_highlight": "ENSAYO Y ERROR",
                "center_value": "42%",
                "center_label": "TASA DE ALUCINACIÓN",
                "center_badge": "EN MODELOS SIN REGLAS",
                "row1_title": "Prompts Libres en ChatGPT",
                "row1_desc": "Respuestas inconsistentes que varían cada día y destruyen la confianza del cliente",
                "row1_metric": "42% Fallos",
                "row1_tag": "Inconsistente",
                "row1_icon": "voicemail",
                "row2_title": "Licencias sin Integración",
                "row2_desc": "La plantilla abandona las herramientas a las 3 semanas de pagarlas",
                "row2_metric": "85% Abandono",
                "row2_tag": "Coste Hundido",
                "row2_icon": "headset",
                "row3_title": "Arquitectura de 4 Capas PEBAI",
                "row3_desc": "Validación lógica dura antes del LLM: consistencia matemática y trazabilidad",
                "row3_metric": "0% Alucinación",
                "row3_tag": "Determinista",
                "row3_icon": "pebai",
                "hook_banner_text": "The Atlantic: el 90% de implementaciones fallan si no hay <strong>ingeniería previa</strong>.",
                "hook_banner_badge": "Informe Atlantic",
                "footer_web": "pebaisystems.es",
                "footer_cta": "Desliza para ver el framework"
            },
            {
                "type": "fb_editorial_skills",
                "top_handle": "@pebaisystems.es",
                "title_prefix": "Nuestra arquitectura opera en",
                "title_accent": "4 Capas Deterministas.",
                "badge_label": "EL PROTOCOLO TÉCNICO",
                "core_title": "PEBAI.FRAMEWORK",
                "core_sub": "Cómo blindar la empresa para que la IA responda sin inventar datos",
                "hook_callout": "Datos Limpios → Reglas Duras → Inferencia LLM → Auditoría Forense →",
                "swipe_label": "deslizá"
            },
            {
                "type": "fb_matrix2x2",
                "topic_tag": "MATRIZ DE MADUREZ · PEBAI",
                "category_icon": "chart",
                "title_line1": "DÓNDE ESTÁ TU EMPRESA",
                "title_highlight": "FRENTE A LA IA",
                "q1_badge": "Caótico",
                "q1_icon": "document",
                "q1_title": "Curiosidad Individual",
                "q1_desc": "Cada empleado usa su propia cuenta sin conexión ni protocolos.",
                "q1_metric": "Riesgo Alto",
                "q1_metric_sub": "Desorden",
                "q2_badge": "LÍDER OPERATIVO",
                "q2_icon": "pebai",
                "q2_title": "Arquitectura PEBAI",
                "q2_desc": "Procesos documentados, APIs nativas y validación previa.",
                "q2_metric": "0% Errores",
                "q2_metric_sub": "ACTIVO REAL",
                "q3_badge": "Gasto Inútil",
                "q3_icon": "clock",
                "q3_title": "Compra de Licencias",
                "q3_desc": "Pagan suscripciones caras que nadie utiliza en su rutina.",
                "q3_metric": "ROI Negativo",
                "q3_metric_sub": "Pérdida",
                "q4_badge": "Frágil",
                "q4_icon": "zap",
                "q4_title": "Parches sin Soporte",
                "q4_desc": "Flujos aislados que fallan cuando el empleado clave no está.",
                "q4_metric": "Dependencia",
                "q4_metric_sub": "Fricción",
                "footer_web": "pebaisystems.es",
                "footer_cta": "Desliza para solicitar el framework"
            },
            {
                "type": "fb_versus_cards",
                "topic_badge": "ENTREGABLE TÉCNICO · PEBAI",
                "step_number": "05",
                "step_category": "BLINDAJE OPERATIVO ANTES DE AUTOMATIZAR",
                "step_title": "Descarga la Guía de las 4 Capas de PEBAI Systems",
                "manual_ribbon": "El Error Común",
                "manual_title": "Automatizar el Caos",
                "manual_desc": "Meter tecnología sin auditar flujos solo genera errores a doble velocidad y frustra a tu plantilla.",
                "manual_metric": "Pérdida",
                "manual_note": "Coste oculto",
                "pebai_ribbon": "Protocolo Oficial",
                "pebai_title": "Framework de 4 Capas",
                "pebai_desc": "El documento técnico interno con la arquitectura exacta que aplicamos en consultoría para conectar datos e IA sin fallos.",
                "pebai_metric": "Documento PDF",
                "pebai_note": "Comenta SISTEMA",
                "footer_web": "pebaisystems.es",
                "footer_cta": "Comenta SISTEMA para recibir la guía"
            }
        ]
    },

    # ========================================================
    # PROPUESTA 3: B2B PURA (Consultoría Técnica 45 min)
    # ========================================================
    {
        "id": "propuesta_3_b2b",
        "topic": "Auditoría Técnica de Procesos",
        "keyword": "CONSULTORÍA",
        "caption": """Si tu empresa cuenta con más de 3 empleados, es muy probable que una parte sustancial de la jornada se pierda en tareas invisibles: cruzar datos entre programas, perseguir presupuestos y responder tarde a solicitudes entrantes.

En PEBAI Systems no creemos en parches temporales. Diseñamos la arquitectura de procesos e inteligencia artificial que tu negocio necesita para escalar sin multiplicar costes.

Este mes abrimos 5 plazas para nuestra auditoría técnica privada de 45 minutos a coste cero, donde analizamos tu operativa en directo y trazamos tu hoja de ruta.

Comenta CONSULTORÍA y te enviaremos una solicitud privada para valorar si encaja en tu empresa.

#ConsultoriaB2B #OptimizacionDeProcesos #Automatizacion #ProductividadEmpresarial #PEBAISystems #EmpresasEspana""",
        "slides": [
            {
                "type": "fb_versus_photo",
                "photo_filename": "stock_man_macbook.jpg",
                "topic_badge": "CONVOCATORIA MENSUAL · 5 PLAZAS",
                "pill_left": "MANUAL: -12.400€",
                "pill_right": "DIAGNÓSTICO: 0€",
                "title_line1": "EL 40% DEL TIEMPO DE TU EQUIPO",
                "title_highlight": "NO FACTURA UN EURO",
                "subtitle": "Auditoría técnica privada de 45 minutos para empresas: localizamos tus fugas de horas y trazamos tu arquitectura a coste cero.",
                "footer_web": "pebaisystems.es",
                "footer_cta": "Desliza para ver la matemática"
            },
            {
                "type": "fb_radialgauge",
                "topic_tag": "FUGA FINANCIERA · PEBAI",
                "category_icon": "chart",
                "title_line1": "LA MATEMÁTICA DEL",
                "title_highlight": "TRABAJO MANUAL",
                "center_value": "18.5h",
                "center_label": "PERDIDAS / SEMANA",
                "center_badge": "POR EMPLEADO",
                "row1_title": "Tareas Invisibles Repetitivas",
                "row1_desc": "Copiar datos entre CRM, facturas y excels sin facturar un solo euro",
                "row1_metric": "-12.400 € / año",
                "row1_tag": "Coste Oculto",
                "row1_icon": "document",
                "row2_title": "Respuesta Comercial Lenta",
                "row2_desc": "Clientes que piden presupuesto y tardan horas en recibir respuesta",
                "row2_metric": "74% Fuga",
                "row2_tag": "Fuga de Clientes",
                "row2_icon": "clock",
                "row3_title": "Auditoría Técnica PEBAI",
                "row3_desc": "Mapeo en directo de tus flujos y plan de automatización inmediata",
                "row3_metric": "0 € (45 Min)",
                "row3_tag": "Diagnóstico 0€",
                "row3_icon": "pebai",
                "hook_banner_text": "Las tareas manuales consumen hasta el <strong>40% de la masa salarial</strong>.",
                "hook_banner_badge": "Dato Financiero",
                "footer_web": "pebaisystems.es",
                "footer_cta": "Desliza para ver la matriz"
            },
            {
                "type": "fb_matrix2x2",
                "topic_tag": "MATRIZ OPERATIVA · PEBAI",
                "category_icon": "chart",
                "title_line1": "DÓNDE ESTÁ EL CAPITAL",
                "title_highlight": "DE TU EMPRESA",
                "q1_badge": "Saturado",
                "q1_icon": "document",
                "q1_title": "Personal Manual",
                "q1_desc": "Sueldos altos atrapados en tareas que no generan facturación.",
                "q1_metric": "Alto Coste",
                "q1_metric_sub": "Fijo",
                "q2_badge": "LÍDER OPERATIVO",
                "q2_icon": "pebai",
                "q2_title": "Empresa Automatizada",
                "q2_desc": "Flujos conectados, atención inmediata 24/7 y costes fijos planos.",
                "q2_metric": "5 Plazas",
                "q2_metric_sub": "ESTE MES",
                "q3_badge": "Obsoleto",
                "q3_icon": "clock",
                "q3_title": "Parches Temporales",
                "q3_desc": "Contratar más administrativos cuando el proceso de base está roto.",
                "q3_metric": "Sin Escala",
                "q3_metric_sub": "Colapso",
                "q4_badge": "Incompleto",
                "q4_icon": "zap",
                "q4_title": "Herramientas Sueltas",
                "q4_desc": "Suscripciones de software aisladas que nadie conecta entre sí.",
                "q4_metric": "Desperdicio",
                "q4_metric_sub": "Gasto",
                "footer_web": "pebaisystems.es",
                "footer_cta": "Desliza para ver la sesión"
            },
            {
                "type": "fb_nodegraph",
                "topic_tag": "AUDITORÍA PRIVADA · PEBAI",
                "category_icon": "pebai",
                "title_line1": "QUÉ TE LLEVAS EN LA SESIÓN",
                "title_highlight": "DE 45 MINUTOS",
                "step1_icon": "chart",
                "step1_label": "Minuto 00 a 15 · Diagnóstico en Vivo",
                "step1_title": "Mapeo Operativo en Vivo (Min 0-15)",
                "step1_desc": "Radiografía visual de tus flujos para localizar las fugas invisibles de tiempo",
                "step1_badge": "Minuto 15",
                "connector1_text": "Detección de Fugas",
                "step2_icon": "zap",
                "step2_label": "Minuto 15 a 30 · Matriz de Retorno",
                "step2_title": "Matriz de Retorno Inmediato (Min 15-30)",
                "step2_desc": "Detectamos los 3 procesos que al automatizarse ahorran más de 800€/mes",
                "step2_badge": "Minuto 30",
                "connector2_text": "Diseño de Arquitectura",
                "step3_icon": "calendar",
                "step3_label": "Minuto 30 a 45 · Arquitectura Técnica",
                "step3_title": "Hoja de Ruta y Arquitectura (Min 30-45)",
                "step3_desc": "Entrega de la arquitectura técnica exacta con herramientas y agentes",
                "step3_badge": "Minuto 45",
                "metric1_val": "45 Min",
                "metric1_lbl": "Duración Sesión",
                "metric2_val": "0 €",
                "metric2_lbl": "Coste Diagnóstico",
                "metric3_val": "5 Plazas",
                "metric3_lbl": "Cupo Mensual",
                "footer_web": "pebaisystems.es",
                "footer_cta": "Desliza para solicitar plaza"
            },
            {
                "type": "fb_versus_cards",
                "topic_badge": "CONVOCATORIA MENSUAL · 5 EMPRESAS",
                "step_number": "05",
                "step_category": "SOLICITUD PRIVADA DE AUDITORÍA (COSTE 0€)",
                "step_title": "Reserva tu Auditoría Técnica Privada de 45 Minutos",
                "manual_ribbon": "Requisitos de Entrada",
                "manual_title": "Criterios de Admisión",
                "manual_desc": "Exclusivo para empresas con más de 3 empleados en plantilla y operativa en marcha que quieran optimizar procesos sin multiplicar costes fijos.",
                "manual_metric": "+3 Empleados",
                "manual_note": "Operativa activa",
                "pebai_ribbon": "Convocatoria Abierta",
                "pebai_title": "Diagnóstico a 0 €",
                "pebai_desc": "Sesión privada de 45 minutos con los socios fundadores de PEBAI Systems. Plazas estrictamente limitadas a 5 empresas al mes para garantizar dedicación.",
                "pebai_metric": "5 Plazas",
                "pebai_note": "Comenta CONSULTORÍA",
                "footer_web": "pebaisystems.es",
                "footer_cta": "Comenta CONSULTORÍA para solicitar plaza"
            }
        ]
    }
]

def generate_html_viewer(carousel_id, title, caption):
    html = f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title} — PEBAI Systems</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&family=JetBrains+Mono:wght@700&display=swap" rel="stylesheet">
  <style>
    body {{ font-family: 'Manrope', -apple-system, sans-serif; background: #080B11; color: #F8FAFC; padding: 40px 20px; text-align: center; }}
    h1 {{ font-size: 28px; font-weight: 800; color: #FFFFFF; margin-bottom: 8px; }}
    p.lead {{ color: #94A3B8; font-size: 16px; margin-bottom: 36px; }}
    .slide-wrapper {{ max-width: 580px; margin: 0 auto 36px auto; background: #12141C; border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; padding: 18px; box-shadow: 0 24px 48px rgba(0,0,0,0.7); }}
    img {{ width: 100%; border-radius: 16px; display: block; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }}
    .btn {{ display: inline-flex; align-items: center; justify-content: center; margin-top: 14px; background: #B7FF3C; color: #080B11; font-weight: 800; padding: 12px 28px; border-radius: 100px; text-decoration: none; font-size: 14px; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.05em; }}
    .btn:hover {{ background: #96E01E; }}
    .caption-box {{ max-width: 580px; margin: 0 auto; text-align: left; background: #12141C; border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 28px; }}
    .caption-box h3 {{ margin-top: 0; color: #B7FF3C; font-size: 18px; font-weight: 800; }}
    pre {{ white-space: pre-wrap; font-size: 15px; color: #E2E8F0; font-family: inherit; line-height: 1.6; margin-top: 12px; }}
  </style>
</head>
<body>
  <h1>{title}</h1>
  <p class="lead">Carrusel de 5 diapositivas de alta fidelidad visual (1080x1440 retina 2x) para redes sociales.</p>
  
  {''.join([f'<div class="slide-wrapper"><img src="slide_{i}.png"><a class="btn" href="slide_{i}.png" download>DESCARGAR DIAPOSITIVA {i}</a></div>' for i in range(1, 6)])}

  <div class="caption-box">
    <h3>Pie de foto oficial (Listo para copiar):</h3>
    <pre>{caption}</pre>
  </div>
</body>
</html>"""
    return html

def main():
    print("===================================================================")
    print("[PEBAI SYSTEMS] PRODUCCIÓN DE CARRUSELES CON EL MOTOR DE DISEÑO REAL")
    print("===================================================================")
    
    for c in MASTER_CAROUSELS:
        print(f"\nGenerando carrusel: {c['id']} ({c['topic']})...")
        meta = build_carousel(c)
        c_dir = os.path.join(OUTPUT_DIR, c["id"])
        
        # Generate clean HTML viewer
        viewer_html = generate_html_viewer(c["id"], c["topic"], c["caption"])
        with open(os.path.join(c_dir, "index.html"), "w", encoding="utf-8") as f:
            f.write(viewer_html)
            
    print("\n[ÉXITO TOTAL] Los 3 carruseles han sido renderizados con el motor visual real de PEBAI.")

if __name__ == "__main__":
    main()
