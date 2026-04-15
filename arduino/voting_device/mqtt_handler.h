#ifndef MQTT_HANDLER_H
#define MQTT_HANDLER_H

#include <PubSubClient.h>
#include <ESP8266WiFi.h>
#include "config.h"

class MqttHandler {
private:
    WiFiClient espClient;
    PubSubClient client;
    String clientId;

public:
    MqttHandler() : client(espClient) {
        client.setServer(MQTT_BROKER, MQTT_PORT);
    }

    void setup() {
        clientId = WiFi.macAddress();
        reconnect();
    }

    void reconnect() {
        while (!client.connected()) {
            Serial.print("MQTT connecting...");
            if (client.connect(clientId.c_str(), MQTT_USERNAME, MQTT_PASSWORD)) {
                Serial.println("connected");
            } else {
                Serial.print("failed (rc=");
                Serial.print(client.state());
                Serial.println(") retry in 3s");
                delay(3000);
            }
        }
    }

    void publish(const char* topic, const char* message) {
        if (!client.connected()) {
            reconnect();
        }
        client.publish(topic, message);
    }

    bool isConnected() {
        return client.connected();
    }

    void loop() {
        if (!client.connected()) {
            reconnect();
        }
        client.loop();
    }
};

#endif
