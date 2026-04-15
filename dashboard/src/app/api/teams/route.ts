import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import mysql from "mysql2/promise";

// GET /api/teams - 전체 세션(팀) 목록 + 점수
export async function GET() {
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(`
    SELECT
      s.id, s.team_name, s.status, s.timer_seconds,
      COALESCE(r.vote_score, 0) AS vote_score,
      COALESCE(r.judge_score, 0) AS judge_score,
      COALESCE(r.vote_score, 0) + COALESCE(r.judge_score, 0) AS total_score
    FROM sessions s
    LEFT JOIN results r ON r.session_id = s.id
    ORDER BY s.id ASC
  `);
  return NextResponse.json(rows);
}

// POST /api/teams - 새 세션 생성 (투표 시작)
export async function POST(req: NextRequest) {
  const { teamName, timerSeconds = 10 } = await req.json();
  if (!teamName?.trim()) {
    return NextResponse.json({ error: "팀 이름을 입력하세요" }, { status: 400 });
  }

  const [result] = await pool.execute<mysql.ResultSetHeader>(
    "INSERT INTO sessions (team_name, timer_seconds, status) VALUES (?, ?, 'voting')",
    [teamName.trim(), timerSeconds]
  );
  const sessionId = result.insertId;

  // results 행도 미리 생성
  await pool.execute(
    "INSERT INTO results (session_id, vote_score, judge_score) VALUES (?, 0, 0)",
    [sessionId]
  );

  return NextResponse.json({ id: sessionId, teamName, status: "voting" }, { status: 201 });
}

// PATCH /api/teams - 세션 상태 변경 (투표 종료 등)
export async function PATCH(req: NextRequest) {
  const { sessionId, status } = await req.json();
  if (!sessionId || !["waiting", "voting", "finished"].includes(status)) {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }

  const finishedAt = status === "finished" ? new Date() : null;
  await pool.execute(
    "UPDATE sessions SET status = ?, finished_at = ? WHERE id = ?",
    [status, finishedAt, sessionId]
  );

  // 투표 종료 시 vote_score 집계
  if (status === "finished") {
    const [rows] = await pool.execute<mysql.RowDataPacket[]>(
      "SELECT COUNT(*) AS cnt FROM votes WHERE session_id = ?",
      [sessionId]
    );
    await pool.execute(
      "UPDATE results SET vote_score = ? WHERE session_id = ?",
      [rows[0].cnt, sessionId]
    );
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/teams - 전체 리셋
export async function DELETE() {
  await pool.execute("DELETE FROM votes");
  await pool.execute("DELETE FROM results");
  await pool.execute("DELETE FROM sessions");
  await pool.execute("DELETE FROM devices");
  return NextResponse.json({ ok: true });
}
