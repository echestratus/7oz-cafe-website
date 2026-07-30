# ============================================================================
# 7Oz Espresso Cafe Digital Platform
# Monorepo Structure
# ============================================================================

Version         : 1.0.0
Status          : FINAL
File            : ./docs/ai/04_MONOREPO_STRUCTURE.md
Owner           : Engineering Team
Audience        : AI Agents & Developers
Last Updated    : 2026-07-29

Dependencies:
- 00_MASTER_PROMPT.md
- 01_PROJECT_CONTEXT.md
- 02_PRODUCT_REQUIREMENTS.md
- 03_TECH_STACK.md

---

# 1. Purpose

This document defines the official repository structure, ownership rules, dependency boundaries, naming conventions, and package organization for the 7Oz Espresso Cafe Digital Platform.

Every file and directory in the repository must follow this document.

---

# 2. Repository Philosophy

The repository follows a monorepo architecture.

Each application is independently deployable while sharing reusable code through dedicated packages.

Business logic must have a single implementation.

Avoid duplication between applications.

---

# 3. Root Directory Structure

```
.
├── apps/
├── assets/
├── docs/
├── packages/
├── scripts/
├── .cursor/
├── .github/
├── .env.example
├── .gitignore
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

---

# 4. Applications

```
apps/
├── website/
├── admin/
└── backend/
```

## website

Customer-facing web application.

Responsibilities:

- Marketing pages
- Menu
- Gallery
- Reservation
- Membership
- Loyalty
- Authentication
- Customer profile

---

## admin

Internal web application.

Responsibilities:

- Reservation management
- Menu management
- Gallery management
- Membership management
- Loyalty management
- CMS
- Analytics
- Settings
- User management

---

## backend

Central REST API.

Responsibilities:

- Business logic
- Authentication
- Authorization
- Database access
- Validation
- File management
- Audit logging

---

# 5. Assets Directory

```
assets/
├── about/
├── favicon/
├── gallery/
├── home/
├── icons/
├── illustrations/
├── locations/
├── logo/
├── menu/
├── mockups/
├── news/
└── social/
```

Current phase:

Assets are stored locally under `./assets`.

Applications must never read assets directly from this directory at runtime.

Canonical workflow:

1. Place source media in `./assets/<category>/`.
2. Run the repository asset sync script (under `./scripts`) during development setup and CI/build.
3. Sync copies required files into each application's public/static directory.
4. Applications consume only their public/static assets or CMS/media URLs.

Do not rely on manual one-off copies as the primary workflow.

This design allows future migration to object storage without changing business logic.

All storage access in the backend must go through a storage abstraction layer.

---

# 6. Documentation

```
docs/
├── adr/
├── ai/
├── api/
├── architecture/
├── database/
├── deployment/
├── development/
├── product/
└── uiux/
```

Purpose:

- Architecture Decision Records
- AI guidance
- API specifications
- Database documentation
- Deployment guides
- Design documentation
- Product and development notes

Documentation is part of the product.

---

# 7. Shared Packages

```
packages/
├── eslint-config/
├── prettier-config/
└── shared-types/
```

Future packages may include:

```
packages/
├── ui/
├── config/
├── utils/
├── validation/
├── api-client/
├── constants/
└── shared-types/
```

Shared packages must remain framework-agnostic whenever possible.

---

# 8. Scripts

```
scripts/
```

Contains:

- Build scripts
- Development utilities
- Database scripts
- Deployment helpers
- Asset sync helpers
- Automation scripts

Scripts must be idempotent whenever possible.

The asset sync script must be safe to re-run and must not invent missing media.

---

# 9. Cursor Directory

```
.cursor/
└── rules/
```

Contains project-wide Cursor Rules.

Every AI-generated implementation must follow these rules.

---

# 10. Dependency Rules

Allowed:

```
website
      │
      ▼
packages

admin
     │
     ▼
packages

backend
      │
      ▼
packages
```

Not Allowed:

- website imports admin
- admin imports website
- backend imports frontend applications
- shared packages importing applications

Dependencies must always point inward toward shared packages.

---

# 11. Ownership Rules

Each application owns its implementation.

Examples:

Reservation UI

Owned by:

website

Reservation API

Owned by:

backend

Reservation Management

Owned by:

admin

Shared DTOs

Owned by:

packages/shared-types

---

# 12. Naming Convention

Directories

kebab-case

Examples:

shared-types

api-client

feature-flags

Files

kebab-case

Examples:

reservation-card.tsx

menu-item.tsx

gallery-grid.tsx

Components

PascalCase

Examples:

ReservationCard

MenuGrid

GalleryCarousel

Go Packages

lowercase

---

# 13. Import Rules

Prefer absolute imports.

Avoid deeply nested relative imports.

Import order:

1. Standard library
2. Third-party packages
3. Internal packages
4. Local modules

Circular dependencies are prohibited.

---

# 14. Shared Code Rules

Move code into packages only when:

- Used by multiple applications.
- Stable.
- Generic.
- Independent.

Do not create shared packages prematurely.

---

# 15. Repository Growth

New applications should be added under:

```
apps/
```

New shared libraries should be added under:

```
packages/
```

Do not introduce new top-level directories without architectural approval.

---

# 16. AI Rules

AI agents must:

- Respect ownership boundaries.
- Avoid duplicate implementations.
- Reuse shared packages.
- Follow dependency rules.
- Preserve repository consistency.

---

# 17. Definition of Done

Repository changes are complete only if:

✓ Structure remains consistent.

✓ Dependency rules are respected.

✓ Shared code is not duplicated.

✓ Naming conventions are followed.

✓ Documentation is updated.

✓ No architectural boundaries are violated.

---

# End of Document