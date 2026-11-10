# AgentLine

Phone service for AI agents: create agents, buy US phone numbers, place and hang up calls, read transcripts, list SMS messages, poll events, manage webhooks and check prepaid balance and usage.

**Interface:** OpenAPI, from the vendor's official document at https://api.agentline.cloud/openapi.json (docs: https://agentline.cloud/docs). All operations use `https://api.agentline.cloud`. The vendor also offers an MCP server at `/mcp`, which this package does not use because the REST API covers it. The `/v1/x402/*` endpoints (pay-per-request with crypto, no account) are exposed too but are not useful with an API key.

**Auth:** API key (`apiKey`). Sign in at https://agentline.cloud/dashboard and create a key (starts with `al_live_`); it is sent as `Authorization: Bearer`. Vendor OAuth exists only for its Claude.ai/MCP connect flow, so no `oauth2` method is offered.

**Gaps:** calls and numbers spend prepaid credit, so every mutation requires approval. Outbound SMS is not enabled by the vendor yet.
