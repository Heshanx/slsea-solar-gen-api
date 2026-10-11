import { authorizeSiteRequest } from "../middleware/authorization.middleware.js";
import { methodNotAllowed } from "../middleware/method-not-allowed.middleware.js";

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

import {
  getWeatherForecast
} from "../controllers/weather-provider.controller.js";

import {
  getWeatherForecastSchema
} from "../validators/weather-provider.validator.js";

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
  authorizeSiteRequest, validate(createWeatherSchema),
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

/**
 * @swagger
 * /api/v1/sites/{siteId}/weather/forecast:
 *   get:
 *     summary: Get hourly weather forecast for a solar site
 *     description: >
 *       Retrieves a 48-hour weather forecast from Open-Meteo.
 *       These are model-derived forecast values, not measured observations.
 *       Timestamps are returned in UTC.
 *     tags:
 *       - Weather
 *     parameters:
 *       - in: path
 *         name: siteId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Solar site UUID
 *     responses:
 *       200:
 *         description: Hourly weather forecast retrieved successfully
 *       400:
 *         description: Invalid site ID or site coordinates
 *       404:
 *         description: Solar site not found
 *       502:
 *         description: Weather provider unavailable or returned an invalid response
 */

router.get(
  "/:siteId/weather/forecast",
  authorizeSiteRequest, validate(getWeatherForecastSchema),
  getWeatherForecast
);

router.get(
  "/:siteId/weather",
  authorizeSiteRequest, validate(listWeatherSchema),
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
  authorizeSiteRequest, validate(getWeatherSchema),
  getWeatherById
);

router.all("/:siteId/weather", methodNotAllowed("GET, HEAD, POST"));
router.all(["/:siteId/weather/forecast", "/:siteId/weather/:id"], methodNotAllowed("GET, HEAD"));

export default router;
