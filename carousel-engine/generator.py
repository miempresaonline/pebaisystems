import os
import json
from jinja2 import Environment, FileSystemLoader
from renderer import render_slides

# Jinja environment
TEMPLATES_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), 'templates'))
ICONS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), 'assets', 'icons'))
OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), 'output'))
ASSETS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), 'assets')).replace('\\', '/')
ASSETS_URI = f"file:///{ASSETS_DIR}"

jinja_env = Environment(loader=FileSystemLoader(TEMPLATES_DIR), autoescape=False)

def load_icon_svg(icon_name: str) -> str:
    path = os.path.join(ICONS_DIR, f"{icon_name}.svg")
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    # Default fallbacks with currentColor
    fallbacks = {
        "whatsapp": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
        "calendar": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
        "phone": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
        "headset": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>',
        "zap": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
        "sparkles": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>',
        "chart": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="12" width="4" height="8" rx="1"/><rect x="10" y="8" width="4" height="12" rx="1"/><rect x="17" y="4" width="4" height="16" rx="1"/></svg>',
        "document": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'
    }
    return fallbacks.get(icon_name, fallbacks["sparkles"])

def build_carousel(carousel_data: dict) -> dict:
    carousel_id = carousel_data.get("id", "carousel_untitled")
    carousel_dir = os.path.join(OUTPUT_DIR, carousel_id)
    html_dir = os.path.join(carousel_dir, "html")
    os.makedirs(html_dir, exist_ok=True)

    slides_config = carousel_data.get("slides", [])
    total_slides = len(slides_config)
    render_tasks = []
    generated_pngs = []

    for index, slide_spec in enumerate(slides_config, start=1):
        slide_type = slide_spec.get("type", carousel_data.get("type", "fontbravo"))

        # 1. FontBravo Arched Pillars (Ranking)
        if slide_type in ["fontbravo", "fb_pillars"]:
            template = jinja_env.get_template("fontbravo_slide.html.jinja")
            cols = []
            for col in slide_spec.get("columns", []):
                col_copy = dict(col)
                col_copy["icon_svg"] = load_icon_svg(col.get("icon", "sparkles"))
                cols.append(col_copy)

            category_icon_svg = load_icon_svg(slide_spec.get("category_icon", "chart"))
            html_content = template.render(
                assets_uri=ASSETS_URI,
                category_title=slide_spec.get("category_title", ""),
                category_icon_svg=category_icon_svg,
                columns=cols,
                footer_text=slide_spec.get("footer_text", "pebaisystems.es"),
                footer_cta=slide_spec.get("footer_cta", "Desliza para ver el stack"),
                slide_number=index,
                total_slides=total_slides
            )

        # 2. 2x2 Strategic Quadrant Matrix
        elif slide_type == "fb_matrix2x2":
            template = jinja_env.get_template("fb_matrix2x2.html.jinja")
            cat_icon = load_icon_svg(slide_spec.get("category_icon", "chart"))
            q1_icon = load_icon_svg(slide_spec.get("q1_icon", "clock"))
            q2_icon = load_icon_svg(slide_spec.get("q2_icon", "pebai"))
            q3_icon = load_icon_svg(slide_spec.get("q3_icon", "voicemail"))
            q4_icon = load_icon_svg(slide_spec.get("q4_icon", "document"))

            html_content = template.render(
                assets_uri=ASSETS_URI,
                topic_tag=slide_spec.get("topic_tag", "MATRIZ ESTRATÉGICA · PEBAI"),
                category_icon_svg=cat_icon,
                title_line1=slide_spec.get("title_line1", "DÓNDE ESTÁ TU EMPRESA"),
                title_highlight=slide_spec.get("title_highlight", "EN AUTOMATIZACIÓN"),
                q1_badge=slide_spec.get("q1_badge", "Saturado"),
                q1_icon_svg=q1_icon,
                q1_title=slide_spec.get("q1_title", "Secretaría en Horario"),
                q1_desc=slide_spec.get("q1_desc", "Llamadas a deshora que nadie atiende y emails acumulados."),
                q1_metric=slide_spec.get("q1_metric", "4 Horas"),
                q1_metric_sub=slide_spec.get("q1_metric_sub", "Espera"),
                q2_badge=slide_spec.get("q2_badge", "LÍDER OPERATIVO"),
                q2_icon_svg=q2_icon,
                q2_title=slide_spec.get("q2_title", "Agente de IA PEBAI"),
                q2_desc=slide_spec.get("q2_desc", "Atiende en 12 segundos 24/7, cualifica y sincroniza en CRM."),
                q2_metric=slide_spec.get("q2_metric", "12 Segundos"),
                q2_metric_sub=slide_spec.get("q2_metric_sub", "24/7 ACTIVO"),
                q3_badge=slide_spec.get("q3_badge", "Obsoleto"),
                q3_icon_svg=q3_icon,
                q3_title=slide_spec.get("q3_title", "Buzón de Voz"),
                q3_desc=slide_spec.get("q3_desc", "El cliente cuelga a los 4 tonos y compra a la competencia."),
                q3_metric=slide_spec.get("q3_metric", "> 14 Horas"),
                q3_metric_sub=slide_spec.get("q3_metric_sub", "Pérdida"),
                q4_badge=slide_spec.get("q4_badge", "Incompleto"),
                q4_icon_svg=q4_icon,
                q4_title=slide_spec.get("q4_title", "Software Genérico"),
                q4_desc=slide_spec.get("q4_desc", "Licencias caras que nadie utiliza por falta de integración."),
                q4_metric=slide_spec.get("q4_metric", "Sin uso"),
                q4_metric_sub=slide_spec.get("q4_metric_sub", "Gasto"),
                footer_web=slide_spec.get("footer_web", "pebaisystems.es"),
                footer_cta=slide_spec.get("footer_cta", "Desliza para ver la solución"),
                slide_number=index,
                total_slides=total_slides
            )

        # 3. Circular Response Speedometer Gauge
        elif slide_type == "fb_radialgauge":
            template = jinja_env.get_template("fb_radialgauge.html.jinja")
            cat_icon = load_icon_svg(slide_spec.get("category_icon", "zap"))
            r1_icon = load_icon_svg(slide_spec.get("row1_icon", "voicemail"))
            r2_icon = load_icon_svg(slide_spec.get("row2_icon", "headset"))
            r3_icon = load_icon_svg(slide_spec.get("row3_icon", "pebai"))

            html_content = template.render(
                assets_uri=ASSETS_URI,
                topic_tag=slide_spec.get("topic_tag", "VELOCÍMETRO DE VENTAS · PEBAI"),
                category_icon_svg=cat_icon,
                title_line1=slide_spec.get("title_line1", "EL QUE RESPONDE ANTES"),
                title_highlight=slide_spec.get("title_highlight", "SE LLEVA EL CLIENTE"),
                center_value=slide_spec.get("center_value", "12s"),
                center_label=slide_spec.get("center_label", "ATENCIÓN INMEDIATA"),
                center_badge=slide_spec.get("center_badge", "24/7 SIN ESPERAS"),
                row1_icon_svg=r1_icon,
                row1_title=slide_spec.get("row1_title", "Buzón de Voz / Fuera de Horario"),
                row1_desc=slide_spec.get("row1_desc", "El cliente cuelga y compra a la competencia"),
                row1_metric=slide_spec.get("row1_metric", "> 14 Horas"),
                row2_icon_svg=r2_icon,
                row2_title=slide_spec.get("row2_title", "Secretaría en Horario Laboral"),
                row2_desc=slide_spec.get("row2_desc", "Saturada con tareas administrativas acumuladas"),
                row2_metric=slide_spec.get("row2_metric", "4 Horas"),
                row3_icon_svg=r3_icon,
                row3_title=slide_spec.get("row3_title", "Agente de IA PEBAI Systems"),
                row3_desc=slide_spec.get("row3_desc", "Descuelga al 1er tono, cualifica el lead y agenda en Calendar"),
                row3_metric=slide_spec.get("row3_metric", "12 Segundos"),
                footer_web=slide_spec.get("footer_web", "pebaisystems.es"),
                footer_cta=slide_spec.get("footer_cta", "Desliza para auditar tu caso"),
                slide_number=index,
                total_slides=total_slides
            )

        # 4. Node Architecture Flow Pipeline
        elif slide_type == "fb_nodegraph":
            template = jinja_env.get_template("fb_nodegraph.html.jinja")
            cat_icon = load_icon_svg(slide_spec.get("category_icon", "zap"))
            s1_icon = load_icon_svg(slide_spec.get("step1_icon", "whatsapp"))
            s2_icon = load_icon_svg(slide_spec.get("step2_icon", "pebai"))
            s3_icon = load_icon_svg(slide_spec.get("step3_icon", "calendar"))

            html_content = template.render(
                assets_uri=ASSETS_URI,
                topic_tag=slide_spec.get("topic_tag", "PIPELINE OPERATIVO · PEBAI"),
                category_icon_svg=cat_icon,
                title_line1=slide_spec.get("title_line1", "CÓMO CONTESTA TU NEGOCIO"),
                title_highlight=slide_spec.get("title_highlight", "A LAS 21:04 HORAS"),
                step1_icon_svg=s1_icon,
                step1_title=slide_spec.get("step1_title", "Lead Entrante por WhatsApp"),
                step1_desc=slide_spec.get("step1_desc", "Cliente pide cotización urgente fuera de horario"),
                step1_badge=slide_spec.get("step1_badge", "21:04:00"),
                step2_icon_svg=s2_icon,
                step2_title=slide_spec.get("step2_title", "Agente de IA Cualifica y Cotiza"),
                step2_desc=slide_spec.get("step2_desc", "Valida requisitos, calcula tarifa y genera PDF"),
                step2_badge=slide_spec.get("step2_badge", "12 Segundos"),
                step3_icon_svg=s3_icon,
                step3_title=slide_spec.get("step3_title", "Cita Cerrada en Google Calendar"),
                step3_desc=slide_spec.get("step3_desc", "Propuesta formal entregada y reunión agendada"),
                step3_badge=slide_spec.get("step3_badge", "21:04:26"),
                footer_web=slide_spec.get("footer_web", "pebaisystems.es"),
                footer_cta=slide_spec.get("footer_cta", "Desliza para ver la demo"),
                slide_number=index,
                total_slides=total_slides
            )

        # 5. Minimalist B2B Chat Mockup
        elif slide_type == "fb_chat_mockup":
            template = jinja_env.get_template("fb_chat_mockup.html.jinja")
            cat_icon = load_icon_svg(slide_spec.get("category_icon", "whatsapp"))

            html_content = template.render(
                assets_uri=ASSETS_URI,
                topic_tag=slide_spec.get("topic_tag", "CASO PRÁCTICO REAL · PEBAI"),
                category_icon_svg=cat_icon,
                title_line1=slide_spec.get("title_line1", "CÓMO RESPONDE TU EMPRESA"),
                title_highlight=slide_spec.get("title_highlight", "A LAS 21:04 HORAS"),
                contact_name=slide_spec.get("contact_name", "Cliente Potencial (CEO)"),
                contact_status=slide_spec.get("contact_status", "En línea · WhatsApp Oficial"),
                msg1_text=slide_spec.get("msg1_text", "Hola buenas noches. ¿Podéis cotizarme la automatización de atención y citas para mi empresa? Fuera de horario perdemos muchas llamadas."),
                msg2_text=slide_spec.get("msg2_text", "Buenas noches Carlos. Por supuesto. El sistema descuelga al 1er tono, cualifica el lead y agenda citas directamente en tu CRM. Te acabo de adjuntar una estimación formal de ahorro:"),
                msg3_text=slide_spec.get("msg3_text", "¡Impresionante la rapidez! Me viene perfecto mañana a las 11:30. Agendado."),
                banner_title=slide_spec.get("banner_title", "Reunión Comercial Agendada"),
                banner_desc=slide_spec.get("banner_desc", "Sin empleados a deshora. Cero llamadas perdidas. 100% automático."),
                footer_web=slide_spec.get("footer_web", "pebaisystems.es"),
                footer_cta=slide_spec.get("footer_cta", "Comenta RESPUESTA para auditar"),
                slide_number=index,
                total_slides=total_slides
            )

        # 6. FontBravo Speed Benchmark
        elif slide_type == "fb_speed":
            template = jinja_env.get_template("fb_speed.html.jinja")
            row1_svg = load_icon_svg(slide_spec.get("row1_icon", "voicemail"))
            row2_svg = load_icon_svg(slide_spec.get("row2_icon", "headset"))
            html_content = template.render(
                assets_uri=ASSETS_URI,
                topic_tag=slide_spec.get("topic_tag", "BENCHMARK DE VELOCIDAD · PEBAI"),
                sub_tag=slide_spec.get("sub_tag", "Tiempo de Respuesta"),
                title_line1=slide_spec.get("title_line1", "EL QUE RESPONDE ANTES"),
                title_highlight=slide_spec.get("title_highlight", "SE LLEVA EL CLIENTE"),
                row1_title=slide_spec.get("row1_title", "Buzón de Voz Tradicional"),
                row1_desc=slide_spec.get("row1_desc", "El cliente cuelga y llama a otra empresa"),
                row1_metric=slide_spec.get("row1_metric", "> 14 Horas"),
                row1_icon_svg=row1_svg,
                row2_title=slide_spec.get("row2_title", "Secretaria en Horario de Oficina"),
                row2_desc=slide_spec.get("row2_desc", "Saturada con tareas y emails acumulados"),
                row2_metric=slide_spec.get("row2_metric", "4 Horas"),
                row2_icon_svg=row2_svg,
                row3_title=slide_spec.get("row3_title", "Agente de IA PEBAI Systems"),
                row3_desc=slide_spec.get("row3_desc", "Atiende al 1er tono, cualifica y agenda la cita"),
                row3_metric=slide_spec.get("row3_metric", "12 Seg"),
                hero_badge=slide_spec.get("hero_badge", "EL MÁS RÁPIDO"),
                banner_text=slide_spec.get("banner_text", "La empresa que contesta en <strong>menos de 5 minutos</strong> se lleva el <strong>78%</strong> de las ventas."),
                banner_badge=slide_spec.get("banner_badge", "Dato Real"),
                footer_web=slide_spec.get("footer_web", "pebaisystems.es"),
                footer_cta=slide_spec.get("footer_cta", "Desliza para auditar tu caso"),
                slide_number=index,
                total_slides=total_slides
            )

        # 7. Real Notebook Mindmap (Fine 0.7mm Bic Pen, Bounded inside paper)
        elif slide_type in ["notebook", "mindmap"]:
            template = jinja_env.get_template("notebook_slide.html.jinja")
            html_content = template.render(
                assets_uri=ASSETS_URI,
                bg_angle=slide_spec.get("bg_angle", 1),
                title=slide_spec.get("title", ""),
                watermark=slide_spec.get("watermark", "@pebaisystems.es"),
                central_box=slide_spec.get("central_box", {"title": "FUGAS", "subtitle": "EN PROCESOS"}),
                items=slide_spec.get("items", []),
                strikethrough_text=slide_spec.get("strikethrough_text", ""),
                replacement_text=slide_spec.get("replacement_text", ""),
                golden_rule=slide_spec.get("golden_rule", ""),
                cta_text=slide_spec.get("cta_text", "Comenta CONSULTORÍA para valorar tu empresa gratis"),
                slide_number=index,
                total_slides=total_slides
            )

        # 8. Real Notebook Handwritten CTA Note
        elif slide_type in ["closing_note", "notebook_cta"]:
            template = jinja_env.get_template("notebook_cta.html.jinja")
            html_content = template.render(
                assets_uri=ASSETS_URI,
                bg_angle=slide_spec.get("bg_angle", 2),
                watermark=slide_spec.get("watermark", "@pebaisystems.es"),
                line1=slide_spec.get("line1", "Créame, esta cuenta"),
                line2=slide_spec.get("line2", "no le va a aparecer"),
                line3=slide_spec.get("line3", "otra vez, así que"),
                line4=slide_spec.get("line4", "¡sígala para no perderla!"),
                subnote=slide_spec.get("subnote", ""),
                cta_action=slide_spec.get("cta_action", "Guardar apunte")
            )

        # 9. Real Stock Photo Versus Cover (Learn E-commerce Style)
        elif slide_type == "fb_versus_photo":
            template = jinja_env.get_template("fb_versus_photo.html.jinja")
            html_content = template.render(
                assets_uri=ASSETS_URI,
                photo_filename=slide_spec.get("photo_filename", "stock_man_macbook.jpg"),
                topic_badge=slide_spec.get("topic_badge", "OPTIMIZACIÓN OPERATIVA · PEBAI"),
                pill_left=slide_spec.get("pill_left", "MANUAL"),
                pill_right=slide_spec.get("pill_right", "IA PEBAI"),
                title_line1=slide_spec.get("title_line1", "EL SISTEMA QUE AHORRA 20H"),
                title_highlight=slide_spec.get("title_highlight", "EN TU EMPRESA"),
                subtitle=slide_spec.get("subtitle", "Cómo automatizar llamadas y WhatsApps 24/7 sin contratar más personal."),
                footer_web=slide_spec.get("footer_web", "pebaisystems.es"),
                footer_cta=slide_spec.get("footer_cta", "Desliza para ver la comparativa"),
                slide_number=index,
                total_slides=total_slides
            )

        # 10. Versus Comparison Cards Breakdown
        elif slide_type == "fb_versus_cards":
            template = jinja_env.get_template("fb_versus_cards.html.jinja")
            html_content = template.render(
                assets_uri=ASSETS_URI,
                topic_badge=slide_spec.get("topic_badge", "CANAL: WHATSAPP Y LLAMADAS"),
                step_number=slide_spec.get("step_number", "01"),
                step_category=slide_spec.get("step_category", "TIEMPO DE RESPUESTA A LEADS"),
                step_title=slide_spec.get("step_title", "Atención Inmediata al Primer Tono"),
                manual_ribbon=slide_spec.get("manual_ribbon", "Proceso Manual"),
                manual_title=slide_spec.get("manual_title", "Centralita / Secretaría"),
                manual_desc=slide_spec.get("manual_desc", "Líneas comunicando a deshora, notas en papel y el cliente cuelga para llamar a la competencia."),
                manual_metric=slide_spec.get("manual_metric", "> 4 Horas"),
                manual_note=slide_spec.get("manual_note", "60% Fuga de clientes"),
                pebai_ribbon=slide_spec.get("pebai_ribbon", "100% Autónomo"),
                pebai_title=slide_spec.get("pebai_title", "Agente IA PEBAI Systems"),
                pebai_desc=slide_spec.get("pebai_desc", "Descuelga en 12 segundos, cualifica los requerimientos técnicos y agenda la reunión en Google Calendar."),
                pebai_metric=slide_spec.get("pebai_metric", "12 Segundos"),
                pebai_note=slide_spec.get("pebai_note", "24/7 Activo · 0 llamadas perdidas"),
                footer_web=slide_spec.get("footer_web", "pebaisystems.es"),
                footer_cta=slide_spec.get("footer_cta", "Desliza para ver el siguiente caso"),
                slide_number=index,
                total_slides=total_slides
            )

        # 11. Editorial Skills Cover (Steph Carvajalino Style)
        elif slide_type == "fb_editorial_skills":
            template = jinja_env.get_template("fb_editorial_skills.html.jinja")
            html_content = template.render(
                assets_uri=ASSETS_URI,
                top_handle=slide_spec.get("top_handle", "@pebaisystems.es"),
                title_prefix=slide_spec.get("title_prefix", "Mi empresa entera"),
                title_accent=slide_spec.get("title_accent", "Agentes de IA."),
                badge_label=slide_spec.get("badge_label", "EL CEREBRO OPERATIVO"),
                core_title=slide_spec.get("core_title", "PEBAI.ARCHITECTURE"),
                core_sub=slide_spec.get("core_sub", "La infraestructura que cualifica y agenda sin intervención humana"),
                hook_callout=slide_spec.get("hook_callout", "4 agentes autónomos organizados como un equipo comercial real →"),
                swipe_label=slide_spec.get("swipe_label", "deslizá"),
                slide_number=index,
                total_slides=total_slides
            )

        # 12. Editorial Skills List Breakdown
        elif slide_type == "fb_editorial_list":
            template = jinja_env.get_template("fb_editorial_list.html.jinja")
            html_content = template.render(
                assets_uri=ASSETS_URI,
                top_handle=slide_spec.get("top_handle", "@pebaisystems.es"),
                step_counter=slide_spec.get("step_counter", "02 / 05 — AGENTE 1 DE 4"),
                module_line1=slide_spec.get("module_line1", "El Agente de"),
                module_highlight=slide_spec.get("module_highlight", "WhatsApp."),
                module_desc=slide_spec.get("module_desc", "Cualifica requerimientos técnicos, cotiza tarifas y agenda en tu calendario en 12 segundos. Vos no tocás nada."),
                swipe_label=slide_spec.get("swipe_label", "deslizá"),
                slide_number=index,
                total_slides=total_slides
            )
        else:
            raise ValueError(f"Unknown slide type: {slide_type}")

        html_file = os.path.join(html_dir, f"slide_{index}.html")
        png_file = os.path.join(carousel_dir, f"slide_{index}.png")

        with open(html_file, "w", encoding="utf-8") as f:
            f.write(html_content)

        render_tasks.append((html_file, png_file))
        generated_pngs.append(png_file)

    # Render all slides with Playwright Edge renderer
    print(f"[Generator] Rendering {len(render_tasks)} slides for carousel '{carousel_id}'...")
    render_slides(render_tasks)

    # Save caption & metadata
    caption = carousel_data.get("caption", "")
    with open(os.path.join(carousel_dir, "caption.txt"), "w", encoding="utf-8") as f:
        f.write(caption)

    meta = {
        "id": carousel_id,
        "type": carousel_data.get("type", "fontbravo"),
        "topic": carousel_data.get("topic", ""),
        "keyword": carousel_data.get("keyword", ""),
        "slides_count": total_slides,
        "slide_images": generated_pngs,
        "caption_file": os.path.join(carousel_dir, "caption.txt")
    }

    with open(os.path.join(carousel_dir, "meta.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2, ensure_ascii=False)

    print(f"[Generator] Carousel '{carousel_id}' generated successfully in {carousel_dir}!")
    return meta

if __name__ == "__main__":
    import sys
    from content_calendar import get_day_carousel
    day_num = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    build_carousel(get_day_carousel(day_num))
