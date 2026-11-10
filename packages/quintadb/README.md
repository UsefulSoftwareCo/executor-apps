# QuintaDB

Covers QuintaDB's online database builder through its official remote MCP server: projects (databases), forms, fields, records (list, search, create, update, bulk update, delete, import/export, file upload), reports, charts, maps, calendars, portals, action rules, webhooks, schedules, reminders, templates, team and portal users, and usage stats. The server advertised 157 tools on an anonymous `tools/list` when this package was written.

**Interface:** the official MCP server at `https://quintadb.com/mcp`, documented in the "Model Context Protocol" section of https://quintadb.com/api/index. Tools the server marks `readOnlyHint` run without approval; every other tool, including `run_action` (user-defined actions can change records), requires approval; `search_records` is marked read-only by the server. The REST API is not wrapped: the MCP server covers file upload and export, so no hand-written REST tools are kept.

**Auth:**
- OAuth (recommended): the server publishes OAuth 2.0 metadata with dynamic client registration and S256 PKCE (`https://quintadb.com/mcp/oauth/register`), scope `mcp`. No OAuth app needs to be created by hand; the redirect URI is registered automatically.
- REST API key (secondary): sent as the `X-Api-Key` header to the MCP server. Create it in QuintaDB under Profile, API Keys (`https://quintadb.com/rest_apis`); the REST reference also describes it as the "API" menu at the top right of the page (https://quintadb.com/api/index).

**Gaps:** file removal, the XML format and PDF report export are documented only for the REST API and are not exposed. Tool descriptions come from the server and are partly in Ukrainian.

Icon: QuintaDB's official app icon (the Q mark, 192px) from quintadb.com; Simple Icons has no entry.
