# Imejis.io

Design templates and render images and PDFs (PNG, JPEG, WebP, PDF) with Imejis.io. OAuth accounts get Imejis's official remote MCP server (design authoring and rendering); API-key accounts get a single hand-written `render` tool.

- Interface: MCP, `https://api.imejis.io/api/mcp` (official; linked from the server card at https://www.imejis.io/.well-known/mcp/server-card.json). The vendor advertises 38 MCP tools (https://www.imejis.io/agents); the list was not enumerated because the server requires authentication. The official REST OpenAPI (`https://api.imejis.io/openapi.json`) has only 14 operations on `api.imejis.io` (OAuth bearer) plus render-host endpoints, so the much larger MCP surface is preferred. Render API docs: https://www.imejis.io/apis.
- OAuth: OAuth 2.0 (authorization code + PKCE) with dynamic client registration, discovered from the server's metadata (issuer `https://api.console.buildbase.app/org/69de35486f55ea877a8b95fc`). Scopes `read` and `write`. No user-created OAuth app is needed. Tools that are not read-only require approval.
- API key: a render key created at https://app.imejis.io (sent as the `dma-api-key` header to `render.imejis.io`). The MCP server does not accept it, so key accounts expose only `render` (POST `https://render.imejis.io/v1/{design_id}`, field overrides as JSON body, `delivery` hosted or signed so a URL is returned, never image bytes). It always requires approval. The key health check is a best-effort render-host request for an unknown design: it fails only when the host answers "Key not found" or 401, and was not run against a real key.

Known gaps: key accounts have no design-authoring or listing tools; stream delivery is not supported.
