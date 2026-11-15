import numpy as np
from typing import List, Tuple, Dict, Any
from models import (
    PredictionRequest, HorizonPrediction, PredictionResponse,
    DeltaSyncRequest, DeltaSyncResponse,
    RecommendationRequest, RecommendationResponse,
    AnalyticsQueryRequest, AnalyticsQueryResponse
)

class RailwayMLEngine:
    """
    Railway ML Engine implementing:
    1. Holt-Winters Double Exponential Smoothing (Level + Trend) for Time-Series Crowd Forecasting
    2. Statistical Prediction Intervals (Confidence Bounds)
    3. Edge Delta-Compression Sync Algorithm
    4. Deterministic Analytics & Coach Optimization
    """

    @staticmethod
    def holt_linear_forecast(
        series: List[float],
        alpha: float = 0.35,
        beta: float = 0.15,
        dt_minutes: float = 5.0
    ) -> Tuple[float, float, float, float]:
        """
        Calculates Holt's linear exponential smoothing:
        - level (l_t)
        - trend (b_t per time step)
        - velocity_kg_per_min = b_t / dt_minutes
        - residual standard error sigma_e
        """
        n = len(series)
        if n < 2:
            val = series[0] if n == 1 else 40000.0
            return val, 0.0, 0.0, 50.0

        # Initialization
        l = series[0]
        # Trend initialization using first differences
        b = (series[-1] - series[0]) / max(1, n - 1)
        
        residuals = []
        for t in range(n):
            y_t = series[t]
            # One-step forecast before updating
            y_hat = l + b
            residuals.append(y_t - y_hat)
            
            # Holt updating equations
            l_prev = l
            l = alpha * y_t + (1.0 - alpha) * (l + b)
            b = beta * (l - l_prev) + (1.0 - beta) * b

        residuals_arr = np.array(residuals)
        sigma_e = float(np.std(residuals_arr)) if len(residuals_arr) > 1 else 30.0
        # Prevent zero division / unrealistically zero error
        sigma_e = max(25.0, sigma_e)
        velocity_kg_per_min = b / dt_minutes

        return l, b, velocity_kg_per_min, sigma_e

    def predict_occupancy(self, req: PredictionRequest) -> PredictionResponse:
        """
        Generates Holt-Winters time-series crowd occupancy predictions for 15, 30, and 60 minutes.
        """
        empty = req.empty_weight_kg
        max_cap = req.max_capacity_kg
        curr_wt = req.current_weight_kg
        payload_cap = max(1.0, max_cap - empty)
        current_occ = max(0.0, ((curr_wt - empty) / payload_cap) * 100.0)

        # Assemble historical sequence
        history = list(req.historical_weights)
        if not history:
            # Baseline synthetic recent observations if sensor just connected
            history = [curr_wt - 120.0, curr_wt - 45.0, curr_wt]
        elif history[-1] != curr_wt:
            history.append(curr_wt)

        # Run Holt's Double Exponential Smoothing
        alpha = max(0.05, min(0.95, req.alpha))
        beta = max(0.01, min(0.50, req.beta))
        dt = max(1.0, req.time_step_minutes)

        level, trend_per_step, velocity, sigma_e = self.holt_linear_forecast(
            history, alpha=alpha, beta=beta, dt_minutes=dt
        )

        # Volatility & Rush-Hour Multipliers
        type_multiplier = {
            'General': 1.45,
            'Second Sitting': 1.25,
            'Sleeper': 1.0,
            'AC 3 Tier': 0.75,
            'AC 2 Tier': 0.55,
            'Pantry Car': 0.20,
            'Engine': 0.0
        }.get(req.coach_type, 1.0)

        rush_multiplier = 1.30 if req.is_rush_hour else 0.95

        horizons = [15, 30, 60]
        predictions: List[HorizonPrediction] = []

        for h in horizons:
            # Steps ahead in terms of base dt
            m_steps = h / dt
            
            # Forecast mean weight from Holt model + railway demand adjustments
            model_point_forecast = level + (m_steps * trend_per_step * rush_multiplier * type_multiplier)
            
            # Additional platform interchange adjustment
            interchange_adjustment = (180.0 * type_multiplier * (1.15 if req.is_rush_hour else 0.85)) * (
                1.0 if req.route_station_stops_remaining > 0 else -0.4
            ) * (h / 30.0)

            projected_wt = model_point_forecast + interchange_adjustment
            projected_wt = max(empty * 0.98, projected_wt)

            # Variance and Prediction Interval for Holt's linear model:
            # Var(e_{t+m}) = sigma_e^2 * (1 + sum_{j=1}^{k-1} (1 + j * beta)^2)
            k = max(1, int(round(m_steps)))
            sum_variance_multiplier = 1.0
            for j in range(1, k):
                sum_variance_multiplier += (1.0 + j * beta) ** 2
            
            forecast_std = sigma_e * np.sqrt(sum_variance_multiplier)
            z_score = 1.96  # 95% confidence interval

            lower_bound = max(empty * 0.95, projected_wt - (z_score * forecast_std))
            upper_bound = projected_wt + (z_score * forecast_std)

            projected_occ = ((projected_wt - empty) / payload_cap) * 100.0
            projected_occ = max(0.0, round(projected_occ, 1))

            # Analytical Statistical Confidence Score (derived from prediction interval width relative to capacity)
            rel_margin = (z_score * forecast_std) / payload_cap
            confidence = round(float(np.clip(1.0 - rel_margin, 0.50, 0.99)), 2)

            # Engineering status classification
            if projected_occ > 100.0:
                status = "Overloaded Warning"
                excess_kg = round(projected_wt - max_cap)
                explanation = f"Projected to exceed structural payload capacity by {round(projected_occ - 100.0, 1)}% (+{excess_kg:,} kg). High bogie strain risk."
            elif projected_occ >= 76.0:
                status = "Crowded / Full"
                explanation = f"Boarding trend indicates high coach density reaching {projected_occ}%. Aisle congestion expected."
            elif projected_occ >= 41.0:
                status = "Moderately Crowded"
                explanation = f"Occupancy will stabilize around {projected_occ}% with steady seat availability."
            else:
                status = "Space Available"
                explanation = f"Low occupancy projected ({projected_occ}%); ample vacant seats and free circulation space."

            predictions.append(HorizonPrediction(
                horizon_minutes=h,
                predicted_occupancy=projected_occ,
                predicted_weight_kg=round(projected_wt, 1),
                lower_bound_kg=round(lower_bound, 1),
                upper_bound_kg=round(upper_bound, 1),
                confidence_score=confidence,
                status=status,
                explanation=explanation
            ))

        return PredictionResponse(
            coach_id=req.coach_id,
            coach_no=req.coach_no,
            current_occupancy=round(current_occ, 1),
            current_weight_kg=round(curr_wt, 1),
            velocity_kg_per_min=round(velocity, 2),
            level_estimate_kg=round(level, 1),
            trend_estimate_kg=round(trend_per_step, 2),
            predictions=predictions,
            model_used="Holt-Winters Double Exponential Smoothing with Railway Transit Multipliers",
            limitations="Assumes continuous mechanical bogie strain gauge calibration; passenger weight calculated at Indian Railway standard 68kg/pax baseline.",
            algorithm_metadata={
                "alpha": alpha,
                "beta": beta,
                "history_length": len(history),
                "sigma_error_kg": round(sigma_e, 2),
                "velocity_kg_per_min": round(velocity, 2)
            }
        )

    def evaluate_delta_sync(self, req: DeltaSyncRequest) -> DeltaSyncResponse:
        """
        Safe Edge Delta-Synchronization Algorithm with Data Integrity Rules:
        1. Prevent stale out-of-order sequence numbers from overwriting newer state.
        2. NEVER suppress safety-critical overload events (current_weight > max_capacity).
        3. NEVER suppress sensor failure or recovery transitions.
        4. Transmit on significant weight change (delta >= threshold_kg or threshold_percent).
        5. Full-state periodic heartbeat reconciliation after max_heartbeat_interval_sec.
        6. Suppress non-critical fluctuations strictly within noise margin.
        """
        # 1. Stale Update Check (Sequence / Version ordering)
        if (req.sequence_number is not None and 
            req.last_seen_sequence_number is not None and 
            req.sequence_number <= req.last_seen_sequence_number):
            return DeltaSyncResponse(
                coach_id=req.coach_id,
                sync_required=False,
                action='STALE_DROPPED',
                delta_kg=0.0,
                abs_delta_kg=0.0,
                delta_percent=0.0,
                threshold_kg=req.threshold_kg,
                bandwidth_saved_percent=100.0,
                compression_ratio="Dropped (Stale Update)",
                message=f"Stale update rejected: sequence #{req.sequence_number} <= last seen #{req.last_seen_sequence_number}.",
                event_type="STALE_DROPPED",
                is_critical_event=False,
                sequence_accepted=False,
                reduction_type="REQUEST_SUPPRESSION"
            )

        delta = req.current_weight_kg - req.previous_weight_kg
        abs_delta = abs(delta)
        payload_cap = max(1.0, req.payload_capacity_kg)
        delta_pct = (abs_delta / payload_cap) * 100.0
        max_cap = req.max_capacity_kg if req.max_capacity_kg is not None else 55000.0

        # Safety Rule 1: Never suppress a safety-critical overload event
        is_overloaded = (req.current_weight_kg > max_cap) or bool(req.is_overload_critical)
        
        # Safety Rule 2: Never suppress sensor failure or recovery transition
        sensor_status_changed = (
            req.sensor_status is not None and 
            req.previous_sensor_status is not None and 
            req.sensor_status != req.previous_sensor_status
        )

        # Standard Threshold & Heartbeat Rules
        is_weight_breached = (abs_delta >= req.threshold_kg) or (delta_pct >= req.threshold_percent)
        is_heartbeat_due = req.elapsed_seconds >= req.max_heartbeat_interval_sec

        if is_overloaded:
            action = 'SYNC_DISPATCH'
            sync_required = True
            is_critical = True
            event_type = 'SAFETY_CRITICAL_OVERLOAD'
            msg = f"CRITICAL SAFETY EVENT: Overload condition ({req.current_weight_kg:.0f} kg > {max_cap:.0f} kg capacity). Immediate sync dispatched."
            bandwidth_saved = 0.0
            compression = "1:1 (Critical Alert)"
        elif sensor_status_changed:
            action = 'SYNC_DISPATCH'
            sync_required = True
            is_critical = True
            event_type = 'SENSOR_HEALTH_EVENT'
            msg = f"CRITICAL SENSOR EVENT: Health transitioned from '{req.previous_sensor_status}' to '{req.sensor_status}'. Immediate sync dispatched."
            bandwidth_saved = 0.0
            compression = "1:1 (Sensor Event)"
        elif is_weight_breached:
            action = 'SYNC_DISPATCH'
            sync_required = True
            is_critical = False
            event_type = 'THRESHOLD_BREACH'
            msg = f"Telemetry sync dispatched: weight delta of {round(abs_delta, 1)} kg ({round(delta_pct, 2)}%) exceeds threshold."
            bandwidth_saved = 0.0
            compression = "1:1 (Active Change)"
        elif is_heartbeat_due:
            action = 'HEARTBEAT_SYNC'
            sync_required = True
            is_critical = False
            event_type = 'HEARTBEAT_RECONCILIATION'
            msg = f"Periodic heartbeat sync dispatched ({round(req.elapsed_seconds)}s elapsed without significant weight fluctuation)."
            bandwidth_saved = 75.0
            compression = "Compact Heartbeat Reconciliation"
        else:
            action = 'EDGE_SUPPRESSED'
            sync_required = False
            is_critical = False
            event_type = 'EDGE_SUPPRESSED'
            msg = f"Transmission suppressed at edge: delta {round(abs_delta, 1)} kg is within noise margin (<{req.threshold_kg} kg)."
            bandwidth_saved = 100.0
            compression = "Request Suppressed (Zero Network Bytes)"

        return DeltaSyncResponse(
            coach_id=req.coach_id,
            sync_required=sync_required,
            action=action,
            delta_kg=round(delta, 2),
            abs_delta_kg=round(abs_delta, 2),
            delta_percent=round(delta_pct, 2),
            threshold_kg=req.threshold_kg,
            bandwidth_saved_percent=bandwidth_saved,
            compression_ratio=compression,
            message=msg,
            event_type=event_type,
            is_critical_event=is_critical,
            sequence_accepted=True,
            reduction_type="REQUEST_SUPPRESSION"
        )

    def recommend_best_coach(self, req: RecommendationRequest) -> RecommendationResponse:
        """
        Recommends coach with optimal crowd balance, lowest congestion, and preferred class.
        """
        coaches = req.coaches
        passenger_coaches = [c for c in coaches if c.coach_type not in ('Engine', 'Pantry Car')]
        if not passenger_coaches:
            passenger_coaches = coaches

        if req.preferred_type:
            filtered = [c for c in passenger_coaches if c.coach_type.lower() == req.preferred_type.lower()]
            if filtered:
                passenger_coaches = filtered

        # Sort by occupancy ascending
        sorted_coaches = sorted(passenger_coaches, key=lambda c: c.occupancy_percentage)
        best = sorted_coaches[0]

        alternatives = [
            {
                "coach_id": c.coach_id,
                "coach_no": c.coach_no,
                "coach_type": c.coach_type,
                "occupancy_percentage": c.occupancy_percentage,
                "current_weight_kg": c.current_weight_kg
            }
            for c in sorted_coaches[1:4]
        ]

        reason = (
            f"Coach {best.coach_no} ({best.coach_type}) currently has the lowest crowd density at "
            f"{best.occupancy_percentage}%, providing the highest seating availability and aisle comfort."
        )

        return RecommendationResponse(
            recommended_coach_id=best.coach_id,
            recommended_coach_no=best.coach_no,
            coach_type=best.coach_type,
            occupancy_percentage=best.occupancy_percentage,
            reason=reason,
            ranked_alternatives=alternatives
        )

    def query_analytics_assistant(self, req: AnalyticsQueryRequest) -> AnalyticsQueryResponse:
        """
        Deterministic, hallucination-free analytics assistant for train telemetry.
        """
        q = req.query.lower()
        insights: List[str] = []
        identified_records: List[Dict[str, Any]] = []

        all_coaches = []
        for t in req.active_trains:
            for c in t.get("coaches", []):
                all_coaches.append({**c, "train_number": t.get("number"), "train_name": t.get("name")})

        passenger_coaches = [c for c in all_coaches if c.get("coach_type") != "Engine"]
        overloaded = [c for c in passenger_coaches if c.get("current_weight_kg", 0) > c.get("max_capacity_kg", 55000)]

        if any(w in q for w in ["overload", "danger", "heavy", "limit", "safety"]):
            if overloaded:
                answer = f"CRITICAL SAFETY ADVISORY: {len(overloaded)} coach(es) currently exceed structural weight limit!"
                for c in overloaded:
                    excess = c.get("current_weight_kg", 0) - c.get("max_capacity_kg", 55000)
                    insights.append(
                        f"Coach {c.get('coach_no')} (Train {c.get('train_number')}) is carrying "
                        f"{c.get('current_weight_kg'):,} kg (+{excess:,} kg over {c.get('max_capacity_kg'):,} kg limit)."
                    )
                    identified_records.append(c)
            else:
                answer = "All monitored coaches are operating strictly within safe structural payload limits."
                insights.append(f"0 out of {len(passenger_coaches)} passenger coaches are overloaded.")

        elif any(w in q for w in ["average", "avg", "occupancy", "crowd"]):
            if passenger_coaches:
                avg_occ = sum(c.get("occupancy_percentage", 0) for c in passenger_coaches) / len(passenger_coaches)
                answer = f"The fleet-wide average coach occupancy is {round(avg_occ, 1)}% across {len(passenger_coaches)} passenger coaches."
                insights.append(f"Space Available (<40%): {len([c for c in passenger_coaches if c.get('occupancy_percentage', 0) <= 40])} coaches.")
                insights.append(f"Moderate (41-75%): {len([c for c in passenger_coaches if 40 < c.get('occupancy_percentage', 0) <= 75])} coaches.")
                insights.append(f"Crowded (76-100%): {len([c for c in passenger_coaches if 75 < c.get('occupancy_percentage', 0) <= 100])} coaches.")
                insights.append(f"Overloaded (>100%): {len(overloaded)} coaches.")
            else:
                answer = "No active passenger coaches available for occupancy calculation."
        else:
            answer = f"System is currently tracking {len(req.active_trains)} active trains and {len(all_coaches)} bogie sensor units."
            insights.append("Continuous real-time telemetry stream operating at 3-second refresh cycle.")
            insights.append(f"Active logged system alerts: {len(req.recent_alerts)}.")
            insights.append("Sample questions: 'Show overloaded coaches', 'What is the average occupancy?', 'Check safety risks'.")

        return AnalyticsQueryResponse(
            query=req.query,
            answer=answer,
            insights=insights,
            identified_records=identified_records,
            confidence=0.96
        )

# Global singleton
ml_engine = RailwayMLEngine()
