#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PEBAI Systems - Inyector Universal de GEO Tracker
Inyecta el script de atribución GEO (/geo-tracker.js) en:
1. dist/index.html
2. Todas las 61 landings en dist/*/index.html
Y las sincroniza con Hostinger por SFTP.
"""

import os
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), os.pardir, os.pardir, '.env'))
except ImportError:
    pass
import sys
import glob
import paramiko

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST_DIR = os.path.join(BASE_DIR, "dist")

TAG = '<script defer src="/geo-tracker.js"></script>'

# 1. dist/index.html
index_path = os.path.join(DIST_DIR, "index.html")
updated_files = []

print(f"Debug: index_path={index_path}, exists={os.path.exists(index_path)}")
if os.path.exists(index_path):
    with open(index_path, "r", encoding="utf-8") as f:
        html = f.read()
    print(f"Debug index.html: TAG in html = {TAG in html}, </body> in html = {'</body>' in html}")
    if TAG not in html and "</body>" in html:
        html = html.replace("</body>", f"{TAG}\n</body>")
        with open(index_path, "w", encoding="utf-8") as f:
            f.write(html)
        updated_files.append((index_path, "domains/pebaisystems.es/public_html/index.html"))

# 2. Todas las landings
landing_dirs = [d for d in glob.glob(os.path.join(DIST_DIR, "*")) if os.path.isdir(d) and not os.path.basename(d) in ["brand", "vendor", "clients", "team", "api", "diagnostico"]]
print(f"Debug: found {len(landing_dirs)} landing dirs")

for i, l_dir in enumerate(landing_dirs):
    l_index = os.path.join(l_dir, "index.html")
    if os.path.exists(l_index):
        with open(l_index, "r", encoding="utf-8") as f:
            l_html = f.read()
        if i == 0:
            print(f"Debug first landing {l_dir}: TAG in html={TAG in l_html}, </body> in html={'</body>' in l_html}")
        if TAG not in l_html and "</body>" in l_html:
            l_html = l_html.replace("</body>", f"{TAG}\n</body>")
            with open(l_index, "w", encoding="utf-8") as f:
                f.write(l_html)
            slug = os.path.basename(l_dir)
            updated_files.append((l_index, f"domains/pebaisystems.es/public_html/{slug}/index.html"))

files_to_sync = [(index_path, "domains/pebaisystems.es/public_html/index.html")]
for l_dir in landing_dirs:
    l_index = os.path.join(l_dir, "index.html")
    if os.path.exists(l_index):
        slug = os.path.basename(l_dir)
        files_to_sync.append((l_index, f"domains/pebaisystems.es/public_html/{slug}/index.html"))

print(f"📡 Sincronizando {len(files_to_sync)} páginas con geo-tracker.js a Hostinger...")
transport = paramiko.Transport((os.environ['HOSTINGER_SSH_HOST'], int(os.environ.get('HOSTINGER_SSH_PORT', '65002'))))
transport.connect(username=os.environ['HOSTINGER_SSH_USER'], password=os.environ['HOSTINGER_SSH_PASS'])
sftp = paramiko.SFTPClient.from_transport(transport)

count = 0
for local_f, remote_f in files_to_sync:
    try:
        sftp.put(local_f, remote_f)
        count += 1
    except Exception as e:
        print(f"⚠️ Error subiendo {remote_f}: {e}")

sftp.close()
transport.close()
print(f"🎉 ¡{count} páginas sincronizadas con éxito en Hostinger con seguimiento GEO!")
