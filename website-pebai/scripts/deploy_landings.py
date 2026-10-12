import os
import sys
import time
import posixpath
import urllib.request
import paramiko

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# Credenciales SSH de Hostinger: se leen de PAI Systems/.env (nunca en el codigo)
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), os.pardir, os.pardir, '.env'))
except ImportError:
    pass
HOST = os.environ['HOSTINGER_SSH_HOST']
PORT = int(os.environ.get('HOSTINGER_SSH_PORT', '65002'))
USER = os.environ['HOSTINGER_SSH_USER']
PASS = os.environ['HOSTINGER_SSH_PASS']
REMOTE_DIR = 'domains/pebaisystems.es/public_html'

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
LOCAL_DIST = os.path.join(PROJECT_DIR, 'dist')

def ensure_remote_dir(sftp, remote_path):
    dirs_to_create = []
    current = remote_path
    while current not in ('', '.', '/'):
        try:
            sftp.stat(current)
            break
        except IOError:
            dirs_to_create.append(current)
            current = posixpath.dirname(current)
    for d in reversed(dirs_to_create):
        try:
            sftp.mkdir(d)
        except IOError:
            pass

def print_progress(transferred, total):
    percent = (transferred / total) * 100
    mb_transferred = transferred / (1024 * 1024)
    mb_total = total / (1024 * 1024)
    sys.stdout.write(f"\r  Uploading: {percent:.1f}% ({mb_transferred:.2f} MB / {mb_total:.2f} MB)")
    sys.stdout.flush()

def deploy_landings():
    if not os.path.isdir(LOCAL_DIST):
        print(f"Error: Local build folder '{LOCAL_DIST}' not found.", file=sys.stderr)
        sys.exit(1)

    print("=" * 60)
    print("PEBAI SYSTEMS - DEPLOY A PRODUCCIÓN (HOSTINGER)")
    print("=" * 60)
    print(f"Conectando a {HOST}:{PORT}...")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        client.connect(
            HOST,
            port=PORT,
            username=USER,
            password=PASS,
            timeout=25
        )
        transport = client.get_transport()
        if transport:
            transport.set_keepalive(15)
        sftp = client.open_sftp()
        print("✓ Conexión SFTP establecida con éxito.\n")

        # 1. Archivos prioritarios del embudo de 3 landings + vídeo
        priority_files = [
            'consultoria-gratuita/index.html',
            'confirmacion-de-llamada/index.html',
            'formulario-completado/index.html',
            'video/stock_prescripcion.mp4',
            'custom-enhancements.css',
            'app.js',
            'pebai-tilt.js',
            'index.html',
            'sitemap.xml'
        ]

        print("--- PASO 1: Subiendo las 3 Landings y Recursos Clave ---")
        for rel_path in priority_files:
            local_path = os.path.join(LOCAL_DIST, rel_path.replace('/', os.sep))
            if not os.path.exists(local_path):
                print(f"  [AVISO] Archivo local no existe: {rel_path}")
                continue

            remote_path = posixpath.join(REMOTE_DIR, rel_path)
            ensure_remote_dir(sftp, posixpath.dirname(remote_path))

            local_size = os.path.getsize(local_path)
            print(f"Subiendo: {rel_path} ({local_size / 1024:.1f} KB)...")
            
            if local_size > 5 * 1024 * 1024: # Más de 5MB, mostrar progreso
                sftp.put(local_path, remote_path, callback=print_progress)
                print("\n  ✓ Completado.")
            else:
                sftp.put(local_path, remote_path)
                print("  ✓ Completado.")

        # 2. Sincronización completa de la carpeta dist (para cualquier otro archivo nuevo o modificado)
        print("\n--- PASO 2: Sincronizando resto de archivos en dist ---")
        uploaded_count = 0
        skipped_count = 0
        code_exts = {'.html', '.css', '.js', '.php', '.xml', '.txt', '.htaccess', '.json', '.md'}

        for root, dirs, files in os.walk(LOCAL_DIST):
            rel_dir = os.path.relpath(root, LOCAL_DIST).replace('\\', '/')
            remote_target_dir = REMOTE_DIR if rel_dir == '.' else posixpath.join(REMOTE_DIR, rel_dir)
            ensure_remote_dir(sftp, remote_target_dir)

            for file in files:
                local_file_path = os.path.join(root, file)
                remote_file_path = posixpath.join(remote_target_dir, file)
                rel_file = posixpath.join(rel_dir, file) if rel_dir != '.' else file

                # Ya subido en el paso 1
                if rel_file in priority_files:
                    continue

                local_size = os.path.getsize(local_file_path)
                _, ext = os.path.splitext(file)

                # Si ya existe con el mismo tamaño en remoto, saltar para ahorrar tiempo
                try:
                    remote_stat = sftp.stat(remote_file_path)
                    if remote_stat.st_size == local_size:
                        skipped_count += 1
                        continue
                except IOError:
                    pass

                print(f"  Subiendo: {rel_file}")
                sftp.put(local_file_path, remote_file_path)
                uploaded_count += 1

        sftp.close()
        client.close()
        print(f"\n✓ Despliegue en SFTP finalizado: {uploaded_count} archivos actualizados, {skipped_count} ya estaban al día.")

        # 3. Verificación HTTP en vivo en producción
        print("\n--- PASO 3: Verificación HTTP en producción (pebaisystems.es) ---")
        urls_to_test = [
            "https://pebaisystems.es/consultoria-gratuita/",
            "https://pebaisystems.es/confirmacion-de-llamada/",
            "https://pebaisystems.es/formulario-completado/",
            "https://pebaisystems.es/video/stock_prescripcion.mp4"
        ]

        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) PEBAI-Deploy-Verifier/1.0'}
        for url in urls_to_test:
            try:
                req = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(req, timeout=10) as response:
                    print(f"  [HTTP {response.status}] {url} -> OK")
            except Exception as e:
                print(f"  [ERROR] {url} -> {e}")

        print("\n" + "=" * 60)
        print("¡DESPLIEGUE A PRODUCCIÓN COMPLETADO CON ÉXITO!")
        print("=" * 60)

    except Exception as e:
        print(f"\n[ERROR] Falló el despliegue: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    deploy_landings()
