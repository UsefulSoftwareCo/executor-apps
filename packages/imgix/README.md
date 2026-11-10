# Imgix

Manage imgix from an agent: list, create and update Sources, browse and edit Asset Manager assets (metadata, add, refresh, publish, unpublish), run large-file upload sessions, purge cached assets, and read usage reports.

## Interface

Hand-written tools over the official imgix Management API (`https://api.imgix.com/api/v1`, JSON:API), documented at https://docs.imgix.com/en-US/apis/management/overview. imgix publishes no OpenAPI document, so the 18 tools are written by hand from those docs. Every mutation asks for approval.

## Auth

API key. Create it in the imgix dashboard under API Keys; it is sent as `Authorization: Bearer <key>`. Keys carry permissions (Sources, Purge, Asset Manager Browse/Edit, Analytics), and a tool only works when the key has the permission its endpoint needs. imgix has no user-created OAuth apps. The account health check lists Sources and only treats a 401 as a bad key.

## Known gaps

- The URL-based Rendering API (building `https://<source>.imgix.net/...?w=...` image URLs) is not a tool; it is unauthenticated URL construction.
- Direct small-file upload (`POST .../upload/<path>` with raw bytes) is not exposed because tools exchange JSON; use upload sessions, whose presigned URL the caller PUTs to.
- The imgix docs list some paths inconsistently between the endpoint tables and the prose or examples. For asset list/get (`sources/:id/assets` versus `assets/:id`) and publish/unpublish (`sources/:id/publish` versus `/publish` with `source_id` in the body) the table paths are used. Upload sessions follow the curl examples, which spell out every operation: `POST upload-sessions/create/<origin path>`, `POST upload-sessions/close/<session id>`, `GET upload-sessions/status/<session id>`, `DELETE upload-sessions/cancel/<session id>`; the table's bare `upload-sessions/:origin_path` and `:session_id` shapes are ambiguous with each other. Nothing has been tried against a live key. The reports `filter[completed]` parameter has no documented example.
- The icon is imgix's 180px docs app icon (no Simple Icons entry or official SVG was found).
