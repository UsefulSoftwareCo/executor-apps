# Holded

Covers the Holded v2 REST API: contacts, invoices, credit notes, quotes, orders, purchases, products, stock, treasuries, accounting accounts, projects, bookings and more (360 tools, 209 of them mutations, which always require approval).

Interface: Holded's official OpenAPI 3.1 document at https://api.holded.com/openapi/api2.json (linked from https://www.holded.com/developers/api-reference), served from https://api.holded.com.

Auth: API key only. Create one in Holded under Settings > Developers > Credentials; the v2 API is available on paid plans and each key carries permission scopes. The key is sent as `Authorization: Bearer <key>`. Holded offers no OAuth for third-party apps, so there is no OAuth method.

Health check: connecting calls `GET /api/v2/contacts?limit=1`, which needs the `contacts:contacts.read` scope. A key without that scope is reported unhealthy at connect time even if it works for its other scopes, so grant it when creating the key. The v2 spec scopes every operation; no unscoped endpoint exists to use instead.

Known gaps: this targets the v2 API only; the legacy v1 API (`key` header, developers.holded.com) is not exposed.

MCP: Holded runs an official MCP server at https://mcp.holded.com/mcp (https://www.holded.com/developers/mcp). It uses OAuth 2.1 (unauthenticated POST returns 401 with resource metadata at https://mcp.holded.com/.well-known/oauth-protected-resource, authorization server https://app.holded.com) and acts with the signed-in user's role. Its tool count was not measured (it needs an authenticated session). The OpenAPI package is preferred because it exposes all 360 documented v2 operations with an API key and per-operation approvals; the MCP server can be added separately via Quick Add if per-user OAuth is wanted.
