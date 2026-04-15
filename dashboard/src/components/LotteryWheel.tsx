"use client";

import { useState, useEffect, useRef } from "react";

interface Props {
  numbers: number[];
  onResult: (number: number) => void;
}

export default function LotteryWheel({ numbers, onResult }: Props) {
  const [display, setDisplay] = useState<number | null>(null);
  const [phase, setPhase] = useState<"spin" | "reveal">("spin");
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (numbers.length === 0) return;
    cancelledRef.current = false;
    setPhase("spin");

    let idx = Math.floor(Math.random() * numbers.length);
    const totalFrames = 30;

    function tick(i: number) {
      if (cancelledRef.current) return;
      if (i >= totalFrames) {
        const final = numbers[Math.floor(Math.random() * numbers.length)];
        setDisplay(final);
        setPhase("reveal");
        onResult(final);
        return;
      }

      const delay = i < 10 ? 60 : i < 20 ? 120 : i < 25 ? 200 : 350;
      idx = (idx + 1) % numbers.length;
      setDisplay(numbers[idx]);
      setTimeout(() => tick(i + 1), delay);
    }

    tick(0);
    return () => { cancelledRef.current = true; };
  }, [numbers, onResult]);

  return (
    <div className="flex items-center justify-center py-8">
      <span
        className={`text-[14rem] font-bold leading-none tabular-nums transition-all duration-300 ${
          phase === "reveal"
            ? "text-[var(--danger)] animate-pulse scale-110"
            : "text-[var(--accent)]"
        }`}
      >
        {display ?? "-"}
      </span>
    </div>
  );
}
