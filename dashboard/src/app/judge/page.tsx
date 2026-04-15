"use client";

import { useState, useEffect } from "react";

interface TeamRow {
  session_id: number;
  team_name: string;
  vote_score: number;
  judge_score: number;
}

export default function JudgePage() {
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [scores, setScores] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState<number | null>(null);

  async function loadTeams() {
    const res = await fetch("/api/judge");
    const data: TeamRow[] = await res.json();
    setTeams(data);
    const init: Record<number, string> = {};
    for (const t of data) {
      init[t.session_id] = String(t.judge_score);
    }
    setScores(init);
  }

  useEffect(() => {
    loadTeams();
  }, []);

  async function saveScore(sessionId: number) {
    const val = Number(scores[sessionId] ?? 0);
    setSaving(sessionId);
    await fetch("/api/judge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, judgeScore: val }),
    });
    setSaving(null);
    loadTeams();
  }

  async function saveAll() {
    for (const t of teams) {
      const val = Number(scores[t.session_id] ?? 0);
      await fetch("/api/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: t.session_id, judgeScore: val }),
      });
    }
    loadTeams();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">심사위원 점수 입력</h1>
        <button
          onClick={saveAll}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
        >
          전체 저장
        </button>
      </div>

      {teams.length === 0 ? (
        <p className="text-center text-[var(--foreground)]/60 py-12">
          아직 등록된 팀이 없습니다. 투표를 먼저 진행하세요.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[var(--card-border)]">
          <table className="w-full">
            <thead className="bg-[var(--card)]">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">#</th>
                <th className="px-4 py-3 text-left text-sm font-medium">팀 이름</th>
                <th className="px-4 py-3 text-right text-sm font-medium">투표 점수</th>
                <th className="px-4 py-3 text-right text-sm font-medium">심사 점수</th>
                <th className="px-4 py-3 text-right text-sm font-medium">합계</th>
                <th className="px-4 py-3 text-center text-sm font-medium">저장</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((t, i) => (
                <tr
                  key={t.session_id}
                  className="border-t border-[var(--card-border)] hover:bg-[var(--card)]/50"
                >
                  <td className="px-4 py-3 text-sm">{i + 1}</td>
                  <td className="px-4 py-3 font-medium">{t.team_name}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {t.vote_score}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <input
                      type="number"
                      min={0}
                      value={scores[t.session_id] ?? "0"}
                      onChange={(e) =>
                        setScores((s) => ({
                          ...s,
                          [t.session_id]: e.target.value,
                        }))
                      }
                      className="w-24 rounded border border-[var(--card-border)] bg-[var(--background)] px-2 py-1 text-right tabular-nums outline-none focus:border-[var(--accent)]"
                    />
                  </td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums text-[var(--accent)]">
                    {t.vote_score + Number(scores[t.session_id] ?? 0)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => saveScore(t.session_id)}
                      disabled={saving === t.session_id}
                      className="rounded bg-[var(--card)] px-3 py-1 text-sm transition-colors hover:bg-[var(--accent)] hover:text-white disabled:opacity-40"
                    >
                      {saving === t.session_id ? "..." : "저장"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
