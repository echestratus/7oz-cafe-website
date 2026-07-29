# ============================================================================
# 7Oz Espresso Cafe Digital Platform
# Design System
# ============================================================================

Version         : 1.0.0
Status          : FINAL
File            : ./docs/ai/06_DESIGN_SYSTEM.md
Owner           : Engineering Team
Audience        : Designers, AI Agents & Developers
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

This document defines the visual language, interaction principles, branding guidelines, accessibility requirements, and reusable design decisions for the 7Oz Espresso Cafe Digital Platform.

Every interface must follow this document.

---

# 2. Brand Personality

The platform should communicate:

- Premium
- Elegant
- Calm
- Warm
- Modern
- Minimal
- Timeless

Avoid visual styles that appear:

- Playful
- Loud
- Overly decorative
- Generic
- Corporate

---

# 3. Design Principles

Every screen should prioritize:

- Clarity
- Simplicity
- Consistency
- Readability
- Spacious layouts
- Strong visual hierarchy

Whitespace is a design element.

Do not fill empty space unnecessarily.

---

# 4. Color System

## Brand Colors

Primary

#101673

Primary Hover

#2124C0

Accent

#6B5139

---

## Neutral Palette

Background

#FCFBF8

Surface

#FFFFFF

Surface Secondary

#F5F3EF

Border

#E8E4DD

Divider

#D9D3CA

---

## Text Colors

Primary Text

#1F2937

Secondary Text

#6B7280

Muted Text

#9CA3AF

Inverse Text

#FFFFFF

---

## Semantic Colors

Success

#16A34A

Warning

#F59E0B

Danger

#DC2626

Info

#2563EB

---

# 5. Typography

Primary Font

Manrope

Secondary Font

Instrument Serif

Fallback

system-ui

Usage

Headings

Instrument Serif

Body

Manrope

Buttons

Manrope

Forms

Manrope

Navigation

Manrope

---

# 6. Border Radius

Small

8px

Medium

12px

Large

20px

Extra Large

28px

Cards should have soft rounded corners.

Avoid sharp corners.

---

# 7. Shadows

Use subtle elevation.

Avoid heavy shadows.

Cards should appear lightweight.

Large floating shadows are prohibited.

---

# 8. Spacing System

Base Unit

4px

Spacing Scale

4

8

12

16

20

24

32

40

48

64

80

96

Use consistent spacing throughout the application.

---

# 9. Layout

Maximum Content Width

1280px

Default Section Padding

80px Desktop

48px Tablet

32px Mobile

Grid

12-column responsive layout.

---

# 10. Buttons

Primary

Solid Primary

Secondary

Outline

Ghost

Text Button

Danger

Loading State Required

Disabled State Required

---

# 11. Forms

Every form must provide:

- Labels
- Helper text
- Validation feedback
- Error states
- Disabled states
- Loading states

Never rely on placeholders as labels.

---

# 12. Cards

Cards should include:

- Consistent padding
- Soft border radius
- Minimal shadow
- Clear hierarchy

Avoid excessive decoration.

---

# 13. Icons

Library

Lucide

Guidelines

Consistent sizing

Minimal usage

Decorative icons only when useful

Avoid icon overload.

---

# 14. Photography

Photography is the primary visual identity.

Images should emphasize:

- Coffee
- Food
- Interior
- Atmosphere
- Lifestyle

Avoid:

- Stock-looking imagery
- Low-resolution images
- Excessive filters

---

# 15. Motion

Animations should be:

- Subtle
- Purposeful
- Smooth

Recommended duration

150–300ms

Respect reduced motion preferences.

Avoid distracting animations.

---

# 16. Accessibility

Minimum WCAG AA compliance.

Support:

- Keyboard navigation
- Screen readers
- Visible focus indicators
- Sufficient contrast

---

# 17. Responsive Design

Support:

Desktop

Tablet

Mobile

Mobile-first implementation.

Never hide critical functionality on smaller screens.

---

# 18. Reusable Components

Every reusable component should support:

- Variants
- Sizes
- Disabled state
- Loading state (where applicable)

Components should be composable.

---

# 19. Design Consistency

New screens must reuse existing:

- Components
- Typography
- Color tokens
- Spacing
- Layout patterns

Avoid creating one-off designs.

---

# 20. AI Design Rules

AI must:

- Reuse existing UI components.
- Follow spacing rules.
- Follow typography rules.
- Follow color tokens.
- Preserve visual consistency.

Never introduce new visual styles without approval.

---

# 21. Definition of Done

A UI implementation is complete only if:

✓ Responsive

✓ Accessible

✓ Consistent

✓ Matches design tokens

✓ Uses reusable components

✓ Supports loading states

✓ Supports empty states

✓ Supports error states

---

# End of Document