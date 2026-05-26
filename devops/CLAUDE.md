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
  k8s/
    base/        # Shared Kustomize manifests — placeholder (.gitkeep)
    overlays/
      dev/       # Dev overrides — placeholder (.gitkeep)
      staging/   # Staging overrides — placeholder (.gitkeep)
      prod/      # Production overrides — placeholder (.gitkeep)
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

**Kubernetes**
- Kustomize pattern: `base/` holds shared config, `overlays/` patches per environment
- Each overlay only overrides what differs (replica count, env vars, ingress host)

**Infrastructure**
- Provision cloud resources (cluster, database, storage) via IaC
