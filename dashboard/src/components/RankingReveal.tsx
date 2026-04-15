"use client";

import { useState, useEffect, useRef } from "react";

interface Props {
  names: string[];
  winnerName: string;
  onComplete: () => void;
}

export default function RankingReveal({ names, winnerName, onComplete }: Props) {
  const [display, setDisplay] = useState("");
  const [phase, setPhase] = useState<"spin" | "reveal">("spin");
  const frameRef = useRef(0);

  useEffect(() => {
    if (names.length === 0) return;

    let idx = 0;
    const totalFrames = 25;
    let frame = 0;

    const interval = setInterval(() => {
      frame++;
      frameRef.current = frame;

      // 점점 느려지는 효과
      const speed = frame < 10 ? 80 : frame < 18 ? 150 : 300;

      idx = (idx + 1) % names.length;
      setDisplay(names[idx]);

      if (frame >= totalFrames) {
        clearInterval(interval);
        setDisplay(winnerName);
        setPhase("reveal");
        setTimeout(onComplete, 2000);
      }
    }, 80);

    // 속도 변화를 위해 재귀 타이머 사용
    let cancelled = false;
    clearInterval(interval);

    function tick(i: number) {
      if (cancelled || i >= totalFrames) {
        if (!cancelled) {
          setDisplay(winnerName);
          setPhase("reveal");
          setTimeout(onComplete, 2000);
        }
        return;
      }

      const delay = i < 10 ? 80 : i < 18 ? 150 : 300;
      idx = (idx + 1) % names.length;
      setDisplay(names[idx]);

      setTimeout(() => tick(i + 1), delay);
    }

    tick(0);
    return () => { cancelled = true; };
  }, [names, winnerName, onComplete]);

  return (
    <div className="flex items-center justify-center">
      <span
        className={`text-[8rem] font-bold leading-none transition-all duration-300 ${
          phase === "reveal"
            ? "text-[var(--danger)] animate-pulse scale-110"
            : ""
        }`}
      >
        {display}
      </span>
    </div>
  );
}
