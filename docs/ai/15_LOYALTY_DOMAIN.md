# ============================================================================
# 7Oz Espresso Cafe Digital Platform
# Loyalty Domain
# ============================================================================

Version         : 1.0.0
Status          : FINAL
File            : ./docs/ai/15_LOYALTY_DOMAIN.md
Owner           : Product Team
Audience        : Backend Developers, Frontend Developers & AI Agents
Last Updated    : 2026-07-29

---

# 1. Purpose

This document defines the Loyalty Engine, including point accumulation, redemption, transaction history, expiration rules, promotional campaigns, and integration with Membership.

The Loyalty Engine is the single source of truth for customer points.

---

# 2. Business Goals

The loyalty program should:

- Reward repeat customers.
- Encourage higher spending.
- Increase visit frequency.
- Support promotional campaigns.
- Integrate seamlessly with Membership.

---

# 3. Loyalty Philosophy

Customer activities generate business events.

Business events generate loyalty transactions.

Loyalty transactions determine point balance.

Membership evaluates the accumulated results.

---

# 4. Point Sources

Points may be earned from:

- Completed purchases
- Completed reservations (optional)
- Promotional campaigns
- Birthday campaigns
- Referral campaigns (future)
- Special events

Every point source must be configurable.

---

# 5. Point Types

Supported transaction types:

- EARN
- REDEEM
- BONUS
- ADJUSTMENT
- EXPIRED

Each transaction changes the customer's point balance.

---

# 6. Point Rules

Point calculation must be configurable.

Examples:

- 1 point per Rp10.000 spent
- Double point weekends
- Triple point campaigns

Hardcoded business rules are prohibited.

---

# 7. Membership Multipliers

Membership may apply multipliers.

Example:

Bronze

1.0x

Silver

1.2x

Gold

1.5x

Platinum

2.0x

Multiplier configuration belongs to Membership configuration.

---

# 8. Point Expiration

Expiration strategy is configurable.

Examples:

- Never expire
- Rolling 12 months
- Annual expiration

Expired points generate EXPIRED transactions.

Points are never silently removed.

---

# 9. Redemption

Points may be redeemed for:

- Drinks
- Food
- Merchandise
- Discount vouchers
- Reservation benefits (future)

Every redemption creates a REDEEM transaction.

---

# 10. Loyalty Balance

Balance is calculated from transaction history.

Current Balance

=

Earn

+

Bonus

+

Adjustment

-

Redeem

-

Expired

Balance should never be edited directly.

---

# 11. Transaction History

Each transaction records:

- Transaction ID
- Customer
- Type
- Source
- Points
- Description
- Related Entity
- Created At

History is immutable.

---

# 12. Promotions

Campaigns may define:

- Start date
- End date
- Eligible members
- Eligible products
- Point multiplier
- Bonus points

Campaign rules are configurable.

---

# 13. Admin Capabilities

Admins may:

- View balances
- View history
- Create campaigns
- Apply manual adjustments
- Configure point rules

Manual adjustments require audit logging.

---

# 14. Customer Capabilities

Customers may:

- View current balance
- View transaction history
- View expiring points
- Redeem rewards
- View available rewards

Customers cannot manually edit points.

---

# 15. API Endpoints

Customer

GET /api/v1/customer/loyalty

GET /api/v1/customer/loyalty/history

GET /api/v1/customer/loyalty/rewards

POST /api/v1/customer/loyalty/redeem

Admin

GET /api/v1/admin/loyalty

GET /api/v1/admin/loyalty/history

POST /api/v1/admin/loyalty/adjustments

GET /api/v1/admin/loyalty/campaigns

POST /api/v1/admin/loyalty/campaigns

PATCH /api/v1/admin/loyalty/campaigns/{id}

---

# 16. Database Tables

Core tables:

loyalty_accounts

loyalty_transactions

loyalty_rewards

loyalty_redemptions

loyalty_campaigns

---

# 17. Event Sources

The Loyalty Engine listens to events such as:

- Reservation Completed
- Order Completed
- Membership Upgraded
- Campaign Activated

Future modules may publish additional events.

---

# 18. Audit Trail

Audit logs must record:

- Manual adjustments
- Campaign changes
- Reward changes
- Redemption approvals
- Administrative actions

---

# 19. AI Development Rules

AI agents must:

- Never update balances directly.
- Always append loyalty transactions.
- Preserve immutable history.
- Respect configurable point rules.
- Trigger membership evaluation after eligible events.

---

# 20. Definition of Done

Loyalty implementation is complete only if:

✓ Point earning implemented

✓ Redemption implemented

✓ Campaign engine implemented

✓ Transaction history immutable

✓ Balance calculated correctly

✓ Membership integration working

✓ Audit logging enabled

✓ Tests pass

---

# End of Document