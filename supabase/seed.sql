-- SLSEA Solar Generation API: geographic reference data only.
-- Source: Sri Lanka Department of Census and Statistics, administrative divisions.
-- https://www.statistics.gov.lk/qlink/AdminDivCode
-- Verified 2026-10-13. Codes below are application identifiers, not official DCS codes.
-- No substations, installations or measurements are invented or seeded.
-- Import those only from verified operator records and actual meter exports.
-- This seed is non-destructive; existing demo data needs the separate cleanup script.

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

COMMIT;

