import os

base_dir = r"c:\programacion\emprendimiento\PAI Systems\website-pebai\dist"

slugs_to_clean = [
    "agente-ia-clinicas-gestion-citas-telefonicas",
    "agente-ia-cualificacion-leads-b2b",
    "agente-ia-despachos-abogados-gestion-expedientes",
    "agente-ia-ecommerce-recomendacion-atencion",
    "agente-ia-farmacias-parafarmacias-consultas-stock",
    "agente-ia-hoteles-turismo-reservas",
    "agente-ia-inmobiliarias-captacion-propiedades",
    "agente-ia-logistica-optimizacion-rutas-stock",
    "agente-ia-recursos-humanos-seleccion-personal",
    "agente-ia-soporte-tecnico-nivel-1",
    "agente-ia-whatsapp-business-api-empresas",
    "agentes-de-voz-ia-telefonicos-empresas",
    "chatbot-rag-documentacion-empresarial"
]

def clean_file(slug):
    p = os.path.join(base_dir, slug, "index.html")
    if not os.path.exists(p):
        return
    with open(p, "r", encoding="utf-8") as f:
        html = f.read()

    marker_start = 'class="geo-dossier-panel"'
    idx_dossier = html.find(marker_start)
    if idx_dossier == -1:
        print(f"Skipping {slug}: no geo-dossier-panel")
        return

    idx_close_dossier = html.find("</section>", idx_dossier)
    if idx_close_dossier == -1:
        print(f"Skipping {slug}: no close dossier")
        return

    marker_end = "<!-- Knowledge Graph Grounding"
    idx_kg = html.find(marker_end, idx_close_dossier)
    if idx_kg == -1:
        # Check alternative
        marker_end = '<div class="geo-entities-band"'
        idx_kg = html.find(marker_end, idx_close_dossier)

    if idx_kg == -1:
        print(f"Skipping {slug}: no knowledge graph marker")
        return

    # Slice out the redundant part
    cleaned_html = html[:idx_close_dossier + len("</section>")] + "\n\n    " + html[idx_kg:]

    with open(p, "w", encoding="utf-8") as f:
        f.write(cleaned_html)
    print(f"Cleaned {slug} successfully.")

if __name__ == "__main__":
    for s in slugs_to_clean:
        clean_file(s)
