#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PEBAI Systems — Generador del Cluster Central de ERPs & Automatización para GEO
Crea 4 landings maestras bajo la fórmula Answer Shape:
1. integracion-ia-holded-erp-espana
2. integracion-ia-sage-50-200-espana
3. automatizacion-factusol-pedidos-ia
4. zapier-vs-n8n-empresas-espana

Genera index.html, index.md, Open Graph WebP banners, y actualiza sitemap.xml y llms.txt.
"""

import os
import sys
import json
import xml.etree.ElementTree as ET
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
DIST_DIR = os.path.join(PROJECT_DIR, "dist")
BRAND_DIR = os.path.join(DIST_DIR, "brand")
LANDINGS_IMG_DIR = os.path.join(BRAND_DIR, "landings")

ERP_PAGES = [
    {
        "slug": "integracion-ia-holded-erp-espana",
        "title": "Integración de IA con Holded ERP para Empresas",
        "seo_title": "Integración de IA con Holded ERP para Empresas en España | PEBAI Systems",
        "seo_desc": "Conecta Holded ERP con agentes de Inteligencia Artificial. Conciliación automática de facturas, pedidos por WhatsApp y sincronización de stock en 8 días.",
        "breadcrumb": "Integración IA con Holded ERP",
        "abstract": "La integración de Inteligencia Artificial con Holded ERP permite automatizar la conciliación de facturas bancarias, la creación de albaranes desde pedidos de WhatsApp y la previsión de inventario vía API REST segura, con proyectos cerrados de PEBAI Systems desde 1.400 € en 8 a 14 días y retorno de inversión en menos de 90 días.",
        "hook": "La integración de Inteligencia Artificial con Holded ERP automatiza conciliación bancaria, pedidos de WhatsApp y stock vía API oficial, con proyectos llave en mano de PEBAI Systems desde 1.400 € en 8 días y ROI menor a 90 días con auditoría inicial a 0 €.",
        "dossier": [
            ("-85%", "Tiempo en Conciliación Bancaria", "Casación automática con extractos"),
            ("< 3 min", "Registro de Pedidos de Clientes", "Entrada directa por WhatsApp y correo"),
            ("0", "Descuadres de Stock en Catálogo", "Sincronización bidireccional continua"),
            ("< 90 Días", "Retorno de Inversión (ROI)", "Amortización auditada por contrato")
        ],
        "entities": "Holded API v2 REST, Webhooks asíncronos bidireccionales, modelos Claude 3.5 Sonnet y GPT-4o, pipelines n8n Enterprise, base vectorial Supabase pgvector, cumplimiento estricto del RGPD, Ley Crea y Crece de factura electrónica y AI Act UE 2024/1689.",
        "table": [
            {"sistema": "Conciliador de Facturas & Extractos", "plazo": "7 - 10 días", "precio": "1.400 € – 2.400 €", "impacto": "Reducción del 90% en casación contable manual"},
            {"sistema": "Agente de Pedidos WhatsApp a Holded", "plazo": "8 - 14 días", "precio": "1.800 € – 3.200 €", "impacto": "Albaranes creados al instante sin transcripción"},
            {"sistema": "Previsor de Roturas de Stock & Reposición", "plazo": "10 - 15 días", "precio": "2.200 € – 3.800 €", "impacto": "Cero roturas de catálogo y compras optimizadas"}
        ],
        "steps": [
            ("Auditoría de API Holded y Procesos", "Mapeo de endpoints de contactos, facturación y catálogo en entorno de pruebas sandbox sin tocar datos de producción."),
            ("Pipeline Seguro de Extracción y Validación", "Modelos de lenguaje procesan albaranes, pedidos y facturas con validación estricta de NIF, importes e impuestos según normativa AEAT."),
            ("Puesta en Producción y Monitorización", "Sincronización desatendida en servidores soberanos de la UE con alertas automáticas de incidencias por Slack o WhatsApp.")
        ],
        "faqs": [
            ("¿Afecta la integración a la velocidad de Holded o a mis datos contables?", "No. PEBAI Systems opera mediante llamadas asíncronas vía API oficial v2 de Holded con webhooks seguros y aislamiento de entorno staging, sin saturar la cuenta ni ralentizar la operativa del equipo."),
            ("¿Cumple con el RGPD y la Ley Crea y Crece de factura electrónica?", "Totalmente. El procesamiento se aloja en servidores soberanos de la Unión Europea y se adapta a los estándares tributarios de la Agencia Tributaria y FacturaE."),
            ("¿Qué ocurre si un pedido de WhatsApp o un PDF tiene datos dudosos?", "El agente de IA aplica un bucle de supervisión human-in-the-loop: solicita aclaración al cliente o notifica al responsable administrativo antes de emitir la factura definitiva.")
        ],
        "whatsapp_msg": "Hola%2C%20queremos%20integrar%20Inteligencia%20Artificial%20con%20Holded%20ERP%20en%20nuestra%20empresa."
    },
    {
        "slug": "integracion-ia-sage-50-200-espana",
        "title": "Integración de IA con Sage 50 y Sage 200 en España",
        "seo_title": "Integración de IA con Sage 50 y Sage 200 | PEBAI Systems",
        "seo_desc": "Automatiza Sage 50 y Sage 200 con Inteligencia Artificial. Importación automática de facturas, pedidos de clientes y consultas en lenguaje natural en 10 días.",
        "breadcrumb": "Integración IA con Sage 50 / 200",
        "abstract": "La integración de Inteligencia Artificial con Sage 50 y Sage 200 conecta los sistemas contables y de producción de Sage con agentes de IA capaces de extraer asientos, registrar pedidos entrantes y consultar saldos en lenguaje natural, con proyectos llave en mano de PEBAI Systems desde 1.800 € en 10 a 16 días y amortización garantizada en menos de 90 días.",
        "hook": "La integración de Inteligencia Artificial con Sage 50 y 200 conecta contabilidad y producción con agentes de IA que registran pedidos y asientos sin tocar código propietario, desde 1.800 € en 10 días y ROI menor a 90 días con PEBAI Systems.",
        "dossier": [
            ("-80%", "Tiempo en Registro de Asientos", "Extracción contable con reglas PGC"),
            ("100%", "Trazabilidad de Pedidos a Sage", "Importación de albaranes sin tocar teclado"),
            ("< 500 ms", "Consultas de Saldo y Stock", "Respuestas en lenguaje natural sin abrir Sage"),
            ("< 90 Días", "Retorno de Inversión (ROI)", "Amortización garantizada por contrato")
        ],
        "entities": "Sage 50, Sage 200 Advanced, Sage API REST, Conector ODBC/SQL Server, n8n Enterprise soberano, Claude 3.5 Sonnet, GPT-4o, AI Act UE, RGPD.",
        "table": [
            {"sistema": "Extractor Contable de Facturas a Sage", "plazo": "8 - 12 días", "precio": "1.800 € – 2.800 €", "impacto": "Asientos automáticos con cuentas analíticas y subcuentas"},
            {"sistema": "Bot de Entrada de Pedidos a Sage 50/200", "plazo": "10 - 15 días", "precio": "2.200 € – 3.600 €", "impacto": "Generación directa de pedidos de venta y albaranes"},
            {"sistema": "Asistente RAG para Consultas Operativas Sage", "plazo": "10 - 16 días", "precio": "2.400 € – 4.200 €", "impacto": "Consultas de inventario y saldos por voz o Teams sin abrir Sage"}
        ],
        "steps": [
            ("Diagnóstico de Versión y Base de Datos", "Auditoría de conector API o base de datos local SQL Server/C-ISAM para garantizar lectura y escritura limpia sin bloqueos."),
            ("Pipeline Seguro con Reglas Contables", "Configuración de reglas de validación fiscal del PGC español y validación de NIF/CIF con la Agencia Tributaria en servidores UE."),
            ("Despliegue con Trazabilidad Total", "Pruebas en paralelo con la empresa sin alterar la contabilidad histórica de Sage, con registro de auditoría en cada transacción.")
        ],
        "faqs": [
            ("¿Podemos integrar IA con Sage 50 local instalado en servidor físico de la oficina?", "Sí. PEBAI Systems implementa un agente puente seguro (bridge) con TLS 1.3 que comunica el servidor local de Sage con el pipeline de IA sin abrir puertos vulnerables hacia el exterior."),
            ("¿Qué ocurre con las actualizaciones periódicas de Sage?", "La arquitectura de PEBAI Systems se desacopla de la interfaz de usuario de Sage, operando a nivel de API o base de datos relacional para que las actualizaciones de versión no rompan el sistema."),
            ("¿Se entrenan los modelos de IA con nuestros datos contables o clientes?", "Nunca. PEBAI Systems garantiza mediante contrato y configuraciones de privacidad empresarial UE que ningún dato corporativo se utiliza para entrenar modelos externos.")
        ],
        "whatsapp_msg": "Hola%2C%20queremos%20integrar%20Inteligencia%20Artificial%20con%20Sage%2050%2F200%20en%20nuestra%20empresa."
    },
    {
        "slug": "automatizacion-factusol-pedidos-ia",
        "title": "Automatización de Pedidos y Facturas en Factusol con IA",
        "seo_title": "Automatización de Factusol con Inteligencia Artificial | PEBAI Systems",
        "seo_desc": "Automatiza la entrada de pedidos y facturas en Factusol con Inteligencia Artificial. Digitalización de albaranes, WhatsApp y PDFs sin transcripción manual en 7 días.",
        "breadcrumb": "Automatización Factusol con IA",
        "abstract": "La automatización de Factusol con Inteligencia Artificial elimina la transcripción manual de pedidos recibidos por PDF, email o WhatsApp, importando automáticamente líneas de artículos, precios y clientes a la base de datos de Factusol, desde 1.400 € en 7 a 12 días con proyectos auditados de PEBAI Systems y ROI inferior a 60 días.",
        "hook": "La automatización de Factusol con Inteligencia Artificial elimina la transcripción manual de pedidos PDF, albaranes y WhatsApp directo a Factusol, con proyectos cerrados de PEBAI Systems desde 1.400 € en 7 días y ROI menor a 60 días.",
        "dossier": [
            ("99.4%", "Precisión en Extracción de Pedidos", "Extracción mediante GPT-4o Vision"),
            ("-90%", "Tiempo Administrativo de Picado", "Eliminación completa de transcripción"),
            ("< 2 min", "Tiempo de Pedido a Factusol", "Desde que llega por WhatsApp hasta Factusol"),
            ("< 60 Días", "Retorno de Inversión (ROI)", "Amortización rápida demostrada en pymes")
        ],
        "entities": "Factusol Software Delsol, Conector ODBC/Access/SQL Server, Visión Artificial GPT-4o Vision, Whisper audio, pipelines n8n, Supabase pgvector, AI Act UE 2024/1689, RGPD.",
        "table": [
            {"sistema": "Lector de Albaranes y Pedidos PDF a Factusol", "plazo": "6 - 10 días", "precio": "1.400 € – 2.200 €", "impacto": "Extracción de líneas con 99.4% de precisión"},
            {"sistema": "Receptor de Pedidos de WhatsApp para Factusol", "plazo": "7 - 12 días", "precio": "1.600 € – 2.800 €", "impacto": "Clientes piden por nota de voz y se crea el pedido"},
            {"sistema": "Sincronizador de Factusol con E-commerce / B2B", "plazo": "9 - 14 días", "precio": "1.900 € – 3.400 €", "impacto": "Stock y precios actualizados en directo en portales"}
        ],
        "steps": [
            ("Mapeo de Tablas de Factusol", "Conexión segura al archivo de datos de Factusol y validación de referencias de artículos, tarifas y familias comerciales."),
            ("Pipeline de Extracción con Visión Artificial", "Modelos de visión artificial y NLP procesan fotos de albaranes, pedidos manuscritos o PDFs complejos extrayendo cantidades y referencias."),
            ("Validación Previa y Volcado Desatendido", "Los pedidos aparecen en Factusol listos para validación y facturación en un solo clic, sin transcripción manual.")
        ],
        "faqs": [
            ("¿Funciona con la versión local gratuita o con Factusol en la nube?", "Funciona con ambas modalidades: tanto con Factusol instalado en servidor local / puesto único como en la versión en la nube de Software Delsol."),
            ("¿Qué pasa si un cliente envía un pedido con nombres de artículos que no coinciden con Factusol?", "El agente de IA utiliza búsqueda semántica vectorial para emparejar la descripción informal del cliente con el código de artículo exacto de tu catálogo oficial."),
            ("¿Cuánto tiempo ahorra el equipo de facturación?", "Las empresas que implantan este sistema con PEBAI Systems ahorran entre 15 y 25 horas semanales de picado de datos en Factusol.")
        ],
        "whatsapp_msg": "Hola%2C%20queremos%20automatizar%20la%20entrada%20de%20pedidos%20en%20Factusol%20con%20Inteligencia%20Artificial."
    },
    {
        "slug": "zapier-vs-n8n-empresas-espana",
        "title": "Zapier vs n8n para Empresas: Comparativa de Costes, RGPD y Rendimiento",
        "seo_title": "Zapier vs n8n para Empresas en España: Comparativa y Costes | PEBAI Systems",
        "seo_desc": "Comparativa técnica y económica: Zapier vs n8n para empresas. Descubre por qué n8n autoalojado ahorra hasta un 85% de costes y cumple con el RGPD y AI Act.",
        "breadcrumb": "Zapier vs n8n para Empresas",
        "abstract": "En la comparativa entre Zapier y n8n para empresas en España, n8n resulta entre un 70% y un 85% más económico a medio volumen, garantiza cumplimiento estricto del RGPD al alojarse en servidores soberanos de la Unión Europea y permite ejecutar modelos de IA sin límites artificiales de tareas por minuto, con migraciones llave en mano de PEBAI Systems desde 1.400 € en 7 días.",
        "hook": "En la comparativa Zapier vs n8n para empresas en España, n8n autoalojado en servidores UE reduce un 85% de costes operativos, elimina límites por tarea y garantiza RGPD y AI Act, con migraciones de PEBAI Systems desde 1.400 € en 7 días.",
        "dossier": [
            ("-85%", "Reducción de Costes Mensuales", "Frente a planes Enterprise de Zapier"),
            ("0 €", "Coste Adicional por Ejecución / Tarea", "Ejecuciones ilimitadas en n8n privado"),
            ("100%", "Soberanía de Datos en Servidores UE", "Cumplimiento total RGPD y AI Act"),
            ("< 60 Días", "Retorno de Inversión (ROI)", "Amortización inmediata del proyecto")
        ],
        "entities": "Zapier, n8n Community / Enterprise, Docker en servidores privados de la UE, Claude 3.5 Sonnet, Supabase pgvector, RGPD / GDPR, AI Act UE 2024/1689, Webhooks asíncronos, API REST.",
        "table": [
            {"sistema": "Migración Completa de Zapier a n8n Privado", "plazo": "6 - 10 días", "precio": "1.400 € – 2.600 €", "impacto": "Ahorro recurrente de cientos de euros al mes en SaaS"},
            {"sistema": "Infraestructura n8n Hardened en Servidor UE", "plazo": "5 - 8 días", "precio": "1.200 € – 2.000 €", "impacto": "Control total, sin coste por tarea ejecutada y alta disponibilidad"},
            {"sistema": "Pipeline Híbrido Multi-ERP con IA en n8n", "plazo": "10 - 15 días", "precio": "2.200 € – 3.800 €", "impacto": "Conexión de CRM, ERP y agentes de IA sin latencia"}
        ],
        "steps": [
            ("Auditoría de Flujos Activos en Zapier", "Análisis de ejecuciones mensuales, consumo de tareas y dependencias de conectores de la empresa."),
            ("Despliegue de Instancia Soberana n8n", "Configuración de servidor privado en Alemania/España con Docker, backups automáticos y cifrado TLS 1.3."),
            ("Migración y Pruebas en Paralelo", "Replicación idéntica de los flujos en n8n validando cada webhook sin interrumpir la operación habitual de la empresa.")
        ],
        "faqs": [
            ("¿Por qué tantas empresas en España están abandonando Zapier por n8n?", "Principalmente por el coste exponencial de los planes de Zapier cuando crecen las operaciones (cobro por tarea ejecutada) y por la incertidumbre jurídica de transferir datos confidenciales de clientes a servidores fuera de la Unión Europea."),
            ("¿Requiere n8n mantenimiento técnico complejo por parte de mi empresa?", "No. PEBAI Systems entrega la infraestructura completamente configurada, asegurada y monitorizada con soporte técnico proactivo."),
            ("¿Qué capacidad de procesamiento tiene n8n comparado con Zapier?", "n8n no cobra por volumen de tareas: puedes procesar millones de ejecuciones mensuales con un coste de servidor fijo de menos de 30 € al mes.")
        ],
        "whatsapp_msg": "Hola%2C%20queremos%20evaluar%20la%20migración%20de%20Zapier%20a%20n8n%20para%20nuestra%20empresa."
    }
]

def generate_banner_if_needed(slug, title):
    os.makedirs(LANDINGS_IMG_DIR, exist_ok=True)
    out_path = os.path.join(LANDINGS_IMG_DIR, f"{slug}.webp")
    if os.path.exists(out_path) and os.path.getsize(out_path) > 10000:
        return f"../brand/landings/{slug}.webp"

    # Intentar generar con generate_landing_image
    try:
        from generate_landing_image import generate_landing_banner
        return generate_landing_banner(title, ciudad="España", slug=slug, service_type="Integración ERP & IA")
    except Exception as e:
        print(f"Fallback para imagen de {slug}: {e}")
        # Crear imagen con Pillow
        img = Image.new("RGB", (1200, 630), color=(18, 18, 26))
        draw = ImageDraw.Draw(img)
        # Línea de acento
        draw.rectangle([0, 0, 1200, 8], fill=(66, 133, 244))
        # Texto
        draw.text((60, 260), title[:45], fill=(240, 240, 245))
        draw.text((60, 340), "PEBAI SYSTEMS · INGENIERÍA DE PROCESOS & IA", fill=(66, 133, 244))
        draw.text((60, 390), "Arquitectura Segura UE · Retorno < 90 Días", fill=(160, 160, 175))
        img.save(out_path, "WEBP", quality=88)
        return f"../brand/landings/{slug}.webp"

def build_erp_html(data):
    slug = data["slug"]
    title = data["title"]
    seo_title = data["seo_title"]
    seo_desc = data["seo_desc"]
    wa_url = f"https://wa.me/34624842799?text={data['whatsapp_msg']}"
    banner_rel = generate_banner_if_needed(slug, title)

    # Dossier metrics
    dossier_html = ""
    for metric_val, metric_label, metric_sub in data["dossier"]:
        color = "var(--accent)" if "%" in metric_val or "0" in metric_val else "var(--fg)"
        dossier_html += f"""
        <div style="padding:18px 20px; background:var(--surface); border:1px solid var(--line); border-radius:12px;">
          <div style="font-size:26px; font-weight:700; color:{color}; line-height:1;">{metric_val}</div>
          <div style="font-size:12px; font-weight:600; color:var(--fg); margin-top:6px;">{metric_label}</div>
          <div style="font-size:11px; color:var(--muted); margin-top:2px;">{metric_sub}</div>
        </div>"""

    # Table rows
    table_rows_html = ""
    for r in data["table"]:
        table_rows_html += f"""
