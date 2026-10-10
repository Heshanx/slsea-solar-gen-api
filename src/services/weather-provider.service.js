
import * as solarSiteRepository from "../repositories/solar-site.repository.js";
import { AppError } from "../utils/AppError.js";

const WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast";

export const getSiteWeatherForecast = async (siteId) => {
  const site = await solarSiteRepository.findById(siteId);

  if (!site) {
    throw new AppError("Solar site not found", 404);
  }

  if (site.latitude === null || site.longitude === null) {
    throw new AppError(
      "Solar site must have latitude and longitude configured",
      400
    );
  }

  const latitude = Number(site.latitude);
  const longitude = Number(site.longitude);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new AppError(
      "Solar site has invalid coordinates",
      400
    );
  }

  const url = new URL(WEATHER_API_URL);

  url.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    hourly: [
      "temperature_2m",
      "relative_humidity_2m",
      "cloud_cover",
      "wind_speed_10m",
      "shortwave_radiation"
    ].join(","),
    forecast_days: "2",
    timezone: "UTC",
    wind_speed_unit: "ms"
  }).toString();

  let response;

  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: {
        Accept: "application/json"
      }
    });
  } catch {
    throw new AppError(
      "Weather provider is unavailable or timed out",
      502
    );
  }

  if (!response.ok) {
    throw new AppError(
      "Weather provider returned an unsuccessful response",
      502
    );
  }

  let providerData;

  try {
    providerData = await response.json();
  } catch {
    throw new AppError(
      "Weather provider returned invalid JSON",
      502
    );
  }

  if (
    !providerData.hourly ||
    !Array.isArray(providerData.hourly.time) ||
    !Array.isArray(providerData.hourly.temperature_2m)
  ) {
    throw new AppError(
      "Weather provider returned an unexpected response",
      502
    );
  }

  const hourly = providerData.hourly;

  const forecast = hourly.time.map((time, index) => ({
    recordedAt: `${time}:00Z`,
    temperatureC: hourly.temperature_2m[index] ?? null,
    humidityPercent:
      hourly.relative_humidity_2m[index] ?? null,
    cloudCoverPercent:
      hourly.cloud_cover[index] ?? null,
    windSpeedMs:
      hourly.wind_speed_10m[index] ?? null,
    irradianceWM2:
      hourly.shortwave_radiation[index] ?? null
  }));

  return {
    siteId: site.id,
    provider: "Open-Meteo",
    timezone: providerData.timezone,
    latitude,
    longitude,
    forecast
  };
};
