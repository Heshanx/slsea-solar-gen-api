import { createRemoteJWKSet, jwtVerify } from "jose";

import { errorBody } from "../utils/error-response.js";
import { env } from "../config/env.js";
import { findActiveAssignment } from "../repositories/auth-principal.repository.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const sendAuthError = (res, status, code, message) => {
  if (status === 401) {
    res.set("WWW-Authenticate", 'Bearer realm="SLSEA API"');
  }

  res.set("Cache-Control", "no-store");
  return res.status(status).json(errorBody(code, message));
};

const isValidActorAssignment = (claims) => {
  if (claims.actor_type === "device") {
    return typeof claims.installation_id === "string" &&
      UUID_PATTERN.test(claims.installation_id);
  }

  if (claims.actor_type === "analyst") {
    const jurisdiction = claims.jurisdiction;

    if (!jurisdiction || typeof jurisdiction !== "object") {
      return false;
    }

    if (jurisdiction.level === "national") {
      return true;
    }

    return ["province", "district"].includes(jurisdiction.level) &&
      typeof jurisdiction.id === "string" &&
      UUID_PATTERN.test(jurisdiction.id);
  }

  return claims.actor_type === "registry_admin";
};

export const createAuthenticationMiddleware = (
  oidcConfig,
  resolveAssignment = findActiveAssignment
) => {
  let remoteJwks;

  return async (req, res, next) => {
    if (!oidcConfig?.configured) {
      return sendAuthError(
        res,
        503,
        "AUTHENTICATION_UNAVAILABLE",
        "Authentication is not configured"
      );
    }

    const authorization = req.get("authorization") || "";
    const bearer = /^Bearer\s+([^\s]+)$/i.exec(authorization);

    if (!bearer) {
      return sendAuthError(
        res,
        401,
        "AUTHENTICATION_REQUIRED",
        "A valid bearer token is required"
      );
    }

    let assignmentLookupFailed = false;
    try {
      remoteJwks ??= createRemoteJWKSet(new URL(oidcConfig.jwksUrl), {
        timeoutDuration: 5000,
        cooldownDuration: 30000,
        cacheMaxAge: 300000
      });

      const { payload } = await jwtVerify(bearer[1], remoteJwks, {
        issuer: oidcConfig.issuer,
        audience: oidcConfig.audience,
        algorithms: oidcConfig.algorithms,
        requiredClaims: ["iss", "aud", "exp", "sub"],
        clockTolerance: oidcConfig.clockTolerance
      });

      let assignment;
      try {
        assignment = await resolveAssignment(payload.iss, payload.sub);
      } catch (error) {
        assignmentLookupFailed = true;
        throw error;
      }

      if (!assignment || !isValidActorAssignment({
        actor_type: assignment.actorType,
        installation_id: assignment.installationId,
        jurisdiction: assignment.jurisdiction
      })) {
        return sendAuthError(
          res,
          403,
          "AUTHORIZATION_DENIED",
          "The token does not contain an authorized actor identity"
        );
      }

      req.auth = {
        subject: payload.sub,
        issuer: payload.iss,
        actorType: assignment.actorType,
        installationId: assignment.installationId,
        jurisdiction: assignment.jurisdiction,
        scopes: assignment.scopes || []
      };

      return next();
    } catch (error) {
      if (assignmentLookupFailed) {
        return sendAuthError(
          res,
          503,
          "AUTHORIZATION_UNAVAILABLE",
          "Authorization assignments could not be loaded"
        );
      }
      if (
        error?.code === "ERR_JWKS_TIMEOUT" ||
        error?.code === "ERR_JWKS_INVALID" ||
        error?.code === "ERR_JOSE_GENERIC" ||
        error instanceof TypeError
      ) {
        return sendAuthError(
          res,
          503,
          "AUTHENTICATION_UNAVAILABLE",
          "The identity provider could not be reached"
        );
      }

      return sendAuthError(
        res,
        401,
        "INVALID_BEARER_TOKEN",
        "The bearer token is invalid or expired"
      );
    }
  };
};

export const authenticate = createAuthenticationMiddleware(env.oidc);

export { sendAuthError };
