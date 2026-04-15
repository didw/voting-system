"use client";

import { useState, useEffect, useCallback } from "react";
import LotteryWheel from "@/components/LotteryWheel";

export default function LuckyDrawPage() {
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(520);
  const [drawing, setDrawing] = useState(false);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [lastDrawn, setLastDrawn] = useState<number | null>(null);
  const [spinKey, setSpinKey] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // 기존 추첨 이력 로드
  useEffect(() => {
    fetch("/api/lottery")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          throw new Error(data.error ?? "추첨 이력을 불러오지 못했습니다.");
        }
        return data as { number: number }[];
      })
      .then((data: { number: number }[]) => {
        setDrawnNumbers(data.map((d) => d.number));
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "추첨 이력을 불러오지 못했습니다.");
      });
  }, []);

  function getAvailable(): number[] {
    const drawnSet = new Set(drawnNumbers);
    const avail: number[] = [];
    for (let i = min; i <= max; i++) {
      if (!drawnSet.has(i)) avail.push(i);
    }
    return avail;
  }

  async function startDraw() {
    if (drawing || available.length === 0) return;
    setError(null);
    setDrawing(true);
    setLastDrawn(null);
    setSpinKey((k) => k + 1);
  }

  const handleResult = useCallback(
    async (number: number) => {
      try {
        // 서버에 저장
        const res = await fetch("/api/lottery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ min, max }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "추첨 결과를 저장하지 못했습니다.");
        }
        const actual = data.number ?? number;

        setLastDrawn(actual);
        setDrawnNumbers((prev) => [actual, ...prev]);
        setDrawing(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "추첨 결과를 저장하지 못했습니다.");
        setDrawing(false);
      }
    },
    [min, max]
  );

  async function resetAll() {
    if (!confirm("모든 추첨 기록을 삭제하시겠습니까?")) return;
    setError(null);
    const res = await fetch("/api/lottery", { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "추첨 기록을 삭제하지 못했습니다.");
      return;
    }
    setDrawnNumbers([]);
    setLastDrawn(null);
  }

  const available = getAvailable();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold text-center mb-8">행운권 추첨</h1>

      {/* 설정 */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <label className="text-sm">범위</label>
        <input
          type="number"
          value={min}
          onChange={(e) => setMin(Number(e.target.value))}
          className="w-20 rounded border border-[var(--card-border)] bg-[var(--card)] px-2 py-1 text-center tabular-nums outline-none focus:border-[var(--accent)]"
        />
        <span>~</span>
        <input
          type="number"
          value={max}
          onChange={(e) => setMax(Number(e.target.value))}
          className="w-20 rounded border border-[var(--card-border)] bg-[var(--card)] px-2 py-1 text-center tabular-nums outline-none focus:border-[var(--accent)]"
        />
        <span className="text-sm text-[var(--foreground)]/60">
          (남은 번호: {available.length})
        </span>
      </div>

      {error && (
        <p className="mx-auto mb-6 max-w-md rounded-lg border border-[var(--danger)] px-4 py-3 text-center text-sm text-[var(--danger)]">
          {error}
        </p>
      )}

      {/* 추첨 애니메이션 */}
      {drawing && (
        <LotteryWheel
          key={spinKey}
          numbers={available}
          onResult={handleResult}
        />
      )}

      {/* 결과 표시 */}
      {!drawing && lastDrawn != null && (
        <div className="flex items-center justify-center py-8">
          <span className="text-[14rem] font-bold leading-none tabular-nums text-[var(--danger)] animate-pulse">
            {lastDrawn}
          </span>
        </div>
      )}

      {!drawing && lastDrawn == null && (
        <div className="flex items-center justify-center py-8">
          <span className="text-[6rem] text-[var(--foreground)]/20">?</span>
        </div>
      )}

      {/* 버튼 */}
      <div className="flex justify-center gap-4 mb-12">
        <button
          type="button"
          onClick={startDraw}
          disabled={drawing || available.length === 0}
          className="rounded-lg bg-[var(--accent)] px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-30"
        >
          {available.length === 0 ? "추첨 완료" : "추첨하기"}
        </button>
        <button
          type="button"
          onClick={resetAll}
          disabled={drawing}
          className="rounded-lg border border-[var(--danger)] px-6 py-3 text-lg text-[var(--danger)] transition-colors hover:bg-[var(--danger)] hover:text-white disabled:opacity-30"
        >
          초기화
        </button>
      </div>

      {/* 추첨 이력 */}
      {drawnNumbers.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">추첨 이력</h2>
          <div className="flex flex-wrap gap-2">
            {drawnNumbers.map((n, i) => (
              <span
                key={`${n}-${i}`}
                className={`inline-block rounded-lg px-3 py-1 text-sm font-medium tabular-nums ${
                  n === lastDrawn
                    ? "bg-[var(--danger)] text-white"
                    : "bg-[var(--card)] border border-[var(--card-border)]"
                }`}
              >
                {n}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
