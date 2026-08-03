# Deployment

Version: Phase 11 foundation

**Promotion policy:** local work → commit + PR into `develop` (automatic) → product owner merges → confirm merge → deploy **staging** (`https://stage.7oz-espresso.com`, admin `https://admin-stage.7oz-espresso.com`) → product owner confirms staging OK → product owner opens PR `develop` → `main` → deploy **production** (`https://7oz-espresso.com`, admin `https://admin.7oz-espresso.com`) when instructed. Never skip staging for app/API/migration/Compose changes. Never deploy staging or production without the matching confirmation.

**Production go-live:** follow [PRODUCTION_CUTOVER.md](./PRODUCTION_CUTOVER.md) end-to-end before announcing launch.

Menu catalog for MVP remains filesystem-backed — see [ADR 0002](../adr/0002-mvp-static-menu-catalog.md).

## Overview

The platform deploys with Docker Compose behind Nginx.

| Environment | Compose file | Env file |
| --- | --- | --- |
| Local deps | `docker-compose.dev.yml` | `.env` |
| Staging | `docker-compose.staging.yml` | `.env.staging` |
| Production | `docker-compose.prod.yml` | `.env.production` |

Images (versioned, never `:latest` in production):

- `ghcr.io/echestratus/7oz-website`
- `ghcr.io/echestratus/7oz-admin`
- `ghcr.io/echestratus/7oz-backend`

## Local dependency stack

```bash
cp .env.example .env
docker compose -f docker-compose.dev.yml up -d
pnpm db:migrate
```

## Staging (build + run)

```bash
cp .env.staging.example .env.staging
# fill secrets (SMTP defaults to compose Mailpit)

chmod +x scripts/*.sh
./scripts/deploy.sh staging staging
```

On a VPS with host Nginx/Certbot in front, keep `HTTP_PORT=127.0.0.1:8088` and proxy the public hostnames to that port.

Host Nginx samples (TLS at the edge):

- [`host-nginx/admin-stage.7oz-espresso.com.conf`](./host-nginx/admin-stage.7oz-espresso.com.conf) → `127.0.0.1:8088`
- [`host-nginx/admin.7oz-espresso.com.conf`](./host-nginx/admin.7oz-espresso.com.conf) → `127.0.0.1:8089`

After enabling a host site, issue certs with Certbot (`certbot --nginx -d <hostname>`).

Compose notes:

- Website/admin image builds use `network: host` so `next/font` can download Google Fonts during build.
- Mailpit provides SMTP for `APP_ENV=staging` (`SMTP_HOST=mailpit`, `SMTP_PORT=1025`).

Gateway defaults to `http://localhost:8088` (or the host proxy URL).

Public hosts:

| Host | App |
| --- | --- |
| `stage.7oz-espresso.com` / `7oz-espresso.com` | Website + `/api/` + `/media/` |
| `admin-stage.7oz-espresso.com` / `admin.7oz-espresso.com` | Admin at `/` |
| Local / unknown (`server_name _`) | Path-based: `/` website, `/admin/` admin, `/api/` backend |

`/admin` on the website host redirects to the matching admin subdomain. Include both website and admin origins in `CORS_ALLOWED_ORIGINS`.

Update an existing staging checkout after merges to `develop`:

```bash
cd /opt/7oz/compose   # or your checkout path
git checkout develop
git pull origin develop
./scripts/deploy.sh staging staging
```

## Production (VPS)

Suggested layout:

```text
/opt/7oz/
  compose/          # repository checkout or release bundle
  env/.env.production
  backups/
  uploads/
  logs/
  scripts/
```

Deploy a tagged release:

```bash
cp .env.production.example .env.production
# fill secrets and set IMAGE_TAG=<git-sha-or-semver>
# complete docs/deployment/PRODUCTION_CUTOVER.md

./scripts/deploy.sh production <image-tag>
```

Rollback:

```bash
./scripts/rollback.sh production <previous-image-tag>
```

Database backup (retain 30 days by default):

```bash
./scripts/backup-db.sh production
```

## HTTPS

Staging compose listens on HTTP for local/VPS bootstrap.

For production public traffic:

1. Terminate TLS at a host Nginx / Caddy / Cloudflare in front of the compose Nginx, or
2. Extend `docker/nginx/nginx.conf` with Let's Encrypt certificates under `/opt/7oz/certs`.

Always redirect HTTP → HTTPS and enable HSTS on the public edge.

## Health checks

| Path | Meaning |
| --- | --- |
| `GET /health` | Liveness |
| `GET /live` | Liveness alias |
| `GET /health/ready` | Postgres + Redis readiness |
| `GET /ready` | Readiness alias |

Containers define `HEALTHCHECK` for backend/website/admin.

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs:

1. Frontend lint / typecheck / build
2. Backend vet / test / build
3. Docker image builds (no push) for website, admin, and backend

## Notes

- Secrets stay in untracked `.env.staging` / `.env.production`.
- Migrations run before app containers start.
- Uploaded media persist in the `*_uploads` Docker volume.
- Configure `WEBSITE_URL` and `SMTP_*` for verification, password reset, reservation **request received**, reservation **confirmed**, and contact-form notification emails.
  Set `CONTACT_TO_EMAIL` to the cafe inbox (defaults to `SMTP_FROM_EMAIL` when empty).
  In local development, leave `SMTP_HOST` empty to log emails, or point it at Mailpit (`localhost:1025`).
  Production must set `APP_ENV=production` and a real `SMTP_HOST` (see cutover checklist).
- Loyalty expiration: enable `rolling_months` in Admin → Loyalty → Settings, then schedule
  `pnpm --filter @7oz/backend loyalty:expire` (or `go run ./cmd/expire-loyalty`) daily.
- Monitoring (Prometheus/Grafana/Loki) remains future work; structured Zap logs and request IDs are already emitted by the API.
