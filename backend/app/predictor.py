import warnings
warnings.filterwarnings("ignore")

from pathlib import Path
import joblib
import numpy as np
import pandas as pd

MODELS = Path(__file__).resolve().parents[2] / "models"
preprocessor = joblib.load(MODELS / "flood_preprocessor.pkl")
model = joblib.load(MODELS / "xgboost_flood_model.pkl")

FEATURES = list(preprocessor.feature_names_in_)
NUMERIC = ["latitude", "longitude", "elevation_m", "drainage_density_km_per_km2",
           "storm_drain_proximity_m", "historical_rainfall_intensity_mm_hr",
           "return_period_years"]
CATEGORICAL = ["land_use", "soil_group", "storm_drain_type"]

# From your notebook: 0 = High, 1 = Low, 2 = Medium
# "Medium" is shown as "Moderate" so it matches the frontend's badge names
CLASS_NAMES = {0: "High", 1: "Low", 2: "Moderate"}


def predict(data: dict):
    df = pd.DataFrame([data])[FEATURES]
    for c in NUMERIC:
        df[c] = pd.to_numeric(df[c], errors="coerce")
    for c in CATEGORICAL:
        df[c] = df[c].astype(object).where(df[c].notna(), np.nan)

    X = preprocessor.transform(df)
    probs = model.predict_proba(X)[0]
    best = int(np.argmax(probs))

    return {
        "risk_level": CLASS_NAMES[best],
        "confidence": round(float(probs[best]), 4),
        "probabilities": {CLASS_NAMES[i]: round(float(p), 4) for i, p in enumerate(probs)},
    }