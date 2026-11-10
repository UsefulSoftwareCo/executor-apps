# Moz

Moz SEO data (site metrics, links, keywords, rankings) and Moz Local (business locations and listings), through Moz's official remote MCP servers. Each product needs its own Moz subscription (Moz Data API, Moz Local); the tools mount under `data` and `local`, and a product you are not subscribed to simply fails to load without affecting the other.

**Interface:** MCP, from https://moz.com/api/docs (MCP server guide): `https://api.moz.com/mcp/v1/data` and `https://api.moz.com/mcp/v1/local`. Moz's JSON-RPC Data API v3 publishes no OpenAPI document, so the official MCP servers are the broadest official source. Tools requiring approval: every tool whose `readOnlyHint` is not true.

**Auth**
- API key: your Moz API key from https://moz.com/api/dashboard, sent as `Authorization: Bearer <key>`. The same key works on both endpoints.
- OAuth: the servers support dynamic client registration (scope `mcp`, PKCE S256), discovered from `https://api.moz.com`. Executor registers the client itself; no OAuth app to create, and the redirect URI is Executor's own.

**Health check:** Moz's servers accept any bearer string at `initialize` and `tools/list`, so the generic MCP check would pass for a bogus key. The account check instead makes one read-only `tools/call` (`DataGlobalTopDomainList` on `data`) and fails when the reply says "Missing or invalid authentication" (or the HTTP status is 401/403).

**Tools:** 67 in total: 32 under `data` (all `readOnlyHint: true`) and 35 under `local` (10 mutating tools, e.g. `LocalAccountCreate`, `LocalLocationCreate`, `LocalLocationClose`, require approval).

**Known gaps:**
- The header format (`Authorization: Bearer <key>`) and the key location (https://moz.com/api/dashboard) could not be confirmed against Moz's MCP guide (moz.com/api/docs was not fetchable); they follow API-key auth for Moz and Moz's own MCP behaviour. Confirm against the guide before relying on them.
- OAuth uses a single provider for both endpoints, which advertise different protected resources (`.../mcp/v1/data` and `.../mcp/v1/local`). The OAuth config sets `resource: null` so tokens are not bound to one endpoint; untested with a real account, so `local` may reject OAuth tokens if Moz enforces RFC 8707 binding.