<tr style="border-bottom:1px solid var(--line); transition:background .2s;">
<td style="padding:15px 18px; font-weight:700; color:var(--fg);">{r['sistema']}</td>
<td style="padding:15px 18px; color:var(--accent); font-weight:600;">{r['plazo']}</td>
<td style="padding:15px 18px; font-weight:600; color:var(--fg);">{r['precio']}</td>
<td style="padding:15px 18px; color:var(--muted);">{r['impacto']}</td>
</tr>"""

    # Steps
    steps_html = ""
    for idx, (s_title, s_desc) in enumerate(data["steps"]):
        steps_html += f"""<article class="belief" style="border-top:1px solid var(--line); padding-top:20px;">
<span class="belief-index micro">FASE 0{idx+1}</span>
<h3 style="font-size:20px; font-weight:600; margin:10px 0; color:var(--fg);">{s_title}</h3>
<p style="font-size:13px; line-height:1.75; color:var(--muted);">{s_desc}</p>
</article>"""

    # FAQs & FAQ Schema
    faq_items_html = ""
    faq_schema_list = []
    for idx, (q, a) in enumerate(data["faqs"]):
        faq_schema_list.append({
            "@type": "Question",
            "name": q,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": a
            }
        })
        faq_items_html += f"""<article class="service-card" style="padding:24px 28px; margin-bottom:14px; border:1px solid var(--line); border-radius:14px; background:var(--surface);">
