import warnings
warnings.filterwarnings("ignore")

from pathlib import Path
import joblib
import numpy as np
import pandas as pd
import xgboost as xgb

MODELS = Path(__file__).resolve().parents[2] / "models"
preprocessor = joblib.load(MODELS / "flood_preprocessor.pkl")
model = joblib.load(MODELS / "xgboost_flood_model.pkl")

FEATURES = list(preprocessor.feature_names_in_)
NUMERIC = ["latitude", "longitude", "elevation_m", "drainage_density_km_per_km2",
           "storm_drain_proximity_m", "historical_rainfall_intensity_mm_hr",
           "return_period_years"]
CATEGORICAL = ["land_use", "soil_group", "storm_drain_type"]

# From your notebook: 0 = High, 1 = Low, 2 = Medium ("Moderate" matches the frontend badge)
CLASS_NAMES = {0: "High", 1: "Low", 2: "Moderate"}

FRIENDLY = {
    "latitude": "Latitude",
    "longitude": "Longitude",
    "elevation_m": "Elevation",
    "land_use": "Land use",
    "soil_group": "Soil group",
    "drainage_density_km_per_km2": "Drainage density",
    "storm_drain_proximity_m": "Storm drain distance",
    "storm_drain_type": "Storm drain type",
    "historical_rainfall_intensity_mm_hr": "Rainfall intensity",
    "return_period_years": "Return period",
}


def _prepare(data: dict):
    df = pd.DataFrame([data])[FEATURES]
    for c in NUMERIC:
        df[c] = pd.to_numeric(df[c], errors="coerce")
    for c in CATEGORICAL:
        df[c] = df[c].astype(object).where(df[c].notna(), np.nan)
    return df, preprocessor.transform(df)


def predict(data: dict):
    _, X = _prepare(data)
    probs = model.predict_proba(X)[0]
    best = int(np.argmax(probs))
    return {
        "risk_level": CLASS_NAMES[best],
        "confidence": round(float(probs[best]), 4),
        "probabilities": {CLASS_NAMES[i]: round(float(p), 4) for i, p in enumerate(probs)},
    }


def explain(data: dict):
    df, X = _prepare(data)
    probs = model.predict_proba(X)[0]
    best = int(np.argmax(probs))

    # SHAP values calculated by XGBoost itself (last column is the baseline, so we drop it)
    contribs = np.asarray(
        model.get_booster().predict(xgb.DMatrix(X), pred_contribs=True, validate_features=False)
    )
    row = contribs[0, best, :-1] if contribs.ndim == 3 else contribs[0, :-1]

    names = list(preprocessor.get_feature_names_out())
    if len(names) != len(row):
        raise ValueError("Feature count mismatch between preprocessor and model")

    # One-hot columns (e.g. land_use_Residential) are added back to their original input
    totals = {f: 0.0 for f in FEATURES}
    longest_first = sorted(FEATURES, key=len, reverse=True)
    for name, val in zip(names, row):
        base = name.split("__", 1)[-1]
        for f in longest_first:
            if base == f or base.startswith(f + "_"):
                totals[f] += float(val)
                break

    total_abs = sum(abs(v) for v in totals.values()) or 1.0
    factors = []
    for f, v in totals.items():
        raw = df.iloc[0][f]
        if pd.isna(raw):
            shown = None
        elif f in NUMERIC:
            shown = float(raw)
        else:
            shown = str(raw)
        factors.append({
            "feature": f,
            "label": FRIENDLY[f],
            "value": shown,
            "contribution": round(v, 4),
            "share": round(abs(v) / total_abs * 100, 1),
            "effect": "supports" if v > 0 else "opposes" if v < 0 else "neutral",
        })
    factors.sort(key=lambda x: abs(x["contribution"]), reverse=True)

    return {
        "risk_level": CLASS_NAMES[best],
        "confidence": round(float(probs[best]), 4),
        "factors": factors,
    }