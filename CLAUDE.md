# DashTab — Root

DashTab is a multi-tenant restaurant operating system covering POS, payments, real-time kitchen display, staff management & scheduling, analytics, AI menu recommendations, and restaurant onboarding.

## Monorepo Structure

```
src/
  backend/   # .NET 10 Clean Architecture — see src/backend/CLAUDE.md
  frontend/  # Next.js 15 + TypeScript   — see src/frontend/CLAUDE.md
devops/      # Docker, Helm, CI/CD       — see devops/CLAUDE.md
docs/        # Architecture decisions and documentation
```

## Tech Stack

| Layer     | Technology                                                                           |
|-----------|--------------------------------------------------------------------------------------|
| Frontend  | Next.js 15, React 19, TypeScript, Tailwind, TanStack Query, Zustand, Framer Motion   |
| Backend   | .NET 10, Clean Architecture, EF Core 9 + PostgreSQL, Mapperly, FluentValidation      |
| Auth      | Keycloak (JWT, httpOnly cookies), multi-tenant isolation; Google IdP scaffolded in realm (placeholder creds, not in login UI) |
| Payments  | Stripe (subscription plans, checkout flow, staff-limit gating; no webhook renewal)   |
| AI / ML   | OpenAI (`text-embedding-3-small` + `gpt-4o-mini`), pgvector (HNSW semantic search), Python forecast service |
| Analytics | PostHog (product analytics, feature-flag A/B testing)                                |
| Infra     | Redis, RabbitMQ, MinIO, Hangfire, Serilog → Loki/Grafana + (optional) Elasticsearch/Kibana |
| DevOps    | Docker Compose (local) · Kubernetes via Helm (15 charts) · GitHub Actions CI/CD      |
| Security  | Trivy image-scan CI gate, CodeQL SAST, secret scanning, OWASP ZAP DAST, Azure Key Vault (deploy-time secrets), CSP headers |

## Git Conventions

- Branch naming: `feature/<name>`, `fix/<name>`, `chore/<name>`
- PRs target `development` — `main` is the release branch (release-please manages it)
- Conventional Commits drive automated CHANGELOG via release-please
- Keep commits scoped — one logical change per commit