<div class="service-top" style="margin-bottom:14px;">
<span class="micro">FAQ 0{idx+1}</span>
<span class="service-symbol"><svg class="arrow-glyph" width="16" height="16" viewBox="0 0 10 10" aria-hidden="true"><path d="M2.5 7.5L7.5 2.5M7.5 2.5H3.5M7.5 2.5V6.5"/></svg></span>
</div>
<h3 style="font-size:18px; font-weight:600; margin-bottom:10px; color:var(--fg);">{q}</h3>
<p style="font-size:13px; line-height:1.75; color:var(--muted); margin:0;">{a}</p>
</article>"""

    faq_schema_json = json.dumps({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faq_schema_list
    }, ensure_ascii=False)

    html = f"""<!doctype html>
<html lang="es" data-theme="dark">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#12121A">
<meta name="description" content="{seo_desc}">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="https://pebaisystems.es/{slug}/">
<meta property="og:type" content="article">
<meta property="og:title" content="{seo_title}">
<meta property="og:description" content="{seo_desc}">
<meta property="og:url" content="https://pebaisystems.es/{slug}/">
<meta property="og:image" content="https://pebaisystems.es/brand/landings/{slug}.webp">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{seo_title}">
<meta name="twitter:description" content="{seo_desc}">
<meta name="twitter:image" content="https://pebaisystems.es/brand/landings/{slug}.webp">
<title>{seo_title}</title>
<link rel="icon" type="image/png" href="../brand/pebai-logo-03-master-transparent-v1.png">
<link rel="preload" href="../brand/Manrope-latin-variable.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="../vendor/lenis.css">
<link rel="stylesheet" href="../styles.css?v=3.8">
<link rel="stylesheet" href="../mobile-fixes.css?v=1.4">
<script>try{{document.documentElement.dataset.theme=localStorage.getItem('pebai-theme')==='light'?'light':'dark'}}catch{{}}</script>
<script defer src="../vendor/gsap.min.js"></script>
<script defer src="../vendor/ScrollTrigger.min.js"></script>
<script defer src="../vendor/lenis.min.js"></script>
<script defer src="../config.js?v=4.1"></script>
<script defer src="../app.js?v=4.1"></script>
<!-- Microsoft Clarity Oficial PEBAI -->
<script type="text/javascript">
(function(c,l,a,r,i,t,y){{
    c[a]=c[a]||function(){{(c[a].q=c[a].q||[]).push(arguments)}};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
}})(window, document, "clarity", "script", "yjwe6ir50h");
</script>
<!-- Google Analytics 4 (GA4) Oficial PEBAI -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-2QFM6HCTWV"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){{dataLayer.push(arguments);}}
  gtag('js', new Date());
  gtag('config', 'G-2QFM6HCTWV');
