# DevOps

## Structure

```
devops/
  docker/        # Local full-stack orchestration
    docker-compose.yml   # Profiles: backend, full, observability, elk
    nginx/               # Reverse-proxy config (full profile)
    postgres/            # init.sql bootstrap
    grafana/ loki/ promtail/ elk/  # Observability stack configs
  keycloak/      # realm-export.json (imported on Keycloak startup)
  helm/          # 15 Helm charts deployed to project-05 namespace
    backend/ frontend/        # Hand-written app charts (HPA, NetworkPolicy, PDB, ingress)
    aiops-triage/             # AIOps Flask service chart
    db-backup/                # CronJob: pg_dump → MinIO
    uptime-kuma/              # Uptime monitoring + status page
    prometheus/ grafana/      # Metrics + dashboards
    elasticsearch/ kibana/    # Centralised log aggregation
    postgresql/ pgbouncer/ redis/ rabbitmq/ minio/ keycloak/  # Bitnami wrappers
  aiops/         # AIOps triage service (Flask webhook → Groq LLM → Slack)
```

> CI/CD pipelines live in **`.github/workflows/`**.

## Current State

Everything is deployed and running on the shared AKS cluster (`life-cluster`, namespace `project-05`). Local Docker Compose is also fully working.

Production URLs: `api.project-05.gjirafa.dev` · `app.project-05.gjirafa.dev` · `auth.project-05.gjirafa.dev` · `grafana.project-05.gjirafa.dev` · `kibana.project-05.gjirafa.dev`

### Compose profiles

| Profile | Command | Brings up |
|---------|---------|-----------|
| `backend` | `make up-backend` | postgres, redis, keycloak, rabbitmq, minio, mailhog, backend |
| `full` | `make up` | everything in `backend` + frontend + nginx |
| `observability` | `make up-observability` | loki, promtail, grafana, uptime-kuma |
| `elk` | `make up-elk` | elasticsearch, logstash, kibana, filebeat (heavy, ~3GB RAM) |

### Services & default ports (local)

| Service | Port(s) | Notes |
|---------|---------|-------|
| postgres | 5432 | shared by app + Keycloak |
| redis | 6379 | cache + SignalR backplane |
| keycloak | 8080 | realm `dashtab`; admin at `/admin/` (admin / admin_dev) |
| rabbitmq | 5672 / 15672 | broker + management UI (dashtab / rabbit_dev) |
| minio | 9000 / 9001 | S3 storage + console (dashtab / minio_dev_password) |
| mailhog | 1025 / 8025 | dev SMTP catcher + UI |
| backend | 5000 | .NET 10 API + `/swagger` |
| frontend | 3000 | Next.js app |
| nginx | 80 | reverse proxy (full profile) |
| grafana | 3001 | dashboards (admin / grafana_dev) |
| loki | 3100 | log ingestion |
| uptime-kuma | 3002 | uptime monitoring (admin account set on first run) |
| kibana | 5601 | log search UI (elastic / elastic_dev) — elk profile |
| elasticsearch | 9200 | log storage — elk profile |

### Helm (Kubernetes)

All charts are in `devops/helm/`. The `make helm-*` targets deploy to a **local
minikube** (namespace `dashtab`); the **project-05 cluster** is deployed only by
`cd.yml` (with `values-project05.yaml` + Key Vault secrets). Local commands:
```bash
# Lint all charts
make helm-lint

# Deploy infra + app charts
make helm-up

# Deploy observability charts (prometheus, grafana, elk, uptime-kuma)
make helm-up-obs

# Check what's running
make helm-status
```

Secrets are injected at deploy time from **Azure Key Vault** (`kv-dashtab-p05`) — never committed to git. See `cd.yml` for the fetch pattern.

### CI/CD (`.github/workflows/`)

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | push/PR (paths-aware) | one workflow: backend (build+test), frontend (lint+build+unit+e2e+Lighthouse), aiops (lint+test+docker) run only when that area changed, aggregated into a single required **`ci-pass`** check |
| `cd.yml` | push to `development` or `v*` tag | build 3 images → Trivy scan + SBOM → **atomic** gated deploy to project-05 |
| `secret-scan.yml` | PR + weekly | TruffleHog (PR diff) + gitleaks & full-history (scheduled) + Trivy `fs`→SARIF |
| `codeql.yml` | push + weekly | CodeQL SAST (C# / JS-TS / Python) |
| `dast.yml` | weekly + manual | OWASP ZAP baseline scan of `app.project-05` |
| `release.yml` | push to `development` | release-please: bump version + generate CHANGELOG |

Branch protection on `development` should require the single **`ci-pass`** check.
