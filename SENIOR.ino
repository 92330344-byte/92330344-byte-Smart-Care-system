#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Wire.h>
#include "MAX30105.h"
#include "spo2_algorithm.h"
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <math.h>
#include <WiFi.h>
#include <Firebase_ESP_Client.h>

// ================= OLED =================
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// ================= MAX30102 =================
MAX30105 particleSensor;

// ================= MPU6050 =================
Adafruit_MPU6050 mpu;

// ================= PINS =================
#define SDA_PIN 21
#define SCL_PIN 22

#define BUZZER_PIN 25
#define LED_R_PIN 26
#define LED_G_PIN 27
#define LED_B_PIN 14
#define BUTTON_PIN 4

// ================= WIFI =================
#define WIFI_SSID "Guest"
#define WIFI_PASSWORD "LIU@guest2025"

// ================= FIREBASE =================
#define API_KEY "AIzaSyCQrrxqGJWwHZ-4l_onn3yNToip_rJlH7E"
#define DATABASE_URL "https://smartcare-79bac-default-rtdb.firebaseio.com/"
String PATIENT_UID = "TMG48HKWBGUPW5sEfeO3MEtGbq32";
String PATIENT_PATH = "/patients/" + PATIENT_UID;
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

unsigned long lastFirebaseSend = 0;
const unsigned long FIREBASE_INTERVAL = 2000;

// ================= MAX BUFFERS =================
#define BUFFER_SIZE 100
uint32_t irBuffer[BUFFER_SIZE];
uint32_t redBuffer[BUFFER_SIZE];
int sampleIndex = 0;

int32_t spo2 = 0;
int8_t validSPO2 = 0;
int32_t heartRate = 0;
int8_t validHeartRate = 0;

// ================= ALERT TYPE =================
enum AlertType {
  ALERT_NONE,
  ALERT_SOS,
  ALERT_FALL,
  ALERT_HR
};

AlertType currentAlert = ALERT_NONE;

// ================= STATE =================
bool fingerDetected = false;
bool fallDetected = false;
bool motionDetected = false;
bool sosPressed = false;
bool abnormalHeartRate = false;

int finalBPM = 0;
int finalSpO2 = 0;
int stableBPM = 0;
int stableSpO2 = 0;

const float BPM_SMOOTH = 0.7;
const float SPO2_SMOOTH = 0.7;

int lastValidBPM = 0;
int lastValidSpO2 = 0;

// ================= BUTTON SOS =================
unsigned long sosUntil = 0;
bool lastButtonState = HIGH;
const unsigned long SOS_DURATION = 5000;

// ================= TIMING =================
unsigned long lastMPURead = 0;
unsigned long lastDisplayUpdate = 0;
unsigned long lastDebugPrint = 0;
unsigned long lastFallTime = 0;
unsigned long beatAnimUntil = 0;
unsigned long lastWiFiRetry = 0;

const unsigned long WIFI_RETRY_INTERVAL = 10000;

// ================= THRESHOLDS =================
const long FINGER_THRESHOLD = 30000;
const float MOTION_THRESHOLD = 12.0;
const float FALL_THRESHOLD = 14.0;

// ================= INTERVALS =================
const unsigned long MPU_INTERVAL = 60;
const unsigned long DISPLAY_INTERVAL = 180;
const unsigned long DEBUG_INTERVAL = 1000;

// ================= BUZZER STATE =================
bool shortBeepActive = false;
unsigned long shortBeepUntil = 0;
int shortBeepFreq = 1000;

bool alertToneState = false;
unsigned long lastAlertToggle = 0;
const unsigned long ALERT_TOGGLE_INTERVAL = 150;

// ================= BITMAPS =================
static const unsigned char PROGMEM logo2_bmp[] =
{ 0x03, 0xC0, 0xF0, 0x06, 0x71, 0x8C, 0x0C, 0x1B, 0x06, 0x18, 0x0E, 0x02, 0x10, 0x0C, 0x03, 0x10,
  0x04, 0x01, 0x10, 0x04, 0x01, 0x10, 0x40, 0x01, 0x10, 0x40, 0x01, 0x10, 0xC0, 0x03, 0x08, 0x88,
  0x02, 0x08, 0xB8, 0x04, 0xFF, 0x37, 0x08, 0x01, 0x30, 0x18, 0x01, 0x90, 0x30, 0x00, 0xC0, 0x60,
  0x00, 0x60, 0xC0, 0x00, 0x31, 0x80, 0x00, 0x1B, 0x00, 0x00, 0x0E, 0x00, 0x00, 0x04, 0x00 };

