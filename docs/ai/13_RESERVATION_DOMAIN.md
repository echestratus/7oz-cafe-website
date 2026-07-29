# ============================================================================
# 7Oz Espresso Cafe Digital Platform
# Reservation Domain
# ============================================================================

Version         : 1.0.0
Status          : FINAL
File            : ./docs/ai/13_RESERVATION_DOMAIN.md
Owner           : Product Team
Audience        : Backend Developers, Frontend Developers & AI Agents
Last Updated    : 2026-07-29

---

# 1. Purpose

This document defines the business rules, lifecycle, validation, data model, and API behavior for the Reservation feature.

Reservation is one of the platform's core business domains.

---

# 2. Business Goals

The reservation system must:

- Allow customers to reserve tables online.
- Prevent overbooking.
- Support operational management.
- Provide clear reservation status.
- Support future payment deposits if needed.

---

# 3. Reservation Flow

Guest / Customer

↓

Choose Date

↓

Choose Time

↓

Choose Number of Guests

↓

System checks availability

↓

Fill reservation details

↓

Submit Reservation

↓

Confirmation

↓

Arrival

↓

Completed

---

# 4. Reservation Status

Possible statuses:

PENDING

Reservation created but awaiting confirmation.

CONFIRMED

Reservation accepted by café.

CHECKED_IN

Customer has arrived.

COMPLETED

Reservation completed.

CANCELLED

Reservation cancelled by customer or staff.

NO_SHOW

Customer never arrived.

---

# 5. Reservation Information

Each reservation contains:

- Reservation Number
- Customer Account (nullable for guest bookings)
- Guest Full Name
- Guest Email
- Guest Phone
- Date
- Time
- Guest Count
- Table Assignment
- Notes
- Status
- Created At
- Updated At

---

# 5.1 Guest Reservations

Guest reservations are supported in MVP.

An account is not required to create a reservation.

Required contact fields for guest bookings:

- Full name
- Email
- Phone

Rules:

- Do not invent a fake user account for guests.
- Authenticated customers should link the reservation to their user ID.
- Rate-limit reservation creation.
- Validate contact formats server-side.
- Future: guests may claim reservation history after registration.

---

# 6. Availability Rules

Reservation requires:

- Business open
- Available table
- Capacity sufficient

Unavailable periods cannot be booked.

---

# 7. Guest Limits

Minimum guests

1

Maximum guests

Configurable.

Example:

12

Larger groups require manual approval.

---

# 8. Reservation Window

Minimum advance booking:

30 minutes

Maximum advance booking:

30 days

Values configurable.

---

# 9. Operating Hours

Reservations are allowed only during business hours.

Business hours are configurable through CMS.

Special holiday schedules override default hours.

---

# 10. Buffer Time

Each reservation includes configurable buffer time.

Example:

15 minutes before

15 minutes after

Buffer prevents overlapping reservations.

---

# 11. Cancellation Policy

Customers may cancel:

Up to configurable cutoff time.

Example:

2 hours before reservation.

Late cancellation may affect loyalty rules.

---

# 12. No Show

A reservation becomes NO_SHOW when:

- Customer fails to arrive.
- Grace period expires.

Grace period:

15 minutes

Configurable.

---

# 13. Notifications

Reservation events:

Created

Confirmed

Reminder

Cancelled

Completed

Future:

Email

SMS

WhatsApp

Push Notification

---

# 14. Table Assignment

Initial version:

Manual assignment by Admin.

Future:

Automatic optimization.

---

# 15. Customer Rules

Guests may:

Create reservation with contact details.

Customers may:

Create reservation linked to their account.

View reservation history.

Cancel eligible reservations.

View reservation status.

---

# 16. Admin Rules

Admin may:

Create reservation.

Update reservation.

Confirm reservation.

Assign table.

Mark check-in.

Mark completed.

Cancel reservation.

Record no-show.

---

# 17. Validation

Validate:

Business hours.

Reservation date.

Reservation time.

Guest count.

Duplicate reservations.

Availability.

---

# 18. Conflict Detection

Prevent:

Double booking.

Capacity overflow.

Closed-day reservations.

Invalid reservation duration.

---

# 19. Audit Trail

Record:

Creation.

Confirmation.

Cancellation.

Status changes.

Table assignment.

Admin actions.

---

# 20. API Endpoints

Customer

GET    /api/v1/customer/reservations

POST   /api/v1/customer/reservations

GET    /api/v1/customer/reservations/{id}

PATCH  /api/v1/customer/reservations/{id}

DELETE /api/v1/customer/reservations/{id}

Admin

GET    /api/v1/admin/reservations

PATCH  /api/v1/admin/reservations/{id}

PATCH  /api/v1/admin/reservations/{id}/confirm

PATCH  /api/v1/admin/reservations/{id}/check-in

PATCH  /api/v1/admin/reservations/{id}/complete

PATCH  /api/v1/admin/reservations/{id}/cancel

PATCH  /api/v1/admin/reservations/{id}/no-show

---

# 21. Database Tables

Core tables:

reservations

reservation_tables

reservation_histories

Future:

reservation_waitlists

---

# 22. AI Development Rules

AI agents must:

- Prevent overbooking.
- Validate business rules.
- Respect reservation lifecycle.
- Generate audit logs.
- Reuse shared validation.

---

# 23. Definition of Done

Reservation feature is complete only if:

✓ Availability checking works.

✓ Reservation lifecycle implemented.

✓ Validation complete.

✓ Audit logging enabled.

✓ API documented.

✓ Admin workflow complete.

✓ Customer workflow complete.

✓ Tests pass.

---

# End of Document