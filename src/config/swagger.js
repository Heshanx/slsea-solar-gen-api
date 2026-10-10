import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.3",

    info: {
      title: "SLSEA Solar Generation API",
      version: "1.0.0",
      description:
        "REST API for solar site management, generation data, weather data, and forecasting."
    },

    servers: [
      {
        url: "http://localhost:5000",
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
      }
    ],

    components: {
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
            capacity_kw: {
              type: "number",
              format: "double",
              example: 100
            },
            timezone: {
              type: "string",
              example: "Asia/Colombo"
            },
            is_active: {
              type: "boolean",
              example: true
            },
            created_at: {
              type: "string",
              format: "date-time"
            },
            updated_at: {
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
            createdAt: {
              type: "string",
              format: "date-time"
            }
          }
        },

        CreateSolarGeneration: {
          type: "object",
          required: ["recordedAt"],
          properties: {
            recordedAt: {
              type: "string",
              format: "date-time",
              example: "2026-10-10T08:00:00+05:30"
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

  apis: [
    "./src/routes/*.js"
  ]
};

export const swaggerSpec = swaggerJSDoc(options);