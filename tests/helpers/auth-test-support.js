import { exportJWK, generateKeyPair, SignJWT } from "jose";

export const testIssuer = "https://issuer.test.example/";
export const testAudience = "slsea-api-test";
export const testJwksUrl = `${testIssuer}.well-known/jwks.json`;
const testKeyId = "test-signing-key";

let signingKeyPair;
let originalFetch;

export const configureTestOidc = async () => {
  signingKeyPair = await generateKeyPair("ES256");
  const verificationKey = {
    ...(await exportJWK(signingKeyPair.publicKey)),
    kid: testKeyId,
    alg: "ES256",
    use: "sig",
    key_ops: ["verify"]
  };

  process.env.AUTH_ISSUER = testIssuer;
  process.env.AUTH_AUDIENCE = testAudience;
  process.env.AUTH_JWKS_URL = testJwksUrl;
  process.env.AUTH_ALLOWED_ALGORITHMS = "ES256";
  process.env.AUTH_CLOCK_TOLERANCE_SECONDS = "0";

  originalFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = async (input, options) => {
    const url = typeof input === "string" ? input : input.url;

    if (url === testJwksUrl) {
      return Response.json({ keys: [verificationKey] }, { status: 200 });
    }

    return originalFetch(input, options);
  };
};

export const issueTestToken = async ({
  actorType = "analyst",
  jurisdiction = { level: "national" },
  installationId,
  issuer = testIssuer,
  audience = testAudience,
  subject = "test-principal",
  scopes,
  expiresAt = Math.floor(Date.now() / 1000) + 300,
  notBefore,
  keyPair = signingKeyPair
} = {}) => {
  const claims = { actor_type: actorType };

  if (scopes !== undefined) claims.scope = scopes.join(" ");

  if (jurisdiction !== undefined) claims.jurisdiction = jurisdiction;
  if (installationId !== undefined) {
    claims.installation_id = installationId;
  }

  const token = new SignJWT(claims)
    .setProtectedHeader({ alg: "ES256", kid: testKeyId })
    .setIssuer(issuer)
    .setAudience(audience)
    .setSubject(subject)
    .setIssuedAt()
    .setExpirationTime(expiresAt);

  if (notBefore !== undefined) token.setNotBefore(notBefore);

  return token.sign(keyPair.privateKey);
};

export const createDifferentTestKeyPair = () => generateKeyPair("ES256");
