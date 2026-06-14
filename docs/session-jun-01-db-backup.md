# Session — June 1, 2026: Database Backups (pg_dump → MinIO)

Added an automated PostgreSQL backup to the project-05 deployment: a scheduled
Kubernetes CronJob that dumps the `dashtab` database and stores the gzipped dump
in the in-cluster MinIO. Built as a hand-written Helm chart (`devops/helm/db-backup`)
to match the rest of the deploy model, hardened to the same non-root standard as
the app charts, and using a least-privilege MinIO key rather than admin creds.

## Why / scope

DashTab had **no backup of any kind** — a bad migration or an accidental delete
would be unrecoverable. This closes that gap.

Honest framing: the data here is demo/seed data, so this isn't about protecting
precious records — it's about **learning and demonstrating the production backup
pattern**, and giving the project a real safety net against the *common* failures
(bad migration, fat-fingered delete). It is deliberately **not** full disaster
recovery: the dumps land in the in-cluster MinIO, which shares a failure domain
with the database (lose the namespace/cluster → lose both). Real DR would push to
storage *outside* the cluster (see "Going further").

## What we built

A Helm chart `devops/helm/db-backup/` with:

```
Chart.yaml
values.yaml                      # schedule, retention, source DB, MinIO target, images, resources
values-project05.yaml            # per-env overlay (schedule/retention)
files/minio-backup-policy.json   # least-privilege S3 policy for the one-time setup
templates/_helpers.tpl           # name/labels helpers (same idiom as backend/frontend charts)
templates/cronjob.yaml           # the backup CronJob
templates/NOTES.txt              # setup + verify + restore instructions
```

The CronJob runs daily at 02:00, keeps the 7 newest dumps, and prunes the rest.

## Design decisions

### 1. Target: in-cluster MinIO (not a PVC, not external — yet)

Three options were on the table:
- **PVC** — simplest, but less realistic and still same-failure-domain.
- **In-cluster MinIO** — reuses the MinIO already deployed; demonstrates the real
  "dump → object storage (S3)" pattern. Chosen.
- **External S3** (Cloudflare R2 / DO Spaces) — the only real-DR option, but adds an
  external dependency. Deferred; the chart makes switching to it a values change.

### 2. Tooling: two official images in one pod (not a custom image, not `curl | sh`)

The backup needs **two** tools that don't ship together: `pg_dump` (in the
`postgres` image) and the `mc` MinIO client (in the `minio/mc` image). Options:

- **Runtime install** — `postgres:alpine` + `apk add` + download `mc` at startup.
  Works, but needs root and pulls an unpinned binary at runtime (supply-chain risk).
- **Custom image** — bake both into one image. Cleanest at runtime, but needs a
  Dockerfile + CI build/push.
- **Two official images in one pod** — an **initContainer** (`postgres`) does the
  dump, then the main container (`minio/mc`) uploads. Chosen.

The key insight: **initContainers run to completion before the main container
starts**, so the dump → upload sequence is guaranteed without a custom image, a
runtime download, or root. Each container uses the exact tool its official image
already ships. The two share the dump through an `emptyDir` volume.

### 3. Credentials: a scoped, least-privilege MinIO key (not admin creds)

The CronJob does **not** use the MinIO root/admin credentials. A one-time setup
creates a dedicated user `dashtab-backup` with a policy
(`files/minio-backup-policy.json`) that allows only object read/write/delete +
list on the `db-backups` bucket — nothing else. If the backup pod were ever
compromised, the blast radius is one bucket, not all of object storage.

### 4. Hardened, non-root pods

Both containers run `runAsNonRoot` (uid 1001), `readOnlyRootFilesystem: true`,
`allowPrivilegeEscalation: false`, all capabilities dropped, `seccompProfile:
RuntimeDefault` — the same standard as the app charts. Writes go only to two
`emptyDir` volumes (`/work` for the dump handoff, `/tmp` for scratch + mc config);
`fsGroup: 1001` makes those volumes writable by the non-root user.

### 5. Integrity: dump to a file, then ship — not `pg_dump | gzip | upload`

A naive `pg_dump | gzip | mc pipe` would, if `pg_dump` failed mid-stream, upload a
**truncated dump that looks successful**. Instead the initContainer dumps to a
file (`set -e` catches a failed dump), gzips it, and only then does the main
container upload the finished artifact. A backup that silently isn't a backup is
worse than no backup.

