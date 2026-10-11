import { Router } from "express";

import healthRoutes from "./health.routes.js";
import solarSiteRoutes from "./solar-site.routes.js";
import solarGenerationRoutes from "./solar-generation.routes.js";
import weatherRoutes from "./weather.routes.js";
import { authenticate } from "../middleware/authentication.middleware.js";
import { authorizeSiteRequest } from "../middleware/authorization.middleware.js";

const router = Router();
const authenticatedSiteRoutes = Router();

router.use("/health", healthRoutes);

authenticatedSiteRoutes.use(authenticate, authorizeSiteRequest);
authenticatedSiteRoutes.use(weatherRoutes);
authenticatedSiteRoutes.use(solarGenerationRoutes);
authenticatedSiteRoutes.use(solarSiteRoutes);

router.use("/sites", authenticatedSiteRoutes);


export default router;
