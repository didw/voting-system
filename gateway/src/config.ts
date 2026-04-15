import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function env(key: string, fallback?: string): string {
  const v = process.env[key] ?? fallback;
  if (v === undefined) throw new Error(`Missing env: ${key}`);
  return v;
}

export const config = {
  db: {
    host: env("DB_HOST", "localhost"),
    port: Number(env("DB_PORT", "3306")),
    user: env("DB_USER"),
    password: env("DB_PASSWORD"),
    database: env("DB_NAME", "votedb"),
  },
  mqtt: {
    host: env("MQTT_BROKER_HOST", "localhost"),
    port: Number(env("MQTT_BROKER_PORT", "1883")),
    username: env("MQTT_USERNAME"),
    password: env("MQTT_PASSWORD"),
    topic: env("MQTT_TOPIC", "voting/device"),
  },
  ws: {
    port: Number(env("WS_PORT", "8080")),
  },
} as const;
