# Sanity

Manage Sanity projects, datasets, schemas, documents, GROQ queries and releases through Sanity's official hosted MCP server.

- Interface: remote MCP server at https://mcp.sanity.io (docs: https://www.sanity.io/docs/ai/mcp-server). Tools are discovered live from the server; tools the server marks read-only (readOnlyHint) skip approval; the mutating tools named in the Sanity docs are also forced to mutation kinds.
- Auth, OAuth: dynamic client registration with PKCE, discovered from the server's metadata. No OAuth app needs to be created. Redirect URI is the one Executor shows when connecting.
- Auth, API token: create a token at https://www.sanity.io/manage (project, API, Tokens) and paste it. It is sent as a bearer token to mcp.sanity.io.
- Icon: Simple Icons "sanity".
- Gaps: this package exposes whatever the MCP server offers instead of the HTTP API. The GROQ HTTP API, which is per-project (`{projectId}.api.sanity.io`), is not wrapped.
