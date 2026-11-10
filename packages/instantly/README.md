# Instantly

Cold email outreach with Instantly: campaigns, leads and lead lists, sending accounts and warmup, unified inbox emails, analytics, block lists, webhooks and workspace management.

## Interface

OpenAPI. Instantly's official API v2 document, `https://developer.instantly.ai/api-reference/openapi.json`, compiled to 167 tools (100 mutations, none skipped). Requests go to `https://api.instantly.ai`. Mutations require approval.

## Auth

- API key: create one in Instantly under Settings > Integrations > API Keys (API v2 key, with the scopes you need). The key must include at least one of `workspaces:read`, `workspaces:all`, `all:read` or `all:all`, because the connection health check calls `GET /api/v2/workspaces/current`, which requires one of those scopes. A key without one fails the health check. It is sent as `Authorization: Bearer <key>`.

Instantly offers no OAuth for user-created apps, so only the API key is supported. Health check: `GET /api/v2/workspaces/current`.

## Gaps

None known. API v1 keys do not work with v2.
