
export const mapWeather = (weather) => {
  if (!weather) {
    return null;
  }

  return {
    id: Number(weather.id),
    siteId: weather.site_id,
    recordedAt: weather.recorded_at,
    temperatureC:
      weather.temperature_c === null
        ? null
        : Number(weather.temperature_c),
    irradianceWM2:
      weather.irradiance_w_m2 === null
        ? null
        : Number(weather.irradiance_w_m2),
    cloudCoverPercent:
      weather.cloud_cover_percent === null
        ? null
        : Number(weather.cloud_cover_percent),
    windSpeedMs:
      weather.wind_speed_ms === null
        ? null
        : Number(weather.wind_speed_ms),
    humidityPercent:
      weather.humidity_percent === null
        ? null
        : Number(weather.humidity_percent),
    createdAt: weather.created_at
  };
};
