# DocsBot AI

Administer DocsBot AI from Executor: teams, team members, bots, training sources, question and conversation history, leads, webhooks, research jobs and statistics. Two interfaces are mounted, chosen by the auth method of the connected account.

**Interfaces:**
- API-key accounts use hand-written tools (`operations.ts`, 44 operations) over the documented Admin REST API at `https://docsbot.ai/api` (docs: https://docsbot.ai/documentation/developer/admin-api-overview). DocsBot publishes no OpenAPI document, so the tools take path ids (`teamId`, `botId`...) as strings, query parameters in `query` and JSON request bodies in `body`.
- OAuth accounts use DocsBot's official remote Admin MCP server, `https://mcp.docsbot.ai` (docs: https://docsbot.ai/documentation/developer/mcp-server). Its tool list is dynamic; the docs name tools such as `list_teams`, `list_bots`, `get_bot`, `create_bot` and `update_bot`, plus `list_tool_categories`, `search_tools` and `get_tool_schema`.

**Auth:**
- API key (`apiKey`): a user API key created at https://docsbot.ai/app/api (shown once; it carries the user's permissions across all teams), sent as `Authorization: Bearer <key>`.
- OAuth (`oauth`): the Admin MCP server publishes OAuth metadata and dynamic client registration (scope `admin`), so no OAuth app is created by hand. Authorized clients can be reviewed and revoked in the DocsBot dashboard. The redirect URI is Executor's standard OAuth callback and is registered automatically.

Hosts: `mcp.docsbot.ai` (MCP, authorize, token and register endpoints) and `docsbot.ai` (Admin REST API).

**Approvals:** REST mutations and every MCP tool not marked read-only require approval.

**Known gaps:** The Chat API on `api.docsbot.ai` (chat agent, semantic search, answer rating, conversation lead capture, summarize, ticket creation) is not mounted; it is bot-facing rather than admin. Per the MCP docs, semantic search lives only in the per-bot Documentation MCP (`api.docsbot.ai/teams/{teamId}/bots/{botId}/mcp/`, not mounted); the Admin MCP docs do not mention answer rating or lead creation, and offer file-based source operations. The REST tools cover signed upload URLs for sources (`sources.getUploadUrl`, `bots.getImageUploadUrl`). The Admin MCP excludes billing changes, credential entry and the skill builder. The Admin MCP's documentation does not list API keys as an option, so API-key accounts use the REST tools instead.
