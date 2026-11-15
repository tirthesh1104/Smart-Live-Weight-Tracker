# Project Overview: Smart Live Weight Tracker
## Railway Passenger Coach Weight Monitoring, Crowd Management & Passenger Safety System

---

### 1. Executive Summary & Purpose
The **Smart Live Weight Tracker** is an intelligent cyber-physical software platform designed for railway operations to dynamically monitor passenger coach weights, prevent catastrophic over-crowding, forecast short-term passenger influx, balance loads across train rakes, and enhance platform-level safety for suburban (EMU/MEMU) and long-distance passenger services.

Overcrowding in passenger rail systems presents severe operational risks, including structural bogie fatigue, suspension degradation, extended dwell times, stampede hazards at platform bottlenecks, and compromised braking distance. This system provides real-time visibility into rolling stock payload and platform passenger distribution, replacing static timetable assumptions with data-driven operational intelligence.

> **Operational Status Disclosure:**  
> This system is an **Independent Academic, Technical Evaluation & Research Prototype**. Sensor inputs are processed via calibrated software simulators and hardware-ready interface adapters (RS-485/Modbus/MQTT). It does not interface directly with Indian Railways' live CRIS (Centre for Railway Information Systems) UTS/PRS backend infrastructure.

---

### 2. Operational Context: Indian Railways Network
The system addresses unique challenges observed across suburban corridors (e.g., Mumbai Suburban Network, Chennai Suburban, Kolkata Suburban) and non-suburban Mail/Express rakes:
* **Unreserved & Dense Commuter Traffic:** Passenger boarding cannot be regulated through seat reservations alone. Actual occupancy often exceeds 200% to 300% of nominal seated capacity during peak hours ("Super Dense Crush Load").
* **Structural Safety Hazards:** Asymmetric passenger distribution causes uneven bolster spring compression, axle-box overheating, and brake wear disparities.
* **Platform Ingestion Inefficiencies:** Passengers cluster at central platform staircases, leading to severe localized coach crowding while end coaches (motor/trailer cabs) remain underutilized.

---

### 3. Core System Capabilities

| Capability | Technical Description | Operational Impact |
|:---|:---|:---|
| **Multi-Source Sensor Fusion** | Calibrated weighted combination of bogie strain sensors (65%), optical bidirectional door beams (20%), and CCTV density estimates (15%). | Resilient real-time payload estimation robust against single-sensor occlusions or drift. |
| **Edge-to-Cloud Delta Sync** | Adaptive edge transmission protocol with sequence-checked suppression and safety-critical bypass. | 72%+ bandwidth conservation while guaranteeing zero latency for overload alerts (>85% capacity). |
| **Time-Series ML Forecasting** | Double exponential smoothing (Holt's Linear) with analytical 95% confidence intervals forecasting 15, 30, and 60 minutes ahead. | Proactive station congestion alerts before trains arrive at downstream platforms. |
| **Dynamic Crowd Balancing** | Physics-aware coach load distribution coupled with physical platform pillar-bay passenger guidance (e.g., Pillar 1–2 for Coach 1). | Balances train center-of-gravity and reduces station dwell time by diverting boarding commuters. |
| **Bilingual Station Messaging** | Dual-language visual signage and automated public announcement scripts in Marathi (मराठी) and English. | Inclusive passenger accessibility aligned with local regional railway communications. |
| **Resilient Offline Architecture** | Browser IndexedDB / localStorage queue with bidirectional idempotency and conflict resolution against remote Supabase PostgreSQL. | Zero data loss during trackside or tunnel network connectivity outages. |

---

### 4. System Boundaries & Explicit Scope Disclaimers

1. **Hardware Inputs:** Sensor data streams are generated via mathematical and behavioral simulation harnesses that emulate standard load-cell strain gauges and industrial optical beam counters. Clean adapter abstractions (`RS485SensorAdapter`, `ModbusSensorAdapter`, `MqttSensorAdapter`) are provided for physical deployment.
2. **Physical Weight Validation:** Readings are tagged with `PHYSICAL_WEIGHT_NOT_VERIFIED` to ensure that software estimations are not mistaken for certified weighbridge measurements until physical calibration is conducted.
3. **Emergency Dispatches:** Incident reporting routes trigger real-time internal alerts, structured audit logs, and on-screen guidance. External SMS/WhatsApp telecommunication gateways display honest "Integration Not Configured" status badges rather than false delivery confirmations.

---

### 5. Architectural High-Level Topology

```
+-----------------------------------------------------------------------------------+
|                            PHYSICAL TRACKSIDE / TRAIN                             |
|  [Bogie Strain Gauges]     [Bi-directional IR Beams]     [CCTV Overhead Density]  |
|         (65%)                       (20%)                         (15%)           |
+------------------------------------------+----------------------------------------+
                                           | RS-485 / Modbus / MQTT
                                           v
+-----------------------------------------------------------------------------------+
|                        FASTAPI ANALYTICS ENGINE (Port 8000)                       |
|   - Multi-Sensor Fusion Engine (Anomaly Detection & Graceful Fallback)            |
|   - Holt's Linear Predictive Engine (Analytical 95% Confidence Bounds)            |
|   - Dynamic Crowd Balancer (Platform Pillar-Bay Mapping & Bilingual Audio)        |
|   - Delta Synchronization Filter (Sequence Checking & Safety-Bypass Guard)        |
+------------------------------------------+----------------------------------------+
                                           | HTTPS / JSON REST
                                           v
+-----------------------------------------------------------------------------------+
|                       REACT + TYPESCRIPT DASHBOARDS (Port 5173)                   |
|   - Station Master / Admin Dashboard (Secure SHA-256 PIN Verification)            |
|   - Railway Staff / Guard / TTE Terminal (Coach Safety, Anomaly & Inspections)    |
|   - Passenger Guidance Dashboard (Bilingual Capacity & Pillar Bay Direction)      |
|   - Public Display Board Interface (High-Contrast Real-Time Trackside HUD)        |
+------------------------------------------+----------------------------------------+
                                           | Row Level Security (RLS)
                                           v
+-----------------------------------------------------------------------------------+
|                      SUPABASE POSTGRESQL CLOUD PERSISTENCE                        |
|   - 18 Normalized Relational Tables (Readings, Anomaly Logs, Rakes, Audit Logs)   |
|   - Local Idempotent Sync Queue (Bidirectional Conflict Arbitration)              |
+-----------------------------------------------------------------------------------+
```
