import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/repositories/solar-site.repository.js", () => ({
  findById: vi.fn()
}));
vi.mock("../src/repositories/solar-generation.repository.js", () => ({
  findAllBySite: vi.fn(),
  findById: vi.fn(),
  findLatestBySite: vi.fn()
}));
vi.mock("../src/repositories/weather.repository.js", () => ({
  findAllBySite: vi.fn(),
  findById: vi.fn()
}));

import * as siteRepository from "../src/repositories/solar-site.repository.js";
import * as generationRepository from "../src/repositories/solar-generation.repository.js";
import * as weatherRepository from "../src/repositories/weather.repository.js";
import * as generationService from "../src/services/solar-generation.service.js";
import * as weatherService from "../src/services/weather.service.js";

const siteId = "11111111-1111-4111-8111-111111111111";
const districtId = "22222222-2222-4222-8222-222222222222";
const otherDistrictId = "33333333-3333-4333-8333-333333333333";
const scopedSite = {
  id: siteId,
  district_id: districtId,
  province_id: "44444444-4444-4444-8444-444444444444"
};

describe("jurisdiction scoped observation reads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    siteRepository.findById.mockResolvedValue(scopedSite);
    generationRepository.findAllBySite.mockResolvedValue({ data: [], total: 0 });
    generationRepository.findById.mockResolvedValue({ id: 1, site_id: siteId });
    generationRepository.findLatestBySite.mockResolvedValue({
      id: 2, site_id: siteId, recorded_at: "2026-10-12T05:00:00Z"
    });
    weatherRepository.findAllBySite.mockResolvedValue({ data: [], total: 0 });
    weatherRepository.findById.mockResolvedValue({ id: 1, site_id: siteId });
  });

  it("allows generation reads in the assigned district", async () => {
    const result = await generationService.getGeneration(
      siteId,
      { page: 1 },
      { level: "district", id: districtId }
    );

    expect(result.total).toBe(0);
    expect(generationRepository.findAllBySite).toHaveBeenCalledOnce();
  });

  it("scopes the latest-reading site lookup and returns its derived reading", async () => {
    const jurisdiction = { level: "district", id: districtId };
    const latest = await generationService.getLatestGeneration(
      siteId, jurisdiction
    );

    expect(latest.id).toBe(2);
    expect(siteRepository.findById).toHaveBeenCalledWith(siteId, jurisdiction);
    expect(generationRepository.findLatestBySite).toHaveBeenCalledWith(siteId);
  });

  it("does not query a latest reading when the site is outside scope", async () => {
    siteRepository.findById.mockResolvedValue(null);

    await expect(
      generationService.getLatestGeneration(siteId, {
        level: "district", id: otherDistrictId
      })
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(generationRepository.findLatestBySite).not.toHaveBeenCalled();
  });

  it("returns 404 when a visible site has no generation readings", async () => {
    generationRepository.findLatestBySite.mockResolvedValue(null);

    await expect(
      generationService.getLatestGeneration(siteId, {
        level: "district", id: districtId
      })
    ).rejects.toMatchObject({
      statusCode: 404,
      message: "No generation reading exists for this solar site"
    });
  });

  it("hides generation and weather observations outside the assigned district", async () => {
    const jurisdiction = { level: "district", id: otherDistrictId };

    await expect(
      generationService.getGeneration(siteId, {}, jurisdiction)
    ).rejects.toMatchObject({ statusCode: 404 });
    await expect(
      generationService.getGenerationById(siteId, 1, jurisdiction)
    ).rejects.toMatchObject({ statusCode: 404 });
    await expect(
      weatherService.getWeather(siteId, {}, jurisdiction)
    ).rejects.toMatchObject({ statusCode: 404 });
    await expect(
      weatherService.getWeatherById(siteId, 1, jurisdiction)
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(generationRepository.findAllBySite).not.toHaveBeenCalled();
    expect(generationRepository.findById).not.toHaveBeenCalled();
    expect(weatherRepository.findAllBySite).not.toHaveBeenCalled();
    expect(weatherRepository.findById).not.toHaveBeenCalled();
  });
});
