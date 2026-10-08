import * as solarSiteRepository from "../repositories/solar-site.repository.js";
import { AppError } from "../utils/AppError.js";

export const getAllSites = async (options) => {
  return solarSiteRepository.findAll(options);
};

export const getSiteById = async (id) => {
  const site = await solarSiteRepository.findById(id);

  if (!site) {
    throw new AppError("Solar site not found", 404);
  }

  return site;
};

export const createSite = async (data) => {
  return solarSiteRepository.create(data);
};

export const updateSite = async (id, data) => {
  const existingSite = await solarSiteRepository.findById(id);

  if (!existingSite) {
    throw new AppError("Solar site not found", 404);
  }

  return solarSiteRepository.update(id, data);
};

export const deleteSite = async (id) => {
  const existingSite = await solarSiteRepository.findById(id);

  if (!existingSite) {
    throw new AppError("Solar site not found", 404);
  }

  return solarSiteRepository.remove(id);
};