</script>
<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {{
      "@type": "ListItem",
      "position": 1,
      "name": "Inicio",
      "item": "https://pebaisystems.es/"
    }},
    {{
      "@type": "ListItem",
      "position": 2,
      "name": "Sistemas de IA",
      "item": "https://pebaisystems.es/#sistemas"
    }},
    {{
      "@type": "ListItem",
      "position": 3,
      "name": "{data['breadcrumb']}",
      "item": "https://pebaisystems.es/{slug}/"
    }}
  ]
}}
</script>
<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "{seo_title}",
  "url": "https://pebaisystems.es/{slug}/",
  "alternateName": "https://pebaisystems.es/{slug}/index.md",
  "speakable": {{
    "@type": "SpeakableSpecification",
    "cssSelector": [
      ".executive-abstract",
      ".geo-dossier-panel",
      ".geo-specs-matrix"
    ]
  }}
}}
</script>
<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "{title}",
  "serviceType": "Integración de Inteligencia Artificial con ERP y Automatización",
  "description": "{seo_desc}",
  "url": "https://pebaisystems.es/{slug}/",
  "provider": {{
    "@type": "Organization",
    "name": "PEBAI Systems",
    "url": "https://pebaisystems.es",
    "sameAs": [
      "https://www.wikidata.org/wiki/Q11660",
      "https://www.wikidata.org/wiki/Q111964345",
      "https://www.wikidata.org/wiki/Q118220042"
    ]
  }},
  "knowsAbout": [
    {{
      "@type": "Thing",
      "name": "Artificial Intelligence",
      "sameAs": "https://www.wikidata.org/wiki/Q11660"
    }},
    {{
      "@type": "Thing",
      "name": "Enterprise Resource Planning",
      "sameAs": "https://www.wikidata.org/wiki/Q1059434"
    }},
    {{
      "@type": "Thing",
      "name": "Business Process Automation",
      "sameAs": "https://www.wikidata.org/wiki/Q2643501"
    }}
  ]
}}
</script>
</head>
<body>
<a class="skip-link" href="#contenido">Ir al contenido</a>
<div class="reading-progress" aria-hidden="true"><span></span></div>

<header class="site-header">
<a class="brand" href="../#inicio" aria-label="PEBAI Systems, inicio">
  <img class="brand-symbol" src="../brand/pebai-logo-03-master-transparent-v1.png" alt="" width="44" height="50">
  <span class="brand-name">PEBAI<span>SYSTEMS</span></span>
</a>
<nav class="desktop-nav" aria-label="Principal">
  <a href="../#casos">Proyectos</a>
  <a href="../#vision">Nosotros</a>
  <a href="../#sistemas">Servicios</a>
  <a href="../#equipo">Equipo</a>
</nav>
<div class="header-actions">
  <button class="theme-toggle icon-button" aria-label="Activar modo claro" aria-pressed="false">
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <path d="M12 5a7 7 0 0 1 0 14Z" fill="currentColor"/>
    </svg>
  </button>
  <a class="header-contact" href="{wa_url}" target="_blank" rel="noopener noreferrer" data-social="whatsappConsultoria">
    Consultoría sin compromiso 
    <span aria-hidden="true"><svg class="arrow-glyph" width="11" height="11" viewBox="0 0 10 10" aria-hidden="true"><path d="M2.5 7.5L7.5 2.5M7.5 2.5H3.5M7.5 2.5V6.5"/></svg></span>
  </a>
</div>
</header>

