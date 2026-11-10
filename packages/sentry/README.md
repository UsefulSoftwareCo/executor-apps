# Sentry

Natural-language issue and event search, traces and Seer root-cause analysis through Sentry's official remote MCP server, mounted under `mcp`, for accounts that sign in with Sentry; plus issues, events, projects, releases, alerts, teams, organizations, monitors, replays and the rest of the Sentry REST API (266 tools, 119 of them mutations, which ask for approval), mounted under `api`, for auth-token accounts. One provider serves both, so the app has one account slot.

**Interface:** MCP at https://mcp.sentry.dev/mcp (Streamable HTTP, docs at https://mcp.sentry.dev/). Tools are listed live; every tool without `readOnlyHint` requires approval. OpenAPI from Sentry's own published API description at https://raw.githubusercontent.com/getsentry/sentry-api-schema/main/openapi-derefed.json (the official getsentry repository, which backs docs.sentry.io/api). The description lists https://{region}.sentry.io with region `us` or `de`; the account's region decides which origin receives credentials.

## Auth

- **OAuth** (`oauth`, first): the MCP server's own authorization server, discovered from its protected-resource metadata. It supports dynamic client registration and Client ID Metadata Documents with PKCE S256, so no OAuth application has to be created. Advertised scopes: org:read, project:write, team:write, event:write, alerts:write. These tokens only work on the MCP server (Sentry documents the remote server as OAuth only), so these accounts get the `mcp` tools. Health check: an MCP initialize and tool listing.
- **Auth token** (`authToken`): create an organization token or personal token in Sentry under Settings > Developer Settings (or User settings > Personal Tokens), choosing the scopes you need. Enter the region (`us` or `de`; check your Sentry URL) and the token. These accounts get the `api` tools. Health check: `GET /api/0/organizations/`.

The earlier OAuth method on sentry.io's own endpoints, and the separate "Sentry MCP" account, are gone: that OAuth method needed a user-created Sentry OAuth application.

## Known gaps

- Hosted Sentry only (`us` and `de` regions); self-hosted Sentry is not covered.
- OAuth accounts have no REST tools; auth-token accounts have no MCP tools.
- Only unauthenticated probing of the MCP server was done (401 with valid OAuth metadata); its tool list and annotations are unverified.
- The OpenAPI document covers the documented public API, not every internal endpoint. Event ingestion (DSN) is not included.
- All POST, PUT, PATCH and DELETE operations are writes and ask for approval.
