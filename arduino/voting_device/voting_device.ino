#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <Adafruit_SSD1306.h>
#include "wifi_manager.h"
#include "mqtt_handler.h"
#include "display_manager.h"

const char* mqttBrokerIp = "koco1377.iptime.org";
const int mqttBrokerPort = 11883;  # 기본포트는 1833 이지만 포트포워드로 11883으로 변경함
const char* mqttTopic = "voting/device";

const int buttonUpPin = D7;
const int buttonDownPin = D6;
const int buttonLeftPin = D8;
const int buttonRightPin = D5;
const int buttonOkPin = D4;

WifiHandler wifiHandler;
MqttHandler mqttHandler(mqttBrokerIp, mqttBrokerPort);
DisplayManager displayManager(128, 64); // OLED 디스플레이 너비 및 높이

// 후보자 데이터는 투표 로직을 위해 유지되지만, 선택을 위해 표시되지는 않음
const int numCandidates = 12;
const char* candidates[numCandidates] = {"Candidate 1", "Candidate 2", "Candidate 3", "Candidate 4",
                                          "Candidate 5", "Candidate 6", "Candidate 7", "Candidate 8",
                                          "Candidate 9", "Candidate 10", "Candidate 11", "Candidate 12"};

int selectedCandidateIndex = 0; // 선택 기능이 제거되었으므로 기본적으로 첫 번째 후보에게 투표

// OK 버튼 디바운스 변수
unsigned long lastOkButtonPressTime = 0;
unsigned long debounceDelay = 200; // 200ms 디바운스 지연 시간 (필요시 조절)

void setup() {
    Serial.begin(115200);
    Serial.println("Starting device...");

    pinMode(buttonUpPin, INPUT_PULLUP);
    pinMode(buttonDownPin, INPUT_PULLUP);
    pinMode(buttonLeftPin, INPUT_PULLUP);
    pinMode(buttonRightPin, INPUT_PULLUP);
    pinMode(buttonOkPin, INPUT_PULLUP);

    // 디스플레이 기본 설정 먼저 수행 (showLoadingScreen 전에 필요)
    Serial.println("Setting up display for loading screen...");
    displayManager.setup();
    displayManager.showLoadingScreen(); // "Loading..." 메시지 표시

    Serial.println("Setting up WiFi...");
    wifiHandler.setup();

    Serial.println("Setting up MQTT...");
    mqttHandler.setup();

    // MAC 주소 발행은 MQTT 연결 후에 수행
    Serial.println("Publishing MAC address to MQTT...");
    String macMessage = "mac:" + WiFi.macAddress();
    mqttHandler.publish(mqttTopic, macMessage.c_str());

    Serial.println("Device setup complete. Showing Done message...");
    displayManager.showDoneMessage(); // "Done" 메시지 표시
    delay(1000); // 1초 동안 "Done" 메시지 유지

    Serial.println("Entering IDLE screen.");
    displayManager.clearScreen(); // 화면을 비워 IDLE 상태로 전환
}

void loop() {
    mqttHandler.loop();

    if (digitalRead(buttonOkPin) == LOW) {
        if ((millis() - lastOkButtonPressTime) > debounceDelay) {
            lastOkButtonPressTime = millis();

            Serial.print("OK button pressed. Voting for candidate index: ");
            Serial.println(selectedCandidateIndex);

            String voteMessage = "vote: " + String(selectedCandidateIndex) + ", mac:" + WiFi.macAddress();
            mqttHandler.publish(mqttTopic, voteMessage.c_str());
            Serial.println("Vote published to MQTT.");

            Serial.println("Showing spinning effect...");
            displayManager.showSpinningEffect(1000);

            Serial.println("Showing OK message...");
            displayManager.showOKMessage();
            delay(1000);

            Serial.println("Clearing screen to IDLE.");
            displayManager.clearScreen();
        }
    }
}