# OIDC JWT authentication

## Runtime configuration

Business routes fail closed when the OIDC resource-server configuration is
missing or invalid. The root information route, Swagger UI, and health routes
remain public.

| Variable | Required | Purpose |
| --- | --- | --- |
| `AUTH_ISSUER` | Yes | Exact expected `iss` value from the approved issuer. |
| `AUTH_AUDIENCE` | Yes | Audience this API accepts. |
| `AUTH_JWKS_URL` | Yes | HTTPS URL returning the issuer's public JWKS. |
| `AUTH_ALLOWED_ALGORITHMS` | No | Comma-separated asymmetric algorithms. Defaults to `RS256,ES256`; other algorithms are rejected. |
| `AUTH_CLOCK_TOLERANCE_SECONDS` | No | Allowed clock skew from 0 to 120 seconds. Defaults to 5. |

These are resource-server verification settings. Do not put device client
secrets, private signing keys, access tokens, or refresh tokens in this API's
configuration. Configure issuer-side credentials through the issuer's
approved secret-management process.

The API validates the signature using the configured JWKS and checks issuer,
audience, expiry, subject, not-before when present, and the configured signing
algorithm. Remote JWKS keys are cached for up to five minutes. Missing
configuration returns 503 for business routes; absent, malformed, or invalid
tokens return 401. A JWKS timeout or invalid JWKS returns 503. Responses do
not include token values or verification internals.

Revoking a device client prevents it from obtaining future tokens. An already
issued JWT remains usable until its expiry unless the issuer's signing key is
rotated. Use short token lifetimes for devices. This API does not yet maintain
a per-token revocation list.

The supplied Supabase Auth discovery metadata currently advertises
`authorization_code` and `refresh_token`, not `client_credentials`. It must
not be configured as the per-device machine-token issuer for the chosen
client-credentials flow. An approved compatible OIDC issuer is still required
before deployment.

## Signed access-token claim contract

The issuer must add these claims to signed API access tokens using issuer-owned
client metadata or server-side identity records. The API does not trust
user-editable profile metadata for authorization.

All tokens require the standard `iss`, `aud`, `exp`, and `sub` claims. `nbf`,
when present, is validated. The API also requires:

| Claim | Type | Meaning |
| --- | --- | --- |
| `actor_type` | string | `device`, `analyst`, or `registry_admin`. |
| `installation_id` | UUID; device only | The one installation the device can submit readings for. |
| `jurisdiction` | object; analyst only | `{ "level": "national" }`, or `{ "level": "province", "id": "<UUID>" }`, or `{ "level": "district", "id": "<UUID>" }`. |

Use a distinct OIDC client identity per physical device. Provision each client
against exactly one installation, issue short-lived access tokens, and define
credential rotation and revocation at the issuer. Do not reuse a fleet-wide
client credential.

## Current route permissions

| Caller | Allowed now | Denied now |
| --- | --- | --- |
| Device | `POST /api/v1/sites/{installationId}/generation` when the path UUID matches the signed `installation_id`. | Other reads, other installation writes, site administration, and weather writes. |
| National analyst | GET site, generation, weather, and forecast resources. | All writes. |
| Provincial or district analyst | None of the legacy site-based reads until geographic relationships and scoped queries exist. | Current legacy reads and all writes. |
| Registry administrator | GET, create sites, update sites; POST weather observations only with the signed OAuth scope `weather:write`. | Site deletion until database history-retention protection exists; weather writes without `weather:write`. |

The hierarchy schema and authoritative mapping are not yet implemented. The
API therefore denies regional analyst reads instead of returning data without
verifiable jurisdiction filtering. Do not deploy production tokens or rely on
these permissions as complete jurisdiction isolation until the geographic
resources and database access controls are implemented and tested.
