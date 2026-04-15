import mysql from "mysql2/promise";
import { config } from "./config.js";

const pool = mysql.createPool({
  ...config.db,
  waitForConnections: true,
  connectionLimit: 10,
});

export async function ensureDevice(mac: string): Promise<number> {
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    "SELECT id FROM devices WHERE mac_address = ?",
    [mac]
  );
  if (rows.length > 0) {
    await pool.execute("UPDATE devices SET last_seen_at = NOW() WHERE id = ?", [
      rows[0].id,
    ]);
    return rows[0].id;
  }

  const [result] = await pool.execute<mysql.ResultSetHeader>(
    "INSERT INTO devices (mac_address, last_seen_at) VALUES (?, NOW())",
    [mac]
  );
  return result.insertId;
}

export async function recordVote(
  sessionId: number,
  deviceId: number
): Promise<boolean> {
  try {
    await pool.execute(
      "INSERT INTO votes (session_id, device_id) VALUES (?, ?)",
      [sessionId, deviceId]
    );
    return true;
  } catch (err: any) {
    // Duplicate key = already voted in this session
    if (err.code === "ER_DUP_ENTRY") return false;
    throw err;
  }
}

export async function getActiveSession(): Promise<{
  id: number;
  team_name: string;
} | null> {
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    "SELECT id, team_name FROM sessions WHERE status = 'voting' ORDER BY id DESC LIMIT 1"
  );
  return rows.length > 0 ? (rows[0] as any) : null;
}

export async function getVoteCount(sessionId: number): Promise<number> {
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    "SELECT COUNT(*) AS cnt FROM votes WHERE session_id = ?",
    [sessionId]
  );
  return rows[0].cnt;
}

export { pool };
