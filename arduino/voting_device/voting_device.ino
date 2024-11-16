#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <Adafruit_SSD1306.h>
#include "wifi_manager.h"
#include "mqtt_handler.h"
#include "display_manager.h"

const char* mqttBrokerIp = "15.164.231.31";
const int mqttBrokerPort = 1883;
const char* mqttTopic = "voting/device";

const int buttonUpPin = D7;
const int buttonDownPin = D6;
const int buttonLeftPin = D8;
const int buttonRightPin = D5;
const int buttonOkPin = D4;

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
    Serial.println("Starting device...");

    pinMode(buttonUpPin, INPUT_PULLUP);
    pinMode(buttonDownPin, INPUT_PULLUP);
    pinMode(buttonLeftPin, INPUT_PULLUP);
    pinMode(buttonRightPin, INPUT_PULLUP);
    pinMode(buttonOkPin, INPUT_PULLUP);

    Serial.println("Setting up WiFi...");
    wifiHandler.setup();

    Serial.println("Setting up MQTT...");
    mqttHandler.setup();

    Serial.println("Setting up display...");
    displayManager.setup();
    
    Serial.println("Displaying loading screen...");
    displayManager.showLoadingScreen();
    delay(2000);
    
    Serial.println("Publishing MAC address to MQTT...");
    mqttHandler.publish(mqttTopic, WiFi.macAddress().c_str());
    
    Serial.println("Showing candidate list...");
    displayManager.showCandidateList(candidates, numCandidates, selectedCandidateIndex);
}

void loop() {
    mqttHandler.loop();
    
    
    if (buttonUpPressed()) {
        selectedCandidateIndex = (selectedCandidateIndex - 4 + numCandidates) % numCandidates;
        Serial.print("Moving selection up. New selection: ");
        Serial.println(selectedCandidateIndex);
        displayManager.showCandidateList(candidates, numCandidates, selectedCandidateIndex);
    }
    
    if (buttonDownPressed()) {
        selectedCandidateIndex = (selectedCandidateIndex + 4) % numCandidates;
        Serial.print("Moving selection down. New selection: ");
        Serial.println(selectedCandidateIndex);
        displayManager.showCandidateList(candidates, numCandidates, selectedCandidateIndex);
    }
    
    if (buttonLeftPressed()) {
        selectedCandidateIndex = (selectedCandidateIndex - 1 + numCandidates) % numCandidates;
        Serial.print("Moving selection left. New selection: ");
        Serial.println(selectedCandidateIndex);
        displayManager.showCandidateList(candidates, numCandidates, selectedCandidateIndex);
    }
    
    if (buttonRightPressed()) {
        selectedCandidateIndex = (selectedCandidateIndex + 1) % numCandidates;
        Serial.print("Moving selection right. New selection: ");
        Serial.println(selectedCandidateIndex);
        displayManager.showCandidateList(candidates, numCandidates, selectedCandidateIndex);
    }
    
    if (buttonOkPressed()) {
        String message = "vote:" + String(selectedCandidateIndex);
        Serial.print("Voting for candidate ");
        Serial.println(selectedCandidateIndex);
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
