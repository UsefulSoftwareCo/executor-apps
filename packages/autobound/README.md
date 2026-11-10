# Autobound

Autobound's B2B sales intelligence: the Signal Database (company and contact signals such as SEC filings, news, hiring, social activity), ranked prospect and company insights, and AI-generated personalized outreach content. Tools are whatever Autobound's server exposes to the signed-in workspace; mutations and tools not marked read-only require approval.

**Interface:** Autobound's official remote MCP server, `https://mcp.autobound.ai/mcp` ([docs](https://autobound-api.readme.io/docs/autobounds-mcp)). Autobound publishes no OpenAPI document; the REST endpoints (`generate-insights`, `generate-content`) are documented only as prose.

**Auth**

- OAuth: sign in to Autobound and pick a workspace. The server publishes OAuth metadata with dynamic client registration, so no OAuth app has to be created. Scopes `signals:read` and `signals:write`. Executor's OAuth redirect URI is registered automatically.
- API key: create one at <https://signalapi.autobound.ai/integrations> and paste it; it is sent as a bearer token.

**Gaps:** the tool list is only visible with credentials, so the tool count could not be verified; the probe confirmed the server and its OAuth metadata. Usage consumes the workspace's Autobound credits.
