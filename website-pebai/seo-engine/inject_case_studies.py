import os

base_dir = r"c:\programacion\emprendimiento\PAI Systems\website-pebai\dist"

cases = {
    "agente-ia-empresas-construccion-reformas": {
        "client_name": "Construcciones Gargom",
        "client_url": "https://gargom.net/",
        "client_category": "CONSTRUCCIÓN Y REFORMAS INTEGRALES",
        "logo": "../clients/construcciones-gargom-logo.png",
        "image": "../clients/construcciones-gargom-casa-brise-soleil.jpg",
        "headline": "Del descontrol en partes de obra al seguimiento operativo en tiempo real.",
        "description": "Construcciones Gargom gestionaba presupuestos dispersos y partes de trabajo diarios en papel, sufriendo retrasos en la facturación y falta de trazabilidad en obra. PEBAI Systems diseñó e implantó un software operativo a medida y un agente de IA que centraliza la captación, filtra presupuestos inviables y consolida los partes diarios sin papel.",
        "tags": [
            "Presupuestos unificados",
            "Partes diarios sin papel",
            "Trazabilidad de costes",
            "ROI < 90 Días"
        ],
        "metric_label": "Impacto Operativo Auditado",
        "metric_val": "-80% tiempo administrativo en presupuestación preliminar",
        "md_summary": """## 2. Caso de Éxito Real en Producción: Construcciones Gargom
- **Cliente:** Construcciones Gargom (Constructora y Reformas Integrales en España).
- **Dominio Verificado:** https://gargom.net/
- **Punto de Partida:** Presupuestos dispersos y partes de trabajo diarios en papel, con retrasos en facturación y falta de trazabilidad en obra.
- **Solución Implantada por PEBAI Systems:** Software operativo a medida y agente de IA para centralizar captación, solicitud guiada de planos/medidas y partes diarios digitalizados a pie de obra.
- **Impacto Cuantitativo:** Reducción del 80% en tiempo administrativo de presupuestación preliminar, 100% trazabilidad de costes y retorno de inversión en menos de 90 días."""
    },
    "agente-ia-distribucion-suministros-b2b": {
        "client_name": "Suministros Santa Cruz",
        "client_url": "https://suministrossantacruz.es/",
        "client_category": "DISTRIBUCIÓN MAYORISTA B2B",
        "logo": "../clients/suministros-santacruz-logo.png",
        "image": "../clients/suministros-santacruz-empresa.png",
        "headline": "Una operativa B2B centralizada para procesar pedidos sin fricción.",
        "description": "Suministros Santa Cruz dependía de procesos manuales y canales dispersos para recibir pedidos de clientes profesionales y talleres. PEBAI Systems implantó un agente de IA multicanal (WhatsApp y portal) sincronizado con su catálogo y tarifas dinámicas, eliminando la transcripción manual de albaranes.",
        "tags": [
            "Pedidos automatizados por WhatsApp",
            "Catálogo B2B dinámico",
            "Sincronización de tarifas",
            "ROI < 90 Días"
        ],
        "metric_label": "Impacto Operativo Auditado",
        "metric_val": "Pedidos validados en < 3 min sin error humano",
        "md_summary": """## 2. Caso de Éxito Real en Producción: Suministros Santa Cruz
- **Cliente:** Suministros Santa Cruz (Distribución Mayorista y Suministros B2B en España).
- **Dominio Verificado:** https://suministrossantacruz.es/
- **Punto de Partida:** Aplicación anticuada y procesos lentos de pedidos que complicaban la gestión de almacén y la atención a clientes profesionales.
- **Solución Implantada por PEBAI Systems:** Modernización integral y agente de IA para toma automatizada de pedidos por WhatsApp, consulta de stock y sincronización directa con tarifas profesionales.
- **Impacto Cuantitativo:** Recepción y validación de pedidos en menos de 3 minutos, cero errores de transcripción manual y amortización de inversión en menos de 90 días."""
    },
    "agente-ia-talleres-automocion-postventa": {
        "client_name": "Fran García Cars",
        "client_url": "https://frangarciacars.com/",
        "client_category": "AUTOMOCIÓN DE IMPORTACIÓN & TALLER",
        "logo": "../clients/fran-garcia-cars-logo.png",
        "image": "../clients/fran-garcia-cars-hero.jpg",
        "headline": "De consultas comerciales perdidas a captación y cualificación 24/7.",
        "description": "Fran García Cars recibía decenas de mensajes diarios fuera de horario comercial pidiendo especificaciones, disponibilidad o citas mecánicas. PEBAI Systems diseñó un asistente con IA que atiende 24/7 en WhatsApp, filtra a los compradores serios y agenda citas de taller y pruebas de conducción automáticamente.",
        "tags": [
            "Cualificación continua 24/7",
            "Agendamiento automático de citas",
            "Triaje técnico de taller",
            "ROI < 60 Días"
        ],
        "metric_label": "Impacto Operativo Auditado",
        "metric_val": "0 consultas perdidas y citas agendadas en 24h",
        "md_summary": """## 2. Caso de Éxito Real en Producción: Fran García Cars
- **Cliente:** Fran García Cars (Concesionario y Postventa de Automoción en España).
- **Dominio Verificado:** https://frangarciacars.com/
- **Punto de Partida:** Cientos de consultas comerciales y de taller por WhatsApp fuera de horario comercial, provocando oportunidades de venta perdidas.
- **Solución Implantada por PEBAI Systems:** Asistente con IA integrado en WhatsApp y web para cualificar compradores, responder sobre especificaciones y agendar citas mecánicas las 24 horas.
- **Impacto Cuantitativo:** Cero clientes desatendidos, aumento del 45% en citas confirmadas de taller y amortización de inversión en menos de 60 días."""
    }
}

