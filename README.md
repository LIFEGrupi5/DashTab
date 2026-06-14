# DashTab

DashTab is a multi-tenant restaurant operating system — point-of-sale, real-time kitchen display, staff management & scheduling, AI-powered menu recommendations, subscriptions, and analytics — built as a production-grade distributed system on .NET 10 and Next.js 15.

Live on Kubernetes: `api.project-05.gjirafa.dev` · `app.project-05.gjirafa.dev`

---

## What's inside

### Core Product

| Area | What's built |
|------|-------------|
| **POS / Orders** | Full order lifecycle (`New → Preparing → Ready → Completed/Cancelled`), paginated order history, per-restaurant tenant isolation |
| **Kitchen Display (KDS)** | Real-time Kanban board — orders flow `POS → RabbitMQ → SignalR hub → kitchen screen` with a Redis backplane for horizontal scale |
| **Menu Management** | Categories, items, pricing, images (MinIO S3). Each item stores a 1536-dim OpenAI embedding for semantic search |
| **Staff Management** | Role-based access (Owner / Manager / Waiter / Kitchen) enforced in Keycloak + JWT, with soft-delete and audit trail |
| **Staff Scheduling** | Weekly shift builder, rest-day & shift-swap requests, manager approval workflow |
| **Restaurant Onboarding** | Self-service registration — creates a Keycloak realm user and provisions a new tenant in one flow |
| **Subscriptions** | Stripe-backed plans (Basic / Pro / Enterprise) with a 402 middleware gate that blocks all protected routes for unsubscribed tenants; staff-limit enforcement per plan |
| **Analytics** | KPI overview, weekly revenue/order comparison, 7-day revenue forecast with 95% confidence bands |
| **AI Recommendations** | Public customer page: free-text craving → OpenAI embedding → pgvector HNSW cosine search → gpt-4o-mini writes a personalised recommendation. Fails soft — no API key returns a plain menu listing, never an error |

### Infrastructure & Ops

**MCP Server** — The backend exposes a Model Context Protocol server at `/mcp` (Streamable HTTP). Three read-only tool groups — `OrderTools`, `MenuTools`, `StaffTools` — let any MCP-compatible AI client query live restaurant data authenticated with the same Keycloak JWT. Auto-discovered via `[McpServerToolType]`.

**AIOps Triage** — A Python Flask service bridges Prometheus alerting to Slack. When Alertmanager fires, it POSTs to `/alert`; the service builds a structured prompt from the alert labels and calls an LLM (Groq `llama-3.3-70b-versatile` by default, swappable to Gemini or Ollama) which writes a triage note — severity, probable root cause, first checks. The raw alert is always posted as fallback if the LLM call fails.

**Revenue Forecast** — The same Python service exposes `/forecast`: it receives 90 days of completed-order revenue from the backend and fits a least-squares model with trend + day-of-week seasonality (6 one-hot features), returning a 7-day horizon with upper/lower confidence bands. Called server-side and surfaced in the overview dashboard.

