#!/usr/bin/env bash
# Update VINC Lab to the latest code:  sudo bash /opt/vinclab/deploy/update.sh
#
#   1. makes a database backup (skip with --no-backup)
#   2. downloads the latest code (git fetch + reset to origin/<branch>)
#   3. rebuilds and restarts the container (docker compose up -d --build)
#   4. checks the app answers /api/health and prints the deployed commit
#
# Options: --branch NAME (default: the branch already deployed, else main), --no-backup, --dry-run
# Networking/proxy settings are not changed; run deploy/install.sh again for that.

set -Eeuo pipefail

APP_DIR="${VINCLAB_APP_DIR:-/opt/vinclab}"
SERVICE="vinclab"
BRANCH=""
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

dc() { (cd "$APP_DIR" && docker compose "$@"); }

kv_get() {
  [ -r "$1" ] || return 0
  local v
  v=$(sed -n "s/^[[:space:]]*$2[[:space:]]*=//p" "$1" | tail -n 1)
  v=${v%$'\r'}; v=${v#[\"\']}; v=${v%[\"\']}
  printf '%s' "$v"
}

app_health() {
  dc exec -T "$SERVICE" wget -qO- "http://127.0.0.1:$PORT/api/health" 2>/dev/null | grep -Eq '"ok"[[:space:]]*:[[:space:]]*true'
}

main() {
  while [ $# -gt 0 ]; do
    case $1 in
      --branch) [ $# -ge 2 ] || die "--branch needs a value"; BRANCH=$2; shift ;;
      --branch=*) BRANCH=${1#*=} ;;
      --no-backup) DO_BACKUP=0 ;;
      --dry-run) DRY_RUN=1 ;;
      -h|--help) sed -n '2,11p' "$0" 2>/dev/null | sed 's/^# \{0,1\}//'; exit 0 ;;
      *) die "Unknown option: $1" ;;
    esac
    shift
  done

  printf '%sUpdating VINC Lab%s\n' "$C_BOLD" "$C_RESET"
  [ "$(id -u)" -eq 0 ] || dry || die "Please run as root:  sudo bash $APP_DIR/deploy/update.sh"
  [ -d "$APP_DIR/.git" ] || die "$APP_DIR is not installed yet. Run deploy/install.sh first."
  [ -f "$APP_DIR/.env" ] || die "$APP_DIR/.env is missing. Run deploy/install.sh first."
  command -v docker >/dev/null 2>&1 || die "Docker is not installed."
  PORT=$(kv_get "$APP_DIR/.env" PORT); PORT=${PORT:-3100}

  if [ -z "$BRANCH" ]; then
    BRANCH=$(git -C "$APP_DIR" symbolic-ref --short -q HEAD || echo main)
  fi
  [[ $BRANCH =~ ^[A-Za-z0-9._/-]+$ ]] || die "Not a valid branch name: $BRANCH"
  local old new
  old=$(git -C "$APP_DIR" rev-parse --short HEAD)

  # 1. Backup
  if [ "$DO_BACKUP" -eq 1 ]; then
    if [ "$(docker inspect -f '{{.State.Running}}' "$SERVICE" 2>/dev/null)" = true ]; then
      info "Making a backup first..."
      if dry; then run docker compose exec -T "$SERVICE" node server/backup.js
      elif dc exec -T "$SERVICE" node server/backup.js; then ok "Backup saved in $APP_DIR/backups"
      else die "The backup failed, so nothing was updated. Fix it, or run with --no-backup to skip it."; fi
    else
      warn "The app is not running, so no backup was made before updating."
    fi
  fi

  # 2. Code
  info "Downloading the latest '$BRANCH'..."
  if dry; then
    run git -C "$APP_DIR" fetch --prune origin "$BRANCH"
  elif ! GIT_TERMINAL_PROMPT=0 git -C "$APP_DIR" fetch -q --prune origin "+refs/heads/$BRANCH:refs/remotes/origin/$BRANCH" </dev/null; then
    fail "Could not download the code."
    info "If the GitHub token expired, run:  sudo bash $APP_DIR/deploy/install.sh  (it asks for a new one)."
    exit 1
  fi
  run git -C "$APP_DIR" checkout -q -f -B "$BRANCH" "origin/$BRANCH"
  run git -C "$APP_DIR" reset -q --hard "origin/$BRANCH"
  new=$(git -C "$APP_DIR" rev-parse --short HEAD)
  if [ "$old" = "$new" ]; then
    ok "Already at the latest code ($new); rebuilding anyway"
  else
    ok "Code updated $old -> $new"
    git -C "$APP_DIR" log --oneline --no-decorate "$old..$new" 2>/dev/null | head -n 15 | sed 's/^/      /' || true
  fi

  # 3. Rebuild + restart
  info "Rebuilding and restarting the container..."
  if dry; then
    run docker compose up -d --build --remove-orphans
    printf '\n%sDry run finished - nothing was changed.%s\n' "$C_BOLD" "$C_RESET"
    return 0
  fi
  dc up -d --build --remove-orphans || die "Rebuilding the container failed. To go back: sudo git -C $APP_DIR reset --hard $old && cd $APP_DIR && sudo docker compose up -d --build"
  docker image prune -f --filter label=org.vinclab.app=vinclab >/dev/null 2>&1 || true

  # 4. Health
  local i healthy=0
  for ((i = 1; i <= 30; i++)); do
    if app_health; then healthy=1; break; fi
    sleep 2
  done
  if [ "$healthy" -eq 1 ]; then
    ok "The app is running"
    printf '\n  %sDeployed:%s %s\n\n' "$C_BOLD" "$C_RESET" "$(git -C "$APP_DIR" log -1 --format='%h %s (%cd)' --date=short)"
  else
    fail "The app is not answering after the update. Last log lines:"
    dc logs --tail 40 "$SERVICE" 2>&1 | sed 's/^/      /' >&2 || true
    info "To go back to the previous version ($old):"
    info "  sudo git -C $APP_DIR reset --hard $old && cd $APP_DIR && sudo docker compose up -d --build"
    info "If the database was changed by the new version, restore the backup made above (see DEPLOY.md)."
    exit 1
  fi
}

main "$@"; exit $?
