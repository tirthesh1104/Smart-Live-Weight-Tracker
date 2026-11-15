from typing import Optional
from fastapi import FastAPI, HTTPException, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from models import (
    PredictionRequest, PredictionResponse,
    DeltaSyncRequest, DeltaSyncResponse,
    SensorFusionRequest, SensorFusionResponse,
    CrowdBalancingRequest, CrowdBalancingResponse,
    RecommendationRequest, RecommendationResponse,
    AnalyticsQueryRequest, AnalyticsQueryResponse
)
from ml_engine import ml_engine
from sensor_fusion import sensor_fusion_engine
from crowd_balancer import crowd_balancing_engine
from railradar_service import railradar_service
from railcore_service import railcore_service
from qrail_service import qrail_service
from railkit_service import railkit_service
from dual_railway_gateway import dual_railway_gateway
from railway_directory_service import railway_directory_service
from auth_service import auth_service, is_valid_email, normalize_email
from hardware_adapter import (
    hardware_gateway, 
    HardwareTelemetryPacket, 
    DeviceRegistrationRequest, 
    DeviceHeartbeatPacket, 
    ZeroCalibrationRequest, 
    ScaleCalibrationRequest
)

app = FastAPI(
    title="Smart Live Weight Tracker - Advanced Railway AI/ML Backend",
    description=(
        "Production-grade FastAPI service providing Holt-Winters Double Exponential Smoothing, "
        "Edge Delta-Compression, Multi-Source Sensor Fusion (Strain + IR + CCTV), "
        "and Dynamic Platform Crowd Balancing for Indian Railways Passenger Safety."
    ),
    version="2.0.0"
)

# CORS Middleware for React Vite Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
@app.get("/health")
@app.get("/api/system/status")
def health_check():
    return {
        "status": "healthy",
        "service": "Smart Live Weight Tracker - Railway ML Telemetry & Crowd Balancing Engine",
        "version": "2.0.0",
        "algorithms": [
            "Holt-Winters Double Exponential Smoothing (Time-Series Crowd Projection)",
            "Statistical Prediction Intervals (95% Confidence Bounds)",
            "Edge Delta-Compression (15kg / 2% Bandwidth Throttle)",
            "Multi-Source Kalman/Weighted Sensor Fusion (Bogie Strain + Optical IR + Computer Vision)",
            "Platform Crowd Balancing & Migration Optimization Engine"
        ],
        "endpoints": {
            "predict": "/predict",
            "delta_sync": "/delta-sync",
            "sensor_fusion": "/sensor-fusion",
            "crowd_balance": "/crowd-balance",
            "recommend_coach": "/recommend-coach",
            "analytics_assistant": "/analytics-assistant",
            "railradar_status": "/api/railradar/status",
            "railradar_lookup": "/api/railradar/trains/lookup",
            "railradar_train": "/api/railradar/trains/{train_number}",
            "railradar_live": "/api/railradar/trains/{train_number}/live",
            "railway_providers_status": "/api/railway/providers/status",
            "railcore_status": "/api/railcore/status",
            "qrail_status": "/api/qrail/status",
            "multi_provider_train": "/api/railway/trains/{train_number}/multi-provider"
        }
    }

