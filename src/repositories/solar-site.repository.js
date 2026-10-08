import sql from "../config/database.js";

export const findAll = async ({
  page = 1,
  limit = 20,
  active
} = {}) => {
  const offset = (page - 1) * limit;

  const result = await sql`
    select
      id,
      name,
      location,
      latitude,
      longitude,
      capacity_kw,
      timezone,
      is_active,
      created_at,
      updated_at
    from public.solar_sites
    ${
      active === undefined
        ? sql``
        : sql`where is_active = ${active}`
    }
    order by created_at desc
    limit ${limit}
    offset ${offset}
  `;

  const countResult = await sql`
    select count(*)::int as total
    from public.solar_sites
    ${
      active === undefined
        ? sql``
        : sql`where is_active = ${active}`
    }
  `;

  return {
    data: result,
    total: countResult[0].total
  };
};

export const findById = async (id) => {
  const result = await sql`
    select
      id,
      name,
      location,
      latitude,
      longitude,
      capacity_kw,
      timezone,
      is_active,
      created_at,
      updated_at
    from public.solar_sites
    where id = ${id}
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
  timezone
}) => {
  const result = await sql`
    insert into public.solar_sites (
      name,
      location,
      latitude,
      longitude,
      capacity_kw,
      timezone
    )
    values (
      ${name},
      ${location},
      ${latitude},
      ${longitude},
      ${capacityKw},
      ${timezone}
    )
    returning
      id,
      name,
      location,
      latitude,
      longitude,
      capacity_kw,
      timezone,
      is_active,
      created_at,
      updated_at
  `;

  return result[0];
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
    isActive
  }
) => {
  const result = await sql`
    update public.solar_sites
    set
      name = ${name},
      location = ${location},
      latitude = ${latitude},
      longitude = ${longitude},
      capacity_kw = ${capacityKw},
      timezone = ${timezone},
      is_active = ${isActive}
    where id = ${id}
    returning
      id,
      name,
      location,
      latitude,
      longitude,
      capacity_kw,
      timezone,
      is_active,
      created_at,
      updated_at
  `;

  return result[0] || null;
};

export const remove = async (id) => {
  const result = await sql`
    delete from public.solar_sites
    where id = ${id}
    returning id
  `;

  return result[0] || null;
};