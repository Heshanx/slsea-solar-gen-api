import { describe, it, expect } from "vitest";
import request from "supertest";

import app from "../src/app.js";

describe("API health endpoints", () => {
  it("GET / should return the API information", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe(
      "SLSEA Solar Generation API"
    );
    expect(response.body.documentation).toBe("/api/v1/docs");
  });

  it("GET /api/v1/health should return healthy status", async () => {
    const response = await request(app).get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe("healthy");
    expect(response.body.data.service).toBe(
      "SLSEA Solar Generation API"
    );
    expect(response.body.data.version).toBe("1.0.0");
    expect(response.body.data.timestamp).toBeDefined();

    expect(
      Number.isNaN(Date.parse(response.body.data.timestamp))
    ).toBe(false);
  });

  it("should return a consistent 404 response for an unknown route", async () => {
    const response = await request(app).get(
      "/api/v1/route-that-does-not-exist"
    );

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.message).toBeDefined();
  });

  it("should return 400 for malformed JSON", async () => {
    const response = await request(app)
      .post("/api/v1/sites")
      .set("Content-Type", "application/json")
      .send('{"name":');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toBe(
      "Invalid JSON request body"
    );
  });

  it("should return 413 for an oversized JSON body", async () => {
    const response = await request(app)
      .post("/api/v1/sites")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ payload: "x".repeat(110 * 1024) }));

    expect(response.status).toBe(413);
    expect(response.body.success).toBe(false);
    expect(response.body.error.message).toBe(
      "Request body too large"
    );
  });
});
