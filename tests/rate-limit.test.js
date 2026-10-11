import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApiRateLimiter } from "../src/middleware/rate-limit.middleware.js";

describe("API rate limiter", () => {
  it("returns 429 when the request limit is exceeded", async () => {
    const app = express();

    app.use(
      createApiRateLimiter({
        windowMs: 60_000,
        limit: 2,
        skip: () => false
      })
    );

    app.get("/test", (req, res) => {
      res.status(200).json({ success: true });
    });

    const first = await request(app).get("/test");
    const second = await request(app).get("/test");
    const third = await request(app).get("/test");

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(third.status).toBe(429);
    expect(third.body.success).toBe(false);
    expect(third.body.error.message).toMatch(/too many requests/i);
  });
});