"""Unit tests for the AIOps service. Run: pytest -q (from devops/aiops)."""
import app as aiops


def client():
    aiops.app.config["TESTING"] = True
    return aiops.app.test_client()


def test_healthz_ok():
    r = client().get("/healthz")
    assert r.status_code == 200
    assert r.get_json()["status"] == "ok"


def test_build_prompt_includes_alert_fields():
    p = aiops.build_prompt({
        "labels": {"alertname": "HighCPU", "severity": "warning"},
        "annotations": {"summary": "cpu hot", "description": "node-1 at 95%"},
        "status": "firing",
    })
    for needle in ("HighCPU", "warning", "cpu hot", "node-1 at 95%"):
        assert needle in p


def test_alert_invalid_json_returns_400():
    r = client().post("/alert", data="not json", content_type="application/json")
    assert r.status_code == 400


def test_alert_posts_ai_triage(monkeypatch):
    posts = []
    monkeypatch.setattr(aiops, "call_llm", lambda prompt: "triage text")
    monkeypatch.setattr(aiops, "post_to_slack", posts.append)
    r = client().post("/alert", json={"alerts": [
        {"labels": {"alertname": "X"}, "status": "firing"},
    ]})
    assert r.status_code == 200
    body = r.get_json()
    assert body == {"received": 1, "posted": 1}
    assert "triage text" in posts[0]


def test_alert_falls_back_to_raw_when_llm_fails(monkeypatch):
    posts = []

    def boom(_prompt):
        raise RuntimeError("llm down")

    monkeypatch.setattr(aiops, "call_llm", boom)
    monkeypatch.setattr(aiops, "post_to_slack", posts.append)
    r = client().post("/alert", json={"alerts": [
        {"labels": {"alertname": "X"}, "status": "firing"},
    ]})
    assert r.status_code == 200
    assert r.get_json()["posted"] == 1
    assert "triage LLM unavailable" in posts[0]


def test_forecast_insufficient_history():
    r = client().post("/forecast", json={
        "history": [{"date": "2026-05-01", "revenue": 10}], "horizon": 7,
    })
    body = r.get_json()
    assert body["forecast"] == []
    assert "Not enough" in body["message"]


def test_forecast_returns_horizon_and_bands():
    hist = [{"date": f"2026-05-{d:02d}", "revenue": 100 + d} for d in range(1, 15)]
    r = client().post("/forecast", json={"history": hist, "horizon": 7})
    body = r.get_json()
    assert body["message"] is None
    assert len(body["forecast"]) == 7
    f0 = body["forecast"][0]
    assert {"date", "day", "predicted", "lower", "upper"} <= set(f0)
    assert f0["lower"] <= f0["predicted"] <= f0["upper"]


def test_forecast_clamps_horizon():
    hist = [{"date": f"2026-05-{d:02d}", "revenue": 100 + d} for d in range(1, 15)]
    r = client().post("/forecast", json={"history": hist, "horizon": 999})
    assert len(r.get_json()["forecast"]) == aiops.MAX_HORIZON_DAYS


def test_forecast_invalid_json_returns_400():
    r = client().post("/forecast", data="x", content_type="application/json")
    assert r.status_code == 400


def test_require_token_enforced_when_set(monkeypatch):
    monkeypatch.setattr(aiops, "WEBHOOK_TOKEN", "s3cret")
    c = client()
    assert c.post("/forecast", json={"history": []}).status_code == 401
    ok = c.post("/forecast", json={"history": []},
                headers={"Authorization": "Bearer s3cret"})
    assert ok.status_code == 200
