# DashTab — Root

DashTab is a multi-tenant restaurant operating system covering POS, payments, real-time kitchen display, staff management & scheduling, analytics, AI menu recommendations, and restaurant onboarding. It runs in production on Kubernetes (`project-05` namespace, `api.project-05.gjirafa.dev` / `app.project-05.gjirafa.dev`).

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
| Analytics | PostHog (product analytics, feature-flag A/B testing; pricing page A/B experiment wired) |
| Infra     | Redis (cache + SignalR backplane), RabbitMQ (kitchen events), MinIO (S3 images), Hangfire (background jobs), Serilog → Loki/Grafana + optional ELK |
| AIOps     | Python Flask service: `POST /alert` (Alertmanager → LLM → Slack triage) + `POST /forecast` (least-squares revenue forecast with confidence bands) |
| Feature flags | Unleash OSS server-side (gates `/recommend` endpoint; fails open) + PostHog client-side (A/B experiments) |
| MCP       | MCP server at `/mcp` (Streamable HTTP) — `OrderTools`, `MenuTools`, `StaffTools`; same Keycloak JWT auth as REST |
| DevOps    | Docker Compose (4 profiles, local) · Kubernetes via 15 Helm charts (namespace `project-05`) · GitHub Actions (6 workflows) |
| Security  | Trivy (CRITICAL-blocking image scan), CodeQL SAST (C#/TS/Python), TruffleHog + gitleaks, OWASP ZAP DAST (weekly), CycloneDX SBOMs, Azure Key Vault (deploy-time secrets) |

## Key Architectural Patterns

- **Multi-tenancy** — `RestaurantContextMiddleware` resolves tenant from JWT `sub` on every request; EF Core global query filters enforce isolation at the ORM layer
- **402 Subscription gate** — middleware blocks all protected routes for unsubscribed tenants before hitting any controller; allowlist: `/auth`, `/subscriptions`, `/public`, `/health`, `/hangfire`
- **Fail-soft AI** — missing `OpenAI:ApiKey` or any API error in `RecommendationService` falls back to top 4 menu items; never throws to the client
- **Real-time KDS flow** — `Order created → RabbitMQ → KitchenBridgeConsumer → SignalR KdsHub → kitchen display`
- **AI recommendation flow** — `free-text craving → OpenAI embedding → pgvector HNSW cosine search → gpt-4o-mini blurb`
- **Alert triage flow** — `Prometheus → Alertmanager → AIOps Flask /alert → LLM → Slack`
- **Clean Architecture layers** — `API → Infrastructure → Application → Domain`; Domain has zero external dependencies; controllers are thin

## Git Conventions

- Branch naming: `feature/<name>`, `fix/<name>`, `chore/<name>`
- PRs target `development` — `main` is the release branch (release-please manages it)
- Conventional Commits drive automated CHANGELOG via release-please
- Keep commits scoped — one logical change per commit
