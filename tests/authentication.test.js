import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/services/solar-site.service.js", () => ({
  getAllSites: vi.fn(),
  getSiteById: vi.fn(),
  createSite: vi.fn(),
  updateSite: vi.fn(),
  deleteSite: vi.fn()
}));

vi.mock("../src/services/solar-generation.service.js", () => ({
  createGeneration: vi.fn(),
  getGeneration: vi.fn(),
  getGenerationById: vi.fn(),
  getLatestGeneration: vi.fn()
}));

vi.mock("../src/services/weather.service.js", () => ({
  createWeather: vi.fn(),
  getWeather: vi.fn(),
  getWeatherById: vi.fn()
}));

import app from "../src/app.js";
import * as solarSiteService from "../src/services/solar-site.service.js";
import * as solarGenerationService from "../src/services/solar-generation.service.js";
import * as weatherService from "../src/services/weather.service.js";
import { createAuthenticationMiddleware } from "../src/middleware/authentication.middleware.js";
import {
  createDifferentTestKeyPair,
  issueTestToken,
  testAudience,
  testIssuer,
  testJwksUrl
} from "./helpers/auth-test-support.js";

const installationId = "11111111-1111-4111-8111-111111111111";
const otherInstallationId = "22222222-2222-4222-8222-222222222222";

