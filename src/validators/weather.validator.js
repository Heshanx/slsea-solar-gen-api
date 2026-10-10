
import { z } from "zod";

const siteIdParam = z.object({
  siteId: z.string().uuid("Invalid solar site ID")
});

const weatherIdParam = z.object({
  siteId: z.string().uuid("Invalid solar site ID"),
  id: z.coerce
    .number()
    .int("Weather ID must be an integer")
    .positive("Weather ID must be positive")
    .safe("Weather ID must be a safe integer")
});

const weatherBody = z
  .object({
    recordedAt: z.string().datetime({
      offset: true,
      message: "recordedAt must be a valid ISO 8601 timestamp with a timezone"
    }),

    temperatureC: z.number().min(-100).max(70).nullable().optional(),

    irradianceWM2: z
      .number()
      .min(0, "Irradiance cannot be negative")
      .max(2000, "Irradiance exceeds the accepted limit")
      .nullable()
      .optional(),

    cloudCoverPercent: z
      .number()
      .min(0, "Cloud cover must be between 0 and 100")
      .max(100, "Cloud cover must be between 0 and 100")
      .nullable()
      .optional(),

    windSpeedMs: z
      .number()
      .min(0, "Wind speed cannot be negative")
      .max(150, "Wind speed exceeds the accepted limit")
      .nullable()
      .optional(),

    humidityPercent: z
      .number()
      .min(0, "Humidity must be between 0 and 100")
      .max(100, "Humidity must be between 0 and 100")
      .nullable()
      .optional()
  })
  .refine(
    (data) =>
      data.temperatureC != null ||
      data.irradianceWM2 != null ||
      data.cloudCoverPercent != null ||
      data.windSpeedMs != null ||
      data.humidityPercent != null,
    {
      message: "Provide at least one weather measurement",
      path: ["temperatureC"]
    }
  );

export const createWeatherSchema = z.object({
  body: weatherBody,
  params: siteIdParam,
  query: z.object({})
});

export const listWeatherSchema = z
  .object({
    body: z.object({}),
    params: siteIdParam,
    query: z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(50),

      from: z.string().datetime({
        offset: true,
        message: "from must be a valid ISO 8601 timestamp with a timezone"
      }).optional(),

      to: z.string().datetime({
        offset: true,
        message: "to must be a valid ISO 8601 timestamp with a timezone"
      }).optional()
    })
  })
  .refine(
    (data) =>
      !data.query.from ||
      !data.query.to ||
      new Date(data.query.from) <= new Date(data.query.to),
    {
      message: "from must be earlier than or equal to to",
      path: ["query", "from"]
    }
  );

export const getWeatherSchema = z.object({
  body: z.object({}),
  params: weatherIdParam,
  query: z.object({})
});
