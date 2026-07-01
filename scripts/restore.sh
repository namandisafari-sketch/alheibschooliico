#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="/home/iico/iico_backups"

if [[ -f "$(dirname "$0")/../.env" ]]; then
  set -a
  source "$(dirname "$0")/../.env"
  set +a
fi

DB_HOST="${SUPABASE_DB_HOST:-localhost}"
DB_PORT="${SUPABASE_DB_PORT:-5432}"
DB_NAME="${SUPABASE_DB_NAME:-postgres}"
DB_USER="${SUPABASE_DB_USER:-postgres}"
DB_PASS="${SUPABASE_DB_PASS:-postgres}"

list_backups() {
  echo "Available backups:"
  echo "=================="
  local files=( "$BACKUP_DIR"/alheib-db-*.sql.gz )
  if [[ ${#files[@]} -eq 0 || ! -f "${files[0]}" ]]; then
    echo "No backups found in $BACKUP_DIR"
    exit 1
  fi
  for f in "${files[@]}"; do
    local size
    size=$(du -h "$f" | cut -f1)
    echo "  $(basename "$f")  ($size)"
  done
}

if [[ $# -eq 0 ]]; then
  list_backups
  echo ""
  echo "Usage: $0 <backup-filename>"
  echo "Example: $0 alheib-db-2026-06-07.sql.gz"
  exit 0
fi

BACKUP_FILE="$BACKUP_DIR/$1"

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Error: Backup file not found: $BACKUP_FILE"
  echo ""
  list_backups
  exit 1
fi

echo "WARNING: This will overwrite the current database ($DB_NAME on $DB_HOST:$DB_PORT)"
echo "Backup to restore: $(basename "$BACKUP_FILE") ($(du -h "$BACKUP_FILE" | cut -f1))"
read -rp "Are you sure you want to proceed? (yes/no): " confirm

if [[ "$confirm" != "yes" ]]; then
  echo "Restore cancelled."
  exit 0
fi

export PGPASSWORD="$DB_PASS"

echo "Starting restore..."
if gunzip -c "$BACKUP_FILE" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"; then
  echo "Restore completed successfully from $(basename "$BACKUP_FILE")"
else
  echo "Restore failed!"
  exit 1
fi
