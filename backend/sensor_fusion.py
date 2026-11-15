from typing import Dict, Any, Tuple
from models import SensorFusionRequest, SensorFusionResponse

class MultiSourceSensorFusionEngine:
    """
    Multi-Source Sensor Fusion for Railway Passenger Coach Load Estimation:
    Fuses:
    1. Bogie Strain Gauge / Load Cell Weight (Primary mechanical measurement)
    2. IR Optical Door Interruption Count (Commuter ingress/egress transit counter)
    3. CCTV Overhead Vision Head Count (Computer Vision passenger density)
    """

    DEFAULT_PASSENGER_KG = 68.0

    @classmethod
    def fuse_sensors(cls, req: SensorFusionRequest) -> SensorFusionResponse:
        empty = req.empty_weight_kg
        max_cap = req.max_capacity_kg
        payload_cap = max(1.0, max_cap - empty)
        pax_kg = req.estimated_passenger_avg_kg or cls.DEFAULT_PASSENGER_KG

        # 1. Bogie Strain Reading
        bogie_wt = req.bogie_strain_kg
        bogie_status = req.bogie_sensor_status.lower()

        # 2. IR Sensor Estimate
        ir_wt = None
        if req.ir_door_count is not None:
            ir_wt = empty + (req.ir_door_count * pax_kg)

        # 3. CCTV Head Count Estimate
        cctv_wt = None
        if req.cctv_head_count is not None:
            cctv_wt = empty + (req.cctv_head_count * pax_kg)

        # Weighting allocation based on sensor health
        if bogie_status == "healthy":
            w_bogie = 0.65
            w_ir = 0.20 if ir_wt is not None else 0.0
            w_cctv = 0.15 if cctv_wt is not None else 0.0
            primary_sensor = "Bogie Dual-Axis Strain Gauge (Primary)"
            health_status = "Optimal"
        elif bogie_status == "degraded":
            w_bogie = 0.25
            w_ir = 0.40 if ir_wt is not None else 0.0
            w_cctv = 0.35 if cctv_wt is not None else 0.0
            primary_sensor = "IR & Vision Multi-Spectral Fallback"
            health_status = "Degraded Bogie Sensor - Secondary Fusion Active"
        else: # offline
            w_bogie = 0.0
            w_ir = 0.55 if ir_wt is not None else 0.0
            w_cctv = 0.45 if cctv_wt is not None else 0.0
            primary_sensor = "Optical & CCTV Redundancy (Bogie Offline)"
            health_status = "Bogie Strain Gauge Offline - Optical Redundancy"

        total_weight = w_bogie + w_ir + w_cctv
        is_insufficient = False
        if total_weight <= 0:
            # Absolute fallback: insufficient telemetry from all channels
            fused_wt = bogie_wt if bogie_wt > 0 else empty
            w_bogie = 1.0
            total_weight = 1.0
            health_status = "INSUFFICIENT_DATA"
            recommendation = "WARNING: Insufficient sensor telemetry. Bogie strain, IR counters, and CCTV vision are offline. Payload cannot be verified."
            is_insufficient = True
        else:
            weighted_sum = (bogie_wt * w_bogie)
            if ir_wt is not None:
                weighted_sum += (ir_wt * w_ir)
            if cctv_wt is not None:
                weighted_sum += (cctv_wt * w_cctv)
            fused_wt = weighted_sum / total_weight

        fused_wt = max(empty * 0.98, fused_wt)
        fused_occ = max(0.0, ((fused_wt - empty) / payload_cap) * 100.0)

        # Anomaly checks: Discrepancy between optical and mechanical
        anomaly = is_insufficient
        if not is_insufficient:
            recommendation = "Normal operational monitoring active. Estimated payload computed from multi-source sensor weighting."

        if ir_wt is not None and cctv_wt is not None and bogie_status == "healthy":
            optical_avg_wt = (ir_wt + cctv_wt) / 2.0
            optical_payload = optical_avg_wt - empty
            bogie_payload = bogie_wt - empty

            # Heavy cargo / unmetered freight anomaly
            if bogie_payload > (optical_payload + 2500.0) and optical_payload > 0:
                anomaly = True
                excess_cargo = round(bogie_payload - optical_payload)
                health_status = "Payload Discrepancy Alert"
                recommendation = (
                    f"COMMERCIAL CARGO ADVISORY: Bogie weight exceeds optical passenger count by ~{excess_cargo:,} kg. "
                    "Suspected undeclared heavy parcels / express cargo in passenger compartment. Dispatch TTE inspection."
                )
            # Sensor drift anomaly
            elif optical_payload > (bogie_payload + 3500.0):
                anomaly = True
                health_status = "Potential Sensor Drift"
                recommendation = (
                    "TELEMETRY WARNING: High optical passenger density observed with abnormally low bogie strain reading. "
                    "Inspect bogie load cell calibration at next junction."
                )

        confidence = 0.96 if (bogie_status == "healthy" and not anomaly) else (0.84 if not anomaly else 0.72)
        pax_payload = max(0.0, fused_wt - empty)

        return SensorFusionResponse(
            coach_id=req.coach_id,
            coach_no=req.coach_no,
            fused_weight_kg=round(fused_wt, 1),
            fused_occupancy_percentage=round(fused_occ, 1),
            primary_sensor=primary_sensor,
            confidence_score=confidence,
            sensor_breakdown={
                "bogie_strain": {
                    "raw_weight_kg": round(bogie_wt, 1),
                    "status": bogie_status,
                    "applied_weight": round(w_bogie / total_weight, 3),
                    "measurement_nature": "SOFTWARE_DERIVED_TELEMETRY"
                },
                "ir_door_interruption": {
                    "count": req.ir_door_count,
                    "estimated_weight_kg": round(ir_wt, 1) if ir_wt is not None else None,
                    "applied_weight": round(w_ir / total_weight, 3) if ir_wt is not None else 0.0,
                    "measurement_nature": "TRANSIT_COUNT_DERIVED"
                },
                "cctv_vision": {
                    "count": req.cctv_head_count,
                    "estimated_weight_kg": round(cctv_wt, 1) if cctv_wt is not None else None,
                    "applied_weight": round(w_cctv / total_weight, 3) if cctv_wt is not None else 0.0,
                    "measurement_nature": "ESTIMATED_DENSITY_HEADCOUNT"
                }
            },
            anomaly_detected=anomaly,
            fusion_method="Weighted Multi-Source Sensor Fusion with Mechanical Strain Priority",
            health_status=health_status,
            recommendation=recommendation,
            physical_weight_status="PHYSICAL_WEIGHT_NOT_VERIFIED",
            estimated_passenger_payload_kg=round(pax_payload, 1),
            data_origin="SOFTWARE_DERIVED_PROTOTYPE",
            hardware_adapter_spec={
                "supported_protocols": ["Modbus-RTU over RS-485", "MQTT v3.1.1 (JSON payload)", "CAN bus 2.0B"],
                "target_microcontrollers": ["ESP32-S3 (Dual Core 240MHz)", "STM32F407 (ARM Cortex-M4)"],
                "physical_connection_status": "NOT_CONNECTED_PROTOTYPE_MODE",
                "calibration_standard": "Indian Railways RDSO/2013/CG-02 Bogie Specification"
            }
        )

# Global singleton
sensor_fusion_engine = MultiSourceSensorFusionEngine()
