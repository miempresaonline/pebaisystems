import os
import sys
import posixpath
import paramiko

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

def deploy():
    if not os.path.isdir(LOCAL_DIST):
        print(f"Error: Local build folder '{LOCAL_DIST}' not found.", file=sys.stderr)
        sys.exit(1)

    print(f"Connecting to Hostinger ({HOST}:{PORT})...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    ssh_dir = os.path.expanduser('~/.ssh')
    key_candidates = [
        os.path.join(ssh_dir, 'id_ed25519_pebai'),
        os.path.join(ssh_dir, 'id_rsa_pebai'),
        os.path.join(ssh_dir, 'id_ed25519'),
        os.path.join(ssh_dir, 'id_rsa')
    ]
    existing_keys = [k for k in key_candidates if os.path.isfile(k)]

    try:
        client.connect(
            HOST,
            port=PORT,
            username=USER,
            password=PASS,
            key_filename=existing_keys if existing_keys else None,
            look_for_keys=True,
            timeout=25
        )
        transport = client.get_transport()
        if transport:
            transport.set_keepalive(15)
        sftp = client.open_sftp()
        print("Connected successfully.")

        try:
            sftp.remove(posixpath.join(REMOTE_DIR, 'default.php'))
            print("Removed default.php placeholder from host.")
        except IOError:
            pass

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
                display_name = posixpath.join(rel_dir, file) if rel_dir != '.' else file
                local_size = os.path.getsize(local_file_path)
                _, ext = os.path.splitext(file)

                if ext.lower() not in code_exts:
                    try:
                        remote_stat = sftp.stat(remote_file_path)
                        if remote_stat.st_size == local_size:
                            skipped_count += 1
                            continue
                    except IOError:
                        pass

                print(f"Uploading: {display_name}")
                sftp.put(local_file_path, remote_file_path)
                uploaded_count += 1

        sftp.close()
        client.close()
        print(f"\n[OK] Deployment completed successfully! ({uploaded_count} uploaded, {skipped_count} skipped)")

    except Exception as e:
        print(f"\n[ERROR] Deployment failed: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    deploy()
