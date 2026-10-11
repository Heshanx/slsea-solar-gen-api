-- Store the meter/inverter identifier on each installation.
ALTER TABLE public.solar_sites
    ADD COLUMN meter_inverter_id text;

-- A supplied identifier must not be blank.
ALTER TABLE public.solar_sites
    ADD CONSTRAINT solar_sites_meter_inverter_id_not_blank
    CHECK (
        meter_inverter_id IS NULL
        OR length(btrim(meter_inverter_id)) > 0
    );

-- Prevent two installations from using the same identifier.
CREATE UNIQUE INDEX solar_sites_meter_inverter_id_unique
    ON public.solar_sites (meter_inverter_id)
    WHERE meter_inverter_id IS NOT NULL;

-- Store the voltage associated with each generation reading, in volts.
-- Keep it nullable during the API update so the migration is backward-compatible.
ALTER TABLE public.solar_generation
    ADD COLUMN voltage_v numeric(8,2);

ALTER TABLE public.solar_generation
    ADD CONSTRAINT solar_generation_voltage_positive
    CHECK (voltage_v IS NULL OR voltage_v > 0);

-- Existing records are development/demo data, so use an explicitly documented
-- placeholder rather than presenting it as a verified historical measurement.
UPDATE public.solar_generation
SET voltage_v = 400.00
WHERE voltage_v IS NULL;

COMMENT ON COLUMN public.solar_generation.voltage_v IS
    'Voltage in volts. Existing legacy rows were backfilled with a 400 V demo placeholder; this is not a verified historical measurement.';