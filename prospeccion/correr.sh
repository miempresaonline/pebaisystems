#!/bin/bash
# Lanza una tanda de prospección en el servidor de Hostinger (sin el PC). Una sola a la vez (flock).
# Reanudable: salta las provincias ya hechas. Lo usa el cron de hPanel cada 30 min como red de seguridad.
# Uso: ~/prospeccion/correr.sh energia
cd "$HOME/prospeccion" || exit 1
# Pausa: si existe ~/prospeccion/PAUSA no arranca nada (para revisar listas antes de seguir). Quitarla para reanudar.
[ -f "$HOME/prospeccion/PAUSA" ] && exit 0
export AGENT_TOKEN=$(grep '^AGENT_TOKEN=' "$HOME/agente-whatsapp/.env" | cut -d= -f2)
export PYTHONIOENCODING=utf-8
NICHO="${1:-energia}"
mkdir -p "$HOME/scratch/prospeccion"
exec flock -n /tmp/pebai-prospeccion.lock .venv/bin/python -u -m prospeccion.tanda "$NICHO" >> "$HOME/scratch/prospeccion/tanda_$NICHO.log" 2>&1
