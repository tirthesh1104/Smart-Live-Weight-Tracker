from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# --- Core Coach & Reading Models ---
class CoachReading(BaseModel):
    coach_id: str
    coach_no: str
    coach_type: str
    empty_weight_kg: float
    max_capacity_kg: float
    current_weight_kg: float
    occupancy_percentage: float
    timestamp: Optional[str] = None

# --- Prediction & Holt-Winters Models ---
class PredictionRequest(BaseModel):
    coach_id: str
    coach_no: str
    coach_type: str = "General"
    empty_weight_kg: float = 40000.0
    max_capacity_kg: float = 55000.0
    current_weight_kg: float = 48000.0
    historical_weights: List[float] = Field(default_factory=list)
    time_step_minutes: float = 5.0
    route_station_stops_remaining: int = 5
    is_rush_hour: bool = False
    alpha: float = 0.35  # Level smoothing parameter
    beta: float = 0.15   # Trend smoothing parameter

class HorizonPrediction(BaseModel):
    horizon_minutes: int
    predicted_occupancy: float
    predicted_weight_kg: float
    lower_bound_kg: float
    upper_bound_kg: float
    confidence_score: float
    status: str
    explanation: str

class PredictionResponse(BaseModel):
    coach_id: str
    coach_no: str
    current_occupancy: float
    current_weight_kg: float
    velocity_kg_per_min: float
    level_estimate_kg: float
    trend_estimate_kg: float
    predictions: List[HorizonPrediction]
    model_used: str
    limitations: str
    algorithm_metadata: Dict[str, Any]

# --- Delta-Sync Compression & Data Integrity Models ---
class DeltaSyncRequest(BaseModel):
    coach_id: str
    train_id: Optional[str] = None
    current_weight_kg: float
    previous_weight_kg: float
    payload_capacity_kg: float = 15000.0
    threshold_kg: float = 15.0
    threshold_percent: float = 2.0
    last_sync_timestamp: Optional[str] = None
    elapsed_seconds: float = 3.0
    max_heartbeat_interval_sec: float = 60.0
    # Safe Integrity Enhancements
    sequence_number: Optional[int] = None
    last_seen_sequence_number: Optional[int] = None
    max_capacity_kg: Optional[float] = 55000.0
    sensor_status: Optional[str] = "healthy"  # 'healthy', 'degraded', 'offline'
    previous_sensor_status: Optional[str] = "healthy"
    is_overload_critical: Optional[bool] = False

class DeltaSyncResponse(BaseModel):
    coach_id: str
    sync_required: bool
    action: str  # 'SYNC_DISPATCH' | 'EDGE_SUPPRESSED' | 'HEARTBEAT_SYNC' | 'STALE_DROPPED'
    delta_kg: float
    abs_delta_kg: float
    delta_percent: float
    threshold_kg: float
    bandwidth_saved_percent: float
    compression_ratio: str
    message: str
    # Safe Integrity Metrics
    event_type: str = "NORMAL_UPDATE"
    is_critical_event: bool = False
    sequence_accepted: bool = True
    reduction_type: str = "REQUEST_SUPPRESSION"

# --- Multi-Source Sensor Fusion Models ---
class SensorFusionRequest(BaseModel):
    coach_id: str
    coach_no: str
    coach_type: str = "Sleeper"
    empty_weight_kg: float = 40000.0
    max_capacity_kg: float = 55000.0
    bogie_strain_kg: float
    ir_door_count: Optional[int] = None
    cctv_head_count: Optional[int] = None
    estimated_passenger_avg_kg: float = 68.0
    bogie_sensor_status: str = "healthy"  # 'healthy', 'degraded', 'offline'

class SensorFusionResponse(BaseModel):
    coach_id: str
    coach_no: str
    fused_weight_kg: float
    fused_occupancy_percentage: float
    primary_sensor: str
    confidence_score: float
    sensor_breakdown: Dict[str, Any]
    anomaly_detected: bool
    fusion_method: str
    health_status: str
    recommendation: str
    physical_weight_status: str = "PHYSICAL_WEIGHT_NOT_VERIFIED"
    estimated_passenger_payload_kg: float = 0.0
    data_origin: str = "SOFTWARE_DERIVED_PROTOTYPE"
    hardware_adapter_spec: Optional[Dict[str, Any]] = None

# --- Platform Crowd Balancing Models ---
class PlatformCrowdDensity(BaseModel):
    bay_number: int
    platform_no: int
    estimated_waiting_passengers: int
    aligned_coach_no: str

class CrowdBalancingRequest(BaseModel):
    train_id: str
    train_number: str
    platform_no: int
    coaches: List[CoachReading]
    platform_crowd_distribution: Optional[List[PlatformCrowdDensity]] = None

class CoachBalancingAdvisory(BaseModel):
    coach_no: str
    coach_type: str
    current_occupancy: float
    status: str
    suggested_action: str
    target_migration_coach: Optional[str] = None
    passengers_to_divert: int = 0
    display_board_message: str
    pillar_bay: Optional[str] = None
    display_board_message_mr: Optional[str] = None

class CrowdBalancingResponse(BaseModel):
    train_id: str
    train_number: str
    platform_no: int
    overall_train_occupancy: float
    imbalance_index: float  # Gini or standard deviation of coach occupancies
    advisories: List[CoachBalancingAdvisory]
    audio_chime_announcement: str
    audio_announcement_mr: Optional[str] = None
    led_display_ticker: str
    rake_to_platform_mapping_status: str = "CONFIGURED_STATION_BAY_MAPPING"

# --- Coach Recommendation Models ---
class RecommendationRequest(BaseModel):
    train_id: str
    coaches: List[CoachReading]
    preferred_type: Optional[str] = None
    walking_preferred_end: Optional[str] = "any"

class RecommendationResponse(BaseModel):
    recommended_coach_id: str
    recommended_coach_no: str
    coach_type: str
    occupancy_percentage: float
    reason: str
    ranked_alternatives: List[Dict[str, Any]]

# --- Natural Language Analytics Query Models ---
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
