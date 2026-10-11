import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/repositories/geographic.repository.js", () => ({
  findAllProvinces: vi.fn(),
  findProvinceById: vi.fn(),
  findDistrictsByProvince: vi.fn(),
  findDistrictById: vi.fn(),
  findSubstationsByDistrict: vi.fn(),
  findSubstationById: vi.fn()
}));

vi.mock("../src/repositories/solar-site.repository.js", () => ({
  findAllBySubstation: vi.fn()
}));

import * as geographicRepository from "../src/repositories/geographic.repository.js";
import * as siteRepository from "../src/repositories/solar-site.repository.js";
import * as geographicService from "../src/services/geographic.service.js";

const provinceId = "11111111-1111-4111-8111-111111111111";
const districtId = "22222222-2222-4222-8222-222222222222";
const substationId = "33333333-3333-4333-8333-333333333333";
const jurisdiction = { level: "province", id: provinceId };

describe("geographic service scope and parent checks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    geographicRepository.findProvinceById.mockResolvedValue({ id: provinceId });
    geographicRepository.findDistrictById.mockResolvedValue({ id: districtId });
    geographicRepository.findSubstationById.mockResolvedValue({ id: substationId });
    geographicRepository.findDistrictsByProvince.mockResolvedValue({
      data: [], total: 0
    });
    geographicRepository.findSubstationsByDistrict.mockResolvedValue({
      data: [], total: 0
    });
    siteRepository.findAllBySubstation.mockResolvedValue({ data: [], total: 0 });
  });

  it("checks the scoped province before listing its districts", async () => {
    const options = { page: 2, limit: 10 };
    await geographicService.getDistrictsByProvince(
      provinceId, options, jurisdiction
    );

    expect(geographicRepository.findProvinceById).toHaveBeenCalledWith(
      provinceId, jurisdiction
    );
    expect(geographicRepository.findDistrictsByProvince).toHaveBeenCalledWith(
      provinceId, { ...options, jurisdiction }
    );
  });

  it("does not list children when the requested parent is outside scope", async () => {
    geographicRepository.findDistrictById.mockResolvedValue(null);

    await expect(
      geographicService.getSubstationsByDistrict(
        districtId, { page: 1, limit: 20 }, jurisdiction
      )
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(geographicRepository.findSubstationsByDistrict).not.toHaveBeenCalled();
  });

  it("passes jurisdiction and pagination into nested installation queries", async () => {
    const options = { page: 3, limit: 5 };
    await geographicService.getInstallationsBySubstation(
      substationId, options, jurisdiction
    );

    expect(geographicRepository.findSubstationById).toHaveBeenCalledWith(
      substationId, jurisdiction
    );
    expect(siteRepository.findAllBySubstation).toHaveBeenCalledWith(
      substationId, { ...options, jurisdiction }
    );
  });
});
