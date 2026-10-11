
-- SLSEA Solar Generation API
-- SYNTHETIC DEMONSTRATION DATA ONLY.
-- Substation locations and generation measurements are illustrative,
-- not verified SLSEA or grid-operator records.
--
-- Target: 9 provinces, 25 districts, 25 demo substations,
-- 200 installations, and 7 days of 15-minute readings per installation.

BEGIN;

-- 1. Provinces
INSERT INTO public.provinces (code, name)
VALUES
    ('WP',  'Western'),
    ('CP',  'Central'),
    ('SP',  'Southern'),
    ('NP',  'Northern'),
    ('EP',  'Eastern'),
    ('NWP', 'North Western'),
    ('NCP', 'North Central'),
    ('UP',  'Uva'),
    ('SG',  'Sabaragamuwa')
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name;

-- 2. Districts: all 25 districts of Sri Lanka
INSERT INTO public.districts (province_id, code, name)
SELECT p.id, d.code, d.name
FROM (
    VALUES
        ('COL', 'Colombo',       'WP'),
        ('GAM', 'Gampaha',       'WP'),
        ('KAL', 'Kalutara',      'WP'),

        ('KAN', 'Kandy',         'CP'),
        ('MAT', 'Matale',        'CP'),
        ('NUE', 'Nuwara Eliya',  'CP'),

        ('GAL', 'Galle',         'SP'),
        ('MAR', 'Matara',        'SP'),
        ('HAM', 'Hambantota',    'SP'),

        ('JAF', 'Jaffna',        'NP'),
        ('KIL', 'Kilinochchi',   'NP'),
        ('MAN', 'Mannar',        'NP'),
        ('MUL', 'Mullaitivu',    'NP'),
        ('VAV', 'Vavuniya',      'NP'),

        ('BAT', 'Batticaloa',    'EP'),
        ('AMP', 'Ampara',        'EP'),
        ('TRI', 'Trincomalee',   'EP'),

        ('KUR', 'Kurunegala',    'NWP'),
        ('PUT', 'Puttalam',      'NWP'),

        ('ANU', 'Anuradhapura',  'NCP'),
        ('POL', 'Polonnaruwa',   'NCP'),

        ('BAD', 'Badulla',       'UP'),
        ('MON', 'Monaragala',    'UP'),

        ('RAT', 'Ratnapura',     'SG'),
        ('KEG', 'Kegalle',       'SG')
) AS d(code, name, province_code)
JOIN public.provinces p ON p.code = d.province_code
ON CONFLICT (code) DO UPDATE
SET
    province_id = EXCLUDED.province_id,
    name = EXCLUDED.name;

-- 3. One illustrative demo substation per district.
-- Coordinates are approximate district-level examples, not verified
-- substation locations. All records are explicitly named DEMO.
INSERT INTO public.grid_substations (
    district_id,
    code,
    name,
    latitude,
    longitude,
    voltage_kv,
    is_active
)
SELECT
    d.id,
    'DEMO-SUB-' || v.district_code || '-01',
    'DEMO Substation - ' || d.name || ' District (synthetic)',
    v.latitude,
    v.longitude,
    33.00,
    true
FROM (
    VALUES
        ('COL',  6.9271, 79.8612),
        ('GAM',  7.0873, 80.0144),
        ('KAL',  6.5854, 79.9607),

        ('KAN',  7.2906, 80.6337),
        ('MAT',  7.4675, 80.6234),
        ('NUE',  6.9497, 80.7891),

        ('GAL',  6.0535, 80.2210),
        ('MAR',  5.9549, 80.5550),
        ('HAM',  6.1429, 81.1212),

        ('JAF',  9.6615, 80.0255),
        ('KIL',  9.3803, 80.3770),
        ('MAN',  8.9810, 79.9044),
        ('MUL',  9.2671, 80.8142),
        ('VAV',  8.7542, 80.4982),

        ('BAT',  7.7310, 81.6747),
        ('AMP',  7.2912, 81.6724),
        ('TRI',  8.5874, 81.2152),

        ('KUR',  7.4818, 80.3609),
        ('PUT',  8.0362, 79.8283),

        ('ANU',  8.3114, 80.4037),
        ('POL',  7.9397, 81.0003),

        ('BAD',  6.9934, 81.0550),
        ('MON',  6.8728, 81.3507),

        ('RAT',  6.6828, 80.3992),
        ('KEG',  7.2513, 80.3464)
) AS v(district_code, latitude, longitude)
JOIN public.districts d ON d.code = v.district_code
ON CONFLICT (code) DO UPDATE
SET
    district_id = EXCLUDED.district_id,
    name = EXCLUDED.name,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    voltage_kv = EXCLUDED.voltage_kv,
    is_active = EXCLUDED.is_active;

-- 4. Preserve and assign the existing demo site's UUID.
-- Do not delete or recreate this row.
UPDATE public.solar_sites
SET
    installation_code = 'DEMO-SITE-001',
    substation_id = (
        SELECT id
        FROM public.grid_substations
        WHERE code = 'DEMO-SUB-COL-01'
    ),
    installation_type = 'rooftop_solar',
    operator_name = 'Synthetic Demo Operator',
    commissioned_at = DATE '2025-01-01',
    meter_inverter_id = 'DEMO-METER-001'
