import mqtt from "mqtt";
import { config } from "./config.js";
import { ensureDevice, recordVote, getActiveSession, getVoteCount } from "./db.js";
import { broadcast } from "./ws-server.js";

export function startMqttClient() {
  const url = `mqtt://${config.mqtt.host}:${config.mqtt.port}`;
  const client = mqtt.connect(url, {
    username: config.mqtt.username,
    password: config.mqtt.password,
  });

  client.on("connect", () => {
    console.log(`[MQTT] connected to ${url}`);
    client.subscribe(config.mqtt.topic, (err) => {
      if (err) console.error("[MQTT] subscribe error:", err);
      else console.log(`[MQTT] subscribed to ${config.mqtt.topic}`);
    });
  });

  client.on("message", async (_topic, payload) => {
    const msg = payload.toString().trim();
    console.log(`[MQTT] ${msg}`);

    try {
      await handleMessage(msg);
    } catch (err) {
      console.error("[MQTT] message handling error:", err);
    }
  });

  client.on("error", (err) => console.error("[MQTT] error:", err));
  client.on("reconnect", () => console.log("[MQTT] reconnecting..."));
}

async function handleMessage(msg: string) {
  // 기기 등록: "mac:AA:BB:CC:DD:EE:FF"
  if (msg.startsWith("mac:")) {
    const mac = msg.slice(4).trim();
    const deviceId = await ensureDevice(mac);
    console.log(`[MQTT] device registered: ${mac} (id=${deviceId})`);
    broadcast("device_registered", { mac, deviceId });
    broadcast("device_activity", { mac, deviceId, lastSeenAt: new Date().toISOString() });
    return;
  }

  // 투표: "vote:0,mac:AA:BB:CC:DD:EE:FF"
  if (msg.startsWith("vote:")) {
    const macMatch = msg.match(/mac:([0-9A-Fa-f:]{17})/);
    if (!macMatch) {
      console.warn("[MQTT] invalid vote message:", msg);
      return;
    }
    const mac = macMatch[1];
    const deviceId = await ensureDevice(mac);
    broadcast("device_activity", { mac, deviceId, lastSeenAt: new Date().toISOString() });

    const session = await getActiveSession();
    if (!session) {
      console.warn("[MQTT] no active voting session, vote ignored");
      return;
    }

    const recorded = await recordVote(session.id, deviceId);
    if (recorded) {
      const count = await getVoteCount(session.id);
      console.log(`[MQTT] vote recorded: session=${session.id}, device=${mac}, total=${count}`);
      broadcast("vote", { sessionId: session.id, count });
    } else {
      console.log(`[MQTT] duplicate vote ignored: session=${session.id}, device=${mac}`);
    }
    return;
  }

  console.warn("[MQTT] unknown message format:", msg);
}
