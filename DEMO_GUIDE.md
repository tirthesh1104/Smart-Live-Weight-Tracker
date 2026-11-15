# 13-STEP COLLEGE VIVA & DEMONSTRATION WALKTHROUGH GUIDE
## Smart Live Weight Tracker – Railway Passenger Coach Weight Monitoring & Crowd Management System

**Author & Demonstrator:** Tirthesh Vaijnath Gutte  
**GitHub Profile:** [https://github.com/tirthesh1104](https://github.com/tirthesh1104)  
**Target Repository:** [https://github.com/tirthesh1104/Smart-Live-Weight-Tracker](https://github.com/tirthesh1104/Smart-Live-Weight-Tracker)  
**Target Audience:** External Examiners, Project Guides, Academic Review Committees & Viva Evaluators  

---

## 📋 Demonstration Overview & Golden Rule

> **Examiner Opening Statement:**  
> *"Good morning, respected examiners. Today I present the Smart Live Weight Tracker, an intelligent railway crowd management and rolling stock load monitoring platform. This system is a complete, production-grade **Software-Only prototype** engineered to solve coach overcrowding and platform stampede risks across Indian Railways. It operates without requiring physical sensors or IoT hardware, employing certified bogie tare models, real-time mass simulation, Holt-Winters predictive analytics, and a closed-loop grievance resolution desk."*

---

## 🎬 Step-by-Step Viva Walkthrough Script

### Step 1: Modern Landing Portal & Bilingual Accessibility
* **URL**: `http://localhost:5173/#/`
* **What to Show**:
  1. Highlight the clean header banner with live system health indicators.
  2. Click the language toggle (`English` ⇄ `मराठी`) to demonstrate full Devanagari translation support.
  3. Click the text resizer buttons (`A-`, `A`, `A+`) in the navigation bar to demonstrate compliance with **WCAG 2.1 AA** public service accessibility guidelines.
* **Viva Explanation**:
  > *"Railway software must serve diverse commuter demographics. Our system provides bilingual Marathi and English interfaces with instant client-side localization and accessibility text scaling."*

---

### Step 2: Passenger Portal & Low-Occupancy Coach Recommendation
* **URL**: `http://localhost:5173/#/passenger`
* **What to Show**:
  1. Observe the live 22-coach train composition heatmap (Engine, Gen, S1..S8, B1..B4, A1..A2, H1, Guard).
  2. Point to the color-coded crowd indicators: Green (<50%), Yellow (50-80%), Red (>100%).
  3. Point out the **Recommended Coach** card: The system automatically computes the nearest coach with lowest crowd density to distribute boarding passengers evenly across the platform.
* **Viva Explanation**:
  > *"Rather than commuters overcrowding coaches adjacent to foot-over bridges, the platform calculates real-time crowd density and guides passengers to under-utilized coaches before train arrival."*

---

### Step 3: All-India Railway Train & Station Explorer
* **URL**: `http://localhost:5173/#/explorer`
* **What to Show**:
  1. Type train number `12101` (Jnaneswari Express) or `12951` (Mumbai Rajdhani).
  2. Inspect the complete route stops with intermediate arrival/departure times, platform numbers, and distance covered.
  3. Demonstrate the multi-provider cascade: If external APIs are unreachable, the system instantly serves authenticated offline junction data for over 100 Indian stations.
* **Viva Explanation**:
  > *"The explorer combines live API lookups with an offline fallback cache, ensuring uninterrupted operations during trackside cellular network dropouts."*

---

### Step 4: Software Sensor Simulator (Zero Hardware Showcase)
* **URL**: `http://localhost:5173/#/simulator`
* **What to Show**:
  1. Emphasize the clear watermark notice: **`SIMULATED DATA`**.
  2. Explain that the platform simulates secondary air spring suspension load cells.
  3. Show the certified coach specification selector: LHB General (`GS`), Sleeper (`SL`), 3-Tier AC (`3A`), etc., each loaded with authentic tare weights (e.g., 40,500 kg for SL).
* **Viva Explanation**:
  > *"Because deploying physical load cells on active Indian Railways rolling stock is cost-prohibitive and presents safety risks during academic research, we built a mathematically rigorous simulation engine that models bogie suspension physics."*

---

### Step 5: Scenario Testing – Normal Load ➔ Festival Rush ➔ Overload
* **URL**: `http://localhost:5173/#/simulator`
* **What to Show**:
  1. Click **Scenario 1: Normal Passenger Load**: Weight hovers at ~46,000 kg (60% occupancy).
  2. Click **Scenario 4: Festival Rush**: Watch Sleeper coach mass surge to ~53,500 kg (105% crowd density).
  3. Click **Scenario 6: Overloaded Coach**: Gross weight hits 55,200 kg (>110% rated maximum).
  4. Notice the immediate real-time broadcast updating global state in under 100 milliseconds.

---

### Step 6: Overload Safety Alarms & Audible Alert Dispatch
* **URL**: `http://localhost:5173/#/monitoring`
* **What to Show**:
  1. Switch to the Staff Dashboard while the Overload scenario is active.
  2. Observe the flashing **CRITICAL OVERLOAD ALERT** banner on Coach S2.
  3. Explain the audible tone dispatch and emergency logging to the PostgreSQL audit table.
* **Viva Explanation**:
  > *"When gross mass exceeds certified mechanical structural safety limits, station masters and guards receive immediate audio-visual alerts so boarding can be regulated before train departure."*

---

### Step 7: Staff Operations Dashboard & Bogie Asymmetry Analysis
* **URL**: `http://localhost:5173/#/monitoring`
* **What to Show**:
  1. Inspect the Bogie 1 vs. Bogie 2 balance meter.
  2. Demonstrate how lateral unbalance is calculated ($\phi = \frac{|W_{B1} - W_{B2}|}{W_{\text{gross}}} \times 100\%$).
  3. Point out the estimated passenger count formula: $\lfloor (W_{\text{gross}} - W_{\text{tare}}) / 75.0\text{ kg} \rfloor$.

---

### Step 8: AI Crowd Prediction & Holt-Winters Time-Series
* **URL**: `http://localhost:5173/#/ai-predictions` (or via Passenger/Staff tabs)
* **What to Show**:
  1. Display the 15-minute, 30-minute, and 60-minute predictive forecasting chart.
  2. Point out the confidence band (94.6% confidence interval).
  3. Explain the Holt-Winters double exponential smoothing mathematics: level $\ell_t$ with smoothing $\alpha = 0.35$ and trend $b_t$ with smoothing $\beta = 0.15$.
* **Viva Explanation**:
  > *"Our AI engine does not rely on static historical averages; it models instantaneous local momentum to anticipate crowd surges up to 60 minutes before arriving at suburban junctions."*

---

### Step 9: Operational Reports & Viva Metric Export (MAE / RMSE)
* **URL**: `http://localhost:5173/#/reports`
* **What to Show**:
  1. Scroll to the **AI Prediction Accuracy Validation Table**:
     * **MAE (Mean Absolute Error)**: `1.48%`
     * **RMSE (Root Mean Squared Error)**: `2.12%`
     * **Forecast Horizons**: 15m, 30m, 60m.
  2. Click the **Export CSV** button to download a live spreadsheet with coach telemetry and diagnostic metrics.
* **Viva Explanation**:
  > *"For academic evaluation, we verified our AI models against ground-truth controlled simulation datasets, proving exceptional accuracy with an MAE under 1.5%."*

---

### Step 10: Feedback & Grievance Desk Submission
* **URL**: `http://localhost:5173/#/feedback`
* **What to Show**:
  1. Click **Submit Feedback / Report Issue**.
  2. Fill out the form as **Faculty Guide** (Dr. M. S. Joshi):
     * Category: `Improvement Suggestion`
     * Priority: `High`
     * Related Module: `Passenger Portal`
     * Title: `Bogie Tare Calibration Data Export for Student Viva`
     * Description: `Request direct CSV export of tare and gross weight limits for all 10 coach types to simplify demonstration during external viva.`
  3. Click **Submit Feedback**.
  4. Point out the instant green success alert displaying generated ticket ID: **`FB-2026-0004`**.
* **Viva Explanation**:
  > *"We built an enterprise grievance desk enabling passengers, staff, and faculty evaluators to log operational anomalies or feedback with automatic ticket generation."*

---

### Step 11: Admin Management Console & Resolution Workflow
* **URL**: `http://localhost:5173/#/feedback` (logged in as Admin)
* **What to Show**:
  1. Demonstrate multi-factor login (`admin@railway.gov.in` + PIN `123456`).
  2. Switch to the **Admin Management Console** tab.
  3. Filter tickets by Category or Priority (`High`).
  4. Click on ticket `FB-2026-0004` to open the Administrative Resolution Desk modal.
  5. Update status from `Submitted` ➔ **`Under Review`**.
  6. Assign to: `Bogie Engineering & IT Wing`.
  7. Enter official response: *"Feature approved and scheduled for next release."*
  8. Click **Save Resolution & Dispatch**. The ticket status updates immediately across all views.
* **Viva Explanation**:
  > *"This proves full closed-loop administrative governance. Only verified administrators with secondary PIN authentication can modify ticket statuses and dispatch official resolutions."*

---

### Step 12: Mobile Responsive View
* **What to Show**:
  1. Open Chrome DevTools (`F12`) and toggle device toolbar (`Ctrl+Shift+M`) to iPhone 14 Pro or Pixel 7.
  2. Show that all cards, charts, navigation menus, and feedback forms adapt seamlessly without horizontal scrollbars.

---

### Step 13: Simulator Reset & Conclusion
* **URL**: `http://localhost:5173/#/simulator`
* **What to Show**:
  1. Click **Reset to Defaults**: The simulator reverts cleanly to baseline normal operational conditions.
  2. Deliver closing viva summary statement.
* **Examiner Closing Statement**:
  > *"To summarize, the Smart Live Weight Tracker delivers a complete, secure, software-driven railway crowd intelligence solution. It bridges mechanical engineering principles with web technologies and predictive artificial intelligence, demonstrating high feasibility for modern digital railway operations. Thank you, and I welcome your questions."*

---
*Viva demonstration guide authored by Tirthesh Vaijnath Gutte.*
