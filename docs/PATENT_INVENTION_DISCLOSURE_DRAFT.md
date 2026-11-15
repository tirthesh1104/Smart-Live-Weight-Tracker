# Indian Patent Invention Disclosure Draft (IDD)
## Intellectual Property & Technical Disclosure Specification

---

### 1. Document Control & Identification
* **Draft Title:** *System and Method for Multi-Modal Sensor Fusion, Safety-Aware Edge Delta Synchronization, and Spatial Platform-Bay Passenger Load Balancing in Railway Vehicles*
* **Inventive Classification (IPC / CPC):**  
  * `B61L 25/02`: Indicating or recording the positions or movements of railway vehicles.  
  * `B61L 27/00`: Central railway traffic control systems; Trackside control systems.  
  * `G01G 19/04`: Weighing apparatus or methods for railway vehicles.  
  * `G06Q 50/40`: Systems or methods specially adapted for transportation services.  
  * `G08G 1/01`: Detecting movement of traffic for traffic control.
* **Applicant Context:** Academic, Research & Technology Development Evaluation Prototype.
* **Jurisdiction:** Indian Patent Office (IPO) / Patent Cooperation Treaty (PCT) framework.

---

### 2. Field of the Invention
The present invention relates generally to intelligent railway vehicle monitoring systems, cyber-physical sensor telemetry, and edge computing architectures. More particularly, the invention relates to a system and method that combines multi-modal sensor fusion across bogie strain transducers, optical passenger counters, and overhead visual sensors, executes a safety-critical sequence-checked delta synchronization protocol for cellular bandwidth optimization, and dynamically directs boarding passengers using physical platform pillar-bay spatial mapping.

---

### 3. Background of the Invention & Deficiencies in the Prior Art
Overcrowded suburban and regional railway networks experience severe passenger distribution asymmetry. Commuters concentrate at coaches aligned with platform entrances, causing dangerous localized overcrowding exceeding 250% of structural capacity ("Super Dense Crush Load"), while distal coaches remain underutilized.

Existing approaches to railway passenger load monitoring suffer from fundamental deficiencies:
1. **Single-Sensor Brittleness:** Systems relying solely on bogie air-spring pressure or strain gauges suffer from temperature drift, electronic noise, and mechanical hysteresis. Conversely, systems relying purely on optical doorway beams fail during simultaneous multi-passenger ingress or when passengers loiter across door thresholds.
2. **Telemetry Uplink Saturation vs. Safety Hazards:** Continuous transmission of high-frequency strain readings saturates trackside cellular networks. However, conventional deadband filtering algorithms (which suppress readings below fixed deltas) suppress critical overload events when passengers board in small, steady increments that silently breach dangerous structural thresholds.
3. **Absence of Actionable Platform Guidance:** Prior art systems display aggregate train occupancy percentages on remote management consoles or general station screens. However, they do not bridge the cyber-physical gap by mapping specific coach loads directly to physical station architecture (e.g. platform structural pillars) to actively disperse crowds before train arrival.

---

### 4. Detailed Comparative Analysis with Prior Art: Siemens Patent EP3971817A1

A primary cited prior art reference is **Siemens Mobility GmbH (European Patent EP3971817A1 / US20220089196A1)**, entitled *"Method and system for determining the load of a railway vehicle"*.

```
+--------------------------------------------------------------------------------------------------------------------+
| Technical Feature          | Siemens Patent EP3971817A1               | Present Invention                          |
|:---------------------------|:-----------------------------------------|:-------------------------------------------|
| **Sensing Modality**       | Primarily uses pneumatic air-spring      | Tri-modal weighted sensor fusion:          |
|                            | pressure transducers on bogie suspension.| Bogie Strain Gauge (65%) + Optical Door    |
|                            |                                          | Beams (20%) + Overhead CCTV Density (15%). |
|----------------------------+------------------------------------------+--------------------------------------------|
| **Anomaly & Fault**        | Relies on vehicle bus diagnostics;       | Dynamic software weight redistribution     |
| **Handling**               | sensor failure results in lost channel.  | with inter-modality divergence checking.   |
|----------------------------+------------------------------------------+--------------------------------------------|
| **Edge Synchronization**   | Continuous periodic transmission         | Safety-Aware Delta Sync: Sequence-checked  |
|                            | over standard onboard Ethernet / MVB bus.| suppression with mandatory safety-critical |
|                            |                                          | bypass for overload (>85%) & transitions.  |
|----------------------------+------------------------------------------+--------------------------------------------|
| **Platform Guidance**      | Transmits general load data to central   | Direct cyber-physical mapping to physical  |
|                            | cloud / passenger information displays.  | platform pillar bays (e.g., Pillars 1–2),  |
|                            |                                          | with automated bilingual audio announcements.|
|----------------------------+------------------------------------------+--------------------------------------------|
| **Predictive Horizon**     | Static instantaneous weight estimation   | Double Exponential Smoothing with          |
|                            | without analytical confidence intervals. | analytical data-derived 95% confidence bounds.|
+--------------------------------------------------------------------------------------------------------------------+
```

