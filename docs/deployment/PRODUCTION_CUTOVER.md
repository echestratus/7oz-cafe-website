# Production cutover checklist

Use this list when promoting a release from staging to the public VPS. Complete every item before announcing go-live.

Related:

- [Deployment overview](./README.md)
- [ADR 0002 — MVP static menu catalog](../adr/0002-mvp-static-menu-catalog.md)

---

## 0. Preconditions

- [ ] CI green on the release commit (`Frontend`, `Backend`, `Docker images`)
- [ ] Release `IMAGE_TAG` is a git SHA or semver (never `latest`)
- [ ] Staging smoke passed on the same image tag
- [ ] Secrets are ready in `/opt/7oz/env/.env.production` (never committed)

---

## 1. Environment

Copy from [`.env.production.example`](../../.env.production.example) and fill real values.

| Variable | Required | Notes |
| --- | --- | --- |
| `APP_ENV` | Yes | Must be `production` |
| `APP_URL` | Yes | Public API origin (HTTPS) |
| `WEBSITE_URL` | Yes | Used in email links |
| `NEXT_PUBLIC_APP_URL` | Yes | Website origin (HTTPS) |
| `NEXT_PUBLIC_ADMIN_URL` | Yes | `https://admin.7oz-espresso.com` |
| `NEXT_PUBLIC_API_URL` | Yes | `https://7oz-espresso.com/api/v1` |
| `CORS_ALLOWED_ORIGINS` | Yes | Website + www + admin origins (exact match) |
| `DB_USER` / `DB_PASSWORD` / `DB_NAME` | Yes | Strong password; no defaults |
| `DB_SSLMODE` | Yes | `disable` for compose-internal Postgres; `require` when Postgres is remote/TLS |
| `REDIS_PASSWORD` | Recommended | Set when Redis is exposed beyond compose network |
| `JWT_ACCESS_SECRET` | Yes | ≥ 32 chars, unique to production |
| `JWT_REFRESH_SECRET` | Yes | ≥ 32 chars, different from access secret |
| `JWT_ACCESS_TTL` / `JWT_REFRESH_TTL` | Yes | Defaults `15m` / `720h` are fine |
| `SMTP_HOST` / `SMTP_PORT` | Yes | Required outside development |
| `SMTP_USERNAME` / `SMTP_PASSWORD` | As needed | Provider credentials |
| `SMTP_FROM_EMAIL` / `SMTP_FROM_NAME` | Yes | From identity guests see |
| `CONTACT_TO_EMAIL` | Yes | Cafe inbox for contact form |
| `BACKEND_IMAGE` / `WEBSITE_IMAGE` / `ADMIN_IMAGE` | Yes | GHCR image names |
| `IMAGE_TAG` | Yes | Release tag to deploy |

Verify:

- [ ] No leftover `localhost` or `*.local` URLs in production env
- [ ] JWT secrets are not the development placeholders
- [ ] `CORS_ALLOWED_ORIGINS` includes `https://7oz-espresso.com`, `https://www.7oz-espresso.com`, and `https://admin.7oz-espresso.com`
- [ ] Host Nginx + Certbot cover `admin.7oz-espresso.com` → compose `HTTP_PORT` (see `docs/deployment/host-nginx/`)

---

## 2. Database

On the VPS (from the compose checkout):

```bash
# Prefer the deploy script path (runs migrate before app start).
./scripts/deploy.sh production <image-tag>
```

If migrating manually:

```bash
pnpm db:migrate
# or ./scripts/migrate.sh production
```

Verify:

- [ ] Migrations applied with no errors
- [ ] Reservation settings timezone is `Asia/Tashkent` (Admin → Reservations → Settings, or SQL on `reservation_settings`)
- [ ] Weekly hours match cafe operations (overnight close `00:00` is supported)
- [ ] Seeded cafe tables (T1–T5) exist if this is a fresh database
- [ ] Admin user exists (create/reset via secure process — do not ship default seed passwords to production)

---

## 3. HTTPS and reverse proxy

- [ ] TLS terminated at host Nginx / Caddy / Cloudflare (or certs mounted into compose Nginx)
- [ ] HTTP → HTTPS redirect enabled
- [ ] HSTS enabled on the public edge
- [ ] Public routes resolve:
  - `/` → website
  - website `/` , API `/api/` , media `/media/`
  - admin on `https://admin.7oz-espresso.com/` (legacy `/admin/` redirects)
  - `/api/` → backend
  - `/health` and `/health/ready` → API probes
- [ ] Cookies for refresh work over HTTPS (`Secure`)

---

## 4. Health checks

```bash
curl -fsS https://<host>/health
curl -fsS https://<host>/health/ready
```

- [ ] `/health` returns success
- [ ] `/health/ready` confirms Postgres + Redis
- [ ] Container `HEALTHCHECK` status healthy for backend, website, admin

---

## 5. SMTP smoke

With real SMTP configured:

1. [ ] Submit a **guest reservation** on the public site → guest receives “request received” email
2. [ ] Admin **Confirm** that reservation → guest receives “confirmed” email
3. [ ] Admin or customer **Cancel** a reservation → guest receives “cancelled” email
4. [ ] Submit the **contact form** → cafe inbox (`CONTACT_TO_EMAIL`) receives the message
5. [ ] (Optional) Register / forgot-password → verification / reset links use `WEBSITE_URL`

If any send fails, check API logs (`failed to send email`) and SMTP credentials/port/TLS.

---

## 6. Product smoke (happy path)

Public website:

- [ ] Home, Menu, Gallery, Locations, Contact, Blogs load
- [ ] Menu photos and menu-book pages render (static catalog — see ADR 0002)
- [ ] Reservation availability loads for a future date in cafe timezone

Admin:

- [ ] Login with production admin account
- [ ] Reservations: list, confirm, assign table, check-in / complete
- [ ] Reservations → Settings: timezone/hours readable and editable
- [ ] CMS / media / contact inbox reachable for roles that have permission
- [ ] Loyalty settings page loads (if used)

Customer (optional but recommended):

- [ ] Register / login
- [ ] Authenticated reservation create + cancel within cutoff
- [ ] Membership / loyalty balance visible after a completed reservation (if testing that path)

---

## 7. Backups and ops

- [ ] Schedule `./scripts/backup-db.sh production` (retain ≥ 30 days)
- [ ] Confirm backup file lands under `/opt/7oz/backups/` (or configured path)
- [ ] Document who runs loyalty expire if `rolling_months` is enabled:
  `pnpm --filter @7oz/backend loyalty:expire` (or `go run ./cmd/expire-loyalty`) on a daily schedule
- [ ] Log retention / disk space checked on the VPS

---

## 8. Rollback

If cutover fails:

```bash
./scripts/rollback.sh production <previous-image-tag>
```

- [ ] Previous image tag recorded before deploy
- [ ] After rollback, re-check `/health/ready` and one reservation smoke
- [ ] If a migration is forward-only and unsafe to reverse, restore DB from the pre-deploy backup before rolling app images

---

## 9. Go-live sign-off

- [ ] Product owner / cafe contact confirmed
- [ ] DNS pointing at production edge
- [ ] Monitoring plan noted (structured Zap logs + request IDs today; Prometheus/Grafana future)
- [ ] Post-launch: watch SMTP failures and reservation create errors for 24–48h

---

## Menu note (MVP)

Menu item photos and the printed menu book remain **static assets** for MVP. Updating the menu means replacing files under `assets/menu/` (sync + redeploy), not Admin → Menu. See [ADR 0002](../adr/0002-mvp-static-menu-catalog.md).
