# REST API SPECIFICATION & MICROSERVICE DOCUMENTATION
## Smart Live Weight Tracker – Railway Passenger Coach Weight Monitoring & Crowd Management System

**Author:** Tirthesh Vaijnath Gutte  
**GitHub:** [https://github.com/tirthesh1104](https://github.com/tirthesh1104)  
**Target Repository:** [https://github.com/tirthesh1104/Smart-Live-Weight-Tracker](https://github.com/tirthesh1104/Smart-Live-Weight-Tracker)  
**Microservice Framework:** FastAPI 0.110.0 (Python 3.11+)  
**Interactive Swagger UI:** `http://localhost:8000/docs`  
**OpenAPI Specification:** `http://localhost:8000/openapi.json`  

---

## 1. Global Microservice Overview

The backend microservice provides computational intelligence, rolling stock mass calculation, Holt-Winters double exponential smoothing predictions, and a multi-provider fallback gateway to Indian Railways information.

### Base Configuration
* **Default Host & Port**: `http://127.0.0.1:8000`
* **Content-Type**: `application/json`
* **CORS Policy**: Configured to accept cross-origin requests from Vite development origins (`http://localhost:5173`, `http://127.0.0.1:5173`) and production domains.
* **Provenance Watermarking**: All responses returning simulated weights or synthetic forecasts include mandatory metadata:
  ```json
  "provenance": "SIMULATED DATA",
  "hardware_connected": false,
  "confidence_score": 0.946
  ```

---

## 2. API Endpoints Catalog

### 2.1 System Health & Service Readiness
```http
GET /health
```
Returns system uptime, microservice version, and database connection readiness.

#### Response Example (`200 OK`)
```json
{
  "status": "healthy",
  "version": "2.4.0",
  "service": "Smart Live Weight Tracker Intelligence Engine",
  "timestamp": "2026-11-15T09:30:00Z",
  "database_connected": true,
  "simulation_mode": true
}
```

---

### 2.2 Telemetry Ingestion & Bogie Safety Calculation
```http
POST /api/v1/telemetry/ingest
```
Ingests a single simulated telemetry frame from a coach, calculates tare differentials, verifies lateral balance ratios, and returns safety classifications.

#### Request Payload
```json
{
  "train_id": "12101",
  "coach_id": "S2",
  "coach_type": "SL",
  "tare_weight_kg": 40500.0,
  "bogie_1_weight_kg": 26800.0,
  "bogie_2_weight_kg": 27200.0,
  "timestamp": "2026-11-15T09:30:00Z"
}
```

#### Response Example (`200 OK`)
```json
{
  "status": "success",
  "train_id": "12101",
  "coach_id": "S2",
  "gross_weight_kg": 54000.0,
  "payload_weight_kg": 13500.0,
  "estimated_passengers": 180,
  "occupancy_percentage": 105.88,
  "bogie_unbalance_ratio": 0.74,
  "crowd_status": "Overloaded",
  "overload_alert_triggered": true,
  "alert_severity": "critical",
  "provenance": "SIMULATED DATA"
}
```

---

### 2.3 AI Crowd Occupancy Forecasting
```http
POST /api/v1/predict/occupancy
```
Executes Holt-Winters double exponential smoothing over a historical series of occupancy percentages to project 15m, 30m, and 60m future loads.

#### Request Payload
```json
{
  "train_id": "12101",
  "coach_id": "S2",
  "recent_occupancy_history": [45.2, 52.0, 58.4, 66.1, 74.5, 85.0, 92.3, 98.7],
  "horizons_minutes": [15, 30, 60],
  "alpha": 0.35,
  "beta": 0.15
}
```

#### Response Example (`200 OK`)
```json
{
  "train_id": "12101",
  "coach_id": "S2",
  "algorithm": "Holt-Winters Double Exponential Smoothing (Additive)",
  "forecasts": [
    {
      "horizon_minutes": 15,
      "predicted_occupancy": 104.2,
      "crowd_status": "Overloaded",
      "confidence_lower": 99.8,
      "confidence_upper": 108.6
    },
    {
      "horizon_minutes": 30,
      "predicted_occupancy": 109.8,
      "crowd_status": "Critical",
      "confidence_lower": 103.4,
      "confidence_upper": 116.2
    },
    {
      "horizon_minutes": 60,
      "predicted_occupancy": 82.5,
      "crowd_status": "Moderate",
      "confidence_lower": 74.0,
      "confidence_upper": 91.0
    }
  ],
  "metrics": {
    "mae": 1.48,
    "rmse": 2.12,
    "confidence_score": 0.946
  },
  "provenance": "SIMULATED DATA"
}
```

---

### 2.4 All-India Train Search & Route Explorer
```http
GET /api/v1/railway/trains/{train_number}
```
Queries train schedule and formation using the multi-provider cascade (RailRadar ➔ RailCore ➔ Qrail ➔ RailKit ➔ Offline Fallback).

#### Parameters
* `train_number` (Path, String): 5-digit Indian Railway train identifier (e.g. `12101`).

#### Response Example (`200 OK`)
```json
{
  "train_number": "12101",
  "train_name": "Jnaneswari Super Deluxe Express",
  "origin_code": "LTT",
  "origin_name": "Mumbai Lokmanya Tilak Terminus",
  "destination_code": "SHM",
  "destination_name": "Kolkata Shalimar",
  "total_distance_km": 1948,
  "coach_count": 22,
  "provider": "RailRadar (Cascade Level 1)",
  "is_cached": false,
  "stops": [
    {
      "station_code": "LTT",
      "station_name": "Lokmanya Tilak Terminus",
      "day": 1,
      "departure_time": "20:35",
      "platform": "4"
    },
    {
      "station_code": "KYN",
      "station_name": "Kalyan Junction",
      "day": 1,
      "arrival_time": "21:12",
      "departure_time": "21:15",
      "platform": "4"
    }
  ]
}
```

---

### 2.5 Station Search & Junction Autocomplete
```http
GET /api/v1/railway/stations/search?q={query}
```
Searches Indian railway stations by code or town name with fuzzy matching.

#### Parameters
* `q` (Query, String): Station search keyword (e.g. `PUNE`, `Mumbai`, `NDLS`).

#### Response Example (`200 OK`)
```json
{
  "query": "PUNE",
  "results_count": 1,
  "stations": [
    {
      "station_code": "PUNE",
      "station_name": "Pune Junction",
      "division": "Pune",
      "zone": "Central Railway (CR)",
      "platforms": 6,
      "current_crowd_index": "Moderate (62%)"
    }
  ]
}
```

---

### 2.6 Academic Viva Metric Export
```http
GET /api/v1/reports/viva-metrics
```
Returns direct diagnostic tables of algorithm error metrics for academic review.

#### Response Example (`200 OK`)
```json
{
  "model_family": "Time-Series Exponential Smoothing",
  "target_horizon": "15, 30, 60 minutes",
  "dataset_evaluated": "Standard 10-Scenario Controlled Simulation",
  "sample_points": 1000,
  "evaluation_metrics": {
    "mae_percentage": 1.48,
    "rmse_percentage": 2.12,
    "mape_percentage": 2.84,
    "r_squared": 0.962,
    "confidence_rating": "94.6%"
  },
  "verified_by": "Automated pytest suite"
}
```

---

## 3. Standard HTTP Error Responses

| Status Code | Meaning | Example Scenario |
| :---: | :--- | :--- |
| `400 Bad Request` | Malformed payload or validation error | Negative weight values or invalid coach class code. |
| `404 Not Found` | Entity does not exist | Invalid 5-digit train number not found across all providers. |
| `422 Unprocessable` | Pydantic model validation failure | Missing required timestamp or numeric string where float required. |
| `500 Server Error` | Unhandled microservice exception | Graceful JSON error emitted with trace ID. |

---
*REST API documentation maintained by Tirthesh Vaijnath Gutte.*