## The one-time setup

The chart manages only the *recurring* job. The MinIO bucket + scoped key are a
one-time bootstrap (needs admin creds once), done via a short-lived Job that reads
the root creds from the existing `dashtab-minio` secret and the scoped creds from
a freshly-created `dashtab-minio-backup` secret:

1. `kubectl create secret generic dashtab-minio-backup` with a random secret key.
2. A setup Job runs `mc admin`: create bucket `db-backups`, create policy
   `db-backups-rw` (from the policy ConfigMap), add user `dashtab-backup`, attach
   the policy.

This stays a manual one-time step (not a Helm hook) on purpose: it's a bootstrap,
not something to re-run on every `helm upgrade`, and it needs admin creds the
recurring job shouldn't have.

## How to operate

```bash
# install / upgrade
helm upgrade --install dashtab-db-backup devops/helm/db-backup \
  -n project-05 -f devops/helm/db-backup/values-project05.yaml

# run a backup now (instead of waiting for 02:00)
kubectl create job --from=cronjob/dashtab-db-backup manual-1 -n project-05
kubectl logs -f job/manual-1 -n project-05 --all-containers=true --prefix

# restore a dump
mc cat store/db-backups/<file>.sql.gz | gunzip \
  | psql -h dashtab-postgresql -U dashtab -d dashtab
```

## How we validated

Before applying anything: `helm lint`, `helm template` (renders), and
`kubectl apply --dry-run=server` against the live cluster — the server dry-run
runs real admission (including **PodSecurity**), so it confirms the hardened spec
is accepted without creating anything. We also detected the cluster's PodSecurity
level (baseline — root allowed) and its CNI/storage details by querying the live
namespace, so the manifest used the real service/secret names rather than guesses.

The first manual run succeeded: `pg-dump` produced `/work/backup.sql.gz`, `upload`
pushed it to `store/db-backups/dashtab-<ts>.sql.gz`, and `mc ls` confirmed the
object in the bucket.

## Going further (not done)

- **Real DR**: set `minio.endpoint` to an external S3 bucket (Cloudflare R2 has a
  10 GB free tier with no egress fees; DO Spaces works with credits) and swap
  `minio.credentialsSecret`. Nothing else in the chart changes.
- **Restore drill**: periodically test that a dump actually restores — an untested
  backup is a hope, not a backup.
- **Pin `postgres:17-alpine` by digest** (mc is already digest-pinned).

## Lessons learned

1. **initContainers are a clean way to sequence "tool A then tool B" without a
   custom image.** When two steps need two different toolchains, an initContainer
   (step 1) + main container (step 2) sharing an `emptyDir` runs them in order
   using stock official images — no Dockerfile, no CI build, no runtime download.

2. **A streamed backup can lie.** `pg_dump | gzip | upload` will happily upload a
   truncated object if the dump fails partway, because the pipe's exit status is
   the last command's. Dump to a file first so a failure is caught before anything
   is shipped.

3. **Least privilege is cheap here.** Creating a scoped MinIO user took one extra
   setup step and shrank a compromise from "all object storage" to "one bucket."
   The recurring job never touches admin creds.

4. **Root-in-container isn't the only risk — and often not the biggest.** When we
   first considered a root pod, the real concerns were the *unpinned runtime
   binary download* and *holding admin creds*, more than root itself. The two-image
   design removed all three (non-root, pinned images, scoped key).

5. **`--dry-run=server` validates more than syntax.** It runs admission controllers,
   so it tells you up front whether PodSecurity will accept a hardened spec —
   without creating a thing. Pair it with `helm lint`/`helm template` for a full
   pre-flight.

6. **Match the deploy model.** The backup started as a standalone `kubectl apply`
   manifest, but everything else deploys via Helm — so it became a chart with
   values + an env overlay. Consistency beats a one-off, even for a single resource.

7. **Backups protect against more than disaster.** Even same-failure-domain backups
   (dump sitting next to the DB) are worth having: the *common* loss is a bad
   migration or an accidental delete, not a cluster going up in smoke. DR is a
   separate, stronger goal — don't skip the cheap safety net while waiting for it.
