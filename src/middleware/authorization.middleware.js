import { env } from "../config/env.js";
import { sendAuthError } from "./authentication.middleware.js";

const relativeSitePath = (req) => {
  const pathname = new URL(
    req.originalUrl,
    "http://localhost"
  ).pathname;
  const sitePrefix = `/api/${env.apiVersion}/sites`;

  return pathname.startsWith(sitePrefix)
    ? pathname.slice(sitePrefix.length) || "/"
    : "";
};

const deny = (res, status, code, message) =>
  sendAuthError(res, status, code, message);

export const authorizeSiteRequest = (req, res, next) => {
  const actor = req.auth;
  const path = relativeSitePath(req);
  const method = req.method.toUpperCase();

  if (!actor) {
    return deny(
      res,
      401,
      "AUTHENTICATION_REQUIRED",
      "A valid bearer token is required"
    );
  }

  if (method === "GET") {
    if (actor.actorType === "device") {
      return deny(
        res,
        403,
        "DEVICE_READ_NOT_ALLOWED",
        "Device credentials may only submit readings"
      );
    }

    if (
      actor.actorType === "analyst" &&
      actor.jurisdiction?.level !== "national"
    ) {
      return deny(
        res,
        403,
        "JURISDICTION_SCOPE_UNAVAILABLE",
        "Regional reads are unavailable until geographic scoping is implemented"
      );
    }

    return next();
  }

  const readingIngest = /^\/([^/]+)\/generation\/?$/.exec(path);

  if (method === "POST" && readingIngest) {
    if (actor.actorType !== "device") {
      return deny(
        res,
        403,
        "READING_INGEST_ROLE_REQUIRED",
        "Only an installation-bound device may submit readings"
      );
    }

    if (
      readingIngest[1].toLowerCase() !== actor.installationId.toLowerCase()
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

  if (method === "POST" && /^\/[^/]+\/weather\/?$/.test(path)) {
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

  if (method === "POST" && (path === "/" || path === "")) {
    return next();
  }

  if (method === "PUT" && /^\/[^/]+\/?$/.test(path)) {
    return next();
  }

  if (method === "DELETE" && /^\/[^/]+\/?$/.test(path)) {
    return deny(
      res,
      409,
      "SITE_DELETION_REQUIRES_HISTORY_PROTECTION",
      "Site deletion is disabled until generation-history retention is enforced"
    );
  }

  return deny(
    res,
    403,
    "RESOURCE_WRITE_NOT_ALLOWED",
    "This role is not authorized to modify this resource"
  );
};
