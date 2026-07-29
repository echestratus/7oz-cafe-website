# ============================================================================
# 7Oz Espresso Cafe Digital Platform
# Project Context
# ============================================================================

Version         : 1.0.0
Status          : FINAL
File            : ./docs/ai/01_PROJECT_CONTEXT.md
Owner           : Engineering Team
Audience        : AI Agents & Developers
Last Updated    : 2026-07-29

Dependencies:
- 00_MASTER_PROMPT.md

---

# 1. Purpose

This document provides the complete business and project context for the 7Oz Espresso Cafe Digital Platform.

Every AI agent and developer must understand this document before making technical decisions.

Technical decisions should always support business objectives.

---

# 2. About 7Oz Espresso Cafe

7Oz Espresso Cafe is a premium specialty coffee shop focused on delivering a modern, comfortable, and memorable coffee experience.

The digital platform should reflect the same experience customers receive when visiting the physical cafe.

The website is not merely an online brochure.

It is an extension of the brand.

---

# 3. Product Vision

Create a premium digital experience that:

- Represents the brand professionally.
- Builds customer trust.
- Encourages reservations.
- Increases repeat visits.
- Improves customer engagement.
- Simplifies business operations.
- Supports future business growth.

Every feature should contribute to one or more of these goals.

---

# 4. Product Positioning

The platform should feel comparable to premium lifestyle brands rather than conventional restaurant websites.

Characteristics:

- Elegant
- Premium
- Minimal
- Modern
- Fast
- Clean
- Professional

Avoid designs that feel:

- Cheap
- Overly colorful
- Cluttered
- Distracting
- Generic

---

# 5. Design Inspiration

Primary inspiration:

- Blue Bottle Coffee

Secondary inspiration:

- Apple
- Aesop
- Notion
- Linear

The goal is inspiration, not imitation.

The final product must establish its own visual identity.

---

# 6. Business Objectives

Primary objectives:

- Increase reservation conversions.
- Increase repeat customers.
- Increase membership registrations.
- Increase loyalty participation.
- Improve operational efficiency.
- Improve online brand presence.

Secondary objectives:

- Improve search engine visibility.
- Prepare for future online ordering.
- Prepare for future multi-branch operations.
- Prepare for future mobile applications.

---

# 7. Target Users

## Visitor

A person browsing the website for the first time.

Typical goals:

- Learn about the cafe.
- View menu.
- View gallery.
- Find location.
- Explore the brand.

---

## Customer

A visitor who has interacted with the business.

Typical goals:

- Make reservations.
- Join membership.
- Earn loyalty points.
- Return to the cafe.

---

## Administrator

Responsible for operating the digital platform.

Typical responsibilities:

- Manage reservations.
- Manage menu items.
- Manage gallery.
- Manage promotions.
- Manage CMS content.
- Monitor analytics.

---

# 8. User Experience Principles

Every interaction should feel:

- Fast
- Clear
- Calm
- Premium
- Intuitive

Avoid unnecessary friction.

Every page should have a clear purpose.

---

# 9. Business Domains

The platform consists of the following domains.

Core Domains:

- Customer
- Reservation
- Membership
- Loyalty
- Menu
- Gallery
- CMS
- Authentication
- Authorization

Supporting Domains:

- Promotion
- Analytics
- Notification
- Settings

Future Domains:

- Inventory
- POS
- Online Ordering
- Payment
- Delivery
- Multi Branch

---

# 10. Platform Components

The platform currently consists of:

Customer Website

Public-facing website for visitors and customers.

Admin Dashboard

Internal web application for administrators.

Backend API

REST API serving both frontend applications.

Shared Packages

Reusable code shared across applications.

Documentation

Engineering documentation supporting long-term maintenance.

---

# 11. Scalability Goals

The architecture must support future expansion without major redesign.

Expected future capabilities include:

- Multiple cafe branches.
- Additional administrators.
- Mobile applications.
- Customer notifications.
- Marketing campaigns.
- Customer segmentation.
- Business analytics.
- Third-party integrations.

---

# 12. Success Metrics

The platform should help improve:

Business Metrics

- Reservation conversion rate.
- Repeat customer rate.
- Membership registrations.
- Loyalty usage.
- Customer engagement.

Technical Metrics

- Performance.
- Maintainability.
- Reliability.
- Security.
- Accessibility.

---

# 13. Engineering Mindset

Every implementation should answer:

- What business problem does this solve?
- Who benefits?
- Does it improve the customer experience?
- Does it improve operational efficiency?
- Can it scale?

If the answer is unclear, revisit the requirement before implementation.

---

# 14. Project Constraints

Current Phase

- Local development.
- VPS deployment planned.
- Assets stored locally within the repository.
- Object storage is intentionally deferred.
- Single branch business operations.

Future phases may introduce:

- Cloud object storage.
- CDN.
- Multiple branches.
- Mobile applications.
- Payment gateway.
- External integrations.

The architecture should allow these additions without requiring major refactoring.

---

# 15. Definition of Project Success

The project is considered successful when:

- Customers enjoy using the platform.
- Administrators can efficiently manage daily operations.
- The platform reflects the premium identity of 7Oz Espresso Cafe.
- The architecture supports future growth.
- The codebase remains maintainable for years.

---

# End of Document