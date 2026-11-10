# Otter.ai

Search and read the Otter.ai meetings and conversations you authorize: the signed-in user's profile, transcript search, and full transcripts for summarization and analysis. Otter's MCP server is read-only.

**Interface:** Otter's official remote MCP server, `https://mcp.otter.ai/mcp` (streamable HTTP), documented at https://help.otter.ai/hc/en-us/articles/35287607569687-Otter-MCP-Server. Otter's REST API (`https://api.otter.ai/v1`) is Enterprise-only with no public OpenAPI document, so MCP is the interface. This package also covers the catalog target "Otter.ai MCP".

**Auth:** OAuth 2.0 with PKCE and dynamic client registration, discovered from `https://otter.ai/.well-known/oauth-authorization-server`. Scopes advertised: `profile:read`, `conversations:read`. Sign in to your Otter account and click Authorize access on the connect page; no OAuth app needs to be created. The MCP server is available on all Otter plans.

**Known gaps:** The tool list is whatever Otter's server exposes (about three tools); no write operations exist. Verified by probing the server's OAuth metadata only; no real account was connected.
