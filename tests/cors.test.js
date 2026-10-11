import { describe, it, expect } from "vitest";
import request from "supertest";

import app from "../src/app.js";

describe("Public API CORS policy", () => {
  it("should allow browser requests from any origin", async () => {
    const response = await request(app)
      .get("/api/v1/health")
      .set("Origin", "https://example-client.test");

    expect(response.status).toBe(200);
    expect(
      response.headers["access-control-allow-origin"]
    ).toBe("*");

    // Public wildcard CORS does not enable credentialed requests.
    expect(
      response.headers["access-control-allow-credentials"]
    ).toBeUndefined();
  });

  it("should handle browser preflight requests", async () => {
    const response = await request(app)
      .options("/api/v1/sites")
      .set("Origin", "https://example-client.test")
      .set("Access-Control-Request-Method", "GET")
      .set("Access-Control-Request-Headers", "content-type");

    expect(response.status).toBe(204);
    expect(
      response.headers["access-control-allow-origin"]
    ).toBe("*");
    expect(
      response.headers["access-control-allow-methods"]
    ).toContain("GET");
  });
});