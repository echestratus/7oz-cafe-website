# ============================================================================
# 7Oz Espresso Cafe Digital Platform
# Backend Architecture
# ============================================================================

Version         : 1.0.0
Status          : FINAL
File            : ./docs/ai/08_BACKEND_ARCHITECTURE.md
Owner           : Engineering Team
Audience        : Backend Developers & AI Agents
Last Updated    : 2026-07-29

Dependencies:
- 00_MASTER_PROMPT.md
- 01_PROJECT_CONTEXT.md
- 02_PRODUCT_REQUIREMENTS.md
- 03_TECH_STACK.md
- 04_MONOREPO_STRUCTURE.md
- 05_ENGINEERING_STANDARDS.md

---

# 1. Purpose

This document defines the official backend architecture for the 7Oz Espresso Cafe Digital Platform.

The backend exposes a REST API that serves both the Customer Website and the Admin Dashboard.

The architecture prioritizes maintainability, scalability, type safety, and testability.

---

# 2. Architectural Style

The backend follows a Pragmatic Clean Architecture.

The application is divided into:

- API Layer
- Service Layer
- Repository Layer
- Infrastructure Layer

Business rules must remain independent of framework-specific implementations.

---

# 3. High-Level Flow

Client

↓

HTTP Router

↓

Middleware

↓

Handler

↓

Service

↓

Repository

↓

Database

---

# 4. Project Structure

```
apps/backend/

cmd/
internal/
pkg/

configs/
database/
migrations/

docs/

scripts/

tests/
```

---

# 5. Internal Structure

```
internal/

config/

database/

middleware/

shared/

modules/
```

Every business domain belongs inside `modules/`.

---

# 6. Module Structure

```
modules/

reservation/

handler/

service/

repository/

dto/

entity/

mapper/

validator/

routes/
```

The same structure applies to:

- membership
- loyalty
- cms
- menu
- gallery
- users
- authentication
- analytics

---

# 7. Layer Responsibilities

## Handler

Responsible for:

- HTTP request parsing
- Validation trigger
- Calling services
- Returning responses

Handlers must not contain business logic.

---

## Service

Responsible for:

- Business rules
- Domain validation
- Transactions
- Coordination between repositories

Services must not know HTTP implementation details.

---

## Repository

Responsible for:

- SQL queries
- Database access
- Persistence

Repositories must not contain business logic.

---

## Entity

Represents business objects.

Entities should remain independent of transport formats.

---

## DTO

Defines request and response payloads.

Never expose database entities directly to clients.

---

## Mapper

Responsible for converting:

DTO ↔ Entity

Entity ↔ Response

---

## Validator

Contains reusable validation logic that extends request validation when necessary.

---

# 8. Dependency Direction

Allowed:

```
Handler
↓

Service
↓

Repository
↓

Database
```

Forbidden:

Repository → Handler

Service → Handler

Repository → Service

Circular dependencies

---

# 9. Routing

Each module owns its own routes.

Example:

```
modules/

reservation/

routes/

routes.go
```

The application router aggregates module routes.

---

# 10. Middleware

Global middleware:

- Request ID
- Recovery
- Logging
- CORS
- Compression
- Rate Limiting
- Authentication
- Authorization

Module-specific middleware should be registered only where needed.

---

# 11. Validation

Validate every incoming request.

Use:

- DTO validation
- Business validation

Validation must occur before business logic execution.

---

# 12. Error Handling

Return standardized API errors.

Every error should include:

- Error Code
- Human-readable Message
- HTTP Status

Never expose:

- SQL errors
- Stack traces
- Internal implementation details

---

# 13. Transactions

Business transactions belong inside the Service layer.

Repositories must never manage transaction boundaries independently.

Complex operations should execute atomically.

---

# 14. Database Access

Use:

- PostgreSQL
- pgx
- sqlc

Repositories should call generated sqlc queries.

Avoid handwritten SQL outside repository packages.

---

# 15. Configuration

Configuration is loaded during application startup.

Never read environment variables directly inside handlers or services.

Use a centralized configuration package.

---

# 16. Logging

Use structured JSON logging.

Every request should include:

- Request ID
- User ID (if authenticated)
- Duration
- Status Code

Sensitive data must never be logged.

---

# 17. Background Jobs

Long-running operations should execute asynchronously.

Examples:

- Email notifications
- Loyalty recalculation
- Analytics aggregation

Background workers must remain independent from HTTP handlers.

---

# 18. File Handling

Current Phase:

Local Storage

Future:

Object Storage

Handlers and services must communicate through a storage abstraction.

Business logic must not depend on filesystem implementation.

---

# 19. Dependency Injection

Dependencies should be constructed during application startup.

Prefer constructor injection.

Avoid global mutable state.

---

# 20. Testing Strategy

Unit Tests

- Service
- Repository (where appropriate)
- Validators
- Mappers

Integration Tests

- API
- Database
- Authentication

---

# 21. AI Development Rules

AI agents must:

- Keep handlers thin.
- Place business logic inside services.
- Keep repositories focused on persistence.
- Reuse shared utilities.
- Avoid circular dependencies.
- Follow module boundaries.

---

# 22. Definition of Done

Backend work is complete only if:

✓ API follows standards

✓ Validation is implemented

✓ Business logic is tested

✓ Database access is isolated

✓ Logging is present

✓ Errors are standardized

✓ Documentation is updated

✓ Architecture boundaries are respected

---

# End of Document