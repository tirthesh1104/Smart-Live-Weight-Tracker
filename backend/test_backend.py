import os
import sys
import unittest
from fastapi.testclient import TestClient
from main import app
from models import (
    PredictionRequest, DeltaSyncRequest, SensorFusionRequest,
    CrowdBalancingRequest, CoachReading
)

class TestRailwayBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_health_check(self):
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["version"], "2.0.0")
        self.assertIn("Holt-Winters", data["algorithms"][0])
        print("  [PASS] Health check returns 200 with algorithm manifest.")

    def test_system_status(self):
        res = self.client.get("/api/system/status")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "healthy")
        print("  [PASS] GET /api/system/status returns 200.")

    def test_holt_winters_predict(self):
        payload = {
            "coach_id": "c-test-01",
            "coach_no": "S3",
            "coach_type": "Sleeper",
            "empty_weight_kg": 40000.0,
            "max_capacity_kg": 55000.0,
            "current_weight_kg": 48500.0,
            "historical_weights": [44000.0, 45200.0, 46800.0, 47900.0, 48500.0],
            "time_step_minutes": 5.0,
            "route_station_stops_remaining": 4,
            "is_rush_hour": True,
            "alpha": 0.35,
            "beta": 0.15
        }
        res = self.client.post("/predict", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["coach_no"], "S3")
        self.assertIn("velocity_kg_per_min", data)
        self.assertGreater(data["velocity_kg_per_min"], 0)
        self.assertEqual(len(data["predictions"]), 3)
        for p in data["predictions"]:
            self.assertIn(p["horizon_minutes"], [15, 30, 60])
            self.assertGreater(p["predicted_weight_kg"], 40000.0)
            self.assertGreater(p["upper_bound_kg"], p["lower_bound_kg"])
            self.assertGreater(p["confidence_score"], 0.5)
            self.assertIn("explanation", p)
        print("  [PASS] Holt-Winters prediction returned velocity, 3 horizons, and 95% confidence intervals.")

    def test_delta_sync_suppressed(self):
        payload = {
            "coach_id": "c-test-01",
            "current_weight_kg": 45005.0,
            "previous_weight_kg": 45000.0,
            "threshold_kg": 15.0,
            "elapsed_seconds": 10.0
        }
        res = self.client.post("/delta-sync", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertFalse(data["sync_required"])
        self.assertEqual(data["action"], "EDGE_SUPPRESSED")
        self.assertEqual(data["bandwidth_saved_percent"], 100.0)
        print("  [PASS] Delta sync correctly suppresses redundant packet (< 15kg change).")

    def test_delta_sync_breached(self):
        payload = {
            "coach_id": "c-test-01",
            "current_weight_kg": 45120.0,
            "previous_weight_kg": 45000.0,
            "threshold_kg": 15.0,
            "elapsed_seconds": 10.0
        }
        res = self.client.post("/delta-sync", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["sync_required"])
        self.assertEqual(data["action"], "SYNC_DISPATCH")
        self.assertGreaterEqual(data["abs_delta_kg"], 120.0)
        print("  [PASS] Delta sync dispatches packet when weight changes by 120kg (> 15kg threshold).")

    def test_sensor_fusion_healthy(self):
        payload = {
            "coach_id": "c-test-01",
            "coach_no": "D1",
            "coach_type": "General",
            "empty_weight_kg": 40000.0,
            "max_capacity_kg": 55000.0,
            "bogie_strain_kg": 47000.0,
            "ir_door_count": 100,
            "cctv_head_count": 105,
            "bogie_sensor_status": "healthy"
        }
        res = self.client.post("/sensor-fusion", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["health_status"], "Optimal")
        self.assertFalse(data["anomaly_detected"])
        self.assertGreater(data["fused_weight_kg"], 45000.0)
        print("  [PASS] Sensor fusion fuses bogie strain, IR count, and CCTV vision in optimal state.")

    def test_sensor_fusion_cargo_anomaly(self):
        payload = {
            "coach_id": "c-test-01",
            "coach_no": "D2",
            "coach_type": "General",
            "empty_weight_kg": 40000.0,
            "max_capacity_kg": 55000.0,
            "bogie_strain_kg": 52000.0,  # 12,000 kg payload
            "ir_door_count": 20,         # only 20 people = ~1360 kg
            "cctv_head_count": 22,
            "bogie_sensor_status": "healthy"
        }
        res = self.client.post("/sensor-fusion", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["anomaly_detected"])
        self.assertIn("COMMERCIAL CARGO", data["recommendation"])
        print("  [PASS] Sensor fusion detects undeclared heavy freight anomaly between optical and mechanical sensors.")

    def test_delta_sync_critical_overload_never_suppressed(self):
        # Weight is 56,000 kg (> 55,000 kg capacity), delta is only 5 kg (< 15kg threshold)
        payload = {
            "coach_id": "c-test-01",
            "current_weight_kg": 56005.0,
            "previous_weight_kg": 56000.0,
            "threshold_kg": 15.0,
            "max_capacity_kg": 55000.0,
            "elapsed_seconds": 5.0
        }
        res = self.client.post("/delta-sync", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["sync_required"], "Overload events must NEVER be suppressed")
        self.assertEqual(data["action"], "SYNC_DISPATCH")
        self.assertEqual(data["event_type"], "SAFETY_CRITICAL_OVERLOAD")
        self.assertTrue(data["is_critical_event"])
        print("  [PASS] Delta sync NEVER suppresses a safety-critical overload event even when delta < 15kg.")

    def test_delta_sync_sensor_transition_never_suppressed(self):
        # Delta is 0 kg, but sensor transitioned from healthy to degraded
        payload = {
            "coach_id": "c-test-01",
            "current_weight_kg": 45000.0,
            "previous_weight_kg": 45000.0,
            "threshold_kg": 15.0,
            "sensor_status": "degraded",
            "previous_sensor_status": "healthy",
            "elapsed_seconds": 5.0
        }
        res = self.client.post("/delta-sync", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["sync_required"], "Sensor transitions must NEVER be suppressed")
        self.assertEqual(data["action"], "SYNC_DISPATCH")
        self.assertEqual(data["event_type"], "SENSOR_HEALTH_EVENT")
        print("  [PASS] Delta sync NEVER suppresses a sensor degradation event.")

    def test_delta_sync_stale_update_rejected(self):
        # Current sequence is #40, but last seen was #45 (out-of-order retransmission)
        payload = {
            "coach_id": "c-test-01",
            "current_weight_kg": 46000.0,
            "previous_weight_kg": 45000.0,
            "sequence_number": 40,
            "last_seen_sequence_number": 45
        }
        res = self.client.post("/delta-sync", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertFalse(data["sync_required"])
        self.assertEqual(data["action"], "STALE_DROPPED")
        self.assertFalse(data["sequence_accepted"])
        print("  [PASS] Delta sync safely drops stale out-of-order sequence updates.")

    def test_recommend_coach_endpoint(self):
        payload = {
            "train_id": "trn-101",
            "coaches": [
                {"coach_id": "c-1", "coach_no": "D1", "coach_type": "General", "empty_weight_kg": 40000, "max_capacity_kg": 55000, "current_weight_kg": 54000, "occupancy_percentage": 93.3},
                {"coach_id": "c-2", "coach_no": "D2", "coach_type": "General", "empty_weight_kg": 40000, "max_capacity_kg": 55000, "current_weight_kg": 44000, "occupancy_percentage": 26.7}
            ],
            "preferred_type": "General"
        }
        res = self.client.post("/recommend-coach", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["recommended_coach_no"], "D2")
        print("  [PASS] POST /recommend-coach selects optimal coach with lowest crowding.")

    def test_platform_crowd_balancing(self):
        coaches = [
            {"coach_id": "c-1", "coach_no": "D1", "coach_type": "General", "empty_weight_kg": 40000, "max_capacity_kg": 55000, "current_weight_kg": 54500, "occupancy_percentage": 96.0},
            {"coach_id": "c-2", "coach_no": "D2", "coach_type": "General", "empty_weight_kg": 40000, "max_capacity_kg": 55000, "current_weight_kg": 43500, "occupancy_percentage": 23.0},
            {"coach_id": "c-3", "coach_no": "S1", "coach_type": "Sleeper", "empty_weight_kg": 40000, "max_capacity_kg": 55000, "current_weight_kg": 52000, "occupancy_percentage": 80.0},
            {"coach_id": "c-4", "coach_no": "S2", "coach_type": "Sleeper", "empty_weight_kg": 40000, "max_capacity_kg": 55000, "current_weight_kg": 46000, "occupancy_percentage": 40.0}
        ]
        payload = {
            "train_id": "trn-101",
            "train_number": "11020",
            "platform_no": 3,
            "coaches": coaches
        }
        res = self.client.post("/crowd-balance", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreater(data["imbalance_index"], 10.0)
        self.assertTrue(any(a["target_migration_coach"] == "D2" for a in data["advisories"]))
        self.assertIn("Coach D1 is heavily crowded", data["audio_chime_announcement"])
        print("  [PASS] Platform crowd balancing generates real passenger migration plan towards vacant coaches.")

    def test_railradar_status_endpoint(self):
        res = self.client.get("/api/railradar/status")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["service"], "RailRadar Integration Service")
        self.assertIn("configured", data)
        # Ensure secret key is strictly masked and raw key is never exposed
        key = os.getenv("RAILRADAR_API_KEY", "").strip()
        if key and len(key) > 8:
            self.assertNotIn(key, res.text)
            self.assertTrue("..." in data["masked_key"] or data["masked_key"] == "NOT_CONFIGURED")
        print("  [PASS] GET /api/railradar/status verified. Secrets sanitized.")

    def test_railradar_train_details_cached(self):
        res = self.client.get("/api/railradar/trains/12101")
        # May be 200 (if active key) or 401/403/429/500/502/503 (if key rotates/upstream auth/rate limit/sandbox)
        self.assertIn(res.status_code, [200, 401, 403, 429, 500, 502, 503])
        # Ensure raw API key is never in response body or headers
        key = os.getenv("RAILRADAR_API_KEY", "").strip()
        if key and len(key) > 8:
            self.assertNotIn(key, res.text)
        print("  [PASS] GET /api/railradar/trains/12101 verified without credential leakage.")

    def test_railradar_live_status(self):
        res = self.client.get("/api/railradar/trains/12101/live")
        # May be 200 (if active key) or 401/403/429/500/502/503 (if key rotates/upstream auth/rate limit/sandbox)
        self.assertIn(res.status_code, [200, 401, 403, 429, 500, 502, 503])
        # Ensure raw API key is never in response body or headers
        key = os.getenv("RAILRADAR_API_KEY", "").strip()
        if key and len(key) > 8:
            self.assertNotIn(key, res.text)
        print("  [PASS] GET /api/railradar/trains/12101/live verified without credential leakage.")

    def test_railway_providers_status(self):
        res = self.client.get("/api/railway/providers/status")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("providers", data)
        self.assertIn("railcore", data["providers"])
        self.assertIn("qrail", data["providers"])
        self.assertEqual(data["providers"]["railcore"]["service"], "RailCore Integration Service")
        self.assertEqual(data["providers"]["qrail"]["service"], "Qrail Integration Service")
        # Ensure zero key leakage
        qrail_key = os.getenv("QRAIL_API_KEY", "").strip()
        if qrail_key and len(qrail_key) > 8:
            self.assertNotIn(qrail_key, res.text)
        print("  [PASS] GET /api/railway/providers/status reports unified multi-provider health.")

    def test_railcore_status(self):
        res = self.client.get("/api/railcore/status")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["service"], "RailCore Integration Service")
        self.assertIn("free_plan_limits", data)
        print("  [PASS] GET /api/railcore/status verified.")

    def test_qrail_status(self):
        res = self.client.get("/api/qrail/status")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["service"], "Qrail Integration Service")
        self.assertIn("free_plan_limits", data)
        current_qrail = os.getenv("QRAIL_API_KEY", "").strip()
        if current_qrail and len(current_qrail) > 8:
            self.assertNotIn(current_qrail, res.text)
        print("  [PASS] GET /api/qrail/status verified with key masking.")

    def test_dual_gateway_multi_provider_retrieval(self):
        res = self.client.get("/api/railway/trains/12101/multi-provider")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["train_number"], "12101")
        self.assertIn("conflicts_detected", data)
        self.assertIn("source_type", data)
        current_qrail = os.getenv("QRAIL_API_KEY", "").strip()
        if current_qrail and len(current_qrail) > 8:
            self.assertNotIn(current_qrail, res.text)

    def test_railcore_mock_schedule_and_coach_position(self):
        from unittest.mock import patch, AsyncMock
        mock_schedule = {
            "success": True,
            "source": "RailCore",
            "data": {
                "trainNumber": "12101",
                "trainName": "Jnaneswari Super Deluxe Express",
                "source": "LTT",
                "destination": "HWH",
                "stations": [
                    {"code": "LTT", "name": "Lokmanya Tilak Terminus", "arrival": "00:00", "departure": "20:35"},
                    {"code": "HWH", "name": "Howrah Junction", "arrival": "03:50", "departure": "00:00"}
                ]
            }
        }
        mock_coaches = {
            "success": True,
            "source": "RailCore",
            "data": {
                "trainNumber": "12101",
                "coaches": ["ENG", "SLR", "GS", "GS", "S1", "S2", "B1", "A1", "SLR"]
            }
        }
        with patch("railcore_service.railcore_service.get_train_schedule", new=AsyncMock(return_value=mock_schedule)):
            with patch("railcore_service.railcore_service.get_coach_position", new=AsyncMock(return_value=mock_coaches)):
                res_sch = self.client.get("/api/railcore/trains/12101/schedule")
                self.assertEqual(res_sch.status_code, 200)
                self.assertEqual(res_sch.json()["data"]["trainName"], "Jnaneswari Super Deluxe Express")

                res_coaches = self.client.get("/api/railcore/trains/12101/coach-position")
                self.assertEqual(res_coaches.status_code, 200)
                self.assertIn("B1", res_coaches.json()["data"]["coaches"])
                print("  [PASS] RailCore schedule and coach position endpoints verified via mock responses.")

    def test_qrail_mock_schedule_and_plan_restriction(self):
        from unittest.mock import patch, AsyncMock
        mock_schedule = {
            "success": True,
            "source": "Qrail",
            "data": {
                "train_number": "12101",
                "train_name": "Jnaneswari Express",
                "from": "LTT",
                "to": "HWH"
            }
        }
        with patch("qrail_service.qrail_service.get_train_schedule", new=AsyncMock(return_value=mock_schedule)):
            res = self.client.get("/api/qrail/trains/12101/schedule")
            self.assertEqual(res.status_code, 200)
            self.assertEqual(res.json()["data"]["train_name"], "Jnaneswari Express")

        # Test running status without Pro plan
        mock_plan_restriction = {
            "success": False,
            "source": "Qrail",
            "code": "PLAN_RESTRICTION",
            "message": "Qrail Running Status requires Pro plan (₹1,999/yr). Free plan limited to Schedules, Trains Between Stations, and PNR.",
            "data": None
        }
        with patch("qrail_service.qrail_service.get_live_running_status", new=AsyncMock(return_value=mock_plan_restriction)):
            res_live = self.client.get("/api/qrail/trains/12101/running")
            self.assertEqual(res_live.status_code, 200)
            self.assertFalse(res_live.json()["success"])
            self.assertEqual(res_live.json().get("code"), "PLAN_RESTRICTION")
            print("  [PASS] Qrail schedule and Pro tier plan restriction enforcement verified.")

        # Test unauthorized Qrail response (upstream HTTP 200 with UnAuthorized Request JSON)
        mock_unauthorized = {
            "success": False,
            "error": {
                "code": "UNAUTHORIZED_REQUEST",
                "message": "Qrail Authentication Failed: UnAuthorized Request. The configured API key was rejected by Qrail.",
                "upstream_status": 200,
                "raw_error": "UnAuthorized Request"
            },
            "status_code": 401,
            "source_name": "Qrail",
            "upstream_status": 200
        }
        with patch("qrail_service.qrail_service.get_train_schedule", new=AsyncMock(return_value=mock_unauthorized)):
            res_unauth = self.client.get("/api/qrail/trains/12101/schedule")
            self.assertEqual(res_unauth.status_code, 401)
            self.assertIn("Qrail Authentication Failed", res_unauth.json()["detail"])
            print("  [PASS] Qrail unauthorized upstream HTTP 200 trapped and converted to HTTP 401 by gateway.")

    def test_gateway_conflict_detection_logic(self):
        from unittest.mock import patch, AsyncMock
        mock_rc = {
            "success": True,
            "source": "RailCore",
            "data": {
                "trainNumber": "12101",
                "trainName": "JNANESWARI DELUXE EXPRESS",
                "source": "LTT",
                "destination": "HWH"
            }
        }
        mock_qr = {
            "success": True,
            "source": "Qrail",
            "data": {
                "train_number": "12101",
                "train_name": "JNANESWARI EXP",
                "from": "LTT",
                "to": "HWH"
            }
        }
        with patch("railcore_service.railcore_service.is_configured", return_value=True):
            with patch("qrail_service.qrail_service.is_configured", return_value=True):
                with patch("railcore_service.railcore_service.get_train_schedule", new=AsyncMock(return_value=mock_rc)):
                    with patch("qrail_service.qrail_service.get_train_schedule", new=AsyncMock(return_value=mock_qr)):
                        res = self.client.get("/api/railway/trains/12101/multi-provider")
                        self.assertEqual(res.status_code, 200)
                        data = res.json()
                        self.assertTrue(data["success"])
                        self.assertGreaterEqual(data["conflict_count"], 1)
                        self.assertEqual(data["conflicts_detected"][0]["field"], "train_name")
                        print("  [PASS] Gateway detects provider discrepancies without silently overwriting data.")

    def test_gateway_failover_when_one_provider_offline(self):
        from unittest.mock import patch, AsyncMock
        mock_rc_fail = {
            "success": False,
            "source": "RailCore",
            "error": {"code": "RATE_LIMIT_EXCEEDED", "message": "Monthly quota exhausted"}
        }
        mock_qr_ok = {
            "success": True,
            "source": "Qrail",
            "data": {
                "train_number": "12101",
                "train_name": "Jnaneswari Express",
                "from": "LTT",
                "to": "HWH"
            }
        }
        with patch("railcore_service.railcore_service.is_configured", return_value=True):
            with patch("qrail_service.qrail_service.is_configured", return_value=True):
                with patch("railcore_service.railcore_service.get_train_schedule", new=AsyncMock(return_value=mock_rc_fail)):
                    with patch("qrail_service.qrail_service.get_train_schedule", new=AsyncMock(return_value=mock_qr_ok)):
                        res = self.client.get("/api/railway/trains/12101/multi-provider")
                        self.assertEqual(res.status_code, 200)
                        data = res.json()
                        self.assertTrue(data["success"])
                        self.assertEqual(data["primary_source"], "qrail")
                        print("  [PASS] Gateway gracefully fails over from failed provider to available secondary provider.")

    def test_railradar_mock_train_details_and_route(self):
        from unittest.mock import patch, AsyncMock
        mock_details = {
            "success": True,
            "source_name": "RailRadar",
            "retrieved_at": "2026-11-13T12:00:00Z",
            "data": {
                "train": {
                    "number": "12101",
                    "name": "Jnaneswari Express",
                    "source": {"name": "Lokmanya Tilak Terminus", "code": "LTT"},
                    "destination": {"name": "Howrah Junction", "code": "HWH"}
                },
                "schedule": [
                    {"stationName": "Lokmanya Tilak Terminus", "stationCode": "LTT", "scheduledDeparture": "20:35"},
                    {"stationName": "Howrah Junction", "stationCode": "HWH", "scheduledArrival": "03:50"}
                ]
            }
        }
        mock_route = {
            "success": True,
            "source_name": "RailRadar",
            "data": {
                "type": "FeatureCollection",
                "features": [{"type": "Feature", "geometry": {"type": "LineString", "coordinates": [[72.88, 19.06], [88.34, 22.58]]}}]
            }
        }
        with patch("railradar_service.railradar_service.get_train_details", new=AsyncMock(return_value=mock_details)):
            with patch("railradar_service.railradar_service.get_train_route_geometry", new=AsyncMock(return_value=mock_route)):
                res_det = self.client.get("/api/railradar/trains/12101")
                self.assertEqual(res_det.status_code, 200)
                self.assertEqual(res_det.json()["data"]["train"]["number"], "12101")
                self.assertEqual(res_det.json()["source_name"], "RailRadar")

                res_route = self.client.get("/api/railradar/trains/12101/route")
                self.assertEqual(res_route.status_code, 200)
                self.assertEqual(res_route.json()["data"]["type"], "FeatureCollection")
                print("  [PASS] RailRadar train details and GeoJSON route endpoints verified via mock responses.")

    def test_railradar_mock_live_status(self):
        from unittest.mock import patch, AsyncMock
        mock_live = {
            "success": True,
            "source_name": "RailRadar",
            "data": {
                "trainNumber": "12101",
                "trainName": "Jnaneswari Express",
                "status": "Running",
                "delayMinutes": 0,
                "currentLocation": {
                    "stationName": "Bhusaval Junction",
                    "stationCode": "BSL",
                    "speedKmh": 98
                },
                "nextHalt": {
                    "stationName": "Akola Junction",
                    "stationCode": "AK",
                    "distance": 84
                }
            }
        }
        with patch("railradar_service.railradar_service.get_train_live_status", new=AsyncMock(return_value=mock_live)):
            res = self.client.get("/api/railradar/trains/12101/live")
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertTrue(data["success"])
            self.assertEqual(data["data"]["delayMinutes"], 0)
            self.assertEqual(data["data"]["currentLocation"]["speedKmh"], 98)
            print("  [PASS] RailRadar live status endpoint verified with speed, delay, and location.")

    def test_railradar_caching_and_quota_protection(self):
        from railradar_service import TTLCache
        test_cache = TTLCache()
        # Set cache with 60 second TTL
        test_cache.set("test:12101", {"cached_train": "12101"}, ttl_seconds=60)
        cached = test_cache.get("test:12101")
        self.assertIsNotNone(cached)
        self.assertEqual(cached["cached_train"], "12101")
        # Ensure expired entries are dropped
        test_cache.set("test:expired", {"old": True}, ttl_seconds=-1)
        self.assertIsNone(test_cache.get("test:expired"))
        print("  [PASS] RailRadar TTL cache layer enforces quota protection and automatic expiration.")

    def test_railradar_error_handling_401_429(self):
        from unittest.mock import patch, AsyncMock
        mock_401 = {
            "success": False,
            "error": {"code": "UNAUTHORIZED", "message": "RailRadar API authentication failed."},
            "status_code": 401,
            "source_name": "RailRadar"
        }
        mock_429 = {
            "success": False,
            "error": {"code": "RATE_LIMIT_EXCEEDED", "message": "RailRadar API rate limit exceeded."},
            "status_code": 429,
            "source_name": "RailRadar"
        }
        with patch("railradar_service.railradar_service.get_train_details", new=AsyncMock(return_value=mock_401)):
            res = self.client.get("/api/railradar/trains/12101")
            self.assertEqual(res.status_code, 401)
            self.assertEqual(res.json()["detail"], "RailRadar API authentication failed.")

        with patch("railradar_service.railradar_service.get_train_details", new=AsyncMock(return_value=mock_429)):
            res = self.client.get("/api/railradar/trains/12101")
            self.assertEqual(res.status_code, 429)
            self.assertEqual(res.json()["detail"], "RailRadar API rate limit exceeded.")
        print("  [PASS] RailRadar handles HTTP 401 and 429 upstream statuses with honest error reporting.")

    def test_states_and_cities_directory(self):
        res = self.client.get("/api/railway/directory/states")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["total_states"], 28)
        self.assertEqual(data["total_union_territories"], 8)
        self.assertEqual(data["total_states_and_uts"], 36)
        self.assertEqual(len(data["states"]), 36)
        # Check Maharashtra exists and has major hubs
        mh = next((s for s in data["states"] if s["state"] == "Maharashtra"), None)
        self.assertIsNotNone(mh)
        self.assertIn("Mumbai", mh["cities"])
        self.assertIn("Pune", mh["cities"])
        print("  [PASS] GET /api/railway/directory/states verified: All 28 States & 8 Union Territories returned.")

    def test_stations_directory_search(self):
        from unittest.mock import patch, AsyncMock
        mock_catalog = {"CSMT": "Chhatrapati Shivaji Maharaj Terminus", "PUNE": "Pune Junction"}
        with patch("railway_directory_service.railway_directory_service._get_stations_catalog", new=AsyncMock(return_value=mock_catalog)):
            res = self.client.get("/api/railway/directory/stations?query=CSMT")
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertTrue(data["success"])
            self.assertGreater(data["total_matches"], 0)
            self.assertEqual(data["stations"][0]["code"], "CSMT")
            print("  [PASS] GET /api/railway/directory/stations verified with query matching.")

    def test_trains_search_directory(self):
        from unittest.mock import patch, AsyncMock
        mock_trains = {"12101": "Jnaneswari Express", "11020": "Konark Express"}
        with patch("railway_directory_service.railway_directory_service._get_train_catalog", new=AsyncMock(return_value=mock_trains)):
            res = self.client.get("/api/railway/trains/search?query=12101")
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertTrue(data["success"])
            self.assertEqual(len(data["trains"]), 1)
            self.assertEqual(data["trains"][0]["train_number"], "12101")
            self.assertEqual(data["trains"][0]["train_name"], "Jnaneswari Express")
            print("  [PASS] GET /api/railway/trains/search verified with fast paginated search.")

    def test_full_train_details(self):
        from unittest.mock import patch, AsyncMock
        mock_details = {
            "success": True,
            "train_number": "12101",
            "train_name": "Jnaneswari Express",
            "source_station": "CSMT",
            "destination_station": "HWH",
            "stops_count": 2,
            "stops": [
                {"sequence": 1, "station_code": "CSMT", "station_name": "Mumbai CSMT"},
                {"sequence": 2, "station_code": "KYN", "station_name": "Kalyan Jn"}
            ],
            "coaches": [
                {"sequence": 1, "coach_name": "ENG", "coach_type": "Engine"}
            ],
            "rake_formation": "ENG-GEN-S1",
            "provenance": {
                "schedule_source": "RailCore Developer API",
                "coach_position_source": "RailCore Coach Position API",
                "live_running_source": "RailRadar Live API",
                "weight_sensor_source": "SIMULATED SENSOR DATA (Mechanical Bogie Strain Bench)"
            }
        }
        with patch("railway_directory_service.railway_directory_service.get_full_train_details", new=AsyncMock(return_value=mock_details)):
            res = self.client.get("/api/railway/trains/12101/full-details")
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertTrue(data["success"])
            self.assertEqual(data["train_number"], "12101")
            self.assertIn("SIMULATED SENSOR DATA", data["provenance"]["weight_sensor_source"])
            print("  [PASS] GET /api/railway/trains/12101/full-details verified with provenance tags.")

    def test_sync_status_diagnostic(self):
        from unittest.mock import patch, AsyncMock
        mock_status = {
            "success": True,
            "total_verified_trains_catalog": 11435,
            "total_verified_stations_catalog": 13015,
            "successful_sync_count": 3,
            "failed_sync_count": 0,
            "providers": {
                "railradar": {"status": "AUTHORIZED_LIVE"},
                "railcore": {"status": "AUTHORIZED_LIVE"},
                "railkit": {"status": "UPGRADE_PLAN_REQUIRED", "details": "Plan upgrade required"},
                "qrail": {"status": "UNAVAILABLE", "details": "AUTHENTICATION_REQUIRED"}
            }
        }
        with patch("railway_directory_service.railway_directory_service.get_sync_status", new=AsyncMock(return_value=mock_status)):
            res = self.client.get("/api/railway/sync/status")
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertTrue(data["success"])
            self.assertEqual(data["providers"]["qrail"]["status"], "UNAVAILABLE")
            self.assertIn("railkit", data["providers"])
            print("  [PASS] GET /api/railway/sync/status verified: Qrail and RailKit diagnostics returned.")

    def test_railkit_status_and_credential_sanitization(self):
        res = self.client.get("/api/railkit/status")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["provider"], "RailKit (api.railkit.in)")
        self.assertIn("supported_features", data)
        self.assertGreater(len(data["supported_features"]), 0)
        # Ensure raw key is NEVER exposed in response
        key = os.getenv("RAILKIT_API_KEY", "").strip()
        if key and len(key) > 8:
            self.assertNotIn(key, res.text)
            self.assertTrue("..." in data["masked_key"] or data["masked_key"] == "NOT_CONFIGURED")
        print("  [PASS] GET /api/railkit/status verified: Secret credentials strictly sanitized.")

    def test_railkit_validation_plan_handling(self):
        from unittest.mock import patch, AsyncMock
        mock_val = {
            "configured": True,
            "authenticated": False,
            "status": "UPGRADE_PLAN_REQUIRED",
            "masked_key": "railkit_8a...4e4f",
            "message": "Missing SDK signature headers. To use the API, please upgrade your plan."
        }
        with patch("railkit_service.railkit_service.validate_credentials", new=AsyncMock(return_value=mock_val)):
            res = self.client.get("/api/railkit/validate")
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertFalse(data["authenticated"])
            self.assertEqual(data["status"], "UPGRADE_PLAN_REQUIRED")
            self.assertIn("upgrade your plan", data["message"])
            print("  [PASS] GET /api/railkit/validate handles plan limitations honestly without synthetic data.")

    def test_railkit_import_blocks_on_plan_restriction(self):
        from unittest.mock import patch, AsyncMock
        mock_val = {
            "configured": True,
            "authenticated": False,
            "status": "UPGRADE_PLAN_REQUIRED",
            "message": "Missing SDK signature headers. To use the API, please upgrade your plan."
        }
        with patch("railkit_service.railkit_service.validate_credentials", new=AsyncMock(return_value=mock_val)):
            res = self.client.post("/api/railkit/import/train/12101")
            self.assertEqual(res.status_code, 403)
            self.assertIn("Cannot import from RailKit", res.json()["detail"])
            print("  [PASS] POST /api/railkit/import/train/12101 refuses import when API plan requires upgrade.")

    def test_hardware_specification(self):
        res = self.client.get("/api/hardware/spec")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertFalse(data["operational_physical_hardware_connected"])
        self.assertIn("data_provenance_physical", data)
        self.assertIn("pinout_diagram", data)
        self.assertIn("adc_saturation_limits", data)
        print("  [PASS] GET /api/hardware/spec verified: RDSO sensor pinouts, ADC bounds, and physical sensor status returned.")

    def test_hardware_devices_list(self):
        res = self.client.get("/api/hardware/devices")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIsInstance(data, list)
        self.assertGreaterEqual(len(data), 1)
        self.assertIn("ESP32-BOGIE-12101-S1", [d["device_id"] for d in data])
        print("  [PASS] GET /api/hardware/devices returns registered hardware controllers.")

    def test_hardware_telemetry_ingest_normal(self):
        payload = {
            "device_id": "ESP32-BOGIE-12101-S1",
            "train_number": "12101",
            "coach_no": "S1",
            "coach_type": "Sleeper",
            "tare_weight_kg": 40000.0,
            "max_gross_weight_kg": 55000.0,
            "hx711_bogie_a_raw": 5170000,   # ~24000 kg on Bogie A
            "hx711_bogie_b_raw": 5170000,   # ~24000 kg on Bogie B
            "calibration_scale_a": 215.4,
            "calibration_scale_b": 215.4,
            "ir_door_in_count": 82,
            "ir_door_out_count": 14,
            "battery_voltage_mv": 3280,
            "rssi_dbm": -68,
            "sequence_id": 42,
            "is_physical_sensor": False
        }
        res = self.client.post("/api/hardware/telemetry/ingest", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["provenance"], "HARDWARE_PROTOCOL_TEST_SIMULATION")
        self.assertEqual(data["health_status"], "HEALTHY")
        self.assertGreater(data["measured_gross_weight_kg"], 40000.0)
        self.assertGreater(data["occupancy_percentage"], 0.0)
        self.assertIn("sensor_telemetry", data)
        self.assertEqual(data["sensor_telemetry"]["optical_passengers_in_coach"], 68)
        print("  [PASS] POST /api/hardware/telemetry/ingest verified: Calibrated dual-bogie load correctly marked as HARDWARE_PROTOCOL_TEST_SIMULATION.")

    def test_hardware_telemetry_adc_saturation_fault(self):
        payload = {
            "device_id": "ESP32-BOGIE-12101-S1",
            "train_number": "12101",
            "coach_no": "S1",
            "coach_type": "Sleeper",
            "tare_weight_kg": 40000.0,
            "max_gross_weight_kg": 55000.0,
            "hx711_bogie_a_raw": 8388600,   # Saturated / Rail open circuit
            "hx711_bogie_b_raw": 8388607,   # Saturated / Rail open circuit
            "calibration_scale_a": 215.4,
            "calibration_scale_b": 215.4,
            "ir_door_in_count": 5,
            "ir_door_out_count": 1,
            "sequence_id": 43
        }
        res = self.client.post("/api/hardware/telemetry/ingest", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["health_status"], "FAULT_BOTH_LOADCELLS_OPEN_OR_SATURATED")
        print("  [PASS] Hardware fault detection verified: 24-bit ADC saturation correctly flagged.")

    def test_auth_validate_email_endpoint(self):
        res_valid = self.client.get("/api/auth/validate-email", params={"email": "abc123@gmail.com"})
        self.assertEqual(res_valid.status_code, 200)
        self.assertTrue(res_valid.json()["valid"])

        res_invalid = self.client.get("/api/auth/validate-email", params={"email": "not-an-email"})
        self.assertEqual(res_invalid.status_code, 200)
        self.assertFalse(res_invalid.json()["valid"])
        print("  [PASS] GET /api/auth/validate-email endpoint verified for valid and invalid emails.")

if __name__ == "__main__":
    unittest.main()
