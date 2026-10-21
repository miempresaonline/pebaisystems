"""Sube a Hostinger solo los archivos de website-pebai/dist que cambiaron en un commit.

Uso:  python website-pebai/scripts/deploy_changed.py <commit> [--private]   (por defecto HEAD)

Abre una única conexión SFTP para todos los archivos (evita bloqueos de IP por
conexiones repetidas) y sube cada archivo siempre, sin comparar tamaños.
Los HTML se suben al final, para que nunca apunten a un recurso que aún no existe
(Cloudflare cachea los 404).
--private  sube también website-pebai/private/config.php a
           domains/pebaisystems.es/private/ (fuera de public_html).
--remove=a,b  borra del servidor esas rutas (relativas a public_html).
--files=a,b   sube además esos archivos de dist/ aunque no estén en Git (p. ej. vídeos .mp4).
--no-indexnow no avisa a IndexNow (Bing, Copilot, ChatGPT Search, Yandex...) de las páginas subidas.
              Por defecto, tras subir, se envían las URL públicas indexables que cambiaron y el sitemap.
              Si IndexNow falla solo se avisa: el despliegue ya está hecho.
"""
import os
import re
import sys
import glob
import json
import posixpath
import subprocess
import urllib.request
import paramiko

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), os.pardir, os.pardir, '.env'))
except ImportError:
    pass

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), os.pardir, os.pardir))
PREFIX = 'website-pebai/dist/'
REMOTE_DIR = 'domains/pebaisystems.es/public_html'
PRIVATE_LOCAL = 'website-pebai/private/config.php'
PRIVATE_REMOTE = 'domains/pebaisystems.es/private/config.php'
SITE = 'https://pebaisystems.es'
INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'


def changed_files(commit):
    # Un commit ("abc123") o un rango de commits ("abc123..HEAD")
    if '..' in commit:
        cmd = ['git', 'diff', '--name-only', '--diff-filter=AM', commit, '--', PREFIX]
    else:
        cmd = ['git', 'show', '--name-only', '--diff-filter=AM', '--pretty=format:', commit, '--', PREFIX]
    out = subprocess.run(cmd, cwd=REPO, capture_output=True, text=True, check=True).stdout
    return [line.strip() for line in out.splitlines() if line.strip()]


def ensure_remote_dir(sftp, path):
    missing = []
    while path not in ('', '.', '/'):
        try:
            sftp.stat(path)
            break
        except IOError:
            missing.append(path)
            path = posixpath.dirname(path)
    for d in reversed(missing):
        sftp.mkdir(d)


def indexnow_key():
    # La clave es pública por diseño: es el nombre del archivo <clave>.txt de dist/ (contiene la propia clave).
    for path in glob.glob(os.path.join(REPO, PREFIX, '*.txt')):
        name = os.path.splitext(os.path.basename(path))[0]
        if re.fullmatch(r'[0-9a-f]{32}', name):
            with open(path, encoding='utf-8') as f:
                if f.read().strip() == name:
                    return name
    return ''


def is_noindex(path):
    with open(path, encoding='utf-8', errors='ignore') as f:
        head = f.read(20000).lower()
    return bool(re.search(r"<meta[^>]+name=[\"']robots[\"'][^>]+content=[\"'][^\"']*noindex", head))


def indexnow_urls(files):
    # dist/x/index.html -> https://pebaisystems.es/x/ ; sin panel, api, ni páginas noindex
    urls = []
    for f in files:
        rel = f[len(PREFIX):]
        if rel.startswith(('panel/', 'api/', 'scratch/')) or not rel.endswith('index.html'):
            continue
        if is_noindex(os.path.join(REPO, f)):
            continue
        urls.append(SITE + '/' + rel[:-len('index.html')])
    if urls or PREFIX + 'sitemap.xml' in files:
        urls.append(SITE + '/sitemap.xml')
    return urls


def notify_indexnow(files):
    try:
        urls = indexnow_urls(files)
        if not urls:
            print('IndexNow: no hay páginas indexables en este despliegue.')
            return
        key = indexnow_key()
        if not key:
            print('AVISO IndexNow: no encuentro el archivo de clave <clave>.txt en dist/; no se envía.')
            return
        host = SITE.split('://', 1)[1]
        body = json.dumps({'host': host, 'key': key, 'keyLocation': f'{SITE}/{key}.txt', 'urlList': urls}).encode('utf-8')
        req = urllib.request.Request(INDEXNOW_ENDPOINT, data=body, method='POST',
                                     headers={'Content-Type': 'application/json; charset=utf-8'})
        with urllib.request.urlopen(req, timeout=15) as r:
            print(f'IndexNow: {len(urls)} URL enviadas -> HTTP {r.status}')
        for u in urls:
            print(f'  {u}')
    except Exception as e:  # nunca hace fallar el despliegue
        print(f'AVISO IndexNow no ha funcionado ({e}); el despliegue sí está hecho.')


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    with_private = '--private' in sys.argv
    with_indexnow = '--no-indexnow' not in sys.argv
    extra = [f.strip().lstrip('/') for a in sys.argv if a.startswith('--files=')
             for f in a.split('=', 1)[1].split(',') if f.strip() and '..' not in f]
    to_remove = [r.strip().lstrip('/') for a in sys.argv if a.startswith('--remove=')
                 for r in a.split('=', 1)[1].split(',') if r.strip() and '..' not in r]
    commit = args[0] if args else 'HEAD'
    files = changed_files(commit)
    # Recursos (php, js, css, imágenes) primero y HTML al final
    files += [PREFIX + f for f in extra if PREFIX + f not in files]
    missing = [f for f in files if not os.path.isfile(os.path.join(REPO, f))]
    if missing:
        sys.exit('No existen en local: ' + ', '.join(missing))
    files.sort(key=lambda f: (f.endswith('.html'), f))
    if not files and not with_private and not to_remove:
        print(f'No hay archivos de {PREFIX} en {commit}.')
        return
    print(f'{len(files)} archivos a subir desde {commit}. Conectando...')
    transport = paramiko.Transport((os.environ['HOSTINGER_SSH_HOST'], int(os.environ.get('HOSTINGER_SSH_PORT', '65002'))))
    transport.connect(username=os.environ['HOSTINGER_SSH_USER'], password=os.environ['HOSTINGER_SSH_PASS'])
    sftp = paramiko.SFTPClient.from_transport(transport)
    try:
        if with_private:
            ensure_remote_dir(sftp, posixpath.dirname(PRIVATE_REMOTE))
            sftp.put(os.path.join(REPO, PRIVATE_LOCAL), PRIVATE_REMOTE)
            print(f'[privado] {PRIVATE_REMOTE}')
        for i, f in enumerate(files, 1):
            remote = posixpath.join(REMOTE_DIR, f[len(PREFIX):])
            ensure_remote_dir(sftp, posixpath.dirname(remote))
            sftp.put(os.path.join(REPO, f), remote)
            print(f'[{i}/{len(files)}] {remote}')
        for r in to_remove:
            remote = posixpath.join(REMOTE_DIR, r)
            try:
                sftp.remove(remote)
                print(f'[borrado] {remote}')
            except IOError:
                print(f'[no existe] {remote}')
    finally:
        sftp.close()
        transport.close()
    print('Despliegue completado.')
    if with_indexnow and files:
        notify_indexnow(files)


if __name__ == '__main__':
    main()
