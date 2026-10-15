"""Despliega el agente de WhatsApp (agente-whatsapp/) en el servidor de Hostinger y lo deja corriendo 24/7 con PM2.

Qué hace (una sola conexión SSH):
  1. Sube index.js, package.json, package-lock.json y ecosystem.config.cjs a ~/agente-whatsapp.
  2. Escribe ~/agente-whatsapp/.env con AGENT_TOKEN y WA_NUMERO_AGENTE del .env de la raíz (no se guardan en git).
  3. npm ci (solo dependencias de producción) y reinicia `pebai-agente-whatsapp` en PM2 (restart, no reload:
     dos procesos a la vez con la misma sesión hacen que WhatsApp la cierre).
  4. pm2 save e imprime el comando del cron de hPanel que lo levanta si el servidor se reinicia (no hay crontab por SSH).
     La sesión de WhatsApp (~/agente-whatsapp/sesion) no se toca: un redespliegue no obliga a vincular de nuevo.

Uso:
  python deploy/desplegar_agente_whatsapp.py            -> despliega y arranca
  python deploy/desplegar_agente_whatsapp.py --estado   -> solo muestra el estado y los últimos logs
  python deploy/desplegar_agente_whatsapp.py --parar    -> para el agente (no borra la sesión)
"""
import os
import sys

import paramiko

sys.stdout.reconfigure(encoding='utf-8', errors='replace')  # PM2 pinta tablas con caracteres de caja

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), os.pardir, '.env'))
except ImportError:
    pass

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), os.pardir)
LOCAL = os.path.join(ROOT, 'agente-whatsapp')
ARCHIVOS = ['index.js', 'package.json', 'package-lock.json', 'ecosystem.config.cjs']
USER = os.environ['HOSTINGER_SSH_USER']
REMOTO = f'/home/{USER}/agente-whatsapp'
NOMBRE = 'pebai-agente-whatsapp'
PATH = 'export PATH=/opt/alt/alt-nodejs22/root/usr/bin:~/.npm-global/bin:/usr/local/bin:/usr/bin:/bin:$PATH; '
CRON_HPANEL = (f'export PATH=/opt/alt/alt-nodejs22/root/usr/bin:$HOME/.npm-global/bin:$PATH; '
               f'pm2 pid {NOMBRE} | grep -q "[0-9]" || pm2 resurrect')


def run(client, cmd, timeout=600):
    _, out, err = client.exec_command(PATH + cmd, timeout=timeout)
    return (out.read().decode('utf-8', 'replace') + err.read().decode('utf-8', 'replace')).strip()


def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(os.environ['HOSTINGER_SSH_HOST'], port=int(os.environ.get('HOSTINGER_SSH_PORT', '65002')),
                   username=USER, password=os.environ['HOSTINGER_SSH_PASS'], timeout=25)
    try:
        if '--estado' in sys.argv:
            print(run(client, f'node -v; pm2 describe {NOMBRE} | grep -E "status|uptime|restarts" ; pm2 logs {NOMBRE} --lines 40 --nostream'))
            return
        if '--parar' in sys.argv:
            print(run(client, f'pm2 stop {NOMBRE} && pm2 save'))
            return

        token = os.environ.get('AGENT_TOKEN', '')
        numero = ''.join(c for c in os.environ.get('WA_NUMERO_AGENTE', '') if c.isdigit())
        if len(token) < 24 or len(numero) < 11:
            sys.exit('Faltan AGENT_TOKEN (24+ caracteres) o WA_NUMERO_AGENTE (34XXXXXXXXX) en el .env de la raíz.')

        print('== Node en el servidor:', run(client, 'node -v'))
        run(client, f'mkdir -p {REMOTO}')
        sftp = client.open_sftp()
        for f in ARCHIVOS:
            sftp.put(os.path.join(LOCAL, f), f'{REMOTO}/{f}')
            print('subido', f)
        with sftp.open(f'{REMOTO}/.env', 'w') as fh:
            fh.write(f'PANEL_API=https://pebaisystems.es/api/agente.php\nAGENT_TOKEN={token}\nWA_NUMERO={numero}\n')
        sftp.chmod(f'{REMOTO}/.env', 0o600)
        sftp.close()

        print('== npm ci')
        print(run(client, f'cd {REMOTO} && npm ci --omit=dev --no-audit --no-fund 2>&1 | tail -3'))
        print('== PM2')
        print(run(client, 'command -v pm2 >/dev/null || npm install -g pm2 --prefix ~/.npm-global 2>&1 | tail -1'))
        print(run(client, f'cd {REMOTO} && (pm2 describe {NOMBRE} >/dev/null 2>&1 && pm2 restart {NOMBRE} --update-env || pm2 start ecosystem.config.cjs) && pm2 save'))

        # Hostinger no da crontab por SSH: el respaldo tras un reinicio del servidor se crea en hPanel → Avanzado → Cron.
        print('== Cron de respaldo para hPanel (cada 10 min):\n   ' + CRON_HPANEL)

        print('\n== Últimos logs')
        print(run(client, f'sleep 8; pm2 logs {NOMBRE} --lines 20 --nostream'))
        print('\nListo. Abre https://panel.pebaisystems.es/?tab=agentes: si es la primera vez, ahí sale el código para vincular el WhatsApp.')
    finally:
        client.close()


if __name__ == '__main__':
    main()
