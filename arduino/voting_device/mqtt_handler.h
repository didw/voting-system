#ifndef MQTT_HANDLER_H
#define MQTT_HANDLER_H

#include <PubSubClient.h>
#include <WiFiClient.h>

class MqttHandler {
private:
    WiFiClient espClient;
    PubSubClient client;

public:
    MqttHandler(const char* brokerIp, int brokerPort) : client(espClient) {
        client.setServer(brokerIp, brokerPort);
    }

    void setup() {
        while (!client.connected()) {
            if (client.connect("VotingDevice")) {
                // MQTT 연결 성공
            } else {
                // MQTT 연결 실패
                delay(5000);
            }
        }
    }

    void publish(const char* topic, const char* message) {
        client.publish(topic, message);
    }

    void loop() {
        client.loop();
    }
};

#endif