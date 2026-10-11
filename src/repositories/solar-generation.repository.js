import sql from "../config/database.js";
import { AppError } from "../utils/AppError.js";

export const findById = async (id, siteId) => {
  const result = await sql`
    select
      id,
      site_id,
      recorded_at,
      power_kw,
      energy_kwh,
      voltage_v,
      energy_semantics,
      created_at
    from public.solar_generation
    where id = ${id}
      and site_id = ${siteId}
    limit 1
  `;

  return result[0] || null;
};

export const findLatestBySite = async (siteId) => {
  const result = await sql`
    select
      id,
      site_id,
      recorded_at,
      power_kw,
      energy_kwh,
      voltage_v,
      energy_semantics,
      created_at
    from public.solar_generation
    where site_id = ${siteId} and recorded_at <= now()
    order by recorded_at desc, id desc
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
    to,
    sort = "desc"
  } = {}
) => {
  const offset = (page - 1) * limit;
  const orderBy = sort === "asc"
    ? sql`recorded_at asc, id asc`
    : sql`recorded_at desc, id desc`;

  const result = await sql`
    select
      id,
      site_id,
      recorded_at,
      power_kw,
      energy_kwh,
      voltage_v,
      energy_semantics,
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
    order by ${orderBy}
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
  energyKwh,
  voltageV
}) => {
  try {
    return await sql.begin(async tx => {
      const sites = await tx`select id from public.solar_sites
        where id = ${siteId} and deleted_at is null and is_active for share`;
      if (!sites[0]) throw new AppError("Active solar site not found", 404);
      const result = await tx`
    insert into public.solar_generation (
      site_id,
      recorded_at,
      power_kw,
      energy_kwh,
      voltage_v
    )
    values (
      ${siteId},
      ${recordedAt},
      ${powerKw ?? null},
      ${energyKwh ?? null},
      ${voltageV}
    )
    returning
      id,
      site_id,
      recorded_at,
      power_kw,
      energy_kwh,
      voltage_v,
      energy_semantics,
      created_at
    `;

      return result[0];
    });
  } catch (error) {
    if (error.code === "23505") {
      throw new AppError(
        "A generation reading already exists for this installation and timestamp",
        409
      );
    }
    throw error;
  }
};
