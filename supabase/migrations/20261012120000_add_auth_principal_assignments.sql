-- Server-managed authorization assignments for verified OIDC identities.
-- Provision rows through a trusted administrative process; never from API claims.
CREATE TABLE public.auth_principal_assignments (
    issuer text NOT NULL,
    subject text NOT NULL,
    actor_type text NOT NULL
        CHECK (actor_type IN ('analyst', 'device', 'registry_admin')),
    installation_id uuid REFERENCES public.solar_sites(id) ON DELETE RESTRICT,
    jurisdiction_level text
        CHECK (jurisdiction_level IN ('national', 'province', 'district')),
    jurisdiction_id uuid,
    can_write_weather boolean NOT NULL DEFAULT false,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (issuer, subject),
    CONSTRAINT auth_principal_assignment_shape CHECK (
        (actor_type = 'device'
            AND installation_id IS NOT NULL
            AND jurisdiction_level IS NULL
            AND jurisdiction_id IS NULL
            AND NOT can_write_weather)
        OR (actor_type = 'analyst'
            AND installation_id IS NULL
            AND jurisdiction_level IS NOT NULL
            AND ((jurisdiction_level = 'national' AND jurisdiction_id IS NULL)
                 OR (jurisdiction_level IN ('province', 'district')
                     AND jurisdiction_id IS NOT NULL))
            AND NOT can_write_weather)
        OR (actor_type = 'registry_admin'
            AND installation_id IS NULL
            AND jurisdiction_level IS NULL
            AND jurisdiction_id IS NULL)
    )
);

CREATE INDEX auth_principal_assignments_active_idx
    ON public.auth_principal_assignments (issuer, subject)
    WHERE is_active;

ALTER TABLE public.auth_principal_assignments ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.auth_principal_assignments
    FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.auth_principal_assignments TO service_role;

CREATE TRIGGER auth_principal_assignments_updated_at
BEFORE UPDATE ON public.auth_principal_assignments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
