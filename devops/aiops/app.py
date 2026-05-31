"""DashTab AIOps triage service (DO-12).

Sits between Alertmanager and Slack: Alertmanager POSTs firing alerts here via a
`webhook_configs` receiver, we ask an LLM to triage each one (likely root cause,
severity, first action), and we post that analysis to Slack.

Flow:  Prometheus → Alertmanager (webhook) → THIS SERVICE → LLM → Slack

Design notes:
- Provider-agnostic: LLM_PROVIDER selects the backend. Gemini is implemented;
  the call_llm() switch is where you'd add openai/ollama.
- Resilient: if the LLM call fails, we still post the raw alert to Slack so an
  outage of the AI layer never swallows a real alert.
- Stateless + tiny: stdlib + requests + flask only.
"""
import os
import logging
import requests
from flask import Flask, request, jsonify

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("aiops")

app = Flask(__name__)

# ── Config (env) ──────────────────────────────────────────────────────────────
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini").lower()
SLACK_WEBHOOK_URL = os.getenv("SLACK_WEBHOOK_URL", "")

# Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
GEMINI_API_BASE = os.getenv(
    "GEMINI_API_BASE", "https://generativelanguage.googleapis.com/v1beta"
)

# Groq — OpenAI-compatible chat API (free tier, no card, works internationally).
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
GROQ_API_BASE = os.getenv("GROQ_API_BASE", "https://api.groq.com/openai/v1")

# Ollama — also OpenAI-compatible (/v1/chat/completions). Wired now so the
# eventual switch to a self-hosted model is just LLM_PROVIDER=ollama + a base URL.
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:3b")
OLLAMA_API_BASE = os.getenv("OLLAMA_API_BASE", "http://localhost:11434/v1")

HTTP_TIMEOUT = float(os.getenv("HTTP_TIMEOUT", "20"))

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


def call_gemini(prompt: str) -> str:
    url = f"{GEMINI_API_BASE}/models/{GEMINI_MODEL}:generateContent"
    resp = requests.post(
        url,
        params={"key": GEMINI_API_KEY},
        json={"contents": [{"parts": [{"text": prompt}]}]},
        timeout=HTTP_TIMEOUT,
    )
    if not resp.ok:
        # Raise a sanitized error: requests' default HTTPError embeds the full
        # URL (incl. ?key=...), which would leak the API key into logs. The error
        # body is JSON without the key; cap it just in case.
        raise RuntimeError(f"Gemini API {resp.status_code}: {resp.text[:300]}")
    data = resp.json()
    # candidates[0].content.parts[0].text
    return data["candidates"][0]["content"]["parts"][0]["text"].strip()


def call_openai_compatible(prompt: str, base: str, model: str, api_key: str) -> str:
    """Call any OpenAI-compatible /chat/completions endpoint (Groq, Ollama, …)."""
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
        # Body has no key; the key is only ever in the Authorization header.
        raise RuntimeError(f"LLM API {resp.status_code}: {resp.text[:300]}")
    return resp.json()["choices"][0]["message"]["content"].strip()


def call_llm(prompt: str) -> str:
    if LLM_PROVIDER == "gemini":
        return call_gemini(prompt)
    if LLM_PROVIDER == "groq":
        return call_openai_compatible(prompt, GROQ_API_BASE, GROQ_MODEL, GROQ_API_KEY)
    if LLM_PROVIDER == "ollama":
        return call_openai_compatible(prompt, OLLAMA_API_BASE, OLLAMA_MODEL, "")
    raise ValueError(f"unsupported LLM_PROVIDER: {LLM_PROVIDER}")


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
def alert():
    """Alertmanager webhook receiver."""
    payload = request.get_json(force=True, silent=True) or {}
    alerts = payload.get("alerts", [])
    log.info("received %d alert(s)", len(alerts))

    processed = 0
    for a in alerts:
        name = a.get("labels", {}).get("alertname", "alert")
        try:
            triage = call_llm(build_prompt(a))
            header = f":rotating_light: *[{a.get('status', 'firing').upper()}] {name}* — AI triage"
            post_to_slack(f"{header}\n{triage}")
        except Exception as e:  # noqa: BLE001 — never let one alert kill the batch
            log.exception("triage failed for %s: %s", name, e)
            try:
                post_to_slack(raw_fallback(a))
            except Exception:  # noqa: BLE001
                log.exception("slack fallback also failed for %s", name)
        processed += 1

    return jsonify({"received": len(alerts), "processed": processed}), 200


@app.get("/healthz")
def healthz():
    model = {"gemini": GEMINI_MODEL, "groq": GROQ_MODEL, "ollama": OLLAMA_MODEL}.get(
        LLM_PROVIDER, "?"
    )
    return jsonify({"status": "ok", "provider": LLM_PROVIDER, "model": model}), 200


if __name__ == "__main__":
    # Dev only; in the container gunicorn serves app:app.
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "8080")))
