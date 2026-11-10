# dope.security

Manage dope.security Flightdeck from Executor: search endpoints, and manage policies (category restrictions and exceptions, user and group assignments, URL and application bypass, SSL inspection) and custom URL categories. 25 tools.

## Interface

Hand-written tools over the Flightdeck public API (`https://api.flightdeck.dope.security/v1`), taken from dope.security's official specification at https://inflight.dope.security/dope.apis/public-api-specification. That page publishes the OpenAPI document only as per-endpoint fragments embedded in the docs (no single downloadable file), so the operations are declared by hand in `operations.ts`. Request bodies are passed as a JSON `body`; the tool descriptions give the shape.

## Auth

OAuth 2.0 client credentials. An admin creates an API client in the dope console (Settings > API Client Credentials, https://inflight.dope.security/dope.console/settings/api-client-credentials) and enters the Client ID and Client Secret in Executor. Executor exchanges them at `/v1/partner/oauth/token` (JSON request body); tokens are short-lived and refreshed by Executor. Scopes are assigned by the server. There is no redirect URI.

## Known gaps

The public API has no user, group, or log/report endpoints. Every mutation requires approval.
