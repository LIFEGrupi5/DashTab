# DashTab

DashTab is a multi-tenant restaurant operating system — point-of-sale, real-time kitchen display, staff management & scheduling, menu, subscriptions, analytics, and an AI menu-recommendation experience, in one place.

## Features

- **Menu Management** — Categories, items, pricing, images (MinIO) ✅
- **Order Management / POS** — Create and track orders through a status lifecycle (New → Preparing → Ready → Completed/Cancelled) ✅
- **Kitchen Display (KDS)** — Real-time kitchen board over SignalR (RabbitMQ-fed) ✅
- **Staff Management** — Roles (Owner / Manager / Waiter / Kitchen) via Keycloak ✅
- **Staff Scheduling** — Weekly shift builder, rest-day & shift-swap requests, manager approval ✅
- **Restaurant Onboarding** — Self-service restaurant registration + owner account creation ✅
- **Subscriptions** — Stripe-backed plans (Basic/Pro/Enterprise), staff-limit gating, `402` subscription gate ✅
- **Multi-tenancy** — Per-restaurant data isolation (tenant middleware + EF query filters) ✅
- **Analytics & Reporting** — KPI overview, weekly revenue/order reports, revenue forecast, PostHog product analytics + feature-flag A/B testing ✅
- **AI Menu Recommendations** — Public customer page: semantic menu search (pgvector) + an LLM-written recommendation from a free-text craving ✅
- **Inventory & Table Management** — 🗓️ planned

> **Subscription note:** renewal is set app-side on confirm (`UtcNow + 1 month`). Stripe webhooks are not wired, so Stripe-side renewals/cancellations are not tracked automatically.

## Tech Stack

| Layer     | Technology                                                                                  |
|-----------|---------------------------------------------------------------------------------------------|
| Frontend  | Next.js 15, React 19, TypeScript, Tailwind, TanStack Query, Zustand, Framer Motion          |
| Backend   | .NET 10, Clean Architecture, EF Core 9 + PostgreSQL, Mapperly, FluentValidation             |
| Auth      | Keycloak (JWT, httpOnly cookies); Google IdP scaffolded in the realm (placeholder creds)    |
| Payments  | Stripe (subscription checkout; no webhook renewal)                                          |
| AI / ML   | OpenAI (`text-embedding-3-small` + `gpt-4o-mini`), pgvector (HNSW semantic search), Python forecast service |
| Analytics | PostHog (product analytics, feature-flag A/B testing)                                       |
| Infra     | Redis, RabbitMQ, MinIO, Hangfire, Serilog → Loki/Grafana + (optional) Elasticsearch/Kibana  |
| DevOps    | Docker Compose (local) · Kubernetes via Helm (15 charts, namespace `project-05`) · GitHub Actions |
| Security  | Trivy image-scan CI gate, CodeQL SAST, secret scanning, OWASP ZAP DAST, Azure Key Vault, CSP headers |

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

> The AI recommendation feature needs `OpenAI:ApiKey` (backend config). Without it the endpoint **degrades gracefully** to a plain menu listing — it never errors.

## Project Structure

```
DashTab/
├── src/
│   ├── backend/                     # .NET 10 Clean Architecture
│   │   ├── DashTab.Domain/          # Entities, enums (no external deps)
│   │   ├── DashTab.Application/     # Use cases, DTOs, interfaces, validators, mappers
│   │   ├── DashTab.Infrastructure/  # EF Core + Postgres/pgvector, Keycloak, Redis, RabbitMQ, MinIO, Hangfire, OpenAI
│   │   ├── DashTab.API/             # Controllers, SignalR KDS hub, MCP server, middleware
│   │   └── tests/                   # xUnit unit + integration tests (Testcontainers)
│   │
│   └── frontend/                    # Next.js 15 + TypeScript
│       ├── app/(marketing)/         # Public landing, pricing, about, contact
│       ├── app/(auth)/              # Login, register
│       ├── app/(dashboard)/         # Protected app (orders, menu, kitchen, staff, schedule, reports, settings)
│       ├── app/r/[restaurantId]/    # Public AI menu-recommendation page (no auth)
│       ├── app/subscribe/           # Subscription plan selection → Stripe
│       ├── components/              # Reusable UI components
│       ├── hooks/                   # TanStack Query hooks
│       ├── lib/                     # API clients, plans, query keys, experiment/analytics helpers
│       └── stores/                  # Zustand (user + UI; tokens in httpOnly cookies)
│
├── devops/
│   ├── docker/                      # Docker Compose stack + configs
│   ├── helm/                        # 15 Helm charts (apps, Bitnami infra, observability)
│   ├── aiops/                       # AIOps service (Flask): Alertmanager → LLM → Slack triage + revenue forecast
│   └── keycloak/                    # Realm export (imported on startup)
│
├── .github/workflows/               # ci.yml, cd.yml, codeql.yml, dast.yml, secret-scan.yml, release.yml
└── docs/                            # AI development log, architecture docs, session notes
```

## Contributing

- Branch from `development`, PR back to `development`
- `main` is managed by release-please (never push directly)
- Conventional Commits (`feat:`, `fix:`, `chore:`) drive the automated CHANGELOG
- All PRs require the single aggregated **`ci-pass`** check (lint → test → build → Trivy scan)
