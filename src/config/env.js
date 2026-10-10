const nodeEnv = process.env.NODE_ENV || "development";
const portValue = process.env.PORT || "5000";
const port = Number(portValue);

if (
  !Number.isInteger(port) ||
  port < 1 ||
  port > 65535
) {
  throw new Error("PORT must be an integer between 1 and 65535");
}

const databaseUrl = process.env.DATABASE_URL || "";

if (nodeEnv !== "test" && !databaseUrl.trim()) {
  throw new Error("DATABASE_URL is required");
}

const apiVersion = process.env.API_VERSION || "v1";
const corsOrigin = process.env.CORS_ORIGIN || "*";

export const env = {
  nodeEnv,
  port,
  databaseUrl,
  corsOrigin,
  apiVersion
};
