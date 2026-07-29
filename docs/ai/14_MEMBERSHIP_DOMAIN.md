# ============================================================================
# 7Oz Espresso Cafe Digital Platform
# Membership Domain
# ============================================================================

Version         : 1.0.0
Status          : FINAL
File            : ./docs/ai/14_MEMBERSHIP_DOMAIN.md
Owner           : Product Team
Audience        : Backend Developers, Frontend Developers & AI Agents
Last Updated    : 2026-07-29

---

# 1. Purpose

This document defines the Membership domain including membership levels, qualification rules, benefits, lifecycle, data model, and API behavior.

Membership rewards loyal customers through tier-based benefits.

---

# 2. Business Goals

The membership program should:

- Increase customer retention.
- Encourage repeat visits.
- Reward loyal customers.
- Integrate with the Loyalty system.
- Support future promotional campaigns.

---

# 3. Membership Philosophy

Membership Level is determined by customer loyalty.

Customers do not purchase membership.

Membership progression is automatic.

---

# 4. Membership Levels

Initial Levels:

- Bronze
- Silver
- Gold
- Platinum

Future levels may be added without redesigning the system.

---

# 5. Level Qualification

Membership qualification is based on configurable rules.

Examples:

- Lifetime Loyalty Points
- Annual Loyalty Points
- Number of Visits
- Number of Completed Reservations
- Total Spending (future)

The qualification strategy must be configurable.

---

# 6. Membership Benefits

Benefits may include:

- Birthday rewards
- Exclusive promotions
- Reservation priority
- Early access to seasonal menus
- Loyalty point multipliers
- Complimentary beverages (future)

Benefits are configurable through CMS.

---

# 7. Membership Lifecycle

Guest

↓

Customer

↓

Bronze

↓

Silver

↓

Gold

↓

Platinum

---

# 8. Upgrade Rules

Upgrades occur automatically when qualification requirements are met.

Downgrades may occur after the evaluation period if requirements are no longer met.

Evaluation schedule is configurable.

---

# 9. Membership Validity

Membership validity may be:

- Lifetime
- Rolling 12 months
- Annual

The strategy is configurable.

---

# 10. Membership Status

ACTIVE

Membership is valid.

INACTIVE

Customer is not currently enrolled.

SUSPENDED

Temporarily disabled.

EXPIRED

Membership validity ended.

---

# 11. Membership Profile

Each membership includes:

- Membership Number
- Current Level
- Current Status
- Earned Date
- Expiration Date (if applicable)
- Qualification Progress

---

# 12. Qualification Engine

The Qualification Engine evaluates:

- Loyalty points
- Reservation history
- Visit frequency
- Promotional rules

Evaluation may occur:

- Immediately
- Daily
- Weekly
- Monthly

---

# 13. Membership History

Every level change must be recorded.

History includes:

- Previous Level
- New Level
- Reason
- Timestamp
- Trigger Source

History is immutable.

---

# 14. Customer Capabilities

Customers may:

- View current membership.
- View benefits.
- View qualification progress.
- View membership history.
- Receive upgrade notifications.

Customers cannot manually change their level.

---

# 15. Admin Capabilities

Admins may:

- View memberships.
- Configure benefits.
- Configure qualification rules.
- View membership history.
- Suspend memberships.
- Restore memberships.

Manual level changes should require Super Admin permission.

---

# 16. Notifications

Membership events:

- New membership
- Upgrade
- Downgrade
- Expiration reminder
- Benefit updates

Delivery channels:

- Email
- Push Notification (future)
- WhatsApp (future)

---

# 17. API Endpoints

Customer

GET /api/v1/customer/membership

GET /api/v1/customer/membership/history

GET /api/v1/customer/membership/benefits

Admin

GET /api/v1/admin/memberships

GET /api/v1/admin/memberships/{id}

PATCH /api/v1/admin/memberships/{id}

PATCH /api/v1/admin/memberships/{id}/status

GET /api/v1/admin/membership-levels

PATCH /api/v1/admin/membership-levels

---

# 18. Database Tables

Core tables:

membership_levels

memberships

membership_histories

membership_benefits

---

# 19. AI Development Rules

AI agents must:

- Never hardcode qualification thresholds.
- Read benefit configuration from the database.
- Record every level transition.
- Preserve immutable membership history.
- Reuse shared validation.

---

# 20. Definition of Done

Membership implementation is complete only if:

✓ Level calculation implemented.

✓ Automatic upgrade supported.

✓ Benefit engine integrated.

✓ Membership history recorded.

✓ API documented.

✓ Admin management complete.

✓ Customer dashboard complete.

✓ Tests pass.

---

# End of Document