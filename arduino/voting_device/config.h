#ifndef CONFIG_H
#define CONFIG_H

// WiFi
const char* WIFI_SSID     = "KOCO_2.4G";
const char* WIFI_PASSWORD  = "13771377";

// MQTT
const char* MQTT_BROKER   = "koco1377.iptime.org";
const int   MQTT_PORT     = 11883;
const char* MQTT_TOPIC    = "voting/device";
const char* MQTT_USERNAME = "jyyang";
const char* MQTT_PASSWORD = "didwhdduf";

// Hardware
const int PIN_BUTTON_OK   = D4;

// Timing
const unsigned long DEBOUNCE_MS = 300;

#endif
