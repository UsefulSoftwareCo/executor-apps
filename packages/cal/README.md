# Cal.com

Cal.com scheduling: bookings, event types, schedules, availability, calendars, conferencing, teams, organizations, webhooks and more (366 tools, 214 of them mutations, each requiring approval).

Interface: OpenAPI, from Cal.com's official API v2 document at https://cal.com/docs/api-reference/v2/openapi.json (host `api.cal.com`). The document declares no servers or security schemes and lists the bearer token as an `Authorization` header parameter on each operation, so the package supplies the base URL, a bearer scheme and a default `Authorization` header from the connected account. Most operations also need a `cal-api-version` header; the required value differs per operation (seven different versions across about 92 operations), so it cannot be set as a single default; use the example date shown in that operation's `cal-api-version` parameter description.

## Auth

- API key: create one in Cal.com under Settings > Developer > API keys (or Security). Keys start with `cal_` or `cal_live_`. Sent as `Authorization: Bearer <key>`.
- OAuth: create an OAuth client at https://app.cal.com/settings/developer/oauth, select scopes and register the Executor redirect URI shown on the connect page. Cal.com must approve the client before it works. Authorization is at `https://app.cal.com/auth/oauth2/authorize`, tokens at `https://api.cal.com/v2/auth/oauth2/token` (JSON body, client secret in the body). All documented client scopes are requested (user, `TEAM_*`, `ORG_*`, `VERIFIED_RESOURCES_*`, `CREDITS_*`, `INSIGHTS_*`), so every tool group can be authorized; the client must have the scopes enabled in Cal.com (requested scopes must be a subset of the client's), and the authorizing user needs the matching team or organization role, otherwise those tools return 403. Public booking endpoints (create, cancel, reschedule, slots) need no scope. Operations that name no scope in the spec are not scope-gated for modern clients.

## Known gaps

- No Cal.com remote MCP server is used; the hosted one at https://mcp.cal.com/mcp was not needed since OpenAPI covers more.
- Deprecated platform headers (`x-cal-client-id`, `x-cal-secret-key`) are not configured as an auth method.
