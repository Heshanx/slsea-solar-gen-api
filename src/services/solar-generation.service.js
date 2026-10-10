import * as solarGenerationRepository
  from "../repositories/solar-generation.repository.js";

import * as solarSiteRepository
  from "../repositories/solar-site.repository.js";

import { AppError } from "../utils/AppError.js";

export const getGeneration = async (
  siteId,
  options
) => {
  const site = await solarSiteRepository.findById(siteId);

  if (!site) {
    throw new AppError("Solar site not found", 404);
  }

  return solarGenerationRepository.findAllBySite(
    siteId,
    options
  );
};

export const getGenerationById = async (
  siteId,
  id
) => {
  const site = await solarSiteRepository.findById(siteId);

  if (!site) {
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