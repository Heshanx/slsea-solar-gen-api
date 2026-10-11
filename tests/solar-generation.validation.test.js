import { describe, it, expect } from "vitest";
import {
  createSolarGenerationSchema
} from "../src/validators/solar-generation.validator.js";

const validRequest = {
  body: {
    recordedAt: "2026-10-10T08:00:00+05:30",
    voltageV: 400,
    powerKw: 42.5,
    energyKwh: 38.7
  },
  params: {
    siteId: "588f49ed-0b04-43b0-9617-d078af39e321"
  },
  query: {}
};

describe("Solar generation validation", () => {
  it("accepts a valid generation reading with voltage", () => {
    const result = createSolarGenerationSchema.safeParse(validRequest);

    expect(result.success).toBe(true);
  });

  it("rejects a reading without voltage", () => {
    const request = structuredClone(validRequest);
    delete request.body.voltageV;

    const result = createSolarGenerationSchema.safeParse(request);

    expect(result.success).toBe(false);
  });

  it("rejects zero voltage", () => {
    const request = {
      ...validRequest,
      body: { ...validRequest.body, voltageV: 0 }
    };

    expect(createSolarGenerationSchema.safeParse(request).success)
      .toBe(false);
  });

  it("rejects negative voltage", () => {
    const request = {
      ...validRequest,
      body: { ...validRequest.body, voltageV: -230 }
    };

    expect(createSolarGenerationSchema.safeParse(request).success)
      .toBe(false);
  });

  it("rejects a reading without power or energy", () => {
    const request = {
      ...validRequest,
      body: {
        recordedAt: validRequest.body.recordedAt,
        voltageV: 400
      }
    };

    expect(createSolarGenerationSchema.safeParse(request).success)
      .toBe(false);
  });

  it("accepts a reading with nullable power and valid energy", () => {
    const request = {
      ...validRequest,
      body: {
        recordedAt: validRequest.body.recordedAt,
        voltageV: 400,
        powerKw: null,
        energyKwh: 12.5
      }
    };

    expect(createSolarGenerationSchema.safeParse(request).success)
      .toBe(true);
  });

  it("rejects a reading with a timestamp lacking a timezone", () => {
    const request = {
      ...validRequest,
      body: {
        ...validRequest.body,
        recordedAt: "2026-10-10T08:00:00"
      }
    };

    expect(createSolarGenerationSchema.safeParse(request).success)
      .toBe(false);
  });
});