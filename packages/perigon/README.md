# Perigon

News and web intelligence from Perigon: search articles and stories, companies, people, journalists, sources, topics, Wikipedia, vector search, summaries, refresh jobs, and manage monitors, contact points, watchlists and source groups. The official MCP server adds the `signal_insights_*` tools (workspace files, shell and Python execution, newsletter reads, event export).

Interface: two official sources, both mounted.
- OpenAPI, from Perigon's document at https://perigon.io/openapi.json (served as https://docs.perigon.io/openapi.json), compiled live against `https://api.perigon.io` (45 operations). Mounted under `api` for API-key accounts. Mutations require approval; so do the read-only `POST /v1/summarize`, `POST /v1/vector/*` and `POST /v1/articles/refresh/peek` searches, which are POST and therefore treated as mutations.
- Official remote MCP server, https://mcp.perigon.io/v1/mcp (source: https://github.com/goperigon/perigon-mcp-server, docs: https://perigon.io/docs/api/mcp). Mounted under `mcp` for API-key accounts. Every tool requires approval unless it is annotated `readOnlyHint: true`. Available tools depend on the key's scopes.

Auth:
- API key: create one in the Perigon dashboard (https://perigon.io, API keys section). It is sent as a bearer token to both the REST API and the MCP server. The health check calls the quota-exempt `/v1/limits`.
- OAuth: the MCP server publishes OAuth metadata at https://mcp.perigon.io/.well-known/oauth-authorization-server (authorization code with PKCE S256 and dynamic client registration), so the app uses `oauth2({ discover })` and no OAuth app needs to be created by hand. Perigon's web docs page only describes the API key; the OAuth flow is confirmed from the server's metadata. OAuth accounts get only the MCP tools: the token is documented for mcp.perigon.io, and it has not been verified against api.perigon.io, so the REST tools are not offered for it.

Known gaps: the API requires a paid or trial Perigon plan; some endpoints depend on plan entitlements.
