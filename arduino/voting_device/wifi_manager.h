#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <WiFiManager.h>

const char* ssid = "Android7896";
const char* password = "22222222";

class WifiHandler {
public:
    void setup() {
        WiFi.begin(ssid, password);
        while (WiFi.status() != WL_CONNECTED) {
            delay(1000);
            Serial.println("Connecting to WiFi...");
        }
        
        // WiFi.mode(WIFI_STA);
        // WiFiManager wifiManager;
        // wifiManager.autoConnect("VotingDevice");
    }
};

#endif