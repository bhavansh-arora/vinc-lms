#!/usr/bin/env bash
# VINC Lab installer for a shared Docker VPS (Ubuntu/Debian).
#
# The app runs as its own Docker Compose project in /opt/vinclab and stores its data in a
# PostgreSQL database (vinc_lms) inside an existing Postgres container. The installer finds the
# reverse proxy that already serves ports 80/443 and connects the app to it without changing
# any other site.
#
# One-line install (public repo):
#   curl -fsSL https://raw.githubusercontent.com/bhavansh-arora/vinc-lms/main/deploy/install.sh \
#     | sudo bash -s -- --domain lms.vinc-lab.com
#
# Or, from a checkout of the repo:
#   sudo bash deploy/install.sh --domain lms.vinc-lab.com
#
# Safe to run again at any time (repairs/updates; never deletes data).
# --help lists all options; --dry-run shows what would happen without changing anything.
#
# Everything is inside functions and the last line calls main, so the whole file is read before
# anything runs (important for `curl | bash`, and when git updates this file mid-run).

set -Eeuo pipefail

# ----------------------------------------------------------------------------- settings
DOMAIN="${VINCLAB_DOMAIN:-lms.vinc-lab.com}"
EMAIL="${VINCLAB_EMAIL:-info@vinc-lab.com}"
ADMIN_PASSWORD="${VINCLAB_ADMIN_PASSWORD:-Qwerty@21}"
DEFAULT_ADMIN_PASSWORD="Qwerty@21"
REPO="${VINCLAB_REPO:-https://github.com/bhavansh-arora/vinc-lms.git}"
BRANCH="${VINCLAB_BRANCH:-main}"
PORT="${VINCLAB_PORT:-3100}"
MODE_OPT="auto"            # auto | host | docker
DB_HOST_OPT=""
DB_PORT_OPT=""
DB_NAME="vinc_lms"
DB_USER="vinc_lms"
DB_KIND=""                 # own: vinc-lms runs its own Postgres container (default); shared: an existing one
DB_CONTAINER_OWN="vinclab-db"
DB_VOLUME="vinclab-pgdata"
DB_PASSWORD="${VINCLAB_DB_PASSWORD:-}"
PROXY_NETWORK_OPT=""
DB_NETWORK_OPT=""
TRAEFIK_ENTRYPOINT_OPT=""
TRAEFIK_RESOLVER_OPT=""
DRY_RUN=0
SKIP_DNS_CHECK=0
SKIP_DB_CHECK=0
PORT_SET=0
REPO_SET=0

APP_DIR="${VINCLAB_APP_DIR:-/opt/vinclab}"
ENV_FILE="$APP_DIR/.env"
OVERRIDE_FILE="$APP_DIR/docker-compose.override.yml"
STATE_FILE="$APP_DIR/.install-state"
BACKUP_DIR="$APP_DIR/backups"
CRED_FILE="$APP_DIR/.git/credentials-vinclab"
CONTAINER="vinclab"
SERVICE="vinclab"
UNIT_DIR="/etc/systemd/system"
APP_UID=10001              # the 'vinclab' user inside the image (see Dockerfile)
TEMPLATE_MARK="vinclab-template: v2"
BODY_MB=25

CADDYFILE="/etc/caddy/Caddyfile"
CADDY_SITES="/etc/caddy/sites"
CADDY_SITE_FILE="/etc/caddy/sites/vinclab.caddy"
CADDY_IMPORT="import /etc/caddy/sites/*.caddy"
APACHE_SITE="/etc/apache2/sites-available/vinclab.conf"

# Runtime state
DOCKER_BIN=""
APT_UPDATED=0
MODE=""
PROXY_KIND="none"          # none|nginx|apache|caddy|traefik|haproxy|npm|nginx-proxy|caddy-docker-proxy|other|mixed
PROXY_WHERE="none"         # none|host|container
PROXY_PROGRAMS=""
PROXY_CONTAINER=""
PROXY_IMAGE=""
PROXY_NETMODE=""
PROXY_NETWORK=""
TRAEFIK_EP=""
TRAEFIK_RES=""
DB_CONTAINER=""
DB_IMAGE=""
DB_NETWORK=""
DB_VIA_NETWORK=0          # 1 when Postgres is not published and the app joins its Docker network
DB_PUBLISHED_PORT=""
DB_HOST=""
DB_PORT=""
DB_URL_HOSTPORT=""
ENV_CREATED=0
APP_HEALTHY=0
DNS_OK=0
DNS_MSG=""
WEB_RESULT="not configured"
WEB_FAILED=0
HTTPS_OK=0
MANUAL_STEP=0
STATE_FILES=()
WARNINGS=()
STEP_NO=0
STEP_TOTAL=9
TMP_DIR=""
LOG_FILE="/var/log/vinclab-install.log"

# ----------------------------------------------------------------------------- output
if [ -t 1 ]; then
  C_BOLD=$'\e[1m'; C_GREEN=$'\e[32m'; C_RED=$'\e[31m'; C_YELLOW=$'\e[33m'; C_DIM=$'\e[2m'; C_RESET=$'\e[0m'
else
  C_BOLD=""; C_GREEN=""; C_RED=""; C_YELLOW=""; C_DIM=""; C_RESET=""
fi

step() { STEP_NO=$((STEP_NO + 1)); printf '\n%s[%d/%d] %s%s\n' "$C_BOLD" "$STEP_NO" "$STEP_TOTAL" "$*" "$C_RESET"; }
ok()   { printf '  %s✓%s %s\n' "$C_GREEN" "$C_RESET" "$*"; }
warn() { printf '  %s!%s %s\n' "$C_YELLOW" "$C_RESET" "$*"; WARNINGS+=("$*"); }
fail() { printf '  %s✗%s %s\n' "$C_RED" "$C_RESET" "$*" >&2; }
info() { printf '    %s\n' "$*"; }
die()  { fail "$*"; printf '\n%sInstallation stopped.%s Fix the problem above and run the installer again.\n' "$C_RED" "$C_RESET" >&2; exit 1; }
dry()  { [ "$DRY_RUN" -eq 1 ]; }

# shellcheck disable=SC2329  # used by the ERR trap
on_error() {
  fail "Unexpected error (line $1): $2"
  [ -f "$LOG_FILE" ] && info "Details may be in $LOG_FILE"
}
# shellcheck disable=SC2329  # used by the EXIT trap
cleanup() { [ -n "$TMP_DIR" ] && rm -rf "$TMP_DIR"; return 0; }

# Run a command, or only print it in --dry-run mode.
run() {
  if dry; then printf '    %s[dry-run]%s %s\n' "$C_DIM" "$C_RESET" "$*"; return 0; fi
  "$@"
}

# Run a command with its output going to the log file; show the log tail if it fails.
quiet() {
  if dry; then printf '    %s[dry-run]%s %s\n' "$C_DIM" "$C_RESET" "$*"; return 0; fi
  printf '\n$ %s\n' "$*" >>"$LOG_FILE"
  if "$@" >>"$LOG_FILE" 2>&1 </dev/null; then return 0; fi
  fail "Command failed: $*"
  tail -n 15 "$LOG_FILE" | sed 's/^/      /' >&2
  return 1
}

# write_file PATH MODE OWNER  (content on stdin). Atomic; prints the content in --dry-run.
write_file() {
  local path=$1 mode=$2 owner=$3 content tmp
  content=$(cat)
  if dry; then
    printf '    %s[dry-run]%s write %s (mode %s, owner %s):\n' "$C_DIM" "$C_RESET" "$path" "$mode" "$owner"
    printf '%s\n' "$content" | sed -E "s/(PASSWORD=')[^']*/\1********/; s/(postgresql:\/\/[^:]*:)[^@']*/\1********/" | sed 's/^/      | /'
    return 0
  fi
  mkdir -p "$(dirname "$path")"
  tmp=$(mktemp "$(dirname "$path")/.vinclab.XXXXXX")
  printf '%s\n' "$content" >"$tmp"
  chmod "$mode" "$tmp"
  chown "$owner" "$tmp"
  mv -f "$tmp" "$path"
}

have_tty() { (exec </dev/tty) 2>/dev/null; }

usage() {
  cat <<EOF
VINC Lab installer (Docker)

Usage: sudo bash install.sh [options]

Site
  --domain NAME            Web address (default: lms.vinc-lab.com)
  --email ADDRESS          Email for HTTPS certificate notices (default: info@vinc-lab.com)
  --admin-password PASS    Password for the 'admin' login, used only on the very first start
                           (default: Qwerty@21 - change it after logging in)
  --port N                 Port the app listens on (default: 3100)

Code
  --repo URL               Git repository (default: https://github.com/bhavansh-arora/vinc-lms.git)
  --branch NAME            Branch to deploy (default: main)
                           Private repo: set GITHUB_TOKEN or paste a token when asked.

Database (PostgreSQL)
  --db own|shared          own (default): vinc-lms gets its own Postgres 18 container
                           ('vinclab-db') on a private network, with a generated password.
                           shared: use a database in an existing Postgres container.
  --db-password PASS       shared only: password of the vinc_lms database user (asked if not given)
  --db-host HOST           Database host (default: found automatically)
  --db-port N              Database port (default: found automatically, else 5432)
  --db-network NAME        Docker network of the Postgres container (docker mode)
  --skip-db-check          Start even if the database connection test fails

Networking
  --mode host|docker       host: the app uses the server's network (for a proxy installed on
                           the server). docker: the app joins the proxy's Docker network.
                           Default: chosen automatically.
  --proxy-network NAME     Docker network of the reverse-proxy container (docker mode)
  --traefik-entrypoint N   Traefik HTTPS entrypoint name (default: detected, else websecure)
  --traefik-certresolver N Traefik certificate resolver name (default: detected)
  --skip-dns-check         Request certificates even if DNS does not point here yet

  --dry-run                Show what would happen without changing anything
  -h, --help               Show this help
EOF
}

# ----------------------------------------------------------------------------- arguments
valid_port() { [[ $1 =~ ^[0-9]+$ ]] && [ "$1" -ge 1 ] && [ "$1" -le 65535 ]; }

parse_args() {
  while [ $# -gt 0 ]; do
    local opt=$1 val=""
    case $opt in --*=*) val=${opt#*=}; opt=${opt%%=*} ;; esac
    case $opt in
      --domain|--email|--admin-password|--repo|--branch|--port|--mode|--db-password|--db-host|--db-port|\
      --db-network|--proxy-network|--traefik-entrypoint|--traefik-certresolver|--db)
        if [ -z "$val" ]; then
          [ $# -ge 2 ] || die "Option $opt needs a value (see --help)."
          val=$2; shift
        fi
        case $opt in
          --domain) DOMAIN=$val ;;
          --email) EMAIL=$val ;;
          --admin-password) ADMIN_PASSWORD=$val ;;
          --repo) REPO=$val; REPO_SET=1 ;;
          --branch) BRANCH=$val ;;
          --port) PORT=$val; PORT_SET=1 ;;
          --mode) MODE_OPT=$val ;;
          --db-password) DB_PASSWORD=$val ;;
          --db) DB_KIND=$val ;;
          --db-host) DB_HOST_OPT=$val ;;
          --db-port) DB_PORT_OPT=$val ;;
          --db-network) DB_NETWORK_OPT=$val ;;
          --proxy-network) PROXY_NETWORK_OPT=$val ;;
          --traefik-entrypoint) TRAEFIK_ENTRYPOINT_OPT=$val ;;
          --traefik-certresolver) TRAEFIK_RESOLVER_OPT=$val ;;
        esac ;;
      --skip-dns-check) SKIP_DNS_CHECK=1 ;;
      --skip-db-check) SKIP_DB_CHECK=1 ;;
      --dry-run) DRY_RUN=1 ;;
      -h|--help) usage; exit 0 ;;
      *) die "Unknown option: $opt (see --help)" ;;
    esac
    shift
  done

  DOMAIN=$(printf '%s' "$DOMAIN" | tr '[:upper:]' '[:lower:]')
  [[ $DOMAIN =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$ ]] || die "Not a valid domain name: $DOMAIN"
  [[ $EMAIL =~ ^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$ ]] || die "Not a valid email address: $EMAIL"
  valid_port "$PORT" || die "Not a valid port: $PORT"
  [ -z "$DB_PORT_OPT" ] || valid_port "$DB_PORT_OPT" || die "Not a valid port: $DB_PORT_OPT"
  [[ $BRANCH =~ ^[A-Za-z0-9._/-]+$ ]] || die "Not a valid branch name: $BRANCH"
  case $MODE_OPT in auto|host|docker) ;; *) die "--mode must be host or docker" ;; esac
  # Pointing at an existing database (--db-host/--db-network) means shared; otherwise own.
  if [ -z "$DB_KIND" ]; then if [ -n "$DB_HOST_OPT$DB_NETWORK_OPT" ]; then DB_KIND=shared; else DB_KIND=own; fi; fi
  case $DB_KIND in own|shared) ;; *) die "--db must be own or shared" ;; esac
  local n
  for n in "$DB_HOST_OPT" "$DB_NETWORK_OPT" "$PROXY_NETWORK_OPT" "$TRAEFIK_ENTRYPOINT_OPT" "$TRAEFIK_RESOLVER_OPT"; do
    [ -z "$n" ] || [[ $n =~ ^[A-Za-z0-9._-]+$ ]] || die "Not a valid name: $n"
  done
  [ -n "$ADMIN_PASSWORD" ] || die "The admin password cannot be empty."
  case $ADMIN_PASSWORD in *"'"*|*$'\n'*) die "The admin password cannot contain a single quote (') or a line break." ;; esac
  return 0
}

