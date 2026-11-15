# Database Schema & Data Integrity Specification
## Smart Live Weight Tracker – Supabase PostgreSQL Schema

---

### 1. Database Architecture & Schema Overview

The database persistence layer is hosted on a PostgreSQL instance managed via Supabase (`wvtsqnyzgpbprywesolb.supabase.co`). It enforces relational integrity across **18 specialized tables**, backed by UUID primary keys, timestamp tracking (`created_at`, `updated_at`), foreign key constraints, and PostgreSQL Row-Level Security (RLS) policies.

---

### 2. Relational Table Directory (18 Tables)

| # | Table Name | Description | Key Foreign Constraints |
|:---|:---|:---|:---|
| 1 | `users` | System user accounts, authorization roles (`admin`, `staff`, `passenger`), and authentication metadata. | Primary Entity |
| 2 | `train_rakes` | Railway rakes/train sets (e.g. 12-car/15-car EMU), active status, current route, and total rated capacity. | Primary Entity |
| 3 | `coaches` | Individual coach profiles (Coach ID, Rake ID, Position, Coach Class, Tare Weight, Max Capacity). | `rake_id` -> `train_rakes(id)` |
| 4 | `weight_readings` | High-frequency telemetry: gross weight, net payload, estimated occupancy, sequence number. | `coach_id` -> `coaches(id)` |
| 5 | `weight_anomaly_logs` | Real-time flags for severe overload, asymmetric bogie loading, rapid weight shifts, or sensor disconnects. | `coach_id` -> `coaches(id)` |
| 6 | `notifications` | System-wide alerts, operational advisories, and emergency broadcast records with read state tracking. | `user_id` -> `users(id)` (nullable) |
| 7 | `system_audit_logs` | Immutable audit trail capturing logins, config changes, threshold modifications, and override events. | `user_id` -> `users(id)` |
| 8 | `platform_displays` | Real-time state of physical station platform LED/LCD displays (active rake, coach guidance, status). | Station reference |
| 9 | `emergency_alerts` | High-priority safety events (overcrowding stampede risk, emergency brake requests, medical SOS). | `coach_id` -> `coaches(id)` |
| 10 | `maintenance_records` | Rolling stock maintenance history, spring recalibration, sensor servicing, and mechanical clearance. | `coach_id` -> `coaches(id)` |
| 11 | `predictions` | Historical log of ML time-series forecasts (15, 30, 60 min intervals), confidence intervals, and metrics. | `coach_id` -> `coaches(id)` |
| 12 | `incident_reports` | Operational incidents logged by guards/TTEs (passenger distress, baggage obstruction, door failures). | `reported_by` -> `users(id)` |
| 13 | `sensor_calibration_logs` | Zero-tare offset records, calibration slope factors, and drift compensation records for strain gauges. | `coach_id` -> `coaches(id)` |
| 14 | `shift_handover_logs` | Formal Station Master and Guard shift transition logs, active incidents, and sign-off verification. | `user_id` -> `users(id)` |
| 15 | `passenger_assistance_requests` | Real-time passenger requests for wheelchair, porter, medical emergency, or RPF security intervention. | Platform/Coach ref |
| 16 | `coach_inspections` | TTE and mechanical staff pre-departure physical checklist (air springs, vestibules, emergency cords). | `coach_id` -> `coaches(id)` |
| 17 | `crowd_density_snapshots` | Aggregate crowd density per platform bay and rake sector used for historical surge analysis. | Station/Platform ref |
| 18 | `rpf_assistance_tickets` | Railway Protection Force (RPF) dispatched security tickets, response times, and resolution logs. | `incident_id` -> `incident_reports(id)` |

---

### 3. Detailed Column Specification for Core Entities

#### Table: `weight_readings`
```sql
CREATE TABLE public.weight_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id TEXT NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
    gross_weight_kg NUMERIC(10,2) NOT NULL,
    tare_weight_kg NUMERIC(10,2) NOT NULL,
    net_payload_kg NUMERIC(10,2) NOT NULL,
    estimated_passengers INTEGER NOT NULL,
    occupancy_percentage NUMERIC(5,2) NOT NULL,
    sensor_status TEXT NOT NULL DEFAULT 'NORMAL',
    sequence_number BIGINT NOT NULL,
    is_suppressed BOOLEAN NOT NULL DEFAULT FALSE,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_weight_readings_coach_time ON public.weight_readings(coach_id, recorded_at DESC);
```

#### Table: `system_audit_logs`
```sql
CREATE TABLE public.system_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    user_role TEXT NOT NULL,
    action_type TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_logs_timestamp ON public.system_audit_logs(timestamp DESC);
```

#### Table: `notifications`
```sql
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'INFO',
    category TEXT NOT NULL DEFAULT 'SYSTEM',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### 4. Row Level Security (RLS) Policy Architecture

To ensure strict data privacy and isolation across public and privileged railway operations:
1. **Public Read Permissions (`anon`):**
   * Can read real-time platform displays (`platform_displays`).
   * Can read public crowd advisories (`notifications` where category = 'PASSENGER').
   * Can read live coach occupancy percentages for commuter guidance.
2. **Authenticated Staff Permissions (`authenticated` / role = 'staff'):**
   * Can create `incident_reports`, `coach_inspections`, and log `passenger_assistance_requests`.
   * Can view train rake technical metrics and sensor calibration states.
3. **Admin / Station Master Permissions (role = 'admin'):**
   * Full access to configure rakes, alter overload threshold parameters, conduct shift handovers, and view immutable `system_audit_logs`.

---

### 5. Client Offline Sync Queue Structure

When disconnected from the network, the client buffers pending mutations inside the local offline storage system (`SyncQueueItem`):

```typescript
export interface SyncQueueItem {
  id: string;               // UUIDv4 unique transaction key
  entity: 'reading' 
        | 'notification' 
        | 'incident' 
        | 'audit' 
        | 'prediction' 
        | 'anomaly' 
        | 'inspection' 
        | 'assistance';
  payload: Record<string, any>;
  timestamp: number;        // Epoch millisecond timestamp
  retryCount: number;       // Exponential backoff tracker
}
```

#### Idempotency & Reconciliation Logic:
* Upon restoration of internet connectivity, `reconcileOfflineQueue()` evaluates each buffered record.
* Records are pushed via UPSERT operations using `id` as the conflict target.
* Timestamp arbitration (`localTime > cloudTime`) ensures the freshest state prevails, preventing phantom updates or duplicate records.
