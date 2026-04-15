"use client";

import { useState, useEffect, useCallback } from "react";

interface TimerProps {
  seconds: number;
  running: boolean;
  onFinish: () => void;
}

export default function Timer({ seconds, running, onFinish }: TimerProps) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (!running) return;
    if (remaining <= 0) {
      onFinish();
      return;
    }
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [running, remaining, onFinish]);

  const pct = seconds > 0 ? remaining / seconds : 0;
  const isUrgent = remaining <= 3 && remaining > 0;

  return (
    <div className="flex flex-col items-center gap-4">
      <span
        className={`text-[12rem] font-bold leading-none tabular-nums transition-colors ${
          isUrgent ? "text-[var(--danger)] animate-pulse" : ""
        }`}
      >
        {remaining}
      </span>
      <div className="h-2 w-full max-w-md rounded-full bg-[var(--card-border)]">
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-all duration-1000 ease-linear"
          style={{ width: `${pct * 100}%` }}
        />
      </div>
    </div>
  );
}
