import mysql from "mysql2/promise";
import { config } from "./config";

const globalForDb = globalThis as unknown as { _dbPool?: mysql.Pool };

export const pool =
  globalForDb._dbPool ??
  mysql.createPool({
    ...config.db,
    waitForConnections: true,
    connectionLimit: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb._dbPool = pool;
}
