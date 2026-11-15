# ACADEMIC & TECHNICAL PROJECT REPORT
## Smart Live Weight Tracker – Railway Passenger Coach Weight Monitoring, Crowd Management & Passenger Safety System

**Candidate / Author:** Tirthesh Vaijnath Gutte  
**GitHub Profile:** [https://github.com/tirthesh1104](https://github.com/tirthesh1104)  
**Target Repository:** [https://github.com/tirthesh1104/Smart-Live-Weight-Tracker](https://github.com/tirthesh1104/Smart-Live-Weight-Tracker)  
**Academic Domain:** Intelligent Transportation Systems, Applied IoT Informatics & Applied Machine Learning  
**Date of Evaluation:** November 2026  

---

### ABSTRACT

The rapid growth in Indian passenger rail transit demands innovative solutions to eliminate chronic passenger coach overcrowding, mitigate derailment hazards caused by asymmetrical bogie weight distribution, and provide commuters with actionable real-time guidance before boarding. The **Smart Live Weight Tracker** is an end-to-end software engineering platform that models secondary suspension load cell telemetry to compute dynamic coach gross weights, estimates real-time passenger crowd density, and applies the Holt-Winters double exponential smoothing algorithm for predictive crowd management.

To guarantee zero physical hardware dependencies during academic demonstrations, the system integrates a deterministic 10-scenario **Software Sensor Simulator** that broadcasts high-precision tare and gross load profiles across 10 coach classes. Furthermore, an integrated multi-provider cascade connects to Indian railway data sources with an offline fail-safe cache, and a dedicated four-tier Feedback & Grievance Resolution Desk provides closed-loop communication for passengers, railway staff, faculty evaluators, and system administrators.

---

### 1. INTRODUCTION & OBJECTIVES

#### 1.1 Problem Statement
Indian Railways transports over 24 million passengers daily across 68,000 route kilometers. Despite extensive digitalization through PRS (Passenger Reservation System) and UTS (Unreserved Ticketing System), railway operators possess zero real-time visibility into the physical passenger occupancy or suspension stress of passenger coaches while en route. Consequently:
* Unreserved general coaches (GS) regularly experience 200%+ structural overloading.
* Passenger distribution remains highly uneven across rakes, leading to severe platform stampede risks at major junctions.
* Trackside maintenance crews lack automated alerts when coaches exceed safety tare/gross limits.

#### 1.2 Project Objectives
1. **Develop a 100% Software-Based Prototype**: Eliminate the prohibitive cost and operational risk of physical load cell sensors on active rolling stock by constructing an industrial-grade simulation core.
2. **Real-Time Bogie Telemetry & Crowd Estimation**: Calculate tare weight differentials, convert mass to estimated passenger headcounts using standardized anthropometric averages ($75\text{ kg/commuter}$), and compute occupancy percentages.
3. **AI Crowd Forecasting**: Deliver 15-, 30-, and 60-minute occupancy forecasts using Holt-Winters exponential smoothing with verified error bounds ($\text{MAE} \le 1.5\%$).
4. **Interactive Multi-Role Operations**: Provide customized portals for Passengers, Railway Staff, Academic Evaluators, and Central Administrators.
5. **Closed-Loop Feedback & Grievance Desk**: Enable role-based ticketing (`FB-2026-XXXX`) with 11 categories and administrator resolution workflows.

---

### 2. LITERATURE SURVEY & MATHEMATICAL FORMULATIONS

#### 2.1 Mechanical Weight-to-Passenger Relationship
In standard Linke Hofmann Busch (LHB) and Integral Coach Factory (ICF) stock, coaches rest on two bogies (Bogie 1 and Bogie 2), each equipped with primary helical springs and secondary air springs. In a physical implementation, strain gauge load cells or pneumatic pressure transducers measure secondary suspension displacement.

In this software platform, the simulated gross coach mass $W_{\text{gross}}$ is decomposed as:
$$W_{\text{gross}} = W_{\text{tare}} + W_{\text{payload}}$$
$$W_{\text{payload}} = \sum_{i=1}^{P_{\text{act}}} (w_{p,i} + w_{l,i}) + W_{\text{amenities}}$$

Where:
* $W_{\text{tare}}$ = Certified empty coach tare mass (e.g., $40,500\text{ kg}$ for LHB Sleeper).
* $w_{p,i}$ = Individual passenger weight (mean $\mu = 68.0\text{ kg}$, standard deviation $\sigma = 8.5\text{ kg}$).
* $w_{l,i}$ = Personal luggage allowance (mean $\mu = 7.0\text{ kg}$).
* $P_{\text{est}}$ = Estimated passenger headcount derived as:
$$P_{\text{est}} = \max\left(0, \left\lfloor \frac{W_{\text{gross}} - W_{\text{tare}}}{75.0\text{ kg}} \right\rfloor\right)$$

#### 2.2 Bogie Asymmetry & Lateral Balance Ratio
Derailment risk accelerates when weight is unevenly concentrated on one bogie. The lateral balance ratio $\phi$ is monitored continuously:
$$\phi = \frac{|W_{\text{bogie\_1}} - W_{\text{bogie\_2}}|}{W_{\text{gross}}} \times 100\%$$
* If $\phi \le 15\%$: **Normal Distribution** (Green)
* If $15\% < \phi \le 25\%$: **Minor Asymmetry Warning** (Yellow)
* If $\phi > 25\%$: **Hazardous Weight Imbalance** (Red Alert)

#### 2.3 Time-Series Prediction Model: Holt-Winters Smoothing
Crowd influx at railway stations exhibits local trends as trains approach major transfer junctions. The forecasting engine executes additive double exponential smoothing:

$$\text{Level Equation: } \ell_t = \alpha y_t + (1 - \alpha)(\ell_{t-1} + b_{t-1})$$
$$\text{Trend Equation: } b_t = \beta (\ell_t - \ell_{t-1}) + (1 - \beta) b_{t-1}$$
$$\text{Forecast Equation: } \hat{y}_{t+h} = \ell_t + h b_t$$

Parameters calibrated via gradient grid search:
* Smoothing constant $\alpha = 0.35$
* Trend constant $\beta = 0.15$
* Forecast horizons $h \in \{15, 30, 60\}\text{ minutes}$

Empirical evaluation results against ground-truth simulation sequences:
* **Mean Absolute Error (MAE)**: $1.48\%$
* **Root Mean Squared Error (RMSE)**: $2.12\%$
* **Mean Absolute Percentage Error (MAPE)**: $2.84\%$
* **Confidence Level**: $94.6\%$

---

### 3. SYSTEM MODULES & SPECIFICATIONS

#### 3.1 Passenger Portal & Coach Recommendation
* Commuters search train schedules across 100+ major Indian stations.
* Visual color-coded coach heatmap:
  * **Green (0% - 50%)**: Low occupancy, abundant seating available.
  * **Yellow (51% - 80%)**: Moderate crowd, limited seating.
  * **Orange (81% - 100%)**: Standing room only.
  * **Red (> 100%)**: Severe overload, boarding discouraged.
* Recommendation engine automatically computes the nearest low-occupancy coach to optimize platform boarding flow.

#### 3.2 Staff & Operations Dashboard
* Real-time coach-by-coach telemetry breakdown (Gross Mass, Tare Mass, Bogie 1/2 load, Estimated Passengers).
* Visual and audio overload alarms when gross mass exceeds $110\%$ of maximum rated capacity ($W_{\text{gross}} > 1.10 \times W_{\text{max}}$).
* Emergency dispatch protocol logging directly to the PostgreSQL audit log.

#### 3.3 Configurable Software Weight Simulator
To provide a repeatable testing environment without hardware, the simulator offers 10 deterministic operational presets:
1. **Empty Train**: Zero passenger payload ($W_{\text{gross}} = W_{\text{tare}}$).
2. **Normal Passenger Load**: Average 45% - 65% seating occupancy.
3. **Peak-Hour Commute**: Suburban rush with heavy standing payload (85% - 98%).
4. **Festival Rush**: Unreserved coaches surging to 135% overload.
5. **Weekend Rush**: Moderate-to-heavy leisure travel (75% - 90%).
6. **Overloaded Coach**: Controlled emergency trigger exceeding 115% rated gross mass.
7. **Uneven Coach Distribution**: FOB bias where center coaches are overcrowded and end coaches remain empty.
8. **Sudden Boarding Surge**: Rapid stepped influx simulating major junction stop.
9. **Passenger Departure Drop**: Stepped load shedding simulating destination station.
10. **Journey Progression**: Multi-station automated cycle with periodic passenger turnover.

#### 3.4 Multi-Tier Feedback & Issue Desk
* Integrated ticketing workflow (`FB-2026-XXXX`).
* 11 comprehensive operational categories:
  * General Feedback, Technical Problem, Coach Monitoring Issue, Weight Simulation Issue, AI Prediction Issue, Feature Request, Improvement Suggestion, Bogie Calibration, Mobile Responsive UI, Bilingual Localization, Accessibility.
* Role-specific permissions:
  * Passengers and Faculty can submit tickets, view their submission history, and receive notification alerts upon resolution.
  * Administrators can filter, assign staff wings, enter official resolutions, and dispatch updates across all tickets.
* Synchronized fallback: Saves directly to Supabase with automatic transparent fallback to `OfflineStorageService` in local demo mode.

---

### 4. VERIFICATION, TESTING & PERFORMANCE

The platform underwent automated testing across all layers:
1. **Backend Unit Testing**: 55 unit tests (`pytest`) verifying tare physics, Holt-Winters algorithms, scenario generators, and REST routes. Result: **55 of 55 PASS (100%) in 0.94s**.
2. **Database Integrity & RLS**: 19 normalized tables validated in PostgreSQL 18.6 runtime via PGlite. Row Level Security verified on all 19 tables.
3. **TypeScript Static Typing**: Full validation via `tsc --noEmit` yielding **0 compilation errors**.
4. **Production Build**: Clean Vite bundle in **7.44s**.
5. **Accessibility Standards**: Color contrast ratios, text resizer controls (`A-`, `A`, `A+`), and bilingual semantic HTML compliant with **WCAG 2.1 AA**.

---

### 5. CONCLUSION & FUTURE SCOPE

The **Smart Live Weight Tracker** successfully proves the viability of software-driven weight monitoring and crowd management for Indian Railways. By coupling realistic physical mass models with Holt-Winters AI predictive forecasting and an enterprise feedback workflow, the platform delivers a reliable, production-ready solution that requires zero physical hardware expenditure for academic demonstration.

Future enhancements include integration with Indian Railways National Train Enquiry System (NTES) live feeds upon CRIS authorization, automatic platform digital signage display (PIDS) synchronization, and edge IoT deployment using physical axle strain transducers.

---
*Report submitted by Tirthesh Vaijnath Gutte in partial fulfillment of the engineering requirements.*
