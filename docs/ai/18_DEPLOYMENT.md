# ============================================================================
# 7Oz Espresso Cafe Digital Platform
# Deployment Architecture
# ============================================================================

Version         : 1.0.0
Status          : FINAL
File            : ./docs/ai/18_DEPLOYMENT.md
Owner           : DevOps Team
Audience        : DevOps Engineers, Backend Developers & AI Agents
Last Updated    : 2026-07-29

---

# 1. Purpose

This document defines the deployment architecture, infrastructure, environment strategy, CI/CD pipeline, and operational standards for the 7Oz Espresso Cafe platform.

---

# 2. Deployment Philosophy

Principles:

- Build Once, Deploy Anywhere
- Infrastructure as Code
- Immutable Deployments
- Zero Downtime (where possible)
- Container First

---

# 3. Environment Strategy

The platform uses three environments.

Development

- Local machine
- Docker Compose

Staging

- VPS
- Docker Compose

Production

- VPS
- Docker Compose

Every environment uses the same container images.

---

# 4. Infrastructure Components

Core Services

- Nginx
- Website
- Admin Dashboard
- Backend API
- PostgreSQL
- Redis
- MinIO (future)
- Prometheus
- Grafana
- Loki

---

# 5. Repository Structure

Infrastructure

docker/

Development

docker-compose.dev.yml

Staging

docker-compose.staging.yml

Production

docker-compose.prod.yml

Deployment

scripts/deploy.sh

Database

scripts/migrate.sh

Rollback

scripts/rollback.sh

---

# 6. VPS Directory Layout

/opt/7oz/

├── compose/
├── env/
├── logs/
├── backups/
├── uploads/
├── scripts/
└── monitoring/

---

# 7. Docker Images

Website

ghcr.io/<organization>/7oz-website

Admin

ghcr.io/<organization>/7oz-admin

Backend

ghcr.io/<organization>/7oz-backend

Images must be versioned.

Never deploy :latest.

---

# 8. Reverse Proxy

Nginx responsibilities:

- HTTPS
- Compression
- Caching
- Static Assets
- Reverse Proxy
- Security Headers

---

# 9. HTTPS

Use Let's Encrypt.

Certificates renew automatically.

Redirect HTTP to HTTPS.

Enable HSTS.

---

# 10. Environment Variables

Each application has:

.env.development

.env.staging

.env.production

Never commit secrets.

Use .env.example for documentation.

---

# 11. Database

PostgreSQL

Migration executed before application startup.

Backups:

Daily

Retention:

30 Days

---

# 12. Redis

Used for:

- Cache
- Session
- Rate Limiting
- Background Jobs

Redis is not the source of truth.

---

# 13. Storage

Current:

Local Storage

Future:

MinIO

Cloudflare R2

Amazon S3

Application must access storage through StorageService.

---

# 14. CI/CD Pipeline

Pipeline:

Lint

↓

Format Check

↓

Unit Test

↓

Integration Test

↓

Build

↓

Docker Build

↓

Security Scan

↓

Push Image

↓

Deploy

---

# 15. Deployment Strategy

Deploy order:

1. Database Migration
2. Backend
3. Website
4. Admin Dashboard

Rollback supported.

---

# 16. Health Checks

Every service exposes:

GET /health

GET /ready

GET /live

Containers must define HEALTHCHECK.

---

# 17. Monitoring

Monitor:

- CPU
- Memory
- Disk
- API Latency
- Database Connections
- Error Rate
- Request Rate

---

# 18. Logging

Centralized logging using:

- Loki
- Grafana

Every request includes Request ID.

---

# 19. Backup

Backup:

Database

Uploads

Configuration

Retention configurable.

Regular restore tests required.

---

# 20. Disaster Recovery

Recovery plan includes:

- Database Restore
- Application Redeploy
- DNS Validation
- SSL Validation

Recovery procedures documented.

---

# 21. AI Development Rules

AI agents must:

- Never modify production configuration without approval.
- Keep Dockerfiles minimal.
- Use multi-stage builds.
- Pin dependency versions.
- Avoid unnecessary containers.

---

# 22. Definition of Done

Deployment is complete only if:

✓ Docker builds succeed

✓ Health checks pass

✓ HTTPS active

✓ Monitoring active

✓ Logging active

✓ Backups configured

✓ Rollback tested

✓ CI/CD successful

---

# End of Document