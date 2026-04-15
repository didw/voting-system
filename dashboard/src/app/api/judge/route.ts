import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import mysql from "mysql2/promise";

// GET /api/judge - 전체 팀의 심사 점수 조회
export async function GET() {
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(`
    SELECT
      s.id AS session_id, s.team_name,
      COALESCE(r.vote_score, 0) AS vote_score,
      COALESCE(r.judge_score, 0) AS judge_score
    FROM sessions s
    LEFT JOIN results r ON r.session_id = s.id
    ORDER BY s.id ASC
  `);
  return NextResponse.json(rows);
}

// POST /api/judge - 심사 점수 입력/수정
export async function POST(req: NextRequest) {
  const { sessionId, judgeScore } = await req.json();
  if (sessionId == null || judgeScore == null) {
    return NextResponse.json({ error: "sessionId와 judgeScore 필요" }, { status: 400 });
  }

  await pool.execute(
    "UPDATE results SET judge_score = ? WHERE session_id = ?",
    [Number(judgeScore), sessionId]
  );
  return NextResponse.json({ ok: true });
}
