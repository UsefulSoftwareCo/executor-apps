# ZoomInfo

Search and enrich ZoomInfo's B2B data (companies, contacts, intent, news, scoops, technologies, org charts, corporate hierarchy), read account summaries, insights and lookalikes, manage GTM Studio audiences, Data Quality configurations, marketing audiences, exports and engagements, query vertical datasets (financial filings, job posts, loan statements, product reviews) and run ZoomInfo agents. 115 tools across eight keys: `data`, `copilot`, `agent`, `gtmStudio`, `dataQuality`, `marketing`, `platform`, `verticalDatasets`.

## Interface

OpenAPI, from ZoomInfo's official specifications listed at https://docs.zoominfo.com/openapi.md. The files are served from `https://docs.gtm.ai/openapi/openapi-<name>-v1.yaml` (docs.zoominfo.com redirects there); the package mounts the data, copilot, agent, gtm-studio, data-quality, marketing, platform and vertical-datasets documents, all on `https://api.zoominfo.com/gtm`. Read-only POST operations (searches, insights, account-summary questions) run without approval; every other write, and every credit-consuming enrich call, asks first.

## Auth

OAuth 2.0 authorization code flow with PKCE. Create an application in the ZoomInfo DevPortal (https://docs.zoominfo.com/docs/standard-app), select the scopes it needs (https://docs.zoominfo.com/docs/zoominfo-oauth-scopes), add Executor's redirect URI shown on the connect page to the app's Sign-in Redirect URIs, and paste the Client ID and Client Secret into the connect page. No scope is sent in the authorize request, so the token carries every scope the app has; a tool whose scope the app lacks returns a 403.

## Known gaps

- The legacy Enterprise API (`/authenticate` with a username and password or a PKI key pair, JWT valid for an hour, no refresh) is not supported; it is a different API surface from the OAuth one above.
- The client credentials (server-to-server) flow is not offered; connect as a user.
- The two streaming agent endpoints (`runs/stream`) are not generated.
- The ZoomInfo remote MCP server (`https://mcp.zoominfo.com/mcp`) is not used; the OpenAPI documents cover far more operations.
