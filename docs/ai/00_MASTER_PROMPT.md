# ============================================================================
# 7Oz Espresso Cafe Digital Platform
# AI Master Prompt
# ============================================================================

Version         : 1.0.0
Status          : FINAL
File            : ./docs/ai/00_MASTER_PROMPT.md
Owner           : Engineering Team
Audience        : AI Agents & Developers
Last Updated    : 2026-07-29

Dependencies    : None

Referenced By   :
- 01_PROJECT_CONTEXT.md
- 02_PRODUCT_REQUIREMENTS.md
- 03_TECH_STACK.md
- 04_MONOREPO_STRUCTURE.md
- 05_ENGINEERING_STANDARDS.md
- 06_DESIGN_SYSTEM.md
- 07_BACKEND_ARCHITECTURE.md
- 08_FRONTEND_ARCHITECTURE.md
- 09_DATABASE_ARCHITECTURE.md
- 10_API_STANDARDS.md
- 11_SECURITY_STANDARDS.md
- 12_AUTHENTICATION_AUTHORIZATION.md
- 13_RESERVATION_DOMAIN.md
- 14_MEMBERSHIP_DOMAIN.md
- 15_LOYALTY_DOMAIN.md
- 16_ADMIN_DASHBOARD.md
- 17_CMS.md
- 18_DEPLOYMENT.md
- 19_TESTING_STRATEGY.md
- 20_CODE_REVIEW_CHECKLIST.md
- 21_AI_WORKFLOW.md
- 22_DEFINITION_OF_DONE.md

---

# 1. Purpose

This document is the highest-level engineering instruction for every AI agent and developer working on the 7Oz Espresso Cafe Digital Platform.

It defines the universal engineering principles that apply across the entire repository.

Every document inside `./docs/ai` extends this document.

If two documents appear to conflict, this document takes precedence unless a newer version explicitly supersedes it.

---

# 2. Project Vision

7Oz Espresso Cafe Digital Platform is a modern digital ecosystem designed to support the business operations and customer experience of 7Oz Espresso Cafe.

The platform must provide a premium, elegant, reliable, secure, and scalable experience while remaining maintainable for long-term development.

The architecture must support future business expansion without requiring major redesign.

---

# 3. Platform Scope

The platform currently consists of:

- Customer Website
- Admin Dashboard
- Backend REST API
- Shared Packages
- Engineering Documentation

Future expansion should support:

- Multi-Branch Management
- Mobile Applications
- POS Integration
- Online Ordering
- Inventory Management
- Payment Gateway Integration
- Marketing Automation

---

# 4. Core Objectives

Every technical decision should support one or more of the following objectives.

- Present the cafe professionally.
- Increase reservation conversion.
- Improve customer retention.
- Support membership and loyalty programs.
- Simplify operational management.
- Maintain high engineering quality.
- Support future scalability.

---

# 5. Engineering Philosophy

The project follows these principles.

- Simplicity over complexity.
- Readability over cleverness.
- Maintainability over shortcuts.
- Explicitness over implicit behavior.
- Consistency over personal preference.
- Scalability through good architecture.
- Security by default.
- Accessibility by default.

---

# 6. Repository Philosophy

This repository is a monorepo.

Every application owns its own implementation.

Reusable code belongs inside shared packages.

Business logic must never be duplicated.

Every feature should have a clear ownership boundary.

---

# 7. AI Responsibilities

Before implementing any feature, the AI must:

1. Understand the business requirement.
2. Identify affected domains.
3. Review all relevant documentation.
4. Evaluate architectural impact.
5. Produce an implementation plan.
6. Implement the solution.
7. Verify correctness.
8. Update documentation if required.

AI must never skip analysis.

---

# 8. Engineering Principles

Always follow:

- SOLID
- DRY
- KISS
- Separation of Concerns
- Feature-First Organization
- Domain-Oriented Design
- Composition over Inheritance
- Explicit Dependencies
- Clean Code Principles

---

# 9. Development Lifecycle

Every feature follows the same lifecycle.

Requirement

↓

Business Analysis

↓

Impact Analysis

↓

Architecture Review

↓

Implementation Planning

↓

Database

↓

Backend

↓

Frontend

↓

Testing

↓

Documentation

↓

Code Review

↓

Git Commit

↓

Pull Request

No phase may be skipped without explicit approval.

---

# 10. Documentation Policy

Documentation is part of the product.

Whenever implementation changes:

- Review affected documentation.
- Update outdated documentation.
- Keep implementation and documentation synchronized.

Outdated documentation is considered a defect.

---

# 11. Code Generation Rules

Before creating new code:

Search for existing:

- Components
- Hooks
- Utilities
- Services
- Repositories
- Types
- DTOs
- Validation Schemas

Reuse existing implementations whenever appropriate.

Avoid duplicate code.

---

# 12. Code Modification Rules

Before modifying existing code:

- Understand surrounding architecture.
- Preserve existing conventions.
- Keep changes focused.
- Avoid unrelated refactoring.
- Avoid introducing breaking changes.

---

# 13. Error Handling Principles

Errors must be:

- Consistent
- Predictable
- Actionable
- Secure

Never expose:

- Stack traces
- Internal database errors
- Framework internals
- Sensitive implementation details

---

# 14. Performance Principles

Optimize only after measurement.

Prioritize:

- Fast page loads
- Efficient rendering
- Efficient database access
- Efficient API communication
- Minimal unnecessary work

Avoid premature optimization.

---

# 15. Security Principles

Security is mandatory.

Always:

- Validate every input.
- Authorize every protected action.
- Protect sensitive information.
- Follow the Security Standards document.

Never trust client-side validation.

---

# 16. Accessibility Principles

Accessibility is a core requirement.

Every user interface should support:

- Keyboard navigation
- Semantic HTML
- Screen readers
- Sufficient color contrast
- Reduced motion preferences

Accessibility must never be treated as an optional enhancement.

---

# 17. Design Principles

The user experience should communicate:

- Premium
- Elegant
- Minimal
- Warm
- Modern
- Timeless

Photography is the primary visual element.

Whitespace is intentional.

Avoid unnecessary visual decoration.

---

# 18. AI Output Standards

Generated code must:

- Compile successfully.
- Pass linting.
- Pass formatting.
- Pass type checking.
- Follow repository conventions.
- Include appropriate validation.
- Handle errors correctly.
- Be production-ready.

---

# 19. Communication Guidelines

When assisting developers:

- Be concise.
- Explain decisions clearly.
- Avoid unnecessary theory.
- Do not invent business requirements.
- Request clarification when required information is missing.

---

# 20. Success Criteria

A task is considered complete only if:

- Business requirements are satisfied.
- Engineering standards are followed.
- Documentation remains accurate.
- The implementation is production-ready.
- No known critical issues remain.

---

# End of Document