@app.post("/predict", response_model=PredictionResponse)
def predict_crowd(req: PredictionRequest):
    """
    Holt-Winters Double Exponential Smoothing crowd prediction for 15, 30, and 60 minutes.
    Computes level, trend, velocity (kg/min), and 95% confidence bounds.
    """
    try:
        return ml_engine.predict_occupancy(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction ML error: {str(e)}")

@app.post("/delta-sync", response_model=DeltaSyncResponse)
def delta_sync(req: DeltaSyncRequest):
    """
    Edge Delta-Compression Sync:
    Evaluates whether raw telemetry packets need transmission over cellular GSM-R/4G
    based on 15kg or 2% delta threshold and periodic heartbeat timeout.
    """
    try:
        return ml_engine.evaluate_delta_sync(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delta sync error: {str(e)}")

@app.post("/sensor-fusion", response_model=SensorFusionResponse)
def fuse_sensors(req: SensorFusionRequest):
    """
    Multi-Source Sensor Fusion:
    Fuses mechanical bogie strain gauges, IR door beam counters, and CCTV head counts.
    Detects sensor drift and undeclared heavy freight anomalies.
    """
    try:
        return sensor_fusion_engine.fuse_sensors(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sensor fusion error: {str(e)}")

@app.post("/crowd-balance", response_model=CrowdBalancingResponse)
def balance_platform_crowd(req: CrowdBalancingRequest):
    """
    Platform Crowd Balancing:
    Calculates rake load distribution, imbalance index, and generates passenger
    migration directives and bilingual PA/LED display announcements.
    """
    try:
        return crowd_balancing_engine.generate_balancing_plan(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Crowd balancing error: {str(e)}")

@app.post("/recommend-coach", response_model=RecommendationResponse)
def recommend_coach(req: RecommendationRequest):
    """
    Recommends optimal coach with lowest crowding and available seating.
    """
    try:
        return ml_engine.recommend_best_coach(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation error: {str(e)}")

@app.post("/analytics-assistant", response_model=AnalyticsQueryResponse)
def analytics_assistant(req: AnalyticsQueryRequest):
    """
    Deterministic railway operations analytics assistant.
    """
    try:
        return ml_engine.query_analytics_assistant(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analytics assistant error: {str(e)}")

# ==============================================================================
# OFFICIAL RAILRADAR RAILWAY INTELLIGENCE ENDPOINTS (SERVER-SIDE AUTHENTICATED)
# ==============================================================================

@app.get("/api/railradar/status")
async def railradar_status():
    """
    Check RailRadar server-side connection and configuration status.
    Never exposes raw API keys.
    """
    return await railradar_service.get_status()

@app.get("/api/railradar/trains/lookup")
@app.get("/api/railradar/lookup/trains/ntes")
async def railradar_lookup_trains():
    """
    Fetch all verified trains available in RailRadar / NTES catalogue (cached server-side).
    """
    res = await railradar_service.lookup_ntes_trains()
    if not res.get("success") and res.get("status_code", 500) != 200:
        raise HTTPException(status_code=res.get("status_code", 500), detail=res.get("error", {}).get("message", "RailRadar error"))
    return res

@app.get("/api/railradar/trains/{train_number}")
async def railradar_train_details(train_number: str):
    """
    Fetch official schedule, station halts, distances, and coach positions.
    """
    res = await railradar_service.get_train_details(train_number)
    if not res.get("success") and res.get("status_code", 500) != 200:
        raise HTTPException(status_code=res.get("status_code", 500), detail=res.get("error", {}).get("message", "RailRadar error"))
    return res

@app.get("/api/railradar/trains/{train_number}/route")
async def railradar_train_route(train_number: str):
    """
    Fetch official GeoJSON track geometry for train route.
    """
    res = await railradar_service.get_train_route_geometry(train_number)
    if not res.get("success") and res.get("status_code", 500) != 200:
        raise HTTPException(status_code=res.get("status_code", 500), detail=res.get("error", {}).get("message", "RailRadar error"))
    return res

@app.get("/api/railradar/trains/{train_number}/live")
async def railradar_train_live(train_number: str):
    """
    Fetch live train status, delay, speed, and real-time station progression.
    """
    res = await railradar_service.get_train_live_status(train_number)
    if not res.get("success") and res.get("status_code", 500) != 200:
        raise HTTPException(status_code=res.get("status_code", 500), detail=res.get("error", {}).get("message", "RailRadar error"))
    return res

@app.post("/api/railradar/trains/{train_number}/sync")
async def railradar_sync_train(train_number: str):
    """
    Synchronizes verified RailRadar train record and coach composition into Supabase database.
    """
    res = await railradar_service.sync_train_to_supabase(train_number)
    if not res.get("success"):
        raise HTTPException(status_code=500, detail=res.get("error", {}).get("message", "Database synchronization failed"))
    return res

# ==============================================================================
# RAILCORE & QRAIL DUAL RAILWAY PROVIDER ENDPOINTS (SERVER-SIDE GATEWAY)
# ==============================================================================

@app.get("/api/railway/providers/status")
async def railway_providers_status():
    """
    Unified diagnostic status across RailCore, Qrail, and RailRadar providers.
    Never exposes raw API keys.
    """
    return await dual_railway_gateway.get_all_providers_status()

@app.get("/api/railcore/status")
async def railcore_status():
    """RailCore server-side connection and configuration status."""
    return await railcore_service.get_status()

@app.get("/api/railcore/trains/{train_number}/schedule")
async def railcore_train_schedule(train_number: str):
    """Fetch train schedule and station halts from RailCore."""
    res = await railcore_service.get_train_schedule(train_number)
    if not res.get("success") and res.get("status_code", 500) != 200:
        raise HTTPException(status_code=res.get("status_code", 500), detail=res.get("error", {}).get("message", "RailCore error"))
    return res

@app.get("/api/railcore/trains/{train_number}/coach-position")
async def railcore_coach_position(train_number: str):
    """Fetch coach composition order from RailCore."""
    res = await railcore_service.get_coach_position(train_number)
    if not res.get("success") and res.get("status_code", 500) != 200:
        raise HTTPException(status_code=res.get("status_code", 500), detail=res.get("error", {}).get("message", "RailCore error"))
    return res

@app.get("/api/railcore/stations/{station_code}")
async def railcore_station_info(station_code: str):
    """Fetch station details from RailCore."""
    res = await railcore_service.get_station_info(station_code)
    if not res.get("success") and res.get("status_code", 500) != 200:
        raise HTTPException(status_code=res.get("status_code", 500), detail=res.get("error", {}).get("message", "RailCore error"))
    return res

@app.get("/api/qrail/status")
async def qrail_status():
    """Qrail server-side connection and configuration status."""
    return await qrail_service.get_status()

@app.get("/api/qrail/trains/{train_number}/schedule")
async def qrail_train_schedule(train_number: str):
    """Fetch train schedule from Qrail."""
    res = await qrail_service.get_train_schedule(train_number)
    if not res.get("success"):
        raise HTTPException(status_code=res.get("status_code", 401), detail=res.get("error", {}).get("message", "Qrail error"))
    return res

@app.get("/api/qrail/trains/between/{from_st}/{to_st}")
async def qrail_trains_between(from_st: str, to_st: str):
    """Fetch trains between stations from Qrail."""
    res = await qrail_service.get_trains_between_stations(from_st, to_st)
    if not res.get("success"):
        raise HTTPException(status_code=res.get("status_code", 401), detail=res.get("error", {}).get("message", "Qrail error"))
    return res

@app.get("/api/qrail/trains/{train_number}/live")
@app.get("/api/qrail/trains/{train_number}/running")
async def qrail_live_status(train_number: str):
    """
    Fetch running status from Qrail.
    Surfaces plan tier constraints (Pro tier required for live running).
    """
    res = await qrail_service.get_live_running_status(train_number)
    if not res.get("success") and res.get("code") != "PLAN_RESTRICTION" and res.get("error", {}).get("code") != "PLAN_RESTRICTION":
        raise HTTPException(status_code=res.get("status_code", 401), detail=res.get("error", {}).get("message", "Qrail error"))
    return res

@app.get("/api/railway/trains/{train_number}/multi-provider")
async def get_train_multi_provider(train_number: str, preferred_provider: str = "auto"):
    """
    Fetches train data with cross-provider conflict detection and source attribution.
    """
    res = await dual_railway_gateway.get_train_multi_provider(train_number, preferred_provider)
    return res

@app.post("/api/railway/trains/{train_number}/sync")
async def sync_train_gateway(train_number: str, provider_name: str, train_name: str, from_st: str, to_st: str):
    """
    Idempotent sync to Supabase database preserving provenance metadata.
    """
    res = await dual_railway_gateway.sync_train_to_supabase(train_number, provider_name, train_name, from_st, to_st)
    if not res.get("success"):
        raise HTTPException(status_code=500, detail=res.get("error", {}).get("message", "Sync failed"))
    return res

# ==============================================================================
# RAILKIT DEVELOPER API ENDPOINTS (api.railkit.in)
# ==============================================================================

@app.get("/api/railkit/status")
async def get_railkit_status():
    """
    Returns sanitized RailKit API status, masked key, and plan diagnostics.
    """
    return await railkit_service.get_status()

@app.get("/api/railkit/validate")
async def validate_railkit_key(force_refresh: bool = False):
    """
    Live validation of RAILKIT_API_KEY against api.railkit.in.
    Honest reporting of plan requirements (HTTP 403 / Missing signature headers).
    """
    return await railkit_service.validate_credentials(force_refresh=force_refresh)

@app.get("/api/railkit/trains/{train_number}/info")
async def get_railkit_train_info(train_number: str):
    """
    Queries train information from RailKit API.
    """
    res = await railkit_service.get_train_info(train_number)
    if not res.get("success"):
        raise HTTPException(
            status_code=res.get("status_code", 403 if "PLAN" in str(res.get("error")) or "headers" in str(res.get("error")) else 400),
            detail=res.get("error", {}).get("message", "RailKit API query failed")
        )
    return res

@app.get("/api/railkit/stations/{station_code}/live")
async def get_railkit_station_live(station_code: str, hours: int = 4):
    """
    Queries live station board from RailKit API.
    """
    res = await railkit_service.get_station_live(station_code, hours)
    if not res.get("success"):
        raise HTTPException(
            status_code=res.get("status_code", 400),
            detail=res.get("error", {}).get("message", "RailKit live station query failed")
        )
    return res

@app.post("/api/railkit/import/train/{train_number}")
async def import_train_from_railkit(train_number: str):
    """
    Imports train from RailKit API with strict duplicate prevention.
    Validates API key and plan before attempting import.
    """
    val = await railkit_service.validate_credentials()
    if not val.get("authenticated"):
        raise HTTPException(
            status_code=403 if val.get("status") == "UPGRADE_PLAN_REQUIRED" else 401,
            detail=f"Cannot import from RailKit: {val.get('message')}"
        )
    res = await railway_directory_service.sync_train_to_supabase(train_number, prefer_provider="railkit")
    return res

# ==============================================================================
# ALL-INDIA RAILWAY DIRECTORY & SEARCH ENDPOINTS
# ==============================================================================

@app.get("/api/railway/directory/states")
async def get_indian_states_and_cities():
    """
    Returns all 28 Indian States & 8 Union Territories with major railway cities.
    """
    return await railway_directory_service.get_states_and_cities()

@app.get("/api/railway/directory/stations")
async def search_indian_stations(
    query: str = "",
    state: str = "All",
    city: str = "All",
    limit: int = 50,
    offset: int = 0
):
    """
    Paginated station search across authentic Indian railway stations, zones, and cities.
    """
    return await railway_directory_service.search_stations(
        query=query,
        state=state,
        city=city,
        limit=limit,
        offset=offset
    )

@app.get("/api/railway/trains/search")
async def search_all_india_trains(query: str = "", limit: int = 50, offset: int = 0):
    """
    Fast paginated sub-millisecond search across the 11,410 authentic NTES trains from RailRadar.
    """
    return await railway_directory_service.search_trains(query=query, limit=limit, offset=offset)

@app.get("/api/railway/trains/{train_number}/full-details")
async def get_all_india_train_full_details(train_number: str):
    """
    Returns unified real train details:
    - Route halts, distance, platforms from RailCore
    - Rake coach formation from RailCore
    - Live running delay & speed from RailRadar
    - Explicit provenance tags separating real API data from simulated sensor load
    """
    res = await railway_directory_service.get_full_train_details(train_number)
    return res

@app.post("/api/railway/sync/train/{train_number}")
async def sync_railway_train(train_number: str, prefer_provider: str = "auto"):
    """
    Idempotent synchronization of train schedule and authentic coach formation into Supabase.
    """
    res = await railway_directory_service.sync_train_to_supabase(train_number, prefer_provider)
    if not res.get("success"):
        raise HTTPException(status_code=500, detail=res.get("error", {}).get("message", "Sync failed"))
    return res

@app.get("/api/railway/sync/status")
async def get_railway_sync_status():
    """
    Diagnostics and synchronization audit logs for Admin Dashboard.
    """
    return await railway_directory_service.get_sync_status()

@app.post("/api/auth/register")
async def register_account(payload: dict):
    """
    Unified user registration endpoint with RFC 5322 compatible email validation,
    Supabase Admin API provisioning, instant passenger confirmation, and staff review staging.
    """
    res = await auth_service.register_user(payload)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("message", "Registration failed"))
    return res

@app.get("/api/auth/validate-email")
def validate_email_format(email: str):
    """
    Validates email format across Gmail, Yahoo, Outlook, Hotmail, Edu, Corporate.
    """
    clean = normalize_email(email)
    valid = is_valid_email(clean)
    return {
        "email": clean,
        "valid": valid,
        "message": "Valid email format" if valid else "Invalid email format"
    }

# --- Hardware Integration & ESP32 / HX711 Telemetry Endpoints ---
@app.get("/api/hardware/spec")
def get_hardware_specification():
    """
    Returns official RDSO hardware integration specification, pinouts, and ADC limits.
    """
    return hardware_gateway.get_hardware_specification()

@app.get("/api/hardware/devices")
def list_hardware_devices():
    """
    Returns registered ESP32 bogie sensor controllers and certified telemetry status.
    """
    return hardware_gateway.list_devices()

@app.post("/api/hardware/devices/register")
def register_hardware_device(req: DeviceRegistrationRequest):
    """
    Registers a new ESP32 controller with unique device ID, coach assignment, and auth token.
    """
    return hardware_gateway.register_device(req)

@app.post("/api/hardware/heartbeat")
def device_heartbeat(
    packet: DeviceHeartbeatPacket,
    authorization: Optional[str] = Header(None),
    x_device_token: Optional[str] = Header(None)
):
    """
    Heartbeat ping from ESP32 to maintain device online status and monitor battery/RSSI.
    """
    token = x_device_token or authorization
    return hardware_gateway.handle_heartbeat(packet, token)

@app.post("/api/hardware/telemetry/ingest")
def ingest_hardware_telemetry(
    packet: HardwareTelemetryPacket,
    authorization: Optional[str] = Header(None),
    x_device_token: Optional[str] = Header(None)
):
    """
    Ingests live 24-bit ADC telemetry from physical ESP32 / HX711 controllers,
    detects sensor saturation/faults, validates sequence & auth, and tags data with provenance.
    """
    token = x_device_token or authorization
    res = hardware_gateway.ingest_packet(packet, token)
    if not res.get("success", True) and res.get("status_code") in (401, 429):
        raise HTTPException(status_code=res["status_code"], detail=res.get("message"))
    return res

@app.post("/api/hardware/calibration/zero")
def record_zero_calibration(req: ZeroCalibrationRequest):
    """
    Step 4 of Administrator Calibration: Records zero-load tare offset on empty coach.
    """
    res = hardware_gateway.record_zero_calibration(req)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res

@app.post("/api/hardware/calibration/calibrate")
def execute_scale_calibration(req: ScaleCalibrationRequest):
    """
    Steps 5-10 of Administrator Calibration: Calculates scale factors from known reference weight,
    verifies <= 0.5% tolerance, and issues calibration certificate.
    """
    res = hardware_gateway.execute_scale_calibration(req)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res

@app.get("/api/hardware/calibration/history")
def get_calibration_history(device_id: Optional[str] = Query(None)):
    """
    Returns full calibration audit trail.
    """
    return hardware_gateway.get_calibration_history(device_id)

@app.get("/api/hardware/alerts")
def list_hardware_alerts(limit: int = Query(50)):
    """
    Returns latest active hardware faults and safety alerts.
    """
    return hardware_gateway.list_alerts(limit)

@app.post("/api/hardware/alerts/{alert_id}/ack")
def acknowledge_hardware_alert(alert_id: str):
    """
    Marks a safety alert as acknowledged by operations staff.
    """
    ack = hardware_gateway.acknowledge_alert(alert_id)
    return {"success": ack, "alert_id": alert_id}

@app.get("/api/hardware/telemetry/latest")
def get_latest_hardware_telemetry(device_id: Optional[str] = Query(None)):
    """
    Returns latest telemetry packets recorded for registered physical and test devices.
    """
    return hardware_gateway.get_latest_telemetry(device_id)

@app.get("/api/hardware/coaches/{train_number}/{coach_no}/fused")
def get_coach_fused_telemetry(train_number: str, coach_no: str):
    """
    Returns latest fused load and telemetry for a specific train coach.
    """
    data = hardware_gateway.get_coach_fused_telemetry(train_number, coach_no)
    if not data:
        raise HTTPException(status_code=404, detail=f"No telemetry available for Train {train_number} Coach {coach_no}")
    return data

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
