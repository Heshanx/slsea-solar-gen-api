import { Router } from "express";

import healthRoutes from "./health.routes.js";
import solarSiteRoutes from "./solar-site.routes.js";
import solarGenerationRoutes from "./solar-generation.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/sites", solarSiteRoutes);
router.use("/sites", solarGenerationRoutes);

export default router;