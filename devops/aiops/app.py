"""DashTab AIOps service (DO-12).

Two stateless endpoints:
  • POST /alert     — Alertmanager webhook. For each firing alert we ask an LLM to
                      triage it (severity, likely cause, first checks) and post the
                      result to Slack. If the LLM fails we still post the raw alert,
                      so an AI-layer outage never swallows a real alert.
  • POST /forecast  — least-squares revenue forecast (trend + day-of-week
                      seasonality) over a restaurant's daily history sent by the
                      backend. NumPy only — no scipy/scikit (clean musllinux wheels).

Flow:  Prometheus → Alertmanager → /alert → LLM → Slack

LLM providers (LLM_PROVIDER = groq | gemini | ollama) all speak the OpenAI-compatible
/chat/completions API — Gemini via its /v1beta/openai endpoint — so they share one
call path and adding a provider is a single table entry.

Optional auth: set WEBHOOK_TOKEN to require `Authorization: Bearer <token>` on the
POST endpoints (the Alertmanager http_config and the backend forecast caller must
then send it). Unset = open (the service is ClusterIP-only); a warning is logged.
"""
import logging
import os
from datetime import datetime, timedelta
from functools import wraps

import numpy as np
import requests
from flask import Flask, jsonify, request

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("aiops")

app = Flask(__name__)

# ── Config (env) ──────────────────────────────────────────────────────────────
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "groq").lower()
SLACK_WEBHOOK_URL = os.getenv("SLACK_WEBHOOK_URL", "")
WEBHOOK_TOKEN = os.getenv("WEBHOOK_TOKEN", "")
HTTP_TIMEOUT = float(os.getenv("HTTP_TIMEOUT", "20"))

# Each provider is an OpenAI-compatible endpoint: (base_url, model, api_key).
_PROVIDERS = {
    "groq": (
        os.getenv("GROQ_API_BASE", "https://api.groq.com/openai/v1"),
        os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
        os.getenv("GROQ_API_KEY", ""),
    ),
    "gemini": (
        os.getenv("GEMINI_API_BASE", "https://generativelanguage.googleapis.com/v1beta/openai"),
        os.getenv("GEMINI_MODEL", "gemini-2.0-flash"),
        os.getenv("GEMINI_API_KEY", ""),
    ),
    "ollama": (
        os.getenv("OLLAMA_API_BASE", "http://localhost:11434/v1"),
        os.getenv("OLLAMA_MODEL", "llama3.2:3b"),
        "",  # local, no key
    ),
}

# Forecast model bounds.
MIN_HISTORY_DAYS = 5
MAX_HORIZON_DAYS = 31

_WEEKDAY_ABBR = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

PROMPT_TEMPLATE = """You are an SRE on-call assistant for the DashTab platform \
(a restaurant OS: .NET API, Next.js, PostgreSQL, Redis, RabbitMQ, Keycloak, \
running on Kubernetes namespace project-05).

A monitoring alert just fired. Write a concise Slack triage note (under 120 words):
1. One line: severity + what is broken in plain language.
2. Most likely root cause, reasoned from the labels/annotations below.
3. The first 1-2 concrete commands or checks to run (kubectl/psql/etc.).
Be specific to the data given. Do not invent metrics that are not present.

Alert:
- name: {alertname}
- status: {status}
- severity: {severity}
- job: {job}
- instance: {instance}
- summary: {summary}
- description: {description}
"""

if not WEBHOOK_TOKEN:
    log.warning("WEBHOOK_TOKEN not set — /alert and /forecast accept unauthenticated requests")


def require_token(fn):
    """Bearer-token guard. No-op unless WEBHOOK_TOKEN is configured."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if WEBHOOK_TOKEN and request.headers.get("Authorization") != f"Bearer {WEBHOOK_TOKEN}":
            return jsonify({"error": "unauthorized"}), 401
        return fn(*args, **kwargs)
    return wrapper


def build_prompt(alert: dict) -> str:
    labels = alert.get("labels", {})
    ann = alert.get("annotations", {})
    return PROMPT_TEMPLATE.format(
        alertname=labels.get("alertname", "unknown"),
        status=alert.get("status", "firing"),
        severity=labels.get("severity", "n/a"),
        job=labels.get("job", "n/a"),
        instance=labels.get("instance", "n/a"),
        summary=ann.get("summary", ""),
        description=ann.get("description", ""),
    )


def call_llm(prompt: str) -> str:
    """Call the configured provider's OpenAI-compatible /chat/completions."""
    try:
        base, model, api_key = _PROVIDERS[LLM_PROVIDER]
    except KeyError as e:
        raise ValueError(f"unsupported LLM_PROVIDER: {LLM_PROVIDER}") from e

    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    resp = requests.post(
        f"{base}/chat/completions",
        headers=headers,
        json={"model": model, "messages": [{"role": "user", "content": prompt}]},
        timeout=HTTP_TIMEOUT,
    )
    if not resp.ok:
        # The API key only ever travels in the Authorization header, never the body.
        raise RuntimeError(f"LLM API {resp.status_code}: {resp.text[:300]}")
    return resp.json()["choices"][0]["message"]["content"].strip()