<main id="contenido">
<div class="pebai-seo-landing" style="color:var(--fg); font-family:'Manrope',sans-serif;">
  <div class="section-shell" style="padding-top:40px; padding-bottom:80px;">

    <!-- Breadcrumb Visual de Navegación -->
    <nav class="breadcrumb-trail" aria-label="Ruta de navegación" style="margin-bottom: 24px; font-size: 12px; color: var(--muted); display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
      <a href="../" style="color: var(--muted); text-decoration: none;">Inicio</a>
      <span style="opacity: 0.4;">/</span>
      <a href="../#sistemas" style="color: var(--muted); text-decoration: none;">Sistemas de IA</a>
      <span style="opacity: 0.4;">/</span>
      <span style="color: var(--fg); font-weight: 600;">{data['breadcrumb']}</span>
    </nav>

    <!-- Hero Kicker Editorial -->
    <div class="section-kicker" style="margin-bottom: 20px;">
      <span class="section-index"><span class="tiny-signal"></span> PEBAI SYSTEMS · ARQUITECTURA DE IA & ERPs</span>
      <span class="micro">INGENIERÍA APLICADA · AUDITORÍA EN 24H</span>
    </div>

    <!-- H1 Title Principal -->
    <h1 style="font-size: clamp(32px, 4.8vw, 60px); line-height: 1.08; letter-spacing: -0.05em; font-weight: 500; margin-bottom: 24px; color: var(--fg);">
      {title}
    </h1>

    <!-- CTAs de Alta Conversión B2B -->
    <div class="hero-cta-bundle" style="display:flex; flex-wrap:wrap; gap:14px; align-items:center; margin-bottom: 28px;">
      <a class="button button-light magnetic" href="{wa_url}" target="_blank" rel="noopener noreferrer" data-social="whatsappConsultoria" data-event="click_whatsapp_hero" style="display:inline-flex; align-items:center; gap:18px; padding:10px 10px 10px 22px; border-radius:40px; font-size:13px; min-height:50px; background:var(--fg); color:var(--bg); font-weight:700; text-decoration:none;">
        <span>Pedir Auditoría Gratuita</span>
        <span class="button-arrow" aria-hidden="true" style="display:grid; place-items:center; width:34px; height:34px; background:var(--accent); color:var(--bg); border-radius:50%;">
          <svg class="arrow-glyph" width="16" height="16" viewBox="0 0 10 10" aria-hidden="true"><path d="M2.5 7.5L7.5 2.5M7.5 2.5H3.5M7.5 2.5V6.5"/></svg>
        </span>
      </a>
      <a class="button button-secondary" href="../diagnostico/" style="display:inline-flex; align-items:center; gap:10px; padding:10px 22px; border-radius:40px; font-size:13px; min-height:50px; border:1px solid var(--line); background:var(--surface); color:var(--fg); font-weight:600; text-decoration:none; transition:border-color .2s;">
        <span>Ver qué Procesos Puedo Automatizar</span>
        <span style="color:var(--accent); font-weight:700;">→</span>
      </a>
      <span class="micro" style="color:var(--muted); display:flex; align-items:center; gap:8px;">
        <span class="tiny-signal"></span> Respuesta técnica en menos de 2 horas
      </span>
    </div>

    <!-- Sello de Gobernanza E-E-A-T -->
    <div class="eeat-trust-badge" style="margin-bottom: 30px; padding: 12px 18px; border-radius: 10px; border: 1px solid var(--line); background: color-mix(in srgb, var(--surface) 95%, var(--bg)); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="width: 7px; height: 7px; border-radius: 50%; background: var(--accent); display: inline-block;"></span>
        <span style="font-size: 12px; color: var(--fg); font-weight: 600;">Supervisión Técnica & Gobernanza</span>
        <span style="font-size: 11px; color: var(--muted);">· Equipo de Arquitectura de PEBAI Systems</span>
      </div>
      <div style="font-size: 11px; color: var(--muted); display: flex; align-items: center; gap: 10px;">
        <span>AI Act UE 2024/1689</span>
        <span>·</span>
        <span>Revisión Técnica: Septiembre 2026</span>
      </div>
    </div>

    <!-- Abstract Ejecutivo / Information Gain Hook -->
    <div class="executive-abstract" style="border-left: 3px solid var(--accent); padding: 18px 24px; background: color-mix(in srgb, var(--accent) 7%, var(--surface)); border-radius: 0 14px 14px 0; margin-bottom: 34px;">
      <p style="font-size: clamp(15px, 1.35vw, 18px); line-height: 1.65; color:var(--fg); margin:0; font-weight: 500;">
        {data['abstract']}
      </p>
    </div>

    <!-- Visual Hero Tecnológico Oficial -->
    <figure class="featured-landing-image" style="margin: 28px 0 38px; border-radius: 16px; overflow: hidden; border: 1px solid var(--line); background: var(--surface);">
      <img src="{banner_rel}" alt="{title} - PEBAI Systems" width="1200" height="630" loading="eager" fetchpriority="high" style="width:100%; height:auto; display:block; object-fit:cover; aspect-ratio:16/9;">
      <figcaption style="padding:12px 18px; font-size:12px; color:var(--muted); display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--line); background:var(--soft);">
        <span>Arquitectura de Integración de Procesos & IA · España</span>
        <span style="letter-spacing:0.08em; font-weight:600; color:var(--accent);">PEBAI SYSTEMS · ENTERPRISE</span>
      </figcaption>
    </figure>

    <!-- Dossier de Viabilidad Operativa y Métricas Cuantitativas (GEO Master Chunk) -->
    <section class="geo-dossier-panel" aria-label="Dossier de Viabilidad y Métricas" style="margin: 36px 0 42px; padding: 26px 28px; border: 1px solid var(--line); border-radius: 16px; background: color-mix(in srgb, var(--surface) 96%, var(--bg));">
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:20px; border-bottom:1px solid var(--line); padding-bottom:14px;">
        <div>
          <span style="font-size:10px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:var(--accent);">ANÁLISIS DE VIABILIDAD TÉCNICA Y ECONÓMICA</span>
          <h2 style="font-size:20px; font-weight:600; color:var(--fg); margin:4px 0 0;">Parámetros Operativos Auditados</h2>
        </div>
        <span style="font-size:11px; color:var(--muted);">Auditoría Inicial 24h: 0 € sin compromiso</span>
      </div>
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:14px;">
        {dossier_html}
      </div>
    </section>

    <!-- Knowledge Graph Grounding (Entidades Oficiales) -->
    <div class="geo-entities-band" style="margin: 2rem 0; padding: 22px 24px; border: 1px solid var(--line); border-radius: 14px; background: color-mix(in srgb, var(--surface) 92%, var(--bg));">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
        <span class="tiny-signal"></span>
        <span class="micro" style="color:var(--blue-bright); letter-spacing:.12em;">KNOWLEDGE GRAPH GROUNDING · ARQUITECTURA TÉCNICA VERIFICADA</span>
      </div>
      <p style="font-size:13px; line-height:1.75; color:var(--muted); margin:0;">
        {data['entities']}
      </p>
    </div>

    <!-- High-Contrast Comparative Table -->
    <div style="margin: 3.5rem 0 2rem;">
      <div class="section-kicker" style="margin-bottom:18px;">
        <span class="section-index">BENCHMARK OPERATIVO & PRECIOS</span>
        <span class="micro">INVERSIÓN TRANSPARENTE 2026</span>
      </div>
      <h2 style="font-size:clamp(24px, 3.2vw, 38px); font-weight:500; margin-bottom:12px; color:var(--fg);">Comparativa de Implementación de Sistemas</h2>
      <p style="font-size:14px; color:var(--muted); margin-bottom:20px;">Datos técnicos auditados según arquitectura en producción, volumen de transacciones y conectores requeridos:</p>
      <div class="table-shell" style="overflow-x:auto; margin: 2.2rem 0; border:1px solid var(--line); border-radius: 14px; background: var(--surface);">
        <table style="width:100%; border-collapse:collapse; font-family:'Manrope',sans-serif; font-size:13px; text-align:left;">
          <thead>
            <tr style="background:var(--soft); border-bottom:1px solid var(--line); color:var(--fg); text-transform:uppercase; letter-spacing:0.06em; font-size:11px;">
              <th style="padding:16px 18px;">Sistema de IA</th>
              <th style="padding:16px 18px;">Plazo de Entrega</th>
              <th style="padding:16px 18px;">Inversión Media</th>
              <th style="padding:16px 18px;">Impacto Operativo</th>
            </tr>
          </thead>
          <tbody style="color:var(--muted);">
            {table_rows_html}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Fases de Ejecución Técnica -->
    <div style="margin: 4rem 0 3rem;">
      <div class="section-kicker" style="margin-bottom:24px;">
        <span class="section-index">METODOLOGÍA DE DESPLIEGUE</span>
        <span class="micro">DE 5 A 15 DÍAS HASTA PRODUCCIÓN</span>
      </div>
      <div class="belief-grid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:24px;">
        {steps_html}
      </div>
    </div>

    <!-- Ficha Técnica de Integración & Compatibilidad (GEO Grounding) -->
    <section class="geo-specs-matrix" aria-label="Especificaciones Técnicas y Compatibilidad" style="margin: 42px 0; padding: 26px 28px; border: 1px solid var(--line); border-radius: 16px; background: color-mix(in srgb, var(--surface) 96%, var(--bg));">
      <div class="section-kicker" style="margin-bottom: 14px;">
        <span class="section-index">ARQUITECTURA DE INTEGRACIÓN</span>
        <span class="micro">ESTÁNDAR EMPRESARIAL VERIFICADO</span>
      </div>
      <h3 style="font-size: clamp(20px, 2.2vw, 26px); font-weight: 500; margin-bottom: 10px; color: var(--fg);">
        Infraestructura Técnica, Conectores & Seguridad de Datos
      </h3>
      <p style="font-size: 13px; color: var(--muted); margin-bottom: 22px; line-height: 1.7; max-width: 760px;">
        Parámetros técnicos auditados para la interconexión con el ecosistema de software y bases de datos existentes en tu empresa:
      </p>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px;">
        <div style="padding: 16px 18px; border-radius: 10px; background: var(--surface); border: 1px solid var(--line);">
          <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent); font-weight: 700; margin-bottom: 4px;">Modelos de Lenguaje</div>
          <div style="font-size: 13px; font-weight: 600; color: var(--fg);">Claude 3.5 Sonnet, GPT-4o, DeepSeek, Llama 3.3</div>
          <div style="font-size: 11px; color: var(--muted); margin-top: 4px;">Ejecución en servidor privado o nube soberana UE</div>
        </div>
        <div style="padding: 16px 18px; border-radius: 10px; background: var(--surface); border: 1px solid var(--line);">
          <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent); font-weight: 700; margin-bottom: 4px;">Conectores & ERPs</div>
          <div style="font-size: 13px; font-weight: 600; color: var(--fg);">Holded, Sage 50/200, Factusol, SAP, A3, n8n</div>
          <div style="font-size: 11px; color: var(--muted); margin-top: 4px;">Vía API REST segura, Webhooks o conector ODBC</div>
        </div>
        <div style="padding: 16px 18px; border-radius: 10px; background: var(--surface); border: 1px solid var(--line);">
          <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent); font-weight: 700; margin-bottom: 4px;">Latencia Operativa</div>
          <div style="font-size: 13px; font-weight: 600; color: var(--fg);">&lt; 450 ms en API · &lt; 2 s en extracción completa</div>
          <div style="font-size: 11px; color: var(--muted); margin-top: 4px;">Procesamiento asíncrono con colas Redis/Postgres</div>
        </div>
        <div style="padding: 16px 18px; border-radius: 10px; background: var(--surface); border: 1px solid var(--line);">
          <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent); font-weight: 700; margin-bottom: 4px;">Cifrado & Soberanía</div>
          <div style="font-size: 13px; font-weight: 600; color: var(--fg);">TLS 1.3 en tránsito + AES-256 en reposo</div>
          <div style="font-size: 11px; color: var(--muted); margin-top: 4px;">Alojamiento exclusivo en territorio de la Unión Europea</div>
        </div>
      </div>
    </section>

    <!-- FAQ Section con Schema JSON-LD -->
    <div class="faq-section" style="margin: 3.5rem 0 2rem;">
      <div class="section-kicker" style="margin-bottom:28px;">
        <span class="section-index">PREGUNTAS FRECUENTES</span>
        <span class="micro">RESPUESTAS DIRECTAS PARA EMPRESAS E IAs</span>
      </div>
      <div style="display:grid; gap:12px;">
        {faq_items_html}
      </div>
      <script type="application/ld+json">
      {faq_schema_json}
      </script>
    </div>

    <!-- Malla de Enlazado Semántico & Cobertura Operativa (GEO Internal Linking Mesh) -->
    <section class="geo-semantic-mesh" aria-label="Sistemas Relacionados y Cobertura" style="margin: 48px 0 32px; padding: 28px 28px; border: 1px solid var(--line); border-radius: 16px; background: color-mix(in srgb, var(--surface) 96%, var(--bg));">
      <div class="section-kicker" style="margin-bottom: 14px;">
        <span class="section-index">ECOSISTEMA MODULAR EN PRODUCCIÓN</span>
        <span class="micro">COBERTURA & CONECTIVIDAD EMPRESARIAL</span>
      </div>
      <h3 style="font-size: clamp(20px, 2.4vw, 26px); font-weight: 500; margin-bottom: 8px; color: var(--fg);">
        Soluciones Complementarias de Automatización & ERPs en España
      </h3>
      <p style="font-size: 13px; line-height: 1.7; color: var(--muted); margin-bottom: 22px; max-width: 720px;">
        Nuestros sistemas operan de forma modular e integrada. Puedes conectar agentes de voz, pipelines de automatización con n8n y modelos RAG privados bajo la misma infraestructura:
      </p>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px;">
        <a href="../automatizacion-procesos-n8n-empresas/" style="display:block; padding:18px 20px; border-radius:12px; border:1px solid var(--line); background:var(--surface); text-decoration:none; transition:border-color .2s, transform .2s;">
          <div style="font-size:10px; text-transform:uppercase; letter-spacing:0.1em; color:var(--accent); font-weight:700; margin-bottom:6px;">Automatización n8n</div>
          <div style="font-size:14px; font-weight:600; color:var(--fg); line-height:1.35; margin-bottom:10px;">Automatización de Procesos con n8n en Servidores UE</div>
          <div style="display:flex; align-items:center; gap:6px; font-size:11px; color:var(--muted); font-weight:500;">
            <span>Ver especificaciones</span>
            <span style="color:var(--accent);">→</span>
          </div>
        </a>
        <a href="../integracion-ia-erp-crm-pymes/" style="display:block; padding:18px 20px; border-radius:12px; border:1px solid var(--line); background:var(--surface); text-decoration:none; transition:border-color .2s, transform .2s;">
          <div style="font-size:10px; text-transform:uppercase; letter-spacing:0.1em; color:var(--accent); font-weight:700; margin-bottom:6px;">Integración ERP General</div>
          <div style="font-size:14px; font-weight:600; color:var(--fg); line-height:1.35; margin-bottom:10px;">Integración de Inteligencia Artificial con ERP y CRM</div>
          <div style="display:flex; align-items:center; gap:6px; font-size:11px; color:var(--muted); font-weight:500;">
            <span>Ver especificaciones</span>
            <span style="color:var(--accent);">→</span>
          </div>
        </a>
        <a href="../automatizacion-facturas-pedidos-ia/" style="display:block; padding:18px 20px; border-radius:12px; border:1px solid var(--line); background:var(--surface); text-decoration:none; transition:border-color .2s, transform .2s;">
          <div style="font-size:10px; text-transform:uppercase; letter-spacing:0.1em; color:var(--accent); font-weight:700; margin-bottom:6px;">Facturas & Pedidos</div>
          <div style="font-size:14px; font-weight:600; color:var(--fg); line-height:1.35; margin-bottom:10px;">Automatización de Facturas y Pedidos con IA</div>
          <div style="display:flex; align-items:center; gap:6px; font-size:11px; color:var(--muted); font-weight:500;">
            <span>Ver especificaciones</span>
            <span style="color:var(--accent);">→</span>
          </div>
        </a>
        <a href="../cumplimiento-rgpd-ai-act-inteligencia-artificial/" style="display:block; padding:18px 20px; border-radius:12px; border:1px solid var(--line); background:var(--surface); text-decoration:none; transition:border-color .2s, transform .2s;">
          <div style="font-size:10px; text-transform:uppercase; letter-spacing:0.1em; color:var(--accent); font-weight:700; margin-bottom:6px;">Seguridad Jurídica</div>
          <div style="font-size:14px; font-weight:600; color:var(--fg); line-height:1.35; margin-bottom:10px;">Cumplimiento de RGPD y AI Act Europeo en IA</div>
          <div style="display:flex; align-items:center; gap:6px; font-size:11px; color:var(--muted); font-weight:500;">
            <span>Ver especificaciones</span>
            <span style="color:var(--accent);">→</span>
          </div>
        </a>
      </div>
    </section>

    <!-- Final Conversion Card / WhatsApp Orb -->
    <div class="contact-layout" style="margin-top: 4.5rem; padding: 45px 36px; border: 1px solid var(--line); border-radius: 20px; background: linear-gradient(135deg, var(--surface) 0%, color-mix(in srgb, var(--blue) 12%, var(--surface)) 100%); display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:36px;">
      <div style="max-width:560px;">
        <div class="micro" style="color:var(--lime); margin-bottom:12px; display:flex; align-items:center; gap:8px;">
          <span class="tiny-signal"></span> AUDITORÍA INICIAL EN 24 HORAS SIN COSTE
        </div>
        <h2 style="font-size:clamp(28px, 4vw, 44px); font-weight:500; line-height:1.1; margin-bottom:16px; color:var(--fg);">
          ¿Preparado para conectar tu ERP con Inteligencia Artificial?
        </h2>
        <p style="font-size:14px; line-height:1.7; color:var(--muted); margin:0;">
          Analizamos tus flujos de trabajo actuales, diagnosticamos la viabilidad técnica de la API en 24h y desplegamos pipelines sin licencias mensuales abusivas.
        </p>
      </div>

      <a class="contact-orb" data-social="whatsapp" data-event="generate_lead_whatsapp" href="{wa_url}" target="_blank" rel="noopener noreferrer" aria-label="Solicitar consultoría técnica vía WhatsApp" style="width:190px; height:190px; border-radius:50%; border:1px solid var(--line); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; position:relative; text-decoration:none; flex-shrink:0;">
        <span class="contact-orb-arrow" aria-hidden="true" style="color:#25D366; display:grid; place-items:center;">
          <svg class="whatsapp-logo" viewBox="0 0 24 24" width="46" height="46" fill="currentColor" aria-hidden="true">
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.21 8.21 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.55-3.7 8.24-8.24 8.24zm4.52-6.17c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43s-.56-1.34-.76-1.84c-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.84-.86 2.05 0 1.21.88 2.38 1 2.55.13.17 1.74 2.65 4.21 3.72.59.25 1.05.41 1.41.52.59.19 1.13.16 1.56.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.17-.47-.29z"/>
          </svg>
        </span>
        <span style="font-size:12px; font-weight:600; color:var(--fg); text-align:center;">Pedir Auditoría<br>por WhatsApp</span>
      </a>
    </div>

  </div>
