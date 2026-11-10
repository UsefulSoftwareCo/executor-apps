# AgencyZoom

Manage insurance agency leads, customers, policies, life and commercial opportunities, tasks, email and text threads, service tickets, pipelines and reference data (carriers, tags, lead sources, employees) in AgencyZoom. 117 tools are generated from AgencyZoom's own OpenAPI document, 79 of them mutations that always ask for approval. AgencyZoom exposes many list and search calls as POST, so those also ask for approval.

Interface: OpenAPI, from the vendor-hosted document at https://app.agencyzoom.com/openapi/agencyzoom.yaml (API base https://api.agencyzoom.com, documented at https://api.agencyzoom.com/openapi/).

## Auth

AgencyZoom has no API keys or OAuth. Every call needs a JWT in `Authorization: Bearer`, and the API acts with the permissions of the user it signs in as; use the agency owner's login to reach every feature.

- **Username and password** (recommended): the AgencyZoom login email and password. The app signs in at `/v1/api/auth/login`, caches the JWT for 10 minutes (the vendor documents no token lifetime, so this window is a choice) and drops the cache on a 401 or a successful logout call, so the next call signs in again. The failed call itself is not retried. Credentials go only to `api.agencyzoom.com`.
- **JWT**: paste a token you already obtained from the login endpoint. It is not refreshed, so it stops working when it expires.

Rate limit per the vendor: 120 calls per minute.

## Known gaps

- The document defines batch customer, lead, policy and quote models with no paths (only batch-create for contacts and leads, batch-delete for tasks), so those batch calls are not available.
- The V4 SSO login endpoints are included as tools but need a Vertafore authorization code and are not used for connecting.
- Health check for the JWT method reads `/v1/api/employees`; the login method checks that sign-in succeeds.
- `createPolicy` (POST `/v1/api/policies/create`) requires an `X-Api-Token` header in addition to the bearer JWT. The vendor docs do not say how to obtain that token and this package does not manage it, so the tool will not work without a value supplied by the caller.
- The spec's unauthenticated operations (login, SSO login, logout, refresh, V4 SSO) are generated as tools too, approval-gated like other mutations; they are not hidden.
