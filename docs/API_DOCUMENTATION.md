# API Documentation & Interface Specification
## Smart Live Weight Tracker – FastAPI Microservice REST Endpoints

---

### 1. Overview & Service Metadata
* **Base URL:** `http://127.0.0.1:8000`
* **Protocol:** HTTP/1.1 REST with JSON Payload / HTTPS in production
* **Service Framework:** FastAPI (Python 3.13) with Pydantic v2 data validation
* **Interactive Documentation:** Available at `http://127.0.0.1:8000/docs` (Swagger UI) and `http://127.0.0.1:8000/redoc` (ReDoc)

---

### 2. Endpoint Index

| Method | Endpoint | Description | Auth Scope |
|:---|:---|:---|:---|
| `GET` | `/health` | Microservice health check & telemetry | Public |
| `GET` | `/api/system/status` | Model status, memory, and engine diagnostics | Public |
| `POST` | `/predict` | Time-series weight & crowd occupancy forecast | Public / Client |
| `POST` | `/delta-sync` | Safety-aware edge delta synchronization filter | Edge / Node |
| `POST` | `/sensor-fusion` | Tri-sensor weighted calculation & anomaly check | Sensor Gateway |
| `POST` | `/crowd-balance` | Rake load balancing & platform pillar bay guidance | Station / Train |
| `POST` | `/recommend-coach`| Targeted optimal coach boarding recommendation | Passenger UI |

---

### 3. Detailed Endpoint Specifications

#### 3.1 `GET /health`
Returns microservice status, uptime, host environment, and version.
* **Response `200 OK`:**
```json
{
  "status": "healthy",
  "version": "2.1.0",
  "service": "railway-weight-crowd-ml-backend",
  "environment": "academic_demonstration_prototype",
  "models_loaded": {
    "forecasting": "HoltLinear_AnalyticalCI",
    "sensor_fusion": "TriSensor_WeightedFusion_v2",
    "crowd_balancing": "BayAware_RakeBalancer_v1"
  }
}
```

---

#### 3.2 `GET /api/system/status`
Comprehensive operational diagnostics.
* **Response `200 OK`:**
```json
{
  "backend_status": "ONLINE",
  "fastapi_version": "0.115.x",
  "python_version": "3.13.x",
  "ml_engine_ready": true,
  "sensor_fusion_ready": true,
  "crowd_balancer_ready": true,
  "data_disclaimer": "SOFTWARE_DERIVED_PROTOTYPE - Physical sensors simulated via calibrated harnesses"
}
```

---

#### 3.3 `POST /predict`
Executes Double Exponential Smoothing (Holt's Linear) over historical weight series to forecast future load across 15, 30, and 60-minute horizons.

* **Request Body (`ForecastRequest`):**
```json
{
  "coach_id": "C-101",
  "historical_weights": [14200.5, 14500.0, 14850.2, 15100.8, 15400.0, 15650.4, 15900.0],
  "timestamps": [
    "2026-11-13T10:00:00Z",
    "2026-11-13T10:05:00Z",
    "2026-11-13T10:10:00Z",
    "2026-11-13T10:15:00Z",
    "2026-11-13T10:20:00Z",
    "2026-11-13T10:25:00Z",
    "2026-11-13T10:30:00Z"
  ],
  "tare_weight": 12000.0,
  "max_capacity_kg": 20000.0,
  "average_passenger_weight_kg": 68.0
}
```

* **Response Body (`ForecastResponse`):**
```json
{
  "coach_id": "C-101",
  "model_used": "Holt_Linear_Analytical_CI",
  "predictions": [
    {
      "horizon_minutes": 15,
      "predicted_gross_weight": 16750.2,
      "predicted_net_payload": 4750.2,
      "predicted_occupancy": 70,
      "confidence_interval_95": [16230.1, 17270.3],
      "confidence_score": 0.88,
      "status": "MODERATE_LOAD"
    },
    {
      "horizon_minutes": 30,
      "predicted_gross_weight": 17600.5,
      "predicted_net_payload": 5600.5,
      "predicted_occupancy": 82,
      "confidence_interval_95": [16850.0, 18351.0],
      "confidence_score": 0.76,
      "status": "HEAVY_LOAD"
    },
    {
      "horizon_minutes": 60,
      "predicted_gross_weight": 19300.0,
      "predicted_net_payload": 7300.0,
      "predicted_occupancy": 107,
      "confidence_interval_95": [18100.0, 20500.0],
      "confidence_score": 0.58,
      "status": "CRUSH_LOAD_WARNING"
    }
  ],
  "benchmark_metrics": {
    "mae": 142.3,
    "rmse": 189.5,
    "mape_percent": 1.12
  },
  "data_origin": "SIMULATED_DATASET_VALIDATED"
}
```

---

#### 3.4 `POST /delta-sync`
Evaluates weight mutations at the edge to suppress redundant polling unless critical safety thresholds or sensor health transitions occur.

* **Safety Invariant:** Overload events ($>85\%$ rated capacity), sensor status transitions, and sequence resets are **NEVER suppressed**.
* **Request Body (`DeltaSyncRequest`):**
```json
{
  "coach_id": "C-101",
  "current_weight": 18200.0,
  "last_synced_weight": 17500.0,
  "threshold_kg": 200.0,
  "threshold_percentage": 2.0,
  "sequence_number": 42,
  "last_seen_sequence_number": 41,
  "max_capacity_kg": 20000.0,
  "sensor_status": "NORMAL",
  "previous_sensor_status": "NORMAL"
}
```

* **Response Body (`DeltaSyncResponse`):**
```json
{
  "should_sync": true,
  "reason": "SAFETY_OVERLOAD_TRIGGER",
  "delta_kg": 700.0,
  "delta_percent": 3.89,
  "sequence_status": "IN_ORDER",
  "is_critical_event": true
}
```

---

#### 3.5 `POST /sensor-fusion`
Fuses inputs from bogie strain gauges ($65\%$), optical IR door counters ($20\%$), and CCTV overhead density ($15\%$).

* **Request Body (`SensorFusionRequest`):**
```json
{
  "coach_id": "C-101",
  "strain_gauge_weight_kg": 16400.0,
  "optical_ir_passenger_count": 62,
  "cctv_passenger_count": 65,
  "tare_weight_kg": 12000.0,
  "max_capacity_kg": 20000.0,
  "average_passenger_weight_kg": 68.0
}
```

* **Response Body (`SensorFusionResponse`):**
```json
{
  "coach_id": "C-101",
  "fused_occupancy": 64,
  "fused_net_payload_kg": 4352.0,
  "fused_gross_weight_kg": 16352.0,
  "occupancy_percentage": 58.0,
  "physical_weight_status": "PHYSICAL_WEIGHT_NOT_VERIFIED",
  "anomaly_detected": false,
  "anomaly_reasons": [],
  "weights_applied": {
    "strain_gauge": 0.65,
    "optical_ir": 0.20,
    "cctv": 0.15
  },
  "hardware_adapter_spec": "RS485_MODBUS_COMPLIANT"
}
```

---

#### 3.6 `POST /crowd-balance`
Computes real-time rake load variance and yields platform pillar-bay boarding directives with dual-language Marathi and English audio scripts.

* **Request Body:** Array of coach occupancy states across the train rake.
* **Response Body:** Per-coach recommendations, pillar bay mapping (e.g., `Pillars 1-2` for Coach 1, `Pillars 3-4` for Coach 2), and bilingual audio announcement text.

---

#### 3.7 `POST /recommend-coach`
Given a commuter's current platform position and accessibility preferences, returns the optimal coach to board to minimize congestion and physical walking distance.
