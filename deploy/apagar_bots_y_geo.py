"""Apaga y elimina del servidor de Hostinger los bots y el publicador automático de GEO.

Qué hace (una sola conexión SSH):
  1. Para y borra de PM2 los bots `pebai-outreach` (WhatsApp) y `pebai-social-engine` (redes).
  2. Quita del crontab cualquier tarea de esos bots o del publicador GEO (cron_publish.php).
  3. Borra las carpetas de los bots (código, sesiones iniciadas y .env) del servidor.
  4. Borra el publicador GEO y su relay de emails de la web: api/cron_publish.php,
     api/send_alert.php y api/cron_execution.log.

Uso:
  python deploy/apagar_bots_y_geo.py              -> solo muestra lo que encuentra (no cambia nada)
  python deploy/apagar_bots_y_geo.py --ejecutar   -> lo aplica
"""
import os
import sys

import paramiko

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), os.pardir, '.env'))
except ImportError:
    pass

EJECUTAR = '--ejecutar' in sys.argv
USER = os.environ['HOSTINGER_SSH_USER']
HOME = f'/home/{USER}'
WEB_API = f'{HOME}/domains/pebaisystems.es/public_html/api'
PM2_NAMES = ['pebai-outreach', 'pebai-social-engine']
BOT_DIRS = [f'{HOME}/whatsapp-outreach-bot', f'{HOME}/social-media-engine']
GEO_FILES = [f'{WEB_API}/cron_publish.php', f'{WEB_API}/send_alert.php', f'{WEB_API}/cron_execution.log']
CRON_PATTERN = 'cron_publish|whatsapp-outreach|social-media-engine|pebai-outreach|pebai-social'
PATH = 'export PATH=/usr/local/bin:/usr/bin:/bin:/opt/alt/alt-nodejs22/root/usr/bin:~/.npm-global/bin:$PATH; '


def run(client, cmd):
    _, out, err = client.exec_command(PATH + cmd, timeout=60)
    return (out.read().decode('utf-8', 'replace') + err.read().decode('utf-8', 'replace')).strip()


def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(os.environ['HOSTINGER_SSH_HOST'], port=int(os.environ.get('HOSTINGER_SSH_PORT', '65002')),
                   username=USER, password=os.environ['HOSTINGER_SSH_PASS'], timeout=25)
    try:
        print('== Procesos PM2')
        print(run(client, 'pm2 jlist 2>/dev/null | python3 -c "import sys,json;'
                          '[print(p[\'name\'], p[\'pm2_env\'][\'status\']) for p in json.load(sys.stdin)]" 2>/dev/null || pm2 ls'))
        print('\n== Tareas programadas (crontab) relacionadas')
        print(run(client, f'crontab -l 2>/dev/null | grep -E "{CRON_PATTERN}" || echo "(ninguna)"'))
        print('\n== Carpetas y archivos')
        for path in BOT_DIRS + GEO_FILES:
            print(run(client, f'[ -e "{path}" ] && du -sh "{path}" || echo "no existe: {path}"'))

        if not EJECUTAR:
            print('\nModo consulta: no se ha cambiado nada. Para aplicarlo: python deploy/apagar_bots_y_geo.py --ejecutar')
            return

        print('\n== Aplicando')
        for name in PM2_NAMES:
            print(run(client, f'pm2 delete {name} 2>&1 | tail -1 || true'))
        print(run(client, 'pm2 save 2>&1 | tail -1 || true'))
        print(run(client, f'(crontab -l 2>/dev/null | grep -vE "{CRON_PATTERN}") | crontab - && echo "crontab limpio"'))
        for path in BOT_DIRS + GEO_FILES:
            print(run(client, f'rm -rf "{path}" && echo "borrado: {path}"'))
        print('\nListo. Revisa también hPanel > Avanzado > Cron Jobs por si había alguna tarea creada desde el panel.')
    finally:
        client.close()


if __name__ == '__main__':
    main()
