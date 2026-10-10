export const mapSolarGeneration = (generation) => {
  if (!generation) {
    return null;
  }

  return {
    id: Number(generation.id),
    siteId: generation.site_id,
    recordedAt: generation.recorded_at,
    powerKw:
      generation.power_kw === null
        ? null
        : Number(generation.power_kw),
    energyKwh:
      generation.energy_kwh === null
        ? null
        : Number(generation.energy_kwh),
    createdAt: generation.created_at
  };
};