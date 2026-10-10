import { Router } from "express";

import healthRoutes from "./health.routes.js";
import solarSiteRoutes from "./solar-site.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/sites", solarSiteRoutes);

export default router;