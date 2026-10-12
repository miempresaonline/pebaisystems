# deploy/sync_social_engine.py
# Script de sincronización y despliegue del motor de redes 24/7 en el servidor Hostinger

import os
import sys
import paramiko

# Credenciales SSH de Hostinger: se leen de PAI Systems/.env (nunca en el codigo)
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), os.pardir, '.env'))
except ImportError:
    pass
HOST = os.environ['HOSTINGER_SSH_HOST']
PORT = int(os.environ.get('HOSTINGER_SSH_PORT', '65002'))
USER = os.environ['HOSTINGER_SSH_USER']
PASS = os.environ['HOSTINGER_SSH_PASS']

LOCAL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), os.pardir, "social-media-engine")
REMOTE_DIR = f"/home/{USER}/social-media-engine"

FILES_TO_UPLOAD = [
    "runner.py",
    "instagram_monitor.py",
    "tiktok_monitor.py",
    "notifier.py",
    "config.js",
    "memory-store.js",
    "keyword-matcher.js",
    "response-dispatcher.js",
    "package.json"
]

SESSION_FILES = [
    "instagram_state.json",
    "tiktok_state.json",
    "x_state.json"
]

def deploy():
    print(f"[*] Conectando con servidor Hostinger {HOST}:{PORT}...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(HOST, port=PORT, username=USER, password=PASS, timeout=20)
        print("[OK] Conexión SSH establecida.")
        
        sftp = client.open_sftp()
        
        # Crear carpetas remotas si no existen
        try:
            sftp.mkdir(REMOTE_DIR)
        except IOError:
            pass
        try:
            sftp.mkdir(f"{REMOTE_DIR}/sessions")
        except IOError:
            pass
        try:
            sftp.mkdir(f"{REMOTE_DIR}/data")
        except IOError:
            pass

        print("[*] Subiendo archivos del motor de redes...")
        for f in FILES_TO_UPLOAD:
            local_path = os.path.join(LOCAL_DIR, f)
            remote_path = f"{REMOTE_DIR}/{f}"
            if os.path.exists(local_path):
                print(f"  -> Subiendo {f}...")
                sftp.put(local_path, remote_path)

        print("[*] Subiendo llaves de sesión activas (Instagram, TikTok, X)...")
        for sf in SESSION_FILES:
            local_path = os.path.join(LOCAL_DIR, "sessions", sf)
            remote_path = f"{REMOTE_DIR}/sessions/{sf}"
            if os.path.exists(local_path):
                print(f"  -> Subiendo sesión {sf}...")
                sftp.put(local_path, remote_path)

        sftp.close()
        print("[OK] Todos los archivos y sesiones han sido transferidos con éxito.")

        # Iniciar o reiniciar el daemon en PM2
        print("[*] Reiniciando daemon en PM2 (pebai-social-engine)...")
        cmd = (
            "export PATH=/usr/local/bin:/usr/bin:/bin:/opt/alt/alt-nodejs22/root/usr/bin:~/.npm-global/bin:$PATH; "
            f"cd {REMOTE_DIR}; "
            "pm2 restart pebai-social-engine 2>/dev/null || pm2 start runner.py --name pebai-social-engine --interpreter python; "
            "sleep 3; "
            "pm2 status; "
            "pm2 logs pebai-social-engine --lines 15 --nostream"
        )
        stdin, stdout, stderr = client.exec_command(cmd)
        out = stdout.read().decode('utf-8', errors='ignore')
        print(out)
        
        client.close()
        print("\n==================================================================")
        print("  DESPLIEGUE FINALIZADO — MOTOR 24/7 ACTIVO EN HOSTINGER PM2      ")
        print("==================================================================")

    except Exception as e:
        print(f"[!] Error durante el despliegue: {e}")

if __name__ == "__main__":
    deploy()
