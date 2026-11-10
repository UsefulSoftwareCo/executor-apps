# Jinko

Jinko is travel infrastructure for agents and apps. This package covers its public REST API: flight search, calendars and date discovery, price monitoring and advice, hotel search and details, car rental search, trips (items, travelers, ancillaries), checkout and agent payment, bookings, cancellations, refunds, exchanges, and travel demand data (destinations, markets, audiences, trends).

Interface: OpenAPI, from the official document served by the production API at https://api.gojinko.com/doc (52 operations, none skipped). Every mutation requires approval, including POST-based searches. The spec also lists a sandbox server (api.sandbox.gojinko.com); only production is mounted.

Auth: API key (`jnk_t_...`, sent as `X-API-Key`). Create one at https://dashboard.gojinko.com/developers/keys. Keys spend the organization's prepaid credit. Sandbox keys (`jnk_sandbox_t_...`) do not work against the production host.

Known gaps: no OAuth. Jinko's REST gateway does accept WorkOS OAuth bearer tokens, but the only documented way to get one is the MCP flow (RFC 8414 discovery at https://mcp.builders.gojinko.com/.well-known/oauth-authorization-server, Dynamic Client Registration, auth server auth.gojinko.com). The vendor publishes no scopes and no token endpoint auth method for it and does not support user-created OAuth apps, so it is not offered; API keys are the vendor's recommended path for server-side use. The MCP endpoint (https://mcp.builders.gojinko.com/mcp, 16 tools) is not mounted since REST covers more. Of the 52 tools, `GET /health` needs no credential. The eight webhook tools (`/v1/webhooks...`) fail with tenant `jnk_t_` keys (use the dashboard), so expect errors from them.
