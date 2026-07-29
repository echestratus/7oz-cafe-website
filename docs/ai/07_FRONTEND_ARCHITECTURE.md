# ============================================================================
# 7Oz Espresso Cafe Digital Platform
# Frontend Architecture
# ============================================================================

Version         : 1.0.0
Status          : FINAL
File            : ./docs/ai/07_FRONTEND_ARCHITECTURE.md
Owner           : Engineering Team
Audience        : Frontend Developers & AI Agents
Last Updated    : 2026-07-29

Dependencies:
- 00_MASTER_PROMPT.md
- 01_PROJECT_CONTEXT.md
- 02_PRODUCT_REQUIREMENTS.md
- 03_TECH_STACK.md
- 04_MONOREPO_STRUCTURE.md
- 05_ENGINEERING_STANDARDS.md
- 06_DESIGN_SYSTEM.md

---

# 1. Purpose

This document defines the official frontend architecture for every web application in this repository.

It applies to:

- apps/website
- apps/admin

---

# 2. Architectural Principles

Frontend must be:

- Modular
- Feature-oriented
- Type-safe
- Accessible
- Testable
- Scalable

Business logic should never be tightly coupled to UI components.

---

# 3. Framework

Framework

- Next.js (App Router)

Language

- TypeScript

Rendering

- Server Components by default
- Client Components only when necessary

---

# 4. Directory Structure

Each frontend application should follow:

```
src/
├── app/
├── components/
├── features/
├── hooks/
├── lib/
├── services/
├── stores/
├── styles/
├── types/
├── utils/
└── middleware.ts
```

---

# 5. App Router

Responsibilities:

app/

- Routing
- Layout
- Metadata
- Loading UI
- Error UI
- Route Groups

Business logic must not be implemented directly inside route files.

---

# 6. Feature Organization

Every major business capability belongs inside `features/`.

Example:

```
features/
├── reservation/
├── membership/
├── loyalty/
├── menu/
├── gallery/
├── authentication/
└── cms/
```

Each feature may contain:

```
reservation/

components/

hooks/

services/

schemas/

types/

utils/
```

---

# 7. Components

Global reusable UI:

```
components/
```

Feature-specific UI:

```
features/.../components/
```

Avoid placing feature-specific components in the global components directory.

---

# 8. Data Fetching

Use:

- TanStack Query

Responsibilities:

- Fetching
- Caching
- Background Refetch
- Mutation
- Optimistic Update where appropriate

Avoid manual fetch state management.

---

# 9. Local State

Use Zustand for:

- Theme
- Sidebar state
- Authentication session
- UI preferences

Do not store server data in Zustand.

---

# 10. Forms

Standard:

- React Hook Form
- Zod

Every form must support:

- Validation
- Error state
- Loading state
- Disabled state

---

# 11. API Layer

Never call Axios directly from components.

Use:

```
services/
```

Example:

```
services/

reservation.service.ts

membership.service.ts

menu.service.ts
```

Components communicate only with services.

---

# 12. Styling

Use:

- Tailwind CSS
- shadcn/ui
- CVA (class-variance-authority)

Do not write large custom CSS files unless unavoidable.

---

# 13. Icons

Use only:

- Lucide React

Do not mix multiple icon libraries.

---

# 14. Images

Use Next.js Image component whenever applicable.

Optimize:

- Dimensions
- Lazy loading
- Responsive sizes

---

# 15. Error Handling

Provide:

- Route Error UI
- Component Error State
- Empty State
- Retry Actions

Do not expose raw backend errors.

---

# 16. Loading Experience

Every asynchronous operation should provide:

- Skeleton loading
- Spinner when appropriate
- Disabled interactions
- Optimistic feedback when suitable

Avoid layout shifts.

---

# 17. Authentication

Authentication state must be centralized.

Protected routes must verify authorization before rendering protected content.

Do not rely solely on client-side route guards.

---

# 18. Accessibility

Every UI must support:

- Keyboard navigation
- Screen readers
- Focus management
- Semantic HTML
- ARIA attributes where necessary

---

# 19. Performance

Prioritize:

- Code splitting
- Dynamic imports
- Image optimization
- Font optimization
- Route-level loading
- Memoization only when justified

Avoid unnecessary client-side rendering.

---

# 20. Reusable Components

Reusable components must support:

- Variant
- Size
- Disabled state
- Loading state
- Dark mode compatibility (future)

---

# 21. Testing

Frontend tests should cover:

- Components
- Hooks
- Feature services
- User interaction
- Critical business flows

---

# 22. AI Development Rules

AI agents must:

- Reuse existing components.
- Respect feature boundaries.
- Avoid duplicated UI.
- Prefer composition.
- Keep components focused.
- Never bypass the service layer.

---

# 23. Definition of Done

Frontend implementation is complete only if:

✓ Responsive

✓ Accessible

✓ Fully typed

✓ Tested

✓ Lint passes

✓ Uses reusable components

✓ Uses design tokens

✓ Matches the Design System

✓ No duplicated logic

---

# End of Document