---

### 5. Summary of the Invention & Inventive Steps

The present invention solves the aforementioned technical limitations through three synergistically integrated subsystems:

1. **Tri-Modal Dynamic Sensor Fusion Subsystem:**  
   Computes a robust real-time estimate of vehicle occupancy and payload by weighting bogie strain transducer data ($65\%$), optical bi-directional door counter data ($20\%$), and overhead visual bounding box counts ($15\%$). When a sensor failure or divergence exceeding $25\%$ is detected, the engine dynamically isolates the faulty channel and re-normalizes the weighting across remaining healthy sensors.

2. **Safety-Aware Sequence-Checked Delta Synchronization Subsystem:**  
   An edge telemetry filter operating on rolling stock nodes that suppresses steady-state weight mutations to conserve cellular bandwidth ($>72\%$ network bandwidth savings). Crucially, the protocol enforces hard non-suppression rules:
   * Any reading crossing an $85\%$ capacity threshold is immediately forced through, even if $\Delta W < \text{threshold}$.
   * Any transition in sensor health status forces immediate transmission.
   * Monotonically increasing sequence numbers prevent out-of-order stale packet injections.

3. **Spatial Platform-Bay Crowd Balancing Subsystem:**  
   Translates real-time coach load variance into concrete spatial passenger guidance. The system correlates each coach's geographic stop position along the platform with structural station pillar numbers (e.g., Coach 1 aligns with Pillars 1–2). When a coach exceeds capacity, platform display boards and automated bilingual public address scripts (in Marathi and English) instruct commuters at congested pillar bays to relocate to underutilized pillar bays.

---

### 6. Claims Drafting (Independent & Dependent Claims)

#### Claim 1 (Independent System Claim):
A cyber-physical system for monitoring railway passenger coach loading and managing platform crowd distribution, comprising:
* a multi-source sensing apparatus disposed on a railway passenger coach, including at least one bogie strain transducer, at least one bi-directional doorway optical sensor, and at least one visual imaging sensor;
* an edge computing gateway communicatively coupled to said sensing apparatus, configured to execute a weighted sensor fusion algorithm combining telemetry from said strain transducer, optical sensor, and visual sensor according to calibrated weighting coefficients;
* an edge synchronization filter configured to evaluate gross weight differences between sequential observations and suppress transmission across a wireless telecommunications link when weight variations are below a predetermined deadband threshold;
* characterized in that said edge synchronization filter comprises an immutable safety-critical bypass mechanism configured to automatically override suppression and force immediate wireless transmission upon detecting that coach occupancy exceeds a predefined critical safety threshold ($85\%$ of rated capacity) or upon detecting a status transition in any of said sensors; and
* a platform crowd balancing processor configured to receive said telemetry and map individual coach occupancies to physical station platform pillar bays, outputting targeted relocation advisories directing passengers from overloaded pillar bays to underutilized pillar bays.

#### Claim 2 (Dependent Claim):
The system as claimed in claim 1, wherein said weighted sensor fusion algorithm assigns a weight coefficient of substantially $0.65$ to said bogie strain transducer, $0.20$ to said doorway optical sensor, and $0.15$ to said visual sensor, and dynamically redistributes said coefficients upon detection of a channel timeout or sensor divergence exceeding $25\%$ between modalities.

#### Claim 3 (Dependent Claim):
The system as claimed in claim 1, further comprising a time-series predictive engine executing Holt's Linear Double Exponential Smoothing over rolling historical weight observations to forecast coach payload at horizons of 15, 30, and 60 minutes, wherein confidence bounds for each horizon are analytically derived from historical residual variance.

#### Claim 4 (Dependent Claim):
The system as claimed in claim 1, wherein said platform crowd balancing processor automatically generates synchronized dual-language audio announcements and visual ticker messages in Marathi and English indicating specific structural platform pillar numbers for passenger redistribution.

---

### 7. Statutory Intellectual Property Disclaimer

> **Notice:** This document constitutes an academic technical invention disclosure draft prepared for patent evaluation, prior art analysis, and engineering review. It does not constitute a filed patent application with the Indian Patent Office or any international patent authority. Filing of a provisional or complete specification must be performed through an authorized Registered Patent Agent in accordance with the Patents Act, 1970.
