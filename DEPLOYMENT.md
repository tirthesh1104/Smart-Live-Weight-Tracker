# Deployment & Hardware Integration Guide
## Smart Live Weight Tracker – Railway Crowd Monitoring System

This document outlines deployment procedures for cloud production environments and future physical bogie sensor hardware integration.

---

## 1. Frontend Production Deployment

### Vercel / Netlify
1. Connect your Git repository.
2. Build Settings:
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Environment Variables:
   - `VITE_SUPABASE_URL`: Your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Public Key
   - `VITE_AI_SERVICE_URL`: URL to deployed FastAPI microservice (or leave blank for statistical ML fallback)

---

## 2. Supabase Cloud Backend & Database

1. In Supabase Dashboard, go to **SQL Editor**.
2. Execute `supabase/schema.sql` to initialize tables:
   - `trains`, `coaches`, `weight_readings`, `profiles`, `notifications`, `predictions`, `audit_logs`
3. Execute `supabase/seed.sql` to seed sample trains (12101 Jnaneshwari Express, 11020 Konark Express, 12115 Siddheshwar Express).
4. In **Database -> Replication**, enable Realtime replication for:
   - `weight_readings`
   - `notifications`

---

## 3. Python FastAPI AI Microservice Deployment

### Deploy to Render / Railway / AWS ECS
1. Create a Python Web Service.
2. Root Directory: `ai-service/`
3. Start Command:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
4. Health check endpoint: `GET /`

---

## 4. Hardware Sensor Integration Blueprint

When transitioning from software simulation to physical Indian Railways rolling stock:

```
[Bogie Load Cell (Piezoelectric / Strain Gauge)]
                   │ (Analog mV Signal)
                   ▼
[Bogie Signal Conditioning & Digitizer Unit]
                   │ (RS-485 / Modbus RTU)
                   ▼
[Carriage Edge Gateway (ARM Cortex Linux)]
                   │ (MQTT / Cellular 4G-LTE / IRNSS)
                   ▼
[Railway Cloud Ingestion API]
                   │ (PostgreSQL / Supabase Realtime)
                   ▼
[Smart Live Weight Tracker Dashboards]
```

1. **Hardware Mounting**: Strain gauges are welded to the secondary suspension bogie bolster beams on both front and rear bogies of each coach.
2. **Gross Weight Aggregation**:
   $$\text{Coach Gross Weight} = \text{Bogie}_1\text{ Load} + \text{Bogie}_2\text{ Load}$$
3. **Data Integrity & Tare Calibration**:
   - Every coach is zero-calibrated during POH (Periodic Overhaul) to record its exact tare weight.
   - The telemetry payload packet includes `is_simulated: false` and `source: "piezoelectric_bogie_sensor"`.
