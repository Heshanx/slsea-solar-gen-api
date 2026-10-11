import sql from "../config/database.js";

const scopePredicate = (jurisdiction) => {
  if (jurisdiction?.level === "province") {
    return sql`and p.id = ${jurisdiction.id}`;
  }
  if (jurisdiction?.level === "district") {
    return sql`and d.id = ${jurisdiction.id}`;
  }
  return sql``;
};

const siteSelect = sql`
  select
    s.id,
    s.name,
    s.location,
    s.latitude,
    s.longitude,
    s.capacity_kw,
    s.timezone,
    s.installation_code,
    s.installation_type,
    s.operator_name,
    s.commissioned_at,
    s.substation_id,
    s.meter_inverter_id,
    g.name as substation_name,
    g.latitude as substation_latitude,
    g.longitude as substation_longitude,
    g.voltage_kv as substation_voltage_kv,
    d.id as district_id,
    d.name as district_name,
    p.id as province_id,
    p.name as province_name,
    s.is_active,
    s.created_at,
    s.revision,
    s.updated_at
  from public.solar_sites s
  left join public.grid_substations g
    on g.id = s.substation_id
  left join public.districts d
    on d.id = g.district_id
  left join public.provinces p
    on p.id = d.province_id
`;

export const findAll = async ({
  page = 1,
  limit = 20,
  active,
  jurisdiction
} = {}) => {
  const offset = (page - 1) * limit;

  const data = await sql`
    select
      s.id,
      s.name,
      s.location,
      s.latitude,
      s.longitude,
      s.capacity_kw,
      s.timezone,
      s.installation_code,
      s.installation_type,
      s.operator_name,
      s.commissioned_at,
      s.substation_id,
      s.meter_inverter_id,
      g.name as substation_name,
      g.latitude as substation_latitude,
      g.longitude as substation_longitude,
      g.voltage_kv as substation_voltage_kv,
      d.id as district_id,
      d.name as district_name,
      p.id as province_id,
      p.name as province_name,
      s.is_active,
      s.created_at,
      s.revision,
    s.updated_at
    from public.solar_sites s
    left join public.grid_substations g
      on g.id = s.substation_id
    left join public.districts d
      on d.id = g.district_id
    left join public.provinces p
      on p.id = d.province_id
    where s.deleted_at is null
      ${
      active === undefined
        ? sql``
        : sql`and s.is_active = ${active}`
    }
      ${scopePredicate(jurisdiction)}
    order by s.created_at desc, s.id
    limit ${limit}
    offset ${offset}
  `;

  const countResult = await sql`
    select count(*)::int as total
    from public.solar_sites s
    left join public.grid_substations g
      on g.id = s.substation_id
    left join public.districts d
      on d.id = g.district_id
    left join public.provinces p
      on p.id = d.province_id
    where s.deleted_at is null
      ${
      active === undefined
        ? sql``
        : sql`and s.is_active = ${active}`
    }
      ${scopePredicate(jurisdiction)}
  `;

  return {
    data,
    total: countResult[0].total
  };
};

export const findAllBySubstation = async (
  substationId,
  { page = 1, limit = 20, jurisdiction } = {}
) => {
  const offset = (page - 1) * limit;
  const data = await sql`
    ${siteSelect}
    where s.deleted_at is null and s.substation_id = ${substationId}
      ${scopePredicate(jurisdiction)}
    order by s.name, s.id
    limit ${limit} offset ${offset}
  `;
  const count = await sql`
    select count(*)::int as total
    from public.solar_sites s
    left join public.grid_substations g on g.id = s.substation_id
    left join public.districts d on d.id = g.district_id
    left join public.provinces p on p.id = d.province_id
    where s.deleted_at is null and s.substation_id = ${substationId}
      ${scopePredicate(jurisdiction)}
  `;
  return { data, total: count[0].total };
};

export const findById = async (id, jurisdiction) => {
  const result = await sql`
    select
      s.id,
      s.name,
      s.location,
      s.latitude,
      s.longitude,
      s.capacity_kw,
      s.timezone,
      s.installation_code,
      s.installation_type,
      s.operator_name,
      s.commissioned_at,
      s.substation_id,
      s.meter_inverter_id,
      g.name as substation_name,
      g.latitude as substation_latitude,
      g.longitude as substation_longitude,
      g.voltage_kv as substation_voltage_kv,
      d.id as district_id,
      d.name as district_name,
      p.id as province_id,
      p.name as province_name,
      s.is_active,
      s.created_at,
      s.revision,
    s.updated_at
    from public.solar_sites s
    left join public.grid_substations g
      on g.id = s.substation_id
    left join public.districts d
      on d.id = g.district_id
    left join public.provinces p
      on p.id = d.province_id
    where s.deleted_at is null and s.id = ${id}
      ${scopePredicate(jurisdiction)}
    limit 1
  `;

  return result[0] || null;
};

export const create = async ({
  name,
  location,
  latitude,
  longitude,
  capacityKw,
  timezone,
  installationCode,
  installationType,
  operatorName,
  commissionedAt,
  substationId,
  meterInverterId
}) => {
  const result = await sql`
    insert into public.solar_sites (
      name,
      location,
      latitude,
      longitude,
      capacity_kw,
      timezone,
      installation_code,
      installation_type,
      operator_name,
      commissioned_at,
      substation_id,
      meter_inverter_id
    )
    values (
      ${name},
      ${location ?? null},
      ${latitude ?? null},
      ${longitude ?? null},
      ${capacityKw},
      ${timezone},
      ${installationCode ?? null},
      ${installationType ?? null},
      ${operatorName ?? null},
      ${commissionedAt ?? null},
      ${substationId ?? null},
      ${meterInverterId ?? null}
    )
    returning id
  `;

  return findById(result[0].id);
};

export const update = async (
  id,
  {
    name,
    location,
    latitude,
    longitude,
    capacityKw,
    timezone,
    installationCode,
    installationType,
    operatorName,
    commissionedAt,
    substationId,
    meterInverterId,
    isActive,
    expectedRevision
  }
) => {
  const result = await sql`
    update public.solar_sites
    set
      name = ${name},
      location = ${location ?? null},
      latitude = ${latitude ?? null},
      longitude = ${longitude ?? null},
      capacity_kw = ${capacityKw},
      timezone = ${timezone},
      installation_code = ${installationCode ?? null},
      installation_type = ${installationType ?? null},
      operator_name = ${operatorName ?? null},
      commissioned_at = ${commissionedAt ?? null},
      substation_id = ${substationId ?? null},
      meter_inverter_id = ${meterInverterId ?? null},
      is_active = ${isActive}
    where id = ${id} and deleted_at is null and revision = ${expectedRevision}
    returning id
  `;

  if (!result[0]) {
    return null;
  }

  return findById(result[0].id);
};

export const remove = async (id, expectedRevision) => {
  const rows = await sql`
    update public.solar_sites set deleted_at = now(), is_active = false
    where id = ${id} and deleted_at is null and revision = ${expectedRevision}
    returning id
  `;
  return rows[0] || null;
};
