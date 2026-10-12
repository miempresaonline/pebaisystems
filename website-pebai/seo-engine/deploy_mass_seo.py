#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Motor de Despliegue de SEO Programático para PEBAI Systems.
Sincroniza 'pages_mass_data.json' con WordPress mediante WP-CLI y Rank Math SEO Pro,
y permite la generación de landings estáticas HTML nativas en 'dist/' para
despliegue directo e instantáneo con PageSpeed 98-100.
"""

import json
import subprocess
import os
import sys
import argparse

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Configuración por defecto de WordPress / Servidor
DEFAULT_PHP_BIN = "/usr/bin/php"
DEFAULT_WP_CLI = "/usr/local/bin/wp"
DEFAULT_WP_PATH = "/var/www/vhosts/pebaisystems.es/httpdocs"

# Configuración de Servidor Remoto (Hostinger / Plesk)
# Credenciales SSH de Hostinger: se leen de PAI Systems/.env (nunca en el codigo)
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), os.pardir, os.pardir, '.env'))
except ImportError:
    pass
REMOTE_HOST = os.environ['HOSTINGER_SSH_HOST']
REMOTE_PORT = int(os.environ.get('HOSTINGER_SSH_PORT', '65002'))
REMOTE_USER = os.environ['HOSTINGER_SSH_USER']
REMOTE_PASS = os.environ['HOSTINGER_SSH_PASS']
REMOTE_WP_PATH = 'domains/pebaisystems.es/public_html'

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
LOCAL_DIST = os.path.join(PROJECT_DIR, 'dist')
JSON_DATA_PATH = os.path.join(SCRIPT_DIR, "pages_mass_data.json")

def deploy_wp_cli_local(pages, php_bin, wp_cli, wp_path):
    print(f"🚀 Iniciando procesamiento WP-CLI local para {len(pages)} landings programáticas...")
    for p in pages:
        slug = p["slug"]
        title = p["title"]
        content = p["content"]
        kw = p.get("kw", title)

        # 1. Comprobar existencia
        check_cmd = [php_bin, wp_cli, f"--path={wp_path}", "post", "list", f"--name={slug}", "--post_type=page", "--format=ids"]
        try:
            existing_id = subprocess.check_output(check_cmd).decode().strip()
        except Exception as e:
            print(f"⚠️ Error al verificar slug '{slug}': {e}")
            existing_id = ""

        temp_file = os.path.join(SCRIPT_DIR, "temp_payload.html")
        with open(temp_file, "w", encoding="utf-8") as tf:
            tf.write(content)

        if existing_id:
            post_id = existing_id.split()[0]
            update_cmd = [php_bin, wp_cli, f"--path={wp_path}", "post", "update", post_id, temp_file, f"--post_title={title}", "--post_status=publish"]
            subprocess.run(update_cmd, stdout=subprocess.DEVNULL)
            print(f"🔄 Actualizada: {slug} (ID: {post_id})")
        else:
            create_cmd = [php_bin, wp_cli, f"--path={wp_path}", "post", "create", temp_file, "--post_type=page", f"--post_title={title}", f"--post_name={slug}", "--post_status=publish", "--porcelain"]
            try:
                post_id = subprocess.check_output(create_cmd).decode().strip()
                print(f"✨ Creada nueva: {slug} (ID: {post_id})")
            except Exception as e:
                print(f"❌ Error al crear página '{slug}': {e}")
                post_id = None

        # 2. Asignar Metadatos de Rank Math SEO Pro
        if post_id:
            subprocess.run([php_bin, wp_cli, f"--path={wp_path}", "post", "meta", "update", post_id, "rank_math_title", p["rank_math_title"]], stdout=subprocess.DEVNULL)
            subprocess.run([php_bin, wp_cli, f"--path={wp_path}", "post", "meta", "update", post_id, "rank_math_description", p["rank_math_description"]], stdout=subprocess.DEVNULL)
            subprocess.run([php_bin, wp_cli, f"--path={wp_path}", "post", "meta", "update", post_id, "rank_math_focus_keyword", kw], stdout=subprocess.DEVNULL)

        if os.path.exists(temp_file):
            os.remove(temp_file)

    print("✅ Despliegue WP-CLI local completado con éxito.")

def generate_static_landings(pages):
    """
    Genera páginas HTML autónomas dentro de 'dist/' usando estrictamente
    el DOM, cabecera, navegación, footer y scripts de PEBAI Systems.
    """
    print(f"📦 Generando {len(pages)} páginas HTML estáticas nativas de PEBAI en: {LOCAL_DIST}")

    for p in pages:
        slug = p["slug"]
        title = p["title"]
        seo_title = p["rank_math_title"]
        seo_desc = p["rank_math_description"]
        content = p["content"]
        # Limpiar etiquetas de bloques de WP si las hay
        clean_content = content.replace("<!-- wp:html -->", "").replace("<!-- /wp:html -->", "")

        # Asegurar existencia de banner Open Graph
        try:
            from generate_landing_image import generate_landing_banner
            ciudad_guess = p.get("ciudad", "España")
            generate_landing_banner(title, ciudad=ciudad_guess, slug=slug)
        except Exception:
            pass

        landing_dir = os.path.join(LOCAL_DIST, slug)
        os.makedirs(landing_dir, exist_ok=True)
        file_path = os.path.join(landing_dir, "index.html")

        full_html = f'''<!doctype html>
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
  <a class="header-contact" href="https://wa.me/34624842799?text=Hola%2C%20vengo%20de%20la%20landing%20{slug}%20y%20quiero%20solicitar%20consultor%C3%ADa." target="_blank" rel="noopener noreferrer" data-social="whatsappConsultoria">
    Consultoría sin compromiso 
    <span aria-hidden="true"><svg class="arrow-glyph" width="11" height="11" viewBox="0 0 10 10" aria-hidden="true"><path d="M2.5 7.5L7.5 2.5M7.5 2.5H3.5M7.5 2.5V6.5"/></svg></span>
  </a>
</div>
</header>

<main id="contenido">
{clean_content}
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

<a class="floating-cta is-visible" href="https://wa.me/34624842799?text=Hola%2C%20vengo%20de%20la%20landing%20{slug}%20y%20quiero%20solicitar%20consultor%C3%ADa." target="_blank" rel="noopener noreferrer" data-social="whatsappConsultoria" aria-label="Consultoría sin compromiso">
  <span class="floating-cta-ping-wrap" aria-hidden="true"><span class="floating-cta-ping"></span><span class="floating-cta-dot"></span></span>
  <span class="floating-cta-label">Consultoría sin compromiso</span>
  <span class="floating-cta-arrow" aria-hidden="true"><svg class="arrow-glyph" width="11" height="11" viewBox="0 0 10 10" aria-hidden="true"><path d="M2.5 7.5L7.5 2.5M7.5 2.5H3.5M7.5 2.5V6.5"/></svg></span>
</a>

</body>
</html>'''

        with open(file_path, "w", encoding="utf-8") as f:
            f.write(full_html)

    print(f"✨ {len(pages)} páginas estáticas generadas exitosamente en carpetas limpias con index.html.")

def main():
    parser = argparse.ArgumentParser(description="Despliegue Programático SEO & GEO de PEBAI Systems")
    parser.add_argument("--mode", choices=["wp-local", "static", "all"], default="static", help="Modo de despliegue: static (genera HTMLs en dist/), wp-local (ejecuta WP-CLI local), all (ambos)")
    parser.add_argument("--php", default=DEFAULT_PHP_BIN, help="Ruta al binario de PHP")
    parser.add_argument("--wp-cli", default=DEFAULT_WP_CLI, help="Ruta a WP-CLI")
    parser.add_argument("--wp-path", default=DEFAULT_WP_PATH, help="Ruta a la instalación de WordPress")
    args = parser.parse_args()

    if not os.path.exists(JSON_DATA_PATH):
        print(f"❌ No se encontró '{JSON_DATA_PATH}'. Ejecuta primero 'generate_dataset.py'.")
        sys.exit(1)

    with open(JSON_DATA_PATH, "r", encoding="utf-8") as f:
        pages = json.load(f)

    if args.mode in ("static", "all"):
        generate_static_landings(pages)

    if args.mode in ("wp-local", "all"):
        deploy_wp_cli_local(pages, args.php, args.wp_cli, args.wp_path)

if __name__ == "__main__":
    main()
