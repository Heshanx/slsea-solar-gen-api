# SLSEA Solar Generation API

REST API for solar installation metadata, generation readings, and weather observations.

The coursework core is installation management, geographic reads, generation history and the district summary. Weather observations and Open-Meteo weather forecasts are retained optional extensions; solar-generation prediction is not implemented. The unused `forecasts` table is a legacy schema artifact, not evidence of a prediction feature. Applied migrations are retained unchanged.

## Local setup

Requirements: Node.js 24 (pinned in `.node-version`). Docker and the Supabase CLI are needed for the optional local Supabase workflow below; the automated integration suite starts its own PostgreSQL 17 cluster.

1. Install dependencies: `npm ci`.
2. Copy `.env.example` to `.env` and set `DATABASE_URL` plus the Auth0 resource-server values. `AUTH_ISSUER`, `AUTH_AUDIENCE`, and `AUTH_JWKS_URL` must match the Auth0 API and tenant.
3. Start local Supabase: `npx supabase start`.
4. Apply migrations and geographic reference data locally: `npx supabase db reset`.
5. Set `DATABASE_URL` to the local database URL printed by Supabase (normally `postgresql://[REDACTED]@127.0.0.1:54322/postgres`).
6. Start the API: `npm run dev`. Swagger UI is at `http://localhost:5000/api/v1/docs`.