# ----------------------------------------------------------------------------- helpers
# kv_get FILE KEY -> value (surrounding quotes removed), empty if missing
kv_get() {
  [ -r "$1" ] || return 0
  local v
  v=$(sed -n "s/^[[:space:]]*$2[[:space:]]*=//p" "$1" | tail -n 1)
  v=${v%$'\r'}
  case $v in
    \"*\") v=${v#\"}; v=${v%\"} ;;
    \'*\') v=${v#\'}; v=${v%\'} ;;
  esac
  printf '%s' "$v"
}

# Percent-encode a string for use inside a URL.
urlencode() {
  local LC_ALL=C s=$1 out="" c hex i
  for ((i = 0; i < ${#s}; i++)); do
    c=${s:i:1}
    case $c in
      [a-zA-Z0-9.~_-]) out+=$c ;;
      *) printf -v hex '%%%02X' "'$c"; out+=$hex ;;
    esac
  done
  printf '%s' "$out"
}

apt_update_once() {
  [ "$APT_UPDATED" -eq 1 ] && return 0
  quiet apt-get -o DPkg::Lock::Timeout=300 update
  APT_UPDATED=1
}

apt_install() {
  local missing=() p
  for p in "$@"; do
    dpkg-query -W -f='${Status}' "$p" 2>/dev/null | grep -q 'install ok installed' || missing+=("$p")
  done
  [ ${#missing[@]} -eq 0 ] && return 0
  info "Installing: ${missing[*]}"
  apt_update_once
  quiet env DEBIAN_FRONTEND=noninteractive apt-get -o DPkg::Lock::Timeout=300 install -y -q "${missing[@]}"
}

# docker compose, run from the app folder so .env and the override file are picked up.
dc() { (cd "$APP_DIR" && "$DOCKER_BIN" compose "$@"); }

container_running() {
  [ -n "$DOCKER_BIN" ] || return 1
  [ "$("$DOCKER_BIN" inspect -f '{{.State.Running}}' "$1" 2>/dev/null)" = "true" ]
}

# ----------------------------------------------------------------------------- step 1: system
check_system() {
  step "Checking this server"
  if [ "$(id -u)" -ne 0 ]; then
    if dry; then warn "Not running as root (fine for --dry-run; the real install needs sudo)."
    else die "Please run this as root, for example:  sudo bash install.sh"; fi
  else
    ok "Running as root"
  fi

  local id="" ver="" pretty="unknown system"
  if [ -r /etc/os-release ]; then
    # shellcheck disable=SC1091
    id=$(. /etc/os-release; printf '%s' "${ID:-}")
    # shellcheck disable=SC1091
    ver=$(. /etc/os-release; printf '%s' "${VERSION_ID:-}")
    # shellcheck disable=SC1091
    pretty=$(. /etc/os-release; printf '%s' "${PRETTY_NAME:-unknown}")
  fi
  case $id in
    ubuntu) case $ver in 22.04|24.04) ok "$pretty" ;; *) warn "$pretty: tested on Ubuntu 22.04/24.04; continuing anyway." ;; esac ;;
    debian) ok "$pretty" ;;
    *) warn "$pretty is not Ubuntu/Debian; this installer may not work here." ;;
  esac

  if DOCKER_BIN=$(command -v docker 2>/dev/null); then
    if "$DOCKER_BIN" info >/dev/null 2>&1; then
      ok "Docker $("$DOCKER_BIN" version -f '{{.Server.Version}}' 2>/dev/null || true) is running"
    elif dry; then
      warn "Docker is installed but not reachable (fine for --dry-run)."
    else
      die "Docker is installed but not running (try: sudo systemctl start docker)."
    fi
    if "$DOCKER_BIN" compose version >/dev/null 2>&1; then
      ok "Docker Compose $("$DOCKER_BIN" compose version --short 2>/dev/null || true) is available"
    elif dry; then
      warn "The Docker Compose plugin is missing (the real install would stop here)."
    else
      die "The Docker Compose plugin is missing. Install it with:  sudo apt-get install -y docker-compose-plugin"
    fi
  elif dry; then
    DOCKER_BIN=""
    warn "Docker is not installed (fine for --dry-run; the real install would stop here)."
  else
    die "Docker is not installed. This server is expected to already run Docker (https://docs.docker.com/engine/install/ubuntu/)."
  fi

  if ! dry; then
    command -v apt-get >/dev/null || die "apt-get not found. This installer needs Ubuntu or Debian."
    if command -v systemctl >/dev/null && [ -d /run/systemd/system ]; then HAS_SYSTEMD=1; else HAS_SYSTEMD=0; warn "systemd is not running; backups will use cron instead."; fi
    : >>"$LOG_FILE" && chmod 600 "$LOG_FILE"
    printf '\n===== VINC Lab install %s =====\n' "$(date -u +%FT%TZ)" >>"$LOG_FILE"
    ok "Detailed log: $LOG_FILE"
  fi
  info "Domain: $DOMAIN   Branch: $BRANCH   App port: $PORT"
}

# ----------------------------------------------------------------------------- step 2: tools
install_basics() {
  step "Basic tools (git, curl)"
  apt_install git curl ca-certificates iproute2
  ok "git, curl and ss are available"
}

# ----------------------------------------------------------------------------- step 3: code
repo_host() { sed -E 's#^https://([^/@]*@)?([^/:]+).*#\2#' <<<"$REPO"; }

split_repo_credentials() {
  if [[ $REPO =~ ^https://([^/@]+)@(.+)$ ]]; then
    local userinfo=${BASH_REMATCH[1]}
    REPO="https://${BASH_REMATCH[2]}"
    if [[ $userinfo == *:* ]]; then GITHUB_TOKEN=${userinfo#*:}; else GITHUB_TOKEN=$userinfo; fi
    export GITHUB_TOKEN
    info "Moved the token out of the repository address (it is stored in a private file instead)."
  fi
}

ask_token() {
  if [ -n "${GITHUB_TOKEN:-}" ]; then printf '%s' "$GITHUB_TOKEN"; return 0; fi
  have_tty || return 1
  {
    printf '\n  The code repository looks private, so GitHub needs a token to download it.\n'
    printf '  Create one at https://github.com/settings/personal-access-tokens/new\n'
    printf '    - Repository access: Only select repositories -> %s\n' "$(sed -E 's#^https://[^/]+/##; s#\.git$##' <<<"$REPO")"
    printf '    - Permissions: Contents -> Read-only\n'
    printf '  Paste the token and press Enter (nothing shows while you paste): '
  } >/dev/tty
  local token=""
  IFS= read -r -s token </dev/tty || true
  printf '\n' >/dev/tty
  token=$(printf '%s' "$token" | tr -d '[:space:]')
  [ -n "$token" ] || return 1
  printf '%s' "$token"
}

write_credentials() {
  ( umask 077; printf 'https://x-access-token:%s@%s\n' "$2" "$(repo_host)" >"$1" )
  chmod 600 "$1"
}

no_token_help() {
  fail "Could not download the code from $REPO"
  info "If the repository is private, run the installer in a terminal so it can ask for a"
  info "GitHub token, or provide one:  sudo GITHUB_TOKEN=xxxx bash install.sh"
}

git_fetch_quiet() {
  GIT_TERMINAL_PROMPT=0 git -C "$APP_DIR" fetch -q --prune origin "+refs/heads/$BRANCH:refs/remotes/origin/$BRANCH" >>"$LOG_FILE" 2>&1 </dev/null
}

fetch_code() {
  step "Getting the app code into $APP_DIR"
  split_repo_credentials
  local attempt token

  if [ -d "$APP_DIR/.git" ]; then
    info "Existing checkout found; updating it to the latest '$BRANCH'."
    run chown -R root:root "$APP_DIR/.git"
    if [ "$REPO_SET" -eq 1 ]; then run git -C "$APP_DIR" remote set-url origin "$REPO"; fi
    if dry; then
      run git -C "$APP_DIR" fetch --prune origin "$BRANCH"
    elif ! git_fetch_quiet; then
      [[ $REPO == https://* ]] || { no_token_help; die "git fetch failed."; }
      for attempt in 1 2 3; do
        token=$(ask_token) || { no_token_help; die "git fetch failed."; }
        write_credentials "$CRED_FILE" "$token"
        git -C "$APP_DIR" config credential.helper "store --file=$CRED_FILE"
        if git_fetch_quiet; then ok "Token accepted and saved privately in $CRED_FILE"; break; fi
        rm -f "$CRED_FILE"; unset GITHUB_TOKEN
        fail "GitHub did not accept that token (or branch '$BRANCH' does not exist)."
        [ "$attempt" -eq 3 ] && die "Could not download the code."
      done
    fi
    run git -C "$APP_DIR" checkout -q -f -B "$BRANCH" "origin/$BRANCH"
    run git -C "$APP_DIR" reset -q --hard "origin/$BRANCH"
  else
    if [ -e "$APP_DIR" ] && [ -n "$(ls -A "$APP_DIR" 2>/dev/null)" ]; then
      die "$APP_DIR already exists but is not a git checkout. Move it away (mv $APP_DIR $APP_DIR.old) and run again."
    fi
    if dry; then
      run git clone --branch "$BRANCH" "$REPO" "$APP_DIR"
    elif GIT_TERMINAL_PROMPT=0 git clone -q --branch "$BRANCH" "$REPO" "$APP_DIR" >>"$LOG_FILE" 2>&1 </dev/null; then
      ok "Downloaded the code"
    else
      [[ $REPO == https://* ]] || { no_token_help; die "git clone failed."; }
      rm -rf "$APP_DIR"
      local tmpcred="$TMP_DIR/credentials"
      for attempt in 1 2 3; do
        token=$(ask_token) || { no_token_help; die "git clone failed."; }
        write_credentials "$tmpcred" "$token"
        if GIT_TERMINAL_PROMPT=0 git -c credential.helper= -c "credential.helper=store --file=$tmpcred" \
             clone -q --branch "$BRANCH" "$REPO" "$APP_DIR" >>"$LOG_FILE" 2>&1 </dev/null; then
          mv -f "$tmpcred" "$CRED_FILE"; chmod 600 "$CRED_FILE"
          git -C "$APP_DIR" config credential.helper "store --file=$CRED_FILE"
          ok "Downloaded the code; token saved privately in $CRED_FILE (used for updates)"
          break
        fi
        rm -rf "$APP_DIR" "$tmpcred"; unset GITHUB_TOKEN
        fail "GitHub did not accept that token (or branch '$BRANCH' does not exist)."
        [ "$attempt" -eq 3 ] && die "Could not download the code."
      done
    fi
  fi

  run chown root:root "$APP_DIR"
  run chmod 755 "$APP_DIR"
  run chmod 700 "$APP_DIR/.git"
  if [ -f "$CRED_FILE" ]; then run chmod 600 "$CRED_FILE"; fi
  if ! dry; then
    ok "Code is at commit $(git -C "$APP_DIR" log -1 --format='%h %s (%cd)' --date=short)"
    [ -f "$APP_DIR/Dockerfile" ] && [ -f "$APP_DIR/docker-compose.yml" ] \
      || die "Dockerfile or docker-compose.yml is missing on branch '$BRANCH'."
  fi
}

# ----------------------------------------------------------------------------- detection
# Prints "PORT PROGRAM PID" for each listener on port 80/443 (from ss).
list_port_owners() {
  local out line addr port procs entry name pid
  command -v ss >/dev/null 2>&1 || return 0
  out=$(ss -ltnpH '( sport = :80 or sport = :443 )' 2>/dev/null) || out=$(ss -ltnp 2>/dev/null | tail -n +2) || out=""
  while IFS= read -r line; do
    [ -n "$line" ] || continue
    addr=$(awk '{print $4}' <<<"$line")
    port=${addr##*:}
    case $port in 80|443) ;; *) continue ;; esac
    procs=$(grep -oE '\("[^"]+",pid=[0-9]+' <<<"$line" || true)
    if [ -z "$procs" ]; then printf '%s unknown 0\n' "$port"; continue; fi
    while IFS= read -r entry; do
      name=$(sed -E 's/^\("([^"]+)".*/\1/' <<<"$entry")
      pid=${entry##*pid=}
      printf '%s %s %s\n' "$port" "$name" "$pid"
    done <<<"$procs"
  done <<<"$out" | sort -u -k1,2
}

# Prints the Docker container ID a host PID belongs to (empty if it is not in a container).
pid_container_id() {
  [ "$1" -gt 0 ] 2>/dev/null || return 0
  grep -oE '(docker|containerd|libpod)[-/:]?[0-9a-f]{64}' "/proc/$1/cgroup" 2>/dev/null | grep -oE '[0-9a-f]{64}' | head -n 1 || true
}

classify_image() {
  local img
  img=$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')
  case $img in
    *nginx-proxy-manager*) echo npm ;;
    *caddy-docker-proxy*) echo caddy-docker-proxy ;;
    *traefik*) echo traefik ;;
    *nginx-proxy*|*jwilder/nginx*) echo nginx-proxy ;;
    *caddy*) echo caddy ;;
    *haproxy*) echo haproxy ;;
    *swag*|*nginx*) echo nginx ;;
    *apache*|*httpd*) echo apache ;;
    *) echo other ;;
  esac
}

