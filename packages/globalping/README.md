# Globalping

Run network measurements (ping, traceroute, MTR, DNS, HTTP) from Globalping's worldwide probe network, fetch and compare measurement results, list probe locations and check rate limits.

Interface: the vendor's official remote MCP server at https://mcp.globalping.dev/mcp (repo: https://github.com/jsdelivr/globalping-mcp-server). It exposes per-type tools (`ping`, `traceroute`, `mtr`, `dns`, `http`) plus `locations`, `limits`, `getMeasurement`, `compareLocations`, `help` and `authStatus`. MCP was chosen over the OpenAPI document at https://api.globalping.io/v1/spec.yaml because that spec covers only 4 generic operations.

## Auth

- OAuth (`oauth`): discovered from the MCP server's metadata (dynamic client registration, PKCE S256, scope `measurements`). Users do not create an OAuth app. Add the redirect URI Executor shows if the server asks for it.
- API token (`apiKey`): create one under Tokens at https://dash.globalping.io/tokens. It is sent as `Authorization: Bearer <token>` to the MCP server, as the vendor documents for headless use.

## Known gaps

Tools that are not annotated read-only (measurement creation) require approval each time. Icon is the official mark from globalping.io (favicon.svg).
