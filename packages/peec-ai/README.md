# Peec AI

Covers Peec AI, the AI search analytics platform: brand, domain and URL visibility reports, sentiment, citations and sources, prompts, topics, tags, competitors, actions, project profile and members.

Interface: Peec AI's official Customer API OpenAPI 3.0 document at https://api.peec.ai/customer/v1/openapi/json (about 111 operations), mounted live. Peec also runs an official remote MCP server (https://api.peec.ai/mcp, 84 tools, OAuth with dynamic client registration or a personal access token); the Customer API was chosen because it exposes more operations and accepts a plain API key.

Auth: API key only. Create a company-scoped or project-scoped key at https://app.peec.ai/api-keys (prefer project-scoped). It is sent in the `X-API-Key` header. The Customer API documents no OAuth, so there is no OAuth option; the MCP server's OAuth is not used. The spec also declares BearerAuth (JWT) and an `api_key` query scheme, but https://docs.peec.ai/api/authentication documents only the API key, so Bearer is deliberately omitted.

Known gaps: write operations may require organization-owner access on the project. Every mutation requires approval. The framework classifies tools by HTTP method (only GET is a query), so 18 read-only POST operations (reports, source URL content, fanout queries, shopping/product reads, action list/detail/platforms) are overridden to queries by operationId and need no approval; `postActionsStatus` and `postActionsStepsCompletion` write data and stay gated.

Icon: the apple-touch-icon from the head of https://peec.ai (the vendor publishes no SVG we could fetch), converted to RGBA so the dark variant inverts the near-black container.
