import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { issueTestToken } from "./helpers/auth-test-support.js";

vi.mock("../src/services/geographic.service.js", () => ({
  getProvinces: vi.fn(),
  getProvinceById: vi.fn(),
  getDistrictsByProvince: vi.fn(),
  getDistrictById: vi.fn(),
  getSubstationsByDistrict: vi.fn(),
  getSubstationById: vi.fn(),
  getInstallationsBySubstation: vi.fn()
}));

vi.mock("../src/services/solar-generation.service.js", () => ({
  createGeneration: vi.fn(),
  getGeneration: vi.fn(),
  getGenerationById: vi.fn(),
  getLatestGeneration: vi.fn()
}));

import app from "../src/app.js";
import * as geographicService from "../src/services/geographic.service.js";
import * as generationService from "../src/services/solar-generation.service.js";
import { swaggerSpec } from "../src/config/swagger.js";

const provinceId = "11111111-1111-4111-8111-111111111111";
const districtId = "22222222-2222-4222-8222-222222222222";
const substationId = "33333333-3333-4333-8333-333333333333";
const siteId = "44444444-4444-4444-8444-444444444444";
const reading = {
  id: 8,
  site_id: siteId,
  recorded_at: "2026-10-12T05:00:00.000Z",
  power_kw: "4.2",
  energy_kwh: "1.05",
  voltage_v: "230",
  created_at: "2026-10-12T05:01:00.000Z"
};

describe("geographic and latest-generation routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    geographicService.getProvinces.mockResolvedValue({
      data: [{ id: provinceId, code: "WP", name: "Western", created_at: null }],
      total: 2
    });
    geographicService.getProvinceById.mockResolvedValue({
      id: provinceId, code: "WP", name: "Western", created_at: null
    });
    geographicService.getDistrictsByProvince.mockResolvedValue({
      data: [], total: 0
    });
    geographicService.getDistrictById.mockResolvedValue({
      id: districtId,
      code: "COL",
      name: "Colombo",
      province_id: provinceId,
      province_code: "WP",
      province_name: "Western",
      created_at: null
    });
    geographicService.getSubstationsByDistrict.mockResolvedValue({
      data: [], total: 0
    });
    geographicService.getSubstationById.mockResolvedValue({
      id: substationId,
      code: "DEMO-SUB-COL-01",
      name: "Colombo demo",
      latitude: "6.9",
      longitude: "79.8",
      voltage_kv: "33",
      is_active: true,
      district_id: districtId,
      district_name: "Colombo",
      province_id: provinceId,
      province_name: "Western",
      province_code: "WP",
      created_at: null
    });
    geographicService.getInstallationsBySubstation.mockResolvedValue({
      data: [], total: 0
    });
    generationService.getLatestGeneration.mockResolvedValue(reading);
  });

  it("paginates the province collection and forwards the analyst jurisdiction", async () => {
    const jurisdiction = { level: "province", id: provinceId };
    const token = await issueTestToken({ jurisdiction });
    const response = await request(app)
      .get("/api/v1/provinces?page=1&limit=1")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data[0]).toMatchObject({
      id: provinceId, code: "WP", name: "Western"
    });
    expect(response.body.pagination).toEqual({
      page: 1,
      limit: 1,
      total: 2,
      totalPages: 2,
      next: "/api/v1/provinces?page=2&limit=1",
      previous: null
    });
    expect(geographicService.getProvinces).toHaveBeenCalledWith({
      page: 1, limit: 1, jurisdiction
    });
  });

  it("mounts all requested hierarchy resources and passes scope to each read", async () => {
    const jurisdiction = { level: "district", id: districtId };
    const token = await issueTestToken({ jurisdiction });
    const auth = { Authorization: `Bearer ${token}` };
    const paths = [
      `/api/v1/provinces/${provinceId}`,
      `/api/v1/provinces/${provinceId}/districts`,
      `/api/v1/districts/${districtId}`,
      `/api/v1/districts/${districtId}/substations`,
      `/api/v1/substations/${substationId}`,
      `/api/v1/substations/${substationId}/installations`
    ];

    for (const path of paths) {
      expect((await request(app).get(path).set(auth)).status).toBe(200);
    }

    expect(geographicService.getProvinceById).toHaveBeenCalledWith(
      provinceId, jurisdiction
    );
    expect(geographicService.getDistrictsByProvince).toHaveBeenCalledWith(
      provinceId, { page: 1, limit: 20 }, jurisdiction
    );
    expect(geographicService.getDistrictById).toHaveBeenCalledWith(
      districtId, jurisdiction
    );
    expect(geographicService.getSubstationsByDistrict).toHaveBeenCalledWith(
      districtId, { page: 1, limit: 20 }, jurisdiction
    );
    expect(geographicService.getSubstationById).toHaveBeenCalledWith(
      substationId, jurisdiction
    );
    expect(geographicService.getInstallationsBySubstation).toHaveBeenCalledWith(
      substationId, { page: 1, limit: 20 }, jurisdiction
    );
  });

  it("matches the latest-reading route before the numeric reading-ID route", async () => {
    const jurisdiction = { level: "district", id: districtId };
    const token = await issueTestToken({ jurisdiction });
    const response = await request(app)
      .get(`/api/v1/sites/${siteId}/generation/latest`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: 8, siteId, powerKw: 4.2, energyKwh: 1.05, voltageV: 230
    });
    expect(response.headers.etag).toBeTruthy();
    expect(generationService.getLatestGeneration).toHaveBeenCalledWith(
      siteId, jurisdiction
    );
    expect(generationService.getGenerationById).not.toHaveBeenCalled();
  });

  it("returns an empty 304 response when a scoped collection ETag is current", async () => {
    const token = await issueTestToken({
      jurisdiction: { level: "province", id: provinceId }
    });
    const first = await request(app)
      .get("/api/v1/provinces")
      .set("Authorization", `Bearer ${token}`);
    const cached = await request(app)
      .get("/api/v1/provinces")
      .set("Authorization", `Bearer ${token}`)
      .set("If-None-Match", first.headers.etag);

    expect(first.headers["cache-control"]).toContain("private");
    expect(cached.status).toBe(304);
    expect(cached.text).toBe("");
  });

  it("documents all new paths in the generated OpenAPI specification", () => {
    for (const path of [
      "/api/v1/provinces",
      "/api/v1/provinces/{id}",
      "/api/v1/provinces/{id}/districts",
      "/api/v1/districts/{id}",
      "/api/v1/districts/{id}/substations",
      "/api/v1/substations/{id}",
      "/api/v1/substations/{id}/installations",
      "/api/v1/sites/{siteId}/generation/latest"
    ]) {
      expect(swaggerSpec.paths[path]?.get).toBeDefined();
    }
  });

  it("denies unauthenticated and device reads of geographic resources", async () => {
    const unauthenticated = await request(app).get("/api/v1/provinces");
    const deviceToken = await issueTestToken({
      actorType: "device",
      jurisdiction: undefined,
      installationId: siteId
    });
    const deviceRead = await request(app)
      .get(`/api/v1/districts/${districtId}`)
      .set("Authorization", `Bearer ${deviceToken}`);

    expect(unauthenticated.status).toBe(401);
    expect(deviceRead.status).toBe(403);
    expect(geographicService.getProvinces).not.toHaveBeenCalled();
  });
});
