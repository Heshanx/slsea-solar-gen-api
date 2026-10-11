
import sql from "../config/database.js";
import { AppError } from "../utils/AppError.js";

export const findById = async (id, siteId) => {
  const result = await sql`
    select
      id,
      site_id,
      recorded_at,
      temperature_c,
      irradiance_w_m2,
      cloud_cover_percent,
      wind_speed_ms,
      humidity_percent,
      created_at
    from public.weather_data
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
      temperature_c,
      irradiance_w_m2,
      cloud_cover_percent,
      wind_speed_ms,
      humidity_percent,
      created_at
    from public.weather_data
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
    order by recorded_at desc, id desc
    limit ${limit}
    offset ${offset}
  `;

  const countResult = await sql`
    select count(*)::int as total
    from public.weather_data
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
  temperatureC,
  irradianceWM2,
  cloudCoverPercent,
  windSpeedMs,
  humidityPercent
}) => {
  return sql.begin(async tx => {
  const sites = await tx`select id from public.solar_sites
    where id = ${siteId} and deleted_at is null and is_active for share`;
  if (!sites[0]) throw new AppError("Active solar site not found", 404);
  const result = await tx`
    insert into public.weather_data (
      site_id,
      recorded_at,
      temperature_c,
      irradiance_w_m2,
      cloud_cover_percent,
      wind_speed_ms,
      humidity_percent
    )
    values (
      ${siteId},
      ${recordedAt},
      ${temperatureC ?? null},
      ${irradianceWM2 ?? null},
      ${cloudCoverPercent ?? null},
      ${windSpeedMs ?? null},
      ${humidityPercent ?? null}
    )
    returning
      id,
      site_id,
      recorded_at,
      temperature_c,
      irradiance_w_m2,
      cloud_cover_percent,
      wind_speed_ms,
      humidity_percent,
      created_at
  `;

  return result[0];
  });
};
