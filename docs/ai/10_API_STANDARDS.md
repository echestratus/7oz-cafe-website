# ============================================================================
# 7Oz Espresso Cafe Digital Platform
# API Standards
# ============================================================================

Version         : 1.0.0
Status          : FINAL
File            : ./docs/ai/10_API_STANDARDS.md
Owner           : Engineering Team
Audience        : Backend Developers, Frontend Developers & AI Agents
Last Updated    : 2026-07-29

Dependencies:
- 00_MASTER_PROMPT.md
- 01_PROJECT_CONTEXT.md
- 02_PRODUCT_REQUIREMENTS.md
- 03_TECH_STACK.md
- 08_BACKEND_ARCHITECTURE.md
- 09_DATABASE_ARCHITECTURE.md

---

# 1. Purpose

This document defines the official REST API standards for the 7Oz Espresso Cafe Digital Platform.

Every endpoint must follow these standards.

---

# 2. API Philosophy

The API should be:

- Consistent
- Predictable
- Versioned
- Secure
- Well documented
- Easy to consume

REST resources represent business domains.

---

# 3. Base URL

Development

/api/v1

Future

/api/v2

Versioning is mandatory.

Never expose unversioned endpoints.

---

# 4. Resource Naming

Use plural nouns.

Examples

/users

/reservations

/menu-items

/gallery

/memberships

/loyalty-transactions

Never use verbs.

Incorrect

/createReservation

/getUsers

/deleteMenu

---

# 5. HTTP Methods

GET

Retrieve data.

POST

Create resources.

PUT

Replace an existing resource.

PATCH

Partial update.

DELETE

Delete a resource.

Use methods according to HTTP semantics.

---

# 6. HTTP Status Codes

200 OK

Successful retrieval or update.

201 Created

Resource created successfully.

204 No Content

Successful deletion.

400 Bad Request

Invalid request.

401 Unauthorized

Authentication required.

403 Forbidden

Authenticated but not authorized.

404 Not Found

Resource not found.

409 Conflict

Conflict with existing resource.

422 Unprocessable Entity

Validation failed.

429 Too Many Requests

Rate limit exceeded.

500 Internal Server Error

Unexpected server error.

---

# 7. Request Body

JSON only.

Rules:

- camelCase field names
- UTF-8 encoding
- Validate every field
- Reject unknown fields where appropriate

---

# 8. Response Format

Every successful response follows:

{
  "success": true,
  "message": "Reservation created successfully.",
  "data": {},
  "meta": {}
}

Fields

success

Boolean.

message

Human-readable summary.

data

Response payload.

meta

Pagination or additional metadata.

---

# 9. Error Response

Standard format:

{
  "success": false,
  "message": "Validation failed.",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": []
  }
}

Never expose:

- SQL errors
- Stack traces
- Internal implementation

---

# 10. Pagination

Use query parameters.

?page=1

?pageSize=20

Response:

meta:

- page
- pageSize
- totalItems
- totalPages

---

# 11. Filtering

Use query parameters.

Examples

?status=confirmed

?category=coffee

?available=true

Combine filters naturally.

---

# 12. Sorting

Syntax

?sort=createdAt

Descending

?sort=-createdAt

Multiple sorting

?sort=name,-createdAt

---

# 13. Searching

Use:

?q=

Example

?q=espresso

Search implementation should remain server-side.

---

# 14. Date & Time

Use ISO 8601.

Timezone

UTC

Frontend converts to local timezone.

---

# 15. Idempotency

POST requests that may create duplicate business operations should support idempotency keys where appropriate.

Examples

Reservation creation

Future payment processing

---

# 16. Authentication

Protected endpoints require:

Authorization: Bearer <access_token>

Refresh flow uses an HTTP-only Secure Cookie for the refresh token.

Do not store access or refresh tokens in localStorage.

Authentication details are defined in:

12_AUTHENTICATION_AUTHORIZATION.md

CSRF and cookie policy details are defined in:

11_SECURITY_STANDARDS.md

ADR:

../adr/0001-phase-0-architecture-decisions.md

---

# 17. Validation

Validate:

- Path parameters
- Query parameters
- Request body
- Uploaded files

Return consistent validation errors.

---

# 18. API Documentation

Every endpoint must appear in:

OpenAPI

Swagger UI

Documentation must remain synchronized with implementation.

---

# 19. Deprecation

Deprecated endpoints should:

- Remain versioned
- Include documentation
- Provide migration guidance
- Announce removal timeline

Avoid breaking existing clients.

---

# 20. AI Development Rules

AI agents must:

- Follow REST conventions.
- Reuse existing DTOs.
- Return standardized responses.
- Use proper status codes.
- Avoid endpoint duplication.

---

# 21. Definition of Done

API work is complete only if:

✓ Endpoint documented

✓ Validation implemented

✓ Correct status codes

✓ Standard response format

✓ Authentication applied

✓ Tests added

✓ Swagger updated

✓ No breaking changes introduced

---

# End of Document