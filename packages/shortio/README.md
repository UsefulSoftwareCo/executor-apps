# Short.io

Create and manage Short.io branded short links: links (single, bulk, archive, expand, duplicate), domains and domain settings, tags, folders, QR codes, link bundles, link posts, geo targeting (country and region), link permissions, Open Graph overrides and the audit log.

## Interface

OpenAPI, from Short.io's official document at https://api.short.io/openapi.json (loaded live). Every mutation requires approval. Short.io also ships an official remote MCP at https://ai-assistant.short.io/mcp; it was considered but covers only create, search and analytics (no edit or delete), so OpenAPI was chosen.

## Auth

API key. Create one in the Short.io dashboard under Integrations & API (https://app.short.io/settings/integrations/api-key). A secret key scoped to a team or domain is required (public keys only work for the client-side POST /links/public endpoint and are not accepted here). A key scoped to one team or domain only lists and manages that scope. The key is sent as the raw `Authorization` header (no `Bearer` prefix). No OAuth is documented.

## Icon

Short.io's official app icon (its GitHub organisation avatar, 399px).

## Known gaps

Binary upload endpoints (QR logos, link bundle photos, cover images) may not be usable through JSON tools.

Two operations are skipped as `invalid_document`. The spec reuses several operationIds across different paths (for example createDebug, createBulk, deleteLink, createLink, listLink, getFolder), which is the likely cause; the exact two skipped were not identified.
