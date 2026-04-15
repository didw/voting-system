import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import mysql from "mysql2/promise";

// GET /api/lottery - 추첨 이력 조회
export async function GET() {
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    "SELECT id, number, drawn_at FROM lottery ORDER BY id DESC"
  );
  return NextResponse.json(rows);
}

// POST /api/lottery - 번호 추첨
export async function POST(req: NextRequest) {
  const { min = 1, max = 520 } = await req.json();

  // 이미 추첨된 번호 조회
  const [drawn] = await pool.execute<mysql.RowDataPacket[]>(
    "SELECT number FROM lottery"
  );
  const drawnSet = new Set(drawn.map((r) => r.number));

  // 가용 번호 목록
  const available: number[] = [];
  for (let i = min; i <= max; i++) {
    if (!drawnSet.has(i)) available.push(i);
  }

  if (available.length === 0) {
    return NextResponse.json({ error: "추첨 가능한 번호가 없습니다" }, { status: 400 });
  }

  // 랜덤 선택
  const number = available[Math.floor(Math.random() * available.length)];

  try {
    await pool.execute("INSERT INTO lottery (number) VALUES (?)", [number]);
  } catch (err: any) {
    if (err.code === "ER_DUP_ENTRY") {
      return NextResponse.json({ error: "중복 번호" }, { status: 409 });
    }
    throw err;
  }

  return NextResponse.json({
    number,
    remaining: available.length - 1,
  });
}

// DELETE /api/lottery - 추첨 이력 전체 삭제
export async function DELETE() {
  await pool.execute("DELETE FROM lottery");
  return NextResponse.json({ ok: true });
}
