import postgres from "postgres";
import { env } from "./env.js";

if (!env.databaseUrl) {
  throw new Error("DATABASE_URL is not configured");
}

const sql = postgres(env.databaseUrl, {
  max: 5,
  idle_timeout: 20,
  connect_timeout: 10
});

export default sql;