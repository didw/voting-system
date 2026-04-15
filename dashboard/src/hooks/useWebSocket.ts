"use client";

import { useEffect, useRef, useCallback, useState } from "react";

type WSMessage = { type: string; [key: string]: unknown };
type Handler = (msg: WSMessage) => void;

export function useWebSocket(handler: Handler) {
  const wsRef = useRef<WebSocket | null>(null);
  const handlerRef = useRef(handler);
  const [connected, setConnected] = useState(false);
  handlerRef.current = handler;

  useEffect(() => {
    const wsPort = process.env.NEXT_PUBLIC_WS_PORT ?? "8080";
    const host = window.location.hostname;
    const url = `ws://${host}:${wsPort}`;

    function connect() {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        setTimeout(connect, 2000);
      };
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          handlerRef.current(msg);
        } catch { /* ignore non-json */ }
      };
    }

    connect();
    return () => {
      wsRef.current?.close();
    };
  }, []);

  return { connected };
}
