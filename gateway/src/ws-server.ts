import { WebSocketServer, WebSocket } from "ws";
import { config } from "./config.js";

let wss: WebSocketServer;

export function startWSServer() {
  wss = new WebSocketServer({ port: config.ws.port });
  console.log(`[WS] listening on port ${config.ws.port}`);

  wss.on("connection", (ws) => {
    console.log("[WS] client connected");
    ws.on("error", (err) => console.warn("[WS] client error:", err.message));
    ws.on("close", () => console.log("[WS] client disconnected"));
  });
}

export function broadcast(type: string, data: Record<string, unknown>) {
  if (!wss) return;
  const msg = JSON.stringify({ type, ...data });
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  }
}
