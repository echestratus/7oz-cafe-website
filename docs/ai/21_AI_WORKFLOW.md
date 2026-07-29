# ============================================================================
# 7Oz Espresso Cafe Digital Platform
# AI Development Workflow
# ============================================================================

Version         : 1.0.0
Status          : FINAL
File            : ./docs/ai/21_AI_WORKFLOW.md
Owner           : Engineering Team
Audience        : Cursor AI Agent, Developers & Reviewers
Last Updated    : 2026-07-29

---

# 1. Purpose

This document defines how AI Agents must operate when contributing code to the 7Oz Espresso Cafe Digital Platform.

The AI Agent must behave as a professional software engineer following project architecture, engineering standards, and business requirements.

---

# 2. AI Operating Principles

AI Agent must:

- Understand before modifying.
- Follow architecture before implementation.
- Prefer existing patterns over creating new ones.
- Avoid unnecessary complexity.
- Keep changes focused.
- Maintain documentation consistency.
- Ask clarification when requirements are ambiguous.

---

# 3. Before Writing Code

Before modifying any code, AI Agent must:

## Step 1

Read:

- Relevant documentation under ./docs/ai/
- Existing implementation
- Related modules

---

## Step 2

Understand:

- Business requirement
- Data flow
- API contract
- Database impact
- Frontend impact
- Security impact

---

## Step 3

Create implementation plan:

Example:

```
Feature:
Reservation Confirmation

Affected Areas:

Backend:
- reservation service
- reservation controller
- database migration

Frontend:
- reservation detail page
- status component

Testing:
- reservation integration test
```

---

# 4. Implementation Rules

AI Agent must:

- Follow existing folder structure.
- Reuse existing components.
- Reuse existing utilities.
- Follow naming conventions.
- Keep functions small.
- Avoid duplicate logic.

---

# 5. Backend Rules

AI Agent must follow:

```
Controller

↓

Service

↓

Repository

↓

Database
```

Rules:

Controllers must be thin.

Business rules belong in services.

Database access belongs in repositories.

Validation must exist before processing.

---

# 6. Frontend Rules

AI Agent must follow:

```
Page

↓

Feature Component

↓

Hooks

↓

API Layer

↓

Backend
```

Rules:

Components should not contain business logic.

API calls must go through API layer.

Shared components must be reused.

---

# 7. Database Rules

Before changing database:

AI Agent must evaluate:

- Migration requirement.
- Backward compatibility.
- Existing relationships.
- Index requirements.
- Data migration impact.

Never modify production data manually.

---

# 8. Documentation Rules

When implementing a feature:

AI Agent must check whether documentation requires update.

Update:

- Domain documentation.
- API documentation.
- Database documentation.
- Architecture documentation.

Documentation must remain synchronized with implementation.

---

# 9. Git Workflow

AI Agent must follow:

Branch:

```
feature/name
fix/name
chore/name
```

Commit:

Use Conventional Commits.

Examples:

```
feat: add reservation availability check

fix: prevent duplicate reservation

docs: update loyalty domain documentation
```

Never:

```
update files
changes
final fix
test
```

---

# 10. Commit Rules

AI Agent must:

- Create granular commits.
- Keep commits logically separated.
- Avoid mixing unrelated changes.

Example:

Correct:

```
feat: create reservation entity

feat: add reservation API endpoint

test: add reservation service tests
```

Incorrect:

```
feat: implement reservation system
```

---

# 11. Dependency Rules

Before installing dependencies:

AI Agent must verify:

- Existing library cannot solve the problem.
- Package is actively maintained.
- Package is compatible.
- Package does not introduce unnecessary complexity.

---

# 12. Security Rules

AI Agent must:

Never:

- Commit secrets.
- Hardcode credentials.
- Disable security checks.
- Expose sensitive information.

Always:

- Validate input.
- Apply authorization.
- Protect sensitive endpoints.

---

# 13. Testing Rules

Every feature requires:

Minimum:

- Unit test
- Integration test if touching backend/data
- E2E test for critical user flows

Bug fixes require regression tests.

---

# 14. UI Development Rules

AI Agent must:

Follow:

- Design system.
- Typography.
- Color system.
- Spacing system.
- Accessibility standards.

Never create random UI patterns.

---

# 15. Asset Rules

Assets must follow:

```
assets/

├── home
├── menu
├── gallery
├── logo
├── icons
└── illustrations
```

AI Agent must:

- Optimize images.
- Use proper naming.
- Avoid duplicated assets.
- Preserve asset organization.

---

# 16. When AI Must Ask User

AI Agent must ask before:

- Changing architecture.
- Adding major dependencies.
- Removing existing features.
- Changing database structure significantly.
- Changing authentication flow.
- Breaking API contracts.

---

# 17. When AI Can Proceed Automatically

AI may proceed without confirmation for:

- Creating tests.
- Refactoring without behavior changes.
- Formatting.
- Documentation updates.
- Small bug fixes.

---

# 18. Code Review Simulation

Before finishing a task, AI Agent must review:

Architecture

✓

Security

✓

Performance

✓

Testing

✓

Documentation

✓

Maintainability

✓

---

# 19. Final Response Format

After completing work, AI Agent should summarize:

```
## Summary

Implemented:

- Feature A
- Feature B

Changed:

- Backend
- Frontend
- Database

Testing:

- Passed tests

Notes:

- Migration required
- Environment update required
```

---

# 20. Definition of Done

AI Agent work is complete only if:

✓ Code implemented

✓ Tests passed

✓ Documentation updated

✓ No lint errors

✓ Architecture followed

✓ Security reviewed

✓ Changes summarized

---

# End of Document