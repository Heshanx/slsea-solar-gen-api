import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import routes from "./routes/index.js";
import docsRoutes from "./routes/docs.routes.js";
import { notFound } from "./middleware/not-found.middleware.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { env } from "./config/env.js";

const app = express();

app.disable("x-powered-by");

app.use(
  cors({
    origin: env.corsOrigin
  })
);

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (env.nodeEnv !== "test") {
  app.use(morgan("dev"));
}

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "SLSEA Solar Generation API",
    documentation: `/api/${env.apiVersion}/docs`
  });
});

app.use(`/api/${env.apiVersion}`, routes);
app.use(`/api/${env.apiVersion}/docs`, docsRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;