static const unsigned char PROGMEM logo3_bmp[] =
{ 0x01, 0xF0, 0x0F, 0x80, 0x06, 0x1C, 0x38, 0x60, 0x18, 0x06, 0x60, 0x18, 0x10, 0x01, 0x80, 0x08,
  0x20, 0x01, 0x80, 0x04, 0x40, 0x00, 0x00, 0x02, 0x40, 0x00, 0x00, 0x02, 0xC0, 0x00, 0x08, 0x03,
  0x80, 0x00, 0x08, 0x01, 0x80, 0x00, 0x18, 0x01, 0x80, 0x00, 0x1C, 0x01, 0x80, 0x00, 0x14, 0x00,
  0x80, 0x00, 0x14, 0x00, 0x80, 0x00, 0x14, 0x00, 0x40, 0x10, 0x12, 0x00, 0x40, 0x10, 0x12, 0x00,
  0x7E, 0x1F, 0x23, 0xFE, 0x03, 0x31, 0xA0, 0x04, 0x01, 0xA0, 0xA0, 0x0C, 0x00, 0xA0, 0xA0, 0x08,
  0x00, 0x60, 0xE0, 0x10, 0x00, 0x20, 0x60, 0x20, 0x06, 0x00, 0x40, 0x60, 0x03, 0x00, 0x40, 0xC0,
  0x01, 0x80, 0x01, 0x80, 0x00, 0xC0, 0x03, 0x00, 0x00, 0x60, 0x06, 0x00, 0x00, 0x30, 0x0C, 0x00,
  0x00, 0x08, 0x10, 0x00, 0x00, 0x06, 0x60, 0x00, 0x00, 0x03, 0xC0, 0x00, 0x00, 0x01, 0x80, 0x00 };

// ================= RGB LED COMMON ANODE =================
void setLED(bool r, bool g, bool b) {
  digitalWrite(LED_R_PIN, r ? LOW : HIGH);
  digitalWrite(LED_G_PIN, g ? LOW : HIGH);
  digitalWrite(LED_B_PIN, b ? LOW : HIGH);
}

// ================= ALERT LOGIC =================
void updateCurrentAlert() {
  if (sosPressed) currentAlert = ALERT_SOS;
  else if (fallDetected) currentAlert = ALERT_FALL;
  else if (abnormalHeartRate) currentAlert = ALERT_HR;
  else currentAlert = ALERT_NONE;
}

// ================= BUZZER =================
void startShortBeep(int freq, int durationMs) {
  shortBeepFreq = freq;
  shortBeepUntil = millis() + durationMs;
  shortBeepActive = true;
}

void updateBuzzer() {
  if (currentAlert != ALERT_NONE) {
    if (millis() - lastAlertToggle >= ALERT_TOGGLE_INTERVAL) {
      lastAlertToggle = millis();
      alertToneState = !alertToneState;
      if (alertToneState) tone(BUZZER_PIN, 1800);
      else noTone(BUZZER_PIN);
    }
    return;
  }

  alertToneState = false;

  if (shortBeepActive) {
    if (millis() < shortBeepUntil) tone(BUZZER_PIN, shortBeepFreq);
    else {
      shortBeepActive = false;
      noTone(BUZZER_PIN);
    }
  } else {
    noTone(BUZZER_PIN);
  }
}

// ================= DISPLAY =================
void showNoFinger() {
  display.clearDisplay();
  display.setTextSize(2);      // كبرنا الخط
  display.setTextColor(WHITE);

  display.setCursor(10, 22);   // مكان النص بالنص تقريباً
  display.println("Waiting");
  display.setCursor(10, 42);
  display.println("sensor");

  display.display();
}

String getAlertText() {
  switch (currentAlert) {
    case ALERT_SOS: return "SOS";
    case ALERT_FALL: return "FALL";
    case ALERT_HR: return "HR_ALERT";
    default: return "NONE";
  }
}

// ================= WIFI FIREBASE =================
void connectWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long startAttemptTime = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startAttemptTime < 15000) {
    Serial.print(".");
    delay(300);
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.print("WiFi connected. IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println();
    Serial.println("WiFi connect failed");
  }
}

void setupFirebase() {
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  if (Firebase.signUp(&config, &auth, "", "")) {
    Serial.println("Firebase signUp OK");
  } else {
    Serial.println("Firebase signUp FAILED");
    Serial.println(config.signer.signupError.message.c_str());
  }

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  Serial.println("Firebase setup done");
}

void sendToFirebaseTask() {
  if (millis() - lastFirebaseSend < FIREBASE_INTERVAL) return;
  lastFirebaseSend = millis();

  if (WiFi.status() != WL_CONNECTED) return;

  FirebaseJson json;
  json.set("heartRate", finalBPM);
  json.set("spo2", finalSpO2);
  json.set("fingerDetected", fingerDetected);
  json.set("fallDetected", fallDetected);
  json.set("motionDetected", motionDetected);
  json.set("sosPressed", sosPressed);
  json.set("abnormalHeartRate", abnormalHeartRate);
  json.set("alert", getAlertText());

  if (Firebase.RTDB.setJSON(&fbdo, PATIENT_PATH.c_str(), &json)) {
    Serial.println("Firebase updated");
  } else {
    Serial.println("Firebase FAILED");
    Serial.println(fbdo.errorReason());
  }
}

