# Scrapfly

Scrape web pages with Scrapfly's anti-bot bypass and proxies, capture screenshots, drive Cloud Browser sessions and check account usage and quota.

**Interface:** Scrapfly's official remote MCP server, `https://mcp.scrapfly.io/mcp` (docs: https://scrapfly.io/docs/mcp). No OpenAPI document or GraphQL API was found: probes of common spec paths on api.scrapfly.io and scrapfly.io returned 404, and the vendor's MCP tools and Scrape API getting-started pages link to no spec. This was checked by probing and reading docs only, not exhaustively. Tools are discovered live from the server (the vendor's detailed tools page, https://scrapfly.io/docs/mcp/tools, documents 25 named tools; its overview says 9 or 10; the live count was not verified without credentials); tools without `readOnlyHint` need approval.

**Auth**
- API key: create or copy it under Dashboard, Project Settings (https://scrapfly.io/dashboard/project). It is sent as `Authorization: Bearer <key>`.
- OAuth: the server publishes OAuth metadata with dynamic client registration, so no OAuth app needs to be created. Executor discovers it from the MCP URL. Access can be revoked under Account Settings, API & Integrations, MCP OAuth2 Access.

The vendor's `?key=` query-string key form is intentionally not used. The OAuth metadata lists only the `authorization_code` grant, while the vendor says tokens refresh automatically; the refresh behaviour was not verified.

**Known gaps**
- If the project has an IP allowlist, Executor's egress IPs must be on it, or calls fail with "Access restricted".
- The MCP probe could only confirm the OAuth challenge (unauthenticated); tools were not listed with live credentials.
