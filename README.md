# 7Oz Espresso Cafe Digital Platform

Premium digital ecosystem for 7Oz Espresso Cafe — public website, admin dashboard, and REST API in a Turborepo monorepo.

## Applications

| App | Path | Port | Description |
| --- | --- | --- | --- |
| Website | `apps/website` | 3000 | Customer-facing Next.js app |
| Admin | `apps/admin` | 3001 | Internal Next.js dashboard |
| Backend | `apps/backend` | 8080 | Go Fiber REST API |

## Prerequisites

- Node.js 22+
- pnpm 9+
- Go 1.25+ (toolchain auto-download supported)
- Docker Desktop (for Postgres + Redis)

## Quick start

```bash
# Install JS dependencies
pnpm install

# Copy environment template
cp .env.example .env

# Start Postgres + Redis
docker compose -f docker-compose.dev.yml up -d

# Sync local media into app public folders
pnpm sync:assets

# Apply database migrations (requires Docker Compose Postgres)
pnpm db:migrate

# Seed development super admin
pnpm --filter @7oz/backend db:seed

# Run frontend apps
pnpm website:dev
pnpm admin:dev

# Run API (from apps/backend or via filter)
pnpm backend:dev
```

Health checks:

- `GET http://localhost:8080/health` — liveness
- `GET http://localhost:8080/health/ready` — readiness (Postgres + Redis)
- `GET http://localhost:8080/api/v1/health`
- `GET http://localhost:8080/api/v1/health/ready`
- `GET http://localhost:8080/openapi.yaml` — OpenAPI 3.1 shell

Docker Compose Postgres is published on host port **5433** (avoids conflicts with local PostgreSQL on 5432). Redis remains on **6379**.

In development, the API starts even if Postgres/Redis are down and reports degraded readiness.
In non-development environments, missing Postgres/Redis fails startup.

## Workspace scripts

| Script | Purpose |
| --- | --- |
| `pnpm dev` | Turbo-run all `dev` tasks |
| `pnpm build` | Build all packages/apps |
| `pnpm lint` | Lint workspace |
| `pnpm typecheck` | Typecheck TypeScript packages/apps |
| `pnpm sync:assets` | Copy `./assets` into app public directories |
| `pnpm db:migrate` | Apply Postgres migrations |
| `pnpm db:migrate:down` | Roll back one migration |

## Packages

- `@7oz/shared-types` — shared TypeScript contracts
- `@7oz/eslint-config` — shared ESLint flat configs
- `@7oz/prettier-config` — shared Prettier config

## Documentation

- AI / engineering docs: `docs/ai/`
- Deployment: `docs/deployment/README.md`
- Architecture decisions: `docs/adr/`
- Cursor rules: `.cursor/rules/`

## Deployment (Docker)

Local Postgres/Redis:

```bash
docker compose -f docker-compose.dev.yml up -d
```

Staging stack (API + website + admin + Nginx gateway on port 8088):

```bash
cp .env.staging.example .env.staging
./scripts/deploy.sh staging staging
```

Production uses versioned images and `docker-compose.prod.yml`. See `docs/deployment/README.md`.

## Git workflow

- `main` — production-ready
- `develop` — integration
- Feature work on `feature/*`, `fix/*`, `chore/*`, `docs/*`

Never commit directly to `main` or `develop`.
