import sql from "../config/database.js";

const provinceScope = (jurisdiction) => {
  if (jurisdiction?.level === "province") {
    return sql`and p.id = ${jurisdiction.id}`;
  }
  if (jurisdiction?.level === "district") {
    return sql`and exists (
      select 1 from public.districts scope_district
      where scope_district.id = ${jurisdiction.id}
        and scope_district.province_id = p.id
    )`;
  }
  return sql``;
};

const districtScope = (jurisdiction) => {
  if (jurisdiction?.level === "province") {
    return sql`and p.id = ${jurisdiction.id}`;
  }
  if (jurisdiction?.level === "district") {
    return sql`and d.id = ${jurisdiction.id}`;
  }
  return sql``;
};

export const findAllProvinces = async ({
  page = 1,
  limit = 20,
  jurisdiction
} = {}) => {
  const offset = (page - 1) * limit;
  const data = await sql`
    select p.id, p.code, p.name, p.created_at
    from public.provinces p
    where true ${provinceScope(jurisdiction)}
    order by p.name, p.id
    limit ${limit} offset ${offset}
  `;
  const count = await sql`
    select count(*)::int as total
    from public.provinces p
    where true ${provinceScope(jurisdiction)}
  `;
  return { data, total: count[0].total };
};

export const findProvinceById = async (id, jurisdiction) => {
  const rows = await sql`
    select p.id, p.code, p.name, p.created_at
    from public.provinces p
    where p.id = ${id} ${provinceScope(jurisdiction)}
    limit 1
  `;
  return rows[0] || null;
};

export const findDistrictsByProvince = async (
  provinceId,
  { page = 1, limit = 20, jurisdiction } = {}
) => {
  const offset = (page - 1) * limit;
  const data = await sql`
    select d.id, d.code, d.name, d.province_id, d.created_at,
      p.code as province_code, p.name as province_name
    from public.districts d
    join public.provinces p on p.id = d.province_id
    where d.province_id = ${provinceId} ${districtScope(jurisdiction)}
    order by d.name, d.id
    limit ${limit} offset ${offset}
  `;
  const count = await sql`
    select count(*)::int as total
    from public.districts d
    join public.provinces p on p.id = d.province_id
    where d.province_id = ${provinceId} ${districtScope(jurisdiction)}
  `;
  return { data, total: count[0].total };
};

export const findDistrictById = async (id, jurisdiction) => {
  const rows = await sql`
    select d.id, d.code, d.name, d.province_id, d.created_at,
      p.code as province_code, p.name as province_name
    from public.districts d
    join public.provinces p on p.id = d.province_id
    where d.id = ${id} ${districtScope(jurisdiction)}
    limit 1
  `;
  return rows[0] || null;
};

export const findSubstationsByDistrict = async (
  districtId,
  { page = 1, limit = 20, jurisdiction } = {}
) => {
  const offset = (page - 1) * limit;
  const data = await sql`
    select g.id, g.code, g.name, g.latitude, g.longitude, g.voltage_kv,
      g.is_active, g.district_id, g.created_at,
      d.name as district_name, d.province_id,
      p.name as province_name, p.code as province_code
    from public.grid_substations g
    join public.districts d on d.id = g.district_id
    join public.provinces p on p.id = d.province_id
    where g.district_id = ${districtId} ${districtScope(jurisdiction)}
    order by g.name, g.id
    limit ${limit} offset ${offset}
  `;
  const count = await sql`
    select count(*)::int as total
    from public.grid_substations g
    join public.districts d on d.id = g.district_id
    join public.provinces p on p.id = d.province_id
    where g.district_id = ${districtId} ${districtScope(jurisdiction)}
  `;
  return { data, total: count[0].total };
};

export const findSubstationById = async (id, jurisdiction) => {
  const rows = await sql`
    select g.id, g.code, g.name, g.latitude, g.longitude, g.voltage_kv,
      g.is_active, g.district_id, g.created_at,
      d.name as district_name, d.province_id,
      p.name as province_name, p.code as province_code
    from public.grid_substations g
    join public.districts d on d.id = g.district_id
    join public.provinces p on p.id = d.province_id
    where g.id = ${id} ${districtScope(jurisdiction)}
    limit 1
  `;
  return rows[0] || null;
};
