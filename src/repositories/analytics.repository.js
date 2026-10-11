import sql from "../config/database.js";
const filters = o => sql`
  and s.deleted_at is null
  ${o.provinceId ? sql`and p.id = ${o.provinceId}` : sql``}
  ${o.districtId ? sql`and d.id = ${o.districtId}` : sql``}
  ${o.substationId ? sql`and g.id = ${o.substationId}` : sql``}
  ${o.installationId ? sql`and s.id = ${o.installationId}` : sql``}
  ${o.from ? sql`and r.recorded_at >= ${o.from}` : sql``}
  ${o.to ? sql`and r.recorded_at <= ${o.to}` : sql``}
  ${o.jurisdiction?.level === 'province' ? sql`and p.id = ${o.jurisdiction.id}` : sql``}
  ${o.jurisdiction?.level === 'district' ? sql`and d.id = ${o.jurisdiction.id}` : sql``}
`;
const joins = sql`from public.solar_generation r
 join public.solar_sites s on s.id = r.site_id
 join public.grid_substations g on g.id = s.substation_id
 join public.districts d on d.id = g.district_id
 join public.provinces p on p.id = d.province_id`;
export const findReadings = async o => {
  const order = o.sort === 'asc' ? sql`r.recorded_at asc, r.id asc` : sql`r.recorded_at desc, r.id desc`;
  const data = await sql`select r.* ${joins} where true ${filters(o)}
    order by ${order} limit ${o.limit} offset ${(o.page - 1) * o.limit}`;
  const count = await sql`select count(*)::int as total ${joins} where true ${filters(o)}`;
  return { data, total: count[0].total };
};
export const districtSummary = async (districtId, asOf) => {
  // One statement gives a consistent snapshot. Sri Lankan day boundaries are explicit.
  const rows = await sql`
    with bounds as (
      select ${asOf}::timestamptz as as_of,
       date_trunc('day', ${asOf}::timestamptz at time zone 'Asia/Colombo')
        at time zone 'Asia/Colombo' as day_start
    ), assets as (
      select s.id, latest.power_kw, latest.recorded_at,
        base.energy_kwh as baseline_energy, latest.energy_kwh as ending_energy,
        base.recorded_at as baseline_at, b.day_start,
        (base.energy_semantics = 'cumulative' and latest.energy_semantics = 'cumulative') as cumulative_known,
        exists (select 1 from (
          select energy_kwh, lag(energy_kwh) over (order by recorded_at, id) as prior
          from public.solar_generation where site_id = s.id
           and recorded_at >= coalesce(base.recorded_at, b.day_start) and recorded_at <= b.as_of
        ) counters where energy_kwh < prior) as counter_reset
      from public.solar_sites s
      join public.grid_substations g on g.id = s.substation_id
      cross join bounds b
      left join lateral (
        select power_kw, energy_kwh, recorded_at, energy_semantics from public.solar_generation
        where site_id = s.id and recorded_at <= b.as_of
        order by recorded_at desc, id desc limit 1
      ) latest on true
      left join lateral (
        select energy_kwh, recorded_at, energy_semantics from public.solar_generation
        where site_id = s.id and recorded_at <= b.day_start
        order by recorded_at desc, id desc limit 1
      ) base on true
      where g.district_id = ${districtId} and s.deleted_at is null and s.is_active
    )
    select count(*)::int as installation_count,
      count(recorded_at)::int as reporting_count,
      count(*) filter (where recorded_at < (select as_of from bounds) - interval '30 minutes')::int as stale_count,
      coalesce(sum(power_kw), 0) as last_known_total_power_kw,
      coalesce(sum(ending_energy - baseline_energy) filter (
        where cumulative_known and baseline_energy is not null and baseline_at = day_start and recorded_at >= day_start
         and ending_energy is not null and not counter_reset
         and ending_energy >= baseline_energy), 0) as known_energy_today_kwh,
      count(*) filter (where cumulative_known is not true or baseline_energy is null or baseline_at != day_start or recorded_at < day_start
         or ending_energy is null or counter_reset
         or ending_energy < baseline_energy)::int as incomplete_energy_count
    from assets`;
  return rows[0];
};
