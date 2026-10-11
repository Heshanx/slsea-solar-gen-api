import { Router } from "express";
import { authenticate } from "../middleware/authentication.middleware.js";
import { authorizeSiteRequest } from "../middleware/authorization.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { readingsSchema } from "../validators/analytics.validator.js";
import { getDistrictSchema } from "../validators/geographic.validator.js";
import { getReadings, getDistrictSummary } from "../controllers/analytics.controller.js";
const router = Router();
router.get('/readings', authenticate, authorizeSiteRequest, validate(readingsSchema), getReadings);
router.get('/districts/:id/generation-summary', authenticate, authorizeSiteRequest,
 validate(getDistrictSchema), getDistrictSummary);
export default router;
