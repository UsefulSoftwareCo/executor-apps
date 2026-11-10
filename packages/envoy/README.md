# Envoy

Envoy workplace and visitor management (visitors, invites, reservations, deliveries, locations), exposed through Envoy's official remote MCP server.

- Interface: MCP, `https://mcp.envoy.com/mcp` (listed on integrations.sh). Envoy's REST API at `api.envoy.com` has no publicly downloadable OpenAPI document (the developer hub is a ReadMe site), so the MCP server is used.
- Auth: OAuth 2.0. The server publishes metadata with dynamic client registration, so no OAuth app needs to be created; the user just signs in to Envoy and approves the `mcp` scope. Executor's OAuth callback is registered automatically.
- Approvals: every tool without `readOnlyHint` requires approval.
- Gaps: the REST-only endpoints and webhooks of the developer platform are not covered; tools are whatever the MCP server offers after sign-in. Tool count was not enumerable without credentials.