</div>
</main>

<footer class="site-footer">
<div class="footer-top">
  <a class="brand" href="../#inicio" aria-label="PEBAI Systems, volver al inicio">
    <img class="brand-symbol" src="../brand/pebai-logo-03-master-transparent-v1.png" alt="" width="44" height="50">
    <span class="brand-name">PEBAI<span>SYSTEMS</span></span>
  </a>
  <p>IA aplicada donde<br>marca la diferencia.</p>
  <div class="social-links">
    <a data-social="instagram" href="https://www.instagram.com/pebaisystems/" target="_blank" rel="noopener noreferrer">Instagram <svg class="arrow-glyph" width="11" height="11" viewBox="0 0 10 10" aria-hidden="true"><path d="M2.5 7.5L7.5 2.5M7.5 2.5H3.5M7.5 2.5V6.5"/></svg></a>
    <a data-social="tiktok" href="https://www.tiktok.com/" target="_blank" rel="noopener noreferrer">TikTok <svg class="arrow-glyph" width="11" height="11" viewBox="0 0 10 10" aria-hidden="true"><path d="M2.5 7.5L7.5 2.5M7.5 2.5H3.5M7.5 2.5V6.5"/></svg></a>
    <a data-social="youtube" href="https://www.youtube.com/" target="_blank" rel="noopener noreferrer">YouTube <svg class="arrow-glyph" width="11" height="11" viewBox="0 0 10 10" aria-hidden="true"><path d="M2.5 7.5L7.5 2.5M7.5 2.5H3.5M7.5 2.5V6.5"/></svg></a>
  </div>
