"use client";

import { useEffect, useState } from "react";

interface ScoreDisplayProps {
  score: number;
  animate?: boolean;
}

export default function ScoreDisplay({ score, animate = false }: ScoreDisplayProps) {
  const [visible, setVisible] = useState(!animate);

  useEffect(() => {
    if (!animate) return;
    setVisible(false);
    const id = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(id);
  }, [score, animate]);

  return (
    <div className="flex flex-col items-center gap-2">
      <span
        className={`text-[14rem] font-bold leading-none tabular-nums transition-all duration-500 ${
          visible
            ? "opacity-100 scale-100 text-[var(--accent)]"
            : "opacity-0 scale-50"
        }`}
      >
        {score}
      </span>
      <span className="text-lg text-[var(--foreground)]/60">투표 수</span>
    </div>
  );
}
