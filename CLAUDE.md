# Reglas del repositorio PEBAI Systems

Mapa de proyectos y despliegues: ver `README.md`.

## El repositorio de GitHub es PÚBLICO
- Prohibido commitear credenciales, tokens, URLs de webhooks, IPs o usuarios de servidor. Se leen de `.env` (raíz para Hostinger/carruseles, `.env` propio en cada bot) o de `C:/programacion/APIs/`.
- Prohibido commitear datos personales: leads, conversaciones, contratos, presupuestos (`documentos/`), sesiones de navegador (`social-media-engine/sessions/`, `whatsapp-outreach-bot/session/`).
- `privado/`, `scratch/`, `documentos/` y `assets/clients/` son solo locales. Nunca `git add -f`.
- Antes de cada commit: revisar la lista de archivos y pasar un escaneo de secretos sobre lo que se va a subir.
- Nuevas variables de entorno → añadirlas vacías a `.env.example` correspondiente.

## Orden
- Archivos de prueba, capturas, vídeos y dumps van a `scratch/`, no a la raíz ni a los proyectos.
- Documentación en `docs/`, ideas de negocio en `ideas/`, scripts de despliegue en `deploy/`.
- Commits pequeños por proyecto (`feat(website): …`, `fix(carousel-engine): …`), push directo a `main`.

## Hostinger
- `website-pebai/dist/` es la web en producción; se sube con `website-pebai/scripts/deploy.py`.
- Desplegar solo lo de un commit: `python website-pebai/scripts/deploy_changed.py <commit>` (una sola conexión SFTP, HTML al final). `--private` sube además `website-pebai/private/config.php` (SMTP, hash del panel) a `domains/pebaisystems.es/private/`, fuera de public_html.
- Embudo: VSL `/consultoria-gratuita/` → `/diagnostico/` → `api/lead.php` (email HTML a equipo@ + SQLite privada) → `/formulario-completado/` (WhatsApp en 24 h) → reserva por Cal.com → `/confirmacion-de-llamada/?startTime=…`. Solicitudes en `/panel/` (contraseña `PANEL_PASSWORD` del `.env`). Origen del tráfico: `/utm.js` en todas las páginas.
- Los PHP con claves (`website-pebai/api/cron_publish.php`, `send_alert.php`, `dist/api/diagnostico.php`) están ignorados: siguen funcionando en el servidor pero no se versionan hasta migrar sus claves a `secrets.local.php`.
