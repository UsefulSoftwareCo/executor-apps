# Prospeo

B2B person and company search, single and bulk enrichment (verified emails, mobile numbers, company data), search suggestions and account credit information.

**Interface:** Prospeo's official hosted MCP server, `https://mcp.prospeo.io` (docs: https://prospeo.io/api-docs/mcp). Prospeo publishes no OpenAPI document, so the MCP server is the most complete official interface. Tools are discovered live; mutating or non-read-only tools require approval.

**Auth**

- API key (`apiKey`): create a key at https://app.prospeo.io/api (API Management). It is sent in the `X-KEY` header.
- OAuth 2.0 (`oauth`): discovered from the server's metadata (dynamic client registration, PKCE S256). To use a manual client, create one in app.prospeo.io under Integration > MCP > Manage OAuth Clients, and register the redirect URI Executor displays when connecting.

**Known gaps**

- Tool list depends on what the MCP server exposes; enrichment calls spend Prospeo credits.
- Icon is Prospeo's official 180px app icon (apple-touch-icon), since no SVG mark is published.
