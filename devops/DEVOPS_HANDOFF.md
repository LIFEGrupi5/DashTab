# DashTab DevOps — Handoff / Resume Notes

> Personal working notes for the DevOps coursework (DO-1…DO-13). Pick up here after a break.
> Last updated: 2026-05-28.

---

## 0. START HERE WHEN YOU COME BACK

1. Reconnect kubectl to the cluster:
   ```bash
   export KUBECONFIG=/home/enes/Downloads/kubeconfigs/project-05.kubeconfig
   kubectl config use-context project-05
   kubectl get pods -n project-05        # should connect (empty namespace = fine)
   ```
2. Check git state (see §1). The **ELK Compose work is uncommitted** on `feature/devops/elk-logging`.
3. Next build task = **namespace-scoped Prometheus** (see §5, step 3).

---

## 1. Git state

| Branch | Contains | Status |
|--------|----------|--------|
| `feature/devops/helm-charts` | Per-service Helm charts (DO-3) | committed, pushed, **PR #56** → `development` |
| `chore/docs-refresh` | doc refresh | **PR #55** → `development` (pre-existing) |
| `feature/devops/elk-logging` | **ELK Compose profile (DO-6 local)** | **UNCOMMITTED** — currently checked out |

- Team integrates into **`development`**, NOT `main` (main is stale/frozen). Base all PRs on `development`.
- Convention: **no Claude co-author / attribution** on commits or PR bodies.
- To save the uncommitted ELK work:
  ```bash
  git add -A && git commit -m "feat(devops): add ELK logging stack as on-demand compose profile (DO-6)"
  git push -u origin feature/devops/elk-logging
  ```

---

## 2. Deliverables scorecard (DO-1…DO-13)

| ID | Deliverable | Status | Notes |
|----|-------------|--------|-------|
| DO-1 | Docker Compose full env | ✅ Done | all services present |
| DO-2 | Dockerfiles hardened | 🟡 Partial | frontend ok; **backend runs as root, non-minimal base** |
| DO-3 | Kubernetes via Helm | ✅ Done (charts) | PR #56; not yet deployed to cluster |
| DO-4 | CI/CD pipeline | 🟡 Partial | lint/test/build ok; **push + deploy + notify missing** |
| DO-5 | Prometheus + alerts | ❌ Next | exporters already wired in Helm |
| DO-6 | ELK logging | 🟡 Local done | Compose profile built; in-cluster optional |
| DO-7 | Uptime Kuma | ❌ Missing | smallest item, fast win |
| DO-8 | Terraform (live cloud) | ⚪ **Likely waived** | prof provisioned cluster; confirm (see §6) |
| DO-9 | Security hardening | ❌ Missing | distroless/non-root + Trivy + secret store; overlaps DO-2 |
| DO-10 | Nginx + SSL | 🟡 Partial | nginx exists, no SSL/Let's Encrypt |
| DO-11 | Linux server from scratch | ⬜ Host task | done on a VM, not in repo |
| DO-12 | AIOps pipeline | ❌ Missing | builds on DO-5 alerts |
| DO-13 | Semantic versioning | 🟡 Partial | Conventional Commits ok; no changelog/version tags |

---

## 3. What we BUILT this session

**Helm charts (DO-3)** — `devops/helm/`, per-service (not one umbrella), each own `values.yaml`:
- `backend/`, `frontend/` — hand-written (rolling deploy, ingress, ConfigMap/Secret, HPA)
- `postgresql/`, `pgbouncer/`, `redis/`, `rabbitmq/`, `minio/`, `keycloak/` — Bitnami wrappers
- Prometheus exporters enabled on infra; `serviceMonitor: false` (no operator — see §4)
- `make helm-deps / helm-lint / helm-up / helm-down / helm-status`
- ⚠️ assumes nginx ingress + a default StorageClass — **needs adjusting for the cluster** (see §4)
- ⚠️ probe paths assume backend exposes `/health/live` + `/health/ready` — verify in `DashTab.API`

**ELK (DO-6, local)** — `devops/docker/`, on-demand `elk` Compose profile:
- elasticsearch + logstash + kibana + filebeat; configs in `devops/docker/elk/`
- `make up-elk` / `make down-elk`; needs `sudo sysctl -w vm.max_map_count=262144`
- NOT yet test-run — verify logs land in Kibana (`dashtab-logs-*` data view)

---

## 4. The CLUSTER — what we learned we CAN and CAN'T do

