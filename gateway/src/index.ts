import { startWSServer } from "./ws-server.js";
import { startMqttClient } from "./mqtt-client.js";
import { config } from "./config.js";

console.log("=== Voting Gateway ===");
console.log(`MQTT: ${config.mqtt.host}:${config.mqtt.port}`);
console.log(`WS:   port ${config.ws.port}`);

startWSServer();
startMqttClient();
