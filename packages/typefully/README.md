# Typefully

Draft, schedule and publish social posts with Typefully: the signed-in user, social sets, drafts, the publishing queue, tags, media uploads, comment threads and LinkedIn organization lookup.

## Interface

OpenAPI, from Typefully's official v2 document at https://api.typefully.com/v2/openapi.json (24 operations). Every mutation requires approval.

## Auth

- API key: create one in Typefully under Settings > API (https://typefully.com/settings/api) and paste it. It is sent as `Authorization: Bearer <key>` to `api.typefully.com`.
- OAuth: Typefully's public API documents only API keys, so no OAuth method is offered. (Its MCP server at https://mcp.typefully.com/mcp uses OAuth, but this package uses the REST API.)

The health check calls `GET /v2/me`.

## Known gaps

The legacy v1 API is not covered. Typefully's API terms restrict automated X posting; see the compliance notes in the OpenAPI description.
