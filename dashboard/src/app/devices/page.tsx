"use client";

import { useState, useEffect, useCallback } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";

interface Device {
  id: number;
  mac_address: string;
  created_at: string;
  last_seen_at: string;
}

type Status = "connected" | "warning" | "disconnected";

function getStatus(lastSeenAt: string): Status {
  const elapsed = Date.now() - new Date(lastSeenAt).getTime();
  if (elapsed < 10 * 60_000) return "connected";
  if (elapsed < 60 * 60_000) return "warning";
  return "disconnected";
}

function formatElapsed(lastSeenAt: string): string {
  const sec = Math.floor((Date.now() - new Date(lastSeenAt).getTime()) / 1000);
  if (sec < 60) return `${sec}초 전`;
  if (sec < 3600) return `${Math.floor(sec / 60)}분 전`;
  return `${Math.floor(sec / 3600)}시간 전`;
}

const statusConfig: Record<Status, { dot: string; label: string; bg: string }> =
  {
    connected: {
      dot: "bg-green-500",
      label: "연결됨",
      bg: "bg-green-500/10 text-green-500",
    },
    warning: {
      dot: "bg-yellow-500",
      label: "주의",
      bg: "bg-yellow-500/10 text-yellow-500",
    },
    disconnected: {
      dot: "bg-red-500",
      label: "끊김",
      bg: "bg-red-500/10 text-red-500",
    },
  };

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [, setTick] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 초기 로드 + 60초 폴링
  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetch("/api/devices");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "기기 목록을 불러오지 못했습니다.");
      }
      setDevices(data as Device[]);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch devices:", err);
      setError(err instanceof Error ? err.message : "기기 목록을 불러오지 못했습니다.");
    }
  }, []);

  async function resetDevices() {
    if (deleting) return;
    if (!confirm("모든 기기를 삭제하시겠습니까? 관련 투표 기록도 함께 삭제됩니다.")) {
      return;
    }

    setDeleting(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/devices", { method: "DELETE" });
      const data: Device[] = await res.json();
      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error ?? "기기를 초기화하지 못했습니다."
        );
      }
      setDevices([]);
      setMessage("기기 목록을 초기화했습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "기기를 초기화하지 못했습니다.");
    } finally {
      setDeleting(false);
    }
  }

  useEffect(() => {
    const initial = setTimeout(fetchDevices, 0);
    const poll = setInterval(fetchDevices, 60_000);
    return () => {
      clearTimeout(initial);
      clearInterval(poll);
    };
  }, [fetchDevices]);

  // 30초마다 경과 시간 재계산
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(timer);
  }, []);

  // WebSocket 실시간 업데이트
  useWebSocket(
    useCallback((msg) => {
      if (msg.type === "device_activity" || msg.type === "device_registered") {
        const mac = msg.mac as string;
        const lastSeenAt =
          (msg.lastSeenAt as string) || new Date().toISOString();

        setDevices((prev) => {
          const idx = prev.findIndex((d) => d.mac_address === mac);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], last_seen_at: lastSeenAt };
            // 최근 활동 기기를 맨 위로
            updated.sort(
              (a, b) =>
                new Date(b.last_seen_at).getTime() -
                new Date(a.last_seen_at).getTime()
            );
            return updated;
          }
          // 새 기기
          const newDevice: Device = {
            id: (msg.deviceId as number) ?? 0,
            mac_address: mac,
            created_at: lastSeenAt,
            last_seen_at: lastSeenAt,
          };
          return [newDevice, ...prev];
        });
      }
    }, [])
  );

  // 상태별 카운트
  const counts = { connected: 0, warning: 0, disconnected: 0 };
  for (const d of devices) {
    counts[getStatus(d.last_seen_at)]++;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Device Monitor</h1>
        <button
          type="button"
          onClick={resetDevices}
          disabled={deleting || devices.length === 0}
          className="rounded-lg border border-[var(--danger)] px-4 py-2 text-sm font-medium text-[var(--danger)] transition-colors hover:bg-[var(--danger)] hover:text-white disabled:opacity-30"
        >
          {deleting ? "초기화 중..." : "기기 초기화"}
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-[var(--danger)] px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </p>
      )}

      {message && (
        <p className="mb-4 rounded-lg border border-green-500 px-4 py-3 text-sm text-green-500">
          {message}
        </p>
      )}

      {/* 요약 카드 */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {(["connected", "warning", "disconnected"] as const).map((s) => {
          const cfg = statusConfig[s];
          return (
            <div
              key={s}
              className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-4 text-center"
            >
              <div className={`inline-flex items-center gap-2 text-sm ${cfg.bg} rounded-full px-3 py-1 mb-2`}>
                <span className={`inline-block h-2 w-2 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </div>
              <div className="text-3xl font-bold tabular-nums">{counts[s]}</div>
            </div>
          );
        })}
      </div>

      <p className="mb-4 text-sm text-[var(--foreground)]/60">
        전체 {devices.length}대 등록
      </p>

      {/* 기기 테이블 */}
      <div className="overflow-x-auto rounded-lg border border-[var(--card-border)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--card-border)] bg-[var(--card)]">
              <th className="px-4 py-3 text-left font-medium">ID</th>
              <th className="px-4 py-3 text-left font-medium">MAC 주소</th>
              <th className="px-4 py-3 text-left font-medium">상태</th>
              <th className="px-4 py-3 text-left font-medium">마지막 신호</th>
            </tr>
          </thead>
          <tbody>
            {devices.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-[var(--foreground)]/40"
                >
                  등록된 기기가 없습니다
                </td>
              </tr>
            )}
            {devices.map((d) => {
              const status = getStatus(d.last_seen_at);
              const cfg = statusConfig[status];
              return (
                <tr
                  key={d.id}
                  className="border-b border-[var(--card-border)] last:border-b-0"
                >
                  <td className="px-4 py-3 tabular-nums">{d.id}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {d.mac_address}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.bg}`}
                    >
                      <span
                        className={`inline-block h-1.5 w-1.5 rounded-full ${cfg.dot}`}
                      />
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-[var(--foreground)]/60">
                    {formatElapsed(d.last_seen_at)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
