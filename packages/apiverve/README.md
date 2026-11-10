# APIVerve

Exposes APIVerve's catalog of ready-made lookup and utility APIs (372 per its docs: validation, geolocation, weather, currency, text, image and more) as tools. Every tool is read-only.

**Interface:** APIVerve's official hosted MCP server, `https://api.apiverve.com/v1/mcp` (docs: https://docs.apiverve.com/vervekit/mcp). Tools are generated from the live catalog, so new endpoints appear automatically. APIVerve publishes no OpenAPI document (only a Postman collection), so MCP is the interface with the most working tools. Calls spend credits on your APIVerve plan; each tool description lists its cost.

**Auth**
- API key: create one at https://dashboard.apiverve.com. It is sent in the `x-api-key` header. A scoped sub-key is a good choice.
- OAuth: the MCP server publishes OAuth metadata with dynamic client registration and PKCE (S256), so no OAuth app needs to be created by hand. Executor's redirect URI is registered automatically through dynamic registration.

**Gaps:** The VerveKit platform tools beyond the MCP catalog (JSON bins, mock endpoints, forms) and the REST-only batch and GraphQL endpoints are not exposed. The MCP probe confirms OAuth discovery; tool counts depend on the live catalog and could not be listed without credentials.
