#include <WiFi.h>
#include <PubSubClient.h>
#include <Adafruit_SSD1306.h>
#include "wifi_manager.h"
#include "mqtt_handler.h"
#include "display_manager.h"

const char* mqttBrokerIp = "broker_ip_address";
const int mqttBrokerPort = 1883;
const char* mqttTopic = "voting/device";

const int buttonUpPin = D1;
const int buttonDownPin = D2;
const int buttonLeftPin = D3;
const int buttonRightPin = D4;
const int buttonOkPin = D5;

WifiHandler wifiHandler;
MqttHandler mqttHandler(mqttBrokerIp, mqttBrokerPort);
DisplayManager displayManager(128, 64);

const int numCandidates = 12;
const char* candidates[numCandidates] = {"Candidate 1", "Candidate 2", "Candidate 3", "Candidate 4",
                                          "Candidate 5", "Candidate 6", "Candidate 7", "Candidate 8",
                                          "Candidate 9", "Candidate 10", "Candidate 11", "Candidate 12"};

int selectedCandidateIndex = 0;

void setup() {
    Serial.begin(115200);
    

    pinMode(buttonUpPin, INPUT_PULLUP);
    pinMode(buttonDownPin, INPUT_PULLUP);
    pinMode(buttonLeftPin, INPUT_PULLUP);
    pinMode(buttonRightPin, INPUT_PULLUP);
    pinMode(buttonOkPin, INPUT_PULLUP);

    wifiHandler.setup();
    mqttHandler.setup();
    displayManager.setup();
    
    displayManager.showLoadingScreen();
    delay(2000);
    
    mqttHandler.publish(mqttTopic, WiFi.macAddress().c_str());
    
    displayManager.showCandidateList(candidates, numCandidates, selectedCandidateIndex);
}

void loop() {
    mqttHandler.loop();
    
    
    if (buttonUpPressed()) {
        selectedCandidateIndex = (selectedCandidateIndex - 4 + numCandidates) % numCandidates;
        displayManager.showCandidateList(candidates, numCandidates, selectedCandidateIndex);
    }
    
    if (buttonDownPressed()) {
        selectedCandidateIndex = (selectedCandidateIndex + 4) % numCandidates;
        displayManager.showCandidateList(candidates, numCandidates, selectedCandidateIndex);
    }
    
    if (buttonLeftPressed()) {
        selectedCandidateIndex = (selectedCandidateIndex - 1 + numCandidates) % numCandidates;
        displayManager.showCandidateList(candidates, numCandidates, selectedCandidateIndex);
    }
    
    if (buttonRightPressed()) {
        selectedCandidateIndex = (selectedCandidateIndex + 1) % numCandidates;
        displayManager.showCandidateList(candidates, numCandidates, selectedCandidateIndex);
    }
    
    if (buttonOkPressed()) {
        String message = "vote:" + String(selectedCandidateIndex);
        mqttHandler.publish(mqttTopic, message.c_str());
    }
}

bool buttonUpPressed() {
    return digitalRead(buttonUpPin) == LOW;
}

bool buttonDownPressed() {
    return digitalRead(buttonDownPin) == LOW;
}

bool buttonLeftPressed() {
    return digitalRead(buttonLeftPin) == LOW;
}

bool buttonRightPressed() {
    return digitalRead(buttonRightPin) == LOW;
}

bool buttonOkPressed() {
    return digitalRead(buttonOkPin) == LOW;
}