**Feature Flags** — Two layers: Unleash OSS server-side (gates the `/recommend` endpoint; fails open if Unleash is unreachable) and PostHog client-side (A/B tests on the pricing page with per-variant exposure tracking).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, TanStack Query, Zustand, Framer Motion, Recharts |
| Backend | .NET 10, Clean Architecture (4-layer), EF Core 9 + PostgreSQL 16 + pgvector, Mapperly, FluentValidation |
| Auth | Keycloak 25 (JWT, httpOnly cookies, multi-tenant isolation); Google IdP scaffolded in realm |
| Payments | Stripe (subscription checkout + staff-limit gating; no webhook renewal — period-end set app-side) |
| AI / ML | OpenAI `text-embedding-3-small` + `gpt-4o-mini`, pgvector (HNSW index, 1536-dim), Python forecast service |
| Analytics | PostHog (product analytics, restaurant cohort identification, feature-flag A/B testing) |
| Messaging | RabbitMQ (durable topic exchanges, MessagePack serialisation, kitchen bridge consumer) |
| Realtime | SignalR KDS hub + Redis backplane |
| Storage | MinIO (S3-compatible; bucket bootstrapped on startup) |
| Jobs | Hangfire (PostgreSQL-backed; order confirmation emails, `/hangfire` dashboard Owner-only) |
| Observability | Prometheus → Alertmanager → AIOps → Slack · Serilog → Loki/Grafana · Uptime Kuma · optional ELK |
| Secrets | Azure Key Vault (fetched at deploy time, masked in CI logs); `.NET user-secrets` locally |
| DevOps | Docker Compose (4 profiles, local) · Kubernetes via 15 Helm charts (namespace `project-05`) · GitHub Actions (6 workflows) |
| Security | Trivy (image scan, CRITICAL-blocking) · CodeQL SAST (C#/TS/Python) · TruffleHog + gitleaks · OWASP ZAP DAST (weekly) · CycloneDX SBOMs |

---

## Architecture

```
Browser / MCP client
       │
       ▼
Next.js 15 (App Router) ──── httpOnly cookie auth ──── Keycloak 25
       │
       │  REST + SignalR + /mcp
       ▼
.NET 10 API
  ├── RestaurantContextMiddleware  ← resolves tenant from JWT sub, enforces 402 gate
  ├── REST controllers (11)
  ├── SignalR KDS hub  ──── Redis backplane
  ├── MCP server (/mcp)  ──── 3 tool groups (Orders, Menu, Staff)
  └── Hangfire  ──── PostgreSQL job store
       │
  ┌────┼────────────────┐
  │    │                │
  ▼    ▼                ▼
PostgreSQL   Redis    RabbitMQ
+ pgvector  (cache +  (kitchen
(EF Core 9)  backplane) events)
                          │
                          ▼
                    KitchenBridgeConsumer
                          │
                          ▼
                    SignalR → Kitchen Display

Orders → RabbitMQ → KdsBroadcaster → SignalR hub → KDS (real-time)
Cravings → OpenAI embeddings → pgvector HNSW → gpt-4o-mini → recommendation
Prometheus alerts → Alertmanager → AIOps Flask → LLM → Slack triage
Revenue history → Python least-squares → 7-day forecast with confidence bands
```

**Multi-tenancy** — `RestaurantContextMiddleware` resolves the tenant from the JWT `sub` claim on every request and sets it on `DashTabDbContext`. EF Core global query filters enforce tenant isolation at the ORM layer; no request can ever read another restaurant's data.

**402 Subscription Gate** — all protected routes (`/api/v1/*`) require an active subscription. Unsubscribed or unauthenticated requests get a `402 Payment Required` before hitting any controller. Allowlist: `/auth`, `/subscriptions`, `/public`, `/health`, `/hangfire`.

**Fail-soft AI** — if `OpenAI:ApiKey` is missing or the embeddings/chat call fails for any reason, `RecommendationService` falls back to the top 4 available menu items and returns them without a blurb. The endpoint never throws to the client.

**Clean Architecture** — `API → Infrastructure → Application → Domain`. Domain has zero external dependencies. Service interfaces live in `Application`; implementations in `Infrastructure`. Controllers are thin — no business logic.

---

## Getting Started

```bash
# 1. Copy env template
cp devops/docker/.env.example devops/docker/.env

# 2a. Backend stack only (API + Postgres + Redis + Keycloak + RabbitMQ + MinIO + MailHog)
make up-backend

# 2b. Full stack (+ frontend + nginx on :80)
make up

# 2c. Add observability (Loki + Grafana + Uptime Kuma)
make up-observability

# 2d. Add ELK (Elasticsearch + Kibana — ~3 GB RAM)
make up-elk
```

| Service | URL | Default creds |
|---------|-----|---------------|
| API + Swagger | `http://localhost:5000/swagger` | — |
| Frontend | `http://localhost:3000` | — |
| Keycloak admin | `http://localhost:8080/admin` | admin / admin_dev |
| RabbitMQ UI | `http://localhost:15672` | dashtab / rabbit_dev |
| MinIO console | `http://localhost:9001` | dashtab / minio_dev_password |
| MailHog | `http://localhost:8025` | — |
| Grafana | `http://localhost:3001` | admin / grafana_dev |
| Uptime Kuma | `http://localhost:3002` | set on first run |
| Kibana (elk) | `http://localhost:5601` | elastic / elastic_dev |

**Prerequisites:** Docker + Docker Compose, .NET 10 SDK, Node.js 20+

> AI recommendations require `OpenAI:ApiKey` in backend config. Without it the endpoint degrades gracefully to a plain menu listing.

For component-specific setup see `src/backend/CLAUDE.md`, `src/frontend/CLAUDE.md`, and `devops/CLAUDE.md`.

---

## Project Structure

```
DashTab/
├── src/
│   ├── backend/
│   │   ├── DashTab.Domain/          # Entities, enums — zero external deps
│   │   ├── DashTab.Application/     # Interfaces, DTOs, Mapperly mappers, FluentValidation
│   │   ├── DashTab.Infrastructure/  # EF Core + pgvector, Redis, RabbitMQ, MinIO, Stripe,
│   │   │                            #   OpenAI, Keycloak admin client, Hangfire, MailKit
│   │   ├── DashTab.API/             # 11 controllers, SignalR KDS hub, MCP server (/mcp),
│   │   │                            #   tenant + 402 middleware, Hangfire dashboard
│   │   └── tests/                   # xUnit unit tests + Testcontainers integration tests
│   │
│   └── frontend/
│       ├── app/(marketing)/         # Public landing, pricing (A/B tested), about, contact
│       ├── app/(auth)/              # Login, register
│       ├── app/(dashboard)/         # Orders, menu, kitchen (real-time), staff, schedule,
│       │                            #   analytics, reports, settings (19 pages total)
│       ├── app/r/[restaurantId]/    # Public AI recommendation page (no auth)
│       ├── app/subscribe/           # Stripe checkout + success confirmation
│       ├── hooks/                   # 15 hooks incl. useKdsSignalR (real-time kitchen)
│       ├── lib/                     # Typed API clients, PostHog analytics, experiment helpers
│       └── stores/                  # Zustand (user + UI; tokens in httpOnly cookies)
│
├── devops/
│   ├── docker/                      # Docker Compose (4 profiles) + service configs
│   ├── helm/                        # 15 Helm charts — apps, Bitnami infra, observability
│   ├── aiops/                       # Flask service: Alertmanager webhook → LLM → Slack
│   │                                #   + revenue forecast endpoint
│   └── keycloak/                    # Realm export (auto-imported on startup)
│
├── .github/workflows/
│   ├── ci.yml                       # paths-aware: backend + frontend + aiops, aggregated ci-pass
│   ├── cd.yml                       # build 3 images → Trivy → SBOM → atomic gated deploy
│   ├── secret-scan.yml              # TruffleHog (PRs) + gitleaks full-history (weekly)
│   ├── codeql.yml                   # SAST: C# + TypeScript + Python
│   ├── dast.yml                     # OWASP ZAP baseline (weekly + manual)
│   └── release.yml                  # release-please: version bump + CHANGELOG
│
└── docs/                            # Session notes, AI development log, architecture decisions,
                                     #   security audit, A/B test design, SQL optimisation, MCP integration
```

---

## CI/CD & Security

Every push runs a single aggregated `ci-pass` check — no partial green. The pipeline is paths-aware: only the changed area (backend / frontend / aiops) runs.

**On merge to `development`:**
1. Build three Docker images (`dashtab-backend`, `dashtab-frontend`, `dashtab-aiops-triage`) in parallel
2. Trivy scans each image — CRITICAL findings block the deploy
3. CycloneDX SBOMs uploaded as artifacts
4. Images tagged with immutable `sha-<7-char>` ref
5. Atomic Helm upgrade to `project-05` namespace (manual approval gate via GitHub Environment); auto-rollback on failure
6. Secrets fetched from Azure Key Vault at deploy time — never committed, masked in logs

**Always-on security:**
- TruffleHog scans every PR diff for credentials
- gitleaks scans full repo history weekly
- CodeQL SAST runs on every push (C# / TypeScript / Python)
- OWASP ZAP DAST runs weekly against the live production URL

---

## Contributing

- Branch from `development`, PR back to `development`
- `main` is managed by release-please (never push directly)
- Conventional Commits (`feat:`, `fix:`, `chore:`) drive the automated CHANGELOG
- All PRs require the single aggregated `ci-pass` check (lint → test → build → Trivy scan)
