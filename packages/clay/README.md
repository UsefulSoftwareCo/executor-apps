# Clay

Run Clay routines (single and batch), search people and companies, query workspace tables and workflow runs, check credit balance, and use Clay's hosted MCP server for company and contact research, enrichment providers and functions.

**Interfaces:** two, mounted under separate keys in one router.

- `api`: OpenAPI 3.1 from Clay's developer docs, https://developers.clay.com/openapi.json (server `https://api.clay.com/public/v0`). 16 operations, none skipped. Mutations ask for approval.
- `mcp`: Clay's official remote MCP server (streamable HTTP), `https://api.clay.com/v3/mcp`. Tools are whatever the server lists for the account; listing needs credentials, so no count is verified. Tools not marked read-only ask for approval.

**Auth:** one provider with two sign-in methods. Each sub-router mounts only for accounts that use its method, so an API key account exposes `api` and an OAuth account exposes `mcp`. Connect both to get both.

- API key (`apiKey`): create a personal key in Clay under Settings -> Account (API keys). It is sent in the `clay-api-key` header. The public API is beta and keys are tied to a user, so requests act as that user and spend that workspace's credits. Health check calls `GET /me`.
- OAuth (`oauth`): the MCP server publishes OAuth metadata (scope `mcp`) with dynamic client registration, so Executor registers its own client; no manual OAuth app is needed. The authorization request names the resource `https://api.clay.com/v3/mcp` (RFC 8707). The redirect URI is shown on the connect page. A third-party report says Clay's registration rejects client names impersonating known platforms; a manual connect has not yet confirmed Executor's client name is accepted. Health check only verifies the token reaches the MCP server.

**Known gaps:** the Clay API does not accept the OAuth token and the MCP server does not accept the API key, hence the split above. Clay's Enterprise People & Company API is a separate, unspecified product and is not covered. The icon is Clay's official 512px site icon (clay.com publishes no SVG).