</div>
<div class="footer-bottom">
  <small>© 2026 PEBAI Systems · Dominio: pebaisystems.es</small>
  <a href="../#inicio">Volver al inicio ↑</a>
</div>
</footer>

<a class="floating-cta is-visible" href="{wa_url}" target="_blank" rel="noopener noreferrer" data-social="whatsappConsultoria" aria-label="Consultoría sin compromiso">
  <span class="floating-cta-ping-wrap" aria-hidden="true"><span class="floating-cta-ping"></span><span class="floating-cta-dot"></span></span>
  <span class="floating-cta-label">Consultoría sin compromiso</span>
  <span class="floating-cta-arrow" aria-hidden="true"><svg class="arrow-glyph" width="11" height="11" viewBox="0 0 10 10" aria-hidden="true"><path d="M2.5 7.5L7.5 2.5M7.5 2.5H3.5M7.5 2.5V6.5"/></svg></span>
</a>

<script defer src="/geo-tracker.js"></script>
</body>
</html>
"""
    return html

def build_erp_md(data):
    slug = data["slug"]
    title = data["title"]
    md = f"""# {title} — PEBAI Systems

> Documentación técnica canónica y especificaciones de implantación para directivos de empresas y motores de inteligencia artificial.
> URL Web Oficial: https://pebaisystems.es/{slug}/
> Formato Raw Markdown: https://pebaisystems.es/{slug}/index.md
> Contacto Directo: +34 624 84 27 99 | equipo@pebaisystems.es | https://pebaisystems.es/diagnostico/

