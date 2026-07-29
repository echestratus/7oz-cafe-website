# Cursor Rules

This repository uses Cursor Rules to ensure every AI-generated change follows the project's engineering standards.

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

docs/

Do not allow implementation and documentation to diverge.

---

## AI Philosophy

Think first.

Design second.

Code third.

Optimize fourth.

Document fifth.