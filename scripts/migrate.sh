#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENVIRONMENT="${1:-staging}"
DIRECTION="${2:-up}"
STEPS="${3:-}"

case "$ENVIRONMENT" in
  staging)
    COMPOSE_FILE="docker-compose.staging.yml"
    ENV_FILE="${ENV_FILE:-.env.staging}"
    ;;
  production|prod)
    COMPOSE_FILE="docker-compose.prod.yml"
    ENV_FILE="${ENV_FILE:-.env.production}"
    ;;
  *)
    echo "Usage: $0 <staging|production> [up|down] [steps]"
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

ARGS=("-path=/migrations" "-database=postgres://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}?sslmode=${DB_SSLMODE:-disable}" "$DIRECTION")
if [[ -n "$STEPS" ]]; then
  ARGS+=("$STEPS")
fi

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" --profile migrate run --rm --entrypoint migrate migrate "${ARGS[@]}"
