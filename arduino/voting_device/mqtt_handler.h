#ifndef MQTT_HANDLER_H
#define MQTT_HANDLER_H

#include <PubSubClient.h>
#include <WiFiClient.h>

class MqttHandler {
private:
    WiFiClient espClient;
    PubSubClient client;
    String clientIdStr; // Use String for easier manipulation
    const char* username = "jyyang"; // MQTT username
    const char* password = "didwhdduf"; // MQTT password

public:
    MqttHandler(const char* brokerIp, int brokerPort) : client(espClient) {
        clientIdStr = WiFi.macAddress();
        // Strip the clientId if necessary, e.g., remove colons or whitespace
        // Example: clientIdStr.replace(":", "");
        client.setServer(brokerIp, brokerPort);
    }

    void setup() {
        const char* clientId = clientIdStr.c_str(); // Convert to const char* for PubSubClient
        while (!client.connected()) {
            Serial.print("Attempting MQTT connection...");
            // Use the clientId in the connect call with username and password
            if (client.connect(clientId, username, password)) {
                Serial.println("connected");
                
                // MQTT 연결 성공 시 수행할 작업
                String connectMessage = clientIdStr + " Connected"; // Use String directly
                client.publish("buttonTopic", connectMessage.c_str()); // Convert to const char* for publish
                
                // 클라이언트 ID를 사용하여 구독
                client.subscribe(clientId); // Use const char* clientId

            } else {
                Serial.print("failed, rc=");
                Serial.print(client.state());
                Serial.println(" try again in 5 seconds");
                delay(5000);
            }
        }
    }

    void publish(const char* topic, const char* message) {
        if (client.connected()) {
            client.publish(topic, message);
        }
    }

    void loop() {
        if (!client.connected()) {
            setup(); // 연결이 끊어진 경우 재연결 시도
        }
        client.loop();
    }
};

#endif