The production seed (`supabase/seed.sql`) upserts only the 9 provinces and 25 districts, using the Department of Census and Statistics administrative hierarchy (https://www.statistics.gov.lk/qlink/AdminDivCode). Codes are internal application identifiers, not official DCS codes. Substations, installations and readings remain empty until verified operator records are imported. Synthetic data lives only in `tests/fixtures/synthetic-seed.sql` for disposable integration tests.

## API behavior

Protected routes require an Auth0 signed access token. The API verifies its signature using the configured JWKS, issuer, audience, expiry, subject, and allowed algorithm. It then resolves the actor role and jurisdiction from `auth_principal_assignments` using the verified issuer and subject; token role and jurisdiction claims are not authorization sources. Device actors may submit readings only to their bound installation. Analyst reads are scoped to their assigned national, province, or district jurisdiction across sites, generation, and weather. Registry administrators manage installation metadata; weather writes require an explicit database grant.

## Auth0 and authorization setup

Keep the existing Auth0 tenant, custom API, and test analyst user. Configure the API to issue RS256 signed access tokens and use its exact API identifier as `AUTH_AUDIENCE`. Set `AUTH_ISSUER` to the tenant issuer URL including its trailing slash, and `AUTH_JWKS_URL` to that URL plus `.well-known/jwks.json`. Clients must request an access token for the custom API audience; do not send an ID token. Do not rely on Auth0 role or custom-claim Actions for API authorization.

For a browser-only analyst frontend, use an Auth0 **Single Page Application** and Authorization Code with PKCE (`S256`). A Regular Web Application is intended for an application with a server; never put its client secret in browser code. Set that SPA's Allowed Callback URLs, Allowed Logout URLs, and Allowed Web Origins to the actual frontend URLs once they exist. For interactive Postman testing, use Authorization Code with PKCE and add `https://oauth.pstmn.io/v1/callback` to the selected test client's Allowed Callback URLs. Both clients should request the custom API audience and use their returned access token as a bearer token. These are separate analyst clients; neither is a device identity. Auth0's documentation describes PKCE for SPAs and distinguishes server-side Regular Web Apps from browser SPAs ([PKCE flow](https://auth0.com/docs/get-started/authentication-and-authorization-flow/authorization-code-flow-with-pkce/add-login-using-the-authorization-code-flow-with-pkce), [application quickstarts](https://auth0.com/docs/microsites/add-login/add-login-regular-web-app)).

Set `AUTH_ISSUER`, `AUTH_AUDIENCE`, and `AUTH_JWKS_URL` in the server environment. Set `AUTH_ALLOWED_ALGORITHMS=RS256` and `AUTH_CLOCK_TOLERANCE_SECONDS=5`. Keep `DATABASE_URL` private and server-side. Apply all migrations before deploying this API version. Its database identity needs read access to `auth_principal_assignments`; only a trusted administrative process should change assignments.

Add an active database assignment for each human analyst, keyed by their exact Auth0 `sub` and issuer. Use `actor_type = 'analyst'`, `jurisdiction_level = 'national'` with no jurisdiction ID, or `province`/`district` with the corresponding `provinces.id`/`districts.id` UUID. For devices, create a separate Auth0 confidential client per installation using client credentials; map its exact token subject and issuer to `actor_type = 'device'` and the corresponding `solar_sites.id` in `installation_id`. Valid Auth0 identities without an active database assignment are denied. Set `is_active = false` to revoke an assignment without deleting sites or observations.

Auth0 client credentials are confidential: create one Machine-to-Machine application per meter/inverter, authorize each for this API, and keep each client secret on its device in protected storage. Request the same API audience. Auth0 documents Client Credentials for machine-to-machine clients ([Client Credentials flow](https://auth0.com/docs/get-started/authentication-and-authorization-flow/client-credentials-flow)).

The migration `20261012120000_add_auth_principal_assignments.sql` creates the assignment table. Keep the existing Auth0 test user and role membership; there is no need to revert them, but Auth0 role membership alone does not grant API access. Also assign the test user's exact issuer/`sub` the intended national/province/district analyst jurisdiction in the database. Do not store real secrets or access tokens in this repository.

Generation readings use ISO 8601 timestamps with a timezone. Voltage is required, positive, and expressed in volts (`voltageV`); power is kW and energy is a cumulative meter counter in kWh. All three measurements are required. Each installation can have one reading per timestamp. Duplicate writes return 409. Successful POST returns 201 and a relative `Location` header. Generation list responses are ordered by `recordedAt` and then ID (both ascending or descending), paginated with `page` and `limit` (maximum 100), and support inclusive `from`/`to` filters. The response ETag can be sent as `If-None-Match`; a match returns 304 with no response body.

Errors consistently use `{ "success": false, "error": { "code": "...", "message": "...", "details": null } }`; validation errors include field details. See the generated OpenAPI document through Swagger UI for endpoint schemas and status codes.

## Checks

Run `npm test` for unit/API middleware tests, `npm run test:openapi` for structural OpenAPI validation and `npm run test:integration` for real SQL/API tests. The integration command creates a temporary PostgreSQL 17 cluster bound to loopback, applies migrations and seeds, tests the API and a synthetic legacy upgrade, then stops/removes the cluster. It overrides database credentials before importing application code; it never reads production data. These checks do not prove deployed Auth0 or Supabase connectivity. GitHub Actions runs the same commands.

Remote database connections require verified TLS. With the current hosted-coursework `.env`, `npm run dev` blocks mutation requests at the API boundary. It also requests a read-only connection default, but the hosted pooler was observed not to retain that default; do not rely on it for direct scripts. Read-only diagnostics use explicit transactions or SELECT-only queries. Use a separate local Supabase database for interactive write testing; do not set `NODE_ENV=production` just to bypass the API safeguard. This supplements, but does not replace, a restricted database role. `node scripts/production-preflight.mjs` checks hosted TLS and schema/privilege metadata using a read-only transaction and prints no credentials. Supply the provider-issued CA through `DATABASE_SSL_CA` if required; never disable certificate verification.

See `verification/release-status.md` for evidence and outstanding external release/submission checks, and `verification/report-corrections.md` for the report reconciliation worksheet.

## AI disclosure and verification report

AI assistance was used to inspect and update API implementation, tests, and documentation. Generated demo readings and demo substation records are synthetic and illustrative; they are not official source data.

Local verification: `npm test` is the project test command. A live deployed health check, Swagger URL check, Supabase persistence check, and evidence capture must be recorded for the target deployment separately; this repository does not identify a deployment URL or provide deployment credentials.

## Completed coursework resources

- `GET /api/v1/readings`: `provinceId`, `districtId`, `substationId`, `installationId`, `from`, `to`, `page`, `limit`, `sort`. Filters intersect with assigned jurisdiction, including the returned total. Empty or out-of-scope searches return an empty collection.
- `GET /api/v1/sites/{id}/overview`: installation plus latest reading (`null` if no reading exists).
- `GET /api/v1/sites/{id}/generation/latest`: latest non-future reading; absent/inaccessible sites and absent readings return 404.
- `GET /api/v1/districts/{id}/generation-summary`: active assets and last-known power, with reporting/stale counts. A reading older than 30 minutes is stale. Daily cumulative-counter differences require an exact Sri Lankan midnight baseline and no detected counter decrease; incomplete assets are counted and excluded from the known energy subtotal. Do not describe the subtotal as a complete district total when `energyComplete` is false.
- `GET /api/v1/docs/openapi.json`: machine-readable specification.

`/sites` is the SolarInstallation resource. Its geography is embedded; `/overview` is the explicit composite. Global district/substation collections are scoped under their geographic parents.

Registry creation requires substation and meter identifiers and returns `201` with `Location`. Registry PUT is replacement; omitted optional values are cleared. GET an individual site for its strong ETag and Last-Modified. PUT and DELETE require `If-Match`: omitted -> 428, stale -> 412. Deletion is logical (`deleted_at`); normal reads hide the installation, device ingestion stops, and historical rows remain untouched. Database triggers prevent updating/deleting readings; the FK prevents cascading physical asset deletion. GET/DELETE remain idempotent in their state effects; repeating a successful deletion returns 404.

The new additive migration adds explicit province/district FKs, a `users` view of human principals, assignment `permissions`, and site revisions/tombstones. Existing active roles receive `data:read`, `readings:write`, or `installations:manage` as appropriate. Newly provisioned assignments must specify permissions and matching province_id/district_id plus jurisdiction_id. Human identity is `(issuer, subject)`; the User domain entity is implemented by a security-invoker view of human assignments. Meters remain installation attributes, not a Device entity. Test assignments are injected through a repository mock; production code never switches authorization to token claims for test environments.

## Migration and seed limits

Apply and verify migrations only against a disposable database first. Invalid old jurisdiction UUIDs deliberately fail the FK migration rather than being silently reassigned. Existing historical measurements are not converted. The new completeness CHECK is NOT VALID to preserve old rows, but enforces complete new measurements; validate it only after legacy data quality is assessed. The isolated synthetic test fixture creates installation 1 on a clean database and generates cumulative counters and seven complete days (200 assets / 134,400 rows). The synthetic cumulative baseline integrates the same daily curve from each installation's commission date. Reruns skip existing reading timestamps: they do not repair previously seeded interval-energy values. Regenerate corrected synthetic evidence in a clean disposable database. Do not reset the production database.

The hosted coursework database was upgraded through migration `20261013000000` after a recovery snapshot and local restore rehearsal. The current application revision has not been deployed by this work. Before release verify Render configuration, real Auth0 acceptance, the exact deployed commit and live Swagger. Current evidence and remaining dataset/report gaps are recorded in `verification/coursework-requirements-checklist.md`. A signed declaration, collaborator invitation and viva attendance remain external submission requirements.

Historical notes and the old Swagger source backup are archived under ignored `.local-archive/`. Current guidance is this README and `verification/`. Private hosted recovery snapshots remain under ignored `tmp/hosted-recovery/`; they are not disposable audit screenshots or files to publish.

## Disposable native PostgreSQL verification

For a downloaded Supabase CA certificate, set `DATABASE_SSL_CA_FILE="D:/WebAPI CW/prod-ca-2021.crt"` in the ignored local `.env`. Alternatively, set `DATABASE_SSL_CA` to the PEM contents (takes precedence). A missing configured file fails explicitly. The supplied certificate now verifies the hosted coursework database successfully. Render needs its own PEM environment value or mounted file path; the local Windows path cannot be used there. This client configuration does not require toggling Supabase's server-side SSL enforcement setting.

Create a fresh dedicated local database named `slsea_test_coursework` on a local PostgreSQL server (or a new local Supabase database). The verifier refuses remote hosts, other database names and nonempty databases. It applies migrations/seeds and writes/deletes synthetic test fixtures only in that disposable database. Existing local Supabase roles are reused; missing `anon`, `authenticated`, `service_role` roles are created on the local cluster if needed. It never resets a database.

PowerShell:
```powershell
$env:SLSEA_TEST_DATABASE_URL = "postgresql://<local-test-user>:<password>@127.0.0.1:5432/slsea_test_coursework"
node scripts/verify-disposable.mjs
Remove-Item Env:SLSEA_TEST_DATABASE_URL
```

Production database connections now use certificate/hostname verification. Supply `DATABASE_SSL_CA` with a PEM CA certificate if the provider requires one. Do not disable verification to resolve a certificate error. Tests use a disposable nonproduction database and do not establish provider TLS or production role privileges. Review a least-privilege database role with SELECT on read resources/assignments, INSERT on generation/weather, UPDATE/INSERT on installation metadata and required sequence rights. It must not modify assignments or reading history. RLS policies for that role must be deliberately configured; do not assume enabled RLS alone grants API access.

Existing readings are labelled `energySemantics: legacy_unspecified`; newly ingested and clean-seeded readings are `cumulative`. The district summary excludes legacy counters from daily energy calculations rather than treating interval-energy values as cumulative. Regeneration or correction of old production values requires a separately reviewed data-migration plan, and is not performed by this package.

## Removing previously seeded demo records

Changing seed.sql does not remove existing hosted records. `supabase/cleanup-demo-data.sql` is a separate, transactional administrative cleanup for the exact demo installation markers from the old seed. It deletes their readings, weather, forecasts and device assignments, then removes unreferenced demo substations. Geographic reference rows and unrelated records remain intact. It briefly disables only the generation-history trigger under table locks, restoring it before commit; failure rolls back the transaction.

For the configured hosted database: run `node scripts/snapshot-hosted.mjs`, inspect counts with `node scripts/cleanup-hosted-demo.mjs`, then apply with `node scripts/cleanup-hosted-demo.mjs --apply`. A recent checksum-verified recovery snapshot in ignored `tmp/hosted-recovery/` is required. The runner also reapplies the reference seed and reports remaining counts. Never run the synthetic test fixture against a published database.
