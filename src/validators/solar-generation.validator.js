
import { z } from "zod";

const siteIdParam = z.object({
  siteId: z.string().uuid("Invalid solar site ID")
});

const generationIdParam = z.object({
  siteId: z.string().uuid("Invalid solar site ID"),
  id: z.coerce
    .number()
    .int("Generation ID must be an integer")
    .positive("Generation ID must be positive")
    .safe("Generation ID must be a safe integer")
});

const generationBody = z
  .object({
    recordedAt: z.string().datetime({
      offset: true,
      message: "recordedAt must be a valid ISO 8601 timestamp with a timezone"
    }),

    powerKw: z
      .number()
      .min(0, "Power cannot be negative")
      .nullable()
      .optional(),

    energyKwh: z
      .number()
      .min(0, "Energy cannot be negative")
      .nullable()
      .optional()
  })
  .refine(
    (data) =>
      data.powerKw != null || data.energyKwh != null,
    {
      message: "Provide at least one of powerKw or energyKwh",
      path: ["powerKw"]
    }
  );

export const createSolarGenerationSchema = z.object({
  body: generationBody,
  params: siteIdParam,
  query: z.object({})
});

export const listSolarGenerationSchema = z
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

export const getSolarGenerationSchema = z.object({
  body: z.object({}),
  params: generationIdParam,
  query: z.object({})
});
