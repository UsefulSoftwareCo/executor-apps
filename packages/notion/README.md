# Notion

Pages, data sources, databases, blocks, comments, users and search in Notion workspaces, through Notion's official remote MCP server (mounted under `mcp`) for accounts that sign in with Notion, and the REST API (mounted under `api`, 24 tools, 10 of them mutations that require approval) for internal integrations.

**MCP:** https://mcp.notion.com/mcp (docs at https://developers.notion.com/docs/mcp). Tools are listed live; every tool without `readOnlyHint` asks for approval. Only unauthenticated probing was done (401 with valid OAuth metadata); the tool list is unverified.

**REST interface:** OpenAPI. The document is Notion's own, published by Notion in the `makenotion/notion-mcp-server` repository: https://raw.githubusercontent.com/makenotion/notion-mcp-server/main/scripts/notion-openapi.json, pinned to commit `9a8a94cd` (it targets API version `2025-09-03`, which is not the newest: Notion's docs list `2026-03-11` with its own upgrade guide). The package sends `Notion-Version: 2025-09-03` on every request to api.notion.com through a fetch wrapper, because the document declares that header on only two operations. This package deliberately uses the version the document describes, which is required for data source endpoints. Search and data source query are POSTs but read-only, so they are marked as queries and do not need approval. Notion does not publish an OpenAPI document on its developer site; this one is maintained by Notion for its MCP server. The document requires `bearerAuth` at its top level but marks 23 of its 24 operations `security: []` (Notion's MCP server sends its token on every request regardless), so `openapi.ts` adds the bearer requirement back to the operations listed in `empty-security.json`; without it Executor sends no token and Notion answers 401. Regenerate the list with `node scripts/empty-security.ts <document url>` when moving the pin.

**Auth**
- OAuth (`oauth`, first): the MCP server's own authorization server, discovered from its protected-resource metadata. It supports dynamic client registration and Client ID Metadata Documents, so no public integration has to be created. Its tokens only work on the MCP server, so these accounts get the `mcp` tools. Health check: an MCP initialize and tool listing.
- Internal integration secret (`token`): create an internal integration at https://www.notion.so/profile/integrations, copy its secret, and share the pages or databases it should reach with the integration. The hosted MCP server does not take it, so these accounts get the `api` tools. Health check: `GET /v1/users/me`.

The earlier OAuth method on api.notion.com's own endpoints is gone: it needed a user-created public integration.

**Known gaps**
- The document covers the core API only: no file uploads, views, users' admin endpoints, or the Enterprise-only Admin API.
- Notion's MCP tokens (Business and Enterprise, created by a workspace owner) are not offered as a method.
