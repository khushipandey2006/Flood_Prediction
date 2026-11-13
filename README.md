# ClariFlood: Explainable Flood-Risk Prediction

A mini project that predicts flood risk (Low / Moderate / High) for a site from terrain, drainage and rainfall inputs, and explains each prediction with SHAP.

- **Model:** XGBoost classifier with a scikit-learn preprocessing pipeline (trained in `notebooks/Flood_risk_ML1.ipynb`)
- **Explainability:** SHAP values from XGBoost's built-in TreeSHAP (`notebooks/Member2_XAI_SHAP_Analysis.ipynb`)
- **Backend:** FastAPI + SQLite (`backend/`)
- **Frontend:** React + Vite dashboard (`floodguard-frontend/`)

> **Disclaimer:** This is an academic prototype. The training data covers locations worldwide, so predictions for any specific city are a demonstration of the system, not a validated local forecast. Do not use it for emergency decisions.

## Project structure

```
Flood_Prediction/
├── backend/
│   ├── app/
│   │   ├── main.py          # API routes
│   │   ├── schemas.py       # request/response validation
│   │   ├── predictor.py     # model loading, prediction, SHAP explanation
│   │   ├── config.py        # settings read from backend/.env
│   │   ├── database.py      # SQLite connection
│   │   └── models.py        # prediction history table
│   ├── tests/               # pytest tests
│   ├── .env.example         # template for backend/.env
│   ├── pytest.ini
│   └── requirements.txt
├── floodguard-frontend/     # React + Vite app (all UI in src/App.jsx)
├── models/                  # flood_preprocessor.pkl, xgboost_flood_model.pkl
├── data/                    # dataset (data.csv)
└── notebooks/               # model training and SHAP analysis notebooks
```

## Running the backend

Requires Python 3.10 or newer.

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows (on macOS/Linux: source venv/bin/activate)
pip install -r requirements.txt
copy .env.example .env         # on macOS/Linux: cp .env.example .env
uvicorn app.main:app --reload
```

The API runs at http://127.0.0.1:8000, and interactive docs are at http://127.0.0.1:8000/docs.

The model files were saved with scikit-learn 1.7.2, so keep that version (it is pinned in `requirements.txt`). A harmless XGBoost warning about the pickle version may appear at startup.

### Configuration (`backend/.env`)

| Variable | Default | Meaning |
|----------|---------|---------|
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Frontend addresses allowed to call the API (comma-separated) |
| `DATABASE_PATH` | `clariflood.db` | SQLite file for the prediction history (relative paths are inside `backend/`) |

The `.env` file is not committed. Copy `.env.example` to create your own.

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

Open http://localhost:5173. The backend allows requests from this address only (see `CORS_ORIGINS`), so keep the default port.

- **Predictions page:** fill in the site inputs and run the model. It shows the risk level, confidence, class probabilities, a plain-English summary, the top contributing inputs as bars, and a waterfall chart.
- **History page:** lists the predictions saved by the backend, with delete and refresh.
- **Dashboard page:** currently shows illustrative sample data and is labelled as such.

## Running the tests

```bash
cd backend
venv\Scripts\activate
python -m pytest -v
```

The tests use a temporary in-memory database, so your real history is never touched. They cover:

- prediction for several input conditions (High, Moderate and Low, taken from real rows of `data/data.csv`)
- optional fields left out
- invalid and missing input (wrong types, out-of-range values, unknown categories, empty body)
- the explanation endpoint
- saving, listing and deleting history
- global feature importance (sorting, each risk class, parameter checks)

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server status check |
| POST | `/predict` | Predict risk level; the result is saved to history |
| POST | `/explain` | SHAP explanation of a prediction (not saved to history) |
| GET | `/history?limit=50` | Saved predictions, newest first |
| DELETE | `/history/{id}` | Delete one saved prediction |
| GET | `/feature-importance?risk_class=High&sample_size=1000` | Overall importance of each input (mean absolute SHAP value over a sample of the dataset) |

Invalid input returns HTTP 422 with details of what is wrong.

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

### Example: `/predict`

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

### Response of `/explain`

`/explain` takes the same body and returns:

| Field | Meaning |
|-------|---------|
| `risk_level`, `confidence` | Same as `/predict` |
| `summary` | One plain-English sentence, e.g. "High risk, mainly driven by rainfall intensity (46%), elevation (27%) and soil group (18%)." |
| `base_value` | The model's starting score for the predicted class, before any input is considered |
| `score` | The final raw score for the predicted class. `base_value` plus all factor contributions equals `score` (used for the waterfall chart) |
| `factors` | One entry per input, sorted by influence (see below) |

Each entry in `factors` has:

| Field | Meaning |
|-------|---------|
| `feature`, `label`, `value` | The input's name, a readable name, and the value used |
| `contribution` | SHAP contribution to the score for the predicted class |
| `share` | The input's percentage of the total absolute contribution |
| `effect` | `supports` (pushed toward the predicted level), `opposes` (pushed away) or `neutral` |
   ### Response of `/feature-importance`

| Field | Meaning |
|-------|---------|
| `risk_class` | Class the importance is calculated for: `High` (default), `Moderate` or `Low` |
| `sample_size` | Number of dataset rows used (parameter `sample_size`, 50 to 5000, default 1000) |
| `features` | The 10 inputs sorted by importance, each with `feature`, `label`, `importance` (mean absolute SHAP value) and `share` (percentage of the total) |

## Model notes

- Output classes: 0 = High, 1 = Low, 2 = Medium (shown as "Moderate" in the app), as encoded in the training notebook. The model has only these three classes.
- Explanations use XGBoost's built-in SHAP values (TreeSHAP). One-hot encoded columns are combined back into their original input.
- Water level, soil moisture and humidity are not inputs of the model, so they are not explained.
- On the held-out 20% test split, the model reaches about 97% accuracy; the weakest class is High, which is most often confused with Moderate (details in `notebooks/Member2_XAI_SHAP_Analysis.ipynb`).
- The dataset has no date column, so no time-series analysis is possible.

## Known limitations

- The training data covers locations worldwide, so results for a specific city are a demonstration only.
- In the dataset, elevation is exactly -3.0 for many rows and none of them are labelled Low risk; this may be a placeholder value in the data.
- The history database is a local SQLite file, so each person running the project has their own history.

Mini project, academic prototype.