# ============================================================================
# 7Oz Espresso Cafe Digital Platform
# Security Standards
# ============================================================================

Version         : 1.0.0
Status          : FINAL
File            : ./docs/ai/11_SECURITY_STANDARDS.md
Owner           : Engineering Team
Audience        : Developers, DevOps Engineers & AI Agents
Last Updated    : 2026-07-29

Dependencies:
- 08_BACKEND_ARCHITECTURE.md
- 09_DATABASE_ARCHITECTURE.md
- 10_API_STANDARDS.md

---

# 1. Purpose

This document defines the minimum security standards for every application and infrastructure component in the 7Oz Espresso Cafe Digital Platform.

Security is a mandatory requirement.

---

# 2. Security Principles

Always follow:

- Least Privilege
- Defense in Depth
- Zero Trust
- Secure by Default
- Fail Securely

Never trust user input.

Never expose internal systems.

---

# 3. Authentication

Authentication must:

- Require HTTPS in production.
- Use JWT Access Token.
- Use Refresh Token rotation.
- Invalidate revoked sessions.
- Support logout from all devices (future).

Passwords:

- Argon2id hashing
- Never reversible
- Never logged

---

# 4. Authorization

Use Role-Based Access Control (RBAC).

Initial Roles:

- Customer
- Admin
- Super Admin

Permissions are evaluated server-side.

Frontend authorization is for UX only.

---

# 5. HTTPS

Production must enforce HTTPS.

Requirements:

- TLS 1.2 minimum
- TLS 1.3 preferred
- HTTP → HTTPS redirect

Never expose authentication endpoints over plain HTTP.

---

# 6. Secrets Management

Never commit:

- API keys
- JWT secrets
- SMTP credentials
- Database passwords
- OAuth secrets

Secrets belong in:

Environment variables.

Future:

Vault or Secret Manager.

---

# 7. Input Validation

Validate:

- Body
- Query
- Headers
- Path parameters
- Uploaded files

Reject unexpected fields where appropriate.

Never trust client validation.

---

# 8. SQL Injection

Always use:

- Parameterized queries
- sqlc generated queries

Never concatenate SQL strings.

---

# 9. XSS Protection

Escape rendered HTML.

Sanitize rich-text content before storage or rendering.

Do not render arbitrary HTML without sanitization.

---

# 10. CSRF

If cookie-based authentication is introduced:

- Enable CSRF protection.
- Validate Origin/Referer.

JWT Authorization Header does not require traditional CSRF tokens.

---

# 11. CORS

Allow only trusted origins.

Development:

Localhost origins.

Production:

Official website domains only.

Avoid wildcard origins.

---

# 12. Security Headers

Production should include:

- Content-Security-Policy
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy
- Permissions-Policy
- Strict-Transport-Security

---

# 13. Rate Limiting

Protect:

- Login
- Registration
- Password reset
- Reservation creation
- Public APIs

Return:

HTTP 429

---

# 14. File Upload Security

Allow only approved MIME types.

Validate:

- MIME type
- File extension
- Maximum size

Rename uploaded files.

Never trust original filenames.

Future:

Virus scanning.

---

# 15. Logging

Log:

- Login
- Logout
- Permission denial
- Reservation changes
- Membership changes
- CMS changes
- Administrative actions

Never log:

- Passwords
- Tokens
- Payment details
- Secrets

---

# 16. Audit Trail

Critical actions must record:

- User ID
- Action
- Resource
- Timestamp
- IP Address
- User Agent

Audit logs are immutable.

---

# 17. Session Security

Refresh tokens:

- Rotated
- Revocable
- Expirable

Access tokens:

- Short-lived

Never store tokens in localStorage.

Preferred:

HTTP-only Secure Cookies for refresh tokens.

---

# 18. Dependency Security

Run dependency audits regularly.

Update vulnerable packages promptly.

Do not introduce abandoned libraries.

---

# 19. Infrastructure Security

Production VPS should include:

- UFW firewall
- Fail2Ban
- SSH key authentication
- Disabled root login
- Automatic security updates
- Nginx reverse proxy

---

# 20. Backup Security

Encrypt backups.

Restrict backup access.

Test restoration periodically.

---

# 21. Monitoring

Monitor:

- Failed logins
- 5xx responses
- High latency
- Rate limit events
- Unexpected permission failures

---

# 22. AI Development Rules

AI agents must:

- Never hardcode secrets.
- Never disable authentication.
- Never bypass authorization.
- Validate all inputs.
- Follow secure coding practices.

---

# 23. Security Checklist

Before deployment:

✓ HTTPS enabled

✓ Security headers configured

✓ Rate limiting enabled

✓ Secrets externalized

✓ Logging enabled

✓ Audit trail enabled

✓ Firewall configured

✓ Backup configured

✓ Dependency audit completed

✓ No high-severity vulnerabilities

---

# End of Document
