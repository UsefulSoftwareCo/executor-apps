# Gender API

Determine gender (with probability) from a first name, full name or email address, find the likely countries, language and ethnicity of origin of a name, check remaining credits.

## Interface

Hand-written tools over the Gender API v2 REST API (`https://gender-api.com/v2`, docs at https://gender-api.com/en/api-docs/v2): `genderByFirstName`, `genderByFullName`, `genderByEmail`, `genderBatch`, `countryOfOrigin`, and `statistic`. All are read-style queries; there are no mutations.

The tool paths follow the v2 API docs page, which uses `POST /v2/gender` for every name and email lookup (arrays for batch). The vendor's OpenAPI document (https://gender-api.com/openapi/openapi.yml) disagrees: it uses `/gender/by-first-name`, `/gender/by-full-name`, `/gender/by-email-address` and `-multiple` variants. The docs page was followed; the paths could not be confirmed against a live token.

The vendor publishes an OpenAPI document at https://gender-api.com/openapi/openapi.yml, but the Executor OpenAPI compiler rejects it as an invalid definition, so the tools are written by hand. The vendor also runs a remote MCP server at `https://mcp.gender-api.com`; it only accepts a bearer token, so its tool list could not be inspected without credentials and it is not mounted.

## Auth

API token (`apiKey`), sent as `Authorization: Bearer <token>`. Create one at https://gender-api.com/en/account/auth-tokens (a free plan with 100 requests a month is available). There is no OAuth.

## Gaps

- `POST /v2/sign-up` (free account creation, no auth) is not exposed, because tools are only reachable after a token is connected. Create the account at https://gender-api.com instead.
- The health check calls `GET /v2/statistic`. An exhausted account returns HTTP 401 (limit exceeded) per the docs, so health can fail with an auth-style error when credits run out even though the token is valid.

- Lookups are `POST` requests that cost credits (1 per gender lookup, 2 for country of origin) but are exposed as queries because they do not change state.
- The v1 API is not covered.
