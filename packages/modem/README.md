# Modem

Modem turns customer conversations into structured topics, people and company insights. This package exposes two surfaces under one app: `api` (the public REST API: topics, people, companies, identities, channels, stories, `identify`, automations and automation templates) and `mcp` (Modem's hosted MCP server).

**Interface:** `api` loads Modem's official OpenAPI document live from https://api.modem.dev/v1/openapi.json (server `https://api.modem.dev/v1`). `mcp` uses the official remote MCP server at https://mcp.modem.dev/mcp (tools: https://modem.ai/docs/api/mcp-tools.md).

**Auth:**
- `api`: organization API key (`modem_...`), created in Modem under Settings -> API Keys (https://modem.ai/docs/api-reference/introduction.md) and sent as `Authorization: Bearer`. Treat it as a server-side credential.
- `mcp`: OAuth with dynamic client registration, discovered from the server (authorization server https://app.modem.dev/api/auth). No OAuth app needs to be created by hand. Scopes: `data:read`, `agent:invoke`, `offline_access`.

All REST mutations require approval; MCP tools require approval unless they are marked read-only.

**Known gaps:** The MCP server adds `search_modem` (natural-language search over customer feedback) and the `modem_agent_*` tools (invoke, get run, send message, cancel run), which have no REST equivalent. The two surfaces are separate accounts because they use different credentials. The separate ingest API at ingest.modem.dev is not included.
