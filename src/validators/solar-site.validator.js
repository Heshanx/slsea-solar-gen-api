import { z } from "zod";

const optionalText = (max, message) =>
  z.string()
    .trim()
    .min(1, "Value cannot be blank")
    .max(max, message)
    .nullable()
    .optional();

const optionalCoordinate = (min, max, field) =>
  z.number()
    .finite(`${field} must be a finite number`)
    .min(min, `${field} is out of range`)
    .max(max, `${field} is out of range`)
    .nullable()
    .optional();

const siteFields = {
  name: z.string()
    .trim()
    .min(1, "Name is required")
    .max(150, "Name must not exceed 150 characters"),

  location: optionalText(
    255,
    "Location must not exceed 255 characters"
  ),

  latitude: optionalCoordinate(-90, 90, "Latitude"),

  longitude: optionalCoordinate(-180, 180, "Longitude"),

  capacityKw: z.number()
    .finite("Capacity must be a finite number")
    .min(0.001, "Capacity must be at least 0.001 kW")
    .max(999999999.999),

  timezone: z.string()
    .trim()
    .min(1, "Timezone is required")
    .default("Asia/Colombo"),

  installationCode: optionalText(
    100,
    "Installation code must not exceed 100 characters"
  ),

  installationType: optionalText(
    100,
    "Installation type must not exceed 100 characters"
  ),

  operatorName: optionalText(
    150,
    "Operator name must not exceed 150 characters"
  ),

  commissionedAt: z.string()
    .date("Commissioned date must use YYYY-MM-DD format")
    .nullable()
    .optional(),

  substationId: z.string()
    .uuid("Invalid substation ID")
    .nullable()
    .optional(),

  meterInverterId: z.string()
    .trim()
    .min(1, "Meter/inverter ID cannot be blank")
    .max(150, "Meter/inverter ID must not exceed 150 characters")
    .nullable()
    .optional()
};

export const createSolarSiteSchema = z.object({
  body: z.object({ ...siteFields, substationId: z.string().uuid(), meterInverterId: z.string().trim().min(1).max(150) }),
  params: z.object({}),
  query: z.object({})
});

export const updateSolarSiteSchema = z.object({
  body: z.object({
    ...siteFields,
    substationId: z.string().uuid(),
    meterInverterId: z.string().trim().min(1).max(150),
    timezone: z.string()
      .trim()
      .min(1, "Timezone is required"),
    isActive: z.boolean()
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
    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(20),

    active: z.enum(["true", "false"])
      .optional()
      .transform((value) =>
        value === undefined ? undefined : value === "true"
      )
  })
});
