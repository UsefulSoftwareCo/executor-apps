# redirect.pizza

Manage redirect.pizza redirects (including import, pause and resume), email forwards and their logs, domains and DNS checks, analytics, team settings and members, plus the redirect tester and QR code generator.

Interface: OpenAPI, from the vendor's published document at https://redirect.pizza/api-docs/openapi.yaml (35 tools, 19 of them mutations that require approval). redirect.pizza also offers an MCP server at https://redirect.pizza/mcp, but it requires a token (it returns 401 without one) and the vendor publishes no tool inventory, so it was not evaluated; the OpenAPI document is used.

Auth: API token (`apiKey`). Create it in the redirect.pizza dashboard under More, API/MCP, and grant the scopes you need: `redirects:read`/`redirects:write`, `email-forwards:read`/`email-forwards:write`, `domains:manage`, `analytics:read`, `team:read`/`team:write`, `users:read`/`users:write` (`mcp:use` is for the vendor MCP server only). The health check reads the team, so include `team:read`. The token is sent as a Bearer token to `redirect.pizza`. redirect.pizza offers no OAuth for third-party apps.

Gaps: the Analytics endpoints are marked beta by the vendor and may change. The icon is a single slice of the vendor's brand mark, taken from https://redirect.pizza/build/assets/header-mark-strip-CFiesggm.svg.
