/**
 * Custom Next.js server
 * - HTTP → Next.js (port 3000)
 * - WebSocket upgrade → gateway WS (port 8080)로 프록시
 *
 * 포트 3000 하나만 외부에 열면 HTTP와 WS 모두 동작합니다.
 */

import { createServer } from "node:http";
import { parse } from "node:url";
import path from "node:path";
import next from "next";
import httpProxy from "http-proxy";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT ?? "3000", 10);
const wsPort = parseInt(process.env.WS_PORT ?? "8080", 10);

const proxy = httpProxy.createProxyServer({ ws: true });
proxy.on("error", (err: Error) => console.error("[WS Proxy]", err.message));

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const handleUpgrade = app.getUpgradeHandler();
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url ?? "/", true);
    handle(req, res, parsedUrl);
  });

  // 앱 실시간 이벤트만 gateway WS 서버로 프록시한다.
  // Next dev/HMR WebSocket까지 넘기면 gateway가 Next 전용 프레임을 받고 종료될 수 있다.
  server.on("upgrade", (req, socket, head) => {
    const pathname = parse(req.url ?? "/").pathname;
    if (pathname === "/ws") {
      proxy.ws(req, socket, head, { target: `ws://localhost:${wsPort}` });
      return;
    }

    handleUpgrade(req, socket, head).catch((err: Error) => {
      console.error("[Next Upgrade]", err.message);
      socket.destroy();
    });
  });

  server.listen(port, "0.0.0.0", () => {
    console.log(`> Ready on http://0.0.0.0:${port}`);
    console.log(`> App WebSocket proxied from /ws to ws://localhost:${wsPort}`);
  });
}).catch((err: Error) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
