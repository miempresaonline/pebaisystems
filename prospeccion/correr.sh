#!/bin/bash
# Lanza una tanda de prospección en el servidor de Hostinger (sin el PC). Una sola a la vez (flock).
# Por defecto, el barrido continuo de instaladoras solares (python -m prospeccion.tanda solar): al acabar una vuelta empieza otra.
# Reanudable: salta las provincias ya hechas. Lo usa el cron de hPanel cada 30 min como red de seguridad.
# Uso: ~/prospeccion/correr.sh energia
cd "$HOME/prospeccion" || exit 1
# Pausa: si existe ~/prospeccion/PAUSA no arranca nada (para revisar listas antes de seguir). Quitarla para reanudar.
[ -f "$HOME/prospeccion/PAUSA" ] && exit 0
export AGENT_TOKEN=$(grep '^AGENT_TOKEN=' "$HOME/agente-whatsapp/.env" | cut -d= -f2)
export PYTHONIOENCODING=utf-8
# Scrapers a la vez (21/10): placas solares, climatización y formación (oposiciones, formación especializada e idiomas).
# Cada uno con su candado: si ya está en marcha, no se duplica. Sin argumento (o con «energia», lo que pasa el cron) arranca los tres.
# 27/10: más clínicas dentales e inmobiliarias (orden de Daniel)
# 27/10 noche: reformas integrales, cocinas y baños (orden de Daniel; solo se revisan, aún no se les escribe)
SERIES="solar climatizacion formacion dental inmobiliaria reforma"
[ -n "$1" ] && [ "$1" != energia ] && SERIES="$1"
mkdir -p "$HOME/scratch/prospeccion"
for NICHO in $SERIES; do
  # Una serie que dio una vuelta entera a España casi sin nada nuevo se para sola (la crea tanda.py); quitar el archivo para reanudar
  [ -f "$HOME/prospeccion/PAUSA_$NICHO" ] && continue
  LOCK=/tmp/pebai-prospeccion.lock
  [ "$NICHO" != solar ] && LOCK=/tmp/pebai-prospeccion-$NICHO.lock
  # Se lanza aparte (setsid): el cron de hPanel corta sus tareas a los 30 min y una provincia grande tarda más.
  setsid nohup flock -n "$LOCK" .venv/bin/python -u -m prospeccion.tanda "$NICHO" >> "$HOME/scratch/prospeccion/tanda_$NICHO.log" 2>&1 < /dev/null &
done
# Con todas las series paradas (España recorrida), no se queda quieto: repasa la cola poco a poco (26/10, ver revisar_cola.php)
if [ -f "$HOME/prospeccion/PAUSA_solar" ] && [ -f "$HOME/prospeccion/PAUSA_climatizacion" ] && [ -f "$HOME/prospeccion/PAUSA_formacion" ] \
   && [ -f "$HOME/prospeccion/PAUSA_dental" ] && [ -f "$HOME/prospeccion/PAUSA_inmobiliaria" ] && [ -f "$HOME/prospeccion/PAUSA_reforma" ]; then
  flock -n /tmp/pebai-revision.lock php "$HOME/prospeccion/revisar_cola.php" 40 >> "$HOME/scratch/prospeccion/revision.log" 2>&1
fi
exit 0
