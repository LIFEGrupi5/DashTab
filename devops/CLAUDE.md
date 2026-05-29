# DevOps

## Structure

```
devops/
  docker/        # Dockerfiles live next to each service; compose + service configs here
    docker-compose.yml   # Local full-stack orchestration (profiles: backend, full, observability)
    nginx/               # Reverse-proxy config (full profile)
    postgres/            # init.sql bootstrap
    grafana/ loki/ promtail/   # Observability stack config
  keycloak/      # realm-export.json (imported on Keycloak startup)
  helm/          # Per-service Helm charts (see devops/helm/README.md)
    backend/ frontend/        # hand-written app charts (rolling deploy, ingress)
    postgresql/ pgbouncer/ redis/ rabbitmq/ minio/ keycloak/  # Bitnami wrappers
  k8s/
    base/        # Legacy Kustomize placeholder (.gitkeep) — superseded by helm/
    overlays/    # Legacy Kustomize placeholders (.gitkeep)
  ci/            # Placeholder (.gitkeep) — actual pipelines live in /.github/workflows/
  infra/         # Infrastructure as Code (Terraform / Bicep) — not yet populated
```

> CI/CD pipelines live in **`.github/workflows/`** (`backend-ci.yml`, `frontend-ci.yml`),
> not in `devops/ci/`.

## Current State

**Local Docker is fully working.** `devops/docker/docker-compose.yml` orchestrates the
whole stack via profiles. Kubernetes overlays and `infra/` are still empty placeholders.

### Compose profiles

| Profile | Brings up |
|---------|-----------|
| `backend` | postgres, redis, keycloak, rabbitmq, minio, mailhog, backend |
| `full` | everything in `backend` + frontend + nginx + observability |
| `observability` | loki, promtail, grafana |

```bash
cd devops/docker
docker compose --profile backend up        # API + its dependencies
docker compose --profile full up            # full stack behind nginx on :80
```

Environment values come from `devops/docker/.env` (not committed).

### Services & default ports

| Service | Image | Port(s) | Notes |
|---------|-------|---------|-------|
| postgres | postgres:16-alpine | 5432 | shared by app + Keycloak |
| redis | redis:7-alpine | 6379 | cache + SignalR backplane |
| keycloak | keycloak:25.0 | 8080 | realm `dashtab`, local login works; Google IdP needs creds |
| rabbitmq | rabbitmq:3-management | 5672 / 15672 | broker + management UI |
| minio | minio/minio | 9000 / 9001 | S3-compatible storage + console |
| mailhog | mailhog/mailhog | 1025 / 8025 | dev SMTP catcher + UI |
| backend | built from `src/backend` | 5000 | .NET 10 API |
| frontend | built from `src/frontend` | 3000 | Next.js (full profile) |
| nginx | nginx:1.27-alpine | 80 | reverse proxy (full profile) |
| loki / promtail / grafana | grafana stack | 3100 / – / 3001 | logs aggregation + dashboards |

## Intended Setup (not yet built)

**CI/CD** (GitHub Actions, in `.github/workflows/`)
- On PR: lint, test, build for backend and frontend

**Kubernetes (Helm — `devops/helm/`)**
- Per-service charts, each released independently (`make helm-deps` then `make helm-up`)
- Apps (`backend`, `frontend`) are hand-written with rolling deploys + ingress on `dashtab.local`
- Infra (`postgresql`, `pgbouncer`, `redis`, `rabbitmq`, `minio`, `keycloak`) are thin Bitnami wrappers
- Prometheus exporters enabled on infra; `serviceMonitor` off until the Operator lands (Lecture 5)
- Targets local minikube; secrets are dev-only plaintext pending a secret store (Lecture 7)
- The old `k8s/` Kustomize dirs are superseded — left as empty placeholders

**Infrastructure**
- Provision cloud resources (cluster, database, storage) via IaC
