# Known Limitations, Constraints & Research Boundaries
## Smart Live Weight Tracker – Honest Technical Disclosures

---

### 1. Purpose of Honest Disclosure

In compliance with academic integrity, engineering ethics, and railway safety standards, this document explicitly records the operational boundaries, technical assumptions, and current limitations of the **Smart Live Weight Tracker** system.

---

### 2. Sensor Telemetry & Cyber-Physical Interfacing

* **Simulated Telemetry Streams:**  
  Current sensor data streams (strain gauge voltages, optical IR pulses, CCTV bounding box densities) are generated via calibrated mathematical simulators that model passenger boarding physics, random surge events, and electronic noise. While production-ready adapter abstractions (`RS485SensorAdapter`, `ModbusSensorAdapter`, `MqttSensorAdapter`) are implemented in Python, direct physical strain gauge transducers on real rolling stock bogies were not deployed during this phase.
* **Physical Weight Verification Notice:**  
  All output payloads are explicitly labeled with:
  ```json
  "physical_weight_status": "PHYSICAL_WEIGHT_NOT_VERIFIED"
  ```
  The values represent algorithmically fused approximations, not certified commercial weighbridge measurements. Legal metrology calibration under Weights & Measures Act standards must precede real revenue service deployment.

---

### 3. Railway Information Systems (CRIS) Integration

* **Absence of Direct CRIS / UTS / PRS Feed:**  
  The system operates as an independent edge and station platform layer. It does not possess a direct, authenticated interface to the proprietary Indian Railways Centre for Railway Information Systems (CRIS) core mainframe, Unreserved Ticketing System (UTS), or Passenger Reservation System (PRS).
* **Synthetic Timetable Data:**  
  Train schedules, rake compositions (12-car/15-car EMU), and route itineraries are populated via local database seeds reflecting realistic Mumbai Suburban and Central Railway operations.

---

### 4. Machine Learning & Forecasting Scope

* **Exclusion of Triple Seasonal Holt-Winters:**  
  Full Triple Seasonal Holt-Winters was evaluated but deliberately not deployed for edge forecasting. Edge microservices frequently initialize without the minimum 24–48 hours of continuous rolling stock telemetry required for seasonal decomposition. Attempting seasonal fit on sparse samples leads to explosive variance and numerical instability. Double Exponential Smoothing (Holt's Linear) with analytical confidence intervals was chosen for superior mathematical stability.
* **Non-Equilibrium Commuter Dynamics:**  
  Sudden external perturbations (e.g., sudden cancellations of preceding trains, track closures, or festival surges) cannot be predicted purely from single-train historical weight time-series without external network-wide event correlation.

---

### 5. Telecommunications & External SMS / WhatsApp Gateways

* **External Notification Gateways:**  
  When an incident or emergency notification is triggered, the system updates real-time UI banners, app notifications, and database audit logs. External carrier SMS or WhatsApp Business API dispatches display an honest badge:
  ```
  [Integration Not Configured - Academic Prototype]
  ```
  The system deliberately avoids displaying simulated "SMS Sent Successfully" dialogs when carrier credentials are not configured.

---

### 6. Cloud Persistence & Supabase Tier

* **PostgreSQL Cloud Connection:**  
  The remote Supabase instance operates under standard development tiers. Under extreme stress-testing exceeding 500 concurrent writes/sec, connection pool saturation may occur. In such scenarios, the client's local offline sync queue buffers transactions gracefully without data loss.
