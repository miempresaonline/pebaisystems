#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generador Maestro de Sitemap XML para PEBAI Systems.
Escanea todas las páginas activas en 'dist/' y genera el sitemap completo.
Sube automáticamente el sitemap actualizado a Hostinger vía SFTP.
"""

import json
import os
import re
import sys
from datetime import date
import paramiko

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
LOCAL_DIST = os.path.join(PROJECT_DIR, 'dist')
SITEMAP_PATH = os.path.join(LOCAL_DIST, "sitemap.xml")
PROJECT_CONFIGS_PATH = "C:/programacion/APIs/project_configs.json"

def is_noindex(path):
    """Las páginas con <meta name="robots" content="noindex..."> no van al sitemap."""
    with open(path, encoding="utf-8", errors="ignore") as f:
        head = f.read(20000).lower()
    return bool(re.search(r"<meta[^>]+name=[\"']robots[\"'][^>]+content=[\"'][^\"']*noindex", head))


def generate_sitemap():
    today = date.today().isoformat()
    ignore_dirs = {'api', 'brand', 'clients', 'team', 'vendor', '.git'}

    # 1. Home
    xml_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        '  <url>',
        '    <loc>https://pebaisystems.es/</loc>',
        f'    <lastmod>{today}</lastmod>',
        '    <changefreq>daily</changefreq>',
        '    <priority>1.0</priority>',
        '  </url>'
    ]

    # 2. Landings
    slugs = sorted([
        d for d in os.listdir(LOCAL_DIST)
        if os.path.isdir(os.path.join(LOCAL_DIST, d))
        and d not in ignore_dirs
        and os.path.exists(os.path.join(LOCAL_DIST, d, "index.html"))
        and not is_noindex(os.path.join(LOCAL_DIST, d, "index.html"))
    ])

    for slug in slugs:
        priority = "0.9" if slug == "diagnostico" else "0.8"
        freq = "weekly" if slug == "diagnostico" else "monthly"
        xml_lines.extend([
            '  <url>',
            f'    <loc>https://pebaisystems.es/{slug}/</loc>',
            f'    <lastmod>{today}</lastmod>',
            f'    <changefreq>{freq}</changefreq>',
            f'    <priority>{priority}</priority>',
            '  </url>'
        ])

    xml_lines.append('</urlset>')

    with open(SITEMAP_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(xml_lines) + "\n")

    total_urls = len(slugs) + 1
    print(f"🗺️ Sitemap XML generado con éxito en: {SITEMAP_PATH} ({total_urls} URLs)")

    # 3. Subir a Hostinger por SFTP
    if os.path.exists(PROJECT_CONFIGS_PATH):
        try:
            with open(PROJECT_CONFIGS_PATH, "r", encoding="utf-8") as f:
                cfg = json.load(f)["pebai-systems"]

            client = paramiko.SSHClient()
            client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            client.connect(cfg["sftp_host"], port=int(cfg["sftp_port"]), username=cfg["sftp_username"], password=cfg["sftp_password"], timeout=12)
            sftp = client.open_sftp()
            remote_sitemap = f"{cfg.get('sftp_remote_dir', 'domains/pebaisystems.es/public_html')}/sitemap.xml"
            sftp.put(SITEMAP_PATH, remote_sitemap)
            sftp.close()
            client.close()
            print(f"📡 Sitemap subido y sincronizado en Hostinger: {remote_sitemap}")
        except Exception as e:
            print(f"Aviso subiendo sitemap por SFTP: {e}")

    return total_urls

if __name__ == "__main__":
    generate_sitemap()
