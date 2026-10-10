import { describe, it, expect } from "vitest";
import request from "supertest";
import { listSolarSitesSchema } from "../src/validators/solar-site.validator.js";

import app from "../src/app.js";

describe("Solar site request validation", () => {
  it("should reject an invalid site UUID", async () => {
    const response = await request(app).get(
      "/api/v1/sites/not-a-uuid"
    );

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toBe("Validation failed");

    const errors =
      response.body.error.details.validationErrors;

    expect(
      errors.some((error) => error.field === "params.id")
    ).toBe(true);
  });

  it("should reject a create request with missing required fields", async () => {
    const response = await request(app)
      .post("/api/v1/sites")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toBe("Validation failed");

    const errors =
      response.body.error.details.validationErrors;

    expect(
      errors.some((error) => error.field === "body.name")
    ).toBe(true);

    expect(
      errors.some((error) => error.field === "body.capacityKw")
    ).toBe(true);
  });

  it("should reject coordinates outside the valid range", async () => {
    const response = await request(app)
      .post("/api/v1/sites")
      .send({
        name: "Automated Test Site",
        latitude: 91,
        longitude: 80,
        capacityKw: 100,
        timezone: "Asia/Colombo"
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);

    const errors =
      response.body.error.details.validationErrors;

    expect(
      errors.some((error) => error.field === "body.latitude")
    ).toBe(true);
  });

    it("should reject a page number below 1", async () => {
    const response = await request(app)
      .get("/api/v1/sites?page=0&limit=20");

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toBe("Validation failed");

    const errors =
      response.body.error.details.validationErrors;

    expect(
      errors.some((error) => error.field === "query.page")
    ).toBe(true);
  });

  it("should reject a page limit greater than 100", async () => {
    const response = await request(app)
      .get("/api/v1/sites?page=1&limit=101");

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);

    const errors =
      response.body.error.details.validationErrors;

    expect(
      errors.some((error) => error.field === "query.limit")
    ).toBe(true);
  });

  it("should apply default pagination values", () => {
    const result = listSolarSitesSchema.safeParse({
      body: {},
      params: {},
      query: {}
    });

    expect(result.success).toBe(true);
    expect(result.data.query.page).toBe(1);
    expect(result.data.query.limit).toBe(20);
  });
});