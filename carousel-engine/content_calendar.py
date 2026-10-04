"""
Full 14-Day Diverse Visual Content Calendar for PEBAI Systems.
Crafted according to top-performing B2B tech carousels (FontBravo & Real Notebook style).
Key rules enforced:
  1. ZERO EMOJIS: Pure SVG vectors and typographic geometric badges.
  2. HIGH VISUAL VARIETY: Matrix 2x2, Radial Speedometer, Architecture Node Graph, WhatsApp Chat Mockup, Arched Pillars, and Real Bic 0.7mm Notebook.
  3. ULTRA-MINIMAL TEXT: Big metrics, punchy keywords, zero dense paragraphs.
  4. OFFICIAL LOGO: Real PEBAI wave mark and horizontal SVG branding.
"""

FULL_14_DAY_CALENDAR = [
    # DÍA 1: Arched Pillars (Auditoría de Oportunidad)
    {
        "id": "day_01_consultoria_gratuita",
        "day": 1,
        "type": "fb_pillars",
        "stage": "BOFU",
        "topic": "Auditoría de Oportunidad",
        "keyword": "CONSULTORÍA",
        "caption": """No aceptamos a todas las empresas: buscamos oportunidades concretas de ahorro, reducción de costes o ventas recuperables.

Muchas empresas creen que implantar IA es pagar licencias caras de software que nadie utiliza. La realidad es que la rentabilidad viene de optimizar procesos antes de meter tecnología.

En esta comparativa visual analizamos los 3 enfoques para implantar IA en una pyme.

Comenta CONSULTORÍA y valoraremos si tu empresa es apta para una sesión estratégica gratuita.

#consultoria #ia #pymes #negocios #procesos #pebaisystems""",
        "slides": [
            {
                "type": "fb_pillars",
                "category_icon": "chart",
                "category_title": "PARA RENTABILIZAR LA IA",
                "columns": [
                    {"name": "Comprar herramientas", "rating": "ERROR", "height_px": 290, "bg_color": "#12121A", "icon": "document", "is_hero": False},
                    {"name": "Cursos genéricos", "rating": "LENTO", "height_px": 480, "bg_color": "#6A5CFF", "icon": "clock", "is_hero": False},
                    {"name": "Auditoría PEBAI", "rating": "ÓPTIMO", "height_px": 740, "bg_color": "#B7FF3C", "icon": "pebai", "is_hero": True}
                ],
                "footer_text": "pebaisystems.es",
                "footer_cta": "Desliza para ver el stack"
            }
        ]
    },

    # DÍA 2: Radial Speedometer Gauge (Velocidad de Respuesta)
    {
        "id": "day_02_velocimetro_respuesta",
        "day": 2,
        "type": "fb_radialgauge",
        "stage": "TOFU",
        "topic": "Velocidad Operativa",
        "keyword": "RESPUESTA",
        "caption": """No pierdes clientes contra empresas mejores. Pierdes contra empresas más rápidas.

Cuando un cliente potencial pide presupuesto o pregunta por WhatsApp, la empresa que responde en menos de 5 minutos se lleva el 78% de las ventas.

En este velocímetro visual comparamos los tiempos de respuesta y demostramos por qué un agente autónomo multiplica el cierre comercial.

Comenta RESPUESTA y auditamos tu velocidad de atención.

#inteligenciaartificial #automatizacion #pymes #ventas #atencionalcliente #pebaisystems""",
        "slides": [
            {
                "type": "fb_radialgauge",
                "topic_tag": "BENCHMARK DE VELOCIDAD · PEBAI",
                "category_icon": "zap",
                "title_line1": "EL QUE RESPONDE ANTES",
                "title_highlight": "SE LLEVA EL CLIENTE",
                "center_value": "12s",
                "center_label": "ATENCIÓN INMEDIATA",
                "center_badge": "24/7 SIN ESPERAS",
                "row1_title": "Buzón de Voz / Centralita",
                "row1_desc": "El cliente cuelga a los 4 tonos y compra a la competencia",
                "row1_metric": "> 14 Horas",
                "row1_icon": "voicemail",
                "row2_title": "Secretaría en Horario Laboral",
                "row2_desc": "Saturada con tareas administrativas y llamadas acumuladas",
                "row2_metric": "4 Horas",
                "row2_icon": "headset",
                "row3_title": "Agente de IA PEBAI Systems",
                "row3_desc": "Descuelga al 1er tono, cualifica y agenda la cita en CRM",
                "row3_metric": "12 Segundos",
                "row3_icon": "pebai",
                "footer_web": "pebaisystems.es",
                "footer_cta": "Comenta RESPUESTA para auditar"
            }
        ]
    },

    # DÍA 3: B2B Chat Mockup (Atención Nocturna a las 21:04 PM)
    {
        "id": "day_03_chat_mockup_21h",
        "day": 3,
        "type": "fb_chat_mockup",
        "stage": "MOFU",
        "topic": "Atención Fuera de Horario",
        "keyword": "RESPUESTA",
        "caption": """¿Qué pasa cuando un cliente te escribe a las 21:04 horas?

Si tiene que esperar a mañana por la mañana para recibir un presupuesto, ya le ha comprado a tu competidor.

Este es un caso real de cómo responde un agente autónomo de PEBAI: cualificación, cotización formal en PDF y reunión bloqueada en 34 segundos.

Comenta RESPUESTA para auditar tu sistema de atención.

#procesos #ia #whatsapp #negocios #b2b #ventas #crm""",
        "slides": [
            {
                "type": "fb_chat_mockup",
                "topic_tag": "CASO PRÁCTICO REAL · PEBAI",
                "category_icon": "whatsapp",
                "title_line1": "CÓMO CONTESTA TU NEGOCIO",
                "title_highlight": "A LAS 21:04 HORAS",
                "contact_name": "Director de Operaciones (Cliente)",
                "contact_status": "En línea · WhatsApp Oficial",
                "msg1_text": "Hola, buenas noches. Necesito saber si podéis automatizar la atención y citas en mi empresa. Fuera de horario perdemos muchas llamadas.",
                "msg2_text": "Buenas noches Carlos. Por supuesto. El sistema descuelga al 1er tono, valida requisitos según tu catálogo y agenda en tu CRM. Te acabo de adjuntar la estimación de ahorro:",
                "msg3_text": "¡Impresionante la rapidez! Me viene perfecto mañana a las 11:30 para la demo. Agendado.",
                "banner_title": "Reunión Comercial Agendada",
                "banner_desc": "Sin empleados a deshora. Cero llamadas perdidas. 100% automático.",
                "footer_web": "pebaisystems.es",
                "footer_cta": "Comenta RESPUESTA para auditar"
            }
        ]
    },

    # DÍA 4: 2x2 Strategic Quadrant Matrix (Velocidad vs Automatización)
    {
        "id": "day_04_matriz_cuadrante",
        "day": 4,
        "type": "fb_matrix2x2",
        "stage": "MOFU",
        "topic": "Matriz Estratégica",
        "keyword": "CONSULTORÍA",
        "caption": """Dos empresas del mismo sector con la misma inversión en publicidad consiguen resultados radicalmente diferentes.

La diferencia no está en el producto: está en el cuadrante operativo en el que se encuentra su atención al cliente.

En esta matriz 2x2 analizamos los 4 modelos de atención y dónde se sitúa la ventaja competitiva en 2026.

Comenta CONSULTORÍA para valorar cómo transformar la operativa de tu negocio.

#productividad #automatizacion #ventas #pymes #negocios #crecimiento""",
        "slides": [
            {
                "type": "fb_matrix2x2",
                "topic_tag": "MATRIZ ESTRATÉGICA · PEBAI",
                "category_icon": "chart",
                "title_line1": "DÓNDE SE SITÚA TU EMPRESA",
                "title_highlight": "EN ATENCIÓN AL CLIENTE",
                "q1_badge": "Saturado",
                "q1_icon": "clock",
                "q1_title": "Equipo Interno Manual",
                "q1_desc": "Sueldos fijos, cuellos de botella y llamadas a deshora sin contestar.",
                "q1_metric": "4 Horas",
                "q1_metric_sub": "Tiempo de Espera",
                "q2_badge": "LÍDER OPERATIVO",
                "q2_icon": "pebai",
                "q2_title": "Agente Autónomo PEBAI",
                "q2_desc": "Atiende llamadas y WhatsApp en 12s 24/7 y sincroniza en CRM.",
                "q2_metric": "12 Segundos",
                "q2_metric_sub": "24/7 ACTIVO",
                "q3_badge": "Obsoleto",
                "q3_icon": "voicemail",
                "q3_title": "Buzón de Voz Clásico",
                "q3_desc": "El cliente cuelga a los 4 tonos y compra al primer competidor.",
                "q3_metric": "> 14 Horas",
                "q3_metric_sub": "Pérdida de Leads",
                "q4_badge": "Incompleto",
                "q4_icon": "document",
                "q4_title": "Software Genérico",
                "q4_desc": "Licencias caras de IA que nadie usa por falta de implantación.",
                "q4_metric": "Sin uso",
                "q4_metric_sub": "Gasto sin Retorno",
                "footer_web": "pebaisystems.es",
                "footer_cta": "Comenta CONSULTORÍA para auditar"
            }
        ]
    },

    # DÍA 5: Architecture Node Graph (Pipeline de 3 Nodos)
    {
        "id": "day_05_pipeline_nodos",
        "day": 5,
        "type": "fb_nodegraph",
        "stage": "BOFU",
        "topic": "Pipeline Operativo",
        "keyword": "RESPUESTA",
        "caption": """Escalar una empresa no significa duplicar las horas de trabajo del equipo.

Significa montar pipelines que permitan absorber el doble de clientes sin contratar a tres personas más para rellenar Excels.

Esta es la arquitectura exacta que implantamos en empresas de servicios.

Comenta RESPUESTA y recibe el desglose técnico adaptado a tu sector.

#negocios #escalabilidad #ia #automatizacion #ventas #estrategia""",
        "slides": [
            {
                "type": "fb_nodegraph",
                "topic_tag": "ARQUITECTURA DE PROCESOS · PEBAI",
                "category_icon": "zap",
                "title_line1": "DEL MENSAJE DE WHATSAPP",
                "title_highlight": "A LA REUNIÓN EN 26 SEG",
                "step1_icon": "whatsapp",
                "step1_title": "Lead Entrante por WhatsApp",
                "step1_desc": "El cliente solicita presupuesto con audio o texto a las 21:04",
                "step1_badge": "21:04:00",
                "step2_icon": "pebai",
                "step2_title": "Agente IA Cualifica y Cotiza",
                "step2_desc": "Consulta tarifas, valida disponibilidad y genera propuesta en PDF",
                "step2_badge": "12 Segundos",
                "step3_icon": "calendar",
                "step3_title": "Cierre en Google Calendar",
                "step3_desc": "Propuesta enviada al cliente y cita sincronizada en CRM",
                "step3_badge": "21:04:26",
                "footer_web": "pebaisystems.es",
                "footer_cta": "Comenta RESPUESTA para auditar"
            }
        ]
    },

    # DÍA 6: Real Notebook (5 Fugas de Dinero con Boli Bic Fino 0.7mm) - Ángulo 1 & 2
    {
        "id": "day_06_fugas_libreta_real",
        "day": 6,
        "type": "notebook",
        "stage": "TOFU",
        "topic": "Optimización de Costes",
        "keyword": "CONSULTORÍA",
        "caption": """5 fugas de dinero silenciosas en tu empresa que la inteligencia artificial resuelve hoy.

La mayoría de fugas no ocurren por falta de clientes, sino por procesos lentos y manuales donde se pierde información.

Guarda este apunte para revisarlo con tu equipo.

Comenta CONSULTORÍA para valorar cómo tapar estas fugas en tu operativa.

#procesos #costes #eficiencia #ia #pymes #negocios #ahorro""",
        "slides": [
            {
                "type": "notebook",
                "bg_angle": 1,
                "title": '<span class="marker-highlight">5 fugas de dinero</span> en tu empresa que la IA resuelve hoy',
                "watermark": "@pebaisystems.es",
                "central_box": {"title": "FUGAS", "subtitle": "EN PROCESOS"},
                "items": [
                    {"header": "Llamadas a deshora", "solution": "Agente de voz 24/7", "highlight": "+35% ventas"},
                    {"header": "Presupuestos lentos", "solution": "Pipeline automático n8n", "highlight": "de 3h a 4 min"},
                    {"header": "Búsqueda de archivos", "solution": "Asistente RAG privado", "highlight": "en 3 seg"},
                    {"header": "WhatsApp atrasados", "solution": "Bot API oficial", "highlight": "en 12 seg"},
                    {"header": "Agendar reuniones", "solution": "Sync Calendar y CRM", "highlight": "cero fallos"}
                ],
                "strikethrough_text": "Contratar 3 administrativos más",
                "replacement_text": "Optimizar tus sistemas con IA.",
                "golden_rule": "Si una tarea se repite a diario, no va a mano.",
                "cta_text": "Comenta CONSULTORÍA para auditar tu caso gratis"
            },
            {
                "type": "notebook_cta",
                "bg_angle": 2,
                "watermark": "@pebaisystems.es",
                "line1": "Créame, esta cuenta",
                "line2": "no le va a aparecer",
                "line3": "otra vez, así que",
                "line4": "¡sígala para no perderla!",
                "subnote": "Comenta <strong>CONSULTORÍA</strong> y valoramos la operativa de tu empresa.",
                "cta_action": "Guardar apunte"
            }
        ]
    },

    # DÍA 7: Speed Benchmark (Atención Telefónica 24/7)
    {
        "id": "day_07_agente_telefonico_voz",
        "day": 7,
        "type": "fb_speed",
        "stage": "BOFU",
        "topic": "Atención Telefónica 24/7",
        "keyword": "VOZ",
        "caption": """Tu cliente potencial cuelga a los 4 tonos y llama directamente a tu competencia.

El 62% de llamadas comerciales en pymes se pierden porque la centralita está comunicando o entra fuera de horario laboral.

Un agente de voz con inteligencia artificial descuelga al primer tono, responde dudas técnicas de tu catálogo y bloquea la cita en tu calendario en tiempo real.

Comenta VOZ y te enviaremos una muestra de audio real de cómo suena un agente telefónico de PEBAI Systems.

#voz #ia #telefonica #atencionalcliente #pymes #ventas #pebaisystems #automatizacion""",
        "slides": [
            {
                "type": "fb_speed",
                "topic_tag": "BENCHMARK TELEFÓNICO · PEBAI",
                "sub_tag": "Atención por Teléfono",
                "title_line1": "SI COMUNICA O NO DESCUELGAS",
                "title_highlight": "PIERDES LA VENTA",
                "row1_title": "Buzón de Voz o Centralita",
                "row1_desc": "Música en espera interminable y cliente frustrado",
                "row1_metric": "0% Conversión",
                "row1_icon": "voicemail",
                "row2_title": "Secretaría en Horario Laboral",
                "row2_desc": "Líneas comunicando y llamadas perdidas a deshora",
                "row2_metric": "42% Perdidas",
                "row2_icon": "headset",
                "row3_title": "Agente Telefónico PEBAI",
                "row3_desc": "Descuelga al 1er tono 24/7, cualifica y agenda la cita",
                "row3_metric": "1er Tono",
                "hero_badge": "NUNCA COMUNICA",
                "banner_text": "El <strong>62% de las llamadas comerciales</strong> sin respuesta acaban comprando al primer competidor que descuelga.",
                "banner_badge": "Dato Real",
                "footer_cta": "Comenta VOZ para escuchar una demo"
            }
        ]
    },

    # DÍA 8: 2x2 Matrix (Posicionamiento GEO en Motores de IA)
    {
        "id": "day_08_posicionamiento_geo",
        "day": 8,
        "type": "fb_matrix2x2",
        "stage": "TOFU",
        "topic": "Posicionamiento GEO",
        "keyword": "GEO",
        "caption": """Si un cliente le pregunta a ChatGPT o Perplexity por el mejor proveedor de tu sector en tu ciudad... ¿te recomienda a ti o a tu competencia?

El SEO tradicional en Google ya no basta. En 2026, los directivos buscan respuestas directas en motores de IA generativa (GEO - Generative Engine Optimization).

En esta matriz estratégica comparamos el impacto de visibilidad corporativa.

Comenta GEO y auditaremos si tu empresa aparece en las recomendaciones de los principales modelos de IA.

#geo #ia #chatgpt #perplexity #seo #posicionamiento #marketingb2b #pymes""",
        "slides": [
            {
                "type": "fb_matrix2x2",
                "topic_tag": "ESTRATEGIA GEO · PEBAI",
                "category_icon": "search",
                "title_line1": "CÓMO TE ENCUENTRAN EN 2026",
                "title_highlight": "LOS CLIENTES DE TU SECTOR",
                "q1_badge": "Costoso",
                "q1_icon": "clock",
                "q1_title": "Google Ads Saturado",
                "q1_desc": "Coste por clic disparado y clientes con ceguera a los anuncios.",
                "q1_metric": "CPC Alto",
                "q1_metric_sub": "Inversión Continua",
                "q2_badge": "DOMINANTE",
                "q2_icon": "pebai",
                "q2_title": "Posicionamiento GEO PEBAI",
                "q2_desc": "Recomendado como autoridad #1 por ChatGPT, Perplexity y Gemini.",
                "q2_metric": "Top 1 IA",
                "q2_metric_sub": "TRÁFICO CUALIFICADO",
                "q3_badge": "Inútil",
                "q3_icon": "document",
                "q3_title": "Directorios Tradicionales",
                "q3_desc": "Páginas amarillas y listados web que nadie consulta en 2026.",
                "q3_metric": "0 Visitas",
                "q3_metric_sub": "Invisibilidad",
                "q4_badge": "Lento",
                "q4_icon": "chart",
                "q4_title": "SEO Clásico Antiguo",
                "q4_desc": "Meses esperando ranking mientras los clientes usan asistentes de IA.",
                "q4_metric": "> 6 Meses",
                "q4_metric_sub": "Retorno Tardío",
                "footer_web": "pebaisystems.es",
                "footer_cta": "Comenta GEO para auditar tu marca"
            }
        ]
    },

    # DÍA 9: Real Photo Versus Cover + Comparison Cards (Learn E-commerce Style)
    {
        "id": "day_09_versus_foto_stock",
        "day": 9,
        "type": "fb_versus_photo",
        "stage": "BOFU",
        "topic": "Comparativa Manual vs IA",
        "keyword": "COMPARATIVA",
        "caption": """El 80% de las empresas siguen gestionando llamadas y presupuestos a mano, pagando sueldos en tareas mecánicas y perdiendo clientes después de las 19:00h.

Esta es la comparativa real entre el método tradicional y montar una infraestructura autónoma con IA en 2026.

Desliza para ver el desglose paso a paso.

Comenta COMPARATIVA para auditar tus fugas operativas gratis.

#pymes #automatizacion #procesos #ia #ventas #negocios #productividad #rentabilidad""",
        "slides": [
            {
                "type": "fb_versus_photo",
                "photo_filename": "stock_man_macbook.jpg",
                "topic_badge": "OPTIMIZACIÓN OPERATIVA · PEBAI",
                "pill_left": "MANUAL",
                "pill_right": "IA PEBAI",
                "title_line1": "EL SISTEMA QUE AHORRA 20H",
                "title_highlight": "EN TU EMPRESA",
                "subtitle": "Cómo atender llamadas y WhatsApps 24/7 sin contratar personal extra ni perder un solo cliente.",
                "footer_web": "pebaisystems.es",
                "footer_cta": "Desliza para ver la comparativa"
            },
            {
                "type": "fb_versus_cards",
                "topic_badge": "CANAL: WHATSAPP Y LLAMADAS",
                "step_number": "01",
                "step_category": "TIEMPO DE RESPUESTA A LEADS",
                "step_title": "Atención Inmediata al Primer Tono",
                "manual_ribbon": "Proceso Manual",
                "manual_title": "Centralita / Secretaría",
                "manual_desc": "Líneas comunicando a deshora, notas en papel y el cliente cuelga para llamar a la competencia.",
                "manual_metric": "> 4 Horas",
                "manual_note": "60% Fuga de clientes",
                "pebai_ribbon": "100% Autónomo",
                "pebai_title": "Agente IA PEBAI Systems",
                "pebai_desc": "Descuelga en 12 segundos, cualifica los requerimientos técnicos y agenda la reunión en Google Calendar.",
                "pebai_metric": "12 Segundos",
                "pebai_note": "24/7 Activo · 0 llamadas perdidas",
                "footer_web": "pebaisystems.es",
                "footer_cta": "Desliza para ver el siguiente caso"
            }
        ]
    },

    # DÍA 10: Editorial Skills Architecture (Steph Carvajalino / Claude Code Style)
    {
        "id": "day_10_editorial_skills_ia",
        "day": 10,
        "type": "fb_editorial_skills",
        "stage": "MOFU",
        "topic": "Arquitectura de Agentes",
        "keyword": "SISTEMA",
        "caption": """4 agentes de IA organizados como un equipo comercial real: Atención 24/7, Cotización instantánea, Agendamiento y Sincronización en CRM.

Dejamos de perder clientes a deshora y de saltar entre 5 aplicaciones para enviar un presupuesto. Si una tarea en tu empresa se repite a diario, no va a mano.

Desliza para ver la estructura de cada agente.

Comenta SISTEMA para auditar tu caso gratis.

#claudecode #agentesia #automatizacion #pymes #negocios #sistemas #escalabilidad #b2b""",
        "slides": [
            {
                "type": "fb_editorial_skills",
                "top_handle": "@pebaisystems.es",
                "title_prefix": "Mi empresa entera",
                "title_accent": "Agentes de IA.",
                "badge_label": "EL CEREBRO OPERATIVO",
                "core_title": "PEBAI.ARCHITECTURE",
                "core_sub": "La infraestructura que cualifica y agenda sin intervención humana",
                "hook_callout": "4 agentes autónomos organizados como un equipo comercial real →",
                "swipe_label": "desliza",
                "footer_web": "pebaisystems.es"
            },
            {
                "type": "fb_editorial_list",
                "top_handle": "@pebaisystems.es",
                "step_counter": "02 / 05 — AGENTE 1 DE 4",
                "module_line1": "El Agente de",
                "module_highlight": "WhatsApp.",
                "module_desc": "Cualifica requerimientos técnicos, cotiza tarifas y agenda en tu calendario en 12 segundos. Sin intervención manual.",
                "swipe_label": "desliza",
                "footer_web": "pebaisystems.es"
            }
        ]
    },

    # DÍA 11: Radial Speedometer Gauge (Recuperación de Leads Perdidos)
    {
        "id": "day_11_roi_recuperacion",
        "day": 11,
        "type": "fb_radialgauge",
        "stage": "BOFU",
        "topic": "Retorno de Inversión",
        "keyword": "AUDITORÍA",
        "caption": """¿Cuánto dinero deja tu empresa sobre la mesa cada mes en llamadas no respondidas?

Hicimos el cálculo con una pyme de servicios: 38 llamadas perdidas al mes a un ticket medio de 850€ significan más de 30.000€ anuales que se van a la competencia.

Un agente de IA recupera esa fuga desde el día 1 con un coste operativo mínimo.

Comenta AUDITORÍA y calculamos la fuga de facturación de tu negocio.

#roi #facturacion #ventas #pymes #negocios #rentabilidad""",
        "slides": [
            {
                "type": "fb_radialgauge",
                "topic_tag": "AUDITORÍA DE FACTURACIÓN · PEBAI",
                "category_icon": "chart",
                "title_line1": "CUÁNTO DINERO PIERDES",
                "title_highlight": "POR NO RESPONDER AL TONO",
                "center_value": "+35%",
                "center_label": "FACTURACIÓN RECUPERADA",
                "center_badge": "EN MENOS DE 30 DÍAS",
                "row1_title": "Llamadas no atendidas a deshora",
                "row1_desc": "38 clientes al mes que no vuelven a llamar",
                "row1_metric": "- 32.300 € / año",
                "row1_icon": "voicemail",
                "row2_title": "Presupuestos tardíos (> 4h)",
                "row2_desc": "El 50% compra al competidor más rápido",
                "row2_metric": "- 18.000 € / año",
                "row2_icon": "clock",
                "row3_title": "Sistema Autónomo PEBAI",
                "row3_desc": "Atención al 1er tono y cotización instantánea 24/7",
                "row3_metric": "+ 50.300 € Recuperados",
                "row3_icon": "pebai",
                "footer_web": "pebaisystems.es",
                "footer_cta": "Comenta AUDITORÍA para auditar"
            }
        ]
    },

    # DÍA 12: Real Notebook (4 Trampas con la IA) - Ángulo 3 con Boli Bic Fino 0.7mm
    {
        "id": "day_12_libreta_errores_ia",
        "day": 12,
        "type": "notebook",
        "stage": "TOFU",
        "topic": "Errores de Adopción de IA",
        "keyword": "CONSULTORÍA",
        "caption": """4 trampas donde las pymes tiran el dinero al intentar usar inteligencia artificial.

No necesitas pagar 10 suscripciones distintas de software. Necesitas conectar tus herramientas actuales para que trabajen solas.

Guarda este apunte para no cometer estos errores en tu negocio.

Comenta CONSULTORÍA para valorar una implantación seria y a medida.

#ia #pymes #negocios #errores #estrategia #consejos #productividad""",
        "slides": [
            {
                "type": "notebook",
                "bg_angle": 3,
                "title": '<span class="marker-highlight">4 trampas comunes</span> donde las pymes pierden dinero con la IA',
                "watermark": "@pebaisystems.es",
                "central_box": {"title": "TRAMPAS", "subtitle": "EN LA EMPRESA"},
                "items": [
                    {"header": "Pagar 8 suscripciones", "solution": "Unificar en un pipeline privado", "highlight": "-70% gasto"},
                    {"header": "Cursos sin aplicación", "solution": "Implantación directa en procesos", "highlight": "cero teoría"},
                    {"header": "Chatbots tontos", "solution": "Agentes con acceso a tu base de datos", "highlight": "100% útil"},
                    {"header": "Hacerlo todo manual", "solution": "Sincronizar CRM con Calendar", "highlight": "ahorro diario"}
                ],
                "strikethrough_text": "Contratar herramientas al azar",
                "replacement_text": "Montar arquitectura sólida.",
                "golden_rule": "La tecnología sin proceso es coste. Con proceso es margen.",
                "cta_text": "Comenta CONSULTORÍA para valorar tu caso gratis"
            },
            {
                "type": "notebook_cta",
                "bg_angle": 3,
                "watermark": "@pebaisystems.es",
                "line1": "Créame, esta cuenta",
                "line2": "no le va a aparecer",
                "line3": "otra vez, así que",
                "line4": "¡sígala para no perderla!",
                "subnote": "Comenta <strong>CONSULTORÍA</strong> y valoramos la operativa de tu empresa.",
                "cta_action": "Guardar apunte"
            }
        ]
    },

    # DÍA 13: Node Architecture Flow (Pipeline de Reactivación de Base de Datos)
    {
        "id": "day_13_pipeline_reactivacion",
        "day": 13,
        "type": "fb_nodegraph",
        "stage": "MOFU",
        "topic": "Reactivación de Clientes",
        "keyword": "REACTIVAR",
        "caption": """Tienes cientos de clientes antiguos en tu agenda que te compraron una vez y no han vuelto a saber de ti.

Captar un cliente nuevo cuesta 5 veces más que reactivar a uno que ya confía en tu empresa.

Este es el pipeline que usamos para despertar bases de datos inactivas y generar reuniones de venta en 48 horas.

Comenta REACTIVAR para conocer el sistema de reactivación automática.

#clientes #ventas #crm #whatsapp #marketingb2b #pymes""",
        "slides": [
            {
                "type": "fb_nodegraph",
                "topic_tag": "PIPELINE DE REACTIVACIÓN · PEBAI",
                "category_icon": "database",
                "title_line1": "CÓMO REACTIVAR CLIENTES",
                "title_highlight": "SIN LLAMAR EN FRÍO",
                "step1_icon": "database",
                "step1_title": "Base de Datos de Clientes Dormidos",
                "step1_desc": "Contactos que compraron hace más de 6 meses en tu CRM",
                "step1_badge": "Segmento 6M",
                "step2_icon": "pebai",
                "step2_title": "Agente IA Personaliza Oferta",
                "step2_desc": "Genera mensaje contextualizado por WhatsApp según su historial",
                "step2_badge": "1 a 1 Real",
                "step3_icon": "calendar",
                "step3_title": "Citas y Nuevos Pedidos Cerrados",
                "step3_desc": "Reactivación de ventas directas sin inversión en anuncios",
                "step3_badge": "En 48 Horas",
                "footer_web": "pebaisystems.es",
                "footer_cta": "Comenta REACTIVAR para ver la demo"
            }
        ]
    },

    # DÍA 14: 2x2 Matrix (Madurez de Adopción de IA en Empresas)
    {
        "id": "day_14_matriz_adopcion_ia",
        "day": 14,
        "type": "fb_matrix2x2",
        "stage": "BOFU",
        "topic": "Madurez Tecnológica",
        "keyword": "CONSULTORÍA",
        "caption": """En 2026 habrá solo dos tipos de empresas en tu sector: las que usan agentes autónomos para operar más rápido con menos costes, y las que seguirán perdiendo clientes por lentitud.

¿En qué nivel de madurez operativa se encuentra tu negocio hoy?

Revisa los 4 niveles y comenta CONSULTORÍA si quieres dar el salto al nivel autónomo.

#futuro #ia #tecnologia #liderazgo #pymes #negocios #transformacion""",
        "slides": [
            {
                "type": "fb_matrix2x2",
                "topic_tag": "MADUREZ OPERATIVA · PEBAI",
                "category_icon": "chart",
                "title_line1": "LOS 4 NIVELES DE ADOPCIÓN",
                "title_highlight": "DE IA EN PYMES EN 2026",
                "q1_badge": "Experimentando",
                "q1_icon": "sparkles",
                "q1_title": "Uso de ChatGPT Manual",
                "q1_desc": "Empleados haciendo copy-paste suelto sin sistemas integrados.",
                "q1_metric": "Ahorro Leve",
                "q1_metric_sub": "Sin Impacto",
                "q2_badge": "EMPRESA LÍDER",
                "q2_icon": "pebai",
                "q2_title": "Agentes Autónomos PEBAI",
                "q2_desc": "Sistemas de voz y chat conectados al CRM que cierran ventas solos.",
                "q2_metric": "+35% Margen",
                "q2_metric_sub": "ESCALABILIDAD",
                "q3_badge": "Rezagado",
                "q3_icon": "clock",
                "q3_title": "Operativa 100% Manual",
                "q3_desc": "Papeles, llamadas perdidas y presupuestos en Excel sin automatizar.",
                "q3_metric": "Fuga Diaria",
                "q3_metric_sub": "Riesgo Alto",
                "q4_badge": "Incompleto",
                "q4_icon": "document",
                "q4_title": "Software sin Implantación",
                "q4_desc": "Herramientas compradas por moda que nadie del equipo utiliza.",
                "q4_metric": "Coste Fijo",
                "q4_metric_sub": "Sin Retorno",
                "footer_web": "pebaisystems.es",
                "footer_cta": "Comenta CONSULTORÍA para auditar"
            }
        ]
    }
]

def get_day_carousel(day_number: int) -> dict:
    for c in FULL_14_DAY_CALENDAR:
        if c["day"] == day_number:
            return c
    raise ValueError(f"Day {day_number} not found in content calendar.")
