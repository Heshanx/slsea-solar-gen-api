const numberOrNull = (value) =>
  value === null || value === undefined
    ? null
    : Number(value);

export const mapSolarSite = (site) => {
  if (!site) {
    return null;
  }

  return {
    id: site.id,
    revision: site.revision ?? 1,
    name: site.name,
    location: site.location,
    latitude: numberOrNull(site.latitude),
    longitude: numberOrNull(site.longitude),
    capacityKw: Number(site.capacity_kw),
    timezone: site.timezone,

    installationCode: site.installation_code,
    installationType: site.installation_type,
    operatorName: site.operator_name,
    commissionedAt: site.commissioned_at,
    meterInverterId: site.meter_inverter_id,

    substation: site.substation_id
      ? {
          id: site.substation_id,
          name: site.substation_name,
          latitude: numberOrNull(site.substation_latitude),
          longitude: numberOrNull(site.substation_longitude),
          voltageKv: numberOrNull(site.substation_voltage_kv)
        }
      : null,

    district: site.district_id
      ? {
          id: site.district_id,
          name: site.district_name
        }
      : null,

    province: site.province_id
      ? {
          id: site.province_id,
          name: site.province_name
        }
      : null,

    isActive: site.is_active,
    createdAt: site.created_at,
    updatedAt: site.updated_at
  };
};
