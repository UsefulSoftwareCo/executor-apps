# Ahrefs

Ahrefs SEO and marketing data through the Ahrefs API v3: Site Explorer (backlinks, referring domains, organic keywords, top pages, domain rating), Keywords Explorer, SERP overview, Rank Tracker, Site Audit, Brand Radar, Web Analytics, management endpoints and subscription usage.

**Interface:** OpenAPI. Ahrefs' official document at https://docs.ahrefs.com/openapi.json, 155 tools (36 mutations, each requiring approval), none skipped. All calls go to `https://api.ahrefs.com/v3`.

## Auth

- **API key:** create one in Ahrefs under Account settings > API keys (workspace owners and admins only; keys have an expiry date chosen at creation, up to 10 years). Sent as a bearer token.
- **OAuth (Ahrefs Connect):** register an app in the Ahrefs Connect section of Account settings (Ahrefs requires technology providers to apply to its integrations program before an app reaches other users: https://ahrefs.com/api/integrations). Enter its client ID and secret on the connect page, and add Executor's redirect URI to the app. That is `/api/oauth/callback` on your Executor's own origin (for example `https://<your-executor-host>/api/oauth/callback`); the connect page shows the exact URL to copy. Flow is authorization code with PKCE, scope `apiv3-integration-apps`; authorize at `https://app.ahrefs.com/web/oauth/authorize`, token at `https://ahrefs.com/oauth/token`. Docs: https://docs.ahrefs.com/en/ahrefs-connect/docs/oauth-guide

The icon is Ahrefs' own favicon (https://ahrefs.com/favicon.svg); Simple Icons has no Ahrefs entry and no brand-kit SVG was found.

The health check calls `/subscription-info/limits-and-usage`, which is free.

## Known gaps

- API calls consume Ahrefs API units on the connected plan; most endpoints need a paid plan with API access.
- The hosted Ahrefs MCP server (`https://api.ahrefs.com/mcp/mcp`) is not used; the OpenAPI document is broader.
- The OAuth setup was verified against Ahrefs' docs, not exercised with a live account.
