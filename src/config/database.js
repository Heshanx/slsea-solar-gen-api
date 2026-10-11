import postgres from "postgres";
import { env } from "./env.js";
import { databaseOptions } from "./database-options.js";
import { loadDatabaseCa } from "./database-ca.js";

if (!env.databaseUrl) {
  throw new Error("DATABASE_URL is not configured");
}

// A localhost API may point at production. Remote development sessions are read-only.
const sql = postgres(env.databaseUrl,
  databaseOptions(env.databaseUrl, env.nodeEnv, loadDatabaseCa()));

export default sql;