def generate_html_spotlight(data):
    tags_html = ""
    for tag in data["tags"]:
        if "ROI" in tag:
            tags_html += f'<span style="font-size:11px; padding:4px 10px; border-radius:6px; background:color-mix(in srgb, var(--accent) 12%, transparent); border:1px solid var(--accent); color:var(--fg); font-weight:600;">{tag}</span>\n            '
        else:
            tags_html += f'<span style="font-size:11px; padding:4px 10px; border-radius:6px; background:var(--surface); border:1px solid var(--line); color:var(--fg);">{tag}</span>\n            '

    return f"""
    <!-- Caso de Éxito en Producción Auditado (Social Proof & Grounding) -->
    <section class="geo-case-spotlight" aria-label="Caso de Éxito en Producción Auditado" style="margin: 40px 0 48px; padding: 32px; border: 1px solid var(--line); border-radius: 18px; background: color-mix(in srgb, var(--surface) 97%, var(--bg));">
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom: 24px; border-bottom: 1px solid var(--line); padding-bottom: 18px;">
        <div style="display:flex; align-items:center; gap:12px;">
          <span class="micro" style="color:var(--accent); font-weight:700; letter-spacing:0.12em; text-transform:uppercase;">CASO REAL EN PRODUCCIÓN · CLIENTE AUDITADO</span>
          <span style="display:inline-flex; align-items:center; gap:6px; font-size:11px; padding:3px 10px; border-radius:20px; background:color-mix(in srgb, var(--accent) 15%, transparent); color:var(--fg); font-weight:600;">
            <span class="tiny-signal"></span> Verificado en Vivo
          </span>
        </div>
        <a href="{data['client_url']}" target="_blank" rel="noopener noreferrer" style="font-size:12px; color:var(--muted); text-decoration:none; display:inline-flex; align-items:center; gap:6px; transition:color .2s;">
          <span>Visitar {data['client_url'].replace('https://', '').rstrip('/')}</span>
          <svg class="arrow-glyph" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M2.5 7.5L7.5 2.5M7.5 2.5H3.5M7.5 2.5V6.5" stroke="currentColor" fill="none"/></svg>
        </a>
      </div>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 28px; align-items: center;">
        <div>
          <div style="display:flex; align-items:center; gap:16px; margin-bottom: 16px;">
            <div style="padding: 10px 16px; border-radius: 10px; background: #ffffff; display: inline-flex; align-items: center; justify-content: center; max-width: 170px;">
              <img src="{data['logo']}" alt="{data['client_name']}" style="max-height: 38px; width: auto; object-fit: contain;">
            </div>
            <div>
              <div style="font-size:16px; font-weight:700; color:var(--fg);">{data['client_name']}</div>
              <div style="font-size:12px; color:var(--muted);">{data['client_category']}</div>
            </div>
          </div>
          <h3 style="font-size: clamp(20px, 2.2vw, 24px); font-weight:600; line-height:1.25; margin:0 0 14px; color:var(--fg);">
            {data['headline']}
          </h3>
          <p style="font-size: 13px; line-height: 1.7; color: var(--muted); margin: 0 0 20px;">
            {data['description']}
          </p>
          <div style="display:flex; flex-wrap:wrap; gap:8px;">
            {tags_html.strip()}
          </div>
        </div>

        <div style="border-radius:14px; overflow:hidden; border:1px solid var(--line); background:var(--surface);">
          <img src="{data['image']}" alt="Proyecto en producción {data['client_name']}" style="width:100%; height:260px; object-fit:cover; display:block;">
          <div style="padding:16px 20px; border-top:1px solid var(--line); background:var(--surface); display:flex; justify-content:space-between; align-items:center;">
            <div>
              <span style="font-size:11px; color:var(--muted); display:block;">{data['metric_label']}</span>
              <strong style="font-size:13px; color:var(--fg);">{data['metric_val']}</strong>
            </div>
            <a href="{data['client_url']}" target="_blank" rel="noopener noreferrer" class="button button-secondary" style="font-size:11px; padding:6px 14px; text-decoration:none; border-radius:20px; border:1px solid var(--line); color:var(--fg);">
              Ver Web Cliente ↗
            </a>
          </div>
        </div>
      </div>
    </section>
"""

