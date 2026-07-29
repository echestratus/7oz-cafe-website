# ============================================================================
# 7Oz Espresso Cafe Digital Platform
# Engineering Standards
# ============================================================================

Version         : 1.0.0
Status          : FINAL
File            : ./docs/ai/05_ENGINEERING_STANDARDS.md
Owner           : Engineering Team
Audience        : AI Agents & Developers
Last Updated    : 2026-07-29

Dependencies:
- 00_MASTER_PROMPT.md
- 01_PROJECT_CONTEXT.md
- 02_PRODUCT_REQUIREMENTS.md
- 03_TECH_STACK.md
- 04_MONOREPO_STRUCTURE.md

---

# 1. Purpose

This document defines the engineering standards that every contributor must follow.

The objective is to keep the codebase consistent, maintainable, scalable, and production-ready.

These standards apply to every application inside this repository.

---

# 2. Core Engineering Principles

Always prioritize:

- Readability
- Maintainability
- Simplicity
- Consistency
- Testability
- Scalability

Never sacrifice maintainability for short-term convenience.

---

# 3. General Coding Rules

Code must be:

- Self-explanatory
- Small
- Focused
- Deterministic
- Easy to review

Avoid clever code.

Prefer explicit implementations.

Every function should solve one problem.

---

# 4. File Organization

Each file should have one primary responsibility.

Recommended maximum file size:

- TypeScript: 300 lines
- Go: 300 lines

Split files before they become difficult to navigate.

---

# 5. Function Guidelines

Functions should:

- Perform one responsibility.
- Have descriptive names.
- Minimize side effects.
- Return predictable results.

Avoid deeply nested logic.

Prefer early returns.

---

# 6. Naming Conventions

Directories

- kebab-case

Files

- kebab-case

React Components

- PascalCase

React Hooks

- useXxx

Functions

- camelCase (TypeScript)
- PascalCase only when exporting React components

Variables

- camelCase

Constants

- UPPER_SNAKE_CASE (global constants)
- camelCase (local constants)

Interfaces

- PascalCase

Enums

- PascalCase

Database Tables

- snake_case

Database Columns

- snake_case

Go Packages

- lowercase

Go Files

- snake_case

---

# 7. Comments

Write comments only when necessary.

Comments should explain:

- Why

Not:

- What

Code should explain itself whenever possible.

Avoid commented-out code.

---

# 8. Error Handling

Every recoverable error must be handled.

Never ignore returned errors in Go.

Return meaningful error messages.

Do not expose internal implementation details.

---

# 9. Logging

Log only meaningful events.

Use structured logging.

Never log:

- Passwords
- Tokens
- Secrets
- Sensitive customer information

Always include request identifiers when available.

---

# 10. Validation

Validate every external input.

Examples:

- HTTP requests
- Query parameters
- Uploaded files
- Configuration values

Never rely on frontend validation.

---

# 11. Configuration

Configuration belongs in environment variables.

Never hardcode:

- Secrets
- API Keys
- Database credentials
- SMTP credentials

Provide sensible defaults only for local development.

---

# 12. Code Reuse

Before creating new code:

Search for existing:

- Components
- Utilities
- Services
- Validation
- Types
- Hooks

Reuse before creating.

Avoid duplication.

---

# 13. Dependency Management

Add dependencies only when necessary.

Before introducing a new library:

- Verify existing alternatives.
- Consider maintenance status.
- Consider bundle size.
- Consider security.
- Consider long-term support.

Avoid unnecessary dependencies.

---

# 14. React Standards

Keep components focused.

Separate:

- UI
- Business logic
- Data fetching

Prefer composition over inheritance.

Prefer reusable components.

---

# 15. Go Standards

Keep handlers thin.

Business logic belongs in services.

Database logic belongs in repositories.

Avoid package cycles.

Always propagate context.

---

# 16. Database Standards

Never write SQL inside handlers.

Always use migrations.

Never modify production schema manually.

Always use transactions for multi-step business operations.

---

# 17. Git Standards

Branch model:

- `main` — production-ready releases
- `develop` — integration branch
- Feature work on `feature/*`, `fix/*`, `docs/*`, `chore/*`, etc.

Never use `master` for new work.

Never commit directly to `main` or `develop`.

Follow Conventional Commits.

One logical change per commit.

Do not mix unrelated changes.

Never commit generated secrets.

Never commit local configuration.

Never commit temporary debugging code.

Canonical workflow details live in `.cursor/rules/git-workflow.mdc`.

---

# 18. Pull Request Standards

Every Pull Request should:

- Solve one logical problem.
- Be reviewable.
- Include updated documentation when required.
- Pass linting.
- Pass formatting.
- Pass tests.

---

# 19. Code Review Checklist

Review:

- Correctness
- Readability
- Maintainability
- Security
- Performance
- Accessibility
- Documentation
- Tests

Reject changes that violate engineering standards.

---

# 20. AI Development Rules

AI must:

- Follow existing patterns.
- Respect architecture.
- Reuse existing code.
- Avoid unnecessary refactoring.
- Update documentation when required.

Never generate duplicate implementations.

---

# 21. Anti-Patterns

Avoid:

- God Objects
- God Components
- God Services
- Deep nesting
- Circular dependencies
- Hardcoded configuration
- Duplicate business logic
- Magic numbers
- Magic strings

---

# 22. Definition of Done

Engineering work is complete only if:

✓ Code compiles.

✓ Lint passes.

✓ Formatting passes.

✓ Types are correct.

✓ Tests pass.

✓ Documentation is updated.

✓ No unnecessary code remains.

✓ No architectural rules are violated.

---

# End of Document