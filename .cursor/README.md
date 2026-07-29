# Cursor Rules

This repository uses Cursor Rules to ensure every AI-generated change follows the project's engineering standards.

## Source of Truth

Resolve conflicts in this order:

1. Accepted ADRs under `docs/adr/`
2. FINAL documents under `docs/ai/`
3. Cursor rules under `.cursor/rules/`

Cursor rules must mirror `docs/ai` and accepted ADRs.

Never invent an alternate technology stack, design system, or domain rule in Cursor rules.

Canonical Phase 0 decisions:

`docs/adr/0001-phase-0-architecture-decisions.md`

## Rule Priority

When multiple rules apply, follow this order:

1. thinking-process.mdc
2. architecture.mdc
3. security.mdc
4. code-quality.mdc
5. project-specific rules
6. framework-specific rules
7. feature-specific rules

If two rules conflict:

- Prefer architecture consistency.
- Prefer maintainability.
- Prefer security.
- Prefer readability.

Never sacrifice architecture for convenience.

---

## Before Writing Code

Always:

- Read the relevant documentation inside `docs/`.
- Search for reusable code.
- Understand the affected modules.
- Follow the Design System.
- Follow Coding Standards.

Never:

- Duplicate code.
- Hardcode values.
- Ignore TypeScript errors.
- Ignore lint errors.
- Ignore architecture.

---

## Documentation

Every significant architectural decision should be reflected in:

docs/adr/

docs/ai/

Do not allow implementation and documentation to diverge.

---

## AI Philosophy

Think first.

Design second.

Code third.

Optimize fourth.

Document fifth.
