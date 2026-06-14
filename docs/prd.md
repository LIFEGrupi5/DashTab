# DashTab — Product Requirements Document (PRD)

**Rubric:** PM-5 (PRD Section) · M1 · Team: Group 5
**Status:** Living document · Drafted with AI (Claude), critically reviewed by the team

> See also: [`product-definition.md`](./product-definition.md) (problem/users/JTBD), [`architecture.md`](./architecture.md) (system design), [`erd.md`](./erd.md) (data model).

---

## 1. Overview

DashTab is a multi-tenant restaurant operating system (SaaS) covering point-of-sale, real-time kitchen display, staff management & scheduling, analytics, subscription onboarding, and an AI menu recommendation. Each restaurant ("tenant") is fully isolated; an owner self-registers, subscribes via Stripe, and runs their venue end-to-end.

## 2. Goals & success metrics

| Goal | Metric | Target |
|---|---|---|
| Orders reach the kitchen reliably | p95 KDS update latency | < 200 ms |
| Owners get real visibility | Analytics dashboard + forecast adoption | Used weekly by every active owner |
| Self-serve growth | Trial → paid conversion | ≥ 15% |
| Engagement (North Star) | Active staff using orders/KDS per week | Growth WoW |
| AI adds value | AI recommendation requests / fallback rate | ≥ 200/wk, < 10% fallback |

(Full quarterly OKRs: [`okrs-2026.md`](./okrs-2026.md).)

## 3. Functional requirements

### 3.1 Auth & multi-tenancy
- Keycloak-backed login (JWT, httpOnly cookies, Google OAuth2 SSO).
- RBAC roles: Owner, Manager, Waiter, Kitchen.
- Full tenant isolation enforced at the data layer (global query filters + tenant middleware); a 402 gate blocks unsubscribed tenants.

### 3.2 Onboarding & billing
- Owner self-registration creates the tenant + admin user (compensating Keycloak rollback on failure).
- Stripe subscription checkout with plan tiers and staff-limit gating.

### 3.3 Menu
- Category + item CRUD, availability toggle, image upload (MinIO presigned).
- Each item is embedded (OpenAI) for semantic recommendation.

### 3.4 Orders & KDS
- Create orders with line items and a state machine (New → Preparing → Ready → Completed / Cancelled).
- Real-time kitchen display (SignalR + Redis backplane), ordered by priority.

### 3.5 Staff & scheduling
- Staff CRUD (Keycloak-synced), activate/deactivate.
- Weekly shift builder, rest-day modelling, swap/time-off requests with manager approval.

### 3.6 Analytics
- PostHog product analytics, North Star Metric, AARRR funnel, stakeholder `/reports` dashboard.
- ML revenue forecast (NumPy regression) + A/B testing via feature flags.

### 3.7 AI recommendation
- Public, QR-friendly page `/r/{restaurantId}`: a diner types a craving → query embedded → pgvector cosine search (tenant-scoped) → `gpt-4o-mini` writes a recommendation. Graceful degradation when the AI key is absent.

## 4. Non-functional requirements

| Area | Requirement |
|---|---|
| Performance | Redis cache-aside (~7.6× on menu reads); indexed queries; −30–36% first-load JS |
| Reliability | Uptime Kuma + Prometheus/Alertmanager; graceful degradation on Redis/AI failure |
| Security | Keycloak auth, CSP, Trivy/CodeQL/ZAP/secret scanning in CI, Azure Key Vault secrets |
| Observability | Serilog → Loki/ELK + correlation IDs; Grafana dashboards; AIOps alert triage |
| Accessibility | WCAG 2.1 AA, axe audit passing, keyboard navigation |
| Deployability | Docker Compose (local) + Helm on Kubernetes (project-05), CI/CD with gated deploy |

## 5. Out of scope (MVP)

Inventory/stock control, table reservations, native mobile apps, payment-terminal hardware, loyalty programs.

## 6. Risks & assumptions

- **AI cost** — OpenAI usage is metered; mitigated by graceful degradation + spend caps (see [`postmortem-openai-quota-exhausted.md`](./postmortem-openai-quota-exhausted.md)).
- **Stripe lifecycle** — current build handles checkout; webhook-driven renewal sync is a known follow-up (period-end is set app-side on confirm).
- **Single shared AI key** — acceptable at pilot scale; per-tenant keys planned once tenant count grows.

## 7. AI-assisted authoring note

This PRD was drafted with AI assistance and reviewed by the team: the AI produced the structure and first draft from the product context; the team corrected the metrics to match what is actually instrumented (PostHog NSM, Stripe, Uptime Kuma) and flagged the Stripe-webhook limitation explicitly rather than letting the draft overclaim.
