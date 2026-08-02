# ADR 0002 — MVP Static Menu Catalog

Status: Accepted

Date: 2026-08-02

Deciders: Engineering Lead

Related: `docs/ai/02_PRODUCT_REQUIREMENTS.md` (Menu), `docs/ai/17_CMS.md`, RBAC `menu.read` / `menu.manage`

---

## Context

Product docs and admin RBAC anticipate a database-backed Menu module (categories, prices, availability, featured flags) with admin CRUD. The public website today builds its catalog by scanning filesystem assets under `public/assets/menu/` (`menu-catalog.ts`) and shows prices via static menu-book WebP pages.

Building a full menu vertical slice (migrations, seed, public/admin APIs, admin UI, website cutover) is a large multi-app change. Reservation operations critical path (settings, table assignment, confirmation email) is already in place. Launch readiness benefits more from an explicit cutover checklist than from starting menu CRUD before ops are documented.

---

## Decision

**For MVP, the menu catalog remains filesystem-backed.**

- Item photos and category membership: scanned from `assets/menu/beverages` and `assets/menu/pastries` (synced into app public directories).
- Prices / full menu layout: static menu-book images under `assets/menu/menu-book-7oz/`.
- CMS may continue to own homepage *section copy* for featured menu; it does not own the item catalog.
- Permissions `menu.read` and `menu.manage` stay seeded for future use but are unused by admin UI in MVP.

**Deferred:** `menu_categories` / `menu_items` tables, `/menu-items` APIs, Admin → Menu CRUD, and switching the website catalog to the API.

---

## Consequences

### Positive

- Menu updates ship by replacing assets and redeploying (or syncing assets) — no incomplete dual-source catalog.
- Engineering focus stays on production cutover and operational stability.
- Avoids half-migrating prices into the DB while the menu book still owns pricing visuals.

### Negative / trade-offs

- Staff cannot edit names, prices, or availability from the admin dashboard yet.
- “Manage menu” in MVP definition of done is intentionally deferred (documented here).
- Coffee vs non-coffee classification still relies on hardcoded slug sets in `menu-catalog.ts`.

---

## Follow-up

A future phase should implement a blog-shaped vertical slice:

1. Migrations + seed from current assets
2. Public `GET` + admin CRUD under `menu.manage`
3. Admin `/menu` UI (reuse media library for images)
4. Website `getMenuCatalog()` reads the API; keep menu-book until DB prices are complete
5. Remove filesystem scan as the source of truth

Do not seed a DB catalog while the website still reads only from disk.
