#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <Adafruit_SSD1306.h>
#include "config.h"
#include "wifi_manager.h"
#include "mqtt_handler.h"
#include "display_manager.h"

WifiHandler wifi;
MqttHandler mqtt;
DisplayManager oled(128, 64);

unsigned long lastPressTime = 0;

void setup() {
    Serial.begin(115200);
    Serial.println("\n=== Voting Device ===");

    pinMode(PIN_BUTTON_OK, INPUT_PULLUP);

    oled.setup();
    oled.showLoading();

    wifi.setup();
    oled.showStatus(wifi.isConnected(), false);

    mqtt.setup();
    oled.showStatus(wifi.isConnected(), mqtt.isConnected());

    // 기기 등록 (MAC 주소 전송)
    String reg = "mac:" + wifi.macAddress();
    mqtt.publish(MQTT_TOPIC, reg.c_str());
    Serial.println("Registered: " + reg);

    oled.showDone();
    delay(1000);
    oled.clear();
}

void loop() {
    mqtt.loop();

    if (digitalRead(PIN_BUTTON_OK) == LOW) {
        if (millis() - lastPressTime > DEBOUNCE_MS) {
            lastPressTime = millis();

            String msg = "vote:0,mac:" + wifi.macAddress();
            mqtt.publish(MQTT_TOPIC, msg.c_str());
            Serial.println("Vote sent");

            oled.showSpinner(800);
            oled.showOK();
            delay(800);
            oled.clear();
        }
    }
}
