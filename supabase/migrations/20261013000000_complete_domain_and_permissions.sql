ALTER TABLE public.solar_sites ADD COLUMN deleted_at timestamptz, ADD COLUMN revision integer NOT NULL DEFAULT 1;
CREATE FUNCTION public.bump_site_revision() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.revision := OLD.revision + 1; RETURN NEW; END; $$;
CREATE TRIGGER site_revision BEFORE UPDATE ON public.solar_sites
FOR EACH ROW EXECUTE FUNCTION public.bump_site_revision();
ALTER TABLE public.auth_principal_assignments
  ADD COLUMN province_id uuid REFERENCES public.provinces(id) ON DELETE RESTRICT,
  ADD COLUMN district_id uuid REFERENCES public.districts(id) ON DELETE RESTRICT,
  ADD COLUMN permissions text[] NOT NULL DEFAULT '{}';
UPDATE public.auth_principal_assignments SET
  province_id = CASE WHEN jurisdiction_level = 'province' THEN jurisdiction_id END,
  district_id = CASE WHEN jurisdiction_level = 'district' THEN jurisdiction_id END,
  permissions = CASE actor_type
    WHEN 'analyst' THEN ARRAY['data:read']
    WHEN 'device' THEN ARRAY['readings:write']
    ELSE ARRAY['data:read','installations:manage'] END;
ALTER TABLE public.auth_principal_assignments ADD CONSTRAINT jurisdiction_reference_valid CHECK (
  (jurisdiction_level IS DISTINCT FROM 'province' OR (province_id IS NOT NULL AND province_id = jurisdiction_id))
  AND (jurisdiction_level IS DISTINCT FROM 'district' OR (district_id IS NOT NULL AND district_id = jurisdiction_id))
  AND (jurisdiction_level IS NOT DISTINCT FROM 'province' OR province_id IS NULL)
  AND (jurisdiction_level IS NOT DISTINCT FROM 'district' OR district_id IS NULL)
);
-- User is the human subset of externally authenticated principals, not a device entity.
CREATE VIEW public.users WITH (security_invoker = true) AS
SELECT issuer, subject, actor_type AS role, jurisdiction_level, province_id, district_id,
  is_active, created_at, updated_at
FROM public.auth_principal_assignments WHERE actor_type IN ('analyst', 'registry_admin');
REVOKE ALL ON public.users FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.users TO service_role;
-- Prevent a physical installation delete from cascading into immutable history.
ALTER TABLE public.solar_generation DROP CONSTRAINT solar_generation_site_id_fkey;
ALTER TABLE public.solar_generation ADD CONSTRAINT solar_generation_site_id_fkey
  FOREIGN KEY (site_id) REFERENCES public.solar_sites(id) ON DELETE RESTRICT;
CREATE FUNCTION public.protect_generation_history() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Generation history is append-only' USING ERRCODE = '23514';
END; $$;
CREATE TRIGGER generation_history_immutable BEFORE UPDATE OR DELETE ON public.solar_generation
FOR EACH ROW EXECUTE FUNCTION public.protect_generation_history();
-- Existing historical rows are preserved. New measurements must be complete.
ALTER TABLE public.solar_generation ADD CONSTRAINT new_readings_complete
  CHECK (power_kw IS NOT NULL AND energy_kwh IS NOT NULL AND voltage_v IS NOT NULL) NOT VALID;

-- Preserve legacy readings without pretending their energy was cumulative.
ALTER TABLE public.solar_generation ADD COLUMN energy_semantics text NOT NULL DEFAULT 'legacy_unspecified'
  CHECK (energy_semantics IN ('legacy_unspecified', 'cumulative'));
ALTER TABLE public.solar_generation ALTER COLUMN energy_semantics SET DEFAULT 'cumulative';
