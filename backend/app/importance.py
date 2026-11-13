import warnings
warnings.filterwarnings("ignore")

from functools import lru_cache
from pathlib import Path

import numpy as np
import pandas as pd
import xgboost as xgb
from pydantic import BaseModel

from .predictor import (
    CATEGORICAL, CLASS_NAMES, FEATURES, FRIENDLY, NUMERIC, model, preprocessor,
)

DATA_PATH = Path(__file__).resolve().parents[2] / "data" / "data.csv"
CLASS_INDEX = {name: idx for idx, name in CLASS_NAMES.items()}
DEFAULT_SAMPLE = 1000


class ImportanceItem(BaseModel):
    feature: str
    label: str
    importance: float
    share: float


class ImportanceOutput(BaseModel):
    risk_class: str
    sample_size: int
    features: list[ImportanceItem]


def _column_owners(names):
    """Match each preprocessed column (e.g. land_use_Residential) to its original input."""
    longest_first = sorted(FEATURES, key=len, reverse=True)
    owners = []
    for name in names:
        base = name.split("__", 1)[-1]
        owner = None
        for f in longest_first:
            if base == f or base.startswith(f + "_"):
                owner = f
                break
        owners.append(owner)
    return owners


@lru_cache(maxsize=16)
def _compute(risk_class: str, sample_size: int):
    df = pd.read_csv(DATA_PATH)[FEATURES]
    if len(df) > sample_size:
        df = df.sample(n=sample_size, random_state=42)
    df = df.copy()
    for c in NUMERIC:
        df[c] = pd.to_numeric(df[c], errors="coerce")
    for c in CATEGORICAL:
        df[c] = df[c].astype(object).where(df[c].notna(), np.nan)

    X = preprocessor.transform(df)
    contribs = np.asarray(
        model.get_booster().predict(xgb.DMatrix(X), pred_contribs=True, validate_features=False)
    )
    values = contribs[:, CLASS_INDEX[risk_class], :-1]  # rows x columns, bias dropped

    owners = _column_owners(preprocessor.get_feature_names_out())
    if len(owners) != values.shape[1]:
        raise ValueError("Feature count mismatch between preprocessor and model")

    pairs = []
    for f in FEATURES:
        cols = [i for i, o in enumerate(owners) if o == f]
        imp = float(np.abs(values[:, cols].sum(axis=1)).mean()) if cols else 0.0
        pairs.append((f, imp))
    pairs.sort(key=lambda p: p[1], reverse=True)
    return len(df), tuple(pairs)


def global_importance(risk_class: str = "High", sample_size: int = DEFAULT_SAMPLE):
    n, pairs = _compute(risk_class, sample_size)
    total = sum(v for _, v in pairs) or 1.0
    items = [
        ImportanceItem(
            feature=f,
            label=FRIENDLY[f],
            importance=round(v, 4),
            share=round(v / total * 100, 1),
        )
        for f, v in pairs
    ]
    return ImportanceOutput(risk_class=risk_class, sample_size=n, features=items)