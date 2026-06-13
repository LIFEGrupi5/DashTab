# DashTab Helm Charts

Per-service Helm charts for deploying the DashTab stack to Kubernetes. Each
service is its **own chart with its own `values.yaml`** and is released
independently — there is no single umbrella chart.

```
devops/helm/
  backend/        hand-written chart (.NET 10 API)            → release dashtab-backend
  frontend/       hand-written chart (Next.js 15)             → release dashtab-frontend
  aiops-triage/   hand-written chart (Flask alert triage)     → release dashtab-aiops-triage
  db-backup/      hand-written CronJob (pg_dump → MinIO)      → release dashtab-db-backup
  postgresql/     wrapper over bitnami/postgresql             → release dashtab-postgresql
  pgbouncer/      wrapper over bitnami/pgbouncer (pools PG)   → release dashtab-pgbouncer
  redis/          wrapper over bitnami/redis                  → release dashtab-redis
  rabbitmq/       wrapper over bitnami/rabbitmq               → release dashtab-rabbitmq
  minio/          wrapper over bitnami/minio                  → release dashtab-minio
  keycloak/       wrapper over bitnami/keycloak (+ realm CM)  → release dashtab-keycloak
  prometheus/     hand-written (Prometheus + Alertmanager)    → release dashtab-prometheus
  grafana/        hand-written (dashboards + datasources)     → release dashtab-grafana
  elasticsearch/  hand-written (X-Pack auth, single-node)     → release dashtab-elasticsearch
  kibana/         hand-written (log search UI)                → release dashtab-kibana
  uptime-kuma/    hand-written (status page)                  → release dashtab-uptime-kuma
```

- **Apps** (`backend`, `frontend`) — we author the templates (Deployment/Service/
  ConfigMap/Secret/Ingress/HPA). Rolling deployment, zero-downtime.
- **Infra** — thin wrappers: a `Chart.yaml` that depends on the Bitnami chart plus
  our own `values.yaml`. We don't hand-write StatefulSets.

## Prerequisites (local minikube)

```bash
minikube start --cpus 4 --memory 8192
minikube addons enable ingress           # nginx ingress controller
minikube addons enable metrics-server    # only if you enable backend autoscaling
```

## Deploy

```bash
# 1. Pull the Bitnami subcharts into each wrapper (run once, and after version bumps)
make helm-deps

# 2. Install/upgrade everything in dependency order (postgres → pgbouncer/keycloak → apps)
make helm-up

# 3. Watch it come up
make helm-status
kubectl get pods -n dashtab

# Reach the app: map the ingress host, then open http://dashtab.local
echo "$(minikube ip) dashtab.local" | sudo tee -a /etc/hosts
```

Tear down with `make helm-down`.

### Why the order matters
`postgresql` must be Ready before `pgbouncer` (dials it) and `keycloak` (uses the
`keycloak` database its initdb script creates). `backend`/`frontend` go last. The
Makefile's `helm-up` already sequences this with `--wait`.

## Routing (replaces the Compose nginx)

One host, `dashtab.local`, split across three ingresses on path prefixes:

| Path     | Service             | Chart    | Notes                                  |
|----------|---------------------|----------|----------------------------------------|
| `/`      | `dashtab-frontend`  | frontend | catch-all                              |
| `/api`   | `dashtab-backend`   | backend  | `/api` prefix stripped via rewrite     |
| `/auth`  | `dashtab-keycloak`  | keycloak | served under `/auth` (httpRelativePath)|

## In-cluster wiring

Because charts are independent, cross-service hostnames live in the consumers'
values (the tradeoff vs. an umbrella chart). Infra service names are pinned via
`fullnameOverride`, so they're stable:

| Service                  | DNS name                | Port |
|--------------------------|-------------------------|------|
| PostgreSQL               | `dashtab-postgresql`    | 5432 |
| PgBouncer (app uses this)| `dashtab-pgbouncer`     | 6432 |
| Redis                    | `dashtab-redis-master`  | 6379 |
| RabbitMQ                 | `dashtab-rabbitmq`      | 5672 |
| MinIO                    | `dashtab-minio`         | 9000 |
| Keycloak                 | `dashtab-keycloak`      | 80   |

The backend connects to **PgBouncer**, not Postgres directly. Keycloak connects
**direct to Postgres** (it manages its own pool; PgBouncer transaction mode can
break it).

## Metrics

Every infra chart enables its Prometheus exporter (`metrics.enabled: true`).
`serviceMonitor.enabled` stays `false`: the project-05 cluster is namespace-admin
only (no permission to install the Prometheus Operator CRDs), so the hand-written
`prometheus` chart scrapes via static/namespace-scoped config instead of
ServiceMonitors.

## ⚠️ Known sharp edges

1. **Bitnami image registry** — Bitnami moved its free Docker Hub images; if a
   pull fails, check the chart's `image.repository` and pin a tag that still
   resolves (or mirror it). This is environment-dependent.
2. **Keycloak issuer mismatch** — the #1 cause of valid-token 401s. The backend's
   `Keycloak__ValidIssuer` must equal the issuer string in the JWT, which is the
   **public** URL clients use: `http://dashtab.local/auth/realms/dashtab`. If you
   change the host or relative path, change both.
3. **Realm import is once-only** — Keycloak imports the realm only into an empty
   DB. To re-import a changed realm, delete the keycloak release + its PVC first.
4. **`NEXT_PUBLIC_*` are build-time** — editing frontend config in the chart won't
   change an already-built image; rebuild with the right build args (CI, Lecture 4).

## Secrets

Dev credentials live in plaintext in `values.yaml` **for local minikube only**.
On the **project-05 cluster this is already solved**: `cd.yml` fetches runtime
secrets from **Azure Key Vault** (`kv-dashtab-p05`) at deploy time and `--set`s
them, and the Bitnami charts auto-generate + keep their own passwords in k8s
Secrets (`resource-policy: keep`). Nothing sensitive is committed.
