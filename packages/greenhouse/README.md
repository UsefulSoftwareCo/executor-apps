# Greenhouse

Greenhouse recruiting through the Harvest v3 API: candidates, applications, jobs, job posts, interviews, scorecards, offers, openings, users, custom fields, tags, sources, webhooks and more (179 tools, 105 of them mutations that ask for approval).

## Interface

OpenAPI. Greenhouse's official Harvest v3 document, listed at https://harvestdocs.greenhouse.io/openapi and loaded live from https://harvestdocs.greenhouse.io/openapi/harvest-api.json. Everything is served from `https://harvest.greenhouse.io/v3`. The bulk operations declare only an `oauth2` scheme, so `openapi.ts` redeclares it as a bearer scheme alongside `bearer`.

## Auth

OAuth 2.0 client credentials (the method Greenhouse documents for customer-built integrations). In Greenhouse open API Credentials, click Create new API credentials, choose Harvest V3 (OAuth), and grant the scopes (`harvest:<resource>:<action>`) your use needs. Enter the Client ID and Client Secret on the connect page; Executor exchanges them at `https://auth.greenhouse.io/token` for one-hour bearer tokens. The token acts as the credential's integration user, which has organization-wide access. Scopes are fixed on the credential, so none are requested during the exchange. A call outside the granted scopes returns 403. The connection check lists one user and needs `harvest:users:list`.

## Gaps

- The authorization code flow is limited to Greenhouse partners with a signed partnership agreement (credentials issued by partner-support@greenhouse.io), so it is not offered. Executor does not use the `sub` parameter to act as a specific user.
- Legacy Harvest v1/v2 API keys (Basic auth) are being phased out and are not supported; the transition token endpoint `/auth/token` is skipped.
- Other Greenhouse APIs (Job Board, Candidate Ingestion, Audit Log, Onboarding GraphQL, Assessment) are separate products and are not included. Webhook payloads are not exposed as tools.
