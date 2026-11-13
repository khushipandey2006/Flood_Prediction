from typing import Literal

from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import Base, engine, get_db
from .models import Prediction
from .schemas import FloodInput, FloodOutput, HistoryItem, ExplainOutput
from .predictor import predict, explain
from .config import CORS_ORIGINS
from .importance import ImportanceOutput, global_importance

Base.metadata.create_all(bind=engine)

app = FastAPI(title="ClariFlood API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict", response_model=FloodOutput)
def predict_flood(data: FloodInput, db: Session = Depends(get_db)):
    inputs = data.model_dump()
    try:
        result = predict(inputs)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    db.add(Prediction(inputs=inputs, **result))
    db.commit()
    return result


@app.post("/explain", response_model=ExplainOutput)
def explain_prediction(data: FloodInput):
    try:
        return explain(data.model_dump())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/history", response_model=list[HistoryItem])
def get_history(limit: int = 50, db: Session = Depends(get_db)):
    return db.query(Prediction).order_by(Prediction.id.desc()).limit(limit).all()


@app.delete("/history/{prediction_id}")
def delete_prediction(prediction_id: int, db: Session = Depends(get_db)):
    row = db.get(Prediction, prediction_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Prediction not found")
    db.delete(row)
    db.commit()
    return {"deleted": prediction_id}



@app.get("/feature-importance", response_model=ImportanceOutput)
def feature_importance(
    risk_class: Literal["High", "Moderate", "Low"] = "High",
    sample_size: int = Query(1000, ge=50, le=5000),):
    try:
        return global_importance(risk_class, sample_size)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))