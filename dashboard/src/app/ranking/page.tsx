"use client";

import { useState, useEffect, useCallback } from "react";
import RankingReveal from "@/components/RankingReveal";

interface Team {
  id: number;
  team_name: string;
  vote_score: number;
  judge_score: number;
  total_score: number;
}

const POSITION_LABELS = ["1st", "2nd", "3rd"];
const POSITION_COLORS = ["text-yellow-400", "text-gray-300", "text-amber-600"];

export default function RankingPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [revealed, setRevealed] = useState<Record<number, string>>({});
  const [revealing, setRevealing] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/teams")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          throw new Error(data.error ?? "순위를 불러오지 못했습니다.");
        }
        return data as Team[];
      })
      .then((data) => {
        const sorted = [...data].sort((a, b) => b.total_score - a.total_score);
        setTeams(sorted);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "순위를 불러오지 못했습니다.");
      })
      .finally(() => setLoading(false));
  }, []);

  function revealPosition(position: number) {
    if (revealing != null || revealed[position] != null) return;
    setRevealing(position);
  }

  const handleRevealComplete = useCallback(() => {
    if (revealing == null || teams.length === 0) return;
    const winner = teams[revealing - 1];
    if (winner) {
      setRevealed((prev) => ({ ...prev, [revealing]: winner.team_name }));
    }
    setRevealing(null);
  }, [revealing, teams]);

  const allNames = teams.map((t) => t.team_name);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl flex-col items-center justify-center gap-8 px-4">
      <h1 className="text-3xl font-bold">순위 발표</h1>

      {/* 이미 발표된 순위 */}
      <div className="flex flex-col items-center gap-4">
        {[1, 2, 3].map((pos) =>
          revealed[pos] ? (
            <div key={pos} className="flex items-center gap-4">
              <span className={`text-5xl font-bold ${POSITION_COLORS[pos - 1]}`}>
                {POSITION_LABELS[pos - 1]}
              </span>
              <span className="text-5xl font-bold">{revealed[pos]}</span>
            </div>
          ) : null
        )}
      </div>

      {/* 스피닝 애니메이션 */}
      {revealing != null && teams.length > 0 && (
        <RankingReveal
          names={allNames}
          winnerName={teams[revealing - 1]?.team_name ?? ""}
          onComplete={handleRevealComplete}
        />
      )}

      {/* 발표 버튼 */}
      {revealing == null && (
        <div className="flex gap-4">
          {[1, 2, 3].map((pos) => (
            <button
              type="button"
              key={pos}
              onClick={() => revealPosition(pos)}
              disabled={
                revealed[pos] != null || teams.length < pos
              }
              className="rounded-lg bg-[var(--accent)] px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-30"
            >
              {pos}등 발표
            </button>
          ))}
        </div>
      )}

      {loading && (
        <p className="text-[var(--foreground)]/60">순위를 불러오는 중입니다.</p>
      )}

      {error && (
        <p className="rounded-lg border border-[var(--danger)] px-4 py-3 text-sm text-[var(--danger)]">
          {error}
        </p>
      )}

      {!loading && !error && teams.length === 0 && (
        <p className="text-[var(--foreground)]/60">
          투표 결과가 없습니다. 투표를 먼저 진행하세요.
        </p>
      )}
    </div>
  );
}
