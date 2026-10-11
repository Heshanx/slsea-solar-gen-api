import { fileURLToPath } from "node:url";
import { readdirSync } from "node:fs";
import { completeSwagger } from "./swagger-completion.js";
import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.3",

    info: {
      title: "SLSEA Solar Generation API",
      version: "1.0.0",
      description:
        "REST API for solar installations and generation readings, with optional weather observations and Open-Meteo weather forecasts."
    },

    security: [{ BearerAuth: [] }],

    servers: [
      ...(process.env.RENDER_EXTERNAL_URL
        ? [
            {
              url: process.env.RENDER_EXTERNAL_URL,
              description: "Hosted API"
            }
          ]
        : []),
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: "Local development server"
      }
    ],

    tags: [
      {
        name: "Health",
        description: "API health and database status"
      },
      {
        name: "Solar Sites",
        description: "Solar site management"
      },
      {
        name: "Solar Generation",
        description: "Solar generation data ingestion and retrieval"
      },
      {
        name: "Geography",
        description: "Jurisdiction-scoped provinces, districts, and substations"
      },
      {
        name: "Weather",
        description: "Weather observations associated with solar sites"
      }
    ],

    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "OIDC access token validated against the configured issuer and JWKS."
        }
      },
      schemas: {
        SolarSite: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              example: "550e8400-e29b-41d4-a716-446655440000"
            },
            name: {
              type: "string",
              example: "SLSEA Colombo Solar Site"
            },
            location: {
              type: "string",
              example: "Colombo, Sri Lanka"
            },
            latitude: {
              type: "number",
              format: "double",
              example: 6.927079
            },
            longitude: {
              type: "number",
              format: "double",
              example: 79.861244
            },
            capacityKw: {
              type: "number",
              format: "double",
              example: 100
            },
            timezone: {
              type: "string",
              example: "Asia/Colombo"
            },
            installationCode: { type: "string", nullable: true },
            installationType: { type: "string", nullable: true },
            operatorName: { type: "string", nullable: true },
            commissionedAt: { type: "string", format: "date", nullable: true },
            substation: {
              type: "object",
              nullable: true,
              properties: {
                id: { type: "string", format: "uuid" },
                name: { type: "string" },
                latitude: { type: "number", nullable: true },
                longitude: { type: "number", nullable: true },
                voltageKv: { type: "number", nullable: true }
              }
            },
            district: {
              type: "object",
              nullable: true,
              properties: {
                id: { type: "string", format: "uuid" },
                name: { type: "string" }
              }
            },
            province: {
              type: "object",
              nullable: true,
              properties: {
                id: { type: "string", format: "uuid" },
                name: { type: "string" }
              }
            },
            isActive: {
              type: "boolean",
              example: true
            },
            createdAt: {
              type: "string",
              format: "date-time"
            },
            updatedAt: {
              type: "string",
              format: "date-time"
            }
          }
        },

        CreateSolarSite: {
          type: "object",
          required: [
            "name",
            "capacityKw",
            "timezone"
          ],
          properties: {
            name: {
              type: "string",
              example: "SLSEA Colombo Solar Site"
            },
            location: {
              type: "string",
              example: "Colombo, Sri Lanka"
            },
            latitude: {
              type: "number",
              minimum: -90,
              maximum: 90,
              example: 6.927079
            },
            longitude: {
              type: "number",
              minimum: -180,
              maximum: 180,
              example: 79.861244
            },
            capacityKw: {
              type: "number",
              exclusiveMinimum: 0,
              example: 100
            },
            timezone: {
              type: "string",
              example: "Asia/Colombo"
            }
          }
        },

        UpdateSolarSite: {
          type: "object",
          required: [
            "name",
            "capacityKw",
            "timezone",
            "isActive"
          ],
          properties: {
            name: {
              type: "string",
              example: "SLSEA Colombo Solar Site"
            },
            location: {
              type: "string",
              example: "Colombo, Sri Lanka"
            },
            latitude: {
              type: "number",
              minimum: -90,
              maximum: 90,
              example: 6.927079
            },
            longitude: {
              type: "number",
              minimum: -180,
              maximum: 180,
              example: 79.861244
            },
            capacityKw: {
              type: "number",
              exclusiveMinimum: 0,
              example: 150
            },
            timezone: {
              type: "string",
              example: "Asia/Colombo"
            },
            isActive: {
              type: "boolean",
              example: true
            }
          }
        },
        SolarGeneration: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1
            },
            siteId: {
              type: "string",
              format: "uuid"
            },
            recordedAt: {
              type: "string",
              format: "date-time",
              example: "2026-10-10T08:00:00+05:30"
            },
            powerKw: {
              type: "number",
              nullable: true,
              example: 42.5
            },
            energyKwh: {
              type: "number",
              nullable: true,
              example: 38.7
            },
            voltageV: {
              type: "number",
              exclusiveMinimum: 0,
              example: 400
            },
            createdAt: {
              type: "string",
              format: "date-time"
            }
          }
        },

        Province: {
          type: "object",
          required: ["id", "code", "name"],
          properties: {
            id: { type: "string", format: "uuid" },
            code: { type: "string", example: "WP" },
            name: { type: "string", example: "Western" },
            createdAt: { type: "string", format: "date-time" }
          }
        },

        District: {
          type: "object",
          required: ["id", "code", "name", "province"],
          properties: {
            id: { type: "string", format: "uuid" },
            code: { type: "string", example: "COL" },
            name: { type: "string", example: "Colombo" },
            province: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                code: { type: "string" },
                name: { type: "string" }
              }
            },
            createdAt: { type: "string", format: "date-time" }
          }
        },

        GridSubstation: {
          type: "object",
          required: ["id", "code", "name", "district", "province"],
          properties: {
            id: { type: "string", format: "uuid" },
            code: { type: "string" },
            name: { type: "string" },
            latitude: { type: "number", nullable: true },
            longitude: { type: "number", nullable: true },
            voltageKv: { type: "number", nullable: true },
            isActive: { type: "boolean" },
            district: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                name: { type: "string" }
              }
            },
            province: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                code: { type: "string" },
                name: { type: "string" }
              }
            },
            createdAt: { type: "string", format: "date-time" }
          }
        },

        CollectionPagination: {
          type: "object",
          required: ["page", "limit", "total", "totalPages", "next", "previous"],
          properties: {
            page: { type: "integer", minimum: 1 },
            limit: { type: "integer", minimum: 1, maximum: 100 },
            total: { type: "integer", minimum: 0 },
            totalPages: { type: "integer", minimum: 0 },
            next: { type: "string", nullable: true },
            previous: { type: "string", nullable: true }
          }
        },

        ProvinceResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { $ref: "#/components/schemas/Province" }
          }
        },
        DistrictResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { $ref: "#/components/schemas/District" }
          }
        },
        SubstationResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { $ref: "#/components/schemas/GridSubstation" }
          }
        },
        GenerationResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { $ref: "#/components/schemas/SolarGeneration" }
          }
        },
        ProvinceCollection: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { type: "array", items: { $ref: "#/components/schemas/Province" } },
            pagination: { $ref: "#/components/schemas/CollectionPagination" }
          }
        },
        DistrictCollection: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { type: "array", items: { $ref: "#/components/schemas/District" } },
            pagination: { $ref: "#/components/schemas/CollectionPagination" }
          }
        },
        SubstationCollection: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { type: "array", items: { $ref: "#/components/schemas/GridSubstation" } },
            pagination: { $ref: "#/components/schemas/CollectionPagination" }
          }
        },
        InstallationCollection: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { type: "array", items: { $ref: "#/components/schemas/SolarSite" } },
            pagination: { $ref: "#/components/schemas/CollectionPagination" }
          }
        },

        CreateSolarGeneration: {
          type: "object",
          required: ["recordedAt", "voltageV"],
          properties: {
            recordedAt: {
              type: "string",
              format: "date-time",
              example: "2026-10-10T08:00:00+05:30"
            },
            voltageV: {
              type: "number",
              exclusiveMinimum: 0,
              example: 400,
              description: "Measured voltage in volts; must be greater than zero."
            },
            powerKw: {
              type: "number",
              minimum: 0,
              nullable: true,
              example: 42.5
            },
            energyKwh: {
              type: "number",
              minimum: 0,
              nullable: true,
              example: 38.7
            }
          },
          anyOf: [
            { required: ["powerKw"] },
            { required: ["energyKwh"] }
          ]
        },
        
        Weather: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1
            },
            siteId: {
              type: "string",
              format: "uuid"
            },
            recordedAt: {
              type: "string",
              format: "date-time",
              example: "2026-10-10T08:00:00+05:30"
            },
            temperatureC: {
              type: "number",
              nullable: true,
              example: 29.5
            },
            irradianceWM2: {
              type: "number",
              nullable: true,
              example: 750
            },
            cloudCoverPercent: {
              type: "number",
              nullable: true,
              example: 25
            },
            windSpeedMs: {
              type: "number",
              nullable: true,
              example: 3.2
            },
            humidityPercent: {
              type: "number",
              nullable: true,
              example: 78
            },
            createdAt: {
              type: "string",
              format: "date-time"
            }
          }
        },

        CreateWeather: {
          type: "object",
          required: ["recordedAt"],
          properties: {
            recordedAt: {
              type: "string",
              format: "date-time",
              example: "2026-10-10T08:00:00+05:30"
            },
            temperatureC: {
              type: "number",
              minimum: -100,
              maximum: 70,
              nullable: true,
              example: 29.5
            },
            irradianceWM2: {
              type: "number",
              minimum: 0,
              maximum: 2000,
              nullable: true,
              example: 750
            },
            cloudCoverPercent: {
              type: "number",
              minimum: 0,
              maximum: 100,
              nullable: true,
              example: 25
            },
            windSpeedMs: {
              type: "number",
              minimum: 0,
              maximum: 150,
              nullable: true,
              example: 3.2
            },
            humidityPercent: {
              type: "number",
              minimum: 0,
              maximum: 100,
              nullable: true,
              example: 78
            }
          },
          anyOf: [
            { required: ["temperatureC"] },
            { required: ["irradianceWM2"] },
            { required: ["cloudCoverPercent"] },
            { required: ["windSpeedMs"] },
            { required: ["humidityPercent"] }
          ]
        },

        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false
            },
            error: {
              type: "object",
              properties: {
                message: {
                  type: "string",
                  example: "Validation failed"
                }
              }
            }
          }
        }
      }
    }
  },

  apis: readdirSync(new URL("../routes/", import.meta.url))
    .filter((name) => name.endsWith(".js"))
    .sort()
    .map((name) => fileURLToPath(new URL(`../routes/${name}`, import.meta.url))
      .replace(/\\/g, "/"))
};

export const swaggerSpec = completeSwagger(swaggerJSDoc(options));
