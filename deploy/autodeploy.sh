#!/bin/bash
# Auto-despliegue de la web: corre en Hostinger con PM2 (pebai-autodeploy).
# Cada 2 minutos mira main en GitHub y copia a public_html los archivos de
# website-pebai/dist/ que cambiaron (recursos primero, HTML al final, como deploy_changed.py).
# Así los agentes de la nube publican con un push, sin SSH. No borra nada del servidor.
# Instalación: clon sparse de website-pebai/dist en ~/pebai-autodeploy/repo y
#   pm2 start ~/pebai-autodeploy/autodeploy.sh --name pebai-autodeploy && pm2 save

BASE="$HOME/pebai-autodeploy"
REPO="$BASE/repo"
WEB="$HOME/domains/pebaisystems.es/public_html"
ESTADO="$BASE/ultimo"
LOG="$BASE/deploy.log"
PREFIJO="website-pebai/dist/"
SITE="https://pebaisystems.es"
ESPERA=120

log() { echo "$(date '+%F %T') $*" >> "$LOG"; }

cd "$REPO" || { log "No existe $REPO"; exit 1; }
# Nunca dos a la vez (un reinicio de PM2 puede dejar el anterior vivo): espera a que el otro acabe
exec 9>"$BASE/lock"
flock 9
git fetch -q origin main 2>>"$LOG"
# Primera vez: se da por publicado lo que ya hay en main
[ -s "$ESTADO" ] || git rev-parse origin/main > "$ESTADO"
log "Arranca (último publicado: $(cut -c1-7 "$ESTADO"))"

indexnow() {
  # Avisa a IndexNow de las páginas públicas indexables que cambiaron
  local clave urls="" f rel
  clave=$(ls "$REPO/$PREFIJO" | grep -E '^[0-9a-f]{32}\.txt$' | head -1 | cut -d. -f1)
  [ -n "$clave" ] || return
  for f in "$@"; do
    rel="${f#$PREFIJO}"
    case "$rel" in panel/*|api/*|scratch/*) continue ;; esac
    case "$rel" in *index.html) ;; *) continue ;; esac
    head -c 20000 "$REPO/$f" | grep -qiE "<meta[^>]+name=[\"']robots[\"'][^>]+content=[\"'][^\"']*noindex" && continue
    urls="$urls\"$SITE/${rel%index.html}\","
  done
  [ -n "$urls" ] || return
  urls="$urls\"$SITE/sitemap.xml\""
  local codigo
  codigo=$(curl -s -o /dev/null -w '%{http_code}' -m 15 -H 'Content-Type: application/json; charset=utf-8' \
    -d "{\"host\":\"pebaisystems.es\",\"key\":\"$clave\",\"keyLocation\":\"$SITE/$clave.txt\",\"urlList\":[$urls]}" \
    https://api.indexnow.org/indexnow)
  log "IndexNow -> HTTP $codigo"
}

precarga() {
  # Hostinger da 429 a GPTBot y ClaudeBot. Una regla de caché de Cloudflare sirve las páginas a los bots
  # de IA desde su caché (4 h); aquí se rellena cada 3 h para que nunca lleguen al servidor.
  local f rel n=0
  while IFS= read -r f; do
    rel="${f#$REPO/$PREFIJO}"
    case "$rel" in panel/*|api/*|para/*|baja/*|scratch/*) continue ;; esac
    curl -s -o /dev/null -m 20 -A 'Mozilla/5.0 (compatible; pebai-precarga/1.0)' "$SITE/${rel%index.html}" && n=$((n+1))
    sleep 1
  done <<< "$(find "$REPO/$PREFIJO" -name index.html)"
  for f in robots.txt llms.txt sitemap.xml; do curl -s -o /dev/null -m 20 -A 'Mozilla/5.0 (compatible; pebai-precarga/1.0)' "$SITE/$f"; done
  date +%s > "$BASE/precarga"
  log "Precarga de caché para bots: $n páginas"
}

while true; do
  # Precarga de la caché para los bots de IA cada 3 h
  [ $(( $(date +%s) - $(cat "$BASE/precarga" 2>/dev/null || echo 0) )) -ge 10800 ] && precarga
  if git fetch -q origin main 2>>"$LOG"; then
    nuevo=$(git rev-parse origin/main)
    viejo=$(cat "$ESTADO")
    if [ "$nuevo" != "$viejo" ]; then
      # Sin "< <(...)": bajo PM2 no hay /dev/fd
      lista=$(git -c core.quotepath=off diff --name-only --diff-filter=AMR "$viejo" "$nuevo" -- "$PREFIJO") \
        || { log "ERROR en git diff ${viejo:0:7}..${nuevo:0:7}"; sleep "$ESPERA"; continue; }
      cambios=()
      [ -n "$lista" ] && mapfile -t cambios <<< "$lista"
      if git reset -q --hard "$nuevo" 2>>"$LOG"; then
        ok=1
        # Recursos primero, HTML al final (Cloudflare cachea los 404)
        for fase in recursos html; do
          for f in "${cambios[@]}"; do
            case "$f" in *.html) [ $fase = html ] || continue ;; *) [ $fase = recursos ] || continue ;; esac
            [ -f "$REPO/$f" ] || continue
            destino="$WEB/${f#$PREFIJO}"
            mkdir -p "$(dirname "$destino")" && cp "$REPO/$f" "$destino.tmp" && mv "$destino.tmp" "$destino" \
              || { ok=0; log "ERROR copiando $f"; }
          done
        done
        if [ $ok = 1 ]; then
          echo "$nuevo" > "$ESTADO"
          log "Publicado ${nuevo:0:7}: ${#cambios[@]} archivos ${cambios[*]#$PREFIJO}"
          [ ${#cambios[@]} -gt 0 ] && indexnow "${cambios[@]}"
        fi
      else
        log "ERROR en git reset a ${nuevo:0:7}"
      fi
    fi
  else
    log "ERROR en git fetch"
  fi
  sleep "$ESPERA"
done
