# ============================================================================
# 7Oz Espresso Cafe Digital Platform
# Code Review Checklist
# ============================================================================

Version         : 1.0.0
Status          : FINAL
File            : ./docs/ai/20_CODE_REVIEW_CHECKLIST.md
Owner           : Engineering Team
Audience        : Developers, Reviewers, Tech Leads & AI Agents
Last Updated    : 2026-07-29

---

# 1. Purpose

This document defines the mandatory quality checklist before code is merged into the main development branch.

No Pull Request should be approved unless every applicable checklist item has been satisfied.

---

# 2. General Quality

- [ ] Code is readable.
- [ ] Naming is meaningful.
- [ ] No duplicated logic.
- [ ] Functions have a single responsibility.
- [ ] Files remain reasonably small.
- [ ] Dead code removed.
- [ ] No TODO left without issue reference.
- [ ] Magic numbers avoided.
- [ ] Shared utilities reused.

---

# 3. Architecture

- [ ] Follows Feature-First Architecture.
- [ ] Business logic is inside services.
- [ ] UI contains no business logic.
- [ ] Dependency direction respected.
- [ ] Shared modules reused.
- [ ] No circular dependencies.
- [ ] Domain boundaries respected.

---

# 4. Backend Checklist

- [ ] Validation implemented.
- [ ] Authorization enforced.
- [ ] Audit logging implemented.
- [ ] Transactions used where required.
- [ ] Proper HTTP status codes.
- [ ] API schema updated.
- [ ] Error handling consistent.
- [ ] Database migration included (if required).

---

# 5. Frontend Checklist

- [ ] Responsive.
- [ ] Accessible.
- [ ] Loading states implemented.
- [ ] Empty states implemented.
- [ ] Error states implemented.
- [ ] Forms validated.
- [ ] Optimistic UI only where appropriate.
- [ ] No unnecessary re-rendering.

---

# 6. Security Checklist

- [ ] RBAC enforced.
- [ ] Authentication validated.
- [ ] Authorization validated.
- [ ] Secrets not committed.
- [ ] User input sanitized.
- [ ] Rate limiting considered.
- [ ] Sensitive data protected.
- [ ] Security headers preserved.

---

# 7. Performance Checklist

- [ ] Database queries optimized.
- [ ] N+1 queries avoided.
- [ ] Pagination implemented.
- [ ] Caching considered.
- [ ] Images optimized.
- [ ] Lazy loading implemented.
- [ ] Bundle size reviewed.
- [ ] No unnecessary API calls.

---

# 8. Database Checklist

- [ ] Migration reversible.
- [ ] Foreign keys correct.
- [ ] Indexes added where necessary.
- [ ] Constraints implemented.
- [ ] Soft delete policy followed.
- [ ] Seed data updated if needed.

---

# 9. API Checklist

- [ ] OpenAPI updated.
- [ ] Validation schema updated.
- [ ] Response consistent.
- [ ] Error response standardized.
- [ ] Pagination supported.
- [ ] Filtering supported.
- [ ] Sorting supported.

---

# 10. Testing Checklist

- [ ] Unit tests added.
- [ ] Integration tests added.
- [ ] E2E tests updated.
- [ ] Regression tests added for bug fixes.
- [ ] Accessibility verified.
- [ ] Performance impact reviewed.

---

# 11. Documentation Checklist

- [ ] README updated if necessary.
- [ ] API documentation updated.
- [ ] AI documentation updated.
- [ ] Architecture documentation updated.
- [ ] Environment variables documented.

---

# 12. UI/UX Checklist

- [ ] Design System followed.
- [ ] Colors consistent.
- [ ] Typography consistent.
- [ ] Icon usage consistent.
- [ ] Mobile experience verified.
- [ ] Keyboard navigation verified.

---

# 13. Git Checklist

- [ ] Correct branch used.
- [ ] Conventional Commit followed.
- [ ] Granular commits created.
- [ ] PR description completed.
- [ ] No merge conflicts.
- [ ] No generated files committed unnecessarily.

---

# 14. AI Agent Checklist

AI Agents must verify:

- Project rules followed.
- Cursor rules followed.
- Documentation updated.
- Tests generated.
- No duplicated components.
- No unnecessary dependencies added.

---

# 15. Merge Approval Criteria

A Pull Request may only be approved if:

✓ CI passes

✓ Required reviews completed

✓ No blocking comments

✓ Security review passed

✓ Documentation updated

✓ Tests pass

✓ Coverage maintained

---

# End of Document