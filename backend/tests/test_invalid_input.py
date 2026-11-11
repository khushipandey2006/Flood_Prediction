import pytest

BASE = {
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

BAD_PAYLOADS = [
    ("latitude_is_text", {**BASE, "latitude": "abc"}),
    ("latitude_is_null", {**BASE, "latitude": None}),
    ("latitude_out_of_range", {**BASE, "latitude": 91}),
    ("longitude_out_of_range", {**BASE, "longitude": 181}),
    ("rainfall_negative", {**BASE, "historical_rainfall_intensity_mm_hr": -5}),
    ("rainfall_is_text", {**BASE, "historical_rainfall_intensity_mm_hr": "heavy"}),
    ("return_period_zero", {**BASE, "return_period_years": 0}),
    ("land_use_invalid", {**BASE, "land_use": "Swamp"}),
    ("soil_group_invalid", {**BASE, "soil_group": "Z"}),
    ("drain_type_invalid", {**BASE, "storm_drain_type": "Pipe"}),
    ("empty_object", {}),
]


@pytest.mark.parametrize("endpoint", ["/predict", "/explain"])
@pytest.mark.parametrize("name,payload", BAD_PAYLOADS, ids=[b[0] for b in BAD_PAYLOADS])
def test_invalid_input_is_rejected(client, endpoint, name, payload):
    r = client.post(endpoint, json=payload)
    assert r.status_code == 422


@pytest.mark.parametrize("endpoint", ["/predict", "/explain"])
def test_request_without_body_is_rejected(client, endpoint):
    r = client.post(endpoint)
    assert r.status_code == 422


def test_invalid_input_is_not_saved_to_history(client):
    client.post("/predict", json={**BASE, "latitude": 500})
    assert client.get("/history").json() == []


def test_history_rejects_non_numeric_limit(client):
    r = client.get("/history?limit=abc")
    assert r.status_code == 422


def test_delete_rejects_non_numeric_id(client):
    r = client.delete("/history/abc")
    assert r.status_code == 422