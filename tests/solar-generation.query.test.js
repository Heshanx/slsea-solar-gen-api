import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { issueTestToken } from "./helpers/auth-test-support.js";

vi.mock("../src/services/solar-generation.service.js", () => ({
  getGeneration: vi.fn(),
  getLatestGeneration: vi.fn()
}));

import app from "../src/app.js";
import * as solarGenerationService from "../src/services/solar-generation.service.js";

const siteId = "11111111-1111-4111-8111-111111111111";

describe("Solar generation query semantics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    solarGenerationService.getGeneration.mockResolvedValue({
      data: [],
      total: 0
    });
  });

  it("passes ascending sort and filters through and returns page links", async () => {
    solarGenerationService.getGeneration.mockResolvedValue({
      data: [],
      total: 5
    });

    const response = await request(app).get(
      `/api/v1/sites/${siteId}/generation?page=2&limit=2&sort=asc&from=2026-01-01T00%3A00%3A00Z&to=2026-01-02T00%3A00%3A00Z`
    ).set("Authorization", `Bearer ${await issueTestToken()}`);

    expect(response.status).toBe(200);
    expect(solarGenerationService.getGeneration).toHaveBeenCalledWith(
      siteId,
      {
        page: 2,
        limit: 2,
        sort: "asc",
        from: "2026-01-01T00:00:00Z",
        to: "2026-01-02T00:00:00Z"
      },
      { level: "national" }
    );
    expect(response.body.pagination).toEqual({
      page: 2,
      limit: 2,
      total: 5,
      totalPages: 3,
      next: `/api/v1/sites/${siteId}/generation?page=3&limit=2&sort=asc&from=2026-01-01T00%3A00%3A00Z&to=2026-01-02T00%3A00%3A00Z`,
      previous: `/api/v1/sites/${siteId}/generation?page=1&limit=2&sort=asc&from=2026-01-01T00%3A00%3A00Z&to=2026-01-02T00%3A00%3A00Z`
    });
  });

  it("defaults to descending order and has no links for an empty result", async () => {
    const response = await request(app).get(
      `/api/v1/sites/${siteId}/generation`
    ).set("Authorization", `Bearer ${await issueTestToken()}`);

    expect(response.status).toBe(200);
    expect(solarGenerationService.getGeneration).toHaveBeenCalledWith(
      siteId,
      {
        page: 1,
        limit: 50,
        from: undefined,
        to: undefined,
        sort: "desc"
      },
      { level: "national" }
    );
    expect(response.body.pagination).toEqual({
      page: 1,
      limit: 50,
      total: 0,
      totalPages: 0,
      next: null,
      previous: null
    });
  });

  it("rejects an unsupported sort value", async () => {
    const response = await request(app).get(
      `/api/v1/sites/${siteId}/generation?sort=random`
    ).set("Authorization", `Bearer ${await issueTestToken()}`);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(
      response.body.error.details.validationErrors.some(
        (error) => error.field === "query.sort"
      )
    ).toBe(true);
    expect(solarGenerationService.getGeneration).not.toHaveBeenCalled();
  });

  it("returns 304 with an empty body when the ETag is current", async () => {
    const first = await request(app).get(
      `/api/v1/sites/${siteId}/generation`
    ).set("Authorization", `Bearer ${await issueTestToken()}`);
    expect(first.status).toBe(200);
    expect(first.headers.etag).toBeTruthy();

    const cached = await request(app).get(
      `/api/v1/sites/${siteId}/generation`
    )
      .set("Authorization", `Bearer ${await issueTestToken()}`)
      .set("If-None-Match", first.headers.etag);

    expect(cached.status).toBe(304);
    expect(cached.text).toBe("");
  });
});
