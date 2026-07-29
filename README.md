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

# Run frontend apps
pnpm website:dev
pnpm admin:dev

# Run API (from apps/backend or via filter)
pnpm backend:dev
```

Health checks:

- `GET http://localhost:8080/health`
- `GET http://localhost:8080/api/v1/health`

## Workspace scripts

| Script | Purpose |
| --- | --- |
| `pnpm dev` | Turbo-run all `dev` tasks |
| `pnpm build` | Build all packages/apps |
| `pnpm lint` | Lint workspace |
| `pnpm typecheck` | Typecheck TypeScript packages/apps |
| `pnpm sync:assets` | Copy `./assets` into app public directories |

## Packages

- `@7oz/shared-types` — shared TypeScript contracts
- `@7oz/eslint-config` — shared ESLint flat configs
- `@7oz/prettier-config` — shared Prettier config

## Documentation

- AI / engineering docs: `docs/ai/`
- Architecture decisions: `docs/adr/`
- Cursor rules: `.cursor/rules/`

## Git workflow

- `main` — production-ready
- `develop` — integration
- Feature work on `feature/*`, `fix/*`, `chore/*`, `docs/*`

Never commit directly to `main` or `develop`.
