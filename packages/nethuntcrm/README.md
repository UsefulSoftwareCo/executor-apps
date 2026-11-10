# NetHunt CRM

NetHunt is a CRM that lives inside Gmail. This package covers its current public REST API (v2): folders, folder field management, records (list, get, create, update, delete, search, filter), updated-records feed, record and folder timelines, comments and call logs. 18 tools generated from the OpenAPI document, 10 of them mutations.

**Interface:** OpenAPI 3.0.0 document "NetHunt Public REST API" at https://nethunt.com/api/v2/openapi.json (docs: https://nethunt.com/api/docs). The document declares no `servers`, so the package sets the base URL `https://nethunt.com` itself.

**Auth:** API key only. NetHunt's v2 API uses HTTP Bearer with an `nh_live_*` key, sent as `Authorization: Bearer <key>` to `nethunt.com`. Create the key in NetHunt CRM under its API/integration settings. The health check calls `GET /api/v2/folders`.

**Notes and gaps:** every mutation (POST, PATCH, DELETE) asks for approval. The older v1 Zapier-style API (`/api/v1/zapier`, Basic auth with email plus key) is not included; it is superseded by v2, and v2 covers its record, comment and call-log operations plus folder and field management. v1 extras with no v2 equivalent (Google Drive file feeds, Gmail thread links) are not available.

**MCP:** NetHunt advertises an official MCP server (https://nethunt.com/mcp-ai, OAuth 2.1 with PKCE, for ChatGPT, Claude and Grok). Its endpoint URL is not published on the public pages and probes of likely hosts and paths (mcp.nethunt.com, nethunt.com/mcp, /api/v2/mcp, /mcp/sse) found nothing, so the endpoint could not be located. It exists but is not used here.