classify_program() {
  case $1 in
    nginx) echo nginx ;;
    apache2|httpd) echo apache ;;
    caddy) echo caddy ;;
    traefik) echo traefik ;;
    haproxy) echo haproxy ;;
    *) echo other ;;
  esac
}

# Names of the user-defined Docker networks a container is on (one per line).
container_networks() {
  # shellcheck disable=SC2016  # Go template, not shell
  "$DOCKER_BIN" inspect -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{"\n"}}{{end}}' "$1" 2>/dev/null \
    | sed '/^$/d' | grep -vxE 'bridge|host|none' || true
}

# Pick the most proxy-looking network from a list on stdin.
pick_network() {
  local nets pattern='proxy|traefik|web|public|edge|ingress|caddy|npm'
  nets=$(cat)
  [ -n "$nets" ] || return 0
  if grep -qiE "$pattern" <<<"$nets"; then grep -iE "$pattern" <<<"$nets" | head -n 1
  else head -n 1 <<<"$nets"; fi
}

detect_proxy() {
  local owners line port name pid cid kinds="" k ps_out
  # 1) A container that publishes port 80 or 443.
  if [ -n "$DOCKER_BIN" ]; then
    ps_out=$("$DOCKER_BIN" ps --format '{{.Names}}\t{{.Image}}\t{{.Ports}}' 2>/dev/null || true)
    line=$(awk -F'\t' '$3 ~ /:(80|443)->/' <<<"$ps_out" | head -n 1)
    if [ -n "$line" ]; then
      PROXY_WHERE=container
      PROXY_CONTAINER=$(cut -f1 <<<"$line"); PROXY_IMAGE=$(cut -f2 <<<"$line")
      PROXY_KIND=$(classify_image "$PROXY_IMAGE")
      PROXY_NETMODE=bridge
      PROXY_PROGRAMS="container '$PROXY_CONTAINER' ($PROXY_IMAGE)"
      if [ "$(awk -F'\t' '$3 ~ /:(80|443)->/' <<<"$ps_out" | wc -l)" -gt 1 ]; then
        warn "More than one container publishes ports 80/443; using '$PROXY_CONTAINER'."
      fi
      return 0
    fi
  fi
  # 2) Whatever process listens on 80/443 (on the host, or a container using the host network).
  owners=$(list_port_owners)
  [ -n "$owners" ] || { PROXY_KIND=none; PROXY_WHERE=none; return 0; }
  while read -r port name pid; do
    cid=$(pid_container_id "$pid")
    if [ -n "$cid" ] && [ -n "$DOCKER_BIN" ]; then
      PROXY_CONTAINER=$("$DOCKER_BIN" inspect -f '{{.Name}}' "$cid" 2>/dev/null | sed 's#^/##' || true)
      PROXY_IMAGE=$("$DOCKER_BIN" inspect -f '{{.Config.Image}}' "$cid" 2>/dev/null || true)
      PROXY_NETMODE=$("$DOCKER_BIN" inspect -f '{{.HostConfig.NetworkMode}}' "$cid" 2>/dev/null || echo host)
      PROXY_WHERE=container
      k=$(classify_image "${PROXY_IMAGE:-$name}")
    else
      [ "$PROXY_WHERE" = container ] || PROXY_WHERE=host
      k=$(classify_program "$name")
    fi
    kinds+="$k"$'\n'
  done <<<"$owners"
  PROXY_PROGRAMS=$(awk '{print $2}' <<<"$owners" | sort -u | paste -sd, - | sed 's/,/, /g')
  if [ -n "$PROXY_CONTAINER" ]; then
    PROXY_PROGRAMS="$PROXY_PROGRAMS in container '$PROXY_CONTAINER' ($PROXY_IMAGE, network: $PROXY_NETMODE)"
  fi
  kinds=$(sed '/^$/d' <<<"$kinds" | sort -u)
  if [ "$(wc -l <<<"$kinds")" -gt 1 ]; then PROXY_KIND=mixed; else PROXY_KIND=$kinds; fi
}

detect_db() {
  local ps_out line ports
  [ -n "$DOCKER_BIN" ] || return 0
  ps_out=$("$DOCKER_BIN" ps --format '{{.Names}}\t{{.Image}}\t{{.Ports}}' 2>/dev/null || true)
  line=$(awk -F'\t' '$3 ~ /:[0-9]+->5432\/tcp/' <<<"$ps_out" | head -n 1)
  [ -n "$line" ] || line=$(awk -F'\t' 'tolower($2) ~ /postgres|postgis|timescale/' <<<"$ps_out" | head -n 1)
  [ -n "$line" ] || return 0
  DB_CONTAINER=$(cut -f1 <<<"$line"); DB_IMAGE=$(cut -f2 <<<"$line"); ports=$(cut -f3 <<<"$line")
  DB_PUBLISHED_PORT=$(grep -oE ':[0-9]+->5432/tcp' <<<"$ports" | head -n 1 | sed -E 's/^:([0-9]+)->.*/\1/' || true)
  if [ "$(awk -F'\t' '$3 ~ /->5432\/tcp/' <<<"$ps_out" | wc -l)" -gt 1 ]; then
    warn "More than one container offers Postgres; using '$DB_CONTAINER' (choose another with --db-host/--db-network)."
  fi
}

# Is the app port used by something other than our own container? Prints the listener.
port_conflict() {
  command -v ss >/dev/null 2>&1 || return 1
  local line
  line=$(ss -ltnpH "( sport = :$PORT )" 2>/dev/null | head -n 1 || true)
  [ -n "$line" ] || return 1
  # Our own container: in host-network mode it shows up as "node"; with a published port, as docker-proxy.
  if container_running "$CONTAINER" && grep -q '"node"' <<<"$line"; then return 1; fi
  if container_running "$CONTAINER" && "$DOCKER_BIN" port "$CONTAINER" 2>/dev/null | grep -q ":$PORT\$"; then return 1; fi
  printf '%s' "$line"
  return 0
}

decide_setup() {
  step "Looking at this server's reverse proxy and database"
  detect_proxy
  # On a re-run, keep the proxy network chosen last time (if it still exists).
  if [ -z "$PROXY_NETWORK_OPT" ] && [ -n "$DOCKER_BIN" ]; then
    local last
    last=$(kv_get "$STATE_FILE" PROXY_NETWORK)
    if [ -n "$last" ] && [[ $last =~ ^[A-Za-z0-9._-]+$ ]] && "$DOCKER_BIN" network inspect "$last" >/dev/null 2>&1; then
      PROXY_NETWORK_OPT=$last
      info "Using the proxy network from the last install: $last"
    fi
  fi
  case $PROXY_WHERE in
    none) warn "Nothing is serving ports 80/443 on this server." ;;
    *) ok "Ports 80/443 are served by: $PROXY_PROGRAMS"; info "Proxy type: $PROXY_KIND" ;;
  esac

  if [ "$DB_KIND" = own ]; then
    if [ "$MODE_OPT" != auto ]; then MODE=$MODE_OPT
    elif [ "$PROXY_WHERE" = container ] && [ "$PROXY_NETMODE" != host ]; then MODE=docker
    else MODE=host; fi
    DB_HOST=db; DB_PORT=5432
    ok "Database: its own PostgreSQL 18 container '$DB_CONTAINER_OWN' on a private network (separate from every other project)"
    if [ "$MODE" = host ]; then
      ok "Mode: host - the app listens on 127.0.0.1:$PORT only, for the web server on this server"
      local conflict
      if conflict=$(port_conflict); then
        fail "Port $PORT is already used by another program: $conflict"
        die "Choose a free port with --port (for example --port 3110)."
      fi
    else
      if [ -n "$PROXY_NETWORK_OPT" ]; then PROXY_NETWORK=$PROXY_NETWORK_OPT
      elif [ -n "$PROXY_CONTAINER" ] && [ -n "$DOCKER_BIN" ]; then
        PROXY_NETWORK=$(traefik_docker_network)
        [ -n "$PROXY_NETWORK" ] || PROXY_NETWORK=$(container_networks "$PROXY_CONTAINER" | pick_network)
      fi
      ok "Mode: docker - the app is reached through the proxy's Docker network (no ports opened on the server)"
      if [ -n "$PROXY_NETWORK" ]; then ok "Joining the proxy's network: $PROXY_NETWORK"
      else warn "Could not find a Docker network for the proxy container ${PROXY_CONTAINER:-}; give one with --proxy-network."; fi
    fi
    DB_URL_HOSTPORT="$DB_HOST:$DB_PORT"
    return 0
  fi

  detect_db
  if [ -n "$DB_CONTAINER" ]; then
    ok "Postgres container: $DB_CONTAINER ($DB_IMAGE)${DB_PUBLISHED_PORT:+, published on host port $DB_PUBLISHED_PORT}"
  else
    warn "No Postgres container found; using --db-host or 127.0.0.1."
  fi

  if [ "$MODE_OPT" != auto ]; then
    MODE=$MODE_OPT
    info "Using --mode $MODE as requested."
  elif [ "$PROXY_WHERE" = container ] && [ "$PROXY_NETMODE" != host ]; then
    MODE=docker
  else
    MODE=host
  fi

  if [ "$MODE" = host ] && [ -n "$DB_CONTAINER" ] && [ -z "$DB_PUBLISHED_PORT" ] && [ -z "$DB_HOST_OPT" ]; then
    # Postgres is not published on the server at all (only "5432/tcp" inside its Docker network),
    # so 127.0.0.1:5432 does not exist. The app joins Postgres's own network and reaches it by
    # name, and publishes its port on the server's 127.0.0.1 only, for the reverse proxy here.
    DB_VIA_NETWORK=1
    DB_NETWORK=${DB_NETWORK_OPT:-$(container_networks "$DB_CONTAINER" | head -n 1)}
    if [ -z "$DB_NETWORK" ]; then
      fail "Postgres ($DB_CONTAINER) is not published on this server and is only on Docker's default network."
      info "Give its network with --db-network NAME, or the address with --db-host HOST."
      info "See its networks: sudo docker inspect -f '{{json .NetworkSettings.Networks}}' $DB_CONTAINER"
      dry || die "No way to reach the database."
      DB_NETWORK="<db-network>"
    fi
    DB_HOST=$DB_CONTAINER
    DB_PORT=${DB_PORT_OPT:-5432}
    ok "Mode: host - the app listens on 127.0.0.1:$PORT only, for the web server on this server"
    ok "Postgres is not published on the server, so the app joins its Docker network: $DB_NETWORK (database host: $DB_HOST)"
    local conflict
    if conflict=$(port_conflict); then
      fail "Port $PORT is already used by another program: $conflict"
      die "Choose a free port with --port (for example --port 3110)."
    fi
  elif [ "$MODE" = host ]; then
    DB_HOST=${DB_HOST_OPT:-127.0.0.1}
    DB_PORT=${DB_PORT_OPT:-${DB_PUBLISHED_PORT:-5432}}
    ok "Mode: host - the app uses the server's network and listens on 127.0.0.1:$PORT only"
    local conflict
    if conflict=$(port_conflict); then
      fail "Port $PORT is already used by another program: $conflict"
      die "Choose a free port with --port (for example --port 3110)."
    fi
  else
    if [ -n "$PROXY_NETWORK_OPT" ]; then
      PROXY_NETWORK=$PROXY_NETWORK_OPT
    elif [ -n "$PROXY_CONTAINER" ] && [ -n "$DOCKER_BIN" ]; then
      PROXY_NETWORK=$(traefik_docker_network)
      [ -n "$PROXY_NETWORK" ] || PROXY_NETWORK=$(container_networks "$PROXY_CONTAINER" | pick_network)
    fi
    if [ -n "$DB_NETWORK_OPT" ]; then
      DB_NETWORK=$DB_NETWORK_OPT
    elif [ -n "$DB_CONTAINER" ] && [ -z "$DB_HOST_OPT" ]; then
      DB_NETWORK=$(container_networks "$DB_CONTAINER" | head -n 1)
    fi
    if [ -n "$DB_HOST_OPT" ]; then DB_HOST=$DB_HOST_OPT
    elif [ -n "$DB_CONTAINER" ] && [ -n "$DB_NETWORK" ]; then DB_HOST=$DB_CONTAINER
    fi
    DB_PORT=${DB_PORT_OPT:-5432}
    ok "Mode: docker - the app runs on Docker networks only (no ports opened on the server)"
    if [ -n "$PROXY_NETWORK" ]; then
      ok "Joining the proxy's network: $PROXY_NETWORK"
    else
      if [ "$PROXY_WHERE" = container ]; then
        warn "Could not find a Docker network for the proxy container $PROXY_CONTAINER; give one with --proxy-network."
      else
        warn "The reverse proxy is not a Docker container, so it cannot reach the app by name in docker mode. --mode host is usually right here."
      fi
    fi
    if [ -n "$DB_NETWORK" ]; then
      ok "Joining the database's network: $DB_NETWORK (database host: $DB_HOST)"
    elif [ -z "$DB_HOST" ]; then
      fail "The app cannot reach the database from inside Docker:"
      info "the Postgres container ${DB_CONTAINER:-} is not on a named Docker network, and"
      info "it is published only on the server's 127.0.0.1, which containers cannot reach."
      info "Options: run with --mode host (if the proxy can reach http://127.0.0.1:$PORT),"
      info "or give --db-network NAME (the Postgres container's network) or --db-host HOST."
      dry || die "No way to reach the database in docker mode."
      DB_HOST="<db-host>"
    fi
  fi
  DB_URL_HOSTPORT="$DB_HOST:$DB_PORT"
}

