# ============================================================================
# 7Oz Espresso Cafe Digital Platform
# Technology Stack
# ============================================================================

Version         : 1.0.0
Status          : FINAL
File            : ./docs/ai/03_TECH_STACK.md
Owner           : Engineering Team
Audience        : AI Agents & Developers
Last Updated    : 2026-07-29

Dependencies:
- 00_MASTER_PROMPT.md
- 01_PROJECT_CONTEXT.md
- 02_PRODUCT_REQUIREMENTS.md

---

# 1. Purpose

This document defines the official technology stack used throughout the 7Oz Espresso Cafe Digital Platform.

All applications, shared packages, tools, libraries, and infrastructure decisions must follow this document unless a newer version explicitly supersedes it.

Accepted architecture decisions that refine this stack are recorded in:

./docs/adr/0001-phase-0-architecture-decisions.md

Rejected alternatives for MVP include:

- Ent ORM
- Atlas
- Koanf
- Zerolog
- bcrypt as the primary password hasher

---

# 2. Technology Selection Principles

Technology decisions are based on:

- Stability
- Long-term maintainability
- Performance
- Security
- Strong ecosystem
- Excellent developer experience
- Active community
- Production readiness

Avoid adopting technologies solely because they are new or trending.

---

# 3. Programming Languages

Frontend

- TypeScript

Backend

- Go

Scripting

- TypeScript
- Bash

Database

- SQL

---

# 4. Monorepo

Package Manager

pnpm

Build System

Turbo

Repository Type

Monorepo

---

# 5. Customer Website

Framework

Next.js

Language

TypeScript

Rendering Strategy

Hybrid Rendering

- Static Generation (SSG)
- Server Components
- Client Components where necessary

Routing

App Router

---

# 6. Admin Dashboard

Framework

Next.js

Language

TypeScript

Rendering Strategy

Client-first with Server Components where appropriate.

Routing

App Router

---

# 7. Backend API

Language

Go

Framework

Fiber v3

Architecture

Clean Architecture

API Style

REST

Validation

Request DTO Validation

Configuration

Environment Variables

---

# 8. Database

Database

PostgreSQL

Migration

golang-migrate

Database Driver

pgx

SQL Strategy

sqlc

Caching

Redis

---

# 9. Authentication

Access Token

JWT

Refresh Token

Opaque Refresh Token

Password Hashing

Argon2id

Authorization

Role-Based Access Control (RBAC) with Permission-based Authorization

---

# 10. Storage

Current Phase

Local Storage

Future

S3-Compatible Object Storage

All storage access must go through an abstraction layer.

---

# 11. Frontend Libraries

State Management

Zustand

Server State

TanStack Query

Forms

React Hook Form

Validation

Zod

Table

TanStack Table

Charts

Recharts

Date Handling

date-fns

HTTP Client

Axios

Icons

Lucide React

---

# 12. UI Framework

Component Library

shadcn/ui

Styling

Tailwind CSS

Variant Management

class-variance-authority

Class Utilities

clsx

tailwind-merge

Animation

Framer Motion

---

# 13. Backend Libraries

Configuration

Viper

Logging

Zap

UUID

google/uuid

Password Hashing

argon2id

Validation

go-playground/validator

---

# 14. API Documentation

Standard

OpenAPI 3.1

Documentation

Swagger UI

---

# 15. Testing

Frontend

Vitest

React Testing Library

Backend

Go Testing Package

Integration Testing

API Testing

Playwright

---

# 16. Code Quality

Formatting

Prettier

Linting

ESLint

Go Formatting

gofmt

Go Linting

golangci-lint

Commit Standard

Conventional Commits

---

# 17. CI/CD

Version Control

Git

Repository

GitHub

CI

GitHub Actions

Deployment Target

Ubuntu VPS

Reverse Proxy

Nginx

Containerization

Docker

Future

Docker Compose

---

# 18. Monitoring

Application Logs

Structured JSON Logs

Health Check

Dedicated Endpoint

Future

Prometheus

Grafana

Sentry

---

# 19. Development Environment

Operating System

Windows (Development)

Linux Ubuntu LTS (Production)

Node.js

Active LTS Version

Go

Latest Stable Version Supported by Project

PostgreSQL

Latest Stable Version Supported by Project

Redis

Latest Stable Version Supported by Project

---

# 20. AI Development Rules

AI agents must:

- Reuse existing libraries.
- Avoid introducing alternative libraries without approval.
- Follow this technology stack consistently.
- Never replace a technology with another equivalent library unless explicitly instructed.

---

# 21. Approved Technology Summary

Frontend

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Zustand
- TanStack Query
- React Hook Form
- Zod

Backend

- Go
- Fiber
- pgx
- sqlc
- PostgreSQL
- Redis

Infrastructure

- Docker
- Nginx
- Ubuntu VPS
- GitHub Actions

---

# End of Document