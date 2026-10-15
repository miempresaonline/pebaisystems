# Reglas del repositorio PEBAI Systems

Mapa de proyectos y despliegues: ver `README.md`.

## El repositorio de GitHub es PÚBLICO
- Prohibido commitear credenciales, tokens, URLs de webhooks, IPs o usuarios de servidor. Se leen de `.env` (raíz) o de `C:/programacion/APIs/`.
- Prohibido commitear datos personales: leads, conversaciones, contratos, presupuestos (`documentos/`).
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
- Embudo: VSL `/consultoria-gratuita/` → `/diagnostico/` → `api/lead.php` (email HTML a equipo@ + SQLite privada) → `/formulario-completado/` (WhatsApp en 24 h) → el equipo cualifica y envía `/reservar/?s=<id>` (Cal.com embebido, evento oculto `pebai-systems/sesion-tecnica`) → al reservar redirige a `/confirmacion-de-llamada/?startTime=…`; `api/calcom-webhook.php` marca la cita en el panel. Recordatorios de 24 h y 1 h: cron de hPanel cada 15 min → `api/recordatorios.php` (respaldo: `api/tick.php` con las visitas). (La redirección nativa de Cal.com es de pago: no usarla.) Solicitudes en https://panel.pebaisystems.es (subdominio con carpeta `public_html/panel`; contraseña `PANEL_PASSWORD` del `.env`; `/panel/` redirige allí). Origen del tráfico: `/utm.js` en todas las páginas. Canal y dueño de cada solicitud (acuerdo Adrián–Daniel): `pebai_canal()` en `api/_pebai_lib.php` con los utm + la pregunta "¿Cómo nos conociste?"; si no cuadran manda el formulario y sale "revisar"; se corrige en la ficha del panel (reglas en `docs/enlaces-y-utm.md`).
- No hay bots ni publicación automática de GEO (eliminados el 14/10/2026 por decisión del equipo). No volver a crearlos sin que se pida.
