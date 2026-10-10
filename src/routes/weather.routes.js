
import { Router } from "express";

import {
  createWeather,
  getWeather,
  getWeatherById
} from "../controllers/weather.controller.js";

import { validate } from "../middleware/validate.middleware.js";

import {
  createWeatherSchema,
  listWeatherSchema,
  getWeatherSchema
} from "../validators/weather.validator.js";

const router = Router();

/**
 * @openapi
 * /api/v1/sites/{siteId}/weather:
 *   post:
 *     tags:
 *       - Weather
 *     summary: Record weather observations for a solar site
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
 *             $ref: '#/components/schemas/CreateWeather'
 *     responses:
 *       201:
 *         description: Weather observation created
 *       400:
 *         description: Invalid weather data
 *       404:
 *         description: Solar site not found
 */
router.post(
  "/:siteId/weather",
  validate(createWeatherSchema),
  createWeather
);

/**
 * @openapi
 * /api/v1/sites/{siteId}/weather:
 *   get:
 *     tags:
 *       - Weather
 *     summary: List weather observations for a solar site
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
 *         description: Weather observations returned
 *       400:
 *         description: Invalid query parameters
 *       404:
 *         description: Solar site not found
 */
router.get(
  "/:siteId/weather",
  validate(listWeatherSchema),
  getWeather
);

/**
 * @openapi
 * /api/v1/sites/{siteId}/weather/{id}:
 *   get:
 *     tags:
 *       - Weather
 *     summary: Get a weather observation by ID
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
 *         description: Weather observation returned
 *       400:
 *         description: Invalid path parameters
 *       404:
 *         description: Site or observation not found
 */
router.get(
  "/:siteId/weather/:id",
  validate(getWeatherSchema),
  getWeatherById
);

export default router;
