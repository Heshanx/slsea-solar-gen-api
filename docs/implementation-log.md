# Implementation log and checklist

This is an engineering progress record, not coursework report prose. It
records source changes and verification without credentials, tokens, or
production row contents.

## Current branch

`codex/slsea-master-checklist`, based on baseline commit
`a744291c0bfa24bc0f5e41b00fecc9c761520ab0`.

## Checklist status

- [x] Phase 0: verify repository state and existing test baseline.
- [x] Phase 0: inspect brief/rubric findings, report template, routes, config
  names, tests, and initial migration.
- [x] Phase 0: inspect current schema metadata and row counts in a read-only
  transaction; no rows or secrets were returned.
- [x] Phase 0: create a feature branch from the clean baseline.
- [x] B6 partial: generation list accepts ascending/descending timestamp sort,
  deterministic ID tie-breaking, and next/previous links preserving time
  filters.
- [x] B2 partial: add configurable OIDC JWT verification and server-side route
  role checks for currently existing resources.
- [x] B2 tests: validate missing, malformed, expired, wrong-issuer,
  wrong-audience, invalid-signature, not-yet-valid, JWKS-unavailable, and
  unknown-role cases plus device binding and scoped weather recording.
- [ ] Confirm an approved OIDC issuer that supports per-device
  `client_credentials` tokens and the signed claim contract.
- [ ] Set issuer-side device token lifetime and revocation behavior; issued
  JWTs remain valid until expiry in the current stateless verifier.
- [ ] Add province, district, substation, installation, and authorization
  schema through a reviewed migration.
- [ ] Add nullable generation voltage and protect reading history from
  installation deletion.
- [ ] Add deterministic required-scale seed data on an approved safe target.
- [ ] Add hierarchy, installation composite, latest-reading, and scoped
  reading resources.
- [ ] Implement province/district analyst query scoping.
- [ ] Complete ETag behavior, `Location` headers, standardized errors, and
  pagination semantics across required resources.
- [ ] Add isolated PostgreSQL migration/seed/integration tests.
- [ ] Verify least-privilege database access and TLS before any release.
- [ ] Update setup/deployment documentation and verify deployment only after
  approval.
- [ ] Gather evidence against each mandatory brief/rubric item; student writes
  report prose.

## Changes in this phase

- Added OIDC issuer/audience/JWKS configuration names to `.env.example`.
- Added signature and claim validation using the `jose` JWT library; configured
  routes fail closed when auth configuration is absent.
- Added role rules: devices may submit generation only for their bound
  installation; analysts are read-only; registry administrators can create
  and update sites.
- Kept root, Swagger, and health endpoints public.
- Disabled site deletion with HTTP 409 until the database prevents cascading
  deletion of generation history. Weather writes require a registry-admin
  token with the signed `weather:write` scope.
- Added authentication documentation and generated-key tests.
- Added `jose@6.2.12` as a direct runtime dependency; it was already present
  transitively in the lockfile and installed modules.

## Features removed or restricted

- No route was removed. Site deletion and weather observation writes are
  restricted by authorization policy. The previously public
  business routes now require a valid OIDC bearer token and configured issuer.
- Provincial/district analyst reads are denied until geographic scoping can be
  enforced. National analyst reads remain available.
- Health, documentation, site creation/update by registry administrators,
  and existing site/generation/weather/forecast read routes remain available
  under their documented roles.

## Verification

Focused authentication suite: 11 tests passed. Full regression suite: 7 test
files and 37 tests passed. `git diff --check` passed. Tests use locally
generated signing keys and a mocked JWKS endpoint; they do not call the
configured database or external issuer. Runtime verification configuration
is still required before business routes can be used outside tests.
