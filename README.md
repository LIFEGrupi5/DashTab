# DashTab

DashTab is a full-featured restaurant operating system — point-of-sale, real-time kitchen display, staff management, menu, subscriptions and analytics in one place.

## Features

- **Menu Management** — Categories, items, pricing, images (MinIO) ✅
- **Order Management / POS** — Create and track orders for dine-in/takeout ✅
- **Kitchen Display (KDS)** — Real-time kitchen board over SignalR ✅
- **Staff Management** — Roles (Owner/Manager/Waiter/Kitchen) via Keycloak ✅
- **Restaurant Onboarding** — Self-service restaurant registration + owner account creation ✅
- **Subscriptions** — Stripe-backed plans (Basic/Pro/Enterprise), staff-limit gating, 402 gate ✅
- **Multi-tenancy** — Fully isolated per-restaurant data ✅
- **Analytics & Reporting** — Sales dashboards and revenue charts 🚧
- **Inventory & Table Management** — 🗓️ planned

## Tech Stack

| Layer    | Technology                                                                           |
|----------|--------------------------------------------------------------------------------------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind, TanStack Query, Zustand, Framer Motion  |
| Backend  | .NET 10, Clean Architecture, EF Core 9 + PostgreSQL, Mapperly, FluentValidation      |
| Auth     | Keycloak (JWT, httpOnly cookies, Google OAuth2 SSO)                                  |
| Payments | Stripe (subscription checkout)                                                       |
| Infra    | Redis, RabbitMQ, MinIO, Hangfire, Serilog + Loki/Grafana + Elasticsearch/Kibana      |
| DevOps   | Docker Compose (local) · Kubernetes via Helm (15 charts on project-05) · GitHub Actions |

## Getting Started

```bash
# 1. Copy env template
cp devops/docker/.env.example devops/docker/.env

# 2a. Backend stack only (API + Postgres + Redis + Keycloak + RabbitMQ + MinIO + MailHog)
make up-backend

# 2b. Full stack (+ frontend + nginx on :80)
make up

# 2c. Observability (+ Loki + Grafana + Uptime Kuma)
make up-observability
```

API: `http://localhost:5000/swagger` · Frontend: `http://localhost:3000` · Keycloak admin: `http://localhost:8080/admin` (admin / admin_dev) · MailHog: `http://localhost:8025` · Grafana: `http://localhost:3001` (admin / grafana_dev) · Uptime Kuma: `http://localhost:3002` · RabbitMQ UI: `http://localhost:15672` (dashtab / rabbit_dev)

**Prerequisites:** Docker + Docker Compose, .NET 10 SDK, Node.js 20+. See `src/backend/CLAUDE.md`, `src/frontend/CLAUDE.md`, and `devops/CLAUDE.md` for component-specific details.

## Project Structure

```
DashTab/
├── src/
│   ├── backend/                     # .NET Clean Architecture
│   │   ├── DashTab.Domain/          # Entities, enums
│   │   ├── DashTab.Application/     # Use cases, DTOs, interfaces, validators
│   │   ├── DashTab.Infrastructure/  # DB, Keycloak, Redis, RabbitMQ, MinIO, Hangfire
│   │   └── DashTab.API/             # Controllers, SignalR hub, MCP server, middleware
│   │   └── tests/                   # xUnit unit + integration tests (Testcontainers)
│   │
│   └── frontend/                    # Next.js 15 + TypeScript
│       ├── app/(marketing)/         # Public landing, pricing, about, contact
│       ├── app/(auth)/              # Login, register
│       ├── app/(dashboard)/         # Protected app (orders, menu, kitchen, staff, settings)
│       ├── app/subscribe/           # Subscription plan selection → Stripe
│       ├── components/              # Reusable UI components
│       ├── hooks/                   # TanStack Query hooks
│       ├── lib/                     # API clients, plans, query keys
│       └── stores/                  # Zustand (user + UI; tokens in httpOnly cookies)
│
├── devops/
│   ├── docker/                      # Docker Compose stack + configs
│   ├── helm/                        # 15 Helm charts (backend, frontend, infra, observability)
│   ├── aiops/                       # AIOps triage service (Flask, Alertmanager → LLM → Slack)
│   └── keycloak/                    # Realm export (imported on startup)
│
├── .github/workflows/               # backend-ci.yml, frontend-ci.yml, cd.yml, release.yml
└── docs/                            # AI development log, architecture docs, session notes
```

## Contributing

- Branch from `development`, PR back to `development`
- `main` is managed by release-please (never push directly)
- Conventional Commits (`feat:`, `fix:`, `chore:`) drive the automated CHANGELOG
- All PRs require passing CI (lint → test → build → Trivy scan)
