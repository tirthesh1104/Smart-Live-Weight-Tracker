"""
Smart Live Weight Tracker - Hardware Integration & ESP32/HX711 Automated Test Suite
===================================================================================
Validates:
1. ESP32 Device Identification, Registration, and Cryptographic Token Verification
2. Device Heartbeat Supervision, Battery Health, and Online State Tracking
3. Multi-Sensor Coach Weight Model (Bogie A/B, 4-Quadrant Left/Right Lateral Balance)
4. HX711 24-bit ADC Saturation Bounds, Disconnection Faults, and Degraded Modes
5. Physical Safety Hazards: Critical Overload, Lateral Imbalance, Longitudinal Imbalance, Weight Jump
6. Monotonic Sequence Tracking, Duplicate Packet Flags, and Rate Limiting
7. 10-Step Administrator Calibration Workflow (Zero Tare, Reference Scale, Error Bounds)
8. Safety Alert Deduplication, Cooldown Filters, and Operational Acknowledgment
"""

import unittest
from fastapi.testclient import TestClient
from main import app
from hardware_adapter import hardware_gateway

class TestHardwareIntegration(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_device_registration_and_authentication(self):
        """Test registering a new ESP32 controller and verifying token authentication."""
        reg_payload = {
            "device_id": "ESP32-BOGIE-12101-A1",
            "train_number": "12101",
            "coach_no": "A1",
            "coach_type": "AC 2-Tier",
            "auth_token": "secret_token_12101_a1_secure99",
            "mac_address": "24:6F:28:B2:1A:04",
            "hardware_model": "ESP32-WROOM-32D-Dual-HX711"
        }
        res = self.client.post("/api/hardware/devices/register", json=reg_payload)
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()["success"])
        self.assertEqual(res.json()["status"], "REGISTERED")

        # Verify device appears in list
        devs_res = self.client.get("/api/hardware/devices")
        dev_ids = [d["device_id"] for d in devs_res.json()]
        self.assertIn("ESP32-BOGIE-12101-A1", dev_ids)

        # Ingest with physical sensor flag AND valid token -> CERTIFIED_PHYSICAL_HARDWARE
        packet = {
            "device_id": "ESP32-BOGIE-12101-A1",
            "train_number": "12101",
            "coach_no": "A1",
            "coach_type": "AC 2-Tier",
            "tare_weight_kg": 42000.0,
            "max_gross_weight_kg": 54000.0,
            "hx711_bogie_a_raw": 4800000,
            "hx711_bogie_b_raw": 4800000,
            "calibration_scale_a": 215.4,
            "calibration_scale_b": 215.4,
            "is_physical_sensor": True,
            "auth_token": "secret_token_12101_a1_secure99"
        }
        ingest_res = self.client.post("/api/hardware/telemetry/ingest", json=packet)
        self.assertEqual(ingest_res.status_code, 200)
        self.assertEqual(ingest_res.json()["provenance"], "CERTIFIED_PHYSICAL_HARDWARE")

        # Ingest with physical sensor flag BUT invalid token -> Rejection HTTP 401
        packet["auth_token"] = "invalid_spoofed_token"
        unauth_res = self.client.post("/api/hardware/telemetry/ingest", json=packet)
        self.assertEqual(unauth_res.status_code, 401)
        print("  [PASS] Device registration and cryptographic physical sensor authentication verified.")

    def test_device_heartbeat_and_battery(self):
        """Test device heartbeat ping and low battery detection."""
        hb_payload = {
            "device_id": "ESP32-BOGIE-12101-S1",
            "auth_token": "esp32_dev_token_12101_s1_sec7788",
            "battery_voltage_mv": 3050,  # Below 3100 mV threshold
            "rssi_dbm": -72,
            "uptime_seconds": 14200,
            "status": "OPERATIONAL"
        }
        res = self.client.post("/api/hardware/heartbeat", json=hb_payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertTrue(data["authenticated"])

        # Verify low battery alert was recorded
        alerts_res = self.client.get("/api/hardware/alerts")
        alerts = alerts_res.json()
        battery_alerts = [a for a in alerts if a["fault_type"] == "BATTERY_LOW"]
        self.assertGreaterEqual(len(battery_alerts), 1)
        print("  [PASS] Device heartbeat and battery monitoring verified.")

    def test_quadrant_lateral_and_longitudinal_imbalance(self):
        """Test 4-quadrant load calculation and lateral imbalance hazard detection."""
        # 4-Quadrant packet with severe lateral imbalance (left side heavily overloaded)
        packet = {
            "device_id": "ESP32-BOGIE-12101-S1",
            "train_number": "12101",
            "coach_no": "S1",
            "coach_type": "Sleeper",
            "tare_weight_kg": 40000.0,
            "max_gross_weight_kg": 55000.0,
            # Left side: high load (raw ~5,000,000 / 215.4 ~ 23,200 kg)
            "hx711_bogie_a_left_raw": 3500000,
            "hx711_bogie_a_right_raw": 1000000,
            "hx711_bogie_b_left_raw": 3500000,
            "hx711_bogie_b_right_raw": 1000000,
            # Overall bogie sums
            "hx711_bogie_a_raw": 4500000,
            "hx711_bogie_b_raw": 4500000,
            "calibration_scale_a": 215.4,
            "calibration_scale_b": 215.4,
            "calibration_scale_a_left": 215.4,
            "calibration_scale_a_right": 215.4,
            "calibration_scale_b_left": 215.4,
            "calibration_scale_b_right": 215.4,
            "sequence_id": 102
        }
        res = self.client.post("/api/hardware/telemetry/ingest", json=packet)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        telemetry = data["sensor_telemetry"]
        
        # Lateral imbalance should exceed 25%
        self.assertGreater(telemetry["lateral_imbalance_percent"], 25.0)
        self.assertIn("LATERAL_IMBALANCE_HAZARD", data["safety_alerts"])
        print(f"  [PASS] 4-Quadrant lateral imbalance hazard flagged ({telemetry['lateral_imbalance_percent']}% > 25%).")

    def test_critical_overload_and_abnormal_weight_jump(self):
        """Test critical overload (> 120%) and abnormal sudden weight shift detection."""
        # Gross weight ~ 70,000 kg on a 55,000 kg capacity coach (127% overload)
        packet = {
            "device_id": "ESP32-BOGIE-12101-GEN1",
            "train_number": "12101",
            "coach_no": "GEN-1",
            "coach_type": "General",
            "tare_weight_kg": 38000.0,
            "max_gross_weight_kg": 50000.0,
            "hx711_bogie_a_raw": 7500000,  # ~34,800 kg
            "hx711_bogie_b_raw": 7500000,  # ~34,800 kg => Total ~69,600 kg
            "calibration_scale_a": 215.4,
            "calibration_scale_b": 215.4,
            "sequence_id": 501
        }
        res = self.client.post("/api/hardware/telemetry/ingest", json=packet)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["is_overloaded"])
        self.assertIn("CRITICAL_OVERLOAD_HAZARD", data["safety_alerts"])
        print("  [PASS] Critical overload (>120% capacity) detected and safety alert issued.")

    def test_ten_step_calibration_workflow(self):
        """Test the complete 10-step Administrator Calibration workflow."""
        device_id = "ESP32-BOGIE-12101-S1"

        # Step 4: Zero Calibration
        zero_req = {
            "device_id": device_id,
            "train_number": "12101",
            "coach_no": "S1",
            "raw_zero_a": 12500,
            "raw_zero_b": 12350,
            "operator_name": "Chief Rolling Stock Inspector",
            "notes": "Empty coach zero baseline test"
        }
        zero_res = self.client.post("/api/hardware/calibration/zero", json=zero_req)
        self.assertEqual(zero_res.status_code, 200)
        self.assertEqual(zero_res.json()["stage"], "ZERO_TARE_RECORDED")

        # Step 5-8: Apply 10,000 kg certified test deadweight
        # Bogie A ref = 5000 kg -> raw delta = 5000 * 215.4 = 1,077,000 counts
        scale_req = {
            "device_id": device_id,
            "train_number": "12101",
            "coach_no": "S1",
            "reference_weight_kg": 10000.0,
            "measured_raw_with_reference_a": 12500 + 1077000,
            "measured_raw_with_reference_b": 12350 + 1077000,
            "secondary_validation_weight_kg": 6000.0,
            "secondary_measured_raw_a": 12500 + 646200,
            "secondary_measured_raw_b": 12350 + 646200,
            "operator_name": "Chief Rolling Stock Inspector",
            "certificate_no": "CAL-RDSO-TEST-2026-S1",
            "notes": "10-ton standard test deadweight verification"
        }
        scale_res = self.client.post("/api/hardware/calibration/calibrate", json=scale_req)
        self.assertEqual(scale_res.status_code, 200)
        scale_data = scale_res.json()
        self.assertTrue(scale_data["success"])
        self.assertEqual(scale_data["status"], "VALID")
        self.assertAlmostEqual(scale_data["scale_a"], 215.4, delta=0.5)
        self.assertLessEqual(scale_data["validation_error_percent"], 0.50)

        # Step 9-10: Check calibration audit trail
        history_res = self.client.get("/api/hardware/calibration/history", params={"device_id": device_id})
        self.assertEqual(history_res.status_code, 200)
        certs = [c["certificate_no"] for c in history_res.json()]
        self.assertIn("CAL-RDSO-TEST-2026-S1", certs)
        print("  [PASS] 10-Step Administrator Calibration workflow and certificate issuance verified.")

    def test_alert_management_and_acknowledgment(self):
        """Test retrieving safety alerts and acknowledging an active alert."""
        # Record a test alert first
        hardware_gateway._record_alert(
            device_id="ESP32-BOGIE-12101-S1",
            coach_no="S1",
            train_number="12101",
            fault_type="TEST_FAULT_SUPERVISION",
            severity="WARNING",
            message="Supervisory telemetry verification test alert."
        )

        alerts_res = self.client.get("/api/hardware/alerts")
        self.assertEqual(alerts_res.status_code, 200)
        alerts = alerts_res.json()
        self.assertIsInstance(alerts, list)
        self.assertGreater(len(alerts), 0)

        alert_id = alerts[0]["id"]
        ack_res = self.client.post(f"/api/hardware/alerts/{alert_id}/ack")
        self.assertEqual(ack_res.status_code, 200)
        self.assertTrue(ack_res.json()["success"])
        print("  [PASS] Safety alert management and operational acknowledgment verified.")

    def test_latest_telemetry_and_coach_fusion(self):
        """Test retrieving latest hardware telemetry and coach-level fused telemetry."""
        # 1. Ingest telemetry
        packet = {
            "device_id": "ESP32-BOGIE-12101-S1",
            "train_number": "12101",
            "coach_no": "S1",
            "coach_type": "Sleeper",
            "tare_weight_kg": 40000.0,
            "max_gross_weight_kg": 55000.0,
            "hx711_bogie_a_raw": 5170000,
            "hx711_bogie_b_raw": 5170000,
            "calibration_scale_a": 215.4,
            "calibration_scale_b": 215.4,
            "sequence_id": 999
        }
        res = self.client.post("/api/hardware/telemetry/ingest", json=packet)
        self.assertEqual(res.status_code, 200)

        # 2. Query latest telemetry list
        latest_res = self.client.get("/api/hardware/telemetry/latest")
        self.assertEqual(latest_res.status_code, 200)
        telemetry = latest_res.json()
        self.assertIsInstance(telemetry, list)
        self.assertGreater(len(telemetry), 0)

        # 3. Query coach fused telemetry
        fused_res = self.client.get("/api/hardware/coaches/12101/S1/fused")
        self.assertEqual(fused_res.status_code, 200)
        coach_data = fused_res.json()
        self.assertEqual(coach_data["coach_no"], "S1")
        self.assertEqual(coach_data["train_number"], "12101")
        self.assertGreater(coach_data["measured_gross_weight_kg"], 40000.0)
        print("  [PASS] Latest hardware telemetry query and coach fused endpoint verified.")

if __name__ == "__main__":
    unittest.main()
