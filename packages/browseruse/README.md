# Browser Use

Browser Use Cloud: hosted browser agents, sessions, raw browsers (CDP), profiles, workspaces, skills, marketplace and billing.

Interface: OpenAPI. Three official specs are mounted in one package: `v4` (https://api.browser-use.com/api/v4/openapi.json, the current REST API: runs, sessions, browsers, profiles, workspaces, integrations, wallets, extensions), `v3` (https://api.browser-use.com/api/v3/openapi.json, session-based agents and workspaces; superseded by v4 but kept) and `v2` (https://api.browser-use.com/api/v2/openapi.json, tasks, skills, marketplace, presigned files). Both live on `api.browser-use.com`. The official hosted MCP server (`https://api.browser-use.com/v3/mcp`) is not mounted because its 7 tools (run_session, send_task, get_session, get_session_messages, stop_session, list_sessions, list_browser_profiles) are all covered by the REST specs.

Auth: API key only. Create one in the Browser Use Cloud dashboard (cloud.browser-use.com, Settings, API keys). It is sent in the `X-Browser-Use-API-Key` header. Browser Use's OAuth 2.0 server (PKCE, device code, dynamic client registration, scope `mcp`) serves the hosted MCP endpoint only; the REST APIs accept only the API key header, so no OAuth provider is declared.

Known gaps: the v2, v3 and v4 specs overlap (sessions, browsers, profiles, billing); prefer v4 for new work, and v2 for the lower-cost simple tasks. Mutations require approval. The logo is the mark from browser-use.com (`logo-white.svg`), recolored black for the light variant.
