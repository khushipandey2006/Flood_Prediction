from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field


class FloodInput(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    elevation_m: float | None = None
    land_use: Literal["Institutional", "Residential", "Industrial", "Roads",
                      "Commercial", "Green", "Water", "Mixed", "Informal"] | None = None
    soil_group: Literal["A", "B", "C", "D"] | None = None
    drainage_density_km_per_km2: float | None = None
    storm_drain_proximity_m: float | None = None
    storm_drain_type: Literal["CurbInlet", "OpenChannel", "Manhole", "GratedInlet"] | None = None
    historical_rainfall_intensity_mm_hr: float = Field(ge=0)
    return_period_years: float = Field(ge=1)


class FloodOutput(BaseModel):
    risk_level: str
    confidence: float
    probabilities: dict[str, float]



class HistoryItem(BaseModel):
    id: int
    created_at: datetime
    inputs: dict
    risk_level: str
    confidence: float
    probabilities: dict[str, float]

    model_config = {"from_attributes": True}




class Factor(BaseModel):
    feature: str
    label: str
    value: float | str | None
    contribution: float
    share: float
    effect: str


class ExplainOutput(BaseModel):
    risk_level: str
    confidence: float
    factors: list[Factor]