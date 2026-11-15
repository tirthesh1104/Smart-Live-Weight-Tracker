# User Guide & Operations Manual
## Smart Live Weight Tracker – Role-Based System Operation

---

### 1. System Navigation & Access Roles

The Smart Live Weight Tracker provides tailored interfaces for 4 distinct railway operational roles:

```
+-----------------------------------------------------------------------------------------+
| Interface Role          | Navigation Link | Purpose & Target Users                     |
|:------------------------|:----------------|:-------------------------------------------|
| **Passenger Guidance**  | `/passenger`    | Commuters seeking least crowded coaches     |
| **Station Master/Admin**| `/admin`        | Station authorities, safety thresholds     |
| **Railway Staff / TTE** | `/staff`        | Onboard guards, TTEs, mechanical inspection|
| **Platform Display**    | `/platform-display` | Trackside LED / LCD display boards      |
+-----------------------------------------------------------------------------------------+
```

---

### 2. Passenger Guidance Interface (`/passenger`)

Designed for quick, glanceable comprehension on commuter mobile devices or station touchscreen kiosks:
* **Real-Time Train Selector:** Select active train route (e.g. 12-Car Mumbai CSMT – Kalyan Fast Local).
* **Coach Crowd Heatmap:** High-visibility color codes:
  * **Green (0% – 50%):** Vacant seats available, optimal for boarding.
  * **Amber (51% – 84%):** Moderate crowd, standing room available.
  * **Red (85%+):** Super dense crush load, dangerous to board.
* **Pillar-Bay Mapping:** Informs commuters exactly which platform pillar to stand beside (e.g., *“Coach C-01 is at Platform Pillars 1–2”*).
* **Bilingual Toggle:** Switch effortlessly between Marathi (मराठी) and English at the top right of the navigation header.
* **Passenger Assistance (SOS):** Submit urgent requests for wheelchair assistance, medical aid, or Railway Protection Force (RPF) support directly with coach and seat number.

---

### 3. Station Master & Administrator Dashboard (`/admin`)

Privileged control suite requiring cryptographic PIN verification:

1. **Authentication:**
   * Enter the authorized Station Master PIN on the login dialog.
   * Session persists securely until manual sign-out or session expiration.
2. **Train Rake Overview:**
   * Live payload, gross vehicle weight (GVW), and gross balance ratio across all active rakes.
   * Real-time center-of-gravity imbalance alerts.
3. **IoT Simulator Control:**
   * Adjust simulated passenger ingress/egress to stress-test platform algorithms.
   * Simulate sensor disconnections to witness automated tri-modal sensor fusion failover.
4. **Shift Handover & PDF/HTML Export:**
   * Document active alerts, ongoing incidents, and handover verification notes.
   * Click **“Export Shift Audit Report”** to generate an official printable HTML/PDF audit document.
   * Disclaimer included on all exports: *“Independent Technology Evaluation Prototype - Not for Metrological Legal Custody Transfer.”*

---

### 4. Railway Staff & TTE Mobile Terminal (`/staff`)

Optimized for tablets and smartphones carried by Train Ticket Examiners (TTE), Guards, and Yard Inspectors:
* **Coach Safety & Weight Inspection Checklist:** Perform pre-departure verification of air springs, secondary suspension clearance, vestibule lockings, and emergency chains.
* **Incident Logging:** Rapid reporting of door obstruction, passenger distress, or unauthorized heavy cargo.
* **Baggage Weight Allowance Calculator:** Quick check to ensure passenger luggage does not exceed authorized free allowance limits according to IRCA rules.
* **RPF Assistance Dispatch:** Dispatches urgent safety tickets to trackside security units with complete coach coordinates.
* **Offline Readiness:** Staff can log checklists inside tunnels or remote corridors; all data synchronizes automatically when cellular signal is re-acquired.

---

### 5. Platform Display Board HUD (`/platform-display`)

Trackside high-contrast heads-up display intended for overhead LED/LCD television monitors mounted along platform awnings:
* **Dual-Language Rotating Ticker:** Alternates every 10 seconds between Marathi and English announcements.
* **Coach Layout HUD:** Visual train schematic showing coach numbers aligned with station pillar numbers.
* **Accessibility Indicators:** Clear Divyangjan (wheelchair) and Ladies coach iconography.
* **Zero Operational Buttons:** Completely locked for public display security.
