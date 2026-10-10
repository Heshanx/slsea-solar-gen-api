
import { Router } from "express";

import {
  createGeneration,
  getGeneration,
  getGenerationById
} from "../controllers/solar-generation.controller.js";

import { validate } from "../middleware/validate.middleware.js";

import {
  createSolarGenerationSchema,
  listSolarGenerationSchema,
  getSolarGenerationSchema
} from "../validators/solar-generation.validator.js";

const router = Router();

/**
 * @openapi
 * /api/v1/sites/{siteId}/generation:
 *   post:
 *     tags:
 *       - Solar Generation
 *     summary: Record solar generation for a site
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSolarGeneration'
 *     responses:
 *       201:
 *         description: Generation record created
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Solar site not found
 */
router.post(
  "/:siteId/generation",
  validate(createSolarGenerationSchema),
  createGeneration
);

/**
 * @openapi
 * /api/v1/sites/{siteId}/generation:
 *   get:
 *     tags:
 *       - Solar Generation
 *     summary: List generation records for a solar site
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *       - in: query
 *         name: from
 *         description: Start timestamp, inclusive
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: to
 *         description: End timestamp, inclusive
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Generation records returned
 *       400:
 *         description: Invalid query parameters
 *       404:
 *         description: Solar site not found
 */
router.get(
  "/:siteId/generation",
  validate(listSolarGenerationSchema),
  getGeneration
);

/**
 * @openapi
 * /api/v1/sites/{siteId}/generation/{id}:
 *   get:
 *     tags:
 *       - Solar Generation
 *     summary: Get a generation record by ID
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       200:
 *         description: Generation record returned
 *       400:
 *         description: Invalid path parameters
 *       404:
 *         description: Site or generation record not found
 */
router.get(
  "/:siteId/generation/:id",
  validate(getSolarGenerationSchema),
  getGenerationById
);

export default router;
