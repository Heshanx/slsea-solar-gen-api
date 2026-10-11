import { authorizeSiteRequest } from "../middleware/authorization.middleware.js";
import { methodNotAllowed } from "../middleware/method-not-allowed.middleware.js";

import { Router } from "express";

import {
  createGeneration,
  getGeneration,
  getGenerationById,
  getLatestGeneration
} from "../controllers/solar-generation.controller.js";

import { validate } from "../middleware/validate.middleware.js";

import {
  createSolarGenerationSchema,
  listSolarGenerationSchema,
  getSolarGenerationSchema,
  getLatestSolarGenerationSchema
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
 *         description: Generation record created; Location identifies the new record
 *         headers:
 *           Location:
 *             schema:
 *               type: string
 *             description: Relative URL of the created generation record
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Missing or invalid bearer token
 *       403:
 *         description: Caller is not authorized for this installation
 *       409:
 *         description: A reading already exists for this installation and timestamp
 *       404:
 *         description: Solar site not found
 */
router.post(
  "/:siteId/generation",
  authorizeSiteRequest, validate(createSolarGenerationSchema),
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
 *       - in: query
 *         name: sort
 *         description: Sort by recorded timestamp; ties are ordered by reading ID
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Generation records returned
 *         headers:
 *           ETag:
 *             schema:
 *               type: string
 *             description: Validator for this page; send it in If-None-Match
 *       304:
 *         description: The cached representation is current; response body is empty
 *       400:
 *         description: Invalid query parameters
 *       404:
 *         description: Solar site not found
 *       401:
 *         description: Missing or invalid bearer token
 *       403:
 *         description: Caller is not authorized for this installation
 */
router.get(
  "/:siteId/generation",
  authorizeSiteRequest, validate(listSolarGenerationSchema),
  getGeneration
);

/**
 * @openapi
 * /api/v1/sites/{siteId}/generation/latest:
 *   get:
 *     tags: [Solar Generation]
 *     summary: Get the latest generation reading for a site
 *     description: Returns the reading with the greatest recordedAt value, with ID as a stable tie-breaker. Regional callers can read only sites in their assigned jurisdiction.
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Latest generation reading
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/GenerationResponse' }
 *         headers:
 *           ETag:
 *             schema: { type: string }
 *       304: { description: Representation is current; response body is empty }
 *       404: { description: Site is outside the caller's scope or has no readings }
 *       401: { description: Missing or invalid bearer token }
 */
router.get(
  "/:siteId/generation/latest",
  authorizeSiteRequest, validate(getLatestSolarGenerationSchema),
  getLatestGeneration
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
  authorizeSiteRequest, validate(getSolarGenerationSchema),
  getGenerationById
);

router.all("/:siteId/generation", methodNotAllowed("GET, HEAD, POST"));
router.all(["/:siteId/generation/latest", "/:siteId/generation/:id"], methodNotAllowed("GET, HEAD"));

export default router;
