# Fullstory

Search and analyze Fullstory behavioral data: sessions, users, metrics, funnels, page definitions, the library of saved objects and playback.

**Interface:** Fullstory's official remote MCP server, `https://api.fullstory.com/mcp/fullstory`. It is documented by Fullstory as beta. Fullstory publishes no OpenAPI document for its Server API (checked developer.fullstory.com and api.fullstory.com), so the MCP server is the interface with machine-readable tools. Tools are listed live from the server; mutating tools require approval, read-only tools do not.

**Auth**

- API key: create a Fullstory API key in Fullstory under Settings > Integrations > API Keys with Standard permission, which Fullstory recommends as the lowest level that works with the MCP server. It is sent as a `Bearer` token to the MCP server.
- Org prerequisite (both methods): an org admin must enable the Model Context Protocol (MCP) toggle at Settings > Account Management > StoryAI Features. If StoryAI is opted out for the org, the server appears to connect but returns zero tools.
- OAuth: the server advertises OAuth metadata and dynamic client registration (`https://auth.fullstory.com`, PKCE S256, public clients), so no OAuth app needs to be created by hand. Use the Executor OAuth redirect URI shown when connecting.

**Icon:** Fullstory's official app icon (the 192px apple-touch icon served from fullstory.com, the same mark as its favicon.svg). No press or brand SVG is published (the /press/ and /brand/ pages 404).

**OAuth scopes:** the list matches the server's `scopes_supported`. `settings.own:write` is kept because the server's tools persist segments, metrics, funnels and journeys (build/update tools), which plausibly need it; Fullstory does not document the scope-to-tool mapping.

**Known gaps:** a connection to an org without the StoryAI MCP toggle enabled exposes no tools. The tool count is not recorded because tools are listed live from the server (Fullstory's tools reference lists roughly 30).  the legacy Server API v1/v2 write endpoints (event and user batch import, segment export, privacy settings) are not exposed by the MCP server, so they are not covered. Credentials are not exercised against the real API in verification.
