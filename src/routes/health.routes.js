import { Router } from "express";

import { getHealth } from "../controllers/health.controller.js";
import { getDatabaseHealth } from "../controllers/database.controller.js";

const router = Router();

/**
 * @openapi
 * /api/v1/health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Check API health
 *     responses:
 *       200:
 *         description: API is healthy
 */
router.get("/", getHealth);

/**
 * @openapi
 * /api/v1/health/database:
 *   get:
 *     tags:
 *       - Health
 *     summary: Check database connectivity
 *     responses:
 *       200:
 *         description: Database connection is healthy
 *       500:
 *         description: Database connection failed
 */
router.get("/database", getDatabaseHealth);

export default router;