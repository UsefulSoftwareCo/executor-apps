# BulkPublish

Publish and schedule social media posts to 15 platforms (Facebook, Instagram, X, TikTok, YouTube, Threads, Bluesky, Pinterest, LinkedIn and more) through BulkPublish: channels, posts, media, labels, inbox and analytics.

Interface: BulkPublish's official OpenAPI 3.1 document at https://app.bulkpublish.com/openapi.json (77 paths, 115 operations, all on https://app.bulkpublish.com). Tools are generated from it; every mutation requires approval.

Auth: API key. Create one in the BulkPublish dashboard under Settings > Developer (https://app.bulkpublish.com/developer). Keys start with `bp_` and are shown once. They are sent as `Authorization: Bearer bp_...`. The connection health check calls `GET /api/channels`.

Known gaps: BulkPublish also offers OAuth 2.0 (beta), but only for products embedding BulkPublish with an app registration and it cannot reach account administration, so it is not offered here. A hosted MCP server exists at https://mcp.bulkpublish.com/mcp; the OpenAPI document covers more, so it is not mounted.
