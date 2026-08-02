#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENVIRONMENT="${1:-staging}"
IMAGE_TAG="${2:-}"

usage() {
  echo "Usage: $0 <staging|production> [image-tag]"
  exit 1
}

case "$ENVIRONMENT" in
  staging)
    COMPOSE_FILE="docker-compose.staging.yml"
    ENV_FILE="${ENV_FILE:-.env.staging}"
    DEFAULT_TAG="staging"
    ;;
  production|prod)
    ENVIRONMENT="production"
    COMPOSE_FILE="docker-compose.prod.yml"
    ENV_FILE="${ENV_FILE:-.env.production}"
    DEFAULT_TAG=""
    ;;
  *)
    usage
    ;;
esac

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE"
  echo "Copy from .env.${ENVIRONMENT}.example and fill secrets."
  exit 1
fi

if [[ -z "$IMAGE_TAG" ]]; then
  IMAGE_TAG="$DEFAULT_TAG"
fi

if [[ "$ENVIRONMENT" == "production" && -z "$IMAGE_TAG" ]]; then
  echo "Production deploy requires an explicit image tag (never :latest)."
  usage
fi

export IMAGE_TAG
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

echo "==> Deploying $ENVIRONMENT with IMAGE_TAG=$IMAGE_TAG"

echo "==> Running database migrations"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" --profile migrate run --rm migrate

echo "==> Starting application stack"
if [[ "$ENVIRONMENT" == "staging" ]]; then
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --build backend website admin nginx postgres redis mailpit
else
  # Self-host VPS builds from source when GHCR images are not pre-pushed.
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --build backend website admin nginx postgres redis
fi

echo "==> Waiting for API readiness"
for _ in $(seq 1 30); do
  if docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T backend curl -fsS http://127.0.0.1:8080/health/ready >/dev/null 2>&1; then
    echo "API is ready."
    exit 0
  fi
  sleep 2
done

echo "API readiness check timed out."
exit 1
