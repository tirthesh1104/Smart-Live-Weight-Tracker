# Security, Authentication & Row Level Security (RLS) Specification
## Smart Live Weight Tracker – Comprehensive Security Architecture

---

### 1. Threat Model & Security Posture

Railway operational systems are critical infrastructure assets. The Smart Live Weight Tracker application enforces a zero-trust model across public commuter interfaces, operational staff mobile terminals, and administrative control suites.

Key threat vectors mitigated:
* **Unauthorized Threshold Tampering:** Commuters or rogue staff overriding overload alarm setpoints.
* **Service Key Leakage:** Client bundle extraction of database master credentials.
* **Replay & Injection Attacks:** Malicious spoofing of telemetry packets.
* **Privilege Escalation:** Public commuters accessing staff incident or RPF security logs.

---

### 2. Role-Based Access Control (RBAC) Matrix

| User Role | Dashboard Route | Permitted Capabilities | Restricted Capabilities |
|:---|:---|:---|:---|
| **Passenger / Public** | `/`, `/passenger` | View live train load, crowd color codes, platform pillar bays, submit assistance SOS. | Cannot view system settings, sensor raw logs, maintenance records, or audit trails. |
| **Railway Staff / TTE** | `/staff` | Log incident reports, submit coach inspection checklists, review anomaly alerts, view RPF tickets. | Cannot alter global alarm thresholds, create user accounts, or purge audit records. |
| **Station Master / Admin** | `/admin` | Full administrative control: calibrate sensors, manage rakes, execute shift handovers, review audit logs. | Subject to continuous immutable audit logging. |
| **Platform Display (HUD)** | `/platform-display` | Read-only high-contrast display of incoming rakes, occupancy, and coach bay mappings. | Interactive controls, inputs, and mutations are entirely disabled. |

---

### 3. Cryptographic Admin PIN Authentication

Administrative operations require authentication via a dedicated, cryptographically hashed Personal Identification Number (PIN).

#### Cryptographic Architecture:
* **Algorithm:** SHA-256 with project-specific static salt.
* **Implementation:**
  $$\text{Hash} = \text{SHA-256}(\text{PIN} \parallel \text{SALT})$$
* **Protection against Timing & Brute-Force Attacks:**
  * Rate-limiting lockout: 5 consecutive invalid PIN attempts triggers a 15-minute client-side lockout.
  * Constant-time string comparison to resist timing discrepancy attacks.
  * Plaintext PINs are never stored in `localStorage`, cookies, or transmitted in unhashed form.

---

### 4. Supabase Row Level Security (RLS) Enforcement

All 18 database tables have Row Level Security enabled in PostgreSQL (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`).

#### Policy Directives Summary:

```sql
-- 1. Public can read real-time platform displays
CREATE POLICY "Public Read Displays" ON public.platform_displays
    FOR SELECT TO anon USING (true);

-- 2. Public can read non-confidential passenger notifications
CREATE POLICY "Public Read Passenger Notifications" ON public.notifications
    FOR SELECT TO anon USING (category = 'PASSENGER' OR category = 'SYSTEM');

-- 3. Staff and Admin can insert incident reports
CREATE POLICY "Staff Insert Incidents" ON public.incident_reports
    FOR INSERT TO authenticated WITH CHECK (
        auth.jwt() ->> 'role' IN ('staff', 'admin')
    );

-- 4. Audit Logs are strictly Append-Only (Immutable)
CREATE POLICY "Audit Append Only" ON public.system_audit_logs
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Audit No Delete" ON public.system_audit_logs
    FOR DELETE TO authenticated USING (false);

CREATE POLICY "Audit No Update" ON public.system_audit_logs
    FOR UPDATE TO authenticated USING (false);
```

---

### 5. Client Bundle Hygiene & Zero Secret Leakage Audit

A strict code hygiene scan is executed on every production build (`npm run build`):
1. **Verification of `.env.local` Isolation:**  
   `VITE_SUPABASE_SERVICE_ROLE_KEY` is strictly prohibited from source files. The frontend client only imports `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
2. **Bundle Regex Audit:**  
   The compiled distribution bundle (`dist/assets/*.js`) was analyzed for leakage of service role secret prefixes.
   * Result: **0 Service Role Secret Keys present in client JavaScript assets.**
   * post-build scanner confirmed only standard PostgREST anonymous client headers are emitted.
