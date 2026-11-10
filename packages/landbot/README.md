# Landbot

Manage a Landbot workspace: customers and their conversations (send text, images, locations and WhatsApp templates, assign to agents or bots, archive, block), custom fields, channels, message hooks (webhooks), plus the bot builder and AI agents.

## Interface

OpenAPI, from Landbot's own documents on dev.landbot.io, all served from `api.landbot.io` and mounted under four keys:

- `platform`: https://dev.landbot.io/api-reference/platform/openapi.json (stable, base `/v1`)
- `bots`: https://dev.landbot.io/api-reference/bots-api/openapi.json (Bots API, v0-alpha: bots, drafts, blocks, versions, connected accounts)
- `aiAgents`: https://dev.landbot.io/api-reference/ai-agents-api/openapi.json (AI agents and knowledge sources, base `/v3`)
- `channels`: https://dev.landbot.io/api-reference/channels-api/openapi.json (channel reads and web chat design)

Landbot also runs an OAuth MCP server at https://mcp.landbot.io/mcp for bot building; it is not mounted because it requires OAuth sign-in (scopes for bots, agents, integrations and channels), and its tool list was not inspected. The Bots API is mounted instead.

## Auth

API key only. Landbot has no user-created OAuth apps for the REST API. Copy your agent token from https://app.landbot.io/gui/settings/account. It is sent as `Authorization: Token <token>` and carries the access of the agent that owns it. Rate limit is 10 requests per second.

## Gaps

- APIchat (`chat.landbot.io`) uses a different per-channel token and host and is not included.
- The Bots API is alpha and may change. The Bots API also lists bearer and session-cookie alternatives; only the agent token is used here. `catalog.getContract` (`GET /openapi.yml`) is mounted but returns the contract as YAML and was not exercised with a live token.
