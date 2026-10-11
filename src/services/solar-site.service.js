import * as solarSiteRepository from "../repositories/solar-site.repository.js";
import { assertIfMatch } from "../utils/conditional-response.js";
import { mapSolarSite } from "../utils/mappers/solar-site.mapper.js";
import { AppError } from "../utils/AppError.js";

export const getAllSites = async ({ jurisdiction, ...options }) => {
  return solarSiteRepository.findAll({ ...options, jurisdiction });
};

export const getSiteById = async (id, jurisdiction) => {
  const site = await solarSiteRepository.findById(id, jurisdiction);

  if (!site) {
    throw new AppError("Solar site not found", 404);
  }

  return site;
};

export const createSite = async (data) => {
  return solarSiteRepository.create(data);
};

export const updateSite = async (id, data, ifMatch) => {
  const existingSite = await solarSiteRepository.findById(id);

  if (!existingSite) {
    throw new AppError("Solar site not found", 404);
  }

  assertIfMatch(ifMatch, { success: true, data: mapSolarSite(existingSite) });
  const updated = await solarSiteRepository.update(id, { ...data, expectedRevision: existingSite.revision });
  if (!updated) throw new AppError("Resource changed during update", 412);
  return updated;
};

export const deleteSite = async (id, ifMatch) => {
  const existingSite = await solarSiteRepository.findById(id);

  if (!existingSite) {
    throw new AppError("Solar site not found", 404);
  }

  assertIfMatch(ifMatch, { success: true, data: mapSolarSite(existingSite) });
  const removed = await solarSiteRepository.remove(id, existingSite.revision);
  if (!removed) throw new AppError("Resource changed during deletion", 412);
  return removed;
};