// ================= SCREENS =================
void showDataScreen(bool beatAnimation) {
  display.clearDisplay();

  if (beatAnimation) display.drawBitmap(0, 0, logo3_bmp, 32, 32, WHITE);
  else display.drawBitmap(5, 5, logo2_bmp, 24, 21, WHITE);

  display.setTextColor(WHITE);

  // Bigger text
  display.setTextSize(2);

  display.setCursor(38, 0);
  display.print("BPM:");
  if (finalBPM > 0) display.println(finalBPM);
  else display.println("--");

  display.setCursor(38, 20);
  display.print("SpO2:");
  if (finalSpO2 > 0) {
    display.println(finalSpO2);
  } else {
    display.println("--");
  }

  display.setCursor(38, 42);
  if (motionDetected) display.println("MOVE");
  else display.println("Normal");

  display.display();
}

void showFallScreen() {
  display.clearDisplay();
  display.setTextSize(2);
  display.setTextColor(WHITE);
  display.setCursor(8, 0);
  display.println("FALL!");
  display.setTextSize(1);
  display.setCursor(18, 36);
  display.println("Emergency Alert");
  display.display();
}

void showSOSScreen() {
  display.clearDisplay();
  display.setTextSize(2);
  display.setTextColor(WHITE);
  display.setCursor(18, 0);
  display.println("SOS!");
  display.setTextSize(1);
  display.setCursor(18, 36);
  display.println("Manual Emergency");
  display.display();
}

void showHeartAlertScreen() {
  display.clearDisplay();
  display.setTextSize(2);
  display.setTextColor(WHITE);
  display.setCursor(0, 0);
  display.println("HR ALERT");

  display.setTextSize(1);
  display.setCursor(20, 28);
  display.print("BPM: ");
  display.println(finalBPM);

  display.setCursor(10, 44);
  if (finalBPM < 50) display.println("Low Heart Rate");
  else display.println("High Heart Rate");

  display.display();
}

// ================= SETUP HELPERS =================
void setupMAX30102() {
  if (!particleSensor.begin(Wire, I2C_SPEED_STANDARD)) {
    Serial.println("MAX30102 not found");
    display.clearDisplay();
    display.setCursor(0, 10);
    display.println("MAX30102 failed");
    display.display();
    while (true);
  }

  particleSensor.setup(
    30,
    4,
    2,
    400,
    411,
    8192
  );

  particleSensor.setPulseAmplitudeRed(30);
  particleSensor.setPulseAmplitudeIR(30);
  particleSensor.setPulseAmplitudeGreen(0);
  particleSensor.clearFIFO();

  Serial.println("MAX30102 ready");
}

void setupMPU6050() {
  if (!mpu.begin()) {
    Serial.println("MPU6050 not found");
    display.clearDisplay();
    display.setCursor(0, 10);
    display.println("MPU6050 failed");
    display.display();
    while (true);
  }

  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);

  Serial.println("MPU6050 ready");
}

// ================= READERS =================
void readButton() {
  bool buttonState = digitalRead(BUTTON_PIN);

  if (lastButtonState == HIGH && buttonState == LOW) {
    sosPressed = true;
    sosUntil = millis() + SOS_DURATION;
    lastFirebaseSend = 0;
    startShortBeep(1800, 200);
  }

  lastButtonState = buttonState;

  if (sosPressed && millis() > sosUntil) {
    sosPressed = false;
  }
}

void readMPU6050Task() {
  if (millis() - lastMPURead < MPU_INTERVAL) return;
  lastMPURead = millis();

  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);

  float totalAcc = sqrt(
    a.acceleration.x * a.acceleration.x +
    a.acceleration.y * a.acceleration.y +
    a.acceleration.z * a.acceleration.z
  );

  motionDetected = (totalAcc > MOTION_THRESHOLD);

  if (totalAcc > FALL_THRESHOLD) {
    fallDetected = true;
    lastFallTime = millis();
  }

  if (fallDetected && (millis() - lastFallTime > 3000)) {
    fallDetected = false;
  }

  if (millis() - lastDebugPrint >= DEBUG_INTERVAL) {
    Serial.print("ACC total = ");
    Serial.println(totalAcc, 2);
  }
}

