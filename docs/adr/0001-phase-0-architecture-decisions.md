# ADR 0001 — Phase 0 Architecture Decisions

Status: Accepted

Date: 2026-07-29

Deciders: Engineering Lead

Supersedes: Conflicting guidance previously present between `./docs/ai` and `./.cursor/rules`

---

## Context

The repository contained complete FINAL documentation under `./docs/ai` and always-applied Cursor rules under `./.cursor/rules`. Several technical and product choices conflicted between those sources. Phase 0 requires a single source of truth before implementation.

---

## Decisions

### 1. Backend data and infrastructure stack

**Chosen:** sqlc + pgx + golang-migrate + Viper + Zap + Argon2id + Go Fiber v3

**Rejected for MVP:** Ent ORM, Atlas, Koanf, Zerolog, bcrypt

**Rationale:**

- Database-first SQL keeps PostgreSQL as the source of truth.
- sqlc provides type-safe Go without ORM magic or N+1 surprises.
- golang-migrate is explicit, reviewable, and rollback-friendly.
- Argon2id is the current OWASP-preferred password hashing algorithm.
- Viper and Zap match the FINAL tech stack documentation.

### 2. Authentication token transport

**Chosen:**

- Access token: JWT, short-lived, Authorization Bearer header, stored in memory on the client
- Refresh token: opaque (or JWT), rotated, stored in HTTP-only Secure cookie (`SameSite` + CSRF defenses)

**Rejected:** Client-held refresh token in localStorage / Bearer-only refresh for MVP

**Rationale:** Minimizes XSS token theft while preserving SPA UX. CSRF is mitigated with `SameSite`, trusted origins, and Origin/Referer validation.

### 3. Design system

**Chosen:** `./docs/ai/06_DESIGN_SYSTEM.md`

- Typography: Newsreader (headings) + Inter (body) — open alternatives to Blue Bottle Coffee's ABC Marfa + ABC Diatype
- Neutrals: Background `#FCFBF8`, text `#1F2937`, border `#E8E4DD`, surface secondary `#F5F3EF`
- Radius: 8 / 12 / 20 / 28
- Spacing scale includes 20

**Rejected:** Cormorant Garamond + Inter and alternate neutral palette previously listed in Cursor rules

**Rationale:** The FINAL design system is more complete and distinctive for a premium cafe brand. Avoiding Inter reduces generic AI-default aesthetics.

### 4. MVP RBAC roles

**Chosen:**

| Role | Scope |
|------|--------|
| Visitor | Unauthenticated actor (not a persisted role) |
| Customer | Authenticated customer |
| Admin | Operational staff (CMS, reservations, menu, gallery, membership, loyalty) |
| Super Admin | Full platform access including users, roles, system settings, audit |

**Deferred until POS / multi-branch:** Cafe Manager, Cashier, Kitchen, Barista, Branch Manager, generic Staff

**Rationale:** Smallest permission model that covers website + admin MVP without premature POS role complexity. Permission-based checks remain extensible.

### 5. Reservation statuses

**Chosen:** `PENDING`, `CONFIRMED`, `CHECKED_IN`, `COMPLETED`, `CANCELLED`, `NO_SHOW`

**Rationale:** Check-in is required for cafe floor operations and already defined in the reservation domain document.

### 6. Guest reservations

**Chosen:** Guest reservations are supported in MVP without requiring an account.

Required contact fields: full name, email, phone.

Authenticated customers may book while linked to their account. Guests may optionally register later and claim history when product supports it.

**Rationale:** Forcing login before booking reduces reservation conversion. Hospitality best practice is guest checkout with strong contact validation and anti-abuse rate limits.

### 7. Asset strategy

**Chosen:** `./assets` remains the canonical local source. A build-time / development sync script copies required assets into each application's public/static directory. Runtime code never reads `./assets` directly. Storage access goes through an abstraction ready for MinIO/S3.

**Rejected:** Manual ad-hoc copies as the only workflow

**Rationale:** Single source of truth, reproducible builds, and clean migration path to object storage.

### 8. Git trunk model

**Chosen:**

- `main` — production-ready releases
- `develop` — integration branch
- Feature work only on `feature/*`, `fix/*`, `docs/*`, etc.

**Rejected:** Using `master` as an active workflow branch

**Rationale:** Matches modern GitHub defaults and existing project git workflow docs. Legacy `master` must not be used for new work.

### 9. Documentation precedence

**Chosen:**

1. Accepted ADRs
2. `./docs/ai` (FINAL documents)
3. `./.cursor/rules` (must mirror docs/ai; never invent conflicting stack choices)

When Cursor rules and docs disagree, docs/ai + ADRs win, and rules must be updated immediately.

---

## Consequences

- Cursor rules were rewritten to match these decisions.
- Product and domain docs were tightened for roles, guest booking, assets, and git.
- Implementation Phase 1 may begin only after this ADR remains Accepted.

---

## Follow-ups

- Phase 1: monorepo bootstrap (pnpm, Turborepo, app scaffolds, Compose, sync script stub)
- Remove or archive unused remote `master` branch when the repository owner approves
