# DashTab

DashTab is a full-featured restaurant operating system built to handle everything a modern restaurant needs — from point-of-sale and payments to inventory management, staff operations, and real-time analytics.

## Features

DashTab is under active development. Status reflects what is wired end-to-end today.

- **Menu Management** — Categories, items, and pricing ✅ implemented
- **Order Management / POS** — Create and track orders for dine-in/takeout ✅ implemented
- **Kitchen Display (KDS)** — Real-time kitchen board over SignalR ✅ implemented
- **Staff Management** — Roles and access control (Owner / Manager / Kitchen) via Keycloak ✅ implemented
- **Analytics & Reporting** — Dashboards on sales, revenue, and trends 🚧 in progress
- **Payments** — Integrated payment processing 🗓️ planned
- **Inventory & Stock** — Ingredient tracking, low-stock alerts, suppliers 🗓️ planned
- **Table Management** — Floor plan with live table status 🗓️ planned

## Tech Stack

| Layer    | Technology                                                                 |
|----------|----------------------------------------------------------------------------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind, React Query, Zustand, SignalR  |
| Backend  | .NET 10, Clean Architecture, EF Core 9 + PostgreSQL, MediatR, Mapperly     |
| Auth     | Keycloak (OAuth2 / JWT)                                                     |
| Infra    | Redis, RabbitMQ, MinIO, Hangfire, Serilog + Loki/Grafana                    |
| DevOps   | Docker / docker-compose; Kubernetes (Kustomize) planned                    |

## Getting Started

The fastest path is Docker — it brings up the API and all its dependencies.

```bash
# 1. Configure environment (copy and fill in secrets)
cp devops/docker/.env.example devops/docker/.env   # if an example exists; otherwise create .env

# 2. Start the backend stack (API + Postgres + Redis + Keycloak + RabbitMQ + MinIO + MailHog)
cd devops/docker
docker compose --profile backend up

# …or the full stack (adds frontend + nginx + observability), reachable on http://localhost
docker compose --profile full up
```

API: `http://localhost:5000` · Frontend (full profile): `http://localhost:3000` · Keycloak: `http://localhost:8080`

### Running services individually

```bash
# Backend (.NET 10) — set the DB connection string via user secrets first (see src/backend/CLAUDE.md)
cd src/backend/DashTab.API && dotnet run        # http://localhost:5000

# Frontend (Next.js 15)
cd src/frontend && npm install && npm run dev    # http://localhost:3000
```

**Prerequisites:** Docker + Docker Compose, .NET 10 SDK, Node.js 20+. See `src/backend/CLAUDE.md`,
`src/frontend/CLAUDE.md`, and `devops/CLAUDE.md` for component-specific details.

## Project Structure

```
DashTab/
├── src/
│   ├── backend/                     # .NET Clean Architecture
│   │   ├── DashTab.Domain/          # Entities, value objects, domain logic
│   │   ├── DashTab.Application/     # Use cases, DTOs, interfaces
│   │   ├── DashTab.Infrastructure/  # Database, external services
│   │   └── DashTab.API/             # REST API, controllers, middleware
│   │
│   │   └── tests/                   # DashTab.UnitTests, DashTab.IntegrationTests
│   │
│   └── frontend/                    # Next.js + TypeScript
│       ├── app/                     # App router (pages and layouts)
│       ├── components/              # Reusable UI components
│       ├── hooks/                   # Custom React hooks
│       ├── lib/                     # API clients and utilities
│       ├── stores/                  # Zustand client-state store
│       ├── types/                   # TypeScript types and interfaces
│       ├── styles/                  # Global styles and themes
│       └── tests/                   # Jest/RTL unit + Playwright e2e tests
│
├── devops/
│   ├── docker/                      # Dockerfiles and docker-compose stack
│   ├── keycloak/                    # Realm export imported on startup
│   ├── k8s/                         # Kustomize base + overlays (planned)
│   ├── ci/                          # Placeholder — pipelines live in .github/workflows/
│   └── infra/                       # Infrastructure as Code (planned)
│
├── .github/workflows/              # CI: backend-ci.yml, frontend-ci.yml
└── docs/                            # Architecture decisions and documentation
```

## Contributing

- Branch naming: `feature/<name>`, `fix/<name>`, `chore/<name>`
- Open a PR against `main` with a clear description of the change
- All PRs require passing CI before merge
