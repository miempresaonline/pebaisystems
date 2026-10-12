#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PEBAI Systems - Limpiador de Textos Antiguos y Unificador de CTAs
Reemplaza 'Hablar con un Ingeniero de IA' por 'Pedir Auditoría Gratuita'
en todas las páginas de dist/ y las sincroniza por SFTP a Hostinger.
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

files = glob.glob(os.path.join(DIST_DIR, "**", "index.html"), recursive=True)
updated_files = []

for f in files:
    with open(f, "r", encoding="utf-8") as rf:
        content = rf.read()
    
    modified = False
    if "Hablar con un Ingeniero de IA" in content:
        content = content.replace("Hablar con un Ingeniero de IA", "Pedir Auditoría Gratuita")
        modified = True
    if "Hablar con un ingeniero de IA" in content:
        content = content.replace("Hablar con un ingeniero de IA", "Pedir Auditoría Gratuita")
        modified = True
    if "Hablar con un Ingeniero" in content:
        content = content.replace("Hablar con un Ingeniero", "Pedir Auditoría Gratuita")
        modified = True

    if modified:
        with open(f, "w", encoding="utf-8") as wf:
            wf.write(content)
        rel = os.path.relpath(f, DIST_DIR).replace("\\", "/")
        remote = f"domains/pebaisystems.es/public_html/{rel}"
        updated_files.append((f, remote))

print(f"✅ Corregidos {len(updated_files)} archivos locales con el CTA potente 'Pedir Auditoría Gratuita'.")

if updated_files:
    print(f"📡 Subiendo {len(updated_files)} archivos corregidos a Hostinger...")
    transport = paramiko.Transport((os.environ['HOSTINGER_SSH_HOST'], int(os.environ.get('HOSTINGER_SSH_PORT', '65002'))))
    transport.connect(username=os.environ['HOSTINGER_SSH_USER'], password=os.environ['HOSTINGER_SSH_PASS'])
    sftp = paramiko.SFTPClient.from_transport(transport)

    for loc, rem in updated_files:
        try:
            sftp.put(loc, rem)
        except Exception as e:
            print(f"Error subiendo {rem}: {e}")

    sftp.close()
    transport.close()
    print("🎉 ¡Todos los CTAs antiguos eliminados y actualizados en Hostinger!")
