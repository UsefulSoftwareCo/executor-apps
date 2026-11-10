# VideoDB

Covers the VideoDB REST API: collections, videos, audio and images, upload by URL, transcription, spoken-word and scene indexes, semantic search, scene description, clips, streams and thumbnails, AI generation (image, video, audio, text, dubbing, translation), timelines and compilation, downloads, chat completions and billing usage.

Interface: the official OpenAPI 3 document at https://docs.videodb.io/openapi.json (120 tools, none skipped). Mutations require approval. VideoDB also runs a hosted MCP server (https://mcp.videodb.io/mcp); it is not mounted because the REST API is a superset for API-key use.

Auth: API key. Create one in the VideoDB Console (https://console.videodb.io, per the quickstart at https://docs.videodb.io/pages/getting-started/quickstart.md) and paste it as the account secret; it is sent in the `x-access-token` header to `api.videodb.io`. The health check calls `GET /user`. The OpenAPI document declares only the `ApiKeyAuth` scheme (apiKey in header `x-access-token`), so no OAuth method is offered here.

Known gaps: the websocket endpoint and file uploads from local disk are not usable through tools; upload from a URL or a signed upload URL instead. The staging server in the spec is not used.