void processHeartCalculation() {
  maxim_heart_rate_and_oxygen_saturation(
    irBuffer,
    BUFFER_SIZE,
    redBuffer,
    &spo2,
    &validSPO2,
    &heartRate,
    &validHeartRate
  );

  if (validHeartRate && heartRate >= 45 && heartRate <= 140) {
    if (stableBPM == 0) stableBPM = heartRate;
    else stableBPM = (BPM_SMOOTH * stableBPM) + ((1.0 - BPM_SMOOTH) * heartRate);

    finalBPM = stableBPM;
    lastValidBPM = finalBPM;

    beatAnimUntil = millis() + 180;
    startShortBeep(1000, 50);

    abnormalHeartRate = (finalBPM < 50 || finalBPM > 100);
  } else {
    finalBPM = lastValidBPM;
    abnormalHeartRate = (finalBPM > 0 && (finalBPM < 50 || finalBPM > 100));
  }

  if (validSPO2 && spo2 >= 95 && spo2 <= 100) {
    if (stableSpO2 == 0) stableSpO2 = spo2;
    else stableSpO2 = (SPO2_SMOOTH * stableSpO2) + ((1.0 - SPO2_SMOOTH) * spo2);

    finalSpO2 = stableSpO2;
    lastValidSpO2 = finalSpO2;
  } else {
    finalSpO2 = lastValidSpO2;
  }

  if (millis() - lastDebugPrint >= DEBUG_INTERVAL) {
    Serial.print("HR=");
    Serial.print(heartRate);
    Serial.print(" validHR=");
    Serial.print(validHeartRate);
    Serial.print(" finalBPM=");
    Serial.print(finalBPM);
    Serial.print(" abnormalHR=");
    Serial.print(abnormalHeartRate);
    Serial.print(" SpO2=");
    Serial.print(spo2);
    Serial.print(" validSpO2=");
    Serial.println(validSPO2);
    lastDebugPrint = millis();
  }
}

void readHeartAndSpO2Task() {
  particleSensor.check();

  while (particleSensor.available()) {
    uint32_t irValue = particleSensor.getFIFOIR();
    uint32_t redValue = particleSensor.getFIFORed();
    particleSensor.nextSample();

    if (irValue < FINGER_THRESHOLD) {
      fingerDetected = false;
      finalBPM = 0;
      finalSpO2 = 0;
      stableBPM = 0;
      stableSpO2 = 0;
      lastValidBPM = 0;
      lastValidSpO2 = 0;
      abnormalHeartRate = false;
      sampleIndex = 0;
      continue;
    }

    fingerDetected = true;

    if (sampleIndex < BUFFER_SIZE) {
      redBuffer[sampleIndex] = redValue;
      irBuffer[sampleIndex] = irValue;
      sampleIndex++;
    }

    if (sampleIndex >= BUFFER_SIZE) {
      processHeartCalculation();
      sampleIndex = 0;
    }
  }
}

// ================= OUTPUTS =================
void handleOutputs() {
  switch (currentAlert) {
    case ALERT_SOS:
    case ALERT_FALL:
    case ALERT_HR:
      setLED(true, false, false);
      break;

    case ALERT_NONE:
    default:
      if (!fingerDetected) setLED(false, false, true);
      else setLED(false, true, false);
      break;
  }
}

// ================= DISPLAY TASK =================
void updateDisplayTask() {
  if (millis() - lastDisplayUpdate < DISPLAY_INTERVAL) return;
  lastDisplayUpdate = millis();

  bool beatAnimation = (millis() < beatAnimUntil);

  switch (currentAlert) {
    case ALERT_SOS:
      showSOSScreen();
      break;

    case ALERT_FALL:
      showFallScreen();
      break;

    case ALERT_HR:
      showHeartAlertScreen();
      break;

    case ALERT_NONE:
    default:
      if (!fingerDetected) showNoFinger();
      else showDataScreen(beatAnimation);
      break;
  }
}

// ================= SETUP =================
void setup() {
  Serial.begin(115200);

  Wire.begin(SDA_PIN, SCL_PIN);
  Wire.setClock(100000);

  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_R_PIN, OUTPUT);
  pinMode(LED_G_PIN, OUTPUT);
  pinMode(LED_B_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  noTone(BUZZER_PIN);
  setLED(false, false, false);

  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("OLED failed");
    while (true);
  }

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(WHITE);
  display.setCursor(18, 10);
  display.println("Starting...");
  display.display();
  delay(800);

  setupMAX30102();
  setupMPU6050();
  connectWiFi();
  setupFirebase();

  showNoFinger();
}

// ================= LOOP =================
void loop() {
  readButton();
  readMPU6050Task();
  readHeartAndSpO2Task();

  updateCurrentAlert();
  handleOutputs();
  updateBuzzer();
  updateDisplayTask();

  if (WiFi.status() != WL_CONNECTED && millis() - lastWiFiRetry > WIFI_RETRY_INTERVAL) {
    lastWiFiRetry = millis();
    WiFi.disconnect();
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  }

  sendToFirebaseTask();
}
