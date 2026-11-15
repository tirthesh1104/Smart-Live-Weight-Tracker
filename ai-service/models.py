from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class CoachReading(BaseModel):
    coach_id: str
    coach_no: str
    coach_type: str
    empty_weight_kg: float
    max_capacity_kg: float
    current_weight_kg: float
    occupancy_percentage: float
    timestamp: Optional[str] = None

class PredictionRequest(BaseModel):
    coach_id: str
    coach_no: str
    coach_type: str
    empty_weight_kg: float
    max_capacity_kg: float
    current_weight_kg: float
    historical_weights: List[float] = Field(default_factory=list)
    route_station_stops_remaining: int = 5
    is_rush_hour: bool = False

class HorizonPrediction(BaseModel):
    horizon_minutes: int
    predicted_occupancy: float
    predicted_weight_kg: float
    confidence_score: float
    status: str
    explanation: str

class PredictionResponse(BaseModel):
    coach_id: str
    coach_no: str
    current_occupancy: float
    predictions: List[HorizonPrediction]
    model_used: str
    limitations: str

class AnomalyCheckRequest(BaseModel):
    coach_id: str
    coach_no: str
    empty_weight_kg: float
    max_capacity_kg: float
    previous_weight_kg: float
    current_weight_kg: float
    delta_seconds: float = 3.0

class AnomalyResult(BaseModel):
    is_anomaly: bool
    severity: str  # 'normal', 'warning', 'critical', 'overload'
    anomaly_type: Optional[str] = None  # 'sudden_spike', 'sudden_drop', 'sensor_drift', 'overload', 'under_tare'
    delta_kg: float
    rate_of_change_kg_per_sec: float
    message: str
    recommended_action: str

class RecommendationRequest(BaseModel):
    train_id: str
    coaches: List[CoachReading]
    preferred_type: Optional[str] = None  # e.g. "Sleeper", "General", "AC 3 Tier"
    walking_preferred_end: Optional[str] = "any"  # "front", "rear", "middle", "any"

class RecommendationResponse(BaseModel):
    recommended_coach_id: str
    recommended_coach_no: str
    coach_type: str
    occupancy_percentage: float
    reason: str
    ranked_alternatives: List[Dict[str, Any]]

class AnalyticsQueryRequest(BaseModel):
    query: str
    active_trains: List[Dict[str, Any]]
    latest_readings: List[Dict[str, Any]]
    recent_alerts: List[Dict[str, Any]] = Field(default_factory=list)

class AnalyticsQueryResponse(BaseModel):
    query: str
    answer: str
    insights: List[str]
    identified_records: List[Dict[str, Any]]
    confidence: float
