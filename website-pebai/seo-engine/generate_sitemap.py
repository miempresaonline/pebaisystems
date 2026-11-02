#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generador Maestro de Sitemap XML para PEBAI Systems.
Recorre dist/ entero (subcarpetas incluidas), salta las páginas noindex y escribe dist/sitemap.xml.
lastmod = fecha del último commit del archivo (git log -1 --format=%cs).
NO sube nada por SFTP: el auto-despliegue (deploy/autodeploy.sh) publica lo que llega a main.
"""

import os
import re
import subprocess
import sys
from datetime import date

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
LOCAL_DIST = os.path.join(PROJECT_DIR, 'dist')
SITEMAP_PATH = os.path.join(LOCAL_DIST, "sitemap.xml")
BASE = "https://pebaisystems.es"
IGNORE_DIRS = {'api', 'brand', 'clients', 'team', 'vendor', 'private', '.git', 'node_modules'}


def is_noindex(path):
    """Las páginas con <meta name="robots" content="noindex..."> no van al sitemap."""
    with open(path, encoding="utf-8", errors="ignore") as f:
        head = f.read(20000).lower()
    return bool(re.search(r"<meta[^>]+name=[\"']robots[\"'][^>]+content=[\"'][^\"']*noindex", head))


def last_modified(path):
    """Fecha (AAAA-MM-DD) del último commit que tocó el archivo; hoy si git no sabe."""
    try:
        out = subprocess.run(
            ["git", "log", "-1", "--format=%cs", "--", path],
            capture_output=True, text=True, cwd=PROJECT_DIR, timeout=20,
        ).stdout.strip()
        if re.fullmatch(r"\d{4}-\d{2}-\d{2}", out):
            return out
    except Exception:
        pass
    return date.today().isoformat()


def find_pages():
    """Devuelve [(ruta_url, ruta_archivo)] de todas las index.html indexables de dist/."""
    pages = []
    for root, dirs, files in os.walk(LOCAL_DIST):
        dirs[:] = sorted(d for d in dirs if d not in IGNORE_DIRS)
        if "index.html" not in files:
            continue
        rel = os.path.relpath(root, LOCAL_DIST).replace(os.sep, "/")
        index = os.path.join(root, "index.html")
        if is_noindex(index):
            continue
        pages.append(("/" if rel == "." else f"/{rel}/", index))
    # portada primero, el resto en el orden del sitemap anterior no es necesario: alfabético
    pages.sort(key=lambda p: (p[0] != "/", p[0]))
    return pages


def generate_sitemap():
    xml_lines = ['<?xml version="1.0" encoding="UTF-8"?>',
                 '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    pages = find_pages()
    for url, index in pages:
        depth = url.strip("/").count("/") + 1 if url != "/" else 0
        if url == "/":
            priority, freq = "1.0", "daily"
        elif url == "/diagnostico/":
            priority, freq = "0.9", "weekly"
        else:
            priority, freq = ("0.8" if depth == 1 else "0.7"), "monthly"
        xml_lines.extend([
            '  <url>',
            f'    <loc>{BASE}{url}</loc>',
            f'    <lastmod>{last_modified(index)}</lastmod>',
            f'    <changefreq>{freq}</changefreq>',
            f'    <priority>{priority}</priority>',
            '  </url>'
        ])
    xml_lines.append('</urlset>')

    with open(SITEMAP_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(xml_lines) + "\n")

    print(f"Sitemap XML generado en {SITEMAP_PATH} ({len(pages)} URLs). Se publica con el auto-despliegue al hacer push a main.")
    return len(pages)

if __name__ == "__main__":
    generate_sitemap()
