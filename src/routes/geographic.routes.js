import { Router } from "express";
import {
  getDistrict,
  getDistrictSubstations,
  getProvince,
  getProvinceDistricts,
  getProvinces,
  getSubstation,
  getSubstationInstallations
} from "../controllers/geographic.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { authenticate } from "../middleware/authentication.middleware.js";
import { authorizeSiteRequest } from "../middleware/authorization.middleware.js";
import {
  getDistrictSchema,
  getProvinceSchema,
  getSubstationSchema,
  listDistrictSubstationsSchema,
  listProvinceDistrictsSchema,
  listProvincesSchema,
  listSubstationInstallationsSchema
} from "../validators/geographic.validator.js";

const router = Router();

/**
 * @openapi
 * /api/v1/provinces:
 *   get:
 *     tags: [Geography]
 *     summary: List provinces visible to the authenticated jurisdiction
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *     responses:
 *       200:
 *         description: Scoped, paginated province collection
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ProvinceCollection' }
 *         headers:
 *           ETag:
 *             schema: { type: string }
 *       304: { description: Representation is current; body is empty }
 *       401: { description: Missing or invalid bearer token }
 *       403: { description: Caller cannot read geographic resources }
 */
router.get("/provinces", authenticate, authorizeSiteRequest, validate(listProvincesSchema), getProvinces);

/**
 * @openapi
 * /api/v1/provinces/{id}:
 *   get:
 *     tags: [Geography]
 *     summary: Get a province within the caller's jurisdiction
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Province resource
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ProvinceResponse' }
 *         headers:
 *           ETag:
 *             schema: { type: string }
 *       304: { description: Representation is current; body is empty }
 *       404: { description: Province not found in this jurisdiction }
 */
router.get("/provinces/:id", authenticate, authorizeSiteRequest, validate(getProvinceSchema), getProvince);

/**
 * @openapi
 * /api/v1/provinces/{id}/districts:
 *   get:
 *     tags: [Geography]
 *     summary: List districts within a province
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *     responses:
 *       200:
 *         description: Scoped, paginated district collection
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DistrictCollection' }
 *         headers:
 *           ETag:
 *             schema: { type: string }
 *       304: { description: Representation is current; body is empty }
 *       404: { description: Province not found in this jurisdiction }
 */
router.get(
  "/provinces/:id/districts",
  authenticate,
  authorizeSiteRequest,
  validate(listProvinceDistrictsSchema),
  getProvinceDistricts
);

/**
 * @openapi
 * /api/v1/districts/{id}:
 *   get:
 *     tags: [Geography]
 *     summary: Get a district within the caller's jurisdiction
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: District resource
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DistrictResponse' }
 *         headers:
 *           ETag:
 *             schema: { type: string }
 *       304: { description: Representation is current; body is empty }
 *       404: { description: District not found in this jurisdiction }
 */
router.get("/districts/:id", authenticate, authorizeSiteRequest, validate(getDistrictSchema), getDistrict);

/**
 * @openapi
 * /api/v1/districts/{id}/substations:
 *   get:
 *     tags: [Geography]
 *     summary: List substations within a district
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *     responses:
 *       200:
 *         description: Scoped, paginated substation collection
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SubstationCollection' }
 *         headers:
 *           ETag:
 *             schema: { type: string }
 *       304: { description: Representation is current; body is empty }
 *       404: { description: District not found in this jurisdiction }
 */
router.get(
  "/districts/:id/substations",
  authenticate,
  authorizeSiteRequest,
  validate(listDistrictSubstationsSchema),
  getDistrictSubstations
);

/**
 * @openapi
 * /api/v1/substations/{id}:
 *   get:
 *     tags: [Geography]
 *     summary: Get a substation within the caller's jurisdiction
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Grid substation resource
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SubstationResponse' }
 *         headers:
 *           ETag:
 *             schema: { type: string }
 *       304: { description: Representation is current; body is empty }
 *       404: { description: Substation not found in this jurisdiction }
 */
router.get("/substations/:id", authenticate, authorizeSiteRequest, validate(getSubstationSchema), getSubstation);

/**
 * @openapi
 * /api/v1/substations/{id}/installations:
 *   get:
 *     tags: [Geography]
 *     summary: List installations connected to a substation
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *     responses:
 *       200:
 *         description: Scoped, paginated installation collection
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/InstallationCollection' }
 *         headers:
 *           ETag:
 *             schema: { type: string }
 *       304: { description: Representation is current; body is empty }
 *       404: { description: Substation not found in this jurisdiction }
 */
router.get(
  "/substations/:id/installations",
  authenticate,
  authorizeSiteRequest,
  validate(listSubstationInstallationsSchema),
  getSubstationInstallations
);

export default router;
