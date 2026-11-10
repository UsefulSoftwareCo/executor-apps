# Loops

Covers the Loops (loops.so) email platform: contacts and contact properties, events, transactional emails, campaigns, workflows and nodes, audience segments, lists, themes, components, uploads and sending-IP info.

Interface: OpenAPI, from Loops' official document at https://app.loops.so/openapi.json (API base `https://app.loops.so/api`). Tools are generated live from that document.

Auth: API key only. Create one in Loops under Settings > API (https://app.loops.so/settings?page=api). It is sent as a bearer token. Loops' REST API has no OAuth for user-created apps (the separate mcp.loops.so MCP server uses OAuth but is not used here). Health check calls `GET /v1/api-key`.

Known gaps: all mutations require approval. Only the OpenAPI-documented operations are exposed.
