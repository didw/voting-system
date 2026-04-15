import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import mysql from "mysql2/promise";

// GET /api/votes?sessionId=1 - 해당 세션의 투표 수
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId 필요" }, { status: 400 });
  }

  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    "SELECT COUNT(*) AS count FROM votes WHERE session_id = ?",
    [sessionId]
  );
  return NextResponse.json({ sessionId: Number(sessionId), count: rows[0].count });
}

// DELETE /api/votes?sessionId=1 - 해당 세션 투표 리셋
export async function DELETE(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId 필요" }, { status: 400 });
  }

  await pool.execute("DELETE FROM votes WHERE session_id = ?", [sessionId]);
  await pool.execute(
    "UPDATE results SET vote_score = 0 WHERE session_id = ?",
    [sessionId]
  );
  return NextResponse.json({ ok: true });
}
