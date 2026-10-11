import * as solarGenerationRepository
  from "../repositories/solar-generation.repository.js";

import * as solarSiteRepository
  from "../repositories/solar-site.repository.js";

import { AppError } from "../utils/AppError.js";

const siteMatchesJurisdiction = (site, jurisdiction) => {
  if (!jurisdiction || jurisdiction.level === "national") return true;
  if (jurisdiction.level === "province") {
    return site.province_id === jurisdiction.id;
  }
  if (jurisdiction.level === "district") {
    return site.district_id === jurisdiction.id;
  }
  return false;
};

export const getGeneration = async (siteId, options, jurisdiction) => {
  const site = await solarSiteRepository.findById(siteId);

  if (!site || !siteMatchesJurisdiction(site, jurisdiction)) {
    throw new AppError("Solar site not found", 404);
  }

  return solarGenerationRepository.findAllBySite(
    siteId,
    options
  );
};

export const getGenerationById = async (siteId, id, jurisdiction) => {
  const site = await solarSiteRepository.findById(siteId);

  if (!site || !siteMatchesJurisdiction(site, jurisdiction)) {
    throw new AppError("Solar site not found", 404);
  }

  const generation =
    await solarGenerationRepository.findById(
      id,
      siteId
    );

  if (!generation) {
    throw new AppError(
      "Generation record not found",
      404
    );
  }

  return generation;
};

export const getLatestGeneration = async (siteId, jurisdiction) => {
  const site = await solarSiteRepository.findById(siteId, jurisdiction);
  if (!site) {
    throw new AppError("Solar site not found", 404);
  }

  const latest = await solarGenerationRepository.findLatestBySite(siteId);
  if (!latest) {
    throw new AppError("No generation reading exists for this solar site", 404);
  }

  return latest;
};

export const createGeneration = async (data) => {
  const site = await solarSiteRepository.findById(
    data.siteId
  );

  if (!site) {
    throw new AppError("Solar site not found", 404);
  }

  if (!site.is_active) {
    throw new AppError(
      "Cannot add generation data to an inactive solar site",
      400
    );
  }

  return solarGenerationRepository.create(data);
};
