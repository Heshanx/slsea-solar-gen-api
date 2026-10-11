export function databaseOptions(databaseUrl, nodeEnv, ca) {
  const remote = !["localhost", "127.0.0.1", "[::1]"].includes(new URL(databaseUrl).hostname);
  return {
    ...(remote || nodeEnv === "production" ? {
      ssl: { rejectUnauthorized: true, ...(ca ? { ca } : {}) }
    } : {}),
    ...(remote && nodeEnv !== "production" ? {
      connection: { default_transaction_read_only: "on" }
    } : {}),
    max: 5, idle_timeout: 20, connect_timeout: 10
  };
}
