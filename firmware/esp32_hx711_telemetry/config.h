/**
 * Smart Live Weight Tracker - ESP32 Firmware Configuration
 * ========================================================
 * Target Hardware: ESP32-WROOM-32D / ESP32-DevKitC v4
 * Dual HX711 24-bit ADCs + Dual Optical IR Door Sensors
 */

#ifndef CONFIG_H
#define CONFIG_H

// -----------------------------------------------------------------------------
// 1. Device Identification & Cryptographic Identity
// -----------------------------------------------------------------------------
#define DEVICE_ID             "ESP32-BOGIE-12101-S1"
#define TRAIN_NUMBER          "12101"
#define COACH_NO              "S1"
#define COACH_TYPE            "Sleeper"
#define FIRMWARE_VERSION      "IR-ESP32-v2.4.1"
#define DEVICE_AUTH_TOKEN     "esp32_dev_token_12101_s1_sec7788"

// Physical Coach Specifications (in kg)
#define TARE_WEIGHT_KG        40000.0f
#define MAX_GROSS_WEIGHT_KG   55000.0f

// -----------------------------------------------------------------------------
// 2. Wi-Fi & Backend Endpoint Configuration
// -----------------------------------------------------------------------------
#define WIFI_SSID             "IndianRailways_IoT_Mesh"
#define WIFI_PASSWORD         "RailNetSecure2026"
#define BACKEND_HOST          "http://192.168.1.100:8000"  // Set to backend server IP
#define TELEMETRY_INGEST_URI  "/api/hardware/telemetry/ingest"
#define HEARTBEAT_URI         "/api/hardware/heartbeat"

// -----------------------------------------------------------------------------
// 3. Hardware GPIO Pin Definitions
// -----------------------------------------------------------------------------
// HX711 Bogie A (Front Bogie Bolster Secondary Suspension)
#define PIN_HX711_A_DT        21
#define PIN_HX711_A_SCK       22

// HX711 Bogie B (Rear Bogie Bolster Secondary Suspension)
#define PIN_HX711_B_DT        19
#define PIN_HX711_B_SCK       23

// Optical IR Door Passenger Counter (Active LOW with internal pull-up)
#define PIN_IR_DOOR_IN        18
#define PIN_IR_DOOR_OUT       5

// Battery Voltage Monitoring (Analog ADC with 2:1 resistor divider)
#define PIN_BATTERY_ADC       34

// Status LEDs
#define PIN_LED_STATUS        2   // Built-in blue LED
#define PIN_LED_FAULT         4   // Red fault indicator LED

// -----------------------------------------------------------------------------
// 4. Calibration & Sampling Parameters
// -----------------------------------------------------------------------------
// Nominal factory scale factors: ADC counts per kg
// Note: Must be recalibrated on-site using the 10-step Administrator Calibration
#define DEFAULT_CALIB_SCALE_A 215.4f
#define DEFAULT_CALIB_SCALE_B 215.4f

// ADC Saturation Limits (HX711 24-bit 2's complement)
#define ADC_SATURATION_MAX    8380000L
#define ADC_SATURATION_MIN   -8380000L

// Timing Intervals (milliseconds)
#define TELEMETRY_INTERVAL_MS 2000    // Telemetry rate: every 2 seconds
#define HEARTBEAT_INTERVAL_MS 30000   // Low-power standby ping: every 30 seconds
#define WDT_TIMEOUT_SECONDS   8       // Hardware watchdog reset timeout

#endif // CONFIG_H
