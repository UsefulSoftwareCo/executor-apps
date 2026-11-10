# UptimeRobot

Covers the UptimeRobot v3 API: monitors (create, pause, start, reset, bulk operations, uptime and response-time stats, dependency status), incidents and their comments, monitor groups, public status pages (PSPs) and announcements, maintenance windows, alert contacts, integrations, tags and the current user.

Interface: the vendor's official OpenAPI 3 document at https://cdn.uptimerobot.com/api/openapi.yaml (linked from https://uptimerobot.com/api/legacy/), served from `https://api.uptimerobot.com/v3`. Mutations require approval.

Auth: API key only. Create one in UptimeRobot under Integrations & API > API (the v3 key is sent as a bearer token). The hosted MCP server at `https://mcp.uptimerobot.com/mcp` supports OAuth but is not used.
Known gaps: the v2 (legacy) API and the unauthenticated Quick Monitor Setup API are not included.
