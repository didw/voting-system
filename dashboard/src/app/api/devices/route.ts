import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import mysql from "mysql2/promise";

// GET /api/devices — 전체 기기 목록 (최근 활동순)
export async function GET() {
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    "SELECT id, mac_address, created_at, last_seen_at FROM devices ORDER BY last_seen_at DESC"
  );
  return NextResponse.json(rows);
}

// DELETE /api/devices — 기기 목록 전체 초기화
export async function DELETE() {
  const [result] = await pool.execute<mysql.ResultSetHeader>(
    "DELETE FROM devices"
  );
  return NextResponse.json({ ok: true, deleted: result.affectedRows });
}