# ----------------------------------------------------------------------------- Traefik details
traefik_config_text() {
  [ -n "$PROXY_CONTAINER" ] && [ -n "$DOCKER_BIN" ] || return 0
  "$DOCKER_BIN" inspect -f '{{range .Config.Cmd}}{{println .}}{{end}}{{range .Args}}{{println .}}{{end}}{{range .Config.Env}}{{println .}}{{end}}' "$PROXY_CONTAINER" 2>/dev/null || true
}

traefik_static_file() {
  [ -n "$PROXY_CONTAINER" ] && [ -n "$DOCKER_BIN" ] || return 0
  local f
  for f in /etc/traefik/traefik.yml /etc/traefik/traefik.yaml /etc/traefik/traefik.toml /traefik.yml /traefik.yaml /traefik.toml; do
    "$DOCKER_BIN" exec "$PROXY_CONTAINER" cat "$f" 2>/dev/null && return 0
  done
  return 0
}

traefik_docker_network() {
  [ "$PROXY_KIND" = traefik ] || return 0
  local t
  t=$(traefik_config_text)
  grep -oiE '(--providers\.docker\.network=|TRAEFIK_PROVIDERS_DOCKER_NETWORK=)[A-Za-z0-9._-]+' <<<"$t" | head -n 1 | sed 's/.*=//' || true
}

# Prints "ENTRYPOINT RESOLVER" (RESOLVER may be empty).
traefik_detect() {
  local t f ep="" res=""
  t=$(traefik_config_text)
  ep=$(grep -oiE -- '--entrypoints\.[A-Za-z0-9_-]+\.address=[^ ]*:443' <<<"$t" | head -n 1 | sed -E 's/^--entrypoints\.([^.]+)\..*/\1/I' || true)
  [ -n "$ep" ] || ep=$(grep -oiE 'TRAEFIK_ENTRYPOINTS_[A-Za-z0-9]+_ADDRESS=[^ ]*:443' <<<"$t" | head -n 1 | sed -E 's/^TRAEFIK_ENTRYPOINTS_([^_]+)_.*/\1/I' | tr '[:upper:]' '[:lower:]' || true)
  res=$(grep -oiE -- '--certificatesresolvers\.[A-Za-z0-9_-]+\.' <<<"$t" | head -n 1 | sed -E 's/^--certificatesresolvers\.([^.]+)\./\1/I' || true)
  [ -n "$res" ] || res=$(grep -oiE 'TRAEFIK_CERTIFICATESRESOLVERS_[A-Za-z0-9]+_' <<<"$t" | head -n 1 | sed -E 's/^TRAEFIK_CERTIFICATESRESOLVERS_([^_]+)_/\1/I' | tr '[:upper:]' '[:lower:]' || true)
  if [ -z "$ep" ] || [ -z "$res" ]; then
    f=$(traefik_static_file)
    if [ -n "$f" ]; then
      # YAML: the entrypoint key whose address ends in :443; first key under certificatesResolvers.
      [ -n "$ep" ] || ep=$(awk '/^[[:space:]]+[A-Za-z0-9_-]+:[[:space:]]*$/ {k=$1; sub(":","",k)} /address:.*:443/ {print k; exit}' <<<"$f")
      [ -n "$res" ] || res=$(awk '/^certificatesResolvers:/ {f=1; next} f && /^[[:space:]]+[A-Za-z0-9_-]+:/ {k=$1; sub(":.*","",k); print k; exit} f && /^[^[:space:]#]/ {exit}' <<<"$f")
      # TOML: [entryPoints.websecure] address = ":443"   /  [certificatesResolvers.le.acme]
      [ -n "$ep" ] || ep=$(awk '/^\[entryPoints\.[A-Za-z0-9_-]+\]/ {k=$0; gsub(/^\[entryPoints\.|\].*$/,"",k)} /address *= *".*:443"/ {print k; exit}' <<<"$f")
      [ -n "$res" ] || res=$(grep -oE '^\[certificatesResolvers\.[A-Za-z0-9_-]+' <<<"$f" | head -n 1 | sed 's/.*\.//' || true)
    fi
  fi
  printf '%s %s\n' "${TRAEFIK_ENTRYPOINT_OPT:-${ep:-websecure}}" "${TRAEFIK_RESOLVER_OPT:-$res}"
}

# ----------------------------------------------------------------------------- step 5: settings + DB
ask_db_password() {
  if [ -n "$DB_PASSWORD" ]; then printf '%s' "$DB_PASSWORD"; return 0; fi
  have_tty || return 1
  printf '\n  Password of the PostgreSQL user "%s" (database "%s").\n  Type or paste it and press Enter (nothing shows): ' "$DB_USER" "$DB_NAME" >/dev/tty
  local pw=""
  IFS= read -r -s pw </dev/tty || true
  printf '\n' >/dev/tty
  [ -n "$pw" ] || return 1
  printf '%s' "$pw"
}

write_env_file() {
  local pw=$1 url
  url="postgresql://$(urlencode "$DB_USER"):$(urlencode "$pw")@$DB_URL_HOSTPORT/$DB_NAME"
  write_file "$ENV_FILE" 600 root:root <<EOF
# VINC Lab settings and secrets. Keep this file private (chmod 600). Never commit it.
# After editing:  cd $APP_DIR && sudo docker compose up -d
PORT=$PORT
TRUST_PROXY=1
SITE_DIR=/app
BACKUP_DIR=/app/backups
# deploy/install.sh keeps the host part (after @) in step with the networking mode.
DATABASE_URL='$url'
# Used only when the database is empty (first start). Change the password in the app afterwards.
ADMIN_PASSWORD='$ADMIN_PASSWORD'
$(if [ "$DB_KIND" = own ]; then printf "# Password of the app's own database container (%s). To change it, change it here AND in\n# DATABASE_URL above, then run: sudo bash %s/deploy/install.sh\nVINCLAB_DB_PASSWORD='%s'" "$DB_CONTAINER_OWN" "$APP_DIR" "$pw"; fi)
EOF
}

db_url_from_env() { kv_get "$ENV_FILE" DATABASE_URL; }

# Tries to log in to the database with a throw-away Postgres client container.
db_test() {
  local url=$1 image=${DB_IMAGE:-postgres:18-alpine} net
  case $image in *postgres*|*postgis*|*timescale*) ;; *) image=postgres:18-alpine ;; esac
  if [ "$MODE" = host ] && [ "${DB_VIA_NETWORK:-0}" != 1 ]; then net=host; else net=${DB_NETWORK:-bridge}; fi
  # shellcheck disable=SC2016  # $DATABASE_URL is expanded inside the container
  DATABASE_URL=$url PGCONNECT_TIMEOUT=8 "$DOCKER_BIN" run --rm --network "$net" \
    -e DATABASE_URL -e PGCONNECT_TIMEOUT --entrypoint sh "$image" \
    -c 'psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -tAc "select current_user"' 2>&1
}

print_db_sql() {
  local admin_user=""
  if [ -n "$DB_CONTAINER" ] && [ -n "$DOCKER_BIN" ]; then
    admin_user=$("$DOCKER_BIN" inspect -f '{{range .Config.Env}}{{println .}}{{end}}' "$DB_CONTAINER" 2>/dev/null \
      | sed -n 's/^POSTGRES_USER=//p' | head -n 1 || true)
  fi
  cat <<EOF

    ${C_BOLD}Create the database once${C_RESET} (this does not touch the other project's data):
      sudo docker exec -it ${DB_CONTAINER:-<postgres-container>} psql -U ${admin_user:-postgres} -d postgres
    then paste (use your own strong password, and give the same one to this installer):
      CREATE ROLE $DB_USER LOGIN PASSWORD 'choose-a-strong-password';
      CREATE DATABASE $DB_NAME OWNER $DB_USER;
      REVOKE ALL ON DATABASE $DB_NAME FROM PUBLIC;
      \\q
EOF
}

explain_db_error() {
  local out=$1
  case $out in
    *"password authentication failed"*) fail "The database rejected the password for user '$DB_USER'." ;;
    *"role \"$DB_USER\" does not exist"*|*"database \"$DB_NAME\" does not exist"*)
      fail "The database or its user does not exist yet."; print_db_sql ;;
    *"no pg_hba.conf entry"*)
      fail "Postgres does not accept connections from the app's address (pg_hba.conf)."
      info "The database owner must allow user $DB_USER from the Docker network." ;;
    *"Connection refused"*|*"could not connect"*|*"timeout expired"*|*"could not translate host name"*|*"Name does not resolve"*|*"Name or service not known"*)
      fail "Could not reach Postgres at $DB_URL_HOSTPORT."
      if [ "$MODE" = docker ] || [ "${DB_VIA_NETWORK:-0}" = 1 ]; then
        info "In docker mode the app must be on the same Docker network as Postgres (--db-network)."
        info "host.docker.internal does NOT work here: Postgres is published only on the server's"
        info "127.0.0.1, and containers reach the server through a different address."
      else
        info "Is the Postgres container running and published on 127.0.0.1:$DB_PORT? Check: sudo docker ps"
      fi ;;
    *) fail "The database test failed:"; printf '%s\n' "$out" | tail -n 5 | sed 's/^/      /' >&2 ;;
  esac
}

