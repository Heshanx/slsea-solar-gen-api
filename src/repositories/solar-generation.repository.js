import sql from "../config/database.js";

export const findById = async (id, siteId) => {
  const result = await sql`
    select
      id,
      site_id,
      recorded_at,
      power_kw,
      energy_kwh,
      created_at
    from public.solar_generation
    where id = ${id}
      and site_id = ${siteId}
    limit 1
  `;

  return result[0] || null;
};

export const findAllBySite = async (
  siteId,
  {
    page = 1,
    limit = 50,
    from,
    to
  } = {}
) => {
  const offset = (page - 1) * limit;

  const result = await sql`
    select
      id,
      site_id,
      recorded_at,
      power_kw,
      energy_kwh,
      created_at
    from public.solar_generation
    where site_id = ${siteId}
      ${
        from
          ? sql`and recorded_at >= ${from}`
          : sql``
      }
      ${
        to
          ? sql`and recorded_at <= ${to}`
          : sql``
      }
    order by recorded_at desc
    limit ${limit}
    offset ${offset}
  `;

  const countResult = await sql`
    select count(*)::int as total
    from public.solar_generation
    where site_id = ${siteId}
      ${
        from
          ? sql`and recorded_at >= ${from}`
          : sql``
      }
      ${
        to
          ? sql`and recorded_at <= ${to}`
          : sql``
      }
  `;

  return {
    data: result,
    total: countResult[0].total
  };
};

export const create = async ({
  siteId,
  recordedAt,
  powerKw,
  energyKwh
}) => {
  const result = await sql`
    insert into public.solar_generation (
      site_id,
      recorded_at,
      power_kw,
      energy_kwh
    )
    values (
      ${siteId},
      ${recordedAt},
      ${powerKw},
      ${energyKwh}
    )
    returning
      id,
      site_id,
      recorded_at,
      power_kw,
      energy_kwh,
      created_at
  `;

  return result[0];
};