def post_to_slack(text: str) -> None:
    if not SLACK_WEBHOOK_URL:
        log.warning("SLACK_WEBHOOK_URL not set — skipping Slack post")
        return
    r = requests.post(SLACK_WEBHOOK_URL, json={"text": text}, timeout=HTTP_TIMEOUT)
    r.raise_for_status()


def raw_fallback(alert: dict) -> str:
    labels = alert.get("labels", {})
    ann = alert.get("annotations", {})
    return (
        f":warning: *[{alert.get('status', 'firing').upper()}] "
        f"{labels.get('alertname', 'alert')}* (triage LLM unavailable)\n"
        f"{ann.get('summary', '')}\n{ann.get('description', '')}"
    )


@app.post("/alert")
@require_token
def alert():
    """Alertmanager webhook receiver. NOTE: a large alert batch makes one LLM call
    per alert sequentially — keep batches small or gunicorn's --timeout may trip."""
    payload = request.get_json(silent=True)
    if payload is None:
        return jsonify({"error": "invalid or missing JSON body"}), 400
    alerts = payload.get("alerts", [])
    log.info("received %d alert(s)", len(alerts))

    posted = 0
    for a in alerts:
        name = a.get("labels", {}).get("alertname", "alert")
        try:
            triage = call_llm(build_prompt(a))
            header = f":rotating_light: *[{a.get('status', 'firing').upper()}] {name}* — AI triage"
            post_to_slack(f"{header}\n{triage}")
            posted += 1
        except Exception:  # noqa: BLE001 — never let one alert kill the batch
            log.exception("triage failed for %s", name)
            try:
                post_to_slack(raw_fallback(a))
                posted += 1
            except Exception:  # noqa: BLE001
                log.exception("slack fallback also failed for %s", name)

    return jsonify({"received": len(alerts), "posted": posted}), 200


@app.get("/healthz")
def healthz():
    _, model, _ = _PROVIDERS.get(LLM_PROVIDER, ("", "?", ""))
    return jsonify({"status": "ok", "provider": LLM_PROVIDER, "model": model}), 200


# ── Revenue forecast (ML) ─────────────────────────────────────────────────────
# The backend (which owns the data + tenancy) sends already tenant-scoped daily
# revenue; this service never touches the database.

def _feature_row(index: int, dt: datetime) -> list[float]:
    # [intercept, trend index, Mon..Sat one-hot] — Sunday is the baseline.
    dow = dt.weekday()
    onehot = [1.0 if dow == k else 0.0 for k in range(6)]
    return [1.0, float(index)] + onehot


@app.post("/forecast")
@require_token
def forecast():
    """Revenue forecast.

    Expects: { "history": [{"date": "2026-05-01", "revenue": 1234.5}, ...], "horizon": 7 }
    Returns: { "forecast": [{"date","day","predicted","lower","upper"}], "message": null }
    """
    body = request.get_json(silent=True)
    if body is None:
        return jsonify({"error": "invalid or missing JSON body"}), 400
    history = body.get("history", [])
    try:
        horizon = max(1, min(MAX_HORIZON_DAYS, int(body.get("horizon", 7))))
    except (TypeError, ValueError):
        horizon = 7

    valid = [h for h in history if h.get("date") and h.get("revenue") is not None]
    if len(valid) < MIN_HISTORY_DAYS:
        return jsonify({"forecast": [], "message": "Not enough order history yet to forecast."}), 200

    try:
        valid.sort(key=lambda h: h["date"])
        dates = [datetime.fromisoformat(str(h["date"])[:10]) for h in valid]
        y = np.array([float(h["revenue"]) for h in valid], dtype=float)
        n = len(y)

        X = np.array([_feature_row(i, dates[i]) for i in range(n)])
        beta, *_ = np.linalg.lstsq(X, y, rcond=None)

        resid = y - X @ beta
        std = float(np.sqrt(np.mean(resid**2))) if n > 2 else 0.0
        margin = 1.96 * std  # ~95% band

        last = dates[-1]
        out = []
        for step in range(1, horizon + 1):
            fdate = last + timedelta(days=step)
            row = np.array(_feature_row(n + step - 1, fdate))
            pred = max(0.0, float(row @ beta))
            out.append({
                "date": fdate.strftime("%Y-%m-%d"),
                "day": _WEEKDAY_ABBR[fdate.weekday()],
                "predicted": round(pred, 2),
                "lower": round(max(0.0, pred - margin), 2),
                "upper": round(pred + margin, 2),
            })

        return jsonify({"forecast": out, "message": None}), 200
    except Exception:  # noqa: BLE001 — never 500 the dashboard over a bad series
        log.exception("forecast failed")
        return jsonify({"forecast": [], "message": "Could not compute a forecast."}), 200


if __name__ == "__main__":
    # Dev only; in the container gunicorn serves app:app.
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "8080")))
