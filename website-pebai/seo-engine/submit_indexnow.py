#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PEBAI Systems - IndexNow Push Engine
Envía instantáneamente todas las URLs del sitemap a Bing, ChatGPT Search, Copilot y Yandex
a través del protocolo IndexNow.
"""

import os
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), os.pardir, os.pardir, '.env'))
except ImportError:
    pass
import sys
import json
import xml.etree.ElementTree as ET
import requests
import paramiko

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEXNOW_KEY = "4352074d79454d978aebadca7f53f910"
HOST = "pebaisystems.es"
KEY_FILE = f"{INDEXNOW_KEY}.txt"
KEY_LOCATION = f"https://{HOST}/{KEY_FILE}"

# 1. Crear el archivo de verificación localmente
key_local_path = os.path.join(BASE_DIR, "dist", KEY_FILE)
os.makedirs(os.path.join(BASE_DIR, "dist"), exist_ok=True)
with open(key_local_path, "w", encoding="utf-8") as f:
    f.write(INDEXNOW_KEY)
print(f"✅ Archivo clave creado localmente: {key_local_path}")

# 2. Subir el archivo de verificación al servidor Hostinger por SFTP
sftp_host = os.environ['HOSTINGER_SSH_HOST']
sftp_port = int(os.environ.get('HOSTINGER_SSH_PORT', '65002'))
sftp_user = os.environ['HOSTINGER_SSH_USER']
sftp_pass = os.environ['HOSTINGER_SSH_PASS']
remote_dir = "domains/pebaisystems.es/public_html"

print(f"📡 Conectando por SFTP a {sftp_host}...")
transport = paramiko.Transport((sftp_host, sftp_port))
transport.connect(username=sftp_user, password=sftp_pass)
sftp = paramiko.SFTPClient.from_transport(transport)

remote_key_path = f"{remote_dir}/{KEY_FILE}"
sftp.put(key_local_path, remote_key_path)
print(f"✅ Clave IndexNow subida al servidor: {remote_key_path}")
sftp.close()
transport.close()

# 3. Extraer URLs de sitemap.xml
sitemap_path = os.path.join(BASE_DIR, "dist", "sitemap.xml")
tree = ET.parse(sitemap_path)
root = tree.getroot()
urls = []
for child in root:
    loc = child.find("{http://www.sitemaps.org/schemas/sitemap/0.9}loc")
    if loc is not None and loc.text:
        urls.append(loc.text.strip())

print(f"📋 Encontradas {len(urls)} URLs en sitemap.xml para IndexNow.")

# 4. Enviar notificación a IndexNow (Bing, ChatGPT, Copilot)
payload = {
    "host": HOST,
    "key": INDEXNOW_KEY,
    "keyLocation": KEY_LOCATION,
    "urlList": urls
}

headers = {
    "Content-Type": "application/json; charset=utf-8"
}

endpoints = [
    "https://api.indexnow.org/indexnow",
    "https://www.bing.com/indexnow"
]

for ep in endpoints:
    try:
        r = requests.post(ep, json=payload, headers=headers, timeout=15)
        print(f"🚀 Enviado a {ep} -> Status: {r.status_code} ({r.reason})")
        if r.text:
            print(f"   Respuesta: {r.text[:200]}")
    except Exception as e:
        print(f"⚠️ Error enviando a {ep}: {e}")

# 5. Actualizar api_keys.json
api_keys_path = "C:/programacion/APIs/api_keys.json"
if os.path.exists(api_keys_path):
    with open(api_keys_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    data["bing_indexnow_key"] = INDEXNOW_KEY
    with open(api_keys_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print("✅ Bóveda C:/programacion/APIs/api_keys.json actualizada con bing_indexnow_key.")
