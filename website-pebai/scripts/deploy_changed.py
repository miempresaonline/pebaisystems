"""Sube a Hostinger solo los archivos de website-pebai/dist que cambiaron en un commit.

Uso:  python website-pebai/scripts/deploy_changed.py <commit> [--private]   (por defecto HEAD)

Abre una única conexión SFTP para todos los archivos (evita bloqueos de IP por
conexiones repetidas) y sube cada archivo siempre, sin comparar tamaños.
Los HTML se suben al final, para que nunca apunten a un recurso que aún no existe
(Cloudflare cachea los 404).
--private  sube también website-pebai/private/config.php a
           domains/pebaisystems.es/private/ (fuera de public_html).
"""
import os
import sys
import posixpath
import subprocess
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


def changed_files(commit):
    out = subprocess.run(
        ['git', 'show', '--name-only', '--diff-filter=AM', '--pretty=format:', commit, '--', PREFIX],
        cwd=REPO, capture_output=True, text=True, check=True,
    ).stdout
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


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    with_private = '--private' in sys.argv
    commit = args[0] if args else 'HEAD'
    files = changed_files(commit)
    # Recursos (php, js, css, imágenes) primero y HTML al final
    files.sort(key=lambda f: (f.endswith('.html'), f))
    if not files and not with_private:
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
    finally:
        sftp.close()
        transport.close()
    print('Despliegue completado.')


if __name__ == '__main__':
    main()
