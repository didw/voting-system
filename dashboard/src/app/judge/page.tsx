"use client";

import { useState, useCallback, useEffect } from "react";

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
  const [savingAll, setSavingAll] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadTeams = useCallback(async () => {
    try {
      const res = await fetch("/api/judge");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "팀 목록을 불러오지 못했습니다.");
      }
      setTeams(data);
      const init: Record<number, string> = {};
      for (const t of data as TeamRow[]) {
        init[t.session_id] = String(t.judge_score);
      }
      setScores(init);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "팀 목록을 불러오지 못했습니다.");
    }
  }, []);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  async function saveScore(sessionId: number) {
    if (resetting) return;

    const val = Number(scores[sessionId] ?? 0);
    setSaving(sessionId);
    setMessage(null);
    try {
      const res = await fetch("/api/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, judgeScore: val }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "점수를 저장하지 못했습니다.");
      }
      setMessage("저장했습니다.");
      loadTeams();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "점수를 저장하지 못했습니다.");
    } finally {
      setSaving(null);
    }
  }

  async function saveAll() {
    if (savingAll || resetting) return;

    setSavingAll(true);
    setMessage(null);
    try {
      for (const t of teams) {
        const val = Number(scores[t.session_id] ?? 0);
        const res = await fetch("/api/judge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: t.session_id, judgeScore: val }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "점수를 저장하지 못했습니다.");
        }
      }
      setMessage("전체 저장했습니다.");
      loadTeams();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "점수를 저장하지 못했습니다.");
    } finally {
      setSavingAll(false);
    }
  }

  async function resetTeams() {
    if (resetting) return;
    if (!confirm("모든 팀과 관련 점수, 투표 기록을 삭제하시겠습니까?")) {
      return;
    }

    setResetting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/teams", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "팀을 초기화하지 못했습니다.");
      }
      setTeams([]);
      setScores({});
      setMessage("모든 팀을 삭제했습니다.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "팀을 초기화하지 못했습니다.");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">심사위원 점수 입력</h1>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={saveAll}
            disabled={savingAll || resetting || teams.length === 0}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-40"
          >
            {savingAll ? "저장 중..." : "전체 저장"}
          </button>
          <button
            type="button"
            onClick={resetTeams}
            disabled={resetting || savingAll || teams.length === 0}
            className="rounded-lg border border-[var(--danger)] px-4 py-2 text-sm font-semibold text-[var(--danger)] transition-colors hover:bg-[var(--danger)] hover:text-white disabled:opacity-40"
          >
            {resetting ? "초기화 중..." : "팀 초기화"}
          </button>
        </div>
      </div>
      {message && (
        <p className="mb-4 rounded-lg border border-[var(--card-border)] px-4 py-3 text-sm">
          {message}
        </p>
      )}

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
                      type="button"
                      onClick={() => saveScore(t.session_id)}
                      disabled={saving === t.session_id || resetting}
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