WHERE id = '588f49ed-0b04-43b0-9617-d078af39e321';

-- 5. Create installations 2 through 200.
-- Districts are distributed across all 25 districts.
-- Existing seeded codes are not duplicated on reruns.
WITH numbered_districts AS (
    SELECT
        d.id AS district_id,
        d.name AS district_name,
        d.code AS district_code,
        s.id AS substation_id,
        s.latitude AS substation_latitude,
        s.longitude AS substation_longitude,
        row_number() OVER (ORDER BY d.code) AS district_number
    FROM public.districts d
    JOIN public.grid_substations s
      ON s.district_id = d.id
     AND s.code = 'DEMO-SUB-' || d.code || '-01'
),
generated_sites AS (
    SELECT
        n AS site_number,
        d.*
    FROM generate_series(2, 200) AS g(n)
    JOIN numbered_districts d
      ON d.district_number = ((g.n - 2) % 25) + 1
)
INSERT INTO public.solar_sites (
    name,
    location,
    latitude,
    longitude,
    capacity_kw,
    timezone,
    is_active,
    installation_code,
    substation_id,
    installation_type,
    operator_name,
    commissioned_at,
    meter_inverter_id
)
SELECT
    'Synthetic Solar Installation ' || site_number,
    district_name || ', Sri Lanka',
    round(
        (substation_latitude
         + ((site_number % 7) - 3) * 0.001)::numeric,
        6
    ),
    round(
        (substation_longitude
         + ((site_number % 9) - 4) * 0.001)::numeric,
        6
    ),
    (5 + ((site_number * 37) % 196))::numeric(12,3),
    'Asia/Colombo',
    true,
    'DEMO-SITE-' || lpad(site_number::text, 3, '0'),
    substation_id,
    CASE
        WHEN 5 + ((site_number * 37) % 196) >= 100
            THEN 'solar_farm'
        WHEN 5 + ((site_number * 37) % 196) >= 25
            THEN 'commercial_solar'
        ELSE 'rooftop_solar'
    END,
    'Synthetic Demo Operator',
    DATE '2022-01-01' + ((site_number * 17) % 1700),
    'DEMO-METER-' || lpad(site_number::text, 3, '0')
FROM generated_sites
ON CONFLICT DO NOTHING;

-- 6. Generate 7 complete days of readings at 15-minute intervals.
-- This produces 672 timestamps per seeded installation.
-- Use the latest seven completed Sri Lankan calendar days.
WITH time_points AS (
    SELECT generate_series(
        (
            date_trunc(
                'day',
                now() AT TIME ZONE 'Asia/Colombo'
            ) - interval '7 days'
        ) AT TIME ZONE 'Asia/Colombo',
        (
            date_trunc(
                'day',
                now() AT TIME ZONE 'Asia/Colombo'
            ) - interval '15 minutes'
        ) AT TIME ZONE 'Asia/Colombo',
        interval '15 minutes'
    ) AS recorded_at
),
site_times AS (
    SELECT
        s.id AS site_id,
        s.capacity_kw,
        t.recorded_at,
        EXTRACT(
            HOUR FROM t.recorded_at AT TIME ZONE 'Asia/Colombo'
        )
        + EXTRACT(
            MINUTE FROM t.recorded_at AT TIME ZONE 'Asia/Colombo'
        ) / 60.0 AS local_hour,
        EXTRACT(
            DOY FROM t.recorded_at AT TIME ZONE 'Asia/Colombo'
        )::integer AS day_of_year
    FROM public.solar_sites s
    CROSS JOIN time_points t
    WHERE s.installation_code LIKE 'DEMO-SITE-%'
),
solar_curve AS (
    SELECT
        *,
        CASE
            WHEN local_hour >= 6 AND local_hour < 18
                THEN sin(pi() * (local_hour - 6) / 12.0)
            ELSE 0.0
        END AS daylight_factor,
        (
            0.88
            + (
                (day_of_year + mod(capacity_kw::integer, 7)) % 5
            ) * 0.03
        ) AS daily_factor
    FROM site_times
),
calculated_readings AS (
    SELECT
        site_id,
        recorded_at,
        round(
            (
                capacity_kw
                * daylight_factor
                * daily_factor
            )::numeric,
            3
        ) AS power_kw,
        round(
            (
                capacity_kw
                * daylight_factor
                * daily_factor
                * 0.25
            )::numeric,
            3
        ) AS energy_kwh,
        (
            CASE
                WHEN capacity_kw >= 50 THEN 400
                ELSE 230
            END
            + mod(
                EXTRACT(
                    HOUR FROM recorded_at AT TIME ZONE 'Asia/Colombo'
                )::integer
                + EXTRACT(
                    DAY FROM recorded_at AT TIME ZONE 'Asia/Colombo'
                )::integer,
                9
            ) - 4
        )::numeric(8,2) AS voltage_v
    FROM solar_curve
)
INSERT INTO public.solar_generation (
    site_id,
    recorded_at,
    power_kw,
    energy_kwh,
    voltage_v
)
SELECT
    site_id,
    recorded_at,
    power_kw,
    energy_kwh,
    voltage_v
FROM calculated_readings
ON CONFLICT (site_id, recorded_at) DO NOTHING;

COMMIT;
