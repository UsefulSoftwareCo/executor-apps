# Bannerbear

Generate images, videos, PDFs and animations from templates with Bannerbear: image and animation templates and renders, batches, instant URLs, assets, the media tools (background removal, AI image and video, subtitles, video editing, PDF), workflows, webhooks and publications.

## Interface

OpenAPI 3.1, Bannerbear's official V5 document at https://api.bannerbear.com/v5/openapi.json, loaded live. Reads run as plain tools; every mutation requires approval. Bannerbear also offers a hosted OAuth MCP server (https://mcp.bannerbear.com/all); the REST API is used here because it needs no OAuth client registration.

## Auth

- API key: create a V5 key at https://app.bannerbear.com/v5/api_keys. It is sent as `Authorization: Bearer <key>`. Keys may be scoped (for example `images:write`); out-of-scope tools will fail with 403. V2 keys do not work with V5 endpoints.

Bannerbear supports OAuth only through its MCP server, so no OAuth app is offered.

## Known gaps

- The synchronous render host (`sync.api.bannerbear.com`, `POST /images`) is a second origin in the spec and is not used; renders are asynchronous, so poll `images.get` or use webhooks.
