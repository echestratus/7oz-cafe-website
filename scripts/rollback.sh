#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENVIRONMENT="${1:-staging}"
PREVIOUS_TAG="${2:-}"

if [[ -z "$PREVIOUS_TAG" ]]; then
  echo "Usage: $0 <staging|production> <previous-image-tag>"
  exit 1
fi

echo "==> Rolling back $ENVIRONMENT to IMAGE_TAG=$PREVIOUS_TAG"
IMAGE_TAG="$PREVIOUS_TAG" ./scripts/deploy.sh "$ENVIRONMENT" "$PREVIOUS_TAG"
