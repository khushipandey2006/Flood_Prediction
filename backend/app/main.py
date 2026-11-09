from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .schemas import FloodInput, FloodOutput
from .predictor import predict

app = FastAPI(title="ClariFlood API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict", response_model=FloodOutput)
def predict_flood(data: FloodInput):
    try:
        return predict(data.model_dump())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))