describe("OIDC JWT authentication and route authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    weatherService.createWeather.mockResolvedValue({ id: 1, site_id: installationId,
      recorded_at: "2026-01-01T00:00:00.000Z", temperature_c: 25 });
    solarSiteService.getAllSites.mockResolvedValue({ data: [], total: 0 });
    solarSiteService.createSite.mockResolvedValue({
      id: installationId,
      name: "Synthetic Test Installation",
      location: null,
      latitude: null,
      longitude: null,
      capacity_kw: 20,
      timezone: "Asia/Colombo",
      is_active: true,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z"
    });
    solarGenerationService.createGeneration.mockResolvedValue({
      id: 1,
      site_id: installationId,
      recorded_at: "2026-01-01T00:00:00.000Z",
      power_kw: 4,
      energy_kwh: 10,
      created_at: "2026-01-01T00:01:00.000Z"
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fails closed when OIDC verification is not configured", async () => {
    const unconfiguredApp = express();
    unconfiguredApp.get(
      "/protected",
      createAuthenticationMiddleware({ configured: false }),
      (_req, res) => res.sendStatus(204)
    );

    const response = await request(unconfiguredApp).get("/protected");

    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe("AUTHENTICATION_UNAVAILABLE");
  });

  it("uses the active database assignment instead of authorization token claims", async () => {
    const resolveAssignment = vi.fn().mockResolvedValue({
      actorType: "analyst",
      jurisdiction: { level: "district", id: installationId },
      scopes: []
    });
    const assignedApp = express();
    assignedApp.get(
      "/protected",
      createAuthenticationMiddleware({
        configured: true,
        issuer: testIssuer,
        audience: testAudience,
        jwksUrl: testJwksUrl,
        algorithms: ["ES256"],
        clockTolerance: 0
      }, resolveAssignment),
      (req, res) => res.json(req.auth)
    );
    const token = await issueTestToken({
      actorType: "device",
      jurisdiction: undefined,
      installationId: otherInstallationId
    });

    const response = await request(assignedApp)
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.actorType).toBe("analyst");
    expect(response.body.jurisdiction).toEqual({
      level: "district",
      id: installationId
    });
    expect(resolveAssignment).toHaveBeenCalledWith(testIssuer, expect.stringMatching(/^test-principal-/));
  });

  it("fails closed when authorization assignments cannot be loaded", async () => {
    const assignedApp = express();
    assignedApp.get(
      "/protected",
      createAuthenticationMiddleware({
        configured: true,
        issuer: testIssuer,
        audience: testAudience,
        jwksUrl: testJwksUrl,
        algorithms: ["ES256"],
        clockTolerance: 0
      }, vi.fn().mockRejectedValue(new Error("database offline"))),
      (_req, res) => res.sendStatus(204)
    );
    const token = await issueTestToken();

    const response = await request(assignedApp)
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe("AUTHORIZATION_UNAVAILABLE");
  });

  it("rejects missing, malformed, expired, wrongly issued, and wrong-audience tokens", async () => {
    const expiredToken = await issueTestToken({
      expiresAt: Math.floor(Date.now() / 1000) - 60
    });
    const wrongIssuerToken = await issueTestToken({
      issuer: "https://untrusted-issuer.test.example/"
    });
    const wrongAudienceToken = await issueTestToken({
      audience: "another-api"
    });

    const missing = await request(app).get("/api/v1/sites");
    const malformed = await request(app)
      .get("/api/v1/sites")
      .set("Authorization", "Bearer not-a-jwt");
    const expired = await request(app)
      .get("/api/v1/sites")
      .set("Authorization", `Bearer ${expiredToken}`);
    const wrongIssuer = await request(app)
      .get("/api/v1/sites")
      .set("Authorization", `Bearer ${wrongIssuerToken}`);
    const wrongAudience = await request(app)
      .get("/api/v1/sites")
      .set("Authorization", `Bearer ${wrongAudienceToken}`);

    for (const response of [missing, malformed, expired, wrongIssuer, wrongAudience]) {
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.headers["www-authenticate"]).toContain("Bearer");
    }
  });

  it("rejects an invalid signature and a token whose nbf is in the future", async () => {
    const otherKeyPair = await createDifferentTestKeyPair();
    const invalidSignature = await issueTestToken({ keyPair: otherKeyPair });
    const notYetValid = await issueTestToken({
      notBefore: Math.floor(Date.now() / 1000) + 60
    });

    const badSignatureResponse = await request(app)
      .get("/api/v1/sites")
      .set("Authorization", `Bearer ${invalidSignature}`);
    const notBeforeResponse = await request(app)
      .get("/api/v1/sites")
      .set("Authorization", `Bearer ${notYetValid}`);

    expect(badSignatureResponse.status).toBe(401);
    expect(notBeforeResponse.status).toBe(401);
  });

  it("fails closed when the configured JWKS endpoint is unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("unavailable", { status: 503 }))
    );

    const unavailableIssuerApp = express();
    unavailableIssuerApp.get(
      "/protected",
      createAuthenticationMiddleware({
        configured: true,
        issuer: testIssuer,
        audience: testAudience,
        jwksUrl: "https://offline.test.example/jwks.json",
        algorithms: ["ES256"],
        clockTolerance: 0
      }),
      (_req, res) => res.sendStatus(204)
    );
    const token = await issueTestToken();

    const response = await request(unavailableIssuerApp)
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe("AUTHENTICATION_UNAVAILABLE");
  });

  it("rejects unrecognized actor roles", async () => {
    const token = await issueTestToken({ actorType: "super_admin" });

    const response = await request(app)
      .get("/api/v1/sites")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("AUTHORIZATION_DENIED");
  });

  it("allows a valid national analyst to read business resources", async () => {
    const token = await issueTestToken();

    const response = await request(app)
      .get("/api/v1/sites")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(solarSiteService.getAllSites).toHaveBeenCalledOnce();
  });

  it("allows a device to submit only to its installation", async () => {
    const token = await issueTestToken({
      actorType: "device",
      jurisdiction: undefined,
      installationId
    });

    const allowed = await request(app)
      .post(`/api/v1/sites/${installationId}/generation`)
      .set("Authorization", `Bearer ${token}`)
      .send({ recordedAt: "2026-01-01T00:00:00Z", voltageV: 230, energyKwh: 10, powerKw: 4 });

    const denied = await request(app)
      .post(`/api/v1/sites/${otherInstallationId}/generation`)
      .set("Authorization", `Bearer ${token}`)
      .send({ recordedAt: "2026-01-01T00:00:00Z", powerKw: 4 });

    expect(allowed.status).toBe(201);
    expect(allowed.headers.location).toBe(
      `/api/v1/sites/${installationId}/generation/1`
    );
    expect(solarGenerationService.createGeneration).toHaveBeenCalledOnce();
    expect(denied.status).toBe(403);
    expect(denied.body.error.code).toBe("INSTALLATION_SCOPE_DENIED");
    expect(solarGenerationService.createGeneration).toHaveBeenCalledOnce();
  });

  it("returns a clean 409 response when a reading timestamp is duplicated", async () => {
    solarGenerationService.createGeneration.mockRejectedValue({
      isOperational: true,
      statusCode: 409,
      message: "A generation reading already exists for this installation and timestamp"
    });
    const token = await issueTestToken({
      actorType: "device",
      jurisdiction: undefined,
      installationId
    });

    const response = await request(app)
      .post(`/api/v1/sites/${installationId}/generation`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        recordedAt: "2026-01-01T00:00:00Z",
        voltageV: 230,
        energyKwh: 10,
        powerKw: 4
      });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      success: false,
      error: {
        message: "A generation reading already exists for this installation and timestamp",
        code: "RESOURCE_CONFLICT", details: null
      }
    });
  });

  it("denies devices registry, weather, and read access", async () => {
    const token = await issueTestToken({
      actorType: "device",
      jurisdiction: undefined,
      installationId
    });

    const siteWrite = await request(app)
      .post("/api/v1/sites")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    const weatherWrite = await request(app)
      .post(`/api/v1/sites/${installationId}/weather`)
      .set("Authorization", `Bearer ${token}`)
      .send({});
    const read = await request(app)
      .get("/api/v1/sites")
      .set("Authorization", `Bearer ${token}`);

    expect(siteWrite.status).toBe(403);
    expect(weatherWrite.status).toBe(403);
    expect(read.status).toBe(403);
    expect(solarSiteService.createSite).not.toHaveBeenCalled();
    expect(weatherService.createWeather).not.toHaveBeenCalled();
  });

  it("allows weather recording only to a registry admin with the assigned scope", async () => {
    const scopedAdmin = await issueTestToken({
      actorType: "registry_admin",
      jurisdiction: undefined,
      scopes: ["weather:write"]
    });
    const unscopedAdmin = await issueTestToken({
      actorType: "registry_admin",
      jurisdiction: undefined
    });

    const allowed = await request(app)
      .post(`/api/v1/sites/${installationId}/weather`)
      .set("Authorization", `Bearer ${scopedAdmin}`)
      .send({
        recordedAt: "2026-01-01T00:00:00Z",
        temperatureC: 25
      });
    const denied = await request(app)
      .post(`/api/v1/sites/${installationId}/weather`)
      .set("Authorization", `Bearer ${unscopedAdmin}`)
      .send({
        recordedAt: "2026-01-01T00:00:00Z",
        temperatureC: 25
      });

    expect(allowed.status).toBe(201);
    expect(weatherService.createWeather).toHaveBeenCalledOnce();
    expect(denied.status).toBe(403);
    expect(denied.body.error.code).toBe("WEATHER_WRITE_SCOPE_REQUIRED");
    expect(weatherService.createWeather).toHaveBeenCalledOnce();
  });

  it("keeps analysts read-only and passes assigned jurisdiction to site reads", async () => {
    const analystToken = await issueTestToken();
    const provinceToken = await issueTestToken({
      jurisdiction: {
        level: "province",
        id: installationId
      }
    });

    const write = await request(app)
      .post(`/api/v1/sites/${installationId}/generation`)
      .set("Authorization", `Bearer ${analystToken}`)
      .send({ recordedAt: "2026-01-01T00:00:00Z", powerKw: 1 });
    const regionalRead = await request(app)
      .get("/api/v1/sites")
      .set("Authorization", `Bearer ${provinceToken}`);

    expect(write.status).toBe(403);
    expect(regionalRead.status).toBe(200);
    expect(solarSiteService.getAllSites).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      active: undefined,
      jurisdiction: { level: "province", id: installationId }
    });
    expect(solarGenerationService.createGeneration).not.toHaveBeenCalled();
  });

  it("does not let URL casing bypass device-only ingestion or weather permissions", async () => {
    const admin = await issueTestToken({ actorType: "registry_admin", jurisdiction: undefined });
    const analyst = await issueTestToken();
    for (const token of [admin, analyst]) {
      for (const suffix of ["generation", "GENERATION", "Generation/"]) {
        const response = await request(app).post(`/api/v1/SITES/${installationId}/${suffix}`)
          .set("Authorization", `Bearer ${token}`).send({});
        expect(response.status).toBe(403);
      }
    }
    const weather = await request(app).post(`/api/v1/SITES/${installationId}/WEATHER`)
      .set("Authorization", `Bearer ${admin}`).send({});
    expect(weather.status).toBe(403);
    expect(weatherService.createWeather).not.toHaveBeenCalled();
    expect(solarGenerationService.createGeneration).not.toHaveBeenCalled();
  });

  it("authorizes HEAD as a read and requires explicit read permission for administrators", async () => {
    const analyst = await issueTestToken();
    const admin = await issueTestToken({ actorType: "registry_admin", jurisdiction: undefined, scopes: ["installations:manage"] });
    const device = await issueTestToken({ actorType: "device", jurisdiction: undefined, installationId });
    for (const [token, status] of [[analyst, 200], [admin, 403], [device, 403]]) {
      const response = await request(app).head('/api/v1/sites').set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(status);
      expect(response.text).toBeUndefined();
    }
  });

  it("returns an Allow header for unsupported methods on a known resource", async () => {
    const token = await issueTestToken();
    const response = await request(app).patch(`/api/v1/sites/${installationId}`)
      .set('Authorization', `Bearer ${token}`).send({});
    expect(response.status).toBe(405);
    expect(response.headers.allow).toBe('GET, HEAD, PUT, DELETE');
  });

  it("allows registry creation and authorizes history-preserving deletion", async () => {
    const token = await issueTestToken({
      actorType: "registry_admin",
      jurisdiction: undefined
    });

    const created = await request(app)
      .post("/api/v1/sites")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Test Site", capacityKw: 20, substationId: installationId, meterInverterId: "TEST-METER" });
    const deleted = await request(app)
      .delete(`/api/v1/sites/${installationId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(created.status).toBe(201);
    expect(solarSiteService.createSite).toHaveBeenCalledOnce();
    expect(deleted.status).toBe(204);
    expect(solarSiteService.deleteSite).toHaveBeenCalledOnce();
  });
});
