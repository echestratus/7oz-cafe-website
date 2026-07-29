# ============================================================================
# 7Oz Espresso Cafe Digital Platform
# Content Management System (CMS)
# ============================================================================

Version         : 1.0.0
Status          : FINAL
File            : ./docs/ai/17_CMS.md
Owner           : Product Team
Audience        : Backend Developers, Frontend Developers & AI Agents
Last Updated    : 2026-07-29

---

# 1. Purpose

This document defines the architecture, content model, workflows, and governance for the internal Headless CMS.

The CMS is responsible for managing all public-facing website content without requiring code changes.

---

# 2. CMS Philosophy

The CMS is the single source of truth for website content.

Frontend applications must consume content via API.

Business users should be able to update content independently.

---

# 3. Content Modules

The CMS manages:

- Homepage
- Hero Section
- About
- Menu Highlights
- Gallery
- Promotions
- Testimonials
- FAQ
- Contact Information
- Business Hours
- Footer
- SEO Metadata
- Social Media
- Announcement Banner

Future:

- Blog
- Events
- Careers

---

# 4. Homepage Structure

Homepage consists of:

Hero

↓

Featured Menu

↓

About Preview

↓

Gallery Preview

↓

Membership Promotion

↓

Reservation CTA

↓

Testimonials

↓

Instagram Feed (future)

↓

Footer

Every section can be enabled or disabled.

---

# 5. Hero Section

Editable fields:

- Title
- Subtitle
- CTA Primary
- CTA Secondary
- Hero Image
- Hero Video
- Overlay Opacity
- Overlay Color
- Display Order

Only one active Hero is allowed.

---

# 6. About Section

Editable:

- Heading
- Description
- Image
- Values
- Story
- Vision
- Mission

Rich text supported.

---

# 7. Menu Highlights

Configure:

- Featured Menu Items
- Display Order
- Category
- Badge
- CTA

Actual menu data remains in the Menu module.

---

# 8. Gallery

Manage:

- Images
- Albums
- Categories
- Captions
- Alt Text
- Sort Order
- Visibility

---

# 9. Testimonials

Manage:

- Customer Name
- Position (optional)
- Rating
- Review
- Avatar
- Display Order

Approval workflow supported.

---

# 10. Promotions

Manage:

- Banner
- Title
- Description
- Start Date
- End Date
- CTA
- Landing URL

Automatic scheduling supported.

---

# 11. FAQ

Manage:

- Question
- Answer
- Category
- Sort Order

---

# 12. Contact Information

Editable:

- Address
- Phone
- WhatsApp
- Email
- Google Maps URL
- Reservation Contact

---

# 13. Business Hours

Weekly Schedule

Holiday Schedule

Special Events

Temporary Closure

Reservation Availability

---

# 14. SEO

Per-page configuration:

- Meta Title
- Meta Description
- Canonical URL
- Open Graph
- Twitter Card
- Robots
- Keywords
- Structured Data

---

# 15. Media Library

Supported Assets:

- Images
- Videos
- Icons
- Documents

Metadata:

- File Name
- MIME Type
- Size
- Uploaded By
- Uploaded At
- Usage Reference

---

# 16. Draft & Publish

States:

Draft

↓

Review

↓

Published

↓

Archived

Publishing must not require application deployment.

---

# 17. Version History

Each published content stores:

- Version
- Author
- Timestamp
- Summary

Rollback is supported.

---

# 18. API Endpoints

Public

GET /api/v1/public/cms/homepage

GET /api/v1/public/cms/about

GET /api/v1/public/cms/footer

GET /api/v1/public/cms/contact

Admin

GET /api/v1/admin/cms

PATCH /api/v1/admin/cms

POST /api/v1/admin/cms/publish

POST /api/v1/admin/cms/rollback

---

# 19. Database Tables

cms_pages

cms_sections

cms_contents

cms_versions

media_assets

media_folders

---

# 20. AI Development Rules

AI agents must:

- Never hardcode content.
- Always consume CMS APIs.
- Preserve version history.
- Support draft/publish workflow.
- Generate audit logs.

---

# 21. Definition of Done

CMS implementation is complete only if:

✓ Dynamic content supported

✓ Version history available

✓ Draft/Publish implemented

✓ Rollback supported

✓ SEO configurable

✓ Media Library integrated

✓ API documented

✓ Tests pass

---

# End of Document