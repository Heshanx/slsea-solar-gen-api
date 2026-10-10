export const mapSolarSite = (site) => {
  if (!site) {
    return null;
  }

  return {
    id: site.id,
    name: site.name,
    location: site.location,
    latitude: site.latitude === null ? null : Number(site.latitude),
    longitude: site.longitude === null ? null : Number(site.longitude),
    capacityKw: Number(site.capacity_kw),
    timezone: site.timezone,
    isActive: site.is_active,
    createdAt: site.created_at,
    updatedAt: site.updated_at
  };
};