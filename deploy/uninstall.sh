#!/usr/bin/env bash
# Remove VINC Lab from this server:  sudo bash /opt/vinclab/deploy/uninstall.sh
#
# What it does:
#   - makes a last backup (skip with --no-backup)
#   - stops and removes the vinclab container and its image (docker compose down)
#   - removes the backup timer
#   - removes the web-server site config the installer added (host nginx/Apache/Caddy, nginx-proxy
#     upload-size file); labels for Traefik/caddy-docker-proxy/nginx-proxy go away with the container
# What it never does:
#   - touch the Postgres container, the vinc_lms database, or any other project
#   - delete backups. /opt/vinclab (code, .env, backups) is kept unless you pass --purge,
#     and even then the backups are moved to /root first.
#
# Options: --purge, --remove-certificate (delete the Let's Encrypt certificate), --no-backup, --dry-run

set -Eeuo pipefail

APP_DIR="${VINCLAB_APP_DIR:-/opt/vinclab}"
STATE_FILE="$APP_DIR/.install-state"
SERVICE="vinclab"
UNIT_DIR="/etc/systemd/system"
TEMPLATE_MARK="vinclab-template:"
PURGE=0
REMOVE_CERT=0
DO_BACKUP=1
DRY_RUN=0

if [ -t 1 ]; then
  C_BOLD=$'\e[1m'; C_GREEN=$'\e[32m'; C_RED=$'\e[31m'; C_YELLOW=$'\e[33m'; C_DIM=$'\e[2m'; C_RESET=$'\e[0m'
else
  C_BOLD=""; C_GREEN=""; C_RED=""; C_YELLOW=""; C_DIM=""; C_RESET=""
fi
ok()   { printf '  %s✓%s %s\n' "$C_GREEN" "$C_RESET" "$*"; }
warn() { printf '  %s!%s %s\n' "$C_YELLOW" "$C_RESET" "$*"; }
fail() { printf '  %s✗%s %s\n' "$C_RED" "$C_RESET" "$*" >&2; }
info() { printf '    %s\n' "$*"; }
die()  { fail "$*"; exit 1; }
dry()  { [ "$DRY_RUN" -eq 1 ]; }
run()  { if dry; then printf '    %s[dry-run]%s %s\n' "$C_DIM" "$C_RESET" "$*"; else "$@"; fi; }

