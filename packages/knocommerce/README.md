# Kno Commerce

Post-purchase survey data from Kno Commerce: surveys, survey responses (and counts), webhook subscriptions, benchmark questions and the deprecated attribution report.

Interface: the official OpenAPI document Kno publishes for its REST API, `https://kno-open-api-specs.nyc3.cdn.digitaloceanspaces.com/rest-api/latest/openapi.yaml` (the source behind https://developers.knocommerce.com/). 8 tools, 3 of them mutations (webhook create, update and delete style calls, which always ask for approval). The spec lists the token endpoint as an operation too; it is skipped because Executor performs that exchange itself.

## Auth

- **OAuth 2 client credentials**: a Client ID and Client Secret created in the Kno Commerce dashboard under Settings > API Access (API access depends on your plan). Executor exchanges them (HTTP Basic) at `https://api.knocommerce.com/api/oauth2/token` (the host Kno's OpenAPI `tokenUrl` and prose name; `app-api.knocommerce.com`, the spec's `servers` host, answers the same endpoint identically, so they appear to be aliases) for a bearer token. There is no redirect URI. Requested scopes: `SURVEYS`, `RESPONSES`, `WEBHOOKS`, `QUESTIONS`, `ATTRIBUTION`. Kno's token endpoint reads `grant_type` and `scope` from the query string, so they are part of the configured token URL.

Hosts: `app-api.knocommerce.com` (API calls) and `api.knocommerce.com` (token exchange).

## Known gaps

- No API-key method; Kno only offers client credentials.
- The health check calls `GET /api/rest/surveys?pageSize=1` (needs the SURVEYS scope) and fails on a non-2xx response.
- Basic header: Kno requires each of client id and secret to be URL-encoded before base64. Executor's `client_secret_basic` is the RFC 6749 form-encoded variant (`client_secret_basic_raw` is the unencoded one), so special characters in the secret are handled.
- Unverified assumption: Kno's prose shows `grant_type` and `scope` as form-body parameters while its OpenAPI declares them as query parameters. The package sends them in the token URL query (as the spec does). A dummy-credential request to either host returns `invalid_client`, so this could not be confirmed without a real account.
