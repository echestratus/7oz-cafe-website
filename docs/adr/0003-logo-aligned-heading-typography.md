# ADR 0003 — Logo-aligned website headings

Status: Accepted

Date: 2026-11-16

Supersedes: The heading typography choice in ADR 0001.

## Context

The owner requested website headings that match the new geometric 7Oz logo.
The website previously used Fraunces; ADR 0001 still mentioned Newsreader.

## Decision

Use Poppins for public website display typography and headings, with weight 600
for headings and the existing Inter for body copy and navigation. Load Poppins
through next/font, including italic styles for existing quotes and taglines.
Retain existing responsive sizes, spacing, colors, and reduced-motion behavior.

On the homepage only, place coming-soon locations at the end of the horizontal
location list, preserving catalog order within each group. Keep the open flagship
featured and retain the existing order on gallery and contact pages.

Update (2026-11-23): the owner superseded the homepage ordering rule above.
All location displays now list open rooms, then coming-soon rooms, with every
closed room at the very end. Ordering within each status group remains stable.

## Consequences

The public website uses two sans-serif families that complement the logo.
The admin application's typography is outside this change's scope.
