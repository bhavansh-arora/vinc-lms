#!/usr/bin/env bash
# Back up the VINC Lab database:  sudo bash /opt/vinclab/deploy/backup.sh
#
# Writes two files into <app folder>/backups/, named with the time in UTC:
#   vinclab-YYYYMMDD-HHMMSS.dump     native PostgreSQL backup (pg_dump), when VINC Lab has its
#                                    own database container; restore with pg_restore
#   vinclab-YYYYMMDD-HHMMSS.json.gz  the app's own export; restore with server/restore.js
# Then deletes old backups: everything from the last 48 hours is kept, then the newest backup of
# each day for 30 days (change with BACKUP_KEEP_HOURS / BACKUP_KEEP_DAYS in .env).
#
# The installer runs this every 3 hours (systemd timer vinclab-backup, or cron).

set -Eeuo pipefail

APP_DIR="${VINCLAB_APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
SERVICE="vinclab"
DB_SERVICE="db"
APP_UID=10001

cd "$APP_DIR"
[ "$(id -u)" -eq 0 ] || { echo "Please run as root:  sudo bash $APP_DIR/deploy/backup.sh" >&2; exit 1; }
mkdir -p backups
chown "$APP_UID:$APP_UID" backups
chmod 700 backups

running() { [ -n "$(docker compose ps -q --status running "$1" 2>/dev/null)" ]; }

status=0
stamp=$(date -u +%Y%m%d-%H%M%S)

# 1. Native PostgreSQL backup (only with VINC Lab's own database container).
if running "$DB_SERVICE"; then
  part="backups/.vinclab-$stamp.dump.part"
  # shellcheck disable=SC2016  # the variables are expanded inside the database container
  if docker compose exec -T "$DB_SERVICE" sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' >"$part"; then
    chown "$APP_UID:$APP_UID" "$part"
    chmod 600 "$part"
    mv "$part" "backups/vinclab-$stamp.dump"
    echo "Backup written: $APP_DIR/backups/vinclab-$stamp.dump ($(du -h "backups/vinclab-$stamp.dump" | cut -f1))"
  else
    rm -f "$part"
    echo "pg_dump failed." >&2
    status=1
  fi
fi

# 2. The app's own export; this also deletes old backups of both kinds.
if running "$SERVICE"; then
  docker compose exec -T -e "BACKUP_STAMP=$stamp" "$SERVICE" node server/backup.js || { echo "The app backup failed." >&2; status=1; }
else
  echo "The app container '$SERVICE' is not running, so the app backup was skipped." >&2
  status=1
fi

exit "$status"
