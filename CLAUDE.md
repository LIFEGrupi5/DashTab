# DashTab — Root

DashTab is a restaurant operating system covering POS, payments, real-time kitchen display, staff management, analytics, and multi-tenant restaurant onboarding.

## Monorepo Structure

```
src/
  backend/   # .NET 10 Clean Architecture — see src/backend/CLAUDE.md
  frontend/  # Next.js 15 + TypeScript   — see src/frontend/CLAUDE.md
devops/      # Docker, Helm, CI/CD       — see devops/CLAUDE.md
docs/        # Architecture decisions and documentation
```

## Tech Stack

| Layer    | Technology                                                                           |
|----------|--------------------------------------------------------------------------------------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind, TanStack Query, Zustand, Framer Motion  |
| Backend  | .NET 10, Clean Architecture, EF Core 9 + PostgreSQL, Mapperly, FluentValidation      |
| Auth     | Keycloak (JWT, httpOnly cookies, Google OAuth2 SSO), multi-tenant isolation          |
| Payments | Stripe (subscription plans, checkout flow, staff-limit gating)                       |
| Infra    | Redis, RabbitMQ, MinIO, Hangfire, Serilog → Loki/Grafana + Elasticsearch/Kibana      |
| DevOps   | Docker Compose (local) · Kubernetes via Helm (15 charts) · GitHub Actions CI/CD      |
| Security | Trivy image scanning CI gate, Azure Key Vault (deploy-time secrets), CSP headers     |

## Git Conventions

- Branch naming: `feature/<name>`, `fix/<name>`, `chore/<name>`
- PRs target `development` — `main` is the release branch (release-please manages it)
- Conventional Commits drive automated CHANGELOG via release-please
- Keep commits scoped — one logical change per commit