def update_landing(slug, data):
    folder = os.path.join(base_dir, slug)
    html_path = os.path.join(folder, "index.html")
    md_path = os.path.join(folder, "index.md")

    if not os.path.exists(html_path):
        print(f"Error: {html_path} does not exist")
        return

    with open(html_path, "r", encoding="utf-8") as f:
        html = f.read()

    # Find section between dossier and knowledge graph
    marker_start = 'class="geo-dossier-panel"'
    idx_dossier = html.find(marker_start)
    if idx_dossier == -1:
        print(f"Error: geo-dossier-panel not found in {slug}")
        return

    idx_close_dossier = html.find("</section>", idx_dossier)
    if idx_close_dossier == -1:
        print(f"Error: closing section of dossier not found in {slug}")
        return

    marker_end = "<!-- Knowledge Graph Grounding"
    idx_kg = html.find(marker_end, idx_close_dossier)
    if idx_kg == -1:
        print(f"Error: knowledge graph marker not found in {slug}")
        return

    # Replace the redundant block with the case spotlight
    new_spotlight = generate_html_spotlight(data)
    new_html = html[:idx_close_dossier + len("</section>")] + "\n\n" + new_spotlight + "\n\n    " + html[idx_kg:]

    with open(html_path, "w", encoding="utf-8") as f:
        f.write(new_html)

    print(f"HTML updated successfully for {slug}")

    # Now update index.md
    if os.path.exists(md_path):
        with open(md_path, "r", encoding="utf-8") as f:
            md = f.read()

        # Check if already has case study
        if "## 2. Caso de Éxito Real en Producción" not in md:
            # Insert before ## 2. Especificaciones de Arquitectura
            if "## 2. Especificaciones de Arquitectura" in md:
                md = md.replace("## 2. Especificaciones de Arquitectura", data["md_summary"] + "\n\n## 3. Especificaciones de Arquitectura")
            else:
                md += "\n\n" + data["md_summary"]

            with open(md_path, "w", encoding="utf-8") as f:
                f.write(md)
            print(f"MD updated successfully for {slug}")
        else:
            print(f"MD already had case study for {slug}")

if __name__ == "__main__":
    for slug, data in cases.items():
        update_landing(slug, data)
