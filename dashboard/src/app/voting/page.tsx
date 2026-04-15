"use client";

import { useState, useCallback } from "react";
import Timer from "@/components/Timer";
import ScoreDisplay from "@/components/ScoreDisplay";
import { useWebSocket } from "@/hooks/useWebSocket";

type Phase = "setup" | "voting" | "result";

export default function VotingPage() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [teamName, setTeamName] = useState("");
  const [timerSeconds, setTimerSeconds] = useState(10);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [voteCount, setVoteCount] = useState(0);

  // WebSocket으로 실시간 투표 수 수신
  useWebSocket(
    useCallback(
      (msg) => {
        if (
          msg.type === "vote" &&
          sessionId != null &&
          msg.sessionId === sessionId
        ) {
          setVoteCount(msg.count as number);
        }
      },
      [sessionId]
    )
  );

  async function startVoting() {
    if (!teamName.trim()) return;

    const res = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamName: teamName.trim(), timerSeconds }),
    });
    const data = await res.json();
    setSessionId(data.id);
    setVoteCount(0);
    setPhase("voting");
  }

  const finishVoting = useCallback(async () => {
    if (!sessionId) return;
    await fetch("/api/teams", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, status: "finished" }),
    });

    // 최종 투표 수 조회
    const res = await fetch(`/api/votes?sessionId=${sessionId}`);
    const data = await res.json();
    setVoteCount(data.count);
    setPhase("result");
  }, [sessionId]);

  function reset() {
    setPhase("setup");
    setTeamName("");
    setSessionId(null);
    setVoteCount(0);
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl flex-col items-center justify-center px-4">
      {phase === "setup" && (
        <div className="flex w-full max-w-md flex-col gap-4">
          <h1 className="text-3xl font-bold text-center mb-4">투표 시작</h1>
          <input
            type="text"
            placeholder="팀 이름"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-4 py-3 text-lg outline-none focus:border-[var(--accent)]"
            onKeyDown={(e) => e.key === "Enter" && startVoting()}
          />
          <div className="flex items-center gap-3">
            <label className="text-sm whitespace-nowrap">투표 시간(초)</label>
            <input
              type="number"
              min={5}
              max={300}
              step={5}
              value={timerSeconds}
              onChange={(e) => setTimerSeconds(Number(e.target.value))}
              className="flex-1 rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-4 py-2 outline-none focus:border-[var(--accent)]"
            />
          </div>
          <button
            onClick={startVoting}
            disabled={!teamName.trim()}
            className="rounded-lg bg-[var(--accent)] px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-40"
          >
            투표 시작
          </button>
        </div>
      )}

      {phase === "voting" && (
        <div className="flex flex-col items-center gap-8">
          <h2 className="text-2xl font-semibold">{teamName}</h2>
          <Timer
            seconds={timerSeconds}
            running={true}
            onFinish={finishVoting}
          />
          <p className="text-4xl tabular-nums">
            현재 <span className="font-bold text-[var(--accent)]">{voteCount}</span>표
          </p>
        </div>
      )}

      {phase === "result" && (
        <div className="flex flex-col items-center gap-8">
          <h2 className="text-2xl font-semibold">{teamName}</h2>
          <ScoreDisplay score={voteCount} animate />
          <button
            onClick={reset}
            className="rounded-lg border border-[var(--card-border)] px-6 py-3 text-lg transition-colors hover:border-[var(--accent)]"
          >
            다음 팀
          </button>
        </div>
      )}
    </div>
  );
}
