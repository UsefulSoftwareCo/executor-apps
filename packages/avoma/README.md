# Avoma

Avoma AI meeting assistant: meetings, recordings, transcriptions, AI notes, insights, sentiments, scorecards and evaluations, calls, smart/custom categories, meeting types and outcomes, and templates.

## Interface

OpenAPI, from Avoma's official API reference: https://dev.avoma.com/openapi.yml (server `https://api.avoma.com`).

## Auth

API key (bearer token). Only Avoma admins can create keys, under Settings > Organization > Developer; the key can be scoped to a user (limited or full access) or the organization (limited access). See https://help.avoma.com/api-integration-for-avoma. Avoma offers no user-created OAuth apps, so there is no OAuth method.

## Interface notes

`document.json` is a vendored copy of the official `https://dev.avoma.com/openapi.yml`. The upstream file `$ref`s shared components in `https://dev.avoma.com/openapi/components/external.yml`, which the apps OpenAPI compiler cannot resolve, so those schemas and examples were merged into `components.schemas` / `components.examples` and the refs rewritten to local ones. One path was written without a leading slash upstream (`v1/revenue_intel/timeline/`) and is fixed to `/v1/revenue_intel/timeline/`. Nothing else is changed. Re-vendor when Avoma updates the spec.

## Known gaps

None skipped: all 59 operations in the spec compile into tools. The health check calls `GET /v1/users/` and checks only the HTTP status (401/403 report the key as rejected), because the spec types the response as a bare array while other list endpoints are paginated and the real shape cannot be confirmed without a key. The spec's own security text ("contact Avoma Support") is stale; the help center describes self-service keys.
