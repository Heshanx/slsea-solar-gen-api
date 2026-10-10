import { rateLimit } from "express-rate-limit";

export const createApiRateLimiter = (options = {}) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,

    // Don't count health checks or Swagger documentation.
    skip: (req) =>
      req.path === "/health" ||
      req.path === "/health/database" ||
      req.path.startsWith("/docs"),

    handler: (req, res) =>
      res.status(429).json({
        success: false,
        error: {
          message: "Too many requests. Please try again later."
        }
      }),

    ...options
  });

export const apiRateLimiter = createApiRateLimiter();