setup_settings() {
  step "Settings (.env) and database connection"
  run install -d -m 700 -o "$APP_UID" -g "$APP_UID" "$BACKUP_DIR"
  run chown "$APP_UID:$APP_UID" "$BACKUP_DIR"
  run chmod 700 "$BACKUP_DIR"
  ok "Backup folder: $BACKUP_DIR"

  local pw="" url cur out="" attempt
  if [ "$DB_KIND" = own ]; then
    if [ -f "$ENV_FILE" ]; then
      run chmod 600 "$ENV_FILE"
      if [ -z "$(kv_get "$ENV_FILE" VINCLAB_DB_PASSWORD)" ]; then
        fail "$ENV_FILE is set up for a shared database (it has no VINCLAB_DB_PASSWORD)."
        info "Run the installer with --db shared to keep using it, or move $ENV_FILE away to switch to"
        info "an own database (a new, empty one; nothing is copied over)."
        dry || die "Not switching databases without being asked."
      fi
      ok "$ENV_FILE already exists; keeping its passwords"
      if [ "$PORT_SET" -eq 1 ] && [ "$(kv_get "$ENV_FILE" PORT)" != "$PORT" ]; then
        run sed -i "s/^[[:space:]]*PORT[[:space:]]*=.*/PORT=$PORT/" "$ENV_FILE"
        ok "Changed PORT to $PORT"
      fi
    else
      pw=$(od -An -tx1 -N24 /dev/urandom | tr -d ' \n')
      write_env_file "$pw"
      ENV_CREATED=1
      ok "Wrote $ENV_FILE with a new random database password (readable by root only)"
    fi
    info "The database container starts together with the app in the next step."
    return 0
  fi
  if [ -f "$ENV_FILE" ]; then
    ok "$ENV_FILE already exists; keeping its passwords"
    run chmod 600 "$ENV_FILE"
    [ -n "$(db_url_from_env)" ] || die "$ENV_FILE has no DATABASE_URL line. Add one, or delete the file and run the installer again."
    cur=$(db_url_from_env | sed -nE 's#^postgres(ql)?://[^@]*@([^/?]+).*#\2#p')
    if [ -n "$cur" ] && [ "$cur" != "$DB_URL_HOSTPORT" ]; then
      run sed -i -E "s#^(DATABASE_URL=['\"]?postgres(ql)?://[^@]*@)[^/?'\"]+#\\1$DB_URL_HOSTPORT#" "$ENV_FILE"
      ok "Database address in DATABASE_URL changed from $cur to $DB_URL_HOSTPORT (for $MODE mode)"
    fi
    if [ "$PORT_SET" -eq 1 ] && [ "$(kv_get "$ENV_FILE" PORT)" != "$PORT" ]; then
      run sed -i "s/^[[:space:]]*PORT[[:space:]]*=.*/PORT=$PORT/" "$ENV_FILE"
      ok "Changed PORT to $PORT"
    fi
  else
    if dry && [ -z "$DB_PASSWORD" ]; then
      pw="(asked during the real install)"
    else
      pw=$(ask_db_password) || die "No database password given. Run in a terminal so it can ask, or pass --db-password."
    fi
    write_env_file "$pw"
    ENV_CREATED=1
    ok "Wrote $ENV_FILE (readable by root only)"
  fi

  if [ "$SKIP_DB_CHECK" -eq 1 ]; then warn "Skipping the database test (--skip-db-check)."; return 0; fi
  if dry; then
    run docker run --rm --network "$([ "$MODE" = host ] && echo host || echo "${DB_NETWORK:-bridge}")" \
      "${DB_IMAGE:-postgres:18-alpine}" psql "postgresql://$DB_USER:***@$DB_URL_HOSTPORT/$DB_NAME" -c "select current_user"
    return 0
  fi
  info "Testing the database login ($DB_USER@$DB_URL_HOSTPORT/$DB_NAME)..."
  for attempt in 1 2 3; do
    url=$(db_url_from_env)
    if out=$(db_test "$url"); then
      ok "Database login works"
      return 0
    fi
    explain_db_error "$out"
    # A password typed just now can be retyped; anything else stops with instructions.
    if [ "$ENV_CREATED" -eq 1 ] && [[ $out == *"password authentication failed"* ]] && [ -z "$DB_PASSWORD" ] \
       && have_tty && [ "$attempt" -lt 3 ]; then
      pw=$(ask_db_password) || break
      write_env_file "$pw"
      continue
    fi
    break
  done
  info "Your settings are saved in $ENV_FILE. After fixing the database, run the installer again."
  if [[ $out == *"password authentication failed"* ]]; then
    info "To change the saved password: edit DATABASE_URL in $ENV_FILE, or delete the file and run again."
  fi
  die "The app needs a working database connection (use --skip-db-check to start anyway)."
}

