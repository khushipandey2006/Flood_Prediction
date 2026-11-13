import pytest


def test_default_returns_all_features_sorted(client):
    r = client.get("/feature-importance")
    assert r.status_code == 200
    body = r.json()
    assert body["risk_class"] == "High"
    assert len(body["features"]) == 10
    values = [f["importance"] for f in body["features"]]
    assert values == sorted(values, reverse=True)
    assert all(v >= 0 for v in values)
    assert abs(sum(f["share"] for f in body["features"]) - 100) < 1.0


@pytest.mark.parametrize("risk_class", ["High", "Moderate", "Low"])
def test_each_risk_class_works(client, risk_class):
    r = client.get("/feature-importance", params={"risk_class": risk_class})
    assert r.status_code == 200
    assert r.json()["risk_class"] == risk_class


def test_elevation_is_a_top_feature_for_high_risk(client):
    body = client.get("/feature-importance").json()
    top3 = [f["feature"] for f in body["features"][:3]]
    assert "elevation_m" in top3


def test_top_features_match_the_shap_notebook(client):
    # Member 2's notebook: elevation, drainage density and rainfall intensity lead for High risk
    body = client.get("/feature-importance").json()
    top3 = {f["feature"] for f in body["features"][:3]}
    assert top3 == {
        "elevation_m",
        "drainage_density_km_per_km2",
        "historical_rainfall_intensity_mm_hr",
    }


def test_sample_size_is_respected(client):
    body = client.get("/feature-importance", params={"sample_size": 100}).json()
    assert body["sample_size"] == 100


@pytest.mark.parametrize("params", [
    {"risk_class": "Extreme"},
    {"sample_size": 10},
    {"sample_size": 99999},
    {"sample_size": "abc"},
])
def test_invalid_parameters_are_rejected(client, params):
    r = client.get("/feature-importance", params=params)
    assert r.status_code == 422


def test_feature_importance_does_not_write_history(client):
    client.get("/feature-importance")
    assert client.get("/history").json() == []