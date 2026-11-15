# Dynamic Crowd Balancing & Platform Guidance Methodology
## Smart Live Weight Tracker – Rake Load Optimization & Bay-Aware Guidance

---

### 1. Operational Problem: Asymmetric Rolling Stock Loading

In suburban and regional passenger trains, commuters naturally congregate near platform entry staircases, escalators, and foot overbridges (FOBs). This causes severe localized overcrowding in central coaches (often reaching 250%+ occupancy), while leading and trailing coaches remain under 50% capacity.

This uneven distribution induces:
1. **Structural Rake Imbalance:** Excessive torque and asymmetric stress on rake couplers, suspension bolsters, and motor bogies.
2. **Extended Dwell Times:** Slow, hazardous alighting and boarding at crowded coaches delays train departure across entire suburban lines.
3. **Platform Bottlenecks:** Density surges around specific platform zones creating crush and stampede risks.

---

### 2. Algorithmic Formulation for Rake Load Balancing

Let a train rake contain $N$ coaches, each with current occupancy $O_i$ and rated capacity $C_i$.

1. **Mean Rake Occupancy Ratio:**
   $$\bar{\mu} = \frac{1}{N} \sum_{i=1}^N \frac{O_i}{C_i}$$

2. **Rake Imbalance Variance Metric:**
   $$\sigma_{\text{rake}}^2 = \frac{1}{N} \sum_{i=1}^N \left( \frac{O_i}{C_i} - \bar{\mu} \right)^2$$

3. **Coach Classification:**
   * **Overloaded / Critical:** $\frac{O_i}{C_i} \ge 0.85$ (Red Alert)
   * **Balanced / Moderate:** $0.50 \le \frac{O_i}{C_i} < 0.85$ (Yellow/Amber)
   * **Recommended Boarding (Optimal):** $\frac{O_i}{C_i} < 0.50$ (Green Indicator)

4. **Class Compatibility Guard:**  
   The algorithm strictly enforces coach segregation rules:
   * Commuters with General Second-Class (GS) tickets are only routed to eligible GS coaches.
   * Reserved Sleeper (SL) or Air-Conditioned (AC) coaches are never recommended to general unreserved commuters, preserving regulatory ticketing compliance.

---

### 3. Platform Pillar-Bay Physical Spatial Alignment

Station platforms in India are designated by numbered structural pillars (e.g., Pillars 1 through 24 along standard 12-car/15-car suburban platforms).

The crowd balancing engine dynamically maps rake coach positions to physical platform pillar bays:

```
+-----------------------------------------------------------------------------------------------+
| Coach Position | Coach ID | Coach Type  | Mapped Platform Pillar Bay | Guidance Status        |
|:---------------|:---------|:------------|:---------------------------|:-----------------------|
| 1 (Front Cab)  | C-01     | General/Mot | Pillars 1 – 2              | RECOMMENDED (LOW CROWD)|
| 2              | C-02     | General     | Pillars 3 – 4              | MODERATE LOAD          |
| 3              | C-03     | General     | Pillars 5 – 6              | OVERLOADED (AVOID)     |
| 4 (Mid-Train)  | C-04     | Divyang/Gen | Pillars 7 – 8              | SPECIAL ACCESSIBILITY  |
| 5              | C-05     | General     | Pillars 9 – 10             | OVERLOADED (AVOID)     |
| 6              | C-06     | Ladies/Gen  | Pillars 11 – 12            | DESIGNATED LADIES      |
+-----------------------------------------------------------------------------------------------+
```

When Coach 3 is detected at $>85\%$ capacity, platform LED displays at Pillars 5–6 actively instruct waiting commuters:
> *"Move toward Pillars 1–2 for faster boarding in Low-Crowd Coach 1."*

---

### 4. Bilingual Public Announcement (PA) Scripts & Visual Displays

To ensure maximum accessibility, the crowd balancer automatically generates synchronized visual display copy and automated audio PA announcements in both **Marathi (मराठी)** and **English**:

#### High-Load Advisory (Coach 3 Critical):

* **Marathi (मराठी) Visual:**
  > *"कृपया लक्ष द्या: डबा क्र. C-03 मध्ये गर्दी जास्त आहे. सुलभ प्रवासासाठी खांब क्र. १-२ जवळील डब्यात चढावे."*

* **Marathi (मराठी) Audio PA Script:**
  > *"सर्व प्रवाशांना नम्र विनंती: गाडीच्या मध्यभागातील डब्यांमध्ये अतिरिक्त गर्दी टाळण्यासाठी कृपया खांब क्रमांक १ आणि २ कडे जावे, जेथे डब्यांमध्ये पुरेशी जागा उपलब्ध आहे."*

* **English Visual:**
  > *"Notice: Coach C-03 is experiencing heavy crowd. Please move towards Pillars 1-2 for comfortable boarding in Coach C-01."*

* **English Audio PA Script:**
  > *"Attention passengers: To avoid heavy congestion in central coaches, please proceed towards Pillars 1 and 2 where coaches have ample vacant capacity."*

---

### 5. Passenger Walking Distance Minimization

For passenger mobile client guidance (`POST /recommend-coach`):
* Input: Commuter current pillar position $P_{\text{current}}$, ticket class $K$, mobility flag $M$.
* Objective Function:
  $$\min_{j \in \text{Coaches}} \left[ \omega_1 \cdot \text{Occupancy}_j + \omega_2 \cdot |P_j - P_{\text{current}}| \right]$$
  Where $\omega_1 = 0.65$ (prioritizing comfort and available seats) and $\omega_2 = 0.35$ (penalizing long platform walks, especially during brief 30-second suburban dwell times).
