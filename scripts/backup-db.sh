#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENVIRONMENT="${1:-staging}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"

case "$ENVIRONMENT" in
  staging)
    COMPOSE_FILE="docker-compose.staging.yml"
    ENV_FILE="${ENV_FILE:-.env.staging}"
    BACKUP_DIR="${BACKUP_DIR:-./backups/staging}"
    ;;
  production|prod)
    COMPOSE_FILE="docker-compose.prod.yml"
    ENV_FILE="${ENV_FILE:-.env.production}"
    BACKUP_DIR="${BACKUP_DIR:-./backups/production}"
    ;;
  *)
    echo "Usage: $0 <staging|production>"
    exit 1
    ;;
esac

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE"
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

mkdir -p "$BACKUP_DIR"
OUT_FILE="${BACKUP_DIR}/sevenoz-${ENVIRONMENT}-${STAMP}.sql.gz"

echo "==> Backing up ${DB_NAME} to ${OUT_FILE}"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T postgres \
  pg_dump -U "$DB_USER" -d "$DB_NAME" --no-owner --no-acl | gzip > "$OUT_FILE"

echo "==> Pruning backups older than ${RETENTION_DAYS} days"
find "$BACKUP_DIR" -type f -name 'sevenoz-*.sql.gz' -mtime "+${RETENTION_DAYS}" -delete || true

echo "Backup complete."
