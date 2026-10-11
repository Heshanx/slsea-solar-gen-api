import { Router } from "express";

import analyticsRoutes from "./analytics.routes.js";
import healthRoutes from "./health.routes.js";
import solarSiteRoutes from "./solar-site.routes.js";
import solarGenerationRoutes from "./solar-generation.routes.js";
import weatherRoutes from "./weather.routes.js";
import geographicRoutes from "./geographic.routes.js";
import { authenticate } from "../middleware/authentication.middleware.js";

const router = Router();
const authenticatedSiteRoutes = Router();

router.use("/health", healthRoutes);

authenticatedSiteRoutes.use(authenticate);
authenticatedSiteRoutes.use(weatherRoutes);
authenticatedSiteRoutes.use(solarGenerationRoutes);
authenticatedSiteRoutes.use(solarSiteRoutes);

router.use("/sites", authenticatedSiteRoutes);
router.use(geographicRoutes);
router.use(analyticsRoutes);


export default router;