# ----------------------------------------------------------------------------- step 6: compose
write_override() {
  local nets=() n labels="" envs="" ep res
  if [ "$DB_KIND" != own ] && [ "$MODE" = host ] && [ "${DB_VIA_NETWORK:-0}" = 1 ]; then
    write_file "$OVERRIDE_FILE" 644 root:root <<EOF
# Generated by deploy/install.sh (mode: host, database over Docker network) - re-running the
# installer rewrites this file. The app joins the Postgres container's network ($DB_NETWORK) to
# reach the database, and listens on the server's 127.0.0.1:$PORT only, for the reverse proxy here.
services:
  $SERVICE:
    environment:
      HOST: 0.0.0.0
    ports:
      - "127.0.0.1:$PORT:$PORT"
    networks:
      - $DB_NETWORK
networks:
  $DB_NETWORK:
    external: true
EOF
    return 0
  fi
  if [ "$DB_KIND" != own ] && [ "$MODE" = host ]; then
    write_file "$OVERRIDE_FILE" 644 root:root <<EOF
# Generated by deploy/install.sh (mode: host) - re-running the installer rewrites this file.
# The app shares the server's network and listens on 127.0.0.1:$PORT only;
# the reverse proxy on this server forwards $DOMAIN to it.
services:
  $SERVICE:
    network_mode: host
    environment:
      HOST: 127.0.0.1
EOF
    return 0
  fi

  if [ -n "$PROXY_NETWORK" ]; then nets+=("$PROXY_NETWORK"); fi
  if [ "$DB_KIND" != own ] && [ -n "$DB_NETWORK" ] && [ "$DB_NETWORK" != "$PROXY_NETWORK" ]; then nets+=("$DB_NETWORK"); fi

  if [ "$MODE" = docker ]; then case $PROXY_KIND in
    traefik)
      read -r ep res <<<"$(traefik_detect)"
      TRAEFIK_EP=$ep; TRAEFIK_RES=${res:-}
      labels+="      traefik.enable: \"true\""$'\n'
      labels+="      traefik.http.routers.vinclab.rule: \"Host(\`$DOMAIN\`)\""$'\n'
      labels+="      traefik.http.routers.vinclab.entrypoints: \"$ep\""$'\n'
      labels+="      traefik.http.routers.vinclab.tls: \"true\""$'\n'
      if [ -n "$TRAEFIK_RES" ]; then
        labels+="      traefik.http.routers.vinclab.tls.certresolver: \"$TRAEFIK_RES\""$'\n'
      else
        labels+="      # traefik.http.routers.vinclab.tls.certresolver: \"letsencrypt\"   # set to your resolver name"$'\n'
      fi
      labels+="      traefik.http.services.vinclab.loadbalancer.server.port: \"$PORT\""$'\n'
      if [ -n "$PROXY_NETWORK" ]; then labels+="      traefik.docker.network: \"$PROXY_NETWORK\""$'\n'; fi ;;
    caddy-docker-proxy)
      labels+="      caddy: \"$DOMAIN\""$'\n'
      labels+="      caddy.reverse_proxy: \"{{upstreams $PORT}}\""$'\n'
      labels+="      caddy.request_body.max_size: \"${BODY_MB}MB\""$'\n'
      labels+="      caddy.tls: \"$EMAIL\""$'\n' ;;
    nginx-proxy)
      envs+="      VIRTUAL_HOST: \"$DOMAIN\""$'\n'
      envs+="      VIRTUAL_PORT: \"$PORT\""$'\n'
      envs+="      LETSENCRYPT_HOST: \"$DOMAIN\""$'\n'
      envs+="      LETSENCRYPT_EMAIL: \"$EMAIL\""$'\n' ;;
  esac; fi

  if [ "$DB_KIND" = own ]; then write_override_own "$labels" "$envs" "${nets[@]}"; return 0; fi

  {
    printf '# Generated by deploy/install.sh (mode: docker, proxy: %s) - re-running the installer rewrites this file.\n' "$PROXY_KIND"
    printf '# The app is reachable only on these Docker networks, as http://%s:%s\n' "$CONTAINER" "$PORT"
    printf 'services:\n  %s:\n' "$SERVICE"
    printf '    environment:\n      HOST: 0.0.0.0\n%s' "$envs"
    if [ -n "$labels" ]; then printf '    labels:\n%s' "$labels"; fi
    if [ ${#nets[@]} -gt 0 ]; then
      printf '    networks:\n'
      for n in "${nets[@]}"; do printf '      - %s\n' "$n"; done
      printf 'networks:\n'
      for n in "${nets[@]}"; do printf '  %s:\n    external: true\n' "$n"; done
    fi
  } | write_file "$OVERRIDE_FILE" 644 root:root
}

# The app plus its own Postgres container. The database is only on an internal network that
# nothing else can join or reach (not even the internet); its data lives in a named volume.
write_override_own() {
  local labels=$1 envs=$2 n; shift 2
  local ext=("$@")
  {
    printf '# Generated by deploy/install.sh (mode: %s, own database) - re-running the installer rewrites this file.\n' "$MODE"
    printf '# The database container (%s) is reachable only by the app, on the internal network vinclab-db.\n' "$DB_CONTAINER_OWN"
    printf 'services:\n  %s:\n' "$SERVICE"
    printf '    environment:\n      HOST: 0.0.0.0\n%s' "$envs"
    if [ -n "$labels" ]; then printf '    labels:\n%s' "$labels"; fi
    if [ "$MODE" = host ]; then printf '    ports:\n      - "127.0.0.1:%s:%s"\n' "$PORT" "$PORT"; fi
    printf '    depends_on:\n      db:\n        condition: service_healthy\n'
    printf '    networks:\n      - vinclab-db\n'
    if [ "$MODE" = host ] || [ ${#ext[@]} -eq 0 ]; then printf '      - default\n'; fi
    for n in "${ext[@]}"; do printf '      - %s\n' "$n"; done
    cat <<EOF
  db:
    image: postgres:18-alpine
    container_name: $DB_CONTAINER_OWN
    restart: unless-stopped
    environment:
      POSTGRES_USER: $DB_USER
      POSTGRES_DB: $DB_NAME
      POSTGRES_PASSWORD: \${VINCLAB_DB_PASSWORD:?VINCLAB_DB_PASSWORD missing in .env}
    volumes:
      - $DB_VOLUME:/var/lib/postgresql
    networks:
      - vinclab-db
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $DB_USER -d $DB_NAME"]
      interval: 5s
      timeout: 5s
      retries: 30
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
networks:
  vinclab-db:
    internal: true
EOF
    if [ "$MODE" = host ] || [ ${#ext[@]} -eq 0 ]; then printf '  default:\n'; fi
    for n in "${ext[@]}"; do printf '  %s:\n    external: true\n' "$n"; done
    printf 'volumes:\n  %s:\n    name: %s\n' "$DB_VOLUME" "$DB_VOLUME"
  } | write_file "$OVERRIDE_FILE" 644 root:root
}

# Start the app's own database and make its password match .env. The password is set every time
# (over the container's local socket), so .env is always the source of truth: this also covers
# a reinstall that kept the data volume but wrote a new .env.
start_own_db() {
  local pw i status=""
  pw=$(kv_get "$ENV_FILE" VINCLAB_DB_PASSWORD)
  [ -n "$pw" ] || die "VINCLAB_DB_PASSWORD is missing in $ENV_FILE."
  quiet dc up -d db || die "Starting the database container failed."
  info "Waiting for the database container..."
  for ((i = 1; i <= 45; i++)); do
    status=$("$DOCKER_BIN" inspect -f '{{.State.Health.Status}}' "$DB_CONTAINER_OWN" 2>/dev/null || true)
    [ "$status" = healthy ] && break
    sleep 2
  done
  [ "$status" = healthy ] || { dc logs --tail 30 db 2>&1 | sed 's/^/      /' >&2 || true; die "The database container did not become ready."; }
  # shellcheck disable=SC2016  # :'pw' is a psql variable, not shell
  printf '%s\n' "ALTER ROLE $DB_USER PASSWORD :'pw';" \
    | dc exec -T db psql -q -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_NAME" -v pw="$pw" >>"$LOG_FILE" 2>&1 \
    || die "Could not set the database password (see $LOG_FILE)."
  ok "Database container '$DB_CONTAINER_OWN' is ready (data in Docker volume '$DB_VOLUME')"
}

app_health() {
  dc exec -T "$SERVICE" wget -qO- "http://127.0.0.1:$PORT/api/health" 2>/dev/null | grep -Eq '"ok"[[:space:]]*:[[:space:]]*true'
}

start_app() {
  step "Building and starting the app container"
  write_override
  ok "Wrote $OVERRIDE_FILE"
  if dry; then
    run docker compose build --pull
    run docker compose up -d --remove-orphans
    return 0
  fi
  quiet dc config -q || die "docker compose rejected the configuration (see above)."
  info "Building the image (the first build takes a minute or two)..."
  quiet dc build --pull || die "Building the app image failed."
  if [ "$DB_KIND" = own ]; then start_own_db; fi
  quiet dc up -d --remove-orphans || die "Starting the container failed."
  # Remove only our own old, untagged images (never other projects' images).
  "$DOCKER_BIN" image prune -f --filter label=org.vinclab.app=vinclab >>"$LOG_FILE" 2>&1 || true
  info "Waiting for the app to answer /api/health ..."
  local i
  for ((i = 1; i <= 30; i++)); do
    if app_health; then APP_HEALTHY=1; break; fi
    sleep 2
  done
  if [ "$APP_HEALTHY" -eq 1 ]; then
    ok "The app is running (container '$CONTAINER')"
  else
    fail "The app did not start correctly. Last log lines:"
    dc logs --tail 40 "$SERVICE" 2>&1 | sed 's/^/      /' >&2 || true
    warn "The app is not answering. See logs with: cd $APP_DIR && sudo docker compose logs -f"
  fi
}

# ----------------------------------------------------------------------------- step 7: backups
setup_backups() {
  step "Backups (every 3 hours)"
  local keep="all from the last 2 days, then one a day for 30 days"
  run chmod 755 "$APP_DIR/deploy/backup.sh"
  if [ "${HAS_SYSTEMD:-1}" = 1 ]; then
  write_file "$UNIT_DIR/$SERVICE-backup.service" 644 root:root <<EOF
# Managed by the VINC Lab installer (deploy/install.sh).
[Unit]
Description=VINC Lab database backup
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
WorkingDirectory=$APP_DIR
ExecStart=/bin/bash $APP_DIR/deploy/backup.sh
EOF
  write_file "$UNIT_DIR/$SERVICE-backup.timer" 644 root:root <<EOF
# Managed by the VINC Lab installer (deploy/install.sh).
[Unit]
Description=VINC Lab database backup, every 3 hours

[Timer]
OnCalendar=*-*-* 00/3:15:00
RandomizedDelaySec=120
Persistent=true

[Install]
WantedBy=timers.target
EOF
  fi
  if [ "${HAS_SYSTEMD:-1}" = 1 ]; then
    run systemctl daemon-reload
    run systemctl enable -q --now "$SERVICE-backup.timer"
    if [ -f "/etc/cron.d/$SERVICE-backup" ]; then run rm -f "/etc/cron.d/$SERVICE-backup"; fi
    ok "Backups go to $BACKUP_DIR every 3 hours ($keep)."
    info "Make one now: sudo systemctl start $SERVICE-backup"
  else
    write_file "/etc/cron.d/$SERVICE-backup" 644 root:root <<EOF
# Managed by the VINC Lab installer (deploy/install.sh). Database backup every 3 hours.
15 */3 * * * root /bin/bash $APP_DIR/deploy/backup.sh >>/var/log/$SERVICE-backup.log 2>&1
EOF
    ok "Backups go to $BACKUP_DIR every 3 hours via cron ($keep)."
    info "Make one now: sudo bash $APP_DIR/deploy/backup.sh"
  fi
}

# ----------------------------------------------------------------------------- DNS
server_ips() {
  local ip url
  for url in https://api.ipify.org https://ifconfig.me/ip https://icanhazip.com; do
    ip=$(curl -4 -fsS --max-time 6 "$url" 2>/dev/null | tr -d '[:space:]') || true
    if [[ $ip =~ ^[0-9]+(\.[0-9]+){3}$ ]]; then printf '%s\n' "$ip"; break; fi
  done
  hostname -I 2>/dev/null | tr ' ' '\n' | grep -E '^[0-9]+(\.[0-9]+){3}$' || true
}

domain_ips() {
  local ips=""
  if command -v dig >/dev/null 2>&1; then
    ips=$(dig +short +time=3 +tries=2 A "$DOMAIN" @1.1.1.1 2>/dev/null | grep -E '^[0-9]+(\.[0-9]+){3}$' || true)
  fi
  if [ -z "$ips" ]; then
    ips=$(curl -fsS --max-time 6 "https://dns.google/resolve?name=$DOMAIN&type=A" 2>/dev/null \
          | grep -oE '"data": ?"[0-9]+(\.[0-9]+){3}"' | grep -oE '[0-9]+(\.[0-9]+){3}' || true)
  fi
  if [ -z "$ips" ]; then
    ips=$(getent ahostsv4 "$DOMAIN" 2>/dev/null | awk '{print $1}' | grep -vE '^127\.' || true)
  fi
  printf '%s\n' "$ips" | sed '/^$/d' | sort -u
}

check_dns() {
  local mine theirs ip
  mine=$(server_ips | sort -u)
  theirs=$(domain_ips)
  DNS_OK=0
  if [ -z "$theirs" ]; then
    DNS_MSG="$DOMAIN does not point anywhere yet (no DNS A record found)."
  else
    for ip in $theirs; do
      if grep -qxF "$ip" <<<"$mine"; then DNS_OK=1; fi
    done
    if [ "$DNS_OK" -eq 1 ]; then
      DNS_MSG="$DOMAIN points to this server ($(paste -sd' ' - <<<"$theirs"))."
    else
      DNS_MSG="$DOMAIN points to $(paste -sd' ' - <<<"$theirs"), but this server is $(head -n1 <<<"$mine")."
    fi
  fi
  if [ "$SKIP_DNS_CHECK" -eq 1 ] && [ "$DNS_OK" -eq 0 ]; then
    DNS_MSG="$DNS_MSG (--skip-dns-check given, continuing anyway)"
    DNS_OK=1
  fi
}

dns_help() {
  info "Add a DNS 'A' record:  name 'lms' (for $DOMAIN)  ->  value $(server_ips | head -n1)"
  info "If you use Cloudflare, set that record to 'DNS only' (grey cloud) while setting up."
  info "DNS changes take a few minutes to an hour. Then run:  sudo bash $APP_DIR/deploy/install.sh"
}

# ----------------------------------------------------------------------------- host proxies
upstream() { printf '127.0.0.1:%s' "$PORT"; }

ensure_certbot() {
  if [ -x /snap/bin/certbot ] && [ "$(command -v certbot)" = /snap/bin/certbot ]; then return 0; fi
  apt_install certbot "python3-certbot-$1"
}

obtain_certificate() {
  local plugin=$1
  if [ "$DNS_OK" -ne 1 ] && [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    warn "Skipping the HTTPS certificate: $DNS_MSG"
    dns_help
    return 0
  fi
  info "Getting an HTTPS certificate from Let's Encrypt..."
  ensure_certbot "$plugin" || { warn "Could not install certbot; HTTPS is not set up yet."; return 0; }
  if quiet certbot "--$plugin" -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" \
       --no-eff-email --redirect --keep-until-expiring; then
    HTTPS_OK=1
    ok "HTTPS is set up (the certificate renews automatically)"
  else
    warn "certbot could not get a certificate. The site works on http:// for now."
    info "Details: /var/log/letsencrypt/letsencrypt.log. Fix DNS/firewall, then run the installer again."
  fi
}

caddy_uses_caddyfile() {
  systemctl is-active --quiet caddy 2>/dev/null || return 1
  systemctl show -p ExecStart --value caddy 2>/dev/null | grep -qF "$CADDYFILE"
}

caddyfile_is_package_default() {
  [ -f "$CADDYFILE" ] || return 1
  local expected actual
  expected=$(dpkg-query -W -f='${Conffiles}\n' caddy 2>/dev/null | awk -v f="$CADDYFILE" '$1==f {print $2}')
  [ -n "$expected" ] || return 1
  actual=$(md5sum "$CADDYFILE" | awk '{print $1}')
  [ "$expected" = "$actual" ]
}

caddy_restore() {
  if [ "$1" -eq 1 ]; then cp -p "$TMP_DIR/Caddyfile.bak" "$CADDYFILE"; fi
  if [ "$2" -eq 1 ]; then cp -p "$TMP_DIR/vinclab.caddy.bak" "$CADDY_SITE_FILE"; else rm -f "$CADDY_SITE_FILE"; fi
}

configure_host_caddy() {
  info "Adding $DOMAIN to Caddy ($CADDY_SITE_FILE)"
  local had_main=0 had_site=0
  if [ -f "$CADDYFILE" ]; then had_main=1; dry || cp -p "$CADDYFILE" "$TMP_DIR/Caddyfile.bak"; fi
  if [ -f "$CADDY_SITE_FILE" ]; then had_site=1; dry || cp -p "$CADDY_SITE_FILE" "$TMP_DIR/vinclab.caddy.bak"; fi

  run install -d -m 755 "$CADDY_SITES"
  write_file "$CADDY_SITE_FILE" 644 root:root <<EOF
# $TEMPLATE_MARK - managed by the VINC Lab installer (deploy/install.sh); re-running it rewrites this file.
$DOMAIN {
	tls $EMAIL
	encode gzip
	request_body {
		max_size ${BODY_MB}MB
	}
	reverse_proxy $(upstream)
}
EOF
  STATE_FILES+=("$CADDY_SITE_FILE")

  if [ "$had_main" -eq 1 ] && caddyfile_is_package_default; then
    dry || cp -p "$CADDYFILE" "$CADDYFILE.vinclab-orig"
    write_file "$CADDYFILE" 644 root:root <<EOF
# Caddy configuration. Each website has its own file in $CADDY_SITES/
$CADDY_IMPORT
EOF
    ok "Replaced the unchanged default $CADDYFILE (saved as $CADDYFILE.vinclab-orig)"
  elif [ "$had_main" -eq 1 ] && grep -qE '^[[:space:]]*import[[:space:]]+/etc/caddy/sites/\*(\.caddy)?[[:space:]]*$' "$CADDYFILE"; then
    ok "$CADDYFILE already loads $CADDY_SITES/"
  else
    if dry; then
      run sh -c "append '$CADDY_IMPORT' to $CADDYFILE"
    else
      if [ "$had_main" -eq 1 ]; then cp -p "$CADDYFILE" "$CADDYFILE.vinclab-backup-$(date +%Y%m%d%H%M%S)"; fi
      printf '\n# Added by the VINC Lab installer: load extra sites from %s/\n%s\n' "$CADDY_SITES" "$CADDY_IMPORT" >>"$CADDYFILE"
    fi
    ok "Added '$CADDY_IMPORT' to the end of $CADDYFILE (other sites untouched)"
  fi

  if dry; then
    run caddy validate --config "$CADDYFILE" --adapter caddyfile
    run systemctl reload caddy
    WEB_RESULT="Caddy on this server"
    return 0
  fi
  if ! caddy validate --config "$CADDYFILE" --adapter caddyfile >>"$LOG_FILE" 2>&1; then
    fail "Caddy rejected the new configuration. Putting the old one back."
    tail -n 8 "$LOG_FILE" | sed 's/^/      /' >&2
    caddy_restore "$had_main" "$had_site"
    return 1
  fi
  if ! quiet systemctl reload caddy; then
    fail "Caddy could not reload; putting the old configuration back."
    caddy_restore "$had_main" "$had_site"
    systemctl reload caddy >>"$LOG_FILE" 2>&1 || true
    return 1
  fi
  ok "Caddy is serving $DOMAIN"
  WEB_RESULT="Caddy on this server"
  if [ "$DNS_OK" -eq 1 ]; then
    HTTPS_OK=1
    info "Caddy is getting the HTTPS certificate now (usually under a minute)."
  else
    warn "HTTPS will start working automatically once $DOMAIN points to this server."
    dns_help
  fi
}

configure_host_nginx() {
  command -v nginx >/dev/null 2>&1 || { fail "nginx is listening but the 'nginx' command was not found."; return 1; }
  local site enabled="" ipv6="" bak="$TMP_DIR/nginx-vinclab.bak" had=0 others
  if [ -d /etc/nginx/sites-available ] && grep -rqs 'sites-enabled' /etc/nginx/nginx.conf; then
    site=/etc/nginx/sites-available/vinclab; enabled=/etc/nginx/sites-enabled/vinclab
  else
    site=/etc/nginx/conf.d/vinclab.conf
  fi
  info "Adding $DOMAIN to nginx ($site)"

  if ! dry && ! nginx -t >>"$LOG_FILE" 2>&1; then
    fail "The current nginx configuration already has errors (nginx -t fails), so it was left alone."
    return 1
  fi
  others=$(grep -rlsE "server_name[^;]*[[:space:]]${DOMAIN//./\\.}[[:space:];]" /etc/nginx/ 2>/dev/null | grep -vE '/vinclab(\.conf)?$' || true)
  if [ -n "$others" ]; then warn "Another nginx file also mentions $DOMAIN: $(paste -sd' ' - <<<"$others")"; fi
  STATE_FILES+=("$site")
  if [ -n "$enabled" ]; then STATE_FILES+=("$enabled"); fi

  # Keep our file if it already matches and certbot has added HTTPS to it.
  if [ -f "$site" ] && grep -qF "$TEMPLATE_MARK" "$site" && grep -qE "server_name[[:space:]]+$DOMAIN;" "$site" \
     && grep -qF "proxy_pass http://$(upstream);" "$site" && grep -q 'managed by Certbot' "$site"; then
    ok "nginx is already set up for $DOMAIN (keeping its HTTPS settings)"
  else
    if [ -f "$site" ] && ! dry; then cp -p "$site" "$bak"; had=1; fi
    if [ -e /proc/net/if_inet6 ] && grep -rqsE 'listen[[:space:]]+\[::\]:80' /etc/nginx/; then ipv6="    listen [::]:80;"; fi
    write_file "$site" 644 root:root <<EOF
# $TEMPLATE_MARK - managed by the VINC Lab installer (deploy/install.sh).
# certbot adds the HTTPS lines to this file.
server {
    listen 80;
$ipv6
    server_name $DOMAIN;

    client_max_body_size ${BODY_MB}m;

    location / {
        proxy_pass http://$(upstream);
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
    }
}
EOF
    if [ -n "$enabled" ]; then run ln -sfn "$site" "$enabled"; fi
    if dry; then
      run nginx -t
    elif ! nginx -t >>"$LOG_FILE" 2>&1; then
      fail "nginx rejected the new configuration; removing it again."
      tail -n 8 "$LOG_FILE" | sed 's/^/      /' >&2
      if [ "$had" -eq 1 ]; then cp -p "$bak" "$site"; else rm -f "$site"; if [ -n "$enabled" ]; then rm -f "$enabled"; fi; fi
      return 1
    fi
    ok "nginx configuration is valid"
  fi
  if [ -n "$enabled" ] && [ ! -e "$enabled" ]; then run ln -sfn "$site" "$enabled"; fi
  quiet systemctl reload nginx || { fail "nginx could not reload."; return 1; }
  ok "nginx is serving $DOMAIN"
  WEB_RESULT="nginx on this server"
  obtain_certificate nginx
}

configure_host_apache() {
  if ! command -v a2enmod >/dev/null 2>&1 || ! command -v apache2ctl >/dev/null 2>&1; then
    fail "Apache is running but this does not look like Debian/Ubuntu Apache (no a2enmod)."
    return 1
  fi
  info "Adding $DOMAIN to Apache ($APACHE_SITE)"
  local bak="$TMP_DIR/apache-vinclab.bak" had=0 m
  if ! dry && ! apache2ctl configtest >>"$LOG_FILE" 2>&1; then
    fail "The current Apache configuration already has errors (apachectl configtest fails), so it was left alone."
    return 1
  fi
  for m in proxy proxy_http headers ssl rewrite; do quiet a2enmod -q "$m" || return 1; done
  ok "Apache modules enabled: proxy, proxy_http, headers, ssl, rewrite"
  STATE_FILES+=("$APACHE_SITE" "/etc/apache2/sites-available/vinclab-le-ssl.conf")

  if [ -f "$APACHE_SITE" ] && grep -qF "$TEMPLATE_MARK" "$APACHE_SITE" && grep -qE "ServerName[[:space:]]+$DOMAIN\$" "$APACHE_SITE" \
     && grep -qF "ProxyPass / http://$(upstream)/" "$APACHE_SITE" && grep -q 'RewriteCond %{SERVER_NAME} =' "$APACHE_SITE"; then
    ok "Apache is already set up for $DOMAIN (keeping its HTTPS settings)"
  else
    if [ -f "$APACHE_SITE" ] && ! dry; then cp -p "$APACHE_SITE" "$bak"; had=1; fi
    write_file "$APACHE_SITE" 644 root:root <<EOF
# $TEMPLATE_MARK - managed by the VINC Lab installer (deploy/install.sh).
# certbot adds the HTTPS redirect here and creates vinclab-le-ssl.conf next to it.
<VirtualHost *:80>
    ServerName $DOMAIN

    ProxyPreserveHost On
    ProxyRequests Off
    ProxyTimeout 120
    LimitRequestBody $((BODY_MB * 1024 * 1024))
    RequestHeader set X-Forwarded-Proto "expr=%{REQUEST_SCHEME}"
    ProxyPass / http://$(upstream)/
    ProxyPassReverse / http://$(upstream)/

    ErrorLog \${APACHE_LOG_DIR}/vinclab-error.log
    CustomLog \${APACHE_LOG_DIR}/vinclab-access.log combined
</VirtualHost>
EOF
    quiet a2ensite -q vinclab || return 1
    if dry; then
      run apache2ctl configtest
    elif ! apache2ctl configtest >>"$LOG_FILE" 2>&1; then
      fail "Apache rejected the new configuration; removing it again."
      tail -n 8 "$LOG_FILE" | sed 's/^/      /' >&2
      if [ "$had" -eq 1 ]; then cp -p "$bak" "$APACHE_SITE"; else a2dissite -q vinclab >>"$LOG_FILE" 2>&1 || true; rm -f "$APACHE_SITE"; fi
      return 1
    fi
    ok "Apache configuration is valid"
  fi
  quiet a2ensite -q vinclab || return 1
  quiet systemctl reload apache2 || { fail "Apache could not reload."; return 1; }
  ok "Apache is serving $DOMAIN"
  WEB_RESULT="Apache on this server"
  obtain_certificate apache
}

# ----------------------------------------------------------------------------- docker proxies
# nginx-proxy: allow big uploads with a per-site file in its vhost.d folder (affects only our domain).
nginx_proxy_body_size() {
  local src file
  src=$("$DOCKER_BIN" inspect -f '{{range .Mounts}}{{if eq .Destination "/etc/nginx/vhost.d"}}{{.Source}}{{end}}{{end}}' "$PROXY_CONTAINER" 2>/dev/null || true)
  if [ -z "$src" ] || [ ! -d "$src" ]; then
    warn "Uploads above 1 MB need a setting in nginx-proxy: put  client_max_body_size ${BODY_MB}m;  in its /etc/nginx/vhost.d/$DOMAIN file."
    return 0
  fi
  file="$src/$DOMAIN"
  if [ -f "$file" ] && ! grep -qF "$TEMPLATE_MARK" "$file"; then
    info "$file already exists (not ours); leaving it. Make sure it contains: client_max_body_size ${BODY_MB}m;"
    return 0
  fi
  write_file "$file" 644 root:root <<EOF
# $TEMPLATE_MARK - added by the VINC Lab installer: allow photo uploads.
client_max_body_size ${BODY_MB}m;
EOF
  STATE_FILES+=("$file")
  ok "Allowed ${BODY_MB} MB uploads for $DOMAIN in nginx-proxy ($file)"
  info "nginx-proxy applies it the next time it regenerates its config (e.g. when our container starts)."
}

# ----------------------------------------------------------------------------- Caddy in a container
# A plain Caddy container (for example another project's) that reads a Caddyfile mounted from this
# server. We add one clearly marked block for our domain, let Caddy check the result (and put the
# file back if it fails), then reload Caddy gracefully. Other sites in the file are not touched.
CC_BEGIN="# >>> vinclab (added by /opt/vinclab/deploy/install.sh; deploy/uninstall.sh removes it) >>>"
CC_END="# <<< vinclab <<<"

# Prints the Caddyfile's path on this server and inside the container, separated by a tab.
container_caddyfile() {
  local c=$1 cmd cfg mounts line type src dst best="" bestlen=0
  cmd=$("$DOCKER_BIN" inspect -f '{{join .Config.Cmd " "}} {{join .Args " "}}' "$c" 2>/dev/null || true)
  cfg=$(grep -oE -- '--config[= ]+[^ ]+' <<<"$cmd" | head -n 1 | sed -E 's/^--config[= ]+//' || true)
  cfg=${cfg:-/etc/caddy/Caddyfile}
  case $cmd in *--adapter*) grep -qE -- '--adapter[= ]+caddyfile' <<<"$cmd" || return 1 ;; esac
  # shellcheck disable=SC2016  # Go template, not shell
  mounts=$("$DOCKER_BIN" inspect -f '{{range .Mounts}}{{.Type}}|{{.Source}}|{{.Destination}}{{"\n"}}{{end}}' "$c" 2>/dev/null || true)
  while IFS= read -r line; do
    [ -n "$line" ] || continue
    IFS='|' read -r type src dst <<<"$line"
    case $type in bind|volume) ;; *) continue ;; esac
    case $cfg in "$dst"|"$dst"/*) if [ ${#dst} -gt "$bestlen" ]; then best="$src|$dst"; bestlen=${#dst}; fi ;; esac
  done <<<"$mounts"
  [ -n "$best" ] || return 1
  src=${best%%|*}; dst=${best#*|}
  [ -f "$src${cfg#"$dst"}" ] || return 1
  printf '%s\t%s\n' "$src${cfg#"$dst"}" "$cfg"
}

caddy_block() {
  cat <<EOF
$CC_BEGIN
$DOMAIN {
	encode gzip
	request_body {
		max_size ${BODY_MB}MB
	}
	reverse_proxy $CONTAINER:$PORT
}
$CC_END
EOF
}

configure_container_caddy() {
  local c=$PROXY_CONTAINER found host cfg rest
  if ! found=$(container_caddyfile "$c"); then
    warn "Could not find the Caddyfile of container $c on this server."
    print_generic_instructions "Caddy (container $c)"
    info "In its Caddyfile, add:  $DOMAIN { reverse_proxy $CONTAINER:$PORT }   then: sudo docker exec $c caddy reload --config /etc/caddy/Caddyfile"
    return 0
  fi
  host=${found%%$'\t'*}; cfg=${found#*$'\t'}
  info "Caddy (container $c) reads $cfg, which is $host on this server"
  # The file without any block we added before.
  rest=$(awk -v b="$CC_BEGIN" -v e="$CC_END" '$0 == b {skip = 1; next} $0 == e {skip = 0; next} !skip' "$host")
  if grep -qE "^[[:space:]]*(https?://)?$DOMAIN([[:space:],:{]|$)" <<<"$rest"; then
    warn "$host already has a site for $DOMAIN that the installer did not add; leaving it as it is."
    info "Make sure it says:  reverse_proxy $CONTAINER:$PORT"
    WEB_RESULT="Caddy (container '$c'), existing site block"
    return 0
  fi
  if dry; then
    info "[dry-run] would add to $host:"
    caddy_block | sed 's/^/      | /'
    WEB_RESULT="Caddy (container '$c')"
    return 0
  fi
  cp -p "$host" "$TMP_DIR/Caddyfile.container.bak"
  # Write in place (same file), so a single-file bind mount keeps seeing it.
  { printf '%s\n' "$rest" | sed -e :a -e '/^\n*$/{$d;N;ba' -e '}'; printf '\n'; caddy_block; } >"$TMP_DIR/Caddyfile.new"
  cat "$TMP_DIR/Caddyfile.new" >"$host"
  if ! "$DOCKER_BIN" exec "$c" caddy validate --config "$cfg" --adapter caddyfile >>"$LOG_FILE" 2>&1; then
    cat "$TMP_DIR/Caddyfile.container.bak" >"$host"
    fail "Caddy rejected the configuration with our site added, so $host was put back as it was (see $LOG_FILE)."
    return 1
  fi
  STATE_FILES+=("caddy-container:$c:$host:$cfg")
  if "$DOCKER_BIN" exec -w "$(dirname "$cfg")" "$c" caddy reload --config "$cfg" --adapter caddyfile >>"$LOG_FILE" 2>&1; then
    ok "Caddy (container $c) now serves https://$DOMAIN and gets its certificate by itself"
    WEB_RESULT="Caddy (container '$c')"
  else
    warn "The new Caddy configuration is valid, but Caddy could not reload it (its admin API may be turned off)."
    info "Restart it once to load it (its sites are down for a second or two):  sudo docker restart $c"
    WEB_RESULT="Caddy (container '$c') - restart it once: sudo docker restart $c"
    MANUAL_STEP=1
  fi
  return 0
}

docker_proxy_note() {
  if [ "$DNS_OK" -eq 1 ]; then
    info "The proxy gets the HTTPS certificate by itself; give it a minute."
  else
    warn "The proxy can only get an HTTPS certificate once $DOMAIN points to this server."
    dns_help
  fi
}

print_npm_instructions() {
  MANUAL_STEP=1
  local fwd_host=$CONTAINER
  if [ "$MODE" = host ]; then fwd_host=127.0.0.1; fi
  cat <<EOF

    ${C_BOLD}One manual step in Nginx Proxy Manager${C_RESET} (it has no automatic setup):
      Open its admin page (usually http://<server-ip>:81) -> Hosts -> Proxy Hosts -> Add Proxy Host
        Details tab:
          Domain Names:          $DOMAIN
          Scheme:                http
          Forward Hostname / IP: $fwd_host
          Forward Port:          $PORT
          Block Common Exploits: on
        SSL tab:
          SSL Certificate:       Request a new SSL Certificate
          Force SSL:             on      HTTP/2 Support: on
          Email:                 $EMAIL   (and agree to the Let's Encrypt terms)
        Save.
EOF
  if [ "$DNS_OK" -ne 1 ]; then warn "Do the SSL tab only after $DOMAIN points to this server."; dns_help; fi
  WEB_RESULT="Nginx Proxy Manager (one manual step, see above)"
}

print_generic_instructions() {
  MANUAL_STEP=1
  local where=$1 target
  if [ "$MODE" = host ]; then target="http://127.0.0.1:$PORT"; else target="http://$CONTAINER:$PORT"; fi
  if [ "$PROXY_WHERE" = none ] && [ "$MODE" = host ]; then
    warn "Nothing serves ports 80/443 yet, so $DOMAIN is not reachable from the internet yet."
    where="the reverse proxy you set up"
  else
    warn "The installer cannot set up $where automatically."
  fi
  cat <<EOF

    ${C_BOLD}What to do:${C_RESET} in $where, forward ${C_BOLD}$DOMAIN${C_RESET} to ${C_BOLD}$target${C_RESET}
    (pass the Host, X-Forwarded-For and X-Forwarded-Proto headers, allow ${BODY_MB} MB uploads,
    and get an HTTPS certificate for $DOMAIN). The app is already running; only this link is missing.

    Examples:
      nginx:    server { server_name $DOMAIN; client_max_body_size ${BODY_MB}m;
                  location / { proxy_pass $target; proxy_set_header Host \$host;
                    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
                    proxy_set_header X-Forwarded-Proto \$scheme; } }
      Caddy:    $DOMAIN { request_body { max_size ${BODY_MB}MB }  reverse_proxy ${target#http://} }
      Traefik (file provider):
                http: { routers: { vinclab: { rule: "Host(\`$DOMAIN\`)", service: vinclab, tls: {} } },
                        services: { vinclab: { loadBalancer: { servers: [ { url: "$target" } ] } } } }
      HAProxy:  backend vinclab
                  option forwardfor
                  server app ${target#http://}

    Check the app itself:  cd $APP_DIR && sudo docker compose exec $SERVICE wget -qO- http://127.0.0.1:$PORT/api/health
EOF
  if [ "$MODE" = docker ]; then
    info "In docker mode the proxy container must share a Docker network with '$CONTAINER'"
    info "(currently: ${PROXY_NETWORK:-none}; change it with --proxy-network and run again)."
  fi
  WEB_RESULT="manual step needed in $where (see above)"
}

# ----------------------------------------------------------------------------- step 8: routing
setup_routing() {
  step "Connecting $DOMAIN to the app"
  check_dns
  if [ "$DNS_OK" -eq 1 ]; then ok "DNS: $DNS_MSG"; else warn "DNS: $DNS_MSG"; fi

  local rc=0
  if [ "$MODE" = docker ]; then
    case $PROXY_KIND in
      traefik)
        ok "Traefik routes $DOMAIN to the app (labels in $OVERRIDE_FILE, entrypoint '${TRAEFIK_EP:-websecure}')"
        if [ -n "$TRAEFIK_RES" ]; then ok "Traefik certificate resolver: $TRAEFIK_RES"
        else warn "Could not find Traefik's certificate resolver name: set traefik.http.routers.vinclab.tls.certresolver in $OVERRIDE_FILE, or run again with --traefik-certresolver NAME."; fi
        WEB_RESULT="Traefik (container '$PROXY_CONTAINER')"
        docker_proxy_note ;;
      caddy-docker-proxy)
        ok "caddy-docker-proxy routes $DOMAIN to the app (labels in $OVERRIDE_FILE)"
        WEB_RESULT="caddy-docker-proxy (container '$PROXY_CONTAINER')"
        docker_proxy_note ;;
      nginx-proxy)
        ok "nginx-proxy routes $DOMAIN to the app (VIRTUAL_HOST in $OVERRIDE_FILE)"
        if [ -n "$DOCKER_BIN" ]; then
          nginx_proxy_body_size
          if ! "$DOCKER_BIN" ps --format '{{.Image}}' 2>/dev/null | grep -qiE 'acme-companion|letsencrypt-nginx-proxy-companion'; then
            warn "No acme-companion container found; nginx-proxy will not get an HTTPS certificate by itself."
          fi
        fi
        WEB_RESULT="nginx-proxy (container '$PROXY_CONTAINER')"
        docker_proxy_note ;;
      npm) print_npm_instructions ;;
      caddy) configure_container_caddy || rc=1 ;;
      *) print_generic_instructions "${PROXY_PROGRAMS:-your reverse proxy}" ;;
    esac
    if [ "$rc" -ne 0 ]; then
      WEB_FAILED=1
      WEB_RESULT="FAILED - see the messages above"
      warn "The web server step did not finish. Other sites were not changed."
    fi
    return 0
  fi

  # host mode
  case $PROXY_WHERE:$PROXY_KIND in
    host:nginx)  configure_host_nginx || rc=1 ;;
    host:apache) configure_host_apache || rc=1 ;;
    host:caddy)
      if caddy_uses_caddyfile || dry; then configure_host_caddy || rc=1
      else print_generic_instructions "Caddy (not the standard caddy service with $CADDYFILE)"; fi ;;
    container:npm) print_npm_instructions ;;
    none:*) print_generic_instructions "a reverse proxy" ;;
    *) print_generic_instructions "${PROXY_PROGRAMS:-your reverse proxy}" ;;
  esac
  if [ "$rc" -ne 0 ]; then
    WEB_FAILED=1
    WEB_RESULT="FAILED - see the messages above"
    warn "The web server step did not finish. Other sites were not changed."
  fi
  return 0
}

write_state() {
  local f list=""
  for f in "${STATE_FILES[@]}"; do list+="$f "; done
  write_file "$STATE_FILE" 600 root:root <<EOF
# Written by deploy/install.sh; read by deploy/uninstall.sh.
MODE=$MODE
DB_KIND=$DB_KIND
PROXY_KIND=$PROXY_KIND
PROXY_WHERE=$PROXY_WHERE
PROXY_NETWORK=$PROXY_NETWORK
DOMAIN=$DOMAIN
PROXY_FILES='${list% }'
INSTALLED_AT=$(date -u +%FT%TZ)
EOF
}

# ----------------------------------------------------------------------------- step 9: summary
summary() {
  step "Summary"
  local scheme=http
  if [ "$HTTPS_OK" -eq 1 ] || [ "$MODE" = docker ]; then scheme=https; fi
  if dry; then
    printf '\n  %sDry run finished - nothing was changed.%s\n' "$C_BOLD" "$C_RESET"
    info "Mode: $MODE   Proxy: $PROXY_KIND ($PROXY_WHERE)   Database: $DB_URL_HOSTPORT${DB_NETWORK:+ via network $DB_NETWORK}"
    info "Routing: $WEB_RESULT"
    info "DNS: $DNS_MSG"
    return 0
  fi
  printf '\n'
  if [ "$APP_HEALTHY" -eq 1 ]; then ok "App: running (container '$CONTAINER', $MODE mode)"
  else fail "App: NOT answering - see: cd $APP_DIR && sudo docker compose logs --tail 100"; fi
  info "Routing: $WEB_RESULT"
  if [ "$MANUAL_STEP" -eq 1 ]; then
    printf '\n  %sOpen (after the manual step above):%s https://%s\n' "$C_BOLD" "$C_RESET" "$DOMAIN"
  else
    printf '\n  %sOpen:%s %s://%s\n' "$C_BOLD" "$C_RESET" "$scheme" "$DOMAIN"
  fi
  if [ "$ADMIN_PASSWORD" = "$DEFAULT_ADMIN_PASSWORD" ]; then
    printf '  %sLog in:%s username %sadmin%s, password %s%s%s (on a brand-new database)\n' \
      "$C_BOLD" "$C_RESET" "$C_BOLD" "$C_RESET" "$C_BOLD" "$DEFAULT_ADMIN_PASSWORD" "$C_RESET"
  else
    info "Log in: username 'admin' with the password given to --admin-password (on a brand-new database)."
  fi
  printf '  %s!%s Change the admin password right after your first login.\n' "$C_YELLOW" "$C_RESET"
  cat <<EOF

  Data:      $(if [ "$DB_KIND" = own ]; then printf "own PostgreSQL 18 container '%s' (data in Docker volume '%s')" "$DB_CONTAINER_OWN" "$DB_VOLUME"; else printf "PostgreSQL database '%s' (%s)" "$DB_NAME" "$DB_URL_HOSTPORT"; fi)
  Backups:   $BACKUP_DIR/  (every 3 hours; all from the last 2 days, then one a day for 30 days)
  Settings:  $ENV_FILE
  Update:    sudo bash $APP_DIR/deploy/update.sh
  Logs:      cd $APP_DIR && sudo docker compose logs -f
  Restart:   cd $APP_DIR && sudo docker compose restart
  Repair:    sudo bash $APP_DIR/deploy/install.sh   (safe to run again)
EOF
  if [ ${#WARNINGS[@]} -gt 0 ]; then
    printf '\n  %sThings to look at:%s\n' "$C_YELLOW" "$C_RESET"
    local w
    for w in "${WARNINGS[@]}"; do printf '   - %s\n' "$w"; done
  fi
  printf '\n'
}

# ----------------------------------------------------------------------------- main
main() {
  trap 'on_error $LINENO "$BASH_COMMAND"' ERR
  trap cleanup EXIT
  parse_args "$@"
  TMP_DIR=$(mktemp -d)
  chmod 700 "$TMP_DIR"
  if dry; then
    LOG_FILE="$TMP_DIR/install.log"
    printf '%sDRY RUN: nothing will be changed on this machine.%s\n' "$C_BOLD" "$C_RESET"
  fi
  printf '%sVINC Lab installer%s\n' "$C_BOLD" "$C_RESET"

  if [ "$PORT_SET" -eq 0 ] && [ -f "$ENV_FILE" ]; then
    local p
    p=$(kv_get "$ENV_FILE" PORT)
    if [ -n "$p" ]; then PORT=$p; fi
  fi
  check_system
  install_basics
  fetch_code
  decide_setup
  setup_settings
  start_app
  setup_backups
  setup_routing
  write_state
  summary

  trap - ERR
  dry && return 0
  if [ "$APP_HEALTHY" -ne 1 ] || [ "$WEB_FAILED" -eq 1 ]; then exit 1; fi
  return 0
}

main "$@"; exit $?
