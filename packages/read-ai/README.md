# Read AI

Meeting transcripts, summaries, action items, topics, metrics and recordings from Read AI, plus meeting-agent and report-sharing tools the server offers.

**Interface:** Read AI's official remote MCP server, `https://api.read.ai/mcp`. Tools are discovered from the server at runtime; non-read-only tools require approval. Read AI also has a REST API at `https://api.read.ai/v1` (list/retrieve meetings), but it publishes no OpenAPI document and the same OAuth credentials are used, so the MCP server is the interface exposed here.

**Auth:** OAuth only. The server publishes protected-resource metadata (authorization server `https://authn.read.ai/`) and supports dynamic client registration at `https://api.read.ai/oauth/register`, so Executor discovers everything from the URL and registers its redirect URI automatically. Scopes requested: `openid`, `offline_access`, `mcp:execute`, `meeting:read`. There is no API key method.

**Known gaps:** The tool count depends on the connected account. The REST API is not exposed.

Icon: Read AI's published logomark (256px PNG from https://www.read.ai, the site's apple-touch-icon); Simple Icons has no Read AI mark.
