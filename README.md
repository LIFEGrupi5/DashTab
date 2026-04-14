# DashTab

DashTab is a full-featured restaurant operating system built to handle everything a modern restaurant needs — from point-of-sale and payments to inventory management, staff operations, and real-time analytics.

## Features

- **Point of Sale (POS)** — Fast and intuitive order management for dine-in, takeout, and delivery
- **Payments** — Integrated payment processing with support for multiple payment methods
- **Inventory & Stock** — Track ingredients, set low-stock alerts, and manage suppliers
- **Analytics & Reporting** — Real-time dashboards and reports on sales, revenue, and trends
- **Menu Management** — Create and update menus, categories, modifiers, and pricing
- **Staff Management** — Roles, shifts, and access control for your team
- **Table Management** — Floor plan view with live table status

## Tech Stack

| Layer    | Technology                    |
|----------|-------------------------------|
| Frontend | Next.js, TypeScript           |
| Backend  | .NET (Clean Architecture)     |
| DevOps   | Docker, Kubernetes            |

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
│   └── frontend/                    # Next.js + TypeScript
│       ├── app/                     # App router (pages and layouts)
│       ├── components/              # Reusable UI components
│       ├── hooks/                   # Custom React hooks
│       ├── lib/                     # API clients and utilities
│       ├── types/                   # TypeScript types and interfaces
│       └── styles/                  # Global styles and themes
│
├── devops/
│   ├── docker/                      # Dockerfiles and compose files
│   ├── k8s/
│   │   ├── base/                    # Shared Kubernetes manifests (Kustomize base)
│   │   └── overlays/                # Environment-specific overrides
│   │       ├── dev/
│   │       ├── staging/
│   │       └── prod/
│   ├── ci/                          # CI/CD pipeline configs
│   └── infra/                       # Infrastructure as Code
│
├── tests/
│   ├── backend/
│   │   ├── DashTab.UnitTests/
│   │   └── DashTab.IntegrationTests/
│   └── frontend/
│
└── docs/                            # Architecture decisions and documentation
```

## Contributing

- Branch naming: `feature/<name>`, `fix/<name>`, `chore/<name>`
- Open a PR against `main` with a clear description of the change
- All PRs require passing CI before merge
