# FuseAI

Tools for [FuseAI](https://www.fuseai.com), the AI sales platform: prospect and company search, lists and imports, enrichment, smart columns, exports, campaigns, signal agents, deep research and analytics.

**Interface:** OpenAPI plus the official remote MCP server. REST: the official Fuse Business API document at https://docs.fuseai.com/openapi.json (base URL `https://api.tryfuse.ai/api/v1`), loaded live (146 operations). MCP: `https://mcp.fuseai.com` (legacy `https://mcp.tryfuse.ai`), which the vendor documents at https://docs.fuseai.com/mcp/tools as close to 300 tools, including email, LinkedIn messaging, automations, tasks, deep research and dialer history that the REST spec lacks.

**Auth:** two methods. API key (REST tools): In the Fuse app open Settings, then API Cockpit, then Create New Key, and paste the key (it starts with `af_` and is shown only once). It is sent as the HTTP Basic username with an empty password. Keys created in API Cockpit carry every scope; a 403 `INSUFFICIENT_SCOPE` is only a documented error code. OAuth (MCP tools): OAuth 2.1 authorization code with PKCE and dynamic client registration, discovered from `https://mcp.fuseai.com` (authorization server `https://core.backend.fuseai.com`, scope `mcp:tools`); no app needs to be created. The connected account exposes the MCP tools; the API-key account exposes the REST tools.

**Gaps:** Every mutation requires approval. MCP tools need approval unless marked read-only. The REST health check calls `GET /business/me`; the OAuth one uses the MCP handshake.
