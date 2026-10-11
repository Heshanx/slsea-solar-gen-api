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
const oidcIssuer = (process.env.AUTH_ISSUER || "").trim();
const oidcAudience = (process.env.AUTH_AUDIENCE || "").trim();
const oidcJwksUrl = (process.env.AUTH_JWKS_URL || "").trim();
const oidcAlgorithms = (process.env.AUTH_ALLOWED_ALGORITHMS || "RS256,ES256")
  .split(",")
  .map((algorithm) => algorithm.trim())
  .filter(Boolean);
const oidcClockTolerance = Number(
  process.env.AUTH_CLOCK_TOLERANCE_SECONDS || "5"
);
const supportedOidcAlgorithms = new Set(["RS256", "ES256"]);

const isHttpsUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash;
  } catch {
    return false;
  }
};

const oidcConfigValid =
  oidcIssuer.length > 0 &&
  oidcAudience.length > 0 &&
  isHttpsUrl(oidcIssuer) &&
  isHttpsUrl(oidcJwksUrl) &&
  oidcAlgorithms.length > 0 &&
  oidcAlgorithms.every((algorithm) =>
    supportedOidcAlgorithms.has(algorithm)
  ) &&
  Number.isInteger(oidcClockTolerance) &&
  oidcClockTolerance >= 0 &&
  oidcClockTolerance <= 120;

export const env = {
  nodeEnv,
  port,
  databaseUrl,
  corsOrigin,
  apiVersion,
  oidc: {
    issuer: oidcIssuer,
    audience: oidcAudience,
    jwksUrl: oidcJwksUrl,
    algorithms: oidcAlgorithms,
    clockTolerance: oidcClockTolerance,
    configured: oidcConfigValid
  }
};
