# AIOps Alert Triage (DO-12)

A small webhook service that sits between **Alertmanager** and **Slack**. When an
alert fires, it asks an LLM (**Groq** by default in prod; Gemini and Ollama are
also supported — all via one OpenAI-compatible call path) to triage it — likely
root cause, severity, and the first action to take — then posts that analysis to
Slack. It also exposes a small revenue-**forecast** endpoint the backend calls.

```
Prometheus ──> Alertmanager ──webhook──> aiops-triage ──> LLM ──> Slack
   (rules)        (routing)              (this service)   (Groq)  (#alerts)
```

This is the DO-5 alerting chain with an **LLM inserted right before Slack**: the
trigger and destination are the same; the new part is the AI that *writes* the
message at alert-time instead of a static template you wrote in advance.

## Why a service is needed

An LLM can't receive a webhook or post to Slack by itself, and Alertmanager can
only POST its own JSON shape to a URL. This service is the translator:
`receive alert JSON → build a prompt → call the LLM → post the answer to Slack`.
If the LLM call fails it falls back to posting the raw alert, so a Slack alert is
never lost.

## Configuration (env vars)

| Var | Required | Default | Purpose |
|-----|----------|---------|---------|
| `SLACK_WEBHOOK_URL` | for Slack | – | Slack incoming-webhook URL to post to |
| `LLM_PROVIDER` | no | `groq` | `groq` \| `gemini` \| `ollama` |
| `GROQ_API_KEY` | if provider=groq | – | Groq API key |
| `GROQ_MODEL` | no | `llama-3.3-70b-versatile` | Groq model id |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | if provider=gemini | – / `gemini-2.0-flash` | Gemini (via its OpenAI-compatible endpoint) |
| `OLLAMA_API_BASE` / `OLLAMA_MODEL` | if provider=ollama | `http://localhost:11434/v1` / `llama3.2:3b` | self-hosted |
| `WEBHOOK_TOKEN` | no | – | if set, require `Authorization: Bearer <token>` on POST endpoints |
| `HTTP_TIMEOUT` | no | `20` | per-call timeout (s) |
| `PORT` | no | `8080` | Listen port |

Endpoints: `POST /alert` (Alertmanager webhook) · `POST /forecast` (revenue forecast, called by the backend) · `GET /healthz` (probe).

## Run locally

```bash
cd devops/aiops
docker build -t dashtab-aiops .
docker run --rm -p 8080:8080 \
  -e GEMINI_API_KEY="$GEMINI_API_KEY" \
  -e SLACK_WEBHOOK_URL="$SLACK_WEBHOOK_URL" \
  dashtab-aiops

# In another terminal — send a sample Alertmanager payload:
curl -X POST localhost:8080/alert \
  -H 'Content-Type: application/json' \
  --data @sample-alert.json
```

A triaged message should land in your Slack `#alerts` channel within a couple of
seconds. (Omitting the keys still returns `200` — it exercises the raw fallback.)

## Deploy to project-05

The image is built and pushed by `.github/workflows/cd.yml` (job
`build-aiops` → `ghcr.io/lifegrupi5/dashtab-aiops-triage`) and deployed by the
gated `deploy` job. Secrets come from the **project-05 GitHub Environment** —
add `GROQ_API_KEY` and `SLACK_WEBHOOK_URL` there.

Manual deploy (same as the pipeline):

```bash
helm upgrade --install dashtab-aiops-triage devops/helm/aiops-triage \
  -n project-05 -f devops/helm/aiops-triage/values-project05.yaml \
  --set image.tag=latest \
  --set secret.GROQ_API_KEY="$GROQ_API_KEY" \
  --set secret.SLACK_WEBHOOK_URL="$SLACK_WEBHOOK_URL"
```

Alertmanager already routes to it — see `devops/helm/prometheus/files/alertmanager.yml`
(`receiver: aiops` → `webhook_configs` → `http://dashtab-aiops-triage:8080/alert`).

## Demo: fire a *real* alert

The deliverable requires a real firing alert, not just a synthetic POST. The
`PostgresDown` / `TargetDown` rules fire when an exporter goes unreachable, so
scale PostgreSQL to zero for a few minutes:

```bash
# 1. Watch the triage service logs
kubectl -n project-05 logs -f deploy/dashtab-aiops-triage

# 2. Take Postgres down (in another terminal)
kubectl -n project-05 scale statefulset/dashtab-postgresql --replicas=0

# 3. Wait ~2-3 min. TargetDown (up==0) fires after 2m, PostgresDown after 1m.
#    Alertmanager POSTs to the triage service → Gemini → an AI triage note
#    appears in Slack #alerts.

# 4. Restore
kubectl -n project-05 scale statefulset/dashtab-postgresql --replicas=1
```

> Tip: lower `group_wait` / `repeat_interval` in `alertmanager.yml` temporarily if
> you don't want to wait for the grouping window during a live demo.

For a faster sanity check without touching infra, port-forward the service and
POST `sample-alert.json` to `/alert` (this calls the real Gemini + Slack, just
without a genuinely-firing rule):

```bash
kubectl -n project-05 port-forward deploy/dashtab-aiops-triage 8080:8080
curl -X POST localhost:8080/alert -H 'Content-Type: application/json' --data @sample-alert.json
```
