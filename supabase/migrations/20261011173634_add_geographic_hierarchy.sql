-- Geographic hierarchy: provinces -> districts -> substations
-- Existing solar_sites UUIDs and observation foreign keys are preserved.

CREATE TABLE public.provinces (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL UNIQUE,
    name text NOT NULL UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.districts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    province_id uuid NOT NULL
        REFERENCES public.provinces(id) ON DELETE RESTRICT,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT districts_province_name_unique
        UNIQUE (province_id, name)
);

CREATE TABLE public.grid_substations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    district_id uuid NOT NULL
        REFERENCES public.districts(id) ON DELETE RESTRICT,
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    latitude numeric(9,6),
    longitude numeric(9,6),
    voltage_kv numeric(8,2),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT substations_latitude_valid
        CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),

    CONSTRAINT substations_longitude_valid
        CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),

    CONSTRAINT substations_voltage_positive
        CHECK (voltage_kv IS NULL OR voltage_kv > 0)
);

-- Extend the existing solar_sites table rather than replacing it.
ALTER TABLE public.solar_sites
    ADD COLUMN installation_code text,
    ADD COLUMN substation_id uuid
        REFERENCES public.grid_substations(id) ON DELETE RESTRICT,
    ADD COLUMN installation_type text,
    ADD COLUMN operator_name text,
    ADD COLUMN commissioned_at date;

-- Allow existing rows to remain temporarily unassigned.
-- Require unique installation codes whenever one is provided.
CREATE UNIQUE INDEX solar_sites_installation_code_unique
    ON public.solar_sites (installation_code)
    WHERE installation_code IS NOT NULL;

-- Indexes for geographic joins and regional queries.
CREATE INDEX districts_province_id_idx
    ON public.districts (province_id);

CREATE INDEX grid_substations_district_id_idx
    ON public.grid_substations (district_id);

CREATE INDEX solar_sites_substation_id_idx
    ON public.solar_sites (substation_id);

-- Enable RLS on the new tables, consistent with the existing schema.
ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grid_substations ENABLE ROW LEVEL SECURITY;