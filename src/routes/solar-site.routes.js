import { authorizeSiteRequest } from "../middleware/authorization.middleware.js";
import { methodNotAllowed } from "../middleware/method-not-allowed.middleware.js";
import { getOverview } from "../controllers/analytics.controller.js";
import { Router } from "express";

import {
  getSites,
  getSite,
  createSite,
  updateSite,
  deleteSite
} from "../controllers/solar-site.controller.js";

import { validate } from "../middleware/validate.middleware.js";

import {
  createSolarSiteSchema,
  updateSolarSiteSchema,
  getSolarSiteSchema,
  deleteSolarSiteSchema,
  listSolarSitesSchema
} from "../validators/solar-site.validator.js";

const router = Router();
router.get("/:id/overview", authorizeSiteRequest, validate(getSolarSiteSchema), getOverview);

/**
 * @openapi
 * /api/v1/sites:
 *   get:
 *     tags:
 *       - Solar Sites
 *     summary: Get solar sites
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of solar sites
 */
router.get(
  "/",
  authorizeSiteRequest, validate(listSolarSitesSchema),
  getSites
);

/**
 * @openapi
 * /api/v1/sites:
 *   post:
 *     tags:
 *       - Solar Sites
 *     summary: Create a solar site
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSolarSite'
 *     responses:
 *       201:
 *         description: Solar site created
 *       400:
 *         description: Validation failed
 */
router.post(
  "/",
  authorizeSiteRequest, validate(createSolarSiteSchema),
  createSite
);

/**
 * @openapi
 * /api/v1/sites/{id}:
 *   get:
 *     tags:
 *       - Solar Sites
 *     summary: Get a solar site
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Solar site
 *       404:
 *         description: Solar site not found
 */
router.get(
  "/:id",
  authorizeSiteRequest, validate(getSolarSiteSchema),
  getSite
);

/**
 * @openapi
 * /api/v1/sites/{id}:
 *   put:
 *     tags:
 *       - Solar Sites
 *     summary: Update a solar site
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSolarSite'
 *     responses:
 *       200:
 *         description: Solar site updated
 *       400:
 *         description: Validation failed
 *       404:
 *         description: Solar site not found
 */
router.put(
  "/:id",
  authorizeSiteRequest, validate(updateSolarSiteSchema),
  updateSite
);

/**
 * @openapi
 * /api/v1/sites/{id}:
 *   delete:
 *     tags:
 *       - Solar Sites
 *     summary: Delete a solar site
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Solar site deleted
 *       404:
 *         description: Solar site not found
 */
router.delete(
  "/:id",
  authorizeSiteRequest, validate(deleteSolarSiteSchema),
  deleteSite
);

router.all("/", methodNotAllowed("GET, HEAD, POST"));
router.all("/:id/overview", methodNotAllowed("GET, HEAD"));
router.all("/:id", methodNotAllowed("GET, HEAD, PUT, DELETE"));

export default router;
