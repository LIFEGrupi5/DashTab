# Postmortem — AI Menu Recommendation Degraded for 3h (OpenAI Quota Exhausted)

> **Note:** Simulated incident for M7.6. Drafted with AI (Claude Sonnet 4.6), refined by Olti Ramadani. Architecture detail (Prometheus, Uptime Kuma, Serilog→Loki, AIOps) reflects the real DashTab production observability stack.

**Severity:** P2 — Partial service degradation (product feature unavailable, core POS unaffected)  
**Duration:** 2026-06-10 14:22 UTC → 17:08 UTC (2h 46m)  
**Status:** Resolved  
**Author:** Olti Ramadani  
**Reviewed by:** Enes Drejta, Jeta Fazliu

---

## Summary

The OpenAI API key shared across all DashTab tenants hit its monthly spend cap at 14:22 UTC. The AI menu recommendation endpoint (`POST /api/v1/public/restaurants/{id}/recommend`) began returning the graceful-degradation fallback response ("AI is warming up — here are some popular dishes") rather than the LLM-generated personalised blurb. Diners could still browse recommended items (the pgvector cosine-similarity fallback to available menu items was active), but received no AI-written blurb and no semantically-matched results — effectively a no-op recommendation page.

The degradation was **silent to the operations team for 47 minutes** because the endpoint kept returning HTTP 200 (by design — graceful degradation). Detection came from a custom Prometheus metric alert, not from error-rate monitoring. The fix was rotating the OpenAI key and updating Azure Key Vault; no code was changed.

---

## Timeline

| Time (UTC) | Event |
|---|---|
| 14:22 | OpenAI API returns `429 — quota exceeded` on `EmbedTextAsync`. `RecommendationService` catches the exception, logs `WARN: EmbedTextAsync failed`, and returns `null`. |
| 14:22 | All subsequent recommendation requests enter the pgvector-free fallback path: return up to 4 available menu items + generic message. HTTP 200 on all responses. |
| 14:22–15:09 | No alert fires. Backend error-rate Prometheus alert (`sum(rate(http_requests_errors_total[5m])) > 0.05`) does not trigger — 200s are not errors. Uptime Kuma's `/health` check passes (backend is healthy). AIOps LLM triage receives no Alertmanager payload (no alert to triage). |
| 15:09 | `recommendation_ai_blurb_generated_total` Prometheus counter (added in the initial feature) has had zero increments for 47 min. The `recommendation_fallback_total` counter has incremented 38 times. The Grafana alert rule `AI Recommendation Fallback Rate > 5/min for 10min` fires. Alertmanager sends to AIOps webhook. |
| 15:11 | AIOps LLM triage classifies the alert as `severity: high`, posts to `#ops-alerts` Slack: *"AI recommendation service is fully degraded — 100% fallback rate, 0 successful LLM calls in 47min. Likely OpenAI API key exhaustion or key rotation needed."* |
| 15:14 | On-call (Enes) acknowledges Slack alert. Checks Serilog → Loki: confirms `WARN: EmbedTextAsync failed — 429 quota` pattern repeating every ~5s. |
| 15:19 | Enes checks Azure Key Vault `backend-openai-apikey` — key present, unchanged. Logs into OpenAI dashboard: monthly spend cap (`$5.00`) reached at 14:21 UTC. |
| 15:24 | Olti generates a new OpenAI API key, sets spend cap to `$20.00`. |
| 15:31 | Enes updates `backend-openai-apikey` in Azure Key Vault. Triggers a manual Helm redeploy of the backend (`helm upgrade ... --set secrets.OpenAI__ApiKey=...`). |
| 15:38 | Backend pods restart with new key. First successful `EmbedTextAsync` call logged. `recommendation_ai_blurb_generated_total` counter begins incrementing. |
| 15:40 | Grafana fallback-rate alert resolves. AIOps posts recovery message to `#ops-alerts`. |
| 17:08 | All in-flight Unleash flag evaluations confirmed consistent. Incident closed. |

---

## Impact

| Dimension | Detail |
|---|---|
| **Users affected** | All diners using the public AI recommendation page (`/r/{restaurantId}`) |
| **Duration** | 2h 46m (14:22–17:08 UTC); 47 min silent before detection |
| **Visible symptom** | Recommendation page showed generic message + up to 4 available dishes instead of semantically-matched items + LLM blurb |
| **Core POS unaffected** | Orders, KDS, staff management, payments — no impact. Graceful degradation worked as designed |
| **Revenue impact** | None directly; no checkout flow involved |

---

## Root Cause

The OpenAI API key used for all tenants had a `$5.00` spend cap configured during initial provisioning. The cap was hit 27 days into the first billing cycle due to unmetered embedding backfill calls triggered by staff during onboarding (each `POST /menu/embeddings/backfill` embeds the restaurant's full menu without a per-call budget check). Once the cap was reached, every `EmbedTextAsync` call returned 429 and the service fell back silently.

---

## Contributing Factors

1. **Single shared OpenAI key** — no per-tenant key or quota partitioning. One tenant's backfill exhausted the shared cap.
2. **$5 spend cap set at provisioning** — appropriate for early testing, never reviewed before production traffic.
3. **No alerting on 429-rate or OpenAI spend** — the graceful-degradation design (HTTP 200 on fallback) intentionally prevented error-rate alerts from firing, but no compensating business-metric alert was added at the same time.
4. **Backfill endpoint unrestricted in call frequency** — owners can trigger `POST /menu/embeddings/backfill` repeatedly with no rate limit or cost guard.

---

## Resolution

1. Generated a new OpenAI API key with a `$20.00` monthly spend cap and billing alert at 80%.
2. Updated `backend-openai-apikey` in Azure Key Vault.
3. Triggered a manual Helm backend redeploy. Pods restarted and resumed normal operation.

---

## Action Items

| # | Action | Owner | Due |
|---|---|---|---|
| 1 | Add a Prometheus alert on `recommendation_fallback_total` rate > 2/min sustained for 5min | Enes | 2026-06-17 |
| 2 | Add a Prometheus alert on `openai_api_429_total` > 0 (a new counter to instrument in `RecommendationService`) | Olti | 2026-06-17 |
| 3 | Set OpenAI billing alert at 80% of spend cap in the OpenAI dashboard | Olti | Done |
| 4 | Rate-limit the backfill endpoint: max 1 call per restaurant per 24h | Olti | 2026-06-21 |
| 5 | Document the Key Vault key rotation runbook in `devops/DEVOPS_HANDOFF.md` | Enes | 2026-06-21 |
| 6 | Evaluate per-tenant OpenAI keys (via Key Vault per-restaurant secrets) once tenant count > 5 | All | Backlog |

---

## Lessons Learned

- **Graceful degradation masks incidents from ops.** HTTP 200 on fallback is the right user experience, but it requires a **parallel business-metric alert** (fallback rate) to be added at the same time as the feature. Adding graceful degradation without adding a compensating alert creates a silent-failure mode.
- **Spend caps and billing alerts are operational requirements, not optional.** The $5 cap was a dev-time default that was never reviewed before production traffic. Any key with an external spend cap needs a billing alert well before the cap is hit.
- **AIOps LLM triage added real value.** When the Grafana alert finally fired, the AIOps webhook classified the root cause correctly ("OpenAI API key exhaustion") from the metric name and fallback-counter context — the on-call engineer had the diagnosis before opening a single log tab.
