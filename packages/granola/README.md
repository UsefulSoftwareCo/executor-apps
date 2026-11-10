# Granola

Granola meeting notes, transcripts and folders, searchable by agents (6 tools).

**Interface:** Granola's official remote MCP server at `https://mcp.granola.ai/mcp` (probe verdict: `oauth`). Granola also publishes an official OpenAPI 3.1 document for its REST API at `https://docs.granola.ai/api-reference/openapi.json` (server `https://public-api.granola.ai`, 18 operations: notes list/get/transcript, folders, spaces, audit, webhook endpoints, legal holds). That API authenticates with a bearer API key that is available only on Business and Enterprise plans. The MCP server is used here because it signs in per user with OAuth on every plan, including free ones, and offers `query_granola_meetings` (natural-language search across meetings), which the REST API lacks. An OpenAPI-based package with an API-key secret would be a reasonable companion for Business/Enterprise workspaces.

**Tools:** Six, per Granola's MCP docs (`https://docs.granola.ai/help-center/sharing/integrations/mcp.md`): `query_granola_meetings`, `list_meeting_folders` (paid), `list_meetings`, `get_meetings`, `get_meeting_transcript` (paid), `get_account_info`. Tools not annotated read-only require approval.

**Auth:** OAuth 2.0 with PKCE (S256) and dynamic client registration, discovered from the server's metadata (`oauth2({ discover, resource })`; authorization server `https://mcp-auth.granola.ai`). The protected-resource metadata (`https://mcp.granola.ai/.well-known/oauth-protected-resource/mcp`) names the resource `https://mcp.granola.ai/mcp` and scope `mcp`; the package follows it and pins `resource` to that exact value explicitly. Vendor metadata is authoritative. The framework adds `offline_access` itself when the authorization server advertises it and no explicit scopes are set. Sign in with your Granola account when you connect.

**Gaps:** A full OAuth connect was not tested end to end.

**Icon:** Granola's official app icon (512px web app manifest PNG from `https://www.granola.ai/favicon/web-app-manifest-512x512.png`); Simple Icons has no Granola entry.
