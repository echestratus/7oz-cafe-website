# Project Context

## Project

7Oz Espresso Cafe Digital Platform

---

## Vision

Build a premium digital ecosystem for 7Oz Espresso Cafe that delivers an elegant customer experience while providing an enterprise-grade operational platform for internal staff.

This is not a simple company profile website.

The long-term vision includes:

- Public Website
- Reservation System
- Membership
- Loyalty Program
- CMS
- Admin Dashboard
- POS Integration
- Inventory
- Analytics
- Multi-Branch Support
- Mobile Applications

---

## Tech Stack

Monorepo

Turborepo + pnpm

Frontend

Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui

Backend

Go Fiber v3

pgx + sqlc + golang-migrate

Viper + Zap + Argon2id

Database

PostgreSQL

Cache

Redis

Auth

JWT Bearer access token + HTTP-only Secure cookie refresh token

Storage

Local Assets via sync script (Development)

Future:

MinIO / S3

Canonical decisions:

./docs/adr/0001-phase-0-architecture-decisions.md

---

## Applications

apps/

website/

Public website

admin/

Internal dashboard

backend/

REST API

---

## Design Philosophy

Inspired by:

Blue Bottle Coffee

Apple

Aesop

Notion

Typography:

Instrument Serif + Manrope

Minimal.

Elegant.

Premium.

Whitespace-driven.

Canonical design system:

./docs/ai/06_DESIGN_SYSTEM.md

---

## MVP Roles

Customer

Admin

Super Admin

Guest reservations allowed without an account.

---

## Primary Business Domains

Reservation

Membership

Loyalty

CMS

Customer

Menu

Promotion

Gallery

Analytics

---

## Engineering Philosophy

Architecture First.

Business First.

Scalability First.

Maintainability First.

Never optimize for shortcuts.

Always optimize for long-term sustainability.

---

## Git Branches

main — production-ready

develop — integration

Never use master for new work.

---

## Future Scalability

Designed for:

Thousands of users.

Multiple branches.

Future POS.

Inventory.

Kitchen Display System.

Payment Gateway.

Mobile App.

Marketing Automation.
