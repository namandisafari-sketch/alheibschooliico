#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="/home/iico/iico_backups"
LOG_FILE="$BACKUP_DIR/backup.log"
TIMESTAMP=$(date +%Y-%m-%d)
BACKUP_FILE="$BACKUP_DIR/alheib-db-$TIMESTAMP.sql.gz"
MAX_BACKUPS=7
COMPOSE_DIR="/home/iico/IICO/Alheib-24/docker"

mkdir -p "$BACKUP_DIR"

log() {
  local level="$1"
  shift
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $*" >> "$LOG_FILE"
}

cleanup_old() {
  log "INFO" "Cleaning up backups older than $MAX_BACKUPS days..."
  find "$BACKUP_DIR" -maxdepth 1 -name 'alheib-db-*.sql.gz' -type f \
    | sort -r \
    | tail -n +$((MAX_BACKUPS + 1)) \
    | while read -r old; do
        rm -f "$old"
        log "INFO" "Deleted old backup: $(basename "$old")"
      done
}

if [[ -f "$(dirname "$0")/../.env" ]]; then
  set -a
  source "$(dirname "$0")/../.env"
  set +a
fi

DB_HOST="${SUPABASE_DB_HOST:-localhost}"
DB_PORT="${SUPABASE_DB_PORT:-5432}"
DB_NAME="${SUPABASE_DB_NAME:-postgres}"
DB_USER="${SUPABASE_DB_USER:-postgres}"
DB_PASS="${SUPABASE_DB_PASS:-}"

log "INFO" "Starting database backup to $BACKUP_FILE"

backup_ok=false

if [ -n "$DB_PASS" ]; then
  export PGPASSWORD="$DB_PASS"
  if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" --clean --no-owner 2>> "$LOG_FILE" | gzip > "$BACKUP_FILE"; then
    backup_ok=true
  fi
elif [ -f "$COMPOSE_DIR/docker-compose.yml" ]; then
  log "INFO" "Using Docker pg_dump"
  if echo 12345678 | sudo -S docker compose -f "$COMPOSE_DIR/docker-compose.yml" exec -T db pg_dump -U postgres postgres --clean --no-owner 2>> "$LOG_FILE" | gzip > "$BACKUP_FILE"; then
    backup_ok=true
  fi
fi

if [ "$backup_ok" = true ]; then
  log "SUCCESS" "Backup completed: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"
  cleanup_old
  log "INFO" "Backup process finished successfully"
else
  log "ERROR" "Database backup failed"
  rm -f "$BACKUP_FILE"
  exit 1
fi
