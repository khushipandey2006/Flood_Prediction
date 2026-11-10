HIGH_RISK = {
    "latitude": 6.92,
    "longitude": 79.91,
    "elevation_m": 3,
    "land_use": "Residential",
    "soil_group": "D",
    "drainage_density_km_per_km2": 4.27,
    "storm_drain_proximity_m": 160.5,
    "storm_drain_type": "CurbInlet",
    "historical_rainfall_intensity_mm_hr": 120,
    "return_period_years": 50,
}

LOW_RISK = {**HIGH_RISK, "elevation_m": 150, "historical_rainfall_intensity_mm_hr": 20}

REQUIRED_ONLY = {
    "latitude": 12.97,
    "longitude": 77.59,
    "historical_rainfall_intensity_mm_hr": 60,
    "return_period_years": 25,
}


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_predict_high_risk(client):
    r = client.post("/predict", json=HIGH_RISK)
    assert r.status_code == 200
    body = r.json()
    assert body["risk_level"] == "High"
    assert 0 < body["confidence"] <= 1
    assert abs(sum(body["probabilities"].values()) - 1) < 0.01


def test_predict_low_risk(client):
    r = client.post("/predict", json=LOW_RISK)
    assert r.status_code == 200
    assert r.json()["risk_level"] == "Low"


def test_predict_works_without_optional_fields(client):
    r = client.post("/predict", json=REQUIRED_ONLY)
    assert r.status_code == 200
    assert r.json()["risk_level"] in {"High", "Moderate", "Low"}


def test_predict_rejects_missing_required_field(client):
    bad = {k: v for k, v in HIGH_RISK.items() if k != "latitude"}
    r = client.post("/predict", json=bad)
    assert r.status_code == 422


def test_predict_rejects_invalid_category(client):
    r = client.post("/predict", json={**HIGH_RISK, "land_use": "Swamp"})
    assert r.status_code == 422


def test_predict_rejects_out_of_range_latitude(client):
    r = client.post("/predict", json={**HIGH_RISK, "latitude": 200})
    assert r.status_code == 422


def test_explain_returns_all_factors(client):
    r = client.post("/explain", json=LOW_RISK)
    assert r.status_code == 200
    body = r.json()
    assert body["risk_level"] == "Low"
    assert len(body["factors"]) == 10
    assert abs(sum(f["share"] for f in body["factors"]) - 100) < 1.5
    assert all(f["effect"] in {"supports", "opposes", "neutral"} for f in body["factors"])


def test_explain_elevation_matters_for_low_risk(client):
    r = client.post("/explain", json=LOW_RISK)
    top3 = [f["feature"] for f in r.json()["factors"][:3]]
    assert "elevation_m" in top3


def test_history_starts_empty(client):
    r = client.get("/history")
    assert r.status_code == 200
    assert r.json() == []


def test_history_saves_predictions_newest_first(client):
    client.post("/predict", json=HIGH_RISK)
    client.post("/predict", json=LOW_RISK)
    rows = client.get("/history").json()
    assert len(rows) == 2
    assert rows[0]["risk_level"] == "Low"
    assert rows[1]["risk_level"] == "High"
    assert rows[0]["inputs"]["elevation_m"] == 150


def test_explain_does_not_write_history(client):
    client.post("/explain", json=HIGH_RISK)
    assert client.get("/history").json() == []


def test_delete_history_item(client):
    client.post("/predict", json=HIGH_RISK)
    row_id = client.get("/history").json()[0]["id"]
    r = client.delete(f"/history/{row_id}")
    assert r.status_code == 200
    assert client.get("/history").json() == []


def test_delete_missing_item_returns_404(client):
    r = client.delete("/history/9999")
    assert r.status_code == 404