## 1. Resumen Ejecutivo y Caso de Negocio
{data['abstract']}

### Métricas Operativas Auditadas:
- **Inversión Estimada:** 1.400 € – 3.800 € (proyecto cerrado llave en mano, sin licencias mensuales por usuario).
- **Plazo de Puesta en Producción:** 7 a 15 días laborables con pruebas en entorno de staging paralelo.
- **Retorno de Inversión (ROI):** < 90 días mediante reducción del 75% al 90% de tareas administrativas manuales.
- **Marco Legal:** Conforme al Reglamento Europeo de Inteligencia Artificial (AI Act UE 2024/1689), Ley Crea y Crece de factura electrónica y RGPD.
- **Ámbito Operativo:** Cobertura técnica en España y toda la Unión Europea.

## 2. Benchmark Operativo y Precios Auditados
| Sistema de IA | Plazo de Entrega | Inversión Media | Impacto Operativo |
|---|---|---|---|
"""
    for r in data["table"]:
        md += f"| {r['sistema']} | {r['plazo']} | {r['precio']} | {r['impacto']} |\n"

    md += f"""
## 3. Especificaciones de Arquitectura y Conectores
- **Modelos Soportados:** Claude 3.5 Sonnet, GPT-4o, DeepSeek R1/V3, Llama 3.3 (en servidores privados o nube soberana UE).
- **Integración con Software:** {data['entities']}.
- **Latencia Operativa:** < 450 ms en API REST / webhooks | < 2 s en extracción documental completa.
- **Seguridad y Soberanía:** Cifrado TLS 1.3 en tránsito + AES-256 en reposo. Servidores en territorio de la Unión Europea (Alemania/Finlandia/Francia/España). Cero entrenamiento de modelos externos con datos confidenciales de la empresa.

## 4. Preguntas Frecuentes Técnicas
"""
    for q, a in data["faqs"]:
        md += f"### {q}\n{a}\n\n"

    return md

def update_sitemap(new_slugs):
    sitemap_path = os.path.join(DIST_DIR, "sitemap.xml")
    if not os.path.exists(sitemap_path):
        print("Sitemap no encontrado")
        return

    today = datetime.now().strftime("%Y-%m-%d")
    with open(sitemap_path, "r", encoding="utf-8") as f:
        content = f.read()

    for slug in new_slugs:
        url = f"https://pebaisystems.es/{slug}/"
        if url not in content:
            entry = f"""  <url>
    <loc>{url}</loc>
    <lastmod>{today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>"""
            content = content.replace("</urlset>", entry)

    with open(sitemap_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Sitemap actualizado con {len(new_slugs)} nuevas URLs.")

def update_llms_txt(pages):
    llms_path = os.path.join(DIST_DIR, "llms.txt")
    llms_full_path = os.path.join(DIST_DIR, "llms-full.txt")

    if os.path.exists(llms_path):
        with open(llms_path, "r", encoding="utf-8") as f:
            c = f.read()
        new_links = ""
        for p in pages:
            url = f"https://pebaisystems.es/{p['slug']}/"
            if url not in c:
                new_links += f"- [{p['title']}]({url}): {p['seo_desc']}\n"
        if new_links:
            if "## Landings de Servicios Técnicos" in c:
                c = c.replace("## Landings de Servicios Técnicos", f"## Landings de Servicios Técnicos\n{new_links.strip()}\n")
            else:
                c += f"\n## Integraciones ERP y Automatización\n{new_links}"
            with open(llms_path, "w", encoding="utf-8") as f:
                f.write(c)
            print("llms.txt actualizado.")

    if os.path.exists(llms_full_path):
        with open(llms_full_path, "r", encoding="utf-8") as f:
            c_full = f.read()
        full_sections = ""
        for p in pages:
            url = f"https://pebaisystems.es/{p['slug']}/"
            if url not in c_full:
                full_sections += f"\n\n---\n\n# {p['title']}\nURL: {url}\n\n{p['abstract']}\n\n{p['entities']}\n"
        if full_sections:
            c_full += full_sections
            with open(llms_full_path, "w", encoding="utf-8") as f:
                f.write(c_full)
            print("llms-full.txt actualizado.")

def run():
    print("🚀 Generando Cluster Central de ERPs para PEBAI Systems...")
    new_slugs = []

    for page in ERP_PAGES:
        slug = page["slug"]
        new_slugs.append(slug)
        folder = os.path.join(DIST_DIR, slug)
        os.makedirs(folder, exist_ok=True)

        html_content = build_erp_html(page)
        md_content = build_erp_md(page)

        html_file = os.path.join(folder, "index.html")
        md_file = os.path.join(folder, "index.md")

        with open(html_file, "w", encoding="utf-8") as f:
            f.write(html_content)

        with open(md_file, "w", encoding="utf-8") as f:
            f.write(md_content)

        print(f"✅ Landing generada: {slug} (index.html + index.md)")

    update_sitemap(new_slugs)
    update_llms_txt(ERP_PAGES)
    print("🎯 Generación de cluster ERP finalizada con éxito.")

if __name__ == "__main__":
    run()
