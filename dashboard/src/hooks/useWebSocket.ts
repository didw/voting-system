"use client";

import { useEffect, useRef, useState } from "react";

type WSMessage = { type: string; [key: string]: unknown };
type Handler = (msg: WSMessage) => void;

export function useWebSocket(handler: Handler) {
  const wsRef = useRef<WebSocket | null>(null);
  const handlerRef = useRef(handler);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    // WS는 HTTP와 동일한 포트(3000)의 /ws로 연결 — 서버에서 gateway(8080)로 프록시됨
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host; // hostname:port 포함
    const url = `${protocol}//${host}/ws`;
    let shouldReconnect = true;

    function connect() {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        if (shouldReconnect) {
          reconnectTimerRef.current = setTimeout(connect, 2000);
        }
      };
      ws.onerror = () => ws.close();
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          handlerRef.current(msg);
        } catch { /* ignore non-json */ }
      };
    }

    connect();
    return () => {
      shouldReconnect = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      wsRef.current?.close();
    };
  }, []);

  return { connected };
}
