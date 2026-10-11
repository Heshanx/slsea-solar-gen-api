import { sendAuthError } from "./authentication.middleware.js";

const deny = (res, status, code, message) =>
  sendAuthError(res, status, code, message);

export const authorizeSiteRequest = (req, res, next) => {
  const actor = req.auth;
  // Inspect the registered route, never a caller-controlled spelling of its URL.
  // This middleware must run after Express has matched the operation.
  const path = req.route?.path;
  const method = req.method.toUpperCase();

  if (!actor) {
    return deny(
      res,
      401,
      "AUTHENTICATION_REQUIRED",
      "A valid bearer token is required"
    );
  }

  if (method === "GET" || method === "HEAD") {
    if (actor.actorType === "device") {
      return deny(
        res,
        403,
        "DEVICE_READ_NOT_ALLOWED",
        "Device credentials may only submit readings"
      );
    }

    if (!actor.scopes?.includes("data:read")) {
      return deny(res, 403, "READ_SCOPE_REQUIRED", "Read access requires data:read");
    }
    return next();
  }

  if (method === "POST" && path === "/:siteId/generation") {
    if (actor.actorType !== "device") {
      return deny(
        res,
        403,
        "READING_INGEST_ROLE_REQUIRED",
        "Only an installation-bound device may submit readings"
      );
    }

    if (!actor.scopes?.includes("readings:write")) {
      return deny(res, 403, "WRITE_SCOPE_REQUIRED", "Reading ingestion requires readings:write");
    }
    if (
      req.params.siteId?.toLowerCase() !== actor.installationId?.toLowerCase()
    ) {
      return deny(
        res,
        403,
        "INSTALLATION_SCOPE_DENIED",
        "The device may submit readings only for its bound installation"
      );
    }

    return next();
  }

  if (method === "POST" && path === "/:siteId/weather") {
    if (
      actor.actorType !== "registry_admin" ||
      !actor.scopes?.includes("weather:write")
    ) {
      return deny(
        res,
        403,
        "WEATHER_WRITE_SCOPE_REQUIRED",
        "Weather recording requires a registry administrator with weather:write scope"
      );
    }

    return next();
  }

  if (actor.actorType !== "registry_admin") {
    return deny(
      res,
      403,
      "READ_ONLY_ROLE",
      "This role cannot modify registry or observation resources"
    );
  }

  if (!actor.scopes?.includes("installations:manage")) {
    return deny(res, 403, "MANAGE_SCOPE_REQUIRED", "Registry changes require installations:manage");
  }
  if (method === "POST" && path === "/") {
    return next();
  }

  if (method === "PUT" && path === "/:id") {
    return next();
  }

  if (method === "DELETE" && path === "/:id") {
    return next();
  }

  return deny(
    res,
    403,
    "RESOURCE_WRITE_NOT_ALLOWED",
    "This role is not authorized to modify this resource"
  );
};
