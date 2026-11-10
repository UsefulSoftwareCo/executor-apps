# Glasp

Export and manage [Glasp](https://glasp.co) highlights, bookmarks, Kindle highlights and AI summaries: `highlights.export`, `create`, `update`, `delete`, `kindle.export`, `bookmarks.export`, `create`, `summaries.export`, `get` (the nine documented REST endpoints, under `api`), plus Glasp's MCP server under `mcp` (9 tools).

**Interface:** hand-written tools over Glasp's official REST API at `https://api.glasp.co`, documented at https://glasp.co/docs/apis. Glasp publishes no OpenAPI document or GraphQL API for the REST API. It also publishes an official remote MCP server (https://glasp.co/mcp) at `https://glasp.co/api/mcp`, mounted under `mcp`; it adds semantic `search_highlights`, `list_recent_highlights`, `get_highlights_for_url`, `list_kindle_highlights`, `list_bookmarks`, `list_summaries`, `get_memories`, `get_community_highlights` and `save_bookmark`. The REST tools are kept because MCP cannot create, update or delete highlights. The two are separate providers (separate credentials). Highlights create/update/delete and bookmarks create are mutations, and MCP tools that are not read-only (`save_bookmark`) require approval.

**Auth**
- Access token: copy it from https://glasp.co/settings/access_token. It is sent as `Authorization: Bearer <token>`.
- MCP server: OAuth, discovered from `https://glasp.co/.well-known/oauth-protected-resource` (dynamic client registration, PKCE S256, scopes `read` and `write`). Connect a \"Glasp MCP\" account; no OAuth app needs to be created by hand. The REST API itself has no OAuth.

**Known gaps:** `highlights.delete` requires one of `highlight_id` or `delete_document` but the schema does not enforce it; Glasp validates server-side. The REST API has no current-user endpoint, so the health check calls `bookmarks/export`. Each endpoint is rate limited (15 to 100 requests per minute) and answers 429 beyond it; the tools do not retry. Colour and category values are passed as plain strings and validated by Glasp. The logo is the official Glasp mark from the glasp-co GitHub organization avatar (240px), because glasp.co sits behind a bot challenge and offers no SVG download.
