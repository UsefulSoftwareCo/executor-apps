# Linkly

Create, search, update and delete short links, manage custom domains and favicons, configure click webhooks, and read click analytics and exports in Linkly (linklyhq.com).

Interface: Linkly's official remote MCP server, `https://mcp.linklyhq.com` (25 tools). Linkly publishes no public OpenAPI document, so the MCP server is the broadest official source. Tools that are not marked read-only require approval.

Auth:
- OAuth (the vendor's documented path): Linkly's README says the hosted server uses OAuth 2.1 with PKCE and requires no API keys. The server supports dynamic client registration (scope `full_access`), so no OAuth app needs to be created by hand. Redirect URIs are registered automatically.
- No API key method: Linkly documents API keys only for its REST API and calls the old API-key flow for the MCP server unmaintained, so it is not offered.

Health: the MCP server answers anonymous requests, so `mcpHealth` cannot verify an account. The health check calls `GET https://api.linklyhq.com/api/v1/workspaces` with the OAuth bearer token and rejects 401/403. It has not been run against a real account, and it assumes the REST API accepts OAuth access tokens (the MCP server forwards the bearer to it).

Icon: Linkly's own app icon, served by its MCP server (256px PNG).