**Target:** shared cluster (`life-cluster` / context `project-05`), Azure-managed endpoint, namespace **`project-05`**, ServiceAccount `project-05-sa`. Kubeconfig: `/home/enes/Downloads/kubeconfigs/project-05.kubeconfig`.

**✅ CAN (namespace-admin in `project-05`):**
- Create any **namespaced** resource: Deployments, StatefulSets, Services, Ingress, PVCs, ConfigMaps, Secrets, Jobs.
- Deploy the whole app + infra + ELK + Prometheus as namespaced workloads.

**❌ CAN'T (not cluster-admin):**
- Install **CRDs / Operators** → **no `kube-prometheus-stack` operator**. Must run plain Prometheus.
- Node-level log collection via **DaemonSet** (no node/cluster access) → use sidecar or app-ships-logs.
- **List cluster-scoped resources** — can't see StorageClasses or IngressClasses (Forbidden).
- Install ingress controllers; monitor across other namespaces.

**Workarounds chosen (to avoid the unknowns):**
- Storage → **`emptyDir`** (ephemeral) for demos; switch to PVC once StorageClass name is known.
- External access → **`kubectl port-forward`**; add Ingress/LoadBalancer once controller is confirmed.

---

## 5. PLAN — what's next, in order

1. *(protective)* Commit the uncommitted ELK work (§1).
2. **Verify local ELK** — `make up-elk`, confirm logs in Kibana → **DO-6 (local) done.**
3. **Build namespace-scoped Prometheus** → **DO-5**. New branch off `development`.
   - Prometheus **Deployment** + ConfigMap (namespace-scoped scrape config) + Role/RoleBinding (read pods/services in `project-05`) + Service. `emptyDir`.
   - Grafana (Deployment + Service + Prometheus datasource).
   - Alertmanager (Deployment + Slack receiver) + 1 meaningful alert rule.
   - Deploy: `helm install ... -n project-05`; access via `kubectl port-forward`.
4. **Deploy the app for real** — app + infra Helm (PR #56) into `project-05` → real "online" DO-3. (adjust storage/ingress per §4)
5. **In-cluster ELK** (optional polish; local already passes DO-6) — sidecar/ship-to-Logstash, no DaemonSet.
6. **AIOps (DO-12)** — webhook → LLM → Slack, fed by DO-5 alerts.
7. **Remaining:** DO-2+DO-9 (harden backend Dockerfile + Trivy + secret store), DO-4+DO-13 (CI push/deploy/notify + versioning), DO-7 (Uptime Kuma, quick), DO-10 (SSL). DO-8 likely waived. DO-11 on a VM.

**Throughline:** DO-5 (Prometheus) feeds DO-12 (AIOps). CI/CD (DO-4) deploys the Helm charts (DO-3) into `project-05`.

---

## 6. Questions to ask the professor

1. **Terraform (DO-8):** fully waived, or still want a small token example (e.g. a bucket)?
2. **StorageClass name?** (needed to switch ELK/Postgres from `emptyDir` to real PVCs)
3. **Ingress / external URL:** is there a shared ingress controller? How do teams expose a service publicly (Ingress class? LoadBalancer? hostname pattern)?

---

## 7. Key decisions made (so you don't re-litigate them)

- **Per-service charts**, not one umbrella (each own `values.yaml`).
- **Single frontend image** (one Next.js app); split only if a separate customer surface appears.
- **PgBouncer** in front of Postgres; backend pools through it, Keycloak direct.
- **Loki stays** (DO-1 requires it) **and** ELK added (DO-6) — both, different line items.
- ELK = **on-demand Compose profile**, not in `full` (it's ~3 GB RAM).
- **Same-cluster observability is fine for grading** — enterprise would separate it; add one sentence acknowledging that in the README.
- Observability needs to be **"online"** (on the cluster) to be meaningful — local is the dev/learning slice.

---

## 8. Mini-glossary (concepts covered)

- **Helm**: templated K8s manifests + `values.yaml`; `helm install/upgrade/rollback`. Cluster only ever sees plain manifests.
- **`_helpers.tpl`**: reusable template snippets (names/labels), not a K8s object.
- **`.PHONY`**: Makefile — "these targets are commands, not files."
- **Rolling deploy**: new pod up + Ready (readiness probe) before old one dies → zero downtime.
- **Observability pillars**: metrics (Prometheus) / logs (ELK or Loki) / uptime (Uptime Kuma, black-box). The monitor lives where the app lives.
- **Operator/CRD**: extends K8s with custom resources; install needs cluster-admin (we don't have it).
