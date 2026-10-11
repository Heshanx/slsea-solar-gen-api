-- One-time administrative cleanup of the supplied synthetic seed.
-- Back up first. Run separately from normal migrations/seed, as table owner.
-- All dependent data for matched demo installations is removed.
BEGIN;
SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '120s';
LOCK TABLE public.solar_sites, public.solar_generation, public.weather_data,
  public.forecasts, public.auth_principal_assignments, public.grid_substations
  IN ACCESS EXCLUSIVE MODE;

CREATE TEMP TABLE demo_site_ids ON COMMIT DROP AS
SELECT id FROM public.solar_sites
WHERE installation_code ~ '^DEMO-SITE-[0-9]{3}$'
  AND operator_name = 'Synthetic Demo Operator'
  AND meter_inverter_id = replace(installation_code, 'DEMO-SITE-', 'DEMO-METER-');

-- Only this history guard is suspended, within the locked transaction.
ALTER TABLE public.solar_generation DISABLE TRIGGER generation_history_immutable;
DELETE FROM public.solar_generation WHERE site_id IN (SELECT id FROM demo_site_ids);
ALTER TABLE public.solar_generation ENABLE TRIGGER generation_history_immutable;
DELETE FROM public.weather_data WHERE site_id IN (SELECT id FROM demo_site_ids);
DELETE FROM public.forecasts WHERE site_id IN (SELECT id FROM demo_site_ids);
DELETE FROM public.auth_principal_assignments WHERE installation_id IN (SELECT id FROM demo_site_ids);
DELETE FROM public.solar_sites WHERE id IN (SELECT id FROM demo_site_ids);
DELETE FROM public.grid_substations s
USING public.districts d
WHERE s.district_id = d.id
  AND s.code = 'DEMO-SUB-' || d.code || '-01'
  AND s.name = 'DEMO Substation - ' || d.name || ' District (synthetic)'
  AND NOT EXISTS (SELECT 1 FROM public.solar_sites site WHERE site.substation_id = s.id);
COMMIT;
