import joblib
from pathlib import Path

MODELS = Path(__file__).resolve().parent.parent / "models"
pre = joblib.load(MODELS / "flood_preprocessor.pkl")
model = joblib.load(MODELS / "xgboost_flood_model.pkl")

print("Preprocessor:", type(pre))
print("Input columns:", getattr(pre, "feature_names_in_", "not available"))
print("Model:", type(model))
print("Classes:", getattr(model, "classes_", "regression, no classes"))