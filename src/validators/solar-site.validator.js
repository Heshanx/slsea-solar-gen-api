import { z } from "zod";

const siteFields = {
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(150, "Name must not exceed 150 characters"),

  location: z
    .string()
    .trim()
    .max(255, "Location must not exceed 255 characters")
    .optional(),

  latitude: z
    .number()
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90")
    .optional(),

  longitude: z
    .number()
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180")
    .optional(),

  capacityKw: z
    .number()
    .positive("Capacity must be greater than 0"),

  timezone: z
    .string()
    .trim()
    .min(1, "Timezone is required")
    .default("Asia/Colombo")
};

export const createSolarSiteSchema = z.object({
  body: z.object(siteFields),
  params: z.object({}),
  query: z.object({})
});

export const updateSolarSiteSchema = z.object({
  body: z.object({
    ...siteFields,
    isActive: z.boolean().default(true)
  }),
  params: z.object({
    id: z.string().uuid("Invalid solar site ID")
  }),
  query: z.object({})
});

export const getSolarSiteSchema = z.object({
  body: z.object({}),
  params: z.object({
    id: z.string().uuid("Invalid solar site ID")
  }),
  query: z.object({})
});

export const deleteSolarSiteSchema = getSolarSiteSchema;

export const listSolarSitesSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    page: z.coerce
      .number()
      .int()
      .min(1)
      .default(1),

    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20),

    active: z
      .enum(["true", "false"])
      .optional()
      .transform((value) => {
        if (value === undefined) {
          return undefined;
        }

        return value === "true";
      })
  })
});