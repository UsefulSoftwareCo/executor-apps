# Kontent.ai

Kontent.ai headless CMS through its Management API: content items and language variants (create, edit, publish, unpublish, schedule, change workflow step, new versions), content types, snippets, taxonomies, assets and asset folders, languages, collections, workflows, spaces, roles and webhooks. 69 tools; every mutation requires approval.

## Interface

Hand-written tools over the Management API v2, `https://manage.kontent.ai/v2/projects/{environmentId}` (docs: https://kontent.ai/learn/reference/management-api-v2/). Kontent.ai publishes no downloadable OpenAPI document, and its official MCP server (https://github.com/kontent-ai/mcp-server) has no hosted URL, only a self-run stdio or streamable-HTTP process, so neither could be mounted. The endpoint list is written from the vendor's API reference. List tools that paginate take a `continuation` input and return the next token as `continuation`. Write bodies are passed as `body` (patch tools take a JSON Patch array).

## Auth

- Management API key: in Kontent.ai open Environment settings, API keys, Management API, and create a key. Enter it together with the environment ID (Environment settings, General, shown as "Environment ID"). Keys are scoped to one environment, so connect each environment as its own account. Sent as `Authorization: Bearer <key>`. Use a read-only key to prevent writes.

Kontent.ai offers no OAuth flow for third-party apps.

## Known gaps

- Binary asset upload (`POST /files/{name}`) and asset creation from an uploaded file are not exposed.
- The Delivery REST/GraphQL APIs (published content with Delivery keys), the Subscription API and the Sync API are not covered.
- Bulk and search endpoints, validation and environment cloning are not covered.
- The icon is the K mark from the vendor's pinned-tab SVG (https://kontent.ai/img/favicon/safari-pinned-tab.svg).
