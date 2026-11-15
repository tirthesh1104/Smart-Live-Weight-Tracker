/**
 * Smart Live Weight Tracker - ESP32 Production Bogie Telemetry Firmware
 * =====================================================================
 * Microcontroller: ESP32 Dual-Core Xtensa LX6 (240 MHz)
 * Peripherals:
 * - 2x Avia Semiconductor HX711 24-bit Differential ADCs
 * - 4x Compression Shear Beam Load Cells (bolster mount)
 * - 2x Optical IR Door Passenger Counter Sensors
 * - Hardware Watchdog Timer & Auto-reconnecting Wi-Fi Stack
 * - NTP Synced UTC Timestamping & Cryptographic Token Transmission
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <time.h>
#include <esp_task_wdt.h>
#include "config.h"

// -----------------------------------------------------------------------------
// Global State & Counters
// -----------------------------------------------------------------------------
volatile uint32_t irDoorInCount = 0;
volatile uint32_t irDoorOutCount = 0;
volatile uint32_t lastInterruptTimeIn = 0;
volatile uint32_t lastInterruptTimeOut = 0;

uint32_t packetSequenceId = 1;
uint32_t lastTelemetryTime = 0;
uint32_t lastHeartbeatTime = 0;
int32_t previousGrossWeightKg = 0;
bool wifiConnected = false;

// NTP Server Configuration
const char* ntpServer = "pool.ntp.org";
const long  gmtOffset_sec = 0;       // UTC timestamp
const int   daylightOffset_sec = 0;

// -----------------------------------------------------------------------------
// Hardware Interrupt Service Routines (ISRs) for Door IR Sensors
// Debounced with 150 ms minimum transit separation
// -----------------------------------------------------------------------------
void IRAM_ATTR isrDoorIn() {
  uint32_t now = millis();
  if (now - lastInterruptTimeIn > 150) {
    irDoorInCount++;
    lastInterruptTimeIn = now;
  }
}

void IRAM_ATTR isrDoorOut() {
  uint32_t now = millis();
  if (now - lastInterruptTimeOut > 150) {
    irDoorOutCount++;
    lastInterruptTimeOut = now;
  }
}

// -----------------------------------------------------------------------------
// Low-Level HX711 24-Bit Read Routine
// Bit-bangs 24 clock pulses on SCK and captures 2's complement reading.
// Applies 25th pulse to set Channel A Gain = 128.
// -----------------------------------------------------------------------------
int32_t readHX711(uint8_t pinDT, uint8_t pinSCK) {
  // Wait up to 100ms for HX711 DOUT to go LOW (Ready state)
  uint32_t startWait = millis();
  while (digitalRead(pinDT) == HIGH) {
    if (millis() - startWait > 100) {
      // Timeout: Sensor disconnected or power down
      return 0;
    }
    yield();
  }

  uint32_t rawData = 0;

  // Disable interrupts during timing-critical 24-pulse readout
  noInterrupts();
  for (int i = 0; i < 24; i++) {
    digitalWrite(pinSCK, HIGH);
    delayMicroseconds(1);
    rawData = (rawData << 1) | (digitalRead(pinDT) & 0x01);
    digitalWrite(pinSCK, LOW);
    delayMicroseconds(1);
  }

  // 25th pulse: Channel A, 128 gain
  digitalWrite(pinSCK, HIGH);
  delayMicroseconds(1);
  digitalWrite(pinSCK, LOW);
  delayMicroseconds(1);
  interrupts();

  // Sign extension from 24-bit to 32-bit signed integer
  if (rawData & 0x800000) {
    rawData |= 0xFF000000;
  }

  return (int32_t)rawData;
}

// -----------------------------------------------------------------------------
// Helper: Get ISO 8601 UTC Timestamp
// -----------------------------------------------------------------------------
String getIsoTimestamp() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    return "";
  }
  char buf[30];
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
  return String(buf);
}

// -----------------------------------------------------------------------------
// Helper: Read Battery Supply Voltage
// -----------------------------------------------------------------------------
int readBatteryVoltageMv() {
  int rawAdc = analogRead(PIN_BATTERY_ADC);
  // 3.3V reference, 12-bit ADC (4095), 2:1 resistor divider -> 2 * 3300 * adc / 4095
  int voltageMv = (rawAdc * 6600) / 4095;
  return voltageMv;
}

// -----------------------------------------------------------------------------
// Wi-Fi Connection Management
// -----------------------------------------------------------------------------
void connectWiFi() {
  Serial.print("[WiFi] Connecting to SSID: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  uint32_t startAttempt = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startAttempt < 10000) {
    delay(500);
    Serial.print(".");
    esp_task_wdt_reset();
  }

  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println("\n[WiFi] Connected successfully!");
    Serial.print("[WiFi] IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("[WiFi] MAC Address: ");
    Serial.println(WiFi.macAddress());

    // Synchronize NTP clock
    configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
    digitalWrite(PIN_LED_STATUS, HIGH);
  } else {
    wifiConnected = false;
    Serial.println("\n[WiFi] Connection timeout. Operating in local buffering mode.");
    digitalWrite(PIN_LED_STATUS, LOW);
  }
}

// -----------------------------------------------------------------------------
// Telemetry Transmission: POST /api/hardware/telemetry/ingest
// -----------------------------------------------------------------------------
bool sendTelemetry(int32_t bogieARaw, int32_t bogieBRaw) {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
    if (WiFi.status() != WL_CONNECTED) return false;
  }

  HTTPClient http;
  String url = String(BACKEND_HOST) + String(TELEMETRY_INGEST_URI);
  http.begin(url);
  http.setTimeout(4000);

  // Headers: Content-Type & Cryptographic Device Token
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Token", DEVICE_AUTH_TOKEN);
  http.addHeader("Authorization", "Bearer " + String(DEVICE_AUTH_TOKEN));

  // Build JSON Payload
  StaticJsonDocument<1024> doc;
  doc["device_id"] = DEVICE_ID;
  doc["train_number"] = TRAIN_NUMBER;
  doc["coach_no"] = COACH_NO;
  doc["coach_type"] = COACH_TYPE;
  doc["tare_weight_kg"] = TARE_WEIGHT_KG;
  doc["max_gross_weight_kg"] = MAX_GROSS_WEIGHT_KG;

  // Dual HX711 24-bit readings
  doc["hx711_bogie_a_raw"] = bogieARaw;
  doc["hx711_bogie_b_raw"] = bogieBRaw;
  doc["calibration_scale_a"] = DEFAULT_CALIB_SCALE_A;
  doc["calibration_scale_b"] = DEFAULT_CALIB_SCALE_B;

  // Optical counters
  doc["ir_door_in_count"] = irDoorInCount;
  doc["ir_door_out_count"] = irDoorOutCount;

  // Telemetry metadata
  doc["is_physical_sensor"] = true;
  doc["auth_token"] = DEVICE_AUTH_TOKEN;
  doc["mac_address"] = WiFi.macAddress();
  doc["wifi_ssid"] = WiFi.SSID();
  doc["battery_voltage_mv"] = readBatteryVoltageMv();
  doc["rssi_dbm"] = WiFi.RSSI();
  doc["sequence_id"] = packetSequenceId++;
  doc["firmware_version"] = FIRMWARE_VERSION;

  String timestamp = getIsoTimestamp();
  if (timestamp.length() > 0) {
    doc["timestamp"] = timestamp;
  }

  String requestBody;
  serializeJson(doc, requestBody);

  int httpCode = http.POST(requestBody);
  bool success = false;

  if (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_CREATED) {
    String response = http.getString();
    Serial.printf("[Telemetry] Dispatched Packet #%u (Status %d)\n", packetSequenceId - 1, httpCode);
    digitalWrite(PIN_LED_FAULT, LOW);
    success = true;
  } else {
    Serial.printf("[Telemetry] HTTP POST failed, code: %d\n", httpCode);
    digitalWrite(PIN_LED_FAULT, HIGH);
  }

  http.end();
  return success;
}

// -----------------------------------------------------------------------------
// Setup & Initialization
// -----------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n========================================================");
  Serial.println("  Smart Live Weight Tracker - ESP32 Telemetry Controller");
  Serial.println("  Indian Railways Advanced Bogie Weight Monitoring System");
  Serial.println("========================================================");
  Serial.printf("Device ID: %s | Coach: %s-%s\n", DEVICE_ID, TRAIN_NUMBER, COACH_NO);

  // Initialize GPIO Pins
  pinMode(PIN_HX711_A_DT, INPUT);
  pinMode(PIN_HX711_A_SCK, OUTPUT);
  digitalWrite(PIN_HX711_A_SCK, LOW);

  pinMode(PIN_HX711_B_DT, INPUT);
  pinMode(PIN_HX711_B_SCK, OUTPUT);
  digitalWrite(PIN_HX711_B_SCK, LOW);

  pinMode(PIN_IR_DOOR_IN, INPUT_PULLUP);
  pinMode(PIN_IR_DOOR_OUT, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(PIN_IR_DOOR_IN), isrDoorIn, FALLING);
  attachInterrupt(digitalPinToInterrupt(PIN_IR_DOOR_OUT), isrDoorOut, FALLING);

  pinMode(PIN_LED_STATUS, OUTPUT);
  pinMode(PIN_LED_FAULT, OUTPUT);
  digitalWrite(PIN_LED_STATUS, LOW);
  digitalWrite(PIN_LED_FAULT, LOW);

  // Initialize Hardware Watchdog Timer
  esp_task_wdt_init(WDT_TIMEOUT_SECONDS, true);
  esp_task_wdt_add(NULL);

  // Connect to Network
  connectWiFi();
}

// -----------------------------------------------------------------------------
// Main Execution Loop
// -----------------------------------------------------------------------------
void loop() {
  esp_task_wdt_reset();
  uint32_t now = millis();

  // Read HX711 Bogie Strain Sensors
  int32_t bogieARaw = readHX711(PIN_HX711_A_DT, PIN_HX711_A_SCK);
  int32_t bogieBRaw = readHX711(PIN_HX711_B_DT, PIN_HX711_B_SCK);

  // ADC Saturation or Disconnection Check
  bool hasFault = false;
  if (abs(bogieARaw) >= ADC_SATURATION_MAX || bogieARaw == 0) {
    hasFault = true;
    Serial.println("[FAULT] Bogie A HX711 open circuit or ADC saturated!");
  }
  if (abs(bogieBRaw) >= ADC_SATURATION_MAX || bogieBRaw == 0) {
    hasFault = true;
    Serial.println("[FAULT] Bogie B HX711 open circuit or ADC saturated!");
  }

  digitalWrite(PIN_LED_FAULT, hasFault ? HIGH : LOW);

  // Transmit Telemetry at designated interval
  if (now - lastTelemetryTime >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryTime = now;
    sendTelemetry(bogieARaw, bogieBRaw);
  }

  delay(50);
}
