
import * as weatherRepository from "../repositories/weather.repository.js";
import * as solarSiteRepository from "../repositories/solar-site.repository.js";

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

export const getWeather = async (siteId, options, jurisdiction) => {
  const site = await solarSiteRepository.findById(siteId);

  if (!site || !siteMatchesJurisdiction(site, jurisdiction)) {
    throw new AppError("Solar site not found", 404);
  }

  return weatherRepository.findAllBySite(siteId, options);
};

export const getWeatherById = async (siteId, id, jurisdiction) => {
  const site = await solarSiteRepository.findById(siteId);

  if (!site || !siteMatchesJurisdiction(site, jurisdiction)) {
    throw new AppError("Solar site not found", 404);
  }

  const weather = await weatherRepository.findById(id, siteId);

  if (!weather) {
    throw new AppError("Weather observation not found", 404);
  }

  return weather;
};

export const createWeather = async (data) => {
  const site = await solarSiteRepository.findById(data.siteId);

  if (!site) {
    throw new AppError("Solar site not found", 404);
  }

  if (!site.is_active) {
    throw new AppError(
      "Cannot add weather data to an inactive solar site",
      400
    );
  }

  return weatherRepository.create(data);
};
