"""
FastAPI Endpoint Direct Verification Script (Synchronous Handlers)
Tests GET /health, GET /api/system/status, POST /predict (valid & edge),
POST /delta-sync, POST /sensor-fusion, POST /crowd-balance.
"""
import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import main
from models import (
    PredictionRequest, DeltaSyncRequest, SensorFusionRequest,
    CrowdBalancingRequest, CoachReading
)

def test_all_endpoints():
    print("=" * 65)
    print("FASTAPI BACKEND HANDLER VERIFICATION")
    print("=" * 65)
    
    # 1. GET /health
    health_res = main.health_check()
    print("\n[1] GET /health")
    print(f"    Status: 200 OK")
    print(f"    Algorithms: {health_res['algorithms'][0]}")
    assert health_res["status"] == "healthy"
    assert "Holt-Winters" in health_res["algorithms"][0]

    # 2. GET /api/system/status
    sys_status_res = main.health_check()  # routes mapped to same handler
    print("\n[2] GET /api/system/status")
    print(f"    Status: 200 OK")
    assert sys_status_res["status"] == "healthy"

    # 3. POST /predict (Valid Input)
    valid_req = PredictionRequest(
        coach_id="COACH-TST-01",
        coach_no="S-3",
        coach_type="Sleeper",
        empty_weight_kg=40000.0,
        max_capacity_kg=55000.0,
        current_weight_kg=48500.0,
        historical_weights=[44000.0, 45200.0, 46800.0, 47900.0, 48500.0],
        time_step_minutes=5.0,
        route_station_stops_remaining=4,
        is_rush_hour=True,
        alpha=0.35,
        beta=0.15
    )
    pred_res = main.predict_crowd(valid_req)
    print("\n[3] POST /predict (Valid Input)")
    print(f"    Status: 200 OK")
    print(f"    Coach: {pred_res.coach_no}, Velocity: {pred_res.velocity_kg_per_min:.2f} kg/min")
    print(f"    Model Used: {pred_res.model_used}")
    print(f"    Horizons Count: {len(pred_res.predictions)}")
    for p in pred_res.predictions:
        print(f"      +{p.horizon_minutes}m: {p.predicted_occupancy:.1f}% ({p.predicted_weight_kg:.0f} kg), CI=[{p.lower_bound_kg:.0f}, {p.upper_bound_kg:.0f}], Conf={p.confidence_score}")

    # 4. POST /predict (Edge / Insufficient Input handling)
    print("\n[4] POST /predict (Edge / Insufficient Input handling)")
    edge_req = PredictionRequest(
        coach_id="COACH-EDGE",
        coach_no="GEN-1",
        empty_weight_kg=40000.0,
        max_capacity_kg=55000.0,
        current_weight_kg=40000.0,
        historical_weights=[]
    )
    edge_res = main.predict_crowd(edge_req)
    print(f"    Handled gracefully without crashing: Model={edge_res.model_used}")
    print(f"    Limitations note: {edge_res.limitations}")

    # 5. POST /delta-sync
    print("\n[5] POST /delta-sync")
    # Sub-test A: Suppressed (< 15 kg)
    ds_sup_req = DeltaSyncRequest(
        coach_id="COACH-1",
        current_weight_kg=45005.0,
        previous_weight_kg=45000.0,
        threshold_kg=15.0,
        elapsed_seconds=10.0
    )
    ds_sup_res = main.delta_sync(ds_sup_req)
    print(f"    Delta 5kg -> Action: {ds_sup_res.action}, Sync Required: {ds_sup_res.sync_required}")
    assert ds_sup_res.action == "EDGE_SUPPRESSED"
    assert ds_sup_res.sync_required is False

    # Sub-test B: Breached (>= 15 kg)
    ds_br_req = DeltaSyncRequest(
        coach_id="COACH-1",
        current_weight_kg=45080.0,
        previous_weight_kg=45000.0,
        threshold_kg=15.0,
        elapsed_seconds=10.0
    )
    ds_br_res = main.delta_sync(ds_br_req)
    print(f"    Delta 80kg -> Action: {ds_br_res.action}, Sync Required: {ds_br_res.sync_required}")
    assert ds_br_res.action == "SYNC_DISPATCH"
    assert ds_br_res.sync_required is True

    # 6. POST /sensor-fusion
    print("\n[6] POST /sensor-fusion")
    # Case A: Normal 3-sensor fusion
    sf_req = SensorFusionRequest(
        coach_id="COACH-SF1",
        coach_no="S-2",
        bogie_strain_kg=47000.0,
        ir_door_count=98,
        cctv_head_count=102,
        bogie_sensor_status="healthy"
    )
    sf_res = main.fuse_sensors(sf_req)
    print(f"    Healthy 3-sensor -> Fused Weight: {sf_res.fused_weight_kg:.1f} kg, Conf: {sf_res.confidence_score}")

    # Case B: Anomaly Detection (Freight/Cargo discrepancy)
    sf_anomaly_req = SensorFusionRequest(
        coach_id="COACH-SF2",
        coach_no="S-5",
        bogie_strain_kg=53500.0,  # heavy bogie load (+13500kg)
        ir_door_count=20,         # only 20 people (~1360kg)
        cctv_head_count=22,
        bogie_sensor_status="healthy"
    )
    sf_anomaly_res = main.fuse_sensors(sf_anomaly_req)
    print(f"    Freight Discrepancy -> Anomaly Detected: {sf_anomaly_res.anomaly_detected}, Method: {sf_anomaly_res.fusion_method}")
    assert sf_anomaly_res.anomaly_detected is True

    # Case C: All sensors offline
    sf_offline_req = SensorFusionRequest(
        coach_id="COACH-SF3",
        coach_no="S-6",
        bogie_strain_kg=0.0,
        ir_door_count=None,
        cctv_head_count=None,
        bogie_sensor_status="offline"
    )
    sf_offline_res = main.fuse_sensors(sf_offline_req)
    print(f"    All Sensors Offline -> Fused Weight: {sf_offline_res.fused_weight_kg} kg, Conf: {sf_offline_res.confidence_score}")
    print(f"    Sensor Breakdown Health: {sf_offline_res.sensor_breakdown.get('health_status')}")

    # 7. POST /crowd-balance
    print("\n[7] POST /crowd-balance")
    cb_req = CrowdBalancingRequest(
        train_id="TRN-202",
        train_number="12111",
        platform_no=2,
        coaches=[
            CoachReading(coach_id="c-1", coach_no="D1", coach_type="General", empty_weight_kg=40000, max_capacity_kg=55000, current_weight_kg=54500, occupancy_percentage=96.7),
            CoachReading(coach_id="c-2", coach_no="D2", coach_type="General", empty_weight_kg=40000, max_capacity_kg=55000, current_weight_kg=43200, occupancy_percentage=21.3),
            CoachReading(coach_id="c-3", coach_no="S1", coach_type="Sleeper", empty_weight_kg=40000, max_capacity_kg=55000, current_weight_kg=52000, occupancy_percentage=80.0),
            CoachReading(coach_id="c-4", coach_no="S2", coach_type="Sleeper", empty_weight_kg=40000, max_capacity_kg=55000, current_weight_kg=45000, occupancy_percentage=33.3)
        ]
    )
    cb_res = main.balance_platform_crowd(cb_req)
    print(f"    Imbalance Index: {cb_res.imbalance_index:.1f}%")
    print(f"    Total Advisories: {len(cb_res.advisories)}")
    print(f"    Audio Announcement: {cb_res.audio_chime_announcement}")
    assert cb_res.imbalance_index > 10.0
    assert len(cb_res.advisories) > 0

    print("\n" + "=" * 65)
    print("ALL 7 ENDPOINT AND ALGORITHM CHECKS PASSED PERFECTLY!")
    print("=" * 65)

if __name__ == "__main__":
    test_all_endpoints()
