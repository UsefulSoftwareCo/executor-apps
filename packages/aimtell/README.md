# AimTell

Manage Aimtell web push notifications: websites, one-off pushes, manual, triggered, RSS, welcome and API campaigns, segments, subscribers and attributes, opt-in prompts and conditions, pixels, permissions, website settings and keys, analytics, and logs.

## Interface

OpenAPI, from Aimtell's official REST reference at https://developers.aimtell.com/api-reference. Aimtell publishes no single document: the reference is built from five spec files (`openapi.json`, `misc-openapi.json`, `push-openapi.json`, `segments-openapi.json`, `sites-openapi.json` under `/api-reference/`), and `spec.ts` is a hand-merged snapshot of them, downloaded 2026-10-12 (82 operations, response examples stripped). The base URL is `https://api.aimtell.com`. Aimtell also runs an official remote MCP server (`https://mcp.aimtell.com/mcp`, 21 curated tools, API key as bearer token); the REST tools are used because they cover far more.

## Auth

- **API key**: sent in the `X-Authorization-Api-Key` header. Create it in the Aimtell dashboard under API Keys (Settings). Aimtell has no user-created OAuth apps. The introduction page and the spec's `securitySchemes` are authoritative for this header; the older per-operation curl samples for Get User and Update User use `X-Authorization: AUTH_TOKEN`, which is a stale header name. The header was not verified against a live key, since no credentials were used.

## Gaps

- Every mutation, including sending a push, asks for approval.
- `spec.ts` is a manual snapshot (no merge script); refresh it by hand if Aimtell adds endpoints.
- The icon is the vendor's SVG site favicon (`https://developers.aimtell.com/favicon.svg`, a three-leaf green mark), not the speech-bubble logo users see on aimtell.com; no vendor SVG of that logo is published and Simple Icons has no entry. Swap it if Aimtell publishes one.
