import { Router } from "express";

import healthRoutes from "./health.routes.js";
import solarSiteRoutes from "./solar-site.routes.js";
import solarGenerationRoutes from "./solar-generation.routes.js";
import weatherRoutes from "./weather.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/sites", weatherRoutes);
router.use("/sites", solarGenerationRoutes);
router.use("/sites", solarSiteRoutes);


export default router;