# ============================================================================
# 7Oz Espresso Cafe Digital Platform
# Authentication & Authorization
# ============================================================================

Version         : 1.0.0
Status          : FINAL
File            : ./docs/ai/12_AUTHENTICATION_AUTHORIZATION.md
Owner           : Engineering Team
Audience        : Backend Developers, Frontend Developers & AI Agents
Last Updated    : 2026-07-29

Dependencies:
- 08_BACKEND_ARCHITECTURE.md
- 09_DATABASE_ARCHITECTURE.md
- 10_API_STANDARDS.md
- 11_SECURITY_STANDARDS.md

---

# 1. Purpose

This document defines the authentication, authorization, session management, and access control strategy for the 7Oz Espresso Cafe Digital Platform.

The system uses centralized authentication with Role-Based Access Control (RBAC).

---

# 2. Authentication Principles

The authentication system must:

- Be secure by default.
- Support multiple devices.
- Support session revocation.
- Support token rotation.
- Scale to future OAuth providers.
- Be framework-independent.

---

# 3. User Roles

The platform MVP supports these persisted roles:

- Customer
- Admin
- Super Admin

Visitor describes an unauthenticated actor and is not stored as a role.

Deferred roles (POS / multi-branch):

- Cafe Manager
- Cashier
- Kitchen
- Barista
- Branch Manager

Future roles may be added without redesigning the authentication system.

---

# 4. User Lifecycle

Guest

↓

Register

↓

Email Verification

↓

Customer

↓

Login

↓

Authenticated Session

↓

Logout

---

# 5. Registration

Customers may register using:

- Full Name
- Email
- Password

Requirements:

- Email must be unique.
- Password follows Security Standards.
- Email verification required before account activation.

---

# 6. Login

Single endpoint:

POST /api/v1/auth/login

Credentials:

- Email
- Password

Successful login returns:

- Access Token
- Refresh Token
- User Profile
- Role

---

# 7. Token Strategy

Access Token:

- JWT
- Lifetime: 15 minutes
- Sent via Authorization Bearer header
- Stored in memory on frontend
- Never stored in localStorage

Refresh Token:

- Opaque preferred (JWT acceptable if justified)
- Lifetime: 30 days
- Stored in HTTP-only Secure Cookie
- SameSite configured for CSRF mitigation

Refresh tokens are rotated after each successful refresh.

CSRF defenses are required for cookie-based refresh endpoints.

---

# 8. Session Management

Each login creates a new session.

Each session stores:

- Session ID
- User ID
- Device Information
- IP Address
- Last Activity
- Expiration Time

Users may revoke individual sessions.

Admins may revoke any session.

---

# 9. Logout

Logout:

- Invalidates current refresh token.
- Removes session.
- Clears authentication cookies.

Optional:

Logout from all devices.

---

# 10. Email Verification

New accounts remain inactive until verified.

Verification links:

- Single use.
- Expire after 24 hours.

Delivery uses the backend mailer (`SMTP_*` + `WEBSITE_URL`).
In development, tokens may also be returned in the API response when SMTP is not configured.

Support resend verification email.

---

# 11. Password Reset

Flow:

Forgot Password

↓

Email Reset Link

↓

Token Verification

↓

New Password

↓

Invalidate Existing Sessions (optional but recommended)

Reset tokens:

- Single use.
- Expire after 1 hour.

---

# 12. Authorization (RBAC)

Authorization is enforced server-side.

Permissions are mapped to roles.

Example:

Customer

- View Menu
- Make Reservation
- View Loyalty
- Edit Profile

Admin

- Manage Menu
- Manage Gallery
- Manage Reservations
- Manage Membership
- Manage CMS

Super Admin

- Full Administrative Access
- User Management
- Role Assignment
- System Settings
- Audit Log Access

---

# 13. Route Protection

Website

Public:

- Home
- About
- Menu
- Gallery
- Contact
- Create Reservation (guest booking allowed)

Authenticated:

- Reservation history linked to account
- Loyalty
- Membership
- Profile

Admin

All routes require authentication.

Admin role required for operational modules.

Sensitive routes additionally require Super Admin.

---

# 14. Middleware

Authentication Middleware

Responsibilities:

- Verify JWT.
- Validate session.
- Attach user context.

Authorization Middleware

Responsibilities:

- Verify role.
- Verify permissions.
- Reject unauthorized access.

---

# 15. Refresh Flow

Access Token expires

↓

Frontend calls:

POST /api/v1/auth/refresh

↓

Refresh Token validated

↓

Old Refresh Token revoked

↓

New Access Token

↓

New Refresh Token

---

# 16. Failed Authentication

Protect against:

- Brute force
- Credential stuffing
- Session hijacking

Repeated failures trigger rate limiting.

---

# 17. Future OAuth

Architecture should support:

- Google
- Apple

Without redesigning authentication modules.

---

# 18. Audit Logging

Authentication events:

- Login
- Logout
- Failed Login
- Password Reset
- Email Verification
- Session Revocation
- Role Changes

Must be recorded.

---

# 19. AI Development Rules

AI agents must:

- Never bypass authentication.
- Never bypass authorization.
- Always validate sessions.
- Rotate refresh tokens.
- Respect RBAC.

---

# 20. Definition of Done

Authentication work is complete only if:

✓ Registration works

✓ Login works

✓ Email verification works

✓ Refresh flow works

✓ Logout works

✓ Session revocation works

✓ RBAC enforced

✓ Audit logs generated

✓ Tests pass

---

# End of Document