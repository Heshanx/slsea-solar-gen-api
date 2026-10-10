
import * as weatherRepository from "../repositories/weather.repository.js";
import * as solarSiteRepository from "../repositories/solar-site.repository.js";

import { AppError } from "../utils/AppError.js";

export const getWeather = async (siteId, options) => {
  const site = await solarSiteRepository.findById(siteId);

  if (!site) {
    throw new AppError("Solar site not found", 404);
  }

  return weatherRepository.findAllBySite(siteId, options);
};

export const getWeatherById = async (siteId, id) => {
  const site = await solarSiteRepository.findById(siteId);

  if (!site) {
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
