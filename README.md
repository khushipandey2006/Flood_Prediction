# ClariFlood: Explainable Flood-Risk Prediction

A mini project that predicts flood risk (Low / Moderate / High) for a site from terrain, drainage and rainfall inputs, and explains each prediction with SHAP.

- **Model:** XGBoost classifier with a scikit-learn preprocessing pipeline (trained in `notebooks/Flood_risk_ML1.ipynb`)
- **Backend:** FastAPI + SQLite (`backend/`)
- **Frontend:** React + Vite dashboard (`floodguard-frontend/`)

> **Disclaimer:** This is an academic prototype. The training data covers locations worldwide, so predictions for any specific city are a demonstration of the system, not a validated local forecast. Do not use it for emergency decisions.

## Project structure

```
Flood_Prediction/
├── backend/
│   ├── app/
│   │   ├── main.py        # API routes
│   │   ├── schemas.py     # request/response validation
│   │   ├── predictor.py   # model loading, prediction, SHAP explanation
│   │   ├── database.py    # SQLite connection
│   │   └── models.py      # prediction history table
│   └── requirements.txt
├── floodguard-frontend/   # React + Vite app
├── models/                # flood_preprocessor.pkl, xgboost_flood_model.pkl
├── data/                  # dataset
└── notebooks/             # model training notebook
```

## Running the backend

Requires Python 3.10 or newer.

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows (on macOS/Linux: source venv/bin/activate)
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API runs at http://127.0.0.1:8000, and interactive docs are at http://127.0.0.1:8000/docs.

The model files were saved with scikit-learn 1.7.2, so keep that version (it is pinned in `requirements.txt`).

## Running the frontend

In a second terminal:

```bash
cd floodguard-frontend
npm install
```

Create a file named `.env` in `floodguard-frontend/` containing:

```
VITE_API_URL=http://127.0.0.1:8000
```

Then:

```bash
npm run dev
```

Open http://localhost:5173. The backend allows requests from this address only, so keep the default port.

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server status check |
| POST | `/predict` | Predict risk level; the result is saved to history |
| POST | `/explain` | SHAP-based contribution of each input to the prediction |
| GET | `/history?limit=50` | Saved predictions, newest first |
| DELETE | `/history/{id}` | Delete one saved prediction |

### Input (`/predict` and `/explain`)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `latitude` | number | yes | -90 to 90 |
| `longitude` | number | yes | -180 to 180 |
| `elevation_m` | number | no | metres |
| `land_use` | string | no | Institutional, Residential, Industrial, Roads, Commercial, Green, Water, Mixed, Informal |
| `soil_group` | string | no | A, B, C, D |
| `drainage_density_km_per_km2` | number | no | |
| `storm_drain_proximity_m` | number | no | metres |
| `storm_drain_type` | string | no | CurbInlet, OpenChannel, Manhole, GratedInlet |
| `historical_rainfall_intensity_mm_hr` | number | yes | 0 or more |
| `return_period_years` | number | yes | 1 or more |

Optional fields may be left out; the preprocessing pipeline handles missing values.

### Example

```bash
curl -X POST http://127.0.0.1:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"latitude": 6.92, "longitude": 79.91, "elevation_m": 3,
       "land_use": "Residential", "soil_group": "D",
       "drainage_density_km_per_km2": 4.27, "storm_drain_proximity_m": 160.5,
       "storm_drain_type": "CurbInlet",
       "historical_rainfall_intensity_mm_hr": 120, "return_period_years": 50}'
```

Response:

```json
{
  "risk_level": "High",
  "confidence": 0.9969,
  "probabilities": {"High": 0.9969, "Low": 0.0004, "Moderate": 0.0027}
}
```

`/explain` returns the same `risk_level` and `confidence`, plus a `factors` list. Each factor has a `share` (its percentage of the total influence) and an `effect`: `supports` means the input pushed the prediction toward the predicted level, `opposes` means it pushed away.

## Model notes

- Output classes: 0 = High, 1 = Low, 2 = Medium (shown as "Moderate" in the app), as encoded in the training notebook.
- Explanations use XGBoost's built-in SHAP values; one-hot encoded columns are combined back into their original input.

Mini project, academic prototype.