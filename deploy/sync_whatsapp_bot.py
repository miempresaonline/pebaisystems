import os
import paramiko
import sys

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

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
print(f"Connecting to Hostinger {HOST}:{PORT}...")
client.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)
sftp = client.open_sftp()

local_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), os.pardir, "whatsapp-outreach-bot")
remote_dir = f"/home/{USER}/whatsapp-outreach-bot"

files = [
    "whatsapp-engine.js",
    "sales-closer.js",
    "config.js",
    "runner.js",
    "ai-generator.js",
    "learning-engine.js",
    "sheets-service.js",
    "knowledge-base.js",
    "email-service.js",
    ".env"
]

for f in files:
    l_path = os.path.join(local_dir, f)
    r_path = f"{remote_dir}/{f}"
    if os.path.exists(l_path):
        print(f"Uploading {f}...")
        sftp.put(l_path, r_path)

sftp.close()
print("All files uploaded successfully via SFTP!")

# Reiniciar pebai-outreach en PM2 con OUTREACH_ENABLED=false (modo receptor de pruebas activo, prospección en frío detenida)
print("Restarting PM2 pebai-outreach on Hostinger...")
stdin, stdout, stderr = client.exec_command(
    "export PATH=/usr/local/bin:/usr/bin:/bin:/opt/alt/alt-nodejs22/root/usr/bin:~/.npm-global/bin:$PATH; "
    f"cd /home/{USER}/whatsapp-outreach-bot; "
    "rm -f bot.pid; "
    "pm2 restart pebai-outreach --update-env 2>/dev/null || pm2 start runner.js --name pebai-outreach; "
    "sleep 2; "
    "pm2 status; "
    "pm2 logs pebai-outreach --lines 20 --nostream"
)

out = stdout.read()
sys.stdout.buffer.write(out)
err = stderr.read()
if err:
    sys.stderr.buffer.write(err)

client.close()
print("\nDeployment completed successfully!")