kv_get() {
  [ -r "$1" ] || return 0
  local v
  v=$(sed -n "s/^[[:space:]]*$2[[:space:]]*=//p" "$1" | tail -n 1)
  v=${v%$'\r'}; v=${v#[\"\']}; v=${v%[\"\']}
  printf '%s' "$v"
}

dc() { (cd "$APP_DIR" && docker compose "$@"); }

# Files are moved here first, so a failed config test can put them back.
TRASH=""
remove_files() {   # remove_files FILE... ; only files that carry our marker (or links to them)
  local f removed=0
  for f in "$@"; do
    [ -e "$f" ] || [ -L "$f" ] || continue
    if [ -L "$f" ] || grep -qF "$TEMPLATE_MARK" "$f" 2>/dev/null || [[ $f == */vinclab-le-ssl.conf ]]; then
      if dry; then run rm -f "$f"; else
        mkdir -p "$TRASH$(dirname "$f")"; mv -f "$f" "$TRASH$f"
      fi
      info "Removed $f"; removed=1
    else
      warn "Left $f in place (it was not written by the installer)."
    fi
  done
  [ "$removed" -eq 1 ]
}

restore_files() {
  [ -n "$TRASH" ] && [ -d "$TRASH" ] || return 0
  (cd "$TRASH" && find . \( -type f -o -type l \) -print) | while read -r f; do
    mv -f "$TRASH/${f#./}" "/${f#./}"
  done
}

remove_nginx() {
  command -v nginx >/dev/null 2>&1 || return 0
  remove_files /etc/nginx/sites-enabled/vinclab /etc/nginx/sites-available/vinclab /etc/nginx/conf.d/vinclab.conf || return 0
  if dry; then run nginx -t; run systemctl reload nginx; return 0; fi
  if nginx -t >/dev/null 2>&1; then
    systemctl reload nginx && ok "nginx no longer serves the VINC Lab site"
  else
    restore_files; fail "nginx -t failed after removing our site, so it was put back. Check: sudo nginx -t"
  fi
}

remove_apache() {
  command -v apache2ctl >/dev/null 2>&1 || return 0
  [ -e /etc/apache2/sites-available/vinclab.conf ] || [ -e /etc/apache2/sites-available/vinclab-le-ssl.conf ] || return 0
  run a2dissite -q vinclab-le-ssl >/dev/null 2>&1 || true
  run a2dissite -q vinclab >/dev/null 2>&1 || true
  remove_files /etc/apache2/sites-available/vinclab.conf /etc/apache2/sites-available/vinclab-le-ssl.conf || return 0
  if dry; then run apache2ctl configtest; run systemctl reload apache2; return 0; fi
  if apache2ctl configtest >/dev/null 2>&1; then
    systemctl reload apache2 && ok "Apache no longer serves the VINC Lab site"
  else
    restore_files; a2ensite -q vinclab >/dev/null 2>&1 || true
    fail "apachectl configtest failed after removing our site, so it was put back."
  fi
}

# Our marked block in a Caddy container's Caddyfile (entry: caddy-container:CONTAINER:HOSTFILE:CONFIG).
remove_container_caddy() {
  local rest c host cfg bak
  rest=${1#caddy-container:}; c=${rest%%:*}; rest=${rest#*:}; host=${rest%%:*}; cfg=${rest#*:}
  [ -f "$host" ] || return 0
  grep -qF '# >>> vinclab (added by' "$host" || return 0
  if dry; then run "remove the vinclab block from $host, then: docker exec $c caddy reload"; return 0; fi
  bak=$(mktemp); cp -p "$host" "$bak"
  awk '/^# >>> vinclab \(added by/ {skip = 1; next} /^# <<< vinclab <<</ {skip = 0; next} !skip' "$bak" >"$bak.new"
  cat "$bak.new" >"$host"   # in place, so a single-file bind mount keeps seeing it
  if docker exec "$c" caddy validate --config "$cfg" --adapter caddyfile >/dev/null 2>&1; then
    docker exec -w "$(dirname "$cfg")" "$c" caddy reload --config "$cfg" --adapter caddyfile >/dev/null 2>&1 \
      && ok "Caddy (container $c) no longer serves the VINC Lab site" \
      || warn "Removed our block from $host; restart Caddy to apply it: sudo docker restart $c"
  else
    cat "$bak" >"$host"; fail "Caddy rejected its configuration without our block, so $host was put back."
  fi
  rm -f "$bak" "$bak.new"
}

remove_caddy() {
  [ -e /etc/caddy/sites/vinclab.caddy ] || return 0
  remove_files /etc/caddy/sites/vinclab.caddy || return 0
  if dry; then run systemctl reload caddy; return 0; fi
  if caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null 2>&1; then
    systemctl reload caddy && ok "Caddy no longer serves the VINC Lab site"
    info "(The line 'import /etc/caddy/sites/*.caddy' in /etc/caddy/Caddyfile is harmless and was kept.)"
  else
    restore_files; fail "Caddy rejected its configuration after removing our site, so it was put back."
  fi
}

main() {
  while [ $# -gt 0 ]; do
    case $1 in
      --purge) PURGE=1 ;;
      --remove-certificate) REMOVE_CERT=1 ;;
      --no-backup) DO_BACKUP=0 ;;
      --dry-run) DRY_RUN=1 ;;
      -h|--help) sed -n '2,16p' "$0" 2>/dev/null | sed 's/^# \{0,1\}//'; exit 0 ;;
      *) die "Unknown option: $1" ;;
    esac
    shift
  done
  [ "$(id -u)" -eq 0 ] || dry || die "Please run as root:  sudo bash $APP_DIR/deploy/uninstall.sh"
  TRASH=$(mktemp -d)
  trap 'rm -rf "$TRASH"' EXIT

  local domain mode files f
  domain=$(kv_get "$STATE_FILE" DOMAIN); domain=${domain:-lms.vinc-lab.com}
  mode=$(kv_get "$STATE_FILE" MODE)
  files=$(kv_get "$STATE_FILE" PROXY_FILES)
  printf '%sRemoving VINC Lab%s (%s%s)\n' "$C_BOLD" "$C_RESET" "$domain" "${mode:+, $mode mode}"

  if [ "$PURGE" -eq 1 ] && ! dry; then
    printf '\n  %s--purge%s also deletes %s (code and settings, including the database password).\n' "$C_BOLD" "$C_RESET" "$APP_DIR"
    printf '  Backups are moved to /root first. The database itself is NOT deleted.\n'
    (exec </dev/tty) 2>/dev/null || die "--purge needs a terminal to confirm."
    local answer=""
    printf '  Type DELETE to continue: ' >/dev/tty
    IFS= read -r answer </dev/tty || true
    [ "$answer" = DELETE ] || die "Cancelled; nothing was removed."
  fi

  # 1. Last backup
  if [ "$DO_BACKUP" -eq 1 ] && command -v docker >/dev/null 2>&1 \
     && [ "$(docker inspect -f '{{.State.Running}}' "$SERVICE" 2>/dev/null)" = true ]; then
    info "Making a last backup..."
    if dry; then run docker compose exec -T "$SERVICE" node server/backup.js
    elif dc exec -T "$SERVICE" node server/backup.js; then ok "Backup saved in $APP_DIR/backups"
    else die "The backup failed, so nothing was removed. Use --no-backup to skip it."; fi
  fi

  # 2. Container + image (external networks and other projects are not touched)
  if [ -f "$APP_DIR/docker-compose.yml" ] && command -v docker >/dev/null 2>&1; then
    if dry; then run docker compose down --rmi all --remove-orphans
    else dc down --rmi all --remove-orphans && ok "Stopped and removed the vinclab container and image"; fi
  fi

  # 3. Backup timer
  if [ -e "$UNIT_DIR/$SERVICE-backup.timer" ] || [ -e "$UNIT_DIR/$SERVICE-backup.service" ]; then
    run systemctl disable -q --now "$SERVICE-backup.timer" 2>/dev/null || true
    run rm -f "$UNIT_DIR/$SERVICE-backup.timer" "$UNIT_DIR/$SERVICE-backup.service"
    run systemctl daemon-reload || true
    ok "Removed the backup timer"
  fi
  if [ -e "/etc/cron.d/$SERVICE-backup" ]; then run rm -f "/etc/cron.d/$SERVICE-backup"; ok "Removed the backup cron entry"; fi

  # 4. Web-server config we added
  remove_nginx
  remove_apache
  remove_caddy
  for f in $files; do
    case $f in caddy-container:*) remove_container_caddy "$f"; continue ;; esac
    case $f in /etc/nginx/*|/etc/apache2/*|/etc/caddy/*) ;; *)   # e.g. nginx-proxy vhost.d file
      remove_files "$f" || true ;;
    esac
  done
  if [ "$REMOVE_CERT" -eq 1 ] && command -v certbot >/dev/null 2>&1 && [ -d "/etc/letsencrypt/live/$domain" ]; then
    run certbot delete --cert-name "$domain" --non-interactive && ok "Deleted the certificate for $domain"
  fi

  # 5. Files
  if [ "$PURGE" -eq 1 ]; then
    local keep
    keep="/root/vinclab-backups-$(date +%Y%m%d-%H%M%S)"
    if [ -d "$APP_DIR/backups" ]; then run mv "$APP_DIR/backups" "$keep" && ok "Backups moved to $keep"; fi
    run rm -rf "$APP_DIR"
    ok "Deleted $APP_DIR"
  else
    ok "Kept $APP_DIR (code, .env and backups). Delete it later with --purge."
  fi

  # 6. Database (manual, on purpose)
  if [ "$(kv_get "$STATE_FILE" DB_KIND 2>/dev/null)" = own ] || docker volume inspect vinclab-pgdata >/dev/null 2>&1; then
    cat <<EOF

  The app's own database container was removed, but its data was ${C_BOLD}not${C_RESET} deleted: it stays in
  the Docker volume 'vinclab-pgdata', and installing again picks it up. To delete it for good
  (this cannot be undone):
    sudo docker volume rm vinclab-pgdata

EOF
    dry && printf '%sDry run finished - nothing was changed.%s\n' "$C_BOLD" "$C_RESET"
    return 0
  fi
  local pg
  pg=$(docker ps --format '{{.Names}} {{.Ports}}' 2>/dev/null | awk '/->5432\/tcp/ {print $1; exit}' || true)
  cat <<EOF

  The vinc_lms database was ${C_BOLD}not${C_RESET} deleted. To delete it for good (this cannot be undone):
    sudo docker exec -it ${pg:-<postgres-container>} psql -U <superuser> -d postgres \\
      -c 'DROP DATABASE vinc_lms;' -c 'DROP ROLE vinc_lms;'
  (<superuser> is the POSTGRES_USER of that container, often 'postgres'.)

EOF
  dry && printf '%sDry run finished - nothing was changed.%s\n' "$C_BOLD" "$C_RESET"
  return 0
}

main "$@"; exit $?
